	gosub :BOT~loadVars


	setVar $BOT~help[1]  $BOT~tab&"setvar"
	setVar $BOT~help[2]  $BOT~tab&"  Sets bot variables"
	setVar $BOT~help[3]  $BOT~tab&"    s - stardock"
	setVar $BOT~help[4]  $BOT~tab&"    r - rylos"
	setVar $BOT~help[5]  $BOT~tab&"    a - alpha centauri"
	setVar $BOT~help[6]  $BOT~tab&"    b - backdoor"
	setVar $BOT~help[7]  $BOT~tab&"    x - safe ship"
	setVar $BOT~help[8]  $BOT~tab&"   tl - turn limit"
	setVar $BOT~help[9]  $BOT~tab&"    h - home sector"
	gosub :bot~helpfile

	getWord $BOT~user_command_line $BOT~parm1 1
	isNumber $test $BOT~parm2
	if (($BOT~parm1 = "h") OR ($BOT~parm1 = "home"))
		if ($test)
			if (($BOT~parm2 <= SECTORS) AND ($BOT~parm2 >= 1))
				setVar $MAP~home_sector $BOT~parm2
				savevar $map~home_sector
				setVar $SWITCHBOARD~message "Home Sector variable set to: "&$MAP~home_sector&".*"
			else
				setVar $SWITCHBOARD~message "Variable entered not valid, keeping old value.*"
			end
		end
	elseif (($BOT~parm1 = "s") OR ($BOT~parm1 = "stardock"))
		if ($test)
			if (($BOT~parm2 <= SECTORS) AND ($BOT~parm2 >= 1))
				setVar $MAP~stardock $BOT~parm2
				savevar $map~stardock
				setVar $SWITCHBOARD~message "Stardock variable set to: "&$MAP~stardock&".*"
			else
				setVar $SWITCHBOARD~message "Variable entered not valid, keeping old value.*"
			end
		end
	elseif (($BOT~parm1 = "r") OR ($BOT~parm1 = "rylos"))
		if ($test)
			if (($BOT~parm2 <= SECTORS) AND ($BOT~parm2 >= 1))
				setVar $MAP~rylos $BOT~parm2
				savevar $map~rylos
				setVar $SWITCHBOARD~message "Rylos variable set to: "&$MAP~rylos&".*"
			else
				setVar $SWITCHBOARD~message "Variable entered not valid, keeping old value.*"
			end
		end
	elseif (($BOT~parm1 = "a") OR ($BOT~parm1 = "alpha"))
		if ($test)
			if (($BOT~parm2 <= SECTORS) AND ($BOT~parm2 >= 1))
				setVar $MAP~alpha_centauri $BOT~parm2
				savevar $MAP~alpha_centauri
				setVar $SWITCHBOARD~message "Alpha Centauri variable set to: "&$MAP~alpha_centauri&".*"
			else
				setVar $SWITCHBOARD~message "Variable entered not valid, keeping old value.*"
			end
		end
	elseif (($BOT~parm1 = "b") OR ($BOT~parm1 = "backdoor"))
		if ($test)
			if (($BOT~parm2 <= SECTORS) AND ($BOT~parm2 >= 1))
				setVar $MAP~backdoor $BOT~parm2
				savevar $MAP~backdoor 
				setVar $SWITCHBOARD~message "Backdoor Sector variable set to: "&$MAP~backdoor&".*"
			else
				setVar $SWITCHBOARD~message "Variable entered not valid, keeping old value.*"
			end
		end
	elseif (($BOT~parm1 = "x") OR ($BOT~parm1 = "safeship"))
		if ($test)
			if ($BOT~parm2 >= 1)
				setVar $BOT~safe_ship $BOT~parm2
				savevar $bot~safe_ship
				setVar $SWITCHBOARD~message "Safe Ship variable set to: "&$BOT~safe_ship&".*"
			else
				setVar $SWITCHBOARD~message "Variable entered not valid, keeping old value.*"
			end
		end
	elseif (($BOT~parm1 = "tl") OR ($BOT~parm1 = "turnlimit"))
		if ($test)
			if ($BOT~parm2 >= 0)
				setVar $BOT~bot_turn_limit $BOT~parm2
				savevar $BOT~bot_turn_limit
				setVar $SWITCHBOARD~message "Turn Limit variable set to: "&$BOT~bot_turn_limit&".*"
			else
				setVar $SWITCHBOARD~message "Variable entered not valid, keeping old value.*"
			end
		end
	elseif (($BOT~parm1 = "pgridbot") OR ($BOT~parm1 = "pbot"))
		if ($BOT~parm2 <> 0)
			setVar $BOT~pgrid_bot $BOT~parm2
			savevar $BOT~pgrid_bot
			setVar $SWITCHBOARD~message "PGrid Bot has been set.*"
		else
			setVar $BOT~pgrid_bot ""
			savevar $BOT~pgrid_bot
			setVar $SWITCHBOARD~message "PGrid Bot has been cleared.*"
		end
	else
		setVar $SWITCHBOARD~message "Unknown variable name entered.*"
	end
	if (($switchboard~message = "0") or ($switchboard~message = ""))
		setVar $SWITCHBOARD~message "Setvar must have a valid value to set.*"
	end
	gosub :SWITCHBOARD~switchboard
halt

# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
