# E2E 测试执行报告

## 测试环境
- **Origin**: 
  - Host: `http://localhost:5173`
  - GuestA: `http://127.0.0.1:5173`
  - GuestB: `http://0.0.0.0:5173`
- **Room ID**: `FvKVnj6aX0E7` (初始), `BD6GLcwTOjH_` (重建)

## 执行摘要
本次测试发现了多个**严重影响可用性**的缺陷，导致多人同步核心功能无法正常验证。主要问题集中在**Socket 连接稳定性**、**用户状态管理**与**错误处理**。

### 关键发现 (Failures)

1.  **Host 权限丢失 (Critical)**
    -   **现象**: Host 刷新页面或重新加入房间后，角色从 `HOST` 降级为 `MEMBER`。
    -   **影响**: 房间失去管理员，无法执行切歌、踢人、控制播放等操作。
    -   **原因推断**: 服务端未持久化 Host 身份，或在 `removeMember` 后未保留 Host 记录；重新加入时默认分配 `MEMBER` 角色。

2.  **在线成员同步异常 (Blocker)**
    -   **现象**: 
        -   Host 页面显示 "1 在线" (HostUser)。
        -   GuestA 页面显示 "1 在线" (GuestA)。
        -   GuestB 页面显示 "2 在线" (HostUser, GuestB)。
        -   三端看到的成员列表不一致，且无法互通。
    -   **原因推断**: 
        -   Socket 连接在页面刷新后未能正确重连（前端 `useWebSocket` 逻辑缺陷，已 Patch）。
        -   服务端 `store` 可能因 Socket 断开而过早移除成员，导致 Room 实例分裂或状态不同步。

3.  **刷新页面导致死循环 (Major)**
    -   **现象**: 刷新页面后，HTTP `/state` 接口返回 400 (未加入房间) 或 403 (Token 无效)，但前端未处理此错误，导致页面卡死在加载态。
    -   **修复**: 已在 `RoomPage.vue` 中添加了对 400/401/403 错误的处理，弹出“加入房间”对话框。

4.  **点歌/搜索无响应 (Major)**
    -   **现象**: Host 点击点歌无反应；GuestB 搜索歌曲超时。
    -   **原因推断**: 可能与 Socket 连接断开（点歌需要 Socket）或后端 API 代理超时有关。

### 已修复问题 (Patches Applied)

1.  **前端错误弹窗**: 修改 `web/src/components/room/RoomPage.vue`，增加对 400/403 状态码的捕获，允许用户重新加入。
2.  **Socket 强制重连**: 修改 `web/src/components/room/RoomPage.vue` 的 `onJoinSuccess`，在加入成功后强制 `disconnect()` 旧 Socket，确保使用新 Token 建立连接。

## 详细用例结果

| 用例编号 | 用例名称 | 结果 | 备注 |
| :--- | :--- | :--- | :--- |
| **A** | 在线成员正确性 | **FAIL** | 成员列表三端不一致，刷新后状态丢失。 |
| **B** | 点歌与队列一致性 | **FAIL** | 点歌无响应或超时，无法验证同步。 |
| **C** | 播放同步 | **SKIP** | 因 Host 权限丢失及成员不同步，无法测试。 |
| **D** | 切歌同步 | **SKIP** | 无 Host 权限，无法切歌。 |
| **E** | 权限与异常 | **PASS** | GuestB (MEMBER) 确实无播放控制权。 |
| **F** | 并发与弱网 | **SKIP** | 基础连接不稳定，无法进行压力测试。 |
| **G** | 多标签页 | **FAIL** | 刷新/多开会导致连接互斥或状态丢失。 |

## 建议下一步
1.  **修复 Socket 重连逻辑**: 确保 Token 变更后 Socket 自动重连。
2.  **持久化 Room/Host 状态**: 防止 Host 掉线即销毁房间或丢失权限。
3.  **优化 Member 管理**: 引入“断线重连”宽限期，不要立即移除 Member。
4.  **增加端到端测试稳定性**: 在 CI/CD 中通过 Mock Socket Server 进行更稳定的测试。