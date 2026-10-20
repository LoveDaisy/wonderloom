# Writing-Lab 作者稿验证记录

## 本地实现证据

- 源快照：`fb13a21263b776c4ed6b00cfe1739683ebe81471`。
- `npm run sync:content`：发现 11 篇 `directors-cut + published` 作者稿，收集 66 个唯一引用图像；生成 manifest、正文和资源均使用同一 SHA。
- `npm run test:content`：8 组测试通过，含原文保真、代码围栏、未来无知乎稿、相同源提交确定性生成、失败清理、资源身份、历史 URL 章节匹配与新鲜度/补发失败。
- `npm run check`、`npm run build`、`npm run test:site`：已在 Node 22.23.3 通过：46 页面、1,465 个本地链接/资源，11 篇数学片段与源稿逐项一致，66 张图的哈希/尺寸一致。

## Owner 待办（未在本地 phase 中声称完成）

1. 在 Writing-Lab 仓安装 `ops/writing-lab/notify-wonderloom.yml`，；用户已配置 `WONDERLOOM_DISPATCH_TOKEN`，owner 已核验仓库与名称，权限仍待实际触发验证。
2. 合入网站 `main` 后，核验 Actions 对源仓的只读 checkout、LFS、Pages artifact 与 `source.json`。
3. 使用一条经授权的源仓 `main` 更新实测「通知 → 网站构建 → Pages → 公网」；保存两个 workflow run 与公网页面/资源证据。
4. 在 1440、768、390、360 审视全文、公式、表格、GIF、目录、前后篇和原图；确认页面根无横向溢出、无 JS 可读、键盘 focus 与 reduced-motion 正常。


### 视觉核验边界

修订后第 7 篇在 1440/768/390 的根页面无横向溢出，已审视截图中的正文、图版、公式与表格。通用 inspector 对纸色、页边线、非居中研究手记布局、长文无动效、KaTeX 多字体和数学滚动区域提出营销页规则告警；保留用户已定稿的研究手记视觉及原文标题，不据此重做站点。完整稿件以科学内容可读和真实浏览器检查为准，不将该通用 lint 的退出 1 写成全绿。

- 全新远端获取演练已通过（未设置本地源目录）：固定 main SHA，按引用下载 LFS，11 篇/66 图。
- 全部 11 篇在 360/768/1440 共 33 组浏览器检查通过；页面脚本禁用，根无横向溢出、无坏图/公式错误/缺失目录锚点。
