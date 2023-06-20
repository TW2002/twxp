:FindJumpSector
	setVar $RED_adj 0
	if ($startingLocation = "Citadel")
		send "qt*t1*q* "
	else
		send "qq* "
	end

	setvar $k 1
	while (SECTOR.BACKDOORS[$target][$k] > 0)
		setVar $RED_adj SECTOR.BACKDOORS[$target][$k]
		gosub :test_red_sector
		if ($foundSector = true)
			goto :SectorLocked
		end
		add $k 1
	end

	setVar $i 1
	while (SECTOR.WARPSIN[$target][$i] > 0)
		setVar $RED_adj SECTOR.WARPSIN[$target][$i]
		gosub :test_red_sector
		if ($foundSector = true)
			goto :SectorLocked
		end
    	add $i 1
	end

	:NoAdjsFound
		setVar $RED_adj 0
		return

	:SectorLocked
		if ($target = $MAP~stardock)
			setVar $MAP~backdoor $RED_adj
			saveVar $MAP~backdoor
		end
		return


:test_red_sector
	setvar $foundSector false
	send "m " & $RED_adj & "* y"
	setTextTrigger TwarpBlind 			:TwarpBlind "Do you want to make this jump blind? "
	setTextTrigger TwarpLocked			:TwarpLocked "All Systems Ready, shall we engage? "
	setTextLineTrigger TwarpVoided			:TwarpVoided "Danger Warning Overridden"
	setTextLineTrigger TwarpAdj			:TwarpAdj "<Set NavPoint>"
	pause
	:TwarpAdj
	gosub :killfindjumpsectors
	send " * "
	return

	:TwarpVoided
	gosub :killfindjumpsectors
	send " N N "
	return

	:TwarpLocked
	gosub :killfindjumpsectors
	send " * "
	setvar $foundSector true
	return

	:TwarpBlind
	gosub :killfindjumpsectors
	send " N "
return


:killfindjumpsectors
	killtrigger TwarpBlind
	killtrigger TwarpLocked
	killtrigger TwarpVoided
	killtrigger TwarpAdj
return
