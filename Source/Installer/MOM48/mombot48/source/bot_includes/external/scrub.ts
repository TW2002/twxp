# $scrub~seek set to twarp to class 0 or class 9 to scrub limpet #

:run
:scrub
	if ($seek)
		setvar $seek "seek"
	end
	setVar $BOT~command "scrub"
	setVar $BOT~user_command_line " scrub "&$seek&" silent"
	setvar $bot~parm1 $seek
	setvar $bot~parm2 ""
	setvar $bot~parm3 ""
	setvar $bot~parm4 ""
	setvar $bot~parm5 ""
	setvar $bot~parm6 ""
	saveVar $BOT~command
	saveVar $BOT~user_command_line
	savevar $bot~parm1
	savevar $bot~parm2
	savevar $bot~parm3
	savevar $bot~parm4
	savevar $bot~parm5
	savevar $bot~parm6
	load "scripts\"&$bot~mombot_directory&"\commands\general\scrub.cts"
	setEventTrigger        holoend1        :holoend1 "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\general\scrub.cts"
	pause
	:holoend1
return
