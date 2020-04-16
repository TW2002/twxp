	gosub :BOT~loadVars

	if (($bot~parm1 = "?") or ($bot~parm1 = "help"))
		goto :wait_for_command
	end

# ============================== LAND (LAND) ==============================

	gosub :PLAYER~quikstats
	setVar $PLAYER~startingLocation $PLAYER~CURRENT_PROMPT
	setVar $bot~validPrompts "Command Citadel Planet"
	gosub :bot~checkstartingprompt
	loadVar $planet~planet
	if ($planet~planet <> "0")
		setvar $last_planet_landed $planet~planet
	end
	if ($bot~parm1 = "")
		setvar $bot~parm1 $last_planet_landed
	end
	isNumber $number $bot~parm1
	if ($number = TRUE)
		if (($bot~parm1 = 0) AND ($planet~planet = 0))
			setvar $switchboard~message "Incorrect Planet number*"
			gosub :switchboard~switchboard
			goto :wait_for_command
		elseif ($bot~parm1 > 0)
			setVar $planet~planet $bot~parm1
		else
		end
	else
		setVar $SWITCHBOARD~message "Planet number entered is not a number*"
		gosub :SWITCHBOARD~switchboard
		goto :wait_for_command
	end
		if ($player~current_prompt <> "Command")
			send "q q * "
		end
		gosub :PLANET~landingSub
	if ($planet~sucessfulCitadel = true)
		setVar $SWITCHBOARD~message "In Cit - Planet "&$planet~planet&"*"
		gosub :SWITCHBOARD~switchboard
	elseif ($planet~sucessfulPlanet = true)
		setVar $SWITCHBOARD~message "At Planet Prompt - No Cit*"
		gosub :SWITCHBOARD~switchboard
	else
		if (($last_planet_landed <> "0") and ($last_planet_landed <> $planet~planet))
			setvar $planet~planet $last_planet_landed
			gosub :planet~landingsub
			if ($planet~sucessfulCitadel)
				setVar $SWITCHBOARD~message "In Cit - Relanded on planet "&$planet~planet&"*"
				gosub :SWITCHBOARD~switchboard
			elseif ($planet~sucessfulPlanet)
				setVar $SWITCHBOARD~message "Relanded to planet prompt on planet "&$planet~planet&"- No Cit*"
				gosub :SWITCHBOARD~switchboard
			end
		end
	end
	goto :wait_for_command
# ============================== END LAND (LAND) SUB ==============================






:wait_for_command
	setVar $BOT~help[1]  $BOT~tab&"   Lands on a planet.          "
	setVar $BOT~help[2]  $BOT~tab&"               "
	setVar $BOT~help[3]  $BOT~tab&"    land {planet#}  "
	setVar $BOT~help[4]  $BOT~tab&"        "
	gosub :bot~helpfile
halt


# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\module_includes\bot\checkstartingprompt\bot"
include "source\bot_includes\planet\landingsub\planet"
