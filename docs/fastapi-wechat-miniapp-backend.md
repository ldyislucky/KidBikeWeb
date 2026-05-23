# 技能名称：`fastapi-wechat-miniapp-backend`

## 技能描述
本技能用于开发基于 **FastAPI + MySQL + Redis** 的微信小程序后端。所有技术选型均支持**异步**（Async/Await），提供从开发到生产的完整配置与项目结构。当用户要求实现小程序登录、支付、文件上传、定时任务等功能时，应当遵循本技能中规定的技术组件、目录分层和编码规范。

## 适用场景
- 开发新的微信小程序后端接口
- 重构现有同步 Python 项目为异步 FastAPI 项目
- 添加微信登录、支付、模板消息等功能
- 部署基于 Docker 的 Python 异步应用

## 技术栈清单

### 核心框架与库

| 模块              | 选型                             | 用途 / 备注                      |
| ----------------- | -------------------------------- | -------------------------------- |
| Web 框架          | FastAPI                          | 异步、自动生成 OpenAPI 文档      |
| 异步网关          | Uvicorn + Gunicorn               | 生产环境多进程部署               |
| 数据库            | MySQL 8.0                        | 主存储                           |
| 异步驱动          | `asyncmy`                        | 异步 MySQL 连接                  |
| ORM               | SQLAlchemy 2.0 (asyncio)         | 异步会话、模型定义、查询构造     |
| 数据校验          | Pydantic v2                      | 请求/响应模型、配置校验          |
| 数据库迁移        | Alembic                          | 版本化管理数据库 Schema          |
| 缓存 / 会话存储   | Redis                            | 缓存、微信 session_key、限流     |
| 异步 Redis 客户端 | `redis-py` (asyncio)             | `redis.asyncio.Redis`            |
| 认证方式          | 微信登录 + 自签 JWT              | 无状态认证                       |
| JWT 库            | `PyJWT`                          | 生成/验证 token                  |
| 微信 SDK          | `wechatpy` + `asyncio.to_thread` | 登录、手机号解密、模板消息       |
| 微信支付          | `wechatpayv3` (异步)             | APIv3 支付、回调                 |
| 异步任务队列      | `arq`                            | 基于 Redis 的异步任务            |
| 对象存储          | 阿里云 OSS / 腾讯云 COS          | 图片、文件上传                   |
| 文件上传 SDK      | `oss2` 或 `cos-python-sdk-v5`    | 异步调用使用 `asyncio.to_thread` |
| 配置管理          | `pydantic-settings`              | 读取 .env、环境变量              |
| 日志              | `loguru`                         | 结构化日志、文件轮转             |
| 跨域处理          | FastAPI CORSMiddleware           | 允许小程序请求                   |
| API 异常处理      | 自定义异常处理器                 | 统一 JSON 错误响应               |
| 全局响应格式      | 自定义中间件/依赖                | 统一包裹 `code`、`msg`、`data`   |
| 定时任务          | APScheduler (AsyncIOScheduler)   | 轻量定时任务（可替代 arq cron）  |
| 接口限流          | `slowapi`                        | 基于 IP/用户限流                 |

### 依赖文件 `requirements.txt`

```text
fastapi>=0.110.0
uvicorn[standard]>=0.29.0
gunicorn>=21.2.0
asyncmy>=0.2.9
sqlalchemy>=2.0.30
alembic>=1.13.1
redis>=5.0.0
pyjwt>=2.8.0
wechatpy>=1.8.18
wechatpayv3>=1.3.0
pydantic-settings>=2.2.0
loguru>=0.7.2
arq>=0.26.0
slowapi>=0.1.9
apscheduler>=3.10.4
oss2>=2.18.0  # 阿里云OSS，如用腾讯云COS替换为 cos-python-sdk-v5
python-multipart>=0.0.9  # 文件上传支持
```

## 环境变量配置（`.env` 示例）

```ini
# 应用
APP_NAME=miniapp
DEBUG=false
SECRET_KEY=your-secret-key

# 数据库 (MySQL 异步 URL)
DATABASE_URL=mysql+asyncmy://user:password@localhost:3306/dbname

# Redis
REDIS_URL=redis://localhost:6379/0

# 微信
WECHAT_APPID=wx123456
WECHAT_SECRET=abc123

# 微信支付
WECHATPAY_MCHID=123000
WECHATPAY_API_V3_KEY=key
WECHATPAY_SERIAL_NO=serial
WECHATPAY_PRIVATE_KEY_PATH=/path/to/apiclient_key.pem

# 对象存储
OSS_ENDPOINT=oss-cn-beijing.aliyuncs.com
OSS_ACCESS_KEY_ID=xxx
OSS_ACCESS_KEY_SECRET=xxx
OSS_BUCKET_NAME=my-bucket

# JWT
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
```

## 项目分层结构

```
app/
├── api/v1/               # 路由层（仅参数接收、返回）
│   ├── user.py
│   ├── product.py
│   └── upload.py
├── services/             # 业务逻辑层
├── repositories/         # 数据访问层（封装数据库操作）
├── models/               # SQLAlchemy ORM 模型
├── schemas/              # Pydantic 请求/响应模型
├── core/                 # 配置、安全、依赖注入
│   ├── config.py         # pydantic-settings 配置类
│   ├── security.py       # JWT、密码处理
│   ├── deps.py           # get_db, get_current_user 等依赖
│   └── exceptions.py     # 自定义异常
├── tasks/                # arq 后台任务定义
├── utils/                # 工具函数（微信封装、OSS封装等）
├── middlewares/          # 自定义中间件（全局响应包装等）
├── migrations/           # Alembic 迁移目录
├── main.py               # FastAPI 应用入口
└── worker.py             # arq worker 启动文件
```

## 关键实现落地规范

### 1. 异步数据库会话管理
- 使用依赖注入 `async def get_db()` 提供 SQLAlchemy 异步会话，请求结束后自动关闭。
- 连接池配置（在 `config.py` 中）：
  ```python
  pool_size=20, max_overflow=40, pool_pre_ping=True
  ```

### 2. 微信登录流程
- 小程序端 `code` → 后端调用 `wechatpy` 换取 `openid` 和 `session_key`。
- 将 `session_key` 存入 Redis，键为 `wechat:session:{openid}`，过期时间设为 7200 秒（微信有效时长）。
- 生成 JWT（payload 中包含 `openid`）并返回给前端。
- 解密手机号/用户信息时，先从 Redis 获取 `session_key`，再用 `wechatpy` 解密。

### 3. 文件上传
- 使用 `UploadFile` 接收文件，校验类型（如仅图片）和大小（如 ≤ 5MB）。
- 生成 UUID 文件名，保留原扩展名。
- 通过 `asyncio.to_thread` 调用 OSS SDK 上传。
- 返回可公开访问的 URL。

### 4. 统一响应格式
- 所有接口成功响应：
  ```json
  { "code": 200, "msg": "success", "data": {} }
  ```
- 错误响应使用自定义异常处理器，格式为：
  ```json
  { "code": 40001, "msg": "参数错误", "data": null }
  ```
- 可通过中间件或重写 `FastAPI` 的 `json_response` 实现。

### 5. API 限流
- 使用 `slowapi`，后端绑定 Redis。
- 示例装饰器：`@limiter.limit("5/minute")`，可根据用户 ID 或 IP 限流。

### 6. 定时任务
- 使用 `APScheduler` 的 `AsyncIOScheduler`，在 `main.py` 中启动。
- 示例任务：每天凌晨清理过期未支付订单、生成统计数据。

### 7. 部署与容器化
- 提供 `Dockerfile` 多阶段构建：
  ```dockerfile
  FROM python:3.11-slim as builder
  ...
  FROM python:3.11-slim
  COPY --from=builder /app /app
  CMD ["gunicorn", "app.main:app", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000"]
  ```
- 生产环境使用 `gunicorn + uvicorn worker`。
- Nginx 反向代理（配置见用户提供的示例）。

### 8. 提供的测试服务器容器信息（示例）
用户已部署以下容器（可根据实际调整）：
- MySQL：`192.168.164.81:3306`，数据库 `agent`，用户 `lidongyang/0828`
- Redis：`192.168.164.81:6379`，密码 `0828`
- Nginx：`192.168.164.81:8080`

### 9. 开发启动命令
```bash
# 开发模式（热重载）
uv run python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 生产模式
uv run python -m uvicorn app.main:app --port 8000
```

## 使用本技能时的建议
- 当用户要求“新增一个模块”或“实现微信登录”时，严格按照上述分层放置代码（路由 → service → repository）。
- 所有数据库操作必须使用 SQLAlchemy 异步 API（`await session.execute(...)`）。
- 对于阻塞操作（如 OSS 上传、微信支付回调验签），统一使用 `asyncio.to_thread` 包装。
- JWT 过期时间建议 7~15 天，与微信 session_key 生命周期无关。
- 日志使用 `loguru`，在 `config.py` 中统一配置。
