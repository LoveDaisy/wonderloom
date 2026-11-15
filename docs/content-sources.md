# 内容与素材来源

## 本轮内容网络（2026-10-19）

公开文章分两轨。写作仓《现代冰晕研究漫谈》的章节（halo-N）不做人工登记：title/url 的唯一权威是写作仓 frontmatter，构建时由 [`src/lib/content.ts`](../src/lib/content.ts) 从 `authorArticles` collection 运行时派生（无发表 URL 的稿件不产生来源记录）。其余人工条目（写作仓之外的公开文章）的稳定 `sourceId`、核验后的标题和 URL 仅维护在 [`src/data/content-sources.ts`](../src/data/content-sources.ts)。系列目录和单篇导读只引用 `sourceId`，不在多处手写标题或链接。

独立核验映射在 [`src/data/source-evidence.ts`](../src/data/source-evidence.ts)：12 条人工条目均独立读取已发表快照的标题与 URL，保存快照相对定位、核验日期和 SHA-256；构建会对照两份数据，缺失来源或不一致的标题/URL 会失败。作者稿章节不进入该映射——其来源由生成 manifest 的 source SHA 追溯（公网 `/writing-lab/source.json` 可查），知乎标题/URL 仅是历史发表证据。

核验日期：2026-10-17（首版）及 2026-10-19（本轮内容网络）。本站导读为针对网站撰写的编辑摘要，不冒充原文；章节内容通过明确标注的知乎链接阅读。Writing-Lab 的导演剪辑版不等于已发表版本，标题与链接依据主 vault `Writing/articles` 已发表快照核对。

## 内容

- Lumice：公开仓库 <https://github.com/LoveDaisy/Lumice> README；来源版本 `661f6814adafc3ae410096f9f67ed0cbcfe37403`。下载入口指向 Releases 列表，不固定一个容易过期的最新版本。`https://lovedaisy.github.io/Lumice/bench/` 是性能看板，不是在线模拟器。
- Lumice Integral：公开仓库 <https://github.com/LoveDaisy/Lumice-Integral> README 与本地只读 `docs/overview_zh.md` 核验。它是与 Lumice 相互对照的研究/参考代码；不把阶段性研究状态或未来整合说成已经提供的产品能力。
- Cerulea：公开仓库 <https://github.com/LoveDaisy/Cerulea>，固定公开提交 `ffe0132e343b02e37512851d2711f508c6c3e5e1` 的 `README.md`、`figures/README.md`（2026-11-16 核查 PUBLIC）。本站介绍由该版说明编写，运行入口为 `uv run python -m skycolor.cli render` / `chart`；现象展示不构成精度认证，暮光绝对亮度等仍有已知偏差。本站不提供或链接 demo。
- Umbrelume：公开仓库 <https://github.com/LoveDaisy/Umbrelume>，固定公开提交 `ca318806bf8df03edf16c57a76708d740e907e8f` 的 `README.zh.md`、`figures/mainline/README.md` 与 `metadata.json`（2026-11-16 核查 PUBLIC）。运行入口为 `uv run lunar-eclipse simulate`；中性月面屏不代表真实月壤或已获观测验证的完整颜色。本站不提供或链接 demo。
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

### 天空与月食生产图（2026-11-16）

以下两图直接下载自公开固定提交，不取本地工作树，也未运行源仓脚本。下载原件与本站资产分别计算 SHA-256，并以 `cmp` 逐字节核对；未裁剪、滤色或重编码。页面由 `ResearchFigure` 等比展示，原图入口保留所有标注。

| 网站文件 | 固定公开原件与同版本说明 | 尺寸 / 原件 SHA-256 |
|---|---|---|
| `src/assets/cerulea-sky.png` | [Cerulea / figures/sky_03.png](https://github.com/LoveDaisy/Cerulea/blob/ffe0132e343b02e37512851d2711f508c6c3e5e1/figures/sky_03.png)；[同提交图录](https://github.com/LoveDaisy/Cerulea/blob/ffe0132e343b02e37512851d2711f508c6c3e5e1/figures/README.md) | 640×320，48865 bytes；`d967e14e97397435b4098adfd784b6a6992612376ff62dce807fe34f82b63160` |
| `src/assets/umbrelume-eclipse.png` | [Umbrelume / figures/mainline/l25_stratosphere.png](https://github.com/LoveDaisy/Umbrelume/blob/ca318806bf8df03edf16c57a76708d740e907e8f/figures/mainline/l25_stratosphere.png)；[同提交读图约定](https://github.com/LoveDaisy/Umbrelume/blob/ca318806bf8df03edf16c57a76708d740e907e8f/figures/mainline/README.md)及[metadata](https://github.com/LoveDaisy/Umbrelume/blob/ca318806bf8df03edf16c57a76708d740e907e8f/figures/mainline/metadata.json) | 929×1098；`64f33271fece2fa90cc32886ab51c39b2d0d09a9cc98aefa8e7c138ec63e1954`，与源 metadata 的 `figures.l25_stratosphere.png.sha256` 一致 |

- **Cerulea 口径**：图录标记生成版本 `6627c00`（与 `7d7ce15` 的 `skycolor/` 相同）；这里的完整 SHA 是公开取件版本，不冒充生成时版本。晴空 `clear`、海平面、AOD550=0.05、臭氧 300 DU；太阳高度 3° 为折射前输入，折射开启；`hybrid-sos`（球面一次散射 + 平面 SOS），380–780 nm / 5 nm。视图朝向太阳，yaw=0°、pitch=14°、hfov=100°，exposure=0.03、ACES、adaptation=None、保色度；无太阳标记、无地面，地平线以下像素只是 no-ground 显示约定，不是地表。原图没有坐标轴或图例，不另加伪造标记。
- **Umbrelume 口径**：同提交 metadata 中 `opac` 态的生产 `moon.png`。自由对流层 2–12 km（AOD550=0.013，50% RH 文献参考）+ 平流层背景 12–35 km（AOD550=0.005），臭氧 300 DU；月距 384400 km，月盘中心距影轴 2860 km；非事件拟合。全局 +12 EV，食外太阳 CIE Y=1；食外太阳光谱经 Bradford 适应至 D65，共同最大通道压缩高光、裁去负线性 sRGB。均匀中性屏不含月壤反射谱、BRDF、入射角明暗或观察者大气；明视觉近似，不含暗适应。保留原图上下的全部英文说明。
- 两项目曝光参数定义不同，不能比较 `0.03` 与 `+12 EV` 来推断物理亮度；压缩后的显示像素也不能替代原始光谱量。

没有复制第三方实景照片、Google Earth 截图、转载图或来源未确认的封面。原作者将自己的素材用于个人网站，不代表为所有图片重新授予通用开源许可；本仓暂不统一添加图片许可证。
