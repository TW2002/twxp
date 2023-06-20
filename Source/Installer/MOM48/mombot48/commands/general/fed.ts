gosub :BOT~loadVars

	setVar $BOT~help[1]  $BOT~tab&"fed - send subspace messages  "
	gosub :bot~helpfile

	send "`"&$BOT~user_command_line&"*"
	halt
    
#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
