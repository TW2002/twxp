#Rincrast's Quick Planet Gridder
#Bursts into sector, destroys figs, if any, and then calls _ck_saveme.cts to get a pickup
#Works from planet surface or from citadel
#Works in sector too
#Version 1.1 allows for number of figs in attack wave to be entered
#Thanks to Psion -- I borrowed his code for the SetTextOutTrigger thingy

echo ANSI_15 & "*Rincrast's Quick Planet Grid, version 1.1.*"

:start
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

send "'Rincrast's Quick Planet Grid, version 1.1 active.*"
echo ANSI_15 & "*Send ~ (tilde) to activate! Make sure your avoids are cleared!*"
#echo ANSI_15 & "Also, this script attacks with 9999 figs; if that is not enough*to destroy all of the fighters in the burst sector, do NOT*use this script to clear it!*"

:waitToBurst
killAllTriggers
setTextLineTrigger xport :xportActivated "Security code accepted, engaging transporter control."
setTextOutTrigger burst :burst "~"
pause

:burst
killAllTriggers
getInput $burstSector "What sector would you like to burst (macro) into and grid? (0 to reset) "
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
end

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
	echo ANSI_15 "*Must be at Ciadel, Command, or Planet prompt to grid!*"
	goto :waitToBurst
end
getDistance $dist $currentSector $burstSector
if ($dist = 1) OR ($dist = "-1")
	send "'*Planet gridding into sector " & $burstSector & ".**"
	send "m" & $burstSector & "* z a" & $figWave & "* z n *"
#	waitFor "Should they be (D)efensive, (O)ffensive or Charge a (T)oll ?"
	waitFor "<Re-Display>"
	waitFor "Command [TL="
	load _ck_callsaveme.cts
	waitFor "Citadel command (?=help)"
else
	if ($location = "Planet")
		send "l" & $pnum & "*" & "mnt*"
	end
	if ($location = "Citadel")
		send "l" & $pnum & "*" & "mnt*"
		send "c"
	end
	echo ANSI_11 "*Non-adjacent warp selected; script resetting!*"
	goto :waitToBurst
end
send "'Planet grid into sector " & $burstSector & " complete; sector secured.*"
goto :waitToBurst

:xportActivated
waitFor "Command [TL="
send "'Current ship has changed; Rin's quick planet gridder terminated as a precaution.*"
halt