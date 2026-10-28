import type { WorkId } from './content-network';

// 展示分组只引用内容 ID；题名、导读、来源及关联仍从 catalogue 读取。
export const writingGroups: { title: string; note: string; ids: WorkId[] }[] = [
  {
    title: '冰晶中的光',
    note: '从一次模拟的缘起，到光路背后的数学结构。',
    ids: ['article:drawing-light', 'article:halo-introduction', 'article:halo-direct-integration'],
  },
  {
    title: '光怎样成为颜色',
    note: '沿着光谱、人眼与屏幕，重新理解我们看到的颜色。',
    ids: ['article:color-space-basics', 'article:color-space-conversion', 'article:spectral-rendering', 'article:white-balance', 'article:camera-colour'],
  },
];
