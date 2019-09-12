	setVar $TAGLINE  		(ANSI_9 & "["&ANSI_14&"LSTr"&ANSI_9&"] " & ANSI_15)
	setVar $TRAFFIC_FILE "LSZTM_" & GAMENAME & "_Traffic.txt"
	setVar $Range 20
	setVar $MAX_FREQ 10
	setVar $WARPCNT 3
	setVar $NEAREST_DE 4
	setVar $Fig_FILTER "UnFig'd"
	setVar $FILTER_MSG "Displaying "&ANSI_7&"UnFig'd"&ANSI_7&" Sectors Only"
	fileexists $TST $TRAFFIC_FILE
	if ($TST = 0)
		Echo "**"&$TAGLINE&"Traffic File Not Found: "&ANSI_14&$TRAFFIC_FILE&"**"
		halt
	end
	readtoarray $TRAFFIC_FILE $TRAFFIC
	if ($TRAFFIC < SECTORS)
		Echo "**"&$TAGLINE&"Traffic File Contains To Few Elements**"
		halt
	end

	:_START_MENU
	#Echo "*" & $TAGLINE & ANSI_14 & "   LoneStar's Traffic Analyzer"
	Echo "*" & $TAGLINE & ANSI_1&"[["&ANSI_9&"["&ANSI_15&"LONESTAR's Traffic Analyzer"&ANSI_1&"]"&ANSI_9&"]"&ANSI_1&"]]"
	Echo "*" & $TAGLINE
	Echo "*" & $TAGLINE & ANSI_8 & "   R " & ANSI_15 & "Range           : " & ANSI_14 & $Range
	Echo "*" & $TAGLINE & ANSI_8 & "   M " & ANSI_15 & "Max Frequency   : " & ANSI_14 & $MAX_FREQ
	Echo "*" & $TAGLINE & ANSI_8 & "   W " & ANSI_15 & "Warp Count      : " & ANSI_14 & $WARPCNT
	Echo "*" & $TAGLINE & ANSI_8 & "   N " & ANSI_15 & "Nearest Dead End: " & ANSI_14 & $NEAREST_DE
	Echo "*" & $TAGLINE & ANSI_8 & "   F " & ANSI_15 & "Sect Fig Filter : " & ANSI_14 & $Fig_FILTER
	Echo "*" & $TAGLINE
	Echo "*" & $TAGLINE & ANSI_8 & "   A " & ANSI_15 & "Analyze That!"
	Echo "*" & $TAGLINE & ANSI_8 & "   T " & ANSI_15 & "Traffic Report"
	Echo "*" & $TAGLINE & ANSI_8 & "   H " & ANSI_15 & "Help"
	Echo "*" & $TAGLINE & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196
	Echo "*" & $TAGLINE & ANSI_8 & "   Q " & ANSI_15 & "Quit"
	Echo "*" & $TAGLINE
	:ASK_AGAIN
	getConsoleInput $s SINGLEKEY
	uppercase $s

	if ($S = "T")
		gosub :ANALYIZE
	end
	if ($S = "N")
		getInput $sel	(ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Minimum Distance To Nearest Dead End  (" & ANSI_6 & "1 to 10" & ANSI_14 & ")?")
		isnumber $tst $sel
		if ($tst = 0)
			setVar $sel 3
		end
		if ($sel > 10)
			setVar $sel 10
		end
		if ($sel < 1)
			setVar $sel 1
		end
		setVar $NEAREST_DE $sel
	end
	if ($S = "F")
		if ($Fig_FILTER = "UnFig'd")
			setVar $FILTER_MSG "Displaying "&ANSI_7&"Fig'd"&ANSI_15&" Sectors Only"
			setVar $Fig_FILTER  "Fig'd"
		elseif ($Fig_FILTER  = "Fig'd")
			setVar $FILTER_MSG "Displaying "&ANSI_7&"All"&ANSI_15&" Sectors"
			setVar $Fig_FILTER  "No Filtering"
		elseif ($Fig_FILTER  = "No Filtering")
			setVar $FILTER_MSG "Displaying "&ANSI_7&"UnFig'd"&ANSI_15&" Sectors Only"
			setVar $Fig_FILTER  "UnFig'd"
		else
			setVar $FILTER_MSG "Displaying "&ANSI_7&"All"&ANSI_15&" Sectors"
			setVar $Fig_FILTER "No Filtering"
		end
	end

	if ($S = "W")
		getInput $sel	(ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Sectors With How Many Adjacents  (" & ANSI_6 & "From 1 to 6" & ANSI_14 & ")?")
		isnumber $tst $sel
		if ($tst = 0)
			setVar $sel 3
		end
		if ($sel > 6)
			setVar $sel 6
		end
		if ($sel < 1)
			setVar $sel 1
		end
		setVar $WARPCNT $sel
	end
	if ($S = "M")
		getInput $sel	(ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Maximum Frequency Range  (" & ANSI_6 & "Min "&$LOW&", Max "&$HIGH& ANSI_14 & ")?")
		isnumber $tst $sel
		if ($tst = 0)
			setVar $sel $AVG
		end
		if ($sel > 1000)
			setVar $sel 1000
		end
		if ($sel < 1)
			setVar $sel 1
		end
		setVar $MAX_FREQ $sel
	end
	if ($S = "A")
		goto :_START_ANALYZE
	end
	if ($S = "R")
		getInput $sel	(ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Minimum Dist From Both Terra & Dock (" & ANSI_6 & "Min 5, Max 50" & ANSI_14 & ")?")
		isnumber $tst $sel
		if ($tst = 0)
			setVar $sel 15
		end
		if ($sel > 50)
			setVar $sel 50
		end
		if ($sel < 1)
			setVar $sel 5
		end
		setVar $Range $sel
	end
	if ($S = "Q")
		Echo "*" & $TAGLINE
		Echo "*" & $TAGLINE & ANSI_12 & "Script Halted"
		Echo "*" & $TAGLINE
		halt
	end

	if ($S = "H")
		gosub :_HELP_
	end
	goto :_START_MENU

:_START_ANALYZE
	Echo "*" & $TAGLINE
	Echo "*" & $TAGLINE & "Scanning, this may take a few minutes..."
	Echo "*" & $TAGLINE
	Echo "*" & $TAGLINE & $FILTER_MSG
	Echo "*" & $TAGLINE & "---------------------------------------------------------"
	setVar $i 1
	clearallavoids
	clearallavoids
	while ($i <= $TRAFFIC)
		getWord $TRAFFIC[$I] $SECT 1
		getWord $TRAFFIC[$I] $TMP 2
		getSectorParameter $SECT "FIGSEC" $FILTERING
		isnumber $tst $FILTERING
		if ($tst = 0)
			setvar $FILTERING 0
		end

		if ($Fig_FILTER = "UnFig'd") AND ($FILTERING <> 0)
			goto :_Next_Filter_
		elseif ($Fig_FILTER  = "Fig'd") AND ($FILTERING = 0)
			goto :_Next_Filter_
		end

		if (((sector.warpcount[$sect] = $WARPCNT) and (sector.warpincount[$sect] = $WARPCNT)) and ($tmp < $MAX_FREQ))
			setVar $FROM 1
			setVar $TO $SECT
			gosub :_GET_
			setVar $Dist1 $DIST
			setVar $FROM STARDOCK
			gosub :_GET_
			setVar $Dist2 $DIST
			if ($Dist1 >= $Range) AND ($Dist2 >= $Range)
				setVar $adj 1
				while ($adj <= sector.warpcount[$SECT])
					setVar $focus sector.warps[$SECT][$adj]
					if (sector.warpcount[$focus] <= 2)
						goto :NExt
					end
	         	add $adj 1
				end
				setVAr $adj 1
				while ($adj <= sector.warpcount[$SECT])
					setVar $focus sector.warps[$SECT][$adj]
					getcourse $course 1 $focus
					if ($course <> "-1")
						setVar $idx 1
						while ($idx <= $course)
							if ($course[$idx] = $SECT)
								goto :NEXT
							end
							add $idx 1
						end
					else
						goto :NEXT
					end
					add $adj 1
				end
				getNearestWarps $LOOKUP $SECT
				gosub :SLEEP
				setVar $nde 1
				while ($nde <= $LOOKUP)
					setVar $NDE_ADJ $lookup[$nde]
					if (sector.warpcount[$NDE_ADJ] = 1)
						setVar $FROM $SECT
						setVar $TO $NDE_ADJ
						gosub :_GET_
						if ($DIST < $NEAREST_DE)
							goto :Next
						else
							goto :CONTINUE
						end
					end
					add $nde 1
				end
				:CONTINUE
				Echo "*"&$TAGLINE&"Sect"&ANSI_14&": " &ANSI_7& $SECT & ANSI_15 & ", "
				Echo ANSI_15 & "Freq"&ANSI_14&": " &ANSI_7& $TMP & ANSI_15& ", "
				Echo ANSI_15 & "Dist"&ANSI_14&": " &ANSI_7& $Dist1 &ANSI_15& "/" &ANSI_7& $Dist2 &ANSI_15& " (T/D), "
				Echo ANSI_15 & "Near DE" & ANSI_14 & ": " & ANSI_7 & $TO & ANSI_15 & " (hops " & ANSI_7 & $DIST & ANSI_15 & ")"
				:Next
			end
		end
		:_Next_Filter_
   	add $i 1
	end
	Echo "*" & $TAGLINE & "---------------------------------------------------------"
	Echo "*" & $TAGLINE & $FILTER_MSG
	Echo "*" & $TAGLINE
halt

:SLEEP
	setdelaytrigger SLEEPER	:SLEEPER 100
	pause
	:SLEEPER
	return
:_GET_
getDistance $Dist $FROM $TO
if ($Dist = "-1")
	send "^F" & $FROM & "*" & $TO & "**q"
	waiton ": ENDINTERROG"
	getDistance $$DIST $FROM $TO
	if ($Dist = "-1")
		Echo "**Unable To Get Distance From "&$FROM&" to " & $TO &"**"
		halt
	end
end
return

:PAD
setVar $PAD_idx 1
setVar $PAD ""
getLength $NUM $LENGTH
while ($PAD_idx <= (5 - $LENGTH))
	setVar $PAD ($PAD & " ")
	add $PAD_idx 1
end
return

:ANALYIZE
	setVar $idx 1
	setVar $DIV 0
	setVar $AVG 0
	setVar $HIGH 0
	setVar $LOW 10000
	setVar $AVG_1 0
	setVar $AVG_1_div 0
	setVar $AVG_2 0
	setVar $AVG_2_div 0
	setVar $AVG_3 0
	setVar $AVG_3_div 0
	setVar $AVG_4 0
	setVar $AVG_4_div 0
	setVar $AVG_5 0
	setVar $AVG_5_div 0
	setVar $AVG_6 0
	setVar $AVG_6_div 0

  	Echo #27 & "[2J"
	Echo "**"
	Echo "*"&$TAGLINE
	Echo "*"&$TAGLINE&"Analyzing Traffic Frequencies...."

	while ($idx <= $TRAFFIC)
		getWord $TRAFFIC[$idx] $SECT 1
		getWord $TRAFFIC[$idx] $TMP 2
		if ($TMP > $HIGH)
			setVar $HIGH $TMP
		end
		if ($TMP < $LOW) and ((Sector.warpcount[$sect] > 1) and (Sector.warpincount[$sect] > 1))
			setVar $LOW $TMP
		end
		setVar $WCOUNT SECTOR.WARPCOUNT[$SECT]
		if ($WCOUNT = 1)
			add $AVG_1 $TMP
			add $AVG_1_div 1
		end
		if ($WCOUNT = 2)
			add $AVG_2 $TMP
			add $AVG_2_div 1
		end
		if ($WCOUNT = 3)
			add $AVG_3 $TMP
			add $AVG_3_div 1
		end
		if ($WCOUNT = 4)
			add $AVG_4 $TMP
			add $AVG_4_div 1
		end
		if ($WCOUNT = 5)
			add $AVG_5 $TMP
			add $AVG_5_div 1
		end
		if ($WCOUNT = 6)
			add $AVG_6 $TMP
			add $AVG_6_div 1
		end
		add $AVG $TMP
		add $DIV 1
		add $IDX 1
	end
	setvar $AVG ($AVG / $DIV)
	Echo "*" & $TAGLINE & " " & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196
	Echo "*             Total Average"&ANSI_14&" : " &ANSI_7& $AVG
	Echo "*             Hig/Low      "&ANSI_14&" : " &ANSI_7& $HIGH & ANSI_15 & "/" & ANSI_7 & $LOW
	Echo "*             Warp Averages"
	setVar $NUM $AVG_1_div
	gosub :PAD
	Echo "*              "&$PAD&$AVG_1_div&" 1Way  "&ANSI_14&" : " &ANSI_7& ($AVG_1 / $AVG_1_div)
	setVar $NUM $AVG_2_div
	gosub :PAD
	Echo "*              "&$PAD&$AVG_2_div&" 2Way  "&ANSI_14&" : " &ANSI_7& ($AVG_2 / $AVG_2_div)
	setVar $NUM $AVG_3_div
	gosub :PAD
	Echo "*              "&$PAD&$AVG_3_div&" 3Way  "&ANSI_14&" : " &ANSI_7& ($AVG_3 / $AVG_3_div)
	setVar $NUM $AVG_4_div
	gosub :PAD
	Echo "*              "&$PAD&$AVG_4_div&" 4Way  "&ANSI_14&" : " &ANSI_7& ($AVG_4 / $AVG_4_div)
	setVar $NUM $AVG_5_div
	gosub :PAD
	Echo "*              "&$PAD&$AVG_5_div&" 5Way  "&ANSI_14&" : " &ANSI_7& ($AVG_5 / $AVG_5_div)
	setVar $NUM $AVG_6_div
	gosub :PAD
	Echo "*              "&$PAD&$AVG_6_div&" 6Way  "&ANSI_14&" : " &ANSI_7& ($AVG_6 / $AVG_6_div)
	Echo "*"&$TAGLINE
	return
	
:_HELP_
Echo "*"
Echo "*"&$TAGLINE&#196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196& #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196
Echo "*"&$TAGLINE&"LSTraffic is a companion to LS_ZTM. This script reads the Traffic file"
Echo "*"&$TAGLINE&"generated by LS_ZTM and bases its results on data found"
Echo "*"&$TAGLINE&"in the file: "&ANSI_14 &$TRAFFIC_FILE
Echo "*"&$TAGLINE
Echo "*"&$TAGLINE&"For best  results it  is  important  to  let LSZTM run  uninterrupted,"
Echo "*"&$TAGLINE&"LSTraffic will not work with a partial Traffic Report."
Echo "*"&$TAGLINE
Echo "*"&$TAGLINE&"The Basic Traffic Report counts  the number of times any given sector"
Echo "*"&$TAGLINE&"is within a course plot,  this is its 'Frequency'.  If a Sector has a"
Echo "*"&$TAGLINE&"frequency  of  411,  then  you  can  say  that Sector has a very high"
Echo "*"&$TAGLINE&"potential  of someone moving through it.  Conversely.  A frequency of"
Echo "*"&$TAGLINE&"5  (not being a DeadEnd),  is a good indicator that no one will visit"
Echo "*"&$TAGLINE&"that Sector by 'accident'. The Menu settings can be adjusted to allow"
Echo "*"&$TAGLINE&"for best results.  Bare in mind that every Universe is different form"
Echo "*"&$TAGLINE&"another and  careful attention  should be  given to the actual number"
Echo "*"&$TAGLINE&"of Warps that make up your Universe!"
Echo "*"&$TAGLINE
Echo "*"&$TAGLINE&"Menu Options:"
Echo "*"&$TAGLINE&ANSI_14&"Range "&ANSI_15&"- "&ANSI_7&"Minimum  distance from Terra and StarDock.  The  Course  plot"
Echo "*"&$TAGLINE&"      from  the Class  Zeros to  the Target  Sector will  be mutually"
Echo "*"&$TAGLINE&"      exclusive."
Echo "*"&$TAGLINE&ANSI_14&"Max Frequency "&ANSI_15&"- "&ANSI_7&"Simply indicates  that you want to specifically limit"
Echo "*"&$TAGLINE&"      results based on the Traffic Report."
Echo "*"&$TAGLINE&ANSI_14&"Warp Count "&ANSI_15&"- "&ANSI_7&"Typically 2 and 3 Warp  sectors  yeild the best results."
Echo "*"&$TAGLINE&"      Everything  being contextual,  you  wouldn't  normally  want to"
Echo "*"&$TAGLINE&"      look for DeadEnds with a Frequency of any value, because they"
Echo "*"&$TAGLINE&"      will always have very low Frequencies."
Echo "*"&$TAGLINE&ANSI_14&"Nearest Dead End "&ANSI_15&"- "&ANSI_7&"This setting  will ensure  that your  results are,"
Echo "*"&$TAGLINE&"      as much as possible, far from an obvious 'Base'. Since gridders"
Echo "*"&$TAGLINE&"      usually hunt in  DeadEnds you should consider finding place  to"
Echo "*"&$TAGLINE&"      hide that's 'out of the way'"
Echo "*"&$TAGLINE&#196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196& #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196
return
