:xenter
	gosub :PLAYER~quikstats
	loadvar $game~game_menu_prompt
	isNumber $test $bot~parm1
	if ($test = FALSE)
		setVar $bot~parm1 1
	else
		if ($bot~parm1 <= 0)
			setVar $bot~parm1 1
		end
	end
	getWordPos $bot~user_command_line $pos "fill"
	if ($pos > 0)
		setVar $refill TRUE
	else
		setVar $refill FALSE
	end
	setVar $startingLocation $PLAYER~CURRENT_PROMPT
	setVar $BOT~validPrompts "Command Citadel"
	gosub :BOT~checkStartingPrompt
	if ($startingLocation = "Citadel")
		send "q m n t *"
		gosub :PLANET~getPlanetInfo
		send "c "
	end
:exit_xenter
	setVar $i 1
		if ($startingLocation = "Command")
			setvar $exit_mac "q y * "
			setvar $exit_enter " t* * *"&$BOT~password&"*    *    *       za9999*   z*   /"
		else
			setvar $exit_mac "r   y   * * "
			setvar $exit_enter " t* * *"&$BOT~password&"*    *    *    m * * *   q  *    *    *     za9999*   z*   f z1* z c d *  l j"&#8&$planet~planet&"* c  /"
		end

	while ($i <= $bot~parm1)
		killtrigger 1
		killtrigger 2
		killtrigger 3
		send $exit_mac
		settexttrigger 1 :pickgame "Selection (? for menu)"
		settexttrigger 2 :enter_choice_xenter "Enter your choice:"
		settexttrigger 3 :pickgame $game~game_menu_prompt
		pause
		:enter_choice_xenter

		killtrigger 1
		killtrigger 2
		killtrigger 3
		send $exit_enter
		waitOn #179

		if ($startinglocation = "Command")
			if (($PLAYER~CURRENT_SECTOR > 10) and ($PLAYER~CURRENT_SECTOR <> $MAP~STARDOCK))
				if ($refill = TRUE)
					gosub :player~topoff
				else
					if ($i = $bot~parm1)
						if ($startingLocation = "Command")
							send "f z1* z c d * "
						end
					end
				end
			end
		end
		add $i 1
	end
	:doneExitEnter

	gosub :PLAYER~quikstats
	if ($bot~parm1 > 1)
		setVar $SWITCHBOARD~message "Exit Enter - " & $bot~parm1 & " times completed.*"
	else
		setVar $SWITCHBOARD~message "Exit Enter.*"
	end
	gosub :SWITCHBOARD~switchboard

	goto :bot~wait_for_command
	:pickgame
		killtrigger 2
		killtrigger 3
		send $BOT~letter&"  *  "
		waiton "[Pause]"
		send " * "
		goto :enter_choice_xenter
goto :bot~wait_for_command

