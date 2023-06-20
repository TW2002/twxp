    #=--------                                                                       -------=#
     #=--------------------------     LoneStar's WARPSPEC     -----------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	May 1, 2008 - Version 1.0
	#		Author		:	LoneStar
	#		TWX			:	TWX 2.04b or TWX 2.04 Final
	#
	#		Credits		:	All Original LoneStar Classic.. blah blah blah
	#
	#		To Run		:   Should update Warp & Port CIM Data in TWX
	#
	#		Fixes       :	Initial Release
	#
	#		Description	:	WarpSpec Exporter For TWX.
	#
	#						Will export warpspec for SWATH along with PORT data
	#						if desired.
	#
goto :_START_
:FILE_WRITE_SWA
	getLength $LINE $LEN
	add $FileSize_SWA ($LEN + 2)
	add $FileLine_SWA 1
	write $FName_SWA $LINE
	return
:FILE_WRITE_TWX
	getLength $LINE $LEN
	add $FileSize_TWX ($LEN + 2)
	add $FileLine_TWX 1
	write $FName_TWX $LINE
	return
:LETS_BOOGIE
	setVar $IDX 1
    if ($PORT)
		Echo "*" & $TAG & ANSI_15 & "Formatting WarpSpec & Port Data"
    else
	    Echo "*" & $TAG & ANSI_15 & "Formatting WarpSpec Data"
	end

	while ($IDX <= SECTORS)
		if (SECTOR.WARPCOUNT[$IDX] <> 0)
			add $WARP_COUNT SECTOR.WARPCOUNT[$IDX]
			setVar $Focus $IDX
			if ($SWATH)
				gosub :PAD
				setVar $SECT_SWATH[$IDX] ($PAD & $Focus)
			end
			if ($TWX)
				gosub :PAD
				setVar $SECT_TWX[$IDX] $Focus
			end
			setVar $i 1
			while ($i <= SECTOR.WARPS[$IDX][$i])
				setVar $Focus SECTOR.WARPS[$IDX][$i]
				if ($Focus <> 0)
					if ($SWATH)
						gosub :PAD
						setVar $SECT_SWATH[$IDX] ($SECT_SWATH[$IDX] & " " & $PAD & $Focus)
					end
					if ($TWX)
						setVar $SECT_TWX[$IDX] ($SECT_TWX[$IDX] & $PAD & " " & $Focus)
						gosub :PAD
					end
                end
              	add $i 1
			end
		end
		if ($PORT)
			if (PORT.EXISTS[$IDX])
				if (PORT.CLASS[$IDX] <> 9)
					if (PORT.FUEL[$IDX] <> 0) AND (PORT.ORG[$IDX] <> 0) AND (PORT.EQUIP[$IDX] <> 0)
						if (PORT.CLASS[$IDX] = 1)
							# BBS
							setVar $F "-"
							setVar $O "-"
							setVar $E " "
						elseif (PORT.CLASS[$IDX] = 2)
							#BSB
							setVar $F "-"
							setVar $O " "
							setVar $E "-"
						elseif (PORT.CLASS[$IDX] = 3)
							#SBB
							setVar $F " "
							setVar $O "-"
							setVar $E "-"
						elseif (PORT.CLASS[$IDX] = 4)
							#SSB
							setVar $F " "
							setVar $O " "
							setVar $E "-"
						elseif (PORT.CLASS[$IDX] = 5)
							#SBS
							setVar $F " "
							setVar $O "-"
							setVar $E " "
						elseif (PORT.CLASS[$IDX] = 6)
							#BSS
							setVar $F "-"
							setVar $O " "
							setVar $E " "
						elseif (PORT.CLASS[$IDX] = 7)
							#SSS
							setVar $F " "
							setVar $O " "
							setVar $E " "
						elseif (PORT.CLASS[$IDX] = 8)
							#BBB
							setVar $F "-"
							setVar $O "-"
							setVar $E "-"
						elseif (PORT.CLASS[$IDX] = 0)
							#BBB
							setVar $F "-"
							setVar $O "-"
							setVar $E "-"
						end

						setVar $FOCUS $IDX
						gosub :PAD
						setVar $PORTS[$IDX] ($Pad & $FOCUS & " ")
						setVar $FOCUS PORT.FUEL[$IDX]
						gosub :PAD
						setVar $PORTS[$IDX] ($PORTS[$IDX] & $f & $Pad & $FOCUS & " ")
						setVar $FOCUS PORT.PERCENTFUEL[$IDX]
						gosub :PAD_PER
						setVar $PORTS[$IDX] ($PORTS[$IDX] & $Pad & PORT.PERCENTFUEL[$IDX] & "% ")
						setVar $FOCUS PORT.ORG[$IDX]
						gosub :PAD
						setVar $PORTS[$IDX] ($PORTS[$IDX] & $O & $Pad & $FOCUS & " ")
						setVar $FOCUS PORT.PERCENTORG[$IDX]
						gosub :PAD_PER
						setVar $PORTS[$IDX] ($PORTS[$IDX] & $Pad & PORT.PERCENTORG[$IDX] & "% ")
						setVar $FOCUS PORT.EQUIP[$IDX]
						gosub :PAD
						setVar $PORTS[$IDX] ($PORTS[$IDX] & $E & $Pad & $FOCUS & " ")
						setVar $FOCUS PORT.PERCENTEQUIP[$IDX]
						gosub :PAD_PER
						setVar $PORTS[$IDX] ($PORTS[$IDX] & $Pad & PORT.PERCENTEQUIP[$IDX] & "%")
						add $PORT_COUNT 1
					end
				end
			end
		end
		add $idx 1
	end

	if ($TWX)
		DELETE $FName_TWX
	end
	if ($SWATH)
		DELETE $FName_SWA
		setVar $LINE ":"
		gosub :FILE_WRITE_SWA
	end

    setVar $CashAmount $WARP_COUNT
	gosub :CommaSize
	Echo "*" & $TAG & ANSI_15 & "Warps "&ANSI_8&": " & ANSI_14 & $CashAmount

	if ($PORT)
		setVar $CashAmount $PORT_COUNT
		gosub :CommaSize
		Echo "*" & $TAG & ANSI_15 & "Ports "&ANSI_8&": " & ANSI_14 & $CashAmount
	end
    Echo "*" & $TAG & ANSI_15 & "Exporting To File..."
	setVar $IDX 1
	while ($IDX <= SECTORS)
		if ($TWX)
			if ($SECT_TWX[$IDX] <> "0")
				setVar $LINE $SECT_TWX[$IDX]
	        	gosub :FILE_WRITE_TWX
	        end
		end
		if ($SWATH)
			if ($SECT_SWATH[$IDX] <> "0")
				setVar $LINE $SECT_SWATH[$IDX]
				gosub :FILE_WRITE_SWA
			end
		end
		add $IDX 1
	end

	if ($PORT)
 		setVar $LINE ""
		gosub :FILE_WRITE_SWA
		setVar $LINE ":"
		gosub :FILE_WRITE_SWA
		setVar $IDX 1
		while ($IDX <= SECTORS)
			if ($PORTS[$IDX] <> "0")
            	setVar $LINE $PORTS[$IDX]
				gosub :FILE_WRITE_SWA
			end
			add $IDX 1
		end
	end
	if ($SWATH)
 		setVar $LINE ""
		gosub :FILE_WRITE_SWA
 		setVar $LINE ": ENDINTERROG"
		gosub :FILE_WRITE_SWA
	end

	Echo "*" & $TAG

	if ($TWX)
		Echo "*" & $TAG & ANSI_15 & "TWX File Specs"&ANSI_8&": " & ANSI_14 & $FName_TWX
		setVar $CashAmount $FileLine_TWX
		gosub :CommaSize
        Echo "*" & $TAG & ANSI_15 & "    Lines "&ANSI_8&": " & ANSI_14 & $CashAmount
		setVar $CashAmount $FileSize_TWX
		gosub :CommaSize
		Echo "*" & $TAG & ANSI_15 & "    Bytes "&ANSI_8&": " & ANSI_14 & $CashAmount
	end

	if ($SWATH)
		Echo "*" & $TAG & ANSI_15 & "SWATH File Specs"&ANSI_8&": " & ANSI_14 & $FName_SWA
		setVar $CashAmount $FileLine_SWA
		gosub :CommaSize
        Echo "*" & $TAG & ANSI_15 & "    Lines "&ANSI_8&": " & ANSI_14 & $CashAmount
		setVar $CashAmount $FileSize_SWA
		gosub :CommaSize
		Echo "*" & $TAG & ANSI_15 & "    Bytes "&ANSI_8&": " & ANSI_14 & $CashAmount
	end
	Echo "*" & $TAG

	halt
:_START_
	setVar $TAG (ANSI_9 & "["&ANSI_14&"WARPSPEC"&ANSI_9&"] " & ANSI_15)
	setvar $SWATH	FALSE
	setVar $PORT	FALSE
	setVar $TWX		FALSE
	setVar $FileSize_TWX 0
	setVar $FileLine_TWX 0
	setVar $FileSize_SWA 0
	setVar $FileLine_SWA 0
	setVar $PORT_COUNT 0
	setVar $WARP_COUNT 0
	:_START_MENU
	Echo "***"
	Echo "*" & $TAG & ANSI_15 & "   LoneStar's WarpSpec Exporter"
	Echo "*" & $TAG & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196
	Echo "*" & $TAG & ANSI_8 & "   T " & ANSI_15 & "TWX WarpSpec    : " & ANSI_14
	if ($TWX)
		Echo "Yes"
	else
		Echo "No"
	end
	Echo "*" & $TAG & ANSI_8 & "   S " & ANSI_15 & "SWATH WarpSpec  : " & ANSI_14
	if ($SWATH)
		Echo "Yes"
		Echo "*" & $TAG & ANSI_8 & "   P " & ANSI_15 & "Swath Port Data: " & ANSI_14
		if ($PORT)
			Echo "Yes"
		else
			Echo "No"
		end
	else
		Echo "No"
		setVar $PORT FALSE
	end
	Echo "*" & $TAG
	Echo "*" & $TAG & ANSI_8 & "   X " & ANSI_15 & "Export!"
	Echo "*" & $TAG & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196
	Echo "*" & $TAG & ANSI_8 & "   Q " & ANSI_15 & "Quit"
	Echo "*" & $TAG
	:ASK_AGAIN
	getConsoleInput $s SINGLEKEY
	uppercase $s
	if ($s = "Q")
		Echo "*" & $TAG
		Echo "*" & $TAG & ANSI_12 & "Script Halted"
		Echo "*" & $TAG
		halt
	elseif ($s = "P") AND ($SWATH)
		if ($PORT)
			setVar $PORT FALSE
		else
			setVar $PORT TRUE
		end
	elseif ($s = "S")
		if ($SWATH)
			setVar $SWATH FALSE
			setVar $PORT FALSE
		else
			setVar $SWATH TRUE
		end
	elseif ($s = "T")
		if ($TWX)
			setVar $TWX FALSE
		else
			setVar $TWX TRue
		end
	elseif ($s = "X")
		setVar $FName_TWX ("C:\WarpSpec_TWX_" & GAMENAME & ".txt")
		#Only something I would do.. laff
		if ($PORT)
			setVar $FName_SWA ("C:\WARPSec_SWATH_" & GAMENAME & ".txt")
		else
			setVar $FName_SWA ("C:\WarpSpec_SWATH_" & GAMENAME & ".txt")
    	end
		if ($TWX = FALSE) AND ($SWATH = FALSE)
			Echo "*" & $TAG
			Echo "*" & $TAG & ANSI_12 & "Nothing To Do"
			Echo "*" & $TAG
			halt
		end
	    Echo "*" & $TAG
		if ($PORT)
			setArray $PORTS SECTORS
		end
		if ($TWX)
			setARray $SECT_TWX SECTORS
		end
		if ($SWATH)
			setArray $SECT_SWATH SECTORS
		end
		goto :LETS_BOOGIE
	else
		goto :ASK_AGAIN
	end
	goto :_START_MENU
	halt

:PAD
	if ($Focus < 10)
	setVar $Pad "    "
	elseif ($Focus < 100)
	setVar $Pad "   "
	elseif ($Focus < 1000)
	setVar $Pad "  "
	elseif ($Focus < 10000)
	setVar $Pad " "
	else
	setVar $Pad ""
	end
	return
:PAD_PER
	if ($Focus < 10)
	setVar $Pad "  "
	elseif ($Focus < 100)
	setVar $Pad " "
	else
	setVar $Pad ""
	end
	return

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
