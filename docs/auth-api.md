# 认证模块接口文档

> 项目：KidBikeWeb 微信小程序  
> 基础路径：`/api/v1`  
> 数据格式：`Content-Type: application/json`  
> 认证方式：Bearer Token（`Authorization: Bearer <token>`）

---

## 目录

- [1. 手机号密码登录](#1-手机号密码登录)
- [2. 微信一键登录](#2-微信一键登录)
- [3. 注册账号](#3-注册账号)
- [4. 获取当前用户信息](#4-获取当前用户信息)（**本次有变更**）
- [通用错误码](#通用错误码)
- [Token 说明](#token-说明)
- [本次变更说明](#本次变更说明)

---

## 1. 手机号密码登录

### 请求

```
POST /api/v1/auth/login
```

**Headers**

| 字段           | 值                 |
| -------------- | ------------------ |
| Content-Type   | application/json   |

**请求体**

| 字段     | 类型   | 必填 | 说明                   |
| -------- | ------ | ---- | ---------------------- |
| phone    | string | ✅   | 手机号（11位，1开头）  |
| password | string | ✅   | 密码（至少6位）        |

**请求示例**

```json
{
  "phone": "13800138000",
  "password": "abc123"
}
```

### 响应

**成功 `200 OK`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "u_123456",
    "phone": "13800138000",
    "nickname": "骑行少年",
    "avatarUrl": "https://example.com/avatar.jpg",
    "role": "user"
  }
}
```

> 前端会依次尝试读取：`res.token` → `res.data.token` → `res.accessToken` → `res.access_token`  
> 推荐直接返回顶层 `token` 字段。

**失败 `400 / 401`**

```json
{
  "detail": "手机号或密码错误"
}
```

> 前端读取错误信息优先级：`err.data.detail` → `err.data.message` → `err.message`

---

## 2. 微信一键登录

### 请求

```
POST /api/v1/auth/login/wechat
```

**Headers**

| 字段           | 值                 |
| -------------- | ------------------ |
| Content-Type   | application/json   |

**请求体**

| 字段      | 类型   | 必填 | 说明                                         |
| --------- | ------ | ---- | -------------------------------------------- |
| code      | string | ✅   | 微信 `wx.login()` 返回的临时登录凭证 code    |
| avatarUrl | string | ❌   | 用户头像 URL（用户授权后可选传入）           |
| nickName  | string | ❌   | 用户昵称（用户授权后可选传入）               |

**请求示例**

```json
{
  "code": "0a1b2c3d4e5f",
  "avatarUrl": "https://thirdwx.qlogo.cn/...",
  "nickName": "小骑手"
}
```

**后端处理流程**

1. 用 `code` 向微信服务器换取 `openid` + `session_key`
   - 请求：`GET https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=CODE&grant_type=authorization_code`
2. 根据 `openid` 查询或创建用户
3. 生成并返回应用自己的 JWT Token

### 响应

**成功 `200 OK`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "u_789012",
    "openid": "oXxxxxxxxxxxxxx",
    "nickname": "小骑手",
    "avatarUrl": "https://thirdwx.qlogo.cn/...",
    "role": "user"
  }
}
```

> 前端读取字段：`data.token` → `data.accessToken` → `data.access_token`

**失败 `400 / 500`**

```json
{
  "detail": "微信登录失败，code 无效或已过期"
}
```

---

## 3. 注册账号

### 请求

```
POST /api/v1/auth/register
```

**Headers**

| 字段           | 值                 |
| -------------- | ------------------ |
| Content-Type   | application/json   |

**请求体**

| 字段     | 类型   | 必填 | 说明                          |
| -------- | ------ | ---- | ----------------------------- |
| phone    | string | ✅   | 手机号（11位，格式：1[3-9]xxxxxxxxx） |
| nickname | string | ✅   | 昵称（非空字符串）            |
| password | string | ✅   | 密码（至少6位）               |

**请求示例**

```json
{
  "phone": "13900139000",
  "nickname": "骑行小将",
  "password": "myPass123"
}
```

### 响应

**成功 `200 OK` 或 `201 Created`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "u_345678",
    "phone": "13900139000",
    "nickname": "骑行小将",
    "avatarUrl": "",
    "role": "user"
  }
}
```

> 注册成功后前端会直接使用返回的 token 自动登录，无需二次调用登录接口。  
> 新注册用户默认角色为 `user`，管理员由后台手动分配。

**失败 `400 / 409`**

```json
{
  "detail": "该手机号已注册"
}
```

> 常见失败原因：手机号已存在、字段格式不合法

---

## 4. 获取当前用户信息

> 登录成功后，前端可用此接口刷新用户信息（app.js autoLogin 及 my 页 onShow 中调用）。  
> ⚠️ **本次变更**：响应中需新增 `role` 字段，前端依赖此字段控制「产品管理」板块显示。

### 请求

```
GET /api/v1/users/me
```

**Headers**

| 字段           | 值                      |
| -------------- | ----------------------- |
| Authorization  | Bearer \<token\>        |

### 响应

**成功 `200 OK`**

```json
{
  "id": "u_123456",
  "phone": "13800138000",
  "nickname": "骑行少年",
  "avatarUrl": "https://example.com/avatar.jpg",
  "role": "admin",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

**`role` 字段说明**

| 值      | 含义                             |
| ------- | -------------------------------- |
| `user`  | 普通用户（默认值）               |
| `admin` | 管理员，小程序中显示「产品管理」 |

> 前端判断逻辑：`user.role === 'admin'`，管理员才会看到「新增产品」入口。  
> 备注：若后端使用布尔字段方案，也支持 `isAdmin: true`，前端两种都能识别。

**失败 `401 Unauthorized`**

```json
{
  "detail": "Token 无效或已过期"
}
```

---

## 通用错误码

| HTTP 状态码 | 含义                              |
| ----------- | --------------------------------- |
| 400         | 请求参数错误（字段缺失/格式错误） |
| 401         | 未认证 / Token 无效或过期         |
| 403         | 已认证但权限不足（非管理员操作）  |
| 409         | 资源冲突（如手机号已注册）        |
| 422         | 数据验证失败                      |
| 500         | 服务器内部错误                    |

错误响应体统一格式（推荐）：

```json
{
  "detail": "错误描述文字"
}
```

> 前端会优先读取 `detail`，其次 `message`，最后兜底显示默认提示。

---

## Token 说明

- 类型：JWT（推荐）或自定义 token 均可
- 存储：前端存储在微信小程序 `wx.setStorageSync('token', token)`
- 传递：所有需要认证的接口，请求头中加 `Authorization: Bearer <token>`
- 失效处理：接口返回 `401` 时，前端会清除本地 token 并引导用户重新登录
- 有效期：建议 7 天或 30 天，由后端自行决定

---

## 本次变更说明

> 更新日期：2026-05-22  
> 变更原因：前端新增管理员专属「产品管理」板块，仅登录且角色为管理员的用户可见。

### 涉及接口变更（后端需配合修改）

| 接口 | 变更类型 | 变更内容 |
| ---- | -------- | -------- |
| `GET /api/v1/users/me` | **响应字段新增** | 需在返回体中增加 `role` 字段（`"user"` 或 `"admin"`） |
| `POST /api/v1/auth/login` | **响应字段新增（建议）** | `user` 对象中建议同步增加 `role` 字段，避免登录后再单独拉取 |
| `POST /api/v1/auth/login/wechat` | **响应字段新增（建议）** | 同上 |
| `POST /api/v1/auth/register` | **响应字段新增（建议）** | 新注册用户 `role` 默认为 `"user"` |

### 前端判断逻辑（供参考）

```js
// 支持两种后端字段约定，优先使用 role
const isAdmin = user.role === 'admin' || user.isAdmin === true;
```

### 数据库层面建议

- 在 `users` 表新增 `role` 字段，类型 `VARCHAR(20)`，默认值 `'user'`
- 可选值枚举：`user` | `admin`
- 管理员账号由数据库直接赋值或通过后台管理系统分配，**不对外暴露修改接口**

---

*文档由前端代码自动提取，最后更新：2026-05-22*
