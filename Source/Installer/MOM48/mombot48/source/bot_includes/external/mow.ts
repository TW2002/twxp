# requires $mow~destination to be defined #
# $mow~deploy is optional #

:run
:mow
	if ($mow~deploy = "0")
		setvar $mow~deploy ""
	end
	setVar $BOT~command "mow"
	setVar $BOT~user_command_line " mow "&$destination&" "&$mow~deploy
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
	load "scripts\"&$bot~mombot_directory&"\modes\grid\mow.cts"
	setEventTrigger		mowended		:mowended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\modes\grid\mow.cts"
	pause
	:mowended
return