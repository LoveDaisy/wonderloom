export type SourceRecord = {
  id: string;
  title: string;
  url: string;
};

// 本文件是公开文章标题和 URL 的唯一权威。站内导读及系列目录只保存 sourceId。
export const contentSources: SourceRecord[] = [
  { id: 'halo-origin', title: '绘光：冰晕模拟的故事', url: 'https://zhuanlan.zhihu.com/p/38975467' },
  { id: 'halo-0', title: '现代冰晕研究漫谈(0): 风起青萍之末', url: 'https://zhuanlan.zhihu.com/p/461810067' },
  { id: 'halo-1', title: '现代冰晕研究漫谈(1): 迷镜千幻不离宗', url: 'https://zhuanlan.zhihu.com/p/462717356' },
  { id: 'halo-2', title: '现代冰晕研究漫谈(2): 计算机遍历、搜索、优化', url: 'https://zhuanlan.zhihu.com/p/469793197' },
  { id: 'halo-3', title: '现代冰晕研究漫谈(3): 平行光路的各种弧和晕', url: 'https://zhuanlan.zhihu.com/p/485848284' },
  { id: 'halo-4', title: '现代冰晕研究漫谈(4): 冰晕模拟仿真的朴素(naive)思路', url: 'https://zhuanlan.zhihu.com/p/512594144' },
  { id: 'halo-5', title: '现代冰晕研究漫谈(5): 三维旋转', url: 'https://zhuanlan.zhihu.com/p/516883186' },
  { id: 'halo-6', title: '现代冰晕研究漫谈(6): 蒙特卡洛 vs. 直接积分', url: 'https://zhuanlan.zhihu.com/p/536772578' },
  { id: 'halo-7', title: '现代冰晕研究漫谈(7): 十二种矩阵背后的数学结构', url: 'https://zhuanlan.zhihu.com/p/2082646907952821740' },
  { id: 'halo-8', title: '现代冰晕研究漫谈(8)：楔角光路', url: 'https://zhuanlan.zhihu.com/p/2084963224814990674' },
  { id: 'halo-8-1', title: '现代冰晕研究漫谈(8.1 番外)：从古典几何到现代矩阵', url: 'https://zhuanlan.zhihu.com/p/2087212931775837732' },
  { id: 'halo-9', title: '现代冰晕研究漫谈(9)：锥晶的有限与无限', url: 'https://zhuanlan.zhihu.com/p/2087225407133304432' },
  { id: 'calendar-1', title: '重新发明农历 (1) - 重要的自然周期', url: 'https://zhuanlan.zhihu.com/p/16466051322' },
  { id: 'calendar-2', title: '重新发明农历 (2) - 测算回归年长度', url: 'https://zhuanlan.zhihu.com/p/17112174047' },
  { id: 'calendar-3', title: '重新发明农历 (3) - 月的周期与置闰', url: 'https://zhuanlan.zhihu.com/p/17647963472' },
  { id: 'calendar-4', title: '重新发明农历 (4) - 天体运动复杂性', url: 'https://zhuanlan.zhihu.com/p/20913174233' },
  { id: 'calendar-5', title: '重新发明农历 (5) - 唯象的天球模型', url: 'https://zhuanlan.zhihu.com/p/22831021105' },
  { id: 'mountains-1', title: '寻找高山（1）', url: 'https://zhuanlan.zhihu.com/p/666675246' },
  { id: 'color-space-basics', title: '色彩空间基础', url: 'https://zhuanlan.zhihu.com/p/24214731' },
  { id: 'color-space-conversion', title: '色彩空间表示与转换', url: 'https://zhuanlan.zhihu.com/p/24281841' },
  { id: 'spectral-rendering', title: '光谱渲染的几个例子', url: 'https://zhuanlan.zhihu.com/p/24312022' },
  { id: 'white-balance', title: '色温、白平衡与色彩恒常性', url: 'https://zhuanlan.zhihu.com/p/27165715' },
  { id: 'camera-colour', title: '光线与数学的魔法：相机拍到的照片颜色是怎么和人眼看到的结果吻合的？', url: 'https://zhuanlan.zhihu.com/p/417012666' },
];

export const sourceIds = contentSources.map((source) => source.id) as [string, ...string[]];
export const sourceById = new Map(contentSources.map((source) => [source.id, source]));
