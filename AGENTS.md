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

- `src/content/`：网站专属项目/系列导读，公开章节标题和来源 URL。正文目前在原发布平台，不要直接导入 Writing-Lab 草稿。
- `src/data/home.ts`：首页策展顺序与开场文案。使用内容 ID，不复制详情正文。
- `src/data/media.ts`：图片元数据，来源记录在 `docs/content-sources.md`。
- `src/lib/content.ts`：引用解析和路由的唯一实现；缺少引用直接失败。
- `src/styles/tokens.css`：视觉变量；布局在 components/pages，正文不包含样式类名。

不虚构项目、发表状态或演示链接。不能因有本地仓库就假设它公开。Lumice bench 是性能看板，不是在线 Demo。第三方照片不默认复用，科学图不得裁掉坐标轴/图例或用滤镜改变含义。

## 当前边界

PR/main CI、Pages 自动部署与 `https://wonderloom.space/` 公网浏览器验收已通过，发布环境仅允许 main。主域名及 www 证书有效，已开启 Enforce HTTPS。`.xyz` 已由用户配置 Cloudflare 免费转发并提交 Nameserver 切换，当前等待父区委派发布、Cloudflare 激活及最终 HTTPS/路径/query 验收，见 `docs/verification/ci-pages-release.md`。发布操作与回退见 `docs/deployment.md`。原始项目及 Writing-Lab 保持只读。跨 session 交接、当前授权与任务状态见 `scratchpad/HANDOFF.md`（本地，不入 git）。
