# requires $pe~destination to be defined #
# $speed to do faster enter #
:run
:pe
	setVar $BOT~command "pe"
	if ($speed)
		setVar $BOT~user_command_line " pe "&$destination&" "&" speed "
	else
		setVar $BOT~user_command_line " pe "&$destination&" "
	end
	setVar $BOT~parm1 $destination
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
	load "scripts\"&$bot~mombot_directory&"\commands\offense\pe.cts"
	setEventTrigger		peended		:peended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\offense\pe.cts"
	pause
	:peended
return