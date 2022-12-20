gosub :BOT~loadVars

if (($bot~parm1 = "?") or ($bot~parm1 = "help"))
	goto :wait_for_command
end


# ======================     START BWARP SUBROUTINES     =================
:Bwarp
:b
	killalltriggers
	if ($bot~parm1 <> $PLAYER~CURRENT_SECTOR)
		gosub  :player~currentPrompt
	else
		gosub :PLAYER~quikstats
	end
	setVar $PLAYER~startingLocation $PLAYER~CURRENT_PROMPT
	setVar $bot~validPrompts "Citadel"
	gosub :bot~checkstartingprompt
	gosub :travelProtections
	gosub :player~bwarp
	goto :wait_for_command
# ======================     END BWARP SUBROUTINES     ==========================


:travelProtections
	isNumber $test $bot~parm1
	if ($test = FALSE)
		setVar $SWITCHBOARD~message "Sector must be entered as a number*"
		gosub :SWITCHBOARD~switchboard
		goto :wait_for_command
	else
		if ($bot~parm2 = "p")
			setVar $player~warpto_p "p z t *"
			if ($bot~parm1 = $MAP~stardock)
				setVar $player~warpto_p "p z s h *"
			end
		else
			isNumber $test $bot~parm2
			if ($test = FALSE)
				setVar $player~warpto_p ""
			else
				setVar $player~warpto_p $bot~parm2
			end
		end
		setVar $PLAYER~warpto $bot~parm1
		if ($PLAYER~CURRENT_SECTOR = $PLAYER~warpto)
			setVar $SWITCHBOARD~message "Already in that sector!*"
			gosub :SWITCHBOARD~switchboard
			goto :wait_for_command
		elseif (($PLAYER~warpto <= 0) OR ($PLAYER~warpto > SECTORS))
			setVar $SWITCHBOARD~message "Destination sector is out of range!*"
			gosub :SWITCHBOARD~switchboard
			goto :wait_for_command
		end
	end
return




:wait_for_command
	setVar $BOT~help[1]  $BOT~tab&"bwarp - planet transports to sector as quickly "
	setVar $BOT~help[2]  $BOT~tab&"        and safely as possible.   "
	setVar $BOT~help[3]  $BOT~tab&"Options: "
	setVar $BOT~help[4]  $BOT~tab&"    t [sector] - normal bwarp"
	setVar $BOT~help[5]  $BOT~tab&"    t [sector] {p} - bwarp, then port"
	setVar $BOT~help[6]  $BOT~tab&"    t planet {planet id} - bwarp to last known "
	setVar $BOT~help[7]  $BOT~tab&"                           location of the planet id"
	gosub :bot~helpfile
halt




# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\currentprompt\player"
include "source\bot_includes\player\quikstats\player"
include "source\module_includes\bot\checkstartingprompt\bot"
include "source\bot_includes\player\bwarp\player"
