	gosub :BOT~loadVars

	setVar $BOT~help[1] $BOT~tab&"EVAC - Evacuate Planet(s)"
	setVar $BOT~help[2] $BOT~tab&"       Moves all movable planets in Current-Sector to target sector."
	setVar $BOT~help[3] $BOT~tab&"                  "
	setVar $BOT~help[4] $BOT~tab&"      evac [sector]"
	gosub :bot~helpfile

loadVar $map~stardock
loadVar $map~rylos
loadVar $map~alpha_centauri
loadVar $map~home_sector

# ======================     START PLANET MOVER (EVAC) SUBROUTINE    ==========================
	:evac_start
		gosub :player~quikstats
		setVar $startingLocation $player~CURRENT_PROMPT
		if (($startingLocation <> "Citadel") AND ($startingLocation <> "Command"))
			setvar $switchboard~message "Must start from Citadel or Command Prompt*"
			gosub :switchboard~switchboard
			halt
		end
		if (($bot~parm1 = "s") and ($map~stardock <> 0))
			setvar $bot~parm1 $map~stardock
		end
		if (($bot~parm1 = "r") and ($map~rylos <> 0))
			setvar $bot~parm1 $map~rylos
		end
		if (($bot~parm1 = "a") and ($map~alpha_centauri <> 0))
			setvar $bot~parm1 $map~alpha_centauri
		end
		if (($bot~parm1 = "h") and ($map~home_sector <> 0))
			setvar $bot~parm1 $map~home_sector
		end
		setvar $target_sector $bot~parm1

		if ($target_sector = $player~current_sector)
			setvar $switchboard~message "Already in that sector!*"
			gosub :switchboard~switchboard
			halt
		end

	:evac_run	
		setvar $switchboard~message "Starting Planet Evacuation to sector: "&$target_sector&".*"
		gosub :switchboard~switchboard
		setvar $evac_home $player~CURRENT_SECTOR
		if ($startingLocation = "Citadel")
			send "qq"
		end
		send "j  y  lq*"
	
	:evac_get_planets
		waitOn "Registry# and Planet Name"
		setVar $planet~planetCount 0
		setVar $planet~planetSkip 0
		settexttrigger planetGrabber :evac_planetline "   <"
		settexttrigger beDone :evac_done "Land on which planet "
		settexttrigger no_scanner :evac_no_scanner "Planet command (?=help)"
		pause

	:evac_planetline
		killtrigger planetgrabber
		killtrigger bedone
		killtrigger no_scanner 
		killtrigger getline2
		killtrigger getend
		setVar $line CURRENTLINE
		replacetext $line "<" " "
		replacetext $line ">" " "
		striptext $line ","

		getWord $line $temp 1
		if ($temp > 0)
			add $planet~planetCount 1
			setvar $planet~planet[$planet~planetCount] $temp
		end
		setTextLineTrigger getLine2 :evac_planetline "   <"
		setTextLineTrigger getEnd :evac_done "Land on which planet "
		pause

	:evac_no_scanner
		setvar $planet~planetcount 1
		goto :evac_Move
	
	:evac_done
		killtrigger getline2
		setvar $evac_total $planet~planetCount
		setvar $i 1

	:evac_move
	while ($i <= $evac_total)
			send "l " $planet~planet[$i] "* "
			gosub :planet~getPlanetInfo
			if ($planet~CITADEL <= 3)
				add $planet~planetSkip 1
				send "q q * "
			elseif ($planet~CITADEL >= 4)
				send "m * * * t n t 1 * c p " $target_sector "*"
				settextlinetrigger warp :evac_Pwarp "Locating beam pinpointed, TransWarp"
				settextlinetrigger no_warp :evac_no_fig "You do not have any fighters in Sector"
				pause

				:evac_Pwarp
					killtrigger no_Warp
					send "y*"
					if ($i < $evac_total)
						send "qq  z  n  *  m" $evac_home "*y"
						SetTextTrigger warp :evac_twarp "All Systems Ready, shall we engage?"
						SetTextTrigger no_warp :evac_no_warp_back "Do you want to make"
						pause

						:evac_twarp
							killtrigger no_Warp
							send "y  *  *  *  q  z  n  *"
					end
			end

		add $i 1

	end

	subtract $planet~planetCount $planet~planetSkip
	setvar $switchboard~message "Evac Complete. Moved: "&$planet~planetCount&" Skipped: "&$planet~planetSkip&". *"
	gosub :switchboard~switchboard
	halt


	:evac_no_warp_back
		killtrigger warp
		setvar $switchboard~message "No Fighter at Home Sector.  Shutting down Evac.*"
		gosub :switchboard~switchboard
		halt

	:evac_no_fig
		killtrigger warp
		setvar $switchboard~message "No Fighter at Target Sector.  Shutting down Evac.*"
		gosub :switchboard~switchboard
		halt

	:evac_end
		halt

# ======================     END PLANET MOVER (EVAC) SUBROUTINE    ==========================
#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\getplanetinfo\planet"
