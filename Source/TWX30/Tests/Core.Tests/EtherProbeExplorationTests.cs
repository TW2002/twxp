using TWXProxy.Core;

static class EtherProbeExplorationTests
{
    public static void SuccessfulHeaders()
    {
        using var fixture = DatabaseFixture.Create(sectors: 20000);
        var recorder = new AutoRecorder();
        var scriptRef = new ScriptRef();
        var explored = scriptRef.GetSysConst(scriptRef.FindSysConst("SECTOR.EXPLORED"));

        // moon_base_s: empty sector 11561 has neither Ports nor Warps lines.
        recorder.RecordLine("Command [TL=00:00:00]:[4759] (?=Help)? : E");
        int number = 11561;
        foreach (ExploreType previous in Enum.GetValues<ExploreType>())
        {
            SectorData sector = fixture.Database.GetSector(number)!;
            sector.Explored = previous;
            sector.Warp[0] = 1360;
            fixture.Database.SaveSector(sector);

            recorder.RecordLine($"Probe entering sector : {number}");
            if (fixture.Database.GetSector(number)!.Explored != previous)
                throw new InvalidOperationException("Probe entry must not change exploration.");
            recorder.RecordLine("");
            recorder.RecordLine($"Sector  : {number} in uncharted space.");
            if (explored.Read([number.ToString()]) != "YES")
                throw new InvalidOperationException($"Sector {number} was not immediately explored from {previous}.");
            if (fixture.Database.GetSector(number)!.Warp[0] != 1360)
                throw new InvalidOperationException("A probe header must not clear known warps.");
            number++;
        }

        recorder.RecordLine("Probe Self Destructs");
        recorder.ProcessPrompt("Command [TL=00:00:00]:[4759] (?=Help)? : ");
        if (recorder.CurrentSector != 4759)
            throw new InvalidOperationException("The prompt must restore the player's sector after probing.");

        fixture.Database.SaveDatabase();
        using var reopened = new ModDatabase();
        reopened.OpenDatabase(fixture.DatabasePath);
        for (int sector = 11561; sector < number; sector++)
            if (reopened.GetSector(sector)!.Explored != ExploreType.Yes)
                throw new InvalidOperationException($"Sector {sector} exploration did not persist.");
    }

    public static void DestroyedProbe()
    {
        using var fixture = DatabaseFixture.Create(sectors: 20000);
        var recorder = new AutoRecorder();
        DateTime previousUpdate = new(2020, 1, 1);

        foreach (ExploreType previous in Enum.GetValues<ExploreType>())
        {
            SectorData destroyed = fixture.Database.GetSector(5320)!;
            destroyed.Explored = previous;
            destroyed.Update = previousUpdate;
            fixture.Database.SaveSector(destroyed);

            // Last two hops in the recorded moon_base_s probe to sector 11670.
            recorder.RecordLine("Probe entering sector : 1360");
            recorder.RecordLine("");
            recorder.RecordLine("Sector  : 1360 in uncharted space.");
            recorder.RecordLine("Ports   : Maya, Class 2 (BSB)");
            recorder.RecordLine("");
            recorder.RecordLine("Probe entering sector : 5320");
            recorder.RecordLine("Probe Destroyed!");
            recorder.ProcessPrompt("Command [TL=00:00:00]:[4759] (?=Help)? : ");

            if (fixture.Database.GetSector(1360)!.Explored != ExploreType.Yes)
                throw new InvalidOperationException("The last successful hop must remain explored.");
            destroyed = fixture.Database.GetSector(5320)!;
            if (destroyed.Explored != previous || destroyed.Update != previousUpdate)
                throw new InvalidOperationException($"Destroyed probe changed sector 5320 from {previous}.");
        }
    }
}
