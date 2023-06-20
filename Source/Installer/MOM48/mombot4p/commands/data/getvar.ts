	gosub :BOT~loadVars


	setVar $BOT~help[1]  $BOT~tab&"getvar"
	setVar $BOT~help[2]  $BOT~tab&"  Displays bot variables"
	setVar $BOT~help[3]  $BOT~tab&"    s - stardock"
	setVar $BOT~help[4]  $BOT~tab&"    r - rylos"
	setVar $BOT~help[5]  $BOT~tab&"    a - alpha centauri"
	setVar $BOT~help[6]  $BOT~tab&"    b - backdoor"
	setVar $BOT~help[7]  $BOT~tab&"    x - safe ship"
	setVar $BOT~help[8]  $BOT~tab&"   tl - turn limit"
	gosub :bot~helpfile
	
	loadvar $map~rylos
	loadvar $map~stardock
	loadvar $map~alpha_centauri
	loadvar $map~backdoor
	loadvar $map~home_sector

	getWord $BOT~user_command_line $BOT~parm1 1
	setVar $SWITCHBOARD~message ""
	if (($BOT~parm1 = "h") OR ($BOT~parm1 = "home") OR ($BOT~parm1 = $SWITCHBOARD~bot_name))
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&"Home Sector: "&$MAP~home_sector&"*"
	end
	if (($BOT~parm1 = "s") OR ($BOT~parm1 = "stardock") OR ($BOT~parm1 = $SWITCHBOARD~bot_name))
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&"Stardock: "&$MAP~stardock&"*"
	end
	if (($BOT~parm1 = "r") OR ($BOT~parm1 = "rylos") OR ($BOT~parm1 = $SWITCHBOARD~bot_name))
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&"Rylos: "&$MAP~rylos&"*"
	end
	if (($BOT~parm1 = "a") OR ($BOT~parm1 = "alpha") OR ($BOT~parm1 = $SWITCHBOARD~bot_name))
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&"Alpha Centauri: "&$MAP~alpha_centauri&"*"
	end
	if (($BOT~parm1 = "b") OR ($BOT~parm1 = "backdoor") OR ($BOT~parm1 = $SWITCHBOARD~bot_name))
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&"Backdoor: "&$MAP~backdoor&"*"
	end
	if (($BOT~parm1 = "x") OR ($BOT~parm1 = "safeship") OR ($BOT~parm1 = $SWITCHBOARD~bot_name))
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&"Safe Ship: "&$BOT~safe_ship&"*"
	end
	if (($BOT~parm1 = "tl") OR ($BOT~parm1 = "turnlimit") OR ($BOT~parm1 = $SWITCHBOARD~bot_name))
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&"Turn Limit: "&$BOT~bot_turn_limit&"*"
	end
	if (($BOT~parm1 = "pgridbot") OR ($BOT~parm1 = "pbot") OR ($BOT~parm1 = $SWITCHBOARD~bot_name))
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&"PGrid Bot: "&$BOT~pgrid_bot&"*"
	end
	if ($SWITCHBOARD~message = "")
		setVar $SWITCHBOARD~message "Unknown variable name entered.*"
	end
	if ($SWITCHBOARD~self_command <> TRUE)
		setVar $SWITCHBOARD~self_command 2
	end
	gosub :SWITCHBOARD~switchboard
	halt

# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
