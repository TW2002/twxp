gosub :BOT~loadVars

	setVar $BOT~help[1]  $BOT~tab&"twarp {sector:#} {"&#34&"trader_name"&#34&"} {p} "
	setVar $BOT~help[2]  $BOT~tab&"      "
	setVar $BOT~help[3]  $BOT~tab&"        transwarps to sector as quickly "
	setVar $BOT~help[4]  $BOT~tab&"        and safely as possible.   "
	setVar $BOT~help[5]  $BOT~tab&"      "
	setVar $BOT~help[6]  $BOT~tab&"    Options: "
	setVar $BOT~help[7]  $BOT~tab&"           {sector:#} - sector to twarp to "
	setVar $BOT~help[8]  $BOT~tab&"      {"&#34&"trader_name"&#34&"} - trader to twarp to"
	setVar $BOT~help[9]  $BOT~tab&"                  {p} - attempt to port after twarp"
	setVar $BOT~help[10] $BOT~tab&"         "
	setVar $BOT~help[11] $BOT~tab&"    Examples:"
	setVar $BOT~help[12] $BOT~tab&"            >t 233    - normal twarp"
	setVar $BOT~help[13] $BOT~tab&"            >t 233 12 - twarp, then land on planet 12"
	setVar $BOT~help[14] $BOT~tab&"            >t 233 p  - twarp, then port"
	setVar $BOT~help[15] $BOT~tab&"         >t planet 12 - twarp to last known "
	setVar $BOT~help[16] $BOT~tab&"                        location of planet 12 and land"
	setVar $BOT~help[17] $BOT~tab&"              >t mind - twarp to a corp member with mind"
	setVar $BOT~help[18] $BOT~tab&"                        in their name"
	setVar $BOT~help[19] $BOT~tab&"     >t "&#34&"mind dagger"&#34&" - twarp to corp member"
	gosub :bot~helpfile


# ======================     START TWARP SUBROUTINES     =================
:twarp
:t
	setVar $player~warpto_p ""
	setvar $player~save true
	gosub :PLAYER~quikstats
	setVar $PLAYER~startingLocation $PLAYER~CURRENT_PROMPT
	setVar $bot~validPrompts "Command <Underground> Do How Corporate Citadel Planet Computer Terra <StarDock> <FedPolice> <Tavern> <Libram <Galactic <Hardware <Shipyards>"
	gosub :bot~checkstartingprompt
	gosub :player~checkfortravelname
	if ($PLAYER~TWARP_TYPE = "No")
		setVar $SWITCHBOARD~message "This ship does not have a transwarp drive!*"
		gosub :SWITCHBOARD~switchboard
		goto :wait_for_command
	end
	gosub :travelProtections
	gosub :player~twarp
	if ($PLAYER~twarpSuccess = FALSE)
		if (($PLAYER~startingLocation = "Citadel") OR ($PLAYER~startingLocation = "Planet"))
			if ($planet~planet <> 0)
				gosub  :player~currentPrompt
				if ($PLAYER~CURRENT_PROMPT = "Command")
					gosub :PLANET~landingSub
				end
			end
			goto :wait_for_command
		end
		if (($PLAYER~startingLocation = "<StarDock>") OR ($PLAYER~startingLocation = "<FedPolice") OR ($PLAYER~startingLocation = "<Tavern>") OR ($PLAYER~startingLocation = "<Libram") OR ($PLAYER~startingLocation = "<Galact") OR ($PLAYER~startingLocation = "<Hardware") OR ($PLAYER~startingLocation = "<Shipyards>"))
			send "p z s h *"
			goto :wait_for_command
		end
		setVar $SWITCHBOARD~message $PLAYER~msg&"*"
		gosub :SWITCHBOARD~switchboard
	else
		if ($bot~parm2 = "p")
			send $player~warpto_p
		elseif (($player~warpto_p <> 0) AND ($player~warpto_p <> ""))
			setVar $planet~planet $player~warpto_p
			gosub :PLANET~landingSub
		end
		setVar $bot~target $PLAYER~warpto
		gosub :bot~addfigtodata
		setVar $SWITCHBOARD~message $PLAYER~msg&"*"
		gosub :SWITCHBOARD~switchboard
	end
	goto :wait_for_command
# ======================     END TWARP SUBROUTINES     ==========================
:travelProtections
	isNumber $test $bot~parm1
	if ($test = FALSE)
		setVar $SWITCHBOARD~message "Sector must be entered as a number*"
		gosub :SWITCHBOARD~switchboard
		goto :wait_for_command
	else
		if ($bot~parm2 = "p")
			setVar $player~warpto_p "p z t *"
			if ($bot~parm1 = $MAP~stardock)
				setVar $player~warpto_p "p z s h *"
			end
		else
			isNumber $test $bot~parm2
			if ($test = FALSE)
				setVar $player~warpto_p ""
			else
				setVar $player~warpto_p $bot~parm2
			end
		end
		setVar $PLAYER~warpto $bot~parm1
		if ($PLAYER~CURRENT_SECTOR = $PLAYER~warpto)
			setVar $SWITCHBOARD~message "Already in that sector!*"
			gosub :SWITCHBOARD~switchboard
			goto :wait_for_command
		elseif (($PLAYER~warpto <= 0) OR ($PLAYER~warpto > SECTORS))
			setVar $SWITCHBOARD~message "Destination sector is out of range!*"
			gosub :SWITCHBOARD~switchboard
			goto :wait_for_command
		end
	end
return



:wait_for_command
halt




# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\player\checkcorp\player"
include "source\module_includes\bot\checkstartingprompt\bot"
include "source\bot_includes\player\twarp\player"
include "source\bot_includes\player\currentprompt\player"
include "source\bot_includes\planet\landingsub\planet"
include "source\module_includes\bot\addfigtodata\bot"
include "source\bot_includes\player\checkfortravelname\player"
