    #=--------                                                                     -------=#
     #=---------------------     LoneStar's MCIC Eqip Filter    -------------------------=#
    #=--------                                                                     -------=#
	#		Incep Date	:	Jun 10, 2008 - Version 1.00
	#		Author		:	LoneStar
	#		TWX			:	Should Work with all Versions
	#
	#		To Run		:	N/A
	#
	#		Fixes       :   Initial Relase
	#
	#		Description	:	Reads Various Script output files to filter out MCIC ranges
	#						for Equipment Buyers Only. So far only E.P's script appears to
	#						output a 'complete' list of MCIC data which includes Seller-Port
	#						data.
	#

#$CKt and $CKp indicate Cherokee's Haggle Tracker, and Planet Nego respectively.
setVar $TagLineB		(ANSI_9&"["&ANSI_14&"LSMCIC"&ANSI_9&"]")
setVar $MOM 			GAMENAME & ".nego"
setVar $CKt 			"_ck_" & GAMENAME & ".ports"
setVar $CKp 			"_ck_" & GAMENAME & ".nego"
setVar $EPs 			GAMENAME & "-MCIC.csv"
setVar $UPPER 	65
setVar $LOWER 	50
setVar $Results 0
setVar $Total	0
setArray $P 	SECTORS

:MEN_TOP
Echo "***"
Echo ANSI_15 & "     LoneStar's "&ANSI_8&"Equipment "&ANSI_14&"MCIC"&ANSI_8&" Filter*"
Echo (" " & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 &#196  & #196   & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
Echo "*"&ANSI_14&" File Scan:"
Echo ANSI_12 & "*            1 "&ANSI_15&"-"&ANSI_9&" M"&ANSI_15&"()"&ANSI_9&"M Planetary Nego"
Echo ANSI_12 & "*            2 "&ANSI_15&"-"&ANSI_9&" Cherokee's Planetary Nego"
Echo ANSI_12 & "*            3 "&ANSI_15&"-"&ANSI_9&" Cherokee's Eqipment Haggle Tracker"
Echo ANSI_12 & "*            4 "&ANSI_15&"-"&ANSI_9&" Elder Prophet's CSV"
Echo ANSI_12 & "*            A "&ANSI_15&"-"&ANSI_9&" All Of The Above"
Echo "*"
Echo ANSI_12 & "*            U "&ANSI_15&"-"&ANSI_9&" Upper Limit  " & ANSI_15 & $UPPER
Echo ANSI_12 & "*            L "&ANSI_15&"-"&ANSI_9&" Lower Limit  " & ANSI_15 & $LOWER
Echo "*"
Echo ANSI_14 & "*            Q"&ANSI_15&" Quit"
Echo ANSI_12 & "* "
:Again
getConsoleInput $s SINGLEKEY
uppercase $s

if ($S = "Q")
	Echo "**"
	Echo ANSI_4 & "SCRIPT HALTED"
	Echo "*"
	halt
elseif ($S = "U")
	getInput $s	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Filter MCIC Values Greater Than?"
	isNumber $tst $s
	if ($tst)
		if ($s > 65)
			setVar $s 65
		end
		if ($s < $LOWER)
			setVar $s $LOWER
		end
	else
		setVar $s 65
	end
	setVar $UPPER $s
	goto :MEN_TOP
elseif ($S = "L")
	getInput $s	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Filter MCIC Values Lower Than?"
	isNumber $tst $s
	if ($tst)
		if ($s < 10)
			setVar $s 10
		end
		if ($s > $UPPER)
			setVar $s $UPPER
		end
	else
		setVar $s 10
	end
	setVar $LOWER $s
	goto :MEN_TOP
elseif ($S = "1")
	Echo "*"
	gosub :READ_MOM
elseif ($S = "2")
	Echo "*"
	gosub :READ_CKp
elseif ($S = "3")
	Echo "*"
	gosub :READ_CKt
elseif ($S = "4")
	Echo "*"
	gosub :READ_EP
elseif ($S = "A")
	echo #27 & "[1A" & #27 & "[K" & "*                                                           *"
	gosub :READ_MOM
	gosub :READ_CKp
	gosub :READ_CKt
	gosub :READ_EP
else
	Echo "*" & ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_5
	goto :Again
end
Echo "*"
Echo ($TagLineB & " " & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196  & #196  & #196  & #196  & #196  & #196 & #196  & #196  & #196   & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
setVar $idx 1
while ($idx <= sectors)
	if ($P[$idx] >= $LOWER) AND ($P[$idx] <= $UPPER)
		Echo "*" & $TagLineB
		setVar $Sect $idx
		gosub :PAD_SECTOR
		Echo ANSI_7 & " Sector " & ANSI_14 & $Sect & ANSI_15 & "," &ANSI_7& " MCIC -" &ANSI_15& $P[$idx] & " "
		gosub :CLASS_SPITTER
		if (CURRENTSECTOR <> $idx)
			getDistance $Dist CURRENTSECTOR $idx
		else
			setVar $Dist "0"
		end
		setVar $Sect $Dist
		gosub :PAD_ELSE
		Echo ANSI_14 & $Sect & " hops"&ANSI_15&","
		setVar $Sect SECTOR.WARPCOUNT[$idx]
		gosub :PAD_ELSE
		Echo ANSI_12 & $Sect & " Warps"
		getSectorParameter $idx "FIGSEC" $F
		isNumber $tst $F
		if ($TST)
			if ($F <> 0)
				Echo ANSI_15 & ", " & ANSI_10 & "Figd"
			end
		end
		add $Results 1
	end
	if ($P[$idx] <> 0)
		add $Total 1
	end
	add $idx 1
end
Echo "*"
Echo ($TagLineB & " " & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196  & #196  & #196  & #196  & #196  & #196 & #196  & #196  & #196   & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
Echo "*" & $TagLineB & ANSI_15 & " Matches      : " & ANSI_7 & $Results & ANSI_9 & "  ("&ANSI_6&"Values between "&ANSI_7&"-"&$LOWER&ANSI_8&"/-65"&ANSI_6&" and "&ANSI_7&"-"&$UPPER&ANSI_8&"/-65"&ANSI_9&")"
Echo "*" & $TagLineB & ANSI_15 & " Filtered     : " & ANSI_7 & ($TOTAL - $Results)
Echo "*" & $TagLineB & ANSI_15 & " Total Scanned: " & ANSI_7 & $TOTAL
goto :MEN_TOP


:READ_MOM
fileExists $tst $MOM
if ($tst)
	Echo "*" & $TagLineB & ANSI_15 & " Reading "&ANSI_7&"M()M File            : " & ANSI_14 & $MOM
	readtoArray $MOM $Ports
	setVar $idx 1
	while ($idx <= $Ports)
		setvar $s $Ports[$idx]
		getWordPos $s $pos "Sector"
		if  ($pos <> 0)
			getWord $s $sect 2
		end
		getWordPos $s $pos "equ for"
		if ($pos <> 0) AND ($sect <> 0)
			getWord $s $s 13
			stripText $s "/-65"
			stripText $s "-"
			setVar $P[$sect] $s
		end
		add $idx 1
	end
else
	Echo "*" & $TagLineB & ANSI_15 & " M()M File Not Found          : " & ANSI_14 & $MOM
end
return
:READ_CKp
fileExists $tst $CKp
if ($tst)
	Echo "*" & $TagLineB & ANSI_15 & " Reading "&ANSI_7&"ck's Planet NEGO     : " & ANSI_14 & $CKp
	readtoArray $CKp $Ports
	setVar $idx 1
	while ($idx <= $Ports)
		setvar $s $Ports[$idx]
		getWordPos $s $pos "Sector"
		if  ($pos <> 0)
			getWord $s $sect 2
		end
		getWordPos $s $pos "equ for"
		if ($pos <> 0) AND ($sect <> 0)
			getWord $s $s 13
			stripText $s "/-65"
			stripText $s "-"
			setVar $P[$sect] $s
		end
		add $idx 1
	end
else
	Echo "*" & $TagLineB & ANSI_15 & " ck's Planet NEGO Not Found   : " & ANSI_14 & $CKp
end
return
:READ_CKt
fileExists $tst $CKt
if ($tst)
	Echo "*" & $TagLineB & ANSI_15 & " Reading "&ANSI_7&"ck's Haggle Tracker  : " & ANSI_14 & $CKt
	readtoArray $CKt $Ports
	setVar $idx 1
	while ($idx <= $Ports)
		setVar $s $Ports[$idx]
		getWord $s $sect 2
		isNumber $tst $sect
		if ($tst)
			if ($sect <> 0)
				getWord $s $s 10
				stripText $s "-"
				setVar $P[$sect] $s
			end
		end
		add $idx 1
	end
else
	Echo "*" & $TagLineB & ANSI_15 & " ck's Haggle Tracker Not Found: " & ANSI_14 & $CKt
end
return
:READ_EP
fileExists $tst $EPs
if ($tst)
	Echo "*" & $TagLineB & ANSI_15 & " Reading "&ANSI_7&"EP's CSV             : " & ANSI_14 & $EPs
	readtoArray $EPs $Ports
	setVar $idx 1
	while ($idx <= $Ports)
		setVar $s $Ports[$idx]
		replaceText $s "," " "
		replaceText $s "." " "
		getWordPos $s $pos "EQUIPMENT"
		if ($pos <> 0)
			getword $s $Sect 1
			isNumber $tst $Sect
			if ($tst)
				getWord $s $s 5
				stripText $s "-"
				setVar $P[$sect] $s
			end
		end
		add $idx 1
	end
else
	Echo "*" & $TagLineB & ANSI_15 & " EP's CSV Not Found           : " & ANSI_14 & $EPs
end
return

:PAD_SECTOR
getLength $sect $len
if ($len = 1)
	setVar $SECT ("    " & $SECT)
elseif ($len = 2)
	setVar $SECT ("   " & $SECT)
elseif ($len = 3)
	setVar $SECT ("  " & $SECT)
elseif ($len = 4)
	setVar $SECT (" " & $SECT)
else
end
return
:PAD_ELSE
getLength $sect $len
if ($len = 1)
	setVar $SECT ("  " & $SECT)
elseif ($len = 2)
	setVar $SECT (" " & $SECT)
else
end
return

:CLASS_SPITTER
setVar $s "("
Echo ANSI_1 & " ("
if (PORT.CLASS[$idx] = 0)
	Echo ANSI_15 & "Speacial"
elseif (PORT.CLASS[$idx] = "-1")
	Echo ANSI_4 & "N/A"
else
	if (PORT.BUYFUEL[$idx])
		Echo ANSI_6 & "B"
	else
		Echo ANSI_15 & "S"
	end
	if (PORT.BUYORG[$idx])
		Echo ANSI_6 & "B"
	else
		Echo ANSI_15 & "S"
	end
	if (PORT.BUYEQUIP[$idx])
		Echo ANSI_6 & "B"
	else
		Echo ANSI_15 & "S"
	end
end
Echo ANSI_1 & ")"
return
