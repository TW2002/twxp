#Rincrast's "FigMe" Reloader script, version 1.1
#Works with Rinbot and is NEEDED for the Rinbot figme feature
#Script will attempt to restore 1000 shields if "reload shields" feature is on
#It will prompt for the number of fighters per attempt to reload and will make two attempts every time an enemy attacks
#Version 1.1 added anouter * to the macro to get it out of the corporate memo mode if it gets stuck there
#Version 1.1.1 took out the spaces after some of the *'s so that the edit in version 1.1 actually works :)
#Version 1.1.2 took space out of the shield reloader so that it REALLY works! :)

loadVar $reloadShields
loadVar $numFigsToReload
cutText CURRENTLINE $location 1 7
stripText $location " "
if ($location <> "Citadel")
	send "'This script must be run from a citadel.*"
	setVar $reloadShields 0
	saveVar $reloadShields
	setVar $numFigsToReload 0
	saveVar $numFigsToReload
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
if ($numFigsToReload = 0)
	:getNumFigs
	echo ANSI_15 & "*How many fighters do you want to reload"
	getInput $numFigsToReload "in one burst? "
	isNumber $test $numFigsToReload
	if ($test = 0)
		echo ANSI_15 & "*Invalid number of fighters.*"
		goto :getNumFigs
	end
	if ($numFigsToReload < 1)
		echo ANSI_15 & "*Invalid number of fighters.*"
		goto :getNumFigs
	end
end
if ($location = "Citadel")
	send "q"
end
send "d"
waitFor "Planet #"
getWord CURRENTLINE $stockPlanet 2
stripText $stockPlanet "#"
send "c"
if ($reloadShields = "y")
	setVar $reloadNow "gf100* q mnt* q tfyt" & $numFigsToReload & "**** qqqq* tsyt1000**** qqqq* l " & $stockPlanet & "* c"
elseif ($reloadShields = "n")
	setVar $reloadNow "q mnt* q tfyt" & $numFigsToReload & "**** qqqq* l " & $stockPlanet & "* c"
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
send "'*Rincrast's FigMe reloader script version 1.1.2 now active! Script will re-fig an ally in the sector over planet " & $stockPlanet & ".**"
if ($reloadShields = "y")
	send "'I WILL restock his/her shields.*"
else
	send "'I will NOT restock his/her shields.*"
end
:reload
# Kaboom launches a wave of fighters at the blarg
# Kaboom deploys some fighters.
waitFor "launches a wave of fighters"
getWord CURRENTLINE $test 1
if ($test = "F") or ($test = "R") or ($test = "P") or ($test = "'") or ($test = "`")
	goto :reload
else
	send $reloadNow
	send $reloadNow
	goto :reload
end