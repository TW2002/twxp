SystemScript
# Title: Z-Charger
# Author: Zed
# Copyright (c) 2010 by Archibald H. Vilanos III
# All Rights Reserved.
# Docks you at Stardock.
SetVar $version "1.22"
SetVar $scriptname "Z-Charger"
SetVar $scripttitle "Zed's Charger"
SetVar $Z_Lib~scriptname $scriptname
SetVar $Z_Lib~scripttitle $scripttitle
SetVar $Z_Lib~Version $version
GoSub :Z_Lib~INITLIB
Gosub :Z_Lib~CHECKONCE
# AUTHORISE
SetVar $authorise TRUE
If ($authorise <> TRUE)
	Gosub :Z_Auth~CHECK
End
#SetVar $Z_Lib~license LOGINNAME
# End Authorise
Gosub :Z_Lib~SYNC
SetVar $Z_Lib~setprompt "CITCOM"
Gosub :Z_Lib~PROMPT
If ($Z_Lib~prompt <> "Command") and ($Z_Lib~prompt <> "Citadel")
   Goto :FINISH
End
Gosub :Z_Lib~CN9CHECK
LoadVar $z_botname
If ($z_botname = "0") or ($z_botname = "")
	LoadVar $bot_name
	SetVar $z_botname $bot_name
End
SetVar $avoidfile GAMENAME & "_AVOIDSLIST.TXT"
LoadVar $z_mowfigs
LoadVar $z_mowmines
LoadVar $z_mowlimps
LoadVar $z_chargekey
LoadVar $z_mowkey
LoadVar $z_chargemenukey
LoadVar $z_base
Gosub :GETBACKDOORS
LoadVar $z_safesector
LoadVar $z_safeship
LoadVar $z_updateship
LoadVar $z_mslflag
LoadVar $z_mslsok
LoadVar $z_msllist
Loadvar $z_bustflag
Gosub :GETSHIPDATA
If ($Z_Lib~prompt = "Command")
	Gosub :CHECKIGON
	Waitfor "Interdictor"
	WaitFor "Command [TL="
End
If (($z_mowfigs = "0") or ($z_mowfigs = "")) and (($z_mowmines = "0") or ($z_mowmines = "")) and (($z_mowlimps = "0") or ($z_mowlimps = ""))
	SetVar $z_mowfigs "1"
	SetVar $z_mowmines "0"
	SetVar $z_mowlimps "0"
End
If ($z_mowfigs = "0")
	SetVar $z_mowfigs "1"
End
LoadVar $z_figowner
If ($z_figowner = "0") or ($z_figowner = "")
	SetVar $z_figowner "c"
End
LoadVar $z_figtype
If ($z_figtype = "0") or ($z_figtype = "")
	SetVar $z_figtype "d"
End
If ($z_chargekey = "0") or ($z_chargekey = "")
	SetVar $z_chargekey "]"
End
If ($z_mowkey = "0") or ($z_mowkey = "")
	SetVar $z_mowkey "["
End
If ($z_chargemenukey = "0") or ($z_chargemenukey = "")
	SetVar $z_chargemenukey "}"
End
Gosub :GETAVOIDS
Gosub :GETMSLS
Gosub :Z_Lib~SYNC
Gosub :Z_Lib~HEADER
Echo "*" & ANSI_11 & "[5m" & "AVAILABLE HOTKEYS " & "[0m" & ANSI_11 & "-  " & ANSI_10 & "MOW KEY: " & ANSI_12 & "[" & ANSI_15 & $z_mowkey & ANSI_12 & "]       " & ANSI_10 & "CHARGE KEY: " & ANSI_12 & "[" & ANSI_15 & $z_chargekey & ANSI_12 & "]       " & ANSI_10 & "MENU KEY: " & ANSI_12 & "[" & ANSI_15 & $z_chargemenukey & ANSI_12 & "]"
Gosub :Z_Lib~REDLINE
Echo "*"
Send #145
PROCESSIN 1 "[Z]SCRIPTLOADED[Z]"
Goto :START
:STARTMENU
LoadVar $z_figowner
If ($z_figowner = "0") or ($z_figowner = "")
	SetVar $z_figowner "c"
End
LoadVar $z_figtype
If ($z_figtype = "0") or ($z_figtype = "")
	SetVar $z_figtype "d"
End
LoadVar $z_base
Gosub :GETBACKDOORS
LoadVar $z_safesector
If ($z_updateship = TRUE)
	SetVar $z_update ANSI_10 & "YES"
Else
	SetVar $z_update ANSI_12 & "NO"
End
If ($z_figowner = "c")
	SetVar $z_figownerd ANSI_15 & "Corporate"
Else
	SetVar $z_figownerd ANSI_12 & "Personal"
End
If ($z_figtype = "d")
	SetVar $z_figtyped ANSI_15 & "Defensive"
ElseIf ($z_figtype = "o")
	SetVar $z_figtyped ANSI_12 & "Offensive"
Else
	SetVar $z_figtyped ANSI_10 & "Toll"
End
If ($z_mslflag = TRUE)
	SetVar $z_mslflagd  ANSI_10 & "ON"
Else
	SetVar $z_mslflagd  ANSI_12 & "OFF"
End
If ($z_bustflag = TRUE)
	SetVar $z_bustflagd  ANSI_10 & "ON"
Else
	SetVar $z_bustflagd  ANSI_12 & "OFF"
End
Gosub :Z_Lib~HEADER
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"F"& ANSI_12 &"]=- "& ANSI_11 &"Mow Figs    : " & ANSI_15 $z_mowfigs & [4;55H & ANSI_13 & "Known Sectors"
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"M"& ANSI_12 &"]=- "& ANSI_11 &"Mow Mines   : " & ANSI_15 $z_mowmines & [5;53H & ANSI_12 & #196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196
If (STARDOCK > 0) and (STARDOCK <= SECTORS)
	Echo "*" & ANSI_12 &"-=["& ANSI_14 &"L"& ANSI_12 &"]=- "& ANSI_11 &"Mow Limpets : " & ANSI_15 $z_mowlimps & [6;54H & ANSI_10 & "STARDOCK: " & ANSI_15 & STARDOCK
Else
	Echo "*" & ANSI_12 &"-=["& ANSI_14 &"L"& ANSI_12 &"]=- "& ANSI_11 &"Mow Limpets : " & ANSI_15 $z_mowlimps & [6;54H & ANSI_10 & "STARDOCK: " & ANSI_12 & "NOT FOUND"
End
If ($z_sdbackdoor > 0) and ($z_sdbackdoor <= SECTORS)
	Echo "*"  & [7;54H & ANSI_2 & "Dock BD : " & ANSI_7 & $z_sdbackdoor
Else
	Echo "*"  & [7;54H & ANSI_2 & "Dock BD : " & ANSI_4 & "NOT FOUND"
End
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"1"& ANSI_12 &"]=- "& ANSI_11 &"Charge Key  : " & ANSI_4 "[" & ANSI_15 $z_chargekey & ANSI_4 "]" & [8;53H & ANSI_12 & #196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196
If (ALPHACENTAURI > 0) and (ALPHACENTAURI <= SECTORS)
	Echo "*" & ANSI_12 &"-=["& ANSI_14 &"2"& ANSI_12 &"]=- "& ANSI_11 &"Mow Key     : " & ANSI_4 "[" & ANSI_15 $z_mowkey & ANSI_4 "]" & [9;54H & ANSI_10 & "ALPHA   : " & ANSI_15 & ALPHACENTAURI
Else
	Echo "*" & ANSI_12 &"-=["& ANSI_14 &"2"& ANSI_12 &"]=- "& ANSI_11 &"Mow Key     : " & ANSI_4 "[" & ANSI_15 $z_mowkey & ANSI_4 "]" & [9;54H & ANSI_10 & "ALPHA   : " & ANSI_12 & "NOT FOUND"
End
If ($z_acbackdoor > 0) and ($z_acbackdoor <= SECTORS)
Echo "*" & [10;54H & ANSI_2 & "Alpha BD: " & ANSI_7 & $z_acbackdoor
Else
	Echo "*" & [10;54H & ANSI_2 & "Alpha BD: " & ANSI_4 & "NOT FOUND"
End
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"3"& ANSI_12 &"]=- "& ANSI_11 &"Menu Key    : " & ANSI_4 "[" & ANSI_15 $z_chargemenukey & ANSI_4 "]" & [11;53H & ANSI_12 & #196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196
If (RYLOS > 0) and (RYLOS <= SECTORS)
	Echo "*" & [12;54H & ANSI_10 & "RYLOS   : " & ANSI_15 & RYLOS
Else
	Echo "*" & [12;54H & ANSI_10 & "RYLOS   : " & ANSI_12 & "NOT FOUND"
End
If ($z_rybackdoor > 0) and ($z_rybackdoor <= SECTORS)
	Echo "*" & ANSI_12 &"-=["& ANSI_14 &"B"& ANSI_12 &"]=- "& ANSI_11 &"Base Sector : " & ANSI_2 "[" & ANSI_15 $z_base & ANSI_2 "]" & [13;54H & ANSI_2 & "Rylos BD: " & ANSI_7 & $z_rybackdoor
Else
	Echo "*" & ANSI_12 &"-=["& ANSI_14 &"B"& ANSI_12 &"]=- "& ANSI_11 &"Base Sector : " & ANSI_2 "[" & ANSI_15 $z_base & ANSI_2 "]" & [13;54H & ANSI_2 & "Rylos BD: " & ANSI_4 & "NOT FOUND"
End
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"S"& ANSI_12 &"]=- "& ANSI_11 &"Safe (or scrub) Sector : " & ANSI_2 "[" & ANSI_14 $z_safesector & ANSI_2 "]" & [14;53H & ANSI_12 & #196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196
If ($z_tebackdoor > 0) and ($z_tebackdoor <= SECTORS)
	Echo "*" & [15;54H & ANSI_2 & "Terra BD: " & ANSI_7 & $z_tebackdoor
Else
	Echo "*" & [15;54H & ANSI_2 & "Terra BD: " & ANSI_4 & "NOT FOUND"
End
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"U"& ANSI_12 &"]=- "& ANSI_11 &"Update Ship Info After Xport : " & ANSI_15 $z_update & [16;53H & ANSI_12 & #196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196
Echo "*"
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"O"& ANSI_12 &"]=- "& ANSI_11 &"Fighter/Mine Owner : " & $z_figownerd
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"T"& ANSI_12 &"]=- "& ANSI_11 &"Fighter Type       : " & $z_figtyped
Echo "*"
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"Y"& ANSI_12 &"]=- "& ANSI_11 &"MSL Echos          : " & $z_mslflagd
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"Z"& ANSI_12 &"]=- "& ANSI_11 &"Bust Echos         : " & $z_bustflagd
Echo "*"
If ($avoidsfiledeleted = TRUE)
	Echo "*" & ANSI_12 &"-=["& ANSI_14 &"D"& ANSI_12 &"]=- "& ANSI_11 &"Delete Avoids File :" & "[5m" & ANSI_14 & " DELETED!" & "[0m"
	SetVar $avoidsfiledeleted FALSE
Else
	Echo "*" & ANSI_12 &"-=["& ANSI_14 &"D"& ANSI_12 &"]=- "& ANSI_11 &"Delete Avoids File"
End
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"X"& ANSI_12 &"]=- "& ANSI_11 &"Export Avoids List"
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"I"& ANSI_12 &"]=- "& ANSI_11 &"Import Avoids List"
Gosub :Z_Lib~REDLINE
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"G"& ANSI_12 &"]=- "& ANSI_11 &"GO !"
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"Q"& ANSI_12 &"]=- "& ANSI_11 &"Quit"
Echo "**"
GetConsoleInput $choice SINGLEKEY
UpperCase $choice
If ($choice = "F")
	Echo "**" & ANSI_10 & "Number of figs to drop in each sector: "
	GetConsoleInput $value
	IsNumber $isnum $value
	If ($isnum = TRUE)
		SetVar $z_mowfigs $value
		If ($z_mowfigs > 50000)
			SetVar $z_mowfigs "50000"
		End
		SaveVar $z_mowfigs
	End
ElseIf ($choice = "M")
	Echo "**" & ANSI_10 & "Number of armid mines to drop in each sector: "
	GetConsoleInput $value
	IsNumber $isnum $value
	If ($isnum = TRUE)
		SetVar $z_mowmines $value
		SaveVar $z_mowmines
	End
ElseIf ($choice = "L")
	Echo "**" & ANSI_10 & "Number of Limpets to drop in each sector: "
	GetConsoleInput $value
	IsNumber $isnum $value
	If ($isnum = TRUE)
		SetVar $z_mowlimps $value
		SaveVar $z_mowlimps
	End
ElseIf ($choice = "U")
	If ($z_updateship = TRUE)
		SetVar $z_updateship FALSE
	ElseIf ($z_updateship = FALSE)
		SetVar $z_updateship TRUE
	End
	SaveVar $z_updateship
ElseIf ($choice = "1")
	Echo "**" & ANSI_10 & "Press the key for charging:"
	GetConsoleInput $value SINGLEKEY
	UpperCase $value
	If ($value <> #13)
		SetVar $z_chargekey $value
		SaveVar $z_chargekey
	End
ElseIf ($choice = "2")
	Echo "**" & ANSI_10 & "Press the key for mowing:"
	GetConsoleInput $value SINGLEKEY
	UpperCase $value
	If ($value <> #13)
		SetVar $z_mowkey $value
		SaveVar $z_mowkey
	End
ElseIf ($choice = "3")
	Echo "**" & ANSI_10 & "Press the key for returning to the menu:"
	GetConsoleInput $value SINGLEKEY
	UpperCase $value
	If ($value <> #13)
		SetVar $z_chargemenukey $value
		SaveVar $z_chargemenukey
	End
ElseIf ($choice = "B")
	Echo "**" & ANSI_10 & "Enter Base Sector: "
	GetConsoleInput $value
	IsNumber $isnum $value
	If ($isnum = TRUE)
		If (($value > 0) and ($value <= SECTORS))
			SetVar $z_base $value
			SaveVar $z_base
		End
	End	
ElseIf ($choice = "S")
	Echo "**" & ANSI_10 & "Enter Safe Sector: "
	GetConsoleInput $value
	IsNumber $isnum $value
	If ($isnum = TRUE)
		If (($value > 0) and ($value <= SECTORS))
			SetVar $z_safesector $value
			SaveVar $z_safesector
		End
	End
ElseIf ($choice = "O")
	If ($z_figowner = "c")
		SetVar $z_figowner "p"
	Else
		SetVar $z_figowner "c"
	End
	SaveVar $z_figowner
ElseIf ($choice = "T")
	If ($z_figtype = "d")
		SetVar $z_figtype "o"
	ElseIf ($z_figtype = "o")
		SetVar $z_figtype "t"
	Else
		SetVar $z_figtype "d"
	End
	SaveVar $z_figtype
ElseIf ($choice = "Y")
	If ($z_mslflag = TRUE)
		SetVar $z_mslflag FALSE
	ElseIf ($z_mslflag = FALSE)
		SetVar $z_mslflag TRUE
		Gosub :GETMSLS
		If ($z_mslsok <> TRUE)
			SetVar $z_mslflag FALSE
		End
		If ($didmsls = TRUE)
			SetVar $didmsls FALSE
			Gosub :Z_Lib~SYNC
		End
	End
	SaveVar $z_mslflag
ElseIf ($choice = "Z")
	If ($z_bustflag = TRUE)
		SetVar $z_bustflag FALSE
	ElseIf ($z_bustflag = FALSE)
		SetVar $z_bustflag TRUE
	End
	SaveVar $z_bustflag
ElseIf ($choice = "D")
	Echo "**" & ANSI_12 & "This will delete the " & ANSI_14 & $avoidfile & ANSI_12 & " avoids backup file."
	Echo "**" & "[5m" & ANSI_15 & "     ARE YOU SURE (Y/N)?" & "[0m"
	GetConsoleInput $value SINGLEKEY
	UpperCase $value
	If ($value = "Y")
		Delete $avoidfile
	End
	SetVar $avoidsfiledeleted TRUE
ElseIf ($choice = "X")
	Gosub :EXPORTAVOIDS
ElseIf ($choice = "I")
	Gosub :IMPORTAVOIDS
ElseIf ($choice = "G")
	Gosub :Z_Lib~COMMSON
	Gosub :Z_Lib~HEADER
	Echo "*" & ANSI_11 & "[5m" & "AVAILABLE HOTKEYS " & "[0m" & ANSI_11 & "-  " & ANSI_10 & "MOW KEY: " & ANSI_12 & "[" & ANSI_15 & $z_mowkey & ANSI_12 & "]       " & ANSI_10 & "CHARGE KEY: " & ANSI_12 & "[" & ANSI_15 & $z_chargekey & ANSI_12 & "]       " & ANSI_10 & "MENU KEY: " & ANSI_12 & "[" & ANSI_15 & $z_chargemenukey & ANSI_12 & "]"
	Gosub :Z_Lib~REDLINE
	Send #145
	Goto :START
ElseIf ($choice = "Q")
	Goto :FINISH
End
Goto :STARTMENU
:START
SetVar $Z_Surround~surroundowner $z_figowner
SetVar $Z_Surround~surroundmines $z_mowmines
SetVar $Z_Surround~surroundlimps $z_mowlimps
SetVar $Z_Surround~surroundfigs $z_mowfigs
SetVar $botted FALSE
SetVar $trigger19 "Security code accepted, engaging transporter control."
If ($z_updateship = TRUE)
	SetTextTrigger trigger19 :CHANGEDSHIP $trigger19
End
SetTextOutTrigger 1 :CHARGEKEYPRESSED $z_chargekey 
SetTextOutTrigger 2 :MOWKEYPRESSED $z_mowkey
SetTextOutTrigger 3 :MENUKEYPRESSED $z_chargemenukey
If (($z_mslflag = TRUE) and ($z_mslsok = TRUE)) or ($z_bustflag = TRUE)
	SetTextTrigger flags :FLAGS "Command [TL="
End
SetTextLineTrigger mowbot :MOWBOT $z_botname & " mow "
SetTextLineTrigger mowbot2 :MOWBOT $z_botname & " Mow "
SetTextLineTrigger chargebot :CHARGEBOT $z_botname & " charge "
SetTextLineTrigger chargebot2 :CHARGEBOT $z_botname & " Charge "
SetTextTrigger set1avoid :SET1AVOID "will now be avoided in future navigation calculations."
SetTextTrigger clear1avoid :CLEAR1AVOID "has been cleared and will be used in future plots."
SetTextLineTrigger clearavoids :CLEARAVOIDS "Avoided sectors Cleared."
Pause
:EXPORTAVOIDS
Echo "**" & ANSI_12 & "Delete the " & ANSI_14 & $avoidfile & ANSI_12 & " avoids backup file first? (Y/N)"
GetConsoleInput $value SINGLEKEY
UpperCase $value
If ($value = "Y")
	Delete $avoidfile
End
SetVar $avoidsfiledeleted TRUE
Send "q q q z 0* q z 0* q z 0*"
Gosub :GETAVOIDS
Echo "**" ANSI_14 & "Export complete..."
Gosub :Z_Lib~ANYKEY
Return
:IMPORTAVOIDS
Echo "**" & ANSI_12 & "Clear current avoids first? (Y/N)"
GetConsoleInput $value SINGLEKEY
UpperCase $value
If ($value = "Y")
	Send "q q q z 0* q z 0* q z 0* c v * y y q "
	ClearAllAvoids
	Echo "**" & ANSI_14 &"Avoids Cleared..*"
End
Fileexists $fileok $avoidfile
If ($fileok = TRUE)
	ReadToArray $avoidfile $avoidlist
	SetVar $i 1
	Send "^"
	While ($i <= $avoidlist)
		GetWord $avoidlist[$i] $word 1
		IsNumber $isnum $word
		If ($isnum = TRUE)
			If ($word > 0) and ($word <= SECTORS)
				Send "s" & $word & "*"
				SetAvoid $word
				Echo "*" & ANSI_15 & $word
			End
		End
		SetVar $i ($i + 1)
	End
	SetVar $i 1
	Send "q"
	Gosub :Z_Lib~SYNC
	Echo "**" & ANSI_14 & "Avoid Import List.*"
	While ($i <= $avoidlist)
		GetWord $avoidlist[$i] $word 1
		IsNumber $isnum $word
		If ($isnum = TRUE)
			If ($word > 0) and ($word <= SECTORS)
				Echo "*" & ANSI_15 & $word
			End
		End
		SetVar $i ($i + 1)
	End
	Echo "**" & ANSI_14 & "Import Complete..*"
Else
	Echo "**" & ANSI_14 & $avoidfile & ANSI_12 & " FILE NOT FOUND !!!*"
End
Gosub :Z_Lib~ANYKEY
Return
:GETAVOIDS
SetVar $i 0
SetTextTrigger getready :GETREADY "<List Avoided Sectors>"
Send "cxq"
Pause
:GETREADY
KillAllTriggers
SetTextLineTrigger getavoids :GETALINEAVOIDS ""
Pause
:GETALINEAVOIDS
KillAllTriggers
GetWord CURRENTLINE $word 1
If ($word <> "Computer")
	SetVar $i ($i + 1)
	SetVar $line[$i] CURRENTLINE
	SetTextLineTrigger getavoids :GETALINEAVOIDS ""
	Pause
End
SetVar $j 1
While ($j <= $i)
	If ($line[$j] <> "")
		SetVar $line[$j] ($line[$j] & " !!!!")
		SetVar $k 1
		SetVar $word ""
		Echo "**" & ANSI_14 & "Avoid List.*"
		While ($word <> "!!!!")
			GetWord $line[$j] $word $k
			IsNumber $isnum $word
			If ($isnum = TRUE)
				SetAvoid $word
				Write $avoidfile $word
				Echo "*" & ANSI_15 $word
			End
			SetVar $k ($k + 1)
		End
	End
	SetVar $j ($j + 1)
End
Return
:SET1AVOID
KillAllTriggers
SetVar $line CURRENTLINE
GetText $line $avoidsector "Sector " " will"
IsNumber $isnum $avoidsector
If ($isnum = TRUE)
	SetAvoid $avoidsector
	Write $avoidfile $avoidsector
End
Goto :START
:CLEAR1AVOID
KillAllTriggers
SetVar $line CURRENTLINE
GetWord $line $avoidsector 1
IsNumber $isnum $avoidsector
If ($isnum = TRUE)
	ClearAvoid $avoidsector
End
Goto :START
:CLEARAVOIDS
KillAllTriggers
ClearAllAvoids
Goto :START
:FLAGS
KillAllTriggers
GetText CURRENTLINE $current_sector "]:[" "] ("
IsNumber $isnum $current_sector
GetTimer $endtime
If ($isnum = TRUE)
	SetVar $timelapsed ($endtime - $starttime)
	If ($timelapsed > 3000000000)
		SetVar $lastsect "-1"
	End
	If ($lastsect <> $current_sector)
		If ($z_mslflag = TRUE) and ($z_mslsok = TRUE)
			GetSectorParameter $current_sector "MSL" $ismsl
			If ($ismsl = TRUE)
				Echo ANSI_13 & "[" & ANSI_11 & "MSL" & ANSI_13 & "] " & ANSI_5
				GetTimer $starttime
			End
		End
		If ($z_bustflag = TRUE)
			GetSectorParameter $current_sector "BUSTED" $isbusted
			If ($isbusted = TRUE)
				Echo ANSI_12 & "[" & ANSI_14 & "BUSTED" & ANSI_12 & "] " & ANSI_5
				GetTimer $starttime
			End
		End
		SetVar $lastsect $current_sector
	End
End
Goto :START
:MOWBOT
KillAllTriggers
SetVar $line CURRENTLINE
UpperCase $line
If ($line <> "")
	SetVar $botted TRUE
	CutText $line $ck 1 1
	If ($ck <> "'") and ($ck <> "R")
		Goto :START
	End
	GetWordPos $line $pos "?"
	GetWordPos $line $pos2 "HELP"
	If ($pos > 0) or ($pos2 > 0)
		Gosub :HELP
		Goto :START
	End
	SetVar $mode "MOW"
	SetVar $bot $z_botname
	Uppercase $bot
	CutText $line $line2 2 999
	If ($ck ="R")
		GetWord $line2 $word 1
		StripText $line2 " " & $word
	End
	SetVar $line $line2
	SetVar $line2 ""
	StripText $line $bot&" "
	StripText $line "MOW"
	StripText $line " "
	SetVar $choice $line
	SetVar $target "0"
	LoadVar $z_base
	Gosub :GETBACKDOORS
	LoadVar $z_safesector
	SetVar $stardockok FALSE
	If (STARDOCK > 0) and (STARDOCK <= SECTORS)
		SetVar $stardockok TRUE
	End	
	SetVar $rylosok FALSE
	If (RYLOS > 0) and (RYLOS <= SECTORS)
		SetVar $rylosok TRUE
	End
	SetVar $alphaok FALSE
	If (ALPHACENTAURI > 0) and (ALPHACENTAURI <= SECTORS)
		SetVar $alphaok TRUE
	End
	SetVar $baseok FALSE
	If ($z_base > 0) and ($z_base <= SECTORS)
		SetVar $baseok TRUE
	End
	SetVar $safeok FALSE
	If ($z_safesector > 0) and ($z_safesector <= SECTORS)
		SetVar $safeok TRUE
	End
	If ($z_sdbackdoor > 0) and ($z_sdbackdoor <= SECTORS)
			SetVar $sdbdok TRUE
	End
	If ($z_acbackdoor > 0) and ($z_acbackdoor <= SECTORS)
			SetVar $acbdok TRUE
	End
	If ($z_rybackdoor > 0) and ($z_rybackdoor <= SECTORS)
			SetVar $rybdok TRUE
	End
	If ($z_tebackdoor > 0) and ($z_tebackdoor <= SECTORS)
			SetVar $tebdok TRUE
	End
	Gosub :BOTMOWCHARGE
	If ($gotomenu = TRUE)
		Goto :START
	End
	If ($target < 1) or ($target > SECTORS)
		Gosub :DOOPTIONS
		Goto :START
	End
	Gosub :MOVE
End
Goto :START
:CHARGEBOT
KillAllTriggers
SetVar $line CURRENTLINE
UpperCase $line
If ($line <> "")
	SetVar $botted TRUE
	CutText $line $ck 1 1
	If ($ck <> "'") and ($ck <> "R")
		Goto :START
	End
	GetWordPos $line $pos "?"
	GetWordPos $line $pos2 "HELP"
	If ($pos > 0) or ($pos2 > 0)
		Gosub :HELP
		Goto :START
	End
	SetVar $mode "CHARGE"
	SetVar $bot $z_botname
	Uppercase $bot
	CutText $line $line2 2 999
	If ($ck ="R")
		GetWord $line2 $word 1
		StripText $line2 " " & $word
	End
	SetVar $line $line2
	SetVar $line2 ""
	StripText $line $bot&" "
	StripText $line "CHARGE"
	StripText $line " "
	SetVar $choice $line
	SetVar $target "0"
	LoadVar $z_base
	Gosub :GETBACKDOORS
	LoadVar $z_safesector
	SetVar $stardockok FALSE
	If (STARDOCK > 0) and (STARDOCK <= SECTORS)
		SetVar $stardockok TRUE
	End	
	SetVar $rylosok FALSE
	If (RYLOS > 0) and (RYLOS <= SECTORS)
		SetVar $rylosok TRUE
	End
	SetVar $alphaok FALSE
	If (ALPHACENTAURI > 0) and (ALPHACENTAURI <= SECTORS)
		SetVar $alphaok TRUE
	End
	SetVar $baseok FALSE
	If ($z_base > 0) and ($z_base <= SECTORS)
		SetVar $baseok TRUE
	End
	SetVar $safeok FALSE
	If ($z_safesector > 0) and ($z_safesector <= SECTORS)
		SetVar $safeok TRUE
	End
	If ($z_sdbackdoor > 0) and ($z_sdbackdoor <= SECTORS)
			SetVar $sdbdok TRUE
	End
	If ($z_acbackdoor > 0) and ($z_acbackdoor <= SECTORS)
			SetVar $acbdok TRUE
	End
	If ($z_rybackdoor > 0) and ($z_rybackdoor <= SECTORS)
			SetVar $rybdok TRUE
	End
	If ($z_tebackdoor > 0) and ($z_tebackdoor <= SECTORS)
			SetVar $tebdok TRUE
	End
	Gosub :BOTMOWCHARGE
	If ($gotomenu = TRUE)
		Goto :START
	End
	If ($target < 1) or ($target > SECTORS)
		Gosub :DOOPTIONS
		Goto :START
	End
	Gosub :MOVE
End
Goto :START
:CHARGEKEYPRESSED
KillAllTriggers
SetVar $mode "CHARGE"
Gosub :GETTARGET
If ($gotomenu = TRUE)
	Goto :MENUKEYPRESSED
End
If ($target < 1) or ($target > SECTORS)
	Gosub :DOOPTIONS
	Goto :START
End
Gosub :MOVE
Goto :START
:MOWKEYPRESSED
KillAllTriggers
SetVar $mode "MOW"
Gosub :GETTARGET
If ($gotomenu = TRUE)
	Goto :MENUKEYPRESSED
End
If ($target < 1) or ($target > SECTORS)
	Gosub :DOOPTIONS
	Goto :START
End
Gosub :MOVE
Goto :START
:MENUKEYPRESSED
KillAllTriggers
Gosub :Z_Lib~COMMSOFF
Goto :STARTMENU
:CHANGEDSHIP
KillAllTriggers
Send "* "
Gosub :GETSHIPDATA
Gosub :CHECKIGON
Waitfor "Interdictor"
WaitFor "Command [TL="
Goto :START
:GETBACKDOORS
Gosub :Z_Backdoors~BACKDOORS
SetVar $z_sdbackdoor $Z_Backdoors~sdbackdoor
SetVar $z_rybackdoor $Z_Backdoors~rybackdoor
SetVar $z_acbackdoor $Z_Backdoors~acbackdoor
SetVar $z_tebackdoor $Z_Backdoors~tebackdoor
Return
:DOOPTIONS
If ($target < 1) or ($target > SECTORS)
	SetVar $target CURRENTSECTOR
End
If ($z_surround = TRUE)
		Send "q q q z 0* q z 0* q z 0*"
		SetVar $Z_Surround~surroundwave $z_wave
		Gosub :Z_Surround~SURROUND
	End
	If ($z_wavecap = TRUE)
		Send "q q q z 0* q z 0* q z 0* a t y n q z " & $z_wave & "n y *qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn"
	End
	If ($z_capture = TRUE)
		send "q q q z 0* q z 0* q z 0* zn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn ay1* qzn"
	End
	If ($z_kill = TRUE)
		SetVar $count 1
		While ($count <= 10)
	#		Send "a y n q z " & $z_wave & "* a n y q z " & $z_wave & "*"
	#		Send "q q q z 0* q z 0* q z 0*a t y n q z " & $z_wave & "n y *"
			Send "q q q z 0* q z 0* q z 0*a t y n q z " & $z_wave & "n y * a t n y q z " & $z_wave & "n y *"
			SetVar $count ($count + 1)
		End
	End
	If ($z_callsaveme = TRUE)
		Send "q q q z 0* q z 0* q z 0*"
		SetVar $z_dockport FALSE
		Gosub :Z_SaveMe~CALL
	End
	If ($z_dockport = TRUE)
		If (SECTOR.EXPLORED[$target] <> "YES")
			Send "*"
			Gosub :Z_Lib~SYNC
		End
		Send "q q q z 0* q z 0* q z 0*"
		If ($target = STARDOCK) and (PORT.EXISTS[$target] = TRUE)
		   Send "p sg yg q"
		ElseIf (PORT.EXISTS[$target] = TRUE)
		   Send "P *"
		Else
			Send "*"
		End
	Else
		Send "*"
	End
	If ($botted = TRUE)
		If ($target < 1) or ($target > SECTORS)
			SetVar $ssstring "Target Sector NOT VALID... Not Mowing/Charging...*"
		Else
			SetVar $ssstring ""
		End
		If ($z_surround = TRUE)
			SetVar $ssstring ($ssstring & "Surround option executed...*")
		End
		If ($z_wavecap = TRUE)
			SetVar $ssstring ($ssstring & "WaveCap option executed...*")
		End
		If ($z_capture = TRUE)
			SetVar $ssstring ($ssstring & "Capture option executed...*")
		End
		If ($z_kill = TRUE)
			SetVar $ssstring ($ssstring & "Kill option executed...*")
		End
		If ($z_callsaveme = TRUE)
			SetVar $ssstring ($ssstring & "Call Saveme option executed...*")
		End
		If ($z_dockport = TRUE)
			SetVar $ssstring ($ssstring & "Port option executed...*")
		End
		If ($ssstring <> "")
			Send "'*" & $ssstring & "*"
		End
		SetVar $ssstring ""
	End
Return
:MOVE
KillAllTriggers
SetVar $destination $target
Gosub :GETCOURSE
If ($badpath = TRUE)
	Goto :ENDMOVE
End
SetVar $leg 2
SetVar $mowmacro "q q q z 0* q z 0* q z 0* "
While ($leg <= $mowcourselen)
	SetVar $mowmacro ($mowmacro & "m " & $mowcourse[$leg] & "*    ")
	If (($mowcourse[$leg] > 10) and ($mowcourse[$leg] <> STARDOCK))
		SetVar $mowmacro ($mowmacro & "za" & $z_wave & "* *  ")
	end
	If (($mode = "MOW") and ($z_mowfigs >= 0) and ($mowcourse[$leg] > 10) and ($mowcourse[$leg] <> STARDOCK) and ($leg > 1))
		If ($z_figtype = "d")
			SetVar $mowmacro ($mowmacro & "fz" & $z_mowfigs & "*" & $z_figowner & "q*d")
		Else
			SetVar $mowmacro ($mowmacro & "fz" & $z_mowfigs & "*" & $z_figowner & "q*" & $z_figtype & "q * ")
		End
		SetSectorParameter $mowcourse[$leg] "FIGSEC" TRUE
	end
	If (($mode = "MOW") and ($z_mowmines > 0) and ($mowcourse[$leg] > 10) and ($mowcourse[$leg] <> STARDOCK) and ($leg > 1))
		SetVar $mowmacro ($mowmacro & "h 1 z" & $z_mowmines & " * z" & $z_figowner & "* ")
		SetSectorParameter $mowcourse[$leg] "MINESEC" TRUE
	end
	If (($mode = "MOW") and ($z_mowlimps > 0) and ($mowcourse[$leg] > 10) and ($mowcourse[$leg] <> STARDOCK) and ($leg > 1))
		SetVar $mowmacro ($mowmacro & "h 2 z" & $z_mowlimps & " * z" & $z_figowner & "* ")
		SetSectorParameter $mowcourse[$leg] "LIMPSEC" TRUE
	end
	SetVar $leg ($leg + 1)
End
Send $mowmacro
Gosub :DOOPTIONS
If ($botted = TRUE)
	Send "'Arrived at sector: [" & $target & "]*"
End
:ENDMOVE
Return
:GETCOURSE
#---------------------------------------------------------------
Getcourse $mowcourse CURRENTSECTOR $destination
If ($mowcourse <> "-1")
	SetVar $mowcourselen ($mowcourse + 1)
	Goto :GETCOURSEDONE
End
#---------------------------------------------------------------
SetArray $mowcourse 80
SetVar $rawsectors ""
SetTextLineTrigger linetrigger1 :STARTGETCOURSE " > "
setTextLineTrigger linetrigger6 :STARTGETCOURSE "Error - No route within"
Send "^f*" & $destination & "*q"
Pause
:STARTGETCOURSE
KillAllTriggers
SetVar $badpath FALSE
SetVar $line CURRENTLINE
ReplaceText $line ">" " "
StripText $line "("
StripText $line ")"
SetVar $line ($line & " ")
GetWordPos $line $pos1 "So what's the point?"
GetWordPos $line $pos2 ": ENDINTERROG"
GetWordPos $line $pos3 "Error"
If ($pos1 > 0) or ($pos2 > 0)
	SetVar $badpath TRUE
	Goto :BADPATH
End
If ($pos3 > 0)
	Send "* q "
	SetVar $badpath TRUE
	Goto :BADPATH
End
GetWordPos $line $pos1 "FM"
GetWordPos $line $pos2 "TO"
if (($pos1 <= 0) AND ($pos2 <= 0))
	SetVar $rawsectors $rawsectors & " " & $line
end
GetWordPos $line $pos1 " " & $destination & " "
GetWordPos $line $pos2 "(" & $destination & ")"
GetWordPos $line $pos3 "TO"
If ((($pos1 > 0) OR ($pos2 > 0)) AND ($pos3 <= 0))
	goto :GOTSECTORS
Else
	setTextLineTrigger linetrigger1 :STARTGETCOURSE " > "	
	setTextLineTrigger linetrigger2 :STARTGETCOURSE " "& $destination & " "
	setTextLineTrigger linetrigger3 :STARTGETCOURSE "(" & $destination & ")"
	setTextLineTrigger linetrigger4 :STARTGETCOURSE "So what's the point?"
	setTextLineTrigger linetrigger5 :STARTGETCOURSE ": ENDINTERROG"
	setTextLineTrigger linetrigger6 :STARTGETCOURSE "Error - No route within"
	setTextLineTrigger linetrigger7 :STARTGETCOURSE " "& $destination
End
pause
:GOTSECTORS
SetVar $rawsectors $rawsectors & " !!!"
SetVar $mowcourselen "0"
SetVar $count "1"

GetWord $rawsectors $mowcourse[$count] $count
While ($mowcourse[$count] <> "!!!")
	SetVar $mowcourselen ($mowcourselen + 1)
	SetVar $count ($count + 1)
	GetWord $rawsectors $mowcourse[$count] $count
End
Goto :GETCOURSEDONE
:BADPATH
Echo "**" & ANSI_12 & "NO PATH FOUND TO THAT SECTOR!**"
:GETCOURSEDONE
Return
:GETTARGET
SetVar $target "0"
LoadVar $z_base
Gosub :GETBACKDOORS
LoadVar $z_safesector
SetVar $stardockok FALSE
SetVar $options ""
SetVar $options2 ""
SetVar $optslen 0
If ($z_mslflag = TRUE) and ($z_mslsok = TRUE)
	Gosub :CHECKMSLSFIGGED
End
SetVar $optslen ($optslen + 13)
If (STARDOCK > 0) and (STARDOCK <= SECTORS)
	SetVar $stardockok TRUE
	SetVar $options ($options & ANSI_10 & " [" & ANSI_15 & "D" & ANSI_10 & "]-STARDOCK")
	If ($z_sdbackdoor > 0) and ($z_sdbackdoor <= SECTORS)
		GetSectorParameter $z_sdbackdoor "FIGSEC" $figged 
		If ($figged = TRUE)
			SetVar $options2 ($options2 & ANSI_10 & " [" & ANSI_15 & "DB" & ANSI_10 & "]-" & ANSI_2 & "DOCKBackDoor")
		Else
			SetVar $options2 ($options2 & ANSI_10 & " [" & ANSI_15 & "DB" & ANSI_10 & "]-" & ANSI_4 & "DOCKBackDoor")
		End
		SetVar $sdbdok TRUE
	Else
		SetVar $options2 ($options2 & ANSI_10 & " [" & ANSI_15 & "  " & ANSI_10 & "]-" & ANSI_8 & "DOCKBackDoor")
	End
Else
	SetVar $options ($options & ANSI_10 & "  [" & ANSI_15 & " " & ANSI_10 & "]-" & ANSI_8 & "STARDOCK")
	SetVar $options2 ($options2 & ANSI_10 & " [" & ANSI_15 & "  " & ANSI_10 & "]-" & ANSI_8 & "DOCKBackDoor")
End
SetVar $rylosok FALSE
SetVar $optslen ($optslen + 10)
If (RYLOS > 0) and (RYLOS <= SECTORS)
	SetVar $rylosok TRUE
	GetSectorParameter RYLOS "FIGSEC" $figged 
	If ($figged = TRUE)
		SetVar $options ($options & ANSI_10 & "  [" & ANSI_15 & "R" & ANSI_10 & "]-RYLOS")
	Else
		SetVar $options ($options & ANSI_10 & "  [" & ANSI_15 & "R" & ANSI_10 & "]-" & ANSI_12 & "RYLOS")
	End
	If ($z_rybackdoor > 0) and ($z_rybackdoor <= SECTORS)
		GetSectorParameter $z_rybackdoor "FIGSEC" $figged 
		If ($figged = TRUE)
			SetVar $options2 ($options2 & ANSI_10 & "  [" & ANSI_15 & "RB" & ANSI_10 & "]-" & ANSI_2 & "RYLOSBackDoor")
		Else
			SetVar $options2 ($options2 & ANSI_10 & "  [" & ANSI_15 & "RB" & ANSI_10 & "]-" & ANSI_4 & "RYLOSBackDoor")
		End
		SetVar $rybdok TRUE
	Else
		SetVar $options2 ($options2 & ANSI_10 & "  [" & ANSI_15 & "  " & ANSI_10 & "]-" & ANSI_8 & "RYLOSBackDoor")
	End
Else
	SetVar $options ($options & ANSI_10 & "  [" & ANSI_15 & " " & ANSI_8 & "]-RYLOS")
	SetVar $options2 ($options2 & ANSI_10 & "  [" & ANSI_15 & "  " & ANSI_10 & "]-" & ANSI_8 & "RYLOSBackDoor")
End
SetVar $alphaok FALSE
SetVar $optslen ($optslen + 10)
If (ALPHACENTAURI > 0) and (ALPHACENTAURI <= SECTORS)
	SetVar $alphaok TRUE
	GetSectorParameter ALPHACENTAURI "FIGSEC" $figged 
	If ($figged = TRUE)
		SetVar $options ($options & ANSI_10 & "  [" & ANSI_15 & "A" & ANSI_10 & "]-ALPHA")
	Else
		SetVar $options ($options & ANSI_10 & "  [" & ANSI_15 & "A" & ANSI_10 & "]-" & ANSI_12 & "ALPHA")
	End
	If ($z_acbackdoor > 0) and ($z_acbackdoor <= SECTORS)
		GetSectorParameter $z_acbackdoor "FIGSEC" $figged 
		If ($figged = TRUE)
			SetVar $options2 ($options2 & ANSI_10 & "  [" & ANSI_15 & "AB" & ANSI_10 & "]-" & ANSI_2 & "ALPHABackDoor")
		Else
			SetVar $options2 ($options2 & ANSI_10 & "  [" & ANSI_15 & "AB" & ANSI_10 & "]-" & ANSI_4 & "ALPHABackDoor")
		End
		SetVar $acbdok TRUE
	Else
		SetVar $options2 ($options2 & ANSI_10 & "  [" & ANSI_15 & "  " & ANSI_10 & "]-" & ANSI_8 & "ALPHABackDoor")
	End
Else
	SetVar $options ($options & ANSI_10 & "  [" & ANSI_15 & " " & ANSI_8 & "]-ALPHA")
	SetVar $options2 ($options2 & ANSI_10 & "  [" & ANSI_15 & "  " & ANSI_10 & "]-" & ANSI_8 & "ALPHABackDoor")
End
SetVar $baseok FALSE
SetVar $optslen ($optslen + 9)
If ($z_base > 0) and ($z_base <= SECTORS)
	SetVar $baseok TRUE
	GetSectorParameter $z_base "FIGSEC" $figged 
	If ($figged = TRUE)
		SetVar $options ($options & ANSI_10 & "  [" & ANSI_15 & "B" & ANSI_10 & "]-BASE")
	Else
		SetVar $options ($options & ANSI_10 & "  [" & ANSI_15 & "B" & ANSI_10 & "]-" & ANSI_12 & "BASE")
	End
Else
	SetVar $options ($options & ANSI_10 & "  [" & ANSI_15 & " " & ANSI_10 & "]-" & ANSI_8 & "BASE")
End
If ($z_tebackdoor > 0) and ($z_tebackdoor <= SECTORS)
	GetSectorParameter $z_tebackdoor "FIGSEC" $figged 
	If ($figged = TRUE)
		SetVar $options2 ($options2 & ANSI_10 & "  [" & ANSI_15 & "TB" & ANSI_10 & "]-" & ANSI_2 & "TERRABackDoor")
	Else
		SetVar $options2 ($options2 & ANSI_10 & "  [" & ANSI_15 & "TB" & ANSI_10 & "]-" & ANSI_4 & "TERRABackDoor")
	End
	SetVar $tebdok TRUE
	Else
		SetVar $options2 ($options2 & ANSI_10 & "  [" & ANSI_15 & "  " & ANSI_10 & "]-" & ANSI_8 & "TERRABackDoor")
	End
SetVar $safeok FALSE
SetVar $optslen ($optslen + 15)
If ($z_safesector > 0) and ($z_safesector <= SECTORS)
	SetVar $safeok TRUE
	GetSectorParameter $z_safesector "FIGSEC" $figged 
	If ($figged = TRUE)
		SetVar $options ($options & ANSI_10 & "  [" & ANSI_15 & "S" & ANSI_10 & "]-SAFESECTOR")
	Else
		SetVar $options ($options & ANSI_10 & "  [" & ANSI_15 & "S" & ANSI_10 & "]-" & ANSI_12 & "SAFESECTOR")
	End
Else
	SetVar $options ($options & ANSI_10 & "  [" & ANSI_15 & " " & ANSI_10 & "]-" & ANSI_8 & "SAFESECTOR")
End
SetVar $menuopt (ANSI_5 & " [" & ANSI_15 & $z_chargemenukey & ANSI_5 & "]-Menu")
SetVar $Z_Strings~padchar " "
SetVar $Z_Strings~padlen (80 - $optslen)
SetVar $Z_Strings~unpadded $menuopt
SetVar $Z_Strings~unpadlen 15
Gosub :Z_Strings~PAD
SetVar $menuopt $Z_Strings~padded 
SetVar $options ($options & $menuopt)
Gosub :Z_Lib~COMMSOFF
Echo "*" 
Gosub :Z_Lib~BLUELINE
Gosub :Z_Lib~ZEDLINE
Echo "[78D" & ANSI_14 & "[5m" & $mode & "[0m"
Echo "*" & $options 
If ($options2 <> "0")
	Echo "*" & $options2
End
Gosub :Z_Lib~BLUELINE
Echo "*" & ANSI_13 & "OPTIONS:" & ANSI_11 & " [" & ANSI_15 & "U" & ANSI_11 & "]-Surround  [" & ANSI_15 & "W" & ANSI_11 & "]-WaveCap  [" & ANSI_15 & "C" & ANSI_11 & "]-Cap  [" & ANSI_15 & "K" & ANSI_11 & "]-Kill  [" & ANSI_15 & "P" & ANSI_11 & "]-Port  [" & ANSI_15 & "V" & ANSI_11 & "]-Saveme"
Gosub :Z_Lib~BLUELINE
Echo "*" & ANSI_14 & "Enter the SECTOR NUMBER:" & "[s" & ANSI_15
If ($z_mslflag = TRUE) and ($z_mslsok = TRUE)
	If ($mslsfigged = FALSE)
		Echo "[42C" & ANSI_14 &"[" & ANSI_12 & "NO MSL FIGS" & ANSI_14 & "]" & "[u" & ANSI_15
	Else
		Echo "[43C" & ANSI_1 &"[" & ANSI_9 & "MSL FIGGED" & ANSI_1 & "]" & "[u" & ANSI_15
	End
End
GetConsoleInput $choice
:BOTMOWCHARGE
UpperCase $choice
SetVar $gotomenu FALSE
GetWordPos $choice $pos $z_chargemenukey
If ($pos > 0)
	StripText $choice $z_chargemenukey
	SetVar $gotomenu TRUE
	Goto :GOTOMENU
End
SetVar $z_dockport FALSE
GetWordPos $choice $pos "P"
If ($pos > 0)
	StripText $choice "P"
	SetVar $z_dockport TRUE
End
SetVar $z_wavecap FALSE
GetWordPos $choice $pos "W"
If ($pos > 0)
	StripText $choice "W"
	SetVar $z_wavecap TRUE
End
SetVar $z_capture FALSE
GetWordPos $choice $pos "C"
If ($pos > 0)
	StripText $choice "C"
	SetVar $z_capture TRUE
End
SetVar $z_kill FALSE
GetWordPos $choice $pos "K"
If ($pos > 0)
	StripText $choice "K"
	SetVar $z_kill TRUE
End
SetVar $z_surround FALSE
GetWordPos $choice $pos "U"
If ($pos > 0)
	StripText $choice "U"
	SetVar $z_surround TRUE
End
SetVar $z_callsaveme FALSE
GetWordPos $choice $pos "V"
If ($pos > 0)
	StripText $choice "V"
	SetVar $z_callsaveme TRUE
	SetVar $z_dockport FALSE
End
If ($choice = "D")
	If ($stardockok = TRUE)
		SetVar $target STARDOCK
	Else
		SetVar $target "-1"
	End
ElseIf ($choice = "R")
	If ($rylosok = TRUE)
		SetVar $target RYLOS
	Else
		SetVar $target "-1"
	End
ElseIf ($choice = "A")
	If ($alphaok = TRUE)
		SetVar $target ALPHACENTAURI
	Else
		SetVar $target "-1"
	End
ElseIf ($choice = "B")
	If ($baseok = TRUE)
		SetVar $target $z_base
	Else
		SetVar $target "-1"
	End
ElseIf ($choice = "S")
	If ($safeok = TRUE)
		SetVar $target $z_safesector
	Else
		SetVar $target "-1"
	End
ElseIf ($choice = "DB")
	If ($sdbdok = TRUE)
		SetVar $target $z_sdbackdoor
	Else
		SetVar $target "-1"
	End
ElseIf ($choice = "RB")
	If ($rybdok = TRUE)
		SetVar $target $z_rybackdoor
	Else
		SetVar $target "-1"
	End
ElseIf ($choice = "AB")
	If ($acbdok = TRUE)
		SetVar $target $z_acbackdoor
	Else
		SetVar $target "-1"
	End
ElseIf ($choice = "TB")
	If ($tebdok = TRUE)
		SetVar $target $z_tebackdoor
	Else
		SetVar $target "-1"
	End
Else
	IsNumber $isnum $choice
	If ($isnum = TRUE) 
		If ($choice > 0) and ($choice <= SECTORS)
			SetVar $target $choice
		Else
			SetVar $target "-1"
		End
	End
End
:GOTOMENU
Gosub :Z_Lib~COMMSON
Return
:FINISH
Gosub :Z_Lib~COMMSON
Sound ding
Halt
:GETMSLS
If ($z_mslflag = TRUE) and ($z_mslsok = FALSE)
	If (STARDOCK <> 0) and (RYLOS <> 0) and (ALPHACENTAURI <> 0)
		Send "^"
		Send "f1"&"*"&STARDOCK&"*"
		Send "f"&STARDOCK&"*"&"1*"
		Send "f"&RYLOS&"*"&STARDOCK&"*"
		Send "f"&STARDOCK&"*"&RYLOS&"*"
		Send "f"&ALPHACENTAURI&"*"&STARDOCK&"*"
		Send "f"&STARDOCK&"*"&ALPHACENTAURI&"*"
		Send "f"&ALPHACENTAURI&"*"&RYLOS&"*"
		Send "f"&RYLOS&"*"&ALPHACENTAURI&"*"
		Send "q"
		SetVar $didmsls TRUE
		SetVar $msloksofar TRUE
		GetCourse $msl1 1 STARDOCK
		If ($msl1 < 0)
			SetVar $msloksofar FALSE
		End
		GetCourse $msl2 STARDOCK 1
		If ($msl2 < 0)
			SetVar $msloksofar FALSE
		End
		GetCourse $msl3 STARDOCK RYLOS
		If ($msl3 < 0)
			SetVar $msloksofar FALSE
		End
		GetCourse $msl4 RYLOS STARDOCK
		If ($msl4 < 0)
			SetVar $msloksofar FALSE
		End
		GetCourse $msl5 ALPHACENTAURI STARDOCK
		If ($msl5 < 0)
			SetVar $msloksofar FALSE
		End
		GetCourse $msl6 STARDOCK ALPHACENTAURI
		If ($msl6 < 0)
			SetVar $msloksofar FALSE
		End
		GetCourse $msl7 ALPHACENTAURI RYLOS
		If ($msl7 < 0)
			SetVar $msloksofar FALSE
		End
		GetCourse $msl8 RYLOS ALPHACENTAURI
		If ($msl8 < 0)
			SetVar $msloksofar FALSE
		End
		If ($msloksofar = TRUE)
			SetVar $count 1
			SetArray $msllist SECTORS
			SetVar $z_msllist ""
			While ($count <= $msl1 + 1)
				SetSectorParameter $msl1[$count] "MSL" TRUE
				SetVar $msllist[$msl1[$count]] TRUE
				SetVar $count ($count + 1)
			End
			SetVar $count 1
			While ($count <= $msl2 + 1)
				SetSectorParameter $msl2[$count] "MSL" TRUE
				SetVar $msllist[$msl2[$count]] TRUE
				SetVar $count ($count + 1)
			End
			SetVar $count 1
			While ($count <= $msl3 + 1)
				SetSectorParameter $msl3[$count] "MSL" TRUE
				SetVar $msllist[$msl3[$count]] TRUE
				SetVar $count ($count + 1)
			End
			SetVar $count 1
			While ($count <= $msl4 + 1)
				SetSectorParameter $msl4[$count] "MSL" TRUE
				SetVar $msllist[$msl4[$count]] TRUE
				SetVar $count ($count + 1)
			End
			SetVar $count 1
			While ($count <= $msl5 + 1)
				SetSectorParameter $msl5[$count] "MSL" TRUE
				SetVar $msllist[$msl5[$count]] TRUE
				SetVar $count ($count + 1)
			End
			SetVar $count 1
			While ($count <= $msl6 + 1)
				SetSectorParameter $msl6[$count] "MSL" TRUE
				SetVar $msllist[$msl6[$count]] TRUE
				SetVar $count ($count + 1)
			End
			SetVar $count 1
			While ($count <= $msl7 + 1)
				SetSectorParameter $msl7[$count] "MSL" TRUE
				SetVar $msllist[$msl7[$count]] TRUE
				SetVar $count ($count + 1)
			End
			SetVar $count 1
			While ($count <= $msl8 + 1)
				SetSectorParameter $msl8[$count] "MSL" TRUE
				SetVar $msllist[$msl8[$count]] TRUE
				SetVar $count ($count + 1)
			End
			SetVar $count 11
			While ($count <= SECTORS)
				If ($msllist[$count] = TRUE)
					SetVar $z_msllist ($z_msllist & " " & $count & " ")
				End
				SetVar $count ($count + 1)
			End
			SaveVar $z_msllist
			SetArray $msllist 0
			SetArray $msl1 0
			SetArray $msl2 0
			SetArray $msl3 0
			SetArray $msl4 0
			SetArray $msl5 0
			SetArray $msl6 0
			SetArray $msl7 0
			SetArray $msl8 0
			SetVar $z_mslsok TRUE
			SaveVar $z_mslsok
		End
	End
End
Return
:CHECKMSLSFIGGED
	SetVar $mslsfigged FALSE
	If ($z_msllist <> 0)
		SetVar $wordnum 1
		SetVar $keepgoing TRUE
		While ($keepgoing = TRUE)
			SetVar $keepgoing FALSE
			GetWord $z_msllist $word $wordnum
			SetVar $wordnum ($wordnum + 1)
			If ($word <> "") and ($word <> "0")
				SetVar $keepgoing TRUE
				GetSectorParameter $word "FIGSEC" $mslisfigged
				If ($mslisfigged = TRUE)
					SetVar $keepgoing FALSE
					SetVar $mslsfigged TRUE
				End
			End
		End
	End
Return
:GETSHIPDATA
KillAllTriggers
SetTextLineTrigger 1 :GOTWAVE "Max Figs Per Attack:"
Send "c;"
Pause
:GOTWAVE
KillAllTriggers
GetWord CURRENTLINE $z_wave 5
StripText $z_wave ","
Send "q"
Return
:CHECKIGON
KillAllTriggers
SetTextLineTrigger igok :IGON "Your Interdictor generator is now"
SetTextLineTrigger noig :NOIG "is not equipped with an Interdictor Generator!"
Send "b"
Pause
:IGON
GetWord CURRENTLINE $ig 6
If ($ig = "ON")
   Send "n"
Else
   Send "y"
End
:NOIG
KillAllTriggers
Return
# HELP 
:HELP
Send "'*"
Send "---------------------------------------------------------------------*"
Send "Zed's Charger v" & $version & " Help*"
Send "------------------------*"
Send "Mower and Charger.*"
Send "-*"
Send "Usage: {" & $z_botname & "} mow [SECTOR|SHORTCODE]{OPTIONS}*"
Send "   or: {" & $z_botname & "} charge [SECTOR|SHORTCODE]{OPTIONS}*"
Send "-*"
Send "      SECTOR - Destination sector number (1-SECTORS) or*"
Send "   SHORTCODE - D for STARDOCK      - DB STARDOCK BACKDOOR*"
Send "             - A for ALPHA         - AB ALPHA BACKDOOR*"
Send "             - R for RYLOS         - RB RYLOS BACKDOOR*"
Send "             - B for BASE          - TB TERRA BACKDOOR*"
Send "             - S for SAFESECTOR*"
Send "-*"
Send "     OPTIONS - U Surround          - K Kill*"
Send "             - W WaveCap           - P Port*"
Send "             - C Cap               - V Call Saveme*"
Send "-*"
Send "Note: Options will run in the following order if present: U W C K P V*"
Send "      P and V are mutually exclusive.*"
Send "---------------------------------------------------------------------*"
Send "** "
Return
# INCLUDES
Include include\Z_Auth.ts
Include include\Z_Lib.ts
Include include\Z_SaveMe.ts
Include include\Z_Strings.ts
Include include\Z_Surround.ts
Include include\Z_Backdoors.ts
# ZeD Compiled: Fri 31/12/2010 -  9:39:13.76 
# ZeD Compiled: Wed 05/01/2011 - 23:18:19.51 
# ZeD Compiled: Fri 07/01/2011 -  5:47:29.18 
# ZeD Compiled: Sun 09/01/2011 -  1:43:45.89 
# ZeD Compiled: Sat 22/01/2011 -  2:55:44.29 
# ZeD Compiled: Wed 02/02/2011 - 21:30:47.42 
