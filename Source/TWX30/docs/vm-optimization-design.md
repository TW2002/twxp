# VM Optimization Design

## Status

- Baseline snapshot: `v3.0.0`
- Active development version: `3.0.1`
- Current reality: TWX30 already has both:
  - the legacy raw-bytecode interpreter path in [Script.cs](/Users/mosleym/Code/twxproxy/TWX30/Source/Core/Script.cs)
  - a prepared-instruction decode/execute path in [ScriptVm.cs](/Users/mosleym/Code/twxproxy/TWX30/Source/Core/ScriptVm.cs) and [Script.cs](/Users/mosleym/Code/twxproxy/TWX30/Source/Core/Script.cs)
- Immediate goal: improve VM performance only through parity-safe internal changes

## Core Rule

Optimization work must not change TWX27-visible behavior.

That means no changes to:

- command semantics
- sysconst semantics
- math/string formatting rules
- array/sentinel behavior
- trigger timing/lifecycle behavior
- label resolution and code-position flow
- save/load/global persistence behavior
- compiler output in Pascal compatibility mode

If an optimization and Pascal parity conflict, parity wins.

## What Counts As Safe

Safe optimization targets are internal implementation details that do not change script-visible behavior:

- fewer allocations in dispatch and parameter evaluation
- less repeated bytecode walking
- pre-resolving metadata that is already deterministic
- caching decode results
- reducing debug/log overhead on hot paths
- tighter data structures for prepared execution

Unsafe optimization targets for this phase:

- changing opcode meanings
- reordering command evaluation
- changing when values are materialized
- collapsing mutable parameter instances in ways Pascal would not
- replacing sentinel-based array behavior with different rules
- changing compiler output format for Pascal mode
- introducing a TWX30-only runtime path that becomes the only execution path

## Compatibility Contract

### Must remain supported

- Pascal `.cts` versions 2 through 6
- current TWX30 `.ts` source files, including include trees
- current decompiler round-trip expectations
- current shared Core behavior used by MTC, TWXC, TWXD, and the proxy

### Runtime contract

- the raw interpreter remains the compatibility oracle
- the prepared interpreter must be observationally equivalent to the raw interpreter
- if prepared decode or prepared execution disagrees with the raw interpreter, raw behavior is considered correct until proven otherwise against TWX27

### Compiler modes

- `pascal` compatibility mode
  - emits legacy `.cts` bytecode layout
  - must preserve compatibility with older clients and Pascal expectations
- `native` mode
  - optional future work only
  - not a prerequisite for current VM optimization
  - must never replace Pascal mode

## Current Runtime Shape

### Raw path

In [Script.cs](/Users/mosleym/Code/twxproxy/TWX30/Source/Core/Script.cs):

- reads instruction headers directly from the byte stream
- walks parameters directly from raw bytecode
- resolves commands and sysconsts during execution
- evaluates array indexes and dynamic params on demand

This path is slowest, but it is also the most direct compatibility reference.

### Prepared path

In [ScriptVm.cs](/Users/mosleym/Code/twxproxy/TWX30/Source/Core/ScriptVm.cs):

- decodes bytecode into:
  - `PreparedScriptProgram`
  - `PreparedInstruction`
  - `PreparedParam`
- pre-resolves command metadata where possible
- builds reusable dispatch buffers
- identifies direct vs dynamic parameters

In [Script.cs](/Users/mosleym/Code/twxproxy/TWX30/Source/Core/Script.cs):

- `Execute()` prefers prepared execution when available
- falls back to the raw interpreter when needed

This is already the right architecture for parity-safe optimization. The plan should build on it rather than replace it.

## Current Cost Centers

### Source load

In [ScriptCmp.cs](/Users/mosleym/Code/twxproxy/TWX30/Source/Core/ScriptCmp.cs):

- `.ts` loads still compile source each time
- include-heavy trees multiply work
- prepared decode is cached per compiled script object, but source compile still dominates first load
- there is no cross-load cache yet for compiled/prepared source scripts keyed by file state

### Prepared execution hot spots

In [Script.cs](/Users/mosleym/Code/twxproxy/TWX30/Source/Core/Script.cs):

- dynamic param evaluation still creates work on every dispatch
- indexed variable/sysconst resolution still does string/index reconstruction
- arithmetic-expression variable handling still has repeated runtime cost
- some debug/diagnostic code still sits near hot loops
- pause/end control flow still triggers debug flushes and message construction on hot paths
- control-flow jumps still rely on a dense raw-offset lookup table sized to full bytecode length

### Raw fallback hot spots

The raw path still:

- reparses every instruction from bytes
- reparses every parameter from bytes
- repeatedly resolves command/sysconst metadata
- still matters because it remains the parity reference and fallback path

## Revised Optimization Strategy

## Phase 0: Parity Guardrails First

Before each optimization step:

- compare behavior against TWX27 when a command/runtime rule is ambiguous
- preserve the raw path as the reference implementation
- add or update a parity check for the changed area

Every optimization PR should answer:

1. what exact cost is being reduced?
2. what script-visible behavior could this accidentally change?
3. how was parity checked?

## Phase 1: Measurement On The Existing Runtime

Use the runtime capabilities that already exist instead of inventing a new benchmark framework first.

Available controls already in the code:

- raw vs prepared A/B switch via `PreferPreparedExecution` in
  [Script.cs](/Users/mosleym/Code/twxproxy/TWX30/Source/Core/Script.cs)
- command-level timing hook via `ExecutionObserver` in
  [Script.cs](/Users/mosleym/Code/twxproxy/TWX30/Source/Core/Script.cs)

Measure the current two execution modes separately:

- raw interpreter load + execute
- prepared decode + prepared execute

Track at least:

- source compile time
- compiled load time
- prepared decode time
- time to first `pause`
- time to completion
- allocation pressure in hot loops
- command dispatch counts
- dynamic-param evaluation counts

Representative scripts:

- `2_WorldTrade.ts`
- Pascal `2_WorldTrade.cts`
- `mom_bot3_1045s.cts`
- at least one include-heavy script
- at least one trigger-heavy/menu-heavy script

Important rule:

- benchmarking must not require semantic changes to scripts or the runtime

## Phase 2: Source And Prepared Cache

This is the highest-value startup optimization still missing from the current runtime.

Target:

- cache compiled and prepared results for `.ts` source loads across script launches

Candidate cache key:

- full resolved script path
- main file last-write time or hash
- include tree fingerprint
- compatibility mode / compiler options that affect output

Cached payload:

- compiled bytecode
- parameter table
- label table
- include metadata
- prepared program

Important rules:

- cache invalidation must be conservative
- cache hits must be observationally identical to recompiling from source
- Pascal `.cts` loads should continue to use normal compiled load behavior and prepared decode cache

## Phase 3: Prepared Path Hardening

Before further optimization, make the prepared path easier to trust:

- keep raw byte offsets on every prepared instruction
- preserve exact command IDs and parameter ordering
- preserve exact parameter typing and index trees
- preserve label/jump mapping by raw offset
- keep raw fallback available behind the same runtime

If there is any disagreement between prepared and raw execution:

- fix prepared execution
- do not “simplify” raw behavior to match prepared

## Phase 4: Logging And Debug Path Cleanup

The current runtime still pays for some diagnostic work even when normal operation does not need it.

Primary targets:

- avoid string interpolation on hot paths unless the corresponding debug mode is enabled
- reduce `FlushDebugLog()` calls on pause/end/control-flow hot paths
- keep verbose execution diagnostics fully available, but move them behind stricter guards

Important rule:

- diagnostic visibility may be reduced in normal mode, but not removed in verbose or explicit diagnostic modes

## Phase 5: Indexed-Parameter Fast Paths

Indexed vars and sysconsts are one of the clearest remaining hot spots in prepared execution.

Primary targets:

- add specialized fast paths for:
  - zero indexes
  - one index
  - two indexes
- minimize `string[]` rent/fill/clear churn
- minimize repeated normalization for common integer-like indexes
- keep fallback generic handling for unusual cases

Important rule:

- the fast path must return exactly the same index strings and lookup behavior as the generic path

## Phase 6: Decode Tightening And Low-Risk Allocation Reduction

Optimize load-time decode and per-dispatch churn without changing semantics.

Primary targets:

- reduce transient `List<>` allocations during prepared decode
- eliminate repeated reads/lookups that can be captured once during decode
- reuse dispatch buffers more aggressively
- cache reusable scratch params for prepared direct literals
- reduce per-dispatch temporary array creation

Only optimize internal churn that should be invisible to scripts:

- reuse dispatch buffers more aggressively
- cache reusable scratch params for prepared direct literals
- reduce per-dispatch temporary array creation
- reduce repeated index-buffer allocations
- reduce repeated string normalization in hot execution paths

Important rule:

- never share mutable parameter instances across commands if Pascal behavior expects independent values

## Phase 7: Metadata And Lookup Tightening

Optimize lookups that are already deterministic:

- cache command handler references
- cache sysconst references
- keep pre-decoded parameter descriptors typed
- cache direct parameter initialization state
- reduce repeated dictionary/list lookups in `ExecutePrepared()`

Allowed:

- faster metadata access
- denser prepared instruction storage

Not allowed:

- changing when a dynamic value is evaluated
- folding runtime values into compile-time constants unless Pascal would already do so

## Phase 8: Prepared Control-Flow Index Compaction

The prepared runtime currently pays O(code length) memory for raw-offset lookup convenience.

Primary targets:

- replace the dense raw-offset-to-instruction array with a more compact structure
- preserve exact raw-offset control-flow semantics
- keep jump/trigger/label behavior identical

Candidate approaches:

- sorted instruction-offset table with binary search
- chunked offset index
- sparse direct map only for legal instruction offsets

Important rule:

- any compaction must preserve exact behavior for code-position-based control flow

## Phase 9: Raw Path Cleanup Without Semantic Change

The raw path should stay correct even if it is not the fastest path.

Safe cleanup here means:

- extracting shared decode helpers used by both raw and prepared paths
- reducing duplicate logging/diagnostic overhead
- reducing obviously redundant work while preserving byte-walk behavior

The goal is maintainability and fallback correctness, not raw-path feature drift.

## Phase 10: Optional Native Format Only After Parity Confidence

The optional TWX30-native format stays deferred.

Do not move to this phase until:

- prepared execution has proven parity on the real script set
- raw fallback remains intact
- Pascal-mode compiler output remains stable

Potential future benefits:

- pre-serialized instruction tables
- smaller/faster metadata load
- fewer decode steps at load time

But this phase is explicitly lower priority than parity-safe optimization of the existing prepared VM.

## Validation Matrix

Every VM optimization must be validated against:

- Pascal `.cts` load and execution
- TWXC-compiled `.cts` load and execution
- `.ts` source load and execution
- include-heavy scripts
- menu/input-heavy scripts
- trigger-heavy scripts
- savevar/loadvar behavior
- bot and quicktext flows
- array sentinel behavior
- compiler output in Pascal compatibility mode

When possible, validate both:

- prepared execution enabled
- prepared execution disabled or bypassed via raw fallback

## Practical Next Steps

1. Add lightweight metrics using the existing raw/prepared toggle and execution observer.
2. Implement a conservative source/prepare cache for `.ts` loads.
3. Strip avoidable debug-string construction and flushes from hot control-flow paths.
4. Add indexed-parameter fast paths and measure again.
5. Tighten prepared decode allocations and metadata work.
6. Compact the prepared control-flow index only after behavior is well covered.
7. Keep the raw path untouched except for shared helper extraction and non-semantic cleanup.
8. Defer any native-format work until the prepared path is both faster and trusted.

## Short Version

The optimization path should now be:

- treat TWX27 parity as the fixed contract
- treat the raw interpreter as the fallback oracle
- measure the existing raw and prepared paths directly
- attack startup cost first with source/prepare caching
- remove debug-path overhead early
- optimize indexed-param and decode hot spots before larger redesigns
- optimize the existing prepared VM incrementally
- prove each step with parity-focused validation
- do not redesign the runtime in ways that make Pascal behavior harder to preserve
