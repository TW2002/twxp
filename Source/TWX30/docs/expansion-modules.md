# Expansion Modules

TWX30 can auto-load optional expansion modules for both MTC and TWXP.

The first goal of this framework is to let a module work against the shared Core runtime:

- [`GameInstance`](/Users/mosleym/Code/twxproxy/TWX30/Source/Core/Network.cs)
- [`ModInterpreter`](/Users/mosleym/Code/twxproxy/TWX30/Source/Core/Script.cs)
- [`ModDatabase`](/Users/mosleym/Code/twxproxy/TWX30/Source/Core/Database.cs)

That means a module can observe the live connection, react to server text, send commands, inspect script/runtime state, and keep per-game data without being tightly coupled to MTC or TWXP internals.

## Auto-load locations

MTC searches:

- `~/Library/MTC/modules`
- `~/Library/twxproxy/modules`
- `<ProgramDir>/modules`

TWXP searches:

- `<TWXP app data>/modules`
- `~/Library/twxproxy/modules`
- `<ProgramDir>/modules`

On Windows and Linux, the same rules apply using the platform-specific app-data roots from the app path helpers.

Each module may be either:

- a single DLL dropped directly in one of those folders
- a folder containing the module DLL plus its dependencies

The loader scans the top level of each module folder and the top level of its immediate child folders.

## Module contract

Implement [`IExpansionModule`](/Users/mosleym/Code/twxproxy/TWX30/Source/Core/ExpansionModules.cs):

```csharp
public sealed class MyModule : IExpansionModule
{
    public string Id => "my-module";
    public string DisplayName => "My Module";
    public ExpansionHostTargets SupportedHosts => ExpansionHostTargets.Any;

    public Task InitializeAsync(ExpansionModuleContext context, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    public Task ShutdownAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
```

Requirements:

- public non-abstract class
- parameterless constructor
- references [`TWXProxy.csproj`](/Users/mosleym/Code/twxproxy/TWX30/Source/TWXProxy.csproj)

## What the module gets

[`ExpansionModuleContext`](/Users/mosleym/Code/twxproxy/TWX30/Source/Core/ExpansionModules.cs) provides:

- `GameInstance`
- `Interpreter`
- `Database`
- `HostName`
- `GameName`
- `ProgramDir`
- `ScriptDirectory`
- `ModuleDirectory`
- `ModuleDataDirectory`

Useful helpers:

- `SendMessageAsync(...)`
- `SendToServerAsync(...)`
- `Log(...)`

For interactive assistants, the host also supports
[`IExpansionChatModule`](/Users/mosleym/Code/twxproxy/TWX30/Source/Core/ExpansionModules.cs).
In MTC, any loaded chat-capable module appears in the top-level `AI` menu.

`ModuleDataDirectory` is per app, per game, per module, so a future GPT module can keep conversation state, embeddings, summaries, or tool-specific caches there without colliding with other modules.

## Isolation model

Each module assembly is loaded in its own `AssemblyLoadContext` using `AssemblyDependencyResolver`.

That gives two benefits:

- module DLLs can carry their own dependencies
- future modules such as an OpenAI/GPT integration can ship SDK packages without polluting the main app load context

The shared `TWXProxy` Core assembly is resolved from the app’s default load context so modules use the live runtime objects instead of duplicate Core types.

## Sample module

A working starter module lives at:

- [`SampleObserverModule.csproj`](/Users/mosleym/Code/twxproxy/TWX30/Source/Modules/SampleObserverModule/SampleObserverModule.csproj)
- [`SampleObserverModule.cs`](/Users/mosleym/Code/twxproxy/TWX30/Source/Modules/SampleObserverModule/SampleObserverModule.cs)

Build it with:

```bash
dotnet build /Users/mosleym/Code/twxproxy/TWX30/Source/Modules/SampleObserverModule/SampleObserverModule.csproj -c Debug
```

Then copy the resulting DLL (and any adjacent dependency files) into one of the auto-load module folders.

## GPT-style module direction

For the GPT gameplay module you mentioned, the intended pattern is:

1. build a module DLL that references `TWXProxy`
2. subscribe to `GameInstance.ServerDataReceived`, `Connected`, and `Disconnected`
3. maintain per-game state under `ModuleDataDirectory`
4. call `GameInstance.SendToServerAsync(...)` when the model decides to act
5. optionally use `Interpreter`, `History`, and the database to build richer prompts

That next module can be built on top of this host without changing MTC or TWXP again.
