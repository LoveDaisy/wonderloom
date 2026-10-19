# CI 与 Pages 发布验收

核验日期：2026-10-19（UTC+8）。当前状态：**CI 和 Pages 产物部署已通过；自有域名的 DNS 切换、HTTPS 与备用域名跳转待完成。**

## 已完成

- [PR #1](https://github.com/LoveDaisy/wonderloom/pull/1) 已合入 main，首发提交为 `41b2f545f59bcdba51c4eafd1f90e3d09b93603a`。
- [PR CI](https://github.com/LoveDaisy/wonderloom/actions/runs/39229383741)：`Check site` success；artifact 上传与 `Deploy Pages` 均 skipped。
- [功能分支手动 CI](https://github.com/LoveDaisy/wonderloom/actions/runs/39229379800)：检查 success，部署 skipped，验证非 main 的手动运行不会发布。
- [main 首次构建与发布](https://github.com/LoveDaisy/wonderloom/actions/runs/39229646859)：检查与部署均 success；deployment `7170143872` 对应同一首发 SHA。
- 远程 Node 22.23.3：Astro check 33 文件，0 error / warning；build 14 页；test:site 313 项站内链接/素材检查成功。
- 本地 `actionlint 1.7.12` 通过。临时故障注入的本站绝对断链、错误锚点和正式页 noindex 都被检查器拒绝，构建产物随后恢复。
- Pages API：`build_type=workflow`、`cname=wonderloom.space`、`protected_domain_state=verified`。`github-pages` environment 仅允许 `main` 分支。
- 用户已完成 GitHub 个人账户域名验证；TXT 在权威 NS 与公共 DNS 均可解析，记录继续保留。
- 17:24 定向请求 `http://wonderloom.space/` 到 GitHub Pages `185.199.108.153`，返回 200、`Server: GitHub.com`，正文与正式 canonical 正确。这仅证明 Pages 已按该主机名提供内容，**不代表公共 DNS 或 HTTPS 已完成**。

## 待完成的上线验收

- [ ] GoDaddy 主域名 A 与 www CNAME 已切换，权威与公共 DNS 一致。
- [ ] 主域名证书签发并启用 Enforce HTTPS，正常 TLS 校验成功。
- [ ] 正式首页、子页刷新、资源和自定义 404 的公网/浏览器验收。
- [ ] `www.wonderloom.space` 跳转至主域名。
- [ ] `wonderloom.xyz` 与 `www.wonderloom.xyz` 自身 HTTPS 正常，301 跳转保留路径和查询串。

17:24 的权威 DNS 仍为原 GoDaddy 停放记录：space apex `3.33.130.190` / `15.197.148.33`，www CNAME 为 `wonderloom.space`；Pages 尚无证书、`https_enforced=false`。已向域名所有者提供精确 A/CNAME 与 301 forwarding 操作，尚未把该状态视为完成上线。

## 首次注册过程

最初仓库无任何 workflow，PR opened/reopened 和临时匹配功能分支的 push 均未生成 run/check suite。Actions 权限正常、workflow lint 通过。为继续取证，在 main 放入仅手动检查、无部署 job 的 bootstrap（`282de27`）后，GitHub 注册了工作流；完整功能分支的 PR 与手动触发随即正常运行。

临时分支 push 条件已移除。功能分支 rebase 后的 `83c93e9` 源码树与独立评审通过的 `aaec204` 完全相同；最终生产 workflow 只在 main push 或 main 手动运行发布。本记录描述本仓实测恢复过程，不将其泛化为 GitHub 所有新工作流都必须先入默认分支的规则。

## 运维入口

触发条件、DNS 值、诊断、重新部署及回退步骤见 [部署与回退](../deployment.md)。当前 GitHub 官方 Pages actions 的内部 Node 20 runtime 在远程日志中有迁移提示，runner 使用 Node 24 兼容执行；本次检查与部署成功。应用构建 Node 版本仍独立固定为 22.23.3。
