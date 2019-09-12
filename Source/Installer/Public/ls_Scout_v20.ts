    #=--------                                                                       -------=#
     #=---------------------  LoneStar's Unexplored Sector Scout  -------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	April 1, 2007
	#		Version		:	2.0
	#		Author		:	LoneStar
	#		TWX			:	Should Work with TWX 2.04b, or 2.04 Final
	#		Credits		:	Mind Daggers Mow Routine
	#                       Mind Daggers modified version of Singularity's quikstats
	#                       Elder Prophet's Basic Bread-First Routine
	#                       WildStar for the great idea!
	#						Runaway Proton for making his Server avail for Testing
	#						OZ for his ParseUnexploredSectors Routine in the script by same name
	#
	#		To Run		:	You will Need the following addressed
	#                                    - Start At Command Prompt
	#                                    - At Least Twarp Type 1
	#                                    - Holo Scanner
	#                                    - 1,000 Fighters
	#                                    - 1Mil Credits
	#                                    - Zero Photons
	#
	#		Fixes       :	-When in Twarp MODE, Calculates Path and tries to use existing Fuel	for Twarp
	#						-When in Twarp MODE, and Calculating Paths; If more than 2 Unexplored
	#						Sector are in the Path script will Bypass Twarp and MOW/Holo-Scan
	#						-Added Density Scanning to scanning Process.
	#						-If Calculated Jmp Point is the Target TA, script wont attempt to Mow
	#						-If GAS Port is Adj, script will buy GAS
	#						-Handeling of Sectors Avoided or Just Unreachable (i.e. bang corruption)
	#						-Added basic progress statistics
	#						-Also Added a Computer recheck as TWX sometimes 'thinks' everything has been
	#						 expplored, via send "CKUQ" ... borrowed a routine from OZ to do this.
	#						-Implemented a 2PASS system
	#						-Added Feature to Explore 'All Unxplored' OR 'AllUnexplored Unfig'd'
	#						-Added Option to search backwards
	#
	#		Description	:	UnExplored Sector Scout. Like Wildstar's, this script Mows to
	#						UnExplored Sectors, Holo scanning and dropping Figs along the
	#						way. And. Like WildStar's script this one stand a very good chance
	#						of running into something Nasty. That is where the similarites end.
	#
	#						LScout.ts, is at least 10 times faster than any other Public script
	#						of its kind. The achievement in Speed is obtained in a combination of
	#						four optimal methods: The Script keeps track of where a Fig has been
	#						Dropped; only Holo-scans when necessary; Employs Twarp; and finally
	#						looks for nearest Targets.  Upon Starting,the script will load a FIG
	#						File to ascertain existing Grid. A list of Unexplored Sectors is created.
	#						If less than 75% has been explored, the script will mow point-to-point
	#						deploying Figs & H-Scan only when necessary. After 75% has been explored
	#						the script does a CIM Warp Download and then activates the Twarp Component.
	#
	#						There are *very* few comments in the source below. But here's a descrip
	#						of the Header-vars, for easier reading:
	#                           $TagLine				Vanity
	#                           $TagLineB 				Concise Vanity
	#                           $Magic_Starts_At        Explore Percentage when script switches into Twarp
	#                           $Targets                Results of TWX scan for unexplored sectors
	#                           $Target_CNT             Total Count
	#                           $FIGS                   Deployed Fighter Array. Updated as figs are deployed
	#                           $que                    Used by Breadth Search Routines
	#                           $checked                   "          "         "
	#                           $figfile_MOM			M()M Formatted Fighter File
	#                           $figfile                Cherokee's Fighter File
	#                           $maxFigAttack           Fighter Wave sent when attacking sector figs
	#                           $Explore_Check          Flag's when to check the computer for explored percentile
	#                           $START_TWARPN           Flag. when TRUE, script will employ Twarp
	#                           $hops                   Search depth for Breath routines
	#                           $Report_RYLOS           Flag. Reports Class 0 over S.S. When TRUE
	#                           $Report_ALPHA                 "        "           "        "

	setVar $TagLine 			"LS's UnExplored Scout"
   	setVar $TagLineB 			"LScout"
   	setVar $Version				"2.00"
   	setVar $Magic_Starts_At		60
	setVar $Targets				0
	setVar $Target_CNT			0
	setArray $FIGS				SECTORS
	setArray $que 				SECTORS
	setArray $checked 			SECTORS
    setVar $figfile_MOM			"_MOM_" & GAMENAME & ".figs"
	setVar $figfile 			"_ck_" & GAMENAME & ".figs"
	setVar $maxFigAttack		0
	setVar $Explore_Check		25
	setVar $START_TWARPN		FALSE
	setVar $hops 				40
	setVar $Report_RYLOS		FALSE
	setVar $Report_ALPHA		FALSE
	setVar $Pass				1

	setVar $ALL_UNEXPLORED		TRUE
	setVar $GO_BACKWARDS		FALSE

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

	fileExists $tst $figfile_MOM
	if ($tst = 0)
		fileExists $tst $figfile
		if ($tst = 0)
			echo ("*"&ANSI_8&"<"&ANSI_15&"Reading Fighter File: "&ANSI_14&"No File Found"&ANSI_8&">*")
		else
	  		echo ("*"&ANSI_8&"<"&ANSI_15&"Reading Fighter File: "&ANSI_14&"Cherokee"&ANSI_8&">*")
			setArray $puke SECTORS
			setVar $i 1
			readtoarray $figfile $puke
			while ($i <= SECTORS)
				getWord $puke[1] $fig_check $i
				if ($fig_check <> 0)
					setVar $FIGS[$i] 1
				end
				add $i 1
			end
		end
	else
		echo ("*"&ANSI_8&"<"&ANSI_15&"Reading Fighter File: "&ANSI_14&"Mind ()ver Matter"&ANSI_8&">*")
		readtoarray $figfile_MOM $FIGS
	end

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
			if (((SECTOR.EXPLORED[$i] = "NO") OR (SECTOR.EXPLORED[$i] = "CALC")) AND ($FIGS[$i] = 0))
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
				if (((SECTOR.EXPLORED[$destination] = "NO") OR (SECTOR.EXPLORED[$destination] = "CALC")) AND ($FIGS[$destination] = 0))
					# Do Something Useful Damn it!
				else
					goto :Next_Target_Jmp_Point
				end
            end

			:Lets_Rock_Baby
    		if ($START_TWARPN)
				send "  C  F*"&$destination&"*F"&$destination&"*"&CURRENTSECTOR&"*Q"
				waitfor "<Computer deactivated>"
				send "  **  "
				setDelayTrigger		Wait_On_Damn_COMMIT		:Wait_On_Damn_COMMIT	100
				pause
				:Wait_On_Damn_COMMIT
				killTrigger Wait_On_Damn_COMMIT
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
				    setTextTrigger		Sector__Good	:Sector__Good	"All Systems Ready, shall we engage"
					setTextTrigger		Sector__Here	:Sector__Good	"NavPoint Settings (?=Help)"
					setTextTrigger		Sector__Bad		:Sector__Bad	"Do you want to make this jump blind"
					setTextTrigger		Sector__Far		:Sector__Far	"You do not have enough Fuel Ore to make the jump."
					send " M" & $FIG_Focus & "*  Y"
					pause
					:Sector__Bad
						killAllTriggers
						setVar $FIGS[$FIG_Focus] 0
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
	        		gosub :Examine_Warp_Path
					if (($Warp_Path_Candidates < 3) AND ($courseLength >= 10) AND ($Pass <= 1) AND ($START_TWARPN = 0))
						echo ("*"&ANSI_8&"<"&ANSI_15&"Skipping: "&ANSI_14&$destination&ANSI_15&", Too Few Candidates"&ANSI_8&">*")
						goto :Next_Target_Jmp_Point
					end
					setVar $j 2
					setVar $result ""
					while ($j <= $courseLength)
						setVar $result $result&"m"&$COURSE[$j]&"* "
						if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK))
							setVar $result ($result&" Z  A  "&$maxFigAttack&"*  *  ")
						end
						# If Not FED Space, Drop A Fig, if we haven't already
						if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK) AND ($j > 2))
							if ($FIGS[$COURSE[$j]] = 0)
								setVar $result ($result&" F  Z  1 * Z  C  D  *  ")
								setVar $FIGS[$COURSE[$j]] 1
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
						if (((SECTOR.EXPLORED[$Target_Ptr] = "NO") OR (SECTOR.EXPLORED[$Target_Ptr] = "CALC")) AND ($FIGS[$Target_Ptr] = 0))
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
		if ($Figs[$Gas_adjSector] = 0)
			send ("M"&$Gas_adjSector&"*  *  Z  A "&$maxFigAttack&"*  *  F  Z  1 *  Z  C  D  *  *  P  T  *  *   ")
			setVar $Figs[$Gas_adjSector] 1
		else
			send ("M"&$Gas_adjSector&"*  *  Z  A "&$maxFigAttack&"* *  P  T *  *  ")
		end
	else
		gosub :Find_Closest_Sxx
		if ($Sxx_Focus <> 0)
			echo ("*"&ANSI_8&"<"&ANSI_15&"Found Gas Station At: "&ANSI_14&$Sxx_Focus&ANSI_8&">*")
		    setTextTrigger		Sector_Gas_Good	:Sector_Gas_Good	"All Systems Ready, shall we engage"
			setTextTrigger		Sector_Gas_Here	:Sector_Gas_Good	"NavPoint Settings (?=Help)"
			setTextTrigger		Sector_Gas_Bad	:Sector_Gas_Bad		"Do you want to make this jump blind"
			setTextTrigger		Sector_Gas_Far	:Sector_Gas_Far		"You do not have enough Fuel Ore to make the jump."
			send " M" & $Sxx_Focus & "*  Y"
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
							if ($FIGS[$COURSE[$j]] = 0)
								setVar $result ($result&" F  Z  1 *  Z  C  D  * ")
								setVar $FIGS[$COURSE[$j]] 1
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
					if ($FIGS[$Sxx_Focus] = 0)
						send ("  Y  *  Z  A "&$maxFigAttack&"* F  Z  1 *  Z  C  D  *  P  T  *  *  ** ")
						setVar $FIGS[$Sxx_Focus] 1
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
		if ($FIGS[$FIG_Focus] <> 0)
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
			if (((SECTOR.EXPLORED[$UNX_focus] = "NO") OR (SECTOR.EXPLORED[$UNX_focus] = "CALC")) AND ($FIGS[$UNX_focus] = 0))
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
			if (((SECTOR.EXPLORED[$Examine_Warp_Path] = "NO") OR (SECTOR.EXPLORED[$Examine_Warp_Path] = "CALC")) AND ($FIGS[$Examine_Warp_Path] = 0))
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
