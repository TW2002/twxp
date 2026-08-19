using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Threading;
using Core = TWXProxy.Core;

namespace MTC;

internal sealed class ScriptDebuggerWindow : Window
{
    private static readonly IBrush WindowBackground = new SolidColorBrush(Color.FromRgb(18, 20, 24));
    private static readonly IBrush PanelBackground = new SolidColorBrush(Color.FromRgb(27, 30, 36));
    private static readonly IBrush PanelBorder = new SolidColorBrush(Color.FromRgb(61, 69, 84));
    private static readonly IBrush SelectedBackground = new SolidColorBrush(Color.FromRgb(22, 59, 89));
    private static readonly IBrush SelectedBorder = new SolidColorBrush(Color.FromRgb(53, 148, 218));
    private static readonly IBrush SubtleText = new SolidColorBrush(Color.FromRgb(173, 183, 196));
    private static readonly IBrush AccentText = new SolidColorBrush(Color.FromRgb(122, 218, 255));
    private static readonly IBrush TitleText = new SolidColorBrush(Color.FromRgb(241, 244, 248));
    private static readonly IBrush RunningBrush = new SolidColorBrush(Color.FromRgb(61, 199, 120));
    private static readonly IBrush PausedBrush = new SolidColorBrush(Color.FromRgb(241, 181, 66));
    private static readonly IBrush BotBrush = new SolidColorBrush(Color.FromRgb(192, 143, 255));
    private static readonly IBrush SystemBrush = new SolidColorBrush(Color.FromRgb(255, 122, 122));
    private static readonly IBrush ButtonBackground = new SolidColorBrush(Color.FromRgb(42, 47, 57));

    private readonly Func<Core.ModInterpreter?> _interpreterProvider;
    private readonly Func<string> _gameNameProvider;
    private readonly Func<int, bool> _pauseAction;
    private readonly Func<int, bool> _resumeAction;
    private readonly DispatcherTimer _refreshTimer;
    private readonly StackPanel _scriptRows;
    private readonly TextBlock _selectionSummary;
    private readonly TextBox _overviewText;
    private readonly TextBox _variablesText;
    private readonly TextBox _triggersText;
    private int? _selectedScriptId;
    private string _selectedReference = string.Empty;

    public ScriptDebuggerWindow(
        Func<Core.ModInterpreter?> interpreterProvider,
        Func<string> gameNameProvider,
        Func<int, bool> pauseAction,
        Func<int, bool> resumeAction)
    {
        _interpreterProvider = interpreterProvider;
        _gameNameProvider = gameNameProvider;
        _pauseAction = pauseAction;
        _resumeAction = resumeAction;

        Width = 1080;
        Height = 760;
        MinWidth = 840;
        MinHeight = 540;
        Background = WindowBackground;

        _selectionSummary = new TextBlock
        {
            Foreground = AccentText,
            FontSize = 14,
            FontWeight = FontWeight.SemiBold,
            Margin = new Thickness(0, 0, 0, 8),
        };

        _scriptRows = new StackPanel
        {
            Spacing = 8,
        };

        var scriptsPane = new Border
        {
            Background = PanelBackground,
            BorderBrush = PanelBorder,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(12),
            Child = new StackPanel
            {
                Spacing = 10,
                Children =
                {
                    new TextBlock
                    {
                        Text = "Running Scripts",
                        Foreground = TitleText,
                        FontSize = 16,
                        FontWeight = FontWeight.Bold,
                    },
                    new TextBlock
                    {
                        Text = "Select a script to inspect it live. Pause freezes that script in place without stopping it.",
                        Foreground = SubtleText,
                        TextWrapping = TextWrapping.Wrap,
                    },
                    new ScrollViewer
                    {
                        MaxHeight = 220,
                        VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                        Content = _scriptRows,
                    }
                }
            }
        };

        _overviewText = BuildViewer();
        _variablesText = BuildViewer();
        _triggersText = BuildViewer();

        var tabs = new TabControl
        {
            ItemsSource = new object[]
            {
                new TabItem { Header = "Overview", Content = _overviewText },
                new TabItem { Header = "Variables", Content = _variablesText },
                new TabItem { Header = "Triggers", Content = _triggersText },
            }
        };

        var detailsPane = new Border
        {
            Background = PanelBackground,
            BorderBrush = PanelBorder,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(12),
            Child = new Grid
            {
                RowDefinitions = new RowDefinitions("Auto,*"),
                Children =
                {
                    _selectionSummary,
                    tabs,
                }
            }
        };
        Grid.SetRow(_selectionSummary, 0);
        Grid.SetRow(tabs, 1);

        Content = new Grid
        {
            Margin = new Thickness(14),
            RowDefinitions = new RowDefinitions("Auto,*"),
            Children =
            {
                scriptsPane,
                detailsPane,
            }
        };
        Grid.SetRow(scriptsPane, 0);
        Grid.SetRow(detailsPane, 1);

        _refreshTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(500) };
        _refreshTimer.Tick += (_, _) => Refresh();

        Opened += (_, _) =>
        {
            Refresh();
            _refreshTimer.Start();
        };
        Closed += (_, _) => _refreshTimer.Stop();
    }

    private static TextBox BuildViewer()
    {
        var textBox = new TextBox
        {
            IsReadOnly = true,
            AcceptsReturn = true,
            TextWrapping = TextWrapping.NoWrap,
            FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace"),
            FontSize = 13,
            Background = new SolidColorBrush(Color.FromRgb(14, 16, 19)),
            Foreground = Brushes.Gainsboro,
            BorderBrush = PanelBorder,
            MinHeight = 0,
            HorizontalAlignment = HorizontalAlignment.Stretch,
            VerticalAlignment = VerticalAlignment.Stretch,
        };
        ScrollViewer.SetVerticalScrollBarVisibility(textBox, ScrollBarVisibility.Auto);
        ScrollViewer.SetHorizontalScrollBarVisibility(textBox, ScrollBarVisibility.Auto);
        return textBox;
    }

    private void Refresh()
    {
        string gameName = _gameNameProvider();
        Title = string.IsNullOrWhiteSpace(gameName)
            ? "Script Debugger"
            : $"Script Debugger - {gameName}";

        Core.ModInterpreter? interpreter = _interpreterProvider();
        IReadOnlyList<Core.RunningScriptInfo> runningScripts = Core.ProxyGameOperations.GetRunningScripts(interpreter);

        Core.RunningScriptInfo? selectedScript = ResolveSelection(runningScripts);
        _selectedScriptId = selectedScript?.Id;
        _selectedReference = selectedScript?.Reference ?? string.Empty;

        RebuildScriptRows(runningScripts, selectedScript?.Id);
        RenderSnapshot(selectedScript is null
            ? null
            : Core.ProxyGameOperations.GetScriptDebuggerSnapshot(interpreter, selectedScript.Id));
    }

    private Core.RunningScriptInfo? ResolveSelection(IReadOnlyList<Core.RunningScriptInfo> runningScripts)
    {
        if (runningScripts.Count == 0)
            return null;

        Core.RunningScriptInfo? selectedScript = null;
        if (!string.IsNullOrWhiteSpace(_selectedReference))
        {
            selectedScript = runningScripts.FirstOrDefault(script =>
                string.Equals(script.Reference, _selectedReference, StringComparison.OrdinalIgnoreCase));
        }

        if (selectedScript == null && _selectedScriptId.HasValue)
        {
            selectedScript = runningScripts.FirstOrDefault(script => script.Id == _selectedScriptId.Value);
        }

        return selectedScript ?? runningScripts[0];
    }

    private void RebuildScriptRows(IReadOnlyList<Core.RunningScriptInfo> runningScripts, int? selectedId)
    {
        _scriptRows.Children.Clear();

        if (runningScripts.Count == 0)
        {
            _scriptRows.Children.Add(new Border
            {
                Background = new SolidColorBrush(Color.FromRgb(20, 23, 29)),
                BorderBrush = PanelBorder,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(8),
                Padding = new Thickness(12),
                Child = new TextBlock
                {
                    Text = "No scripts are running.",
                    Foreground = SubtleText,
                }
            });
            return;
        }

        foreach (Core.RunningScriptInfo script in runningScripts)
        {
            bool isSelected = selectedId == script.Id;
            var selectButton = new Button
            {
                HorizontalAlignment = HorizontalAlignment.Stretch,
                HorizontalContentAlignment = HorizontalAlignment.Left,
                Background = Brushes.Transparent,
                BorderThickness = new Thickness(0),
                Padding = new Thickness(0),
                Content = BuildScriptSummary(script),
            };
            selectButton.Click += (_, _) =>
            {
                _selectedScriptId = script.Id;
                _selectedReference = script.Reference;
                Refresh();
            };

            var pauseButton = BuildActionButton("Pause", !script.Paused);
            pauseButton.Click += (_, _) =>
            {
                _pauseAction(script.Id);
                Refresh();
            };

            var resumeButton = BuildActionButton("Resume", script.Paused);
            resumeButton.Click += (_, _) =>
            {
                _resumeAction(script.Id);
                Refresh();
            };

            var rowGrid = new Grid
            {
                ColumnDefinitions = new ColumnDefinitions("*,Auto,Auto"),
                ColumnSpacing = 8,
                VerticalAlignment = VerticalAlignment.Center,
            };
            Grid.SetColumn(selectButton, 0);
            Grid.SetColumn(pauseButton, 1);
            Grid.SetColumn(resumeButton, 2);
            rowGrid.Children.Add(selectButton);
            rowGrid.Children.Add(pauseButton);
            rowGrid.Children.Add(resumeButton);

            _scriptRows.Children.Add(new Border
            {
                Background = isSelected ? SelectedBackground : new SolidColorBrush(Color.FromRgb(20, 23, 29)),
                BorderBrush = isSelected ? SelectedBorder : PanelBorder,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(8),
                Padding = new Thickness(10, 8),
                Child = rowGrid,
            });
        }
    }

    private static Button BuildActionButton(string label, bool isEnabled) => new()
    {
        Content = label,
        IsEnabled = isEnabled,
        MinWidth = 74,
        Padding = new Thickness(10, 6),
        Background = ButtonBackground,
        Foreground = Brushes.Gainsboro,
        BorderBrush = PanelBorder,
    };

    private static Control BuildScriptSummary(Core.RunningScriptInfo script)
    {
        var meta = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 8,
            Children =
            {
                BuildBadge(script.Paused ? "Paused" : "Running", script.Paused ? PausedBrush : RunningBrush),
            }
        };

        if (script.IsSystemScript)
            meta.Children.Add(BuildBadge("System", SystemBrush));
        if (script.IsBot)
            meta.Children.Add(BuildBadge("Bot", BotBrush));

        return new StackPanel
        {
            Spacing = 3,
            Children =
            {
                new TextBlock
                {
                    Text = script.Name,
                    Foreground = TitleText,
                    FontSize = 14,
                    FontWeight = FontWeight.SemiBold,
                },
                new TextBlock
                {
                    Text = script.Reference,
                    Foreground = SubtleText,
                    FontSize = 12,
                    TextWrapping = TextWrapping.NoWrap,
                    TextTrimming = TextTrimming.CharacterEllipsis,
                },
                meta,
            }
        };
    }

    private static Border BuildBadge(string text, IBrush foreground) => new()
    {
        Background = new SolidColorBrush(Color.FromArgb(35, 255, 255, 255)),
        BorderBrush = new SolidColorBrush(Color.FromArgb(45, 255, 255, 255)),
        BorderThickness = new Thickness(1),
        CornerRadius = new CornerRadius(999),
        Padding = new Thickness(8, 2),
        Child = new TextBlock
        {
            Text = text,
            Foreground = foreground,
            FontSize = 11,
            FontWeight = FontWeight.SemiBold,
        }
    };

    private void RenderSnapshot(Core.ScriptDebuggerSnapshot? snapshot)
    {
        if (snapshot == null)
        {
            _selectionSummary.Text = "No script selected";
            _overviewText.Text = "No running script is currently selected.";
            _variablesText.Text = "No variables to display.";
            _triggersText.Text = "No triggers to display.";
            return;
        }

        _selectionSummary.Text = $"{snapshot.Name}  {(snapshot.IsSystemScript ? "[system]" : string.Empty)}{(snapshot.IsBot ? " [bot]" : string.Empty)}".Trim();
        _overviewText.Text = BuildOverviewText(snapshot);
        _variablesText.Text = BuildVariablesText(snapshot.Variables);
        _triggersText.Text = BuildTriggersText(snapshot.Triggers);
    }

    private static string BuildOverviewText(Core.ScriptDebuggerSnapshot snapshot)
    {
        var lines = new List<string>
        {
            $"Name:               {snapshot.Name}",
            $"Reference:          {snapshot.Reference}",
            $"Paused:             {snapshot.Paused}",
            $"Pause Reason:       {snapshot.PauseReason}",
            $"Waiting For Input:  {snapshot.WaitingForInput}",
            $"Waiting For Auth:   {snapshot.WaitingForAuth}",
            $"waitFor/waitOn:     {snapshot.WaitForActive}",
            $"Keypress Mode:      {snapshot.KeypressMode}",
            $"Substack Depth:     {snapshot.SubStackDepth}",
            $"Wait Text:          {snapshot.WaitText}",
            $"Last Exec Ticks:    {snapshot.LastExecutionTicks}",
            $"Last Cmd Count:     {snapshot.LastExecutionCommandCount}",
            $"Last Param Count:   {snapshot.LastExecutionResolvedParamCount}",
            $"Prepared VM:        {snapshot.LastExecutionUsedPrepared}",
            $"Exec Completed:     {snapshot.LastExecutionCompleted}",
            $"Variable Count:     {snapshot.Variables.Count}",
            $"Trigger Count:      {snapshot.Triggers.Count}",
        };

        return string.Join(Environment.NewLine, lines);
    }

    private static string BuildVariablesText(IReadOnlyList<Core.ScriptVariableInfo> variables)
    {
        if (variables.Count == 0)
            return "No variables found.";

        var builder = new StringBuilder();
        foreach (Core.ScriptVariableInfo variable in variables)
        {
            string indent = new string(' ', variable.Depth * 2);
            string marker = variable.HasChildren ? "▸ " : "  ";
            builder.Append(indent)
                .Append(marker)
                .Append(variable.Name)
                .Append(" = ")
                .AppendLine(variable.Value);
        }

        return builder.ToString();
    }

    private static string BuildTriggersText(IReadOnlyList<Core.ScriptTriggerInfo> triggers)
    {
        if (triggers.Count == 0)
            return "No active triggers.";

        var builder = new StringBuilder();
        foreach (IGrouping<Core.TriggerType, Core.ScriptTriggerInfo> group in triggers.GroupBy(trigger => trigger.Type))
        {
            builder.AppendLine(group.Key.ToString());
            foreach (Core.ScriptTriggerInfo trigger in group)
            {
                builder.Append("  ")
                    .Append(trigger.Name)
                    .Append(" => ")
                    .Append(trigger.Value);

                if (!string.IsNullOrWhiteSpace(trigger.LabelName))
                    builder.Append(" | label: ").Append(trigger.LabelName);
                if (!string.IsNullOrWhiteSpace(trigger.Response))
                    builder.Append(" | response: ").Append(trigger.Response);
                if (!string.IsNullOrWhiteSpace(trigger.Param))
                    builder.Append(" | param: ").Append(trigger.Param);
                if (trigger.LifeCycle != 0)
                    builder.Append(" | life: ").Append(trigger.LifeCycle);

                builder.AppendLine();
            }

            builder.AppendLine();
        }

        return builder.ToString().TrimEnd();
    }
}
