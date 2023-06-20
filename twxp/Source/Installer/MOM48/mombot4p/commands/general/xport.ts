	gosub :BOT~loadVars
	loadVar $bot~safe_ship

	if (($bot~parm1 = "?") or ($bot~parm1 = "help"))
		goto :wait_for_command
	end

   #============================== XPORT (XPORT) ==============================
:x
:xport
	killalltriggers
	gosub :PLAYER~quikstats

	if (($PLAYER~unlimitedGame = FALSE) AND ($PLAYER~TURNS = 0))
		setvar $switchboard~message "I don't have any turns left!*"
		gosub :switchboard~switchboard
		goto :wait_for_command
	end
	setVar $bot~validPrompts "Citadel Command Planet"
	gosub :bot~checkStartingPrompt
	setvar $PLAYER~startingLocation $player~current_prompt
	isNumber $result $bot~parm1
	isNumber $safeship_result $bot~safe_ship
	if ($result < 1)
		setvar $switchboard~message "xport [ship number] [password]*"
		gosub :switchboard~switchboard
		goto :wait_for_command
	end
	if (($bot~parm1 < 1) AND ($safeship_result >= 1))
		if ($bot~safe_ship > 0)
			setVar $bot~parm1 $bot~safe_ship
		else
			setvar $switchboard~message "Safeship parameter not defined correctly.*"
			gosub :switchboard~switchboard
			goto :wait_for_command
		end
	end
	if ($PLAYER~startingLocation = "Citadel")
		if ($PLANET~PLANET = 0)
			send " q "
			gosub :PLANET~getPlanetInfo
			send " q "
		else
			send "qq   "
		end
	elseif ($PLAYER~startingLocation = "Planet")
		if ($PLANET~PLANET = 0)
			gosub :PLANET~getPlanetInfo
		end
		send " q "
	else
		setVar $PLANET~PLANET 0
	end
	setTextLineTrigger bad_ship_trig    :ship_not_available     "That is not an available ship."
	setTextLineTrigger bad_range_trg    :out_of_range           "only has a transport range of"
	setTextLineTrigger cannot_xport     :cannot_xport           "Access denied!"
	setTextTrigger     xport_passw      :xport_password         "Enter the password for"
	setTextLineTrigger xport_good       :xport_good             "Security code accepted, engaging transporter control."
	if ($bot~parm2 = "")
		send "x   " & $bot~parm1 & "*    "
	else
		send "x  " & $bot~parm1 & "*"
	end
	pause

:ship_not_available
	setVar $SWITCHBOARD~message "That ship is not available.*"
	goto :out_of_xport
:out_of_range
	setVar $SWITCHBOARD~message "That ship is out of range.*"
	goto :out_of_xport
:xport_good
	setVar $SWITCHBOARD~message "Xport complete.*"
	if ($command = "x")
		setVar $bot~safe_ship $PLAYER~SHIP_NUMBER
		saveVar $bot~safe_ship
		echo "*" ANSI_14 "[" ANSI_15 "Safe ship auto-set to last ship: " $PLAYER~SHIP_NUMBER ANSI_14 "]*" ANSI_7
	end
	goto :out_of_xport
:xpass_bad
	setVar $SWITCHBOARD~message "Incorrect ship password!*"
	waitfor "Choose which ship to beam to"
	goto :out_of_xport
:cannot_xport
	setVar $SWITCHBOARD~message "Cannot xport to that ship!*"
	goto :out_of_xport
:xport_password
	killalltriggers
	setTextLineTrigger xport_ok  :xport_good "Security code accepted, engaging transporter control."
	setTextLineTrigger xpass_bad :xpass_bad "SECURITY BREACH! Invalid Password, unable to link transporters."
	send $bot~parm2 & "*   "
	pause
:out_of_xport
	killalltriggers
	send "    *    "
	if ((($PLAYER~startingLocation = "Citadel") OR ($PLAYER~startingLocation = "Planet")) AND $PLANET~PLANET <> 0)
		gosub :PLANET~landingSub
	end
	echo "**"
	gosub :SWITCHBOARD~switchboard
	goto :wait_for_command
#============================== END XPORT (XPORT) SUB ==============================

:wait_for_command
	setVar $BOT~help[1] $BOT~tab&"xport [ship number] [password] "
	setVar $BOT~help[2] $BOT~tab&"  - Attempts to xport into another ship"
	gosub :bot~helpfile
halt

# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\module_includes\bot\checkstartingprompt\bot"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\planet\landingsub\planet"
