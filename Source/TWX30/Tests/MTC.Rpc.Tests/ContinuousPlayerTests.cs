using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using MTC;
using TWXProxy.Core;

internal static class ContinuousPlayerTests
{
    internal static async Task Run(string model = "models/frontier-v2", string? pythonExecutable = null, bool mission = false, int seed = 650000, bool expectRecovery = false, bool combat = false, bool campaign = false, bool career = false, bool flexible = false, bool rounds = false, bool zeroLoot = false, bool replaceColony = false, long? recoveryLoot = null, bool selectShip = false, bool combatAfterSettlement = false, bool spareSale = false, bool planetCatalog = false, bool colonyPreflight = false, bool combatOutcome = false, bool partialSaleFunding = false, bool captureAlternatives = false, bool captureSchedule = false, bool boundedNavigation = false, bool combatCommitment = false, bool recoveryProvision = false, bool tradeMemory = false, bool captureContinuation = false, bool captureDiscovery = false, bool captureSearch = false, bool marketClearance = false, bool recoveryRanking = false, bool supplySources = false, bool supplyReplan = false, string? outputTag = null, bool escapeReserve = false)
    {
        if (outputTag != null && (outputTag.Length is < 1 or > 64 ||
            outputTag.Any(c => !(c is >= 'a' and <= 'z' or >= '0' and <= '9' or '-'))))
            throw new ArgumentException("Player output tag must contain only lowercase ASCII letters, digits and hyphens");
        DirectoryInfo? root = new(AppContext.BaseDirectory);
        while (root != null && !Directory.Exists(Path.Combine(root.FullName, "tradewars-player"))) root = root.Parent;
        if (root == null) throw new Exception("Cannot locate player");
        string player = Path.Combine(root.FullName, "tradewars-player");
        string temporary = Path.Combine(Path.GetTempPath(), "mtc-player-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(temporary);
        string originalProgramDir = AppPaths.ProgramDir;
        AppPaths.SetConfiguredProgramDir(temporary);
        var database = new ModDatabase();
        database.CreateDatabase(Path.Combine(temporary, "game.xdb"), new DataHeader { Sectors = 100, CommandChar = '$' });
        ScriptRef.SetActiveDatabase(database);
        var engineStart = new ProcessStartInfo("dotnet") { RedirectStandardInput = true, RedirectStandardOutput = true, RedirectStandardError = true };
        engineStart.ArgumentList.Add(Path.Combine(player, "lab/bin/Release/net8.0/OpenTwEnvironment.dll"));
        using Process engine = Process.Start(engineStart) ?? throw new Exception("Cannot start engine");
        async Task<JsonElement> Request(object request)
        {
            await engine.StandardInput.WriteLineAsync(JsonSerializer.Serialize(request));
            await engine.StandardInput.FlushAsync();
            string line = await engine.StandardOutput.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(10)) ?? throw new Exception("Engine exited");
            using var doc = JsonDocument.Parse(line);
            if (doc.RootElement.TryGetProperty("error", out _)) throw new Exception(line);
            return doc.RootElement.Clone();
        }
        Process? policy = null;
        Task<string>? diagnosticError = null;
        try
        {
            if (zeroLoot && !career) throw new ArgumentException("Zero-loot fixture requires a career");
            if (replaceColony && (!career || flexible)) throw new ArgumentException("Replacement fixture requires a strict career");
            if (selectShip && !replaceColony) throw new ArgumentException("Selected ship fixture requires a recovery career");
            if (combatAfterSettlement && !selectShip) throw new ArgumentException("Purchased-hull combat fixture requires ship selection");
            if (spareSale && !selectShip) throw new ArgumentException("Spare-sale fixture requires a selected replacement career");
            if (captureAlternatives && !combatAfterSettlement) throw new ArgumentException("Capture-alternative fixture requires purchased-hull combat");
            if (captureSchedule && !captureAlternatives) throw new ArgumentException("Capture scheduling requires explicit alternative targets");
            if (boundedNavigation && !captureSchedule) throw new ArgumentException("Bounded navigation fixture requires capture scheduling");
            if (combatCommitment && !boundedNavigation) throw new ArgumentException("Commitment fixture requires bounded navigation");
            if (recoveryProvision && (!boundedNavigation || combatCommitment)) throw new ArgumentException("Recovery provisioning requires its bounded-navigation fixture");
            if (supplySources && !recoveryRanking) throw new ArgumentException("Supply source fixture requires the full recovery ranking career");
            if (supplyReplan && (!boundedNavigation || combatCommitment || recoveryProvision))
                throw new ArgumentException("Supply replan fixture requires the ordinary bounded-navigation career");
            if (escapeReserve && (!boundedNavigation || supplyReplan || combatCommitment || recoveryProvision))
                throw new ArgumentException("Escape reserve requires the ordinary bounded-navigation career");
            if (recoveryRanking && !marketClearance) throw new ArgumentException("Recovery ranking fixture requires market clearance");
            if (marketClearance && !captureSearch) throw new ArgumentException("Market clearance requires unnamed capture search");
            if (captureSearch && !captureDiscovery) throw new ArgumentException("Capture search requires unnamed identity discovery");
            if (captureDiscovery && (!captureAlternatives || captureSchedule || captureContinuation || spareSale)) throw new ArgumentException("Capture discovery requires ordered unnamed targets without ship sales");
            if (captureContinuation && (!captureAlternatives || captureSchedule || spareSale)) throw new ArgumentException("Capture continuation requires ordered targets without ship sales");
            if (tradeMemory && (!recoveryProvision || spareSale)) throw new ArgumentException("Trade memory requires recovery provisioning with retired-ship sales disabled");
            if (partialSaleFunding && (!spareSale || combatAfterSettlement)) throw new ArgumentException("Partial sale fixture requires early combat and spare-sale permission");
            if (combatOutcome && !combatAfterSettlement) throw new ArgumentException("Combat-outcome fixture requires purchased-hull combat");
            if (colonyPreflight && !planetCatalog) throw new ArgumentException("Colony preflight fixture requires the planet catalog");
            if (planetCatalog && !selectShip) throw new ArgumentException("Planet-catalog fixture requires ship selection");
            if (recoveryLoot != null && (!replaceColony || zeroLoot || recoveryLoot < 0)) throw new ArgumentException("Recovery loot fixture requires nonnegative explicit loot");
            var reset = new Dictionary<string, object>
            {
                ["method"] = "reset",
                ["scenario"] = career ? "campaign-combat" : campaign ? "campaign" : rounds ? ((seed / 5) % 2 == 0 ? "rounds-alien" : "rounds-pvp") : combat ? ((seed / 5) % 2 == 0 ? "combat-alien" : "combat-pvp") : mission ? "settle" : "trade",
                ["seed"] = mission ? seed : 314000
            };
            if (zeroLoot) { reset["opponentCredits"] = 0L; reset["initialTurns"] = 1000; }
            if (recoveryLoot != null) { reset["opponentCredits"] = recoveryLoot.Value; reset["initialTurns"] = 1000; }
            if (colonyPreflight) reset["numericPlanetCatalog"] = true;
            if (combatOutcome || partialSaleFunding || captureAlternatives) reset["captureFailPercent"] = 50;
            if (captureAlternatives) reset["alternateCaptureTargets"] = new[] {
                new { target = "Krel Voss", sector = captureSchedule ? 7 : 11 }, new { target = "Mira Fen", sector = captureSchedule ? 12 : 11 } };
            if (captureDiscovery) reset["captureNames"] = new[] { "Ilex Nine", "Orin Slate", "Vela Moss" };
            if (captureSearch) { reset["captureSectors"] = marketClearance ? new[] { 12, 4, 11 } : new[] { 12, 11, 11 }; reset["captureFailPercent"] = 0; }
            JsonElement result = await Request(reset);
            long startingCredits = result.GetProperty("evaluation").GetProperty("initialCredits").GetInt64();
            int originalShipId = result.GetProperty("evaluation").GetProperty("activeShipId").GetInt32();
            long spareSaleGain = 0;
            int spareSaleCount = 0;
            JsonElement? surveyedPlanetSpecs = null;
            JsonElement? verifiedCareerDetails = null;
            long? firstDockCredits = null;
            long? firstShipPurchaseCredits = null;
            bool observedCaptureBeforePurchase = false;
            bool observedEarlyAlienDefeatBeforePurchase = false;
            long observedNavigationDamage = 0;
            int observedNavigationCollisions = 0;
            long BattlePoints(JsonElement evaluation)
            {
                int id = evaluation.GetProperty("activeShipId").GetInt32();
                var ship = evaluation.GetProperty("ownedShips").EnumerateArray().Single(s => s.GetProperty("id").GetInt32() == id);
                return evaluation.GetProperty("fightersRemaining").GetInt64() + ship.GetProperty("shields").GetInt64();
            }
            long fighterPurchaseSpent = 0;
            int fighterPurchaseCount = 0;
            long initialTerra = result.GetProperty("evaluation").GetProperty("terraColonists").GetInt64();
            using var listener = new TcpListener(IPAddress.Loopback, 0);
            listener.Start();
            var buffer = new TerminalBuffer();
            using var telnet = new TelnetClient(buffer, new AnsiParser(buffer));
            Task connect = telnet.ConnectAsync("127.0.0.1", ((IPEndPoint)listener.LocalEndpoint).Port);
            using TcpClient peer = await listener.AcceptTcpClientAsync();
            peer.NoDelay = true;
            await connect;
            object sync = new();
            const string game = "isolated-continuous-player";
            var state = new GameState { GameName = game, Connected = true };
            var parser = new ShipInfoParser();
            var recorder = new AutoRecorder();
            using var observer = new GameAgentRuntime();
            observer.Activate(game);
            parser.Updated += s =>
            {
                state.Sector = s.CurrentSector; state.Credits = s.Credits; state.Turns = s.Turns;
                state.HoldsTotal = s.TotalHolds; state.HoldsEmpty = s.HoldsEmpty;
                state.FuelOre = s.FuelOre; state.Organics = s.Organics; state.Equipment = s.Equipment;
                state.Colonists = s.Colonists; state.Fighters = s.Fighters; state.Shields = s.Shields;
            };
            var ready = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
            var bridge = new MtcRpcBridge
            {
                GetContextAsync = count => { lock (sync) { ready.TrySetResult(); return Task.FromResult(observer.BuildContextSnapshot(state, database, recentEventCount: count)); } },
                GetRecentEventsAsync = (count, _) => Task.FromResult(observer.GetRecentEvents(count)),
                QuerySectorAsync = sector => Task.FromResult(GameAgentRuntime.BuildSectorSnapshot(database, sector)),
                ListScriptsAsync = () => Task.FromResult<IReadOnlyList<GameAgentRunningScriptSnapshot>>([]),
                GetDebugSettingsAsync = _ => throw new Exception("Unexpected debug request"),
                SetDebugSettingsAsync = (_, _) => throw new Exception("Unexpected mutation"),
                SendCommandAsync = (_, _) => throw new Exception("Unguarded command"),
                SendPromptCommandAsync = request =>
                {
                    lock (sync)
                    {
                        MtcRpcPromptGuard.Validate(request, game, telnet.IsConnected, observer.IsActive, observer.GetRecentEvents(700));
                        string payload = request.Command + (request.AppendEnter ? "\r" : "");
                        observer.Record(new GameAgentEvent { GameName = game, Kind = GameAgentEventKind.ClientInput,
                            PlainText = payload.Replace("\r", "") is { Length: > 0 } value ? value : "<ENTER>",
                            CurrentSector = state.Sector, Metadata = new() { ["bytes"] = payload.Length.ToString() } });
                        telnet.SendRaw(Encoding.Latin1.GetBytes(payload));
                    }
                    return Task.FromResult(MtcRpcActionResult.Ok("Sent"));
                },
                RunMombotCommandAsync = _ => throw new Exception("Unexpected bot"),
                RunScriptAsync = _ => throw new Exception("Unexpected script"),
                StopScriptAsync = (_, _) => throw new Exception("Unexpected stop"),
                ApproveActionAsync = (_, _) => Task.FromResult(false),
            };
            using var portProbe = new TcpListener(IPAddress.Loopback, 0);
            portProbe.Start(); int port = ((IPEndPoint)portProbe.LocalEndpoint).Port; portProbe.Stop();
            using var server = new MtcJsonRpcServer(bridge);
            server.ApplyOptions(new() { Enabled = true, BindAddress = "127.0.0.1", Port = port, AuthToken = "continuous-test", ApprovalLevel = MtcRpcApprovalLevel.FullAutomation });
            observer.EventRecorded += server.PublishGameAgentEvent;
            telnet.TextLineAnsiReceived += (ansi, plain) =>
            {
                lock (sync)
                {
                    ScriptRef.SetActiveDatabase(database);
                    parser.FeedLine(plain);
                    recorder.RecordLine(plain, ansi);
                    recorder.ProcessPrompt(plain, ansi);
                    if (recorder.CurrentSector > 0) state.Sector = recorder.CurrentSector;
                    observer.Record(new GameAgentEvent { GameName = game, CurrentSector = state.Sector,
                        PlainText = plain, AnsiText = ansi,
                        Kind = GameAgentPromptClassifier.IsEconomicPrompt(plain) || GameAgentPromptClassifier.IsMissionPrompt(plain) || plain.TrimStart().StartsWith("Computer command", StringComparison.OrdinalIgnoreCase) || plain.TrimStart().StartsWith("Planet command", StringComparison.OrdinalIgnoreCase) || plain.TrimStart().StartsWith("Command [TL=", StringComparison.OrdinalIgnoreCase)
                            ? GameAgentEventKind.ServerPrompt : GameAgentEventKind.ServerLine });
                }
            };
            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
            Encoding wireEncoding = Encoding.GetEncoding(437);
            byte[] Wire(string text)
            {
                var bytes = new List<byte>();
                foreach (char c in text)
                {
                    byte value = c < 256 ? (byte)c : wireEncoding.GetBytes(c.ToString())[0];
                    bytes.Add(value);
                    if (value == 255) bytes.Add(value);
                }
                return bytes.ToArray();
            }
            int actionLimit = replaceColony ? 3200 : zeroLoot ? 2200 : campaign || career ? 650 : 100;
            string outputPrefix = replaceColony ? $"mtc-replacement-{(zeroLoot ? "zero" : recoveryLoot != null ? "partial" : "rich")}-{seed}" : flexible ? $"mtc-flex-{seed}" : career ? $"mtc-career-{seed}" : campaign ? $"mtc-campaign-{seed}" : combat ? $"mtc-combat-{seed}" : mission ? $"mtc-mission-{seed}" : "mtc-continuous";
            if (selectShip) outputPrefix = $"mtc-selected-{(zeroLoot ? "zero" : recoveryLoot != null ? "partial" : "rich")}-{seed}";
            if (combatAfterSettlement) outputPrefix = $"mtc-selected-late-{(zeroLoot ? "zero" : recoveryLoot != null ? "partial" : "rich")}-{seed}";
            if (spareSale) outputPrefix += "-spare";
            if (planetCatalog) outputPrefix += "-catalog";
            if (colonyPreflight) outputPrefix += "-preflight";
            if (combatOutcome) outputPrefix += "-outcome";
            if (partialSaleFunding) outputPrefix += "-partial-funding";
            if (captureAlternatives) outputPrefix += "-alternatives";
            if (captureSchedule) outputPrefix += "-schedule";
            if (boundedNavigation) outputPrefix += "-navigation";
            if (combatCommitment) outputPrefix += "-commitment";
            if (recoveryProvision) outputPrefix += "-recovery-provision";
            if (tradeMemory) outputPrefix += "-trade-memory";
            if (captureContinuation) outputPrefix += "-continuation";
            if (captureDiscovery) outputPrefix += "-discovery";
            if (captureSearch) outputPrefix += "-search";
            if (marketClearance) outputPrefix += "-clearance";
            if (recoveryRanking) outputPrefix += "-ranking";
            if (supplySources) outputPrefix += "-sources";
            if (supplyReplan) outputPrefix += "-replan";
            if (escapeReserve) outputPrefix += "-escape-reserve";
            if (outputTag != null) outputPrefix += "-" + outputTag;
            string objectivePath = Path.Combine(temporary, "objective.json");
            File.WriteAllText(objectivePath, JsonSerializer.Serialize(new {
                kind = "establish_colony", name = $"New Home {seed}", ship_name = $"Builder {seed}",
                ship_type = seed % 2 == 0 ? "Merchant Freighter" : "Colonial Trader", colony_sector = 2,
                production_group = 1 + seed % 3, ownership = "personal", budget = 700000,
                quantity = "fill_empty_holds", on_capacity_failure = "jettison_colonists", trader_name = "Policy trainee",
            }));
            int fighterBudget = rounds ? new[] { 25, 50, 100, 250, 1000, 4000 }[(seed / 2) % 6] : new[] { 25, 50, 100, 150, 250 }[(seed / 2) % 5];
            bool alien = (seed / 5) % 2 == 0;
            if (combat) File.WriteAllText(objectivePath, JsonSerializer.Serialize(new {
                kind = alien ? "capture_alien" : "defeat_player_hull", target = alien ? "Zar Nox" : "Enemy Pilot",
                ownership = "personal", fighter_budget = fighterBudget,
            }));
            if (campaign)
            {
                using var priorGoal = JsonDocument.Parse(File.ReadAllText(objectivePath));
                var settlement = JsonSerializer.Deserialize<Dictionary<string, object>>(priorGoal.RootElement.GetRawText())!;
                settlement["budget"] = 80000;
                settlement["ship_type"] = "Merchant Freighter";
                File.WriteAllText(objectivePath, JsonSerializer.Serialize(new {
                    kind = "fund_and_settle", funds_target = 80000, dock_sector = 9, settlement,
                }));
            }
            if (career)
            {
                using var priorGoal = JsonDocument.Parse(File.ReadAllText(objectivePath));
                var settlement = JsonSerializer.Deserialize<Dictionary<string, object>>(priorGoal.RootElement.GetRawText())!;
                settlement["budget"] = 80000;
                settlement["ship_type"] = "Merchant Freighter";
                File.WriteAllText(objectivePath, JsonSerializer.Serialize(new {
                    kind = "fund_settle_and_fight", funds_target = 110000, dock_sector = 9,
                    trade_profit_before_combat = 5000, settlement,
                    provision = new { kind = "resupply_fighters", ownership = "personal", fighter_target = 100, budget = 30000 },
                    combat = new[] {
                        new { kind = "capture_alien", target = "Zar Nox", ownership = "player_or_corporation", fighter_budget = 50, sector = 11 },
                        new { kind = "defeat_player_hull", target = "Enemy Pilot", ownership = "player_or_corporation", fighter_budget = 75, sector = 6 },
                    },
                }));
            }
            if (flexible)
            {
                var goal = JsonSerializer.Deserialize<Dictionary<string, object>>(File.ReadAllText(objectivePath))!;
                if (career)
                {
                    var settlement = JsonSerializer.Deserialize<Dictionary<string, object>>(((JsonElement)goal["settlement"]).GetRawText())!;
                    settlement["allowed_production_groups"] = new[] { 1, 2, 3 };
                    goal["settlement"] = settlement;
                }
                else goal["allowed_production_groups"] = new[] { 1, 2, 3 };
                File.WriteAllText(objectivePath, JsonSerializer.Serialize(goal));
            }
            if (replaceColony)
            {
                var goal = JsonSerializer.Deserialize<Dictionary<string, object>>(File.ReadAllText(objectivePath))!;
                goal["recovery"] = new { budget = 70000, attempt_budget = 35000, max_attempts = 2, allow_replaced_ship_sale = spareSale || recoveryProvision && !tradeMemory };
                File.WriteAllText(objectivePath, JsonSerializer.Serialize(goal));
            }
            if (selectShip)
            {
                var goal = JsonSerializer.Deserialize<Dictionary<string, object>>(File.ReadAllText(objectivePath))!;
                var settlement = JsonSerializer.Deserialize<Dictionary<string, object>>(((JsonElement)goal["settlement"]).GetRawText())!;
                settlement.Remove("ship_type");
                goal["settlement"] = settlement;
                goal["ship_selection"] = new { task = "colonists", budget = 60000, cash_reserve = 50000,
                    min_holds = 30, min_fighters = 100, min_attack = 75, max_turns = 4, min_genesis = 1, min_atomics = 1 };
                if (combatAfterSettlement) goal.Remove("trade_profit_before_combat");
                File.WriteAllText(objectivePath, JsonSerializer.Serialize(goal));
            }
            if (captureAlternatives)
            {
                var goal = JsonSerializer.Deserialize<Dictionary<string, object>>(File.ReadAllText(objectivePath))!;
                var fights = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(((JsonElement)goal["combat"]).GetRawText())!;
                fights[0]["alternatives"] = reset["alternateCaptureTargets"];
                fights[0]["fighter_budget"] = 100;
                if (captureDiscovery)
                {
                    fights[0].Remove("target");
                    fights[0].Remove("alternatives");
                    fights[0]["target_selection"] = "current_sector_aliens";
                    fights[0]["max_targets"] = 4;
                    if (captureSearch)
                    {
                        fights[0].Remove("sector");
                        fights[0]["target_selection"] = "observed_sector_aliens";
                        fights[0]["max_search_moves"] = 12;
                    }
                }
                goal["combat"] = fights;
                goal["provision"] = new { kind = "resupply_fighters", ownership = "personal", fighter_target = 100, budget = 40000 };
                goal["funds_target"] = 120000;
                if (captureSchedule) goal["adaptive_capture_before_funding"] = true;
                if (boundedNavigation) goal["navigation_risk"] = new { scope = "economic_routes", max_navhaz_percent = 1,
                    damage_per_percent = 10, max_total_damage = 30, reserve_battle_points = 20 };
                File.WriteAllText(objectivePath, JsonSerializer.Serialize(goal));
            }
            var policyStart = new ProcessStartInfo(pythonExecutable ?? Path.Combine(player, ".venv/bin/python"))
                { WorkingDirectory = pythonExecutable == null ? player : temporary, RedirectStandardOutput = true, RedirectStandardError = true };
            foreach (string arg in new[] { "-m", "tw_player.cli", mission ? "run-mission" : "run", "--model", model, mission ? "--objective" : "--goal", mission ? objectivePath : "trade", "--game", game,
                         "--url", $"ws://127.0.0.1:{port}/", "--execute", "--max-actions", actionLimit.ToString(), "--idle-timeout", "5", "--output", Path.Combine(player, $"outputs/{outputPrefix}-decisions.jsonl") }) policyStart.ArgumentList.Add(arg);
            policyStart.Environment["MTC_RPC_TOKEN"] = "continuous-test";
            policy = Process.Start(policyStart) ?? throw new Exception("Cannot start model");
            Task<string> stdout = policy.StandardOutput.ReadToEndAsync();
            Task<string> stderr = policy.StandardError.ReadToEndAsync();
            diagnosticError = stderr;
            await ready.Task.WaitAsync(TimeSpan.FromSeconds(10));
            await peer.GetStream().WriteAsync(Wire(result.GetProperty("text").GetString()!));
            int steps = 0;
            bool hadColonistRefusal = false;
            long pvpFightersCommitted = 0;
            long replacementSupplySpent = 0;
            long recoveryTradingGain = 0;
            int replacementDestructions = 0;
            bool createdColony = false;
            int? destructionsBeforeFirstLoad = null;
            var commands = new List<string>();
            Task exited = policy.WaitForExitAsync();
            var input = new StringBuilder();
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(campaign || career ? 60 : 20));
            while (steps < actionLimit)
            {
                byte[] one = new byte[1];
                Task<int> received = peer.GetStream().ReadAsync(one, timeout.Token).AsTask();
                if (mission && await Task.WhenAny(received, exited) == exited)
                {
                    timeout.Cancel();
                    try { await received; } catch (OperationCanceledException) { }
                    break;
                }
                int count = await received;
                if (count == 0) throw new Exception("Client disconnected before completing gameplay");
                char ch = (char)one[0];
                string mode = result.GetProperty("evaluation").GetProperty("promptMode").GetString()!;
                if ((mode is "ShipyardBuyName" or "GenesisPlanetName") && ch != '\r' ||
                    char.IsAsciiDigit(ch) && mode != "PlanetColonistSelection") { input.Append(ch); continue; }
                if (ch != '\r') input.Append(ch);
                string command = input.ToString(); input.Clear();
                long beforeCredits = result.GetProperty("context").GetProperty("credits").GetInt64();
                long beforeCreditDelta = result.GetProperty("evaluation").GetProperty("creditsDelta").GetInt64();
                bool recoveryActive = hadColonistRefusal || colonyPreflight && createdColony;
                bool replacementPurchase = replaceColony && recoveryActive && mode == "HardwareQuantity" &&
                    (result.GetProperty("text").GetString()!.Contains("How many Atomic Detonators") ||
                     result.GetProperty("text").GetString()!.Contains("How many Genesis Torpedoes"));
                int[] beforeShips = result.GetProperty("evaluation").GetProperty("ownedShips").EnumerateArray().Select(s => s.GetProperty("id").GetInt32()).ToArray();
                long battlePointsBefore = boundedNavigation ? BattlePoints(result.GetProperty("evaluation")) : 0;
                if ((supplyReplan || escapeReserve) && result.GetProperty("context").GetProperty("currentSector").GetInt32() == 6 &&
                    result.GetProperty("text").GetString()!.Contains("How many fighters do you wish to use") &&
                    int.TryParse(command, out int committedWave) && committedWave > 0)
                    pvpFightersCommitted += committedWave;
                result = await Request(new { method = "step", command });
                if (boundedNavigation && result.GetProperty("text").GetString()!.Contains("Collision Damage! Asteroids/Debris!", StringComparison.Ordinal))
                {
                    observedNavigationDamage += battlePointsBefore - BattlePoints(result.GetProperty("evaluation"));
                    observedNavigationCollisions++;
                }
                if (boundedNavigation && firstShipPurchaseCredits == null &&
                    result.GetProperty("evaluation").GetProperty("activeShipId").GetInt32() == originalShipId &&
                    !result.GetProperty("evaluation").GetProperty("classicAliens").EnumerateArray().Any(a => a.GetProperty("name").GetString() == "Mira Fen"))
                    observedEarlyAlienDefeatBeforePurchase = true;
                if ((captureSchedule || captureSearch) && firstShipPurchaseCredits == null &&
                    result.GetProperty("evaluation").GetProperty("activeShipId").GetInt32() == originalShipId &&
                    result.GetProperty("evaluation").GetProperty("ownedShips").EnumerateArray().Any(s => s.GetProperty("name").GetString() == (captureSearch ? "Prize of Ilex Nine" : "Prize of Mira Fen")))
                    observedCaptureBeforePurchase = true;
                if (mode == "GenesisPlanetName") createdColony = true;
                if (destructionsBeforeFirstLoad == null && result.GetProperty("evaluation").GetProperty("shipColonists").GetInt32() > 0)
                    destructionsBeforeFirstLoad = replacementDestructions;
                if (mode == "ShipyardSellConfirmation" && command.Equals("y", StringComparison.OrdinalIgnoreCase))
                {
                    int[] afterShips = result.GetProperty("evaluation").GetProperty("ownedShips").EnumerateArray().Select(s => s.GetProperty("id").GetInt32()).ToArray();
                    int[] removed = beforeShips.Except(afterShips).ToArray();
                    if (!(spareSale || recoveryProvision && !tradeMemory) || removed.Length != 1 || removed[0] != originalShipId || afterShips.Except(beforeShips).Any())
                        throw new Exception("Spare-sale operation removed an unapproved ship");
                    spareSaleCount++;
                    spareSaleGain += result.GetProperty("evaluation").GetProperty("creditsDelta").GetInt64() - beforeCreditDelta;
                }
                if (replacementPurchase)
                    replacementSupplySpent += beforeCreditDelta - result.GetProperty("evaluation").GetProperty("creditsDelta").GetInt64();
                if (replaceColony && recoveryActive && replacementDestructions == 0 && mode.StartsWith("Port", StringComparison.Ordinal))
                    recoveryTradingGain += result.GetProperty("evaluation").GetProperty("creditsDelta").GetInt64() - beforeCreditDelta;
                if (result.GetProperty("text").GetString()!.Contains("For blowing up this planet you receive")) replacementDestructions++;
                if (mode == "ShipyardFighters")
                {
                    long purchaseCost = beforeCredits - result.GetProperty("context").GetProperty("credits").GetInt64();
                    if (purchaseCost < 0) throw new Exception("Fighter purchase increased credits");
                    fighterPurchaseSpent += purchaseCost;
                    if (purchaseCost > 0) fighterPurchaseCount++;
                }
                if (firstShipPurchaseCredits == null && result.GetProperty("evaluation").GetProperty("promptMode").GetString() == "ShipyardBuySelection")
                    firstShipPurchaseCredits = result.GetProperty("context").GetProperty("credits").GetInt64();
                hadColonistRefusal |= result.GetProperty("text").GetString()!.Contains("There isn't room on the planet");
                steps++;
                if ((campaign || career) && firstDockCredits == null && result.GetProperty("context").GetProperty("currentSector").GetInt32() == 9)
                    firstDockCredits = result.GetProperty("context").GetProperty("credits").GetInt64();
                commands.Add(command);
                if (steps < actionLimit) await peer.GetStream().WriteAsync(Wire(command + "\r\n" + result.GetProperty("text").GetString()));
            }
            await policy.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(5));
            if (policy.ExitCode != 0) throw new Exception(await stderr);
            string decisions = await stdout;
            File.WriteAllText(Path.Combine(player, $"outputs/{outputPrefix}-policy-result.jsonl"), decisions);
            JsonElement outcome = result.GetProperty("evaluation");
            if (career)
            {
                var ships = outcome.GetProperty("ownedShips").EnumerateArray().ToArray();
                var builders = ships.Where(s => s.GetProperty("name").GetString() == $"Builder {seed}").ToArray();
                var planets = outcome.GetProperty("colonySitePlanets").EnumerateArray().Where(p => p.GetProperty("name").GetString() == $"(M) New Home {seed}").ToArray();
                string population = new[] { "fuelOreColonists", "organicsColonists", "equipmentColonists" }[seed % 3];
                if (builders.Length != 1 || planets.Length != 1 ||
                    planets[0].GetProperty("ownerName").GetString() != (seed % 2 == 0 ? "Policy trainee [7]" : "Policy trainee") ||
                    (flexible ? new[] { "fuelOreColonists", "organicsColonists", "equipmentColonists" }.Sum(k => planets[0].GetProperty(k).GetInt32())
                        : planets[0].GetProperty(population).GetInt32()) != builders[0].GetProperty("holds").GetInt32() ||
                    outcome.GetProperty("activeShipId").GetInt32() != builders[0].GetProperty("id").GetInt32() ||
                    !ships.Any(s => s.GetProperty("name").GetString() == (captureSearch ? "Prize of Ilex Nine" : captureDiscovery ? "Prize of Vela Moss" : captureContinuation ? "Prize of Mira Fen" : (combatCommitment || escapeReserve) ? "Prize of Krel Voss" : boundedNavigation ? "Alien Prize" : captureSchedule ? "Prize of Mira Fen" : captureAlternatives ? "Prize of Krel Voss" : "Alien Prize")) ||
                    (!combatOutcome && !captureAlternatives && !ships.Any(s => s.GetProperty("name").GetString() == "Enemy Hull")) ||
                    outcome.GetProperty("opponent").GetProperty("totalDestructionCount").GetInt32() != 1 ||
                    (captureSearch ? outcome.GetProperty("classicAliens").GetArrayLength() != (marketClearance ? 1 : 2) || outcome.GetProperty("classicAliens").EnumerateArray().Any(a => a.GetProperty("name").GetString() == "Ilex Nine") : combatCommitment || captureContinuation || captureDiscovery || escapeReserve ? outcome.GetProperty("classicAliens").GetArrayLength() != 0 : boundedNavigation ? outcome.GetProperty("classicAliens").GetArrayLength() != 1 || outcome.GetProperty("classicAliens").EnumerateArray().Any(a => a.GetProperty("name").GetString() != "Krel Voss") : captureSchedule ? outcome.GetProperty("classicAliens").GetArrayLength() != 2 || outcome.GetProperty("classicAliens").EnumerateArray().Any(a => a.GetProperty("name").GetString() == "Mira Fen") : captureAlternatives ? outcome.GetProperty("classicAliens").EnumerateArray().Any(a => a.GetProperty("name").GetString() != "Mira Fen") : outcome.GetProperty("classicAliens").GetArrayLength() != 0) ||
                    outcome.GetProperty("fightersRemaining").GetInt32() != (escapeReserve ? 106 : 100) ||
                    outcome.GetProperty("shipColonists").GetInt32() != 0 ||
                    outcome.GetProperty("totalDestructionCount").GetInt32() != 0 ||
                    outcome.GetProperty("eliminated").GetBoolean() || outcome.GetProperty("promptMode").GetString() != "Command" ||
                    // Early fighter replacement may visit Dock before funding
                    // the colony. The ship purchase itself must remain funded.
                    startingCredits >= (captureAlternatives ? 120000 : 110000) || firstShipPurchaseCredits == null || firstShipPurchaseCredits < (captureAlternatives ? 120000 : 110000) ||
                    fighterPurchaseSpent > (captureAlternatives ? 40000 : 30000) || fighterPurchaseCount < 2 || !decisions.Contains("verified_campaign"))
                    throw new Exception("MTC continuous career did not complete all objectives: " + outcome);
                if (flexible && (!hadColonistRefusal || commands.Contains("j") || planets[0].GetProperty(population).GetInt32()!=0))
                    throw new Exception("Flexible career did not redirect the refused colonists");
                if (replaceColony && (!selectShip || hadColonistRefusal) && (!hadColonistRefusal || replacementDestructions < 1 || replacementDestructions > 2 ||
                    replacementSupplySpent < 35000 || replacementSupplySpent > 70000 || !commands.Contains("z")))
                    throw new Exception("Replacement career did not verify bounded disposal, restocking and strict-group recovery");
                if (recoveryLoot != null && !selectShip && recoveryTradingGain <= 0)
                    throw new Exception("Recovery fixture did not earn replacement funding through trade");
                if (spareSale && (spareSaleCount != 1 || spareSaleGain <= 0 || replacementDestructions != 2 ||
                    !decisions.Contains("spare_sale_verified") && !decisions.Contains("\"spare_sales\"")))
                    throw new Exception("Spare-sale fixture did not complete a sale-funded second replacement");
                if (partialSaleFunding)
                {
                    int start = decisions.LastIndexOf("\n{", StringComparison.Ordinal);
                    if (start < 0) throw new Exception("Missing partial-funding result");
                    using var summary = JsonDocument.Parse(decisions[(start + 1)..]);
                    var details = summary.RootElement.GetProperty("details");
                    var sale = details.GetProperty("spare_sales")[0];
                    long proceeds = sale.GetProperty("receipt").GetProperty("credits").GetInt64();
                    long afterSale = sale.GetProperty("current").GetProperty("credits").GetInt64();
                    long target = details.GetProperty("recovery_funding_target").GetInt64();
                    var restart = details.GetProperty("transitions").EnumerateArray()
                        .Last(t => t.GetProperty("to_phase").GetString() == "replace_start");
                    if (proceeds != spareSaleGain || afterSale >= target ||
                        restart.GetProperty("credits").GetInt64() < target ||
                        restart.GetProperty("credits").GetInt64() <= afterSale ||
                        replacementSupplySpent != 70000 || !sale.GetProperty("verified").GetBoolean())
                        throw new Exception("Partial sale did not contribute before trading funded the whole reserve");
                }
                if (selectShip)
                {
                    if (planetCatalog)
                    {
                        int start = decisions.LastIndexOf("\n{", StringComparison.Ordinal);
                        if (start < 0) throw new Exception("Missing final planet survey result");
                        using var summary = JsonDocument.Parse(decisions[(start + 1)..]);
                        var details = summary.RootElement.GetProperty("details");
                        surveyedPlanetSpecs = details.GetProperty("surveyed_planet_specs").Clone();
                        if (!details.GetProperty("planet_survey_complete").GetBoolean() ||
                            surveyedPlanetSpecs.Value.EnumerateObject().Count() != 7 ||
                            surveyedPlanetSpecs.Value.EnumerateObject().Any(p => p.Value.GetProperty("colonist_limits").EnumerateArray().Any(n => n.ValueKind != (colonyPreflight ? JsonValueKind.Number : JsonValueKind.Null))))
                            throw new Exception("Observed catalog limits do not match the configured fixture");
                        if (colonyPreflight)
                        {
                            var inspections = details.GetProperty("colony_inspections").EnumerateArray().ToArray();
                            if (inspections.Count(p => p.GetProperty("rejected").GetBoolean()) < 1 ||
                                replacementDestructions < 1 || replacementDestructions > 2 || hadColonistRefusal ||
                                destructionsBeforeFirstLoad != replacementDestructions ||
                                replacementSupplySpent != details.GetProperty("recovery_spent").GetInt64() ||
                                replacementSupplySpent < 35000 || replacementSupplySpent > 70000 ||
                                inspections.Last().GetProperty("rejected").GetBoolean())
                                throw new Exception("Preflight did not replace an insufficient planet before transfer");
                        }
                    }
                    string last = File.ReadLines(Path.Combine(player, $"outputs/{outputPrefix}-decisions.jsonl")).Last(line => !string.IsNullOrWhiteSpace(line));
                    using var finalDecision = JsonDocument.Parse(last);
                    var selection = finalDecision.RootElement.GetProperty("state").GetProperty("ship_selection");
                    var selected = selection.GetProperty("ship");
                    if (finalDecision.RootElement.GetProperty("action").GetString() != "STOP" ||
                        selected.GetProperty("name").GetString() != builders[0].GetProperty("type").GetString() ||
                        selected.GetProperty("holds").GetInt32() != builders[0].GetProperty("holds").GetInt32() ||
                        selection.GetProperty("eligible_hulls").GetArrayLength() < 2 ||
                        selected.GetProperty("price").GetInt64() > 60000 || !selected.GetProperty("land").GetBoolean() ||
                        selected.GetProperty("genesis").GetInt32() < 1 || selected.GetProperty("atomics").GetInt32() < 1)
                        throw new Exception("MTC selected hull did not match surveyed capabilities and acquired ship");
                    if (combatAfterSettlement)
                    {
                        int summaryStart = decisions.LastIndexOf("\n{", StringComparison.Ordinal);
                        if (summaryStart < 0) throw new Exception("Missing final career result");
                        using var summary = JsonDocument.Parse(decisions[(summaryStart + 1)..]);
                        verifiedCareerDetails = summary.RootElement.GetProperty("details").Clone();
                        var fights = summary.RootElement.GetProperty("details").GetProperty("combat").EnumerateArray().ToArray();
                        if (fights.Length != 2 || !captureSchedule && !captureSearch && fights.Any(f =>
                            f.GetProperty("initial").GetProperty("ship").GetInt32() != builders[0].GetProperty("id").GetInt32() ||
                            f.GetProperty("current").GetProperty("ship").GetInt32() != builders[0].GetProperty("id").GetInt32()))
                            throw new Exception("Combat was not completed in the purchased hull");
                        if (captureSchedule && !boundedNavigation)
                        {
                            var schedules = summary.RootElement.GetProperty("details").GetProperty("capture_schedule").EnumerateArray().ToArray();
                            if (!observedCaptureBeforePurchase || schedules.Length != 1 ||
                                schedules[0].GetProperty("target").GetProperty("sector").GetInt32() != 12 ||
                                fights[0].GetProperty("initial").GetProperty("ship").GetInt32() != originalShipId ||
                                fights[1].GetProperty("initial").GetProperty("ship").GetInt32() != builders[0].GetProperty("id").GetInt32() ||
                                fights.Any(f => !f.GetProperty("satisfied").GetBoolean()) ||
                                fights[0].GetProperty("total_committed_fighters").GetInt32() > 100 ||
                                !fights[0].GetProperty("prize").GetProperty("corporate").GetBoolean())
                                throw new Exception("Scheduled capture did not clear the corporate port before the ship purchase and later combat");
                        }
                        if (boundedNavigation && !combatCommitment && !recoveryProvision && !supplyReplan && !escapeReserve)
                        {
                            var details = summary.RootElement.GetProperty("details");
                            var navigation = details.GetProperty("navigation");
                            var receipts = navigation.GetProperty("receipts").EnumerateArray().ToArray();
                            var attempts = fights[0].GetProperty("attempts").EnumerateArray().ToArray();
                            if (!observedEarlyAlienDefeatBeforePurchase || observedCaptureBeforePurchase ||
                                observedNavigationCollisions != 1 || observedNavigationDamage != 10 ||
                                navigation.GetProperty("spent").GetInt64() != observedNavigationDamage ||
                                navigation.GetProperty("error").ValueKind != JsonValueKind.Null ||
                                navigation.GetProperty("pending").ValueKind != JsonValueKind.Null ||
                                receipts.Sum(r => r.GetProperty("damage").GetInt64()) != observedNavigationDamage ||
                                receipts.Any(r => r.GetProperty("after").GetProperty("fighters").GetInt64() + r.GetProperty("after").GetProperty("shields").GetInt64() < 20) ||
                                attempts.Length != 2 || attempts[0].GetProperty("satisfied").GetBoolean() ||
                                attempts[0].GetProperty("objective").GetProperty("target").GetString() != "Mira Fen" ||
                                attempts[0].GetProperty("initial").GetProperty("ship").GetInt32() != originalShipId ||
                                attempts[1].GetProperty("initial").GetProperty("ship").GetInt32() != builders[0].GetProperty("id").GetInt32() ||
                                attempts.Sum(a => Math.Max(a.GetProperty("committed_fighters").GetInt32(), a.GetProperty("fighter_loss").GetInt32())) > 100 ||
                                fights.Any(f => !f.GetProperty("satisfied").GetBoolean()))
                                throw new Exception("Bounded navigation did not verify the collision, survival reserve, later capture and shared task budgets");
                        }
                        if (escapeReserve)
                        {
                            var details = summary.RootElement.GetProperty("details");
                            var escape = details.GetProperty("escape_reserve");
                            var receipts = escape.GetProperty("receipts").EnumerateArray().ToArray();
                            var attempts = fights[0].GetProperty("attempts").EnumerateArray().ToArray();
                            if (escape.GetProperty("active").ValueKind != JsonValueKind.Null || receipts.Length != 1 ||
                                attempts.Length != 3 || attempts[0].GetProperty("satisfied").GetBoolean() ||
                                attempts[1].GetProperty("satisfied").GetBoolean() || !attempts[2].GetProperty("satisfied").GetBoolean() ||
                                attempts.Sum(a => Math.Max(a.GetProperty("committed_fighters").GetInt32(), a.GetProperty("fighter_loss").GetInt32())) > 100 ||
                                !fights[1].GetProperty("satisfied").GetBoolean() || pvpFightersCommitted != 30 ||
                                fights[1].GetProperty("fighter_loss").GetInt32() != 32 || fighterPurchaseSpent != 35811)
                                throw new Exception("Escape reserve did not preserve the original combat and supply budgets");
                            var receipt = receipts[0];
                            var before = receipt.GetProperty("before");
                            var arrival = receipt.GetProperty("arrival");
                            if (!receipt.GetProperty("chosen").GetBoolean() ||
                                receipt.GetProperty("preview").GetProperty("expected_wave").GetInt32() != 29 ||
                                before.GetProperty("fighters").GetInt32() != 58 || arrival.GetProperty("sector").GetInt32() != 6 ||
                                receipt.GetProperty("final_target").GetInt32() != 100 ||
                                receipt.GetProperty("stocking_target").GetInt32() != 133 ||
                                receipt.GetProperty("stock_receipt").GetProperty("current").GetProperty("fighters").GetInt32() != 133 ||
                                receipt.GetProperty("capture_receipt").GetProperty("fighter_loss").GetInt32() != 27 ||
                                receipt.GetProperty("capture").GetProperty("fighter_budget").GetInt32() != 33 ||
                                receipt.GetProperty("completed_after_actions").GetInt32() <= receipt.GetProperty("verified_after_actions").GetInt32())
                                throw new Exception("Escape reserve did not verify detour, stocking and suspended capture");
                            foreach (var field in new[] { "ship", "fighters", "shields", "credits", "photons", "colonists", "corporation" })
                                if (before.GetProperty(field).GetInt64() != arrival.GetProperty(field).GetInt64())
                                    throw new Exception("Escape detour changed travel resources");
                            var navigation = details.GetProperty("navigation");
                            var entries = navigation.GetProperty("receipts").EnumerateArray().ToArray();
                            if (navigation.GetProperty("pending").ValueKind != JsonValueKind.Null ||
                                navigation.GetProperty("error").ValueKind != JsonValueKind.Null ||
                                navigation.GetProperty("spent").GetInt64() != observedNavigationDamage || observedNavigationDamage > 30 ||
                                entries.Sum(r => r.GetProperty("damage").GetInt64()) != observedNavigationDamage ||
                                entries.Count(r => r.GetProperty("collision").GetBoolean()) != observedNavigationCollisions)
                                throw new Exception("Escape reserve changed the economic navigation allowance");
                        }
                        if (supplyReplan)
                        {
                            var details = summary.RootElement.GetProperty("details");
                            var replans = details.GetProperty("supply_replan");
                            var receipts = replans.GetProperty("receipts").EnumerateArray().ToArray();
                            var navigation = details.GetProperty("navigation");
                            var navigationReceipts = navigation.GetProperty("receipts").EnumerateArray().ToArray();
                            var attempts = fights[0].GetProperty("attempts").EnumerateArray().ToArray();
                            if (replans.GetProperty("pending").ValueKind != JsonValueKind.Null || receipts.Length != 1 ||
                                !observedEarlyAlienDefeatBeforePurchase || observedCaptureBeforePurchase ||
                                attempts.Length != 2 || attempts[0].GetProperty("satisfied").GetBoolean() ||
                                !attempts[1].GetProperty("satisfied").GetBoolean() ||
                                attempts[0].GetProperty("objective").GetProperty("target").GetString() != "Mira Fen" ||
                                attempts[1].GetProperty("objective").GetProperty("target").GetString() != "Zar Nox" ||
                                attempts.Sum(a => Math.Max(a.GetProperty("committed_fighters").GetInt32(), a.GetProperty("fighter_loss").GetInt32())) > 100 ||
                                navigation.GetProperty("pending").ValueKind != JsonValueKind.Null ||
                                navigation.GetProperty("error").ValueKind != JsonValueKind.Null ||
                                navigation.GetProperty("spent").GetInt64() != observedNavigationDamage || observedNavigationDamage > 30 ||
                                navigationReceipts.Sum(r => r.GetProperty("damage").GetInt64()) != observedNavigationDamage ||
                                navigationReceipts.Count(r => r.GetProperty("collision").GetBoolean()) != observedNavigationCollisions ||
                                navigationReceipts.Any(r => r.GetProperty("after").GetProperty("fighters").GetInt64() + r.GetProperty("after").GetProperty("shields").GetInt64() < 20))
                                throw new Exception("Supply replan did not preserve capture and navigation budgets");
                            var replan = receipts[0];
                            var before = replan.GetProperty("before");
                            var after = replan.GetProperty("after");
                            if (!replan.GetProperty("chosen").GetBoolean() || replan.GetProperty("index").GetInt32() != 1 ||
                                replan.GetProperty("target").GetInt32() != fights[1].GetProperty("objective").GetProperty("sector").GetInt32() ||
                                replan.GetProperty("task").GetProperty("target").GetString() != "Enemy Pilot" ||
                                replan.GetProperty("preview").GetProperty("expected_wave").GetInt32() <= 0 ||
                                replan.GetProperty("verified_after_actions").GetInt32() <= replan.GetProperty("after_actions").GetInt32() ||
                                before.GetProperty("fighters").GetInt32() != 58 ||
                                after.GetProperty("sector").GetInt32() != replan.GetProperty("target").GetInt32() ||
                                before.GetProperty("ship").GetInt32() != builders[0].GetProperty("id").GetInt32() ||
                                fights[1].GetProperty("initial").GetProperty("fighters").GetInt32() != 58 ||
                                !fights[1].GetProperty("satisfied").GetBoolean() ||
                                Math.Max(fights[1].GetProperty("fighter_loss").GetInt32(), pvpFightersCommitted) > 75 ||
                                pvpFightersCommitted <= 0)
                                throw new Exception("Supply replan did not verify the learned low-fighter task transition");
                            foreach (var field in new[] { "ship", "fighters", "shields", "credits", "photons", "colonists", "corporation" })
                                if (before.GetProperty(field).GetInt64() != after.GetProperty(field).GetInt64())
                                    throw new Exception("Supply replan travel changed combat resources");
                        }
                        if (recoveryProvision)
                        {
                            var details = summary.RootElement.GetProperty("details");
                            var early = details.GetProperty("recovery_provisions").EnumerateArray().ToArray();
                            var navigation = details.GetProperty("navigation");
                            var attempts = fights[0].GetProperty("attempts").EnumerateArray().ToArray();
                            if (early.Length != 1 || early[0].GetProperty("initial").GetProperty("fighters").GetInt64() != 0 ||
                                early[0].GetProperty("current").GetProperty("fighters").GetInt64() != 100 ||
                                early[0].GetProperty("spent").GetInt64() != 17300 ||
                                early[0].GetProperty("reserve").GetInt64() != 35000 ||
                                early[0].GetProperty("current").GetProperty("credits").GetInt64() < 35000 ||
                                details.GetProperty("provision_spent").GetInt64() != fighterPurchaseSpent ||
                                fighterPurchaseSpent != 30967 || replacementDestructions != 1 || replacementSupplySpent != 35000 ||
                                (tradeMemory ? spareSaleCount != 0 || recoveryTradingGain <= 0 : spareSaleCount != 1 || spareSaleGain != 35111) || !hadColonistRefusal || !observedEarlyAlienDefeatBeforePurchase ||
                                navigation.GetProperty("error").ValueKind != JsonValueKind.Null ||
                                navigation.GetProperty("pending").ValueKind != JsonValueKind.Null ||
                                navigation.GetProperty("spent").GetInt64() != observedNavigationDamage ||
                                attempts.Length != 2 || attempts[0].GetProperty("satisfied").GetBoolean() ||
                                !attempts[1].GetProperty("satisfied").GetBoolean() ||
                                attempts.Sum(a => Math.Max(a.GetProperty("committed_fighters").GetInt32(), a.GetProperty("fighter_loss").GetInt32())) > 100 ||
                                fights.Any(f => !f.GetProperty("satisfied").GetBoolean()))
                                throw new Exception("Early resupply did not preserve cash and spending limits through colony recovery and combat");
                        }
                        if (combatCommitment)
                        {
                            var navigation = summary.RootElement.GetProperty("details").GetProperty("navigation");
                            var attempts = fights[0].GetProperty("attempts").EnumerateArray().ToArray();
                            if (!observedEarlyAlienDefeatBeforePurchase || observedCaptureBeforePurchase ||
                                observedNavigationCollisions != 1 || observedNavigationDamage != 10 ||
                                navigation.GetProperty("spent").GetInt64() != observedNavigationDamage ||
                                navigation.GetProperty("error").ValueKind != JsonValueKind.Null ||
                                navigation.GetProperty("pending").ValueKind != JsonValueKind.Null ||
                                attempts.Length != 3 || attempts[0].GetProperty("satisfied").GetBoolean() ||
                                attempts[1].GetProperty("satisfied").GetBoolean() || !attempts[2].GetProperty("satisfied").GetBoolean() ||
                                attempts[2].GetProperty("objective").GetProperty("target").GetString() != "Krel Voss" ||
                                attempts[0].GetProperty("initial").GetProperty("ship").GetInt32() != originalShipId ||
                                attempts.Skip(1).Any(a => a.GetProperty("initial").GetProperty("ship").GetInt32() != builders[0].GetProperty("id").GetInt32()) ||
                                attempts.Sum(a => Math.Max(a.GetProperty("committed_fighters").GetInt32(), a.GetProperty("fighter_loss").GetInt32())) != 92 ||
                                !fights[0].GetProperty("prize").GetProperty("corporate").GetBoolean() ||
                                fights.Any(f => !f.GetProperty("satisfied").GetBoolean()))
                                throw new Exception("Learned commitment did not preserve the third capture, collision receipt and full career budgets");
                        }
                        if (captureSearch)
                        {
                            var details = summary.RootElement.GetProperty("details");
                            var search = details.GetProperty("capture_search");
                            var receipts = search.GetProperty("receipts").EnumerateArray().ToArray();
                            var goal = finalDecision.RootElement.GetProperty("state").GetProperty("objective").GetProperty("combat")[0];
                            if (goal.TryGetProperty("target", out _) || goal.TryGetProperty("sector", out _) || goal.TryGetProperty("alternatives", out _) ||
                                goal.GetProperty("target_selection").GetString() != "observed_sector_aliens" ||
                                search.GetProperty("moves").GetProperty("0").GetInt32() != (marketClearance ? 2 : 1) || receipts.Length != (marketClearance ? 2 : 1) ||
                                receipts[0].GetProperty("origin").GetInt32() != 10 || receipts[0].GetProperty("hop").GetInt32() != 12 ||
                                receipts[0].GetProperty("before").GetProperty("ship").GetInt32() != originalShipId ||
                                receipts[0].GetProperty("after").GetProperty("ship").GetInt32() != originalShipId ||
                                receipts[0].GetProperty("before").GetProperty("fighters").GetInt32() != 100 ||
                                receipts[0].GetProperty("after").GetProperty("fighters").GetInt32() != 100 ||
                                search.GetProperty("pending").ValueKind != JsonValueKind.Null || search.GetProperty("schedule").GetArrayLength() != 1 ||
                                search.GetProperty("sector_goals").GetProperty("0").GetProperty("sector").GetInt32() != 12 ||
                                details.GetProperty("capture_discoveries").GetProperty("0").GetProperty("seen").GetArrayLength() != 1 ||
                                fights[0].GetProperty("objective").GetProperty("target").GetString() != "Ilex Nine" ||
                                fights[0].GetProperty("initial").GetProperty("ship").GetInt32() != originalShipId ||
                                fights[0].GetProperty("current").GetProperty("ship").GetInt32() != originalShipId ||
                                fights[1].GetProperty("initial").GetProperty("ship").GetInt32() != builders[0].GetProperty("id").GetInt32() ||
                                fights[1].GetProperty("current").GetProperty("ship").GetInt32() != builders[0].GetProperty("id").GetInt32() ||
                                fighterPurchaseSpent != 23701 || details.GetProperty("provision_spent").GetInt64() != fighterPurchaseSpent ||
                                !observedCaptureBeforePurchase || spareSaleCount != 0 || fights.Any(f => !f.GetProperty("satisfied").GetBoolean()))
                                throw new Exception("Observed sector search did not verify early capture and the later full career");
                            if (marketClearance)
                            {
                                var clearance = details.GetProperty("market_clearance");
                                var extra = clearance.GetProperty("receipts").EnumerateArray().ToArray();
                                var attempts = details.GetProperty("capture_attempts").GetProperty("0").EnumerateArray().ToArray();
                                if (clearance.GetProperty("active").ValueKind != JsonValueKind.Null || extra.Length != 1 ||
                                    extra[0].GetProperty("trigger").GetProperty("sector").GetInt32() != 4 ||
                                    !extra[0].GetProperty("result").GetProperty("satisfied").GetBoolean() ||
                                    extra[0].GetProperty("result").GetProperty("objective").GetProperty("target").GetString() != "Orin Slate" ||
                                    extra[0].GetProperty("result").GetProperty("initial").GetProperty("ship").GetInt32() != originalShipId ||
                                    extra[0].GetProperty("result").GetProperty("current").GetProperty("ship").GetInt32() != originalShipId ||
                                    receipts[1].GetProperty("origin").GetInt32() != 9 || receipts[1].GetProperty("hop").GetInt32() != 4 ||
                                    receipts[1].GetProperty("before").GetProperty("fighters").GetInt32() != 75 ||
                                    receipts[1].GetProperty("after").GetProperty("fighters").GetInt32() != 75 ||
                                    attempts.Length != 2 || attempts.Sum(a => Math.Max(a.GetProperty("fighter_loss").GetInt32(), a.GetProperty("committed_fighters").GetInt32())) != 49 ||
                                    !ships.Any(s => s.GetProperty("name").GetString() == "Prize of Orin Slate") ||
                                    outcome.GetProperty("classicAliens")[0].GetProperty("name").GetString() != "Vela Moss")
                                    throw new Exception("Market clearance did not preserve both prizes and the shared capture budget");
                                if (recoveryRanking && (!hadColonistRefusal || replacementDestructions != 1 ||
                                    replacementSupplySpent != 35000 || recoveryTradingGain <= 0 ||
                                    details.GetProperty("recovery_spent").GetInt64() != replacementSupplySpent ||
                                    details.GetProperty("recovery_attempts").GetArrayLength() != 1))
                                    throw new Exception("Recovery route ranking did not earn funds and complete one bounded colony replacement");
                                if (supplySources)
                                {
                                    var sources = details.GetProperty("supply_sources");
                                    var visits = sources.GetProperty("visits").EnumerateArray().ToArray();
                                    var choices = sources.GetProperty("selections").EnumerateArray().ToArray();
                                    if (sources.GetProperty("active").ValueKind != JsonValueKind.Null || choices.Length == 0 ||
                                        !visits.Any(v => v.GetProperty("port_class").GetInt32() == 0 && v.GetProperty("quote").GetProperty("price").GetInt32() == 180) ||
                                        !visits.Any(v => v.GetProperty("port_class").GetInt32() == 9 && v.GetProperty("quote").GetProperty("price").GetInt32() == 173) ||
                                        visits.Any(v => v.GetProperty("spent").GetInt64() != 0 || v.GetProperty("purchases").GetArrayLength() != 0) ||
                                        choices.Any(c => c.GetProperty("selected").GetProperty("price").GetInt32() != 173) ||
                                        sources.GetProperty("moves").EnumerateArray().Any(move =>
                                            !move.TryGetProperty("arrived", out var arrived) || arrived.GetInt32() != move.GetProperty("hop").GetInt32()))
                                        throw new Exception("Supply source survey and cheaper observed offer selection were not verified");
                                    foreach (var visit in visits)
                                        foreach (var field in new[] { "ship", "credits", "fighters" })
                                            if (visit.GetProperty("initial").GetProperty(field).GetInt64() != visit.GetProperty("current").GetProperty(field).GetInt64())
                                                throw new Exception("Quote-only supply visit changed player resources");
                                }
                            }
                        }
                        if (captureDiscovery && !captureSearch)
                        {
                            var details = summary.RootElement.GetProperty("details");
                            var discovery = details.GetProperty("capture_discoveries").GetProperty("0");
                            var seen = discovery.GetProperty("seen").EnumerateArray().ToArray();
                            var names = new[] { "Ilex Nine", "Orin Slate", "Vela Moss" };
                            var goal = finalDecision.RootElement.GetProperty("state").GetProperty("objective").GetProperty("combat")[0];
                            var attempts = fights[0].GetProperty("attempts").EnumerateArray().ToArray();
                            var surveyCommands = new List<string>();
                            int decisionIndex = 0;
                            foreach (string line in File.ReadLines(Path.Combine(player, $"outputs/{outputPrefix}-decisions.jsonl")))
                            {
                                using var row = JsonDocument.Parse(line);
                                if (row.RootElement.GetProperty("action").GetString()!.StartsWith("discover_", StringComparison.Ordinal))
                                    surveyCommands.Add(commands[decisionIndex]);
                                decisionIndex++;
                            }
                            if (goal.TryGetProperty("target", out _) || goal.TryGetProperty("alternatives", out _) ||
                                goal.GetProperty("target_selection").GetString() != "current_sector_aliens" ||
                                names.Any(n => goal.GetRawText().Contains(n, StringComparison.Ordinal)) ||
                                !seen.Select(c => c.GetProperty("target").GetString()).SequenceEqual(names) ||
                                !surveyCommands.SequenceEqual(new[] { "d", "a", "n", "n", "n" }) ||
                                attempts.Length != 3 || attempts[0].GetProperty("satisfied").GetBoolean() || attempts[1].GetProperty("satisfied").GetBoolean() ||
                                !attempts[2].GetProperty("satisfied").GetBoolean() ||
                                attempts[2].GetProperty("objective").GetProperty("target").GetString() != "Vela Moss" ||
                                fighterPurchaseSpent != 39617 || details.GetProperty("provision_spent").GetInt64() != fighterPurchaseSpent ||
                                attempts.Sum(a => Math.Max(a.GetProperty("committed_fighters").GetInt32(), a.GetProperty("fighter_loss").GetInt32())) > 100 ||
                                spareSaleCount != 0 || fights.Any(f => !f.GetProperty("satisfied").GetBoolean()))
                                throw new Exception("Unnamed capture discovery did not bind observed identities and verify its full career");
                        }
                        if (captureContinuation)
                        {
                            var details = summary.RootElement.GetProperty("details");
                            var attempts = fights[0].GetProperty("attempts").EnumerateArray().ToArray();
                            var continuations = details.GetProperty("capture_continuations").EnumerateArray().ToArray();
                            if (attempts.Length != 3 || continuations.Length != 1 ||
                                attempts[0].GetProperty("satisfied").GetBoolean() || attempts[1].GetProperty("satisfied").GetBoolean() ||
                                !attempts[2].GetProperty("satisfied").GetBoolean() ||
                                attempts[2].GetProperty("objective").GetProperty("target").GetString() != "Mira Fen" ||
                                attempts[2].GetProperty("initial").GetProperty("fighters").GetInt64() != 58 ||
                                continuations[0].GetProperty("current").GetProperty("fighters").GetInt64() != 58 ||
                                continuations[0].GetProperty("remaining_capture_budget").GetInt64() != 33 ||
                                continuations[0].GetProperty("fighters_after_full_commitment").GetInt64() != 25 ||
                                attempts.Sum(a => Math.Max(a.GetProperty("committed_fighters").GetInt32(), a.GetProperty("fighter_loss").GetInt32())) > 100 ||
                                fighterPurchaseSpent != 39271 || fighterPurchaseCount != 4 ||
                                details.GetProperty("provision_spent").GetInt64() != fighterPurchaseSpent ||
                                details.GetProperty("provision_visits").EnumerateArray().Sum(v => v.GetProperty("spent").GetInt64()) != fighterPurchaseSpent ||
                                outcome.GetProperty("fightersRemaining").GetInt64() != 100 || spareSaleCount != 0 ||
                                fights.Any(f => !f.GetProperty("satisfied").GetBoolean()))
                                throw new Exception("Capture continuation did not preserve actual resources, prize receipts and final resupply");
                        }
                        if (captureAlternatives && !captureSchedule && !captureContinuation && !captureDiscovery)
                        {
                            var attempts = fights[0].GetProperty("attempts").EnumerateArray().ToArray();
                            if (attempts.Length != 2 || attempts[0].GetProperty("satisfied").GetBoolean() ||
                                !attempts[1].GetProperty("satisfied").GetBoolean() ||
                                attempts[1].GetProperty("objective").GetProperty("target").GetString() != "Krel Voss" ||
                                attempts.Sum(a => Math.Max(a.GetProperty("committed_fighters").GetInt32(), a.GetProperty("fighter_loss").GetInt32())) > 100 ||
                                !fights[0].GetProperty("prize").GetProperty("corporate").GetBoolean())
                                throw new Exception("Alternative capture did not preserve target, shared budget and corporate ownership");
                        }
                        if (combatOutcome && (fights.Any(f => !f.GetProperty("satisfied").GetBoolean()) ||
                            fights[1].GetProperty("prize").ValueKind != JsonValueKind.Null ||
                            fights[1].GetProperty("receipt").GetProperty("outcome").GetString() != "destroyed" ||
                            ships.Any(s => s.GetProperty("name").GetString() == "Enemy Hull") ||
                            summary.RootElement.GetProperty("details").GetProperty("unmet_combat_objectives").GetArrayLength() != 0))
                            throw new Exception("Player hull defeat was not verified independently of capture");
                    }
                }
            }
            else if (combat)
            {
                bool won = alien ? outcome.GetProperty("ownedShips").EnumerateArray().Any(s => s.GetProperty("name").GetString() == "Alien Prize")
                    : outcome.GetProperty("opponent").GetProperty("totalDestructionCount").GetInt32() > 0;
                long loss = outcome.GetProperty("initialFighters").GetInt64() - outcome.GetProperty("fightersRemaining").GetInt64();
                if (!won || loss > fighterBudget || outcome.GetProperty("totalDestructionCount").GetInt32() != 0 ||
                    outcome.GetProperty("eliminated").GetBoolean() || outcome.GetProperty("promptMode").GetString() != "Command" ||
                    !decisions.Contains("model_stopped_unverified")) throw new Exception("MTC combat objective failed: " + outcome);
                if (rounds && (outcome.GetProperty("counterattacks").GetInt32() < 1 ||
                    commands.Count(c => long.TryParse(c, out long n) && n > 0) < 2))
                    throw new Exception("Multi-round combat did not exercise a counterattack and subsequent attack");
            }
            else if (mission)
            {
                var ships = outcome.GetProperty("ownedShips").EnumerateArray().Where(s => s.GetProperty("name").GetString() == $"Builder {seed}").ToArray();
                var planets = outcome.GetProperty("currentSectorPlanets").EnumerateArray().Where(p => p.GetProperty("name").GetString() == $"(M) New Home {seed}").ToArray();
                string population = new[] { "fuelOreColonists", "organicsColonists", "equipmentColonists" }[seed % 3];
                bool colonyComplete = planets.Length == 1 && ships.Length == 1 &&
                    (flexible ? new[] { "fuelOreColonists", "organicsColonists", "equipmentColonists" }.Sum(k => planets[0].GetProperty(k).GetInt32())
                        : planets[0].GetProperty(population).GetInt32()) == ships[0].GetProperty("holds").GetInt32() &&
                    decisions.Contains(campaign ? "verified_settlement" : "model_stopped_unverified");
                if (flexible && (commands.Contains("j") || planets.Length != 1 || planets[0].GetProperty(population).GetInt32() != 0 ||
                    !hadColonistRefusal))
                    throw new Exception("Flexible mission did not preserve and redirect refused colonists");
                bool recovered = ships.Length == 1 && result.GetProperty("context").GetProperty("currentSector").GetInt32() == 2 &&
                    outcome.GetProperty("terraColonists").GetInt64() == initialTerra - ships[0].GetProperty("holds").GetInt32() &&
                    commands.Zip(commands.Skip(1)).Any(pair => pair.First == "j" && pair.Second == "y") &&
                    decisions.Contains("colony_deferred_after_jettison");
                if (campaign && (startingCredits >= 80000 || firstDockCredits is not >= 80000 || outcome.GetProperty("creditsDelta").GetInt64() <= -71805 || steps < 50))
                    throw new Exception("Campaign did not earn funds before settling");
                if ((expectRecovery ? !recovered : !colonyComplete) || ships.Length != 1 || outcome.GetProperty("activeShipId").GetInt32() != ships[0].GetProperty("id").GetInt32() ||
                    outcome.GetProperty("shipColonists").GetInt32() != 0 || outcome.GetProperty("promptMode").GetString() != "Command" ||
                    outcome.GetProperty("totalDestructionCount").GetInt32() != 0 || outcome.GetProperty("eliminated").GetBoolean() ||
                    outcome.GetProperty("genesisTorpedoes").GetInt32() != 0 || outcome.GetProperty("creditsDelta").GetInt64() < -700000)
                    throw new Exception("MTC mission did not establish the requested colony: " + outcome);
            }
            else if (outcome.GetProperty("creditsDelta").GetInt64() <= 0 || outcome.GetProperty("visitedSectors").GetInt32() < 2)
                throw new Exception("Continuous MTC component gameplay did not earn cash and move");
            using var artifactManifest = JsonDocument.Parse(File.ReadAllText(Path.Combine(Path.IsPathRooted(model) ? model : Path.Combine(player, model), "model.json")));
            string[] componentNames = new[] { "economy", "settlement", "provision", "combat", "replacement", "ship_selector", "spare_sale", "capture_scheduler" }
                .Where(name => artifactManifest.RootElement.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String).ToArray();
            File.WriteAllText(Path.Combine(player, $"outputs/{outputPrefix}-game.json"), JsonSerializer.Serialize(new
            {
                steps, outcome, model, seed, commands, expectRecovery, startingCredits, firstDockCredits,
                firstShipPurchaseCredits, fighterPurchaseSpent, fighterPurchaseCount, pvpFightersCommitted, captureSchedule, observedCaptureBeforePurchase, boundedNavigation, combatCommitment, recoveryProvision, tradeMemory, captureContinuation, captureDiscovery, captureSearch, marketClearance, recoveryRanking, supplySources, supplyReplan, escapeReserve, verifiedCareerDetails, observedEarlyAlienDefeatBeforePurchase, observedNavigationDamage, observedNavigationCollisions,
                zeroLoot, replaceColony, recoveryLoot, selectShip, combatAfterSettlement, spareSale, spareSaleGain, spareSaleCount, planetCatalog, colonyPreflight, combatOutcome, partialSaleFunding, captureAlternatives, captureFailPercent = captureSearch ? 0 : combatOutcome || partialSaleFunding || captureAlternatives ? 50 : 0, surveyedPlanetSpecs, recoveryTradingGain, replacementSupplySpent, replacementDestructions, destructionsBeforeFirstLoad, initialTurnsOverride = zeroLoot || recoveryLoot != null ? (int?)1000 : null,
                weightsSha256 = campaign || career ? null : Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(File.ReadAllBytes(Path.Combine(Path.IsPathRooted(model) ? model : Path.Combine(player, model), "weights.npz")))).ToLowerInvariant(),
                componentWeightsSha256 = campaign || career ? componentNames.ToDictionary(name => name, name =>
                    Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(File.ReadAllBytes(Path.Combine(Path.IsPathRooted(model) ? model : Path.Combine(player, model), name, "weights.npz")))).ToLowerInvariant()) : null,
                modelSha256 = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(File.ReadAllBytes(Path.Combine(Path.IsPathRooted(model) ? model : Path.Combine(player, model), "model.json")))).ToLowerInvariant(),
                componentModelSha256 = campaign || career ? componentNames.ToDictionary(name => name, name =>
                    Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(File.ReadAllBytes(Path.Combine(Path.IsPathRooted(model) ? model : Path.Combine(player, model), name, "model.json")))).ToLowerInvariant()) : null,
                contextSource = "MTC AutoRecorder database, ShipInfoParser and GameAgentRuntime; engine truth used only for evaluation",
                limitation = "Continuous real-engine/Telnet/RPC component loop; test bridge replaces MainWindow dispatch",
            }, new JsonSerializerOptions { WriteIndented = true }));
            Console.WriteLine($"PASS: {steps} continuous parsed MTC/game/model actions ({(career ? "career" : campaign ? "campaign" : combat ? "combat" : mission ? "settlement" : "trading")}); credit gain {outcome.GetProperty("creditsDelta")}");
        }
        finally
        {
            if (policy != null) { if (!policy.HasExited) { policy.Kill(entireProcessTree: true); await policy.WaitForExitAsync(); }
                if (diagnosticError != null) File.WriteAllText(Path.Combine(player, "outputs/mtc-continuous-stderr.txt"), await diagnosticError);
                policy.Dispose(); }
            engine.StandardInput.Close();
            try { await engine.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(5)); } catch (TimeoutException) { engine.Kill(); await engine.WaitForExitAsync(); }
            ScriptRef.SetActiveDatabase(null); database.CloseDatabase(); AppPaths.SetConfiguredProgramDir(originalProgramDir);
            Directory.Delete(temporary, recursive: true);
        }
    }
}
