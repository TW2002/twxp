
# requires $bot~user_command_line and $bot~parm1 to be defined before calling this #
:run
:moveship
	setvar $bot~command "moveship"
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
	load "scripts\"&$bot~mombot_directory&"\modes\resource\moveship.cts"
	setEventTrigger		moveshipended		:movehomeshipended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\modes\resource\moveship.cts"
	pause
	:movehomeshipended
return