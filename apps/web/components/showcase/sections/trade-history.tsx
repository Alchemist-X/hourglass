"use client";

// Section 5: Real trade results (Victory/Reward screen style)
// Table with real data + wallet info + verification link

interface TradeRow {
  readonly id: number;
  readonly market: string;
  readonly shares: number;
  readonly entry: number;
  readonly current: number;
  readonly pnl: number;
}

const TRADES: readonly TradeRow[] = [
  {
    id: 1,
    market: "BTC $150K Jun 2026",
    shares: 162.34,
    entry: 0.031,
    current: 0.018,
    pnl: -39.7,
  },
  {
    id: 2,
    market: "BTC $1M before GTA VI",
    shares: 20.45,
    entry: 0.489,
    current: 0.488,
    pnl: -0.2,
  },
];

const WALLET_ADDRESS = "0xc788...2936";
const TOTAL_EQUITY = 17.94;
const CASH_BALANCE = 4.96;

function PnlBadge({ pnl }: { readonly pnl: number }) {
  const isProfit = pnl >= 0;
  const color = isProfit ? "#2a9d8f" : "#e63946";
  const sign = isProfit ? "+" : "";

  return (
    <span
      style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 14,
        fontWeight: 700,
        color,
        padding: "2px 8px",
        borderRadius: 4,
        background: isProfit ? "rgba(42,157,143,0.12)" : "rgba(230,57,70,0.12)",
      }}
    >
      {sign}{pnl.toFixed(1)}%
    </span>
  );
}

function StatusEffect({ pnl }: { readonly pnl: number }) {
  const isProfit = pnl >= 0;
  const label = isProfit ? "Buff" : "Debuff";
  const icon = isProfit ? "\ud83d\udcc8" : "\ud83d\udcc9";
  const color = isProfit ? "#2a9d8f" : "#e63946";

  return (
    <span
      style={{
        fontSize: 11,
        color,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        opacity: 0.8,
      }}
    >
      {icon} {label} {pnl >= 0 ? "+" : ""}{pnl.toFixed(1)}%
    </span>
  );
}

function TradeTable() {
  return (
    <div
      style={{
        border: "2px solid #d4a574",
        borderRadius: 8,
        background: "linear-gradient(135deg, #16213e 0%, #1a2540 100%)",
        overflow: "hidden",
        boxShadow: "0 0 20px rgba(212,165,116,0.1), 0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Table header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "40px 1fr 80px 80px 80px 90px",
          padding: "12px 20px",
          background: "rgba(212,165,116,0.06)",
          borderBottom: "1px solid rgba(212,165,116,0.15)",
          gap: 8,
        }}
      >
        {["#", "Market", "Shares", "Entry", "Current", "PnL"].map(
          (header) => (
            <span
              key={header}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#8b8b9e",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {header}
            </span>
          )
        )}
      </div>

      {/* Table rows */}
      {TRADES.map((trade) => {
        const borderLeftColor = trade.pnl >= 0 ? "#2a9d8f" : "#e63946";
        const rowBg =
          trade.pnl >= 0
            ? "rgba(42,157,143,0.04)"
            : "rgba(230,57,70,0.04)";

        return (
          <div key={trade.id}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 80px 80px 80px 90px",
                padding: "14px 20px 8px",
                borderLeft: `3px solid ${borderLeftColor}`,
                background: rowBg,
                gap: 8,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 14,
                  color: "#8b8b9e",
                }}
              >
                {trade.id}
              </span>
              <span style={{ fontSize: 14, color: "#e8e8e8", fontWeight: 500 }}>
                {trade.market}
              </span>
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 13,
                  color: "#e8e8e8",
                }}
              >
                {trade.shares.toFixed(2)}
              </span>
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 13,
                  color: "#e8e8e8",
                }}
              >
                ${trade.entry.toFixed(3)}
              </span>
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 13,
                  color: "#e8e8e8",
                }}
              >
                ${trade.current.toFixed(3)}
              </span>
              <PnlBadge pnl={trade.pnl} />
            </div>
            <div
              style={{
                padding: "0 20px 12px 63px",
                background: rowBg,
                borderLeft: `3px solid ${borderLeftColor}`,
                borderBottom: "1px solid rgba(212,165,116,0.08)",
              }}
            >
              <StatusEffect pnl={trade.pnl} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PortfolioStatus() {
  return (
    <div
      style={{
        border: "1px solid rgba(212,165,116,0.2)",
        borderRadius: 8,
        background: "linear-gradient(135deg, rgba(22,33,62,0.8), rgba(26,37,64,0.8))",
        padding: "24px 28px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 18 }}>{"\ud83d\udcb0"}</span>
        <span
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: 16,
            fontWeight: 600,
            color: "#d4a574",
          }}
        >
          PORTFOLIO STATUS
        </span>
      </div>

      {/* Wallet address */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 13, color: "#8b8b9e" }}>Wallet:</span>
        <a
          href="https://polygonscan.com/address/0xc7882936"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 13,
            color: "#5fa8d3",
            textDecoration: "none",
            borderBottom: "1px dashed rgba(95,168,211,0.4)",
          }}
        >
          {WALLET_ADDRESS}
        </a>
        <span
          style={{
            fontSize: 12,
            color: "#5fa8d3",
            cursor: "pointer",
          }}
        >
          {"\ud83d\udd17"}
        </span>
      </div>

      {/* HP bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 16 }}>{"\u2764\ufe0f"}</span>
        <div
          style={{
            flex: 1,
            height: 22,
            background: "rgba(230,57,70,0.15)",
            borderRadius: 4,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              width: `${(TOTAL_EQUITY / 20) * 100}%`,
              height: "100%",
              background: "linear-gradient(90deg, #2a9d8f, #34b8a8)",
              borderRadius: 4,
            }}
          />
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
              whiteSpace: "nowrap",
            }}
          >
            ${TOTAL_EQUITY.toFixed(2)} / $20.00
          </span>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        {[
          { label: "\u603b\u6743\u76ca", value: `$${TOTAL_EQUITY.toFixed(2)}` },
          { label: "\u73b0\u91d1", value: `$${CASH_BALANCE.toFixed(2)}` },
          { label: "\u90e8\u7f72", value: "$15.00" },
        ].map((stat) => (
          <div key={stat.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#8b8b9e", marginBottom: 4 }}>
              {stat.label}
            </div>
            <div
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 16,
                fontWeight: 700,
                color: "#e8e8e8",
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Verification link */}
      <a
        href="https://polymarket.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 20px",
          border: "2px solid #d4a574",
          borderRadius: 6,
          background: "transparent",
          fontFamily: "Cinzel, serif",
          fontSize: 13,
          fontWeight: 600,
          color: "#d4a574",
          textDecoration: "none",
          transition: "background 0.2s",
          cursor: "pointer",
        }}
      >
        Polymarket {"\u9a8c\u8bc1\u94fe\u63a5"} {"\u2192"}
      </a>
    </div>
  );
}

export function TradeHistory() {
  return (
    <section
      style={{
        padding: "80px 24px",
        background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Section title */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={{ fontSize: 14, color: "#8b8b9e", letterSpacing: 2 }}>
            {"\ud83c\udfc6"} BATTLE RESULTS
          </span>
          <h2
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: 24,
              fontWeight: 700,
              color: "#d4a574",
              margin: "8px 0 0",
            }}
          >
            {"\u771f\u5b9e\u4ea4\u6613\u8bb0\u5f55\uff08\u94fe\u4e0a\u53ef\u9a8c\u8bc1\uff09"}
          </h2>
        </div>

        {/* Trade table */}
        <div style={{ marginBottom: 32 }}>
          <TradeTable />
        </div>

        {/* Portfolio status */}
        <PortfolioStatus />
      </div>
    </section>
  );
}
