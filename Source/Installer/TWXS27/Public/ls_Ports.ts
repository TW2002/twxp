    #=--------                                                                       -------=#
     #=------------------------    LoneStar's Port Emporium    ----------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	July 25, 2007
	#		Version		:	1.01
	#		Author		:	LoneStar
	#		TWX			:	Should Work with any Version of TWX-Proxy
	#		Credits		:	Me, Myself, and I.
	#
	#		Description	:	A slightly better Upgraded-Port-Listing than what
	#						TWX and Swath can do. Lots of room for improvement
	#						but ar too little time to do it.
	#
	#		Fixes		:	IF condition for BBS Port Class 1, was mistakenly coded as BBB :Line 95
	#

	setVar $TagLine "LoneStar's Port Emporium"
	setVar $Version "1.0"
	setVar $min_Product 5000
	setVar $ore "X"
	setVar $org "X"
	setVar $equ "X"

	Echo "*"
    :Menu_Top
   	echo "**"
	echo ANSI_15 & "  " & $TagLine & " v" & $Version
	getLength ($TagLine & " v" & $Version) $Len
	setVar $Buff ""
	setVar $i 0
	while ($i < $Len)
		setVar $Buff ($Buff & "=")
		add $i 1
	end
	echo ANSI_12 & "*  " & $Buff
	Echo "*" & ANSI_15 & "  " & "Port Class " & ANSI_8 & "(" & ANSI_14 & "F" & ANSI_15 & "uel" & ANSI_14 & "/" & ANSI_14 & "O" & ANSI_15 & "rg" & ANSI_14 & "/" & ANSI_14 & "E" & ANSI_15 & "qu" & ANSI_8 & ")"&ANSI_14&" : "
	Echo ANSI_15 & $ORE
	Echo ANSI_15 & $ORG
	Echo ANSI_15 & $EQU
	if (CONNECTED)
		Echo "*" & ANSI_14 & "  " & "U" & ANSI_15 & "pdate CIM "
	end
	Echo "*"
	Echo "*" & ANSI_15 & "  E"&ANSI_14&"x"&ANSI_15&"ecute"
	Echo "*" & ANSI_14 & "  Q"&ANSI_15&"uit"
	Echo "*"
	:Did_I_Stutter
	getConsoleInput $s SINGLEKEY
	uppercase $s
	if ($s = "F")
    	if ($ore = "B")
    		setVar $ore "S"
    	elseif ($ore = "S")
    		setVar $ore "X"
    	elseif ($ore = "X")
    		setVar $ore "B"
    	else
    		setVar $ore "B"
    	end
	elseif ($s = "O")
    	if ($org= "B")
    		setVar $org "S"
    	elseif ($org= "S")
    		setVar $org "X"
    	elseif ($org= "X")
    		setVar $org "B"
    	else
    		setVar $org "B"
    	end
	elseif ($s = "E")
    	if ($equ = "B")
    		setVar $equ "S"
    	elseif ($equ = "S")
    		setVar $equ "X"
    	elseif ($equ = "X")
    		setVar $equ "B"
    	else
    		setVar $equ "B"
    	end
    elseif (($s = "U") AND (CONNECTED))
		send "^RQ"
		waitfor ": ENDINTERROG"
	elseif ($s = "Q")
		halt
	elseif ($s = "X")
		goto :Execute
	else
    	goto :Did_I_Stutter
	end
	goto :Menu_Top

:Execute
	setArray $Class 8

	if (($ore = "B") AND ($org = "B") AND ($equ = "S"))
		SetVar $Class[1] 1
	elseif (($ore = "B") AND ($org = "S") AND ($equ = "B"))
		SetVar $Class[1] 2
	elseif (($ore = "S") AND ($org = "B") AND ($equ = "B"))
		SetVar $Class[1] 3
	elseif (($ore = "S") AND ($org = "S") AND ($equ = "B"))
		SetVar $Class[1] 4
	elseif (($ore = "S") AND ($org = "B") AND ($equ = "S"))
		SetVar $Class[1] 5
	elseif (($ore = "B") AND ($org = "S") AND ($equ = "S"))
		SetVar $Class[1] 6
	elseif (($ore = "S") AND ($org = "S") AND ($equ = "S"))
		SetVar $Class[1] 7
	elseif (($ore = "B") AND ($org = "B") AND ($equ = "B"))
		SetVar $Class[1] 8
	elseif (($ore = "X") AND ($org = "B") AND ($equ = "B"))
		SetVar $Class[1] 3
		SetVar $Class[2] 8
	elseif (($ore = "X") AND ($org = "S") AND ($equ = "B"))
		SetVar $Class[1] 2
		SetVar $Class[2] 4
	elseif (($ore = "X") AND ($org = "B") AND ($equ = "S"))
		SetVar $Class[1] 1
		SetVar $Class[2] 5
	elseif (($ore = "X") AND ($org = "S") AND ($equ = "S"))
		SetVar $Class[1] 6
		SetVar $Class[2] 7
	elseif (($ore = "S") AND ($org = "X") AND ($equ = "B"))
		SetVar $Class[1] 3
		SetVar $Class[2] 4
	elseif (($ore = "S") AND ($org = "X") AND ($equ = "S"))
		SetVar $Class[1] 5
		SetVar $Class[2] 7
	elseif (($ore = "B") AND ($org = "X") AND ($equ = "B"))
		SetVar $Class[1] 2
		SetVar $Class[2] 8
	elseif (($ore = "B") AND ($org = "X") AND ($equ = "S"))
		SetVar $Class[1] 1
		SetVar $Class[2] 6
	elseif (($ore = "S") AND ($org = "S") AND ($equ = "X"))
		SetVar $Class[1] 4
		SetVar $Class[2] 7
	elseif (($ore = "S") AND ($org = "B") AND ($equ = "X"))
		SetVar $Class[1] 3
		SetVar $Class[2] 5
	elseif (($ore = "B") AND ($org = "S") AND ($equ = "X"))
		SetVar $Class[1] 2
		SetVar $Class[2] 6
	elseif (($ore = "B") AND ($org = "B") AND ($equ = "X"))
		SetVar $Class[1] 1
		SetVar $Class[2] 8
	elseif (($ore = "X") AND ($org = "X") AND ($equ = "B"))
		SetVar $Class[1] 2
		SetVar $Class[2] 3
		SetVar $Class[3] 4
		SetVar $Class[4] 8
	elseif (($ore = "X") AND ($org = "X") AND ($equ = "S"))
		SetVar $Class[1] 1
		SetVar $Class[2] 5
		SetVar $Class[3] 6
		SetVar $Class[4] 7
	elseif (($ore = "X") AND ($org = "B") AND ($equ = "X"))
		SetVar $Class[1] 1
		SetVar $Class[2] 3
		SetVar $Class[3] 5
		SetVar $Class[4] 8
	elseif (($ore = "X") AND ($org = "S") AND ($equ = "X"))
		SetVar $Class[1] 2
		SetVar $Class[2] 4
		SetVar $Class[3] 6
		SetVar $Class[4] 7
	elseif (($ore = "S") AND ($org = "X") AND ($equ = "X"))
		SetVar $Class[1] 3
		SetVar $Class[2] 4
		SetVar $Class[3] 5
		SetVar $Class[4] 7
	elseif (($ore = "B") AND ($org = "X") AND ($equ = "X"))
		SetVar $Class[1] 1
		SetVar $Class[2] 2
		SetVar $Class[3] 6
		SetVar $Class[4] 8
	elseif (($ore = "X") AND ($org = "X") AND ($equ = "X"))
		SetVar $Class[1] 1
		SetVar $Class[2] 2
		SetVar $Class[3] 3
		SetVar $Class[4] 4
		SetVar $Class[5] 5
		SetVar $Class[6] 6
		SetVar $Class[7] 7
		SetVar $Class[8] 8
	else
		Echo "***Whoopsie..  **"
		halt
	end

	Echo "****"
	Echo ANSI_15 & "Sector Class   Fuel Ore     Organics      Equipment*"
	Echo ANSI_15 & "---------------------------------------------------"
	setVar $IDX 1

	while ($IDX <= SECTORS)
    	if (PORT.EXISTS[$IDX])
			setVar $ptr 1
			while ($ptr <= 8)
            	if (PORT.CLASS[$idx] = $Class[$ptr])
					if ((PORT.FUEL[$idx] >= $min_Product) OR (PORT.ORG[$idx] >= $min_Product) OR (PORT.EQUIP[$IDX] >= $min_Product))
						setVar $sector_size $idx
						gosub :PadErAmma

						Echo "*" & ANSI_15 & $idx & $pad & "  "
						if (PORT.BUYFUEL[$idx])
							Echo ANSI_10 & "B"
						else
							Echo ANSI_15 & "S"
						end
						if (PORT.BUYORG[$idx])
							Echo ANSI_10 & "B"
						else
							Echo ANSI_15 & "S"
						end
						if (PORT.BUYEQUIP[$idx])
							Echo ANSI_10 & "B"
						else
							Echo ANSI_15 & "S"
						end
						Echo "   "
						setVar $sector_size PORT.FUEL[$idx]
						gosub :PadErAmma
						if (PORT.PERCENTFUEL[$idx] < 100)
							setVar $percent " " & PORT.PERCENTFUEL[$idx]
						else
							setVar $percent PORT.PERCENTFUEL[$idx]
						end
						if (PORT.FUEL[$idx] >= $min_Product)
							Echo ANSI_14& PORT.FUEL[$idx] & $pad &ANSI_6& " (" &ANSI_14& $percent & "%"&ANSI_6&") "
						else
							Echo ANSI_6& PORT.FUEL[$idx] & $pad &ANSI_6&" (" &ANSI_14& $percent & "%"&ANSI_6&") "
						end

						Echo " "
						setVar $sector_size PORT.ORG[$idx]
						gosub :PadErAmma
						if (PORT.PERCENTORG[$idx] < 100)
							setVar $percent " " & PORT.PERCENTORG[$idx]
						else
							setVar $percent PORT.PERCENTORG[$idx]
						end
						if (PORT.ORG[$idx] >= $min_Product)
							Echo ANSI_14& PORT.ORG[$idx] & $pad &ANSI_6&" (" &ANSI_14& $percent & "%"&ANSI_6&") "
						else
							Echo ANSI_6& PORT.ORG[$idx] & $pad &ANSI_6&" (" &ANSI_14& $percent & "%"&ANSI_6&") "
						end
						Echo " "
						setVar $sector_size PORT.EQUIP[$idx]
						gosub :PadErAmma
						if (PORT.PERCENTEQUIP[$idx] < 100)
							setVar $percent " " & PORT.PERCENTEQUIP[$idx]
						else
							setVar $percent PORT.PERCENTEQUIP[$idx]
						end
                        if (PORT.EQUIP[$idx] >= $min_Product)
							Echo ANSI_14& PORT.EQUIP[$idx] & $pad &ANSI_6&" (" &ANSI_14& $percent & "%"&ANSI_6&") "
						else
							Echo ANSI_6& PORT.EQUIP[$idx] & $pad &ANSI_6&" (" &ANSI_14& $percent & "%"&ANSI_6&") "
    					end
					end
				end
				add $ptr 1
            end
		end
		add $IDX 1
	end
	goto :Menu_Top
halt

:PadErAmma
	getLength $sector_size $sector_size
	if ($sector_size = 1)
		setVar $pad "    "
	elseif ($sector_size = 2)
		setVar $pad "   "
	elseif ($sector_size = 3)
		setVar $pad "  "
	elseif ($sector_size = 4)
		setVar $pad " "
	elseif ($sector_size = 5)
		setVar $pad ""
	else
		setVar $pad ""
	end
	return

