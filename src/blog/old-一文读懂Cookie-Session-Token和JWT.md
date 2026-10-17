---
title: Cookie、Session、Token、JWT，别再混为一谈
date: 2022-01-24
description: 从认证和授权讲起，分清 Cookie、Session、Token 和 JWT 各自解决什么问题，以及它们真正容易出错的安全边界。
tags:
  - 网络协议
  - 安全
  - 计算机基础
outline: true
---

这几个词经常被放在同一篇文章里，然后被画成一张“谁替代谁”的图。

但它们根本不在同一个维度：

- Cookie 是浏览器保存和发送数据的一种机制。
- Session 是服务端保存会话状态的一种方式。
- Token 是访问资源时出示的凭证。
- JWT 是一种 Token 的具体格式。

把它们混在一起，很容易得出“Token 比 Session 安全”“JWT 可以绕过 CORS”这类错误结论。

## 认证和授权不是一回事

认证（Authentication）回答“你是谁”。

授权（Authorization）回答“你能做什么”。

登录成功只代表认证通过，不代表你有权限删除订单、查看财务数据或者修改别人的资料。权限判断必须在服务端完成，不能只靠前端隐藏按钮。

## Cookie 是通道，不是登录本身

HTTP 是无状态协议。服务端要认出后续请求来自同一个用户，就需要某种凭证。

Cookie 是浏览器在请求同一域名时自动携带的一小段数据。服务端可以通过 `Set-Cookie` 写入：

```http
Set-Cookie: session_id=abc123; HttpOnly; Secure; SameSite=Lax; Path=/
```

常见属性：

- `HttpOnly`：JavaScript 读不到，降低 XSS 窃取风险。
- `Secure`：只在 HTTPS 下发送。
- `SameSite`：限制跨站请求携带 Cookie，缓解 CSRF。
- `Domain` / `Path`：控制发送范围。
- `Max-Age` / `Expires`：控制有效期。

Cookie 不等于“登录状态”。它只是把凭证带在请求里的一种方式。你也可以把 token 放在 Cookie 里。

## Session 是服务端状态

Session 的典型流程是：

```text
用户登录
  -> 服务端创建 session
  -> 返回 session id
  -> 浏览器把 session id 存进 Cookie
  -> 后续请求带着 session id
  -> 服务端查 session store
```

Session 数据存在服务端，通常放在内存、Redis 或数据库中。

它的优点是服务端可以随时让会话失效，比如退出登录、封禁账号、强制下线。缺点是集群部署时要处理 session 共享，访问量大时也会增加存储和查询成本。

“Session 比 Cookie 安全”这句话不准确。安全取决于凭证如何生成、如何传输、Cookie 是否设置 `HttpOnly` / `Secure` / `SameSite`，以及服务端如何校验。

## Token 是凭证

Token 可以是随机字符串，也可以是结构化字符串。客户端在请求中携带它：

```http
Authorization: Bearer <token>
```

Token 的核心问题是：

- 怎么签发？
- 怎么验证？
- 怎么撤销？
- 存在哪里？
- 泄露后影响多大？

Token 不会自动绕过同源策略，也不会自动绕过 CORS。CORS 是浏览器对跨源请求的限制，Token 只是请求头里的内容。服务端仍然要正确配置 CORS，允许对应的来源和请求头。

## JWT 是 Token 格式，不是“加密 Token”

JWT 由三部分组成：

```text
header.payload.signature
```

例如：

```text
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature
```

前两部分是 Base64URL 编码，不是加密。任何人都可以解码看到内容。签名保证的是“内容没有被篡改”，不是“内容不可见”。

所以：

- 不要把密码、身份证号、完整手机号等敏感信息塞进 payload。
- 不要因为用了 JWT 就认为数据是保密的。
- 服务端必须验证签名、算法、过期时间、签发者和受众。

JWT 常见用途是短期 access token。它适合无状态验证，但也带来了撤销麻烦：token 在过期前通常一直有效。需要撤销时，得配合短有效期、refresh token 轮换、黑名单或版本号等机制。

## JWT 放在哪里

常见选择：

**localStorage**

- JavaScript 可以读取。
- 一旦 XSS，token 可能直接被偷走。
- 不受 CSRF 影响，因为不会自动随请求发送。

**HttpOnly Cookie**

- JavaScript 读不到，XSS 窃取难度更高。
- 会自动随请求发送，需要 CSRF 防护。
- 适合把 token 当作会话凭证，而不是让前端到处手动拼接 Authorization。

没有一种存储方式能同时消灭 XSS 和 CSRF。选择的是攻击面和工程约束。

## access token 和 refresh token

Access token 有效期短，用于访问业务接口。

Refresh token 有效期长，用于换取新的 access token。它应该：

- 只发送给刷新接口。
- 存放在更安全的位置。
- 支持轮换和撤销。
- 检测重复使用。

不要把一个有效期很长的 JWT 当成万能钥匙。token 泄露后，过期时间就是攻击窗口。

## 密码存储不要自己发明

密码必须使用专门的慢哈希算法存储，比如 Argon2id、bcrypt 或 scrypt，并配合随机盐。

不要用 MD5、SHA1、普通 SHA256 直接存密码。它们速度太快，适合校验数据完整性，不适合抵抗离线暴力破解。

## Session 和 Token 不是敌人

现实系统里它们经常组合使用：

- 服务端用 session 保存登录状态，Cookie 里放 session id。
- 服务端签发短期 JWT，前端通过 Authorization 头访问 API。
- JWT 放在 HttpOnly Cookie 里，同时做 CSRF 防护。
- 网关负责验证 JWT，业务服务只关心用户身份和权限。

选择的关键不是“哪个更现代”，而是：

- 你能不能接受服务端有状态？
- 你需要即时撤销吗？
- 客户端是浏览器、移动端还是第三方服务？
- 你的团队能维护好密钥、轮换和权限模型吗？

## 最后

Cookie 是携带方式，Session 是服务端状态，Token 是凭证，JWT 是凭证格式。

安全不是一个缩写带来的。它来自正确的传输、存储、过期、撤销和权限校验。
