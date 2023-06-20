setVar $TagLineB			(ANSI_9&"["&ANSI_14&"LDrop"&ANSI_9&"]" & ANSI_15 & " ")
setVar $TagLineC			"LoneStar's Death Tracker 2000"
setVar $TagVersion			"1.0"
setVar $Active_CNT			0
setVar $POSITION			0
setVar $reaction			0
setVar $Planet_ORE_Min 		10000
setVar $SAFETY_ORE			$Planet_ORE_Min
setVar $RETURN				FALSE
setArray $Sects				SECTORS 5
setArray $Figs				SECTORS

gosub :START_UP
Echo "***              " & $TagLineB & "  !!POWERING UP!!  " & $TagLineB & "**"
gosub :Read_In_Figs
:_MENU_
killAllTriggers

Echo "**"
Echo ("      "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
Echo "*        " & $TagLineC & "*"
Echo ANSI_12&"                 Version "&$TagVersion&"*"
Echo ("      "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
Echo "*"
Echo ANSI_14 & "       A)" & ANSI_15 & " Get Active Limp Scan*"
if ($Active_CNT <> 0)
Echo ANSI_14 & "       B)" & ANSI_15 & " Track Which Active Limp*"
	setVar $IDX 1
	while ($IDX <= $Active_CNT)
		if ($IDX = $POSITION)
			Echo "         " & ANSI_15 & $IDX & #9 & ANSI_14 & $ActiveLimps[$idx] & "*"
		else
			Echo "         " & ANSI_15 & $IDX & #9 & ANSI_15 & $ActiveLimps[$idx] & "*"
		end
		add $IDX 1
	end
end
Echo ANSI_14 & "       C)" & ANSI_15 & " Kill Type     " & ANSI_14 & ": " & ANSI_11
    if ($reaction = 0)
    	Echo "Do Nothing*"
    elseif ($reaction = 1)
    	Echo "CitKill*"
    elseif ($reaction = 2)
    	Echo "Lift Kill*"
    elseif ($reaction = 3)
    	Echo "Lift Only*"
    end
SetVar $CashAmount $SAFETY_ORE
gosub :CommaSize
Echo ANSI_14 & "       O)" & ANSI_15 & " Planet ORE Min" & ANSI_14 & ": " & $CashAmount & "*"
Echo ANSI_14 & "       R)" & ANSI_15 & " Auto Return   " & ANSI_14 & ": " & ANSI_11
	if ($RETURN)
		Echo "Yes*"
	else
		Echo "No*"
	end
Echo ANSI_14 & "       P)" & ANSI_15 & " Pause*"
Echo ANSI_14 & "       Q)" & ANSI_15 & " Quit*"
Echo "*"&#27&"[K      "&$TagLineB&#8&ANSI_12&">"
setTextOutTrigger	FILTER	:FILTER
if ($TRACKING <> 0) AND ($POSITION <> 0)
setTextLineTrigger	FigHit		:FigHit	"Deployed Fighters Report Sector"
setTextLineTrigger	Mines		:Mines	"Your mines in"
setTextLineTrigger	Limp		:Limp	"Limpet mine in"
end
setTextLineTrigger	PROMPT		:PROMPT "Citadel command (?"

pause
:PROMPT
killAllTriggers
goto :_MENU_
:FigHit
killAllTriggers
getWord CURRENTLINE $Hit_Sector 5
getWord CURRENTANSILINE $ansi 6
cutText $ansi $num 10 2
stripText $Hit_Sector ":"
isNumber $tst $Hit_Sector
if (($num <> 33) AND ($tst <> 0))
	goto :LIMP_SCAN
end
goto :_MENU_
:Mines
killAllTriggers
getWord CURRENTLINE $Hit_Sector 4
getWord CURRENTANSILINE $ansi 9
cutText $ansi $num 10 2
stripText $Hit_Sector ":"
if ($num <> 33)
	goto :LIMP_SCAN
end
goto :_MENU_
:Limp
killAllTriggers
getWord CURRENTLINE $ck 1
if ($ck <> "Limpet")
	goto :_MENU_
end
getWord CURRENTLINE $Hit_Sector 4
goto :LIMP_SCAN

:LIMP_SCAN
killAllTriggers
setVar $idx 1
setVar $Active_CNT 0
send " | Q Q K 2 L Z " & #8 & #8 & #8 & #8 & $Planet_Number & "* * J C * D | "
waitfor "Sector    Personal/Corp"
waitfor "===================="
setTextLineTrigger	LimpDone2	:xLimpDone2	"Total"
setTextLineTrigger	LimpNone2	:xLimpNone2	"No Active Limpet mines detected"
setTextLineTrigger	LimpLine	:xLimpLine
pause
:xLimpLine
if ($idx <= 9)
	setVar $ActiveLimps[$idx] CURRENTLINE
	add $Active_CNT 1
	add $idx 1
end
setTextLineTrigger	LimpLine	:xLimpLine
pause
:xLimpNone2
killAllTriggers
echo "**" & $TagLineB & "No Limps Deployed.**"
halt
:xLimpDone2
killAllTriggers
setTextLineTrigger	LANDED	:xLANDED 		"Citadel command (?=help) D"
setTextLineTrigger	Not_1	:xNOTLANDED		"Are you sure you want to jettison all cargo"
setTextLineTrigger	Not_2	:xNOTLANDED		"The Federation does not allow cargo dumping"
pause
:xNOTLANDED
	killAllTriggers
	gosub :MSGS_ON
	echo "**" & $TagLineB & "Unable To Reland On Planet #" & $Planet_Number & "**"
	halt
:xLANDED
	killAllTriggers
	if ($Active_CNT = 0)
		echo "**     " & $TagLineB & "No Active Limps Found."
		setVar $Active_CNT 0
		setVar $POSITION 0
		goto :_MENU_
	end

	if ($ActiveLimps[$POSITION] <> 0)
		GetWord $ActiveLimps[$POSITION] $Hit_Sector 1
		#Echo "**" $Sects[$Hit_Sector] "," $Sects[$Hit_Sector][2] "," $Sects[$Hit_Sector][3] "," $Sects[$Hit_Sector][4] "," $Sects[$Hit_Sector][5] "**"
		if ($Sects[$Hit_Sector] <> 0)
			send ("p "& $Sects[$Hit_Sector] & "*  y  ")
			killAllTriggers
			send "/"
			waiton #179 & "Turns"
			getText CURRENTLINE $CURRENT_SECTOR "Sect" (#179 & "Turns")
			stripText $CURRENT_SECTOR " "
			if ($CURRENT_SECTOR = $Sects[$Hit_Sector])
				if ($Reaction = 1)
					gosub :getSectorData
					if ($realTraderCount > 0)
						goSub :fastCitadelAttack
					else
						Echo ("***" & $TagLineB & "Waiting 2 seconds for a Target**")
						setTextLineTrigger	1	:citkill	"warps into the sector"
						setTextLineTrigger	2	:citkill	"The Interdictor Generator on"
						setTextLineTrigger	3	:citkill	"Quasar Cannon on"
						setDelayTrigger		4	:nokill		2000
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
				elseif ($Reaction = 2)
					send "Q Q  "
					gosub :getSectorData
					if ($realTraderCount > 0)
						gosub :fastAttack
					else
						Echo ("**" & $TagLineB & ANSI_15 & " Waiting 2 seconds for a Target**")
						setTextLineTrigger	5	:sectkill	"warps into the sector"
						setTextLineTrigger	6	:sectkill	"The Interdictor Generator on"
						setTextLineTrigger	7	:sectkill	"Quasar Cannon on"
						setDelayTrigger		8	:nosectkill	2000
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
							setTextLineTrigger	skLANDED	:skLANDED 			"Citadel command (?=help) D"
							setTextLineTrigger	skNot_1		:skNOTLANDED		"Are you sure you want to jettison all cargo"
							setTextLineTrigger	skNot_2		:skNOTLANDED		"The Federation does not allow cargo dumping"
							pause
							:skNOTLANDED
							killAllTriggers
							gosub :MSGS_ON
							echo "**" & $TagLineB & "Unable To Reland On Planet #" & $Planet_Number & "**"
							halt
							:skLANDED
							killAllTriggers
					end
					GoTo	:Decide
				elseif ($Reaction = 3)
					send ("Q  Q  **  ")
					gosub :MSGS_ON
					halt
				else
					Echo ("***" & $TagLineB & "Waiting 2 seconds for a Target**")
					setDelayTrigger	Decide_Delay	:Decide_Delay	2000
					pause
					:Decide_Delay
					killAllTriggers
				end
				goto :Decide
			end
			goto :_MENU_
		end
	else
		echo "**" & $TagLineB & "Active Limp No Longer Present**"
		setVar $Active_CNT 0
		setVar $POSITION 0
	end
	goto :_MENU_

:FILTER
killAllTriggers
getOutText $S
uppercase $S
if ($S = "Q")
	killAllTriggers
	echo "**" & $TagLineB & ANSI_12 & "Script Halted" & ANSI_15 & "**"
	halt
elseif ($S = "O")
	SetVar $CashAmount $Planet_ORE
	gosub :CommaSize
	getInput $s	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*" & $TagLineB & "Stop If ORE Drops Below What Amount (" & ANSI_6 & "Planet Has " & $CashAmount & ANSI_14 & ")?"
	isNumber $tst $s
	If ($tst = 0)
		SetVar $s $Planet_ORE_Min
	end
	If ($s > $Planet_ORE)
		SetVar $s $Planet_ORE
	ElseIf ($s < $Planet_ORE_Min)
		SetVar $s $Planet_ORE_Min
	end
	SetVar $SAFETY_ORE $s
elseif ($S = "R")
	if ($RETURN)
		setVar $RETURN FALSE
	else
		setVar $RETURN TRUE
	end
elseif ($S = "P")
	send "/"
	:Reminding
	echo "**" & ANSI_14 & "                "&$TagLineB&ANSI_14&" Paused Press "&ANSI_15&"+"&ANSI_14&" to reactivate!**"
	setTextLineTrigger	NewShip	:NewShip	"Security code accepted, engaging transporter control."
	setDelayTrigger		Remind	:Remind 	200000
	setTextOutTrigger	Pasued	:Paused 	"+"
	pause
	:NewShip
		killAllTriggers
		echo "**" & $TagLineB & "Ship Change Detected, Halting!**"
		halt
	:Remind
		killAllTriggers
		goto :Reminding
	:Paused
		killAllTriggers
		gosub :quikstats
		if ($CURRENT_PROMPT <> "Citadel")
			echo "**" & $TagLineB & "Incorrect Prompt!**"
			halt
		end
		goto :_MENU_

elseif ($S = "A")
	killAllTriggers
	SetVar $TRACKING 0
	SetVar $POSITION 0
	setArray $ActiveLimps 10
	setVar $Active_CNT	0
	setVar $idx 1
	send " Q Q K 2 L Z " & #8 & #8 & #8 & #8 & $Planet_Number & "* * J C * D  "
	waitfor "Sector    Personal/Corp"
	waitfor "===================="
	setTextLineTrigger	zLimpDone2	:zLimpDone2	"Total"
	setTextLineTrigger	zLimpNone2	:zLimpNone2	"No Active Limpet mines detected"
	setTextLineTrigger	zLimpLine	:zLimpLine
	pause
	:zLimpNone2
	killAllTriggers
	echo "**" & $TagLineB & "No Limps Deployed.**"
	halt

	:zLimpLine
	if ($idx <= 10)
		setVar $ActiveLimps[$idx] CURRENTLINE
		add $Active_CNT 1
		add $idx 1
	end
	setTextLineTrigger	zLimpLine	:zLimpLine
	pause
	:zLimpDone2
	killAllTriggers
	setTextLineTrigger	LANDED	:LANDED 		"Citadel command (?=help) D"
	setTextLineTrigger	Not_1	:NOTLANDED		"Are you sure you want to jettison all cargo"
	setTextLineTrigger	Not_2	:NOTLANDED		"The Federation does not allow cargo dumping"
	pause
	:NOTLANDED
		killAllTriggers
		echo "**" & $TagLineB & "Unable To Reland On Planet #" & $Planet_Number & "**"
		halt
	:LANDED
		killAllTriggers
		if ($Active_CNT = 0)
			echo "**     " & $TagLineB & "No Active Limps Found."
			setVar $Active_CNT 0
			setVar $POSITION 0
		end
		gosub :MSGS_ON
		goto :_MENU_
elseif ($S = "1") OR ($S = "2") OR ($S = "3") OR ($S = "4") OR ($S = "5") OR ($S = "6") OR ($S = "7") OR ($S = "8") OR ($S = "9")
	killAllTriggers
	if ($ActiveLimps[$S] <> 0)
		getWord $ActiveLimps[$S] $TRACKING 1
		SetVar $POSITION $S
		Echo "***" & $TagLineB & "Tracking Active Limp Number " & $POSITION & ", Currently in Sector " & $TRACKING & "*"
	end
elseif ($S = "C")
	if ($reaction = 0)
		setVar $reaction 1
	elseif ($reaction = 1)
		setVar $reaction 2
	elseif ($reaction = 2)
		setVar $reaction 3
	else
		setVar $reaction 0
	end
end
goto :_MENU_
return
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
:getSectorData
	killalltriggers
	if ($Reaction = 2)
		send "  **  "
	else
		send "s* "
	end
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
:Decide
	gosub :quikstats
	if ($CURRENT_PROMPT <> "Citadel")
		echo "**" & $TagLineB & "Must Start From A Citadel!**"
		halt
	end
	if ($RETURN)
		send "P" & $Start_Sector & "*  Y  "
		waitfor "Citadel command (?"
	end
	gosub :GetPlanet_Info
	if ($Planet_ORE < $SAFETY_ORE)
		echo "**" & $TagLineB & "Planet ORE has fallen below "&$SAFETY_ORE&"**"
		gosub :MSGS_ON
		halt
	end
	gosub :MSGS_ON
	goto :_MENU_
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

:START_UP
	gosub :Global_Grover
	gosub :quikstats
	if ($CURRENT_PROMPT <> "Citadel")
		echo "**" & $TagLineB & "Must Start From A Citadel!**"
		halt
	end
	gosub :MSGS_ON
	setVar $Start_Sector $CURRENT_SECTOR

	send "I"
	waitfor "Turns left     :"
	getWord CURRENTLINE $TURN_FLAG 4
	if ($TURN_FLAG = "Unlimited")
		setVar $UNLIM TRUE
	else
		setVar $UNLIM FALSE
	end

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
	send " SZ*  Q  M  N  T  *  C  C  U  Y  Q"
	waitfor "<Computer deactivated>"
	waitfor "Citadel command (?="

	gosub :GetPlanet_Info
	gosub :GetShip_Info

	if ($Planet_Number = 0)
		Echo ("**" & $TagLineB & "Unable To Obtain Planet Number.**")
		halt
	end
	if ($Planet_ORE	< $Planet_ORE_Min)
		Echo ("**" & $TagLineB & "Planet Has Too Little Fuel ORE**")
		halt
	end

	if ($Planet_Level < 4)
		Echo ("**" & $TagLineB & "Planet Must Be At Least a Level 4.**")
		halt
	end

	return

:GetPlanet_Info
	send " qdc  "
	waitfor "You leave the citadel and return to your ship."
	setTextLineTrigger	PlanetNumber	:PlanetNumber 	"Planet #"
	setTextLineTrigger	PlanetLevel		:PlanetLevel	"Planet has a level"
	setTextLineTrigger	PlanetORE		:PlanetOre		"Fuel Ore"
	setTextLineTrigger	PlanetFIG		:PlanetFIG		"Fighters        N/A"
	setTextLineTrigger	PlanetTPort		:PlanetTPort	"-=-=-=-=-=- TransPort power ="
	setTextLineTrigger	PlanetShields	:PlanetShields	"Planetary Defense Shielding Power"
	setTextTrigger 		PlanetCIT		:PlanetCIT		"Citadel command (?"
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
		setVar $SAFETY_ORE ($Planet_ORE / 2)
    	pause
	:PlanetFIG
		killTrigger PlanetFIG
		getWord CURRENTLINE $Planet_FIG 5
		stripText $Planet_FIG ","
		pause
	:PlanetCIT
		killAllTriggers
		return

:GetShip_Info
	send " c ;q  "
	waitFor "Max Fighters:"
	setVar $MAX_FIGS CURRENTLINE
	replaceText $MAX_FIGS ":" " "
	getword $MAX_FIGS $MAX_FIGS 7
	stripText $MAX_FIGS ","

	getWordPos CURRENTLINE $pos "Offensive"
	cutText CURRENTLINE $oddline $pos 99
	getText $oddline $offodd "Odds:" ":1"
	stripText $offodd " "
	stripText $offodd "."

	waitfor "Max Figs Per Attack:"
	getWord CURRENTLINE $SHIP_MAX_ATTACK 5
	stripText $SHIP_MAX_ATTACK ","
	isNumber $tst $SHIP_MAX_ATTACK
	if ($tst = 0)
		setVar $SHIP_MAX_ATTACK "99999"
	end
	multiply $offodd $SHIP_MAX_ATTACK
	divide $offodd 12
	return

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
:Read_In_Figs
	setArray $Sects				SECTORS 5

	Echo ("**" & $TagLineB & "Reading Fighter Data & Building Arrays... ")
	setVar $idx 11
	while ($idx <= SECTORS)
		getSectorParameter $idx "FIGSEC" $flag
		isNumber $tst $flag
		if ($tst = 0)
			Echo "**" & $TagLineB & "FIGSEC Parameter Incommplete. Update Figs.**"
			halt
		end
       	add $idx 1
	end

	setVar $idx 11
	setVar $FCnt 0

	while ($idx <= SECTORS)
		setVar $i 1
		setVar $ptr 0

#		getSectorParameter $idx "FIGSEC" $flag
#		if ($flag <> 0)
			while ($i <= SECTOR.WARPCOUNT[$idx])
				setVar $adj SECTOR.WARPS[$idx][$i]
				getSectorParameter $adj "FIGSEC" $flag
				if (($flag <> 0) AND ($ptr <= 5))
					if ($ptr = 0)
						setVar $Sects[$idx] $adj
					else
						setVar $Sects[$idx][$ptr] $adj
					end
					add $ptr 1
				end
				add $i 1
			end
			add $FCnt 1
#		end
		add $idx 1
	end
	if ($FCnt = 0)
		Echo "**" & $TagLineB & "No Deployed Fighter Data Located. Update FIG List!**"
		halt
	else
		Echo "(Deployed Fighters: " & ANSI_14 & $FCnt & ANSI_15 & ")**"
	end
	return

:Clear_Sector
	if ($Hit_Sector <> 0)
		setVar $i 1
		setVar $ptr $Sects[$Hit_Sector]
		while ($i <= 5)
			if ($ptr <> 0)
				if ($Sects[$ptr] = $Hit_Sector)
					setVar $Sects[$ptr] $Sects[$ptr][1]
					setVar $Sects[$ptr][1] $Sects[$ptr][2]
					setVar $Sects[$ptr][2] $Sects[$ptr][3]
					setVar $Sects[$ptr][3] $Sects[$ptr][4]
					setVar $Sects[$ptr][4] $Sects[$ptr][5]
					setVar $Sects[$ptr][5] 0
				else
					setVar $j 1
					while ($j < 5)
			    		if (($Sects[$ptr][$j] = $Hit_Sector) OR ($Sects[$ptr][$j] = 0))
		                	#if ($j = 1)
							#	setVar $Sects[$ptr] $Sects[$ptr][$j]
							#	setVar $Sects[$ptr][$j] 0
							#else
								setVar $Sects[$ptr][$j] $Sects[$ptr][($j+1)]
								setVar $Sects[$ptr][($j+1)] 0
							#end
						end
						add $j 1
					end

				end
			end
			setVar $ptr $Sects[$Hit_sector][$i]
			add $i 1
		end
		setVar $Sects[$Hit_Sector]		0
		setVar $Sects[$Hit_Sector][1]	0
		setVar $Sects[$Hit_Sector][2]	0
		setVar $Sects[$Hit_Sector][3]	0
		setVar $Sects[$Hit_Sector][4]	0
		setVar $Sects[$Hit_Sector][5]	0
	end
	return

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