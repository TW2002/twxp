#Rincrast's Tholian Reloader script, version 1.1.1
#Works with Rinbot and is NEEDED for the rinbot reloader feature
#

loadVar $reloadShields
cutText CURRENTLINE $location 1 7
stripText $location " "
if ($location <> "Planet") AND ($location <> "Citadel")
	send "'This script must be run from a citadel or a planet surface.*"
	setVar $reloadShields 0
	saveVar $reloadShields
	halt
end	

:initialize
if ($reloadShields = 0)
	:getShieldyn
	echo ANSI_15 & "*Would you like the reloader to restock your shields? "
	getConsoleInput $reloadShields singlekey
	lowerCase $reloadShields
	if ($reloadShields <> "y") AND ($reloadShields <> "n")
		echo ANSI_4 & "*Invalid input.*"
		goto :getShieldyn
	end
end
if ($location = "Citadel")
	send "q"
end
send "d"
waitFor "Planet #"
getWord CURRENTLINE $stockPlanet 2
stripText $stockPlanet "#"
send "q"
waitFor "Command [TL="
send "c;"
#Maximum Shields:16,000
waitFor "Maximum Shields:"
setVar $numShields CURRENTLINE
getWordPos $numShields $maxPos "Maximum"
add $maxPos 16
cutText $numShields $numShields $maxPos 6
stripText $numShields " "
stripText $numShields ","
divide $numShields 10
send "q"
if ($reloadShields = "y")
	setVar $reloadNow "l " & $stockPlanet & "* c gf" & $numShields & "* q mnt* q"
elseif ($reloadShields = "n")
	setVar $reloadNow "l " & $stockPlanet & "* mnt* q"
end
send "\"
waitFor "Online Auto Flee"
getWord CURRENTLINE $fleetest 5
if ($fleetest = "enabled.")
	send "\"
end
send "|"
waitFor "all messages."
getWord CURRENTLINE $comstest 1
if ($comstest = "Silencing")
	send "|"
end
send "'*Rincrast's Tholian reloader script version 1.1.1 now active! FIX BAYONETS! They won't get past ME! <G>*Using planet " & $stockPlanet & ".**"
if ($reloadShields = "y")
	send "'Reloader WILL restock shields.*"
else
	send "'Reloader will NOT restock shields.*"
end
:reload
# Shipboard Computers Coke 1 destroyed 5 shield points and 30 fighters.
# Kaboom deploys some fighters.
waitFor "fighters."
getWord CURRENTLINE $test 1
setVar $testLine CURRENTLINE
getWordPos $testLine $figPos "fighters."
setVar $testThisPos $figPos - 5
cutText $testLine $ignoreWord $testThisPos 500
stripText $ignoreWord " fighters."
if ($test = "F") or ($test = "R") or ($test = "P") or ($test = "'") or ($test = "`")
	goto :reload
elseif ($ignoreWord = "some")
	goto :reload
else
	send $reloadNow
	goto :reload
end