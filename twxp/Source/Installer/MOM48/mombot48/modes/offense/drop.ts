reqRecording
# Mind Over Matter Planet Drop
# Author: Mind Dagger

	gosub :BOT~loadVars
	setVar $BOT~command "drop"
	loadVar $BOT~bot_turn_limit
	loadVar $MAP~stardock
	loadvar $bot~subspace
	loadvar $switchboard~self_command
	loadvar $ship~ship_max_attack

	setVar $BOT~help[1]   $BOT~tab&"drop [on | off]{delay}{drop type}{trigger}{return}{kill} "
	setVar $BOT~help[2]   $BOT~tab&"       "
	setVar $BOT~help[3]   $BOT~tab&"     If started from command prompt, will be a ship dropper. "
	setVar $BOT~help[4]   $BOT~tab&"       "
	setVar $BOT~help[5]   $BOT~tab&"     - [delay]     = delay before dropping in milliseconds   "
	setVar $BOT~help[6]   $BOT~tab&"     - [drop type] = [d]irect, [a]djacent, [s]urround, "
	setvar $BOT~help[7]   $BOT~tab&"                     or [da] direct, then adjacent"
	setVar $BOT~help[8]   $BOT~tab&"     - [delay]     = delay before dropping in milliseconds "
	setVar $BOT~help[9]   $BOT~tab&"     - [trigger]   = [f]igs, [fm] figs or mines,  "
	setVar $BOT~help[10]  $BOT~tab&"                     [m]ines, [uf] No-Fig Mines"
	setVar $BOT~help[11]  $BOT~tab&"     - [return]    = return planet/ship home after 10 seconds"
	setVar $BOT~help[12]  $BOT~tab&"     - [kill]      = checks for enemy, and kills if possible"
	setVar $BOT~help[13]  $BOT~tab&"     - [fastkill]  = does kill mac without checking"
	setVar $BOT~help[14]  $BOT~tab&"     - [holotorp]  = does holotorp command after drop"
	setVar $BOT~help[15]  $BOT~tab&"     - [holokill]  = does holokill after drop"
	setVar $BOT~help[16]  $BOT~tab&"         "
	setVar $BOT~help[17]  $BOT~tab&"     All of these options can be run at the same time."
	setVar $BOT~help[18]  $BOT~tab&"     - Order of operations are:"
	setVar $BOT~help[19]  $BOT~tab&"             delay, drop, fastkill, kill,"
	setVar $BOT~help[20]  $BOT~tab&"             holotorp, holokill, return"

	gosub :bot~helpfile

	setVar $BOT~script_title "Dropper"
	gosub :BOT~banner

	setVar $PLAYER~save TRUE
	gosub :combat~init 

	getSectorParameter SECTORS "FIGSEC" $isFigged
	setvar $player~fasttwarp true


	setVar $START_FIG_HIT "Deployed Fighters Report Sector "
	setVar $END_FIG_HIT   ":"
	setVar $ALIEN_ANSI    #27 & "[1;36m" & #27 & "["
	setVar $START_FIG_HIT_OWNER ":"
	setVar $END_FIG_HIT_OWNER "'s"
	loadVar $map~stardock
	loadVar $map~backdoor
	loadVar $map~rylos
	loadVar $map~alpha_centauri
	loadVar $bot~command
	getWord $bot~user_command_line $bot~parm1 1
	getWord $bot~user_command_line $bot~parm2 2
	getWord $bot~user_command_line $bot~parm3 3
	getWord $bot~user_command_line $bot~parm4 4
	getWord $bot~user_command_line $bot~parm5 5
	getWord $bot~user_command_line $bot~parm6 6
	getWord $bot~user_command_line $bot~parm7 7
	getWord $bot~user_command_line $bot~parm8 8
	getSectorParameter SECTORS "FIGSEC" $isFigged
	if ($isFigged = "")
		setvar $switchboard~message "It appears no grid data is available.  Run a fighter grid checker that uses the sector parameter FIGSEC. (Try figs command)*"
		gosub :switchboard~switchboard
		halt
	end
	
	gosub :player~quikstats
	gosub :player~getinfo
	setVar $startingLocation $player~current_prompt
	setvar $isPlanetDrop false
	if ($startingLocation = "Citadel")
		setVar $script_ver "Mind Over Matter Planet Dropper"
		setvar $isPlanetDrop true
	elseif ($startingLocation = "Command")
		setVar $script_ver "Mind Over Matter Ship Dropper"
		if ($player~twarp_type = "No")
			setvar $switchboard~message "No twarp available.  Ship dropper is no good without transwarp drive.*"
			gosub :switchboard~switchboard
			halt
		end
	else
		setvar $switchboard~message "This script must be run from the Citadel or Command Prompt*"
		gosub :switchboard~switchboard
		setVar $bot~mode "General"
		savevar $bot~mode
		halt
	end
	if ($bot~parm1 <> "on")
		setvar $switchboard~message "Please use [on/off] {delay} {drop type} {trigger type} {kill} {return}*"
		gosub :switchboard~switchboard
		halt
	end
	setvar $bot~user_command_line $bot~user_command_line&" "
	isNumber $test $bot~parm2
	if ($test)
		setVar $dropDelay $bot~parm2
	else
		setVar $dropDelay 0
	end
	getWordPos $bot~user_command_line $pos " d "
	if ($pos > 0)
		setVar $dropDescription "Direct"
	else
		getWordPos $bot~user_command_line $pos " a "
		if ($pos > 0)
			setVar $dropDescription "Adjacent"
		else
			getWordPos $bot~user_command_line $pos " da "
			if ($pos > 0)
				setVar $dropDescription "Direct, then Adjacent"
			else
				getWordPos $bot~user_command_line $pos " s "
				if ($pos > 0)
					setVar $dropDescription "Surround"
				else
					getWordPos $bot~user_command_line $pos " ad "
					if ($pos > 0)
						setVar $dropDescription "Adjacent, then Direct"
					else
						setVar $dropDescription "Direct"
					end
				end
			end
		end
	end
	getWordPos $bot~user_command_line $pos " f "
	if ($pos > 0)
		setVar $triggerDescription "Fighters"
	else
		getWordPos $bot~user_command_line $pos " fm "
		if ($pos > 0)
			setVar $triggerDescription "Fighters and Mines"
		else
			getWordPos $bot~user_command_line $pos " m "
			if ($pos > 0)
				setVar $triggerDescription "Mines"
			else
				getWordPos $bot~user_command_line $pos " uf "
				if ($pos > 0)
					setVar $triggerDescription "Unfigged Mines"
				else
					setVar $triggerDescription "Fighters and Mines"
				end
			end
		end
	end
	getWordPos $bot~user_command_line $pos "return"
	if ($pos > 0)
		setVar $returnHome TRUE
		setVar $returnHomeDelay 10
	else
		setVar $returnHome FALSE
		setVar $returnHomeDelay 0
	end

	getWordPos $bot~user_command_line $pos "kill"
	if ($pos > 0)
		setVar $attackOnSight TRUE
	else
		setVar $attackOnSight FALSE
	end

	getWordPos " "&$bot~user_command_line&" " $pos " fastkill "
	if ($pos > 0)
		setVar $fastkill TRUE
	else
		setVar $fastkill FALSE
	end
	getWordPos " "&$bot~user_command_line&" " $pos " holokill "
	getWordPos " "&$bot~user_command_line&" " $pos2 " hkill "
	if (($pos > 0) or ($pos2 > 0))
		setVar $holokill TRUE
	else
		setVar $holokill FALSE
	end
	getWordPos " "&$bot~user_command_line&" " $pos " holotorp "
	getWordPos " "&$bot~user_command_line&" " $pos2 " htorp "
	if (($pos > 0) or ($pos2 > 0))
		setVar $holotorp TRUE
		if ($player~photons <= 0)
			setvar $switchboard~message "You can't run holotorp option without photons on your ship.*"
			gosub :switchboard~switchboard
			halt
		end
	else
		setVar $holotorp FALSE
	end

	if (($holokill = true) or ($holotorp = true))
		if (($PLAYER~SCAN_TYPE = "None") OR ($PLAYER~SCAN_TYPE = "Density"))
			setvar $switchboard~message "You need holoscanner to run the options you've chosen.*"
			gosub :switchboard~switchboard
			halt
		end
	end
	if (($attackOnSight = true) or ($fastkill = true) or ($holokill = true))
		if ($player~fighters < 100)
			setvar $switchboard~message "Fighters are waayyy too low for kill option.  You should refill first.*"
			gosub :switchboard~switchboard
			halt			
		end
	end

	gosub :player~quikstats
	setVar $homeSector $player~current_sector

	if ($player~corporation > 0)
		gosub :getCorpies
	end
	gosub :getName
	
	setVar $dropSector 0 
	setVar $ENDLINE "_ENDLINE_"
	setVar $STARTLINE "_STARTLINE_"
	gosub :SHIP~getShipStats

	
	

	if ($isPlanetDrop)
		gosub :planetStats
		setVar $message "Planet Dropper Currently Running On Planet "&$planet~planet&"*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*        Drop Type: "&$dropDescription&" On "&$triggerDescription
	else
		setVar $message "Ship Dropper Currently Running On Ship "&$player~ship_number&"*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*        Drop Type: "&$dropDescription&" On "&$triggerDescription
	end

	if ($targetingPerson)
		setVar $message $message&"*        Targeting: (Player) "&$target
	else
		setVar $message $message&"*        Targeting: Everyone"
	end
	if (($isPlanetDrop <> true) and ($player~towed <> ""))
		setVar $message $message&"*           Towing: "&$player~towed
	end
	if ($prelockActive)
		if ($prelockReleaseTime > 0)
			setVar $message $message&"*         Pre-Lock: Enabled With "&$prelockReleaseTime&" Second Release"
		else
			setVar $message $message&"*         Pre-Lock: Enabled With Manual Release Only"
		end
	end
	if ($dropDelay > 0)
		setVar $message $message&"*       Drop Delay: "&$dropDelay&" ms"
	end
	if ($attackOnSight)
		if ($isPlanetDrop)
			setVar $message $message&"*        Auto Kill: Enabled With "&$planet~planetFighters&" Fighters"
		else
			setVar $message $message&"*        Auto Kill: Enabled With "&$player~fighters&" Fighters"
		end
	end
	if ($fastkill)
		setVar $message $message&"*        Fast Kill: Will attempt kill macro at every pdrop attempt"
	end
	if ($holotorp)
		setVar $message $message&"*         Holotorp: Will attempt photoning any adjacent enemies"
	end
	if ($holokill)
		setVar $message $message&"*         Holokill: Will attempt to kill any adjacent enemies"
	end
	if ($returnHome)
		setVar $message $message&"*      Return Home: Enabled With "&$returnHomeDelay&" Second Delay"
	end
	setVar $message $message&"*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-**"	
	setvar $switchboard~message $message
	gosub :switchboard~switchboard

	:startTargeting
		gosub :player~quikstats
		if ($isPlanetDrop <> true)
				if ($player~twarp_type = "No")
					setvar $switchboard~message "No twarp available.  Possible pod?*"
					gosub :switchboard~switchboard
					halt
				end
				if ($player~fighters <= 0)
					setvar $switchboard~message "No more fighters available.  Fill up before running.*"
					gosub :switchboard~switchboard
					halt
				end
				if ($player~ore_holds <= 10)
					setvar $switchboard~message "Fuel too low.  Fill back up before running again.*"
					gosub :switchboard~switchboard
					halt
				end
				if ($player~ore_holds < $player~total_holds)
					setvar $switchboard~message "WARNING: You have "&$player~ore_holds&" out of "&$player~total_holds&" holds of fuel.  Make sure that's enough!*"
					gosub :switchboard~switchboard
				end
		end
		killAllTriggers
		if (($returnHome = TRUE) AND ($isManual <> TRUE) AND ($player~current_sector <> $homeSector))
			setVar $timeInMilli (($returnHomeDelay * 1000)+100)			
			echo ANSI_6 "*    [" ANSI_14 "Returning Home In " ANSI_15 $returnHomeDelay ANSI_14 " Seconds" ANSI_6 "]*" ANSI_7
			setDelayTrigger homeDelay :goHome $timeInMilli
		end
		setTextLineTrigger manual :manualPwarp "Planetary TransWarp Drive Engaged!"
		settextlinetrigger manual2 :manualTwarp "All Systems Ready, shall we engage? Yes"
		if (($triggerDescription = "Fighters and Mines") OR ($triggerDescription = "Mines") OR ($triggerDescription = "Unfigged Mines"))
			if ($targetingPerson = FALSE)
				setTextTrigger limp :attackSectorLimpet "Limpet mine in "
			end
			setTextTrigger armid :attackSectorMine "Your mines in "
		end
		if (($triggerDescription = "Fighters and Mines") OR ($triggerDescription = "Fighters"))
			setTextTrigger fig :attackSectorFighter "Deployed Fighters "
		end
		#setTextLineTrigger save :saveCall "=saveme"

		setTextLineTrigger warn :keepAlive "INACTIVITY WARNING:"
		setTextTrigger pause :pausing "Planet command (?="
		setTextTrigger pause2 :pausing "Computer command ["
		setTextTrigger pause3 :pausing "Corporate command ["
		setTextTrigger pause4 :pausing "Transfer To or From the Treasury (T/F)"
		setTextTrigger pause5 :pausing "Qcannon Control Type :"
		setTextTrigger pause6 :pausing "Beam to what sector? (U=Upgrade"
		setVar $isManual FALSE
		if ($attackOnSight)
			setTextLineTrigger warps :scan "warps into the sector."
			setTextLineTrigger lifts :scan "lifts off from"
		end
		pause
			
		:scan
			killAllTriggers
			goSub :checkForVictims
			goto :startTargeting
		
		:keepAlive
			killAllTriggers
			gosub :warning
			goto :startTargeting
	
		:pausing
			killAllTriggers
			if ($isPlanetDrop)
				echo ANSI_6 "*[" ANSI_14 $script_ver " paused. To restart, re-enter Citadel Prompt" ANSI_6 "]*" ANSI_7
				setTextTrigger restart :restarting "Citadel command ("
			else
				echo ANSI_6 "*[" ANSI_14 $script_ver " paused. To restart, re-enter Command Prompt" ANSI_6 "]*" ANSI_7
				setTextTrigger restart :restarting "Command [TL="
			end
			pause
			:restarting
				killAllTriggers
				echo ANSI_6 "*[" ANSI_14 $script_ver " restarted" ANSI_6 "]*" ANSI_7
				goto :startTargeting
	
		:answer
			killalltriggers
 			gosub :authenticate
			if ($auth_result = "true")
				killAllTriggers
				send $message
				waitOn "Sub-space comm-link terminated"
			end
			goto :startTargeting
		
		:goHome
			killAllTriggers
			if ($isPlanetDrop)
				send "p " $homeSector "*y"
			else
				killalltriggers
				setVar $PLAYER~WARPTO $homeSector
				gosub :PLAYER~twarp
				if (($PLAYER~twarpSuccess = FALSE) and ($player~msg <> "Already in that sector!"))
					setvar $switchboard~message "Could not make it back home with twarp. - ["&$player~msg&"]*"
					gosub :switchboard~switchboard
					halt
				end
			end		
			goto :startTargeting
		:manualPwarp
				killAllTriggers
				if ($attackOnSight)
					goSub :checkForVictims
				end
				setVar $isManual TRUE
				goto :startTargeting
		:manualTwarp
				killAllTriggers
				if ($attackOnSight)
					goSub :checkForVictims
				end
				setVar $isManual TRUE
				goto :startTargeting
		:attackSectorMine
			gosub :validateMineHit
			if ($isValid <> TRUE)
				goto :startTargeting
			end
			goto :getDropSector
			
		:attackSectorLimpet
			gosub :validateLimpetHit
			if ($isValid <> TRUE)
				goto :startTargeting
			end
			goto :getDropSector
		
		:attackSectorFighter
			gosub :validateFighterHit
			if ($isValid <> TRUE)
				goto :startTargeting
			end
			
		:getDropSector
			if ($dropDescription = "Direct")
				if ($isPlanetDrop)
					setvar $send "p "&$dropSector&"* y "
					if ($fastkill = true)
						setvar $send $send&"q q a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** c  "
					end
					send $send
				else
					killalltriggers
					setVar $PLAYER~WARPTO $dropSector
					gosub :PLAYER~twarp
					if (($PLAYER~twarpSuccess = FALSE) and ($player~msg <> "Already in that sector!"))
						setvar $switchboard~message "Could not make it to attack sector - ["&$player~msg&"]*"
						gosub :switchboard~switchboard
						goto :starttargeting
					end
					if ($fastkill = true)
						send "a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n * * "
					end
				end
				gosub :player~quikstats
				if ($player~current_sector = $dropSector)
					if ($attackOnSight)
						goSub :checkForVictims
					end	
				else
					if ($planetDrop)
						setSectorParameter $dropSector "FIGSEC" FALSE
					end
				end
			elseif ($dropDescription = "Adjacent")			
				gosub :findAdjacent
				goSub :attemptDrop
				if ($attackOnSight)
					goSub :checkForVictims
				end
				gosub :player~quikstats
			elseif ($dropDescription = "Adjacent, then Direct")			
				gosub :findAdjacent
				goSub :attemptDrop
				if ($planetDrop)
					send "p " $dropSector "* y "
				else
					setVar $PLAYER~WARPTO $dropSector
					gosub :PLAYER~twarp
					if (($PLAYER~twarpSuccess = FALSE) and ($player~msg <> "Already in that sector!"))
						goto :pwarpNo				
					else
						if ($fastkill = true)
							send "a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n * * "
						end
					end
				end
				if ($attackOnSight)
					goSub :checkForVictims
				end
				gosub :player~quikstats
			elseif ($dropDescription = "Direct, then Adjacent")			
				if ($planetDrop)
					setvar $gotosector $dropsector
					send "p " $dropSector "* y "
				else
					setvar $gotosector $dropsector
					setVar $PLAYER~WARPTO $dropSector
					gosub :PLAYER~twarp
					if (($PLAYER~twarpSuccess = FALSE) and ($player~msg <> "Already in that sector!"))
						goto :pwarpNo				
					else
						if ($fastkill = true)
							send "a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n * * "
						end
					end
				end
				gosub :findAdjacent
				goSub :attemptDrop
				if ($attackOnSight)
					goSub :checkForVictims
				end
				gosub :player~quikstats
			elseif ($dropDescription = "Surround")
				gosub :attemptSurroundDrop
				if ($attackOnSight)
					goSub :checkForVictims
				end
				gosub :player~quikstats
			else
				if ($dropSector <> $player~current_sector)
					send "p " $dropSector "*y"
					setTextTrigger pwarpNotOk :pwarpTryAdjacent "You do not have any fighters in Sector "
					setTextTrigger pwarpOk :pwarpDone " Planetary TransWarp Drive Engaged! "
					pause

					:pwarpDone
						killAllTriggers
						setVar $player~current_sector $dropSector
						if ($attackOnSight)
							goSub :checkForVictims
						end
						goto :startTargeting
				else
					if ($attackOnSight)
						goSub :checkForVictims
					end	
					goto :startTargeting
				end
				:pwarpTryAdjacent
					killAllTriggers
					setSectorParameter $dropSector "FIGSEC" FALSE
					gosub :findAdjacent
					gosub :attemptDrop
					goto :startTargeting
			
			end
		goto :startTargeting
	

:end
	killAllTriggers
	echo ANSI_6 "*[" ANSI_14 $script_ver " Shutting Down" ANSI_6 "]*" ANSI_7
	halt

:attemptSurroundDrop
	setVar $i 1
	setVar $checkSector SECTOR.WARPS[$dropSector][$i]
	setVar $isFound FALSE
	while (($checkSector > 0) AND ($isFound = FALSE))
		getSectorParameter $checkSector "FIGSEC" $isFigged
		if ($isFigged <> TRUE)
			setVar $retreatSector $checkSector
			setVar $isFound TRUE
		else
			add $i 1
			setVar $checkSector SECTOR.WARPS[$dropSector][$i]
		end
	end
	
	if ($isFound)
		setVar $i 2
		setVar $checkSector SECTOR.WARPS[$retreatSector][$i]
		setVar $isFound FALSE
		setVar $targets ""
		setVar $targetCount 0
		while (($checkSector > 0) AND ($targetCount <= 0))
			getSectorParameter $checkSector "FIGSEC" $isFigged
			if (($isFigged = TRUE) AND ($checkSector <> $dropSector))
				setVar $targets $targets&" "&$checkSector&" "
				add $targetCount 1
			end
			setVar $checkSector SECTOR.WARPS[$retreatSector][$i]
			add $i 1
		end
		if ($targetCount > 0)
			setVar $gotoSector $targets
			gosub :dopwarp
		else
			echo "** No Adjacent Fig Next To Possible Retreat Sector **"
		end		
	else
		echo "** No Possible Retreat Sector **"
	end		
return

:attemptDrop
	if ($targetCount > 0)
		getRnd $randomTarget 1 $targetCount
		if ($dropDelay > 0)
			killAllTriggers
			setDelayTrigger delay :planetDrop $dropDelay
			pause
		end
		:planetDrop
			setVar $gotoSector $targetSectors[$randomTarget]
			gosub :dopwarp
	end
	
return

:dopwarp
		killAllTriggers
		if ($isPlanetDrop)
			setvar $send "p "&$gotoSector&"*y"
			if ($fastkill = true)
				setvar $send $send&"q q a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** c  "
			end
			send $send
			setTextLineTrigger pwarpNo :pwarpNo "You do not have any fighters in Sector "
			setTextLineTrigger pwarpYes :pwarpYes " Planetary TransWarp Drive Engaged! "
			setTextLineTrigger pwarpAlreadyThere :pwarpFinished "You are already in that sector!"
			pause
		else
			killalltriggers
			setVar $PLAYER~WARPTO $gotoSector
			gosub :PLAYER~twarp
			if (($PLAYER~twarpSuccess = FALSE) and ($player~msg <> "Already in that sector!"))
				goto :pwarpNo				
			end
			if ($fastkill = true)
				send "a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n * * "
			end
			goto :pwarpYes
		end
	:pwarpNo
		killAllTriggers
		setVar $targetSectors[$randomTarget] 0
		setSectorParameter $gotoSector "FIGSEC" FALSE
		setVar $i 1
		while ($i <= $targetCount)
			if ($targetSectors[$i] > 0)
				setVar $randomTarget $i
				goto :planetDrop
			end
			add $i 1
		end
		goto :pwarpFinished
	:pwarpYes
		killAllTriggers
	:pwarpFinished		
		goSub :player~quikstats

return

:clearScreen
	echo #27 & "[2J"
return

:turnOffAnsi
	send "c n"
	killAllTriggers
	waitOn "(1) ANSI graphics"
	getWord CURRENTLINE $ansiStatus 5
	waitOn "(2) Animation display"
	getWord CURRENTLINE $animationStatus 5
	if ($animationStatus = "On")
		send "2"
	end
	if ($ansiStatus = "On")
		send "1 q q"
	else
		send "q q"
	end
	waitOn "<Computer deactivated>"
return

:turnOnAnsi
	send "c n"
	killAllTriggers
	waitOn "(1) ANSI graphics"
	getWord CURRENTLINE $ansiStatus 5
	if ($ansiStatus = "Off")
		send "1 q q"
	else
		send "q q"
	end
	waitOn "<Computer deactivated>"
return


:planetStats
	send "q "
	gosub :player~quikstats
	send "*"
	waitOn "Planet #"
	getWord CURRENTLINE $planet~planet 2
	waitOn "Fighters"
	getWord CURRENTLINE $planet~planetFighters 5
	stripText $planet~planet "#"
	send "c"
return

:warning
	send "#"
return

:landOnPlanetEnterCitadel
	send "l " $planet~planet "* c"
	waitOn "<Enter Citadel>"
return

:leaveCitadelAndPlanet	
	send "q q"
	waitOn "Blasting off from"
	waitOn "Command [TL"
return





:showPrelockOptions
	echo ANSI_6 "*[" ANSI_14 $script_ver " Pre-locked onto sector " $gotoSector ANSI_6 "]*" ANSI_7
	echo ANSI_6 "  [" ANSI_14 "%" ANSI_6 "]" ANSI_15 " Let Go of Pre-Lock*"  ANSI_7
	if ($prelockReleaseTime > 0)
		echo ANSI_6 "[" ANSI_14 "Script will release pre-lock automatically in "&$prelockReleaseTime&" seconds.." ANSI_6 "]*" ANSI_7
	end
return

:showOptions
	echo ANSI_6 "*[" ANSI_14 $script_ver " Options" ANSI_6 "]*" ANSI_7
	echo ANSI_6 "  [" ANSI_14 "%" ANSI_6 "]" ANSI_15 " Change Drop Settings*"
	echo ANSI_6 "[" ANSI_14 $script_ver " waiting for targets.." ANSI_6 "]*" ANSI_7
return

:scanit_again
	killAllTriggers
	gosub :sector~getSectorData
	if ($sector~realTraderCount > ($sector~corpieCount + $sector~defenderShips))
		if ($isPlanetDrop)
			goSub :combat~fastCitadelAttack
		else
			gosub :combat~fastAttack
		end
		goto :scanit_again
	elseif (($sector~emptyShipCount > $sector~myShipCount) AND ($capEmptyShips = TRUE))
		gosub :combat~fastCapture
		goto :scanit_again
	end
	goto :startTargeting


:checkForVictims
	gosub :player~quikstats
	if ($player~fighters <= 0)
		goto :goHome
	end
	:scanit_again
	setvar $player~startingLocation $player~current_prompt
	gosub :sector~getSectorData
	if ($sector~realTraderCount > ($sector~corpieCount + $sector~defenderShips))
		if ($isPlanetDrop)
			goSub :combat~fastCitadelAttack
		else
			gosub :combat~fastAttack
		end
		goto :scanit_again
	elseif (($sector~emptyShipCount > $sector~myShipCount))
		gosub :combat~fastCapture
		goto :scanit_again
	end
	if ($holotorp)
		setVar $BOT~command "htorp"
		setVar $BOT~user_command_line " htorp "
		setVar $BOT~parm1 ""
		saveVar $BOT~parm1
		saveVar $BOT~command
		saveVar $BOT~user_command_line
		load "scripts\"&$bot~mombot_directory&"\commands\offense\htorp.cts"
		setEventTrigger		htorpdone		:htorpdone "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\offense\htorp.cts"
		pause
		:htorpdone
	end
	if ($holokill)
		setvar $before_holo_kill_sector $player~current_sector
		gosub :combat~holokill
		if ($player~current_sector <> $before_holo_kill_sector)
			setVar $PLAYER~WARPTO $before_holo_kill_sector
			gosub :PLAYER~twarp
			if (($PLAYER~twarpSuccess = FALSE) and ($player~msg <> "Already in that sector!"))
				setvar $switchboard~message "Could not make it back to starting sector before holokill. - ["&$player~msg&"]*"
				gosub :switchboard~switchboard
				halt
			end
		end

	end
return	



:getDropperStats
	send "c;q"
	waitFor "Figs Per Attack:"
	getWord CURRENTLINE $ship~SHIP_MAX_ATTACK 5

	send "q m****c "
	waitOn "Planet #"
	getWord CURRENTLINE $planet~planet 2
	waitOn "Fighters        N/A"
	getWord CURRENTLINE $planet~planetFighters 5
	waitOn "<Enter Citadel>"

	stripText $planet~planet "#"
	SetVar $isManual FALSE
	gosub :getstats
return

:authenticate
    killalltriggers
    setVar $subLine CURRENTLINE
    setVar $subLine $subLine & "             "
    getWord $subLine $spoof 1
    cutText $subLine $subSender 3 6
    setVar $auth_result "false"
    if ($spoof = "'")
        setVar $auth_result "self"
    elseif ($spoof = "R")
        setVar $thisCorpie 0
        :corpieSubLoop
            add $thisCorpie 1
            if ($thisCorpie <= $player~corpies)
                if (($subSender = $player~corpie[$thisCorpie]))
                    setVar $auth_result "true"
                    goto :authDone
                end
                goto :corpieSubLoop
            end
    end
    :authDone
return

:getName
    send "I"
    waitfor "<Info>"
    :waitForName
        setTextLineTrigger getName :getTraderName "Trader Name    :"
        setTextTrigger getNameDone :getNameDone "Command [TL="
        setTextTrigger getNameDone2 :getNameDone "Citadel command"
        pause

    :getTraderName
        killAllTriggers
        setVar $name CURRENTLINE
        stripText $name "Trader Name    : "
        stripText $name "3rd Class "
        stripText $name "2nd Class "
        stripText $name "1st Class "
        stripText $name "Annoyance "
        stripText $name "Nuisance "
        stripText $name "Menace "
        stripText $name "Smuggler Savant "
        stripText $name "Smuggler "
        stripText $name "Robber "
        stripText $name "Private "
        stripText $name "Lance Corporal "
        stripText $name "Corporal "
        stripText $name "Staff Sergeant "
        stripText $name "Gunnery Sergeant "
        stripText $name "1st Sergeant "
        stripText $name "Sergeant Major "
        stripText $name "Sergeant "
        stripText $name "Chief Warrant Officer "
        stripText $name "Warrant Officer "
        stripText $name "Terrorist "
        stripText $name "Infamous Pirate "
        stripText $name "Notorious Pirate "
        stripText $name "Dread Pirate "
        stripText $name "Pirate "
        stripText $name "Galactic Scourge "
        stripText $name "Enemy of the State "
        stripText $name "Enemy of the People "
        stripText $name "Enemy of Humankind "
        stripText $name "Heinous Overlord "
        stripText $name "Prime Evil "
        stripText $name "Ensign "
        stripText $name "Lieutenant J.G. "
        stripText $name "Lieutenant Commander "
        stripText $name "Lieutenant "
        stripText $name "Commander "
        stripText $name "Captain "
        stripText $name "Commodore "
        stripText $name "Rear Admiral "
        stripText $name "Vice Admiral "
        stripText $name "Fleet Admiral"
        stripText $name "Admiral "
        stripText $name "Civilian "
        goto :waitForName
    :getNameDone
        killalltriggers
return



# ----- SUB :getCorpies
:getCorpies
    setVar $player~corpies 0
    send "XAQ"
    waitfor " Corp Member Name                   Sector  Fighters Shields Mines  Credits"
    waitfor "------------------------------------------------------------------------------"
    :waitForCorpieName
        setTextLineTrigger getCorpieName :getCorpieName
        pause

    :getCorpieName
        killAllTriggers
        if (CURRENTLINE = "P indicates Trader is on a planet in that sector")
            goto :getCorpieNameDone
        end
        add $player~corpies 1
        setVar $player~corpieLine CURRENTLINE
        setVar $player~corpieLine $player~corpieLine & "          "
        cutText $player~corpieLine $player~corpie[$player~corpies] 1 6
        goto :waitForCorpieName
    :getCorpieNameDone
        killalltriggers
return

:validateMineHit
	setVar $isValid FALSE
	cutText CURRENTLINE&"    " $ck 1 1
	if ($ck <> "Y")
		return
	end
	getText CURRENTLINE $dropSector "Your mines in " " did"
	getText CURRENTANSILINE $alien_check $START_FIG_HIT_OWNER $END_FIG_HIT_OWNER
	getWordPos CURRENTLINE $pos $START_FIG_HIT_OWNER
	getWordPos $alien_check $apos $ALIEN_ANSI
	if (($apos > 0) OR ($pos = 0))
		return
	end
	if ($targetingPerson)
		getWordPos CURRENTLINE&" " $pos " "&$target&" "
		if ($pos = 0)
			return
		end
	end
	setVar $isValid TRUE
return

:validateLimpetHit
	setVar $isValid FALSE
	cutText CURRENTLINE&" " $radio 1 1
	if ($radio <> "L")
		return
	end
	setVar $isValid TRUE
	getText CURRENTLINE $dropSector "Limpet mine in " " a"
return

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

:findAdjacent
        getSectorParameter $dropSector "FIGSEC" $isFigged
        if (($triggerDescription = "Unfigged Mines") AND ($isFigged = TRUE))
                return
        else
                setVar $i 1
                setVar $checkSector SECTOR.WARPS[$dropSector][$i]
                setArray $targetSectors 6
                setVar $targetCount 0
                while ($checkSector > 0)
                        getSectorParameter $checkSector "FIGSEC" $isFigged
                        if ($isFigged = TRUE)
                                add $targetCount 1
                                setVar $targetSectors[$targetCount] $checkSector
                        end
                        add $i 1
                        setVar $checkSector SECTOR.WARPS[$dropSector][$i]
                end
                if ($targetCount <= 0)
                        echo "No Targets..*"
                        setVar $targetSectors[1] $CURRENT_LOCATION
                end
        end

return

#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\combat\init\combat"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\player\getinfo\player"
include "source\bot_includes\ship\getshipstats\ship"
include "source\bot_includes\player\twarp\player"
include "source\bot_includes\sector\getsectordata\sector"
include "source\bot_includes\combat\fastcitadelattack\combat"
include "source\bot_includes\combat\fastcapture\combat"
include "source\bot_includes\combat\fastattack\combat"
include "source\bot_includes\combat\holokill\combat"
