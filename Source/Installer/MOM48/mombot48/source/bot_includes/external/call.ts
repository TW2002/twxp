:run
:call
	setVar $BOT~command "call"
	setvar $bot~parm1 ""
	setVar $BOT~user_command_line " call  "
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
	load "scripts\"&$bot~mombot_directory&"\commands\defense\call.cts"
	setEventTrigger        callend1        :callend1 "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\defense\call.cts"
	pause
	:callend1


	gosub :player~quikstats
	if ($player~current_prompt <> "Citadel")
		setvar $switchboard~message "Not on planet even after call saveme.  I'm in real trouble.  Will try again in 15 seconds.*"
		gosub :switchboard~switchboard

		killalltriggers
		setDelayTrigger	   1 :call	15000
		pause
	end
	
return
