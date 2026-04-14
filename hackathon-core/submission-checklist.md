# Hourglass 提交清单

> 截止时间：2026-04-15
> 提交渠道：clawhackathon.aveai.trade 官方渠道
> 最后检查：2026-04-14

---

## 一、必须提交项

### 1. 项目源代码（GitHub 链接）
- [ ] GitHub 仓库公开可访问
  - 链接：https://github.com/Alchemist-X/hourglass
  - 验证：浏览器打开确认可见
- [ ] 代码可运行
  - `pnpm install` 成功
  - `pnpm build` 通过（TypeScript 零错误）
  - `pnpm ave:demo` 可执行（mock 模式，无需 API Key）
  - `pnpm ave:live` 可执行（需要 .env.live）
- [ ] 原创性
  - 基于 autonomous-poly-trading 架构，但 AVE 集成层全部原创
  - 新增 TypeScript 文件数：397+
  - 新增代码行数：56,000+
  - Git 提交记录：112+ commits

### 2. 项目说明文档（含使用的 AVE Skill 说明）
- [ ] README.md 包含：
  - 项目简介（中英双语）
  - 四层架构图（ASCII）
  - AVE Skill 使用说明（12 个 API 端点详细列表）
  - 运行方式（Quick Start + 5 种 Run Mode）
  - 技术栈列表
  - 风控规则表
  - 项目结构说明
- [ ] hackathon-core/project-overview.md（详细项目说明书，7 大章节）
  - 系统架构详解
  - AVE Claw Skill 深度集成说明
  - 端到端闭环场景示例
  - 商业价值与实用性分析
  - 技术实现亮点
  - 评审维度对照表
- [ ] AVE Skill 使用说明（4 个核心 Skill）：
  - 📊 实时价格 — POST /v2/tokens/price（批量 200 个 Token）
  - 📈 K线分析 — GET /v2/klines/token/{id}（13 种时间粒度）
  - 🐋 鲸鱼追踪 — GET /v2/txs/{pair-id}（大额交易检测 >$100K）
  - 📉 买卖比 — GET /v2/tokens/{id}（5m/1h/6h/24h 多时间窗口）
- [ ] 额外 AVE API 集成（共 12 个端点）：
  - GET /v2/tokens（Token 搜索，跨 130+ 链）
  - GET /v2/tokens/trending（趋势发现）
  - GET /v2/ranks（排名筛选）
  - GET /v2/contracts/{token-id}（合约安全扫描）
  - GET /v2/supported_chains（链支持查询）
  - GET /v2/klines/{pair-id}（交易对 K 线）
  - GET /v2/tokens/main（主流代币）
  - GET /v2/ranks/topics（排名主题）
- [ ] SKILL.md 文件（3 个 AVE Skill 定义）：
  - skills/ave-monitoring/SKILL.md
  - skills/ave-trading/SKILL.md
  - skills/ave-complete/SKILL.md

### 3. 功能演示视频（≤5分钟）
- [ ] 视频已录制
- [ ] 时长 ≤ 5 分钟
- [ ] 内容覆盖：
  - 项目介绍（Hourglass 是什么、解决什么问题）
  - AVE Skill 集成展示（4 张卡牌 × 信号数据）
  - 信号聚合 + Edge 计算过程
  - 交易执行 + 风控展示
  - Dashboard 全景展示
  - 真实交易结果

---

## 二、加分项检查

### 赛道符合性（Complete Application Scenario）
- [ ] 至少调用一项 AVE Skill — 实际集成 12 个 API 端点，使用 4 个核心 Skill
- [ ] 监控类 Skill：
  - 资产追踪（Token 搜索 + 趋势发现 + 排名）
  - 价格预警（批量实时价格 + K 线多周期分析）
  - 异常检测（鲸鱼大额交易 + 买卖比失衡）
  - 风险评估（合约安全扫描 — 蜜罐、mint 权限、税费）
- [ ] 交易类 Skill：
  - 信号生成（AVE 链上信号 + Polymarket 赔率 → Edge 计算）
  - 自动执行（Polymarket CLOB FOK/GTC 订单，免 Gas 签名）
  - 组合管理（7 级持仓分类复审 + Kelly 仓位 + 6 层风控）
- [ ] 完整应用场景（监控 + 交易组合）— 端到端闭环

### 评审维度对照
- [ ] 创新性 (30%)
  - 链上数据驱动预测市场 Edge — 独特方向，非简单 API 包装
  - Framework-Free 架构 — 不锁定 AI Agent 框架
  - 7 级持仓分类模型 — 基于 Edge 衰减的精细化管理
- [ ] 技术实现 (30%)
  - 12 个 AVE API 端点深度集成
  - 4-Skill 信号聚合（K 线 40% + 鲸鱼 30% + 买卖比 30%）
  - Kelly 仓位计算（1/4 Kelly 保守策略）
  - 全链路 TypeScript + Zod 校验 + 超时/重试/降级
  - pnpm monorepo 12 子包，关注点分离
  - 合约安全审计自动影响概率估计
- [ ] 实用性与商业价值 (40%)
  - 真实交易记录（链上可验证，钱包 0xc788）
  - 3 笔真实交易，2 个活跃持仓
  - 50+ 次 Pulse 分析运行的成熟代码库
  - Mock/Live 无缝切换，可直接部署
  - 6 层服务层硬风控，不可被策略层绕过
  - 解决真实问题：链上数据是预测市场的先行指标

### 展示效果
- [ ] 线上 Dashboard 可访问
  - URL：https://hourglass-eta.vercel.app
  - Slay the Spire 卡牌视觉风格
  - 实时展示 AVE 信号流 + Polymarket 持仓
- [ ] 真实交易记录展示（链上可验证）
- [ ] 推理过程可视化
  - 4 张 AVE Skill 卡牌（实时价格 / K 线 / 鲸鱼 / 买卖比）
  - 信号聚合 → Edge 计算 → Kelly 仓位 → 风控 → 执行
  - 思考过程时间轴（2.1 秒完成全流程）
- [ ] 终端 Demo 可运行
  - `pnpm ave:demo` 彩色终端输出
  - 信号采集 → 聚合 → 市场匹配 → Edge 计算 → 风控 → 执行

---

## 三、提交前最后检查

### 安全检查
- [ ] `.env` 没有被提交到 Git
- [ ] `.env.live` 没有被提交到 Git
- [ ] 私钥（PRIVATE_KEY）没有在代码中硬编码
- [ ] AVE_API_KEY 没有在代码中硬编码
- [ ] `.gitignore` 包含所有敏感文件

### 代码检查
- [ ] `pnpm install` 成功（无 peer dependency 错误）
- [ ] `pnpm build` 通过（TypeScript 零错误）
- [ ] `.env.example` 包含所有必要环境变量说明

### 部署检查
- [ ] GitHub README 最新版已推送
- [ ] Vercel 部署正常运行（https://hourglass-eta.vercel.app）
- [ ] Vercel 部署无构建错误

### 提交物检查
- [ ] 视频已上传
- [ ] 通过 clawhackathon.aveai.trade 官方渠道提交
- [ ] 提交表单所有字段已填写

---

## 四、当前状态

| 项目 | 状态 | 说明 |
|------|------|------|
| GitHub 源代码 | ✅ 完成 | https://github.com/Alchemist-X/hourglass |
| README.md | ✅ 完成 | 中英双语，含架构图、AVE Skill、运行方式 |
| 项目说明文档 | ✅ 完成 | hackathon-core/project-overview.md（7 大章节） |
| AVE Skill 说明 | ✅ 完成 | 12 个 API 端点，4 个核心 Skill 详细说明 |
| SKILL.md 定义文件 | ✅ 完成 | 3 个技能定义文件（monitoring / trading / complete） |
| 线上 Dashboard | ✅ 完成 | hourglass-eta.vercel.app（Slay the Spire 风格） |
| 真实交易记录 | ✅ 完成 | 3 笔交易，2 个活跃持仓（钱包 0xc788） |
| 终端 Demo | ✅ 完成 | pnpm ave:demo 可运行 |
| Demo 视频 | ❌ 待完成 | 参考 demo-video-script.md 录制 |
| 官方渠道提交 | ❌ 待完成 | clawhackathon.aveai.trade |

---

## 五、提交流程

1. **录制 Demo 视频**（参考 `hackathon-core/demo-video-script.md`）
2. **最终 git push**（确保所有文档最新）
3. **确认 Vercel 部署**（打开 https://hourglass-eta.vercel.app 检查）
4. **打开提交渠道**（clawhackathon.aveai.trade）
5. **填写提交表单**：
   - GitHub 链接：https://github.com/Alchemist-X/hourglass
   - 在线 Demo：https://hourglass-eta.vercel.app
   - 视频链接：（上传后填入）
   - 赛道：Complete Application Scenario
6. **提交完成后截图留证**
