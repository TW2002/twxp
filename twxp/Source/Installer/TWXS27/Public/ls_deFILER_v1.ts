    #=--------                                                                       -------=#
     #=--------------------------      LoneStar's defiler     -----------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	May 21, 2008 - Version 1.02
	#		Author		:	LoneStar
	#		TWX			:	TWX 2.04b or TWX 2.04 Final
	#
	#		Credits		:
	#
	#		To Run		:	Nothing special
	#
	#		Fixes       :	Inital Release - DataBase Updated
	#
	#		Description	:	Cleans up Game specific files created by scripts. Script
	#						currently is aware of 38 different type of file types and
	#						delete any and all found for a given specific Game. The script
	#						will not delete the actual TWX Game Dbase
	#

	setVar $TAG (ANSI_9 & "["&ANSI_14&"deFILER"&ANSI_9&"] " & ANSI_15)
	setVar $STOP (ANSI_9 & "["&ANSI_12&"STOPPED"&ANSI_9&"] " & ANSI_15)
	setVar $DATA_BYTES	0
	setVar $DATA_LINES	0

	if (CONNECTED)
		gosub :MSGS_OFF
	end
	:Top_Of_The_Ladder
	echo #27 & "[2J"
	Echo "*****"
	gosub :Input
	Echo $TAG & "LoneStar's "&ANSI_14&"deFILER"&ANSI_15&" Version 1.02*"
	Echo $TAG & ANSI_6 & "------------------------------*"
	getFileList $FILES "data\*.xdb"
	setvar $idx 1
	while ($idx <= $FILES)
		if ($idx <= 26)
			setVar $s $FILES[$idx]
			stripText $s ".xdb"
			Echo $TAG & $ABC[$idx] & " " & ANSI_14 & $s & "*"
		end
		add $idx 1
	end
	Echo $TAG & ANSI_6 & "------------------------------*"
	:Ask
	Echo $TAG & "Select a TWX DBase"
	getConsoleInput $s SINGLEKEY
	uppercase $s
	setVar $idx 1
	while ($idx <= 26)
		if ($s = $ABC[$idx]) AND ($IDX <= $FILES)
			goto :Got_Game
		end
		add $idx 1
	end
	Echo "                " &ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*"
	Echo $STOP & "**"
	if (CONNECTED)
		gosub :MSGS_ON
	end
	halt
	:Got_Game
	Echo ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*"
	setVar $GAME_NAME $FILES[$idx]
	stripText $GAME_NAME ".xdb"
	Echo $TAG & "Loading DBASE: "
	gosub :LOAD_DBASE
	Echo ANSI_7 & $DBASE & ANSI_15 & " Entries                              *"
	Echo $TAG & "Scanning TWX-Proxy Game: "&ANSI_7&$GAME_NAME&"*"
	Echo $TAG & ANSI_6 & "  ----------------------------------------------*"
	getFileList $FILEZ "*.*"

	setVar $DBASE_IDX 1
	setVar $TARGET_IDX 0

	while ($DBASE_IDX <= $DBASE)
		setVar $FILEZ_IDX 1
		while ($FILEZ_IDX <= $FILEZ)
			if ($DBASE[$DBASE_IDX] = $FILEZ[$FILEZ_IDX])
				add $TARGET_IDX 1
				setVar $TARGETS[$TARGET_IDX] $FILEZ[$FILEZ_IDX]
				echo $TAG & ANSI_7 & "  " & $TARGETS[$TARGET_IDX]
				readToArray $TARGETS[$TARGET_IDX] $BUFFER
				setVar $IDX 1
				setVar $bytes 0
				setVar $lines 0
				while ($IDX <= $BUFFER)
					getLength $BUFFER[$IDX] $LEN
					add $DATA_BYTES ($LEN + 2)
					add $bytes ($LEN + 2)
					add $DATA_LINES	1
					add $lines 1
					add $idx 1
				end
				setVar $CashAmount $bytes
				gosub :CommaSize
				replaceText $CashAmount "," (ANSI_15 & "," & ANSI_7)
				Echo #9 & ANSI_15 & "(" & ANSI_7 & $CashAmount & " bytes, "
				setVar $CashAmount $lines
				gosub :CommaSize
				replaceText $CashAmount "," (ANSI_15 & "," & ANSI_7)
				Echo $CashAmount & " lines"&ANSI_15&")*"
				goto :Next_DBASE
			end
			add $FILEZ_IDX 1
		end
		:Next_DBASE
		add $DBASE_IDX 1
	end
	Echo $TAG & ANSI_6 & "  ----------------------------------------------*"
	Echo $TAG & "Targets Found "&ANSI_14&": " & ANSI_7 & $TARGET_IDX & "*"
	if ($TARGET_IDX = 0)
		Echo $STOP & "**"
		if (CONNECTED)
			gosub :MSGS_ON
		end
		halt
	end
	setVar $CashAmount $DATA_BYTES
	gosub :CommaSize
	replaceText $CashAmount "," (ANSI_15 & "," & ANSI_7)
	Echo $TAG & "Total Bytes   "&ANSI_14&": " & ANSI_7 & $CashAmount & "*"
	setVar $CashAmount $DATA_LINES
	gosub :CommaSize
	replaceText $CashAmount "," (ANSI_15 & "," & ANSI_7)
	Echo $TAG & "Total Lines   "&ANSI_14&": " & ANSI_7 & $CashAmount & "*"
	:Ask_again
	Echo $TAG & "Delete These Files (Y/N)?"
	getConsoleInput $s SINGLEKEY
	uppercase $s
	if ($s = "Y")
		Echo $TAG & "Deleting Files...*"
		setVar $DELETE_IDX 1
		while ($DELETE_IDX <=  $TARGET_IDX)
			delete $TARGETS[$DELETE_IDX]
			add $DELETE_IDX 1
		end
		setVar $DELETE_IDX 1
		setVar $CHECK 0
		while ($DELETE_IDX <=  $TARGET_IDX)
			fileExists $tst $TARGETS[$DELETE_IDX]
			if ($tst)
				Echo $TAG & " Not Deleted    "&ANSI_14&": "&ANSI_7&$TARGETS[$DELETE_IDX]&"*"
				add $CHECK 1
			end
			add $DELETE_IDX 1
		end

		setDelayTrigger	Fools_Utopia	:Fools_Utopia	1000
		pause
		:Fools_Utopia
		killAllTriggers
		Echo $TAG & "Delete Success  "&ANSI_14&": "&ANSI_7& ($TARGET_IDX - $CHECK) & "*"
		Echo $TAG & "Delete Failed   "&ANSI_14&": "&ANSI_7& $CHECK & "*"
	elseif ($s = "N")
		goto :Top_Of_The_Ladder
	else
		Echo ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*"
		goto :Ask_again
	end

	Echo $STOP & "**"
	if (CONNECTED)
		gosub :MSGS_ON
	end
	halt
:LOAD_DBASE
	#Cherokee
	setVar $DBASE[1] "_ck_" & $GAME_NAME & ".figs"
	setVar $DBASE[2] "_ck_" & $GAME_NAME & ".ports"
	setVar $DBASE[3] "_ck_" & $GAME_NAME & ".traffic"
	setVar $DBASE[4] "_ck_" & $GAME_NAME & ".warps"
	setVar $DBASE[5] "_ck_" & $GAME_NAME & ".ztmstats"
	setVar $DBASE[6] "_ck_" & $GANE_NANE & ".ships"
	#Mind Over Matter
	setVar $DBASE[7] "_MOM_" & $GAME_NAME & ".bot"
	setVar $DBASE[8] "_MOM_" & $GAME_NAME & ".limps"
	setVar $DBASE[9] "_MOM_" & $GAME_NAME & ".ships"
	setVar $DBASE[10] "_MOM_" & $GAME_NAME & "_Game_Settings.cfg"
	setVar $DBASE[11] "_MOM_" & $GAME_NAME & ".armids"
	setVar $DBASE[12] "_MOM_" & $GAME_NAME & ".figs"
	setVar $DBASE[13] "_MOM_" & $GAME_NAME & ".news"
	setVar $DBASE[14] "_MOM_" & $GAME_NAME & "_Armid_Count.cnt"
	setVar $DBASE[15] "_MOM_" & $GAME_NAME & "_Limpet_Count.cnt"
	setVar $DBASE[16] "_MOM_" & $GAME_NAME & "_Fighter_Count.cnt"
	setVar $DBASE[17] "_MOM_" & $GAME_NAME & "_dbonus-ships.txt"
	setVar $DBASE[18] "_MOM_" & $GAME_NAME & "_Bot_Users.lst"
	setVar $DBASE[19] "_MOM_" & $GAME_NAME & "Busts.txt"
	setVar $DBASE[20] "MOM_" & $GAME_NAME & "_Busts.txt"
	setVar $DBASE[21] $GAME_NAME & ".nego"
	setVar $DBASE[22] "_" & $GAME_NAME & "_FARMER.list"
	#TWX Scripts
	setVar $DBASE[23] $GAME_NAME & "_busts.txt"
	#Rammers
	setVar $DBASE[24] "Fig_Grid-" & $GAME_NAME & ".txt"
	setVar $DBASE[25] $GAME_NAME & "-Density_Reports.txt"
	#Alexio's
	setVar $DBASE[26] $GAME_NAME & "_seekout.log"
	setVar $DBASE[27] $GAME_NAME & "_probe_unreached.txt"
	setVar $DBASE[28] $GAME_NAME & "_probe_blocked.txt"
	setVar $DBASE[29] $GAME_NAME & "_probe_ships.txt"
	setVar $DBASE[30] $GAME_NAME & "_probe_blocked.txt"
	setVar $DBASE[31] $GAME_NAME & "_probe_class0.txt"
	#PHX's
	setVar $DBASE[32] $GAME_NAME & "_Macros.txt"
	#Mine
	setVar $DBASE[33] "LS_CIMeIN_" & $GAME_NAME & ".log"
	setVar $DBASE[34] "LS_CIMeIN_" & $GAME_NAME & ".txt"
	setVar $DBASE[35] "LS_" & $GAME_NAME & ".MAJ"
	setVar $DBASE[36] "LSD_" & $GAME_NAME & ".ships"
	setVar $DBASE[37] "miniZTM_" & $GAME_NAME & ".txt"
	setVar $DBASE[38] "PGrid_" & $GAME_NAME & ".log"
	setVar $DBASR[39] "ALIEN411_" & $GAME_NAME & ".txt"
	setVar $DBASE[40] "LS_"& $GAME_NAME & "_Mainfest.txt"
	setVar $DBASE[41] "LSZTM_" & $GAME_NAME & ".txt"
	setVar $DBASE[42] "LSZTM_" & $GAME_NAME & "_7Warp.txt"
	setVar $DBASE[43] "LSZTM_" & $GAME_NAME & "_Traffic.txt"
	#TWX
	setVar $DBASE[44] "warpspec.txt"
	setVar $DBASE[45] "deadends.txt"
	setVar $DBASE[46] "bubbles.txt"
	setVar $DBASE[47] $GAME_NAME & ".xdb.twx"
	#STbot
	setVar $DBASE[48] $GAME_NAME & ".stbot"
	#Elder Prophet
	setVar $DBASE[49] $GAME_NAME & "-MCIC.csv"
	setVar $DBASE[50] $GAME_NAME & "_HaggleOpt.txt"

	setVar $DBASE 50

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

:Input
	SetVar $ABC[1] "A"
	SetVar $ABC[2] "B"
	SetVar $ABC[3] "C"
	SetVar $ABC[4] "D"
	SetVar $ABC[5] "E"
	SetVar $ABC[6] "F"
	SetVar $ABC[7] "G"
	SetVar $ABC[8] "H"
	SetVar $ABC[9] "I"
	SetVar $ABC[10] "J"
	SetVar $ABC[11] "K"
	SetVar $ABC[12] "L"
	SetVar $ABC[13] "M"
	SetVar $ABC[14] "N"
	SetVar $ABC[15] "O"
	SetVar $ABC[16] "P"
	SetVar $ABC[17] "Q"
	SetVar $ABC[18] "R"
	SetVar $ABC[19] "S"
	SetVar $ABC[20] "T"
	SetVar $ABC[21] "U"
	SetVar $ABC[22] "V"
	SetVar $ABC[23] "W"
	SetVar $ABC[24] "X"
	SetVar $ABC[25] "Y"
	SetVar $ABC[26] "Z"
return


:MSGS_ON
    :ON_AGAIN
    setTextTrigger onMSGS_ON  		:onMSGS_ON "Displaying all messages."
    setTextTrigger onMSGS_OFF 		:onMSGS_OFF "Silencing all messages."
    setDelayTrigger MSGS_ON_Delay	:MSGS_ON_Delay 1000
    send "|"
    pause
    :onMSGS_OFF
    killAllTriggers
    goto :ON_AGAIN
    :onMSGS_ON
    killAllTriggers
    setVar $MSGS_ON TRUE
    return
	:MSGS_ON_Delay
	killAllTriggers
	setVar $MSGS_ON FALSE
	return
:MSGS_OFF
    :OFF_AGAIN
    setTextTrigger offMSGS_OFF 		:offMSGS_OFF "Silencing all messages."
    setTextTrigger offMSGS_ON  		:offMSGS_ON "Displaying all messages."
    setDelayTrigger MSGS_OFF_Delay	:MSGS_OFF_Delay	1000
    send "|"
    pause
    :offMSGS_ON
    killAllTriggers
    goto :OFF_AGAIN
    :offMSGS_OFF
    setVar $MSGS_ON FALSE
    killAllTriggers
    return
	:MSGS_OFF_Delay
	killAllTriggers
	setVar $MSGS_ON TRUE
	return