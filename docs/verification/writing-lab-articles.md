# Writing-Lab 作者稿验证记录

## 本地实现证据

- 源快照：`b7784b8c96c742ee4f49f2277fe424bfda213ae4`。
- `npm run sync:content`：发现 11 篇 `directors-cut + published` 作者稿，收集 66 个唯一引用图像；生成 manifest、正文和资源均使用同一 SHA。
- `npm run test:content`：身份、精确删改和链接映射单测通过。
- `npm run check`、`npm run build`、`npm run test:site`：待每次变更以 `.nvmrc` 指定 Node 重跑；`test:site` 额外验证 manifest、原图、内部路由、目录和转换边界。

## Owner 待办（未在本地 phase 中声称完成）

1. 在 Writing-Lab 仓安装 `ops/writing-lab/notify-wonderloom.yml`，并配置最小权限的 `WONDERLOOM_DISPATCH_TOKEN`。
2. 合入网站 `main` 后，核验 Actions 对源仓的只读 checkout、LFS、Pages artifact 与 `source.json`。
3. 使用一条经授权的源仓 `main` 更新实测「通知 → 网站构建 → Pages → 公网」；保存两个 workflow run 与公网页面/资源证据。
4. 在 1440、768、390、360 审视全文、公式、表格、GIF、目录、前后篇和原图；确认页面根无横向溢出、无 JS 可读、键盘 focus 与 reduced-motion 正常。
