	loadVar $bot_name
	loadVar $user_command_line
	loadVar $parm1
	loadVar $parm2
	loadVar $parm3
	loadVar $parm4
	loadVar $parm5
	loadVar $parm6
	loadVar $parm7
	loadVar $parm8
	LoadVar $command
	LowerCase $parm1
	if ($parm1 = "help") or ($parm1 = "?")
		send "'*{" $bot_name "} - " & $command & " [on/off] {"&#34&"player name"&#34&"|corp#} *"
		send "     *"
		send "  Citadel Capper captures enemy ships from planet citadel*"
		send "     *"
		send "  - {"&#34&"player name"&#34&"}   = Player to target, name must be surrounded*"
		send "                        by double quotes.*"
		send "  - {corp#}           = Corporation number to target*"
		send "     *"
		Send "This script is a MOM-Bot script edited to work with Z-Bot.*"
		Send "All credit belongs to the original author(s).**"
		halt
	end

	setArray $shipList 	200
	gosub :quikstats
	gosub :getInfo
	setVar $startingLocation $CURRENT_PROMPT
	setVar $targetingPerson FALSE
	setVar $targetingCorp FALSE
	setVar $cappingAliens TRUE
	setVar $target ""
	
	if ($parm1 <> "on") AND ($parm1 <> "off")
        	send "'{" $bot_name "} - Please use - " & $command & " [on/off]*"
		halt
	elseif ($parm1 = "on")
		if ($startingLocation <> "Citadel")
			send "'{" $bot_name "} - Citadel Capper must be run from the Citadel Prompt*"
			setVar $mode "General"
			halt
		end
		isNumber $test $parm2
		if ($test)
			if ($parm2 > 0)
				setVar $targetingCorp TRUE
				setVar $target $parm2
			end
		else
			getWordPos $parm2 $pos #34
			if ($pos > 0)
				setVar $user_command_line $user_command_line&" "
				getText $user_command_line $target " "&#34 #34&" "
				if ($target <> "")
					setVar $targetingPerson TRUE
					stripText $target #34
					lowercase $target
				else
					setVar $targetingPerson FALSE
				end
			end
		end
	ElseIf ($parm1 = "off")
		Send "'CitCap standing down...*"
		Stop "zcitcap"
		Halt
	end
	gosub :quikstats
	if ($CURRENT_PROMPT <> "Citadel")
		send "'{" $bot_name "} - Must start at the citadel prompt*"
		halt
	end
	setVar $CAP_FILE		"_MOM_" & GAMENAME & ".ships"
	fileExists $CAP_FILE_chk $CAP_FILE
	if ($CAP_FILE_chk)
		gosub :loadshipinfo
	else
		gosub :getShipCapStats
		gosub :loadShipInfo
	end 
	setVar $startingLocation $CURRENT_PROMPT
       	setVar $PLANET			0
	setVar $PLANET_FUEL		0
	setVar $PLANET_FUEL_MAX		0
	setVar $PLANET_ORGANICS		0	
	setVar $PLANET_ORGANICS_MAX	0
	setVar $PLANET_EQUIPMENT	0
	setVar $PLANET_EQUIPMENT_MAX	0
	setVar $PLANET_FIGHTERS		0
	setVar $PLANET_FIGHTERS_MAX	0
	setVar $CITADEL			0
	setVar $CITADEL_CREDITS		0
	setVar $ATMOSPHERE_CANNON	0
	setVar $SECTOR_CANNON		0
	setVar $SHIP_OFFENSIVE_ODDS	0
	setVar $SHIP_FIGHTERS_MAX	0
	setVar $SHIP_MAX_ATTACK		0
	setVar $SHIP_MINES_MAX		0
	setVar $CURRENT_PROMPT 		"Undefined"
	setVar $PSYCHIC_PROBE 		"NO"
	setVar $PLANET_SCANNER 		"NO"
	setVar $SCAN_TYPE 		"NONE"
	setVar $CURRENT_SECTOR 		0
	setVar $TURNS 			0
	setVar $CREDITS 		0
	setVar $FIGHTERS 		0
	setVar $SHIELDS 		0
	setVar $TOTAL_HOLDS 		0
	setVar $ORE_HOLDS 		0
	setVar $ORGANIC_HOLDS 		0
	setVar $EQUIPMENT_HOLDS 	0
	setVar $COLONIST_HOLDS		0
	setVar $PHOTONS 		0
	setVar $ARMIDS 			0
	setVar $LIMPETS 		0
	setVar $GENESIS 		0
	setVar $TWARP_TYPE 		0
	setVar $CLOAKS 			0
	setVar $BEACONS 		0
	setVar $ATOMIC 			0
	setVar $CORBO 			0
	setVar $EPROBES 		0
	setVar $MINE_DISRUPTORS 	0
	setVar $ALIGNMENT 		0
	setVar $EXPERIENCE		0
	setVar $CORP 			0
	setVar $SHIP_NUMBER		0
	setVar $TURNS_PER_WARP 		0

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
	setVar $isFound		FALSE
:start_cit_cap
	send "'{" $bot_name "} - Citadel Capper :: Powering Up!*"
:stats_cit_cap
	gosub :getShipStats
:warning_cit_kill
	send "q m * * * "
	gosub :getPlanetInfo
	if ($targetingPerson)
		send "'{" $bot_name "} - Citadel Capper Targeting "&$target&" :: Running on Planet " $PLANET " :: " $PLANET_FIGHTERS " Fighters available on surface.*"
	elseif ($targetingCorp)
		send "'{" $bot_name "} - Citadel Capper Targeting Corp "&$target&" :: Running on Planet " $PLANET " :: " $PLANET_FIGHTERS " Fighters available on surface.*"
	else
		send "'{" $bot_name "} - Citadel Capper :: Running on Planet " $PLANET " :: " $PLANET_FIGHTERS " Fighters available on surface.*"
	end
	send "c "
	goto :scanit_cit_cap


:main
	killalltriggers
	gosub :quikstats
	:CITLOOP
	setTextLineTrigger 	limp 	:scanit_cit_cap 	"Limpet mine in "&$CURRENT_SECTOR
	setTextLineTrigger 	warps 	:scanit_cit_cap 	"warps into the sector."
	setTextLineTrigger 	lifts 	:scanit_cit_cap 	"lifts off from"
	setTextLineTrigger 	deffig 	:scanit_cit_cap 	"Deployed Fighters Report Sector "&$CURRENT_SECTOR
	setTextLineTrigger 	secgun 	:scanit_cit_cap 	"Quasar Cannon on"
	setTextLineTrigger 	ig 	:scanit_cit_cap 	"Shipboard Computers The Interdictor Generator on"
	setTextLineTrigger 	power 	:scanit_cit_cap 	"is powering up weapons systems!"
	setTextLineTrigger 	exits 	:scanit_cit_cap 	"exits the game."
	setTextLineTrigger 	enters 	:scanit_cit_cap 	"enters the game."
	setTextTrigger 		pause1 	:pausing 		"Planet command (?="
	setTextTrigger 		pause2 	:pausing 		"Computer command ["
	setTextTrigger 		pause3 	:pausing 		"Corporate command ["
	setTextOutTrigger   abort      :ABORT "~"
	setTextTrigger       echos      :ECHOS "Citadel command (?=help)"
	pause

:ABORT
	KillAllTriggers
	Send "'CitCap is standing down...*"
	halt
:ECHOS
	KillAllTriggers
	Send #145
	WaitFor #145 & #8
	Echo ANSI_10 & " [" & ANSI_15 & "CITCAP ON" & ANSI_10 & "] " & ANSI_12 "[" & ANSI_14 & "~" & ANSI_12 & "]-" & ANSI_11 & "Quit " & ANSI_5
	Goto :CITLOOP
:pausing
	killAllTriggers
	echo ANSI_6 "*[" ANSI_14 "Citadel Capture paused. To restart, re-enter citadel prompt" ANSI_6 "]*" ANSI_7
	setTextTrigger restart :restarting "Citadel command ("
	pause
	:restarting
	killAllTriggers
	echo ANSI_6 "*[" ANSI_14 "Citadel Capture restarted" ANSI_6 "]*" ANSI_7
	goto :main




	


:quikstats
	setVar $CURRENT_PROMPT 		"Undefined"
	killtrigger noprompt
	killtrigger prompt1
	killtrigger prompt2
	killtrigger prompt3
	killtrigger prompt4
	killtrigger statlinetrig
	killtrigger getLine2
	setTextTrigger 		prompt1 	:allPrompts 		"(?="
	setTextLineTrigger 	prompt2 	:secondaryPrompts 	"(?)"
	setTextLineTrigger 	statlinetrig 	:statStart 		#179
	setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
	setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
	setDelayTrigger 	noprompt        :doneQuikstats		 30000
	send "^Q/"
	pause
	
	:allPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			setVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt1 :allPrompts "(?="		
		pause
	:secondaryPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			setVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt2 :secondaryPrompts "(?)"		
		pause
	:terraPrompts
		killtrigger prompt3
		killtrigger prompt4
		getWord currentansiline $checkPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			setVar $CURRENT_PROMPT "Terra"
		end
		setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
		setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
		pause
	
	:statStart
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
		killtrigger noprompt
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
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
		killtrigger statlinetrig
		killtrigger getLine2
	
return
# ============================== END QUICKSTATS SUB==============================

:getTraders
	#Reads sector data and searches for real (Player) traders
        getWordPos $sectorData $posTrader "[0m[33mTraders [1m:"
	if ($posTrader > 0)
		getText $sectorData $traderData "[0m[33mTraders [1m:" "[0m[1;32mWarps to Sector(s) [33m:"
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



:getSectorData
	killalltriggers
	send "s* "
	setVar $sectorData ""
	
	:sectorsline_cit_kill
		killTrigger getLine
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
		killalltriggers
		goSub :getTraders
		goSub :getEmptyShips
		goSub :getFakeTraders
return

:fastCapture
	killalltriggers
	setVar $refurbString "l j"&#8&$PLANET&"* m*** "
	setVar $isFound FALSE
	setVar $targetIsAlien FALSE
	setVar $stillShields FALSE
	getWordPos $sectorData $beaconPos "[0m[35mBeacon  [1;33m:"
	:checkingFigs
		if ($FIGHTERS > 0)
			
		else
			gosub :quikstats
			if ($FIGHTERS <= 0)
				echo ANSI_12 "*You have no fighters.*" ANSI_7
				goto :capstoppingPoint
			else
				goto :checkingFigs
			end
		end
		
	if (($realTraderCount > $corpieCount) AND ($onlyAliens <> TRUE))
		if ($startingLocation = "Citadel")
			setVar $targetString "q a "
		else
			setVar $targetString "a "
		end
		if ((($CURRENT_SECTOR > 10) AND ($CURRENT_SECTOR <> STARDOCK)) AND ($beaconPos > 0))
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
		if ($startingLocation = "Citadel")
			setVar $targetString  "q a "
		else
			setVar $targetString  "a "
		end
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
		if ($startingLocation = "Citadel")
			setVar $targetString  "q a "
		else
			setVar $targetString  "a "
		end
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
		echo ANSI_12 "*You have no targets.*" ANSI_7
		goto :capstoppingPoint
	else
		if ($startingLocation = "Citadel")
			send "q "
		end
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
			setVar $PLANET_FIGHTERS $PLANET_FIGHTERS + $FIGHTERS
		while ($PLANET_FIGHTERS > 0)
			setVar $isSameTarget FALSE
			:cgoahead
			killalltriggers
			send $targetString
			setTextTrigger	foundcaptarget  :foundcaptarget	 "(Y/N) [N]? Y"
			setTextLineTrigger noctarget	:nocappingtargets "Do you want instructions (Y/N) [N]?"
			pause
			:foundcaptarget
			killalltriggers
			setVar $cap_ship_info CURRENTLINE
			setVar $thisTarget CURRENTANSILINE
			getWord $cap_ship_info $attack_prompt 1
			if ($attack_prompt <> "Attack")
				goto :main
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
					if ($is_ship > 0)
						getWord $ship[$shipList[$type_count]] $shields 1
						getWord $ship[$shipList[$type_count]] $defodds 2
						goto :send_attack
					end
				end
				clientMessage "Unknown ship type, cannot calculate attack, you must do it manually"
				send "* "
				goto :nocappingtargets
				return
				

			#how many fighters do they have
			:send_attack
				getText $cap_ship_info $ship_fighters $shipList[$type_count] "(Y/N)"
				getText $ship_fighters $ship_fighters "-" ")"
				stripText $ship_fighters ","
				setVar $ship_shield_percent 0
				setVar $shieldpoints 0
				#how many shields do they have
				setTextLineTrigger combat :combat_scan "Combat scanners show enemy shields at"
				setTextTrigger nocombat :cap_it "How many fighters do you wish to use"
				setTextLineTrigger notarget :nocappingtargets "Do you want instructions (Y/N) [N]?"
				pause

			:combat_scan
				getWord CURRENTLINE $shieldperc 7
				stripText $shieldperc "%"
				setVar $shieldPoints (($shields * $shieldperc) / 100)
				pause

			#calculate and attack
			:cap_it
				killalltriggers
				# combat
				getWord CURRENTLINE $max_figs 11
				stripText $max_figs ","
				stripText $max_figs ")"
				setVar $cap_points 0
				add $cap_points $shieldPoints
				add $cap_points $ship_fighters
				multiply $cap_points $defodds
				setVar $cap_points ((($shieldPoints + $ship_fighters) * $defodds) / $own_odds)
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
				setVar $PLANET_FIGHTERS ($PLANET_FIGHTERS-$cap_points)
		:keepcapping
			killalltriggers
			
		end
	
	end
	goto :capStoppingPoint
:nocappingtargets
	killalltriggers
	send "* "
	if (($startingLocation = "Citadel") AND ($isFound))
		send $refurbString
	end	
:capStoppingPoint
	killalltriggers
	if (($startingLocation = "Citadel") AND ($isFound))
		send " c "
	end
return

:getShipStats
	send "c;q"
	setTextLineTrigger	getshipoffense		:shipoffenseodds	"Offensive Odds: "
	setTextLineTrigger	getshipfighters 	:shipmaxfigsperattack	" TransWarp Drive:   "
	setTextLineTrigger	getshipmines 		:shipmaxmines		" Mine Max:  "
	pause
	
	:shipoffenseodds
		getWordPos CURRENTANSILINE $pos "[0;31m:[1;36m1"
		if ($pos > 0)
			getText CURRENTANSILINE $SHIP_OFFENSIVE_ODDS "Offensive Odds[1;33m:[36m " "[0;31m:[1;36m1"
			stripText $SHIP_OFFENSIVE_ODDS "."
			stripText $SHIP_OFFENSIVE_ODDS " "
			gettext CURRENTANSILINE $SHIP_FIGHTERS_MAX "Max Fighters[1;33m:[36m" "[0;32m Offensive Odds"
			stripText $SHIP_FIGHTERS_MAX ","
			stripText $SHIP_FIGHTERS_MAX " "
		end
		pause
	:shipmaxmines
		getText CURRENTLINE $SHIP_MINES_MAX "Mine Max:" "Beacon Max:"
		stripText $SHIP_MINES_MAX " "
		pause
	
	:shipmaxfigsperattack
		getWordPos CURRENTANSILINE $pos "[0m[32m Max Figs Per Attack[1;33m:[36m"
		if ($pos > 0)
			getText CURRENTANSILINE $SHIP_MAX_ATTACK "[0m[32m Max Figs Per Attack[1;33m:[36m" "[0;32mTransWarp"
			striptext $SHIP_MAX_ATTACK " "
		end	
return

# ==============================  START PLANET INFO SUBROUTINE  =================
:getPlanetInfo
	send "*"
	setTextLineTrigger planetInfo :planetInfo "Planet #"
	pause

	:planetinfo
		killalltriggers
		setVar $CITADEL 0
		setVar $SECTOR_CANNON 0
		setVar $ATMOSPHERE_CANNON 0
		setVar $CITADEL_CREDITS 0
		getWord CURRENTLINE $PLANET 2
		stripText $PLANET "#"
		getWord CURRENTLINE $current_sector 5
		stripText $current_sector ":"
		waitfor "2 Build 1   Product    Amount     Amount     Maximum"

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

:scanit_cit_cap
	killalltriggers
	getWord CURRENTLINE $test 1
	if (($test = "P") OR ($test = "F") OR ($test = "R") OR ($test = ">"))
		echo ANSI_14 "*spoof attempt!*"
		goto :main
	end	
	gosub :checkForCappingVictimsFromCitadel
	echo ansi_12 "*NO Targets*"
	goto :main

:checkForCappingVictimsFromCitadel
	gosub :getSectorData
	goSub :fastCapture
	if ($isFound)
		gosub :quikstats
		goto :checkForCappingVictimsFromCitadel
	end
	
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
		add $shipcounter 1
		goto :readshiplist
	end
	setVar $shipStats TRUE
return
# ============================  START PLAYER INFO SUBROUTINE  =================
:getInfo
	setVar $PHOTONS 0
	setVar $SCAN_TYPE "None"
	setVar $TWARP_TYPE 0
	setVar $corpstring "[0]"
	setVar $igstat 0
	send "I"
	waitOn "<Info>"
	:waitOnInfo
		setTextLineTrigger getTraderName :getTraderName "Trader Name    :"
        	setTextLineTrigger getExpAndAlign :getExpAndAlign "Rank and Exp"
        	setTextLineTrigger getCorp :getCorp "Corp           #"
        	setTextLineTrigger getShipType :getShipType "Ship Info      :"
        	setTextLineTrigger getTPW :getTPW "Turns to Warp  :"
        	setTextLineTrigger getSect :getSect "Current Sector :"
        	setTextLineTrigger getTurns :getTurns "Turns left"
        	setTextLineTrigger getHolds :getHolds "Total Holds"
        	setTextLineTrigger getFighters :getFighters "Fighters       :"
        	setTextLineTrigger getShields :getShields "Shield points  :"
        	setTextLineTrigger getPhotons :getPhotons "Photon Missiles:"
        	setTextLineTrigger getScanType :getScanType "LongRange Scan :"
        	setTextLineTrigger getTwarpType1 :getTwarpType1 "  (Type 1 Jump):"
        	setTextLineTrigger getTwarpType2 :getTwarpType2 "  (Type 2 Jump):"
        	setTextLineTrigger getCredits :getCredits "Credits"
        	setTextLineTrigger checkig :checkig "Interdictor ON :"
		setTextTrigger getInfoDone :getInfoDone "Command [TL="
        	setTextTrigger getInfoDone2 :getInfoDone "Citadel command"
        	pause
	:getTraderName
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
		setVar $item_type "Ore="
		gosub :doGetHoldContents
		setVar $ORE_HOLDS $return
		setVar $item_type "Organics="
		gosub :doGetHoldContents
		setVar $ORGANIC_HOLDS $return
		setVar $item_type "Equipment="
		gosub :doGetHoldContents
		setVar $EQUIPMENT_HOLDS $return
		setVar $item_type "Colonists="
		gosub :doGetHoldContents
		setVar $COLONIST_HOLDS $return
		setVar $item_type "Empty="
		gosub :doGetHoldContents
		setVar $EMPTY_HOLDS $return
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
	        killtrigger getInfoDone
	        killtrigger getInfoDone2
		killtrigger getTraderName
        	killtrigger getExpAndAlign
        	killtrigger getCorp
        	killtrigger getShipType
        	killtrigger getTPW
        	killtrigger getSect
        	killtrigger getTurns
        	killtrigger getHolds
        	killtrigger getFighters
        	killtrigger getShields
        	killtrigger getPhotons
        	killtrigger getScanType
        	killtrigger getTwarpType1
        	killtrigger getTwarpType2
        	killtrigger getCredits
        	killtrigger checkig
return
:doGetHoldContents
	getWordPos $line $textpos $item_type
	if ($textpos <> 0)
	    cutText CURRENTLINE $temp $textpos 100
	    getWord $temp $return 1
	    stripText $return "Ore="
	else
	    setVar $return 0
	end
return
# ZeD Compiled: Sun 16/12/2012 -  1:57:58.44 

