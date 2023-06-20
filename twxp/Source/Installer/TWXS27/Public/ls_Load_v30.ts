	systemScript
	setVar $MENU_PRE ANSI_14 & "["
	setVar $MENU_Pst ANSI_14 & "]   " & ANSI_15
	setVar $MENU_Marked ANSI_6
	SetVar $MENU_UnMarked ANSI_8

	setVar $Line1 " "
	setVar $Line2 " "
	setVar $Line3 " "
	setVar $Line4 "        " & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-"
	setVar $Line5 ANSI_14 & "             LoneStar's Script Loader"
	setVar $Line6 ANSI_15 & "                   Version 3.00"
	setVar $Line7 ANSI_6 & "                   For TWX 2.04"
	setVar $Line8 "        " & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-"
	setVar $Line9 " "
	setVar $Line10 " "
	setVar $Line11 " "
	setVar $Line12 " "

	setVar $DataFile		"scripts\LoneStar_Pack\1_LS_Scripts.txt"
	setVar $HeaderCombat	"[+COMBATDEFENSE+]"
	setVar $HeaderGrid		"[+GRID+]"
	setVar $HeaderMaint		"[+MAINT+]"
	setVar $HeaderCashing	"[+CASHING+]"
	setVar $HeaderMisc		"[+MISC+]"
	setVar $HeaderMap			"[+MAP+]"
	setVar $HeaderSVR			"[+SVRMONITOR+]"
	setVar $HeaderTactic		"[+TACTICAL+]"
	setVar $HeaderUtility	"[+UTILITY+]"
	setVar $HeaderZTM			"[+ZTM+]"

	setVar $ScriptLimit		10
	setArray $Scripts 		10 $ScriptLimit

	fileExists $YesNo $DataFile
	if ($YesNo = 0)
		write $DataFile $HeaderCombat
		write $DataFile "scripts\ck_combat_pack\__ck_superphoton.cts		ck's Super Photon"
		write $DataFile "scripts\Alexio\_Alexio_Surround_Photon_2.cts		Surround Photon"
		write $DataFile $HeaderGrid
		write $DataFile $HeaderMaint
		write $DataFile $HeaderCashing
		write $DataFile $HeaderMisc
		write $DataFile $HeaderMap	
		write $DataFile $HeaderSVR		
		write $DataFile $HeaderTactic
		write $DataFile $HeaderUtility
		write $DataFile $HeaderZTM

		fileExists $YesNo $DataFile
		if ($YesNo = 0)
			echo "**" & ANSI_14 "Error - " & ANSI_15 &  "Data File Not Found, Unable to create!**"
		else
			echo "**" & ANSI_14 "Error - " & ANSI_15 &  "Data File Not Found, Template Created with 2 Examples!*"
			echo "        " & ANSI_7 &  "Input Scripts in this Format:**"
			echo "                " & ANSI_14 &  "scripts/path/Filename.ts " & ANSI_6 & "TAB TAB " & ANSI_7 & "Custom Menu Text"
			echo "**"
		end
	    halt
	end

	readToArray $DataFile $TempData
	setVar $i 1
	while ($i <= $TempData)
		if ($TempData[$i] = $HeaderCombat)
			setVar $Catptr 1
			setVar $Scrptr 0
		elseif ($TempData[$i] = $HeaderGrid)
			setVar $Catptr 2
			setVar $Scrptr 0
		elseif ($TempData[$i] = $HeaderMaint)
			setVar $Catptr 3
			setVar $Scrptr 0
		elseif ($TempData[$i] = $HeaderCashing)
			setVar $Catptr 4
			setVar $Scrptr 0
		elseif ($TempData[$i] = $HeaderMisc)
			setVar $Catptr 5
			setVar $Scrptr 0
		elseif ($TempData[$i] = $HeaderMap)
			setVar $Catptr 6
			setVar $Scrptr 0
		elseif ($TempData[$i] = $HeaderSVR)
			setVar $Catptr 7
			setVar $Scrptr 0
		elseif ($TempData[$i] = $HeaderTactic)
			setVar $Catptr 8
			setVar $Scrptr 0
		elseif ($TempData[$i] = $HeaderUtility)
			setVar $Catptr 9
			setVar $Scrptr 0
		elseif ($TempData[$i] = $HeaderZTM)
			setVar $Catptr 10
			setVar $Scrptr 0
		else
			setVar $Scripts[$Catptr][$Scrptr] $TempData[$i]
		end
		add $i 1
		add $Scrptr 1
	end

:Waiting
	killAllTriggers
	setTextOutTrigger OpenMenuTest :OpenMenuTest "X"
	pause

:OpenMenuTest
	killAllTriggers
	setTextOutTrigger OpenMenuTest	:ShowMenu "X"
	setDelayTrigger doubleTap		:Waiting_Not 250
	pause
:Waiting_Not
	killAllTriggers
	processOut "X"
	goto :Waiting

:ShowMenu
	killAllTriggers
	Echo "*"
	if ($CONTEXT = 1)
		setVar $MENU_MARKER $MENU_MARKED
	else
		setVar $MENU_MARKER $MENU_UnMarked
	end
	Echo "*" & $MENU_PRE & $MENU_MARKER & "COM" & ANSI_15 & "B" & $MENU_MARKER & "DEF" & $MENU_Pst & $Line1

	if ($CONTEXT = 2)
		setVar $MENU_MARKER $MENU_MARKED
	else
		setVar $MENU_MARKER $MENU_UnMarked
	end
	Echo "*" & $MENU_PRE & $MENU_MARKER & "GRI" & ANSI_15 & "D" & $MENU_MARKER & "WRK" & $MENU_Pst & $Line2

	if ($CONTEXT = 3)
		setVar $MENU_MARKER $MENU_MARKED
	else
		setVar $MENU_MARKER $MENU_UnMarked
	end
	Echo "*" & $MENU_PRE & $MENU_MARKER & " MA" & ANSI_15 & "I" & $MENU_MARKER & "NT " & $MENU_Pst & $Line3

	if ($CONTEXT = 4)
		setVar $MENU_MARKER $MENU_MARKED
	else
		setVar $MENU_MARKER $MENU_UnMarked
	end
	Echo "*" & $MENU_PRE & $MENU_MARKER & "CAS" & ANSI_15 & "H" & $MENU_MARKER & "ING" & $MENU_Pst & $Line4

	if ($CONTEXT = 5)
		setVar $MENU_MARKER $MENU_MARKED
	else
		setVar $MENU_MARKER $MENU_UnMarked
	end
	Echo "*" & $MENU_PRE & $MENU_MARKER & " MI" & ANSI_15 & "S" & $MENU_MARKER & "C  " & $MENU_Pst & $Line5

	if ($CONTEXT = 6)
		setVar $MENU_MARKER $MENU_MARKED
	else
		setVar $MENU_MARKER $MENU_UnMarked
	end
	Echo "*" & $MENU_PRE & $MENU_MARKER & "  M" & ANSI_15 & "A" & $MENU_MARKER & "P  " & $MENU_Pst & $Line6

	if ($CONTEXT = 7)
		setVar $MENU_MARKER $MENU_MARKED
	else
		setVar $MENU_MARKER $MENU_UnMarked
	end
	Echo "*" & $MENU_PRE & $MENU_MARKER & "  S" & ANSI_15 & "V" & $MENU_MARKER & "R  " & $MENU_Pst & $Line7

	if ($CONTEXT = 8)
		setVar $MENU_MARKER $MENU_MARKED
	else
		setVar $MENU_MARKER $MENU_UnMarked
	end
	Echo "*" & $MENU_PRE & $MENU_MARKER & "TAC" & ANSI_15 & "T" & $MENU_MARKER & "ICS" & $MENU_Pst & $Line8

	if ($CONTEXT = 9)
		setVar $MENU_MARKER $MENU_MARKED
	else
		setVar $MENU_MARKER $MENU_UnMarked
	end
	Echo "*" & $MENU_PRE & $MENU_MARKER & "UTI" & ANSI_15 & "L" & $MENU_MARKER & "ITY" & $MENU_Pst & $Line9

	if ($CONTEXT = 10)
		setVar $MENU_MARKER $MENU_MARKED
	else
		setVar $MENU_MARKER $MENU_UnMarked
	end
	Echo "*" & $MENU_PRE & $MENU_MARKER & "   " & ANSI_15 & "Z" & $MENU_MARKER & "TM " & $MENU_Pst & $Line10
	Echo "*"

   setVar $Line6 ""
   setVar $Line7 ""
   setVar $Line8 ""
   setVar $Line9 ""
   setVar $Line10 ""
	getConsoleInput $Selection SINGLEKEY
	UpperCase $Selection
	if ($Selection = "B")
		setVar $CONTEXT 1
		gosub :BuildMenu
	elseif ($Selection = "D")
		setVar $CONTEXT 2
		gosub :BuildMenu
	elseif ($Selection = "I")
		setVar $CONTEXT 3
		gosub :BuildMenu
	elseif ($Selection = "H")
		setVar $CONTEXT 4
		gosub :BuildMenu
	elseif ($Selection = "S")
		setVar $CONTEXT 5
		gosub :BuildMenu
	elseif ($Selection = "A")
		setVar $CONTEXT 6
		gosub :BuildMenu
	elseif ($Selection = "V")
		setVar $CONTEXT 7
		gosub :BuildMenu
	elseif ($Selection = "T")
		setVar $CONTEXT 8
		gosub :BuildMenu
	elseif ($Selection = "L")
		setVar $CONTEXT 9
		gosub :BuildMenu
	elseif ($Selection = "Z")
		setVar $CONTEXT 10
		gosub :BuildMenu

	elseif ($Selection = "1")
		if ($Execute[1] <> 0)
			load $Execute[1]
			goto :Waiting
		end
	elseif ($Selection = "2")
		if ($Execute[2] <> 0)
			load $Execute[2]
			goto :Waiting
		end
	elseif ($Selection = "3")
		if ($Execute[3] <> 0)
			load $Execute[3]
			goto :Waiting
		end
	elseif ($Selection = "4")
		if ($Execute[4] <> 0)
			load $Execute[4]
			goto :Waiting
		end
	elseif ($Selection = "5")
		if ($Execute[5] <> 0)
			load $Execute[5]
			goto :Waiting
		end
	elseif ($Selection = "6")
		if ($Execute[6] <> 0)
			load $Execute[6]
			goto :Waiting
		end
	elseif ($Selection = "7")
		if ($Execute[7] <> 0)
			load $Execute[7]
			goto :Waiting
		end
	elseif ($Selection = "8")
		if ($Execute[8] <> 0)
			load $Execute[8]
			goto :Waiting
		end
	elseif ($Selection = "9")
		if ($Execute[9] <> 0)
			load $Execute[9]
			goto :Waiting
		end
	elseif ($Selection = "0")
		if ($Execute[10] <> 0)
			load $Execute[10]
			goto :Waiting
		end
	else
		gosub :CloseMenuMsg
		goto :Waiting
	end
	goto :ShowMenu

:CloseMenuMsg
	setVar $Line1 ""
	setVar $Line2 ""
	setVar $Line3 ""
	setVar $Line4 ""
	setVar $Line5 ""
	setVar $Line6 ""
	setVar $Line7 ""
	setVar $Line8 ""
	setVar $Line9 ""
	setVar $Line10 ""
	setVar $CONTEXT 0
	echo "*" & ANSI_14 & " [" & ANSI_7 & "CLOSED" & ANSI_14 & "]*"
	return

:BuildMenu
	setVar $i 1
	setArray $Execute $ScriptLimit
	while ($i <= $ScriptLimit)
		setVar $temp "                           "
		if ($Scripts[$CONTEXT][$i] <> 0)
			getWordPos $Scripts[$CONTEXT][$i] $pos #9
			if ($pos <> 0)
				cutText $Scripts[$CONTEXT][$i] $temp $pos 999
				cutText $Scripts[$CONTEXT][$i] $Execute[$i] 1 ($pos - 1)
				stripText $temp #9
				getLength $temp $len
				if ($len > 50)
					cutText $temp $temp 1 50
				else
					while ($len <= 50)
						setVar $temp $temp & " "
						add $len 1
					end
				end
			end
		end
		if ($i = 1)
			setVar $Line1 ANSI_14 & "1 " & ANSI_7 & $temp & "   "
		elseif ($i = 2)
			setVar $Line2 ANSI_14 & "2 " & ANSI_7 & $temp & "   "
		elseif ($i = 3)
			setVar $Line3 ANSI_14 & "3 " & ANSI_7 & $temp & "   "
		elseif ($i = 4)
			setVar $Line4 ANSI_14 & "4 " & ANSI_7 & $temp & "   "
		elseif ($i = 5)
			setVar $Line5 ANSI_14 & "5 " & ANSI_7 & $temp & "   "
		elseif ($i = 6)
			setVar $Line6 ANSI_14 & "6 " & ANSI_7 & $temp
		elseif ($i = 7)
			setVar $Line7 ANSI_14 & "7 " & ANSI_7 & $temp
		elseif ($i = 8)
			setVar $Line8 ANSI_14 & "8 " & ANSI_7 & $temp
		elseif ($i = 9)
			setVar $Line9 ANSI_14 & "9 " & ANSI_7 & $temp
		elseif ($i = 10)
			setVar $Line10 ANSI_14 & "0 " & ANSI_7 & $temp
		end
		add $i 1
		setVar $temp ""
	end
	return

#XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
#         1         2         3         4         5         6         7
#1234567890123456789012345678901234567890123456789012345678901234567890
#[COMBDEF]   1 QQQQQQQQQQQQQQQQQQQQQQQQQ   6 QQQQQQQQQQQQQQQQQQQQQQQQQ
#[GRIDWRK]   2 QQQQQQQQQQQQQQQQQQQQQQQQQ   7 QQQQQQQQQQQQQQQQQQQQQQQQQ
#[ MAINT ]   3 QQQQQQQQQQQQQQQQQQQQQQQQQ   8 QQQQQQQQQQQQQQQQQQQQQQQQQ
#[CASHING]   4 QQQQQQQQQQQQQQQQQQQQQQQQQ   9 QQQQQQQQQQQQQQQQQQQQQQQQQ
#[ MISC  ]   5 QQQQQQQQQQQQQQQQQQQQQQQQQ   0 QQQQQQQQQQQQQQQQQQQQQQQQQ
#              1234678901234567890123456=26
# version 1.0
