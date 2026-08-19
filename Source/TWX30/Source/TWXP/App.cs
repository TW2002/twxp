using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Styling;
using Avalonia.Threading;
using Avalonia.Themes.Fluent;
using TWXProxy.Core;

namespace TWXP;

public class App : Application
{
    public override void Initialize()
    {
        Name = "TWXP";
        Styles.Add(new FluentTheme());
        RequestedThemeVariant = ThemeVariant.Dark;
        GlobalModules.ScriptWindowFactory = new AvaloniaScriptWindowFactory();
        GlobalModules.PanelOverlay = null;
    }

    public override void OnFrameworkInitializationCompleted()
    {
        Dispatcher.UIThread.UnhandledException += (_, e) =>
        {
            try
            {
                GlobalModules.DebugLog($"[UIUnhandledException] {e.Exception}\n");
            }
            catch
            {
            }
        };

        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
            desktop.MainWindow = new MainWindow();

        base.OnFrameworkInitializationCompleted();
    }
}
