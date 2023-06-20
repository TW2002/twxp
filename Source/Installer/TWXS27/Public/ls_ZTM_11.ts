	setVar $FILE 			"LSZTM_" & GAMENAME & ".txt"
	setVar $7WARP_FILE	"LSZTM_" & GAMENAME & "_7Warp.txt"
	setVar $DEADEND_FILE	"LSZTM_" & GAMENAME & "_DeadEnds.txt"
	setVar $TRAFFIC_FILE "LSZTM_" & GAMENAME & "_Traffic.txt"

	setArray $7_WARPS		SECTORS
	setArray $TRAFFIC		SECTORS

	gosub :_START_
	gosub :getctime
	setVar $abs_start $dd
	write $FILE "======================"
	write $FILE "Mapping INITIATED @ " & TIME
	:RELOG_TOP_
	killAllTriggers

	setEventTrigger	ServerHung		:RELOG 	"CONNECTION LOST"
	setEventTrigger   ServerShut		:RELOG	"Connections have been temporarily disabled."
	while ($PASS <= 7)
   	if ($PASS = 1)
   		# Zero Warp Search
			setVar $NUM TIME
			gosub :PAD_TIME
   		setVar $LOG ($PAD & $NUM & " - 0 Warp Search Started")
   		write $FILE $LOG
   		setVar $WINDOWSTR ($WINDOWSTR & $LOG & "*")
			setWindowContents LSZTM ($WIND & $WINDOWSTR)
			gosub :getctime
			setVar $start $dd
			gosub :PASS_1
			gosub :getctime
			setVar $end $dd
			gosub :calculate
			setVar $NUM TIME
			gosub :PAD_TIME
			write $FILE ($PAD & $NUM & " - Pass Completed (" & $RESULT & ")")
   	elseif ($PASS >= 2) AND ($PASS <= 6)
			# Warp search respective to $pass value
			setVar $NUM TIME
			gosub :PAD_TIME
			setVar $LOG ($PAD & $NUM & " - "  & ($PASS - 1) & " Warp Search Started")
			write $FILE $LOG
			setVar $WINDOWSTR ($WINDOWSTR & $LOG & "*")
			setWindowContents LSZTM ($WIND & $WINDOWSTR)
			gosub :getctime
			setVar $start $dd
			GoSub :PASS_1_TO_5
			gosub :PASS_RECONCILE
			gosub :getctime
			setVar $end $dd
			gosub :calculate
			setVar $NUM TIME
			gosub :PAD_TIME
			write $FILE ($PAD & $NUM & " - Pass Completed (" & $RESULT & ")")
		elseif ($PASS = 7)
			# OneWay Search
			setVar $NUM TIME
			gosub :PAD_TIME
			setVar $LOG ($PAD & $NUM & " - One-Way Course Plot Started")
			WRITE $FILE $LOG
			setVar $WINDOWSTR ($WINDOWSTR & $LOG & "*")
			setWindowContents LSZTM ($WIND & $WINDOWSTR)
			gosub :getctime
			setVar $start $dd
			GoSub :one_Way_check
			gosub :PASS_RECONCILE
			gosub :getctime
			setVar $end $dd
			gosub :calculate
			setVar $NUM TIME
			gosub :PAD_TIME
			write $FILE ($PAD & $NUM & " - Pass Completed (" & $RESULT & ")")
		else
		end
		gosub :WARP_REPORT
		gosub :SPIT_OUT
		add $PASS 1
		setVar $LSZTM_PASS $PASS
		saveVar $LSZTM_PASS
		setVar $LSZTM_RESUME 1
		saveVar $LSZTM_RESUME
	end
	send "Q"
	waitfor "<Computer deactivated>"

	Echo "**" & $TAGLINE
	Echo "**" & $TAGLINE & "Writing Traffic Data To: " & ANSI_14 & $TRAFFIC_FILE
	setVar $IDX 1
	while ($IDX <= SECTORS)
		WRITE $TRAFFIC_FILE ($IDX & " " & $TRAFFIC[$IDX])

		# Clearing SectorParameter		
		setSectorParameter $IDX "WARPCNT" ""
		add $IDX 1
	end


	gosub :getctime
	setVar $Start $abs_start
	setVar $end $dd
	gosub :calculate

	setVar $NUM TIME
	gosub :PAD_TIME
	write $FILE ($PAD & $NUM & " - ZTM Completed - Total Running Time: " & $RESULT)
	write $FILE "--------------------------------------------------"

	:SIGNS_DELAY
	killAlltriggers
	Echo "**" & $TAGLINE & "ZTM Complete. Press ANY Key To See Final Results.**"
	setTextOutTrigger		SIGNS_OF_LIFE	:SIGNS_OF_LIFE
	setDelayTrigger		SIGNS_DELAY		:SIGNS_DELAY	30000
	pause
	:SIGNS_OF_LIFE
	killAllTriggers
	Echo "**" & $TAGLINE & "*"
	Echo $LINE_H & "*" & $LINE_L & "*" & $LINE_1 & "*" & $LINE_2 & "*" & $LINE_3 & "*" & $LINE_4 & "*"
	Echo $LINE_5 & "*" & $LINE_6 & "*" & $LINE_7 & "*" & $LINE_8 & "*" & $LINE_9 & "*" & $LINE_L & "*"
	Echo $LINE_0 & "*" & $LINE_A & "*" & $LINE_B & " " & $KNOWN_7WARPS & "*" & $TAGLINE & "**"
	halt


:PASS_1_TO_5
	setVar $FINDING ($PASS - 1)
	setVar $SAVEFLAG 0
	setVar $TO SECTORS
	setVar $PLOTS_MADE 0

	loadvar $LSZTM_RESUME
	if ($LSZTM_RESUME < 1)
		setVar $IDX 1
	else
		setVar $IDX ($LSZTM_RESUME - 1)
	end

	while ($IDX <= SECTORS)
		setVar $PTR $IDX
		gosub :GET_WARPCNT_PARAMETER
		if ($_OUT_ = ($PASS - 1))
			gosub :VOiD_ADJs
			gosub :Get_TO
			setVar $FROM $IDX
         setVar $STR ("**" & $TAGLINE & ANSI_14 & $FROM & ANSI_15 & " (" &SECTOR.WARPINCOUNT[$FROM] & ":" & SECTOR.WARPCOUNT[$FROM] & ")")
			setVar $STR ($STR & ANSI_7 & " ==> " & ANSI_15 & $TO & "(" &SECTOR.WARPINCOUNT[$TO] & ":" & SECTOR.WARPCOUNT[$TO] & "," & $FINDING & ")")
			#Plot Routine Increments $PLOTS_MADE
			gosub :PLOT_COURSE
			add $SAVEFLAG 1
			gosub :SET_COURSE_TO_PARAMETER
			setVar $STR ($STR & "  {(" & SECTOR.WARPINCOUNT[$FROM] & ":" & SECTOR.WARPCOUNT[$FROM] & ")")
			setVar $STR ($STR & "(" &SECTOR.WARPINCOUNT[$TO] & ":" & SECTOR.WARPCOUNT[$TO] & ")}*")
			echo $STR
		end
		if ($SAVEFLAG >= 20)
		   setVar $SAVEFLAG 0
			setVar $LSZTM_RESUME $FROM
			saveVar $LSZTM_RESUME
		end
   	add $IDX 1
	end
	return

:PASS_1
	setVar $TO 				SECTORS
  	setVar $FINDING 		0
	setVar $IDX 			1
	setVar $PLOTS_MADE	0

	while ($IDX <= SECTORS)
		setVar $PTR $IDX
		gosub :GET_WARPCNT_PARAMETER
		if ($_OUT_ = 0)
			gosub :Get_TO
			setVar $FROM $IDX
			#Sub Routine Increments $PLOTS_MADE var
			gosub :PLOT_COURSE
			gosub :SET_COURSE_TO_PARAMETER
		end
   	add $IDX 1
	end
	setVar $STR ("**" & $TAGLINE & "Verifying PASS 1**")
	Echo "*"
	Echo "*" & $TAGLINE & ANSI_12 & "==================="
	Echo "*" & $TAGLINE & " Verifying PASS 1"
	Echo "*" & $TAGLINE & ANSI_12 & "==================="
	Echo "*"
	setVar $IDX 1
	setVar $FINDING 1
	while ($IDX <= SECTORS)
		if (SECTOR.WARPCOUNT[$IDX] = 0)
			setvar $TO 1
			setVar $FROM $IDX
			gosub :PLOT_COURSE
			gosub :SET_COURSE_TO_PARAMETER
		end
   	add $IDX 1
	end
	return

:one_Way_check
	loadvar $LSZTM_RESUME
	if ($LSZTM_RESUME < 1)
		setVar $IDX 1
	else
		if ($LSZTM_RESUME > 1)
			setVar $IDX ($LSZTM_RESUME - 1)
		else
			setVar $IDX $LSZTM_RESUME
		end
	end

	setVar $FINDING 1
	setVar $SAVEFLAG 0
	setVar $TO SECTORS
	setARRAY $CHK	SECTORS

  	gosub :clear_avoids

	while ($IDX <= SECTORS)
		#Have to popuulate a DOORs Array because basing a while loop on something like:
		#  			while ($DOOR <= SECTOR.BACKDOORCOUNT[$IDX])
		#						do a course plot
		#						add $DOOR 1
		#				end
		# ...wouldn't work as the backdoorcount changes with each plot
		setVar $DOOR 1
		setArray $DOORS 7
		setVar $DOOR_IDX 1
		while ($DOOR_IDX <= SECTOR.BACKDOORCOUNT[$IDX])
			setVar $DOORS[$DOOR_IDX] SECTOR.BACKDOORS[$IDX][$DOOR_IDX]
			add $DOOR_IDX 1
		end

		while ($DOOR < $DOOR_IDX)
      	setVar $TO $DOORS[$DOOR]
      	setVar $FROM $IDX
         setVar $STR ("**" & $TAGLINE & ANSI_14 & $FROM & ANSI_15 & "(" &SECTOR.WARPINCOUNT[$FROM] & ":" & SECTOR.WARPCOUNT[$FROM] & ")")
			setVar $STR ($STR & ANSI_7 & " ==> " & ANSI_15 & $TO & "(" &SECTOR.WARPINCOUNT[$TO] & ":" & SECTOR.WARPCOUNT[$TO] & "," & $FINDING & ")")
			gosub :PLOT_COURSE
			gosub :SET_COURSE_TO_PARAMETER
			setVar $STR ($STR & "  {(" & SECTOR.WARPINCOUNT[$FROM] & ":" & SECTOR.WARPCOUNT[$FROM] & ")")
			setVar $STR ($STR & "(" &SECTOR.WARPINCOUNT[$TO] & ":" & SECTOR.WARPCOUNT[$TO] & ")}*")
			echo $STR
			setVar $CHK[$TO] TRUE
      	add $saveflag 1
			add $DOOR 1
		end
		if ($saveflag >= 20)
			setVar $saveflag 0
			setVar $LSZTM_RESUME $FROM
			saveVar $LSZTM_RESUME
		end
		add $IDX 1
	end

	# This is a recheck for any new 1ways that occur during inital check.
	# the chk[] array prevents us from redoing the whole-nine-yards
	setVar $FINDING #8
	setVar $TO SECTORS
	setVar $IDX 1
	while ($IDX <= SECTORS)
		setVar $DOOR 1
		while ($DOOR <= SECTOR.BACKDOORCOUNT[$IDX])
			if ($CHK[SECTOR.BACKDOORS[$IDX][$DOOR]] = 0)
	      	setVar $TO SECTOR.BACKDOORS[$IDX][$DOOR]
	      	setVar $FROM $IDX
	         setVar $STR ("**" & $TAGLINE & ANSI_14 & $FROM & ANSI_15 & "(" &SECTOR.WARPINCOUNT[$FROM] & ":" & SECTOR.WARPCOUNT[$FROM] & ")")
				setVar $STR ($STR & ANSI_7 & " ==> " & ANSI_15 & $TO & "(" &SECTOR.WARPINCOUNT[$TO] & ":" & SECTOR.WARPCOUNT[$TO] & "," & $FINDING & ")")
				gosub :PLOT_COURSE
				gosub :SET_COURSE_TO_PARAMETER
				setVar $STR ($STR & "  {(" & SECTOR.WARPINCOUNT[$FROM] & ":" & SECTOR.WARPCOUNT[$FROM] & ")")
				setVar $STR ($STR & "(" &SECTOR.WARPINCOUNT[$TO] & ":" & SECTOR.WARPCOUNT[$TO] & ")}*")
				echo $STR
	      	add $saveflag 1
			end
			add $DOOR 1
		end
		add $IDX 1
	end
	return

:PASS_RECONCILE
	setVar $FINDING 		($PASS - 1)
	setVar $SAVEFLAG 		0
	setVar $TO 				SECTORS

	loadvar $LSZTM_RESUME
	if ($LSZTM_RESUME < 1)
		setVar $IDX 1
	else
		if ($LSZTM_RESUME > 1)
			setVar $IDX ($LSZTM_RESUME - 1)
		else
			setVar $IDX $LSZTM_RESUME
		end
	end
	while ($IDX <= SECTORS)
		setVar $PTR $IDX
   	gosub :GET_WARPCNT_PARAMETER
   	if (SECTOR.WARPCOUNT[$IDX] <> $_OUT_) OR (SECTOR.WARPINCOUNT[$IDX] <> $_IN_)
			gosub :VOiD_ADJs
			gosub :Get_TO
			setVar $FROM $IDX
         setVar $STR ("**" & $TAGLINE & ANSI_4 & $FROM & ANSI_15 & " (" &SECTOR.WARPINCOUNT[$FROM] & ":" & SECTOR.WARPCOUNT[$FROM] & ")")
			setVar $STR ($STR & ANSI_7 & " ==> " & ANSI_15 & $TO & " (" &SECTOR.WARPINCOUNT[$TO] & ":" & SECTOR.WARPCOUNT[$TO] & "," & $FINDING & ")")
			gosub :PLOT_COURSE
			gosub :SET_COURSE_TO_PARAMETER
			setVar $STR ($STR & "  {(" & SECTOR.WARPINCOUNT[$FROM] & ":" & SECTOR.WARPCOUNT[$FROM] & ")")
			setVar $STR ($STR & "(" &SECTOR.WARPINCOUNT[$TO] & ":" & SECTOR.WARPCOUNT[$TO] & ")}*")
			echo $STR
		end
		if ($SAVEFLAG >= 20)
			setVar $SAVEFLAG 0
			setVar $LSZTM_RESUME $FROM
			saveVar $LSZTM_RESUME
		end
		add $SAVEFLAG 1
		add $idx 1
	end
	return

:VOiD_ADJs
	setVar $TRIG 0
	setVar $ADJ 1
	setVar $STRING ""
	while (SECTOR.WARPS[$PTR][$ADJ] <> 0)
		setVar $STRING ($STRING & "v" & SECTOR.WARPS[$PTR][$ADJ] & "*")
		setVar $TRIG SECTOR.WARPS[$PTR][$ADJ]
		add $ADJ 1
	end
	send $STRING
	#waitfor "Sector " & $TRIG & " will now be avoided"
	return

:Get_TO
	subtract $TO 1
	while ($TO > 1)
		setVar $PTR $TO
		gosub :GET_WARPCNT_PARAMETER
		if ($_IN_ = $FINDING)
			return
		end
		subtract $TO 1
	end
	if ($TO <= 1)
		add $FINDING 1
		setVar $TO SECTORS
		goto :Get_TO
	end
	if ($FINDING >= 6)
		setVar $FINDING 1
	end
	return

:SET_COURSE_TO_PARAMETER
	#Analyize a plotted Course and adjust the "WARPCNT" Parameter
	isnumber $tst1 $FROM
	isnumber $tst2 $TO
	if (($tst1) AND ($tst2))
		getcourse $Course $FROM $TO
		if ($course <> "-1")
			setVar $i 1
			while ($i <= ($course + 1))
				setVar $PTR $course[$i]
				
				add $TRAFFIC[$PTR] 1

				gosub :SET_WARPCNT_PARAMETER
				add $i 1
			end
		end
	end
	return

:SET_WARPCNT_PARAMETER
	if ($PTR >= 1) AND ($PTR <= SECTORS)
		setSectorParameter $PTR "WARPCNT" (SECTOR.WARPINCOUNT[$PTR] & ":" & SECTOR.WARPCOUNT[$PTR])
	end
	if (SECTOR.WARPINCOUNT[$PTR] = 7)
		if ($7_WARPS[$PTR] = 0)
			setVar $7_WARPS[$PTR] TRUE
			add $KNOWN_7WARPS 1
			write $7WARP_FILE $PTR
			gosub :SPIT_OUT
		end
	end
	return
:GET_WARPCNT_PARAMETER
	setVar $_IN_ "-1"
	setVar $_OUT_ "-1"
	if (($PTR >= 1) AND ($PTR <= SECTORS))
		getSectorParameter $PTR "WARPCNT" $TMP
		if ($TMP = "0")
			goto :PARSE_ERROR
		end
		getWordPos $TMP $POS ":"
		if ($POS <> 2)
			goto :PARSE_ERROR
		end
		replaceText $TMP ":" " "
		getWord $TMP $_IN_ 1
		isnumber $tst $_IN_
		if ($tst = 0)
			goto :PARSE_ERROR
		end
		getWord $TMP $_OUT_ 2
		isnumber $tst $_OUT_
		if ($tst = 0)
			goto :PARSE_ERROR
		end
	end
	return
	:PARSE_ERROR
		setVar $_IN_ SECTOR.WARPINCOUNT[$PTR]
		setVar $_OUT_ SECTOR.WARPCOUNT[$PTR]
		setSectorPArameter $PTR "WARPCNT" ($_IN_ & ":" & $_OUT_)
		return

:PLOT_COURSE
	send "f" & $FROM & "*" & $TO & "*"
	setTextLineTrigger		NoPath	:NoPath	"No route within"
	setTextLineTrigger		Done		:Done		"The shortest"
	setTextLineTrigger		What		:What		"So what's the point?"
	pause
	:Done
		killTrigger NoPath
		killTrigger Done
		killTrigger What
		setDelayTrigger	EMANCIPATE_CPU	:EMANCIPATE_CPU 10
		pause
		:EMANCIPATE_CPU
		killTrigger NoPath
		killTrigger Done
		killTrigger What
		# $PASS 1 is a 0warp search
		# $PASS 7 is a 1way warp search
		if ($PASS <> 1) AND ($PASS <> 7)
			gosub :clear_avoids
		end
		add $PLOTS_MADE 1
		return
	:NoPath
		killTrigger NoPath
		killTrigger Done
		killTrigger What
		send "y"
		return
	:What
		killTrigger NoPath
		killTrigger Done
		killTrigger What
		subtract $TO 1
		if ($TO < 1)
			setVar $TO SECTORS
		end
		gosub :clear_avoids
		goto :PLOT_COURSE

:WARP_REPORT
	setVar $i 1
	setVar $MATRIX[($PASS + 1)][1] 0
	setVar $MATRIX[($PASS + 1)][2] 0
	setVar $MATRIX[($PASS + 1)][3] 0
	setVar $MATRIX[($PASS + 1)][4] 0
	setVar $MATRIX[($PASS + 1)][5] 0
	setVar $MATRIX[($PASS + 1)][6] 0
	setVar $MATRIX[($PASS + 1)][7] 0
	setVar $MATRIX[($PASS + 1)][8] 0
	setVar $MATRIX[($PASS + 1)][9] 0
	setVar $MATRIX[($PASS + 1)][10] 0

	Echo "**" & $TAGLINE & "Compiling Warp Report..." & "**"
	while ($i <= SECTORS)
		if (sector.warpcount[$i] < 1)
			add $MATRIX[($PASS + 1)][1] 1
		elseif (sector.warpcount[$i] = 1)
			add $MATRIX[($PASS + 1)][2] 1
		elseif (sector.warpcount[$i] = 2)
			add $MATRIX[($PASS + 1)][3] 1
		elseif (sector.warpcount[$i] = 3)
			add $MATRIX[($PASS + 1)][4] 1
		elseif (sector.warpcount[$i] = 4)
			add $MATRIX[($PASS + 1)][5] 1
		elseif (sector.warpcount[$i] = 5)
			add $MATRIX[($PASS + 1)][6] 1
		elseif (sector.warpcount[$i] = 6)
			add $MATRIX[($PASS + 1)][7] 1
		else
			add $MATRIX[($PASS + 1)][8] 1
		end
		add $MATRIX[($PASS + 1)][9] sector.warpcount[$i]
		add $i 1
	end
	setVar $MATRIX[($PASS + 1)][10] $PLOTS_MADE
	return

:SPIT_OUT
	setVar $LINE_H	"RESULTS: START|0 WARP|1 WARP|2 WARP|3 WARP|4 WARP|5 WARP|1 WAY  "
	SetVar $LINE_L " ------+------+------+------+------+------+------+------+-------"
	SetVar $LINE_1 "   None:"
	SetVar $LINE_2 "    One:"
	SetVar $LINE_3 "    Two:"
	SetVar $LINE_4 "  Three:"
	SetVar $LINE_5 "   Four:"
	SetVar $LINE_6 "   Five:"
	SetVar $LINE_7 "    Six:"
	SetVar $LINE_8 "   More:"
	SetVar $LINE_9 "  TOTAL:"
	setVar $LINE_0 "  Warps:"
	setVar $LINE_A "  Plots:"
	setVar $LINE_B " 7Warps:"
	setVar $WIND ""

	setVar $cPAD ""
	setVar $SPIT_OUT_idx 1
	while ($SPIT_OUT_idx <= $COL_WIDTH)
		setVar $cPAD ($cPAD & " ")
		add $SPIT_OUT_idx 1
	end
	setVar $SPIT_OUT_idx 1
	while ($SPIT_OUT_idx <= 8)
		if ($MATRIX[$SPIT_OUT_idx][1] = "0")
			setVar $LINE_1 ($LINE_1 & $cPAD & "|")
		else
			setVar $STR $MATRIX[$SPIT_OUT_idx][1]
			gosub :PAD
			setVar $LINE_1 ($LINE_1 & $PAD & $MATRIX[$SPIT_OUT_idx][1] & "|")
		end

		if ($MATRIX[$SPIT_OUT_idx][2] = "0")
			setVar $LINE_2 ($LINE_2 & $cPAD & "|")
		else
			setVar $STR $MATRIX[$SPIT_OUT_idx][2]
			gosub :PAD
			setVar $LINE_2 ($LINE_2 & $PAD & $MATRIX[$SPIT_OUT_idx][2] & "|")
		end

		if ($MATRIX[$SPIT_OUT_idx][3] = "0")
			setVar $LINE_3 ($LINE_3 & $cPAD & "|")
		else
			setVar $STR $MATRIX[$SPIT_OUT_idx][3]
			gosub :PAD
			setVar $LINE_3 ($LINE_3 & $PAD & $MATRIX[$SPIT_OUT_idx][3] & "|")
		end

		if ($MATRIX[$SPIT_OUT_idx][4] = "0")
			setVar $LINE_4 ($LINE_4 & $cPAD & "|")
		else
			setVar $STR $MATRIX[$SPIT_OUT_idx][4]
			gosub :PAD
			setVar $LINE_4 ($LINE_4 & $PAD & $MATRIX[$SPIT_OUT_idx][4] & "|")
		end

		if ($MATRIX[$SPIT_OUT_idx][5] = "0")
			setVar $LINE_5 ($LINE_5 & $cPAD & "|")
		else
			setVar $STR $MATRIX[$SPIT_OUT_idx][5]
			gosub :PAD
			setVar $LINE_5 ($LINE_5 & $PAD & $MATRIX[$SPIT_OUT_idx][5] & "|")
		end

		if ($MATRIX[$SPIT_OUT_idx][6] = "0")
			setVar $LINE_6 ($LINE_6 & $cPAD & "|")
		else
			setVar $STR $MATRIX[$SPIT_OUT_idx][6]
			gosub :PAD
			setVar $LINE_6 ($LINE_6 & $PAD & $MATRIX[$SPIT_OUT_idx][6] & "|")
		end

		if ($MATRIX[$SPIT_OUT_idx][7] = "0")
			setVar $LINE_7 ($LINE_7 & $cPAD & "|")
		else
			setVar $STR $MATRIX[$SPIT_OUT_idx][7]
			gosub :PAD
			setVar $LINE_7 ($LINE_7 & $PAD & $MATRIX[$SPIT_OUT_idx][7] & "|")
		end

		if ($MATRIX[$SPIT_OUT_idx][8] = "0")
			setVar $LINE_8 ($LINE_8 & $cPAD & "|")
		else
			setVar $STR $MATRIX[$SPIT_OUT_idx][8]
			gosub :PAD
			setVar $LINE_8 ($LINE_8 & $PAD & $MATRIX[$SPIT_OUT_idx][8] & "|")
		end

  		setVar $STR ($MATRIX[$SPIT_OUT_idx][1] + $MATRIX[$SPIT_OUT_idx][2] + $MATRIX[$SPIT_OUT_idx][3] + $MATRIX[$SPIT_OUT_idx][4] + $MATRIX[$SPIT_OUT_idx][5] + $MATRIX[$SPIT_OUT_idx][6] + $MATRIX[$SPIT_OUT_idx][7] + $MATRIX[$SPIT_OUT_idx][8])
		if ($STR = "0")
			setVar $LINE_9 ($LINE_9 & $cPAD & "|")
		else
			gosub :PAD
			setVar $LINE_9 ($LINE_9 & $PAD & $STR & "|")
		end

		if ($MATRIX[$SPIT_OUT_idx][9] = "0")
			setVar $LINE_0 ($LINE_0 & $cPAD & "|")
		else
			setVar $STR $MATRIX[$SPIT_OUT_idx][9]
			gosub :PAD
			setVar $LINE_0 ($LINE_0 & $PAD & $MATRIX[$SPIT_OUT_idx][9] & "|")
		end

		if ($MATRIX[$SPIT_OUT_idx][10] = "0")
			setVar $LINE_A ($LINE_A & $cPAD & "|")
		else
			setVar $STR $MATRIX[$SPIT_OUT_idx][10]
			gosub :PAD
			setVar $LINE_A ($LINE_A & $PAD & $MATRIX[$SPIT_OUT_idx][10] & "|")
		end
		add $SPIT_OUT_idx 1
	end

	setVar $WIND "*"
	setVar $WIND ($WIND & $LINE_H)
	setVar $WIND ($WIND & "*" & $LINE_L)
	setVar $WIND ($WIND & "*" & $LINE_1)
	setVar $WIND ($WIND & "*" & $LINE_2)
	setVar $WIND ($WIND & "*" & $LINE_3)
	setVar $WIND ($WIND & "*" & $LINE_4)
	setVar $WIND ($WIND & "*" & $LINE_5)
	setVar $WIND ($WIND & "*" & $LINE_6)
	setVar $WIND ($WIND & "*" & $LINE_7)
	setVar $WIND ($WIND & "*" & $LINE_8)
	setVar $WIND ($WIND & "*" & $LINE_9)
	setVar $WIND ($WIND & "*" & $LINE_L)
   setVar $WIND ($WIND & "*" & $LINE_0)
   setVar $WIND ($WIND & "*" & $LINE_A)
   SetVar $WIND ($WIND & "*")
	if ($KNOWN_7WARPS <> 0)
		setVar $WIND ($WIND & "*" & $LINE_B & " " & $KNOWN_7WARPS & " (" & $7WARP_FILE & ")")
	end
	setWindowContents LSZTM $WIND & $WINDOWSTR & "*"
	return

:clear_avoids
	send "v0*yy"
	waiton "Avoided sectors Cleared."
	return

:PAD
	getlength $STR $LEN
	setVar $PAD ""
	setVar $PAD_IDX 1
	while ($PAD_IDX <= ($COL_WIDTH - $LEN))
		setVar $PAD ($PAD & " ")
		add $PAD_IDX 1
	end
	return

:_START_
	reqrecording
	ClearAllAvoids
	
	setArray $MATRIX 8 10
	SetVar $COL_WIDTH 	6
	setVar $PLOTS_MADE	0
	setVar $TAGLINE  		(ANSI_9 & "["&ANSI_14&"LSZTM"&ANSI_9&"] " & ANSI_15)

	setVar $WINDOWSTR		"*"
	setVar $ZTM_COMPLETED	FALSE

	gosub :quikstats
	gosub :7WARP

	if ($CURRENT_PROMPT = "Command") OR ($CURRENT_PROMPT = "Citadel")
		send "C"
		waitfor "Computer command"
	elseif ($CURRENT_PROMPT = "Computer")
	else
		Echo "**"
		Echo $TAGLINE & "Need To Be At Command Prompt"
		Echo "*"
		halt
	end

	setVar $STAT_DES ""
	:_MENUTOP_
	Echo "**"
	Echo "*" & $TAGLINE & ANSI_1&"[["&ANSI_9&"["&ANSI_15&"LONESTAR's ZTMapper"&ANSI_1&"]"&ANSI_9&"]"&ANSI_1&"]]"
	Echo "*" & $TAGLINE
	Echo "*" & $TAGLINE & ANSI_8&"D"&ANSI_15&"eadEnd List   " & ANSI_7 & $STAT_DES
	Echo "*" & $TAGLINE & ANSI_8&"7"&ANSI_15&" Warp List    "
	Echo "*" & $TAGLINE & ANSI_8&"U"&ANSI_15&"pdate CIM Data "
	Echo "*" & $TAGLINE
	Echo "*" & $TAGLINE & ANSI_8&"R"&ANSI_15&"estart"
	Echo "*" & $TAGLINE & ANSI_8&"S"&ANSI_15&"tart"
	Echo "*" & $TAGLINE
	Echo "*" & $TAGLINE & ANSI_8&"Q"&ANSI_15&"uit"
	getConsoleInput $Sel SINGLEKEY
	uppercase $Sel
	if ($Sel = "Q")
		Echo "*" & $TAGLINE
		Echo "*" & $TAGLINE & ANSI_12 & "Script Halted"
		Echo "*" & $TAGLINE
		halt
	elseif ($Sel = "S")
		goto :_BEGIN_
	elseif ($Sel = "D")
		Echo "*"
		Echo "*" & $TAGLINE
		Echo "*" & $TAGLINE & "Scanning DBase.."
		Echo "*" & $TAGLINE
		setVar $IDX 1
		setVar $CNT 0
		delete $DEADEND_FILE
		while ($IDX <= SECTORS)
			if (SECTOR.WARPCOUNT[$IDX] = 1)
				write $DEADEND_FILE $IDX
				add $CNT 1
			end
      	add $IDX 1
		end
		Echo "*" & $TAGLINE & "Dead Ends Found: " & ANSI_14 & $CNT
		Echo "*" & $TAGLINE & "Written To     : " & ANSI_7 & $DEADEND_FILE
		Echo "*" & $TAGLINE
	elseif ($Sel = "7")
		Echo "*"
		Echo "*" & $TAGLINE
		Echo "*" & $TAGLINE & "Scanning DBase.."
		Echo "*" & $TAGLINE
		setVar $IDX 1
		setVar $CNT 0
		delete $7WARP_FILE
		while ($IDX <= SECTORS)
			if (SECTOR.WARPINCOUNT[$IDX] = 7)
				write $DEADEND_FILE $IDX
				add $CNT 1
			end
      	add $IDX 1
		end
		Echo "*" & $TAGLINE & "7 Warp Sectors Found: " & ANSI_14 & $CNT
		Echo "*" & $TAGLINE & "Written To          : " & ANSI_7 & $7WARP_FILE
		Echo "*" & $TAGLINE
	elseif ($Sel = "U")
		send "^IQ"
		waiton ": ENDINTERROG"
		Echo "**"
	elseif ($Sel = "R")
		setVar $PASS 0
		setVar $LSZTM_PASS $PASS
		setVar $LSZTM_RESUME 0
		saveVar $LSZTM_PASS
		saveVar $LSZTM_RESUME
		Delete $FILE
		Delete $7WARP_FILE
		Delete $DEADEND_FILE
		Delete $TRAFFIC_FILE
		goto :_BEGIN_
	end
	goto :_MENUTOP_

:_BEGIN_
	clearAllAvoids
	gosub :clear_avoids
	SetVar $PASS 0
   gosub :WARP_REPORT
   window LSZTM 550 400 ("LoneStar's Zero Turn Mapper  ["&GAMENAME&"]") ONTOP
	gosub :SPIT_OUT

	loadvar $LSZTM_PASS
	if ($LSZTM_PASS < 1)
		setVar $PASS 1
		setVar $LSZTM_PASS $PASS
		saveVar $LSZTM_PASS
	elseif ($LSZTM_PASS > 6)
		setVar $ZTM_COMPLETED TRUE
	else
		setVar $PASS $LSZTM_PASS
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
				if ($UNLIM)
					setVar $TURNS 65536
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


:RELOG
	killAllTriggers
	:Disco_Test
	if (CONNECTED <> TRUE)
		setDelayTrigger		EmancipateCPU		:EmancipateCPU 4000
		Echo "**" & $TagLine & "Awaiting Connection!**"
		pause
		:EmancipateCPU
		goto :Disco_Test
	end
	waitfor "(?="
	setDelayTrigger		WaitingABit		:WaitingABit	5000
	Echo "**" & $TagLine & "Connected - Waiting 5 Seconds For Valid Prompt!**"
	pause
	:WaitingABit
	killAllTriggers
	gosub :quikstats
	if ($CURRENT_PROMPT = "Command") OR ($CURRENT_PROMPT = "Citadel")
		send "C"
	elseif ($CURRENT_PROMPT = "Computer")
	else
		DISCONNECT
		goto :RELOG
	end

	goto :RELOG_TOP_

:7WARP
	setVar $KNOWN_7WARPS 0
	fileexists $tst $7WARP_FILE
	if ($tst)
		readToArray $7WARP_FILE $TEMP_ARRAY
		setVar $IDX 1
		while ($IDX <= $TEMP_ARRAY)
			isnumber $tst $TEMP_ARRAY[$IDX]
			if ($tst)
				setVar $7_WARPS[$TEMP_ARRAY[$IDX]] TRUE
				add $KNOWN_7WARPS 1
			end
      	add $IDX 1
      end
   end
	return

:getctime
getTime $ttm dd:hh:mm:ss
replacetext $ttm ":" " "
getword $ttm $dd 1
multiply $dd 86400
getword $ttm $hh 2
multiply $hh 3600
add $dd $hh
getword $ttm $mm 3
multiply $mm 60
add $dd $mm
getword $ttm $ss 4
add $dd $ss
return

:calculate
	setVar $HRS 0
	setVar $MIN 0
	setVar $SEC 0
	setVar $diff ($end - $start)
	if ($diff > 60)
		setprecision 0
		setvar $MIN ($diff / 60)
		setVar $SEC ($diff - ($MIN * 60))
		if ($MIN > 60)
			setVar $HRS ($MIN / 60)
			setVar $MIN ($MIN - ($HRS * 60))
		end
		if ($MIN < 10)
			setVar $MIN ("0" & $MIN)
		end
		if ($SEC < 10)
			setVar $SEC ("0" & $SEC)
		end
		setVar $RESULT ($HRS & ":" & $MIN & ":" & $SEC)
	else
		setVar $RESULT "00:00:" & $DIFF
	end
	return

:PAD
	setVar $PAD ""
	getLength $NUM $LEN
	setVar $PAD_i 1
	while ($PAD_i <= (5 - $LEN))
		setVar $PAD ($PAD & " ")
		add $PAD_i 1
	end
	return
	
	
:PAD_TIME
	setVar $PAD ""
	getlength $NUM $len
	setVar $PAD_i 1
	while ($PAD_i <= (11 - $LEN))
		setVar $PAD ($PAD & " ")
		add $PAD_i 1
	end
	return