# Wonderloom · 光怪陆离的小屋

一些想弄明白的问题，一些动手做出来的东西。

个人网站：用项目、系列文章与真实研究图像，连接光学、历法、地理和计算。已上线至 <https://wonderloom.space/>，PR 自动检查、`main` 自动发布与公网浏览器验收已通过。备用域名 `.xyz` 的完整链接转发仍待补齐，当前证据见[发布验收](docs/verification/ci-pages-release.md)。

## 本地运行

```sh
nvm use
npm ci
npm run dev
```

默认地址：<http://127.0.0.1:4321/>。仅监听本机，不对外网开放。Node 精确版本在 `.nvmrc`，不需要更改机器的默认 Node。

## 当前首页：缃色 · 黛蓝（2026-10-19）

正式入口：<http://127.0.0.1:4321/>。作者已选定传统色灵感的缃色 / 黛蓝方向，首页以「好奇心 → 探索 → 造物 → 继续探索」自然展开。章节随内容决定高度，无滚动停靠、平滑滚动或全屏高度约束；织线只在点击「换一种织法」时变化。

全站共用「首页 / 系列文章 / 程序项目 / 关于」导航，进入独立板块。末章以浏览入口和作者介绍收束，不重复陈列前三个系列。Feed 与单页面小程序入口待实际内容整理后加入；更多文章和项目的策展也留待下一阶段。

正式首页固定缃色 / 黛蓝，项目、文章、关于页沿用同一套色彩与导航。实现位于 `src/components/StoryHome.astro`、`src/styles/loom-story.css` 与 `src/scripts/loom-story.ts`，主页面与试样共享组件；全站导航在 `src/components/SiteHeader.astro`。

历史视觉试样仍可从 <http://127.0.0.1:4321/directions/> 访问：A 手稿、B 观测室、C 织机，以及可比较两组配色的 `/directions/loom-story/`。试样标记 `noindex, nofollow`，正式首页不包含配色试验控件。

设计取舍见 [章节与色彩设计](docs/design/chapter-flow.md)，当前验收见 [首版收敛验收](docs/verification/first-edition-final.md)。此前的试样验收记录作为历史保留。

生产构建与预览：

```sh
npm run check
npm run build
npm run test:site
npm run preview
```

当前 Astro 7 的 `preview` 会启动后台服务，并打印停止、状态和日志命令；停止时运行 `npx astro preview stop`。源码改动后需要重新 build 才会更新生产预览，开发时使用 `npm run dev`。

依赖固定为 Astro 7.4.0、TypeScript 6.0.3、`@astrojs/check` 0.9.10。检查器当前不支持 TypeScript 7，不能只升级 TypeScript 而不验证检查器兼容性。

## 首版内容

- 首页：以具体问题进入内容，而非按日期自动排列。
- 项目：Lumice 介绍、源码与下载链接、相关系列。
- 文章：现代冰晕研究漫谈、重新发明农历、寻找高山的导读和公开文章目录。
- 关于：作者与 Wonderloom 名字的来历。
- 自定义 404 页面。

章节明确链接到知乎原文，目前不托管全文。未发表稿、第三方照片和未确认公开的源码不会自动进入网站。尚无真实可玩的小实验，因此没有空的实验室页面。

## 内容与样式分离

| 要改什么 | 改哪里 |
|---|---|
| 项目介绍 | `src/content/projects/*.md` |
| 系列导读、章节顺序与原文链接 | `src/content/series/*.md` |
| 首页精选与出现顺序 | `src/data/home.ts` |
| 网站身份和导航 | `src/data/site.ts` |
| 图片及说明 | `src/assets/`、`src/data/media.ts` |
| 颜色、字体与尺寸变量 | `src/styles/tokens.css` |
| 页面布局 | `src/pages/`、`src/components/`、`src/layouts/` |

详情内容通过 Astro collections 校验。首页与项目/系列关联必须引用存在的条目，否则构建失败。路由统一由 `src/lib/content.ts` 生成。

网站导读属于本站编辑文案，不是原始文章正文。未来若导入全文，应从明确选定的公开版本导出，不维护两份独立编辑的正文。

## 来源与验证

- [内容和素材来源](docs/content-sources.md)
- [首版验收记录](docs/verification/first-edition.md)
- [浏览器检查数据](docs/verification/browser-checks.json)

本地视觉截图在被 Git 忽略的 `.review/` 中。原始项目、Writing-Lab 及 Obsidian 公开快照在本轮均未改动。

## 发布

生产地址配置为 `https://wonderloom.space`，正式页面会生成该域名的 canonical URL 和 `og:url`；视觉试样及 404 保持 `noindex, nofollow`。`.github/workflows/pages.yml` 对以 `main` 为目标的 PR 运行检查，并在 `main` 成功构建后发布同一份 `dist/` artifact 到 GitHub Pages。

Pages 已启用 Actions 发布源、绑定 `wonderloom.space`，发布环境仅允许 `main`。域名所有权、DNS 与 HTTPS 已验证，已开启 Enforce HTTPS；`www` 跳转主域名。`.xyz` 与 `www.xyz` 已配置 Cloudflare 完整链接转发，Nameserver 切换已提交，等待委派生效、Cloudflare 激活及最终验收。操作顺序、故障排查、重新部署和回退见[部署手册](docs/deployment.md)，实际 run 与剩余验收项见[发布验收](docs/verification/ci-pages-release.md)。

源码位置：`~/Codes/wonderloom`；工作区入口：`~/Virtual-Jiajie/Jiajie-Codes/wonderloom`。
