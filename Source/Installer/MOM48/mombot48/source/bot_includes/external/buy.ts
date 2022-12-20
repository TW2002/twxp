# $buy~product to define what to buy f,o, or e.  Default is f. #
# $buy~type to define buy type s, b, or w.  Default is s. #

:run
:buyfuel

	if ($product = "0")
		setvar $product "f"
	end
	if ($type = "0")
		setvar $type "s"
	end
	setVar $BOT~command "buy"
	setVar $BOT~user_command_line " buy "&$product&" "&$type&" silent"
	setVar $BOT~parm1 $product
	setVar $BOT~parm2 $type
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
	load "scripts\"&$bot~mombot_directory&"\commands\resource\buy.cts"
	setEventTrigger		buyended		:buyended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\resource\buy.cts"
	pause
	:buyended
return