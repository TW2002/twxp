# Title: Z-Pursuit 
# Author: Zed 
# Copyright (c) 2010 by Archibald H. Vilanos III 
# All Rights Reserved. 
# Tag Script - Search and Destroy. 
SetVar $version "1.07" & #225 & "d"
SetVar $creditz "Zed"
SetVar $scriptname "Z-Pursuit"
SetVar $scripttitle "Zed's Pursuit"
SetVar $Z_Lib~scriptname $scriptname
SetVar $Z_Lib~scripttitle $scripttitle
SetVar $Z_Lib~Version $version
GoSub :Z_Lib~INITLIB
Gosub :Z_Lib~CHECKONCE
# AUTHORISE
SetVar $authorise FALSE
If ($authorise <> TRUE)
	Gosub :Z_Auth~CHECK
End
SetVar $Z_Lib~license LOGINNAME
# End Authorise
Gosub :Z_Lib~SYNC
SetVar $Z_Lib~setprompt "COMMAND"
Gosub :Z_Lib~PROMPT
SetVar $prompt $Z_Lib~prompt
Gosub :Z_Lib~CN9CHECK
Gosub :Z_Lib~COMMSOFF
Gosub :GETSTATS
Gosub :GETSHIPDATA
Gosub :CHECKIGON
Gosub :Z_GetPlayers~GETPLAYERS
SetVar $numplayers $Z_GetPlayers~menu_count
SetVar $i 1
While ($i <= $numplayers)
	SetVar $players[$i] $Z_GetPlayers~menu_name[$i]
	SetVar $i ($i + 1)
End
SetVar $numplayers ($numplayers + 1)
SetVar $players[$numplayers] "ALL"
SetVar $menukey "~"
SetVar $playerptr 1
SetVar $usetwarp FALSE
LoadVar $z_ingamename
LowerCase $z_ingamename
Gosub :Z_Lib~SYNC
:STARTMENU
Gosub :Z_Lib~HEADER
Echo "*" & ANSI_12 & "-=[" & ANSI_14 & "1" & ANSI_12 & "]=- " & ANSI_11 & "Target Player : " & ANSI_15 & $players[$playerptr]
Echo "*"
Echo "*" & ANSI_12 & "-=[" & ANSI_14 & "2" & ANSI_12 & "]=- " & ANSI_11 & "Menu Key      : " & ANSI_4 "[" & ANSI_15 $menukey & ANSI_4 "]"
Gosub :Z_Strings~LINE
Echo "*" & $Z_Strings~line
Echo "*" & ANSI_12 & "-=[" & ANSI_14 & "G"& ANSI_12 & "]=- " & ANSI_11 & "GO !"
Echo "*" & ANSI_12 & "-=[" & ANSI_14 & "Q"& ANSI_12 & "]=- " & ANSI_11 & "Quit"
Echo "*"
GetConsoleInput $choice SINGLEKEY
UpperCase $choice
If ($choice = "1")
	SetVar $playerptr ($playerptr + 1)
	If ($playerptr > $numplayers)
		SetVar $playerptr 1
	End
	If ($players[$playerptr] = $z_ingamename)
		SetVar $playerptr ($playerptr + 1)
		If ($playerptr > $numplayers)
			SetVar $playerptr 1
		End
	End
ElseIf ($choice = "2")
	Echo "**" & ANSI_10 & "Press the key for returning to the menu:"
	GetConsoleInput $value SINGLEKEY
	UpperCase $value
	If ($value <> #13)
		SetVar $menukey $value
		SaveVar $menukey
	End
ElseIf ($choice = "G")
	SetVar $targetplayer $players[$playerptr]
	If ($z_wave > 0) and ($figs > 0)
		SetVar $volleys (($figs / $z_wave) + 1)
	Else
		Echo "**" & ANSI_12 & "You need more fighters or a better ship.. Exiting.**"
		Goto :FINISH
	End
	UpperCase $targetplayer
	Gosub :Z_Lib~COMMSON
	Send "*"
	Goto :START
ElseIf ($choice = "Q")
	Goto :FINISH
End
Goto :STARTMENU
:START
Gosub :GETSTATS
If ($figs < $z_wave)
	Echo "**" & ANSI_12 & "LOW ON FIGHTERS !! Standing down...**"
	Goto :FINISH
End
#SetTextLineTrigger echoflag :ECHOFLAG "] (?=Help)? :"
SetTextLineTrigger targetacquired :TARGETACQUIRED1 "Deployed Fighters Report Sector"
If ($targetplayer = "ALL")
	SetTextLineTrigger targetacquired2 :TARGETACQUIRED2 "Limpet mine in"
End
SetTextLineTrigger targetacquired3 :TARGETACQUIRED3 "Your mines in "
SetTextLineTrigger insector :INSECTOR "Shipboard Computers The Interdictor Generator on"
SetTextLineTrigger insector2 :INSECTOR "warps into the sector."
SetTextLineTrigger insector3 :INSECTOR "lifts off from"
SetTextLineTrigger insector4 :INSECTOR "blasts off from the StarDock."
SettextOutTrigger menukeypressed :MENUKEYPRESSED $menukey
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
Pause
:MENUKEYPRESSED
KillAllTriggers
Gosub :Z_Lib~COMMSOFF
Goto :STARTMENU
:INSECTOR
KillAllTriggers
SetVar $line CURRENTLINE
UpperCase $line
GetWordPos $line $pos $targetplayer
If ($pos > 0) or ($targetplayer = "ALL")
	Gosub :ATTACK
End
Goto :START
:TARGETACQUIRED2
KillAllTriggers
SetVar $line CURRENTLINE
UpperCase $line
GetWord $line $target 4
SetVar $Z_Move~target $target
SetVar $Z_Move~z_wave $z_wave
Gosub :Z_Move~CHARGE
Gosub :ATTACK
Goto :START
:TARGETACQUIRED3
KillAllTriggers
SetVar $line CURRENTLINE
SetVar $ansiline CURRENTANSILINE
GetWord $ansiline $ansiword 6
CutText $ansiword $num 10 2
If ($num = "33")
	Goto :START
End
UpperCase $line
GetWordPos $line $pos $targetplayer
If ($pos > 0) or ($targetplayer = "ALL")
	GetWord $line $target 4
	SetVar $Z_Move~target $target
	SetVar $Z_Move~z_wave $z_wave
	Gosub :Z_Move~CHARGE
	Gosub :ATTACK
End
Goto :START
:TARGETACQUIRED1
KillAllTriggers
SetVar $line CURRENTLINE
SetVar $ansiline CURRENTANSILINE
GetWord $ansiline $ansiword 6
CutText $ansiword $num 10 2
If ($num = "33")
	Goto :START
End
UpperCase $line
GetWordPos $line $pos $targetplayer
If ($pos > 0) or ($targetplayer = "ALL")
	GetWord $line $target 5
	StripText $target ":"
	GetDistance $distance $current_sector $target
	If (($distance > 2) and (($distance * 3) <= $ore) and ($twarp <> "0") and ($usetwarp = TRUE))
		Gosub :TWARP
	Else
		SetVar $Z_Move~target $target
		SetVar $Z_Move~z_wave $z_wave
		Gosub :Z_Move~CHARGE
	End
	Gosub :ATTACK
End
Goto :START
:TWARP











Return
:ATTACK
SetVar $ships SECTOR.SHIPCOUNT[CURRENTSECTOR]
SetVar $huntmacro "a t y n q z " & $z_wave & "* a t n "
SetVar $count 1
While ($count < $ships)
	SetVar $huntmacro ($huntmacro & "n ")
	SetVar $count ($count + 1)
End
SetVar $huntmacro2 ($huntmacro & "n y q z " & $z_wave & "* ")
SetVar $huntmacro ($huntmacro & "y q z " & $z_wave & "* ")
SetVar $i 1
While ($i <= $volleys)
	#Send "a t y n q z " & $z_wave & "n y * a t n y q z " & $z_wave & "n y *"
	Send $huntmacro & $huntmacro2
	SetVar $i ($i + 1)
End
Send "/shsd*"
Gosub :Z_Lib~SYNC
Echo ANSI_15 & "IN PURSUIT - " & ANSI_12 & "TARGET: " & ANSI_14 & "[" & ANSI_11 & $targetplayer & ANSI_14 & "] "
Return
:ECHOFLAG
KillAllTriggers
Echo ANSI_15 & "IN PURSUIT - " & ANSI_12 & "TARGET: " & ANSI_14 & "[" & ANSI_11 & $targetplayer & ANSI_14 & "] "
Goto :START
:FINISH
Gosub :Z_Lib~COMMSON
Sound ding
Halt
:CONNECTIONLOST
Halt
# GETSTATS
:GETSTATS
Gosub :PlayerInfo~InfoQuick
SetVar $current_sector $PlayerInfo~Sector
SetVar $credits $PlayerInfo~Credits
SetVar $figs $PlayerInfo~Fighters
SetVar $mines $PlayerInfo~Mines
SetVar $limps $PlayerInfo~Limpets
SetVar $shields $PlayerInfo~Shields
SetVar $holds $PlayerInfo~Holds
SetVar $ore $PlayerInfo~Ore
SetVar $org $PlayerInfo~Org
SetVar $equ $PlayerInfo~Equip
SetVar $colonists $PlayerInfo~Colonists
SetVar $scanner $PlayerInfo~Scanner
SetVar $twarp $PlayerInfo~TWarp
SetVar $turns $PlayerInfo~Turns
SetVar $photons $PlayerInfo~Photons
SetVar $torps $PlayerInfo~GenTorps
SetVar $cloaks $PlayerInfo~Cloaks
SetVar $beacons $PlayerInfo~Beacons
SetVar $dets $PlayerInfo~Dets
SetVar $corbo $PlayerInfo~Corbo
SetVar $probes $PlayerInfo~Probes
SetVar $disruptors $PlayerInfo~Disruptors
SetVar $psiprobe $PlayerInfo~PsiProbe
SetVar $planetscanner $PlayerInfo~PlanetScanner
SetVar $align $PlayerInfo~Align
SetVar $experience $PlayerInfo~Experience
SetVar $corp $PlayerInfo~Corp
SetVar $shipid $PlayerInfo~Ship
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
# INCLUDES
Include include\Z_Auth.ts
Include include\Z_Lib.ts
Include include\Z_Strings.ts
Include include\Z_GetPlayers.ts
Include include\Z_Move.ts
Include include\PlayerInfo.ts
# ZeD Compiled: Tue 11/01/2011 -  7:21:04.42 
# ZeD Compiled: Sun 23/01/2011 - 15:59:23.09 
# ZeD Compiled: Wed 02/02/2011 -  6:39:22.33 
# ZeD Compiled: Thu 03/02/2011 -  2:08:41.91 
# ZeD Compiled: Sun 20/02/2011 -  2:05:29.78 
# ZeD Compiled: Tue 07/06/2011 -  5:57:10.09 
# ZeD Compiled: Sun 24/07/2011 - 10:49:47.84 
# ZeD Compiled: Wed 27/07/2011 - 15:53:00.26 
# ZeD Compiled: Tue 13/11/2012 -  8:48:29.75 
# ZeD Compiled: Tue 06/08/2013 - 12:30:58.08 
# ZeD Compiled: Tue 06/08/2013 - 13:19:51.05 
# ZeD Compiled: Sat 07/09/2013 -  7:17:10.30 
# ZeD Compiled: Sun 01/12/2013 -  2:26:58.65 
