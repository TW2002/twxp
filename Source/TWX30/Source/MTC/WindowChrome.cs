using System;
using System.Collections;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using Avalonia;
using Avalonia.Platform;
using Avalonia.Platform.Storage;
using SkiaSharp;
using Avalonia.Controls;
using Avalonia.Controls.Documents;
using Avalonia.Controls.Primitives;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Media.Imaging;
using Avalonia.Threading;
using Core = TWXProxy.Core;

namespace MTC;

public partial class MainWindow
{
    private static string NormalizeLegacyInterrogLineForScripts(string line)
    {
        if (string.IsNullOrEmpty(line) || line[0] != ':')
            return line;

        int index = 1;
        while (index < line.Length && char.IsWhiteSpace(line[index]))
            index++;

        if (index >= line.Length)
            return line;

        ReadOnlySpan<char> tail = line.AsSpan(index);
        if (tail.StartsWith("FM >", StringComparison.Ordinal) ||
            tail.StartsWith("TO >", StringComparison.Ordinal) ||
            tail.StartsWith("The shortest path (", StringComparison.Ordinal))
        {
            return line[index..];
        }

        return line;
    }

    private static bool NormalizeDensityScanner(bool densityScanner, bool holoScanner)
        => densityScanner || holoScanner;

    private static readonly IBrush HudText      = new SolidColorBrush(Color.FromRgb(222, 238, 242));
    private static readonly IBrush HudMuted     = new SolidColorBrush(Color.FromRgb(126, 170, 180));
    private static readonly IBrush HudEdge      = new SolidColorBrush(Color.FromRgb(57, 112, 128));
    private static readonly IBrush HudInnerEdge = new SolidColorBrush(Color.FromRgb(23,  81, 94));
    private static readonly IBrush HudAccent    = new SolidColorBrush(Color.FromRgb(0,   212, 201));
    private static readonly IBrush HudAccentInk = new SolidColorBrush(Color.FromRgb(8,  26, 30));
    private static readonly IBrush HudAccentHot = new SolidColorBrush(Color.FromRgb(255, 193, 74));
    private static readonly IBrush HudAccentOk  = new SolidColorBrush(Color.FromRgb(118, 255, 141));
    private static readonly IBrush HudAccentWarn= new SolidColorBrush(Color.FromRgb(255, 112, 112));
    private static readonly IBrush HudBustBg    = new SolidColorBrush(Color.FromRgb(196, 48, 48));
    private static readonly IBrush HudStatus    = new SolidColorBrush(Color.FromRgb(11,  20, 28));
    private static readonly IBrush HudInset     = new SolidColorBrush(Color.FromRgb(5,   12, 18));
    private static readonly IBrush HudInsetEdge = new SolidColorBrush(Color.FromRgb(69,  128, 144));
    private static readonly IBrush HoldsOreBrush = new SolidColorBrush(Color.FromRgb(214, 164, 96));
    private static readonly IBrush HoldsOrgBrush = new SolidColorBrush(Color.FromRgb(118, 178, 116));
    private static readonly IBrush HoldsEqBrush = new SolidColorBrush(Color.FromRgb(96, 171, 194));
    private static readonly IBrush HoldsColsBrush = new SolidColorBrush(Color.FromRgb(164, 128, 198));
    private static readonly IBrush HoldsFreeBrush = new SolidColorBrush(Color.FromRgb(123, 145, 156));
    private const string OnlinePlayersHeaderText = "Who's Playing";
    private static readonly Regex OnlinePlayerLineRegex = new(
        @"^(?<description>[A-Za-z0-9][A-Za-z0-9'./ -]*?)(?:\s+\[(?<corp>\d+)\])?\s*$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex OnlinePlayerEnteredGameRegex = new(
        @"^(.+?)\s+enters the game\.$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex OnlinePlayerExitedGameRegex = new(
        @"^(.+?)\s+exits the game\.$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly string[] OnlineTraderRankPrefixes =
    [
        "Chief Warrant Officer ",
        "Lieutenant Commander ",
        "Gunnery Sergeant ",
        "Enemy of Humankind ",
        "Enemy of the People ",
        "Enemy of the State ",
        "Heinous Overlord ",
        "Infamous Pirate ",
        "Notorious Pirate ",
        "Sergeant Major ",
        "Smuggler Savant ",
        "Staff Sergeant ",
        "Dread Pirate ",
        "Fleet Admiral ",
        "Lance Corporal ",
        "Lieutenant J.G. ",
        "Prime Evil ",
        "Rear Admiral ",
        "Vice Admiral ",
        "3rd Class ",
        "2nd Class ",
        "1st Class ",
        "Ambassador ",
        "Annoyance ",
        "Commander ",
        "Commodore ",
        "Corporal ",
        "Galactic Scourge ",
        "Lieutenant ",
        "Nuisance ",
        "Private ",
        "Sergeant ",
        "Smuggler ",
        "Terrorist ",
        "Admiral ",
        "Captain ",
        "Civilian ",
        "Menace ",
        "Pirate ",
        "Robber ",
        "Class ",
        "Enemy "
    ];
    private const int FinderPrewarmMaxSize = Core.ModBubble.DefaultMaxBubbleSize;

    private static void SetBrushColor(IBrush brush, Color color)
    {
        if (brush is SolidColorBrush solidBrush)
            solidBrush.Color = color;
    }

    private void ApplyRedAlertPalette(bool enabled)
    {
        if (enabled)
        {
            SetBrushColor(BgWindow,    Color.FromRgb(54, 20, 24));
            SetBrushColor(HudWindow,   Color.FromRgb(19,  7, 10));
            SetBrushColor(HudMenu,     Color.FromRgb(34, 11, 15));
            SetBrushColor(HudShell,    Color.FromRgb(28, 10, 14));
            SetBrushColor(HudEdge,     Color.FromRgb(184, 52, 58));
        }
        else
        {
            SetBrushColor(BgWindow,    Color.FromRgb(105, 105, 105));
            SetBrushColor(HudWindow,   Color.FromRgb(8,   14,  20));
            SetBrushColor(HudMenu,     Color.FromRgb(16,  27,  36));
            SetBrushColor(HudShell,    Color.FromRgb(10,  21,  29));
            SetBrushColor(HudEdge,     Color.FromRgb(57,  112, 128));
        }
    }
}
