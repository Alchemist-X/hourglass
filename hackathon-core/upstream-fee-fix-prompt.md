# Upstream Fix: Neg-Risk Fee Calculation Bug

## Bug Description

`lookupCategoryFeeParams()` in `services/orchestrator/src/lib/fees.ts` blindly returns `{ feeRate: 0, exponent: 0 }` whenever `negRisk=true`. This is incorrect because some neg-risk (multi-outcome) markets on Polymarket actually have `feesEnabled: true` with real fee schedules.

The function assumes that ALL neg-risk markets are fee-free, but the Gamma API shows this is not universally true.

## Impact

- **Under-estimated fees**: For fee-enabled neg-risk markets (e.g. "Trump AG Pick"), the system calculates 0% taker fee when the actual fee is ~4%. This inflates the perceived net edge by ~1% at p=0.5, causing the system to over-size positions and enter trades that are less profitable than expected.
- **Edge calculation error**: `calculateNetEdge()` returns the gross edge unchanged for these markets instead of deducting the real fee drag, leading to incorrect Kelly sizing.
- **GTC order type selection**: `chooseOrderType()` skips GTC (limit) orders for all neg-risk markets, missing potential fee savings on fee-enabled neg-risk markets.
- **Fee verification false positives**: `verifyFeeEstimate()` flags fee-enabled neg-risk markets as mismatches every time because the estimated fee is always 0.

## Root Cause

**File**: `services/orchestrator/src/lib/fees.ts`
**Function**: `lookupCategoryFeeParams()` (line ~86)
**Problem**: The `negRisk` check unconditionally short-circuits to zero fees without consulting the market's `feesEnabled` flag or `feeSchedule` data from the Gamma API.

```typescript
// BUGGY CODE (current)
export function lookupCategoryFeeParams(
  categorySlug: string | null | undefined,
  options?: { negRisk?: boolean }
): FeeParams {
  if (options?.negRisk) {
    return NEG_RISK_FEE_PARAMS; // Always returns { feeRate: 0, exponent: 0 }
  }
  // ... category-based lookup
}
```

## Evidence

### FIFA World Cup Winner (neg-risk, fees disabled = 0%)
```json
{
  "slug": "fifa-world-cup-2026-winner",
  "neg_risk": true,
  "fees_enabled": false,
  "fee_schedule": null
}
```
Result: 0% taker fee -- correct.

### Trump AG Pick (neg-risk, fees enabled = 4%)
```json
{
  "slug": "trump-ag-pick",
  "neg_risk": true,
  "fees_enabled": true,
  "fee_schedule": { "fee_rate": 0.04, "exponent": 1 }
}
```
Result with bug: 0% taker fee (WRONG).
Result with fix: 4% peak taker fee at p=0.5 (CORRECT).

At entry price p=0.50:
- Buggy net edge:  gross edge = 10%, net = 10% (no fee deducted)
- Correct net edge: gross edge = 10%, fee = 0.04 * 0.25 = 1%, net = 9%

## Fix Instructions

### 1. Update `lookupCategoryFeeParams` signature and logic

```typescript
// BEFORE
export function lookupCategoryFeeParams(
  categorySlug: string | null | undefined,
  options?: { negRisk?: boolean }
): FeeParams {
  if (options?.negRisk) {
    return NEG_RISK_FEE_PARAMS;
  }
  // ...
}

// AFTER
export interface NegRiskFeeOptions {
  negRisk?: boolean;
  feesEnabled?: boolean;
  feeSchedule?: FeeParams;
}

export function lookupCategoryFeeParams(
  categorySlug: string | null | undefined,
  options?: NegRiskFeeOptions
): FeeParams {
  if (options?.negRisk) {
    // Some neg-risk markets have fees enabled (e.g. AG Pick = 4%).
    if (options.feesEnabled && options.feeSchedule) {
      return options.feeSchedule;
    }
    // feesEnabled not provided or false -> legacy 0% behavior
    return NEG_RISK_FEE_PARAMS;
  }
  // ... rest unchanged
}
```

### 2. Update `verifyFeeEstimate` to accept the new fields

Add `feesEnabled?: boolean` and `feeSchedule?: FeeParams` to the input type and pass them through to `lookupCategoryFeeParams`.

### 3. Update `chooseOrderType` in `execution-planning.ts`

```typescript
// BEFORE
if (input.negRisk || (input.feeRate != null && input.feeRate === 0)) {
  return { orderType: "FOK", gtcLimitPrice: null };
}

// AFTER
const negRiskWithoutFees = input.negRisk && !input.feesEnabled;
if (negRiskWithoutFees || (input.feeRate != null && input.feeRate === 0)) {
  return { orderType: "FOK", gtcLimitPrice: null };
}
```

### 4. Update callers to pass `feesEnabled` and `feeSchedule`

In `pulse-entry-planner.ts`:
```typescript
// BEFORE
const feeParams = lookupCategoryFeeParams(categorySlug, { negRisk: candidate.negRisk });

// AFTER
const feeParams = lookupCategoryFeeParams(categorySlug, {
  negRisk: candidate.negRisk,
  feesEnabled: candidate.feesEnabled,
  feeSchedule: candidate.feeSchedule
});
```

### 5. Add `feesEnabled` / `feeSchedule` to data pipeline

In `market-pulse.ts`, add to `RawPulseMarket`:
```typescript
fees_enabled?: boolean;
fee_schedule?: { fee_rate?: number; exponent?: number };
```

Add to `PulseCandidate`:
```typescript
feesEnabled?: boolean;
feeSchedule?: { feeRate: number; exponent: number };
```

Map in `toPulseCandidate()`:
```typescript
feesEnabled: typeof market.fees_enabled === "boolean" ? market.fees_enabled : undefined,
feeSchedule: market.fee_schedule?.fee_rate != null
  ? { feeRate: Number(market.fee_schedule.fee_rate), exponent: Number(market.fee_schedule.exponent ?? 1) }
  : undefined
```

## Prompt for Claude

Copy-paste the following into a Claude session working on the `autonomous-poly-trading` repo:

---

Fix a fee calculation bug in `services/orchestrator/src/lib/fees.ts`.

**Bug**: `lookupCategoryFeeParams()` returns `{ feeRate: 0, exponent: 0 }` for ALL neg-risk markets. But some neg-risk markets (e.g. "Trump AG Pick") have `feesEnabled: true` with a real fee schedule from the Gamma API. This causes the system to under-estimate fees, inflate net edge, and over-size positions.

**Fix**: Change `lookupCategoryFeeParams` to accept optional `feesEnabled` and `feeSchedule` parameters. Only return zero fees when `negRisk=true AND (feesEnabled is falsy)`. When `negRisk=true AND feesEnabled=true AND feeSchedule is provided`, use the feeSchedule instead.

Files to change:
1. `services/orchestrator/src/lib/fees.ts` - core fix in `lookupCategoryFeeParams` + `verifyFeeEstimate`
2. `services/orchestrator/src/lib/execution-planning.ts` - update `chooseOrderType` and `pulseCandidates` type
3. `services/orchestrator/src/runtime/pulse-entry-planner.ts` - pass new fields to `lookupCategoryFeeParams`
4. `services/orchestrator/src/pulse/market-pulse.ts` - add `feesEnabled`/`feeSchedule` to interfaces and mapping
5. `services/orchestrator/src/lib/fees.test.ts` - update and add test cases

The fix must be backward-compatible: callers that only pass `{ negRisk: true }` should still get 0% fees.

---

## Verification

### Test Cases

```typescript
// 1. Legacy behavior preserved: negRisk without feesEnabled = 0% fee
lookupCategoryFeeParams("politics", { negRisk: true })
// Expected: { feeRate: 0, exponent: 0 }

// 2. Explicit feesEnabled: false = 0% fee
lookupCategoryFeeParams("sports", { negRisk: true, feesEnabled: false })
// Expected: { feeRate: 0, exponent: 0 }

// 3. feesEnabled: true + feeSchedule = uses schedule
lookupCategoryFeeParams("politics", {
  negRisk: true,
  feesEnabled: true,
  feeSchedule: { feeRate: 0.04, exponent: 1 }
})
// Expected: { feeRate: 0.04, exponent: 1 }

// 4. feesEnabled: true but no feeSchedule = safe fallback to 0%
lookupCategoryFeeParams("politics", { negRisk: true, feesEnabled: true })
// Expected: { feeRate: 0, exponent: 0 }

// 5. Non-negRisk markets unchanged
lookupCategoryFeeParams("politics")
// Expected: { feeRate: 0.04, exponent: 1 }

// 6. Net edge correctly deducts fee for fee-enabled neg-risk
const params = lookupCategoryFeeParams("politics", {
  negRisk: true, feesEnabled: true, feeSchedule: { feeRate: 0.04, exponent: 1 }
});
calculateNetEdge(0.10, 0.5, params)
// Expected: 0.09 (not 0.10)

// 7. verifyFeeEstimate: no mismatch for fee-enabled neg-risk with CLOB fee
verifyFeeEstimate({
  tokenId: "tok-6", marketSlug: "trump-ag-pick", categorySlug: "politics",
  actualBaseFee: 1000, negRisk: true, feesEnabled: true,
  feeSchedule: { feeRate: 0.04, exponent: 1 }
})
// Expected: mismatch = false, estimatedFeeRate = 0.04
```
