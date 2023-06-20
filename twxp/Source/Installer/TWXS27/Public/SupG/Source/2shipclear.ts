# TWX SupG Script  : Fire Horse Advanced Online Combat Script
# Author           : SupG and Res Judicata
# Description      : Script Requires 2 ships and a warpable planet,
#                    clears sectors using 2 ships for safety.
#                    Warps planet to target sector after xporting.
#                    Can kill 1 hop or several Xport range dictates.
# Trigger Point    : Citadel command prompt
# Warnings         : Don't run it without checking max xport range
#                    Script has no defences but will xport upon being IG'd
#                    Will Destroy or be Destroyed. Use with Extreme Caution.
# Other            : A modified version of RES-EDIT Macro first used in WTC.
#                  : Muhahaha..
#www.scripterstavern.com


# check if we can run it from here
cutText CURRENTLINE $location 1 7

if ($location <> "Citadel")
        clientMessage "This script must be run from the citadel"
        halt
end

logging off
getInput $ship1 "Ship 1(other ship)" 0
getInput $ship2 "Ship 2(current ship)" 0
getInput $densitymax "Maximum density for single hop clearing" 0
getInput $planet "Planet Number" 0
:top
send "i"
setTextLineTrigger cursec :current "Current Sector :"
pause

:current 
getWord CURRENTLINE $current 4
getInput $sector "Sector?" 0
setVar $send "qqx" & $ship1 & "*q"
:warpit
getCourse $lane $current $sector
if ($lane = "-1")
	clientMessage "Not enough warp data"
	goto :top
end
if ($lane = 1)
	send "qqsd"
	waitFor "Relative Density Scan"
	waitFor "(?="
	send "l" $planet "*c"
	if (SECTOR.DENSITY[$sector] > $densitymax)
		send "'Target Sector has " SECTOR.DENSITY[$sector] " density, stopping...*"
		goto :top
	end
end
setVar $spanky 1
setVar $count $lane
add $count 1
:spanky
if ($spanky < $count)
	add $spanky 1
	#macro by Xide
	setVar $sender "m" & $lane[$spanky] & "*za9999**  ft1*zcd" 
	setVar $send $send & $sender
	goto :spanky
end
setVar $sender "x" & $ship2 & "*"
setVar $send $send & $sender

:xport
setVar $send $send & "ql" & $planet & "*  cp" & $sector & "*ys"
send $send
waitfor "<Scan Sector>"
killalltriggers
setTextTrigger citmine :citmine "Mined Sector: Do you wish to Avoid this sector in the future? (Y/N)"
setTextTrigger incit :incit "Citadel command (?=help)"
pause

:citmine
send "n"

:incit
killalltriggers
setDelayTrigger scan :scan 3000
pause

:scan 
send "qqsh"
waitfor "Sector  : " & $sector
send "l" $planet "*c"
goto :top

