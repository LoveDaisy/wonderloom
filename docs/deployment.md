# 部署与回退

Wonderloom 使用 GitHub Actions 将 `main` 的静态构建产物发布到 GitHub Pages。正式生产地址为 <https://wonderloom.space/>；Astro 在构建时以这个根域名生成正式页面的 canonical URL 和 `og:url`。

## 已实现的仓库流程

`.github/workflows/pages.yml` 在以下事件触发：

- 以 `main` 为目标的 pull request：仅运行 `npm ci`、`npm run check`、`npm run build` 和 `npm run test:site`。
- 推送到 `main`：运行相同检查；全部成功后，上传本次 `dist/` 并部署该 artifact。
- 手动运行：仅从 `main` 运行时才会上传并部署。

PR 不上传生产 artifact，也不会部署。PR 的旧检查可被同一 PR 的新提交取消；生产部署以 `pages` 并发组串行，已经开始的发布不会被新发布取消。工作流将 Actions 固定到注释中标注的已核验版本提交，未使用长期 token secret。

本地复现 CI：

```sh
nvm use
npm ci
npm run check
npm run build
npm run test:site
```

`test:site` 对构建产物检查标题、语言、图片、内部链接和锚点，并额外确认正式页面的 canonical/`og:url` 是 `https://wonderloom.space`，而试样与 `404.html` 均为 `noindex, nofollow`、不带正式 canonical。

## GitHub 设置与域名验收

2026-10-19 已完成一次性设置：GitHub Pages 来源为 **GitHub Actions**，`github-pages` 环境仅允许 `main`，仓库 custom domain 为 `wonderloom.space`，域名所有权为 verified。PR 检查和首次 main 部署均已成功，记录见[发布验收](verification/ci-pages-release.md)。后续通过 PR 修改并合入 main 即会自动发布，无须重复这些设置。

若重建托管环境，应先完成域名所有权验证、设置上述 Pages 来源/环境/custom domain，并复核 Pages API 的 `build_type=workflow` 和 `cname`，再部署和切换 DNS。Actions 部署不依赖仓内 `CNAME` 文件。

域名记录由 GoDaddy 管理时，仅变更本站记录：

- `wonderloom.space` apex：`185.199.108.153`、`185.199.109.153`、`185.199.110.153`、`185.199.111.153` 四条 A 记录。
- `www.wonderloom.space`：CNAME 指向 `lovedaisy.github.io`。
- 保留已经用于 GitHub 域名验证的 `_github-pages-challenge-LoveDaisy` TXT，以及所有无关的 MX、TXT、CAA 和其他子域记录。
- `wonderloom.xyz` 与 `www.wonderloom.xyz`：在 GoDaddy 使用不遮蔽的 301 forwarding 到 `https://wonderloom.space`，并实际验证 HTTPS、路径和查询串都保留；CNAME 不能代替 HTTP 重定向。

首次部署、DNS 传播和证书签发完成后，必须以不带 `-k` 的请求检查首页、`/writing/`、`/writing/ice-halos/`、`/projects/lumice/`、`/about/` 与不存在路径。用带路径和查询串的 `.xyz` / `www.xyz` 请求确认首跳 `Location` 和最终 URL；不能以首页 200 替代该检查。实际 run、部署 SHA、DNS、证书和跳转结果应写入 `docs/verification/ci-pages-release.md`。

## 失败诊断、重新部署与回退

- PR 检查失败：在 Actions run 中先定位 `npm ci`、`check`、`build` 或 `test:site` 的失败命令；修复后推送同一 PR。部署 job 在 PR 上应显示 skipped。
- 主分支检查失败：不会上传 artifact 或部署。修复后提交到 `main`，或在 Actions 页面从 `main` 手动重新运行。
- Pages 部署失败：检查 `github-pages` environment 的分支规则、Pages source、custom domain 和 Actions job 日志；不要把默认 `github.io` 地址或 DNS 记录当成成功证据。
- 已发布版本需要回退：对普通发布 commit 使用 `git revert <commit>`；对合并提交使用 `git revert -m 1 <merge-commit>`，以 main 父提交为基准。通过 PR 检查后合入 `main`，回退会经过同一套检查并自动部署；不要通过重跑很旧的 workflow 覆盖较新的站点。
