export type WorkId = `article:${string}` | `series:${string}` | `project:${string}`;
export type Topic = { id: string; title: string; description: string; workIds: WorkId[] };
export type ReadingPath = { id: string; title: string; description: string; introduction: string; steps: WorkId[] };
export type Relation = { from: WorkId; to: WorkId; explanation: string };

export const topics: Topic[] = [
  {
    id: 'ice-halos', title: '冰晕',
    description: '从天空中的弧和环出发，追问冰晶、光路、对称与数值计算怎样彼此照亮。',
    workIds: ['article:drawing-light', 'article:halo-introduction', 'series:ice-halos', 'article:halo-direct-integration', 'project:lumice', 'project:lumice-integral'],
  },
  {
    id: 'spectral-rendering', title: '光谱渲染',
    description: '把光谱、视觉与显示连接为一条可计算的链，也回到冰晕图像里的颜色。',
    workIds: ['article:drawing-light', 'article:color-space-basics', 'article:color-space-conversion', 'article:spectral-rendering', 'article:white-balance', 'project:lumice'],
  },
  {
    id: 'color-science', title: '色彩科学',
    description: '从人眼如何把光谱投影为颜色，走到色彩空间、相机与白平衡的具体问题。',
    workIds: ['article:color-space-basics', 'article:color-space-conversion', 'article:spectral-rendering', 'article:white-balance', 'article:camera-colour'],
  },
];

export const readingPaths: ReadingPath[] = [
  {
    id: 'understand-halos', title: '理解和重现冰晕',
    description: '从一次模拟的缘起进入现象与光路，再沿两种计算方法看见同一个问题的不同侧面。',
    introduction: '可以按顺序读，也可以在任何一个节点停下，顺着它连接的作品继续。',
    steps: ['article:drawing-light', 'article:halo-introduction', 'series:ice-halos', 'project:lumice', 'article:halo-direct-integration', 'project:lumice-integral'],
  },
  {
    id: 'spectrum-to-colour', title: '从光谱到颜色',
    description: '从色觉的线性模型出发，走向表示、转换、光谱渲染，以及相机和白平衡的分支。',
    introduction: '前三篇是主线；最后两篇是把这条线带回实际观看与拍摄的两个入口。',
    steps: ['article:color-space-basics', 'article:color-space-conversion', 'article:spectral-rendering', 'article:white-balance', 'article:camera-colour'],
  },
];

export const relations: Relation[] = [
  { from: 'article:drawing-light', to: 'project:lumice', explanation: '从冰晕模拟的缘起，回到可以实际运行的光线追踪器。' },
  { from: 'article:drawing-light', to: 'article:spectral-rendering', explanation: '两篇都把光的物理描述转成可计算、可观看的图像。' },
  { from: 'article:halo-introduction', to: 'series:ice-halos', explanation: '第 0 篇说明系列的问题意识，是进入整组文章的入口。' },
  { from: 'article:halo-introduction', to: 'project:lumice', explanation: '文章里的光路分类问题也在模拟器的研究语境中出现。' },
  { from: 'series:ice-halos', to: 'article:halo-direct-integration', explanation: '第 6 篇把模拟问题推向蒙特卡洛与直接积分的比较。' },
  { from: 'article:halo-direct-integration', to: 'project:lumice-integral', explanation: 'Lumice Integral 从第 6 篇涉及的直接积分问题继续发展。' },
  { from: 'project:lumice', to: 'project:lumice-integral', explanation: '两者计算同一类冰晕问题：一个以蒙特卡洛模拟为主，另一个是确定性积分研究代码。' },
  { from: 'article:color-space-basics', to: 'article:color-space-conversion', explanation: '后者以色彩空间基础为前提，继续讨论同一空间的不同表示。' },
  { from: 'article:color-space-conversion', to: 'article:spectral-rendering', explanation: '色匹配与转换提供了从光谱计算到屏幕颜色的工具。' },
  { from: 'article:spectral-rendering', to: 'article:white-balance', explanation: '白平衡把光谱渲染中的光源、白点和观看条件带回具体场景。' },
  { from: 'article:spectral-rendering', to: 'article:camera-colour', explanation: '两篇分别从显示与相机端解释光谱如何变成颜色。' },
  { from: 'article:white-balance', to: 'article:camera-colour', explanation: '一个讨论观看条件下的颜色恒常性，一个讨论相机如何接近人眼结果。' },
];
