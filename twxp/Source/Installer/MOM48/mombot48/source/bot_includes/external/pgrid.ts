# pgrid into sector #

:run
:pgrid
	setVar $BOT~command "pgrid"
	setVar $BOT~user_command_line " pgrid " & $pgridSector
	setVar $BOT~parm1 $pgridSector
	saveVar $BOT~parm1
	saveVar $BOT~command
	saveVar $BOT~user_command_line
	load "scripts\"&$bot~mombot_directory&"\commands\grid\pgrid.cts"
	setEventTrigger		pgriddone		:pgriddone "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\grid\pgrid.cts"
	pause
	:pgriddone
return