# Wonderloom

个人网站「光怪陆离的小屋」。Astro 静态多页面，中文优先；内容、首页编排与视觉样式各自独立。

## 开发

```sh
nvm use
npm ci
npm run dev
npm run check
npm run build
npm run test:site
```

Node 精确版本见 `.nvmrc`。不更改全局默认版本。依赖版本与 lockfile 一起维护。

## 内容与布局

- `src/content/`：网站专属项目、系列与单篇导读。`src/generated/writing-lab/` 是构建时从指定公开 Writing-Lab 的 published 作者稿机械生成的只读产物，绝不手改或提交；outline、note、草稿不导入。
- `src/data/home.ts`：首页策展顺序与开场文案。使用内容 ID，不复制详情正文。
- `src/data/content-sources.ts`：公开文章标题与 URL 的唯一权威；导读和系列章节只保存 `sourceId`。`source-evidence.ts` 是独立核验映射。
- `src/data/content-network.ts`：主题、阅读路径和人工关系；不得从共享标签自动推导关系。
- `src/data/media.ts`：图片元数据，来源记录在 `docs/content-sources.md`。
- `src/lib/content.ts`：引用解析和路由的唯一实现；缺少引用直接失败。作者稿的稳定路由规则在 `src/data/article-identities.js`。
- `docs/design/notebook-language.md`：正式页面的视觉规范，先查颜色语义、字阶、行高、版面和窄屏全文处理，再改页面。`src/styles/tokens.css` 是对应的实现值；正文不包含样式类名。

不虚构项目、发表状态或演示链接。不能因有本地仓库就假设它公开。Lumice bench 是性能看板，不是在线 Demo。第三方照片不默认复用，科学图不得裁掉坐标轴/图例或用滤镜改变含义。

内容组织、迁移边界和后续候选见 `docs/content-blueprint.md`；来源细节见 `docs/content-sources.md`。

## 当前边界

PR/main CI、Pages 自动部署与 `https://wonderloom.space/` 公网浏览器验收已通过，发布环境仅允许 main。主域名及 www 证书有效，已开启 Enforce HTTPS。`.xyz` 的 Cloudflare DNS 与免费转发已生效，apex/www 的 HTTP/HTTPS 301、路径/query 保留与证书校验均通过；迁移时旧 DNS 缓存的影响与验收方法见 `docs/verification/ci-pages-release.md`。发布操作与回退见 `docs/deployment.md`。原始项目及 Writing-Lab 保持只读。跨 session 交接、当前授权与任务状态见 `scratchpad/HANDOFF.md`（本地，不入 git）。
