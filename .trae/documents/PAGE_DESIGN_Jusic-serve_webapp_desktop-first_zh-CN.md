# 页面设计说明（桌面端优先）

## 全局设计（适用于所有页面）

### Layout
- 桌面优先：内容最大宽度 1200px，居中；两侧留白自适应。
- 栅格：CSS Grid（12 列）用于页面大区块，Flexbox 用于组件内部对齐。
- 响应式断点：
  - >=1200px：三栏/双栏布局（主内容 + 侧栏）
  - 768–1199px：双栏变单侧栏折叠
  - <768px：单栏堆叠（移动端后续可再精炼）

### Meta Information（默认）
- title：Jusic-serve 点歌与投票
- description：创建房间、多人点歌、投票排序、黑名单与权限管理。
- Open Graph：og:title、og:description、og:type=website

### Global Styles（Design Tokens）
- 颜色
  - Background：#0B1220（深色）
  - Surface：#111A2E（卡片底）
  - Primary：#5B8CFF（主按钮/高亮）
  - Success：#2ECC71（通过/赞成）
  - Danger：#FF4D4F（移除/拉黑）
  - Text：#E6EEF8（主文字），#9FB0C3（次文字）
- 字体与层级
  - 基础字体：system-ui / Inter / PingFang SC
  - 标题：20/24/32
  - 正文：14/16
- 按钮
  - Primary：实心，hover 提亮 6%
  - Secondary：描边，hover 背景浅填充
  - Danger：红色系，带二次确认弹窗
- 链接
  - 默认 Primary 色；hover 下划线
- 动效
  - 列表更新（队列/投票）使用 150–200ms 淡入/位移过渡

### UI 与样式实现约束
- 组件库：Element Plus（弹窗/表单/按钮/抽屉等基础交互）
- 样式：优先 Tailwind Utility Classes；仅在必要时补充少量 scoped CSS
- 动效：基础过渡使用 Vue Transition/TransitionGroup；复杂动效使用 @vueuse/motion

---

## 1) 登录/注册页（/login）

### Meta
- title：登录 / 注册 - Jusic-serve

### Page Structure
- 居中单卡片布局（max 420px），背景为渐变/噪点纹理增强氛围。

### Sections & Components
1. 顶部品牌区
   - Logo（可选）+ 产品名 + 一句说明“多人点歌与投票”。
2. Tab 切换：登录 / 注册
   - 登录表单：邮箱、密码、提交按钮
   - 注册表单：邮箱、昵称、密码、提交按钮
3. 状态反馈
   - 表单校验错误提示（字段下方）
   - 提交中 loading 状态
4. 辅助入口
   - “返回首页”链接（当你想先加入房间时）

---

## 2) 首页（房间入口）（/）

### Meta
- title：房间入口 - Jusic-serve

### Page Structure
- 上方固定导航 + 中间双卡片区域 + 下方最近房间。
- 桌面端两列：左“创建房间”，右“加入房间”。

### Sections & Components
1. 顶部导航栏（NavBar）
   - 左：品牌名
   - 中：可留空或显示“当前登录用户昵称”
   - 右：登录/退出按钮
2. 创建房间卡片（CreateRoomCard）
   - 输入：房间名
   - 开关：允许匿名加入（是/否）
   - 投票规则（精简版）
     - 阈值：例如“赞成票 >= N 自动置顶/下一首”
     - Skip 投票阈值：例如“跳过票 >= N 触发切歌”
   - 点歌限制
     - 每人队列上限（数字输入）
     - 是否允许重复歌曲（开关）
   - CTA：创建并进入
3. 加入房间卡片（JoinRoomCard）
   - 输入：房间码/邀请链接
   - 输入：你的显示名（用于匿名/快速加入时显示）
   - CTA：加入房间
   - 错误态：房间不存在/已被拉黑/需登录
4. 最近访问房间（RecentRoomsList）
   - 列表：房间名、上次访问时间、快速进入

---

## 3) 房间页（点歌与投票）（/rooms/:roomId）

### Meta
- title：房间 - Jusic-serve
- description：点歌、队列、投票、成员与黑名单管理。

### Page Structure（桌面端）
- 三栏布局（CSS Grid）：
  - 左侧栏：房间信息 / 成员 / 管理入口
  - 主栏：当前播放 + 队列列表
  - 右侧栏：点歌搜索与提交 + 房间设置（Host 可见）
- 主栏的队列是“可实时更新的列表”，列表项为卡片。

### Sections & Components
0. 页面容器（RoomPage）
   - 三栏布局容器：`SidebarLeft` / `MainStage` / `SidebarRight`
1. 顶部房间条（RoomHeader）
   - 左：房间名、房间码（可点击复制）、在线人数
   - 中：你的角色标签（HOST/MODERATOR/MEMBER）
   - 右：复制邀请链接按钮、返回首页按钮
2. 左侧栏
   - 成员列表（MemberList）
     - 展示：昵称、角色、最近活跃
     - Host 操作：授予/撤销管理员、踢出（带确认）
   - 黑名单入口（BlacklistPanel）
     - 展示黑名单列表（user/device）
     - Host/Mod：新增拉黑（输入用户/选择当前成员）、解除
3. 主栏：当前播放（NowPlayingCard）
   - 展示：歌曲名/歌手/时长、点歌人
   - Host/Mod 操作：标记“播放完成 -> 下一首”、移除当前歌曲
4. 主栏：队列列表（QueueList）
   - 列表头：排序规则提示（例如“按票数优先，其次时间”）
   - 队列项（QueueItemCard）
     - 信息：歌曲名/歌手、点歌人、提交时间、当前票数
     - 投票区：赞成/反对/跳过（按钮组，展示你是否已投票）
     - 管理区（Host/Mod 可见）：置顶、移除、锁定（锁定后仅管理者可改动）
   - 空态：提示“快来点第一首歌”
5. 右侧栏：点歌搜索与提交（SongSearchPanel）
   - 搜索输入框 + 结果列表
   - 结果项：歌曲名/歌手/来源标识
   - 操作：选择后“加入队列”
   - 校验提示：重复/超限/被拉黑/频率过高
6. 右侧栏：房间设置（RoomSettingsPanel，仅 Host 可见）
   - 投票阈值设置（赞成/跳过）
   - 匿名策略（允许/不允许）
   - 点歌限制（每人上限、是否允许重复）
   - 保存后：显示“已同步到全员”toast

### Interaction States（关键）
- 实时更新：队列变更、票数变更、成员上下线变更以 toast + 列表动画呈现。
- 队列滚动保持：当用户滚动到列表中部时，`queue:update` 到来不得跳回顶部。
- 冲突处理：当你的投票/管理操作被后端拒绝（权限不足/已过期）时提示并刷新房间 state。
- 权限可见性：
  - MEMBER 仅见投票与点歌
  - MODERATOR 见队列管理与黑名单
  - HOST 见所有设置与权限管理
