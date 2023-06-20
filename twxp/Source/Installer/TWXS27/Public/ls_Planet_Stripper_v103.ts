setVar $TAG (ANSI_9 & "["&ANSI_14&"LSTRiP"&ANSI_9&"] " & ANSI_15)
setVar $TagLine		"LoneStar's Planet Stripper"
setVar $Version		"1.03"
SetVar $MOVE_ORE	TRUE
setVar $MOVE_ORG	TRUE
setVar $MOVE_EQU	TRUE
setVar $MOVE_FIG	TRUE
setVar $MOVED_ORE	0
setVar $MOVED_ORG	0
setVar $MOVED_EQU	0
setVar $MOVED_FIG	0
gosub :quikstats
if ($Current_Prompt <> "Citadel")
	Echo "**"&$TAG&"Start In Citadel Of Planet You Want To Fill**"
	halt
end
gosub :_MENU_
send "'[LSTRiP] Version "&$Version&" : Powering Up!*"
setvar $i 1
send "c;"
waiton "Max Fighters:"
getText CURRENTLINE $MAX_FIGS "Fighters:" "Offensive"
stripText $MAX_FIGS " "
stripText $MAX_FIGS ","
while (SECTOR.WARPS[$CURRENT_SECTOR][$i] <> 0)
	send "v" & SECTOR.WARPS[$CURRENT_SECTOR][$i] & "*"
	add $i 1
end
send "qq"
waiton "<Computer deactivated>"
Echo "**"&$TAG&"Getting DESTINATION LEVELS*"
gosub :DEST_LEVELS
send "'[LSTRiP] Setting Avoids On All Adjacents*"
send "q  **   "
waiton "Warps to Sector(s) :"
if (SECTOR.PLANETCOUNT[$CURRENT_SECTOR] <= 1)
	Echo "**"&$TAG&"No Planets To Empty**"
	halt
end
setVar $P_COUNT 1
Echo "**"&$TAG&"GETTING PLANET #'s**"
send "L" & $PLANET & "*C"
setTextLineTrigger	DONE	:DONE "<Enter Citadel>"
setTextLineTrigger	LINE	:LINE "   <"
waiton "--------------------------"
:LINE
killTrigger LINE
getText CURRENTLINE $TEMP "<" ">"
stripText $TEMP " "
stripText $TEMP ","
isNumber $tst $TEMP
if ($tst)
	if ($TEMP <> $PLANET)
		setVar $PLANETS[$P_COUNT] $TEMP
		add $P_COUNT 1
	end
end
setTextLineTrigger	LINE	:LINE "   <"
pause
:DONE
send "q"
killAllTriggers
send "'[LSTRiP] Filling Planet " & $PLANET & "*"
window status 300 400 $TagLine & " v" & $Version & " [" & GAMENAME & "]"  ONTOP
setVar $i 1
while ($i < $P_COUNT)
	setVar $MSG ""
	setVar $MSG ($MSG & "Filling Planet #"&$PLANET)
	setVar $MSG ($MSG & "*=================================")
	setVar $MSG ($MSG & "*Planet:      Amount     Maximum")
	setVar $MSG ($MSG & "*Fuel Ore  ")
	setVar $CashAmount $SRC_ORE_AMT
	gosub :CommaSize
	gosub :PAD
	setVar $MSG ($MSG & $CashAmount & "   ")
	setVar $CashAmount $SRC_ORE_MAX
	gosub :CommaSize
	gosub :PAD
	setVar $MSG ($MSG & $CashAmount)
	setVar $MSG ($MSG & "*Organics  ")
	setVar $CashAmount $SRC_ORG_AMT
	gosub :CommaSize
	gosub :PAD
	setVar $MSG ($MSG & $CashAmount & "   ")
	setVar $CashAmount $SRC_ORG_MAX
	gosub :CommaSize
	gosub :PAD
	setVar $MSG ($MSG & $CashAmount)
	setVar $MSG ($MSG & "*Equipment ")
	setVar $CashAmount $SRC_EQU_AMT
	gosub :CommaSize
	gosub :PAD
	setVar $MSG ($MSG & $CashAmount & "   ")
	setVar $CashAmount $SRC_EQU_MAX
	gosub :CommaSize
	gosub :PAD
	setVar $MSG ($MSG & $CashAmount)
	setVar $MSG ($MSG & "*Fighters  ")
	setVar $CashAmount $SRC_FIG_AMT
	gosub :CommaSize
	gosub :PAD
	setVar $MSG ($MSG & $CashAmount & "   ")
	setVar $CashAmount $SRC_FIG_MAX
	gosub :CommaSize
	gosub :PAD
	setVar $MSG ($MSG & $CashAmount)
	setVar $MSG ($MSG & "*=================================")
	setVar $MSG ($MSG & "*"&($P_COUNT - 1)&" Planets Found In Sector: " & $CURRENT_SECTOR)
	setDelayTrigger		NoTLanded	:NoTLanded	3000
	send "  q  j  y  l z" & #8 & $PLANETS[$i] & "*   "
	setVar $focus $PLANETS[$i]
	#waiton "Planet command (?=help)"
	waiton "Landing sequence engaged"
	killAllTriggers
	Echo "**"&$TAG&"Determining Basket Levels*"
	gosub :BASKET_LEVELS
	setVar $ii 1
	while ($ii < $P_COUNT)
		if ($i = $ii)
			setVar $MSG ($MSG & "* - Planet #" & $PLANETS[$ii] & " - Emptying")
			setVar $CashAmount $BASKET_ORE_AMT
			gosub :CommaSize
			gosub :PAD
			setVar $MSG ($MSG & "*         Fuel ORE :" & $CashAmount)
			setVar $CashAmount $BASKET_ORG_AMT
			gosub :CommaSize
			gosub :PAD
			setVar $MSG ($MSG & "*         Organics :" & $CashAmount)
			setVar $CashAmount $BASKET_EQU_AMT
			gosub :CommaSize
			gosub :PAD
			setVar $MSG ($MSG & "*         Equipment:" & $CashAmount)
			setVar $CashAmount $BASKET_FIG_AMT
			gosub :CommaSize
			gosub :PAD
			setVar $MSG ($MSG & "*         Fighters :" & $CashAmount)
		else
	    	setVar $MSG ($MSG & "* - Planet #" & $PLANETS[$ii])
		end
    	add $ii 1
	end
	setVar $MSG ($MSG & "*========== End Of List ==========")
	setWindowContents STATUS $MSG
	Echo "**"&$TAG&"Constructing MACRO's*"
	gosub :MAKE_MACRO
	setDelayTrigger		NoTLanded	:NoTLanded	3000
	send "  q  j  y  l z" & #8 & $PLANET & "*  "
	#waiton "Planet command (?=help)"
	waiton "Landing sequence engaged"
	gosub :DEST_LEVELS
	add $i 1
end
send "c  c  "
setVar $i 1
while (SECTOR.WARPS[$CURRENT_SECTOR][$i] <> 0)
	send "v0*yn"&SECTOR.WARPS[$CURRENT_SECTOR][$i]&"*"
	add $i 1
end
send "  q   "
send "'*"
waiton "Type sub-space message"
if ($MOVED_ORE <> 0) OR ($MOVED_ORG <> 0) OR ($MOVED_EQU <> 0) OR ($MOVED_FIG <> 0)
	send "[LSTRiP] Farming Results*"
	if ($MOVED_ORE <> 0)
		setvar $CashAmount $MOVED_ORE
		gosub :CommaSize
		gosub :PAD
		send ("         - Fuel Ore : " & $CashAmount & "*")
	end
	if ($MOVED_ORG <> 0)
		setvar $CashAmount $MOVED_ORG
		gosub :CommaSize
		gosub :PAD
		send ("         - Organics : " & $CashAmount & "*")
	end
	if ($MOVED_EQU <> 0)
		setvar $CashAmount $MOVED_EQU
		gosub :CommaSize
		gosub :PAD
		send ("         - Equipment: " & $CashAmount & "*")
	end
	if ($MOVED_FIG <> 0)
		setVar $CashAmount $MOVED_FIG
		gosub :CommaSize
        gosub :PAD
		send ("         - Fighters : " & $CashAmount & "*")
	end
end
send "[LSTRiP] Farm Complete For This Sector*"
send "*"

waiton "Sub-space comm-link terminated"
halt
:NoTLanded
killAllTriggers
Echo "**"&$TAG&"Unable To Find Planet #"&$PLANETS[$i] & "**"
halt

:MAKE_MACRO
	setVar $MAC ""
	Echo "**"
	#========================================
	if ($MOVE_ORE)
		if ($BASKET_ORE_AMT > ($SRC_ORE_MAX - $SRC_ORE_AMT))
			setVar $BASKET_ORE_AMT ($SRC_ORE_MAX - $SRC_ORE_AMT)
		end
		setVar $TRIPS ($BASKET_ORE_AMT / $TOTAL_HOLDS)
		setVar $idx 1
		if ($TRIPS >= 1) AND ($BASKET_ORE_AMT > $TOTAL_HOLDS)
			Echo "*"&$TAG&"Building Macro: " & ANSI_14 & "Moving "&$BASKET_ORE_AMT&" Fuel ORE"
			while ($idx <= $TRIPS)
				setVar $MAC ($MAC & " J  T  N  T  1*  Q  *  L Z" & #8 & $PLANET & "*  J  T  N  J  L  1*  Q  *  L Z" & #8 & $PLANETS[$i] & "* ")
				add $MOVED_ORE $TOTAL_HOLDS
				add $idx 1
			end
		end
	end
	#========================================
	if ($MOVE_ORG)
		if ($BASKET_ORG_AMT > ($SRC_ORG_MAX - $SRC_ORG_AMT))
			setVar $BASKET_ORG_AMT ($SRC_ORG_MAX - $SRC_ORG_AMT)
		end
		setVar $TRIPS ($BASKET_ORG_AMT / $TOTAL_HOLDS)
		setVar $idx 1
		if ($TRIPS >= 1) AND ($BASKET_ORG_AMT > $TOTAL_HOLDS)
			Echo "*"&$TAG&"Building Macro: " & ANSI_14 & "Moving "&$BASKET_ORG_AMT&" Organics"
			while ($idx <= $TRIPS)
				setVar $MAC ($MAC & " J  T  N  T  2*  Q  *  L Z" & #8 & $PLANET & "*  J  T  N  J  L  2*  Q  *  L Z" & #8 & $PLANETS[$i] & "*  ")
				add $MOVED_ORG $TOTAL_HOLDS
				add $idx 1
			end
		end
	end
	#========================================
	if ($MOVE_EQU)
		if ($BASKET_EQU_AMT > ($SRC_EQU_MAX - $SRC_EQU_AMT))
			setVar $BASKET_EQU_AMT ($SRC_EQU_MAX - $SRC_EQU_AMT)
		end
		setVar $TRIPS ($BASKET_EQU_AMT / $TOTAL_HOLDS)
		setVar $idx 1
		if ($TRIPS >= 1) AND ($BASKET_EQU_AMT > $TOTAL_HOLDS)
			Echo "*"&$TAG&"Building Macro: " & ANSI_14 & "Moving "&$BASKET_EQU_AMT&" Equipment"
			while ($idx <= $TRIPS)
				setVar $MAC ($MAC & " J  T  N  T 3*  Q  *  L Z" & #8 & $PLANET & "*  J  T  N  J  L  3*  Q  *  L Z" & #8 & $PLANETS[$i] & "*  ")
				add $MOVED_EQU $TOTAL_HOLDS
				add $idx 1
			end
		end
	end
	#========================================
	if ($MOVE_FIG)
		if ($BASKET_FIG_AMT > ($SRC_FIG_MAX - $SRC_FIG_AMT))
			setVar $BASKET_FIG_AMT ($SRC_FIG_MAX - $SRC_FIG_AMT)
		end
		setVar $TRIPS (($BASKET_FIG_AMT / $MAX_FIGS) + 1)
		add $MOVED_FIG $BASKET_FIG_AMT
		setVar $idx 1
		Echo "*"&$TAG&"Building Macro: " & ANSI_14 & "Moving "&$BASKET_FIG_AMT&" Fighters"
		while ($idx <= $TRIPS)
			setVar $MAC ($MAC & " Q  *  L Z" & #8 & $PLANET & "*  J  M  N  J  L  *  Q  *  L Z" & #8 & $PLANETS[$i] & "*  J  M  N  T  *  ")
			add $idx 1
		end
		setVar $MAC ($MAC & " Q  *  L Z" & #8 & $PLANET & "*  J  M  N  T  *  Q  *  L Z" & #8 & $PLANETS[$i] & "*   ")
	end
	Echo "**"
	setVar $MAC ($MAC & "'         Planet #" & $PLANETS[$i] & " Emptied*")
	killAllTriggers
	send $MAC
	waiton "Planet #" & $PLANETS[$i] & " Emptied"
	waiton "Message sent on sub-space channel"
	return
:BASKET_LEVELS
	killAllTriggers
	send "d"
	#think a delay is needed here
	setTextLineTrigger	BASKET_Num	:BASKET_Num	"Planet #"
	setTextLineTrigger	BASKET_Ore	:BASKET_Ore	"Fuel Ore"
	setTextLineTrigger	BASKET_Org	:BASKET_Org	"Organics"
	setTextLineTrigger	BASKET_Equ	:BASKET_Equ	"Equipment"
	setTextLineTrigger	BASKET_Fig	:BASKET_Fig	"Fighters"
	pause
	:BASKET_Num
		getWord CURRENTLINE $BASKET_PLANET 2
		stripText $BASKET_PLANET " "
		stripText $BASKET_PLANET "#"
		pause
	:BASKET_Ore
		getWord CURRENTLINE	$BASKET_ORE_AMT 6
		stripText $BASKET_ORE_AMT " "
		stripText $BASKET_ORE_AMT ","
		pause
	:BASKET_Org
		getWord CURRENTLINE	$BASKET_ORG_AMT 5
		stripText $BASKET_ORG_AMT " "
		stripText $BASKET_ORG_AMT ","
		pause
	:BASKET_Equ
		getWord CURRENTLINE	$BASKET_EQU_AMT 5
		stripText $BASKET_EQU_AMT " "
		stripText $BASKET_EQU_AMT ","
		pause
	:BASKET_Fig
		killAllTriggers
		getWord CURRENTLINE	$BASKET_FIG_AMT 5
		stripText $BASKET_FIG_AMT " "
		stripText $BASKET_FIG_AMT ","

	return
:DEST_LEVELS
    killAllTriggers
	send "d"
	setTextLineTrigger	Planet_Num	:Planet_Num	"Planet #"
	setTextLineTrigger	Planet_Ore	:Planet_Ore	"Fuel Ore"
	setTextLineTrigger	Planet_Org	:Planet_Org	"Organics"
	setTextLineTrigger	Planet_Equ	:Planet_Equ	"Equipment"
	setTextLineTrigger	Planet_Fig	:Planet_Fig	"Fighters"
	pause
	:Planet_Num
		getWord CURRENTLINE $PLANET 2
		stripText $PLANET " "
		stripText $PLANET "#"
		pause
	:Planet_Ore
		getWord CURRENTLINE	$SRC_ORE_AMT 6
		getWord CURRENTLINE	$SRC_ORE_MAX 8
		stripText $SRC_ORE_AMT " "
		stripText $SRC_ORE_AMT ","
		stripText $SRC_ORE_MAX " "
		stripText $SRC_ORE_MAX ","
		pause
	:Planet_Org
		getWord CURRENTLINE	$SRC_ORG_AMT 5
		getWord CURRENTLINE	$SRC_ORG_MAX 7
		stripText $SRC_ORG_AMT " "
		stripText $SRC_ORG_AMT ","
		stripText $SRC_ORG_MAX " "
		stripText $SRC_ORG_MAX ","
		pause
	:Planet_Equ
		getWord CURRENTLINE	$SRC_EQU_AMT 5
		getWord CURRENTLINE	$SRC_EQU_MAX 7
		stripText $SRC_EQU_AMT " "
		stripText $SRC_EQU_AMT ","
		stripText $SRC_EQU_MAX " "
		stripText $SRC_EQU_MAX ","
		pause
	:Planet_Fig
		killAllTriggers
		getWord CURRENTLINE	$SRC_FIG_AMT 5
		getWord CURRENTLINE	$SRC_FIG_MAX 7
		stripText $SRC_FIG_AMT " "
		stripText $SRC_FIG_AMT ","
		stripText $SRC_FIG_MAX " "
		stripText $SRC_FIG_MAX ","

	#Determine If Planet is Full
	if (($SRC_ORE_MAX - $SRC_ORE_AMT) < $TOTAL_HOLDS)
		setVar $MOVE_ORE	FALSE
	end
	if (($SRC_ORG_MAX - $SRC_ORG_AMT) < $TOTAL_HOLDS)
		setVar $MOVE_ORG	FALSE
	end
	if (($SRC_EQU_MAX - $SRC_EQU_AMT) < $TOTAL_HOLDS)
		setVar $MOVE_EQU	FALSE
	end
	return

:quikstats
# ============================ START QUIKSTAT VARIABLES ==========================
	setVar $CURRENT_PROMPT          "Undefined"
	setVar $PSYCHIC_PROBE           "NO"
	setVar $PLANET_SCANNER          "NO"
	setVar $SCAN_TYPE               "NONE"
	setVar $CURRENT_SECTOR          0
	setVar $TURNS                   0
	setVar $CREDITS                 0
	setVar $FIGHTERS                0
	setVar $SHIELDS                 0
	setVar $TOTAL_HOLDS             0
	setVar $ORE_HOLDS               0
	setVar $ORGANIC_HOLDS           0
	setVar $EQUIPMENT_HOLDS         0
	setVar $COLONIST_HOLDS          0
	setVar $PHOTONS                 0
	setVar $ARMIDS                  0
	setVar $LIMPETS                 0
	setVar $GENESIS                 0
	setVar $TWARP_TYPE              0
	setVar $CLOAKS                  0
	setVar $BEACONS                 0
	setVar $ATOMIC                  0
	setVar $CORBO                   0
	setVar $EPROBES                 0
	setVar $MINE_DISRUPTORS         0
	setVar $ALIGNMENT               0
	setVar $EXPERIENCE              0
	setVar $CORP                    0
	setVar $SHIP_NUMBER             0
	setVar $TURNS_PER_WARP          0
	setVar $COMMAND_PROMPT          "Command"
	setVar $COMPUTER_PROMPT         "Computer"
	setVar $CITADEL_PROMPT          "Citadel"
	setVar $PLANET_PROMPT           "Planet"
	setVar $CORPORATE_PROMPT        "Corporate"
	setVar $STARDOCK_PROMPT         "<Stardock>"
	setVar $HARDWARE_PROMPT         "<Hardware"
	setVar $SHIPYARD_PROMPT         "<Shipyard>"
	setVar $TERRA_PROMPT            "Terra"
# ============================ END QUIKSTAT VARIABLES ==========================
	setVar $CURRENT_PROMPT 		"Undefined"
	killtrigger noprompt
	killtrigger prompt1
	killtrigger prompt2
	killtrigger prompt3
	killtrigger prompt4
	killtrigger statlinetrig
	killtrigger getLine2
	setTextLineTrigger 	prompt		:allPrompts	 	#145 & #8
	setTextLineTrigger 	statlinetrig 	:statStart 		#179
	send #145&"/"
	pause

	:allPrompts
		getWord CURRENTLINE $CURRENT_PROMPT 1
		stripText $CURRENT_PROMPT #145
		stripText $CURRENT_PROMPT #8
		#getWord currentansiline $checkPrompt 1
		#getWord currentline $tempPrompt 1
		#getWordPos $checkPrompt $pos "[35m"
		#if ($pos > 0)
		#	setVar $CURRENT_PROMPT $tempPrompt
		#end
		setTextLineTrigger 	prompt		:allPrompts	 	#145 & #8
		pause

	:statStart
		killtrigger prompt
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
				getWord $stats $TURNS  			($current_word + 1)
			elseif ($wordy = "Creds")
				getWord $stats $CREDITS  		($current_word + 1)
			elseif ($wordy = "Figs")
				getWord $stats $FIGHTERS   		($current_word + 1)
			elseif ($wordy = "Shlds")
				getWord $stats $SHIELDS  		($current_word + 1)
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
				getWord $stats $PHOTONS   		($current_word + 1)
			elseif ($wordy = "Armd")
				getWord $stats $ARMIDS   		($current_word + 1)
			elseif ($wordy = "Lmpt")
				getWord $stats $LIMPETS   		($current_word + 1)
			elseif ($wordy = "GTorp")
				getWord $stats $GENESIS  		($current_word + 1)
			elseif ($wordy = "TWarp")
				getWord $stats $TWARP_TYPE  		($current_word + 1)
			elseif ($wordy = "Clks")
				getWord $stats $CLOAKS   		($current_word + 1)
			elseif ($wordy = "Beacns")
				getWord $stats $BEACONS 		($current_word + 1)
			elseif ($wordy = "AtmDt")
				getWord $stats $ATOMIC  		($current_word + 1)
			elseif ($wordy = "Corbo")
				getWord $stats $CORBO   		($current_word + 1)
			elseif ($wordy = "EPrb")
				getWord $stats $EPROBES   		($current_word + 1)
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
				getWord $stats $CORP   			($current_word + 1)
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

:_MENU_
SetVar $MOVE_ORE	TRUE
setVar $MOVE_ORG	TRUE
setVar $MOVE_EQU	TRUE
setVar $MOVE_FIG	TRUE
:RE_DIS
Echo "***"
Echo (ANSI_9 & "["&ANSI_14&"Lone Star's STRiP O'Matic!"&ANSI_9&"] " & ANSI_15)
Echo ANSI_15 & "* 1 - Farm Fuel Ore       " & ANSI_14
if ($MOVE_ORE)
	echo "Yes"
else
	echo "No"
end
Echo ANSI_15 & "* 2 - Farm Organics       " & ANSI_14
if ($MOVE_ORg)
	echo "Yes"
else
	echo "No"
end
Echo ANSI_15 & "* 3 - Farm Equipment      " & ANSI_14
if ($MOVE_EQU)
	echo "Yes"
else
	echo "No"
end
Echo ANSI_15 & "* 4 - Farm Fighters       " & ANSI_14
if ($MOVE_FIG)
	echo "Yes"
else
	echo "No"
end
Echo ANSI_15 & "* Q - Quit"
Echo ANSI_15 & "* G - Go!"
Echo "**"
getConsoleInput $s SINGLEKEY
uppercase $s
if ($s = "Q")
	echo "**"
	echo $TAG & ANSI_12 & "Script Halted"
	echo "**"
	halt
elseif ($S = "G")
	if ($MOVE_ORE = FALSE) AND ($MOVE_ORG = FALSE) AND ($MOVE_EQU = FALSE) AND ($MOVE_FIG = FALSE)
		echo "**"
		echo $TAG & ANSI_12 & "Nothing To Do"
		echo "*"
		halt
	end
	return
elseif ($S = "1")
	if ($MOVE_ORE)
		setvar $MOVE_ORE FALSE
	else
		setVar $MOVE_ORE TRUE
	end
elseif ($s = "2")
	if ($MOVE_ORG)
		setVar $MOVE_ORG FALSE
	else
		setVar $MOVE_ORG TRUE
	end
elseif ($s = "3")
	if ($MOVE_EQU)
		setvar $MOVE_EQU FALSE
	else
		setvar $MOVE_EQU TRUE
	end
elseif ($s = "4")
	if ($MOVE_FIG)
		setvar $MOVE_FIG FALSE
	else
		setvar $MOVE_FIG TRUe
	end
end
goto :RE_DIS
return
:CommaSize
	isNumber $tst $CashAmount
	if ($tst = 0)
		Echo "***"
		ECHO ANSI_14 & " Script Halted - CashAmount Invalid"
		Echo "***"
		halt
	end
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
:PAD
	setVar $PAD 1
	getLength $CASHAMOUNT $LEN
	setVar $LEN (10 - $LEN)
	while ($PAD <= $LEN)
		setVar $CASHAMOUNT (" " & $CASHAMOUNT)
		add $PAD 1
	end
	return
