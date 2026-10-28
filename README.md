# Wonderloom · 光怪陆离的小屋

一些想弄明白的问题，一些动手做出来的东西。

个人网站：用项目、系列文章与真实研究图像，连接光学、历法、地理和计算。已上线至 <https://wonderloom.space/>，PR 自动检查、`main` 自动发布与公网浏览器验收已通过。备用域名 `.xyz` 通过 Cloudflare 完整转发至主站，保留路径与查询参数，证据见[发布验收](docs/verification/ci-pages-release.md)。

## 本地运行

```sh
nvm use
npm ci
WRITING_LAB_SOURCE_DIR=/path/to/现代冰晕研究漫谈 npm run dev
```

默认地址：<http://127.0.0.1:4321/>。仅监听本机，不对外网开放。Node 精确版本在 `.nvmrc`，不需要更改机器的默认 Node。

## 正式页面视觉规范

正式页面使用[绕线与经纬](docs/design/stitch-loom.md)：纸、墨、宋体与阅读节奏贯穿全站；首页绕线板与探索经纬图承载顺序与人工关系，其余页面只在内容确有顺序或直接联系时使用线与节点。文章正文居中，目录随滚动高亮。正式全站的视觉效果仍待作者逐页验收。

新增或修改正式页面时，先看[视觉原则与记号词汇表](docs/design/stitch-loom.md)。实现取值在 [`src/styles/tokens.css`](src/styles/tokens.css)，`npm run test:site` 检查新调色板与内容/来源边界。旧版[笔记式视觉语言](docs/design/notebook-language.md)的配色与版式已废弃；其中正文宽度、阅读节奏、科学图完整、来源边界及窄屏可读的内容规则继续有效。历史试样保留独立样式。

全站共用「首页 / 文章 / 探索 / 项目 / 关于」导航。内容组织和来源边界见[内容蓝图](docs/content-blueprint.md)，当前视觉检查截图与数据见[浏览器矩阵](docs/verification/light-led-redesign/final/browser-matrix/report.json)。

历史视觉试样仍可从本地 `/directions/` 访问，标记为 `noindex, nofollow`。此前的[章节与色彩设计](docs/design/chapter-flow.md)及[首版收敛验收](docs/verification/first-edition-final.md)保留为历史记录，不作为当前正式页面的设计依据。

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

- 首页：以具体问题进入内容，而非按日期自动排列；可进入两条人工阅读路径。
- 探索：冰晕、光谱渲染、色彩科学三主题，以及可直接点击的关系图和等价关系列表。
- 项目：Lumice（本地软件）与 Lumice Integral（研究代码）的介绍、源码和明确的关联。
- 文章：现代冰晕研究漫谈的 11 篇 published 作者稿（其中第 0、6 篇保留本站导读）、以及其他系列和单篇导读。
- 关于：作者与 Wonderloom 名字的来历。
- 自定义 404 页面。

冰晕作者稿从公开 Writing-Lab 的 `directors-cut + published` 文稿机械生成；知乎仅保留为历史发表版本。未发表稿、第三方照片和未确认公开的源码不会自动进入网站。尚无真实可玩的小实验，因此没有空的实验室页面。

## 内容与样式分离

| 要改什么 | 改哪里 |
|---|---|
| 项目介绍 | `src/content/projects/*.md` |
| 系列导读、章节顺序与原文链接 | `src/content/series/*.md` |
| 首页精选与出现顺序 | `src/data/home.ts` |
| 网站身份和导航 | `src/data/site.ts` |
| 图片及说明 | `src/assets/`、`src/data/media.ts` |
| 正式页面颜色、字体、版面及记号语义 | `docs/design/stitch-loom.md`（正文/来源边界另见 `docs/design/notebook-language.md`） |
| 颜色、字体与尺寸变量 | `src/styles/tokens.css` |
| 页面布局 | `src/pages/`、`src/components/`、`src/layouts/` |

详情内容通过 Astro collections 校验。首页与项目/系列关联必须引用存在的条目，否则构建失败。路由统一由 `src/lib/content.ts` 生成。

网站导读属于本站编辑文案，不是原始文章正文。冰晕全文由 `npm run sync:content` 从写作仓单向生成；生成物被忽略，正文仍只在 Writing-Lab 编辑。开发时必须提供干净的 `WRITING_LAB_SOURCE_DIR`，CI 固定检出 `main` 的单一 SHA，并验证正文、资源和 manifest 使用同一 SHA。

内容组织原则、迁移边界和后续候选见[内容蓝图](docs/content-blueprint.md)。文章标题、URL 与来源证据的单一权威和核验方式见[内容和素材来源](docs/content-sources.md)。

## 来源与验证

- [内容和素材来源](docs/content-sources.md)
- [首版验收记录](docs/verification/first-edition.md)
- [浏览器检查数据](docs/verification/browser-checks.json)

本轮正式页面的浏览器截图与矩阵报告保存在 `docs/verification/light-led-redesign/final/browser-matrix/`。原始项目、Writing-Lab 及 Obsidian 公开快照均不在本站直接编辑。

## 发布

生产地址配置为 `https://wonderloom.space`，正式页面会生成该域名的 canonical URL 和 `og:url`；视觉试样及 404 保持 `noindex, nofollow`。`.github/workflows/pages.yml` 对以 `main` 为目标的 PR 运行检查，并在 `main` 成功构建后发布同一份 `dist/` artifact 到 GitHub Pages。

Pages 已启用 Actions 发布源、绑定 `wonderloom.space`，发布环境仅允许 `main`。域名所有权、DNS 与 HTTPS 已验证，已开启 Enforce HTTPS；`www` 跳转主域名。`.xyz` 与 `www.xyz` 的 Cloudflare 转发已生效，HTTP/HTTPS、证书及完整链接保留验收通过。操作顺序、故障排查、重新部署和回退见[部署手册](docs/deployment.md)，实际 run、验证方法与迁移缓存说明见[发布验收](docs/verification/ci-pages-release.md)。

源码位置：`~/Codes/wonderloom`；工作区入口：`~/Virtual-Jiajie/Jiajie-Codes/wonderloom`。
