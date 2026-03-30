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

  // PNL chart
  cumulative_pnl: string;
  high: string;
  low: string;
  no_trade_data: string;

  // Positions
  positions_title: string;
  positions_open: (n: number) => string;
  positions_profitable: (n: number) => string;
  market_value: string;
  col_market: string;
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

  // PNL Summary
  pnl_summary_title: string;
  net_pnl: string;
  unrealized: string;
  realized: string;
  cost_basis: string;
  market_value_label: string;
  closed_markets: (n: number) => string;
  top_movers: string;

  // Activity
  recent_trades: string;
  total_trades: (n: number) => string;
  no_recent_trades: string;
  filled: string;
  fill_pct: (pct: number) => string;

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

  status_running: "Running",
  status_paused: "Paused",
  status_halted: "Halted",
  updated: "Updated",
  just_now: "just now",
  minutes_ago: (n) => `${n}m ago`,
  hours_ago: (n) => `${n}h ago`,
  days_ago: (n) => `${n}d ago`,
  na: "N/A",

  thesis_title: "Why Agents Trade Prediction Markets",
  thesis_intro:
    "This system is built around Market Pulse \u2014 AI autonomously estimates event probabilities, compares them against market-implied odds, and generates trade signals based on edge and capital efficiency (monthly return).",
  thesis_point_1_title: "Reasoning at parity",
  thesis_point_1_body:
    "No clear evidence that humans have an edge in forecasting. Given the same context, agents perform comparably \u2014 and they never sleep.",
  thesis_point_2_title: "Breadth beats depth",
  thesis_point_2_body:
    "Agents cover thousands of markets simultaneously, catching mispricings that no individual can monitor. Human reaction latency is 3+ minutes; agents act in seconds.",
  thesis_point_3_title: "Competition window",
  thesis_point_3_body:
    "In political and tech prediction markets, participants lack clear pricing models and fear inventory risk. Large-scale agent trading faces little competition today.",

  cumulative_pnl: "Cumulative P&L",
  high: "High",
  low: "Low",
  no_trade_data: "No trade data available to build P&L chart.",

  positions_title: "Open Positions",
  positions_open: (n) => `${n} open`,
  positions_profitable: (n) => `${n} profitable`,
  market_value: "market value",
  col_market: "Market",
  col_side: "Side",
  col_shares: "Shares",
  col_entry: "Entry",
  col_current: "Current",
  col_cost_basis: "Cost Basis",
  col_value: "Value",
  col_unreal_pnl: "Unreal. PnL",
  col_pnl_pct: "PnL %",
  col_weight: "Weight",
  col_held: "Held",
  no_open_positions: "No open positions.",

  pnl_summary_title: "P&L Summary",
  net_pnl: "Net P&L",
  unrealized: "Unrealized",
  realized: "Realized",
  cost_basis: "Cost Basis",
  market_value_label: "Market Value",
  closed_markets: (n) => `${n} closed markets`,
  top_movers: "Top Movers",

  recent_trades: "Recent Trades",
  total_trades: (n) => `${n} total trades`,
  no_recent_trades: "No recent trades.",
  filled: "filled",
  fill_pct: (pct) => `(${pct.toFixed(0)}% fill)`,

  lang_label: "EN"
};

const zh: Dictionary = {
  total_equity: "\u603B\u6743\u76CA",
  cash: "\u73B0\u91D1",
  hwm: "\u5386\u53F2\u9AD8\u70B9",
  drawdown: "\u56DE\u64A4",
  vs_hwm: "\u8DDD\u9AD8\u70B9",
  open_positions: "\u5F00\u4ED3\u6570",

  status_running: "\u8FD0\u884C\u4E2D",
  status_paused: "\u5DF2\u6682\u505C",
  status_halted: "\u5DF2\u505C\u673A",
  updated: "\u66F4\u65B0\u4E8E",
  just_now: "\u521A\u521A",
  minutes_ago: (n) => `${n}\u5206\u949F\u524D`,
  hours_ago: (n) => `${n}\u5C0F\u65F6\u524D`,
  days_ago: (n) => `${n}\u5929\u524D`,
  na: "\u65E0",

  thesis_title: "\u4E3A\u4EC0\u4E48\u8BA9 Agent \u4EA4\u6613\u9884\u6D4B\u5E02\u573A",
  thesis_intro:
    "\u672C\u7CFB\u7EDF\u57FA\u4E8E Market Pulse \u2014 AI \u81EA\u4E3B\u8BC4\u4F30\u4E8B\u4EF6\u6982\u7387\uFF0C\u5C06\u5176\u4E0E\u5E02\u573A\u9690\u542B\u8D54\u7387\u8FDB\u884C\u5BF9\u6BD4\uFF0C\u5E76\u57FA\u4E8E\u8FB9\u9645\u4F18\u52BF\u4E0E\u8D44\u672C\u6548\u7387\uFF08\u6708\u5316\u56DE\u62A5\uFF09\u751F\u6210\u4EA4\u6613\u4FE1\u53F7\u3002",
  thesis_point_1_title: "\u63A8\u7406\u80FD\u529B\u5E73\u7B49",
  thesis_point_1_body:
    "\u6CA1\u6709\u660E\u786E\u8BC1\u636E\u8868\u660E\u4EBA\u7C7B\u5728\u9884\u6D4B\u4E0A\u6709\u4F18\u52BF\u3002\u5728\u76F8\u540C\u4E0A\u4E0B\u6587\u4E0B\uFF0CAgent \u8868\u73B0\u76F8\u5F53 \u2014 \u800C\u4E14\u5B83\u4EEC\u4ECE\u4E0D\u7761\u89C9\u3002",
  thesis_point_2_title: "\u5E7F\u5EA6\u80DC\u8FC7\u6DF1\u5EA6",
  thesis_point_2_body:
    "Agent \u540C\u65F6\u8986\u76D6\u6570\u5343\u4E2A\u5E02\u573A\uFF0C\u6355\u6349\u4EFB\u4F55\u4E2A\u4EBA\u65E0\u6CD5\u76D1\u63A7\u7684\u5B9A\u4EF7\u5931\u8C03\u3002\u4EBA\u7C7B\u53CD\u5E94\u65F6\u5EF6\u8D85\u8FC7 3 \u5206\u949F\uFF0CAgent \u53EF\u4EE5\u5728\u79D2\u7EA7\u54CD\u5E94\u3002",
  thesis_point_3_title: "\u7ADE\u4E89\u7A97\u53E3\u671F",
  thesis_point_3_body:
    "\u5728\u653F\u6CBB\u548C\u79D1\u6280\u9884\u6D4B\u5E02\u573A\u4E2D\uFF0C\u53C2\u4E0E\u8005\u7F3A\u4E4F\u660E\u786E\u7684\u5B9A\u4EF7\u6A21\u578B\u4E14\u62C5\u5FC3\u5E93\u5B58\u98CE\u9669\u3002\u5927\u89C4\u6A21 Agent \u4EA4\u6613\u76EE\u524D\u9762\u4E34\u7684\u7ADE\u4E89\u5F88\u5C11\u3002",

  cumulative_pnl: "\u7D2F\u8BA1\u76C8\u4E8F",
  high: "\u6700\u9AD8",
  low: "\u6700\u4F4E",
  no_trade_data: "\u6CA1\u6709\u8DB3\u591F\u7684\u4EA4\u6613\u6570\u636E\u6765\u751F\u6210\u76C8\u4E8F\u56FE\u3002",

  positions_title: "\u5F00\u4ED3\u4ED3\u4F4D",
  positions_open: (n) => `${n} \u4E2A\u5F00\u4ED3`,
  positions_profitable: (n) => `${n} \u4E2A\u76C8\u5229`,
  market_value: "\u5E02\u503C",
  col_market: "\u5E02\u573A",
  col_side: "\u65B9\u5411",
  col_shares: "\u4EFD\u989D",
  col_entry: "\u5165\u573A\u4EF7",
  col_current: "\u5F53\u524D\u4EF7",
  col_cost_basis: "\u6210\u672C",
  col_value: "\u5E02\u503C",
  col_unreal_pnl: "\u672A\u5B9E\u73B0\u76C8\u4E8F",
  col_pnl_pct: "\u76C8\u4E8F%",
  col_weight: "\u6743\u91CD",
  col_held: "\u6301\u4ED3\u65F6\u95F4",
  no_open_positions: "\u6CA1\u6709\u5F00\u4ED3\u4ED3\u4F4D\u3002",

  pnl_summary_title: "\u76C8\u4E8F\u6458\u8981",
  net_pnl: "\u51C0\u76C8\u4E8F",
  unrealized: "\u672A\u5B9E\u73B0",
  realized: "\u5DF2\u5B9E\u73B0",
  cost_basis: "\u6210\u672C\u57FA\u7840",
  market_value_label: "\u5E02\u503C",
  closed_markets: (n) => `${n} \u4E2A\u5DF2\u5E73\u4ED3\u5E02\u573A`,
  top_movers: "\u6D3E\u52A8\u6700\u5927",

  recent_trades: "\u6700\u8FD1\u4EA4\u6613",
  total_trades: (n) => `\u5171 ${n} \u7B14\u4EA4\u6613`,
  no_recent_trades: "\u6CA1\u6709\u6700\u8FD1\u4EA4\u6613\u3002",
  filled: "\u5DF2\u6210\u4EA4",
  fill_pct: (pct) => `(\u6210\u4EA4 ${pct.toFixed(0)}%)`,

  lang_label: "\u4E2D"
};

const dictionaries: Record<Locale, Dictionary> = { en, zh };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export type { Dictionary };
