using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace MTC;

public partial class MainWindow
{
    private async Task ShowDockShopperAsync()
    {
        if (_gameInstance == null)
        {
            await ShowMessageAsync("Dock Shopper", "Dock Shopper requires an embedded proxy game.");
            return;
        }

        MTC.mombot.mombotStatusSnapshot snapshot = _mombot.GetStatusSnapshot();
        if (!snapshot.Enabled)
        {
            await ShowMessageAsync("Dock Shopper", "Enable native Mombot first.");
            return;
        }

        if (!snapshot.AcceptSelfCommands)
        {
            await ShowMessageAsync("Dock Shopper", "Native Mombot is not accepting local commands.");
            return;
        }

        var dialog = new DockShopperWindow(LoadDockShopperShipChoices());
        bool accepted = await dialog.ShowDialog<bool>(this);
        if (!accepted || dialog.Result == null)
            return;

        MtcRpcActionResult result = await ExecuteGameAgentMombotCommandAsync(dialog.Result.CommandLine);
        if (!result.Success)
            await ShowMessageAsync("Dock Shopper", result.Message);
    }

    private IReadOnlyList<DockShopperShipChoice> LoadDockShopperShipChoices()
    {
        var choices = new List<DockShopperShipChoice> { new("0", "None") };
        string gameName = DeriveGameName();
        if (string.IsNullOrWhiteSpace(gameName))
            return choices;

        foreach (string path in GetDockShopperShipDataCandidates(gameName))
        {
            if (!File.Exists(path))
                continue;

            foreach (DockShopperShipChoice choice in ReadDockShopperShipChoices(path))
            {
                if (choices.Any(existing => string.Equals(existing.Token, choice.Token, StringComparison.OrdinalIgnoreCase)))
                    continue;

                choices.Add(choice);
            }

            if (choices.Count > 1)
                break;
        }

        return choices;
    }

    private IEnumerable<string> GetDockShopperShipDataCandidates(string gameName)
    {
        string fileName = $"LSD_{gameName}.ships";
        string folder = ReadCurrentMombotVar(string.Empty, "$folder");
        if (!string.IsNullOrWhiteSpace(folder))
        {
            yield return Path.Combine(ResolveDockShopperPath(folder), fileName);
        }

        string scriptDirectory = GetEffectiveProxyScriptDirectory();
        yield return Path.Combine(scriptDirectory, "mombot", fileName);

        string programDirectory = GetEffectiveProxyProgramDir(scriptDirectory);
        yield return Path.Combine(programDirectory, "scripts", "mombot", fileName);
    }

    private string ResolveDockShopperPath(string path)
    {
        string trimmed = path.Trim();
        if (Path.IsPathRooted(trimmed))
            return trimmed;

        string scriptDirectory = GetEffectiveProxyScriptDirectory();
        string scriptRelative = Path.Combine(scriptDirectory, trimmed);
        if (Directory.Exists(scriptRelative))
            return scriptRelative;

        return Path.Combine(GetEffectiveProxyProgramDir(scriptDirectory), trimmed);
    }

    private static IEnumerable<DockShopperShipChoice> ReadDockShopperShipChoices(string path)
    {
        foreach (string line in File.ReadLines(path))
        {
            string[] parts = line.Split('\t');
            if (parts.Length < 2)
                continue;

            string token = parts[0].Trim();
            if (string.IsNullOrWhiteSpace(token) || string.Equals(token, "+", StringComparison.Ordinal))
                continue;

            string name = parts[1].Trim();
            string cost = parts.Length > 2 ? parts[2].Trim() : string.Empty;
            string details = parts.Length > 3 ? parts[3].Trim() : line;
            yield return new DockShopperShipChoice(token, string.IsNullOrWhiteSpace(name) ? $"Ship {token}" : name, cost, details);
        }
    }
}
