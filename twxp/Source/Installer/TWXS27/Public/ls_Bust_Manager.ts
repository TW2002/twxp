    #=--------                                                                     -------=#
     #=---------------------     LoneStar's Bust Manager I/O    -------------------------=#
    #=--------                                                                     -------=#
	#		Incep Date	:	Jun 15, 2008 - Version 1.00
	#		Author		:	LoneStar
	#		TWX			:	Should Work with all Versions
	#
	#		To Run		:	N/A
	#
	#		Fixes       :   Initial Relase
	#
	#		Description	:	Exports BUSTED SectorParams to TWX SSM file, or
	#						can Import to SectorParameters
	#
	#

goto :_START_
:STATS
	setvar $BUSTS_TWX 0
	setVar $BUSTS_SEC 0
	fileExists $tst $TWX_SSM_Bust_File
	if ($tst)
		readToArray $TWX_SSM_Bust_File $BUSTS
		setVar $i 1
		while ($i <= $BUSTS)
			add $BUSTS_TWX 1
			add $i 1
		end
	end
	setVar $i 11
	while ($i <= SECTORS)
		getSectorParameter $i "BUSTED" $Flag
		isNumber $tst $Flag
		if ($tst)
			if ($Flag <> 0)
				add $BUSTS_SEC 1
			end
		end
		add $i 1
	end
	return
:Import_Busts
	Echo "*" & $TAG & ANSI_15 "Reading File    : " & ANSI_14 & $TWX_SSM_Bust_File
	Echo "*" & $TAG
	fileExists $tst $TWX_SSM_Bust_File
	if ($tst)
		readToArray $TWX_SSM_Bust_File $BUSTS
		setVar $i 1
		setVar $Count 0
		while ($i <= $BUSTS)
			isNumber $tst $BUSTS[$i]
			if ($tst)
				setSectorParameter $BUSTS[$i] "BUSTED" TRUE
				add $Count 1
			end
			add $i 1
		end
	else
		Echo "*" & $TAG & ANSI_12 & "File Not Found"
		Echo "*" & $TAG
		halt
	end
	Echo "**"
	Echo "*" & $TAG & ANSI_15 & "Busts Imported: " &ANSI_14& $Count & "**"
	halt
:Export_Busts
	echo "*" & $TAG & ANSI_15 & "Exporting Sector Parameters"
	setVar $Count 0
	setVar $Fail 0
	delete $TWX_SSM_BUST_File
	echo "*" & $TAG
	setVar $i 11
	while ($i <= SECTORS)
		getSectorParameter $i "BUSTED" $Flag
		isNumber $tst $Flag
		if ($tst)
			if ($Flag <> 0)
				write $TWX_SSM_Bust_File $i
				add $Count 1
			end
		else
			setSectorParameter $i "BUSTED" FALSE
			add $Fail 1
		end
		add $i 1
	end
	Echo "*" & $TAG & ANSI_15 "Busts Exported: " & ANSI_14 & $Count
	if ($Fail <> 0)
		Echo "*" & $TAG & ANSI_15 "Export Failure: " & ANSI_14 & $Fail
	end
	Echo "*" & $TAG & ANSI_15 "To File       : " & ANSI_14 & $TWX_SSM_Bust_File & "**"
	halt

:Clear_SectorParameters
	echo "*" & $TAG & ANSI_15 & "Clearing Sector Parameters..."
	setVar $i 11
	while ($i <= SECTORS)
		setSectorParameter $i "BUSTED" FALSE
		add $i 1
	end
	Echo "*" & $TAG
	halt

:_START_
	setVar $TAG (ANSI_9 & "["&ANSI_14&"BUST i/o"&ANSI_9&"] " & ANSI_15)
	setVar $TWX_SSM_Bust_File	(GAMENAME & "_busts.txt")
	gosub :STATS
	:_START_NOSTAT
	Echo "***"
	Echo "*" & $TAG & ANSI_15 & "   LoneStar's Bust I/O Manager"
	Echo "*" & $TAG & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196
	Echo "*" & $TAG & ANSI_8 & "E"&ANSI_15&"xport Busts (" & ANSI_7 & $BUSTS_SEC & " Busts Found" & ANSI_15 & ")"
	Echo "*" & $TAG & ANSI_8 & "I"&ANSI_15&"mport Busts (" & ANSI_7 & $BUSTS_TWX & " Busts Found" & ANSI_15 & ")"
	Echo "*" & $TAG
	Echo "*" & $TAG & ANSI_8 & "C"&ANSI_15&"lear SectorParameters"
	Echo "*" & $TAG & ANSI_8 & "D"&ANSI_15&"elete TWX File (" & ANSI_7 & $TWX_SSM_Bust_File & ANSI_15 & ")"
	Echo "*" & $TAG & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196
	Echo "*" & $TAG & ANSI_8 & "Q"&ANSI_15&"uit"
	Echo "**"
	:_START_AGAIN
	getConsoleInput $s SINGLEKEY
	uppercase $s
	if ($s = "Q")
		Echo "*" & $TAG
		Echo "*" & $TAG & ANSI_12 & "Script Halted"
		Echo "*" & $TAG
		halt
	elseif ($s = "C")
		Echo "*" & $TAG & ANSI_15 & "Clearing BUSTED Sector Parameter. Are You Sure (Y/N)?"
		Echo "*" & $TAG
		getConsoleInput $s SINGLEKEY
		uppercase $s
		if ($s = "Y")
			gosub :Clear_SectorParameters
		elseif ($s = "N")
			goto :_START_NOSTAT
		else
			halt
		end
	elseif ($s = "I")
		gosub :Import_Busts
	elseif ($s = "E")
		gosub :Export_Busts
	elseif ($s = "D")
		Echo "*" & $TAG & ANSI_15 & "Deleting TWX Bust File. Are You Sure (Y/N)?"
		Echo "*" & $TAG
		getConsoleInput $s SINGLEKEY
		uppercase $s
		if ($s = "Y")
			echo "*" & $TAG & ANSI_15 & "Deleting File: " & $TWX_SSM_Bust_File
			delete $TWX_SSM_Bust_File
			Echo "*" & $TAG
			halt
		elseif ($s = "N")
			goto :_START_NOSTAT
		else
			halt
		end
	else
		goto :_START_AGAIN
	end
	goto :_START_


