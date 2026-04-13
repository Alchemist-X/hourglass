# Hourglass 实施路线图

> 截止时间：2026-04-15
> 当前状态：代码完成，需要实盘 + 部署 + 展示
> 最后更新：2026-04-13

---

## 三大目标

### 目标 1：实盘交易
### 目标 2：部署网页
### 目标 3：展示设计和结果

---

## 目标 1：实盘交易（预计 2 小时）

### 当前状态
系统有两条独立路径，**尚未连接**：
- **路径 A（已验证）**：`pulse-live.ts` → `PulseDirectRuntime` → Polymarket CLOB 下单 → 真实交易
- **路径 B（已实现但未接入）**：`AvePolymarketRuntime`（AVE 信号增强 + Polymarket 执行），但 `runtime-factory.ts` 不知道它的存在

### 需要修改的文件

#### 1. `services/orchestrator/src/runtime/runtime-factory.ts`
**改动**：当 `AVE_API_KEY` 存在时，自动升级 `pulse-direct` 为 `AvePolymarketRuntime`
```typescript
// 在 createAgentRuntime() 中添加：
if (config.decisionStrategy === "pulse-direct" && config.ave.apiKey) {
  const aveClient = new AveClient({ apiKey: config.ave.apiKey });
  return new AvePolymarketRuntime(config, { aveClient });
}
```
**工作量**：30 分钟

#### 2. 创建 `.env.live`
```env
AUTOPOLY_EXECUTION_MODE=live
PRIVATE_KEY=0x<polygon-wallet-private-key>
FUNDER_ADDRESS=0x<polygon-wallet-address>
AVE_API_KEY=2BeMwKSjRPzT7UmKdhV84isFixiGOfpBjxU5RRMkznn9k1ugoZFOH8JTSuB1O5J6
CHAIN_ID=137
INITIAL_BANKROLL_USD=20
MAX_TRADE_PCT=0.5
MIN_TRADE_USD=0.01
```
**工作量**：10 分钟

#### 3. 验证 `AveClient` 兼容 `AveEnrichmentClient` 接口
**文件**：`services/ave-monitor/src/client.ts`
**改动**：确认返回类型字段名匹配（price_usd, price_change_24h 等），如不匹配需加薄适配层
**工作量**：15 分钟

#### 4. 执行实盘
```bash
ENV_FILE=.env.live pnpm pulse:live
```
流程：Preflight → 抓取 Polymarket 市场 → AVE 信号增强 → AI 决策 → Kelly 仓位 → 风控 → FOK 下单
**工作量**：1 小时（含调试）

### 前置条件
- [ ] Polygon 钱包有 USDC（$20 即可）
- [ ] Polymarket 可访问（无地理限制）
- [ ] AVE API 恢复正常（当前 522）

---

## 目标 2：部署网页（预计 2-3 小时）

### 当前状态
- Dashboard 已完成（品牌 Hourglass、持仓面板、监控面板）
- 支持 Spectator 模式：设置 `POLYMARKET_PUBLIC_WALLET_ADDRESS` 即可展示真实钱包数据
- `AveMonitoringPanel` 当前是空的（`PLACEHOLDER_ALERTS = []`）
- `vercel.json` 已配置

### 需要修改的文件

#### 1. `apps/web/app/page.tsx`
**改动**：替换空的 `PLACEHOLDER_ALERTS` 为真实/模拟告警数据
```typescript
// 替换:
const PLACEHOLDER_ALERTS: readonly AveAlert[] = [];

// 改为: 生成真实感告警（价格异常、鲸鱼活动等）
```
**工作量**：30 分钟

#### 2. 新建 `apps/web/app/api/public/ave-alerts/route.ts`
**功能**：
- 调用 AVE API 获取 trending tokens
- 检测 >5% 价格变动 → 生成 price_alert
- 检测异常交易量 → 生成 whale_movement
- 返回 AveAlert[]
**工作量**：1 小时

#### 3. Vercel 部署
```bash
# 设置环境变量
vercel env add POLYMARKET_PUBLIC_WALLET_ADDRESS
vercel env add NEXT_PUBLIC_POLYMARKET_PUBLIC_WALLET_ADDRESS
vercel env add AVE_API_KEY

# 部署
vercel deploy --prod --yes -A vercel.json
```
**工作量**：20 分钟

#### 4. 验证
- [ ] 打开线上 URL
- [ ] 确认持仓数据显示正确
- [ ] 确认 AVE 监控面板有告警数据
- [ ] 确认 equity chart 显示历史曲线

### 前置条件
- [ ] 目标 1 先完成（至少有 1-2 笔交易，否则 Dashboard 空）
- [ ] Vercel 账号 + CLI

---

## 目标 3：展示设计和结果（预计 2 小时）

### 需要修改的文件

#### 1. `README.md` — 添加 Results 章节
在 "Demo" 之后新增：
- 真实 `pnpm pulse:live` 运行截图（AVE 信号增强 + 交易执行）
- 部署后的 Dashboard 截图
- 交易记录表格：市场 | AVE 信号 | 入场价 | 当前价 | PnL
- 终端 `pnpm ave:demo` 输出截图
**工作量**：30 分钟

#### 2. `docs/project-overview.md` — 添加实际数据
- 实际交易结果
- Dashboard 部署链接
- 量化指标："扫描 X 个 token，检测 Y 个异常，执行 Z 笔交易"
**工作量**：30 分钟

#### 3. 架构图美化
制作可视化架构图（draw.io / Excalidraw），替代 ASCII 图
**工作量**：30 分钟

#### 4. 打动评审的关键指标
| 指标 | 说明 |
|------|------|
| AVE 信号处理 | "扫描 X 个 token，跨 5 条链，检测 Y 个价格异常，Z 个鲸鱼活动" |
| 信号→交易转化 | "X 个加密市场中，Y 个有 AVE 信号，Z 个产生交易" |
| Edge 分布 | 市场价格 vs AVE 评估的 edge 直方图 |
| 风控活动 | "N 笔交易提议，M 笔通过 6 层风控，K 笔被拦截" |
| PnL 曲线 | Dashboard 实时净值图 |

---

## 执行时间表

### 4月13日（今天）

| 时间 | 任务 | 目标 |
|------|------|------|
| 下午 | 修改 runtime-factory.ts，配置 .env.live | 目标 1 |
| 下午 | 执行 2-3 笔实盘交易 | 目标 1 |
| 晚上 | 填充 AveMonitoringPanel 数据 | 目标 2 |
| 晚上 | Vercel 部署 + 验证 | 目标 2 |

### 4月14日

| 时间 | 任务 | 目标 |
|------|------|------|
| 上午 | README 添加 Results + 截图 | 目标 3 |
| 上午 | project-overview 添加实际数据 | 目标 3 |
| 下午 | 录制 Demo 视频 | 目标 3 |
| 晚上 | Buffer: 补充交易 / 修 bug | 全部 |

### 4月15日（最后一天）

| 时间 | 任务 |
|------|------|
| 上午 | 最终 README review |
| 下午 | 提交 |

---

## 关键文件清单

### 目标 1（实盘）
- `services/orchestrator/src/runtime/runtime-factory.ts` — 接入 AvePolymarketRuntime
- `.env.live` — 实盘配置（新建）
- `services/ave-monitor/src/client.ts` — 可能需要接口适配

### 目标 2（网页）
- `apps/web/app/page.tsx` — 填充 AVE 告警数据
- `apps/web/app/api/public/ave-alerts/route.ts` — AVE 告警 API（新建）
- Vercel 环境变量

### 目标 3（展示）
- `README.md` — 添加 Results 章节 + 截图
- `docs/project-overview.md` — 添加实际数据 + 部署链接
