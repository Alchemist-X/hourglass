# Slay the Spire 视觉参考资料

> 本文档为 Hourglass 交易面板 UI 重设计的视觉参考基础。
> 最后更新：2026-04-14

---

## 1. 游戏概述

### Slay the Spire (2019)

- **开发商**: Mega Crit Games (Casey Yano & Anthony Giovannetti)
- **引擎**: libGDX (Java)
- **类型**: Roguelike deck-building game
- **美术总监/画师**: Anailis Dorta (卡牌与事件插画), Bruce Brenneise (背景与 Boss 房间)
- **视觉风格**: 手绘 2D 风格，简洁但有辨识度。"简单而有魅力的 2D 手绘图形"，风格略带诡异但保持趣味性 ("kind of creepy but kind of fun energy")
- **设计影响**: Beyond Good and Evil, Kya: Dark Lineage, Sly Cooper Series, Okage: Shadow King（主要影响形状和色彩语言）

### Slay the Spire 2 (2026, Early Access)

- **发布日期**: 2026年3月5日 (Early Access, $24.99)
- **引擎**: Godot (从 Unity 转换)
- **美术总监**: Marlowe Dobbe (前 Dicey Dungeons)
- **核心画师**: Anailis Dorta (卡牌/事件插画), Chris Gortz (全职动画师)
- **角色**: 5个可玩角色 - Ironclad, Silent, Defect (回归) + Necrobinder, Regent (新增)
- **新特性**: 4人合作模式, 徽章系统 (Badges), 恐惧症模式 (Phobia Mode)
- **视觉进化**:
  - 更"playful"的基调，保留暗色主题元素
  - 更清晰的设计，减少绘画感 (less painterly)
  - 大幅增加动画和过渡效果
  - 更多全屏画作，"更 epic 而非 intimate"
  - 整体色彩更丰富
  - 更高分辨率纹理，流畅的骨骼动画和动态光照
  - 保留"墨水在纸上"的手绘质感

---

## 2. 色彩系统

### 2.1 角色主色

| 角色 | 颜色名 | 能量球颜色 | 卡牌边框色调 | 推荐 HEX |
|------|--------|-----------|-------------|----------|
| Ironclad | Red | RedEnergy | 红色系 | `#C62828` / `#D32F2F` |
| Silent | Green | GreenEnergy | 绿色系 | `#2E7D32` / `#388E3C` |
| Defect | Blue | BlueEnergy | 蓝色系 | `#1565C0` / `#1976D2` |
| Watcher | Purple | PurpleEnergy | 紫色系 | `#6A1B9A` / `#7B1FA2` |
| Necrobinder (StS2) | Pink | - | 粉色系 | `#AD1457` / `#C2185B` |
| Regent (StS2) | Orange | - | 橙色系 | `#E65100` / `#EF6C00` |
| Colorless | Neutral | ColorlessEnergy | 无色 | `#9E9E9E` |

### 2.2 卡牌稀有度色彩

| 稀有度 | Banner/边框颜色 | Shader 渐变描述 | 推荐 HEX |
|--------|---------------|----------------|----------|
| Common | 灰色 (Grey) | Common gold (原始描述) | `#808080` / `#A0A0A0` |
| Uncommon | 蓝色 (Blue) | Uncommon blue | `#4FC3F7` / `#29B6F6` |
| Rare | 金色 (Golden) | Rare amber | `#FFD700` / `#FFC107` |
| Basic | 灰色 (Grey) | 比 Common 更低级 | `#696969` / `#757575` |
| Event (StS2) | 绿色 (Green) | 仅从事件获取 | `#66BB6A` / `#4CAF50` |
| Ancient (StS2) | 银色棱镜 | "Faint-prismatic banner...blue flame at the top" | `#C0C0C0` + 棱镜光效 |
| Curse | 暗紫/深色 | Dark/purple materials | `#4A148C` / `#311B92` |
| Status | 暗色 | Dark materials | `#37474F` / `#263238` |

### 2.3 卡牌文字色彩 (StS2 精确值 - 来自 Card Exporter)

| 文字元素 | 颜色 HEX | 描述 |
|---------|----------|------|
| 标题文字 (Title) | `#FFF6E2` | 奶油色/温暖白 |
| 升级后费用 (Upgraded Cost) | `#00FF00` | 明亮绿色 |
| 类型标签 (Type Label) | `#000000C0` | 半透明黑色 |
| 描述文字 (Description) | `#FFF6E2` | 奶油色/温暖白 |
| 关键词 (Keywords) | `#EFC851` | 金色 |
| 格挡值 (Block Values) | `#87CEEB` | 天蓝色 (sky blue) |

### 2.4 地图节点色彩 (来自 Colored Map Mod RGB)

| 节点类型 | RGB | 推荐 HEX |
|---------|-----|----------|
| Elite (精英) | R:180 G:40 B:40 | `#B42828` |
| Rest Site (篝火) | R:210 G:180 B:60 | `#D2B43C` |
| Shop (商店) | R:50 G:160 B:80 | `#32A050` |
| Monster (怪物) | - | `#808080` (默认灰) |
| Boss (Boss) | - | `#FF1744` (推测红) |
| Event (事件) | - | `#FFD54F` (推测金/黄) |
| Treasure (宝箱) | - | `#FFD700` (金色) |

### 2.5 Relic 边框色彩

| 稀有度 | 边框颜色 | 说明 |
|--------|---------|------|
| Common | 灰色边框 | RelicFrameCommon.png |
| Uncommon | 蓝色边框 | - |
| Rare | 金色边框 | - |
| Boss | 特殊边框 | - |
| Shop/Event/Special | 使用 Rare 边框色 | 游戏内无独立颜色 |

### 2.6 推荐暗色背景色板 (适用于交易面板)

基于游戏的暗色基调和手绘质感：

```
背景最深色:     #0D1117  (接近纯黑，略带蓝调)
背景次深:       #161B22  (深灰蓝)
卡片/面板背景:  #1C2128  (稍亮的深灰)
边框/分隔:      #30363D  (中灰)
悬浮/激活:      #21262D  (深灰)
文字主色:       #FFF6E2  (奶油白 - 沿用卡牌设计)
文字次色:       #8B949E  (灰色)
强调色-金:      #EFC851  (关键词金)
强调色-蓝:      #87CEEB  (格挡蓝)
危险/卖出:      #B42828  (精英红)
成功/买入:      #32A050  (商店绿)
```

---

## 3. 字体与排版

### 3.1 游戏字体

| 字体 | 用途 | 权重 | 来源确认 |
|------|------|------|---------|
| **Kreon** | StS2 所有卡牌文字 (标题、费用、类型标签、描述、关键词) | 300 (Light), 600 (SemiBold), 700 (Bold) | Card Exporter 项目确认 |
| 未知 (自定义) | StS1 游戏内文字 | regular, bold, banner 三套 | Font mod 结构确认 |

### 3.2 StS2 卡牌文字规格 (精确)

| 元素 | 字体 | 权重 | 填充色 | 描边 |
|------|------|------|--------|------|
| Title (标题) | Kreon | 300 | `#FFF6E2` (cream) | 角色特定色 |
| Energy Cost (费用) | Kreon | 700 | `#00FF00` (升级后) | Dark |
| Type Label (类型) | Kreon | 600 | `#000000C0` (半透明黑) | None |
| Description (描述) | Kreon | 300 | `#FFF6E2` | None |
| Keywords (关键词) | Kreon | 300 | `#EFC851` (gold) | None |
| Block Values (格挡值) | Kreon | 300 | `#87CEEB` (blue) | None |

### 3.3 字体系统结构

游戏内字体文件分为三类：
- **regular.ttf** — 正文/描述文字
- **bold.ttf** — 强调/数值文字
- **banner.ttf** — 标题/横幅文字

StS2 英文 UI 字体使用 **MSDF 渲染** (Multi-channel Signed Distance Field)，在高分辨率下保持锐利边缘。

### 3.4 推荐 Web 字体替代方案

| 用途 | 推荐字体 | 理由 |
|------|---------|------|
| 卡牌标题/关键文字 | **Kreon** (Google Fonts) | 游戏原版字体 |
| 数值显示 | **Kreon Bold** 或 **Oswald** | 数字清晰可辨 |
| 正文描述 | **Kreon Light** 或 **Inter** | 可读性好 |
| 等宽数据 | **JetBrains Mono** | 交易数据对齐 |

---

## 4. 核心 UI 元素

### 4.1 卡牌设计

#### 卡牌结构 (StS2 图层系统 - 精确)

从底层到顶层的图层组成：

1. **Card Art (卡牌画作)** — 原始分辨率 1000x760px, 居中裁切
2. **Frame (边框)** — 角色色调着色 (red/green/blue/pink/orange), 含 shader 材质
3. **Portrait Border (肖像边框)** — 稀有度着色边缘
4. **Title Banner (标题横幅)** — 稀有度特定渐变 shader
5. **Energy Icon (能量图标)** — 角色特定能量球 + 费用数字
6. **Type Plaque (类型铭牌)** — "Attack" / "Skill" / "Power" 标签
7. **Text Elements (文字层)** — 描述、标题、费用、类型标签

默认导出尺寸：4200x5420px (10x viewport scale)

#### 卡牌类型边框形状

| 类型 | 边框形状 | 描述 |
|------|---------|------|
| Attack (攻击) | 矩形，底边收窄为梯形 | "rectangular border with the bottom edge being tapered down" |
| Skill (技能) | 标准矩形 | "rectangular border" |
| Power (能力) | 椭圆形/圆形 | "oval border" / "oval-tapered bottom edges" |
| Status (状态) | 特殊暗色 | 暗色 material 处理 |
| Curse (诅咒) | 特殊紫色 | 暗紫 material 处理 |
| Quest (任务, StS2 新增) | 不可打出，延迟奖励 | 独立视觉样式 |

#### 卡牌稀有度视觉系统

- **Common (普通)**: 灰色 banner + 灰色边框
- **Uncommon (罕见)**: 蓝色 banner + 蓝色边框
- **Rare (稀有)**: 金色 banner + 金色边框
- **Ancient (远古, StS2 新增)**: 微弱棱镜色 banner + 顶部蓝色火焰 + 全幅画作设计 + 独特辉光布局

#### 卡牌交互动画

- 抽牌/弃牌时卡牌带有**条纹拖影** (streaks), 帮助理解牌流
- "施法区域" (cast zone) 完美对齐，方便快速释放无目标法术
- 目标攻击的**碰撞体积极大** (hitboxes are absolutely massive)，敌人间距合理防止误点
- 手牌中的卡牌在未悬浮时文字呈**波浪效果** (wavy font), 悬浮后恢复正常
- 可以在抽牌动画未完成时就开始出牌
- 法术效果被描述为"令人满意的、夸张的" (satisfying, exaggerated)

#### 交易面板映射 — 卡牌 -> 交易信号/持仓

| 卡牌元素 | 交易面板对应 |
|---------|------------|
| 卡牌画作区 | 市场/资产缩略图或图表预览 |
| 标题 banner | 市场名称 |
| 能量费用 | 仓位大小/风险等级 |
| 类型铭牌 | 信号类型 (BUY/SELL/HOLD) |
| 描述文字 | AI 决策理由 |
| 稀有度边框 | 信号置信度 (低/中/高/极高) |
| 卡牌底部渐变 | 盈亏指示器 |

### 4.2 能量系统

#### 能量球外观

- 每个角色有**独立颜色的能量球**: Red, Green, Blue, Purple, Colorless
- 能量显示在手牌**左侧**
- 每回合开始获得 3 点能量（默认），遗物可修改
- 未使用的能量在回合结束时消失
- StS2 新增: 获得能量时有**角色特定 VFX** (视觉特效)

#### 交易面板映射 — 能量 -> 资金/风控

| 能量元素 | 交易面板对应 |
|---------|------------|
| 能量球 | 可用资金圆形指示器 |
| 能量数值 | 当前可用 bankroll |
| 能量颜色 | 风控状态 (绿=安全, 黄=警告, 红=接近上限) |
| 最大能量 | 总 bankroll |

### 4.3 生命/护甲条

#### HP 系统

- HP 范围: 0 到角色最大 HP
- HP 归零 = 死亡 (run 结束)
- 多种方式增/减 HP (卡牌、遗物、事件)

#### Block (格挡) 系统

- 格挡在受到攻击伤害前先消耗
- 默认在回合开始时清除（除非有 Barricade 等能力）
- 格挡值以数字显示在角色身上

#### 交易面板映射 — HP/Block -> 风控指标

| 生命元素 | 交易面板对应 |
|---------|------------|
| HP 条 | Portfolio 总值进度条 |
| 当前 HP | 当前净值 |
| 最大 HP | 历史最高净值 |
| Block | 当前对冲/止损保护 |
| HP 损失 | 回撤幅度 |

### 4.4 地图

#### 地图结构

- **7x15 不规则等距网格** (Irregular Isometric Grid, 三角形组成)
- 从底部向顶部前进
- 每层有多个可能的节点
- 路径以**弯曲线条** (curved lines) 连接节点
- 6条独立路径从底部生成
- 前两条路径的第一层起点不能相同
- StS2 新增: 合作模式下玩家**协作绘制地图路径**

#### 地图节点类型

| 节点 | 图标 | 描述 |
|------|------|------|
| Monster (怪物) | 剑/怪物图标 | 战斗，奖励金币+3选1卡牌+可能药水 |
| Elite (精英) | 火焰/强化怪物图标 | 更强的战斗，额外遗物奖励 |
| Rest Site (篝火) | 火堆图标 | 恢复 HP 或升级卡牌 |
| Shop (商店) | 购物袋/金币图标 | 买卖卡牌、遗物、药水 |
| Treasure (宝箱) | 宝箱图标 | 获得遗物 |
| Event (事件) | 问号图标 | 随机事件/选择 |
| Boss (Boss) | 特殊 Boss 图标 | 每幕最终 Boss 战 |

#### 交易面板映射 — 地图 -> Pipeline 进度

| 地图元素 | 交易面板对应 |
|---------|------------|
| 地图路径 | 交易 pipeline 流程图 |
| 节点类型 | Pipeline 阶段 (扫描/分析/决策/执行) |
| 当前位置 | 当前 pipeline 状态 |
| 路径分支 | 多市场并行分析 |
| Boss 节点 | 关键交易执行点 |

### 4.5 遗物

#### 遗物系统

- 永久被动加成物品，持续整个 run
- 显示在屏幕顶部的遗物栏中
- 悬浮时显示 tooltip (机制描述 + flavor text)

#### 遗物稀有度 (StS1)

| 稀有度 | 边框颜色 | 获取方式 |
|--------|---------|---------|
| Starter | 角色特定 | 开始 run 时 |
| Common | 灰色边框 | 50% 概率 |
| Uncommon | 蓝色边框 | 33% 概率 |
| Rare | 金色边框 | 17% 概率 |
| Boss | 特殊边框 | 击败 Boss |
| Shop | 使用 Rare 边框 | 商店购买 |
| Event | 使用 Rare 边框 | 特定事件 |

#### 遗物稀有度 (StS2)

| 稀有度 | 说明 |
|--------|------|
| Starter | 角色特定起始遗物 |
| Common | 基础遗物 |
| Uncommon | 中级遗物 |
| Rare | 强力遗物 |
| Ancient | 特殊高级遗物 (与 Neow, Orobas, Pael, Tezcatara 关联) |

#### 遗物视觉组成

- **RelicFrameCommon.png** — 边框组件
- **RelicBacking.png** — 底板组件
- 每个遗物有**独立的图标画作**
- 80px 缩略图尺寸 (wiki 标准)

#### 交易面板映射 — 遗物 -> 活跃策略/AVE Skills

| 遗物元素 | 交易面板对应 |
|---------|------------|
| 遗物图标 | AVE Skill 图标 |
| 遗物 tooltip | Skill 说明 + 当前状态 |
| 遗物栏 | 活跃监控 Skills 面板 |
| 遗物被动效果 | Skill 实时数据反馈 |

### 4.6 状态效果

#### Buff/Debuff 系统

- **Buff** (增益): 正面效果 (Strength, Barricade, Demon Form...)
- **Debuff** (减益): 负面效果 (Vulnerable, Weak, Poison...)
- StS2 Early Access: ~260 个状态效果 (196 buff, 42 debuff, 22 special/keyword)
- 效果以**图标+数字**方式显示在角色/敌人下方
- 可堆叠，数字表示层数

#### 视觉表现

- Buff 图标通常为**正面色调** (绿色/蓝色/金色)
- Debuff 图标通常为**负面色调** (红色/紫色)
- 悬浮显示详细 tooltip
- StS2: 不同怪物有**独特颜色的对话气泡**

#### 交易面板映射 — 状态效果 -> 市场指标

| 状态元素 | 交易面板对应 |
|---------|------------|
| Buff 图标 | 有利市场条件指标 |
| Debuff 图标 | 风险警告指标 |
| 层数 | 信号强度 |
| 效果描述 tooltip | 指标详细说明 |

### 4.7 战斗界面

#### 战斗 UI 布局

**顶部区域:**
- 遗物栏 (左/中)
- 药水槽 (3个, Potion Belt 遗物可增加)
- 角色肖像
- 设置菜单

**中间区域:**
- 玩家角色 (左)
- 敌人 (右，可多个)
- 意图图标 (Intent) 浮在敌人头顶
- 状态效果图标在角色/敌人下方

**底部区域:**
- 能量球 (左下)
- 手牌 (底部中央，弧形排列)
- 抽牌堆 (左下角)
- 弃牌堆 (右下角)
- "End Turn" 按钮 (右下)
- StS2: 按钮显示回合数 ("End Turn 2")

#### Intent 系统 (意图图标) — 详细

**攻击意图 (7个伤害等级):**
- 0-4 伤害 → 5-9 → 10-14 → 15-19 → 20-24 → 25-29 → 30+
- 武器符号随伤害等级增强而更加突出
- 多段攻击显示为 "数字xN" (如 6x3 = 18 真实伤害)

**防御意图:**
- 格挡图标 (盾牌形)
- 可与攻击组合显示 (7种伤害等级变体)

**Buff 意图:**
- 独立 buff / buff+攻击组合 / buff+格挡组合
- Mystic, Time Eater, Darklings 用 buff 图标表示治疗

**Debuff 意图:**
- 标准 debuff / "强力" debuff
- debuff+攻击组合 (7种变体) / debuff+格挡组合

**特殊意图:**
- Escape (逃跑) — 逃离战斗
- Sleep (睡眠) — 不行动
- Stunned (眩晕) — 无法行动
- Unknown (未知) — 隐藏真实意图 (分裂/爆炸/召唤/重生/无行动)

**修改意图显示的效果:**
- Runic Dome 遗物: 隐藏所有意图
- Writhing Mass: 受到伤害时随机化意图

#### 药水系统 (StS2)

- 3个药水槽 (Potion Belt 可增加)
- 每个药水有**独立视觉容器** (不再是颜色替换)
- 稀有药水有"异国情调"容器设计
- 悬浮时药水槽放大显示

---

## 5. Slay the Spire 2 新增元素

### 5.1 视觉革新

| 方面 | StS1 | StS2 |
|------|------|------|
| 引擎 | libGDX (Java) | Godot |
| 动画 | 有限 | 大幅增加，骨骼动画 + 动态光照 |
| 分辨率 | 标准 | 更高原生分辨率，72-150 DPI |
| 画风 | 手绘/绘画感 | 更清晰、更鲜明、保留手绘质感 |
| 色彩 | 相对暗沉 | 更丰富多彩 |
| 全屏画作 | 较少 | 更多，增加史诗感 |
| 角色设计 | 简洁 | "no more jagged edges", 更流畅 |

### 5.2 新增 UI 特性

- **Badges 系统**: run 结束时显示各种成就徽章
- **每日排行榜**: 仅显示好友分数，基于胜利/徽章/速度
- **Phobia Mode**: 恐惧症友好的专用美术资产
- **Ancient 卡牌**: 全新稀有度等级，棱镜色 banner + 蓝色火焰 + 全幅画作
- **Quest 卡牌**: 新卡牌类型 (不可打出，延迟奖励)
- **角色特定能量 VFX**: 获得能量时的角色独有视觉特效
- **怪物对话气泡**: 每个怪物有独特颜色的对话气泡
- **合作地图绘制**: 4人合作模式下的协作路径绘制

### 5.3 卡牌系统变化

- 每个角色有**独立版本的 Strike 和 Defend** (外观不同但功能相同)
- Signature cards 展示新机制和协同效果
- Event 稀有度 (绿色 banner/边框)
- Ancient 稀有度 (棱镜 banner + 蓝焰 + 全幅画作)

---

## 6. 设计原则总结

### 6.1 核心设计哲学

1. **"让出牌感觉尽可能好"** — 所有微交互都服务于这个目标
2. **清晰的信息层级** — 意图系统、稀有度色彩编码、状态效果图标
3. **暗色但不压抑** — "kind of creepy but kind of fun"
4. **手绘个性** — 不追求 AAA 写实，保持独特辨识度
5. **战略信息透明** — 显示精确伤害数值，而非模糊指示
6. **快速反馈循环** — 动画不阻塞操作，支持快速操作

### 6.2 信息架构原则

1. **色彩编码一切** — 角色、稀有度、节点类型、buff/debuff 都有独立色彩
2. **分层信息展示** — 默认显示关键信息，悬浮/交互展开详细信息
3. **空间布局直觉化** — 敌人在右/上，玩家在左/下，手牌居中
4. **视觉反馈即时** — 每个操作都有对应的视觉响应

### 6.3 适用于交易面板的关键原则

1. **深色背景 + 高对比度文字** — 减少视觉疲劳，适合长时间监控
2. **色彩编码风险等级** — 绿(安全)/黄(警告)/红(危险)/金(高置信度)
3. **卡片式信息展示** — 每个交易信号/持仓是一张"卡牌"
4. **悬浮展开详情** — 默认展示关键指标，hover 展示完整分析
5. **能量球 → 资金仪表** — 圆形/球形指示器显示资金状态
6. **地图节点 → Pipeline 阶段** — 线性/分支流程图展示交易管线
7. **遗物栏 → AVE Skills 状态栏** — 顶部横排展示活跃监控

---

## 7. 可复用的设计模式

### 7.1 卡片组件 (Card Component)

```
┌──────────────────────────────┐
│ [能量球] 标题 Banner         │  ← 稀有度渐变色
├──────────────────────────────┤
│                              │
│         画作/预览区          │  ← 1000x760 比例
│                              │
├──────────────────────────────┤
│ [类型铭牌: Attack/Skill]     │  ← 半透明黑底白字
├──────────────────────────────┤
│                              │
│  描述文字区 (cream #FFF6E2)  │
│  关键词高亮 (gold #EFC851)   │
│  数值高亮 (blue #87CEEB)     │
│                              │
└──────────────────────────────┘
     ↑ 边框色 = 角色/稀有度色
```

### 7.2 状态指示器模式

```
┌─────┐
│ 图标 │ ← 32x32 像素图标
│ [N] │ ← 右下角叠加层数
└─────┘
  ↑
tooltip 悬浮弹出详情
```

### 7.3 进度条模式

```
HP:    [████████████████░░░░] 80/100  ← 红色填充 + 深色背景
Block: [████████░░░░░░░░░░░░] 40     ← 蓝色填充 + 深色背景
```

### 7.4 能量球/资金仪表

```
    ┌───┐
   │ 3/4 │  ← 数值叠加在圆形上
    └───┘
   ← 圆形渐变, 角色/状态色
```

### 7.5 地图/流程节点

```
  [●]─────[●]─────[●]
   │       │       │
  [●]─────[●]     [●]
   │       │       │
  [●]─────[●]─────[●]
   ↑        ↑       ↑
  扫描    分析    执行
```

### 7.6 Intent / 信号预测指示器

```
    ┌─────────┐
    │ ⚔ 15x3  │  ← 图标 + 数值
    └─────────┘
        ↓
   [Enemy Card]
```

---

## 8. CSS/代码参考

### 8.1 CodePen 项目: Slay the Spire Run History (CSS)

**URL**: https://codepen.io/AleksandrHovhannisyan/pen/BaVRVGJ
**GitHub**: https://github.com/AleksandrHovhannisyan/slaythespire-run-history-css

- 使用 **layered background images** 组装卡牌图标
- 纯 HTML/CSS 实现 (HTML 74.8%, CSS 25.2%)
- 角色特定边框颜色:
  - Ironclad: 红色 borders
  - Silent: 绿色 borders
  - Defect: 蓝色 borders
  - Watcher: 紫色 borders

### 8.2 Slay the Web (完整 Web 实现)

**GitHub**: https://github.com/oskarrough/slaytheweb
**Tech Stack**: JavaScript 82%, CSS 12.4%, Astro 5.6%
**字体**: 来自 mbtype.com 的授权字体
**设计资源**:
- RPGUI framework (http://ronenness.github.io/RPGUI/)
- Game Icons (https://github.com/game-icons/icons)
- 历史书籍插图素材

### 8.3 StS2 Card Exporter (精确卡牌规格)

**GitHub**: https://github.com/elliotttate/sts2-card-exporter

导出每张 StS2 卡牌为高分辨率分层 SVG 和 PSD:
- Shader 效果已烘焙
- 可编辑文字层 (默认隐藏)
- 正确的字体、颜色、描边和阴影
- 默认 10x 缩放 (4200x5420px viewport)

### 8.4 推荐 CSS 实现方案

```css
/* === Slay the Spire 风格暗色主题 === */

:root {
  /* 背景色系 */
  --bg-deepest: #0D1117;
  --bg-deep: #161B22;
  --bg-card: #1C2128;
  --bg-hover: #21262D;
  --border-color: #30363D;

  /* 文字色系 (来自 StS2 卡牌文字) */
  --text-primary: #FFF6E2;     /* cream - 卡牌标题/描述 */
  --text-secondary: #8B949E;   /* 灰色辅助文字 */
  --text-keyword: #EFC851;     /* gold - 关键词/强调 */
  --text-value: #87CEEB;       /* sky blue - 数值/格挡 */
  --text-upgraded: #00FF00;    /* 升级/积极变化 */

  /* 角色/功能色 */
  --color-ironclad: #C62828;   /* 红 - 攻击性/危险 */
  --color-silent: #2E7D32;     /* 绿 - 成功/买入 */
  --color-defect: #1565C0;     /* 蓝 - 信息/中性 */
  --color-watcher: #6A1B9A;    /* 紫 - 神秘/特殊 */

  /* 稀有度色 */
  --rarity-common: #808080;
  --rarity-uncommon: #4FC3F7;
  --rarity-rare: #FFD700;
  --rarity-ancient: #C0C0C0;
  --rarity-curse: #4A148C;

  /* 功能色 */
  --signal-buy: #32A050;
  --signal-sell: #B42828;
  --signal-hold: #EFC851;
  --signal-high-confidence: #FFD700;

  /* 地图节点色 */
  --node-elite: #B42828;
  --node-rest: #D2B43C;
  --node-shop: #32A050;

  /* 字体 */
  --font-display: 'Kreon', serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* 间距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-card: 16px;
  --radius-circle: 50%;

  /* 阴影 */
  --shadow-card: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-hover: 0 8px 24px rgba(0, 0, 0, 0.6);
  --shadow-glow-gold: 0 0 12px rgba(239, 200, 81, 0.3);
  --shadow-glow-blue: 0 0 12px rgba(135, 206, 235, 0.3);
  --shadow-glow-red: 0 0 12px rgba(198, 40, 40, 0.3);
}

/* 基础卡片组件 */
.sts-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--spacing-md);
  transition: all 0.2s ease;
  font-family: var(--font-display);
  color: var(--text-primary);
}

.sts-card:hover {
  background: var(--bg-hover);
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

/* 稀有度边框 */
.sts-card--common { border-color: var(--rarity-common); }
.sts-card--uncommon { border-color: var(--rarity-uncommon); }
.sts-card--rare {
  border-color: var(--rarity-rare);
  box-shadow: var(--shadow-card), var(--shadow-glow-gold);
}

/* 标题 banner */
.sts-card__title {
  font-family: var(--font-display);
  font-weight: 300;
  color: var(--text-primary);
  font-size: 1.1rem;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  border-bottom: 1px solid var(--border-color);
}

/* 能量球/费用指示器 */
.sts-energy-orb {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-circle);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-primary);
  box-shadow: 0 0 8px currentColor;
}

.sts-energy-orb--red { background: radial-gradient(circle, #D32F2F, #8B0000); }
.sts-energy-orb--green { background: radial-gradient(circle, #388E3C, #1B5E20); }
.sts-energy-orb--blue { background: radial-gradient(circle, #1976D2, #0D47A1); }
.sts-energy-orb--purple { background: radial-gradient(circle, #7B1FA2, #4A148C); }

/* 类型铭牌 */
.sts-card__type {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(0, 0, 0, 0.75);
  background: rgba(255, 246, 226, 0.15);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  text-align: center;
}

/* 关键词高亮 */
.sts-keyword {
  color: var(--text-keyword);
  font-weight: 600;
}

/* 数值高亮 */
.sts-value {
  color: var(--text-value);
  font-weight: 700;
  font-family: var(--font-mono);
}

/* HP 进度条 */
.sts-hp-bar {
  height: 8px;
  background: var(--border-color);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.sts-hp-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #C62828, #E53935);
  border-radius: var(--radius-sm);
  transition: width 0.3s ease;
}

/* Block 条 */
.sts-block-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--text-value), #64B5F6);
  border-radius: var(--radius-sm);
}

/* 状态效果图标 */
.sts-status-icon {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sts-status-icon__count {
  position: absolute;
  bottom: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  font-size: 0.65rem;
  font-weight: 700;
  background: var(--bg-deepest);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 信号卡牌 (交易面板特定) */
.sts-signal-card--buy {
  border-left: 3px solid var(--signal-buy);
}

.sts-signal-card--sell {
  border-left: 3px solid var(--signal-sell);
}

.sts-signal-card--hold {
  border-left: 3px solid var(--signal-hold);
}

/* 遗物/Skill 图标栏 */
.sts-relic-bar {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--bg-deep);
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
}

.sts-relic-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--border-color);
  transition: transform 0.15s ease;
  cursor: pointer;
}

.sts-relic-icon:hover {
  transform: scale(1.2);
  border-color: var(--text-keyword);
}

/* 地图节点 */
.sts-map-node {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-circle);
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.15s ease;
}

.sts-map-node--active {
  box-shadow: 0 0 8px currentColor;
  transform: scale(1.3);
}

.sts-map-node--elite { background: var(--node-elite); }
.sts-map-node--rest { background: var(--node-rest); }
.sts-map-node--shop { background: var(--node-shop); }

/* End Turn 按钮 */
.sts-end-turn-btn {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-primary);
  background: linear-gradient(180deg, #4A4A4A, #2A2A2A);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  cursor: pointer;
  transition: all 0.15s ease;
}

.sts-end-turn-btn:hover {
  background: linear-gradient(180deg, #5A5A5A, #3A3A3A);
  border-color: var(--text-keyword);
}
```

### 8.5 Custom Card Maker 工具

| 工具 | URL | 功能 |
|------|-----|------|
| StS2 DIY Card Builder | https://slaythespire2.gg/tools/diy-card | 实时预览，提取的 StS2 UI 资产 |
| StS2 Wiki Card Builder | https://sts2wiki.com/tools/diy-card | 自定义边框、类型、标题、描述、能量球 |
| Custom Card Maker (itch.io) | https://kkouch.itch.io/slay-the-spire-custom-card-maker | StS1 卡牌制作 |
| Card Editor (NexusMods) | https://www.nexusmods.com/slaythespire2/mods/69 | StS2 Mod 卡牌编辑器 |

---

## 9. 资源链接

### 9.1 官方 & 一手资源

| 资源 | URL |
|------|-----|
| Mega Crit 官网 | https://www.megacrit.com/ |
| StS2 Press Kit | https://www.megacrit.com/press-kits/slay-the-spire-2/ |
| Steam 商店页 | https://store.steampowered.com/app/2868840/Slay_the_Spire_2/ |
| StS2 补丁日志 | https://slaythespire.wiki.gg/wiki/Slay_the_Spire_2:Patch_Notes |
| 首个 Gameplay Trailer | https://www.megacrit.com/news/2024-12-12-gameplay-trailer/ |

### 9.2 UI 截图 & 数据库

| 资源 | URL |
|------|-----|
| Interface In Game (StS2) | https://interfaceingame.com/games/slay-the-spire-2/ |
| Interface In Game (StS1) | https://interfaceingame.com/games/slay-the-spire/ |
| Game UI Database | https://www.gameuidatabase.com/ |
| SteamDB 截图 | https://steamdb.info/app/2868840/screenshots/ |
| Steam 社区截图 | https://steamcommunity.com/app/2868840/screenshots/ |
| MobyGames 媒体 | https://www.mobygames.com/game/256394/slay-the-spire-ii/media/ |
| RPGFan 截图 | https://www.rpgfan.com/gallery/slay-the-spire-2-screenshots/ |

### 9.3 Wiki & 百科

| 资源 | URL |
|------|-----|
| Wiki.gg (StS2 Cards) | https://slaythespire.wiki.gg/wiki/Slay_the_Spire_2:Cards |
| Wiki.gg (StS2 Relics) | https://slaythespire.wiki.gg/wiki/Slay_the_Spire_2:Relics_List |
| Fandom Wiki (Cards) | https://slay-the-spire.fandom.com/wiki/Cards |
| Fandom Wiki (Relics) | https://slay-the-spire.fandom.com/wiki/Relics |
| Fandom Wiki (Energy) | https://slay-the-spire.fandom.com/wiki/Energy |
| Wikipedia (StS1) | https://en.wikipedia.org/wiki/Slay_the_Spire |
| Wikipedia (StS2) | https://en.wikipedia.org/wiki/Slay_the_Spire_2 |
| StS2 Wiki 独立站 | https://sts2wiki.com/ |

### 9.4 美术 & 设计分析

| 资源 | URL |
|------|-----|
| PCGamesN - StS2 美术方向 | https://www.pcgamesn.com/slay-the-spire-2/art-direction |
| EveZone - 2D 资产分析 | https://evezone.evetech.co.za/game-desk/slay-the-spire-2-art-style-2d-assets/ |
| Cloudfall Studios - UI 分析 | https://www.cloudfallstudios.com/blog/2018/2/20/flash-thoughts-slay-the-spires-ui |
| Medium - UI/UX 重设计 | https://medium.com/@n01578837/final-deliverable-632cfc09e673 |
| Medium - 美术发现 | https://moregamesplease.medium.com/illustrating-slay-the-spire-discovering-the-art-in-games-191bd1a64569 |
| Behance - MP UI/UX 设计 | https://www.behance.net/gallery/120127633/Slay-the-Spire-Multiplayer-UIUX-Design |
| Dribbble - StS 设计 | https://dribbble.com/tags/slay_the_spire?s=latest |

### 9.5 代码 & CSS 实现

| 资源 | URL |
|------|-----|
| CodePen - Run History CSS | https://codepen.io/AleksandrHovhannisyan/pen/BaVRVGJ |
| GitHub - Run History CSS | https://github.com/AleksandrHovhannisyan/slaythespire-run-history-css |
| GitHub - Slay the Web | https://github.com/oskarrough/slaytheweb |
| GitHub - StS2 Card Exporter | https://github.com/elliotttate/sts2-card-exporter |
| GitHub - UiCard (Unity) | https://github.com/ycarowr/UiCard |
| GitHub - StS Map (Unity) | https://github.com/silverua/slay-the-spire-map-in-unity |
| Kaggle - Card Images Dataset | https://www.kaggle.com/datasets/jackemartin/slay-the-spire-card-images |

### 9.6 Mod & 素材资源

| 资源 | URL |
|------|-----|
| NexusMods - StS2 | https://www.nexusmods.com/slaythespire2 |
| NexusMods - UI Recolor | https://www.nexusmods.com/slaythespire2/mods/99 |
| NexusMods - PlayerColors | https://www.nexusmods.com/slaythespire2/mods/7 |
| NexusMods - Card Editor | https://www.nexusmods.com/slaythespire2/mods/69 |
| Spriters Resource (StS1) | https://www.spriters-resource.com/pc_computer/slaythespire/ |
| DeviantArt - Card Template | https://www.deviantart.com/darktailss/art/Slay-the-Spire-Card-Template-Yellow-754861993 |
| Fandom Wiki (图标分类) | https://slaythespire.wiki.gg/wiki/Category:Icons |

### 9.7 通用游戏 UI 资源

| 资源 | URL |
|------|-----|
| itch.io - Roguelike UI 资产 | https://itch.io/game-assets/free/tag-roguelike/tag-user-interface |
| Kenney - RPG Roguelike Pack | https://kenney.nl/assets/roguelike-rpg-pack |
| OpenGameArt - Roguelike/RPG | https://opengameart.org/content/roguelikerpg-pack-1700-tiles |
| GraphicRiver - Dark UI | https://graphicriver.net/dark+ui-and-dark-graphics-in-game-assets/user-interfaces |
| Envato - Phantasy Dark Cards | https://elements.envato.com/phantasy-dark-cards-game-app-ui-kit-template-7MEZXPC |
| RPGUI Framework | http://ronenness.github.io/RPGUI/ |
| Game Icons | https://github.com/game-icons/icons |
| Vecteezy - Dark Game UI | https://www.vecteezy.com/free-vector/game-ui-dark |

### 9.8 字体资源

| 资源 | URL |
|------|-----|
| Kreon (Google Fonts) | https://fonts.google.com/specimen/Kreon |
| FontMeme - Spire Font | https://fontmeme.com/fonts/spire-font/ |
| FontStruct - The Spire | https://fontstruct.com/fontstructions/show/2443269/the-spire |
| TypeType - Spire Fonts | https://typetype.org/fonts/spire/ |

---

## 附录: 交易面板设计映射总览

| StS 元素 | 面板对应 | 视觉实现建议 |
|---------|---------|-------------|
| 卡牌 | 交易信号/持仓卡片 | 带能量球、类型标签、稀有度边框的卡片组件 |
| 能量球 | 可用资金仪表 | 圆形渐变指示器，颜色反映风控状态 |
| HP 条 | Portfolio 净值 | 红色渐变进度条 |
| Block 条 | 对冲保护 | 蓝色渐变进度条 |
| 遗物栏 | AVE Skills 状态 | 顶部横排小图标，hover 放大+tooltip |
| 地图 | Pipeline 流程 | 节点+路径的流程图 |
| Intent 图标 | 市场预测 | 浮动图标+数值 |
| Buff/Debuff | 市场条件指标 | 图标+层数的状态标签 |
| End Turn 按钮 | 执行交易按钮 | 渐变背景+hover 金色边框 |
| 药水槽 | 快速操作槽 | 3个可用操作位 |
| 抽牌堆/弃牌堆 | 待处理/已完成信号 | 左下/右下的数字计数器 |
| 战斗场景 | 实时交易视图 | 左(我方持仓) vs 右(市场状态) |
| Badges | 交易成就/统计 | run 结束后的绩效徽章 |
