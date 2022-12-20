gosub :BOT~loadVars

	setVar $BOT~help[1]  $BOT~tab&"bwarp {sector:#} {"&#34&"trader_name"&#34&"} {p}"
	setVar $BOT~help[2]  $BOT~tab&"      "
	setVar $BOT~help[3]  $BOT~tab&"        planet transports to sector"
	setVar $BOT~help[4]  $BOT~tab&"       "
	setVar $BOT~help[5]  $BOT~tab&"    Options: "
	setVar $BOT~help[6]  $BOT~tab&"           {sector:#} - sector to bwarp to "
	setVar $BOT~help[7]  $BOT~tab&"      {"&#34&"trader_name"&#34&"} - trader to bwarp to"
	setVar $BOT~help[8]  $BOT~tab&"                  {p} - port after bwarping in "
	setVar $BOT~help[9]  $BOT~tab&"         "
	setVar $BOT~help[10] $BOT~tab&"    Examples:"
	setVar $BOT~help[11] $BOT~tab&"               >b 233 - normal bwarp"
	setVar $BOT~help[12] $BOT~tab&"             >b 233 p - bwarp to sector, and port "
	setVar $BOT~help[13] $BOT~tab&"         >b planet 12 - bwarp to last known "
	setVar $BOT~help[14] $BOT~tab&"                        location of planet 12 "
	setVar $BOT~help[15] $BOT~tab&"              >b mind - bwarp to a corp member with mind"
	setVar $BOT~help[16] $BOT~tab&"                        in their name"
	setVar $BOT~help[17] $BOT~tab&"     >b "&#34&"mind dagger"&#34&" - bwarp to corp member"
	gosub :bot~helpfile


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
	gosub :player~checkfortravelname
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
halt




# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\currentprompt\player"
include "source\bot_includes\player\quikstats\player"
include "source\module_includes\bot\checkstartingprompt\bot"
include "source\bot_includes\player\bwarp\player"
include "source\bot_includes\player\checkcorp\player"
include "source\bot_includes\player\checkfortravelname\player"

