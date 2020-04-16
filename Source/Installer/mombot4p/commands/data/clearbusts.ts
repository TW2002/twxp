	logging off
	gosub :BOT~loadVars
	loadVar $BOT~BUST_FILE
	
		
	setVar $BOT~help[1] $BOT~tab&"clearbusts"
	setVar $BOT~help[2] $BOT~tab&"  - Will clear all busts in database."
	gosub :bot~helpfile

	setVar $BOT~script_title "Bust Clearer"
	gosub :BOT~banner

# ============================== CLEAR BUSTS ==================================
:clearbusts
	#delete $BOT~BUST_FILE
	setVar $i 11
	while ($i <= SECTORS)   
		setSectorParameter $i "BUSTED" ""
		add $i 1
	end
	setVar $SWITCHBOARD~message "Bust file for this bot has been cleared.*"
	gosub :SWITCHBOARD~switchboard
	halt
# ============================== END CLEAR BUSTS ==============================


#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
