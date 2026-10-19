# content-weave 本地验收

验收时间：2026-10-19（UTC+8）  
范围：本地 `feat/content-weave`；不包含 PR、CI、合并或公网发布。

## 自动验证

| 检查 | 结果 |
| --- | --- |
| `nvm use && npm run check` | 通过：0 errors / 0 warnings / 0 hints |
| `npm run build` | 通过：生成 29 个静态页面 |
| `npm run test:site` | 通过：806 个本地链接/资源；所有公开页的 canonical、`og:url`、`h1`、图片与锚点均通过 |
| 内容路由断言 | `test:site` 覆盖探索、3 个主题、2 条路径、8 篇导读及 Lumice Integral |

来源和网络的故障注入也已完成后恢复：

- 临时把一条关系的端点改成 `article:missing`，`npm run build` 以 `Relation target: missing content reference` 失败；
- 临时篡改 `color-space-basics` 的来源 URL，构建以 `Content sources: evidence mismatch` 失败。

这证明主题、路径、关系、系列章节和单篇导读都不能绕开集中解析的作品/来源校验。

## 浏览器与可访问性抽样

对构建产物启动本地静态服务，以 Chrome 无头模式取样；截图保存在本地、被 Git 忽略的 `.review/content-weave/`：

| 页面 | 视口 | 结果 | 证据 |
| --- | ---: | --- | --- |
| `/explore/` | 1440 × 768 | 主题入口、路径和图谱首屏可读 | `explore-1440.png` |
| `/explore/topics/ice-halos/` | 768 × 1024 | 主题作品卡与局部关系图可读 | `topic-768.png` |
| `/writing/articles/color-space-basics/` | 390 × 844 | 导读、知乎原文边界和侧栏自然转为单列 | `guide-390.png` |
| `/projects/lumice-integral/` | 320 × 720 | 项目类型、内容与导航可读 | `project-320.png` |

生成 HTML 保留 SVG 中每个节点的命名原生链接和同一关系数据生成的文本列表；无 JavaScript 时这些入口仍可直接访问。主题高亮控件初始 `hidden`，脚本可用后才显示，不会隐藏节点；`prefers-reduced-motion` 下没有持续动画。`test:site` 同时验证所有内部目标、深链接产物和真实 404 产物。

## 未在本地声明的事项

本记录只说明本地构建与静态浏览器抽样。PR CI、main 部署、正式域名刷新/深链/404 smoke 仍由 owner 在后续 M4 执行并另行记录。
