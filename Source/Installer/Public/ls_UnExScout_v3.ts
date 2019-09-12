	setVar $TagLine 			"LS's UnExplored Scout"
   	setVar $TagLineB 			"LScout"
   	setVar $Version				"3.01"
   	setVar $Magic_Starts_At		70
	setVar $Targets				0
	setVar $Target_CNT			0
	setArray $que 				SECTORS
	setArray $checked 			SECTORS
	setVar $maxFigAttack		0
	setVar $Explore_Check		25
	setVar $START_TWARPN		FALSE
	setVar $hops 				40
	setVar $Report_RYLOS		FALSE
	setVar $Report_ALPHA		FALSE
	setVar $Pass				1

	setVar $ALL_UNEXPLORED		TRUE
	setVar $GO_BACKWARDS		FALSE
    setVar $DROPPING			1

	gosub :quikstats

	:I_Must_Have_Stuttered
	echo "**"
	echo ANSI_15 & "  " & $TagLine & " v" & $Version
	getLength ($TagLine & " " & $TagLineB) $Len
	setVar $Buff ""
	setVar $i 0
	while ($i < $Len)
		setVar $Buff ($Buff & "=")
		add $i 1
	end
	echo ANSI_12 & "*  " & $Buff
	echo ANSI_15 & "*  1 " & ANSI_14 & "All Unexplored Sectors?"
	echo ANSI_15 & "*  2 " & ANSI_14 & "All Unexplored Unfig'd Sectors?"
	echo ANSI_15 & "*  3 " & ANSI_14 & "Exlore Direction "
	if ($GO_BACKWARDS)
		echo ANSI_5 & "Backwards"
	else
		echo ANSI_5 & "Forwards"
	end
	echo ANSI_15 & "*  4 " & ANSI_14 & "Figs/Sector: " & ANSI_15 $DROPPING
	echo ANSI_15 & "*  Q " & ANSI_14 & "Never Mind"
	echo "*"
	getConsoleInput $s SINGLEKEY
	uppercase $s
	if ($s = "1")
		setVar $ALL_UNEXPLORED TRUE
	elseif ($s = "2")
		setVar $ALL_UNEXPLORED FALSE
	elseif ($s = "3")
		if ($GO_BACKWARDS = TRUE)
			setVar $GO_BACKWARDS FALSE
		else
			setVar $GO_BACKWARDS TRUE
		end
		goto :I_Must_Have_Stuttered
	elseif ($s = "4")
		getInput $s	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*How Many Fighters To Deploy/Sector (" & ANSI_6 & "You Have " & $FIGHTERS & ANSI_14 & ", Fighters)?"
		isNumber $tst $s
		if ($tst = 0)
			setVar $s 1
		end
		if ($s >= $FIGHTERS)
			setVar $s 1
		end
		if ($s = 0)
			setVar $s 1
		end
        setVar $DROPPING $s
        goto :I_Must_Have_Stuttered
	elseif ($s = "Q")
		Echo "*"
		halt
	else
    	goto :I_Must_Have_Stuttered
	end

	gosub :Global_Grover
	gosub :quikstats
	gosub :Good_to_Go
	gosub :Explored
    gosub :CN_Check

	send "'" & $TagLine & " v" & $Version & " - Powering Up...*"
	waitfor "Message sent on sub-space channel"
    send " J  Y  *  C ;UYQ "
	waitfor "Max Figs Per Attack:"
	getWord CurrentLine $maxFigAttack 5
	stripText $maxFigAttack ","
	isNumber $tst $maxFigAttack
	if ($tst = 0)
		setVar $maxFigAttack 9999
	end

	Echo "**"
    echo ("*"&ANSI_8&"<"&ANSI_15&"Reading Fighter Data...")
	setVar $idx 11
	setVar $Count 0
	while ($idx <= SECTORS)
		getSectorParameter $idx "FIGSEC" $F
		isNumber $tst $F
		if ($tst = 0)
			setVar $F 0
			setSectorParameter $idx "FIGSEC" FALSE
		end
		if ($F <> 0)
			add $Count 1
		end
    	add $idx 1
	end
	Echo (#8 & #8 & #8 & ANSI_15 & ": " & ANSI_14 & $Count & " Sectors Gridded" & ANSI_8 & ">**")

	setVar $i 1
	setVar $Target_CNT 1

    if ($ALL_UNEXPLORED)
        echo ("*"&ANSI_8&"<"&ANSI_15&"Building Target File: "&ANSI_14&"All Unexplored Sectors"&ANSI_8&">*")
		while ($i <= SECTORS)
			if ((SECTOR.EXPLORED[$i] = "NO") OR (SECTOR.EXPLORED[$i] = "CALC"))
				setVar $Targets[$Target_CNT] $i
				add $Target_CNT 1
			end
	    	add $i 1
		end
	else
        echo ("*"&ANSI_8&"<"&ANSI_15&"Building Target File: "&ANSI_14&"All Unexplored UnFig'd Sectors"&ANSI_8&">*")
		while ($i <= SECTORS)
			getSectorParameter $i "FIGSEC" $F
			isNumber $tst $F
			if ($tst = 0)
				setVar $F 0
				setSectorParameter $i "FIGSEC" FALSE
			end
			if (((SECTOR.EXPLORED[$i] = "NO") OR (SECTOR.EXPLORED[$i] = "CALC")) AND ($F = 0))
				setVar $Targets[$Target_CNT] $i
				add $Target_CNT 1
			end
	    	add $i 1
		end
	end

	if ($Target_CNT > 1)
		subtract $Target_CNT 1
	end

    if ($GO_BACKWARDS)
	    echo ("*"&ANSI_8&"<"&ANSI_15&"Plotting A Reverse Course"&ANSI_8&">*")
    	setArray $BIAZZARO_Targets $Target_CNT
    	setVar $i $Target_CNT
    	setVar $j 1
    	while ($i > 0)
    		setvar $Bizzaro $Targets[$i]
			setVar $BIAZZARO_Targets[$j] $Bizzaro
			add $j 1
        	subtract $i 1
    	end
    	setArray $Targets $Target_CNT
    	setVar $i 1
    	while ($i < $Target_CNT)
    		setVar $Bizzaro $BIAZZARO_Targets[$i]
    		setVar $Targets[$i] $Bizzaro
	       	add $i 1
    	end
	end

	setPrecision 2
	if ($IKNOW >= 100)
		# Let's Double Check The Computer
		echo ("*"&ANSI_8&"<"&ANSI_15&"Verifying 100% Explore Detected."&ANSI_8&">*")
		gosub :Read_Computer
		if ($Target_CNT = 0)
		    send "'"&$TagLine&" - 100% Explored, Nothing To Do*"
		   	waitfor "Message sent on sub-space channel"
		    halt
		end
	else
		send "'"&$TagLine&" - Charging "&$Target_CNT&" ("&(100-$IKNOW)&"%) Unexplored Sectors...*"
	   	waitfor "Message sent on sub-space channel"
	end

	setPrecision 4
	setVar $IKNOWCALC ($IKNOW / 100)
	setVar $IKNOWCALC (SECTORS * $IKNOWCALC)
	setPrecision 0
	add $IKNOWCALC 1
	subtract $IKNOWCALC 1
	Window Explored 300 130 ($TagLine & " v" & $Version) ONTOP
	setWindowContents Explored "* Explored So Far: " & $IKNOW & "%* Approximately  : " & $IKNOWCALC & " Sectors*"
    setPrecision 2
	if ($IKNOW >= $Magic_Starts_At)
		setVar $START_TWARPN 	TRUE
	end

    setPrecision 0

	if (RYLOS < 1)
		setVar $Report_RYLOS 	TRUE
	end

	if (ALPHACENTAURI < 1)
		setVar $Report_ALPHA	TRUE
	end

    setVar $Target_Ptr 1
	setVar $Runs			$Explore_Check

	getTimer	$StarTicks

	while ($Target_Ptr <= SECTORS)
		if ($Runs = 0)
			getTimer	$StopTicks
			setPrecision 2
			setVar $IKnew $IKNOW
			gosub :Explored
			setVar $Runs $Explore_Check
			setVar $IKNEW ($IKNOW - $IKNEW)
			setPrecision 4
			setVar $IKNOWCALC ($IKNOW / 100)
			setVar $IKNOWCALC (SECTORS * $IKNOWCALC)
			setPrecision 0
			add $IKNOWCALC 1
			subtract $IKNOWCALC 1
			setPrecision 18
			setVar $durationTicks ($StopTicks - $StarTicks)
			setVar $seconds ($durationTicks / 2200000000)
			setPrecision 2
			if ($IKNEW = 0)
				# No change in explored precentage
				# This can occur when X-number of sectors has been by-passed because, for example,
				# there isn't enough unexplored candidates in the warp path.
				setWindowContents Explored "* Explored So Far: " & $IKNOW & "%* Approximately  : " & $IKNOWCALC & " Sectors* Increase of    : 0.00%* Minutes Left   : " & $tempp & "*"
			else
				setVar $tempp ((100 - $IKNOW) / $IKNEW)
				setVar $tempp (($tempp * $Seconds) / 60)
				setWindowContents Explored "* Explored So Far: " & $IKNOW & "%* Approximately  : " & $IKNOWCALC & " Sectors* Increase of    : " & $IKNEW & "%* Minutes Left   : " & $tempp & "*"
			end
			setPrecision 2
			getTimer	$StarTicks
		else
			subtract $Runs 1
		end

		if ($START_TWARPN = 0)
			if ($IKNOW >= $Magic_Starts_At)
				gosub :DOIN_THE_CIM
				setVar $START_TWARPN	TRUE
			end
		end

		setPrecision 0

        setVar $destination $Targets[$Target_Ptr]

		if ($START_TWARPN)
			gosub :Find_Closest_UNEXPLORED
			if ($UNX_focus <> 0)
				setVar $destination $UNX_focus
				#reset the $Target_Ptr ptr as it'll be incremented at bottom of the While Loop
				if ($Target_Ptr > 1)
					#	Okay this can be a little confusing... script cycles through Targets Array using $Target_Ptr as a pointer.
					#	At this point, if script finds an Unexplored that's close, it'll Twarp/Mow to it instead of
					#	$targets[$Target_Ptr]  ... problem is, at the end of this While-loop $Target_Ptr is incremented; to avoid
					#	skipping a Target, we subtract 1 from $Target_Ptr, so that on next Loop $Target_Ptr will be $Target_Ptr+1, and not $Target_Ptr+2
					subTract $Target_Ptr 1
				end
				goto :Lets_MOW_After_Twarp
		    end
		end

    	if ($destination <> 0)
    		if ($ALL_UNEXPLORED)
	            if ((SECTOR.EXPLORED[$destination] = "NO") OR (SECTOR.EXPLORED[$destination] = "CALC"))
					# Do Something Useful Damn it!
            	else
            		goto :Next_Target_Jmp_Point
				end
            else
				getSectorParameter $destination "FIGSEC" $F
				isNumber $tst $F
				if ($tst = 0)
					setVar $F 0
					setSectorParameter $destination "FIGSEC" FALSE
				end

				if (((SECTOR.EXPLORED[$destination] = "NO") OR (SECTOR.EXPLORED[$destination] = "CALC")) AND ($F = 0))
					# Do Something Useful Damn it!
				else
					goto :Next_Target_Jmp_Point
				end
            end

			:Lets_Rock_Baby
    		if ($START_TWARPN)
				send "  C  F*"&$destination&"*F"&$destination&"*"&CURRENTSECTOR&"*Q"
				waiton "<Computer deactivated>"
				waiton "Command [TL"
				GoSub :Examine_Warp_Path
				if ($Warp_Path_Candidates >= 2)
					goto :Lets_MOW_After_Twarp
				end
    			gosub :quikstats
    			getDistance $Gas_Gage $CURRENT_SECTOR $Destination
    			if ($Gas_Gage > 0)
    				SetVar $Gas_Gage ($Gas_Gage * 3)
    			else
    				Setvar $Gas_Gage $TOTAL_HOLDS
    			end

				# get fuel if necessary
				if ($ORE_HOLDS < $Gas_Gage)
					gosub :Get_GasOreLeen
					gosub :quikstats
				end

				echo ("*"&ANSI_8&"<"&ANSI_15&"Finding Closest Jmp Point to Destination "&ANSI_14&$destination&ANSI_8&">*")
				gosub  :Find_Closest_FIG
				if ($FIG_Focus <> 0)
					echo ("*"&ANSI_8&"<"&ANSI_15&"Jmp Sector: "&ANSI_14&$FIG_Focus&ANSI_8&">*")
				    setTextLineTrigger	Sector__Good	:Sector__Good	"Locating beam pinpointed, TransWarp"
					setTextLineTrigger	Sector__Here	:Sector__Good	"<Set NavPoint>"
					setTextLineTrigger	Sector__Bad		:Sector__Bad	"No locating beam found"
					setTextLineTrigger	Sector__Far		:Sector__Far	"You do not have enough Fuel Ore to make the jump."
					send " M" & $FIG_Focus & "*Y"
					pause
					:Sector__Bad
						killAllTriggers
						setSectorParameter $FIG_Focus "FIGSEC" FALSE
						send "  n  "
						goto :Lets_MOW_After_Twarp
					:Sector__Far
						killAllTriggers
						goto :Lets_MOW_After_Twarp
					:Sector__Good
						killAllTriggers
						echo ("*"&ANSI_8&"<"&ANSI_15&"Twarping To Jump Point: "&ANSI_14&$FIG_Focus&ANSI_8&">*")
						send "  Y  *  A Z " & $maxFigAttack & "*  **   "
				else
					echo ("*"&ANSI_8&"<"&ANSI_15&"Jmp Sector: "&ANSI_14&"N"&ANSI_15&"/"&ANSI_14&"A*")
				end
			end
			# -> ($START_TWARPN)
			:Lets_MOW_After_Twarp
			if ($FIG_Focus <> $destination)
	        	gosub :getCourse
	        	if ($courseLength <> 0)
					setVar $j 2
					setVar $result ""
					while ($j <= $courseLength)
						setVar $result $result&"m "&$COURSE[$j]&"* "
						if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK))
							setVar $result ($result&" Z  A  "&$maxFigAttack&"*  *  r  *  ")
						end
						# If Not FED Space, Drop A Fig, if we haven't already
						if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK) AND ($j > 2))
							getSectorParameter $COURSE[$j] "FIGSEC" $F
							isNumber $tst $F
							if ($tst = 0)
								setVar $F 0
								setSectorParameter $COURSE[$j] "FIGSEC" FALSE
							end
							if ($F = 0)
								#setVar $result ($result&" F  Z  1 * Z  C  D  *  ")
								setVar $result ($result&" F  Z  " & $DROPPING & " *  Z  C  D  *  ")
								setSectorParameter $COURSE[$j] "FIGSEC" TRUE
							end
						end
						setVar $a 1
						setVar $HOLO FALSE
						while (SECTOR.WARPS[$COURSE[$j]][$a] > 0)
							setVar $aa SECTOR.WARPS[$COURSE[$j]][$a]
							if ((SECTOR.EXPLORED[$aa] = "NO") OR (SECTOR.EXPLORED[$aa] = "CALC"))
								setVar $HOLO TRUE
	                    		goto :Continue
							end
	                    	add $a 1
						end
						:Continue
						if (($HOLO) OR (SECTOR.EXPLORED[$COURSE[$j]] = "NO") OR (SECTOR.EXPLORED[$COURSE[$j]] = "CALC"))
							setVar $result ($result&" SDSH* ")
						end
						add $j 1
					end
					waitfor "Command ["
					send ($result&" **  ^q ")
					waiton ": ENDINTERROG"
				else
					echo ("*"&ANSI_8&"<"&ANSI_15&"Path To Destination Unreachable/Avoided: "&ANSI_14&$destination&ANSI_8&">*")
					goto :Next_Target_Jmp_Point
				end
				# -> ($FIG_Focus <> $destination)
			end
			gosub :quikstats
			if ($FIGHTERS < 1000)
				echo ("*"&ANSI_8&"<"&ANSI_15&"Too Few Fighters On Board"&ANSI_8&">*")
				halt
			end
			if ($CURRENT_SECTOR <> $destination)
				echo ("*"&ANSI_8&"<"&ANSI_15&"Did Not Reach Destination"&ANSI_8&">*")
				halt
			end
			# -> ((SECTOR.EXPLORED[$destination] = "NO") OR (SECTOR.EXPLORED[$destination] = "CALC"))
		else
			# -> ($destination <> 0)
			if ($Pass = 1)
				setVar $Targets 0
            	setVar $Target_Ptr 1
				setVar $Target_CNT 0

				while ($Target_Ptr <= SECTORS)
			    	if ($ALL_UNEXPLORED)
						if ((SECTOR.EXPLORED[$Target_Ptr] = "NO") OR (SECTOR.EXPLORED[$Target_Ptr] = "CALC"))
							setVar $Targets[$Target_CNT] $Target_Ptr
							add $Target_CNT 1
						end
					else
						getSectorParameter $Target_Ptr "FIGSEC" $F
						isNumber $tst $F
						if ($tst = 0)
							setVar $F 0
							setSectorParameter $Target_Ptr "FIGSEC" FALSE
						end
						if (((SECTOR.EXPLORED[$Target_Ptr] = "NO") OR (SECTOR.EXPLORED[$Target_Ptr] = "CALC")) AND ($F = 0))
							setVar $Targets[$Target_CNT] $Target_Ptr
							add $Target_CNT 1
						end
					end
			    	add $Target_Ptr 1
				end


				if ($Target_CNT > 0)
					send "'"&$TagLineB&" - Pass 1 Complete - " & $Target_CNT & " Targets Remain*"
					setVar $Target_Ptr 1
				else
					goto :We_Done
				end
				add $Pass 1
			else
				echo ("*"&ANSI_8&"<"&ANSI_15&"Verifying Explored Sector Data."&ANSI_8&">*")
				gosub :Read_Computer
				if ($Target_CNT = 0)
	        		goto :We_Done
	        	else
					setVar $Target_Ptr 1
	        	end
			end
        end

		if (($Report_RYLOS) AND (RYLOS > 1))
			send "'"&$TagLineB&" - Class 0 RYLOS Spotted In Sector: " & RYLOS &"*"
			waitfor "Message sent on sub-space channel"
			setVar $Report_RYLOS	FALSE
		end

		if (($Report_ALPHA) AND (ALPHACENTAURI > 1))
			send "'"&$TagLineB&" - Class 0 ALPHACENTAURI Spotted In Sector: " & ALPHACENTAURI &"*"
			waitfor "Message sent on sub-space channel"
            setVar $Report_ALPHA	FALSE
		end
		:Next_Target_Jmp_Point
		add $Target_Ptr 1
	end


:We_Done
	getTime $tim "h:m:sam/pm"
	send "'"&$TagLine&" - Completed "&$tim&"*"
	halt
    #=--------                                                                       -------=#
     #=------------------------------      SUB ROUTINES      ------------------------------=#
    #=--------                                                                       -------=#
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
	return

:Global_Grover
	setVar $CURRENT_PROMPT 		"Undefined"
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
	setVar $PORT_PROMPT			"Port"
	setVar $PORT_PROMPT_TYPE	""
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


:Good_to_Go
	setVar $Str_Good_to_Go	("**"&ANSI_14&$TagLineB&ANSI_15&" - The following @@@XXX^^^, thing(s) need to be addressed:**")
	setVar $Good_To_Go		TRUE
	setVar $Str_Buffer		""
	setVar $Problem_Cnt		0

	getLength $TagLineB $Len
	add $len 10
	While ($Len > 0)
		setVar $Str_Buffer ($Str_Buffer & " ")
		subtract $Len 1
	end

	if ($CURRENT_PROMPT <> "Command")
		add $Problem_Cnt 1
		setVar $Str_Good_to_Go ($Str_Good_to_Go&$Str_Buffer&ANSI_14&$Problem_Cnt&" "&ANSI_7&"Start From Command Prompt*")
		setVar $Good_To_Go FALSE
	end
	if ($TWARP_TYPE = "No")
		add $Problem_Cnt 1
		setVar $Str_Good_to_Go ($Str_Good_to_Go&$Str_Buffer&ANSI_14&$Problem_Cnt&" "&ANSI_7&"At Least A Type-1 Twarp Drive*")
		setVar $Good_To_Go FALSE
	end
	if ($SCAN_TYPE <> "Holo")
		add $Problem_Cnt 1
		setVar $Str_Good_to_Go ($Str_Good_to_Go&$Str_Buffer&ANSI_14&$Problem_Cnt&" "&ANSI_7&"A Long Range Scanner*")
		setVar $Good_To_Go FALSE
	end
	if ($FIGHTERS < 1000)
		add $Problem_Cnt 1
		setVar $Str_Good_to_Go ($Str_Good_to_Go&$Str_Buffer&ANSI_14&$Problem_Cnt&" "&ANSI_7&"At Least 1,000 Fighters*")
		setVar $Good_To_Go FALSE
	end
	if ($CREDITS < 1000000)
		add $Problem_Cnt 1
		setVar $Str_Good_to_Go ($Str_Good_to_Go&$Str_Buffer&ANSI_14&$Problem_Cnt&" "&ANSI_7&"Minimum 1,000,000 Cash On Hand*")
		setVar $Good_To_Go FALSE
	end
	if ($PHOTONS <> 0)
		add $Problem_Cnt 1
		setVar $Str_Good_to_Go ($Str_Good_to_Go&$Str_Buffer&ANSI_14&$Problem_Cnt&" "&ANSI_7&"Cannot Run With Photons On Board*")
		setVar $Good_To_Go FALSE
	end

	if ($Good_To_Go = 0)
		replaceText $Str_Good_to_Go "@@@XXX^^^" $Problem_Cnt
		echo $Str_Good_to_Go & "**"
		halt
	end
	return

:Explored
	setVar $IKNOW		0
	send "  CK"
	setTextLineTrigger	IHaveExplored	:IHAveExplored	"You have explored"
	pause
	:IHAveExplored
	killAllTriggers
	getText CURRENTLINE $IKNOW "explored " "% of"
	stripText $IKNOW " "
	send "* Q  "
	return

:Get_GasOreLeen
	setVar $Gas_a			1
	setVar $Dist 			1000
	setVar $Gas_Warpto		0
	setVar $Gas_ADJ_Has_Gas	FALSE
	setVar $Gas_adj 1
	send "  **"

	echo ("*"&ANSI_8&"<"&ANSI_15&"Searching For Closest Gas Station"&ANSI_8&">*")

	while ($Gas_adj <= SECTOR.WARPCOUNT[CURRENTSECTOR])
		SetVar $Gas_adjSector SECTOR.WARPS[CURRENTSECTOR][$Gas_adj]
		if ((PORT.CLASS[$Gas_adjSector] = 3) OR (PORT.CLASS[$Gas_adjSector] = 4) OR (PORT.CLASS[$Gas_adjSector] = 5) OR (PORT.CLASS[$Gas_adjSector] = 7))
			setVar $Gas_ADJ_Has_Gas TRUE
			goto :We_Got_Game
		end
    	add $Gas_adj 1
	end
	:We_Got_Game
	if ((PORT.CLASS[CURRENTSECTOR] = 3) OR (PORT.CLASS[CURRENTSECTOR] = 4) OR (PORT.CLASS[CURRENTSECTOR] = 5) OR (PORT.CLASS[CURRENTSECTOR] = 7))
		send "  P  T  *  *  "
	elseif ($Gas_ADJ_Has_Gas)
		getSectorParameter $Gas_adjSector "FIGSEC" $F
		isNumber $tst $F
		if ($tst = 0)
			setVar $F 0
			setSectorParameter $Gas_adjSector "FIGSEC" FALSE
		end
		if ($F = 0)
			send ("M"&$Gas_adjSector&"*  *  Z  A "&$maxFigAttack&"*  *  F  Z  " & $DROPPING & " *  Z  C  D  *  *  P  T  *  *   ")
			setSectorParameter $Gas_adjSector "FIGSEC" TRUE
		else
			send ("M"&$Gas_adjSector&"*  *  Z  A "&$maxFigAttack&"* *  P  T *  *  ")
		end
	else
		gosub :Find_Closest_Sxx
		if ($Sxx_Focus <> 0)
			echo ("*"&ANSI_8&"<"&ANSI_15&"Found Gas Station At: "&ANSI_14&$Sxx_Focus&ANSI_8&">*")
		    setTextLineTrigger	Sector_Gas_Good	:Sector_Gas_Good	"Locating beam pinpointed, TransWarp"
			setTextLineTrigger	Sector_Gas_Here	:Sector_Gas_Good	"<Set NavPoint>"
			setTextLineTrigger	Sector_Gas_Bad	:Sector_Gas_Bad		"No locating beam found"
			setTextLineTrigger	Sector_Gas_Far	:Sector_Gas_Far		"You do not have enough Fuel Ore to make the jump."
			send " M" & $Sxx_Focus & "*Y"
			pause
			:Sector_Gas_Bad
				killAllTriggers
			:Sector_Gas_Far
				killAllTriggers
				echo ("*"&ANSI_8&"<"&ANSI_15&"Mowing To Gas Station"&ANSI_8&">*")
				send "  *  "
				setVar $Holding $destination
				setVar $destination $Sxx_Focus
				gosub :getCourse
	            setVar $destination $Holding
	        	if ($courseLength <> 0)
					setVar $j 2
					setVar $result ""
					while ($j <= $courseLength)
						setVar $result $result&"m"&$COURSE[$j]&"* "
						if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK))
							setVar $result ($result&" Z A "&$maxFigAttack&"* * ")
						end
						if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK) AND ($j > 2))
							getSectorParameter $COURSE[$j] "FIGSEC" $F
							isNumber $tst $F
							if ($tst = 0)
								setVar $F 0
								setSectorParameter $COURSE[$j] "FIGSEC" FALSE
							end

							if ($F = 0)
								setVar $result ($result&" F  Z  " & $DROPPING & " *  Z  C  D  * ")
								setSectorParameter $COURSE[$j] "FIGSEC" TRUE
							end
						end
						add $j 1
					end
					waitfor "Command ["
					send ($result&" P  T  *  *  ^q ")
					waiton ": ENDINTERROG"
					return
				end
				# -> ($courseLength <> 0)
			:Sector_Gas_Good
				killAllTriggers
				if (($Gas_warpto > 10) AND ($Gas_warpto <> STARDOCK))
					getSectorParameter $Sxx_Focus "FIGSEC" $F
					isNumber $tst $F
					if ($tst = 0)
						setVar $F 0
						setSectorParameter $Sxx_Focus "FIGSEC" FALSE
					end

					if ($F = 0)
						send ("  Y  *  Z  A "&$maxFigAttack&"* F  Z  " & $DROPPING & " *  Z  C  D  *  P  T  *  *  ** ")
						setSectorParameter $Sxx_Focus "FIGSEC" TRUE
					else
						send ("  Y  *  Z  A "&$maxFigAttack&"*  *  P  T  *  *  ** ")
					end
				else
					send "  Y  *  P  T  *  *  ** "
				end
		end
	end
	# -> ((PORT.CLASS[CURRENTSECTOR] = 3) OR (PORT.CLASS[CURRENTSECTOR] = 4) OR (PORT.CLASS[CURRENTSECTOR] = 5) OR (PORT.CLASS[CURRENTSECTOR] = 7))
	return


:getCourse
	killalltriggers
	setVar $sectors ""
	setTextLineTrigger sectorlinetrig :sectorsline " > "
	send "^f*"&$destination&"*nq"
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
	setVar $courseLength 0
	setVar $index 1
	:keepGoing
	if ($sectors = " FM     :::")
		return
	end
	getWord $sectors $COURSE[$index] $index
	while ($COURSE[$index] <> ":::")
		add $courseLength 1
		add $index 1
		getWord $sectors $COURSE[$index] $index
	end
	return

:DOIN_THE_CIM
	setVar $Yippie		""
	setVar $LineCounter	1
	send " ^IQ"
	setTextLineTrigger 	Done		:Done_CIM	": ENDINTERROG"
	:Please_Sir_May_I_Have_Another
	setTextLineTrigger	ScanLine	:ScanLine
	pause
	:ScanLine
		killTrigger ScanLine
		if ($LineCounter >= 100)
			setVar $Yippie (ANSI_14&"*=-=-=-=CIMing=-=-=-=*"&ANSI_7)
			setVar $LineCounter 1
		else
			if ($Yippie <> "")
				echo $Yippie
				setVar $Yippie ""
			end
			add $LineCounter 1
		end
		goto :Please_Sir_May_I_Have_Another
	:Done_CIM
		killAlltriggers
		return


:Find_Closest_Sxx
	setArray $checked 			SECTORS
	setVar	$Sxx_bottom 1
	setVar	$Sxx_top 1
	setVar	$que[1] CURRENTSECTOR
	setVar	$Sxx_Hopper 1

	while (($Sxx_bottom <= $Sxx_top) AND ($Sxx_Hopper <= $hops))
		setVar $Sxx_Focus $que[$Sxx_bottom]
		if ((PORT.CLASS[$Sxx_Focus] = 3) OR (PORT.CLASS[$Sxx_Focus] = 4) OR (PORT.CLASS[$Sxx_Focus] = 5) OR (PORT.CLASS[$Sxx_Focus] = 7))
			return
		end
		setVar $a 1
		while ($a <= SECTOR.WARPCOUNT[$Sxx_Focus])
			setVar $adjacent SECTOR.WARPS[$Sxx_Focus][$a]
			if ($checked[$adjacent] = 0)
				setVar $checked[$adjacent] 1
				add $Sxx_top 1
				setVar $que[$Sxx_top] $adjacent
			end
			add $a 1
		end
		add $Sxx_bottom 1
		add $Sxx_Hopper 1
	end
	setVar $Sxx_Focus 0
	return

:Find_Closest_FIG
	setArray $checked 			SECTORS
	setVar	$FIG_bottom 1
	setVar	$FIG_top 1
	setVar	$que[1] $destination
	setVar	$FIG_Hopper 1

	while (($FIG_bottom <= $FIG_top) AND ($FIG_Hopper <= $hops))
		# Now, pull out the next sector in the que, and make it our focus
		setVar $FIG_Focus $que[$FIG_bottom]
		getSectorParameter $FIG_Focus "FIGSEC" $F
		isNumber $tst $F
		if ($tst = 0)
			setVar $F 0
			setSectorParameter $FIG_Focus "FIGSEC" FALSE
		end
		if ($F <> 0)
			return
		end
		setVar $a 1
		while ($a <= SECTOR.WARPCOUNT[$FIG_Focus])
			setVar $adjacent SECTOR.WARPS[$FIG_Focus][$a]
			if ($checked[$adjacent] = 0)
				setVar $checked[$adjacent] 1
				add $FIG_top 1
				setVar $que[$FIG_top] $adjacent
			end
			add $a 1
		end
		add $FIG_bottom 1
		add $FIG_Hopper 1
	end
	setVar $FIG_Focus 0
	return

:Find_Closest_UNEXPLORED
	setArray $checked SECTORS
	setVar $UNX_bottom 1
	setVar $UNX_top 1
	setVar $que[1] CURRENTSECTOR
	setVar $UNX_Hopper 1

	while (($UNX_bottom <= $UNX_top) AND ($UNX_Hopper <= $hops))
		setVar $UNX_focus $que[$UNX_bottom]
		if ($ALL_UNEXPLORED)
			if ((SECTOR.EXPLORED[$UNX_focus] = "NO") OR (SECTOR.EXPLORED[$UNX_focus] = "CALC"))
				return
			end
		else
			#setVar $FIG_Focus $que[$FIG_bottom]
			setVar $FIG_Focus $que[$UNX_bottom]
			getSectorParameter $UNX_focus "FIGSEC" $F
			isNumber $tst $F
			if ($tst = 0)
				setVar $F 0
				setSectorParameter $UNX_focus "FIGSEC" FALSE
			end
			if (((SECTOR.EXPLORED[$UNX_focus] = "NO") OR (SECTOR.EXPLORED[$UNX_focus] = "CALC")) AND ($F = 0))
				return
			end
		end
		setVar $a 1
		while ($a <= SECTOR.WARPCOUNT[$UNX_focus])
			setVar $adjacent SECTOR.WARPS[$UNX_focus][$a]
			if ($checked[$adjacent] = 0)
				setVar $checked[$adjacent] 1
				add $UNX_top 1
				setVar $que[$UNX_top] $adjacent
			end
			add $a 1
		end
		add $UNX_bottom 1
		add $UNX_Hopper 1
	end
	setVar $UNX_focus 0
	return

:Examine_Warp_Path
	SetVar $Warp_Path_Candidates 0
	GetCourse $Of_Course $CURRENT_SECTOR $Destination
	setVar $Examine_Warp_Path_i 1
	while ($Examine_Warp_Path_i <= $Of_Course)
		setVar $Examine_Warp_Path $Of_Course[$Examine_Warp_Path_i]

		if ($ALL_UNEXPLORED)
			if ((SECTOR.EXPLORED[$Examine_Warp_Path] = "NO") OR (SECTOR.EXPLORED[$Examine_Warp_Path] = "CALC"))
				add $Warp_Path_Candidates 1
			end
		else
			getSectorParameter $Examine_Warp_Path "FIGSEC" $F
			isNumber $tst $F
			if ($tst = 0)
				setVar $F 0
				setSectorParameter $Examine_Warp_Path "FIGSEC" FALSE
			end

			if (((SECTOR.EXPLORED[$Examine_Warp_Path] = "NO") OR (SECTOR.EXPLORED[$Examine_Warp_Path] = "CALC")) AND ($F = 0))
				add $Warp_Path_Candidates 1
			end
		end
		add $Examine_Warp_Path_i 1
	end
	Echo ("*"&ANSI_8&"<"&ANSI_15&"Warp Path Candidates: "&ANSI_14&$Warp_Path_Candidates&ANSI_8&">*")
	return


:Read_Computer
	setVar $Targets				0
	setVar $Target_CNT			0
	send "ckuq"
	setTextLineTrigger trigger :get_secs
	pause
	:get_secs
		getWord CURRENTLINE $sector 1
		getWord CURRENTLINE $stopper 2
		isNumber $secnum $sector
	:add_in
		if ($secnum = 1) and ($sector <> 0)
			:grab_secs
				setVar $columnCount 0
				add $columnCount 1
				add $Target_CNT 1
				getWord CURRENTLINE $sektor $columnCount
				if ($sektor > 0) and ($sektor <= SECTORS)
					setVar $Targets[$Target_CNT] $sektor
					goto :grab_secs
				end
		elseif ($stopper = "deactivated>")
			goto :done_list
		end
	:trigger
		setTextLineTrigger line :get_secs
		pause
	:done_list
		return
