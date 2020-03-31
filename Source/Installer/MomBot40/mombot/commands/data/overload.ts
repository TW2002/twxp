	gosub :BOT~loadVars

	setVar $BOT~help[1] $BOT~tab&"overload  {under}"
	setVar $BOT~help[2] $BOT~tab&"        "
	setVar $BOT~help[3] $BOT~tab&"  Tells you when you have sectors overloaded "
	setVar $BOT~help[4] $BOT~tab&"  with planets        "
	setVar $BOT~help[5] $BOT~tab&"    "
	setVar $BOT~help[6] $BOT~tab&"     under - tells you which sectors "
	setvar $bot~help[7] $bot~tab&"             have less than max planets"
	gosub :bot~helpfile

		
# =============================== START OVERLOAD =====================================
:overload

	gosub :player~quikstats
	setVar $startingLocation $player~current_prompt
	if (($startingLocation <> "Command") AND ($startingLocation <> "Citadel"))
		setvar $switchboard~message "Must start at Citadel or Command Prompt for overload check*"
		gosub :switchboard~switchboard
		halt
	end
	if ($bot~parm1 = "under")
		setVar $showUnderload TRUE
	else
		setVar $showUnderload FALSE
	end
:start_overload
	if ($game~MAX_PLANETS_PER_SECTOR <= 0)
		if ($startingLocation = "Citadel")
			send "q"
			gosub :planet~getplanetinfo
			send "q"
		end
		:getPPS
			send "V"
			setTextLineTrigger pps :pps "The Maximum number of Planets per sector:"
			pause

			:pps
				getWord CURRENTLINE $pps 8
				stripText $pps ","
			:grabPlanets
				setVar $sector_list " "
				setVar $sector_list_length 0
				if ($startingLocation = "Citadel")
					send "L " & $planet~planet & "* C XLQCYQ"
				else
					send "TLQCYQ"
				end
	else
		setVar $pps $game~MAX_PLANETS_PER_SECTOR
		:grabPlanetsNoV
			setVar $sector_list " "
			setVar $sector_list_length 0
			if ($startingLocation = "Citadel")
				send "XLQCYQ"
			else
				send "TLQCYQ"
			end
	end

	waitOn "Corporate Planet Scan"

:getCorpPlanetList
		setTextLineTrigger getCorpPlanet :getCorpPlanet "Class"
		setTextLineTrigger corpPlanetsDone :corpPlanetsDone "======   ============  ==== ==== ==== ===== ===== ===== ========== =========="
		setTextLineTrigger corpPlanetsDone2 :corpPlanetsDone "No Planets claimed"
		pause

:getCorpPlanet
	gosub :getthisplanet
		setTextLineTrigger getCorpPlanet :getCorpPlanet "Class"
	pause
:corpPlanetsDone
		killtrigger getCorpPlanet
	killtrigger corpPlanetsDone
	killtrigger corpPlanetsDone2
	waitOn "Personal Planet Scan"

:getPersPlanetList
		setTextLineTrigger getPersPlanet :getPersPlanet "Class"
		setTextLineTrigger persPlanetsDone :persPlanetsDone "======   ============  ==== ==== ==== ===== ===== ===== ========== =========="
		setTextLineTrigger persPlanetsDone2 :persPlanetsDone "No Planets claimed"
		pause

:getPersPlanet
		gosub :getthisplanet
		setTextLineTrigger getPersPlanet :getPersPlanet "Class"
		pause

:persPlanetsDone
		killtrigger getPersPlanet
		killtrigger persPlanetsDone
		killtrigger persPlanetsDone2

:calculate
		setVar $overloads 0
		:compareOuterLoop
			if ($sector_list_length > 0)
				getWord $sector_list $currentDataSector 1
				setVar $planet~planets_this_sector 1
				setVar $compare_index 1
				:compareInnerLoop
					if ($compare_index < $sector_list_length)
						add $compare_index 1
						getWord $sector_list $compare_sector $compare_index
						if ($currentDataSector = $compare_sector)
							add $planet~planets_this_sector 1
						end
						goto :compareInnerLoop
					else
						if ($planet~planets_this_sector > $pps)
							setvar $switchboard~message "OVERLOAD: " & $planet~planets_this_sector & " planets found in sector " & $currentDataSector & "*"
							gosub :switchboard~switchboard
							add $overloads 1
						elseif ((($planet~planets_this_sector > 1) OR ($pps <= 1)) AND ($planet~planets_this_sector < $pps) AND ($showUnderload = TRUE))
							setvar $switchboard~message  ""&$planet~planets_this_sector & " planets found in sector " & $currentDataSector & ". Sector needs " &($pps-$planet~planets_this_sector)&" planets to be full.*"
							gosub :switchboard~switchboard
						end
						setVar $replace_sector $currentDataSector & " "
						replaceText $sector_list $replace_sector ""
						subtract $sector_list_length $planet~planets_this_sector
						goto :compareOuterLoop
					end
			else
				setvar $switchboard~message ""&$overloads & " Overloads Found*"
				gosub :switchboard~switchboard
				halt
			end


:getthisplanet
	setVar $line CURRENTLINE
	cutText $line $goodline 41 5
	if ($goodline = "Class")
		getWord $line $sector 1
		setVar $sector_list $sector_list & $sector & " "
		add $sector_list_length 1
	end
return
# ======================================= END OVERLOAD =========================================



# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\getplanetinfo\planet"
