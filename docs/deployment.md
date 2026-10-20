# 部署与回退

Wonderloom 使用 GitHub Actions 将 `main` 的静态构建产物发布到 GitHub Pages。正式生产地址为 <https://wonderloom.space/>；Astro 在构建时以这个根域名生成正式页面的 canonical URL 和 `og:url`。

## 已实现的仓库流程

`.github/workflows/pages.yml` 在以下事件触发：

- 以 `main` 为目标的 pull request：仅运行 `npm ci`、`npm run check`、`npm run build` 和 `npm run test:site`。
- 推送到 `main`：运行相同检查；全部成功后，上传本次 `dist/` 并部署该 artifact。
- 手动运行：仅从 `main` 运行时才会上传并部署。

PR 不上传生产 artifact，也不会部署。PR 的旧检查可被同一 PR 的新提交取消；生产部署以 `pages` 并发组串行，已经开始的发布不会被新发布取消。工作流将 Actions 固定到注释中标注的已核验版本提交，未使用长期 token secret。

### Writing-Lab 作者稿刷新

检查 job 会额外只读检出 `LoveDaisy/ice_halo_notes@main`（含 LFS），将其 `HEAD` 作为本次构建的唯一源版本，并通过 `WRITING_LAB_SOURCE_DIR` 交给 `npm run sync:content`。生成的正文、资源和 `public/writing-lab-assets/source.json` 必须共享这个 SHA；任一转换、资源校验、测试或构建失败都会阻止 artifact 上传，线上上一次成功版本保持不变。

源仓可安装 [`ops/writing-lab/notify-wonderloom.yml`](../ops/writing-lab/notify-wonderloom.yml)：在源仓的 `main` 推送后向本仓 `pages.yml` 发送 `workflow_dispatch`。在源仓 Actions secret 中设置 `WONDERLOOM_DISPATCH_TOKEN`，它应是**仅**针对 `LoveDaisy/wonderloom` 的细粒度 PAT 或 GitHub App 凭据，并只有 `Actions: write`（Metadata 自动只读）。不要复制本机 `gh` token，也不要在日志或聊天中粘贴密钥。撤销刷新权限时删除该 secret；通知失败可从 wonderloom 的 Actions 页面在 `main` 手动重跑。

本地复现 CI：

```sh
nvm use
npm ci
npm run test:content
WRITING_LAB_SOURCE_DIR=/absolute/path/to/现代冰晕研究漫谈 npm run sync:content
npm run check
npm run build
npm run test:site
```

`test:site` 对构建产物检查标题、语言、图片、内部链接和锚点，并额外确认正式页面的 canonical/`og:url` 是 `https://wonderloom.space`，而试样与 `404.html` 均为 `noindex, nofollow`、不带正式 canonical。

## GitHub 设置与域名验收

2026-10-19 已完成一次性设置：GitHub Pages 来源为 **GitHub Actions**，`github-pages` 环境仅允许 `main`，仓库 custom domain 为 `wonderloom.space`，域名所有权为 verified。DNS 已生效，主域名与 www 的证书有效，已开启 Enforce HTTPS。PR 检查、main 部署及主域名公网浏览器验收均已成功，记录见[发布验收](verification/ci-pages-release.md)。后续通过 PR 修改并合入 main 即会自动发布，无须重复这些设置。

若重建托管环境，应先完成域名所有权验证、设置上述 Pages 来源/环境/custom domain，并复核 Pages API 的 `build_type=workflow` 和 `cname`，再部署和切换 DNS。Actions 部署不依赖仓内 `CNAME` 文件。

两个域名继续在 GoDaddy 注册/续费。主域名 `wonderloom.space` 的 DNS 仍由 GoDaddy 管理：

- `wonderloom.space` apex：`185.199.108.153`、`185.199.109.153`、`185.199.110.153`、`185.199.111.153` 四条 A 记录。
- `www.wonderloom.space`：CNAME 指向 `lovedaisy.github.io`。
- 保留已经用于 GitHub 域名验证的 `_github-pages-challenge-LoveDaisy` TXT，以及所有无关的 MX、TXT、CAA 和其他子域记录。

备用域名 `wonderloom.xyz` 采用 Cloudflare Free DNS 与 Single Redirect。2026-10-19 已完成以下配置，父区委派与公共 DNS 已切换，Cloudflare 已激活。经 Google 公共 DoH 解析的 12 组 HTTP/HTTPS 请求通过正常证书校验，均以 301 保留路径/query 到达主站；本地默认 resolver 当时仍有旧缓存，详见验收记录：

- 分配的 Nameservers：`aida.ns.cloudflare.com`、`kyrie.ns.cloudflare.com`。这是当前账号/zone 的实际值，重建 zone 时应使用届时分配的值。
- `A @ 192.0.2.1` 与 `CNAME www wonderloom.xyz` 均设为 Proxied（橙云）；占位 A 用于纯转发，不需要源站。
- `_domainconnect` CNAME 继续保留原目标并设 DNS only；`_dmarc` TXT 保留原值。其他非本站记录同样保留。
- Single Redirect 的 **匹配条件**（Custom filter expression）：`(http.host eq "wonderloom.xyz") or (http.host eq "www.wonderloom.xyz")`。
- **目标 URL** 选择 Dynamic，表达式为 `concat("https://wonderloom.space", http.request.uri.path)`，状态码 301，开启 Preserve query string，并启用规则。匹配条件与目标 URL 是两个不同输入框。

原 GoDaddy 域名转发实测仅首页可用，子路径 404、查询串丢失，因此改用上述规则；CNAME 本身不能代替 HTTP 重定向。[Cloudflare 纯转发域名官方配置](https://developers.cloudflare.com/fundamentals/manage-domains/redirect-domain/)说明了占位 A、动态目标和查询串保留方式。

排查迁移时，区分注册局 RDAP、父区委派、权威应答、递归 DNS 缓存与实际 HTTP/TLS。Cloudflare 处于 Pending 时，即使记录为橙云，也会暂时按 DNS only 返回配置值；注册局 RDAP 显示新 NS 也不等于父区委派已经发布。激活后，橙云的公共 A/AAAA 应答为 Cloudflare 边缘地址，无须将配置中的占位 A 改成这些地址。确认新 NS 和证书生效后，实测两种协议、apex/www、首页/带路径/query 的完整跳转链；本地 resolver 若仍缓存旧服务，可通过公共 DoH 对照取证，不将定向请求与普通解析结果混写。回退可恢复原 ns31/ns32.domaincontrol.com 与保留的 GoDaddy 转发配置，但完整路径转发会退回原先缺陷。

若主域名 DNS 正确但迟迟没有证书，可先用 `gh api repos/LoveDaisy/wonderloom/pages/health` 核对 apex/www 的 `is_valid`、`is_https_eligible` 与 CAA 错误，再按 [GitHub 官方证书排障](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https#troubleshooting-certificate-provisioning-certificate-not-yet-created-error)移除并重新保存同一 custom domain，触发重新申请。此操作会短暂解除绑定，必须立即恢复原值；不是日常发布步骤。证书 approved 后，正常校验两个域名的 TLS，再开启 Enforce HTTPS 并实测 HTTP 跳转。

首次部署、DNS 传播和证书签发完成后，必须以不带 `-k` 的请求检查首页、`/writing/`、`/writing/ice-halos/`、`/projects/lumice/`、`/about/` 与不存在路径。用带路径和查询串的 `.xyz` / `www.xyz` 请求确认首跳 `Location` 和最终 URL；不能以首页 200 替代该检查。实际 run、部署 SHA、DNS、证书和跳转结果应写入 `docs/verification/ci-pages-release.md`。

## 失败诊断、重新部署与回退

- PR 检查失败：在 Actions run 中先定位 `npm ci`、`check`、`build` 或 `test:site` 的失败命令；修复后推送同一 PR。部署 job 在 PR 上应显示 skipped。
- 主分支检查失败：不会上传 artifact 或部署。修复后提交到 `main`，或在 Actions 页面从 `main` 手动重新运行。
- Pages 部署失败：检查 `github-pages` environment 的分支规则、Pages source、custom domain 和 Actions job 日志；不要把默认 `github.io` 地址或 DNS 记录当成成功证据。
- 已发布版本需要回退：对普通发布 commit 使用 `git revert <commit>`；对合并提交使用 `git revert -m 1 <merge-commit>`，以 main 父提交为基准。通过 PR 检查后合入 `main`，回退会经过同一套检查并自动部署；不要通过重跑很旧的 workflow 覆盖较新的站点。


### 作者稿更新与发布新鲜度

网站每次构建只读检出写作仓 `main`，记录 SHA 并传入所有内容检查。`test:site` 校验生成 manifest、实际源文件、公开 `/writing-lab/source.json` 和资源哈希一致后才上传 artifact。正文生成目录与原图都不进入网站 Git。

部署 job 持有共享 `pages` 锁，紧邻 deploy-pages 调用前核对两仓当前 `main`。任一候选 SHA 过期则跳过 artifact，并用本仓 job 限定的 `actions: write` 权限补发一次最新 main 构建。部署后再检查一次，捕获门禁后的源更新。读取错误、格式异常和补发失败均明确失败；上次成功站点继续服务。外部 ref 不受部署锁控制，因此保证是不会回盖已发布的新版本、更新停止且触发成功后最终收敛，而非瞬时实时一致。公网页面与 CDN 不参与门禁判断。

`ops/writing-lab/notify-wonderloom.yml` 安装到源仓 `.github/workflows/notify-wonderloom.yml`。源仓 `main` push 或手动重试触发网站 `pages.yml`；`source_hint` 只作审计。源仓 secret `WONDERLOOM_DISPATCH_TOKEN` 使用仅选 `LoveDaisy/wonderloom` 的 fine-grained token，Repository permissions 为 Actions: Read and write（Metadata 自动附带），不需要 Contents 写权限。到期或撤销后通知会失败；替换同名 secret 后重跑通知即可。撤销自动通知时禁用源 workflow 并删除 secret；网站仍可手动构建。

本地 `dev/check/build` 都先同步。显式 `WRITING_LAB_SOURCE_DIR` 必须是干净 checkout；可附 `WRITING_LAB_SOURCE_SHA` 验证预期提交。不设置目录时，脚本解析固定 `refs/heads/main` 并检出该 SHA，仅获取正文实际引用的 LFS 对象。转换失败会使生成态失效，不回退到本地残留正文。新增 published 作者稿无需预先创建知乎记录。
