---
title: Lumice Integral
subtitle: 用确定性积分，重新观看一条冰晕光路。
kind: 研究代码
summary: 一份研究与参考代码：固定一个天空方向和光路，在晶体姿态的集合上计算其物理贡献，作为与蒙特卡洛模拟相互对照的另一种方法。
media: halo
relatedSeries:
  - ice-halos
links:
  - label: 查看 GitHub 源码
    url: https://github.com/LoveDaisy/Lumice-Integral
---
Lumice Integral 从冰晕的理论计算出发：给定出射方向和一条光路，寻找所有实现该映射的晶体姿态，并沿这些姿态集合做数值积分。

## 与 Lumice 的关系

Lumice 以蒙特卡洛光线追踪生成图像；Lumice Integral 是研究与参考代码，着重把姿态纤维、Jacobian 和不同光路的贡献显露出来。两者的结果可以相互对照，却各自保持独立的实现边界。

## 从第 6 篇继续

《现代冰晕研究漫谈》的第 6 篇把蒙特卡洛和直接积分放在同一个问题里比较。这个项目沿着直接积分的方向继续，为文章提供计算数据，也为 Lumice 的模拟结果提供理论对照。
