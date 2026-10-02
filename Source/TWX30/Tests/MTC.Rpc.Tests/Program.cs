using System.Net;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using MTC;
using TWXProxy.Core;

static void Check(bool condition, string message)
{
    if (!condition) throw new Exception(message);
}

// Exercise the real RPC transport/dispatch with a game-config bridge, without
// creating a desktop window or connecting to a live game.
var config = new EmbeddedMtcDebugConfig();
var configs = new Dictionary<string, EmbeddedMtcDebugConfig> { ["rpc-test"] = config, ["other-game"] = new() };
string activeGame = "rpc-test";
bool switchDuringApproval = false;
int mutations = 0;
int approvals = 0;
bool approve = false;
int promptSends = 0;
var observedPrompt = new GameAgentEvent
{
    GameName = "rpc-test", Kind = GameAgentEventKind.ServerPrompt,
    PlainText = "Command [TL=00:00:00]:[123] (?=Help)? :",
};
IReadOnlyList<GameAgentEvent> promptEvents = [observedPrompt];
var bridge = new MtcRpcBridge
{
    GetContextAsync = _ => Task.FromResult(new GameAgentContextSnapshot()),
    GetRecentEventsAsync = (_, _) => Task.FromResult<IReadOnlyList<GameAgentEvent>>([]),
    QuerySectorAsync = _ => Task.FromResult<GameAgentSectorSnapshot?>(null),
    ListScriptsAsync = () => Task.FromResult<IReadOnlyList<GameAgentRunningScriptSnapshot>>([]),
    SendCommandAsync = (_, _) => throw new Exception("Must not send game input"),
    SendPromptCommandAsync = request =>
    {
        MtcRpcPromptGuard.Validate(request, activeGame, true, true, promptEvents);
        promptSends++;
        return Task.FromResult(MtcRpcActionResult.Ok("guarded-test"));
    },
    RunMombotCommandAsync = _ => throw new Exception("Must not run bot commands"),
    RunScriptAsync = _ => throw new Exception("Must not run scripts"),
    StopScriptAsync = (_, _) => throw new Exception("Must not stop scripts"),
    ApproveActionAsync = (_, _) =>
    {
        approvals++;
        if (switchDuringApproval) activeGame = "other-game";
        return Task.FromResult(approve);
    },
    GetDebugSettingsAsync = name =>
    {
        name ??= activeGame;
        if (!configs.TryGetValue(name, out var target)) throw new MtcRpcException(-32005, "Game not open");
        return Task.FromResult(MtcRpcDebugSettings.Snapshot(name, target));
    },
    SetDebugSettingsAsync = (name, patch) =>
    {
        mutations++;
        MtcRpcDebugSettings.Apply(configs[name], patch);
        return Task.FromResult(MtcRpcDebugSettings.Snapshot(name, configs[name]));
    },
};

var portProbe = new TcpListener(IPAddress.Loopback, 0);
portProbe.Start();
int port = ((IPEndPoint)portProbe.LocalEndpoint).Port;
portProbe.Stop();
using var server = new MtcJsonRpcServer(bridge);
void SetPermission(MtcRpcApprovalLevel level) => server.ApplyOptions(new()
{
    Enabled = true, BindAddress = "127.0.0.1", Port = port,
    AuthToken = "rpc-test-token", ApprovalLevel = level,
});
SetPermission(MtcRpcApprovalLevel.FullAutomation);
using var http = new HttpClient { BaseAddress = new Uri(server.Endpoint), Timeout = TimeSpan.FromSeconds(10) };
http.DefaultRequestHeaders.Authorization = new("Bearer", "rpc-test-token");
async Task<JsonElement> Call(string method, string? parameters = null)
{
    string request = $"{{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"{method}\"" +
        (parameters == null ? "}" : $",\"params\":{parameters}}}");
    using var response = await http.PostAsync("", new StringContent(request, Encoding.UTF8, "application/json"));
    response.EnsureSuccessStatusCode();
    using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    return document.RootElement.Clone();
}

var names = MtcRpcDebugSettings.Names;
var propertyNames = typeof(EmbeddedMtcDebugConfig).GetProperties()
    .Select(p => JsonNamingPolicy.CamelCase.ConvertName(p.Name)).Order().ToArray();
Check(names.Order().SequenceEqual(propertyNames), "RPC must cover every Preferences debug flag");
var capabilities = (await Call("rpc.discover")).GetProperty("result");
Check(capabilities.GetProperty("methods").EnumerateArray().Any(m => m.GetString() == "mtc.setDebugSettings"), "Discovery missing setter");
Check(capabilities.GetProperty("debugSettings").GetArrayLength() == 9, "Discovery missing debug flags");
Console.WriteLine("PASS: discovery covers all Preferences debug switches");

var allOn = JsonSerializer.Serialize(new { settings = names.ToDictionary(n => n, _ => true) });
var allOff = JsonSerializer.Serialize(new { settings = names.ToDictionary(n => n, _ => false) });
foreach (var (patch, enabled) in new[] { (allOn, true), (allOff, false) })
{
    var result = (await Call("mtc.setDebugSettings", patch)).GetProperty("result");
    foreach (string name in names)
        Check(result.GetProperty("settings").GetProperty(name).GetBoolean() == enabled, $"Setter failed: {name}");
    var read = (await Call("mtc.getDebugSettings")).GetProperty("result");
    Check(read.GetProperty("settings").GetRawText() == result.GetProperty("settings").GetRawText(), "Readback mismatch");
    var saved = JsonSerializer.Deserialize<EmbeddedMtcDebugConfig>(JsonSerializer.Serialize(config))!;
    foreach (var property in typeof(EmbeddedMtcDebugConfig).GetProperties())
        Check((bool)property.GetValue(saved)! == enabled, "Config serialization lost a setting");
}
await Call("mtc.setDebugSettings", allOn);
await Call("mtc.setDebugSettings", "{\"settings\":{\"triggerDebugLogging\":false}}");
Check(!config.TriggerDebugLogging && config.VerboseDebugLogging && config.DebugLoggingEnabled, "Partial update changed omitted flags");
Console.WriteLine("PASS: every flag toggles both ways, partial updates and config serialization preserve values");

int before = mutations;
foreach (string bad in new[]
{
    "{}", "[]", "{\"settings\":{}}", "{\"settings\":true}",
    "{\"settings\":{\"verboseDebugLogging\":false,\"typo\":true}}",
    "{\"settings\":{\"verboseDebugLogging\":false,\"triggerDebugLogging\":\"true\"}}",
    "{\"settings\":{\"triggerDebugLogging\":null}}",
    "{\"settings\":{\"triggerDebugLogging\":1}}",
    "{\"settings\":{\"triggerDebugLogging\":true,\"triggerDebugLogging\":false}}",
    "{\"settings\":{\"triggerDebugLogging\":true},\"persist\":false}",
})
    Check((await Call("mtc.setDebugSettings", bad)).GetProperty("error").GetProperty("code").GetInt32() == -32602, "Invalid patch not rejected");
Check(mutations == before && config.VerboseDebugLogging, "Invalid patch partially applied");
Console.WriteLine("PASS: invalid patches rejected atomically");

SetPermission(MtcRpcApprovalLevel.ReadOnly);
Check((await Call("mtc.getDebugSettings")).TryGetProperty("result", out _), "Read-only getter denied");
Check((await Call("mtc.setDebugSettings", allOff)).GetProperty("error").GetProperty("code").GetInt32() == -32002, "Read-only setter allowed");
SetPermission(MtcRpcApprovalLevel.ApproveActions);
Check((await Call("mtc.setDebugSettings", allOff)).GetProperty("error").GetProperty("code").GetInt32() == -32003, "Rejected setter allowed");
Check(mutations == before && approvals == 1, "Permission rejection mutated config");
approve = true;
Check((await Call("mtc.setDebugSettings", allOff)).TryGetProperty("result", out _), "Approved setter failed");
Check(approvals == 2 && !config.DebugLoggingEnabled, "Approval path failed");
http.DefaultRequestHeaders.Authorization = null;
using (var response = await http.PostAsync("", new StringContent("{}")))
    Check(response.StatusCode == HttpStatusCode.Unauthorized, "Unauthenticated request accepted");
http.DefaultRequestHeaders.Authorization = new("Bearer", "rpc-test-token");
Console.WriteLine("PASS: authentication and all three approval levels enforced");

SetPermission(MtcRpcApprovalLevel.FullAutomation);
using (var ws = new ClientWebSocket())
{
    ws.Options.SetRequestHeader("Authorization", "Bearer rpc-test-token");
    using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
    await ws.ConnectAsync(new Uri($"ws://127.0.0.1:{port}/"), timeout.Token);
    byte[] request = Encoding.UTF8.GetBytes("{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"mtc.setDebugSettings\",\"params\":{\"settings\":{\"debugLoggingEnabled\":true,\"triggerDebugLogging\":true}}}");
    await ws.SendAsync(request.AsMemory(), WebSocketMessageType.Text, true, timeout.Token);
    var buffer = new byte[8192];
    using var message = new MemoryStream();
    ValueWebSocketReceiveResult frame;
    do
    {
        frame = await ws.ReceiveAsync(buffer.AsMemory(), timeout.Token);
        message.Write(buffer, 0, frame.Count);
    } while (!frame.EndOfMessage);
    using var reply = JsonDocument.Parse(message.ToArray());
    Check(reply.RootElement.GetProperty("result").GetProperty("settings").GetProperty("triggerDebugLogging").GetBoolean(), "WebSocket update failed");
    await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "done", timeout.Token);
}
Console.WriteLine("PASS: WebSocket debug setter");

SetPermission(MtcRpcApprovalLevel.ApproveActions);
switchDuringApproval = true;
var switched = (await Call("mtc.setDebugSettings", "{\"settings\":{\"triggerDebugLogging\":true}}")).GetProperty("result");
Check(switched.GetProperty("gameName").GetString() == "rpc-test", "Tab switch redirected the update");
Check(!configs["other-game"].TriggerDebugLogging, "Tab switch changed the wrong game");
switchDuringApproval = false;
SetPermission(MtcRpcApprovalLevel.FullAutomation);
await Call("mtc.setDebugSettings", "{\"gameName\":\"rpc-test\",\"settings\":{\"triggerDebugLogging\":false}}");
Check(!config.TriggerDebugLogging, "Explicit game target failed");
Check((await Call("mtc.getDebugSettings", "{\"gameName\":\"closed-game\"}")).GetProperty("error").GetProperty("code").GetInt32() == -32005, "Closed game not rejected");
Check((await Call("mtc.setDebugSettings", "{\"gameName\":42,\"settings\":{\"triggerDebugLogging\":false}}")).GetProperty("error").GetProperty("code").GetInt32() == -32602, "Invalid game target not rejected");
Console.WriteLine("PASS: explicit game target and tab switching during approval");

var first = new TwxRuntimeContext("rpc-first");
var second = new TwxRuntimeContext("rpc-second");
using (GlobalModules.UseRuntimeContext(first))
{
    GlobalModules.ConfigureDebugLogging("rpc-test.log", false, true, true, true, true, true);
    var snapshot = JsonSerializer.SerializeToElement(MtcRpcDebugSettings.Snapshot("first", config), new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
    Check(!snapshot.GetProperty("effectiveSettings").GetProperty("triggerDebugLogging").GetBoolean(), "Master switch gating incorrect");
    Check(snapshot.GetProperty("logPaths").GetProperty("debug").GetString() == "rpc-test.log", "Log path missing");
    Check(snapshot.GetProperty("processWideSettings").GetArrayLength() == 2, "Haggle scope missing");
}
using (GlobalModules.UseRuntimeContext(second))
    Check(GlobalModules.DebugLogPath != "rpc-test.log", "Runtime log context leaked");
Console.WriteLine("PASS: effective master gating, log paths and runtime-context isolation");
bool oldPort = GlobalModules.PortHaggleDebugMode;
bool oldPlanet = GlobalModules.PlanetHaggleDebugMode;
string oldPortPath = GlobalModules.PortHaggleDebugLogPath;
string oldPlanetPath = GlobalModules.PlanetHaggleDebugLogPath;
try
{
    GlobalModules.ConfigureHaggleDebugLogging(null, true, null, true);
    MtcRpcDebugSettings.ApplyHagglePatch(new Dictionary<string, bool> { ["triggerDebugLogging"] = false }, "unused-port", "unused-planet");
    Check(GlobalModules.PortHaggleDebugMode && GlobalModules.PlanetHaggleDebugMode, "Ordinary debug patch changed haggle flags");
    MtcRpcDebugSettings.ApplyHagglePatch(new Dictionary<string, bool> { ["debugPortHaggleEnabled"] = false }, oldPortPath, "unused-planet");
    Check(!GlobalModules.PortHaggleDebugMode && GlobalModules.PlanetHaggleDebugMode, "Port patch changed planet logging");
    Check(GlobalModules.PlanetHaggleDebugLogPath == oldPlanetPath, "Port patch changed planet log path");
}
finally
{
    GlobalModules.ConfigureHaggleDebugLogging(oldPortPath, oldPort, oldPlanetPath, oldPlanet);
}
Console.WriteLine("PASS: partial updates preserve unspecified process-wide haggle flags and paths");
Console.WriteLine("All JSON-RPC debug tests passed.");

activeGame = "rpc-test";
switchDuringApproval = false;
var promptParams = JsonSerializer.Serialize(new
{
    gameName = "rpc-test", prompt = observedPrompt.PlainText,
    promptTimestamp = observedPrompt.Timestamp, command = "\r", appendEnter = false,
});
SetPermission(MtcRpcApprovalLevel.ReadOnly);
Check((await Call("mtc.sendPromptCommand", promptParams)).GetProperty("error").GetProperty("code").GetInt32() == -32002,
    "Read-only guarded send allowed");
SetPermission(MtcRpcApprovalLevel.FullAutomation);
Check((await Call("mtc.sendPromptCommand", promptParams)).GetProperty("result").GetProperty("success").GetBoolean(),
    "Fresh guarded prompt or literal Enter rejected");
Check(promptSends == 1, "Guarded command not dispatched");
promptEvents = [observedPrompt, new GameAgentEvent { Kind = GameAgentEventKind.ClientInput, PlainText = "s" }];
Check((await Call("mtc.sendPromptCommand", promptParams)).GetProperty("error").GetProperty("code").GetInt32() == -32007,
    "Intervening input accepted");
promptEvents = [observedPrompt, new GameAgentEvent { Kind = GameAgentEventKind.ServerLine, PlainText = "New event" }];
Check((await Call("mtc.sendPromptCommand", promptParams)).GetProperty("error").GetProperty("code").GetInt32() == -32007,
    "Intervening server output accepted");
promptEvents = [observedPrompt];
SetPermission(MtcRpcApprovalLevel.ApproveActions);
approve = true;
switchDuringApproval = true;
Check((await Call("mtc.sendPromptCommand", promptParams)).GetProperty("error").GetProperty("code").GetInt32() == -32007,
    "Game switch during approval accepted");
Check(promptSends == 1, "Stale guarded request sent input");
Console.WriteLine("PASS: guarded prompt RPC preserves Enter, enforces approval, rejects changed prompts and game switches");
await PromptTransportTests.Run();
if (args.Contains("--player-transport"))
{
    await PlayerTransportTests.Run();
    await ShipTransportTests.Run();
}
if (args.Contains("--player-game")) await ContinuousPlayerTests.Run(
    args.SkipWhile(arg => arg != "--player-model").Skip(1).FirstOrDefault() ?? "models/frontier-v2",
    args.SkipWhile(arg => arg != "--player-python").Skip(1).FirstOrDefault());

if (args.Contains("--player-mission")) await ContinuousPlayerTests.Run(
    args.SkipWhile(arg => arg != "--player-model").Skip(1).FirstOrDefault() ?? "models/settle-capacity-v1-w4",
    args.SkipWhile(arg => arg != "--player-python").Skip(1).FirstOrDefault(), mission: true,
    seed: args.Contains("--recovery") ? 650002 : 650000, expectRecovery: args.Contains("--recovery"));

if (args.Contains("--player-combat"))
{
    string combatModel = args.SkipWhile(arg => arg != "--player-model").Skip(1).FirstOrDefault() ?? "models/combat-rounds-v1-w8";
    string? python = args.SkipWhile(arg => arg != "--player-python").Skip(1).FirstOrDefault();
    await ContinuousPlayerTests.Run(combatModel, python, mission: true, seed: 740053, combat: true);
    await ContinuousPlayerTests.Run(combatModel, python, mission: true, seed: 740007, combat: true);
}

if (args.Contains("--player-rounds")) await ContinuousPlayerTests.Run(
    args.SkipWhile(arg => arg != "--player-model").Skip(1).FirstOrDefault() ?? "models/combat-rounds-v1-w8",
    args.SkipWhile(arg => arg != "--player-python").Skip(1).FirstOrDefault(), mission: true,
    seed: int.Parse(args.SkipWhile(arg => arg != "--player-seed").Skip(1).FirstOrDefault() ?? "880029"),
    combat: true, rounds: true);

if (args.Contains("--player-campaign")) await ContinuousPlayerTests.Run(
    args.SkipWhile(arg => arg != "--player-model").Skip(1).FirstOrDefault() ?? "models/campaign-v1",
    args.SkipWhile(arg => arg != "--player-python").Skip(1).FirstOrDefault(), mission: true, seed: 760000, campaign: true);

if (args.Contains("--player-career")) await ContinuousPlayerTests.Run(
    args.SkipWhile(arg => arg != "--player-model").Skip(1).FirstOrDefault() ?? "models/career-rounds-v1",
    args.SkipWhile(arg => arg != "--player-python").Skip(1).FirstOrDefault(), mission: true, seed: 820000, career: true);

if (args.Contains("--player-flexible")) await ContinuousPlayerTests.Run(
    args.SkipWhile(arg => arg != "--player-model").Skip(1).FirstOrDefault() ?? "models/settle-flex-v1-w8",
    args.SkipWhile(arg => arg != "--player-python").Skip(1).FirstOrDefault(), mission: true, seed: 650002, flexible: true);

if (args.Contains("--player-flex-career")) await ContinuousPlayerTests.Run(
    args.SkipWhile(arg => arg != "--player-model").Skip(1).FirstOrDefault() ?? "models/career-rounds-v1",
    args.SkipWhile(arg => arg != "--player-python").Skip(1).FirstOrDefault(), mission: true,
    seed: int.Parse(args.SkipWhile(arg => arg != "--player-seed").Skip(1).FirstOrDefault() ?? "830056"),
    flexible: true, career: true);

if (args.Contains("--player-route-career"))
{
    string routeModel = args.SkipWhile(arg => arg != "--player-model").Skip(1).FirstOrDefault() ?? "models/career-routes-w4-candidate";
    string? python = args.SkipWhile(arg => arg != "--player-python").Skip(1).FirstOrDefault();
    await ContinuousPlayerTests.Run(routeModel, python, mission: true, seed: 820000, career: true);
    // Haggling changes the engine's random stream. This fixture must actually
    // reject the first production group before the alternate group succeeds.
    await ContinuousPlayerTests.Run(routeModel, python, mission: true, seed: 957004, career: true, flexible: true);
}

if (args.Contains("--player-zero-loot")) await ContinuousPlayerTests.Run(
    args.SkipWhile(arg => arg != "--player-model").Skip(1).FirstOrDefault() ?? "models/career-routes-w4-candidate",
    args.SkipWhile(arg => arg != "--player-python").Skip(1).FirstOrDefault(), mission: true,
    seed: int.Parse(args.SkipWhile(arg => arg != "--player-seed").Skip(1).FirstOrDefault() ?? "957001"),
    career: true, zeroLoot: true, flexible: args.Contains("--player-flexible-groups"));

if (args.Contains("--player-replacement-career")) await ContinuousPlayerTests.Run(
    args.SkipWhile(arg => arg != "--player-model").Skip(1).FirstOrDefault() ?? "models/career-recovery-v1-candidate",
    args.SkipWhile(arg => arg != "--player-python").Skip(1).FirstOrDefault(), mission: true,
    seed: int.Parse(args.SkipWhile(arg => arg != "--player-seed").Skip(1).FirstOrDefault() ?? "820000"),
    career: true, replaceColony: true, zeroLoot: args.Contains("--player-recovery-zero-loot"),
    recoveryLoot: args.Contains("--player-recovery-loot") ? long.Parse(args.SkipWhile(arg => arg != "--player-recovery-loot").Skip(1).First()) : null,
    selectShip: args.Contains("--player-ship-selection"), combatAfterSettlement: args.Contains("--player-combat-after-settlement"),
    spareSale: args.Contains("--player-spare-sale"), planetCatalog: args.Contains("--player-planet-catalog"), colonyPreflight: args.Contains("--player-colony-preflight"), combatOutcome: args.Contains("--player-combat-outcome"), partialSaleFunding: args.Contains("--player-partial-sale-funding"), captureAlternatives: args.Contains("--player-capture-alternatives"), captureSchedule: args.Contains("--player-capture-schedule"), boundedNavigation: args.Contains("--player-bounded-navigation"), combatCommitment: args.Contains("--player-combat-commitment"), recoveryProvision: args.Contains("--player-recovery-provision"), tradeMemory: args.Contains("--player-trade-memory"), captureContinuation: args.Contains("--player-capture-continuation"), captureDiscovery: args.Contains("--player-capture-discovery"), captureSearch: args.Contains("--player-capture-search"), marketClearance: args.Contains("--player-market-clearance"), recoveryRanking: args.Contains("--player-recovery-ranking"), supplySources: args.Contains("--player-supply-sources"), supplyReplan: args.Contains("--player-supply-replan"), escapeReserve: args.Contains("--player-escape-reserve"), outputTag: args.SkipWhile(arg => arg != "--player-output-tag").Skip(1).FirstOrDefault());
