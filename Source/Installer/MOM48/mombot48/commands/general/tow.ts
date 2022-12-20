gosub :BOT~loadVars


if (($bot~parm1 = "?") or ($bot~parm1 = "help"))
	goto :wait_for_command
end

if ($bot~parm1 = "list")
	goto :tow_list
end
# ============================== START TOW (TOW) ==============================
:tow
	gosub :PLAYER~quikstats
	setVar $bot~validPrompts "Command"
	gosub :bot~checkstartingprompt
	isNumber $test $bot~parm1
	if ($test = FALSE)
		setVar $SWITCHBOARD~message "Ship to tow must be entered as a number*"
		gosub :SWITCHBOARD~switchboard
		goto :wait_for_command
	elseif ($bot~parm1 < 1)
		setVar $SWITCHBOARD~message "Ship to tow must be entered as a number*"
		gosub :SWITCHBOARD~switchboard
		goto :wait_for_command
	else
		setVar $shipToTow $bot~parm1
	end
	:towCheck
			killalltriggers
			send "w"
			SetTextTrigger towOffContinue   :towCheck "You shut off your Tractor Beam."
				SetTextTrigger towOff           :towContinue "Do you wish to tow a manned ship? (Y/N)"
				pause
		:towContinue
				killalltriggers
				send "*"
				SetTextTrigger towNoGo          :towNoGo "You do not own any other ships in this sector!"
				SetTextTrigger towReady         :towOff "Choose which ship to tow (Q=Quit)"
				pause
	:towOff
		killalltriggers
		send $shipToTow & "*"
				setTextTrigger towNoGo2           :towNoGo2 "Command [TL="
			setTextTrigger Tow_PassWord   :Tow_PassWord "Enter the password for"
			setTextLineTrigger waitOnTow      :goodTow "You lock your Tractor Beam on "
			pause
	:Tow_PassWord
		killalltriggers
		send "*"
		setVar $SWITCHBOARD~message "That ship has a PassWord Set.*"
		gosub :SWITCHBOARD~switchboard
		goto :wait_for_command
	:towNoGo
				killalltriggers
		setVar $SWITCHBOARD~message "There are no ships in the sector I can tow.*"
		gosub :SWITCHBOARD~switchboard
		goto :wait_for_command
	:towNoGo2
				killalltriggers
		setVar $SWITCHBOARD~message "That ship number is not in the sector.*"
		gosub :SWITCHBOARD~switchboard
		goto :wait_for_command
	:goodTow
		killalltriggers
		setVar $SWITCHBOARD~message "Tow locked onto ship number " & $shipToTow & "*"
		gosub :SWITCHBOARD~switchboard
		goto :wait_for_command
# ============================== END TOW (TOW) ==============================

:wait_for_command

	setVar $BOT~help[1]  $BOT~tab&"tow [ship number | list]"
	setVar $BOT~help[2]  $BOT~tab&"      "
	setVar $BOT~help[3]  $BOT~tab&"  Tow ships and display tow list"
	setVar $BOT~help[4]  $BOT~tab&"      "
	setVar $BOT~help[5]  $BOT~tab&"    {ship number}  ship number to tow"
	setVar $BOT~help[6]  $BOT~tab&"           {list}  list all tow ships in sector"
	gosub :bot~helpfile

	halt


:tow_list

:slist
	setVar $scan_macro "w** * "
	gosub :PLAYER~quikstats
	setArray $scan_array 1000
	setVar $player~startingLocation $PLAYER~CURRENT_PROMPT
	setVar $bot~validPrompts "Citadel Command"
	gosub :bot~checkStartingPrompt
	if ($PLAYER~startingLocation = "Citadel")
		send " q "
		gosub :PLANET~getPlanetInfo
		send " q "
	end
	setVar $idx 0
	send $scan_macro
	waitOn "Ship  Sect Name                  Fighters Shields Hops Type"
	waitOn "--------------------------------------------------------------------------"

	setTextTrigger end_of_line4 :end_of_lines "<I> Ship details"
	add $idx 1
	setVar $scan_array[$idx] "                 --<  Available Ship Scan  >--"
	add $idx 1
	setVar $scan_array[$idx] "Ship  Sect Name                  Fighters Shields Hops Type"
	add $idx 1
	setVar $scan_array[$idx] "-----------------------------------------------------------------"

	setTextLineTrigger line_trig :parse_scan_line
	pause
	:parse_scan_line
		setVar $current_line CURRENTLINE
		if ($idx >= 1000)
				goto :end_of_lines
		end
		getWordPos $current_line $em_end "(?=Help)? :"
		if ($em_end > 0)
				goto :end_of_lines
		end
		getWordPos $current_line $em_end "<I> Ship details"
		if ($em_end > 0)
			goto :end_of_lines
		end
		getLength $current_line $length
		if ($length > 70)
			cutText $current_line $current_line 1 70
		end
		if ($current_line <> "")
			add $idx 1
			setVar $scan_array[$idx] $current_line
		end
		setTextLineTrigger line_trig :parse_scan_line
		pause
	:end_of_lines
		killalltriggers
		if ($PLAYER~startingLocation = "Citadel")
			send " l " & $planet~planet & "* c s* "
		end
		gosub :spitItOut
		halt
:SpitItOut
	setvar $switchboard~message ""
	setvar $i 1
	while ($i <= $idx)
		if ($scan_array[$i] <> "0")
			setvar $switchboard~message $switchboard~message & $scan_array[$i] & "*"
		end
		add $i 1
	end
	gosub :switchboard~switchboard
	:continuecommpscan2
return

# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\module_includes\bot\checkstartingprompt\bot"
include "source\bot_includes\planet\getplanetinfo\planet"
