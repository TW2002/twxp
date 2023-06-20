# _T_cit_killah.ts
# Script Name	: Traitor's Cit Killah
# Author        : Traitor <traitor@tw-cabal.com> 
# Description   : A faster, better version of Big12ozHog's cit killa, THANKS OZ!!
#		: It is designed and tested for 2.04beta and above.
#		: This script is loosly based on OZ's cit killa, but I've 
#		:   rewritten the engine completely and added spoof checking.
#		: Routines original to OZ have comments indicating such.
# WARNINGS	: This has the potential to screw up your nav points, but no
#		:   differently than OZ's original one did. :)
setvar $version "1.0.1 05/17/06"
gosub :egoBanner

:promptCheck
cutText CURRENTLINE $location 1 7
if ($location <> "Citadel")
        echo ANSI_12 "**This script must be run from the Citadel Prompt"
        halt
end
send "'Traitor's - Cit Killah - Powering Up!*"

# this routine is oz's
:getStats
gosub :quickStats
send "c;q"
waitFor "Figs Per Attack:"
getWord CURRENTLINE $figs 5
send "qdc"
waitFor "Planet #"
getWord CURRENTLINE $planet 2
stripText $planet "#"

:timeOut
send "'Traitor's - Cit Killah - Running on Planet " $planet "*"

:triggers
setTextLineTrigger timeOut :timeOut "INACTVITY WARNING:"
setTextLineTrigger limpet :scanSec "Limpet mine in"
setTextLineTrigger figs :scanSec "Deployed Fighters Report Sector "
setTextLineTrigger IG :scanSec "Shipboard Computers The Interdictor Generator on"
setTextLineTrigger cannon :scanSec "Quasar Cannon on"
setTextLineTrigger warpsin :scanSec "warps into the sector."
setTextLineTrigger lifts :scanSec "lifts off from"
setTextLineTrigger power :scanSec "is powering up weapons systems!"
setTextLineTrigger exits :scanSec "exits the game."
setTextLineTrigger enters :scanSec "enters the game."
pause

:scanSec
killAllTriggers
getword CURRENTLINE $spoofCheck 1
if ($spoofCheck = "P") OR ($spoofCheck = "F") OR ($spoofCheck = "R")
	echo ANSI_14 "*spoof attempt on T-Cit-Killa!***"
	goto :triggers
end
send "szn*"
waitFor "<Scan Sector>"
waitFor "Sector  :"
getWord CURRENTLINE $sector 3
waitFor "Citadel treasury"
if (SECTOR.TRADERCOUNT[$sector] > 0)
	goto :startCheck
else
	goto :noTarget
end

:startCheck
# calculate the number of empty ships
setvar $nMacro " "
setvar $count SECTOR.SHIPCOUNT[$sector]
while ($count > 0)
	setvar $nMacro "n" & $nMacro
	subtract $count 1
end
setvar $count 1
while ($count <= SECTOR.TRADERCOUNT[$sector])
	setvar $line SECTOR.TRADERS[$sector][$count]
	setvar $checkCorp 0
	gettext $line $checkCorp "[" "]"
	if ($checkCorp = $corp)
		setvar $nMacro "n" & $nMacro
		add $count 1
		if ($count > SECTOR.TRADERCOUNT[$sector])
			goto :noTarget
		end
	else
		goto :attackMacro
	end
end
goto :noTarget

:attackMacro
# the attack macro shoots 5 times, then re-checks the sector.
send "q mnt*  q  a " $nMacro "y  " $figs "*  *  l  " $planet "*   mnt*  q  a " $nMacro "y  " $figs "*  *  l  " $planet "*   mnt*  q  a " $nMacro "y  " $figs "*  *  l  " $planet "*   mnt*  q  a " $nMacro "y  " $figs "*  *  l  " $planet "*   mnt*  q  a " $nMacro "y  " $figs "*  *  l  " $planet "*  c"
waitFor "<Enter Citadel>"
goto :scanSec

:noTarget
setDelayTrigger delay :delay 250
pause
:delay
echo ANSI_12 "*NO Targets*"
goto :triggers

# this routine is oz's
:quickStats
setVar $pos2 2
send "/"
waitFor "Hlds"
setTextLineTrigger corp :corp "Corp"
pause

# this routine is oz's
:corp
getWordPos CURRENTLINE $pos "Corp"
add $pos 4
cutText CURRENTLINE $corp $pos $pos2
isNumber $number $corp
if ($number = 0)
	subtract $pos2 1
	cutText CURRENTLINE $corp $pos $pos2
end
stripText $corp " "
return

:egoBanner
echo ANSI_14 "***"
echo ANSI_14 "                                 /\         *"
echo ANSI_14 "                                /  \        *"
echo ANSI_14 "                               /    \       *"
echo ANSI_14 "                              / ____ \      *"
echo ANSI_14 "                             / /\   \_\     *"
echo ANSI_14 "                            /   " #17 #42 & #16 "-   \    *"
echo ANSI_14 "                           /    " #245 "\_     \   *"
echo ANSI_14 "                          /______________\  *"
echo ANSI_14 "                          www.tw-cabal.com"
return