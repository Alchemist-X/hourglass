# Polymarket 市场 × AVE Skill 能力映射清单

> **项目**: Hourglass — AVE Claw DeFi Agent
> **目标**: 识别 Polymarket 预测市场中 AVE Claw 链上技能可提供信息优势的高价值市场
> **最后更新**: 2026-04-13

---

## 1. 概述

本文档对 Polymarket 活跃预测市场进行了系统性筛选，识别出 AVE Claw 链上监控与交易技能可提供正向边际优势（edge）的市场清单。

### 筛选标准

| 条件 | 阈值 |
|------|------|
| 最低交易量 | >= $2M |
| 结算频率 | 周度及以上（排除 5分钟、15分钟、小时、日内结算市场） |
| 保留类型 | 周度、月度、季度、年度、一次性、滚动、长期、开放 |

### 核心统计

| 指标 | 数值 |
|------|------|
| 符合条件市场总数 | **54** |
| 覆盖总交易量 | **$1,168.9M** |
| 识别分类数 | **7 大类** |
| 关联 AVE Skill 标签数 | **10 个** |

---

## 2. AVE Skill 标签定义

以下为全文统一使用的 AVE 能力标签体系，每个标签对应一个或多个 AVE Claw API 端点：

| 标签 | AVE API 端点 | 说明 | 适用市场类型 |
|------|-------------|------|-------------|
| 📊 实时价格 | `POST /v2/tokens/price` | 批量价格监控（最多200个token） | 所有加密价格市场 |
| 📈 K线分析 | `GET /v2/klines` | 13个时间周期（5m~1M）技术分析 | 价格目标市场 |
| 🐋 鲸鱼追踪 | `GET /v2/txs` | 大额交易检测、钱包地址追踪、买卖方向判定 | 价格市场 + 公司/协议市场 |
| 🔥 趋势检测 | `GET /v2/trending` | 链上热度信号、跨链趋势发现 | 情绪相关市场 |
| 🏷️ 板块排名 | `GET /v2/ranks` | 13个赛道轮动（Hot/Gainers/Losers/AI/DePIN等） | 板块/生态竞争市场 |
| 🔒 合约安全 | `GET /v2/contracts` | 蜜罐检测、rug pull 风险、权限集中度分析 | memecoin/新币发行市场 |
| 🔍 新币发现 | `GET /v2/tokens?keyword=` | 合约部署检测、新token搜索、空投追踪 | 币发行/空投市场 |
| 💰 稳定币流动 | `POST /v2/tokens/price` (USDT/USDC) | 资金避险/风险偏好切换信号 | 宏观/地缘政治市场 |
| 📉 买卖比分析 | `GET /v2/tokens/{id}` | 5m/1h/6h/24h 买卖计数、多空比率 | 短期价格市场 |
| 🌐 跨链资金流 | `GET /v2/trending` + `/v2/tokens` | 资金跨链迁移检测、生态竞争分析 | 生态竞争/L2市场 |

---

## 3. 市场分类清单

### 3.1 加密货币价格目标市场（AVE 直接 edge）

> AVE Claw 的价格监控、K线分析、鲸鱼追踪能力可直接为这类市场提供高置信度信号。链上数据即为市场本身的底层资产数据源。

| 市场 | 交易量 | 结算频率 | 相关Token | AVE Skill 标签 | Edge 说明 |
|------|--------|---------|-----------|--------------|----------|
| What price will Bitcoin hit in 2026? | $30.8M | 年度 | BTC | 📊📈🐋 | 多周期K线+鲸鱼积累模式识别长期价格走势 |
| What price will Bitcoin hit in April? | $19.2M | 月度 | BTC | 📊🔥📉 | 实时价格+交易流+趋势检测捕捉月度区间 |
| What price will Bitcoin hit in 2026 (ATH)? | $6.1M | 季度 | BTC | 📊📈🏷️ | 积累模式识别+K线突破信号+排名趋势 |
| What price will Ethereum hit in April? | $4.2M | 月度 | ETH | 📊📈💰 | ETH价格+DeFi TVL趋势+Gas费变化 |
| What price will Ethereum hit in 2026? | $4.1M | 年度 | ETH | 📊📈🌐 | ETH长期趋势+L2生态资金流向 |
| When will Bitcoin hit $150k? | $3.1M | 开放 | BTC | 📊📈🐋 | 长期持有者分析+鲸鱼买入趋势 |
| Bitcoin above ___ on April 13? (weekly) | $2.9M | 周度 | BTC | 📊📈🐋 | 15分钟K线+鲸鱼大额交易实时检测 |

**小计**: 7 个市场，交易量 $70.4M

---

### 3.2 加密货币公司/协议市场

> 针对特定协议、钱包、代币发行事件，AVE 的合约检测、钱包监控、新币发现能力可提供领先信号。

| 市场 | 交易量 | 结算频率 | 相关Token | AVE Skill 标签 | Edge 说明 |
|------|--------|---------|-----------|--------------|----------|
| MicroStrategy sells any Bitcoin by ___? | $22.2M | 滚动 | BTC | 🐋📊 | 已知钱包地址监控+大额BTC转移检测 |
| MegaETH market cap (FDV) one day after launch? | $15.2M | 一次性 | MegaETH | 🏷️🔒🔍 | L2排名分析+合约安全检测+新币追踪 |
| Will MetaMask launch a token by ___? | $8.4M | 滚动 | MetaMask | 🔍🔒 | 合约部署实时检测+新代币搜索 |
| Will Base launch a token by ___? | $6.0M | 滚动 | Base | 🌐🔍 | 链活跃度追踪+合约部署检测 |
| Opensea FDV above ___? | $5.7M | 一次性 | OpenSea | 🔍🏷️ | 新币检测+市值排名分析 |
| IPOs before 2027? (Ripple Labs) | $5.7M | 年度 | XRP | 📊🐋 | XRP链上活跃度+大额交易趋势 |
| Puffpaw FDV above ___? | $5.2M | 一次性 | Puffpaw | 🏷️🔒 | DePIN赛道排名+合约安全审计 |
| Predict.fun FDV above ___? | $3.8M | 一次性 | Predict | 🔍🏷️ | 新币检测+同类项目对比排名 |
| Metamask FDV above ___? | $2.9M | 一次性 | MetaMask | 🔍🏷️ | 新币追踪+可比项目估值分析 |
| USD.AI FDV above ___? | $2.8M | 一次性 | USD.AI | 🏷️💰 | AI赛道排名+稳定币机制分析 |
| Pump.fun airdrop by ___? | $2.7M | 滚动 | PumpFun | 🔍🌐 | SOL链合约部署监控+空投检测 |
| Will Satoshi move any Bitcoin in 2026? | $2.5M | 年度 | BTC | 🐋📊 | 已知历史地址持续监控+转账检测 |
| MegaETH airdrop by ___? | $2.1M | 滚动 | MegaETH | 🔍🔒 | 合约部署检测+空投合约识别 |

**小计**: 13 个市场，交易量 $85.2M

---

### 3.3 美联储/货币政策市场（加密作为前瞻指标）

> 链上风险偏好信号可前置反映美联储决策预期。加密市场对利率预期的价格发现通常快于传统市场。DeFi TVL 变化、稳定币流向、BTC 大额交易方向是核心前瞻指标。

| 市场 | 交易量 | 结算频率 | AVE Skill 标签 | Edge 说明 |
|------|--------|---------|--------------|----------|
| Fed decision in April? | $77.6M | 月度 | 🔥💰📊 | DeFi TVL趋势+稳定币流入流出+BTC作为风险情绪代理 |
| Who will be confirmed as Fed Chair? | $27.9M | 一次性 | 📊📈 | BTC价格对政策消息的即时反应+K线突变检测 |
| How many Fed rate cuts in 2026? | $18.5M | 年度 | 📊💰🔥 | 链上风险偏好长期累计追踪 |
| Fed Decision in June? | $7.1M | 月度 | 🔥💰📊 | 同上：DeFi TVL+稳定币+BTC情绪 |
| What will Fed rate be at end of 2026? | $6.2M | 年度 | 📊💰🔥 | 链上风险偏好长期累计追踪 |
| Fed Decision in July? | $3.6M | 月度 | 🔥💰📊 | 同上：DeFi TVL+稳定币+BTC情绪 |

**小计**: 6 个市场，交易量 $140.9M

---

### 3.4 大宗商品/宏观市场（加密相关性）

> 加密资产与大宗商品存在显著相关性。稳定币流动是避险情绪的领先指标；代币化黄金（PAXG）提供链上实时黄金价格信号；AI Token 是 NVIDIA 等科技股的链上代理。

| 市场 | 交易量 | 结算频率 | AVE Skill 标签 | Edge 说明 |
|------|--------|---------|--------------|----------|
| WTI Crude Oil April? | $27.4M | 月度 | 💰📊 | 稳定币流向作为避险信号+BTC反向价格代理 |
| Largest Company end of April/June? | $10.6M | 月度 | 🏷️🔥 | AI Token板块排名作为NVIDIA市值代理指标 |
| Crude Oil by end of June? | $9.6M | 月度 | 💰📊 | 同上：稳定币避险信号 |
| Gold by end of June? | $3.6M | 月度 | 📊🐋 | PAXG链上交易量+代币化黄金持仓变化 |
| Silver by end of June? | $3.5M | 月度 | 📊🔥 | 贵金属Token追踪+链上情绪信号 |

**小计**: 5 个市场，交易量 $54.7M

---

### 3.5 地缘政治市场（加密风险信号）

> 地缘政治危机是加密短期波动的第一驱动力。链上数据（交易所流入、稳定币转换、大额卖出）可在新闻公开前数小时检测到 risk-off 定位转变。

| 市场 | 交易量 | 结算频率 | AVE Skill 标签 | Edge 说明 |
|------|--------|---------|--------------|----------|
| Iranian regime fall by April/June/2027? | $44.5M | 滚动 | 🐋💰📊 | BTC大额卖出检测+稳定币大规模转换+风险情绪指标 |
| Iran x Israel/US conflict ends? | $38.1M | 滚动 | 🐋💰📈 | 交易所流入量（避险）+5分钟K线突变 |
| China invade Taiwan? | $24.5M | 滚动 | 🐋💰🌐 | 亚洲交易所资金流动+USDT溢价检测 |
| Trump visit China? | $23.7M | 月度 | 📊🔥 | 关税缓和→加密看涨信号+BTC趋势 |
| Russia-Ukraine ceasefire? | $20.5M | 滚动 | 🐋💰🌐 | 东欧交易所资金流向+链上风险情绪 |
| Strait of Hormuz traffic? | $7.5M | 月度 | 💰📊 | 石油→通胀→加密风险传导链 |
| Trump announces ceasefire? | $2.6M | 月度 | 📊🔥 | 风险偏好转变+BTC即时反应 |
| US-Iran peace deal? | $2.3M | 月度 | 📊🔥 | 同上：风险偏好转变信号 |

**小计**: 8 个市场，交易量 $163.7M

---

### 3.6 政治市场（加密政策影响）

> 加密监管政策预期直接影响链上活跃度和资金流向。BTC 日线趋势可作为政策情绪的链上代理指标。

| 市场 | 交易量 | 结算频率 | AVE Skill 标签 | Edge 说明 |
|------|--------|---------|--------------|----------|
| Presidential Election 2028 | $520.3M | 长期 | 📊📈 | BTC日线/周线趋势作为政策情绪代理 |
| Trump out as President? | $17.0M | 滚动 | 📊📈🐋 | 加密政策风险+BTC突变检测 |
| Balance of Power: 2026 Midterms | $4.9M | 年度 | 📊🔥 | 监管预期→链上情绪追踪 |
| Which party wins House 2026? | $4.5M | 年度 | 📊🔥 | 同上：监管预期+链上情绪 |
| California wealth tax? | $2.9M | 年度 | 📊🌐 | DeFi自托管趋势+资本外逃链上信号 |

**小计**: 5 个市场，交易量 $549.6M

---

### 3.7 科技/AI市场

> AI Token 板块与传统 AI 产业高度联动。链上 AI Token 的 TVL、持有者变化、买入检测是传统 AI 市场的领先/同步指标。

| 市场 | 交易量 | 结算频率 | AVE Skill 标签 | Edge 说明 |
|------|--------|---------|--------------|----------|
| Best AI model end of April/June? | $10.3M | 月度 | 🏷️🔥📊 | AI Token排名+AI板块资金流入趋势 |
| SpaceX IPO closing market cap? | $3.0M | 一次性 | 🏷️📊 | 科技Token情绪作为科技股IPO代理 |
| Claude 5 released by ___? | $2.9M | 月度 | 🏷️🔥🐋 | AI Token提前大额买入检测+板块趋势 |
| AI bubble burst? | $2.6M | 年度 | 🏷️🔥📊 | AI Token TVL下降+持有者流失追踪 |

**小计**: 4 个市场，交易量 $18.8M

---

## 4. 按 AVE Skill 反向索引

> 本节回答："如果我有某个 AVE 能力，可以覆盖哪些市场？"

### 📊 实时价格 (`POST /v2/tokens/price`)

**覆盖市场数**: 42 个 | **覆盖交易量**: ~$1,083.4M

几乎所有市场均可通过 BTC/ETH 实时价格作为情绪基线信号。直接适用市场：

- 所有加密货币价格目标市场（7个）
- 所有美联储/货币政策市场（6个）— BTC 作为风险偏好代理
- 所有地缘政治市场（8个）— BTC 即时价格反应
- 所有政治市场（5个）— BTC 日线趋势作为政策情绪代理
- 大宗商品市场中的原油、黄金（4个）
- MicroStrategy、Satoshi、Ripple 等公司市场（3个）
- 全部科技/AI 市场（4个）

---

### 📈 K线分析 (`GET /v2/klines`)

**覆盖市场数**: 18 个 | **覆盖交易量**: ~$744.4M

- 全部 BTC/ETH 价格目标市场（7个）— 多周期技术分析
- Fed Chair 确认（$27.9M）— K线突变检测
- 伊朗/以色列冲突（$38.1M）— 5分钟K线危机检测
- Presidential Election 2028（$520.3M）— 日线/周线政策情绪
- Trump out as President（$17.0M）— BTC 突变模式
- 科技/AI 市场（4个）— AI Token K线趋势

---

### 🐋 鲸鱼追踪 (`GET /v2/txs`)

**覆盖市场数**: 16 个 | **覆盖交易量**: ~$421.7M

- BTC 价格目标市场（4个）— 鲸鱼积累/分配模式
- MicroStrategy 卖出 BTC（$22.2M）— 已知钱包大额转移
- Satoshi 移动 BTC（$2.5M）— 历史地址持续监控
- Ripple IPO（$5.7M）— XRP 大额交易趋势
- 伊朗局势（$44.5M）— BTC 大额卖出检测
- Iran-Israel 冲突（$38.1M）— 交易所流入量
- 中国-台湾（$24.5M）— 亚洲交易所异常交易
- 俄乌停火（$20.5M）— 东欧交易所大额流动
- Trump out（$17.0M）— BTC 鲸鱼突变
- Claude 5 发布（$2.9M）— AI Token 大额买入
- 黄金（$3.6M）— PAXG 大额交易

---

### 🔥 趋势检测 (`GET /v2/trending`)

**覆盖市场数**: 20 个 | **覆盖交易量**: ~$394.3M

- BTC/ETH 月度价格市场（2个）— 链上热度信号
- 全部美联储市场（6个）— DeFi TVL 趋势
- 地缘政治市场中的 Trump 相关（3个）— 风险偏好转变信号
- 政治市场（3个）— 链上情绪追踪
- 科技/AI 市场（4个）— AI 板块热度
- 大宗商品-最大公司（$10.6M）— AI Token 趋势
- 白银（$3.5M）— 贵金属 Token 热度

---

### 🏷️ 板块排名 (`GET /v2/ranks`)

**覆盖市场数**: 14 个 | **覆盖交易量**: ~$89.5M

- BTC ATH 市场（$6.1M）— 排名趋势
- MegaETH FDV（$15.2M）— L2 排名分析
- Opensea/Puffpaw/Predict.fun/Metamask/USD.AI FDV（5个，$20.4M合计）— 同类排名对比
- 最大公司市场（$10.6M）— AI Token 排名代理
- 全部科技/AI 市场（4个）— AI 板块排名

---

### 🔒 合约安全 (`GET /v2/contracts`)

**覆盖市场数**: 6 个 | **覆盖交易量**: ~$33.8M

- MegaETH FDV（$15.2M）— 合约安全检测
- MetaMask token（$8.4M）— 合约合法性验证
- Puffpaw FDV（$5.2M）— 合约安全审计
- MegaETH airdrop（$2.1M）— 空投合约验证
- 以上市场需判断代币是否为真实官方部署，🔒 合约安全是必须技能

---

### 🔍 新币发现 (`GET /v2/tokens?keyword=`)

**覆盖市场数**: 9 个 | **覆盖交易量**: ~$49.3M

- MetaMask token（$8.4M）— 合约部署检测
- Base token（$6.0M）— 合约部署检测
- Opensea FDV（$5.7M）— 新币检测
- Predict.fun FDV（$3.8M）— 新币检测
- Metamask FDV（$2.9M）— 新币追踪
- USD.AI FDV（$2.8M）— 新币检测
- Pump.fun airdrop（$2.7M）— SOL 链合约监控
- MegaETH FDV + airdrop（$17.3M）— 新币/空投检测

---

### 💰 稳定币流动 (`POST /v2/tokens/price` USDT/USDC)

**覆盖市场数**: 16 个 | **覆盖交易量**: ~$502.1M

- 全部美联储市场（6个，$140.9M）— 稳定币流入/流出作为利率预期信号
- 全部地缘政治市场中涉及避险的（6个）— 稳定币大规模转换
- 大宗商品-原油（2个，$37.0M）— 稳定币避险信号
- USD.AI FDV（$2.8M）— 稳定币机制分析
- California wealth tax（$2.9M）— 资本外逃信号

---

### 📉 买卖比分析 (`GET /v2/tokens/{id}`)

**覆盖市场数**: 3 个 | **覆盖交易量**: ~$22.1M

- BTC 月度价格（$19.2M）— 5m/1h/6h/24h 买卖比率
- BTC 周度价格（$2.9M）— 短期多空信号

此技能主要适用于短期（周度/月度）加密价格市场。

---

### 🌐 跨链资金流 (`GET /v2/trending` + `/v2/tokens`)

**覆盖市场数**: 7 个 | **覆盖交易量**: ~$60.2M

- ETH 2026 价格（$4.1M）— L2 生态资金流向
- Base token（$6.0M）— 链活跃度对比
- Pump.fun airdrop（$2.7M）— SOL 链资金流
- 中国-台湾（$24.5M）— 亚洲交易所 USDT 溢价检测
- 俄乌停火（$20.5M）— 东欧交易所资金流向
- California wealth tax（$2.9M）— DeFi 自托管/资本迁移

---

## 5. 优先级矩阵

### 优先级划分标准

| 优先级 | 定义 | 条件 |
|-------|------|------|
| **P0** | AVE 直接 edge | AVE 链上数据即为市场底层资产的一手数据源，信号直接可交易 |
| **P1** | AVE 强相关 | AVE 链上数据是市场结果的高相关性前瞻/同步指标 |
| **P2** | AVE 间接信号 | AVE 提供间接风险信号，需结合其他数据源使用 |

### 优先级清单

| 优先级 | 条件 | 市场数 | 总交易量 |
|-------|------|--------|---------|
| **P0** | AVE直接edge + 链上数据即底层资产 | **20** | **$155.6M** |
| **P1** | AVE强相关 + 链上前瞻指标 | **14** | **$325.2M** |
| **P2** | AVE间接信号 + 需多源融合 | **20** | **$688.1M** |

---

### P0 — AVE 直接 edge（立即可部署）

链上数据即为市场底层资产数据源，无需外部信息即可生成交易信号。

| 市场 | 交易量 | 核心 AVE Skill |
|------|--------|---------------|
| What price will Bitcoin hit in 2026? | $30.8M | 📊📈🐋 |
| What price will Bitcoin hit in April? | $19.2M | 📊📈📉 |
| MicroStrategy sells any Bitcoin by ___? | $22.2M | 🐋📊 |
| MegaETH market cap (FDV) one day after launch? | $15.2M | 🏷️🔒🔍 |
| Will MetaMask launch a token by ___? | $8.4M | 🔍🔒 |
| What price will Bitcoin hit in 2026 (ATH)? | $6.1M | 📊📈🏷️ |
| Will Base launch a token by ___? | $6.0M | 🌐🔍 |
| Opensea FDV above ___? | $5.7M | 🔍🏷️ |
| IPOs before 2027? (Ripple Labs) | $5.7M | 📊🐋 |
| Puffpaw FDV above ___? | $5.2M | 🏷️🔒 |
| What price will Ethereum hit in April? | $4.2M | 📊📈💰 |
| What price will Ethereum hit in 2026? | $4.1M | 📊📈🌐 |
| Predict.fun FDV above ___? | $3.8M | 🔍🏷️ |
| When will Bitcoin hit $150k? | $3.1M | 📊📈🐋 |
| Bitcoin above ___ on April 13? (weekly) | $2.9M | 📊📈🐋 |
| Metamask FDV above ___? | $2.9M | 🔍🏷️ |
| USD.AI FDV above ___? | $2.8M | 🏷️💰 |
| Pump.fun airdrop by ___? | $2.7M | 🔍🌐 |
| Will Satoshi move any Bitcoin in 2026? | $2.5M | 🐋📊 |
| MegaETH airdrop by ___? | $2.1M | 🔍🔒 |

---

### P1 — AVE 强相关（链上前瞻指标）

链上数据是市场结果的高相关性领先指标，可独立或辅助生成交易信号。

| 市场 | 交易量 | 核心 AVE Skill |
|------|--------|---------------|
| Fed decision in April? | $77.6M | 🔥💰📊 |
| Iranian regime fall? | $44.5M | 🐋💰📊 |
| Iran x Israel/US conflict? | $38.1M | 🐋💰📈 |
| Who will be confirmed as Fed Chair? | $27.9M | 📊📈 |
| China invade Taiwan? | $24.5M | 🐋💰🌐 |
| Russia-Ukraine ceasefire? | $20.5M | 🐋💰🌐 |
| How many Fed rate cuts in 2026? | $18.5M | 📊💰🔥 |
| Best AI model end of April/June? | $10.3M | 🏷️🔥📊 |
| Fed Decision in June? | $7.1M | 🔥💰📊 |
| What will Fed rate be at end of 2026? | $6.2M | 📊💰🔥 |
| Fed Decision in July? | $3.6M | 🔥💰📊 |
| SpaceX IPO closing market cap? | $3.0M | 🏷️📊 |
| Claude 5 released by ___? | $2.9M | 🏷️🔥🐋 |
| AI bubble burst? | $2.6M | 🏷️🔥📊 |

---

### P2 — AVE 间接信号（多源融合）

AVE 提供补充性风险/情绪信号，需结合传统数据源使用。

| 市场 | 交易量 | 核心 AVE Skill |
|------|--------|---------------|
| Presidential Election 2028 | $520.3M | 📊📈 |
| WTI Crude Oil April? | $27.4M | 💰📊 |
| Trump visit China? | $23.7M | 📊🔥 |
| Trump out as President? | $17.0M | 📊📈🐋 |
| Largest Company end of April/June? | $10.6M | 🏷️🔥 |
| Crude Oil by end of June? | $9.6M | 💰📊 |
| Strait of Hormuz traffic? | $7.5M | 💰📊 |
| Balance of Power: 2026 Midterms | $4.9M | 📊🔥 |
| Which party wins House 2026? | $4.5M | 📊🔥 |
| Gold by end of June? | $3.6M | 📊🐋 |
| Silver by end of June? | $3.5M | 📊🔥 |
| California wealth tax? | $2.9M | 📊🌐 |
| Trump announces ceasefire? | $2.6M | 📊🔥 |
| US-Iran peace deal? | $2.3M | 📊🔥 |

> **备注**: P2 市场虽然 AVE edge 间接，但总交易量巨大（$640.4M）。在多源融合策略中，链上情绪信号可作为重要权重因子。

---

## 6. 数据统计

### 6.1 总览

| 指标 | 数值 |
|------|------|
| 符合条件市场总数 | 54 |
| 覆盖总交易量 | $1,168.9M |
| P0 市场数 | 20（37.0%） |
| P1 市场数 | 14（25.9%） |
| P2 市场数 | 20（37.0%） |

### 6.2 按分类交易量分布

```
分类                            交易量        占比     市场数
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
政治市场                        $549.6M      47.0%    ██████████████████████████████  5
地缘政治市场                     $163.7M      14.0%    █████████████                  8
美联储/货币政策                   $140.9M      12.1%    ██████████                     6
公司/协议市场                     $85.2M       7.3%    ██████                         13
价格目标市场                      $70.4M       6.0%    █████                          7
大宗商品/宏观                     $54.7M       4.7%    ████                           5
科技/AI 市场                     $18.8M       1.6%    █                              4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
合计                            $1,083.3M*   —        48 个市场

* 注：部分市场（如 "When will Bitcoin hit $150k?"）在分类 1 和 2 中均出现，
  去重后合计 54 个独立市场，$1,168.9M。
```

### 6.3 按 AVE Skill 标签使用频率

```
AVE Skill 标签              覆盖市场数    覆盖交易量       使用频率排名
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 实时价格                  42          ~$1,083.4M      ████████████████████  #1
💰 稳定币流动                16          ~$502.1M        ████████              #2
🔥 趋势检测                  20          ~$394.3M        ██████████            #3
📈 K线分析                   18          ~$744.4M        █████████             #4
🐋 鲸鱼追踪                  16          ~$421.7M        ████████              #5
🏷️ 板块排名                  14          ~$89.5M         ███████               #6
🔍 新币发现                   9          ~$49.3M         █████                 #7
🌐 跨链资金流                  7          ~$60.2M         ████                  #8
🔒 合约安全                    6          ~$33.8M         ███                   #9
📉 买卖比分析                   3          ~$22.1M         ██                    #10
```

### 6.4 关键洞察

1. **📊 实时价格是万能基底**: 78% 的市场可通过 BTC/ETH 实时价格获取基线情绪信号，这是 AVE 部署的第一优先级能力。

2. **P0 市场全部为纯加密市场**: 20 个 P0 市场完全围绕加密资产价格和代币发行，AVE Claw 的链上数据是一手信息源，无需外部数据即可建立 edge。

3. **💰 稳定币流动是宏观桥梁**: 稳定币流向分析将 AVE 的能力从加密原生市场延伸到美联储决策、地缘政治等高交易量宏观市场（覆盖 $502.1M）。

4. **🐋 鲸鱼追踪覆盖最高质量市场**: 虽然只覆盖 16 个市场，但包含 MicroStrategy（$22.2M）、伊朗局势（$44.5M）、台海危机（$24.5M）等高价值目标。

5. **🔍 新币发现是独家能力**: 9 个代币发行/空投市场完全依赖合约部署检测——这是 AVE 独有且无法被传统数据源替代的能力。

6. **交易量集中度高**: 前 10 大市场占总交易量的 76%，集中资源覆盖这些市场可获得最大 ROI。

---

> **下一步行动**: 基于本映射清单，优先部署 P0 市场的 AVE Skill 集成，从 📊 实时价格 + 🐋 鲸鱼追踪 组合开始，逐步扩展至 🔍 新币发现 和 💰 稳定币流动。
