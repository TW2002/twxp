    #=--------                                                                       -------=#
     #=---------------------------     LoneStar's MapArt      -----------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	June 13, 2008 - Version 1.0
	#		Author		:	LoneStar
	#		TWX			:	TWX 2.04b or TWX 2.04 Final
	#
	#		Credits		:	MD's (modified) GetCourse Routine
	#						- fixed a parsing issue wit respect to COURSE array
	#						- fixed "*** Error" handling in mow routine
	#
	#		To Run		: You will Need the following addressed
	#                                   - Start From Command Prompt
	#                                   - Up to date Deployed Fighter info
	#
	#		Fixes       :	Initial Release
	#
	#		Description	:	For Early Game Situations!  MapArt maps an existing Grid
	#						to help provide those Adjacents When you need them. Script
	#						obtains Fighters Data from Sector Params
	#
	#						Logs Mapped sector to a file to prevent remapping them
	#
	setVar	$TAG 			(ANSI_9 & "["&ANSI_14&"miniZTM"&ANSI_9&"] " & ANSI_15)
	setVar	$File_Name		("miniZTM_" & GAMENAME & ".txt")
	setArray $Checked 		SECTORS
	gosub :quikstats
	if ($CURRENT_PROMPT <> "Command")
		halt
	end
	
	getSectorParameter 2 "FIG_COUNT" $figCount

	fileExists $tst $FILE_NAME
	if ($TST)
		setVar $CNT 0
		ReadToArray $File_Name $Checked_tmp
		setVar $i 1
	   	while ($i <= $Checked_tmp)
			setVar $x $Checked_tmp[$i]
			isNumber $tst $x
			if ($tst)
				setVar $Checked[$x] TRUE
				add $cnt 1
			end
	       	add $i 1
	   	end
	end

	setVar $Checked $cnt

	window status 250 120 "LoneStar's MapArt [" & GAMENAME & "]"  ONTOP
	setVar $IDX 11
	while ($IDX <= SECTORS)
		if ($Checked[$IDX] = 0)
		getSectorParameter $IDX "FIGSEC" $F
		isNumber $tst $F
		setVar $From $IDX
		setVar $To 1
		if ($tst)
			if ($F <> 0)
				send "C"
				setVar $STR "* Current Focus     : " & $IDX & "* Sectors Mapped    : " & $Checked & "* Fighters Deployed : " & $figCount & "*"
				ECHO "***================= FOCUS : " & $IDX & "===================***"
				setWindowContents status $STR
				setVar $i 1
				while ($i <= 7)
					gosub :getCourse
					setVar $K 1
					while ($K <= $courselength)
						if ($COURSE[$k] = $to)
							setVar $adj $COURSE[1]
							send "V" & $adj & "*"
						end
	                	add $K 1
					end
	            	add $i 1
	            end

				send "V*YY"
				waiton "Avoided sectors Cleared."
				setVar $i 1
				while (SECTOR.WARPS[$IDX][$i] <> 0)
					setVar $ADJ SECTOR.WARPS[$IDX][$I]
					send "F" & $ADJ & "*" & $IDX & "**"
			    	add $i 1
				end
	        	setVar $Checked[$IDX] TRUE
	        	write $FILE_NAME $IDX
				send "Q"
				waiton "<Computer deactivated>"
				add $Checked 1
			end
		end
		end
		add $IDX 1
	end
	halt

:getCourse
	killalltriggers
	setVar $sectors ""
	setTextLineTrigger 		sectorlinetrig	:sectorsline	" > "
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
	getWordPos $line $pos3 "Error"

	if (($pos > 0) OR ($pos2 > 0) OR ($pos3 > 0))
		setVar $i 10
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
		setTextLineTrigger donePath2 :sectorsline "*** Error"
		setTextLineTrigger donePath3 :sectorsline ": ENDINTERROG"
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
