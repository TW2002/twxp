using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Runtime.CompilerServices;
using Candidate = TWXProxy.Core.NativeHaggleEngine.Candidate;
using ServerProbeBranch = TWXProxy.Core.NativeHaggleEngine.ServerProbeBranch;
using SessionState = TWXProxy.Core.NativeHaggleEngine.SessionState;

#nullable disable

namespace TWXProxy.Core;

internal sealed class NativeHaggleAggressiveMode : NativeHaggleModeExtension
{
    private sealed class RouteState
    {
        public int GreatStreak { get; set; }

        public int Cooldown { get; set; }

        public int SuccessfulProbeCount { get; set; }

        public int FailedProbeCount { get; set; }

        public int FirstOfferExactHitFailures { get; set; }

        public int NearExcellentCount { get; set; }

        public int EarlyTowardOfferBias { get; set; }

        public int PlanetConsecutiveRejects { get; set; }

        public int PlanetConsecutiveSuccesses { get; set; }

        public int PlanetAdaptiveFinalSafetyBonus { get; set; }

        public int PlanetAdaptiveMidSafetyBonus { get; set; }

        public int PlanetRecoveryTradesRemaining { get; set; }
    }

    private readonly Dictionary<string, RouteState> _routeStates = new Dictionary<string, RouteState>(StringComparer.OrdinalIgnoreCase);

    public NativeHaggleAggressiveMode()
        : base(NativeHaggleModes.Aggressive, "Aggressive", true, true)
    {
    }

    public override long ComputeBid(NativeHaggleEngine engine, SessionState session, long offer)
    {
        return session.IsPlanetTrade ? ComputePlanetBid(engine, session, offer) : ComputePortBid(engine, session, offer);
    }

    private static void LogPort(string message)
    {
        GlobalModules.PortHaggleDebug(message);
    }

    private static void LogPlanet(string message)
    {
        GlobalModules.PlanetHaggleDebug(message);
    }

    private long ComputePortBid(NativeHaggleEngine engine, SessionState session, long offer)
    {
        string text = ReadFirstBidMode();
        long num = NativeHaggleEngine.ComputeServerDerivedBid(session, offer, text);
        if (session.Candidates.Count == 0)
        {
            return num;
        }
        if (!session.FinalOffer)
        {
            if (session.BidNumber == 0)
            {
                if (!string.IsNullOrWhiteSpace(session.RouteKey) && _routeStates.TryGetValue(session.RouteKey, out RouteState value) && value.Cooldown > 0)
                {
                    session.FirstOfferExactHitApplied = false;
                }
                else
                {
                    long num2 = default(long);
                    string value2 = default(string);
                    if (ReadFirstExactHitEnabled() && NativeHaggleEngine.TryGetFirstOfferExactHitBid(session, offer, out num2, out value2))
                    {
                        session.FirstOfferExactHitApplied = true;
                        string text2 = $"[NativeHaggle] Aggressive-port first-hit round=1 offer={offer} baseBid={num} bid={num2} reason={value2} candidates={session.Candidates.Count} sector={session.Sector} product={session.ProductKey} buysell={session.BuySell}\n";
                        GlobalModules.DebugLog(text2);
                        LogPort(text2);
                        return num2;
                    }
                    session.FirstOfferExactHitApplied = false;
                }
            }
            int num3 = 0;
            if (session.BidNumber == 0 && !string.IsNullOrWhiteSpace(session.RouteKey) && _routeStates.TryGetValue(session.RouteKey, out RouteState value3) && value3.Cooldown <= 0)
            {
                num3 = value3.EarlyTowardOfferBias;
            }
            int num4 = ((session.BidNumber == 0) ? ReadFirstSoften() : ReadMidSoften());
            long num5 = num;
            if (num4 > 0)
            {
                num5 = NativeHaggleEngine.MoveBidTowardOffer(session, offer, num5, num4);
            }
            if (num3 > 0)
            {
                num5 = NativeHaggleEngine.MoveBidTowardOffer(session, offer, num5, num3);
            }
            int num6 = ((session.BidNumber == 0) ? ReadFirstExactNudge() : ReadMidExactNudge());
            if (num6 > 0)
            {
                num5 = MoveBidTowardTargetExactRange(session, num5, num6);
            }
            num5 = NativeHaggleEngine.NormalizeBidForDirection(session, offer, num5);
            string text3 = $"[NativeHaggle] Aggressive-port early round={Math.Max(1, session.BidNumber + 1)} offer={offer} baseBid={num} soften={num4} routeBias={num3} exactNudge={num6} bid={num5} candidates={session.Candidates.Count} sector={session.Sector} product={session.ProductKey} buysell={session.BuySell}\n";
            GlobalModules.DebugLog(text3);
            LogPort(text3);
            return num5;
        }
        (double MinTotal, double MaxTotal, string Source) trackedTargetTotalRange = GetTrackedTargetTotalRange(session);
        double item = trackedTargetTotalRange.MinTotal;
        double item2 = trackedTargetTotalRange.MaxTotal;
        string item3 = trackedTargetTotalRange.Source;
        bool flag = string.Equals(session.BuySell, "SELLING", StringComparison.OrdinalIgnoreCase);
        double num7 = (flag ? item2 : item);
        long num8 = (flag ? ((long)Math.Ceiling(num7)) : ((long)Math.Floor(num7)));
        int num9 = ReadFinalNudge();
        if (!string.IsNullOrWhiteSpace(session.RouteKey) && _routeStates.TryGetValue(session.RouteKey, out RouteState value4) && value4.Cooldown > 0)
        {
            if (num9 > 0)
            {
                GlobalModules.DebugLog($"[NativeHaggle] Aggressive-port cooldown route={session.RouteKey} cooldown={value4.Cooldown} suppressedFinalNudge={num9}\n");
            }
            num9 = 0;
        }
        long num10 = NativeHaggleEngine.MoveBidTowardTarget(num, num8, num9, flag);
        num10 = NativeHaggleEngine.NormalizeBidForDirection(session, offer, num10);
        session.FinalTargetNudgeApplied = (int)(num10 - num);
        num10 = ApplyEmpiricalProbe(session, offer, num, num10);
        string value5 = DescribePredictedProbe(session, num);
        string value6 = DescribePredictedProbe(session, num10);
        string text4 = $"[NativeHaggle] Aggressive-port bid round={Math.Max(1, session.BidNumber + 1)} offer={offer} targetExact={num7:0.000000} exactRange={item:0.000000}..{item2:0.000000} exactSource={item3} baseBid={num} targetBid={num8} maxNudge={num9} bid={num10} baseProbe={value5} finalProbe={value6} candidates={session.Candidates.Count} sector={session.Sector} product={session.ProductKey} buysell={session.BuySell}\n";
        GlobalModules.DebugLog(text4);
        LogPort(text4);
        return num10;
    }

    private long ComputePlanetBid(NativeHaggleEngine engine, SessionState session, long offer)
    {
        RouteState routeState = (string.IsNullOrWhiteSpace(session.RouteKey) ? null : GetRouteState(session.RouteKey));
        if (!string.Equals(session.BuySell, "BUYING", StringComparison.OrdinalIgnoreCase))
        {
            long num = engine.ComputeCherokeePlanetBaselineBid(session, offer);
            string text = $"[NativeHaggle] Aggressive-planet unsupported-direction offer={offer} bid={num} buysell={session.BuySell} sector={session.Sector} product={session.ProductKey}\n";
            GlobalModules.DebugLog(text);
            LogPlanet(text);
            return num;
        }
        if (session.BidNumber == 0)
        {
            long num2 = engine.ComputeCherokeePlanetBaselineBid(session, offer);
            string text2 = $"[NativeHaggle] Aggressive-planet first round=1 offer={offer} bid={num2} baseline=cherokee-first configuredMcic={session.PlanetQualityMcic} multiple={session.PlanetQualityMultiple} ptrade={session.PlanetTradeSettingPercent} ptradeFactor={GetPlanetTradeSettingFactor(session):0.000} portMaxInit={session.PlanetPortMaxInit} sector={session.Sector} product={session.ProductKey}\n";
            GlobalModules.DebugLog(text2);
            LogPlanet(text2);
            return num2;
        }
        if (routeState != null && routeState.PlanetRecoveryTradesRemaining > 0)
        {
            long num3 = engine.ComputeCherokeePlanetBaselineBid(session, offer);
            string text3 = $"[NativeHaggle] Aggressive-planet recovery round={Math.Max(1, session.BidNumber + 1)} offer={offer} bid={num3} recoveryTradesRemaining={routeState.PlanetRecoveryTradesRemaining} routeFinalBonus={routeState.PlanetAdaptiveFinalSafetyBonus} routeMidBonus={routeState.PlanetAdaptiveMidSafetyBonus} sector={session.Sector} product={session.ProductKey}\n";
            GlobalModules.DebugLog(text3);
            LogPlanet(text3);
            return num3;
        }
        if (!ReadPlanetSolverEnabled() || !TryUpdatePlanetSolver(session, offer))
        {
            long num4 = engine.ComputeCherokeePlanetBaselineBid(session, offer);
            string text4 = $"[NativeHaggle] Aggressive-planet fallback round={Math.Max(1, session.BidNumber + 1)} offer={offer} bid={num4} final={session.FinalOffer} solverReady={session.PlanetSolvedFactor > 0.0} baseline=cherokee mcic={session.PlanetQualityMcic} multiple={session.PlanetQualityMultiple} midHaggles={session.PlanetMidHaggles} forceFail={session.PlanetForceFailApplied} sector={session.Sector} product={session.ProductKey}\n";
            GlobalModules.DebugLog(text4);
            LogPlanet(text4);
            return num4;
        }
        int num5 = Math.Max(1, session.BidNumber + 1);
        bool flag = TryGetPlanetRoundThresholdRange(session, num5, out double num6, out double num7);
        long num9;
        string value;
        if (session.FinalOffer)
        {
            int num8 = routeState?.PlanetAdaptiveFinalSafetyBonus ?? 0;
            int num10 = ReadPlanetFinalSafety(session.ProductKey) + num8;
            long num11 = Math.Max(offer + 1, (long)Math.Floor(session.PlanetSolvedHiddenMin) - num10);
            if (session.LastCounter > offer)
            {
                num11 = Math.Min(num11, session.LastCounter);
            }
            num9 = NativeHaggleEngine.NormalizeBidForDirection(session, offer, num11);
            value = $"solver-final(finalSafety={num10},routeBonus={num8},ptrade={session.PlanetTradeSettingPercent})";
        }
        else
        {
            int num12 = routeState?.PlanetAdaptiveMidSafetyBonus ?? 0;
            int num13 = GetPlanetConfidenceAggression(session, routeState);
            int num14 = Math.Max(0, ReadPlanetMidSafety() + num12 - num13);
            double d = flag ? num6 : session.PlanetSolvedHiddenMin * (1.0 - (double)session.PlanetSolvedMcic / 250.0 / (double)num5);
            long val = (long)Math.Floor(d) - num14;
            val = Math.Max(offer + 1, val);
            if (session.LastCounter > offer + 1)
            {
                val = Math.Min(val, session.LastCounter - 1);
            }
            num9 = NativeHaggleEngine.NormalizeBidForDirection(session, offer, val);
            value = $"solver-mid(midSafety={num14},routeBonus={num12},aggression={num13},ptrade={session.PlanetTradeSettingPercent})";
        }
        string text5 = $"[NativeHaggle] Aggressive-planet {value} round={num5} offer={offer} bid={num9} final={session.FinalOffer} factor={session.PlanetSolvedFactor:0.000000} mcic={session.PlanetSolvedMcic} configuredMcic={session.PlanetQualityMcic} ptrade={session.PlanetTradeSettingPercent} ptradeFactor={GetPlanetTradeSettingFactor(session):0.000} hiddenRange={session.PlanetSolvedHiddenMin:0.000000}..{session.PlanetSolvedHiddenMax:0.000000} thresholdRange={(flag ? $"{num6:0.000000}..{num7:0.000000}" : "n/a")} lastOffer={session.LastOffer} lastCounter={session.LastCounter} sector={session.Sector} product={session.ProductKey}\n";
        GlobalModules.DebugLog(text5);
        LogPlanet(text5);
        return num9;
    }

    public override void OnOutcome(NativeHaggleEngine engine, SessionState session, bool success, string reason)
    {
        if (session.IsPlanetTrade)
        {
            RouteState routeState = (string.IsNullOrWhiteSpace(session.RouteKey) ? null : GetRouteState(session.RouteKey));
            if (routeState != null)
            {
                if (success)
                {
                    routeState.PlanetConsecutiveRejects = 0;
                    routeState.PlanetConsecutiveSuccesses++;
                    routeState.PlanetRecoveryTradesRemaining = 0;
                    if (routeState.PlanetConsecutiveSuccesses >= 3)
                    {
                        routeState.PlanetConsecutiveSuccesses = 0;
                        if (routeState.PlanetAdaptiveFinalSafetyBonus > 0)
                        {
                            routeState.PlanetAdaptiveFinalSafetyBonus--;
                        }
                        if (routeState.PlanetAdaptiveMidSafetyBonus > 0)
                        {
                            routeState.PlanetAdaptiveMidSafetyBonus--;
                        }
                    }
                }
                else if (string.Equals(reason, "credits-no-transaction", StringComparison.OrdinalIgnoreCase))
                {
                    routeState.PlanetConsecutiveRejects++;
                    routeState.PlanetConsecutiveSuccesses = 0;
                    int num = ((!string.Equals(session.ProductKey, "EQUIPMENT", StringComparison.OrdinalIgnoreCase)) ? 1 : 2);
                    int num2 = ((!string.Equals(session.ProductKey, "EQUIPMENT", StringComparison.OrdinalIgnoreCase)) ? 1 : 2);
                    routeState.PlanetAdaptiveFinalSafetyBonus = Math.Min(12, routeState.PlanetAdaptiveFinalSafetyBonus + num);
                    routeState.PlanetAdaptiveMidSafetyBonus = Math.Min(8, routeState.PlanetAdaptiveMidSafetyBonus + num2);
                    if (routeState.PlanetConsecutiveRejects >= 2 || string.Equals(session.ProductKey, "EQUIPMENT", StringComparison.OrdinalIgnoreCase))
                    {
                        routeState.PlanetRecoveryTradesRemaining = Math.Max(routeState.PlanetRecoveryTradesRemaining, 1);
                    }
                }
            }
            string text = $"[NativeHaggle] Aggressive-planet outcome success={success} reason='{reason}' factor={((session.PlanetSolvedFactor > 0.0) ? session.PlanetSolvedFactor.ToString("0.000000", CultureInfo.InvariantCulture) : "n/a")} mcic={((session.PlanetSolvedFactor > 0.0) ? session.PlanetSolvedMcic.ToString(CultureInfo.InvariantCulture) : "n/a")} configuredMcic={session.PlanetQualityMcic} ptrade={session.PlanetTradeSettingPercent} hiddenRange={((session.PlanetSolvedFactor > 0.0) ? $"{session.PlanetSolvedHiddenMin:0.000000}..{session.PlanetSolvedHiddenMax:0.000000}" : "n/a")} sector={session.Sector} product={session.ProductKey} buysell={session.BuySell} routeBonusFinal={routeState?.PlanetAdaptiveFinalSafetyBonus ?? 0} routeBonusMid={routeState?.PlanetAdaptiveMidSafetyBonus ?? 0} rejectStreak={routeState?.PlanetConsecutiveRejects ?? 0} recovery={routeState?.PlanetRecoveryTradesRemaining ?? 0}\n";
            GlobalModules.DebugLog(text);
            LogPlanet(text);
        }
        else
        {
            if (string.IsNullOrWhiteSpace(session.RouteKey))
            {
                return;
            }
            RouteState routeState2 = GetRouteState(session.RouteKey);
            double serverProbeMin = 0.0;
            double serverProbeMax = 0.0;
            int serverBucketMin = 0;
            int serverBucketMax = 0;
            bool flag = session.LastCounter > 0 && TryGetServerProbeRange(session, session.LastCounter, out serverProbeMin, out serverProbeMax, out serverBucketMin, out serverBucketMax);
            if (success)
            {
                if (routeState2.Cooldown > 0)
                {
                    routeState2.Cooldown--;
                }
                if (session.EmpiricalProbeApplied)
                {
                    if (string.Equals(session.RewardTier, "great", StringComparison.OrdinalIgnoreCase) || string.Equals(session.RewardTier, "excellent", StringComparison.OrdinalIgnoreCase))
                    {
                        routeState2.SuccessfulProbeCount++;
                    }
                    routeState2.GreatStreak = 0;
                    routeState2.NearExcellentCount = 0;
                    return;
                }
                if (string.Equals(session.RewardTier, "excellent", StringComparison.OrdinalIgnoreCase))
                {
                    routeState2.GreatStreak = 0;
                    routeState2.NearExcellentCount = 0;
                    string text2 = $"[NativeHaggle] Aggressive-port route update route={session.RouteKey} success={success} reason='{reason}' rewardTier='{session.RewardTier}' probeModel=ratio serverProbe={(flag ? serverProbeMax.ToString("0.00", CultureInfo.InvariantCulture) : "n/a")} serverBucket={(flag ? serverBucketMax.ToString(CultureInfo.InvariantCulture) : "n/a")} greatStreak={routeState2.GreatStreak} nearExcellent={routeState2.NearExcellentCount} bias={routeState2.EarlyTowardOfferBias} cooldown={routeState2.Cooldown} probeWins={routeState2.SuccessfulProbeCount} probeFails={routeState2.FailedProbeCount}\n";
                    GlobalModules.DebugLog(text2);
                    LogPort(text2);
                    return;
                }
                if (string.Equals(session.RewardTier, "great", StringComparison.OrdinalIgnoreCase))
                {
                    routeState2.GreatStreak++;
                    routeState2.NearExcellentCount = 0;
                    if (routeState2.Cooldown <= 0)
                    {
                        routeState2.EarlyTowardOfferBias = 0;
                    }
                }
                else
                {
                    routeState2.GreatStreak = 0;
                    routeState2.NearExcellentCount = 0;
                    if (routeState2.Cooldown <= 0)
                    {
                        routeState2.EarlyTowardOfferBias = 0;
                    }
                }
                string text3 = $"[NativeHaggle] Aggressive-port route update route={session.RouteKey} success={success} reason='{reason}' rewardTier='{session.RewardTier}' probeModel=ratio serverProbe={(flag ? serverProbeMax.ToString("0.00", CultureInfo.InvariantCulture) : "n/a")} serverBucket={(flag ? serverBucketMax.ToString(CultureInfo.InvariantCulture) : "n/a")} greatStreak={routeState2.GreatStreak} nearExcellent={routeState2.NearExcellentCount} bias={routeState2.EarlyTowardOfferBias} cooldown={routeState2.Cooldown} probeWins={routeState2.SuccessfulProbeCount} probeFails={routeState2.FailedProbeCount}\n";
                GlobalModules.DebugLog(text3);
                LogPort(text3);
            }
            else
            {
                if (session.EmpiricalProbeApplied)
                {
                    routeState2.FailedProbeCount++;
                    routeState2.Cooldown = 20;
                }
                if (session.FirstOfferExactHitApplied && IsSafetyBackoffReason(reason))
                {
                    routeState2.FailedProbeCount++;
                    routeState2.FirstOfferExactHitFailures++;
                    routeState2.Cooldown = Math.Max(routeState2.Cooldown, 20);
                    string text4 = $"[NativeHaggle] Aggressive-port first-hit backoff route={session.RouteKey} reason='{reason}' cooldown={routeState2.Cooldown} probeFails={routeState2.FailedProbeCount} firstHitFails={routeState2.FirstOfferExactHitFailures}\n";
                    GlobalModules.DebugLog(text4);
                    LogPort(text4);
                }
                if (!session.EmpiricalProbeApplied && session.FinalTargetNudgeApplied != 0 && IsSafetyBackoffReason(reason))
                {
                    routeState2.FailedProbeCount++;
                    routeState2.Cooldown = Math.Max(routeState2.Cooldown, 20);
                    string text5 = $"[NativeHaggle] Aggressive-port backoff route={session.RouteKey} finalNudge={session.FinalTargetNudgeApplied} reason='{reason}' cooldown={routeState2.Cooldown} probeFails={routeState2.FailedProbeCount}\n";
                    GlobalModules.DebugLog(text5);
                    LogPort(text5);
                }
                if (routeState2.EarlyTowardOfferBias > 0 && IsSafetyBackoffReason(reason))
                {
                    routeState2.Cooldown = Math.Max(routeState2.Cooldown, 12);
                    routeState2.EarlyTowardOfferBias = 0;
                    routeState2.NearExcellentCount = 0;
                }
                routeState2.GreatStreak = 0;
                string text6 = $"[NativeHaggle] Aggressive-port route update route={session.RouteKey} success={success} reason='{reason}' probeModel=ratio serverProbe={(flag ? serverProbeMax.ToString("0.00", CultureInfo.InvariantCulture) : "n/a")} serverBucket={(flag ? serverBucketMax.ToString(CultureInfo.InvariantCulture) : "n/a")} greatStreak={routeState2.GreatStreak} nearExcellent={routeState2.NearExcellentCount} bias={routeState2.EarlyTowardOfferBias} cooldown={routeState2.Cooldown} probeWins={routeState2.SuccessfulProbeCount} probeFails={routeState2.FailedProbeCount}\n";
                GlobalModules.DebugLog(text6);
                LogPort(text6);
            }
        }
    }

    public override string DescribeState(NativeHaggleEngine engine, SessionState session)
    {
        IFormatProvider invariantCulture;
        if (session.IsPlanetTrade)
        {
            if (session.PlanetSolvedFactor <= 0.0)
            {
                if (!string.IsNullOrWhiteSpace(session.RouteKey) && _routeStates.TryGetValue(session.RouteKey, out RouteState value))
                {
                    invariantCulture = CultureInfo.InvariantCulture;
                    IFormatProvider provider = invariantCulture;
                    DefaultInterpolatedStringHandler handler = new DefaultInterpolatedStringHandler(84, 4, invariantCulture);
                    handler.AppendLiteral("aggressivePlanet(solver=pending,routeFinalBonus=");
                    handler.AppendFormatted(value.PlanetAdaptiveFinalSafetyBonus);
                    handler.AppendLiteral(",routeMidBonus=");
                    handler.AppendFormatted(value.PlanetAdaptiveMidSafetyBonus);
                    handler.AppendLiteral(",rejectStreak=");
                    handler.AppendFormatted(value.PlanetConsecutiveRejects);
                    handler.AppendLiteral(",recovery=");
                    handler.AppendFormatted(value.PlanetRecoveryTradesRemaining);
                    handler.AppendLiteral(")");
                    return string.Create(provider, ref handler);
                }
                return "aggressivePlanet(solver=pending)";
            }
            if (!string.IsNullOrWhiteSpace(session.RouteKey) && _routeStates.TryGetValue(session.RouteKey, out RouteState value2))
            {
                invariantCulture = CultureInfo.InvariantCulture;
                IFormatProvider provider2 = invariantCulture;
                DefaultInterpolatedStringHandler handler2 = new DefaultInterpolatedStringHandler(136, 10, invariantCulture);
                handler2.AppendLiteral("aggressivePlanet(solver=ready,factor=");
                handler2.AppendFormatted(session.PlanetSolvedFactor, "0.000000");
                handler2.AppendLiteral(",mcic=");
                handler2.AppendFormatted(session.PlanetSolvedMcic);
                handler2.AppendLiteral(",configuredMcic=");
                handler2.AppendFormatted(session.PlanetQualityMcic);
                handler2.AppendLiteral(",ptrade=");
                handler2.AppendFormatted(session.PlanetTradeSettingPercent);
                handler2.AppendLiteral(",hidden=");
                handler2.AppendFormatted(session.PlanetSolvedHiddenMin, "0.000000");
                handler2.AppendLiteral("..");
                handler2.AppendFormatted(session.PlanetSolvedHiddenMax, "0.000000");
                handler2.AppendLiteral(",routeFinalBonus=");
                handler2.AppendFormatted(value2.PlanetAdaptiveFinalSafetyBonus);
                handler2.AppendLiteral(",routeMidBonus=");
                handler2.AppendFormatted(value2.PlanetAdaptiveMidSafetyBonus);
                handler2.AppendLiteral(",rejectStreak=");
                handler2.AppendFormatted(value2.PlanetConsecutiveRejects);
                handler2.AppendLiteral(",recovery=");
                handler2.AppendFormatted(value2.PlanetRecoveryTradesRemaining);
                handler2.AppendLiteral(")");
                return string.Create(provider2, ref handler2);
            }
            invariantCulture = CultureInfo.InvariantCulture;
            IFormatProvider provider3 = invariantCulture;
            DefaultInterpolatedStringHandler handler3 = new DefaultInterpolatedStringHandler(82, 6, invariantCulture);
            handler3.AppendLiteral("aggressivePlanet(solver=ready,factor=");
            handler3.AppendFormatted(session.PlanetSolvedFactor, "0.000000");
            handler3.AppendLiteral(",mcic=");
            handler3.AppendFormatted(session.PlanetSolvedMcic);
            handler3.AppendLiteral(",configuredMcic=");
            handler3.AppendFormatted(session.PlanetQualityMcic);
            handler3.AppendLiteral(",ptrade=");
            handler3.AppendFormatted(session.PlanetTradeSettingPercent);
            handler3.AppendLiteral(",hidden=");
            handler3.AppendFormatted(session.PlanetSolvedHiddenMin, "0.000000");
            handler3.AppendLiteral("..");
            handler3.AppendFormatted(session.PlanetSolvedHiddenMax, "0.000000");
            handler3.AppendLiteral(")");
            return string.Create(provider3, ref handler3);
        }
        if (string.IsNullOrWhiteSpace(session.RouteKey) || !_routeStates.TryGetValue(session.RouteKey, out RouteState value3))
        {
            return "aggressivePortRoute=n/a";
        }
        invariantCulture = CultureInfo.InvariantCulture;
        IFormatProvider provider4 = invariantCulture;
        DefaultInterpolatedStringHandler handler4 = new DefaultInterpolatedStringHandler(98, 7, invariantCulture);
        handler4.AppendLiteral("aggressivePortRoute(greatStreak=");
        handler4.AppendFormatted(value3.GreatStreak);
        handler4.AppendLiteral(",nearExcellent=");
        handler4.AppendFormatted(value3.NearExcellentCount);
        handler4.AppendLiteral(",bias=");
        handler4.AppendFormatted(value3.EarlyTowardOfferBias);
        handler4.AppendLiteral(",cooldown=");
        handler4.AppendFormatted(value3.Cooldown);
        handler4.AppendLiteral(",probeWins=");
        handler4.AppendFormatted(value3.SuccessfulProbeCount);
        handler4.AppendLiteral(",probeFails=");
        handler4.AppendFormatted(value3.FailedProbeCount);
        handler4.AppendLiteral(",firstHitFails=");
        handler4.AppendFormatted(value3.FirstOfferExactHitFailures);
        handler4.AppendLiteral(")");
        return string.Create(provider4, ref handler4);
    }

    private RouteState GetRouteState(string routeKey)
    {
        if (!_routeStates.TryGetValue(routeKey, out RouteState value))
        {
            value = new RouteState();
            _routeStates[routeKey] = value;
        }
        return value;
    }

    private static bool IsSafetyBackoffReason(string reason)
    {
        return string.Equals(reason, "credits-no-transaction", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(reason, "trade-rejected", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryUpdatePlanetSolver(SessionState session, long offer)
    {
        if (TrySolveObservedPlanetFactor(session, offer, out double num, out int num2))
        {
            int num3 = ResolveEffectivePlanetMcic(session, num2);
            session.PlanetSolvedMcic = num3;
            session.PlanetSolvedFactor = 1.0 + (double)num3 / 1000.0;
        }
        else if (session.PlanetSolvedFactor <= 0.0)
        {
            return false;
        }
        if (session.PlanetSolvedFactor <= 1E-07)
        {
            return false;
        }
        double num4 = Math.Max(0.0, (double)offer - 0.5);
        double num5 = (double)offer + 0.499999;
        session.PlanetSolvedHiddenMin = num4 / session.PlanetSolvedFactor;
        session.PlanetSolvedHiddenMax = num5 / session.PlanetSolvedFactor;
        return session.PlanetSolvedHiddenMin > 0.0 && session.PlanetSolvedHiddenMax >= session.PlanetSolvedHiddenMin;
    }

    private static bool TrySolveObservedPlanetFactor(SessionState session, long offer, out double observedFactor, out int observedMcic)
    {
        observedFactor = 0.0;
        observedMcic = 0;
        if (session.BidNumber <= 0 || session.LastOffer <= 0 || session.LastCounter <= 0)
        {
            return false;
        }
        double num = 0.3 * (double)session.LastCounter;
        if (Math.Abs(num) < 1E-07)
        {
            return false;
        }
        double num2 = ((double)offer - 0.7 * (double)session.LastOffer) / num;
        if (num2 <= 0.5 || num2 >= 1.5)
        {
            return false;
        }
        observedFactor = num2;
        observedMcic = (int)NativeHaggleEngine.PascalRoundInt((num2 - 1.0) * 1000.0, 0);
        return true;
    }

    private static int ResolveEffectivePlanetMcic(SessionState session, int observedMcic)
    {
        int num = session.PlanetQualityMcic;
        if (num == 0)
        {
            return observedMcic;
        }
        int num2 = GetPlanetMcicTolerance(session.ProductKey);
        int num3 = observedMcic - num;
        if (Math.Abs(num3) <= num2)
        {
            return num;
        }
        if (Math.Abs(num3) <= num2 + 6)
        {
            return (int)NativeHaggleEngine.PascalRoundInt(((double)observedMcic * 2.0 + (double)num) / 3.0, 0);
        }
        return observedMcic;
    }

    private static int GetPlanetMcicTolerance(string productKey)
    {
        if (string.Equals(productKey, "EQUIPMENT", StringComparison.OrdinalIgnoreCase))
        {
            return 2;
        }
        if (string.Equals(productKey, "ORGANICS", StringComparison.OrdinalIgnoreCase))
        {
            return 3;
        }
        return 4;
    }

    private static double GetPlanetTradeSettingFactor(SessionState session)
    {
        return Math.Max(0.01, (double)session.PlanetTradeSettingPercent / 100.0);
    }

    private static bool TryGetPlanetRoundThresholdRange(SessionState session, int roundNumber, out double minThreshold, out double maxThreshold)
    {
        minThreshold = 0.0;
        maxThreshold = 0.0;
        if (session.PlanetSolvedFactor <= 1E-07 || roundNumber <= 0)
        {
            return false;
        }
        double num = 1.0 - (double)session.PlanetSolvedMcic / 250.0 / (double)roundNumber;
        if (num <= 1E-07)
        {
            return false;
        }
        minThreshold = session.PlanetSolvedHiddenMin * num;
        maxThreshold = session.PlanetSolvedHiddenMax * num;
        return minThreshold > 0.0 && maxThreshold >= minThreshold;
    }

    private static int GetPlanetConfidenceAggression(SessionState session, RouteState routeState)
    {
        if (routeState == null || routeState.PlanetConsecutiveRejects > 0 || routeState.PlanetAdaptiveMidSafetyBonus > 0)
        {
            return 0;
        }
        int num = 0;
        if (routeState.PlanetConsecutiveSuccesses >= 3)
        {
            num++;
        }
        if (routeState.PlanetConsecutiveSuccesses >= 8 && !string.Equals(session.ProductKey, "FUEL", StringComparison.OrdinalIgnoreCase))
        {
            num++;
        }
        if (session.PlanetTradeSettingPercent < 95)
        {
            num = Math.Max(0, num - 1);
        }
        return Math.Min(num, 2);
    }

    private long ApplyEmpiricalProbe(SessionState session, long offer, long baseBid, long currentBid)
    {
        session.EmpiricalProbeApplied = false;
        session.EmpiricalProbeNudge = 0;
        if (!ReadEmpiricalProbeEnabled() || !session.FinalOffer || string.IsNullOrWhiteSpace(session.RouteKey))
        {
            return currentBid;
        }
        RouteState routeState = GetRouteState(session.RouteKey);
        if (routeState.Cooldown > 0 || routeState.GreatStreak < 8)
        {
            return currentBid;
        }
        long item = NativeHaggleEngine.ComputeServerThresholdBid(session).Item2;
        bool flag = string.Equals(session.BuySell, "SELLING", StringComparison.OrdinalIgnoreCase);
        long num = (flag ? (currentBid + 1) : (currentBid - 1));
        if (flag)
        {
            if (num > item)
            {
                return currentBid;
            }
        }
        else if (num < item)
        {
            return currentBid;
        }
        num = NativeHaggleEngine.NormalizeBidForDirection(session, offer, num);
        if (num == currentBid)
        {
            return currentBid;
        }
        session.EmpiricalProbeApplied = true;
        session.EmpiricalProbeNudge = (int)(num - baseBid);
        GlobalModules.DebugLog($"[NativeHaggle] Aggressive-port empirical probe route={session.RouteKey} greatStreak={routeState.GreatStreak} cooldown={routeState.Cooldown} baseBid={baseBid} currentBid={currentBid} thresholdBid={item} probeBid={num} nudge={session.EmpiricalProbeNudge}\n");
        return num;
    }

    private static long MoveBidTowardTargetExactRange(SessionState session, long baseBid, int nudge)
    {
        if (nudge <= 0)
        {
            return baseBid;
        }
        if (!TryGetTargetExactRange(session, out double minExact, out double maxExact, out string _))
        {
            return baseBid;
        }
        long num = (long)Math.Ceiling(minExact);
        long num2 = (long)Math.Floor(maxExact);
        long num3 = baseBid;
        if (baseBid < num)
        {
            num3 = num;
        }
        else if (baseBid > num2)
        {
            num3 = num2;
        }
        if (num3 == baseBid)
        {
            return baseBid;
        }
        bool flag = string.Equals(session.BuySell, "SELLING", StringComparison.OrdinalIgnoreCase);
        return NativeHaggleEngine.MoveBidTowardTarget(baseBid, num3, nudge, flag);
    }

    private static (double MinTotal, double MaxTotal, string Source) GetTrackedTargetTotalRange(SessionState session)
    {
        double minExact;
        double maxExact;
        string source;
        return TryGetTargetExactRange(session, out minExact, out maxExact, out source) ? (MinTotal: minExact, MaxTotal: maxExact, Source: source) : (MinTotal: 0.0, MaxTotal: 0.0, Source: "n/a");
    }

    private static bool TryGetTargetExactRange(SessionState session, out double minExact, out double maxExact, out string source)
    {
        if (TryGetExperimentalExactRange(session, out minExact, out maxExact, out source))
        {
            return true;
        }
        return NativeHaggleEngine.TryGetTargetExactRange(session, out minExact, out maxExact, out source);
    }

    private static bool TryGetExperimentalExactRange(SessionState session, out double minExact, out double maxExact, out string source)
    {
        minExact = 0.0;
        maxExact = 0.0;
        source = string.Empty;
        if (session.Candidates.Count == 0 || !ReadPortApproxEnabled())
        {
            return false;
        }
        int num = ReadPortApproxProductionRate();
        int num2 = ReadPortApproxMaxRegen();
        int num3 = ReadPortApproxBiasHours();
        if (num <= 0 || num2 <= 0)
        {
            return false;
        }
        double num4 = session.PortReportAgeDays + (double)num3 / 24.0;
        if (num4 <= 1E-07)
        {
            return false;
        }
        double num5 = (double)num2 / (double)num;
        if (num5 <= 1E-07)
        {
            return false;
        }
        double num6 = Math.Min(num4, num5);
        int num7 = Math.Max(session.PortQty, session.PortMaxQty);
        if (num7 <= session.PortQty)
        {
            return false;
        }
        bool flag = false;
        int num8 = int.MaxValue;
        int num9 = int.MinValue;
        foreach (Candidate candidate in session.Candidates)
        {
            if (candidate.Productivity > 0)
            {
                int val = (int)NativeHaggleEngine.PascalRoundInt((double)candidate.Productivity * num6 * (double)num / 10.0, 0);
                int num10 = Math.Min(num7, session.PortQty + Math.Max(0, val));
                double num11 = NativeHaggleEngine.ComputeCandidateExactPrice(session, candidate, num10);
                if (!flag || num11 < minExact)
                {
                    minExact = num11;
                }
                if (!flag || num11 > maxExact)
                {
                    maxExact = num11;
                }
                flag = true;
                if (num10 < num8)
                {
                    num8 = num10;
                }
                if (num10 > num9)
                {
                    num9 = num10;
                }
            }
        }
        if (!flag || minExact <= 0.0 || maxExact <= 0.0 || minExact > maxExact)
        {
            minExact = 0.0;
            maxExact = 0.0;
            return false;
        }
        IFormatProvider invariantCulture = CultureInfo.InvariantCulture;
        DefaultInterpolatedStringHandler handler = new DefaultInterpolatedStringHandler(88, 9, invariantCulture);
        handler.AppendLiteral("report-age-approx(ageHours=");
        handler.AppendFormatted(session.PortReportAgeDays * 24.0, "0.00");
        handler.AppendLiteral(",biasHours=");
        handler.AppendFormatted(num3);
        handler.AppendLiteral(",cappedDays=");
        handler.AppendFormatted(num6, "0.000");
        handler.AppendLiteral(",prodRate=");
        handler.AppendFormatted(num);
        handler.AppendLiteral(",maxRegen=");
        handler.AppendFormatted(num2);
        handler.AppendLiteral(",qty=");
        handler.AppendFormatted(session.PortQty);
        handler.AppendLiteral("->");
        handler.AppendFormatted(num8);
        handler.AppendLiteral("..");
        handler.AppendFormatted(num9);
        handler.AppendLiteral(",maxQty=");
        handler.AppendFormatted(num7);
        handler.AppendLiteral(")");
        source = string.Create(invariantCulture, ref handler);
        return true;
    }

    private static bool TryGetServerProbeRange(SessionState session, long bid, out double serverProbeMin, out double serverProbeMax, out int serverBucketMin, out int serverBucketMax)
    {
        //IL_0046: Unknown result type (might be due to invalid IL or missing references)
        //IL_004b: Unknown result type (might be due to invalid IL or missing references)
        //IL_00bf: Unknown result type (might be due to invalid IL or missing references)
        //IL_00c1: Invalid comparison between Unknown and I4
        //IL_0101: Unknown result type (might be due to invalid IL or missing references)
        //IL_0103: Invalid comparison between Unknown and I4
        serverProbeMin = 0.0;
        serverProbeMax = 0.0;
        serverBucketMin = 0;
        serverBucketMax = 0;
        if (bid <= 0 || !TryGetTargetExactRange(session, out double minExact, out double maxExact, out string _))
        {
            return false;
        }
        ServerProbeBranch serverProbeBranch = NativeHaggleEngine.GetServerProbeBranch(session, bid);
        long num = Math.Max(0L, (long)Math.Truncate(minExact * 10000.0 / (double)bid));
        long num2 = Math.Max(0L, (long)Math.Truncate(maxExact * 10000.0 / (double)bid));
        long num3 = Math.Max(0L, (long)Math.Truncate((double)bid * 10000.0 / maxExact));
        long num4 = Math.Max(0L, (long)Math.Truncate((double)bid * 10000.0 / minExact));
        if ((int)serverProbeBranch == 1)
        {
            serverProbeMin = (double)num3 / 100.0;
            serverProbeMax = (double)num4 / 100.0;
            serverBucketMin = (int)(num3 / 100);
            serverBucketMax = (int)(num4 / 100);
            return true;
        }
        if ((int)serverProbeBranch == 0)
        {
            serverProbeMin = (double)num / 100.0;
            serverProbeMax = (double)num2 / 100.0;
            serverBucketMin = (int)(num / 100);
            serverBucketMax = (int)(num2 / 100);
            return true;
        }
        return false;
    }

    private static string DescribePredictedProbe(SessionState session, long bid)
    {
        //IL_00a1: Unknown result type (might be due to invalid IL or missing references)
        //IL_00a6: Unknown result type (might be due to invalid IL or missing references)
        //IL_00ac: Unknown result type (might be due to invalid IL or missing references)
        //IL_00b2: Unknown result type (might be due to invalid IL or missing references)
        //IL_00b5: Invalid comparison between Unknown and I4
        //IL_02d6: Unknown result type (might be due to invalid IL or missing references)
        if (bid <= 0 || !TryGetTargetExactRange(session, out double minExact, out double maxExact, out string source))
        {
            return NativeHaggleEngine.DescribePredictedProbe(session, bid);
        }
        long num = Math.Max(0L, (long)Math.Truncate(minExact * 10000.0 / (double)bid));
        long num2 = Math.Max(0L, (long)Math.Truncate(maxExact * 10000.0 / (double)bid));
        long num3 = Math.Max(0L, (long)Math.Truncate((double)bid * 10000.0 / maxExact));
        long num4 = Math.Max(0L, (long)Math.Truncate((double)bid * 10000.0 / minExact));
        ServerProbeBranch serverProbeBranch = NativeHaggleEngine.GetServerProbeBranch(session, bid);
        if (1 == 0)
        {
        }
        (double, double, long, long) tuple = (((int)serverProbeBranch == 0) ? ((double)num / 100.0, (double)num2 / 100.0, num / 100, num2 / 100) : (((int)serverProbeBranch != 1) ? (Math.Min((double)num / 100.0, (double)num3 / 100.0), Math.Max((double)num2 / 100.0, (double)num4 / 100.0), Math.Min(num / 100, num3 / 100), Math.Max(num2 / 100, num4 / 100)) : ((double)num3 / 100.0, (double)num4 / 100.0, num3 / 100, num4 / 100)));
        if (1 == 0)
        {
        }
        (double, double, long, long) tuple2 = tuple;
        double item = tuple2.Item1;
        double item2 = tuple2.Item2;
        long item3 = tuple2.Item3;
        long item4 = tuple2.Item4;
        IFormatProvider invariantCulture = CultureInfo.InvariantCulture;
        DefaultInterpolatedStringHandler handler = new DefaultInterpolatedStringHandler(120, 14, invariantCulture);
        handler.AppendLiteral("probeModel=ratio exact/bid=");
        handler.AppendFormatted((double)num / 100.0, "0.00");
        handler.AppendLiteral("..");
        handler.AppendFormatted((double)num2 / 100.0, "0.00");
        handler.AppendLiteral(" bucket=");
        handler.AppendFormatted(num / 100);
        handler.AppendLiteral("..");
        handler.AppendFormatted(num2 / 100);
        handler.AppendLiteral(" bid/exact=");
        handler.AppendFormatted((double)num3 / 100.0, "0.00");
        handler.AppendLiteral("..");
        handler.AppendFormatted((double)num4 / 100.0, "0.00");
        handler.AppendLiteral(" bucket=");
        handler.AppendFormatted(num3 / 100);
        handler.AppendLiteral("..");
        handler.AppendFormatted(num4 / 100);
        handler.AppendLiteral(" serverBranch=");
        handler.AppendFormatted(NativeHaggleEngine.DescribeServerProbeBranch(serverProbeBranch));
        handler.AppendLiteral(" serverProbe=");
        handler.AppendFormatted(item, "0.00");
        handler.AppendLiteral("..");
        handler.AppendFormatted(item2, "0.00");
        handler.AppendLiteral(" serverBucket=");
        handler.AppendFormatted(item3);
        handler.AppendLiteral("..");
        handler.AppendFormatted(item4);
        handler.AppendLiteral(" exactSource=");
        handler.AppendFormatted(source);
        return string.Create(invariantCulture, ref handler);
    }

    private static string ReadFirstBidMode()
    {
        string text = Environment.GetEnvironmentVariable("TWX_HAGGLE_AGGRESSIVE_FIRST_MODE");
        if (string.IsNullOrWhiteSpace(text))
        {
            try
            {
                if (File.Exists("/tmp/twx_haggle_aggressive_first_mode.txt"))
                {
                    text = File.ReadAllText("/tmp/twx_haggle_aggressive_first_mode.txt").Trim();
                }
            }
            catch
            {
                text = null;
            }
        }
        if (string.IsNullOrWhiteSpace(text))
        {
            return "clamp-heuristic";
        }
        if (string.Equals(text, "exact", StringComparison.OrdinalIgnoreCase))
        {
            return "baseline";
        }
        if (string.Equals(text, "server", StringComparison.OrdinalIgnoreCase))
        {
            return "clamp-heuristic";
        }
        string text2 = NativeHaggleModes.Normalize(text);
        return (text2 == NativeHaggleModes.ServerDerived || text2 == NativeHaggleModes.Aggressive || text2 == NativeHaggleModes.ExcellentTarget) ? "clamp-heuristic" : text2;
    }

    private static bool ReadEmpiricalProbeEnabled()
    {
        return ReadFlag("TWX_HAGGLE_AGGRESSIVE_EMPIRICAL", "/tmp/twx_haggle_aggressive_empirical.txt", defaultValue: false);
    }

    private static bool ReadPortApproxEnabled()
    {
        return ReadFlag("TWX_HAGGLE_AGGRESSIVE_PORT_APPROX", "/tmp/twx_haggle_aggressive_port_approx.txt", defaultValue: true);
    }

    private static int ReadPortApproxBiasHours()
    {
        return ReadSetting("TWX_HAGGLE_AGGRESSIVE_PORT_BIAS_HOURS", "/tmp/twx_haggle_aggressive_port_bias_hours.txt", 6, 240);
    }

    private static int ReadPortApproxProductionRate()
    {
        return ReadSetting("TWX_HAGGLE_AGGRESSIVE_PORT_PRODUCTION_RATE", "/tmp/twx_haggle_aggressive_port_production_rate.txt", 10, 100);
    }

    private static int ReadPortApproxMaxRegen()
    {
        return ReadSetting("TWX_HAGGLE_AGGRESSIVE_PORT_MAX_REGEN", "/tmp/twx_haggle_aggressive_port_max_regen.txt", 100, 1000);
    }

    private static int ReadFinalNudge()
    {
        return ReadSetting("TWX_HAGGLE_AGGRESSIVE_NUDGE", "/tmp/twx_haggle_aggressive_nudge.txt", 1, 5);
    }

    private static int ReadFirstSoften()
    {
        return ReadSetting("TWX_HAGGLE_AGGRESSIVE_FIRST_SOFTEN", "/tmp/twx_haggle_aggressive_first_soften.txt", 0, 3);
    }

    private static bool ReadFirstExactHitEnabled()
    {
        return ReadFlag("TWX_HAGGLE_AGGRESSIVE_FIRST_EXACT_HIT", "/tmp/twx_haggle_aggressive_first_exact_hit.txt", defaultValue: true);
    }

    private static int ReadMidSoften()
    {
        return ReadSetting("TWX_HAGGLE_AGGRESSIVE_MID_SOFTEN", "/tmp/twx_haggle_aggressive_mid_soften.txt", 0, 3);
    }

    private static int ReadFirstExactNudge()
    {
        return ReadSetting("TWX_HAGGLE_AGGRESSIVE_FIRST_EXACT_NUDGE", "/tmp/twx_haggle_aggressive_first_exact_nudge.txt", 0, 5);
    }

    private static int ReadMidExactNudge()
    {
        return ReadSetting("TWX_HAGGLE_AGGRESSIVE_MID_EXACT_NUDGE", "/tmp/twx_haggle_aggressive_mid_exact_nudge.txt", 0, 5);
    }

    private static bool ReadPlanetSolverEnabled()
    {
        return ReadFlag("TWX_AGGRESSIVE_PLANET_SOLVER", "/tmp/twx_aggressive_planet_solver.txt", defaultValue: true);
    }

    private static int ReadPlanetMidSafety()
    {
        return ReadSetting("TWX_AGGRESSIVE_PLANET_MID_SAFETY", "/tmp/twx_aggressive_planet_mid_safety.txt", 2, 25);
    }

    private static int ReadPlanetFinalSafetyBase()
    {
        return ReadSetting("TWX_AGGRESSIVE_PLANET_FINAL_SAFETY", "/tmp/twx_aggressive_planet_final_safety.txt", 1, 25);
    }

    private static int ReadPlanetFuelFinalSafetyBonus()
    {
        return ReadSetting("TWX_AGGRESSIVE_PLANET_FUEL_FINAL_SAFETY_BONUS", "/tmp/twx_aggressive_planet_fuel_final_safety_bonus.txt", 1, 10);
    }

    private static int ReadPlanetFinalSafety(string productKey)
    {
        int num = ReadPlanetFinalSafetyBase();
        if (string.Equals(productKey, "FUEL", StringComparison.OrdinalIgnoreCase))
        {
            num += ReadPlanetFuelFinalSafetyBonus();
        }
        else
        {
            num++;
        }
        return num;
    }

    private static int ReadSetting(string envName, string filePath, int defaultValue, int maxValue)
    {
        string text = Environment.GetEnvironmentVariable(envName);
        if (string.IsNullOrWhiteSpace(text))
        {
            try
            {
                if (File.Exists(filePath))
                {
                    text = File.ReadAllText(filePath).Trim();
                }
            }
            catch
            {
                text = null;
            }
        }
        if (!int.TryParse(text, NumberStyles.Integer, CultureInfo.InvariantCulture, out var result))
        {
            return defaultValue;
        }
        if (result < 0)
        {
            return 0;
        }
        if (result > maxValue)
        {
            return maxValue;
        }
        return result;
    }

    private static bool ReadFlag(string envName, string filePath, bool defaultValue)
    {
        string text = Environment.GetEnvironmentVariable(envName);
        if (string.IsNullOrWhiteSpace(text))
        {
            try
            {
                if (File.Exists(filePath))
                {
                    text = File.ReadAllText(filePath).Trim();
                }
            }
            catch
            {
                text = null;
            }
        }
        if (string.IsNullOrWhiteSpace(text))
        {
            return defaultValue;
        }
        return text.Equals("1", StringComparison.OrdinalIgnoreCase) || text.Equals("true", StringComparison.OrdinalIgnoreCase) || text.Equals("on", StringComparison.OrdinalIgnoreCase);
    }
}
