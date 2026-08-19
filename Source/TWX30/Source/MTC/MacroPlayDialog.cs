using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Threading;

namespace MTC;

public sealed class MacroPlayDialog : Window
{
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

    private readonly Func<string, string?>? _macroValidator;
    private readonly Func<MacroPlayDialog, Task<string?>>? _playAsync;
    private readonly Func<MacroPlayDialog, Task<string?>>? _saveAsync;
    private readonly IReadOnlyList<AppPreferences.MacroBinding> _existingBindings;
    private readonly TextBox _macroTextBox;
    private readonly TextBox _countTextBox;
    private readonly TextBlock _errorText;
    private readonly TextBlock _statusText;
    private readonly CheckBox? _assignHotkeyCheckBox;
    private readonly ComboBox? _hotkeyCombo;
    private readonly TextBlock? _hotkeyHint;
    private readonly Button _playButton;
    private readonly Button? _saveButton;

    public int PlayCount { get; private set; } = 1;
    public string MacroText { get; private set; } = string.Empty;
    public bool AssignToHotkey { get; private set; }
    public string AssignedHotkey { get; private set; } = string.Empty;

    public MacroPlayDialog(
        string macro,
        Func<string, string?>? macroValidator = null,
        bool allowHotkeyAssignment = false,
        IReadOnlyList<AppPreferences.MacroBinding>? existingBindings = null,
        string? preferredHotkey = null,
        Func<MacroPlayDialog, Task<string?>>? playAsync = null,
        Func<MacroPlayDialog, Task<string?>>? saveAsync = null)
    {
        _macroValidator = macroValidator;
        _playAsync = playAsync;
        _saveAsync = saveAsync;
        _existingBindings = existingBindings ?? Array.Empty<AppPreferences.MacroBinding>();
        Title = "Quick Macro";
        Width = 640;
        SizeToContent = SizeToContent.Height;
        CanResize = false;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = BgWindow;

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
                        Text = "Quick Macro",
                        Foreground = FgLabel,
                        FontWeight = FontWeight.Bold,
                        FontSize = 22,
                    },
                    new TextBlock
                    {
                        Text = "Edit and save the quick macro, play it now, or optionally pin it to a function key for later.",
                        Foreground = FgNormal,
                        TextWrapping = TextWrapping.Wrap,
                    },
                    new TextBlock
                    {
                        Text = "Use * anywhere to send Enter.",
                        Foreground = FgMuted,
                        TextWrapping = TextWrapping.Wrap,
                    },
                },
            },
        };

        _macroTextBox = new TextBox
        {
            Text = macro,
            AcceptsReturn = true,
            TextWrapping = TextWrapping.Wrap,
            MinHeight = 90,
            Background = BgInput,
            Foreground = FgNormal,
            BorderBrush = BdInput,
        };

        var editorCard = new Border
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
                    new TextBlock
                    {
                        Text = "Macro Text",
                        Foreground = FgLabel,
                        FontWeight = FontWeight.Bold,
                    },
                    _macroTextBox,
                },
            },
        };

        _countTextBox = new TextBox
        {
            Text = "1",
            Width = 90,
            Background = BgInput,
            Foreground = FgNormal,
            BorderBrush = BdInput,
            HorizontalAlignment = HorizontalAlignment.Left,
        };

        var controlsGrid = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions(allowHotkeyAssignment ? "Auto,20,*" : "Auto"),
            RowDefinitions = new RowDefinitions(allowHotkeyAssignment ? "Auto,Auto" : "Auto"),
        };

        var countPanel = new StackPanel
        {
            Spacing = 6,
            Children =
            {
                new TextBlock
                {
                    Text = "Times to Play (1-1000)",
                    Foreground = FgLabel,
                    FontWeight = FontWeight.Bold,
                },
                _countTextBox,
            },
        };
        controlsGrid.Children.Add(countPanel);

        if (allowHotkeyAssignment)
        {
            _assignHotkeyCheckBox = new CheckBox
            {
                Content = "Assign to function key",
                Foreground = FgNormal,
                VerticalAlignment = VerticalAlignment.Center,
                IsChecked = false,
            };

            _hotkeyCombo = new ComboBox
            {
                ItemsSource = TerminalControl.SupportedMacroHotkeys,
                SelectedItem = NormalizeHotkey(preferredHotkey ?? GetSuggestedHotkey()),
                Width = 92,
                Background = BgInput,
                Foreground = FgNormal,
                BorderBrush = BdInput,
                IsEnabled = false,
                HorizontalAlignment = HorizontalAlignment.Left,
            };

            _hotkeyHint = new TextBlock
            {
                Foreground = FgMuted,
                TextWrapping = TextWrapping.Wrap,
                IsVisible = false,
            };

            var assignPanel = new StackPanel
            {
                Spacing = 6,
                Children =
                {
                    _assignHotkeyCheckBox,
                    _hotkeyCombo,
                },
            };
            Grid.SetColumn(assignPanel, 2);
            controlsGrid.Children.Add(assignPanel);

            Grid.SetColumn(_hotkeyHint, 2);
            Grid.SetRow(_hotkeyHint, 1);
            controlsGrid.Children.Add(_hotkeyHint);

            _assignHotkeyCheckBox.IsCheckedChanged += (_, _) => UpdateHotkeyUi();
            _hotkeyCombo.SelectionChanged += (_, _) => UpdateHotkeyUi();
            UpdateHotkeyUi();
        }

        var controlsCard = new Border
        {
            Background = BgPanelSoft,
            BorderBrush = BdInput,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(12),
            Padding = new Thickness(14),
            Child = controlsGrid,
        };

        _errorText = new TextBlock
        {
            Foreground = FgError,
            IsVisible = false,
            TextWrapping = TextWrapping.Wrap,
        };

        _statusText = new TextBlock
        {
            Foreground = FgMuted,
            IsVisible = false,
            TextWrapping = TextWrapping.Wrap,
        };

        _playButton = new Button
        {
            Content = "Play",
            MinWidth = 80,
            Background = BgButton,
            Foreground = FgNormal,
            BorderBrush = AccentBorder,
            HorizontalAlignment = HorizontalAlignment.Right,
            Margin = new Thickness(0, 0, 8, 0),
            CornerRadius = new CornerRadius(8),
            Padding = new Thickness(14, 8),
        };

        if (_saveAsync != null)
        {
            _saveButton = new Button
            {
                Content = "Save",
                MinWidth = 80,
                Background = BgButtonSoft,
                Foreground = FgNormal,
                BorderBrush = BdInput,
                HorizontalAlignment = HorizontalAlignment.Right,
                Margin = new Thickness(0, 0, 8, 0),
                CornerRadius = new CornerRadius(8),
                Padding = new Thickness(14, 8),
            };
            _saveButton.Click += async (_, _) => await TrySaveAsync();
        }

        var btnCancel = new Button
        {
            Content = _playAsync == null && _saveAsync == null ? "Cancel" : "Close",
            MinWidth = 80,
            Background = BgButtonSoft,
            Foreground = FgNormal,
            BorderBrush = BdInput,
            CornerRadius = new CornerRadius(8),
            Padding = new Thickness(14, 8),
        };

        _playButton.Click += async (_, _) => await TryPlayOrAcceptAsync();
        btnCancel.Click += (_, _) => Close(false);

        var buttons = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Margin = new Thickness(0, 12, 0, 0),
        };
        buttons.Children.Add(_playButton);
        if (_saveButton != null)
            buttons.Children.Add(_saveButton);
        buttons.Children.Add(btnCancel);

        Content = new StackPanel
        {
            Margin = new Thickness(16),
            Spacing = 12,
            Children =
            {
                introCard,
                editorCard,
                controlsCard,
                _errorText,
                _statusText,
                buttons,
            },
        };

        Opened += (_, _) => FocusCountTextBox();

        KeyDown += (_, e) =>
        {
            if (e.Key == Key.Escape)
            {
                Close(false);
                e.Handled = true;
            }
            else if (e.Key == Key.Enter || e.Key == Key.Return)
            {
                _ = TryPlayOrAcceptAsync();
                e.Handled = true;
            }
        };
    }

    public void SetMacroText(string macroText, string? statusMessage = null)
    {
        _macroTextBox.Text = macroText;
        MacroText = macroText;

        if (!string.IsNullOrWhiteSpace(statusMessage))
            ShowStatus(statusMessage);
        else
            ClearMessages();
    }

    private async Task TryPlayOrAcceptAsync()
    {
        if (!TryApplyDialogValues())
            return;

        if (_playAsync == null)
        {
            Close(true);
            return;
        }

        _playButton.IsEnabled = false;
        try
        {
            string? playError = await _playAsync(this);
            if (!string.IsNullOrWhiteSpace(playError))
                ShowError(playError);
            else
                ShowStatus(PlayCount == 1 ? "Macro played." : $"Macro played {PlayCount} times.");
        }
        finally
        {
            _playButton.IsEnabled = true;
        }
    }

    private async Task TrySaveAsync()
    {
        if (_saveAsync == null || !TryApplyDialogValues())
            return;

        _saveButton!.IsEnabled = false;
        try
        {
            string? saveError = await _saveAsync(this);
            if (!string.IsNullOrWhiteSpace(saveError))
                ShowError(saveError);
            else
                ShowStatus("Quick macro saved.");
        }
        finally
        {
            _saveButton.IsEnabled = true;
        }
    }

    private bool TryApplyDialogValues()
    {
        ClearMessages();

        if (!int.TryParse((_countTextBox.Text ?? string.Empty).Trim(), out int count) || count < 1 || count > 1000)
        {
            ShowError("Enter a whole number from 1 to 1000.");
            return false;
        }

        string macroText = _macroTextBox.Text ?? string.Empty;
        string? macroError = _macroValidator?.Invoke(macroText);
        if (!string.IsNullOrWhiteSpace(macroError))
        {
            ShowError(macroError);
            return false;
        }

        MacroText = macroText;
        PlayCount = count;
        AssignToHotkey = _assignHotkeyCheckBox?.IsChecked == true;
        AssignedHotkey = AssignToHotkey
            ? NormalizeHotkey(_hotkeyCombo?.SelectedItem as string)
            : string.Empty;

        return true;
    }

    private void ClearMessages()
    {
        _errorText.Text = string.Empty;
        _errorText.IsVisible = false;
        _statusText.Text = string.Empty;
        _statusText.IsVisible = false;
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

    private void FocusCountTextBox()
    {
        Dispatcher.UIThread.Post(() =>
        {
            _countTextBox.Focus(NavigationMethod.Tab);
            _countTextBox.SelectAll();
        }, DispatcherPriority.Input);
    }

    private void UpdateHotkeyUi()
    {
        if (_assignHotkeyCheckBox == null || _hotkeyCombo == null || _hotkeyHint == null)
            return;

        bool assign = _assignHotkeyCheckBox.IsChecked == true;
        _hotkeyCombo.IsEnabled = assign;

        string hotkey = NormalizeHotkey(_hotkeyCombo.SelectedItem as string);
        AppPreferences.MacroBinding? existing = _existingBindings
            .LastOrDefault(binding =>
                string.Equals(NormalizeHotkey(binding.Hotkey), hotkey, StringComparison.OrdinalIgnoreCase) &&
                !string.IsNullOrWhiteSpace(binding.Macro));

        _hotkeyHint.Text = existing == null
            ? $"Save this macro to {hotkey} for one-touch playback."
            : $"{hotkey} already has a saved macro and will be replaced.";
        _hotkeyHint.IsVisible = assign;
    }

    private string GetSuggestedHotkey()
    {
        HashSet<string> usedHotkeys = _existingBindings
            .Where(binding => !string.IsNullOrWhiteSpace(binding.Macro))
            .Select(binding => NormalizeHotkey(binding.Hotkey))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return TerminalControl.SupportedMacroHotkeys
            .FirstOrDefault(hotkey => !usedHotkeys.Contains(hotkey)) ?? "F1";
    }

    private static string NormalizeHotkey(string? hotkey)
    {
        string candidate = string.IsNullOrWhiteSpace(hotkey) ? "F1" : hotkey.Trim().ToUpperInvariant();
        return TerminalControl.SupportedMacroHotkeys.Contains(candidate, StringComparer.OrdinalIgnoreCase)
            ? candidate
            : "F1";
    }
}
