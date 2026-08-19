using System.Collections.Generic;
using System.Linq;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;
using Core = TWXProxy.Core;

namespace MTC;

public class AdvancedProxySettingsDialog : Window
{
    private sealed class HaggleModeOption
    {
        public string Value { get; }
        public string Label { get; }
        public bool IsBuiltIn { get; }

        public HaggleModeOption(string value, string label, bool isBuiltIn)
        {
            Value = value;
            Label = label;
            IsBuiltIn = isBuiltIn;
        }

        public override string ToString() => Label;
    }

    private static readonly IBrush BgPanel  = new SolidColorBrush(Color.FromRgb(30, 30, 30));
    private static readonly IBrush BgInput  = new SolidColorBrush(Color.FromRgb(20, 20, 20));
    private static readonly IBrush BdInput  = new SolidColorBrush(Color.FromRgb(70, 70, 70));
    private static readonly IBrush FgNormal = new SolidColorBrush(Color.FromRgb(170, 170, 170));
    private static readonly IBrush BgButton = new SolidColorBrush(Color.FromRgb(55, 55, 55));

    public string SelectedPortHaggleMode { get; private set; }
    public string SelectedPlanetHaggleMode { get; private set; }

    public AdvancedProxySettingsDialog(
        string currentPortHaggleMode,
        string currentPlanetHaggleMode,
        IReadOnlyList<Core.NativeHaggleModeInfo>? availablePortModes = null,
        IReadOnlyList<Core.NativeHaggleModeInfo>? availablePlanetModes = null)
    {
        Title = "Advanced Proxy Settings";
        Width = 520;
        SizeToContent = SizeToContent.Height;
        CanResize = false;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = BgPanel;

        var portHaggleOptions = (availablePortModes ?? Core.NativeHaggleModes.BuiltInModes
                .Where(info => info.SupportsPortTrades && !ShouldHideFromNormalMenu(info))
                .ToList())
            .Select(info => new HaggleModeOption(info.Id, info.DisplayName, info.IsBuiltIn))
            .ToList();

        var portHaggleCombo = new ComboBox
        {
            ItemsSource = portHaggleOptions,
            SelectedItem = portHaggleOptions.Find(option =>
                string.Equals(option.Value, Core.NativeHaggleModes.Normalize(currentPortHaggleMode), StringComparison.OrdinalIgnoreCase)),
            Background = BgInput,
            Foreground = FgNormal,
            HorizontalAlignment = HorizontalAlignment.Stretch,
        };
        if (portHaggleCombo.SelectedItem == null)
            portHaggleCombo.SelectedIndex = 0;

        var planetHaggleOptions = (availablePlanetModes ?? Core.NativeHaggleModes.BuiltInModes
                .Where(info => info.SupportsPlanetTrades)
                .ToList())
            .Select(info => new HaggleModeOption(info.Id, info.DisplayName, info.IsBuiltIn))
            .ToList();

        var planetHaggleCombo = new ComboBox
        {
            ItemsSource = planetHaggleOptions,
            SelectedItem = planetHaggleOptions.Find(option =>
                string.Equals(option.Value, Core.NativeHaggleModes.Normalize(currentPlanetHaggleMode), StringComparison.OrdinalIgnoreCase)),
            Background = BgInput,
            Foreground = FgNormal,
            HorizontalAlignment = HorizontalAlignment.Stretch,
        };
        if (planetHaggleCombo.SelectedItem == null)
            planetHaggleCombo.SelectedIndex = 0;

        var portHaggleRow = BuildRow("Port Haggle:", portHaggleCombo);
        var planetHaggleRow = BuildRow("Planet Haggle:", planetHaggleCombo);

        var btnSave = new Button
        {
            Content = "Save",
            MinWidth = 80,
            Background = BgButton,
            Foreground = FgNormal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Margin = new Thickness(0, 0, 8, 0),
        };

        var btnCancel = new Button
        {
            Content = "Cancel",
            MinWidth = 80,
            Background = BgButton,
            Foreground = FgNormal,
        };

        btnSave.Click += (_, _) =>
        {
            SelectedPortHaggleMode = (portHaggleCombo.SelectedItem as HaggleModeOption)?.Value ?? Core.NativeHaggleModes.Default;
            SelectedPlanetHaggleMode = (planetHaggleCombo.SelectedItem as HaggleModeOption)?.Value ?? Core.NativeHaggleModes.DefaultPlanet;
            Close(true);
        };

        btnCancel.Click += (_, _) => Close(false);

        var buttons = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Margin = new Thickness(0, 12, 0, 0),
            Children = { btnSave, btnCancel },
        };

        SelectedPortHaggleMode = Core.NativeHaggleModes.Normalize(currentPortHaggleMode);
        SelectedPlanetHaggleMode = Core.NativeHaggleModes.Normalize(currentPlanetHaggleMode);

        Content = new StackPanel
        {
            Margin = new Thickness(16),
            Spacing = 4,
            Children = { portHaggleRow, planetHaggleRow, buttons },
        };
    }

    private static bool ShouldHideFromNormalMenu(Core.NativeHaggleModeInfo info)
        => string.Equals(info.Id, Core.NativeHaggleModes.Baseline, StringComparison.OrdinalIgnoreCase);

    private static StackPanel BuildRow(string label, Control input)
    {
        var lbl = new TextBlock
        {
            Text = label,
            Foreground = new SolidColorBrush(Color.FromRgb(200, 200, 200)),
            Margin = new Thickness(0, 0, 0, 3),
        };

        if (input is ComboBox comboBox)
            comboBox.BorderBrush = BdInput;

        return new StackPanel
        {
            Spacing = 2,
            Margin = new Thickness(0, 4, 0, 4),
            Children = { lbl, input },
        };
    }
}
