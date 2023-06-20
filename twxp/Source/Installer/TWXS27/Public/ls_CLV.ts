    #=--------                                                                      -------=#
     #=--------------------------     LoneStar's CLV Monitor     -------------------------=#
    #=--------                                                                      -------=#
	#		Incep Date	:	FEB 20, 2009 - Version 2.0
	#		Author		:	LoneStar
	#		TWX			:	Should Work with TWX 2.04b, or 2.04 Final
	#		Credits		:	Updated due to Singularites Tournament
	#
	#		To Run		:	You will Need the following addressed
	#                                    - Start While Connected
	#                                    - Start from Command or Citadel
	#
	#		Fixes			:	Version 2 is a much more accurate working version over Version 1.
	#
	#		Description	:	Performs a CLV check on startup, and then comapares results with future
	#							updates. You can press "!" to redisplay previous results
	#
systemscript
setVar $TAG (ANSI_9 & "["&ANSI_14&"CLV"&ANSI_9&"] " & ANSI_15)
setVar $PLAYER_MAX 200
setVar $IDX 1
setArray $CLV $PLAYER_MAX 4
setVar $PLAYER_COUNT 0

setVar $START_PROMPT CURRENTANSILINE
gosub :quikstats
if ($CURRENT_PROMPT <> "Command") AND ($CURRENT_PROMPT <> "Citadel")
	Echo "*" & $TAG
	Echo "*" & $TAG & "Start From Command or Citadel!"
	Echo "*" & $TAG
	halt
end

#[x] Corp  #[x][1] RANK  [x][2] ALIGN  [x][3] Trader Name [x][4] Ship Type
send "clvq"
waiton "--- ---------------------"
:_LOOP_
setTextLineTrigger	LINE	:STARTING_LINE
pause
:STARTING_LINE
setVar $TMP CURRENTLINE
if ($TMP <> "") and ($TMP <> "0")
	if ($IDX <= $PLAYER_MAX)
		CutText $TMP $CLV[$IDX] 27 2

		CutText $TMP $CLV[$IDX][1] 4 10
		stripText $CLV[$IDX][1] " "
		stripText $CLV[$IDX][1] ","

		CutText $TMP $CLV[$IDX][2] 14 11
		stripText $CLV[$IDX][2] " "
		stripText $CLV[$IDX][2] ","

		CutText $TMP $CLV[$IDX][3] 30 30
		GetLength $CLV[$IDX][3] $LEN
		setVar $STR ""
		CutText $CLV[$IDX][3] $STR $LEN 1
		while ($STR = " ") AND ($LEN > 1)
			cuttext $CLV[$IDX][3] $CLV[$IDX][3] 1 ($LEN - 1)
			subtract $LEN 1
			cuttext $CLV[$IDX][3] $STR $LEN 1
		end

		CutText $TMP $CLV[$IDX][4] 61 19
		GetLength $CLV[$IDX][4] $LEN
		setVar $STR ""
		CutText $CLV[$IDX][4] $STR $LEN 1
		while ($STR = " ") AND ($LEN > 1)
			cuttext $CLV[$IDX][4] $CLV[$IDX][4] 1 ($LEN - 1)
			subtract $LEN 1
			cuttext $CLV[$IDX][4] $STR $LEN 1
		end
	add $PLAYER_COUNT 1
	end
	add $idx 1
else
	if ($RUNONCE = FALSE)
		Echo "*"
		Echo "*" & "     " & $TAG & "                                       " & $TAG
		Echo "*   " & $TAG & ANSI_1&"   [["&ANSI_9&"["&ANSI_15&"LoneStar's CLV Monitor Loaded"&ANSI_1&"]"&ANSI_9&"]"&ANSI_1&"]]    " & $TAG
		Echo "*" & "     " & $TAG & "                                       " & $TAG
		Echo ANSI_7 & "*              Press '!' To See Previous Results"
		Echo "**"
		setvar $RUNONCE TRUE
		Echo $START_PROMPT & $TAG & $PLAYER_COUNT & " Lines " & ANSI_5 & ": "
		setVar $START_PROMPT ""
	else
		Echo $TAG & $PLAYER_COUNT & " Lines " & ANSI_5 & ": "
	end
	goto :_NEXT_PHASE_
end
goto :_LOOP_
#--------------------------------------------------------------------------------------------------------------
Echo "**Initial Player Count: " & $PLAYER_COUNT & "**"

:_NEXT_PHASE_
setArray $NEW_CLV $PLAYER_MAX 4
setVar $IDX 1

setTextLineTrigger 	CLV_START	:CLV_START "--- --------------------- -- ------------------------------"
setTextOutTrigger		CLV_REDIS	:CLV_REDIS "!"
pause
:CLV_REDIS
killAllTriggers
	if ($RESULT_IDX <> 0)
		Echo "*" & $TAG & $RESULT_IDX & " Displaying Previous Results In CLV"
		Echo "*" & $TAG
		setVar $IDX 1
		while ($IDX <= $RESULT_IDX)
			Echo "*" & $TAG & $RESULTS[$IDX]
      	add $IDX 1
		end
		Echo "*" & $TAG
		Echo "*"
		send "/"
	else
		Echo ANSI_14 & ">" & ANSI_6 & "> " & ANSI_7 "No Data " & ANSI_6 & "<" & ANSI_14 & "<" & ANSI_5 & " : "
	end
goto :_NEXT_PHASE_

:CLV_START
killAllTriggers
SetTextLineTrigger	Line		:Line
pause
:Finished
	killAllTriggers
	waitfor "<Computer deactivated>"
	killalltriggers
	setvar $IDX 1
	setvar $RESULT_IDX 0
	setARRAY $RESULTS 2000

	while ($IDX <= $PLAYER_MAX)
		if ($NEW_CLV[$IDX] <> "0")
			#[x]Corp  #[x][1]RANK  [x][2]ALIGN  [x][3]Trader Name [x][4]Ship Type
			setvar $INDEX 1
			while ($INDEX <= $PLAYER_MAX)
				if ($CLV[$INDEX][3] = $NEW_CLV[$IDX][3])
					# Detect Corp Change...
   				if ($CLV[$INDEX] <> $NEW_CLV[$IDX])
	   				add $RESULT_IDX 1
   					if ($NEW_CLV[$IDX] = "**")
   						setvar $RESULTS[$RESULT_IDX] (ANSI_15 & $CLV[$INDEX][3] & ANSI_14 & " No Longer On Corp " & $CLV[$INDEX])
   					else
   						setvar $RESULTS[$RESULT_IDX] (ANSI_15 & $CLV[$INDEX][3] & ANSI_14 & " Now On Corp " & $NEW_CLV[$IDX])
						end
						setvar $CLV[$INDEX] $NEW_CLV[$IDX]
					end
					# Detect Change in Experience
					if ($CLV[$INDEX][1] <> $NEW_CLV[$IDX][1])
						add $RESULT_IDX 1
						setvar $CashAmount $NEW_CLV[$IDX][1]
						if ($NEW_CLV[$IDX][2] >= 0)
							setVar $ANSI ANSI_2
						else
							setVar $ANSI ANSI_12
						end
						gosub	:CommaSize
	              	if ($CLV[$INDEX][1] > $NEW_CLV[$IDX][1])
							setvar $RESULTS[$RESULT_IDX] (ANSI_15 & $CLV[$INDEX][3] & ANSI_12 & " Experience " & ANSI_14 & "-" & ($CLV[$INDEX][1] - $NEW_CLV[$IDX][1]) & ANSI_15 & ", " & $ANSI & $CashAmount)
               	else
							setvar $RESULTS[$RESULT_IDX] (ANSI_15 & $CLV[$INDEX][3] & ANSI_12 & " Experience " & ANSI_14 & "+" & ($NEW_CLV[$INDEX][1] - $CLV[$IDX][1]) & ANSI_15 & ", " & $ANSI & $CashAmount)
               	end
               	setVar $CLV[$INDEX][1] $NEW_CLV[$IDX][1]
               end
					# Detect Chance In Alignment
					if ($CLV[$INDEX][2] <> $NEW_CLV[$IDX][2])
						add $RESULT_IDX 1
						if ($NEW_CLV[$IDX][2] >= 0)
							setVar $ANSI ANSI_2
						else
							setVar $ANSI ANSI_12
						end
						setvar $CashAmount $NEW_CLV[$IDX][2]
						if ($CashAmount < "0")
							stripText $CashAmount "-"
							gosub	:CommaSize
							setVar $CashAmount ("-" & $CashAmount)
						else
							gosub	:CommaSize
						end
               	if ($CLV[$INDEX][2] > $NEW_CLV[$IDX][2])
							setvar $RESULTS[$RESULT_IDX] (ANSI_15 & $CLV[$INDEX][3] & ANSI_12 & " Alignment " & ANSI_14 & "-" & ($CLV[$INDEX][2] - $NEW_CLV[$IDX][2]) & ANSI_15 & ", " & $ANSI & $CashAmount)
               	else
							setvar $RESULTS[$RESULT_IDX] (ANSI_15 & $CLV[$INDEX][3] & ANSI_12 & " Alignment " & ANSI_14 & "+" & ($NEW_CLV[$IDX][2] - $CLV[$INDEX][2]) & ANSI_15 & ", " & $ANSI & $CashAmount)
               	end
               	setVar $CLV[$INDEX][2] $NEW_CLV[$IDX][2]
               end
					# Detect Chance In Alignment
					if ($CLV[$INDEX][4] <> $NEW_CLV[$IDX][4])
						add $RESULT_IDX 1
               	if ($NEW_CLV[$IDX][4] = "# Ship Destroyed #")
							setvar $RESULTS[$RESULT_IDX] (ANSI_15 & $CLV[$INDEX][3] & ANSI_12 & " Is Now " & ANSI_9 & "#" & ANSI_6 & " Ship Destroyed "&ANSI_9 & "#")
               	else
							setvar $RESULTS[$RESULT_IDX] (ANSI_15 & $CLV[$INDEX][3] & ANSI_12 & " Changed Ships: " & ANSI_14 & $NEW_CLV[$IDX][4])
               	end
               	setVar $CLV[$INDEX][4] $NEW_CLV[$IDX][4]
               end
					goto :NEXT_UP
				end
				add $INDEX 1
			end

			#Must be a New Player...
			setVar $INDEX 1
			while ($INDEX <= $PLAYER_MAX)
				if ($CLV[$INDEX] = 0)
					#[x]Corp  #[x][1]RANK  [x][2]ALIGN  [x][3]Trader Name [x][4]Ship Type
					setvar $CLV[$INDEX] $NEW_CLV[$IDX]
					setvar $CLV[$INDEX][1] $NEW_CLV[$IDX][1]
					setvar $CLV[$INDEX][2] $NEW_CLV[$IDX][2]
					setvar $CLV[$INDEX][3] $NEW_CLV[$IDX][3]
					setvar $CLV[$INDEX][4] $NEW_CLV[$IDX][4]
					add $RESULT_IDX 1
					setVar $RESULTS[$RESULT_IDX]  (ANSI_15 & $CLV[$INDEX][3] & ANSI_12 & " Is A New Player")
					goto :NEXT_UP
				end
         	add $INDEX 1
			end
			:NEXT_UP
		end
   	add $IDX 1
   end
	if ($RESULT_IDX <> 0)
		Echo "*" & $TAG & $RESULT_IDX & " Changes Detected In CLV"
		Echo "*" & $TAG
		setVar $IDX 1
		while ($IDX <= $RESULT_IDX)
			Echo "*" & $TAG & $RESULTS[$IDX]
      	add $IDX 1
		end
		Echo "*" & $TAG
		Echo "*"
		send "/"
	else
		Echo ANSI_14 & ">" & ANSI_6 & "> " & ANSI_7 "No Change In CLV " & ANSI_6 & "<" & ANSI_14 & "<" & ANSI_5 & " : "
	end
	goto :_NEXT_PHASE_

:Line
setVar $TMP CURRENTLINE
if ($TMP <> "") and ($TMP <> "0")
	if ($IDX <= $PLAYER_MAX)
		#[x] Corp  #[x][1] RANK  [x][2] ALIGN  [x][3] Trader Name [x][4] Ship Type
		CutText $TMP $NEW_CLV[$IDX] 27 2

		CutText $TMP $NEW_CLV[$IDX][1] 4 10
		stripText $NEW_CLV[$IDX][1] " "
		stripText $NEW_CLV[$IDX][1] ","

		CutText $TMP $NEW_CLV[$IDX][2] 14 11
		stripText $NEW_CLV[$IDX][2] " "
		stripText $NEW_CLV[$IDX][2] ","

		CutText $TMP $NEW_CLV[$IDX][3] 30 30
		GetLength $NEW_CLV[$IDX][3] $LEN
		setVar $STR ""
		CutText $NEW_CLV[$IDX][3] $STR $LEN 1
		while ($STR = " ") AND ($LEN > 1)
			cuttext $NEW_CLV[$IDX][3] $NEW_CLV[$IDX][3] 1 ($LEN - 1)
			subtract $LEN 1
			cuttext $NEW_CLV[$IDX][3] $STR $LEN 1
		end

		CutText $TMP $NEW_CLV[$IDX][4] 61 19
		GetLength $NEW_CLV[$IDX][4] $LEN
		setVar $STR ""
		CutText $NEW_CLV[$IDX][4] $STR $LEN 1
		while ($STR = " ") AND ($LEN > 1)
			cuttext $NEW_CLV[$IDX][4] $NEW_CLV[$IDX][4] 1 ($LEN - 1)
			subtract $LEN 1
			cuttext $NEW_CLV[$IDX][4] $STR $LEN 1
		end
	add $PLAYER_COUNT 1
	end
	add $idx 1
else
	setTextLineTrigger	Finished	:Finished	"Computer command [TL="
	pause
end
SetTextLineTrigger	Line		:Line
pause



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

