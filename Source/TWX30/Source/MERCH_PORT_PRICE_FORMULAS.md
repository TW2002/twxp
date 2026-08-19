# Merch Port Price Formulas

This note captures the current empirical formulas derived from recent `mba_s`
merch planet-to-port sell logs and the live `mba_s.xdb` MCIC values.

These formulas are intended for script-side estimation of what a buying port
will pay per unit for `Organics` and `Equipment`.

## Source Data

- Game logs analyzed: `/Users/mosleym/twx/logs/2026-05-17 mba_s.log` through
  `/Users/mosleym/twx/logs/2026-05-23 mba_s.log`
- Database queried for MCIC values:
  `/Users/mosleym/twx/games/mba_s.xdb`
- Extracted datasets:
  - `/Users/mosleym/twx/logs/analysis/mba_s_merch_mcic/merch_port_neg_2026-05-17_2026-05-23.jsonl`
  - `/Users/mosleym/twx/logs/analysis/mba_s_merch_mcic/merch_port_neg_with_pct_2026-05-17_2026-05-23.jsonl`
  - `/Users/mosleym/twx/logs/analysis/mba_s_merch_mcic/merch_port_neg_regression_2026-05-17_2026-05-23.json`

## Variables

- `MCIC`: the stored signed MCIC value for the product at the port
- `mc`: the absolute magnitude of MCIC
  - use `mc = abs(MCIC)`
  - example: `MCIC = -60` means `mc = 60`
- `pct`: the raw displayed port percentage from the `Commerce report`
  - use the literal integer shown by the game
  - `100%` means `pct = 100`
  - `93%` means `pct = 93`
  - do not convert this to `1.00` or `0.93`
- `unit_price`: the estimated credits per unit paid by the buying port

## Recommended Formulas

These are the current best script-side estimators.

### Organics

Floating-point form:

```text
unit_price ≈ 24.20 + 0.734 * mc + 0.213 * pct
```

TWX integer-friendly form:

```text
unit_price ≈ (24200 + (734 * mc) + (213 * pct)) / 1000
```

Fit quality on the analyzed sample:

- sample size: `376`
- `R² ≈ 0.9530`
- mean absolute error: `≈ 1.59`

Observation:

- organics is already modeled well by MCIC alone
- including `pct` only improves the estimate slightly

Simpler organics fallback:

```text
unit_price ≈ 45.35 + 0.736 * mc
```

### Equipment

Floating-point form:

```text
unit_price ≈ 31.34 + 1.227 * mc + 0.554 * pct
```

TWX integer-friendly form:

```text
unit_price ≈ (31300 + (1227 * mc) + (554 * pct)) / 1000
```

Fit quality on the analyzed sample:

- sample size: `506`
- `R² ≈ 0.9717`
- mean absolute error: `≈ 2.25`

Observation:

- equipment is materially improved by including `pct`
- MCIC alone is much weaker for equipment than MCIC + percent

Equipment MCIC-only model, included for comparison only:

```text
unit_price ≈ 88.99 + 1.145 * mc
```

## Order Of Operations

The intended TWX-style evaluation order is:

```text
organics_unit_price  ≈ (24200 + (734 * mc) + (213 * pct)) / 1000
equipment_unit_price ≈ (31300 + (1227 * mc) + (554 * pct)) / 1000
```

That means:

1. multiply `mc`
2. multiply `pct`
3. add the constant term
4. divide the full sum by `1000`

If rounding is preferred instead of truncation, add `500` before the final
divide by `1000`.

Example:

```text
rounded_organics_unit_price ≈ (24200 + (734 * mc) + (213 * pct) + 500) / 1000
```

## Caveats

- These are empirical estimates, not a proven server formula.
- The trade percentages come from the historical game logs at trade time.
- The MCIC values came from the current live database, not a historical
  database snapshot for each trade.
- The formulas are only documented here for `Organics` and `Equipment`.
- `Fuel Ore` was too noisy in this sample to recommend a comparable formula.

## Practical Guidance

- For `Organics`, MCIC alone is often good enough if script simplicity matters.
- For `Equipment`, include `pct`; it is clearly part of the observed pricing
  behavior.
- Treat these values as estimators for port selection, ranking, and rough
  expected credits, not exact guaranteed per-unit prices.
