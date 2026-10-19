import halo from '../assets/halo-render.jpg';
import celestial from '../assets/celestial-sphere.png';
import mountains from '../assets/mountain-view.png';
import pyramids from '../assets/pyramid-halos.png';

export const media = {
  halo: {
    image: halo,
    alt: 'Lumice 生成的冰晕模拟图，多条明亮光弧与彩色光环交织在全天投影中。',
    caption: '冰晶里的光，经过一次计算，成为天空中的弧。',
    credit: 'Lumice 模拟渲染 · 章佳杰',
  },
  celestial: {
    image: celestial,
    alt: '天球模型：当地地平面、天赤道与北天极；北天极高度对应当地纬度。',
    caption: '从地面上的观测，建立一个天球模型。',
    credit: '《重新发明农历》原创示意图 · 章佳杰',
  },
  mountains: {
    image: mountains,
    alt: '南迦巴瓦顶峰的模拟全景，以方位角和俯仰角呈现四周山地。',
    caption: '站到山顶，把周围的地形展开来看。',
    credit: '章佳杰计算绘图 · 基础地形数据：SRTM',
  },
  pyramids: {
    image: pyramids,
    alt: '锥晶冰晕的三组模拟全景对照，展示不同条件下的晕环结构。',
    caption: '晶体变了，天空中的图案会怎样变化？',
    credit: '《现代冰晕研究漫谈》原创模拟图 · 章佳杰',
  },
} as const;

export type MediaId = keyof typeof media;

export const mediaIds = Object.keys(media) as [MediaId, ...MediaId[]];
