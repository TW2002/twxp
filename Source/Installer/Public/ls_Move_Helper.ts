setVar $TAGLINE  		(ANSI_9 & "["&ANSI_14&"LSMOVER"&ANSI_9&"] " & ANSI_15)
setVar $TRAFFIC_FILE "LSZTM_" & GAMENAME & "_Traffic.txt"
setVar $TRAFFIC_LOADED FALSE
fileExists $tst $TRAFFIC_FILE

setvar $course 0
setvar $course_ptr 0
setvar $course_next 0
setVar $course_hops 0
if ($TST)
	readtoarray $TRAFFIC_FILE $TRAFFIC
	if ($TRAFFIC = SECTORS)
		setVar $TRAFFIC_LOADED TRUE
	end
end

Echo "**"
Echo "*" & "  " & $TAGLINE & "                                                    " & $TAGLINE
Echo "*" & $TAGLINE & ANSI_1&"          [["&ANSI_9&"["&ANSI_15&"LoneStar's Move Helper Loaded"&ANSI_1&"]"&ANSI_9&"]"&ANSI_1&"]]          " & $TAGLINE
Echo "*" & "  " & $TAGLINE & "                                                    " & $TAGLINE
Echo "*                    Press '@' To Use Course-Lock Feature"
Echo "*"
send "/"
waiton "(?=Help)? :"
goto :MOVED

:_TOP_
if ($sect = $DESTINATION) and ($DESTINATION <> 0) and ($course_next <> 0)
	setvar $course "0"
	setvar $course_ptr 0
	setVar $course_next 0
	setVar $course_hops 0
	setVar $course_idx 0
	setVar $course_flag FALSE
end

setTextTrigger			MOVED	:MOVED	"(?=Help)? :"
setTextLineTrigger	AUTO	:AUTO		"Auto Warping to sector"
setTextLineTrigger	SCAN	:SCAN		"(Q)uit? [D] D"
setTextOutTrigger		PLOT	:PLOT		"@"

pause

:PLOT
killallTriggers
Echo "**"&$TAGLINE&"Destination Please?*"
getConsoleInput $DESTINATION
isnumber $tst $DESTINATION
if ($tst = 0)
	setvar $DESTINATION 0
end
if ($DESTINATION > SECTORS)
	setVar $DESTINATION 0
elseif ($DESTINATION < 1)
	setVar $DESTINATION 0
elseif ($DESTINATION = $SECT)
	setVar $DESTINATION 0
end

if ($DESTINATION <> 0)
	gosub :Build_Course
	setvar $course_ptr 2
	setVar $course_next $course[$course_ptr]
else
	setvar $course 0
	setvar $course_ptr 0
	setVar $course_next 0
	setVar $course_hops 0
end
goto :_TOP_

:AUTO
killAllTriggers
getWord CURRENTLINE $SECT 5
setVar $OFFSET 56
setVar $SECTLEN 0
gosub :BUILD
goto :_TOP_
:MOVED
killallTriggers
getText CURRENTLINE $SECT "]:[" "] (?="
stripText $SECT " "
getlength $SECT $SECTLEN
setVar $OFFSET 37
gosub :BUILD
goto :_TOP_

:SCAN
killalltriggers
if ($SECT <> "0")
	Echo "*" & #27 & "[" & $LINES & "A"
	Echo $BLANK&"**" & #27 & "["&($SECTLEN + $OFFSET)&"C"
	if ($TRAFFIC_LOADED)
		getlength $SECT $SECTLEN
      getWord $TRAFFIC[$SECT] $TMP 2
   	#Echo #27 & "["&($SECTLEN+11)&"C" & ANSI_3 & $TMP & ANSI_9 & ": " & ANSI_15
   	Echo #27 & "[1D" & ANSI_3 & $TMP & ANSI_9 & ": " & ANSI_15
	end
end

if ($course_next <> 0)
	Echo "*" & $TAGLINE & "Course Locked " & ansi_5 & "SECTOR:" & $DESTINATION
	Echo Ansi_12 & " (" & ANSI_7 & $course_hops & " hops"&ANSI_12&") " & ANSI_9 & ":"
	if ($course_next = $DESTINATION)
		Echo #27 & "[33;5m" & $course_next & #27 & "[33;0m" & ANSI_9 & ": " & ANSI_15
	else
		Echo ansi_15 & $course_next & ANSI_9 & ": " & ANSI_15
	end
end

goto :_TOP_

:BUILD
setvar $LINES (SECTOR.WARPCOUNT[$SECT]+3)
Setvar $i 1
setVar $BLANK ""

while (Sector.warps[$SECT][$i] <> 0)
	setVar $ADJ SECTOR.WARPS[$SECT][$i]
	setVar $BLANK ($BLANK & "*" & ANSI_15 & #27 & "[18C")
	getsectorparameter $ADJ "FIGSEC" $FIG
	isnumber $tst $FIG
	if ($tst = 0)
		setVar $FIG 0
		setSectorParameter $ADJ "FIGSEC" FALSE
	end
	getsectorparameter $ADJ "LIMPSEC" $LIMP
	isnumber $tst $LIMP
	if ($tst = 0)
		setVar $LIMP 0
		setSectorParameter $ADJ "LIMPSEC" FALSE
	end
	getsectorparameter $ADJ "MINESEC" $MINE
	isnumber $tst $MINE
	if ($tst = 0)
		setVar $MINE 0
		setSectorParameter $ADJ "MINESEC" FALSE
	end
	getSectorParameter $ADJ "BUSTED" $BUST
	isnumber $tst $BUST
	if ($tst = 0)
		setVar $BUST 0
		setSectorParameter $ADJ "BUSTED" FALSE
	end
	if ($FIG <> "0") AND ($FIG <> "")
		setVar $BLANK ($BLANK & "F")
	else
		setVar $BLANK ($BLANK & " ")
	end
	if ($LIMP <> "0") AND ($LIMP <> "")
		setVar $BLANK ($BLANK & "L")
	else
		setVar $BLANK ($BLANK & " ")
	end
	if ($MINE <> "0") AND ($MINE <> "")
		setVar $BLANK ($BLANK & "A")
	else
		setVar $BLANK ($BLANK & " ")
	end

	if (PORT.EXISTS[$ADJ])
		if ($BUST <> 0)
			setVar $BLANK ($BLANK & ANSI_4)
		else
			setVar $BLANK ($BLANK & ANSI_6)
		end
		if (PORT.CLASS[$ADJ] = 1)
			setVar $BLANK ($BLANK & "BBS")
		elseif (PORT.CLASS[$ADJ] = 2)
			setVar $BLANK ($BLANK & "BSB")
		elseif (PORT.CLASS[$ADJ] = 3)
			setVar $BLANK ($BLANK & "SBB")
		elseif (PORT.CLASS[$ADJ] = 4)
			setVar $BLANK ($BLANK & "SSB")
		elseif (PORT.CLASS[$ADJ] = 5)
			setVar $BLANK ($BLANK & "SBS")
		elseif (PORT.CLASS[$ADJ] = 6)
			setVar $BLANK ($BLANK & "BSS")
		elseif (PORT.CLASS[$ADJ] = 7)
			setVar $BLANK ($BLANK & "SSS")
		elseif (PORT.CLASS[$ADJ] = 8)
			setVar $BLANK ($BLANK & "BBB")
		else
			if ($ADJ = STARDOCK)
				setVar $BLANK ($BLANK & ANSI_14 & "DOC")
			elseif ($ADJ = RYLOS)
				setVar $BLANK ($BLANK & ANSI_14 & "RYL")
			elseif ($ADJ = ALPHACENTAURI)
				setVar $BLANK ($BLANK & ANSI_14 & "ALP")
			elseif ($ADJ = "1")
				setVar $BLANK ($BLANK & ANSI_14 & "SOL")
			else
				setVar $BLANK ($BLANK & "N/A")
			end
		end
	else
		setVar $BLANK ($BLANK & "   ")
	end

	if ($TRAFFIC_LOADED)
		setvar $TRAFF_OFFSET 26
      getWord $TRAFFIC[$ADJ] $TMP 2
      getlength $TMP $LEN
      # using OFFSET and BUFFER to help mask over the 'Nav' in NavHaz
		if ($LEN = 1)
			setvar $buffer "   "
			subtract $TRAFF_OFFSET 2
		elseif ($LEN = 2)
			setvar $buffer "  "
			subtract $TRAFF_OFFSET 1
		elseif ($LEN = 3)
			setVar $buffer " "
		end
   	setvar $BLANK ($BLANK&#27&"["&($TRAFF_OFFSET-$LEN)&"C"&$buffer&ANSI_3&$TMP)
	end
	add $i 1
end

if ($course_ptr <> 0) and ($DESTINATION <> 0)
	setVar $course_idx 1
	setVar $course_FLAG FALSE
	while ($course_idx <= $course)
		if ($course[$course_idx] = $SECT)
			setVar $course_FLAG TRUE
		end
     	add $course_idx 1
	end

	if ($course_FLAG = FALSE)
		gosub :Build_Course
		setvar $course_ptr 2
		setVar $course_next $course[$course_ptr]
	end

	if ($course_next = $SECT)
		add $course_ptr 1
		getDistance $course_hops $SECT $DESTINATION
		setVar $course_next $course[$course_ptr]
	end
end
return

:Build_Course
	if (($SECT <> 0) and ($DESTINATION <> 0)) and ($DESTINATION <> $SECT)
		getcourse $course $SECT $DESTINATION
		setVar $course_hops $course
		if ($course = "-1")
			send "^f" & $SECT & "*"&$DESTINATION&"**q"
			waiton ": ENDINTERROG"
			getcourse $course $SECT $DESTINATION
			getDistance $course_hops $SECT $DESTINATION
			if ($course = "-1")
				Echo "*" & $TAGLINE & "Unable to plot a course**"
				setvar $course 0
				setVar $course_hops 0
				setvar $course_ptr 0
				setVar $course_next 0
				return
			end
		end
		Echo "*" & $TAGLINE & "Course Plotted: " & ansi_5 & $SECT & Ansi_15 & " to " & ansi_5 & $DESTINATION
		Echo Ansi_15 & " (" & $course_hops & " hops)*"
	end
	return
#          1         2         3         4         5         6         7
# 12345678901234567890123456789012345678901234567890123456789012345678901234567890
# Stop in this sector (Y,N,E,I,R,S,D,P,?) (?=Help) [N] ?
# Command [TL=00:00:00]:[1] (?=Help)? :
# Sector  13536  ==>             17  Warps : 3    NavHaz :   100%    Anom : Yes
#                   FLASSS

#	Escape Code What it does
#		#27 "[#A" moves cursor up # lines
#		#27 "[#B" moves cursor down # lines
#		#27 "[#C" moves cursor right # spaces
#		#27 "[#D" moves cursor left # spaces
#		#27 "[2J" clear screen and home cursor
#		#27 "[K" clear to end of line
