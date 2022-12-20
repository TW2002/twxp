# ============================== START STORE SHIP ====================================
:storeship
:shipstore

gosub :BOT~loadVars

		gosub  :player~currentPrompt
		setVar $PLAYER~startingLocation $PLAYER~CURRENT_PROMPT
		setVar $BOT~validPrompts "Command Citadel"
		gosub :BOT~checkStartingPrompt
		gosub :ship~savetheship
# ================================== END STORE SHIP ==============================================

halt

#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\checkstartingprompt\bot"
include "source\bot_includes\player\currentprompt\player"
include "source\bot_includes\ship\savetheship\ship"
