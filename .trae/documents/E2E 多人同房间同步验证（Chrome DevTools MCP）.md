## 前置侦测与隔离策略
- 打开 3 个页面分别作为 Host / GuestA / GuestB。
- 为了确保 localStorage 真隔离（避免 token 串号），使用不同 Origin：
  - Host：`http://localhost:5173`
  - GuestA：`http://127.0.0.1:5173`
  - GuestB：`http://lvh.me:5173`（解析到 127.0.0.1）
- 每个 Guest 首次加载后立即执行：`localStorage.clear(); sessionStorage.clear();` 并刷新一次，确保“访客初始无 token”。
- 若页面实际端口不是 5173：在任一页用 Network/Console 自动发现真实地址（从 document.location / 首个 document 请求 URL 推断），然后按同样思路换成不同 hostname。

## 统一证据采集（每步动作后必须三端对比）
- 为每个页面建立“采集函数”，通过页面内脚本一次性返回：
  - UI：
    - nowPlaying 标题：`[data-testid="nowplaying-title"]`
    - 队列长度与前 5 条：`[data-testid="queue-item"]` 文本（title/artist/score）
    - 在线人数：`[data-testid="room-online-count"]` + 成员列表前 5 条（从“在线成员”卡片内 `MemberItem` DOM 文本提取）
    - 房间邀请码：`[data-testid="room-code"]`
  - Runtime：`document.querySelector('audio')?.currentTime/paused/src`
- Network：
  - 列出并抓取关键请求：`/api/rooms`、`/api/rooms/join`、`/api/rooms/:roomId/state`、`/api/rooms/:roomId/queue`、`/api/songs/search`、`/api/songs/:id/play-url`。
  - 抓取 Socket.IO：
    - 优先从 DevTools Network 的 websocket 请求里读取 frames/messages（若工具可见）。
    - 若 frames 不可见：在页面内临时 monkeypatch `WebSocket.prototype.send` + `message` 监听，把原始 payload 记录到 `window.__wsLog`；并额外记录“业务层已生效”的关键状态（members/queue/playback）作为对照证据。

## 建立房间与加入流程（记录 roomId 与链接）
1. Host 访问首页，点击创建房间（触发 `POST /api/rooms`）。
2. 从 Host 地址栏得到 `/rooms/:roomId`，记录 roomId 与完整链接。
3. GuestA/GuestB 打开各自 origin 下的同一 `/rooms/:roomId`。
4. 若出现“加入房间/昵称”弹窗：输入各自昵称并加入（触发 `GET /api/rooms/:roomId/public` + `POST /api/rooms/join` + ws `room:join` ack）。
5. 加入成功后，立即做一次三端对比快照。

## 用例 A：在线成员正确性
- A1 加入 +1：GuestA 加入后 1s 内三端在线人数一致且 +1（抓 `room:state` 推送/或成员 UI 同步）。
- A2 退出 -1：关闭 GuestA 标签页，1s 内三端人数 -1；重复 GuestB。
- A3 反复 5 次：同一 Guest 重复进入/关闭 5 次；每次采集三端快照并比对成员列表，断言：无重复 id/昵称、人数回落、无幽灵成员。

## 用例 B：点歌与队列一致性（含并发）
- B1 Host 点 1 首：Host 在点歌台搜索（`[data-testid="song-search-input"]`）并添加第一首（`[data-testid="song-result-add"]`），断言三端队列与 nowPlaying 一致；抓 `/api/songs/search`、`POST /api/rooms/:roomId/queue`、`queue:update/room:state`。
- B2 GuestA 再点 1 首：同上，断言三端一致。
- B3 并发各点 2 首：Host/GuestA/GuestB 分别选定 2 首歌，通过“定时触发”在同一绝对时间点（Date.now()+1500ms）在各端连续点击添加，模拟并发；断言：
  - 队列不丢不重（以 song.id/title 去重校验）
  - 顺序三端一致（按 UI 前 5 条比对 + 全量长度一致）
  - 如出现临时 temp- item：等待后端广播完成后最终一致。

## 用例 C：播放同步（暂停/恢复/拖动）
- 前置：确保 nowPlaying 存在且 Host 有权限按钮可见（`data-testid="nowplaying-toggle-play"`）。
- C1 播放/暂停/恢复各 3 次：Host 点击播放/暂停按钮；每次动作后等待 1s，采集三端 audio runtime：
  - 播放中：`abs(guestCurrentTime - hostCurrentTime) <= 2.0s`
  - 暂停中：`abs(guestCurrentTime - hostCurrentTime) <= 0.5s` 且 `paused` 一致。
- C2 拖动 seek 各 3 次：Host 直接用脚本设置 `audio.currentTime = target`（例如 10%、50%、80%）并等待 `seeked` 事件触发同步；1s 内断言 Guest 漂移阈值同上。
- 同步证据：抓 `player:update` 发出与 `player:sync` 到达（或 ws raw payload）+ 三端 audio runtime 对照。

## 用例 D：切歌同步
- D1 Host 点击“切歌”（`data-testid="nowplaying-next"`）3 次：每次 1s 内断言三端 nowPlaying title 一致切换、队列长度 -1（或 nowPlaying 从队列弹出）。
- D2 队列清空后的切歌：把队列点到空，再点切歌，断言：不报错（Console 无 error）、三端 UI 回到“暂无播放/等待点歌...”，audio.src 为空或保持一致。

## 用例 E：权限与异常
- E1 Guest 权限：Guest 尝试点击播放/暂停/切歌（按钮应不存在或不可触发）；即使通过脚本触发 click，也不应产生全房间 `player:sync` 或 nowPlaying 变化。证据：Host 的 network/ws 日志无对应事件、Host UI 不变。
- E2 autoplay/URL 失败区分：
  - 观察 Console 是否出现 `Auto play failed`；若出现，记录为“听感无法自动播放”但同步状态仍应一致（paused/targetTime）。
  - 若 `getPlayUrl` 失败（`/api/songs/:id/play-url` 非 2xx 或 error），记录三端响应差异与 UI 提示“无法播放该歌曲”，并判定是否导致同步状态不一致。

## 用例 F：并发与弱网/断网恢复
- F1 高延迟：对 GuestA 开启 Network Throttling（Slow 3G/高延迟）30s，期间 Host 连续执行：点歌 1 首 + 暂停/恢复 1 次 + 切歌 1 次；恢复网络后断言 GuestA 1s~5s 内追上：members/queue/nowPlaying/playback 最终一致，且不会频繁回跳。
- F2 离线再恢复：对 GuestB 设置 Offline 30s，再恢复；断言：
  - 在线成员先 -1 后 +1（或重连后恢复）
  - 重新收到 `room:state` 并恢复一致。

## 用例 G：多标签页同用户
- G1 同 origin 双标签：在 Host 同一 origin 再开一个 `/rooms/:roomId` 标签页（共享 token/userId）。
- G2 关闭其一：关闭其中一个标签页，断言剩余标签页仍在 members 列表中，在线人数不应错误 -1 或出现幽灵/抖动。
- 若失败：输出最短复现步骤 + 对应 ws/HTTP 证据，推断服务端是否“每 userId 只允许单 socket”或 disconnect 处理未考虑多连接。

## 输出与深挖策略（按用户要求格式）
- 每个用例都按：用例编号 → 步骤 → 断言 → 证据（截图/Network 摘录/ws 摘录/三端 runtime 对比表）→ 结论 Pass/Fail → 最短复现路径 → 可能原因（基于证据）输出。
- 任一 Fail：立刻追加定位：
  - 对应 HTTP 响应是否正确、是否被 401
  - ws 是否收到 `room:state/queue:update/player:sync`
  - 前端 DOM 是否更新但 audio 状态没跟上（autoplay/权限/事件顺序）
  - 再给下一步验证动作（比如抓更细的 ws raw payload 或强制触发 state reload）。