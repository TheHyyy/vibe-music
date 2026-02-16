import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createServer as createNetServer } from "node:net";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

const BASE_URL_ENV = process.env.ECHO_WEB_BASE_URL;
let baseUrl = BASE_URL_ENV || "http://localhost:5173";
const HEADLESS = (process.env.ECHO_HEADLESS || "1") !== "0";
const START_SERVERS = (process.env.ECHO_START_SERVERS || "0") === "1";
const ARTIFACT_ROOT =
  process.env.ECHO_ARTIFACT_DIR || path.join(repoRoot, "artifacts/e2e");
const RUN_ID = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .replace("Z", "");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function jsonStringifySafe(value) {
  return JSON.stringify(
    value,
    (_, v) => {
      if (typeof v === "bigint") return Number(v);
      return v;
    },
    2,
  );
}

async function waitForHttpOk(url, timeoutMs = 60_000) {
  const start = Date.now();
  let lastErr = null;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.ok) return;
    } catch (e) {
      lastErr = e;
    }
    await sleep(500);
  }
  throw new Error(
    `Timed out waiting for ${url}${lastErr ? ` (${lastErr.message})` : ""}`,
  );
}

async function canListen(port) {
  return await new Promise((resolve) => {
    const srv = createNetServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        srv.close(() => resolve(true));
      })
      .listen(port, "0.0.0.0");
  });
}

async function findFreePort(startPort, maxTries = 50) {
  for (let i = 0; i < maxTries; i++) {
    const port = startPort + i;
    if (await canListen(port)) return port;
  }
  throw new Error(`No free port found from ${startPort} (+${maxTries})`);
}

async function isEchoApiUp() {
  try {
    const res = await fetch("http://localhost:3001/api/songs/search?q=ping");
    if (!res.ok) return false;
    const body = await res.json().catch(() => null);
    return !!body && body.ok === true && Array.isArray(body.data);
  } catch {
    return false;
  }
}

async function detectApiMock() {
  try {
    const res = await fetch("http://localhost:3001/api/songs/search?q=Mock");
    if (!res.ok) return false;
    const body = await res.json().catch(() => null);
    if (!body || body.ok !== true || !Array.isArray(body.data)) return false;
    return body.data.some((s) => s && s.source === "MOCK");
  } catch {
    return false;
  }
}

async function isEchoWebUp(url) {
  try {
    const res = await fetch(url, { redirect: "manual" });
    if (!res.ok) return false;
    const html = await res.text();
    return html.includes("Echo Music");
  } catch {
    return false;
  }
}

function spawnDev(cmd, args, cwd, name, extraEnv = {}) {
  const child = spawn(cmd, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...extraEnv, FORCE_COLOR: "0" },
  });
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (d) => process.stdout.write(`[${name}] ${d}`));
  child.stderr.on("data", (d) => process.stderr.write(`[${name}] ${d}`));
  return child;
}

async function stopChild(child) {
  if (!child || child.killed) return;
  child.kill("SIGTERM");
  await sleep(300);
  if (!child.killed) child.kill("SIGKILL");
}

function createPageRecorder(label) {
  const state = {
    label,
    console: [],
    pageErrors: [],
    requests: [],
    responses: [],
    websockets: [],
  };
  return state;
}

function attachRecorders(page, state) {
  page.on("console", (msg) => {
    state.console.push({
      ts: Date.now(),
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    });
  });
  page.on("pageerror", (err) => {
    state.pageErrors.push({
      ts: Date.now(),
      message: String(err?.message || err),
    });
  });
  page.on("request", (req) => {
    state.requests.push({
      ts: Date.now(),
      url: req.url(),
      method: req.method(),
      resourceType: req.resourceType(),
      postData: req.postData(),
    });
  });
  page.on("response", async (res) => {
    const req = res.request();
    const record = {
      ts: Date.now(),
      url: res.url(),
      status: res.status(),
      statusText: res.statusText(),
      method: req.method(),
      resourceType: req.resourceType(),
      requestPostData: req.postData(),
      responseHeaders: res.headers(),
    };
    state.responses.push(record);
  });
  page.on("websocket", (ws) => {
    state.websockets.push({ ts: Date.now(), url: ws.url() });
  });
}

function normalizeUrlPath(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function pickFailures(state, { allowWarnPatterns = [] } = {}) {
  const consoleErrors = state.console.filter((c) => c.type === "error");
  const pageErrors = state.pageErrors;
  const warnViolations = state.console
    .filter((c) => c.type === "warning" || c.type === "warn")
    .filter((c) => {
      if (!allowWarnPatterns.length) return false;
      return !allowWarnPatterns.some((re) => re.test(c.text));
    });
  const httpFailures = state.responses.filter((r) => {
    const p = normalizeUrlPath(r.url);
    if (p.startsWith("/@") || p.startsWith("/src/")) return false;
    return r.status >= 400;
  });
  return { consoleErrors, pageErrors, warnViolations, httpFailures };
}

async function dumpArtifacts(runDir, page, state) {
  const pageDir = path.join(runDir, state.label);
  await ensureDir(pageDir);
  await page.screenshot({
    path: path.join(pageDir, "screenshot.png"),
    fullPage: true,
  });
  const a11y = await page.accessibility.snapshot({ interestingOnly: false });
  await fs.writeFile(
    path.join(pageDir, "a11y.json"),
    jsonStringifySafe(a11y),
    "utf8",
  );
  await fs.writeFile(
    path.join(pageDir, "console.json"),
    jsonStringifySafe(state.console),
    "utf8",
  );
  await fs.writeFile(
    path.join(pageDir, "pageerrors.json"),
    jsonStringifySafe(state.pageErrors),
    "utf8",
  );
  await fs.writeFile(
    path.join(pageDir, "network.responses.json"),
    jsonStringifySafe(state.responses),
    "utf8",
  );
  await fs.writeFile(
    path.join(pageDir, "network.websockets.json"),
    jsonStringifySafe(state.websockets),
    "utf8",
  );
  await fs.writeFile(
    path.join(pageDir, "meta.json"),
    jsonStringifySafe({ url: page.url() }),
    "utf8",
  );
}

async function locatorExists(locator) {
  try {
    return (await locator.count()) > 0;
  } catch {
    return false;
  }
}

async function clickCreateRoom(page) {
  const byTestId = page.getByTestId("home-create-card");
  if (await locatorExists(byTestId)) {
    await byTestId.click();
    return;
  }
  await page.getByRole("button", { name: "创建新房间" }).click();
}

async function clickJoinRoom(page) {
  const byTestId = page.getByTestId("home-join-card");
  if (await locatorExists(byTestId)) {
    await byTestId.click();
    return;
  }
  await page.getByRole("button", { name: "加入房间" }).click();
}

async function submitCreate(page) {
  const byTestId = page.getByTestId("home-create-submit");
  if (await locatorExists(byTestId)) {
    await byTestId.click();
    return;
  }
  await page.getByRole("button", { name: "立即创建" }).click();
}

async function fillJoinCode(page, code) {
  const byTestId = page.getByTestId("home-join-code");
  if (await locatorExists(byTestId)) {
    await byTestId.fill(code);
    return;
  }
  await page.getByPlaceholder("例如：X8K9M2").fill(code);
}

async function submitJoin(page) {
  const byTestId = page.getByTestId("home-join-submit");
  if (await locatorExists(byTestId)) {
    await byTestId.click();
    return;
  }
  await page.getByRole("button", { name: "加入派对" }).click();
}

async function getRoomCode(page) {
  const byTestId = page.getByTestId("room-code");
  if (await locatorExists(byTestId)) {
    const text = await byTestId.textContent();
    const m = String(text || "").match(/#([A-Z0-9_-]{6})/);
    if (!m) throw new Error(`Failed to parse room code from "${text}"`);
    return m[1];
  }
  const el = page.locator("text=/#[A-Z0-9_-]{6}/").first();
  const text = await el.textContent();
  const m = String(text || "").match(/#([A-Z0-9_-]{6})/);
  if (!m) throw new Error(`Failed to parse room code from "${text}"`);
  return m[1];
}

async function waitOnlineCount(page, expected) {
  const text = `${expected} 在线`;
  const byTestId = page.getByTestId("room-online-count");
  if (await locatorExists(byTestId)) {
    await byTestId.getByText(text).waitFor({ timeout: 30_000 });
    return;
  }
  await page.getByText(text).waitFor({ timeout: 30_000 });
}

async function searchAndAddResult(page, query, index) {
  const inputByTestId = page.getByTestId("song-search-input");
  const searchInput = (await locatorExists(inputByTestId))
    ? inputByTestId
    : page.getByPlaceholder("搜索歌名、歌手...");

  await searchInput.fill(query);

  const searchBtn = (await locatorExists(
    page.getByTestId("song-search-button"),
  ))
    ? page.getByTestId("song-search-button")
    : page.getByRole("button", { name: "搜索" });
  await searchBtn.click();

  const resultsByTestId = page.getByTestId("song-search-results");
  await resultsByTestId.waitFor({ timeout: 30_000 });

  const row = resultsByTestId.locator(":scope > div").nth(index);
  await row.waitFor({ timeout: 30_000 });
  await row.scrollIntoViewIfNeeded().catch(() => {});
  await row.hover().catch(() => {});

  const title =
    (
      await row.locator("div.min-w-0 div.truncate").first().textContent()
    )?.trim() || "";
  if (!title) throw new Error("Failed to read search result title");

  const addBtn = row.getByTestId("song-result-add");
  if (await locatorExists(addBtn)) {
    await addBtn.click({ force: true });
    return { title };
  }

  await row.locator("button").last().click({ force: true });
  return { title };
}

async function assertQueueHasTitle(page, title) {
  const queueList = page.getByTestId("queue-list");
  await queueList.getByText(title).waitFor({ timeout: 30_000 });
  await queueList
    .getByText("暂无歌曲")
    .waitFor({ state: "detached", timeout: 30_000 })
    .catch(() => {});
}

async function getNowPlayingTitle(page) {
  const byTestId = page.getByTestId("nowplaying-title");
  if (await locatorExists(byTestId))
    return (await byTestId.textContent())?.trim() || "";
  const h2 = page.locator("h2").filter({ hasText: /.+/ }).first();
  return (await h2.textContent())?.trim() || "";
}

async function waitNowPlayingTitle(page, expected) {
  const byTestId = page.getByTestId("nowplaying-title");
  if (await locatorExists(byTestId)) {
    await page.waitForFunction(
      (t) => {
        const el = document.querySelector('[data-testid="nowplaying-title"]');
        return !!el && String(el.textContent || "").includes(String(t));
      },
      expected,
      { timeout: 30_000 },
    );
    return;
  }
  await page.getByText(expected).waitFor({ timeout: 30_000 });
}

async function clickNext(page) {
  const byTestId = page.getByTestId("nowplaying-next");
  if (await locatorExists(byTestId)) {
    await byTestId.click();
    return;
  }
  await page.getByRole("button", { name: "切歌" }).click();
}

async function togglePlayBySpace(page) {
  await page.keyboard.press("Space");
}

async function togglePlay(page) {
  const btn = page.getByTestId("nowplaying-toggle-play");
  if (await locatorExists(btn)) {
    await btn.click({ force: true });
    return;
  }
  await togglePlayBySpace(page);
}

async function getAudioPaused(page) {
  return await page.evaluate(() => {
    const el = document.querySelector("audio");
    return el ? el.paused : null;
  });
}

async function waitAudioPausedFlip(page, before, timeoutMs = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const v = await getAudioPaused(page);
    if (v !== null && v !== before) return v;
    await page.waitForTimeout(100);
  }
  return await getAudioPaused(page);
}

function assertCriticalNetworkOk(states, criticalPaths) {
  const failures = [];
  for (const s of states) {
    for (const r of s.responses) {
      const p = normalizeUrlPath(r.url);
      if (!criticalPaths.some((cp) => p.includes(cp))) continue;
      if (r.status >= 400) failures.push({ page: s.label, ...r, path: p });
    }
  }
  if (failures.length) {
    const msg = failures
      .slice(0, 10)
      .map((f) => `${f.page} ${f.method} ${f.path} -> ${f.status}`)
      .join("\n");
    throw new Error(`Critical network failures:\n${msg}`);
  }
}

async function main() {
  const runDir = path.join(ARTIFACT_ROOT, RUN_ID);
  await ensureDir(runDir);

  const children = [];
  let browser = null;
  let hostPage = null;
  let guestPage = null;
  let hostState = null;
  let guestState = null;
  let apiMock = false;
  try {
    if (START_SERVERS) {
      const serverDir = path.join(repoRoot, "server");
      const webDir = path.join(repoRoot, "web");
      const musicProvider = process.env.ECHO_MUSIC_PROVIDER || "MOCK";
      if (!(await isEchoApiUp())) {
        children.push(
          spawnDev("npm", ["run", "dev"], serverDir, "server", {
            ECHO_MUSIC_PROVIDER: musicProvider,
          }),
        );
        await waitForHttpOk(
          "http://localhost:3001/api/songs/search?q=ping",
          60_000,
        );
      }
      apiMock = await detectApiMock();

      if (!BASE_URL_ENV) {
        const port = await findFreePort(5173, 50);
        baseUrl = `http://localhost:${port}`;
      }

      if (!(await isEchoWebUp(`${baseUrl}/`))) {
        const webPort = Number(new URL(baseUrl).port || 5173);
        children.push(
          spawnDev(
            "npm",
            [
              "run",
              "dev",
              "--",
              "--port",
              String(webPort),
              "--strictPort",
              "--host",
              "0.0.0.0",
            ],
            webDir,
            "web",
          ),
        );
        await waitForHttpOk(`${baseUrl}/`, 60_000);
      }
    }
    if (!apiMock) apiMock = await detectApiMock();

    const launchOpts = { headless: HEADLESS };
    const channel = process.env.PW_CHANNEL || "chrome";
    try {
      browser = await chromium.launch({ ...launchOpts, channel });
    } catch {
      browser = await chromium.launch(launchOpts);
    }

    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    await hostContext.addInitScript(() => localStorage.clear());
    await guestContext.addInitScript(() => localStorage.clear());

    hostPage = await hostContext.newPage();
    guestPage = await guestContext.newPage();

    hostState = createPageRecorder("host");
    guestState = createPageRecorder("guest");
    attachRecorders(hostPage, hostState);
    attachRecorders(guestPage, guestState);

    await hostPage.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await hostPage
      .getByRole("heading", { name: "Echo Music" })
      .waitFor({ timeout: 30_000 });
    await hostPage
      .getByRole("button", { name: "创建新房间" })
      .waitFor({ timeout: 30_000 });
    await hostPage;

    await clickCreateRoom(hostPage);
    await submitCreate(hostPage);
    await hostPage.getByText("播放队列").waitFor({ timeout: 30_000 });
    await hostPage.getByText("点歌台").waitFor({ timeout: 30_000 });

    const roomCode = await getRoomCode(hostPage);

    await guestPage.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await guestPage
      .getByRole("heading", { name: "Echo Music" })
      .waitFor({ timeout: 30_000 });
    await clickJoinRoom(guestPage);
    await fillJoinCode(guestPage, roomCode);
    await submitJoin(guestPage);

    await Promise.all([
      waitOnlineCount(hostPage, 2),
      waitOnlineCount(guestPage, 2),
    ]);

    const initialHost = await getNowPlayingTitle(hostPage);
    const initialGuest = await getNowPlayingTitle(guestPage);

    const q1 = process.env.ECHO_QUERY_1 || (apiMock ? "Mock" : "周杰伦");
    const q2 = process.env.ECHO_QUERY_2 || (apiMock ? q1 : "林俊杰");
    const secondIndex = apiMock ? 1 : 0;

    const first = await searchAndAddResult(hostPage, q1, 0);
    await Promise.all([
      waitNowPlayingTitle(hostPage, first.title),
      waitNowPlayingTitle(guestPage, first.title),
    ]);

    const second = await searchAndAddResult(hostPage, q2, secondIndex);
    await Promise.all([
      assertQueueHasTitle(hostPage, second.title),
      assertQueueHasTitle(guestPage, second.title),
    ]);

    await clickNext(hostPage);
    await Promise.all([
      waitNowPlayingTitle(hostPage, second.title),
      waitNowPlayingTitle(guestPage, second.title),
    ]);

    const afterHost = await getNowPlayingTitle(hostPage);
    const afterGuest = await getNowPlayingTitle(guestPage);

    const pausedBeforeHost = await getAudioPaused(hostPage);
    if (pausedBeforeHost === null)
      throw new Error("Host audio element not found");
    await togglePlay(hostPage);
    const pausedAfterHost = await waitAudioPausedFlip(
      hostPage,
      pausedBeforeHost,
    );
    if (pausedAfterHost === null)
      throw new Error("Host audio element not found after toggle");

    if (
      pausedBeforeHost !== null &&
      pausedAfterHost !== null &&
      pausedBeforeHost === pausedAfterHost
    ) {
      throw new Error("Host audio paused state did not toggle");
    }

    const pausedBeforeGuest = await getAudioPaused(guestPage);
    if (pausedBeforeGuest === null)
      throw new Error("Guest audio element not found");
    await togglePlay(guestPage);
    const pausedAfterGuest = await waitAudioPausedFlip(
      guestPage,
      pausedBeforeGuest,
    );
    if (pausedAfterGuest === null)
      throw new Error("Guest audio element not found after toggle");

    if (
      pausedBeforeGuest !== null &&
      pausedAfterGuest !== null &&
      pausedBeforeGuest === pausedAfterGuest
    ) {
      throw new Error("Guest audio paused state did not toggle");
    }

    const allowWarnPatterns = [
      /Auto play failed:/i,
      /The play\\(\\) request was interrupted/i,
      /The play\\(\\) request was interrupted by a call to pause/i,
    ];

    const hostFailures = pickFailures(hostState, { allowWarnPatterns });
    const guestFailures = pickFailures(guestState, { allowWarnPatterns });

    if (hostFailures.consoleErrors.length || hostFailures.pageErrors.length) {
      throw new Error("Host has console errors/page errors");
    }
    if (guestFailures.consoleErrors.length || guestFailures.pageErrors.length) {
      throw new Error("Guest has console errors/page errors");
    }

    assertCriticalNetworkOk(
      [hostState, guestState],
      [
        "/api/rooms",
        "/api/rooms/join",
        "/api/songs/search",
        "/api/rooms/",
        "/api/songs/url",
        "/socket.io",
      ],
    );

    await fs.writeFile(
      path.join(runDir, "summary.json"),
      jsonStringifySafe({
        baseUrl,
        roomCode,
        nowPlaying: {
          initialHost,
          initialGuest,
          first: first.title,
          second: second.title,
          afterHost,
          afterGuest,
        },
        audio: {
          host: { pausedBeforeHost, pausedAfterHost },
          guest: { pausedBeforeGuest, pausedAfterGuest },
        },
      }),
      "utf8",
    );

    await browser.close();
    browser = null;
    await stopChild(children[0]);
    await stopChild(children[1]);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    const failDir = path.join(ARTIFACT_ROOT, `${RUN_ID}_FAIL`);
    await ensureDir(failDir).catch(() => {});
    try {
      if (hostPage && hostState) {
        await dumpArtifacts(failDir, hostPage, hostState);
      }
      if (guestPage && guestState) {
        await dumpArtifacts(failDir, guestPage, guestState);
      }
    } catch {
      void 0;
    }
    await fs
      .writeFile(
        path.join(failDir, "error.txt"),
        `${err.stack || err.message}\n`,
        "utf8",
      )
      .catch(() => {});
    if (browser) await browser.close().catch(() => {});
    for (const c of children) await stopChild(c);
    throw err;
  }
}

await main();
