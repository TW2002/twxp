using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text.RegularExpressions;

namespace TWXProxy.Core;

public static class NativeHaggleModes
{
    public const string Baseline = "baseline";
    public const string BlendHeuristic = "blend-heuristic";
    public const string CherokeePlanet = "cherokee-planet";
    public const string ClampHeuristic = "clamp-heuristic";
    public const string ServerDerived = "server-derived";
    public const string ExcellentTarget = "excellent-target";
    public const string Aggressive = "aggressive";
    public const string Default = ServerDerived;
    public const string DefaultPlanet = CherokeePlanet;

    public static string Normalize(string? mode)
    {
        string normalized = (mode ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalized))
            return Default;

        return normalized switch
        {
            "ephaggle" => ClampHeuristic,
            "clamp heuristic" => ClampHeuristic,
            Baseline => Baseline,
            "blend heuristic" => BlendHeuristic,
            BlendHeuristic => BlendHeuristic,
            "enhanced haggle" => ServerDerived,
            "server derived" => ServerDerived,
            "aggressive haggle" => Aggressive,
            "cherokee" => CherokeePlanet,
            "cherokee planet" => CherokeePlanet,
            CherokeePlanet => CherokeePlanet,
            ClampHeuristic => ClampHeuristic,
            ServerDerived => ServerDerived,
            ExcellentTarget => ExcellentTarget,
            Aggressive => Aggressive,
            _ => normalized,
        };
    }

    public static bool IsBuiltIn(string? mode)
    {
        string normalized = Normalize(mode);
        return normalized == ClampHeuristic ||
               normalized == BlendHeuristic ||
               normalized == ServerDerived ||
               normalized == Baseline ||
               normalized == Aggressive ||
               normalized == CherokeePlanet;
    }

    public static IReadOnlyList<string> All { get; } = new[]
    {
        ClampHeuristic,
        BlendHeuristic,
        ServerDerived,
        Baseline,
        Aggressive,
        CherokeePlanet,
    };

    public static IReadOnlyList<NativeHaggleModeInfo> BuiltInModes => NativeHaggleModeCatalog.GetBuiltIns();
}

public sealed class NativeHaggleEngine
{
    private readonly record struct PlanetTradeQualityEntry(int Threshold, int Mcic, int Multiple);

    private readonly record struct PlanetTradeProductModel(
        long BaseValue,
        int BasePercent,
        int BasePercentInverse,
        int FallbackPortMax,
        PlanetTradeQualityEntry[] QualityTable);

    internal sealed class Candidate
    {
        public int Mcic { get; set; }
        public int BaseVar { get; set; }
        public double Variance { get; set; }
        public int Productivity { get; set; }
        public double ExactPrice { get; set; }
    }

    internal sealed class SessionState
    {
        public int Sector { get; set; }
        public string RouteKey { get; set; } = string.Empty;
        public string ActiveMode { get; set; } = string.Empty;
        public string ActiveModeDisplayName { get; set; } = string.Empty;
        public string Weekday { get; set; } = "Sat";
        public bool IsPlanetTrade { get; set; }
        public string ProductKey { get; set; } = string.Empty;
        public ProductType ProductType { get; set; }
        public string BuySell { get; set; } = string.Empty; // Port perspective: SELLING or BUYING
        public int PortQty { get; set; }
        public int Percent { get; set; }
        public int TradeQty { get; set; }
        public int Experience { get; set; } = 1000;
        public int PlusMinus { get; set; }
        public int McicStep { get; set; }
        public double BasePrice { get; set; }
        public double ProductFactor { get; set; }
        public int BaseVarMin { get; set; }
        public int BaseVarMax { get; set; }
        public int LowProductivity { get; set; }
        public int HighProductivity { get; set; }
        public int CalculatedLowProductivity { get; set; }
        public int MaxProductivity { get; set; }
        public int DefaultMcicMin { get; set; }
        public int DefaultMcicMax { get; set; }
        public int McicMin { get; set; }
        public int McicMax { get; set; }
        public int DeriveFailures { get; set; }
        public bool UseLowPercentDerive { get; set; }
        public int BidNumber { get; set; }
        public long LastCounter { get; set; }
        public long LastOffer { get; set; }
        public bool FinalOffer { get; set; }
        public bool HeuristicFallback { get; set; }
        public long StartCredits { get; set; }
        public int StartEmptyHolds { get; set; }
        public int StartFuelOre { get; set; }
        public int StartOrganics { get; set; }
        public int StartEquipment { get; set; }
        public int StartProductQty { get; set; }
        public DateTime PortReportUpdate { get; set; }
        public double PortReportAgeDays { get; set; }
        public int PortMaxQty { get; set; }
        public int PlanetTradeSettingPercent { get; set; } = 100;
        public int PlanetQualityMcic { get; set; }
        public int PlanetQualityMultiple { get; set; }
        public int PlanetPortMaxInit { get; set; }
        public int PlanetMidHaggles { get; set; }
        public bool PlanetForceFailApplied { get; set; }
        public double PlanetSolvedFactor { get; set; }
        public double PlanetSolvedHiddenMin { get; set; }
        public double PlanetSolvedHiddenMax { get; set; }
        public int PlanetSolvedMcic { get; set; }
        public long PendingBid { get; set; }
        public long PendingBidOffer { get; set; }
        public bool PendingBidFinalOffer { get; set; }
        public bool OutcomeRecorded { get; set; }
        public string RewardTier { get; set; } = string.Empty;
        public int RewardExperience { get; set; }
        public bool PlanetAcceptanceSeen { get; set; }
        public int FinalTargetNudgeApplied { get; set; }
        public bool FirstOfferExactHitApplied { get; set; }
        public bool EmpiricalProbeApplied { get; set; }
        public int EmpiricalProbeNudge { get; set; }
        public double HiddenTotalMin { get; set; }
        public double HiddenTotalMax { get; set; }
        public int HiddenTotalAppliedBidNumber { get; set; }
        public List<Candidate> Candidates { get; } = new();

        public bool HasHiddenTotalRange => HiddenTotalMin > 0 && HiddenTotalMax > 0 && HiddenTotalMin <= HiddenTotalMax;
    }

    private sealed class RetryHint
    {
        public int Sector { get; set; }
        public bool IsPlanetTrade { get; set; }
        public string ProductKey { get; set; } = string.Empty;
        public string BuySell { get; set; } = string.Empty;
    }

    private sealed class PlanetTradeRunState
    {
        public int Sector { get; set; } = -1;
        public int OreSellFailures { get; set; }
        public int OrgSellFailures { get; set; }
        public int EquSellFailures { get; set; }
        public bool ThisOreFailed { get; set; }
        public bool ThisOrgFailed { get; set; }
        public bool ThisEquFailed { get; set; }
    }

    internal enum ServerProbeBranch
    {
        HiddenOverBid,
        BidOverHidden,
        Overlap,
    }

    private static readonly PlanetTradeQualityEntry[] FuelOrePlanetQualityTable = ParsePlanetQualityTable(
        """
        436,-90,1494
        434,-89,1488
        433,-88,1482
        431,-87,1476
        429,-86,1470
        427,-85,1464
        425,-84,1458
        424,-83,1452
        422,-82,1446
        420,-81,1440
        418,-80,1434
        416,-79,1428
        414,-78,1423
        412,-77,1417
        411,-76,1411
        409,-75,1405
        407,-74,1399
        405,-73,1393
        403,-72,1387
        401,-71,1381
        399,-70,1375
        397,-69,1369
        396,-68,1363
        394,-67,1357
        392,-66,1351
        390,-65,1345
        388,-64,1341
        386,-63,1336
        384,-62,1330
        382,-61,1324
        380,-60,1318
        378,-59,1312
        376,-58,1306
        374,-57,1300
        372,-56,1294
        370,-55,1291
        368,-54,1285
        366,-53,1279
        364,-52,1273
        362,-51,1267
        360,-50,1261
        358,-49,1255
        356,-48,1249
        354,-46,1246
        352,-46,1240
        350,-45,1234
        348,-44,1228
        346,-43,1222
        344,-42,1219
        342,-41,1209
        340,-40,1208
        """);

    private static readonly PlanetTradeQualityEntry[] OrganicsPlanetQualityTable = ParsePlanetQualityTable(
        """
        813,-75,1405
        810,-74,1399
        806,-73,1393
        802,-72,1387
        798,-71,1381
        795,-70,1375
        791,-69,1369
        787,-68,1363
        783,-67,1357
        779,-66,1351
        775,-65,1345
        772,-64,1339
        768,-63,1336
        764,-62,1330
        760,-61,1324
        756,-60,1318
        752,-59,1312
        748,-58,1306
        744,-57,1300
        740,-56,1294
        737,-55,1291
        733,-54,1285
        729,-53,1279
        725,-52,1273
        721,-51,1267
        717,-50,1261
        713,-49,1255
        709,-48,1252
        705,-47,1246
        701,-46,1236
        697,-45,1233
        693,-44,1227
        688,-43,1224
        684,-42,1214
        680,-41,1213
        676,-40,1203
        672,-39,1200
        668,-38,1194
        664,-37,1191
        660,-36,1181
        656,-35,1178
        651,-34,1172
        647,-33,1166
        643,-32,1160
        639,-31,1157
        635,-30,1154
        """);

    private static readonly PlanetTradeQualityEntry[] EquipmentPlanetQualityTable = ParsePlanetQualityTable(
        """
        1393,-65,1347
        1386,-64,1341
        1379,-63,1336
        1372,-62,1330
        1365,-61,1324
        1358,-60,1319
        1351,-59,1313
        1344,-58,1307
        1337,-57,1302
        1329,-56,1296
        1323,-55,1291
        1315,-54,1285
        1308,-53,1279
        1301,-52,1274
        1294,-51,1268
        1287,-50,1262
        1279,-49,1254
        1272,-48,1247
        1265,-47,1246
        1258,-46,1241
        1251,-45,1235
        1243,-44,1229
        1236,-43,1224
        1229,-42,1218
        1221,-41,1213
        1214,-40,1208
        1206,-39,1201
        1199,-38,1196
        1192,-37,1190
        1184,-36,1185
        1177,-35,1180
        1169,-34,1174
        1162,-33,1169
        1154,-32,1164
        1147,-31,1158
        1139,-30,1152
        1132,-29,1149
        1124,-28,1144
        1116,-27,1136
        1109,-26,1132
        1101,-25,1126
        1093,-24,1122
        1086,-23,1117
        1078,-22,1110
        1071,-21,1105
        1063,-20,1102
        """);

    private static readonly PlanetTradeProductModel FuelOrePlanetProductModel = new(
        BaseValue: 256055800,
        BasePercent: 11725,
        BasePercentInverse: 88275,
        FallbackPortMax: 340,
        QualityTable: FuelOrePlanetQualityTable);

    private static readonly PlanetTradeProductModel OrganicsPlanetProductModel = new(
        BaseValue: 506276400,
        BasePercent: 11287,
        BasePercentInverse: 88713,
        FallbackPortMax: 635,
        QualityTable: OrganicsPlanetQualityTable);

    private static readonly PlanetTradeProductModel EquipmentPlanetProductModel = new(
        BaseValue: 906281000,
        BasePercent: 10989,
        BasePercentInverse: 89010,
        FallbackPortMax: 1063,
        QualityTable: EquipmentPlanetQualityTable);

    private static readonly Regex RxCommandPrompt = new(@"command \[tl=", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex RxCommerceReport = new(
        @"^Commerce report for .+?:\s+\d{1,2}:\d{2}:\d{2}\s+(?:AM|PM)\s+([A-Za-z]{3,5})\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex RxCredits = new(
        @"^You have ([\d,]+) credits(?: and (\d+) empty cargo holds)?\.",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex RxExpGain = new(
        @"receive (\d+) experience point",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex RxTradeSuccess = new(
        @"^For your (good|great|excellent) trading you receive ([\d,]+) experience point",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex RxPlanetAccepted = new(
        @"(?:you drive a hard bargain, but )?we'?ll take them\.",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly string[] TerminalTradeRejectionPhrases =
    {
        "We're not interested.",
        "go peddle your wares somewhere else",
        "as stupid as you look, get lost",
        "Thats insane",
        "Get lost creep",
        "you'd better leave if you value your life",
    };
    private static readonly Regex RxHoldPrompt = new(
        @"^How many (holds|units) of (Fuel Ore|Organics|Equipment) do you want to (buy|sell) \[(\d+)\]\?",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex RxAgreed = new(
        @"^Agreed,\s+([\d,]+)\s+units\.",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex RxSellOffer = new(
        @"^We'll sell them for ([\d,]+) credits\.",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex RxBuyOffer = new(
        @"^We'll buy them for ([\d,]+) credits\.",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex RxFinalOffer = new(
        @"^Our final offer is ([\d,]+) credits\.",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex RxYourOfferPrompt = new(
        @"^Your offer \[([\d,]+)\]\s*\?",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private readonly ShipInfoParser _shipInfoParser = new();
    private ShipStatus _shipStatus = new();
    private SessionState? _session;
    private string? _pendingProductKey;
    private ProductType _pendingProductType;
    private string? _pendingBuySell;
    private bool _pendingIsPlanetTrade;
    private bool _awaitingTradeQtyReply;
    private long _lastKnownCredits;
    private bool _hasLastKnownCredits;
    private int _lastKnownEmptyHolds;
    private bool _hasLastKnownEmptyHolds;
    private int _lastKnownExperience = 1000;
    private bool _tradeSuppressed;
    private RetryHint? _retryHint;
    private int _completedHaggles;
    private int _successfulHaggles;
    private int _goodRewardCount;
    private int _greatRewardCount;
    private int _excellentRewardCount;
    private string _portBidMode = NativeHaggleModes.Default;
    private string _planetBidMode = NativeHaggleModes.DefaultPlanet;
    private readonly Dictionary<string, NativeHaggleModeExtension> _extensionModes = new(StringComparer.OrdinalIgnoreCase);
    private readonly NativeHaggleAggressiveMode _aggressiveMode = new();
    private readonly PlanetTradeRunState _planetTradeRunState = new();
    private string? _lastMissingPortModeId;
    private string? _lastMissingPlanetModeId;

    public event Action? StatsChanged;

    public int CompletedHaggles => _completedHaggles;

    public int SuccessfulHaggles => _successfulHaggles;

    public int GoodRewardCount => _goodRewardCount;

    public int GreatRewardCount => _greatRewardCount;

    public int ExcellentRewardCount => _excellentRewardCount;

    public int SuccessRatePercent =>
        _completedHaggles <= 0
            ? 0
            : (int)Math.Round((_successfulHaggles * 100.0) / _completedHaggles, MidpointRounding.AwayFromZero);

    public string FirstBidMode => _portBidMode;

    public string PortHaggleMode => _portBidMode;

    public string PlanetHaggleMode => _planetBidMode;

    public IReadOnlyList<NativeHaggleModeInfo> AvailableModes => AvailablePortModes;

    public IReadOnlyList<NativeHaggleModeInfo> AvailablePortModes =>
        NativeHaggleModeCatalog.GetAvailableModes(_extensionModes.Values, NativeHaggleTradeKind.Port);

    public IReadOnlyList<NativeHaggleModeInfo> AvailablePlanetModes =>
        NativeHaggleModeCatalog.GetAvailableModes(_extensionModes.Values, NativeHaggleTradeKind.Planet);

    public NativeHaggleEngine()
    {
        _shipInfoParser.Updated += status =>
        {
            _shipStatus = CloneStatus(status);
            if (_shipStatus.Credits >= 0)
            {
                _lastKnownCredits = _shipStatus.Credits;
                _hasLastKnownCredits = true;
            }
            if (_shipStatus.HoldsEmpty >= 0)
            {
                _lastKnownEmptyHolds = (int)_shipStatus.HoldsEmpty;
                _hasLastKnownEmptyHolds = true;
            }
            if (_shipStatus.Experience > 0)
                _lastKnownExperience = (int)_shipStatus.Experience;
        };
    }

    public bool Enabled { get; private set; }

    public event Action<bool>? EnabledChanged;

    public void SetEnabled(bool enabled)
    {
        if (Enabled == enabled)
            return;

        Enabled = enabled;
        if (!enabled)
            Reset("disabled");
        EnabledChanged?.Invoke(enabled);
    }

    public bool Toggle()
    {
        SetEnabled(!Enabled);
        return Enabled;
    }

    public void SetFirstBidMode(string? mode) => SetPortHaggleMode(mode);

    public void SetPortHaggleMode(string? mode)
    {
        _portBidMode = string.IsNullOrWhiteSpace(mode)
            ? NativeHaggleModes.Default
            : NativeHaggleModes.Normalize(mode);
    }

    public void SetPlanetHaggleMode(string? mode)
    {
        _planetBidMode = string.IsNullOrWhiteSpace(mode)
            ? NativeHaggleModes.DefaultPlanet
            : NativeHaggleModes.Normalize(mode);
    }

    internal void RegisterMode(NativeHaggleModeExtension mode)
    {
        string modeId = NativeHaggleModes.Normalize(mode.ModeInfo.Id);
        _extensionModes[modeId] = mode;
        if (string.Equals(_lastMissingPortModeId, modeId, StringComparison.OrdinalIgnoreCase))
            _lastMissingPortModeId = null;
        if (string.Equals(_lastMissingPlanetModeId, modeId, StringComparison.OrdinalIgnoreCase))
            _lastMissingPlanetModeId = null;
    }

    internal void UnregisterMode(string? modeId)
    {
        string normalized = NativeHaggleModes.Normalize(modeId);
        _extensionModes.Remove(normalized);
    }

    public static bool IsOfferLine(string line)
    {
        if (string.IsNullOrWhiteSpace(line))
            return false;

        return RxSellOffer.IsMatch(line) ||
               RxBuyOffer.IsMatch(line) ||
               RxFinalOffer.IsMatch(line);
    }

    public string? HandleLine(string line)
    {
        if (string.IsNullOrWhiteSpace(line))
            return null;

        _shipInfoParser.FeedLine(line);
        bool shouldTrackPassiveTradeState =
            Enabled ||
            _session != null ||
            !string.IsNullOrWhiteSpace(_pendingProductKey) ||
            !string.IsNullOrWhiteSpace(_pendingBuySell);
        if (shouldTrackPassiveTradeState)
            UpdatePassiveState(line);

        if (RxCommandPrompt.IsMatch(line))
        {
            Reset("command-prompt");
            return null;
        }

        if (!Enabled)
            return null;

        if (_tradeSuppressed)
            return null;

        if (IsTerminalTradeRejection(line))
        {
            CompleteTradeAsRejected(line);
            return null;
        }

        if (line.Equals("<Port>", StringComparison.OrdinalIgnoreCase) ||
            line.StartsWith("Docking...", StringComparison.OrdinalIgnoreCase))
        {
            StartPortSession();
            return null;
        }

        Match commerceMatch = RxCommerceReport.Match(line);
        if (commerceMatch.Success)
        {
            EnsureSession();
            if (_session != null)
                _session.Weekday = NormalizeWeekday(commerceMatch.Groups[1].Value);
            return null;
        }

        Match holdMatch = RxHoldPrompt.Match(line);
        if (holdMatch.Success)
        {
            ParseHoldPrompt(holdMatch, line);
            return null;
        }

        Match agreedMatch = RxAgreed.Match(line);
        if (agreedMatch.Success)
        {
            ArmSession(ParseInt(agreedMatch.Groups[1].Value));
            return null;
        }

        Match initialSell = RxSellOffer.Match(line);
        if (initialSell.Success)
        {
            GlobalModules.DebugLog($"[NativeHaggle] Offer line SELLING: '{line}'\n");
            WriteTradeDebug(_session, $"[NativeHaggle] TEXT offerKind=SELLING text='{line}'\n");
            return HandleOffer(ParseLong(initialSell.Groups[1].Value), "SELLING", finalOffer: false);
        }

        Match initialBuy = RxBuyOffer.Match(line);
        if (initialBuy.Success)
        {
            GlobalModules.DebugLog($"[NativeHaggle] Offer line BUYING: '{line}'\n");
            WriteTradeDebug(_session, $"[NativeHaggle] TEXT offerKind=BUYING text='{line}'\n");
            return HandleOffer(ParseLong(initialBuy.Groups[1].Value), "BUYING", finalOffer: false);
        }

        Match finalMatch = RxFinalOffer.Match(line);
        if (finalMatch.Success)
        {
            GlobalModules.DebugLog($"[NativeHaggle] Offer line FINAL: '{line}'\n");
            WriteTradeDebug(_session, $"[NativeHaggle] TEXT offerKind=FINAL text='{line}'\n");
            return HandleOffer(ParseLong(finalMatch.Groups[1].Value), _session?.BuySell ?? string.Empty, finalOffer: true);
        }

        Match promptMatch = RxYourOfferPrompt.Match(line);
        if (promptMatch.Success)
        {
            return HandleOfferPrompt(ParseLong(promptMatch.Groups[1].Value));
        }

        return null;
    }

    public void SuppressCurrentTrade(string reason)
    {
        if (_tradeSuppressed)
        {
            GlobalModules.DebugLog($"[NativeHaggle] SuppressCurrentTrade('{reason}') ignored because trade is already suppressed.\n");
            return;
        }

        if (!HasMeaningfulActiveTrade())
        {
            GlobalModules.DebugLog($"[NativeHaggle] SuppressCurrentTrade('{reason}') ignored because no trade is active.\n");
            return;
        }

        _tradeSuppressed = true;
        GlobalModules.DebugLog($"[NativeHaggle] Suppressing current trade due to '{reason}'.\n");
        ClearTradeState();
    }

    public void ObserveScriptSend(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return;

        if (_tradeSuppressed)
            return;

        if (AllowScriptTradeQuantityReply(text))
            return;

        if (AllowScriptTradeSetupSend(text))
            return;

        if (!HasMeaningfulActiveTrade())
        {
            return;
        }

        string escaped = text.Replace("\r", "\\r", StringComparison.Ordinal)
            .Replace("\n", "\\n", StringComparison.Ordinal);
        GlobalModules.DebugLog($"[NativeHaggle] Observed script send during active trade: '{escaped}'\n");
        SuppressCurrentTrade("script-send");
    }

    private bool AllowScriptTradeSetupSend(string text)
    {
        if (!HasMeaningfulActiveTrade())
            return false;

        bool preOfferPending =
            _awaitingTradeQtyReply ||
            !string.IsNullOrWhiteSpace(_pendingProductKey) ||
            !string.IsNullOrWhiteSpace(_pendingBuySell);

        bool armedButNoOfferSeen =
            _session != null &&
            !string.IsNullOrWhiteSpace(_session.ProductKey) &&
            !string.IsNullOrWhiteSpace(_session.BuySell) &&
            _session.BidNumber == 0 &&
            _session.LastOffer == 0 &&
            _session.PendingBid == 0 &&
            _session.PendingBidOffer == 0 &&
            !_session.FinalOffer;

        if (!preOfferPending && !armedButNoOfferSeen)
            return false;

        string escaped = text.Replace("\r", "\\r", StringComparison.Ordinal)
            .Replace("\n", "\\n", StringComparison.Ordinal);
        GlobalModules.DebugLog($"[NativeHaggle] Allowing pre-offer script send: '{escaped}'\n");
        return true;
    }

    private bool HasMeaningfulActiveTrade()
    {
        if (!string.IsNullOrWhiteSpace(_pendingProductKey) ||
            !string.IsNullOrWhiteSpace(_pendingBuySell) ||
            _awaitingTradeQtyReply)
        {
            return true;
        }

        if (_session == null)
            return false;

        return !string.IsNullOrWhiteSpace(_session.ProductKey) ||
               !string.IsNullOrWhiteSpace(_session.BuySell) ||
               _session.BidNumber > 0 ||
               _session.LastCounter > 0 ||
               _session.LastOffer > 0 ||
               _session.PendingBid > 0 ||
               _session.PendingBidOffer > 0 ||
               _session.FinalOffer ||
               _session.PlanetAcceptanceSeen;
    }

    private static void WriteTradeDebug(bool isPlanetTrade, string message)
    {
        if (isPlanetTrade)
            GlobalModules.PlanetHaggleDebug(message);
        else
            GlobalModules.PortHaggleDebug(message);
    }

    private static void WriteTradeDebug(SessionState? session, string message)
    {
        if (session == null)
            return;

        WriteTradeDebug(session.IsPlanetTrade, message);
    }

    private void UpdatePassiveState(string line)
    {
        Match tradeSuccessMatch = RxTradeSuccess.Match(line);
        if (tradeSuccessMatch.Success)
        {
            if (_session?.IsPlanetTrade == true)
            {
                GlobalModules.DebugLog($"[NativeHaggle] Ignoring unexpected planet reward line text='{line}'\n");
                WriteTradeDebug(_session, $"[NativeHaggle] TEXT unexpectedReward text='{line}'\n");
                return;
            }

            string rewardTier = tradeSuccessMatch.Groups[1].Value.Trim().ToLowerInvariant();
            int rewardExperience = ParseInt(tradeSuccessMatch.Groups[2].Value);
            if (_session != null)
            {
                _session.RewardTier = rewardTier;
                _session.RewardExperience = rewardExperience;
            }

            switch (rewardTier)
            {
                case "excellent":
                    _excellentRewardCount++;
                    break;
                case "great":
                    _greatRewardCount++;
                    break;
                case "good":
                    _goodRewardCount++;
                    break;
            }

            GlobalModules.DebugLog(
                $"[NativeHaggle] Reward line tier='{rewardTier}' exp={rewardExperience} text='{line}'\n");
            WriteTradeDebug(_session, $"[NativeHaggle] TEXT reward tier='{rewardTier}' exp={rewardExperience} text='{line}'\n");
            RecordOutcome(success: true, $"trade-success-line:{rewardTier}");
        }

        Match creditsMatch = RxCredits.Match(line);
        if (creditsMatch.Success)
        {
            long credits = ParseLong(creditsMatch.Groups[1].Value);
            int emptyHolds = creditsMatch.Groups[2].Success
                ? ParseInt(creditsMatch.Groups[2].Value)
                : ResolveStartingEmptyHolds();
            _lastKnownCredits = credits;
            _hasLastKnownCredits = true;
            _lastKnownEmptyHolds = emptyHolds;
            _hasLastKnownEmptyHolds = true;
            ProcessCreditsLine(credits, emptyHolds);
            return;
        }

        if (_session != null && _session.IsPlanetTrade && RxPlanetAccepted.IsMatch(line))
        {
            _session.PlanetAcceptanceSeen = true;
            GlobalModules.DebugLog($"[NativeHaggle] Planet acceptance line text='{line}'\n");
            WriteTradeDebug(_session, $"[NativeHaggle] TEXT accept text='{line}'\n");
            return;
        }

        Match expMatch = RxExpGain.Match(line);
        if (expMatch.Success)
        {
            _lastKnownExperience += ParseInt(expMatch.Groups[1].Value);
        }
    }

    private void StartPortSession()
    {
        _session = new SessionState
        {
            Sector = GlobalModules.GlobalAutoRecorder.CurrentSector,
            Weekday = "Sat",
        };
        _pendingProductKey = null;
        _pendingBuySell = null;
        _pendingIsPlanetTrade = false;
    }

    private void EnsureSession()
    {
        if (_session == null)
            StartPortSession();
    }

    private void ParseHoldPrompt(Match holdMatch, string line)
    {
        EnsureSession();
        _pendingIsPlanetTrade = string.Equals(holdMatch.Groups[1].Value, "units", StringComparison.OrdinalIgnoreCase);
        _pendingProductKey = ProductKeyFromPrompt(holdMatch.Groups[2].Value);
        _pendingProductType = ProductTypeFromKey(_pendingProductKey);
        string action = holdMatch.Groups[3].Value.ToUpperInvariant();
        _pendingBuySell = action == "BUY" ? "SELLING" : "BUYING";
        _awaitingTradeQtyReply = true;
        WriteTradeDebug(
            _pendingIsPlanetTrade,
            $"[NativeHaggle] PROMPT product={_pendingProductKey} action={action} text='{line}'\n");
    }

    private void ArmSession(int tradeQty)
    {
        EnsureSession();
        if (_session == null || string.IsNullOrEmpty(_pendingProductKey) || string.IsNullOrEmpty(_pendingBuySell))
            return;

        _awaitingTradeQtyReply = false;

        ModDatabase? db = ScriptRef.GetActiveDatabase();
        int sector = GlobalModules.GlobalAutoRecorder.CurrentSector;
        SectorData? sectorData = db?.GetSector(sector);
        Port? port = sectorData?.SectorPort;
        if (port == null)
        {
            GlobalModules.DebugLog(
                $"[NativeHaggle] No port data for sector {sector}, manual haggle required. dbSectorCount={db?.SectorCount ?? -1} sectorFound={(sectorData != null ? 1 : 0)}\n");
            WriteTradeDebug(
                _pendingIsPlanetTrade,
                $"[NativeHaggle] ABORT missing-port-data sector={sector} product={_pendingProductKey ?? "-"} buysell={_pendingBuySell ?? "-"} dbSectorCount={db?.SectorCount ?? -1} sectorFound={(sectorData != null ? 1 : 0)}\n");
            Reset("missing-port-data");
            return;
        }

        _session.Sector = sector;
        _session.IsPlanetTrade = _pendingIsPlanetTrade;
        _session.ProductKey = _pendingProductKey;
        _session.ProductType = _pendingProductType;
        _session.BuySell = _pendingBuySell;
        _session.RouteKey = BuildRouteKey(sector, _pendingProductKey, _pendingBuySell, _pendingIsPlanetTrade);
        _session.ActiveMode = GetActiveHaggleMode(_pendingIsPlanetTrade);
        _session.ActiveModeDisplayName = NativeHaggleModeCatalog.GetDisplayName(_session.ActiveMode, _extensionModes.Values);
        _session.TradeQty = tradeQty;
        _session.PortQty = port.ProductAmount.GetValueOrDefault(_pendingProductType);
        _session.Percent = port.ProductPercent.GetValueOrDefault(_pendingProductType);
        _session.PortReportUpdate = port.Update;
        _session.PortReportAgeDays = port.Update == default
            ? 0
            : Math.Max(0, (DateTime.Now - port.Update).TotalDays);
        _session.PortMaxQty = 0;
        _session.Experience = ResolveExperience();
        _session.BidNumber = 0;
        _session.LastCounter = 0;
        _session.LastOffer = 0;
        _session.FinalOffer = false;
        _session.HeuristicFallback = false;
        _session.DeriveFailures = 0;
        _session.PendingBid = 0;
        _session.PendingBidOffer = 0;
        _session.PendingBidFinalOffer = false;
        _session.OutcomeRecorded = false;
        _session.FinalTargetNudgeApplied = 0;
        _session.FirstOfferExactHitApplied = false;
        _session.RewardTier = string.Empty;
        _session.RewardExperience = 0;
        _session.PlanetAcceptanceSeen = false;
        _session.PlanetSolvedFactor = 0;
        _session.PlanetSolvedHiddenMin = 0;
        _session.PlanetSolvedHiddenMax = 0;
        _session.PlanetSolvedMcic = 0;
        _session.EmpiricalProbeApplied = false;
        _session.EmpiricalProbeNudge = 0;
        _session.HiddenTotalMin = 0;
        _session.HiddenTotalMax = 0;
        _session.HiddenTotalAppliedBidNumber = 0;
        _session.StartCredits = ResolveStartingCredits();
        _session.StartEmptyHolds = ResolveStartingEmptyHolds();
        _session.StartFuelOre = (int)_shipStatus.FuelOre;
        _session.StartOrganics = (int)_shipStatus.Organics;
        _session.StartEquipment = (int)_shipStatus.Equipment;
        _session.StartProductQty = ResolveShipProductQty(_pendingProductType);
        _session.Candidates.Clear();

        PushScriptState(_session.StartCredits, abort: false);

        if (_session.IsPlanetTrade)
        {
            EnsurePlanetTradeVisitState(_session.Sector);
            _session.PlanetTradeSettingPercent = ResolvePlanetTradeSettingPercent();
            if (UsesCherokeePlanetBaseline(_session))
            {
                GlobalModules.DebugLog(
                    $"[NativeHaggle] Armed sector={_session.Sector} tradeKind=planet product={_session.ProductKey} buysell={_session.BuySell} activeMode={_session.ActiveMode} activeModeName='{_session.ActiveModeDisplayName}' baseline=cherokee qty={_session.TradeQty} portQty={_session.PortQty} percent={_session.Percent} ptrade={_session.PlanetTradeSettingPercent} exp={_session.Experience} weekday={_session.Weekday} {DescribeStartCargoSnapshot(_session)}\n");
                WriteTradeDebug(_session,
                    $"[NativeHaggle] ARMED route={_session.RouteKey} mode={_session.ActiveMode} modeName='{_session.ActiveModeDisplayName}' baseline=cherokee qty={_session.TradeQty} portQty={_session.PortQty} percent={_session.Percent} ptrade={_session.PlanetTradeSettingPercent}\n");
            }
            else
            {
                GlobalModules.DebugLog(
                    $"[NativeHaggle] Armed sector={_session.Sector} tradeKind=planet product={_session.ProductKey} buysell={_session.BuySell} activeMode={_session.ActiveMode} activeModeName='{_session.ActiveModeDisplayName}' baseline=module qty={_session.TradeQty} portQty={_session.PortQty} percent={_session.Percent} ptrade={_session.PlanetTradeSettingPercent} exp={_session.Experience} weekday={_session.Weekday} {DescribeStartCargoSnapshot(_session)}\n");
                WriteTradeDebug(_session,
                    $"[NativeHaggle] ARMED route={_session.RouteKey} mode={_session.ActiveMode} modeName='{_session.ActiveModeDisplayName}' baseline=module qty={_session.TradeQty} portQty={_session.PortQty} percent={_session.Percent} ptrade={_session.PlanetTradeSettingPercent}\n");
            }
            return;
        }

        ConfigureProductConstants(_session);
        if (!PrepareRanges(_session, db))
        {
            Reset("unable-to-prepare");
            return;
        }
        _session.PortMaxQty = Math.Max(_session.PortQty, _session.MaxProductivity * 10);

        if (RetryHintMatches(_session))
        {
            _session.HeuristicFallback = true;
            GlobalModules.DebugLog(
                $"[NativeHaggle] Using heuristic-first retry mode for sector={_session.Sector} product={_session.ProductKey} buysell={_session.BuySell}\n");
        }
        else if (_retryHint != null)
        {
            _retryHint = null;
        }

        GlobalModules.DebugLog(
            $"[NativeHaggle] Armed sector={_session.Sector} tradeKind={(_session.IsPlanetTrade ? "planet" : "port")} product={_session.ProductKey} buysell={_session.BuySell} activeMode={_session.ActiveMode} activeModeName='{_session.ActiveModeDisplayName}' qty={_session.TradeQty} portQty={_session.PortQty} percent={_session.Percent} portMaxQty={_session.PortMaxQty} reportAgeHours={_session.PortReportAgeDays * 24.0:0.00} exp={_session.Experience} weekday={_session.Weekday} lowProd={_session.LowProductivity} highProd={_session.HighProductivity} mcicMin={_session.McicMin} mcicMax={_session.McicMax} {DescribeStartCargoSnapshot(_session)}\n");
        WriteTradeDebug(_session,
            $"[NativeHaggle] ARMED route={_session.RouteKey} mode={_session.ActiveMode} modeName='{_session.ActiveModeDisplayName}' qty={_session.TradeQty} portQty={_session.PortQty} percent={_session.Percent} mcic={_session.McicMin}..{_session.McicMax} prod={_session.LowProductivity}..{_session.HighProductivity}\n");
    }

    private void ProcessCreditsLine(long credits, int emptyHolds)
    {
        if (_session == null)
            return;

        PushScriptState(credits, abort: false);

        bool attemptedTrade = _session.BidNumber > 0 || _session.LastCounter > 0;
        if (!attemptedTrade)
            return;

        if (_session.OutcomeRecorded)
        {
            if (RetryHintMatches(_session))
                _retryHint = null;
            return;
        }

        bool success = IsSuccessfulTrade(_session, credits, emptyHolds);
        if (success)
        {
            if (_session.IsPlanetTrade)
            {
                _session.PlanetAcceptanceSeen = true;
                if (RetryHintMatches(_session))
                    _retryHint = null;

                GlobalModules.DebugLog(
                    $"[NativeHaggle] Planet success finalized on credits line sector={_session.Sector} product={_session.ProductKey} buysell={_session.BuySell} credits={credits} emptyHolds={emptyHolds}\n");
                WriteTradeDebug(_session,
                    $"[NativeHaggle] TEXT credits success credits={credits} emptyHolds={emptyHolds}\n");
                RecordOutcome(success: true, "credits-line:planet-accepted");
                return;
            }

            if (RetryHintMatches(_session))
                _retryHint = null;
            return;
        }

        GlobalModules.DebugLog(
            $"[NativeHaggle] No transaction detected sector={_session.Sector} product={_session.ProductKey} buysell={_session.BuySell} startCredits={_session.StartCredits} endCredits={credits} startEmpty={_session.StartEmptyHolds} endEmpty={emptyHolds} bidNumber={_session.BidNumber} lastOffer={_session.LastOffer} lastCounter={_session.LastCounter} {DescribeStartCargoSnapshot(_session)}\n");
        WriteTradeDebug(_session,
            $"[NativeHaggle] TEXT no-transaction endCredits={credits} emptyHolds={emptyHolds} bidNumber={_session.BidNumber} lastOffer={_session.LastOffer} lastCounter={_session.LastCounter}\n");
        if (_session.BidNumber <= 1)
        {
            _retryHint = new RetryHint
            {
                Sector = _session.Sector,
                IsPlanetTrade = _session.IsPlanetTrade,
                ProductKey = _session.ProductKey,
                BuySell = _session.BuySell,
            };
            GlobalModules.DebugLog(
                $"[NativeHaggle] Recorded retry hint for sector={_session.Sector} product={_session.ProductKey} buysell={_session.BuySell}\n");
        }
        RecordOutcome(success: false, "credits-no-transaction");
        PushScriptState(credits, abort: true);
    }

    private static bool IsSuccessfulTrade(SessionState session, long credits, int emptyHolds)
    {
        if (string.Equals(session.BuySell, "SELLING", StringComparison.OrdinalIgnoreCase))
        {
            return credits < session.StartCredits || emptyHolds < session.StartEmptyHolds;
        }

        if (string.Equals(session.BuySell, "BUYING", StringComparison.OrdinalIgnoreCase))
        {
            return credits > session.StartCredits || emptyHolds > session.StartEmptyHolds;
        }

        return true;
    }

    private bool RetryHintMatches(SessionState session)
    {
        if (_retryHint == null)
            return false;

        return _retryHint.Sector == session.Sector &&
               _retryHint.IsPlanetTrade == session.IsPlanetTrade &&
               string.Equals(_retryHint.ProductKey, session.ProductKey, StringComparison.OrdinalIgnoreCase) &&
               string.Equals(_retryHint.BuySell, session.BuySell, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsTerminalTradeRejection(string line)
    {
        foreach (string phrase in TerminalTradeRejectionPhrases)
        {
            if (line.Contains(phrase, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private void CompleteTradeAsRejected(string line)
    {
        if (_session == null)
        {
            Reset("trade-rejected");
            return;
        }

        GlobalModules.DebugLog(
            $"[NativeHaggle] Terminal rejection line sector={_session.Sector} product={_session.ProductKey} text='{line}'\n");
        WriteTradeDebug(_session, $"[NativeHaggle] TEXT reject text='{line}'\n");

        if (!_session.OutcomeRecorded)
            RecordOutcome(success: false, "trade-rejected");

        PushScriptState(ResolveScriptStateCredits(), abort: true);
        Reset("trade-rejected");
    }

    private long ResolveScriptStateCredits()
    {
        if (_hasLastKnownCredits)
            return _lastKnownCredits;
        if (_session != null)
            return _session.StartCredits;
        if (_shipStatus.Credits >= 0)
            return _shipStatus.Credits;
        return 0;
    }

    private void PushScriptState(long credits, bool abort)
    {
        ScriptRef.SetVarOnActiveScripts("$HAGGLE~CREDITS", credits.ToString(CultureInfo.InvariantCulture));
        ScriptRef.SetVarOnActiveScripts("$HAGGLE~ABORT", abort ? "1" : "0");

        if (_session != null &&
            TryGetPersistableMcicRange(_session, out int minMcic, out int maxMcic, out int representativeMcic))
        {
            ScriptRef.SetVarOnActiveScripts("$HAGGLE~MCIC", representativeMcic.ToString(CultureInfo.InvariantCulture));
            ScriptRef.SetVarOnActiveScripts("$HAGGLE~MCIC_MIN", minMcic.ToString(CultureInfo.InvariantCulture));
            ScriptRef.SetVarOnActiveScripts("$HAGGLE~MCIC_MAX", maxMcic.ToString(CultureInfo.InvariantCulture));
        }
        else
        {
            ScriptRef.SetVarOnActiveScripts("$HAGGLE~MCIC", string.Empty);
            ScriptRef.SetVarOnActiveScripts("$HAGGLE~MCIC_MIN", string.Empty);
            ScriptRef.SetVarOnActiveScripts("$HAGGLE~MCIC_MAX", string.Empty);
        }
    }

    private long ResolveStartingCredits()
    {
        if (_hasLastKnownCredits)
            return _lastKnownCredits;
        if (_shipStatus.Credits >= 0)
            return _shipStatus.Credits;
        return 0;
    }

    private int ResolveStartingEmptyHolds()
    {
        if (_hasLastKnownEmptyHolds)
            return _lastKnownEmptyHolds;
        if (_shipStatus.HoldsEmpty >= 0)
            return (int)_shipStatus.HoldsEmpty;

        long totalCargo = _shipStatus.FuelOre + _shipStatus.Organics + _shipStatus.Equipment + _shipStatus.Colonists;
        if (_shipStatus.TotalHolds > 0)
        {
            long empty = _shipStatus.TotalHolds - totalCargo;
            return empty < 0 ? 0 : (int)empty;
        }

        return 0;
    }

    private int ResolveShipProductQty(ProductType productType) => productType switch
    {
        ProductType.FuelOre => (int)_shipStatus.FuelOre,
        ProductType.Organics => (int)_shipStatus.Organics,
        _ => (int)_shipStatus.Equipment,
    };

    private string? HandleOffer(long offer, string buySell, bool finalOffer)
    {
        if (_session == null || _session.TradeQty <= 0)
            return null;

        if (!string.IsNullOrEmpty(buySell) &&
            !string.Equals(_session.BuySell, buySell, StringComparison.OrdinalIgnoreCase))
        {
            GlobalModules.DebugLog($"[NativeHaggle] Offer mode mismatch session={_session.BuySell} line={buySell}, resetting.\n");
            Reset("mode-mismatch");
            return null;
        }

        _session.FinalOffer = finalOffer;
        if (_session.HeuristicFallback)
        {
            long heuristicBid = ComputeHeuristicBid(_session, offer);
            StageBid(_session, offer, heuristicBid, finalOffer);

            GlobalModules.DebugLog(
                $"[NativeHaggle] heuristic offer={offer} final={finalOffer} stagedBid={heuristicBid}\n");
            WriteTradeDebug(_session,
                $"[NativeHaggle] ALGO heuristic offer={offer} final={finalOffer} stagedBid={heuristicBid}\n");
            return null;
        }

        if (_session.IsPlanetTrade)
        {
            long planetBid = ComputeBid(_session, offer, _session.ActiveMode);
            StageBid(_session, offer, planetBid, finalOffer);
            if (UsesCherokeePlanetBaseline(_session))
            {
                GlobalModules.DebugLog(
                    $"[NativeHaggle] planet-cherokee offer={offer} final={finalOffer} stagedBid={planetBid} mcic={_session.PlanetQualityMcic} multiple={_session.PlanetQualityMultiple} portMaxInit={_session.PlanetPortMaxInit} midHaggles={_session.PlanetMidHaggles} forceFail={_session.PlanetForceFailApplied} ptrade={_session.PlanetTradeSettingPercent}\n");
                WriteTradeDebug(_session,
                    $"[NativeHaggle] ALGO planet-cherokee offer={offer} final={finalOffer} stagedBid={planetBid} mcic={_session.PlanetQualityMcic} multiple={_session.PlanetQualityMultiple} ptrade={_session.PlanetTradeSettingPercent}\n");
            }
            else
            {
                GlobalModules.DebugLog(
                    $"[NativeHaggle] planet-mode offer={offer} final={finalOffer} activeMode={_session.ActiveMode} activeModeName='{_session.ActiveModeDisplayName}' stagedBid={planetBid}\n");
                WriteTradeDebug(_session,
                    $"[NativeHaggle] ALGO planet-mode offer={offer} final={finalOffer} mode={_session.ActiveMode} modeName='{_session.ActiveModeDisplayName}' stagedBid={planetBid}\n");
            }
            return null;
        }

        if (_session.BidNumber == 0)
        {
            if (!DeriveCandidates(_session, offer))
            {
                if (TryEnableHeuristicFallback(_session, offer, "derive-failed"))
                {
                    long heuristicBid = ComputeHeuristicBid(_session, offer);
                    StageBid(_session, offer, heuristicBid, finalOffer);

                    GlobalModules.DebugLog(
                        $"[NativeHaggle] heuristic offer={offer} final={finalOffer} stagedBid={heuristicBid}\n");
                    WriteTradeDebug(_session,
                        $"[NativeHaggle] ALGO heuristic offer={offer} final={finalOffer} stagedBid={heuristicBid}\n");
                    return null;
                }

                GlobalModules.DebugLog($"[NativeHaggle] Derive failed for sector={_session.Sector} product={_session.ProductKey}, manual haggle required.\n");
                Reset("derive-failed");
                return null;
            }
        }
        else
        {
            if (!FilterCandidates(_session, offer))
            {
                if (TryEnableHeuristicFallback(_session, offer, "filter-failed"))
                {
                    long heuristicBid = ComputeHeuristicBid(_session, offer);
                    StageBid(_session, offer, heuristicBid, finalOffer);

                    GlobalModules.DebugLog(
                        $"[NativeHaggle] heuristic offer={offer} final={finalOffer} stagedBid={heuristicBid}\n");
                    WriteTradeDebug(_session,
                        $"[NativeHaggle] ALGO heuristic offer={offer} final={finalOffer} stagedBid={heuristicBid}\n");
                    return null;
                }

                GlobalModules.DebugLog($"[NativeHaggle] Candidate filter failed for sector={_session.Sector} product={_session.ProductKey}, manual haggle required.\n");
                Reset("filter-failed");
                return null;
            }
        }

        UpdateHiddenTotalTracker(_session);

        long bid = ComputeBid(_session, offer, _session.ActiveMode);
        StageBid(_session, offer, bid, finalOffer);

        GlobalModules.DebugLog(
            $"[NativeHaggle] offer={offer} final={finalOffer} candidates={_session.Candidates.Count} stagedBid={bid}\n");
        WriteTradeDebug(_session,
            $"[NativeHaggle] ALGO staged offer={offer} final={finalOffer} stagedBid={bid} candidates={_session.Candidates.Count}\n");
        return null;
    }

    private string? HandleOfferPrompt(long offer)
    {
        if (_session == null)
            return null;

        if (_session.PendingBid <= 0 || _session.PendingBidOffer <= 0)
        {
            GlobalModules.DebugLog(
                $"[NativeHaggle] Ignoring offer prompt without staged bid offer={offer} sector={_session.Sector} product={_session.ProductKey} buysell={_session.BuySell}\n");
            WriteTradeDebug(_session,
                $"[NativeHaggle] TEXT prompt-without-staged-bid offer={offer} sector={_session.Sector} product={_session.ProductKey} buysell={_session.BuySell}\n");
            return null;
        }

        if (offer != _session.PendingBidOffer)
            return null;

        long bid = _session.PendingBid;
        bool finalOffer = _session.PendingBidFinalOffer;
        _session.PendingBid = 0;
        _session.PendingBidOffer = 0;
        _session.PendingBidFinalOffer = false;

        _session.BidNumber++;
        _session.LastCounter = bid;
        _session.LastOffer = offer;
        string probe = DescribePredictedProbe(_session, bid);

        GlobalModules.DebugLog(
            $"[NativeHaggle] Prompt offer={offer} final={finalOffer} bidNumber={_session.BidNumber} bid={bid} {probe}\n");
        WriteTradeDebug(_session,
            $"[NativeHaggle] SEND offer={offer} final={finalOffer} bidNumber={_session.BidNumber} bid={bid} {probe}\n");
        return bid.ToString(CultureInfo.InvariantCulture);
    }

    private static void StageBid(SessionState session, long offer, long bid, bool finalOffer)
    {
        session.PendingBid = bid;
        session.PendingBidOffer = offer;
        session.PendingBidFinalOffer = finalOffer;
    }

    private static void UpdateHiddenTotalTracker(SessionState session)
    {
        ApplyAcceptedBidToHiddenTotalTracker(session);

        if (session.HasHiddenTotalRange)
            return;

        (double hiddenMin, double hiddenMax) = GetHiddenTotalRangeFromCandidates(session);
        if (hiddenMin <= 0 || hiddenMax <= 0 || hiddenMin > hiddenMax)
            return;

        session.HiddenTotalMin = hiddenMin;
        session.HiddenTotalMax = hiddenMax;

        GlobalModules.DebugLog(
            $"[NativeHaggle] Hidden tracker init total={hiddenMin:0.000000}..{hiddenMax:0.000000} candidates={session.Candidates.Count}\n");
    }

    private static void ApplyAcceptedBidToHiddenTotalTracker(SessionState session)
    {
        if (!session.HasHiddenTotalRange || session.BidNumber <= 0 || session.LastCounter <= 0)
            return;

        if (session.HiddenTotalAppliedBidNumber >= session.BidNumber)
            return;

        double bid = session.LastCounter;
        session.HiddenTotalMin = AdvanceServerHiddenTotal(session.HiddenTotalMin, bid);
        session.HiddenTotalMax = AdvanceServerHiddenTotal(session.HiddenTotalMax, bid);
        session.HiddenTotalAppliedBidNumber = session.BidNumber;

        GlobalModules.DebugLog(
            $"[NativeHaggle] Hidden tracker advance bidNumber={session.BidNumber} lastCounter={session.LastCounter} total={session.HiddenTotalMin:0.000000}..{session.HiddenTotalMax:0.000000}\n");
    }

    private static double AdvanceServerHiddenTotal(double priorTotal, double acceptedBid)
    {
        // Mirrors the 0x004594F5 hidden-basis update: 0.7 * priorTotal + 0.3 * acceptedBid.
        return (priorTotal * 0.7) + (acceptedBid * 0.3);
    }

    private static (double MinTotal, double MaxTotal) GetHiddenTotalRangeFromCandidates(SessionState session)
    {
        if (session.Candidates.Count == 0 || session.TradeQty <= 0 || session.Percent <= 0)
            return (0, 0);

        double minTotal = double.MaxValue;
        double maxTotal = double.MinValue;
        double baseCommodity = GetServerCommodityBasePrice(session);

        foreach (Candidate candidate in session.Candidates)
        {
            double signedTrade = candidate.Mcic;
            foreach (int adjustedQty in GetServerSeedQuantityCandidates(session, signedTrade))
            {
                double adjustment = signedTrade < 0
                    ? (((((session.Percent * 10.0) - adjustedQty) * signedTrade) / session.Percent) / 1000.0)
                    : ((((adjustedQty * signedTrade) / session.Percent) / 1000.0));

                double basisPerUnit = (baseCommodity * (1.0 - adjustment)) + 0.5;
                if (basisPerUnit <= 0)
                    continue;

                double hiddenTotal = basisPerUnit * session.TradeQty;
                if (hiddenTotal < minTotal)
                    minTotal = hiddenTotal;
                if (hiddenTotal > maxTotal)
                    maxTotal = hiddenTotal;
            }
        }

        if (minTotal == double.MaxValue || maxTotal == double.MinValue)
            return (0, 0);

        return (minTotal, maxTotal);
    }

    private static IReadOnlyList<int> GetServerSeedQuantityCandidates(SessionState session, double signedTrade)
    {
        List<int> quantities = new(16);
        AddUniqueQuantity(quantities, session.PortQty);

        if (session.Percent <= 0)
            return quantities;

        int capQty = Math.Max(0, session.Percent * 10);
        AddUniqueQuantity(quantities, capQty);

        if (string.Equals(session.ProductKey, "FUEL", StringComparison.OrdinalIgnoreCase))
            return quantities;

        foreach (double factor1 in GetServerSeedFactor1Candidates(session))
        {
            foreach (double factor2 in GetServerSeedFactor2Candidates())
            {
                double deltaBase = session.Percent * factor1 * factor2;
                AddAdjustedSeedQuantityVariants(quantities, session.PortQty, capQty, signedTrade, deltaBase);
            }
        }

        return quantities;
    }

    private static IReadOnlyList<double> GetServerSeedFactor1Candidates(SessionState session)
    {
        double baseFactor = string.Equals(session.ProductKey, "ORGANICS", StringComparison.OrdinalIgnoreCase) ? 0.2 : 0.3;

        return new[]
        {
            baseFactor,
            Math.Max(baseFactor, 0.25),
            Math.Max(baseFactor, 1.0 / 3.0),
            Math.Max(baseFactor, 0.5),
            Math.Max(baseFactor, 2.0 / 3.0),
            Math.Max(baseFactor, 1.0),
        };
    }

    private static IReadOnlyList<double> GetServerSeedFactor2Candidates() => new[]
    {
        0.5,
        0.75,
        1.0,
        1.25,
        1.5,
    };

    private static void AddAdjustedSeedQuantityVariants(List<int> quantities, int rawQty, int capQty, double signedTrade, double deltaBase)
    {
        if (deltaBase < 0)
            return;

        int rounded = Math.Max(0, (int)Math.Round(deltaBase, MidpointRounding.AwayFromZero));
        int floored = Math.Max(0, (int)Math.Floor(deltaBase));
        int ceiled = Math.Max(0, (int)Math.Ceiling(deltaBase));

        AddAdjustedSeedQuantity(quantities, rawQty, capQty, signedTrade, floored);
        AddAdjustedSeedQuantity(quantities, rawQty, capQty, signedTrade, rounded);
        AddAdjustedSeedQuantity(quantities, rawQty, capQty, signedTrade, ceiled);

        if (rounded > 0)
        {
            AddAdjustedSeedQuantity(quantities, rawQty, capQty, signedTrade, rounded - 1);
            AddAdjustedSeedQuantity(quantities, rawQty, capQty, signedTrade, rounded + 1);
        }
    }

    private static void AddAdjustedSeedQuantity(List<int> quantities, int rawQty, int capQty, double signedTrade, int shift)
    {
        int adjustedQty = signedTrade < 0
            ? rawQty - shift
            : rawQty + shift;

        if (adjustedQty < 0)
            adjustedQty = 0;

        if (adjustedQty > capQty)
            adjustedQty = capQty;

        AddUniqueQuantity(quantities, adjustedQty);
    }

    private static void AddUniqueQuantity(List<int> quantities, int quantity)
    {
        if (!quantities.Contains(quantity))
            quantities.Add(quantity);
    }

    private static double GetServerCommodityBasePrice(SessionState session) => session.ProductKey switch
    {
        "FUEL" => 25.0,
        "ORGANICS" => 50.0,
        _ => 90.0,
    };

    private static string DescribeStartCargoSnapshot(SessionState session) =>
        string.Create(
            CultureInfo.InvariantCulture,
            $"startFuel={session.StartFuelOre} startOrg={session.StartOrganics} startEqu={session.StartEquipment} startProduct={session.StartProductQty} startEmpty={session.StartEmptyHolds}");

    private static ShipStatus CloneStatus(ShipStatus status) => new()
    {
        TraderName = status.TraderName,
        Experience = status.Experience,
        Alignment = status.Alignment,
        AlignText = status.AlignText,
        CurrentSector = status.CurrentSector,
        Turns = status.Turns,
        UnlimitedGame = status.UnlimitedGame,
        Credits = status.Credits,
        Corp = status.Corp,
        ShipName = status.ShipName,
        ShipType = status.ShipType,
        TurnsPerWarp = status.TurnsPerWarp,
        TotalHolds = status.TotalHolds,
        HoldsEmpty = status.HoldsEmpty,
        FuelOre = status.FuelOre,
        Organics = status.Organics,
        Equipment = status.Equipment,
        Colonists = status.Colonists,
        Fighters = status.Fighters,
        Shields = status.Shields,
        ArmidMines = status.ArmidMines,
        LimpetMines = status.LimpetMines,
        Photons = status.Photons,
        GenesisTorps = status.GenesisTorps,
        Cloaks = status.Cloaks,
        Beacons = status.Beacons,
        AtomicDet = status.AtomicDet,
        Corbomite = status.Corbomite,
        EtherProbes = status.EtherProbes,
        MineDisruptors = status.MineDisruptors,
        PsychProbe = status.PsychProbe,
        PlanetScanner = status.PlanetScanner,
        LRSType = status.LRSType,
        TimesBlownUp = status.TimesBlownUp,
        TransWarp1 = status.TransWarp1,
        TransWarp2 = status.TransWarp2,
    };

    private int ResolveExperience()
    {
        if (_shipStatus.Experience > 0)
            return (int)_shipStatus.Experience;
        return _lastKnownExperience;
    }

    private static string ProductKeyFromPrompt(string value) => value.ToUpperInvariant() switch
    {
        "FUEL ORE" => "FUEL",
        "ORGANICS" => "ORGANICS",
        "EQUIPMENT" => "EQUIPMENT",
        _ => string.Empty,
    };

    private static ProductType ProductTypeFromKey(string key) => key switch
    {
        "FUEL" => ProductType.FuelOre,
        "ORGANICS" => ProductType.Organics,
        _ => ProductType.Equipment,
    };

    private static void ConfigureProductConstants(SessionState session)
    {
        switch (session.ProductKey)
        {
            case "FUEL":
                session.BasePrice = 25.5;
                session.ProductFactor = 0.25;
                break;
            case "ORGANICS":
                session.BasePrice = 50.5;
                session.ProductFactor = 0.5;
                break;
            default:
                session.BasePrice = 90.5;
                session.ProductFactor = 0.9;
                break;
        }

        switch (NormalizeWeekday(session.Weekday))
        {
            case "Mon":
                session.BaseVarMin = 0;
                session.BaseVarMax = 5;
                break;
            case "Tue":
                session.BaseVarMin = 7;
                session.BaseVarMax = 7;
                break;
            case "Wed":
                session.BaseVarMin = 10;
                session.BaseVarMax = 15;
                break;
            case "Thu":
                session.BaseVarMin = 9;
                session.BaseVarMax = 9;
                break;
            case "Fri":
                session.BaseVarMin = 11;
                session.BaseVarMax = 12;
                break;
            case "Sat":
                session.BaseVarMin = 11;
                session.BaseVarMax = 18;
                break;
            default:
                session.BaseVarMin = 10;
                session.BaseVarMax = 12;
                break;
        }

        if (string.Equals(session.BuySell, "SELLING", StringComparison.OrdinalIgnoreCase))
        {
            session.PlusMinus = -1;
            session.McicStep = 1;
        }
        else
        {
            session.PlusMinus = 1;
            session.McicStep = -1;
        }
    }

    private static bool PrepareRanges(SessionState session, ModDatabase? db)
    {
        (int defaultMin, int defaultMax) = session.ProductKey switch
        {
            "FUEL" => (40, 90),
            "ORGANICS" => (30, 75),
            _ => (20, 65),
        };
        session.DefaultMcicMin = session.McicStep * defaultMin;
        session.DefaultMcicMax = session.McicStep * defaultMax;

        int savedLowProductivity = ReadInt(db, session.Sector, session.ProductKey + "L");
        int savedHighProductivity = ReadInt(db, session.Sector, session.ProductKey + "H");

        if (session.Percent == 100)
        {
            int productivity = (int)PascalRoundInt(session.PortQty / 10.0, 0);
            session.MaxProductivity = productivity;
            session.LowProductivity = productivity;
            session.HighProductivity = productivity;
            session.CalculatedLowProductivity = productivity;
        }
        else if (session.Percent == 0)
        {
            session.LowProductivity = ReadInt(db, session.Sector, session.ProductKey + "L");
            session.HighProductivity = ReadInt(db, session.Sector, session.ProductKey + "H");
            session.MaxProductivity = session.HighProductivity;
            session.CalculatedLowProductivity = session.LowProductivity;
            if (session.LowProductivity <= 0 || session.HighProductivity <= 0)
                return false;
        }
        else
        {
            int minProductivity = (int)PascalRoundInt((session.PortQty * 10.0) / (session.Percent + 0.9999999999), 0);
            int maxProductivity = (int)PascalRoundInt(((session.PortQty / (double)session.Percent) * 10.0) - 0.4999999999, 0);
            if (maxProductivity > 6553)
                maxProductivity = 6553;
            session.MaxProductivity = maxProductivity;
            session.CalculatedLowProductivity = minProductivity;
            session.LowProductivity = savedLowProductivity > minProductivity ? savedLowProductivity : minProductivity;
            session.HighProductivity = (savedHighProductivity > 0 && savedHighProductivity < maxProductivity)
                ? savedHighProductivity
                : maxProductivity;
        }

        session.UseLowPercentDerive = ((session.HighProductivity - session.LowProductivity) + 1) > 10;

        if (db != null)
        {
            WriteInt(db, session.Sector, session.ProductKey + "L", session.LowProductivity);
            WriteInt(db, session.Sector, session.ProductKey + "H", session.HighProductivity);
        }

        int sign = session.McicStep;
        int storedMin = ReadSignedInt(db, session.Sector, session.ProductKey + "-");
        int storedMax = ReadSignedInt(db, session.Sector, session.ProductKey + "+");
        bool validStored =
            storedMin != int.MinValue &&
            storedMax != int.MinValue &&
            ((storedMin * sign) >= defaultMin) &&
            ((storedMin * sign) <= defaultMax) &&
            ((storedMax * sign) >= defaultMin) &&
            ((storedMax * sign) <= defaultMax);

        if (validStored)
        {
            session.McicMin = storedMin;
            session.McicMax = storedMax;
        }
        else
        {
            session.McicMin = session.DefaultMcicMin;
            session.McicMax = session.DefaultMcicMax;
            if (db != null && storedMin != int.MinValue)
            {
                db.SetSectorVar(session.Sector, session.ProductKey + "-", string.Empty);
                db.SetSectorVar(session.Sector, session.ProductKey + "+", string.Empty);
            }
        }

        return true;
    }

    private static bool DeriveCandidates(SessionState session, long offer)
    {
        while (true)
        {
            session.Candidates.Clear();

            if (session.UseLowPercentDerive && !HasLowPercentAnomalyRisk(session))
                DeriveCandidatesLowPercent(session, offer);
            else
                DeriveCandidatesConventional(session, offer);

            if (session.Candidates.Count > 0)
            {
                PersistDerivedRanges(session);
                LogCandidateSnapshot(session, offer, stage: "derive");
                return true;
            }

            if (!ApplyDeriveRecovery(session))
                return false;
        }
    }

    private static void DeriveCandidatesConventional(SessionState session, long offer)
    {
        double expAdjust = session.Experience > 999
            ? 0
            : session.PlusMinus * ((1000.0 - session.Experience) / 100.0);

        int terminal = session.McicMax + session.McicStep;
        for (int mcic = session.McicMin; mcic != terminal; mcic += session.McicStep)
        {
            double mcicFactor = (mcic / 1000.0) + 1.0;
            double qtyFactor = (mcic * (session.ProductFactor * session.PortQty)) / 10.0;

            for (int productivity = session.LowProductivity; productivity <= session.HighProductivity; productivity++)
            {
                double productivityFactor = qtyFactor / productivity;

                for (int baseVar = session.BaseVarMin; baseVar <= session.BaseVarMax; baseVar++)
                {
                    double priceBase = ((session.PlusMinus * baseVar) + session.BasePrice) - expAdjust - productivityFactor;
                    while (priceBase < 4.0)
                        priceBase += 1.0;

                    double exactPrice = priceBase * session.TradeQty;
                    double lowBound = ((mcicFactor - 0.003) * exactPrice) - 0.5001;
                    double highBound = ((mcicFactor + 0.003) * exactPrice) + 0.5001;
                    if (offer < PascalRoundInt(lowBound, 0) || offer > PascalRoundInt(highBound, 0))
                        continue;

                    for (double variance = -0.003; variance <= 0.0030001; variance = PascalRoundValue(variance + 0.001, 3))
                    {
                        double offeredPrice = (mcicFactor + variance) * exactPrice;
                        long rounded = PascalRoundInt(offeredPrice, 0);
                        bool match = rounded == offer;
                        if (!match)
                        {
                            double roundedDownCheck = PascalRoundValue(offeredPrice - 0.5, 7);
                            double roundedUpCheck = PascalRoundValue(offeredPrice + 0.5, 7);
                            bool roundedDown = Math.Abs(rounded - roundedDownCheck) <= 0.0000001;
                            bool roundedUp = Math.Abs(rounded - roundedUpCheck) <= 0.0000001;
                            if (roundedDown && rounded + 1 == offer)
                                match = true;
                            else if (roundedUp && rounded - 1 == offer)
                                match = true;
                        }

                        if (!match)
                            continue;

                        session.Candidates.Add(new Candidate
                        {
                            Mcic = mcic,
                            BaseVar = baseVar,
                            Variance = PascalRoundValue(variance, 3),
                            Productivity = productivity,
                            ExactPrice = exactPrice,
                        });
                    }
                }
            }
        }
    }

    private static void DeriveCandidatesLowPercent(SessionState session, long offer)
    {
        double expAdjust = session.Experience > 999
            ? 0
            : session.PlusMinus * ((1000.0 - session.Experience) / 100.0);

        int terminal = session.McicMax + session.McicStep;
        for (int mcic = session.McicMin; mcic != terminal; mcic += session.McicStep)
        {
            double mcicFactor = (mcic / 1000.0) + 1.0;

            for (int baseVar = session.BaseVarMin; baseVar <= session.BaseVarMax; baseVar++)
            {
                for (double variance = -0.003; variance <= 0.0030001; variance = PascalRoundValue(variance + 0.001, 3))
                {
                    double divisor = mcicFactor + variance;
                    if (Math.Abs(divisor) < 0.0000001)
                        continue;

                    double lowerExact = (offer - 0.4999999999) / divisor;
                    double upperExact = (offer + 0.4999999999) / divisor;

                    double denom1 = (((session.PlusMinus * baseVar) + session.BasePrice) - expAdjust) - (upperExact / session.TradeQty);
                    double denom2 = (((session.PlusMinus * baseVar) + session.BasePrice) - expAdjust) - (lowerExact / session.TradeQty);
                    if (Math.Abs(denom1) < 0.0000001 || Math.Abs(denom2) < 0.0000001)
                        continue;

                    double prod1 = ((mcic * session.ProductFactor) * session.PortQty) / (10.0 * denom1);
                    double prod2 = ((mcic * session.ProductFactor) * session.PortQty) / (10.0 * denom2);
                    if (prod2 < prod1)
                    {
                        (prod1, prod2) = (prod2, prod1);
                    }

                    int rangeLow = (int)PascalRoundInt(prod1 + 0.4999999999, 0);
                    int rangeHigh = (int)PascalRoundInt(prod2 - 0.4999999999, 0);
                    if (rangeLow > rangeHigh)
                        continue;

                    int low = Math.Max(session.LowProductivity, rangeLow);
                    int high = Math.Min(session.HighProductivity, rangeHigh);
                    if (low > high)
                        continue;

                    for (int productivity = low; productivity <= high; productivity++)
                    {
                        double exactPrice = ((((session.PlusMinus * baseVar) + session.BasePrice)
                            - ((session.PortQty / (productivity * 10.0)) * (mcic * session.ProductFactor)))
                            - expAdjust) * session.TradeQty;

                        session.Candidates.Add(new Candidate
                        {
                            Mcic = mcic,
                            BaseVar = baseVar,
                            Variance = variance,
                            Productivity = productivity,
                            ExactPrice = exactPrice,
                        });
                    }
                }
            }
        }
    }

    private static bool HasLowPercentAnomalyRisk(SessionState session)
    {
        double expAdjust = session.Experience > 999
            ? 0
            : session.PlusMinus * ((1000.0 - session.Experience) / 100.0);

        int terminal = session.McicMax + session.McicStep;
        for (int mcic = session.McicMin; mcic != terminal; mcic += session.McicStep)
        {
            double minValue = (((session.BasePrice + (session.PlusMinus * session.BaseVarMax)) - expAdjust)
                - ((mcic * (session.ProductFactor * session.PortQty)) / (session.LowProductivity * 10.0)));
            minValue = PascalRoundValue(minValue, 3);
            if (minValue < 4.0)
                return true;
        }

        return false;
    }

    private static bool FilterCandidates(SessionState session, long offer)
    {
        if (session.Candidates.Count == 0)
            return false;

        var prior = new List<Candidate>(session.Candidates.Count);
        prior.AddRange(session.Candidates);
        var next = new List<Candidate>();
        foreach (Candidate candidate in session.Candidates)
        {
            double exactCounter = AdvanceServerHiddenTotal(candidate.ExactPrice, session.LastCounter);
            long projected = PascalRoundInt((((candidate.Mcic / 1000.0) + candidate.Variance) + 1.0) * exactCounter, 0);
            if (projected != offer)
                continue;

            next.Add(new Candidate
            {
                Mcic = candidate.Mcic,
                BaseVar = candidate.BaseVar,
                Variance = candidate.Variance,
                Productivity = candidate.Productivity,
                ExactPrice = exactCounter,
            });
        }

        session.Candidates.Clear();
        session.Candidates.AddRange(next);
        PersistDerivedRanges(session);
        if (session.Candidates.Count == 0)
            LogFilterFailure(session, offer, prior);
        else
            LogCandidateSnapshot(session, offer, stage: "filter");
        return session.Candidates.Count > 0;
    }

    private static bool UsesCherokeePlanetBaseline(SessionState session) =>
        session.IsPlanetTrade &&
        string.Equals(session.BuySell, "BUYING", StringComparison.OrdinalIgnoreCase) &&
        string.Equals(session.ActiveMode, NativeHaggleModes.CherokeePlanet, StringComparison.OrdinalIgnoreCase);

    private void EnsurePlanetTradeVisitState(int sector)
    {
        if (_planetTradeRunState.Sector == sector)
            return;

        _planetTradeRunState.Sector = sector;
        _planetTradeRunState.ThisOreFailed = false;
        _planetTradeRunState.ThisOrgFailed = false;
        _planetTradeRunState.ThisEquFailed = false;
    }

    private static PlanetTradeProductModel GetPlanetTradeProductModel(ProductType productType) => productType switch
    {
        ProductType.FuelOre => FuelOrePlanetProductModel,
        ProductType.Organics => OrganicsPlanetProductModel,
        _ => EquipmentPlanetProductModel,
    };

    private static PlanetTradeQualityEntry GetPlanetTradeQualityEntry(PlanetTradeProductModel model, long portMaxInit)
    {
        foreach (PlanetTradeQualityEntry entry in model.QualityTable)
        {
            if (portMaxInit >= entry.Threshold)
                return entry;
        }

        PlanetTradeQualityEntry fallback = model.QualityTable[^1];
        return new PlanetTradeQualityEntry(fallback.Threshold, 0, fallback.Multiple);
    }

    private static int GetPlanetPercentFromBase(SessionState session)
    {
        int percent = session.Percent;
        if (percent < 100)
            percent++;

        return Math.Max(1, percent);
    }

    internal long ComputeCherokeePlanetBaselineBid(SessionState session, long offer)
    {
        if (session.BidNumber > 0 && (session.LastOffer <= 0 || session.LastCounter <= 0))
            return NormalizeBidForDirection(session, offer, ComputeHeuristicBid(session, offer));

        PlanetTradeProductModel model = GetPlanetTradeProductModel(session.ProductType);

        if (session.BidNumber == 0)
        {
            long portMaxInit = ComputeCherokeePlanetPortMaxInit(session, offer, model);
            PlanetTradeQualityEntry quality = GetPlanetTradeQualityEntry(model, portMaxInit);

            session.PlanetPortMaxInit = (int)Math.Max(0, portMaxInit);
            session.PlanetQualityMcic = quality.Mcic;
            session.PlanetQualityMultiple = quality.Multiple;
            session.PlanetMidHaggles = 0;
            session.PlanetForceFailApplied = false;

            long counter = offer;
            counter /= 10;
            counter *= quality.Multiple;
            counter /= 100;
            return NormalizeBidForDirection(session, offer, counter);
        }

        if (session.FinalOffer)
        {
            bool forceFail = ShouldForceFailCherokeePlanetTrade(session);
            session.PlanetForceFailApplied = forceFail;

            if (forceFail)
            {
                MarkPlanetTradeForceFail(session);
                return NormalizeBidForDirection(session, offer, session.LastCounter);
            }

            long offerChange = offer - session.LastOffer;
            offerChange *= GetCherokeePlanetFinalOfferMultiplier(session.ProductType);
            offerChange /= 10;

            long counter = session.LastCounter - offerChange;
            counter -= 10;
            return NormalizeBidForDirection(session, offer, counter);
        }

        session.PlanetMidHaggles++;
        session.PlanetForceFailApplied = false;

        long midOfferChange = offer - session.LastOffer;
        int offset;
        if (session.PlanetQualityMcic > -35)
        {
            midOfferChange *= 75;
            midOfferChange /= 100;
            offset = 25;
        }
        else if (session.PlanetQualityMcic > -55)
        {
            midOfferChange *= 65;
            midOfferChange /= 100;
            offset = 25;
        }
        else
        {
            midOfferChange *= 60;
            midOfferChange /= 100;
            offset = 10;
        }

        long midCounter = session.LastCounter - midOfferChange;
        midCounter -= offset;
        return NormalizeBidForDirection(session, offer, midCounter);
    }

    private static long ComputeCherokeePlanetPortMaxInit(SessionState session, long offer, PlanetTradeProductModel model)
    {
        long tradeSetting = Math.Max(1, session.PlanetTradeSettingPercent);
        long tradeQty = Math.Max(1, session.TradeQty);

        long portMaxInit = offer;
        portMaxInit *= 100;
        portMaxInit /= tradeSetting;
        portMaxInit *= 100;
        portMaxInit /= tradeQty;

        int percentFromBase = GetPlanetPercentFromBase(session);
        if (percentFromBase == 100)
        {
            portMaxInit /= 10;
            return portMaxInit;
        }

        if (percentFromBase < 15)
            return model.FallbackPortMax;

        long adjustedPercent = percentFromBase;
        adjustedPercent *= 1000;
        adjustedPercent -= model.BasePercent;
        if (adjustedPercent <= 0)
            return model.FallbackPortMax;

        portMaxInit *= 100000;
        portMaxInit -= model.BaseValue;
        portMaxInit /= adjustedPercent;
        portMaxInit *= model.BasePercentInverse;
        portMaxInit += model.BaseValue;
        portMaxInit /= 1000000;
        return portMaxInit;
    }

    private bool ShouldForceFailCherokeePlanetTrade(SessionState session)
    {
        if (!UsesCherokeePlanetBaseline(session))
            return false;

        int qty = session.TradeQty;
        int mcic = session.PlanetQualityMcic;
        int midHaggles = session.PlanetMidHaggles;

        return session.ProductType switch
        {
            ProductType.FuelOre => mcic <= -75 &&
                                   qty >= 25000 &&
                                   midHaggles < 1 &&
                                   _planetTradeRunState.OreSellFailures < 2,
            ProductType.Organics => (mcic <= -60 &&
                                     qty >= 25000 &&
                                     midHaggles < 2 &&
                                     (_planetTradeRunState.ThisOreFailed || _planetTradeRunState.OrgSellFailures < 4)) ||
                                    (mcic <= -60 &&
                                     qty >= 15000 &&
                                     midHaggles < 1 &&
                                     (_planetTradeRunState.ThisOreFailed || _planetTradeRunState.OrgSellFailures < 2)),
            _ => (mcic <= -55 &&
                  qty >= 20000 &&
                  midHaggles < 2 &&
                  (_planetTradeRunState.ThisOreFailed || _planetTradeRunState.ThisOrgFailed || _planetTradeRunState.EquSellFailures < 4)) ||
                 (mcic <= -55 &&
                  qty >= 12000 &&
                  midHaggles < 1 &&
                  (_planetTradeRunState.ThisOreFailed || _planetTradeRunState.ThisOrgFailed || _planetTradeRunState.EquSellFailures < 2)),
        };
    }

    private void MarkPlanetTradeForceFail(SessionState session)
    {
        switch (session.ProductType)
        {
            case ProductType.FuelOre:
                _planetTradeRunState.ThisOreFailed = true;
                break;
            case ProductType.Organics:
                _planetTradeRunState.ThisOrgFailed = true;
                break;
            case ProductType.Equipment:
                _planetTradeRunState.ThisEquFailed = true;
                break;
        }
    }

    private void ApplyPlanetTradeOutcome(SessionState session, bool success)
    {
        if (success || !UsesCherokeePlanetBaseline(session))
            return;

        switch (session.ProductType)
        {
            case ProductType.FuelOre:
                _planetTradeRunState.OreSellFailures++;
                break;
            case ProductType.Organics:
                _planetTradeRunState.OrgSellFailures++;
                break;
            case ProductType.Equipment:
                _planetTradeRunState.EquSellFailures++;
                break;
        }
    }

    private static int GetCherokeePlanetFinalOfferMultiplier(ProductType productType) => productType switch
    {
        ProductType.FuelOre => 30,
        ProductType.Organics => 27,
        _ => 25,
    };

    private long ComputeBid(SessionState session, long offer, string firstBidMode)
    {
        if (UsesCherokeePlanetBaseline(session))
            return ComputeCherokeePlanetBaselineBid(session, offer);

        string mode = NativeHaggleModes.Normalize(firstBidMode);
        if (mode == NativeHaggleModes.Aggressive)
            return _aggressiveMode.ComputeBid(this, session, offer);

        if (_extensionModes.TryGetValue(mode, out NativeHaggleModeExtension? extension))
            return extension.ComputeBid(this, session, offer);

        if (mode == NativeHaggleModes.ServerDerived)
            return ComputeServerDerivedBid(session, offer);

        long exactBid = ComputeExactBid(session);
        return ApplyExperimentalFirstBidMode(session, offer, exactBid, mode);
    }

    private static long ComputeExactBid(SessionState session)
    {
        double minCounter = 0;
        double maxCounter = 0;

        foreach (Candidate candidate in session.Candidates)
        {
            double counter;
            if (session.FinalOffer)
            {
                if (string.Equals(session.BuySell, "BUYING", StringComparison.OrdinalIgnoreCase))
                {
                    counter = candidate.ExactPrice - 0.5;
                    if (minCounter == 0 || counter < minCounter)
                        minCounter = counter;
                }
                else
                {
                    counter = candidate.ExactPrice + 0.5;
                    if (counter > maxCounter)
                        maxCounter = counter;
                }

                continue;
            }

            counter = ((((candidate.Mcic * 0.004) / (session.BidNumber + 1.0)) * -1.0) + 1.0) * candidate.ExactPrice;
            if (string.Equals(session.BuySell, "SELLING", StringComparison.OrdinalIgnoreCase) && session.BidNumber == 0)
            {
                double stupidOffer = (candidate.ExactPrice / 1.5) + 0.5;
                if (counter < stupidOffer)
                    counter = stupidOffer + 0.5;
            }

            if (minCounter == 0 || counter < minCounter)
                minCounter = counter;
            if (counter > maxCounter)
                maxCounter = counter;
        }

        double chosen;
        if (string.Equals(session.BuySell, "BUYING", StringComparison.OrdinalIgnoreCase))
        {
            chosen = minCounter;
            if (session.BidNumber > 0 && chosen > session.LastCounter)
                chosen = session.LastCounter;
            if (session.BidNumber == 0 && session.Percent == 100 && chosen != 0)
                chosen -= 1;
        }
        else
        {
            chosen = maxCounter;
            if (session.BidNumber > 0 && chosen < session.LastCounter)
                chosen = session.LastCounter;
            if (session.BidNumber == 0 && session.Percent == 100)
                chosen += 1;
        }

        return PascalRoundInt(chosen, 0);
    }

    private static long ApplyExperimentalFirstBidMode(SessionState session, long offer, long exactBid, string firstBidMode)
    {
        if (session.BidNumber != 0)
            return exactBid;

        string mode = NativeHaggleModes.Normalize(firstBidMode);

        if (mode == NativeHaggleModes.Baseline)
            return exactBid;

        long heuristicBid = ComputeHeuristicBid(session, offer);
        long adjustedBid = mode switch
        {
            NativeHaggleModes.BlendHeuristic => PascalRoundInt((exactBid + heuristicBid) / 2.0, 0),
            NativeHaggleModes.ClampHeuristic => string.Equals(session.BuySell, "SELLING", StringComparison.OrdinalIgnoreCase)
                ? Math.Max(exactBid, heuristicBid)
                : Math.Min(exactBid, heuristicBid),
            _ => exactBid,
        };

        adjustedBid = NormalizeBidForDirection(session, offer, adjustedBid);
        if (adjustedBid != exactBid)
        {
            GlobalModules.DebugLog(
                $"[NativeHaggle] Experiment '{mode}' adjusted first bid exact={exactBid} heuristic={heuristicBid} adjusted={adjustedBid} offer={offer} sector={session.Sector} product={session.ProductKey} buysell={session.BuySell}\n");
        }

        return adjustedBid;
    }

    internal static long ComputeServerDerivedBid(SessionState session, long offer)
    {
        return ComputeServerDerivedBid(session, offer, NativeHaggleModes.ClampHeuristic);
    }

    internal static long ComputeServerDerivedBid(SessionState session, long offer, string firstBidMode)
    {
        if (session.Candidates.Count == 0)
            return NormalizeBidForDirection(session, offer, offer);

        long exactBid = ComputeExactBid(session);
        long overlayBid = session.BidNumber == 0
            ? ApplyExperimentalFirstBidMode(session, offer, exactBid, firstBidMode)
            : exactBid;

        int roundNumber = Math.Max(1, session.BidNumber + 1);
        double chosenThreshold = 0;
        bool initialized = false;

        foreach (Candidate candidate in session.Candidates)
        {
            double threshold = candidate.ExactPrice * (1.0 - ((candidate.Mcic / 250.0) / roundNumber));
            if (!initialized)
            {
                chosenThreshold = threshold;
                initialized = true;
                continue;
            }

            if (string.Equals(session.BuySell, "SELLING", StringComparison.OrdinalIgnoreCase))
                chosenThreshold = Math.Max(chosenThreshold, threshold);
            else
                chosenThreshold = Math.Min(chosenThreshold, threshold);
        }

        long thresholdBid = PascalRoundInt(chosenThreshold, 0);
        long bid = string.Equals(session.BuySell, "SELLING", StringComparison.OrdinalIgnoreCase)
            ? Math.Max(overlayBid, thresholdBid)
            : Math.Min(overlayBid, thresholdBid);

        bid = NormalizeBidForDirection(session, offer, bid);
        GlobalModules.DebugLog(
            $"[NativeHaggle] Server-derived bid round={roundNumber} offer={offer} exact={exactBid} overlay={overlayBid} threshold={chosenThreshold:0.000000} thresholdBid={thresholdBid} bid={bid} candidates={session.Candidates.Count} sector={session.Sector} product={session.ProductKey} buysell={session.BuySell}\n");
        return bid;
    }

    internal static long MoveBidTowardTarget(long baseBid, long targetBid, int maxNudge, bool increaseBid)
    {
        if (maxNudge <= 0)
            return baseBid;

        if (increaseBid)
        {
            if (targetBid <= baseBid)
                return baseBid;

            long candidate = baseBid + maxNudge;
            return Math.Min(targetBid, candidate);
        }

        if (targetBid >= baseBid)
            return baseBid;

        long candidateBid = baseBid - maxNudge;
        return Math.Max(targetBid, candidateBid);
    }

    internal static long MoveBidTowardOffer(SessionState session, long offer, long baseBid, int soften)
    {
        if (soften <= 0)
            return baseBid;

        if (string.Equals(session.BuySell, "SELLING", StringComparison.OrdinalIgnoreCase))
            return Math.Min(offer - 1, baseBid + soften);

        return Math.Max(offer + 1, baseBid - soften);
    }

    internal static long MoveBidTowardExactRange(SessionState session, long baseBid, int nudge)
    {
        if (nudge <= 0 || session.Candidates.Count == 0)
            return baseBid;

        (double minExact, double maxExact, _) = GetTrackedTargetTotalRange(session);
        if (minExact <= 0 || maxExact <= 0)
            return baseBid;

        long lowerTarget = (long)Math.Ceiling(minExact);
        long upperTarget = (long)Math.Floor(maxExact);
        long target = baseBid;

        if (baseBid < lowerTarget)
            target = lowerTarget;
        else if (baseBid > upperTarget)
            target = upperTarget;

        if (target == baseBid)
            return baseBid;

        bool portSelling = string.Equals(session.BuySell, "SELLING", StringComparison.OrdinalIgnoreCase);
        return MoveBidTowardTarget(baseBid, target, nudge, portSelling);
    }

    internal static (double MinExact, double MaxExact) GetCandidateExactRange(SessionState session)
    {
        double minExact = 0;
        double maxExact = 0;

        foreach (Candidate candidate in session.Candidates)
        {
            if (minExact == 0 || candidate.ExactPrice < minExact)
                minExact = candidate.ExactPrice;
            if (candidate.ExactPrice > maxExact)
                maxExact = candidate.ExactPrice;
        }

        return (minExact, maxExact);
    }

    internal static bool TryGetCollapsedCandidateExact(SessionState session, out double exact)
    {
        (double minExact, double maxExact) = GetCandidateExactRange(session);
        if (minExact <= 0 || maxExact <= 0 || Math.Abs(maxExact - minExact) > 0.000001)
        {
            exact = 0;
            return false;
        }

        exact = minExact;
        return true;
    }

    internal static bool TryGetFirstOfferExactHitBid(SessionState session, long offer, out long bid, out string reason)
    {
        bid = 0;
        reason = string.Empty;

        if (session.BidNumber != 0 ||
            session.FinalOffer ||
            session.Percent != 100 ||
            session.Candidates.Count == 0 ||
            !TryGetCollapsedCandidateExact(session, out double exact))
        {
            return false;
        }

        long roundedExactBid = NormalizeBidForDirection(session, offer, PascalRoundInt(exact, 0));
        if (roundedExactBid <= 0)
            return false;

        if (!TryGetCollapsedCandidateProbe(session, exact, roundedExactBid, out double serverProbe, out int serverBucket) ||
            serverBucket != 100)
        {
            return false;
        }

        bid = roundedExactBid;
        reason = string.Create(
            CultureInfo.InvariantCulture,
            $"collapsedExact={exact:0.000000} roundedBid={roundedExactBid} serverProbe={serverProbe:0.00} serverBucket={serverBucket}");
        return true;
    }

    internal static bool TryGetCollapsedCandidateProbe(SessionState session, double exact, long bid, out double serverProbe, out int serverBucket)
    {
        serverProbe = 0;
        serverBucket = 0;

        if (exact <= 0 || bid <= 0)
            return false;

        long raw = string.Equals(session.BuySell, "BUYING", StringComparison.OrdinalIgnoreCase)
            ? Math.Max(0L, (long)Math.Truncate((exact * 10000.0) / bid))
            : Math.Max(0L, (long)Math.Truncate((bid * 10000.0) / exact));

        serverProbe = raw / 100.0;
        serverBucket = (int)(raw / 100);
        return true;
    }

    internal static bool TryGetPreferredExactRange(SessionState session, out double minExact, out double maxExact)
    {
        (minExact, maxExact) = GetCandidateExactRange(session);
        if (minExact > 0 && maxExact > 0 && minExact <= maxExact)
            return true;

        if (session.HasHiddenTotalRange)
        {
            minExact = session.HiddenTotalMin;
            maxExact = session.HiddenTotalMax;
            return true;
        }

        minExact = 0;
        maxExact = 0;
        return false;
    }

    internal static (double MinTotal, double MaxTotal, string Source) GetTrackedTargetTotalRange(SessionState session)
    {
        return TryGetTargetExactRange(session, out double minTotal, out double maxTotal, out string source)
            ? (minTotal, maxTotal, source)
            : (0, 0, "n/a");
    }

    internal static (double Threshold, long ThresholdBid) ComputeServerThresholdBid(SessionState session)
    {
        int roundNumber = Math.Max(1, session.BidNumber + 1);
        double chosenThreshold = 0;
        bool initialized = false;

        foreach (Candidate candidate in session.Candidates)
        {
            double threshold = candidate.ExactPrice * (1.0 - ((candidate.Mcic / 250.0) / roundNumber));
            if (!initialized)
            {
                chosenThreshold = threshold;
                initialized = true;
                continue;
            }

            if (string.Equals(session.BuySell, "SELLING", StringComparison.OrdinalIgnoreCase))
                chosenThreshold = Math.Max(chosenThreshold, threshold);
            else
                chosenThreshold = Math.Min(chosenThreshold, threshold);
        }

        return (chosenThreshold, PascalRoundInt(chosenThreshold, 0));
    }

    private static string BuildRouteKey(int sector, string productKey, string buySell, bool isPlanetTrade) =>
        string.Create(
            CultureInfo.InvariantCulture,
            $"{sector}:{productKey}:{buySell}:{(isPlanetTrade ? "PLANET" : "PORT")}");

    internal static bool TryGetTargetExactRange(SessionState session, out double minExact, out double maxExact, out string source)
    {
        if (TryGetPreferredExactRange(session, out minExact, out maxExact))
        {
            source = session.Candidates.Count > 0 ? "candidates" : "hidden-tracker";
            return true;
        }

        minExact = 0;
        maxExact = 0;
        source = "n/a";
        return false;
    }

    internal static double ComputeCandidateExactPrice(SessionState session, Candidate candidate, int effectiveQty)
    {
        double expAdjust = session.Experience > 999
            ? 0
            : session.PlusMinus * ((1000.0 - session.Experience) / 100.0);

        double priceBase = ((session.PlusMinus * candidate.BaseVar) + session.BasePrice)
            - (((candidate.Mcic * session.ProductFactor) * effectiveQty) / (10.0 * candidate.Productivity))
            - expAdjust;

        while (priceBase < 4.0)
            priceBase += 1.0;

        return priceBase * session.TradeQty;
    }

    // This is still a ratio-only approximation until the real TradeData.+0x6c probe path is modeled.
    internal static bool TryGetServerProbeRange(
        SessionState session,
        long bid,
        out double serverProbeMin,
        out double serverProbeMax,
        out int serverBucketMin,
        out int serverBucketMax)
    {
        serverProbeMin = 0;
        serverProbeMax = 0;
        serverBucketMin = 0;
        serverBucketMax = 0;

        if (bid <= 0)
            return false;

        if (!TryGetTargetExactRange(session, out double minExact, out double maxExact, out _))
            return false;

        ServerProbeBranch branch = GetServerProbeBranch(session, bid);
        long exactOverBidRawMin = Math.Max(0L, (long)Math.Truncate((minExact * 10000.0) / bid));
        long exactOverBidRawMax = Math.Max(0L, (long)Math.Truncate((maxExact * 10000.0) / bid));
        long bidOverExactRawMin = Math.Max(0L, (long)Math.Truncate((bid * 10000.0) / maxExact));
        long bidOverExactRawMax = Math.Max(0L, (long)Math.Truncate((bid * 10000.0) / minExact));

        if (branch == ServerProbeBranch.BidOverHidden)
        {
            serverProbeMin = bidOverExactRawMin / 100.0;
            serverProbeMax = bidOverExactRawMax / 100.0;
            serverBucketMin = (int)(bidOverExactRawMin / 100);
            serverBucketMax = (int)(bidOverExactRawMax / 100);
            return true;
        }

        if (branch == ServerProbeBranch.HiddenOverBid)
        {
            serverProbeMin = exactOverBidRawMin / 100.0;
            serverProbeMax = exactOverBidRawMax / 100.0;
            serverBucketMin = (int)(exactOverBidRawMin / 100);
            serverBucketMax = (int)(exactOverBidRawMax / 100);
            return true;
        }

        serverProbeMin = Math.Min(exactOverBidRawMin / 100.0, bidOverExactRawMin / 100.0);
        serverProbeMax = Math.Max(exactOverBidRawMax / 100.0, bidOverExactRawMax / 100.0);
        serverBucketMin = (int)Math.Min(exactOverBidRawMin / 100, bidOverExactRawMin / 100);
        serverBucketMax = (int)Math.Max(exactOverBidRawMax / 100, bidOverExactRawMax / 100);
        return true;
    }

    private static bool TryGetRewardTierBucket(string rewardTier, out int bucket)
    {
        switch (rewardTier.Trim().ToUpperInvariant())
        {
            case "GOOD":
                bucket = 98;
                return true;
            case "GREAT":
                bucket = 99;
                return true;
            case "EXCELLENT":
                bucket = 100;
                return true;
            default:
                bucket = 0;
                return false;
        }
    }

    private static bool TryGetRewardTierHiddenRange(
        SessionState session,
        long bid,
        string rewardTier,
        out double impliedHiddenMin,
        out double impliedHiddenMax,
        out int rewardBucket)
    {
        impliedHiddenMin = 0;
        impliedHiddenMax = 0;
        rewardBucket = 0;

        if (bid <= 0 || !TryGetRewardTierBucket(rewardTier, out rewardBucket))
            return false;

        ServerProbeBranch branch = GetServerProbeBranch(session, bid);
        if (branch == ServerProbeBranch.HiddenOverBid)
        {
            impliedHiddenMin = bid * (rewardBucket / 100.0);
            impliedHiddenMax = bid * ((rewardBucket + 1) / 100.0);
            return true;
        }

        if (branch == ServerProbeBranch.BidOverHidden)
        {
            impliedHiddenMin = bid * (100.0 / (rewardBucket + 1.0));
            impliedHiddenMax = bid * (100.0 / rewardBucket);
            return true;
        }

        return false;
    }

    private static string DescribeRewardHiddenComparison(SessionState session)
    {
        if (session.LastCounter <= 0 ||
            !TryGetRewardTierHiddenRange(session, session.LastCounter, session.RewardTier, out double impliedHiddenMin, out double impliedHiddenMax, out int rewardBucket))
        {
            return "rewardHidden=n/a";
        }

        string modelRange = "n/a";
        string modelSource = "n/a";
        double modelMid = 0;
        if (TryGetTargetExactRange(session, out double modelMin, out double modelMax, out modelSource))
        {
            modelRange = string.Create(
                CultureInfo.InvariantCulture,
                $"{modelMin:0.000000}..{modelMax:0.000000}");
            modelMid = (modelMin + modelMax) / 2.0;
        }

        double impliedMid = (impliedHiddenMin + impliedHiddenMax) / 2.0;
        string deltaText = modelMid > 0
            ? (impliedMid - modelMid).ToString("+0.000000;-0.000000;0.000000", CultureInfo.InvariantCulture)
            : "n/a";
        string scaleText = modelMid > 0
            ? (impliedMid / modelMid).ToString("0.000000", CultureInfo.InvariantCulture)
            : "n/a";

        return string.Create(
            CultureInfo.InvariantCulture,
            $"rewardBucket={rewardBucket} impliedHidden={impliedHiddenMin:0.000000}..{impliedHiddenMax:0.000000} modelHidden={modelRange} modelSource={modelSource} hiddenDelta={deltaText} hiddenScale={scaleText}");
    }

    internal static string DescribePredictedProbe(SessionState session, long bid)
    {
        if (bid <= 0)
            return "probe=n/a";

        if (TryDescribeTrackedProbe(session, bid, out string trackedProbe))
            return trackedProbe;

        if (session.Candidates.Count == 0)
            return "probe=n/a";

        double exactOverBidMin = double.MaxValue;
        double exactOverBidMax = double.MinValue;
        double bidOverExactMin = double.MaxValue;
        double bidOverExactMax = double.MinValue;
        int exactOverBidBucketMin = int.MaxValue;
        int exactOverBidBucketMax = int.MinValue;
        int bidOverExactBucketMin = int.MaxValue;
        int bidOverExactBucketMax = int.MinValue;

        foreach (Candidate candidate in session.Candidates)
        {
            if (candidate.ExactPrice <= 0)
                continue;

            long exactOverBidRaw = Math.Max(0L, (long)Math.Truncate((candidate.ExactPrice * 10000.0) / bid));
            long bidOverExactRaw = Math.Max(0L, (long)Math.Truncate((bid * 10000.0) / candidate.ExactPrice));

            double exactOverBid = exactOverBidRaw / 100.0;
            double bidOverExact = bidOverExactRaw / 100.0;
            int exactBucket = (int)(exactOverBidRaw / 100);
            int bidBucket = (int)(bidOverExactRaw / 100);

            if (exactOverBid < exactOverBidMin)
                exactOverBidMin = exactOverBid;
            if (exactOverBid > exactOverBidMax)
                exactOverBidMax = exactOverBid;
            if (bidOverExact < bidOverExactMin)
                bidOverExactMin = bidOverExact;
            if (bidOverExact > bidOverExactMax)
                bidOverExactMax = bidOverExact;
            if (exactBucket < exactOverBidBucketMin)
                exactOverBidBucketMin = exactBucket;
            if (exactBucket > exactOverBidBucketMax)
                exactOverBidBucketMax = exactBucket;
            if (bidBucket < bidOverExactBucketMin)
                bidOverExactBucketMin = bidBucket;
            if (bidBucket > bidOverExactBucketMax)
                bidOverExactBucketMax = bidBucket;
        }

        if (exactOverBidMin == double.MaxValue || bidOverExactMin == double.MaxValue)
            return "probe=n/a";

        ServerProbeBranch branch = GetServerProbeBranch(session, bid);
        (double serverProbeMin, double serverProbeMax, int serverBucketMin, int serverBucketMax) = branch switch
        {
            ServerProbeBranch.BidOverHidden => (bidOverExactMin, bidOverExactMax, bidOverExactBucketMin, bidOverExactBucketMax),
            ServerProbeBranch.HiddenOverBid => (exactOverBidMin, exactOverBidMax, exactOverBidBucketMin, exactOverBidBucketMax),
            _ => (
                Math.Min(exactOverBidMin, bidOverExactMin),
                Math.Max(exactOverBidMax, bidOverExactMax),
                Math.Min(exactOverBidBucketMin, bidOverExactBucketMin),
                Math.Max(exactOverBidBucketMax, bidOverExactBucketMax)),
        };

        return string.Create(
            CultureInfo.InvariantCulture,
            $"probeModel=ratio exact/bid={exactOverBidMin:0.00}..{exactOverBidMax:0.00} bucket={exactOverBidBucketMin}..{exactOverBidBucketMax} bid/exact={bidOverExactMin:0.00}..{bidOverExactMax:0.00} bucket={bidOverExactBucketMin}..{bidOverExactBucketMax} serverBranch={DescribeServerProbeBranch(branch)} serverProbe={serverProbeMin:0.00}..{serverProbeMax:0.00} serverBucket={serverBucketMin}..{serverBucketMax}");
    }

    internal static bool TryDescribeTrackedProbe(SessionState session, long bid, out string description)
    {
        if (bid <= 0 || !TryGetTargetExactRange(session, out double minExact, out double maxExact, out string exactSource))
        {
            description = string.Empty;
            return false;
        }

        long exactOverBidRawMin = Math.Max(0L, (long)Math.Truncate((minExact * 10000.0) / bid));
        long exactOverBidRawMax = Math.Max(0L, (long)Math.Truncate((maxExact * 10000.0) / bid));
        long bidOverExactRawMin = Math.Max(0L, (long)Math.Truncate((bid * 10000.0) / maxExact));
        long bidOverExactRawMax = Math.Max(0L, (long)Math.Truncate((bid * 10000.0) / minExact));
        ServerProbeBranch branch = GetServerProbeBranch(session, bid);
        (double serverProbeMin, double serverProbeMax, long serverBucketMin, long serverBucketMax) = branch switch
        {
            ServerProbeBranch.BidOverHidden => (bidOverExactRawMin / 100.0, bidOverExactRawMax / 100.0, bidOverExactRawMin / 100, bidOverExactRawMax / 100),
            ServerProbeBranch.HiddenOverBid => (exactOverBidRawMin / 100.0, exactOverBidRawMax / 100.0, exactOverBidRawMin / 100, exactOverBidRawMax / 100),
            _ => (
                Math.Min(exactOverBidRawMin / 100.0, bidOverExactRawMin / 100.0),
                Math.Max(exactOverBidRawMax / 100.0, bidOverExactRawMax / 100.0),
                Math.Min(exactOverBidRawMin / 100, bidOverExactRawMin / 100),
                Math.Max(exactOverBidRawMax / 100, bidOverExactRawMax / 100)),
        };

        description = string.Create(
            CultureInfo.InvariantCulture,
            $"probeModel=ratio exact/bid={exactOverBidRawMin / 100.0:0.00}..{exactOverBidRawMax / 100.0:0.00} bucket={exactOverBidRawMin / 100}..{exactOverBidRawMax / 100} bid/exact={bidOverExactRawMin / 100.0:0.00}..{bidOverExactRawMax / 100.0:0.00} bucket={bidOverExactRawMin / 100}..{bidOverExactRawMax / 100} serverBranch={DescribeServerProbeBranch(branch)} serverProbe={serverProbeMin:0.00}..{serverProbeMax:0.00} serverBucket={serverBucketMin}..{serverBucketMax} exactSource={exactSource}");
        return true;
    }

    internal static ServerProbeBranch GetServerProbeBranch(SessionState session, long bid)
    {
        return FallbackServerProbeBranch(session);
    }

    internal static bool TryGetServerProbeComparisonRange(SessionState session, out double hiddenMin, out double hiddenMax)
    {
        hiddenMin = 0;
        hiddenMax = 0;

        return TryGetTargetExactRange(session, out hiddenMin, out hiddenMax, out _);
    }

    internal static ServerProbeBranch FallbackServerProbeBranch(SessionState session) =>
        string.Equals(session.BuySell, "BUYING", StringComparison.OrdinalIgnoreCase)
            ? ServerProbeBranch.HiddenOverBid
            : ServerProbeBranch.BidOverHidden;

    internal static string DescribeServerProbeBranch(ServerProbeBranch branch) =>
        branch switch
        {
            ServerProbeBranch.BidOverHidden => "bid/hidden",
            ServerProbeBranch.HiddenOverBid => "hidden/bid",
            _ => "overlap",
        };

    private string GetActiveHaggleMode(bool isPlanetTrade)
    {
        NativeHaggleTradeKind tradeKind = isPlanetTrade ? NativeHaggleTradeKind.Planet : NativeHaggleTradeKind.Port;
        string configuredMode = isPlanetTrade ? _planetBidMode : _portBidMode;
        string overrideVariable = isPlanetTrade ? "TWX_HAGGLE_PLANET_EXPERIMENT" : "TWX_HAGGLE_EXPERIMENT";
        string? overrideMode = Environment.GetEnvironmentVariable(overrideVariable);
        string resolved = ResolveConfiguredMode(
            string.IsNullOrWhiteSpace(overrideMode) ? null : overrideMode,
            configuredMode,
            tradeKind);
        if (!string.IsNullOrWhiteSpace(overrideMode))
        {
            GlobalModules.DebugLog(
                $"[NativeHaggle] {overrideVariable} override='{overrideMode}' selectedMode='{resolved}' configuredMode='{configuredMode}' tradeKind={tradeKind}\n");
        }

        return resolved;
    }

    internal static long NormalizeBidForDirection(SessionState session, long offer, long bid)
    {
        if (string.Equals(session.BuySell, "SELLING", StringComparison.OrdinalIgnoreCase))
        {
            if (bid >= offer)
                bid = offer - 1;
            return Math.Max(1, bid);
        }

        if (bid <= offer)
            bid = offer + 1;
        return Math.Max(offer + 1, bid);
    }

    private bool IsModeAvailableForTradeKind(string? modeId, NativeHaggleTradeKind tradeKind)
    {
        NativeHaggleModeInfo? info = NativeHaggleModeCatalog.GetModeInfo(modeId, _extensionModes.Values);
        return info?.SupportsTradeKind(tradeKind) == true;
    }

    private string? GetLastMissingModeId(NativeHaggleTradeKind tradeKind) =>
        tradeKind == NativeHaggleTradeKind.Planet ? _lastMissingPlanetModeId : _lastMissingPortModeId;

    private void SetLastMissingModeId(NativeHaggleTradeKind tradeKind, string? modeId)
    {
        if (tradeKind == NativeHaggleTradeKind.Planet)
            _lastMissingPlanetModeId = modeId;
        else
            _lastMissingPortModeId = modeId;
    }

    private string ResolveConfiguredMode(string? preferredMode, string? fallbackMode, NativeHaggleTradeKind tradeKind)
    {
        if (!string.IsNullOrWhiteSpace(preferredMode))
        {
            string preferred = NativeHaggleModes.Normalize(preferredMode);
            if (IsModeAvailableForTradeKind(preferred, tradeKind))
            {
                SetLastMissingModeId(tradeKind, null);
                return preferred;
            }

            string fallbackForMissingPreferred = string.IsNullOrWhiteSpace(fallbackMode)
                ? (tradeKind == NativeHaggleTradeKind.Planet ? NativeHaggleModes.DefaultPlanet : NativeHaggleModes.Default)
                : NativeHaggleModes.Normalize(fallbackMode);
            if (IsModeAvailableForTradeKind(fallbackForMissingPreferred, tradeKind))
            {
                if (!string.Equals(GetLastMissingModeId(tradeKind), preferred, StringComparison.OrdinalIgnoreCase))
                {
                    SetLastMissingModeId(tradeKind, preferred);
                    GlobalModules.DebugLog(
                        $"[NativeHaggle] Mode '{preferred}' is unavailable for {tradeKind}; falling back to '{fallbackForMissingPreferred}'.\n");
                }
                return fallbackForMissingPreferred;
            }
        }

        string fallback = string.IsNullOrWhiteSpace(fallbackMode)
            ? (tradeKind == NativeHaggleTradeKind.Planet ? NativeHaggleModes.DefaultPlanet : NativeHaggleModes.Default)
            : NativeHaggleModes.Normalize(fallbackMode);
        if (IsModeAvailableForTradeKind(fallback, tradeKind))
        {
            SetLastMissingModeId(tradeKind, null);
            return fallback;
        }

        SetLastMissingModeId(tradeKind, null);
        return tradeKind == NativeHaggleTradeKind.Planet ? NativeHaggleModes.DefaultPlanet : NativeHaggleModes.Default;
    }

    private static void PersistDerivedRanges(SessionState session)
    {
        if (!TryGetCandidateRange(session, out int minMcic, out int maxMcic, out int minProductivity, out int maxProductivity))
            return;

        ModDatabase? db = ScriptRef.GetActiveDatabase();
        if (db == null)
            return;

        WriteInt(db, session.Sector, session.ProductKey + "-", minMcic);
        WriteInt(db, session.Sector, session.ProductKey + "+", maxMcic);
        WriteInt(db, session.Sector, session.ProductKey + "L", minProductivity);
        WriteInt(db, session.Sector, session.ProductKey + "H", maxProductivity);
    }

    private void PersistMcicCompatibilityParameters(SessionState session, bool success)
    {
        if (!success)
            return;

        ModDatabase? db = ScriptRef.GetActiveDatabase();
        if (db == null)
            return;

        if (!TryGetPersistableMcicRange(session, out int minMcic, out int maxMcic, out int representativeMcic))
            return;

        WriteInt(db, session.Sector, session.ProductKey + "-", minMcic);
        WriteInt(db, session.Sector, session.ProductKey + "+", maxMcic);

        string? legacyAlias = GetLegacyMcicAlias(session.ProductKey);
        if (!string.IsNullOrEmpty(legacyAlias))
            WriteInt(db, session.Sector, legacyAlias, representativeMcic);

        GlobalModules.DebugLog(
            $"[NativeHaggle] Persisted MCIC sector={session.Sector} product={session.ProductKey} buysell={session.BuySell} legacyKey='{legacyAlias ?? "-"}' legacyValue={representativeMcic} range={minMcic}..{maxMcic}\n");
    }

    private static bool TryGetPersistableMcicRange(SessionState session, out int minMcic, out int maxMcic, out int representativeMcic)
    {
        minMcic = 0;
        maxMcic = 0;
        representativeMcic = 0;

        if (session.IsPlanetTrade)
        {
            int mcic = session.PlanetSolvedMcic != 0
                ? session.PlanetSolvedMcic
                : session.PlanetQualityMcic;
            if (mcic == 0)
                return false;

            minMcic = mcic;
            maxMcic = mcic;
            representativeMcic = mcic;
            return true;
        }

        if (!TryGetCandidateRange(session, out minMcic, out maxMcic, out _, out _))
            return false;

        representativeMcic = minMcic == maxMcic
            ? minMcic
            : (int)PascalRoundInt((minMcic + maxMcic) / 2.0, 0);
        return true;
    }

    private static bool TryGetCandidateRange(
        SessionState session,
        out int minMcic,
        out int maxMcic,
        out int minProductivity,
        out int maxProductivity)
    {
        minMcic = 0;
        maxMcic = 0;
        minProductivity = 0;
        maxProductivity = 0;

        if (session.Candidates.Count == 0)
            return false;

        foreach (Candidate candidate in session.Candidates)
        {
            if (minMcic == 0 || (candidate.Mcic * session.McicStep) < (minMcic * session.McicStep))
                minMcic = candidate.Mcic;
            if ((candidate.Mcic * session.McicStep) > (maxMcic * session.McicStep))
                maxMcic = candidate.Mcic;
            if (minProductivity == 0 || candidate.Productivity < minProductivity)
                minProductivity = candidate.Productivity;
            if (candidate.Productivity > maxProductivity)
                maxProductivity = candidate.Productivity;
        }

        return true;
    }

    private static string? GetLegacyMcicAlias(string productKey) => productKey switch
    {
        "FUEL" => "OREMCIC",
        "ORGANICS" => "ORGMCIC",
        "EQUIPMENT" => "EQUMCIC",
        _ => null,
    };

    private static bool TryEnableHeuristicFallback(SessionState session, long offer, string reason)
    {
        if (session.HeuristicFallback)
            return true;

        if (reason == "filter-failed")
        {
            if (session.BidNumber <= 0 || session.LastOffer <= 0 || session.LastCounter <= 0)
                return false;
        }
        else if (reason == "derive-failed")
        {
            if (offer <= 0)
                return false;
        }
        else
        {
            return false;
        }

        session.HeuristicFallback = true;
        session.Candidates.Clear();

        GlobalModules.DebugLog(
            $"[NativeHaggle] Switching to heuristic fallback ({reason}) for sector={session.Sector} product={session.ProductKey} buysell={session.BuySell} offer={offer} lastOffer={session.LastOffer} lastCounter={session.LastCounter}\n");
        return true;
    }

    private static long ComputeHeuristicBid(SessionState session, long offer)
    {
        long priorOffer = session.LastOffer > 0 ? session.LastOffer : offer;
        long priorCounter = session.LastCounter > 0 ? session.LastCounter : offer;

        if (string.Equals(session.BuySell, "SELLING", StringComparison.OrdinalIgnoreCase))
        {
            return ComputeBuyHeuristicBid(session, offer, priorOffer, priorCounter);
        }

        return ComputeSellHeuristicBid(session, offer, priorOffer, priorCounter);
    }

    private static long ComputeRepeatedPromptBid(SessionState session, long offer)
    {
        if (session.BidNumber <= 1)
        {
            if (string.Equals(session.BuySell, "SELLING", StringComparison.OrdinalIgnoreCase))
            {
                long retry = (offer * 92) / 100;
                if (retry <= session.LastCounter)
                    retry = session.LastCounter + Math.Max(1, (offer - session.LastCounter) / 2);
                if (retry >= offer)
                    retry = offer - 1;
                return Math.Max(1, retry);
            }

            long opening = (offer * 108) / 100;
            if (opening <= offer)
                opening = offer + 1;
            if (opening >= session.LastCounter && session.LastCounter > offer)
                opening = offer + Math.Max(1, (session.LastCounter - offer) / 2);
            return Math.Max(offer + 1, opening);
        }

        long bid = ComputeHeuristicBid(session, offer);
        if (string.Equals(session.BuySell, "SELLING", StringComparison.OrdinalIgnoreCase))
        {
            if (bid <= session.LastCounter)
                bid = session.LastCounter + 1;
            if (bid >= offer)
                bid = offer - 1;
            return Math.Max(1, bid);
        }

        if (bid >= session.LastCounter)
            bid = session.LastCounter - 1;
        return Math.Max(offer + 1, bid);
    }

    private static long ComputeBuyHeuristicBid(SessionState session, long offer, long priorOffer, long priorCounter)
    {
        long counter;
        if (session.BidNumber == 0)
        {
            counter = (offer * 92) / 100;
            if (counter <= 0)
                counter = offer;
        }
        else if (session.FinalOffer)
        {
            long offerChange = offer - priorOffer;
            offerChange -= 1;
            offerChange = (offerChange * 25) / 10;
            counter = priorCounter - offerChange;
            if (counter == priorCounter)
                counter += 1;
            counter += 1;
        }
        else
        {
            long offerPct = (offer * 1000) / Math.Max(1, priorOffer);
            if (offerPct > 990)
                offerPct = 990;

            counter = (priorCounter * 1000) / Math.Max(1, offerPct);
            if (counter <= priorCounter)
                counter += 1;
        }

        if (counter <= 0)
            counter = Math.Max(1, offer);
        return counter;
    }

    private static long ComputeSellHeuristicBid(SessionState session, long offer, long priorOffer, long priorCounter)
    {
        long counter;
        if (session.BidNumber == 0)
        {
            counter = (offer * 108) / 100;
            if (counter <= offer)
                counter = offer + 1;
        }
        else if (session.FinalOffer)
        {
            long offerChange = offer - priorOffer;
            offerChange = (offerChange * 25) / 10;
            counter = priorCounter - offerChange;
            counter -= 3;
        }
        else
        {
            long offerPct = (offer * 1000) / Math.Max(1, priorOffer);
            if (offerPct < 1003)
                offerPct = 1003;

            counter = (priorCounter * 1000) / Math.Max(1, offerPct);
            if (counter >= priorCounter)
                counter -= 1;
        }

        if (counter <= 0)
            counter = Math.Max(1, offer);
        return counter;
    }

    private void Reset(string reason)
    {
        if (_session != null)
        {
            bool attemptedTrade = _session.BidNumber > 0 || _session.LastCounter > 0 || _session.PendingBid > 0;
            if (attemptedTrade && !_session.OutcomeRecorded)
            {
                bool acceptedPlanetTrade =
                    _session.IsPlanetTrade &&
                    string.Equals(reason, "command-prompt", StringComparison.OrdinalIgnoreCase) &&
                    _session.PlanetAcceptanceSeen;
                PushScriptState(ResolveScriptStateCredits(), abort: !acceptedPlanetTrade);
                RecordOutcome(
                    success: acceptedPlanetTrade,
                    acceptedPlanetTrade ? $"reset:{reason}:planet-accepted" : $"reset:{reason}");
            }

            GlobalModules.DebugLog($"[NativeHaggle] Reset reason='{reason}' sector={_session.Sector} product={_session.ProductKey}\n");
        }
        ClearTradeState();
        _tradeSuppressed = false;
    }

    private void ClearTradeState()
    {
        _session = null;
        _pendingProductKey = null;
        _pendingBuySell = null;
        _pendingIsPlanetTrade = false;
        _awaitingTradeQtyReply = false;
    }

    private bool AllowScriptTradeQuantityReply(string text)
    {
        if (!_awaitingTradeQtyReply)
            return false;

        string trimmed = text.Trim();
        if (trimmed.EndsWith("\r", StringComparison.Ordinal))
            trimmed = trimmed[..^1];
        if (trimmed.EndsWith("\n", StringComparison.Ordinal))
            trimmed = trimmed[..^1];
        trimmed = trimmed.Trim();

        if (trimmed.Length == 0)
            return false;

        foreach (char c in trimmed)
        {
            if (!char.IsDigit(c))
                return false;
        }

        _awaitingTradeQtyReply = false;
        string escaped = text.Replace("\r", "\\r", StringComparison.Ordinal)
            .Replace("\n", "\\n", StringComparison.Ordinal);
        GlobalModules.DebugLog($"[NativeHaggle] Allowing script quantity handoff: '{escaped}'\n");
        if (_pendingIsPlanetTrade)
            GlobalModules.PlanetHaggleDebug($"[NativeHaggle] QTY-HANDOFF product={_pendingProductKey ?? "-"} qty='{trimmed}'\n");
        else
            GlobalModules.PortHaggleDebug($"[NativeHaggle] QTY-HANDOFF product={_pendingProductKey ?? "-"} qty='{trimmed}'\n");
        return true;
    }

    private void RecordOutcome(bool success, string reason)
    {
        if (_session == null || _session.OutcomeRecorded)
            return;

        _session.OutcomeRecorded = true;
        _completedHaggles++;
        if (success)
            _successfulHaggles++;

        PersistMcicCompatibilityParameters(_session, success);
        ApplyPlanetTradeOutcome(_session, success);
        if (!UsesCherokeePlanetBaseline(_session))
            GetActiveModeExtension(_session.ActiveMode)?.OnOutcome(this, _session, success, reason);

        string routeState = DescribeModeState(_session);

        if (_session.IsPlanetTrade)
        {
            string probe = (_session.LastCounter > 0)
                ? DescribePredictedProbe(_session, _session.LastCounter)
                : "probe=n/a";
            GlobalModules.DebugLog(
                $"[NativeHaggle] Outcome recorded success={success} reason='{reason}' completed={_completedHaggles} successful={_successfulHaggles} good={_goodRewardCount} great={_greatRewardCount} excellent={_excellentRewardCount} pct={SuccessRatePercent}% sector={_session.Sector} product={_session.ProductKey} buysell={_session.BuySell} route={_session.RouteKey} activeMode={_session.ActiveMode} activeModeName='{_session.ActiveModeDisplayName}' bidNumber={_session.BidNumber} lastOffer={_session.LastOffer} lastCounter={_session.LastCounter} {DescribeStartCargoSnapshot(_session)} {probe} {routeState}\n");
            WriteTradeDebug(_session,
                $"[NativeHaggle] OUTCOME success={success} reason='{reason}' route={_session.RouteKey} bidNumber={_session.BidNumber} lastOffer={_session.LastOffer} lastCounter={_session.LastCounter} {routeState}\n");
        }
        else
        {
            string probe = (_session.LastCounter > 0)
                ? DescribePredictedProbe(_session, _session.LastCounter)
                : "probe=n/a";
            string rewardHidden = DescribeRewardHiddenComparison(_session);
            string rewardTier = string.IsNullOrWhiteSpace(_session.RewardTier) ? "-" : _session.RewardTier;

            GlobalModules.DebugLog(
                $"[NativeHaggle] Outcome recorded success={success} reason='{reason}' rewardTier='{rewardTier}' rewardExp={_session.RewardExperience} completed={_completedHaggles} successful={_successfulHaggles} good={_goodRewardCount} great={_greatRewardCount} excellent={_excellentRewardCount} pct={SuccessRatePercent}% sector={_session.Sector} product={_session.ProductKey} buysell={_session.BuySell} route={_session.RouteKey} activeMode={_session.ActiveMode} activeModeName='{_session.ActiveModeDisplayName}' bidNumber={_session.BidNumber} empiricalProbe={_session.EmpiricalProbeApplied} empiricalNudge={_session.EmpiricalProbeNudge} lastOffer={_session.LastOffer} lastCounter={_session.LastCounter} {DescribeStartCargoSnapshot(_session)} {probe} {rewardHidden} {routeState}\n");
            WriteTradeDebug(_session,
                $"[NativeHaggle] OUTCOME success={success} reason='{reason}' rewardTier='{rewardTier}' rewardExp={_session.RewardExperience} route={_session.RouteKey} bidNumber={_session.BidNumber} lastOffer={_session.LastOffer} lastCounter={_session.LastCounter} {routeState}\n");
        }
        StatsChanged?.Invoke();
    }

    private NativeHaggleModeExtension? GetActiveModeExtension(string? modeId)
    {
        string normalized = NativeHaggleModes.Normalize(modeId);
        if (normalized == NativeHaggleModes.Aggressive)
            return _aggressiveMode;

        return _extensionModes.TryGetValue(normalized, out NativeHaggleModeExtension? extension)
            ? extension
            : null;
    }

    private string DescribeModeState(SessionState session)
    {
        if (UsesCherokeePlanetBaseline(session))
        {
            return string.Create(
                CultureInfo.InvariantCulture,
                $"modeState=planetCherokee(ptrade={session.PlanetTradeSettingPercent} portMaxInit={session.PlanetPortMaxInit} mcic={session.PlanetQualityMcic} multiple={session.PlanetQualityMultiple} midHaggles={session.PlanetMidHaggles} forceFail={session.PlanetForceFailApplied} failCounts={_planetTradeRunState.OreSellFailures}/{_planetTradeRunState.OrgSellFailures}/{_planetTradeRunState.EquSellFailures} visitFails={_planetTradeRunState.ThisOreFailed}/{_planetTradeRunState.ThisOrgFailed}/{_planetTradeRunState.ThisEquFailed})");
        }

        NativeHaggleModeExtension? extension = GetActiveModeExtension(session.ActiveMode);
        return extension?.DescribeState(this, session) ?? "modeState=n/a";
    }

    private static string NormalizeWeekday(string value)
    {
        string day = value.Trim();
        if (day.Length >= 3)
            day = day[..3];
        return day.ToUpperInvariant() switch
        {
            "MON" => "Mon",
            "TUE" => "Tue",
            "WED" => "Wed",
            "THU" => "Thu",
            "FRI" => "Fri",
            "SAT" => "Sat",
            "SUN" => "Sun",
            _ => "Sat",
        };
    }

    private static long ParseLong(string value) =>
        long.Parse(value.Replace(",", string.Empty), NumberStyles.Integer, CultureInfo.InvariantCulture);

    private static int ParseInt(string value) =>
        int.Parse(value.Replace(",", string.Empty), NumberStyles.Integer, CultureInfo.InvariantCulture);

    private static PlanetTradeQualityEntry[] ParsePlanetQualityTable(string table)
    {
        string[] lines = table.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        var entries = new List<PlanetTradeQualityEntry>(lines.Length);

        foreach (string rawLine in lines)
        {
            string[] parts = rawLine.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 3)
                continue;

            entries.Add(new PlanetTradeQualityEntry(
                ParseInt(parts[0]),
                ParseInt(parts[1]),
                ParseInt(parts[2])));
        }

        return entries.ToArray();
    }

    private static int ResolvePlanetTradeSettingPercent()
    {
        string value = ScriptRef.GetCurrentGameVar(
            "$GAME~ptradesetting",
            ScriptRef.GetCurrentGameVar("$ptradesetting", "100"));

        value = value.Trim().TrimEnd('%');
        if (!int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out int parsed))
            parsed = 100;

        return Math.Clamp(parsed, 1, 100);
    }

    private static int ReadInt(ModDatabase? db, int sector, string key)
    {
        int value = ReadSignedInt(db, sector, key);
        return value == int.MinValue ? 0 : value;
    }

    private static int ReadSignedInt(ModDatabase? db, int sector, string key)
    {
        if (db == null)
            return int.MinValue;

        string raw = db.GetSectorVar(sector, key);
        if (string.IsNullOrWhiteSpace(raw))
            return int.MinValue;
        return int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out int parsed)
            ? parsed
            : int.MinValue;
    }

    private static void WriteInt(ModDatabase db, int sector, string key, int value)
    {
        db.SetSectorVar(sector, key, value.ToString(CultureInfo.InvariantCulture));
    }

    private static bool ApplyDeriveRecovery(SessionState session)
    {
        ModDatabase? db = ScriptRef.GetActiveDatabase();
        if (session.DeriveFailures == 0)
        {
            session.DeriveFailures = 1;
            session.HighProductivity = session.MaxProductivity;
            if (db != null)
                WriteInt(db, session.Sector, session.ProductKey + "H", session.MaxProductivity);
            GlobalModules.DebugLog(
                $"[NativeHaggle] Derive recovery #1 sector={session.Sector} product={session.ProductKey} highProd->{session.HighProductivity}\n");
            return true;
        }

        if (session.DeriveFailures == 1)
        {
            session.DeriveFailures = 2;
            session.McicMin = session.DefaultMcicMin;
            session.McicMax = session.DefaultMcicMax;
            session.LowProductivity = session.CalculatedLowProductivity;
            session.HighProductivity = session.MaxProductivity;
            session.BaseVarMin = 0;
            session.BaseVarMax = 18;
            if (db != null)
            {
                WriteInt(db, session.Sector, session.ProductKey + "-", session.McicMin);
                WriteInt(db, session.Sector, session.ProductKey + "+", session.McicMax);
                WriteInt(db, session.Sector, session.ProductKey + "L", session.LowProductivity);
                WriteInt(db, session.Sector, session.ProductKey + "H", session.HighProductivity);
            }

            GlobalModules.DebugLog(
                $"[NativeHaggle] Derive recovery #2 sector={session.Sector} product={session.ProductKey} lowProd->{session.LowProductivity} highProd->{session.HighProductivity} mcicMin->{session.McicMin} mcicMax->{session.McicMax} baseVar=0..18\n");
            return true;
        }

        return false;
    }

    private static void LogCandidateSnapshot(SessionState session, long offer, string stage)
    {
        if (session.Candidates.Count == 0)
            return;

        int limit = Math.Min(session.Candidates.Count, 8);
        for (int i = 0; i < limit; i++)
        {
            Candidate candidate = session.Candidates[i];
            GlobalModules.DebugLog(
                $"[NativeHaggle] {stage} cand[{i + 1}/{session.Candidates.Count}] offer={offer} mcic={candidate.Mcic} baseVar={candidate.BaseVar} variance={candidate.Variance.ToString("0.000", CultureInfo.InvariantCulture)} prod={candidate.Productivity} exact={candidate.ExactPrice.ToString("0.000000", CultureInfo.InvariantCulture)}\n");
        }
    }

    private static void LogFilterFailure(SessionState session, long offer, List<Candidate> prior)
    {
        int limit = Math.Min(prior.Count, 8);
        for (int i = 0; i < limit; i++)
        {
            Candidate candidate = prior[i];
            double exactCounter = AdvanceServerHiddenTotal(candidate.ExactPrice, session.LastCounter);
            long projected = PascalRoundInt((((candidate.Mcic / 1000.0) + candidate.Variance) + 1.0) * exactCounter, 0);
            long delta = projected - offer;
            GlobalModules.DebugLog(
                $"[NativeHaggle] filter-fail cand[{i + 1}/{prior.Count}] target={offer} projected={projected} delta={delta} mcic={candidate.Mcic} baseVar={candidate.BaseVar} variance={candidate.Variance.ToString("0.000", CultureInfo.InvariantCulture)} prod={candidate.Productivity} exact={candidate.ExactPrice.ToString("0.000000", CultureInfo.InvariantCulture)} nextExact={exactCounter.ToString("0.000000", CultureInfo.InvariantCulture)} lastCounter={session.LastCounter}\n");
        }
    }

    internal static long PascalRoundInt(double value, int precision)
    {
        return (long)Math.Truncate(PascalRoundValue(value, precision));
    }

    internal static double PascalRoundValue(double value, int precision)
    {
        double factor = Math.Pow(10, precision);
        double scaled = value * factor;
        double integer = Math.Truncate(scaled);
        double fraction = scaled - integer;
        double point5 = 0.5 - 1e-17;
        if (fraction >= point5)
            scaled = integer + 1.0;
        else
            scaled = integer;
        return scaled / factor;
    }
}
