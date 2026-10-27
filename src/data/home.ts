import type { WorkId } from './content-network';
import type { MediaId } from './media';

type LightPathStep = {
  id: string;
  title: string;
  description: string;
  workId: WorkId;
  companionWorkId?: WorkId;
  sourceIds: string[];
  mediaId: MediaId;
};

const lightPath: LightPathStep[] = [
  { id: 'ice-crystal', title: '冰晶让光绕出一条弧', description: '从冰晕模拟的故事开始：把天空里的现象拆回冰晶、入射光和一条条可能的光路。', workId: 'article:drawing-light', sourceIds: ['halo-origin'], mediaId: 'crystalPath' },
  { id: 'lumice', title: '让光路成为可以重看的图像', description: 'Lumice 是围绕冰晕模拟持续发展的研究程序；它让条件、计算和观察可以在同一处往返。', workId: 'project:lumice', sourceIds: ['halo-origin'], mediaId: 'pyramids' },
  { id: 'spectrum', title: '从光谱走到屏幕上的颜色', description: '更早的光谱渲染笔记讨论了如何把光谱分布经由颜色匹配函数与颜色空间，变成可显示的 RGB。', workId: 'article:spectral-rendering', sourceIds: ['spectral-rendering'], mediaId: 'spectrum' },
  { id: 'colour-branches', title: '颜色在两条不同的路上继续', description: '相机颜色校正处理相机响应与人眼结果的差异；白平衡处理照明条件下“什么算白”。它们相邻，但不是同一件事。', workId: 'article:camera-colour', companionWorkId: 'article:white-balance', sourceIds: ['camera-colour', 'white-balance'], mediaId: 'cameraResponse' },
];

export const home = {
  introduction: '你好，我是佳杰。这里是我的个人网站。',
  headline: ['一些想弄明白的问题，', '一些动手做出来的东西。'],
  description: '从天空中的光环，到日月运行的周期，再到一座山的巍峨。把问题拆开，动手试试，然后从自己的视角重新理解。',
  specimens: [
    { id: 'ice-halos', slot: 'sky', caption: '一束光的去向', width: 440 },
    { id: 'calendar', slot: 'time', caption: '日月如何成为日历', width: 540 },
    { id: 'mountains', slot: 'land', caption: '把一座山展开来看', width: 1000 },
  ],
  featured: ['calendar', 'mountains', 'ice-halos'],
  reading: ['ice-halos', 'calendar', 'mountains'],
  projects: ['lumice'],
  paths: ['understand-halos', 'spectrum-to-colour'],
  about: '我喜欢研究一个问题，把它拆开，再重新组装。这里放着沿途写下的文章、做出的程序，以及还在生长的好奇心。',
  lightPath,
  // 只在 cyanotype 试样首页使用：首屏实时计算的说明与光线线索的收束句。
  plate: {
    caption: '一束平行的日光，穿过一颗缓慢转动的六角冰晶。每条光线出射时偏折的角度都被记下来；转过足够多的角度之后，偏折会在 22° 附近越积越密，内缘偏红——天空中那道 22° 晕就是这样来的。',
    note: '这里只算冰晶的二维截面，是浏览器里的实时计算，用来示意；完整的三维模拟见 Lumice。',
  },
  lightPathClosing: '换成可以计算的量、找到结构、再回答——冰晕、颜色、相机，走的都是同一条路。',
};
