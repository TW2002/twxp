# `twxp.cfg`

`twxp.cfg` is an INI-style configuration file used for script quick-load grouping and bot definitions.

In TWX30, the file is currently read if it exists, but it is not auto-generated.

## Location

Place `twxp.cfg` in the proxy `ProgramDir`.

In practice that usually means:

- `ProgramDir/twxp.cfg`
- `ProgramDir/scripts/...`

Example:

```text
/Users/mosleym/twx/twxp.cfg
/Users/mosleym/twx/scripts
```

If the proxy is pointed directly at a script directory, TWX30 uses that directory's parent as `ProgramDir`.

## Format

`twxp.cfg` uses simple INI syntax:

```ini
[SectionName]
Key=Value
OtherKey=Other Value
```

Rules:

- Section names are case-insensitive.
- Keys are case-insensitive.
- Blank lines are ignored.
- Lines starting with `;` or `#` are treated as comments.

## Supported Sections In TWX30

TWX30 currently reads these sections:

- `[QuickLoad]`
- `[bot:<alias>]`

Other legacy sections may exist in old TWX27 configs, but they are not currently used by TWX30's `ProxyMenuCatalog`.

## `[QuickLoad]`

This section maps filename prefixes to virtual quick-load groups.

Example:

```ini
[QuickLoad]
2_=Pack2
d_=Defense
z_=Zed / Archie
```

How it works:

- A file like `2_WorldTrade.ts` uses the prefix `2_` and will appear under the `Pack2` group.
- A file like `d_scan.ts` uses `d_` and will appear under `Defense`.
- If no mapping matches, TWX30 falls back to a default group such as `Misc`.

Notes:

- Top-level script files are grouped by prefix rules from `[QuickLoad]`.
- Subdirectories under `scripts/` appear as their own group names.
- Some directories are intentionally excluded from quick-load grouping:
  - `include`
  - `mombot`
  - `mombot3`
  - `mombot4p`
  - `qubot`
  - `zedbot`

## `[bot:<alias>]`

Each bot section defines one bot profile.

The section name after `bot:` is the bot alias.

Example:

```ini
[bot:mombot]
Name=Mombot
Script=mombot/mom.cts,mombot/helper.cts
Description=Main automation bot
AutoStart=false
NameVar=BotName
CommsVar=BotComms
LoginScript=disabled
Theme=7|[MOMBOT]|~D|~G|~B|~C
```

### Section Name

```ini
[bot:mombot]
```

- `mombot` is the alias.
- Scripts can refer to the bot by alias or by bot name.

### `Name`

```ini
Name=Mombot
```

- Human-readable bot name.
- This is the canonical bot identity shown in menus and used as the active bot name internally.

### `Script`

```ini
Script=mombot/mom.cts,mombot/helper.cts
```

- Comma-separated list of script files to load when the bot is activated.
- Paths are relative to `ProgramDir/scripts/`.
- Use `/` or `\`; TWX30 normalizes them.
- The first script is also used as the bot's primary script identity for matching and cycling.

Examples:

```ini
Script=BotOne.ts
Script=sub/BotTwo.ts,sub/BotTools.ts
```

### `Description`

```ini
Description=Main automation bot
```

- Optional descriptive text.
- Currently used for metadata/display; not required by the runtime.

### `AutoStart`

```ini
AutoStart=true
```

- Optional.
- Defaults to `true` if omitted.
- Accepted true-ish values include:
  - `true`
  - `1`
  - `yes`
  - `y`

If `AutoStart=true`, the bot is eligible for interpreter auto-start behavior.

### `NameVar`

```ini
NameVar=BotName
```

or

```ini
NameVar=FILE:botnames/{GAME}.txt
```

- Controls where the active bot display name is stored.

Two modes are supported:

1. Variable-backed

```ini
NameVar=BotName
```

- Stores the bot display name in the per-game `.cfg` file under the `Variables` section.

2. File-backed

```ini
NameVar=FILE:botnames/{GAME}.txt
```

- Stores the bot display name in a text file relative to `ProgramDir`.
- `{GAME}` is replaced with the current game/database name.
- The file's first line is treated as the bot's display name.

This is how TWX27 and now TWX30 support bots whose active name is shared through a file.

### `CommsVar`

```ini
CommsVar=BotComms
```

- Optional companion variable used by some bots.
- In Pascal TWX behavior, this is mainly relevant when `NameVar` is file-backed.
- TWX30 mirrors that behavior by also writing the chosen bot name to the per-game `Variables` section under `CommsVar` when appropriate.

### `LoginScript`

```ini
LoginScript=0_Login.cts
```

or

```ini
LoginScript=disabled
```

- Optional bot-specific login script override.
- If set to `disabled`, the bot marks login automation as disabled.
- Otherwise, the value is used as the active login script override when that bot is selected.

This does not replace the game's database login configuration globally; it is the bot-side override used by the interpreter.

### `Theme`

```ini
Theme=7|[MOMBOT]|~D|~G|~B|~C
```

`Theme` is a pipe-delimited bot theme definition.

Format:

```text
Theme=<tagLength>|<tagText>|<slot1>|<slot2>|<slot3>|...
```

Meaning:

1. `tagLength`
- Numeric width used for the special `~_` quick-text expansion.
- This controls how much filler is placed before the bot tag in the generated banner line.

2. `tagText`
- The visible bot tag inserted into `~_`.
- Example: `[MOMBOT]`

3. Remaining values
- These override the numbered quick-text slots:
  - third field maps to `~1`
  - fourth field maps to `~2`
  - fifth field maps to `~3`
  - and so on

Example:

```ini
Theme=7|[MOMBOT]|~D|~G|~B
```

This means:

- `tagLength = 7`
- `tagText = [MOMBOT]`
- `~1` becomes `~D`
- `~2` becomes `~G`
- `~3` becomes `~B`

Because user quick texts are recursively expanded, values like `~D` are converted into the corresponding ANSI escape sequences when the bot is activated.

#### `~_`

The special token `~_` expands to a tagged separator line using the active bot's tag and tag length.

It is intended for bot-specific banners and status lines.

#### Built-in QuickText Tokens

TWX30 includes the classic system quick-text tokens, including:

- `~a` .. `~p`
- `~A` .. `~P`
- `~0` .. `~9`
- `~!`
- `~@`
- `~s`
- `~u`
- `~-`
- `~=`
- `~+`

It also supports:

- `~~` for a literal `~`
- `^[` for ESC-based ANSI sequences

Bot themes override the numbered tokens through user quick texts.

## Example Full File

```ini
[QuickLoad]
2_=Pack2
d_=Defense
z_=Zed / Archie

[bot:mombot]
Name=Mombot
Script=mombot/mom.cts,mombot/helper.cts
Description=Main automation bot
AutoStart=false
NameVar=BotName
CommsVar=BotComms
LoginScript=disabled
Theme=7|[MOMBOT]|~D|~G|~B|~C

[bot:trader]
Name=TraderBot
Script=pack2/2_WorldTrade.cts
Description=Trade automation
AutoStart=false
NameVar=FILE:botnames/{GAME}.txt
CommsVar=TraderComms
LoginScript=0_Login.cts
Theme=6|[TRADE]|~E|~F|~G
```

## Legacy TWX27 Sections You May Still See

Older `twxp.cfg` files may also contain sections like:

- `[TWX Proxy]`
- `[Instances]`

Those were used by TWX27 for things like update checks and instance tracking.

TWX30 currently does not use those sections for bot loading or quick-load grouping.

## Current TWX30 Behavior Summary

- `twxp.cfg` is optional.
- It is not auto-generated by TWX30 today.
- If it is missing, quick-load grouping falls back to defaults and no bot definitions are loaded from config.
- If it exists, TWX30 currently uses it for:
  - quick-load virtual groups
  - bot registry metadata
  - bot alias lookup
  - bot theme quick-text overrides
  - bot display-name persistence rules
