reqRecording
# Mind Over Matter Planet Drop
# Author: Mind Dagger

	gosub :BOT~loadVars
	setVar $BOT~command "pdrop"
	loadVar $BOT~bot_turn_limit
	loadVar $MAP~stardock
	loadvar $bot~subspace
	loadvar $switchboard~self_command
	loadvar $ship~ship_max_attack

	setVar $BOT~help[1]   $BOT~tab&"pdrop {delay:#} {d|a|s|da|de} {fm|f|m|uf} {return} {kill}     "
	setVar $BOT~help[2]   $BOT~tab&"      {fastkill} {defender} {perfect} {density} {lock}        "
	setVar $BOT~help[3]   $BOT~tab&"      {plockt:#} {figs:#} {offensive} {twohops} {retrigger}   "
	setVar $BOT~help[4]   $BOT~tab&"      {densityx} {iglift}                                     "
	setVar $BOT~help[5]   $BOT~tab&"        "
	setVar $BOT~help[6]   $BOT~tab&"  {delay:#} - delay before dropping in milliseconds"
	setVar $BOT~help[7]   $BOT~tab&"        {d} - direct drop"
	setVar $BOT~help[8]   $BOT~tab&"        {a} - adjacent drop"
	setVar $BOT~help[9]   $BOT~tab&"        {s} - surround drop"
	setVar $BOT~help[10]  $BOT~tab&"       {da} - direct, then adjacent drop"
	setVar $BOT~help[11]  $BOT~tab&"       {de} - dead end drop"
	setVar $BOT~help[12]  $BOT~tab&"       {fm} - trigger on fighter and mine hits"
	setVar $BOT~help[13]  $BOT~tab&"        {f} - trigger on fighter hits only"
	setVar $BOT~help[14]  $BOT~tab&"        {m} - trigger on mines only"
	setVar $BOT~help[15]  $BOT~tab&"       {uf} - trigger on mines with no fighters"
	setVar $BOT~help[16]  $BOT~tab&"   {return} - will return planet home after 10 seconds"
	setVar $BOT~help[17]  $BOT~tab&"     {kill} - checks for enemy, and kills if possible"
	setVar $BOT~help[18]  $BOT~tab&" {fastkill} - does kill mac without checking"
	setVar $BOT~help[19]  $BOT~tab&" {defender} - sets and lifts IG capable defender"
	setVar $BOT~help[20]  $BOT~tab&"  {perfect} - Only drops adjacent when it is only option"
	setVar $BOT~help[21]  $BOT~tab&"  {density} - Drops adjacent, runs density photon"
	setVar $BOT~help[22]  $BOT~tab&"     {lock} - Locks on sector then halts"
	setVar $BOT~help[23]  $BOT~tab&" {plockt:#} - Plock delay before retrigger. Default is no retrigger."
	setVar $BOT~help[24]  $BOT~tab&"   {figs:#} - drop this many figs to sector on landing"
	setVar $BOT~help[25]  $BOT~tab&"{offensive} - make figs offensive, default defense."	
	setVar $BOT~help[26]  $BOT~tab&"  {twohops} - deadend drop, make sure de 2 hops or more away"	
	setVar $BOT~help[27]  $BOT~tab&"{retrigger} - Keep hunting for targets"	
	setVar $BOT~help[28]  $BOT~tab&" {densityx} - Density < 40 for xport in and deploy"
	setVar $BOT~help[29]  $BOT~tab&"   {iglift} - sets and lifts IG self"
	setVar $BOT~help[30]  $BOT~tab&"    "
	setVar $BOT~help[31]  $BOT~tab&"   Examples:"
	setVar $BOT~help[32]  $BOT~tab&"      >pdrop delay:10000 d f return kill"
	setVar $BOT~help[33]  $BOT~tab&"      >pdrop 1000 da fm "
	setVar $BOT~help[34]  $BOT~tab&"      >pdrop a f kill"
	
		
	gosub :bot~helpfile

	setVar $BOT~script_title "Planet Dropper"
	gosub :BOT~banner

	setVar $PLAYER~save TRUE
	gosub :combat~init 

	getSectorParameter SECTORS "FIGSEC" $isFigged


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
		send "'{" $bot~bot_name "} - It appears no grid data is available.  Run a fighter grid checker that uses the sector parameter FIGSEC. (Try figs command)*"
		halt
	end
	
	gosub :player~quikstats
	setVar $startingLocation $player~current_prompt
	setVar $script_ver "Mind Over Matter Bot P-drop"
	if ($startingLocation <> "Citadel")
		send "'{" $bot~bot_name "} - This script must be run from the Citadel Prompt*"
		setVar $mode "General"
	        halt
	end

	loadvar $ship~CAP_FILE	
	fileExists $CAP_FILE_chk $ship~CAP_FILE
	if ($CAP_FILE_chk)
		gosub :ship~loadshipinfo
	else
		gosub :ship~getShipCapStats
		gosub :ship~loadShipInfo
	end 

	gosub :ship~getshipstats


	setvar $bot~user_command_line " "&$bot~user_command_line&" "

	getWordPos $bot~user_command_line $pos " delay:"
	if ($pos > 0)
		setVar $cline $bot~user_command_line & " "
		getText $cline $dropDelay "delay:" " "
	else
		isNumber $test $bot~parm1
		if ($test)
			setVar $dropDelay $bot~parm1
		else
			setVar $dropDelay 0
		end
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
						getWordPos $bot~user_command_line $pos " de "
						if ($pos > 0)
							setVar $dropDescription "Deadend Drop"
						else
							setVar $dropDescription "Direct"
						end
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
	setVar $randomAttack TRUE

	getWordPos $bot~user_command_line $pos "cap"
	if ($pos > 0)
		setVar $capture TRUE
		setVar $attackOnSight TRUE
	else
		setVar $capture FALSE
	end

	getWordPos $bot~user_command_line $pos "fastkill"
	if ($pos > 0)
		setVar $fastkill TRUE
	else
		setVar $fastkill FALSE
	end

	getWordPos $bot~user_command_line $pos "retrigger"
	if ($pos > 0)
		setVar $retrigger TRUE
	else
		setVar $retrigger FALSE
	end

	setVar $dropftrsType "d"
	getWordPos $bot~user_command_line $pos "figs:"
	if ($pos > 0)
		setVar $dropftrs TRUE
		setVar $cline $bot~user_command_line & " "
		getText $cline $dropFigQuant "figs:" " "

		getWordPos $bot~user_command_line $pos "offensive"
		if ($pos > 0)
			setVar $dropftrsType "o"
		else
			setVar $dropftrsType "d"
		end
	else
		setVar $dropftrs FALSE
	end

	getWordPos $bot~user_command_line $pos "plockt:"
	if ($pos > 0)
		
		setVar $cline $bot~user_command_line & " "
		getText $cline $plockTimer "plockt:" " "
	else
		setVar $plockTimer 0
	end
		

	getWordPos $bot~user_command_line $pos "defender"
	if ($pos > 0)
		setVar $defender TRUE
	else
		setVar $defender FALSE
	end
	
	getWordPos $bot~user_command_line $pos "perfect"
	if ($pos > 0)
		setVar $perfect TRUE
	else
		setVar $perfect FALSE
	end
	getWordPos $bot~user_command_line $pos "lock"
	if ($pos > 0)
		setVar $lock TRUE
	else
		setVar $lock FALSE
	end

	getWordPos $bot~user_command_line $pos "twohops"
	if ($pos > 0)
		setVar $twohops TRUE
	else
		setVar $twohops FALSE
	end

	getWordPos $bot~user_command_line $pos "density"
	if ($pos > 0)
		setVar $density TRUE
		if ($dropDescription = "Direct")
			setVar $dropDescription "Adjacent"
		end
		if ($Player~Photons < 1)
			setVar $SWITCHBOARD~message "No Photons on Board!!*"
			gosub :SWITCHBOARD~switchboard
			halt
		end
	else
		setVar $density FALSE
	end
	
	getWordPos $bot~user_command_line $pos "densityx"
	if ($pos > 0)
		setVar $densityx TRUE
	else
		setVar $densityx FALSE
	end

	getWordPos $bot~user_command_line $pos "iglift"
	if ($pos > 0)
		setVar $iglift TRUE
	else
		setVar $iglift FALSE
	end



	setVar $randomAttack TRUE

	gosub :player~quikstats
	if ($player~corporation > 0)
		gosub :getCorpies
	end
	gosub :getName
	setVar $script_ver "Planet Drop"

	setVar $dropSector 0 
	setVar $ENDLINE "_ENDLINE_"
	setVar $STARTLINE "_STARTLINE_"
	cutText CURRENTLINE $location 1 7
	if ($location <> "Citadel")
	        echo ansi_12 "**This script must be run from the Citadel Prompt"
	        halt
	end
	send "c;q"
	waitFor "Figs Per Attack:"
	getWord CURRENTLINE $maxFigAttack 5

	
	

	gosub :planetStats

	setVar $message "'*  {"&$bot~bot_name&"} - Planet Dropper Currently Running On Planet "&$planet~planet&"*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*        Drop Type: "&$dropDescription&" On "&$triggerDescription
	if ($targetingPerson)
		setVar $message $message&"*        Targeting: (Player) "&$target
	else
		setVar $message $message&"*        Targeting: Everyone"
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
	if ($lock)
		setVar $message $message&"*       Plock Mode: Enabled"
	end 
	if ($attackOnSight)
		format $planet~planet_fighters $formatted_fighters NUMBER
		if ($capture)
			setVar $message $message&"*         Auto Cap: Enabled With "&$formatted_fighters&" Fighters"		
		else
			setVar $message $message&"*        Auto Kill: Enabled With "&$formatted_fighters&" Fighters"
		end
	end
	if ($fastkill)
		setVar $message $message&"*        Fast Kill: Will attempt kill macro at every pdrop attempt"
	end
	if ($returnHome)
		setVar $message $message&"*      Return Home: Enabled With "&$returnHomeDelay&" Second Delay"
	end
	if ($retrigger)
		setVar $message $message&"*        ReTrigger: We will keep firing whether we hit or miss."
	end
	
	if ($defender = 1)
		setVar $message $message&"*         Defender: Will set and reset IG enabled Corp Mate"
	end
	if ($perfect = 1)
		setVar $message $message&"*          Perfect: Will only drop adjacent on perfect firing solution."
	end
	if ($density = 1)
		setVar $message $message&"*          Density: Dropping in next door with density foton."
	end
	if ($density = 1) and ($densityx = 1)
		setVar $message $message&"*          Density: Only shooting from 1 to 39."
	end
	if ($iglift = 1)
		setVar $message $message&"*           IGLift: I will lift on landing and hold."
	end
	
	if ($randomAttack)
		setVar $message $message&"*   Attack Pattern: Random"
	elseif ($firstAttack)
		setVar $message $message&"*   Attack Pattern: First Available Target"
	elseif ($secondAttack)
		setVar $message $message&"*   Attack Pattern: Second Available Target"
	elseif ($thirdAttack)
		setVar $message $message&"*   Attack Pattern: Third Available Target"
	elseif ($fourthAttack)
		setVar $message $message&"*   Attack Pattern: Fourth Available Target"
	elseif ($fifthAttack)
		setVar $message $message&"*   Attack Pattern: Fifth Available Target"
	elseif ($sixthAttack)
		setVar $message $message&"*   Attack Pattern: Sixth Available Target"
	else
		setVar $message $message&"*   Attack Pattern: Last Available Target"
	end
	setVar $message $message&"*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-**"	
	send $message
	if ($defender = 1)
		goSub :checkDefenders
		goSub :setdefender
	end
	if ($iglift = 1)
		goSub :liftAndCheckIG
	end
	gosub :player~quikstats
	setVar $homeSector $player~current_sector
	:startTargeting
		killAllTriggers
		if (($returnHome = TRUE) AND ($isManual <> TRUE) AND ($player~current_sector <> $homeSector))
			setVar $timeInMilli (($returnHomeDelay * 1000)+100)			
			echo ANSI_6 "*    [" ANSI_14 "Returning Home In " ANSI_15 $returnHomeDelay ANSI_14 " Seconds" ANSI_6 "]*" ANSI_7
			setDelayTrigger homeDelay :goHome $timeInMilli
		end
		setTextLineTrigger manual :manualPwarp "Planetary TransWarp Drive Engaged!"
		if (($triggerDescription = "Fighters and Mines") OR ($triggerDescription = "Mines") OR ($triggerDescription = "Unfigged Mines"))
			if ($targetingPerson = FALSE)
				setTextTrigger limp :attackSectorLimpet "Limpet mine in "
			end
			setTextTrigger armid :attackSectorMine "Your mines in "
		end
		if (($triggerDescription = "Fighters and Mines") OR ($triggerDescription = "Fighters"))
			setTextTrigger fig :attackSectorFighter "Deployed Fighters "
		end
		setTextLineTrigger warn :keepAlive "INACTIVITY WARNING:"
		setTextTrigger pause :pausing "Planet command (?="
		setTextTrigger pause2 :pausing "Computer command ["
		setTextTrigger pause3 :pausing "Corporate command ["
		setTextTrigger pause4 :pausing "Transfer To or From the Treasury (T/F)"
		setTextTrigger pause5 :pausing "Qcannon Control Type :"
		setTextTrigger pause6 :pausing "Beam to what sector? (U=Upgrade"
		setTextOutTrigger redoSettings :doSettings "%" 
		#setTextLineTrigger scriptcheck :answer "script?"
    		#setTextLineTrigger scriptcheck2 :answer "Script?"
    		setVar $isManual FALSE
		if ($attackOnSight)
			setTextLineTrigger 	limp2 	:scan 	"Limpet mine in "&$player~CURRENT_SECTOR
			setTextLineTrigger 	warps 	:scan 	"warps into the sector."
			setTextLineTrigger 	lifts 	:scan 	"lifts off from"
			setTextLineTrigger 	deffig 	:scan 	"Deployed Fighters Report Sector "&$player~CURRENT_SECTOR
			setTextLineTrigger 	secgun 	:scan 	"Quasar Cannon on"
			setTextLineTrigger 	ig		:scan 	"Shipboard Computers The Interdictor Generator on"
			setTextLineTrigger 	power 	:scan 	"is powering up weapons systems!"
			settextlinetrigger  wave    :scan    " launches a wave of fighters at  "
			settextlinetrigger  planet  :scan	" launches a Genesis Torpedo into the sector!"
			settextlinetrigger  atomic  :scan    " appears from the planetary rubble."
			setTextLineTrigger 	exits 	:scan 	"exits the game."
			setTextLineTrigger 	enters 	:scan 	"enters the game."
			setDelayTrigger		delay	:scan	30000
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
			echo ANSI_6 "*[" ANSI_14 $script_ver " paused. To restart, re-enter Citadel Prompt" ANSI_6 "]*" ANSI_7
			setTextTrigger restart :restarting "Citadel command ("
			pause
			:restarting
				killAllTriggers
				echo ANSI_6 "*[" ANSI_14 $script_ver " restarted" ANSI_6 "]*" ANSI_7
				goSub :getSectorLocation
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
			
			if ($dropftrs)

				goSub :retrieveFigs
					
			end
				
			
			send "p " $homeSector "*y"
		
		:manualPwarp
				killAllTriggers
				if ($attackOnSight)
					goSub :checkForVictims
				end
				setVar $isManual TRUE
				goSub :getSectorLocation
				goto :startTargeting
		:attackSectorMine
			killtrigger fig
			killtrigger limp
			gosub :validateMineHit
			if ($isValid <> TRUE)
				goto :startTargeting
			end
			goto :getDropSector
		:attackSectorLimpet
			killtrigger armid
			killtrigger fig
			gosub :validateLimpetHit
			if ($isValid <> TRUE)
				goto :startTargeting
			end
			goto :getDropSector
		:attackSectorFighter
			killtrigger armid
			killtrigger limp
			gosub :validateFighterHit
			if ($isValid <> TRUE)
				goto :startTargeting
			end
		:getDropSector

			if ($dropDescription = "Direct")
				if ($lock = true)
					setvar $send "p "&$dropSector&"*"
					send $send
					goto :doLock
				else
					setvar $send "p "&$dropSector&"* y "
					if ($fastdrop = true)
						if ($ship~SHIP_FIGHTERS_MAX <= 100000)
							setvar $figstodrop ($ship~ship_fighters_max/2)
						else
							setvar $figstodrop ($ship~SHIP_FIGHTERS_MAX-100000)
						end
						setVar $send $send&"q q fz"&$figstodrop&"*z c d * l "&$planet~planet&"*  m  *** c  "
					end
					if ($fastkill = true)	
						setvar $send $send&"q q a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** c  "
					end
					if ($iglift = 1)
						setVar $send $send&"q q * * "
					end
				end

				send $send

				if ($defender = 1)
					killAllTriggers
					goSub :liftDefenders
				end

				if ($attackOnSight)
					goSub :checkForVictims
				end	
				goSub :getSectorLocation

				if ($player~current_sector <> $dropSector)
					setSectorParameter $dropSector "FIGSEC" FALSE
					if ($dropFtrs = true)
						goSub :retrieveFigs
					end
				end
				if ($iglift = 1)
					if ($player~current_sector <> $dropSector)
						send "'Planet did not arrive, resetting*"
						goSub :resetIGLift

					else
						send "'IGLift Initiated! send reset command to re-enable PDROP (resetpdrop or -)*"
						waitfor "resetpdrop"
						goSub :waitforrestart
						goSub :resetIGLift
					end
				end
				if ($defender = 1)
					if ($player~current_sector <> $dropSector)
						send "'Planet did not arrive, resetting*"
						goSub :resetdefender

					else
						send "'Defender Initiated! send reset command to re-enable PDROP*"
						goSub :waitforrestart
						goSub :setdefender
					end
				end
			elseif ($dropDescription = "Adjacent")	
				if ($density = 1)
					gosub :findAdjacentDensity
				else
					gosub :findAdjacent
				end
				goSub :attemptDrop
				if ($density = 1)
					if ($targetCount = 0)
						goto :startTargeting
					end
					goSub :densityDrop
				end
				if ($defender = 1)
					killAllTriggers
					goSub :liftDefenders
				end
				
				goSub :getSectorLocation
				if ($attackOnSight)
					goSub :checkForVictims
				end
				if ($player~current_sector <> $gotoSector)
					send "'Planet did not arrive, resetting*"
					
				else
					if ($iglift = 1)
						send "'IGLift Initiated! send reset command to re-enable PDROP (resetpdrop or -)*"
						waitfor "resetpdrop"
						goSub :waitforrestart
						goSub :resetIGLift
					end
				end

				if ($defender = 1)
					send "'Defender Initiated! send reset command to re-enable PDROP*"
					goSub :waitforrestart
					goSub :setdefender
				end


				if ($dropFtrs = true)
					goSub :retrieveFigs
					
				end
			elseif ($dropDescription = "Adjacent, then Direct")			
				gosub :findAdjacent
				goSub :attemptDrop
				send "p " $dropSector "* y "
				goSub :getSectorLocation
				if ($attackOnSight)
					goSub :checkForVictims
				end
			elseif ($dropDescription = "Surround")
				setVar $gotoSector 0
				gosub :attemptSurroundDrop
				if ($gotoSector > 0) and ($defender = 1)
					killAllTriggers
					goSub :liftDefenders
				end
				gosub :getSectorLocation
				if ($attackOnSight)
					goSub :checkForVictims
				end
				if ($iglift = 1) and ($gotoSector > 0)
					send "'IGLift Initiated! send reset command to re-enable PDROP (resetpdrop or -)*"
					waitfor "resetpdrop"
					goSub :waitforrestart
					goSub :resetIGLift
				end

				if ($defender = 1) and ($gotoSector > 0)
					send "'Defender Initiated! send reset command to re-enable PDROP*"
					goSub :waitforrestart
					goSub :setdefender
				end
				if ($dropFtrs = true)
					goSub :retrieveFigs
				end
			elseif ($dropDescription = "Deadend Drop")
				gosub :findDeadend
				goSub :attemptDrop
				if ($density = 1)
					goSub :densityDrop
				end
				if ($defender = 1)
					killAllTriggers
					goSub :liftDefenders
				end
				gosub :getSectorLocation
				if ($attackOnSight)
					goSub :checkForVictims
				end
				if ($iglift = 1) 
					send "'IGLift Initiated! send reset command to re-enable PDROP (resetpdrop or -)*"
					waitfor "resetpdrop"
					goSub :waitforrestart
					goSub :resetIGLift
				end
				if ($defender = 1)
					send "'Defender Initiated! send reset command to re-enable PDROP*"
					goSub :waitforrestart
					goSub :setdefender
				end
				if ($dropFtrs = true)
					goSub :retrieveFigs
				end
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
		if ($dropDelay > 0) and ($lock = false)
			killAllTriggers
			setDelayTrigger delay :planetDrop $dropDelay
			pause
		end
		:planetDrop
			setVar $gotoSector $targetSectors[$randomTarget]
			if ($lock = true)
				send "p "&$gotoSector&"*"
				setVar $dropSector $gotoSector
				goto :doLock
			else

				gosub :dopwarp
			end
	end
	
return

:dopwarp
	:planetDrop2
		killAllTriggers
		setvar $send "p "&$gotoSector&"*y"
		if ($dropftrs = true)
			setvar $send $send & $moveFigMacro
		end
		if ($iglift = 1)
			setVar $send $send&"q q * *"
		elseif ($fastkill = true)
			setvar $send $send&"q q a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** c  "
		end
		send $send
		setTextLineTrigger pwarpNo :pwarpNo "You do not have any fighters in Sector "
		setTextLineTrigger pwarpYes :pwarpYes " Planetary TransWarp Drive Engaged! "
		setTextLineTrigger pwarpAlreadyThere :pwarpFinished "You are already in that sector!"
		pause
	:pwarpNo
		killAllTriggers
		setVar $targetSectors[$randomTarget] 0
		setSectorParameter $gotoSector "FIGSEC" FALSE
		if ($iglift = 1)
			send "l" $planet~planet "* c "
			waitfor "<Enter Citadel>"
			gosub :player~quikstats
		elseif ($dropFtrs = true)
			# we can only try once and will retrieve figs once done
		else
			setVar $i 1
			while ($i <= $targetCount)
				if ($targetSectors[$i] > 0)
					setVar $randomTarget $i
					setVar $gotoSector $targetSectors[$randomTarget]
					goto :planetDrop2
				end
				add $i 1
			end
		end
		goto :pwarpFinished
	:pwarpYes
		killAllTriggers
	:pwarpFinished		
		goSub :getSectorLocation

return
:doLock
	killalltriggers
	setTextLineTrigger doLockNo :doLockNo "You do not have any fighters in Sector "
	setTextLineTrigger doLockYes :doLockYes "Locating beam pinpointed, TransWarp Locked"
	setTextLineTrigger doLockYesAlreadyThere :doLockYesAlreadyThere "You are already in that sector!"
	pause
	:doLockNo
		killalltriggers
		goto :startTargeting
	:doLockYesAlreadyThere
		goto :startTargeting
		killalltriggers
	:doLockYes
		setvar $switchboard~message "We have a PLock on " & $dropSector & ", setting kill triggers!*"
		gosub :switchboard~switchboard
		killalltriggers
		goto :setplocktriggers
		killalltriggers
		goto :startTargeting
		halt	
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
	gosub :player~quikstats
	send "q"
	gosub :planet~getPlanetInfo
	setVar $planet~planetFighters $planet~PLANET_FIGHTERS
	
	if ($dropftrs)

		if ($planet~planet_FIGHTERS < $dropFigQuant)
			setVar $SWITCHBOARD~message "There are only " & $planet~planet_FIGHTERS & " fighters on the planet.*"
			gosub :SWITCHBOARD~switchboard
			halt
		end

		setVar $SWITCHBOARD~message "Dropping " & $dropFigQuant & " on landing; Cannons not changed.*"
		gosub :SWITCHBOARD~switchboard

		setVar $moveFigMacro ""
		setVar $moved 0

		while ($moved < $dropFigQuant)
			
			setVar $toMove ($dropFigQuant - $moved)

			if ($toMove >= $maxFigAttack)
				setVar $thisMove $maxFigAttack
				setVar $moved ($moved + $thisMove)
			else
				setVar $thisMove $toMove
				setVar $moved $moved + $thisMove
			end

			setVar $moveFigMacro $moveFigMacro & "q m n t* q fz " & $moved & "* * zc" & $dropftrsType & " * l" & $planet~planet & " *m* t * ccq"
		end

	end
	send "c "
return

:retrieveFigs
	gosub :player~quikstats
	send " s*  "
	setVar $figOwner SECTOR.FIGS.OWNER[$player~current_sector]
	setVar $figQuant SECTOR.FIGS.QUANTITY[$player~current_sector]
	
	waitfor "<Scan Sector>"
	waitfor "Citadel treasury contains"
	

	if ($figQuant <> 0) AND (($figOwner = "belong to your Corp") or ($figOwner = "yours"))
		
		setVar $retFigMacro ""
		setVar $moved 0
		setVar $sectorQuant $figQuant
		if ($dropFigQuant > $figQuant)
			setVar $retQuant $figQuant
		else
			setVar $retQuant $dropFigQuant
		end
		while ($moved < $retQuant)
			
			setVar $toMove ($retQuant - $moved)

			if ($toMove >= $ship~SHIP_FIGHTERS_MAX)
				setVar $thisMove $ship~SHIP_FIGHTERS_MAX
				setVar $moved ($moved + $thisMove)
				setVar $sectorQuant ($sectorQuant - $thisMove)
			else
				setVar $thisMove $toMove
				setVar $moved $moved + $thisMove
				setVar $sectorQuant ($sectorQuant - $thisMove)
				
			end
			
			if ($sectorQuant = 0)
				
				setVar $retFigMacro $retFigMacro & "q m n l* q fz 1* * zc" & $dropftrsType & " * l" & $planet~planet & " *m* t * ccq"

			else
				setVar $retFigMacro $retFigMacro & "q m n l* q fz " & $sectorQuant & "* * zc" & $dropftrsType & " * l" & $planet~planet & " *m* t * ccq"
			end

		end

	end

	send $retFigMacro
	
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



:checkForVictims
	gosub :player~quikstats
	send " s*  "
	:scanit_again
	setvar $player~startingLocation $player~current_prompt
	gosub :sector~getSectorData
	if ($sector~realTraderCount > ($sector~corpieCount + $sector~defenderShips))
		if ($capture)
			gosub :combat~fastCapture
		else
			goSub :combat~fastCitadelAttack
		end
		goto :scanit_again
	elseif (($sector~emptyShipCount > $sector~myShipCount))
		gosub :combat~fastCapture
		goto :scanit_again
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

:getSectorLocation
	send "/"
	waitfor "Sect "
	getWord CURRENTLINE $temp 2
	stripText $temp "Turns"
	stripText $temp " "
	replacetext $temp #179 ""
	setVar $player~current_sector $temp
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
			if (($perfect =TRUE) and (SECTOR.WARPCOUNT[$dropSector] <> 2))
				echo "*Not a perfect firing solution"
				return
			end
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

:findAdjacentDensity
	# We actually want warps IN for density scan.

        getSectorParameter $dropSector "FIGSEC" $isFigged
        
	if (($perfect =TRUE) and (SECTOR.WARPCOUNT[$dropSector] <> 2))
		echo "*Not a perfect firing solution"
		return
	end
	setVar $i 1
	setVar $checkSector SECTOR.WARPSIN[$dropSector][$i]
	setArray $targetSectors 6
	setVar $targetCount 0
	while ($checkSector > 0)
		getSectorParameter $checkSector "FIGSEC" $isFigged
		if ($isFigged = TRUE)
			add $targetCount 1
			setVar $targetSectors[$targetCount] $checkSector
		end
		add $i 1
		setVar $checkSector SECTOR.WARPSIN[$dropSector][$i]
	end
	if ($targetCount <= 0)
		echo "No Targets..*"
		setVar $targetSectors[1] $CURRENT_LOCATION
	end
        

return


:findDeadend
    getSectorParameter $dropSector "FIGSEC" $isFigged
    if (($triggerDescription = "Unfigged Mines") AND ($isFigged = TRUE))
            return
    else
   
		getNearestWarps $nearest $dropSector
		setVar $i 1
        setVar $targetCount 1
		while ($i <= $nearest)
			setVar $focus $nearest[$i]
			getSectorParameter $focus "FIGSEC" $isFigged
			if ($twohops = true)
				getDistance $distance $dropSector $focus
				if ($distance <= 0)
					send "^f"&$dropSector&"*"&$focus&"*q"
					waitOn "ENDINTERROG"
					getDistance $distance $dropSector $focus
				end
			end			

 			if (($isFigged = TRUE) AND (SECTOR.WARPCOUNT[$focus] = 1)) AND ((($twohops = true) and ($distance >= 2)) OR ($twohops <> true))
				#found dead end with fighter!
                setVar $targetSectors[$targetCount] $focus
				return
			end
			add $i 1
		end
        echo "No Targets..*"
        setVar $targetSectors[1] $CURRENT_LOCATION
    end
return


# ============================== DENSITY PHOTON =========================
:densityDrop_toslow

	waitfor "Citadel command"
	
	setVar $BOT~command "foton"
	setVar $BOT~user_command_line " on d "
	setVar $BOT~parm1 "on"
	setVar $BOT~parm2 "d"
	saveVar $BOT~parm1
	saveVar $BOT~parm2
	saveVar $BOT~command
	saveVar $BOT~user_command_line
	load "scripts\"&$bot~mombot_directory&"\modes\offense\foton.cts"
	setEventTrigger        densityended        :densityended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\modes\offense\foton.cts"
	pause
	:densityended
		killalltriggers
return

:densityDrop
	waitfor "Citadel command"
	send "q m * * * q  * * "
	send "fz 3500* * zco * "
	setVar $checks 0

	:check_dens
		
		

		setVar $mm 0
		setVar $i 1
		send "sz*"
		waiton "Relative Density Scan"

	:dtorp_Start
		killTrigger alldone
		setvar $attack_sector_found false
		setTextLineTrigger getSec :getSec "Sector"
		setTextTrigger allDone :allDone "Command [TL="
		pause

	:getSec
		getText CURRENTLINE $temp "Sector" "==>"
		stripText $temp "("
		stripText $temp ")"
		stripText $temp " "
		setvar $adj[$i] $temp

		getText CURRENTLINE $Dens[$i] "==>" "Warps :"
		stripText $dens[$i] ","
		stripText $dens[$i] " "
		add $i 1
		setTextLineTrigger getSec :getSec "Sector"
		pause
	:allDone
		killTrigger getSec
		if ($checks > 40)
			goto :manual_stop
		end
		gosub :firechk

	:letslook
		setVar $w 0

	:sublooky
		add $w 1
		if ($w > $i)
			goto :alldone
		elseif ($density[$w] <> $dens[$w])
			setVar $diff ($density[$w] - $dens[$w])
			if ($diff <> 0)
				if ($densityx = TRUE)
					if ($diff > 1) and ($diff < 40)
						gosub :do_action
						goto :dtorp_end
					else
						goto :sublooky
					end
				else
					gosub :do_action
					goto :dtorp_end
				end
			else
				goto :sublooky
			end
		else
			goto :sublooky
		end

	:firechk
		setVar $y 1
		send "sz*"
		waiton "Relative Density Scan"
		add $checks 1
	:looky
		
		killtrigger dtop_dtorp
		killtrigger getsec
		killtrigger alldone
		killtrigger donelook
		killtrigger manual_stop
		setTextLineTrigger dtop_dtorp :manual_stop $bot~bot_name & " foton off"
		setTextLineTrigger getSec :looksec "Sector"
		setTextTrigger donelook :donelook "Command [TL="
		
		pause

	:looksec
		getText CURRENTLINE $temp "Sector" "==>"
		stripText $temp "("
		stripText $temp ")"
		stripText $temp " "
		
		setvar $adjsec[$y] $temp
		getText CURRENTLINE $Density[$y] "==>" "Warps :"
		stripText $density[$y] ","
		stripText $density[$y] " "
		add $y 1
		setTextLineTrigger getSec :looksec "Sector"
		pause

	:donelook
		killtrigger getSec
		return

	:dtorp_end
		killalltriggers
		setvar $switchboard~message "Foton Missle Fired into sector => " & $adj[$w] & "*"
		gosub :switchboard~switchboard
		gosub :player~quikstats
		if ($Player~Photons < 1)
			setVar $SWITCHBOARD~message "No Photons on Board - Exiting!!*"
			gosub :SWITCHBOARD~switchboard
			halt
		end


		return
	:do_action
		send " c  p  y  " $adj[$w] "**q   l " $PLANET~PLANET " * n n * j m * * * j c  *  "
		return

	:manual_stop
	:densitywait
		killalltriggers
		send " l " $PLANET~PLANET " * n n * j m * * * j c  *  "
		return

# ============================== DEFENDER ROUTINES ==============================
:waitforrestart
	setTextOutTrigger restart :restart "-"
	setTextTrigger restart2 :restart2 "resetpdrop"
	pause
	:restart
	:restart2
	killtrigger restart
	killtrigger restart2
return

:liftDefenders
	# can't wait for this one, we just hope for the best!

	send "'defender mac r ^M ^M ^M f 0^M *"
	
	
	if ($defender_kill = 1)
		setDelayTrigger killwait :killwait 400
		pause
		:killwait
		send "'defender kill*"
		
	end
	setTextLineTrigger wrongprompt :wrongprompt "Wrong prompt for auto kill"
	setDelayTrigger promtpw :promtpw 500
	pause
	:wrongprompt
		killtrigger wrongprompt
		send "'defender kill*" 
		pause
	:promtpw

return

:checkDefenders

	setVar $defenders 0
	send "'defender callout*"
	
	
	setDelayTrigger defwait :defwait 3000
	:defmore
	setTextLineTrigger deffound :deffound "Team: defender"
	pause
	:deffound
		killtrigger deffound
		add $defenders 1
		goto :defmore
	:defwait
		killalltriggers

	if ($defenders = 0)
		setvar $switchboard~message "We need at least one defender in this mode*"
		gosub :switchboard~switchboard
		halt
	else
		send "'defender ig on*"
		waitfor "Auto IG reset"
		setTextLineTrigger igone :igone "IG on!"
		setTextLineTrigger igtwo :igtwo "IG was already on"
		pause
		:igone
		:igtwo
			killalltriggers
		
		send "s"
		setVar $secFigs 0
		waitfor "Sector  :"
		setTextLineTrigger scanfigs :scanfigs "Fighters:"
		setTextLineTrigger nofigs :nofigs "Warps to Sector(s) :"
		pause
			:scanfigs
			killalltriggers
			getWord CURRENTLINE $secfigs 2
			stripText $secfigs ","
			:nofigs
			add $secFigs 500
			send "'defender mac f" $secFigs "^Mcd*"
			waitfor "Macro Complete"
	
		setvar $switchboard~message "We have defenders.*"
		gosub :switchboard~switchboard
		
	end
		
return
:resetdefender
	setDelayTrigger quickpause :quickpause 500
	pause
	:quickpause
	killtrigger quickpause
	goSub :setdefender

return

:setdefender
	
	goSub :disArmPlanet
	send "'defender mac l" & $planet~planet & "^M^M*"
	setVar $defresp 0

	setDelayTrigger defwaitland :defwaitland 3000
	:deflandmore
	setTextLineTrigger deflanded :deflanded " - Macro Complete"
	pause
	:deflanded
		killtrigger deflanded
		add $defresp 1
		goto :deflandmore
	:defwaitland
		killalltriggers
	if ($defresp < $defenders)
		setvar $switchboard~message "We didn't get all defenders landing, aborting!*"
		gosub :switchboard~switchboard
		halt
	end
	
	goSub :armPlanet
return

:disArmPlanet
	
	setVar $cannonAtmos $planet~ATMOSPHERE_CANNON
	setVar $millevel $planet~MILITARYREACTION
	setvar $switchboard~message "Disarming planet from Atmos Cannon: "& $cannonAtmos &" and MR:" & $millevel & "*"
	gosub :switchboard~switchboard
	
	send "la0*m0*qopc"
	waitfor "hould this be a (C)orporate or (P)ersonal planet"
	
return

:armPlanet
	
	setvar $switchboard~message "Arming planet to Atmos Cannon: "& $cannonAtmos &" and MR:" & $millevel & "*"
	gosub :switchboard~switchboard
	
	send "la" $cannonAtmos "*m" $millevel "*qocc"
	waitfor "<Enter Citadel>"
	
return

# ============================== END DEFENDER ROUTINES ==============================
# ================= LIFT PDROP ========== #
:resetIGLift

	send "l" $planet~planet "*c"
	waitfor "<Enter Citadel>"
	gosub :player~quikstats
return 
:liftAndCheckIG

	send "i"
	setTextLineTrigger igLiftYes :igLiftYes "Interdictor ON : Yes"
	setTextLineTrigger igLiftNo :igLiftNo "Interdictor ON : No"
	setTextLineTrigger igLiftNoIG :igLiftNoIG "Credits        :"
	pause
	:igLiftNoIG
		setvar $switchboard~message "Ship does not have IG. Exiting.*"
		gosub :switchboard~switchboard
		halt
	:igLiftNo
		killalltriggers
		send "q q q * b y l" $planet~planet "* c "
		waitfor "Your Interdictor generator is now ON"
		waitfor "<Enter Citadel>"
	:igLiftYes
		killalltriggers
	
	gosub :player~quikstats
return

# ================ END LIFT PDROP ======= #
:retrieveFigs_old
	gosub :player~quikstats

	#send "'"&$SWITCHBOARD~bot_name&" movefig p*"
	#setEventTrigger		movefigended		:movefigended "SCRIPT STOPPED" #"scripts\"&$bot~mombot_directory&"\Modes\Resource\movefig.cts"
	#pause
	#:movefigended	             

	setVar $BOT~command "movefig"
	setVar $BOT~user_command_line " movefig p "& $dropFigQuant &" "
	setVar $BOT~parm1 "p"
	setVar $BOT~parm2 $dropFigQuant
	setVar $BOT~parm3 ""
	setVar $BOT~parm4 ""
	setVar $BOT~parm5 ""
	setVar $BOT~parm6 ""
	setVar $BOT~parm7 ""
	setVar $BOT~parm8 ""
	saveVar $BOT~parm1
	saveVar $BOT~parm2
	saveVar $BOT~parm3
	saveVar $BOT~parm4
	saveVar $BOT~parm5
	saveVar $BOT~parm6
	saveVar $BOT~parm7
	saveVar $BOT~parm8
	saveVar $BOT~command
	saveVar $BOT~user_command_line
	load "scripts\"&$bot~mombot_directory&"\modes\resource\movefig.cts"
	setEventTrigger        moveended        :moveended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\modes\resource\movefig.cts"
	pause
	:moveended
		killalltriggers



return

##### PLOCK TEMP


:setplocktriggers
	killalltriggers
	setTextLineTrigger	1	:manual			("Planet is now in sector "&$dropSector)
	setTextTrigger 		2	:plockFinished	("Planetary TransWarp Drive shutting down.")
	setTextTrigger 		3	:goFighterPlock 		("Report Sector "&$dropSector&": ")
	setTextTrigger 		4	:goLimpetPlock 		("Limpet mine in "&$dropSector&" ")
	setTextTrigger 		5	:goArmidPlock 		("Your mines in "&$dropSector&" ")
	setTextTrigger 		6	:goPlock 		("Locator beam lost.")
	if ($plockTimer > 0)
		setDelayTrigger 		7	:plockTimerExp 		$plockTimer
	end
	pause

:plockTimerExp
	killalltriggers
	send "n '{" $switchboard~bot_name "} - PLOCK Timed Out, Resetting*"
	return
:goArmidPlock
	cutText currentline&"    " $ck 1 4
	setvar $spoof false
	if ($ck <> "Your")
		setTextTrigger 		5	:goArmidPlock 		("Your mines in "&$dropSector&" ")
		pause
	end
	if ($game~hasAliens = true)
		#[K[32mYour mines in [1;33m8174[0;32m did [1;33m14[0;32m damage to #[1;36m[33mFerrengi[36m Nik
		setvar $alien false
		getText $bot~ansi_last_armid_attack&"[xx][xx][xx]" $alien_check " damage to " "[xx][xx][xx]"
		getWordPos $alien_check $pos #27 & "[1;36m" & #27 & "["
		if ($pos > 0)
			setTextTrigger 		5	:goArmidPlock 		("Your mines in "&$dropSector&" ")
			pause
		end
	end
	goto :goplock

:goLimpetPlock
	cutText currentline&"      " $ck 1 6
	setvar $spoof false
	if ($ck <> "Limpet")
		setTextTrigger 		4	:goLimpetPlock 		("Limpet mine in "&$dropSector&" ")
		pause
	end
	goto :goplock
:goFighterPlock
	getWord currentline $spoof_test 1
	getWord currentansiline $ansi_spoof_test 1
	getWordPos $ansi_spoof_test $ansi_spoof_pos #27 & "[1;33m"
	setvar $spoof false
	if ($spoof_test <> "Deployed") OR ($ansi_spoof_pos <= 0)
		setTextTrigger 		3	:goFighterPlock 		("Report Sector "&$dropSector&": ")
		pause
	end
	if ($game~hasAliens = true)
		setvar $alien false
		getText currentansiline $alien_check ": " "'s"
		getWordPos $alien_check $pos #27 & "[1;36m" & #27 & "["
		if ($pos > 0)
			setTextTrigger 		3	:goFighterPlock 		("Report Sector "&$dropSector&": ")
			pause
		end
	end


:goPlock
:manual
	killalltriggers
	if ($dropDelay > 0)
		setdelaytrigger plockdelay :continuePlock $dropDelay
		pause
	end
	:continuePlock
	send "y '{" $switchboard~bot_name "} - PLOCK Launched*"
	if ($dropftrs = true)
		setvar $send $send & $moveFigMacro
	end
	if ($fastkill = true)
		setvar $send "q q a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** c  "
		send $send
	end

	if ($defender = 1)
		killAllTriggers
		goSub :liftDefenders
	end
	gosub :getSectorLocation
	if ($attackOnSight)
		goSub :checkForVictims
	end
	if ($iglift = 1) 
		send "'IGLift Initiated! send reset command to re-enable PDROP (resetpdrop or -)*"
		waitfor "resetpdrop"
		goSub :waitforrestart
	end
	if ($defender = 1)
		send "'Defender Initiated! send reset command to re-enable PDROP*"
		goSub :waitforrestart
		goSub :setdefender
	end
	if ($dropFtrs = true)
		goSub :retrieveFigs
	end
	send "  s*   "
	return
:plockFinished
	send "  s*   "
	setvar $switchboard~message "PLOCK Sector Cleared*"
	gosub :switchboard~switchboard
	return


#####
#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\ship\getshipstats\ship"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\combat\init\combat"
include "source\bot_includes\sector\getsectordata\sector"
include "source\bot_includes\combat\fastcitadelattack\combat"
include "source\bot_includes\combat\fastcapture\combat"
include "source\bot_includes\ship\loadshipinfo\ship"
include "source\bot_includes\ship\getshipcapstats\ship"
include "source\bot_includes\ship\getshipstats\ship"
