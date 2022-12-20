loadVar $switchboard~bot_name
loadVar $bot~user_command_line
loadVar $bot~parm1
loadVar $bot~parm2
loadVar $bot~parm3
loadVar $bot~parm4
loadVar $bot~parm5
loadVar $bot~parm6
loadVar $bot~parm7
loadVar $bot~parm8

	setVar $START_FIG_HIT "Deployed Fighters Report Sector "
	setVar $END_FIG_HIT   ":"
        setVar $ALIEN_ANSI    #27 & "[1;36m" & #27 & "["
        setVar $START_FIG_HIT_OWNER ":"
	setVar $END_FIG_HIT_OWNER "'s"

		
#============================== RUNAWAY (RUNAWAY) ==============================
:runaway
	setVar $FIG_FILE 		"_MOM_" & GAMENAME & ".figs"
		
	gosub :player~quikstats
	setVar $startingLocation $player~CURRENT_PROMPT
	if ($bot~parm1 <> "on") and ($bot~parm1 <> "off")
		send "'{" $switchboard~bot_name "} - Please use - Runaway [on/off] format*"
		halt
	end

	if ($bot~parm1 = "on")
		if ($startingLocation <> "Citadel")
			send "'{" $switchboard~bot_name "} - Runaway must start at Citadel prompt*"
			halt
		end
		send "'{" $switchboard~bot_name "} - Activating Runaway*"
		goto :load_runaway
	else
		send "'{" $switchboard~bot_name "} - Please use - Runaway [on/off] format**"
		halt
	end

:load_runaway
	isNumber $test $bot~parm2
	if ($test)
		setVar $firstrun $bot~parm2
	else
		setVar $firstrun 0
	end
	getWordPos $bot~user_command_line $pos "evac"
	if ($pos > 0)
		setVar $doEvacuate TRUE
	else
		setVar $doEvacuate FALSE
	end

	send "s*"
	waitFor "<Scan Sector>"
	waitFor "(?="
	setVar $runsec $player~CURRENT_SECTOR


:set_flee_data
	send "'{" $switchboard~bot_name "} - Runaway initiated - Mapping...*"
	setVar $run_count 1
	setVar $run_database_count 0
	setVar $sectiona SECTORS
	divide $sectiona 78
	setVar $echo_count 1
	setArray $run_database SECTORS
	echo "** Plotting Primary Flee Sectors...**"

:start_run_count
	while ($run_count <= SECTORS)
		if (SECTOR.WARPCOUNT[$run_count] <> 2)
				if ($echo_count = $sectiona)
					echo ansi_13 #178
					setVar $echo_count 1
				else
					add $echo_count 1
				end
		else
			getSectorParameter $run_count "FIGSEC" $isFigged
			getDistance $rundist $runsec $run_count
			if (($rundist < 4) OR ($rundist > 12) OR ($isFigged < 1))
					if ($echo_count = $sectiona)
						echo ansi_13 #178
						setVar $echo_count 1
					else
						add $echo_count 1
					end
			else
				setvar $adjrunsec1 SECTOR.WARPS[$run_count][1]
				setVar $adjrunsec2 SECTOR.WARPS[$run_count][2]
				getSectorParameter $adjrunsec1 "FIGSEC" $isFiggedAdj1
				getSectorParameter $adjrunsec2 "FIGSEC" $isFiggedAdj2
				if ((SECTOR.WARPCOUNT[$adjrunsec1] = 1) OR (SECTOR.WARPCOUNT[$adjrunsec2] = 1) OR ($isFiggedAdj1 < 1) OR ($isFiggedAdj2 < 1))
					if ($echo_count = $sectiona)
						echo ansi_13 #178
						setVar $echo_count 1
					else
						add $echo_count 1
					end
				end
				add $run_database_count 1
				if ($echo_count = $sectiona)
					echo ansi_13 #178
					setVar $echo_count 1
				else
					add $echo_count 1
				end
				setVar $run_database[$run_database_count]  $run_count

			end		
		end
		add $run_count 1
	end
	if ($run_database_count < 20)
		send "'{" $switchboard~bot_name "} - Runaway list too short - ReMapping...*"
		waitFor "Message sent on"
	else
		goto :end_map
	end
	setVar $run_count 1

	
	
	echo "** Plotting Secondary Flee Sectors...**"
	setVar $echo_count 1
	:second_run_count
	while ($run_count <= SECTORS)
		
		if (SECTOR.WARPCOUNT[$run_count] <> 1]
				if ($echo_count = $sectiona)
					echo ansi_13 #178
					setVar $echo_count 1
				else
					add $echo_count 1
				end

		else
			getDistance $rundist $runsec $run_count
			getSectorParameter $run_count "FIGSEC" $isFigged
			
			if ($rundist < 4)
					if ($echo_count = $sectiona)
						echo ansi_13 #178
						setVar $echo_count 1
					else
						add $echo_count 1
					end
			elseif ($rundist > 12)
					if ($echo_count = $sectiona)
						echo ansi_13 #178
						setVar $echo_count 1
					else
						add $echo_count 1
					end
			elseif ($isFigged < 1)
					if ($echo_count = $sectiona)
						echo ansi_13 #178
						setVar $echo_count 1
					else
						add $echo_count 1
					end
			else
				setvar $adjrunsec1 SECTOR.WARPS[$run_count][1]
				getSectorParameter $run_count "FIGSEC" $isFiggedAdj1
				if ($isFiggedAdj1 < 1)
						if ($echo_count = $sectiona)
							echo ansi_13 #178
							setVar $echo_count 1
						else
							add $echo_count 1
						end
				else
					add $run_database_count 1
					if ($echo_count = $sectiona)
						echo ansi_13 #178
						setVar $echo_count 1
					else
						add $echo_count 1
					end
					setVar $run_database[$run_database_count]  $run_count
					
				end
			end
		end
		add $run_count 1
	end
:end_map
	if ($doEvacuate)
		send "'{" $switchboard~bot_name "} - Runaway/Evacuate Multiple Planets Mode - " $run_database_count " flee sectors plotted.*"
	else
		send "'{" $switchboard~bot_name "} - Runaway - " $run_database_count " flee sectors plotted.*"
	end
	goto :getsettings

:run_pwarp
	if ($firstrun <> 0)
		setVar $player~warpto $firstrun
		setVar $firstrun 0
	else
		gosub :getNewRunAwaySector
	end
	if ($doEvacuate)
		setVar $bot~parm1 $player~warpto
		goto :evac_start
	end
	setVar $player~warpto $player~warpto
	setVar $player~bot_name $switchboard~bot_name
	gosub :player~pwarp
	gosub :player~quikstats
	if ($player~CURRENT_SECTOR <> $player~warpto)
		goto :run_pwarp
	end
	setVar $runsec $player~CURRENT_SECTOR
	goto :getsettings

:getNewRunAwaySector
	setVar $player~warpto 0
	while ($player~warpto <= 0)
		getRnd $random 1 $run_database_count
		setVar $player~warpto $run_database[$random]
	end
return
#============================== END RUNAWAY (RUNAWAY) SUB ==============================

:getsettings
	killalltriggers
	setTextLineTrigger 1 :findfig "Deployed Fighters Report Sector"	
	pause

:findfig
	killalltriggers
	gosub :validateFighterHit
	if ($isValid <> TRUE)
		goto :getsettings
	end
	#getWord CURRENTLINE $fighit 5
	#stripText $fighit ":"
	#isNumber $test $fighit
	getDistance $dist $dropSector $player~CURRENT_SECTOR
	echo "[" $dist "]*"
	if ($dist <= 2)
		goto :run_pwarp
	end
	goto :getsettings
	
# ======================     START PLANET MOVER (EVAC) SUBROUTINE    ==========================
	:evac_start
		gosub :player~quikstats
		setVar $startingLocation $player~CURRENT_PROMPT
		if (($startingLocation <> "Citadel") AND ($startingLocation <> "Command"))
			send "'{" $switchboard~bot_name "} - Must start from Citadel or Command Prompt*"
			halt
		end
		if (($bot~parm1 = "s") and ($stardock <> 0))
			setvar $bot~parm1 $stardock
		end
		if (($bot~parm1 = "r") and ($rylos <> 0))
			setvar $bot~parm1 $rylos
		end
		if (($bot~parm1 = "a") and ($alpha_centauri <> 0))
			setvar $bot~parm1 $alpha_centauri
		end
		if (($bot~parm1 = "h") and ($home_sector <> 0))
			setvar $bot~parm1 $home_sector
		end
		setvar $target_sector $bot~parm1
	:evac_run	
		send "'{" $switchboard~bot_name "} - Starting Planet Evacuation to sector: "&$target_sector&".*"
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
		add $planet~planetCount 1
		getWord $line $planet~planet[$planet~planetCount] 1
		setTextLineTrigger getLine2 :evac_planetline "   <"
		setTextLineTrigger getEnd :evac_done "Land on which planet "
		pause

	:evac_no_scanner
		goto :evac_Move
	
	:evac_done
		killtrigger getline2
		setvar $evac_total $planet~planetCount
		setvar $planet~planetCount 1

	:evac_move
		send "l " $planet~planet[$planet~planetCount] "* "
		gosub :planetinfo~getPlanetInfo
		if ($planet~CITADEL < 4)
			add $planet~planetSkip 1
			goto :evac_twarp
		elseif ($planet~CITADEL > 3)
			send "m * * * t n t 1 * c p " $target_sector "*"
			settextlinetrigger warp :evac_Pwarp "Locating beam pinpointed, TransWarp"
			settextlinetrigger no_warp :evac_no_fig "You do not have any fighters in Sector"
			pause
		end

	:evac_Pwarp
		killtrigger no_Warp
		send "y*"
		if ($planet~planetCount = $evac_total)
			subtract $planet~planetCount $planet~planetSkip
			send "'{" $switchboard~bot_name "} - Evac Complete. Moved: "&$planet~planetCount&" Skipped: "&$planet~planetSkip&". *"
			goto :evac_end
		end
		send "qq  z  n  *  m" $evac_home "*y"
		SetTextTrigger warp :evac_twarp "All Systems Ready, shall we engage?"
		SetTextTrigger no_warp :evac_no_warp_back "Do you want to make"
		pause

	:evac_twarp
		killtrigger no_Warp
		add $planet~planetCount 1
		send "y  *  *  *  q  z  n  *"
		goto :evac_move

	:evac_no_warp_back
		killtrigger warp
		send "'{" $switchboard~bot_name "} - No Fighter at Home Sector.  Shutting down Evac.*"
		goto :evac_end

	:evac_no_fig
		killtrigger warp
		if ($mode = "Runaway")
			send "qqq* "
			gosub :getNewRunAwaySector
			setVar $target_sector $player~warpto
			goto :evac_move
		end
		send "'{" $switchboard~bot_name "} - No Fighter at Target Sector.  Shutting down Evac.*"

	:evac_end
		goto :getsettings

# ======================     END PLANET MOVER (EVAC) SUBROUTINE    ==========================

:validateFighterHit
	setVar $isValid FALSE
	cutText CURRENTLINE&" " $radio 1 1
	getText CURRENTLINE $dropSector $START_FIG_HIT $END_FIG_HIT
	if ($radio <> "D")
		return
	end
	getText CURRENTANSILINE $alien_check $START_FIG_HIT_OWNER $END_FIG_HIT_OWNER
	getWordPos CURRENTLINE $pos $START_FIG_HIT_OWNER
	getWordPos $alien_check $apos $ALIEN_ANSI
	if (($apos > 0) OR ($pos = 0))
		return
	end
	if ($targetingPerson)
		getWordPos CURRENTLINE $pos " "&$target&"'s "
		if ($pos <= 0)
			return
		end
	end
	setVar $isValid TRUE
return

include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\player\pwarp\player"
