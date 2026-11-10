import { chapterToSourceId } from './article-identities.js';

export type SourceRecord = {
  id: string;
  title: string;
  url: string;
};

// 人工条目（写作仓之外的公开文章）标题与 URL 的唯一权威。站内导读及系列目录只保存
// sourceId。作者稿章节（halo-N）的 title/url 权威是写作仓 frontmatter，运行时由
// src/lib/content.ts 从 authorArticles collection 派生，不在本文件登记。
export const contentSources: SourceRecord[] = [
  { id: 'halo-origin', title: '绘光：冰晕模拟的故事', url: 'https://zhuanlan.zhihu.com/p/38975467' },
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

// Halo chapter sources derive at runtime from the author manuscripts — the
// writing repository frontmatter is their single authority. A halo-N id in the
// manual registry is a conflict, not a merge; manuscripts without a published
// URL produce no record, and `requireSource` fails loudly if one is referenced.
export function withChapterSources(manual: SourceRecord[], manuscripts: { chapter: string; title: string; historicalUrl?: string }[]): Map<string, SourceRecord> {
  const merged = new Map(manual.map((source) => [source.id, source]));
  for (const manuscript of manuscripts) {
    if (!manuscript.historicalUrl) continue;
    const id = chapterToSourceId(manuscript.chapter);
    if (merged.has(id)) throw new Error(`Content sources: manual registry conflicts with derived chapter source "${id}"`);
    merged.set(id, { id, title: manuscript.title, url: manuscript.historicalUrl });
  }
  return merged;
}
