# holoscans and photons any adjacent enemies #

:run
:htorp
	setVar $BOT~command "htorp"
	setVar $BOT~user_command_line " htorp "
	setVar $BOT~parm1 ""
	saveVar $BOT~parm1
	saveVar $BOT~command
	saveVar $BOT~user_command_line
	load "scripts\"&$bot~mombot_directory&"\commands\offense\htorp.cts"
	setEventTrigger		htorpdone		:htorpdone "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\offense\htorp.cts"
	pause
	:htorpdone
return