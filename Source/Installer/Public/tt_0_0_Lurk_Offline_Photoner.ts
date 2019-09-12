# Script Name	: The Cabal's Offline Loading Adjacent Photon from Planet Script (OLAP)
# Author        : Traitor <traitor@tw-cabal.com> 
# Description   : An adjacent photon script that is run from your cit.

echo ANSI_11 "Traitor's LOLAP Version 1.01 5/24/2005"

# Set initial variables
setArray $figSec SECTORS
setvar $path "dataminer\" & GAMENAME & "-"
setvar $figFileName "FIGGEDSECTORS.TXT"
setvar $adjFileName "adjsectors.txt"
setvar $backDoorFileName "backDoors.txt"

# ----====[ Get user input ]====----
:getStartSec
loadvar $LOLAP_StartSec
if ($LOLAP_StartSec = "") OR ($LOLAP_StartSec = 0)
	echo ANSI_12 "Must have a Starting Sector Number!"
	halt
else
	setvar $startSec $LOLAP_StartSec
end
echo ANSI_10 "**This is the starting sector number: " & $startSec & "**"

:getFigs
echo "**" ANSI_10 "Getting Figs from Sector Parameters"
setvar $count 1
while ($count <= SECTORS)
	getsectorparameter $count "figged" $figSec[$count]
	add $count 1
end

:doneGetFigs
echo "**" ANSI_10 "At :doneGetFigs"
goto :waitForPlanetEntry
pause

:waitForPlanetEntry
echo ANSI_12 "****Now waiting for you get on the Planet Command Prompt!**" ANSI_7
waitfor "Planet command (?=help)"
:start
send "'Running Traitor's L.O.L.A.P. Script!! Photons locked and loaded!*"
send "cp"
goto :waitForEnemy

:waitForEnemy
setTextLineTrigger limpet :limpet "Limpet mine in"
setTextLineTrigger fighter :fighter "Deployed Fighters Report Sector"
setTextLineTrigger timeout :timeout "INACTIVITY WARNING:"
pause

:timeout
killTrigger fighter
killtrigger limpet
killtrigger timeout
send "'Running Traitor's L.O.L.A.P. Script!! Photons locked and loaded!*"
goto :waitForEnemy

:limpet
killTrigger fighter
killtrigger limpet
killtrigger timeout
getWord CURRENTLINE $hitSec 4
getWord CURRENTLINE $spoofCheck 1
goto :check

:fighter
killTrigger limpet
killtrigger fighter
killtrigger timeout
getWord CURRENTLINE $hitSec 5
stripText $hitSec ":"
getWord CURRENTLINE $spoofCheck 1
goto :check

:check 
if ($spoofCheck <> "Deployed") AND ($spoofCheck <> "Limpet")
	goto :waitForEnemy
else
	goto :getAdjFig
end

:getAdjFig
setvar $count SECTOR.BACKDOORCOUNT[$hitSec]
while ($count > 0)
	if ($figSec[SECTOR.BACKDOORS[$hitSec][$count]] = 1)
		send SECTOR.BACKDOORS[$hitSec][$count] "*  y  c  p  y  " $hitSec "*  q  p" $startSec "*y"
		settextlinetrigger firedOK :firedOK "Planetary TransWarp Drive Engaged!"
		settextlinetrigger notFired :notFired "That is not an adjacent sector"
		pause
	end
	subtract $count 1
end
setvar $count SECTOR.WARPINCOUNT[$hitSec]
while ($count > 0)
	if ($figSec[SECTOR.WARPSIN[$hitSec][$count]] = 1)
		send SECTOR.WARPSIN[$hitSec][$count] "*  y  c  p  y  " $hitSec "*  q  p" $startSec "*y"
		settextlinetrigger firedOK :firedOK "Planetary TransWarp Drive Engaged!"
		settextlinetrigger notFired :notFired "That is not an adjacent sector"
		pause
	end
	subtract $count 1
end
goto :waitForEnemy

:firedOK
killtrigger firedOK
killtrigger notFired
send "'Photon Fired from " SECTOR.BACKDOORS[$hitSec][$count] " into sector " $hitSec "!*"
echo ANSI_12 "**Photon Fired from " SECTOR.BACKDOORS[$hitSec][$count] " into sector " $hitSec "!*"
echo ANSI_12 "Pausing Script!"
pause
		
:notFired
killtrigger firedOK
killtrigger notFired
echo ANSI_12 "*Too Quick!"
send "q  p"
goto :waitForEnemy

halt