# 📚 梅陇中学论坛

一个基于 Cloudflare Pages + KV 构建的现代化校园论坛系统，支持多级分类、私信、积分等级、管理员后台等完整功能。

**🔗 在线地址：** [https://meilongbbs.pages.dev](https://meilongbbs.pages.dev)

---

## ✨ 功能特性

### 🔐 用户系统
- 注册登录（密码 SHA-256 加密）
- 个人信息修改（姓名、性别、年级、班级）
- 头像上传（管理员可封禁头像）
- 个人简介（200字限制 + 敏感词过滤）
- 积分与等级系统（5级）
- 每日签到（连续签到奖励）

### 📝 帖子系统
- 发布帖子（支持 Markdown）
- 多级分类（无限级树形分类）
- 附件上传（≤2MB/个，最多2个）
- 楼中楼回复（树形结构）
- 点赞 / 踩（帖子和回复）
- 收藏帖子
- 用户自删帖子
- 管理员删除帖子（带原因通知）

### 💬 私信系统
- 用户间私信（含敏感词过滤）
- 管理员向用户发消息
- 联系人管理（搜索、添加）
- 联系人头像显示
- 消息列表（按联系人分组）

### 👑 管理后台
- 仪表盘（统计数据）
- 用户管理（编辑、删除、封禁头像、发消息）
- 帖子管理（查看、删除）
- 分类管理（增删改、支持父级）
- 敏感词管理
- 公告管理（置顶、过期时间）
- 管理员密码修改
- 管理员收件箱

### 🎨 UI/UX
- 毛玻璃亚克力风格
- 响应式设计（适配移动端）
- 全局未读消息红点
- 左右宽屏布局（资源管理器风格）

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 前端 | HTML5 + CSS3 + Vanilla JS |
| 后端 | Cloudflare Pages Functions |
| 存储 | Cloudflare KV |
| 加密 | Web Crypto API (SHA-256) |
| Markdown | marked.js |
| 部署 | Cloudflare Pages + GitHub |

---

## 📁 项目结构
meilongbbs/
├── functions/
│ ├── api/
│ │ ├── adminLogin.js
│ │ ├── adminDashboard.js
│ │ ├── adminUpdateUser.js
│ │ ├── adminDeleteUser.js
│ │ ├── adminBanAvatar.js
│ │ ├── adminDeletePostWithReason.js
│ │ ├── adminSendMessage.js
│ │ ├── adminMessages.js
│ │ ├── adminCreateCategory.js
│ │ ├── adminUpdateCategory.js
│ │ ├── adminDeleteCategory.js
│ │ ├── categories.js
│ │ ├── createPost.js
│ │ ├── deleteMyPost.js
│ │ ├── favorite.js
│ │ ├── favorites.js
│ │ ├── getUserProfile.js
│ │ ├── inbox.js
│ │ ├── like.js
│ │ ├── login.js
│ │ ├── logout.js
│ │ ├── post.js
│ │ ├── posts.js
│ │ ├── readMessage.js
│ │ ├── register.js
│ │ ├── reply.js
│ │ ├── replyTree.js
│ │ ├── sendMessage.js
│ │ ├── updateProfile.js
│ │ ├── updateUser.js
│ │ ├── uploadAvatar.js
│ │ ├── uploadFile.js
│ │ ├── stats.js
│ │ ├── announcement.js
│ │ ├── sensitive.js
│ │ ├── resetPassword.js
│ │ ├── adminChangePassword.js
│ │ ├── checkin.js
│ │ ├── contacts.js
│ │ └── searchUsers.js
│ └── utils/
│ ├── db.js
│ └── level.js
├── index.html
├── login.html
├── register.html
├── adminLogin.html
├── adminDashboard.html
├── adminUsers.html
├── adminPosts.html
├── adminCategories.html
├── adminSensitive.html
├── adminAnnouncement.html
├── adminMessages.html
├── dashboard.html
├── post.html
├── createPost.html
├── profile.html
├── favorites.html
├── sendMessage.html
├── inbox.html
├── updateUser.html
├── style.css
├── package.json
└── README.md

text

---

## 🚀 部署指南

### 前置条件
- Cloudflare 账号
- GitHub 账号
- Node.js 环境（用于本地开发）

### 步骤

1. **Fork / Clone 仓库**
   ```bash
   git clone https://github.com/AxinYyds1231/meilongbbsclf.git
   cd meilongbbsclf
创建 KV 命名空间

登录 Cloudflare Dashboard → Workers & Pages → KV

创建命名空间 USER_DATA

绑定 KV 到 Pages 项目

在 Pages 项目设置中添加绑定：

变量名：USER_DATA

KV 命名空间：USER_DATA

导入分类数据（可选）

将 categories.json 导入 KV 的 categories 键

部署

推送代码到 GitHub

Cloudflare Pages 自动部署

🔑 默认管理员账号
项目	值
密码	Mlbbs_admin62!
登录后可在管理后台修改密码。

📊 数据库设计
KV 键结构
键名	说明
users	用户数据数组
posts	帖子数据数组
categories	分类树数据
messages	私信数据
contacts	联系人列表
announcements	公告数据
sensitive_words	敏感词列表
stats	统计数据
admin_password_hash	管理员密码哈希
favorites	收藏数据
checkin_*	签到数据
📌 API 文档
端点	方法	说明
/api/login	POST	用户登录
/api/register	POST	用户注册
/api/adminLogin	POST	管理员登录
/api/posts	GET	获取帖子列表
/api/post	GET	获取帖子详情
/api/createPost	POST	发布帖子
/api/reply	POST	回复帖子
/api/replyTree	GET/POST	树形回复
/api/like	POST	点赞/踩
/api/favorite	POST	收藏/取消
/api/favorites	GET	获取收藏列表
/api/sendMessage	POST	发送私信
/api/inbox	GET	获取收件箱
/api/contacts	GET	获取联系人
/api/addContact	POST	添加联系人
/api/searchUsers	GET	搜索用户
/api/categories	GET	获取分类树
/api/stats	GET	统计数据
/api/sensitive	GET/POST/DELETE	敏感词管理
/api/announcement	GET/POST/PUT/DELETE	公告管理
/api/updateUser	POST	更新个人信息
/api/updateProfile	POST	更新简介
/api/uploadAvatar	POST	上传头像
/api/adminDeleteUser	POST	删除用户
/api/adminBanAvatar	POST	封禁/解封头像
/api/adminSendMessage	POST	管理员发消息
/api/adminMessages	GET	管理员收件箱
/api/adminDeletePostWithReason	POST	删除帖子（带原因）
/api/adminChangePassword	POST	修改管理员密码
/api/deleteMyPost	POST	用户删除自己的帖子
/api/deleteMessage	POST	删除私信
/api/checkin	POST	签到
/api/logout	GET	退出登录
/api/user	GET	获取当前用户信息
/api/getUserProfile	GET	获取用户公开信息
📸 界面预览
（建议添加几张截图）

🤝 贡献
欢迎提交 Issue 和 Pull Request！

📄 许可证
MIT License

🙏 致谢
Cloudflare - 提供 Pages + KV 基础设施

marked.js - Markdown 渲染

DeepSeek - 技术支持

⭐ 如果这个项目对你有帮助，欢迎给个 Star！