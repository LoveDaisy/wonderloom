# 内容与素材来源

## 本轮内容网络（2026-10-19）

公开文章的稳定 `sourceId`、核验后的标题和 URL 仅维护在 [`src/data/content-sources.ts`](../src/data/content-sources.ts)。系列目录和单篇导读只引用该 ID，不在多处手写标题或链接。

独立核验映射在 [`src/data/source-evidence.ts`](../src/data/source-evidence.ts)：首批 8 篇保存已发表快照定位和 SHA-256；冰晕与历法的其余旧目录项保存系列目录定位；高山第一篇沿用首版来源记录。构建会对照两份数据，缺失来源或不一致的标题/URL 会失败。导读是本站编辑文字，全文仍由明确标注的知乎入口承载。

核验日期：2026-10-17（首版）及 2026-10-19（本轮内容网络）。本站导读为针对网站撰写的编辑摘要，不冒充原文；章节内容通过明确标注的知乎链接阅读。Writing-Lab 的导演剪辑版不等于已发表版本，标题与链接依据主 vault `Writing/articles` 已发表快照核对。

## 内容

- Lumice：公开仓库 <https://github.com/LoveDaisy/Lumice> README；来源版本 `661f6814adafc3ae410096f9f67ed0cbcfe37403`。下载入口指向 Releases 列表，不固定一个容易过期的最新版本。`https://lovedaisy.github.io/Lumice/bench/` 是性能看板，不是在线模拟器。
- Lumice Integral：公开仓库 <https://github.com/LoveDaisy/Lumice-Integral> README 与本地只读 `docs/overview_zh.md` 核验。它是与 Lumice 相互对照的研究/参考代码；不把阶段性研究状态或未来整合说成已经提供的产品能力。
- 现代冰晕研究漫谈：`Writing-Lab/现代冰晕研究漫谈/README.md`，版本 `b7784b8c96c742ee4f49f2277fe424bfda213ae4`。首版列出 0—9 与 8.1 番外的已发表文章，不列未发表提纲。
- 重新发明农历：`Writing-Lab/日月运行与历法/`，版本 `5c1a5d0c1e15189dc4e5c17a45e568d22392ba4e`，公开快照确认五篇文章。
- 寻找高山：<https://zhuanlan.zhihu.com/p/666675246>，首版只列已发表第一篇。不提供未确认公开的源码入口，不展示第二篇为已发表文章。
- 作者姓名与网站介绍：作者本人在本次建站讨论中的陈述；GitHub 用户名来自已登录账号与公开项目。

## 图片

| 网站文件 | 原始相对位置 | 生成依据 / 说明 |
|---|---|---|
| `src/assets/halo-render.jpg` | `Ice Halo Simulation/doc/figs/sim05E_50M.jpg` | 项目 README 使用的 Lumice 模拟渲染，章佳杰原创 |
| `src/assets/celestial-sphere.png` | `Writing-Lab/日月运行与历法/img/celestial_sphere_01.png` | 同目录 `plot_celestial_sphere.nb`，第五篇正文引用的原创示意图 |
| `src/assets/mountain-view.png` | `Writing-Lab/Interesting Applications of DEM/imgs/view-height-map.png` | `codes/matlab/main_plot_Namjagbarwa_range_map.m` 生成；基础数据 SRTM 90 m；文章第一篇引用 |
| `src/assets/pyramid-halos.png` | `Writing-Lab/现代冰晕研究漫谈/09-pyramid/img/panorama_triptych.png` | 同章 `code/fig_panorama_triptych.py`，Lumice 渲染与作者排版 |

高山图片来源版本：`475a2faa23de10e14e492a7dafc60823ad4740ae`。图片原件随网站保存，展示时只缩放和合理压缩；无裁剪坐标轴、滤色或重新解释计算结果。点击图可查看完整原图。

来源仓库版本是定位上下文，复制文件的 SHA-256 另记于 `asset-checksums.txt`，以覆盖源仓库存在未提交素材的情况。

没有复制第三方实景照片、Google Earth 截图、转载图或来源未确认的封面。原作者将自己的素材用于个人网站，不代表为所有图片重新授予通用开源许可；本仓暂不统一添加图片许可证。
