:run
:xenter
	setVar $BOT~command "xenter"
	setVar $BOT~user_command_line " xenter silent"
	setVar $BOT~parm1 "silent"
	setVar $BOT~parm2 ""
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
	load "scripts\"&$bot~mombot_directory&"\commands\grid\xenter.cts"
	setEventTrigger		xenterended		:xenterended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\grid\xenter.cts"
	pause
	:xenterended
return