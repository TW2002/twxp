	reqRecording
	gosub :BOT~loadVars

	loadVar $GAME~GENESIS_COST
	loadVar $GAME~ATOMIC_COST
	loadVar $MAP~STARDOCK 
	loadvar $bot~folder
	loadvar $game~MAX_PLANETS_PER_SECTOR
	loadvar $planet~planet_file
	loadVar $BOT~botIsDeaf
	loadVar $BOT~silent_running

	setVar $BUBBLE_LIST $bot~folder&"/bubble.list"
	setVar $BOT~command "unstack"

	setVar $BOT~help[1]  $BOT~tab&"  Moves overloaded planets automatically" 
	setVar $BOT~help[2]  $BOT~tab&"  into FARM or BUBBLE sectors."
	setVar $BOT~help[3]  $BOT~tab&"       "
	setVar $BOT~help[4]  $BOT~tab&" unstack {planet#1} {planet#2} ... {planet#x} {restack}"
	setVar $BOT~help[5]  $BOT~tab&"       "
	setVar $BOT~help[6]  $BOT~tab&"      Options: "
	setVar $BOT~help[7]  $BOT~tab&"        {planet#} - will not move listed planets"
	setVar $BOT~help[8]  $BOT~tab&"        {restack} - restacks last unstacked planets"
	gosub :bot~helpfile

	





	setArray $planet~planets 10000
	gosub :PLAYER~quikstats
	setvar $home $PLAYER~CURRENT_SECTOR
	setvar $startinglocation $player~current_prompt

	if ($PLAYER~PLANET_SCANNER = "No")
		setVar $SWITCHBOARD~message "Unstacker must be run with a planet scanner.*"
		gosub :SWITCHBOARD~switchboard
		halt
	elseif (($PLAYER~CURRENT_PROMPT <> "Citadel") and ($player~current_prompt <> "Command"))
		setVar $SWITCHBOARD~message "Unstacker must be run from the Citadel or Command Prompt.*"
		gosub :SWITCHBOARD~switchboard
		halt
	end

	getWordPos " "&$bot~user_command_line&" " $pos " restack "
	if ($pos > 0)
		setVar $restack TRUE
	else
		setVar $restack FALSE
	end


	if ($restack = true)
		loadvar $restack_location
		loadvar $restack_id
		setarray $id 10000
		setVar $j 1	
		setVar $temp_id ""
		setvar $skip " "
		while ($temp_id <> "[][][]")
			getWord $restack_id $temp_id $j "[][][]"
			getWord $restack_location $temp_location $j
			if ($temp_id <> "[][][]")
				isNumber $test $temp_id
				if ($test = true)
					if ($temp_id <> "0")
						setvar $id[$temp_id] $temp_location
					end
				end
			end
			add $j 1
		end
	else
		setvar $restack_id ""
		setvar $restack_location ""
		setVar $j 1	
		setVar $temp ""
		setvar $skip " "
		while ($temp <> "[][][]")
			getWord $bot~user_command_line $temp $j "[][][]"
			if ($temp <> "[][][]")
				isNumber $test $temp
				if ($test = true)
					if ($temp <> "0")
						setvar $skip $skip&" "&$temp&" "
					end
				end
			end
			add $j 1
		end
	end

	#gosub :PLANET~loadplanetInfo

	if (($startingLocation = "Citadel") and ($restack <> true))
		send "q"
		gosub :PLANET~getPlanetInfo
		send "c"
		setvar $startingplanet $planet~planet
		savevar $startingplanet
	end
	gosub :SHIP~getShipStats

	gosub :get_tl_list
	setvar $bot~parmameter "FARM"
	if ($restack = true)
		gosub :restack
		setvar $switchboard~message "I restacked every planet the best I could.  I would double check though.*"
		gosub :switchboard~switchboard
		gosub :player~quikstats
		if (($player~current_prompt = "Citadel") or ($player~current_prompt = "Command"))
			send "q q * "
			loadvar $startingplanet
			setvar $planet~planet $startingplanet
			gosub :planet~landingsub
		end


		halt
	end
:unstack
			gosub :count_planets
			if ($planet~CITADELs[$player~current_sector] > $game~MAX_PLANETS_PER_SECTOR)
				setVar $j 1
				setvar $planet~planets_to_move ($planet~CITADELs[$player~current_sector] - $game~MAX_PLANETS_PER_SECTOR)
				setvar $planet~planets_moved 0 

				while ($j <= $planet~planetCount)
					getwordpos $skip $pos " "&$planet~planets[$j]&" "
					if ($pos <= 0)
						send "l " & #8 & $planet~planets[$j] & "* "
						gosub :PLANET~getPlanetInfo
						if (($planet~planet_FUEL >= 5000) and ($planet~CITADEL >= 4))

							setVar $bottom 1
							setVar $top 1
							setArray $checked SECTORS
							setVar $que[1] $player~current_sector
							setVar $checked[$player~current_sector] 1
							:tryAgain2
							while ($bottom <= $top)
								# Now, pull out the next sector in the que, and make it our focus
								setVar $focus $que[$bottom]
								getsectorparameter $focus "FARM" $isFarmSector
								getsectorparameter $focus "BUBBLE" $isBubbleSector
								setvar $isTargettedSector false
								if (($isFarmSector <> true) and ($isBubbleSector <> true))
									goto :notit
								else
									setvar $isTargettedSector true
								end
								if (($isTargettedSector = true) and ($planet~CITADELs[$focus] < $game~MAX_PLANETS_PER_SECTOR))
									killtrigger 1
									killtrigger 2
									killtrigger 3
									send "c p "& $focus &"  *ys* "
									settextlinetrigger 1 :warp_it_balance "All Systems Ready, shall we engage?"
									settextlinetrigger 2 :no_warp_balance "You do not have any fighters in Sector"
									setTextLineTrigger 3 :warp_it_balance "You are already in that sector!"
									pause			

									:warp_it_balance
										setvar $planet~CITADELs[$focus] ($planet~CITADELs[$focus] + 1)
										setvar $planet~CITADELs[$player~current_sector] ($planet~CITADELs[$player~current_sector] - 1)
										setvar $player~startinglocation "Citadel"
										setVar $PLAYER~warpto $player~current_sector
										gosub :player~quikstats
										gosub :player~twarp
										gosub  :player~currentPrompt
										if ($PLAYER~twarpSuccess <> TRUE)
											setvar $switchboard~message "Twarp failed during planet balancing. "&$player~msg&" Halting!*"
											gosub :switchboard~switchboard
											halt
										end
										setvar $restack_id $restack_id&" "&$planet~planets[$j]&" "
										setvar $restack_location $restack_location&" "&$focus&" "
										savevar $restack_id
										savevar $restack_location
										add $planet~planets_moved 1
										if ($planet~planets_moved >= $planet~planets_to_move)
											goto :done_moving_planets
										end

									:no_warp_balance					
										killtrigger 1
										killtrigger 2
										killtrigger 3
										goto :done_moving_this_planet
										
								else
									:notit
									setVar $nearfig 0
								end
								# That wasn't it, so let's add all the adjacents to the que for future testing.
								setVar $a 1
								while (SECTOR.WARPS[$focus][$a] > 0)
									setVar $adjacent SECTOR.WARPS[$focus][$a]
									# But only add them if they haven't been added previously
									if ($checked[$adjacent] = 0)
										# Okay, this one hasn't been checked, so tag it and que it.
										setVar $checked[$adjacent] 1
										add $top 1
										setVar $que[$top] $adjacent
									end
									add $a 1
								end
								# The adjacents of $focus were all queued, now on to the next one.
								add $bottom 1
							end	
						end
						:done_moving_this_planet
						send "qq* "
					end
					add $j 1
				end
			end
			:done_moving_planets
				setvar $switchboard~message "I unstacked every planet I could.  Check to make sure!*"
				gosub :switchboard~switchboard


halt


:count_planets
	send "qq*  |l"
	waitOn "Registry# and Planet Name"
	setVar $planet~planetCount 0
	killalltriggers
	setTextLineTrigger planetGrabber :planetline "   <"
	setTextLineTrigger beDone :done "Land on which planet "
	setTextLineTrigger noplanets :done "You can create one with a Genesis Torpedo."
	send "* |"
	pause
	:planetline
		killalltriggers
		getWordPos CURRENTLINE $pos "<<<< SHIELDED"
		if ($pos <= 0)
			setVar $line CURRENTLINE
			replacetext $line "<" " "
			replacetext $line ">" " "
			striptext $line ","
			add $planet~planetCount 1
			getWord $line $planet~planets[$planet~planetCount] 1
		end
		setTextLineTrigger getLine2 :planetline "   <"
		setTextLineTrigger getend :done "Land on which planet "
		pause
	:done
         killalltriggers
         return

:get_tl_list
	setVar $sectorCount 0
	setarray $planet~CITADELs sectors
	killalltriggers
	setTextLineTrigger sectorGrabber :sector_planet_line "Class "
	setTextLineTrigger sectorbeDone :sector_done "======   ============"
	setVar $tl_planets " "
	if ($personal = TRUE)
		send "cyq"
	else
		if ($startinglocation = "Citadel")
			send "xlq"
		else
			send "tlq"
		end
	end
	pause
	:sector_planet_line
		killalltriggers
		getWord CURRENTLINE $testsector 1
		setvar $planet~CITADEL_count $planet~CITADELs[$testsector]
		setvar $planet~CITADELs[$testsector] ($planet~CITADEL_count + 1)
		setVar $tl_planets $tl_planets&" "&$testsector
		setTextLineTrigger getLine2 :sector_planet_line "Class"
		setTextLineTrigger getEnd :sector_done "======   ============"
		pause
	:sector_done
	killalltriggers
	send "@"
	waitOn "Average Interval Lag:"

return


:restack
	loadvar $starting_sector
	if ($starting_sector <= 10)
		setvar $starting_sector $player~current_sector
	end
	setvar $i 1
	while ($i <= 10000)
		if ($id[$i] <= 0)
			goto :next_sector
		end

		setvar $player~startinglocation "Citadel"
		setVar $PLAYER~warpto $id[$i]
		gosub :player~quikstats
		gosub :player~twarp
		gosub  :player~currentPrompt
		if ($PLAYER~twarpSuccess <> TRUE)
			setvar $switchboard~message "Twarp failed during planet balancing. "&$player~msg&" Halting!*"
			gosub :switchboard~switchboard
			halt
		end
		setvar $planet~planet $i
		gosub :planet~landingsub
		gosub :player~quikstats
		if ($player~current_prompt <> "Citadel")
			setvar $switchboard~message "Planet "&$i&" has been moved.  Cannot restack. Halting!*"
			gosub :switchboard~switchboard
			setvar $player~startingLocation "Command"
			setVar $PLAYER~warpto $starting_sector
			gosub :player~quikstats
			gosub :player~twarp
			gosub  :player~currentPrompt
			if ($PLAYER~twarpSuccess <> TRUE)
				setvar $switchboard~message "Twarp failed during planet balancing. "&$player~msg&" Halting!*"
				gosub :switchboard~switchboard
				halt
			end
			loadvar $startingplanet
			setvar $planet~planet $startingplanet
			gosub :planet~landingsub
			goto :next_sector
		end
		send "q "
		gosub :PLANET~getPlanetInfo
		if (($planet~planet_FUEL >= 5000) and ($planet~CITADEL >= 4))
			killtrigger 1
			killtrigger 2
			killtrigger 3
			send "c p "& $starting_sector &"  *ys* "
			settextlinetrigger 1 :warp_it_unbalance "All Systems Ready, shall we engage?"
			settextlinetrigger 2 :no_warp_unbalance "You do not have any fighters in Sector"
			setTextLineTrigger 3 :warp_it_unbalance "You are already in that sector!"
			pause			
		end
		:warp_it_unbalance

		:next_sector
		add $i 1
	end

return


:no_warp_unbalance
:no_warp_balance
	setvar $switchboard~message "Fighter lost in starting sector!  Halting, but you better check it out.*"
	gosub :switchboard~switchboard
	halt



#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\loadplanetinfo\planet"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\ship\getshipstats\ship"
include "source\bot_includes\planet\landingsub\planet"
include "source\bot_includes\player\twarp\player"
include "source\bot_includes\player\currentprompt\player"
