# $with~amount is not required, but can be set for specific amounts #

:run
:with

	if ($amount = "0")
		setvar $amount ""
	end	
	setVar $BOT~command "with"
	setVar $BOT~user_command_line " with silent"
	setVar $BOT~parm1 $amount
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
	load "scripts\"&$bot~mombot_directory&"\commands\general\with.cts"
	setEventTrigger		withended		:withended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\general\with.cts"
	pause
	:withended
return