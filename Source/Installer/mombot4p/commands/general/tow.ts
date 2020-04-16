gosub :BOT~loadVars

if (($bot~parm1 = "?") or ($bot~parm1 = "help"))
	goto :wait_for_command
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
	setVar $BOT~help[1]  $BOT~tab&"tow - tow another ship "
	gosub :bot~helpfile
halt

# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\module_includes\bot\checkstartingprompt\bot"
