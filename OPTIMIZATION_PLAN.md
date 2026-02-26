# Vibe Music 优化计划

> 扫描时间：2026-02-26
> 项目规模：约 7,893 行代码（前端 + 后端）
> 当前状态：可运行的 MVP，但存在 Bug 和工程化不足

---

## 一、核心问题修复

### 1.1 🔴 播放完歌曲后多跳一首（高优先级）

**问题描述**：歌曲播放结束后，有时会连续跳过两首（播放下一首的下一首）

**根因分析**：
1. `NowPlaying.vue` 的 `onEnded` 事件可能被多次触发
2. 后端 `/api/rooms/:roomId/ended` 接口和 `room:join` socket 事件都可能触发 auto-play
3. `broadcastRoomState` 在多处被调用，可能导致前端多次处理状态更新

**修复方案**：
```
文件：server/src/index.ts
- 在 /ended 接口中增加幂等性检查（已有 songId 检查，需加强）
- 确保 nextSong 和 auto-play 不会同时触发

文件：web/src/components/room/nowPlaying/NowPlaying.vue
- 加强 onEnded 的防抖机制（当前 5 秒可能不够）
- 增加状态锁，防止重复调用 reportEnded
```

### 1.2 🟡 502 错误（部署问题）

**问题描述**：服务器部署后访问返回 502

**可能原因**：
1. 腾讯云安全组未开放端口
2. 服务监听配置问题

**修复方案**：
- 确认安全组配置
- 检查服务启动日志

---

## 二、开源项目标准化

### 2.1 文档完善

| 文件 | 内容 | 优先级 |
|------|------|--------|
| `README.md` | 项目介绍、功能列表、快速开始、截图/GIF | 🔴 高 |
| `CONTRIBUTING.md` | 贡献指南、开发环境搭建 | 🟡 中 |
| `LICENSE` | 开源许可证（推荐 MIT） | 🔴 高 |
| `CHANGELOG.md` | 版本变更记录 | 🟡 中 |
| `CODE_OF_CONDUCT.md` | 行为准则 | 🟢 低 |

### 2.2 README.md 建议结构

```markdown
# Vibe Music 🎵

一句话描述：多人实时音乐房间 - 和朋友一起听歌、聊天、投票

## ✨ 特性
- 🎵 多音乐源支持（网易云、QQ音乐、咪咕）
- 👥 实时同步播放
- 🗳️ 投票切歌
- 💬 房间聊天
- 📱 移动端适配

## 📸 截图
（放 2-3 张精美截图）

## 🚀 快速开始
### 本地开发
### Docker 部署

## 🛠️ 技术栈
## 🤝 贡献
## 📄 License
```

### 2.3 项目配置文件

| 文件 | 用途 |
|------|------|
| `.github/ISSUE_TEMPLATE/` | Issue 模板 |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR 模板 |
| `.github/workflows/ci.yml` | CI/CD 配置 |
| `codecov.yml` | 代码覆盖率配置 |
| `renovate.json` | 依赖自动更新 |

---

## 三、代码质量提升

### 3.1 后端优化

| 问题 | 解决方案 |
|------|----------|
| 缺少类型定义的 `@types/crypto-js` | 添加 `@types/crypto-js` 依赖 |
| 内存存储房间数据 | 考虑添加 Redis 持久化（可选） |
| 缺少请求日志 | 添加 morgan 或 pino 日志中间件 |
| 缺少错误处理中间件 | 统一错误处理 |
| 缺少 API 文档 | 添加 Swagger/OpenAPI |

### 3.2 前端优化

| 问题 | 解决方案 |
|------|----------|
| 状态管理可优化 | useRoomStore 结构已不错，可增加持久化 |
| 缺少单元测试 | 添加 Vitest + Testing Library |
| 缺少 E2E 测试 | 已有 Playwright，需完善测试用例 |
| 组件可拆分 | 部分大组件可进一步拆分 |

### 3.3 代码规范

```json
// 建议添加的配置
{
  "scripts": {
    "lint": "eslint . --ext .ts,.vue",
    "lint:fix": "eslint . --ext .ts,.vue --fix",
    "format": "prettier --write .",
    "typecheck": "vue-tsc --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

---

## 四、功能增强建议

### 4.1 核心功能（推荐）

| 功能 | 描述 | 复杂度 |
|------|------|--------|
| 房间密码保护 | 已实现，需测试 | ✅ |
| 播放历史记录 | 已实现，可增强 UI | ✅ |
| 收藏功能 | 已实现，可增加同步 | 🟡 |
| 歌词同步显示 | 已实现 | ✅ |
| 房间邀请链接 | 已有 inviteToken，需 UI | 🟡 |

### 4.2 增强功能（可选）

| 功能 | 描述 | 复杂度 |
|------|------|--------|
| 用户系统 | 登录/注册/个人资料 | 🔴 高 |
| 歌单功能 | 创建/保存/分享歌单 | 🔴 高 |
| 移动端 App | React Native / Flutter | 🔴 高 |
| AI 推荐 | 基于历史智能推荐 | 🟡 中 |

---

## 五、执行计划

### Phase 1：Bug 修复（1-2 天）
- [ ] 修复播放跳歌问题
- [ ] 修复部署 502 问题
- [ ] 修复其他已知 Bug

### Phase 2：开源标准化（1 天）
- [ ] 重写 README.md
- [ ] 添加 LICENSE
- [ ] 添加贡献指南
- [ ] 配置 GitHub Actions CI

### Phase 3：代码质量（2-3 天）
- [ ] 添加 ESLint/Prettier 配置
- [ ] 添加单元测试框架
- [ ] 完善类型定义
- [ ] 代码重构（大组件拆分）

### Phase 4：功能完善（按需）
- [ ] 完善测试用例
- [ ] 优化 UI/UX
- [ ] 添加更多音乐源

---

## 六、文件结构建议

```
vibe-music/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       └── ci.yml
├── web/                    # 前端
│   ├── src/
│   │   ├── api/           # API 调用
│   │   ├── components/    # 组件
│   │   ├── composables/   # 组合式函数
│   │   ├── hooks/         # 自定义 hooks
│   │   ├── lib/           # 工具库
│   │   ├── pages/         # 页面
│   │   ├── router/        # 路由
│   │   ├── stores/        # 状态管理
│   │   └── types/         # 类型定义
│   ├── tests/             # 测试文件
│   └── ...
├── server/                 # 后端
│   ├── src/
│   │   ├── music/         # 音乐源适配器
│   │   ├── integrations/  # 第三方集成
│   │   ├── reports/       # 报告生成
│   │   └── index.ts       # 入口
│   ├── tests/             # 测试文件
│   └── ...
├── docs/                   # 文档
│   ├── architecture.md
│   └── deployment.md
├── README.md
├── CONTRIBUTING.md
├── LICENSE
├── CHANGELOG.md
└── Dockerfile
```

---

## 七、立即可执行的命令

等侯雨回来后，可以执行以下命令开始优化：

```bash
# 1. 修复播放跳歌 Bug - 先定位问题
cd /Users/houyu/Desktop/project/vibe-music

# 2. 初始化开源项目配置
# 创建 LICENSE
# 创建 CONTRIBUTING.md
# 重写 README.md

# 3. 配置代码规范
# 添加 .prettierrc
# 添加 .editorconfig
# 配置 ESLint 规则

# 4. 配置 CI/CD
# 创建 .github/workflows/ci.yml
```

---

**下一步行动**：等侯雨回来后，优先修复播放跳歌 Bug，然后逐步执行上述计划。
