/*
Copyright (C) 2005  Remco Mulder, 2026 Matt Mosley

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace TWXProxy.Core
{
    public partial class ScriptRef
    {
        /// <summary>Exposes the active database for other components such as AutoRecorder.</summary>
        internal static ModDatabase? ActiveDatabase => ResolveActiveDatabase();

        // Sector avoid list
        private static readonly HashSet<int> _avoidedSectors = new();

        #region Database Command Implementation

        private static CmdAction CmdGetSector_Impl(object script, CmdParam[] parameters)
        {
            ModDatabase? activeDatabase = ResolveActiveDatabase(script);

            // CMD: getsector <sectorNum> var
            if (parameters[1] is not VarParam sectorVar)
                return CmdAction.None;

            int sectorNum;
            ConvertToNumber(parameters[0].Value, out sectorNum);

            if (sectorNum == 0)
                return CmdAction.None;

            // Helper to set a named sub-field.
            // Names with dots (e.g. "figs.owner") are stored hierarchically so that
            // compiled dot-notation ($thisSector.figs.owner → $thisSector["figs"]["owner"])
            // resolves correctly at runtime.
            void SetField(string name, string value)
            {
                var parts = name.Split('.');
                sectorVar.GetIndexVar(parts).Value = value;

                if (script is Script scriptObj && scriptObj.Compiler != null)
                {
                    string flatName = sectorVar.Name + "." + name;
                    scriptObj.Compiler.GetOrCreateRuntimeVar(flatName).Value = value;

                    // Pascal keeps dotted names flat in the runtime param table. For
                    // fields exposed as arrays (e.g. $sector.warp[1], $sector.planet[1],
                    // $sector.trader.name[1]) we must also populate the flat array base
                    // variable, not just the fully dotted scalar leaf.
                    if (parts.Length > 1 && int.TryParse(parts[^1], out _))
                    {
                        string arrayBaseName = sectorVar.Name + "." + string.Join(".", parts, 0, parts.Length - 1);
                        scriptObj.Compiler
                            .GetOrCreateRuntimeVar(arrayBaseName)
                            .GetIndexVar(new[] { parts[^1] })
                            .Value = value;
                    }
                }
            }

            static bool ShouldTraceSectorVar(VarParam varParam)
            {
                string name = varParam.Name ?? string.Empty;
                return name.IndexOf("CURSECTOR", StringComparison.OrdinalIgnoreCase) >= 0 ||
                       name.IndexOf("THISSECTOR", StringComparison.OrdinalIgnoreCase) >= 0;
            }

            static string FormatExplore(ExploreType explored) => explored switch
            {
                ExploreType.No => "NO",
                ExploreType.Calc => "CALC",
                ExploreType.Density => "DENSITY",
                _ => "YES"
            };

            static string FormatYesNo(bool value) => value ? "YES" : "NO";

            static string FormatFigType(FighterType figType) => figType switch
            {
                FighterType.Toll => "TOLL",
                FighterType.Defensive => "DEFENSIVE",
                _ => "OFFENSIVE"
            };

            static string FormatPascalDateTime(DateTime value)
            {
                if (value == default)
                    return string.Empty;
                return value.ToShortDateString() + " " + value.ToLongTimeString();
            }

            if (activeDatabase == null || sectorNum <= 0 || sectorNum > activeDatabase.SectorCount)
            {
                SetField("explored", "NO");
                SetField("index", "0");
                SetField("density", "0");
                SetField("navhaz", "0");
                SetField("anomaly", "NO");
                SetField("anomoly", "NO");
                SetField("warps", "0");
                SetField("port.exists", "0");
                SetField("port.class", "0");
                SetField("figs.owner", "");
                SetField("figs.quantity", "0");
                SetField("figs.type", "OFFENSIVE");
                return CmdAction.None;
            }

            var sector = activeDatabase.GetSector(sectorNum);
            if (sector == null)
            {
                return CmdAction.None;
            }

            SetField("explored", FormatExplore(sector.Explored));
            SetField("index", sectorNum.ToString(CultureInfo.InvariantCulture));
            SetField("beacon", sector.Beacon ?? string.Empty);
            SetField("constellation", sector.Constellation ?? string.Empty);
            SetField("armidmines.quantity", sector.MinesArmid.Quantity.ToString(CultureInfo.InvariantCulture));
            SetField("armidmines.owner", sector.MinesArmid.Owner ?? string.Empty);
            SetField("limpetmines.quantity", sector.MinesLimpet.Quantity.ToString(CultureInfo.InvariantCulture));
            SetField("limpetmines.owner", sector.MinesLimpet.Owner ?? string.Empty);
            SetField("limpets.quantity", sector.MinesLimpet.Quantity.ToString(CultureInfo.InvariantCulture));
            SetField("limpets.owner", sector.MinesLimpet.Owner ?? string.Empty);
            SetField("figs.quantity", sector.Fighters.Quantity.ToString(CultureInfo.InvariantCulture));
            SetField("figs.owner", sector.Fighters.Owner ?? string.Empty);
            SetField("figs.type", FormatFigType(sector.Fighters.FigType));
            SetField("density", sector.Density.ToString(CultureInfo.InvariantCulture));
            SetField("navhaz", sector.NavHaz.ToString(CultureInfo.InvariantCulture));
            SetField("updated", FormatPascalDateTime(sector.Update));
            SetField("anomaly", sector.Anomaly ? "YES" : "NO");
            SetField("anomoly", sector.Anomaly ? "YES" : "NO");

            var warps = sector.Warp.Where(w => w != 0).ToList();
            SetField("warps", warps.Count.ToString(CultureInfo.InvariantCulture));
            for (int i = 1; i <= 6; i++)
            {
                string warpValue = i <= warps.Count
                    ? warps[i - 1].ToString(CultureInfo.InvariantCulture)
                    : "0";
                SetField($"warp.{i}", warpValue);
            }

            bool portExists = sector.SectorPort != null && !string.IsNullOrEmpty(sector.SectorPort.Name);
            SetField("port.name", sector.SectorPort?.Name ?? string.Empty);
            SetField("port.exists", portExists ? "1" : "0");
            SetField("port.class", portExists ? sector.SectorPort!.ClassIndex.ToString(CultureInfo.InvariantCulture) : "0");
            if (portExists && sector.SectorPort != null)
            {
                string ore = sector.SectorPort.ProductAmount.GetValueOrDefault(ProductType.FuelOre).ToString(CultureInfo.InvariantCulture);
                string org = sector.SectorPort.ProductAmount.GetValueOrDefault(ProductType.Organics).ToString(CultureInfo.InvariantCulture);
                string equip = sector.SectorPort.ProductAmount.GetValueOrDefault(ProductType.Equipment).ToString(CultureInfo.InvariantCulture);
                string percOre = sector.SectorPort.ProductPercent.GetValueOrDefault(ProductType.FuelOre).ToString(CultureInfo.InvariantCulture);
                string percOrg = sector.SectorPort.ProductPercent.GetValueOrDefault(ProductType.Organics).ToString(CultureInfo.InvariantCulture);
                string percEquip = sector.SectorPort.ProductPercent.GetValueOrDefault(ProductType.Equipment).ToString(CultureInfo.InvariantCulture);
                string buyOre = FormatYesNo(sector.SectorPort.BuyProduct.GetValueOrDefault(ProductType.FuelOre));
                string buyOrg = FormatYesNo(sector.SectorPort.BuyProduct.GetValueOrDefault(ProductType.Organics));
                string buyEquip = FormatYesNo(sector.SectorPort.BuyProduct.GetValueOrDefault(ProductType.Equipment));

                SetField("port.buildtime", sector.SectorPort.BuildTime.ToString(CultureInfo.InvariantCulture));
                SetField("port.perc_ore", percOre);
                SetField("port.perc_org", percOrg);
                SetField("port.perc_equip", percEquip);
                SetField("port.ore", ore);
                SetField("port.org", org);
                SetField("port.equip", equip);
                SetField("port.updated", FormatPascalDateTime(sector.SectorPort.Update));
                SetField("port.buy_ore", buyOre);
                SetField("port.buy_org", buyOrg);
                SetField("port.buy_equip", buyEquip);

                // Compatibility aliases used by the C# port sysconsts.
                SetField("port.fuel", ore);
                SetField("port.buyfuel", sector.SectorPort.BuyProduct.GetValueOrDefault(ProductType.FuelOre) ? "1" : "0");
                SetField("port.buyorg", sector.SectorPort.BuyProduct.GetValueOrDefault(ProductType.Organics) ? "1" : "0");
                SetField("port.buyequip", sector.SectorPort.BuyProduct.GetValueOrDefault(ProductType.Equipment) ? "1" : "0");
                SetField("port.percentfuel", percOre);
                SetField("port.percentorg", percOrg);
                SetField("port.percentequip", percEquip);
            }
            else
            {
                SetField("port.buildtime", "0");
                SetField("port.perc_ore", "0");
                SetField("port.perc_org", "0");
                SetField("port.perc_equip", "0");
                SetField("port.ore", "0");
                SetField("port.org", "0");
                SetField("port.equip", "0");
                SetField("port.updated", string.Empty);
                SetField("port.buy_ore", "NO");
                SetField("port.buy_org", "NO");
                SetField("port.buy_equip", "NO");
                SetField("port.fuel", "0");
                SetField("port.buyfuel", "0");
                SetField("port.buyorg", "0");
                SetField("port.buyequip", "0");
                SetField("port.percentfuel", "0");
                SetField("port.percentorg", "0");
                SetField("port.percentequip", "0");
            }

            var planetNames = activeDatabase.GetPlanetNamesInSector(sectorNum);
            SetField("planets", planetNames.Count.ToString(CultureInfo.InvariantCulture));
            for (int i = 0; i < planetNames.Count; i++)
                SetField($"planet.{i + 1}", planetNames[i]);

            SetField("traders", sector.Traders.Count.ToString(CultureInfo.InvariantCulture));
            for (int i = 0; i < sector.Traders.Count; i++)
            {
                Trader trader = sector.Traders[i];
                SetField($"trader.name.{i + 1}", trader.Name ?? string.Empty);
                SetField($"trader.ship.{i + 1}", trader.ShipType ?? string.Empty);
                SetField($"trader.shipname.{i + 1}", trader.ShipName ?? string.Empty);
                SetField($"trader.figs.{i + 1}", trader.Fighters.ToString(CultureInfo.InvariantCulture));
            }

            SetField("ships", sector.Ships.Count.ToString(CultureInfo.InvariantCulture));
            for (int i = 0; i < sector.Ships.Count; i++)
            {
                Ship ship = sector.Ships[i];
                SetField($"ship.name.{i + 1}", ship.Name ?? string.Empty);
                SetField($"ship.ship.{i + 1}", ship.ShipType ?? string.Empty);
                SetField($"ship.owner.{i + 1}", ship.Owner ?? string.Empty);
                SetField($"ship.figs.{i + 1}", ship.Fighters.ToString(CultureInfo.InvariantCulture));
            }

            var backDoors = activeDatabase.GetBackDoors(sector, sectorNum);
            for (int i = 0; i < backDoors.Count; i++)
            {
                SetField($"backdoor.{i + 1}", backDoors[i].ToString(CultureInfo.InvariantCulture));
            }

            if (GlobalModules.VerboseDebugMode)
                GlobalModules.DebugLog($"[GETSECTOR] #{sectorNum} warps:[{string.Join(",", warps)}] port.class={sector.SectorPort?.ClassIndex ?? 0}\n");

            if (ShouldTraceSectorVar(sectorVar))
            {
                string warp1 = sectorVar.GetIndexVar(new[] { "warp", "1" }).Value;
                string warp2 = sectorVar.GetIndexVar(new[] { "warp", "2" }).Value;
                string warp3 = sectorVar.GetIndexVar(new[] { "warp", "3" }).Value;
                GlobalModules.DebugLog($"[GETSECTOR TRACE] var='{sectorVar.Name}' sector={sectorNum} warps={warps.Count} warp1='{warp1}' warp2='{warp2}' warp3='{warp3}' density='{sector.Density}' portClass='{sector.SectorPort?.ClassIndex ?? 0}'\n");
            }

            return CmdAction.None;
        }

        private static CmdAction CmdGetSectorParameter_Impl(object script, CmdParam[] parameters)
        {
            ModDatabase? activeDatabase = ResolveActiveDatabase(script);
            int sectorNum;
            ConvertToNumber(parameters[0].Value, out sectorNum);
            string paramName = parameters[1].Value;
            CmdParam outputParam = parameters[2];

            if (sectorNum == 0)
                return CmdAction.None;

            if (paramName.Length > 10)
                throw new ScriptException("Sector parameter name exceeds 10 characters");

            if (activeDatabase == null || sectorNum <= 0 || sectorNum > activeDatabase.SectorCount)
            {
                outputParam.Value = string.Empty;
                return CmdAction.None;
            }

            string varValue = activeDatabase.GetSectorVar(sectorNum, paramName);
            if (varValue.Length > 40)
                throw new ScriptException("Sector parameter value exceeds 40 characters");

            outputParam.Value = varValue;

            return CmdAction.None;
        }

        private static CmdAction CmdSetSectorParameter_Impl(object script, CmdParam[] parameters)
        {
            ModDatabase? activeDatabase = ResolveActiveDatabase(script);
            int sectorNum;
            ConvertToNumber(parameters[0].Value, out sectorNum);
            string paramName = parameters[1].Value;
            string value = parameters[2].Value;

            if (paramName.Length > 10)
                throw new ScriptException("Sector parameter name exceeds 10 characters");
            if (value.Length > 40)
                throw new ScriptException("Sector parameter value exceeds 40 characters");

            if (activeDatabase != null && sectorNum > 0 && sectorNum <= activeDatabase.SectorCount)
            {
                activeDatabase.SetSectorVar(sectorNum, paramName, value);
                if (script is Script activeScript)
                    activeScript.MarkExecutionWatchdogActivity();
            }

            return CmdAction.None;
        }

        private static CmdAction CmdListSectorParameters_Impl(object script, CmdParam[] parameters)
        {
            ModDatabase? activeDatabase = ResolveActiveDatabase(script);

            // CMD: listsectorparameters <sector> var
            // List all custom parameters set for a sector

            int sectorNum;
            ConvertToNumber(parameters[0].Value, out sectorNum);

            if (parameters[1] is VarParam varParam)
            {
                if (activeDatabase != null && sectorNum > 0 && sectorNum <= activeDatabase.SectorCount)
                {
                    var paramNames = activeDatabase.GetSectorVarNames(sectorNum);
                    var names = paramNames.ToList();
                    varParam.SetArrayFromStrings(names);
                    varParam.Value = names.Count.ToString(CultureInfo.InvariantCulture);
                }
                else
                {
                    varParam.SetArrayFromStrings(new List<string>());
                    varParam.Value = "0";
                }
            }

            return CmdAction.None;
        }

        private static CmdAction CmdGetCourse_Impl(object script, CmdParam[] parameters)
        {
            // CMD: getcourse var <from> <to>
            // Match TWX27 Pascal semantics exactly:
            //   - return a path array that includes both start and destination
            //   - choose ties using breadth-first discovery order / warp order
            //   - return the scalar value as hop count (array length - 1)
            return CmdGetCourseCore(script, parameters, scalarIsHopCount: true);
        }

        private static CmdAction CmdGetCourses_Impl(object script, CmdParam[] parameters)
        {
            ModDatabase? activeDatabase = ResolveActiveDatabase(script);

            // CMD: getcourses var <from> <to>
            int fromSector, toSector;
            ConvertToNumber(parameters[1].Value, out fromSector);
            ConvertToNumber(parameters[2].Value, out toSector);

            if (parameters[0] is VarParam varParam)
            {
                if (activeDatabase == null ||
                    fromSector <= 0 || fromSector > activeDatabase.SectorCount ||
                    toSector <= 0 || toSector > activeDatabase.SectorCount)
                {
                    varParam.SetMultiArraysFromStringsLists(new List<List<string>>());
                    varParam.Value = "0";
                    return CmdAction.None;
                }

                var courses = activeDatabase.CalculateAllShortestPaths(fromSector, toSector, _avoidedSectors)
                    .Select(path => path.Select(sector => sector.ToString(CultureInfo.InvariantCulture)).ToList())
                    .ToList();
                varParam.SetMultiArraysFromStringsLists(courses);
                varParam.Value = courses.Count.ToString(CultureInfo.InvariantCulture);
            }

            return CmdAction.None;
        }

        private static CmdAction CmdGetCourseCore(object script, CmdParam[] parameters, bool scalarIsHopCount)
        {
            ModDatabase? activeDatabase = ResolveActiveDatabase(script);

            int fromSector, toSector;
            ConvertToNumber(parameters[1].Value, out fromSector);
            ConvertToNumber(parameters[2].Value, out toSector);

            if (parameters[0] is VarParam varParam &&
                activeDatabase != null &&
                fromSector > 0 && fromSector <= activeDatabase.SectorCount &&
                toSector > 0 && toSector <= activeDatabase.SectorCount)
            {
                var path = CalculateGetCoursePath(activeDatabase, fromSector, toSector);
                parameters[0].Value = scalarIsHopCount
                    ? (path.Count - 1).ToString()
                    : path.Count.ToString();

                if (path.Count > 0)
                {
                    varParam.SetArrayFromStrings(path.Select(sector => sector.ToString()).ToList());
                }
                else
                {
                    varParam.SetArrayFromStrings(new List<string>());
                }
            }
            else
            {
                parameters[0].Value = "0";
                if (parameters[0] is VarParam emptyVarParam)
                    emptyVarParam.SetArrayFromStrings(new List<string>());
            }

            return CmdAction.None;
        }

        private static CmdAction CmdGetDistance_Impl(object script, CmdParam[] parameters)
        {
            ModDatabase? activeDatabase = ResolveActiveDatabase(script);

            // CMD: getdistance var <from> <to>
            // Calculate distance (number of warps) between two sectors

            int fromSector, toSector;
            ConvertToNumber(parameters[1].Value, out fromSector);
            ConvertToNumber(parameters[2].Value, out toSector);

            if (activeDatabase != null &&
                fromSector > 0 && fromSector <= activeDatabase.SectorCount &&
                toSector > 0 && toSector <= activeDatabase.SectorCount)
            {
                var path = CalculateGetCoursePath(activeDatabase, fromSector, toSector);
                parameters[0].Value = (path.Count - 1).ToString(); // Distance is path length - 1

                string pathDesc = path.Count > 0
                    ? string.Join(" > ", path.Select(sectorNum =>
                    {
                        var sector = activeDatabase.GetSector(sectorNum);
                        string explored = sector?.Explored switch
                        {
                            ExploreType.No => "No",
                            ExploreType.Calc => "Calc",
                            ExploreType.Density => "Density",
                            ExploreType.Yes => "Yes",
                            _ => "?"
                        };
                        return $"{sectorNum}({explored})";
                    }))
                    : "<no path>";
                string avoids = _avoidedSectors.Count > 0
                    ? string.Join(",", _avoidedSectors.OrderBy(x => x))
                    : "<none>";
                GlobalModules.DebugLog(
                    $"[GETDISTANCE] from={fromSector} to={toSector} distance={parameters[0].Value} path={pathDesc} avoids={avoids}\n");
            }
            else
            {
                parameters[0].Value = "0";
                GlobalModules.DebugLog(
                    $"[GETDISTANCE] from={fromSector} to={toSector} distance=0 path=<invalid input> sectorCount={activeDatabase?.SectorCount ?? 0}\n");
            }

            return CmdAction.None;
        }

        private static CmdAction CmdGetAllCourses_Impl(object script, CmdParam[] parameters)
        {
            ModDatabase? activeDatabase = ResolveActiveDatabase(script);

            // CMD: getallcourses <2-DimensionArrayName> <StartingSector>
            int startSector;
            ConvertToNumber(parameters[1].Value, out startSector);

            if (parameters[0] is VarParam varParam)
            {
                if (activeDatabase == null ||
                    startSector <= 0 ||
                    startSector > activeDatabase.SectorCount)
                {
                    varParam.SetMultiArraysFromStringsLists(new List<List<string>>());
                    return CmdAction.None;
                }

                var allCourses = activeDatabase.GetAllCoursesFrom(startSector, _avoidedSectors);
                varParam.SetMultiArraysFromStringsLists(allCourses);
            }

            return CmdAction.None;
        }

        private static CmdAction CmdGetNearestWarps_Impl(object script, CmdParam[] parameters)
        {
            ModDatabase? activeDatabase = ResolveActiveDatabase(script);

            // Pascal TWX semantics:
            //   getnearestwarps <ArrayName> <StartingSector>
            // Returns the breadth-first reachable-sector queue produced by PlotWarpCourse(start, 0).

            int startSector;
            ConvertToNumber(parameters[1].Value, out startSector);

            if (parameters[0] is VarParam varParam)
            {
                if (activeDatabase != null &&
                    startSector > 0 && startSector <= activeDatabase.SectorCount)
                {
                    var reachable = activeDatabase.GetReachableSectorsBreadthFirst(startSector, _avoidedSectors)
                        .Select(sector => sector.ToString())
                        .ToList();
                    parameters[0].Value = reachable.Count.ToString();
                    varParam.SetArrayFromStrings(reachable);
                }
                else
                {
                    parameters[0].Value = "0";
                    varParam.SetArrayFromStrings(new List<string>());
                }
            }

            return CmdAction.None;
        }

        private static CmdAction CmdSetAvoid_Impl(object script, CmdParam[] parameters)
        {
            ModDatabase? activeDatabase = ResolveActiveDatabase(script);

            // CMD: setavoid <sector>
            // Mark sector as avoided in pathfinding

            int sectorNum;
            ConvertToNumber(parameters[0].Value, out sectorNum);

            if (activeDatabase != null && sectorNum > 0 && sectorNum <= activeDatabase.SectorCount)
            {
                _avoidedSectors.Add(sectorNum);
            }

            return CmdAction.None;
        }

        private static CmdAction CmdClearAvoid_Impl(object script, CmdParam[] parameters)
        {
            // CMD: clearavoid <sector>
            // Remove sector from avoid list

            int sectorNum;
            ConvertToNumber(parameters[0].Value, out sectorNum);
            _avoidedSectors.Remove(sectorNum);

            return CmdAction.None;
        }

        private static CmdAction CmdClearAllAvoids_Impl(object script, CmdParam[] parameters)
        {
            // CMD: clearallavoids
            // Clear all avoided sectors

            _avoidedSectors.Clear();
            return CmdAction.None;
        }

        private static CmdAction CmdListAvoids_Impl(object script, CmdParam[] parameters)
        {
            // CMD: listavoids var
            // List all avoided sectors

            if (parameters[0] is VarParam varParam)
            {
                var avoidList = _avoidedSectors.OrderBy(s => s).Select(s => s.ToString()).ToList();
                varParam.SetArrayFromStrings(avoidList);
                varParam.Value = avoidList.Count.ToString(CultureInfo.InvariantCulture);
            }

            return CmdAction.None;
        }

        #endregion

        #region Pathfinding Helper Methods

        private static List<int> CalculateGetCoursePath(ModDatabase activeDatabase, int fromSector, int toSector)
        {
            return activeDatabase.CalculateBidirectionalShortestPath(fromSector, toSector, _avoidedSectors);
        }

        #endregion

        #region Database Access Helper

        /// <summary>
        /// Set the active database instance for script commands
        /// This should be called when a database is opened
        /// </summary>
        public static void SetActiveDatabase(ModDatabase? database)
            => SetActiveDatabase(GlobalModules.CurrentContext, database);

        public static void SetActiveDatabase(TwxRuntimeContext? runtimeContext, ModDatabase? database)
        {
            TwxRuntimeContext context = runtimeContext ?? GlobalModules.CurrentContext;
            if (!ReferenceEquals(context.ActiveDatabase, database))
            {
                string reason = database == null
                    ? "active-database-cleared"
                    : $"active-database-set:{database.DatabaseName}";
                context.AutoRecorder.ResetState(reason);
                context.CurrentSector = 0;
            }

            context.ActiveDatabase = database;
            if (ReferenceEquals(context, GlobalModules.CurrentContext))
                GlobalModules.TWXDatabase = database;

            if (ReferenceEquals(context, GlobalModules.CurrentContext) &&
                GlobalModules.TWXLog is ModLog log)
                log.SetLogIdentity(database?.DatabaseName);
        }

        /// <summary>
        /// Set the current sector for navigation commands
        /// This should be called when game state changes or sector is detected
        /// </summary>
        public static void SetCurrentSector(int sectorNumber)
        {
            SetCurrentSector(GlobalModules.CurrentContext, sectorNumber);
        }

        public static void SetCurrentSector(TwxRuntimeContext? context, int sectorNumber)
        {
            (context ?? GlobalModules.CurrentContext).CurrentSector = sectorNumber;
        }

        /// <summary>
        /// Get the current sector
        /// </summary>
        public static int GetCurrentSector()
        {
            return GetCurrentSector(GlobalModules.CurrentContext);
        }

        public static int GetCurrentSector(TwxRuntimeContext? context)
        {
            TwxRuntimeContext resolvedContext = context ?? GlobalModules.CurrentContext;
            int extractorSector = resolvedContext.AutoRecorder.CurrentSector;
            if (extractorSector > 0)
                return extractorSector;

            return resolvedContext.CurrentSector;
        }

        /// <summary>
        /// Get the active database instance
        /// </summary>
        public static ModDatabase? GetActiveDatabase()
        {
            return ResolveActiveDatabase();
        }

        private static ModDatabase? ResolveActiveDatabase(object? script = null)
        {
            if (script is Script scriptObj)
                return scriptObj.Controller.RuntimeContext.ActiveDatabase;

            if (GetExecutingScript() is Script executingScript)
                return executingScript.Controller.RuntimeContext.ActiveDatabase;

            return GlobalModules.CurrentContext.ActiveDatabase;
        }

        #endregion
    }
}
