# requires $pel~destination to be defined #

:run
:pel
	if ($pel_planet = 0)
		setvar $pel_planet ""
	end
	setVar $BOT~command "pel"
	setVar $BOT~user_command_line " pel "&$destination&" "&$pel_planet
	setVar $BOT~parm1 $destination
	setVar $BOT~parm2 $pel_planet
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
	load "scripts\"&$bot~mombot_directory&"\commands\offense\pel.cts"
	setEventTrigger		pelended		:pelended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\offense\pel.cts"
	pause
	:pelended
return