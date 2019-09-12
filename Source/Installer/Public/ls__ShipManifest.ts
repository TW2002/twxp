    #=--------                                                                       -------=#
     #=--------------------------- LoneStar's Ship Manifest -------------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	January 1 20009
	#		Author		:	LoneStar
	#		TWX			:
	#		Description	:	Reads Game Ship Catalog and saves information to a Text File. The
	#							Text File is then used to display information to the user and
	#							allows the user to Sort (Ascending or Descending)
	#


setVar $FILE "LS_" & GAMENAME & "_Mainfest.txt"
setVar $TAG (ANSI_9 & "["&ANSI_14&"MANIFEST"&ANSI_9&"] " & ANSI_15)
setVar $EOA 		25
setArray $SHIPS $EOA 2
setVar $IDX 		0

SetVar $PADDED		FALSE
# Preset Column Widths. Minus the " " inbetween each column
SetVar $COLUMN_COUNT 11
SetArray $COLUMNS $COLUMN_COUNT
SetVar $COLUMNS[1] 3
SetVar $COLUMNS[2] 5
SetVar $COLUMNS[3] 8
SetVar $COLUMNS[4] 7
SetVar $COLUMNS[5] 3
SetVar $COLUMNS[6] 3
SetVar $COLUMNS[7] 6
SetVar $COLUMNS[8] 3
SetVar $COLUMNS[9] 3
SetVar $COLUMNS[10] 4
SetVar $COLUMNS[11] 3

FileExists $tst $FILE
if ($tst = 0)
	gosub :Read_Catalog
end

#Justify Center Routine.
setvar $Banner "LoneStar's Ship Manifest v1.0"
getlength $Banner $LEN
setVar $LEN ((80 - $LEN) / 2)
setVar $IDX 1
setVar $PAD ""
While ($IDX < $LEN)
	setVar $PAD ($PAD & " ")
	add $IDX 1
end
setVar $Banner ($PAD & $Banner)

gosub :Load_CataLog

SetVar $SORT_COLUMN 0
SetVar $SORT_ASCEND FALSE
SetVar $SORTED_LAST 0

:AND_AGAIN
	gosub :Display_CataLog
	Echo "*"&ANSI_9&"["&ANSI_14&"MANIFEST"&ANSI_9&"]"
	getConsoleInput $selection SINGLEKEY
	upperCase $selection
	#         1         2         3         4         5         6         7         8
	#12345678901234567890123456789012345678901234567890123456789012345678901234567890
	#Ship Name           TPW Holds Fighters Shields OFF/DEF MAXATK FOT RAN WARP LRS
	# Hot Keys --->>      P  H     F        S       O   D   M          R
	if ($selection = "P")
		setVar $SORT_COLUMN 1
	elseif ($selection = "H")
		setVar $SORT_COLUMN 2
	elseif ($selection = "F")
		setVar $SORT_COLUMN 3
	elseif ($selection = "S")
		setVar $SORT_COLUMN 4
	elseif ($selection = "O")
		setVar $SORT_COLUMN 5
	elseif ($selection = "D")
		setVar $SORT_COLUMN 6
	elseif ($selection = "M")
		setVar $SORT_COLUMN 7
	elseif ($selection = "R")
		setVar $SORT_COLUMN 9
	else
		goto :_END_
	end

	if ($SORTED_LAST = $SORT_COLUMN)
		if ($SORT_ASCEND = TRUE)
			setvar $SORT_ASCEND FALSE
		else
			setVar $SORT_ASCEND TRUE
		end
	end

	setVar $SORTED_LAST $SORT_COLUMN
	gosub :BUBBLE_SORT

	goto :AND_AGAIN

:_END_
	#This is the End.. My Only Friend, The End
	halt
    #=--------                                                                       -------=#
     #=---------------------------------   Sub Routines   ---------------------------------=#
    #=--------                                                                       -------=#
		# BUBBLE_SORT			- Performs 'Bubble' sort on CATALOG Array
		# SWAP_SPIT				- Used by BUBBLE_SORT routine to peroform Array Swapping
		# Display_CataLog		- Read CATALOG Array formats data, if necessary, and displays
		# Load_CataLog			- Loads Data from Text File and poplates CATALOG Array
		# Read_Catalog			- Obtains Ship data from TWGS and saves it to file
		# quikstats				- Used for Prompt Check in case script needs to use the
		#							  Read_Catalog routine.

:BUBBLE_SORT
	setVar $SORTS 12345
	if ($SORT_COLUMN >= 1) AND ($SORT_COLUMN <= $COLUMN_COUNT)
		while ($SORTS <> 0)
			setVar $SORTS 0
			setVar $IDX 1
			while ($IDX < $CATALOG)
				setVar $THIS $CATALOG[$IDX][$SORT_COLUMN]
				stripText $THIS " "
				stripText $THIS ","
				stripText $THIS "."
				setVar $THAT $CATALOG[($IDX + 1)][$SORT_COLUMN]
				stripText $THAT " "
				stripText $THAT ","
				stripText $THAT "."

				if ($SORT_ASCEND)
					if ($THIS > $THAT)
						gosub :SWAP_SPIT
						Add $SORTS 1
					end
				else
					if ($THIS < $THAT)
						gosub :SWAP_SPIT
						Add $SORTS 1
					end
				end
	      	add $IDX 1
			end
		end
	end
	return

:SWAP_SPIT
	SetArray $HOLD 1 12
	setVar $PTR 1
	setVar $HOLD[1] $CATALOG[($IDX+1)]
	# $COLUMN_COUNT + 1, because the 12th catalog element is 'hidden'
	# and contains the ANSI version of the Ship name
	while ($PTR <= ($COLUMN_COUNT + 1))
		# Copy data from next line in Catalog Array into 'holding'
		setVar $HOLD[1][$PTR] $CATALOG[($IDX+1)][$PTR]
		# Copy current Catalog[$IDX] into Catalog[$IDX+1]
		setVar $CATALOG[($IDX+1)][$PTR] $CATALOG[$IDX][$PTR]
		# Copy the data in the Holding array into CataLog[$IDX]
		setVar $CATALOG[$IDX][$PTR] $HOLD[1][$PTR]
		# Data now has been swapped
     	add $PTR 1
	end
	SetVar $CATALOG[$IDX] $HOLD[1]
	return


:Display_CataLog
	Echo "**"
	Echo ANSI_15 & "*" & $BANNER & "*"
	Echo ANSI_15 & #196 & #196 & #196 & ANSI_7 & #196 & #196
	Echo ANSI_8 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196
	Echo ANSI_7 & #196 & #196 & ANSI_15 & #196 & #196 & #196
	#         1         2         3         4         5         6         7         8
	#12345678901234567890123456789012345678901234567890123456789012345678901234567890
	#Ship Name           TPW Holds Fighters Shields OFF/DEF MAXATK FOT RAN WARP LRS
	# Hot Keys --->>      P  H     F        S       O   D   M          R
	Echo ANSI_14 & "*Ship Name           T"&ANSI_2&"P"&ANSI_14&"W "&ANSI_2&"H"&ANSI_14&"olds "&ANSI_2&"F"&ANSI_14&"ighters "
	Echo ANSI_2&"S"&ANSI_14&"hields "&ANSI_2&"O"&ANSI_14&"FF/"&ANSI_2&"D"&ANSI_14&"EF "&ANSI_2&"M"&ANSI_14&"AXATK "
	Echo "FOT "&ANSI_2&"R"&ANSI_14&"AN WARP LRS"
	Echo "*"
	Echo ANSI_15 & #196 & #196 & #196 & ANSI_7 & #196 & #196
	Echo ANSI_8 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196
	Echo ANSI_7 & #196 & #196 & ANSI_15 & #196 & #196 & #196
	setVar $IDX 1
	while ($IDX <= $TEMP)
		if ($PADDED = FALSE)
			setVar $PAD ""
			getLength $CATALOG[$IDX] $LEN
			if ($LEN > 19)
				CutText $CATALOG[$IDX] $CATALOG[$IDX] 1 19
			else
				setVar $i 1
				while ($i <= (19 - $LEN))
					setVar $PAD ($PAD & " ")
		      	add $i 1
				end
				setVar $CATALOG[$IDX][12] ($CATALOG[$IDX][12] & $PAD)
			end
		end

		Echo "*" & ANSI_15 & $CATALOG[$IDX][12]
		Echo " "

		#Cycle through the 11 different Columns. Concatenate/pad, format and
		#display each column
		setvar $COL 1
		while ($COL <= $COLUMN_COUNT)
			if ($PADDED = FALSE)
				setVar $PAD ""
				getLength $CATALOG[$IDX][$COL] $LEN
				if ($LEN > $COLUMNS[$COL])
					CutText $CATALOG[$IDX][$COL] $CATALOG[$IDX][$COL] 1 $COLUMNS[$COL]
				else
					setVar $i 1
					while ($i <= ($COLUMNS[$COL] - $LEN))
						setVar $PAD ($PAD & " ")
						add $i 1
					end
					setVar $CATALOG[$IDX][$COL] ($PAD & $CATALOG[$IDX][$COL])
				end
			end
			if ($SORT_COLUMN = $COL)
				Echo ANSI_2 & $CATALOG[$IDX][$COL]
			else
				Echo ANSI_12 & $CATALOG[$IDX][$COL]
			end
			Echo " "
			add $COL 1
		end
		add $IDX 1
	end
	setVar $PADDED TRUE
	Echo "*"
	Echo ANSI_15 & #196 & #196 & #196 & ANSI_7 & #196 & #196
	Echo ANSI_8 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196
	Echo ANSI_7 & #196 & #196 & ANSI_15 & #196 & #196 & #196
	return

:Load_CataLog
	ReadToArray $FILE $TEMP
	if ($TEMP = 0)
		echo "**Catalog File Is Empty**"
		halt
	end

	#Populate Internal Array With Data..  11 Columns
	setArray $CATALOG $TEMP 12
	#This sets the sizeof the array
	setVar $CATALOG $TEMP
	#                  1    2      3       4     5   6     7    8   9   10   11 (             12                )
	#Name            TPW Holds Fighters Shields OFF/DEF MAXATK FOT RAN WARP LRS (Holds ANSI Version of Ship Name)
	setVar $IDX 1
	while ($IDX <= $TEMP)
		setVar $TMP ($TEMP[$IDX] & "!!@@##")
		getWordPos $TMP $pos #9
		CutText $TMP $CATALOG[$IDX] 1 ($pos - 1)
		ReplaceText $TMP ($CATALOG[$IDX]&#9) ""
		setVar $PTR 1
		while ($PTR <= $COLUMN_COUNT)
			getWord $TMP $CATALOG[$IDX][$PTR] $PTR
			add $PTR 1
		end
		getText $TMP $CATALOG[$IDX][12] "[0m" "!!@@##"
		add $IDX 1
	end
return


:Read_Catalog
	gosub :quikstats
	if ($Current_Prompt <> "Command") AND ($Current_Prompt <> "Citadel")
		Echo "*" & $TAG
		Echo "*" & $TAG & "Prompt"
		Echo "*" & $TAG
		goto :_END_
	end

	setVar $PRE ""
	send "CC?"
	waiton "Which ship are you interested in"
	setTextLineTrigger	Page		:Page		"<+> Next Page"
	setTextLineTrigger	WeDone	:WeDone	"<Q> To Leave"
	setTextLineTrigger	GotOne	:GotOne	"> "
	pause

	:Page
	killalltriggers
	setVar $PRE "+"
	send "+"
	setTextLineTrigger	GotOne	:GotOne	"> "
	setTextLineTrigger	WeDone	:WeDone	"<Q> To Leave"
	pause

	:GotOne
	if ($IDX < $EOA)
		setVar $TEMP CURRENTLINE
		setVar $ANSI (CURRENTANSILINE & "!!@@##")
		stripText $ANSI #10
		stripText $ANSI #13
		getText $ANSI $ANSI "[35m> [32m" "!!@@##"
		getLength $TEMP $LEN
		getWord $TEMP $TMP 1
		stripText $TMP "<"
		stripText $TMP ">"
		if ($TMP <> "Q") AND  ($TMP <> "+")
			add $IDX 1
			setVar $SHIPS[$IDX] ($TMP & $PRE)
			setVar $PRE ""
			CutText $TEMP $SHIPS[$IDX][1] 5 ($LEN - 4)
			setVar $SHIPS[$IDX][2] $ANSI
			setVar $ANSI ""
		end
	end
	setTextLineTrigger	GotOne	:GotOne	"> "
	pause

	:WeDone
		killalltriggers
		setVar $i 1
		send "+ "
		if ($IDX <> 0)
			delete $FILE
			while ($i <= $IDX)
				send $SHIPS[$i]
				#waitfor "Ship Class :"
				#               1         2         3         4         5         6         7         8
				#      12345678901234567890123456789012345678901234567890123456789012345678901234567890
				#LINE1     Basic Hold Cost:        1   Initial Holds:     10 Maximum Shields:   200
				#LINE2     Main Drive Cost:   10,000    Max Fighters:    300  Offensive Odds: 8.0:1
				#LINE3       Computer Cost:   10,000  Turns Per Warp:      3  Defensive Odds: 8.0:1
				#LINE4      Ship Hull Cost:    5,000        Mine Max:      0      Beacon Max:     0
				#LINE5      Ship Base Cost:   25,001     Genesis Max:      0 Long Range Scan:   Yes
				#LINE6 Max Figs Per Attack:      100 TransWarp Drive:     No  Planet Scanner:    No
				#LINE7       Maximum Holds:       20 Transport Range:     15 Photon Missiles:    No
				setTextLineTrigger	LINE1	:LINE1	"Basic Hold Cost:"
				setTextLineTrigger	LINE2	:LINE2	"Main Drive Cost:"
				setTextLineTrigger	LINE3	:LINE3	"Computer Cost:"
				setTextLineTrigger	LINE4	:LINE4	"Ship Hull Cost:"
				setTextLineTrigger	LINE5	:LINE5	"Ship Base Cost:"
				setTextLineTrigger	LINE6	:LINE6	"Max Figs Per Attack:"
				setTextLineTrigger	LINE7	:LINE7	"Maximum Holds:"
				pause

				:LINE1
					CutText CURRENTLINE $MAX_SHIELDS 72 6
					stripText $MAX_SHIELDS " "
					pause
				:LINE2
					CutText CURRENTLINE $MAX_FIGHTERS 48 7
					stripText $MAX_FIGHTERS " "
					CutText CURRENTLINE $OFFENSIVE 73 3
					stripText $OFFENSIVE " "
					pause
				:LINE3
					CutText CURRENTLINE $TPW 48 7
					stripText $TPW " "
					CutText CURRENTLINE $DEFENSIVE 73 3
					stripText $DEFENSIVE " "
					pause
				:LINE4
					pause
				:LINE5
					CutText CURRENTLINE $LRS 72 6
					StripText $LRS " "
					pause
				:LINE6
					CutText CURRENTLINE $MAX_ATTACK 22 9
					stripText $MAX_ATTACK " "
					CutText CURRENTLINE $TWARP 48 7
					stripText $TWARP " "
					pause
				:LINE7
					killallTriggers
					CutText CURRENTLINE $MAX_HOLDS 22 9
					stripText $MAX_HOLDS " "
					CutText CURRENTLINE $XPORT_RANGE 48 7
					stripText $XPORT_RANGE " "
					CutText CURRENTLINE $PHOTON 72 6
					stripText $PHOTON " "

				#Name            TPW Holds Fighters Shields OFF/DEF MAXATK FOT RAN WARP LRS
				#Trey              2   125  255,000  16,000 2.0/2.0 25,000  NO   5   NO YES
				#Duece             1    75    2,000     100 3.0/1.0  1.000  NO   2  YES YES
				setVar $STR ($SHIPS[$i][1] & #9)
				setVar $STR ($STR & $TPW & " " & $MAX_HOLDS & " " & $MAX_FIGHTERS & " " & $MAX_SHIELDS)
				setVar $STR ($STR & " " & $OFFENSIVE & " " & $DEFENSIVE & " " & $MAX_ATTACK & " " & $PHOTON)
				setVar $STR ($STR & " " & $XPORT_RANGE & " " & $TWARP & " " & $LRS)
				setVar $STR ($STR & " " & $SHIPS[$i][2])
				WRITE $FILE $STR
				add $i 1
			end
		end

		send "q  q  "
		waiton "elp)?"
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
