---
title: 现代冰晕研究漫谈
question: 天空中的光环，能否从一颗冰晶开始理解？
summary: 从光线穿过冰晶的路径，走向对称性、三维旋转与数值模拟。看似繁复的天空图案，逐渐显出背后的结构。
topic: 光影与几何
media: halo
readingNote: 第 0 篇是现象与问题的起点。后续逐步进入光路、计算与数学结构，可以按章节顺序深入。
relatedProjects:
  - lumice
chapters:
  - label: '0'
    title: 风起青萍之末
    url: https://zhuanlan.zhihu.com/p/461810067
  - label: '1'
    title: 迷镜千幻不离宗
    url: https://zhuanlan.zhihu.com/p/462717356
  - label: '2'
    title: 计算机遍历、搜索、优化
    url: https://zhuanlan.zhihu.com/p/469793197
  - label: '3'
    title: 平行光路的各种弧和晕
    url: https://zhuanlan.zhihu.com/p/485848284
  - label: '4'
    title: 冰晕模拟仿真的朴素(naive)思路
    url: https://zhuanlan.zhihu.com/p/512594144
  - label: '5'
    title: 三维旋转
    url: https://zhuanlan.zhihu.com/p/516883186
  - label: '6'
    title: 蒙特卡洛 vs. 直接积分
    url: https://zhuanlan.zhihu.com/p/536772578
  - label: '7'
    title: 十二种矩阵背后的数学结构
    url: https://zhuanlan.zhihu.com/p/2082646907952821740
  - label: '8'
    title: 楔角光路
    url: https://zhuanlan.zhihu.com/p/2084963224814990674
  - label: '8.1 番外'
    title: 从古典几何到现代矩阵
    url: https://zhuanlan.zhihu.com/p/2087212931775837732
  - label: '9'
    title: 锥晶的有限与无限
    url: https://zhuanlan.zhihu.com/p/2087225407133304432
---
天空中的冰晕是一个很好的入口：眼前是弧线、光环与色彩，背后是微小冰晶中的折射和反射。

但从「知道原理」到「解释某一道弧为什么出现在这里」，中间还有很长一段路。晶体的形状与姿态、光线经过哪些面、哪些路径实际上能够发生，都需要认真分辨。

## 从光路走向结构

这个系列从现象与对称性起步，接着借助计算机枚举光路，讨论模拟的基本思路，再深入三维旋转、蒙特卡洛与直接积分。

继续向前，矩阵、反射群与楔角几何逐渐把许多看起来各不相同的光路联系起来。数学不只是给现象加上符号，也帮助我们看清哪些差异重要，哪些其实是同一结构的不同表现。

## 把理解放进程序

文章与 Lumice 的模拟互相连接：程序让光路变成可以观察的图案，图案又带来新的问题。想看模拟器本身，可以继续到下面的项目介绍。
