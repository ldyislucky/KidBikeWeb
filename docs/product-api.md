# 产品管理接口文档

> 项目：KidBikeWeb 微信小程序
> 基础路径：`/api/v1`
> 认证方式：Bearer Token（`Authorization: Bearer <token>`）
> 权限要求：**以下所有接口均需管理员权限**（`role: "admin"`）

---

## 目录

- [1. 新增产品（含图片）](#1-新增产品含图片)
- [2. 新增产品（无图片）](#2-新增产品无图片)
- [前端调用说明](#前端调用说明)
- [后端实现要点](#后端实现要点)
- [通用错误码](#通用错误码)
- [变更说明](#变更说明)

---

## 1. 新增产品（含图片）

> **核心设计**：图片和产品信息在**同一个请求**中上传。前端使用 `wx.uploadFile` 以 `multipart/form-data` 方式同时发送图片文件和产品字段，后端一次接收完成图片存储 + 产品创建 + 图片关联。

### 请求

```
POST /api/v1/products
Content-Type: multipart/form-data
```

**Headers**

| 字段          | 值                                   |
| ------------- | ------------------------------------ |
| Authorization | Bearer \<token\>                     |
| Content-Type  | multipart/form-data（微信自动设置）  |

**表单字段（multipart）**

| 字段         | 类型   | 必填 | 说明                                                                                      |
| ------------ | ------ | ---- | ----------------------------------------------------------------------------------------- |
| file         | binary | ✅   | 图片文件（JPG / PNG / WebP），微信 `wx.uploadFile` 的 `name` 固定为 `"file"`             |
| title        | string | ✅   | 产品名称                                                                                  |
| item_no      | string | ✅   | 货号（需唯一）                                                                            |
| price        | string | ✅   | 价格（前端以字符串传入，后端转为 float，单位：元）                                         |
| is_recommend | string | ✅   | 是否主推（`"true"` / `"false"`，前端 formData 统一为字符串，后端需转为 bool）             |
| is_in_stock  | string | ✅   | 是否现货（`"true"` / `"false"`，同上）                                                    |
| description  | string | ❌   | 产品描述（最大 500 字，不传则不包含此字段）                                               |

> **重要**：`formData` 中所有值均为字符串类型（微信 `wx.uploadFile` 限制），后端需要自行做类型转换：
> - `price` → `float`
> - `is_recommend` / `is_in_stock` → `bool`（字符串 `"true"` → `True`，`"false"` → `False`）

### 请求示例（实际 HTTP 请求）

```
POST /api/v1/products HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="bike.jpg"
Content-Type: image/jpeg

(binary image data)
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="title"

儿童平衡车 12寸
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="item_no"

BK-2026-12
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="price"

299.0
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="is_recommend"

true
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="is_in_stock"

true
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="description"

适合 2-5 岁儿童，铝合金车架，充气轮胎，可调节车座
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

### 前端调用方式

```js
// utils/api.js → createProductWithFile(filePath, productData)
wx.uploadFile({
  url: BASE_URL + '/api/v1/products',
  filePath: tempFilePath,               // 用户选择的本地图片临时路径
  name: 'file',                         // 固定值，后端用 UploadFile(name="file") 接收
  header: { 'Authorization': `Bearer ${token}` },
  formData: {
    title: '儿童平衡车 12寸',
    item_no: 'BK-2026-12',
    price: '299.0',                     // 注意：formData 值全为字符串
    is_recommend: 'true',               // 注意：字符串，不是布尔值
    is_in_stock: 'true',
    description: '适合 2-5 岁儿童...'   // 可选字段，有值时才传
  },
  success(res) {
    // res.statusCode 表示 HTTP 状态码
    // res.data 为 JSON 字符串，需 JSON.parse
  }
});
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
  "created_at": "2026-05-23T12:30:00Z"
}
```

| 字段         | 类型   | 说明                                            |
| ------------ | ------ | ----------------------------------------------- |
| id           | string | 产品唯一 ID                                     |
| title        | string | 产品名称                                        |
| item_no      | string | 货号                                            |
| price        | number | 价格（元）                                      |
| is_recommend | bool   | 是否主推                                        |
| is_in_stock  | bool   | 是否现货                                        |
| image        | string | 图片 URL（后端保存图片后返回的完整可访问地址）   |
| description  | string | 产品描述（无时为 null 或空串）                   |
| created_at   | string | 创建时间（ISO 8601）                            |

**失败 `400` — 参数缺失或格式错误**

```json
{
  "detail": "货号不能为空"
}
```

**失败 `403` — 权限不足**

```json
{
  "detail": "没有权限执行此操作"
}
```

**失败 `413` — 文件过大**

```json
{
  "detail": "文件大小超出限制（最大 5MB）"
}
```

**失败 `422` — 数据验证失败**

```json
{
  "detail": [
    {
      "loc": ["body", "price"],
      "msg": "value is not a valid float",
      "input": "abc"
    }
  ]
}
```

---

## 2. 新增产品（无图片）

> 用户未选择图片时，前端使用**纯 JSON** 方式提交，`Content-Type: application/json`。

### 请求

```
POST /api/v1/products
Content-Type: application/json
```

**Headers**

| 字段          | 值               |
| ------------- | ---------------- |
| Authorization | Bearer \<token\> |
| Content-Type  | application/json |

**请求体（JSON）**

| 字段         | 类型   | 必填 | 说明                                   |
| ------------ | ------ | ---- | -------------------------------------- |
| title        | string | ✅   | 产品名称                               |
| item_no      | string | ✅   | 货号（需唯一）                         |
| price        | number | ✅   | 价格（float，单位：元）                |
| is_recommend | bool   | ✅   | 是否主推                               |
| is_in_stock  | bool   | ✅   | 是否现货                               |
| description  | string | ❌   | 产品描述（最大 500 字）                |

> **注意**：无图片时**不含 `image` 字段**，也不含 `file` 字段。

**请求示例**

```json
{
  "title": "儿童三轮车",
  "item_no": "TK-2026-01",
  "price": 199.00,
  "is_recommend": false,
  "is_in_stock": true,
  "description": "适合 1-3 岁儿童，安全稳固"
}
```

### 响应

与「含图片」响应格式一致，`image` 字段为 `null` 或空串。

**成功 `201 Created`**

```json
{
  "id": "prod_789013",
  "title": "儿童三轮车",
  "item_no": "TK-2026-01",
  "price": 199.00,
  "is_recommend": false,
  "is_in_stock": true,
  "image": null,
  "description": "适合 1-3 岁儿童，安全稳固",
  "created_at": "2026-05-23T12:31:00Z"
}
```

---

## 前端调用说明

### 提交流程

```
用户填写表单 + 选择图片（可选）
    │
    ▼
点击「提交产品」
    │
    ├─ 有图片 → wx.uploadFile 一次性上传
    │           POST /api/v1/products
    │           Content-Type: multipart/form-data
    │           formData: { title, item_no, price, is_recommend, is_in_stock, description }
    │           file: (图片二进制)
    │
    └─ 无图片 → wx.request 纯 JSON 提交
                POST /api/v1/products
                Content-Type: application/json
                body: { title, item_no, price, is_recommend, is_in_stock, description }
    │
    ▼
成功 → "添加成功" → navigateBack
失败 → 显示后端错误信息
```

### 前端判断逻辑

```js
if (productImage) {
  api.createProductWithFile(productImage, productData);  // multipart 方式
} else {
  api.createProduct(productData);                         // JSON 方式
}
```

---

## 后端实现要点

### 核心设计：一个接口，两种 Content-Type

后端 `POST /api/v1/products` 需要同时支持两种请求格式：

| 场景     | Content-Type          | 包含 file | 数据来源               |
| -------- | --------------------- | --------- | ---------------------- |
| 有图片   | multipart/form-data   | ✅        | `formData` 字段        |
| 无图片   | application/json      | ❌        | JSON body              |

### FastAPI 实现参考

```python
from fastapi import APIRouter, UploadFile, File, Form, Depends, Request
from typing import Optional

router = APIRouter()

@router.post("/products")
async def create_product(
    request: Request,
    file: Optional[UploadFile] = File(None),
    title: str = Form(None),
    item_no: str = Form(None),
    price: str = Form(None),
    is_recommend: str = Form(None),
    is_in_stock: str = Form(None),
    description: Optional[str] = Form(None),
):
    if file:
        # multipart/form-data 方式：从 Form 字段取值
        # 类型转换
        product_data = {
            "title": title,
            "item_no": item_no,
            "price": float(price),
            "is_recommend": is_recommend.lower() == "true",
            "is_in_stock": is_in_stock.lower() == "true",
        }
        if description:
            product_data["description"] = description

        # 1. 保存图片，获取 URL
        image_url = save_upload_file(file)  # 自行实现：存文件 → 返回 URL

        # 2. 创建产品，关联图片
        product_data["image"] = image_url
        product = create_product_in_db(product_data)

    else:
        # application/json 方式：从 request body 取值
        body = await request.json()
        product = create_product_in_db(body)

    return product
```

### 图片存储建议

| 项目         | 建议值                        |
| ------------ | ----------------------------- |
| 支持格式     | JPG、PNG、WebP、GIF           |
| 最大文件大小 | 5 MB                          |
| 存储方式     | 对象存储（OSS/COS/S3 均可）或本地 |
| 返回 URL     | 完整公开访问地址              |
| 文件命名     | 建议加随机后缀防止覆盖        |
| 关联方式     | 图片 URL 存入产品表的 `image` 字段 |

### formData 字段类型转换注意

微信 `wx.uploadFile` 的 `formData` 所有值都是字符串，后端必须做类型转换：

| 前端 formData 值 | 后端需转为   | 转换方式                               |
| ---------------- | ------------ | -------------------------------------- |
| `"299.0"`        | `float`      | `float(price)`                         |
| `"true"`         | `bool`       | `is_recommend.lower() == "true"`       |
| `"false"`        | `bool`       | `is_in_stock.lower() == "true"` → `False` |

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

## 变更说明

> 更新日期：2026-05-23

### 本次变更：图片与产品合并为单次请求

**变更原因**：图片和产品信息需一起上传，后端在同一个接口中接收文件并关联到产品记录。

#### 前端变更（已完成）

| 文件                     | 变更内容                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `utils/api.js`           | 新增 `createProductWithFile()`，使用 `wx.uploadFile` 一次性上传文件 + formData                |
| `product-form.js`        | 取消预上传策略；选图仅存本地路径；提交时根据是否有图片分流调用不同 API                        |
| `product-form.wxml`      | 简化图片区域，移除上传中/失败遮罩状态                                                       |
| `product-form.wxss`      | 清理不再需要的上传遮罩样式                                                                   |

#### 后端需实现的接口

| 接口                    | 说明                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| `POST /api/v1/products` | **需改造为双模式接口**：有 `file` 字段时按 multipart 处理（接收图片+产品字段），无 `file` 时按 JSON 处理 |

#### 与旧版的主要差异

| 对比项         | 旧版（预上传）                                           | 新版（合并上传）                                                |
| -------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| 图片上传时机   | 选图后立即调用 `/api/v1/files/upload`                    | 提交产品时随产品数据一起发送                                    |
| 接口调用次数   | 2 次（先上传图片，再创建产品）                           | 1 次（单次请求完成全部操作）                                    |
| 图片信息传递   | 前端拿 URL 后以 `image` 字段传给创建产品接口             | 图片作为 `file` 字段随 multipart 一起发，后端负责存储并关联     |
| 无图片时       | 同新版                                                   | 纯 JSON 提交，不含 `file` 字段                                  |
| `/files/upload` | 旧版需要                                                 | **新版不再需要**（已废弃该独立上传接口用于新增产品场景）        |

---

*文档由前端代码自动提取，最后更新：2026-05-23*
