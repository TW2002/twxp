systemscript
:test
killallTriggers
setVar $IDX 0
setVar $PLAYER_MAX 200
setArray $PLAYERS $PLAYER_MAX 6
setTextLineTrigger	CLV_GO	:CLV_GO	"Trade Wars 2002 Trader Rankings :"
setTextLineTrigger	WHOS		:WHOS		"Who's Playing"
pause
:WHOS
killAllTriggers
setVar $Blanks 0
setVar $IDX 0
setArray $PLAYERS $PLAYER_MAX 6

setTextLineTrigger	WLine		:WLine
pause

:WLine
killAllTriggers
setVar $TMP CURRENTLINE
setVar $ANSI CURRENTANSILINE
if ($TMP = "")
	add $Blanks 1
end
if ($BLANKS < 2)
	if ($TMP <> "")
		if ($IDX <= $PLAYER_MAX)
			add $IDX 1
			stripText $ANSI #10
			stripText $ANSI #13
			setVar $PLAYERS[$IDX][6] $ANSI
			getText $TMP $VALUE "[" "]"
			isnumber $tst $VALUE
			if ($tst)
				setVar $PLAYERS[$IDX][3] $VALUE
			else
				setVar $PLAYERS[$IDX][3] 999
			end
		end
	end
else
	setVar $i 1
	gosub :BUBBLE_SORT
	Echo "**"
	Echo ANSI_15 & "  --------------------------------------"
	setVar $CRLF $PLAYERS[$i][3]
	while ($i <= $IDX)
		if ($CRLF <> $PLAYERS[$i][3])
			Echo "*"
			setVar $CRLF $PLAYERS[$i][3]
		end
		Echo "*  " & $PLAYERS[$i][6]
		add $i 1
	end
	Echo ANSI_15 & "*  --------------------------------------"
	Echo "**"
	send "/"
	goto :test
end
setTextLineTrigger	WLine		:WLine
pause



:CLV_GO
killallTriggers
waiton "--- --------------------- -- ------------------------------"
setTextLineTrigger	LINE	:LINE
pause
:LINE
killalltriggers
setVar $TMP CURRENTLINE
setVar $ANSI CURRENTANSILINE
stripText $ANSI #10
stripText $ANSI #13
if ($TMP = "")
	killalltriggers
	waiton "Computer command [TL="
	setVar $i 1
	gosub :BUBBLE_SORT
	Echo "**" & ANSI_9
	Echo " #       Rank  Alignment Corp        Trader Name                Ship Type"
	Echo "*" & ANSI_15
	Echo "--- --------------------- -- ------------------------------ ------------------"
	Echo "*"
	setVar $CRLF $PLAYERS[$i][3]
	while ($i <= $IDX)
		if ($CRLF <> $PLAYERS[$i][3])
			Echo "*"
			setVar $CRLF $PLAYERS[$i][3]
		end
		Echo $PLAYERS[$i][6]&"*"
		add $i 1
	end
	Echo ANSI_15
	Echo "--- --------------------- -- ------------------------------ ------------------"
	Echo "**"
	send "/"
	goto :Test
end

if ($IDX < $PLAYER_MAX)
	add $IDX 1
   setVar $PLAYERS[$IDX] $TMP
	# Experience
	cutText $TMP $PLAYERS[$IDX][1] 5 9
	stripText $PLAYERS[$IDX][1] " "

	# Alignment
	cutText $TMP $PLAYERS[$IDX][2] 16 9
	stripText $PLAYERS[$IDX][2] " "

	# Corp
	cutText $TMP $PLAYERS[$IDX][3] 27 2
	stripText $PLAYERS[$IDX][3] " "

	# Experience
	cutText $TMP $PLAYERS[$IDX][4] 30 29

	# Corp
	cutText $TMP $PLAYERS[$IDX][5] 61 19

	# ANSI
	setVar $PLAYERS[$IDX][6] $ANSI
end
setTextLineTrigger	LINE	:LINE
pause

:BUBBLE_SORT
	setVar $SORTS 12345
	while ($SORTS <> 0)
		setVar $SORTS 0
		setVar $SORT 1
		while ($SORT < $IDX)
			setVar $THIS $PLAYERS[$SORT][3]
			isnumber $tst $THIS
			if ($tst = 0)
				setVar $THIS 1000
			end

			setVar $THAT $PLAYERS[($SORT + 1)][3]
			isnumber $tst $THAT
			if ($tst = 0)
				setVar $THAT 1000
			end

			if ($THIS > $THAT)
				gosub :SWAP_SPIT
				add $SORTS 1
			end
      	add $SORT 1
		end
	end
	return
:SWAP_SPIT
	setArray $HOLD 1 6
	setVar $PTR 1
	setVar $HOLD[1] $PLAYERS[($SORT + 1)]
	while ($PTR <= 6)
		setVar $HOLD[1][$PTR] $PLAYERS[($SORT+1)][$PTR]
		setVar $PLAYERS[($SORT+1)][$PTR] $PLAYERS[$SORT][$PTR]
		setVar $PLAYERS[$SORT][$PTR] $HOLD[1][$PTR]
		add $PTR 1
	end
	setVar $PLAYERS[$IDX] $HOLD[1]
	return

#         1         2         3         4         5         6         7
#12345678901234567890123456789012345678901234567890123456789012345678901234567890
#--- --------------------- -- ------------------------------ ------------------
#  1 4,500,000  4,500,000  14 EL_DIABLO                      Privateer
#  2 4,053,032    896,510  12 Codemonkey                     Federation Starship
#  3 3,645,010  4,499,750   1 Dark Lord                      Federation Starship


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
