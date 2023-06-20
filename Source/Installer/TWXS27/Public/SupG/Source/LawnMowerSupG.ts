#SupGLawnMower

getInput $numFigs "Number of figs to lay per sector?"
isNumber $heh $numfigs
if ($heh)
	if ($numfigs = 0)
		setVar $figLay "No"
	else
		setVar $figLay "Yes"
	end
end
echo ANSI_15 "*Density scan while mowing? (Pointless if CN9 = ALL KEYS)"
getConsoleInput $heh singlekey
lowercase $heh
if ($heh = "y")
	setVar $scan 1
else
	setVar $scan 0
end

send "d"
:top
setVar $send ""
setVar $ptorp 0
setVar $stardock 0
setVar $cnterarray 0
:wait
setTextTrigger sector :sector "] (?=Help)? :"
setTextLineTrigger getdest :dest "Warping to Sector"
pause

:sector
killtrigger getdest
killtrigger nav
getText CURRENTLINE $current "]:[" "] (?=Help)? :"
goto :wait

:dest
killtrigger sector
killtrigger nav
getWord CURRENTLINE $destination 4
if ($destination < 0) OR ($destination > SECTORS)
	goto :top
end
getDistance $dist $current $destination
if ($dist = 1)
	goto :singlehop
end

:nonadj
killtrigger single
setTextTrigger go :go "The shortest path"
setTextLineTrigger nogo :nogo "Do you want to engage the TransWarp drive? Yes"
pause

:nogo
killtrigger go
killtrigger nav
goto :wait

:go
killtrigger nogo
killtrigger nav
setVar $init 1
:getpath
setTextLineTrigger path :path2
pause

:path2
setVar $line CURRENTLINE
if ($line = "")
	goto :mow
end
stripText $line ">"
stripText $line "("
stripText $line ")"
if ($init = 1)
	setVar $cnter 2
	setVar $init 0
else
	setVar $cnter 1
end
:cnter
getWord $line $sector $cnter
if ($sector <> 0)
	add $cnterarray 1
	setVar $sect[$cnterarray] $sector
	add $cnter 1
	goto :cnter
end
goto :getpath

:mow
send "N"
:input
waitfor "Command [TL="
echo ANSI_15 "*1. Warp to " $destination
if ($destination > 10) AND ($destination <> STARDOCK)
	echo ANSI_15 "*2. Warp and photon into " $destination 
end
if ($destination = STARDOCK)
	echo ANSI_15 "*3. Warp to Stardock and land"
end
echo ANSI_15 "*Any Other Key. Quit"
getConsoleInput $heh singlekey
upperCase $heh
if ($heh = 1)
	goto :warpit
elseif ($heh = 2) AND ($destination > 10) AND ($destination <> STARDOCK)
	setVar $ptorp 1
	goto :warpit
elseif ($heh = 3) AND ($destination = STARDOCK)
	setVar $stardock 1
	goto :warpit
else
	goto :top
end

:warpit
setVar $spanky 0
:spanky
if ($spanky < $cnterarray)
	add $spanky 1
	setVar $sender ""
	if ($spanky = $cnterarray) AND ($ptorp = 1)
		setVar $sender $sender & "cpy   " & $sect[$spanky] & "*q "
	end
	setVar $sender $sender & "m" & $sect[$spanky] & "*"
	if ($sect[$spanky] > 10) and (PORT.CLASS[$sect[$spanky]] <> 9)
		setVar $sender $sender & "  za9999** "
		if ($figLay = "Yes")
			setVar $sender $sender & "ft" & $numFigs & "*zcd*  "
		end
	end 
	if ($scan = 1)
		setVar $sender $sender & "sd"
	end
	if ($spanky = $cnterarray) AND ($stardock = 1)
		setVar $sender $sender & "ps"
	end
	mergeText $send $sender $send
	goto :spanky
end
send $send
goto :top

:singlehop
killtrigger non
setVar $send "  za9999**  "
if ($figLay = "Yes") AND ($destination <> STARDOCK) AND ($destination > 10)
	setVar $send $send & "ft" & $numFigs & "*zcd*  "
end
if ($scan = 1)
	setVar $send $send & "sd"
end
send $send
goto :top
