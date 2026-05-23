# MEMORY.md - 项目长期记忆

## 项目约定

- **项目路径**：`D:\li\documents\code\web\KidBikeWeb`（微信小程序）
- **后端地址**：`http://127.0.0.1:8000`（开发环境）
- **后端框架**：FastAPI（Python），字段命名 snake_case
- **图片存储**：后端 static/uploads/ 目录，image 字段只存文件名，前端拼接完整 URL

### 图片URL拼接规则
- 工具函数：`api.getImageUrl(filename)` — 在 `utils/api.js` 中
- 基础路径：`BASE_URL + '/static/uploads/'`
- 文件名含特殊字符时自动 `encodeURIComponent`
- 占位图：`/static/images/default-product.png`
- 所有产品图片展示处统一使用 `getImageUrl` + `binderror` 回退

### 字段命名规范
- 前端→后端：全部 snake_case（item_no, is_recommend, is_in_stock）
- 后端→前端：直接使用，不做转换

### 用户权限
- users 表有 role 字段，`role === 'admin'` 为管理员
- 管理员功能：新增产品、删除产品
- 前端判断：`user.role === 'admin' || user.isAdmin === true`
