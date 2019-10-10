SystemScript
# Title: ZRR
# Author: Zed
# Copyright (c) 2010 by Archibald H. Vilanos III
# All Rights Reserved.
# Sector Responder with refurb and retreat abilities.
SetVar $version "1.17" & #225 & "e"
SetVar $scriptname "ZRR"
SetVar $scripttitle "Zed's Rapid Response"
SetVar $Z_Lib~scripttitle $scripttitle
SetVar $Z_Lib~Version $version
GoSub :Z_Lib~INITLIB
# AUTHORISE
SetVar $authorise FALSE
If ($authorise <> TRUE)
	Gosub :Z_Auth~CHECK
End
SetVar $Z_Lib~license LOGINNAME
# End Authorise
LoadVar $z_wave
LoadVar $z_safesector
LoadVar $z_safeship
LoadVar $z_planet
LoadVar $z_base
LoadVar $z_var1
LoadVar $z_var2
LoadVar $z_var3
LoadVar $z_var4
LoadVar $z_var5
LoadVar $z_var6
LoadVar $z_volley
LoadVar $z_rvolley
LoadVar $z_autovolley
LoadVar $z_menukey
LoadVar $z_pausekey
LoadVar $z_macrotype
LoadVar $z_code
If ($z_autovolley = "0")
	SetVar $z_autovolley "1"
End
SetVar $z_attackmacro "0"
SetVar $z_mode "1"
If ($z_pausekey = "0")
	SetVar $z_pausekey "-"
End
If ($z_menukey = "0")
	SetVar $z_menukey "~"
End
SetVar $z_totalkills "0"
Gosub :LOADKILLS
LoadVar $z_gamekills
SetVar $z_startkills "0"
LoadVar $z_attacknum
If ($z_attacknum < "1") or ($z_attacknum > "5")
   SetVar $z_attacknum "1"
   SaveVar $z_attacknum
End
LoadVar $bot_name
SetVar $z_botname $bot_name
Gosub :LOADPARMS
SetVar $Z_Lib~scriptname $scriptname
Gosub :Z_Lib~CHECKONCE
SetVar $Z_Lib~setprompt "COMMAND"
SetVar $Z_Lib~heraldss TRUE
Gosub :Z_Lib~PROMPT
If ($Z_Lib~prompt <> "Command")
   Goto :FINISH
End
Gosub :Z_Lib~CN9CHECK
Gosub :CONFIG
Gosub :Z_Lib~COMMSOFF
Gosub :CORPY
Gosub :CHECKIGON
SetTextLineTrigger 0 :GOTKILLS "Kills="
Send "i"
Pause
:GOTKILLS
KillAllTriggers
GetWordPos CURRENTLINE $pos "Kills"
CutText CURRENTLINE $z_startkills ($pos + 6) 999
Gosub :GETSHIPDATA
Gosub :PROCESSPARMS
SetDelayTrigger 1 :WAITATIC "500"
Pause
:WAITATIC
KillAllTriggers
Gosub :CHECKMODE
If ($botted = TRUE)
   Goto :BOTSTART
End
Goto :STARTMENU
:STARTMENU
KillAllTriggers
SetVar $missing FALSE
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
Gosub :Z_Lib~HEADER
If ($z_mode = 1)
   Echo "*" & ANSI_10 &" Mode: "& ANSI_15 "Roaming"
ElseIf ($z_mode = 2)
   Echo "*" & ANSI_10 &" Mode: "& ANSI_15 "Stardock"
ElseIf ($z_mode = 3)
   Echo "*" & ANSI_10 &" Mode: "& ANSI_15 "Class 0"
ElseIf ($z_mode = 4)
   Echo "*" & ANSI_10 &" Mode: "& ANSI_15 "Base"
End
Echo ANSI_10 &"     Wave: "& ANSI_15 $z_wave
Echo ANSI_10 &"     Max Shields: "& ANSI_15 $z_shields & [4;62H & ANSI_12 & "KILLS"
Gosub :Z_Lib~REDLINE
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"M"& ANSI_12 &"]=- "& ANSI_11 &"Menu key    : "& ANSI_4 & "[" & ANSI_15 & $z_menukey & ANSI_4 &"]"   & [6;58H & ANSI_13 & "This Game: " & ANSI_14 & $z_gamekills
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"P"& ANSI_12 &"]=- "& ANSI_11 &"Pause Key   : "& ANSI_4 & "[" & ANSI_15 & $z_pausekey & ANSI_4 &"]"  & [7;57H & ANSI_4 & #196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196
Echo "*" & ANSI_4 &#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196 & [8;59H & ANSI_13 & "All Time: " & ANSI_14 & $z_totalkills
SetVar $z_warn ""
If ($z_safesector = 0)
   SetVar $z_warn (ANSI_12 & " <----- NOT SET!")
ElseIf ($z_safesector = STARDOCK)
   SetVar $z_warn (ANSI_10 & " <----- STARDOCK")
ElseIf ($z_safesector = RYLOS)
   SetVar $z_warn (ANSI_10 & " <----- RYLOS")
ElseIf ($z_safesector = ALPHACENTAURI)
   SetVar $z_warn (ANSI_10 & " <----- ALPHA CENTAURI")
ElseIf ($z_safesector = "1")
   SetVar $z_warn (ANSI_10 & " <----- SOL")
ElseIf ($z_safesector = $z_base)
   SetVar $z_warn (ANSI_10 & " <----- BASE")
End
If ($z_autovolley = "1")
	SetVar $z_autovolleyd ANSI_10 & "YES"
Else
	SetVar $z_autovolleyd ANSI_12 & "NO"
End
If ($z_macrotype = TRUE)
	SetVar $z_macrotyped ANSI_10 & "AUTOCREATE"
Else
	SetVar $z_macrotyped ANSI_11 & "SELECT"
End
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"S"& ANSI_12 &"]=- "& ANSI_11 &"Safe Sector : "& ANSI_15 $z_safesector & $z_warn
SetVar $z_warn ""
If ($z_safeship = 0)
   SetVar $z_warn (ANSI_12 & " <----- NOT SET!")
End
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"H"& ANSI_12 &"]=- "& ANSI_11 &"Safeship    : "& ANSI_15 $z_safeship & $z_warn
SetVar $z_warn ""
If ($z_base = 0)
   SetVar $z_warn (ANSI_12 & " <----- NOT SET!")
End
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"1"& ANSI_12 &"]=- "& ANSI_11 &"Base        : "& ANSI_15 $z_base & $z_warn
SetVar $z_warn ""
If ($z_planet = 0)
   SetVar $z_warn (ANSI_12 & " <----- NOT SET!")
End
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"2"& ANSI_12 &"]=- "& ANSI_11 &"Planet      : "& ANSI_15 $z_planet & $z_warn
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"3"& ANSI_12 &"]=- "& ANSI_11 &"<VAR1>      : "& ANSI_15 $z_var1
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"4"& ANSI_12 &"]=- "& ANSI_11 &"<VAR2>      : "& ANSI_15 $z_var2
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"5"& ANSI_12 &"]=- "& ANSI_11 &"<VAR3>      : "& ANSI_15 $z_var3
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"6"& ANSI_12 &"]=- "& ANSI_11 &"<VAR4>      : "& ANSI_15 $z_var4
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"7"& ANSI_12 &"]=- "& ANSI_11 &"<VAR5>      : "& ANSI_15 $z_var5
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"8"& ANSI_12 &"]=- "& ANSI_11 &"<VAR6>      : "& ANSI_15 $z_var6
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"9"& ANSI_12 &"]=- "& ANSI_11 &"Volleys     : "& ANSI_15 $z_volley
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"0"& ANSI_12 &"]=- "& ANSI_11 &"Roam Volleys: "& ANSI_15 $z_rvolley
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"L"& ANSI_12 &"]=- "& ANSI_11 &"AutoSetVolls: "& ANSI_15 $z_autovolleyd
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"T"& ANSI_12 &"]=- "& ANSI_11 &"Macro Type  : "& ANSI_15 $z_macrotyped
If ($z_macrotype = FALSE)
	Gosub :Z_Lib~DOUBLEREDLINE
	Echo "*" & ANSI_12 &"-=["& ANSI_14 &"A"& ANSI_12 &"]=- "& ANSI_11 &"Attack Macro: "& ANSI_15 $z_attackmacro
	Gosub :Z_Lib~DOUBLEREDLINE
	If ($z_attack1 = "")
	   Echo "*" & ANSI_12 &"-=["& ANSI_14 &"V"& ANSI_12 &"]=- "& ANSI_11 &"Use Macro 1 : "& ANSI_4 "Not available"
	Else
	   Echo "*" & ANSI_12 &"-=["& ANSI_14 &"V"& ANSI_12 &"]=- "& ANSI_11 &"Use Macro 1 : "& ANSI_6 $z_attack1
	End
	Gosub :Z_Lib~REDLINE
	If ($z_attack2 = "")
	   Echo "*" & ANSI_12 &"-=["& ANSI_14 &"W"& ANSI_12 &"]=- "& ANSI_11 &"Use Macro 2 : "& ANSI_4 "Not available"
	Else
	   Echo "*" & ANSI_12 &"-=["& ANSI_14 &"W"& ANSI_12 &"]=- "& ANSI_11 &"Use Macro 2 : "& ANSI_6 $z_attack2
	End
	Gosub :Z_Lib~REDLINE
	If ($z_attack3 = "")
	   Echo "*" & ANSI_12 &"-=["& ANSI_14 &"X"& ANSI_12 &"]=- "& ANSI_11 &"Use Macro 3 : "& ANSI_4 "Not available"
	Else
	   Echo "*" & ANSI_12 &"-=["& ANSI_14 &"X"& ANSI_12 &"]=- "& ANSI_11 &"Use Macro 3 : "& ANSI_6 $z_attack3
	End
	Gosub :Z_Lib~REDLINE
	If ($z_attack4 = "")
	   Echo "*" & ANSI_12 &"-=["& ANSI_14 &"Y"& ANSI_12 &"]=- "& ANSI_11 &"Use Macro 4 : "& ANSI_4 "Not available"
	Else
	   Echo "*" & ANSI_12 &"-=["& ANSI_14 &"Y"& ANSI_12 &"]=- "& ANSI_11 &"Use Macro 4 : "& ANSI_6 $z_attack4
	End
	Gosub :Z_Lib~REDLINE
	If ($z_attack5 = "")
	   Echo "*" & ANSI_12 &"-=["& ANSI_14 &"Z"& ANSI_12 &"]=- "& ANSI_11 &"Use Macro 5 : "& ANSI_4 "Not available"
	Else
	   Echo "*" & ANSI_12 &"-=["& ANSI_14 &"Z"& ANSI_12 &"]=- "& ANSI_11 &"Use Macro 5 : "& ANSI_6 $z_attack5
	End
End
Gosub :Z_Lib~DOUBLEREDLINE
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"G"& ANSI_12 &"]=- "& ANSI_11 &"GO !"
Echo "             " & ANSI_12 &"-=["& ANSI_14 &"C"& ANSI_12 &"]=- "& ANSI_11 & "Reset Corpies" & ANSI_12 " (" & ANSI_11 & $corpycount & ANSI_12 & ")"
Echo "             " & ANSI_12 &"-=["& ANSI_14 &"Q"& ANSI_12 &"]=- "& ANSI_11 &"Quit"
Gosub :Z_Lib~DOUBLEREDLINE
Echo "*" & ANSI_10 "Your selection:"
GetConsoleInput $choice SINGLEKEY
UpperCase $choice
If ($choice = "S")
   Echo "**" & ANSI_10 " Enter the SAFE SECTOR number:"
   GetConsoleInput $z_input
   Isnumber $isnum $z_input
   If ($isnum = TRUE)
      If ($z_input >= 0) and ($z_input <= SECTORS)
         SetVar $z_safesector $z_input
         SaveVar $z_safesector
      End
   End
ElseIf ($choice = "H")
   Echo "**" & ANSI_10 " Enter the SAFESHIP number:"
   GetConsoleInput $z_input
   Isnumber $isnum $z_input
   If ($isnum = TRUE)
      SetVar $z_safeship $z_input
      SaveVar $z_safeship
   End
ElseIf ($choice = "1")
   Echo "**" & ANSI_10 " Enter the BASE Sector number:"
   GetConsoleInput $z_input
   Isnumber $isnum $z_input
   If ($isnum = TRUE)
      If ($z_input = 0) or (($z_input > 10) and ($z_input <= SECTORS))
         SetVar $z_base $z_input
         SaveVar $z_base
         Gosub :CHECKMODE
      End
   End
ElseIf ($choice = "2")
   Echo "**" & ANSI_10 " Enter the PLANET number:"
   GetConsoleInput $z_input
   Isnumber $isnum $z_input
   If ($isnum = TRUE)
      SetVar $z_planet $z_input
      SaveVar $z_planet
      Gosub :CHECKMODE
   End
ElseIf ($choice = "3")
   Echo "**" & ANSI_10 " Enter the value for <VAR1>:"
   GetConsoleInput $z_input
   SetVar $z_var1 $z_input
   SaveVar $z_var1
ElseIf ($choice = "4")
   Echo "**" & ANSI_10 " Enter the value for <VAR2>:"
   GetConsoleInput $z_input
   Isnumber $isnum $z_input
   SetVar $z_var2 $z_input
   SaveVar $z_var2
ElseIf ($choice = "5")
   Echo "**" & ANSI_10 " Enter the value for <VAR3>:"
   GetConsoleInput $z_input
   Isnumber $isnum $z_input
   SetVar $z_var3 $z_input
   SaveVar $z_var3
ElseIf ($choice = "6")
   Echo "**" & ANSI_10 " Enter the value for <VAR4>:"
   GetConsoleInput $z_input
   Isnumber $isnum $z_input
   SetVar $z_var4 $z_input
   SaveVar $z_var4
ElseIf ($choice = "7")
   Echo "**" & ANSI_10 " Enter the value for <VAR5>:"
   GetConsoleInput $z_input
   Isnumber $isnum $z_input
   SetVar $z_var5 $z_input
   SaveVar $z_var5
ElseIf ($choice = "8")
   Echo "**" & ANSI_10 " Enter the value for <VAR6>:"
   GetConsoleInput $z_input
   Isnumber $isnum $z_input
   SetVar $z_var6 $z_input
   SaveVar $z_var6
ElseIf ($choice = "9")
   Echo "**" & ANSI_10 " Enter the number of volleys per attack:"
   GetConsoleInput $z_input
   Isnumber $isnum $z_input
   If ($isnum = TRUE)
      SetVar $z_volley $z_input
	  SaveVar $z_volley
   End
ElseIf ($choice = "0")
   Echo "**" & ANSI_10 " Enter the number of volleys per attack (Roam):"
   GetConsoleInput $z_input
   Isnumber $isnum $z_input
   If ($isnum = TRUE)
      SetVar $z_rvolley $z_input
	  SaveVar $z_rvolley
   End
ElseIf   ($choice = "L")
	If ($z_autovolley = TRUE)
		SetVar $z_autovolley "2"
		SaveVar $z_autovolley
	Else
		SetVar $z_autovolley "1"
		SaveVar $z_autovolley
	End
ElseIf ($choice = "M")
   Echo "**" & ANSI_10 " Press the new MENU KEY:"
   GetConsoleInput $z_input SINGLEKEY
      If ($z_input <> #13)
      SetVar $z_menukey $z_input
	  SaveVar $z_menukey
   End
ElseIf ($choice = "P")
   Echo "**" & ANSI_10 " Press the new PAUSE KEY:"
   GetConsoleInput $z_input SINGLEKEY
      If ($z_input <> #13)
      SetVar $z_pausekey $z_input
	  SaveVar $z_pausekey
   End
ElseIf ($choice = "A") and ($z_macrotype = FALSE)
   Echo "**" & ANSI_10 " Enter the new ATTACK MACRO:**"
   GetConsoleInput $z_input
   If ($z_input <> "")
      Echo "**" & ANSI_15 & $z_input
      Echo "**" & ANSI_12 &" Replace the attack macro? (y/n)"
      GetConsoleInput $z_yesno SINGLEKEY
      UpperCase $z_yesno
      If ($z_yesno = "Y")
         SetVar $z_attackmacro $z_input
      End
   End
ElseIf ($choice = "V") and ($z_macrotype = FALSE)
      Echo "**" & ANSI_12 &" Replace the attack macro with " & ANSI_15 & "Macro 1 " & ANSI_12 & "? (y/n)"
      GetConsoleInput $z_yesno SINGLEKEY
      UpperCase $z_yesno
      If ($z_yesno = "Y") And ($z_attack1 <> "")
         SetVar $z_attackmacro $z_attack1
         SetVar $z_attacknum "1"
         SaveVar $z_attacknum
      End
ElseIf ($choice = "W") and ($z_macrotype = FALSE)
      Echo "**" & ANSI_12 &" Replace the attack macro with " & ANSI_15 & "Macro 2 " & ANSI_12 & "? (y/n)"
      GetConsoleInput $z_yesno SINGLEKEY
      UpperCase $z_yesno
      If ($z_yesno = "Y") And ($z_attack2 <> "")
         SetVar $z_attackmacro $z_attack2
         SetVar $z_attacknum "2"
         SaveVar $z_attacknum
      End
ElseIf ($choice = "X") and ($z_macrotype = FALSE)
      Echo "**" & ANSI_12 &" Replace the attack macro with " & ANSI_15 & "Macro 3 " & ANSI_12 & "? (y/n)"
      GetConsoleInput $z_yesno SINGLEKEY
      UpperCase $z_yesno
      If ($z_yesno = "Y") And ($z_attack3 <> "")
         SetVar $z_attackmacro $z_attack3
         SetVar $z_attacknum "3"
         SaveVar $z_attacknum
      End
ElseIf ($choice = "Y") and ($z_macrotype = FALSE)
      Echo "**" & ANSI_12 &" Replace the attack macro with " & ANSI_15 & "Macro 4 " & ANSI_12 & "? (y/n)"
      GetConsoleInput $z_yesno SINGLEKEY
      UpperCase $z_yesno
      If ($z_yesno = "Y") And ($z_attack4 <> "")
         SetVar $z_attackmacro $z_attack4
         SetVar $z_attacknum "4"
         SaveVar $z_attacknum
      End
ElseIf ($choice = "Z") and ($z_macrotype = FALSE)
      Echo "**" & ANSI_12 &" Replace the attack macro with " & ANSI_15 & "Macro 5 " & ANSI_12 & "? (y/n)"
      GetConsoleInput $z_yesno SINGLEKEY
      UpperCase $z_yesno
      If ($z_yesno = "Y") And ($z_attack5 <> "")
         SetVar $z_attackmacro $z_attack5
         SetVar $z_attacknum "5"
         SaveVar $z_attacknum
      End
ElseIf ($choice = "T")
	If ($z_macrotype = TRUE)
		SetVar $z_macrotype FALSE
	Else
		SetVar $z_macrotype TRUE
	End
	SaveVar $z_macrotype 
ElseIf ($choice = "G")
   SetVar $macro $z_attackmacro
   Gosub :PROCESSVARS
   Gosub :Z_Lib~COMMSON   
   Send "'Zed's Rapid Response Powering Up In Sector " & CURRENTSECTOR & " !*"
   Waiton "Message sent on sub-space"
   Echo "**" & ANSI_12 &" !!! Zed's Rapid Response Ready To ATTACK !!!"
   SetVar $botted TRUE
   Goto :START
ElseIf ($choice = "C")
   Gosub :CORPY
   Gosub :Z_Lib~ANYKEY
   Goto :STARTMENU
ElseIf ($choice = "Q")
   Goto :FINISH
Else
   Goto :STARTMENU
End
Goto :STARTMENU
:BOTSTART
SetVar $macro $z_attackmacro
Gosub :PROCESSVARS
Gosub :Z_Lib~COMMSON
Send "'Zed's Rapid Response Powering Up In Sector " & CURRENTSECTOR & " !*"
WaitOn "Message sent on sub-space channel"
Echo "**" & ANSI_12 &" !!! Zed's Rapid Response Ready To ATTACK !!!"
:START
KillAllTriggers
Gosub :CHECKMODE
:NOCHECK
KillAllTriggers
SetVar $trigger11 " lifts off from "
SetVar $trigger12 " blasts off from "
SetVar $trigger13 "warps into the sector"
SetVar $trigger14 "appears in a brilliant flash"
SetVar $trigger15 "Traders :"
SetVar $trigger16 "] (?=Help)? :"
SetVar $trigger17 "is powering up weapons systems!"
SetVar $trigger18 "Long Range Scan"
SetVar $trigger19 "Security code accepted, engaging transporter control."
SetVar $trigger20a ($z_botname & "rroff")
SetVar $trigger20b ($z_botname & "rrpause")
SetVar $trigger20d ($z_botname & "rrstatus")
SetVar $trigger20e ($z_botname & "rrhelp")
SetTextTrigger trigger11 :ATTACK $trigger11
SetTextTrigger trigger12 :ATTACK $trigger12
SetTextTrigger trigger13 :ATTACK $trigger13
SetTextTrigger trigger14 :ATTACK $trigger14
SetTextTrigger trigger15 :ATTACK $trigger15
SetTextTrigger trigger16 :WEMOVED $trigger16
SetTextTrigger trigger17 :ATTACK $trigger17
SetTextTrigger trigger18 :SCANNING $trigger18
SetTextTrigger trigger19 :CHANGEDSHIP $trigger19
SetTextTrigger trigger20a :BOTFINISH $trigger20a
SetTextTrigger trigger20b :BOTPAUSED $trigger20b
SetTextTrigger trigger20d :BOTKILLS $trigger20d
SetTextTrigger trigger20e :BOTHELP $trigger20e
SetTextOutTrigger trigger21 :MENUKEY $z_menukey
SetTextOutTrigger trigger22 :PAUSED $z_pausekey
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
Pause
:BOTKILLS
KillAllTriggers
GetWord CURRENTLINE $isbot 1
If ($isbot = "R")
   Gosub :REPORT
End
Goto :START
:BOTHELP
KillAllTriggers
GetWord CURRENTLINE $isbot 1
If ($isbot = "R")
   Gosub :HELP
End
Goto :START
:BOTPAUSED
KillAllTriggers
GetWord CURRENTLINE $isbot 1
If ($isbot = "R")
   Send "'!!! Zed's Rapid Response PAUSED !!!*"
   Goto :BOTPAUSED2
End
Goto :START
:BOTPAUSED2
KillAllTriggers
SetVar $trigger20a ($z_botname & "rroff")
SetVar $trigger20c ($z_botname & "rrunpause")
SetVar $trigger20d ($z_botname & "rrstatus")
SetVar $trigger20e ($z_botname & "rrhelp")
SetTextTrigger trigger16 :WEMOVED3 $trigger16
SetTextTrigger trigger20a :BOTFINISH $trigger20a
SetTextTrigger trigger20c :BOTUNPAUSED $trigger20c
SetTextTrigger trigger20d :BOTKILLS2 $trigger20d
SetTextTrigger trigger20e :BOTHELP2 $trigger20e
SetTextOutTrigger trigger21 :MENUKEY $z_menukey
SetTextOutTrigger trigger22 :UNPAUSED $z_pausekey
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
GetTimer $endtime
SetVar $timelapsed ($endtime - $starttime)
If ($timelapsed > 3000000000)
	Echo ANSI_12 & "[" & ANSI_13 & "PAUSED" & ANSI_12 & "] " & ANSI_5
	GetTimer $starttime
End
Pause
:BOTUNPAUSED
KillAllTriggers
Send "'!!! Zed's Rapid Response UNPAUSED !!!*"
Goto :START
:BOTFINISH
KillAllTriggers
GetWord CURRENTLINE $isbot 1
If ($isbot = "R")
   Send "'!!! Zed's Rapid Response POWERING DOWN !!!*"
   Goto :FINISH
End
Goto :START
:BOTKILLS2
KillAllTriggers
GetWord CURRENTLINE $isbot 1
If ($isbot = "R")
   Gosub :REPORT
End
Goto :BOTPAUSED2
:BOTHELP2
KillAllTriggers
GetWord CURRENTLINE $isbot 1
If ($isbot = "R")
   Gosub :HELP
End
Goto :BOTPAUSED2
:WEMOVED3
KillAllTriggers
If ($z_currentsector <> CURRENTSECTOR)
   SetVar $z_currentsector CURRENTSECTOR
End
Goto :BOTPAUSED2
:CHANGEDSHIP
KillAllTriggers
Send "* "
Gosub :GETSHIPDATA
Gosub :CHECKIGON
Goto :START
:SCANNING
KillAllTriggers
SetTextTrigger trigger16 :SCANNED $trigger16
Pause
:SCANNED
KillAllTriggers
Goto :START
:WEMOVED
KillAllTriggers
Gosub :CHECKMODE
Goto :NOCHECK
:PAUSED
KillAllTriggers
SetVar $missing FALSE
SetVar $trigger20a ($z_botname & "rroff")
SetVar $trigger20c ($z_botname & "rrunpause")
SetVar $trigger20d ($z_botname & "rrstatus")
SetVar $trigger20e ($z_botname & "rrhelp")
SetTextTrigger trigger16 :WEMOVED2 $trigger16
SetTextTrigger trigger20a :BOTFINISH $trigger20a
SetTextTrigger trigger20c :BOTUNPAUSED $trigger20c
SetTextTrigger trigger20d :BOTKILLS2 $trigger20d
SetTextTrigger trigger20e :BOTHELP2 $trigger20e
SetTextOutTrigger trigger21 :MENUKEY $z_menukey
SetTextOutTrigger trigger22 :UNPAUSED $z_pausekey
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
GetTimer $endtime
SetVar $timelapsed ($endtime - $starttime)
If ($timelapsed > 3000000000)
	Echo ANSI_12 & "[" & ANSI_13 & "PAUSED" & ANSI_12 & "] " & ANSI_5
	GetTimer $starttime
End
Pause
:UNPAUSED
KillAllTriggers
Goto :START
:WEMOVED2
KillAllTriggers
If ($z_currentsector <> CURRENTSECTOR)
   SetVar $z_currentsector CURRENTSECTOR
End
Goto :PAUSED
:MENUKEY
KillAllTriggers
Gosub :Z_Lib~COMMSOFF
Goto :STARTMENU
:ATTACK
KillAllTriggers
GetWord CURRENTLINE $spf 1
If ($spf = "R") or ($spf = "F") or ($spf = "P")
   Goto :NOCHECK
End
Gosub :CHECKTARGET
If ($targetok = FALSE)
   Goto :NOCHECK
End
PROCESSIN 1 $z_code & "[Z]STANDDOWN[Z]" & $z_code
OpenMenu TWX_STOPALLFAST FALSE
SetVar $macro2 ""
If ($z_macrotype = TRUE)
	SetVar $ships SECTOR.SHIPCOUNT[CURRENTSECTOR]
	SetVar $macro "a t y n q z " & $z_wave & "* a t n "
	SetVar $count 1
	While ($count < $ships)
		SetVar $macro ($macro & "n ")
		SetVar $count ($count + 1)
	End
	SetVar $macro2 ($macro & "n y q z " & $z_wave & "* ")
	SetVar $macro ($macro & "y q z " & $z_wave & "* ")
End
If ($z_mode = "1")
	SetVar $usevolley $z_rvolley
Else
	SetVar $usevolley $z_volley
End
SetVar $count 1
While ($count <= $usevolley)
   Send $macro & $macro2
   SetVar $count ($count + 1)
End
If ($z_currentsector <> CURRENTSECTOR)
   Gosub :CHECKMODE
End
If ($z_mode = 1)
   If ($z_safesector < 1) or ($z_safesector > SECTORS)
      SetVar $z_safe "1"
   Else
      SetVar $z_safe $z_safesector
   End
   SetVar $heretrigger "["& $z_safe &"] (?="
   SetTextTrigger trigger61 :USINGTWARP "Do you want to engage the TransWarp"
   SetTextTrigger trigger62 :EWARP "The shortest path"
   SetTextTrigger trigger63 :WEREHERE "Warping to sector"
   SetTextTrigger trigger64 :XPORT "An Interdictor Generator in this sector holds you fast"
   SetTextTrigger trigger65 :WEREHERE $heretrigger
   SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
   SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
   Send "m " & $z_safe & "*"
   Pause
:XPORT
   KillAllTriggers
   If ($z_safeship <> "0")
      SetTextTrigger trigger19 :CHANGEDSHIP2 $trigger19
      SetDelayTrigger xpwait :STANDDOWN 10000
      Send "q q * * x * x z" & $z_safeship & "* */"
      Pause
:CHANGEDSHIP2
      KillAllTriggers
      Send "* "
      Gosub :GETSHIPDATA
      Gosub :CHECKIGON
      Waitfor "Interdictor"
      WaitFor "Command [TL="
   Else
	  Gosub :Z_SaveMe~CALL
   End
   Goto :STANDDOWN
:USINGTWARP
   KillAllTriggers
   SetTextTrigger trigger61 :NOFUEL "not have enough Fuel Ore"
   SetTextTrigger trigger62 :NOBEAM "No locating beam found"
   SetTextTrigger trigger63 :TWARPOK "Locating beam pinpointed"
   SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
   SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
   Send "y"
   Pause
:TWARPOK
   KillAllTriggers
   SetTextTrigger trigger63 :WEREHERE "TransWarp Drive Engaged!"
   SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
   SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
   Send "y"
   Pause
:NOBEAM
   KillAllTriggers
   Send "n"
   Goto :NOFUEL
:NOFUEL
   KillAllTriggers
   Send "m " & $z_safe & "*n"
   Goto :EWARP
:EWARP
KillAllTriggers
setvar $heretrigger "["& $z_safe &"] (?="
SetVar $mowmode "1"
:STARTMOW
SetTextTrigger mow1 :MOWNO "Stop in this sector"
SetTextTrigger mow2 :MOW "Option? (A,D,I,R,?)"
SetTextTrigger mow3 :WEREHERE $heretrigger
SetTextTrigger mow4 :MOWNO  "Do you wish to Avoid this sector"
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
If ($mowmode = "1")
   Send "e  "
Elseif ($mowmode = "2")
   Send "n  "
Elseif ($mowmode = "3")
   Send "a200*  "
End
pause
:MOWNO
KillAllTriggers
SetVar $mowmode "2"
goto :STARTMOW
:MOW
KillAllTriggers
SetVar $mowmode "3"
Goto :STARTMOW
:WEREHERE
KillAllTriggers
If ($z_safe = 1) or ($z_safe = RYLOS) or ($z_safe = ALPHACENTAURI)
   Goto :CLASS0
ElseIf ($z_safe = STARDOCK)
   Goto :DOCK
ElseIf ($z_safe = $z_base)
   Goto :BASE
Else
   Goto :STANDDOWN
End
ElseIf ($z_mode = 2)
:DOCK
   SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
   SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
   SetTextLineTrigger trigger31 :BUYFIGS "B  Fighters"
   Send "p sg yg qs p"
   Pause
:BUYFIGS
KillAllTriggers
GetWord CURRENTLINE $z_figstobuy 8
StripText $z_figstobuy ","
If ($z_figstobuy <= 20)
	If ($missing <> TRUE)
		SetVar $missing TRUE
	Else	
		Goto :STANDDOWN2
	End
Else
	SetVar $missing FALSE
End
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
SetTextLineTrigger trigger32 :BUYSHLDS "C  Shield Points"
Send "b"& $z_figstobuy &"*"
Pause
:BUYSHLDS
KillAllTriggers
GetWord CURRENTLINE $z_shldstobuy 9
StripText $z_shldstobuy ","
SetTextTrigger trigger41 :ATTACK "Traders :"
SetDelayTrigger trigger42 :STANDDOWN "1500"
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
Send "c"& $z_shldstobuy &"*qqq*"
Pause
ElseIf ($z_mode = 3)
:CLASS0
   KillAllTriggers
   SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
   SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
   SetTextLineTrigger trigger31 :BUYFIGS3 "B  Fighters"
   Send "p  * y *"
   Pause
:BUYFIGS3
KillAllTriggers
GetWord CURRENTLINE $z_figstobuy 8
StripText $z_figstobuy ","
If ($z_figstobuy <= 20)
	If ($missing <> TRUE)
		SetVar $missing TRUE
	Else	
		If (CURRENTSECTOR = 1)
			Send "q l "
		End
		Goto :STANDDOWN2
	End
Else
	SetVar $missing FALSE
End
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
SetTextLineTrigger trigger32 :BUYSHLDS3 "C  Shield Points"
Send "b"& $z_figstobuy &"*"
Pause
:BUYSHLDS3
KillAllTriggers
GetWord CURRENTLINE $z_shldstobuy 9
StripText $z_shldstobuy ","
SetTextTrigger trigger41 :ATTACK "Traders :"
SetDelayTrigger trigger42 :STANDDOWN "1500"
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
Send "c"& $z_shldstobuy &"*q*"
Pause
ElseIf ($z_mode = 4)
:BASE
   KillAllTriggers
   SetVar $z_getshields ($z_shields / 10)
   Send "l j" & #8 & #8 & $z_planet & "* n n m * * * * c g f" & $z_getshields &"*/"
   SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
   SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
   SetTextTrigger trigger51 :ATTACK "Traders :"
   SetDelayTrigger trigger52 :STANDDOWN "1500"
   Send "qq*"
   Pause
End
Goto :FINISH
:STANDDOWN
Echo "**" & ANSI_10 " !!! Zed's Rapid Response STANDING DOWN !!!*"
Gosub :SAVEALLKILLS
Send "/#"
PROCESSIN 1 $z_code & "[Z]ATTENTION[Z]" & $z_code
Goto :START
:STANDDOWN2
Echo "**" & ANSI_10 " !!! Zed's Rapid Response STANDING DOWN !!!*"
SetVar $missing FALSE
Send "/#"
PROCESSIN 1 $z_code & "[Z]ATTENTION[Z]" & $z_code
Goto :START
:CHECKMODE
SetVar $line CURRENTLINE
GetWord $line $word1 1
If ($word1 <> "Command")
	Goto :ENDCHECK
End
GetText $line $current_sector "]:[" "] ("
IsNumber $isnum $current_sector
GetTimer $endtime
If ($isnum = TRUE)
	SetVar $timelapsed ($endtime - $starttime)
	If ($timelapsed > 3000000000)
		SetVar $lastsect "-1"
	End
	If ($lastsect <> $current_sector)
		If (CURRENTSECTOR = "1") or (CURRENTSECTOR = ALPHACENTAURI) or (CURRENTSECTOR = RYLOS)
		   SetVar $z_mode 3
		   Echo ANSI_12 & "[" & ANSI_10 & "CLASS 0" & ANSI_12 & "] " & ANSI_5
		   GetTimer $starttime
		ElseIf (CURRENTSECTOR = STARDOCK)
		   SetVar $z_mode 2
		   Echo ANSI_12 & "[" & ANSI_11 & "STARDOCK" & ANSI_12 & "] " & ANSI_5
		   GetTimer $starttime
		ElseIf (CURRENTSECTOR = $z_base) and ($z_planet <> 0)
		   SetVar $z_mode 4
		   Echo ANSI_12 & "[" & ANSI_2 & "BASE" & ANSI_12 & "] " & ANSI_5
		   GetTimer $starttime
		Else
		   SetVar $z_mode 1
		   Echo ANSI_12 & "[" & ANSI_6 & "ROAMING" & ANSI_12 & "] " & ANSI_5
		   GetTimer $starttime
		End
		SetVar $z_currentsector CURRENTSECTOR
		SetVar $lastsect $current_sector
	End
End
:ENDCHECK
Return
:CONNECTIONLOST
Halt
:FINISH
Gosub :SAVEALLKILLS
Gosub :CLEARPARMS
Echo "**" & ANSI_15 " !!! Zed's Rapid Response POWERING DOWN !!!*"
Gosub :Z_Lib~COMMSON
Sound ding
Halt
:CHECKTARGET
SetVar $targetok TRUE
SetVar $linecheck CURRENTLINE
UpperCase $linecheck
GetWord $linecheck $word1 1
If ($word1 = "TRADERS")
   SetVar $count "1"
   While ($count <= $corpycount)
      GetWordPos $linecheck $pos $corpy[$count]
      If ($pos <> "0")
         SetVar $targetok FALSE
      End
      SetVar $count ($count + 1)
   End
   If ($targetok = FALSE)
      Goto :TARGETCHKDONE
   End
End
GetWordPos $linecheck $pos "LIFTS"
If ($pos > 2)
   SetVar $pos ($pos - 2)
   CutText $linecheck $target 1 $pos
   Goto :GOTTARGET
End
GetWordPos $linecheck $pos "BLASTS"
If ($pos > 2)
   SetVar $pos ($pos - 2)
   CutText $linecheck $target 1 $pos
   Goto :GOTTARGET
End
GetWordPos $linecheck $pos "WARPS"
If ($pos > 2)
   SetVar $pos ($pos - 2)
   CutText $linecheck $target 1 $pos
   Goto :GOTTARGET
End
GetWordPos $linecheck $pos "APPEARS"
If ($pos > 2)
   SetVar $pos ($pos - 2)
   CutText $linecheck $target 1 $pos
   Goto :GOTTARGET
End
GetWordPos $linecheck $pos "POWERING"
If ($pos > 5)
   SetVar $pos ($pos - 5)
   CutText $linecheck $target 1 $pos
   Goto :GOTTARGET
End
:GOTTARGET
SetVar $count "1"
While ($count <= $corpycount)
   If ($target = $corpy[$count])
      SetVar $targetok FALSE
   End
   SetVar $count ($count + 1)
End
:TARGETCHKDONE
SetVar $target ""
Return
:CORPY
SetVar $corpycount "0"
Send "taq"
WaitOn "--------------------------"
:PARSECORPIES
SetTextLineTrigger corpies :CORPIES ""
Pause
:CORPIES
GetWord CURRENTLINE $corpy_prompt 1
If ($corpy_prompt = "Corporate") or ($corpy_prompt = "0") or ($corpy_prompt = "P")
   Goto :DONEWITHCORPIES
End
SetVar $corpycount ($corpycount + 1)
CutText CURRENTLINE $corpy[$corpycount] 1 39
SetVar $pos 38
:STRIPCORPIES
CutText $corpy[$corpycount] $blank $pos 1
If ($blank = " ")
  CutText $corpy[$corpycount] $corpy[$corpycount] 1 $pos
  SetVar $pos ($pos - 1)
  Goto :STRIPCORPIES
Else
  CutText $corpy[$corpycount] $corpy[$corpycount] 1 $pos
  UpperCase $corpy[$corpycount]
  Goto :PARSECORPIES
End
:DONEWITHCORPIES
Echo "***" & ANSI_14 & " Corpies"
Echo "*" & ANSI_12 & "---------"
SetVar $count 1
While ($count <= $corpycount)
   Echo "* " & ANSI_15 & $corpy[$count]
   SetVar $count ($count + 1)
End
Echo "**"
Return
:CONFIG
Fileexists $fileexists "zrr.cfg"
If ($fileexists = TRUE)
   ReadToArray "zrr.cfg" $config
   SetVar $count 1
   While ($count <= $config)
      SetVar $conf1 ""
      GetWord $config[$count] $conf1 1
      If ($conf1 = "ATTACK1:")
         GetText $config[$count] $z_attack1 "!MACROSTART!" "!MACROEND!"
      ElseIf ($conf1 = "ATTACK2:")
         GetText $config[$count] $z_attack2 "!MACROSTART!" "!MACROEND!"
      ElseIf ($conf1 = "ATTACK3:")
         GetText $config[$count] $z_attack3 "!MACROSTART!" "!MACROEND!"
      ElseIf ($conf1 = "ATTACK4:")
         GetText $config[$count] $z_attack4 "!MACROSTART!" "!MACROEND!"
      ElseIf ($conf1 = "ATTACK5:")
         GetText $config[$count] $z_attack5 "!MACROSTART!" "!MACROEND!"
      End
      SetVar $count ($count + 1)
   End
Else
   SetVar $z_attack1 "q q " & #42 & " a y n a n y q z <WAVE>^M"
   Write "zrr.cfg" "ATTACK1: !MACROSTART!" & $z_attack1 & "!MACROEND!"
   SetVar $z_attack2 " Your Spare Macro Here "
   Write "zrr.cfg" "ATTACK2: !MACROSTART!" & $z_attack2 & "!MACROEND!"
   SetVar $z_attack3 " Your Spare Macro Here "
   Write "zrr.cfg" "ATTACK3: !MACROSTART!" & $z_attack3 & "!MACROEND!"
   SetVar $z_attack4 " Your Spare Macro Here "
   Write "zrr.cfg" "ATTACK4: !MACROSTART!" & $z_attack4 & "!MACROEND!"
   SetVar $z_attack5 " Your Spare Macro Here "
   Write "zrr.cfg" "ATTACK5: !MACROSTART!" & $z_attack5 & "!MACROEND!"
End
If ($z_attacknum = "5")
   SetVar $z_attackmacro $z_attack5
ElseIf ($z_attacknum = "4")
   SetVar $z_attackmacro $z_attack4
ElseIf ($z_attacknum = "3")
   SetVar $z_attackmacro $z_attack3
ElseIf ($z_attacknum = "2")
   SetVar $z_attackmacro $z_attack2
Else
   SetVar $z_attackmacro $z_attack1
End
Return
:PROCESSVARS
      ReplaceText $macro #42 "*"
      ReplaceText $macro "^M" "*"
      ReplaceText $macro "^m" "*"
      ReplaceText $macro "^(08)" #8
      ReplaceText $macro "<STARDOCK>" STARDOCK
      ReplaceText $macro "<RYLOS>" RYLOS
      ReplaceText $macro "<ALPHA>" ALPHACENTAURI
      ReplaceText $macro "<SAFESECTOR>" $safesector
      ReplaceText $macro "<BASE>" $z_base
      ReplaceText $macro "<PLANET>" $z_planet
      ReplaceText $macro "<SAFESHIP>" $z_safeship
      ReplaceText $macro "<SHIELDS>" $z_shields
      ReplaceText $macro "<WAVE>" $z_wave
      ReplaceText $macro "<VAR1>" $z_var1
      ReplaceText $macro "<VAR2>" $z_var2
      ReplaceText $macro "<VAR3>" $z_var3
      ReplaceText $macro "<VAR4>" $z_var4
      ReplaceText $macro "<VAR5>" $z_var5
      ReplaceText $macro "<VAR6>" $z_var6
Return
:SAVEKILLS
  Fileexists $fileexists "zrrkills.cfg"
  If ($fileexists = TRUE)
     Delete "zrrkills.cfg"
  End
  Write "zrrkills.cfg" $z_totalkills
Return
:LOADKILLS
  Fileexists $fileexists "zrrkills.cfg"
  If ($fileexists = TRUE)
     Read "zrrkills.cfg" $z_totalkills 1
  End
Return
:SAVEALLKILLS
KillAllTriggers
SetTextLineTrigger K0 :GOTKILLS2 "Kills="
Send "q q q * i"
Pause
:GOTKILLS2
KillAllTriggers
GetWordPos CURRENTLINE $pos "Kills"
CutText CURRENTLINE $z_kills ($pos + 6) 999
SetVar $z_totalkills ($z_totalkills + ($z_kills - $z_startkills))
Gosub :SAVEKILLS
SetVar $z_gamekills ($z_gamekills + ($z_kills - $z_startkills))
SaveVar $z_gamekills
SetVar $z_startkills $z_kills
Return
:GETSHIPDATA
KillAllTriggers
SetTextLineTrigger 1 :GOTSHIELDS "Maximum Shields:"
Send "c;"
Pause
:GOTSHIELDS
KillAllTriggers
GetWordPos CURRENTLINE $pos "Maximum Shields:"
SetVar $pos ($pos + 16)
CutText CURRENTLINE $z_shields $pos 999
StripText $z_shields ","
StripText $z_shields " "
SetTextLineTrigger 1 :GOTFIGHTERS "Max Fighters:"
Pause
:GOTFIGHTERS
KillAllTriggers
SetVar $thisline CURRENTLINE
ReplaceText $thisline ":" " "
GetWord $thisline $z_maxfighters 7
StripText $z_maxfighters ","
SetTextLineTrigger 1 :GOTWAVE "Max Figs Per Attack:"
Pause
:GOTWAVE
KillAllTriggers
GetWord CURRENTLINE $z_wave 5
StripText $z_wave ","
If ($z_autovolley = "1")
	SetVar $z_volley ($z_maxfighters / $z_wave)
	SetVar $z_rvolley ($z_maxfighters / $z_wave)
End
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
# LOAD PARMS & CLEARPARMS (for Bots)
:CLEARPARMS
SetVar $PARM1 "0"
SetVar $PARM2 "0"
SetVar $PARM3 "0"
SetVar $PARM4 "0"
SetVar $PARM5 "0"
SetVar $PARM6 "0"
SetVar $PARM7 "0"
SetVar $PARM8 "0"
SetVar $USER_COMMAND_LINE "0 0 0 0 0 0 0 0"
SetVar $COMMAND "0"
SaveVar $PARM1
SaveVar $PARM2
SaveVar $PARM3
SaveVar $PARM4
SaveVar $PARM5
SaveVar $PARM6
SaveVar $PARM7
SaveVar $PARM8
SaveVar $USER_COMMAND_LINE
SaveVar $COMMAND
Return
:LOADPARMS
LoadVar $PARM1
LoadVar $PARM2
LoadVar $PARM3
LoadVar $PARM4
LoadVar $PARM5
LoadVar $PARM6
LoadVar $PARM7
LoadVar $PARM8
LoadVar $USER_COMMAND_LINE
LoadVar $COMMAND
UpperCase $PARM1
UpperCase $PARM2
UpperCase $PARM3
UpperCase $PARM4
UpperCase $PARM5
UpperCase $PARM6
UpperCase $PARM7
UpperCase $PARM8
UpperCase $USER_COMMAND_LINE
UpperCase $COMMAND
Return
:PROCESSPARMS
If ($PARM1 = "?") or ($PARM1 = "HELP")
   goto :HELP
ElseIf ($PARM1 = "STATUS")
   Goto :REPORT
ElseIf ($PARM1 = "ON")
   SetVar $botted TRUE
Else
   SetVar $botted FALSE
   Goto :ENDPROCESS
End
GetWordPos $USER_COMMAND_LINE $pos "SECTOR="
If ($pos > 0)
   SetVar $where ($pos + 7)
   CutText $USER_COMMAND_LINE $cutout $where 999
   GetWord $cutout $setting 1
   IsNumber $isnum $setting
   If ($isnum)
      SetVar $z_safesector $setting
   End
End
GetWordPos $USER_COMMAND_LINE $pos "SHIP="
If ($pos > 0)
   SetVar $where ($pos + 5)
   CutText $USER_COMMAND_LINE $cutout $where 999
   GetWord $cutout $setting 1
   IsNumber $isnum $setting
   If ($isnum)
      SetVar $z_safeship $setting
   End
End
GetWordPos $USER_COMMAND_LINE $pos "BASE="
If ($pos > 0)
   SetVar $where ($pos + 5)
   CutText $USER_COMMAND_LINE $cutout $where 999
   GetWord $cutout $setting 1
   IsNumber $isnum $setting
   If ($isnum)
      SetVar $z_base $setting
   End
End
GetWordPos $USER_COMMAND_LINE $pos "PLANET="
If ($pos > 0)
   SetVar $where ($pos + 7)
   CutText $USER_COMMAND_LINE $cutout $where 999
   GetWord $cutout $setting 1
   IsNumber $isnum $setting
   If ($isnum)
      SetVar $z_planet $setting
   End
End
GetWordPos $USER_COMMAND_LINE $pos "VOLLEY="
If ($pos > 0)
   SetVar $where ($pos + 7)
   CutText $USER_COMMAND_LINE $cutout $where 999
   GetWord $cutout $setting 1
   IsNumber $isnum $setting
   If ($isnum)
      SetVar $z_volley $setting
   End
End
GetWordPos $USER_COMMAND_LINE $pos "VOLLEYR="
If ($pos > 0)
   SetVar $where ($pos + 7)
   CutText $USER_COMMAND_LINE $cutout $where 999
   GetWord $cutout $setting 1
   IsNumber $isnum $setting
   If ($isnum)
      SetVar $z_rvolley $setting
   End
End
GetWordPos $USER_COMMAND_LINE $pos "MAC0"
If ($pos > 0)
   SetVar $z_macrotype TRUE
End
GetWordPos $USER_COMMAND_LINE $pos "MAC1"
If ($pos > 0)
   SetVar $z_attackmacro $z_attack1
   SetVar $z_attacknum "1"
End
GetWordPos $USER_COMMAND_LINE $pos "MAC2"
If ($pos > 0)
   SetVar $z_attackmacro $z_attack2
   SetVar $z_attacknum "2"
End
GetWordPos $USER_COMMAND_LINE $pos "MAC3"
If ($pos > 0)
   SetVar $z_attackmacro $z_attack3
   SetVar $z_attacknum "3"
End
GetWordPos $USER_COMMAND_LINE $pos "MAC4"
If ($pos > 0)
   SetVar $z_attackmacro $z_attack4
   SetVar $z_attacknum "4"
End
GetWordPos $USER_COMMAND_LINE $pos "MAC5"
If ($pos > 0)
   SetVar $z_attackmacro $z_attack5
   SetVar $z_attacknum "5"
End
:ENDPROCESS
Return
:HELP
KillAllTriggers
SetVar $commandd $COMMAND
LowerCase $commandd
Send "'*"
Send "---------------------------------------------------------------------*"
Send "Zed's Rapid Response v" & $version & " Help*"
Send "--------------------------------*"
Send "Attack/Sector Response Script.*"
Send "-*"
Send "Usage: " & $z_botname & " " & $commandd & " on [sector=x] [ship=x] [base=x]*"
Send "       [planet=x] [volleys=x] [macx]*"
Send "-*"
Send "     sector=x: where x is the safe sector.*"
Send "       ship=x: where x is the safe ship.*"
Send "       base=x: where x is the home base sector.*"
Send "     planet=x: where x is the planet number to refurb from.*"
Send "     volley=x: where x is the number of waves to attack with.*"
Send "    volleyr=x: where x is the number of waves when roaming*"
Send "         macx: where x is the attackmacro to use (1-5).*"
Send "               or use mac0 to set the macro to AUTOCREATE.*"
Send "-*"
Send " NOTE: All the above parameters are optional except the ON parameter.*"
Send "-*"
Send " or " & $z_botname & " zrr status - to report kills and settings.*"
Send " or " & $z_botname & " zrr help   - to display this help.*"
Send " or " & $z_botname & " zrr ?      - to display this help.*"
Send "-*"
Send " Once Zed's Rapid Response is running, you can use the following*"
Send " extra commands over subspace:*"
Send "-*"
Send "    " & $z_botname & "rroff     - to turn the script off.*"
Send "    " & $z_botname & "rrpause   - to pause the script.*"
Send "    " & $z_botname & "rrunpause - to unpause the script.*"
Send "    " & $z_botname & "rrstatus  - to report kills and settings.*"
Send "    " & $z_botname & "rrhelp    - to display this help.*"
Send "-*"
Send "    NOTE: no spaces in these extra commands.*"
Send "---------------------------------------------------------------------*"
Send "** "
If ($botted <> TRUE)
   Goto :FINISH
End
SetTextTrigger helpdone :HELPDONE "Sub-space comm-link terminated"
SetDelayTrigger helpdone2 :HELPDONE 3000
Pause
:HELPDONE
Return
:REPORT
KillAllTriggers
If ($botted <> TRUE)
   SetVar $z_status "OFF"
Else
   SetVar $z_status "ON"
End
Send "'*"
Send "---------------------------------------------------------------------*"
Send "Zed's Rapid Response v" & $version & " Status Report*"
Send "-----------------------------------------*"
Send " Kills this game: " & $z_gamekills & "*"
Send "     Total Kills: " & $z_totalkills & "*"
Send "-*"
Send "  Current Status: " & $z_status & "*"
Send "-*"
Send "     Safe Sector: " & $z_safesector & "*"
Send "       Safe Ship: " & $z_safeship & "*"
Send "       Home Base: " & $z_base & "*"
Send "          Planet: " & $z_planet & "*"
Send "         Volleys: " & $z_volley & "*"
Send "-*"
Send "    Attack Macro: Macro #" & $z_attacknum & "*"
Send "---------------------------------------------------------------------*"
Send "** "
If ($botted <> TRUE)
   Goto :FINISH
End
Return
# Includes
Include include\Z_Auth.ts
Include include\Z_Lib.ts
Include include\Z_SaveMe.ts
# ZeD Compiled: Sun 09/01/2011 - 17:47:06.82 
# ZeD Compiled: Tue 13/11/2012 -  8:52:41.16 
# ZeD Compiled: Sun 04/08/2013 -  0:09:18.28 
# ZeD Compiled: Tue 06/08/2013 - 12:29:47.84 
# ZeD Compiled: Sat 07/09/2013 -  7:17:02.91 
# ZeD Compiled: Sun 01/12/2013 -  2:24:51.49 
