# CI 与 Pages 发布验收

核验日期：2026-10-19（UTC+8）。当前状态：**CI、Pages 自动部署、主域名 DNS/TLS、强制 HTTPS 与公网浏览器验收已通过；备用域名 Cloudflare 已生效，经公共 DoH 解析的 12 组完整转发验收通过。** 默认本地 DNS 在复核时仍有旧 GoDaddy 缓存，具体边界见下文。

## 已完成

- [PR #1](https://github.com/LoveDaisy/wonderloom/pull/1) 已合入 main，首发提交为 `41b2f545f59bcdba51c4eafd1f90e3d09b93603a`。
- [PR CI](https://github.com/LoveDaisy/wonderloom/actions/runs/39229383741)：`Check site` success；artifact 上传与 `Deploy Pages` 均 skipped。
- [功能分支手动 CI](https://github.com/LoveDaisy/wonderloom/actions/runs/39229379800)：检查 success，部署 skipped，验证非 main 的手动运行不会发布。
- [main 首次构建与发布](https://github.com/LoveDaisy/wonderloom/actions/runs/39229646859)：检查与部署均 success；deployment `7170143872` 对应同一首发 SHA。
- [文档合入后的 main 构建与发布](https://github.com/LoveDaisy/wonderloom/actions/runs/39230265735)：检查与部署均 success，提交 `9373786170eb8b4e75a12e9415c188c90f781405`；下述公网浏览器验收针对这一部署。
- 远程 Node 22.23.3：Astro check 33 文件，0 error / warning；build 14 页；test:site 313 项站内链接/素材检查成功。
- 本地 `actionlint 1.7.12` 通过。临时故障注入的本站绝对断链、错误锚点和正式页 noindex 都被检查器拒绝，构建产物随后恢复。
- Pages API：`build_type=workflow`、`cname=wonderloom.space`、`protected_domain_state=verified`。`github-pages` environment 仅允许 `main` 分支。
- 用户已完成 GitHub 个人账户域名验证；TXT 在权威 NS 与公共 DNS 均可解析，记录继续保留。
- 17:24 定向请求 `http://wonderloom.space/` 到 GitHub Pages `185.199.108.153` 返回 200，仅作为当时的原站检查；随后已完成以下真实公网验收。

## DNS、证书与公网验收

- [x] GoDaddy 主域名 A 与 www CNAME 已切换，权威、1.1.1.1 与 8.8.8.8 解析一致。
- [x] 主域名及 www 证书签发，正常 TLS 校验成功，Enforce HTTPS 已开启。
- [x] Enforce HTTPS 的 HTTP→HTTPS 公网跳转已生效。
- [x] 正式首页、子页刷新、资源和自定义 404 的公网/浏览器验收。
- [x] `https://www.wonderloom.space` 301 跳转至 HTTPS 主域名，并保留路径和查询串。
- [x] `wonderloom.xyz` 与 `www.wonderloom.xyz` 自身 HTTPS 正常，301 跳转保留路径和查询串（Google 公共 DoH 解析，正常 TLS 校验）。

17:41 起核验用户完成的 DNS（历史快照；xyz 此后已迁移，当前值见下文）：

| 名称 | 类型 | 实际值 |
| --- | --- | --- |
| `wonderloom.space` | A | `185.199.108.153`、`185.199.109.153`、`185.199.110.153`、`185.199.111.153` |
| `www.wonderloom.space` | CNAME | `lovedaisy.github.io.` |
| `_github-pages-challenge-LoveDaisy.wonderloom.space` | TXT | GitHub challenge 值仍保留且匹配 |
| `wonderloom.xyz` | A | `15.197.225.128`、`3.33.251.168`（GoDaddy forwarding） |
| `www.wonderloom.xyz` | CNAME | `wonderloom.xyz.` |

space apex 无冲突 AAAA 或 CAA。GitHub `/pages/health` 对 apex/www 均返回 `is_valid=true`、`is_https_eligible=true`、`caa_error=null`。最初尚无证书，按官方排障重新保存 custom domain 后，证书由 `new` 变为 `approved`，覆盖 `wonderloom.space` 与 `www.wonderloom.space`，本次有效期至 2027-01-17。随后正常 curl TLS 校验通过，并通过 API 开启 `https_enforced=true`。刚开启后的 HTTP 请求仍命中 600 秒旧缓存；17:51 再验 apex/www 的首页与带路径/query 的请求，全部经 301 到达对应 HTTPS 主站页面，最终 200，路径和查询串完整保留。

17:44 公网 HTTPS 浏览器检查（无忽略证书选项）：8 个正式路由 × 1440/390 两种宽度，共 16 组通过。检查 200、唯一 h1、canonical/og:url、正式页可索引、无横向溢出、图片解码；另外验证首页查询参数不进入 canonical、织法按钮实际改变 SVG、导航与刷新、试样 noindex、任意不存在路径返回真实 404 及定制页面。无 pageerror。HTTPS 的 www 跳转保留 `/writing/ice-halos/?source=release-check&x=1`，最终主站返回 200。

## 备用域名迁移与最终验收

GoDaddy 配置已生效，apex/www 的 HTTP 和 HTTPS 首页都返回 301，最终到达 `https://wonderloom.space/`，两个入口自身的证书也正常。但对 apex/www × HTTP/HTTPS 的子路径请求 `/writing/ice-halos/?source=release-check&x=1` 均返回 404；单独测试 `/writing/`、`/about/`、`/abc` 也复现。首页 `/?a=1` 的 301 Location 是 `https://wonderloom.space`，查询串丢失。因此不能通过等待 DNS 传播或仅验收首页，认定完整转发已完成。

用户随后注册 Cloudflare，配置并启用 Single Redirect，在 GoDaddy 将 xyz Nameservers 替换为 Cloudflare 分配的 `aida.ns.cloudflare.com` 与 `kyrie.ns.cloudflare.com`，并确认 @/www 均为橙云。配置值与维护步骤见 [部署手册](../deployment.md)。

18:20–18:24 核验：注册局 RDAP 已显示上述两个新 NS；直接通过 TCP 查询两台 Cloudflare NS，均得到正确的 SOA/NS、`A @ 192.0.2.1`、www CNAME 与原 `_domainconnect` / `_dmarc` 记录。两台 xyz 父区 NS 的非递归 TCP 查询仍返回 ns31/ns32.domaincontrol.com，父区 DS 查询为空；1.1.1.1、8.8.8.8 和两家的 DoH 查询同样仍指向原 GoDaddy 服务。普通 curl 的流量仍经过旧转发，子路径依然 404。

当时用户确认 Cloudflare Overview 为 `Waiting for your registrar to propagate your new nameservers`，卡点为父区委派尚未发布及 Cloudflare 待激活，因此没有要求用户重复改 NS。Pending zone 会暂时按 DNS only 应答，即使记录设为橙云，返回占位地址本身不能据此判定代理遗漏。

18:54–18:57，用户报告 Cloudflare 已生效后再次核验：

- xyz 父区 `x.nic.xyz` 非递归 TCP 查询已委派 `aida.ns.cloudflare.com` / `kyrie.ns.cloudflare.com`；两台权威 NS 与 1.1.1.1 的 NS/A 应答一致。Google DoH 同样返回 Cloudflare 边缘 A `104.21.33.233`、`172.67.193.159`。这些是当时的公共应答，不是需要手工配置的固定地址。
- 两台权威 NS 均保留 `_domainconnect` CNAME 与 `_dmarc` TXT 原值；apex/www 的 A/AAAA 均由 Cloudflare 代理应答。GitHub Pages 仍为 workflow、主域名 verified、证书 approved、`https_enforced=true`。
- HTTP/HTTPS × apex/www × `/`、`/?source=release-check&x=1`、`/writing/ice-halos/?source=release-check&x=1` 共 12 组全部通过：首跳为 Cloudflare 301，Location 精确等于 `https://wonderloom.space` 加原路径/query，随后主站 200；没有额外跳转或查询参数丢失。全部请求正常校验证书，未使用 `-k`。
- 最终矩阵使用 curl `--doh-url https://dns.google/dns-query`；`--resolve dns.google:443:8.8.8.8` 仅用于解析器自身的连接引导，没有覆盖站点 IP，站点地址由 Google 公共 DNS 实际返回。另有直接连接公共应答 IP 的诊断请求，单独保存，不混作普通解析证据。
- 本机默认 DNS 当时仍缓存旧 GoDaddy A（一次查询剩余 TTL 3440 秒），普通 curl 因而仍可能命中旧转发，不能声称所有递归缓存已刷新。公共 DNS 与新服务的验收通过，剩余缓存自然到期即可，无需用户重复更改配置。直接 TCP 访问 8.8.8.8:53 在这轮超时，Google 解析证据来自其成功的 DoH 请求。

原始取证保存在本地忽略目录 `.review/ci-pages-release/`：`dns-after.json`、`pages-https-enabled.json`、`public-browser-https.json`、`public-http-final.json`、`https-enforcement.json`、`xyz-path-isolation.json`。

Cloudflare 迁移取证：`cloudflare-dns.json`、`cloudflare-http.json`、`cloudflare-authority.json`、`cloudflare-parent-tcp.json`、`cloudflare-doh.json`、`cloudflare-propagation-latest.json`。

激活后取证：`cloudflare-dns-active.json`、`cloudflare-http-active.json`（默认 resolver 旧缓存）、`cloudflare-edge-active.json`（公共 DNS 对照与定向诊断）、`cloudflare-aux-active.json`、`cloudflare-http-doh-final.json`（12/12 最终通过）。

## 首次注册过程

最初仓库无任何 workflow，PR opened/reopened 和临时匹配功能分支的 push 均未生成 run/check suite。Actions 权限正常、workflow lint 通过。为继续取证，在 main 放入仅手动检查、无部署 job 的 bootstrap（`282de27`）后，GitHub 注册了工作流；完整功能分支的 PR 与手动触发随即正常运行。

临时分支 push 条件已移除。功能分支 rebase 后的 `83c93e9` 源码树与独立评审通过的 `aaec204` 完全相同；最终生产 workflow 只在 main push 或 main 手动运行发布。本记录描述本仓实测恢复过程，不将其泛化为 GitHub 所有新工作流都必须先入默认分支的规则。

## 运维入口

触发条件、DNS 值、诊断、重新部署及回退步骤见 [部署与回退](../deployment.md)。当前 GitHub 官方 Pages actions 的内部 Node 20 runtime 在远程日志中有迁移提示，runner 使用 Node 24 兼容执行；本次检查与部署成功。应用构建 Node 版本仍独立固定为 22.23.3。
