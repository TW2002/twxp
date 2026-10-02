# twxproxy 3.0.1

twxproxy 3.0.1 is the current C#/.NET rewrite of the classic TWX Proxy helper for Trade Wars 2002.

Current source version: `3.0.1`; MTC client version: `1.1.0` (build 0101).

The active code lives under `Source/` and includes:

- `TWXProxy`: shared Core runtime, compiler support, script execution, proxy logic, and database code
- `TWXC`: command-line compiler for `.ts -> .cts`
- `TWXD`: command-line decompiler for `.cts -> .ts`
- `MTC`: Avalonia desktop client with an embedded proxy
- `TWXP`: Avalonia based multi threaded proxy

For build details, project layout, and tooling notes, see [`Source/README.md`](Source/README.md).
