## 已对齐的链路边界（基于现有代码）
- 前端路由：`/`（Home），`/rooms/:roomId`（Room）见 [router/index.ts](file:///Users/houyu/Desktop/my_project/echo-music/web/src/router/index.ts#L1-L28)
- Vite LAN 与代理：`host: 0.0.0.0`，`/api` 与 `/socket.io` 代理到 `http://localhost:3001` 见 [vite.config.ts](file:///Users/houyu/Desktop/my_project/echo-music/web/vite.config.ts#L32-L46)
- 后端关键端点（用于 Network 断言）：
  - `POST /api/rooms`、`POST /api/rooms/join`、`GET /api/rooms/:roomId/state`
  - `POST /api/rooms/:roomId/queue`、`POST /api/rooms/:roomId/admin/next`
  - `GET /api/songs/search`、`GET /api/songs/url`、`GET /api/songs/lyric`
  - Socket：`/socket.io` + `room:join` + `room:state`/`queue:update` 广播，见 [server/index.ts](file:///Users/houyu/Desktop/my_project/echo-music/server/src/index.ts#L80-L334)
- 现有 UI 可作为“文本锚点”的稳定文案：
  - Home：`Echo Music`、`创建新房间`、`加入房间`、`立即创建`、`加入派对` 见 [HomePage.vue](file:///Users/houyu/Desktop/my_project/echo-music/web/src/pages/HomePage.vue)
  - Room：房间码显示为 `#XXXXXX`，在线人数为 `N 在线` 见 [RoomHeader.vue](file:///Users/houyu/Desktop/my_project/echo-music/web/src/components/room/RoomHeader.vue#L52-L66)
  - 队列：`播放队列`、空态 `暂无歌曲` 见 [QueueList.vue](file:///Users/houyu/Desktop/my_project/echo-music/web/src/components/room/queue/QueueList.vue)
  - 点歌：`点歌台`、输入框 placeholder `搜索歌名、歌手...`、按钮 `搜索`，入队成功 toast `已加入队列` 见 [SongSearch.vue](file:///Users/houyu/Desktop/my_project/echo-music/web/src/components/room/search/SongSearch.vue)
  - 切歌按钮：`切歌` 见 [NowPlaying.vue](file:///Users/houyu/Desktop/my_project/echo-music/web/src/components/room/nowPlaying/NowPlaying.vue#L446-L455)

## 测试框架（要“可自动判定 + 可留证”）
- 新增一个可一键运行的 E2E Runner（同一次运行驱动 2 个页面：Host/Guest）
- 抽象通用断言与留证模块（所有用例复用）：
  - Console 断言：默认 `error=0`；可选白名单（例如 autoplay 相关的 `warn`）
  - Network 断言：聚合“关键请求”状态码与失败详情（4xx/5xx 必失败并输出 request 详情）
  - UI 断言：以 a11y snapshot 的文本出现/消失为主，必要时用脚本补齐“仅图标按钮”的点击
  - 失败留证：Host/Guest 各自输出：截图、a11y snapshot、最近 N 条 console、失败 network 的详情

## 为了长期稳定：补齐可测性（小改动，收益巨大）
- 目前多个关键交互是“仅图标无可访问名称”，自动化会非常脆弱（点歌结果的“+”、播放/暂停、队列投票等）。
- 计划在不改变业务逻辑的前提下，为以下元素补 `data-testid`（或 `aria-label`/`title`）：
  - Home：创建入口、加入入口、房间码输入、创建/加入提交按钮
  - RoomHeader：房间码文本、在线人数文本
  - SongSearch：搜索输入、搜索按钮、第一条结果的“添加”按钮（以及每条结果的添加按钮）
  - NowPlaying：播放/暂停按钮、切歌按钮、当前歌曲标题容器
  - Queue：队列容器、空态容器（可选），以及队列项投票按钮（可选）

## 用例落地（按你的验收口径逐条自动化）
1) 局域网可访问（单页冒烟）
- 打开 `http://<你的IP>:5173/`
- 断言出现：`Echo Music`、`创建新房间`、`加入房间`
- Console error=0

2) 创建房间（Host）
- 点击 `创建新房间` → 点击 `立即创建`
- 断言进入 `/rooms/:roomId`（或出现房间头部与 `播放队列`/`点歌台`）
- 读取并保存房间码（从 `#XXXXXX` 文本提取）

3) 加入房间（Guest）
- Page B 走 Home 的 `加入房间` 流程，填入房间码并加入
- 断言 Host/Guest 都出现 `2 在线`
- Network 断言包含 Socket 链路（至少出现 `/socket.io` 相关请求）

4) 点歌（搜索→加入队列→双端同步）
- Host：输入关键词 → 搜索 → 点击第一条结果的“添加”
- 断言 Host/Guest：队列里出现歌曲标题，且 `暂无歌曲` 消失
- Network 断言：`/api/songs/search`、`/api/rooms/:roomId/queue` 成功

5) 切歌（共享行为，双端同步）
- Host 先点两首歌
- 点击 `切歌`
- 断言 Host/Guest 的“Now Playing 标题”发生变化
- Network 断言：`/api/rooms/:roomId/admin/next` 成功

6) 播放/暂停（本地行为，分别验证每端）
- Host/Guest 各自执行：触发播放/暂停（Space 或按钮）
- 通过脚本读取 `document.querySelector('audio')?.paused` 断言状态翻转
- 允许：autoplay 被阻止产生 `warn` 或 toast（`点击播放按钮开始听歌`），但不允许 `console.error`

## 稳定性与回归（最小集）
- 第 3 个页面加入同房间：在线人数与队列同步
- Guest 刷新恢复：依赖 `localStorage echo_music_token` 见 [useRoomStore.ts](file:///Users/houyu/Desktop/my_project/echo-music/web/src/stores/useRoomStore.ts#L30-L83)
- 错误房间码：停留在 Home 并出现错误提示
- 长链路：连续点歌/切歌 5 次，Console 不增长 error，Network 不持续报错

## 为“0 Bug”自动化可持续：建议的去外部依赖策略（可选但强烈推荐）
- 当前播放链路依赖第三方音乐源，`/api/songs/url` 偶发 404/不可播会触发 `console.error("Failed to get play url")`（会直接打破 0 error 门槛）见 [NowPlaying.vue](file:///Users/houyu/Desktop/my_project/echo-music/web/src/components/room/nowPlaying/NowPlaying.vue#L74-L92)
- 方案：加入一个 `E2E/MOCK` 模式，让后端 `search/url/lyric` 返回稳定数据与可播 URL（例如由 server 静态托管一个小音频文件），把端到端测试从“外部服务可用性”中解耦。

## 产出（你确认后我会实现）
- 新增：E2E runner + 断言/留证工具（含 Host/Guest 双页驱动）
- 修改：补齐关键 UI 的可测性属性（`data-testid`/可访问名称），不改业务逻辑
- 可选：后端增加 MOCK 音乐源模式，保证测试稳定到 0 flaky

确认后我将开始落地上述改动与测试用例，并以一次完整跑通结果作为验收（含失败留证与 0 error/0 失败码断言）。