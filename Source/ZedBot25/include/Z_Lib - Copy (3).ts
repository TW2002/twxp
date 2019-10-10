# INCLUDE: Z_Lib
# Gosub :Z_Lib~INITLIB 
# Gosub :Z_Lib~HEADER 
# Gosub :Z_Lib~REDLINE 
# Gosub :Z_Lib~ZEDLINE 
# Gosub :Z_Lib~BLUELINE 
# Gosub :Z_Lib~DOUBLEREDLINE 
# Gosub :Z_Lib~PROMPT 
# Gosub :Z_Lib~CHECKONCE 
# Gosub :Z_Lib~CHECKONCE2 
# Gosub :Z_Lib~CHECKRUNNING 
# Gosub :Z_Lib~CN9CHECK 
# Gosub :Z_Lib~ANIMCHECK 
# Gosub :Z_Lib~COMPACTCHECK 
# Gosub :Z_Lib~ANYKEY 
# Gosub :Z_Lib~PAUSE 
# Gosub :Z_Lib~CLEARSCREEN 
# Gosub :Z_Lib~ISITUNLIMITED 
# Gosub :Z_Lib~SYNC 
# Gosub :Z_Lib~COMMSON 
# Gosub :Z_Lib~COMMSOFF 
# Gosub :Z_Lib~ANSI_ON 
# Gosub :Z_Lib~ANSI_OFF 
# Gosub :Z_Lib~CURRENTPLANET 
# Gosub :Z_Lib~RETURNTOPLANET 
#Gosub :Z_Lib~SUBSPACE (unused - superceded by Z_Lib~MESSAGE)
# Gosub :Z_Lib~PROGRESSBAR 
# Gosub :Z_Lib~TOGGLEDEAF 
# Gosub :Z_Lib~SETDIAL 
# Gosub :Z_Lib~UPDATEDIAL 
# Gosub :Z_Lib~ENDDIAL 
# Gosub :Z_Lib~MESSAGE 
# Gosub :Z_Lib~STRIPALPHA 
# Gosub :Z_Lib~ROUNDTO 
# Gosub :Z_Lib~CHECKIFBUSY 
# Gosub :Z_Lib~TKM 
# Gosub :Z_Lib~SORTFILE 
# Gosub :Z_Lib~INT 
# Gosub :Z_Lib~ROUND 
#
# INITLIB 
:INITLIB
	SetVar $lib_version "1.09h"
	SetVar $creditz "Zed"
	SetVar $tagline ANSI_12 & "-=[" & ANSI_14 & $scripttitle & " v" & $version & ANSI_12 & "]=-"
Return
# HEADER
# SetVar $Z_Lib~scripttitle to the title to be displayed 
# SetVar $Z_Lib~Version to the version of the script 
# SetVar $Z_Lib~extra to extra info to be displayed in the Header (keep it short) 
:HEADER
SetVar $displayline $tagline
If ($extra <> "") and ($extra <> "0")
	SetVar $displayline ($tagline & " " & $extra)
End
If ($license <> "") and ($license <> "0")
	GetLength $license $liclen
	SetVar $licpos ((79 - $liclen) - 13)
	SetVar $displayline ($displayline & "[2;" & $licpos & "H" & ANSI_3 & "Licensed to: " & ANSI_15 & $license)
End
Gosub :CLEARSCREEN
Echo "*" & $displayline
Gosub :REDLINE
SetVar $displayline ""
SetVar $extra ""
Return
# REDLINE 
:REDLINE
Echo "*" & ANSI_12 &#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196
Return
# ZEDLINE 
:ZEDLINE
Echo "[s" & "[14D" & "<<<"&#205&#196&"[Z]"&#196&#205&">>>" & "[u"
Return
# BLUELINE 
:BLUELINE
Echo "*" & ANSI_9 &#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196
Return
# DOUBLEREDLINE 
:DOUBLEREDLINE
Echo "*" & ANSI_12 &#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205&#205
Return
# PROMPT 
# Set the Variable $Z_Lib~setprompt to CITADEL, COMMAND, PLANET or CITCOM 
# Set the Variable $Z_Lib~heraldss to TRUE to send error message over SS 
# Set the variable $Z_Lib~noecho to TRUE to suppress echo of error message 
#
# Returns the prompt in $Z_Lib~prompt or ERROR 
:PROMPT
KillTrigger getprompt
KillTrigger noprompt
SetTextTrigger getprompt :GOTPROMPT #145 & #8
SetDelayTrigger noprompt :NOPROMPT 2000
Send #145
Pause
:NOPROMPT
KillTrigger getprompt
KillTrigger noprompt
Send "* * *"
SetVar $ploop ($ploop + 1)
If ($ploop > 3)
	Goto :BADPROMPT
End
Goto :PROMPT
:GOTPROMPT
KillTrigger getprompt
KillTrigger noprompt
CutText CURRENTLINE $promptis 1 7
If ($setprompt = "COMMAND")
	If ($promptis = "Command")
	ElseIf ($promptis = "Citadel")
		Send "q q "
	ElseIf ($promptis = "Planet ")
		Send "q "
	ElseIf ($promptis = "Compute") or ($promptis = "Corpora")
		Send "q "
		Goto :PROMPT
	ElseIf ($promptis = "<StarDo")
		Send "q  "
	ElseIf ($promptis = "<Underg") or ($promptis = "<FedPol")
		Send "qq  "
	ElseIf ($promptis = "<Shipya") or ($promptis = "<Hardwa") or ($promptis = "<Galact")
	   Send "qq "
	ElseIf ($promptis = "Which i")
		Send "qqq * "
	ElseIf ($promptis = "Do you ")
		Send "q  "
	ElseIf ($promptis = "NavPoin")
		Send "q  "	
	ElseIf ($promptis = "How man")
		Send "z 0 * z 0 * z 0 *"
	ElseIf ($promptis = "Land on")
		Send "q*  "
	Else
		Goto :BADPROMPT
	End
	SetVar $prompt "Command"
	Goto :PROMPTOK
ElseIf ($setprompt = "CITADEL")
	If ($promptis = "Command")
		Goto :BADPROMPT
	ElseIf ($promptis = "Citadel")
	ElseIf ($promptis = "Planet ")
		SetTextTrigger hascit :HASCIT "Planet has a level"
	    SetTextTrigger nocit :NOCIT "Planet command (?="
	    Send "*"
		Pause
:HASCIT
		KillTrigger hascit
		KillTrigger nocit
		Send "c "
		SetVar $prompt "Citadel"
		Goto :PROMPTOK
:NOCIT
		KillTrigger hascit
		KillTrigger nocit
		Goto :BADPROMPT
	ElseIf ($promptis = "Compute") or ($promptis = "Corpora")
		Send "q "
		Goto :PROMPT
	Else
		Goto :BADPROMPT
	End
	SetVar $prompt "Citadel"
	Goto :PROMPTOK
ElseIf ($setprompt = "PLANET")
	If ($promptis = "Command")
		Goto :BADPROMPT
	ElseIf ($promptis = "Citadel")
		Send "q "
	ElseIf ($promptis = "Planet ")
	ElseIf ($promptis = "Compute") or ($promptis = "Corpora")
		Send "q "
		Goto :PROMPT
	Else
		Goto :BADPROMPT
	End
	SetVar $prompt "Planet"
	Goto :PROMPTOK
ElseIf ($setprompt = "CITCOM")
	If ($promptis = "Command")
		SetVar $prompt "Command"
		Goto :PROMPTOK
	ElseIf ($promptis = "Citadel")
		SetVar $prompt "Citadel"
		Goto :PROMPTOK
	ElseIf ($promptis = "Which i")
		SetVar $prompt "Command"
		Send "qqq * "
		Goto :PROMPTOK
	ElseIf ($promptis = "<Shipya") or ($promptis = "<Hardwa") or ($promptis = "<Galact")
		SetVar $prompt "Command"
		Send "qq "
		Goto :PROMPTOK
	ElseIf ($promptis = "<Underg")
		SetVar $prompt "Command"
		Send "qq  "
		Goto :PROMPTOK
	ElseIf ($promptis = "Do you ")
		SetVar $prompt "Command"
		Send "q  "
		Goto :PROMPTOK
	ElseIf ($promptis = "NavPoin")
		SetVar $prompt "Command"
		Send "q  "
		Goto :PROMPTOK
	ElseIf ($promptis = "How man")
		SetVar $prompt "Command"
		Send "z 0 * z 0 * z 0 *"
		Goto :PROMPTOK
	ElseIf ($promptis = "Land on")
		SetVar $prompt "Command"
		Send "q* "
		Goto :PROMPTOK
	ElseIf ($promptis = "Planet ")
		SetTextTrigger hascit2 :HASCIT2 "Planet has a level"
	    SetTextTrigger nocit2 :NOCIT2 "Planet command (?="
	    Send "*"
		Pause
:HASCIT2
		KillTrigger nocit2
		KillTrigger hascit2
		Send "c "
		SetVar $prompt "Citadel"
		Goto :PROMPTOK
:NOCIT2
		KillTrigger hascit2
		KillTrigger nocit2
		Send "q "
		SetVar $prompt "Command"
		Goto :PROMPTOK
	ElseIf ($promptis = "Compute") or ($promptis = "Corpora")
		Send "q "
		Goto :PROMPT
	ElseIf ($promptis = "<StarDo")
		Send "q "
		SetVar $prompt "Command"
		Goto :PROMPTOK
	ElseIf ($promptis = "<Underg") or ($promptis = "<FedPol")
		Send "qq  "
		SetVar $prompt "Command"
		Goto :PROMPTOK
	ElseIf ($promptis = "<Shipya") or ($promptis = "<Hardwa")
	    Send "q q "
		SetVar $prompt "Command"
		Goto :PROMPTOK
	ElseIf ($promptis = "How man")
		Send "z 0 * z 0 * z 0 *"
		SetVar $prompt "Command"
	Else
		Goto :BADPROMPT
	End
End
:BADPROMPT
If ($setprompt = "CITCOM")
	SetVar $Setprompt "CITADEL or COMMAND"
End
SetVar $prompt "ERROR"
If ($noecho = FALSE)
	Echo "**" & ANSI_12 & "Current Prompt is: [" & ANSI_14 & $promptis & ANSI_12 & "]"
	Echo "**" & ANSI_12 & "Must begin at the " & $setprompt & " prompt..**"
Else
	SetVar $noecho FALSE
End
If ($heraldss = TRUE)
	SetVar $message "Current Prompt is: [" & $promptis & "]*"
	SetVar $message ($message & "Must begin at the " & $setprompt & " prompt..*")
	Gosub :MESSAGE
End
:PROMPTOK
Return
# CHECKONCE 
# Stops current instance of script. 
# Set the variable $Z_Lib~scriptname to the name of the script to test for. 
:CHECKONCE
   SetVar $script_name $scriptname & "."
   ListActiveScripts $scripts
   SetVar $count 1
   SetVar $instances 0
   UpperCase $script_name
   While ($count <= $scripts)
      UpperCase $scripts[$count]
      GetWordPos $scripts[$count] $pos $script_name
	  GetWordPos $scripts[$count] $pos2 "KRAAKENBOT"
      If ($pos > 0)
         SetVar $instances ($instances + 1)
      End
	  If ($pos2 > 0)
         SetVar $kbot TRUE
      End
      SetVar $count ($count + 1)
   End
   If ($instances > 1)
      Echo "**" & ANSI_12 & "Already running script " & $script_name & "!*Halting.**"
      Halt
   End
   SetArray $scripts 0
Return
# CHECKONCE2 
# Stops first instance of script. 
# Set the variable $Z_Lib~scriptname to the name of the script to test for. 
:CHECKONCE2
   SetVar $script_name $scriptname & "."
   ListActiveScripts $scripts
   SetVar $count 1
   SetVar $instances 0
   UpperCase $script_name
   While ($count <= $scripts)
      UpperCase $scripts[$count]
      GetWordPos $scripts[$count] $pos $script_name
	  GetWordPos $scripts[$count] $pos2 "KRAAKENBOT"
      If ($pos > 0)
         SetVar $instances ($instances + 1)
      End
	  If ($pos2 > 0)
         SetVar $kbot TRUE
      End
      SetVar $count ($count + 1)
   End
   If ($instances > 1)
      Echo "**" & ANSI_12 & "Already running script " & $script_name & "!*Stopping first instance.**"
	  Stop $script_name
   End
   SetArray $scripts 0
Return
# CHECKRUNNING 
# Checks if a script is running. 
# Set the variable $Z_Lib~scriptname to the name of the script to test for. 
# Returns $Z_Lib~isrunning = TRUE if the script is running. 
:CHECKRUNNING
   SetVar $script_name $scriptname & "."
   ListActiveScripts $scripts
   SetVar $count 1
   SetVar $instances 0
   UpperCase $script_name
   While ($count <= $scripts)
      UpperCase $scripts[$count]
      GetWordPos $scripts[$count] $pos $script_name
      If ($pos > 0)
         SetVar $instances ($instances + 1)
      End
      SetVar $count ($count + 1)
   End
    If ($instances > 0)
		SetVar $isrunning TRUE
	Else
		SetVar $isrunning FALSE
    End
   SetArray $scripts 0
Return
# ALLCNS
# Start from Command or Citadel prompt 
:ALLCNS
SetTextLineTrigger ac1 :AC1 "(1) ANSI graphics"
SetTextLineTrigger ac2 :AC2 "(2) Animation display"
SetTextLineTrigger ac3 :AC3 "(6) Receive private hails"
SetTextLineTrigger ac4 :AC4 "(9) Abort display on keys"
SetTextLineTrigger ac5 :AC5 "(A) Message Display Mode"
SetTextLineTrigger ac6 :AC6 "(B) Screen Pauses"
SetTextLineTrigger ac7 :AC7 "(C) Online Auto Flee"
#SetTextLineTrigger ac8 :AC8 "(E) Sector Autoreturn"
SetTextTrigger ac9 :AC9 "Settings command (?=Help) [Q]"
Send "c n"
Pause
:AC1
GetWord CURRENTLINE $ac1 5
Pause
:AC2
GetWord CURRENTLINE $ac2 5
Pause
:AC3
GetWord CURRENTLINE $ac3 6
Pause
:AC4
GetWord CURRENTLINE $ac4 7
Pause
:AC5
GetWord CURRENTLINE $ac5 6
Pause
:AC6
GetWord CURRENTLINE $ac6 5
Pause
:AC7
GetWord CURRENTLINE $ac7 6
Pause
:AC9
KillTrigger ac1
KillTrigger ac2
KillTrigger ac3
KillTrigger ac4
KillTrigger ac5
KillTrigger ac6
KillTrigger ac7
KillTrigger ac8
KillTrigger ac9
If ($ac1 <> "On")
	Send "1 "
End
If ($ac2 <> "Off")
	Send "2 "
End
If ($ac3 <> "Yes")
	Send "6 "
End
If ($ac4 <> "SPACE")
	Send "9 "
End
If ($ac5 <> "Compact")
	Send "a "
End
If ($ac6 <> "No")
	Send "b "
End
If ($ac7 <> "Off")
	Send "c "
End
Send "q q"
WaitOn "<Computer deactivated>"
WaitOn "elp)"
Return
# ANSI_ON and ANSI_OFF 
# Start from Command prompt 
:ANSI_OFF
SetTextLineTrigger ANSI :ANSI1 "(1) ANSI graphics"
Send "c n"
Pause
:ANSI1
KillTrigger ANSI
GetWord CURRENTLINE $ansi 5
If ($ansi = "On")
   Send "1"
End
Send "q q "
Return
:ANSI_ON
SetTextLineTrigger ANSI :ANSI2 "(1) ANSI graphics"
Send "c n"
Pause
:ANSI2
KillTrigger ANSI
GetWord CURRENTLINE $ansi 5
If ($ansi = "Off")
   Send "1"
End
Send "q q "
Return
# CN9CHECK 
# Start at the Command prompt 
# Returns Z_Lib~cn9 (TRUE if needed to be set) 
:CN9CHECK
SetTextLineTrigger CN9OK :CN9OK         "Abort display on keys    - SPACE"
SetTextLineTrigger CN9NOTOK :CN9NOTOK "Abort display on keys    - ALL KEYS"
SetDelayTrigger CNTIMEOUT :CN9NOTOK "3000"
Send "c n"
Pause
:CN9NOTOK
KillTrigger CN9OK
KillTrigger CN9NOTOK
KillTrigger CNTIMEOUT
Send "9"
SetVar $cn9 TRUE
Goto :ENDCN9
:CN9OK
KillTrigger CN9OK
KillTrigger CN9NOTOK
KillTrigger CNTIMEOUT
SetVar $cn9 FALSE
:ENDCN9
Send "q q "
Return
# ANIMCHECK 
# Start at the Command prompt 
:ANIMCHECK
SetTextLineTrigger animOK :ANIMOK         "Animation display        - Off"
SetTextLineTrigger animNOTOK :ANIMNOTOK "Animation display        - On"
SetDelayTrigger animTIMEOUT :ANIMNOTOK "3000"
Send "c n"
Pause
:ANIMNOTOK
KillTrigger animOK
KillTrigger animNOTOK
KillTrigger animTIMEOUT
Send "2"
:ANIMOK
KillTrigger animOK
KillTrigger animNOTOK
KillTrigger animTIMEOUT
Send "q q "
Return
# COMPACTCHECK 
# Start at the Command prompt 
:COMPACTCHECK
SetTextLineTrigger compactOK :COMPACTOK         "Message Display Mode     - Compact"
SetTextLineTrigger compactNOTOK :COMPACTNOTOK "Message Display Mode     - Long"
SetDelayTrigger compactTIMEOUT :COMPACTNOTOK "3000"
Send "c n"
Pause
:COMPACTNOTOK
KillTrigger compactOK
KillTrigger compactNOTOK
KillTrigger compactTIMEOUT
Send "a"
:COMPACTOK
KillTrigger compactOK
KillTrigger compactNOTOK
KillTrigger compactTIMEOUT
Send "q q "
Return
# ANYKEY 
:ANYKEY
Echo "*" & ANSI_10 & "Press any key to continue..."
GetConsoleInput $anykey SINGLEKEY
Return
# PAUSE
# SetVar Z_Lib~pausekey to change the unpause key 
:PAUSE
If ($pausekey = "") or ($pausekey = "0")
	SetVar $pausekey #42
End
Echo "**" & ANSI_11 & "[5m" & "PAUSED: "  & "[0m" & ANSI_15 & "Press " & ANSI_12 & "[" & ANSI_14 & $pausekey & ANSI_12 & "]" & ANSI_15 & " to continue...**"
SetTextOutTrigger paus :UNPAUSEKEYPRESSED $pausekey
Pause
:UNPAUSEKEYPRESSED
KillTrigger paus
Echo "**" & ANSI_13 & "[5m" & "UNPAUSED: "  & "[0m" & ANSI_15 & "Continuing..."
Return
# CLEARSCREEN 
:CLEARSCREEN
Echo "[2J"
Echo "[1;1H"
Return
# ISITUNLIMITED 
# Start at the Command or Citadel Prompt 
# Returns $Z_Lib~isunlimited (TRUE) 
# SetVar $unlimcheck to FALSE and save it to RESET 
:ISITUNLIMITED
If ($unlimcheck <> TRUE)
	LoadVar $unlimcheck
End
If ($unlimcheck = TRUE)
	LoadVar $isunlimited
Else
	SetTextTrigger isunlim :ISUNLIM "Turns left     :"
	Send "i"
	Pause
:ISUNLIM
	GetWord CURRENTLINE $unlimword 4
	If ($unlimword = "Unlimited")
		SetVar $isunlimited TRUE
	else
		SetVar $isunlimited FALSE
	End
	SaveVar $isunlimited
	SetVar $unlimcheck TRUE
	SaveVar $unlimcheck
	SetVar $unlimitedgame $isunlimited
	SaveVar $unlimitedgame
End
Return
# SYNC 
:SYNC
KillTrigger av
KillTrigger av2
KillTrigger av3
KillTrigger av4
SetTextTrigger av :AV "Average Interval Lag:"
SetTextTrigger av2 :AV "Network Ping:"
SetDelayTrigger av3 :SYNC 10000
SetTextTrigger av4 :AV "Event Lag:"
Send "@"
Pause
:AV
KillTrigger av
KillTrigger av2
KillTrigger av3
KillTrigger av4
Return
# COMMSON 
:COMMSON
SetVar $loop "1"
KillTrigger on1
KillTrigger on2
KillTrigger on3
:ONLOOP
SetDelayTrigger on1 :COMMSON1 3000
SetTextLineTrigger on2 :COMMSON2 "Silencing all messages."
SetTextLineTrigger on3 :COMMSON3 "Displaying all messages."
Send "|"
Pause
:COMMSON1
KillTrigger on1
KillTrigger on2
KillTrigger on3
SetVar $loop ($loop + 1)
If ($loop > 3)
	Goto :ENDCOMMS
End
Goto :ONLOOP
:COMMSON2
KillTrigger on1
KillTrigger on2
KillTrigger on3
Send "|"
:COMMSON3
KillTrigger on1
KillTrigger on2
KillTrigger on3
Echo ANSI_15 & "<<<=[" & ANSI_10 & "COMMS ON" & ANSI_15 & "]=>>> "
Goto :ENDCOMMS
# COMMSOFF 
:COMMSOFF
KillTrigger off1
KillTrigger off2
KillTrigger off3
SetVar $loop "1"
:OFFLOOP
SetDelayTrigger off1 :COMMSOFF1 3000
SetTextLineTrigger off2 :COMMSOFF2 "Displaying all messages."
SetTextLineTrigger off3 :COMMSOFF3 "Silencing all messages."
Send "|"
Pause
:COMMSOFF1
KillTrigger off1
KillTrigger off2
KillTrigger off3
SetVar $loop ($loop + 1)
If ($loop > 3)
	Goto :ENDCOMMS
End
Goto :OFFLOOP
:COMMSOFF2
KillTrigger off1
KillTrigger off2
KillTrigger off3
Send "|"
:COMMSOFF3
KillTrigger off1
KillTrigger off2
KillTrigger off3
Echo ANSI_14 & "<<<=[" & ANSI_12 & "COMMS OFF" & ANSI_14 & "]=>>> "
:ENDCOMMS
Return
# CURRENTPLANET
# Returns $Z-Lib~citadel = TRUE if in a citadel 
# Returns $Z-Lib~planet = TRUE if on a planet 
# Returns the planet number in $Z-Lib~planetnum 
:CURRENTPLANET
SetVar $citadel FALSE
SetVar $planet FALSE
Send #145
WaitOn #145 & #8
CutText CURRENTLINE $currentprompt 1 7
If ($currentprompt = "Compute") or ($currentprompt = "Corpora")
	Send "q"
	Goto :CURRENTPLANET
End
If ($currentprompt = "Citadel")
	SetVar $citadel TRUE
	SetVar $currentprompt "Planet "
	Send "q"
	WaitOn "Planet command (?=help)"
End
If ($currentprompt = "Planet ")
	SetVar $planet TRUE
	SetTextLineTrigger getplanet :GETPLANET "Planet #"
	Send "*"
	Pause
:GETPLANET
	KillTrigger getplanet
	GetWord CURRENTLINE $planetnum 2
	StripText $planetnum "#"
	If ($Citadel = TRUE)
		Send "c"
	End
End
Return
# RETURNTOPLANET 
# Call after using Gosub :Z_Lib~CURRENTPLANET 
:RETURNTOPLANET
If ($planet = TRUE)
	Send "l j" & #8 & #8 & $planetnum & "*   "
	If ($citadel = TRUE)
		Send "c  *  "
	End
End
Return
# SUBSPACE
# Set $Z_Lib~ssmessage to the 1-line message to send, OR... 
# Set $Z_Lib~ssmessage to the number of lines in the message to send. 
# SetArray $Z_Lib~ssmessage[$Z_Lib~ssmessage] 
# Set each index of the array to the message content line by line. 
#:SUBSPACE
#IsNumber $isnum $ssmessage
#If ($isnum = FALSE)
#	Send "'" & $ssmessage & "*"
#Else
#	SetVar $sscount 1
#	Send "'*"
#	While ($sscount <= $ssmessage)
#		Send $ssmessage[$sscount] & "*"
#		SetVar $sscount ($sscount + 1)
#	End
#	Send "*"
#End
#Send #145
#WaitFor #145 & #8
#:SSSENT
#KillTrigger sssent
#SetArray $ssmessage 0
#Return
# PROGRESSBAR
# SetVar $Z_Lib~progress 
# SetVar $Z_Lib~goal 
# SetVar $Z_Lib~increments (optional) 
# SetVar $Z_Lib~pip (optional)
# SetVar $Z_Lib~left (optional)
# SetVar $Z_Lib~right (optional)
# Gosub :Z_Lib~PROGRESSBAR 
# Returns $Z_Lib~progressbar 
:PROGRESSBAR
SetVar $ticks 0
If ($increments < 5)
	SetVar $increments 30
End
If ($left = "") or ($left = 0)
	SetVar $left "["
End
If ($right = "") or ($right = 0)
	SetVar $right "]"
End
If ($pip = "") or ($pip = 0)
	SetVar $pip "="
End
If ($goal <> 0)
	SetPrecision 5
	SetVar $progressincrement ($goal / $increments)
	If ($progress  > ($ticks * $progressincrement))
		While ($progress  > ($ticks * $progressincrement))
			SetVar $ticks ($ticks + 1)
		End
	End
	If ($progress >= $goal)
		SetVar $ticks $increments
	End
	SetPrecision 0
	SetVar $count 0
	SetVar $progressbar $left
	While ($count <= $ticks)
		SetVar $progressbar ($progressbar & $pip)
		SetVar $count ($count + 1)
	End
	SetVar $whitespace ($increments - $ticks) 
	
	SetVar $count 0
	While ($count < $whitespace)
		SetVar $progressbar ($progressbar & " ")
		SetVar $count ($count + 1)
	End
	SetVar $progressbar ($progressbar & $right)
Else
	SetVar $progressbar $left & $right
End
Return
# DIAL ROUTINES 
# SETDIAL 
# Call before starting the loop 
:SETDIAL
Echo "**" ANSI_10 "Working... [" & ANSI_15 & #249  & ANSI_10 & "]" 
Setvar $meter "0"
SetVar $dial[1] "/"
SetVar $dial[2] "-"
SetVar $dial[3] "\"
SetVar $dial[4] #179
Return
# UPDATEDIAL 
# Call once each time through the loop 
:UPDATEDIAL
SetVar $meter ($meter + 1)
If ($meter > 4)
	SetVar $meter 1
End 
Echo #27 & "[2D" & ANSI_15 & $dial[$meter] & #27 & "[1C"
Send #27
Return
# ENDDIAL 
# Call once after the loop has finished 
:ENDDIAL
Echo ANSI_15 & #27 & "[3D" & "done.  " 
Return
# TOGGLEDEAF 
:TOGGLEDEAF
OpenMenu TWX_TOGGLEDEAF FALSE
CloseMenu
Return
# MESSAGE 
# SetVar $Z_Lib~messagemode (R = Subspace P = Personal) 
# SetVar $Z_Lib~messageto (Recipient if personal) 
# SetVar $Z_Lib~message (message to send) (do not include command (' or =)) (do not include final *) 
# SetVar $Z_Lib~silentmode TRUE to suppress SS Messages. 
# Returns $Z_Lib~subspacechannel 
:MESSAGE
#SetVar $messaging TRUE
If ($messagemode = "E") and ($selfbotss = TRUE)
	SetVar $messagemode "R"
End
If ($messagemode = "P")
	SetTextTrigger pmterm1 :PMTERM "Secure comm-link terminated."
	SetTextTrigger pmterm2 :PMTERM "GMS link terminated."
	Send "=" & $messageto & "*"
	Send "y" & #8 & $message
	Send "*"
	Pause
:PMTERM
	KillTrigger pmterm1
	KillTrigger pmterm2
ElseIf ($messagemode = "E")
	Echo "**" & ANSI_14 & $message & ANSI_0
ElseIf ($messagemode = "F")
	If ($silentmode <> TRUE)
		Send "`*"
		WaitOn "Type FedComm message [<ENTER> to send line. Blank line to end transmission]"
		Send $message
		Send "*"
		WaitOn "Federation comm-link terminated."
	End
Else
	If ($silentmode <> TRUE)
		KillTrigger m1
		SetTextLineTrigger m1 :M1 "Comm-link open on sub-space band"
		Send "'*"
		Pause
:M1
		KillTrigger m1
		GetWord CURRENTLINE $subspacechannel 6
		WaitOn "Type sub-space message [<ENTER> to send line. Blank line to end transmission]"
		Send $message
		Send "*"
		WaitOn "Sub-space comm-link terminated"
	End
End
SetVar $messagemode "S"
SetVar $message ""
SetVar $messageto ""
#SetVar $messaging FALSE
Return
# STRIPALPHA 
# SetVar $Z_Lib~stripalpha to the variable to strip 
# Returns $Z_Lib~stripalpha (stripped of alphabetical characters) 
:STRIPALPHA
LowerCase $stripalpha
StripText $stripalpha "a"
StripText $stripalpha "b"
StripText $stripalpha "c"
StripText $stripalpha "d"
StripText $stripalpha "e"
StripText $stripalpha "f"
StripText $stripalpha "g"
StripText $stripalpha "h"
StripText $stripalpha "i"
StripText $stripalpha "j"
StripText $stripalpha "k"
StripText $stripalpha "l"
StripText $stripalpha "m"
StripText $stripalpha "n"
StripText $stripalpha "o"
StripText $stripalpha "p"
StripText $stripalpha "q"
StripText $stripalpha "r"
StripText $stripalpha "s"
StripText $stripalpha "t"
StripText $stripalpha "u"
StripText $stripalpha "v"
StripText $stripalpha "w"
StripText $stripalpha "x"
StripText $stripalpha "y"
StripText $stripalpha "z"
Return
# ROUNDTO 
# SetVar $roundtoval to the value to round 
# SetVar $roundtodiv to the number to round by Eg: 1000 
# Gosub :ROUNDTO 
# Returns $roundtoresult (the number rounded up) 
:ROUNDTO
SetVar $roundtoresult $roundtoval
If ($roundtoval < 1) or ($roundtodiv < 1)
	Goto :ENDROUNDTO
End
SetVar $rtemp $roundtoval
While ($rtemp >= $roundtodiv)
	SetVar $rtemp ($rtemp - $roundtodiv)
	SetVar $rval ($rval + 1)
End
SetVar $roundtoresult ($rval * $roundtodiv)
If ($rtemp <> 0)
	SetVar $roundtoresult ($roundtoresult + $roundtodiv)
End
:ENDROUNDTO
Return
# CHECKIFBUSY 
# Returns $busy = TRUE  - if the prompt is changing, or is not the Citadel or Command prompt 
:CHECKIFBUSY
SetVar $busy TRUE
SetVar $line CURRENTLINE
If ($line <> "")
	CutText $line $prmpt 1 7
	If ($prmpt = "Command") or ($prmpt = "Citadel")
		SetDelayTrigger prmptchk :PRMPTCHK5 1000
		SetTextLineTrigger prmptchk2 :PRMPTCHK5 ""
		Pause
:PRMPTCHK5
		KillTrigger prmptchk
		KillTrigger prmptchk2
		SetVar $line CURRENTLINE
		If ($line <> "")
			CutText $line $prmpt 1 7
			If ($prmpt = "Command") or ($prmpt = "Citadel")
				SetDelayTrigger prmptchk :PRMPTCHK4 500
				SetTextLineTrigger prmptchk2 :PRMPTCHK4 ""
				Pause
:PRMPTCHK4
				KillTrigger prmptchk
				KillTrigger prmptchk2
				SetVar $line CURRENTLINE
				If ($line <> "")
					CutText $line $prmpt 1 7
					If ($prmpt = "Command") or ($prmpt = "Citadel")
						SetDelayTrigger prmptchk :PRMPTCHK3 300
						SetTextLineTrigger prmptchk2 :PRMPTCHK3 ""
						Pause
:PRMPTCHK3
						KillTrigger prmptchk
						KillTrigger prmptchk2
						SetVar $line CURRENTLINE
						If ($line <> "")
							CutText $line $prmpt 1 7
							If ($prmpt = "Command") or ($prmpt = "Citadel")
								SetDelayTrigger prmptchk :PRMPTCHK2 100
								SetTextLineTrigger prmptchk2 :PRMPTCHK2 ""
								Pause
:PRMPTCHK2
								KillTrigger prmptchk
								KillTrigger prmptchk2
								SetVar $line CURRENTLINE
								If ($line <> "")
									CutText $line $prmpt 1 7
									If ($prmpt = "Command") or ($prmpt = "Citadel")
										SetDelayTrigger prmptchk :PRMPTCHK1 50
										SetTextLineTrigger prmptchk2 :PRMPTCHK1 ""
										Pause
:PRMPTCHK1
										KillTrigger prmptchk
										KillTrigger prmptchk2
										SetVar $line CURRENTLINE
										If ($line <> "")
											CutText $line $prmpt 1 7
											If ($prmpt = "Command") or ($prmpt = "Citadel")
												SetDelayTrigger prmptchk :PRMPTCHK 10
												SetTextLineTrigger prmptchk2 :PRMPTCHK ""
												Pause
:PRMPTCHK
												KillTrigger prmptchk
												KillTrigger prmptchk2
												SetVar $line CURRENTLINE
												If ($line <> "")
													CutText $line $prmpt 1 7
													If ($prmpt = "Command") or ($prmpt = "Citadel")
														SetVar $busy FALSE
													End
												End
											End
										End
									End
								End
							End
						End
					End
				End
			End
		End
	End
End
Return
# CHECKIFBUSY2 
# Returns $busy = TRUE  - if the prompt is changing (any prompt) 
:CHECKIFBUSY2
SetVar $busy "TRUE"
SetVar $line CURRENTLINE
If ($line <> "")
	CutText $line $prmpt 1 7
	SetVar $lastprompt $prmpt
	SetDelayTrigger prmptchk :2PRMPTCHK5 1000
	SetTextLineTrigger prmptchk2 :2PRMPTCHK5 ""
	Pause
:2PRMPTCHK5
	KillTrigger prmptchk
	KillTrigger prmptchk2
	SetVar $line CURRENTLINE
	If ($line <> "")
		CutText $line $prmpt 1 7
		If ($prmpt = $lastprompt)
			SetDelayTrigger prmptchk :2PRMPTCHK4 500
			SetTextLineTrigger prmptchk2 :2PRMPTCHK4 ""
			Pause
:2PRMPTCHK4
			KillTrigger prmptchk
			KillTrigger prmptchk2
			SetVar $line CURRENTLINE
			If ($line <> "")
				CutText $line $prmpt 1 7
				If ($prmpt = $lastprompt)
					SetDelayTrigger prmptchk :2PRMPTCHK3 300
					SetTextLineTrigger prmptchk2 :2PRMPTCHK3 ""
					Pause
:2PRMPTCHK3
					KillTrigger prmptchk
					KillTrigger prmptchk2
					SetVar $line CURRENTLINE
					If ($line <> "")
						CutText $line $prmpt 1 7
						If ($prmpt = $lastprompt)
							SetDelayTrigger prmptchk :2PRMPTCHK2 100
							SetTextLineTrigger prmptchk2 :2PRMPTCHK2 ""
							Pause
:2PRMPTCHK2
							KillTrigger prmptchk
							KillTrigger prmptchk2
							SetVar $line CURRENTLINE
							If ($line <> "")
								CutText $line $prmpt 1 7
								If ($prmpt = $lastprompt)
									SetDelayTrigger prmptchk :2PRMPTCHK1 50
									SetTextLineTrigger prmptchk2 :2PRMPTCHK1 ""
									Pause
:2PRMPTCHK1
									KillTrigger prmptchk
									KillTrigger prmptchk2
									SetVar $line CURRENTLINE
									If ($line <> "")
										CutText $line $prmpt 1 7
										If ($prmpt = $lastprompt)
											SetDelayTrigger prmptchk :2PRMPTCHK 10
											SetTextLineTrigger prmptchk2 :2PRMPTCHK ""
											Pause
:2PRMPTCHK
											KillTrigger prmptchk
											KillTrigger prmptchk2
											SetVar $line CURRENTLINE
											If ($line <> "")
												CutText $line $prmpt 1 7
												If ($prmpt = $lastprompt)
													SetVar $busy "FALSE"
												End
											End
										End
									End
								End
							End
						End
					End
				End
			End
		End
	End
End
Return
# TKM 
# SetVar $Z_Lib~number to the number to check for T, K, or M 
# Returns $Z_Lib~number with T or K replaced with 000 and M replaced with 000000 
:TKM
UpperCase $number
GetWordPos $number $pos "M"
GetWordPos $number $pos2 "T"
GetWordPos $number $pos3 "K"
GetWordPos $number $pos4 "B"
If ($pos > 0)
	StripText $number "M"
	SetVar $number ($number & "000000")
ElseIf ($pos2 > 0)
	StripText $number "T"
	SetVar $number ($number & "000")
ElseIf ($pos3 > 0)
	StripText $number "K"
	SetVar $number ($number & "000")
ElseIf ($pos4 > 0)
	StripText $number "B"
	SetVar $number ($number & "000000000")
End
Return
# SORTFILE 
# SetVar $Z_Lib~sortfilename to the file to sort 
:SORTFILE
FileExists $fileok $sortfilename
If ($fileok = FALSE)
	Echo "**" & ANSI_12 & "FILE NOT FOUND - " & $sortfilename & "!!!"
	Goto :NOSORT
End
SetArray $sortfile 0
ReadToArray $sortfilename $sortfile
If ($sortfile < 2)
	Echo "**" & ANSI_12 & "FILE TOO SMALL - " & $sortfilename & "!!!"
	Goto :NOSORT
End
Echo "**" & ANSI_11 & "Sorting " & $sortfilename & "..."
SetVar $sortagain TRUE
While ($sortagain = TRUE)
	SetVar $sortagain FALSE
	SetVar $x 1
	While ($x < $sortfile)
		SetVar $i 1
:DEEPSORT
		CutText $sortfile[$x] $sort1 $i 1
		CutText $sortfile[($x + 1)] $sort2 $i 1
		GetCharCode $sort1 $sortcode1
		GetCharCode $sort2 $sortcode2
		If ($sortcode1 > $sortcode2)
			SetVar $sorttemp $sortfile[($x + 1)]
			SetVar $sortfile[($x + 1)] $sortfile[$x]
			SetVar $sortfile[$x] $sorttemp
			SetVar $sortagain TRUE
		ElseIf ($sortcode1 = $sortcode2)
			GetLength $sortfile[$x] $len1
			GetLength $sortfile[($x + 1)] $len2
			If ($len1 > $i) and ($len2 > $i)
				SetVar $i ($i + 1)
				Goto :DEEPSORT
			Else
				If ($len1 > $len2)
					SetVar $sorttemp $sortfile[($x + 1)]
					SetVar $sortfile[($x + 1)] $sortfile[$x]
					SetVar $sortfile[$x] $sorttemp
					SetVar $sortagain TRUE
				End
			End
		End
		SetVar $x ($x + 1)
	End
End
SetVar $x 1
Delete $sortfilename & ".sorted"
While ($x <= $sortfile)
	Write $sortfilename & ".sorted" $sortfile[$x]
	SetVar $x ($x + 1)
End
Echo ANSI_15 & " DONE.**"
:NOSORT
Echo "**"
# INT 
# Returns the INTEGER of a decimal number. 
# Set $Z_Lib~invalue to the decimal number. 
#
# Returns $Z_Lib~outvalue as an INTEGER.
#
# Set the precision to 1 or more, make the division, then set $Z_Lib~invalue to the decimal number. 
# Call :Z_Lib~INT 
# Set the precision back to 0, then set your variable to the $Z_Lib~outvalue. 
# DON'T FORGET TO SET THE PRECISION BACK TO 0 !!! 
:INT
ReplaceText $invalue "." " "
GetWord $invalue $outvalue 1
Return

# ROUND 
#
# SetVar $Z_Lib~number  to the floating point number. 
#
# Gosub :Z_Lib~ROUND 
#
# Returns $Z_Lib~int as an integer. 
# Returns $Z_Lib~mod as the mod. 
# Returns $Z_Lib~round as the rounded number. (<5 >=5)
# Returns $Z_Lib~roundup as the rounded UP number. 
:ROUND
ReplaceText $number "." " "
GetWord $number $int 1
GetWord $number $mod 2
IsNumber $isnum1 $int
IsNumber $isnum2 $mod
If ($isnum1 = TRUE) and ($isnum2 = TRUE)
	SetVar $roundup ($int + 1)
	If ($mod <> 0)
		CutText $mod $temp 1 1
		If ($temp >= 5)
			SetVar $round ($int + 1)
		Else
			SetVar $round $int
		End
	Else
		SetVar $round $int
	End
End
Return
