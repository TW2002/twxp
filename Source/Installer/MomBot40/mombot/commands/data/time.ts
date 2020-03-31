systemscript


	gosub :BOT~loadVars
	setVar $BOT~help[1]  $BOT~tab&"Displays system's local time "
	setVar $BOT~help[2]  $BOT~tab&"      "
	setVar $BOT~help[3]  $BOT~tab&"  time "
	setVar $BOT~help[4]  $BOT~tab&"         "
	gosub :bot~helpfile


	loadVar $bot~bot_name
	loadVar $bot~parm1
	loadVar $bot~user_command_line
	loadvar $bot~timer_file





	setvar $switchboard~message "Current system time - "&TIME&"*"
	gosub :switchboard~switchboard
	halt

#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
