// 核验于 2026-10-19：独立读取已发表快照的 frontmatter 与文件 SHA-256。
// 快照仅用于审计；人工条目的页面标题与链接运行时权威仍为 content-sources.ts，
// 作者稿章节（halo-N）来源运行时自写作仓 frontmatter 派生，不在本文件登记。
export type SourceEvidence = { sourceId: string; title: string; url: string; snapshot: string; sha256: string; verifiedAt: string };
export const sourceEvidence: SourceEvidence[] = [
  {
    "sourceId": "halo-origin",
    "title": "绘光：冰晕模拟的故事",
    "url": "https://zhuanlan.zhihu.com/p/38975467",
    "snapshot": "Writing/articles/绘光：冰晕模拟的故事.md",
    "sha256": "df7b94eccd1f61d49a4185410cc0d8e2174b34675ee92b54b5949348f7f8f132",
    "verifiedAt": "2026-10-19"
  },
  {
    "sourceId": "calendar-1",
    "title": "重新发明农历 (1) - 重要的自然周期",
    "url": "https://zhuanlan.zhihu.com/p/16466051322",
    "snapshot": "Writing/articles/重新发明农历 (1) - 重要的自然周期.md",
    "sha256": "96dc1a9c72a00738d05a24197da5ce5f38157fcad074fcdb9cb517bd33aebf35",
    "verifiedAt": "2026-10-19"
  },
  {
    "sourceId": "calendar-2",
    "title": "重新发明农历 (2) - 测算回归年长度",
    "url": "https://zhuanlan.zhihu.com/p/17112174047",
    "snapshot": "Writing/articles/重新发明农历 (2) - 测算回归年长度.md",
    "sha256": "53c5ed11aad46d524eba1b36e105529074dbde95e0aa09413acea98dbc860d35",
    "verifiedAt": "2026-10-19"
  },
  {
    "sourceId": "calendar-3",
    "title": "重新发明农历 (3) - 月的周期与置闰",
    "url": "https://zhuanlan.zhihu.com/p/17647963472",
    "snapshot": "Writing/articles/重新发明农历 (3) - 月的周期与置闰.md",
    "sha256": "6dea06aa5c98bdab04e13085f2e384afe63f07d59214e4ae33ffdc7798afd26c",
    "verifiedAt": "2026-10-19"
  },
  {
    "sourceId": "calendar-4",
    "title": "重新发明农历 (4) - 天体运动复杂性",
    "url": "https://zhuanlan.zhihu.com/p/20913174233",
    "snapshot": "Writing/articles/重新发明农历 (4) - 天体运动复杂性.md",
    "sha256": "c51cfd205d2e83e5c18c62092b2afe23155563cbd8f4c6fc3b686b65d715be00",
    "verifiedAt": "2026-10-19"
  },
  {
    "sourceId": "calendar-5",
    "title": "重新发明农历 (5) - 唯象的天球模型",
    "url": "https://zhuanlan.zhihu.com/p/22831021105",
    "snapshot": "Writing/articles/重新发明农历 (5) - 唯象的天球模型.md",
    "sha256": "0d5fa078d69ec9fe53f0e661421f1396d1fe6252309ce2380e0dbff7acaf1acc",
    "verifiedAt": "2026-10-19"
  },
  {
    "sourceId": "mountains-1",
    "title": "寻找高山（1）",
    "url": "https://zhuanlan.zhihu.com/p/666675246",
    "snapshot": "Writing/articles/寻找高山（1）.md",
    "sha256": "8061ed1a83b8b6f0b629b1a2724f383597089d01dada505f6fb9e730685ea980",
    "verifiedAt": "2026-10-19"
  },
  {
    "sourceId": "color-space-basics",
    "title": "色彩空间基础",
    "url": "https://zhuanlan.zhihu.com/p/24214731",
    "snapshot": "Writing/articles/色彩空间基础.md",
    "sha256": "af88e588c6c450f963da28a4ab4f24adf65b52ea6ce8b53542226a5e75c5ae63",
    "verifiedAt": "2026-10-19"
  },
  {
    "sourceId": "color-space-conversion",
    "title": "色彩空间表示与转换",
    "url": "https://zhuanlan.zhihu.com/p/24281841",
    "snapshot": "Writing/articles/色彩空间表示与转换.md",
    "sha256": "09da721ca49f6e854236c8b6166101aa2f8acd1c0f68bc653263a37a9e7bcde0",
    "verifiedAt": "2026-10-19"
  },
  {
    "sourceId": "spectral-rendering",
    "title": "光谱渲染的几个例子",
    "url": "https://zhuanlan.zhihu.com/p/24312022",
    "snapshot": "Writing/articles/光谱渲染的几个例子.md",
    "sha256": "b79670bb42e05db16bba0250617b6c288e32946954c34a5175b5608eee3cde56",
    "verifiedAt": "2026-10-19"
  },
  {
    "sourceId": "white-balance",
    "title": "色温、白平衡与色彩恒常性",
    "url": "https://zhuanlan.zhihu.com/p/27165715",
    "snapshot": "Writing/articles/色温、白平衡与色彩恒常性.md",
    "sha256": "c4e5c1c15b50a7ae7c323151ff941f20e3d31c6a77b40ae5765b6248e7bd3fb9",
    "verifiedAt": "2026-10-19"
  },
  {
    "sourceId": "camera-colour",
    "title": "光线与数学的魔法：相机拍到的照片颜色是怎么和人眼看到的结果吻合的？",
    "url": "https://zhuanlan.zhihu.com/p/417012666",
    "snapshot": "Writing/articles/光线与数学的魔法：相机拍到的照片颜色是怎么和人眼看到的结果吻合的？.md",
    "sha256": "93dc137170cfe5c84c50a2a23caf34b5519a6965ab93c1519e8395e0080d000c",
    "verifiedAt": "2026-10-19"
  }
];
