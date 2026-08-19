using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;

namespace TWXP;

internal static class DialogHelpers
{
    public static async Task ShowMessageAsync(Window owner, string title, string message)
    {
        var okButton = new Button
        {
            Content = "OK",
            MinWidth = 110,
            HorizontalAlignment = HorizontalAlignment.Center,
        };

        var dialog = CreateDialog(title, message, okButton);
        okButton.Click += (_, _) => dialog.Close();
        await dialog.ShowDialog(owner);
    }

    public static async Task<bool> ShowConfirmAsync(
        Window owner,
        string title,
        string message,
        string yesText,
        string noText)
    {
        bool result = false;
        var yesButton = new Button { Content = yesText, MinWidth = 110 };
        var noButton = new Button { Content = noText, MinWidth = 110 };

        var buttons = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 10,
            HorizontalAlignment = HorizontalAlignment.Center,
            Children = { yesButton, noButton },
        };

        var dialog = CreateDialog(title, message, buttons);
        yesButton.Click += (_, _) =>
        {
            result = true;
            dialog.Close();
        };
        noButton.Click += (_, _) =>
        {
            result = false;
            dialog.Close();
        };

        await dialog.ShowDialog(owner);
        return result;
    }

    private static Window CreateDialog(string title, string message, Control buttonRow)
    {
        return new Window
        {
            Title = title,
            Width = 540,
            Height = 230,
            MinWidth = 420,
            MinHeight = 200,
            CanResize = false,
            WindowStartupLocation = WindowStartupLocation.CenterOwner,
            Content = new StackPanel
            {
                Margin = new Thickness(20),
                Spacing = 18,
                Children =
                {
                    new TextBlock
                    {
                        Text = message,
                        TextWrapping = TextWrapping.Wrap,
                    },
                    buttonRow,
                },
            },
        };
    }
}
