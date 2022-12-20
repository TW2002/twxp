# requires $pwarp~destination to be defined #

:run
:pwarp
	setVar $BOT~command "pwarp"
	setVar $BOT~user_command_line " pwarp "&$destination&" silent"
	setVar $BOT~parm1 $destination
	setVar $BOT~parm2 $mow~deploy
	setVar $BOT~parm3 ""
	setVar $BOT~parm4 ""
	setVar $BOT~parm5 ""
	setVar $BOT~parm6 ""
	saveVar $BOT~parm1
	saveVar $BOT~parm2 
	saveVar $BOT~parm3 
	saveVar $BOT~parm4 
	saveVar $BOT~parm5 
	saveVar $BOT~parm6 
	saveVar $BOT~command
	saveVar $BOT~user_command_line
	load "scripts\"&$bot~mombot_directory&"\commands\general\pwarp.cts"
	setEventTrigger		mowended		:mowended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\general\pwarp.cts"
	pause
	:mowended
return