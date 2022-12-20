:run
:buyfig
	setVar $BOT~command "buy"
	setVar $BOT~user_command_line " buy fig silent"
	setVar $BOT~parm1 "fig"
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
	load "scripts\"&$bot~mombot_directory&"\commands\resource\buy.cts"
	setEventTrigger		buyended		:buyended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\resource\buy.cts"
	pause
	:buyended
return