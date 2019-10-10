ReqRecording
# Title: Z-Grid
# Author: Zed
# Copyright (c) 2010 by Archibald H. Vilanos III
# All Rights Reserved.
# Unstoppable Gridder
SetVar $version "1.22" & #225 & "c"
SetVar $scriptname "Z-Grid"
SetVar $scripttitle "Zed's Unstoppable Gridder"
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
SetVar $minturns "50"
Gosub :LOADPARMS
LoadVar $z_botname
LoadVar $z_safesector
If ($z_botname = "0") or ($z_botname = "")
	LoadVar $bot_name
	SetVar $z_botname $bot_name
End
SetVar $botted FALSE
SetVar $herald FALSE
SetVar $safemode FALSE
SetVar $norefresh FALSE
Gosub :PROCESSPARMS
Gosub :CLEARPARMS
SetVar $Z_Lib~setprompt "COMMAND"
SetVar $Z_Lib~heraldss TRUE
Gosub :Z_Lib~PROMPT
If ($Z_Lib~prompt <> "Command")
   Goto :FINISH
End
Gosub :Z_Lib~CN9CHECK
# Make sure TWarp is on.
Send "c u y q"
Waitfor "] (?=Help)? :"
#------------------------
GoSub :Z_Lib~COMMSOFF
Gosub :Z_Lib~SYNC
Gosub :Z_Lib~HEADER
Echo  "*"
If ($botted = FALSE)
	Echo "**" & ANSI_15 & "Herald figged sectors over SS for FIGSEC? (Y/N)"
	Echo "**" & ANSI_12 & "Default of NO will be presumed in 8 seconds.."
	Echo "*"
	SetTextOutTrigger noss1 :NOSS "N"
	SetTextOutTrigger noss2 :NOSS "n"
	SetTextOutTrigger noss3 :NOSS #13
	SetDelayTrigger noss4 :NOSS 8000
	SetTextOutTrigger yesss1 :YESSS "y"
	SetTextOutTrigger yesss2 :YESSS "Y"
	Pause
:YESSS
	KillAllTriggers
	SetVar $herald TRUE
:NOSS
	KillAllTriggers
	Echo "**" & ANSI_15 & "Use EXTRA SAFE MODE? (Y/N)"
	Echo "**" & ANSI_12 & "Default of NO will be presumed in 8 seconds.."
	Echo "*"
	SetTextOutTrigger noss1 :NOSAFE "N"
	SetTextOutTrigger noss2 :NOSAFE "n"
	SetTextOutTrigger noss3 :NOSAFE #13
	SetDelayTrigger noss4 :NOSAFE 8000
	SetTextOutTrigger yesss1 :YESSAFE "y"
	SetTextOutTrigger yesss2 :YESSAFE "Y"
	Pause
:YESSAFE
	KillAllTriggers
	SetVar $safemode TRUE
:NOSAFE
	KillAllTriggers
	Echo "**" & ANSI_15 & "Refresh FIGSEC, MINESEC and LIMPSEC DB Parameters? (Y/N)"
	Echo "**" & ANSI_12 & "Default of YES will be presumed in 8 seconds.."
	Echo "*"
	SetTextOutTrigger noss1 :NOREFRESH "N"
	SetTextOutTrigger noss2 :NOREFRESH "n"
	SetTextOutTrigger noss3 :YESREFRESH #13
	SetDelayTrigger yesss4 :YESREFRESH 8000
	SetTextOutTrigger yesss1 :YESREFRESH "y"
	SetTextOutTrigger yesss2 :YESREFRESH "Y"
	Pause
:YESREFRESH
	KillAllTriggers
	SetVar $norefresh FALSE
	Goto :AFTERREFRESH
:NOREFRESH
	KillAllTriggers
	SetVar $norefresh TRUE
End
:AFTERREFRESH
If ($norefresh = FALSE)
	Gosub :REFRESH
End
SetVar $count "1"
SetVar $figcount "0"
If ($safemode = TRUE)
	GetSectorparameter 2 "LIMP_COUNT" $limpcount
	GetSectorparameter 2 "MINE_COUNT" $minecount
	If ($limpcount = "") or ($minecount = "")
		Echo ANSI_12 & "**You need to update your sector parameters... Exiting.**"
		Send "'We need to update my sector parameters... Exiting.**"
		Goto :FINISH
	End
	If ($limpcount < 50) or ($minecount < 50)
		Echo ANSI_12 & "**You need at least 50 sectors with limps and mines... Exiting.**"
		Send "'You need at least 50 sectors with limps and mines... Exiting.**"
		Goto :FINISH
	End
End
While ($count <= SECTORS) and ($figcount <= 200)
   GetSectorParameter $count "FIGSEC" $figged
   If ($figged <> "")
	   SetVar $figcount ($figcount + $figged)
   End
   SetVar $count ($count + 1)
End
If ($figcount < "200")
   Echo ANSI_12 & "**You need an existing Grid of at least 200 (preferably more)... Exiting.**"
   Send "'You need an existing Grid of at least 200 (preferably more)... Exiting.**"
   Goto :FINISH
End
Gosub :GETSTATS
If ($scanner <> "2")
   Echo ANSI_12 & "**You need a holo-scanner... Exiting.**"
   Send "'You need a holo-scanner... Exiting.**"
   Goto :FINISH
End
If ($twarp = "0")
   Echo ANSI_12 & "**You need a Transwarp Drive... Exiting.**"
   Send "'You need a Transwarp Drive... Exiting.**"
   Goto :FINISH
End
If ($safemode = TRUE)
	If ($credits < 10000000)
	   Echo ANSI_12 & "**You need at least 10,000,000 credits... You have " & $credits & ". Exiting.**"
	   Send "'You need at least 10,000,000 credits... You have " & $credits & ". Exiting.**"
	   Goto :FINISH
	End
Else
	If ($credits < 50000)
	   Echo ANSI_12 & "**You need at least 100,000 credits... You have " & $credits & ". Exiting.**"
	   Send "'You need at least 100,000 credits... You have " & $credits & ". Exiting.**"
	   Goto :FINISH
	End
End
If ($figs < 1000)
   Echo ANSI_12 & "**You need at least 1,000 fighters... You have " & $figs & ". Exiting.**"
   Send "'You need at least 1,000 fighters... You have " & $figs & ". Exiting.**"
   Goto :FINISH
End
If ($ore < $holds)
	If (PORT.EXISTS[CURRENTSECTOR] = TRUE) and (PORT.BUYFUEL[CURRENTSECTOR] = FALSE) and (PORT.CLASS[CURRENTSECTOR] <> "0")
		Send "p * * * * "
		Gosub :GETSTATS
	End
	If ($ore < $holds)
	   Echo ANSI_12 & "**You need full cargo holds of ore... You have " & $ore & ". Exiting.**"
	   Send "'You need full cargo holds of ore... You have " & $ore & ". Exiting.**"
	   Goto :FINISH
   End
End
SetVar $Z_Lib~isunlimited FALSE
Gosub :Z_Lib~ISITUNLIMITED
Send "*"
WaitFor "] ("
If ($Z_Lib~isunlimited = FALSE)
	If ($turns < $minturns)
		Echo ANSI_12 & "**You don't have enough turns left!. Exiting.**"
		Send "'You don't have enough turns left!. Exiting.**"
		Goto :FINISH
	End
End
Send "'Z-Grid is preparing for universal domination!*"
WaitFor "Message sent on sub-space channel"
Gosub :Z_Lib~HEADER
Echo  "*"
Echo ANSI_11 & "Preparing...*"
SetArray $edge 0
SetVar $edgepointer "0"
SetVar $sect "11"
If ($safemode = TRUE)
	While ($sect <= SECTORS)
		SetVar $figged FALSE
		SetVar $mined FALSE
		SetVar $limped FALSE
		GetSectorParameter $sect "FIGSEC" $figged
		GetSectorParameter $sect "MINESEC" $mined
		GetSectorParameter $sect "LIMPSEC" $limped
		If ($figged = TRUE) and ($mined = TRUE) and ($limped = TRUE)
			SetVar $testedgesector $sect
			Gosub :CHECKEDGESECTOR
		End
		SetVar $sect ($sect + 1)
	End
Else
	While ($sect <= SECTORS)
		SetVar $figged FALSE
		GetSectorParameter $sect "FIGSEC" $figged
		If ($figged = TRUE)
			SetVar $testedgesector $sect
			Gosub :CHECKEDGESECTOR
		End
		SetVar $sect ($sect + 1)
	End
End
SetVar $altlist FALSE
SetVar $firstrun TRUE
SetVar $basecount $edgepointer
SetVar $home CURRENTSECTOR
SetVar $outoffuel FALSE
SetVar $figgedcount "0"
SetVar $attacks "0"
Window zgridprogress 267 130 "Z-Grid Progress" [ONTOP]
Send "'ZeD's Unstoppable Gridder is Powering up !*"
Gosub :Z_Lib~SYNC
GoSub :Z_Lib~COMMSON
# === START ===
:START
If ($safemode = TRUE)
	SetWindowContents zgridprogress "* Sectors Figged  : " & $figgedcount & "* Sectors Cleared : " & $attacks & "* Jump Sector List: " & $basecount & "*-------------------------------" & "*       Gridding Safemode       *"
Else
	SetWindowContents zgridprogress "* Sectors Figged  : " & $figgedcount & "* Sectors Cleared : " & $attacks & "* Jump Sector List: " & $basecount & "*-------------------------------" & "*       Gridding Normally *"
End
Gosub :NEXTSECTOR
Send "*"
Waitfor "] (?=Help)? :"
If ($firstrun = TRUE)
	SetVar $firstrun FALSE
Else
	SetVar $count "1"
	SetVar $basecount "0"
	If ($altlist = TRUE)
		While ($count <= $edgepointer)
			If (($edge2[$count] <> "0") and ($edge2[$count] <> $removesector))
				SetVar $basecount ($basecount + 1)
				SetVar $edge[$basecount] $edge2[$count]
			End
			SetVar $count ($count + 1)
		End
		SetVar $altlist FALSE
		SetArray $edge2 0
	Else
		While ($count <= $edgepointer)
			If (($edge[$count] <> "0") and ($edge[$count] <> $removesector))
				SetVar $basecount ($basecount + 1)
				SetVar $edge2[$basecount] $edge[$count]
			End
			SetVar $count ($count + 1)
		End
		SetVar $altlist TRUE
		SetArray $edge 0
	End
	SetVar $edgepointer $basecount
End
Gosub :GETSTATS
If ($Z_Lib~isunlimited = FALSE)
	If ($turns <= $minturns)
		If ($z_safesector > 0) and ($z_safesector <= SECTORS)
			SetVar $nextsector $z_safesector
			Gosub :TWARPNEXT
			If ($nextsector <> CURRENTSECTOR)
				If ($outoffuel = TRUE)
				   Gosub :FINDFUEL
				   Gosub :TWARPNEXT
				End
			End
		End
		Echo ANSI_12 & "*Low on turns! " & $turns & " turns left. Exiting...*"
		Send "'Low on turns! " & $turns & " turns left. Exiting...*"
		Goto :FINISH
	End
End
If ($credits <= 5000)
	If ($z_safesector > 0) and ($z_safesector <= SECTORS)
		SetVar $nextsector $z_safesector
		Gosub :TWARPNEXT
		If ($nextsector <> CURRENTSECTOR)
			If ($outoffuel = TRUE)
			   Gosub :FINDFUEL
			   Gosub :TWARPNEXT
			End
		End
	End
	Echo ANSI_12 & "*Low on cash! " & $credits & " credits left. Exiting...*"
	Send "'Low on cash! " & $credits & " credits left. Exiting...*"
	Goto :FINISH
End
If ($figs <= 100)
	If ($z_safesector > 0) and ($z_safesector <= SECTORS)
		SetVar $nextsector $z_safesector
		Gosub :TWARPNEXT
		If ($nextsector <> CURRENTSECTOR)
			If ($outoffuel = TRUE)
			   Gosub :FINDFUEL
			   Gosub :TWARPNEXT
			End
		End
	End
	Echo ANSI_12 & "*Low on figs! " & $figs & " fighters left. Exiting...*"
	Send "'Low on figs! " & $figs & " fighters left. Exiting...*"
	Goto :FINISH
End
If (($safemode = TRUE) and (($mines < 20) or ($limps < 20)))
	If ($credits <= 3000000)
		If ($z_safesector > 0) and ($z_safesector <= SECTORS)
			SetVar $nextsector $z_safesector
			Gosub :TWARPNEXT
			If ($nextsector <> CURRENTSECTOR)
				If ($outoffuel = TRUE)
				   Gosub :FINDFUEL
				   Gosub :TWARPNEXT
				End
			End
		End
		Echo ANSI_12 & "*Low on cash! " & $credits & " credits left. Exiting...*"
		Send "'Low on cash! " & $credits & " credits left. Exiting...*"
		Goto :FINISH
	End
	Gosub :REFURB
	Gosub :GETSTATS
	If ($mines < 20) or ($limps < 20)
		If ($outoffuel = TRUE)
			Gosub :FINDFUEL
			Gosub :REFURB
			Gosub :GETSTATS
			If ($mines < 20) or ($limps < 20)
				Echo ANSI_12 & "*Something went wrong with the refurb. Exiting...*"
				Send "'Something went wrong with the refurb. Exiting...*"
				Goto :FINISH
			End
		Else
			Echo ANSI_12 & "*Something went wrong with the refurb. Exiting...*"
			Send "'Something went wrong with the refurb. Exiting...*"
			Goto :FINISH
		End
	End
End
If ($nextsector <> CURRENTSECTOR)
	If ($outoffuel = TRUE)
	   Gosub :FINDFUEL
	   If ($gotfuel <> TRUE)
			Echo ANSI_12 & "*Out of fuel !!! Exiting...*"
			Send "'Out of fuel !!! Exiting...*"
			Goto :FINISH
		End
	End
	Goto :START
End
SetVar $thissector CURRENTSECTOR
GetSectorParameter $thissector "BUSTED" $busted
SetVar $keeponlist FALSE
SetVar $gotfuel FALSE
If (PORT.EXISTS[$thissector] = TRUE)
   If (PORT.BUYFUEL[$thissector] = FALSE)  and (PORT.CLASS[$thissector] <> "0")
      If ($busted <> TRUE)
        Send "p * * * z 0* z 0* "
        Gosub :GETSTATS
        If ($ore = $holds)
           SetVar $gotfuel TRUE
        End
      End
   End
End
Send "shsd"
WaitFor "Long Range Scan"
WaitFor "Long Range Scan"
WaitFor "] (?=Help)? :"
SetVar $redalert FALSE
SetVar $count "1"
While ($count <= SECTOR.WARPCOUNT[$thissector])
	SetVar $thatsector SECTOR.WARPS[$thissector][$count]
	If (SECTOR.TRADERCOUNT[$thatsector] > 0)
		SetVar $redalert TRUE
	End
	If (SECTOR.PLANETCOUNT[$thatsector] > 0)
		SetVar $redalert TRUE
	End
	SetVar $count ($count + 1)
End
If ($redalert = TRUE)
	Goto :START
End
If ($gotfuel <> TRUE)
    SetVar $count "1"
    While ($count <= SECTOR.WARPCOUNT[$thissector])
		SetVar $thatsector SECTOR.WARPS[$thissector][$count]
		If (PORT.EXISTS[$thatsector] = TRUE) and (PORT.BUYFUEL[$thatsector] = FALSE) and (PORT.CLASS[$thatsector] <> "0")
			SetTextTrigger isbackdoor :ISBD "The shortest path"
			Send "c f " & $thatsector & "*" & $thissector & "*"
			Pause
:ISBD 
			KillTrigger isbackdoor
			GetWord CURRENTLINE $bdcheck 4
			StripText $bdcheck "("
			Send "q"
			WaitOn "<Computer deactivated>"
			If ($bdcheck = "1")
				GetSectorParameter $thatsector "BUSTED" $busted
				Gosub :CHECKSECTORSAFE
				If ($thatsectorsafe = TRUE)
					If (SECTOR.FIGS.QUANTITY[$thatsector] = "0")
						If ($thatsector > 10) and ($thatsector <> STARDOCK)
							If ($Busted <> TRUE)
								If ($safemode = TRUE)
									Send "m" & $thatsector & "*p * * * z 0* z 0* f 1* c d h 1 3* c h 2 3* c < "
									SetSectorParameter $thatsector "MINESEC" TRUE
									SetSectorParameter $thatsector "LIMPSEC" TRUE
								Else
									Send "m" & $thatsector & "*p * * * z 0* z 0* f 1* c d < "
								End
							Else
								If ($safemode = TRUE)
									Send "m" & $thatsector & "*f 1* c d h 1 3* c h 2 3* c < "
									SetSectorParameter $thatsector "MINESEC" TRUE
									SetSectorParameter $thatsector "LIMPSEC" TRUE
								Else
									Send "m" & $thatsector & "*f 1* c d < "
								End								
							End
							SetSectorParameter $thatsector "FIGSEC" TRUE
							If ($herald = TRUE)
								SetVar $heraldsector $thatsector
								Gosub :HERALD
							End
							SetVar $figgedcount ($figgedcount + 1)
							SetVar $edgepointer ($edgepointer + 1)
							If ($altlist = TRUE)
								SetVar $edge2[$edgepointer] $thatsector
							Else
								SetVar $edge[$edgepointer] $thatsector
							End
							Gosub :GETSTATS
							If ($ore = $holds)
								SetVar $gotfuel TRUE
							End
						Else
							If ($Busted <> TRUE)
								Send "m" & $thatsector & "*p * * * z 0* z 0* < "
								Gosub :GETSTATS
								If ($ore = $holds)
									SetVar $gotfuel TRUE
								End
							End
						End
					Else
						GetSectorParameter $thatsector "FIGSEC" $figged
						If ($figged = TRUE) and ($busted <> TRUE)
							Send "m" & $thatsector & "*p * * * z 0* z 0* < "
							Gosub :GETSTATS
							If ($ore = $holds)
								SetVar $gotfuel TRUE
							End
						End
					End
					SetVar $count "7"
				End
			End
		End
		SetVar $count ($count + 1)
    End
End
SetVar $count "1"
SetVar $attacksector "0"
While ($count <= SECTOR.WARPCOUNT[$thissector])
	SetVar $thatsector SECTOR.WARPS[$thissector][$count]
	Gosub :CHECKSECTORSAFE
	If ($thatsectorsafe = TRUE)
		If ($thatsector > 10) and ($thatsector <> STARDOCK)
			SetTextTrigger isbackdoor :ISBD1 "The shortest path"
			Send "c f " & $thatsector & "*" & $thissector & "*"
			Pause
			:ISBD1
			KillTrigger isbackdoor
			GetWord CURRENTLINE $bdcheck 4
			StripText $bdcheck "("
			Send "q"
			WaitOn "<Computer deactivated>"
			If ($bdcheck = "1")
				GetSectorParameter $thatsector "FIGSEC" $figged
				GetSectorParameter $thatsector "MINESEC" $mined
				GetSectorParameter $thatsector "LIMPSEC" $limped
				If ((SECTOR.FIGS.QUANTITY[$thatsector] = "0") and ($figged = FALSE)) or ((($safemode = TRUE) and (SECTOR.FIGS.QUANTITY[$thatsector] = "1") and ($figged = TRUE)) and (($mined = FALSE) or ($limped = FALSE)))
					If ($safemode = TRUE)
						Send "m" & $thatsector & "*f 1* c d h 1 3* c h 2 3* c < "
						SetSectorParameter $thatsector "MINESEC" TRUE
						SetSectorParameter $thatsector "LIMPSEC" TRUE
					Else
						Send "m" & $thatsector & "*f 1* c d <"
					End
					SetSectorParameter $thatsector "FIGSEC" TRUE
					If ($herald = TRUE)
						SetVar $heraldsector $thatsector
						Gosub :HERALD
					End
					SetVar $figgedcount ($figgedcount + 1)
					SetVar $edgepointer ($edgepointer + 1)
					If ($altlist = TRUE)
						SetVar $edge2[$edgepointer] $thatsector
					Else
						SetVar $edge[$edgepointer] $thatsector
					End
				Else
					GetSectorParameter $thatsector "FIGSEC" $figged
					If ($figged = FALSE)
						If (SECTOR.FIGS.QUANTITY[$thatsector] = "1")
							SetVar $attacksector $thatsector
						End
					End
				End
			End
		End
	End
	SetVar $count ($count + 1)
End
If ($attacksector <> "0")
	Gosub :CHECKSECTORSAFE
	If ($thatsectorsafe = TRUE)
		SetVar $thatsector $attacksector
		Send "m" & $thatsector & "*a z 20* < "
		SetVar $attacks ($attacks + 1)
		SetVar $keeponlist TRUE
	End
End
If ($keeponlist = FALSE)
	SetVar $removesector $thissector
Else
	SetVar $removesector "0"
End
Goto :START
:CHECKSECTORSAFE
SetVar $thatsectorsafe TRUE
SetVar $extradensity "0"
If (SECTOR.NAVHAZ[$thatsector] > 1)
	SetVar $thatsectorsafe FALSE
End
If (SECTOR.ANOMOLY[$thatsector] = TRUE)
	If (SECTOR.LIMPETS.OWNER[$thatsector] <> "yours") and (SECTOR.LIMPETS.OWNER[$thatsector] <> "belong to your Corp")
		SetVar $thatsectorsafe FALSE
	Else 
		SetVar $extradensity ($extradensity + (SECTOR.LIMPETS.QUANTITY[$thatsector] * 2))
	End
End
If (SECTOR.MINES.QUANTITY[$thatsector] > 0)
	If (SECTOR.MINES.OWNER[$thatsector] <> "yours") and (SECTOR.MINES.OWNER[$thatsector] <> "belong to your Corp")
		SetVar $thatsectorsafe FALSE
	Else
		SetVar $extradensity ($extradensity + (SECTOR.MINES.QUANTITY[$thatsector] * 10))
	End
End
If ((SECTOR.DENSITY[$thatsector] <> 0) and (SECTOR.DENSITY[$thatsector] <> $extradensity) and (SECTOR.DENSITY[$thatsector] <> 5 + $extradensity) and (SECTOR.DENSITY[$thatsector] <> 100 + $extradensity) and (SECTOR.DENSITY[$thatsector] <> 105 + $extradensity))
	If ((SECTOR.DENSITY[$thatsector] <> 1) and (SECTOR.DENSITY[$thatsector] <> 1 + $extradensity) and (SECTOR.DENSITY[$thatsector] <> 6) and (SECTOR.DENSITY[$thatsector] <> 6 + $extradensity) and (SECTOR.DENSITY[$thatsector] <> 101) and (SECTOR.DENSITY[$thatsector] <> 101 + $extradensity) and (SECTOR.DENSITY[$thatsector] <> 106) and (SECTOR.DENSITY[$thatsector] <> 106 + $extradensity))
		SetVar $thatsectorsafe FALSE
	End
End
Return
# REFURB
:REFURB
SetWindowContents zgridprogress "* Sectors Figged  : " & $figgedcount & "* Sectors Cleared : " & $attacks & "* Jump Sector List: " & $basecount & "*-------------------------------" & "*           Refurbing           *"
If (CURRENTSECTOR = STARDOCK)
   Echo "**" & ANSI_12 & "You are already at STARDOCK...**"
   Return
End
SetVar $returnsector CURRENTSECTOR
GetSectorParameter $returnsector "FIGSEC" $figged
If (STARDOCK = "0")
	If ($prompt = "Command")
		Send "v"
	Else
		Send "q q vlj" & #8 & #8 & $planetnumber & "*c"
	End
	If (STARDOCK = "0")
		Echo "**" & ANSI_12 & "YOU NEED TO FIND STARDOCK!!!.**"
		Return
	End
End
SetTextTrigger noport :NOPORT "I have no information about a port in that sector."
SetTextTrigger portok :PORTOK "Commerce report for"
Send "c r" & STARDOCK & "*q"
Pause
:NOPORT
KillAllTriggers
Echo "**" & ANSI_12 & "STARDOCK SEEMS TO BE MISSING!!!.**"
Return
:PORTOK
KillAllTriggers
If ($align < 1000)
		SetVar $warpsincount SECTOR.WARPINCOUNT[STARDOCK]
		SetVar $count "1"
		SetVar $availablewarps "0"
		While ($count <= $warpsincount)
			SetVar $thiswarp SECTOR.WARPSIN[STARDOCK][$count]
			GetSectorParameter $thiswarp "FIGSEC" $figged
			If ($figged = TRUE)
				SetVar $availablewarps ($availablewarps + 1)
				SetVar $warpsin[$availablewarps] $thiswarp
			End
			SetVar $count ($count + 1)
		End
	If ($availablewarps < 1)
		Echo "**" & ANSI_12 & "NO FIGGED ADJACENTS TO STARDOCK !!!.**"
		Return
	Else
		GetRnd $warp 1 $availablewarps
		SetVar $jumpsector $warpsin[$warp]
	End
Else
	SetVar $jumpsector STARDOCK
End
GetDistance $hops1 $returnsector $jumpsector
If ($hops1 = "-1")
	Goto :NOCOURSE
End
GetDistance $hops2 STARDOCK $returnsector
If ($hops2 = "-1")
	Goto :NOCOURSE
End
SetVar $distance ($hops1 + $hops2)
Goto :GOTCOURSE
:NOCOURSE
SetTextTrigger trip1 :TRIP1 "The shortest path"
Send "c f" & $returnsector & "*" & $jumpsector "*"
Pause
:TRIP1
KillAllTriggers
GetWord CURRENTLINE $hops1 4
StripText $hops1 "("
SetTextTrigger trip2 :TRIP2 "The shortest path"
Send "f" & STARDOCK & "*" & $returnsector & "*q"
Pause
:TRIP2
KillAllTriggers
GetWord CURRENTLINE $hops2 4
StripText $hops2 "("
SetVar $distance ($hops1 + $hops2)
:GOTCOURSE
SetVar $oreneeded ($distance * 3)
If ($ore < $oreneeded)
	If (PORT.EXISTS[CURRENTSECTOR] = TRUE) and (PORT.BUYFUEL[CURRENTSECTOR] = FALSE) and (PORT.CLASS[CURRENTSECTOR] <> "0")
		Send "p * * * * "
		Gosub :GETSTATS
	End
	If ($ore < $oreneeded)
		Echo "**" & ANSI_12 & "You need at least " & $oreneeded & " ore for the return trip!.**"
		SetVar $outoffuel TRUE
		Return
	End
End
SetVar $Z_Lib~isunlimited FALSE
Gosub :Z_Lib~ISITUNLIMITED
Send "*"
WaitFor "] ("
If ($Z_Lib~isunlimited = FALSE)
	SetTextLineTrigger turnsper :TURNSPER "Turns Per Warp:"
	Send "c ;q"
	Pause
:TURNSPER
	KillAllTriggers
	SetVar $line CURRENTLINE
	ReplaceText $line ":" " "
	GetWord $line $turnsperwarp 7
	If ($jumpsector = STARDOCK)
		SetVar $minturns2 ($turnsperwarp * 4)
	Else
		SetVar $minturns2 ($turnsperwarp * 5)
	End
	If ($turns < $minturns2)
		Echo "**" & ANSI_12 & "You don't have enough turns left!. Exiting.**"
		Goto :FINISH
	End
End
SetVar $heretrigger "["& $jumpsector &"] (?="
:TWARP3
KillAllTriggers
SetVar $nothere FALSE
SetTextTrigger trigger61 :USINGTWARP3 "Do you want to engage the TransWarp"
SetTextTrigger trigger63 :WEREHERE3 "Warping to sector"
SetTextTrigger trigger65 :WEREHERE3 $heretrigger
SetTextTrigger trigger66 :AVOIDED3 "DANGER! You have marked sector"
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
Send "f z1* cq* d "
Send "m" & $jumpsector & "*"
Pause
:USINGTWARP3
KillAllTriggers
SetTextTrigger trigger61 :NOFUEL3 "not have enough Fuel Ore"
SetTextTrigger trigger62 :NOBEAM3 "No locating beam found"
SetTextTrigger trigger63 :TWARPOK3 "Locating beam pinpointed"
SetTextTrigger trigger69 :NOROUTE3 "No route within"
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
Send "y"
Pause
:NOROUTE3
KillAllTriggers
Send "*"
Echo "**" & ANSI_12 & "NO ROUTE TO JUMP SECTOR " & $jumpsector & " !!!.**"
Goto :FINISH
:TWARPOK3
KillAllTriggers
SetTextTrigger trigger65 :WEREHERE3 $heretrigger
SetTextTrigger trigger63 :WEREHERE3 "TransWarp Drive Engaged!"
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
Send "y"
Pause
:AVOIDED3
KillAllTriggers
Echo "**" & ANSI_12 & "JUMP SECTOR " & $jumpsector & " AVOIDED !!! Exiting.**"
Send "'JUMP SECTOR " & $jumpsector & " AVOIDED !!! Exiting.**"
Goto :FINISH
:NOBEAM3
KillAllTriggers
Send "n"
SetSectorParameter $jumpsector "FIGSEC" FALSE
Echo "**" & ANSI_12 & "NO FIGHTER IN JUMP SECTOR " & $jumpsector & " !!!.**"
Goto :FINISH
:NOFUEL3
KillAllTriggers
Echo "**" & ANSI_12 & "NOT ENOUGH FUEL TO MAKE THE JUMP !!!.**"
Goto :FINISH
:WEREHERE3
KillAllTriggers
If ($jumpsector = STARDOCK)
	Send "p sg yg q h"
Else
	SetTextTrigger mined :MINED3 "Mined Sector: Do you wish to Avoid this sector in the future?"
	SetTextTrigger clear :CLEAR3 "Command [TL="
	SetDelayTrigger clear2 :CLEAR3 2000
	Send #145
	Pause
:MINED3
	KillAllTriggers
	Send "n"
:CLEAR3
	KillAllTriggers
	Send "m" & STARDOCK & "* p sg yg q h"
End
WaitOn "<Hardware Emporium> So what are you looking for (?)"
	KillAllTriggers
	SetTextTrigger buy :buy1 "How many mines do you want"
	Send "m"
	Pause
:buy1
	KillAllTriggers
	GetText CURRENTLINE $amt "(Max " ")"
	StripText $amt ","
	Send $amt & "*"
	KillAllTriggers
	SetTextTrigger buy :buy2 "How many mines do you want"
	Send "l"
	Pause
:buy2
	KillAllTriggers
	GetText CURRENTLINE $amt "(Max " ")"
	StripText $amt ","
	Send $amt & "*"
Send "qsp"
	KillAllTriggers
	SetTextTrigger buy :buy12 "How many K-3A fighters do you want to buy"
	Send "b"
	Pause
:buy12
	KillAllTriggers
	GetText CURRENTLINE $amt "(Max " ")"
	StripText $amt ","
	Send $amt & "*"
	KillAllTriggers
	SetTextTrigger buy :buy13 "How many shield armor points do you want to buy"
	Send "c"
	Pause
:buy13
	KillAllTriggers
	GetText CURRENTLINE $amt "(Max " ")"
	StripText $amt ","
	Send $amt & "*"
:GOHOME
KillAllTriggers
SetVar $nothere FALSE
SetVar $heretrigger "["& $returnsector &"] (?="
# SetTextTrigger trigger61 :USINGTWARP2 "Do you want to engage the TransWarp"
SetTextTrigger trigger63 :WEREHERE4 "Warping to sector"
SetTextTrigger trigger65 :WEREHERE4 $heretrigger
# SetTextTrigger trigger66 :AVOIDED2 "DANGER! You have marked sector"
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
# Send "qqq * m" & $returnsector & "*"
Send "qqq * m" & $returnsector & "* y y "
Pause
:USINGTWARP4
KillAllTriggers
SetTextTrigger trigger61 :NOFUEL4 "not have enough Fuel Ore"
SetTextTrigger trigger62 :NOBEAM4 "No locating beam found"
SetTextTrigger trigger63 :TWARPOK4 "Locating beam pinpointed"
SetTextTrigger trigger69 :NOROUTE4 "No route within"
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
Send "y"
Pause
:NOROUTE4
KillAllTriggers
Send "*"
Echo "**" & ANSI_12 & "NO ROUTE TO RETURN SECTOR " & $returnsector & " !!!.**"
Goto :FINISH
:TWARPOK4
KillAllTriggers
SetTextTrigger trigger63 :WEREHERE4 "TransWarp Drive Engaged!"
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
Send "y"
Pause
:AVOIDED4
KillAllTriggers
Echo "**" & ANSI_12 & "RETURN SECTOR " & $returnsector & " AVOIDED !!!.**"
Goto :FINISH
:NOBEAM4
KillAllTriggers
Send "n"
SetSectorParameter $returnsector "FIGSEC" FALSE
Echo "**" & ANSI_12 & "NO FIGHTER IN JUMP SECTOR " & $returnsector & " !!!.**"
Goto :FINISH
:NOFUEL4
KillAllTriggers
Echo "**" & ANSI_12 & "NOT ENOUGH FUEL TO MAKE THE JUMP !!!.**"
Goto :FINISH
:WEREHERE4
KillAllTriggers
Send "/"
#Send "@"
#WaitOn "Average Interval Lag:"
Gosub :Z_Lib~SYNC
Echo "**" & ANSI_15 & "We are BACK !!!**"
Send "*"
Return
# FINDFUEL
:FINDFUEL
SetWindowContents zgridprogress "* Sectors Figged  : " & $figgedcount & "* Sectors Cleared : " & $attacks & "* Jump Sector List: " & $basecount & "*-------------------------------" & "*      Searching for Fuel       *"
ECHO "**" & ANSI_12 & "LOOKING FOR FUEL !!! **"
SetVar $gotfuel FALSE
Send "shsd"
#WaitFor "Long Range Scan"
#WaitFor "] (?=Help)? :"
Send "*"
#WaitFor "] (?=Help)? :"
Gosub :GETSTATS
Gosub :Z_Lib~SYNC
SetVar $current $current_sector
GetSectorParameter $current "BUSTED" $busted
If (PORT.EXISTS[$current] = TRUE) and (PORT.BUYFUEL[$current] = FALSE) and (PORT.CLASS[$current] <> "0") and ($busted <> TRUE)
   Send "p * * * z 0* z 0* "
   Gosub :GETSTATS
   If ($ore = $holds)
		SetVar $prefcount 0
		Goto :GOTFUEL
	Else
		If ($org > 0) or ($equ > 0)
			Send "j y "
		End
   End
End



If ($ore >= 6)
	GetNearestWarps $nearwarps $current
	SetVar $i 1
	While ($i <= $nearwarps)
		GetDistance $dist $current $nearwarps[$i]
		If ($dist <= ($ore / 3))
			GetSectorParameter $nearwarps[$i] "BUSTED" $busted
			If (PORT.EXISTS[$nearwarps[$i]] = TRUE) and (PORT.BUYFUEL[$nearwarps[$i]] = FALSE) and (PORT.CLASS[$nearwarps[$i]] <> "0") and ($busted <> TRUE)
				GetSectorParameter $nearwarps[$i] "FIGSEC" $isfigged
				If ($isfigged = TRUE)
					SetVar $nextsector $nearwarps[$i]
					Gosub :TWARPNEXT
					Goto :FINDFUEL
				End
			End
		Else
			SetVar $i $nearwarps
		End
		SetVar $i ($i + 1)
	End
End



SetVar $count "1"
SetVar $okwarps "0"
While ($count <= SECTOR.WARPCOUNT[$current])
	SetVar $thatsector SECTOR.WARPS[$current][$count]
    Gosub :CHECKSECTORSAFE
    If ($thatsectorsafe = TRUE) and ($thatsector <> STARDOCK)
        GetSectorParameter $thatsector "FIGSEC" $figged
        If (SECTOR.FIGS.QUANTITY[$thatsector] = "0") or ($figged = TRUE)
			SetVar $preferred "0"
			If (PORT.EXISTS[$thatsector] = TRUE) and (PORT.BUYFUEL[$thatsector] = FALSE) and (PORT.CLASS[$current] <> "0")
				SetVar $preferred $count
			End
           SetVar $okwarps ($okwarps + 1)
        End
    End
    SetVar $count ($count + 1)
End
If ($okwarps = "0")
   Echo ANSI_12 & "*** I'm STUCK with no fuel !!!***"
   Send "'I'm STUCK with no fuel !!!**"
   Goto :FINISH
End
If ($preferred <> "0") and ($prefcount <= 10)
	SetVar $warp $preferred
	SetVar $prefcount ($prefcount + 1)
Else
	GetRnd $warp 1 SECTOR.WARPCOUNT[$current]
End
SetVar $thatsector SECTOR.WARPS[$current][$warp]
GetSectorParameter $thatsector "FIGSEC" $figged
Gosub :CHECKSECTORSAFE
If ($thatsectorsafe <> TRUE)
	Goto :FINDFUEL
End
If (SECTOR.FIGS.QUANTITY[$thatsector] <> "0") and ($figged <> TRUE)
   Goto :FINDFUEL
End
If ($thatsector = STARDOCK)
	Goto :FINDFUEL
End
Send "m" & $thatsector & "*"
If ($figged <> TRUE) & ($thatsector > 10)
    If ($safemode = TRUE)
		Send "m" & $thatsector & "*f 1* c d h 1 3* c h 2 3* c <"
		SetSectorParameter $thatsector "MINESEC" TRUE
		SetSectorParameter $thatsector "LIMPSEC" TRUE
	Else
		Send "m" & $thatsector & "*f 1* c d < "
	End
    SetSectorParameter $thatsector "FIGSEC" TRUE
    If ($herald = TRUE)
		SetVar $heraldsector $thatsector
		Gosub :HERALD
	End
    SetVar $figgedcount ($figgedcount + 1)
	SetVar $edgepointer ($edgepointer + 1)
	If ($altlist = TRUE)
		SetVar $edge2[$edgepointer] $thatsector
	Else
		SetVar $edge[$edgepointer] $thatsector
	End
End
Goto :FINDFUEL
:GOTFUEL
SetVar $gotfuel TRUE
Return
# NEXTSECTOR
:NEXTSECTOR
GetRnd $nextedgesector 1 $edgepointer
If ($altlist = TRUE)
	SetVar $thatsector $edge2[$nextedgesector]
	Gosub :CHECKSECTORSAFE
	If ($edge2[$nextedgesector] = "0") or ($edge2[$nextedgesector] = STARDOCK) or ($thatsectorsafe = FALSE)
	   Goto :NEXTSECTOR
	End
	If ($safemode= TRUE)
		GetSectorParameter $thatsector "FIGSEC" $figged
		GetSectorParameter $thatsector "MINESEC" $mined
		GetSectorParameter $thatsector "LIMPSEC" $limped
		If ($figged = FALSE) or ($mined = FALSE) or ($limped = FALSE)
			Goto :NEXTSECTOR
		End
	End
Else
	SetVar $thatsector $edge[$nextedgesector]
	Gosub :CHECKSECTORSAFE
	If ($edge[$nextedgesector] = "0") or ($edge[$nextedgesector] = STARDOCK) or ($thatsectorsafe = FALSE)
	   Goto :NEXTSECTOR
	End
	If ($safemode= TRUE)
		GetSectorParameter $thatsector "FIGSEC" $figged
		GetSectorParameter $thatsector "MINESEC" $mined
		GetSectorParameter $thatsector "LIMPSEC" $limped
		If ($figged = FALSE) or ($mined = FALSE) or ($limped = FALSE)
			Goto :NEXTSECTOR
		End
	End
End
# Check for nextdoor
SetVar $nextdoor FALSE
SetVar $thissector CURRENTSECTOR 
SetVar $count "1"
While ($count <= SECTOR.WARPCOUNT[$thissector]
	If ($altlist = TRUE)
		If ($edge2[$nextedgesector] = SECTOR.WARPS[$thissector][$count]
			SetVar $nextdoor TRUE
		End
	Else
		If ($edge[$nextedgesector] = SECTOR.WARPS[$thissector][$count]
			SetVar $nextdoor TRUE
		End
	End
   SetVar $count ($count + 1)
End
If ($nextdoor = TRUE)
   Goto :NEXTSECTOR
End
#-------------------------
If ($altlist = TRUE)
	GetSectorParameter $edge2[$nextedgesector] "FIGSEC" $figged
	If ($figged <> TRUE)
		SetVar $edge2[$nextedgesector] "0"
		Goto :NEXTSECTOR
	End
	SetVar $nextsector $edge2[$nextedgesector]
Else
	GetSectorParameter $edge[$nextedgesector] "FIGSEC" $figged
	If ($figged <> TRUE)
		SetVar $edge[$nextedgesector] "0"
		Goto :NEXTSECTOR
	End
	SetVar $nextsector $edge[$nextedgesector]
End
Gosub :TWARPNEXT
If ($nothere = TRUE)
   Goto :NEXTSECTOR
End
Return
:TWARPNEXT
KillAllTriggers
SetVar $nothere FALSE
SetVar $heretrigger "["& $nextsector &"] (?="
SetTextTrigger trigger61 :USINGTWARP "Do you want to engage the TransWarp"
SetTextTrigger trigger63 :WEREHERE "Warping to sector"
SetTextTrigger trigger65 :WEREHERE $heretrigger
SetTextTrigger trigger66 :AVOIDED "DANGER! You have marked sector"
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
Send "m" & $nextsector & "*"
Pause
:USINGTWARP
KillAllTriggers
SetTextTrigger trigger61 :NOFUEL "not have enough Fuel Ore"
SetTextTrigger trigger62 :NOBEAM "No locating beam found"
SetTextTrigger trigger63 :TWARPOK "Locating beam pinpointed"
SetTextTrigger trigger69 :NOROUTE "No route within"
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
Send "y"
Pause
:NOROUTE
KillAllTriggers
Send "*"
SetVar $nothere TRUE
Goto :WEREHERE
:TWARPOK
KillAllTriggers
SetTextTrigger trigger63 :WEREHERE "TransWarp Drive Engaged!"
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
Send "y"
Pause
:AVOIDED
SetVar $nothere TRUE
Goto :WEREHERE
:NOBEAM
KillAllTriggers
Send "n"
SetSectorParameter $nextsector "FIGSEC" FALSE
If ($altlist = TRUE)
	SetVar $edge2[$nextedgesector] "0"
Else
	SetVar $edge[$nextedgesector] "0"
End
SetVar $nothere TRUE
Goto :WEREHERE
:NOFUEL
SetVar $outoffuel TRUE
Goto :WEREHERE
:WEREHERE
KillAllTriggers
SetTextTrigger mined :MINED "Mined Sector: Do you wish to Avoid this sector in the future?"
SetTextTrigger clear :CLEAR "Command [TL="
SetDelayTrigger clear2 :CLEAR 2000
Send #145
Pause
:MINED
KillAllTriggers
SetVar $nothere TRUE
If ($altlist = TRUE)
	SetVar $edge2[$nextedgesector] "0"
Else
	SetVar $edge[$nextedgesector] "0"
End
Send "n"
:CLEAR
KillAllTriggers
Return
:CONNECTIONLOST
Halt
# CHECKEDGESECTOR
:CHECKEDGESECTOR
SetVar $edgecount "1"
If ($safemode = TRUE)
	While ($edgecount <= SECTOR.WARPCOUNT[$testedgesector])
		SetVar $current SECTOR.WARPS[$testedgesector][$edgecount]
		If ($current <> "0")
			SetVar $isitfigged FALSE
			SetVar $isitmined FALSE
			SetVar $isitlimped FALSE
			GetSectorParameter $current "FIGSEC" $isitfigged
			GetSectorParameter $current "MINESEC" $isitmined
			GetSectorParameter $current "LIMPSEC" $isitlimped
			If ($isitfigged = FALSE) or ($isitmined = FALSE) or ($isitlimped = FALSE)
				SetVar $edgepointer ($edgepointer + 1)
				SetVar $edge[$edgepointer] $testedgesector
				SetVar $edgecount "7"
			End
		End
		SetVar $edgecount ($edgecount + 1)
	End
Else
	While ($edgecount <= SECTOR.WARPCOUNT[$testedgesector])
		SetVar $current SECTOR.WARPS[$testedgesector][$edgecount]
		If ($current <> "0")
			SetVar $isitfigged FALSE
			GetSectorParameter $current "FIGSEC" $isitfigged
			If ($isitfigged = FALSE)
				SetVar $edgepointer ($edgepointer + 1)
				SetVar $edge[$edgepointer] $testedgesector
				SetVar $edgecount "7"
			End
		End
		SetVar $edgecount ($edgecount + 1)
	End
End
Return
# GETSTATS
:GETSTATS
Gosub :PlayerInfo~InfoQuick
SetVar $current_sector $PlayerInfo~Sector
SetVar $ore $PlayerInfo~Ore
SetVar $org $PlayerInfo~Org
SetVar $equ $PlayerInfo~Equip
SetVar $credits $PlayerInfo~Credits
SetVar $figs $PlayerInfo~Fighters
SetVar $holds $PlayerInfo~Holds
SetVar $scanner $PlayerInfo~Scanner
SetVar $twarp $PlayerInfo~TWarp
SetVar $turns $PlayerInfo~Turns
SetVar $mines $PlayerInfo~Mines
SetVar $limps $PlayerInfo~Limpets
SetVar $align $PlayerInfo~Align
Return
:FINISH
#Sound ding
Gosub :CLEARPARMS
Halt
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
Return
:HELP
SetVar $commandd $COMMAND
LowerCase $commandd
Send "'*"
Send "---------------------------------------------------------------------*"
Send "Zed's Unstoppable Gridder v" & $version & " Help*"
Send "--------------------------------------*"
Send "Twarp Gridder Script.*"
Send "-*"
Send "Usage: {" & $z_botname & "} " & $commandd & " [MIN TURNS] [HERALD] [SAFE] [NOREFRESH]*"
Send "-*"
Send "          MIN TURNS - The script will stop at this number of turns.*"
Send "                      Default is 50. Must be first Parameter.*"
Send "             HERALD - Send figged sector data over SS for*"
Send "                      FIGSEC parameter update.*"
Send "               SAFE - Use Safe Mode. Only Twarp to sectors where you*"
Send "                      have mines and limpets and drop mines and*"
Send "                      limpets as you go (refurbs at Stardock).*"
Send "          NOREFRESH - Does not do a Fig, Mine and Limp Refresh*"
Send "                      before starting.*"
Send "-*"
Send "Notes:    You must have full holds of Fuel Ore.*"
Send "          You must start at the Command Prompt.*"
Send "          You need a Twarp Drive.*"
Send "          You need a Holographic Scanner.*"
Send "          You need at least 100,000 credits (10 mil in SAFE MODE).*"
Send "          You need an existing grid of at least 200.*"
Send "          You need at least 1,000 fighters.*"
Send "-*"
Send "Run this script from the COMMAND prompt.*"
Send "---------------------------------------------------------------------*"
Send "** "
Return
:HERALD
If ($heraldsector <> "")
	Send "'FIGSEC_TRUE ADD Sector " & $heraldsector & " now!*"
	SetVar $heraldsector ""
End
Return
:PROCESSPARMS
UpperCase $PARM1
UpperCase $COMMAND
UpperCase $USER_COMMAND_LINE
If ($PARM1 <> "0") and ($PARM1 <> "") and (($COMMAND = "ZGRID") or ($COMMAND = "GRID") or ($kbot = TRUE))
	SetVar $botted TRUE
	If ($PARM1 = "?") or ($PARM1 = "HELP")
		Gosub :HELP
		Goto :FINISH
	Else
		IsNumber $isnum $PARM1
		If ($isnum = TRUE)
			SetVar $minturns $PARM1
		End
		GetWordPos $USER_COMMAND_LINE $pos1 "HERALD"
		If ($pos1 > 0)
			SetVar $herald TRUE
		End
		GetWordPos $USER_COMMAND_LINE $pos1 "SAFE"
		If ($pos1 > 0)
			SetVar $safemode TRUE
		End
		GetWordPos $USER_COMMAND_LINE $pos1 "NOREFRESH"
		If ($pos1 > 0)
			SetVar $norefresh TRUE
		End
	End
End
Return
# Fig, Mine and Limp Refresh
:REFRESH
SetVar $count "1"
While ($count <= SECTORS)
    SetSectorParameter $count "FIGSEC" FALSE
    SetVar $count ($count + 1)
End
SetVar $trigger2u "Deployed  Fighter  Scan"
:MONITOR
Gosub :Z_Lib~ANSI_OFF
SetTextLineTrigger 2u :FIGS $trigger2u
Send "g"
Pause
:FIGS
KillAllTriggers
SetTextLineTrigger figscan1 :STARTFIGSCAN "===================="
SetTextLineTrigger figsnone :ENDFIGSCAN "No fighters deployed"
SetTextLineTrigger figscan2 :ENDFIGSCAN "Total"
Pause
:STARTFIGSCAN
KillAllTriggers
SetTextLineTrigger figscan3 :SCANLINE
Pause
:SCANLINE
KillAllTriggers
GetWordPos CURRENTLINE $pos "Total"
GetWordPos CURRENTLINE $pos2 "No fighters deployed"
If ($pos > 0) or ($pos2 > 0)
   Goto :ENDFIGSCAN
Else
   GetWord CURRENTLINE $sectnum 1
   IsNumber $isnum $sectnum
   If ($isnum = TRUE)
      SetSectorParameter $sectnum "FIGSEC" TRUE
      SetVar $z_figcount ($z_figcount + 1)
   End
End
Goto :STARTFIGSCAN
:ENDFIGSCAN
KillAllTriggers
SetSectorParameter 2 "FIG_COUNT" $z_figcount
SetVar $z_lastfigrefresh (DATE & " - " & TIME)
SaveVar $z_lastfigrefresh


SetVar $count "1"
While ($count <= SECTORS)
    SetSectorParameter $count "MINESEC" FALSE
    SetVar $count ($count + 1)
End
SetVar $trigger2u "Deployed  Mine  Scan"
:MONITOR2
SetTextLineTrigger 2u :MINES $trigger2u
Send "k1"
Pause
:MINES
KillAllTriggers
SetTextLineTrigger minescan1 :STARTMINESCAN "===================="
SetTextLineTrigger minenone :ENDMINESCAN "No mines deployed"
SetTextLineTrigger minescan2 :ENDMINESCAN "Total"
Pause
:STARTMINESCAN
KillAllTriggers
SetTextLineTrigger minescan3 :SCANLINE2
Pause
:SCANLINE2
KillAllTriggers
GetWordPos CURRENTLINE $pos "Total"
GetWordPos CURRENTLINE $pos2 "No mines deployed"
If ($pos > 0) or ($pos2 > 0)
   Goto :ENDMINESCAN
Else
   GetWord CURRENTLINE $sectnum 1
   IsNumber $isnum $sectnum
   If ($isnum = TRUE)
      SetSectorParameter $sectnum "MINESEC" TRUE
      SetVar $z_minecount ($z_minecount + 1)
   End
End
Goto :STARTMINESCAN
:ENDMINESCAN
KillAllTriggers
SetSectorParameter 2 "MINE_COUNT" $z_minecount
SetVar $z_lastminerefresh (DATE & " - " & TIME)
SaveVar $z_lastminerefresh


SetVar $count "1"
While ($count <= SECTORS)
    SetSectorParameter $count "LIMPSEC" FALSE
    SetVar $count ($count + 1)
End
SetVar $trigger2u "Deployed  Limpet  Scan"
:MONITOR3
SetTextLineTrigger 2u :LIMPS $trigger2u
Send "k2"
Pause
:LIMPS
KillAllTriggers
SetTextLineTrigger limpscan1 :STARTLIMPSCAN "===================="
SetTextLineTrigger limpnone :ENDLIMPSCAN "No Limpet mines deployed"
SetTextLineTrigger limpscan2 :ENDLIMPSCAN "Total"
Pause
:STARTLIMPSCAN
KillAllTriggers
SetTextLineTrigger limpscan3 :SCANLINE3
Pause
:SCANLINE3
KillAllTriggers
GetWordPos CURRENTLINE $pos "Total"
GetWordPos CURRENTLINE $pos2 "No Limpet mines deployed"
If ($pos > 0) or ($pos2 > 0)
   Goto :ENDLIMPSCAN
Else
   GetWord CURRENTLINE $sectnum 1
   IsNumber $isnum $sectnum
   If ($isnum = TRUE)
      SetSectorParameter $sectnum "LIMPSEC" TRUE
      SetVar $z_limpcount ($z_limpcount + 1)
   End
End
Goto :STARTLIMPSCAN
:ENDLIMPSCAN
KillAllTriggers
Gosub :Z_Lib~ANSI_ON
Waitfor "] (?=Help)? :"
SetSectorParameter 2 "LIMP_COUNT" $z_limpcount
SetVar $z_lastlimprefresh (DATE & " - " & TIME)
SaveVar $z_lastlimprefresh
Return
# Includes
Include include\PlayerInfo.ts
Include include\Z_Auth.ts
Include include\Z_Lib.ts
# ZeD Compiled: Sun 09/01/2011 - 17:47:36.84 
# ZeD Compiled: Wed 02/02/2011 - 20:40:34.09 
# ZeD Compiled: Thu 03/02/2011 -  1:55:37.49 
# ZeD Compiled: Thu 03/02/2011 -  1:56:01.79 
# ZeD Compiled: Tue 22/02/2011 -  3:46:01.98 
# ZeD Compiled: Tue 22/02/2011 -  5:23:37.07 
# ZeD Compiled: Tue 22/02/2011 - 10:45:44.44 
# ZeD Compiled: Sat 16/04/2011 - 21:46:53.73 
# ZeD Compiled: Tue 07/06/2011 -  5:59:24.35 
# ZeD Compiled: Wed 27/07/2011 - 15:48:59.02 
# ZeD Compiled: Fri 09/11/2012 -  6:24:06.93 
# ZeD Compiled: Tue 06/08/2013 - 12:29:52.51 
# ZeD Compiled: Wed 07/08/2013 -  4:48:52.44 
# ZeD Compiled: Wed 07/08/2013 -  5:40:55.07 
# ZeD Compiled: Fri 09/08/2013 - 23:16:02.10 
# ZeD Compiled: Sat 07/09/2013 -  7:16:58.79 
# ZeD Compiled: Sun 03/11/2013 -  0:39:55.38 
# ZeD Compiled: Sun 01/12/2013 -  2:27:22.38 
