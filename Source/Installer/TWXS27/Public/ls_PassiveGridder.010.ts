    #=--------                                                                       -------=#
     #=---------------------      LoneStar's Passive Gridder      -------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	Circa August 2007
	#		Author		:	LoneStar
	#		TWX			:	For TWX 2.04 Final
	#
	#		Credits		:	Mind Daggers QUIKSTATS, and GETCOURSE routines
	#
	#		To Run		:	You will Need the following addressed
	#                                   - Command Prompt
	#                                   - Density Scanner (at least)
	#									- More Than 10 Fighters
	#									- More than 10,000 creds (for buying fuel)
	#                                   - have _ck_callsaveme.cts in scripts
	#									- ZTM not required, but CIM will need to be updated
	#								      periodically.
	#
	#		Fixes       :	Initial Release (work in progress)
	#
	#		Description	:   Passive Gridder that doesnt' holo-scan, and uses twarp when boxed in.
	#                       Will update fig/limps lists if desired to SectorParam's, but also updates
	#                       the FIGSEC as it moves
	#						It's a good idea to update your deployed limp data, as the the Gridder will report
	#						if, for example, an adjacent possibly has someone cloaked.
	#
	#		Notes:          Modified quikstats to change $TURNS to 68536, if $UNLIM ='s TRUE
	#                       Had to use two Arrays: $DENS and $ANOM for: Adj Warp Count, and
	#                       Anomoly readings in adj sectors as TWX is more than a little retarded
	#                       (SECTOR.ANOMOLY[idx] doesn't work, and SECTOR.WARPCOUNT isn't accurate)

	reqRecording
	clearAllAvoids
	setVar $TAGLINE     "LoneStar's Passive Gridder"
	setVar $TAGLINEb	"LSPG"
	setVar $TAGLINEc	(ANSI_8 & "[" & ANSI_7 & "LSPG" & ANSI_8 & "]" & ANSI_15)
	setVar $Version		"2.0"
	setVar $LOG_FName	("PGrid_" & GAMENAME & ".log")
	setVar $Turn_Limit 20
	setArray $CHKD	SECTORS
	setArray $ANOM	10
	setArray $DENS	10
	setArray $Limps	SECTORS
	setVar $Update_Limps		FALSE
	setVar $Update_Figs		FALSE
	setVar $Update_Port		FALSE

	setVar $DROPING_MINES	0

	LoadVar $LSGRIDDER_LIMP
	if ($LSGRIDDER_LIMP = 0)
		SetVar $DROP_LIMP 1
	else
		SetVar $DROP_LIMP $LSGRIDDER_LIMP
	end

	LoadVar $LSGRIDDER_ARMID
	if ($LSGRIDDER_ARMID = 0)
		SetVar $DROP_ARMID 1
	else
		SetVar $DROP_ARMID $LSGRIDDER_ARMID
	end

	setArray $LOG_ENTRIES 5
	setVar $LOG_ENTRIES[1] ""
	setVar $LOG_ENTRIES[2] ""
	setVar $LOG_ENTRIES[3] ""
	setVar $LOG_ENTRIES[4] ""
	setVar $LOG_ENTRIES[5] ""

	setVar $DEP_FIGS	0
	setVar $DEP_LIMP	0
	setVar $DEP_NEW	0
	setVar $LOG_EVENT	0
	setVar $HOLO		FALSE
	setVar $TRACKER	FALSE
	setVar $FILENAME	"_ck_equip_haggle_tracker"
	setVar $EQU_MIN 50

	if (RYLOS < 1)
		setVar $Report_RYLOS 	TRUE
	end
	if (ALPHACENTAURI < 1)
		setVar $Report_ALPHA	TRUE
	end

	gosub :quikstats

	if ($CURRENT_PROMPT <> "Command")
		Echo "**" & $TAGLINEc & " Wrong Prompt**"
		halt
	end

	if ($SCAN_TYPE = "None")
		Echo "**" & $TAGLINEc & " Must At Least Have a Density Scanner**"
		halt
	end
	if ($FIGHTERS < 10)
		Echo "**" & $TAGLINEc & " Must At More than 10 Fighters**"
		halt
	end
	if ($CREDITS < 10000)
		Echo "**" & $TAGLINEc & " Must At Least Have 10,000 creds**"
		halt
	end

	send "I"
	waitfor "Turns left     :"
	getWord CURRENTLINE $UNLIM 4
	isNumber $tst $UNLIM
	if ($tst = 0)
		setVar $UNLIM TRUE
		setVar $TURNS 65000
	else
		setVar $UNLIM FALSE
	end

	:Menu_Top
	Echo "***"
	Echo $TAGLINEc & ANSI_6 & "   LoneStar's Passive Gridder*"
	Echo $TAGLINEc & ANSI_4 & "  ============================*"
	Echo $TAGLINEc & ANSI_15 & "  1  Update Figter List  "
	if ($Update_Figs)
		Echo ANSI_14 & "Yes*"
	else
		Echo ANSI_14 & "No*"
	end
	Echo $TAGLINEc & ANSI_15 & "  2  Update Limp List    "
	if ($Update_Limps)
		Echo ANSI_14 & "Yes*"
	else
		Echo ANSI_14 & "No*"
	end
	if ($UNLIM = 0)
		Echo $TAGLINEc & ANSI_15 & "  3  Turn Limit          " & ANSI_14 &$Turn_Limit & "*"
	end
	Echo $TAGLINEc & ANSI_15 & "  4  Get Port Reports    "
	if ($Update_Port)
		Echo ANSI_14 & "Yes*"
	else
		Echo ANSI_14 & "No*"
	end
	if ($SCAN_TYPE = "Holo")
		Echo $TAGLINEc & ANSI_15 & "  5  Holo Scan           "
		if ($HOLO)
			Echo ANSI_14 & "Yes*"
		else
			Echo ANSI_14 & "No*"
		end
	end
	Echo $TAGLINEc & ANSI_15 & "  6  CKs Haggel Tracker  "
	if ($TRACKER)
		Echo ANSI_14 & "Yes*"
	else
		Echo ANSI_14 & "No*"
	end
	Echo $TAGLINEc & ANSI_15 & "  7  Dropping Mines      "
	if ($DROPING_MINES = 0)
		Echo ANSI_14 & "No*"
	else
		if ($DROPING_MINES = 1)
			Echo ANSI_14 & "Limps Only"
			Echo "*" & $TAGLINEc &"     " & ANSI_8 & "L" & ANSI_15 & "impets        " & ANSI_14 & ": " & ANSI_7 & $DROP_LIMP & "*"
		elseif ($DROPING_MINES = 2)
			Echo ANSI_14 & "Armids Only"
			Echo "*" & $TAGLINEc &"     " & ANSI_8 & "A" & ANSI_15 & "rmids         " & ANSI_14 & ": " & ANSI_7 & $DROP_ARMID & "*"
		else
			setVar $DROPING_MINES 3
			Echo ANSI_14 & "Armids & Limps"
			Echo "*" & $TAGLINEc &"     " & ANSI_8 & "L" & ANSI_15 & "impets        " & ANSI_14 & ": " & ANSI_7 & $DROP_LIMP
			Echo "*" & $TAGLINEc &"     " & ANSI_8 & "A" & ANSI_15 & "rmids         " & ANSI_14 & ": " & ANSI_7 & $DROP_ARMID & "*"
		end
	end

	Echo $TAGLINEc & "*"
	Echo $TAGLINEc & ANSI_15 & "  S  Start*"
	Echo $TAGLINEc & ANSI_15 & "  Q  Quit*"
	Echo "*"
	:Sphincter_says_what
	getConsoleInput $s SINGLEKEY
	uppercase $s
	if ($s = "Q")
		Echo "*" & $TAGLINEc
		Echo "*" & $TAGLINEc & ANSI_4 & " Script Halted"
		Echo "*" & $TAGLINEc
		Echo "*"
		halt
	elseif ($s = "S")
		goto :Lets_Get_It_On
	elseif ($s = "1")
		if ($Update_Figs)
			setVar $Update_Figs FALSE
		else
			setVar $Update_Figs TRUE
		end
	elseif ($s = "2")
		if ($Update_Limps)
			setVar $Update_Limps FALSE
		else
			setVar $Update_Limps TRUE
		end
	elseif (($s = "3") AND ($UNLIM = 0))
		:TRY_ANOTHER_AMOUNT
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Stop Turns Fall Below (" & ANSI_6 & "You Have " & $TURNS & " Turns" & ANSI_14 & ")?"
		isNumber $tst $selection
		if ($tst = 0)
			goto :TRY_ANOTHER_AMOUNT
		end
		if ($selection < 1)
			setVar $selection 1
		end
		setVar $Turn_Limit $selection
	elseif ($s = "4")
		if ($Update_Port)
			setVar $Update_Port FALSE
		else
			setVar $Update_Port TRUE
		end
	elseif ($s = "5") AND ($SCAN_TYPE = "Holo")
		if ($HOLO)
			setVar $HOLO FALSE
		else
			setVar $HOLO TRUE
		end
	elseif ($s = "6")
		if ($TRACKER)
			setVar $TRACKER FALSE
		else
			setVar $TRACKER TRUE
		end
	elseif ($s = "7")
		if ($DROPING_MINES = 0)
			setVar $DROPING_MINES 1
		elseif ($DROPING_MINES = 1)
			setVar $DROPING_MINES 2
		elseif ($DROPING_MINES = 2)
			setVar $DROPING_MINES 3
		elseif ($DROPING_MINES = 3)
			setVar $DROPING_MINES 0
		else
			setVar $DROPING_MINES 0
		end
	elseif ($S = "A") AND (($DROPING_MINES = 2) OR ($DROPING_MINES = 3))
		echo "**"&#27&"[K"& $TAGLINEc & ANSI_8 & " Armid Mines Per Sector "&ANSI_14&"("&ANSI_7&"You have "&$ARMIDS&" Armids On Board"&ANSI_14&")" & ANSI_14
		getconsoleinput $s
		isnumber $tst $s
		if ($tst = 0)
			setVar $s 1
		end
		if ($s < 1)
			setVar $s 1
		end
		setVar $DROP_ARMID $S
		setVar $LSGRIDDER_ARMID $S
		saveVar $LSGRIDDER_ARMID
	elseif ($S = "L") AND (($DROPING_MINES = 1) OR ($DROPING_MINES = 3))
		echo "**"&#27&"[K"& $TAGLINEc & ANSI_8 & " Limpet Mines Per Sector "&ANSI_14&"("&ANSI_7&"You have "&$LIMPETS&" Limpets On Board"&ANSI_14&")" & ANSI_14
		getconsoleinput $s
		isnumber $tst $s
		if ($tst = 0)
			setVar $s 1
		end
		if ($s < 1)
			setVar $s 1
		end
		setVar $DROP_LIMP $S
		setVar $LSGRIDDER_LIMP $S
		saveVar $LSGRIDDER_LIMP
	else
		goto :Sphincter_says_what
	end
	goto :Menu_Top


:Lets_Get_It_On
    getTime $Stamp "t d/m/yy"

	stop $FILENAME
	stop $FILENAME

	if ($TRACKER)
		setVar $MCICd	0
		setVar $Track_File "_ck_" & GAMENAME & ".ports"
		setArray $MCIC	SECTORS
		fileExists $tst $Track_File
		if ($tst)
			Echo "***" & $TAGLINEc & " Reading Ports File"
			setVar $i 1
			read $Track_File $tst $i
			while ($tst <> EOF)
				#SECTOR 2928 (BSB) - Ship Haggle - MCIC approx -41
				getWord $tst $tmp 2
				isNumber $tst $tmp
				if ($tst)
					setVar $MCIC[$tst] TRUE
					add $Results 1
					add $MCICd 1
				end
            	add $i 1
            	read $Track_File $tst $i
			end
			echo "; " & $Results & " Ports allready Processed!**"
		end
		Echo "**" & $TAGLINEc & " Loading ck's EQUIP Haggle Tracker**"
		load $FILENAME
		setDelayTrigger		LOAD_DELAY	:LOAD_DELAY		3000
		setTextLineTrigger	LOADED		:LOADED			"Credits        :"
		pause
		:LOAD_DELAY
		killAllTriggers
		Echo "**" & $TAGLINEc & " EQUIP HAGGLE Tracker Not Loaded.**"
		halt
		:LOADED
		killAllTriggers
		Echo "**" & $TAGLINEc & " EQUIP Haggle Tracker LOADED!!**"
	else
	    send "   j   y   "
	end

	write $LOG_FName "-------------------------{ " & $Stamp & " }-------------------------"
	echo "***"
	if ($Update_Figs)
		echo ($TAGLINEc & " " & ANSI_8&"<"&ANSI_15&"ReFreshing Deployed Fighter Data"&ANSI_8&">*")
		gosub :Build_FIG_LIST
	end

	echo ($TAGLINEc & " " & ANSI_8&"<"&ANSI_15&"Reading Figs"&ANSI_8&">*")
	setVar $idx 1
	while ($idx <= SECTORS)
		getSectorParameter $idx "FIGSEC" $flag
		isNumber $tst $flag
		if ($tst <> 0)
			if ($flag <> 0)
				Add $DEP_FIGS 1
			end
		else
			setSectorParameter $idx "FIGSEC" FALSE
		end
		add $idx 1
	end

	if ($DEP_FIGS = 0)
		echo ($TAGLINEc & " " & ANSI_8&"<"&ANSI_15&"No Deployed Fighter Data Found"&ANSI_8&">*")
		halt
	else
		echo ($TAGLINEc & " " & ANSI_8&"<"&ANSI_15&"Deployed Fighters "&ANSI_14&" : "&ANSI_15&$DEP_FIGS&ANSI_8&">*")
	end

	if ($Update_Limps)
		echo ($TAGLINEc & " " & ANSI_8&"<"&ANSI_15&"ReFreshing Limpet Data"&ANSI_8&">*")
		gosub :Build_LIMP_LIST
	else
		echo ($TAGLINEc & " " & ANSI_8&"<"&ANSI_15&"Reading Limps"&ANSI_8&">*")
		setVar $idx 1
		while ($idx <= SECTORS)
			getSectorParameter $idx "LIMPSEC" $flag
			isNumber $tst $Flag
			if ($tst <> 0)
				if ($flag > 0)
					setVar $Limps[$idx] 1
					add $DEP_LIMP 1
				end
			end
			add $idx 1
		end
	end

   	window status 500 245 (" " & $TAGLINE & " v" & $Version)
   	echo "**"
	echo ($TAGLINEc & " " & ANSI_8&"<"&ANSI_15&"Gridded Sectors: "&ANSI_14&$DEP_FIGS&ANSI_8&">*")
	echo ($TAGLINEc & " " & ANSI_8&"<"&ANSI_15&"Limp'd Sector  : "&ANSI_14&$DEP_LIMP&ANSI_8&">**")

    send " C ;UYQ "
	waitfor "Max Figs Per Attack:"
	getWord CurrentLine $maxFigAttack 5
	stripText $maxFigAttack ","
	isNumber $tst $maxFigAttack
	if ($tst = 0)
		setVar $maxFigAttack 9999
	end

	while ($TURNS > $Turn_Limit)
		:To_The_Top
		gosub :quikstats
		setVar $anon_ptr 1
		setTextLineTrigger	TurnsGone	:TurnsGone	"Do you want instructions (Y/N) [N]?"

		send "SZND*"
		waiton "Relative Density Scan"
		killAllTriggers
	  	setTextLineTrigger	1	:getWarp "Sector "
	  	setTextTrigger		2	:gotWarpInfo "Command [TL="
		pause
		:getWarp
		  	getWord CURRENTLINE $anm 13
		  	getText CURRENTLINE $temp "Warps :" "NavHaz :"
			stripText $temp " "
			stripText $temp ","

			setVar $DENS[$anon_ptr] $temp
			setVar $ANOM[$anon_ptr] $anm
			add $anon_ptr 1
			setTextLineTrigger	1	:getWarp "Sector "
			pause
		:gotWarpInfo
			killAllTriggers
			if ($TRACKER)
				gosub :Haggel_Checker
			elseif (($ORE_HOLDS < ($TOTAL_HOLDS - $EQU_MIN)) AND ($TWARP_TYPE <> "No"))
				if ((PORT.CLASS[$CURRENT_SECTOR] = 3) OR (PORT.CLASS[$CURRENT_SECTOR] = 4) OR (PORT.CLASS[$CURRENT_SECTOR] = 5) OR (PORT.CLASS[$CURRENT_SECTOR] = 7))
					Echo "***Stupid Attmpt**"
					send "PT** 0* 0*  "
				end
			end

		setVar $i 1
		setArray $Adj_Targets SECTOR.WARPCOUNT[$CURRENT_SECTOR]

		while ($i <= SECTOR.WARPCOUNT[$CURRENT_SECTOR])
        	setVar $adj SECTOR.WARPS[$CURRENT_SECTOR][$i]
			setVar $Adj_Targets[$i] 10

			if (SECTOR.NAVHAZ[$adj] <> 0)
				setVar $filter 0
				setVar $Filter (SECTOR.NAVHAZ[$adj] * 21)
				setVar $Filter (SECTOR.DENSITY[$adj] - $Filter)
			else
				setVar $filter SECTOR.DENSITY[$adj]
			end

			if ($adj < 10)
				setVar $buff "    "
			elseif ($adj < 100)
				setVar $buff "   "
			elseif ($adj < 1000)
				setVar $buff "  "
			elseif ($adj < 10000)
				setVar $buff " "
			else
				setVar $buff ""
			end

			getSectorParameter $adj "FIGSEC" $Flag
			isNumber $tst $Flag
			if ($tst = 0)
				setVar $Flag 0
				setSectorParameter $adj "FIGSEC" FALSE
			end
			if ((SECTOR.DENSITY[$adj] > 200) AND ($Flag = 0))
				setVar $StrMsg ("Sect: " & $buff & $adj & " Den: " & SECTOR.DENSITY[$adj] & " Haz: " & SECTOR.NAVHAZ[$adj] & "% Filtered: " & $Filter)
				write $LOG_FName $StrMsg
				add $LOG_EVENT 1
				setVar $LOG_TEXT $StrMsg
				gosub :Move_Down
				send ("'["&$TagLineB&"] " & $StrMsg & "*")
				waitfor "Message sent on sub-space channel"
			elseif (SECTOR.NAVHAZ[$adj] <> 0)
				setVar $StrMsg ("NavHaz in Sect: " & $buff & $adj & " Den: " & SECTOR.DENSITY[$adj] & " Haz: " & SECTOR.NAVHAZ[$adj] & "% Filtered: " & $Filter)
				write $LOG_FName $StrMsg
				add $LOG_EVENT 1
				setVar $LOG_TEXT $StrMsg
				gosub :Move_Down
				send ("'["&$TagLineB&"] " & $StrMsg & "*")
				waitfor "Message sent on sub-space channel"
			end
			if (((SECTOR.DENSITY[$adj] = 0) OR (SECTOR.DENSITY[$adj] = 5)) AND ($ANOM[$i] = "Yes"))
				setVar $StrMsg ("Cloaked Ship, Sect: " & $buff & $adj & " Den: " & SECTOR.DENSITY[$adj] & " Haz: " & SECTOR.NAVHAZ[$adj] & "% Filtered: " & $Filter)
				write $LOG_FName $StrMsg
				add $LOG_EVENT 1
				setVar $LOG_TEXT $StrMsg
				gosub :Move_Down
				send ("'["&$TagLineB&"] " & $StrMsg & "*")
				waitfor "Message sent on sub-space channel"
			end

			if ((SECTOR.DENSITY[$adj] = 40) OR (SECTOR.DENSITY[$adj] = 45) OR (SECTOR.DENSITY[$adj] = 140) OR (SECTOR.DENSITY[$adj] = 145))
				setVar $StrMsg ("Possible Trader, Sect: " & $buff & $adj & " Den: " & SECTOR.DENSITY[$adj] & " Haz: " & SECTOR.NAVHAZ[$adj] & "% Filtered: " & $Filter)
				write $LOG_FName $StrMsg
				add $LOG_EVENT 1
				setVar $LOG_TEXT $StrMsg
				gosub :Move_Down
				send ("'["&$TagLineB&"] " & $StrMsg & "*")
				waitfor "Message sent on sub-space channel"
			end

			if (($ANOM[$i] = "Yes") AND ($Limps[$adj] = 0))
            	goto :Next_ADJ_Please
			end

            if ((SECTOR.DENSITY[$adj] = 0) OR (SECTOR.DENSITY[$adj] = 100))
            	if (SECTOR.NAVHAZ[$adj] = 0)
					if (SECTOR.EXPLORED[$adj] <> "YES")
						if ($DENS[$i] > 1)
							setVar $Adj_Targets[$i] 1
							goto :Next_ADJ_Please
						end
	                end
	            end
			end

            if ((SECTOR.DENSITY[$adj] = 0) OR (SECTOR.DENSITY[$adj] = 100))
            	if (SECTOR.NAVHAZ[$adj] = 0)
					if (SECTOR.EXPLORED[$adj] = "YES")
						if ($DENS[$i] > 1)
							setVar $Adj_Targets[$i] 2
							goto :Next_ADJ_Please
						end
	                end
	            end
			end
            if ((SECTOR.DENSITY[$adj] = 0) OR (SECTOR.DENSITY[$adj] = 100))
            	if (SECTOR.NAVHAZ[$adj] = 0)
					if (SECTOR.EXPLORED[$adj] <> "YES")
						if ($DENS[$i] >= 1)
							setVar $Adj_Targets[$i] 3
							goto :Next_ADJ_Please
						end
	                end
	            end
			end
            if ((SECTOR.DENSITY[$adj] = 0) OR (SECTOR.DENSITY[$adj] = 100))
            	if (SECTOR.NAVHAZ[$adj] = 0)
					if (SECTOR.EXPLORED[$adj] = "YES")
						if ($DENS[$i] >= 1)
							setVar $Adj_Targets[$i] 4
							goto :Next_ADJ_Please
						end
	                end
	            end
			end
            if ((SECTOR.DENSITY[$adj] = 105) OR (SECTOR.DENSITY[$adj] = 5))
            	if (SECTOR.NAVHAZ[$adj] = 0)
					if (SECTOR.EXPLORED[$adj] <> "YES")
						if ($Flag <> 0)
							if ($DENS[$i] > 1)
								setVar $Adj_Targets[$i] 5
								goto :Next_ADJ_Please
							end
		                end
	                end
	            end
			end

            if ((SECTOR.DENSITY[$adj] = 105) OR (SECTOR.DENSITY[$adj] = 5))
				#if (SECTOR.EXPLORED[$adj] <> "YES")
				if (SECTOR.WARPCOUNT[$adj] >= 5)
					if (SECTOR.NAVHAZ[$adj] = 0)
						if ($Flag = 1)
							if ($DENS[$i] >= 1)
								if ($CHKD[$ADJ] = 0)
									setVar $Adj_Targets[$i] 6
									goto :Next_ADJ_Please
								end
							end
		                end
		            end
                end
			end
            if ((SECTOR.DENSITY[$adj] = 105) OR (SECTOR.DENSITY[$adj] = 5))
				#if (SECTOR.EXPLORED[$adj] <> "YES")
				if (SECTOR.WARPCOUNT[$adj] > 1)
					if (SECTOR.NAVHAZ[$adj] = 0)
						if ($Flag = 1)
							if ($DENS[$i] >= 1)
								if ($CHKD[$ADJ] = 0)
									setVar $Adj_Targets[$i] 6
									goto :Next_ADJ_Please
								end
							end
		                end
		            end
                end
			end
			:Next_ADJ_Please
        	add $i 1
		end

		setVar $idx 1
		setVar $Target 10
		setVar $Target_IDX 0

		while ($idx <= SECTOR.WARPCOUNT[$CURRENT_SECTOR])
			if (($Adj_Targets[$idx] < $Target) AND ($Target <> 0))
				setVar $Target $Adj_Targets[$idx]
				setVar $Target_IDX $idx
			end
			add $idx 1
		end

		if ($Target_IDX <> 0)
			setVar $Target SECTOR.WARPS[$CURRENT_SECTOR][$Target_IDX]
			if (SECTOR.DENSITY[$Target] >= 100)
				send " c r"&$Target&"*q"
				setTextLineTrigger	NoData1	:NoData		"You have never visted sector"
				setTextLineTrigger	NoData2	:NoData		"I have no information about a port in that sector"
				setTextLineTrigger	YaData1	:YaData		"Items     Status  Trading % of max OnBoard"
				setTextLineTrigger	YaData2	:YaData		"A  Cargo holds     :"
				pause
				:NoData
				killAllTriggers
				if ($HOLO)
					gosub :Do_Holo
					gosub :Display_Holo
					waiton	"Command [TL="
					if (SECTOR.FIGS.QUANTITY[$Target] <> 0)
						if ((SECTOR.FIGS.OWNER[$Target] <> "belong to your Corp") AND (SECTOR.FIGS.OWNER[$Target] <> "yours"))
							#Trying Again, but this time ignoring $Target
							setVar $Ignore $Target
							setVar $idx 1
							setVar $Target 10
							setVar $Target_IDX 0
							while ($idx <= SECTOR.WARPCOUNT[$CURRENT_SECTOR])
								if ($Adj_Targets[$idx] < $Target) AND ($Target <> 0) AND (SECTOR.WARPS[$CURRENT_SECTOR][$idx] <> $Ignore)
									setVar $Target $Adj_Targets[$idx]
									setVar $Target_IDX $idx
								end
								add $idx 1
							end
							if ($Target_IDX <> 0)
								setVar $Target SECTOR.WARPS[$CURRENT_SECTOR][$Target_IDX]
							else
								goto :No_Target
							end
						end
					end
				end
				:YaData
				killAllTriggers
			end
        	goto :Next_Target
        end

        :No_Target
		if ($TWARP_TYPE <> "No")
			#Find A Place To Twarp To
			getNearestWarps $WarpArray $CURRENT_SECTOR
			getRnd $w 5 10
			while ($w <= $WarpArray)
				setVar $focus $WarpArray[$w]
				if ($Focus <> $CURRENT_SECTOR)
					getSectorParameter $Focus "FIGSEC" $Flag
					isNumber $tst $Flag
					if ($tst = 0)
						setVar $Flag 0
						setSectorParameter $Focus "FIGSEC" FALSE
					end
					if ($Flag <> 0)
						if (SECTOR.WARPCOUNT[$Focus] > 1)
							setVar $w_i 1
							while ($w_i <= SECTOR.WARPCOUNT[$Focus])
								setVar $w_adj SECTOR.WARPS[$Focus][$W_i]
								getSectorParameter $w_adj "FIGSEC" $Flag
								isNumber $tst $Flag
								if ($tst = 0)
									setVar $Flag 0
									setSectorParameter $w_adj "FIGSEC" FALSE
								end
								if (($Flag = 0) AND ($CHKD[$w_adj] <> 1))
									setVar $CHKD[$w_adj] 1
									goto :We_Got_Game
								end
		                    	add $w_i 1
							end
						end
					end
				end
	        	add $w 1
			end

			:We_Done
			#get here, there's no hope
			Echo "**" & $TAGLINEc & " " & " No Target To Find. Try updating CIM***"
			halt

	        :We_Got_Game
	        Echo "***Focus " & $FOCUS & "**"
	        if ($HOLO)
				setVar $cx 1
				setVar $cn 0
				while (SECTOR.WARPS[$CURRENT_SECTOR][$cx] <> 0)
					setVar $adj SECTOR.WARPS[$CURRENT_SECTOR][$cx]
					if (SECTOR.EXPLORED[$adj] = "NO") OR (SECTOR.EXPLORED[$adj] = "CALC")
						add $cn 1
					end
					add $cx 1
				end
				if ($cn > 2)
					gosub :Do_Holo
					gosub :Display_Holo
				end
	        end

				send " M" & $Focus & "*Y"
				setTextLineTrigger		Sector__Good	:Sector__Good	"Locating beam pinpointed, TransWarp"
				setTextLineTrigger		Sector__Here	:Sector__Good	"NavPoint Settings (?=Help)"
				setTextLineTrigger		Sector__Bad		:Sector__Bad	"No locating beam found"
				setTextTrigger				Sector__Far		:Sector__Far	"You do not have enough Fuel Ore to make the jump."
				pause
				:Sector__Bad
					killAllTriggers
					goto :We_Done
				:Sector__Far
					killAllTriggers
					getNearestWarps $WarpArray $CURRENT_SECTOR
					setVar $c 1
					while ($c <= $WarpArray)
						setVar $focus $WarpArray[$c]
						if ((PORT.CLASS[$focus] = 3) OR (PORT.CLASS[$focus] = 4) OR (PORT.CLASS[$focus] = 5) OR (PORT.CLASS[$focus] = 7))
							getSectorParameter $focus "FIGSEC" $Flag
							isNumber $tst $flag
							if ($tst = 0)
								setVar $flag 0
								setSectorParameter $focus "FIGSEC" FALSE
							end
                        	if ($flag = 1)
								setVar $destination $focus
								gosub :getCourse
								if ($courseLength <> 0)
									setVar $j 2
									setVar $result ""

									while ($j <= $courseLength)
										getSectorParameter $COURSE[$j] "FIGSEC" $Flag
										isNumber $tst $Flag
										if ($tst = 0)
											setVar $Flag 0
											setSectorParameter $COURSE[$j] "FIGSEC" FALSE
										end
										if (($Flag = 0) AND ($COURSE[$j] <> $CURRENT_SECTOR))
											goto :Next_SXX_Port
										end
										setVar $result $result&"m"&$COURSE[$j]&"* "
										if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK))
											setVar $result ($result&" Z  A  "&$maxFigAttack&"*  *  ")
										end
										# If Not FED Space, Drop A Fig, if we haven't already
										if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK) AND ($j > 2))
											getSectorParameter $COURSE[$j] "FIGSEC" $Flag
											isNumber $tst $Flag
											if ($tst = 0)
												setVar $Flag 0
												setSectorParameter $COURSE[$j] "FIGSEC" FALSE
											end
											if ($Flag = 0)
												setVar $result ($result&" F  Z  1 * Z  C  D  *  ")
												setSectorParameter $COURSE[$j] "FIGSEC" TRUE
											end
										end
										add $j 1
									end
									waitfor "Command ["

									if ($TRACKER)
										send ($result&"  **  ")
										gosub :quikstats
										gosub :Haggel_Checker
									else
										send ($result&"  **    P   T   *   *   *   *   ")
									end

									gosub :quikstats
									if ($TOTAL_HOLDS <> $ORE_HOLDS) AND ($TRACKER = 0)
										if ($CREDITS < 10000)
											Echo "**" & $TAGLINEc & " " & " Appear To Be Out of Funds for ORE purchase.**"
										elseif (($UNLIM = FALSE) AND ($TURNS < 1))
											Echo "**" & $TAGLINEc & " " & " Appear To Be Out Turns. Photon'd Maybe??**"
										else
											Echo "**" & $TAGLINEc & " " & " Not Enough ORE to continue.**"
										end
										halt
									elseif ($TRACKER) AND ($ORE_HOLDS < ($TOTAL_HOLDS - $EQU_MIN))
										if ($CREDITS < 10000)
											Echo "**" & $TAGLINEc & " " & " Appear To Be Out of Funds for ORE purchase.**"
										elseif (($UNLIM = FALSE) AND ($TURNS < 1))
											Echo "**" & $TAGLINEc & " " & " Appear To Be Out Turns. Photon'd Maybe??**"
										else
											Echo "**" & $TAGLINEc & " " & " Not Enough ORE to continue.**"
										end
										halt
									elseif ($CREDITS < 10000)
										Echo "**" & $TAGLINEc & " " & " Too Few Credits to continue.**"
										halt
									end
									goto :To_The_Top
								end
							end
						end
						:Next_SXX_Port
                    	add $c 1
					end
					goto :We_Done
				:Sector__Good
					killAllTriggers
					echo ("**" & $TAGLINEc & " " & ANSI_8&"<"&ANSI_15&"Twarping To Jump Point: "&ANSI_14&$Focus&ANSI_8&">*")

					setVar $DROP_STR ""
					if ($DROPING_MINES <> 0)
						if (SECTOR.WARPINCOUNT[$focus] >= 3)
							if (($DROPING_MINES = 1) OR ($DROPING_MINES = 3))
								if ($LIMPETS > $DROP_LIMP)
									setVar $DROP_STR ($DROP_STR & "H 2 Z "&$DROP_LIMP&"* C * ")
								else
								   if ($DROPING_MINES = 1)
								   	setVar $DROPING_MINES 0
								   else
								   	setVar $DROPING_MINES 2
								   end
								end
							end

							if (($DROPING_MINES = 2) OR ($DROPING_MINES = 3))
								if ($ARMIDS > $DROP_ARMID)
									setVar $DROP_STR ($DROP_STR & "H 1 Z "&$DROP_ARMID&"* C * ")
								else
									if ($DROPING_MINES = 2)
										setVar $DROPING_MINES 0
									else
										setVar $DROPING_MINES 1
									end
								end
							end
						end
					end
					send "Y  *  A Z " & $maxFigAttack & "998877665544332211 n  *  **   " & $DROP_STR
					gosub :quikstats
			goto :To_The_Top
		else
			Echo "**" & $TAGLINEc & " " & " Walled In (No Twarp Available)***"
			halt
		end

		:Next_Target
		Echo "**Target " & $TARGET & "**"

		send "  m " & $Target & " *  z  a  " & $maxFigAttack & "99887766554433221100  n  *  dz  n  f  z  1*  z  c  d  *  "
		setTextLineTrigger u_torped :help_me "Your ship was hit by a Photon and has been disabled."
		setTextLineTrigger no_turns :help_me "You don't have enough turns left."
		setTextLineTrigger ig_hold1 :help_me "You attempt to retreat but are held fast by an Interdictor Generator."
		setTextLineTrigger ig_hold2 :help_me "An Interdictor Generator in this sector holds you fast!"
		setTextLineTrigger quasar_b :help_me "Quasar Blast!"
		waiton ":[" & $Target & "] (?=Help)"
		goto :help_me_jmp
		:help_me
			killAllTriggers
			getWord CURRENTLINE $spoofy 1
			if ($spoofy <> "Your") AND ($spoofy <> "You") AND ($spoofy <> "An") AND ($spoofy <> "Quasar")
				goto :help_me_jmp
			end
			stop _ck_callsaveme
			stop _ck_callsaveme
			send "   N   Y  *  N   *   R   *   Q   Q   Q   Z   N   *   R   *   "
			waitFor "Command [TL="
			load _ck_callsaveme
			waitFor "Message sent on sub-space channel"
			halt
		:help_me_jmp
		add $DEP_FIGS 1
		add $DEP_NEW 1
		setSectorParameter $Target "FIGSEC" TRUE
		setVar $CHKD[$Target] 1

		setVar $DROP_STR ""

		if ($DROPING_MINES <> 0)
			if (SECTOR.WARPINCOUNT[$Target] >= 3)
				if (($DROPING_MINES = 1) OR ($DROPING_MINES = 3))
					if ($LIMPETS > $DROP_LIMP)
						setVar $DROP_STR ($DROP_STR & "H 2 Z "&$DROP_LIMP&"* C * ")
					else
					   if ($DROPING_MINES = 1)
					   	setVar $DROPING_MINES 0
					   else
					   	setVar $DROPING_MINES 2
					   end
					end
				end

				if (($DROPING_MINES = 2) OR ($DROPING_MINES = 3))
					if ($ARMIDS > $DROP_ARMID)
						setVar $DROP_STR ($DROP_STR & "H 1 Z "&$DROP_ARMID&"* C * ")
					else
						if ($DROPING_MINES = 2)
							setVar $DROPING_MINES 0
						else
							setVar $DROPING_MINES 1
						end
					end
				end
			end
		end

		if  ($DROP_STR <> "")
			send $DROP_STR & "  j  *"
			waiton "Are you sure you want to jettison all cargo?"
		end
		gosub :quikstats

		if ($CURRENT_PROMPT <> "Command")
			Echo "**" & $TAGLINEc & " " & "Wrong Prompt After Sector Hit.***"
			halt
		end

		if ($TRACKER)
			gosub :Haggel_Checker
		end

		if ($CURRENT_PROMPT <> "Command")
	        send " r *  *  p d 0* 0* 0* * *** * c q q q q q z 2 2 c q * z * *** * * "
			gosub :quikstats
			if ($CURRENT_PROMPT = "Command")
				load "_ck_callsaveme.cts"
				halt
			else
				Echo "**" & $TAGLINEc & " " & "Hmmm..  I seem to be stuck.***"
				halt
			end
		end

		gosub :UpdateStatus_window

		if (($Report_RYLOS) AND (RYLOS > 1))
			send "'["&$TagLineB&"] Class 0 RYLOS Spotted In Sector: " & RYLOS &"*"
			waitfor "Message sent on sub-space channel"
			setVar $Report_RYLOS	FALSE
		end
		if (($Report_ALPHA) AND (ALPHACENTAURI > 1))
			send "'["&$TagLineB&"] Class 0 ALPHACENTAURI Spotted In Sector: " & ALPHACENTAURI &"*"
			waitfor "Message sent on sub-space channel"
            setVar $Report_ALPHA	FALSE
		end

		if (($Update_Port) AND (PORT.EXISTS[$Target]))
			send "CR*Q"
			waitfor "<Computer deactivated>"
		end
		if ($FIGHTERS <= 10)
			Echo "**" & $TAGLINEc & " " & "Fighter Level is Critically Low (Less Than 10)**"
			Halt
		end
	end

	if ($UNLIM = 0)
		if ($TURNS <= $Turn_Limit)
			send "'["&$TagLineB&"] Turn Limit Reached, Halting*"
		end
	else
		send "'["&$TagLineB&"] Nothing To Do*"
	end

	halt

:TurnsGone
	killAllTriggers
	send "   *   *    *   /"
	waiton #179 & "Turns"
	getText CURRENTLINE $LOCAL "Sect" (#179 & "Turns")
	stripText $LOCAL " "
	send "'"
	waitfor "Sub-space radio ("
	send $LOCAL & "=saveme*"
	waitfor "Message sent on sub-space channel"
	send "F  Z  1*  Z  C  D  *  "
	setDelayTrigger		NoHelpComming	:NoHelpComming	4000
	setTextLineTrigger	HelpCame		:HelpCame		"Saveme script activated - "
	pause
	:NoHelpComming
		killAllTriggers
		send "'["&$TAGLINEb&"] No Help Came.*"
		halt
	:HelpCame
		killAllTriggers
		getText CURRENTLINE $Planet "Planet" "to"
		stripText $Planet " "
		send "L Z" & #8 & $Planet & "*  J  C  *  "
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


:Build_FIG_LIST
	killAllTriggers
	send "'Scanning Deployed Fighters...*G"
	SetVar $idx 1
	while ($idx <= SECTORS)
		setSectorParameter $idx "FIGSEC"	FALSE
    	add $idx 1
	end
	killAllTriggers
	waitfor "==========================================================="
	setTextLineTrigger FigLine1		:AddInFigC	" Corp "
	setTextLineTrigger FigLine2		:AddInFigP	" Personal "
	setTextLineTrigger LstBottom	:LstBottom	" Total "
	setTextLineTrigger LstNone		:LstBottom	"No fighters deployed"
	pause
	:AddInFigP
		getWord CURRENTLINE $sector 1
		setSectorParameter $sector "FIGSEC" TRUE
		add $DEP_FIGS 1
		setTextLineTrigger FigLine2		:AddInFigP	" Personal "
		pause
	:AddInFigC
		getWord CURRENTLINE $sector 1
		setSectorParameter $sector "FIGSEC" TRUE
		add $DEP_FIGS 1
		setTextLineTrigger FigLine1		:AddInFigC	" Corp "
		pause
	:LstBottom
		killAllTriggers

	return

:Build_LIMP_LIST
	killAllTriggers
	setArray $Limps	SECTORS

	SetVar $idx		1
	while ($idx <= SECTORS)
		setSectorParameter $idx "LIMPSEC"	0
		add $idx 1
	end

	send "'Scanning Deployed Limpets...*k2"
	waitfor "===================================="
	setTextLineTrigger LimpLine1		:AddInLimpC	" Corporate"
	setTextLineTrigger LimpLine2		:AddInLimpP	" Personal "
	setTextLineTrigger LstBottom		:LimpLstBottom	"Activated  Limpet  Scan"
	setTextLineTrigger LstNone			:LimpLstBottom	"No Limpet mines deployed"
	pause
	:AddInLimpC
		getWord CURRENTLINE $sector 1
		setSectorParameter $sector "LIMPSEC" TRUE
		add $DEP_LIMP 1
		setVar $Limps[$sector] TRUE
		setTextLineTrigger LimpLine1		:AddInLimpC	" Corporate"
		pause
	:AddInLimpP
		getWord CURRENTLINE $sector 1
		setSectorParameter $sector "LIMPSEC" TRUE
		add $DEP_LIMP 1
		setVar $Limps[$sector] TRUE
		setTextLineTrigger LimpLine2		:AddInLimpP	" Personal "
		pause
	:LimpLstBottom
		killAllTriggers

	return

:UpdateStatus_window
	setVar $Window_TXT ""

	setVar $Window_TXT ($Window_TXT & " Sector    : " & $CURRENT_SECTOR & "*")
	if ($UNLIM)
		setVar $Window_TXT ($Window_TXT & " Turns     : Unlimited*")
	else
		setVar $CashAmount $TURNS
		gosub :CommaSize
		setVar $Window_TXT ($Window_TXT & " Turns     : " & $CashAmount)
		setVar $CashAmount $Turn_Limit
		gosub :CommaSize
		setVar $Window_TXT ($Window_TXT & " (Turn Limit " & $CashAmount & ")*")
	end

	setVar $CashAmount $CREDITS
	gosub :CommaSize
	setVar $Window_TXT ($Window_TXT & " Credits   : $" & $CashAmount & "*")

	setVar $CashAmount $FIGHTERS
	gosub :CommaSize
	setVar $Window_TXT ($Window_TXT & " Fighters  : " & $CashAmount & "*")

	setVar $CashAmount $DEP_FIGS
	gosub :CommaSize
	setVar $CashAmount1 $CashAmount
	setVar $CashAmount SECTORS
	gosub :CommaSize
	setVar $Window_TXT ($Window_TXT & " Grid      : " & $CashAmount1 & " of " & $CashAmount & "*")

	setVar $CashAmount $DEP_NEW
	gosub :CommaSize
	setVar $Window_TXT ($Window_TXT & " Gridded   : " & $CashAmount & "*")
	if ($TRACKER)
		setVar $CashAmount $MCICd
		gosub :CommaSize
		setVar $Window_TXT ($Window_TXT & " MCIC'd    : " & $CashAmount & " ("&$Track_File&")*")
	end

	setVar $Window_TXT ($Window_TXT & "    ----------------: Log Entries :----------------*")
	setVar $ii 1

	while ($ii <= 5)
		if ($LOG_ENTRIES[$ii] <> "")
			setVar $Window_TXT ($Window_TXT & " " & $LOG_ENTRIES[$ii] & "*")
		end
    	add $ii 1
	end
	setWindowContents status ("*" & $Window_TXT)
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

:Move_Down
	setVar $LOG_ENTRIES[5] $LOG_ENTRIES[4]
	setVar $LOG_ENTRIES[4] $LOG_ENTRIES[3]
	setVar $LOG_ENTRIES[3] $LOG_ENTRIES[2]
	setVar $LOG_ENTRIES[2] $LOG_ENTRIES[1]
	setVar $LOG_ENTRIES[1] ($LOG_EVENT & " " & $LOG_TEXT)
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

:Haggel_Checker
	killAllTriggers
		setVar $EQU_NEED2BUY ($EQU_MIN - $EQUIPMENT_HOLDS)
		setVar $ORE_NEED2BUY (($TOTAL_HOLDS - $EQU_MIN) - $ORE_HOLDS)
		if (PORT.CLASS[$CURRENT_SECTOR] = 1) OR (PORT.CLASS[$CURRENT_SECTOR] = 5) OR (PORT.CLASS[$CURRENT_SECTOR] = 6) OR (PORT.CLASS[$CURRENT_SECTOR] = 7) OR (PORT.CLASS[$CURRENT_SECTOR] = 3) OR (PORT.CLASS[$CURRENT_SECTOR] = 4) OR (PORT.CLASS[$CURRENT_SECTOR] = 2)
			#send "CR*Q"
			#waiton "<Computer deactivated>"
			#if (PORT.EQUIP[$CURRENT_SECTOR] >= $EQU_NEED2BUY) AND ($EQU_NEED2BUY <> 0)
			setTextTrigger noPort :noPort "Corp Menu"
			send "p   t   "
			Waiton "<Port>"
			setTextTrigger	noFuel		:noFuel		"How many holds of Fuel Ore do you want to buy"
			setTextTrigger	noOrg		:noOrg		"How many holds of Organics do you want to buy"
			setTextTrigger	equp		:equp		"How many holds of Equipment do you want to sell ["
			setTextTrigger	buyequp		:buyequp	"How many holds of Equipment do you want to buy"
			setTextTrigger	nosell		:nosell		"You don't have anything they want"
			setTextTrigger	fuelsell 	:fuelsell	"How many holds of Fuel Ore do you want to sell"
			setTextTrigger	orgSell 	:orgSell	"How many holds of Organics do you want to sell"
			setTextTrigger	done		:done		"Command [TL"
			pause
			:noPort
				killAllTriggers
				Echo "***Hmmm.. where'd the port go?!?**"
				halt
			:done
				killAllTriggers
				return
			:noFuel
        		if ($ORE_NEED2BUY >= 1)
        			send $ORE_NEED2BUY & "**"
        		else
        			send "0*"
        		end
        		pause
			:noOrg
			send "0*"
			pause
			:equp
			if ($MCIC[$CURRENT_SECTOR] = 0)
				setVar $MCIC[$CURRENT_SECTOR] TRUE
				if ($EQUIPMENT_HOLDS > $EQU_MIN)
					send ($EQUIPMENT_HOLDS - $EQU_MIN) & "**"
				else
					add $MCICd 1
					send "5**"
				end
			else
				send "0*"
			end
			pause
			:buyequp
			if ($EQU_NEED2BUY >= 1)
				send $EQU_NEED2BUY & "**"
			else
				send "0*"
			end
			pause
			:nosell
			killAllTriggers
			return
			:fuelsell
			if ($ORE_HOLDS > ($TOTAL_HOLDS - $EQU_MIN))
				send $ORE_HOLDS - ($TOTAL_HOLDS - $EQU_MIN)& "**"
			else
				send "0*"
			end
			pause
			:orgsell
			send "**"
			pause
	end
	return
:Do_Holo
	setArray $HoloOutput 2000
    setVar $Line_Pointer 1
                	send "SzH*  "
	setTextLineTrigger	TurnsGone		:TurnsGone		"Do you want instructions (Y/N) [N]?"
	setTextLineTrigger	DoneScan		:DoneScan		"Warps to Sector(s) :"

	waiton "Long Range Scan"
    :reset_trigger
	setTextLineTrigger holo_line :holo_line
	pause
	:holo_line
	setVar $HoloOutput[$Line_Pointer] CURRENTLINE
	if ($Line_Pointer <= 2000)
		add $Line_Pointer 1
	end
	goto :reset_trigger
	:DoneScan
	killAllTriggers
	setVar $HoloOutput[$Line_Pointer] "ENDENDENDENDENDENDEND"
	return

:Display_Holo
	setVar $Holo_i 1
	setVar $Holo_ptr 1
	setVar $Holo_s ""
	setVar $AvoidFlag ""
	while (SECTOR.WARPS[$CURRENT_SECTOR][$Holo_i] > 0)
		setVar $Holo_adj SECTOR.WARPS[$CURRENT_SECTOR][$Holo_i]
		if ((SECTOR.PLANETCOUNT[$Holo_adj] > 0) OR (SECTOR.TRADERCOUNT[$Holo_adj] > 0) OR (SECTOR.SHIPCOUNT[$Holo_adj] > 0))
	       	setVar $figOwner SECTOR.FIGS.OWNER[$Holo_adj]
			if ((SECTOR.FIGS.QUANTITY[$Holo_adj] >= 100) AND (($figOwner <> "belong to your Corp") OR ($figOwner <> "yours")))
				while ($Holo_ptr <= $Line_Pointer)
	            	getWordPos $HoloOutput[$Holo_ptr] $Holo_pos ("Sector  : " & $Holo_adj)
	            	setVar $AvoidFlag ($AvoidFlag & " " & $Holo_adj)
					if ($Holo_pos <> 0)
						setvar $Holo_s ($Holo_s & $HoloOutput[$Holo_ptr] & "*")
						:Lets_Go_Again
	                   	add $Holo_ptr 1
	                   	getWordPos $HoloOutput[$Holo_ptr] $pos "Warps to Sector(s) :"
						if (($HoloOutput[$Holo_ptr] <> "") AND ($pos = 0))
							setvar $Holo_s ($Holo_s & $HoloOutput[$Holo_ptr] & "*")
						else
							setvar $Holo_s ($Holo_s & "         *")
							goto :Done_Scan
						end
						goto :Lets_Go_Again
					end
	            	add $Holo_ptr 1
				end
			end
		end
		:Done_Scan
    	add $Holo_i 1
	end

	SetVar	$HOLO_TARGETS	"LSHRED_" & GAMENAME & ".log"
	if ($Holo_s <> "")
		send "'*["&$TagLineB&"] SCAN RESULTS----------------------[ADJ SECTOR: " & CURRENTSECTOR & "*"
		send $Holo_s & "* "
		waitfor "Sub-space comm-link terminated"
	end
	return
	

