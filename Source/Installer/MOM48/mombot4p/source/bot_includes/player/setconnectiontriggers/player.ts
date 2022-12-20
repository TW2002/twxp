:Discod
	   	setVar $TagLine				"["&$bot~command&"]"
		setVar $TagLineB			"["&$bot~command&"]"
		killAllTriggers
	   	Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Disconnected **"
	   	:Disco_Test
		if (CONNECTED <> TRUE)
			setDelayTrigger		Emancipate_CPU		:Emancipate_CPU 3000
			Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Auto Resume Initiated - Awaiting Connection!**"
			pause
			:Emancipate_CPU
			goto :Disco_Test
		end
		waitfor "(?="
		setDelayTrigger		WaitingABit		:WaitingABit	3000
		Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Connected - Waiting For Command Prompt!**"
		pause
		:WaitingABit
		killAllTriggers
		gosub :player~quikstats
		if ($player~current_prompt = "Command")
			send ("'{" & $switchboard~bot_name & "} "&$TagLineB&" - Restarting!**")
		    	waitfor "Message sent on sub-space channel"
			goto :inac
		elseif ($player~current_prompt = "Citadel")
			send ("'{" & $switchboard~bot_name & "} "&$TagLineB&" - Restarting!**")
			waitfor "Message sent on sub-space channel"
	   		send "qqqq**"
	   		goto :inac
	   	else
	   		send (" p d 0* 0* 0* * *** * c q q q q q z 2 2 c q * z * *** * * '" & $TagLineB & "Attempting to Reach Correct Prompt...*")
			setTextLineTrigger	EMQ_COMPLETE		:EMQ_DELAY "Attempting to Reach Correct Prompt..."
			setDelayTrigger 	EMQ_DELAY		:EMQ_DELAY 3000
			pause
			:EMQ_DELAY
				killAllTriggers
				goto :Disco_Test
		end

:setConnectionTriggers
	killtrigger discod1
	killtrigger discod2
	SetEventTrigger     Discod1     :Discod         "CONNECTION LOST"
	SetEventTrigger     Discod2     :Discod         "Connections have been temporarily disabled."
return
