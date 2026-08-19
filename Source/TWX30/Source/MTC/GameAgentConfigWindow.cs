using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;

namespace MTC;

internal sealed class GameAgentConfigWindow : Window
{
    private static readonly IBrush BgWindow = new SolidColorBrush(Color.FromRgb(5, 24, 30));
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(8, 45, 56));
    private static readonly IBrush BgInput = new SolidColorBrush(Color.FromRgb(4, 22, 28));
    private static readonly IBrush BdInput = new SolidColorBrush(Color.FromRgb(9, 126, 149));
    private static readonly IBrush FgNormal = new SolidColorBrush(Color.FromRgb(230, 243, 246));
    private static readonly IBrush FgMuted = new SolidColorBrush(Color.FromRgb(150, 198, 209));
    private static readonly IBrush FgLabel = new SolidColorBrush(Color.FromRgb(0, 239, 239));
    private static readonly IBrush BgButton = new SolidColorBrush(Color.FromRgb(10, 93, 109));
    private static readonly IBrush BgButtonSoft = new SolidColorBrush(Color.FromRgb(9, 63, 76));
    private static readonly IBrush AccentBorder = new SolidColorBrush(Color.FromRgb(18, 214, 214));

    private readonly AppPreferences _preferences;
    private readonly ComboBox _providerCombo;
    private readonly TextBox _connectionBox;
    private readonly ComboBox _modelCombo;
    private readonly ComboBox _contextCombo;
    private readonly TextBlock _connectionLabel;
    private readonly TextBlock _statusText;

    public GameAgentConfigWindow(AppPreferences preferences)
    {
        _preferences = preferences;

        Title = "Configure Game Agent";
        Width = 620;
        Height = 390;
        MinWidth = 560;
        MinHeight = 340;
        Background = BgWindow;
        FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace");

        _providerCombo = BuildCombo(220);
        _providerCombo.ItemsSource = GameAgentProviders.Choices;
        _providerCombo.SelectedItem = GameAgentProviders.Find(_preferences.GameAgentProvider);
        _providerCombo.SelectionChanged += (_, _) => _ = OnProviderChangedAsync();

        _connectionBox = BuildTextBox();
        _connectionLabel = BuildLabel("Port");

        _modelCombo = BuildCombo(320);

        _contextCombo = BuildCombo(160);
        _contextCombo.ItemsSource = BuildContextLimitChoices();
        _contextCombo.SelectedItem = FindContextLimitChoice(_preferences.GameAgentContextLimitCharacters);

        var refreshButton = BuildActionButton("Refresh", primary: false);
        refreshButton.Click += async (_, _) => await RefreshModelsAsync();

        var saveButton = BuildActionButton("Save", primary: true);
        saveButton.Click += (_, _) =>
        {
            SaveToPreferences();
            Close(true);
        };

        var cancelButton = BuildActionButton("Cancel", primary: false);
        cancelButton.Click += (_, _) => Close(false);

        _statusText = new TextBlock
        {
            Foreground = FgMuted,
            TextWrapping = TextWrapping.Wrap,
        };

        var form = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("130,*"),
            RowDefinitions = new RowDefinitions("Auto,Auto,Auto,Auto,Auto,Auto"),
            ColumnSpacing = 12,
            RowSpacing = 12,
        };

        form.Children.Add(BuildLabel("Provider").WithColumn(0).WithRow(0));
        form.Children.Add(_providerCombo.WithColumn(1).WithRow(0));
        form.Children.Add(_connectionLabel.WithColumn(0).WithRow(1));
        form.Children.Add(_connectionBox.WithColumn(1).WithRow(1));
        form.Children.Add(BuildLabel("Model").WithColumn(0).WithRow(2));
        form.Children.Add(new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("*,16,120"),
            Children =
            {
                _modelCombo.WithColumn(0),
                refreshButton.WithColumn(2),
            },
        }.WithColumn(1).WithRow(2));
        form.Children.Add(BuildLabel("Max Context").WithColumn(0).WithRow(3));
        form.Children.Add(_contextCombo.WithColumn(1).WithRow(3));
        form.Children.Add(_statusText.WithColumn(0).WithRow(5));
        Grid.SetColumnSpan(_statusText, 2);

        var buttons = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Spacing = 8,
            Children = { cancelButton, saveButton },
        };

        Content = new Border
        {
            Margin = new Thickness(16),
            Padding = new Thickness(18),
            Background = BgPanel,
            BorderBrush = AccentBorder,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(12),
            Child = new StackPanel
            {
                Spacing = 16,
                Children = { form, buttons },
            },
        };

        LoadProviderValues();
        Opened += async (_, _) => await RefreshModelsOnOpenAsync();
    }

    private async System.Threading.Tasks.Task OnProviderChangedAsync()
    {
        LoadProviderValues();
        GameAgentProviderChoice provider = GetSelectedProvider();
        if (provider.UsesApiKey)
            return;

        await RefreshModelsAsync();
    }

    private async System.Threading.Tasks.Task RefreshModelsOnOpenAsync()
    {
        GameAgentProviderChoice provider = GetSelectedProvider();
        if (provider.UsesApiKey)
            return;

        await RefreshModelsAsync();
    }

    private void LoadProviderValues()
    {
        GameAgentProviderChoice provider = GetSelectedProvider();
        _connectionLabel.Text = provider.UsesApiKey ? "API Key" : "Port";
        _connectionLabel.IsVisible = provider.UsesPort || provider.UsesApiKey;
        _connectionBox.IsVisible = provider.UsesPort || provider.UsesApiKey;
        _connectionBox.PasswordChar = provider.UsesApiKey ? '*' : '\0';

        _connectionBox.Text = provider.Id switch
        {
            "ollama" => AppPreferences.NormalizeGameAgentPort(_preferences.GameAgentOllamaPort, provider.DefaultPort).ToString(),
            "lmstudio" => AppPreferences.NormalizeGameAgentPort(_preferences.GameAgentLmStudioPort, provider.DefaultPort).ToString(),
            "openai" => _preferences.GameAgentOpenAiApiKey,
            "anthropic" => _preferences.GameAgentAnthropicApiKey,
            _ => string.Empty,
        };

        string saved = ResolveProviderModel(provider.Id);
        _modelCombo.ItemsSource = string.IsNullOrWhiteSpace(saved) ? [] : new[] { saved };
        _modelCombo.SelectedIndex = string.IsNullOrWhiteSpace(saved) ? -1 : 0;
        _modelCombo.IsEnabled = provider.Id != "local";
        _statusText.Text = provider.Id switch
        {
            "local" => "Local observer does not use external model settings.",
            "openai" or "anthropic" when string.IsNullOrWhiteSpace(_connectionBox.Text) =>
                $"Enter a {provider.Label} API key, then click Refresh to load models.",
            _ => string.Empty,
        };
    }

    private async System.Threading.Tasks.Task RefreshModelsAsync()
    {
        GameAgentProviderChoice provider = GetSelectedProvider();
        if (provider.Id == "local")
            return;
        if (provider.UsesApiKey && string.IsNullOrWhiteSpace(_connectionBox.Text))
        {
            _statusText.Text = $"Enter a {provider.Label} API key before refreshing models.";
            return;
        }

        string selected = _modelCombo.SelectedItem?.ToString() ?? ResolveProviderModel(provider.Id);
        try
        {
            _statusText.Text = $"Loading {provider.Label} models...";
            IReadOnlyList<string> models = await GameAgentProviders.GetAvailableModelsAsync(BuildProviderConfig(provider), CancellationToken.None);
            if (models.Count == 0)
            {
                _statusText.Text = $"{provider.Label} returned no models.";
                return;
            }

            _modelCombo.ItemsSource = models;
            _modelCombo.SelectedItem = models.Contains(selected, StringComparer.OrdinalIgnoreCase)
                ? models.First(model => string.Equals(model, selected, StringComparison.OrdinalIgnoreCase))
                : models[0];
            _statusText.Text = $"Loaded {models.Count} {provider.Label} model(s).";
        }
        catch (Exception ex)
        {
            _statusText.Text = $"{provider.Label} model list unavailable: {ex.Message}";
        }
    }

    private void SaveToPreferences()
    {
        GameAgentProviderChoice provider = GetSelectedProvider();
        _preferences.GameAgentProvider = provider.Id;
        if (provider.Id == "lmstudio")
            _preferences.GameAgentLmStudioPort = ReadPort(provider.DefaultPort);
        if (provider.Id == "ollama")
            _preferences.GameAgentOllamaPort = ReadPort(provider.DefaultPort);
        if (provider.Id == "openai")
            _preferences.GameAgentOpenAiApiKey = _connectionBox.Text?.Trim() ?? string.Empty;
        if (provider.Id == "anthropic")
            _preferences.GameAgentAnthropicApiKey = _connectionBox.Text?.Trim() ?? string.Empty;
        _preferences.GameAgentContextLimitCharacters = _contextCombo.SelectedItem is ContextLimitChoice context
            ? context.Characters
            : 16384;

        string model = _modelCombo.SelectedItem?.ToString()?.Trim() ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(model))
            _preferences.GameAgentProviderModels[provider.Id] = model;
        _preferences.Save();
    }

    private GameAgentProviderConfig BuildProviderConfig(GameAgentProviderChoice provider)
        => new()
        {
            Provider = provider.Id,
            Model = _modelCombo.SelectedItem?.ToString() ?? ResolveProviderModel(provider.Id),
            Port = ReadPort(provider.DefaultPort),
            ApiKey = provider.Id switch
            {
                "openai" or "anthropic" => _connectionBox.Text?.Trim() ?? string.Empty,
                _ => string.Empty,
            },
        };

    private GameAgentProviderChoice GetSelectedProvider()
        => _providerCombo.SelectedItem as GameAgentProviderChoice ?? GameAgentProviders.Choices[0];

    private int ReadPort(int fallback)
        => int.TryParse(_connectionBox.Text, out int port)
            ? AppPreferences.NormalizeGameAgentPort(port, fallback)
            : fallback;

    private string ResolveProviderModel(string provider)
    {
        provider = AppPreferences.NormalizeGameAgentProvider(provider);
        if (_preferences.GameAgentProviderModels.TryGetValue(provider, out string? model) &&
            !string.IsNullOrWhiteSpace(model))
            return model.Trim();

        return provider switch
        {
            "ollama" => "llama3.1",
            "openai" => "gpt-4o-mini",
            "anthropic" => "claude-sonnet-4-5",
            "local" => "local-observer",
            _ => "local-model",
        };
    }

    private static IReadOnlyList<ContextLimitChoice> BuildContextLimitChoices()
    {
        var choices = new List<ContextLimitChoice>();
        for (int value = 16384; value <= 262144; value += 16384)
            choices.Add(new ContextLimitChoice(value));
        return choices;
    }

    private static ContextLimitChoice FindContextLimitChoice(int characters)
        => new(AppPreferences.NormalizeGameAgentContextLimit(characters));

    private static TextBlock BuildLabel(string text)
        => new()
        {
            Text = text,
            Foreground = FgLabel,
            VerticalAlignment = VerticalAlignment.Center,
        };

    private static TextBox BuildTextBox()
        => new()
        {
            HorizontalAlignment = HorizontalAlignment.Stretch,
            Background = BgInput,
            Foreground = FgNormal,
            BorderBrush = BdInput,
            Padding = new Thickness(6),
            CaretBrush = FgLabel,
        };

    private static ComboBox BuildCombo(double width)
        => new()
        {
            MinWidth = width,
            MaxWidth = width == 320 ? 560 : double.PositiveInfinity,
            HorizontalAlignment = HorizontalAlignment.Stretch,
            Background = BgInput,
            Foreground = FgNormal,
            BorderBrush = BdInput,
            Padding = new Thickness(6),
        };

    private static Button BuildActionButton(string text, bool primary)
        => new()
        {
            Content = text,
            MinWidth = 110,
            Height = 34,
            Background = primary ? BgButton : BgButtonSoft,
            BorderBrush = primary ? AccentBorder : BdInput,
            Foreground = FgNormal,
            CornerRadius = new CornerRadius(8),
            Padding = new Thickness(14, 4),
        };

    private sealed class ContextLimitChoice
    {
        public ContextLimitChoice(int characters)
        {
            Characters = characters;
        }

        public int Characters { get; }

        public override string ToString()
            => $"{Characters / 1024} KB";

        public override bool Equals(object? obj)
            => obj is ContextLimitChoice other && Characters == other.Characters;

        public override int GetHashCode()
            => Characters;
    }
}
