# 内容网络验收

范围：`feat/content-weave` 的本地生产构建。浏览器检查的准确时间、逐页视口及结果见 [JSON 记录](content-weave-browser.json)。PR 和正式发布由同一任务在本地验收后继续执行；本文件不以本地结果代替线上结果。

## 构建与内容

- Node `22.23.3`；`npm ci`、`npm run check`、`npm run build`、`npm run test:site` 通过。
- Astro 检查无 errors / warnings / hints；生成 29 个页面。全站链接、图片尺寸与 alt、canonical/`og:url`、预览与 404 的 noindex 通过。
- 回归断言保留原系列 17 个章节及其源文映射；冰晕 0、6 两篇进入稳定的站内导读，导读仍能打开对应知乎原文。
- 8 篇独立导读、3 个主题、2 条路径、Lumice-Integral 及作品上下文入口均可达。局部图只包含当前作品与直接邻居。
- 全部 23 条来源逐项对照已发表快照的标题、URL；核验日期和 SHA-256 记录在 `src/data/source-evidence.ts`，不由运行时来源清单派生。

以下故障注入均使 `npm run build` 非零退出；每项结束后恢复源文件，最后重新成功构建：

| 注入 | 结果 | 本地证据 |
| --- | --- | --- |
| 阅读路径指向不存在的作品 | missing content reference | `.review/content-weave/missing-path-work.log` |
| 篡改首批 8 篇之外的冰晕第 1 篇来源 URL | evidence mismatch | `.review/content-weave/tampered-legacy-source.log` |
| 删除仍被旧目录引用的来源记录 | schema / 来源校验失败 | `.review/content-weave/removed-source.log` |

以上验证说明引用与来源一致性校验有效，不表示已在线下载全部知乎链接，也不保证外部平台将来一直可访问。

## 实际浏览器检查

使用 worktree 构建产物的 Astro preview（`http://127.0.0.1:4323`），通过 Chromium 完成 120 项检查。逐页矩阵保存在上述 JSON；详细原始结果与脚本留在本地 `.review/content-weave/`。

| 范围 | 视口 / 状态 | 结果 |
| --- | --- | --- |
| 全部 28 个可浏览路由，含原有页面与试样 | 1440、768、390、320；JS 开启 | 112 项通过；无横向溢出、坏图、导航越界、脚本错误；均 HTTP 200、单一 h1 |
| 探索、光谱渲染导读、Integral 项目 | 1440、320；JS 关闭 | 6 项通过；高亮控件隐藏，图节点原生链接可用 Enter 跳转 |
| 探索图谱及文章→路径 | 1440；reduced-motion | 主题选择/复原、聚焦邻居、键盘打开作品、进入阅读路径通过；transition 为 0s；短标题在节点内 |
| 探索图谱 | 320；JS 开启 | 默认收起；点击可展开；普通关系列表持续可用 |
| 不存在的 URL | 实际 HTTP 请求 | 返回 404 |

图片检查先触发并等待懒加载图片解码，避免把尚未请求的图片误判为损坏。键盘跳转等待导航完成，避免对当前页面链接的异步重载造成下一次检查竞态。

人工查看了最终关系图截图 `.review/content-weave/explore-map-final.png`，确认 11 个节点的短标题清楚且不重叠。初版的四张页面截图仅保留作迭代记录，最终交互与尺寸结论以上述矩阵为准。
