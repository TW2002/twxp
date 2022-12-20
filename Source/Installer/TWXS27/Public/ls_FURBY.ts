	#	This Script is designed to Find an adj FIG to Fed (1 to 10), using SectorParams.
	#	It will Twarp to a jump point (obviously for Reds), mow to sect 1, buy holds and
	#	Blind Twarp back.
	setVar $TagLineA 			"[FURBY]"
	setVar $TagLineB			(ANSI_9&"["&ANSI_14&"FURBY"&ANSI_9&"]")
	setArray $Found 50
	setArray $TDist 50

	gosub :quikstats

	setVar $CRDS $CREDITS
	setVar $FIGS $FIGHTERS
	setVar $SHLD $SHIELDS

	if ($CURRENT_SECTOR <= 10) OR ($CURRENT_SECTOR = STARDOCK)
		Echo "**"&$TAGLINEB&ANSI_15&" Can't Run FURBY From Fed Space.**"
		halt
	end
	if ($CURRENT_PROMPT <> "Command")
		Echo "**"&$TAGLINEB&ANSI_15&" Wrong Prompt**"
		halt
	end
	if ($TWARP_TYPE = "No")
		echo "**"&$TAGLINEB&ANSI_15&" No Twarp**"
		halt
	end

	if ($ORE_HOLDS = 0)
		Echo "**"&$TAGLINEB&ANSI_15&" No Gas**"
		halt
	end
	send "  **   "
	waiton "Warps to Sector(s) :"
	send "I"
	waitfor "Turns to Warp  :"
	getWord CURRENTLINE $TPW 5
	waitfor "Turns left     :"
	getWord CURRENTLINE $UNLIM 4
	isNumber $tst $UNLIM
	if ($tst = 0)
		setVar $UNLIM TRUE
	else
		setVar $UNLIM FALSE
	end
	waiton "Credits        :"
	if (SECTOR.FIGS.QUANTITY[$CURRENT_SECTOR] = 0)
		Echo "**"&$TAGLINEB&ANSI_15&" No Figs In Current Sector!**"
		halt
	end
	if (SECTOR.FIGS.OWNER[$CURRENT_SECTOR] <> "belong to your Corp") AND (SECTOR.FIGS.OWNER[$CURRENT_SECTOR] <> "yours")
		Echo "**"&$TAGLINEB&ANSI_15&" No Friendly Figs in Current Sector**"
		halt
	end

	setVar $idx 10
	setVar $ptr 0
	while ($idx > 1)
    	setVar $i 1
    	while (SECTOR.WARPS[$idx][$i] <> 0)
        	setVar $Fed SECTOR.WARPS[$idx][$i]
        	getSectorParameter $Fed "FIGSEC" $Flag
        	isNumber $tst $Flag
        	if ($tst = 0)
        		setVar $Flag 0
        		setSectorPArameter $Fed "FIGSEC" FALSE
        	end
			if ($Flag)
				add $ptr 1
				setVar $Found[$ptr] $Fed
				if ($CURRENT_SECTOR  = $Fed)
					setVar $D1 1
				else
					getDistance $D1 $CURRENT_SECTOR $Fed
					if ($D1 = "-1")
						setVar $From $CURRENT_SECTOR
						SetVar $To $FED
						gosub :getCourse
						SetVar $D1 $courseLength
						if ($D1 = "-1")
							Echo "**"&$TAGLINEB&ANSI_15&" Something's Wrong, can't Calculate Trip To Fed**"
							halt
						end
					end
				end
				getDistance $D2 1 $CURRENT_SECTOR
				if ($D2 = "-1")
					setVar $From 1
					SetVar $To $CURRENT_SECTOR
					gosub :getCourse
					SetVar $D2 $courseLength
					if ($D2 = "-1")
						Echo "**"&$TAGLINEB&ANSI_15&" Something's Wrong, can't Calculate Return Trip**"
						halt
					end
				end
				if (($D1 + $D2) > 0)
					SetVar $TDist[$ptr] ($D1 + $D2)
				end
			end
			add $i 1
		end
		subtract $idx 1
	end

	#got data hopefully, now lets find the closest
	setVar $i 1
	if ($ptr <> 0)
		setVar $Temp $TDist[1]
		setVar $To $Found[1]
		while ($i <= $ptr)
			if ($TDist[$i] < $Temp)
				setVar $Temp $TDist[$i]
				setVar $To $Found[$i]
			end
			add $i 1
		end
	else
		Echo "**"&$TAGLINEB&ANSI_15&" No Jump Sector Found**"
		halt
	end

	if ($ORE_HOLDS < ($Temp * 3))
		Echo "**"&$TAGLINEB&ANSI_15&" Not Enough Gas For Round Trip, "&$TEMP*3&" Ore is needed**"
		halt
	end
	if ($Temp <> 0) AND ($To <> 0)
		if ($UNLIM = 0)
			setVar $Turns_REQ ($TPW * $Temp)
			if ($Turns_REQ >= $TURNS)
				Echo "**"&$TAGLINEB&ANSI_15&" Not Enough Turns For Furb**"
				halt
			end
		end
		setVar $From $To
		setVar $To 1
		gosub :getCourse
        if ($courseLength <> 0)
			setVar $j 1
			setVar $result ""
			while ($j <= $courseLength)
				setVar $result $result&" m"&$COURSE[$j]&"*  "
				add $j 1
			end
			setVar $result $Result&" P T Y"
		end
	else
		Echo "**"&$TAGLINEB&ANSI_15&" Unable To Make A MOW-Course**"
		halt
	end

	send " C R 1*Q "
	setTextLineTrigger	itsalive 	:itsalive		"A  Cargo holds     :"
	setTextLineTrigger	nosoupforme	:nosoupforme	"I have no information about a port in that sector"
	setDelayTrigger		WeHaveAProb	:WeHaveAProb	3000
	pause
	:WeHaveAProb
	killAllTriggers
	Echo "**"&$TAGLINEB&ANSI_15&" Script Timed Out**"
	halt
	:nosoupforme
	killAllTriggers
	Echo "**"&$TAGLINEB&ANSI_15&" Terra BLOWN**"
	halt

    :itsalive
    killAllTriggers
    if ($CURRENT_SECTOR = $destination)
		goto :Sector__Good
	end

	processout "C V 0* Y N " & $From & "* V 0* Y N "&$CURRENT_SECTOR&"* U Y Q '"&$TAGLINEA&" JMP POINT "&$From&"*   M"&$From&"*Y"
    setTextLineTrigger		Sector__Good	:Sector__Good_T	"Locating beam pinpointed, TransWarp"
	setTextLineTrigger		Sector__Here	:Sector__Good	"NavPoint Settings (?=Help)"
	setTextLineTrigger		Sector__Bad		:Sector__Bad	"No locating beam found"
	setTextTrigger			Sector__Far		:Sector__Far	"You do not have enough Fuel Ore to make the jump."
	pause
	:Sector__Far
		killAllTriggers
		Echo "**"&$TAGLINEB&ANSI_15&" Sector To Far**"
		halt
	:Sector__Bad
		killAllTriggers
		Echo "**"&$TAGLINEB&ANSI_15&" Fig Gone**"
		send " zn * "
		halt
	:Sector__Good_T
		killAllTriggers
		processout "Y"
	:Sector__Good
		killAllTriggers
		processout "  *  " & $result
		setVAR $LIMPD	FALSE
		setTextLineTrigger		DeLimpd	:DeLimpd	"(Y/N) Yes"
		setTextLineTrigger		MadeIT	:MadeIT		"A  Cargo holds     :"
		setDelayTrigger			Nope	:Nope		3000
		pause
		:DeLimpd
		setVar $LIMPD TRUE
		pause
		:Nope
		killAllTriggers
		Echo "**"&$TAGLINEB&ANSI_15&" Hmmm..  Didn't Make It?**"
		halt
		:MadeIT
		killAllTriggers
		GetWord CURRENTLINE $Buy 10
		stripText $Buy " "
		stripText $Buy ","
		processout "A"&$Buy&"*YQ  M" & $CURRENT_SECTOR & "* Y Y  /"

		waiton #179 & "Turns"
		setVar $TMP CURRENTLINE
		getText $TMP $CS "Sect" (#179&"Turns")
		stripText $CS " "

		getText $TMP $CREDITS (#179 & "Creds") (#179 & "Figs")
		stripText $CREDITS " "
		stripText $CREDITS ","

		if ($CS <> $CURRENT_SECTOR)
			send "'"&$TAGLINEA&" Didn't Make It Back*"
			waitfor "Message sent on sub-space channel"
			send "'" & $CS & "=saveme*"
			halt
		end

		getText $TMP $FIGHTERS (#179 & "Figs") (#179 & "Shlds")
		stripText $FIGHTERS ","
		stripText $FIGHTERS " "

		getText $TMP $SHIELDS (#179 & "Shlds") (#179 & "Hlds")
		stripText $SHIELDS " "
		stripText $SHIELDS ","

		Echo "***"
		if ($FIGS <> $FIGHTERS)
			SetVar $CashAmount ($FIGS - $FIGHTERS)
			gosub :CommaSize
        	Echo $TAGLINEB & ANSI_15 & " Lost " & $CashAmount & " Fighters!*"
		end
		if ($SHLD <> $SHIELDS)
			SetVar $CashAmount ($SHLD - $SHIELDS)
			gosub :CommaSize
        	Echo $TAGLINEB & ANSI_15 & " Lost " & $CashAmount & " Shields!*"
		end

		SetVar $CashAmount ($CRDS - $CREDITS)
		gosub :CommaSize

		if ($LIMPD)
			send "'"&$TAGLINEA&" Spent $"&$CashAmount&" on " & $Buy & " Holds (LIMP Removed)*"
		else
			send "'"&$TAGLINEA&" Spent $"&$CashAmount&" on " & $Buy & " Holds*"
		end
		waitfor "Message sent on sub-space channel"


	halt


:quikstats
	SetVar $CURRENT_PROMPT 		"Undefined"
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
	send "^Q/"
	pause

	:allPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			SetVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt1 :allPrompts "(?="
		pause
	:secondaryPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			SetVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt2 :secondaryPrompts "(?)"
		pause
	:terraPrompts
		killtrigger prompt3
		killtrigger prompt4
		getWord currentansiline $checkPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			SetVar $CURRENT_PROMPT "Terra"
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
		SetVar $stats ""
		SetVar $wordy ""
	:statsline
		killtrigger statlinetrig
		killtrigger getLine2
		SetVar $line2 CURRENTLINE
		replacetext $line2 #179 " "
		striptext $line2 ","
		SetVar $stats $stats & $line2
		getWordPos $line2 $pos "Ship"
		if ($pos > 0)
			goto :gotStats
		else
			setTextLineTrigger getLine2 :statsline
			pause
		end

	:gotStats
		SetVar $stats $stats & " @@@"

		SetVar $current_word 0
		while ($wordy <> "@@@")
			if ($wordy = "Sect")
				getWord $stats $CURRENT_SECTOR   	($current_word + 1)
			elseif ($wordy = "Turns")
				getWord $stats $TURNS  				($current_word + 1)
				if ($UNLIM)
					SetVar $TURNS 68536
				end
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
				getWord $stats $GENESIS 	 		($current_word + 1)
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
				getWord $stats $EPROBES 	  		($current_word + 1)
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
				getWord $stats $CORP  	 			($current_word + 1)
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

:getCourse
	killalltriggers
	setVar $sectors ""
	setTextLineTrigger sectorlinetrig :sectorsline " > "
	send "^f"&$From&"*"&$To&"*nq"
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
	getWordPos $line $pos3 "*** Error"

	if (($pos > 0) OR ($pos2 > 0))
		setVar $courseLength 0
		return
	end
	getWordPos $line $pos " sector "
	getWordPos $line $pos2 "TO"
	if (($pos <= 0) AND ($pos2 <= 0))
		setVar $sectors $sectors & " " & $line
	end
	getWordPos $line $pos " "&$To&" "
	getWordPos $line $pos2 "("&$To&")"
	getWordPos $line $pos3 "TO"
	if ((($pos > 0) OR ($pos2 > 0)) AND ($pos3 <= 0))
		goto :gotSectors
	else
		setTextLineTrigger sectorlinetrig :sectorsline " > "
		setTextLineTrigger sectorlinetrig2 :sectorsline " "&$To&" "
		setTextLineTrigger sectorlinetrig3 :sectorsline " "&$To
		setTextLineTrigger sectorlinetrig4 :sectorsline "("&$To&")"
		setTextLineTrigger donePath :sectorsline "So what's the point?"
		setTextLineTrigger donePath2 :sectorsline ": ENDINTERROG"
	end
	pause

:gotSectors
	killAllTriggers
	setVar $COURSE 0
	setVar $sectors $sectors&" :::"
	setVar $courseLength 0
	setVar $index 1
	:keepGoing
	if ($sectors = " FM     :::")
		return
	end
	getWord $sectors $TEMPO $index
	while ($TEMPO <> ":::")
		if ($TEMPO <> "FM") AND ($TEMPO <> $From)
			add $courseLength 1
			setVar $COURSE[$courseLength] $TEMPO
		end
		add $index 1
		getWord $sectors $TEMPO $index
	end
	return

    :CommaSize
	if ($CashAmount < 1000)
		#do nothing
	elseif ($CashAmount < 1000000)
    	getLength $CashAmount $len
		setVar $len ($len - 3)
		cutText $CashAmount $tmp 1 $len
		cutText $CashAMount $tmp1 ($len + 1) 999
		setVar $tmp $tmp & "," & $tmp1
		setVar $CashAmount $tmp
	elseif ($CashAmount <= 999999999)
		getLength $CashAmount $len
		setVar $len ($len - 6)
		cutText $CashAmount $tmp 1 $len
		setVar $tmp $tmp & ","
		cutText $CashAmount $tmp1 ($len + 1) 3
		setVar $tmp $tmp & $tmp1 & ","
		cutText $CashAmount $tmp1 ($len + 4) 999
		setVar $tmp $tmp & $tmp1
		setVar $CashAmount $tmp
	end
	return
