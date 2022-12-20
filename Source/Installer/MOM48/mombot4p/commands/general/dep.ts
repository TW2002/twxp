gosub :BOT~loadVars

if (($bot~parm1 = "?") or ($bot~parm1 = "help"))
	goto :wait_for_command
end

setVar $PLAYER_CASH_MAX     999999999
setVar $planet~citadel_CASH_MAX    999999999999999

# ============================== START DEPOSIT (DEP) ==============================
:dep
:d
	gosub :bankProtections
	if ($bot~parm1 = "")
		setVar $cashToTransfer $PLAYER~CREDITS
	else
		setVar $cashToTransfer $bot~parm1
	end
	send "D"
	waitOn "Citadel treasury contains "
	getWord CURRENTLINE $planet~citadelCash 4
	stripText $planet~citadelCash ","
	if (($cashToTranfer+$planet~citadelCash) >= $planet~citadel_CASH_MAX)
		setVar $SWITCHBOARD~message "Citadel has too much cash to do transfer (how sad for you)*"
		gosub :SWITCHBOARD~switchboard
		goto :wait_for_command
	end
	send "t t "&$cashToTransfer&"* "
	waiton "credits, and the Treasury"
	setvar $map~value $cashtotransfer
	gosub :map~commas
	setvar $cashtotransfer $map~value
	setVar $SWITCHBOARD~message $cashToTransfer &" credits deposited into citadel.*"
	gosub :SWITCHBOARD~switchboard
	goto :wait_for_command
# ============================== END DEPOSIT (DEP) ==============================


:bankProtections
	gosub :PLAYER~quikstats
	setVar $bot~validPrompts "Citadel"
	gosub :bot~checkstartingprompt
	if ($bot~parm1 = "ss")
		setVar $bot~parm1 ""
	end
	isNumber $test $bot~parm1 
	if (($test = FALSE) and ($bot~parm1 <> ""))
		setVar $SWITCHBOARD~message "Cash entered is not a number, try again.*" 
		gosub :SWITCHBOARD~switchboard
		goto :wait_for_command  
	end
return


:wait_for_command
	setVar $BOT~help[1]  $BOT~tab&"dep {cash to deposit} "
	setVar $BOT~help[2]  $BOT~tab&"  Deposits cash into citadel treasury."
	setVar $BOT~help[3]  $BOT~tab&"        default is max credits possible"
	gosub :bot~helpfile
halt


# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\map\commas\map"
include "source\bot_includes\player\quikstats\player"
include "source\module_includes\bot\checkstartingprompt\bot"
