import type { WorkId } from './content-network';

export const editions = [
  { id: 'notebook', letter: 'A', name: '研究手记', description: '像翻开一本正在写的手记。让问题、正文、图版与边注组成连续的阅读。' },
  { id: 'atlas', letter: 'B', name: '科学图谱', description: '像展开一幅关于好奇心的图谱。先看见图像，再沿着问题与作品之间的联系走进去。' },
] as const;
export type EditionId = typeof editions[number]['id'];
export const editionPages = [
  { id: 'home', title: '首页' },
  { id: 'writing', title: '文章' },
  { id: 'explore', title: '探索' },
] as const;
export type EditionPage = typeof editionPages[number]['id'];
export const editionUrl = (edition: EditionId, page: EditionPage = 'home') => `/directions/research/${edition}/${page}/`;

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

// 图谱的坐标仅决定排版。边从 content-network 的人工 relations 读取。
export const atlasPositions: { id: WorkId; label: string; x: number; y: number }[] = [
  { id: 'article:halo-introduction', label: '冰晕研究的起点', x: 17, y: 11 },
  { id: 'series:ice-halos', label: '现代冰晕研究漫谈', x: 17, y: 39 },
  { id: 'article:halo-direct-integration', label: '蒙特卡洛与直接积分', x: 17, y: 67 },
  { id: 'project:lumice-integral', label: 'Lumice Integral', x: 39, y: 86 },
  { id: 'project:lumice', label: 'Lumice', x: 41, y: 39 },
  { id: 'article:drawing-light', label: '绘光：模拟的缘起', x: 44, y: 11 },
  { id: 'article:color-space-basics', label: '色彩空间基础', x: 79, y: 11 },
  { id: 'article:color-space-conversion', label: '色彩空间表示与转换', x: 79, y: 35 },
  { id: 'article:spectral-rendering', label: '光谱渲染', x: 64, y: 60 },
  { id: 'article:white-balance', label: '白平衡与色彩恒常性', x: 64, y: 86 },
  { id: 'article:camera-colour', label: '相机怎样还原颜色', x: 88, y: 79 },
];
