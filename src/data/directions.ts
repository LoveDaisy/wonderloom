export const directions = [
  {
    id: 'fieldnotes', letter: 'A', name: '好奇心手稿', english: 'Field notes',
    description: '纸页、图版与朱红批注。像翻开一个人的研究手稿，在细节里发现好奇心的痕迹。',
    palette: ['#f3eddf', '#302d27', '#a83b29'],
    keywords: '温暖 · 私人 · 有时间感',
  },
  {
    id: 'observatory', letter: 'B', name: '午夜观测室', english: 'After dark',
    description: '深蓝夜色中的一间观测室。光、时间与地形依次进入视野，问题像远处的微光。',
    palette: ['#101d29', '#d5eae6', '#b4d9d0'],
    keywords: '沉浸 · 安静 · 探索未知',
  },
  {
    id: 'loom', letter: 'C', name: '思想织机', english: 'A loom of wonders',
    description: '让不同的好奇心成为经纬。明快的色块、交错的线与自由的版式，把想法织成东西。',
    palette: ['#f7f4ea', '#243fa4', '#c34c2e'],
    keywords: '鲜明 · 轻快 · 跨学科',
  },
] as const;

export type DirectionId = (typeof directions)[number]['id'];
