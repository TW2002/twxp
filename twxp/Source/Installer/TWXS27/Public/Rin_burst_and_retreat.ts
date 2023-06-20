#Rincrast's burst and retreat
#Bursts into sector and back out, options to deploy fighters
#Works from planet surface or from citadel; will return to that location on planet when done
#Works in sector too
#Version 1.3 prompts for number of figs to attack with and auto-terminates script if you change ships to avoid problems.
#Version 2.0 also prompts to deploy mines.
#Version 2.1 allows for the moving of a planet into the target sector if desired AND bursting from a citadel prompt
#Version 2.2 -- added a r* to the burst at the end so that it would retreat if the burst didn't kill all of the enemy fighters
#Thanks to Psion -- I borrowed his code for the SetTextOutTrigger thingy

echo ANSI_15 & "*Rincrast's burst and retreat, version 2.2.1*"

:start
if ($numFigsToUse = 0)
	getInput $numFigsToUse "Deploy how many figs in sector? "
	isNumber $test $numFigsToUse
	if ($test = 0)
		echo ANSI_15 & "*Invalid number of fighters.*"
		setVar $numFigsToUse 0
		goto :start
	end
	if ($numFigsToUse < 1)
		echo ANSI_15 & "*Invalid number of fighters.*"
		setVar $numFigsToUse 0
		goto :start
	end
end
:start2
if ($figType = 0)
	echo ANSI_15 & "*What kind of figs to deply? (d, o, t) "
	getConsoleInput $figType singlekey
	lowercase $figType
	if ($figType <> "d") AND ($figType <> "o") AND ($figType <> "t")
		echo ANSI_15 & "*Invalid fighter type.*"
		setVar $figType 0
		goto :start2
	end
end
:getWave
if ($figWave = 0)
	getInput $figWave "Attack with how many fighters? "
	isNumber $test $figWave
	if ($test = 0)
		echo ANSI_15 & "*Invalid number of fighters.*"
		setVar $figWave 0
		goto :getWave
	end
	if ($figWave < 1)
		echo ANSI_15 & "*Invalid number of fighters.*"
		setVar $figWave 0
		goto :getWave
	end
end
:minestart
if ($mineDeploy = 0)
	echo ANSI_15 & "*Deploy mines? "
	getConsoleInput $mineDeploy singlekey
	lowercase $mineDeploy
	if ($mineDeploy <> "y") AND ($mineDeploy <> "n")
		echo ANSI_15 & "*Invalid entry.*"
		setVar $mineDeploy 0
		goto :minestart
	end
	echo ANSI_15 & "*"
	if ($mineDeploy = "y")
		getInput $numArmids "How many Armid Mines? "
		isNumber $test $numArmids
			if ($test = 0)
			echo ANSI_15 & "*Invalid number of mines.*"
			setVar $mineDeploy 0
			goto :minestart
		end
		if ($numArmids < 1)
			echo ANSI_15 & "*Invalid number of mines.*"
			setVar $mineDeploy 0
			goto :minestart
		end
		echo ANSI_15 & "*"
		getInput $numLimps "How many Limpet Mines? "
		isNumber $test $numLimps
			if ($test = 0)
			echo ANSI_15 & "*Invalid number of mines.*"
			setVar $mineDeploy 0
			goto :minestart
		end
		if ($numLimps < 1)
			echo ANSI_15 & "*Invalid number of mines.*"
			setVar $mineDeploy 0
			goto :minestart
		end
	end
end
:movePlanet
if ($movePlanet = 0)
	echo ANSI_15 & "*Move planet into target sector after burst?*(Only applies when burst is started from citadel prompt) "
	getConsoleInput $movePlanet singlekey
	lowercase $movePlanet
	if ($movePlanet <> "y") AND ($movePlanet <> "n")
		echo ANSI_15 & "*Invalid entry.*"
		setVar $movePlanet 0
		goto :movePlanet
	end
end

send "'Rincrast's burst_and_retreat, version 2.2.1 active.*"
echo ANSI_15 & "*Send + to activate burst! Make sure your avoids are cleared!*"
echo ANSI_14 & "STRONGLY recommend testing for one-ways BEFORE*bursting if your ZTM is incomplete!!*"
echo ANSI_14 & "NOTE: If all fighters in the target sector are NOT destroyed, the burst will retreat you back *anyway. HOWEVER, if you enabled the planet move, it will STILL say the planet was warped in.*Check before doing anything!*"
echo ANSI_15 & "Also, keep in mind that if the TWGS max_commands_per_cycle is low you MIGHT get photoned!*"

:waitToBurst
killAllTriggers
setTextLineTrigger xport :xportActivated "Security code accepted, engaging transporter control."
setTextOutTrigger burst :burst "+"
pause

:burst
killAllTriggers
getInput $burstSector "What sector would you like to burst (macro) into? (0 to reset) "
isNumber $test $burstSector
if ($test = 0)
	echo ANSI_4 & "*Invalid sector number.*"
	goto :burst
end
if ($burstSector = 0)
	goto :waitToBurst
end
if ($burstSector < 11)
	echo ANSI_4 & "*Cannot burst into FedSpace!*"
	goto :burst
elseif ($burstSector = STARDOCK)
	echo ANSI_4 & "*Cannot burst into FedSpace!*"
	goto :burst
elseif ($burstSector > SECTORS)
	echo ANSI_4 & "*Invalid sector number.*"
	goto :burst
end
setVar $regBurst "m" & $burstSector & "* z a" & $figWave & "* z n f" & $numFigsToUse & "*" & "c" & $figType & " < z nr* "
setVar $mineBurst "m" & $burstSector & "* z a" & $figWave & "* z n f" & $numFigsToUse & "*" & "c" & $figType & "h1z" & $numArmids & "*cq* h2z" & $numLimps & "*cq* < z nr* "

:verifyprompt
    cutText CURRENTLINE $location 1 7
    stripText $location " "
if ($location = "Citadel")
	send "qd"
	waitFor "Planet #"
	getWord CURRENTLINE $pnum 2
	getWord CURRENTLINE $currentSector 5
	stripText $pnum "#"
	stripText $currentSector ":"
	send "mnt*q"
	waitFor "Command [TL="
elseif ($location = "Planet")
	send "d"
	waitFor "Planet #"
	getWord CURRENTLINE $pnum 2
	getWord CURRENTLINE $currentSector 5
	stripText $pnum "#"
	stripText $currentSector ":"
	send "mnt*q"
	waitFor "Command [TL="
elseif ($location = "Command")
	send "d"
	waitFor "Sector  :"
	getWord CURRENTLINE $currentSector 3
	waitFor "Command [TL="
else
	echo ANSI_15 & "*Must be at Citadel, Planet, or Command prompt to burst!!*"
	goto :waitToBurst	
end

getDistance $dist $burstSector $currentSector
if (($dist = 1) OR ($dist = "-1")) AND ($mineDeploy = "n")
	send "'*Bursting into sector " & $burstSector & " and deploying " & $numFigsToUse & " fighters in it before retreating.**"
	send $regBurst
elseif (($dist = 1) OR ($dist = "-1")) AND ($mineDeploy = "y")
	send "'*Bursting into sector " & $burstSector & " and deploying " & $numFigsToUse & " fighters, " & $numArmids & " armid mines, and " & $numLimps & " limpet mines in it before retreating.**"
	send $mineBurst
else
	if ($location = "Planet")
		send "l" & $pnum & "*" & "mnt*"
	end
	if ($location = "Citadel")
		send "l" & $pnum & "*" & "mnt*"
		send "c"
	end
	echo ANSI_11 "*ONE-WAY or non-adjacent warp selected; script was reset without bursting!*"
	goto :waitToBurst
end
if ($location = "Planet")
	send "l" & $pnum & "*" & "mnt*"
end
if ($location = "Citadel")
	send "l" & $pnum & "*" & "mnt*"
	send "c"
	if ($movePlanet = "y")
		send "p" & $burstSector & "*y"
	end
end
send "'Burst and retreat complete; sector " & $burstSector & " secured.*/"
if ($movePlanet = "y") AND ($location = "Citadel")
	send "'Planet " & $pnum & " has also been moved to the target sector.*"
end
goto :waitToBurst

:xportActivated
waitFor "Command [TL="
send "'Current ship has changed; Rin's Burst_and_Retreat terminated as a precaution.*"
halt