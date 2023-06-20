# $movefig~figamount is amount of fighters to move, default is all #
# $movefig~planetorsector is whether to move them to planet or sector (default is sector) #

if ($figamount = "0")
	setvar $figamount ""
end
if ($planetorsector <> "p")
	setvar $planetorsector "s"
end
:run
:movefig
	setVar $BOT~command "movefig"
	setVar $BOT~user_command_line " movefig "&$planetorsector&" "& $figamount 
	setVar $BOT~parm1 $planetorsector
	setVar $BOT~parm2 $figamount
	saveVar $BOT~parm1
	saveVar $BOT~parm2
	saveVar $BOT~command
	saveVar $BOT~user_command_line
	load "scripts\"&$bot~mombot_directory&"\modes\resource\movefig.cts"
	setEventTrigger        moveended        :moveended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\modes\resource\movefig.cts"
	pause
	:moveended
return