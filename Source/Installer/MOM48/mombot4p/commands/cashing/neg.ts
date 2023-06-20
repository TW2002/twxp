	gosub :BOT~loadVars
	loadvar $GAME~ptradesetting


	setVar $BOT~help[1]  $BOT~tab&"           Planet Negotiate Trade Agrement          "
	setVar $BOT~help[2]  $BOT~tab&"           "
	setVar $BOT~help[3]  $BOT~tab&"    neg {f} {o} {e}    "
	setVar $BOT~help[4]  $BOT~tab&"                             "
	setVar $BOT~help[5]  $BOT~tab&"Options:"
	setVar $BOT~help[6]  $BOT~tab&"    {f}   sells as much fuel as possible"
	setVar $BOT~help[7]  $BOT~tab&"    {o}   sells as much organics as possible"
	setVar $BOT~help[8]  $BOT~tab&"    {e}   sells as much equipment as possible"
	setVar $BOT~help[9]  $BOT~tab&"                                                    "
	setVar $BOT~help[10] $BOT~tab&"          default is to sell all org and equip"
	setVar $BOT~help[11] $BOT~tab&"          "
	setVar $BOT~help[12] $BOT~tab&"           - Originally written by Cherokee"
	gosub :bot~helpfile

	setVar $BOT~script_title "Planet Negotiate"
	gosub :BOT~banner

	loadVar $game~port_max
	loadVar $game~ptradesetting
	loadvar $bot~$MCIC_FILE

# ============================== START HAGGLE VARIABLES ============================
	setVar $overhagglemultiple 	147
	setVar $cyclebuffer 		1
	setVar $cyclebufferlimit 	20
# ============================== END HAGGLE VARIABLES ============================

#==================================   START PLANET NEGOTIATE (NEG) SUB  ========================================
:neg
	killtrigger 1
	killtrigger 2


	setVar $BOT~validPrompts "Citadel Planet"
	gosub :BOT~checkStartingPrompt
	setVar $startingLocation $player~CURRENT_PROMPT
	
	if (($startingLocation = 0) or ($startingLocation = ""))
		gosub :player~quikstats
		setVar $startingLocation $player~CURRENT_PROMPT
	end

	if ($bot~parm1 = 0)
		setVar $planet~_ck_pnego_fueltosell "-1"
		setVar $planet~_ck_pnego_orgtosell "max"
		setVar $planet~_ck_pnego_equiptosell "max"
	else
		getwordpos " "&$bot~user_command_line&" " $pos " f "
		if ($pos > 0)
			setVar $planet~_ck_pnego_fueltosell "max"
		else
			setVar $planet~_ck_pnego_fueltosell "-1"
		end

		getwordpos " "&$bot~user_command_line&" " $pos " o "
		if ($pos > 0)
			setVar $planet~_ck_pnego_orgtosell "max"
		else
			setVar $planet~_ck_pnego_orgtosell "-1"
		end
		getwordpos " "&$bot~user_command_line&" " $pos " e "
		if ($pos > 0)
			setVar $planet~_ck_pnego_equiptosell "max"
		else
			setVar $planet~_ck_pnego_equiptosell "-1"
		end
	end

	if (($planet~_ck_pnego_fueltosell = "-1") and ($planet~_ck_pnego_orgtosell = "-1") and ($planet~_ck_pnego_equiptosell = "-1"))
		setvar $switchboard~message "Please use - neg [item] format*"
		gosub :switchboard~switchboard
		halt
	end


	gosub :planet~planetNeg

	setvar $switchboard~message $planet~exit_message&"*"
	gosub :switchboard~switchboard
	halt
#==================================   END PLANET NEGOTIATE (NEG) SUB  ========================================

#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\module_includes\bot\checkstartingprompt\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\planetneg\planet"
