# 产品管理接口文档

> 项目：KidBikeWeb 微信小程序  
> 基础路径：`/api/v1`  
> 数据格式：`Content-Type: application/json`（文件上传除外）  
> 认证方式：Bearer Token（`Authorization: Bearer <token>`）  
> 权限要求：**以下所有接口均需管理员权限**（`role: "admin"`）

---

## 目录

- [1. 图片上传](#1-图片上传)
- [2. 新增产品](#2-新增产品)
- [调用时序说明](#调用时序说明)
- [通用错误码](#通用错误码)
- [本次变更说明](#本次变更说明)

---

## 1. 图片上传

> 前端在用户选择图片后**立即上传**（预上传策略），拿到图片 URL 后再调新增产品接口。  
> 提交产品时不再重复上传，直接使用已拿到的 URL。

### 请求

```
POST /api/v1/files/upload
```

**Headers**

| 字段          | 值                                   |
| ------------- | ------------------------------------ |
| Authorization | Bearer \<token\>                     |
| Content-Type  | multipart/form-data（由微信自动设置） |

**表单字段（multipart）**

| 字段 | 类型   | 必填 | 说明                            |
| ---- | ------ | ---- | ------------------------------- |
| file | binary | ✅   | 图片文件（JPG / PNG / WebP）    |

> 微信小程序使用 `wx.uploadFile` 上传，`name` 字段固定为 `"file"`。

**前端调用方式（供参考）**

```js
wx.uploadFile({
  url: BASE_URL + '/api/v1/files/upload',
  filePath: tempFilePath,          // 本地临时路径
  name: 'file',                    // 固定值
  header: { 'Authorization': `Bearer ${token}` },
  success(res) { /* res.data 为 JSON 字符串，需 JSON.parse */ }
});
```

### 响应

**成功 `200 OK`**

```json
{
  "url": "https://example.com/uploads/products/img_20260523_abc123.jpg"
}
```

| 字段 | 类型   | 说明                                    |
| ---- | ------ | --------------------------------------- |
| url  | string | 可公开访问的图片完整 URL（前端直接使用） |

> 前端读取优先级：`res.url` → `res.data`  
> 请确保返回的 `url` 是完整 HTTP/HTTPS URL，不含相对路径。

**失败 `400`**

```json
{
  "detail": "不支持的文件类型，仅允许图片格式"
}
```

**失败 `413`**

```json
{
  "detail": "文件大小超出限制（最大 5MB）"
}
```

### 后端实现建议

| 项目         | 建议值                        |
| ------------ | ----------------------------- |
| 支持格式     | JPG、PNG、WebP、GIF           |
| 最大文件大小 | 5 MB                          |
| 存储方式     | 对象存储（OSS/COS/S3 均可）   |
| 返回 URL     | 完整公开访问地址              |
| 文件命名     | 建议加随机后缀防止覆盖        |
| 权限校验     | 需要 Bearer Token + 管理员角色 |

---

## 2. 新增产品

> 调用时机：图片上传完成后（若有图片），或表单填写完成直接提交（无图片时）。

### 请求

```
POST /api/v1/products
```

**Headers**

| 字段          | 值                   |
| ------------- | -------------------- |
| Content-Type  | application/json     |
| Authorization | Bearer \<token\>     |

**请求体**

| 字段         | 类型    | 必填 | 说明                                          |
| ------------ | ------- | ---- | --------------------------------------------- |
| title        | string  | ✅   | 产品名称（非空字符串）                        |
| item_no      | string  | ✅   | 货号（如 `BK-001`，需唯一）                   |
| price        | number  | ✅   | 价格（正数，单位：元）                        |
| is_recommend | boolean | ✅   | 是否为主推产品（`true` 时首页主推栏展示）     |
| is_in_stock  | boolean | ✅   | 是否现货（`true` / `false`）                  |
| image        | string  | ❌   | 图片 URL（由图片上传接口返回，不传则无封面）  |
| description  | string  | ❌   | 产品描述文字（最大 500 字）                   |

> **字段命名规范**：全部使用 snake_case（下划线风格），与 FastAPI/Pydantic 默认规范一致。

**请求示例（含图片）**

```json
{
  "title": "儿童平衡车 12寸",
  "item_no": "BK-2026-12",
  "price": 299.00,
  "is_recommend": true,
  "is_in_stock": true,
  "image": "https://example.com/uploads/products/img_20260523_abc123.jpg",
  "description": "适合 2-5 岁儿童，铝合金车架，充气轮胎，可调节车座"
}
```

**请求示例（不含图片）**

```json
{
  "title": "儿童三轮车",
  "item_no": "TK-2026-01",
  "price": 199.00,
  "is_recommend": false,
  "is_in_stock": true
}
```

### 响应

**成功 `200 OK` 或 `201 Created`**

```json
{
  "id": "prod_789012",
  "title": "儿童平衡车 12寸",
  "item_no": "BK-2026-12",
  "price": 299.00,
  "is_recommend": true,
  "is_in_stock": true,
  "image": "https://example.com/uploads/products/img_20260523_abc123.jpg",
  "description": "适合 2-5 岁儿童，铝合金车架，充气轮胎，可调节车座",
  "created_at": "2026-05-23T11:00:00Z"
}
```

| 字段         | 类型    | 说明                    |
| ------------ | ------- | ----------------------- |
| id           | string  | 产品唯一 ID             |
| title        | string  | 产品名称                |
| item_no      | string  | 货号                    |
| price        | number  | 价格（元）              |
| is_recommend | boolean | 是否主推                |
| is_in_stock  | boolean | 是否现货                |
| image        | string  | 图片 URL（无图时为空串或 null） |
| description  | string  | 产品描述（无时为空串或 null）  |
| created_at   | string  | 创建时间（ISO 8601）    |

**失败 `400` — 参数错误**

```json
{
  "detail": "货号不能为空"
}
```

**失败 `409` — 货号冲突**

```json
{
  "detail": "货号 BK-2026-12 已存在，请换一个货号"
}
```

**失败 `403` — 权限不足**

```json
{
  "detail": "没有权限执行此操作"
}
```

---

## 调用时序说明

```
用户选择图片
    │
    ▼
POST /api/v1/files/upload          ← 立即上传（预上传）
    │
    │  成功 → 拿到 image URL，暂存
    │  失败 → 弹窗：重试 or 跳过（不含图提交）
    │
用户填写其余表单字段
    │
    ▼
点击「提交产品」
    │
    ├─ 若图片上传中 → 提示等待，阻止提交
    ├─ 若图片上传失败且未跳过 → 再次提示确认
    │
    ▼
POST /api/v1/products              ← 提交产品信息（含或不含 image 字段）
    │
    │  成功 → showToast "添加成功" → navigateBack
    │  失败 → showToast 后端错误信息，重置 submitting 状态
```

---

## 通用错误码

| HTTP 状态码 | 含义                              |
| ----------- | --------------------------------- |
| 400         | 请求参数错误（字段缺失/格式错误） |
| 401         | 未认证 / Token 无效或过期         |
| 403         | 已认证但权限不足（非管理员操作）  |
| 409         | 资源冲突（如货号已存在）          |
| 413         | 文件过大                          |
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

## 本次变更说明

> 更新日期：2026-05-23  
> 变更原因：完善新增产品功能，支持图片预上传 + 产品描述字段

### 前端变更（已完成）

| 页面/文件             | 变更内容                                               |
| --------------------- | ------------------------------------------------------ |
| `product-form.js`     | 图片选中后立即上传；上传中/失败状态管理；增加描述字段  |
| `product-form.wxml`   | 图片区域增加上传进度遮罩、失败遮罩、成功重选提示       |
| `product-form.wxss`   | 新增图片遮罩样式、描述文本域样式、按钮禁用样式         |

### 后端需新增/确认的接口

| 接口                    | 状态          | 说明                                                       |
| ----------------------- | ------------- | ---------------------------------------------------------- |
| `POST /api/v1/files/upload` | **需实现**    | 接收 multipart 文件，返回 `{ "url": "..." }`              |
| `POST /api/v1/products` | **需确认**    | 在原有字段基础上新增 `description`（string, nullable）字段 |

### `description` 字段说明（新增）

- 类型：`TEXT` 或 `VARCHAR(500)`
- 必填：否（前端不传时不包含该字段）
- 空值处理：后端接受不传、传 `null`、传空串三种情况，统一存为 `null`
- 返回：响应体中始终包含 `description` 字段，无描述时返回 `null` 或 `""`

---

*文档由前端代码自动提取，最后更新：2026-05-23*
