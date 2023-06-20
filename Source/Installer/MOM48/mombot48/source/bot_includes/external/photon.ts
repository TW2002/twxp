# $photon~sector is required#

:run
:photon

	setVar $BOT~command "photon"
	setVar $BOT~user_command_line " photon "&$sector
	setVar $BOT~parm1 $sector
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
	load "scripts\"&$bot~mombot_directory&"\commands\general\photon.cts"
	setEventTrigger		photonended		:photonended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\general\photon.cts"
	pause
	:photonended
return