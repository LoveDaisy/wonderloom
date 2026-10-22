import halo from '../assets/halo-render.jpg';
import celestial from '../assets/celestial-sphere.png';
import mountains from '../assets/mountain-view.png';
import pyramids from '../assets/pyramid-halos.png';
import spectrum from '../assets/spectrum-blackbody-colours.jpg';
import cameraResponse from '../assets/camera-corrected-response.jpg';
import crystalPath from '../assets/ice-crystal-ray-path.jpg';

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
  spectrum: {
    image: spectrum,
    alt: '黑体辐射的计算颜色图：横轴为温度，纵轴为相对亮度；颜色从深红、橙黄过渡到白与蓝。',
    caption: '从光谱分布计算可显示颜色的一个例子。',
    credit: '《光谱渲染的几个例子》原文配图 · 章佳杰',
  },
  cameraResponse: {
    image: cameraResponse,
    alt: '佳能 600D 与尼康 D90 经过色彩校正后的光谱响应曲线，横轴为波长，纵轴为灵敏度。',
    caption: '校正后的相机响应，向人眼的色彩匹配结果靠近。',
    credit: '《相机拍到的照片颜色是怎么和人眼看到的结果吻合的？》原文配图 · 章佳杰',
  },
  crystalPath: {
    image: crystalPath,
    alt: '一束光射入六角冰晶，在各个表面发生折射与反射，并分出多条可能光路的示意图。',
    caption: '追踪冰晶中所有折射和反射的光线。',
    credit: '《绘光：冰晕模拟的故事》原文示意图 · 章佳杰',
  },
} as const;

export type MediaId = keyof typeof media;

export const mediaIds = Object.keys(media) as [MediaId, ...MediaId[]];
