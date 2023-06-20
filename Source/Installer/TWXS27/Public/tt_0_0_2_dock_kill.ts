# Dock Lock and Kill
# version 3.0

loadvar $TDK_Unlim
loadvar $TDK_Target
loadvar $TDK_FigWave

:warnings
echo ANSI_12 "**Dock Killah v3.0  By Traitor!**"
echo ANSI_12 "***Remember to turn " ANSI_11 "OFF" ANSI_12 " CAPS LOCK!!**"

:verifyprompt
cutText CURRENTLINE $location 1 7
if ($location = "Command")
	goto :findOutIfAtDock
else
        echo ANSI_12 "**Must start at Command Prompt.*Halting script!**"
        halt
end

:findOutIfAtDock
# added for fig reloader.
gettext CURRENTLINE $dockSecCheck "]:[" "] (?"
if ($dockSecCheck <> STARDOCK)
	echo ANSI_12 "****Not at dock, " ANSI_11 "NO" ANSI_12 " replacement figs will be purchased.**"
	setvar $buyMoreFigs "n"
end
goto :useOldFileData

:useOldFileData
echo ANSI_10 "**Use data from last time? (y/n)"
getconsoleinput $useOldData SINGLEKEY
lowercase $useOldData
if ($useOldData = "y")
	goto :check4oldVars
else
	goto :getFigWave
end

:check4oldVars
if ($TDK_Unlim = 0) OR ($TDK_Target = 0) OR (TDK_FigWave = 0)
	echo ANSI_12 "**No previous variables found!*Please answer the following: "
	goto :getFigWave
else
	setvar $figWave $TDK_FigWave
	goto :getQuickStats
end

:getFigWave
echo ANSI_10 "*I recommend 9999 for stock iss, since 10000 will dump you to the nav*"
echo ANSI_10 "screen if you miss in certain cases.  9999 will put you back at the*"
echo ANSI_10 "command prompt.  Play with it.*"
getinput $figWave ANSI_10 & "Enter the fig wave to send:"
isnumber $test $figWave
if ($test = 0)
	echo ANSI_12 "**Fig Wave is not a number, try again!*"
	goto :getFigWave
elseif ($figwave < 1) OR ($figwave > 40000)
	echo ANSI_12 "**" $figwave "?!?  Are you sure? (y/n)"
	getconsoleinput $sysopIdiot SINGLEKEY
	if ($sysopIdiot = "n") OR ($sysopIdiot = "N")
		echo ANSI_12 "**Heh, trying again.*"
		goto :getFigWave
	end
else
	echo ANSI_10 "**Fig Wave at: " $figwave ".*"
	setvar $TDK_FigWave $figwave
	savevar $TDK_FigWave
	goto :getQuickStats
end

:getQuickStats
gosub :quickstats
setvar $maxFigs $yourFigs
if ($yourAlign < 0) OR ($yourExp > 999)
	setvar $notFedsafeAtStart 1
end
if ($yourFigs < $figwave)
	echo ANSI_12 "**Not enough figs on you to launch max wave!*"
	echo ANSI_12 "You appear to have only " ANSI_11 $yourFigs ANSI_12 " fighters on you!**"
	goto :getFigWave
end
if ($yourTurns = 0) AND ($TDK_Unlim <> "y")
	echo ANSI_12 "**You appear to have zero turns.  Is this an Unlim Game? (y/n)**"
	getConsoleInput $unlim SINGLEKEY
	if ($unlim = "n")
		echo ANSI_12 "****No turns! " ANSI_11 "NO" ANSI_12 " replacement figs will be purchased.**"
		setvar $buyMoreFigs "n"
	else
		setvar $unlim "y"
		setvar $TDK_Unlim "y"
		savevar $TDK_Unlim
	end
end
goto :checkCNSettings

:checkCNSettings
# Turns off fedcom if not already turned off.  helps prevent some spoofs
send "cn"
settextlinetrigger checkCN5 :checkCN5 "(5) Federation comm-link"
pause

:checkCN5
killtrigger checkCN5
getword CURRENTLINE $cn5setting 5
if ($cn5setting = "On")
	send "5"
	waitfor "Your Federation comm-link reception is now"
	send "qq"
else
	send "qq"
end
waitfor "<Computer deactivated>"
# Check for CN9 here.  prolly want it set to space?
# (9) Abort display on keys    - ALL KEYS
# (9) Abort display on keys    - SPACE
goto :checkFigPrice

:checkFigPrice
send "cr1*"
settextlinetrigger notBeenToTerra :notBeenToTerra "You have never visted sector 1."
settextlinetrigger getFigPrice :getFigPrice "credits per fighter"
pause

:notBeenToTerra
killtrigger notBeenToTerra
killtrigger getFigPrice
setvar $buyMoreFigs "n"
send "q"
waitfor "<Computer deactivated>"
goto :checkTrader

:getFigPrice
killtrigger notBeenToTerra
killtrigger getFigPrice
getword CURRENTLINE $figPrice 4
if ($yourCredits < (($figwave * $figPrice) + 5000))
	setvar $buyMoreFigs "n"
elseif ($buyMoreFigs <> "n")
	setvar $buyMoreFigs "y"
end
goto :checkTrader

:checkTrader
# setup variable here
if ($useOldData = "y") AND ($TDK_Target <> 0)
	setvar $target $TDK_Target
else
	gosub :getCLVnames
	gosub :selectTraderName
	setvar $TDK_Target $target
	savevar $TDK_Target
end
send "q"
waitfor "<Computer deactivated>"
	
echo ANSI_10 "**Target = " $target "*"
if ($target = 0) OR ($target = "") OR ($target = EOF)
	goto :checkTrader
else
	echo ANSI_12 "**" $target ANSI_10 " is now targeted!**"
	gosub :getDockContents
	goto :getPreLock
end

:getPreLock
killtrigger getPreLock
setvar $count 1
echo ANSI_10 "***"
if ($lastShipAtDock <> 0)
	echo ANSI_10 "0 " $lastShipAtDock "*"
end
while ($count <= $tradersAtDock)
	echo ANSI_10 $count " " $tradersAtDock[$count] "*"
	add $count 1
end
getinput $preLockTrader ANSI_10 & "Input the number of the trader/ship to pre-lock on, or <enter> for none:"
if ($preLockTrader = 0)
	echo ANSI_11 "**" $lastShipAtDock ANSI_10 " is selected as Pre-Lock!**"
#	add $noCount $preLockTrader
#	setvar $preLockTrader $lastShipAtDock
elseif ($preLockTrader = "")
	setvar $noPreLock 1
	echo ANSI_11 "**No Pre-Lock Selected!**"
else
	echo ANSI_11 "**" $tradersAtDock[$preLockTrader] ANSI_10 " is selected as Pre-Lock!**"
	add $noCount $preLockTrader
	setvar $preLockTrader $tradersAtDock[$preLockTrader]
end
subtract $noCount 1
# echo ANSI_10 "*$noCount = " $noCount "*"
echo ANSI_12 "*READY TO ATTACK!!*"

gosub :makeNmacro

:attack
# echo ANSI_10 "*At attack**"
setvar $count 1
if ($noPreLock = 0)
	send "a" & $nMacro
end
echo ANSI_12 "**Dock Killer Loaded.*"
if ($noPreLock = 0)
	echo ANSI_10 "Press " ANSI_12 "r" ANSI_10 " to refresh dock list.*"
end
echo ANSI_10 "Press " ANSI_12 "p" ANSI_10 " to change pre-lock name*"
echo ANSI_10 "Press " ANSI_12 "m" ANSI_10 " to make a planet*"
echo ANSI_10 "Press " ANSI_12 "d" ANSI_10 " to destroy frist planet on list*"
echo ANSI_10 "Press " ANSI_12 "a" ANSI_10 " to manually Attack*"
echo ANSI_10 "Press " ANSI_12 "q" ANSI_10 " to quit and land on dock**"
:setAttackTriggers
settextlinetrigger shootTarget :shootTarget $target & " blasts off from the StarDock."
settextlinetrigger targetLifts :shootTarget $target & " lifts off from "
settextlinetrigger targetWarpsIn :shootTarget $target & " warps into the sector."
settextlinetrigger targetEntersGame :shootTarget $target & " enters the game."
#settextlinetrigger	targetappears	:shootTarget $target & " appears in a brilliant flash of warp energies!"
if ($noPreLock = 0)
	settextouttrigger refresh :refresh "r"
end
settextouttrigger quit :quit "q"
settextouttrigger changePreLock :changePreLock "p"
settextouttrigger makePlanet :makePlanet "m"
settextouttrigger ZDYPlanet :ZDYPlanet "d"
settextouttrigger manualAttack :manualAttack "a"
# add something here to deal with people landing on dock, or blasting off dock?
# maybe have it do a quick dock refresh to get the proper N count?
# Possible Triggers:
#   lands on the StarDock.
#   blasts off from the StarDock.
#   warps out of the sector.
#   ship vanishes from scanners with a brilliant flash!
#   appears in a brilliant flash of warp energies!
pause

:refresh
killtrigger targetappears
killtrigger shootTarget
killtrigger targetLifts
killtrigger targetWarpsIn
killtrigger targetEntersGame
killtrigger refresh
killtrigger quit
killtrigger changePreLock
killtrigger makePlanet
killtrigger ZDYPlanet
killtrigger manualAttack
# echo ANSI_10 "*At refresh**"
if ($noPreLock = 0)
	gosub :get2commandPrompt
end
goto :ready4reset
pause

:quit
killtrigger targetappears
killtrigger shootTarget
killtrigger targetLifts
killtrigger targetWarpsIn
killtrigger targetEntersGame
killtrigger refresh
killtrigger quit
killtrigger changePreLock
killtrigger makePlanet
killtrigger ZDYPlanet
killtrigger manualAttack
# echo ANSI_10 "*At quit**"
if ($noPreLock = 0)
	gosub :get2commandPrompt
	send " p s g y g q"
end
echo ANSI_10 "**Quitting Dock Killer Script!**"
halt

:changePreLock
killtrigger targetappears
killtrigger shootTarget
killtrigger targetLifts
killtrigger targetWarpsIn
killtrigger targetEntersGame
killtrigger refresh
killtrigger quit
killtrigger changePreLock
killtrigger makePlanet
killtrigger ZDYPlanet
killtrigger manualAttack
# echo ANSI_10 "*At changePreLock**"
if ($noPreLock = 0)
	gosub :get2commandPrompt
end
gosub :getDockContents
goto :getPreLock

pause

:makePlanet
killtrigger targetappears
killtrigger shootTarget
killtrigger targetLifts
killtrigger targetWarpsIn
killtrigger targetEntersGame
killtrigger refresh
killtrigger quit
killtrigger changePreLock
killtrigger makePlanet
killtrigger ZDYPlanet
killtrigger manualAttack
# echo ANSI_10 "*At makePlanet**"
if ($noPreLock = 0)
	gosub :get2commandPrompt
end
send "u"
settextlinetrigger noGTorps :noGTorps "You don't have any Genesis Torpedoes to launch!"
settextlinetrigger haveGTorps :haveGTorps "You have"
pause

:noGTorps
killtrigger noGTorps
killtrigger haveGTorps
echo ANSI_12 "**Error, no G-Torps on Board!!**"
goto :ready4reset

:haveGTorps
killtrigger noGTorps
killtrigger haveGTorps
send "y  n.*c  "
goto :ready4reset

:ZDYPlanet
killtrigger targetappears
killtrigger shootTarget
killtrigger targetLifts
killtrigger targetWarpsIn
killtrigger targetEntersGame
killtrigger refresh
killtrigger quit
killtrigger changePreLock
killtrigger makePlanet
killtrigger ZDYPlanet
killtrigger manualAttack
# echo ANSI_10 "*At ZDYPlanet**"
if ($noPreLock = 0)
	gosub :get2commandPrompt
end
gosub :quickstats
if ($yourDets < 1)
	echo ANSI_12 "**Error, you don't have any Atomic Detonators!!**"
	goto :ready4reset
end
# land and kill first planet here!
send "l"
settextlinetrigger multipleOrScanner :multipleOrScanner "---------"
settextlinetrigger noPlanetScanner :noPlanetScanner "Landing sequence engaged..."
settextlinetrigger noPlanetInSector :noPlanetInSector "There isn't a planet in this sector."
pause

:noPlanetInSector
killtrigger noPlanetInSector
killtrigger multipleOrScanner
killtrigger noPlanetScanner
echo ANSI_12 "**Error, No planet in sector**"
goto :ready4reset


:multipleOrScanner
killtrigger multipleOrScanner
killtrigger noPlanetScanner
killtrigger noPlanetInSector
settextlinetrigger getPlanetNumber :getPlanetNumber "<"
pause

:getPlanetNumber
killtrigger getPlanetNumber
gettext CURRENTLINE $planetNumber "<" ">"
striptext $planetNumber " "
send $planetNumber "*  z  dy  "
goto :ready4reset

:noPlanetScanner
killtrigger multipleOrScanner
killtrigger noPlanetScanner
killtrigger noPlanetInSector
# If ship can't land on planet, check for that here?
# since it couldn't possibly stand the stress of landing.
send "  z  dy  "
goto :ready4reset

:manualAttack
killtrigger targetappears
killtrigger shootTarget
killtrigger targetLifts
killtrigger targetWarpsIn
killtrigger targetEntersGame
killtrigger refresh
killtrigger quit
killtrigger changePreLock
killtrigger makePlanet
killtrigger ZDYPlanet
killtrigger manualAttack
# echo ANSI_10 "*At manualAttack**"
goto :shootTarget

:shootTarget
killtrigger targetappears
killtrigger shootTarget
killtrigger targetLifts
killtrigger targetWarpsIn
killtrigger targetEntersGame
killtrigger refresh
killtrigger quit
killtrigger changePreLock
killtrigger makePlanet
killtrigger ZDYPlanet
killtrigger manualAttack
# echo ANSI_10 "*At shootTarget**"
# check for spoofing
getword CURRENTLINE $spoofCheck 1
if ($spoofCheck = "F") OR ($spoofCheck = "P") OR ($spoofCheck = "R")
	echo ANSI_12 "*Spoof Attempt Detected!*"
	goto :setAttackTriggers
else
	if ($noPreLock = 0)
		send "ny" $figWave "*"
		# removed the line below cause I'm testing to see if double tap really necessary.
		# "a" & $nMacro & "ny" & $figwave "*"
		goto :attackResults
	else
		send "ay" $figWave "*"
		goto :attackResults
	end
end

:attackResults
settextlinetrigger forAttacking :forAttacking "For attacking this"
settextlinetrigger youLostFigs :forAttacking "You lost"
settextlinetrigger went2navMenu :went2navMenu "<Set NavPoint>"
settextlinetrigger captainZshows :captainZshows "A blaring message comes screaming across your sub-space radio:"
settextlinetrigger targetDocked :targetDocked $target & " has docked!  Aborting combat..."
settextlinetrigger atChooseNav :atChooseNav "<Set Course to NavPoint>"
settextlinetrigger targetMoved :targetDocked  $target & " is no longer in this sector!  Aborting combat..."
settextlinetrigger targetGone :targetDocked "SAFETY OVERRIDE ENGAGED!  Attempt to attack Corporation"
pause

:targetDocked
killtrigger forAttacking
killtrigger youLostFigs 
killtrigger went2navMenu
killtrigger captainZshows
killtrigger targetDocked
killtrigger atChooseNav
killtrigger targetMoved
Killtrigger targetGone
# echo ANSI_10 "*AT targetDocked**"
goto :ready4reset

:went2navMenu
killtrigger forAttacking
killtrigger youLostFigs 
killtrigger went2navMenu
killtrigger captainZshows
killtrigger targetDocked
killtrigger atChooseNav
killtrigger targetMoved
Killtrigger targetGone
# echo ANSI_10 "*AT went2navMenu**"
settextlinetrigger enterNewNavPoint :enterNewNavPoint "Enter new NavPoint"
settexttrigger backAtCommand :backAtCommand "Command [TL="
pause

:enterNewNavPoint
killtrigger enterNewNavPoint
killtrigger backAtCommand
# echo ANSI_10 "*AT enterNewNavPoint**"
send "q"
waitfor "Command [TL="
goto :ready4reset

:atChooseNav
killtrigger forAttacking
killtrigger youLostFigs 
killtrigger went2navMenu
killtrigger captainZshows
killtrigger targetDocked
killtrigger atChooseNav
killtrigger targetMoved
Killtrigger targetGone
settextlinetrigger setCourseToNavPoint :setCourseToNavPoint  "Enter new NavPoint"
settexttrigger backAtCommand :backAtCommand "Command [TL="
pause

:setCourseToNavPoint 
killtrigger setCourseToNavPoint
killtrigger backAtCommand
send "q"
waitfor "Command [TL="
goto :ready4reset

:backAtCommand
killtrigger setCourseToNavPoint
killtrigger enterNewNavPoint
killtrigger backAtCommand
# echo ANSI_10 "*At backAtCommand**"
goto :ready4reset

:captainZshows
killtrigger forAttacking
killtrigger youLostFigs 
killtrigger went2navMenu
killtrigger captainZshows
killtrigger targetDocked
killtrigger atChooseNav
killtrigger targetMoved
Killtrigger targetGone
# echo ANSI_10 "*At captainZshows**"
goto :ready4reset

:forAttacking
killtrigger forAttacking
killtrigger youLostFigs 
killtrigger went2navMenu
killtrigger captainZshows
killtrigger targetDocked
killtrigger atChooseNav
killtrigger targetMoved
Killtrigger targetGone
# echo ANSI_10 "*At forAttacking**"
settextlinetrigger targetWarpsOut :targetWarpsOut $target & " warps out of the sector!"
settextlinetrigger podWarpsOut :podWarpsOut "An Escape Pod warps out of this sector!"
settextlinetrigger targetFailedWarpOut :targetFailedWarpOut $target & " tried to warp out of the sector but failed!"
settextlinetrigger targetPodFailedWarpOut :targetPodFailedWarpOut $target & "'s Escape Pod tried to warp out of the sector but failed!"
settextlinetrigger targetKilled :targetKilled "Excellent, you have obliterated the target!"
settexttrigger targetHitNoAutoFlee :targetHitNoAutoFlee "Command [TL="
pause

:targetWarpsOut
killtrigger targetWarpsOut
killtrigger podWarpsOut
killtrigger targetFailedWarpOut
killtrigger targetPodFailedWarpOut
killtrigger targetKilled
killtrigger targetHitNoAutoFlee
# echo ANSI_10 "*At targetWarpsOut**"
if ($buyMoreFigs = "y")
	gosub :quickstats
	gosub :buyMoreFigs
end
goto :ready4reset
pause

:podWarpsOut
killtrigger targetWarpsOut
killtrigger podWarpsOut
killtrigger targetFailedWarpOut
killtrigger targetPodFailedWarpOut
killtrigger targetKilled
killtrigger targetHitNoAutoFlee
# echo ANSI_10 "*At podWarpsOut**"
if ($buyMoreFigs = "y")
	gosub :quickstats
	gosub :buyMoreFigs
end
goto :ready4reset
pause

:targetFailedWarpOut
killtrigger targetWarpsOut
killtrigger podWarpsOut
killtrigger targetFailedWarpOut
killtrigger targetPodFailedWarpOut
killtrigger targetKilled
killtrigger targetHitNoAutoFlee
# echo ANSI_10 "*At targetFailedWarpOut**"
if ($buyMoreFigs = "y")
	subtract $yourFigs $figwave
	gosub :buyMoreFigs
end
goto :take2ndShot
pause

:targetPodFailedWarpOut
killtrigger targetWarpsOut
killtrigger podWarpsOut
killtrigger targetFailedWarpOut
killtrigger targetPodFailedWarpOut
killtrigger targetKilled
killtrigger targetHitNoAutoFlee
# echo ANSI_10 "*At targetPodFailedWarpOut**"
# Check to see if you capped their ship
settextlinetrigger cappedTargetShip :cappedTargetShip "The ship is abandoned! Its all yours!"
settexttrigger noCapture :noCapture "Command [TL="
pause

:cappedTargetShip
killtrigger noCapture
killtrigger cappedTargetShip
setvar $nMacro $nMacro & "n"
if ($buyMoreFigs = "y")
	subtract $yourFigs $figwave
	gosub :buyMoreFigs
end
goto :take2ndShot
pause

:noCapture
killtrigger noCapture
killtrigger cappedTargetShip
if ($buyMoreFigs = "y")
	subtract $yourFigs $figwave
	gosub :buyMoreFigs
end
goto :take2ndShot


:targetHitNoAutoFlee
killtrigger targetWarpsOut
killtrigger podWarpsOut
killtrigger targetFailedWarpOut
killtrigger targetPodFailedWarpOut
killtrigger targetKilled
killtrigger targetHitNoAutoFlee
# echo ANSI_10 "targetHitNoAutoFlee**"
if ($buyMoreFigs = "y")
	subtract $yourFigs $figwave
	gosub :buyMoreFigs
end
goto :take2ndShot
pause

:ready4reset
killtrigger forAttacking
killtrigger youLostFigs 
killtrigger went2navMenu
killtrigger captainZshows
killtrigger targetDocked
killtrigger atChooseNav
# echo ANSI_10 "*At ready4reset**"
gosub :getDockContents
gosub :redoPreLock
gosub :makeNmacro
goto :attack
pause

:take2ndShot
# echo ANSI_10 "*At take2ndShot**"
setvar $count 1
if ($noPreLock = 0)
	send "a" & $nMacro "ny" $figWave "*"
else
	send "ay" $figWave "*"
end
goto :attackResults

:targetKilled
killtrigger targetWarpsOut
killtrigger podWarpsOut
killtrigger targetFailedWarpOut
killtrigger targetPodFailedWarpOut
killtrigger targetKilled
killtrigger targetHitNoAutoFlee
gosub :quickstats
if ($dockSecCheck = STARDOCK)
	if ($yourAlign < 0) OR ($yourExp > 999)
		if ($notFedsafeAtStart = 0)
			send "ps"
			waitfor "<StarDock> Where to?"
			echo ANSI_12 "*At targetKilled**"
			echo ANSI_12 $target " appears to be destroyed!!**"
			echo ANSI_12 "Your are no longer be fedsafe.  Docked at the Stardock!*"
			echo ANSI_12 "EXP: " $yourExp " ALIGN: " $yourAlign "*"
			if ($yourAlign < 1000) AND ($yourAlign > 499)
				echo ANIS_12 "Perhaps you should re-apply for your commish?*"
			end
			if ($yourAlign < 500) AND ($yourAlign > 0)
				echo ANSI_12 "Perhaps you should post on someone to get a commish?*"
				setvar $tempAlign 500
				subtract $tempAlign $yourAlign
				multiply $tempAlign 1000
				echo ANSI_12 "You will need " $tempAlign " credits to have enough for a commish*"
			end
			echo ANSI_12 "**"
			echo ANSI_10 "Experience: " ANSI_11 $yourExp "*"
			echo ANSI_10 "Alignment:  "
			if ($yourAlign < 0)
				echo ANSI_12 $yourAlign "*"
			else
				echo ANSI_11 $yourAlign "*"
			end
			echo ANSI_10 "Fighters    " ANSI_11 $yourFigs "*"
			echo ANSI_10 "Credits:    " ANSI_11 $yourCredits "*"
			halt
		else
			echo ANSI_12 "*At targetKilled**"
			echo ANSI_12 $target " appears to be destroyed!!**"
			echo ANSI_10 "Experience: " ANSI_11 $yourExp "*"
			echo ANSI_10 "Alignment:  "
			if ($yourAlign < 0)
				echo ANSI_12 $yourAlign "*"
			else
				echo ANSI_11 $yourAlign "*"
			end
			echo ANSI_10 "Fighters    " ANSI_11 $yourFigs "*"
			echo ANSI_10 "Credits:    " ANSI_11 $yourCredits "*"
			halt
		end
	else
		echo ANSI_12 "*At targetKilled**"
		echo ANSI_12 $target " appears to be destroyed!!**"
		echo ANSI_12 "EXP: " $yourExp " ALIGN: " $yourAlign "*"
		if ($yourAlign < 1000) AND ($yourAlign > 499)
			echo ANIS_12 "Perhaps you should re-apply for your commish?*"
		end
		if ($yourAlign < 500) AND ($yourAlign > 0)
			echo ANSI_12 "Perhaps you should post on someone to get a commish?*"
			setvar $tempAlign 500
			subtract $tempAlign $yourAlign
			multiply $tempAlign 1000
			echo ANSI_12 "You will need " $tempAlign " credits to have enough for a commish*"
		end
		echo ANSI_12 "**"
		echo ANSI_10 "Experience: " ANSI_11 $yourExp "*"
		echo ANSI_10 "Alignment:  "
		if ($yourAlign < 0)
			echo ANSI_12 $yourAlign "*"
		else
			echo ANSI_11 $yourAlign "*"
		end
		echo ANSI_10 "Fighters    " ANSI_11 $yourFigs "*"
		echo ANSI_10 "Credits:    " ANSI_11 $yourCredits "*"
		halt
	end
else
	echo ANSI_11 "**" $target ANSI_12 " appears to be destroyed!!**"
	echo ANSI_10 "Experience: " ANSI_11 $yourExp "*"
	echo ANSI_10 "Alignment:  "
	if ($yourAlign < 0)
		echo ANSI_12 $yourAlign "*"
	else
		echo ANSI_11 $yourAlign "*"
	end
	echo ANSI_10 "Fighters    " ANSI_11 $yourFigs "*"
	echo ANSI_10 "Credits:    " ANSI_11 $yourCredits "*"
	halt
end

# =========================
# ==== [ SUBROUTINES ] ====
# =========================
# ====[ Get Contents of Dock ]====
:buyMoreFigs
if ($yourFigs > $figwave)
	return
elseif ($yourCredits < (($figwave * $figPrice) + 5000))
	setvar $buyMoreFigs "n"
	echo ANSI_12 "***Not enough figs to send max wave, and not enough creds to buy more!!*"
	echo ANSI_12 "Halting script!!****"
	halt
elseif ($yourCredits > ((($maxFigs - $yourFigs) * $figPrice) + 5000))
	send "p  s s p b " ($maxFigs - $yourFigs) "* q q q "
	subtract $yourCredits (($maxFigs - $yourFigs) * $figPrice)
	add $yourFigs ($maxFigs - $yourFigs)
	return
else
	send "p  s s p b " $figwave "* q q q "
	subtract $yourCredits ($figwave * $figPrice)
	add $yourFigs $figwave
	return
end

:getDockContents
# echo ANSI_10 "*At getDockContents"
setvar $tradersAtDock 1
setvar $noCount 0
send "d"
settextlinetrigger fedAtDock :fedAtDock "Federals:"
settextlinetrigger tradersAtDock :tradersAtDock "Traders :"
settextlinetrigger shipsAtDock :shipsAtDock "Ships   :"
settextlinetrigger gotDockContents :gotDockContents "Warps to Sector(s) :"
pause

:fedAtDock
killtrigger fedAtDock
# echo ANSI_10 "*At fedAtDock"
# echo ANSI_10 "*" CURRENTLINE
add $noCount 1
add $fedCount 1
settextlinetrigger moreFedsAtDock :moreFedsAtDock
pause

:moreFedsAtDock
killtrigger moreFedsAtDock
# echo ANSI_10 "*At moreFedsAtDock"
# echo ANSI_10 "*" CURRENTLINE
# add $noCount 1
settextlinetrigger fedAtDock :fedAtDock
pause

:tradersAtDock
killtrigger tradersAtDock
killtrigger fedAtDock
killtrigger moreFedsAtDock
# echo ANSI_10 "*At TradersAtDock"
# echo ANSI_10 "*$noCount = " $noCount "*"
gettext CURRENTLINE $tempName "Traders : " ", w/"
setvar $tradersAtDock[$tradersAtDock] $tempName
add $tradersAtDock 1
settextlinetrigger nextTraderAtDock :nextTraderAtDock ", w/"
pause

:nextTraderAtDock
killtrigger nextTraderAtDock
# echo ANSI_10 "*At nextTraderAtDock"
gettext CURRENTLINE $tempName "          " ", w/"
setvar $tradersAtDock[$tradersAtDock] $tempName
add $tradersAtDock 1
settextlinetrigger nextTraderAtDock :nextTraderAtDock ", w/"
pause

:shipsAtDock
killtrigger fedAtDock
killtrigger moreFedsAtDock
killtrigger shipsAtDock
killtrigger tradersAtDock
killtrigger nextTraderAtDock
# echo ANSI_10 "*At shipsAtDock"
# echo ANSI_10 "*" CURRENTLINE
add $noCount 1
# echo ANSI_10 "*$noCount = " $noCount "*"
cutText CURRENTLINE $lastShipAtDock 11 99
settextlinetrigger shipsAtDock :shipsAtDock ", w/"
pause

:gotDockContents
killtrigger fedAtDock
killtrigger shipsAtDock
killtrigger nextTraderAtDock
killtrigger tradersAtDock
# echo ANSI_10 "*At gotDockContents"
subtract $tradersAtDock 1
# settexttrigger :getPreLock :getPreLock "Command [TL="
waitfor "Command [TL="
return
pause

# ====[ Make N Macro ]====
:makeNmacro
# echo ANSI_10 "*At makeNmacro**"
setvar $count 1
setvar $nMacro ""
while ($count <= $noCount)
	setvar $nMacro $nMacro & "n"
	add $count 1
end
return

# ====[ redo pre-lock trader number ]====
:redoPreLock
# echo ANSI_10 "*At redoPreLock**"
if ($noPreLock = 0)
	if ($preLockTrader = 0)
		subtract $noCount 1
	#	echo ANSI_12 "**preLockTrader: " $preLockTrader " noCount: " $noCount "*"
		return
	else
		setvar $count 1
		while ($count <= $tradersAtDock)
			if ($tradersAtDock[$count] = $preLockTrader)
				add $noCount ($count - 1)
			end
			add $count 1
		end
		return
	end
else
	return
end

# ====[ Get back to command prompt ]====
:get2commandPrompt
killtrigger get2commandPrompt
killtrigger atCommand
send "n"
settexttrigger get2commandPrompt :get2commandPrompt "Attack "
settexttrigger atCommand :atCommand "Command [TL="
pause

:atCommand
killtrigger get2commandPrompt
killtrigger atCommand
return

# ====[ Get quick stats ]====
# >>>>deal with no photons here too!  Not added yet!!<<<<
# >>>>deal with unlimited turns!  Not added yet!!<<<<
# The complese list of quick stats follows.
# XX YYYY ZZZZ
# XX = the getword number to use to get the stat
# YYYY = the stat
# ZZZZ = the value of that stat
# so to use this, do getword $stats $YYYY XX
# i.e. getword $stats $turns 5  
# that will make $turns equal to your current turns
# 3 Sect 4372
# 5 Turns 2740
# 7 Creds 100
# 9 Figs 1
# 11 Shlds 1
# 13 Hlds 40
# 15 Ore 0
# 17 Org 0
# 19 Equ 0
# 21 Col 0
# 23 Phot 0
# 25 Armd 0
# 27 Lmpt 0
# 29 GTorp 0
# 31 TWarp No
# 33 Clks 0
# 35 Beacns 0
# 37 AtmDt 0
# 39 Crbo 0
# 41 EPrb 0
# 43 MDis 0
# 45 PsPrb No
# 47 PlScn No
# 49 LRS Holo
# 51 Aln -100
# 53 Exp 100
# 55 Corp 1
# 57 Ship 1

:quickstats
setvar $stats 0
getword CURRENTLINE $prompttest 1
if ($prompttest <> "Command")
	waitfor "Command"
end
send "/"
settextlinetrigger getStats :getStats #179 & "Turns"
settexttrigger gotStats :gotStats "Command"
pause

:getStats
killtrigger getStats
setvar $stats $stats & CURRENTLINE
replacetext $stats #179 " "
striptext $stats ","
settextlinetrigger getStats :getStats
pause

:gotStats
# echo ANSI_10 "**AT gotStats*"
killtrigger getStats
killtrigger gotStats
# write "stats.txt" $stats
getword $stats $yourTurns 5
getword $stats $yourCredits 7
getword $stats $yourFigs 9
getword $stats $yourShields 11
getword $stats $yourOre 15
getword $stats $photonCheck 22
# echo ANSI_10 "**Phot = " $photonCheck "**"
if ($photonCheck = "Phot")
	getword $stats $yourTWarp 31
	getword $stats $yourCloaks 33
	getword $stats $yourDets 37
	getword $stats $yourAlign 51
	getword $stats $yourExp 53
	getword $stats $checkCorp 54
#	if ($checkCorp <> "Corp")
#		echo ANSI_12 "**You don't belong to a corp!!*How do you expect to run this?*HALTING!!**"
#		halt
#	end
	getword $stats $CorpNum 55
	getword $stats $PersonalShipNum 57
else
	getword $stats $yourTWarp 29
	getword $stats $yourCloaks 31
	getword $stats $yourDets 35
	getword $stats $yourAlign 49
	getword $stats $yourExp 51
	getword $stats $checkCorp 52
#	if ($checkCorp <> "Corp")
#		echo ANSI_12 "**You don't belong to a corp!!*How do you expect to run this?*HALTING!!**"
#		halt
#	end
	getword $stats $CorpNum 53
	getword $stats $PersonalShipNum 55
end
return



:getCLVnames
send "lv"
waitfor "---------------------"
setvar $CLVtraders 0
settextlinetrigger CLVresults :CLVresults "1"
pause

:CLVresults
getword CURRENTLINE $test 1
if ($test = 0)
	killtrigger CLVresults
	return
end
isnumber $yn $test
if ($yn = 1)
	getword CURRENTLINE $tempAlign 3
	striptext $tempAlign ","
	cuttext CURRENTLINE $tempCLVtraderName 30 30
	setvar $word 1
	setvar $i 1
	while ($word = 1)
		getword $tempCLVtraderName $tempWord $i
		if ($tempWord = 0) OR ($tempWord = "")
			setvar $word 0
		else
			if ($i = 1)
				setvar $CLVname $tempWord
			else
				setvar $CLVname $CLVname & " " & $tempWord 
			end	
		end
		add $i 1
	end
	add $CLVtraders 1
	setvar $CLVtraders[$CLVtraders] $CLVname
	setvar $CLVtraders[$CLVtraders][1] $tempAlign
end
settextlinetrigger CLVresults :CLVresults
pause

:selectTraderName
setvar $count 1
echo ANSI_10 "**"
while ($count <= $CLVtraders)
	if ($CLVtraders[$count][1] < 0)
		echo ANSI_12 $count " " $CLVtraders[$count] "*"
		add $count 1
	else
		echo ANSI_11 $count " " $CLVtraders[$count] "*"
		add $count 1
	end	
end
getinput $targetTrader ANSI_10 & "Enter the number of the trader you want to shoot:"
isnumber $yn $targetTrader
if ($targetTrader = "") OR ($targetTrader = 0) OR ($yn = 0) OR ($targetTrader > $CLVtraders)
	echo ANSI_10 #27 "[2J"
	echo ANSI_10 "Enter a number between " ANSI_11 "1" ANSI_10 " and " ANSI_11 $CLVtraders ANSI_10 "!*"
	goto :selectTraderName
end
setvar $target $CLVtraders[$targetTrader]
write $fileName $target
return