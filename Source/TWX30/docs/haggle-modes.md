# Haggle Modes

This document explains the native haggle modes exposed in MTC/TWXP and gives a practical recommendation for when to use each one.

Two separate selectors exist in current builds:

- `Port Haggle`
- `Planet Haggle`

These are independent. Most built-in modes are port-only. Planet trading has its own baseline and may also expose module-provided modes such as `Mayhem Haggle`.

## Important Scope Notes

- `EPHaggle`, `Enhanced Haggle`, `Blend Heuristic`, and `Baseline` are built-in native **port** haggle modes.
- `Cherokee Planet` is the built-in native **planet** haggle baseline.
- `Mayhem Haggle` is a loadable module mode, not a built-in. It can support ports, planets, or both depending on the installed module.
- Planet selling does not currently appear to award `good`, `great`, or `excellent` reward tiers in live play, so planet-mode tuning is primarily about acceptance rate and credits, not reward-tier optimization.

## Port Haggle Modes

### EPHaggle

Internal mode id: `clamp-heuristic`

How it works:

- derives an `exact` bid from the current candidate set
- computes a simpler legacy-style `heuristic` bid
- on the first bid, chooses the safer side of the two based on trade direction
  - selling to port: uses the higher of exact and heuristic
  - buying from port: uses the lower of exact and heuristic
- after the opener, it continues along the derived model path without extra adaptive route learning

General character:

- conservative
- stable
- least likely to overreach on round 1

When to pick it:

- default everyday use
- when you want predictable behavior
- when compatibility with older bot expectations matters more than squeezing the last bit of price

### Enhanced Haggle

Internal mode id: `server-derived`

How it works:

- starts from the same exact/candidate model as the other built-ins
- uses a server-threshold style calculation each round, not just on the opener
- in practice, this means it trusts the candidate-derived model more strongly than `EPHaggle`

General character:

- most model-driven built-in
- tighter than `EPHaggle` when the candidate model is accurate
- more sensitive to modeling error than `EPHaggle`

When to pick it:

- when you want a stronger native bid model without using an external module
- when you are trying to improve price tightness on ports
- when you are comfortable trading a little conservatism for better model-following

### Blend Heuristic

Internal mode id: `blend-heuristic`

How it works:

- derives the same `exact` and `heuristic` bids
- on the first bid, simply averages them
- after the opener, it follows the normal exact/model path

General character:

- midpoint between `EPHaggle` and a pure exact-model opener
- less conservative than `EPHaggle`
- less opinionated than `Enhanced Haggle`

When to pick it:

- when `EPHaggle` feels too conservative
- when `Enhanced Haggle` feels too aggressive or too model-dependent
- when you want a balanced first-bid profile

### Baseline

Internal mode id: `baseline`

How it works:

- uses the raw exact bid from the derived candidate model
- no heuristic overlay on the opener

General character:

- useful as a reference mode
- good for testing or comparing model behavior
- not usually the best default for production use

When to pick it:

- debugging
- side-by-side comparison against other modes
- validating whether the heuristic overlay is helping or hurting

## Planet Haggle Modes

### Cherokee Planet

Internal mode id: `cherokee-planet`

How it works:

- uses the Cherokee-style native planet baseline
- follows the long-established planet-sell approximation path
- prioritizes acceptance and stable repeated operation

General character:

- current safest built-in planet mode
- strong production baseline
- best choice when missed planet trades are more costly than leaving a little money on the table

When to pick it:

- normal planet cashing
- long unattended runs
- any situation where reliability matters most

### Mayhem Haggle

Internal mode id: typically `excellent-target`

How it works on ports:

- starts from the native server-derived bid
- adds route-aware logic on top:
  - first-offer exact-hit attempts on favorable routes
  - extra exact-range nudging
  - cooldowns and backoff after misses
  - empirical probing when a route has proven stable
- updates route state based on actual `good` / `great` / `excellent` outcomes

How it works on planets:

- usually opens with a Cherokee-style first bid
- switches into a solver-style hidden-range / threshold-range model on later rounds
- adapts route safety after rejects
- can temporarily fall back into recovery behavior on troublesome routes

General character:

- adaptive rather than static
- more aggressive than the built-ins
- capable of tighter pricing and better cash extraction
- requires a working module install and may need more validation than the built-ins

When to pick it:

- when you are deliberately testing or tuning haggle performance
- when you want the highest ceiling for price optimization
- when you are willing to trade some simplicity for route-aware adaptation

Avoid it when:

- you want the simplest possible behavior
- you are prioritizing pure reliability over experimentation
- the module is not installed or not active in the runtime

## Quick Recommendations

### Ports

- Choose `EPHaggle` if you want the safest built-in default.
- Choose `Enhanced Haggle` if you want the strongest built-in native model.
- Choose `Blend Heuristic` if you want a middle ground.
- Choose `Baseline` only when testing or comparing behavior.
- Choose `Mayhem Haggle` if you want adaptive route-aware optimization and are comfortable treating it as a higher-complexity mode.

### Planets

- Choose `Cherokee Planet` for production reliability.
- Choose `Mayhem Haggle` only when the module is installed and you specifically want to push for better per-trade cash with adaptive route handling.

## Interpreting Performance

There is no single universal “best” mode because the tradeoff is different for each one:

- `EPHaggle` optimizes for safety
- `Enhanced Haggle` optimizes for stronger built-in model-following
- `Blend Heuristic` optimizes for balance
- `Cherokee Planet` optimizes for planet-run stability
- `Mayhem Haggle` optimizes for adaptive, route-aware price extraction

In short:

- safest built-in port mode: `EPHaggle`
- strongest built-in port model: `Enhanced Haggle`
- balanced built-in port opener: `Blend Heuristic`
- safest built-in planet mode: `Cherokee Planet`
- highest-ceiling adaptive mode: `Mayhem Haggle`
