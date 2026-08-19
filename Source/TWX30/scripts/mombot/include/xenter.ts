:xenter~run
:xenter~xenter
gosub :player~quikstats
loadvar $game~game_menu_prompt

setvar $xenter~startinglocation $player~current_prompt
setvar $bot~validprompts "Command Citadel"
gosub :player~checkstartingprompt
if ($xenter~startinglocation = "Citadel")
	send "q m n t *"
	gosub :planet~getplanetinfo
	send "c "
end

:xenter~exit_xenter
if ($xenter~startinglocation = "Command")
	setvar $xenter~exit_mac "q y * "
	setvar $xenter~exit_enter " t* * *"&$bot~password&"*    *    *       za9999*   z*   /"
else
	setvar $xenter~exit_mac "r   y   * * "
	setvar $xenter~exit_enter " t* * *"&$bot~password&"*    *    *    m * * *   q  *    *    *     za9999*   z*   f z1* z c d *  l j"&#8&$planet~planet&"* c  /"
end

killtrigger 1
killtrigger 2
killtrigger 3
killtrigger xenterpromptcheck
send $xenter~exit_mac
settexttrigger 1 :pickgame "Selection (? for menu)"
settexttrigger 2 :enter_choice_xenter "Enter your choice:"
if ($game~game_menu_prompt <> 0)
	settexttrigger 3 :pickgame $game~game_menu_prompt
end
setdelaytrigger xenterpromptcheck :xenter_check_menu_prompt 100
pause

:xenter_check_menu_prompt
setvar $xenter~line currentline
getwordpos $xenter~line $xenter~pos "Enter your choice"
if ($xenter~pos > 0)
	goto :enter_choice_xenter
end
getwordpos $xenter~line $xenter~pos "Selection (? for menu)"
if ($xenter~pos > 0)
	goto :pickgame
end
if ($game~game_menu_prompt <> 0)
	getwordpos $xenter~line $xenter~pos $game~game_menu_prompt
	if ($xenter~pos > 0)
		goto :pickgame
	end
end
setdelaytrigger xenterpromptcheck :xenter_check_menu_prompt 100
pause

:xenter~enter_choice_xenter
killtrigger 1
killtrigger 2
killtrigger 3
killtrigger xenterpromptcheck
settexttrigger xenterpause :xenter_continue_entry_pause "[Pause]"
settexttrigger xenterpassword :xenter_continue_password "A password is required to enter this game."
settexttrigger xentercommand :xenter_entered_game "Command ["
settexttrigger xenterplanet :xenter_entered_game "Planet command (?=help) [D]"
settexttrigger xentercitadel :xenter_entered_game "Citadel command (?=help)"
setdelaytrigger xenterenteredcheck :xenter_check_entered_game 100
send "T**"
pause

:xenter_continue_entry_pause
killtrigger xenterenteredcheck
send "*"
settexttrigger xenterpause :xenter_continue_entry_pause "[Pause]"
settexttrigger xenterpassword :xenter_continue_password "A password is required to enter this game."
settexttrigger xentercommand :xenter_entered_game "Command ["
settexttrigger xenterplanet :xenter_entered_game "Planet command (?=help) [D]"
settexttrigger xentercitadel :xenter_entered_game "Citadel command (?=help)"
setdelaytrigger xenterenteredcheck :xenter_check_entered_game 100
pause

:xenter_continue_password
killtrigger xenterenteredcheck
send $bot~password & "**  *  *  "
settexttrigger xenterpause :xenter_continue_entry_pause "[Pause]"
settexttrigger xentercommand :xenter_entered_game "Command ["
settexttrigger xenterplanet :xenter_entered_game "Planet command (?=help) [D]"
settexttrigger xenterfigs :xenter_figs "Option?"
settexttrigger xentercitadel :xenter_entered_game "Citadel command (?=help)"
setdelaytrigger xenterenteredcheck :xenter_check_entered_game 100
pause

:xenter_figs
send "a 9999 * "
settexttrigger xenterattack :xenter_attack "<Attack>"
pause

:xenter_attack
settexttrigger xenterfigs :xenter_figs "Option?"
pause

:xenter_check_entered_game
setvar $xenter~line currentline
getwordpos $xenter~line $xenter~pos "Command ["
if ($xenter~pos > 0)
	goto :xenter_entered_game
end
getwordpos $xenter~line $xenter~pos "Planet command (?=help) [D]"
if ($xenter~pos > 0)
	goto :xenter_entered_game
end
getwordpos $xenter~line $xenter~pos "Citadel command (?=help)"
if ($xenter~pos > 0)
	goto :xenter_entered_game
end
setdelaytrigger xenterenteredcheck :xenter_check_entered_game 100
pause

:xenter_entered_game
killtrigger xentercommand
killtrigger xenterplanet
killtrigger xentercitadel
killtrigger xenterpause
killtrigger xenterpassword
killtrigger xenterenteredcheck
gosub :player~currentprompt
if ($xenter~startinglocation = "Citadel")
	if ($player~current_prompt = "Planet")
		send "c"
		waiton "Citadel command"
	elseif ($player~current_prompt = "Command")
		gosub :planet~landingsub
	end
elseif ($xenter~startinglocation = "Command")
	if ($player~current_prompt = "Citadel")
		send "q q "
		waiton "Command ["
	elseif ($player~current_prompt = "Planet")
		send "q "
		waiton "Command ["
	end
end
return

:pickgame
killtrigger 1
killtrigger 2
killtrigger 3
killtrigger xenterpromptcheck
send $bot~letter&"  *  "
waiton "[Pause]"
send " * "
goto :xenter~enter_choice_xenter

:xenter~xenterended
return

include "source\include\player"
include "source\include\planet"
include "source\include\game"
