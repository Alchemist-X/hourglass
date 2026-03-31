# Polymarket 可用分类标签速查表

> 快照时间：2026-03-31T04:22Z | 数据来源：Polymarket Gamma API

## 数据来源说明

这些标签**来自 Polymarket 官方 Gamma API**（`gamma-api.polymarket.com/events`），不是我们自己发明的。

具体逻辑：
1. **优先使用** `event.category`（Polymarket 官方分类字段）
2. **若为空**，回退到 `event.tags[0]`（该事件的第一个官方标签）
3. 在实际数据中，绝大多数市场走的是 `first-tag` 回退路径（Polymarket 的 `category` 字段经常为空）

标签本身是 Polymarket 官方提供的，但"哪个标签当作主分类"是我们的代码决定的（取第一个）。

---

## 用法

```bash
# 只看某个分类的市场
pnpm pulse:recommend -- --category <slug>

# 示例
pnpm pulse:recommend -- --category politics
pnpm pulse:recommend -- --category tech
pnpm pulse:recommend -- --category sports
```

---

## 全部标签一览（按可交易候选数降序）

| slug | 名称 | 抓取 | 可交易 | AI 类型权重 |
|------|------|------|--------|------------|
| `sports` | Sports | 1851 | 266 | 1.0x |
| `politics` | Politics | 856 | 109 | 1.5x |
| `bitcoin` | Bitcoin | 140 | 41 | 0.3x |
| `crypto` | Crypto | 171 | 32 | 0.3x |
| `pop-culture` | Culture | 229 | 27 | 1.0x |
| `soccer` | Soccer | 265 | 22 | 1.0x |
| `ethereum` | Ethereum | 92 | 20 | 0.3x |
| `geopolitics` | Geopolitics | 66 | 19 | 1.5x |
| `tennis` | Tennis | 274 | 19 | 1.0x |
| `iran` | Iran | 42 | 16 | 0.8x |
| `trump` | Trump | 94 | 13 | 1.5x (→ politics) |
| `yearly` | Yearly | 18 | 13 | 0.8x |
| `middle-east` | Middle East | 138 | 12 | 0.8x |
| `ipos` | IPOs | 33 | 12 | 1.2x (→ finance) |
| `commodities` | Commodities | 29 | 12 | 0.8x |
| `esports` | Esports | 506 | 11 | 1.0x |
| `elections` | Elections | 207 | 10 | 1.5x (→ politics) |
| `finance` | Finance | 75 | 9 | 1.2x |
| `nfl` | NFL | 17 | 9 | 1.0x (→ sports) |
| `football` | football | 17 | 9 | 1.0x |
| `tech` | Tech | 116 | 8 | 1.5x |
| `comex-gold-futures` | COMEX Gold Futures | 38 | 8 | 0.8x |
| `israel` | Israel | 30 | 8 | 0.8x |
| `metadao` | Metadao | 27 | 8 | 0.8x |
| `world-elections` | World Elections | 256 | 7 | 1.5x (→ politics) |
| `games` | Games | 109 | 7 | 0.8x |
| `eurovision` | Eurovision | 100 | 7 | 0.8x |
| `world` | World | 55 | 7 | 0.8x |
| `mlb` | MLB | 45 | 7 | 1.0x (→ sports) |
| `american-league` | American League | 22 | 7 | 0.8x |
| `recurring` | Recurring | 31 | 6 | 0.8x |
| `bundesliga-2` | Bundesliga 2 | 6 | 6 | 0.8x |
| `music` | Music | 90 | 5 | 0.8x |
| `wta` | WTA | 74 | 5 | 0.8x |
| `fed-rates` | Fed Rates | 15 | 5 | 1.2x (→ finance) |
| `chess` | Chess | 14 | 5 | 0.8x |
| `business` | Business | 13 | 5 | 0.8x |
| `ncaa` | NCAA | 90 | 4 | 0.8x |
| `trump-machado` | Trump-Machado | 63 | 4 | 1.5x (→ politics) |
| `economy` | Economy | 57 | 4 | 1.2x (→ finance) |
| `brazil` | Brazil | 32 | 4 | 0.8x |
| `us-presidential-election` | US Election | 24 | 4 | 1.5x (→ politics) |
| `mojtaba` | Mojtaba | 6 | 4 | 0.8x |
| `khamenei` | Khamenei | 5 | 4 | 0.8x |
| `awards` | Awards | 71 | 3 | 0.8x |
| `formula1` | Formula 1 | 33 | 3 | 0.8x |
| `ai` | AI | 28 | 3 | 1.5x |
| `economic-policy` | Economic Policy | 9 | 3 | 1.2x (→ finance) |
| `airdrops` | Airdrops | 8 | 3 | 0.3x (→ crypto) |
| `spacex` | SpaceX | 7 | 3 | 1.5x (→ tech) |
| `starmer` | Starmer | 6 | 3 | 0.8x |
| `fomc` | fomc | 5 | 3 | 1.2x (→ finance) |
| `inflation` | Inflation | 18 | 2 | 0.8x |
| `ath` | ATH | 4 | 2 | 0.8x |
| `nba` | NBA | 56 | 1 | 1.0x (→ sports) |
| `league-of-legends` | league of legends | 35 | 1 | 1.0x (→ esports) |
| `baseball` | baseball | 17 | 1 | 0.8x |
| `pandemics` | Pandemics | 9 | 1 | 0.8x |
| `trump-presidency` | Trump Presidency | 8 | 1 | 1.5x (→ politics) |
| `strait-of-hormuz` | Strait of Hormuz | 3 | 1 | 0.8x |
| `foreign-policy` | Foreign Policy | 2 | 1 | 0.8x |
| `houthi` | houthi | 2 | 1 | 0.8x |
| `denmark` | Denmark | 1 | 1 | 0.8x |
| `fed` | Fed | 1 | 1 | 1.2x (→ finance) |
| `reza-pahlavi` | Reza Pahlavi | 1 | 1 | 0.8x |
| `ukraine-peace-deal` | Ukraine Peace Deal | 1 | 1 | 0.8x |

### 以下标签当前 0 个可交易候选（被短期价格过滤器或流动性门槛过滤）

| slug | 名称 | 抓取 | 原因 |
|------|------|------|------|
| `nhl` | NHL | 241 | 短期体育赛事 |
| `up-or-down` | Up or Down | 194 | 短期价格涨跌预测 |
| `weather` | Weather | 110 | 低权重 0.5x + 短期 |
| `hide-from-new` | Hide From New | 75 | 系统标签 |
| `crypto-prices` | Crypto Prices | 20 | 短期价格预测 |
| `temperature` | Daily Temperature | 22 | 短期天气 |
| `nymex-crude-oil-futures` | NYMEX Crude Oil | 29 | 短期商品价格 |
| `solana` / `xrp` | Solana / XRP | 18 / 17 | 短期 crypto 价格 |
| 其余 20+ 个 | — | — | 流动性不足或短期到期 |

---

## 类型权重说明

类型权重影响候选排序分数（`score = log10(liquidity) * log10(volume24h) * typeWeight`）。

| 权重 | 分类 | 含义 |
|------|------|------|
| **1.5x** | politics, geopolitics, tech, ai, elections, trump | AI 有优势，长期推理 |
| **1.2x** | economics, finance, fed, fomc | AI 有中等优势 |
| **1.0x** | sports, esports, culture | 基准线 |
| **0.5x** | weather | AI 优势较低 |
| **0.3x** | crypto, bitcoin, ethereum | AI 几乎无 edge（价格随机游走） |
| **0.8x** | 其他所有 | 默认权重 |

---

## 注意事项

- 可交易候选数会随 Polymarket 市场动态变化，本表为某一时刻的快照。
- `--category` 使用**精确匹配** slug，大小写敏感。
- 也可以用 `--tag` 按标签过滤（一个市场可以有多个 tag，但只有一个 primary category）。
