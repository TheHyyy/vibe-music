# 修复与优化计划

针对您提出的“点歌闪烁”问题和“VIP 歌曲 Token 配置”需求，以及系统潜在 Bug 的检查，制定以下实施计划：

## 1. 修复点歌体验 (UI 闪烁/延迟)
**问题分析**：当前点歌后，搜索结果立即清空，而队列更新依赖 Socket 推送，存在网络延迟，导致视觉上歌曲“先消失再出现”。
**修复方案**：引入**乐观更新 (Optimistic UI)** 机制。
1.  在 `useRoomStore` 中新增 `addOptimisticQueueItem` Action。
2.  在用户点击添加时，立即在本地队列中插入一个带有 `pending` 状态的临时 Item。
3.  当后端 Socket 消息到达时，自动替换或合并该临时 Item，实现无缝过渡。
4.  优化 `SongSearch.vue` 交互，点歌成功后不强制清空搜索结果，改为将按钮状态置为“已添加”，提升连续点歌体验。

## 2. 支持 VIP 歌曲 (Token 配置)
**问题分析**：缺少 Token 配置导致无法播放完整 VIP 歌曲。
**实施步骤**：
1.  **QQ 音乐**：修改 `server/src/music/qq.ts`，初始化时读取 `QQ_COOKIE` 环境变量并注入 `qq-music-api`。
2.  **网易云音乐**：确认 `server/src/music/netease.ts` 已正确读取 `NETEASE_COOKIE`。
3.  **环境配置**：
    *   更新 `server/.env.example` 模板，添加 `NETEASE_COOKIE` 和 `QQ_COOKIE` 说明。
    *   创建或更新 `server/.env` 文件，为您预留填写的空位。

## 3. 系统稳定性与 Bug 检查
**潜在风险**：后端广播机制可能存在性能隐患或竞态条件。
**优化措施**：
1.  **广播优化**：检查 `server/src/index.ts` 中的 `broadcastRoomState`，避免在非必要时（如仅队列变化）进行全量、高开销的广播。
2.  **错误处理**：增强音乐搜索/播放接口的错误捕获，防止单个源失败导致整个搜索崩溃。
