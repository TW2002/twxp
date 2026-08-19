using System;
using System.Linq;
using System.Text;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;
using Core = TWXProxy.Core;

namespace MTC;

/// <summary>
/// Sector database lookup window. Type a sector number to see everything
/// the database knows about that sector.
/// </summary>
public class SectorInfoWindow : Window
{
    private readonly Func<Core.ModDatabase?> _getDb;
    private readonly Func<int>               _getCurrentSector;

    // Controls
    private readonly TextBox    _sectorBox;
    private readonly TextBlock  _header;
    private readonly StackPanel _content;

    // Colors
    private static readonly IBrush BgWin    = new SolidColorBrush(Color.FromRgb(0x10, 0x10, 0x1c));
    private static readonly IBrush BgPanel  = new SolidColorBrush(Color.FromRgb(0x18, 0x18, 0x28));
    private static readonly IBrush BgRow    = new SolidColorBrush(Color.FromRgb(0x1e, 0x1e, 0x30));
    private static readonly IBrush BgRowAlt = new SolidColorBrush(Color.FromRgb(0x16, 0x16, 0x25));
    private static readonly IBrush ColKey   = new SolidColorBrush(Color.FromRgb(0x80, 0xd0, 0xff));
    private static readonly IBrush ColVal   = new SolidColorBrush(Color.FromRgb(0xe8, 0xe8, 0xe8));
    private static readonly IBrush ColMuted = new SolidColorBrush(Color.FromRgb(0x88, 0x88, 0x99));
    private static readonly IBrush ColGreen = new SolidColorBrush(Color.FromRgb(0x44, 0xee, 0x88));
    private static readonly IBrush ColOrange= new SolidColorBrush(Color.FromRgb(0xff, 0xaa, 0x44));
    private static readonly IBrush ColRed   = new SolidColorBrush(Color.FromRgb(0xff, 0x55, 0x55));
    private static readonly IBrush ColYellow= new SolidColorBrush(Color.FromRgb(0xff, 0xee, 0x44));
    private static readonly IBrush Separator= new SolidColorBrush(Color.FromRgb(0x33, 0x33, 0x55));
    private static readonly FontFamily MonoFont = new("Cascadia Code, Menlo, Consolas, Courier New, monospace");

    public SectorInfoWindow(Func<Core.ModDatabase?> getDb, Func<int> getCurrentSector)
    {
        _getDb            = getDb;
        _getCurrentSector = getCurrentSector;

        Title      = "Sector Database";
        Width      = 520;
        Height     = 680;
        MinWidth   = 380;
        MinHeight  = 300;
        Background = BgWin;

        // ── Toolbar ───────────────────────────────────────────────────────
        var label = new TextBlock
        {
            Text              = "Sector:",
            Foreground        = Brushes.Silver,
            FontSize          = 13,
            VerticalAlignment = VerticalAlignment.Center,
            Margin            = new Thickness(0, 0, 6, 0),
        };

        _sectorBox = new TextBox
        {
            Width    = 80,
            FontSize = 13,
            Watermark = "number",
            VerticalContentAlignment = VerticalAlignment.Center,
        };
        _sectorBox.KeyDown += OnKeyDown;

        var lookupBtn = new Button { Content = "Look Up", Padding = new Thickness(10, 4) };
        lookupBtn.Click += (_, _) => Lookup();

        var currentBtn = new Button { Content = "Current", Padding = new Thickness(10, 4) };
        currentBtn.Click += (_, _) =>
        {
            int sn = _getCurrentSector();
            if (sn > 0) { _sectorBox.Text = sn.ToString(); Lookup(); }
        };

        var toolbar = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Background  = BgPanel,
            Height      = 40,
            Children    =
            {
                new Border { Width = 10 },
                label, _sectorBox, lookupBtn, currentBtn,
            },
        };

        // ── Header ────────────────────────────────────────────────────────
        _header = new TextBlock
        {
            Text       = "Enter a sector number and click Look Up.",
            Foreground = ColMuted,
            FontSize   = 13,
            Margin     = new Thickness(12, 8, 12, 4),
            TextWrapping = TextWrapping.Wrap,
        };

        // ── Scrollable content ────────────────────────────────────────────
        _content = new StackPanel { Margin = new Thickness(0) };
        var scroll = new ScrollViewer
        {
            Content                  = _content,
            VerticalScrollBarVisibility   = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
        };

        var layout = new DockPanel { Background = BgWin };
        DockPanel.SetDock(toolbar, Dock.Top);
        DockPanel.SetDock(_header, Dock.Top);
        layout.Children.Add(toolbar);
        layout.Children.Add(_header);
        layout.Children.Add(scroll);

        Content = layout;
    }

    private void OnKeyDown(object? sender, KeyEventArgs e)
    {
        if (e.Key == Key.Return || e.Key == Key.Enter)
            Lookup();
    }

    private void Lookup()
    {
        _content.Children.Clear();

        if (!int.TryParse(_sectorBox.Text?.Trim(), out int sn) || sn <= 0)
        {
            _header.Text = "Please enter a valid sector number.";
            _header.Foreground = ColOrange;
            return;
        }

        var db = _getDb();
        if (db == null)
        {
            _header.Text = "No active database. Connect to a game first.";
            _header.Foreground = ColRed;
            return;
        }

        var sd = db.GetSector(sn);
        if (sd == null)
        {
            _header.Text = $"Sector {sn} — not in database.";
            _header.Foreground = ColMuted;
            return;
        }

        _header.Text      = $"Sector {sn}";
        _header.Foreground = ColYellow;
        _header.FontSize   = 15;

        bool alt = false;

        // ── Section helper lambdas ─────────────────────────────────────────
        void AddSection(string title)
        {
            _content.Children.Add(new Border
            {
                Background = Separator,
                Height     = 1,
                Margin     = new Thickness(0, 8, 0, 0),
            });
            _content.Children.Add(new TextBlock
            {
                Text       = title,
                Foreground = ColKey,
                FontSize   = 12,
                FontWeight = FontWeight.Bold,
                Margin     = new Thickness(12, 4, 12, 2),
            });
            alt = false;
        }

        void AddRow(string key, string value, IBrush? valueBrush = null)
        {
            var row = new Grid
            {
                Background = alt ? BgRowAlt : BgRow,
                Margin     = new Thickness(0, 1, 0, 0),
                ColumnDefinitions = new ColumnDefinitions("160,*"),
            };
            var kTb = new TextBlock
            {
                Text       = key,
                Foreground = ColMuted,
                FontSize   = 12,
                Margin     = new Thickness(14, 4, 6, 4),
                TextWrapping = TextWrapping.NoWrap,
            };
            var vTb = new TextBlock
            {
                Text         = value,
                Foreground   = valueBrush ?? ColVal,
                FontSize     = 12,
                Margin       = new Thickness(4, 4, 12, 4),
                TextWrapping = TextWrapping.Wrap,
            };
            Grid.SetColumn(kTb, 0);
            Grid.SetColumn(vTb, 1);
            row.Children.Add(kTb);
            row.Children.Add(vTb);
            _content.Children.Add(row);
            alt = !alt;
        }

        void AddPreformatted(string value)
        {
            _content.Children.Add(new Border
            {
                Background = BgRow,
                Margin = new Thickness(0, 1, 0, 0),
                Padding = new Thickness(14, 8, 14, 8),
                Child = new TextBlock
                {
                    Text = value,
                    Foreground = ColVal,
                    FontFamily = MonoFont,
                    FontSize = 12,
                    TextWrapping = TextWrapping.NoWrap,
                },
            });
            alt = false;
        }

        // ── Sector Display ─────────────────────────────────────────────────
        AddSection("Sector Display");
        AddPreformatted(SectorScanFormatter.FormatSectorTooltip(sn, sd, db));

        // ── General ───────────────────────────────────────────────────────
        AddSection("General");
        string exploreStr = sd.Explored switch
        {
            Core.ExploreType.Yes     => "Fully explored",
            Core.ExploreType.Density => "Density scan only",
            Core.ExploreType.Calc    => "Warp-calc only",
            _                        => "Unknown",
        };
        AddRow("Status",        exploreStr,
               sd.Explored == Core.ExploreType.Yes ? ColGreen : ColOrange);

        if (!string.IsNullOrEmpty(sd.Constellation))
            AddRow("Constellation", sd.Constellation);
        if (!string.IsNullOrEmpty(sd.SectorName))
            AddRow("Sector name",   sd.SectorName);
        if (sd.Update != default)
            AddRow("Last updated",  sd.Update.ToString("yyyy-MM-dd HH:mm"));

        // ── Topology ──────────────────────────────────────────────────────
        AddSection("Topology");
        var warpsOut = sd.Warp.Where(w => w > 0).Select(w => w.ToString()).ToList();
        AddRow("Warps out",  warpsOut.Count > 0 ? string.Join("  ", warpsOut) : "—");
        if (sd.WarpsIn.Count > 0)
            AddRow("Warps in (one-way)", string.Join("  ", sd.WarpsIn));
        if (sd.Density > 0)    AddRow("Density",     sd.Density.ToString());
        if (sd.NavHaz > 0)     AddRow("NavHaz",       $"{sd.NavHaz}%", ColOrange);
        if (sd.Anomaly)        AddRow("Anomaly",      "Yes", ColRed);
        if (!string.IsNullOrEmpty(sd.Beacon)) AddRow("Beacon", sd.Beacon);

        // ── Port ──────────────────────────────────────────────────────────
        if (sd.SectorPort != null)
        {
            AddSection("Port");
            var p = sd.SectorPort;
            AddRow("Name",  p.Dead ? $"{p.Name} (DEAD)" : p.Name,
                            p.Dead ? ColRed : ColVal);
            if (p.ClassIndex > 0) AddRow("Class", p.ClassIndex.ToString());

            // BSS/BSB notation
            bool hasType = p.BuyProduct.Count == 3;
            if (hasType)
            {
                char f = p.BuyProduct[Core.ProductType.FuelOre]   ? 'B' : 'S';
                char o = p.BuyProduct[Core.ProductType.Organics]  ? 'B' : 'S';
                char e = p.BuyProduct[Core.ProductType.Equipment] ? 'B' : 'S';
                AddRow("Type (F/O/E)", $"{f}{o}{e}", ColGreen);
            }

            // Product amounts
            foreach (var pt in Enum.GetValues<Core.ProductType>())
            {
                p.ProductAmount.TryGetValue(pt, out ushort amt);
                p.ProductPercent.TryGetValue(pt, out byte pct);
                p.BuyProduct.TryGetValue(pt, out bool buys);
                if (amt > 0 || pct > 0)
                    AddRow($"  {pt}",
                           $"{(buys ? "Buying" : "Selling")}  {amt,6:N0} units  {pct}%");
            }

            if (p.Update != default)
                AddRow("Port updated", p.Update.ToString("yyyy-MM-dd HH:mm"));
        }

        // ── Fighters / Mines ──────────────────────────────────────────────
        if (sd.Fighters.Quantity > 0)
        {
            AddSection("Fighters / Mines");
            AddRow("Fighters",
                   $"{sd.Fighters.Quantity:N0}  ({sd.Fighters.Owner})  [{sd.Fighters.FigType}]",
                   ColOrange);
        }
        if (sd.MinesArmid.Quantity > 0 || sd.MinesLimpet.Quantity > 0)
        {
            if (sd.Fighters.Quantity == 0) AddSection("Fighters / Mines");
            if (sd.MinesArmid.Quantity  > 0)
                AddRow("Armid mines",  $"{sd.MinesArmid.Quantity:N0}  ({sd.MinesArmid.Owner})", ColOrange);
            if (sd.MinesLimpet.Quantity > 0)
                AddRow("Limpet mines", $"{sd.MinesLimpet.Quantity:N0}  ({sd.MinesLimpet.Owner})", ColOrange);
        }

        // ── Planets ───────────────────────────────────────────────────────
        var allPlanetNames = db.GetPlanetNamesInSector(sn);
        if (allPlanetNames.Count > 0)
        {
            AddSection("Planets");
            foreach (var pname in allPlanetNames)
                AddRow("", pname, ColGreen);
        }

        // ── Ships / Traders ───────────────────────────────────────────────
        if (sd.Ships.Count > 0)
        {
            AddSection("Ships");
            foreach (var ship in sd.Ships)
                AddRow(ship.Owner,
                       $"{ship.Name}  [{ship.ShipType}]  figs: {ship.Fighters:N0}",
                       ColOrange);
        }
        if (sd.Traders.Count > 0)
        {
            AddSection("Traders");
            foreach (var tr in sd.Traders)
                AddRow(tr.Name,
                       $"{tr.ShipName}  [{tr.ShipType}]  figs: {tr.Fighters:N0}",
                       ColOrange);
        }

        // ── Variables ─────────────────────────────────────────────────────
        if (sd.Variables.Count > 0)
        {
            AddSection("Custom Variables");
            foreach (var kv in sd.Variables)
                AddRow(kv.Key, kv.Value);
        }

        // Spacer at bottom
        _content.Children.Add(new Border { Height = 12 });
    }
}
