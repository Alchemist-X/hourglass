# Hourglass 黑客松计划（聚焦版）

> 目标：在 7 个加密价格预测市场上实现 AVE 信号驱动的自主交易
> 截止：2026-04-15
> 最后更新：2026-04-14

---

## 一、目标市场

| # | 市场 | 交易量 | 频率 | Token | 我们的 edge |
|---|------|--------|------|-------|------------|
| 1 | What price will Bitcoin hit in 2026? | $30.8M | 年度 | BTC | K线多周期趋势 + 鲸鱼积累检测 |
| 2 | What price will Bitcoin hit in April? | $19.2M | 月度 | BTC | 实时价格 + 买卖比失衡 |
| 3 | Bitcoin ATH by ___? | $6.1M | 季度 | BTC | K线突破信号 + 长期积累 |
| 4 | What price will Ethereum hit in April? | $4.2M | 月度 | ETH | ETH 价格 + 买卖比 |
| 5 | What price will Ethereum hit in 2026? | $4.1M | 年度 | ETH | K线长期趋势 |
| 6 | When will Bitcoin hit $150k? | $3.1M | 开放 | BTC | 鲸鱼买入趋势 + K线 |
| 7 | Bitcoin above ___ weekly | $2.9M | 周度 | BTC | 15分钟K线 + 鲸鱼实时交易 |

总交易量：$70.4M，全部为 P0 直接 edge 市场

## 二、使用的 AVE Skill（仅 4 个）

| Skill | AVE API | 用途 | 输出 |
|-------|---------|------|------|
| 📊 实时价格 | `POST /v2/tokens/price` | BTC/ETH 实时价格监控 | 当前价格 vs 市场赔率隐含价格 |
| 📈 K线分析 | `GET /v2/klines/token/{id}` | 多周期技术分析(15m/1h/4h/1d/1w) | 趋势方向、支撑阻力、波动率 |
| 🐋 鲸鱼追踪 | `GET /v2/txs/{pair-id}` | 大额交易检测（>$100K） | 买卖方向压力、积累/派发模式 |
| 📉 买卖比分析 | `GET /v2/tokens/{id}` | 5m/1h/6h/24h 买卖计数 | 实时链上情绪（买>卖=看涨） |

## 三、信号→交易 管线

```
1. AVE 实时价格 → BTC/ETH 当前价格
2. AVE K线 → 多周期趋势判断（涨/跌/震荡）
3. AVE 鲸鱼追踪 → 大额交易方向（净买入/净卖出）
4. AVE 买卖比 → 链上情绪（5m+1h+6h 加权）
         ↓
5. 信号聚合 → 综合得分（-1 到 +1）
         ↓
6. Polymarket 赔率对比 → edge = 我们的概率 - 市场隐含概率
         ↓
7. Kelly 仓位 → 1/4 Kelly 保守下注
         ↓
8. 风控检查 → 通过 → Polymarket CLOB 下单
```

## 四、具体实现

### 4.1 信号聚合逻辑（核心）

需要创建或修改的文件：

**`services/orchestrator/src/pulse/ave-crypto-signals.ts`（新建）**
- 只关注 BTC 和 ETH
- 输入：AveClient
- 输出：CryptoSignal { token, price, trend, whalePressure, sentimentScore, overallScore }

具体逻辑：
```
trendScore = K线分析（多周期加权: 15m×0.1 + 1h×0.2 + 4h×0.3 + 1d×0.3 + 1w×0.1）
  - 价格 > MA20 = +0.5
  - 价格 > MA50 = +0.3
  - MACD 金叉 = +0.2
  - 总分 -1 到 +1

whalePressure = 鲸鱼追踪
  - 过去 1h 大额交易（>$100K）的买入量 vs 卖出量
  - netBuyRatio = (buyVolume - sellVolume) / totalVolume
  - 范围 -1 到 +1

sentimentScore = 买卖比
  - buy_count_5m / (buy_count_5m + sell_count_5m) × 0.3
  + buy_count_1h / (buy_count_1h + sell_count_1h) × 0.4
  + buy_count_6h / (buy_count_6h + sell_count_6h) × 0.3
  - 标准化到 -1 到 +1

overallScore = trendScore × 0.4 + whalePressure × 0.3 + sentimentScore × 0.3
```

**`services/orchestrator/src/pulse/ave-signal-to-probability.ts`（新建）**
- 将 overallScore (-1 到 +1) 转换为价格预测概率
- 对于价格目标市场：计算 "BTC 到达 $X 的概率"
- 对比 Polymarket 当前赔率 → 计算 edge

### 4.2 市场匹配

**`services/orchestrator/src/pulse/ave-market-matcher.ts`（新建）**
- 输入：Polymarket 市场列表
- 过滤：只保留 BTC/ETH 价格目标市场
- 匹配规则：
  - 标题包含 "Bitcoin" / "BTC" / "Ethereum" / "ETH"
  - 标题包含 "price" / "hit" / "above" / "dip"
  - 排除已过期市场
  - 排除日内频率市场

### 4.3 管线串联

修改 `services/orchestrator/src/runtime/ave-polymarket-runtime.ts`：
- 使用 ave-crypto-signals 替代通用 ave-signal-enrichment
- 使用 ave-market-matcher 过滤目标市场
- 使用 ave-signal-to-probability 计算 edge

### 4.4 风控（保留原系统）
- 单笔 ≤ 15% bankroll
- 总敞口 ≤ 80%
- 回撤 ≥ 30% 停机
- 止损 ≥ 30% 平仓

## 五、执行步骤

### Step 1：创建 ave-crypto-signals.ts（1h）
- 实现 4 个 AVE Skill 的信号聚合
- 测试：mock 模式下 BTC/ETH 信号输出

### Step 2：创建 ave-signal-to-probability.ts（30min）
- overallScore → 价格概率转换
- edge 计算

### Step 3：创建 ave-market-matcher.ts（30min）
- Polymarket 市场过滤（只留 7 个目标）

### Step 4：修改 ave-polymarket-runtime.ts（30min）
- 接入新的聚焦管线

### Step 5：配置 .env.live + 实盘测试（1h）
- 钱包配置
- 小额测试（$5-20）
- 截取运行结果

### Step 6：更新文档 + 提交（30min）
- README 更新为聚焦版
- project-overview 更新
- 最终 push

总预计：4-5 小时

## 六、不做的事（明确砍掉）

- ❌ 非价格市场（Fed/地缘/政治/大宗商品/AI）
- ❌ 合约安全分析
- ❌ 新币发现
- ❌ 稳定币流动分析
- ❌ 板块排名/轮动
- ❌ 跨链资金流
- ❌ OpenClaw SKILL.md 文件（已完成，不再修改）
- ❌ Dashboard 进一步优化（已完成）
- ❌ Demo 视频（时间不够就不录）

## 七、成功标准

- [ ] pnpm ave:demo 展示 BTC/ETH 信号聚合结果
- [ ] 至少 1 笔实盘交易基于 AVE 信号执行
- [ ] README 清楚展示 4 个 AVE Skill × 7 个市场的 edge 逻辑
- [ ] Dashboard 能展示实盘仓位
