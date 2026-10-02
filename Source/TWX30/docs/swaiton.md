# SWAITON

```twx
swaiton "Command [TL="
```

Like `waiton`, pauses until the supplied text arrives. Unlike `waiton`, the
text must begin at the start of the current line. Matching is case-sensitive;
leading spaces are significant. A matching partial line is sufficient: it does
not wait for a newline. These are the same rules as `setstrigger`.

Variables and concatenated expressions work as they do with `waiton`:

```twx
setvar $prefix "Citadel"
swaiton $prefix&" command"
```

The compiler expands this macro to `setstrigger`, `pause`, and a generated
resume label, just as `waiton` expands to `settexttrigger` and `pause`.
No opcode is added or renumbered; the CTS format remains version 8.
Version-8 runtimes with `setstrigger` can execute the compiled expansion.
Updated `twxd` reconstructs it as `swaiton`.

Explicit `twxc --target-version 7` output uses the existing trigger downgrade:
the generated `setstrigger` becomes `settexttrigger`, so that legacy output
matches anywhere in the line, like ordinary `waiton`.
