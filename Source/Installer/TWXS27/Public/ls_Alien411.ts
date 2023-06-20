    #=--------                                                                       -------=#
     #=--------------------- LoneStar's Alien Directory Assistance ------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	June 16, 2008 - Version 2.0
	#		Author		:	LoneStar
	#		TWX			:	TWX 2.04b or TWX 2.04 Final
	#		Credits		:	Singularities Print Alien Spaces Routine
	#
	#		To Run		:	Alien Sectors must have been seen by TWX in order
	#						for this script to work.
	#
	#		Fixes       :	Initial Release
	#
	#		Description	:	Just a basic TWX DataBase scan for alien spaces.
	#
	#						Creates a Text File to store known alien sectors to
	#						be referenced later for speed.
	#
	#						Can now redirect data to SubSpace, Fed Comms, or PM.
	#
	setVar $TRADER "zip"
	setVar $TAG (ANSI_9 & "["&ANSI_14&"ALIEN411"&ANSI_9&"] " & ANSI_15)
	setVar $TAG2 "[ALIEN411] "
	setVar $FNAME		"ALIEN411_" & GAMENAME & ".txt"
	setVar $Race_Max	10
	setArray $Races		$Race_Max 1
	setVar $idx 		0
	setVar $SSpace		"NO"

	if (CONNECTED)
	else
		Echo "*" & $TAG
		Echo "*" & $TAG & ANSI_15 & "Must Be Connected To A Server"
		goto :_END_
	end

:_TOP_OF_THE_WORLD_
	fileexists $TST $FNAME
	if ($TST)
		readtoarray $FNAME $TEMP
		setVar $idx 1
		while ($idx <= $TEMP)
			setVar $STR ("@@##$$%%" & $TEMP[$idx] & "^^%%$$")
			getText $STR $RACE "@@##$$%%" #9
			setVar $RACES[$idx] $RACE
			getText $STR $RACES[$idx][1] #9 "^^%%$$"
			add $idx 1
		end
		setVar $RACES $TEMP
	else
		send "#/"
		waiton "Who's Playing"
		setTextLineTrigger	Alien		:Alien	"are on the move!"
		setTextTrigger		AlienDone	:AlienDone (#179 & "Turns")
		pause
		:Alien
			getText CURRENTLINE $Temp "The " " are on the move!"
			if ($idx < $Race_Max)
				add $idx 1
				setVar $Races[$idx] $Temp
				setVar $Races[$idx][1] ""
				setVar $RACES $idx
			end
			setTextLineTrigger	Alien		:Alien	"are on the move!"
			pause
		:AlienDone
			killAllTriggers
			gosub :RACE_SCAN
	end

	Echo "**"
	:_MENU_TOP
	Echo "*" & $TAG & ANSI_15 & "   LoneStar's Directory Assistance"
	Echo "*" & $TAG & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196& #196& #196& #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196
	setVar $idx 1
	while ($idx <= $RACES)
		gosub :RACE_COUNT
		if ($idx = $Race_Max)
			Echo "*" & $TAG & ANSI_8 & "0 " & ANSI_15 & $Races[$idx]
		else
			Echo "*" & $TAG & ANSI_8 $idx & " " & ANSI_15 & $Races[$idx]
		end
		Echo " (" & ANSI_7 & $COUNT & " Sectors"&ANSI_15&"}"
    	add $idx 1
	end
	Echo "*" & $TAG & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196
	Echo "*" & $TAG & ANSI_8 & "   S " & ANSI_15 & "Scan TWX DBase"
	Echo "*" & $TAG & ANSI_8 & "   R " & ANSI_15 & "Redirect To "
	if ($SSpace = "NO")
		echo ANSI_14 & "OFF"
	elseif ($SSpace = "SUB")
		Echo ANSI_14 & "Sub Space"
	elseif ($SSpace = "FED")
		Echo ANSI_14 & "Fed Comm-Link"
	elseif ($SSpace = "TRADER")
		Echo ANSI_14 & "Trader (PM)"
	else
		setVar $SSpace "NO"
		echo ANSI_14 & "OFF"
	end

	Echo "*" & $TAG & ANSI_8 & "   Q " & ANSI_15 & "Quit"
	Echo "*" & $TAG
	:ASK_AGAIN
	getConsoleInput $s SINGLEKEY
	uppercase $s
	if ($s = "Q")
		goto :_END_
	end

	if ($s = "S")
		delete $FNAME
		setVar $RACES 		0
		setVar $idx			0
		setArray $RACES		$Race_Max 1
		goto :_TOP_OF_THE_WORLD_
	end

	if ($S = "R")
		if ($SSpace = "NO")
			setVar $SSpace "SUB"
		elseif ($SSpace = "SUB")
			setVar $SSpace "FED"
		elseif ($SSpace = "FED")
			setVar $SSpace "TRADER"
		elseif ($SSpace = "TRADER")
			setVar $SSpace "NO"
		else
			setVar $SSpace "NO"
		end
		goto :_MENU_TOP
	end
	isnumber $tst $s
	if ($tst = 0)
		goto :ASK_AGAIN
	end

	if ($s > $idx)
		goto :ASK_AGAIN
	end

	if ($s = 0)
		setVar $s 10
	end
    setVar $LOOKING $s

	if ($SSpace = "SUB") OR ($SSpace = "FED")
		if ($SSpace = "SUB")
			killAllTriggers
			setTextLineTrigger	WHOOPS	:WHOOPS	"You'll need to select a radio channel first."
			send "'"
			waiton "Sub-space radio"
			send "*"
			waiton "Type sub-space message [<ENTER> to send line. Blank"
		else
			send "`"
			waiton "Federation comm-link:"
			send "*"
			waiton "Type FedComm message"
		end
		send $TAG2 & "*"
		send $TAG2 & "Results For " & $RACES[$LOOKING] & " Space*"
		send $TAG2 & "-----------------------------*"
		setVar $STR $RACES[$LOOKING][1]
		setVar $idx 1
		getword $STR $SECT $idx "0"
		while ($SECT <> "0")
			isnumber $tst $SECT
			if ($tst)
				gosub :PAD
				send $TAG2 & $PAD & $SECT & " "

				send SECTOR.WARPCOUNT[$SECT] & "-Warps"
				getSectorParameter $SECT "FIGSEC" $F
				isnumber $tst $F
				if ($tst)
					if ($F <> 0)
						send " FIGd"
					end
				end
				getSectorParameter $SECT "LIMPSEC" $L
				isnumber $tst $L
				if ($tst <> 0)
					if ($L <> 0)
						send " LIMPd"
					end
				end
				getSectorParameter $SECT "MINESEC" $A
				isnumber $tst $A
				if ($tst <> 0)
					if ($A <> 0)
						send " ARMID"
					end
				end
			end
			send "*"
	        add $idx 1
	        getword $STR $SECT $idx "0"
		end
		send $TAG2 & "---------------------------V2*"
		send $TAG2 & "**"
		if ($SSpace = "SUB")
			waiton "Sub-space comm-link terminated"
		else
			waiton "Federation comm-link terminated"
		end
	elseif ($SSpace = "TRADER")
		Echo "*" & $TAG
		Echo "*" & $TAG & ANSI_15 & "Name Of Trader To Send Private Message To"&ANSI_14&":"
		getConsoleInput $TRADER
		if ($TRADER = "")
			goto :_MENU_TOP
		end
    	send "=" & $TRADER & "*"
		setTextTrigger 		partial		:partial	"Do you mean"
		setTextLineTrigger	match		:match		"Secure comm-link established, Captain."
		setTextLineTrigger	nomatch		:nomatch	"Unknown Trader!"
		setTextLineTrigger	yourself	:nomatch	"The crew is disturbed by your incoherent mumbling."
		setTextLineTrigger	notonline	:notonline	"Rerouting message to Galactic M.A.I.L. Server."
		pause
		:nomatch
		killAllTriggers
		goto :_END_
		:partial
		send "y"
		pause
		:match
		killAllTriggers
		:notonline
		killAllTriggers
		waitOn "<ENTER> to send line."
		send $TAG2 & "*"
		send $TAG2 & "Results For " & $RACES[$LOOKING] & " Space*"
		send $TAG2 & "-----------------------------*"
		setVar $STR $RACES[$LOOKING][1]
		setVar $idx 1
		getword $STR $SECT $idx "0"
		while ($SECT <> "0")
			isnumber $tst $SECT
			if ($tst)
				gosub :PAD
				send $TAG2 & $PAD & $SECT & " "

				send SECTOR.WARPCOUNT[$SECT] & "-Warps"
				getSectorParameter $SECT "FIGSEC" $F
				isnumber $tst $F
				if ($tst)
					if ($F <> 0)
						send " FIGd"
					end
				end
				getSectorParameter $SECT "LIMPSEC" $L
				isnumber $tst $L
				if ($tst <> 0)
					if ($L <> 0)
						send " LIMPd"
					end
				end
				getSectorParameter $SECT "MINESEC" $A
				isnumber $tst $A
				if ($tst <> 0)
					if ($A <> 0)
						send " ARMID"
					end
				end
			end
			send "*"
	        add $idx 1
	        getword $STR $SECT $idx "0"
		end
		send $TAG2 & "---------------------------V2*"
		send $TAG2 & "*"
		send "*"
		waiton "GMS link terminated."
	else
		Echo "*" & $TAG & "Results For " & ANSI_14 & $RACES[$LOOKING] & ANSI_15 & " Space"
		Echo "*" & $TAG & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196
		setVar $STR $RACES[$LOOKING][1]
		setVar $idx 1
		getword $STR $SECT $idx "0"
		while ($SECT <> "0")
			isnumber $tst $SECT
			if ($tst)
				gosub :PAD
				Echo "*" & $TAG & ANSI_15 & $PAD & $SECT & " "

				Echo ANSI_7 & SECTOR.WARPCOUNT[$SECT] & "-Warps"
				getSectorParameter $SECT "FIGSEC" $F
				isnumber $tst $F
				if ($tst)
					if ($F <> 0)
						Echo ANSI_4 & " FIGd"
					end
				end
				getSectorParameter $SECT "LIMPSEC" $L
				isnumber $tst $L
				if ($tst <> 0)
					if ($L <> 0)
						Echo ANSI_4 & " LIMPd"
					end
				end
				getSectorParameter $SECT "MINESEC" $A
				isnumber $tst $A
				if ($tst <> 0)
					if ($A <> 0)
						Echo ANSI_4 & " ARMID"
					end
				end
			end
	        add $idx 1
	        getword $STR $SECT $idx "0"
		end
		Echo "*" & $TAG
	end
	goto :_MENU_TOP


:_END_
Echo "*" & $TAG
Echo "*" & $TAG & ANSI_12 & "Script Halted"
Echo "*" & $TAG
halt

:WHOOPS
killAllTriggers
Echo "*" & $TAG
Echo "*" & $TAG & ANSI_15 & "No Sub-Space Channel Has Been Set"
goto :_END_

:RACE_COUNT
	setVar $STR $RACES[$IDX][1]
	setVar $COUNT 1
	getword $STR $SECT $idx "0"
	while ($SECT <> "0")
		add $COUNT 1
		getword $STR $SECT $COUNT "0"
	end
	subtract $COUNT 1
	return

:PAD
	if ($SECT < 10)
		setVar $PAD "    "
	elseif ($SECT < 100)
		setVar $PAD "   "
	elseif ($SECT < 1000)
		setVar $PAD "  "
	elseif ($SECT < 10000)
		setVar $PAD " "
	else
		setVar $PAD ""
	end
	return

:RACE_SCAN
Echo "*" & $TAG
if ($Races = 0)
Echo "*" & $TAG & ANSI_15 & "No Aliens In This Universe. Please Try Again Later"
goto :_END_
end
Echo "*" & $TAG & ANSI_15 & "Scanning TWX DBase For Alien Space..."
Echo "*" & $TAG
setVar $i 11
while ($i <= SECTORS)
	getSector $i $SECT
	setVar $constellation $SECT.CONSTELLATION
	stripText $constellation "(unexplored)"
	stripText $constellation "uncharted space"
	stripText $constellation "."
	setVar $idx 1
	while ($idx <= $RACES)
		getWordPos $constellation $POS $RACES[$idx]
		if ($POS <> 0)
			setVar $RACES[$IDX][1] ($RACES[$IDX][1] & " " & $i)
		end
		add $idx 1
	end
	add $i 1
end
delete $FNAME
setVar $IDX 1
while ($IDX <= $RACES)
	setVar $STR ""
	setVar $STR $RACES[$IDX] & #9 & $RACES[$IDX][1]
	write $FNAME $STR
	add $IDX 1
end
Echo "*" & $TAG & ANSI_15 & "Data Written To File"
Echo "*" & $TAG
return
