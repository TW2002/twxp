:FindJumpSector
	setVar $i 1
	setVar $RED_adj 0
	send "q t*t1* q*"
	while (SECTOR.WARPSIN[$target][$i] > 0)
		setVar $RED_adj SECTOR.WARPSIN[$target][$i]
		if ($RED_adj > 10)
			send "m " & $RED_adj & "* y"
			setTextTrigger TwarpBlind           :TwarpBlind "Do you want to make this jump blind? "
			setTextTrigger TwarpLocked          :TwarpLocked "All Systems Ready, shall we engage? "
			setTextLineTrigger TwarpVoided      :TwarpVoided "Danger Warning Overridden"
			setTextLineTrigger TwarpAdj         :TwarpAdj "<Set NavPoint>"
			pause
			:TwarpAdj
				gosub :killfindjumpsectors
				send " * "
				return

			:TwarpVoided
				gosub :killfindjumpsectors
				send " N N "
				goto :TryingNextAdj

			:TwarpLocked
				gosub :killfindjumpsectors
				goto :SectorLocked

			:TwarpBlind
				gosub :killfindjumpsectors
				send " N "
		end
		:TryingNextAdj
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

:killfindjumpsectors
	killtrigger TwarpBlind
	killtrigger TwarpLocked
	killtrigger TwarpVoided
	killtrigger TwarpAdj
return
