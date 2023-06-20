# $max~type is required, and can have f, o, or e in it for upgrading types.  $max~noexp can be added for not # 
# getting experience. Default type is fuel.#

:run
:max

	if ($noexp = "1")
		setvar $noexp "noexp"
	end
	if ($type = "0")
		setvar $type "f"
	end
	setVar $BOT~command "port"
	setVar $BOT~user_command_line " port upgrade "&$type&" "&noexp&" silent "
	setVar $BOT~parm1 "upgrade"
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
	load "scripts\"&$bot~mombot_directory&"\commands\grid\port.cts"
	setEventTrigger		portended		:portended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\grid\port.cts"
	pause
	:portended
return 