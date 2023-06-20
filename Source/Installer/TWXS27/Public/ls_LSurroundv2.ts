    #=--------                                                                       -------=#
     #=------------------------------   Surround Drop  v1.0e ------------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	December 1, 2007
	#
	#		Author		:	LoneStar
	#
	#		TWX			:	Should Work with TWX 2.03, 2.04b, and 2.04 Final
	#
	#		Description	:	Surround Detect - waits for someone to surround a sector with 3 or
	#						more friendly Fighters drops a planet in the surround path.
	#
	#						Can either Drop and do nothing (let cannons do the podding); if you
	#						have a Level-6 you can do a CitKill, or if no Level-6 then you can
	#						Lift Kill and utilize the Ship-IG.
	#
	#						Script does not utilize Fighter Data. There's a "Sensitivity" setting
	#						that is used to determine a surround is taking place. The default is
	#						1000 milliseconds (1 second), but if you get alot of "Not A Surround"
	#						msg's, try increasing this value.
	#
	#		Fixes		:	Initial Release
	#
	#		Note		:	Added support for the 'script?' sub-space function
	#
goto :Start
:Pwarp_GO
	setVar $i 1
	setVar $ii 2
	if ($Hit = 1)
		SetVar $Hit_1 0
		SetVar $Hit_2 0
		SetVar $Hit_1 $Hit_Sector
		setVar $Hit 2
	else
		setVar $Hit 1
		SetVar $Hit_2 $Hit_Sector
		setVar $i1 1
		setVar $i2 1
		while ($i1 <= 6)
			while ($i2 <= 6)
				if ($Adjacents[$Hit_1][$i1] = $Adjacents[$Hit_2][$i2])
					SetVar $Hit_Sector $Adjacents[$Hit_1][$i1]
					SetVar $adj 6
					while ($adj > 1)
						setVar $Hitting $Adjacents[$Hit_Sector][$adj]
						if ($Hitting <> 0)
							send ("  P " & $Hitting & "*  Y  ")
							setTextLineTrigger	Locked		:Locked		"All Systems Ready, shall we engage"
							setTextTrigger   	NotLocked	:NotLocked		"Citadel command (?=help)"
							pause
							:Locked
								killAllTriggers
								if ($Reaction = 1)
									gosub :getSectorData
									if ($realTraderCount > 0)
										goSub :fastCitadelAttack
									else
										Echo ("**" & $TagLineB & ANSI_15 & " Waiting 3 seconds for a Target**")
										setTextLineTrigger	1	:citkill	"warps into the sector"
										setTextLineTrigger	2	:citkill	"The Interdictor Generator on"
										setTextLineTrigger	3	:citkill	"Quasar Cannon on"
										setDelayTrigger		4	:nokill		3000
										pause
										:citkill
											killAllTriggers
											gosub :getSectorData
											if ($realTraderCount > 0)
												goSub :fastCitadelAttack
											end
											GoTo	:Decide
    									:nokill
											killAllTriggers
											Echo ("**" & $TagLineB & ANSI_15 & " No Target Found ("&ANSI_6&"CitKill Timed Out"&ANSI_15&")**")
									end
									GoTo	:Decide
								elseif ($Reaction = 2)
									gosub :getSectorData
									if ($realTraderCount > 0)
										gosub :fastAttack
									else
										Echo ("**" & $TagLineB & ANSI_15 & " Waiting 3 seconds for a Target**")
										setTextLineTrigger	5	:sectkill	"warps into the sector"
										setTextLineTrigger	6	:sectkill	"The Interdictor Generator on"
										setTextLineTrigger	7	:sectkill	"Quasar Cannon on"
										setDelayTrigger		8	:nosectkill	3000
										pause
										:sectkill
											killAllTriggers
											gosub :getSectorData
											if ($realTraderCount > 0)
												goSub :fastAttack
											end
											GoTo :Decide
    									:nosectkill
											killAllTriggers
											Echo ("**" & $TagLineB & ANSI_15 & " No Target Found ("&ANSI_6&"Lift-Kill Timed Out"&ANSI_15&")**")
									end
									GoTo	:Decide
								elseif ($Reaction = 3)
									send ("  Q  Q  Q  Z  N  **  ")
								else
									goto :Decide
								end
							:NotLocked
								killAllTriggers
						end
						subtract $adj 1
					end
					Echo ("**" & $TagLineB & ANSI_15 & " Missed**")
					goto :Decide
				end
				add $i2 1
			end
			setVar $i2 1
			add $i1 1
		end
	end
	goto :Again
:fastCitadelAttack
	setVar $refurbString "l "&$PLANET_Number&"* m * * * "
	setVar $attackString ""
	setVar $targetString  "a z "
	setVar $targetShotgunString "a z z y z"&$SHIP_MAX_ATTACK&"* * a z z * y z"&$SHIP_MAX_ATTACK&"* * "
	setVar $isFound FALSE
	getWordPos $sectorData $beaconPos "[0m[35mBeacon  [1;33m:"
	if ($FIGHTERS > 0)
		if ((($CURRENT_SECTOR > 10) AND ($CURRENT_SECTOR <> STARDOCK)) AND ($beaconPos > 0))
			setVar $targetString $targetString&"* "
		end
	else
		gosub :quikstats
		Echo ("**" & $TagLineB & ANSI_15 & " You have no Fighters!**")
		halt
	end
	if (($emptyShipCount + $fakeTraderCount + $realTraderCount) > 0)
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
				setVar $targetString $targetString&"z y z"
			end
			add $c 1
		end
	else
	Echo ("**" & $TagLineB & ANSI_15 & " No Valid Targets**")
		return
	end
	if ($isFound = TRUE)
		setVar $attackString ""
		setVar $count 8
		while ($count > 0)
			if ($shotgun)
				setVar $attackString $attackString&"q "&$targetShotgun&$refurbString
			else
				if ($doubletap)
					setVar $attackString $attackString&"q "&$targetString&$SHIP_MAX_ATTACK&"* * "&$targetString&$SHIP_MAX_ATTACK&"* * "&$refurbString
				else
					setVar $attackString $attackString&"q "&$targetString&$SHIP_MAX_ATTACK&"* * "&$refurbString
				end
			end
			subtract $count 1
		end
	else
		Echo ("**" & $TagLineB & ANSI_15 & " No Valid Targets**")
		return
	end
	send "q "&$attackString&" c "
	return

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
				Echo ("**" & $TagLineB & ANSI_15 & " You Have No Fighters**")
				halt
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
		goto :stoppingPoint
	end
	send $attackString&"* "
	gosub :quikstats
	:stoppingPoint
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
			getWordPos $temp $pos3 #27&"[0m      "&#27&"[32m     in "&#27&"[36m"
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
			#for defender recognition once ansi ships are in array in bot
			if ($pos3 > 0)
				getText $temp $shipname "(" #27&"[0;32m)"&#13
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
				#setVar $FAKETRADERS[($fakeTraderCount+1)] $temp
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
				#setVar $FAKETRADERS[($fakeTraderCount+1)] $temp
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
				#setVar $FAKETRADERS[($fakeTraderCount+1)] $temp
				add $fakeTraderCount 1
			end
			getText $fakeData $temp $STARTLINE $ENDLINE
		end
	end
	return

    #=--------                                                                       -------=#
     #=------------------------------ Start & Support Routines  ---------------------------=#
    #=--------                                                                       -------=#
:Start
	setArray $Adjacents			SECTORS 6
	setVar $TagVersion			"1.0"
	setVar $TagLineA			"[LSDrop]"
	setVar $TagLineB			ANSI_9&"["&ANSI_14&"LSDrop"&ANSI_9&"]"
	setVar $TagLineC			"LoneStar's Surround Drop Killa!"
	SetVar $Hit					1
	setVar $Planet_Number		0
	setVar $Planet_Level		0
	setVar $Sensi				1000
	setVar $Return				FALSE
	setVar $Continuous			FALSE
	setVar $Safety_FIGS			0
	setVar $Safety_ORE			0

	gosub :Global_Grover
	gosub :quikstats

	if ($CURRENT_PROMPT <> "Citadel")
		Echo ("**" & $TagLineB & ANSI_15 & " Must Start From The Citadel**")
		halt
	end

	SetVar $StartSector		$CURRENT_SECTOR

	gosub :MSGS_OFF
	gosub :ALIENS_CHECK
	gosub :CN_Check
	gosub :Ship_Check
	gosub :GetPlanet_Info

	if ($Planet_Number = 0)
		Echo ("**" & $TagLineB & ANSI_15 & " Unable To Obtain Planet Number.**")
		halt
	elseif ($Planet_Level < 4)
		Echo ("**" & $TagLineB & ANSI_15 & " Planet Must Be At Least A Level 4**")
		halt
	end

  	gosub :Menu_Top

	if ($Planet_IG = "Off")
		send "N"
		setTextLineTrigger		PIG_Off		:PIG_Off	"Your Interdictor Generator is now INACTIVE"
		setTextLineTrigger		PIG_On		:PIG_On		"Your Interdictor Generator is now ACTIVE"
		pause
		:PIG_Off
			killAllTriggers
			send "    Y    "
		:PIG_On
			killAllTriggers
			send "    *    "
	end

	if ($Ship_IG = "Off")
		send "   Q   Q   Q   Z   N   *   B   Y   L " & $PLANET_Number & "*   C   "
		SetVar $Ship_IG "On"
	end

	Echo ("**" & $TagLineB & ANSI_15 & " Loading Sector Data...**")
	setVar $idx 1
	while ($idx <= SECTORS)
		setVar $adjs 1
		while (SECTOR.WARPS[$idx][$adjs] > 0)
			setVar $adj SECTOR.WARPS[$idx][$adjs]
			if ($adjs <= 6)
				setVar $Adjacents[$idx][$adjs] $adj
			end
            add $adjs 1
		end
		add $idx 1
	end

	gosub :MSGS_ON

	send "'" & $TagLineA & " LOADED Planet #" & $Planet_Number
	if ($reaction <> 0)
		send " - "
	    If ($reaction = 1)
	    	SetVar $CashAmount $Planet_FIG
	    	gosub :CommaSize
	    	send "CitKill On, with " & $CashAmount & " Figs*"
	    elseif ($reaction = 2)
	    	send "Lift Kill*"
	    elseif ($reaction = 3)
	    	send "Lift Only*"
	    end
	end
	send "*    "

	:Again
	killAllTriggers
	if ($ALIENS)
		setTextLineTrigger	FigHit		:FigHit_A	"Deployed Fighters Report Sector"
	else
		setTextLineTrigger	FigHit		:FigHit		"Deployed Fighters Report Sector"
	end

	if ($Hit <> 1)
		setDelayTrigger			Sur_Delay	:Sur_Delay	$Sensi
	else
		setTextLineTrigger 		scriptcheck :Script_Chk	"script?"
	end
	setDelayTrigger				Reminder	:Reminder	180000
	pause
	:Sur_Delay
		Echo ("**" & $TagLineB & ANSI_15 & " Not A Surround**")
		setVar $Hit 1
		pause
	:FigHit_A
		killTrigger FigHit
		killTrigger Sur_Delay
		getWord CURRENTLINE $Hit_Sector 5
		getWordPos CURRENTLINE $pos "is attacking!"
		if ($pos <> 0)
			#Need this check because each single fighit generates two:
			#"Deployed Fighters Report..."   messages.
			goto :Again
		end
		getWord CURRENTANSILINE $ansi 6
		cutText $ansi $num 10 2
		stripText $Hit_Sector ":"
		isNumber $tst $Hit_Sector
		if (($num <> 33) AND ($tst <> 0))
			goto :Pwarp_GO
		end
		goto :Again
	:FigHit
		killTrigger FigHit
		killTrigger Sur_Delay
		getWord CURRENTLINE $ck 1
		if ($ck <> "Deployed")
			goto :Again
		end
		getWordPos CURRENTLINE $pos "is attacking!"
		if ($pos <> 0)
			goto :Again
		end
		getWord CURRENTLINE $Hit_Sector 5
		stripText $Hit_Sector ":"
		isNumber $tst $Hit_Sector
		if ($tst = 0)
			goto :Again
		end
		goto :Pwarp_GO
	:Reminder
		killTrigger Reminder
		echo ("****" & ANSI_14 & "                    " & $TagLineB & ANSI_15 & "  Version " & $TagVersion & " Running  " & $TagLineB & "***")
		setDelayTrigger			Reminder	:Reminder	180000
		pause
	halt

:quikstats
	setVar $CURRENT_PROMPT 		"Undefined"
	killtrigger noprompt
	killtrigger prompt1
	killtrigger prompt2
	killtrigger prompt3
	killtrigger prompt4
	killtrigger statlinetrig
	killtrigger getLine2
	setTextTrigger 		prompt1 		:allPrompts 		"(?="
	setTextLineTrigger 	prompt2 		:secondaryPrompts 	"(?)"
	setTextLineTrigger 	statlinetrig 	:statStart 			#179
	setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
	setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
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
		killtrigger statlinetrig
		killtrigger getLine2
	return

:Script_Chk
    killtrigger scriptcheck
    setVar $subLine (CURRENTLINE & "     ")
    getWord $subLine $spoof 1
    cutText $spoof $spoof 1 1
	if (($spoof = "R") OR ($spoof = "'"))
		setVar $StrMSG ($TagLineA & " Planet # " & $PLANET_Number)
		if ($reaction <> 0)
			setVar $strMSG ($strMSG & " - ")
		    If ($reaction = 1)
		    	SetVar $CashAmount $Planet_FIG
		    	gosub :CommaSize
		    	setVar $strMSG ($strMSG & "CitKill, with " & $CashAmount & " Figs*")
		    elseif ($reaction = 2)
				SetVar $CashAmount $FIGHTERS
		    	gosub :CommaSize
				setVar $strMSG ($strMSG & "Lift Kill, with " & $CashAmount & " Fighters*")
		    elseif ($reaction = 3)
				setVar $strMSG ($strMSG & "Lift Only*")
		    end
		else
			setVar $strMSG ($strMSG & "*")
		end

		setVar $strMSG ($strMSG & "         Auto Return      : ")
		if ($Return)
			setVar $strMSG ($strMSG & "Yes*")
		else
			setVar $strMSG ($strMSG & "No*")
		end
		setVar $strMSG ($strMSG & "         Run Continuous   : ")
		if ($continuous)
			setVar $strMSG ($strMSG & "Yes*")
		else
			setVar $strMSG ($strMSG & "No*")
		end

		setVar $strMSG ($strMSG & "         Ore Safe Level   : ")
		if ($Safety_ORE <> 0)
			SetVar $CashAmount $Safety_ORE
	    	gosub :CommaSize
			setVar $strMSG ($strMSG & $CashAmount & "*")
		else
			setVar $strMSG ($strMSG & "None*")
		end

		setVar $strMSG ($strMSG & "         Fig Safe Level   : ")
		if ($Safety_FIGS <> 0)
			SetVar $CashAmount $Safety_FIGS
	    	gosub :CommaSize
			setVar $strMSG ($strMSG & $CashAmount & "*")
		else
			setVar $strMSG ($strMSG & "None*")
		end

		send "'*" & $strMSG & "**"
    end

	setTextLineTrigger 		scriptcheck :Script_Chk	"script?"
	pause

:ALIENS_CHECK
	send "#"
	waitfor "Who's Playing"
	SetTextLineTrigger	Aliens		:AlienRaceFound		"are on the move"
	SetTextTrigger		Nadda		:Nadda				"(?="
	pause

	:AlienRaceFound
		killAllTriggers
		setVar $ALIENS TRUE
		return
	:Nadda
		killAllTriggers
		setVar $ALIENS FALSE
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
    killAllTriggers
    return
:GetPlanet_Info
	send " qdc  "
	waitfor "You leave the citadel and return to your ship."
	setTextLineTrigger	PlanetNumber	:PlanetNumber 	"Planet #"
	setTextLineTrigger	PlanetLevel		:PlanetLevel	"Planet has a level"
	setTextLineTrigger	PlanetORE		:PlanetOre		"Fuel Ore"
	setTextLineTrigger	PlanetFIG		:PlanetFIG		"Fighters        N/A"
	setTextLineTrigger	PlanetTPort		:PlanetTPort	"-=-=-=-=-=- TransPort power ="
	setTextLineTrigger	PlanetIG		:PlanetIG		"Planetary Interdictor Generator"
	setTextLineTrigger	PlanetShields	:PlanetShields	"Planetary Defense Shielding Power"
	setTextTrigger 		PlanetCIT		:PlanetCIT		"Citadel command (?"
	pause
	pause
	:PlanetIG
		killTrigger PlanetIG
		getWordPos CURRENTLINE $pos "INACTIVE"
		if ($pos <> 0)
			#We Have PIG. but is not on
			setVar $Planet_IG "Off"
			pause
		end
		getWordPos CURRENTLINE $pos "ACTIVE"
		if ($pos <> 0)
			#we Have PIG and is on
			setVar $Planet_IG "On"
			pause
		end
		setVar $Planet_IG "None"
		pause
    :PlanetTPort
    	killTrigger PlanetTPort
		getText CURRENTLINE $Planet_TPad "power =" "hops -"
		stripText $Planet_TPad ","
		stripText $Planet_TPad " "
		isNumber $tst $Planet_TPad
		if ($tst = 0)
			setVar $Planet_TPad 0
		end
		pause

	:PlanetShields
		killTrigger PlanetShields
		getWord CURRENTLINE $Planet_Shields 8
		stripText $Planet_Shields ","
		isNumber $tst $Planet_Shields
		if ($tst = 0)
			setVar $Planet_Shields 0
		end
		pause
	:PlanetNumber
    	killTrigger PlanetNumber
    	setVar $temp CURRENTLINE
    	getWord $temp $Planet_Number 2
    	stripText $Planet_Number "#"
		isNumber $tst $Planet_Number
		if ($tst = 0)
			setVar $Planet_Number 0
		end
		pause
	:PlanetLevel
		killTrigger PlanetLevel
		getWord CURRENTLINE $Planet_Level 5
		isNumber $tst $Planet_Level
		if ($tst = 0)
			setVar $Planet_Level 0
		end
		pause
	:PlanetORE
		killTrigger PlanetORE
		getWord CURRENTLINE $Planet_ORE 6
		stripText $Planet_ORE ","
    	pause
	:PlanetFIG
		killTrigger PlanetFIG
		getWord CURRENTLINE $Planet_FIG 5
		stripText $Planet_FIG ","
		pause
	:PlanetCIT
		killAllTriggers
		return

:CN_Check
	send " cn"
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
		setVar $str ""
		if ($CN1)
			setVar $str ($str & "1")
		end
		if ($CN2)
			setVar $str ($str & "2")
		end
		if ($CN9)
			setVar $str ($str & "9")
		end
		if ($CNA)
			setVar $str ($str & "A")
		end
		if ($CNB)
			setVar $str ($str & "B")
		end
		if ($CNC)
			setVar $str ($str & "C")
		end

	send $str & " q q "
	waitfor "Citadel command (?="
	return

:Ship_Check
	setVar	$SHIELDS_MAX	0
	setVar	$FIGHTERS_MAX	0
	setVar	$OFF_ODDS		1
	setVar	$DEF_ODDS		1
	setVar	$TPW			1
	setVar	$SHIP_MAX_ATTACK 1
	send "  C;Q"
	setTextLineTrigger		Ship_Shields	:Ship_Shields		"Maximum Shields:"
	setTextLineTrigger		Fighters_OOdds	:Fighters_OOdds		"Offensive Odds:"
	setTextLineTrigger		TPW_DOdds		:TPW_DOdds			"Defensive Odds:"
	setTextLineTrigger		FigsPERAttack	:FigsPERAttack		"TransWarp Drive:"
	setTextLineTrigger		Stats_Done		:Stats_Done			"<Computer deactivated>"
	pause
	:Ship_Shields
		setVar $Temp (CURRENTLINE & "@@@")
		getText $Temp $SHIELDS_MAX "Shields:" "@@@"
		stripText $SHIELDS_MAX " "
		stripText $SHIELDS_MAX ","
		pause
	:Fighters_OOdds
		setVar $Temp CURRENTLINE
		getWordPos $Temp $pos "Fighters:"
		getLength $Temp $len
		cutText $Temp $Temp $pos $Len
		getText $Temp $FIGHTERS_MAX "Fighters:" "Offensive"
		stripText $FIGHTERS_MAX " "
		stripText $FIGHTERS_MAX ","
		getWordPos $Temp $pos "Offensive"
		CutText $Temp $Temp $pos 999
		getText $Temp $OFF_ODDS "Odds:" ":1"
		stripText $OFF_ODDS " "
		stripText $OFF_ODDS "."
		pause
	:TPW_DOdds
		setVar $Temp CURRENTLINE
		getText $Temp $TPW "Warp:" "Defensive"
		stripText $TPW " "
		stripText $TPW ","
		getWordPos $temp $pos "Defensive"
		getLength $Temp $len
		cutText $Temp $Temp $pos $len
		getText $Temp $DEF_ODDS "Odds:" ":1"
		stripText $DEF_ODDS " "
		stripText $DEF_ODDS "."
		pause
	:FigsPERAttack
		setVar $Temp CURRENTLINE
		getText $Temp $SHIP_MAX_ATTACK "Attack:" "TransWarp"
		stripText $SHIP_MAX_ATTACK " "
		stripText $SHIP_MAX_ATTACK ","
		pause
	:Stats_Done
		killAllTriggers
		setVar $Ship_IG "None"
		send "I"
		SetTextLineTrigger		Ship_IG		:Ship_IG	"Interdictor ON :"
		SetTextLineTrigger		Info_Done	:Info_Done	"Credits        :"
		pause
		:Ship_IG
			killTrigger Ship_IG
			getWordPos CURRENTLINE $pos ": No"
			if ($Pos <> 0)
				setVar $Ship_IG "Off"
				pause
			end
			getWordPos CURRENTLINE $pos ": Yes"
			if ($pos <> 0)
				setVar $Ship_IG "On"
				pause
			end
			pause
		:Info_Done
			killAllTriggers
	return
:Menu_Top
	LoadVar $LSDrop_Kill
	isNumber $tst $LSDrop_Kill
	if ($tst = 0)
		setVar $LSDrop_Kill 0
		saveVar $LSDrop_Kill
	end
	setVar $reaction $LSDrop_Kill

	LoadVar $LSDrop_Sensi
	isNumber $tst $LSDrop_Sensi
	if ($tst = 0)
		setVar $LSDrop_Sensi 1000
		saveVar $LSDrop_Sensi
	elseif ($LSDrop_Sensi = 0)
		setVar $LSDrop_Sensi 1000
		saveVar $LSDrop_Sensi
	end
	setVar $Sensi $LSDrop_Sensi

	LoadVar $LSDrop_Return
	isNumber $tst $LSDrop_Return
	if ($tst = 0)
		setVar $LSDrop_Return 0
		saveVar $LSDrop_Return
	end
	SetVar $Return $LSDrop_Return

	LoadVar $LSDrop_Contin
	isNumber $tst $LSDrop_Contin
	if ($tst = 0)
		setVar $LSDrop_Contin 0
		saveVar $LSDrop_Contin
	end
	SetVar $Continuous $LSDrop_Contin

	LoadVar $LSDrop_ORELVL
	isNumber $tst $LSDrop_ORELVL
	if ($tst = 0)
		setVar $LSDrop_ORELVL 0
		saveVar $LSDrop_ORELVL
	end
	SetVar $Safety_ORE $LSDrop_ORELVL

	LoadVar $LSDrop_FIGLVL
	isNumber $tst $LSDrop_FIGLVL
	if ($tst = 0)
		setVar $LSDrop_FIGLVL 0
		saveVar $LSDrop_FIGLVL
	end
	Echo "**"
	Echo ("    "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
	Echo "*     " & $TagLineC & "*"
	Echo ANSI_12&"               Version "&$TagVersion&"*"
	Echo ("    "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
	Echo "*"
    Echo ANSI_14 & "       1" & ANSI_15 & " Kill Type     " & ANSI_14 & ": " & ANSI_11
    if ($reaction = 0)
    	Echo "Do Nothing*"
    elseif ($reaction = 1)
    	Echo "CitKill*"
    elseif ($reaction = 2)
    	Echo "Lift Kill*"
    elseif ($reaction = 3)
    	Echo "Lift Only*"
    end
    Echo ANSI_14 & "       2" & ANSI_15 & " Sensitivity   " & ANSI_14 & ": " & ANSI_11 & $Sensi & ANSI_6 & " milliseconds*"
    Echo ANSI_14 & "       3" & ANSI_15 & " Auto Return   " & ANSI_14 & ": " & ANSI_11
    If ($Return)
    	Echo "Yes*"
    else
    	Echo "No*"
    end
    Echo ANSI_14 & "       4" & ANSI_15 & " Continuous    " & ANSI_14 & ": " & ANSI_11
    If ($Continuous)
    	Echo "Yes*"
    else
    	Echo "No*"
    end
    Echo ANSI_14 & "       5" & ANSI_15 & " ORE Safety Level " & ANSI_14 & ": " & ANSI_11
	if ($Safety_ORE = 0)
		Echo "None*"
	else
		setVar $CashAmount $Safety_ORE
		gosub :CommaSize
		Echo $CashAmount & "*"
	end
    Echo ANSI_14 & "       6" & ANSI_15 & " FIG Safety Level " & ANSI_14 & ": " & ANSI_11
    if ($Safety_FIGS = 0)
    	Echo "None*"
    else
		setVar $CashAmount $Safety_FIGS
		gosub :CommaSize
    	Echo $CashAmount & "*"
    end
    Echo ANSI_14 & "       7" & ANSI_15 & " Planet Stats*"
	Echo "*"
	Echo ANSI_14 & "       G" & ANSI_15 & " Go*"
	Echo ANSI_14 & "       Q" & ANSI_15 & " Quit*"
	:Try_Another
	getConsoleInput $s SINGLEKEY
	uppercase $S
	if ($S = "Q")
		Echo ("**" & $TagLineB & ANSI_12 & " Script Halted**")
		halt
	elseif ($S = "G")
		return
	elseif ($S = "1")
		if ($reaction = 0)
			setVar $reaction 1
		elseif ($reaction = 1)
			setVar $reaction 2
		elseif ($reaction = 2)
			setVar $reaction 3
		else
			setVar $reaction 0
		end
		SetVar $LSDrop_Kill $reaction
		SaveVar $LSDrop_Kill
	elseif ($S = "2")
		getInput $s	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Surround Detection Sensitivity ("&ANSI_6&"0 For Default"&ANSI_14&")?"
		isNumber $tst $s
		If ($tst = 0)
			setVar $s 0
		end
		if ($s < 1)
			setVar $s 0
		end
		if ($s > 3000)
			setVar $s 3000
		end
		if ($s = 0)
			setVar $s 1000
		end
		setVar $Sensi $s
		SetVar $LSDrop_Sensi $Sensi
		SaveVar $LSDrop_Sensi
	elseif ($S = "3")
		if ($Return)
			setVar $Return FALSE
		else
			setVar $Return TRUE
		end
		SetVar $LSDrop_Return $Return
		SaveVar $LSDrop_Return
	elseif ($S = "4")
		if ($Continuous)
			setVar $Continuous FALSE
		else
			setVar $Continuous TRUE
		end
		SetVar $LSDrop_Contin $Continuous
		SaveVar $LSDrop_Contin
	elseif ($S = "5")
		setVar $CashAmount $Planet_ORE
		gosub :CommaSize
		getInput $s	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Stop When Planet ORE Falls Below ("&ANSI_6&"Planet Has " & $CashAmount & ANSI_14&")?"
		isNumber $tst $s
		if ($tst = 0)
			setVar $s 0
		end
		if ($s < 1)
			setVar $s 0
		end
		if ($s > $Planet_ORE)
			setVar $s $Planet_ORE
		end
		setVar $Safety_ORE $s
		SetVar $LSDrop_ORELVL $Safety_ORE
		SaveVar $LSDrop_ORELVL
	elseif ($S = "6")
		setVar $CashAmount $Planet_FIG
		gosub :CommaSize
		getInput $s	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Stop When Planet FIGS Falls Below ("&ANSI_6&"Planet Has " & $CashAmount & ANSI_14&")?"
		isNumber $tst $s
		if ($tst = 0)
			setVar $s 0
		end
		if ($s < 1)
			setVar $s 0
		end
		if ($s > $Planet_FIG)
			setVar $s $Planet_FIG
		end
		setVar $Safety_FIGS $s
		SetVar $LSDrop_FIGLVL $Safety_FIGS
		SaveVar $LSDrop_FIGLVL
	elseif ($S = "7")
		Echo #27 & "[2J"
		Echo ("**" & $TagLineB & ANSI_15 & " Displaying Planet Info...**")
		send "Q*C"
		waitfor "<Enter Citadel>"
		waitfor "Citadel command (?="
	else
		goto :Try_Another
	end
	goto :Menu_Top

:Global_Grover
	setVar $PLANET				0
	setVar $PLANET_FUEL			0
	setVar $PLANET_FUEL_MAX		0
	setVar $PLANET_ORGANICS		0
	setVar $PLANET_ORGANICS_MAX	0
	setVar $PLANET_EQUIPMENT	0
	setVar $PLANET_EQUIPMENT_MAX	0
	setVar $PLANET_FIGHTERS		0
	setVar $PLANET_FIGHTERS_MAX	0
	setVar $CITADEL				0
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
	setVar $SCAN_TYPE 			"NONE"
	setVar $CURRENT_SECTOR 		0
	setVar $TURNS 			0
	setVar $CREDITS 		0
	setVar $FIGHTERS 		0
	setVar $SHIELDS 		0
	setVar $TOTAL_HOLDS 	0
	setVar $ORE_HOLDS 		0
	setVar $ORGANIC_HOLDS 	0
	setVar $EQUIPMENT_HOLDS 0
	setVar $COLONIST_HOLDS	0
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
	setVar $MINE_DISRUPTORS 0
	setVar $ALIGNMENT 		0
	setVar $EXPERIENCE		0
	setVar $CORP 			0
	setVar $SHIP_NUMBER		0
	setVar $TURNS_PER_WARP 	0

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
	setVar $ranks[11]	"31mAnnoyance"
	setVar $ranks[12]	"31mNuisance 3rd Class"
	setVar $ranks[13]	"31mNuisance 2nd Class"
	setVar $ranks[14]	"31mNuisance 1st Class"
	setVar $ranks[15]	"31mMenace 3rd Class"
	setVar $ranks[16]	"31mMenace 2nd Class"
	setVar $ranks[17]	"31mMenace 1st Class"
	setVar $ranks[18]	"31mSmuggler 3rd Class"
	setVar $ranks[19]	"31mSmuggler 2nd Class"
	setVar $ranks[20]	"31mSmuggler 1st Class"
	setVar $ranks[21]	"31mSmuggler Savant"
	setVar $ranks[22]	"31mRobber"
	setVar $ranks[23]	"31mTerrorist"
	setVar $ranks[24]	"31mInfamous Pirate"
	setVar $ranks[25]	"31mNotorious Pirate"
	setVar $ranks[26]	"31mDread Pirate"
	setVar $ranks[27]	"31mPirate"
	setVar $ranks[28]	"31mGalactic Scourge"
	setVar $ranks[29]	"31mEnemy of the State"
	setVar $ranks[30]	"31mEnemy of the People"
	setVar $ranks[31]	"31mEnemy of Humankind"
	setVar $ranks[32]	"31mHeinous Overlord"
	setVar $ranks[33]	"31mPrime Evil"
	setVar $ranks[34]	"36mChief Warrant Officer"
	setVar $ranks[35]	"36mWarrant Officer"
	setVar $ranks[36]	"36mEnsign"
	setVar $ranks[37]	"36mLieutenant J.G."
	setVar $ranks[38]	"36mLieutenant Commander"
	setVar $ranks[39]	"36mLieutenant"
	setVar $ranks[40]	"36mCommander"
	setVar $ranks[41]	"36mCaptain"
	setVar $ranks[42]	"36mCommodore"
	setVar $ranks[43]	"36mRear Admiral"
	setVar $ranks[44]	"36mVice Admiral"
	setVar $ranks[45]	"36mFleet Admiral"
	setVar $ranks[46]	"36mAdmiral"
	setVar $ENDLINE	"_ENDLINE_"
	setVar $STARTLINE	"_STARTLINE_"
	return
:CommaSize
	If ($CashAmount < 1000)
		#do nothing
	ElseIf ($CashAmount < 1000000)
    	getLength $CashAmount $len
		SetVar $len ($len - 3)
		cutText $CashAmount $tmp 1 $len
		cutText $CashAMount $tmp1 ($len + 1) 999
		SetVar $tmp $tmp & "," & $tmp1
		SetVar $CashAmount $tmp
	ElseIf ($CashAmount <= 999999999)
		getLength $CashAmount $len
		SetVar $len ($len - 6)
		cutText $CashAmount $tmp 1 $len
		SetVar $tmp $tmp & ","
		cutText $CashAmount $tmp1 ($len + 1) 3
		SetVar $tmp $tmp & $tmp1 & ","
		cutText $CashAmount $tmp1 ($len + 4) 999
		SetVar $tmp $tmp & $tmp1
		SetVar $CashAmount $tmp
	end
	return

:Decide
	gosub :quikstats
	if ($CURRENT_PROMPT = "Command")
		send ("  **  L Z" & #8 & $Planet_Number & "* *  J  C  *  * ")
		setTextLineTrigger	Landed		:Landed		"Enter Citadel"
		setTextTrigger		NotLanded	:NotLanded	"Are you sure you want to jettison all cargo"
		setDelayTrigger		LandDelay	:NotLanded	3000
		pause
		:NotLanded
			killAllTriggers
			send ("'" & $TagLineA & " Landing Error, Script Halted!*")
		    waitfor "(?="
		    halt
		:Landed
			killAllTriggers
	elseif ($CURRENT_PROMPT = "Citadel")
	else
		send ("'" & $TagLineA & " Landing Error, Unknown Problem!*")
		halt
	end
	if (($Return) AND ($CURRENT_SECTOR <> $StartSector))
		send (" P" & $StartSector & "*y")
		setTextLineTrigger pwarp_lock 		:pwarp_lock 		"Locating beam pinpointed"
		setTextLineTrigger no_pwarp_lock 	:no_pwarp_lock 	"Your own fighters must be"
		setTextLineTrigger already				:already				"You are already in that sector!"
		setTextLineTrigger no_ore				:no_pwarp_lock 	"You do not have enough Fuel Ore"
		pause
		:no_pwarp_lock
			killAllTriggers
			send ("'" & $TagLineA & " Unable To Return To Start Sector -No Fig Lock*")
			halt
		:pwarp_lock
			killAllTriggers
			waitFor "Planet is now in sector"
			send ("'" & $TagLineA & " Planet Returned To Starting Sector*")
		:already
			killAllTriggers
	end

	if ($Continuous)
		gosub :GetPlanet_Info
		if ($Safety_ORE <> 0)
			if ($Planet_ORE < $Safety_ORE)
				send ("'" & $TagLineA & " Script Halted (Planet ORE-Level Is Too Low)*")
				halt
			end
		end
		if ($Safety_FIGS <> 0)
			if ($Planet_FIG < $Safety_FIGS)
				send ("'" & $TagLineA & " Script Halted (Planet FIG-Level Is Too Low)*")
				halt
			end
    	end
		goto :Again
	else
		send ("'" & $TagLineA & " Script Halted (Not In Continuous Mode)*")
	end

