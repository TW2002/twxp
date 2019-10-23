systemscript
reqRecording
# TWX Script			: Mind Over Matter Bot
# Authors				: Mind Dagger / The Bounty Hunter / Lonestar
# Contributions/QA      : Misbehavin / DaCreeper
# Description			: Allows Corpies to use you while AFK and a Self Helper
# Credits				: Oz, Zentock, SupG, Dynarri, Cherokee, Alexio, Xide, Phx, Rincrast, Voltron, Traitor, Parrothead
goto :load_bot
:checkStartingPrompt
	setVar $startingLocation $CURRENT_PROMPT
	getWordPos " "&$validPrompts&" " $pos $startingLocation
	if ($pos <= 0)
		setVar $message "Invalid starting prompt: ["&$CURRENT_PROMPT&"]. Valid prompt(s) for this command: ["&$validPrompts&"]*"
		gosub :switchboard
		goto :wait_for_command
	end
return
#=================================QUIKSTATS================================================
:quikstats
	setVar $CURRENT_PROMPT 		"Undefined"
	killtrigger noprompt
	killtrigger prompt
	killtrigger statlinetrig
	killtrigger getLine2
	setTextLineTrigger 	prompt		:allPrompts	 	#145 & #8
	setTextLineTrigger 	statlinetrig 	:statStart 		#179
	send #145&"/"
	pause
	:allPrompts
		getWord CURRENTLINE $CURRENT_PROMPT 1
		stripText $CURRENT_PROMPT #145
		stripText $CURRENT_PROMPT #8
		setTextLineTrigger 	prompt		:allPrompts	 	#145 & #8
		pause
	:statStart
		killtrigger prompt
		setVar $stats ""
		setVar $wordy ""
	:statsline
		killtrigger statlinetrig
		killtrigger getLine2
		setVar $line2 CURRENTLINE
		replacetext $line2 #179 " "
		striptext $line2 ","
		setVar $stats $stats & $line2
		getWordPos $line2 $pos "Ship"
		if ($pos > 0)
			goto :gotStats
		else
			setTextLineTrigger getLine2 :statsline
			pause
		end
	:gotStats
		setVar $stats $stats & " @@@"
		setVar $current_word 0
		while ($wordy <> "@@@")
			if ($wordy = "Sect")
				getWord $stats $CURRENT_SECTOR   	($current_word + 1)
			elseif ($wordy = "Turns")
				getWord $stats $TURNS  			($current_word + 1)
			elseif ($wordy = "Creds")
				getWord $stats $CREDITS  		($current_word + 1)
			elseif ($wordy = "Figs")
				getWord $stats $FIGHTERS   		($current_word + 1)
			elseif ($wordy = "Shlds")
				getWord $stats $SHIELDS  		($current_word + 1)
			elseif ($wordy = "Hlds")
				getWord $stats $TOTAL_HOLDS   		($current_word + 1)
			elseif ($wordy = "Ore")
				getWord $stats $ORE_HOLDS    		($current_word + 1)
			elseif ($wordy = "Org")
				getWord $stats $ORGANIC_HOLDS    	($current_word + 1)
			elseif ($wordy = "Equ")
				getWord $stats $EQUIPMENT_HOLDS    	($current_word + 1)
			elseif ($wordy = "Col")
				getWord $stats $COLONIST_HOLDS    	($current_word + 1)
			elseif ($wordy = "Phot")
				getWord $stats $PHOTONS   		($current_word + 1)
			elseif ($wordy = "Armd")
				getWord $stats $ARMIDS   		($current_word + 1)
			elseif ($wordy = "Lmpt")
				getWord $stats $LIMPETS   		($current_word + 1)
			elseif ($wordy = "GTorp")
				getWord $stats $GENESIS  		($current_word + 1)
			elseif ($wordy = "TWarp")
				getWord $stats $TWARP_TYPE  		($current_word + 1)
			elseif ($wordy = "Clks")
				getWord $stats $CLOAKS   		($current_word + 1)
			elseif ($wordy = "Beacns")
				getWord $stats $BEACONS 		($current_word + 1)
			elseif ($wordy = "AtmDt")
				getWord $stats $ATOMIC  		($current_word + 1)
			elseif ($wordy = "Corbo")
				getWord $stats $CORBO   		($current_word + 1)
			elseif ($wordy = "EPrb")
				getWord $stats $EPROBES   		($current_word + 1)
			elseif ($wordy = "MDis")
				getWord $stats $MINE_DISRUPTORS   	($current_word + 1)
			elseif ($wordy = "PsPrb")
				getWord $stats $PSYCHIC_PROBE  		($current_word + 1)
			elseif ($wordy = "PlScn")
				getWord $stats $PLANET_SCANNER  	($current_word + 1)
			elseif ($wordy = "LRS")
				getWord $stats $SCAN_TYPE    		($current_word + 1)
			elseif ($wordy = "Aln")
				getWord $stats $ALIGNMENT    		($current_word + 1)
			elseif ($wordy = "Exp")
				getWord $stats $EXPERIENCE    		($current_word + 1)
			elseif ($wordy = "Corp")
				getWord $stats $CORP   			($current_word + 1)
			elseif ($wordy = "Ship")
				getWord $stats $SHIP_NUMBER   		($current_word + 1)
			end
			add $current_word 1
			getWord $stats $wordy $current_word
		end
	:doneQuikstats
	killtrigger statlinetrig
	killtrigger getLine2
return
# ============================== END QUICKSTATS SUB==============================
#============================== KILLING ALL THE TRIGGERS/SETTING DELAY TRIGGER ==============
:killthetriggers
	killalltriggers
	setDelayTrigger unfreezingTrigger :unfreezebot 100000
	return
:relog_freeze_trigger
      killtrigger unfreezingTrigger
      killtrigger unfreezingTriggerBigDelay
      setDelayTrigger unfreezingTrigger :verifyDelay 30000
return
:bigdelay_killthetriggers
      killalltriggers
      setDelayTrigger unfreezingTriggerBigDelay :unfreezebot 1800000
return
:unfreezebot
	echo "*Bot timed out, unfreezing..*"
	send "'{" $bot_name "} - Bot frozen for over 100 seconds, resetting...*"
	goto :wait_for_command
#==================================== END KILL TRIGGERS ======================================

:getPlanetInfo
	send "*"
	setTextLineTrigger planetInfo :planetInfo "Planet #"
	pause
	:planetinfo
		setVar $CITADEL 0
		setVar $SECTOR_CANNON 0
		setVar $ATMOSPHERE_CANNON 0
		setVar $CITADEL_CREDITS 0
		getWord CURRENTLINE $PLANET 2
		stripText $PLANET "#"
		getWord CURRENTLINE $current_sector 5
		stripText $current_sector ":"
		waitOn "2 Build 1   Product    Amount     Amount     Maximum"
        :getPlanetStuff
		setTextLineTrigger fuelstart :fuelstart "Fuel Ore"
		setTextLineTrigger orgstart :orgstart "Organics"
		setTextLineTrigger equipstart :equipstart "Equipment"
		setTextLineTrigger figstart :figstart "Fighters        N/A"
		setTextLineTrigger citadelstart :citadelstart "Planet has a level"
		setTextLineTrigger cannon :cannonstart ", AtmosLvl="
		setTextTrigger planetInfoDone :planetInfoDone "Planet command (?=help)"
		pause
        :fuelstart
		getWord CURRENTLINE $PLANET_FUEL 6
		getWord CURRENTLINE $PLANET_FUEL_MAX 8
		stripText $PLANET_FUEL ","
		stripText $PLANET_FUEL_MAX ","
		pause
        :orgstart
		getWord CURRENTLINE $PLANET_ORGANICS 5
		getWord CURRENTLINE $PLANET_ORGANICS_MAX 7
		stripText $PLANET_ORGANICS ","
		stripText $PLANET_ORGANICS_MAX ","
		pause
        :equipstart
		getWord CURRENTLINE $PLANET_EQUIPMENT 5
		getWord CURRENTLINE $PLANET_EQUIPMENT_MAX 7
		stripText $PLANET_EQUIPMENT ","
		stripText $PLANET_EQUIPMENT_MAX ","
		pause
        :figstart
		getWord CURRENTLINE $PLANET_FIGHTERS 5
		getWord CURRENTLINE $PLANET_FIGHTERS_MAX 7
		stripText $PLANET_FIGHTERS ","
		stripText $PLANET_FIGHTERS_MAX ","
		pause
        :citadelstart
		getWord CURRENTLINE $CITADEL 5
		getWord CURRENTLINE $CITADEL_CREDITS 9
		striptext $CITADEL_CREDITS ","
		pause
	:cannonstart
		getWord CURRENTLINE $ATMOSPHERE_CANNON 5
		getWord CURRENTLINE $SECTOR_CANNON 6
		stripText $SECTOR_CANNON "SectLvl="
		striptext $SECTOR_CANNON "%"
		stripText $ATMOSPHERE_CANNON "AtmosLvl="
		striptext $ATMOSPHERE_CANNON "%"
		striptext $ATMOSPHERE_CANNON ","
		pause
	:planetInfoDone
		killtrigger citadelstart
		killtrigger cannon
return
# ==============================  END PLANET INFO SUBROUTINE  =================
:removeFigFromData
	getSectorParameter $target "FIGSEC" $check
	if ($check = TRUE)
		getSectorParameter 2 "FIG_COUNT" $figCount
		setSectorParameter 2 "FIG_COUNT" ($figCount-1)
	end
	setSectorParameter $target "FIGSEC" FALSE
return
:addFigToData
	#commented out 
	#	because seems this routine rarely works properly. Rarely does the param actually get set
	#	when this routine is called from the :moveIntoSector or :addFig routines
	#
	#	getSectorParameter $target "FIGSEC" $check
	#	if (($check = FALSE) OR ($check = ""))
	#		getSectorParameter 2 "FIG_COUNT" $figCount
	#		setSectorParameter 2 "FIG_COUNT" ($figCount+1)
	#	end
	setSectorParameter $target "FIGSEC" TRUE
return
# ============================  START PLAYER INFO SUBROUTINE  =================
:getInfo
	setvar $NOFLIP	FALSE
	setVar $PHOTONS 0
	setVar $SCAN_TYPE "None"
	setVar $TWARP_TYPE 0
	setVar $corpstring "[0]"
	setVar $igstat 0
 	setTextLineTrigger	getInfo_CN9_Check_1	:getInfo_CN9_Check "<N> Interdictor Control"
	setTextLineTrigger	getInfo_CN9_Check_2	:getInfo_CN9_Check "<N> Move to NavPoint"
	:waitOnInfo
   	send "?I"
	waitOn "<Info>"
	setTextLineTrigger getTraderName	:getTraderName "Trader Name    :"
       	setTextLineTrigger getExpAndAlign 	:getExpAndAlign "Rank and Exp"
       	setTextLineTrigger getCorp 		:getCorp "Corp           #"
       	setTextLineTrigger getShipType 		:getShipType "Ship Info      :"
       	setTextLineTrigger getTPW 		:getTPW "Turns to Warp  :"
       	setTextLineTrigger getSect 		:getSect "Current Sector :"
       	setTextLineTrigger getTurns 		:getTurns "Turns left"
       	setTextLineTrigger getHolds 		:getHolds "Total Holds"
       	setTextLineTrigger getFighters 		:getFighters "Fighters       :"
       	setTextLineTrigger getShields 		:getShields "Shield points  :"
       	setTextLineTrigger getPhotons 		:getPhotons "Photon Missiles:"
       	setTextLineTrigger getScanType 		:getScanType "LongRange Scan :"
       	setTextLineTrigger getTwarpType1 	:getTwarpType1 "  (Type 1 Jump):"
       	setTextLineTrigger getTwarpType2 	:getTwarpType2 "  (Type 2 Jump):"
       	setTextLineTrigger getCredits 		:getCredits "Credits"
       	setTextLineTrigger checkig 		:checkig "Interdictor ON :"
	setTextTrigger getInfoDone 		:getInfoDone "Command [TL="
       	setTextTrigger getInfoDone2 		:getInfoDone "Citadel command"
       	pause
	:getInfo_CN9_Check
		setvar $NOFLIP	TRUE
		pause
	:getTraderName
		killTrigger getInfo_CN9_Check_1
		killTrigger getInfo_CN9_Check_2
        setVar $TRADER_NAME CURRENTLINE
        stripText $TRADER_NAME "Trader Name    : "
		setVar $i 1
       	while ($i <= $ranksLength)
        	setVar $temp $ranks[$i]
        	stripText $temp "31m"
        	stripText $temp "36m"
        	stripText $TRADER_NAME $temp&" "
        	add $i 1
        end
		pause
	:getExpAndAlign
        	getWord CURRENTLINE $EXPERIENCE 5
        	getWord CURRENTLINE $ALIGNMENT 7
        	stripText $EXPERIENCE ","
        	stripText $ALIGNMENT ","
        	stripText $ALIGNMENT "Alignment="
        	pause
	:getCorp
        	getWord CURRENTLINE $CORP 3
	        stripText $CORP ","
	        setVar $corpstring "[" & $CORP & "]"
	        pause
	:getShipType
	        getWordPos CURRENTLINE $shiptypeend "Ported="
	        subtract $shiptypeend 18
	        cutText CURRENTLINE $SHIP_TYPE 18 $shiptypeend
	        pause
	:getTPW
	        getWord CURRENTLINE $TURNS_PER_WARP 5
	        pause
	:getSect
	        getWord CURRENTLINE $CURRENT_SECTOR 4
	        pause
	:getTurns
	        getWord CURRENTLINE $TURNS 4
	        if ($TURNS = "Unlimited")
	            setVar $TURNS 65000
			    setVar $unlimitedGame TRUE
	        end
			saveVar $unlimitedGame
	        pause
	:getHolds
		setVar $Temp (CURRENTLINE & " ")
		getText $Temp $ORE_HOLDS "Ore=" " "
		if ($ORE_HOLDS = "")
			setVar $ORE_HOLDS 0
		end
		getText $Temp $ORGANIC_HOLDS "Organics=" " "
		if ($ORGANIC_HOLDS = "")
			setVar $ORGANIC_HOLDS 0
		end
		getTExt $Temp $EQUIPMENT_HOLDS "Equipment=" " "
		if ($EQUIPMENT_HOLDS = "")
			setVar $EQUIPMENT_HOLDS 0
		end
		getTExt $Temp $COLONIST_HOLDS "Colonists=" " "
		if ($COLONIST_HOLDS = "")
			setVar $COLONIST_HOLDS 0
		end
		getText $Temp $EMPTY_HOLDS "Empty=" " "
		if ($EMPTY_HOLDS = "")
			setVar $EMPTY_HOLDS 0
		end
        pause
	:getFighters
	        getWord CURRENTLINE $FIGHTERS 3
	        stripText $FIGHTERS ","
	        pause
	:getShields
	        getWord CURRENTLINE $SHIELDS 4
	        stripText $SHIELDS ","
	        pause
	:getPhotons
	        getWord CURRENTLINE $PHOTONS 3
	        pause
	:getScanType
	        getWord CURRENTLINE $SCAN_TYPE 4
	        pause
	:getTwarpType1
	        getWord CURRENTLINE $TWARP_1_RANGE 4
	        setVar $twarp_type 1
	        pause
	:getTwarpType2
	        getWord CURRENTLINE $TWARP_2_RANGE 4
	        setVar $twarp_type 2
	        pause
	:getCredits
	        getWord CURRENTLINE $CREDITS 3
	        stripText $CREDITS ","
	        if ($igstat = 0)
                setVar $igstat "NO IG"
	        end
	        pause
	:checkig
		getWord CURRENTLINE $igstat 4
		pause
	:getInfoDone
	killAllTriggers
return
# ==============================  END PLAYER INFO SUBROUTINE  =================
:GetCost
	setVar $LSD_Cost 0
	getWordPos CURRENTLINE $LSD_pos "="
	if ($LSD_pos <> 0)
		cutText CURRENTLINE $LSD_Cost ($LSD_pos + 1) 999
		striptext $LSD_Cost " cr"
	end
return
#==================================== START CURRENT PROMPT =====================================
:current_prompt
	setTextTrigger 		prompt			:allPromptsCatch	 	#145 & #8
	setDelayTrigger 	prompt_delay	:current_prompt_delay	5000
	send #145
	pause
	:current_prompt_delay
		setTextOutTrigger	atkeys			:current_prompt_at_keys
		setDelayTrigger 	prompt_delay	:verifyDelay		30000
		pause
	:current_prompt_at_keys
		getOutText $out
		send $out
		goto :wait_for_command
	:allPromptsCatch
		killtrigger prompt_delay
		getWord CURRENTLINE $CURRENT_PROMPT 1
		if ($CURRENT_PROMPT = 0)
			getWord CURRENTANSILINE $CURRENT_PROMPT 1
		end
		stripText $CURRENT_PROMPT #145
		stripText $CURRENT_PROMPT #8
return
# ==============================  START PLANET INFO SUBROUTINE  =================
#===================================== SURROUND SUB =============================================================
:surround
	gosub :killthetriggers
	gosub :quikstats
	if ($PHOTONS > 0)
                if ($shipPhotonCheck = $SHIP_NUMBER)

                else
                     setVar $shipPhotonCheck $SHIP_NUMBER
                     echo "*"&ANSI_14&"You are carrying photons. *If you wish to surround anyway, press TAB-S again.*"&ANSI_7
                     goto :wait_for_command
                end
        end
	setVar $startingLocation $CURRENT_PROMPT
	if ($startingLocation = "Command")
	elseif ($startingLocation = "Citadel")
		send "q "
		gosub :getPlanetInfo
		send "q "
	elseif ($startingLocation = "Planet")
		gosub :getPlanetInfo
		send "q "
	else
		echo "*Wrong prompt for surround command.*"
		goto :wait_for_command
	end
	:StartSurround
		send "szh* "
		setTextTrigger surroundsector :continuesurroundsector "[" & $CURRENT_SECTOR & "]"
		pause
		:continuesurroundsector
		gosub :getShipStats
		if ($SHIP_MAX_ATTACK > $FIGHTERS)
			setVar $SHIP_MAX_ATTACK ($FIGHTERS/2)
		end

		setVar $i 1
		setVar $surroundString "c v 0* y* "&$CURRENT_SECTOR&"* q "
		setVar $surroundOutput ""
		setVar $yourOwnCount 0
		while (SECTOR.WARPS[$CURRENT_SECTOR][$i] > 0)
			setVar $adj_sec SECTOR.WARPS[$CURRENT_SECTOR][$i]
			getDistance $distance $adj_sec $current_sector
			if ($distance <= 0)
				send "^f"&$adj_sec&"*"&$current_sector&"*q"
				waitOn "ENDINTERROG"
				getDistance $distance $adj_sec $current_sector
			end
			setVar $containsShieldedPlanet FALSE
			setVar $p 1
			while ($p <= SECTOR.PLANETCOUNT[$adj_sec])
				getWord SECTOR.PLANETS[$adj_sec][$p] $test 1
				if ($test = "<<<<")
					setVar $containsShieldedPlanet TRUE
				end
				add $p 1
			end
			setVar $tempOffOdd $SHIP_OFFENSIVE_ODDS
			multiply $tempOffOdd $SHIP_MAX_ATTACK
			divide $tempoffodd 12
			setVar $figOwner SECTOR.FIGS.OWNER[$ADJ_SEC]
			setVar $mineOwner SECTOR.MINES.OWNER[$ADJ_SEC]
			setVar $limpOwner SECTOR.LIMPETS.OWNER[$ADJ_SEC]
			if (($surroundOverwrite = FALSE) AND (($figOwner = "belong to your Corp") OR ($figOwner = "yours")))
				add $yourOwnCount 1
				if ($yourOwnCount = $totalWarps)
					setVar $surroundOutput $surroundOutput&"(Surround) All sectors around are friendly fighters.*"
				end
			elseif (SECTOR.FIGS.QUANTITY[$ADJ_SEC] >= $tempoffodd)
				setVar $surroundOutput $surroundOutput&"(Surround) Too many fighters in sector "&$adj_sec&".*"
			elseif (($adj_sec <= 10) OR ($adj_Sec = $STARDOCK))
				setVar $surroundOutput $surroundOutput&"(Surround) Avoided Fed Space, sector "&$adj_sec&".*"
			elseif ((SECTOR.PLANETCOUNT[$ADJ_SEC] > 0) AND ($surroundAvoidAllPlanets))
				setVar $surroundOutput $surroundOutput&"(Surround) Avoided planet in sector "&$adj_sec&".*"
			elseif (($containsShieldedPlanet) AND ($surroundAvoidShieldedOnly))
				setVar $surroundOutput $surroundOutput&"(Surround) Avoided shielded planet in sector "&$adj_sec&".*"
			elseif ($distance > 1)
				setVar $surroundOutput $surroundOutput&"(Surround) Avoided one way in sector "&$adj_sec&".*"
			elseif (($surroundPassive = TRUE) AND (((SECTOR.ANOMALY[$ADJ_SEC] = TRUE) AND (($limpOwner <> "belong to your Corp") AND ($limpOwner <> "yours"))) OR (SECTOR.FIGS.QUANTITY[$ADJ_SEC] > 0) OR ((SECTOR.MINES.QUANTITY[$ADJ_SEC] > 0) AND (($mineOwner <> "belong to your Corp") AND ($mineOwner <> "yours")))))
				setVar $surroundOutput $surroundOutput&"(Surround) Avoided non-passive situation in sector "&$adj_sec&".*"
			else
				if ($dropOffensive)
					setVar $deployFig "o"
				elseif ($dropToll)
					setVar $deployFig "t"
				else
					setVar $deployFig "d"
				end
				setVar $surroundString $surroundString&" m z "&$adj_sec&"* z a "&$SHIP_MAX_ATTACK&"* * "
				if (($surroundFigs > 0) AND ($FIGHTERS > $surroundFigs))
					setVar $surroundString $surroundString&"f z" & $surroundFigs & "*zc"&$deployFig&"*  "
					subtract $FIGHTERS $surroundFigs
					setVar $target $ADJ_SEC
					gosub :addFigToData
				end
				if (($surroundLimp > 0) AND ($LIMPETS > $surroundLimp) AND ($LIMPETS > 0))
					setVar $surroundString $surroundString&"h2 z" & $surroundLimp & "*zc* "
					subtract $LIMPETS $surroundLimp
					setSectorParameter $ADJ_SEC "LIMPSEC" TRUE
				end
				if (($surroundMine > 0) AND ($ARMIDS > $surroundMine) AND ($ARMIDS > 0))
					setVar $surroundString $surroundString&"h1 z" & $surroundMine & "*zc* "
					subtract $ARMIDS $surroundMine
					setSectorParameter $ADJ_SEC "MINESEC" TRUE
				end
				setVar $surroundString $surroundString&"m z"&$current_Sector&"* "
				setVar $surroundString $surroundString&"za "&$SHIP_MAX_ATTACK&"* * "
			end
			add $i 1
		end
		send $surroundString
		if ($surroundAutoCapture)
			gosub :quikstats
			if ($startingLocation = "Citadel")
				setVar $startingLocation "Command"
				goSub :getSectorData
				goSub :fastCapture
				setVar $startingLocation "Citadel"
			else
				goSub :getSectorData
				goSub :fastCapture
			end

		end
		if (($startingLocation = "Citadel") OR ($startingLocation = "Planet"))
			gosub :landingSub
		end
		send "'{" $bot_name "} - Surrounded sector "&$current_sector&".*"
		setTextLineTrigger surroundmessage :continuesurroundmessage  "{"&$bot_name&"} - Surrounded sector "&$current_sector&"."
		pause
	:continuesurroundmessage
		echo "*"&ANSI_14&$surroundOutput&"*"&ANSI_7
goto :wait_for_command
#========================== END SURROUND SUB ==============================================
#================================ START GET SHIP STATS SUB ======================================
:getShipStats
	send "c;q"
	setTextLineTrigger	getshipoffense		:shipoffenseodds	"Offensive Odds: "
	setTextLineTrigger	getshipfighters 	:shipmaxfigsperattack	" TransWarp Drive:   "
	setTextLineTrigger	getshipmines 		:shipmaxmines		" Mine Max:  "
	pause
	setvar $kk 1
	setTextLineTrigger	getshipoffense		:shipoffenseodds	"Offensive Odds: "
	setTextLineTrigger	getshipfighters 	:shipmaxfigsperattack	" TransWarp Drive:   "
	setTextLineTrigger	getshipmines 		:shipmaxmines		" Mine Max:  "
	pause
	:shipoffenseodds
		setvar $zline[$kk] CURRENTLINE
		striptext $zline[$kk] "Main Drive Cost:"
		striptext $zline[$kk] "Max Fighters:"
		striptext $zline[$kk] "Offensive Odds:"
		striptext $zline[$kk] ","
		striptext $zline[$kk] ":1"
		striptext $zline[$kk] "."
		getword $zline[$kk] $SHIP_OFFENSIVE_ODDS 3
		getword $zline[$kk] $SHIP_FIGHTERS_MAX 2
		add $kk 1
		pause
	:shipmaxmines
		setvar $zline[$kk] CURRENTLINE
		striptext $zline[$kk] "Ship Hull Cost:"
		striptext $zline[$kk] "Mine Max:"
		striptext $zline[$kk] "Beacon Max:"
		striptext $zline[$kk] ","
		getword $zline[$kk] $SHIP_MINES_MAX 2
		add $kk 1
		pause
	:shipmaxfigsperattack
		setvar $zline[$kk] CURRENTLINE
		striptext $zline[$kk] "Max Figs Per Attack:"
		striptext $zline[$kk] "TransWarp Drive:"
		striptext $zline[$kk] "Planet Scanner:"
		striptext $zline[$kk] ","
		getword $zline[$kk] $SHIP_MAX_ATTACK 1
		killtrigger getshipoffense
		killtrigger getshipfighters
		killtrigger getshipmines
return
#================================= END GET SHIP STATS SUB ===============================================
#========================== START LANDING SUB ===============================================
:landingSub
        send "l" $PLANET "*z  n  z  n  *  "
	saveVar $PLANET
	setVar $sucessfulCitadel FALSE
	setVar $sucessfulPlanet FALSE
	setTextLineTrigger noplanet :noplanet "There isn't a planet in this sector."
	setTextLineTrigger no_land :no_land "since it couldn't possibly stand"
	setTextLineTrigger planet :planet "Planet #"
	setTextLineTrigger wrongone :wrong_num "That planet is not in this sector."
	pause
:noplanet
	killtrigger no_land
	killtrigger planet
	killtrigger wrongone
	send "'{" $bot_name "} - No Planet in Sector!*"
	return
:no_land
	killtrigger noplanet
	killtrigger planet
	killtrigger wrongone
	send "'{" $bot_name "} - This ship cannot land!*"
	return
:planet
	getWord CURRENTLINE $pnum_ck 2
	stripText $pnum_ck "#"
	if ($pnum_ck <> $PLANET)
		killtrigger no_land
		killtrigger wrongone
		killtrigger no_planet
		send "q"
		goto :wrong_num
	end
	killtrigger noplanet
	killtrigger no_land
	killtrigger wrongone
	setTextTrigger wrong_num :wrong_num "That planet is not in this sector."
	setTextTrigger planet :planet_prompt "Planet command"
	pause
:wrong_num
	killtrigger planet
	send "**'{" $bot_name "} - Incorrect Planet Number*"
	return
:planet_prompt
	killtrigger wrong_num
	setVar $currentBotPlanet $planet
	saveVar $currentBotPlanet 
	send "c"
	setTextTrigger build_cit :build_cit "Do you wish to construct one?"
	setTextTrigger in_cit :in_cit "Citadel command"
	setTextTrigger nocitallowed :build_cit "Citadels are not allowed in FedSpace."
	setTextTrigger citnotbuiltyet :build_cit "Be patient, your Citadel is not yet finished."
	pause
:build_cit
	killtrigger in_cit
	killtrigger nocitallowed
	killtrigger build_cit
	killtrigger citnotbuiltyet
	setVar $sucessfulPlanet TRUE
	send "n*"
	setVar $startingLocation "Planet"
	return
:in_cit
	killtrigger in_cit
	killtrigger nocitallowed
	killtrigger build_cit
	killtrigger citnotbuiltyet
	setVar $sucessfulCitadel TRUE
	setVar $startingLocation "Citadel"
return
#============================== END LANDING SUB =============================================
:getSectorData
        gosub :killthetriggers
	if ($startingLocation = "Citadel")
		send "s* "
	else
		send "** "
	end
	setVar $sectorData ""
	:sectorsline_cit_kill
		setVar $line CURRENTANSILINE
		setVar $line $STARTLINE&$line&$ENDLINE
		setVar $sectorData $sectorData&$line
		getWordPos $line $pos "Warps to Sector(s) "
		if ($pos > 0)
			goto :gotSectorData
		else
			setTextLineTrigger getLine :sectorsline_cit_kill
		end
		pause
	:gotSectorData
		getWordPos $sectorData $beaconPos "[0m[35mBeacon  [1;33m:"
		if ($beaconPos > 0)
		   setVar $containsBeacon TRUE
                else
                    setVar $containsBeacon FALSE
                end
		goSub :getTraders
		goSub :getEmptyShips
		goSub :getFakeTraders
return
:getTraders
	#Reads sector data and searches for real (Player) traders
        getWordPos $sectorData $posTrader "[0m[33mTraders [1m:"
	if ($posTrader > 0)
		getText $sectorData $traderData "[0m[33mTraders [1m:" "[0m[1;32mWarps to Sector(s) "
		setVar $traderData $STARTLINE&$traderData
		getText $traderData $temp $STARTLINE $ENDLINE
		setVar $realTraderCount 0
		setVar $corpieCount 0
		while ($temp <> "")
			getLength $STARTLINE&$temp&$ENDLINE $length
			cutText $traderData $traderData ($length+1) 9999
			stripText $temp $STARTLINE
			stripText $temp $ENDLINE
			stripText $temp "[0m          "
			stripText $temp "[0m[33mTraders [1m:"
			setVar $j 1
			setVar $isFound FALSE
			while (($j < $ranksLength) AND ($isFound = FALSE))
				getWordPos $temp $pos $ranks[$j]
				if ($pos > 0)
					getLength $ranks[$j] $length
					cutText $temp $temp ($pos+$length+1) 9999
					if ($j <= 10)
						setVar $TRADERS[($realTraderCount+1)][2] TRUE
					else
						setVar $TRADERS[($realTraderCount+1)][2] FALSE
					end
					setVar $isFound TRUE
				end
				add $j 1
			end
			getWordPos $temp $pos "[0;32m w/"
			getWordPos $temp $pos2 "[0;35m[[31mOwned by[35m]"
			if (($pos > 0) AND ($pos2 <= 0))
				getWordPos $temp $pos "[[1;36m"
				if ($pos > 0)
					getText $temp $tempCorp "[[1;36m" "[0;34m]"
					stripText $tempCorp ""
				else
					setVar $tempCorp 99999
				end
				replaceText $temp "[0;34m" "[34m"
				getWordPos $temp $pos "[34m"
				cutText $temp $temp 1 $pos
				stripText $temp ""
				lowercase $temp
				setVar $TRADERS[($realTraderCount+1)] $temp
				setVar $TRADERS[($realTraderCount+1)][1] $tempCorp
				#echo "*" $traders[($realTraderCount+1)] "   " $traders[($realTraderCount+1)][1] "   " $traders[($realTraderCount+1)][2] "*"
				add $realTraderCount 1
				if ($tempCorp = $CORP)
					add $corpieCount 1
				end
			end
			getText $traderData $temp $STARTLINE $ENDLINE
		end
	else
		setVar $realTraderCount 0
		setVar $corpieCount 0
	end
return
:getEmptyShips
        getWordPos $sectorData $posShips "[0m[33mShips   [1m:"
	if ($posShips > 0)
		getText $sectorData $shipData "[0m[33mShips   [1m:" "[0m[1;32mWarps to Sector(s) [33m:"
		setVar $shipData $STARTLINE&$shipData
		getText $shipData $temp $STARTLINE $ENDLINE
		setVar $emptyShipCount 0
		while ($temp <> "")
			getLength $STARTLINE&$temp&$ENDLINE $length
			cutText $shipData $shipData ($length+1) 9999
			stripText $temp $STARTLINE
			stripText $temp "  "
			stripText $temp $ENDLINE
			getWordPos $temp $pos2 "[0;35m[[31mOwned by[35m]"
			if ($pos2 > 0)
				cutText $temp $temp $pos2 9999
				stripText $temp "[0;35m[[31mOwned by[35m] "
				getWordPos $temp $pos3 ",[0;32m w/"
				cutText $temp $temp 0 $pos3
				getWordPos $temp $pos4 "[34m[[1;36m"
				striptext $temp "[1;33m,"
				if ($pos4 > 0)
					cuttext $temp $temp $pos4 9999
					striptext $temp "[34m[[1;36m"
					striptext $temp "[0;34m]"
				end
				setVar $EMPTYSHIPS[($emptyShipCount+1)] $temp
				add $emptyShipCount 1
			end
			getText $shipData $temp $STARTLINE $ENDLINE
		end
	else
		setVar $emptyShipCount 0
	end
return
:getFakeTraders
	setVar $federalsInSector FALSE
	#Reads sector data and checks for fake (Federal or Alien) traders
        getWordPos $sectorData $posShips "[0m[33mShips   [1m:"
	getWordPos $sectorData $posTraders "[0m[33mTraders [1m:"
	getWordPos $sectorData $posFederals "[0m[33mFederals[1m:"
	if ($posFederals > 0)
		setVar $federalsInSector TRUE
	end
	if ($posTraders > 0)
		getText $sectorData $fakeData "[1;32mSector  [33m:" "[0m[33mTraders [1m:"
		gosub :grabFakeData
	elseif ($posShips > 0)
		getText $sectorData $fakeData "[1;32mSector  [33m:" "[0m[33mShips   [1m:"
		gosub :grabFakeData
	else
		getText $sectorData $fakeData "[1;32mSector  [33m:" "[0m[1;32mWarps to Sector(s) [33m:"
		gosub :grabFakeData
	end
return
:grabFakeData
	setVar $fakeData $STARTLINE&$fakeData
	getText $fakeData $temp $STARTLINE $ENDLINE
	setVar $fakeTraderCount 0
	while ($temp <> "")
		getLength $STARTLINE&$temp&$ENDLINE $length
		cutText $fakeData $fakeData ($length+1) 9999
		stripText $temp $STARTLINE
		stripText $temp "  "
		stripText $temp $ENDLINE
		getWordPos $temp $pos "33m,[0;32m w/ "
		if ($pos <= 0)
			getWordPos $temp $pos "[0;32mw/ "
		end
		getWordPos $temp $pos2 "[33m, [0;32mwith"
		getWordPos $temp $pos3 "[0;35m[[31mOwned by[35m]"
		getWordPos $temp $pos4 "[0;32mw/ "&#27&"[1;33m"
		if ((($pos4 > 0) OR ($pos > 0) OR ($pos2 > 0)) AND ($pos3 <= 0))
			setVar $FAKETRADERS[($fakeTraderCount+1)] $temp
			add $fakeTraderCount 1
		end
		getText $fakeData $temp $STARTLINE $ENDLINE
	end
return
#####=================================== BOT COMMUNICATION ACCESS FUNCTIONS ===========================================#####
# ============================== MAIN BODY WAIT FOR COMMANDS ==============================
:wait_for_command
	killAllTriggers
	setVar $routing ""
	setVar $temp_bot_name ""
	loadVar $botIsDeaf
	if ($botIsDeaf = TRUE)
		gosub :donePrefer	
	end
	setVar $alive_count 0
	if ($stardock <= 0)
		setVar $stardock STARDOCK
		saveVar $stardock
	end
	if ($rylos <= 0)
		setVar $rylos RYLOS
		saveVar $rylos
	end
	if ($alpha_centauri <= 0)
		setVar $alpha_centauri ALPHACENTAURI
		saveVar $alpha_centauri
	end
        setVar $self_command FALSE
        setVar $scrubonly FALSE
        if ($botIsOff = TRUE)
		setTextlineTrigger activate_bot :check_routing $bot_name & " bot on"
	end
	if ((CONNECTED <> TRUE) AND ($doRelog = TRUE))
		goto :relog_attempt
	end
	SetTextOutTrigger 	user 		:User_Access 	">"
	settextouttrigger 	UpArrow 	:User_Access 	#28
	SetTextOutTrigger 	DownArrow	:User_Access 	#29
	SetTextOutTrigger 	UpArrow2	:User_Access 	#27&"[A"
	SetTextOutTrigger 	DownArrow2	:User_Access 	#27&"[B"
	SetTextOutTrigger 	Tabkey		:Hotkey_Access 	#9
	SetTextOutTrigger 	RightArrow	:Hotkey_Access 	#27&"[D"
	SetTextOutTrigger 	RightArrow2	:Hotkey_Access 	#31
	SetTextOutTrigger 	LeftArrow	:Hotkey_Access 	#27&"[C"
	SetTextOutTrigger 	LeftArrow2	:Hotkey_Access 	#30
	setVar $authorization 0
	setVar $logged 0
	setEventTrigger         shutdownthemodule	:shutDown 		"SCRIPT STOPPED"      $LAST_LOADED_MODULE
	setTextLineTrigger	getshipoffensive	:setShipOffensiveOdds	"Offensive Odds: "
	setTextLineTrigger	getshipmaxfighters	:setShipMaxFigAttack	" TransWarp Drive:   "
	setTextLineTrigger	federase		:fedEraseFig		"The Federation We destroyed your Corp's "
	setTextLineTrigger 	fighterserase		:eraseFig 		" of your fighters in sector "
	setTextLineTrigger      warpfigerase		:eraseWarpFig		"You do not have any fighters in Sector "
	#setTextLineTrigger      fightersadd		:addFig			"Should they be (D)efensive, (O)ffensive or Charge a (T)oll ?"
	setTextTrigger		sectordata		:checkSectorData	"(?=Help)? :"
	setTextLineTrigger	getPlanetNumber		:setPlanetNumber 	"Planet #"
	setDelayTrigger 	keepalive               :keepalive 	        30000
	setTextLineTrigger 	own_command 	        :check_routing 	        $bot_name
	setTextLineTrigger 	own_command_team        :check_routing_team     $bot_team_name
	if ($botIsOff = FALSE)
		setTextLineTrigger      loginmemo               :loginmemo              "You have a corporate memo from "
	end
	if ($doRelog = TRUE)
		setEventTrigger 	relog 		        :relog_attempt 		        "CONNECTION LOST"
	end
	setTextLineTrigger	clearbusts		:erasebusts		">[Busted:"
	setTextTrigger  	online_watch 	        :online_watch 	        "Your session will be terminated in "
	pause
# ============================== END MAIN BODY WAIT FOR COMMANDS SUB ==============================
:loginmemo
	getWordPos CURRENTANSILINE $pos (#27 & "[32mYou have a corporate memo from " & #27 & "[1;36m")
	if ($pos > 0)
		getText CURRENTANSILINE $user_name (#27 & "[32mYou have a corporate memo from " & #27 & "[1;36m") (#27 & "[0;32m." & #13)
#                                                 [32mYou have a corporate memo from [1;36mLS003[0;32m.
		setVar $i 1
		setVar $tempUsername $user_name
		lowercase $tempUsername
		lowerCase $user_name
		while ($i <= $corpyCount)
			setVar $tempCorpy $corpy[$i]
			lowerCase $tempCorpy
			if ($tempCorpy = $tempUsername)
				goto :endloginmemo
			end
			add $i 1
		end
		add $corpyCount 1
		setVar $corpy[$corpyCount] $user_name
		cutText $user_name $cut_user_name 1 6
		stripText $cut_user_name " "
		setVar $loggedin[$cut_user_name] 1
		send "'{" $bot_name "} - User Verified - " $user_name "*"
	end
	:endloginmemo
		setTextLineTrigger      loginmemo               :loginmemo            "You have a corporate memo from "
		pause
# ======================================= COMMAND ROUTING =========================================
:check_routing_team
	setVar $temp_bot_name $bot_team_name
	goto :do_routing
:check_routing_all
	setVar $temp_bot_name "snickerdoodle"
	goto :do_routing
:check_routing
	setVar $temp_bot_name $bot_name
:do_routing
	setVar $currentline CURRENTLINE
	setVar $currentansiline CURRENTANSILINE
	gosub :killthetriggers
	getWord CURRENTLINE $routing 1
	if (($routing = "'"&$temp_bot_name) AND ($temp_bot_name <> "snickerdoodle"))
		goto :own_command
	elseif (($routing = "R") AND ($botIsOff <> TRUE))
		goto :command
	elseif (($routing = "P") AND ($botIsOff <> TRUE))
		goto :page_command
	else
		goto :wait_for_command
	end
	:own_command
		cutText $CURRENTANSILINE $ansi_ck1 1 1
		if ($ansi_ck1 <> "")
			goto :wait_for_command
		end
		getWord $CURRENTLINE $radio_type 1
		stripText $radio_type $temp_bot_name
		setvar $user_command_line $CURRENTLINE
        setVar $user_command_line $user_command_line&"              "
        lowercase $user_command_line
		if ($radio_type = "'")
			getLength "'"&$temp_bot_name&" " $length
			cutText $user_command_line $user_command_line $length+1 9999
			setVar $user_sec_level 9
			getWord $CURRENTLINE $command 2
			getWordPos $command $pos "'"
			getWordPos $command $pos2 "`"
			if ($pos = 1) OR ($pos2 = 1)
				goto :wait_for_command
			end
			getLength $command&" " $commandLength
			cutText $user_command_line $user_command_line $commandLength+1 9999
			gosub :getParameters
			goto :command_processing
		else
			goto :wait_for_command
		end
	:command
		setVar $ansi_line $currentansiline

		getWordPos $ansi_line $pos "[36mR"

		# MAR 2809 - Commented out to fix ansi filtering. not sure why it checks for "[1A"
		#stripText $ansi_line "[1A"
		#cutText $ansi_line $ansi_ck2 1 1
		#if ($ansi_ck2 <> "")

		if ($pos = 0)
			goto :wait_for_command
		end
		cutText $currentline $user_name 3 6
		stripText $user_name " "
		cutText $currentline $user_command_line 10 999
		getWord $user_command_line $botname_chk 1
		if ($botname_chk <> $temp_bot_name)
			goto :wait_for_command
		end
		getLength $temp_bot_name&" " $length
		cutText $user_command_line&"          " $user_command_line $length+1 9999
		lowerCase $user_command_line
		setVar $user_command_line $user_command_line&"              "
		getWord $user_command_line $command 1
		if (($command = "bot") OR ($command = "relog"))
			goto :wait_for_command
		end
		getLength $command $length
		cutText $user_command_line&"          " $user_command_line $length+1 9999
		gosub :getParameters
		gosub :verify_user_status
		if ($authorization = 0)
			send "'{" $bot_name "} - Send a corporate memo to login.*"
			goto :wait_for_command
		end
		goto :command_processing
	:page_command
		cutText $currentline $user_name 3 6
		stripText $user_name " "
		cutText $currentline $user_command_line 9 999
		stripText $user_command_line " "
		getWordPos $user_command_line $pos $bot_name&":"&$bot_password&":"&$subspace
		if ($pos > 0)
			add $corpyCount 1
			setVar $corpy[$corpyCount] $user_name
			setVar $loggedin[$user_name] 1
			send "'{" $bot_name "} - User Verified - " $user_name "*"
		else
			getWord $user_command_line $botname_chk 1
			if ($botname_chk <> $temp_bot_name)
				goto :wait_for_command
			end
			getLength $temp_bot_name&" " $length
			cutText $user_command_line&"          " $user_command_line $length+1 9999
			lowerCase $user_command_line
			setVar $user_command_line $user_command_line&"              "
			getWord $user_command_line $command 1
			if (($command = "bot") OR ($command = "relog"))
				goto :wait_for_command
			end
			getLength $command $length
			cutText $user_command_line&"          " $user_command_line $length+1 9999
			gosub :getParameters
			gosub :verify_user_status
			if ($authorization = 0)
				send "'{" $bot_name "} - Send a corporate memo to login.*"
				goto :wait_for_command
			end
			goto :command_processing			
		end
		goto :wait_for_command
# ============================== END COMMAND ROUTING SUB ==============================
#============================== SELF CONTROL ==============================
:User_Access
	gosub :bigdelay_killthetriggers
	echo "**"
	gosub :selfCommandPrompt
	lowercase $user_command_line
	if ($user_command_line = "")
		echo CURRENTANSILINE
		goto :wait_for_command
	elseif ($user_command_line = "?")
		goto :echo_help
	elseif ($user_command_line = "help")
		goto :echo_help
	end
        :runUserCommandLine
		setVar $self_command TRUE
		setVar $user_command_line $user_command_line&"              "
		setVar $authorization 9
		setVar $user_sec_level 9
		getWord $user_command_line $command 1
		getLength $command&" " $commandLength
		getWordPos $command $pos "'"
		getWordPos $command $pos2 "`"
		if ($pos <> 1) AND ($pos2 <> 1)
			cutText $user_command_line $user_command_line $commandLength+1 9999
		end
		gosub :getParameters
		goto :command_processing
#============================== END SELF CONTROL SUB ==============================
:getParameters
	setVar $i 1
	while ($i <= 8)
		getWord ($user_command_line & " ") $parms[$i] $i 0
		add $i 1
	end
return
# ======================     START SELF COMMAND PROMPT SUBROUTINE    ==========================
:selfCommandPrompt
	gosub :bigdelay_killthetriggers
	setVar $prompt ANSI_10&#27&"[255D"&#27&"[255B"&#27&"[K"&ANSI_4&"{"&ANSI_14&$mode&ANSI_4&"}"&ANSI_15&" "&$bot_name&ANSI_2&">"&ANSI_7
	echo $prompt
	:getInput
		killTrigger text
		killtrigger reecho
		setTextOutTrigger text :getCharacter
		setDelayTrigger 	keepalive               :keepalive 	         30000
		settexttrigger reecho :reEcho
		pause
	:getCharacter
		getOutText $character
		if (($character = ">") AND ($charCount <= 0))
			:gridprompt
				gosub :bigdelay_killthetriggers
				gosub :current_prompt
				setVar $doHolo FALSE
				setVar $doDens FALSE
				echo ANSI_10&#27&"[255D"&#27&"[255B"&#27&"[K"
				gosub :displayAdjacentGridAnsi
				setVar $gridprompt ANSI_10&#27&"[255D"&#27&"[255B"&#27&"[K"&ANSI_4&"{"&ANSI_14&"Grid Menu - ["&ANSI_15&"H"&ANSI_14&"]olo ["&ANSI_15&"D"&ANSI_14&"]ens "
				if ($CURRENT_PROMPT = "Citadel")
					setVar $gridprompt $gridprompt&"["&ANSI_15&"+"&ANSI_14&"]["&ANSI_15&$pgrid_type&ANSI_14&"] ["&ANSI_15&"1"&ANSI_14&"-"&ANSI_15&$gridWarpCount&ANSI_14&"]"&ANSI_4&"}"&ANSI_14&ANSI_2&">"&ANSI_7&" "
				elseif ($CURRENT_PROMPT = "Command")
					setVar $gridprompt $gridprompt&"["&ANSI_15&"1"&ANSI_14&"-"&ANSI_15&$gridWarpCount&ANSI_14&"]"&ANSI_4&"}"&ANSI_14&" Move"&ANSI_4&"}"&ANSI_2&">"&ANSI_7
				else
					echo ANSI_12&"*Wrong prompt for Grid Menu*"
					goto :donegriddingprompt
				end
				echo $gridprompt
				gosub :bigdelay_killthetriggers
				settexttrigger reEchogridmenu :reEchogridmenu
				setTextOutTrigger text0 :gridprompt "?"
				setTextOutTrigger text12 :nextMenu ">"
				setDelayTrigger keepalive	:keepalive	30000
				setVar $i 1
				while ($i <= $gridWarpCount)
					setTextOutTrigger "grid_map"&$i :visitSectorPgrid $i
					add $i 1
				end
				setTextOutTrigger text7 :hologrid #83
				setTextOutTrigger text8 :hologrid #115
				setTextOutTrigger text13 :hologrid "h"
				setTextOutTrigger text14 :hologrid "H"
				setTextOutTrigger text9 :densgrid #68
				setTextOutTrigger text10 :densgrid #100
				if ($CURRENT_PROMPT = "Citadel")
					setTextOutTrigger text15 :changePgridType "+"
				end
				setTextOutTrigger text11 :donegriddingprompt
				pause
			:hologrid
				setVar $doHolo TRUE
				goto :doGridScan
			:densgrid
				setVar $doDens TRUE
			:doGridScan
				gosub :bigdelay_killthetriggers
				if ($CURRENT_PROMPT = "Citadel")
					setVar $scantext "q q z n "
				else
					setVar $scantext ""
				end
				if ($doHolo = TRUE)
					setVar $scantext $scantext&"s hzn* "
				elseif ($doDens = TRUE)
					setVar $scantext $scantext&"s dz* "
				end
				if ($CURRENT_PROMPT = "Citadel")
					setVar $scantext $scantext&"l "&$PLANET&"*  c  "
				end
				send $scantext
				if ($CURRENT_PROMPT = "Citadel")
					waitOn "<Enter Citadel>"
				else
					waitOn "["&CURRENTSECTOR&"]"
				end
				goto :gridprompt
			:changePgridType
				if ($pgrid_type = "Normal")
					if ($safe_ship <= 0)
						setVar $pgrid_type "Xport (Not Available)"
						setVar $pgrid_end_command " scan "
					else
						setVar $pgrid_type "Xport"
						setVar $pgrid_end_command " x:"&$safe_ship&" scan "
					end
				elseif (($pgrid_type = "Xport") OR ($pgrid_type = "Xport (Not Available)"))
					setVar $pgrid_type "Retreat"
					setVar $pgrid_end_command " r scan "
				else
					setVar $pgrid_type "Normal"
					setVar $pgrid_end_command " scan "
				end
				goto :gridprompt
			:visitSectorPgrid
				getOutText $sector
				gosub :bigdelay_killthetriggers
				if (SECTOR.WARPS[CURRENTSECTOR][$sector] > 0)
					if ($CURRENT_PROMPT = "Citadel")
						setVar $user_command_line "pgrid "&SECTOR.WARPS[CURRENTSECTOR][$sector]&" "&$pgrid_end_command
						goto :runUserCommandLine
					elseif ($CURRENT_PROMPT = "Command")
						setVar $moveIntoSector SECTOR.WARPS[CURRENTSECTOR][$sector]
						gosub :moveIntoSector
					end
				end
				goto :donegriddingprompt
			:donegriddingprompt
				echo #27&"[255D"&#27&"[255B"&#27&"[K"
				goto :wait_for_command
			:nextMenu
				setTextOutTrigger text12 :nextMenu ">"
				pause
			:reechogridmenu
				echo ANSI_10&#27&"[255D"&#27&"[255B"&#27&"[K"&$gridprompt
				settexttrigger reEchogridmenu :reEchogridmenu
				pause
		end
		if ($character = #13)
			echo #27&"[255D"&#27&"[255B"&#27&"[K"
			setVar $user_command_line $promptOutput
			gosub :doAddHistory
			goto :doneSelfCommandPrompt

		else
			getLength $character $characterLength
			if ($character = #8)
				if ($charCount <= 0)
					setVar $charCount 0
					setVar $charPos 0
				else
					if ($charPos >= $charCount)
						setvar $frontMacro $promptOutput
						setvar $tailMacro ""
					else
						cuttext $promptOutput $tailMacro ($charPos+1) 9999
						cuttext $promptOutput  $frontMacro 1 ($charPos)
					end
					getlength $frontMacro $frontLength
					if ($frontLength > 1)
						cuttext $frontMacro $frontMacro 1 ($frontLength - 1)
					else
						setVar $frontMacro ""
					end
					setvar $promptOutput $frontMacro & $tailMacro
					getlength $promptOutput $charCount
					subtract $charPos 1
					if ($charPos <= 0)
						setvar $charPos 0
					end
					if (($charCount-$charPos) > 0)
						echo $prompt $promptOutput #27 "[" ($charCount-($charPos)) "D"
					else
						echo $prompt $promptOutput
					end
				end
			elseif (($character = #27&"[A") OR ($character = #28))
				if ($historyCount > 0)
					if ($historyIndex <= 0)
						setVar $currentPromptText $promptOutput
					end
					add $historyIndex 1
					if ($historyIndex > $historyMax)
						setVar $historyIndex $historyMax
					elseif ($historyIndex > $historyCount)
						setVar $historyIndex $historyCount
					end
					getLength $history[$historyIndex] $charCount
					setVar $charPos $charCount
					echo $prompt $history[$historyIndex]
					setVar $promptOutput $history[$historyIndex]
				end
			elseif (($character = #27&"[B") OR ($character = #29))
				if ($historyCount > 0)
					if ($historyIndex <= 0)
						setVar $currentPromptText $promptOutput
					end
					subtract $historyIndex 1
					if ($historyIndex < 1)
						setVar $historyIndex 0
						getLength $currentPromptText $charCount
						setVar $charPos $charCount
						echo $prompt $currentPromptText
						setVar $promptOutput $currentPromptText
					else
						getLength $history[$historyIndex] $charCount
						setVar $charPos $charCount
						echo $prompt $history[$historyIndex]
						setVar $promptOutput $history[$historyIndex]
					end
				end
			elseif (($character = #27&"[D") OR ($character = #31))
				if ($charPos > 0)
					subtract $charPos 1
					echo ANSI_10 $character
				end
			elseif ($charCount > 80)
				#ignore
			elseif (($character = #27&"[C") OR ($character = #30))
				if ($charPos <= $charCount)
					add $charPos 1
					echo ANSI_10 $character
				end
			elseif (($characterLength > 1) OR ($characterLength <= 0))
				#ignore
			else
				:treatAsUsual
					if ($charPos >= $charCount)
						if ($charPos = 1)
							setvar $frontMacro $promptOutput
							setvar $tailMacro $character
						else
							setvar $frontMacro $promptOutput
							setvar $tailMacro $character
						end
					else
						cuttext $promptOutput $frontMacro 1 ($charPos)
						cuttext $promptOutput $tailMacro  ($charPos+1) ($charCount - ($charPos-1))
						setVar $frontMacro $frontMacro&$character
					end
					setvar $promptOutput $frontMacro & $tailMacro
					getlength $promptOutput $charCount
					add $charPos 1
					if (($charCount-$charPos) > 0)
						echo $prompt $promptOutput #27 "[" ($charCount-$charPos+1) "D"
					else
						echo $prompt $promptOutput
					end
			end
		end
		setTextOutTrigger text :getCharacter
		pause
	:reecho
		if (($charCount-$charPos) > 0)
			echo $prompt&$promptOutput&#27&"["&($charCount-$charPos+1)&"D"
		else
			echo $prompt&$promptOutput
		end
		settexttrigger reEcho :reEcho
		pause
	:doneSelfCommandPrompt
	killtrigger text
	killtrigger reecho
return
# ======================     END SELF COMMAND PROMPT SUBROUTINE    ==========================
:doAddHistory
	setVar $charCount 0
	setVar $currentPromptText ""
	setVar $historyIndex 0
	setVar $charPos 0
	setVar $promptOutput ""
	setVar $historyString ""
	if ($user_command_line <> "")
		add $historyCount 1
		if ($historyCount > 1)
			setVar $i $historyMax
			while ($i > 1)
				setVar  $history[$i] $history[($i-1)]
				setVar $historyString $history[$i]&"<<|HS|>>"&$historyString
				subtract $i 1
			end
		end
		setVar $history[1] $user_command_line
		setVar $historyString $history[1]&"<<|HS|>>"&$historyString
		saveVar $historyString
	end
return
#========================== COMMAND PROCESSING/EXTERNAL MODULE RUNNING =================
:command_processing
        lowercase $command
:command_filtering
	cutText $user_command_line&"  " $checkForChat 1 1
	cutText $command&"  " $checkForFinder 1 1
	if ($checkForChat = "'")
		goto :ss
	elseif ($checkForChat = "`")
		goto :fed
	end
	if ($checkForFinder = "f")
		setVar $temp $command
		striptext $temp "f"
		isNumber $test $temp
		if ($test)
			if ($temp > 0)
				if ($temp = $CORP)
					setVar $command "f"
				else
					setVar $target_corp $temp
					setVar $command "owner"
					getWord $user_command_line $parm1 1
					goto :finder
				end
			end
		end
	end
	if ($command = "?")
		setVar $command "help"
	end
	setVar $i 1
	while ($i <= $PARMS)
		if ($PARMS[$i] = "s")
			setVar $PARMS[$i] $stardock
		elseif ($PARMS[$i] = "r")
			setVar $PARMS[$i] $rylos
		elseif ($PARMS[$i] = "a")
			setVar $PARMS[$i] $alpha_centauri
		elseif ($PARMS[$i] = "h")
			setVar $PARMS[$i] $home_sector
		elseif ($PARMS[$i] = "b")
			setVar $PARMS[$i] $backdoor
		elseif ($PARMS[$i] = "x")
			setVar $PARMS[$i] $safe_ship
		end
		add $i 1
	end
	setVar $parm1 $PARMS[1]
	setVar $parm2 $PARMS[2]
	setVar $parm3 $PARMS[3]
	setVar $parm4 $PARMS[4]
	setVar $parm5 $PARMS[5]
	setVar $parm6 $PARMS[6]
	setVar $parm7 $PARMS[7]
	setVar $parm8 $PARMS[8]
	if ($command = "help")
		if ($parm1 <> 0)
			lowerCase $parm1
			setVar $i 1
			while ($i <= 7)
				setVar $temptype $TYPES[$i]
				lowerCase $temptype
				if ($parm1 = $temptype)
					setVar $currentList $INTERNALCOMMANDLISTS[$i]
					goto :command_list
				end
				add $i 1
			end
			fileExists $doesExist "scripts\MomBot3\Help\"&$parm1&".txt"
			if ($doesExist)
				readToArray "scripts\MomBot3\Help\"&$parm1&".txt" $HELP_ARRAY
				setVar $i 1
				#setVar $helpOutput "'*{"&$bot_name&"} - *"
				setVar $helpOutput ""
				while ($i <= $HELP_ARRAY)
					stripText $HELP_ARRAY[$i] #13
					stripText $HELP_ARRAY[$i] "`"
					stripText $HELP_ARRAY[$i] "'"
					replaceText $HELP_ARRAY[$i] "=" "-"
					setVar $temp $HELP_ARRAY[$i]
					getLength $temp $length
					setVar $isTooLong FALSE
					while ($length > 70)
						setVar $isTooLong TRUE
						cutText $temp $temp 71 ($length-70)
						getLength $temp $length
					end
					setVar $helpOutput $helpOutput&$HELP_ARRAY[$i]
					if ($length <= 1)
						setVar $helpOutput $helpOutput&"  "
					end
					setVar $helpOutput $helpOutput&"*"
					add $i 1
				end
				setVar $helpOutput $helpOutput&"*"
				setVar $message $helpOutput
				if ($self_command)
					gosub :switchboard
				else
					send "'*{"&$bot_name&"} - *"&$helpOutput&"*"
				end
			else
				setVar $message "No help file available for "&$parm1&".*"
				gosub :switchboard
			end
			goto :wait_for_command
		else
			if ($self_command)
				goto :echo_help
			else
				goto :ss_help
			end
		end
	end
	if ($command = "0")
		send "'{" $bot_name "} - You are logged into this bot.  Use "&$bot_name&" help for commands.*"
		goto :wait_for_command
	end
	getWordPos " "&$user_command_line&" " $stopCheck " off "
	gosub :formatCommand
	gosub :findCommand
	if ($currentCategory = "Modes")
		if ($stopCheck > 0)
		   	  killtrigger shutdownthemodule
			  stop $LAST_LOADED_MODULE
		   	  setVar $mode "General"
	 		  send "'{" $bot_name "} - "&$formatted_command&" mode is now off.*"
			  goto :wait_for_command
		end
	end
	if (($doesExist > 0) OR ($doesExistHidden > 0))
		goto :run_module
	else
		getWordPos $internalCommandList&$doubledCommandList $pos " "&$command&" "
		if ($pos > 0)
			gosub :killthetriggers
			goto ":"&$command
		end
	end
	setVar $message $formatted_command&" is not a valid command.*"
	gosub :switchboard
	goto :wait_for_command
:formatCommand
	cutText $command&" " $firstChar 1 1
	cutText $command&" " $restOfCommand 2 999
	uppercase $firstChar
	setVar $formatted_command $firstChar&$restOfCommand
	stripText $formatted_command " "	
return
:findCommand
	setVar $ModuleCategory ""
	setVar $i 1
	while ($i <= 3)
		setVar $j 1
		while ($j <= 7)
			if ($i = 3)
				fileExists $doesExist "scripts\MomBot3\"&$CATAGORIES[$i]&"\"&$command&".cts"
				fileExists $doesExistHidden "scripts\MomBot3\"&$CATAGORIES[$i]&"\_"&$command&".cts"
				if (($doesExist) OR ($doesExistHidden))
					setVar $currentCategory $CATAGORIES[$i]
					if ($doesExistHidden)
						setVar $ModuleCategory $CATAGORIES[$i]&"\_"
					else
						setVar $ModuleCategory $CATAGORIES[$i]&"\"
					end
					setVar $currentList $internalCommandList[$j]
					return
				end
			else
				fileExists $doesExist "scripts\MomBot3\"&$CATAGORIES[$i]&"\"&$TYPES[$j]&"\"&$command&".cts"
				fileExists $doesExistHidden "scripts\MomBot3\"&$CATAGORIES[$i]&"\"&$TYPES[$j]&"\_"&$command&".cts"
				if (($doesExist) OR ($doesExistHidden))
					setVar $currentCategory $CATAGORIES[$i]
					if ($doesExistHidden)
						setVar $ModuleCategory $CATAGORIES[$i]&"\"&$TYPES[$j]&"\_"
					else
						setVar $ModuleCategory $CATAGORIES[$i]&"\"&$TYPES[$j]&"\"
					end
					setVar $currentList $internalCommandList[$j]
					return
				end
			end
			add $j 1
		end
		add $i 1
	end
return
:run_module
	gosub :killthetriggers
	saveVar $command
	saveVar $user_command_line
	saveVar $parm1
	saveVar $parm2
	saveVar $parm3
	saveVar $parm4
	saveVar $parm5
	saveVar $parm6
	saveVar $parm7
	saveVar $parm8
	saveVar $bot_name
	saveVar $unlimitedGame
	saveVar $CAP_FILE
	saveVar $bot_turn_limit
	saveVar $password
	saveVar $mode
	saveVar $mbbs
	saveVar $warn
	saveVar $ptradesetting
	saveVar $rylos
	saveVar $alpha_centauri
	saveVar $stardock
	saveVar $backdoor
	saveVar $home_sector
	saveVar $port_max
	saveVar $steal_factor
	saveVar $rob_factor
	saveVar $subspace
	saveVar $MULTIPLE_PHOTONS
	if ($currentCategory = "Modes")	
		stop $LAST_LOADED_MODULE
		setVar $LAST_LOADED_MODULE "scripts\MomBot3\"&$ModuleCategory&$command&".cts"
		setVar $mode $formatted_command
	end
	stop "scripts\MomBot3\"&$ModuleCategory&$command&".cts"
	stop "scripts\MomBot3\"&$ModuleCategory&$command&".cts"
	stop "scripts\MomBot3\"&$ModuleCategory&$command&".cts"
	stop "scripts\MomBot3\"&$ModuleCategory&$command&".cts"
	stop "scripts\MomBot3\"&$ModuleCategory&$command&".cts"
	load "scripts\MomBot3\"&$ModuleCategory&$command&".cts"	
goto :wait_for_command
#============================ END COMMAND PROCESSING/EXTERNAL MODULE RUNNING =======================
#============================== HOTKEY CONTROL ==============================
:Hotkey_Access
        gosub :bigdelay_killthetriggers
	setVar $self_command TRUE
	setVar $command ""
	setVar $invalid FALSE
	echo #27 "[1A" #27 "[K" ANSI_15 "**Hotkey" ANSI_4
	getConsoleInput $tempCharacter SINGLEKEY
	:checkHotKey
		getCharCode $tempCharacter $charCode
		gosub :killthetriggers
		setVar $temp $hotkeys[$charCode]
		if (($temp <> "0") AND ($temp <> ""))
			setVar $command $custom_commands[$temp]
		else
			setVar $invalid TRUE
		end
		cutText $command&"  " $test 1 1
		if ($charCode = "48")
			setVar $i 10
			goto :runHotScript
		elseif ($charCode = "63")
		   	goto :echo_help
		elseif (($charCode >= 49) AND ($charCode <= 57))
			setVar $i ($charCode-48)
			goto :runHotScript
		elseif (($test = ":") AND ($invalid = FALSE))
			goto $command
		elseif ($invalid = FALSE)
			setVar $user_command_line $command
			goto :runUserCommandLine
		end
		echo #27 "[10D          " #27 "[10D"
		goto :wait_for_command
#============================== END HOTKEY CONTROL SUB ==============================
# ========================== START STOPALL (STOPALL) SUBROUTINE ==============================
:stopall
	gosub :killthetriggers
	openMenu TWX_STOPALLFAST FALSE
	setVar $mode "General"
	send "'{" $bot_name "} - All non-system scripts and modules killed, and modes reset.*"
	goto :Wait_for_command
# =========================== END STOPALL (STOPALL) SUBROUTINE ================================
:listall
	listActiveScripts $scripts
	setVar $a 1
	setVar $message " Current script(s) loaded*"
	setVar $message $message&"--------------------------*"
	while ($a <= $scripts)
		setVar $message $message&"   "&$scripts[$a]&"*"
		add $a 1
	end
	if ($self_command <> TRUE)
		setVar $self_command 2
	end
	gosub :switchboard	
goto :wait_for_command
# ================================== START GENERAL MODE RESET ====================================
:stopModules
	stop $LAST_LOADED_MODULE
	echo ANSI_14 "*<<" ANSI_15 "General Mode Reset" ANSI_14 ">>*" ANSI_7
	setVar $mode "General"
	setVar $LAST_LOADED_MODULE ""
	goto :Wait_for_command
# ================================= END GENERAL MODE RESET ==========================================
#============================== START SCRIPT ACCESS CONTROL SUB ==============================
:script_access
        gosub :killthetriggers
	setVar $i 1
	echo #27 "[3A" #27 "[K*" #27 "[K*" #27 "[K*" ANSI_14 "*Which script to run?                      *----------------------------------"
	while (($i <= $HOTKEY_SCRIPTS) AND ($i <= 10))
		if ($HOTKEY_SCRIPTS[$i] <> 0)
			if ($i >= 10)
				SetTextOutTrigger "key"&$i 	:triggerHotScript	0
				echo "*"&ANSI_15&"0"&ANSI_14&") "&ANSI_15&$HOTKEY_SCRIPTS[$i][1]
			else
				SetTextOutTrigger "key"&$i 	:triggerHotScript	$i
				echo "*"&ANSI_15&$i&ANSI_14&") "&ANSI_15&$HOTKEY_SCRIPTS[$i][1]
			end
		end
		add $i 1
	end
	SetTextOutTrigger echohelp2   	 :script_access 	#63
	setDelayTrigger   notfastenough2 :doneScripts 		9000
	SetTextOutTrigger noneAvail2 	 :doneScripts
	echo #27 "[1A" #27 "[K" ANSI_14 "***Scripts" ANSI_15 ">" ANSI_7
	pause
	:doneScripts
		echo #27 "[10D          " #27 "[10D"
		goto :wait_for_command
:triggerHotScript
	getOutText $i
	if ($i = 0)
		setVar $i 10
	end
:runHotScript
	gosub :killthetriggers
        fileExists $chk $HOTKEY_SCRIPTS[$i]
	if ($chk)
		load $HOTKEY_SCRIPTS[$i]
	else
		echo ANSI_4&"*"&$HOTKEY_SCRIPTS[$i]&" does not exist in specified location.  Please check your "&$SCRIPT_FILE&" file to make sure it is correct.*"&ANSI_7
	end
goto :wait_for_command
#============================== END SCRIPT ACCESS CONTROL SUB ==============================
# ============================== START MOW HOTKEY ===============================
:mowswitch
	getInput $parm1 "Mow To:"
	getWord $parm1 $parm1 1
	stripText $parm1 " "
	if (($parm1 = "0") OR ($parm1 = ""))
		goto :wait_for_command
	end
	setVar $user_command_line "mow "&$parm1&" 1"
	goto :runUserCommandLine
#================================  END MOW HOTKEY =================================
#============================= START PHOTON HOTKEY ================================
:fotonswitch
	if ($mode = "Foton")
		setVar $user_command_line "foton off"
		goto :runUserCommandLine
	else
		setVar $user_command_line "foton on p"
		goto :runUserCommandLine
	end
goto :wait_for_command
#=========================== END PHOTON HOTKEY =======================================
# ============================== STARTING IN A NEW GAME SUB ==============================
:add_game
	getInput $new_bot_name ANSI_13&"What is the 'in game' name of the bot? (one word, no spaces)"&ANSI_7
	stripText $new_bot_name "^"
	stripText $new_bot_name " "
	lowerCase $new_bot_name
	if ($new_bot_name = "")
		goto :add_game
	end
	if (PASSWORD = "")
		getInput $password "Please Enter your Game password"
	end
	delete $gconfig_file
	write $gconfig_file $new_bot_name
	setVar $bot_name $new_bot_name
return
# ============================== END STARTING IN A NEW GAME SUB ==============================
# ============================== BOT SECURITY ==============================
:verify_user_status
	setVar $i 1
	lowerCase $user_name
	while ($i <= $corpyCount)
		cutText $corpy[$i] $name 1 6
		stripText $name " "
		lowerCase $name
		if ($user_name = $name)
			setVar $authorization 1
			return
		end
		add $i  1
	end
return
:chk_login
	if ($loggedin[$user_name] = 1)
		setVar $logged 1
	else
		setVar $logged 0
	end
return
# ============================== BOT SECURITY ==============================
# ============================== SCRIPT VALIDATION ==============================
:validation
#	GetTime $CurrentDate "d:m:yyyy"
#	GetWordPos $CurrentDate $SemiPos ":"
#	CutText $CurrentDate $Day 1 ($SemiPos - 1)
#	CutText $CurrentDate $CurrentDate ($SemiPos +1) 999
#	GetWordPos $CurrentDate $SemiPos ":"
#	CutText $CurrentDate $Month 1 ($SemiPos - 1)
#	CutText $CurrentDate $Year ($SemiPos +1) 999
#	if (($TRADER_NAME <> "") and ($TRADER_NAME <> "bob") and ($TRADER_NAME <> "Bob") and ($TRADER_NAME <> "BOB"))
#	        Setvar $OkayToUse FALSE
#	end
#	if ($Month <> 2)
#		Setvar $OkayToUse FALSE
#	end
#	if ($Year <> 2006)
#		Setvar $OkayToUse FALSE
#	end
#	if ($Day > 22)
#		Setvar $OkayToUse FALSE
#	end
#	if (STARDOCK <> 1222)
#		Setvar $OkayToUse FALSE
#	end
#	if (SECTORS <> 5000)
#		Setvar $OkayToUse FALSE
#	end
#	if ($OkayToUse = FALSE)
#		echo "***"
#		echo ansi_12 "This script is no longer valid, contact A Mind ()ver Matter member for extension.*"
#		echo ansi_13 "This script is no longer valid, contact A Mind ()ver Matter member for extension.*"
#		echo ansi_14 "This script is no longer valid, contact A Mind ()ver Matter member for extension.*"
#		echo ansi_15 "This script is no longer valid, contact A Mind ()ver Matter member for extension.*"
#		echo "***"
#	halt
#	end
return
:callin
	setVar $new_bot_team_name $parm1
	stripText $new_bot_team_name "^"
	stripText $new_bot_team_name " "
	lowerCase $new_bot_team_name
	if ($new_bot_team_name = "")
		send "'{" $bot_name "} - Invalid team name entered, cannot join that one.*"
		goto :wait_for_command
	end
	setVar $bot_team_name $new_bot_team_name
	saveVar $bot_team_name
	send "'{" $bot_name "} - I am now part of team: "&$bot_team_name&"*"
goto :wait_for_command
:doQsetProtections
	setVar $cannonType $type
	isNumber $test $damage
	if ($test)
		setVar $cannonDamage $damage
	else
		send "'{" $bot_name "} - Invalid damage amount entered. *"
		goto :wait_for_command
	end
return
:qset
:q
	gosub :current_prompt
	setVar $startingLocation $CURRENT_PROMPT
	setVar $validPrompts "Planet Citadel"
	gosub :checkStartingPrompt	
	setVar $totalDamage 0
	getWord $user_command_line $parm1 1
	getWord $user_command_line $parm2 2
	if (($parm2 = "a") OR ($parm2 = "s"))
		setVar $type $parm2
		setVar $damage $parm1
	elseif (($parm1 = "a") OR ($parm1 = "s"))
		setVar $type $parm1
		setVar $damage $parm2
	else
		setVar $type "s"
		setVar $damage $parm1
	end
	gosub :doQsetProtections
	if ($startingLocation = "Citadel")
		send "q"
	end
	gosub :getPlanetInfo
	if ($CITADEL < 3)
		send "'{" $bot_name "} - Planet number " $PLANET " does not have a quasar cannon.*"
		if (($CITADEL > 0) AND ($startingLocation = "Citadel"))
			send "c "
		end
	else
		send "c "
		if ($cannonType = "s")
			setVar $percentToSet (((3*$cannonDamage)*100)/$PLANET_FUEL)
			if (((($PLANET_FUEL * $percentToSet) / 100)/3) < $cannonDamage)
				add $percentToSet 1
			end
			if ($percentToSet > 100)
				setVar $percentToSet 100
			end
			add $totalDamage ((($PLANET_FUEL * $percentToSet) / 100)/3)
			send "l s "&$percentToSet&"* "
			setVar $damageType "Sector"
		else
			if ($mbbs)
				setVar $percentToSet ((($cannonDamage/2)*100)/$PLANET_FUEL)
				if (((($PLANET_FUEL * $percentToSet) / 100)*2) < $cannonDamage)
					add $percentToSet 1
				end
			else
				setVar $percentToSet (((2*$cannonDamage)*100)/$PLANET_FUEL)
				if (((($PLANET_FUEL * $percentToSet) / 100)/2) < $cannonDamage)
					add $percentToSet 1
				end
			end
			if ($percentToSet > 100)
				setVar $percentToSet 100
			end
			if ($mbbs)
				add $totalDamage ((($PLANET_FUEL * $percentToSet) / 100)*2)
			else
				add $totalDamage ((($PLANET_FUEL * $percentToSet) / 100)/2)				
			end
			send "l a "&$percentToSet&"* "
			setVar $damageType "Atmosphere"
		end
		if ($startingLocation = "Planet")
			send "q "
		end
		send "'{" $bot_name "} - Quasar Cannon on planet "&$PLANET&" is set to "&$totalDamage&". ("&$damageType&")*"
	end
	goto :wait_for_command
:emx
:reset
	disconnect
	goto :wait_for_command
:emq
	send " q q q * p d 0* 0* 0* * *** * c q q q q q z 2 2 c q * z * *** * * "
	goto :wait_for_command
:lift
	send "0* 0* 0* q q q q q z a 999* * * * "
	waitfor "Command [TL"
	send "'I have lifted off from planet " $planet "*"
	goto :wait_for_command
# ============================== START LOGIN (login) Sub ==============================
:login
	gosub :killthetriggers
	gosub :current_prompt
	setVar $startingLocation $CURRENT_PROMPT
		getWordPos $parm1 $pos #34
		if ($pos > 0)
			getText " "&$user_command_line&" " $trader_bot_name " "&#34 #34&" "
			if ($trader_bot_name <> "")
				lowercase $trader_bot_name
				stripText $user_command_line #34&$trader_bot_name&#34
				getWord $user_command_line $login_bot_name 1
			else
				send "'{" $bot_name "} - Invalid user name, login cannot be completed*"
				goto :wait_for_command
			end
		else
			if ($parm1 = 0)
				setVar $validPrompts "Citadel Command"
				gosub :checkStartingPrompt
				if ($startingLocation = "Command")
					send "t tLogin** q "
				else
					send "x tLogin** q "
				end
				goto :wait_for_command
			else
				setVar $trader_bot_name $parm1
				setVar $login_bot_name $parm2
			end
		end

		send "=" & $trader_bot_name & "*"
		setTextTrigger partial :partial "Do you mean"
		setTextLineTrigger match :match "Secure comm-link established, Captain."
		setTextLineTrigger nomatch :nomatch "Unknown Trader!"
		setTextLineTrigger yourself :nomatch "The crew is disturbed by your incoherent mumbling."
		setTextLineTrigger notonline :notonline "Type M.A.I.L. message"
		pause
        :notonline
		gosub :killthetriggers
			send "* '{" & $bot_name & "} - Syntax Error - Trader doesn't appear to be online!*"
			goto :wait_for_command
		:nomatch
			gosub :killthetriggers
			send "'{" & $bot_name & "} - Syntax Error - Unable to establish communications!*"
			goto :wait_for_command
		:partial
			gosub :killthetriggers
			send "y"
   		:match
			gosub :killthetriggers
			setTextLineTrigger yourself2 :nomatch "The crew is disturbed by your incoherent mumbling."
			waitOn "Type private message [<ENTER>"
			send "use " & $login_bot_name & "**"
			setTextLineTrigger joy :joy "You have 5 seconds to type"
			setTextLineTrigger joy2 :joy "You now have 5 seconds to type"
			setDelayTrigger nojoy :nojoy 5000
			pause
		:nojoy
			gosub :killthetriggers
			send "'{" & $bot_name & "} - No Response, perhaps Bot is not Loaded.*"
			goto :wait_for_command
		:joy
			gosub :killthetriggers
	       		setVar $_LS_s CURRENTLINE
			getText $_LS_s $_LS_security_code "to type " " on subspace"
		:joy_continue
			if ($_LS_security_code = "")
				send "'{" & $bot_name & "} - Unexpected Response, shutting down login*"
				goto :Wait_for_command
			end
			send "'" & $_LS_security_code & "*"
			setTextTrigger loggedin :loggedin "- User Verified -"
			setDelayTrigger notloggedin :notloggedin 3000
			pause
        		:notloggedin
				gosub :killthetriggers
				send "'{" & $bot_name & "} - Security Code Clearance Failed. Make sure comms are on and subspace channels are correct.*"
				goto :wait_for_command
			:loggedin
				gosub :killthetriggers
				send "'{" & $bot_name & "} - Security Code Clearance Confirmed!*"
				goto :wait_for_command
goto :wait_for_command
# ============================== END LOGIN (login) Sub ==============================
#=============================== SS SCANNING =============================================
:slist
	setVar $scan_macro "x** * "
	goto :start_scan
:holo
	setVar $scan_macro " sh"
	goto :start_scan
:dscan
	setVar $scan_macro " sd"
	goto :start_scan
:disp
	setVar $scan_macro "d"
	goto :start_scan
:start_scan
	gosub :current_prompt
	setArray $scan_array 1000
	setVar $startingLocation $CURRENT_PROMPT
	if ($scan_macro = "") OR ($scan_macro = 0)
		setVar $scan_macro " sd* "
	end
	setVar $validPrompts "Citadel Command"
	gosub :checkStartingPrompt
	if ($startingLocation = "Citadel")
		if ($scan_macro = "d")
			setVar $scan_macro "s"
		else
			send " q "
			gosub :getPlanetInfo
			send " q "
		end
	end
	setVar $idx 0
	setTextLineTrigger noscanner_1 :no_scanner_available1 "You don't have a long range scanner."
	send $scan_macro
	if ($scan_macro = "d")
		waitOn "<Re-Display>"
	elseif ($scan_macro = "s")
		waitOn "<Scan Sector>"
	elseif ($scan_macro = " sd")
		setTextLineTrigger noScanner_2 :no_scanner_available2 "Relative Density Scan"
		waiton "Select (H)olo Scan or (D)ensity Scan or (Q)uit? [D] D"
		killTrigger noScanner_1
		killTrigger noScanner_2
	elseif ($scan_macro = "x** * ")
		waitOn "Ship  Sect Name                  Fighters Shields Hops Type"
		waitOn "--------------------------------------------------------------------------"
	else
		waitOn "Select (H)olo Scan or (D)ensity Scan or (Q)uit? [D] H"
	end
	if ($scan_macro = "s")
		setTextTrigger end_of_line2 :end_of_lines "Citadel command (?=help)"
		setTextTrigger end_of_line3 :end_of_lines "Mined Sector: Do you wish to Avoid this sector in the future? (Y/N)"
	elseif ($scan_macro = "x** * ")
		setTextTrigger end_of_line4 :end_of_lines "<I> Ship details"
		add $idx 1
		setVar $scan_array[$idx] "                 --<  Available Ship Scan  >--"
		add $idx 1
		setVar $scan_array[$idx] "Ship  Sect Name                  Fighters Shields Hops Type"
		add $idx 1
		setVar $scan_array[$idx] "----------------------------------------------------------------------"
	else
		setTextTrigger end_of_line1 :end_of_lines "Command [TL="
	end

	setTextLineTrigger line_trig :parse_scan_line
	pause
	:parse_scan_line
		setVar $current_line CURRENTLINE
		if ($idx >= 1000)
		        goto :end_of_lines
		end
		if ($scan_macro = "s") OR ($scan_macro = "d")
			if ($idx = 0)
				setVar $current_line "-=-=-=-=-=-=-=-=-=-=-=-=-=| Display |=-=-=-=-=-=-=-=-=-=-=-=-=-"
			end
			getWordPos $current_line $pos1 "Citadel treasury contains"
			getWordPos $current_line $pos2 "(?=Help)? :"
			getWordPos $current_line $pos3 "<Re-Display>"
			if ($pos1 < 1) AND ($pos2 < 1) AND ($pos3 < 1)
		             if ($current_line = "") OR ($current_line = 0)
			     elseif ($idx >= 5000)
	                     else
	                            add $idx 1
		              	    replaceText $current_line "Warps to Sector(s) :  " "Warps To: "
		                    replaceText $current_line "Warps to Sector(s) : " "Warps To: "
		                    setVar $scan_array[$idx] $current_line
	    		     end
			end
		elseif ($scan_macro = "x** * ")
			getWordPos $current_line $em_end "(?=Help)? :"
			if ($em_end > 0)
			        goto :end_of_lines
			end
			getWordPos $current_line $em_end "<I> Ship details"
			if ($em_end > 0)
				goto :end_of_lines
			end
			getLength $current_line $length
			if ($length > 70)
				cutText $current_line $current_line 1 70
			end
			if ($current_line <> "")
				add $idx 1
				setVar $scan_array[$idx] $current_line
			end
		else
			getWordPos $current_line $em_end "(?=Help)? :"
			if ($em_end > 0)
		        goto :end_of_lines
			end
		        getWordPos $current_line $pos "One turn deducted,"
	    		if ($pos > 0)
	        	   setVar $current_line "-=-=-=-=-=-=-=-=-=-=-=-=-| Holo Scan |-=-=-=-=-=-=-=-=-=-=-=-=-"
	    		end
	    		getWordPos $current_line $pos "Relative Density Scan"
	    		if ($pos > 0)
	        	  	setVar $current_line "-=-=-=-=-=-=-=-=-=-| Relative Density Scan |-=-=-=-=-=-=-=-=-=-"
				end
	    		if ($current_line = "") OR ($current_line = 0)
	        	  	goto :bogus
	    		end
	    		getWordPos $current_line $pos "Sector  :"
	    		if ($pos > 0)
	        	  	add $idx 1
	        	  	setVar $scan_array[$idx] "    "
				end
	    		getWordPos $current_line $pos1 "-------"
	    		getWordPos $current_line $pos2 "Long Range Scan"
	    		getWordPos $current_line $pos3 "Select (H)olo Scan or (D)ensity Scan or (Q)uit?"
	    		getWordPos $current_line $pos4 "<Mine Control>"
	    		getWordPos $current_line $pos5 "(?=Help)? :"
	    		if ($pos1 < 1) AND ($pos2 < 1) AND ($pos3 < 1) AND ($pos4 < 1) AND ($pos5 < 1)
          	        replaceText $current_line "Warps to Sector(s) :  " "Warps To: "
	        	   	replaceText $current_line "Warps to Sector(s) : " "Warps To: "
	        	   	replaceText $current_line " ==>    " " => "
	        	   	replaceText $current_line "  Warps : " "  Warps: "
	        	   	replaceText $current_line "   NavHaz :   " " Haz: "
	        	   	replaceText $current_line "  Anom : " " Anom: "
	        	   	add $idx 1
	        	   	setVar $scan_array[$idx] $current_line
	    		end
		    	:bogus
		end
		setTextLineTrigger line_trig :parse_scan_line
		pause
	:end_of_lines
		gosub :killthetriggers
		if ($startingLocation = "Citadel")
			if ($scan_macro = "d") OR ($scan_macro = "s")
				send "* "
			else
				send " l " & $PLANET & "* c s* "
			end
		end
		gosub :spitItOut
		goto :wait_for_command
	:no_scanner_available1
		send "'{" $bot_name "} - No scanner available.** "
		goto :wait_for_command
	:no_scanner_available2
		setVar $current_line "-=-=-=-=-=-=-=-=-=-| Relative Density Scan |-=-=-=-=-=-=-=-=-=-"
		add $idx 1
		setVar $scan_array[$idx] $current_line
		setTextLineTrigger line_trig :parse_scan_line
		pause

	:handle_mines
		send "*"
		goto :end_of_lines
:pscan
	setArray $scan_array 30
	gosub :quikstats
	setVar $Location $CURRENT_PROMPT
	setVar $planet 0
	isNumber $test $parm1
	if (($Location = "Citadel") OR ($Location = "Planet"))
		if ($Location = "Citadel")
			send "Q  "
		end
		if (($parm1 <> "0") AND ($test = TRUE))
			gosub :getPlanetInfo
			send "  Q  "
			setVar $LandOn $parm1
			gosub :do_pscan
			setVar $LandOn $Planet
			gosub :Land_OnPlanet
		else
			waitfor "Planet command"
			gosub :start_pscan
		end
		if ($Location = "Citadel")
			send " C  "
		end
	elseif ($Location = "Command")
		if (($parm1 = "0") OR ($test = FALSE))
			send "'{" $bot_name "} PScan - If Starting From Sector Please Specify Planet Number.*"
			goto :wait_for_command
		end
		setVar $LandOn $parm1
		gosub :do_pscan
	else
		send "'{" & $bot_name & "} PScan - Please Start from Command, Citadel, or Planet Prompt*"
	end
	if ($gotScan)
		gosub :SpitItOut
	end
	goto :wait_for_command
:start_pscan
	setVar $idx 0
	send "D"
	:continuepscan
		setTextTrigger done :pscan_done "Planet command"
		setTextLineTrigger line_trig :parse_pscan_line
		pause
	:parse_pscan_line
		killTrigger line_trig
		setVar $s CURRENTLINE
		if (($s = "") OR ($s = 0))
			setVar $s "          "
		end
		getWordPos $s $pos "Fuel Ore"
		gosub :doPscanText
		getWordPos $s $pos "Organics"
		gosub :doPscanText
		getWordPos $s $pos "Equipment"
		gosub :doPscanText
		getWordPos $s $pos "Fighters "
		gosub :doPscanText
		replacetext $s "  Item    Colonists  Colonists    Daily     Planet      Ship      Planet" "Item  Colonists Colonists    Daily     Planet    Planet"
		replaceText $s "           (1000s)   2 Build 1   Product    Amount     Amount     Maximum"  "       (1000s)  2 Build 1   Product    Amount    Maximum"
		replaceText $s " -------  ---------  ---------  ---------  ---------  ---------  ---------" "---  ---------  ---------  ---------  ---------  ---------"
		replaceText $s "Fuel Ore" "Ore"
		replaceText $s "Organics" "Org"
		replaceText $s "Equipment" "Equ "
		replaceText $s "Fighters " "Figs"
		replaceText $s "Military reaction" "Mil-React"
		add $idx 1
		setVar $scan_array[$idx] $s
		setTextLineTrigger line_trig :parse_pscan_line
		pause
	:pscan_done
		gosub :killthetriggers
		setVar $gotScan TRUE
return
:doPscanText
	if ($pos <> 0)
		CutText $s $s_temp1 1 53
		CutText $s $s_temp2 65 75
		setVar $s ($s_temp1 & $s_temp2)
	end
return
:do_pscan
	gosub :Land_OnPlanet
	if ($LANDED)
		gosub :start_pscan
		setVar $gotScan TRUE
	else
		send " Q  Q  Q  Z  N  *  L Z"&#8&$Planet&"*  *  J  C  *  "
		send "'{" $bot_name "} PScan - Problem landing on Planet #"&$parm1&".*"
		setVar $gotScan FALSE	
	end
	send " Q  Q  Q  Z  N  *  "
return
:SpitItOut
	setVar $i 1
	getWordPos $user_command_line $pos "fed"
	if ($pos > 0)
		send "`*"
	else
		send "'*"
	end
	if ($pos > 0)
		setTextLineTrigger comm :continuecommpscan "Federation comm-link established, Captain."
	else
		setTextLineTrigger comm :continuecommpscan "Comm-link open on sub-space band"
	end
	pause
	:continuecommpscan
	while ($i <= $idx)
    		if ($scan_array[$i] <> "0")
    			send $scan_array[$i] & "*"
		end
		add $i 1
	end
	send "*  "
	if ($pos > 0)
		setTextLineTrigger comm3 :continuecommpscan2 "Federation comm-link terminated."
	else
		setTextLineTrigger comm3 :continuecommpscan2 "Sub-space comm-link terminated"
	end
	pause
	:continuecommpscan2
return
:Land_OnPlanet
	setVar $LANDED FALSE
	send ("L"&$LandOn&"*Z  N  Z  N  *  ")
	setTextLineTrigger NoPlanet1	:NoPlanet	"There isn't a planet in this sector."
	setTextLineTrigger NoPlanet2	:NoPlanet	"That planet is not in this sector."
	setTextLineTrigger NotLanded 	:NotLanded	"since it couldn't possibly stand"
	setTextLineTrigger Landed		:Landed		"Planet #"
	pause
	:NoPlanet
		gosub :killthetriggers
		send ("'{" & $bot_name & "} - Planet #" & $LandOn & ", not in Sector!*")
		return
	:NotLanded
		gosub :killthetriggers
		send ("'{" & $bot_name & "} - This ship cannot land!*")
		return
	:Landed
		gosub :killthetriggers
		setVar $LANDED TRUE
		waitfor "<Destroy Planet>"
		waitfor "Planet command"
		return
#================================ END SS SCANNER =======================================	
#============================== START TOPOFF (TOPOFF) ==============================
:topoff
	gosub :killthetriggers
	gosub :current_prompt
	setVar $validPrompts "Citadel Command"
	gosub :checkStartingPrompt
	if ($startingLocation = "Citadel")
		send " q "
		gosub :getPlanetInfo
		send " q "
	end
	if ($parm1 <> "o") AND ($parm1 <> "t") AND ($parm1 <> "d")
		setVar $type "d"
		isNumber $test CURRENTSECTOR
		if ($test = TRUE)
			if ((CURRENTSECTOR > 0) AND (CURRENTSECTOR <= SECTORS))
				setVar $type SECTOR.FIGS.TYPE[CURRENTSECTOR]
				if ($type = "Offensive")
					setVar $type "o"
				elseif ($type = "Defensive")
					setVar $type "d"
				elseif ($type = "Toll")
					setVar $type "t"
				else
					setVar $type "d"
				end
			end
		end
		setVar $parm1 $type
	end
	setVar $to_drop $parm1
	gosub :do_topoff
	if ($startingLocation = "Citadel")
		gosub :landingSub
	end
	send "'{" $bot_name "} - TopOff complete Left " & $ftrs_to_leave " fighters.*"
	goto :wait_for_command
:do_topoff
	:do_topoff_again
		gosub :killthetriggers
		send " F"
		waitOn "Your ship can support up to"
		getWord CURRENTLINE $ftrs_to_leave 10
		stripText $ftrs_to_leave ","
		stripText $ftrs_to_leave " "
		if ($ftrs_to_leave < 1)
			setVar $ftrs_to_leave 1
		end
		send " " & $ftrs_to_leave & " * C " & $to_drop
		setTextLineTrigger topoff_success :topoff_success "Done. You have "
		setTextLineTrigger topoff_failure1 :do_topoff_again "You don't have that many fighters available."
		setTextLineTrigger topoff_failure2 :do_topoff_again "Too many fighters in your fleet!  You are limited to"
		pause
	:topoff_success
return
#============================== END TOPOFF (TOPOFF) ==============================
# ============================== CLEAR BUSTS ==================================
:clearbusts
	delete $BUST_FILE
	setVar $i 1
	while ($i <= SECTORS)
		setSectorParameter $i "BUSTED" FALSE
		add $i 1
	end
	setVar $message "Bust file for this bot has been cleared.*"
	gosub :switchboard
	goto :wait_for_command
# ============================== END CLEAR BUSTS ==============================
:mega
	setVar $isMega TRUE
:rob
	gosub :quikstats
	setVar $validPrompts "Citadel Command"
	gosub :checkStartingPrompt
	cutText $ALIGNMENT $neg_ck 1 1
	stripText $ALIGNMENT "-"
	if ((($ALIGNMENT < 100) and ($neg_ck = "-")) OR ($neg_ck <> "-"))
		send "'{" $bot_name "} - Need -100 Alignment Minimum*"
		goto :portrm_done
	end
	if ($startingLocation = "Citadel")
		send "q"
		gosub :getPlanetInfo
		send "q"
	end
	setVar $second_mega 0
	setvar $leftover_cash 0
	setVar $mega_min 2970000
	setVar $mega_max 5760000
	send "p r * r"
	setTextLineTrigger fake :port_fake "Busted!"
	setTextLinetrigger mega :port_ok "port has in excess of"
	pause
:port_fake
	gosub :killthetriggers
	if ($startingLocation = "Citadel")
		gosub :landingSub
	end
	send "'{" $bot_name "} - Fake Busted*"
	goto :portrm_done
:port_ok
	gosub :killthetriggers
	setVar $rob ($rob_factor*$EXPERIENCE)
	getWord CURRENTLINE $port_cash 11
	stripText $port_cash ","
	if ($port_cash < $mega_min)
		if ($isMega)
			setVar $port_cash (($port_cash*10)/9)
			setVar $mega_short (3300000 - $port_cash)
			send "0* "
			if ($startingLocation = "Citadel")
				gosub :landingSub
			end
			send "'{" $bot_name "} - Port is short " $mega_short " credits*"
			goto :portrm_done
		else
			goto :do_rob		
		end
	elseif (($MBBS = TRUE) AND ($isMega = FALSE))
		send "'{" $bot_name "} - " $port_cash " credits on port.  Port is ready for Mega Rob**"
		if ($startingLocation = "Citadel")
			gosub :landingSub
		end
		goto :portrm_done
	else
		if ($isMega)
			setVar $actual_cash $port_cash
			multiply $actual_cash 10
			divide $actual_cash 9
			setVar $mega_cash $actual_cash
			if ($actual_cash >= 3300000)
				:mega_loop
					if ($mega_cash > 6400000)
						subtract $mega_cash 3300000
						add $leftover_cash 3300000
						setVar $second_mega 1
						goto :mega_loop
					end
					if ($second_mega = 0)
						send $actual_cash "*"
					elseif ($second_mega = 1)
						send $mega_cash "*"
						setVar $actual_cash $mega_cash
					end
			end
			setTextLineTrigger mega_suc :port_suc "Success!"
			setTextLineTrigger mega_bust :port_bust "Busted!"
			pause
		else
			goto :do_rob
		end
	end
:port_bust
	gosub :killthetriggers
	if ($startingLocation = "Citadel")
		gosub :landingSub
	end
	send "'{" $bot_name "} - Busted*"
	goto :portrm_done
:port_suc
	gosub :killthetriggers
	if ($startingLocation = "Citadel")
		gosub :landingSub
		send "tt" $actual_cash "*"
	end
	send "'{" $bot_name "} - Success! - " $actual_cash " credits robbed*"
	if ($second_mega = TRUE)
		send "'{" $bot_name "} - There are " $leftover_cash " credits left for a second mega*"
	end
:portrm_done
	setVar $isMega FALSE
	goto :wait_for_command
:do_rob
	setVar $port_cash (($port_cash*10)/9)
	if ($port_cash < $rob)
		setVar $rob $port_cash
	end
	send $rob "*"
	setVar $actual_cash $rob
	setTextLineTrigger port_empty :port_suc "Maybe some other day, eh?"
	setTextLineTrigger mega_suc :port_suc "Success!"
	setTextLineTrigger port_bust :port_bust "Busted!"
	pause
#============================== START PING SUB =====================================
:ping		
	setVar $pings 0
	loadVar $total_pings
	if ($total_pings = 0)
	    setVar $total_pings 4
	    saveVar $total_pings
	end
	setVar $total_ping_times 0
	setVar $ping_delay 500

	send "'*{" $bot_name "} - *"
	waitOn "Type sub-space message"

	:send_pings
		setDelayTrigger ping_delay :ping_delay $ping_delay
		pause
	:ping_delay
		add $pings 1
		if ($pings <= $total_pings)
		        getTime $start_time "ss zzz"
		        send "ping "
		        waitOn "S: ping"
		        getTime $stop_time "ss zzz"
		        getWord $start_time $start_sec 1
		        getWord $start_time $start_ms 2
		        getWord $stop_time $stop_sec 1
		        getWord $stop_time $stop_ms 2

		        if ($stop_sec < $start_sec)
		            add $stop_sec 60
		        end
		        setVar $sec_diff $stop_sec
		        subtract $sec_diff $start_sec
		        multiply $sec_diff 1000
		        add $stop_ms $sec_diff
		        setVar $ping $stop_ms
		        subtract $ping $start_ms
		        add $total_ping_times $ping
		        send $ping & "*"
		        goto :send_pings
		end
		send "*"
		waitOn "Sub-space comm-link terminated"
		divide $total_ping_times $total_pings
		send "'{" $bot_name "} - avg ping - " & $total_ping_times & "*"
goto :wait_for_command
#============================== END PING SUB =====================================
#============================== XPORT (XPORT) ==============================
:x
:xport
	gosub :killthetriggers
	gosub :quikstats

	if ($UNLIMITEDGAME = 0) AND ($TURNS < 1)
		send "'{" $bot_name "} - Don't have any turns left!"
		goto :wait_for_command
	end
	setVar $startingLocation $CURRENT_PROMPT
	setVar $validPrompts "Citadel Command Planet"
	gosub :checkStartingPrompt
	isNumber $result $parm1
	isNumber $safeship_result $safe_ship
	if ($result < 1)
		send "'{" $bot_name "} - xport [ship number] [password]*"
		goto :wait_for_command
	end
	if (($parm1 < 1) AND ($safeship_result >= 1))
		if ($safe_ship > 0)
			setVar $parm1 $safe_ship
		else
			send "'{" $bot_name "} - Safeship parameter not defined correctly.*"
			goto :wait_for_command
		end
	end
	if ($startingLocation = "Citadel")
		if ($PLANET = 0)
			send " q "
			gosub :getPlanetInfo
			send " q "
		else
			send "qq   "
		end
	elseif ($startingLocation = "Planet")
		if ($PLANET = 0)
			gosub :getPlanetInfo
		end
		send " q "
	else
		setVar $planet 0
	end
	setTextLineTrigger bad_ship_trig 	:ship_not_available 	"That is not an available ship."
	setTextLineTrigger bad_range_trg 	:out_of_range 			"only has a transport range of"
	setTextLineTrigger cannot_xport  	:cannot_xport 			"Access denied!"
	setTextTrigger xport_passw   		:xport_password 	  	"Enter the password for"
	setTextLineTrigger xport_good    	:xport_good 			"Security code accepted, engaging transporter control."
	if ($parm2 = "0")
		send "x   " & $parm1 & "*    "
	else
		send "x  " & $parm1 & "*"
	end
	pause

:ship_not_available
	setVar $Message "That ship is not available.*"
	goto :out_of_xport
:out_of_range
	setVar $Message "That ship is out of range.*"
	goto :out_of_xport
:xport_good
	setVar $Message "Xport complete.*"
	if ($command = "x")
		setVar $safe_ship $SHIP_NUMBER
		echo "*" ANSI_14 "[" ANSI_15 "Safe ship auto-set to last ship: " $SHIP_NUMBER ANSI_14 "]*" ANSI_7
	end
	goto :out_of_xport
:xpass_bad
	setVar $Message "Incorrect ship password!*"
	waitfor "Choose which ship to beam to"
	goto :out_of_xport
:cannot_xport
	setVar $Message "Cannot xport to that ship!*"
	goto :out_of_xport
:xport_password
	gosub :killthetriggers
	setTextLineTrigger xport_ok  :xport_good "Security code accepted, engaging transporter control."
	setTextLineTrigger xpass_bad :xpass_bad "SECURITY BREACH! Invalid Password, unable to link transporters."
	send $parm2 & "*   "
	pause
:out_of_xport
	gosub :killthetriggers
	send "    *    "
	if ((($startingLocation = "Citadel") OR ($startingLocation = "Planet")) AND $PLANET <> 0)
		gosub :landingSub
	end
	echo "**"
	gosub :SwitchBoard
	goto :wait_for_command
#============================== END XPORT (XPORT) SUB ==============================
#============================== MAX PORT ==============================
:maxport
:max
	gosub :killthetriggers
	gosub :quikstats
	setVar $startingLocation $CURRENT_PROMPT
	setVar $validPrompts "Citadel Command Planet"
	gosub :checkStartingPrompt
	if ($parm1 <> "f") AND ($parm1 <> "o") AND ($parm1 <> "e")
		send "'{" $bot_name "} - maxport [f/o/e] noexp*"
		goto :wait_for_command
	end
	setVar $total_creds_needed 0
	if ($startingLocation = "Planet") OR ($startingLocation = "Citadel")
		if ($startingLocation = "Citadel")
			send "q"
		end
		gosub :getPlanetInfo
		if ($CITADEL > 0)
			send "cs* cr*q"
			waitOn "<Enter Citadel>"
			waitOn "Fuel Ore"
			getWord CURRENTLINE $portFuel 4
			getWord CURRENTLINE $portFuelPercent 5
			stripText $portFuelPercent "%"
			waitOn "Organics"
			getWord CURRENTLINE $portOrg 3
			getWord CURRENTLINE $portOrgPercent 4
			stripText $portOrgPercent "%"
			waitOn "Equipment"
			getWord CURRENTLINE $portEquip 3
			getWord CURRENTLINE $portEquipPercent 4
			stripText $portEquipPercent "%"
			if ($portEquipPercent <= 0)
				setVar $portEquipPercent 1
			end
			if ($portOrgPercent <= 0)
				setVar $portOrgPercent 1
			end
			if ($portFuelPercent <= 0)
				setVar $portFuelPercent 1
			end
			setVar $totalFuelUpgradeNeeded  (($port_max - (($portFuel*100)/$portFuelPercent))/10)+1
			setVar $totalOrgUpgradeNeeded   (($port_max - (($portOrg*100)/$portOrgPercent))/10)+1
			setVar $totalEquipUpgradeNeeded (($port_max - (($portEquip*100)/$portEquipPercent))/10)+1
			if ($parm1 = "f")
				setVar $total_creds_needed 300*$totalFuelUpgradeNeeded
			elseif ($parm1 = "o")
				setVar $total_creds_needed 500*$totalOrgUpgradeNeeded
			else
				setVar $total_creds_needed 1000*$totalEquipUpgradeNeeded
			end
			if ($total_creds_needed > $CREDITS)
				setVar $cashonhand $CITADEL_CREDITS
				add $cashonhand $CREDITS
				if ($cashonhand > $total_creds_needed)
				        if ($startingLocation = "Planet")
						send "C"
	        			end
					send "T T " & $CREDITS & "* "
			        	send "T F " & $total_creds_needed & "* "
			        	setVar $CREDITS $total_creds_needed
	        			send "'{" $bot_name "} - Withdrew funds from the Treasury to complete the port max*"
	    			end
			end
			send "q q"
		else
			send "q"
		end
	end
	if ($parm2 = "noexp")
		setVar $no_exp TRUE
	else
		setVar $no_exp FALSE
	end
	if ($parm1 = "f")
		setVar $product 1
		setVar $noExpAmount 9
	end
	if ($parm1 = "o")
		setVar $product 2
		setVar $noExpAmount 4
	end
	if ($parm1 = "e")
		setVar $product 3
		setVar $noExpAmount 3
	end
	gosub :doMaxPort
	if (($startingLocation = "Citadel") OR ($startingLocation = "Planet"))
		gosub :landingSub
	end
	send "'{" $bot_name "} - Port upgrade complete.*"
	goto :wait_for_command
#============================== END MAX PORT SUB ==============================
:doMaxPort
	send "o " $product "0* "
	setTextLineTrigger noRealPortHere :doneMaxPort "Do you want to initiate construction on this port?"
	waitOn ", 0 to quit)"
	gosub :killthetriggers
	getWord CURRENTLINE $upgradeAmount 9
	stripText $upgradeAmount "("
	send "o "
	if ($no_exp)
		while ($upgradeAmount > 0)
			if ($upgradeAmount > 3)
				send $product " " $noExpAmount "* "
				subtract $upgradeAmount $noExpAmount
			else
				send $product " " $upgradeAmount "* "
				subtract $upgradeAmount $upgradeAmount
			end
		end
		send "* * "
	else
		send $product " " $upgradeAmount "* * "
	end
	send "CR*Q"
	waitOn "<Computer deactivated>"	
	:doneMaxPort
	gosub :killthetriggers
return
# ======================     START PLANET GRID (PGRID) SUBROUTINE    ==========================
:pgrid
	gosub :quikstats
	setVar $startingLocation $CURRENT_PROMPT
	setVar $startingPgridSector $CURRENT_SECTOR
	setVar $startingShip $SHIP_NUMBER
	setVar $validPrompts "Citadel Command"
	gosub :checkStartingPrompt
	if ($startingLocation = "Citadel")
		setVar $inCitadel "Q Q "
	else
		setVar $inCitadel ""
	end
	getWordPos " "&$user_command_line&" " $pos "scan"
	if ($pos > 0)
		setVar $doDensityScan TRUE
	else
		setVar $doDensityScan FALSE
	end
	getWordPos " "&$user_command_line&" " $pos " x:"
	if ($pos > 0)
		getText $user_command_line $xportShip "x:" " "
		isNumber $test $xportShip
		if ($test)
			setVar $xporting TRUE
		else
			send "'{" $bot_name "} - Invalid xport ship entered*"
			goto :wait_for_command
		end		
	else
		setVar $xporting FALSE
	end
	getWordPos " "&$user_command_line&" " $pos " r "
	if ($pos > 0)
		setVar $retreating TRUE
	else
		setVar $retreating FALSE
	end
	setVar $pgridSector $parm1
	isNumber $test $pgridSector
	if ($test = 0)
		send "'{" $bot_name "} - Invalid PGRID number.*"
		goto :wait_for_command
	end
	isNumber $test $parm2
	if ($test = 0)
		setVar $waveCount 1
	else
		if ($parm2 > 0)
			setVar $waveCount $parm2
		else
			setVar $waveCount 1
		end
	end
	if ($pgridSector = 0)
		send "'{" $bot_name "} - Invalid PGRID number.*"
		goto :wait_for_command
	end
	if ($pgridSector < 11)
		send "'{" $bot_name "} - Cannot PGRID into FedSpace!*"
		goto :wait_for_command
	elseif ($pgridSector = $STARDOCK)
		send "'{" $bot_name "} - Cannot PGRID into STARDOCK!*"
		goto :wait_for_command
	end
	if ($startingLocation = "Citadel")
		send "q"
		gosub :getPlanetInfo
		send "c "
	end
	if ($SHIP_MAX_ATTACK <= 0)
		gosub :getShipStats
	end
	setVar $i 1
	setVar $isFound false
	while (SECTOR.WARPS[$current_Sector][$i] > 0)
		if (SECTOR.WARPS[$current_Sector][$i] = $pgridSector)
			setVar $isFound TRUE
		end
		add $i 1
	end
	if ($isFound = FALSE)
		send "'{" $bot_name "} - Cannot PGRID.  Sector "&$pgridsector&" not Adjacent, aborting..*"
		goto :wait_for_command
	end	
	send "'{" $bot_name "} - Planet gridding into sector " & $pgridSector & "* c v* y* "&$pgridSector&"* q "
	setVar $mac "     * "
	if ($waveCount <= 0)
		setVar $waveCount 1
	end
	if ($FIGHTERS < $SHIP_MAX_ATTACK)
		setVar $mac $mac&"a z " & ($FIGHTERS-1)&"9999" & "* * "
	else
		setVar $i 1
		while (($i <= $waveCount) AND ($FIGHTERS >= $SHIP_MAX_ATTACK))
			setVar $mac $mac&"a z " & ($SHIP_MAX_ATTACK-1)&"9999" & "* * "
			add $i 1
			subtract $FIGHTERS ($SHIP_MAX_ATTACK-1)
		end
	end
	setVar $mac $mac & "j r * f  z  1  * z  c  d  * "
	setVar $previousPlanetsInSector SECTOR.PLANETCOUNT[$CURRENT_SECTOR]
	if ($doDensityScan = TRUE)
		send "s* "
	end
	if (($SCAN_TYPE <> "None") AND ($doDensityScan = TRUE))
		:density_scanning
			setVar $tempDensity SECTOR.DENSITY[$pgridsector]
			setVar $pgridDensity "-99"
			send "q q sdz* l " $PLANET "* c  "
			waitOn "Relative Density Scan"
			setTextLineTrigger denscheck  :getDensityPgrid " "&$pgridSector&"  ==>"
			setTextLineTrigger denscheck2 :getDensityPgrid2 " "&$pgridSector&") ==>"
			setTextLineTrigger denscheck3 :getDensityPgrid "("&$pgridSector&") ==>"
			setTextLineTrigger denscheckdone :doneDensityCheck "<Enter Citadel>"
			pause
		:getDensityPgrid
			killtrigger denscheck
			killtrigger denscheck3
			killtrigger denscheck2
			getWord CURRENTLINE $pgridDensity 4
			stripText $pgridDensity ","
			pause
		:getDensityPgrid2
			killtrigger denscheck
			killtrigger denscheck3
			killtrigger denscheck2
			getWord CURRENTLINE $pgridDensity 5
			stripText $pgridDensity ","
			pause
		:doneDensityCheck
			gosub :bigdelay_killthetriggers
			if ($tempDensity <> "-1")
				if ($pgridDensity = "-99")
					setVar $message "Last Density Scan was not correctly grabbed, cannot safely continue.*"
					gosub :switchboard
					goto :wait_for_command
				elseif ($pgridDensity > $tempDensity)
					setVar $message "Density increased since last scan in sector "&$pgridsector&". ("&$pgridDensity&")*"
					gosub :switchboard
					goto :wait_for_command
				end
			else
				setVar $message "You must density scan sector "&$pgridsector&" at least once before pgridding.*"
				gosub :switchboard
				goto :wait_for_command
			end
	end	
	setVar $newPlanetsInSector SECTOR.PLANETCOUNT[$CURRENT_SECTOR]
	if (($previousPlanetsInSector < $newPlanetsInSector) AND ($newPlanetsInSector > 1))
		setVar $message "Planet number increased since last scan in this sector. Try again to override.*"
		gosub :switchboard
		goto :wait_for_command
	end
	if ($retreating)
		send $inCitadel & "m " & $pgridSector & $mac & "< n n n * "
		if ($PLANET > 0)
			send "l j" & #8 & $PLANET & "*  *  "
		end
		gosub :quikstats
		if (($CURRENT_SECTOR <> $startingPgridSector))
			send "'" & $pgridSector & "=saveme* "
			gosub :emergencyLanding
			send "'{" $bot_name "} - Unsuccessful retreat from sector " & $pgridSector & ". Attempted saveme call.*"
		else
			if ($CURRENT_PROMPT = "Planet")
				send "m * * * c p "&$pgridsector&"* y s* "
			end
			gosub :quikstats
			if ($CURRENT_SECTOR = $pgridsector)
				send "'{" $bot_name "} - Successfully P-gridded into sector " & $pgridSector & "*"
				setVar $target $pgridSector
				gosub :addFigToData
			else
				send "'{" $bot_name "} - No fighter deployed in sector " & $pgridSector & "*"
			end
		end
	else
		setVar $pgridString "'" & $pgridSector & "=saveme* " & $inCitadel & "m " & $pgridSector & $mac
		if ($xporting)
			setVar $pgridString $pgridString & "x   "&$xportship&"* * "  
		end
		send $pgridString
		if ($xporting)
			gosub :quikstats
			if ($SHIP_NUMBER = $startingShip)
				gosub :emergencyLanding
				send "'{" $bot_name "} - Unsuccessful xport out of sector " & $pgridSector & ". Ship too far away or I was photoned.*"	
			else
				if ($CURRENT_SECTOR = $startingPgridSector)
					gosub :emergencyLanding
					send "'{" $bot_name "} - Unsuccessful pgrid unless xport ship was in starting sector. Currently in xport ship.*"
				else
					getrnd $xdelay 500 2000
					setDelayTrigger waitPgridXport :goPgridXport $xdelay
					pause
					:goPgridXport
						send "x   "&$startingShip&"* * l j" & #8 & $PLANET & "*  *  " 
						gosub :quikstats
						if ($CURRENT_PROMPT = "Planet")
							send "m * * * c s* "
						end
						if ($SHIP_NUMBER <> $startingShip)
							send "'{" $bot_name "} - Gridding ship not available for re-export.  Bot is in safe ship.*"	
						else
							send "'{" $bot_name "} - Successfully P-gridded w/xport into sector " & $pgridSector & "*"
						end
				end
			end
		else
			gosub :emergencyLanding
			gosub :quikstats
			if (($CURRENT_SECTOR <> $pgridSector))
				send "'{" $bot_name "} - Unsuccessful P-grid into sector " & $pgridSector & ". Someone make sure bot is picked up.*"
			else
				send "'{" $bot_name "} - Successfully P-gridded into sector " & $pgridSector & "*"
				setVar $target $pgridSector
				gosub :addFigToData
			end
		end
	end
	goto :wait_for_command
:emergencyLanding
	setVar $i 0
	while ($i < 30)
		add $i 1
		send "l j" & #8 & $PLANET & "*  *  "
	end
	gosub :current_prompt
	if ($CURRENT_PROMPT = "Planet")
		send "m * * * c s* "
	end
return
# ======================     END PGRID (PGRID) SUBROUTINE     ==========================
#===============================START HTORP (HTORP) =================================
:htorp
	gosub :killthetriggers
	gosub :quikstats
	if ($SCAN_TYPE <> "Holo")
		send "'{" $bot_name "} - You can not run htorp without a holographic scanner.*"
		goto :wait_for_command
	end
	setVar $startingLocation $CURRENT_PROMPT
	if ($startingLocation = "Command")
	
	elseif ($startingLocation = "Citadel")
		send "q "
		gosub :getPlanetInfo
	else
		echo "*Wrong prompt for htorp.*"
		goto :wait_for_command
	end
	if ($startingLocation = "Citadel")
		send "q szh* l "&$PLANET&"* c "
	else
		send "szh* "
	end
	setTextLineTrigger checkForHolo :continueCheckHolo "Select (H)olo Scan or (D)ensity Scan or (Q)uit?"
	setTextLineTrigger checkForDens :photonedhtorp "Relative Density Scan"	
	pause
	:continueCheckHolo
		setTextTrigger htorpsector :continuehtorpsector "[" & $CURRENT_SECTOR & "]"
		pause
	:continuehtorpsector
	if ($PHOTONS <= 0)
		echo ANSI_14&"*No Photons on hand.**"&ANSI_7
		goto :wait_for_command
	end
	setVar $i 1
	while (SECTOR.WARPS[$CURRENT_SECTOR][$i] > 0)
		setVar $adj_sec SECTOR.WARPS[$CURRENT_SECTOR][$i]
		if (SECTOR.TRADERCOUNT[$ADJ_SEC] > 0)
			setVar $targetInSector FALSE
			setVar $corpMemberInSector FALSE
			setVar $j 1
			while (SECTOR.TRADERS[$ADJ_SEC][$j] <> 0)
				setVar $tempTarget SECTOR.TRADERS[$ADJ_SEC][$j]
				getLength $tempTarget $targetLength
				if ($targetLength >= 4)
					cutText $tempTarget $targetCorp ($targetLength-4) 999
					getText $targetCorp $targetCorp "[" "]"
					if ($targetCorp <> $CORP)
						setVar $targetInSector TRUE
					end
					if ($targetCorp = $CORP)
						setVar $corpMemberInSector TRUE
					end
				end
				add $j 1
			end
			if (($targetInSector = TRUE) AND ($corpMemberInSector = FALSE))
				send "c p y " $ADJ_SEC "* *q"
				send "'{" $bot_name "} - Photon fired into sector "&$ADJ_SEC&"!*" 
				goto :wait_for_command
			end
		end
		add $i 1
	end
	if ($startingLocation = "Citadel")
		setTextTrigger waitforcit :continuewaitforcit "Citadel command (?=help)"
		pause
		:continuewaitforcit
	end
	echo ANSI_14&"*No valid targets**"&ANSI_7
	goto :wait_for_command
:photonedHtorp
	send "'{" $bot_name "} - You have no holographic scanner, perhaps you were photoned?*"
goto :wait_for_command
#========================== END HTORP SUB ==============================================
#=================================== START MOW (MOW) ============================================
:mow
:m
	gosub :do_mow
	if (($CURRENT_PROMPT = "<StarDock>") OR ($CURRENT_PROMPT = "<Hardware"))
		send "'{" $bot_name "} - Safely on Stardock*"
	end
	if ($CURRENT_SECTOR <> $destination)
		send "'{" $bot_name "} - Mow did not reach destination!*"
	else
		send "'{" $bot_name "} - Mow completed.*"
	end
	goto :wait_for_command
	:getCourse
		setVar $sectors ""
		settextlinetrigger sectorsnogo :sectorsnogo "Error - No route within"
		setTextLineTrigger sectorlinetrig :sectorsline " > "
		send "^f*"&$destination&"*q"
		pause
	:sectorsnogo
		killtrigger sectorlinetrig
		send "n * q"
		send "'Clear Voids and try again!*"
		goto :noPath
		pause
	:sectorsline
		killtrigger sectorlinetrig
		killtrigger sectorlinetrig2
		killtrigger sectorlinetrig3
		killtrigger sectorlinetrig4
		killtrigger donePath
		killtrigger donePath2
		setVar $line CURRENTLINE
		replacetext $line ">" " "
		striptext $line "("
		striptext $line ")"
		setVar $line $line&" "
		getWordPos $line $pos "So what's the point?"
		getWordPos $line $pos2 ": ENDINTERROG"
		if (($pos > 0) OR ($pos2 > 0))
			goto :noPath
		end
		getWordPos $line $pos " sector "
		getWordPos $line $pos2 "TO"
		if (($pos <= 0) AND ($pos2 <= 0))
			setVar $sectors $sectors & " " & $line
		end
		getWordPos $line $pos " "&$destination&" "
		getWordPos $line $pos2 "("&$destination&")"
		getWordPos $line $pos3 "TO"
		if ((($pos > 0) OR ($pos2 > 0)) AND ($pos3 <= 0))
			goto :gotSectors
		else
			setTextLineTrigger sectorlinetrig :sectorsline " > "
			setTextLineTrigger sectorlinetrig2 :sectorsline " "&$destination&" "
			setTextLineTrigger sectorlinetrig3 :sectorsline " "&$destination
			setTextLineTrigger sectorlinetrig4 :sectorsline "("&$destination&")"
			setTextLineTrigger donePath :sectorsline "So what's the point?"
			setTextLineTrigger donePath2 :sectorsline ": ENDINTERROG"
		end
		pause
	:gotSectors
		setVar $sectors $sectors&" :::"
		setVar $courseLength 0
		setVar $index 1
		:keepGoing
		getWord $sectors $mowCourse[$index] $index
		while ($mowCourse[$index] <> ":::")
			add $courseLength 1
			add $index 1
			getWord $sectors $mowCourse[$index] $index
		end
		return
	:noPath
		send "'{" $bot_name "} - No path to that sector, cannot mow!*"
		goto :wait_for_command
:do_mow
		setArray $mowCourse 80
		setVar $called FALSE
		gosub :quikstats
		setVar $startingLocation $CURRENT_PROMPT
		setVar $validPrompts "Command <Underground> Do How Corporate Citadel Planet Computer Terra <StarDock> <FedPolice> <Tavern> <Libram <Galactic <Hardware <Shipyards>"
		gosub :checkStartingPrompt
		if ($startingLocation = "Citadel")
			send "q"
			gosub :getPlanetInfo
			send "c "
		end
		if ($startingLocation = "Command")
			gosub :getShipStats
		elseif ($SHIP_MAX_ATTACK <= 0)
			setVar $SHIP_MAX_ATTACK 99991111
		end
		setVar $destination $parm1
		isNumber $number $destination
		if ($number <> 1)
			send "'{" $bot_name "} - Sector entered is not a number, cannot mow!*"
			goto :wait_for_command
		elseif (($destination <= 0) OR ($destination > SECTORS))
			send "'{" $bot_name "} - Sector entered is not valid, cannot mow!*"
			goto :wait_for_command
		end
		setVar $destination ($parm1+0)
		getWordPos " "&$user_command_line&" " $pos "kill"
		if ($pos > 0)
			setVar $mow_kill TRUE
		else
			setVar $mow_kill FALSE
		end
		getWordPos " "&$user_command_line&" " $pos "saveme"
		if ($pos > 0)
			setVar $mow_saveme TRUE
		else
			setVar $mow_saveme FALSE
		end
		getWordPos " "&$user_command_line&" " $pos " p "
		if ($pos > 0)
			setVar $are_we_docking TRUE
		else
			setVar $are_we_docking FALSE
		end
		setVar $figsToDrop $parm2
		isNumber $number $figsToDrop
		if ($number <> TRUE)
			setVar $figsToDrop 0
		else
			if ($figsToDrop > 50000)
				send "'{" $bot_name "} - Cannot drop more than 50,000 fighters per sector!*"
				goto :wait_for_command
			elseif ($figsToDrop > $FIGHTERS)
				send "'{" $bot_name "} - Fighters to drop cannot exceed total ship fighters.*"
				goto :wait_for_command
			end
		end
		if ($SHIP_MAX_ATTACK > $FIGHTERS)
			setVar $SHIP_MAX_ATTACK 9999
		end
		gosub :getCourse
		setVar $j 2
		setVar $result "q q q * "
		while ($j <= $courseLength)
			setVar $result $result&"m  "&$mowCourse[$j]&"*   "
			if (($mowCourse[$j] > 10) AND ($mowCourse[$j] <> $STARDOCK))
				setVar $result $result&"za  "&$SHIP_MAX_ATTACK&"* *  "
			end
			if (($figsToDrop > 0) AND ($mowCourse[$j] > 10) AND ($mowCourse[$j] <> $STARDOCK) AND ($j > 2))
				setVar $result $result&"f "&$figsToDrop&" * c d "
				setVar $target $mowCourse[$j]
				gosub :addFigToData
			end
			if (($j >= $courselength) AND ($mow_saveme = TRUE) AND ($figstoDrop = 0))
				setVar $result $result&"f 1 * c d "
				setVar $target $mowCourse[$j]
				gosub :addFigToData
			end
			if (($called = FALSE) AND ($mow_saveme = TRUE) AND ($j >= ($courseLength-2)))
				setVar $result $result&"'"&$destination&"=saveme*  "
				setVar $called TRUE
			end
			add $j 1
		end
		setVar $docking_instructions ""
		if ($are_we_docking)
			setVar $docking_instructions " p z t *"
			if ($destination = $stardock)
				setVar $docking_instructions " p z s g y g q h *"
			end
			setVar $result $result & $docking_instructions
		elseif (($mow_saveme = TRUE) AND ($startingLocation = "Citadel"))
			setVar $i 0
			while ($i < 8)
				add $i 1
				#setVar $result $result&"l j" & #8 & $PLANET & "*  *  "
				setVar $result $result&"l j" & #8 & $PLANET & "*  *  j  c  *  *  "
			end
		end
		send $result
		gosub :quikstats
		if (($CURRENT_PROMPT = "Command") AND ($mow_kill = TRUE))
			setVar $startingLocation "Command"
			goSub :getSectorData
			goSub :fastAttack
		elseif ($CURRENT_PROMPT = "Planet")
			send "m * * * c "
			if ($mow_kill = FALSE)
				send "s* "
			else
				setVar $startingLocation "Citadel"
				gosub :scanit_cit_kill
			end
		elseif ($are_we_docking = FALSE)
			send "*"
		end
return
# ======================     END MOW SUBROUTINES     ==========================
:safemow
:smow
	gosub :killthetriggers
	gosub :quikstats
	if ($SCAN_TYPE = "None")
		send "'{" $bot_name "} - Safe Mow can only be run when you have a long range scanner.*"
	        goto :wait_for_command
	end
	setVar $startingLocation $CURRENT_PROMPT
	setVar $validPrompts "Command <Underground> Do How Corporate Citadel Planet Computer Terra <StarDock> <FedPolice> <Tavern> <Libram <Galactic <Hardware <Shipyards>"
	gosub :checkStartingPrompt
	if ($startingLocation = "Command")
		gosub :getShipStats
	elseif ($SHIP_MAX_ATTACK <= 0)
		setVar $SHIP_MAX_ATTACK 99991111
	end
	setVar $destination $parm1
	isNumber $number $destination
	if ($number <> 1)
		send "'{" $bot_name "} - Sector entered is not a number, cannot mow!*"
		goto :wait_for_command
	elseif (($destination <= 0) OR ($destination > SECTORS))
		send "'{" $bot_name "} - Sector entered is not valid, cannot mow!*"
		goto :wait_for_command
	end
	if ($parm2 = "p")
		setVar $are_we_docking TRUE
	else
		if ($parm3 = "p")
			setVar $are_we_docking TRUE
		else
			setVar $are_we_docking FALSE
		end
	end
	setVar $figsToDrop $parm2
	isNumber $number $figsToDrop
	if ($number <> 1)
		if ($parm2 <> "p")
			send "'{" $bot_name "} - Fighters to drop entered is not a number, cannot mow!*"
			goto :wait_for_command
		end
		setVar $figsToDrop 0
	elseif ($figsToDrop > 50000)
		send "'{" $bot_name "} - Cannot drop more than 50,000 fighters per sector!*"
		goto :wait_for_command
	end
	if ($SHIP_MAX_ATTACK > $FIGHTERS)
		setVar $SHIP_MAX_ATTACK 9999
	end
	gosub :getCourse
	setVar $j 3
	setVar $result "q q q * "
	setVar $isSafe TRUE
	while (($j <= $courseLength) AND ($isSafe))
		setVar $nextSafeSector $mowCourse[$j]
		if ($SCAN_TYPE = "Holo")
			send "sdsh"
		elseif ($SCAN_TYPE = "Dens")
			send "sd"
		end
                gosub :quikstats
		setVar $minesSafe ((SECTOR.MINES.QUANTITY[$nextSafeSector] <= 0) OR (((SECTOR.MINES.OWNER[$nextSafeSector] = "yours") OR (SECTOR.MINES.OWNER[$nextSafeSector] = "belong to your Corp"))))
                setVar $figsSafe  ((SECTOR.FIGS.QUANTITY[$nextSafeSector] <= 0) OR (((SECTOR.FIGS.OWNER[$nextSafeSector] = "yours") OR (SECTOR.FIGS.OWNER[$nextSafeSector] = "belong to your Corp"))))
                setVar $planetSafe ((SECTOR.PLANETCOUNT[$nextSafeSector] <= 0) OR (($nextSafeSector = $stardock) OR ($nextSafeSector <= 10)))
                setVar $navHazSafe (SECTOR.NAVHAZ[$nextSafeSector] <= 0)
                setVar $densitySafe (SECTOR.DENSITY[$nextSafeSector] <= 0)
                setVar $limpetsSafe (SECTOR.ANOMOLY[$nextSafeSector] = FALSE) OR ((((SECTOR.LIMPETS.OWNER[$nextSafeSector] = "yours") OR (SECTOR.LIMPETS.OWNER[$nextSafeSector] = "belong to your Corp"))))
                if ($densitySafe OR ($limpetsSafe AND $figsSafe AND $minesSafe AND $navHazSafe AND $planetSafe))
                        send "m "&$mowCourse[$j]&"* "
                else
                        send "'{" $bot_name "} - Cannot safely move into sector "&$nextSafeSector&"*"
                        goto :wait_for_command
                end
		if (($figsToDrop > 0) AND ($mowCourse[$j] > 10) AND ($mowCourse[$j] <> STARDOCK) AND ($j > 2))
			send "f "&$figsToDrop&" * c d "
			setVar $target $mowCourse[$j]
			gosub :addFigToData
		end
		add $j 1
	end
	setVar $docking_instructions ""
	if ($are_we_docking)
		setVar $docking_instructions " p z t *"
		if ($destination = $stardock)
			setVar $docking_instructions " p z s g y g q h *"
		end
		send $docking_instructions
	end
	gosub :quikstats
	if ($CURRENT_SECTOR <> $destination)
		send "'{" $bot_name "} - Safe mow did not reach destination!*"
	else
		send "'{" $bot_name "} - Safe mow completed.*"
	end
	goto :wait_for_command
# ======================     END SAFE MOW SUBROUTINES     ==========================
# ============================== LAND (LAND) ==============================
:land
:l
	gosub :quikstats
	setVar $startingLocation $CURRENT_PROMPT
	setVar $validPrompts "Command"
	gosub :checkStartingPrompt
	isNumber $number $parm1
	if ($number = TRUE)
		if (($parm1 = 0) AND ($PLANET = 0))
			send "'{" $bot_name "} - Incorrect Planet number*"
			goto :wait_for_command
		elseif ($parm1 > 0)
			setVar $PLANET $parm1
		else
			#Use last known planet as default.
		end
	else
		send "'{" $bot_name "} - Planet number entered is not a number*"
		goto :wait_for_command
	end
        gosub :landingSub
	if ($sucessfulCitadel)
		send "'{" $bot_name "} - In Cit - Planet " $PLANET "*"
	elseif ($sucessfulPlanet)
		send "'{" $bot_name "} - At Planet Prompt - No Cit*"
	end
	goto :wait_for_command
# ============================== END LAND (LAND) SUB ==============================
# ============================== SINGLE MACRO (MAC) ==============================
:mac
	setVar $nmac 1
	goto :go_macro
:nmac
	setVar $nmac $parm1
:go_macro
	isNumber $number $nmac
	if ($number <> TRUE)
		send "'{" $bot_name "} - Invalid Macro Count*"
		goto :wait_for_command
	end
	if ($nmac <= 0)
		send "'{" $bot_name "} - Invalid Macro Count*"
		goto :wait_for_command
	end
	gosub :macroProtections
	setVar $i 0
	while ($i < $nmac)
		send $user_command_line
		add $i 1
	end
	if ($nmac > 1)
		send "'{" $bot_name "} - Numbered Macro - " $nmac " Cycles Complete*"
	else
		send "'{" $bot_name "} - Macro Complete*"
	end
	goto :wait_for_command
# ============================== END MACROS (MAC/NMAC) SUB ==============================
:macroProtections
	stripText $user_command_line $bot_name
	StripText $user_command_line " mac "
	replaceText $user_command_line "^m" "*"
	replaceText $user_command_line #42 "*"
	getWordPos $user_command_line $pos "`"
	getWordPos $user_command_line $pos2 "'"
	getWordPos $user_command_line $pos3 "="
	if (($pos > 0) OR ($pos2 > 0) OR ($pos3 > 0))
		send "'{" $bot_name "} - No talking with the bot :P*"
		goto :wait_for_command
	end
	setVar $cbyCheck $user_command_line
	lowercase $cbyCheck
	getWordPos $cbyCheck $posc "c"
	getWordPos $cbyCheck $posb "b"
	getWordPos $cbyCheck $posy "y"
	gosub :current_prompt
	if (($CURRENT_PROMPT = "Computer") AND ($posb > 0) AND ($posy > 0))
		send "'{" $bot_name "} - Self Destruct Protection Activated*"
		goto :wait_for_command
	end
	if (($CURRENT_PROMPT = "����������") AND ($posy > 0))
		send "'{" $bot_name "} - Self Destruct Protection Activated*"
		goto :wait_for_command
	end
	getLength $cbyCheck $length
	setVar $i 1
	while ($i <= $length)
		if (($posc > 0) AND ($posb > $posc) AND ($posy > $posb))
			send "'{" $bot_name "} - Self Destruct Protection Activated*"
			goto :wait_for_command
		end
		if ($foundC = FALSE)
			getWordPos $cbyCheck $pos "c"
			if ($pos = 1)
				setVar $foundC TRUE
			end
		elseif ($foundB = FALSE)
			getWordPos $cbyCheck $pos "b"
			if ($pos = 1)
				setVar $foundB TRUE
			end
		elseif ($foundY = FALSE)
			getWordPos $cbyCheck $pos "y"
			if ($pos = 1)
				setVar $foundY TRUE
			end
		end
		if ($foundC AND $foundB AND $foundY)
			send "'{" $bot_name "} - Self Destruct Protection Activated*"
			goto :wait_for_command
		end
		if ($testLength > 1)
			cutText $cbyCheck $cbyCheck 2 9999
		end
		add $i 1
	end
return
# ============================== END MULTIPLE MACRO (NMAC) SUB ==============================
# ============================== START STORE SHIP ====================================
:storeship
:shipstore
	setVar $shipcounter 1
	:_readshiplist
	read $cap_file $shipInf $shipcounter
	if ($shipInf <> "EOF")
		getWord $shipInf $shields 1
		getLength $shields $shieldlen
		getWord $shipInf $defodd 2
		getLength $defodd $defoddlen
		getWord $shipinf $off_odds 3
		getLength $off_odds $filler1len
		getWord $shipinf $ship_cost 4
		getLength $ship_cost $filler2len
		getWord $shipinf $max_holds 5
		getLength $max_holds $filler3len
		getWord $shipinf $max_fighters 6
		getLength $max_fighters $filler4len
		getWord $shipinf $init_holds 7
		getLength $init_holds $filler5len
		getWord $shipinf $tpw 8
		getLength $tpw $filler6len
		setVar $startlen ($shieldlen + $defoddlen + $filler1len + $filler2len + $filler3len + $filler4len + $filler5len + $filler6len + 9)
		cutText $shipinf $ShipName $startlen 999
		setVar $database $database&"^^^^^^"&$ShipName&"^^^^^^"
		add $shipcounter 1
		goto :_readshiplist
	end
	gosub :current_prompt
	setVar $startingLocation $CURRENT_PROMPT
	setVar $validPrompts "Command Citadel"
	gosub :checkStartingPrompt
	send "c"
	Waiton "Computer command"
	send ";"
	:_keeplookingshipname
		gosub :killthetriggers
		setTextLineTrigger checkingForShipName :_checkshipname 
		pause
	:_checkshipname
		if (CURRENTLINE = "")
			goto :_keeplookingshipname
		else
			setVar $current_line CURRENTLINE
			getWord $current_line $temp 1
			cutText $temp $frontletter 1 1
			getText $current_line $ship_Name $frontletter "          "
			setVar $ship_name $frontletter&$ship_name
			getWordPos $database $pos "^^^^^^"&$Ship_Name&"^^^^^^"
			if ($pos > 0)
				send "'{" $bot_name "} - This ship is already stored in bot file.*"
				goto :wait_for_command
			end
		end
	:_sn
		setTextLineTrigger hc :_hc "Basic Hold Cost:"
		pause
	:_hc
		setVar $line CURRENTLINE
		stripText $line "Basic Hold Cost:"
		stripText $line "Initial Holds:"
		stripText $line "Maximum Shields:"
		getWord $line $init_holds 2
		getWord $line $max_Shields 3
		stripText $max_Shields ","
		setTextLineTrigger oo :_oo2 "Offensive Odds:"
		pause
	:_oo2
		setVar $line CURRENTLINE
		stripText $line "Main Drive Cost:"
		stripText $line "Max Fighters:"
		stripText $line "Offensive Odds:"
		getWord $line $max_figs 2
		getWord $line $off_odds 3
		stripText $max_figs ","
		stripText $off_odds ":1"
		stripText $off_odds "."
		setTextLineTrigger do :_do "Defensive Odds:"
		pause
	:_do
		setVar $line CURRENTLINE
		stripText $line "Computer Cost:"
		stripText $line "Turns Per Warp:"
		stripText $line "Defensive Odds:"
		getWord $line $def_odds 3
		stripText $def_odds ":1"
		stripText $def_odds "."
		getWord $line $tpw 2
		setTextLIneTrigger sc :_sc "Ship Base Cost:"
		pause
	:_sc
		setVar $line CURRENTLINE
		stripText $line "Ship Base Cost:"
		getWord $line $cost 1
		stripText $cost ","
		getLength $cost $costLen
		if ($costLen = 7)
			add $cost 10000000
		end
		setTextLineTrigger mh :_mh "Maximum Holds:"
		pause
	:_mh
		setVar $line CURRENTLINE
		stripText $line "Maximum Holds:"
		getWord $line $max_holds 1
		setVar $isDefender FALSE
		write $cap_file $max_shields & " " & $def_odds & " " & $off_odds & " " & $cost & " " & $max_holds & " " & $max_figs & " " & $init_holds & " " & $tpw & " " & $isDefender & " " & $ship_name
		send "'{" $bot_name "} - "&$ship_name&" added to bot's ship file.*"
		send "q"
		gosub :loadShipInfo
		goto :wait_for_command
# ================================== END STORE SHIP ==============================================
# ============================== QSS ==============================
:qss
	setArray $space 27
	setArray $h 27
	setArray $qss 27
	setVar $space[1] 18
	setVar $space[2] 18
	setVar $space[3] 18
	setVar $space[4] 14
	setVar $space[5] 14
	setVar $space[6] 10
	setVar $space[7] 10
	setVar $space[8] 10
	setVar $space[9] 10
	setVar $space[10] 10
	setVar $space[11] 14
	setVar $space[12] 12
	setVar $space[13] 12
	setVar $space[14] 12
	setVar $space[15] 11
	setVar $space[16] 9
	setVar $space[17] 12
	setVar $space[18] 12
	setVar $space[19] 14
	setVar $space[20] 11
	setVar $space[21] 14
	setVar $space[22] 11
	setVar $space[23] 11
	setVar $space[24] 11
	setVar $space[25] 18
	setVar $space[26] 18
	setVar $space[27] 5
	setVar $h[1] "Sect"
	setVar $h[2] "Turns"
	setVar $h[3] "Creds"
	setVar $h[4] "Figs"
	setVar $h[5] "Shlds"
	setVar $h[6] "Hlds"
	setVar $h[7] "Ore"
	setVar $h[8] "Org"
	setVar $h[9] "Equ"
	setVar $h[10] "Col" 
	setVar $h[11] "Phot"
	setVar $h[12] "Armd"
	setVar $h[13] "Lmpt"
	setVar $h[14] "GTorp"
	setVar $h[15] "TWarp"
	setVar $h[16] "Clks"
	setVar $h[17] "Beacns"
	setVar $h[18] "AtmDt"
	setVar $h[19] "Crbo"
	setVar $h[20] "EPrb"
	setVar $h[21] "MDis"
	setVar $h[22] "PsPrb"
	setVar $h[23] "PlScn"
	setVar $h[24] "LRS"
	setVar $h[25] "Aln"
	setVar $h[26] "Exp"
	setVar $h[27] "Ship"
	gosub :quikstats
	setVar $qss[1] $CURRENT_SECTOR
	if ($unlimitedGame)
		setVar $qss[2] "Unlimited"
	else
		setVar $qss[2] $TURNS
	end
	setVar $qss[3] $CREDITS
	setVar $qss[4] $FIGHTERS
	setVar $qss[5] $SHIELDS
	setVar $qss[6] $TOTAL_HOLDS
	setVar $qss[7] $ORE_HOLDS
	setVar $qss[8] $ORGANIC_HOLDS
	setVar $qss[9] $EQUIPMENT_HOLDS
	setVar $qss[10] $COLONIST_HOLDS
	setVar $qss[11] $PHOTONS
	setVar $qss[12] $ARMIDS
	setVar $qss[13] $LIMPETS
	setVar $qss[14] $GENESIS
	setVar $qss[15] $TWARP_TYPE
	setVar $qss[16] $CLOAKS
	setVar $qss[17] $BEACONS
	setVar $qss[18] $ATOMIC
	setVar $qss[19] $CORBO
	setVar $qss[20] $EPROBES
	setVar $qss[21] $MINE_DISRUPTORS
	setVar $qss[22] $PSYCHIC_PROBE
	setVar $qss[23] $PLANET_SCANNER
	setVar $qss[24] $SCAN_TYPE
	setVar $qss[25] $ALIGNMENT
	setVar $qss[26] $EXPERIENCE
	setVar $qss[27] $SHIP_NUMBER
	setVar $qss_ss 0
	setVar $qss_count 1
	setVar $spc " "
	setVar $overall 15
:qss_gather
	while ($qss_count <= 27)
		setVar $spc_count 1
		upperCase $h[$qss_count]
		setVar $qss_var[$qss_count] $h[$qss_count]&" = "&$qss[$qss_count]
		getLength $qss_var[$qss_count] $length
		subtract $space[$qss_count] $length
		while ($spc_count <= $space[$qss_count])
			mergeText $qss_var[$qss_count] $spc $qss_var[$qss_count]
			add $spc_count 1
		end
		add $qss_count 1
	end
:qss_send
	send "'*"
	send $qss_var[1]&"|"&$qss_var[6]&"|"&$qss_var[4]&"|"&$qss_var[12]&"|"&$qss_var[15]&"*"
	send $qss_var[2]&"|"&$qss_var[7]&"|"&$qss_var[5]&"|"&$qss_var[13]&"|"&$qss_var[23]&"*"
	send $qss_var[3]&"|"&$qss_var[8]&"|"&$qss_var[11]&"|"&$qss_var[14]&"|"&$qss_var[24]&"*"
	send $qss_var[25]&"|"&$qss_var[9]&"|"&$qss_var[19]&"|"&$qss_var[18]&"|"&$qss_var[22]&"*"
	send $qss_var[26]&"|"&$qss_var[10]&"|"&$qss_var[21]&"|"&$qss_var[17]&"|"&$qss_var[20]&"*"
	send $qss_var[27]&"**"
goto :wait_for_command
# ============================== END QSS SUB ==============================
# ======================     START PWARP SUBROUTINES     =================
:pwarp
:p
	gosub :killthetriggers
	if ($parm1 <> $CURRENT_SECTOR)
		gosub :current_prompt
	else
		gosub :quikstats
	end
	setVar $startingLocation $CURRENT_PROMPT
	setVar $validPrompts "Citadel"
	gosub :checkStartingPrompt
	isNumber $test $parm1
	if (($test = FALSE) OR ($parm1 = "0")) 
		send "'{" $bot_name "} - Sector must be entered as a number between 11-" SECTORS "*"
		goto :wait_For_Command
	else
		setVar $warpto $parm1
		if ($CURRENT_SECTOR = $warpto)
			send "'{" $bot_name "} - Already in that sector!*"
			goto :wait_for_command
		end
	end
	gosub :pwarpto
	goto :wait_for_command
:pwarpto
	send "p" $warpTo "*y"
	setTextLineTrigger pwarp_lock 		:pwarp_lock 	"Locating beam pinpointed"
	setTextLineTrigger no_pwarp_lock 	:no_pwarp_lock 	"Your own fighters must be"
	setTextLineTrigger already 		:already 	"You are already in that sector!"
	setTextLineTrigger no_ore 		:no_ore 	"You do not have enough Fuel Ore"
	setTextLineTrigger No_pwarp		:noPwarp	"This Citadel does not have a Planetary TransWarp"
	pause
    :noPwarp
		gosub :killthetriggers
		send "'{" $bot_name "} - Planet Does Not Have A Planetary TransWarp Drive!*"
		return
	:no_pwarp_lock
		gosub :killthetriggers
		setVar $target $warpto
		gosub :removeFigFromData
		send "'{" $bot_name "} - No fighter down at that location!*"
		return
	:no_ore
		gosub :killthetriggers
		send "'{" $bot_name "} - Not enough fuel for that pwarp.*"
		return
	:pwarp_lock
		gosub :killthetriggers
		waitOn "Planet is now in sector"
		send "'{" $bot_name "} - Planet moved to sector "&$warpTo&".*"
		setVar $target $warpto
		gosub :addFigToData
		return
	:already
		gosub :killthetriggers
		send "'{" $bot_name "} - Planet already in that sector!.*"
return
# ======================     END PWARP SUBROUTINES     ==========================
# ======================     START BWARP SUBROUTINES     =================
:Bwarp
:b
	gosub :killthetriggers
	if ($parm1 <> $CURRENT_SECTOR)
		gosub :current_prompt
	else
		gosub :quikstats
	end
	setVar $startingLocation $CURRENT_PROMPT
	setVar $validPrompts "Citadel"
	gosub :checkStartingPrompt
	gosub :travelProtections
	send "b"
	setTextTrigger noBwarp  :noBwarp  "Would you like to place a subspace order for one? "
	setTextTrigger yesBwarp :yesBwarp "Beam to what sector? (U="
	setTextTrigger IGBwarp  :bwarpPhotoned "Your ship was hit by a Photon and has been disabled"
	pause
	:noBwarp
		gosub :killthetriggers
		send "*"
		setVar $message "{"&$bot_name&"} - No Bwarp installed on this planet*"
		gosub :switchboard
		goto :wait_for_command
	:yesBwarp
		gosub :killthetriggers
		send $warpto&"*"
		setTextTrigger bwarp_lock :bwarp_no_range "This planetary transporter does not have the range."
		setTextTrigger no_bwrp_lock :no_bwarp_lock "Do you want to make this transport blind?"
		setTextTrigger bwarp_ready :bwarp_lock "All Systems Ready, shall we engage?"
		setTextLineTrigger no_bwarpfuel :bwarpNoFuel "This planet does not have enough Fuel Ore to transport you."
		pause
	:bwarp_no_range
		gosub :killthetriggers
		setVar $message "{"&$bot_name&"} - Not enough range on this planet's transporter.*"
		gosub :switchboard
		goto :wait_for_command
	:no_bwarp_lock
		gosub :killthetriggers
		send "* "
		setVar $target $warpto
		gosub :removeFigFromData
		setVar $message "{"&$bot_name&"} - No fighter down at that destination, aborting*"
		gosub :switchboard
		goto :wait_for_command
	:bwarp_lock
		gosub :killthetriggers
		send "y     * "
		send "'{" $bot_name "} - B-warp completed.*"
		setVar $target $warpto
		gosub :addFigToData
		goto :wait_for_command
	:bwarpNoFuel
		gosub :killthetriggers
		setVar $message "{"&$bot_name&"} - Not enough fuel on the planet to make the transport!*"
		gosub :switchboard
		goto :wait_for_command
	:bwarpPhotoned
		gosub :killthetriggers
		setVar $message "{"&$bot_name&"} - I have been photoned and can not B-warp!*"
		gosub :switchboard
		goto :wait_for_command
# ======================     END BWARP SUBROUTINES     ==========================
# ======================     START TWARP SUBROUTINES     =================
:twarp
:t
	gosub :killthetriggers
	setVar $warpto_p ""
	gosub :quikstats
	setVar $startingLocation $CURRENT_PROMPT
	setVar $validPrompts "Command <Underground> Do How Corporate Citadel Planet Computer Terra <StarDock> <FedPolice> <Tavern> <Libram <Galactic <Hardware <Shipyards>"
	gosub :checkStartingPrompt
	if ($TWARP_TYPE = "No")
		setVar $message "{"&$bot_name&"} - This ship does not have a transwarp drive!*"
		gosub :switchboard
		goto :wait_for_command
	end
	gosub :travelProtections
	gosub :twarpto
	if ($twarpSuccess = FALSE)
		if (($startingLocation = "Citadel") OR ($startingLocation = "Planet"))
			if ($PLANET <> 0)
				gosub :current_prompt
				if ($CURRENT_PROMPT = "Command")
					gosub :landingSub
				end
			end
			goto :wait_for_command
		end
		if (($startingLocation = "<StarDock>") OR ($startingLocation = "<FedPolice") OR ($startingLocation = "<Tavern>") OR ($startingLocation = "<Libram") OR ($startingLocation = "<Galact") OR ($startingLocation = "<Hardware") OR ($startingLocation = "<Shipyards>"))
			send "p z s h *"
			goto :wait_for_command
		end
		setVar $message "{"&$bot_name&"} - "&$msg&"*"
		gosub :switchboard
	else
		if ($parm2 = "p")
			send $warpto_p
		elseif (($warpto_p <> 0) AND ($warpto_p <> ""))
			setVar $PLANET $warpto_p
			gosub :landingSub
        	end
		send "'{"&$bot_name&"} - "&$msg&"*"
	end
	goto :wait_for_command
# ======================     END TWARP SUBROUTINES     ==========================
:travelProtections
	isNumber $test $parm1
	if ($test = FALSE)
		setVar $message "{"&$bot_name&"} - Sector must be entered as a number*"
		gosub :switchboard
		goto :wait_for_command
	else
		if ($parm2 = "p")
			setVar $warpto_p "p z t *"
			if ($parm1 = $stardock)
				setVar $warpto_p "p z s h *"
			end
		else
			isNumber $test $parm2
			if ($test = FALSE)
				setVar $warpto_p ""
			else
				setVar $warpto_p $parm2
			end
		end
		setVar $warpto $parm1
		if ($CURRENT_SECTOR = $warpto)
			setVar $message "{"&$bot_name&"} - Already in that sector!*"
			gosub :switchboard
			goto :wait_for_command
		elseif (($warpto <= 0) OR ($warpto > SECTORS))
			setVar $message "{"&$bot_name&"} - Destination sector is out of range!*"
			gosub :switchboard
			goto :wait_for_command
		end
	end
return
# =============================== START COURSE DISPLAY ===============================
:course
	gosub :killthetriggers
	gosub :quikstats
	isNumber $test $parm1
	if (($parm1 = "0") OR ($parm1 = "") OR ($test = FALSE))
		send "'{" $bot_name "} - Sectors entered not valid.*"
		goto :wait_for_command
	end
	isNumber $test $parm2
	if (($test = FALSE) OR ($parm2 = "0"))
		setVar $destination $parm1
		setVar $start $CURRENT_SECTOR
	else
		if ($parm2 > 0)
			setVar $start $parm1
			setVar $destination $parm2
		else
			send "'{" $bot_name "} - Sectors entered not valid.*"
			goto :wait_for_command
		end
	end
	send "^f"&$start&"*"&$destination&"*q "
	waitOn ": ENDINTERROG"
	getCourse $course $start $destination	
	setVar $i 1
	setVar $directions ""
	while ($i <= $course)
		getSectorParameter $course[$i] "FIGSEC" $isFigged
		if ($isFigged)
			setVar $directions $directions&"["&$course[$i]&"]"
		else
			setVar $directions $directions&$course[$i]	
		end
		if ($i <> $course)
			setVar $directions $directions&" > "
		end
		add $i 1
	end
	send "'{" $bot_name "} - Path from "&$start&" to "&$destination&": "&$directions&"*"
goto :wait_for_command
#================================== END COURSE DISPLAY ==============================
#==================================== LOG OFF SUB ===========================================
:logoff
:logout
	killalltriggers
	gosub :quikstats
	setVar $startingLocation $CURRENT_PROMPT
	setVar $quittingWithNoTimer FALSE
	isNumber $test $parm1
	if (($test = FALSE) OR ($parm1 <= 0))
		setVar $quittingWithNoTimer TRUE
	else
		setVar $timeToLogBackIn ($parm1*60)
		gosub :calcTime
	end
	setVar $cloakingOut FALSE
	getWordPos " "&$user_command_line&" " $pos " cloak "
	if ($pos > 0)
		setVar $cloakingOut TRUE
	end
	if (($cloakingOut = TRUE) AND ($cloaks > 0))
		if ($quittingWithNoTimer)
			send "'{" $bot_name "} - Logging and cloaking out until I am at keys to login again.*"
		else
			send "'{" $bot_name "} - Logging and cloaking out for "&$hours&" hours, "&$minutes&" minutes, and "&$seconds&" seconds.*"
		end
		send "q q q q  * * * * q q q q y y x *"
		waitOn "Enter your choice:"
	else
		if ($quittingWithNoTimer)
			send "'{" $bot_name "} - Logging out until I am at keys to login again.*"
		else
			send "'{" $bot_name "} - Logging out for "&$hours&" hours, "&$minutes&" minutes, and "&$seconds&" seconds.*"
		end
		if ($startingLocation = "Citadel")
			send "ryy* x *##"
			waitOn "Game Server"
		else
			send "q q q q  * * * * q q q q y*"
			waitOn "Enter your choice:"
		end
	end
	disconnect
	setVar $timer 0
	if ($quittingWithNoTimer)
		halt
	end
	setTextOutTrigger logearly :endLogoffGame #32
	while ($timeToLogBackIn > 0)
		gosub :calcTime
		echo ANSI_10 #27 & "[1A" & #27 & "[K" & $hours ":" $minutes ":" $seconds " left before entering game " GAME " (" GAMENAME ") "&ANSI_15&" ["&ANSI_14&"Spacebar to relog"&ANSI_15&"]*"
		setDelayTrigger timeBeforeRelog :relogTimer 1000
		pause
		:relogTimer
			setVar $timeToLogBackIn $timeToLogBackIn-1
	end
	:endLogoffGame
	killtrigger logearly
	killtrigger timeBeforeRelog
	goto :relog_attempt
:calcTime
	setVar $hours 0
	setVar $minutes 0
	setVar $seconds 0
	setVar $testTime $timeToLogBackIn
	if ($testTime >= 3600)
		setVar $hours ($testTime/3600)
		setVar $testTime $testTime-($hours*3600)
	end
	if ($testTime >= 60)
		setVar $minutes ($testTime/60)
		setVar $testTime $testTime-($minutes*60)
	end
	if ($testTime >= 1)
		setVar $seconds $testTime
	end
	if ($hours < 10)
		setVar $hours "0"&$hours
	end
	if ($minutes < 10)
		setVar $minutes "0"&$minutes
	end
	if ($seconds < 10)
		setVar $seconds "0"&$seconds
	end
return
#==================================== END LOG OFF SUB ========================================
# ============================== START PERSONAL LIMP (LIMP) SUB ==============================
:plimp
:limp
	setvar $limp "p"
	goto :_limp
:climp
	setvar $limp "c"
	goto :_limp

:_limp
	gosub :mineProtections
	if ($parm1 > $LIMPETS)
		setVar $parm1 $LIMPETS
	end
:plimp
	gosub :killthetriggers
	if ($LIMPETS <= 0)
		send "'{" $bot_name "} - Out of limpets!*"
		goto :wait_for_command
	end
	if ($startingLocation = "Citadel")
		send "q q z* h2z" $parm1 "* z " $limp " z * * *l " $PLANET "* c"
	elseif ($startingLocation = "Command")
		send "z* h2z" $parm1 "* z " $limp " z * *"
	end
	setTextLineTrigger toomanypl :toomany_limp "!  You are limited to "
	setTextLineTrigger plclear :plclear_limp "Done. You have "
	setTextLineTrigger enemypl :noperdown_limp "These mines are not under your control."
	setTextLineTrigger notenough :toomany_limp "You don't have that many mines available."
	pause
:plclear_limp
	gosub :killthetriggers
	setVar $isLimped TRUE

    if ($startingLocation = "Citadel")
		waiton "Citadel command (?=help)"
    	send "s* "
	elseif ($startingLocation = "Command")
		send "d* "
	end
	setTextLineTrigger perdown :perdown_limp "(Type 2 Limpet) (yours)"
	setTextLineTrigger cordown :cordown_limp "(Type 2 Limpet) (belong to your Corp)"
	setTextLineTrigger noperdown :noperdown_limp "Warps to Sector(s) :"
	pause
:cordown_limp
	gosub :killthetriggers
	send "'{" $bot_name "} - " $parm1 " Corporate Limpets Deployed!*"
	goto :done_limp
:perdown_limp
	gosub :killthetriggers
	send "'{" $bot_name "} - " $parm1 " Personal Limpet Deployed!*"
	goto :done_limp
:noperdown_limp
	gosub :killthetriggers
	send "'{" $bot_name "} - Sector already has enemy limpets present!*"
	setVar $isLimped FALSE
	goto :done_limp
:toomany_limp
	send "'{" $bot_name "} - Cannot Deploy Limps!*"
:done_limp
	if ($isLimped)
		setSectorParameter $CURRENT_SECTOR "LIMPSEC" TRUE
	else
		setSectorParameter $CURRENT_SECTOR "LIMPSEC" FALSE
	end
	gosub :killthetriggers
	goto :wait_for_command
# ============================== END PERSONAL LIMP SUB ==============================
:mineProtections
	gosub :killthetriggers
	gosub :quikstats
	setVar $startingLocation $CURRENT_PROMPT
	isNumber $test $parm1
	if (($test = FALSE) OR ($parm1 = 0))
		setVar $parm1 1
	end
	setVar $validPrompts "Command Citadel"
	gosub :checkStartingPrompt
	if ($startingLocation = "Citadel")
		send "q"
		gosub :getPlanetInfo
		send "c"
	end
return
# ============================== MINES  ==============================
:pmine
        setvar $armid "p"
       	goto :_mine
:cmine
:mine
	setvar $armid "c"
	goto :_mine
:_mine
	gosub :mineProtections
	if ($parm1 > $ARMIDS)
		setVar $parm1 $ARMIDS
	end
:_cmine
	gosub :killthetriggers
	if ($ARMIDS <= 0)
		send "'{" $bot_name "} - Out of Armid Mines!*"
		goto :wait_for_command
	end
	if ($startingLocation = "Citadel")
		send "q q z n h1 z " $parm1 "*  z" $armid " z n n  *l " $PLANET "* c"
	else
		send "z n h1 z " $parm1 "*  z" $armid " z n"
	end
	setTextLineTrigger toomanypl :toomany_mine "!  You are limited to "
	setTextLineTrigger plclear :plclear_mine "Done. You have "
	setTextLineTrigger enemypl :noperdown_mine "These mines are not under your control."
	setTextLineTrigger notenough :toomany_mine "You don't have that many mines available."
	pause
:plclear_mine
	gosub :killthetriggers
	setVar $isMined TRUE
	if ($startingLocation = "Citadel")
		waitOn "Citadel command (?=help)" 
		send "s*"
	else
		waitOn "Command [TL="
		send "d*"
	end
	setTextLineTrigger perdown :perdown_mine "(Type 1 Armid) (yours)"
	setTextLineTrigger cordown :cordown_mine "(Type 1 Armid) (belong to your Corp)"
	setTextLineTrigger noperdown :noperdown_mine "Citadel treasury contains"
	pause
:cordown_mine
	send "'{" $bot_name "} - " $parm1 " Corporate Mines Deployed!*"
	goto :done_armid
:perdown_mine
	send "'{" $bot_name "} - " $parm1 " Personal Mines Deployed!*"
	goto :done_armid
:noperdown_mine
	send "'{" $bot_name "} - Sector already has enemy Armid Mines present!*"
	setVar $isMined FALSE
	goto :done_armid
:toomany_mine
	send "'{" $bot_name "} - Cannot Deploy Armid Mines!*"
:done_armid
	if ($isMined)
		setSectorParameter $CURRENT_SECTOR "MINESEC" TRUE
	else
		setSectorParameter $CURRENT_SECTOR "MINESEC" FALSE
	end
	goto :wait_for_command
# ============================== END MINES SUB ==============================	
# ============================== MINES (ARMID AND LIMP) SUB ==============================
:mines
	gosub :killthetriggers
	gosub :quikstats
	setVar $startingLocation $CURRENT_PROMPT
	getWord $user_command_line $parm1 1 "NONE"
	if ($parm1 = "NONE")
		setVar $parm1 3
	end
	setVar $validPrompts "Command Citadel"
	gosub :checkStartingPrompt
	if ($startingLocation = "Citadel")
		send "q "
		gosub :getPlanetInfo
		send "c "
	end
	setVar $preDeployArmids $ARMIDS
	setvar $preDeployLimpets $LIMPETS
	if ($startingLocation = "Citadel")
		send "s* "
		setVar $start_mac "q q "
		setVar $end_mac "l "&$PLANET&"* c "
	else
		send "** "
		setVar $start_mac ""
		setVar $end_mac ""
	end
	waitOn "Warps to Sector(s) :"
	setVar $limpetOwner SECTOR.LIMPETS.OWNER[$CURRENT_SECTOR]
	setVar $armidOwner SECTOR.MINES.OWNER[$CURRENT_SECTOR]
	if (($ARMIDS <= 0) AND (($armidOwner <> "belong to your Corp") AND ($armidOwner <> "yours")))
		send "'{" $bot_name "} - Out of armids!*"
		goto :wait_for_command
	elseif ($parm1 > $ARMIDS)
		setVar $parm1 $ARMIDS
	end
	if (($LIMPETS <= 0) AND (($limpetOwner <> "belong to your Corp") AND ($limpetOwner <> "yours")))
		send "'{" $bot_name "} - Out of limpets!*"
		goto :wait_for_command
	elseif ($parm1 > $LIMPETS)
		setVar $parm1 $LIMPETS
	end
	send $start_mac "z n h 2 z " $parm1 "*  zc * * h 1 z " $parm1 "*  z c * * * " $end_mac
	gosub :quikstats
	if (($predeployArmids > $ARMIDS) AND ($predeployLimpets > $LIMPETS))
		send "'{" $bot_name "} - " $parm1 " Armid and Limpet mines deployed into the sector!*"
		setSectorParameter $CURRENT_SECTOR "LIMPSEC" TRUE
		setSectorParameter $CURRENT_SECTOR "MINESEC" TRUE
	elseif ($predeployArmids > $ARMIDS)
		send "'{" $bot_name "} - " $parm1 " Armid mine(s) deployed into the sector!*"
		setSectorParameter $CURRENT_SECTOR "MINESEC" TRUE
	elseif ($predeployLimpets > $LIMPETS)
		send "'{" $bot_name "} - " $parm1 " Limpet mine(s) deployed into the sector!*"
		setSectorParameter $CURRENT_SECTOR "LIMPSEC" TRUE
	end
	if ($predeployArmids < $ARMIDS)
		send "'{" $bot_name "} - " ($ARMIDS-$predeployArmids) " Armid mines picked up from sector!*"
	elseif (($predeployArmids = $ARMIDS) AND (($armidOwner <> "belong to your Corp") AND ($armidOwner <> "yours")))
		send "'{" $bot_name "} - Enemy armid(s) present in sector, cannot deploy!*"
	end
	if ($predeployLimpets < $LIMPETS)
		send "'{" $bot_name "} - " ($LIMPETS-$predeployLimpets) " Limpet mines picked up from sector!*"
	elseif (($predeployLimpets = $LIMPETS) AND (($limpetOwner <> "belong to your Corp") AND ($limpetOwner <> "yours")))
		send "'{" $bot_name "} - Enemy limpet(s) present in sector, cannot deploy!*"
	end
	goto :wait_for_command
# ============================== END MINES (ARMID AND LIMP) SUB ==============================
# ============================== START EXIT ENTER SUB ==============================	
:exit
:xenter
	gosub :killthetriggers
	gosub :quikstats
	isNumber $test $parm1
	if ($test = FALSE)
		setVar $parm1 1
	else
		if ($parm1 <= 0)
			setVar $parm1 1
		end
	end
	getWordPos $user_command_line $pos "fill"
	if ($pos > 0)
		setVar $refill TRUE
	else
		setVar $refill FALSE
	end
	setVar $startingLocation $CURRENT_PROMPT
	setVar $validPrompts "Command Citadel"
	gosub :checkStartingPrompt
	if ($startingLocation = "Citadel")
		send "q "
		gosub :getPlanetInfo
		send "q "
	end
:exit_xenter
	setVar $i 1
	while ($i <= $parm1)
		send "q y n *"
		waiton "Enter your choice:"
		send "t* * *" $password "*    *    *       za9999*   z*   "
		if (($CURRENT_SECTOR > 10) and ($CURRENT_SECTOR <> STARDOCK))
			if (($startingLocation = "Citadel") OR ($refill <> TRUE))
				send "f z1* z c d * "
			else
				setVar $to_drop "d"
				gosub :do_topoff
			end
		end
		if ($startingLocation = "Citadel")
			send "l j" & #8 & $PLANET & "*  m * * * c "
		end
		if ($i <> $parm1)
			send "q q "
		end
		add $i 1
	end
	:doneExitEnter
	gosub :killthetriggers
	if ($parm1 > 1)
		setVar $message "Exit Enter - "&$parm1&" times completed."
	else
		setVar $message "Exit Enter."
	end
	send "'{" $bot_name "} - " $message "*"
	waitOn "{"&$bot_name&"} - "&$message
	goto :wait_for_command
# ============================== END EXIT ENTER SUB ==============================	
# ======================     START CLEAR SECTOR  (CLEAR) SUBROUTINE    ==========================
:clear
	gosub :bigdelay_killthetriggers
	gosub :quikstats
	setVar $startingLocation $CURRENT_PROMPT
	setVar $validPrompts "Command Citadel"
	gosub :checkStartingPrompt
	if ($startingLocation = "Citadel")
		send "q "
		gosub :getPlanetInfo
		send "q  "
	end
	send "'{" $bot_name "} - Clearing Current Sector*"
	setVar $beforeLimpets $LIMPETS
	setVar $beforeArmids  $ARMIDS
	setVar $placedLimpet FALSE
	setVar $placedArmid FALSE
	send "** "
	waitOn "Warps to Sector(s) :"
	setVar $limpetOwner SECTOR.LIMPETS.OWNER[$CURRENT_SECTOR]
	setVar $armidOwner SECTOR.MINES.OWNER[$CURRENT_SECTOR]
	if (($LIMPETS <= 0) AND (($limpetOwner <> "belong to your Corp") AND ($limpetOwner <> "yours")))
		send "'{" $bot_name "} - Need limpets to clear this sector*"
		goto :wait_for_command
	end
	if (($ARMIDS <= 0) AND (($armidOwner <> "belong to your Corp") AND ($armidOwner <> "yours")))
		send "'{" $bot_name "} - Need armids to clear this sector*"
		goto :wait_for_command
	end
	gosub :clear_sector_deployEquipment
	while (($placedLimpet = FALSE) OR ($placedArmid = FALSE))
		gosub :clear_sector_attemptClearingMines
	end
	if ($startingLocation = "Citadel")
		gosub :landingSub
	end
	setSectorParameter $CURRENT_SECTOR "LIMPSEC" TRUE
	setSectorParameter $CURRENT_SECTOR "MINESEC" TRUE
	goto :wait_for_command
	:clear_sector_attemptClearingMines
		setVar $i 0
		while ($i < 10)
			gosub :clear_sector_xenter
			add $i 1
		end
		gosub :clear_sector_deployEquipment
		return
	:clear_sector_xenter
   		send "q y n *"
   		waiton "Enter your choice:"
   		send "t* * *" $password "*    *    *       za9999*   z*   "
  		return
	:clear_sector_deployEquipment
		if ($ARMIDS < 3)
			setVar $minesToDeploy $ARMIDS
		else
			setVar $minesToDeploy 3
		end
		if ($LIMPETS < 3)
			setVar $limpsToDeploy $LIMPETS
		else
			setVar $limpsToDeploy 3
		end
		setVar $clearMac ""
		if (($armidOwner <> "belong to your Corp") AND ($armidOwner <> "yours"))
			setVar $clearMac $clearMac&"h  1  z " & $minesToDeploy & "*  z c  *  "
		end
		if (($limpetOwner <> "belong to your Corp") AND ($limpetOwner <> "yours"))
			setVar $clearMac $clearMac&"h  2  z " & $limpsToDeploy & "*  z c  *   "
		end
		send $clearMac
		gosub :quikstats
		if (($beforeLimpets > $LIMPETS) OR (($limpetOwner = "belong to your Corp") OR ($limpetOwner = "yours")))
			setVar $placedLimpet TRUE
		end
		if (($beforeArmids > $ARMIDS) OR (($armidOwner = "belong to your Corp") OR ($armidOwner = "yours")))
			setVar $placedArmid TRUE
		end
		return
# ======================     END CLEAR SECTOR (CLEAR) SUBROUTINE    ==========================
#====================================SHUTDOWN MODULE SUB =====================================
:shutdown
	setVar $mode "General"
	goto :wait_for_command
#===================================END SHUTDOWN MODULE SUB ==================================
#===================================== KEEP ALIVE ============================================
:keepalive
	add $alive_count 1
	if ($alive_count >= ($echoInterval * 2))
		setVar $alive_count 0
		gosub :current_prompt
		getSectorParameter 2 "FIG_COUNT" $figCount
		echo ANSI_14 "*-= Time: " ANSI_15 TIME ANSI_14 " Fig Grid: " ANSI_15 $figCount ANSI_14 " =-*" ANSI_7
		echo CURRENTANSILINE
	end
	if ((CONNECTED <> TRUE) AND ($doRelog = TRUE))
		goto :relog_attempt
	end
	send #27
	setDelayTrigger 	keepalive               :keepalive 	         30000
	pause
#=================================== END KEEP ALIVE ==========================================
# ============================== START DEPOSIT (DEP) ==============================
:dep
:d
	gosub :bankProtections
	if ($parm1 <= 0)
		setVar $cashToTransfer $CREDITS
	else
		setVar $cashToTransfer $parm1
	end
	send "D"
	waitOn "Citadel treasury contains "
	getWord CURRENTLINE $citadelCash 4
	stripText $citadelCash ","
	if (($cashToTranfer+$citadelCash) >= $CITADEL_CASH_MAX)
		send "'{" & $bot_name & "} - Citadel has too much cash to do transfer (how sad for you)*"
		goto :wait_for_command
	end
	send "t t "&$cashToTransfer&"* "
	send "'{" & $bot_name & "} - " & $cashToTransfer &" credits deposited into citadel.*"
goto :wait_for_command
# ============================== END DEPOSIT (DEP) ==============================
# ============================== START WITHDRAW (WITH) ==============================
:with
:w
	gosub :bankProtections
	if ($parm1 > $PLAYER_CASH_MAX)
		send "'{" & $bot_name & "} - Can't withdraw more than 1 bil at a time*"
		goto :wait_for_command
	end
	if ($parm1 <= 0)
		setVar $cashToTransfer $PLAYER_CASH_MAX
	else
		setVar $cashToTransfer $parm1
	end
	send "D" 
	waitOn "Citadel treasury contains "
	getWord CURRENTLINE $citadelCash 4
	stripText $citadelCash ","
	if (($CREDITS+$cashToTransfer) > $PLAYER_CASH_MAX)
		setVar $cashToTransfer ($PLAYER_CASH_MAX-$CREDITS)
	end
	if ($citadelCash < $cashToTransfer)
		setVar $cashToTransfer $citadelCash
	end
	send "t f "&$cashToTransfer&"* "
	send "'{" & $bot_name & "} - " & $cashToTransfer &" credits taken from citadel.*"
goto :wait_for_command
# ============================== END WITHDRAW (WITH) ==============================
:bankProtections
	gosub :quikstats
	setVar $validPrompts "Citadel"
	gosub :checkStartingPrompt
	isNumber $test $parm1 
	if ($test = FALSE)
		send "'{" & $bot_name & "} - Cash entered is not a number, try again.*"	
		goto :Wait_for_command	
	end
return
# ============================== START UNLOCK (unlock) Sub ==============================
:unlock
	setVar $unlock_attempt 0
	gosub :current_prompt
	setVar $validPrompts "Citadel"
	gosub :checkStartingPrompt
	send "'{" $bot_name "} - Unlock ship initiated*ryy"
	setTextlineTrigger unlock_menu :unlock_menu "Game Server"
	settexttrigger unlock_omenu :unlock_menu2 "Trade Wars 2002"
:unlock_tryagain
	setDelayTrigger unlock_ansiMenu :unlock_ansiMenu 2000
	pause
:unlock_ansiMenu
	if ($unlock_attempt < 10)
		add $unlock_attempt 1
		send "#"
		goto :unlock_tryagain
	end
	DISCONNECT
	goto :wait_for_command
:unlock_menu2
	gosub :killthetriggers
	send "x * *"
	waiton "Server"
:unlock_menu
	gosub :killthetriggers
	send $letter & "*"
	waitOn "module now loading."
	send "**"
	waitOn "Enter your choice:"
	send "t***"
	waitOn "Password?"
	send $password & "* * * c"
	waitOn "Citadel command (?=help)"
	send "'{" $bot_name "} - Ship has been unlocked!*"
goto :wait_for_command
# ============================== END UNLOCK (UNLOCK) Sub ==============================
# ============================== START TOW (TOW) ==============================
:tow
	gosub :quikstats
	setVar $validPrompts "Command"
	gosub :checkStartingPrompt
	isNumber $test $parm1
	if ($test = FALSE)
		send "'{" $bot_name "} - Ship to tow must be entered as a number*"
		goto :wait_for_command
	elseif ($parm1 < 1)
		send "'{" $bot_name "} - Ship to tow must be entered as a number*"
		goto :wait_for_command
	else
		setVar $shipToTow $parm1
	end
	:towCheck
	        killalltriggers
	        send "w"
	        SetTextTrigger towOffContinue   :towCheck "You shut off your Tractor Beam."
                SetTextTrigger towOff           :towContinue "Do you wish to tow a manned ship? (Y/N)"
                pause
        :towContinue
                killallTriggers
                send "*"
                SetTextTrigger towNoGo          :towNoGo "You do not own any other ships in this sector!"
                SetTextTrigger towReady         :towOff "Choose which ship to tow (Q=Quit)"
                pause
	:towOff
		killallTriggers
		send $shipToTow & "*"
                setTextTrigger towNoGo2      	  :towNoGo2 "Command [TL="
	        setTextTrigger Tow_PassWord	  :Tow_PassWord	"Enter the password for"
	        setTextLineTrigger waitOnTow	  :goodTow "You lock your Tractor Beam on "
	        pause
	:Tow_PassWord
		killAllTriggers
		send "*"
		setVar $message "That ship has a PassWord Set.*"
		gosub :Switchboard
		goto :wait_for_command
	:towNoGo
       	        killalltriggers
		setVar $message "There are no ships in the sector I can tow.*"
		gosub :Switchboard
		goto :wait_for_command
	:towNoGo2
       	        killalltriggers
		setVar $message "That ship number is not in the sector.*"
		gosub :Switchboard
		goto :wait_for_command
	:goodTow
		killalltriggers
		setVar $message "Tow locked onto ship number " & $shipToTow & "*"
		gosub :Switchboard
		goto :wait_for_command
# ============================== END TOW (TOW) ==============================
# ============================== GET STATUS (STATUS) ==============================
:status
	gosub :quikstats
	setVar $startingLocation $CURRENT_PROMPT
	if (($startingLocation = "Command") or ($startingLocation = "Citadel"))
		gosub :getInfo
		if ($NOFLIP)
			send "CQ"
		else
			send "C N 9 Q Q "
		end
		waiton "Computer command [TL="
		getText CURRENTLINE $timeLeft "Computer command [TL=" "]:"
	else
		setVar $igstat "Invalid Prompt"
		setVar $timeLeft "Invalid Prompt"
	end
        send "'*"
	send "{" $bot_name "}   --- Status Report ---*"
	send "     - Sector      = " $CURRENT_SECTOR "*"
	send "     - Prompt      = " $CURRENT_PROMPT "*"
	if ($unlimitedGame)
		send "     - Turns       = Unlimited*"
	else
		send "     - Turns       = " $TURNS "*"
	end
	send "     - Photons     = " $PHOTONS "*"
	send "     - Mode        = " $mode "*"
	send "     - IG          = " $igstat "*"
	send "     - Ship        = " $SHIP_NUMBER "*"
	if (($startingLocation = "Planet") OR ($startingLocation = "Citadel"))
		if ($PLANET = "0")
			send "     - Planet      = None*"
		else
			send "     - Planet      = " $PLANET "*"
		end
	else
		if ($PLANET = "0")
			send "     - Last Planet = None*"
		else
			send "     - Last Planet = " $PLANET "*"
		end
	end
	if ($bot_team_name = "snickerdoodle")
		send "     - Team        = None*"
	else
		send "     - Team        = " $bot_team_name "*"
	end
	if ($timeLeft = "00:00:00")
		send "     - Time Left   = Unlimited*"
	else
		send "     - Time Left   = " & $timeLeft & "*"
    end
	if ($NOFLIP = 0)
		send "     - CN9 Check   = Reset To SPACE*"
	end
	send "*"
	goto :wait_for_command
# ============================== END GET STATUS (STATUS) SUB ==============================
#================================= ONLINE WATCH/RELOG ========================================
:online_watch
	gosub :killthetriggers
	if ((CONNECTED <> TRUE) AND ($doRelog = TRUE))
             goto :relog_attempt
        end
	Seteventtrigger relog2 :relog_attempt "CONNECTION LOST"
	setTextLineTrigger whos :whos "Who's Playing"
	setTextTrigger alternate :whos ""
	setDelayTrigger verifydelay :verifydelay 3000
	send "#"
	pause
	:whos
        	gosub :killthetriggers
		goto :wait_for_command
	:verifyDelay
        	gosub :killthetriggers
		disconnect
	:relog_attempt
		if ($doRelog <> TRUE)
			goto :wait_for_command
		end
		killalltriggers
		setDelayTrigger waitForRelogDelay :continueDoingRelog 1500
		pause
		:continueDoingRelog
			gosub :do_relog
		:enter
			gosub :relog_freeze_trigger
			killtrigger relog
			killtrigger relog2
			killtrigger firstpause
			send "T*"
			setTextTrigger showtoday :continueshowtoday "Show today's log?"
			pause
		:continueshowtoday
	                gosub :relog_freeze_trigger
			send "*"
			setTextTrigger pause2 :continuepause2 "[Pause]"
			pause
		:continuepause2
		        gosub :relog_freeze_trigger
			send "*"
			setTextTrigger password :continuepassword "A password is required to enter this game."
			pause
		:continuepassword
			gosub :relog_freeze_trigger
			send $password & "*"
		:alldone_relog
			killtrigger clearvoids
			killtrigger novoids
			killtrigger morepauses
			gosub :relog_freeze_trigger
			send "Z*  *  Z*  Z   A 9999*  Z*  "
			send "'{" $bot_name "} - Auto-relog activated*"
			setTextTrigger autorelogmessage :continuerelogmessage "{"&$bot_name&"} - Auto-relog activated"
			pause
		:continuerelogmessage
			gosub :quikstats
			gosub :relog_freeze_trigger
			if ($CURRENT_PROMPT = "Planet")
				send "*"
				gosub :getPlanetInfo
				if ($CITADEL > 0)
					send "c "
					send "'{" $bot_name "} - In citadel, planet "&$PLANET&".*"
					goto :wait_for_command
				else
					send "'{" $bot_name "} - On planet "&$PLANET&".*"
					goto :wait_for_command
				end
			end
			loadVar $PLANET
			if (($PLANET <> 0) AND ($CURRENT_SECTOR <> 1) AND ($CURRENT_SECTOR <> $StarDock))
				setVar $LandOn $PLANET
				setVar $user_command_line "land "&$LandOn
				goto :runUserCommandLine
			end
	goto :wait_for_command
#============================== END ONLINE WATCH/RELOG SUB ==============================
:do_relog
		:thedelay
			if (CONNECTED <> TRUE)
				connect
			end
			killtrigger continuelogin
			killtrigger thedelay
			killtrigger thedelay2
			killtrigger thadelay
			killtrigger relog
			killtrigger relog2
			killtrigger relog89
			killtrigger relog3
			setDelayTrigger thedelay2 :thedelay 1500
			setEventTrigger continuelogin :continuelogin "CONNECTION ACCEPTED"
			setEventTrigger thedelay :thedelay "CONNECTION LOST"
			setEventTrigger thadelay :thedelay "Connection failure"
			pause
			:continuelogin
			killtrigger thadelay
			killtrigger thedelay2
			killtrigger thedelay
			killtrigger continuelogin
			if (CONNECTED <> TRUE)	
				goto :do_relog
			end				       
			killtrigger relog3
			killtrigger relog
			killtrigger relog2
			setTextTrigger relog3 :continueRelog3 "Please enter your name"
			Seteventtrigger relog2 :do_relog "CONNECTION LOST"
			pause
		:continueRelog3
			killtrigger relog89
			killtrigger relog
			killtrigger relog2
			sound "page.wav"
			send $username & "*"
			killtrigger relog3
			killtrigger relog69
			send "#"
			setTextTrigger relog69 :continueRelog4 "Make a Selection:"
			setTextTrigger relog3 :continueRelog4 "Selection (? for menu):"
			Seteventtrigger relog2 :do_relog "CONNECTION LOST"
			pause
		:continueRelog4
		       send $letter
		:extrapause
			killtrigger relog
			killtrigger relog2
			killtrigger firstpause
			killtrigger enter
			killtrigger relog89
			Seteventtrigger relog2 :do_relog "CONNECTION LOST"
			setTextTrigger firstpause :firstpause "[Pause]"
			setTextTrigger enter :done_do_relog "Enter your choice"
			pause
		:firstpause
			send "*"
			setTextTrigger firstpause :firstpause "[Pause]"
			pause
		:done_do_relog
			gosub :killthetriggers
return
#=============================== START FIND ===============================================
:find
:finder
:f
:nf
:fp
:port
:de
:uf
:fde
:nfup
:fup
# ----- SUB TO FIND NEAREST FIGHTER -----
:near
	if (($command = "finder") OR ($command = "find"))
		setVar $near $parm1
		setVar $source $parm2
	else
		setVar $near $command
		setVar $source $parm1
	end
	isNumber $number $source
	if ($number = TRUE)
		if ($source <= 0)
			setVar $source CURRENTSECTOR
		end
		if ($source > SECTORS)
			send "'{" $bot_name "} - That sector is out of bounds (Must be between 1-"&SECTORS&")*"
			goto :wait_for_command
		end
	else
		if (($command = "finder") OR ($command = "find"))
			setVar $parm2 $parm3
		else
			setVar $parm2 $parm1
		end
		setVar $source CURRENTSECTOR
 	end

	getSectorParameter $source "FIGSEC" $isFigged
	if ($isFigged = "")
		send "'{" $bot_name "} - It appears no grid data is available.  Run a fighter grid checker that uses the sector parameter FIGSEC. (Try figs command)*"
		goto :wait_for_command
	end
	if ($near <> "owner") and ($near <> "ufde") and ($near <> "f") and ($near <> "nf") and ($near <> "fde") and ($near <> "uf") and ($near <> "fp") and ($near <> "nfup") and ($near <> "fup") and ($near <> "p") and ($near <> "de") and ($near <> "fig") and ($near <> "nofig") and ($near <> "figport") and ($near <> "port") and ($near <> "deadend")
		send "'{" $bot_name "} - Please use - [type] [sector] format*"
		goto :wait_for_command
	end
	if ($near = "fp") or ($near = "port") or ($near = "p") or ($near = "nfup") or ($near = "fup")
		getLength $parm2 $plength
		if (($parm2 = 0) OR ($plength <> 3))
			setVar $parm2 "xxx"
		end
		setVar $invalid FALSE
		cutText $parm2 $pfuel 1 1
		if ($pfuel <> "s") and ($pfuel <> "b") and ($pfuel <> "x")
			setVar $invalid TRUE
		end
		cutText $parm2 $porg 2 1
		if ($porg <> "s") and ($porg <> "b") and ($porg <> "x")
			setVar $invalid TRUE
		end
		cutText $parm2 $pequip 3 1
		if ($pequip <> "s") and ($pequip <> "b") and ($pequip <> "x")
			setVar $invalid TRUE
		end
		if ($invalid)
			send "'*{" $bot_name "} - Invalid Port Type*"
			send "  - Please use - [fp/p] [sector] [port type] format **"
			goto :wait_for_command
		end
		setVar $ptype $parm2
		upperCase $ptype
	end
:near_hit
	getSectorParameter $source "FIGSEC" $isFigged
	getWord SECTOR.FIGS.OWNER[$source] $figowner 3
	setVar $source_message ""
	if (($near = "f") AND ($isFigged = TRUE))
		setVar $source_message "appears to be fig'd."
	elseif (($near = "owner") AND (($isFigged <> TRUE) AND ($figowner = "Corp#"&$target_corp&",")))
		setVar $source_message "appears to be fig'd by corp #"&$target_corp&"."
	elseif ((($near = "nf") OR ($near = "uf")) AND ($isFigged <> TRUE))
		setVar $source_message "is not figged."
	elseif (($near = "ufde") AND (($isFigged = FALSE) and (SECTOR.WARPCOUNT[$source] = 1)))
		setVar $source_message "appears to be an unfigged dead-end."
	elseif (($near = "fde") AND (($isFigged = TRUE) and (SECTOR.WARPCOUNT[$source] = 1)))
		setVar $source_message "appears to be a figged dead-end."
	elseif (($near = "fp") AND ((($isFigged = TRUE) and ((PORT.CLASS[$source] > 0) and (PORT.CLASS[$source] < 9)))))
		if (($pfuel = "b") AND (PORT.BUYFUEL[$source] = 1)) or (($pfuel = "s") AND (PORT.BUYFUEL[$source] = 0)) or ($pfuel = "x")
			if (($porg = "b") AND (PORT.BUYORG[$source] = 1)) or (($porg = "s") AND (PORT.BUYORG[$source] = 0)) or ($porg = "x")
				if (($pequip = "b") AND (PORT.BUYEQUIP[$source] = 1)) or (($pequip = "s") AND (PORT.BUYEQUIP[$source] = 0)) or ($pequip = "x")
					setVar $source_message " has a " & $ptype & " port that's figged."
				end
			end
		end
	elseif ((($near = "port") OR ($near = "p")) AND (((PORT.CLASS[$source] > 0) and (PORT.CLASS[$source] < 9))))
		if (($pfuel = "b") AND (PORT.BUYFUEL[$source] = 1)) or (($pfuel = "s") AND (PORT.BUYFUEL[$source] = 0)) or ($pfuel = "x")
			if (($porg = "b") AND (PORT.BUYORG[$source] = 1)) or (($porg = "s") AND (PORT.BUYORG[$source] = 0)) or ($porg = "x")
				if (($pequip = "b") AND (PORT.BUYEQUIP[$source] = 1)) or (($pequip = "s") AND (PORT.BUYEQUIP[$source] = 0)) or ($pequip = "x")
					setVar $source_message " has a " & $ptype & " port."
				end
			end
		end
	elseif (((($near = "fup") AND ($isFigged = TRUE)) OR (($near = "nfup") AND ($isFigged <> TRUE))) AND (((PORT.CLASS[$source] > 0) and (PORT.CLASS[$source] < 9))))
		setVar $foundFuelPort FALSE
		setVar $foundOrgPort FALSE
		setVar $foundEquipPort FALSE
		if ((($pfuel = "b") AND (PORT.BUYFUEL[$source] = 1)) AND (PORT.FUEL[$source] >= 10000)) OR ((($pfuel = "s") AND (PORT.BUYFUEL[$source] = 0)) AND (PORT.FUEL[$source] >= 10000))
			setVar $foundFuelPort TRUE
		end
		if ((($porg = "b") AND (PORT.BUYORG[$source] = 1)) AND (PORT.ORG[$source] >= 10000)) OR ((($porg = "s") AND (PORT.BUYORG[$source] = 0)) AND (PORT.ORG[$source] >= 10000))
			setVar $foundOrgPort TRUE
		end
		if ((($pequip = "b") AND (PORT.BUYEQUIP[$source] = 1)) AND (PORT.EQUIP[$source] >= 10000)) OR ((($pequip = "s") AND (PORT.BUYEQUIP[$source] = 0)) AND (PORT.EQUIP[$source] >= 10000))
			setVar $foundEquipPort TRUE
		end
		if (($pfuel = "x") AND ($porg = "x") AND ($pequip = "x"))
			if ((($pfuel = "x") AND (PORT.FUEL[$source] >= 10000)) OR (($porg = "x") AND (PORT.ORG[$source] >= 10000)) OR (($pequip = "x") AND (PORT.EQUIP[$source] >= 10000)))
				setVar $foundFuelPort TRUE
				setVar $foundOrgPort TRUE
				setVar $foundEquipPort TRUE
			end
		else
			if ($pfuel = "x")
				setVar $foundFuelPort TRUE
			end
			if ($porg = "x")
				setVar $foundOrgPort TRUE
			end
			if ($pequip = "x")
				setVar $foundEquipPort TRUE
			end
		end
		if (($foundFuelPort = TRUE) AND ($foundOrgPort = TRUE) AND ($foundEquipPort = TRUE))
			if ($near = "fup")
				setVar $source_message " has an upped " & $ptype & " port that's figged."
			else
				setVar $source_message " has an upped " & $ptype & " port that's not figged."
			end
		end
	end
	gosub :breadth_search
	if ($return_data <> "")
		send "'*{" $bot_name "}*  - " & $return_data
		if ($source_message <> "")
			getSectorParameter $source "MINESEC" $isMined3
			getSectorParameter $source "LIMPSEC" $isLimpd3
			if ($isLimpd3 <> "0") AND ($isMined3 <> "0")
				send "*   *   Note: " & $source & "LA, " & $source_message
			else
				if ($isLimpd3 <> "0")
					send "*   *   Note: " & $source & "L, " & $source_message
				elseif ($isMined3 <> "0")
					send "*   *   Note: " & $source & "A, " & $source_message
            else
	            send "*   *   Note: " & $source & ", " & $source_message
				end
			end
		end
		send "**"
	end
	goto :wait_for_command
# ----- SUB :breadth_search -----
:breadth_search
	setVar $i 1
	setVar $loop_data 1
	getNearestWarps $nearArray $source
	while ($i <= $nearArray)
		setVar $focus $nearArray[$i]
		getDistance $_DIST_1_ $focus $source
		getDistance $_DIST_2_ $source $focus
		if ($_DIST_1_ = $_DIST_2_)
			getSectorParameter $focus "FIGSEC" $isFigged2
			getWord SECTOR.FIGS.OWNER[$focus] $figowner 3
			if ((($source <> $focus) AND ($focus > 10) AND ($focus <> $STARDOCK)) AND ((($isFigged2 = FALSE) AND (($near = "uf") OR ($near = "nf") OR (($near = "owner") AND ($figowner = "Corp#"&$target_corp&",")) OR (($near = "de") AND (SECTOR.WARPCOUNT[$focus] = 1)))) OR (($isFigged2 = TRUE) AND (($near = "f") OR (($near = "fde") AND (SECTOR.WARPCOUNT[$focus] = 1))))))
				getCourse $course $source $focus
				setVar $i 1
				setVar $fcount 0
				setVar $directions ""
				if ($near = "f")
					setVar $message "Nearest Fig"
				elseif (($near = "uf") OR ($near = "nf"))
					setVar $message "Nearest Non-Fig"
				elseif ($near = "owner")
					setVar $message "Nearest Corp #"&$target_corp&" Fig"
				elseif ($near = "de")
					setVar $message "Nearest Non-Fig DE"
				elseif ($near = "fde")
					setVar $message "Nearest Fig'd DE"
				end
				if ($course = 1)
					while (SECTOR.WARPS[$source][$i] > 0)
						setVar $tempCheck SECTOR.WARPS[$source][$i]
						getSectorParameter $tempCheck "FIGSEC" $isFigged3
						getSectorParameter $tempCheck "MINESEC" $isMined3
						getSectorParameter $tempCheck "LIMPSEC" $isLimpd3

						getWord SECTOR.FIGS.OWNER[$tempCheck] $figowner2 3
						if ((($isFigged3 = TRUE) AND (($near = "f") OR (($near = "fde") AND (SECTOR.WARPCOUNT[$tempCheck] = 1)))) OR (($isFigged3 = FALSE) AND ((($near = "owner") AND ($figowner2 = "Corp#"&$target_corp&",")) OR ($near = "uf") OR ($near = "nf") OR (($near = "de") AND (SECTOR.WARPCOUNT[$tempCheck] = 1)))))
							setVar $directions ($directions & $tempCheck)
							if ($isMined3 <> "0") AND ($isLimpd3 <> "0")
								setVar $directions ($directions & "LA")
							else
								if ($isMined3 <> "0")
									setVar $directions ($directions & "A")
								elseif ($isLimpd3 <> "0")
									setVar $directions ($directions & "L")
								end
							end
							setVar $directions ($directions & " ")
							add $fcount 1
						end
						add $i 1
					end
					if ($fcount > 1)
						setVar $return_data $message & "s adjacent to " & $source & " are*    [ " & $directions & "]"
					else
						setVar $return_data $message & " adjacent to " & $source & " is*    [ " & $directions & "]"
					end
				else
					while ($i <= ($course+1))
						getSectorParameter $course[$i] "MINESEC" $isMined3
						getSectorParameter $course[$i] "LIMPSEC" $isLimpd3
						if ($isMined3 <> "0") AND ($isLimpd3 <> "0")
							setVar $directions ("LA " & $directions)
						else
							if ($isMined3 <> "0")
								setVar $directions ("A " & $directions)
							end
							if ($isLimpd3 <> "0")
								setVar $directions ("L " & $directions)
							end
						end
						setVar $directions (" " & $course[$i] & $directions)

						add $i 1
					end
					setVar $return_data $message&" to " & $source & " is " & $focus & " (" & $course & " hops)*  <<" & $directions & " >> "
				end
				return
			elseif (($near = "nfup") AND ($isFigged2 = FALSE)) OR (($near = "fup") AND ($isFigged2 = TRUE))
				setVar $foundFuelPort FALSE
				setVar $foundOrgPort FALSE
				setVar $foundEquipPort FALSE
				if (((PORT.CLASS[$focus] > 0) and (PORT.CLASS[$focus] < 9)) AND ($focus <> $source))
					if ((($pfuel = "b") AND (PORT.BUYFUEL[$focus] = 1)) AND (PORT.FUEL[$focus] >= 10000)) OR ((($pfuel = "s") AND (PORT.BUYFUEL[$focus] = 0)) AND (PORT.FUEL[$focus] >= 10000))
						setVar $foundFuelPort TRUE
					end
					if ((($porg = "b") AND (PORT.BUYORG[$focus] = 1)) AND (PORT.ORG[$focus] >= 10000)) OR ((($porg = "s") AND (PORT.BUYORG[$focus] = 0)) AND (PORT.ORG[$focus] >= 10000))
						setVar $foundOrgPort TRUE
					end
					if ((($pequip = "b") AND (PORT.BUYEQUIP[$focus] = 1)) AND (PORT.EQUIP[$focus] >= 10000)) OR ((($pequip = "s") AND (PORT.BUYEQUIP[$focus] = 0)) AND (PORT.EQUIP[$focus] >= 10000))
						setVar $foundEquipPort TRUE
					end
					if (($pfuel = "x") AND ($porg = "x") AND ($pequip = "x"))
						if ((($pfuel = "x") AND (PORT.FUEL[$focus] >= 10000)) OR (($porg = "x") AND (PORT.ORG[$focus] >= 10000)) OR (($pequip = "x") AND (PORT.EQUIP[$focus] >= 10000)))
							setVar $foundFuelPort TRUE
							setVar $foundOrgPort TRUE
							setVar $foundEquipPort TRUE
						end
					else
						if ($pfuel = "x")
							setVar $foundFuelPort TRUE
						end
						if ($porg = "x")
							setVar $foundOrgPort TRUE
						end
						if ($pequip = "x")
							setVar $foundEquipPort TRUE
						end
					end
					if (($foundFuelPort = TRUE) AND ($foundOrgPort = TRUE) AND ($foundEquipPort = TRUE))
						if ($loop_data = 1)
							getCourse $course $source $focus
							setVar $return_data "Nearest Figged upgraded " & $ptype & " port(s) to " & $source & ": "  & $focus & " (" & $course & " hops)"
						elseif ($loop_data = 2)
							getCourse $course $source $focus
							setVar $return_data $return_data&", "  & $focus & " (" & $course & " hops)"
						else
							getCourse $course $source $focus
							setVar $return_data $return_data&", and "  & $focus & " (" & $course & " hops)"
							setVar $loop_data 1
							return
						end
						add $loop_data 1
					end
			   end
			elseif (($near = "port") OR ($near = "p") OR (($near = "fp") AND ($isFigged2 = TRUE)))
				if (((PORT.CLASS[$focus] > 0) and (PORT.CLASS[$focus] < 9)) AND ($focus <> $source))
					if (($pfuel = "b") AND (PORT.BUYFUEL[$focus] = 1)) or (($pfuel = "s") AND (PORT.BUYFUEL[$focus] = 0)) or ($pfuel = "x")
						if (($porg = "b") AND (PORT.BUYORG[$focus] = 1)) or (($porg = "s") AND (PORT.BUYORG[$focus] = 0)) or ($porg = "x")
							if (($pequip = "b") AND (PORT.BUYEQUIP[$focus] = 1)) or (($pequip = "s") AND (PORT.BUYEQUIP[$focus] = 0)) or ($pequip = "x")
								if ($loop_data = 1)
									getCourse $course $source $focus
									setVar $return_data "Nearest Figged " & $ptype & " port(s) to " & $source & ": "  & $focus & " (" & $course & " hops)"
								elseif ($loop_data = 2)
									getCourse $course $source $focus
									setVar $return_data $return_data&", "  & $focus & " (" & $course & " hops)"
								else
									getCourse $course $source $focus
									setVar $return_data $return_data&", and "  & $focus & " (" & $course & " hops)"
									setVar $loop_data 1
									return
								end
								add $loop_data 1
							end
						end
					end
			   end
			end
		end
	add $i 1
	end
	setVar $return_data "Nothing found for that search."
return
#=============================== END FIND =======================================================
# ========================================= SETVAR ======================================================
:getvar
	gosub :killthetriggers
	getWord $user_command_line $parm1 1
	setVar $message ""
	if (($parm1 = "h") OR ($parm1 = "home") OR ($parm1 = "all"))
		setVar $message $message&"Home Sector: "&$home_sector&"*"
	end
	if (($parm1 = "s") OR ($parm1 = "stardock") OR ($parm1 = "all"))
		setVar $message $message&"Stardock: "&$stardock&"*"
	end
	if (($parm1 = "r") OR ($parm1 = "rylos") OR ($parm1 = "all"))
		setVar $message $message&"Rylos: "&$rylos&"*"
	end
	if (($parm1 = "a") OR ($parm1 = "alpha") OR ($parm1 = "all"))
		setVar $message $message&"Alpha Centauri: "&$alpha_centauri&"*"
	end
	if (($parm1 = "b") OR ($parm1 = "backdoor") OR ($parm1 = "all"))
		setVar $message $message&"Backdoor: "&$backdoor&"*"
	end
	if (($parm1 = "x") OR ($parm1 = "safeship") OR ($parm1 = "all"))
		setVar $message $message&"Safe Ship: "&$safe_ship&"*"
	end
	if (($parm1 = "tl") OR ($parm1 = "turnlimit") OR ($parm1 = "all"))
		setVar $message $message&"Turn Limit: "&$bot_turn_limit&"*"
	end
	if ($message = "")
		setVar $message "Unknown variable name entered.*"
	end
	if ($self_command <> TRUE)
		setVar $self_command 2
	end
	gosub :switchboard
goto :wait_for_command
:setvar
	gosub :killthetriggers
	getWord $user_command_line $parm1 1
	isNumber $test $parm2
	if (($parm1 = "h") OR ($parm1 = "home"))
		if ($test)
			if (($parm2 <= SECTORS) AND ($parm2 >= 1))
				setVar $home_sector $parm2
				setVar $message "Home Sector variable set to: "&$home_sector&".*"
			else
				setVar $message "Variable entered not valid, keeping old value.*"
			end
		end
	elseif (($parm1 = "s") OR ($parm1 = "stardock"))
		if ($test)
			if (($parm2 <= SECTORS) AND ($parm2 >= 1))
				setVar $stardock $parm2
				setVar $message "Stardock variable set to: "&$stardock&".*"
			else
				setVar $message "Variable entered not valid, keeping old value.*"
			end
		end
	elseif (($parm1 = "r") OR ($parm1 = "rylos"))
		if ($test)
			if (($parm2 <= SECTORS) AND ($parm2 >= 1))
				setVar $rylos $parm2
				setVar $message "Rylos variable set to: "&$rylos&".*"
			else
				setVar $message "Variable entered not valid, keeping old value.*"
			end
		end
	elseif (($parm1 = "a") OR ($parm1 = "alpha"))
		if ($test)
			if (($parm2 <= SECTORS) AND ($parm2 >= 1))
				setVar $alpha_centauri $parm2
				setVar $message "Alpha Centauri variable set to: "&$alpha_centauri&".*"
			else
				setVar $message "Variable entered not valid, keeping old value.*"
			end
		end
	elseif (($parm1 = "b") OR ($parm1 = "backdoor"))
		if ($test)
			if (($parm2 <= SECTORS) AND ($parm2 >= 1))
				setVar $backdoor $parm2
				setVar $message "Backdoor Sector variable set to: "&$backdoor&".*"
			else
				setVar $message "Variable entered not valid, keeping old value.*"
			end
		end
	elseif (($parm1 = "x") OR ($parm1 = "safeship"))
		if ($test)
			if ($parm2 >= 1)
				setVar $safe_ship $parm2
				setVar $message "Safe Ship variable set to: "&$safe_ship&".*"
			else
				setVar $message "Variable entered not valid, keeping old value.*"
			end
		end
	elseif (($parm1 = "tl") OR ($parm1 = "turnlimit"))
		if ($test)
			if ($parm2 >= 0)
				setVar $bot_turn_limit $parm2
				setVar $message "Turn Limit variable set to: "&$bot_turn_limit&".*"
			else
				setVar $message "Variable entered not valid, keeping old value.*"
			end
		end
	elseif (($parm1 = "pt") OR ($parm1 = "planet_trade"))
		if ($test)
			if ($parm2 >= 0)
				setVar $bot_ptradesetting $parm2
				setvar $ptradesetting $parm2
				setVar $message "Planet Trade % variable set to: "&$bot_ptradesetting&".*"
			else
				setVar $message "Variable entered not valid, keeping old value.*"
			end
		end
	elseif (($parm1 = "rf") OR ($parm1 = "rob_factor"))
		if ($test)
			if ($parm2 >= 0)
				setVar $bot_rob_factor $parm2
				setvar $rob_factor $parm2
				setVar $message "Rob Factor variable set to: "&$bot_rob_factor&".*"
			else
				setVar $message "Variable entered not valid, keeping old value.*"
			end
		end
	elseif (($parm1 = "sf") OR ($parm1 = "steal_factor"))
		if ($test)
			if ($parm2 >= 0)
				setvar $steal_factor $parm2
				setVar $message "Steal Factor variable set to: "&$steal_factor&".*"
			else
				setVar $message "Variable entered not valid, keeping old value.*"
			end
		end
	else
		setVar $message "Unknown variable name entered.*"
	end
	gosub :preferenceStats		
	gosub :switchboard
goto :wait_for_command
# ======================================== END SETVAR ===================================================
:bustcount
:countbust
:countbusts
	Echo "**"
   	setVar $message "Please StandBy, Counting*"
   	gosub :switchboard
	setVar $i 1
	setVar $bustCount 0
	while ($i <= SECTORS)
		getSectorParameter $i "BUSTED" $isBusted
		if ($isBusted)
			add $bustCount 1
		end
		add $i 1
	end
	setVar $message "This bot currently has "&$bustCount&" busts recorded in the universe*"

	gosub :switchboard
	goto :wait_for_command
# ============================== START PLANET LIST (PLIST)  ==============================
:plist
	gosub :killthetriggers
	setVar $planet 0
	gosub :quikstats
	setVar $planetOutput ""
	setVar $validPrompts "Citadel Command"
	gosub :checkStartingPrompt
:Planet_Listing_Start
        if ($startingLocation = "Citadel")
		send "S* Q"
		gosub :getPlanetInfo
		send "Q"
	else
		send "** "
	end
	if ((SECTOR.PLANETCOUNT[$CURRENT_SECTOR] <= 1) AND ($PLANET_SCANNER = "No"))
		send "'{" & $bot_name & "} - Must be more than one planet in sector if bot doesn't have planet scanner*"
		if ($startingLocation = "Citadel")
			gosub :landingSub
		end
		goto :wait_for_command
	end
        send "L"
	setTextTrigger beginscan :Planet_Listing_beginscan "Atmospheric maneuvering system engaged"
	pause
:Planet_Listing_beginscan
	gosub :killthetriggers
	setTextLineTrigger nothing2do :Planet_Listing_nothing2do "You can create one with a Genesis Torpedo"
	setTextTrigger pscandone :Planet_Listing_pscandone "Land on which planet"
	setTextLineTrigger line_trig :Planet_Listing_parse_scan_line
	pause
:Planet_Listing_nothing2do
	gosub :killthetriggers
	waitOn "(?="
	send "'{" & $bot_name & "} - No Planets In Sector!*"
	goto :Wait_for_command
:Planet_Listing_parse_scan_line
	killTrigger line_trig
	setVar $s CURRENTLINE
	if (($s = "") OR ($s = 0))
		setVar $s "          "
	end
	replaceText $s "        Level" "Lvl"
	replaceText $s "-----------------------------------------------" "-------------------------------------------"
	replaceText $s "        Citadel" "Citadel"
	replaceText $s "l Fighters Q" "l  Figs Q"
	getLength $s $length
	if ($length > 70)
		cutText $s $s 1 70
	end
	setVar $planetOutput $planetOutput&$s&"*"
	gosub :killthetriggers
	goto :Planet_Listing_beginscan
:Planet_Listing_pscandone
	setVar $strlocal ""
	gosub :killthetriggers
	setVar $idx 1
	if (($PLANET <> 0) AND ($CURRENT_SECTOR <> 1))
		send $PLANET & "* c "
		setVar $message "On Planet #" & $planet & "*"
	else
		send " * "
		setVar $message ""
	end
	waitOn "(?="
	send "'*"
	waitOn "Comm-link open on sub-space band"
	send $planetOutput
	send "**"
	waitOn "Sub-space comm-link terminated"
	gosub :switchboard
	goto :wait_for_command
# ============================== END PLANET LIST (PLIST) Sub ==============================
# ======================     START INVADE MACROS SUBROUTINE    ==========================
:pex
:pel
:pelk
:ped
:pe
	gosub :check_invade_macro_params
	setVar $speed_invade_macro 	$enter&"     *  "
	setVar $normal_invade_macro 	$enter&"*            "
	goto :start_invade_macro
:pxex
:pxel
:pxelk
:pxe
:pxed
	gosub :check_invade_macro_params
	setVar $speed_invade_macro 	$xport&$enter&"       * "
	setVar $normal_invade_macro 	$xport&$enter&"** "
	goto :start_invade_macro
:start_invade_macro
	if ($startingLocation = "Citadel")
		setVar $mac_starting $photon&"q  q  "
	else
		setVar $mac_starting $photon&"  "
	end
	if ($command = "pxex")
		setVar $mac_ending 		"x   "&$parm3&"*  q  q  z  n"
		setVar $ends_in_sector 		TRUE
	elseif ($command = "pex")
		setVar $mac_ending 		"x    "&$parm2&"*  q  q  *  z  n  *  "
		setVar $ends_in_sector 		TRUE
	elseif ($command = "pel")
		setVar $mac_ending 		"l "&$parm2&"*  *"
		setVar $ends_in_sector 		FALSE
	elseif ($command = "pxel")
		setVar $mac_ending 		"l "&$parm3&"*  *  "
		setVar $ends_in_sector 		FALSE
	elseif ($command = "pxelk")
		setVar $mac_ending 		"l "&$parm3&"*  *  a"&$SHIP_MAX_ATTACK&"*"
		setVar $ends_in_sector 		FALSE
	elseif ($command = "pelk")
		setVar $mac_ending 		"l "&$parm2&"*  *  a"&$SHIP_MAX_ATTACK&"*"
		setVar $ends_in_sector 		FALSE
	elseif (($command = "pxed") OR ($command = "ped"))
		setVar $mac_ending 		"u  y  n  . *  j  c  *  "
		setVar $ends_in_sector		FALSE
	else
		setVar $mac_ending 		""
		setVar $ends_in_sector 		FALSE
	end
	if (($startingLocation = "Citadel") AND ($ends_in_sector = TRUE))
		setVar $mac_ending $mac_ending&"l "&$PLANET&" * c"
	end
	setVar $mac_ending $mac_ending&"@"
	#CHECK THE CLOCK TO OPTIMIZE PHOTON FIRING
	send "  t"
	waitfor ", 2"
	getWord CURRENTLINE $initTime 1
	:Photon_Attack_Timer
		send "  t"
		waitfor ", 2"
		getWord CURRENTLINE $currentTime 1
		waitfor "Computer"
		if ($initTime <> $currentTime)
			if ($speed = TRUE)
				send $mac_starting&$speed_invade_macro&$mac_ending
			else
				send $mac_starting&$normal_invade_macro&$mac_ending
			end
		else
			goto :Photon_Attack_Timer
		end
	#OUTPUT THE RESULTS OF THE DAMAGE IF REQUESTED
	if ($speed = FALSE)
		setVar $i 1
		setTextLineTrigger damage 			:collect_damage 	"The console reports damages of "
		setTextLineTrigger damage_done 	:damage_done 		"Average Interval Lag:"
		setTextLineTrigger damage_pod 	:collect_pod 		"You rush to an escape pod and abandon ship..."
		pause
		:collect_damage
			setVar $scan_array[$i] CURRENTLINE
			add $i 1
			setTextLineTrigger damage :collect_damage "The console reports damages of "
			pause
		:collect_pod
			setVar $scan_array[$i] CURRENTLINE
			add $i 1
		:damage_done
			gosub :killthetriggers
			if ($i > 1)
				setVar $j 1
				send "'*"
				setTextLineTrigger comm :continuedamage "Comm-link open on sub-space band"
				pause
				:continuedamage
					while ($j < $i)
						send $scan_array[$j] & "*"
						add $j 1
					end
					send "*"
					setTextLineTrigger comm2 :continuedamage2 "Sub-space comm-link terminated"
					pause
				:continuedamage2
			end
	end
	goto :wait_for_command
:check_invade_macro_params
	gosub :killthetriggers
	setArray $scan_array 1000
	gosub :quikstats
	setVar $validPrompts "Citadel Command"
	gosub :checkStartingPrompt
	if ($SHIP_MAX_ATTACK <= 0)
		gosub :getShipStats
	end
	#VALIDATION OF PHOTONS
	if ($PHOTONS <= 0)
		send "'{" $bot_name "} - This command requires a photon*"
		goto :wait_for_command
	end
	#VALIDATION OF XPORT SHIP
	isNumber $test $parm2
	if ((($test = FALSE) or ($parm2 = 0)) AND ($command <> "pe") AND ($command <> "ped"))
		send "'{" $bot_name "} - Parameter 2 invalid*"
		goto :wait_for_command
	end
	#CHECK FOR SHIP/PLANET NUMBER IN PARAMETER 3
	isNumber $test $parm3
	if (($test = FALSE) or ($parm3 = 0))
		if ($command = "pxex")
			setvar $parm3 $SHIP_NUMBER
		elseif (($command = "pxel") OR ($command = "pxelk"))
			send "'{" $bot_name "} - Planet Parameter in-valid*"
			goto :wait_for_command
		end
	end
	#VALIDATION OF ATTACK SECTOR
	isNumber $test $parm1
	if ($test = FALSE)
		send "'{" $bot_name "} - Sector Parameter in-valid*"
		goto :wait_for_command
	end
	if (($parm1 > 10) AND ($parm1 <= SECTORS) AND ($parm1 <> STARDOCK))
	else
		send "'{" $bot_name "} - Invalid attack sector entered*"
		goto :wait_for_command
	end
	#MAKE SURE ATTACK SECTOR IS ADJACENT
	setVar $i 1
	setVar $isFound false
	while (SECTOR.WARPS[$CURRENT_SECTOR][$i] > 0)
		if (SECTOR.WARPS[$current_Sector][$i] = $parm1)
			setVar $isFound TRUE
		end
		add $i 1
	end
	if ($isFound = FALSE)
		send "'{" $bot_name "} - Cannot continue.  Sector not Adjacent, aborting..*"
		goto :wait_for_command
	end
	getWordPos " "&$user_command_line&" " $pos "speed"
	if ($pos > 0)
		setVar $speed TRUE
	else
		setVar $speed FALSE
	end
    	#CLEARING THE ATTACK SECTOR
    	send " c v * y * "&$parm1&"*  "
	#GET PLANET NUMBER IF STARTING FROM CITADEL
	if ($startingLocation = "Citadel")
        	send " q  q"
        	gosub :getPlanetInfo
        	send "  C C  "
	end
	setVar $enter 	"m  "&$parm1&"*"
	setVar $xport 	"x   "&$parm2&"*  q  z  n  "
	setVar $photon	"  p y"&$parm1&"*  q  "
return
# ======================     END P Commands (P???) SUBROUTINE    ==========================
#=============================== AUTO KILL ==========================================
:autoKill
:kill
	gosub :killthetriggers
	gosub :quikstats
	setVar $startingLocation $CURRENT_PROMPT
	if ($startingLocation <> "Command")
		if ($startingLocation = "Citadel")
			if ($mode <> "Citkill")
				setVar $user_command_line "citkill on override"
				goto :runUserCommandLine
			else
			    	setVar $user_command_line "citkill off"
				goto :runUserCommandLine
			end
		end
		setVar $message "Wrong prompt for auto kill.*" 
		gosub :switchboard
		goto :wait_for_command
	end
	if ($SHIP_MAX_ATTACK <= 0)
		gosub :getShipStats
	end
	goSub :getSectorData
	goSub :fastAttack
	goto :wait_for_command
:fastAttack
	setVar $targetString  "a"
	setVar $isFound FALSE
	getWordPos $sectorData $beaconPos "[0m[35mBeacon  [1;33m:"
	:checkingFigs
		if ($FIGHTERS > 0)
			if ((($CURRENT_SECTOR > 10) AND ($CURRENT_SECTOR <> STARDOCK)) AND ($beaconPos > 0))
				setVar $targetString $targetString&"*"
			end
		else
			gosub :quikstats
			if ($FIGHTERS <= 0)
				echo ANSI_12 "*You have no fighters.*" ANSI_7
				goto :stoppingPoint
			else
				goto :checkingFigs
			end
		end
	if (($emptyShipCount + $fakeTraderCount + $realTraderCount) > 0)
		setVar $i 0
		while ($i < ($emptyShipCount + $fakeTraderCount))
			setVar $targetString $targetString&"* "
			add $i 1
		end
		setVar $c 1
		while (($c <= $realTraderCount) AND ($isFound = FALSE))

			if (($TRADERS[$c][1]) = ($CORP))
				setVar $targetString $targetString&"* "
			elseif ((($CURRENT_SECTOR <= 10) OR ($CURRENT_SECTOR = STARDOCK)) AND $TRADERS[$c][2] = TRUE)
				setVar $targetString $targetString&"* "
			else
				setVar $isFound TRUE
				setVar $targetString $targetString&"zy z"
			end
			add $c 1
		end
	else
		setVar $message "You have no targets.*" 
		gosub :switchboard
		goto :stoppingPoint
	end
	if ($isFound = TRUE)
		setVar $attackString ""
		while ($FIGHTERS > 0)
			if ($FIGHTERS < $SHIP_MAX_ATTACK)
				setVar $attackString $attackString&$targetString&$FIGHTERS&"* * "
				setVar $FIGHTERS 0
			else
				setVar $attackString $attackString&$targetString&$SHIP_MAX_ATTACK&"* * "
				setVar $FIGHTERS ($FIGHTERS - $SHIP_MAX_ATTACK)
			end
		end
	else
		setVar $message "You have no valid targets.*" 
		gosub :switchboard
		goto :stoppingPoint
	end
	send $attackString&"* "
	gosub :quikstats
	:stoppingPoint
return
#============================ END AUTO KILL ============================================
#============================== START AUTO CAPTURE =======================================
:autoCap
:cap
	gosub :killthetriggers
	gosub :quikstats
	setVar $startingLocation $CURRENT_PROMPT
	if ($startingLocation <> "Command")
		if ($startingLocation = "Citadel")
			if ($mode <> "Citcap")
				fileExists $CAP_FILE_chk $CAP_FILE
				if ($CAP_FILE_chk <> TRUE)
					gosub :getShipCapStats
				end
				setVar $user_command_line "citcap on"
				goto :runUserCommandLine
			else
				setVar $user_command_line "citcap off"
				goto :runUserCommandLine
			end
		end
		setVar $message "Wrong prompt for auto capture.*"
		gosub :switchboard
		goto :wait_for_command
	end
	getWordPos $user_command_line $pos "alien"
	if ($pos > 0)
		setVar $onlyAliens TRUE
	else
		setVar $onlyAliens FALSE
	end
	fileExists $CAP_FILE_chk $CAP_FILE
	if ($CAP_FILE_chk <> TRUE)
		gosub :getShipCapStats
	end
	if ($SHIP_OFFENSIVE_ODDS <= 0)
		gosub :getShipStats
	end
	setVar $lastTarget ""
	setVar $thisTarget ""
	goSub :getSectorData
	goSub :fastCapture
	goto :wait_for_command
:fastCapture
	setVar $isFound FALSE
	setVar $targetIsAlien FALSE
	setVar $stillShields FALSE
	getWordPos $sectorData $beaconPos "[0m[35mBeacon  [1;33m:"
	:checkingFigs
		if ($FIGHTERS > 0)
		else
			gosub :quikstats
			if ($FIGHTERS <= 0)
				setVar $message "No fighters on ship.*" 
				gosub :switchboard
				goto :capstoppingPoint
			else
				goto :checkingFigs
			end
		end
	if (($realTraderCount > $corpieCount) AND ($onlyAliens <> TRUE))
		setVar $targetString "a "
		if ((($CURRENT_SECTOR > 10) AND ($CURRENT_SECTOR <> $STARDOCK)) AND ($beaconPos > 0))
			setVar $targetString $targetString&"* "
		end
		setVar $i 0
		while ($i < ($emptyShipCount + $fakeTraderCount))
			setVar $targetString $targetString&"* "
			add $i 1
		end
		setVar $c 1
		while (($c <= $realTraderCount) AND ($isFound = FALSE))
			if ((($CURRENT_SECTOR <= 10) OR ($CURRENT_SECTOR = STARDOCK)) AND $TRADERS[$c][2] = TRUE)
				setVar $targetString $targetString&"* "
			elseif ($TRADERS[$c][1] = $CORP)
				setVar $targetString $targetString&"* "
			elseif (($targetingCorp = TRUE) AND ($TRADERS[$c][1] <> $target))
				setVar $targetString $targetString&"* "
			elseif (($targetingPerson = TRUE) AND ($TRADERS[$c] <> $target))
				setVar $targetString $targetString&"* "
			else
				setVar $isFound TRUE
				setVar $targetString $targetString&"zy z"
			end
			add $c 1
		end
	end
	if ((($fakeTraderCount > 0) AND ($cappingAliens = TRUE)) AND ($isFound <> TRUE))
		setVar $targetString "a "
		if ((($CURRENT_SECTOR > 10) AND ($CURRENT_SECTOR <> $STARDOCK)) AND ($beaconPos > 0))
			setVar $targetString $targetString&"* "
		end
		setVar $a 1
		while (($a <= $fakeTraderCount) AND ($isFound = FALSE))
			getWordPos $FAKETRADERS[$a] $pos "Zyrain"
			getWordPos $FAKETRADERS[$a] $pos2 "Clausewitz"
			getWordPos $FAKETRADERS[$a] $pos3 "Nelson"
			if (($pos <= 0) AND ($pos2 <= 0) AND ($pos3 <= 0))
				setVar $i 0
				setVar $isFound TRUE
				setVar $targetIsAlien TRUE
				setVar $targetString $targetString&"zy z"
			else
				setVar $targetString $targetString&"* "
			end
			add $a 1
		end
	end
	if (($isFound = FALSE) AND ($emptyshipcount > 0) AND ($CURRENT_SECTOR > 10) AND ($CURRENT_SECTOR <> STARDOCK))
		setVar $targetString  "a "
		if ((($CURRENT_SECTOR > 10) AND ($CURRENT_SECTOR <> STARDOCK)) AND ($beaconPos > 0))
			setVar $targetString $targetString&"* "
		end
		setVar $c 1
		setVar $isFound FALSE
		while (($c <= $emptyShipCount) AND ($isFound = FALSE))
			if (($EMPTYSHIPS[$c] = $CORP) OR ($EMPTYSHIPS[$c] = $TRADER_NAME))
				setVar $targetString $targetString&"* "	
			else
				setVar $isFound TRUE
				setVar $targetString $targetString&"zy z"
			end
			add $c 1
		end
	end
	if ($isFound = FALSE)
		setVar $message "You have no targets.*" 
		gosub :switchboard
		goto :capstoppingPoint
	else
		setVar $attackString ""
		:cap_ship
			#get own offensive odds
			setVar $unmanned "NO"
			setVar $own_odds $SHIP_OFFENSIVE_ODDS
			setVar $cap_points 0
			setVar $max_figs 0
			setVar $cap_shield_points 0
			setVar $ship_fighters 0
			setVar $lastTarget ""
		while ($FIGHTERS > 0)
			setVar $stillShields FALSE
			setVar $isSameTarget FALSE
			:cgoahead
				setTextTrigger	foundcaptarget  :foundcaptarget	 "(Y/N) [N]? Y"
				setTextLineTrigger noctarget	:nocappingtargets "Do you want instructions (Y/N) [N]?"
				send $targetString
				pause
			:foundcaptarget
				killtrigger noctarget
				killtrigger foundcaptarget
				setVar $cap_ship_info CURRENTLINE
				setVar $thisTarget CURRENTANSILINE
				getWord $cap_ship_info $attack_prompt 1
				if ($attack_prompt <> "Attack")
					goto :wait_for_command
				end
				getWordPos $thisTarget $pos "[0;33m([1;36m"
				cutText $thisTarget $thisTarget 1 $pos
				if ($thisTarget = $lastTarget)
					setVar $isSameTarget TRUE
				elseif ($lastTarget = "")
					setVar $lastTarget $thisTarget
				else
					goto :nocappingtargets
				end
				#find out the ship type
				if ($isSameTarget)
					goto :send_attack
				end
			:ship_type
				setVar $type_count 0
				setVar $is_ship 0
				while ($type_count < $shipCounter)
					add $type_count 1
					getWordPos $cap_ship_info $is_ship $shipList[$type_count]
					getWordPos $cap_ship_info $unman "'s unmanned"
					if ($unman > 0)
						setVar $unmanned "YES"
					else
						setVar $unmanned "NO"
					end
					if (($is_ship > 0) AND ($shipList[$type_count] <> "0"))
						getWord $ship[$shipList[$type_count]] $shields 1
						getWord $ship[$shipList[$type_count]] $defodds 2
						goto :send_attack
					end
				end
				setVar $message "Unknown ship type, cannot calculate attack, you must do it manually.*" 
				gosub :switchboard
				send "* "
				return
			:send_attack
				gosub :killthetriggers
				getText $cap_ship_info $ship_fighters $shipList[$type_count] "(Y/N)"
				getText $ship_fighters $ship_fighters "-" ")"
				stripText $ship_fighters ","
				setVar $ship_shield_percent 0
				setVar $shieldpoints 0
				setTextLineTrigger combat :combat_scan "Combat scanners show enemy shields at"
				setTextTrigger nocombat :cap_it "How many fighters do you wish to use"
				setTextLineTrigger notarget :nocappingtargets "Do you want instructions (Y/N) [N]?"
				pause
			:combat_scan
				getWord CURRENTLINE $shieldperc 7
				stripText $shieldperc "%"
				setVar $shieldPoints (($shields * $shieldperc) / 100)
				setVar $stillShields TRUE
				pause
			:cap_it
				killtrigger combat_scan
				killtrigger cap_it
				killtrigger notarget
				getWord CURRENTLINE $max_figs 11
				stripText $max_figs ","
				stripText $max_figs ")"
				setVar $cap_points (($shieldPoints + $ship_fighters) * $defodds)
				if ((($defenderCapping = TRUE) AND ($unmanned <> "YES")) AND ($targetIsAlien = TRUE))
					if ($ship_fighters > 100)
						setVar $figbuffer (($ship_fighters * 2)/100)
					else
						setVar $figbuffer 0
					end
					if ($stillShields = TRUE)
						setVar $cap_points ($cap_points / $own_odds)	
					else
						setVar $cap_points 1
					end
				else
					setVar $cap_points (($cap_points / $own_odds) - ($cap_points/100))
				end
				setVar $cap_points (($cap_points * 95) / 100)
				if ($unmanned = "YES")
					divide $cap_points 2
				end
				if ($cap_points <= 0)
					setVar $cap_points 1
				elseif ($cap_points > $max_figs)
					setVar $cap_points $max_figs
				end
				setVar $sendAttack $cap_points&"*"
				if ($startingLocation = "Citadel")
					setVar $sendAttack $sendAttack&$refurbString
				end
				send $sendAttack
				setVar $FIGHTERS ($FIGHTERS-$cap_points)
		:keepcapping
		end
	end
	goto :capStoppingPoint
	:nocappingtargets
		killtrigger noctarget
		killtrigger foundcaptarget
		send "* "
	:capStoppingPoint
return
#================================ END AUTO CAPTURE ===================================
#========================= AUTO REFURB SUB ===============================================
:scrub
	setVar $scrubonly TRUE
:autorefurb
:refurb
	gosub :killthetriggers
	if ($self_command <> TRUE)
		gosub :quikstats
	end
	getWord CURRENTLINE $startingLocation 1
	if (($startingLocation <> "Command") AND ($startingLocation <> "Citadel"))
		gosub :current_prompt
		setVar $validPrompts "Citadel Command"
		gosub :checkStartingPrompt
	end
	if (CURRENTSECTOR = STARDOCK)
		send "p ss ys *p"
	elseif ((CURRENTSECTOR = 1) OR (PORT.CLASS[CURRENTSECTOR] = 0))
		if ($startingLocation = "Citadel")
			send "q "
			gosub :getPlanetInfo
			send "q "
		end
		send "p ty"
	else
		setVar $message "No known class 0 or 9 port here to refurb at.*" 
		gosub :switchboard
		goto :wait_for_command
	end
	setVar $message ""
	setTextLineTrigger limpet 	:markLimpet 	"After an intensive scanning search, they find and remove the Limpet"
	setTextLineTrigger limpetno 	:markLimpetNo 	"The port official frowns at you (you haven't the funds!) and storms"
	setTextLineTrigger fighter 	:buyfighters	"B  Fighters        :"
	pause
	:markLimpet
		setVar $message "Limpet scrubbed off of hull.*"
		pause
	:markLimpetNo
		setVar $message "Limpet exists, but not enough cash to get scrubbed.*"
		pause	
	:buyfighters
		gosub :killthetriggers
		if ($scrubonly = FALSE)
			getWord CURRENTLINE $figsToBuy 8
			waitOn " credits per point "
			getWord CURRENTLINE $shieldsToBuy 9
			send "b "&$figsToBuy&"* c "&$shieldsToBuy&"* q q q * "
		else
			send "b 0* c 0* q q q * "
		end
		if ($startingLocation = "Citadel")
			gosub :landingSub
		end
		gosub :quikstats
		if ($message <> "")
			gosub :switchboard
		end
goto :wait_for_command
#=============================== END AUTO REFURB =========================================
#============================== BOT PROMPT COMMUNICATION =================================
:ss
	cutText $user_command_line $user_command_line 2 9999
	send "'"&$user_command_line&"*"
	goto :wait_for_command
:fed
	cutText $user_command_line $user_command_line 2 9999
	send "`"&$user_command_line&"*"
	goto :wait_for_command
#============================ END BOT PROMPT COMMUNICATION ================================
:about
:version
	gosub :doSplashScreen
	echo "*" CURRENTANSILINE
	goto :wait_for_command
# ======================== START TURN BOT ON/OFF (BOT) SUBROUTINE =========================
:bot
	setVar $message ""
	if ($parm1 = "on")
		setVar $botIsOff FALSE
		setVar $message "Bot Active*"
	end
	if ($parm1 = "off")
		setVar $botIsOff TRUE
		setVar $message "Bot Deactivated*"
	end
	if (($parm1 <> "off") AND ($parm1 <> "on"))
		setVar $message "That status option is unknown..*"
	end
	gosub :switchboard
goto :wait_for_command
:relog
	setVar $message ""
	if ($parm1 = "on")
		setVar $message "Relog Active*"
		setVar $doRelog TRUE
	end
	if ($parm1 = "off")
		setVar $message "Relog Deactivated*"
		setVar $doRelog FALSE
	end
	if (($parm1 <> "off") AND ($parm1 <> "on"))
		setVar $message "Please use relog [on/off] format.*"
		goto :wait_for_command
	end
	saveVar $doRelog
	gosub :switchboard
goto :wait_for_command
# ====================== END TURN BOT ON/OFF (BOT) SUBROUTINE ==========================
#============================= REFRESH BOT SUB ===============================================
:refresh
	gosub :quikstats
	setVar $validPrompts "Citadel Command"
	gosub :checkStartingPrompt
	gosub :getInfo
	gosub :getShipStats
	fileExists $CAP_FILE_chk $CAP_FILE
	if ($CAP_FILE_chk)
		gosub :loadshipinfo
	else
		gosub :getShipCapStats
		gosub :loadShipInfo
	end
	send "'{" & $bot_name & "} - Bot data refresh completed.*"
goto :wait_for_command
#========================== END REFRESH BOT SUB =================================================
#####===================================  END BOT INTERNAL HOTWIRED COMMANDS SECTION ==================================#####
#####==========================================  BOT HELPER FUNCTIONS SECTION =========================================#####
#============================= LOAD SHIP CATALOG DATA ========================================
:loadShipInfo
	setVar $shipcounter 1
	:readshiplist
	read $cap_file $shipInf $shipcounter
	if ($shipInf <> "EOF")
		getWord $shipInf $shields 1
		getLength $shields $shieldlen
		getWord $shipInf $defodd 2
		getLength $defodd $defoddlen
		getWord $shipinf $off_odds 3
		getLength $off_odds $filler1len
		getWord $shipinf $ship_cost 4
		getLength $ship_cost $filler2len
		getWord $shipinf $max_holds 5
		getLength $max_holds $filler3len
		getWord $shipinf $max_fighters 6
		getLength $max_fighters $filler4len
		getWord $shipinf $init_holds 7
		getLength $init_holds $filler5len
		getWord $shipinf $tpw 8
		getLength $tpw $filler6len
		getWord $shipinf $isDefender 9
		getLength $isDefender $filler7len
		setVar $startlen ($shieldlen + $defoddlen + $filler1len + $filler2len + $filler3len + $filler4len + $filler5len + $filler6len + $filler7len + 10)
		cutText $shipinf $ShipName $startlen 999
		setVar $ship[$ShipName] $shields & " " & $defodd
		setVar $shipList[$shipcounter] $ShipName
		setVar $shipList[$shipcounter][1] $shields
		setVar $shipList[$shipcounter][2] $defodd
		setVar $shipList[$shipcounter][3] $off_odds
		setVar $shipList[$shipcounter][4] $max_holds
		setVar $shipList[$shipcounter][5] $max_fighters
		setVar $shipList[$shipcounter][6] $init_holds
		setVar $shipList[$shipcounter][7] $tpw
		setVar $shipList[$shipcounter][8] $isDefender
		setVar $shipList[$shipcounter][9] $ship_cost
		add $shipcounter 1
		goto :readshiplist
	end
	setVar $shipStats TRUE
return
:getShipCapStats
	send "cn"
	waitOn "(2) Animation display"
	getWord CURRENTLINE $ansi_onoff 5
	if ($ansi_onoff = "On")
		send "2qq"
	else
		send "qq"
	end
	setArray $alpha 20
	delete $CAP_FILE
	setVar $alpha[1] "A"
	setVar $alpha[2] "B"
	setVar $alpha[3] "C"
	setVar $alpha[4] "D"
	setVar $alpha[5] "E"
	setVar $alpha[6] "F"
	setVar $alpha[7] "G"
	setVar $alpha[8] "H"
	setVar $alpha[9] "I"
	setVar $alpha[10] "J"
	setVar $alpha[11] "K"
	setVar $alpha[12] "L"
	setVar $alpha[13] "M"
	setVar $alpha[14] "N"
	setVar $alpha[15] "O"
	setVar $alpha[16] "P"
	setVar $alpha[17] "R"
	setVar $alphaloop 0
	setVar $totalships 0
	setVar $nextpage 1
	send "CC?"
	waitOn "(?=List) ?"
	#get ship specifications
	:shp_loop
		setTextLineTrigger grab_ship :shp_shipnames
		pause
	:shp_shipnames
		if (CURRENTLINE = "")
			goto :shp_loop
		end
		getWord CURRENTLINE $stopper 1
		if ($stopper = "<+>")
			send "+"
			waitOn "(?=List) ?"
			setVar $nextpage 1
			goto :shp_loop
		elseif ($stopper = "<Q>")
			goto :shp_getShipStats
		end
		if ($nextpage = 1)
			setVar $shipName CURRENTLINE
			stripText $shipName "<A> "
			if ($shipName = $FirstshipName)
				goto :shp_getShipStats
			end
			setVar $nextpage 0
		end
		add $totalships 1
		if ($totalships = 1)
			setVar $FirstshipName CURRENTLINE
			stripText $FirstshipName "<A> "
		end
		goto :shp_loop
	:shp_getShipStats
		setVar $shipStatLoop 0
	:shp_shipStats
		while ($shipStatLoop < $totalships)
				add $shipStatLoop 1
				add $alphaloop 1
				if ($alphaloop > 17)
					send "+"
					setVar $alphaloop 1
				end
				send $alpha[$alphaloop]
				setTextlineTrigger sn :sn "Ship Class :"
				pause
			:sn
				setVar $line CURRENTLINE
				getWordPos $line $pos ":"
				add $pos 2
				cutText $line $ship_Name $pos 999
				setTextLineTrigger hc :hc "Basic Hold Cost:"
				pause
			:hc
				setVar $line CURRENTLINE
				stripText $line "Basic Hold Cost:"
				stripText $line "Initial Holds:"
				stripText $line "Maximum Shields:"
				getWord $line $init_holds 2
				getWord $line $max_Shields 3
				stripText $max_Shields ","
				setTextLineTrigger oo :oo2 "Offensive Odds:"
				pause
			:oo2
				setVar $line CURRENTLINE
				stripText $line "Main Drive Cost:"
				stripText $line "Max Fighters:"
				stripText $line "Offensive Odds:"
				getWord $line $max_figs 2
				getWord $line $off_odds 3
				stripText $max_figs ","
				stripText $off_odds ":1"
				stripText $off_odds "."
				setTextLineTrigger do :do "Defensive Odds:"
				pause
			:do
				setVar $line CURRENTLINE
				stripText $line "Computer Cost:"
				stripText $line "Turns Per Warp:"
				stripText $line "Defensive Odds:"
				getWord $line $def_odds 3
				stripText $def_odds ":1"
				stripText $def_odds "."
				getWord $line $tpw 2
				setTextLIneTrigger sc :sc "Ship Base Cost:"
				pause
			:sc
				setVar $line CURRENTLINE
				stripText $line "Ship Base Cost:"
				getWord $line $cost 1
				stripText $cost ","
				getLength $cost $costLen
				if ($costLen = 7)
					add $cost 10000000
				end
				setTextLineTrigger mh :mh "Maximum Holds:"
				pause
			:mh
				setVar $line CURRENTLINE
				stripText $line "Maximum Holds:"
				getWord $line $max_holds 1
				setVar $isDefender FALSE
				write $cap_file $max_shields & " " & $def_odds & " " & $off_odds & " " & $cost & " " & $max_holds & " " & $max_figs & " " & $init_holds & " " & $tpw & " " & $isDefender & " " & $ship_name
		end
		send "qq"
return
#=====================================END LOAD SHIP CATALOG INFO ======================================
# ============================== START GET PLANET STATS TRIGGERS==============================
:setPlanetNumber
	getWordPos RAWPACKET $pos "Planet " & #27 & "[1;33m#" & #27 & "[36m"
	if ($pos > 0)
		getText RAWPACKET $PLANET "Planet " & #27 & "[1;33m#" & #27 & "[36m" #27 & "[0;32m in sector "
		saveVar $PLANET
	end
	setTextLineTrigger	getPlanetNumber	:setPlanetNumber 	"Planet #"
	pause
# =============================== END GET PLANET STATS TRIGGERS===============================
# ============================== CHANGE GRID ================================================
:fedEraseFig
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "The")
		goto :endFedEraseFig
	end
	getText CURRENTLINE&"  [XX][XX][XX]" $temp " fighters in sector " ". [XX][XX][XX]"
	if ($temp <> "")
		isNumber $test $temp
		if ($test = TRUE)
			if (($temp <= SECTORS) AND ($temp > 0))
				setVar $target $temp
				gosub :removeFigFromData
			end
		end
	end
:endFedEraseFig
	setTextLineTrigger	federase		:fedEraseFig		"The Federation We destroyed "
	pause
:eraseFig
	cutText CURRENTLINE&"     " $spoof 1 2 
	cutText CURRENTLINE&"     " $spoof2 1 1 
	if (($spoof = "R ") OR ($spoof = "F ") OR ($spoof = "P ") OR ($spoof2 = "'") OR ($spoof2 = "`"))
		goto :endEraseFig
	end
	getText CURRENTLINE&" [XX][XX][XX]" $temp " destroyed " " [XX][XX][XX]"
	if ($temp <> "")
		getWord $temp $fig_hit 7
		getWord $temp $fig_number 1
		isNumber $test $fig_hit 
		if (($test = TRUE) AND ($fig_number <> "0"))
			if (($fig_hit <= SECTORS) AND ($fig_hit > 0))
				setVar $target $fig_hit
				gosub :removeFigFromData
			end
		end
	end
:endEraseFig
	setTextLineTrigger fighterserase :eraseFig " of your fighters in sector "
	pause
:eraseWarpFig
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "You")
		setTextLineTrigger      warpfigerase		:eraseWarpFig		"You do not have any fighters in Sector "
		pause
	end
	getText CURRENTLINE&" [XX][XX][XX]" $temp "You do not have any fighters in Sector " ". [XX][XX][XX]"
	if ($temp <> "")
		isNumber $test $temp 
		if ($test)
			if (($temp <= SECTORS) AND ($temp > 0))
				setVar $target $temp
				gosub :removeFigFromData
			end
		end
	end
	setTextLineTrigger      warpfigerase		:eraseWarpFig		"You do not have any fighters in Sector "
	pause
:addFig
	isNumber $test CURRENTSECTOR
	if ($test)
		if ((CURRENTSECTOR > 10) AND (CURRENTSECTOR < SECTORS))
			setVar $target CURRENTSECTOR
			gosub :addFigToData
		end
	end
	setTextLineTrigger      fightersadd		:addFig			"Should they be (D)efensive, (O)ffensive or Charge a (T)oll ?"
	pause
:erasebusts
	cutText CURRENTLINE&"   " $spoof 1 1
	if ($spoof <> "R")
		setTextLineTrigger	clearbusts		:erasebusts		">[Busted:"
		pause
	end
	getText CURRENTLINE&" [XX][XX][XX]" $temp ">[Busted:" "]<"
	if ($temp <> "")
		isNumber $test $temp
		if ($test)
			if (($temp <= SECTORS) AND ($temp > 0))
				setSectorParameter $temp "BUSTED" FALSE
			end
		end
	end
	setTextLineTrigger	clearbusts		:erasebusts		">[Busted:"
	pause
#send "'<"&$subspace&">[Busted:"&$lastBustSector&"]<"&$subspace&">* c"
# ============================== END CHANGE GRID ========================================
# ============================== CHECK SECTOR DATA ========================================
:checkSectorData
	getText CURRENTLINE $cursec "]:[" "] ("
	if ($cursec = CURRENTSECTOR)
		setVar $CURRENT_SECTOR $cursec
		getSectorParameter $CURRENT_SECTOR "BUSTED" $isBusted
		setvar $isbusted "0"
		if ($isBusted)
			echo ANSI_5 "[" ANSI_12 "BUSTED" ANSI_5 "] : "
		end
		getSectorParameter $CURRENT_SECTOR "MSLSEC" $isMSL
		setvar $isMSL "0"
		if ($isMSL)
			echo ANSI_5 "[" ANSI_9 "MSL" ANSI_5 "] : "
		end
	end
	setTextTrigger	sectordata		:checkSectorData	"(?=Help)? :"
	pause
# ============================ END CHECK SECTOR DATA ========================================
# ============================== START GET SHIP STATS TRIGGERS==============================
:setShipOffensiveOdds
	setvar $kk 1
	setvar $zline[$kk] CURRENTLINE
	striptext $zline[$kk] "Main Drive Cost:"
	striptext $zline[$kk] "Max Fighters:"
	striptext $zline[$kk] "Offensive Odds:"
	striptext $zline[$kk] ","
	striptext $zline[$kk] ":1"
	striptext $zline[$kk] "."
	getword $zline[$kk] $SHIP_OFFENSIVE_ODDS 3
	getword $zline[$kk] $SHIP_FIGHTERS_MAX 2
	add $kk 1
	setTextLineTrigger	getshipstats	:setShipOffensiveOdds	"Offensive Odds: "
	pause
:setShipMaxFigAttack
	setvar $kk 1
	setvar $zline[$kk] CURRENTLINE
	striptext $zline[$kk] "Max Figs Per Attack:"
	striptext $zline[$kk] "TransWarp Drive:"
	striptext $zline[$kk] "Planet Scanner:"
	striptext $zline[$kk] ","
	getword $zline[$kk] $SHIP_MAX_ATTACK 1
	setTextLineTrigger	getshipmaxfighters	:setShipMaxFigAttack	" TransWarp Drive:   "
	pause
# ============================== END GET SHIP STATS TRIGGERS==============================
# ----- CN settings -----
:cn
:cn9
	gosub :current_prompt
	setVar $validPrompts "Citadel Command Computer"
	gosub :checkStartingPrompt
	if ($startingLocation = "Computer")
		send "q"
	end
	gosub :startCNsettings
	setVar $message "CN Settings are reset for this bot.*"
	gosub :switchboard
goto :wait_for_command
	
:startCNsettings
    send "CN"
        SetTextLineTrigger ansi1 :cncheck "(1) ANSI graphics            - Off"
        SetTextLineTrigger anim1 :cncheck "(2) Animation display        - On"
        SetTextLineTrigger page1 :cncheck "(3) Page on messages         - On"
        SetTextLineTrigger setsschn :setsschn "(4) Sub-space radio channel"
        SetTextLineTrigger silence1 :cncheck "(7) Silence ALL messages     - Yes"
        SetTextLineTrigger abortdisplay1 :cncheck "(9) Abort display on keys    - ALL KEYS"
        SetTextLineTrigger messagedisplay1 :cncheck "(A) Message Display Mode     - Long"
        SetTextLineTrigger screenpauses1 :cncheck "(B) Screen Pauses            - Yes"
        SetTextLineTrigger onlineautoflee0 :cncdone "(C) Online Auto Flee         - Off"
        SetTextLineTrigger onlineautoflee1 :cncalmostdone "(C) Online Auto Flee         - On"
        pause
 	:cncheck
 		gosub :getCNC
 		pause
        :setsschn
	        getWord CURRENTLINE $subspace 6
		if ($subspace = 0)
			getRnd $subspace 101 60000
			send "4" & $subspace & "*"
		end
		saveVar $subspace
		pause 
	:cncalmostdone
		gosub :getCNC
	:cncdone
        	send "QQ"
        	SetTextTrigger subStartCNcontinue1 :subStartCNcontinue "Command [TL="
        	SetTextTrigger subStartCNcontinue2 :subStartCNcontinue "Citadel command (?=help)"
        	pause
        	:subStartCNcontinue
			gosub :killthetriggers
return
:getCNC
	getWord CURRENTLINE $cnc 1
	stripText $cnc "("
	stripText $cnc ")"
	send $cnc&"  "
return
# ============================== GAME STATS ==============================
:gamestats
	if ($startingLocation = "Citadel")
		send "qqzn"
	end
	if (($startingLocation = "Command") OR ($startingLocation = "Citadel"))
		send "qyn"
		waitfor "Enter your choice"
		send #42 "*"
		setTextLineTrigger settings1 :findGold "Gold Enabled="
		setTextLineTrigger settings2 :findMBBS "MBBS Compatibility="
		setTextLineTrigger settings3 :findAliens "Internal Aliens="
		setTextLineTrigger settings4 :findFerrengi "Internal Ferrengi="
		setTextLineTrigger settings5 :findMaxCommands "Max Commands="
		setTextLineTrigger settings6 :findInactive "Inactive Time="
		setTextLineTrigger settings7 :findColoRegen "Colonist Regen Rate="
		setTextLineTrigger settings8 :findPhotonDur "Photon Missile Duration="
		setTextLineTrigger settings9 :findDebris "Debris Loss Percent="
		setTextLineTrigger settings10 :findTradePercent "Trade Percent="
		setTextLineTrigger settings11 :findProductionRate "Production Rate="
		setTextLineTrigger settings12 :findMaxProductionRate "Max Production Regen="
		setTextLineTrigger settings13 :findMultiplePhotons "Multiple Photons="
		setTextLineTrigger settings14 :findClearBusts "Clear Bust Days="
		setTextLineTrigger settings15 :findStealFactor "Steal Factor="
		setTextLineTrigger settings16 :findRobFactor "Rob Factor="
		setTextLineTrigger settings17 :findPortMax "Port Production Max="
		setTextLineTrigger settings18 :findRadiation "Radiation Lifetime="
		setTextLineTrigger Reregister :Reregister "Reregister Ship="
		setTextLineTrigger settings37 :findLimpetRemoval "Limpet Removal="
		setTextLineTrigger settings20 :findGenesis "Genesis Torpedo="
		setTextLineTrigger settings21 :findArmid "Armid Mine="
		setTextLineTrigger settings22 :findLimpet "Limpet Mine="
		setTextLineTrigger settings23 :findBeacon "Beacon="
		setTextLineTrigger settings24 :findTwarpI "Type I TWarp="
		setTextLineTrigger settings25 :findTwarpII "Type II TWarp="
		setTextLineTrigger settings26 :findTwarpUpgrade "TWarp Upgrade="
		setTextLineTrigger settings27 :findPsychic "Psychic Probe="
		setTextLineTrigger settings28 :findPlanetScanner "Planet Scanner="
		setTextLineTrigger settings29 :findAtomic "Atomic Detonator="
		setTextLineTrigger settings30 :findCorbo "Corbomite="
		setTextLineTrigger settings31 :findEther "Ether Probe="
		setTextLineTrigger settings32 :findPhoton "Photon Missile="
		setTextLineTrigger settings33 :findCloak "Cloaking Device="
		setTextLineTrigger settings34 :findDisruptor  "Mine Disruptor="
		setTextLineTrigger settings35 :findHoloScanner "Holographic Scanner="
		setTextLineTrigger settings36 :findDensityScan "Density Scanner="
		setTextLineTrigger settings38 :findMaxPlanets "Max Planet Sector="
		pause
		:findGold
			getWord CURRENTLINE $check 2
			stripText $check "Enabled="
			if ($check = "True")
				setVar $goldEnabled TRUE
				saveVar $goldEnabled
			else
				setVar $goldEnabled FALSE
				saveVar $goldEnabled
			end
			pause
		:findMaxPlanets
			getWord CURRENTLINE $check 3
			stripText $check "Sector="
			setVar $MAX_PLANETS_PER_SECTOR $check
			saveVar $MAX_PLANETS_PER_SECTOR
			pause
		:findMBBS
			getWord CURRENTLINE $mbbs_ck 2
			stripText $mbbs_ck "Compatibility="
			if ($mbbs_ck = "True")
				setVar $mbbs TRUE
				saveVar $mbbs
			elseif ($mbbs_ck = "False")
				setVar $mbbs FALSE
				saveVar $mbbs
			end
			pause
		:findAliens
			getWord CURRENTLINE $check 2
			stripText $check "Aliens="
			if ($check = "True")
				setVar $internalAliens TRUE
				saveVar $internalAliens
			elseif ($check = "False")
				setVar $internalAliens FALSE
				saveVar $internalAliens
			end
			pause
		:findFerrengi
			getWord CURRENTLINE $check 2
			stripText $check "Ferrengi="
			if ($check = "True")
				setVar $internalFerrengi TRUE
				saveVar $internalFerrengi
			elseif ($check = "False")
				setVar $internalFerrengi FALSE
				saveVar $internalFerrengi
			end
			pause
		:findMaxCommands
			getWord CURRENTLINE $check 2
			stripText $check "Commands="
			setVar $MAX_COMMANDS $check
			saveVar $MAX_COMMANDS
			pause
		:findInactive
			getWord CURRENTLINE $check 2
			stripText $check "Time="
			setVar $INACTIVE_TIME $check
			saveVar $INACTIVE_TIME
			pause
		:findColoRegen
			setVar $line CURRENTLINE
			stripText $line "Colonist Regen Rate="
			stripText $line ","
			lowerCase $line
			replaceText $line "m" "000000"
			replaceText $line "k" "000"
			setVar $colonist_regen $line
			saveVar $colonist_regen
			pause
		:findPhotonDur
			getWord CURRENTLINE $check 3
			stripText $check "Duration="
			setVar $PHOTON_DURATION $check
			saveVar $PHOTON_DURATION
			if ($PHOTON_DURATION <= 0)
				setVar $PHOTONS_ENABLED FALSE
			else
				setVar $PHOTONS_ENABLED TRUE
			end
			saveVar $PHOTONS_ENABLED
			pause
		:findDebris
			getWord CURRENTLINE $check 3
			stripText $check "Percent="
			stripText $check "%"
			setVar $DEBRIS_LOSS $check
			saveVar $DEBRIS_LOSS
			pause
		:findTradePercent
			getWord CURRENTLINE $ptradesetting 2
			stripText $ptradesetting "Percent="
			stripText $ptradesetting "%"
			saveVar $ptradesetting
			pause
		:findProductionRate
			getWord CURRENTLINE $PRODUCTION_RATE 2
			stripText $PRODUCTION_RATE "Rate="
			saveVar $PRODUCTION_RATE
			pause
		:findMaxProductionRate
			getWord CURRENTLINE $PRODUCTION_REGEN 3
			stripText $PRODUCTION_REGEN "Regen="
			saveVar $PRODUCTION_REGEN
			pause
		:findMultiplePhotons
			getWord CURRENTLINE $MULTIPLE_PHOTONS 2
			stripText $MULTIPLE_PHOTONS "Photons="
			saveVar $MULTIPLE_PHOTONS
			pause
		:findClearBusts
			getWord CURRENTLINE $CLEAR_BUST_DAYS 3
			stripText $CLEAR_BUST_DAYS "Days="
			saveVar $CLEAR_BUST_DAYS
			pause
		:findStealFactor
			getWord CURRENTLINE $steal_factor 2
			stripText $steal_factor "Factor="
			stripText $steal_factor "%"
			saveVar $STEAL_FACTOR
			pause
		:findRobFactor
			getWord CURRENTLINE $rob_factor 2
			stripText $rob_factor "Factor="
			stripText $rob_factor "%"
			saveVar $rob_factor
			pause
		:findPortMax
			setVar $line CURRENTLINE
			stripText $line "Port Production Max="
			setVar $port_max $line
			saveVar $port_max
			pause
		:findRadiation
			getWord CURRENTLINE $RADIATION_LIFETIME 2
			stripText $RADIATION_LIFETIME "Lifetime="
			saveVar $RADIATION_LIFETIME
			pause
		:findLimpetRemoval
			getWord CURRENTLINE $LIMPET_REMOVAL_COST 2
			stripText $LIMPET_REMOVAL_COST "Removal="
			stripText $LIMPET_REMOVAL_COST ","
			stripText $LIMPET_REMOVAL_COST "$"
			saveVar $LIMPET_REMOVAL_COST
			setVar  $LSD_LIMPREMOVALCOST $LIMPET_REMOVAL_COST
			saveVar $LSD_LIMPREMOVALCOST
			pause
		:findGenesis
			getWord CURRENTLINE $GENESIS_COST 2
			stripText $GENESIS_COST "Torpedo="
			stripText $GENESIS_COST ","
			stripText $GENESIS_COST "$"
			saveVar $GENESIS_COST
			setVar  $LSD_GENCOST $GENESIS_COST
			saveVar $LSD_GENCOST
			pause
		:findArmid
			getWord CURRENTLINE $ARMID_COST 2
			stripText $ARMID_COST "Mine="
			stripText $ARMID_COST ","
			stripText $ARMID_COST "$"
			saveVar $ARMID_COST
			setVar  $LSD_ARMIDCOST $ARMID_COST
			saveVar $LSD_ARMIDCOST
			pause
		:findLimpet
			getWord CURRENTLINE $LIMPET_COST 2
			stripText $LIMPET_COST "Mine="
			stripText $LIMPET_COST ","
			stripText $LIMPET_COST "$"
			saveVar $LIMPET_COST
			setVar  $LSD_LIMPCOST $LIMPET_COST
			saveVar $LSD_LIMPCOST
			pause
		:findBeacon
			getWord CURRENTLINE $BEACON_COST 1
			stripText $BEACON_COST "Beacon="
			stripText $BEACON_COST ","
			stripText $BEACON_COST "$"
			saveVar $BEACON_COST
			setVar $LSD_BEACON $BEACON_COST
			saveVar $LSD_BEACON
			pause
		:findTwarpI
			getWord CURRENTLINE $TWARPI_COST 3
			stripText $TWARPI_COST "TWarp="
			stripText $TWARPI_COST ","
			stripText $TWARPI_COST "$"
			saveVar $TWARPI_COST
			setVar $LSD_TWARPICOST $TWARPI_COST
			saveVar $LSD_TWARPICOST
			pause
		:findTwarpII
			getWord CURRENTLINE $TWARPII_COST 3
			stripText $TWARPII_COST "TWarp="
			stripText $TWARPII_COST ","
			stripText $TWARPII_COST "$"
			saveVar $TWARPII_COST
			setVar $LSD_TWARPIICOST $TWARPII_COST
			saveVar $LSD_TWARPIICOST
			pause
		:findTwarpUpgrade
			getWord CURRENTLINE $TWARP_UPGRADE_COST 2
			stripText $TWARP_UPGRADE_COST "Upgrade="
			stripText $TWARP_UPGRADE_COST ","
			stripText $TWARP_UPGRADE_COST "$"
			saveVar $TWARP_UPGRADE_COST
			setVar $LSD_TWARPUPCOST $TWARP_UPGRADE_COST
			saveVar $LSD_TWARPUPCOST
			pause
		:findPsychic
			getWord CURRENTLINE $PSYCHIC_COST 2
			stripText $PSYCHIC_COST "Probe="
			stripText $PSYCHIC_COST ","
			stripText $PSYCHIC_COST "$"
			saveVar $PSYCHIC_COST
			pause
		:findPlanetScanner
			getWord CURRENTLINE $PLANET_SCANNER_COST 2
			stripText $PLANET_SCANNER_COST "Scanner="
			stripText $PLANET_SCANNER_COST ","
			stripText $PLANET_SCANNER_COST "$"
			saveVar $PLANET_SCANNER_COST
			setVar $LSD_PSCAN $PLANET_SCANNER_COST
			saveVar $LSD_PSCAN
			pause
		:findAtomic
			getWord CURRENTLINE $ATOMIC_COST 2
			stripText $ATOMIC_COST "Detonator="
			stripText $ATOMIC_COST ","
			stripText $ATOMIC_COST "$"
			saveVar $ATOMIC_COST
			setVar $LSD_ATOMICCOST $ATOMIC_COST
			saveVar $LSD_ATOMICCOST
			pause
		:Reregister
	        	killTrigger Reregister
        		gosub :GetCost
			setVar $lsd_ReRegisterCost $LSD_Cost
			saveVar $lsd_ReRegisterCost
			pause
		:findCorbo
			getWord CURRENTLINE $CORBO_COST 1
			stripText $CORBO_COST "Corbomite="
			stripText $CORBO_COST ","
			stripText $CORBO_COST "$"
			saveVar $CORBO_COST
			setVar $LSD_CORBOCOST $CORBO_COST
			saveVar $LSD_CORBOCOST
			pause
		:findEther
			getWord CURRENTLINE $PROBE_COST 2
			stripText $PROBE_COST "Probe="
			stripText $PROBE_COST ","
			stripText $PROBE_COST "$"
			saveVar $PROBE_COST
			setVar $LSD_EPROBE $PROBE_COST
			saveVar $LSD_EPROBE
			pause
		:findPhoton
			getWord CURRENTLINE $PHOTON_COST 2
			stripText $PHOTON_COST "Missile="
			stripText $PHOTON_COST ","
			stripText $PHOTON_COST "$"
			saveVar $PHOTON_COST
			setVar $LSD_PHOTONCOST $PHOTON_COST
			saveVar $LSD_PHOTONCOST
			pause
		:findCloak
			getWord CURRENTLINE $CLOAK_COST 2
			stripText $CLOAK_COST "Device="
			stripText $CLOAK_COST ","
			stripText $CLOAK_COST "$"
			saveVar $CLOAK_COST
			setVar $LSD_CLOAKCOST $CLOAK_COST
			saveVar $LSD_CLOAKCOST
			pause
		:findDisruptor
			getWord CURRENTLINE $DISRUPTOR_COST 2
			stripText $DISRUPTOR_COST "Disruptor="
			stripText $DISRUPTOR_COST ","
			stripText $DISRUPTOR_COST "$"
			saveVar $DISRUPTOR_COST
			setVar $LSD_DISRUPTCOST $DISRUPTOR_COST
			saveVar $LSD_DISRUPTCOST
			pause
		:findHoloScanner
			getWord CURRENTLINE $HOLO_COST 2
			stripText $HOLO_COST "Scanner="
			stripText $HOLO_COST ","
			stripText $HOLO_COST "$"
			saveVar $HOLO_COST
			setVar $LSD_HOLOCOST $HOLO_COST
			saveVar $LSD_HOLOCOST
			pause
		:findDensityScan
			getWord CURRENTLINE $DENSITY_COST 2
			stripText $DENSITY_COST "Scanner="
			stripText $DENSITY_COST ","
			stripText $DENSITY_COST "$"
			saveVar $DENSITY_COST
			setVar $LSD_DSCANCOST $DENSITY_COST
			saveVar $LSD_DSCANCOST
			setVar $fileHeadings "MBBS     COLO_REGEN     PTRADE     SF     RF     PORTMAX"
			setVar $fileOutput $mbbs&"     "&$colonist_regen&"     "&$ptradesetting&"     "&$steal_factor&"     "&$rob_factor&"     "&$port_max
			delete $GAME_SETTINGS_FILE
			write $GAME_SETTINGS_FILE $fileHeadings
			write $GAME_SETTINGS_FILE $fileOutput
			setVar $steal_factor ((30*$steal_factor)/100)
			saveVar $steal_factor
			setVar $rob_factor ((3*100)/$rob_factor)
			saveVar $rob_factor
			send "t*n*"
			if (PASSWORD = "")
				send $password
			else
				send PASSWORD
			end
			send "**  zaz*z*za9999*z*"
			if ($CURRENT_SECTOR > 11) and ($CURRENT_SECTOR <> STARDOCK)
				send "f1*cd"
			end
			gosub :quikstats
	end
	setVar $gamestats TRUE
	saveVar $gamestats
return
# ============================== END GAME STATS SUB ==============================
:FindJumpSector
	setVar $i 1
	setVar $RED_adj 0
	send "q t*t1* q*"
	while (SECTOR.WARPSIN[$target][$i] > 0)
		setVar $RED_adj SECTOR.WARPSIN[$target][$i]
		if ($RED_adj > 10)
			send "m " & $RED_adj & "* y"
			setTextTrigger TwarpBlind 			:TwarpBlind "Do you want to make this jump blind? "
			setTextTrigger TwarpLocked			:TwarpLocked "All Systems Ready, shall we engage? "
			setTextLineTrigger TwarpVoided		:TwarpVoided "Danger Warning Overridden"
			setTextLineTrigger TwarpAdj			:TwarpAdj "<Set NavPoint>"
			pause
			:TwarpAdj
				gosub :killthetriggers
				send " * "
				return

			:TwarpVoided
				gosub :killthetriggers
				send " N N "
				goto :TryingNextAdj

			:TwarpLocked
				gosub :killthetriggers
				goto :SectorLocked

			:TwarpBlind
				gosub :killthetriggers
				send " N "
		end
		:TryingNextAdj
		    	add $i 1
	end

	:NoAdjsFound
		setVar $RED_adj 0
		return

	:SectorLocked
		if ($target = $stardock)
			setVar $backdoor $RED_adj
			saveVar $backdoor
		end
		return

# ======================    START INTERNAL TWARP SUBROUTINE     ==========================
:twarpto
	setVar $twarpSuccess FALSE
	setVar $original 9999999
	setVar $target 0
	if ($CURRENT_SECTOR = $warpto)
		setVar $msg "Already in that sector!"
		goto :twarpDone
	elseif (($warpto <= 0) OR ($warpto > SECTORS))
		setVar $msg "Destination sector is out of range!"
		goto :twarpDone
	end
	if ($TWARP_TYPE = "No")
		setVar $msg "No T-warp drive on this ship!"
		goto :twarpDone
	end
	# check adj's for Dock.. if present, then we don't need a jump sector.
	setVar $WeAreAdjDock FALSE
	if (($warpto = $stardock) OR ($warpto <= 10))
		setVar $target $warpto
		setVar $a 1
		setVar $START_SECTOR $CURRENT_SECTOR
		while ($a <= SECTOR.WARPCOUNT[$START_SECTOR])
			setVar $adj_start SECTOR.WARPS[$START_SECTOR][$a]
			if ($adj_start = $target)
				setVar $WeAreAdjDock TRUE
			end
			add $a 1
		end
	end
	setVar $RED_adj 0
	if (($ALIGNMENT < 1000) AND ($WeAreAdjDock = FALSE) AND (($warpto = $stardock) OR ($warpto <= 10)))
		setVar $target $warpto
		gosub :FindJumpSector
		if ($RED_adj <> 0)
			setVar $original $warpto
			setVar $WARPTO $RED_adj
		else
			waitfor "Command [TL="
			setVar $msg "Cannot Find Jump Sector Adjacent Sector " & $target & "."
			goto :twarpDone
		end
	end
	if ($RED_adj <> 0)
		goto :twarp_lock
	end
	if ($startingLocation = "Citadel")
		send "q t*t1* q q * c u y q mz" $warpto "*"
	elseif ($startingLocation = "Planet")
		send "t*t1* q q * c u y q mz" $warpto "*"
	else
		send "q q q n n 0 * c u y q mz" $warpto "*"
	end
	setTextTrigger      there      :adj_warp       "You are already in that sector!"
	setTextLineTrigger  adj_warp   :adj_warp       "Sector  : "&$warpto&" "
	setTextTrigger      locking    :locking        "Do you want to engage the TransWarp drive?"
	setTextTrigger      igd        :twarpIgd       "An Interdictor Generator in this sector holds you fast!"
	setTextTrigger      noturns    :twarpPhotoned  "Your ship was hit by a Photon and has been disabled"
	setTextTrigger      noroute    :twarpNoRoute   "Do you really want to warp there? (Y/N)"
	pause
	:adj_warp	
		gosub :killtwarptriggers
		send "z*"
		goto :twarp_adj
	:locking
		gosub :killtwarptriggers
		send "y"
		setTextLineTrigger twarp_lock :twarp_lock "TransWarp Locked"
		setTextLineTrigger no_twrp_lock :no_twarp_lock "No locating beam found"
		setTextLineTrigger twarp_adj :twarp_adj "<Set NavPoint>"
		setTextLineTrigger no_fuel :twarpNoFuel "You do not have enough Fuel Ore"
		pause
	:twarpNoFuel
		gosub :killtwarptriggers
		setVar $msg "Not enough fuel for T-warp."
		goto :twarpDone
	:twarp_adj
		gosub :killtwarptriggers
		send "z* "
		setVar $msg "That sector is next door, just plain warping."
		setVar $twarpSuccess TRUE
		goto :twarpDone
	:twarpNoRoute
		gosub :killtwarptriggers
		send "n* z* "
		setVar $msg "No route available to that sector!"
		goto :twarpDone
	:no_twarp_lock
		gosub :killtwarptriggers
		send "n* z* "
		setVar $target $warpto
		gosub :removeFigFromData
		setVar $msg "No fighters at T-warp point!"
		goto :twarpDone
	:twarpIgd
		gosub :killtwarptriggers
		setVar $msg "My ship is being held by Interdictor!"
		goto :twarpDone
	:twarpPhotoned
		gosub :killtwarptriggers
		setVar $msg "I have been photoned and can not T-warp!"
		goto :twarpDone
	:twarp_lock
		gosub :killtwarptriggers
		setVar $target $warpto
		gosub :addFigToData
		send "y* "
		setVar $msg "T-warp completed."
		setVar $twarpSuccess TRUE
	:twarpDone
	if (($twarpSuccess = TRUE) AND (($original = $stardock) OR ($original <= 10)))
		send "* m "&$original&"*  za9999* * "
	end
return
:killtwarptriggers
	killtrigger there
	killtrigger adj_warp
	killtrigger locking
	killtrigger igd
	killtrigger noturns
	killtrigger noroute
	killtrigger twarp_lock
	killtrigger no_twrp_lock
	killtrigger twarp_adj
	killtrigger no_fuel
return
# ======================    END INTERNAL TWARP SUBROUTINE     ==========================
#####======================================== END BOT HELPER FUNCTIONS SECTION ========================================#####
#####==============================================  BOT HELP SECTION =================================================#####
:command_list
	setVar $helpList TRUE
	if ($parm1 = 0)
		gosub :quikstats
		setVar $message "  --------------Mind ()ver Matter Bot Help Categories------------*"
		setVar $message $message&"                          Version: "&$major_version&"_"&$minor_version&"*"
                setVar $message $message&" *"
		setVar $message $message&"                [OFFENSE]|[DEFENSE]|[DATA]|[CASHING]*"
		setVar $message $message&"                     [RESOURCE]|[GRID]|[GENERAL]*"
		setVar $message $message&" *"
		setVar $message $message&"  ---------------------------------------------------------------*"
	else
		getFileList $commandList "scripts\MomBot3\Commands\"&$parm1&"\*.cts"
		getFileList $modeList "scripts\MomBot3\Modes\"&$parm1&"\*.cts"
		setVar $maxStringLength 34
		setVar $paddingDashes "                                 "
		upperCase $parm1
		setVar $message "  --Mind ()ver Matter Bot Commands--*"
		getLength "-="&$parm1&"=-" $comLength
		setVar $sideLength (($maxStringLength-$comLength)/2)
		cutText $paddingDashes $leftPad 1 $sideLength
		cutText $paddingDashes $rightPad 1 (($maxStringLength-$comLength)-$sideLength)
		setVar $message $message&" |"&$leftPad&"-="&$parm1&"=-"&$rightPad&"|*"
		setVar $message $message&" |----------------------------------|*"
			setVar $i 1
			upperCase $currentList
			while ($i <= $commandList)
				setVar $tempCommand $commandList[$i]&"###"
				getWord $currentList $next ($i+1)
				getWord $currentList $next2 ($i+2)
				stripText $tempCommand "scripts\MomBot3\Commands\"&$parm1&"\"
				stripText $tempCommand ".cts###"
				upperCase $tempCommand
				cutText $tempCommand&" " $hidden 1 1
				if ($hidden = "_")
					getLength $tempCommand $tempLength
					if (($self_command = TRUE) AND ($tempLength > 1))
						cutText $tempCommand $tempCommand 2 9999
						setVar $currentList $currentList&" [<><>HIDDEN<><>]"&$tempCommand&" "
					end
				else
					getWordPos $currentList $pos " "&$tempCommand&" "
					if ($pos <= 0)
						setVar $currentList $currentList&" "&$tempCommand&" "
					end
				end
				add $i 1
			end
			setVar $message $message&" |           -=Commands=-           |*"
			setVar $commandCount 0
			setVar $bufferCount 0
			gosub :bufferList
		if ($modeList > 0)
			setVar $message $message&" |            -=Modes=-             |*"
			setVar $currentList " "
			setVar $i 1
			while ($i <= $modeList)
				setVar $tempCommand $modeList[$i]&"###"
				stripText $tempCommand "scripts\MomBot3\Modes\"&$parm1&"\"
				stripText $tempCommand ".cts###"
				upperCase $tempCommand
				cutText $tempCommand&" " $hidden 1 1
				if ($hidden = "_")
					getLength $tempCommand $tempLength
					if (($self_command = TRUE) AND ($tempLength > 1))
						cutText $tempCommand $tempCommand 2 9999
						setVar $currentList $currentList&" [<><>HIDDEN<><>]"&$tempCommand&" "
					end
				else
					setVar $currentList $currentList&" "&$tempCommand&" "
				end
				add $i 1
			end
			gosub :bufferList
		end
		setVar $message $message&" |----------------------------------|*"
	end
	if ($self_command <> TRUE)
		setVar $self_command 2
	end
	gosub :switchboard
goto :wait_for_command
:bufferList
	setVar $i 1
	getWord $currentList $test $i "[<><>NONE<><>]"
	setVar $paddingDashes "                                "
	while ($test <> "[<><>NONE<><>]")
		setVar $tempCommand $test
		setVar $tempCommandHidden FALSE
		setVar $nextHidden FALSE
		setVar $next2Hidden FALSE
		getWord $currentList $next ($i+1)
		getWord $currentList $next2 ($i+2)
		getWordPos $tempCommand $pos "[<><>HIDDEN<><>]"
		if ($pos > 0)
			stripText $tempCommand "[<><>HIDDEN<><>]"
			setVar $tempCommandHidden TRUE
			setVar $tempCommand2 ANSI_14&$tempCommand&ANSI_15
		else
			setVar $tempCommand2 $tempCommand
		end
		if ($next <> 0)
			getWordPos $next $pos "[<><>HIDDEN<><>]"
			stripText $next "[<><>HIDDEN<><>]"
			if ($pos > 0)
				setVar $nextHidden TRUE
				setVar $tempCommand2 $tempCommand2&"   "&ANSI_14&$next&ANSI_15
			else
				setVar $tempCommand2 $tempCommand2&"   "&$next
			end
			setVar $tempCommand $tempCommand&"   "&$next
			add $i 1
		end
		if ($next2 <> 0)
			getWordPos $next2 $pos "[<><>HIDDEN<><>]"
			stripText $next2 "[<><>HIDDEN<><>]"
			if ($pos > 0)
				setVar $next2Hidden TRUE
				setVar $tempCommand2 $tempCommand2&"   "&ANSI_14&$next2&ANSI_15
			else
				setVar $tempCommand2 $tempCommand2&"   "&$next2
			end
			setVar $tempCommand $tempCommand&"   "&$next2
			add $i 1
		end
		getLength $tempCommand $comLength
		upperCase $tempCommand
		setVar $sideLength (($maxStringLength-$comLength)/2)
		cutText $paddingDashes $leftPad 1 $sideLength
		cutText $paddingDashes $rightPad 1 (($maxStringLength-$comLength)-$sideLength)
		if ($self_command = TRUE)
			setVar $message $message&" |"&$leftPad&$tempCommand2&$rightPad&"|*"
		else
			setVar $message $message&" |"&$leftPad&$tempCommand&$rightPad&"|*"	
		end
		add $commandCount 1
		add $i 1
		getWord $currentList $test $i "[<><>NONE<><>]"
	end
return
:echo_help
	echo "*"
	echo ansi_13 "  ----------------" ansi_14 "Mind " ansi_4 "()" ansi_14 "ver Matter Bot Help Categories" ansi_13 "---------------*"
        echo ansi_13 "                            Version: "&$major_version&"."&$minor_version&"*"
        echo ansi_13 "                  [OFFENSE]|[DEFENSE]|[DATA]|[CASHING]*"
	echo ansi_13 "                      [RESOURCE]|[GRID]|[GENERAL]    *"
	echo ansi_13 "  ------------------------------"&ANSI_14&"Hot Keys"&ANSI_13&"------------------------------*"
	gosub :echoHotKeys
	echo ansi_13 "  ------------------------------"&ANSI_14&"Daemons"&ANSI_13&"-------------------------------*"
	getFileList $daemonList "scripts\MomBot3\Daemons\*.cts"
	if ($daemonList > 0)
		setVar $paddingDashes "                                 "
		setVar $currentList ""
		setVar $maxStringLength 68
		setVar $i 1
		while ($i <= $daemonList)
			setVar $tempCommand $daemonList[$i]&"###"
			stripText $tempCommand "scripts\MomBot3\Daemons\"&$parm1&"\"
			stripText $tempCommand ".cts###"
			setVar $currentList $currentList&" "&$tempCommand&" "
			add $i 1
		end
		setVar $message ""
		gosub :bufferList
		echo $message
		echo ansi_13 "  --------------------------------------------------------------------***"
	end
	goto :wait_for_command
:ss_help
	setVar $helpString "'*"
	setVar $helpString $helpString&"  -----------------Mind ()ver Matter Bot Help Categories--------------*"
	setVar $helpString $helpString&"                              Version: "&$major_version&"."&$minor_version&"*"
        setVar $helpString $helpString&"                   [OFFENSE]|[DEFENSE]|[DATA]|[CASHING]*"
	setVar $helpString $helpString&"                        [RESOURCE]|[GRID]|[GENERAL]    *"
	setVar $helpString $helpString&"  --------------------------------------------------------------------**"
	send $helpString
	goto :wait_for_command
# ============================== END HELP FOR COMMANDS SUB ==============================
:displayAdjacentAnsi
:displayAdjacentGridAnsi
	setVar $i 1
	isNumber $test CURRENTSECTOR
	if ($test)
		while (SECTOR.WARPS[CURRENTSECTOR][$i] > 0)
			setVar $adj_sec SECTOR.WARPS[CURRENTSECTOR][$i]
			setVar $containsShieldedPlanet FALSE
			setVar $shieldedPlanets 0
			if ($adj_sec >= 10000)
				setVar $adjust ""
			elseif $adj_sec >= 1000
				setVar $adjust " "
			elseif $adj_sec >= 100
				setVar $adjust "  "
			elseif $adj_sec >= 10
				setVar $adjust "   "
			else
				setVar $adjust "    "
			end
			echo ANSI_13 "* (" ANSI_10 $i ANSI_13 ")" ANSI_15 " - " ANSI_13 "<" ANSI_14 SECTOR.WARPS[CURRENTSECTOR][$i] ANSI_13 ">" $adjust ANSI_15 " Warps: " ANSI_7  SECTOR.WARPCOUNT[$adj_sec] 
			getSectorParameter $adj_sec "FIGSEC" $isFigged
			getSectorParameter $adj_sec "MSLSEC" $isMSL
			if ($isFigged = "")
				setVar $isFigged FALSE
			end
			if ($isMSL = "")
				setVar $isMSL FALSE
			end
			setVar $adjSectorOwner SECTOR.FIGS.OWNER[$adj_sec]
			if (($isFigged) OR ($adjSectorOwner = "belong to your Corp") OR ($adjSectorOwner = "yours"))
				echo ANSI_15 " Owner: " ANSI_14 "   OURS   "
			else
				getWord $adjSectorOwner $alienCheck 1
				if (($adj_sec < 11) OR ($adj_sec = $stardock))
					echo ANSI_15 " Owner: " ANSI_9 " FEDSPACE "	
				elseif ($adj_sec = $rylos)
					echo ANSI_15 " Owner: " ANSI_9 "  RYLOS   "	
				elseif ($adj_sec = $alpha_centauri)
					echo ANSI_15 " Owner: " ANSI_9 "  ALPHA   "	
				elseif ($adjSectorOwner = "Rogue Mercenaries")
					echo ANSI_15 " Owner: " ANSI_7 "  ROGUE   "	
				elseif ($alienCheck = "the")
					echo ANSI_15 " Owner: " ANSI_2 "  ALIENS  "	
				elseif ($alienCheck = "The")
					echo ANSI_15 " Owner: " ANSI_2 "  ALIENS  "	
				elseif (($adjSectorOwner <> "") AND ($adjSectorOwner <> "Unknown"))
					setVar $heads TRUE
					getWord $adjSectorOwner $temp 3
					stripText $temp ","
					upperCase $temp
					getLength $temp $tempLength
					if ($tempLength >= 10)
						cutText $temp $temp 1 10
					else
						while ((10 - $tempLength) > 0)
							if ($heads)
								setVar $temp $temp&" "
								setVar $heads FALSE
							else
								setVar $temp " "&$temp
								setVar $heads TRUE
							end
							getLength $temp $tempLength
						end
					end
					echo ANSI_15 " Owner: " ANSI_12 $temp
				else
					echo ANSI_15 " Owner: " ANSI_13 "   NONE   "
				end
			end
			if (SECTOR.ANOMOLY[$ADJ_SEC])
				echo ANSI_15 " Anom: " ANSI_11 "Yes" ANSI_15
			else
				echo ANSI_15 " Anom: " ANSI_7 " No" ANSI_15
			end
			echo ANSI_15 "  Dens: " ANSI_14 
			if (SECTOR.DENSITY[$ADJ_SEC] = "-1")
				echo "???        "
			else
				setVar $dens SECTOR.DENSITY[$ADJ_SEC]
				getLength SECTOR.DENSITY[$ADJ_SEC] $densLength
				if ($densLength >= 9)
					echo "HIGH      "
				else
					setVar $d $densLength
					while ($d <= 10)
						setVar $dens $dens&" "
						add $d 1
					end
					echo $dens
				end
				
			end
			if ($isMSL = TRUE)
				echo ANSI_15 "[" ANSI_14 "MSL" ANSI_15 "]" ANSI_7
			end
			setVar $p 1
			if (SECTOR.PLANETCOUNT[$adj_sec] > 0)
				echo ANSI_15 "*        Planet(s): " ANSI_7
			end
			while ($p <= SECTOR.PLANETCOUNT[$adj_sec])
				echo "*             " ANSI_14 SECTOR.PLANETS[$adj_sec][$p]
				add $p 1
			end
			setVar $p 1
			if (SECTOR.TRADERCOUNT[$adj_sec] > 0)
				echo ANSI_15 "*        Trader(s): " ANSI_7
			end
			while ($p <= SECTOR.TRADERCOUNT[$adj_sec])
				echo "*             " ANSI_14 SECTOR.TRADERS[$adj_sec][$p]
				add $p 1
			end
			add $i 1
		end
		setVar $gridWarpCount ($i-1)
	else
		echo ANSI_15 " ERROR WITH CURRENTSECTOR  " ANSI_7
	end

	echo "**" CURRENTANSILINE
return
:moveIntoSector
	setVar $result ""
	setVar $dropFigs TRUE
	if ($SHIP_MAX_ATTACK <= 0)
		setVar $attack 9999
	else
		setVar $attack $SHIP_MAX_ATTACK&"9999"
	end
	setVar $result $result&"m "&$moveIntoSector&"* y * "
	if (($moveIntoSector > 10) AND ($moveIntoSector <> $STARDOCK))
		setVar $result $result&"za"&$attack&"* * "
	end
	if (($dropFigs = TRUE) AND ($moveIntoSector > 10) AND ($moveIntoSector <> $STARDOCK))
		setVar $result $result&"f 1 * c d "
		setVar $target $moveIntoSector
		gosub :addFigToData
	end
	send $result & "*"
	#waitOn "["&$moveIntoSector&"]"
	setTextTrigger moveIn_THERE	:moveIn_THERE	"["&$moveIntoSector&"]"
	setTextTrigger moveIn_NOPE		:moveIn_NOPE	"(A,D,I,R,?):? D"
	pause
	:moveIn_NOPE
		killTrigger moveIn_THERE
		send "R"
	:moveIn_THERE
		killTrigger moveIn_NOPE
return
#####===============================================  BOT HELP SECTION ================================================#####
:holo_kill
:hkill
        gosub :killthetriggers
	gosub :current_prompt
	setVar $validPrompts "Citadel Command"
	gosub :checkStartingPrompt
        if ($startingLocation = "Citadel")
               send " q dm *** c  "
               waitFor "Planet command (?=help) [D]"
               waitFor "Planet #"
               getWord CURRENTLINE $planetnum 2
               stripText $planetnum "#"
               waitFor "Citadel command (?=help)"
        end
        send " c ;q"
        waitFor "Max Fighters:"
        setVar $line CURRENTLINE
        replaceText $line ":" " "
        getword $line $max_figs 7
        stripText $max_figs ","
        waitFor "Max Figs Per Attack:"
        setVar $line CURRENTLINE
        replaceText $line ":" " "
        getword $line $max_fig_wave 5
        stripText $max_fig_wave ","
        if ($max_fig_wave = $max_figs)
               setVar $max_fig_wave ($max_fig_wave - 100)
        end
        setVar $waves_to_send ($max_figs / $max_fig_wave)
:holo_kill_kill_check
        setTextLineTrigger noscan1 :holo_kill_noscanner "Handle which mine type, 1 Armid or 2 Limpet"
        setTextLineTrigger noscan2 :holo_kill_noscanner "You don't have a long range scanner."
        setTextLineTrigger scanned :holo_kill_scandone  "Select (H)olo Scan or (D)ensity Scan or (Q)uit? [D] H"
        if ($CURRENT_PROMPT = "Citadel")
               send " qqqz* sh*  l " & $planetnum & " * j c * "
        else
               send " sh*  "
        end
        pause
:holo_kill_noscanner
        gosub :killthetriggers
        setVar $message "You don't have a HoloScanner!*"
        gosub :switchboard
	send " *  "
        goto :wait_for_command
:holo_kill_scandone
        gosub :killthetriggers
        waitFor "Warps to Sector(s) :"
:holo_kill_get_prompt
        waitFor "Command [TL="
        getText CURRENTLINE $current_sector "]:[" "] (?="
:holo_kill_get_current_sector
        isNumber $result $current_sector
        IF ($result < 1)
               send "/"
               setVar $line CURRENTLINE
               replacetext $line #179 " "
               getWord $line $current_sector 2
               goto :holo_kill_get_current_sector
        END
        IF ($current_sector < 1) OR ($current_sector > SECTORS)
               send "/"
               setVar $line CURRENTLINE
               replacetext $line #179 " "
               getWord $line $current_sector 2
               goto :holo_kill_get_current_sector
        END
        setVar $killsector 0
        setVar $idx 1
        while ($idx <= SECTOR.WARPCOUNT[$current_sector])
                setVar $test_sector SECTOR.WARPS[$current_sector][$idx]
               	setVar $safePlanets TRUE
		setVar $containsShieldedPlanet FALSE
		if (SECTOR.PLANETCOUNT[$test_sector] > 0)
			setVar $p 1
			while ($p <= SECTOR.PLANETCOUNT[$test_sector])
				getWord SECTOR.PLANETS[$test_sector][$p] $test 1
				if ($test = "<<<<")
					setVar $containsShieldedPlanet TRUE
				end
				add $p 1
			end
			if ($surroundAvoidAllPlanets)
				setVar $safePlanets FALSE
			elseif (($containsShieldedPlanet) AND ($surroundAvoidShieldedOnly))
				setVar $safePlanets FALSE
			end
		end
		if (($test_sector <> $STARDOCK) AND ($test_sector > 10) AND (SECTOR.TRADERCOUNT[$test_sector] > 0) AND ($safePlanets = TRUE))
                       setVar $killsector $test_sector
                       goto :holo_kill_killem
                end
                add $idx 1
        end
:holo_kill_killem
        IF ($killsector > 10) AND ($killsector <> $STARDOCK)
               send "'{" $bot_name "} - Dny HoloKill - Attacking sector " & $test_sector & ".*"
               setVar $no_str ""
               setVar $no_cnt SECTOR.SHIPCOUNT[$killsector]
               setVar $no_idx 1
               WHILE ($no_idx <= $no_cnt)
			setVar $no_str $no_str & "n"
			add $no_idx 1
               END
               send " c v 0 * y n " & $test_sector & " * q "
               IF ($startingLocation = "Citadel")
                       send " qqqz* "
               END
               send " m z " & $test_sector & " *  *  z  a  99999  *  z  a  99999  *  R  *  f  z  1  *  z  c  d  *   "
               setVar $kill_idx 1
               WHILE ($kill_idx <= $waves_to_send)
                       send " a " & $no_cnt & " y n y q z " & $max_fig_wave & " * "
                       add $kill_idx 1
               END
               send " DZ N  R  *  <  N  N  *  Z  A  99999  *  "
               IF ($startingLocation = "Citadel")
                       send " l " & $planetnum & " * n n * j m * * * j c  *  "
               END
        ELSE
               IF ($startingLocation = "Citadel")
                       send " s* "
                       waitFor "<Scan Sector>"
                       waitFor "Citadel command (?=help)"
                       setVar $message "No Enemies found adjacent!*"
                       gosub :switchboard
			send " *  "
               ELSE
                       send " dz * "
                       waitFor "<Re-Display>"
                       waitFor "Command [TL="
                       setVar $message "No Enemies found adjacent!*"
                       gosub :switchboard
		       send " *  "
               END
        END
        goto :wait_for_command

:switchboard
#:switchboard_XX
	#setVar $MSG_Header_Echo		(ANSI_14&"**{"&ANSI_6&$bot_name&ANSI_14&"}"&ANSI_15&" - *")
	setVar $MSG_Header_Echo		(ANSI_9 & "{"&ANSI_14&$bot_name&ANSI_9&"} " & ANSI_15)
	setVar $MSG_Header_SS_1		("'{"&$bot_name&"} - ")
	setVar $MSG_Header_SS_2		("'*{"&$bot_name&"} - *")
	if ($message <> "")
		gosub :killthetriggers
		if ($self_command)
			setVar $length 0
		else
			getLength $bot_name $length
		end
		setVar $i 1
		setVar $spacing ""
		if ($self_command <> 0)
			if ($self_command > 1)
				striptext $message ANSI_1
				striptext $message ANSI_2
				striptext $message ANSI_3
				striptext $message ANSI_4
				striptext $message ANSI_5
				striptext $message ANSI_6
				striptext $message ANSI_7
				striptext $message ANSI_8
				striptext $message ANSI_9
				striptext $message ANSI_10
				striptext $message ANSI_11
				striptext $message ANSI_12
				striptext $message ANSI_13
				striptext $message ANSI_14
				striptext $message ANSI_15
				if ($helpList <> TRUE)
					striptext $message "    "
				end
			end
			while ($i <= ($length))
				setVar $spacing $spacing&" "
				add $i 1
			end

			setVar $new_message ""
			setVar $message_line ""
			replaceText $message "**" "{END_OF_LINE}"
			replaceText $message "*"  "{END_OF_LINE}"
			getText ("{START_OF_MESSAGE}"&$message) $message_line "{START_OF_MESSAGE}" "{END_OF_LINE}"
			while ($message_line <> "")
				setVar $new_message $new_message&$spacing&$message_line&"*"
				getLength ("{START_OF_MESSAGE}"&$message_line&"{END_OF_LINE}") $cutlength
				cutText ("{START_OF_MESSAGE}"&$message&"     ") $message ($cutlength+1) 99999
				getText ("{START_OF_MESSAGE}"&$message) $message_line "{START_OF_MESSAGE}" "{END_OF_LINE}"
			end
		else
			setVar $new_message $message
		end
		if ($self_command = 1)
			Echo "*" & $MSG_Header_Echo & $new_message
			send #145
		elseif ($self_command = 0)
			send $MSG_Header_SS_1 & $new_message
		elseif ($self_command > 1)
			send $MSG_Header_SS_2 & $new_message & "*"
		end
		setVar $message ""
	end
	setVar $helpList FALSE
return
#####==========================================  BOT INTERNAL MENUS SECTION ===========================================#####
#=============================================  DOCK SHOPPER MENU  ==================================================
:dock_shopper
	setVar $isDockShopper TRUE
	setVar $LSD__Atomics ""
	setVar $LSD__Beacons ""
	setVar $LSD__Corbo ""
	setVar $LSD__Cloak ""
	setVar $LSD__Probe ""
	setVar $LSD__PScan ""
	setVar $LSD__Limps ""
	setVar $LSD__Mines ""
	setVar $LSD__Photon ""
	setVar $LSD__LRScan ""
	setVar $LSD__Disrupt ""
	setVar $LSD__GenTorp ""
	setVar $LSD__T2Twarp ""
	setVar $LSD__Holds ""
	setVar $LSD__Figs ""
	setVar $LSD__Shields ""
	setVar $LSD__Trickster ""
	setVar $LSD_NumberOfShip ""
	setVar $LSD__TOTAL 0
	setVar $LSD_Tow 0
	setVar $LSD_Order ""
	gosub :quikstats
	setVar $validPrompts "Command Citadel"
	gosub :checkStartingPrompt
	if ($startingLocation = "Citadel")
		send " Q DC  "
		waitfor "Planet #"
		getword CURRENTLINE $PLANET 2
		stripText $PLANET "#"
		isNumber $LSD_tst $PLANET
		if ($LSD_tst = 0)
			setVar $PLANET 0
		end
	end
	gosub :LoadShipData
	gosub :GetClass0Costs
	gosub :CheckCosts
:start
:TopOfMenu
	echo #27 & "[2J"
:TopOfMenu_NoClear
	gosub :SetMenuEchos
	echo "***"
	echo ("     "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
	echo ANSI_14 & "*        LoneStar's StarDock Shopper"
	echo ANSI_9 & "*         Mind ()ver Matter Edition"
	echo ANSI_15 & "*          Emporium Daily Specials"
	echo ANSI_14 & "*                Version " & $LSD_CURENT_VERSION & "*"
	Echo ("     "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
	echo "*"
	setVar $LSD_PadThisCost $LSD_ATOMICCOST
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "A" & ANSI_5 & ">" & ANSI_9 & " Atomic Detonators      " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Atomics
	setVar $LSD_PadThisCost $LSD_BEACON
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "B" & ANSI_5 & ">" & ANSI_9 & " Marker Beacons         " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Beacons
	setVar $LSD_PadThisCost $LSD_CORBOCOST
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "C" & ANSI_5 & ">" & ANSI_9 & " Corbomite Devices      " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Corbo
	setVar $LSD_PadThisCost $LSD_CLOAKCOST
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "D" & ANSI_5 & ">" & ANSI_9 & " Cloaking Devices       " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Cloak
	setVar $LSD_PadThisCost $LSD_EPROBE
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "E" & ANSI_5 & ">" & ANSI_9 & " SubSpace Ether Probes  " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Probe
	setVar $LSD_PadThisCost $LSD_PSCAN
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "F" & ANSI_5 & ">" & ANSI_9 & " Planet Scanners        " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_PScan
	setVar $LSD_PadThisCost $LSD_LIMPCOST
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "L" & ANSI_5 & ">" & ANSI_9 & " Limpet Tracking Mines  " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Limps
	setVar $LSD_PadThisCost $LSD_ARMIDCOST
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "M" & ANSI_5 & ">" & ANSI_9 & " Space Mines            " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Mines
	setVar $LSD_PadThisCost $LSD_PHOTONCOST
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "P" & ANSI_5 & ">" & ANSI_9 & " Photon Missiles        " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Photon
	setVar $LSD_PadThisCost $LSD_HOLOCOST
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "R" & ANSI_5 & ">" & ANSI_9 & " Long Range Scanners    " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_LRScan
	setVar $LSD_PadThisCost $LSD_DISRUPTCOST
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "S" & ANSI_5 & ">" & ANSI_9 & " Mine Disruptors        " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Disrupt
	setVar $LSD_PadThisCost $LSD_GENCOST
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "T" & ANSI_5 & ">" & ANSI_9 & " Genesis Torpedoes      " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_GenTorp
	setVar $LSD_PadThisCost $LSD_TWARPIICOST
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "W" & ANSI_5 & ">" & ANSI_9 & " T2 TransWarp Drives    " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_T2Twarp
	setVar $LSD_PadThisCost $LSD_HoldCost
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "1" & ANSI_5 & ">" & ANSI_9 & " Holds                  " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Holds
	setVar $LSD_PadThisCost $LSD_FighterCost
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "2" & ANSI_5 & ">" & ANSI_9 & " Figs                   " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Figs
	setVar $LSD_PadThisCost $LSD_Shield
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "3" & ANSI_5 & ">" & ANSI_9 & " Shields                " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Shields
	if ($LSD__TOTAL <> 0)
		setVar $LSD_CashAmount $LSD__TOTAL
		gosub :CommaSize
		echo "*                                 " & ANSI_15 & " TOTAL (" & ANSI_7 & "$" & $LSD_CashAmount & ANSI_15 & ")"
		setVar $LSD__TOTAL 0
	end
	echo "*    " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196
	if ($LSD_ShipData_Valid)
		echo ANSI_5 & "*    <" & ANSI_8 & "G" & ANSI_5 & ">" & ANSI_5 & " Buy Ship(s): " & ANSI_8 & $LSD_Echo_Trickster
	else
		echo ANSI_5 & "*    <" & ANSI_8 & "G" & ANSI_5 & ">" & ANSI_5 & " Buy Ship(s): " & ANSI_8 & "Must Run StandAlone Version"
		setVar $LSD__Trickster ""
	end
	if ($LSD__Trickster = "")
		echo ANSI_5 & "*    <" & ANSI_8 & "Y" & ANSI_5 & ">" & ANSI_5 & " Tow & Outfit Another Ship   "  & ANSI_8
		if ($LSD_Tow > 0)
			echo ANSI_15 & "#" & $LSD_Tow
		end
	else
		setVar $LSD_Tow 0
	end
	echo ANSI_5 & "*    <" & ANSI_8 & "Z" & ANSI_5 & ">" & ANSI_5 & " Max Out Ship On Everything!"
	echo ANSI_5 & "*    <" & ANSI_15 & "V" & ANSI_5 & ">" & ANSI_5 & " Name Of Bot To Command " & ANSI_14&": "
	if ($LSD_BOTTING = "") OR ($LSD_BOTTING = "0")
		setVar $LSD_BOTTING $bot_name
	end
	echo ANSI_15 & $LSD_BOTTING
	echo "*        " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196
	echo "*        " & ANSI_14 & "X" & ANSI_15 & " - Execute    " & ANSI_14 & "Q" & ANSI_15 & " - Quit**"
	getConsoleInput $LSD_selection SINGLEKEY
	upperCase $LSD_selection
	setVar $yes_no FALSE
	setVar $item_max 1000
	if ($LSD_selection = "Q")
		echo "**" & ANSI_12 "  Script Halted" & ANSI_15 & "**"
		goto :wait_for_command
	elseif ($LSD_selection = "A")
		setVar $item_name "Atomics"
		setVar $item_max 100
		gosub :getItemInput
		setVar $LSD__Atomics $LSD_Selection
	elseif ($LSD_selection = "B")
		setVar $item_name "Marker Beacons"
		setVar $item_max 100
		gosub :getItemInput
		setVar $LSD__Beacons $LSD_Selection
	elseif ($LSD_selection = "C")
		setVar $item_name "Coromite Devices"
		setVar $item_max 100000
		gosub :getItemInput
		setVar $LSD__Corbo $LSD_Selection
	elseif ($LSD_selection = "D")
		setVar $item_name "Cloaking Devices"
		gosub :getItemInput
		setVar $LSD__Cloak $LSD_Selection
	elseif ($LSD_selection = "E")
		setVar $item_name "SubSpace Ether Probe Devices"
		gosub :getItemInput
		setVar $LSD__Probe $LSD_Selection
	elseif ($LSD_selection = "F")
		setVar $item_name "Install Planet Scanner (Y/N)?"
		setVar $yes_no TRUE
		gosub :getItemInput
		setVar $LSD__PScan $LSD_Selection
	elseif ($LSD_selection = "L")
		setVar $item_name "Limpet Tracking Devices"
		gosub :getItemInput
		setVar $LSD__Limps $LSD_Selection
	elseif ($LSD_selection = "M")
		setVar $item_name "Armid Mines To Buy"
		gosub :getItemInput
		setVar $LSD__Mines $LSD_Selection
	elseif ($LSD_selection = "P")
		setVar $item_name "Photon Devices To Buy"
		gosub :getItemInput
		setVar $LSD__Photon $LSD_Selection
	elseif ($LSD_selection = "R")
		setVar $item_name "Holo Scanner (Y/N)?"
		setVar $yes_no TRUE
		gosub :getItemInput
		setVar $LSD__LRScan $LSD_Selection
	elseif ($LSD_selection = "S")
		setVar $item_name "Mine Disruptors"
		gosub :getItemInput
		setVar $LSD__Disrupt $LSD_Selection
	elseif ($LSD_selection = "T")
		setVar $item_name "Genesis Torpedoes"
		gosub :getItemInput
		setVar $LSD__GenTorp $LSD_Selection
	elseif ($LSD_selection = "W")
		setVar $item_name "Install Trans Warp 2 Drive (Y/N)?"
		setVar $yes_no TRUE
		gosub :getItemInput
		setVar $LSD__T2Twarp $LSD_Selection
	elseif ($LSD_Selection = "Y")
		#-------------------------------------------- Tow a Ship
		if ($TWARP_TYPE = 2)
			getInput $LSD_selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Tow and Outfit a Ship (0 to Cancel)?"
			isNumber $LSD_tst $LSD_selection
			if ($LSD_tst <> 0)
				if (($LSD_selection < 0) or ($LSD_selection > 250))
					setVar $LSD_Tow 0
				else
					setVar $LSD_Tow $LSD_selection
				end
			else
				setVar $LSD_Tow 0
			end
		end
	elseif ($LSD_selection = "Z")
		#-------------------------------------------- Buy Max ship on everything
		setVar $LSD__Photon "Max"
		:buyphotonenthoughthereshaz2
		setVar $LSD__TOTAL 0
		setVar $LSD__Atomics "Max"
		setVar $LSD__Beacons "Max"
		setVar $LSD__Corbo "Max"
		setVar $LSD__Cloak "Max"
		setVar $LSD__Probe "Max"
		setVar $LSD__PScan "Yes"
		setVar $LSD__Limps "Max"
		setVar $LSD__Mines "Max"
		setVar $LSD__LRScan "Yes"
		setVar $LSD__Disrupt "Max"
		setVar $LSD__GenTorp "Max"
		setVar $LSD__T2Twarp "Yes"
		setVar $LSD__Holds "Max"
		setVar $LSD__Figs "Max"
		setVar $LSD__Shields "Max"
	elseif ($LSD_selection = "V")
		getInput $LSD_BOTTING ("  " & ANSI_5 & "Enter the Bot Name To Issue LSD Command Too? ")
		if ($LSD_BOTTING = $LSD__PAD)
			setVar $LSD_BOTTING $bot_name
		end
	elseif ($LSD_selection = "1")
		setVar $item_name "Cargo Holds"
		setVar $item_max 255
		gosub :getItemInput
		setVar $LSD__Holds $LSD_Selection
	elseif ($LSD_selection = "2")
		setVar $item_name "Fighters"
		setVar $item_max 400000
		gosub :getItemInput
		setVar $LSD__Figs $LSD_Selection
	elseif ($LSD_selection = "3")
		setVar $item_name "Shields"
		setVar $item_max 16000
		gosub :getItemInput
		setVar $LSD__Shields $LSD_Selection
	elseif (($LSD_selection = "G") AND ($LSD_ShipData_Valid))
		gosub :DisplayMenu
	elseif ($LSD_selection = "X")
		if (($LSD__Atomics = "") AND ($LSD__Beacons = "") AND ($LSD__Corbo = "") AND ($LSD__Cloak = "") AND ($LSD__Probe = "") AND ($LSD__PScan = "") AND 	($LSD__Limps = "") AND ($LSD__Mines = "") AND ($LSD__Photon = "") AND ($LSD__LRScan = "") AND ($LSD__Disrupt = "") AND 	($LSD__GenTorp = "") AND ($LSD__T2Twarp = "") AND ($LSD__Buffers = "") AND ($LSD__Holds = "") AND ($LSD__Figs = "") AND ($LSD__Shields = ""))
			if ($LSD__Trickster = "")
				echo "**" & ANSI_14 & $LSD_TagLineB & ANSI_15 & " - Nothing Was Selected From The Menu**"
				goto :TopOfMenu_NoClear
			end
		end
		if (($LSD_BOTTING = "") or ($LSD_BOTTING = $LSD__PAD))
		    	echo "****" & ANSI_14 & $LSD_TagLineB & ANSI_15 & " - Please specify name of Bot to address!"
			goto :TopOfMenu_NoClear
		end
		echo "**" ANSI_15
		setVar $item_type $LSD__Atomics
		gosub :prepareOrder
		setVar $item_type $LSD__Beacons
		gosub :prepareOrder
		setVar $item_type $LSD__Corbo
		gosub :prepareOrder
		setVar $item_type $LSD__Cloak
		gosub :prepareOrder
		setVar $item_type $LSD__Probe
		gosub :prepareOrder
		setVar $item_type $LSD__PScan
		setVar $yes_no TRUE
		gosub :prepareOrder
		setVar $item_type $LSD__Limps
		gosub :prepareOrder
		setVar $item_type $LSD__Mines
		gosub :prepareOrder
		setVar $item_type $LSD__Photon
		gosub :prepareOrder
		setVar $item_type $LSD__LRScan
		setVar $yes_no TRUE
		gosub :prepareOrder
		setVar $item_type $LSD__Disrupt
		gosub :prepareOrder
		setVar $item_type $LSD__GenTorp
		gosub :prepareOrder
		setVar $item_type $LSD__T2Twarp
		setVar $yes_no TRUE
		gosub :prepareOrder
		setVar $item_type $LSD__Holds
		gosub :prepareOrder
		setVar $item_type $LSD__Figs
		gosub :prepareOrder
		setVar $item_type $LSD__Shields
		gosub :prepareOrder
		if ($LSD_Tow <> "")
			setVar $LSD_Order ($LSD_Order & $LSD_Tow)
		else
			setVar $LSD_Order ($LSD_Order & 0)
		end
		setVar $LSD_Order ($LSD_Order & $LSD__PAD)
		if ($LSD__Trickster <> "")
			getWordPos $LSD__Trickster $LSD_Pos "^^"
			cuttext $LSD__Trickster $LSD__Trickster 1 ($LSD_pos - 1)
			stripText $LSD__Trickster " "
			stripText $LSD__Trickster "^"
		end
		if ($LSD__Trickster <> "")
			setVar $LSD_Order ($LSD_Order & $LSD__Trickster)
		else
			setVar $LSD_Order ($LSD_Order & 0)
		end
		setVar $LSD_Order ($LSD_Order & $LSD__PAD)
		if ($LSD_NumberOfShip <> "")
			setVar $LSD_Order ($LSD_Order & $LSD_NumberOfShip)
		else
			setVar $LSD_Order ($LSD_Order & 0)
		end
		setVar $LSD_Order ($LSD_Order & $LSD__PAD)
		if ($LSD_CustomShipName <> "")
			setVar $LSD_Order ($LSD_Order & $LSD_CustomShipName)
		else
			setVar $LSD_Order ($LSD_Order & $LSD_Ships_Names)
		end
		if ($LSD_BOTTING = $bot_name)
			setVar $LSD_Order ($LSD_Order & "              ")
			setVar $user_command_line "lsd " & $LSD_Order
			gosub :doAddHistory
			goto :runUserCommandLine
		end
		setVar $LSD_Attempt 1
		:LSD_Login_Loop
			gosub :killthetriggers
			setTextLineTrigger	NeedtoLogin		:NeedtoLogin	"Send a corporate memo to login."
			setTextLineTrigger	BotsBusy		:BotsBusy		"- Time Left   = "
			setTextLineTrigger	BotsNotBusy		:BotsNotBusy	"= General"
			setDelayTrigger		BotNotThere		:BotNotThere	4000
			send ("'" & $LSD_BOTTING & " Status*")
			pause
		:BotNotThere
			gosub :killthetriggers
			Echo "**" & ANSI_14 & $LSD_TagLineB & ANSI_15 & " - " & $LSD_BOTTING & "-bot Is Not Responding**"
			goto :wait_for_command
        	:NeedtoLogin
        		gosub :killthetriggers
			if ($LSD_Attempt <= 3)
	        	if ($startingLocation = "Command")
	        		send " T T Login***"
	        	elseif ($startingLocation = "Citadel")
					send " X T Login***"
				else
		            Echo "**" & ANSI_14 & $LSD_TagLineB & ANSI_15 & " - Please Login to Bots!**"
		            goto :wait_for_command
	        	end
	        	setDelayTrigger		AreWeLoggedIn	:AreWeLoggedIn	4000
	        	setTextLineTrigger	WeLoggedIn1		:WeLoggedIn		"- User Verified -"
	        	setTextLineTrigger	WeLoggedIn2		:WeLoggedIn		"- You are logged into this bot"
				Echo "**" & ANSI_14 & $LSD_TagLineB & ANSI_15 & " - Waiting For Response (Attempt #"&$LSD_Attempt&") ...**"
				pause
				:AreWeLoggedIn
					gosub :killthetriggers
					add $LSD_Attempt 1
					goto :LSD_Login_Loop
				:WeLoggedIn
					gosub :killthetriggers
					#Looping Back to get bot's status
					goto :LSD_Login_Loop
			else
				Echo "**" & ANSI_14 & $LSD_TagLineB & ANSI_15 & " - Unable To Login to Bot!!**"
				goto :wait_for_command
			end
  		:BotsBusy
  			gosub :killthetriggers
			Echo "**" & ANSI_14 & $LSD_TagLineB & ANSI_15 & " - Bot must be in General Mode**"
			goto :wait_for_command
  		:BotsNotBusy
  			gosub :killthetriggers
  			setTextLineTrigger	MODE_RESET	:MODE_RESET "All non-system scripts and modules killed, and modes reset."
  			setDelayTrigger		MODE_ISSUE	:MODE_ISSUE 4000
			Echo "**" & ANSI_14 & $LSD_TagLineB & ANSI_15 & " - Waiting 4 Seconds For Response...**"
  			send ("'" & $LSD_BOTTING & " StopAll*")
  			pause
			:MODE_ISSUE
				gosub :killthetriggers
				Echo "**" & ANSI_14 & $LSD_TagLineB & ANSI_15 & " - StopAll Timed Out. Please Try Again!**"
				goto :wait_for_command
			:MODE_RESET
				gosub :killthetriggers
				send ("'" & $LSD_BOTTING & " LSD " & $LSD_Order & "*")
				goto :wait_for_command
	end
	goto :TopOfMenu
:pad_this
	if ($LSD_str_pad < 10)
		setVar $LSD_str_pad "     " & $LSD_str_pad
	elseif ($LSD_str_pad < 100)
		setVar $LSD_str_pad "    " & $LSD_str_pad
	elseif ($LSD_str_pad < 1000)
		setVar $LSD_str_pad "   " & $LSD_str_pad
	elseif ($LSD_str_pad < 10000)
		setVar $LSD_str_pad "  " & $LSD_str_pad
	elseif ($LSD_str_pad < 100000)
		setVar $LSD_str_pad " " & $LSD_str_pad
	end
return
:CommaSize
	if ($LSD_CashAmount < 1000)
		#do nothing
	elseif ($LSD_CashAmount < 1000000)
    		getLength $LSD_CashAmount $LSD_len
		setVar $LSD_len ($LSD_len - 3)
		cutText $LSD_CashAmount $LSD_tmp 1 $LSD_len
		cutText $LSD_CashAMount $LSD_tmp1 ($LSD_len + 1) 999
		setVar $LSD_tmp $LSD_tmp & "," & $LSD_tmp1
		setVar $LSD_CashAmount $LSD_tmp
	elseif ($LSD_CashAmount <= 999999999)
		getLength $LSD_CashAmount $LSD_len
		setVar $LSD_len ($LSD_len - 6)
		cutText $LSD_CashAmount $LSD_tmp 1 $LSD_len
		setVar $LSD_tmp $LSD_tmp & ","
		cutText $LSD_CashAmount $LSD_tmp1 ($LSD_len + 1) 3
		setVar $LSD_tmp $LSD_tmp & $LSD_tmp1 & ","
		cutText $LSD_CashAmount $LSD_tmp1 ($LSD_len + 4) 999
		setVar $LSD_tmp $LSD_tmp & $LSD_tmp1
		setVar $LSD_CashAmount $LSD_tmp
	end
	return
:getItemInput
	if ($yes_no)
		Echo #27 & "[1A" & #27 & "[K" & ANSI_14 & "*" & $item_name & "                         *"
		getConsoleInput $LSD_selection SINGLEKEY
	else
		getInput $LSD_selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*" & $item_name & " To Buy (M for Maximum)?"
	end
	uppercase $LSD_selection
	if ($LSD_selection = "M")
		setVar $LSD_Selection "Max"
	elseif ($LSD_selection = "Y")
		setVar $LSD_Selection "Yes"
	elseif ($LSD_selection = "N")
		setVar $LSD_Selection ""
	else
		if ($yes_no)
			setVar $LSD_Selection ""
		else
			isNumber $LSD_tst $LSD_selection
			if ($LSD_tst <> 0)
				if ($LSD_selection = 0)
					setVar $LSD_Selection ""
				elseif ($LSD_selection > $item_max)
					setVar $LSD_Selection $item_max
				else
					setVar $LSD_Selection $LSD_selection
				end
			end
		end
	end
return
:prepareOrder
	if ($yes_no)
		if ($item_type <> "")
			setVar $LSD_Order ($LSD_Order & "Y")
		else
			setVar $LSD_Order ($LSD_Order & "N")
		end
	else
		if ($item_type <> "")
			if ($item_type = "Max")
				setVar $LSD_Order ($LSD_Order & "M")
			else
				setVar $LSD_Order ($LSD_Order & $item_type)
			end
		else
			setVar $LSD_Order ($LSD_Order & 0)
		end
	end
	setVar $LSD_Order ($LSD_Order & $LSD__PAD)
	setVar $yes_no FALSE
return
:CheckCosts
	setVar $LSD_CostsAreGood TRUE
	loadVar $LSD_LIMPREMOVALCOST
	loadVar $LSD_GENCOST
	loadVar $LSD_ARMIDCOST
	loadVar $LSD_LIMPCOST
	loadVar $LSD_BEACON
	loadVar $LSD_TWARPICOST
	loadVar $LSD_TWARPIICOST
	loadVar $LSD_TWARPUPCOST
	loadVar $LSD_PSCAN
	loadVar $LSD_ATOMICCOST
	loadVar $LSD_CORBOCOST
	loadVar $LSD_EPROBE
	loadVar $LSD_PHOTONCOST
	loadVar $LSD_CLOAKCOST
	loadVar $LSD_DISRUPTCOST
	loadVar $LSD_HOLOCOST
	loadVar $LSD_DSCANCOST
	loadVar $LSD_ReRegisterCost
	if (($LSD_LIMPREMOVALCOST = 0) OR ($LSD_GENCOST = 0) OR ($LSD_ARMIDCOST = 0) OR ($LSD_LIMPCOST = 0) OR ($LSD_BEACON = 0) OR ($LSD_TWARPICOST = 0) OR ($LSD_TWARPIICOST = 0) OR ($LSD_TWARPUPCOST = 0) OR ($LSD_PSCAN = 0) OR ($LSD_ATOMICCOST = 0) OR ($LSD_CORBOCOST = 0) OR ($LSD_EPROBE = 0) OR ($LSD_PHOTONCOST = 0) OR ($LSD_CLOAKCOST = 0) OR ($LSD_DISRUPTCOST = 0) OR ($LSD_HOLOCOST = 0) OR ($LSD_DSCANCOST = 0) OR ($LSD_ReRegisterCost = 0))
		gosub :gamestats
	end
return
:PadItemCosts
	getLength $LSD_PadThisCost $LSD_len
	if ($LSD_len = 1)
		setVar $LSD_PadThisCost "      " & $LSD_PadThisCost
	elseif ($LSD_len = 2)
		setVar $LSD_PadThisCost "     " & $LSD_PadThisCost
	elseif ($LSD_len = 3)
		setVar $LSD_PadThisCost "    " & $LSD_PadThisCost
	elseif ($LSD_len = 4)
		setVar $LSD_PadThisCost "   " & $LSD_PadThisCost
	elseif ($LSD_len = 5)
		setVar $LSD_PadThisCost "  " & $LSD_PadThisCost
	elseif ($LSD_len = 6)
		setVar $LSD_PadThisCost " " & $LSD_PadThisCost
	else

	end
	return
:GetClass0Costs
	send "CR1*Q  "
	waitfor "Commerce report for:"
	setTextLineTrigger LSD_CargoHolds	:LSD_CargoHolds "A  Cargo holds     : "
	setTextLineTrigger LSD_Fighters		:LSD_Fighters "B  Fighters        : "
	setTextLineTrigger LSD_Shields		:LSD_Shields "C  Shield Points   : "
	setTextTrigger LSD_Fini1		:LSD_Fini "Command [TL="
	setTextTrigger LSD_Fini2		:LSD_Fini "Citadel command (?"
	pause
	:LSD_CargoHolds
		killTrigger LSD_CargoHolds
		getWord CURRENTLINE $LSD_HoldCost 5
		isNumber $LSD_tst $LSD_HoldCost
		if ($LSD_tst = 0)
			setVar $LSD_HoldCost 0
		end
        pause
	:LSD_Fighters
		killTrigger LSD_Fighters
		getWord CURRENTLINE $LSD_FighterCost 4
		isNumber $LSD_tst $LSD_FighterCost
		if ($LSD_tst = 0)
			setVar $LSD_FighterCost 0
		end
		pause
	:LSD_Shields
		killTrigger LSD_Shields
		getWord CURRENTLINE $LSD_Shield 5
		isNumber $LSD_tst $LSD_Shield
		if ($LSD_tst = 0)
			setVar $LSD_Shield 0
		end
		pause
	:LSD_Fini
		gosub :killthetriggers
	setVar $LSD_CashAmount $LSD_HoldCost
	gosub :CommaSize
	setVar $LSD_LSD_HoldCost $LSD_CashAmount
	setVar $LSD_CashAmount $LSD_FighterCost
	gosub :CommaSize
	setVar $LSD_FighterCost $LSD_CashAmount
	setVar $LSD_CashAmount $LSD_Shield
	gosub :CommaSize
	setVar $LSD_Shield  $LSD_CashAmount
	return
:SetMenuEchos
	isNumber $LSD_tst $LSD_NumberOfShip
	if ($LSD_tst <> 0)
		if ($LSD_NumberOfShip > 0)
			getText $LSD__Trickster $LSD_Cost "^^" "@@"
			stripText $LSD_Cost ","
			stripText $LSD_Cost " "
			getText $LSD__Trickster $LSD_temp "@@" "!!"
			stripText $LSD_ReRegisterCost ","
			setVar $LSD_Cost ($LSD_Cost + $LSD_ReRegisterCost)
			setVar $LSD_MathOut ($LSD_NumberOfShip * $LSD_Cost)
			setVar $LSD__TOTAL ($LSD__TOTAL + $LSD_Mathout)
			setVar $LSD_CashAmount $LSD_Mathout
			gosub :CommaSize
	       		setVar $LSD_Echo_Trickster ANSI_15 & $LSD_NumberOfShip & " " & $LSD_temp & ANSI_7 & "  ($" & $LSD_CashAmount & ")"
	    	else
			setVar $LSD_Echo_Trickster ""
		end
	else
		setVar $LSD_Echo_Trickster ""
	end
	setVar $item_number $LSD__Atomics
	setVar $LSD_Cost $LSD_ATOMICCOST
	gosub :doSetMenuEcho
	setVar $LSD_Echo_Atomics $item_echo 
	setVar $item_number $LSD__Beacons
	setVar $LSD_Cost $LSD_BEACON
	gosub :doSetMenuEcho
	setVar $LSD_Echo_Beacons $item_echo 
	setVar $item_number $LSD__Corbo
	setVar $LSD_Cost $LSD_CORBOCOST
	gosub :doSetMenuEcho
	setVar $LSD_Echo_Corbo $item_echo 
	setVar $item_number $LSD__Cloak
	setVar $LSD_Cost $LSD_CLOAKCOST
	gosub :doSetMenuEcho
	setVar $LSD_Echo_Cloak $item_echo 
	setVar $item_number $LSD__Probe
	setVar $LSD_Cost $LSD_EPROBE
	gosub :doSetMenuEcho
	setVar $LSD_Echo_Probe $item_echo 
	if ($LSD__PScan = "Yes")
		setVar $LSD_Cost $LSD_PSCAN
		stripText $LSD_Cost ","
		setVar $LSD_MathOut $LSD_Cost
		isNumber $LSD_tst $LSD_NumberOfShip
		if ($LSD_tst <> 0)
			setVar $LSD_MathOut ($LSD_MathOut * $LSD_NumberOfShip)
			setVar $LSD_Multiplier ANSI_8 & "(X" & $LSD_NumberOfShip & ")"
		else
			setVar $LSD_Multiplier ""
		end
		setVar $LSD__TOTAL ($LSD__TOTAL + $LSD_MathOut)
		setVar $LSD_CashAmount $LSD_MathOut
		gosub :CommaSize
		setVar $LSD_Echo_PScan ANSI_15 & $LSD__PScan & "  " & $LSD_Multiplier & ANSI_7 & "($" & $LSD_CashAmount & ")"
	else
		setVar $LSD_Echo_PScan ""
	end
	setVar $item_number $LSD__Limps
	setVar $LSD_Cost $LSD_LIMPCOST
	gosub :doSetMenuEcho
	setVar $LSD_Echo_Limps $item_echo 
	setVar $item_number $LSD__Mines
	setVar $LSD_Cost $LSD_ARMIDCOST
	gosub :doSetMenuEcho
	setVar $LSD_Echo_Mines $item_echo 
	setVar $item_number $LSD__Photon
	setVar $LSD_Cost $LSD_PHOTONCOST
	gosub :doSetMenuEcho
	setVar $LSD_Echo_Photon $item_echo 
	if ($LSD__LRScan = "Yes")
		setVar $LSD_Cost $LSD_HOLOCOST
		stripText $LSD_Cost ","
		setVar $LSD_MathOut $LSD_Cost
		isNumber $LSD_tst $LSD_NumberOfShip
		if ($LSD_tst <> 0)
			setVar $LSD_MathOut ($LSD_MathOut * $LSD_NumberOfShip)
			setVar $LSD_Multiplier ANSI_8 & "(X" & $LSD_NumberOfShip & ")"
		else
			setVar $LSD_Multiplier ""
		end
		setVar $LSD__TOTAL ($LSD__TOTAL + $LSD_MathOut)
		setVar $LSD_CashAmount $LSD_MathOut
		gosub :CommaSize
		setVar $LSD_Echo_LRScan ANSI_15 & $LSD__LRScan & "  " & $LSD_Multiplier & ANSI_7 & "($" & $LSD_CashAmount & ")"
	else
		setVar $LSD_Echo_LRScan ""
	end
	setVar $item_number $LSD__Disrupt
	setVar $LSD_Cost $LSD_DISRUPTCOST
	gosub :doSetMenuEcho
	setVar $LSD_Echo_Disrupt $item_echo 
	setVar $item_number $LSD__GenTorp
	setVar $LSD_Cost $LSD_GENCOST
	gosub :doSetMenuEcho
	setVar $LSD_Echo_GenTorp $item_echo 
	if ($LSD__T2Twarp = "Yes")
		setVar $LSD_Cost $LSD_TWARPIICOST
		stripText $LSD_Cost ","
		setVar $LSD_MathOut $LSD_Cost
		isNumber $LSD_tst $LSD_NumberOfShip
		if ($LSD_tst <> 0)
			setVar $LSD_MathOut ($LSD_MathOut * $LSD_NumberOfShip)
			setVar $LSD_Multiplier ANSI_8 & "(X" & $LSD_NumberOfShip & ")"
		else
			setVar $LSD_Multiplier ""
		end
		setVar $LSD__TOTAL ($LSD__TOTAL + $LSD_MathOut)
		setVar $LSD_CashAmount $LSD_MathOut
		gosub :CommaSize
		setVar $LSD_Echo_T2Twarp ANSI_15 & $LSD__T2Twarp & "  " & $LSD_Multiplier & ANSI_7 & "($" & $LSD_CashAmount & ")"
	else
		setVar $LSD_Echo_T2Twarp ""
	end
	setVar $item_number $LSD__Holds
	setVar $LSD_Cost $LSD_HOLDCOST
	gosub :doSetMenuEcho
	setVar $LSD_Echo_Holds $item_echo 
	setVar $item_number $LSD__Figs
	setVar $LSD_Cost $LSD_FIGHTERCOST
	gosub :doSetMenuEcho
	setVar $LSD_Echo_Figs $item_echo 
	setVar $item_number $LSD__Shields
	setVar $LSD_Cost $LSD_SHIELD
	gosub :doSetMenuEcho
	setVar $LSD_Echo_Shields $item_echo 
return
:doSetMenuEcho
	isNumber $LSD_tst $item_number
	if ($LSD_tst <> 0)
		stripText $LSD_Cost ","
		setVar $LSD_MathOut ($item_number * $LSD_Cost)
		isNumber $LSD_tst $LSD_NumberOfShip
		if ($LSD_tst <> 0)
			setVar $LSD_MathOut ($LSD_MathOut * $LSD_NumberOfShip)
			setVar $LSD_Multiplier ANSI_8 & "(X" & $LSD_NumberOfShip & ")"
		else
			setVar $LSD_Multiplier ""
		end
		setVar $LSD__TOTAL ($LSD__TOTAL + $LSD_MathOut)
		setVar $LSD_CashAmount $LSD_MathOut
		gosub :CommaSize
		setVar $item_echo ANSI_15 & $item_number & "  " & $LSD_Multiplier & ANSI_7 & "($" & $LSD_CashAmount & ")"
	elseif ($item_number  = "Max")
		setVar $item_echo "Max"
	else
		setVar $item_echo ""
	end
return
:LoadShipData
	fileExists $LSD_test $LSD_Ships_File
	if ($LSD_test)
		setVar $LSD_i 1
		read $LSD_Ships_File $LSD_Line $LSD_i
		while (($LSD_Line <> EOF) AND ($LSD_i <= $LSD_ShipListMax))
			getWordPos $LSD_Line $LSD_pos #9
			if ($LSD_pos <> 2)
				setVar $LSD_ShipData_Valid FALSE
				return
			end
			cutText $LSD_Line $LSD_temp 1 1
			setVar $LSD_ShipList[$LSD_i] $LSD_temp
			cutText $LSD_Line $LSD_Line2 3 999
			SetVar $LSD_Line $LSD_line2
			getWordPos $LSD_Line $LSD_pos #9
			if ($LSD_pos = 0)
				setVar $LSD_ShipData_Valid FALSE
				return
			end
			cutText $LSD_Line $LSD_temp1 1 ($LSD_pos - 1)
			setVar $LSD_ShipList[$LSD_i][1] $LSD_temp1
			stripText $LSD_Line $LSD_temp1 & #9
			getWordPos $LSD_Line $LSD_pos #9
			if ($LSD_pos = 0)
				setVar $LSD_ShipData_Valid FALSE
				return
			end
			cutText $LSD_Line $LSD_temp2 1 ($LSD_pos - 1)
			setVar $LSD_ShipList[$LSD_i][2] $LSD_temp2
			stripText $LSD_Line $LSD_temp2 & #9
			setVar $LSD_ShipList[$LSD_i][3] $LSD_Line
	        :NextRealLine
			add $LSD_i 1
			read $LSD_Ships_File $LSD_Line $LSD_i
			end
			setVar $LSD_ShipData_Valid TRUE
	else
		setVar $LSD_ShipData_Valid FALSE
	end
	return
:ParseShipData
	#[]Ship Letter [Ship Name][Cost][ANSI Ship Name]
	delete $LSD_Ships_File
	setVar $LSD_i 0
	send "S B N Y ?"
	waitfor "Which ship are you interested in "
	setTextLineTrigger NextPage		:NextPage "<+> Next Page"
	:NextPageReset
	setTextLineTrigger Quit2Leave	:Quit2Leave "<Q> To Leave"
	:LineTrigNext
	setTextLineTrigger LineTrig		:LineTrig
	pause
	:NextPage
		gosub :killthetriggers
		add $LSD_i 1
		setVar $LSD_ShipList[$LSD_i] "+"
		setVar $LSD_ShipList[$LSD_i][1] "This Inidcates"
		setVar $LSD_ShipList[$LSD_i][2] "Another"
		setVar $LSD_ShipList[$LSD_i][3] "Page is availble for display"
		send "+"
		waitfor "Which ship are you interested in "
		setTextLineTrigger LineTrig		:LineTrig
		setTextLineTrigger NextPage		:Quit2Leave "<+> Next Page"
		setTextLineTrigger Quit2Leave	:Quit2Leave "<Q> To Leave"
		pause
	:Quit2Leave
		gosub :killthetriggers
		send " Q Q "
		waitfor "<StarDock> Where to? (?="
		delete $LSD_tstFile
		setVar $LSD_ii 1
		while ($LSD_ii <= $LSD_i)
			write $LSD_Ships_File $LSD_ShipList[$LSD_ii] & #9 & $LSD_ShipList[$LSD_ii][1] & #9 & $LSD_ShipList[$LSD_ii][2] & #9 & $LSD_ShipList[$LSD_ii][3]
	    	add $LSD_ii 1
		end
		return
	:LineTrig
		setVar $LSD_temp CURRENTLINE & "@@@"
		if ($LSD_temp <> "@@@")
			getWordPos $LSD_temp $LSD_pos "<"
			if ($LSD_pos = 1)
				getWordPos $LSD_temp $LSD_pos "<Q>"
				if ($LSD_pos = 0)
					add $LSD_i 1
					GetText $LSD_temp $LSD_ShipList[$LSD_i] "<" ">"
					GetText $LSD_temp $LSD_ShipList[$LSD_i][1] "> " "   "
					GetText $LSD_temp $LSD_ShipList[$LSD_i][2] "   " "@@@"
					stripText $LSD_ShipList[$LSD_i][2] " "
					GetText CURRENTANSILINE  $LSD_ShipList[$LSD_i][3] "[35m> " "    "
				end
			end
		end
		goto :LineTrigNext
:DisplayMenu
	#Array Format [X]Ship Letter [Ship Name][Cost][ANSI Ship Name]
	setVar $LSD_LineWidthMax 45
	setVar $LSD_PAGES_EXIST FALSE
	setVar $LSD_NumberOfShip ""
	setVar $LSD_i 1
	:NextPagePlease
		Echo #27 & "[2J"
		Echo "***"
		if ($isDockShopper)
			Echo ("     "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
			echo ANSI_14 & "*        LoneStar's StarDock Shopper"
			echo ANSI_9 & "*         Mind ()ver Matter Edition"
			echo ANSI_15 & "*          Emporium Daily Specials"
			echo ANSI_8 & "*                Version " & $LSD_CURENT_VERSION & "*"
			Echo ("     "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
			echo "*"
		end
		setArray $LSD_MenuSelections $LSD_ShipListMax
		while ($LSD_ShipList[$LSD_i] <> 0)
			if ($LSD_ShipList[$LSD_i] <> "+")
				setVar $LSD_Spaces $LSD_LineWidthMax
				setVar $LSD_ANSI_Line "  " & ANSI_5 & "<" & ANSI_6 & $LSD_ShipList[$LSD_i] & ANSI_5 & "> "
				setVar $LSD_temp $LSD_ShipList[$LSD_i][2]
				stripText $LSD_temp ","
				stripText $LSD_temp " "
				getLength $LSD_ShipList[$LSD_i][1] $LSD_len
				if ($LSD_len > ($LSD_LineWidthMax - 10))
					subtract $LSD_len 10
					cutText $LSD_ShipList[$LSD_i][3] $LSD_temp 1 $LSD_len
				else
					setVar $LSD_temp $LSD_ShipList[$LSD_i][3]
				end
				setVar $LSD_ANSI_Line $LSD_ANSI_Line & $LSD_temp
				subtract $LSD_Spaces $LSD_len
				getLength $LSD_ShipList[$LSD_i][2] $LSD_len
				subtract $LSD_Spaces $LSD_len
				setVar $LSD_Spacer ""
				while ($LSD_Spaces > 0)
					setVar $LSD_Spacer $LSD_Spacer & " "
					subtract $LSD_Spaces 1
				end
				setVar $LSD_ANSI_Line $LSD_ANSI_Line & $LSD_Spacer & ANSI_14 & $LSD_ShipList[$LSD_i][2] & "*"
				setVar $LSD_MenuSelections[$LSD_i] $LSD_ShipList[$LSD_i]
				echo $LSD_ANSI_Line
			else
				setVar $LSD_PAGES_EXIST TRUE
				SetVar $LSD_PageIDX $LSD_i
				goto :PageDone
			end
			add $LSD_i 1
		end
	:PageDone
		echo "   " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196
		echo "*"
		if ($LSD_PAGES_EXIST)
			Echo "  " & ANSI_5 & "<" & ANSI_6 & "+" & ANSI_5 & ">" & ANSI_6 & " NextPage*"
		end
		echo "  " & ANSI_5 & "<" & ANSI_6 & "Q" & ANSI_5 & ">" & ANSI_6 & " To Leave*"
		echo "*"
	:MakingAnotherSlection
		echo "  " & ANSI_5 & "Which ship are you interested in? "
		getConsoleInput $LSD_selection SINGLEKEY
		upperCase $LSD_selection
		if ($LSD_selection = "Q")
			return
		elseif (($LSD_PAGES_EXIST) AND ($LSD_selection = "+"))
		if ($LSD_i = $LSD_PageIDX)
			setVar $LSD_PageTwoSelected TRUE
			add $LSD_i 1
		else
			setVar $LSD_PageTwoSelected FALSE
			setVar $LSD_i 1
		end
		goto :NextPagePlease
		else
		setVar $LSD_ptr 1
        while ($LSD_ptr <= $LSD_ShipListMax)
			if ($LSD_MenuSelections[$LSD_ptr] <> 0)
				if ($LSD_MenuSelections[$LSD_ptr] = $LSD_selection)
					setPrecision 0
					setVar $LSD_NumberOfShip ""
					:InputAnotherAmount
						getInput $LSD_NumberOfShip "  " & ANSI_5 & "How Many " & $LSD_ShipList[$LSD_ptr][1] & "'s ?"
						isNumber $LSD_test $LSD_NumberOfShip
						if ($LSD_test = 0)
							goto :InputAnotherAmount
						end
						if (($LSD_NumberOfShip < 0))
							setVar $LSD_NumberOfShip 0
							setVar $LSD__Trickster ""
							goto :InputAnotherAmount
						end
						if ($LSD_NumberOfShip = 0)
							setVar $LSD__Trickster ""
						else
							if ($LSD_PageTwoSelected)
								setVar $LSD__Trickster "+" & $LSD_selection & "^^" & $LSD_ShipList[$LSD_ptr][2] & "@@" & $LSD_ShipList[$LSD_ptr][3] & "!!"
							else
								setVar $LSD__Trickster $LSD_selection & "^^" & $LSD_ShipList[$LSD_ptr][2] & "@@" & $LSD_ShipList[$LSD_ptr][3] & "!!"
							end
							getInput $LSD_CustomShipName "  " & ANSI_5 & "What do you want to name this ship? (30 chars) "
							if ($LSD_CustomShipName = "")
								setVar $LSD_CustomShipName $LSD_Ships_Names
							else
								setVar $LSD_CustomShipNameTEST $LSD_CustomShipName
								stripText $LSD_CustomShipNameTEST " "
								if ($LSD_CustomShipNameTEST = "")
									setVar $LSD_CustomShipName $LSD_Ships_Names
								else
									getLength $LSD_CustomShipName $LSD_len
									if ($LSD_len > 30)
										cutText $LSD_CustomShipName $LSD_CustomShipName 1 30
									end
								end
							end
						end
					return
				end
			end
			add $LSD_ptr 1
		end
	end
	echo "*"
	echo #27 & "[1A" & #27 & "[2K"
   	goto :MakingAnotherSlection
return
#============================================= END DOCK SHOPPER MENU  ==================================================
#============================================= PSI MACROS (PLANET MACROS) ==================================================
#Credit to Psi
:PsiMacs
	killalltriggers
	gosub :current_prompt
	setVar $validPrompts "Citadel"
	gosub :checkStartingPrompt
	loadVar $psimac_corp_limpet_drop_amt
	if ($psimac_corp_limpet_drop_amt < 1)
	     setVar $psimac_corp_limpet_drop_amt 3
	     saveVar $psimac_corp_limpet_drop_amt
	end
	loadVar $psimac_corp_armid_drop_amt
	if ($psimac_corp_armid_drop_amt < 1)
	     setVar $psimac_corp_armid_drop_amt 1
	     saveVar $psimac_corp_armid_drop_amt
	end
	loadVar $psimac_corp_ftr_drop_amt
	if ($psimac_corp_ftr_drop_amt < 1)
	     setVar $psimac_corp_ftr_drop_amt 1
	     saveVar $psimac_corp_ftr_drop_amt
	end
	setTextLineTrigger getp :getp "Planet #"
	send "q*c "
	pause
	:getp
		getWord CURRENTLINE $PLANET 2
		stripText $PLANET "#"
		waitOn "Citadel command (?="
	:print_the__planet_menu
	:planet_menu_without_clear
		echo "**"
		echo ANSI_15 "                       -=( " ANSI_14 "Psi Planet Macros" ANSI_15 " )=-  *"
		echo ANSI_5  " -----------------------------------------------------------------------------*"
		echo ANSI_9 #27&"[35m<"&#27&"[32m1"&#27&"[35m> " & ANSI_14 &"Lay 1 personal limpet" & ANSI_9 & ", land         " & ANSI_11 &#27&"[35m<"&#27&"[32m5"&#27&"[35m> " & ANSI_14 & "Holoscan" & ANSI_9 & ", land*"
		echo #27&"[35m<"&#27&"[32m2"&#27&"[35m> " & ANSI_14 & "Lay " & $psimac_corp_limpet_drop_amt & " corporate " & ANSI_11 & #27&"[35m<"&#27&"[32mL"&#27&"[35m>" & ANSI_14 & "impet(s)" & ANSI_9 & ", land   " & ANSI_11 #27&"[35m<"&#27&"[32m6"&#27&"[35m> " & ANSI_14 & "Lift attack*"
		echo #27&"[35m<"&#27&"[32m3"&#27&"[35m> " & ANSI_14 & "Lay " & $psimac_corp_armid_drop_amt & " corporate " & ANSI_11 & #27&"[35m<"&#27&"[32mA"&#27&"[35m>" & ANSI_14 & "rmid(s)" & ANSI_9 & ", land    " & ANSI_11 #27&"[35m<"&#27&"[32m7"&#27&"[35m> " & ANSI_14 & "Drop " & $psimac_corp_ftr_drop_amt & " corporate " & ANSI_11 & #27&"[35m<"&#27&"[32mF"&#27&"[35m>" & ANSI_14 & "ighter(s)" & ANSI_9 & "*"
		echo #27&"[35m<"&#27&"[32m4"&#27&"[35m> " & ANSI_14 & "Density scan" & ANSI_9 & ", land             " & ANSI_11 & "     " & #27&"[35m<"&#27&"[32m8"&#27&"[35m> " & ANSI_14 & "Launch a mine disrupter" & ANSI_9 & ", land*"
		echo         "*"
		echo #27&"[35m<"&#27&"[32mB"&#27&"[35m> " & ANSI_14 & "Get Xport List" & ANSI_9 & ", land                " ANSI_11 #27&"[35m<"&#27&"[32mE"&#27&"[35m> " & ANSI_14 & "Toggle IG" & ANSI_9 & ", land " ANSI_11 "*"
		echo #27&"[35m<"&#27&"[32mC"&#27&"[35m> " & ANSI_14 & "Xport into ship" & ANSI_9 & ", land               " ANSI_11 #27&"[35m<"&#27&"[32mG"&#27&"[35m> " & ANSI_14 & "Swap Planets*"
		echo #27&"[35m<"&#27&"[32mD"&#27&"[35m> " & ANSI_14 & "Get sector planet list" & ANSI_9 & ", land " ANSI_11 "*"
		echo ANSI_5  " -----------------------------------------------------------------------------**"
	:getPlanetMacroInput
		echo ANSI_10 "Your choice?*"
		getConsoleInput $chosen_option SINGLEKEY
		upperCase $chosen_option
		killalltriggers
	:process_command2
		if ($chosen_option = "1")
			goto :perslimp
		elseif ($chosen_option = "2")
			goto :corplimp
		elseif ($chosen_option = "3")
			goto :corparm
		elseif ($chosen_option = "4")
			gosub :dscan2
			goto :wait_for_command
		elseif ($chosen_option = "5")
			gosub :hscan
			goto :wait_for_command
		elseif ($chosen_option = "6")
			goto :lifta
		elseif ($chosen_option = "7")
			goto :dropfig
		elseif ($chosen_option = "8")
			gosub :quikstats
			if ($MINE_DISRUPTORS > 0)
				getInput $test "Sector to disrupt: "
				isNumber $numtest $test
				if ($numtest < 1)
					echo ANSI_12 "**Bad sector number!*"
					goto :planetMacMenu
				end
				if ($test > SECTORS) OR ($test <= 10)
					echo ANSI_12 "**Bad sector number!*"
					goto :planetMacMenu
				end
				send "q q c  w  y" & $test & "*  *  *  q  l " $PLANET "* c s*  "
				waitOn "Computer command [TL="
				waitOn "Citadel command (?=help)"
				goto :wait_for_command
			else
				send "'Out of mine disruptors!*"
				waitOn "Citadel command (?=help)"
				goto :wait_for_command
			end
		elseif ($chosen_option = "B")
			send "q q  x* *    l j"&#8&$PLANET&"* c @"
			waitOn "Average Interval Lag:"
			goto :wait_for_command
		elseif ($chosen_option = "C")
			# Get and check input
			getInput $shipnum "Ship number to xport to: "
			isNumber $numtest $shipnum
			if ($numtest < 1)
			   echo ANSI_12 "*Invalid ship number!*"
			   goto :wait_for_command
			end
			if ($shipnum < 1) OR ($shipnum > 65000)
			   echo ANSI_12 "*Invalid ship number!*"
			   goto :wait_for_command
			end
			setVar $msg ""
			gosub :killthetriggers
			setTextLineTrigger tdet_trg1 :txport_notavail2 "That is not an available ship."
			setTextLineTrigger tdet_trg2 :txport_badrange2 "only has a transport range of"
			setTextLineTrigger tdet_trg3 :txport_security2 "SECURITY BREACH! Invalid Password, unable to link transporters."
			setTextLineTrigger tdet_trg4 :txport_noaccess2 "Access denied!"
			setTextLineTrigger tdet_trg5 :txport_xprtgood2 "Security code accepted, engaging transporter control."
			setTextTrigger tdet_trg6 :txport_go_ahead2 "Average Interval Lag:"
			send "q q  x    " & $shipnum & "    *    *    *    l j"&#8&$PLANET&"*  @"
			pause
			goto :print_the__planet_menu
			:txport_notavail2
				setVar $msg ANSI_12 & "**That ship is not available.*"
				pause
			:txport_badrange2
			     setVar $msg ANSI_12 & "**That ship is too far away.*"
			     pause
			:txport_security2
			     setVar $msg ANSI_12 & "**That ship is passworded.*"
			     pause
			:txport_noaccess2
			     setVar $msg ANSI_12 & "**Cannot access that ship.*"
			     pause
			:txport_xprtgood2
			     setVar $msg ANSI_10 & "**Xport good!*"
			     pause
			:txport_go_ahead2
				gosub :quikstats
				if ($CURRENT_PROMPT = "Planet")
					send "c "
				end
				gosub :killthetriggers
				echo $msg
				goto :wait_for_command
		elseif ($chosen_option = "D")
			send "q q  lj"&#8&$PLANET&"* c @"
			waitOn "Average Interval Lag:"
			goto :wait_for_command
		elseif ($chosen_option = "E")
			send "q q b z y  l j"&#8&$PLANET&"* c @"
			waitOn "Average Interval Lag:"
			goto :wait_for_command
		elseif ($chosen_option = "G")
			getInput $test "Planet to Swap to:: "
			isNumber $numtest $test
			if ($numtest < 1)
			      echo ANSI_12 "**Not a Planet Number!*"
			      goto :planetMacMenu
			else
				setvar $psimac_planet_swap "q q l "&$test&"*"&$PLANET&"* c"
				send $psimac_planet_swap
			end
			goto :wait_for_command
		elseif ($chosen_option = "F")
			getInput $test "Fighters to deploy: "
			isNumber $numtest $test
			if ($numtest < 1)
				echo ANSI_12 "**Bad fighter count!*"
			elseif ($test <= 0)
				setVar $psimac_corp_ftr_drop_amt 1
				saveVar $psimac_corp_ftr_drop_amt
			else
				setVar $psimac_corp_ftr_drop_amt $test
				saveVar $psimac_corp_ftr_drop_amt
			end
			goto :print_the__planet_menu
		elseif ($chosen_option = "L")
			getInput $test "Limpets to deploy: "
			isNumber $numtest $test
			if ($numtest < 1)
				echo ANSI_12 "**Bad limpet count!*"
			elseif ($test > 250)
				setVar $psimac_corp_limpet_drop_amt 250
				saveVar $psimac_corp_limpet_drop_amt
			elseif ($test <= 0)
				setVar $psimac_corp_limpet_drop_amt 1
				saveVar $psimac_corp_limpet_drop_amt
			else
				setVar $psimac_corp_limpet_drop_amt $test
				saveVar $psimac_corp_limpet_drop_amt
			end
			goto :print_the__planet_menu
		elseif ($chosen_option = "A")
			getInput $test "Armids to deploy: "
			isNumber $numtest $test
			if ($numtest < 1)
				echo ANSI_12 "**Bad armid count!*"
			elseif ($test > 250)
				setVar $psimac_corp_armid_drop_amt 250
				saveVar $psimac_corp_armid_drop_amt
			elseif ($test <= 0)
				setVar $psimac_corp_armid_drop_amt 1
				saveVar $psimac_corp_armid_drop_amt
			else
				setVar $psimac_corp_armid_drop_amt $test
				saveVar $psimac_corp_armid_drop_amt
			end
			goto :print_the__planet_menu
		else
			goto :wait_for_command
		end
:perslimp
	gosub :quikstats
	if ($LIMPETS > 0)
		send "q q z n h21  *  p z n n * l " $PLANET "* c s* "
		setVar $depType "limpets"
		setTextLineTrigger toomanypl :toomany "!  You are limited to "
		setTextLineTrigger plclear :plclear "Done. You have "
		setTextLineTrigger enemypl :noperdown "These mines are not under your control."
		pause
	else
		send "'Out of limpets!*"
		waitOn "Citadel command (?=help)"
		goto :wait_for_command
	end
:plclear
	gosub :killthetriggers
	waitOn "Citadel command (?=help)"
	send "s* "
	setTextLineTrigger perdown :perdown "(Type 2 Limpet) (yours)"
	setTextLineTrigger noperdown :noperdown "Citadel treasury contains"
	pause
:perdown
	gosub :killthetriggers
	send "'Personal Limpet Deployed!*"
	waitOn "Citadel command (?=help)"
	goto :wait_for_command
:noperdown
	gosub :killthetriggers
	send "'Sector already has enemy limpets present!*"
	waitOn "Citadel command (?=help)"
	goto :wait_for_command
#lays a corp limp
	:corplimp
	gosub :quikstats

	if ($LIMPETS > 0)
		send "q q z n h2z" & $psimac_corp_limpet_drop_amt & "* z c *  l " $PLANET "* c s* "
		if ($psimac_corp_limpet_drop_amt > 1)
			setVar $depType "Limpets"
		else		
			setVar $depType "Limpet"	
		end
		setTextLineTrigger toomanycl :toomany "!  You are limited to "
		setTextLineTrigger clclear :clclear "Done. You have "
		setTextLineTrigger enemycl :nocldown "These mines are not under your control."
		setTextLineTrigger notenoughcl :notenough "You don't have that many mines available."
		pause
	else
		send "'Out of limpets!*"
		waitOn "Citadel command (?=help)"
		goto :wait_for_command
	end
:clclear
	gosub :killthetriggers
	waitOn "Citadel command (?=help)"
	send "s* "
	setTextLineTrigger cldown :cldown "(Type 2 Limpet) (belong to your Corp)"
	setTextLineTrigger nocldown :nocldown "Citadel treasury contains"
	pause
:cldown
	gosub :killthetriggers
	send "'"&$psimac_corp_limpet_drop_amt&" Corporate "&$depType&" Deployed!*"
	waitOn "Citadel command (?=help)"
	goto :wait_for_command
:nocldown
	gosub :killthetriggers
	send "'Sector already has enemy limpets present!*"
	waitOn "Citadel command (?=help)"
	goto :wait_for_command
	#lays a corp armid
	:corparm
	gosub :quikstats
	if ($ARMIDS > 0)
		if ($psimac_corp_armid_drop_amt > 1)
			setVar $depType "Armids"
		else
			setVar $depType "Armid"
		end
		send "q q z n h1z" & $psimac_corp_armid_drop_amt & " * z c *  l " $PLANET "* c s* "
		setTextLineTrigger toomanya :toomany "!  You are limited to "
		setTextLineTrigger aclear :aclear "Done. You have "
		setTextLineTrigger enemya :noadown "These mines are not under your control."
		setTextLineTrigger notenoughca :notenough "You don't have that many mines available."
		pause
	else
		send "'Out of armids!*"
		waitOn "Citadel command (?=help)"
		goto :wait_for_command
	end
:aclear
	gosub :killthetriggers
	waitOn "Citadel command (?=help)"
	send "s* "
	setTextLineTrigger adown :adown "(Type 1 Armid) (belong to your Corp)"
	setTextLineTrigger noadown :noadown "Citadel treasury contains"
	pause
:adown
	gosub :killthetriggers
	send "'"&$psimac_corp_armid_drop_amt&" Corporate"&$depType&" Deployed!*"
	waitOn "Citadel command (?=help)"
	goto :wait_for_command
:noadown
	gosub :killthetriggers
	send "'Sector already has enemy armids present!*"
	waitOn "Citadel command (?=help)"
	goto :wait_for_command
:dscan2
	send "q q z n sdzn l " $PLANET "* c  "
	waitOn "<Enter Citadel>"
	waitOn "Citadel command (?=help)"
	gosub :displayAdjacentGridAnsi
return
:hscan
	send "q q z n s hzn* l " $PLANET "*  c  "
	waitOn "<Enter Citadel>"
	waitOn "Citadel command (?=help)"
	gosub :displayAdjacentGridAnsi
return
:lifta
	send "q q z n a y y " $SHIP_MAX_ATTACK "* * z n q z n  l " $PLANET "*  m  *** c s* @"
	waitOn "Average Interval Lag:"
	goto :getPlanetMacroInput
:dropfig
	gosub :quikstats
	if ($FIGHTERS > 0)
		send " q q f z" & $psimac_corp_ftr_drop_amt & "* z c d *  l " $PLANET "* c s* "
		if ($psimac_corp_ftr_drop_amt > 1)
			setVar $depType "Fighters"
		else
			setVar $depType "Fighter"
		end
		setTextLineTrigger toomanyfig :toomany "Too many fighters in your fleet!"
		setTextLineTrigger figclear :figclear " fighter(s) in close support."
		setTextLineTrigger enemyfig :nofigdown "These fighters are not under your control."
		pause
	else
		 send "'Out of fighters!*"
		 waitOn "Citadel command (?=help)"
		 goto :wait_for_command
	end
:figclear
	gosub :killthetriggers
	waitOn "Citadel command (?=help)"
	send "s* "
	setTextLineTrigger figdown :figdown "(belong to your Corp) [Defensive]"
	setTextLineTrigger nofigdown :nofigdown "Citadel treasury contains"
	pause
:figdown
	gosub :killthetriggers
	send "'"&$psimac_corp_ftr_drop_amt&" Corporate "&$depType&" Deployed!*"
	setVar $target $CURRENT_SECTOR
	gosub :addFigToData
	waitOn "Citadel command (?=help)"
	goto :wait_for_command
:nofigdown
	gosub :killthetriggers
	send "'Sector already has enemy fighters present!*"
	waitOn "Citadel command (?=help)"
	goto :wait_for_command
:toomany
	gosub :killthetriggers
	waitOn "<Scan Sector>"
	waitOn "Citadel command (?=help)"
	clientMessage "Ship cannot carry that many " & $depType & "!"
	clientMessage "No " & $depType & " were deployed!"
	goto :wait_for_command
:notenough
	gosub :killthetriggers
	waitOn "<Scan Sector>"
	waitOn "Citadel command (?=help)"
	clientMessage "Ship doesn't have that many " & $depType & "!"
	clientMessage "No " & $depType & " were deployed!"
	goto :wait_for_command
:donePsiMacs
        echo #27 "[30D                           " #27 "[30D"
        goto :wait_for_command
#==================================END PSI MAC (PLANET MACROS) ========================================
#==================================DOCK KIT (STARDOCK MACROS) =========================================
#Credit Dynarri/Singularity
:dockKit
	killalltriggers
	gosub :current_prompt
	setVar $validPrompts "<StarDock> <Hardware <Libram <FedPolice> <Shipyards> <Tavern>"
	gosub :checkStartingPrompt
:print_the_menu
	gosub :quikstats
	echo "[2J"
:menu_without_clear
	echo "*"
	echo ANSI_15 "               -=( " ANSI_12 "Dnyarri's Dock Survival Toolkit" ANSI_15 " )=-  *"
	echo ANSI_5  " -----------------------------------------------------------------------------*"
	echo ANSI_9 #27&"[35m<"&#27&"[32m1"&#27&"[35m> " & ANSI_14 & " display stardock sector" & ANSI_9 & ", re-dock " #27&"[35m<"&#27&"[32m6"&#27&"[35m> " & ANSI_14 & " check twarp lock" & ANSI_9 & ", re-dock*"
	echo #27&"[35m<"&#27&"[32m2"&#27&"[35m> " & ANSI_14 & " holoscan" & ANSI_9 & ", re-dock                " #27&"[35m<"&#27&"[32m7"&#27&"[35m> " & ANSI_14 & " twarp out*"
	echo #27&"[35m<"&#27&"[32m3"&#27&"[35m> " & ANSI_14 & " density scan" & ANSI_9 & ", re-dock            " #27&"[35m<"&#27&"[32m8"&#27&"[35m> " & ANSI_14 & " lock tow" & ANSI_9 & ", twarp out*"
	echo #27&"[35m<"&#27&"[32m4"&#27&"[35m> " & ANSI_14 & " get xport list" & ANSI_9 & ", re-dock          " #27&"[35m<"&#27&"[32m9"&#27&"[35m> " & ANSI_14 & " xport" & ANSI_9 & ", re-dock*"
	echo #27&"[35m<"&#27&"[32m5"&#27&"[35m> " & ANSI_14 & " get planet list" & ANSI_9 & ", re-dock         *"
	echo         "*"
	echo #27&"[35m<"&#27&"[32mA"&#27&"[35m> " & ANSI_14 & " launch mine disruptor" & ANSI_9 & ", re-dock   " #27&"[35m<"&#27&"[32mE"&#27&"[35m> " & ANSI_14 & " make a planet" & ANSI_9 & ", re-dock*"
	echo #27&"[35m<"&#27&"[32mB"&#27&"[35m> " & ANSI_14 & " set avoid" & ANSI_9 & ",re-dock                " #27&"[35m<"&#27&"[32mF"&#27&"[35m> " & ANSI_14 & " land on planet and drop ore" & ANSI_9 & ", re-dock*"
	echo #27&"[35m<"&#27&"[32mC"&#27&"[35m> " & ANSI_14 & " clear avoided sector" & ANSI_9 & ", re-dock    " #27&"[35m<"&#27&"[32mG"&#27&"[35m> " & ANSI_14 & " land on planet and take all" & ANSI_9 & ", re-dock*"
	echo #27&"[35m<"&#27&"[32mD"&#27&"[35m> " & ANSI_14 & " plot course" & ANSI_9 & ", re-dock             " #27&"[35m<"&#27&"[32mH"&#27&"[35m> " & ANSI_14 & " land on and destroy planet" & ANSI_9 & ", re-dock*"
	echo "*"
	echo #27&"[35m<"&#27&"[32mZ"&#27&"[35m> " & ANSI_14 & " cloak out*"
	echo #27&"[35m<"&#27&"[32mL"&#27&"[35m> " & ANSI_14 & " get corpie locations" & ANSI_9 & ", re-dock*"
	echo #27&"[35m<"&#27&"[32mW"&#27&"[35m> " & ANSI_14 & " C U Y (enable t-warp)" & ANSI_9 & " ,re-dock*"
	echo #27&"[35m<"&#27&"[32mT"&#27&"[35m> " & ANSI_14 & " toggle cn9" & ANSI_9 & ", re-dock*"
	echo #27&"[35m<"&#27&"[32mO"&#27&"[35m> " & ANSI_14 & " Ore Swapper X-port*"
	echo ANSI_5  " -----------------------------------------------------------------------------**"
	echo ANSI_10 "Your choice?*"
		getConsoleInput $chosen_option SINGLEKEY
		upperCase $chosen_option
		killalltriggers
:process_command
	if ($chosen_option = "1")
	     send "qqq  z  n  dp  s  s "
      	     waitOn "Landing on Federation StarDock."
	     waitOn "<Shipyards> Your option (?)"
	elseif ($chosen_option = "2")
	     send "qqq  z  n  sh*  p  s  s "
	     waitOn "Landing on Federation StarDock."
	     gosub :quikstats
	     waitOn "<Shipyards> Your option (?)"
	elseif ($chosen_option = "3")
	     send "qqq  z  n  sdp  s  s "
	     waitOn "Landing on Federation StarDock."
	     waitOn "<Shipyards> Your option (?)"
	elseif ($chosen_option = "4")
	     send "qqq  z  n  x**    p  s  s "
	     waitOn "Landing on Federation StarDock."
	     waitOn "<Shipyards> Your option (?)"
	elseif ($chosen_option = "5")
	     send "qqq  z  n  l*  q  q  z  n  p  s  s "
	     waitOn "Landing on Federation StarDock."
	     waitOn "<Shipyards> Your option (?)"
	elseif ($chosen_option = "6")
	     if ($TWARP = "No")
	           echo ANSI_12 "**Cannot T-warp. No Twarp drive!*"
	           goto :wait_for_command
	     elseif ($ORE_HOLDS < 3)
	           echo ANSI_12 "**Cannot T-warp. No ore!*"
	           goto :wait_for_command
	     end
	     getInput $sector "T-Warp to: "
	     isNumber $numtest $sector
	     if ($numtest < 1)
	           echo ANSI_12 "**Invalid sector number!*"
	           goto :wait_for_command
	     end
	     if ($sector < 1) OR ($sector > SECTORS)
	           echo ANSI_12 "**Invalid sector number!*"
	           goto :wait_for_command
	     end
	     setVar $msg ""
             gosub :killthetriggers
	     setTextLineTrigger det_trg1 :det_blnd "Do you want to make this jump blind?"
	     setTextLineTrigger det_trg2 :det_fuel "You do not have enough Fuel Ore to make the jump."
	     setTextLineTrigger det_trg3 :det_good "Locating beam pinpointed, TransWarp Locked."
	     setTextLineTrigger det_trg4 :det_dock "Landing on Federation StarDock."
	     send "qqq  z  n  m  " & $sector & "  *  yn  *  *  p  s  s "
	     pause
	     goto :print_the_menu
	     :det_blnd
		     setVar $msg ANSI_12 & "**No fighter lock exists. Blind warp hazard!!*"
		     pause
	     :det_fuel
		     setVar $msg ANSI_12 & "**Not enough ore for that jump!*"
		     pause
	     :det_good
		     setVar $msg ANSI_10 & "**Fighter lock found. Looks good!*"
		     pause
	     :det_dock
		     waitOn "<Shipyards> Your option (?)"
	             gosub :killthetriggers
		     echo $msg
		     goto :wait_for_command
	elseif ($chosen_option = "7")
	     if ($TWARP = "No")
	           echo ANSI_12 "**Cannot T-warp. No Twarp drive!*"
	           goto :wait_for_command
	     elseif ($ORE_HOLDS < 3)
	           echo ANSI_12 "**Cannot T-warp. No ore!*"
	           goto :wait_for_command
	     end
	     getInput $sector "T-Warp to: "
	     isNumber $numtest $sector
	     if ($numtest < 1)
	           echo ANSI_12 "**Invalid sector number!*"
	           goto :wait_for_command
	     end
	     if ($sector < 1) OR ($sector > SECTORS)
	           echo ANSI_12 "**Invalid sector number!*"
	           goto :wait_for_command
	     end
	     send "qqq  z  n  m  " & $sector & "  *  y  y  *  *"
	     goto :wait_for_command
	elseif ($chosen_option = "8")
	     if ($TWARP = "No")
	           echo ANSI_12 "*Cannot T-warp. No Twarp drive!*"
	           goto :wait_for_command
	     elseif ($ORE_HOLDS < 3)
	           echo ANSI_12 "*Cannot T-warp. No ore!*"
	           goto :wait_for_command
	     end
	     getInput $shipnum "Ship number to tow: "
	     isNumber $numtest $shipnum
	     if ($numtest < 1)
	           echo ANSI_12 "*Invalid ship number!*"
	           goto :wait_for_command
	     end
	     if ($shipnum < 1) OR ($shipnum > 65000)
	           echo ANSI_12 "*Invalid ship number!*"
	           goto :wait_for_command
	     end
	     getInput $sector "T-Warp to: "
	     isNumber $numtest $sector
	     if ($numtest < 1)
	           echo ANSI_12 "*Invalid sector number!*"
	           goto :wait_for_command
	     end
	     if ($sector < 1) OR ($sector > SECTORS)
	           echo ANSI_12 "*Invalid sector number!*"
	           goto :wait_for_command
	     end
	     send "qqq  z  n  w  n  *  w  n" & $shipnum & "*  *  m  " & $sector & "  *  y  y  *  *"
	     goto :wait_for_command
	elseif ($chosen_option = "9")
	     getInput $shipnum "Ship number to xport to: "
	     isNumber $numtest $shipnum
	     if ($numtest < 1)
	           echo ANSI_12 "*Invalid ship number!*"
     		   goto :wait_for_command
	     end
	     if ($shipnum < 1) OR ($shipnum > 65000)
	           echo ANSI_12 "*Invalid ship number!*"
	           goto :wait_for_command
	     end
	     setVar $msg ""
             gosub :killthetriggers
	     setTextLineTrigger det_trg1 :xport_notavail "That is not an available ship."
	     setTextLineTrigger det_trg2 :xport_badrange "only has a transport range of"
	     setTextLineTrigger det_trg3 :xport_security "SECURITY BREACH! Invalid Password, unable to link transporters."
	     setTextLineTrigger det_trg4 :xport_noaccess "Access denied!"
	     setTextLineTrigger det_trg5 :xport_xprtgood "Security code accepted, engaging transporter control."
	     setTextLineTrigger det_trg6 :xport_go_ahead "Landing on Federation StarDock."
	     send "qqq  z  n  x    " & $shipnum & "    *    *    *    p  s  s "
	     pause
	     goto :print_the_menu
	     :xport_notavail
		     setVar $msg ANSI_12 & "**That ship is not available.*"
		     pause
	     :xport_badrange
		     setVar $msg ANSI_12 & "**That ship is too far away.*"
		     pause
	     :xport_security
		     setVar $msg ANSI_12 & "**That ship is passworded.*"
		     pause
	     :xport_noaccess
		     setVar $msg ANSI_12 & "**Cannot access that ship.*"
		     pause
	     :xport_xprtgood
		     setVar $msg ANSI_10 & "**Xport good!*"
		     pause
	     :xport_go_ahead
		     gosub :quikstats
		     waitOn "<Shipyards> Your option (?)"
	             gosub :killthetriggers
		     echo $msg
		     goto :wait_for_command
	elseif ($chosen_option = "A")
	     getInput $sector "To sector: "
	     isNumber $numtest $sector
	     if ($numtest < 1)
	           echo ANSI_12 "**Invalid sector number!*"
	           goto :wait_for_command
	     end
	     if ($sector < 1) OR ($sector > SECTORS)
	           echo ANSI_12 "**Invalid sector number!*"
	           goto :wait_for_command
	     end
	     setVar $msg ""
             gosub :killthetriggers
	     setTextLineTrigger det_trg1 :dis_nadj "That is not an adjacent sector"
	     setTextLineTrigger det_trg2 :dis_ndis "You do not have any Mine Disruptors!"
	     setTextLineTrigger det_trg3 :dis_done "Disruptor launched into sector"
	     setTextLineTrigger det_trg4 :dis_okay "Landing on Federation StarDock."
	     send "qqq  z  n  c  w  y  " & $sector & "  *  q  q  q  z  n  p  s  h "
	     pause
	     :dis_nadj
		     setVar $msg ANSI_10 & "**That sector isn't adjacent to StarDock.*"
		     pause
	     :dis_ndis
		     setVar $msg ANSI_10 & "**Out of disruptors.*"
		     pause
	     :dis_done
		     setVar $msg ANSI_10 & "**Disruptor launched!*"
		     pause
	     :dis_okay
		     gosub :quikstats
		     waitOn "<Hardware Emporium> So what are you looking for (?)"
	             gosub :killthetriggers
		     echo $msg
		     goto :wait_for_command
	elseif ($chosen_option = "B")
	     getInput $sector "To sector: "
	     isNumber $numtest $sector
	     if ($numtest < 1)
	           echo ANSI_12 "**Invalid sector number!*"
	           goto :wait_for_command
	     end
	     if ($sector < 1) OR ($sector > SECTORS)
	           echo ANSI_12 "**Invalid sector number!*"
	           goto :wait_for_command
	     end
	     send "qqq  z  n  c  v  " & $sector & "*  q  p  s  s "
	     waitOn "Landing on Federation StarDock."
	     waitOn "<Shipyards> Your option (?)"
	elseif ($chosen_option = "C")
	     getInput $sector "To sector: "
	     isNumber $numtest $sector
		if ($numtest < 1)
		     echo ANSI_12 "**Invalid sector number!*"
		     goto :wait_for_command
	     	end
	     	if ($sector < 1) OR ($sector > SECTORS)
	            echo ANSI_12 "**Invalid sector number!*"
	            goto :wait_for_command
	    	 end
		send "qqq  z  n  c  v  0  *  y  n  " & $sector & "*  q  p  s  s "
		waitOn "Landing on Federation StarDock."
		waitOn "<Shipyards> Your option (?)"
		goto :print_the_menu
	elseif ($chosen_option = "D")
	     getInput $sector "To sector: "
	     isNumber $numtest $sector
	     if ($numtest < 1)
	           echo ANSI_12 "**Invalid sector number!*"
	           goto :wait_for_command
	     end
	     if ($sector < 1) OR ($sector > SECTORS)
	           echo ANSI_12 "**Invalid sector number!*"
	           goto :wait_for_command
	     end
	     send "^f*" & $sector & "*q"
	     waitOn "ENDINTERROG"
	elseif ($chosen_option = "E")
	     if ($GENESIS > 0)
	           send "qqq  z  n  u  y  *  .*  z  c  *  p  s  h "
	           waitOn "Landing on Federation StarDock."
	           gosub :quikstats
	           waitOn "<Hardware Emporium> So what are you looking for (?)"
	     else
	           echo ANSI_12 "**You don't have any Genesis Torps!*"
	           goto :wait_for_command
	     end
	elseif ($chosen_option = "F")
	     if ($ORE_HOLDS < 1)
	           echo ANSI_12 "**You have no ore to drop!*"
	           goto :wait_for_command
	     end
	     getInput $pnum "Planet number: "
	     isNumber $numtest $pnum
	     if ($numtest < 1)
	           echo ANSI_12 "**Invalid planet number!*"
	           goto :wait_for_command
	     end
	     if ($pnum < 1) OR ($pnum > 33000)
	           echo ANSI_12 "**Invalid planet number!*"
	           goto :wait_for_command
	     end
	     setVar $msg ""
             gosub :killthetriggers
	     setTextLineTrigger det_trg1 :pland_trg_1 "Engage the Autopilot?"
	     setTextLineTrigger det_trg2 :pland_trg_2 "That planet is not in this sector."
	     setTextLineTrigger det_trg3 :pland_trg_3 "<Take all>"
	     setTextLineTrigger det_trg4 :pland_trg_4 "<Take/Leave Products>"
	     setTextLineTrigger det_trg5 :pland_trg_5 "Landing on Federation StarDock."
	     send "qqq  z  n  l " & $pnum & "  *  *  z  n  z  n  *  z  q  t  n  z  l  1  *  q  q  z  n  p  s  h "
	     pause
	elseif ($chosen_option = "G")
	     getInput $pnum "Planet number: "
	     isNumber $numtest $pnum
	     if ($numtest < 1)
	           echo ANSI_12 "**Invalid planet number!*"
	           goto :wait_for_command
	     end
	     if ($pnum < 1) OR ($pnum > 33000)
	           echo ANSI_12 "**Invalid planet number!*"
	           goto :wait_for_command
	     end
	     setVar $msg ""
             gosub :killthetriggers
	     setTextLineTrigger det_trg1 :pland_trg_1 "Engage the Autopilot?"
	     setTextLineTrigger det_trg2 :pland_trg_2 "That planet is not in this sector."
	     setTextLineTrigger det_trg3 :pland_trg_3 "<Take all>"
	     setTextLineTrigger det_trg4 :pland_trg_4 "<Take/Leave Products>"
	     setTextLineTrigger det_trg5 :pland_trg_5 "Landing on Federation StarDock."
	     send "qqq  z  n  l " & $pnum & "  *  *  z  n  z  n  *  z  q  a  *  q  q  z  n  p  s  h "
	     pause
	elseif ($chosen_option = "H")
	     if ($ATOMIC < 1)
	           echo ANSI_12 "**You don't have any Atomic Dets!*"
	           goto :wait_for_command
	     end
	     getInput $pnum "Planet number: "
	     isNumber $numtest $pnum
	     if ($numtest < 1)
	           echo ANSI_12 "**Invalid planet number!*"
	           goto :wait_for_command
	     end
	     if ($pnum < 1) OR ($pnum > 33000)
	           echo ANSI_12 "**Invalid planet number!*"
	           goto :wait_for_command
	     end
	     setVar $msg ""
             gosub :killthetriggers
	     setTextLineTrigger det_trg1 :pland_trg_1 "Engage the Autopilot?"
	     setTextLineTrigger det_trg2 :pland_trg_2 "That planet is not in this sector."
	     setTextLineTrigger det_trg3 :pland_trg_3 "<Take all>"
	     setTextLineTrigger det_trg4 :pland_trg_4 "<Take/Leave Products>"
	     setTextLineTrigger det_trg5 :pland_trg_5 "Landing on Federation StarDock."
	     setTextLineTrigger det_trg6 :pland_trg_6 "<DANGER> Are you sure you want to do this?"
	     send "qqq  z  n  l " & $pnum & "  *  *  z  n  z  n  *  z  d  y  p  s  h "
	     pause
	elseif ($chosen_option = "Z")
	     if ($CLOAKS > 0)
	          echo ANSI_11 "*Are you sure you want to cloak out? (y/N)*"
	          getConsoleInput $choice singlekey
	          upperCase $choice
	          if ($choice = "Y")
	               goto :cloak_on_out
	      	  else
	               echo ANSI_12 & "**Aborting cloak-out.*"
	               goto :wait_for_command
	          end
	          :cloak_on_out
	          send "qqq  y  y"
	          goto :wait_for_command
	     else
	          echo ANSI_12 & "**You have no cloaking devices!*"
	     end
	elseif ($chosen_option = "L")
	     send "qqq  z  n  t  aq  p  s  s "
	     waitOn "Landing on Federation StarDock."
	     waitOn "<Shipyards> Your option (?)"
	elseif ($chosen_option = "T")
	     send "qqq  z  n  c  n  9q  q  p  s  s "
	     waitOn "Landing on Federation StarDock."
	     waitOn "<Shipyards> Your option (?)"
	elseif ($chosen_option = "W")
	     send "qqq  z  n  c  u  y  q  p  s  s "
	     waitOn "Landing on Federation StarDock."
	     waitOn "<Shipyards> Your option (?)"
	elseif ($chosen_option = "O")
	     goto :swap_ore
	end
	goto :wait_for_command
# -------------------------------------------------------------------
:swap_ore
	echo "**"
	echo ANSI_11 "This automates the process of trading ore between ships.**"
	echo ANSI_15 "It pops a planet, drops ore and re-docks.*"
	echo ANSI_15 "After a brief pause it then lifts, xports, grabs the ore and re-docks.*"
	echo ANSI_15 "The result... you're in your new ship, safe at dock w/ ore.*"
	echo ANSI_15 "It tries to be as safe as possible but there's always some risk.*"
	echo "*"
	echo ANSI_14 "Are you sure you want to start the Ore Swapper X-port? (y/N)*"
	getConsoleInput $choice singlekey
	upperCase $choice
	if ($choice = "Y")
		goto :init_ore_swap_vars
	else
		echo ANSI_12 & "**Aborting Ore Swapper X-port.*"
		goto :wait_for_command
	end
:init_ore_swap_vars
	setVar $funky_counter 0
	getInput $shipnum "Ship number to transfer fuel to: "
	isNumber $numtest $shipnum
	if ($numtest < 1)
		echo ANSI_12 "*Invalid ship number!*"
		goto :wait_for_command
	end
	if ($shipnum < 1) OR ($shipnum > 65000)
		echo ANSI_12 "*Invalid ship number!*"
		goto :wait_for_command
	end
:top_of_ore_swap
	gosub :quikstats
	add $funky_counter 1
	if ($GENESIS < 1)
		echo ANSI_12 "**Out of Genesis Torps. You're going to need one for this.*"
		goto :wait_for_command
	end
	if ($ORE_HOLDS < 3)
		echo ANSI_12 "**There's no ore on your ship! You can't drop ore if you don't have any.*"
		goto :wait_for_command
	end
	send "qqq  z  n  u  y  *  .*  z  c  *  p  s  h "
	waitOn "Landing on Federation StarDock."
	getRnd $rand_wait 100 300
	killtrigger safety_delay
	setDelayTrigger safety_delay :lift_stuff $rand_wait
	pause
:lift_stuff
	send "qqq  z  n  l*  *  z  q  t  n  z  l  1  *  q  q  z  n  p  s  h "
        gosub :killthetriggers
	setTextLineTrigger result_trg1 :res_torps "You don't have any Genesis Torpedoes to launch!"
	setTextLineTrigger result_trg2 :res_nopln "There isn't a planet in this sector."
	setTextLineTrigger result_trg3 :res_mltpl "Registry# and Planet Name"
	setTextLineTrigger result_trg4 :res_landd "Landing sequence engaged..."
	setTextLineTrigger result_trg5 :res_backd "Landing on Federation StarDock."
	pause
:res_torps
	echo ANSI_12 "**You somehow ran out of Genesis Torps before launching. This should not have happened! Check your status!*"
	send "? "
	goto :wait_for_command
:res_nopln
	echo ANSI_12 "**The planet is gone! Someone might be messing with us.*"
	if ($funky_counter < 4)
		goto :top_of_ore_swap
	else
		echo ANSI_12 "**I've tried this 3 times, something is definately going on. Check your status!*"
		send "? "
		goto :wait_for_command
	end
:res_landd
	waitOn "Planet #"
	getWord CURRENTLINE $pnum 2
	stripText $pnum "#"
	waitOn "(?="
	echo ANSI_10 "**We've landed and dropped our ore on planet #" & $pnum & "!*"
	pause
:res_mltpl
	waitOn "--------------------"
        gosub :killthetriggers
	setVar $p_array_idx 0
	setArray $p_array 255
        gosub :killthetriggers
	setTextLineTrigger plist_trig :plist_line ">"
	setTextLineTrigger plist_end  :plist_end  "Land on which planet"
	pause
	goto :wait_for_command
	:plist_line
		add $p_array_idx 1
		setVar $line CURRENTLINE
		stripText $line "<"
		stripText $line ">"
		getWord $line $a_number 1
		setVar $p_array[$p_array_idx] $a_number
		killtrigger plist_trig
		setTextLineTrigger plist_trig :plist_line "<"
		pause
		goto :wait_for_command
	:plist_end
	        gosub :killthetriggers
		if ($p_array_idx < 1)
			echo ANSI_12 "**The planet is gone! Someone might be messing with us.*"
			if ($funky_counter < 4)
				goto :top_of_ore_swap
			else
        			echo ANSI_12 "**I've tried this 3 times, something is definately going on. Check your status!*"
         			send "? "
				goto :wait_for_command
			end
		end
	waitOn "Landing on Federation StarDock."
	waitOn "<Hardware Emporium> So what are you looking for (?)"
	getRnd $rand_wait 100 300
	killtrigger safety_delay
	setDelayTrigger safety_delay :more_lift_stuff $rand_wait
	pause
	:more_lift_stuff
		getRnd $rnd_idx 1 $p_array_idx
		setVar $pnum $p_array[$rnd_idx]
	        gosub :killthetriggers
		setTextLineTrigger result_trg1 :res_baddd "Engage the Autopilot?"
		setTextLineTrigger result_trg2 :res_baddd "That planet is not in this sector."
		setTextLineTrigger result_trg3 :res_land2 "<Take/Leave Products>"
		setTextLineTrigger result_trg4 :res_backd "Landing on Federation StarDock."
		send "qqq  z  n  l " & $pnum & "  *  *  z  n  z  n  *  z  q  t  n  z  l  1  *  q  q  z  n  p  s  h "
		pause
:res_baddd
        gosub :killthetriggers
	echo ANSI_12 "**Our planet is gone! Someone might be messing with us.*"
	if ($funky_counter < 4)
        	goto :top_of_ore_swap
	else
		echo ANSI_12 "**I've tried this 3 times, something is definately going on. Check your status!*"
		send "? "
	end
	goto :wait_for_command
:res_land2
	echo ANSI_10 "**We've landed and dropped our ore on planet #" & $pnum & "!*"
	pause
:res_backd
        gosub :killthetriggers
	gosub :quikstats
	waitOn "<Hardware Emporium> So what are you looking for (?)"
	getRnd $rand_wait 100 300
	killtrigger safety_delay 
	setDelayTrigger safety_delay :yet_more_lift_stuff $rand_wait
	pause
	:yet_more_lift_stuff
		setVar $msg ""
		setTextLineTrigger result_trg1 :swap_xport_notavail "That is not an available ship."
		setTextLineTrigger result_trg2 :swap_xport_badrange "only has a transport range of"
		setTextLineTrigger result_trg3 :swap_xport_security "SECURITY BREACH! Invalid Password, unable to link transporters."
		setTextLineTrigger result_trg4 :swap_xport_noaccess "Access denied!"
		setTextLineTrigger result_trg5 :swap_xport_xprtgood "Security code accepted, engaging transporter control."
		setTextLineTrigger result_trg6 :swap_pland_noplnet1 "Engage the Autopilot?"
		setTextLineTrigger result_trg7 :swap_pland_noplnet2 "That planet is not in this sector."
		setTextLineTrigger result_trg8 :swap_pland_noplnet3 "Invalid registry number, landing aborted."
		setTextLineTrigger result_trg9 :swap_pland_prodtakn "<Take all>"
		setTextLineTrigger result_trg0 :swap_pland_complete "Landing on Federation StarDock."
		send "qqq  z  n  "
		send "x    " & $shipnum & "    *    *    *   "
		send "l " & $pnum & "  *  *  z  n  z  n  *  z  q  a  *  q  q  z  n  "
		send "p  s  h "
		pause
	:swap_xport_notavail
		setVar $msg $msg & ANSI_12 & "*That ship is not available, using the original ship...*"
		pause
	:swap_xport_badrange
		setVar $msg $msg & ANSI_12 & "*That ship is too far away, using the original ship...*"
		pause
	:swap_xport_security
		setVar $msg $msg & ANSI_12 & "*That ship is passworded, using the original ship...*"
		pause
	:swap_xport_noaccess
		setVar $msg $msg & ANSI_12 & "*Cannot access that ship, using the original ship...*"
		pause
	:swap_xport_xprtgood
		setVar $msg $msg & ANSI_10 & "*Xport good!*"
		pause
	:swap_pland_noplnet1
		setVar $msg $msg & ANSI_12 & "*The planet has gone missing. Check your status!*"
		pause
	:swap_pland_noplnet2
		setVar $msg $msg & ANSI_12 & "*The planet has gone missing. Check your status!*"
		pause
	:swap_pland_noplnet3
		setVar $msg $msg & ANSI_12 & "*The planet has gone missing. Check your status!*"
		pause
	:swap_pland_prodtakn
		setVar $msg $msg & ANSI_10 & "*Products collected!*"
		pause
	:swap_pland_complete
	        gosub :killthetriggers
		gosub :quikstats
		waitOn "<Hardware Emporium> So what are you looking for (?)"
		echo $msg
		goto :wait_for_command
	pause
	goto :wait_for_command
# -------------------------------------------------------------------
:pland_trg_1
	setVar $msg ANSI_12 & "**There are no planets in the StarDock sector!*"
	pause
:pland_trg_2
	setVar $msg ANSI_12 & "**That planet is not in the StarDock sector!*"
	pause
:pland_trg_3
	setVar $msg ANSI_10 & "**Products taken!*"
	pause
:pland_trg_4
	setVar $msg ANSI_10 & "**Fuel dropped!*"
	pause
:pland_trg_6
	setVar $msg ANSI_10 & "**Planet destroyed!*"
	pause
:pland_trg_5
	gosub :quikstats
	waitOn "<Hardware Emporium> So what are you looking for (?)"
        gosub :killthetriggers
	echo $msg
	goto :wait_for_command
:doneDockKit
        echo #27 "[30D                        " #27 "[30D"
        goto :wait_for_command
#==================================END DOCK KIT (STARDOCK MACROS) =========================================
# ============================ START TERRA KIT (TERRA MACROS) SUBROUTINE ===================================
:terraKit
	killalltriggers
	gosub :current_prompt
	setVar $validPrompts "Do How"
	gosub :checkStartingPrompt
	:print_the__terra_menu
		gosub :quikstats
		echo "[2J"
	:terra_menu_without_clear
		echo "*"
		echo ANSI_15 "               -=( " ANSI_12 "M()M Terra Survival Toolkit" ANSI_15 " )=-  "&ANSI_7&"*"
		echo ANSI_5  " -----------------------------------------------------------------------------"&ANSI_7&"*"
		echo ANSI_9&#27&"[35m<"&#27&"[32m1"&#27&"[35m> " & ANSI_14 & " display Terra sector" & ANSI_9 & ", land       " #27&"[35m<"&#27&"[32m5"&#27&"[35m> " & ANSI_14 & " check twarp lock" & ANSI_9 & ", land*"
		echo #27&"[35m<"&#27&"[32m2"&#27&"[35m> " & ANSI_14 & " holoscan" & ANSI_9 & ", land                   " #27&"[35m<"&#27&"[32m6"&#27&"[35m> " & ANSI_14 & " lift, twarp out*"
		echo #27&"[35m<"&#27&"[32m3"&#27&"[35m> " & ANSI_14 & " density scan" & ANSI_9 & ", land               " #27&"[35m<"&#27&"[32m7"&#27&"[35m> " & ANSI_14 & " lift, lock tow" & ANSI_9 & ", twarp out*"
		echo #27&"[35m<"&#27&"[32m4"&#27&"[35m> " & ANSI_14 & " get xport list" & ANSI_9 & ", land             " #27&"[35m<"&#27&"[32m8"&#27&"[35m> " & ANSI_14 & " xport" & ANSI_9 & ", land*"
		echo         "*"
		echo #27&"[35m<"&#27&"[32mA"&#27&"[35m> " & ANSI_14 & " set avoid" & ANSI_9 & ",land                   " #27&"[35m<"&#27&"[32mE"&#27&"[35m> " & ANSI_14 & " lift, cloak out*"
		echo #27&"[35m<"&#27&"[32mB"&#27&"[35m> " & ANSI_14 & " clear avoided sector" & ANSI_9 & ", land       " #27&"[35m<"&#27&"[32mF"&#27&"[35m> " & ANSI_14 & " C U Y (enable t-warp)" & ANSI_9 & " ,land*"
		echo #27&"[35m<"&#27&"[32mC"&#27&"[35m> " & ANSI_14 & " plot course" & ANSI_9 & ", land                " #27&"[35m<"&#27&"[32mG"&#27&"[35m> " & ANSI_14 & " toggle cn9" & ANSI_9 & ", land*"
		echo #27&"[35m<"&#27&"[32mD"&#27&"[35m> " & ANSI_14 & " get corpie locations" & ANSI_9 & ", land       *"
		echo ANSI_5  " -----------------------------------------------------------------------------**"
		echo ANSI_10 "Your choice?*"
			getConsoleInput $chosen_option SINGLEKEY
			upperCase $chosen_option
			killalltriggers
	:process_command
		if ($chosen_option = "1")
		     send "* * dl 1*  "
		     gosub :quikstats
		elseif ($chosen_option = "2")
		     send "* * shl 1*   "
		     gosub :quikstats
		elseif ($chosen_option = "3")
			send "* * sdl 1*  "
			gosub :quikstats
		elseif ($chosen_option = "4")
			send "* *  x**    l 1*  "
			gosub :quikstats
		elseif ($chosen_option = "5")
		     if ($TWARP = "No")
		           echo ANSI_12 "**Cannot T-warp. No Twarp drive!*"
		           goto :wait_for_command
		     elseif ($ORE_HOLDS < 3)
		           echo ANSI_12 "**Cannot T-warp. No ore!*"
		           goto :wait_for_command
		     end
		     getInput $sector "T-Warp to: "
		     isNumber $numtest $sector
		     if ($numtest < 1)
		           echo ANSI_12 "**Invalid sector number!*"
		           goto :wait_for_command
		     end
		     if ($sector < 1) OR ($sector > SECTORS)
		           echo ANSI_12 "**Invalid sector number!*"
		           goto :wait_for_command
		     end
		     setVar $msg ""
		     gosub :killthetriggers
		     setTextLineTrigger tdet_trg1 :tdet_blnd "Do you want to make this jump blind?"
		     setTextLineTrigger tdet_trg2 :tdet_fuel "You do not have enough Fuel Ore to make the jump."
		     setTextLineTrigger tdet_trg3 :tdet_good "Locating beam pinpointed, TransWarp Locked."
		     setTextTrigger tdet_trg4 :tdet_dock "Do you wish to (L)eave or (T)ake Colonists?"
		     send "* *   m  " & $sector & "  *  y*  *  *  l 1*   "
		     pause
		     goto :print_the_menu
		     :tdet_blnd
			     setVar $msg ANSI_12 & "**No fighter lock exists. Blind warp hazard!!*"
			     pause
		     :tdet_fuel
			     setVar $msg ANSI_12 & "**Not enough ore for that jump!*"
			     pause
		     :tdet_good
			     setVar $msg ANSI_10 & "**Fighter lock found. Looks good!*"
			     pause
		     :tdet_dock
			     gosub :quikstats
			     gosub :killthetriggers
			     echo $msg
			     goto :wait_for_command
		elseif ($chosen_option = "6")
		     if ($TWARP = "No")
		           echo ANSI_12 "**Cannot T-warp. No Twarp drive!*"
		           goto :wait_for_command
		     elseif ($ORE_HOLDS < 3)
		           echo ANSI_12 "**Cannot T-warp. No ore!*"
		           goto :wait_for_command
		     end
		     getInput $sector "T-Warp to: "
		     isNumber $numtest $sector
		     if ($numtest < 1)
		           echo ANSI_12 "**Invalid sector number!*"
		           goto :wait_for_command
		     end
		     if ($sector < 1) OR ($sector > SECTORS)
		           echo ANSI_12 "**Invalid sector number!*"
		           goto :wait_for_command
		     end
		     send "* *  m  " & $sector & "  *  y  y  *  *"
		     gosub :quikstats
		     if ($CURRENT_SECTOR = 1)
			send "l 1*  "
		     end
		     goto :wait_for_command
		elseif ($chosen_option = "7")
		     if ($TWARP = "No")
		           echo ANSI_12 "*Cannot T-warp. No Twarp drive!*"
		           goto :wait_for_command
		     elseif ($ORE_HOLDS < 3)
		           echo ANSI_12 "*Cannot T-warp. No ore!*"
        		   goto :wait_for_command
		     end
		     getInput $shipnum "Ship number to tow: "
		     isNumber $numtest $shipnum
		     if ($numtest < 1)
		           echo ANSI_12 "*Invalid ship number!*"
        		   goto :wait_for_command
		     end
		     if ($shipnum < 1) OR ($shipnum > 65000)
		           echo ANSI_12 "*Invalid ship number!*"
		           goto :wait_for_command
		     end
		     getInput $sector "T-Warp to: "
		     isNumber $numtest $sector
		     if ($numtest < 1)
		           echo ANSI_12 "*Invalid sector number!*"
        		   goto :wait_for_command
		     end
		     if ($sector < 1) OR ($sector > SECTORS)
		           echo ANSI_12 "*Invalid sector number!*"
		           goto :wait_for_command
		     end
		     send "* * w  *  *  w  *" & $shipnum & "*  *  m  " & $sector & "  *  y  y  *  *"
		     gosub :quikstats
		     if ($CURRENT_SECTOR = 1)
			send "l 1*  "
		     end
		     goto :wait_for_command
		elseif ($chosen_option = "8")
		     getInput $shipnum "Ship number to xport to: "
		     isNumber $numtest $shipnum
		     if ($numtest < 1)		
		           echo ANSI_12 "*Invalid ship number!*"
        		   goto :wait_for_command
		     end
		     if ($shipnum < 1) OR ($shipnum > 65000)
		           echo ANSI_12 "*Invalid ship number!*"
		           goto :wait_for_command
		     end
		     setVar $msg ""
		     gosub :killthetriggers
		     setTextLineTrigger tdet_trg1 :txport_notavail "That is not an available ship."
		     setTextLineTrigger tdet_trg2 :txport_badrange "only has a transport range of"
		     setTextLineTrigger tdet_trg3 :txport_security "SECURITY BREACH! Invalid Password, unable to link transporters."
		     setTextLineTrigger tdet_trg4 :txport_noaccess "Access denied!"
		     setTextLineTrigger tdet_trg5 :txport_xprtgood "Security code accepted, engaging transporter control."
		     setTextTrigger tdet_trg6 :txport_go_ahead "Do you wish to (L)eave or (T)ake Colonists?"
                     setTextTrigger tdet_trg7 :txport_go_ahead "That planet is not in this sector."
                     setTextTrigger tdet_trg8 :txport_go_ahead "Are you sure you want to jettison all cargo? (Y/N)"
		     send "* *  x    z" & $shipnum & "*  *    l j"&#8&" 1*  "
		     pause
		     goto :print_the_menu
		     :txport_notavail
			     setVar $msg ANSI_12 & "**That ship is not available.*"
			     pause
		     :txport_badrange
			     setVar $msg ANSI_12 & "**That ship is too far away.*"
			     pause
		     :txport_security
			     setVar $msg ANSI_12 & "**That ship is passworded.*"
			     pause
		     :txport_noaccess
			     setVar $msg ANSI_12 & "**Cannot access that ship.*"
			     pause
		     :txport_xprtgood
			     setVar $msg ANSI_10 & "**Xport good!*"
			     pause
		     :txport_go_ahead
			     gosub :killthetriggers
			     echo $msg
			     goto :wait_for_command
		elseif ($chosen_option = "A")
		     getInput $sector "To sector: "
		     isNumber $numtest $sector
		     if ($numtest < 1)
		           echo ANSI_12 "**Invalid sector number!*"
		           goto :wait_for_command
		     end
		     if ($sector < 1) OR ($sector > SECTORS)
		           echo ANSI_12 "**Invalid sector number!*"
		           goto :wait_for_command
		     end		
		     send "* *  c  v  " & $sector & "*  q  l 1*  "
		     gosub :quikstats
		elseif ($chosen_option = "B")
		     getInput $sector "To sector: "
		     isNumber $numtest $sector
		     if ($numtest < 1)
		           echo ANSI_12 "**Invalid sector number!*"
		           goto :wait_for_command
		     end
		     if ($sector < 1) OR ($sector > SECTORS)
		           echo ANSI_12 "**Invalid sector number!*"
		           goto :wait_for_command
		     end
		     send "* *  c  v  0  *  y  n  " & $sector & "*  q  l 1*  "
		     gosub :quikstats
		elseif ($chosen_option = "C")
		     getInput $sector "To sector: "
		     isNumber $numtest $sector
		     if ($numtest < 1)
		           echo ANSI_12 "**Invalid sector number!*"
		           goto :wait_for_command
		     end
		     if ($sector < 1) OR ($sector > SECTORS)
        		   echo ANSI_12 "**Invalid sector number!*"
		           goto :wait_for_command
		     end
		     send "^f*" & $sector & "*q"
		     waitOn "ENDINTERROG"
		elseif ($chosen_option = "E")
		     if ($CLOAKS > 0)
		          echo ANSI_11 "*Are you sure you want to cloak out? (y/N)*"
		          getConsoleInput $choice singlekey
		          upperCase $choice
		          if ($choice = "Y")
		               send "* * q  y  y"
		          else
		               echo ANSI_12 & "**Aborting cloak-out.*"
		               goto :wait_for_command
		          end
		          goto :wait_for_command
		     else
		          echo ANSI_12 & "**You have no cloaking devices!*"
		     end
		elseif ($chosen_option = "D")
		     send "* *  t  aq  l 1*  "
		     gosub :quikstats
		elseif ($chosen_option = "G")
		     send "* *  c  n  9q  q  l 1*  "
		     gosub :quikstats
		elseif ($chosen_option = "F")
		     send "* * c  u  y  q  l 1*  "
		     gosub :quikstats
		else
		     goto :wait_for_command
		end
goto :wait_for_command
:doneTerraKit
        echo #27 "[30D                           " #27 "[30D"
        goto :wait_for_command
#============================= END TERRA KIT (TAB-T) SUBROUTINE =================================
# ======================     START PREFERENCES MENU SUBROUTINE    ==========================
:preferencesMenu
	setVar $botIsDeaf TRUE
	saveVar $botIsDeaf
	openMenu TWX_TOGGLEDEAF false
	closeMenu
:refreshPreferencesMenu
	killalltriggers
	setArray $space 27
	setArray $h 27
	setArray $qss 27
	setVar $h[1]  "Game Stats?      "
	setVar $h[2]  "Ship Stats?      "
	setVar $h[3]  "Bot Name         "
	setVar $h[4]  "Login Password   "
	setVar $h[5]  "Bot Password     "
	setVar $h[6]  "Figs to drop:    "
	setVar $h[7]  "Limps to drop:   "
	setVar $h[8]  "Armids to drop:  "
	setVar $h[9]  "Avoid Planets?   "
	setVar $h[10] "Capture after?   "
	setVar $h[11] "Max Attack:      "
	setVar $h[12] "Offensive Odds:  "
	setVar $h[13] "Stardock     (S) "
	setVar $h[14] "Rylos        (R) "
	setVar $h[15] "Alpha        (A) "
	setVar $h[16] "Home Sector  (H) "
	setVar $h[17] "Max Fighters:    "
	setVar $h[18] "Login Name:      "
	setVar $h[19] "Surround type?   "
	setVar $h[20] "Turn Limit:      "
	setVar $h[21] "Game Letter:     "
	setVar $h[22] "Safe Ship:   (X) "
	setVar $h[23] "Banner Interval: "
	setVar $h[24] "Alien Ships:     "
	setVar $h[25] "Backdoor     (B) "
	setVar $h[26] "Fig Type:        "
	setVar $h[27] "                 "
	if ($gameStats)
		setVar $qss[1] "Initialized"
	else
		setVar $qss[1] "No Info"
	end
	if ($shipStats)
		setVar $qss[2] "Initialized"
	else
		setVar $qss[2] "No Info"
	end
	setVar $qss[3] $bot_name
	setVar $qss[4] $password
	setVar $qss[5] $bot_password
	setVar $qss[6] $surroundFigs
	setVar $qss[7] $surroundLimp
	setVar $qss[8] $surroundMine
	if ($surroundAvoidShieldedOnly)
		setVar $qss[9] "Shielded"
	elseif ($surroundAvoidAllPlanets)
		setVar $qss[9] "All"
	else
		setVar $qss[9] "None"
	end
	if ($surroundAutoCapture)
		setVar $qss[10] "Yes"
	else
		setVar $qss[10] "No"
	end
	setVar $qss[11] $SHIP_MAX_ATTACK
	setVar $qss[12] $SHIP_OFFENSIVE_ODDS
	if ($stardock > 0)
		setVar $qss[13] $stardock
	else
		setVar $qss[13] "Not Defined"
	end
	if ($backdoor > 0)
		setVar $qss[25] $backdoor
	else
		setVar $qss[25] "Not Defined"
	end
	if ($rylos > 0)
		setVar $qss[14] $rylos
	else
		setVar $qss[14] "Not Defined"
	end
	if ($alpha_centauri > 0)
		setVar $qss[15] $alpha_centauri
	else
		setVar $qss[15] "Not Defined"
	end
	if ($home_sector > 0)
		setVar $qss[16] $home_sector
	else
		setVar $qss[16] "Not Defined"
	end
	setVar $qss[17] $SHIP_FIGHTERS_MAX
	setVar $qss[18] $username
	if ($surroundOverwrite)
		setVar $qss[19] "All Sectors"
	elseif ($surroundPassive)
		setVar $qss[19] "Passive"
	else
		setVar $qss[19] "Normal"
        end
	if ($unlimitedGame)
		setVar $qss[20] "Unlimited"
	else
		setVar $qss[20] $BOT_TURN_LIMIT
	end
	setVar $qss[21] $letter
	if ($safe_ship > 0)
		setVar $qss[22] $safe_ship
	else
		setVar $qss[22] "Not Defined"
	end
	setVar $qss[23] $echoInterval&" Minutes"
	if ($dropOffensive)
		setVar $qss[26] "Offensive"
	elseif ($dropToll)
		setVar $qss[26] "Toll"
	else
		setVar $qss[26] "Defensive"
	end
	if ($defenderCapping)
		setVar $qss[24] "Using defense"
	elseif ($offenseCapping)
		setVar $qss[24] "Using offense"	
	else
		setVar $qss[24] "Don't attack"	
	end
	setVar $qss[27] ""	
	setVar $qss_total 27
	gosub :menuSpacing
	Echo #27 & "[2J"
	Echo "**"
	echo ANSI_11&"         General Info                     Surround/Attack Options*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mL"&#27&"[35m> "&ANSI_7&$qss_var[18]&ANSI_10&#27&"[35m<"&#27&"[32m3"&#27&"[35m> "&ANSI_7&$qss_var[6]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mP"&#27&"[35m> "&ANSI_7&$qss_var[4]&ANSI_10&#27&"[35m<"&#27&"[32m4"&#27&"[35m> "&ANSI_7&$qss_var[7]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mN"&#27&"[35m> "&ANSI_7&$qss_var[3]& ANSI_10&#27&"[35m<"&#27&"[32m5"&#27&"[35m> "&ANSI_7&$qss_var[8]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mZ"&#27&"[35m> "&ANSI_7&$qss_var[5]& ANSI_10&#27&"[35m<"&#27&"[32m6"&#27&"[35m> "&ANSI_7&$qss_var[26]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mG"&#27&"[35m> "&ANSI_7&$qss_var[21]& ANSI_10&#27&"[35m<"&#27&"[32m7"&#27&"[35m> "&ANSI_7&$qss_var[10]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mE"&#27&"[35m> "&ANSI_7&$qss_var[23]&ANSI_10&#27&"[35m<"&#27&"[32m8"&#27&"[35m> "&ANSI_7&$qss_var[9]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m1"&#27&"[35m> "&ANSI_7&$qss_var[20]&ANSI_10&#27&"[35m<"&#27&"[32m9"&#27&"[35m> "&ANSI_7&$qss_var[19]&"*"
	echo ANSI_11&"         Capture Options                   Location Variables*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m2"&#27&"[35m> "&ANSI_7&$qss_var[24]&ANSI_10&#27&"[35m<"&#27&"[32mS"&#27&"[35m> "&ANSI_7&$qss_var[13]&"*"
	echo ANSI_11&"        Current Ship Stats             "&#27&"[35m<"&#27&"[32mB"&#27&"[35m> "&ANSI_7&$qss_var[25]&"*"
	echo ANSI_10&"  "&ANSI_7&$qss_var[12]&ANSI_10&"  "&#27&"[35m<"&#27&"[32mR"&#27&"[35m> "&ANSI_7&$qss_var[14]&"*"
	echo ANSI_10&"  "&ANSI_7&$qss_var[11]&ANSI_10&"  "&ANSI_10&""&#27&"[35m<"&#27&"[32mA"&#27&"[35m> "&ANSI_7&$qss_var[15]&"*"
	echo ANSI_10&"  "&ANSI_7&$qss_var[17]&ANSI_10&"  "&#27&"[35m<"&#27&"[32mH"&#27&"[35m> "&ANSI_7&$qss_var[16]&"*"
	echo ANSI_10&"  "&ANSI_7&$qss_var[27]&ANSI_10&"  "&#27&"[35m<"&#27&"[32mX"&#27&"[35m> "&ANSI_7&$qss_var[22]&"*"
	echo "*"
	echo ANSI_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ANSI_15&"Planet List                    Game Stats"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ANSI_7&"**"
	getConsoleInput $chosen_option SINGLEKEY
	upperCase $chosen_option
	gosub :killthetriggers
	:process_command
		if ($chosen_option = "?")
		     goto :refreshPreferencesMenu
		elseif ($chosen_option = "N")
		        gosub :killthetriggers
			getInput $new_bot_name ANSI_13&"What is the 'in game' name of the bot? (one word, no spaces)"&ANSI_7
			stripText $new_bot_name "^"
			stripText $new_bot_name " "
			lowerCase $new_bot_name
			if ($new_bot_name = "")
				goto :refreshPreferencesMenu
			end
			delete $gconfig_file
			write $gconfig_file $new_bot_name
			setVar $bot_name $new_bot_name
		elseif ($chosen_option = "P")
			gosub :killthetriggers
			getInput $password "Please Enter your Game Password"
		elseif ($chosen_option = "Z")
			gosub :killthetriggers
			getInput $bot_password "Please Enter your Bot Password"
		elseif ($chosen_option = "G")
			gosub :killthetriggers
			getInput $letter "Please Enter your Game Letter"
		elseif ($chosen_option = "L")
			gosub :killthetriggers
			getInput $username "Please Enter your Login Name"
		elseif ($chosen_option = "1")
			if ($unlimitedGame = FALSE)
				gosub :killthetriggers
				getInput $temp "What are the minimum turns you need to do bot commands?"
				isNumber $test $temp
				if ($test)
					if (($temp <= 65000) AND ($temp >= 0))
						setVar $BOT_TURN_LIMIT $temp
					end
				end
			end
		elseif ($chosen_option = "3")
			gosub :killthetriggers
			getInput $temp "How many fighters to drop on surround?"
			isNumber $test $temp
			if ($test)
				if (($temp <= 50000) AND ($temp >= 0))
					setVar $surroundFigs $temp
				end
			end
		elseif ($chosen_option = "4")
			gosub :killthetriggers
			getInput $temp "How many limpets to drop on surround?"
			isNumber $test $temp
			if ($test)
				if (($temp <= 250) AND ($temp >= 0))
					setVar $surroundLimp $temp
				end
			end
		elseif ($chosen_option = "5")
			gosub :killthetriggers
			getInput $temp "How many armid mines to drop on surround?"
			isNumber $test $temp
			if ($test)
				if (($temp <= 250) AND ($temp >= 0))
					setVar $surroundMine $temp
				end
			end
		elseif ($chosen_option = "8")
			if ($surroundAvoidShieldedOnly)
				setvar $surroundAvoidShieldedOnly FALSE
				setVar $surroundAvoidAllPlanets TRUE
				setVar $surroundDontAvoid FALSE
			elseif ($surroundAvoidAllPlanets)
				setVar $surroundAvoidShieldedOnly FALSE
				setVar $surroundAvoidAllPlanets FALSE
				setVar $surroundDontAvoid TRUE
			else
				setVar $surroundAvoidShieldedOnly TRUE
				setVar $surroundAvoidAllPlanets FALSE
				setVar $surroundDontAvoid FALSE
			end
		elseif ($chosen_option = "7")
			if ($surroundAutoCapture)
				setvar $surroundAutoCapture FALSE
			else
				setVar $surroundAutoCapture TRUE
			end
		elseif ($chosen_option = "2")
			if ($defenderCapping)
				setvar $defenderCapping FALSE
				setVar $offenseCapping TRUE
				setVar $cappingAliens TRUE
			elseif ($offenseCapping)
				setVar $defenderCapping FALSE
				setVar $offenseCapping FALSE
				setVar $cappingAliens FALSE
			else
				setVar $defenderCapping TRUE
				setVar $offenseCapping FALSE
				setVar $cappingAliens TRUE
			end
		elseif ($chosen_option = "6")
			if ($dropOffensive)
				setvar $dropOffensive FALSE
				setvar $dropToll TRUE
			elseif ($dropToll)
				setvar $dropOffensive FALSE
				setvar $dropToll FALSE
			else
				setvar $dropOffensive TRUE
				setvar $dropToll FALSE
			end
		elseif ($chosen_option = "S")
			gosub :killthetriggers
			getInput $temp "What sector is the Stardock? (0 to set to twx variable)"
			isNumber $test $temp
			if ($test)
				if (($temp <= SECTORS) AND ($temp >= 1))
					setVar $stardock $temp
				elseif ($temp = 0)
					setVar $stardock STARDOCK
				end
			end
		elseif ($chosen_option = "X")
			gosub :killthetriggers
			getInput $temp "What ship number is your safe ship?"
			isNumber $test $temp
			if ($test)
				setVar $safe_Ship $temp
			end
		elseif ($chosen_option = "E")
			gosub :killthetriggers
			setvar $temp 5760
			getInput $temp "How many minutes afk do you want the echo banner to show each time?"
			isNumber $test $temp
			if ($test)
				if ($temp > 0)
					setVar $echoInterval $temp
				else
					setVar $echoInterval 5760
				end
			end
		elseif ($chosen_option = "R")
			gosub :killthetriggers
			getInput $temp "What sector is the Rylos port? (0 to set to twx variable)"
			isNumber $test $temp
			if ($test)
				if (($temp <= SECTORS) AND ($temp >= 1))
					setVar $rylos $temp
				elseif ($temp = 0)
					setVar $rylos RYLOS
				end
			end
		elseif ($chosen_option = "A")
			gosub :killthetriggers
			getInput $temp "What sector is the Alpha Centauri port? (0 to set to twx variable)"
			isNumber $test $temp
			if ($test)
				if (($temp <= SECTORS) AND ($temp >= 1))
					setVar $alpha_centauri $temp
				elseif ($temp = 0)
					setVar $alpha_centauri ALPHACENTAURI
				end
			end
		elseif ($chosen_option = "B")
			gosub :killthetriggers
			getInput $temp "What sector is the Backdoor to Stardock?"
			isNumber $test $temp
			if ($test)
				if (($temp <= SECTORS) AND ($temp >= 1))
					setVar $backdoor $temp
				end
			end
		elseif ($chosen_option = "H")
			gosub :killthetriggers
			getInput $temp "What sector is the Home Sector port?"
			isNumber $test $temp
			if ($test)
				if (($temp <= SECTORS) AND ($temp >= 1))
					setVar $home_sector $temp
				end
			end
		elseif ($chosen_option = "9")
			if ($surroundOverwrite)
				setvar $surroundOverwrite FALSE
				setVar $surroundPassive   TRUE
				setVar $surroundNormal    FALSE
			elseif ($surroundPassive)
				setVar $surroundOverwrite FALSE
				setVar $surroundPassive   FALSE
				setVar $surroundNormal    TRUE
			else
				setVar $surroundOverwrite TRUE
				setVar $surroundPassive   FALSE
				setVar $surroundNormal    FALSE
                        end
		elseif ($chosen_option = ">")
			goto :preferencesMenuPage2
		elseif ($chosen_option = "<")
			goto :preferencesMenuPage5
		else
			gosub :donePrefer
		end
		gosub :preferenceStats
		goto :refreshPreferencesMenu
:donePrefer
	openMenu TWX_TOGGLEDEAF false
	closeMenu
        echo #27 "[30D                        " #27 "[30D"
        echo CURRENTANSILINE
        setVar $botIsDeaf FALSE
        saveVar $botIsDeaf
        goto :wait_for_command
return
:preferenceStats
	saveVar $echoInterval
	saveVar $password
	saveVar $bot_name
	saveVar $bot_password
	saveVar $newPrompt
	saveVar $surroundAvoidShieldedOnly
	saveVar $surroundAvoidAllPlanets
	saveVar $surroundDontAvoid
	saveVar $surroundAutoCapture
	saveVar $surroundFigs
	saveVar $surroundLimp
	saveVar $surroundMine
	saveVar $surroundOverwrite
	saveVar $surroundPassive
	saveVar $surroundNormal
	saveVar $stardock
	saveVar $backdoor
	saveVar $rylos
	saveVar $alpha_centauri
	saveVar $home_sector
	saveVar $BOT_TURN_LIMIT
	saveVar $username
	saveVar $letter
	saveVar $defenderCapping
	saveVar $offenseCapping
	saveVar $safe_ship
	saveVar $cappingAliens
return
:preferencesMenuPage2
	killalltriggers
	setArray $space 34
	setArray $h 34
	setArray $qss 34
	setVar $h[1]  "Atomic Detonators      "
	setVar $h[2]  "Marker Beacons         "
	setVar $h[3]  "Corbomite Devices      "
	setVar $h[4]  "Cloaking Devices       "
	setVar $h[5]  "SubSpace Ether Probes  "
	setVar $h[6]  "Planet Scanners        "
	setVar $h[7]  "Limpet Tracking Mines  "
	setVar $h[8]  "Space Mines            "
	setVar $h[9]  "Photon Missiles        "
	setVar $h[10] "Holographic Scan       "
	setVar $h[11] "Density Scan           "
	setVar $h[12] "Mine Disruptors        "
	setVar $h[13] "Genesis Torpedoes      "
	setVar $h[14] "TransWarp I            "
	setVar $h[15] "TransWarp II           "
	setVar $h[16] "Psychic Probes         "
	setVar $h[17] "Limpet Removal         "
	setVar $h[18] "Server Max Commands    "
	setVar $h[19] "Gold Enabled           "
	setVar $h[20] "MBBS Mode              "
	setVar $h[21] "Multiple Photons?      "
	setVar $h[22] "                       "
	setVar $h[23] "Colonists Per Day      "
	setVar $h[24] "Planet Trade           "
	setVar $h[25] "Steal Factor           "
	setVar $h[26] "Rob Factor             "
	setVar $h[27] "Days To Bust Clear     "
	setVar $h[28] "                       "
	setVar $h[29] "Port Maximum           "
	setVar $h[30] "Port Production Rate   "
	setVar $h[31] "Max Port Regen Per Day "
	setVar $h[32] "                       "
	setVar $h[33] "Nav Haz Loss Per Day   "
	setVar $h[34] "Radiation Lifetime     "
	setVar $qss[1] $ATOMIC_COST
	setVar $qss[2] $BEACON_COST
	setVar $qss[3] $CORBO_COST
	setVar $qss[4] $CLOAK_COST
	setVar $qss[5] $PROBE_COST
	setVar $qss[6] $PLANET_SCANNER_COST
	setVar $qss[7] $LIMPET_COST
	setVar $qss[8] $ARMID_COST
	if ($PHOTONS_ENABLED)
		setVar $qss[9] $PHOTON_COST
	else
		setVar $qss[9] "Disabled"
	end
	setVar $qss[10] $HOLO_COST
	setVar $qss[11] $DENSITY_COST
	setVar $qss[12] $DISRUPTOR_COST
	setVar $qss[13] $GENESIS_COST
	setVar $qss[14] $TWARPI_COST
	setVar $qss[15] $TWARPII_COST
	setVar $qss[16] $PSYCHIC_COST
	setVar $qss[17] $LIMPET_REMOVAL_COST
	if ($MAX_COMMANDS = 0)
		setVar $qss[18] "Unlimited"
	else
		setVar $qss[18] $MAX_COMMANDS
	end
	if ($goldEnabled)
		setVar $qss[19] "Yes"
	else
		setVar $qss[19] "No"
	end
	if ($mbbs)
		setVar $qss[20] "Yes"
	else
		setVar $qss[20] "No"
        end
	if ($PHOTONS_ENABLED)
		if ($MULTIPLE_PHOTONS)
			setVar $qss[21] "Yes"
		else
			setVar $qss[21] "No"
		end
	else
		setVar $qss[21] "Disabled"
	end
	setVar $qss[22] ""
	setVar $qss[23] $COLONIST_REGEN
	setVar $qss[24] $PTRADESETTING&"%"
	setVar $qss[25] $steal_factor
	setVar $qss[26] $rob_factor
	setVar $qss[27] $CLEAR_BUST_DAYS
	setVar $qss[28] ""
	setVar $qss[29] $port_max
	setVar $qss[30] $PRODUCTION_RATE&"%"
	setVar $qss[31] $PRODUCTION_REGEN&"%"
	setVar $qss[32] ""
	setVar $qss[33] $DEBRIS_LOSS&"%"
	setVar $qss[34] $RADIATION_LIFETIME
	setVar $qss_total 34
	gosub :menuSpacing
	Echo #27 & "[2J"
	Echo "**"
	echo ANSI_11&"      Stardock Prices                 Game Statistics*"
	echo ANSI_10&" "&ANSI_7&$qss_var[1]&ANSI_10&""&ANSI_7&$qss_var[18]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[2]&ANSI_10&""&ANSI_7&$qss_var[19]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[3]&ANSI_10&""&ANSI_7&$qss_var[20]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[4]&ANSI_10&""&ANSI_7&$qss_var[21]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[5]&ANSI_10&""&ANSI_7&$qss_var[22]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[6]&ANSI_10&""&ANSI_7&$qss_var[23]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[7]&ANSI_10&""&ANSI_7&$qss_var[24]&"*"
	echo ANSI_11&" "&ANSI_7&$qss_var[8]&ANSI_10&""&ANSI_7&$qss_var[25]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[9]&ANSI_10&""&ANSI_7&$qss_var[26]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[10]&ANSI_10&""&ANSI_7&$qss_var[27]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[11]&ANSI_10&""&ANSI_7&$qss_var[28]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[12]&ANSI_10&""&ANSI_7&$qss_var[29]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[13]&ANSI_10&""&ANSI_7&$qss_var[30]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[14]&ANSI_10&""&ANSI_7&$qss_var[31]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[15]&ANSI_10&""&ANSI_7&$qss_var[32]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[16]&ANSI_10&""&ANSI_7&$qss_var[33]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[17]&ANSI_10&""&ANSI_7&$qss_var[34]&"*"
	echo "*"
	echo ANSI_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ANSI_15&"Preferences                Hot Keys"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ANSI_7&"**"
	getConsoleInput $chosen_option SINGLEKEY
	upperCase $chosen_option
	gosub :killthetriggers
	upperCase $chosen_option
	:process_commandPage2
		if ($chosen_option = "?")
		     goto :preferencesMenuPage2		
		elseif ($chosen_option = ">")
			goto :preferencesMenuPage3
		elseif ($chosen_option = "<")
			goto :refreshPreferencesMenu
		else
			gosub :donePrefer
		end
:preferencesMenuPage3
	killalltriggers
	Echo #27 & "[2J"
	Echo "**"
	echo ANSI_11&"                  Custom Hotkey Definitions           *"
	gosub :echoHotkeys
	echo "*"
	echo ANSI_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ANSI_15&"Game Stats                    Ship Info"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ANSI_7&"**"
	setVar $options "1234567890ABCDEFGHIJKLMNOPRSTUVWX"
	getConsoleInput $chosen_option SINGLEKEY
	upperCase $chosen_option
	getWordPos $options $pos $chosen_option
	gosub :killthetriggers
	
	:process_commandPage3
		if ($chosen_option = "?")
		     goto :preferencesMenuPage3	
		elseif ($chosen_option = ">")
			goto :preferencesMenuPage4
		elseif ($chosen_option = "<")
			goto :preferencesMenuPage2
		elseif ($pos > 0)
			gosub :killthetriggers
			echo "*What should this hotkey be set to?*"
			getConsoleInput $temp SINGLEKEY
			lowerCase $temp
			getCharCode $temp $lower
			upperCase $temp
			getCharCode $temp $upper
			setVar $key $custom_keys[$pos]
			upperCase $key
			getCharCode $key $old_upper
			lowerCase $key
			getCharCode $key $old_lower
			if (((($hotkeys[$upper] = "0") OR ($hotkeys[$upper] = "")) AND (($hotkeys[$lower] = "0") OR ($hotkeys[$lower] = ""))) AND (($lower < 48) OR ($lower > 57)) AND ($temp <> "?"))
				setVar $hotkeys[$old_upper] ""
				setVar $hotkeys[$old_lower] ""
				setVar $hotkeys[$upper] $pos
				setVar $hotkeys[$lower] $pos
				setVar $custom_keys[$pos] $temp
				if ($pos > 17)
					getInput $temp "What is the bot command to connect to this hotkey?"
					setVar $custom_commands[$pos] $temp
				end
				setVar $i 1
				delete "__MOMBot_Hotkeys.cfg"
				delete "__MOMBot_custom_keys.cfg"
				delete "__MOMBot_custom_commands.cfg"
				while ($i <= 255)
					write "__MOMBot_hotkeys.cfg" $hotkeys[$i]
					add $i 1
				end
				setVar $i 1
				while ($i <= 33)
					write "__MOMBot_custom_keys.cfg" $custom_keys[$i]
					add $i 1
				end
				setVar $i 1
				while ($i <= 33)
					write "__MOMBot_custom_commands.cfg" $custom_commands[$i]
					add $i 1
				end
			else
				echo ANSI_4 "*Hot key already bound to another function.**" ANSI_7
				setDelayTrigger warningdelay :preferencesMenuPage3 1000
				pause
			end
			goto :preferencesMenuPage3
		else
			gosub :donePrefer
		end		
:preferencesMenuPage4
	killalltriggers
	setVar $i 1
	setVar $shipsChanged FALSE
	if ($shipCounter > 10)
		setVar $pagesExist TRUE
	else
		setVar $pagesExist FALSE
	end
	:NextShipPage
		setVar $thisPage $i
		setVar $menuCount 0
		Echo #27 & "[2J"
		Echo "**"
		echo ANSI_11&"                      Known Ship Information           **"
		echo ANSI_15 "    Type                      Def  Off  TPW  D-Bonus?   Shields   Fighters *"
		echo "   " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
		while (($i < $shipcounter) AND ($menuCount < 10))
			cutText $shipList[$i]&"                                    " $temp 1 25
			cutText $shipList[$i][2]&"  " $tempdefhead 1 1
			cutText $shipList[$i][2]&"  " $tempdeftail 2 1
			cutText $shipList[$i][3]&"  " $tempoffhead 1 1
			cutText $shipList[$i][3]&"  " $tempofftail 2 1
			if ($shipList[$i][8])
				setVar $tempdefender ANSI_12&"Yes"&ANSI_14
			else
				setVar $tempdefender "No "
			end
			cutText $shipList[$i][1]&"              " $tempshields 1 10
			cutText $shipList[$i][5]&"              " $tempfighters 1 6
			cutText $shipList[$i][7]&"              " $temptpw 1 3
			echo ANSI_14 "<" $menuCount "> " $temp " " $tempdefhead "." $tempdeftail "  " $tempoffhead "." $tempofftail "   " $temptpw "   " $tempdefender "       " $tempshields " " $tempfighters "*"
			add $i 1
			add $menuCount 1
		end
		echo "   " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
		echo "*"
		if ($pagesExist)
			Echo "  " & ANSI_5 & "<" & ANSI_6 & "+" & ANSI_5 & ">" & ANSI_6 & " More Ships*"
		end
		echo "*"
		echo ANSI_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ANSI_15&"Hot Keys                 Planet List"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ANSI_7&"**"

		echo "  " & ANSI_5 & "Toggle defender status (0-9)? "
		getConsoleInput $selection SINGLEKEY
		setVar $options "1234567890"
		upperCase $selection
		getWordPos $options $pos $selection
		gosub :killthetriggers
		if ($selection = "<")
			gosub :rewrite_cap_file
			goto :PreferencesMenuPage3
		elseif ($selection = ">")
			gosub :rewrite_cap_file
			goto :PREFERENCESMENUPAGE5
		elseif ($selection = "?")
			gosub :rewrite_cap_file
			goto :PreferencesMenuPage4
		elseif (($pagesExist) AND ($selection = "+"))
			if ($i >= $shipCounter)
				setVar $i 1
			end
			goto :NextShipPage
		elseif ($pos > 0)
			if ($shipList[($selection+$thisPage)][8])
				setVar $shipList[($selection+$thisPage)][8] FALSE
			else
				setVar $shipList[($selection+$thisPage)][8] TRUE
			end
			setVar $i $thisPage
			setVar $shipsChanged TRUE
			goto :NextShipPage
		else
			gosub :rewrite_cap_file
			gosub :donePrefer
		end

:rewrite_cap_file
	if ($shipsChanged)
		setVar $gbonus_file "_MOM_"&GAMENAME&"_dbonus-ships.txt"
		delete $gbonus_file
		delete $cap_file
		setVar $j 1
		while ($j < $shipcounter)
			write $cap_file $shipList[$j][1] & " " & $shipList[$j][2] & " " & $shipList[$j][3] & " " & $shipList[$j][9] & " " & $shipList[$j][4] & " " & $shipList[$j][5] & " " & $shipList[$j][6] & " " & $shipList[$j][7] & " " & $shipList[$j][8] & " " & $shipList[$j]
			if ($shipList[$j][8])
				write $gbonus_file $shipList[$j]
			end
			add $j 1
		end
	end
return

:PREFERENCESMENUPAGE5
	setVar $i 2
:nextPlanetPage
	echo ANSI_12 "*Searching for enemy planets in database" ANSI_14 "...*"
	killalltriggers
	setVar $foundSectors 0
	setVar $display ""
	while (($i <= SECTORS) AND ($foundSectors < 3))
		getSectorParameter $i "FIGSEC" $isFigged
		setVar $owner SECTOR.FIGS.OWNER[$i]
		if (($isFigged <> TRUE) AND ($owner <> "belong to your Corp") AND ($owner <> "yours"))
			if (SECTOR.PLANETCOUNT[$i] > 0)
				setVar $displaySector $i
				gosub :displaySector
				setVar $display $display&"*"&$output
				add $foundSectors 1
			end
		end
		add $i 1
	end
	Echo #27 & "[2J"
	Echo "**"
	echo ANSI_11&"                         Enemy Planet List*             ("&ANSI_14&"Planets in sectors not controlled by you"&ANSI_11&")              **"
	echo "   " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
	setVar $pagesExist FALSE
	if ($foundSectors > 0)
		echo $display
		if ($i >= SECTORS)
			echo "*    [End of List]"
			setVar $i 2
		else
			setVar $pagesExist TRUE
		end
	else
		echo "*    [End of List]"
	end
	echo "*"
	echo "   " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
	echo "*"
	if ($pagesExist)
		Echo "  " & ANSI_5 & "<" & ANSI_6 & "+" & ANSI_5 & ">" & ANSI_6 & " More Planets*"
	end
	echo "*"
	echo ANSI_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ANSI_15&"Ship Info                 Preferences"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ANSI_7&"**"

	#echo "  " & ANSI_5 & "Toggle defender status (0-9)? "
	getConsoleInput $selection SINGLEKEY
	setVar $options ""
	upperCase $selection
	getWordPos $options $pos $selection
	gosub :killthetriggers
	if ($selection = "<")
		goto :PreferencesMenuPage4
	elseif ($selection = ">")
		goto :refreshPreferencesMenu
	elseif ($selection = "?")
		goto :PreferencesMenuPage5
	elseif ($selection = "+")
		goto :nextPlanetPage
	else
		gosub :donePrefer
	end

:sector
:secto
:sect
:sec
	setVar $i $parm1
	isNumber $test $i
	if ($test <> TRUE)
		setVar $message "Sector entered is not a number.*"
		gosub :switchboard
		goto :wait_for_command
	end
	if (($i > SECTORS) OR ($i < 1))
		setVar $message "Sector entered must be between 1 - "&SECTORS&".*"
		gosub :switchboard
		goto :wait_for_command
	end
	gosub :displaySector
	setVar $message $output
	if ($self_command <> TRUE)
		setVar $self_command 2
	end
	gosub :switchboard
goto :wait_for_command
:displaySector
	setVar $output ANSI_10&"    Sector  "&ANSI_14&": "&ANSI_11&$i&ANSI_2&" in "
	setVar $constellation SECTOR.CONSTELLATION[$i]
	if ($constellation = "The Federation.")
		setVar $output $output&ANSI_10&$constellation&"*"
	else
		setVar $output $output&ANSI_1&$constellation&"*"
	end
	if (SECTOR.BEACON[$i] <> "")
		setVar $output $output&ANSI_5&"    Beacon  "&ANSI_14&": "&ANSI_12&SECTOR.BEACON[$i]&"*"
	end
	if (PORT.EXISTS[$i])
		setVar $class PORT.CLASS[$i]
		setVar $output $output&ANSI_5&"    Ports   "&ANSI_14&": "&ANSI_11&PORT.NAME[$i]&ANSI_14&", "&ANSI_5&"Class "&ANSI_11&$class&" "
		if (($class <> "0") AND ($class <> "9"))
			setVar $output $output&ANSI_5&"("
			if (PORT.BUYFUEL[$i])
				setVar $output $output&ANSI_2&"B"
			else
				setVar $output $output&ANSI_11&"S"
			end
			if (PORT.BUYORG[$i])
				setVar $output $output&ANSI_2&"B"
			else
				setVar $output $output&ANSI_11&"S"
			end
			if (PORT.BUYEQUIP[$i])
				setVar $output $output&ANSI_2&"B"
			else
				setVar $output $output&ANSI_11&"S"
			end
			setVar $output $output&ANSI_5&")"
		end
		setVar $output $output&"*"
	end
	setVar $j 1
	while ($j <= SECTOR.PLANETCOUNT[$i])
		setVar $isShielded FALSE
		setVar $temp SECTOR.PLANETS[$i][$j]
		getWord $temp $test 1
		if ($test = "<<<<")
			setVar $isShielded TRUE
		end
		getWord $temp $type 2
		stripText $type "("
		stripText $type ")"
		if ($isShielded)
			getLength $temp $length
			cutText $temp $temp 1 ($length-15)
			cutText $temp $temp 10 9999
			setVar $temp ANSI_12&"<<<< "&ANSI_10&"("&ANSI_14&$type&ANSI_10&") "&ANSI_1&$temp&ANSI_12&" >>>> "&ANSI_2&"(Shielded)"
		else
			setVar $temp ANSI_2&$temp
		end
		if ($j = 1)
			setVar $temp ANSI_5&"    Planets "&ANSI_14&": "&$temp
			setVar $output $output&$temp&"*"
		else
			setVar $output $output&"              "&$temp&"*"
		end
		add $j 1
	end
	if (SECTOR.FIGS.QUANTITY[$i] > 0)
		setVar $output $output&ANSI_5&"    Fighters"&ANSI_14&": "&ANSI_11&SECTOR.FIGS.QUANTITY[$i]&ANSI_5&" ("&SECTOR.FIGS.OWNER[$i]&") "&ANSI_6&"["&SECTOR.FIGS.TYPE[$i]&"]*"
	end
	setVar $output $output&ANSI_10&"    Warps to sector(s) "&ANSI_14&":  "
	setVar $k 1
	while (SECTOR.WARPS[$i][$k] > 0)
		if ($k <> 1)
			setVar $output $output&ANSI_2&" - "
		end
		setVar $output $output&ANSI_11&SECTOR.WARPS[$i][$k]
		add $k 1
	end
	setVar $k 1
	while (SECTOR.BACKDOORS[$i][$k] > 0)
		if ($k <> 1)
			setVar $output $output&ANSI_2&" - "
		else
			setVar $output $output&ANSI_12&"*    Backdoor from sector(s) "&ANSI_14&":  "
		end
		setVar $output $output&ANSI_11&SECTOR.BACKDOORS[$i][$k]
		add $k 1
	end
	setVar $output $output&"**"
return

:echoHotKeys
	setArray $space 34
	setArray $h 34
	setArray $qss 34
	setVar $h[1]  "Auto Kill            "
	setVar $h[2]  "Auto Capture         "
	setVar $h[3]  "Auto Refurb          "
	setVar $h[4]  "Surround             "
	setVar $h[5]  "Holo-Torp            "
	setVar $h[6]  "Terra Macros         "
	setVar $h[7]  "Planet Macros        "
	setVar $h[8]  "Quick Script Loading "
	setVar $h[9]  "Dny Holo Kill        "
	setVar $h[10] "Stop Current Mode    "
	setVar $h[11] "Dock Macros          "
	setVar $h[12] "Exit Enter           "
	setVar $h[13] "Mow                  "
	setVar $h[14] "Fast Foton           "
	setVar $h[15] "Clear Sector         "
	setVar $h[16] "Preferences          "
	setVar $h[17] "LS Dock Shopper      "
	setVar $i 1
	while ($i <= 16)
		if ($custom_commands[($i+17)] <> "0")
			setVar $h[($i+17)] $custom_commands[($i+17)]&"                              "
			cutText $h[($i+17)] $h[($i+17)] 1 22
		else
			setVar $h[($i+17)] "Custom Hotkey "&$i&"        "
			cutText $h[($i+17)] $h[($i+17)] 1 22
		end
		add $i 1
	end
	setVar $h[34] "                     "
	setVar $i 1
	while ($i <= 33)
		if (($custom_keys[$i] <> "0") AND ($custom_keys[$i] <> ""))
			if ($custom_keys[$i] = #9)
				setVar $qss[$i] "TAB-TAB"
			elseif ($custom_keys[$i] = #13)
				setVar $qss[$i] "TAB-Enter"
			elseif ($custom_keys[$i] = #8)
				setVar $qss[$i] "TAB-Backspace"
			elseif ($custom_keys[$i] = #32)
				setVar $qss[$i] "TAB-Spacebar"
			else
				setVar $qss[$i] "TAB-"&$custom_keys[$i]
			end
		else
			setVar $qss[$i] "Undefined"
		end
		add $i 1
	end
	setVar $qss[34] ""
	setVar $qss_total 34
	gosub :menuSpacing
	echo ANSI_10&#27&"[35m<"&#27&"[32m1"&#27&"[35m> "&ANSI_7&$qss_var[1]&ANSI_10&#27&"[35m<"&#27&"[32mH"&#27&"[35m> "&ANSI_7&$qss_var[18]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m2"&#27&"[35m> "&ANSI_7&$qss_var[2]&ANSI_10&#27&"[35m<"&#27&"[32mI"&#27&"[35m> "&ANSI_7&$qss_var[19]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m3"&#27&"[35m> "&ANSI_7&$qss_var[3]&ANSI_10&#27&"[35m<"&#27&"[32mJ"&#27&"[35m> "&ANSI_7&$qss_var[20]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m4"&#27&"[35m> "&ANSI_7&$qss_var[4]&ANSI_10&#27&"[35m<"&#27&"[32mK"&#27&"[35m> "&ANSI_7&$qss_var[21]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m5"&#27&"[35m> "&ANSI_7&$qss_var[5]&ANSI_10&#27&"[35m<"&#27&"[32mL"&#27&"[35m> "&ANSI_7&$qss_var[22]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m6"&#27&"[35m> "&ANSI_7&$qss_var[6]&ANSI_10&#27&"[35m<"&#27&"[32mM"&#27&"[35m> "&ANSI_7&$qss_var[23]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m7"&#27&"[35m> "&ANSI_7&$qss_var[7]&ANSI_10&#27&"[35m<"&#27&"[32mN"&#27&"[35m> "&ANSI_7&$qss_var[24]&"*"
	echo ANSI_11&#27&"[35m<"&#27&"[32m8"&#27&"[35m> "&ANSI_7&$qss_var[8]&ANSI_10&#27&"[35m<"&#27&"[32mO"&#27&"[35m> "&ANSI_7&$qss_var[25]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m9"&#27&"[35m> "&ANSI_7&$qss_var[9]&ANSI_10&#27&"[35m<"&#27&"[32mP"&#27&"[35m> "&ANSI_7&$qss_var[26]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m0"&#27&"[35m> "&ANSI_7&$qss_var[10]&ANSI_10&#27&"[35m<"&#27&"[32mR"&#27&"[35m> "&ANSI_7&$qss_var[27]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mA"&#27&"[35m> "&ANSI_7&$qss_var[11]&ANSI_10&#27&"[35m<"&#27&"[32mS"&#27&"[35m> "&ANSI_7&$qss_var[28]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mB"&#27&"[35m> "&ANSI_7&$qss_var[12]&ANSI_10&#27&"[35m<"&#27&"[32mT"&#27&"[35m> "&ANSI_7&$qss_var[29]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mC"&#27&"[35m> "&ANSI_7&$qss_var[13]&ANSI_10&#27&"[35m<"&#27&"[32mU"&#27&"[35m> "&ANSI_7&$qss_var[30]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mD"&#27&"[35m> "&ANSI_7&$qss_var[14]&ANSI_10&#27&"[35m<"&#27&"[32mV"&#27&"[35m> "&ANSI_7&$qss_var[31]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mE"&#27&"[35m> "&ANSI_7&$qss_var[15]&ANSI_10&#27&"[35m<"&#27&"[32mW"&#27&"[35m> "&ANSI_7&$qss_var[32]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mF"&#27&"[35m> "&ANSI_7&$qss_var[16]&ANSI_10&#27&"[35m<"&#27&"[32mX"&#27&"[35m> "&ANSI_7&$qss_var[33]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mG"&#27&"[35m> "&ANSI_7&$qss_var[17]&ANSI_10&""&ANSI_7&$qss_var[34]&"*"
return
# ======================     END PREFERENCES MENU SUBROUTINE    ==========================
# ========================= START PREGAME MENU ========================================
:preGameMenuLoad
	killalltriggers
	loadVar $password
	loadVar $bot_name
	loadVar $startShipName
	loadVar $mowToDock
	loadVar $mowToDockBackdoor
	loadVar $startGameDelay
	loadVar $isCEO
	loadVar $corpName
	if ($corpName = 0)
		setVar $corpName ""
		saveVar $corpName
	end
	loadVar $subspace
	loadVar $corpPassword
	if ($corpPassword = 0)
		setVar $corpPassword ""
		saveVar $corpPassword
	end
	loadVar $username
	loadVar $letter
	if ($password = 0)
		setVar $password PASSWORD
	end
	if ($username = 0)
		setVar $username LOGINNAME
	end
	if ($letter = 0)
		setVar $letter GAME
 	end
	if ($bot_name = "")
		setVar $newGameDay1 TRUE
		setVar $newGameOlder FALSE
	else
		setVar $newGameDay1 FALSE
		setVar $newGameOlder TRUE
	end
:preGameMenu
	setArray $space 27
	setArray $h 26
	setArray $qss 26
	setVar $h[1]  "Bot Name:        "
	setVar $h[2]  "Login Name:      "
	setVar $h[3]  "Password:        "
	setVar $h[4]  "Game Letter:     "
	setVar $h[5]  "Ship Name:       "
	setVar $h[6]  "Type of login:   "
	setVar $h[7]  "Are you CEO?     "
	setVar $h[8]  "Corp Name:       "
	setVar $h[9]  "Corp Password:   "
	setVar $h[10] "Subspace Channel:"
	setVar $h[11] "Delay (Minutes): "
	setVar $h[12] "After login:     "
	setVar $h[13] "                 "
	setVar $h[14] "                 "
	setVar $h[15] "                 "
	setVar $h[16] "                 "
	setVar $h[17] "                 "
	setVar $h[18] "                 "
	setVar $h[19] "                 "
	setVar $h[20] "                 "
	setVar $h[21] "                 "
	setVar $h[22] "                 "
	setVar $h[23] "                 "
	setVar $h[24] "                 "
	setVar $h[25] "                 "
	setVar $h[26] "                 "
	setVar $qss[1] $bot_name
	setVar $qss[2] $username
	setVar $qss[3] $password
	setVar $qss[4] $letter
	setVar $qss[5] $startShipName
	if ($newGameDay1)
		setVar $qss[6] "New Game Account Creation"
	elseif ($newGameOlder)
		setVar $qss[6] "Normal Relog"
	else
		setVar $qss[6] "Return after being destroyed."
	end
	if ($isCEO)
		setVar $qss[7] "Yes"
	else
		setVar $qss[7] "No"
	end
	setVar $qss[8] $corpName
	setVar $qss[9] $corpPassword
	setVar $qss[10] $subspace
	setVar $qss[11] $startGameDelay
	if ($mowToDock)
		setVar $qss[12] "Mow To Stardock"
	elseif ($mowToAlpha)
		setVar $qss[12] "Mow To Alpha"
	elseif ($mowToRylos)
		setVar $qss[12] "Mow To Rylos"
	elseif ($mowToOther)
		setVar $qss[12] "Mow To Custom TA"
	else
		setVar $qss[12] "Land on Terra"
	end
	setVar $qss[13] ""
	setVar $qss[14] ""
	setVar $qss[15] ""
	setVar $qss[16] ""
	setVar $qss[17] ""
	setVar $qss[18] ""
	setVar $qss[19] ""
	setVar $qss[20] ""
	setVar $qss[21] ""
	setVar $qss[22] ""
	setVar $qss[23] ""
	setVar $qss[24] ""
	setVar $qss[25] ""
	setVar $qss[26] ""
	setVar $qss_total 26
	gosub :menuSpacing
	echo "**"
	echo ANSI_11&" Relog Menu   (Q to quit, Z to start logging in.)         *"
	echo ANSI_10&#27&"[35m<"&#27&"[32m1"&#27&"[35m> "&ANSI_7&$qss_var[6] &"*"
	echo "*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mB"&#27&"[35m> "&ANSI_7&$qss_var[1] &"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mL"&#27&"[35m> "&ANSI_7&$qss_var[2] &"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mP"&#27&"[35m> "&ANSI_7&$qss_var[3] &"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mG"&#27&"[35m> "&ANSI_7&$qss_var[4] &"*"
	if ($newGameOlder = FALSE)
		echo ANSI_10&#27&"[35m<"&#27&"[32mS"&#27&"[35m> "&ANSI_7&$qss_var[5] &"*"
	end
	if ($newGameDay1 = TRUE)
		echo ANSI_10&#27&"[35m<"&#27&"[32m2"&#27&"[35m> "&ANSI_7&$qss_var[7] &"*"
		echo ANSI_10&#27&"[35m<"&#27&"[32m3"&#27&"[35m> "&ANSI_7&$qss_var[8] &"*"
		echo ANSI_10&#27&"[35m<"&#27&"[32m4"&#27&"[35m> "&ANSI_7&$qss_var[9] &"*"
		echo ANSI_10&#27&"[35m<"&#27&"[32m5"&#27&"[35m> "&ANSI_7&$qss_var[10]&"*"
	end
	echo ANSI_10&#27&"[35m<"&#27&"[32m6"&#27&"[35m> "&ANSI_7&$qss_var[11]&"*"
	if ($newGameOlder = FALSE)
		echo ANSI_10&#27&"[35m<"&#27&"[32m7"&#27&"[35m> "&ANSI_7&$qss_var[12]&"*"
	end
	echo "*"
	:getStartGameInput
		getConsoleInput $chosen_option SINGLEKEY
		gosub :killthetriggers
		upperCase $chosen_option
	:process_start_command
		if ($chosen_option = "?")
		     goto :pregameMenu
		elseif ($chosen_option = "B")
		        gosub :killthetriggers
			getInput $new_bot_name ANSI_13&"What is the 'in game' name of the bot? (one word, no spaces)"&ANSI_7
			stripText $new_bot_name "^"
			stripText $new_bot_name " "
			if ($new_bot_name = "")
				goto :pregameMenu
			end
			delete $gconfig_file
			write $gconfig_file $new_bot_name
			setVar $bot_name $new_bot_name
		elseif ($chosen_option = "P")
			gosub :killthetriggers
			getInput $password "Please Enter your Game Password"
		elseif ($chosen_option = "G")
			gosub :killthetriggers
			getInput $letter "Please Enter your Game Letter"
		elseif ($chosen_option = "L")
			gosub :killthetriggers
			getInput $username "Please Enter your Login Name"
		elseif ($chosen_option = "S")
			gosub :killthetriggers
			getInput $startShipName "What ship name would you like?"
		elseif ($chosen_option = "1")
			if ($newGameDay1)
				setvar $newGameDay1 FALSE
				setvar $newGameOlder TRUE
			elseif ($newGameOlder)
				setvar $newGameDay1 FALSE
				setvar $newGameOlder FALSE
			else
				setvar $newGameDay1 TRUE
				setvar $newGameOlder FALSE
			end
		elseif ($chosen_option = "2") AND (($newGameDay1 = TRUE) OR ($newGameOlder = TRUE))
			if ($isCEO)
				setvar $isCEO FALSE
			else
				setVar $isCEO TRUE
			end
		elseif ($chosen_option = "3") AND (($newGameDay1 = TRUE) OR ($newGameOlder = TRUE))
			getInput $temp "What Corp Name will you use?"
			if ($temp = "0")
				setVar $temp ""
			end
			setVar $corpName $temp
		elseif ($chosen_option = "4") AND (($newGameDay1 = TRUE) OR ($newGameOlder = TRUE))
			getInput $temp "What Corp Password will you use?"
			if ($temp = "0")
				setVar $temp ""
			end
			setVar $corpPassword $temp
		elseif ($chosen_option = "5") AND (($newGameDay1 = TRUE) OR ($newGameOlder = TRUE))
			getInput $temp "What subspace channel do you want to use?"
			isNumber $test $temp
			if ($test)
				if (($temp <= 60000) AND ($temp >= 0))
					setVar $subspace $temp
				end
			end
		elseif ($chosen_option = "6")
			getInput $temp "How long in minutes before the game starts?"
			isNumber $test $temp
			if ($test)
				setVar $startGameDelay $temp
			end
		elseif ($chosen_option = "7")
			if ($mowToDock)
				setVar $qss[12] "Land on Terra"
				setvar $mowToDock FALSE
				setVar $mowToAlpha FALSE
				setVar $mowToRylos FALSE
				setVar $mowToOther FALSE
				setVar $mowDestination ""
			elseif (($mowToAlpha = FALSE) AND ($mowToRylos = FALSE) AND ($mowToOther = FALSE) AND ($mowToDock = FALSE))
				setVar $qss[12] "Mow To Alpha"
				setvar $mowToDock FALSE
				setVar $mowToAlpha TRUE
				setVar $mowToRylos FALSE
				setVar $mowToOther FALSE
				setVar $mowDestination $alpha_centauri
			elseif ($mowToAlpha)
				setVar $qss[12] "Mow To Rylos"
				setvar $mowToDock FALSE
				setVar $mowToAlpha FALSE
				setVar $mowToRylos TRUE
				setVar $mowToOther FALSE
				setVar $mowDestination $rylos
			elseif ($mowToRylos)
				setVar $qss[12] "Mow To Custom TA"
				setvar $mowToDock FALSE
				setVar $mowToAlpha FALSE
				setVar $mowToRylos FALSE
				setVar $mowToOther TRUE
				setVar $mowDestination ""
			elseif ($mowToOther)
				setVar $qss[12] "Mow to Stardock"
				setvar $mowToDock TRUE
				setVar $mowToAlpha FALSE
				setVar $mowToRylos FALSE
				setVar $mowToOther FALSE
				setVar $mowDestination $stardock
			end
		elseif ($chosen_option = "Q")
			stop $LAST_LOADED_MODULE
			setVar $doRelog FALSE
			goto :wait_for_command
		elseif ($chosen_option = "Z")
			:getMowSector
			killalltriggers
			if ($mowToOther)
				getInput $temp "What mow destination do you want to use?"
				isNumber $test $temp
				if ($test)
					if (($temp <= SECTORS) AND ($temp > 0))
						setVar $mowDestination $temp
					else
						goto :getMowSector
					end
				else
					goto :getMowSector
				end
			end
			setVar $timeToLogBackIn ($startGameDelay * 60)
			setTextOutTrigger logearly :endDelayStartGame #32
			while ($timeToLogBackIn > 0)
				gosub :calcTime
				echo ANSI_10 #27 & "[1A" & #27 & "[K" & $hours ":" $minutes ":" $seconds " left before entering game " GAME " (" GAMENAME ") "&ANSI_15&" ["&ANSI_14&"Spacebar to relog"&ANSI_15&"]*"
				setDelayTrigger timeBeforeRelog :startGameTimer 1000
				pause
				:startGameTimer
					setVar $timeToLogBackIn $timeToLogBackIn-1
			end
			:endDelayStartGame
			killalltriggers
			if ($newGameOlder = TRUE)
				goto :relog_attempt
			elseif ($newGameDay1 = TRUE)
				:tryAgainNewGameDay1
					gosub :do_relog
					setTextLineTrigger	GameClosed1	:GameClosed		"I'm sorry, but this is a closed game."
					setTextLineTrigger	GameClosed2	:GameClosed		"www.tradewars.com                                   Epic Interactive Strategy"
   					setTextLineTrigger	Damn_Planet	:Damn_Planet		"What do you want to name your home planet?"
					setTextTrigger		Phew		:Phew			"Command [TL"
					send "T***Y"&$password&"*"&$password&"**N"&$username&"*Y"&$startShipName&"*Y"
					pause
				:GameClosed
					killalltriggers
					DISCONNECT
					setDelayTrigger  WhistleWhileYouWork	:WhistleWhileYouWork 1000
					pause
				:WhistleWhileYouWork
					goto :tryAgainNewGameDay1
				:Damn_Planet
					send ".*  Q  "
					pause
				:Phew
					killalltriggers
					if (($isCEO = TRUE) AND ($CorpName <> "") AND ($CorpPassword <> ""))
						setTextLineTrigger alreadyCorped :alreadyCorped "You may only be on one Corp at a time."
						setTextTrigger continueCorpCreation :continueCorpCreation "<Create New Corporation>"
						send "*TM"
						waitfor "Enter Corp name"
						pause
						:continueCorpCreation
							killalltriggers
							send $CorpName "*Y" $CorpPassword "*Y*CN24" $subspace "* Q Q Q ZN* ^Q"
					elseif (($isCEO = FALSE) AND ($CorpName <> "") AND ($CorpPassword <> ""))
						:checkForCorp
							send "*TD"
							gosub :quikstats
							setTextLineTrigger thereIsMyCorp :thereIsMyCorp "    "&$corpName
							setTextTrigger noCorpThatName :noCorpThatName "Corporate command ["
							send "L"
							pause
						:noCorpThatName
							killalltriggers
							echo "Waiting 5 seconds to check for corp again, press [Spacebar] to cancel.*"
							setDelayTrigger waitingForCorp :checkForCorp 5000
							setTextOutTrigger cancelWaitingForCorp :alreadyCorped #32
							pause
						:thereIsMyCorp
							killalltriggers
							getWord CURRENTLINE $corpNumber 1
						:continueCorpCreation
							killalltriggers
							send "J" $CorpNumber "*" $CorpPassword "* * *CN24" $subspace "* Q Q Q ZN* ^Q"
					else
						:alreadyCorped
							killalltriggers
							send "* * *CN24"&$subspace&"*Q Q Q ZN* ^Q"
					end
					setTextLineTrigger		AllDone		:AllDone ": ENDINTERROG"
					pause
				:AllDone
					killalltriggers
			else
				:tryAgainSD
					gosub :do_relog
					setTextLineTrigger	GameClosed1	:GameClosedSD		"I'm sorry, but this is a closed game."
					setTextLineTrigger	GameClosed2	:GameClosedSD		"www.tradewars.com                                   Epic Interactive Strategy"
    					setTextLineTrigger	Damn_Planet	:Damn_PlanetSD		"What do you want to name your home planet?"
					setTextTrigger		Phew		:PhewSD			"Command [TL"
					send "T***"&$password&"*         * *"&$startShipName&"*Y "
					pause
				:GameClosedSD
					killalltriggers
					DISCONNECT
					setDelayTrigger  WhistleWhileYouWorkSD	:WhistleWhileYouWorkSD 1000
					pause
				:WhistleWhileYouWorkSD
					goto :tryAgainSD
				:Damn_PlanetSD
					send ".*  Q  "
					pause
				:PhewSD
					killalltriggers
			end
			goto :donePreGame
		else
			goto :getStartGameInput
		end
		gosub :pregameStats
		goto :pregameMenu
:donePreGame
        echo #27 "[30D                        " #27 "[30D"
	if (($mowToDock) OR ($mowToRylos) OR ($mowToAlpha) OR ($mowToOther))
		if ((STARDOCK = "0") OR (STARDOCK = ""))
			send "v"
			waitOn "-=-=-=-  Current "
		end
		if ((STARDOCK = "0") OR (STARDOCK = ""))
			send "'{" $bot_name "} - Stardock appears to be hidden in this game. Aborting mow.*"
		else
			setVar $user_command_line "mow "&$mowDestination&" 1 p"
			setVar $parm1 $mowDestination
			setVar $parm2 1
			gosub :do_mow
		end
	else
		setTextTrigger		landed		:landed_on_terra	"Do you wish to (L)eave or (T)ake Colonists?"
		setDelayTrigger 	landing_timeout :landing_timeout	 5000
		send "l "
		pause
		:landing_timeout
			send "'{" $bot_name "} - Could not land on Terra!  Probably not in sector 1.*"
			goto :done_landing_terra
		:landed_on_terra
			send "'{" $bot_name "} - Safely on Terra.*"
		:done_landing_terra
	end
        goto :getInitial_Settings
return
:pregameStats
	saveVar $password
	saveVar $bot_name
	saveVar $startShipName
	saveVar $mowToDock
	saveVar $mowToDockBackdoor
	saveVar $startGameDelay
	saveVar $isCEO
	saveVar $corpName
	saveVar $subspace
	saveVar $corpPassword
	saveVar $username
	saveVar $letter
	saveVar $newGameDay1
	saveVar $newGameOlder
return
:menuSpacing
	setArray $qss_var 100
	setVar $qss_ss 0
	setVar $qss_count 1
	setVar $spc " "
	setVar $overall 15
	while ($qss_count <= $qss_total)
		setVar $spc_count 1
		setVar $checkLength $h[$qss_count]&""&$qss[$qss_count]
		setVar $qss_var[$qss_count] ANSI_15&$h[$qss_count]&" "&ANSI_14&$qss[$qss_count]&ANSI_7
		getLength $checkLength $length
		setVar $space 34
		subtract $space $length
		while ($spc_count <= $space)
			mergeText $qss_var[$qss_count] $spc $qss_var[$qss_count]
			add $spc_count 1
		end
		add $qss_count 1
	end
return
# ========================== END PREGAME MENU =========================================
:doSplashScreen
	setDelayTrigger		DRAW_DELAY_01298A	:DRAW_DELAY_01298A 300
	pause
	:DRAW_DELAY_01298A
#	SetVar $_SPLASH_ "[2J[0m*[5C[1;30m�[0m[18C[1;30m�[0m[1;30m   ��[0m[5C[1;30m��[0m[6C[31m   [37m[15C[31m   [37m *[A[40C[31m   [37m[13C[1;30m�[0m*[1;30m  [0;31m��[1;30m��[0m[3C[31m��[1;30m�[0m [31m [37m  *[A[16C[1;30m        [0m[12C[31m [1;30m��[0;31m  [1;30m��[0m* [34m [31m����[1;30m�[0;31m����[1;30m�[0m [31m [37m [1;30m  *[A[19C[0m  [1;30m�[0m[13C[31m ��[1;30m�[0;31m ��[1;30m�[0m* [34m [31m���������[1;30m�[0m [31m [1;30m��  [0m[11C[1;30m��[0m[3C*[A[34C[31m ��[1;30m�[0m  [31m ��[1;30m�[0m[3C[1;30m�[0m[4C*[A[52C[1;30m �[0m[3C[1;30m�����[0m[3C[1;30m��[0m*[1;30m [0;34m [31m��[1;30m�[0;31m���[1;30m�[0;31m��[1;30m�[0m *[A[13C[31m��[1;30m�[0;31m [37m[11C[31m��[1;30m�[0m[3C[31m��*[A[36C[1;30m�[0m[4C[31m ��[1;30m�[0;31m �[1;30m�[0m[4C[31m�*[A[53C[1;30m�[0;31m [37m [31m�����[1;30m��[0m [31m��[1;30m���*[A[69C���[0m* [34m [31m��[1;30m�[0;34m [31m�[1;30m� [0;31m��[1;30m�[0m *[A[13C[31m [1;30m��[0m [31m [1;30m�����[0m[3C[1;30m��[0;31m�*[A[29C�[1;30m�[0m[3C[31m��[1;30m�[0m[4C[31m ��[1;30m�[0;31m *[A[46C��[1;30m�[0m  [31m��[1;30m�[0m [31m��[1;30m����[0;31m�*[A[62C[1;30m�[0m [31m�������[1;30m�[0m* [1;30m [0;31m��[1;30m�[0m[4C[31m��[1;30m�[0m [31m��[1;30m� *[A[17C[0;31m�����[1;30m��[0m [31m�����[1;30m�[0m[3C[31m��*[A[36C[1;30m��[0m[3C[31m ��[1;30m�[0m [31m��[1;30m�[0m  *"
#	SetVar $_SPLASH_ $_SPLASH_ & "[A[51C[31m��[1;30m�[0m [31m�������[1;30m�[0m [31m���[1;30m�*[A[68C[0m [31m��[1;30m�[0m* [34m [31m��[1;30m�[0m[4C[31m��[1;30m�[0m [31m��[1;30m� *[A[17C[0;31m��[37m  [31m��[1;30m�[0m [31m�[1;30m� [0;31m��*[A[30C[1;30m�[0m[4C[31m��[1;30m��[0m [31m ��[1;30m�[0m[3C*[A[47C[31m��[1;30m�[0;31m��[1;30m�[0m  [31m�[1;30m������*[A[62C[0;31m [37m [31m��[1;30m�[0m* [34m [31m��[1;30m�[0m[4C[31m��[1;30m�[0m [31m��[1;30m� *[A[17C[0;31m��[1;30m  [0;31m��[1;30m�[0m [31m�����[1;30m�[0m[5C*[A[36C[31m��[1;30m�[0;31m ��[1;30m� [0m[4C[31m���[1;30m�[0m[3C*[A[55C[31m �����[1;30m�[0m  [31m��[1;30m�[0m*[27C[31m      [37m[27C[31m [37m*[6C[1;30m  [0m[4C[1;30m��[0m  [1;30m�[0m  [1;30m��[0m*[6C[1;30m  [0m[3C[31m��[1;30m�[0m[4C[31m��[1;30m�[0m[11C*[A[32C[1;30m�[0m[23C[1;30m�[0m*  [1;30m�[0m[3C[1;30m  [0m[3C[31m����[1;30m�[0;31m����[1;30m�[0m*[7C[1;30m  [0m  [31m���������[1;30m�[0m[5C[1;30m ��[0m[3C*[A[32C[1;30m ��[0m[5C[1;30m ��[0m[5C[1;30m�����[0m[3C[1;30m*[A[56C��[0m*[6C[1;30m  [0m[3C[31m��[1;30m�[0;31m���[1;30m�[0;31m��[1;30m�*[A[21C[0m  [1;30m ��[0;31m��[1;30m�[0m [31m [1;30m�[0;31m��*[A[34C[1;30m���[0m  [1;30m�[0;31m��[1;30m���[0m  [31m�����*[A[52C[1;30m��[0m [31m��[1;30m������[0m*[5C[1;30m  [0m[4C[31m��[1;30m�[0m [31m�[1;30m�[0m [31m��*[A[20C[1;30m�[0m  [31m�����[1;30m�[0m [31m������[1;30m�[0m *[A[38C[31m������[1;30m�[0m [31m��[1;30m����[0;31m�[1;30m�[0m *[A[55C[31m�������[1;30m�[0m[4C[1;30m�[0m*[5C[1;30m �[0m[4C[31m��[1;30m�[0m[4C[31m��[1;30m�[0m [31m��*[A[24C[1;30m�[0;31m ��[1;30m�[0m[3C[31m��[1;30m�[0m[5C[31m�*[A[41C�[1;30m�[0m[3C[31m�������[1;30m�[0m [31m���[1;30m�[0m *[A[60C[31m��[1;30m�[0m*[4C[1;30m  [0m[5C[31m��[1;30m�[0m[4C[31m��[1;30m�[0m [31m��*[A[24C[1;30m��[0;31m��[1;30m�[0m[3C[31m��[1;30m�[0m [1;30m�[0m[3C*[A[40C[31m��[1;30m�[0m[3C[31m�[1;30m������ [0m [31m��[1;30m�[0m*[3C[1;30m    [0m[4C[31m��[1;30m�[0m[4C[31m��[1;30m�[0m  *[A[23C[31m�����[1;30m�[0m[3C[31m��[1;30m�[0m[5C[31m��[1;30m*[A[42C�[0m[4C[31m�����[1;30m� [0m [31m��[1;30m�[0m**[26C[1;30m������[0m[5C[1;30m����[0m[4C[1;30m��������[0m*[25C[31m������[1;30m��[0m  [1;30m [0;31m����[1;30m��[0m  [31m�*[A[45C�������[1;30m�[0m*[3C[1;30m�[0m[21C[31m��[1;30m�[0m  [31m��[1;30m�[0m  [31m��*[A[37C[1;30m��[0;31m��[1;30m��[0m [31m   ��[1;30m�[0;31m  [37m*[20C[1;30m�[0m[4C[31m��[1;30m��[0;31m���[1;30m�[0m [31;47m��[40m*[A[36C[1;30m�[0;31m [37m  [31m��[1;30m�[0m[4C[31m��[1;30m�[0m*[25C[31m������[1;30m��[0m [31;47m��[1;30;40m�[0m[3C[31m��*[A[42C[1;30m�[0m[4C[31m��[1;30m�[0m*[25C[31m��[1;30m�[0;31m  ��[1;30m�[0m [31;47m��[1;30;40m�[0m[3C*[A[40C[31m��[1;30m�[0m[4C[31m��[1;30m�[0m*[25C[31m��[1;30m��[0;31m���[1;30m�[0m [31m [47m�[40m�[1;30m��*[A[39C[0;31m��[1;30m�[0m[5C[31m��[1;30m�[0m*[15C[1;30m�[0m[9C[31m������[1;30m�[0m[3C[31m ����[1;30m�[0m[6C*[A[47C[31m��[1;30m�[0m[13C[1;30m�[0m*[25C[31m      [37m*[12C[1;33mCreated by: The Bounty Hunter, Mind Dagger, and Lonestar[0m*[1;33m                    Testing by: Misbehavin and DaCreeper[0m*"
#	echo $_SPLASH_ & "**" & ANSI_14 "Version: " ANSI_15 $major_version "." $minor_version "*"
#	echo $_SPLASH_ & "**" & ANSI_14 "Version: " ANSI_15 $major_version "." $minor_version "*"
	send "'*M()MBot " $major_version "." $minor_version " - Unofficial*"
	send " *"
	send "Original Authors*"
	send "            - Mind Dagger / The Bounty Hunter / Lonestar*"
	send "Credits Go Out To*"
	send "            - Oz, Zentock, SupG, Dynarri, Cherokee, Alexio, Xide*"
	send "            - Phx, Rincrast, Voltron, Traitor, Parrothead*"
	send "Current Version Modified for TWGS 1.03 & 2.19+*"
	send "            - T0yman, Xanos**"
	setVar $_SPLASH_ " "
return
#####========================================== END BOT INTERNAL MENUS SECTION ========================================#####
:load_bot
#####=============================================== BOT STARTUP FUNCTIONS ============================================#####
setVar $major_version	"3"
setVar $minor_version	"1044-Unofficial"

gosub :doSplashScreen
	fileExists $exists1 "__MOMBot_Hotkeys.cfg"
	fileExists $exists2 "__MOMBot_custom_keys.cfg"
	fileExists $exists3 "__MOMBot_custom_commands.cfg"
	if ($exists1 AND $exists2 AND $exists3)
		readToArray "__MOMBot_Hotkeys.cfg" $hotkeys
		readToArray "__MOMBot_custom_keys.cfg" $custom_keys
		readToArray "__MOMBot_custom_commands.cfg" $custom_commands
	end
	if (($exists1 = FALSE) OR ($exists2 = FALSE) OR ($exists3 = FALSE) OR ($hotkeys <> "255") OR ($custom_keys <> "33") OR ($custom_commands <> "33"))
		delete "__MOMBot_Hotkeys.cfg"
		delete "__MOMBot_custom_keys.cfg"
		delete "__MOMBot_custom_commands.cfg"
		setArray $hotkeys 255
		setArray $custom_keys 33
		setArray $custom_commands 33
		setVar $hotkeys[76] 9
		setVar $hotkeys[108] 9
		setVar $hotkeys[102] 14
		setVar $hotkeys[70] 14
		setVar $hotkeys[109] 13
		setVar $hotkeys[77] 13
		setVar $hotkeys[104] 5
		setVar $hotkeys[72] 5
		setVar $hotkeys[107] 1
		setVar $hotkeys[75] 1
		setVar $hotkeys[99] 2
		setVar $hotkeys[67] 2
		setVar $hotkeys[98] 17
		setVar $hotkeys[66] 17
		setVar $hotkeys[112] 7
		setVar $hotkeys[80] 7
		setVar $hotkeys[100] 11
		setVar $hotkeys[68] 11
		setVar $hotkeys[116] 6
		setVar $hotkeys[84] 6
		setVar $hotkeys[114] 3
		setVar $hotkeys[82] 3
		setVar $hotkeys[115] 4
		setVar $hotkeys[83] 4
		setVar $hotkeys[120] 12
		setVar $hotkeys[88] 12
		setVar $hotkeys[122] 15
		setVar $hotkeys[90] 15
		setVar $hotkeys[126] 16
		setVar $hotkeys[113] 8
		setVar $hotkeys[81] 8
		setVar $hotkeys[9] 10
		setVar $custom_keys[1] "K"
		setVar $custom_keys[2] "C"
		setVar $custom_keys[3] "R"
		setVar $custom_keys[4] "S"
		setVar $custom_keys[5] "H"
		setVar $custom_keys[6] "T"
		setVar $custom_keys[7] "P"
		setVar $custom_keys[8] "Q"
		setVar $custom_keys[9] "L"
		setVar $custom_keys[10] #9
		setVar $custom_keys[11] "D"
		setVar $custom_keys[12] "X"
		setVar $custom_keys[13] "M"
		setVar $custom_keys[14] "F"
		setVar $custom_keys[15] "Z"
		setVar $custom_keys[16] "~"
		setVar $custom_keys[17] "B"
		setVar $custom_commands[1] ":autokill"
		setVar $custom_commands[2] ":autocap"
		setVar $custom_commands[3] ":autorefurb"
		setVar $custom_commands[4] ":surround"
		setVar $custom_commands[5] "htorp"
		setVar $custom_commands[6] ":terraKit"
		setVar $custom_commands[7] ":psiMacs"
		setVar $custom_commands[8] ":script_access"
		setVar $custom_commands[9] "hkill"
		setVar $custom_commands[10] ":stopModules"
		setVar $custom_commands[11] ":dockKit"
		setVar $custom_commands[12] "xenter"
		setVar $custom_commands[13] ":mowswitch"
		setVar $custom_commands[14] ":fotonswitch"
		setVar $custom_commands[15] "clear"
		setVar $custom_commands[16] ":preferencesMenu"
		setVar $custom_commands[17] ":dock_shopper"
	end
	setVar $startingLocation ""
	setArray $INTERNALCOMMANDLISTS 7
	setVar $internalCommandLists[1]  " holo dscan stopall listall reset emq bot relog tow mac refresh login logoff xport max topoff nmac unlock land lift twarp bwarp pwarp with dep callin about cn"
	setVar $internalCommandLists[2]  " qset "
	setVar $internalCommandLists[3]  " pe pxex pxe pxed pxel pel pelk pxelk pex ped htorp hkill kill cap "
	setVar $internalCommandLists[4]  " max refurb scrub "
	setVar $internalCommandLists[5]  " surround safemow mow pgrid exit plimp limp climp pmine cmine mine mines clear "
	setVar $internalCommandLists[6]  " rob mega max clearbusts"
	setVar $internalCommandLists[7]  " course qss status overload find bustcount holo dscan pscan disp sector figs limps armids ping plist slist storeship setvar getvar "
	setVar $doubledCommandList       " sec sect secto cn9 maxport logout emx smow q l m t b port x shipstore w d finder f nf fp p de uf nfup fup fde xenter status countbusts countbust "
 	setVar $internalCommandList     $internalCommandLists[1]&$internalCommandLists[2]&$internalCommandLists[3]&$internalCommandLists[4]&$internalCommandLists[5]&$internalCommandLists[6]&$internalCommandLists[7]
	setArray $TYPES 7
	setVar $TYPES[1] "General"
	setVar $TYPES[2] "Defense"
	setVar $TYPES[3] "Offense"
	setVar $TYPES[4] "Resource"
	setVar $TYPES[5] "Grid"
	setVar $TYPES[6] "Cashing"
	setVar $TYPES[7] "Data"
	setArray $CATAGORIES 3
	setVar $CATAGORIES[1] "Modes"
	setVar $CATAGORIES[2] "Commands"
	setVar $CATAGORIES[3] "Daemons"
	setVar $corpyCount 0
	setArray $Corpy 100
# ============================== START BOT VARIABLES ============================
	SetVar $shipStats 		FALSE
	SetVar $gameStats 		FALSE
	SetVar $script_name 		"Mind ()ver Matter Bot "
	SetVar $warn 			"OFF"
	SetVar $mode 			"General"
	SetVar $self_command 		FALSE
	SetVar $OkayToUse               TRUE
	SetVar $TRADER_NAME             ""
	SetArray $PARMS 		8
	Setvar $PARMS 			8
	SetVar $ModuleCategory		""
# ============================== END BOT VARIABLES ============================
# ============================== STANDARD GAME TEXT VARIABLES======================
	setVar $START_FIG_HIT "Deployed Fighters Report Sector "
	setVar $END_FIG_HIT   ":"
	setVar $ALIEN_ANSI    #27 & "[1;36m" & #27 & "["
	setVar $START_FIG_HIT_OWNER ":"
	setVar $END_FIG_HIT_OWNER "'s"
# ================================END STANDARD GAME TEXT VARIABLES=================
# ============================== START FILE VARIABLES ==============================
	setVar $gconfig_file 		"_MOM_" & GAMENAME & ".bot"
	setVar $CK_FIG_FILE 		"_ck_" & GAMENAME & ".figs"
	setVar $FIG_FILE 		"_MOM_" & GAMENAME & ".figs"
	setVar $FIG_COUNT_FILE 		"_MOM_" & GAMENAME & "_Fighter_Count.cnt"
	saveVar $CK_FIG_FILE
	saveVar $FIG_FILE
	saveVar $FIG_COUNT_FILE
	setVar $LIMP_FILE 		"_MOM_" & GAMENAME & ".limps"
	setVar $LIMP_COUNT_FILE 	"_MOM_" & GAMENAME & "_Limpet_Count.cnt"
	saveVar $LIMP_FILE
	saveVar $LIMP_COUNT_FILE
	setVar $ARMID_COUNT_FILE 	"_MOM_" & GAMENAME & "_Armid_Count.cnt"
	setVar $ARMID_FILE 		"_MOM_" & GAMENAME & ".armids"
	saveVar $ARMID_COUNT_FILE
	saveVar $ARMID_FILE
	setVar $GAME_SETTINGS_FILE 	"_MOM_" & GAMENAME & "_Game_Settings.cfg"
	setVar $BOT_USER_FILE 		"_MOM_" & GAMENAME & "_Bot_Users.lst"
	setVar $CAP_FILE		"_MOM_" & GAMENAME & ".ships"
	setVar $SCRIPT_FILE		"_MOM_HOTKEYSCRIPTS.txt"
	setVar $BUST_FILE		"_MOM_" & GAMENAME & "Busts.txt"
	setVar $BOT_FILE		"scripts\__mom_bot"&$major_version&"_"&$minor_version
	setVar $MCIC_FILE  		GAMENAME & ".nego"
	fileExists $test $BOT_FILE
	if ($test)
		setVar $BOT_FILE	"scripts\__mom_bot"&$major_version&"_"&$minor_version
	else
		setVar $BOT_FILE	"scripts\MomBot3\__mom_bot"&$major_version&"_"&$minor_version
	end
	setVar $LAST_LOADED_MODULE 	""
# ============================== END FILE VARIABLES ==============================
# ============================= START PROMPT VARIABLES ===========================
	setArray $history 		100
	setVar $promptOutput 		""
	setVar $charCount 		0
	setVar $historyIndex 		0
	setVar $currentPromptText 	""
	setVar $historyMax 		100
	setVar $historyCount		0
	setVar $charPos 		0
# ============================== END PROMPT VARIABLES ==============================
# ============================== START HAGGLE VARIABLES ============================
	setVar $overhagglemultiple 	147
	setVar $cyclebuffer 		1
	setVar $cyclebufferlimit 	20
# ============================== END HAGGLE VARIABLES ============================
# ============================ START GAME VARIABLES ==========================
	setVar $PORT_PRODUCTION_MAX	0
	setVar $PLAYER_CASH_MAX		999999999
	setVar $CITADEL_CASH_MAX	999999999999999
# ============================ END GAME VARIABLES ==========================
# ============================ START QUIKSTAT VARIABLES ==========================
	setVar $CURRENT_PROMPT 		"Undefined"
	setVar $PSYCHIC_PROBE 		"No"
	setVar $PLANET_SCANNER 		"No"
	setVar $SCAN_TYPE 		"None"
# ============================ END QUIKSTAT VARIABLES ==========================
# ============================ START SECTOR DATA VARIABLES ==========================
	setArray $TRADERS 	200
	setArray $FAKETRADERS 	200
	setArray $shipList 	200
	setArray $theShips 	2000
	setVar $ranksLength 	47
	setArray $ranks 	$ranksLength
	setVar $ranks[1] 	"36mCivilian"
	setVar $ranks[2] 	"36mPrivate 1st Class"
	setVar $ranks[3] 	"36mPrivate"
	setVar $ranks[4] 	"36mLance Corporal"
	setVar $ranks[5] 	"36mCorporal"
	setVar $ranks[6] 	"36mStaff Sergeant"
	setVar $ranks[7] 	"36mGunnery Sergeant"
	setVar $ranks[8] 	"36m1st Sergeant"
	setVar $ranks[9] 	"36mSergeant Major"
	setVar $ranks[10]	"36mSergeant"
	setVar $ranks[11] 	"31mAnnoyance"
	setVar $ranks[12] 	"31mNuisance 3rd Class"
	setVar $ranks[13] 	"31mNuisance 2nd Class"
	setVar $ranks[14] 	"31mNuisance 1st Class"
	setVar $ranks[15] 	"31mMenace 3rd Class"
	setVar $ranks[16] 	"31mMenace 2nd Class"
	setVar $ranks[17] 	"31mMenace 1st Class"
	setVar $ranks[18] 	"31mSmuggler 3rd Class"
	setVar $ranks[19] 	"31mSmuggler 2nd Class"
	setVar $ranks[20] 	"31mSmuggler 1st Class"
	setVar $ranks[21] 	"31mSmuggler Savant"
	setVar $ranks[22] 	"31mRobber"
	setVar $ranks[23] 	"31mTerrorist"
	setVar $ranks[24] 	"31mInfamous Pirate"
	setVar $ranks[25] 	"31mNotorious Pirate"
	setVar $ranks[26] 	"31mDread Pirate"
	setVar $ranks[27] 	"31mPirate"
	setVar $ranks[28] 	"31mGalactic Scourge"
	setVar $ranks[29] 	"31mEnemy of the State"
	setVar $ranks[30] 	"31mEnemy of the People"
	setVar $ranks[31] 	"31mEnemy of Humankind"
	setVar $ranks[32] 	"31mHeinous Overlord"
	setVar $ranks[33] 	"31mPrime Evil"
	setVar $ranks[34] 	"36mChief Warrant Officer"
	setVar $ranks[35] 	"36mWarrant Officer"
	setVar $ranks[36] 	"36mEnsign"
	setVar $ranks[37] 	"36mLieutenant J.G."
	setVar $ranks[38] 	"36mLieutenant Commander"
	setVar $ranks[39] 	"36mLieutenant"
	setVar $ranks[40] 	"36mCommander"
	setVar $ranks[41] 	"36mCaptain"
	setVar $ranks[42] 	"36mCommodore"
	setVar $ranks[43] 	"36mRear Admiral"
	setVar $ranks[44] 	"36mVice Admiral"
	setVar $ranks[45] 	"36mFleet Admiral"
	setVar $ranks[46] 	"36mAdmiral"
	setVar $ENDLINE 	"_ENDLINE_"
	setVar $STARTLINE 	"_STARTLINE_"
	setVar $lastTarget 	""
# ============================ END SECTOR DATA VARIABLES ==========================
# ============================ START DOCK SHOPPER VARIABLES ==========================
	setVar $LSD_CURENT_VERSION "4.0"
	setVar $LSD_TagLineB "LSDv" & $LSD_CURENT_VERSION
	setVar $LSD_ShipData_Valid		FALSE
	setVar $LSD_Ships_Names			"][LSD]["
	setVar $LSD_Ships_File 			"LSD_" & GAMENAME & ".ships"
	setVar $LSD_ShipListMax			50
	setVar $LSD_BOTTING			$bot_name
	setVar $LSD__PAD 			"@"
	setArray $LSD_ShipList			$LSD_ShipListMax 3
# ============================ END DOCK SHOPPER VARIABLES ==========================
# =============================== BOT STARTUP =================================
:getInitial_Settings
	gosub :validation
	loadVar $gamestats
	setVar $pgrid_type "Normal"
	setVar $pgrid_end_command " scan "
	getWord CURRENTLINE $startingLocation 1
	fileExists $SCRIPT_FILE_chk $SCRIPT_FILE
	if ($SCRIPT_FILE_chk)
		setArray $HOTKEY_SCRIPTS 10 1
    		setVar $i 1
		setVar $HOTKEY_SCRIPTS 0
    		read $SCRIPT_FILE $line $i
    		while ($line <> "EOF")
			getWord $line $fileLocation 1
			getWordPos $line $pos #34
			if ($pos <= 0)
				echo "Error with script file. either remove " & $SCRIPT_FILE & ", or fix it*"
				halt
			end
			cutText $line $scriptName $pos 9999
			stripText $scriptName #34
      			setVar $HOTKEY_SCRIPTS[$i] $fileLocation
      			setVar $HOTKEY_SCRIPTS[$i][1] $scriptName
			add $i 1
			add $HOTKEY_SCRIPTS 1
      			read $SCRIPT_FILE $line $i
    		end
	else
		setArray $HOTKEY_SCRIPTS 10 2
	end
	fileExists $gfile_chk $gconfig_file
	if ($gfile_chk)
		loadVar $mbbs
		loadVar $steal_factor
		loadVar $rob_factor
		loadVar $ptradesetting
		loadVar $port_max
		loadVar $unlimitedGame
		setVar $doRelog TRUE
		saveVar $doRelog
		read $gconfig_file $bot_name 1
		if ((($startingLocation = "Command") OR ($startingLocation = "Citadel")) AND (CONNECTED = TRUE))
			gosub :quikstats
			if ($gameStats = FALSE)
				gosub :gameStats
			end
			gosub :getInfo
			gosub :getShipStats
			fileExists $CAP_FILE_chk $CAP_FILE
			if ($CAP_FILE_chk)
				gosub :loadshipinfo
			else
				gosub :getShipCapStats
				gosub :loadShipInfo
			end
		else
			fileExists $CAP_FILE_chk $CAP_FILE
			if ($CAP_FILE_chk)
				gosub :loadshipinfo
			end
		end
	else
		:conf_bot
			echo "*{M()M-Bot} . . . Getting Initial Settings . . . "
			echo "*{M()M-Bot} . . . Communications Off . . . **"
			echo ANSI_13 "*Game is not set up for M()M-Bot, doing now . . . *"
			setVar $newPrompt TRUE
			setVar $surroundFigs 1
			saveVar $surroundFigs
			saveVar $newPrompt
			gosub :add_game
			if ((($startingLocation = "Command") OR ($startingLocation = "Citadel")) AND ((CONNECTED = TRUE)))
				gosub :gameStats
				gosub :quikstats
				gosub :getInfo
				fileExists $CAP_FILE_chk $CAP_FILE
				if ($CAP_FILE_chk)
					gosub :loadshipinfo
				else
					gosub :getShipCapStats
					gosub :loadShipInfo
				end
			else
				fileExists $CAP_FILE_chk $CAP_FILE
				if ($CAP_FILE_chk)
					gosub :loadshipinfo
				end
			end
	end
	getSectorParameter 2 "FIG_COUNT" $figCount
	if ($figCount = "")
		setSectorParameter 2 "FIG_COUNT" 0
	end
	loadVar $echoInterval
	if ($echoInterval <= 0)
		setVar $echoInterval 5760
		saveVar $echoInterval
	end
	setVar $botIsOff FALSE
	loadVar $offenseCapping
	loadVar $cappingAliens
	loadVar $PLANET
	loadVar $ATOMIC_COST
	loadVar $BEACON_COST
	loadVar $CORBO_COST
	loadVar $CLOAK_COST
	loadVar $PROBE_COST
	loadVar $PLANET_SCANNER_COST
	loadVar $LIMPET_COST
	loadVar $ARMID_COST
	loadVar $PHOTON_COST
	loadVar $HOLO_COST
	loadVar $DENSITY_COST
	loadVar $DISRUPTOR_COST
	loadVar $GENESIS_COST
	loadVar $TWARPI_COST
	loadVar $TWARPII_COST
	loadVar $PSYCHIC_COST
	loadVar $PHOTONS_ENABLED
	loadVar $PHOTON_DURATION
	loadVar $MAX_COMMANDS
	loadVar $goldEnabled
	loadVar $mbbs
	loadVar $MULTIPLE_PHOTONS
	loadVar $COLONIST_REGEN
	loadVar $PTRADESETTING
	loadVar $steal_factor
	loadVar $rob_factor
	loadVar $CLEAR_BUST_DAYS
	loadVar $port_max
	loadVar $PRODUCTION_RATE
	loadVar $PRODUCTION_REGEN
	loadVar $DEBRIS_LOSS
	loadVar $RADIATION_LIFETIME
	loadVar $LIMPET_REMOVAL_COST
	loadVar $MAX_PLANETS_PER_SECTOR
	loadVar $subspace
	loadVar $password
	loadVar $bot_password
	loadVar $newPrompt
	loadVar $surroundAvoidShieldedOnly
	loadVar $surroundAutoCapture
	loadVar $surroundAvoidAllPlanets
	loadVar $surroundDontAvoid
	loadVar $stardock
	loadVar $backdoor
	loadVar $rylos
	loadVar $alpha_centauri
	loadVar $home_sector
	loadVar $surroundFigs
	loadVar $surroundLimp
	loadVar $surroundMine
        loadVar $surroundOverwrite
        loadVar $surroundPassive
        loadVar $surroundNormal
        loadVar $username
        loadVar $letter
	loadVar $defenderCapping
	loadVar $bot_turn_limit
	loadVar $safe_ship
	loadVar $bot_team_name
	loadVar $historyString
	loadVar $doRelog
	setVar $historyCount 0
	getWordPos $historyString $pos "<<|HS|>>"
	while (($pos > 0) AND ($historyCount < $historyMax))
		cutText $historyString $archive 1 ($pos-1)
		replaceText $historyString $archive&"<<|HS|>>" "" 
		setVar $history[($historyCount+1)] $archive
		add $historyCount 1
		getWordPos $historyString $pos "<<|HS|>>"
	end
	if (($surroundAvoidShieldedOnly = FALSE) AND ($surroundAutoCapture = FALSE) AND ($surroundAvoidAllPlanets = FALSE) AND ($surroundDontAvoid = FALSE))
		setVar $surroundAvoidAllPlanets TRUE
	end
	if ($bot_team_name = 0)
		setVar $bot_team_name "snickerdoodle"
	end
	if ($password = 0)
		setVar $password PASSWORD
	end
	if ($username = 0)
		setVar $username LOGINNAME
	end
	if ($letter = 0)
		setVar $letter GAME
 	end
	if ($stardock <= 0)
		setVar $stardock STARDOCK
		saveVar $stardock
	end
	if ($rylos <= 0)
		setVar $rylos RYLOS
		saveVar $rylos
	end
	if ($alpha_centauri <= 0)
		setVar $alpha_centauri ALPHACENTAURI
		saveVar $alpha_centauri
	end
	if ($ARMID_COST <= 0)
		setVar $ARMID_COST 1000
	end
	if ($LIMPET_COST <= 0)
		setVar $LIMPET_COST 40000
	end
	if ($PHOTON_COST <= 0)
		setVar $PHOTON_COST 100000
	end
:run_bot
	if ((($startingLocation = "Citadel") OR ($startingLocation = "Command")) AND ((CONNECTED = TRUE)))
		gosub :startCNsettings
		gosub :quikstats
		gosub :getInfo
		send "'{" $bot_name "} - is ACTIVE: Version - "&$major_version&"."&$minor_version " - type " #34 $bot_name " help" #34 " for command list*"
		send "'{" $bot_name "} - to login - send a corporate memo*"
		if (($username = "") or ($letter = "") or ($doRelog = FALSE))
			send "'{" $bot_name "} - Auto Relog - Not Active*"
			setVar $doRelog FALSE
		end
	else
		echo "*{" $bot_name "} is ACTIVE: Version - "&$major_version&"."&$minor_version " - type " #34 $bot_name " help" #34 " for command list*"
		if (($username = "") or ($letter = "") or ($doRelog = FALSE))
			echo "{" $bot_name "} - Auto Relog - Not Active*"
			setVar $doRelog FALSE
		end
	end
	saveVar $bot_name
	:initiate_bot
	if (CONNECTED <> TRUE)
		goto :pregameMenuLoad
	end
# ========================================= END START THE BOT SUB ==========================================
#####============================================ END BOT STARTUP FUNCTIONS ===========================================#####
goto :wait_for_command
####################################################### Change Log #####################################################
#MD	10-24-07 - Made pxex type commands more efficient and they now output quasar damage is not using speed variable.  ex. >pxex 122 12 speed
#MD	10-25-07 - Made pgrid more efficient code and made pxex output show pods.
#LS	10-26-07 - Moved entire startup routines to bottom of file, moving everything else closer to top (MD's idea)
#LS 	10-26-07 - Fixed auto login section, password/name/game variables were not being loadvar properly --close to new bot-game file creation.
#MD 	10-28-07 - Fixed qset to work from planet or citadel prompt.
#LS	12-10-07 - Fixed auto Login (new game), some basic bounds checking and such.
####################################################### End Change Log #################################################

##                               CHANGES - Top Line Most Recent Change - CHANGES
#
#	Chaged :relog_attempt routine so that Bot will not land on a planet if at stardock
#	Had to replace the new quikstats, as there was a label conflict. There were two :TWARP labels
#  FEB09: Adjusted the F command to inidacate mined sectors. also adjusted nearest fig path to display left-right
