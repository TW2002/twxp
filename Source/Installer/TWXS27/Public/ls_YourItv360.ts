	setVar $Tag_Version			"3.60"
	setVar $TagLine				"'[TAG]"
	setVar $TagLineB			"[TAG]"
	setVar $TagLineC			"'[TAGv" & $Tag_Version & "]"
	setVar $TagLineD			"TAGv" & $Tag_Version
	setVar $maxFigAttack 		9999
	setVar $CorpArraySize		10
    setArray $CorpTargets		$CorpArraySize
    setVar $Trader				""
    setVar $Target_Spam			""
	setVar $KILLKILL			FALSE
	setVar $USE_CIM				TRUE
	setVar $DROP_LIMPS			FALSE
	setVar $DROP_ARMIDS			FALSE
	setVar $LIMPS_To_Drop		3
	setVar $ARMIDS_To_Drop		3
	setVar $MSGS_ON				TRUE
	setVar $SHIP_HAS_IG			FALSE
	setVar $ig_mode 			0
	setVar $surroundFigs 		1
	setVar $fighter_tol			1000

	setVar $i 1
	setVar $ii 0
	while ($i <= SECTORS)
		if (SECTOR.WARPCOUNT[$i] = 0)
			add $ii 1
		end
		add $i 1
	end
	if ($ii = 0)
		#appear to have a perfect MAP, so let's not use the courseplot
		setVar $USE_CIM FALSE
	end

	goto :Starting_POINT

:fastAttack
	setVar $targetString  "a"
	setVar $isFound FALSE
	setVar $Killed FALSE
	getWordPos $sectorData $beaconPos "[0m[35mBeacon  [1;33m:"
	:checkingFigs
		if ($FIGHTERS > 0)
			if ((($CURRENT_SECTOR > 10) AND ($CURRENT_SECTOR <> STARDOCK)) AND ($beaconPos > 0))
				setVar $targetString $targetString & "*"
			end
		else
			gosub :quikstats
			if ($FIGHTERS <= 0)
				echo ANSI_12 & "*You have no fighters.*" & ANSI_7
				return
			else
				goto :checkingFigs
			end
		end
	if (($emptyShipCount + $fakeTraderCount + $realTraderCount) > 0)
		setVar $i 0
		while ($i < ($emptyShipCount + $fakeTraderCount))
			setVar $targetString ($targetString & "* ")
			add $i 1
		end
		setVar $c 1
		while (($c <= $realTraderCount) AND ($isFound = FALSE))

			if (($TRADERS[$c][1]) = ($CORP))
				setVar $targetString $targetString & "* "
			elseif ((($CURRENT_SECTOR <= 10) OR ($CURRENT_SECTOR = STARDOCK)) AND $TRADERS[$c][2] = TRUE)
				setVar $targetString $targetString & "* "
			else
				setVar $isFound TRUE
				setVar $targetString $targetString & "zy z"
			end
			add $c 1
		end
	else
		echo ANSI_12 & "*You have no targets.*" & ANSI_7
		return
	end
	if ($isFound = TRUE)
		setVar $attackString ""
		setVar $i 8
		while ($i > 0)
			setVar $attackString $attackString&$targetString&$maxFigAttack&"99988877766655544332211*"
            setVar $i ($i - 1)
        end
	else
		echo ANSI_12 & "*You have no valid targets.*" & ANSI_7
		setVar $Killed FALSE
		setVar $attackString ""
		return
	end
	send $attackString
	setVar $Killed TRUE
    return

:getSectorData
	killalltriggers
	send "** "
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

:getTraders
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
	getWordPos $sectorData $posShips "[0m[33mShips   [1m:"
	getWordPos $sectorData $posTraders "[0m[33mTraders [1m:"

	if ($posTraders > 0)
		getText $sectorData $fakeData "[1;32mSector  [33m:" "[0m[33mTraders [1m:"
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
			if ((($pos > 0) OR ($pos2 > 0)) AND ($pos3 <= 0))
				add $fakeTraderCount 1
			end
			getText $fakeData $temp $STARTLINE $ENDLINE
		end
	elseif ($posShips > 0)
		getText $sectorData $fakeData "[1;32mSector  [33m:" "[0m[33mShips   [1m:"
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
			getWordPos $temp $pos2 "[33m, [0;32mwith"
			getWordPos $temp $pos3 "[0;35m[[31mOwned by[35m]"
			if ((($pos > 0) OR ($pos2 > 0)) AND ($pos3 <= 0))
				add $fakeTraderCount 1
			end
			getText $fakeData $temp $STARTLINE $ENDLINE
		end
	else
		getText $sectorData $fakeData "[1;32mSector  [33m:" "[0m[1;32mWarps to Sector(s) [33m:"
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
			getWordPos $temp $pos2 "[33m, [0;32mwith"
			getWordPos $temp $pos3 "[0;35m[[31mOwned by[35m]"
			if ((($pos > 0) OR ($pos2 > 0)) AND ($pos3 <= 0))
				add $fakeTraderCount 1
			end
			getText $fakeData $temp $STARTLINE $ENDLINE
		end
	end
    return
:quikstats
	setVar $CURRENT_PROMPT 		"Undefined"
	killtrigger 		noprompt
	killtrigger 		prompt1
	killtrigger 		prompt2
	killtrigger 		prompt3
	killtrigger 		prompt4
	killtrigger			prompt5
	killtrigger 		statlinetrig
	killtrigger 		getLine2
	setTextTrigger 		prompt1 		:allPrompts 		"(?="
	setTextLineTrigger 	prompt2 		:secondaryPrompts 	"(?)"
	setTextLineTrigger 	statlinetrig 	:statStart 			#179
	setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
	setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
	setTextTrigger		prompt5			:portPrompt			"How many holds of"
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
	:portPrompt
		getWord CURRENTANSILINE $checkPrompt 1
		setVar $PORT_PROMPT_TYPE CURRENTLINE
		getWord $PORT_PROMPT_TYPE $tempPrompt 1
		getWordPos $checkPrompt $pos "[35mHow"
		if ($pos > 0)
			setVar $CURRENT_PROMPT "Port"
		end
		setTextTrigger		prompt5			:portPrompt			"How many holds of"
		pause

	:statStart
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
		killtrigger prompt5
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
				getWord $stats $TURNS  				($current_word + 1)
			elseif ($wordy = "Creds")
				getWord $stats $CREDITS  			($current_word + 1)
			elseif ($wordy = "Figs")
				getWord $stats $FIGHTERS   			($current_word + 1)
			elseif ($wordy = "Shlds")
				getWord $stats $SHIELDS  			($current_word + 1)
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
				getWord $stats $PHOTONS   			($current_word + 1)
			elseif ($wordy = "Armd")
				getWord $stats $ARMIDS   			($current_word + 1)
			elseif ($wordy = "Lmpt")
				getWord $stats $LIMPETS   			($current_word + 1)
			elseif ($wordy = "GTorp")
				getWord $stats $GENESIS  			($current_word + 1)
			elseif ($wordy = "TWarp")
				getWord $stats $TWARP_TYPE  		($current_word + 1)
			elseif ($wordy = "Clks")
				getWord $stats $CLOAKS   			($current_word + 1)
			elseif ($wordy = "Beacns")
				getWord $stats $BEACONS 			($current_word + 1)
			elseif ($wordy = "AtmDt")
				getWord $stats $ATOMIC  			($current_word + 1)
			elseif ($wordy = "Corbo")
				getWord $stats $CORBO   			($current_word + 1)
			elseif ($wordy = "EPrb")
				getWord $stats $EPROBES   			($current_word + 1)
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
				getWord $stats $CORP   				($current_word + 1)
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
		killtrigger prompt5
		killtrigger statlinetrig
		killtrigger getLine2

		stripText $CURRENT_PROMPT "<"
		stripText $CURRENT_PROMPT ">"
	return
:Starting_POINT
	gosub :quikstats
	gosub :GobalGrover
	gosub :Good_To_Go

	setvar $fighter_tol ($FIGHTERS / 3)

	gosub :CN_Check

	send "  C ;Q "
	waitFor "Max Fighters:"
	setVar $max_figs CURRENTLINE
	setVar $SHIP_OFFENSIVE_ODDS CURRENTLINE
	replaceText $SHIP_OFFENSIVE_ODDS "Odds:" "@@@@"
	setVar $SHIP_OFFENSIVE_ODDS ($SHIP_OFFENSIVE_ODDS & "^^^^")
	getText $SHIP_OFFENSIVE_ODDS $SHIP_OFFENSIVE_ODDS "@@@@" "^^^^"
	stripText $SHIP_OFFENSIVE_ODDS " "
	stripText $SHIP_OFFENSIVE_ODDS ":1"
	stripText $SHIP_OFFENSIVE_ODDS "."

	replaceText $max_figs ":" " "
	getword $max_figs $max_figs 7
	stripText $max_figs ","
	waitfor "Max Figs Per Attack:"
	getWord CurrentLine $maxFigAttack 5
	stripText $maxFigAttack ","
	isNumber $tst $maxFigAttack
	if ($tst = 0)
		setVar $maxFigAttack 9999
	end

	setVar $ig_mode 3
	gosub :Toggel_IG
    gosub :SET_MINE_DROP

	send ($TagLineC & " Loading...*")
	waitfor "Message sent on sub-space channel"

	gosub :MSGS_OFF

	:Loop_D_Lou
		if ($MSGS_ON)
			gosub :Status_MSG
		end
	:Loop_D_Lou_2
		killAllTriggers
   		setVar $Limp_Hit FALSE
		setVar $Prompt ("*"&#27&"[1A"&#27&"[2K")

		# Determine if in Kill Mode
		if ($KILLKILL)
			setVar $Prompt ($Prompt & ANSI_10&"**[" & #27 & "[0m" & #27 & "[44m" & "K" & #27 & "[0m" & #27 & "[44m" & ANSI_15 & "ILL"& #27 & "[0m"&ANSI_14 &"]")
		else
			setVar $Prompt ($Prompt & ANSI_10&"**["&ANSI_15&"K"&ANSI_8&"ILL"&ANSI_14&"]")
		end

		if ($DROP_LIMPS)
			setVar $Prompt ($Prompt & ANSI_10&"[" & #27 & "[0m" & #27 & "[44m" & "L" & #27 & "[0m" & #27 & "[44m" & ANSI_15 & "IMP"& #27 & "[0m"&ANSI_14 &"]")
		else
			setVar $Prompt ($Prompt & ANSI_10&"["&ANSI_15&"L"&ANSI_8&"IMP"&ANSI_14&"]")
		end
		if ($DROP_ARMIDS)
			setVar $Prompt ($Prompt & ANSI_10&"[" & #27 & "[0m" & #27 & "[44m" & "A" & #27 & "[0m" & #27 & "[44m" & ANSI_15 & "RMID"& #27 & "[0m"&ANSI_14 &"]")
		else
			setVar $Prompt ($Prompt & ANSI_10&"["&ANSI_15&"A"&ANSI_8&"RMID"&ANSI_14&"]")
		end

		setVar $Prompt ($Prompt & "["&ANSI_15&"E"&ANSI_8&"/ENTER"&ANSI_14&"]["&ANSI_15&"S"&ANSI_8&"AVEME"&ANSI_14&"]["&ANSI_15&"H"&ANSI_8&"OLO"&ANSI_14&"]["&ANSI_15&"C"&ANSI_8&"LEAR"&ANSI_14&"]")

		if ($Target_Spam <> "")
			setVar $Prompt ($Prompt & "["&ANSI_15&"T"&ANSI_8&"ARGETING "&ANSI_4&$Target_Spam&ANSI_14&"]*")
			if ($MSGS_ON)
				setVar $Prompt ($Prompt & "["&ANSI_15&"P"&ANSI_8&"AUSE"&ANSI_14&"]["&ANSI_15&"M"&ANSI_8&"OW"&ANSI_14&"]")
				if ($SHIP_HAS_IG)
					if ($ig_mode = 1)
						setVar $Prompt ($Prompt & "[" & #27 & "[0m" & #27 & "[44m" & "I" & #27 & "[0m" & #27 & "[44m" & ANSI_15 & "G"& #27 & "[0m"&ANSI_14&"]["&ANSI_8&"S"&ANSI_15&"U"&ANSI_8&"RROUND"&ANSI_14&"]["&ANSI_15&"#"&ANSI_14&"]["&ANSI_15&"Q"&ANSI_8&"UIT"&ANSI_14&"]")
					else
						setVar $Prompt ($Prompt & "["&ANSI_15&"I"&ANSI_8&"G"&ANSI_14&"]["&ANSI_8&"S"&ANSI_15&"U"&ANSI_8&"RROUND"&ANSI_14&"]["&ANSI_15&"#"&ANSI_14&"]["&ANSI_15&"Q"&ANSI_8&"UIT"&ANSI_14&"]")
					end
				else
					setVar $Prompt ($Prompt & "["&ANSI_8&"S"&ANSI_15&"U"&ANSI_8&"RROUND"&ANSI_14&"]["&ANSI_15&"#"&ANSI_14&"]["&ANSI_15&"Q"&ANSI_8&"UIT"&ANSI_14&"]")
				end
			else
				setVar $Prompt ($Prompt & "["&ANSI_15&"G"&ANSI_8&"O"&ANSI_14&"]["&ANSI_15&"M"&ANSI_8&"OW"&ANSI_14&"]")
				if ($SHIP_HAS_IG)
					if ($ig_mode = 1)
						setVar $Prompt ($Prompt & "[" & #27 & "[0m" & #27 & "[44m" & "I" & #27 & "[0m" & #27 & "[44m" & ANSI_15 & "G"& #27 & "[0m"&ANSI_14&"]["&ANSI_8&"S"&ANSI_15&"U"&ANSI_8&"RROUND"&ANSI_14&"]["&ANSI_15&"#"&ANSI_14&"]["&ANSI_15&"Q"&ANSI_8&"UIT"&ANSI_14&"]")
					else
						setVar $Prompt ($Prompt & "["&ANSI_15&"I"&ANSI_8&"G"&ANSI_14&"]["&ANSI_8&"S"&ANSI_15&"U"&ANSI_8&"RROUND"&ANSI_14&"]["&ANSI_15&"#"&ANSI_14&"]["&ANSI_15&"Q"&ANSI_8&"UIT"&ANSI_14&"]")
					end
				else
					setVar $Prompt ($Prompt & "["&ANSI_8&"S"&ANSI_15&"U"&ANSI_8&"RROUND"&ANSI_14&"]["&ANSI_15&"#"&ANSI_14&"]["&ANSI_15&"Q"&ANSI_8&"UIT"&ANSI_14&"]")
				end
			end
		else
			setVar $Prompt ($Prompt & "["&ANSI_15&"T"&ANSI_8&"ARGETING"&ANSI_14&"]*")
			if ($MSGS_ON)
				setVar $Prompt ($Prompt & "["&ANSI_15&"P"&ANSI_8&"AUSE"&ANSI_14&"]["&ANSI_15&"M"&ANSI_8&"OW"&ANSI_14&"]")
				if ($USE_CIM)
					setVar $Prompt ($Prompt & "["& #27 & "[0m" & #27 & "[44m" & ANSI_15 &"PL" & #27 & "[0m" & #27 & "[44m" & "O" & #27 & "[0m" & #27 & "[44m" & ANSI_15 & "T"& #27 & "[0m"&ANSI_14&"]")
				else
					setVar $Prompt ($Prompt & "["&ANSI_8&"PL"&ANSI_15&"O"&ANSI_8&"T"&ANSI_14&"]")
				end

				if ($SHIP_HAS_IG)
					if ($ig_mode = 1)
						setVar $Prompt ($Prompt & "[" & #27 & "[0m" & #27 & "[44m" & "I" & #27 & "[0m" & #27 & "[44m" & ANSI_15 & "G"& #27 & "[0m"&ANSI_14&"]["&ANSI_8&"S"&ANSI_15&"U"&ANSI_8&"RROUND"&ANSI_14&"]["&ANSI_15&"#"&ANSI_14&"]["&ANSI_15&"Q"&ANSI_8&"UIT"&ANSI_14&"]")
        			else
						setVar $Prompt ($Prompt & "["&ANSI_15&"I"&ANSI_8&"G"&ANSI_14&"]["&ANSI_8&"S"&ANSI_15&"U"&ANSI_8&"RROUND"&ANSI_14&"]["&ANSI_15&"#"&ANSI_14&"]["&ANSI_15&"Q"&ANSI_8&"UIT"&ANSI_14&"]")
					end
				else
					setVar $Prompt ($Prompt & "["&ANSI_8&"S"&ANSI_15&"U"&ANSI_8&"RROUND"&ANSI_14&"]["&ANSI_15&"#"&ANSI_14&"]["&ANSI_15&"Q"&ANSI_8&"UIT"&ANSI_14&"]")
				end
			else
				setVar $Prompt ($Prompt & "["&ANSI_15&"G"&ANSI_8&"O"&ANSI_14&"]["&ANSI_15&"M"&ANSI_8&"OW"&ANSI_14&"]")
				if ($USE_CIM)
					setVar $Prompt ($Prompt & "["& #27 & "[0m" & #27 & "[44m" & ANSI_15 &"PL" & #27 & "[0m" & #27 & "[44m" & "O" & #27 & "[0m" & #27 & "[44m" & ANSI_15 & "T"& #27 & "[0m"&ANSI_14&"]")
				else
					setVar $Prompt ($Prompt & "["&ANSI_8&"PL"&ANSI_15&"O"&ANSI_8&"T"&ANSI_14&"]")
				end

				if ($SHIP_HAS_IG)
					if ($ig_mode = 1)
						setVar $Prompt ($Prompt & "[" & #27 & "[0m" & #27 & "[44m" & "I" & #27 & "[0m" & #27 & "[44m" & ANSI_15 & "G"& #27 & "[0m"&ANSI_14&"]["&ANSI_8&"S"&ANSI_15&"U"&ANSI_8&"RROUND"&ANSI_14&"]["&ANSI_15&"#"&ANSI_14&"]["&ANSI_15&"Q"&ANSI_8&"UIT"&ANSI_14&"]")
					else
						setVar $Prompt ($Prompt & "["&ANSI_15&"I"&ANSI_8&"G"&ANSI_14&"]["&ANSI_8&"S"&ANSI_15&"U"&ANSI_8&"RROUND"&ANSI_14&"]["&ANSI_15&"#"&ANSI_14&"]["&ANSI_15&"Q"&ANSI_8&"UIT"&ANSI_14&"]")
					end
				else
					setVar $Prompt ($Prompt & "["&ANSI_8&"S"&ANSI_15&"U"&ANSI_8&"RROUND"&ANSI_14&"]["&ANSI_15&"#"&ANSI_14&"]["&ANSI_15&"Q"&ANSI_8&"UIT"&ANSI_14&"]")
				end
			end
		end

        setVar $Prompt ($Prompt & ANSI_15 & "?")

		if ($CorpCNT <> 0)
            setVar $i 1
            while ($i <= $CorpCNT)
                setTextLineTrigger "CorpTarget" & $i  :Shoot ": " & $CorpTargets[$i] & "'s"
                add $i 1
            end
			if ($KILLKILL)
				setTextLineTrigger Warps	:Scan_Corpie "warps into the sector."
				setTextLineTrigger Lifts	:Scan_Corpie "lifts off from"
				setTextLineTrigger Power	:Scan_Corpie "is powering up weapons systems!"
				setTextLineTrigger Enters	:Scan_Corpie "enters the game."
			end
		elseif ($Trader <> "")
			setVar $TargetLock " [1;36m" & $Trader & "'s"
        	setTextLineTrigger	Tfighit  	:Tpwpfig	"Deployed Fighters "
			if ($KILLKILL)
#					setTextLineTrigger warps :scanit "warps into the sector."	[K[1A[1;36mJoe [0;32mwarps into the sector.
#																				[K[1;36mJoe [0;32mwarps out of the sector.
#					setTextLineTrigger lifts :scanit "lifts off from"			[K[1A[1;36mJoe [0;32mlifts off from [1;36mFerrengal[0;32m.
#					setTextLineTrigger power :scanit "is powering up weapons systems!"	[K[1A[1;36mJoe[0;32m is powering up weapons systems!
#					Joe enters the game.	[K[1A[1;36mJoe[0;32m enters the game.
				setTextLineTrigger Warps	:Scan_Trader "warps into the sector."
				setTextLineTrigger Lifts	:Scan_Trader "lifts off from"
				setTextLineTrigger Power	:Scan_Trader "is powering up weapons systems!"
				setTextLineTrigger Enters	:Scan_Trader "enters the game."
			end
		else
			if ($KILLKILL)
				setTextLineTrigger Warps	:ScanIt "warps into the sector."
				setTextLineTrigger Lifts	:ScanIt "lifts off from"
				setTextLineTrigger Power	:ScanIt "is powering up weapons systems!"
				setTextLineTrigger Enters	:ScanIt "enters the game."
			end
			setTextLineTrigger	GoGetEm		:GoGetEm	"Deployed Fighters Report Sector"
			setTextLineTrigger	GoGetLimp	:GoGetLimp	"Limpet mine in"
		end
		setDelayTrigger			Banner		:Banner		500000
		setTextOutTrigger		TextOut		:TextOut
		echo $Prompt & "**"
		pause
	:Scan_Corpie
		killAllTriggers
		setVar $i 1
		while ($i <= $CorpCNT)
			getWordPos CURRENTANSILINE $pos ("[1;36m"&$CorpTargets[$i])
			if ($pos <> 0)
				goto :ScanIt
			end
        	add $i 1
		end
		goto :Loop_D_Lou_2
	:Scan_Trader
		killAllTriggers
		getWordPos CURRENTANSILINE $pos ("[1;36m"&$Trader)
		if ($pos = 0)
			send "  **   "
			goto :Loop_D_Lou_2
		else
			goto :ScanIt
		end

    :ScanIt
		goSub :getSectorData
		goSub :fastAttack
		if ($Killed)
			send ($TagLine & " - Hit!*")
			goto :Loop_D_Lou
		else
			#gosub :HOLO_KILLKILLKILL
			if ($Killed)
				send ($TagLine & " - HOLO Hit!*")
				goto :Loop_D_Lou
			else
				send ($TagLine & " - HOLO Missed!*")
   			end
			goto :Loop_D_Lou
		end
		goto :Loop_D_Lou_2

	:Banner
		killAllTriggers
		gosub :Status_MSG
		goto :Loop_D_Lou_2
	:GoGetLimp
		killAllTriggers
		getWord CURRENTLINE $ck 1
		if ($ck <> "Limpet")
			goto :Loop_D_Lou_2
		end
		getWord CURRENTLINE $destination 4
		isNumber $tst $destination
		if ($tst = 0)
			goto :Loop_D_Lou_2
		end

		setVar $Limp_Hit TRUE
		goto :Manual_Mow
	:GoGetEm
		killAllTriggers
		getWord CURRENTANSILINE $ansi 6
		getWord CURRENTLINE $target 6
		getWord CURRENTLINE $destination 5
		setVar $ansi ($ansi & "ENDENDENDEND")
		cutText $ansi $num 10 2
		stripText $destination ":"

		if ($num <> 33)
		else
			goto :Loop_D_Lou_2
		end
	:Manual_Mow
		killAllTriggers
		setVar $source CURRENTSECTOR

		if ($USE_CIM)
			gosub :getCourse
			setVar $j 3
		else
			getCourse $COURSE $source $destination
			if ($COURSE < 1)
				echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - TWX Has Insufficient Warp-Data To Plot a Course to Sector " & $destination & "**")
				goto :Loop_D_Lou_2
			end
			setVar $courselength $COURSE
			add $courselength 1
			setVar $j 1
		end

		setVar $mow_to "  *  "

		while ($j <= $courselength)
			isNumber $tst $COURSE[$j]
			if ($tst = 1)
				setVar $mow_to ($mow_to&"  M "&$COURSE[$j]&"*  ")
				if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK))
					setVar $mow_to ($mow_to&"Z A "&$maxFigAttack&"*  *  ")
				end

				if (($KILLKILL = 0) AND ($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK) AND ($j > 2))
					setVar $mow_to ($mow_to & "F Z 1 * Z C D * ")
				end

				if (($DROP_LIMPS) AND ($KILLKILL = 0) AND ($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK) AND ($j > 2))
					setVar $mow_to ($mow_to & " H  2  Z  " & $LIMPS_To_Drop & " *  Z  C  *  ")
				end

				if (($DROP_ARMIDS) AND ($KILLKILL = 0) AND ($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK) AND ($j > 2))
					setVar $mow_to ($mow_to & " H  1  Z  " & $ARMIDS_To_Drop & " *  Z  C  *  ")
				end
			end
	    	add $j 1
	    end

	if ($Limp_Hit)
		send ($TagLine & " LIMP -> "&$destination&"!*" & $mow_to)
		setVar $Limp_Hit FALSE
	else
		send ($TagLine & " -> "&$destination&"!*" & $mow_to)
	end

	:Arrived
		setVar $Killed	FALSE
		killAllTriggers
		waitfor "<Re-Display>"
		send "^ Q "
		waitfor ": ENDINTERROG"
		if ($KILLKILL)
			gosub :quikstats
			goSub :getSectorData
			goSub :fastAttack
			if ($Killed)
				send ($TagLine & " - Hit!*")
				goto :Loop_D_Lou
			else
				#gosub :HOLO_KILLKILLKILL
				if ($Killed)
                    send ($TagLine & " - Hit!*")
					goto :Loop_D_Lou
				else
					send ($TagLine & " - Missed!*")
    			end
				goto :Loop_D_Lou
			end
		else
			gosub :quikstats
			if ($FIGHTERS < $fighter_tol)
				send ($TagLine & " - Ship Fighters Fallen Below " & $fighter_tol & " Halting!*")
				gosub :MSGS_ON
				halt
			end
			if ((($DROP_LIMPS) OR ($DROP_ARMIDS)) AND ($CREDITS > 1000000))
				if ((($LIMPETS < 3) AND ($DROP_LIMPS)) OR (($ARMIDS < 3) AND ($DROP_ARMIDS)))
					setVar $destination STARDOCK
					setVar $source CURRENTSECTOR

					if ($USE_CIM)
						gosub :getCourse
						setVar $j 3
					else
						getCourse $COURSE $source $destination
						if ($COURSE < 1)
							echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - TWX Has Insufficient Warp-Data To Plot a Course to Sector " & $destination & "**")
							goto :Loop_D_Lou_2
						end
						setVar $courselength $COURSE
						add $courselength 1
						setVar $j 1
					end

					setVar $mow_to "  *  "
					while ($j <= $courselength)
						setVar $mow_to ($mow_to&"  m "&$COURSE[$j]&"*  ")
						if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK))
							setVar $mow_to ($mow_to&"z a "&$maxFigAttack&"*  *  ")
    					end
				    	add $j 1
				    end

                    send  ($mow_to & "  C R" & STARDOCK & "*Q")
                    waitfor "Computer command"
					setTextLineTrigger	itsalive 	:FURB_itsalive		"Items     Status  Trading % of max OnBoard"
					setTextLineTrigger	nosoupforme	:FURB_nosoupforme	"I have no information about a port in that sector"
					setDelayTrigger		WeHaveAProb	:FURB_WeHaveAProb	3000
					pause
					:FURB_WeHaveAProb
						killAllTriggers
						send ($TagLine & " Unable To Furb - Problem Comfirming StarDock's Alive (Timed Out)!*")
						setVar $DROP_LIMPS FALSE
						setVar $DROP_ARMIDS FALSE
						goto :Skipping_FURB
					:FURB_nosoupforme
						killAllTriggers
						send ($TagLine & " Unable To Furb - StarDock Appears To Have Been Blown!*")
						setVar $DROP_LIMPS FALSE
						setVar $DROP_ARMIDS FALSE
						goto :Skipping_FURB
					:FURB_itsalive
					killAllTriggers
					send "   P S G Y G Q H"
					waitfor "<Hardware Emporium>"
					if ($DROP_LIMPS)
						send "L "
						setVar $buy 0
						waitfor "How many mines do you want"
						getText CURRENTLINE $buy "(Max" ")"
						stripText $buy " "
						send $buy & "* "
						waitfor "<Hardware Emporium>"
						if ($buy = 0)
							setVar $DROP_LIMPS FALSE
							send ($TagLine & " Unable To Furb Limpet Mines (ship may not be able to carry them)*")
						end
					end
					if ($DROP_ARMIDS)
						send "M "
						setVar $buy 0
						waitfor "How many mines do you want"
						getText CURRENTLINE $buy "(Max" ")"
						stripText $buy " "
						send $buy & "* "
						waitfor "<Hardware Emporium>"
						if ($buy = 0)
							setVar $DROP_ARMIDS FALSE
							send ($TagLine & " Unable To Furb Armid Mines (ship may not be able to carry them)*")
						end
					end
					send "Q Q /"
					waitfor "Command [TL="
				end
				:Skipping_FURB
			end
			send "  D"
			goto :Loop_D_Lou_2
		end
	:Tpwpfig
		killAllTriggers
		getWordPos CURRENTANSILINE $pos $TargetLock
		getWordPos CURRENTANSILINE $tst "[0;32m is attacking"

		if (($pos <> 0) AND ($tst = 0))
			goto :GoGetEm
	    else
	        goto :Loop_D_Lou_2
	    end
	:Shoot
	    killAllTriggers
	    getWordPos CURRENTANSILINE $pos "[1;33mDeployed"
   		getWordPos CURRENTANSILINE $tst "[0;32m is attacking"
	    if (($pos <> 0) AND ($tst = 0))
			goto :GoGetEm
	    else
	        goto :Loop_D_Lou_2
	    end

	:TextOut
		killAllTriggers
		getOutText $selection
		Uppercase $selection
		if ($selection = "Q")
			#							---------={ QUIT
			gosub :MSGS_ON
			echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - Halting!**")
			halt
		elseif ($selection = "'")
			#							---------={ Sub Space Msg'n
			setTextTrigger 		SS_Msg1 	:SS_Msg_Done	"Command [TL="
			setTextLineTrigger	SS_Msg2		:SS_Msg_Done	"Message sent on sub-space channel"
			setTextLineTrigger	SS_Msg3		:SS_Msg_Done	"Sub-space comm-link terminated"
			send "'"
			pause
			:SS_Msg_Done
				killAllTriggers
		elseif ($selection = "`")
			#							---------={ Fed Msg'n
			setTextTrigger		Fed_Msg1	:Fed_Msg_Done	"Command [TL="
			setTextLineTrigger	Fed_Msg2	:Fed_Msg_Done	"Message sent on Federation comm-link."
			setTextLineTrigger	Fed_Msg3	:Fed_Msg_Done	"Federation comm-link terminated."
			send "`"
			pause
			:Fed_Msg_Done
				killAllTriggers
		elseif ($selection = "?")
			gosub :Help_Me
		elseif ($selection = "/")
			send "/"
		elseif ($selection = "#")
			#							---------={ Who's Playing
			send "#"
			waitfor "(?="
		elseif (($selection = "I") AND ($SHIP_HAS_IG = TRUE))
			#							---------={ IG Toggle
			if ($ig_mode = 0)
				setVar $ig_mode 1
			else
				setVar $ig_mode 0
			end
			gosub :Toggel_IG
			waitfor "(?="
		elseif ($selection = "M")
			#							---------={ Manual Mow
            getInput $destination "*"&#27&"[K"&"Mow To>"
			isNumber $tst $destination
			if ($tst <> 0)
				if ($destination <= SECTORS)
                	if ($destination > 0)
						goto :Manual_Mow
					end
				end
			end
		elseif ($selection = "U")
			#							---------={ Surround
			gosub :surround
		elseif ($selection = "E")
			#							---------={ Exit/Enter
			send ("p d 0* 0* 0* * *** * c q q q q q z 2 2 c q * z * *** * * Q Y Y T* * *" & PASSWORD & "*    *    *       ZA999988887777666555444333221100*   Z*   F Z 1*  Z C D * ^Q")
			waitfor ": ENDINTERROG"
			send "   D"
			waitfor "Warps to Sector(s) :"
		elseif ($selection = "S")
			#							---------={ Call SaveMe
			gosub :callSaveMe
		elseif ($selection = "H")
			#							---------={ Holo Scan
			send " S  DS  H*  "
			waitfor "Warps to Sector(s) :"
			waitfor "(?="
		elseif ($selection = "C")
			#							---------={ Clear Sector
			gosub :clear_sector
			send "   D"
			waitfor "Warps to Sector(s) :"
			waitfor "(?="
		elseif ($selection = "T")
			#							---------={ Targeting
			gosub :MSGS_OFF
			gosub :CorpTargettingChange
			gosub :MSGS_ON
			goto  :Loop_D_Lou
		elseif ($selection = "K")
			#							---------={ Kill Mode
			if ($KILLKILL)
	            setVar $KILLKILL FALSE
	        else
				setVar $KILLKILL TRUE
				gosub :quikstats
				goSub :getSectorData
				goSub :fastAttack
			end
		elseif ($selection = "L")
			#							---------={ Limpet Mode
			if ($DROP_LIMPS)
				setVar $DROP_LIMPS FALSE
			else
				setVar $DROP_LIMPS TRUE
			end
		elseif ($selection = "A")
			#							---------={ Armid Mode
			if ($DROP_ARMIDS)
				setVar $DROP_ARMIDS	FALSE
			else
				setVar $DROP_ARMIDS	TRUE
			end
		elseif ($selection = "O")
			if ($USE_CIM)
				setVar $USE_CIM FALSE
			else
				setVar $USE_CIM TRUE
			end
		elseif ($selection = "P")
			#							---------={ Pause
			send "/"
			:Reminding
			echo "**" & ANSI_14 & "                TAG Paused Press " & ANSI_15 & "+" & ANSI_14 " to reactivate!**"
			setTextLineTrigger	NewShip	:NewShip	"Security code accepted, engaging transporter control."
			setDelayTrigger		Remind	:Remind 	300000
			setTextOutTrigger	Pasued	:Paused 	"+"
			pause
			:NewShip
				killAllTriggers
				echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Ship Change Detected, Halting!**"
				halt
			:Remind
				killAllTriggers
				goto :Reminding
			:Paused
				killAllTriggers
				gosub :quikstats
				gosub :MSGS_ON
				gosub :Good_To_Go
			    gosub :SET_MINE_DROP
				if ($KILLKILL)
					goSub :getSectorData
					goSub :fastAttack
				end
		elseif ($selection = "G")
			#							---------={ Go
			if ($SHIP_HAS_IG)
				setVar $ig_mode 3
				gosub :Toggel_IG
			end
			gosub :MSGS_ON
			gosub :quikstats
			if ($FIGHTERS < $fighter_tol)
				echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - Ship Fighters Below " & $fighter_tol & " - Halting!**")
				gosub :MSGS_ON
				halt
			end
			gosub :Status_MSG
		else
			echo "**"
        	goto :Loop_D_Lou_2
		end
	goto :Loop_D_Lou_2

	gosub :MSGS_ON
	halt

:callSaveMe
	killAllTriggers
	send "Q Q Q Z N * "
	gosub :quikstats
	setVar $savetarget $CURRENT_SECTOR
	if ($savetarget < 10)
		setVar $savetarget "0000" & $savetarget
	elseif ($savetarget < 100)
		setVar $savetarget "000" & $savetarget
	elseif ($savetarget < 1000)
		setVar $savetarget "00" & $savetarget
	elseif ($savetarget < 10000)
		setVar $savetarget "0" & $savetarget
	end

	send "'" & $savetarget & "=saveme*"

    setTextTrigger friendlyplanet :friendlyplanet "Saveme script activated - Planet "
    setDelayTrigger timeout :timeout 30000
    pause

    :timeout
        killalltriggers
        send "'30 seconds after save call, script halted.*"
		gosub :MSGS_ON        
		halt
		return

    :friendlyplanet
        killalltriggers
        getText CURRENTLINE $planet "Saveme script activated - Planet " " to "
        send "L " & $planet & "* C 'I landed on planet " & $planet & "*"
		gosub :MSGS_ON        
		halt
	return

:quikstats
	setVar $CURRENT_PROMPT 		"Undefined"
	killtrigger 		noprompt
	killtrigger 		prompt1
	killtrigger 		prompt2
	killtrigger 		prompt3
	killtrigger 		prompt4
	killtrigger			prompt5
	killtrigger 		statlinetrig
	killtrigger 		getLine2
	setTextTrigger 		prompt1 		:allPrompts 		"(?="
	setTextLineTrigger 	prompt2 		:secondaryPrompts 	"(?)"
	setTextLineTrigger 	statlinetrig 	:statStart 			#179
	setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
	setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
	setTextTrigger		prompt5			:portPrompt			"How many holds of"
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
	:portPrompt
		getWord CURRENTANSILINE $checkPrompt 1
		setVar $PORT_PROMPT_TYPE CURRENTLINE
		getWord $PORT_PROMPT_TYPE $tempPrompt 1
		getWordPos $checkPrompt $pos "[35mHow"
		if ($pos > 0)
			setVar $CURRENT_PROMPT "Port"
		end
		setTextTrigger		prompt5			:portPrompt			"How many holds of"
		pause

	:statStart
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
		killtrigger prompt5
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
				getWord $stats $TURNS  				($current_word + 1)
			elseif ($wordy = "Creds")
				getWord $stats $CREDITS  			($current_word + 1)
			elseif ($wordy = "Figs")
				getWord $stats $FIGHTERS   			($current_word + 1)
			elseif ($wordy = "Shlds")
				getWord $stats $SHIELDS  			($current_word + 1)
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
				getWord $stats $PHOTONS   			($current_word + 1)
			elseif ($wordy = "Armd")
				getWord $stats $ARMIDS   			($current_word + 1)
			elseif ($wordy = "Lmpt")
				getWord $stats $LIMPETS   			($current_word + 1)
			elseif ($wordy = "GTorp")
				getWord $stats $GENESIS  			($current_word + 1)
			elseif ($wordy = "TWarp")
				getWord $stats $TWARP_TYPE  		($current_word + 1)
			elseif ($wordy = "Clks")
				getWord $stats $CLOAKS   			($current_word + 1)
			elseif ($wordy = "Beacns")
				getWord $stats $BEACONS 			($current_word + 1)
			elseif ($wordy = "AtmDt")
				getWord $stats $ATOMIC  			($current_word + 1)
			elseif ($wordy = "Corbo")
				getWord $stats $CORBO   			($current_word + 1)
			elseif ($wordy = "EPrb")
				getWord $stats $EPROBES   			($current_word + 1)
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
				getWord $stats $CORP   				($current_word + 1)
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
		killtrigger prompt5
		killtrigger statlinetrig
		killtrigger getLine2

		stripText $CURRENT_PROMPT "<"
		stripText $CURRENT_PROMPT ">"
	return

:clear_sector
	killalltriggers
	gosub :quikstats
	setVar $beforeLimpets $LIMPETS
	setVar $beforeArmids  $ARMIDS
	setVar $placedLimpet FALSE
	setVar $placedArmid FALSE
	send " ** "
	waitOn "Warps to Sector(s) :"
	setVar $limpetOwner SECTOR.LIMPETS.OWNER[$CURRENT_SECTOR]
	setVar $armidOwner SECTOR.MINES.OWNER[$CURRENT_SECTOR]
	if (($LIMPETS <= 0) AND (($limpetOwner <> "belong to your Corp") AND ($limpetOwner <> "yours")))
		echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - Not Enough Limpet Mines!**")
		return
	end
	if (($ARMIDS <= 0) AND (($armidOwner <> "belong to your Corp") AND ($armidOwner <> "yours")))
		echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - Not Enough Armid Mines!**")
		return
	end

	gosub :clear_sector_deployEquipment
	while (($placedLimpet = FALSE) OR ($placedArmid = FALSE))
		gosub :clear_sector_attemptClearingMines
	end
	return

	:clear_sector_attemptClearingMines
		setVar $i 0

		while ($i < 5)
			gosub :clear_sector_xenter
			add $i 1
		end
		gosub :clear_sector_deployEquipment
		return

	:clear_sector_xenter
   		send ("Q Y N * T* * *" & PASSWORD & "*    *    *       ZA9999888877776666555544443332221111*   Z*   ")
  		return

	:clear_sector_deployEquipment
		if ($ARMIDS < $ARMIDS_To_Drop)
			setVar $minesToDeploy $ARMIDS
		else       
			setVar $minesToDeploy $ARMIDS_To_Drop
		end
		if ($LIMPETS < $LIMPS_To_Drop)
			setVar $limpsToDeploy $LIMPETS
		else
			setVar $limpsToDeploy $LIMPS_To_Drop
		end

		setVar $clearMac ""

		if (($armidOwner <> "belong to your Corp") AND ($armidOwner <> "yours"))
			setVar $clearMac ($clearMac&"H  1  Z  " & $minesToDeploy & "*  Z C  *  ")
		end
		if (($limpetOwner <> "belong to your Corp") AND ($limpetOwner <> "yours"))
			setVar $clearMac ($clearMac&"H  2  Z  " & $limpsToDeploy & "*  Z C  *   ")
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

:CorpTargettingChange
	killAllTriggers
    setVar $CorpCNT 	0
    setVar $Trader		""
	echo "**" & ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Enter Corp Number or Trader Name To Target (Blank To Cancel)?"
	getConsoleInput $TargetCorp
	isNumber $tst $TargetCorp
	if ($tst <> 0)
	    if ($TargetCorp <> 0)
	        setVar $filter " " & $TargetCorp & " [1;36m"
	        send "clvq"
	        setTextlineTrigger end :CT_end "<Computer deactivated>"
	    	:CT_reset_line_trigger
	    		setTextLineTrigger line_trig :CT_parse_scan_line
		        pause
		    :CT_parse_scan_line
		        killTrigger line_trig
		        setVar $currentline CURRENTANSILINE
		        getWordPos $currentline $pos $filter
	        if ($pos <> 0)
	            setVar $i 1
	            while ($i <= $CorpArraySize)
	                if ($CorpTargets[$i] = 0)
	                    cutText CURRENTLINE $CLVPlyr 30 31
	                    # shave the spaces off the name
	                    setVar $CLVPlayer ""
	                    setVar $CLVWord 1
	                :CLVWord
	                    getWord $CLVPlyr $CLVPWord $CLVWord
	                    if ($CLVPWord <> 0)
	                        if ($CLVWord = 1)
	                            setVar $CLVPlayer $CLVPWord
	                        else
	                            setVar $CLVPlayer $CLVPlayer & " " & $CLVPWord
	                        end
	                        add $CLVWord 1
	                        goto :CLVWord
	                    end
	                    setVar $CorpTargets[$i] $CLVPlayer
	                    add $CorpCNT 1
	                    goto :CT_reset_line_trigger
	                end
	                add $i 1
	            end
	        end
	        goto :CT_reset_line_trigger

		        :CT_end
		        killAllTriggers
		        if ($CorpCNT = 0)
					gosub :MSGS_ON
		            Echo ("****" & ANSI_14 & $TagLineB & ANSI_15 & " No Corp #" & $TargetCorp & " Members Found.**")
					setVar $Target_Spam ""
					setVar $Trader ""
					setVar $TargetCorp 0
					return
		        end
	            setVar $Target_Spam ("Corp #" & $TargetCorp)
			else
		end
	else
		#We're Targetting a Trader
		setVar $Trader $TargetCorp
		getlength $Trader $len
		if ($len > 15)
			cutText $Trader $Target_Spam 1 15
		else
			setVar $Target_Spam $Trader
		end
    end
    return

:getCourse
	killalltriggers
	setVar $sectors ""
	setTextLineTrigger sectorlinetrig :sectorsline " > "
	send ("^f"&$source&"*"&$destination&"*q")
	pause

:sectorsline
	killAllTriggers
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
	killAllTriggers
	setVar $sectors $sectors&" :::"
	setArray $COURSE 100
	setVar $courseLength 0
	setVar $index 1
	:keepGoing
	getWord $sectors $COURSE[$index] $index
	while ($COURSE[$index] <> ":::")
		add $courseLength 1
		add $index 1
		getWord $sectors $COURSE[$index] $index
	end
	return
:noPath
	killAllTriggers
	send "  *  "
	return

:Status_MSG
   	if ($CorpCNT <> 0)
   		if ($KILLKILL)
			send ($TagLine & " Corp #" & $TargetCorp & " (" & $CorpCNT & " Traders), Are Dead Meat!*")
		else
			send ($TagLine & " Corp #" & $TargetCorp & " (" & $CorpCNT & " Traders), Is It!*")
       	end
	elseif ($Trader <> "")
		if ($KILLKILL)
			send ($TagLine & " " & $Trader & ", Is Dead Meat!*")
		else
			send ($TagLine & " " & $Trader & ", Is It!*")
		end
	else
		if ($KILLKILL)
			send ($TagLine & " Everyone Is Dead Meat!*")
		else
			send ($TagLine & " Everyone Is It!*")
		end
   	end
	waitfor "Message sent on sub-space channel"
	return

:MSGS_ON
    :ON_AGAIN
    setTextTrigger onMSGS_ON  :onMSGS_ON "Displaying all messages."
    setTextTrigger onMSGS_OFF :onMSGS_OFF "Silencing all messages."
    send "|"
    pause
    :onMSGS_OFF
    killAllTriggers
    goto :ON_AGAIN
    :onMSGS_ON
    killAllTriggers
    setVar $MSGS_ON TRUE
    return

:MSGS_OFF
    :OFF_AGAIN
    setTextTrigger offMSGS_OFF :offMSGS_OFF "Silencing all messages."
    setTextTrigger offMSGS_ON  :offMSGS_ON "Displaying all messages."
    send "|"
    pause
    :offMSGS_ON
    killAllTriggers
    goto :OFF_AGAIN
    :offMSGS_OFF
    setVar $MSGS_ON FALSE
    killAllTriggers
    return

:CN_Check
	send " CN"
	setTextLineTrigger 	CN1				:CN1			" ANSI graphics            - Off"
	setTextLineTrigger	CN2				:CN2			" Animation display        - On"
	setTextLineTrigger	CN9				:CN9			" Abort display on keys    - ALL KEYS"
	setTextLineTrigger	CNA				:CNA			" Message Display Mode     - Long"
	setTextLineTrigger	CNB				:CNB			" Screen Pauses            - Yes"
	setTextLineTrigger	CNC				:CNC			" Online Auto Flee         - On"
	setTextTrigger		CND				:CND			"Settings command (?=Help)"
	pause

	:CN1
		killTrigger CN1
		setVar $CN1 TRUE
		pause
	:CN2
		killTrigger CN2
		setVar $CN2 TRUE
		pause
	:CN9
		killTrigger CN9
		setVar $CN9 TRUE
		pause
	:CNA
		killTrigger CNA
		setVar $CNA TRUE
		pause
	:CNB
		killTrigger CNB
		setVar $CNB TRUE
		pause
	:CNC
		killTrigger CNC
		setVar $CNC TRUE
		pause
	:CND
		killAllTriggers
		setVar $CN_str ""
		if ($CN1)
			setVar $CN_str ($CN_str & "1")
		end
		if ($CN2)
			setVar $CN_str ($CN_str & "2")
		end
		if ($CN9)
			setVar $CN_str ($CN_str & "9")
		end
		if ($CNA)
			setVar $CN_str ($CN_str & "A")
		end
		if ($CNB)
			setVar $CN_str ($CN_str & "B")
		end
		if ($CNC)
			setVar $CN_str ($CN_str & "C")
		end

	send $CN_str & " Q Q "
	waitfor "Command [TL"
	return

:Toggel_IG
	killalltriggers
	setVar $IG_Switch ""
	setVar $SHIP_HAS_IG TRUE
	setTextTrigger no_ig_trigger :no_ig_available "is not equipped with an Interdictor Generator!"
	setTextTrigger no_ig_beam    :no_ig_beam "Beam to what sector? (U=Upgrade Q=Quit)"
	setTextTrigger no_ig_cby     :no_ig_cby "ARE YOU SURE CAPTAIN? (Y/N)"
	setTextTrigger need_ig       :ig_was_off "Your Interdictor generator is now OFF"
	setTextTrigger ig_fine       :ig_was_on "Your Interdictor generator is now ON"
	setTextTrigger do_ig         :do_ig_thing "Do you wish to change it? (Y/N)"
	send "b"
	pause

	:no_ig_available
     	echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - No IG available on this ship.**")
     	setVar $SHIP_HAS_IG FALSE
		return
	:no_ig_beam
		send " Q "
		echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - Cannot turn IG On, Incorrect Prompt.**")
		setVar $SHIP_HAS_IG FALSE
		return
	:no_ig_cby
		send " Q Q Q Z N "
		waitfor "(?="
		goto :ig_turn_it_on
	:ig_was_on
		if ($ig_mode = 0)
			setVar $IG_Switch "Y"
		elseif ($ig_mode = 1)
			setVar $IG_Switch "N"
		else
			setVar $IG_Switch ""
			setVar $ig_mode 1
		end
		pause
	:ig_was_off
		if ($ig_mode = 0)
			setVar $IG_Switch "N"
		elseif ($ig_mode = 1)
			setVar $IG_Switch "Y"
		else
            setVar $IG_Switch ""
            setVar $ig_mode 0
		end
		pause
	:do_ig_thing
		killAllTriggers
		send $IG_Switch & " * "
		return

:GobalGrover
		setArray $TRADERS 	200
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
		return

:HOLO_KILLKILLKILL
	setVar $max_fig_wave $maxFigAttack
	if ($max_fig_wave = $max_figs)
	     setVar $max_fig_wave ($max_fig_wave - 100)
	end
	setVar $waves_to_send ($max_figs / $max_fig_wave)

:kill_check
	killAllTriggers
	setTextLineTrigger noscan1 :noscanner "Handle which mine type, 1 Armid or 2 Limpet"
	setTextLineTrigger noscan2 :noscanner "You don't have a long range scanner."
	setTextLineTrigger scanned :scandone  "Select (H)olo Scan or (D)ensity Scan or (Q)uit? [D] H"
	send " sh*  "
	pause
	:noscanner
		killtrigger noscan1
		killtrigger noscan2
		killtrigger scanned
		clientMessage "You don't have a HoloScanner!"
		send " *  "
		return
	:scandone
		killtrigger noscan1
		killtrigger noscan2
		killtrigger scanned
		waitFor "Warps to Sector(s) :"

:get_prompt
	waitFor "Command [TL="
	getText CURRENTLINE $current_sector "]:[" "] (?="

:get_current_sector
	isNumber $result $current_sector
	if ($result < 1)
	     send "/"
	     setVar $line CURRENTLINE
	     replacetext $line #179 " "
	     getWord $line $current_sector 2
	     goto :get_current_sector
	end
	if (($current_sector < 1) OR ($current_sector > SECTORS))
	     send "/"
	     setVar $line CURRENTLINE
	     replacetext $line #179 " "
	     getWord $line $current_sector 2
	     goto :get_current_sector
	end

	setVar $killsector 0
	setVar $idx 1
	while ($idx <= SECTOR.WARPCOUNT[$current_sector])
	     setVar $test_sector SECTOR.WARPS[$current_sector][$idx]
	     if ($test_sector <> STARDOCK) AND ($test_sector > 10) AND (SECTOR.TRADERCOUNT[$test_sector] <> 0) AND (SECTOR.PLANETCOUNT[$test_sector] = 0)
	          setVar $killsector $test_sector
	          goto :killem
	     end
	     add $idx 1
	end

:killem
	if ($killsector > 10) AND ($killsector <> STARDOCK)
		setVar $Kill_String ""
	    send $TagLine & "- Attacking sector " & $killsector & ".*  "

	     # Build the no string
	     setVar $no_str ""
	     setVar $no_cnt SECTOR.SHIPCOUNT[$killsector]
	     setVar $no_idx 1

	    while ($no_idx <= $no_cnt)
	         setVar $no_str ($no_str & " n ")
	         add $no_idx 1
	    end

	    # Kill em
	    setVar $kill_idx 1
	    while ($kill_idx <= $waves_to_send)
	         #send (" a " & $no_cnt & " y n y q z " & $max_fig_wave & " * ")
	         setVar $Kill_String ($Kill_String & " a " & $no_str & " y n y q z " & $max_fig_wave & " * ")
	         add $kill_idx 1
	    end

	    # Clear any avoids.
		send ("^C"&$test_Sector&"* q  m z "&$test_sector&" * * z a 9999  *  z  a  9999  *  R  *  F  Z  1  * Z  C  D  * " & $Kill_String &" DZ N  R  *  <  N  N  *  Z  A  99999  *  ^Q")
		waitfor ": ENDINTERROG"
		setVar $Killed TRUE
	else
		send " dz * "
		waiton "<Re-Display>"
		waiton "Command [TL="
		clientMessage "No targets found adj!"
		send " *  "
		setVar $Killed FALSE
	end
	killAllTriggers
	return

:SET_MINE_DROP
	send "  **  "
	waitfor "Warps to Sector(s) :"
	if (SECTOR.LIMPETS.QUANTITY[CURRENTSECTOR] <> 0)
		if ((SECTOR.LIMPETS.OWNER[CURRENTSECTOR] ="belong to your Corp") OR (SECTOR.LIMPETS.OWNER[CURRENTSECTOR] = "yours"))
			if (SECTOR.LIMPETS.QUANTITY[CURRENTSECTOR] <= 10)
				setVar $LIMPS_To_Drop SECTOR.LIMPETS.QUANTITY[CURRENTSECTOR]
			else
				setVar $LIMPS_To_Drop 3
			end
		end
	end
	if (SECTOR.MINES.QUANTITY[CURRENTSECTOR] <> 0)
		if ((SECTOR.MINES.OWNER[CURRENTSECTOR] = "belong to your Corp") OR (SECTOR.MINES.OWNER[CURRENTSECTOR] = "yours"))
			if (SECTOR.MINES.QUANTITY[CURRENTSECTOR] <= 10)
				setVar $ARMIDS_To_Drop SECTOR.MINES.QUANTITY[CURRENTSECTOR]
			else
				setVar $ARMIDS_To_Drop 3
			end
		end
	end
	return

:surround
	killAllTriggers
	send "  **  "
	setDelayTrigger		ScanDelay1	:ScanDelay1	200
	pause
	:ScanDelay1
		killAllTriggers
		gosub :quikstats
		setVar $startingLocation $CURRENT_PROMPT
		if ($startingLocation = "Command")
			Goto :StartSurround
		else
			echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - Not At Command Prompt!**")
			return
		end

:StartSurround
	send "sdszh"
	waitFor "Relative Density Scan"
	waitfor "Long Range Scan"
	waitfor "]:[" & $CURRENT_SECTOR & "] (?="
	setVar $SHIP_MAX_ATTACK $maxFigAttack
	if ($SHIP_MAX_ATTACK > $FIGHTERS)
		setVar $SHIP_MAX_ATTACK ($FIGHTERS/2)
	end
	setVar $i 1
	setVar $surroundString ""
	setVar $surroundOutput ""
	setVar $yourOwnCount 0
	while (SECTOR.WARPS[$CURRENT_SECTOR][$i] > 0)
		setVar $adj_sec SECTOR.WARPS[$CURRENT_SECTOR][$i]
		getDistance $distance $adj_sec $current_sector
		if ($distance <= 0)
			send ("^f"&$adj_sec&"*"&$current_sector&"*q")
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
        		#ignore your own figs
        		add $yourOwnCount 1
        		if ($yourOwnCount = $totalWarps)
        			setVar $surroundOutput ($surroundOutput&"(Surround) All sectors around are friendly fighters.*")
        		end
        	elseif (SECTOR.FIGS.QUANTITY[$ADJ_SEC] >= $tempoffodd)
			#ignore too many figs
			setVar $surroundOutput ($surroundOutput&"(Surround) Too many fighters in sector "&$adj_sec&".*")
		elseif (($adj_sec <= 10) OR ($adj_Sec = STARDOCK))
			#ignore fed space
			setVar $surroundOutput ($surroundOutput&"(Surround) Avoided Fed Space, sector "&$adj_sec&".*")
		elseif ($containsShieldedPlanet)
			#ignore shielded planets
			setVar $surroundOutput ($surroundOutput&"(Surround) Avoided planet in sector "&$adj_sec&".*")
		elseif ($distance > 1)
			#ignore one ways
			setVar $surroundOutput ($surroundOutput&"(Surround) Avoided one way in sector "&$adj_sec&".*")
		else
			setVar $surroundString ($surroundString&" m z "&$adj_sec&" * z a "&$SHIP_MAX_ATTACK&"* * ")
			if (($surroundFigs > 0) AND ($FIGHTERS > $surroundFigs))
				setVar $surroundString ($surroundString&"f z" & $surroundFigs & "*zcd*")
				subtract $FIGHTERS $surroundFigs
			end

			if (($KILLKILL = 0) AND ($DROP_LIMPS) AND ($LIMPETS > 0))
				setVar $surroundString ($surroundString&" h  2  z" & $LIMPS_To_Drop & "*  z  c  * ")
				subtract $LIMPETS $LIMPS_To_Drop
			end
			if (($KILLKILL = 0) AND ($DROP_ARMIDS) AND ($ARMIDS > 0))
				setVar $surroundString ($surroundString&" h  1  z" & $ARMIDS_To_Drop & "*  z  c  * ")
				subtract $ARIDS $ARMIDS_To_Drop
			end
			setVar $surroundString ($surroundString&"m  z"&$current_Sector&"*  z  a "&$SHIP_MAX_ATTACK&"*  * ")
		end
		add $i 1
	end
	send ($surroundString & $TagLine & " Surrounded: " & $CURRENT_SECTOR & "*")
	waitfor ("Surrounded: " & $CURRENT_SECTOR)
	return

:Good_To_Go
	if ($CURRENT_PROMPT <> "Command")
		echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - Must Start From Command Prompt!**")
		gosub :MSGS_ON
		halt
	end
	if ($FIGHTERS < $fighter_tol)
		echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - Ship Fighters Below " & $fighter_tol & " - Halting!**")
		gosub :MSGS_ON
		halt
	end
	return
	
:Help_Me
	if ($MSGS_ON)
		gosub :MSGS_OFF
	end
	echo "**"
	echo ("                   "&ANSI_7&"-"&ANSI_8&"="&ANSI_15&#42&ANSI_8&"="&ANSI_7&"-"&ANSI_8&"="&ANSI_15&#42&ANSI_8&"="&ANSI_7&"-"&ANSI_8&"="&ANSI_15&#42&ANSI_8&"="&ANSI_7&"-"&ANSI_8&"="&ANSI_15&#42&ANSI_8&"="&ANSI_7&"-"&ANSI_8&"="&ANSI_15&#42&ANSI_8&"="&ANSI_7&"-"&ANSI_8&"="&ANSI_15&#42&ANSI_8&"="&ANSI_7&"-"&ANSI_8&"="&ANSI_15&#42&ANSI_8&"="&ANSI_7&"-"&ANSI_8&"="&ANSI_15&#42&ANSI_8&"="&ANSI_7&"-"&ANSI_8&"="&ANSI_15&#42&ANSI_8&"="&ANSI_7&"-")
	echo ("*"&ANSI_15&"                       LoneStar's "&ANSI_8&"["&ANSI_14&"TAG"&ANSI_8&"]"&ANSI_8&" - "&ANSI_15&"You're IT!*")
	echo ("                   "&ANSI_7&"-"&ANSI_8&"="&ANSI_15&#42&ANSI_8&"="&ANSI_7&"-"&ANSI_8&"="&ANSI_15&#42&ANSI_8&"="&ANSI_7&"-"&ANSI_8&"="&ANSI_15&#42&ANSI_8&"="&ANSI_7&"-"&ANSI_8&"="&ANSI_15&#42&ANSI_8&"="&ANSI_7&"-"&ANSI_8&"="&ANSI_15&#42&ANSI_8&"="&ANSI_7&"-"&ANSI_8&"="&ANSI_15&#42&ANSI_8&"="&ANSI_7&"-"&ANSI_8&"="&ANSI_15&#42&ANSI_8&"="&ANSI_7&"-"&ANSI_8&"="&ANSI_15&#42&ANSI_8&"="&ANSI_7&"-"&ANSI_8&"="&ANSI_15&#42&ANSI_8&"="&ANSI_7&"-")
	echo "*"
	echo (ANSI_15&"      TAG is a Lawn-Mow script  that chases Fighter Hits and operates in one*")
	echo (ANSI_15&"      of two Modes: Kill-Mode, and Chase-Mode. Ass with almost every script,*")
	echo (ANSI_15&"      this  one should  not be  ran  while away-from-keys  (Esp when in Kill*")
	echo (ANSI_15&"      Mode). The script filters aliens.  However if in Kill-Mode, the script*")
	echo (ANSI_15&"      will attack  whoever/whatever's at the Destination sector.  If Running*")
	echo (ANSI_15&"      in Chase mode, and you enguage Kill Mode, script will scan the current*")
	echo (ANSI_15&"      sector for a Target.*")
	echo "*"
	echo (ANSI_14&"["&ANSI_15&"K"&ANSI_8&"ILL"&ANSI_14&"]"&ANSI_15&"   Press K to toggle Kill Mode. Blue background indicates Kill Mode is on*")
	echo (ANSI_15&"         and script will attempt to #SD# players upon completion of Mow. When*")
	echo (ANSI_15&"         Kill Mode is off,  the script simply follows players dropping Fighters*")
	echo (ANSI_15&"         as it moves. Kill Mode is active when it looks like: "&ANSI_10&"["&#27&"[0m"&#27&"[44m"&"K"&#27&"[0m"&#27&"[44m"&ANSI_15&"ILL"&#27&"[0m"&ANSI_14&"]*")
	echo (ANSI_14&"["&ANSI_15&"L"&ANSI_8&"IMP"&ANSI_14&"]"&ANSI_15&"   Press L to toggle the dropping of Limpet Mines. Mines  are not dropped*")
	echo (ANSI_15&"         when Kill Mode is turned on.  Default number of  Limpet mines that are*")
	echo (ANSI_15&"         deployed  is  3.  To Change the  number  of  deployed  Limpets, simply*")
	echo (ANSI_15&"         deploy the custom amount in start sector --Max is 10, anything over 10*")
	echo (ANSI_15&"         the  script  will use the default amount. A  Blue background indicates*")
	echo (ANSI_15&"         that  Limpets  will be dropped. Script will Furb Limpets when you have*")
	echo (ANSI_15&"         more than 1mil on hand. "&ANSI_10&"["&#27&"[0m"&#27&"[44m"&"L"&#27&"[0m"&#27&"[44m"&ANSI_15&"IMP"&#27&"[0m"&ANSI_14&"]"&ANSI_15&" indicates Limp Mode is active.*")
	echo (ANSI_14&"["&ANSI_15&"A"&ANSI_8&"RMID"&ANSI_14&"]"&ANSI_15&"  Press A to toggle the dropping of  Armid Mines.  Mines are not dropped*")
	echo (ANSI_15&"         when  Kill Mode  is turned on.  Default number of Armid mines that are*")
	echo (ANSI_15&"         deployed is 3.  To Change the number of deployed Armids, simply deploy*")
	echo (ANSI_15&"         the custom amount  in  start sector  --Max is 10, anything over 10 the*")
	echo (ANSI_15&"         script will use the default amount.  A  Blue background indicates that*")
	echo (ANSI_15&"         Armids  will  be  dropped.  Script will Furb Armids when you have more*")
	echo (ANSI_15&"         than 1mil on hand. "&ANSI_10&"["&#27&"[0m"&#27&"[44m"&"A"&#27&"[0m"&#27&"[44m"&ANSI_15&"RMID"&#27&"[0m"&ANSI_14&"]"&ANSI_15&" Indicates the Armid Mode is active.*")
	echo (ANSI_14&"["&ANSI_15&"E"&ANSI_8&"/ENTER"&ANSI_14&"]"&ANSI_15&"Performs a Exit/Enter function. Will deploy one Fighter if possible.*")
	echo (ANSI_14&"["&ANSI_15&"S"&ANSI_8&"AVEME"&ANSI_14&"]"&ANSI_15&" Calls SaveMe via SS, and lands on Planet upon arrival.*")
	echo (ANSI_14&"["&ANSI_15&"H"&ANSI_8&"OLO"&ANSI_14&"]"&ANSI_15&"   Performs a Density and Holo Scan.*")
	echo (ANSI_14&"["&ANSI_15&"C"&ANSI_8&"LEAR"&ANSI_14&"]"&ANSI_15&"  Will perform necessary Exit/Enter's until the Enemy mines have been*")
	echo (ANSI_15&"         cleared. Ship must have Mines on board.*")
	echo (ANSI_14&"["&ANSI_15&"T"&ANSI_8&"ARGET"&ANSI_14&"]"&ANSI_15&" You can input either a  Traders Name,  or a Corp Number and the Script*")
	echo (ANSI_15&"         will only react to Fighter Hits from that Trader/Corp Member.*")
	echo (ANSI_14&"["&ANSI_15&"P"&ANSI_8&"AUSE"&ANSI_14&"]"&ANSI_15&"  Because  the  script  utilizes  a Run-Time Menu most keys are filtered*")
	echo (ANSI_15&"         out by the script. Selecting Pause will deactivate the script allowing*")
	echo (ANSI_15&"         you access the Game. Pressing the  + (plus sign),  will reactivate the*")
	echo (ANSI_15&"         the script.*")
	echo (ANSI_14&"["&ANSI_8&"PL"&ANSI_15&"O"&ANSI_8&"T"&ANSI_14&"]"&ANSI_15&"   Toggels whether or not to use the CIM  to plot a course before Mowing.*")
	echo (ANSI_15&"         Best to have a complete ZTM if turning this option off.  TAG will plot*")
	echo (ANSI_15&"         a course before mowing when the option looks like: "&ANSI_14&"["& #27 & "[0m" & #27 & "[44m" & ANSI_15 &"PL" & #27 & "[0m" & #27 & "[44m" & "O" & #27 & "[0m" & #27 & "[44m" & ANSI_15 & "T"& #27 & "[0m"&ANSI_14&"]"&ANSI_15&"*")
	echo (ANSI_14&"["&ANSI_15&"#"&ANSI_14&"]"&ANSI_15&"      Pressing the Pound sign displays 'Who's Playing'.*")
	echo (ANSI_14&"["&ANSI_15&"M"&ANSI_8&"OW"&ANSI_14&"]"&ANSI_15&"    Performs A LawnMow to specified Sector.*")
	echo (ANSI_14&"["&ANSI_15&"I"&ANSI_8&"G"&ANSI_14&"]"&ANSI_15&"     Toggels Ships Interdict Control.  If  Current Ship does not have an IG*")
	echo (ANSI_15&"         this option will not appear. However. If you Ship does have an IG, and*")
	echo (ANSI_15&"         it's turned on, the menu selection will appear like: " & ANSI_14 & "[" & #27 & "[0m" & #27 & "[44m" & "I" & #27 & "[0m" & #27 & "[44m" & ANSI_15 & "G"& #27 & "[0m"&ANSI_14&"]*")
	echo (ANSI_14&"["&ANSI_8&"S"&ANSI_15&"U"&ANSI_8&"ROUND"&ANSI_14&"]"&ANSI_15&"Surrounds current sector with One Fighter.*")
	echo (ANSI_14&"["&ANSI_15&"Q"&ANSI_8&"UIT"&ANSI_14&"]"&ANSI_15&"   Halts the script.  But also makes sure the Messages are turned on.  If*")
	echo (ANSI_15&"         the  script  halts  prematurely  make  sure that Messages are on.*")
	Echo "*"
	if ($MSGS_OFF)
		gosub :MSGS_ON
	end
	return
