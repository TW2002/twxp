# $patp~minimum is for minimum fuel on port before script will visit -  default is 10000 #
# $patp~upgrade is to upgrade ports as it goes. Default is false. #
# $patp~docim is to do cim before starting. Default is false. #

:run
:patp
	if ($minimum = "0")
		setvar $minimum 10000
	end
	if ($upgrade = true)
		setvar $upgrade "upgrade"
	end
	if ($docim = true)
		setvar $docim "docim"
	end
	setVar $BOT~command "patp"
	setVar $bot~user_command_line " patp "&$minimum&" "&$upgrade&" "&$docim&" silent"

	setVar $bot~parm1 $minimum
	saveVar $bot~parm1
	setVar $bot~parm2 $upgrade
	saveVar $bot~parm2
	setVar $bot~parm3 $docim
	saveVar $bot~parm3
	saveVar $BOT~command
	saveVar $bot~user_command_line
	load "scripts\"&$bot~mombot_directory&"\modes\resource\patp.cts"
	setEventTrigger		patpended		:patpended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\modes\resource\patp.cts"
	pause
	:patpended
return
