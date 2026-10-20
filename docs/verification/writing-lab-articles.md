# Writing-Lab 作者稿验证记录

## 本地实现证据

- 源快照：`fb13a21263b776c4ed6b00cfe1739683ebe81471`。
- `npm run sync:content`：发现 11 篇 `directors-cut + published` 作者稿，收集 66 个唯一引用图像；生成 manifest、正文和资源均使用同一 SHA。
- `npm run test:content`：8 组测试通过，含原文保真、代码围栏、未来无知乎稿、相同源提交确定性生成、失败清理、资源身份、历史 URL 章节匹配与新鲜度/补发失败。
- `npm run check`、`npm run build`、`npm run test:site`：已在 Node 22.23.3 通过：46 页面、1,465 个本地链接/资源，11 篇数学片段与源稿逐项一致，66 张图的哈希/尺寸一致。

## 发布与自动更新实测（2026-10-20）

- [网站 PR #8](https://github.com/LoveDaisy/wonderloom/pull/8) 已合入，main 为 `7ab2279197cb89bec9b8b238debfc3d5bbd14961`；[首次构建和 Pages 发布](https://github.com/LoveDaisy/wonderloom/actions/runs/39450510778) 成功。
- [源仓 PR #1](https://github.com/LoveDaisy/ice_halo_notes/pull/1) 仅安装通知 workflow，未修改正文，也未推送作者原有的 3 个本地提交。源仓 main 为 `d43bf079bc123aa4ad23e808185372b9b4a09098`。
- 用户配置的 `WONDERLOOM_DISPATCH_TOKEN` 已通过[真实源仓通知](https://github.com/LoveDaisy/ice_halo_notes/actions/runs/39450860867)验证；随即触发[网站 workflow_dispatch 构建和 Pages 发布](https://github.com/LoveDaisy/wonderloom/actions/runs/39450873307)，两个 job 均成功。
- 正常 HTTPS 请求[公开追溯文件](https://wonderloom.space/writing-lab/source.json)返回源提交 `d43bf079bc123aa4ad23e808185372b9b4a09098`、11 篇、66 张图；第 7 篇源稿链接指向同一提交。
- 公网第 0、6、7、9 篇 × 390/1440 共 8 组禁页面脚本的浏览器检查通过：无根横向溢出、坏图、公式错误或缺失目录锚点。本地全部 11 篇另有 33 组多尺寸检查。
- 实际触发更新来自通知配置合入；正文变化、失败清理和乱序保护由合成源与门禁回归覆盖，没有对线上作者稿做破坏性演练。


### 视觉核验边界

修订后第 7 篇在 1440/768/390 的根页面无横向溢出，已审视截图中的正文、图版、公式与表格。通用 inspector 对纸色、页边线、非居中研究手记布局、长文无动效、KaTeX 多字体和数学滚动区域提出营销页规则告警；保留用户已定稿的研究手记视觉及原文标题，不据此重做站点。完整稿件以科学内容可读和真实浏览器检查为准，不将该通用 lint 的退出 1 写成全绿。

- 全新远端获取演练已通过（未设置本地源目录）：固定 main SHA，按引用下载 LFS，11 篇/66 图。
- 全部 11 篇在 360/768/1440 共 33 组浏览器检查通过；页面脚本禁用，根无横向溢出、无坏图/公式错误/缺失目录锚点。
