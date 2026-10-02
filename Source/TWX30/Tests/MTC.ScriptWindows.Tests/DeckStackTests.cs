using System.Collections;
using System.Reflection;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Interactivity;
using Avalonia.Input;
using Avalonia.Media.Imaging;
using Avalonia.VisualTree;
using MTC;
using TWXProxy.Core;

internal static class DeckStackTests
{
    private const BindingFlags Private = BindingFlags.Instance | BindingFlags.NonPublic;
    private static object? Call(MainWindow w, string name, params object[] args) => typeof(MainWindow).GetMethod(name, Private)!.Invoke(w, args);
    private static T Field<T>(MainWindow w, string name) => (T)typeof(MainWindow).GetField(name, Private)!.GetValue(w)!;
    private static T Get<T>(object tab, string property) => (T)tab.GetType().GetProperty(property)!.GetValue(tab)!;
    private static void Set(object tab, string property, object value) => tab.GetType().GetProperty(property)!.SetValue(tab, value);
    private static void Check(bool value, string message) { if (!value) throw new Exception(message); }
    private static void Near(double actual, double expected, string message) => Check(Math.Abs(actual - expected) <= 1, $"{message}: {actual} != {expected}");

    public static async Task Run(string directory)
    {
        var prefs = new EphemeralPreferences { ProgramDirectory = directory, ScriptsDirectory = Path.Combine(directory, "scripts"),
            UpdateChecksEnabled = false, ShowNotesPanel = true, TerminalFontSize = 14 };
        typeof(AppPreferences).GetProperty(nameof(AppPreferences.HasConfiguredSharedPaths))!.SetValue(prefs, true);
        var w = new MainWindow(prefs) { Width = 1800, Height = 1050, ShowActivated = false };
        var reports = new List<IScriptWindow>();
        var databases = new List<ModDatabase>();
        try
        {
            w.Show();
            for (int i = 0; i < 3; i++) Call(w, "CreateStagedMtcTab");
            var tabs = Field<IEnumerable>(w, "_mtcTabs").Cast<object>().ToArray();
            string[] names = ["moon_base_s", "worldsapart_l", "joes_tavern_g", "rogue_t"];
            var sends = new Dictionary<int, string>();
            for (int i = 0; i < tabs.Length; i++)
            {
                var tab = tabs[i]; int id = Get<int>(tab, "Id");
                Set(tab, "Title", names[i]); Set(tab, "NotesPanelVisible", true);
                var state = Get<GameState>(tab, "State");
                state.GameName = names[i]; state.TraderName = i == 1 ? "Kairos Bridger" : "reaper";
                state.Host = "game" + i + ".example.invalid"; state.Port = 2002 + i;
                state.Sector = 510 + i * 2301; state.ShipName = "Imperial StarShip"; state.Fighters = 280000;
                state.Credits = 473709924; state.HoldsTotal = 250; state.FuelOre = 180;
                state.Shields = 16000; state.Etheral = 12; state.Beacon = 3; state.Disruptor = 9;
                state.Photon = 4; state.Armor = 254; state.Limpet = 253; state.Genesis = 5;
                state.Atomic = 6; state.Corbomite = 6000; state.Cloak = 2; state.TurnsPerWarp = 3;
                Get<AnsiParser>(tab, "Parser").Feed("\x1b[32mSector  : \x1b[36m" + state.Sector + "\r\n\x1b[35mPlanets : \x1b[32m<<<< (M) . >>>> (Shielded)\r\n\x1b[33mCitadel treasury contains 64,004,571 credits.\r\n\r\n\x1b[36mR Toby  Gridding sector 28474\r\n\x1b[32m[PMGR] Construction complete.\r\n\r\n\x1b[35mCitadel command \x1b[33m(?=help)\x1b[0m");
                var report = Get<DockedScriptWindows>(tab, "ScriptWindows").CreateWindow("same_name", "Planet manager", 100 + i * 900, 100 + i * 400);
                report.TextContent = $"OWNER {id}*Planet      #41*Sector      {state.Sector}*Status      Construction*Fighters    280,000";
                report.Show(); reports.Add(report);
                Set(tab, "TerminalInputHandler", (Action<byte[]>)(bytes => sends[id] = System.Text.Encoding.ASCII.GetString(bytes)));
            }
            Call(w, "SetSkin", true);
            await Task.Delay(300);
            Call(w, "SelectCommandDeckGame", Get<int>(tabs[0], "Id"));
            await Task.Delay(200);
            w.Width = 1800; w.Height = 1050;
            await Task.Delay(250);
            var rail = Field<CommandDeckScriptWindows>(w, "_commandDeckReports");
            var grid = Field<Grid>(w, "_commandDeckConsoleGrid");
            var deck = Field<Grid>(w, "_deckWorkspaceHost");
            var root = Field<Grid>(w, "_commandDeckRoot");
            Check(!Field<Border>(w, "_tabStripHost").IsVisible, "Classic tabs still visible in deck");
            Check(!Field<Border>(w, "_statusBar").IsVisible, "Main bottom bar still visible in deck");
            var toolbar = Field<ContentControl>(w, "_commandDeckToolbarHost");
            Check(toolbar.GetVisualAncestors().Contains(Field<Border>(w, "_menuBarHost")), "Deck controls not in menu row");
            Check(!toolbar.GetVisualAncestors().Contains(root), "Deck controls still consume console area");
            Check(toolbar.TranslatePoint(default, w)!.Value.X >= Field<Menu>(w, "_menuBar").Bounds.Width - 1, "Deck controls overlap menu");
            Check(grid.Children.OfType<CommandDeckConsole>().Count(c => c.IsVisible) == 4, "Four live consoles not tiled");
            Check(rail.GetVisualDescendants().OfType<SelectableTextBlock>().Count() == 4, "All game reports not present");
            double outer = w.Bounds.Width, center = deck.Bounds.Width, right = rail.Bounds.Width;
            var notes = Field<TextBox>(w, "_notesTextBox");
            var notesPoint = notes.TranslatePoint(default, w)!.Value;
            Check(notesPoint.Y + notes.Bounds.Height <= w.Bounds.Height, "Notes outside window");
            Check(notesPoint.X < deck.TranslatePoint(default, w)!.Value.X, "Notes not in inspector");
            var panels = Field<Dictionary<string, CommandDeckPanel>>(w, "_commandDeckPanels");
            var tacticalPoint = panels["Tactical"].TranslatePoint(default, w)!.Value;
            var reportPoint = rail.TranslatePoint(default, w)!.Value;
            Near(tacticalPoint.X, reportPoint.X, "Tactical not in right column");
            Check(tacticalPoint.Y >= reportPoint.Y + rail.Bounds.Height - 1, "Tactical overlaps reports");
            Check(!panels["Devices"].IsCollapsed, "Devices hidden by default");
            var fighters = Field<TextBlock>(w, "_deckValFighters");
            var shields = Field<TextBlock>(w, "_deckValShields");
            Near(fighters.TranslatePoint(default, w)!.Value.Y, shields.TranslatePoint(default, w)!.Value.Y, "Fighters/shields not paired");
            Check(Grid.GetColumn(fighters) == 1 && Grid.GetColumn(shields) == 3, "Not four metric columns");
            string[] shipValues = ["Fighters", "Shields", "TrnWarp", "HTotal", "FuelOre", "Organics", "Equipment", "Colonists"];
            for (int i = 0; i < shipValues.Length; i++)
            {
                var value = Field<TextBlock>(w, "_deckVal" + shipValues[i]);
                Check(value.GetVisualAncestors().Contains(panels["Ship & cargo"]), "Ship value in wrong panel: " + shipValues[i]);
                Check(Grid.GetRow(value) == i / 2 && Grid.GetColumn(value) == i % 2 * 2 + 1, "Incorrect ship metric order: " + shipValues[i]);
            }
            Check(!Field<TextBlock>(w, "_deckHudShipName").GetVisualAncestors().Any(), "Ship name still displayed");
            Check(!Field<TextBlock>(w, "_deckValEmpty").GetVisualAncestors().Any(), "Free holds still displayed");
            Check(!panels["Devices"].GetVisualDescendants().OfType<TextBlock>().Any(t => t.Text == "Turns/warp"), "Extra Turns/warp row in Devices");
            foreach (string device in new[] { "Ether", "Beacon", "Disruptor", "Photon", "Armid", "Limpet", "Genesis", "Atomic", "Corbo", "Cloak" })
                Check(Field<TextBlock>(w, "_deckVal" + device).Text is { Length: > 0 }, "Device count missing: " + device);
            double notesHeight = notes.Bounds.Height;
            foreach (string name in new[] { "Trader", "Ship & cargo", "Devices", "Online" })
            {
                Click(panels[name], "Minimize " + name);
                await Task.Delay(60);
                Check(panels[name].IsCollapsed && panels[name].Bounds.Height < 50, "Panel did not minimize to title: " + name);
            }
            Check(notes.Bounds.Height > notesHeight + 100, "Minimized panels did not give space to Notes");
            foreach (string name in new[] { "Trader", "Ship & cargo", "Devices", "Online", "Notes" })
            {
                if (panels[name].IsCollapsed) Click(panels[name], "Restore " + name);
                Click(panels[name], "Close " + name);
                await Task.Delay(60);
                Check(!panels[name].IsVisible && prefs.CommandDeckClosedPanels.Contains(name), "Panel close failed: " + name);
                Call(w, "SetCommandDeckPanelState", name, false, false);
                await Task.Delay(60);
                Check(panels[name].IsVisible && !panels[name].IsCollapsed, "Panel reopen failed: " + name);
            }
            Click(panels["Notes"], "Minimize Notes"); await Task.Delay(60);
            Check(panels["Notes"].Bounds.Height < 50, "Notes did not minimize to title");
            Click(panels["Notes"], "Restore Notes"); await Task.Delay(60);
            Near(notes.Bounds.Height, notesHeight, "Restored Notes layout changed");
            for (int i = 0; i < tabs.Length; i++)
            {
                var database = new ModDatabase(); databases.Add(database);
                database.CreateDatabase(Path.Combine(directory, names[i] + ".xdb"),
                    new DataHeader { Sectors = 100, StarDock = (ushort)(41 + i), Rylos = (ushort)(51 + i) });
                for (int sector = 1; sector <= (i + 1) * 10; sector++)
                    database.SaveSector(new SectorData { Number = sector, Explored = ExploreType.Yes });
                Set(tabs[i], "SessionDb", database);
                var runtime = Get<TwxRuntimeContext>(tabs[i], "RuntimeContext");
                runtime.ActiveDatabase = database;
                ScriptRef.SetCurrentGameVar(runtime, "$MAP~BACKDOOR", (61 + i).ToString());
            }
            typeof(MainWindow).GetField("_sessionDb", Private)!.SetValue(w, databases[0]);
            Call(w, "RefreshCommandDeckMetadata");
            await Task.Delay(300);
            var consoleViews = Field<Dictionary<int, CommandDeckConsole>>(w, "_commandDeckConsoles");
            for (int i = 0; i < tabs.Length; i++)
            {
                var console = consoleViews[Get<int>(tabs[i], "Id")];
                var texts = console.GetVisualDescendants().OfType<TextBlock>().Select(t => t.Text).ToArray();
                Check(texts.Contains($"game{i}.example.invalid:{2002 + i} / Disconnected"), "Wrong console endpoint/status");
                Check(!texts.Any(t => t?.Contains(" / Bot ") == true), "Bot activity still displayed in console header");
                Check(!texts.Any(t => t?.Contains(" / Sector ") == true), "Console header still shows sector");
                Check(texts.Contains($"SD {41 + i}") && texts.Contains($"BD {61 + i}") && texts.Contains($"Rylos {51 + i}"), "Reminder ownership mismatch");
                Check(texts.Contains($"{(i + 1) * 10}% Explored"), "Exploration ownership mismatch");
                Check(texts.Any(t => t?.StartsWith("Bot Mode: ") == true), "Bot mode absent from footer");
            }
            foreach (var text in rail.GetVisualDescendants().OfType<SelectableTextBlock>())
                Check(text.FontFamily == notes.FontFamily && Math.Abs(text.FontSize - notes.FontSize) < .01, "Report font differs from Notes");
            await VerifyTacticalSelection(w, tabs, databases, directory);
            notes.Text = "NOTES OWNED BY FIRST GAME";
            Click(panels["Devices"], "Minimize Devices");
            Call(w, "SelectCommandDeckGame", Get<int>(tabs[1], "Id"));
            await Task.Delay(120);
            Check(ReferenceEquals(rail, Field<CommandDeckScriptWindows>(w, "_commandDeckReports")), "Selection rebuilt reports");
            Check(!Field<TextBox>(w, "_notesTextBox").Text!.Contains("FIRST GAME"), "Notes leaked");
            Check(panels["Devices"].IsCollapsed, "Game switch reset panel state");
            Click(panels["Devices"], "Restore Devices");
            Call(w, "SelectCommandDeckGame", Get<int>(tabs[0], "Id")); await Task.Delay(120);
            Check(Field<TextBox>(w, "_notesTextBox").Text == "NOTES OWNED BY FIRST GAME", "First notes lost");
            Check(!Field<Border>(w, "_statusBar").IsVisible, "Game switch restored main footer");
            var expander = rail.GetVisualDescendants().OfType<Expander>().First(e => e.Content is ScrollViewer);
            var reportExpanders = rail.GetVisualDescendants().OfType<Expander>()
                .Where(e => e.Content is ScrollViewer).ToArray();
            var firstBody = (ScrollViewer)reportExpanders[0].Content!;
            var secondBody = (ScrollViewer)reportExpanders[1].Content!;
            var resizeGrip = reportExpanders[0].GetVisualAncestors().OfType<Grid>()
                .First(g => g.Children.Contains(reportExpanders[0])).Children.OfType<Thumb>().Single();
            double originalHeight = firstBody.Height;
            double secondY = reportExpanders[1].TranslatePoint(default, rail)!.Value.Y;
            resizeGrip.RaiseEvent(new VectorEventArgs { RoutedEvent = Thumb.DragDeltaEvent, Vector = new Vector(0, 70) });
            await Task.Delay(120);
            Near(firstBody.Height, originalHeight + 70, "Report body did not grow after drag");
            Near(secondBody.Height, originalHeight, "Drag resized another report");
            Near(reportExpanders[1].TranslatePoint(default, rail)!.Value.Y, secondY + 70,
                "Next report did not move down after drag");
            int active = Field<int>(w, "_activeMtcTabId");
            expander.IsExpanded = false;
            for (int i = 0; i < 12; i++)
            {
                await Task.Run(() => { for (int j = 0; j < reports.Count; j++) reports[j].TextContent = $"OWNER {j}*" + new string('X', 500) + "*" + i; });
                await Task.Delay(60);
                Near(w.Bounds.Width, outer, "Outer width jumped"); Near(deck.Bounds.Width, center, "Console width jumped");
                Near(rail.Bounds.Width, right, "Report width jumped");
                Check(Field<int>(w, "_activeMtcTabId") == active, "Background report changed target");
                Check(!expander.IsExpanded, "Update expanded collapsed report");
            }
            expander.IsExpanded = true;
            await Task.Delay(150);
            Check(rail.Scroll.Extent.Height > rail.Scroll.Viewport.Height, "Report list overflow not scrollable");
            foreach (var text in rail.GetVisualDescendants().OfType<SelectableTextBlock>())
            {
                var scroll = text.GetVisualAncestors().OfType<ScrollViewer>().First();
                Check(scroll.Extent.Width > scroll.Viewport.Width, "Wide report not scrollable");
            }
            var terminals = Field<Dictionary<int, TerminalControl>>(w, "_deckTerminalControls");
            int second = Get<int>(tabs[1], "Id");
            terminals[second].SendInput!(System.Text.Encoding.ASCII.GetBytes("owner-input"));
            Check(sends.Count == 1 && sends[second] == "owner-input", "Input routed to wrong game");
            Check(Field<int>(w, "_activeMtcTabId") == second, "Input did not select its owner");
            Call(w, "ExpandCommandDeckGame", second); await Task.Delay(100);
            Check(grid.Children.OfType<CommandDeckConsole>().Count(c => c.IsVisible) == 1, "Expand failed");
            Call(w, "ExpandCommandDeckGame", second); await Task.Delay(100);
            Check(grid.Children.OfType<CommandDeckConsole>().Count(c => c.IsVisible) == 4, "Restore failed");
            Field<Thumb>(w, "_commandDeckReportsGrip").RaiseEvent(new VectorEventArgs { RoutedEvent = Thumb.DragDeltaEvent, Vector = new Vector(-40, 0) });
            await Task.Delay(120); Near(rail.Bounds.Width, right + 40, "Right divider failed"); Near(w.Bounds.Width, outer, "Divider resized OS window");
            double left = root.ColumnDefinitions[0].ActualWidth;
            Field<Thumb>(w, "_commandDeckInspectorGrip").RaiseEvent(new VectorEventArgs { RoutedEvent = Thumb.DragDeltaEvent, Vector = new Vector(25, 0) });
            await Task.Delay(120); Near(root.ColumnDefinitions[0].ActualWidth, left + 25, "Left divider failed");
            w.Width -= 100; await Task.Delay(150);
            Near(rail.Bounds.Width, right + 40, "Outer resize changed right width");
            Near(root.ColumnDefinitions[0].ActualWidth, left + 25, "Outer resize changed left width");
            for (int j = 0; j < reports.Count; j++) reports[j].TextContent = $"Game {names[j]}*Planet      #41*Sector      {Get<GameState>(tabs[j], "State").Sector}*Task        Construction*Fighters    280,000";
            await Task.Delay(150); Save(w, directory, "deck-approved-desktop");
            Call(w, "CreateStagedMtcTab"); await Task.Delay(200);
            var fifth = Field<IEnumerable>(w, "_mtcTabs").Cast<object>().Last();
            Check(Field<int>(w, "_commandDeckPage") == 1, "Fifth console not on second deck");
            Check(Field<Grid>(w, "_commandDeckConsoleGrid").Children.OfType<CommandDeckConsole>().Count(c => c.IsVisible) == 1, "Page overflow not bounded");
            rail = Field<CommandDeckScriptWindows>(w, "_commandDeckReports");
            Check(rail.GetVisualDescendants().OfType<SelectableTextBlock>().Count() == 4, "Off-page reports vanished");
            rail.GetVisualDescendants().OfType<Button>().First(b => (ToolTip.GetTip(b) as string)?.StartsWith("Go to moon_base_s") == true)
                .RaiseEvent(new RoutedEventArgs(Button.ClickEvent));
            await Task.Delay(150);
            Check(Field<int>(w, "_activeMtcTabId") == Get<int>(tabs[0], "Id") && Field<int>(w, "_commandDeckPage") == 0, "Report jump did not select owner page");
            prefs.ScriptWindowsInsideMtc = false; Call(w, "ApplyScriptWindowPreferences"); await Task.Delay(150);
            Check(!w.GetVisualDescendants().OfType<CommandDeckScriptWindows>().Any(), "External preference ignored");
            Check(Field<Dictionary<string, CommandDeckPanel>>(w, "_commandDeckPanels")["Tactical"].IsEffectivelyVisible,
                "External script windows hid Tactical");
            prefs.ScriptWindowsInsideMtc = true; Call(w, "ApplyScriptWindowPreferences"); await Task.Delay(150);
            Check(w.GetVisualDescendants().OfType<CommandDeckScriptWindows>().Single().GetVisualDescendants().OfType<SelectableTextBlock>().Count() == 4, "Dock restore lost reports");
            w.Width = 1280; w.Height = 800; await Task.Delay(200); Save(w, directory, "deck-approved-laptop");
            databases[1].ResetSectors();
            await Task.Delay(2300);
            Call(w, "RefreshCommandDeckMetadata"); await Task.Delay(150);
            var secondConsole = Field<Dictionary<int, CommandDeckConsole>>(w, "_commandDeckConsoles")[Get<int>(tabs[1], "Id")];
            Check(secondConsole.GetVisualDescendants().OfType<TextBlock>().Any(t => t.Text == "0% Explored"), "Reset kept old explored percentage");
            foreach (var report in reports) report.Dispose();
            await Task.Delay(150);
            Check(!Field<CommandDeckScriptWindows>(w, "_commandDeckReports").GetVisualDescendants().OfType<SelectableTextBlock>().Any(), "Closed reports retained");
            Call(w, "SetCommandDeckPanelState", "Devices", true, false);
            Call(w, "SetCommandDeckPanelState", "Online", false, true);
            Call(w, "SetSkin", false); await Task.Delay(150);
            Check(Field<Border>(w, "_tabStripHost").IsVisible, "Classic tabs not restored");
            Check(w.GetVisualDescendants().OfType<ScriptWindowSidebar>().Any(), "Classic Notes not restored");
            Check(Field<Border>(w, "_statusBar").IsVisible == prefs.ShowBottomBar, "Classic status preference lost");
            Check(!Field<ContentControl>(w, "_commandDeckToolbarHost").IsVisible, "Deck toolbar remained in Classic");
            Call(w, "SetSkin", true); await Task.Delay(150);
            panels = Field<Dictionary<string, CommandDeckPanel>>(w, "_commandDeckPanels");
            Check(panels["Devices"].IsClosed && panels["Online"].IsCollapsed, "Rebuild reset saved panel choices");
            Click(w, "Reset deck layout"); await Task.Delay(100);
            Check(panels.Values.All(p => !p.IsClosed && !p.IsCollapsed), "Reset failed to reopen panels");
            Console.WriteLine("PASS deck: lower-right Tactical, paired device counts, panel minimize/close/reopen, Notes space recovery, 4/5 game paging, all-owner reports, Notes/input isolation, stable resizing and classic/external round trips.");
            await VerifyShellLifetime(w, tabs);
        }
        finally { foreach (var report in reports) report.Dispose(); w.Close(); foreach (var database in databases) database.Dispose(); }
    }
    private static async Task VerifyShellLifetime(MainWindow w, object[] tabs)
    {
        var scaleProbe = VerifyFontScaling(w);
        var retired = new List<WeakReference>();
        Call(w, "SetSkin", false);
        for (int i = 0; i < 24; i++)
        {
            retired.Add(CaptureTerminal(w));
            Call(w, "ActivateMtcTab", Get<int>(tabs[(i + 1) % tabs.Length], "Id"));
            await Task.Delay(30);
        }
        await Task.Delay(300);
        GC.Collect(); GC.WaitForPendingFinalizers(); GC.Collect();
        await Task.Delay(100);
        Check(!scaleProbe.IsAlive, "Font scaling cache retained discarded control");
        Check(retired.All(r => !r.IsAlive), $"Classic retained {retired.Count(r => r.IsAlive)} retired terminals");
        retired.Clear();
        Call(w, "SetSkin", true);
        for (int i = 0; i < 8; i++)
        {
            CaptureDeckTerminals(w, retired);
            Call(w, "ApplySelectedSkinSafe");
            await Task.Delay(60);
        }
        await Task.Delay(300);
        GC.Collect(); GC.WaitForPendingFinalizers(); GC.Collect();
        await Task.Delay(100);
        Check(retired.All(r => !r.IsAlive), $"Deck retained {retired.Count(r => r.IsAlive)} retired terminals");
        Console.WriteLine("PASS layout lifetime: 24 Classic tab switches and 8 Deck rebuilds release all retired terminals; weak font cache preserves non-compounding scaling.");
    }
    [System.Runtime.CompilerServices.MethodImpl(System.Runtime.CompilerServices.MethodImplOptions.NoInlining)]
    private static WeakReference CaptureTerminal(MainWindow w) => new(Field<TerminalControl>(w, "_termCtrl"));
    [System.Runtime.CompilerServices.MethodImpl(System.Runtime.CompilerServices.MethodImplOptions.NoInlining)]
    private static void CaptureDeckTerminals(MainWindow w, List<WeakReference> retired)
    {
        foreach (var terminal in Field<Dictionary<int, TerminalControl>>(w, "_deckTerminalControls").Values)
            retired.Add(new WeakReference(terminal));
    }
    [System.Runtime.CompilerServices.MethodImpl(System.Runtime.CompilerServices.MethodImplOptions.NoInlining)]
    private static WeakReference VerifyFontScaling(MainWindow w)
    {
        var label = new TextBlock { FontSize = 10 };
        Call(w, "ApplyUiFontScaleToControl", label, 1.5);
        Check(label.FontSize == 15, "Font scale not applied");
        Call(w, "ApplyUiFontScaleToControl", label, 1.5);
        Check(label.FontSize == 15, "Repeated scaling compounded");
        Call(w, "ApplyUiFontScaleToControl", label, 1.0);
        Check(label.FontSize == 10, "Original font size not restored");
        return new WeakReference(label);
    }
    private static void Save(Window w, string directory, string name)
    {
        using var image = new RenderTargetBitmap(new PixelSize((int)w.Bounds.Width, (int)w.Bounds.Height));
        image.Render(w); image.Save(Path.Combine(directory, name + ".png"));
    }

    private static async Task VerifyTacticalSelection(MainWindow w, object[] tabs, List<ModDatabase> databases, string directory)
    {
        var map = Field<TacticalMapControl>(w, "_tacticalMap");
        object Snapshot() => typeof(TacticalMapControl).GetField("_lastSnapshot", Private)!.GetValue(map)!;
        T SnapshotValue<T>(string name) => Get<T>(Snapshot(), name);
        async Task Until(Func<bool> condition, string message)
        {
            for (int attempt = 0; attempt < 100; attempt++)
            {
                if (condition()) return;
                await Task.Delay(20);
            }
            Check(false, message);
        }
        bool HasOwner(int i) => SnapshotValue<Dictionary<int, SectorData?>>("Sectors").GetValueOrDefault(1)?.Constellation == "MAP OWNER " + i;
        int[] previousSectors = tabs.Select(t => Get<GameState>(t, "State").Sector).ToArray();
        for (int i = 0; i < tabs.Length; i++)
        {
            Get<GameState>(tabs[i], "State").Sector = 1;
            databases[i].SaveSector(new SectorData { Number = 1, Explored = ExploreType.Yes,
                Constellation = "MAP OWNER " + i, Warp = [31 + i, 0, 0, 0, 0, 0] });
        }
        Call(w, "SelectCommandDeckGame", Get<int>(tabs[0], "Id"));
        await Until(() => HasOwner(0), "First game's map never refreshed");
        map.CenterOnSector(31);
        await Until(() => SnapshotValue<int>("CenterSector") == 31, "Manual map center failed");
        map.RefreshSnapshot();
        int pendingVersion = (int)typeof(TacticalMapControl).GetField("_snapshotRequestVersion", Private)!.GetValue(map)!;
        Call(w, "SelectCommandDeckGame", Get<int>(tabs[1], "Id"));
        Check((int)typeof(TacticalMapControl).GetField("_snapshotRequestVersion", Private)!.GetValue(map)! > pendingVersion,
            "Game change did not invalidate in-flight snapshot");
        Check(SnapshotValue<Dictionary<int, SectorData?>>("Sectors").Count == 0, "Old game remained visible after selection");
        await Until(() => HasOwner(1), "Same-sector game switch kept first map");
        Check(SnapshotValue<int>("CenterSector") == 1, "Previous game's manual center leaked");
        Check(SnapshotValue<Dictionary<int, SectorData?>>("Sectors").ContainsKey(32), "Second game's topology missing");
        Save(w, directory, "deck-tactical-second-game");
        for (int i = 0; i < 12; i++) Call(w, "SelectCommandDeckGame", Get<int>(tabs[i % tabs.Length], "Id"));
        await Until(() => HasOwner(3), "Rapid game switching applied an old snapshot");
        await Task.Delay(100);
        Check(HasOwner(3), "Old background build replaced selected game's map");
        Get<GameState>(tabs[3], "State").Sector = 2;
        Call(w, "RefreshCommandDeckMetadata");
        await Until(() => SnapshotValue<int>("CurrentSector") == 2, "Map stopped following movement");
        databases[3].SaveSector(new SectorData { Number = 2, Explored = ExploreType.Yes, Warp = [49, 0, 0, 0, 0, 0] });
        Call(w, "RefreshCommandDeckMetadata");
        await Until(() => SnapshotValue<Dictionary<int, SectorData?>>("Sectors").ContainsKey(49), "Map ignored changed topology");
        int steadyVersion = (int)typeof(TacticalMapControl).GetField("_snapshotRequestVersion", Private)!.GetValue(map)!;
        Call(w, "RefreshCommandDeckMetadata"); Call(w, "RefreshCommandDeckMetadata");
        Check((int)typeof(TacticalMapControl).GetField("_snapshotRequestVersion", Private)!.GetValue(map)! == steadyVersion,
            "Unchanged metadata rebuilt the map");
        for (int i = 0; i < tabs.Length; i++) Get<GameState>(tabs[i], "State").Sector = previousSectors[i];
        Call(w, "SelectCommandDeckGame", Get<int>(tabs[0], "Id"));
        Console.WriteLine("PASS Tactical follows game/database ownership, same-number sectors, rapid switches, movement and topology; stale builds and manual centers cannot cross games.");
    }
    private static void Click(Control panel, string tooltip) => panel.GetVisualDescendants().OfType<Button>()
        .Single(b => ToolTip.GetTip(b) as string == tooltip).RaiseEvent(new RoutedEventArgs(Button.ClickEvent));
    private sealed class EphemeralPreferences : AppPreferences { public override void Save() { } }
}
