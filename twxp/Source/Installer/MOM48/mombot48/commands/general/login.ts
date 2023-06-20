:login
	gosub  :player~currentPrompt
	setVar $PLAYER~startingLocation $PLAYER~CURRENT_PROMPT
	setVar $BOT~validPrompts "Citadel Command"
	gosub :BOT~checkStartingPrompt
	if ($PLAYER~startingLocation = "Command")
		send "t tLogin** q "
	elseif ($PLAYER~startingLocation = "Citadel")
		send "x tLogin** q "
	end

halt

#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\checkstartingprompt\bot"
include "source\bot_includes\player\currentprompt\player"
