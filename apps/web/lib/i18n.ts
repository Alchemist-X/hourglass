export type Locale = "en" | "zh";

export const LOCALE_STORAGE_KEY = "autopoly_locale";

export const DEFAULT_LOCALE: Locale = "en";

interface Dictionary {
  // Header KPIs
  total_equity: string;
  cash: string;
  hwm: string;
  drawdown: string;
  vs_hwm: string;
  open_positions: string;
  chains_active: string;
  monitoring_status: string;

  // Status
  status_running: string;
  status_paused: string;
  status_halted: string;
  updated: string;
  just_now: string;
  minutes_ago: (n: number) => string;
  hours_ago: (n: number) => string;
  days_ago: (n: number) => string;
  na: string;

  // Thesis section
  thesis_title: string;
  thesis_intro: string;
  thesis_point_1_title: string;
  thesis_point_1_body: string;
  thesis_point_2_title: string;
  thesis_point_2_body: string;
  thesis_point_3_title: string;
  thesis_point_3_body: string;

  // Equity chart
  cumulative_pnl: string;
  equity_curve: string;
  high: string;
  low: string;
  pnl_label: string;
  no_trade_data: string;
  no_equity_data: string;

  // Positions
  positions_title: string;
  positions_open: (n: number) => string;
  positions_profitable: (n: number) => string;
  market_value: string;
  col_market: string;
  col_token: string;
  col_chain: string;
  col_direction: string;
  col_side: string;
  col_shares: string;
  col_entry: string;
  col_current: string;
  col_cost_basis: string;
  col_value: string;
  col_unreal_pnl: string;
  col_pnl_pct: string;
  col_weight: string;
  col_held: string;
  no_open_positions: string;
  direction_long: string;
  direction_short: string;

  // PNL Summary
  pnl_summary_title: string;
  net_pnl: string;
  unrealized: string;
  realized: string;
  cost_basis: string;
  market_value_label: string;
  closed_positions: (n: number) => string;
  top_movers: string;

  // Activity
  recent_trades: string;
  total_trades: (n: number) => string;
  no_recent_trades: string;
  filled: string;
  fill_pct: (pct: number) => string;

  // Monitoring
  monitoring_title: string;
  no_alerts: string;

  // Language toggle
  lang_label: string;
}

const en: Dictionary = {
  total_equity: "Total Equity",
  cash: "Cash",
  hwm: "HWM",
  drawdown: "Drawdown",
  vs_hwm: "vs HWM",
  open_positions: "Open Positions",
  chains_active: "Chains",
  monitoring_status: "Monitoring",

  status_running: "Monitoring Active",
  status_paused: "Paused",
  status_halted: "Halted",
  updated: "Updated",
  just_now: "just now",
  minutes_ago: (n) => `${n}m ago`,
  hours_ago: (n) => `${n}h ago`,
  days_ago: (n) => `${n}d ago`,
  na: "N/A",

  thesis_title: "AVE Claw \u2014 Autonomous DeFi Agent",
  thesis_intro:
    "Hourglass is built for the AVE Claw Hackathon 2026. It autonomously monitors DeFi tokens across multiple chains, detects anomalies and price movements, and generates trading signals using on-chain data analysis and AI reasoning.",
  thesis_point_1_title: "Multi-chain token monitoring",
  thesis_point_1_body:
    "Continuously scans Ethereum, BSC, Polygon, Arbitrum, and more for price anomalies, whale movements, and liquidity shifts. Reacts in seconds to on-chain events that humans would miss.",
  thesis_point_2_title: "AI-powered risk assessment",
  thesis_point_2_body:
    "Each token is evaluated with a multi-factor risk model combining liquidity depth, holder concentration, smart contract audits, and historical volatility to generate confidence-weighted signals.",
  thesis_point_3_title: "Intelligent position management",
  thesis_point_3_body:
    "Automated entry/exit with dynamic stop-losses, position sizing via Kelly criterion, and portfolio rebalancing across chains. The agent manages risk so you don't have to.",

  cumulative_pnl: "Cumulative P&L",
  equity_curve: "Equity Curve",
  high: "High",
  low: "Low",
  pnl_label: "P&L",
  no_trade_data: "No trade data available to build P&L chart.",
  no_equity_data: "No equity history available yet.",

  positions_title: "Open Positions",
  positions_open: (n) => `${n} open`,
  positions_profitable: (n) => `${n} profitable`,
  market_value: "market value",
  col_market: "Token",
  col_token: "Symbol",
  col_chain: "Chain",
  col_direction: "Direction",
  col_side: "Side",
  col_shares: "Size",
  col_entry: "Entry Price",
  col_current: "Current Price",
  col_cost_basis: "Cost Basis",
  col_value: "Value",
  col_unreal_pnl: "Unreal. PnL",
  col_pnl_pct: "PnL %",
  col_weight: "Weight",
  col_held: "Held",
  no_open_positions: "No open positions.",
  direction_long: "Long",
  direction_short: "Short",

  pnl_summary_title: "P&L Summary",
  net_pnl: "Net P&L",
  unrealized: "Unrealized",
  realized: "Realized",
  cost_basis: "Cost Basis",
  market_value_label: "Market Value",
  closed_positions: (n) => `${n} closed positions`,
  top_movers: "Top Movers",

  recent_trades: "Recent Trades",
  total_trades: (n) => `${n} total trades`,
  no_recent_trades: "No recent trades.",
  filled: "filled",
  fill_pct: (pct) => `(${pct.toFixed(0)}% fill)`,

  monitoring_title: "Monitoring Alerts",
  no_alerts: "No recent alerts.",

  lang_label: "EN"
};

const zh: Dictionary = {
  total_equity: "\u603B\u6743\u76CA",
  cash: "\u73B0\u91D1",
  hwm: "\u5386\u53F2\u9AD8\u70B9",
  drawdown: "\u56DE\u64A4",
  vs_hwm: "\u8DDD\u9AD8\u70B9",
  open_positions: "\u5F00\u4ED3\u6570",
  chains_active: "\u94FE",
  monitoring_status: "\u76D1\u63A7",

  status_running: "\u76D1\u63A7\u4E2D",
  status_paused: "\u5DF2\u6682\u505C",
  status_halted: "\u5DF2\u505C\u673A",
  updated: "\u66F4\u65B0\u4E8E",
  just_now: "\u521A\u521A",
  minutes_ago: (n) => `${n}\u5206\u949F\u524D`,
  hours_ago: (n) => `${n}\u5C0F\u65F6\u524D`,
  days_ago: (n) => `${n}\u5929\u524D`,
  na: "\u65E0",

  thesis_title: "AVE Claw \u2014 \u81EA\u4E3B DeFi \u4EE3\u7406",
  thesis_intro:
    "Hourglass \u662F\u4E3A AVE Claw Hackathon 2026 \u6253\u9020\u7684\u81EA\u4E3B DeFi \u4EE3\u7406\u3002\u5B83\u8DE8\u591A\u94FE\u76D1\u63A7 DeFi \u4EE3\u5E01\uFF0C\u68C0\u6D4B\u5F02\u5E38\u548C\u4EF7\u683C\u53D8\u52A8\uFF0C\u5229\u7528\u94FE\u4E0A\u6570\u636E\u5206\u6790\u548C AI \u63A8\u7406\u751F\u6210\u4EA4\u6613\u4FE1\u53F7\u3002",
  thesis_point_1_title: "\u591A\u94FE\u4EE3\u5E01\u76D1\u63A7",
  thesis_point_1_body:
    "\u6301\u7EED\u626B\u63CF Ethereum\u3001BSC\u3001Polygon\u3001Arbitrum \u7B49\u94FE\u4E0A\u7684\u4EF7\u683C\u5F02\u5E38\u3001\u5DE8\u9CB8\u52A8\u5411\u548C\u6D41\u52A8\u6027\u53D8\u5316\u3002\u79D2\u7EA7\u54CD\u5E94\u94FE\u4E0A\u4E8B\u4EF6\u3002",
  thesis_point_2_title: "AI \u9A71\u52A8\u7684\u98CE\u9669\u8BC4\u4F30",
  thesis_point_2_body:
    "\u6BCF\u4E2A\u4EE3\u5E01\u90FD\u7ECF\u8FC7\u591A\u56E0\u5B50\u98CE\u9669\u6A21\u578B\u8BC4\u4F30\uFF0C\u7ED3\u5408\u6D41\u52A8\u6027\u6DF1\u5EA6\u3001\u6301\u6709\u8005\u96C6\u4E2D\u5EA6\u3001\u667A\u80FD\u5408\u7EA6\u5BA1\u8BA1\u548C\u5386\u53F2\u6CE2\u52A8\u7387\u751F\u6210\u7F6E\u4FE1\u5EA6\u52A0\u6743\u4FE1\u53F7\u3002",
  thesis_point_3_title: "\u667A\u80FD\u4ED3\u4F4D\u7BA1\u7406",
  thesis_point_3_body:
    "\u81EA\u52A8\u5F00\u4ED3/\u5E73\u4ED3\uFF0C\u52A8\u6001\u6B62\u635F\uFF0C\u57FA\u4E8E Kelly \u516C\u5F0F\u7684\u4ED3\u4F4D\u8C03\u6574\uFF0C\u8DE8\u94FE\u7EC4\u5408\u518D\u5E73\u8861\u3002\u4EE3\u7406\u81EA\u52A8\u7BA1\u7406\u98CE\u9669\u3002",

  cumulative_pnl: "\u7D2F\u8BA1\u76C8\u4E8F",
  equity_curve: "\u6743\u76CA\u66F2\u7EBF",
  high: "\u6700\u9AD8",
  low: "\u6700\u4F4E",
  pnl_label: "\u76C8\u4E8F",
  no_trade_data: "\u6CA1\u6709\u8DB3\u591F\u7684\u4EA4\u6613\u6570\u636E\u6765\u751F\u6210\u76C8\u4E8F\u56FE\u3002",
  no_equity_data: "\u6682\u65E0\u6743\u76CA\u5386\u53F2\u6570\u636E\u3002",

  positions_title: "\u5F00\u4ED3\u4ED3\u4F4D",
  positions_open: (n) => `${n} \u4E2A\u5F00\u4ED3`,
  positions_profitable: (n) => `${n} \u4E2A\u76C8\u5229`,
  market_value: "\u5E02\u503C",
  col_market: "\u4EE3\u5E01",
  col_token: "\u7B26\u53F7",
  col_chain: "\u94FE",
  col_direction: "\u65B9\u5411",
  col_side: "\u65B9\u5411",
  col_shares: "\u6570\u91CF",
  col_entry: "\u5165\u573A\u4EF7",
  col_current: "\u5F53\u524D\u4EF7",
  col_cost_basis: "\u6210\u672C",
  col_value: "\u5E02\u503C",
  col_unreal_pnl: "\u672A\u5B9E\u73B0\u76C8\u4E8F",
  col_pnl_pct: "\u76C8\u4E8F%",
  col_weight: "\u6743\u91CD",
  col_held: "\u6301\u4ED3\u65F6\u95F4",
  no_open_positions: "\u6CA1\u6709\u5F00\u4ED3\u4ED3\u4F4D\u3002",
  direction_long: "\u505A\u591A",
  direction_short: "\u505A\u7A7A",

  pnl_summary_title: "\u76C8\u4E8F\u6458\u8981",
  net_pnl: "\u51C0\u76C8\u4E8F",
  unrealized: "\u672A\u5B9E\u73B0",
  realized: "\u5DF2\u5B9E\u73B0",
  cost_basis: "\u6210\u672C\u57FA\u7840",
  market_value_label: "\u5E02\u503C",
  closed_positions: (n) => `${n} \u4E2A\u5DF2\u5E73\u4ED3`,
  top_movers: "\u6D3E\u52A8\u6700\u5927",

  recent_trades: "\u6700\u8FD1\u4EA4\u6613",
  total_trades: (n) => `\u5171 ${n} \u7B14\u4EA4\u6613`,
  no_recent_trades: "\u6CA1\u6709\u6700\u8FD1\u4EA4\u6613\u3002",
  filled: "\u5DF2\u6210\u4EA4",
  fill_pct: (pct) => `(\u6210\u4EA4 ${pct.toFixed(0)}%)`,

  monitoring_title: "\u76D1\u63A7\u8B66\u62A5",
  no_alerts: "\u6682\u65E0\u8B66\u62A5\u3002",

  lang_label: "\u4E2D"
};

const dictionaries: Record<Locale, Dictionary> = { en, zh };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export type { Dictionary };
