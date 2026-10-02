# Targeting CTS Version 7

Run `twxc --help` (or `twxc -h`) to see all compiler options.

```sh
twxc --target-version 7 script.ts
```

This produces `script.cts` for TWX30 runtimes supporting CTS format 7, before
the start-of-line trigger additions. Version 8 remains the default; it can also
be selected explicitly with `--target-version 8`. The `--target-version=7`
spelling is accepted.

Version 7 uses the same file layout and existing command IDs as version 8, but
does not support the start-of-line trigger commands. For this target TWXC automatically
converts `setstrigger` to `settexttrigger` and `setslinetrigger` to
`settextlinetrigger`, including reachable included code. The compiler warns when
conversion occurs: these triggers now match anywhere in the line, not just at
the start. Operands and labels are preserved. Source files and version-8 output
are unchanged. A rejected compilation leaves any existing `.cts` output untouched.

`--compat` controls bytecode pruning, not the CTS format version. It can be
combined with `--target-version 7`. Format targeting is not applicable to
`--precompile`, which produces encrypted `.inc` source, not `.cts` bytecode.

Only output versions 7 and 8 are supported. Version 7 is an older TWX30 target,
not a guarantee that TWX30-only native commands will run under original TWX27.
The target is a CTS version, unrelated to the XDB database version.
