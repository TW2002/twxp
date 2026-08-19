using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;

namespace MTC;

public sealed class MacroSettingsDialog : Window
{
    private const string RowColumns = "88,*,68,68,68";

    private static readonly IBrush BgWindow = new SolidColorBrush(Color.FromRgb(5, 24, 30));
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(8, 45, 56));
    private static readonly IBrush BgPanelSoft = new SolidColorBrush(Color.FromRgb(7, 33, 41));
    private static readonly IBrush BgInput = new SolidColorBrush(Color.FromRgb(4, 22, 28));
    private static readonly IBrush BdInput = new SolidColorBrush(Color.FromRgb(9, 126, 149));
    private static readonly IBrush FgNormal = new SolidColorBrush(Color.FromRgb(230, 243, 246));
    private static readonly IBrush FgMuted = new SolidColorBrush(Color.FromRgb(150, 198, 209));
    private static readonly IBrush FgLabel = new SolidColorBrush(Color.FromRgb(0, 239, 239));
    private static readonly IBrush FgError = new SolidColorBrush(Color.FromRgb(255, 128, 128));
    private static readonly IBrush BgButton = new SolidColorBrush(Color.FromRgb(10, 93, 109));
    private static readonly IBrush BgButtonSoft = new SolidColorBrush(Color.FromRgb(9, 63, 76));
    private static readonly IBrush AccentBorder = new SolidColorBrush(Color.FromRgb(18, 214, 214));
    private static readonly IBrush AccentFill = new SolidColorBrush(Color.FromRgb(9, 58, 69));

    private sealed class MacroRowState
    {
        public required Border Border { get; init; }
        public required ComboBox HotkeyCombo { get; init; }
        public required TextBox MacroTextBox { get; init; }
        public required Button PlayButton { get; init; }
        public required Button BurstButton { get; init; }
        public required Button CopyButton { get; init; }
    }

    private readonly List<MacroRowState> _rows = [];
    private readonly StackPanel _rowsPanel = new() { Spacing = 8 };
    private readonly TextBlock _errorText = new()
    {
        Foreground = FgError,
        IsVisible = false,
        TextWrapping = TextWrapping.Wrap,
    };
    private readonly TextBlock _statusText = new()
    {
        Foreground = FgMuted,
        IsVisible = false,
        TextWrapping = TextWrapping.Wrap,
    };
    private readonly Button _removeButton;

    private MacroRowState? _selectedRow;
    private readonly Func<string, int, Task<string?>> _playMacroAsync;
    private readonly Action<IReadOnlyList<AppPreferences.MacroBinding>> _saveMacros;

    public IReadOnlyList<AppPreferences.MacroBinding> Result { get; private set; } = Array.Empty<AppPreferences.MacroBinding>();

    public MacroSettingsDialog(
        IReadOnlyList<AppPreferences.MacroBinding> defaults,
        Func<string, int, Task<string?>> playMacroAsync,
        Action<IReadOnlyList<AppPreferences.MacroBinding>> saveMacros)
    {
        _playMacroAsync = playMacroAsync;
        _saveMacros = saveMacros;
        Title = "Macros";
        Width = 860;
        SizeToContent = SizeToContent.Height;
        CanResize = false;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = BgWindow;

        var btnAdd = new Button
        {
            Content = BuildActionButtonContent("+", "Add"),
            MinWidth = 104,
            Background = BgButton,
            Foreground = FgNormal,
            FontWeight = FontWeight.Bold,
            BorderBrush = AccentBorder,
            CornerRadius = new CornerRadius(8),
            Padding = new Thickness(12, 8),
        };

        _removeButton = new Button
        {
            Content = BuildActionButtonContent("−", "Remove"),
            MinWidth = 120,
            Background = BgButtonSoft,
            Foreground = FgNormal,
            FontWeight = FontWeight.Bold,
            BorderBrush = BdInput,
            CornerRadius = new CornerRadius(8),
            Padding = new Thickness(12, 8),
        };

        btnAdd.Click += (_, _) =>
        {
            AddRow(new AppPreferences.MacroBinding { Hotkey = GetNextAvailableHotkey(), Macro = string.Empty });
            ClearError();
            UpdateActionState();
        };

        _removeButton.Click += (_, _) =>
        {
            RemoveSelectedRow();
            ClearError();
            UpdateActionState();
        };

        var introCard = new Border
        {
            Background = BgPanel,
            BorderBrush = AccentBorder,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(12),
            Padding = new Thickness(16, 14),
            Child = new StackPanel
            {
                Spacing = 8,
                Children =
                {
                    new TextBlock
                    {
                        Text = "Hotkey Macros",
                        Foreground = FgLabel,
                        FontWeight = FontWeight.Bold,
                        FontSize = 22,
                    },
                    new TextBlock
                    {
                        Text = "Bind function keys to quick text bursts, native Mombot commands, or favorite scripts.",
                        Foreground = FgNormal,
                        TextWrapping = TextWrapping.Wrap,
                    },
                    new TextBlock
                    {
                        Text = "Text sends directly to the server. Prefix > to run a native Mombot command, prefix $ to load a TWX script, and use * anywhere to send Enter.",
                        Foreground = FgMuted,
                        TextWrapping = TextWrapping.Wrap,
                    },
                },
            },
        };

        var listTitle = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("*,Auto"),
        };

        listTitle.Children.Add(new StackPanel
        {
            Spacing = 2,
            Children =
            {
                new TextBlock
                {
                    Text = "Macro List",
                    Foreground = FgLabel,
                    FontWeight = FontWeight.Bold,
                    FontSize = 18,
                },
                new TextBlock
                {
                    Text = "Select a row to edit it, then test it from the same line.",
                    Foreground = FgMuted,
                },
            },
        });

        var listActions = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 8,
            HorizontalAlignment = HorizontalAlignment.Right,
            Children = { btnAdd, _removeButton },
        };
        Grid.SetColumn(listActions, 1);
        listTitle.Children.Add(listActions);

        var headerRow = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions(RowColumns),
            Margin = new Thickness(0, 2, 0, 4),
        };
        headerRow.Children.Add(new TextBlock
        {
            Text = "Hotkey",
            Foreground = FgLabel,
            FontWeight = FontWeight.Bold,
            Margin = new Thickness(12, 0, 0, 0),
            VerticalAlignment = VerticalAlignment.Center,
        });
        var macroHeader = new TextBlock
        {
            Text = "Macro",
            Foreground = FgLabel,
            FontWeight = FontWeight.Bold,
            VerticalAlignment = VerticalAlignment.Center,
        };
        Grid.SetColumn(macroHeader, 1);
        headerRow.Children.Add(macroHeader);
        var runHeader = new TextBlock
        {
            Text = "Play",
            Foreground = FgLabel,
            FontWeight = FontWeight.Bold,
            HorizontalAlignment = HorizontalAlignment.Right,
            VerticalAlignment = VerticalAlignment.Center,
        };
        Grid.SetColumn(runHeader, 2);
        headerRow.Children.Add(runHeader);
        var burstHeader = new TextBlock
        {
            Text = "Burst",
            Foreground = FgLabel,
            FontWeight = FontWeight.Bold,
            HorizontalAlignment = HorizontalAlignment.Right,
            VerticalAlignment = VerticalAlignment.Center,
        };
        Grid.SetColumn(burstHeader, 3);
        headerRow.Children.Add(burstHeader);
        var copyHeader = new TextBlock
        {
            Text = "Copy",
            Foreground = FgLabel,
            FontWeight = FontWeight.Bold,
            HorizontalAlignment = HorizontalAlignment.Right,
            VerticalAlignment = VerticalAlignment.Center,
        };
        Grid.SetColumn(copyHeader, 4);
        headerRow.Children.Add(copyHeader);

        foreach (AppPreferences.MacroBinding binding in defaults)
            AddRow(new AppPreferences.MacroBinding { Hotkey = NormalizeHotkey(binding.Hotkey), Macro = binding.Macro ?? string.Empty });

        if (_rows.Count == 0)
            AddRow(new AppPreferences.MacroBinding { Hotkey = "F1", Macro = string.Empty });

        var rowsScroll = new ScrollViewer
        {
            Content = _rowsPanel,
            MaxHeight = 360,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
            Margin = new Thickness(0, 4, 0, 0),
        };

        var listCard = new Border
        {
            Background = BgPanelSoft,
            BorderBrush = BdInput,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(12),
            Padding = new Thickness(14),
            Child = new StackPanel
            {
                Spacing = 8,
                Children =
                {
                    listTitle,
                    headerRow,
                    rowsScroll,
                    _errorText,
                    _statusText,
                },
            },
        };

        var btnSave = new Button
        {
            Content = "Save",
            MinWidth = 80,
            Background = BgButton,
            Foreground = FgNormal,
            BorderBrush = AccentBorder,
            HorizontalAlignment = HorizontalAlignment.Right,
            Margin = new Thickness(0, 0, 8, 0),
            CornerRadius = new CornerRadius(8),
            Padding = new Thickness(14, 8),
        };

        var btnCancel = new Button
        {
            Content = "Quit",
            MinWidth = 80,
            Background = BgButtonSoft,
            Foreground = FgNormal,
            BorderBrush = BdInput,
            CornerRadius = new CornerRadius(8),
            Padding = new Thickness(14, 8),
        };

        btnSave.Click += (_, _) =>
        {
            if (!TryBuildResult(out IReadOnlyList<AppPreferences.MacroBinding> bindings, out string? error))
            {
                ShowError(error ?? "Unable to save macros.");
                return;
            }

            Result = bindings;
            _saveMacros(bindings);
            ShowStatus("Macros saved.");
        };

        btnCancel.Click += (_, _) => Close(false);

        var buttons = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Margin = new Thickness(0, 12, 0, 0),
            Children = { btnSave, btnCancel },
        };

        Content = new StackPanel
        {
            Margin = new Thickness(16),
            Spacing = 12,
            Children =
            {
                introCard,
                listCard,
                buttons,
            },
        };

        UpdateActionState();
    }

    private void AddRow(AppPreferences.MacroBinding binding)
    {
        var hotkeyCombo = new ComboBox
        {
            ItemsSource = TerminalControl.SupportedMacroHotkeys,
            SelectedItem = NormalizeHotkey(binding.Hotkey),
            Width = 76,
            Background = BgInput,
            Foreground = FgNormal,
            BorderBrush = BdInput,
            HorizontalAlignment = HorizontalAlignment.Left,
        };

        var macroTextBox = new TextBox
        {
            Text = binding.Macro ?? string.Empty,
            Watermark = "Text burst, >command, or $scriptname",
            Background = BgInput,
            Foreground = FgNormal,
            BorderBrush = BdInput,
            HorizontalAlignment = HorizontalAlignment.Stretch,
        };

        var rowGrid = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions(RowColumns),
            ColumnSpacing = 10,
        };
        rowGrid.Children.Add(hotkeyCombo);
        Grid.SetColumn(macroTextBox, 1);
        rowGrid.Children.Add(macroTextBox);

        var playButton = new Button
        {
            Content = "Play",
            Width = 68,
            Background = BgButton,
            Foreground = FgNormal,
            BorderBrush = AccentBorder,
            CornerRadius = new CornerRadius(8),
            IsEnabled = !string.IsNullOrWhiteSpace(binding.Macro),
            HorizontalAlignment = HorizontalAlignment.Right,
        };
        Grid.SetColumn(playButton, 2);
        rowGrid.Children.Add(playButton);

        var burstButton = new Button
        {
            Content = "Burst",
            Width = 68,
            Background = BgButton,
            Foreground = FgNormal,
            BorderBrush = AccentBorder,
            CornerRadius = new CornerRadius(8),
            IsEnabled = !string.IsNullOrWhiteSpace(binding.Macro),
            HorizontalAlignment = HorizontalAlignment.Right,
        };
        Grid.SetColumn(burstButton, 3);
        rowGrid.Children.Add(burstButton);

        var copyButton = new Button
        {
            Content = "Copy",
            Width = 68,
            Background = BgButtonSoft,
            Foreground = FgNormal,
            BorderBrush = BdInput,
            CornerRadius = new CornerRadius(8),
            IsEnabled = !string.IsNullOrWhiteSpace(binding.Macro),
            HorizontalAlignment = HorizontalAlignment.Right,
        };
        Grid.SetColumn(copyButton, 4);
        rowGrid.Children.Add(copyButton);

        var border = new Border
        {
            Background = AccentFill,
            BorderBrush = BdInput,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(8),
            Padding = new Thickness(10),
            Child = rowGrid,
        };

        var state = new MacroRowState
        {
            Border = border,
            HotkeyCombo = hotkeyCombo,
            MacroTextBox = macroTextBox,
            PlayButton = playButton,
            BurstButton = burstButton,
            CopyButton = copyButton,
        };

        border.PointerPressed += (_, _) => SelectRow(state);
        hotkeyCombo.GotFocus += (_, _) => SelectRow(state);
        macroTextBox.GotFocus += (_, _) => SelectRow(state);
        playButton.Click += async (_, _) => await PlayMacroOnceAsync(state);
        burstButton.Click += async (_, _) => await BurstMacroAsync(state);
        copyButton.Click += async (_, _) => await CopyMacroAsync(state);
        hotkeyCombo.SelectionChanged += (_, _) => ClearError();
        macroTextBox.TextChanged += (_, _) =>
        {
            bool hasMacro = !string.IsNullOrWhiteSpace(macroTextBox.Text);
            state.PlayButton.IsEnabled = hasMacro;
            state.BurstButton.IsEnabled = hasMacro;
            state.CopyButton.IsEnabled = hasMacro;
            ClearError();
        };

        _rows.Add(state);
        _rowsPanel.Children.Add(border);
        SelectRow(state);
    }

    private void RemoveSelectedRow()
    {
        MacroRowState? target = _selectedRow ?? _rows.LastOrDefault();
        if (target == null)
            return;

        int index = _rows.IndexOf(target);
        if (index < 0)
            return;

        _rows.RemoveAt(index);
        _rowsPanel.Children.Remove(target.Border);

        if (_rows.Count == 0)
        {
            _selectedRow = null;
            UpdateActionState();
            return;
        }

        SelectRow(_rows[Math.Min(index, _rows.Count - 1)]);
    }

    private void SelectRow(MacroRowState state)
    {
        _selectedRow = state;
        foreach (MacroRowState row in _rows)
        {
            bool selected = ReferenceEquals(row, state);
            row.Border.BorderBrush = selected ? AccentBorder : BdInput;
            row.Border.BorderThickness = selected ? new Thickness(2) : new Thickness(1);
            row.Border.Background = selected ? BgPanel : AccentFill;
        }

        UpdateActionState();
    }

    private bool TryBuildResult(out IReadOnlyList<AppPreferences.MacroBinding> bindings, out string? error)
    {
        var result = new List<AppPreferences.MacroBinding>();
        var seenHotkeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (MacroRowState row in _rows)
        {
            string macro = row.MacroTextBox.Text ?? string.Empty;
            if (string.IsNullOrWhiteSpace(macro))
                continue;

            string hotkey = NormalizeHotkey(row.HotkeyCombo.SelectedItem as string);
            if (!seenHotkeys.Add(hotkey))
            {
                bindings = Array.Empty<AppPreferences.MacroBinding>();
                error = $"Hotkey {hotkey} is assigned more than once.";
                return false;
            }

            result.Add(new AppPreferences.MacroBinding
            {
                Hotkey = hotkey,
                Macro = macro,
            });
        }

        bindings = result;
        error = null;
        return true;
    }

    private string GetNextAvailableHotkey()
    {
        HashSet<string> usedHotkeys = _rows
            .Select(row => NormalizeHotkey(row.HotkeyCombo.SelectedItem as string))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return TerminalControl.SupportedMacroHotkeys.FirstOrDefault(hotkey => !usedHotkeys.Contains(hotkey)) ?? "F1";
    }

    private void ShowError(string message)
    {
        _statusText.Text = string.Empty;
        _statusText.IsVisible = false;
        _errorText.Text = message;
        _errorText.IsVisible = true;
    }

    private void ShowStatus(string message)
    {
        _errorText.Text = string.Empty;
        _errorText.IsVisible = false;
        _statusText.Text = message;
        _statusText.IsVisible = true;
    }

    private void ClearError()
    {
        _errorText.Text = string.Empty;
        _errorText.IsVisible = false;
        _statusText.Text = string.Empty;
        _statusText.IsVisible = false;
    }

    private async Task PlayMacroOnceAsync(MacroRowState row)
    {
        SelectRow(row);
        ClearError();

        string macro = row.MacroTextBox.Text ?? string.Empty;
        if (string.IsNullOrWhiteSpace(macro))
        {
            ShowError("Enter a macro before using Play.");
            return;
        }

        string? error = await _playMacroAsync(macro, 1);
        if (!string.IsNullOrWhiteSpace(error))
            ShowError(error);
    }

    private async Task BurstMacroAsync(MacroRowState row)
    {
        SelectRow(row);
        ClearError();

        string macro = row.MacroTextBox.Text ?? string.Empty;
        if (string.IsNullOrWhiteSpace(macro))
        {
            ShowError("Enter a macro before using Burst.");
            return;
        }

        var dialog = new MacroPlayDialog(macro);
        bool accepted = await dialog.ShowDialog<bool>(this);
        if (!accepted)
            return;

        string updatedMacro = dialog.MacroText;
        row.MacroTextBox.Text = updatedMacro;

        string? error = await _playMacroAsync(updatedMacro, dialog.PlayCount);
        if (!string.IsNullOrWhiteSpace(error))
            ShowError(error);
    }

    private async Task CopyMacroAsync(MacroRowState row)
    {
        SelectRow(row);
        ClearError();

        string macro = row.MacroTextBox.Text ?? string.Empty;
        if (string.IsNullOrWhiteSpace(macro))
        {
            ShowError("Enter a macro before using Copy.");
            return;
        }

        bool copied = await ClipboardHelper.TrySetTextAsync(this, macro);
        if (copied)
            ShowStatus("Macro copied.");
        else
            ShowError("Unable to copy macro to the clipboard.");
    }

    private void UpdateActionState()
    {
        _removeButton.IsEnabled = _rows.Count > 0;
    }

    private static object BuildActionButtonContent(string symbol, string label)
    {
        var layout = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 8,
            VerticalAlignment = VerticalAlignment.Center,
        };
        layout.Children.Add(new TextBlock
        {
            Text = symbol,
            FontWeight = FontWeight.Bold,
            FontSize = 18,
            VerticalAlignment = VerticalAlignment.Center,
        });
        layout.Children.Add(new TextBlock
        {
            Text = label,
            FontWeight = FontWeight.SemiBold,
            VerticalAlignment = VerticalAlignment.Center,
        });
        return layout;
    }

    private static string NormalizeHotkey(string? hotkey)
    {
        string candidate = string.IsNullOrWhiteSpace(hotkey) ? "F1" : hotkey.Trim().ToUpperInvariant();
        return TerminalControl.SupportedMacroHotkeys.Contains(candidate, StringComparer.OrdinalIgnoreCase)
            ? candidate
            : "F1";
    }
}
