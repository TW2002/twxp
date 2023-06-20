gosub :BOT~loadVars

if (($bot~parm1 = "?") or ($bot~parm1 = "help"))
	goto :wait_for_command
end


	setVar $target $bot~parm1 
	isNumber $isNumber $target 
	if ($isNumber <> TRUE)
		setVar $SWITCHBOARD~message "Sector entered is not a number.  Halting.*"
		gosub :SWITCHBOARD~switchboard
		goto :wait_for_command
	end
	if (($target <= 0) OR ($target > SECTORS))
		setVar $SWITCHBOARD~message "Sector is out of bounds.  Halting.*"
		gosub :SWITCHBOARD~switchboard
		goto :wait_for_command
	end
	gosub :PLAYER~quikstats
	setVar $BOT~validPrompts "Citadel Command Computer"
	gosub :BOT~checkStartingPrompt
	if ($PLAYER~PHOTONS <= 0)
		setVar $SWITCHBOARD~message "You don't have any photons! Halting.*"
		gosub :SWITCHBOARD~switchboard
		goto :wait_for_command		
	end

:shoot1
	setvar $send ""
	if ($player~current_prompt <> "Computer")
		setvar $send "c  "
	end
	setvar $send $send&"p  y  "&$target&"**  q*  "
	killtrigger shot
	killtrigger missed
	send $send
	setTextLineTrigger shot :shot1 "Photon Missile launched into sector "&$target
	setTextTrigger missed :missed1 "<Computer deactivated>"
	pause

:missed1
	killalltriggers
	setVar $SWITCHBOARD~message "Photon not fired.  Is the sector adjacent?*"
	gosub :SWITCHBOARD~switchboard
	goto :wait_for_command

:shot1
	killalltriggers
	setVar $SWITCHBOARD~message "Photon fired -> Sector "&$target&"*"
	gosub :SWITCHBOARD~switchboard
	goto :wait_for_command


:wait_for_command
	setVar $BOT~help[1] $BOT~tab&"Fires photon into adjacent sector.  "
	gosub :bot~helpfile
halt

#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\checkstartingprompt\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
