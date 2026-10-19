export type SourceEvidence = {
  sourceId: string;
  title: string;
  url: string;
  evidence: 'published-snapshot' | 'series-catalogue' | 'existing-site-source';
  snapshot?: string;
  sha256?: string;
};

// 与来源清单分开维护的核验快照。构建时逐项比对 title / URL，避免同源字段自证。
export const sourceEvidence: SourceEvidence[] = [
  { sourceId: 'halo-origin', title: '绘光：冰晕模拟的故事', url: 'https://zhuanlan.zhihu.com/p/38975467', evidence: 'published-snapshot', snapshot: 'Writing/articles/绘光：冰晕模拟的故事.md', sha256: 'df7b94eccd1f61d49a4185410cc0d8e2174b34675ee92b54b5949348f7f8f132' },
  { sourceId: 'halo-0', title: '现代冰晕研究漫谈(0): 风起青萍之末', url: 'https://zhuanlan.zhihu.com/p/461810067', evidence: 'published-snapshot', snapshot: 'Writing/articles/现代冰晕研究漫谈(0)： 风起青萍之末.md', sha256: 'a94ae6150695b94eb3f36d8c5dccc40a675a78b6f92493010966b26395c9d49c' },
  { sourceId: 'halo-6', title: '现代冰晕研究漫谈(6): 蒙特卡洛 vs. 直接积分', url: 'https://zhuanlan.zhihu.com/p/536772578', evidence: 'published-snapshot', snapshot: 'Writing/articles/现代冰晕研究漫谈(6)： 蒙特卡洛 vs. 直接积分.md' },
  { sourceId: 'color-space-basics', title: '色彩空间基础', url: 'https://zhuanlan.zhihu.com/p/24214731', evidence: 'published-snapshot', snapshot: 'Writing/articles/色彩空间基础.md', sha256: 'af88e588c6c450f963da28a4ab4f24adf65b52ea6ce8b53542226a5e75c5ae63' },
  { sourceId: 'color-space-conversion', title: '色彩空间表示与转换', url: 'https://zhuanlan.zhihu.com/p/24281841', evidence: 'published-snapshot', snapshot: 'Writing/articles/色彩空间表示与转换.md', sha256: '09da721ca49f6e854236c8b6166101aa2f8acd1c0f68bc653263a37a9e7bcde0' },
  { sourceId: 'spectral-rendering', title: '光谱渲染的几个例子', url: 'https://zhuanlan.zhihu.com/p/24312022', evidence: 'published-snapshot', snapshot: 'Writing/articles/光谱渲染的几个例子.md', sha256: 'b79670bb42e05db16bba0250617b6c288e32946954c34a5175b5608eee3cde56' },
  { sourceId: 'white-balance', title: '色温、白平衡与色彩恒常性', url: 'https://zhuanlan.zhihu.com/p/27165715', evidence: 'published-snapshot', snapshot: 'Writing/articles/色温、白平衡与色彩恒常性.md', sha256: 'c4e5c1c15b50a7ae7c323151ff941f20e3d31c6a77b40ae5765b6248e7bd3fb9' },
  { sourceId: 'camera-colour', title: '光线与数学的魔法：相机拍到的照片颜色是怎么和人眼看到的结果吻合的？', url: 'https://zhuanlan.zhihu.com/p/417012666', evidence: 'published-snapshot', snapshot: 'Writing/articles/光线与数学的魔法：相机拍到的照片颜色是怎么和人眼看到的结果吻合的？.md', sha256: '93dc137170cfe5c84c50a2a23caf34b5519a6965ab93c1519e8395e0080d000c' },
  { sourceId: 'halo-1', title: '现代冰晕研究漫谈(1): 迷镜千幻不离宗', url: 'https://zhuanlan.zhihu.com/p/462717356', evidence: 'series-catalogue', snapshot: 'Writing/series/现代冰晕研究漫谈.md' },
  { sourceId: 'halo-2', title: '现代冰晕研究漫谈(2): 计算机遍历、搜索、优化', url: 'https://zhuanlan.zhihu.com/p/469793197', evidence: 'series-catalogue', snapshot: 'Writing/series/现代冰晕研究漫谈.md' },
  { sourceId: 'halo-3', title: '现代冰晕研究漫谈(3): 平行光路的各种弧和晕', url: 'https://zhuanlan.zhihu.com/p/485848284', evidence: 'series-catalogue', snapshot: 'Writing/series/现代冰晕研究漫谈.md' },
  { sourceId: 'halo-4', title: '现代冰晕研究漫谈(4): 冰晕模拟仿真的朴素(naive)思路', url: 'https://zhuanlan.zhihu.com/p/512594144', evidence: 'series-catalogue', snapshot: 'Writing/series/现代冰晕研究漫谈.md' },
  { sourceId: 'halo-5', title: '现代冰晕研究漫谈(5): 三维旋转', url: 'https://zhuanlan.zhihu.com/p/516883186', evidence: 'series-catalogue', snapshot: 'Writing/series/现代冰晕研究漫谈.md' },
  { sourceId: 'halo-7', title: '现代冰晕研究漫谈(7): 十二种矩阵背后的数学结构', url: 'https://zhuanlan.zhihu.com/p/2082646907952821740', evidence: 'series-catalogue', snapshot: 'Writing/series/现代冰晕研究漫谈.md' },
  { sourceId: 'halo-8', title: '现代冰晕研究漫谈(8)：楔角光路', url: 'https://zhuanlan.zhihu.com/p/2084963224814990674', evidence: 'series-catalogue', snapshot: 'Writing/series/现代冰晕研究漫谈.md' },
  { sourceId: 'halo-8-1', title: '现代冰晕研究漫谈(8.1 番外)：从古典几何到现代矩阵', url: 'https://zhuanlan.zhihu.com/p/2087212931775837732', evidence: 'series-catalogue', snapshot: 'Writing/series/现代冰晕研究漫谈.md' },
  { sourceId: 'halo-9', title: '现代冰晕研究漫谈(9)：锥晶的有限与无限', url: 'https://zhuanlan.zhihu.com/p/2087225407133304432', evidence: 'series-catalogue', snapshot: 'Writing/series/现代冰晕研究漫谈.md' },
  { sourceId: 'calendar-1', title: '重新发明农历 (1) - 重要的自然周期', url: 'https://zhuanlan.zhihu.com/p/16466051322', evidence: 'series-catalogue', snapshot: 'Writing/series/重新发明农历.md' },
  { sourceId: 'calendar-2', title: '重新发明农历 (2) - 测算回归年长度', url: 'https://zhuanlan.zhihu.com/p/17112174047', evidence: 'series-catalogue', snapshot: 'Writing/series/重新发明农历.md' },
  { sourceId: 'calendar-3', title: '重新发明农历 (3) - 月的周期与置闰', url: 'https://zhuanlan.zhihu.com/p/17647963472', evidence: 'series-catalogue', snapshot: 'Writing/series/重新发明农历.md' },
  { sourceId: 'calendar-4', title: '重新发明农历 (4) - 天体运动复杂性', url: 'https://zhuanlan.zhihu.com/p/20913174233', evidence: 'series-catalogue', snapshot: 'Writing/series/重新发明农历.md' },
  { sourceId: 'calendar-5', title: '重新发明农历 (5) - 唯象的天球模型', url: 'https://zhuanlan.zhihu.com/p/22831021105', evidence: 'series-catalogue', snapshot: 'Writing/series/重新发明农历.md' },
  { sourceId: 'mountains-1', title: '寻找高山（1）', url: 'https://zhuanlan.zhihu.com/p/666675246', evidence: 'existing-site-source', snapshot: 'docs/content-sources.md（首版核验记录）' },
];
