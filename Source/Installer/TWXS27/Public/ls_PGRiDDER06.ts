	logging	off
	reqRecording
	SetVar	$TagVersion		"1.0"
	SetVar	$TagLine		"LoneStar's M()M PGridder v" & $TagVersion
	SetVar	$TagLineB		"[PGRID]"
	setArray $FIG_GRID		SECTORS
	setArray $CHECKED		SECTORS
	setArray $HOLO_OUT		2000
	SetVar	$FIG_FILE_MOM	"_MOM_" & GAMENAME & ".figs"
	setVar	$FIG_FILE_CK	"_ck_" & GAMENAME & ".figs"
	SetVar	$FIG_FILE_RAM   "Fig_Grid-" & GAMENAME & ".txt"
	SetVar	$HOLO_TARGETS	"PGRID-" & GAMENAME & ".log"
	SetVar	$LIMIT__ORE_MIN 	10000
	SetVar	$LIMIT_TURNS_MIN	10
	setVar	$CREDITS_ON_HAND	10000
	setVar	$CREDITS_WITHDRAW	4000000
	setVar	$ClearSectors		FALSE

	setVar	$RANDOM_DEPTH_SEARCH	10
	SetVar	$Targets_Reached		0
	SetVar	$Targets_Reached_Total	0
	SetVar	$Targets_Designated		0

	LoadVar $ClearSectors
	isNumber $tst $ClearSectors
	if ($tst = 0)
		setVar $ClearSectors FALSE
	end
	LoadVar $PASSIVE_SURROUNDS
	isNumber $tst $PASSIVE_SURROUNDS
	if ($tst = 0)
		setVar $PASSIVE_SURROUNDS FALSE
	end
	LoadVar $DROP__FIGS
	If (($DROP__FIGS = 0) OR ($DROP__FIGS = ""))
		SetVar $DROP__FIGS 1
		savevar $DROP__FIGS
	end
	LoadVar $FIG__SOURCE
	If (($FIG__SOURCE = 0) OR ($FIG__SOURCE = ""))
		SetVar $FIG__SOURCE "Sector Param"
	end
	LoadVar	$DROP__ARMIDS
	isNumber $tst $DROP__ARMIDS
	If ($tst = 0)
		SetVar $DROP__ARMIDS 0
		SaveVar $DROP__ARMIDS
	end
	LoadVar	$DROP__LIMPS
	isNumber $tst $DROP__LIMPS
	If ($tst = 0)
		SetVar $DROP__LIMPS 0
		SaveVar $DROP__LIMPS
	end
	LoadVar	$GRID__METHOD
	If (($GRID__METHOD = 0) OR ($GRID__METHOD = ""))
		SetVar $GRID__METHOD "Random"
		SaveVar $GRID__METHOD
	end
	LoadVar	$GRID__FILE
	If ($GRID__FILE = 0)
		SetVar $GRID__FILE ""
		SaveVar $GRID__FILE
	end
	LoadVar	$CONTINUOUS
	If (($CONTINUOUS <> 0) AND ($CONTINUOUS <> 1))
		SetVar $CONTINUOUS FALSE
		SaveVar $CONTINUOUS
	end
	LoadVar	$FURB_MINES
	If (($FURB_MINES <> 0) AND ($FURB_MINES <> 1))
		SetVar $FURB_MINES FALSE
		SaveVar $FURB_MINES
	end
	LoadVar	$LIMIT__ORE
	If ($LIMIT__ORE < $LIMIT__ORE_MIN)
		SetVar $LIMIT__ORE $LIMIT__ORE_MIN
		SaveVar $LIMIT__ORE
	end
	LoadVar	$LIMIT__TURNS
	If ($LIMIT__TURNS < $LIMIT_TURNS_MIN)
		SetVar $LIMIT__TURNS $LIMIT_TURNS_MIN
		SaveVar $LIMIT__TURNS
	end
	LoadVar	$Planet_FIGS_MIN
	isNumber $tst $Planet_FIGS_MIN
	If ($tst = 0)
		SetVar $Planet_FIGS_MIN 0
		SaveVar $Planet_FIGS_MIN
	end

#	gosub :IS_SAVEME_ON
	gosub :quikstats

	If ($SCAN_TYPE <> "Holo")
		echo ANSI_14 "*You must have a holoscanner to run this script." ANSI_7
		halt
	end
	If ($CURRENT_PROMPT <> "Citadel")
		Echo ANSI_12 "**NEED TO BE AT CIT PROMPT!!**"
		halt
	end
	send ("'" & $TagLineB & " Powering Up & Initializing Thrusters...*")
	waitfor "Message sent on sub-space channel"
	if ($CREDITS > $CREDITS_ON_HAND)
		setVar $Deposit " TT"&($CREDITS - $CREDITS_ON_HAND)&"*"
	else
		setVar $Deposit ""
	end

	send " IC  M  A  *  :  Y  U  Y  Q " & $Deposit & " Q  T  N  L  1*  T  N  L  2*  T  N  L  3*  S  N  L  1*  S  N  L  2*  S  N  L  3*  T  N  T  1*  M  N  T  *  *  DC C ;Q "
	waitfor "Turns to Warp"
	getWord CURRENTLINE $TPW	5
	waitfor "Turns left"
	getWord CURRENTLINE $_TURNS	4
	If ($_TURNS = "Unlimited")
		SetVar $_TURNS 65000
		SetVar $_UNLIM TRUE
	else
		SetVar $_UNLIM FALSE
	end
	waitfor "Planet #"
	getWord CURRENTLINE $Planet 2
	stripText $Planet "#"
	waitfor "Fuel Ore"
	getWord CURRENTLINE $Planet_ORE 6
	stripText $Planet_ORE ","
	If ($Planet_ORE > $LIMIT__ORE)
		SetVar $LIMIT__ORE ($Planet_ORE / 2)
	end
	waitfor "Fighters        N/A"
	getWord CURRENTLINE $Planet_FIGS 5
	stripText $Planet_FIGS ","
	isNumber $tst $Planet_FIGS
	If ($tst = 0)
		SetVar $Planet_FIGS 0
	end
	waitfor "Planet has a level"
	getWord CURRENTLINE $Planet_Level 5
	isNumber $tst $Planet_Level
	If ($tst = 0)
		SetVar $Planet_Level 0
	end
	waitFor "Offensive Odds:"
	getWordPos CURRENTLINE $pos "Offensive"
	cutText CURRENTLINE $oddline $pos 99
	getText $oddline $offodd "Odds:" ":1"
	stripText $offodd " "
	stripText $offodd "."
	waitFor "Figs Per Attack:"
	getWord CURRENTLINE $figs 5
	multiply $offodd $figs
	divide $offodd 12
	waitfor "Citadel command (?=help)"

	if ($Planet_Level < 4)
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Planet Must Be At Least a Level-4**")
		halt
	end

	:Menu_Top
	Echo #27 & "[2J"
	Echo "***"
	Echo ("    "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
	Echo ANSI_15 & "*          LoneStar's P-Gridder*"
	Echo ANSI_15 & "     -/-    " & ANSI_12 & "M" & ANSI_6 & "ind " & ANSI_12 & "O" & ANSI_6 & "ver " & ANSI_12 & "M" & ANSI_6 & "atter" & ANSI_15 & "    -/-*"
	Echo ANSI_7&"              Version "&$TagVersion&"*"
	Echo ("    "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
	SetVar $CashAmount ($Planet_ORE / 400)
	gosub :CommaSize
	Echo "*    " & ANSI_7 & "Planet #" & $Planet & " Can Make " & $CashAmount & " Hops"
	If ($_UNLIM = 0)
		# adding 1 to $TPW, to account for Holo Scanning
		SetVar $Possibles ($TURNS / ($TPW + 1))
		Echo "*    " & ANSI_7 & "Turns: " & $TURNS & ", Max Increase In Grid: " & $Possibles
	end
    Echo "*    " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196
	Echo "*    " & ANSI_15 & ANSI_12 & "1 " & ANSI_15 & "- " & ANSI_5 & "Fighters To Drop   " & ANSI_14 & ": " & ANSI_15 & $DROP__FIGS
	Echo "*    " & ANSI_15 & ANSI_12 & "2 " & ANSI_15 & "- " & ANSI_5 & "Fig File Source    " & ANSI_14 & ": " & ANSI_15 & $FIG__SOURCE
	Echo "*    " & ANSI_15 & ANSI_12 & "3 " & ANSI_15 & "- " & ANSI_5 & "Limpets To Drop    " & ANSI_14 & ": " & ANSI_15 & $DROP__LIMPS
	Echo "*    " & ANSI_15 & ANSI_12 & "4 " & ANSI_15 & "- " & ANSI_5 & "Armids To Drop     " & ANSI_14 & ": " & ANSI_15 & $DROP__ARMIDS
	Echo "*    " & ANSI_15 & ANSI_12 & "5 " & ANSI_15 & "- " & ANSI_5 & "Grid Method        " & ANSI_14 & ": " & ANSI_15 & $GRID__METHOD
	If (($GRID__FILE <> "") AND ($GRID__METHOD = "Text File"))
		Echo ANSI_14 & ": " & ANSI_12 & $GRID__FILE
	end
	Echo "*    " & ANSI_15 & ANSI_12 & "6 " & ANSI_15 & "- " & ANSI_5 & "Continuous Running " & ANSI_14 & ": "
	If ($CONTINUOUS)
		Echo ANSI_15 & "Yes"
	else
		Echo ANSI_15 & "No"
	end
	Echo "*    " & ANSI_15 & ANSI_12 & "7 " & ANSI_15 & "- " & ANSI_5 & "Furb Mines         " & ANSI_14 & ": "
	If ($FURB_MINES)
		Echo ANSI_15 & "Yes"
	else
		Echo ANSI_15 & "No"
	end
	SetVar $CashAmount $LIMIT__ORE
	gosub :CommaSize
	Echo "*    " & ANSI_15 & ANSI_12 & "8 " & ANSI_15 & "- " & ANSI_5 & "Planet ORE Safety  " & ANSI_14 & ": " & ANSI_15 & $CashAmount
	SetVar $CashAmount $Planet_FIGS_MIN
	gosub :CommaSize
	Echo "*    " & ANSI_15 & ANSI_12 & "9 " & ANSI_15 & "- " & ANSI_5 & "Planet FIG Safety  " & ANSI_14 & ": " & ANSI_15 & $CashAmount
	If ($_UNLIM = 0)
		Echo "*    " & ANSI_15 & ANSI_12 & "0 " & ANSI_15 & "- " & ANSI_5 & "Turn Limit         " & ANSI_14 & ": " & ANSI_15 & $LIMIT__TURNS
	end
	Echo "*    " & ANSI_15 & ANSI_12 & "A " & ANSI_15 & "- " & ANSI_5 & "Passive Surrounds  " & ANSI_14 & ": "
	if ($PASSIVE_SURROUNDS)
		echo ANSI_15 & "Yes"
	else
		echo ANSI_15 & "No"
	end
	Echo "*    " & ANSI_15 & ANSI_12 & "B " & ANSI_15 & "- " & ANSI_5 & "Clear Hit Sectors  " & ANSI_14 & ": "
	if ($ClearSectors)
		Echo ANSI_15 & "Yes"
	else
		Echo ANSI_15 & "No"
	end
    Echo "*    " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196
	Echo "*       " & ANSI_14 & "S" & ANSI_15 & "tart Gridding      " & ANSI_14 & "Q" & ANSI_15 & "uit"
	Echo "*                                                             "
	Echo "*"
	getConsoleInput $s SINGLEKEY
	upperCase $s
	If ($s = "Q")
		Echo "**" & ANSI_12 "  Script Halted" & ANSI_15 & "**"
		send " * "
		halt
	ElseIf ($s = "1")
		getInput $s	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Number Of Figs To Drop?"
		isNumber $tst $s
		If ($tst = 0)
			SetVar $s 0
		end
		If ($s < 1)
			SetVar $s 0
		end
		SetVar $DROP__FIGS $s
		SaveVar $DROP__FIGS
	ElseIf ($s = "2")
		:Whoops_No_File
		If ($FIG__SOURCE = "Sector Param")
			SetVar $FIG__SOURCE "M()M Fig File"
			fileExists $tst $FIG_FILE_MOM
			If ($tst = 0)
				goto :Whoops_No_File
			end
		ElseIf ($FIG__SOURCE = "M()M Fig File")
			SetVar $FIG__SOURCE "Cherokee Fig File"
			fileExists $tst $FIG_FILE_CK
			If ($tst = 0)
				goto :Whoops_No_File
			end
		ElseIf ($FIG__SOURCE = "Cherokee Fig File")
			SetVar $FIG__SOURCE "Rammer Fig File"
			fileExists $tst $FIG_FILE_RAM
			If ($tst = 0)
				goto :Whoops_No_File
			end
		ElseIf ($FIG__SOURCE = "Rammer Fig File")
			SetVar $FIG__SOURCE "UpDate Fighter"
		ElseIf ($FIG__SOURCE = "UpDate Fighter")
			SetVar $FIG__SOURCE "Sector Param"
		end
		SaveVar $FIG__SOURCE
	ElseIf ($s = "3")
		getInput $s	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Number Of Limpet Mines To Drop?"
		isNumber $tst $s
		If ($tst = 0)
			SetVar $s 0
		end
		If ($s < 1)
			SetVar $s 0
		end
		If ($s > 10)
			SetVar $s 10
		end
		SetVar $DROP__LIMPS $s
		SaveVar $DROP__LIMPS
	ElseIf ($s = "4")
		getInput $s	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Number Of Armid Mines To Drop?"
		isNumber $tst $s
		If ($tst = 0)
			SetVar $s 0
		end
		If ($s < 1)
			SetVar $s 0
		end
		If ($s > 10)
			SetVar $s 10
		end
		SetVar $DROP__ARMIDS $s
		SaveVar $DROP__ARMIDS
	ElseIf ($s = "5")
		If ($GRID__METHOD = "Random")
			SetVar $GRID__METHOD "Text File"
			:Input_Another_File
			If ($GRID__FILE <> "")
				getInput $s	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Name Of Text File To Read In (Leave Blank To Use " & ANSI_15 & $GRID__FILE & ANSI_14 & ")?"
			else
				getInput $s	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Name Of Text File To Read In (Leave Blank To Cancel)?"
			end
			If (($s = "") AND ($GRID__FILE = ""))
				SetVar $GRID__METHOD "Random"
			ElseIf (($s <> "") AND ($GRID__FILE = ""))
				fileExists $tst $s
				If ($tst = 0)
					Echo "**" & ANSI_12 "  File Not Found" & ANSI_14 & ": " & ANSI_15 & $s & "**"
					SetVar $GRID__FILE ""
					SaveVar $GRID__FILE
					goto :Input_Another_File
				end
				SetVar $GRID__FILE $s
				SaveVar $GRID__FILE
			end
		ElseIf ($GRID__METHOD = "Text File")
			SetVar $GRID__METHOD "Random"
		end
		SaveVar $GRID__METHOD
	ElseIf ($s = "6")
		If ($CONTINUOUS)
			SetVar $CONTINUOUS FALSE
		else
			SetVar $CONTINUOUS TRUE
		end
		SaveVar $CONTINUOUS
	ElseIf ($s = "7")
		If ($FURB_MINES)
			SetVar $FURB_MINES FALSE
		else
			SetVar $FURB_MINES TRUE
		end
		SaveVar $FURB_MINES
	ElseIf ($s = "8")
		SetVar $CashAmount $Planet_ORE
		gosub :CommaSize
		getInput $s	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Stop If ORE Drops Below What Amount (" & ANSI_6 & "Planet Has " & $CashAmount & ANSI_14 & ")?"
		isNumber $tst $s
		If ($tst = 0)
			SetVar $s $LIMIT__ORE_MIN
		end
		If ($s > $Planet_ORE)
			SetVar $s $Planet_ORE
		ElseIf ($s < 1)
			SetVar $s $LIMIT__ORE_MIN
		end
		SetVar $LIMIT__ORE $s
		SaveVar $LIMIT__ORE
	ElseIf ($s = "9")
		SetVar $CashAmount $Planet_FIGS
		gosub :CommaSize
		getInput $s	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Stop When Planet Fighters Drop Below (" & ANSI_6 & "Panet Has " & $CashAmount & ANSI_14 & " Fighters)?"
		isNumber $tst $s
		If ($tst = 0)
			SetVar $s 0
		end
		If ($s > $Planet_FIGS)
			SetVar $s $Planet_FIGS
		end
		If ($s < 1)
			SetVar $s 0
		end
		SetVar $Planet_FIGS_MIN $s
		SaveVar $Planet_FIGS_MIN
	ElseIf (($s = "0")  AND ($_UNLIM = 0))
		SetVar $CashAmount $TURNS
		gosub :CommaSize
		getInput $s	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Stop When TURNS Drop Below (" & ANSI_6 & "You Have " & $CashAmount & ANSI_14 & " Turns)?"
		isNumber $tst $s
		If ($tst = 0)
			SetVar $s $LIMIT_TURNS_MIN
		end
		If ($s > $TURNS)
			SetVar $s $TURNS
		end
		If ($s < 1)
			SetVar $s $LIMIT_TURNS_MIN
		end
		SetVar $LIMIT__TURNS $s
		SaveVar $LIMIT__TURNS
	ElseIf ($s = "A")
		if ($PASSIVE_SURROUNDS)
			setVar $PASSIVE_SURROUNDS FALSE
		else
			setVar $PASSIVE_SURROUNDS TRUE
		end
		SaveVar $PASSIVE_SURROUNDS
	ElseIf ($s = "B")
		if ($ClearSectors)
			setVar $ClearSectors FALSE
		else
			setVar $ClearSectors TRUE
		end
		if ((PASSWORD = "") OR (PASSWORD = "0"))
			setVar $ClearSectors FALSE
		end
		SaveVar $ClearSectors
	ElseIf ($s = "S")
		goto :Engage_Warp_Engines
	else
		Echo #27 & "[2K" & #27 & "[1A"
	end
	goto :Menu_Top


    #=--------                                                                       -------=#
     #=------------------------------     MAIN  ROUTINES     ------------------------------=#
    #=--------                                                                       -------=#

:Engage_Warp_Engines
	killAllTriggers
	SetVar $Fig_CNT	0
	SetVar $idx 11

    echo ("*"&ANSI_7&"<"&ANSI_15&"Reading Fig Files"&ANSI_7&">*")
	If ($FIG__SOURCE = "Sector Param")
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Reading Sector Parameters...**")
		while ($idx <= SECTORS)
			getSectorParameter $idx "FIGSEC" $flag
			isNumber $tst $flag
			If ($tst <> 0)
				If ($flag > 0)
					SetVar $FIG_GRID[$idx] 1
					add $Fig_CNT 1
				end
			end
			add $idx 1
		end
	ElseIf ($FIG__SOURCE = "M()M Fig File")
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Reading M()M Fig File...**")
		readToArray $FIG_FILE_MOM $FIG_GRID
		while ($idx <= SECTORS)
			If ($FIG_GRID[$idx] <> 0)
				add $Fig_CNT 1
			end
			add $idx 1
		end
    ElseIf ($FIG__SOURCE = "Cherokee Fig File")
   		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Reading Cherokee's Fig File...**")
		readToArray $FIG_FILE_CK $Read
		while ($idx <= SECTORS)
			getWord $Read[1] $fig_check $idx
			If ($fig_check <> 0)
				SetVar $FIG_GRID[$idx] 1
				add $Fig_CNT 1
			end
	    	add $idx 1
		end
		SetVar $Read[1] "Getting Back Memory :)"
	ElseIf ($FIG__SOURCE = "Rammer Fig File")
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Reading Rammer's Fig File...**")
		readToArray $FIG_FILE_RAM $Read
		while ($idx <= SECTORS)
			getWord $Read[2] $fig_check $idx
			If ($fig_check <> 0)
				SetVar $FIG_GRID[$idx] 1
				add $Fig_CNT 1
			end
	    	add $idx 1
		end
		SetVar $Read[2] "Getting Back Memory :)"
	ElseIf ($FIG__SOURCE = "UpDate Fighter")
		killAllTriggers
		SetVar $Fig_Count	0
		SetVar $Tot_Count	0
		send "'" & $TagLineB & " - Scanning Deployed Fighters...* Q Q G"
		killAllTriggers
		waitfor "==========================================================="
		setTextLineTrigger FigLine1		:AddInFigC	" Corp "
		setTextLineTrigger FigLine2		:AddInFigP	" Personal "
		setTextLineTrigger LstBottom	:LstBottom	" Total "
		setTextLineTrigger LstNone		:LstBottom	"No fighters deployed"
		pause
		:AddInFigP
			getWord CURRENTLINE $sector 1
			getWord CURRENTLINE $amount 2
			replaceText $amount "T" "000"
			replaceText $amount "M" "000000"
			striptext $amount ","
			isNumber $tst $sector
			if ($tst = 1)
				if (($sector > 1) AND ($sector < SECTORS))
					setVar $FIG_GRID[$sector] 1
					add $Tot_Count $amount
					add $Fig_Count 1
				end
			end
			setTextLineTrigger FigLine2		:AddInFigP	" Personal "
			pause
		:AddInFigC
			getWord CURRENTLINE $sector 1
			getWord CURRENTLINE $amount 2
			replaceText $amount "T" "000"
			replaceText $amount "M" "000000"
			striptext $amount ","
			isNumber $tst $sector
			if ($tst = 1)
				if (($sector > 1) AND ($sector < SECTORS))
					setVar $FIG_GRID[$sector] 1
					add $Tot_Count $amount
					add $Fig_Count 1
				end
			end
			setTextLineTrigger FigLine1		:AddInFigC	" Corp "
			pause
		:LstBottom
			killAllTriggers
			setVar $fig_str ""
			SetVar $CashAmount $Tot_Count
			gosub :CommaSize
	    	setVar $fig_str ("'" & $TagLineB & " - " & $CashAMount & " Fighters Deployed Across ")
			SetVar $CashAmount $Fig_Count
			gosub :CommaSize
			setVar $fig_str ($fig_str & $CashAmount & " Sectors!*")
			send ("L Z" & #8 & $Planet & "* * J C * " & $fig_str)
			waitfor "Message sent on sub-space channel"
			waitfor "Citadel command (?"
	end

	# Calculate Total Number Of Hops Planet Will be making based on $LIMIT__ORE
	SetVar $Hop_Along (($Planet_ORE - $LIMIT__ORE) / 400)

	SetVar $CashAmount $Fig_CNT
	gosub :CommaSize
	Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " " & $CashAmount & " Fig'd Sectors Loaded**")

    echo ("*"&ANSI_7&"<"&ANSI_15&"Avoid Sector Check"&ANSI_7&">*")
	gosub :checkAvoidedSectors
	gosub :quikstats
	SetVar $RUN_ONCE	TRUE

	:WE_ARE_RUNNING_CONTINUOUS
	add	$Targets_Reached_Total	$Targets_Reached
	SetVar $TARGETS		" "
	SetVar $TARGET_CNT	0

	If ($GRID__METHOD = "Text File")
		if ($RUN_ONCE)
			Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Reading Target File List...**")
			readToArray $GRID__FILE $BUXOM_TARGETS
			SetVar $RUN_ONCE FALSE
		else
			send  ("'" & $TagLineB & " Reading Target File List For More Targets...*")
		end
		setVar $i 1
		while ($i <= $BUXOM_TARGETS)
			setVar $Focus $BUXOM_TARGETS[$i]
			isNumber $tst $Focus
			if ($tst = 1)
				if ($Focus > 0)
	            	getWordPos $avoidedSectors $pos " "&$Focus&" "
		        	if (($FIG_GRID[$Focus] = 0) AND ($Focus > 10) AND ($Focus <> STARDOCK) AND ($pos = 0))
						setVar $adjs 1
						while (SECTOR.WARPS[$Focus][$adjs] > 0)
							setVar $Adj_Focus SECTOR.WARPS[$Focus][$adjs]
							if ($FIG_GRID[$Adj_Focus] <> 0)
								setVar $TARGETS ($TARGETS & $Focus & " ")
								add $TARGET_CNT 1
								goto :Move_Along_Nothing_2C
							end
							add $adjs 1
						end
						:Move_Along_Nothing_2C
					end
				else
					setVar $BUXOM_TARGETS[$i] 0
				end
	        else
            	setVar $BUXOM_TARGETS[$i] 0
	        end
			add $i 1
		end
	else
		if ($RUN_ONCE)
			Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Generating Random Target List...**")
			SetVar $RUN_ONCE FALSE
		else
			send  ("'" & $TagLineB & " Generating More Random Targets...*")
		end
		SetVar $idx 11

		while ($idx <= SECTORS)
			If ($FIG_GRID[$idx] <> 0)
				SetVar $adjs 1
				while (SECTOR.WARPS[$idx][$adjs] > 0)
					SetVar $Focus SECTOR.WARPS[$idx][$adjs]
					If (($CHECKED[$Focus] = 0) AND ($FIG_GRID[$Focus] = 0))
						getWordPos $avoidedSectors $pos " "&$Focus&" "
						If (($Focus <> STARDOCK) AND ($Focus > 10) AND ($pos = 0))
							SetVar $CHECKED[$Focus] 1
							SetVar $TARGETS ($TARGETS & $Focus & " ")
							add $TARGET_CNT 1
						end
					end
                	add $adjs 1
				end
			end
        	add $idx 1
		end
	end

	#	Have Target list and Avoided sector list. Time wreak havock!!
	If ($TARGET_CNT = 0)
		send ("'" & $TagLineB & " No Targets Found. Update CIM or Fig List.*")
		gosub :GRIDDING_RESULTS
		halt
	else
		add $Targets_Designated $TARGET_CNT
		SetVar $CashAmount $TARGET_CNT
		gosub :CommaSize
		if ($_UNLIM)
			send ("'*" & $TagLine & " - Attempting To Reach " & $CashAmount & " Targets.*")
		else
			send ("'*" & $TagLine & " - Attempting To Reach " & $CashAmount & " Targets with " & $TURNS & " Turns.*")
		end
		if ($LIMIT__ORE > 0)
			send "    Planet ORE Safety Limit : " & $LIMIT__ORE & "*"
		end
		if ($Planet_FIGS_MIN > 0)
			send "    Planet FIG Safety Limit : " & $Planet_FIGS_MIN & "*"
		end
		if ($DROP__FIGS >= 0)
			send "    Deploying Fighters: " & $DROP__FIGS & "*"
		end
		if ($DROP__ARMIDS > 0)
			send "              Armids  : " & $DROP__ARMIDS & "*"
		end
		if ($DROP__LIMPS > 0)
			send "              Limpets : " & $DROP__LIMPS & "*"
		end
		if ($FURB_MINES)
			send "    Furbing Mines     : Yes*"
		end
		if ($PASSIVE_SURROUNDS)
			send "    Passive Surrounds : Active*"
		end
		if ($CONTINUOUS)
			send "    Continuous Mode   : Active*"
		end
		if (($LIMIT__TURNS > 0) AND ($_UNLIM = 0))
			send "    Turn Limit        : " & $LIMIT__TURNS & "*"
		end
		send "**  "
	end

	while (TRUE)
		gosub :quikstats

		If ($_UNLIM = 0)
			echo ("*"&ANSI_7&"<"&ANSI_15&"Checking Turns: "&ANSI_14&$TURNS&ANSI_7&">*")
			If ($TURNS = 0)
				send "'" & $TagLineB & " Turns Are At Zero. Migth Have Been Photond.* "
				gosub :GRIDDING_RESULTS
				halt
			elseif ($TURNS <= $LIMIT__TURNS)
				send "'" & $TagLineB & " Low Turn Limit Reached. Halting.* "
				gosub :GRIDDING_RESULTS
				halt
			end
		else
			echo ("*"&ANSI_7&"<"&ANSI_15&"Checking Turns: "&ANSI_14&"Unlimited"&ANSI_7&">*")
		end

		If ($Planet_FIGS <= $Planet_FIGS_MIN)
			Send "'" & $TagLineB & " Planet Fighter Level Reached. Halting.* "
			gosub :GRIDDING_RESULTS
			halt
		end

		echo ("*"&ANSI_7&"<"&ANSI_15&"Next Target: "&ANSI_14&$Next_Target&ANSI_7&">*")
		If (($LIMPETS <= $DROP__LIMPS) OR ($ARMIDS <= $DROP__ARMIDS))
			if ($FURB_MINES)
				gosub :Do_The_Furb
			end
		else
		end

		SetVar $FIGGIES $FIGHTERS
		echo ("*"&ANSI_7&"<"&ANSI_15&"Getting Taget"&ANSI_7&">*")
		gosub :Get_Next_Target

		gosub :Take_Out_Sector
		SetVar $Planet_FIGS ($Planet_FIGS - ($FIGGIES - $FIGHTERS))
		# Keeping Track
		add $Targets_Reached 1

	end
	halt

    #=--------                                                                       -------=#
     #=------------------------------      SUB ROUTINES      ------------------------------=#
    #=--------                                                                       -------=#

:Take_Out_Sector
	SetVar $mac ("* * Z A " & $Figs & "*  *  F  Z  "&$DROP__FIGS&"*  Z C D  *  ")
	SetVar $MINES_Str ""

	If (($DROP__ARMIDS <> 0) AND ($ARMIDS >= $DROP__ARMIDS))
		SetVar $MINES_Str (" H  1  Z  " & $DROP__ARMIDS & "*  Z  C  *  ")
	end
	If (($DROP__LIMPS <> 0) AND ($LIMPETS >= $DROP__LIMPS))
		SetVar $MINES_Str ($MINES_Str & " H  2  Z  " & $DROP__LIMPS & "*  Z  C  *  ")
	end

    setVar $Line_Pointer 1
	send ("Q  Q  " & $MINES_Str & "  SDSZH* L " & $Planet & "* C ")
	setTextLineTrigger	DoneScan		:DoneScan		"Warps to Sector(s) :"
	waitFor "Relative Density Scan"
	waitfor "Long Range Scan"
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

	waitFor "]:[" & $CURRENT_SECTOR & "] (?="

	setVar $Holo_i 1
	setVar $Holo_ptr 1
	setVar $Holo_s ""
	while (SECTOR.WARPS[$CURRENT_SECTOR][$Holo_i] > 0)
		setVar $Holo_adj SECTOR.WARPS[$CURRENT_SECTOR][$Holo_i]
		if ((SECTOR.PLANETCOUNT[$Holo_adj] > 0) OR (SECTOR.TRADERCOUNT[$Holo_adj] > 0) OR (SECTOR.SHIPCOUNT[$Holo_adj] > 0) OR (SECTOR.FIGS.QUANTITY[$Holo_adj] >= $offodd))
			while ($Holo_ptr <= $Line_Pointer)
            	getWordPos $HoloOutput[$Holo_ptr] $Holo_pos ("Sector  : " & $Holo_adj)
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
		:Done_Scan
    	add $Holo_i 1
	end
	SetVar	$HOLO_TARGETS	"PGRID-" & GAMENAME & ".log"
	if ($Holo_s <> "")
		send "'*" & $TagLineB & "SCAN RESULTS----------------------[ADJ SECTOR: " & $CURRENT_SECTOR & "*"
		send $Holo_s & "* "
		waitfor "Sub-space comm-link terminated"
		write $HOLO_TARGETS $Holo_s
	end

    if ($PASSIVE_SURROUNDS)
		echo ("**"&ANSI_7&"<"&ANSI_15&"Preparing for Surround"&ANSI_7&">*")
		setVar $mineOwner SECTOR.MINES.OWNER[$Is_Figd]
		setVar $limpOwner SECTOR.LIMPETS.OWNER[$Is_Figd]
		if ((($limpOwner = "belong to your Corp") OR ($limpOwner = "yours")) AND (($mineOwner = "belong to your Corp") OR ($mineOwner = "yours")))
			gosub :surround
		end
	end

	getDistance $distance $CURRENT_SECTOR $Next_Target
	if ($FIG_GRID[$Next_Target] > 0)
		echo ("*"&ANSI_7&"<"&ANSI_15&"Surround Hit Intended Target: "&ANSI_14&$Next_Target&ANSI_7&">*")
	elseIf ((SECTOR.PLANETCOUNT[$Next_Target] <= 0) and (SECTOR.TRADERCOUNT[$Next_Target] <= 0) and ($distance = 1) and ($Next_Target > 10) and ($Next_Target <> STARDOCK) and (SECTOR.FIGS.QUANTITY[$Next_Target] < $offodd))
		SetVar $savetarget $Next_Target
		If ($savetarget < 10)
			SetVar $savetarget "0000" & $savetarget
		ElseIf ($savetarget < 100)
			SetVar $savetarget "000" & $savetarget
		ElseIf ($savetarget < 1000)
			SetVar $savetarget "00" & $savetarget
		ElseIf ($savetarget < 10000)
			SetVar $savetarget "0" & $savetarget
		end
        gosub :IS_SAVEME_ON

	    if ($PASSIVE_SURROUNDS)
   			echo ("*"&ANSI_7&"<"&ANSI_15&"Pausing Before PGRID"&ANSI_7&">*")
			send ("'" & $savetarget & "=saveme*")
			waitfor "Message sent on sub-space channel"
			send (" Q  M  N  T  *  Q  M Z " & $Next_Target & $mac)
		else
			send ("'" & $savetarget & "=saveme* Q  M  N  T  *  Q M Z " & $Next_Target & $mac)
		end

		:land_now
		killtrigger at_planet
		killtrigger no_planet
		setTextTrigger at_planet :at_planet "Planet command (?=help)"
		setTextTrigger no_planet :no_planet "Average Interval Lag:"
		setVar $land_idx 1
		while ($land_idx <= 15)
		     send "L J " & #8 & #8 & $planet & " * * "
		     add $land_idx 1
		end
		send "@"
		pause
		# Where's the planet?
		:no_planet
		killtrigger at_planet
		killtrigger no_planet
		send " N N Z A 99999 * Z A 99999 * < N N R * f z 1 * z c d * /"
		waitFor #179
		setVar $line CURRENTLINE
		replacetext $line #179 " "
		getWord $line $current_sector 2
		goto :callSaveMe

		# We reached the planet, kill the other trigger
		:at_planet
		killtrigger at_planet
		killtrigger no_planet
		send " j  m  *  *  *  c  "
		waitFor "Citadel command (?=help)"
		SetVar $FIG_GRID[$Next_Target] 1

	ElseIf (SECTOR.PLANETCOUNT[$Next_Target] > 0)
		SetVar $avoidedSectors ($avoidedSectors&" "&$Next_Target&" ")
		SetVar $i 1
	ElseIf (SECTOR.TRADERCOUNT[$Next_Target] > 0)
		SetVar $avoidedSectors ($avoidedSectors&" "&$Next_Target&" ")
	ElseIf ($distance <> 1)
	ElseIf ($Next_Target <= 10) or ($Next_Target = STARDOCK)
		SetVar $avoidedSectors ($avoidedSectors&" "&$Next_Target&" ")
	ElseIf (SECTOR.FIGS.QUANTITY[$Next_Target] > $offodd)
		SetVar $avoidedSectors ($avoidedSectors&" "&$Next_Target&" ")
	else
		SetVar $avoidedSectors $avoidedSectors&" "&$Next_Target&" "
	end

	gosub :quikstats
	if ($ClearSectors)
		send " Q Q Q Z N * "
		gosub :clear_sector
		send " **  L Z" & #8 & $Planet & "*  *  J  C *  "
	end
	return

:Get_Next_Target
	setVar $Target_Attempt 0
	:Another_Attempt
	getRnd $Target_PTR 1 $TARGET_CNT
	getWord $TARGETS $Next_Target $Target_PTR
	If ($Next_Target = 0)
		If ($CONTINUOUS)
			goto :WE_ARE_RUNNING_CONTINUOUS
		end
		send ("'" & $TagLineB & " Out Of Targets. Update CIM or Fig List.**")
		gosub :GRIDDING_RESULTS
		halt
	elseif ($GRID__METHOD = "Random")
		getDistance $Distal $CURRENT_SECTOR $Next_Target
		if ($Distal < 1)
			send "^F*" & $Next_Target & "*q"
			waitFor "ENDINTERROG"
			getDistance $Distal $CURRENT_SECTOR $Next_Target
			if (($Distal < 0) OR ($Distal > $RANDOM_DEPTH_SEARCH))
				if ($Target_Attempt < 1000)
					add $Target_Attempt 1
					goto :Another_Attempt
				else
					echo ("*"&ANSI_7&"<"&ANSI_15&"Unable To Find Target Within " & $RANDOM_DEPTH_SEARCH & " Hops after 1000 attempts"&ANSI_7&">*")
				end
			end
		elseif ($Distal > $RANDOM_DEPTH_SEARCH)
			if ($Target_Attempt < 1000)
				add $Target_Attempt 1
				goto :Another_Attempt
			else
				echo ("*"&ANSI_7&"<"&ANSI_15&"Unable To Find Target Within " & $RANDOM_DEPTH_SEARCH &" Hops after 1000 attempts"&ANSI_7&">*")
			end
		end
	end

	replaceText $TARGETS (" " & $Next_Target & " ") " "
	subTract $TARGET_CNT 1

	SetVar $i 1

	while (SECTOR.WARPS[$Next_Target][$i] > 0)
		SetVar $Is_Figd SECTOR.WARPS[$Next_Target][$i]
		If ($FIG_GRID[$Is_Figd] <> 0)
			getDistance $distanceThere $Is_Figd $CURRENT_SECTOR
			getDistance $distanceBack $CURRENT_SECTOR $Is_Figd
			If ($distanceThere < 0)
				send "^f"&$current_sector&"*"&$TestSector&"*q"
				waitOn "ENDINTERROG"
				getDistance $distanceThere $Is_Figd $Next_Target
			end
			If ($distanceBack < 0)
				send "^f"&$TestSector&"*"&$current_sector&"*q"
				waitOn "ENDINTERROG"
				getDistance $distanceBack $Next_Target $Is_Figd
			end
			If ($distanceThere < 3)
				#Next Target Was Too Close.. Trying Another
				if ($GRID__METHOD = "Random")
					goto :Get_Next_Target
				else

				end
			end
			send "p " & $Is_Figd & "*y"
			setTextLineTrigger Hop_Calc			:HopCalc		"hops away from here."
			setTextLineTrigger pwarpNoMove		:pwarpNoMove	"You are already in that sector!"
			setTextLineTrigger pwarpNoShip1		:pwarpNoShip1	"You do not have any fighters in Sector "
			setTextLineTrigger pwarpYesShip1	:pwarpYesShip1	" Planetary TransWarp Drive Engaged! "
			setTextLineTrigger pwarpNoFuel1		:pwarpNoFuel1	"You do not have enough Fuel Ore on this planet to make the jump."
			pause
			:HopCalc
				getWord CURRENTLINE $Distal 4
				isNumber $tst $Distal
				If ($tst = 0)
					SetVar $Distal 10
				end
				# Adding 1 Hop to accont for Pgrid into Adjacent
				add $Distal 1
				If ($Distal > $Hop_Along)
					send "'" & $TagLineB & " Planet ORE Safety Level Has Been Reached.*"
					gosub :GRIDDING_RESULTS
					halt
				end
				pause
			:pwarpNoFuel1
				Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Not Enough Fuel To Move Planet Adj Next Target.**")
				halt
			:pwarpNoMove
			:pwarpYesShip1
				killAllTriggers
				SetVar $Hop_Along ($Hop_Along - $Distal)
				gosub :quikstats
				goto :Target_Aquired
			:pwarpNoShip1
				killAllTriggers
				Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Fighter Not Found.**")
				SetVar $FIG_GRID[$Is_Figd] 0
		end
		add $i 1
	end
	# Wasnt able to use $Next_Target, finding another
	goto :Get_Next_Target
    :Target_Aquired
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
		If ($pos > 0)
			SetVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt1 :allPrompts "(?="
		pause
	:secondaryPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		If ($pos > 0)
			SetVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt2 :secondaryPrompts "(?)"
		pause
	:terraPrompts
		killtrigger prompt3
		killtrigger prompt4
		getWord currentansiline $checkPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		If ($pos > 0)
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
		If ($pos > 0)
			goto :gotStats
		else
			setTextLineTrigger getLine2 :statsline
			pause
		end

	:gotStats
		SetVar $stats $stats & " @@@"

		SetVar $current_word 0
		while ($wordy <> "@@@")
			If ($wordy = "Sect")
				getWord $stats $CURRENT_SECTOR   	($current_word + 1)
			ElseIf ($wordy = "Turns")
				getWord $stats $TURNS  				($current_word + 1)
			ElseIf ($wordy = "Creds")
				getWord $stats $CREDITS  			($current_word + 1)
			ElseIf ($wordy = "Figs")
				getWord $stats $FIGHTERS   			($current_word + 1)
			ElseIf ($wordy = "Shlds")
				getWord $stats $SHIELDS  			($current_word + 1)
			ElseIf ($wordy = "Hlds")
				getWord $stats $TOTAL_HOLDS   		($current_word + 1)
			ElseIf ($wordy = "Ore")
				getWord $stats $ORE_HOLDS    		($current_word + 1)
			ElseIf ($wordy = "Org")
				getWord $stats $ORGANIC_HOLDS    	($current_word + 1)
			ElseIf ($wordy = "Equ")
				getWord $stats $EQUIPMENT_HOLDS    	($current_word + 1)
			ElseIf ($wordy = "Col")
				getWord $stats $COLONIST_HOLDS    	($current_word + 1)
			ElseIf ($wordy = "Phot")
				getWord $stats $PHOTONS   			($current_word + 1)
			ElseIf ($wordy = "Armd")
				getWord $stats $ARMIDS   			($current_word + 1)
			ElseIf ($wordy = "Lmpt")
				getWord $stats $LIMPETS   			($current_word + 1)
			ElseIf ($wordy = "GTorp")
				getWord $stats $GENESIS 	 		($current_word + 1)
			ElseIf ($wordy = "TWarp")
				getWord $stats $TWARP_TYPE  		($current_word + 1)
			ElseIf ($wordy = "Clks")
				getWord $stats $CLOAKS   			($current_word + 1)
			ElseIf ($wordy = "Beacns")
				getWord $stats $BEACONS 			($current_word + 1)
			ElseIf ($wordy = "AtmDt")
				getWord $stats $ATOMIC  			($current_word + 1)
			ElseIf ($wordy = "Corbo")
				getWord $stats $CORBO   			($current_word + 1)
			ElseIf ($wordy = "EPrb")
				getWord $stats $EPROBES 	  		($current_word + 1)
			ElseIf ($wordy = "MDis")
				getWord $stats $MINE_DISRUPTORS   	($current_word + 1)
			ElseIf ($wordy = "PsPrb")
				getWord $stats $PSYCHIC_PROBE  		($current_word + 1)
			ElseIf ($wordy = "PlScn")
				getWord $stats $PLANET_SCANNER  	($current_word + 1)
			ElseIf ($wordy = "LRS")
				getWord $stats $SCAN_TYPE    		($current_word + 1)
			ElseIf ($wordy = "Aln")
				getWord $stats $ALIGNMENT    		($current_word + 1)
			ElseIf ($wordy = "Exp")
				getWord $stats $EXPERIENCE    		($current_word + 1)
			ElseIf ($wordy = "Corp")
				getWord $stats $CORP  	 			($current_word + 1)
			ElseIf ($wordy = "Ship")
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

:checkAvoidedSectors
	SetVar $avoidedSectors ""
	:readAvoidedList
		setTextLineTrigger getLine1 :getAvoids
		send "cxq"
		pause
	:keepCountingAvoids
		killAllTriggers
		setTextLineTrigger getLine :getAvoids
		pause
	:getAvoids
		killAllTriggers
		SetVar $workingText CURRENTLINE
		getWordPos $workingText $pos "<Computer deactivated>"
		If ($pos > 0)
			goto :doneAvoids
		end
		getWordPos $workingText $pos "Computer"
		If ($pos > 0)
			goto :keepCountingAvoids
		end
		If (CURRENTLINE = "")
			goto :KeepCountingAvoids
		end
		getWordPos $workingText $pos "<List Avoided Sectors>"
		If ($pos > 0)
			goto :keepCountingAvoids
		end
		getWordPos $workingText $pos "No Sectors are currently being avoided."
		If ($pos > 0)
			goto :doneAvoids
		end
		getWordPos $workingText $pos "Citadel"
		If ($pos > 0)
			goto :keepCountingAvoids
		end
		SetVar $workingText $workingText&" +++"
		getWord $workingText $avoid 1
		getWordPos $workingText $pos $avoid

		while ($avoid <> "+++")
			SetVar $avoidedSectors $avoidedSectors&" "&$avoid&" "
			getLength $avoid $length
			getLength $workingText $checkLength
			cutText $workingText $workingText ($pos+$length) 9999
			getWord $workingText $avoid 1
			getWordPos $workingText $pos $avoid
		end
		goto :keepCountingAvoids

	:doneAvoids
return

:IS_SAVEME_ON
	send "'script?*"
	waitfor "Message sent on sub-space channel"
	setTextLineTrigger		SaveMe_Yes	:SaveMe_Yes		"----End of List---"
	setDelayTrigger			SaveMe_No	:SaveMe_No		3000
	pause
	:SaveMe_No
		killAllTriggers
		Send ("'" & $TagLineB &" No Response After 3 Seconds - A PGrid Enternity!!*")
		halt
	:SaveMe_Yes
		killAllTriggers

	return

:UPDATE_FIG_LIST
	if ($FIG__SOURCE <> "UpDate Fighter")
		Send ("'" & $TagLineB &" Updating " & $FIG__SOURCE & "*")
		setVar $figgies ""
		setVar $idx 11
		If ($FIG__SOURCE = "Sector Param")
			while ($idx <= SECTORS)
				setSectorParameter $idx "FIGSEC" $FIG_GRID[$idx]
				add $idx 1
			end
		ElseIf ($FIG__SOURCE = "M()M Fig File")
			Delete $FIG_FILE_MOM
			while ($idx <= SECTORS
				if ($FIG_GRID[$idx] < 1)
					setVar $figgies ($figgies&"0*")
				else
					setVar $figgies ($figgies&"1*")
				end
				add $idx 1
			end
			write $FIG_FILE_MOM $figgies
	    ElseIf ($FIG__SOURCE = "Cherokee Fig File")
			Delete $FIG_FILE_CK
			setVar $idx 1
			while ($idx <= SECTORS)
				if ($FIG_GRID[$idx] < 1)
					setVar $figgies ($figgies & "0 ")
				else
					setVar $figgies ($figgies & $idx & " ")
				end
				add $idx 1
			end
			write $FIG_FILE_CK $figgies
		ElseIf ($FIG__SOURCE = "Rammer Fig File")
			getTime $timestamp "h:nn:ss am/pm"
			getTime $datestamp "m/d/yyyy"
			setVar $stampy $timestamp & ", " & $datestamp
			delete $FIG_FILE_RAM
			while ($idx <= SECTORS)
				if ($FIG_GRID[$idx] < 1)
					setVar $figgies ($figgies & "0 ")
				else
					setVar $figgies ($figgies & "1 ")
				end
		    	add $idx 1
			end
			write $FIG_FILE_RAM $figgies
		end
	end
	return


:surround
	gosub :quikstats
	if ($PHOTONS > 0)
		echo ("*"&ANSI_7&"<"&ANSI_15&"Carrying Photons, Cannot Surround: "&ANSI_14&$PHOTONS&ANSI_7&">*")
		return
	end
	setVar $surroundString ""
	setVar $surroundOutput ""
    setVar $yourOwnCount 0
    setVar $surround_i 1
	while (SECTOR.WARPS[$CURRENT_SECTOR][$surround_i] > 0)
		setVar $adj_sec SECTOR.WARPS[$CURRENT_SECTOR][$surround_i]
		getDistance $distance $adj_sec $current_sector
		if ($distance <= 0)
			send "^f"&$adj_sec&"*"&$current_sector&"*q"
			waitOn "ENDINTERROG"
			getDistance $distance $adj_sec $current_sector
		end
		setVar $containsShieldedPlanet FALSE
		setVar $p 1
		while ($p <= SECTOR.PLANETCOUNT[$adj_sec])
			getWord SECTOR.PLANETS[$adj_sec][$p] $test 1
			if ($test = "<<<<")
				setVar $containsShieldedPlanet TRUE
			end
			add $p 1
		end
       	setVar $figOwner SECTOR.FIGS.OWNER[$ADJ_SEC]
		setVar $mineOwner SECTOR.MINES.OWNER[$ADJ_SEC]
		setVar $limpOwner SECTOR.LIMPETS.OWNER[$ADJ_SEC]
		#if ($ADJ_SEC = $Next_Target)
		#	#ignore Sector we're about to hit
		if (($figOwner = "belong to your Corp") OR ($figOwner = "yours"))
			#ignore your own figs
			add $yourOwnCount 1
			if ($yourOwnCount = $totalWarps)
				setVar $surroundOutput $surroundOutput&"(Surround) All sectors around are friendly fighters.*"
			end
		elseif (SECTOR.FIGS.QUANTITY[$ADJ_SEC] >= $offodd)
				setVar $surroundOutput "Too Many Figs"
		elseif (($adj_sec <= 10) OR ($adj_Sec = $STARDOCK))
				setVar $surroundOutput "Fed Space"
		elseif ((SECTOR.PLANETCOUNT[$ADJ_SEC] > 0) AND ($surroundAvoidAllPlanets))
				setVar $surroundOutput "Avoiding Planets"
		elseif (($containsShieldedPlanet) AND ($surroundAvoidShieldedOnly))
				setVar $surroundOutput "Shielded Planets"
		elseif ($distance > 1)
				setVar $surroundOutput "To Far"
		elseif ((((SECTOR.ANOMALY[$ADJ_SEC] = TRUE) AND (($limpOwner <> "belong to your Corp") AND ($limpOwner <> "yours"))) OR (SECTOR.FIGS.QUANTITY[$ADJ_SEC] > 0) OR ((SECTOR.MINES.QUANTITY[$ADJ_SEC] > 0) AND (($mineOwner <> "belong to your Corp") AND ($mineOwner <> "yours")))))
				setVar $surroundOutput "Too Much Stuff"
		else
			setVar $surroundString $surroundString&" m z "&$adj_sec&"* z a "&$figs&"* * "
			if (($DROP__FIGS > 0) AND ($FIGHTERS > $DROP__FIGS))
				setVar $surroundString $surroundString&"f z" & $DROP__FIGS & "*  z  c  d  *  "
				subtract $FIGHTERS $surroundFigs
				setVar $FIG_GRID[$adj_sec] 1
			end
			if (($DROP__LIMPS > 0) AND ($LIMPETS > $DROP__LIMPS) AND ($LIMPETS > 0))
				setVar $surroundString $surroundString&"  h  2  z" & $DROP__LIMPS & "*  z  c  *   "
				subtract $LIMPETS $DROP__LIMPS
			end
			if (($DROP__ARMIDS > 0) AND ($ARMIDS > $DROP__ARMIDS) AND ($ARMIDS > 0))
				setVar $surroundString $surroundString&"  h  1 z" & $DROP__ARMIDS & "*  z  c  *   "
				subtract $ARMIDS $DROP__ARMIDS
			end
			setVar $surroundString $surroundString&"m z"&$current_Sector&"*  "
			setVar $surroundString $surroundString&"za "&$figs&"* * "
			if ($ADJ_SEC = $Next_Target)
				setVar $FIG_GRID[$ADJ_SEC] 1
			end
			add $Targets_Reached_Total 1
		end
		add $surround_i 1
	end
	if ($surroundOutput = "")
		echo ("*"&ANSI_7&"<"&ANSI_15&"Doing Surround..."&ANSI_7&">*")
		send ("c v 0* y* "&$CURRENT_SECTOR&"* q q q " & $surroundString & " L Z" & #8 & $Planet & "* * J C * '" & $TagLineB & " - Surrounded sector "&$current_sector&".*")
		setTextLineTrigger surroundmessage :continuesurroundmessage  " - Surrounded sector "&$current_sector&"."
		pause
		:continuesurroundmessage
		setVar $current_sector_t $current_sector
		gosub :quikstats
		if ($CURRENT_SECTOR <> $current_sector)
			send "'" & $current_sector & "=saveme*"
			setTextLineTrigger	HelpArrived	:HelpArrived	"Saveme script activated - Planet " & $Planet & " to " & $CURRENT_SECTOR & " on attempt"
			setDelayTrigger		Ummmm		:Ummmm			3000
			pause
			:Ummmm
				killAllTriggers
				send ("'" & $TagLineB & " No Help After 3 Seconds...*")
				halt
			:HelpArrived
				killAllTriggers
				send "  L Z" & #8 & $Planet & "* * J C * "
				gosub :quikstat
				if ($CURRENT_PROMPT = "Citadel")
					send "I landed on planet " & $PLanet & "*"
				end
				halt
		elseif ($CURRENT_PROMPT <> "Citadel")
			send ("'" & $TagLineB & " Did Not Reach Citadel After Surround*")
			halt
		end
	end
    return

:callSaveMe
	killAllTriggers
	send "*"
	waitFor "(?="
	getWord CURRENTLINE $prompt 1
	if ($prompt = "Citadel")
		echo "**Had to halt script, check ship to see if it is valid.**"
		halt
	end
	if ($prompt = "Computer") or ($prompt = "Corporate") or ($prompt = "NavPoint")
		send "q"
		waitFor "Command [TL"
	end
	gosub :quikstats
   	setVar $figstodeploy 1
	gosub :deployfigs
	setVar $savetarget $CURRENT_SECTOR
	if ($savetarget < 10)
		setVar $savetarget "0000" & $savetarget
	elseif ($savetarget < 100)
		setVar $savetarget "000" & $savetarget
	elseif ($savetarget < 1000)
		setVar $savetarget "00" & $savetarget
	elseif ($savetarget < 10000)
		setVar $savetarget "0" & $savetarget
	end
	send "'" & $savetarget & "=saveme*"

:waitforhelp
    setTextLineTrigger	friendlytwarp	:friendlytwarp "appears in a brilliant flash of warp energies!"
    setTextLineTrigger	friendlyplanet	:friendlyplanet "Saveme script activated - Planet "
    setDelayTrigger 	timeout 		:timeout 30000
    pause

    :timeout
        killalltriggers
        send "'30 seconds after save call, script halted.*"
        halt

    :friendlytwarp
        killalltriggers
        setVar $figstodeploy "ALL"
        gosub :deployfigs
        goto :waitforhelp

    :friendlyplanet
        killalltriggers
        getText CURRENTLINE $planet "Saveme script activated - Planet " " to "
        send "L " & $planet & "* C 'I landed on planet " & $planet & "*"
        halt

    :towlocked
        killalltriggers
        setVar $figstodeploy 1
        gosub :deployfigs
        send "'Tow locked, get us out of here!*"
        halt

:deployfigs
    if ($figstodeploy = 0)
        setVar $figstodeploy 1
    end
    if (($CURRENT_SECTOR  < 11) or ($CURRENT_SECTOR  = STARDOCK))
        send "'Can't deploy figs in fed*"
        return
    end
    send "F"
    setTextLineTrigger nocontrol :nocontrol "These fighters are not under your control."
    setTextLineTrigger abletodeploy :abletodeploy "fighters available."
    pause

    :nocontrol
        killalltriggers
        send "'We don't control the figs in this sector!*"
        halt

    :abletodeploy
        killalltriggers
        getWord CURRENTLINE $figsavailable 3
        striptext $figsavailable ","
        if ($figstodeploy = "ALL")
            setVar $figstodeploy $figsavailable
        end
		return

:WITHDRAW_CASH
	setVar $Loot 0
	setTextLineTrigger	Treasury				:Treasury					"Citadel treasury contains"
	setDelayTrigger		Tellers_On_A_SmokeBreak	:Tellers_On_A_SmokeBreak	3000
	send "  D"
	pause
	:Tellers_On_A_SmokeBreak
		killAllTriggers
		send ("'"&$TagLineB&" Unable To Take Cash From Citadel, Halting!*")
		halt
	:Treasury
		killAllTriggers
		getText CURRENTLINE $Loot "contains" "credits."
		stripText $Loot ","
		stripText $Loot " "
		if ($Loot > $CREDITS_WITHDRAW)
			setVar $Loot $CREDITS_WITHDRAW
		end
		send ("TF"&$Loot&"*")
	return

:GRIDDING_RESULTS
	gosub :Quikstats
	if ($_UNLIM)
		send ("'*" & $TagLine & " - Completed.*")
	else
		send ("'*" & $TagLine & " - Completed with " & $TURNS & " Turns.*")
	end
	SetVar $CashAmount $Targets_Reached_Total
	gosub :CommaSize
	send "    Total Targets PGridded : " & $CashAmount & "*"
	SetVar $CashAmount $Targets_Designated
	gosub :CommaSize
	send "    Total Targets Plotted  : " & $Targets_Designated & "*"
	setVar $tst $Fig_CNT
	setVar $Fig_CNT 0
	setVar $i 1
	while ($i <= SECTORS)
		if ($FIG_GRID[$i] <> 0)
			add $Fig_CNT 1
		end
		add $i 1
	end
	setVar $Fig_CNT ($Fig_CNT - $tst)
	SetVar $CashAmount $Fig_CNT
	gosub :CommaSize
	send "   Grid Size Increased By  : " & $CashAmount & "*"
	send "**"
	waitfor "Sub-space comm-link terminated"
	return

:Do_The_Furb
	setVar $RED_adj 0
	gosub :WITHDRAW_CASH
	gosub :quikstats
	if ($CREDITS < $CREDITS_WITHDRAW)
		send "'" & $TagLineB & " Not Enough Cash To Furb Mines.*"
		setVar $FURB_MINES FALSE
		saveVar $FURB_MINES
		return
	end

	If ($ALIGNMENT >= 1000)
		if ($TWARP_TYPE = "No")
			send "'" & $TagLineB & " TWarp Drive Missing - Cannot Furb.*"
			setVar $FURB_MINES FALSE
			return
		end

	   	setVar $Start_Sector $CURRENT_SECTOR

	   	setTextLineTrigger DoneBurst		:DoneBurst		": ENDINTERROG"
		#clear avoids, turn on twarp, plot warp courses
		send  (" C V O* Y N " & STARDOCK & "* V 0* Y N " & $Start_Sector & "* U Y Q* ^F" & $CURRENT_SECTOR & "*" & STARDOCK & "*F" & STARDOCK & "*" & $CURRENT_SECTOR & "*Q")
		pause
		:DoneBurst
			killAllTriggers

		setDelayTrigger Wait_A_Bit			:Wait_A_Bit		1000
		pause
		:Wait_A_Bit
		killAllTriggers

		getDistance $Dist_To $CURRENT_SECTOR STARDOCK
		getDistance $Dist_Fr STARDOCK $CURRENT_SECTOR

		setVar $ORE_REQ (($Dist_Fr + $Dist_To) * 3)

		if ($ORE_REQ > $ORE_HOLDS)
			send ("'"&$TagLineB&" Unable To Furb - StarDock Is Out Of Range!*")
			setVar $FURB_MINES FALSE
			return
		end

		send ("CR"&STARDOCK&"*Q ")
		setTextLineTrigger	itsalive 	:Buy_Fotons_itsalive		"Items     Status  Trading % of max OnBoard"
		setTextLineTrigger	nosoupforme	:Buy_Fotons_nosoupforme		"I have no information about a port in that sector"
		setDelayTrigger		WeHaveAProb	:Buy_Fotons_WeHaveAProb		3000
		waitfor "Computer command [TL"
		pause
		:Buy_Fotons_WeHaveAProb
			killAllTriggers
			send ("'"&$TagLineB&" Unable To Furb - Problem Comfirming StarDock's Alive (Timed Out)!*")
			setVar $FURB_MINES FALSE
			return
		:Buy_Fotons_nosoupforme
			killAllTriggers
			send ("'"&$TagLineB&" Unable To Furb - StarDock Appears To Have Been Blown!*")
			setVar $FURB_MINES FALSE
			return
		:Buy_Fotons_itsalive
			killAllTriggers

		send "  q  m  n  t  *  q  m" & STARDOCK & "*  y  y  p  s g y g q h m "
	else
		setVar $add 1
		while ($add <= SECTOR.WARPS[STARDOCK][$add] > 0)
			setVar $RED_adj SECTOR.WARPSIN[STARDOCK][$add]
			send ("p" & $RED_adj & "*")
			setTextLineTrigger	PwarpBlind 			:PwarpBlind "Your own fighters must be in the destination to"
			setTextTrigger		PwarpLocked			:PwarpLocked "All Systems Ready, shall we engage"
			setTextLineTrigger	PwarpThere			:PwarpThere "You are already in that sector!"
			pause
			:PwarpLocked
				killAllTriggers
				setVar $Start_Sector $RED_adj
				send "Y C V O* Y N " & STARDOCK & "* V 0* Y N " & $RED_adj & "* U Y"
				send "Q  Q  T N T 1* * Q Q Q Z N * M" & STARDOCK & "* * P S G Y G Q H M "
				goto :Cont_fur
			:PwarpThere
				killAllTriggers
				goto :Cont_fur
			:PwarpBlind
				killAllTriggers
				send " N "

        	add $add 1
		end
		send ("'"&$TagLineB&" Unable To Furb - Adj To StarDock Not Found!*")
		setVar $FURB_MINES FALSE
		return
	end

	:Cont_fur
	waitfor "How many mines do you want"
	getText CURRENTLINE $Buy "(Max " ") ["
	stripText $Buy ","
	send $Buy & "* l "
	waitfor "<Hardware Emporium> So what are you looking for"
	waitfor "How many mines do you want"
	getText CURRENTLINE $Buy "(Max " ") ["
	stripText $Buy ","

	send $Buy & "* q q  m" & $Start_Sector & "*  y "
    setTextTrigger Buy_Fotonstwarp_lock		:Buy_Fotonstwarp_lock		"All Systems Ready, shall we engage"
    setTextTrigger Buy_Fotonsno_twrp_lock	:Buy_Fotonsno_twarp_lock	"Do you want to make this jump blind"
	setTextLineTrigger TwarpAdj				:TwarpAdj "<Set NavPoint>"
	pause
	:Buy_Fotonsno_twarp_lock
		killAllTriggers
		send " N  *  P  SGYG"
		send ("'"&$TagLineB&" Unable To Return, Blind Warp Averted Hiding On Dock!*")
		halt
	:TwarpAdj
		killAllTriggers
		send (" *  *  L Z" & #8 & $Planet & "*  * J C*  ")
		goto :TwarpAdj_2
	:Buy_Fotonstwarp_lock
       	killAllTriggers
       	send (" Y *  *  L Z"&#8&$Planet&"*  * J C*  ")
       	:TwarpAdj_2
		setTextLineTrigger	Buy_Fotons_NotLanded1	:Buy_Fotons_NotLanded1		"Are you sure you want to jettison all cargo?"
		SetDelayTrigger		Buy_Fotons_NotLAnded2	:Buy_Fotons_NotLanded2		4000
		setTextLineTrigger	Buy_Fotons_Landed		:Buy_Fotons_Landed			"<Enter Citadel>"
		pause
		:Buy_Fotons_NotLanded1
			killAllTriggers
			send ("'"&$TagLineB&" Not Landed. Planet "&$Planet&", Not Found!*")
			halt
		:Buy_Fotons_NotLanded2
			killAllTriggers
			send ("'"&$TagLineB&" Return Trip Timed Out - Check My TA!*")
			halt
		:Buy_Fotons_Landed
			killAllTriggers
			send "Q T N T 1* * C"
			gosub :quikstats
			if ($CREDITS > $CREDITS_ON_HAND)
				setVar $Deposit " TT"&($CREDITS - $CREDITS_ON_HAND)&"*"
			else
				setVar $Deposit ""
			end
	return



#=-------------------------------------------------------------------------------------------------------------------
:clear_sector
	killalltriggers
	gosub :quikstats
	setVar $beforeLimpets $LIMPETS
	setVar $beforeArmids  $ARMIDS
	setVar $placedLimpet FALSE
	setVar $placedArmid FALSE
	send " ** "
	waitOn "Warps to Sector(s) :"
	waitfor "Command [TL="
	getText CURRENTLINE $MININ "]:[" "] (?="
	setVar $limpetOwner SECTOR.LIMPETS.OWNER[$MININ]
	setVar $armidOwner SECTOR.MINES.OWNER[$MININ]
	if (($LIMPETS <= 0) AND (($limpetOwner <> "belong to your Corp") AND ($limpetOwner <> "yours")))
		return
	end
	if (($ARMIDS <= 0) AND (($armidOwner <> "belong to your Corp") AND ($armidOwner <> "yours")))
		return
	end
	gosub :clear_sector_deployEquipment
	while (($placedLimpet = FALSE) OR ($placedArmid = FALSE))
		gosub :clear_sector_attemptClearingMines
	end
	return

	:clear_sector_attemptClearingMines
		setVar $i 0

		while ($i < 7)
			gosub :clear_sector_xenter
			add $i 1
		end
		gosub :clear_sector_deployEquipment
		return

	:clear_sector_xenter
   		send "q y n * t* * *" PASSWORD "*    *    *       za9999*   z*   "
  		return

	:clear_sector_deployEquipment
		if ($ARMIDS < 3)
			setVar $minesToDeploy $ARMIDS
		else
			setVar $minesToDeploy $DROP__ARMIDS
		end
		if ($LIMPETS < 3)
			setVar $limpsToDeploy $LIMPETS
		else
			setVar $limpsToDeploy $DROP__LIMPS
		end
		setVar $clearMac ""
		if (($armidOwner <> "belong to your Corp") AND ($armidOwner <> "yours"))
			setVar $clearMac $clearMac&"h   1   z " & $minesToDeploy & "*   z  c  *  "
		end
		if (($limpetOwner <> "belong to your Corp") AND ($limpetOwner <> "yours"))
			setVar $clearMac $clearMac&"h   2   z " & $limpsToDeploy & "*   z  c  *   "
		end
		send $clearMac
		gosub :quikstats
		if (($beforeLimpets > $LIMPETS) OR (($limpetOwner = "belong to your Corp") OR ($limpetOwner = "yours")))
			setVar $placedLimpet TRUE
		end
		if (($beforeArmids > $ARMIDS) OR (($armidOwner = "belong to your Corp") OR ($armidOwner = "yours")))
			setVar $placedArmid TRUE
		end
		return