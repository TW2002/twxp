cutText CURRENTLINE $location 1 7
if ($location <> "<StarDo")
	clientMessage "This script must be run from the game <StarDock> prompt."
	halt
end
setVar $pnum 0
setVar $targetExp 5250

:menu
echo "[2J"
:errmenu
setVar $signature_inc~scriptName "The Unknown - Planet Bust"
setVar $signature_inc~version "1.a"
setVar $signature_inc~date "02/22/04"
gosub :signature_inc~signature
echo ANSI_14 "1." ANSI_15 " Target Experience " ANSI_10 "["
echo ANSI_6 $targetExp
echo ANSI_10 "]*"
echo ANSI_14 "2." ANSI_15 " Planet Number     " ANSI_10 "["
echo ANSI_6 $pnum
echo ANSI_10 "]*"
echo ANSI_5 "*Press the number of the option you*wish to change, or press" ANSI_14 " C" ANSI_5 " to run*the script.*"
getConsoleInput $choice singlekey

if ($choice = 1)
	:getExp
	getInput $targetExp "Target Experience?"
	isNumber $num $targetExp
	if ($num <> 1)
		clientMessage "Invalid experience"
		goto :getExp
	end
elseif ($choice = 2)
	:getPnum
	getInput $pnum "Planet number (0 for Auto-detect)"
	isNumber $num $pnum
	if ($num <> 1)
		clientMessage "Invalid Planet number"
		goto :getPnum
	end
elseif ($choice = "c")
	goto :run
end
goto :menu

:run

gosub :gameinfo_inc~quikstats
setVar $creds $gameinfo_inc~quikstats[CREDS]
setVar $torps $gameinfo_inc~quikstats[GTORP]
setVar $dets $gameinfo_inc~quikstats[ATMDT]
setVar $exp $gameinfo_inc~quikstats[EXP]

setVar $needExp ($targetExp - $exp)
if ($needExp <= 0)
	clientMessage "Experience reached."
	halt
end

send "ha"
setTextLineTrigger detCost :detCost "credits each."
pause

:detCost
getText CURRENTLINE $detCost "for " " credits"
setTextTrigger Det :Det ") ["
stripText $detCost ","
pause

:Det
getText CURRENTLINE $buyDets "(Max " ") ["
setVar $maxDets ($buyDets + $dets)
setVar $detCostPer ($maxDets * $detCost)
send "0*t"
	
setTextLineTrigger torpCost :torpCost "credits, but we"
pause

:torpCost
getText CURRENTLINE $torpCost "cost " " credits,"
stripText $torpCost ","
setTextTrigger Torp :Torp ") ["
pause

:Torp
getText CURRENTLINE $buyTorp "(Max " ") ["
setVar $maxTorps ($buyTorp + $torps)
setVar $torpCostPer ($maxTorps * $torpCost)
send "0*q"

setVar $totalCostPer ($torpCostPer + $detCostPer)
setVar $totalPlanets ($needExp / 75)

if ($maxDets <= $maxTorps)
	setVar $maxBuy $maxDets
else
	setVAr $maxBuy $maxTorps
end

gosub :buy

:landPnum
setVar $init 1
if ($pnum = 0)
	send "quy  n.*zc*  l"
	setVAr $pnum 0
	setTextLineTrigger pnum :pnum "   <"
	setTextTrigger onpl :onpl "Planet #"
	pause

	:pnum 
	killtrigger onpl
	getText CURRENTLINE $pnum "<" ">"
	stripText $pnum " "
	send $pnum "*"
	goto :blow

	:onpl
	killtrigger pnum
	getWord CURRENTLINE $plnum 2
	stripText $pnum "#"
	
	:blow
	send "z  dy  *  ps"
end

:makeMacro
setVar $macro "q"
if ($init = 1)
	setVar $init 0
	setVar $cnt 1
else
	setVar $cnt 0
end
:cnt
if ($cnt < $buyAmnt)
	add $cnt 1
	setVar $macro $macro & "uy  n.*zc*  l  " & $pnum & "*  z  dy  *  "
	goto :cnt
end
setVar $macro $macro & "p  s@"
send $macro
waitFor "Average Interval Lag:"

gosub :gameinfo_inc~quikstats
if ($gameinfo_inc~quikstats[EXP] >= $targetExp)
	clientMessage "Target experience reached."
	halt
end

if ($maxTorps <= $maxDets)
	if ($gameinfo_inc~quikstats[GTORP] > 0)
		setVar $pnum 0
		gosub :buy
		goto :landPnum
	else
		gosub :buy
		goto :makemacro
	end
else
	if ($gameinfo_inc~quikstats[ATMDT] > 0)
		setVar $pnum 0
		gosub :buy
		goto :landPnum
	else
		gosub :buy
		goto :makemacro
	end
end

:buy
setVar $needExp ($targetExp - $gameinfo_inc~quikstats[EXP])
if ($gameinfo_inc~quikstats[CREDS] < $totalCostPer)
	setVar $singles ($detCost + $torpCost)
	if ($gameinfo_inc~quikstats[CREDS] > $singles)
		setVar $buyAmnt ($gameinfo_inc~quikstats[CREDS] / $singles)
	else
		clientMessage "Out of cash"
		halt
	end
else
	setVar $buyAmnt $maxBuy
end

setVar $expGain ($buyAmnt * 75)
if ($expGain > $needExp)
	setVar $expDiff ($expGain - $needExp)
	if ($expDiff > 75)
		setVAr $buyAmnt ($buyAmnt - ($expDiff / 75))
	end
end

setVar $buyDets ($buyAmnt - $quikstats_inc~quikstats[ATMDT])
if ($buyDets < 0)
	setVar $buyDets 0
end
setVar $buyTorp ($buyAmnt - $quikstats_inc~quikstats[GTORP])
if ($buyTorp < 0)
	setVar $buyTorp 0
end
send "h  a  " $buyDets "*t  " $buyTorp "*q"

return

include "supginclude\gameinfo_inc"
include "supginclude\signature_inc"