# Title: Z-SwitchBot 
# Author: Zed 
# Copyright (c) 2010 by Archibald H. Vilanos III 
# All Rights Reserved. 
# Switches from 1 bot to another.
SetVar $version "1.01"
SetVar $creditz "Zed"
SetVar $notready FALSE
FileExists $fileexists "z-switchbot.cfg"
If ($fileexists = TRUE)
	Read "z-switchbot.cfg" $frombot 1
	Read "z-switchbot.cfg" $tobot 2
Else
	SetVar $frombot "Your_Bot_File_Name_Here_NO EXTENSION"
	SetVar $tobot "z-bot.cts"
	Write "z-switchbot.cfg" $frombot
	Write "z-switchbot.cfg" $tobot
	SetVar $notready TRUE
End
If ($frombot = "Your_Bot_File_Name_Here_NO EXTENSION")
	SetVar $notready TRUE
End
If ($notready = TRUE)
	Echo "**" & ANSI_12 & "[5m" & "Please EDIT the  " & ANSI_14 & "z-switchbot.cfg" & ANSI_12 & "  in your TWX Root." & "[0m"
	Echo "*" & ANSI_11 & "Replace the first line in the file with the FILE NAME of your BOT."
	Echo "*" & ANSI_11 & "Do NOT include the EXTENSION (.ts or .cts)"
	Echo "*" & ANSI_10 & "Run this command again when the config file is corrected.*"
	Send "'Z-SWITCHBOT - Config file not ready.*"
	Halt
End
SetVar $temp $tobot
GetWordPos $tobot $pos "\"
If ($pos = "0")
	SetVar $temp "scripts\" & $tobot
End
FileExists $fileexists $temp
If ($fileexists <> TRUE)
	Send "'Z-SWITCHBOT - File does NOT exist [ " & $temp & " ].*"
	Goto :FINISH
End
SetVar $script_name $frombot
ListActiveScripts $scripts
SetVar $count 1
UpperCase $script_name
While ($count <= $scripts)
	UpperCase $scripts[$count]
	GetWordPos $scripts[$count] $pos $script_name
	If ($pos > 0)
		Stop $scripts[$count]
	End
	SetVar $count ($count + 1)
End
SetArray $scripts 0
Send "'Z-SWITCHBOT - Switching to [ " & $temp & " ].*"
Load $tobot
:FINISH
Halt
# ZeD Compiled: Tue 26/11/2013 - 14:43:53.17 
# ZeD Compiled: Mon 06/01/2014 -  6:10:17.07 
# ZeD Compiled: Mon 20/01/2014 - 11:58:42.94 
