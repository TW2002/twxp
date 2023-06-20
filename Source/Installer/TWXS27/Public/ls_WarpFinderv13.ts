    #=--------                                                                       -------=#
     #=----------------------------  LoneStar's Warp Finder  ------------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	June 20 , 2007 - Version 1.2
	#		Author		:	LoneStar
	#		TWX			:	Should Work with TWX 2.04b, or 2.04 Final
	#		Credits		:	Mind Daggers modified version of Singularity's quikstats
	#						Singularity's Display Alien Space Routine
	#
	#		To Run		:	You will Need to have some percentage Explored. A ZTM is ideal.
	#
	#		Fixes       :	Initial Release
	#
	#		Description	:	Displays Sector information in a similar TradeWars Colour Format.
	#						Also, the script will display Alien Space, and High Density Sectors
	#

	setVar	$TagLineB		"LoneStar's Nearest Warps Finder"
	SetVar	$FIG_FILE_MOM	"_MOM_" & GAMENAME & ".figs"
	setVar	$FIG_FILE_CK	"_ck_" & GAMENAME & ".figs"
	SetVar	$FIG_FILE_RAM   "Fig_Grid-" & GAMENAME & ".txt"
	setArray $Figs			SECTORS
	loadVar	$VERBOSE
	isNumber $tst $VERBOSE
	if ($tst = 0)
		setVar $VERBOSE FALSE
		saveVar $VERBOSE
	else
		if ($VERBOSE >= 1)
			setVar $VERBOSE TRUE
		elseif ($VERBOSE <> 0)
			setVar $VERBOSE FALSE
		end
		saveVar $VERBOSE
	end

	LoadVar $WARPS
	isNumber $tst $WARPS
	if ($tst = 0)
		setVar $WARPS 1
		saveVar $WARPS
	else
		if ($WARPS < 1)
			setVar $WARPS 1
		elseif ($WARPS > 7)
			setVar $WARPS 7
		end
	end

	loadVar	$FILTER_AVOIDS
	if ($FILTER_AVOIDS > 1)
		setVar $FILTER_AVOIDS FALSE
		saveVar $FILTER_AVOIDS
	end

    setVar $MAX_RESULTS 10

	loadVar $RESULTS
	if ($RESULTS < 1)
		setVar $RESULTS 1
		savevar $RESULTS
	elseif ($RESULTS > 10)
		setVar $RESULTS $MAX_RESULTS
		saveVar $RESULTS
	end
	setVar	$FIG_SOURCE "Sector Parameter"

	gosub :quikstats

	setVar $FROM $CURRENT_SECTOR

	if (($CURRENT_PROMPT <> $COMMAND_PROMPT) AND ($CURRENT_PROMPT <> $CITADEL_PROMPT))
		setVar	$FILTER_AVOIDS	10
	else
		gosub :checkAvoidedSectors
	end

    :Menu_Top
	echo #27 & "[2J"
    :Menu_Top_No_CLear
	echo "**"
	Echo (ANSI_15 & #9 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
	echo "*" & #9 & ANSI_15 & $TagLineB & "*"
	Echo (ANSI_15 & #9 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
		Echo "*" & ANSI_7 & #9 & "1 "&ANSI_15&"Closest       "&ANSI_14&": " &ANSI_6& $WARPS & ANSI_15 &" Warp"
	Echo "*" & ANSI_7 & #9 & "2 "&ANSI_15&"From Sector   "&ANSI_14&": " &ANSI_6& $FROM
	Echo "*" & ANSI_7 & #9 & "3 "&ANSI_15&"Filter Avoids "&ANSI_14&": "
	if ($FILTER_AVOIDS = 1)
		echo ANSI_6 & "Yes"
	elseif ($FILTER_AVOIDS = 0)
		echo ANSI_6 & "No"
	else
		echo ANSI_8 & "Must Start From Command or Citadel Prompt"
	end
	Echo "*" & ANSI_7 & #9 & "4 "&ANSI_15&"Max Results   "&ANSI_14&": " &ANSI_6& $RESULTS
	Echo "*" & ANSI_7 & #9 & "5 "&ANSI_15&"Fighter Data  "&ANSI_14&": " &ANSI_6& $FIG_SOURCE
	Echo "*" & ANSI_7 & #9 & "6 "&ANSI_15&"Verbose Output"&ANSI_14&": "
	if ($VERBOSE)
		echo ANSI_6 & "Yes"
	else
		echo ANSI_6 & "No"
	end
	Echo "*" & ANSI_7 & #9 & "7 "&ANSI_15&"Alien Space"
	Echo "*" & ANSI_7 & #9 & "8 "&ANSI_15&"High Density Sectors"
    Echo "*" #9 #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196
	Echo "*" & ANSI_7 & #9 & "Q "&ANSI_15&"Quit"
	Echo "*" & ANSI_7 & #9 & "G "&ANSI_15&"GO!"
	Echo "**"
	getConsoleInput $s SINGLEKEY
	uppercase $s
	if ($s = "Q")
		halt
	elseif ($s = 1)
		if ($WARPS = 1)
			setVar $WARPS 2
		elseif ($WARPS = 2)
			setVar $WARPS 3
		elseif ($WARPS = 3)
			setVar $WARPS 4
		elseif ($WARPS = 4)
			setVar $WARPS 5
		elseif ($WARPS = 5)
			setVar $WARPS 6
		elseif ($WARPS = 6)
			setVar $WARPS 7
		elseif ($WARPS = 7)
			setVar $WARPS 1
		end
		saveVar $WARPS
	elseif ($s = 2)
		:Another_Source
		getInput $s "*" & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*From Which Sector ("&ANSI_9&"0 for Current Sector"&ANSI_14&")?"
		isNumber $tst $s
		if ($tst)
        	if (($s < 1) OR ($s > SECTORS))
        		setVar $s CURRENTSECTOR
        	end
        	setVar $FROM $s
        else
        	goto :Another_Source
		end
	elseif ($s = 3)
		if ($FILTER_AVOIDS <= 1)
			if ($FILTER_AVOIDS)
				setVar $FILTER_AVOIDS FALSE
			else
				setVar $FILTER_AVOIDS TRUE
			end
		end
		saveVar $FILTER_AVOIDS
	elseif ($s = 4)
		getInput $s "*" & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Return How Many Results ("&ANSI_12&"Maximum " & $MAX_RESULTS & ANSI_14&")?"
		isNumber $tst $s
		if ($tst)
			if ($s < 1)
				setVar $s 1
			elseif ($s > $MAX_RESULTS)
				setVar $s $MAX_RESULTS
			end
			setVar $RESULTS $s
		end
		saveVar $RESULTS
	elseif ($s = 5)
		:Whoops_No_File
		if ($FIG_SOURCE = "Sector Parameter")
			setVar $FIG_SOURCE "M()M Fig File"
			fileExists $tst $FIG_FILE_MOM
			If ($tst = 0)
				goto :Whoops_No_File
			end
		elseif ($FIG_SOURCE = "M()M Fig File")
			setVar $FIG_SOURCE "Cherokee's Fig File"
			fileExists $tst $FIG_FILE_CK
			If ($tst = 0)
				goto :Whoops_No_File
			end
		elseif ($FIG_SOURCE = "Cherokee's Fig File")
			setVar $FIG_SOURCE "Rammer's Fig File"
			fileExists $tst $FIG_FILE_RAM
			If ($tst = 0)
				goto :Whoops_No_File
			end
		elseif ($FIG_SOURCE = "Rammer's Fig File")
			setVar $FIG_SOURCE "Sector Parameter"
		end
	elseif ($s = "6")
    	if ($VERBOSE)
    		setVar $VERBOSE FALSE
    	else
    		setVar $VERBOSE TRUE
    	end
    	saveVar $VERBOSE
	elseif ($s = 7)
		SetVar $Races_Amount 20
		SetVar $Races_Space 200
		SetArray $Races $Races_Amount $Races_Space

		Echo "***"
		Echo "  " ANSI_14 "Scanning" & ANSI_15 & " - This May Take a Minute**"

		SetVar $idx 11
		while ($idx <= SECTORS)
			# Get the sector from the DB. No choice here because the constellation
			# entry has no SECTOR value
			getSector $idx $sec
			# Here we're going to trim out some things that can throw us off
			setVar $constellation $sec.CONSTELLATION
			stripText $constellation " (unexplored)"
			stripText $constellation "uncharted space"
			stripText $constellation "."
			# With all of this, is it a particular alien "space" ?
			getWordPos $constellation $pos "Space"
			if ($pos > 0)
				setVar $i 1
				while ($i <= $Races_Amount)
					setVar $testing $Races[$i]
                	if ($testing = "0")
                		setVar $Races[$i] $constellation
                		setVar $Races[$i][1] $idx
                		goto :Done_Race
                	elseif ($testing = $constellation)
                		setVar $ii 1
                		while ($ii <= $Races_Space)
                			setVar $Testing_2 $Races[$i][$ii]
                			if ($Testing_2 = 0)
                				setVar $Races[$i][$ii] $idx
                				goto :Done_Race
                			end
                			add $ii 1
                		end
					end
					add $i 1
				end
			end
			:Done_Race
			add $idx 1
		end
		setVar $idx 1
		Echo ("***    " & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
		Echo "*            " & ANSI_15 &"Alien Space, From Sector " & ANSI_14 $FROM
		if ($FILTER_AVOIDS)
			Echo "*              " &ANSI_15 & "-/- " & ANSI_8 &"Filtering Avoids" & ANSI_15 & " -/-"
		end
		Echo ("*    " & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
		Echo "*"
		while ($idx <= $Races_Amount)
			if ($Races[$idx] <> "0")
				setVar $test $Races[$idx]
				stripText $test "Space"
				Echo "**"
				Echo (ANSI_10 & "   The " & ANSI_14 & $Test & "*")
				Echo (ANSI_7 & "   " & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
				setVar $ii 1
				setVar $VERBOSE TRUE
				while ($Races[$idx][$ii] <> 0)
					getSector $Races[$idx][$ii] $Sect
					getDistance $Dist $FROM $Races[$idx][$ii]
					gosub :Spit_It_Out
					add $ii 1
				end
			end
			add $idx 1
		end
	elseif ($s = 8)
		:Another_Density
		getInput $s "*" & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Show Density Levels Higher Than ("&ANSI_12 & "Min. 1000, Zero To Cancel" & ANSI_14 & ")?"
		isNumber $tst $s
		if ($tst = 0)
			setVar $s 1
		end
		if ($s = 0)
		elseif ($s < 1000)
			goto :Another_Density
		else
			Echo ("***    " & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
			Echo "*            " & ANSI_15 &"Sector Densities Above " & ANSI_14 & $s
			if ($FILTER_AVOIDS)
				Echo "*              " &ANSI_15 & "-/- " & ANSI_8 &"Filtering Avoids" & ANSI_15 & " -/-"
			end
			Echo ("*    " & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
			Echo "*"

			setVar $hits 0
			setVar $idx 1
			while ($idx <= SECTORS)
				if (SECTOR.DENSITY[$idx] >= $s)
					if ($hits > $RESULTS)
						goto :Done_Density
					else
						getSector $idx $Sect
						getDistance $Dist $FROM $idx

						setVar $CashAmount SECTOR.DENSITY[$idx]
						gosub :CommaSize
						Echo ANSI_14 & "* Density : " & ANSI_1 & $CashAmount
						gosub :Spit_It_Out
						add $hits 1
					end
				end
            	add $idx 1
    		end
		end
		:Done_Density
	elseif ($s = "G")
		goto :Lets_Get_It_On
    end
	goto :Menu_Top_No_CLear

:Lets_Get_It_On
	getNearestWarps $Nearest $FROM
	setArray $Container $RESULTS 1
	setVar $cnt 0

	gosub :Read_FIG_Data
	echo ("*"&ANSI_8&"<"&ANSI_15&"Scanning TWX DBase"&ANSI_8&">")
	setVar $idx 2

	while (($idx <= $Nearest) and ($cnt < $RESULTS))
		setVar $temp $Nearest[$idx]
		if ($FILTER_AVOIDS)
			getWordPos $avoidedSectors $pos " "&$temp&" "
			if ($pos <> 0)
				goto :Moving_Along
			end
		end
		if (SECTOR.WARPCOUNT[$temp] = $WARPS)
        	add $cnt 1
        	setVar $Container[$cnt] $temp
        	getDistance $Dist $FROM $temp
			setVar $Container[$cnt][1] $Dist
		end
		:Moving_Along
		add $idx 1
	end

	if ($cnt = 0)
		echo ("**      "&ANSI_8&"<"&ANSI_15&"No Results Found"&ANSI_8&">**")
		halt
	end

	setVar $idx 1
	Echo ("***    " & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
	Echo "*            " & ANSI_15 &"Nearest " & ANSI_14 &$WARPS& ANSI_15 " Way Warps, From " & ANSI_14 $FROM
	if ($FILTER_AVOIDS)
		Echo "*              " &ANSI_15 & "-/- " & ANSI_8 &"Filtering Avoids" & ANSI_15 & " -/-"
	end
	Echo ("*    " & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
	Echo "*"
	while ($idx <= $cnt)
		getSector $Container[$idx] $Sect
		getDistance $Dist $FROM $Container[$idx][1]
		gosub :Spit_It_Out
    	add $idx 1
	end
	echo ("* "&ANSI_8&"<"&ANSI_15&"Press "&ANSI_14&"+"&ANSI_15&" To Return to Menu or Any Other Key To Quit"&ANSI_8&">**")
	getConsoleInput $s SINGLEKEY
	if ($s = "+")
		echo "**"
		goto :Menu_Top_No_CLear
	end
	halt


:Read_FIG_Data
	setVar $idx 1

	If ($FIG_SOURCE = "Sector Parameter")
		echo ("**"&ANSI_8&"<"&ANSI_15&"Reading Sector Parameters"&ANSI_8&">")
		while ($idx <= SECTORS)
			getSectorParameter $idx "FIGSEC" $flag
			isNumber $tst $flag
			If ($tst <> 0)
				If ($flag > 0)
					SetVar $FIGS[$idx] 1
				end
			end
			add $idx 1
		end
	ElseIf ($FIG_SOURCE = "M()M Fig File")
		echo ("**"&ANSI_8&"<"&ANSI_15&"Reading M()M Fig File"&ANSI_8&">")
		readToArray $FIG_FILE_MOM $FIGS
    ElseIf ($FIG_SOURCE = "Cherokee's Fig File")
   		echo ("**"&ANSI_8&"<"&ANSI_15&"Reading Cherokee's Fig File"&ANSI_8&">")
		readToArray $FIG_FILE_CK $Read
		while ($idx <= SECTORS)
			getWord $Read[1] $fig_check $idx
			If ($fig_check <> 0)
				SetVar $Figs[$idx] 1
			end
	    	add $idx 1
		end
	ElseIf ($FIG_SOURCE = "Rammer's Fig File")
   		echo ("**"&ANSI_8&"<"&ANSI_15&"Reading Rammer's Fig File"&ANSI_8&">")
		readToArray $FIG_FILE_RAM $Read
		while ($idx <= SECTORS)
			getWord $Read[2] $fig_check $idx
			If ($fig_check <> 0)
				SetVar $Figs[$idx] 1
			end
	    	add $idx 1
		end
	end
	SetVar $Read[1] "Getting Back Memory :)"
	return


:checkAvoidedSectors
	SetVar $avoidedSectors ""
	:readAvoidedList
		setTextLineTrigger getLine1 :getAvoids
		send "cxq"
		pause
	:keepCountingAvoids
		killAllTriggers
		setTextLineTrigger getLine :getAvoids
		pause
	:getAvoids
		killAllTriggers
		SetVar $workingText CURRENTLINE
		getWordPos $workingText $pos "<Computer deactivated>"
		If ($pos > 0)
			goto :doneAvoids
		end
		getWordPos $workingText $pos "Computer"
		If ($pos > 0)
			goto :keepCountingAvoids
		end
		If (CURRENTLINE = "")
			goto :KeepCountingAvoids
		end
		getWordPos $workingText $pos "<List Avoided Sectors>"
		If ($pos > 0)
			goto :keepCountingAvoids
		end
		getWordPos $workingText $pos "No Sectors are currently being avoided."
		If ($pos > 0)
			goto :doneAvoids
		end
		getWordPos $workingText $pos "Citadel"
		If ($pos > 0)
			goto :keepCountingAvoids
		end
		SetVar $workingText $workingText&" +++"
		getWord $workingText $avoid 1
		getWordPos $workingText $pos $avoid

		while ($avoid <> "+++")
			SetVar $avoidedSectors $avoidedSectors&" "&$avoid&" "
			getLength $avoid $length
			getLength $workingText $checkLength
			cutText $workingText $workingText ($pos+$length) 9999
			getWord $workingText $avoid 1
			getWordPos $workingText $pos $avoid
		end
		goto :keepCountingAvoids

	:doneAvoids
	return


:quikstats
	setVar $CURRENT_PROMPT		"Undefined"
	setVar $PSYCHIC_PROBE 		"NO"
	setVar $PLANET_SCANNER 		"NO"
	setVar $SCAN_TYPE 			"NONE"
	setVar $CURRENT_SECTOR 		0
	setVar $TURNS 				0
	setVar $CREDITS 			0
	setVar $FIGHTERS 			0
	setVar $SHIELDS 			0
	setVar $TOTAL_HOLDS 		0
	setVar $ORE_HOLDS 			0
	setVar $ORGANIC_HOLDS 		0
	setVar $EQUIPMENT_HOLDS 	0
	setVar $COLONIST_HOLDS		0
	setVar $PHOTONS 			0
	setVar $ARMIDS 				0
	setVar $LIMPETS 			0
	setVar $GENESIS 			0
	setVar $TWARP_TYPE 			0
	setVar $CLOAKS 				0
	setVar $BEACONS 			0
	setVar $ATOMIC 				0
	setVar $CORBO 				0
	setVar $EPROBES 			0
	setVar $MINE_DISRUPTORS 	0
	setVar $ALIGNMENT 			0
	setVar $EXPERIENCE			0
	setVar $CORP 				0
	setVar $SHIP_NUMBER			0
	setVar $TURNS_PER_WARP 		0
	setVar $COMMAND_PROMPT 		"Command"
	setVar $COMPUTER_PROMPT 	"Computer"
	setVar $CITADEL_PROMPT		"Citadel"
	setVar $PLANET_PROMPT		"Planet"
	setVar $CORPORATE_PROMPT	"Corporate"
	setVar $STARDOCK_PROMPT 	"Stardock"
	setVar $HARDWARE_PROMPT 	"Hardware"
	setVar $SHIPYARD_PROMPT 	"Shipyard"
	setVar $TERRA_PROMPT 		"Terra"

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
		If ($pos > 0)
			SetVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt1 :allPrompts "(?="
		pause
	:secondaryPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		If ($pos > 0)
			SetVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt2 :secondaryPrompts "(?)"
		pause
	:terraPrompts
		killtrigger prompt3
		killtrigger prompt4
		getWord currentansiline $checkPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		If ($pos > 0)
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
		If ($pos > 0)
			goto :gotStats
		else
			setTextLineTrigger getLine2 :statsline
			pause
		end

	:gotStats
		SetVar $stats $stats & " @@@"

		SetVar $current_word 0
		while ($wordy <> "@@@")
			If ($wordy = "Sect")
				getWord $stats $CURRENT_SECTOR   	($current_word + 1)
			ElseIf ($wordy = "Turns")
				getWord $stats $TURNS  				($current_word + 1)
			ElseIf ($wordy = "Creds")
				getWord $stats $CREDITS  			($current_word + 1)
			ElseIf ($wordy = "Figs")
				getWord $stats $FIGHTERS   			($current_word + 1)
			ElseIf ($wordy = "Shlds")
				getWord $stats $SHIELDS  			($current_word + 1)
			ElseIf ($wordy = "Hlds")
				getWord $stats $TOTAL_HOLDS   		($current_word + 1)
			ElseIf ($wordy = "Ore")
				getWord $stats $ORE_HOLDS    		($current_word + 1)
			ElseIf ($wordy = "Org")
				getWord $stats $ORGANIC_HOLDS    	($current_word + 1)
			ElseIf ($wordy = "Equ")
				getWord $stats $EQUIPMENT_HOLDS    	($current_word + 1)
			ElseIf ($wordy = "Col")
				getWord $stats $COLONIST_HOLDS    	($current_word + 1)
			ElseIf ($wordy = "Phot")
				getWord $stats $PHOTONS   			($current_word + 1)
			ElseIf ($wordy = "Armd")
				getWord $stats $ARMIDS   			($current_word + 1)
			ElseIf ($wordy = "Lmpt")
				getWord $stats $LIMPETS   			($current_word + 1)
			ElseIf ($wordy = "GTorp")
				getWord $stats $GENESIS 	 		($current_word + 1)
			ElseIf ($wordy = "TWarp")
				getWord $stats $TWARP_TYPE  		($current_word + 1)
			ElseIf ($wordy = "Clks")
				getWord $stats $CLOAKS   			($current_word + 1)
			ElseIf ($wordy = "Beacns")
				getWord $stats $BEACONS 			($current_word + 1)
			ElseIf ($wordy = "AtmDt")
				getWord $stats $ATOMIC  			($current_word + 1)
			ElseIf ($wordy = "Corbo")
				getWord $stats $CORBO   			($current_word + 1)
			ElseIf ($wordy = "EPrb")
				getWord $stats $EPROBES 	  		($current_word + 1)
			ElseIf ($wordy = "MDis")
				getWord $stats $MINE_DISRUPTORS   	($current_word + 1)
			ElseIf ($wordy = "PsPrb")
				getWord $stats $PSYCHIC_PROBE  		($current_word + 1)
			ElseIf ($wordy = "PlScn")
				getWord $stats $PLANET_SCANNER  	($current_word + 1)
			ElseIf ($wordy = "LRS")
				getWord $stats $SCAN_TYPE    		($current_word + 1)
			ElseIf ($wordy = "Aln")
				getWord $stats $ALIGNMENT    		($current_word + 1)
			ElseIf ($wordy = "Exp")
				getWord $stats $EXPERIENCE    		($current_word + 1)
			ElseIf ($wordy = "Corp")
				getWord $stats $CORP  	 			($current_word + 1)
			ElseIf ($wordy = "Ship")
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


:Spit_It_Out
	Echo ANSI_10 & "* Sector  "&ANSI_14&": " & ANSI_15& $Sect.INDEX & ANSI_2 & " in " &ANSI_1& $Sect.CONSTELLATION
	Echo ANSI_10 & "* Distance: " & $Dist & " hops"
	if ($VERBOSE)
		if ($Sect.BEACON <> "")
        	Echo ANSI_1&"* Beacon  "&ANSI_14&": " &ANSI_4& $Sect.BEACON
        end
        if ($Sect.PORT.EXISTS)
			Echo ANSI_1 & "* Ports   " & ANSI_14 & ": " & ANSI_15 & $Sect.PORT.NAME & ANSI_14 & "," & ANSI_1 & " Class "& ANSI_15 & $Sect.PORT.CLASS & ANSI_1 & " ("
			if ($Sect.PORT.CLASS = 0)
				Echo ANSI_15 & "Speacial"
			else
				if ($Sect.PORT.BUY_ORE)
					Echo ANSI_6 & "B"
				else
					Echo ANSI_15 & "S"
				end
				if ($Sect.PORT.BUY_ORG)
					Echo ANSI_6 & "B"
				else
					Echo ANSI_15 & "S"
				end
				if ($Sec.PORT.BUY_EQUIP)
					Echo ANSI_6 & "B"
				else
					Echo ANSI_15 & "S"
				end
			end
			Echo ANSI_1 & ")"
        end
        if ($Sect.PLANETS <> 0)
        	setVar $Planet_IDX 1
			Echo ANSI_1 & "* Planets " & ANSI_14 & ": " & ANSI_7 & $Sect.Planet[$Planet_IDX]
			add $Planet_IDX 1
			while ($Planet_IDX <= $Sect.PLANETS)
				Echo "*           " & ANSI_7 & $Sect.Planet[$Planet_IDX]
				add $Planet_IDX 1
			end
        end

		if ($Sect.TRADERS <> 0)
        	setVar $Trader_IDX 1
			Echo ANSI_1 & "* Traders " & ANSI_14 & ": " & ANSI_7 & $Sect.TRADER[$Trader_IDX].NAME & ANSI_14 & ","&ANSI_2&" w/ " & ANSI_14 & $Sect.TRADER[$Trader_IDX].FIGS & ANSI_2&" ftrs"&ANSI_14&","
			Echo "*            " & ANSI_2 & "in " & ANSI_8 & $Sect.TRADER[$Trader_IDX].SHIPNAME & ANSI_2 & " (" & ANSI_12 & $Sect.TRADER[$Trader_IDX].SHIP & ANSI_2 & ")"
			add $Trader_IDX 1
			while ($Trader_IDX <= $Sect.TRADERS)
				Echo "*          " & ANSI_14 & ": " & ANSI_7 & $Sect.TRADER[$Trader_IDX].NAME & ANSI_14 & ","&ANSI_2&" w/ " & ANSI_14 & $Sect.TRADER[$Trader_IDX].FIGS & ANSI_2&" ftrs"&ANSI_14&","
				Echo "*            "&ANSI_2&"in " & ANSI_8&$Sect.TRADER[$Trader_IDX].SHIPNAME & ANSI_2&" (" & ANSI_12 & $Sect.TRADER[$Trader_IDX].SHIP & ANSI_2 & ")"
            	add $Trader_IDX 1
			end
		end

		if ($Sect.SHIPS <> 0)
        	setVar $Ship_IDX 1
			setVar $CashAmount $Sect.SHIP[$Ship_IDX].FIGS
			gosub :CommaSize
			Echo ANSI_1 & "* Ships   " & ANSI_14 & ": " & ANSI_15 & $Sect.SHIP[$Ship_IDX].NAME & ANSI_3&" ["&ANSI_4&"Owned By"&ANSI_3&"] " & $Sect.SHIP[$Ship_IDX].OWNER & ANSI_14&","&ANSI_2&" w/ " &ANSI_14& $CashAmount & ANSI_2&" ftrs"&ANSI_14&","
			Echo "*            "&ANSI_2&"(" &ANSI_7& $Sect.SHIP[$Ship_IDX].SHIP & ANSI_2&")"
			add $Ship_IDX 1
			while ($Ship_IDX <= $Sect.SHIPS)
				setVar $CashAmount $Sect.SHIP[$Ship_IDX].FIGS
				gosub :CommaSize
				Echo ANSI_1 & "*           " & ANSI_14 & ": " & ANSI_15 & $Sect.SHIP[$Ship_IDX].NAME & ANSI_3&" ["&ANSI_4&"Owned By"&ANSI_3&"] " & $Sect.SHIP[$Ship_IDX].OWNER & ANSI_14&","&ANSI_2&" w/ " &ANSI_14& $CashAmount & ANSI_2&" ftrs"&ANSI_14&","
				Echo "*            "&ANSI_2&"(" &ANSI_7& $Sect.SHIP[$Ship_IDX].SHIP & ANSI_2&")"
				add $Ship_IDX 1
			end
		end

		if ($Sect.NAVHAZ <> 0)
			Echo ANSI_1 & "* NavHaz  "&ANSI_14&": " &ANSI_12 & $Sect.NAVHAZ & ANSI_1 & "% ("&ANSI_8&"Space Debris/Asteroids"&ANSI_1&")"
		end
	end

	#	This is how we include Figther Data regardless of the Verbose setting
	if (($Figs[$Sect.INDEX] <> 0) OR ($Sect.FIGS.QUANTITY > 0))
		if ($Sect.FIGS.QUANTITY > 0)
			setVar $CashAmount $Sect.FIGS.QUANTITY
			gosub :CommaSize
			Echo ANSI_1 &"* Fighters"&ANSI_14&": " &ANSI_15 & $CashAmount & ANSI_1 &" (" &ANSI_5& $Sect.FIGS.OWNER & ANSI_1&") "&ANSI_10&"[" & ANSI_2&$Sect.FIGS.TYPE & ANSI_10&"]"
		else
			Echo ANSI_1 &"* Fighters"&ANSI_14&": " & ANSI_2 & "Friendly Fig(s) Present"
		end
	end

	if ($VERBOSE)
		if ($Sect.ARMIDMINES.QUANTITY > 0)
			Echo ANSI_1 & "* Mines   " & ANSI_14 & ": " & ANSI_12 & $Sect.ARMIDMINES.QUANTITY & ANSI_1 & " (" & ANSI_2 & "Type " & ANSI_14 & "1" & ANSI_2 & " Armid" & ANSI_1 & ")" & ANSI_5 & " (" & $Sect.ARMIDMINES.OWNER & ")"
		end
		if ($Sect.LIMPETMINES.QUANTITY > 0)
			if ($Sect.ARMIDMINES.QUANTITY > 0)
				Echo "*         "&ANSI_14&": "
			else
				Echo ANSI_1&"* Mines   "&ANSI_14&": "
			end
			Echo ANSI_12 & $Sect.LIMPETMINES.QUANTITY & ANSI_1 & " ("&ANSI_2&"Type "&ANSI_14&"2"&ANSI_2&" Limpet"&ANSI_1&")"&ANSI_5&" (" & $Sect.LIMPETMINES.OWNER & ")"
		end

        Echo ANSI_10&"* Warps to Sector(s) "&ANSI_14&":  "
		setVar $adj 1
		if ($Sect.WARP[$adj] <> 0)
			if ($Figs[$Sect.WARP[$adj]] <> 0)
				Echo " " & ANSI_8&$Sect.WARP[$adj]
			else
				Echo " " & ANSI_15&$Sect.WARP[$adj]
			end
			add $adj 1
			while ($Sect.WARP[$adj] <> 0)
				setVar $t $Sect.WARP[$adj]
				if ($Figs[$Sect.WARP[$adj]] <> 0)
					Echo ANSI_2 & " - " &ANSI_8& $Sect.WARP[$adj]
				else
					Echo ANSI_2 & " - " &ANSI_15& $Sect.WARP[$adj]
				end
				add $adj 1
			end
		end
	end
    Echo "*" #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196
	return