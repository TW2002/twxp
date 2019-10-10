# Title: Z-MCIC Primer 
# Author: Zed 
# Copyright (c) 2010 by Archibald H. Vilanos III 
# All Rights Reserved. 
# Sells a little equipment to ports in a list to get the MCICs. 
SetVar $version "1.01" & #225 & "a"
SetVar $creditz "Zed"
SetVar $scriptname "Z-MCICPrimer"
SetVar $scripttitle "Zed's MCIC Primer"
SetVar $Z_Lib~scriptname $scriptname
SetVar $Z_Lib~scripttitle $scripttitle
SetVar $Z_Lib~Version $version
GoSub :Z_Lib~INITLIB
Gosub :Z_Lib~CHECKONCE
# AUTHORISE 
SetVar $authorise FALSE
SetVar $Z_Auth~allowpublic FALSE
If ($authorise <> TRUE)
	Gosub :Z_Auth~CHECK
	SetVar $Z_Lib~license LOGINNAME
End
If ($Z_Auth~k = TRUE)
	SetVar $version ($version & "+")
	SetVar $Z_Lib~Version $version
	GoSub :Z_Lib~INITLIB
	SetVar $Z_Lib~license LOGINNAME
	SetVar $p TRUE
	SetVar $Z_Auth~k ""
End
# End Authorise
Gosub :Z_Lib~SYNC
Gosub :SETANSI
SetVar $Z_Lib~setprompt "PLANET"
Gosub :Z_Lib~PROMPT
SetVar $prompt $Z_Lib~prompt
If ($prompt = "ERROR")
	Echo "***" & ANSI_12 & "Start this script from the PLANET prompt. Exiting...**"
	Goto :FAIL
End
Gosub :Z_Lib~CURRENTPLANET
Send "q jy"
Gosub :Z_Lib~CN9CHECK
Gosub :Z_Lib~ISITUNLIMITED
Gosub :Z_Lib~RETURNTOPLANET
Gosub :Z_Lib~COMMSOFF
Gosub :CONFIG
Gosub :GETSTATS
If ($twarp = 0)
	Echo "***" & ANSI_12 & "You need a T-Warp drive. Exiting...**"
	Goto :FAIL
End
SetVar $outputfileptr 1
SetVar $listfile GAMENAME & "_" & $outputfiles[$outputfileptr]
SetPrecision 2
SetVar $equload (($holds / 2) / 10) 
SetVar $Z_Lib~invalue $equload
Gosub :Z_Lib~INT
SetPrecision 0
SetVar $equload ($Z_Lib~outvalue * 10)
SetVar $listptr 1
:STARTMENU
Fileexists $fileexist $listfile
If ($fileexist = TRUE)
	SetVar $warn ANSI_10 & " <--- OK"
Else
	SetVar $warn ANSI_12 & " <--- File NOT FOUND"
End
Gosub :Z_Lib~HEADER
Echo "*" & ANSI_12 &"-=["& ANSI_14 &"S"& ANSI_12 &"]=- "& ANSI_10 &"Sector List Filename : " & ANSI_15 & $listfile & $warn
If ($outputfileptr = $outputfilecount + 1)
	Echo "*" & ANSI_12 &"-=["& ANSI_14 &"A"& ANSI_12 &"]=- "& ANSI_10 &"Add Sector List File : "
End
Echo "**" & ANSI_11 & "      PLEASE ENSURE YOU HAVE A HAGGLE TRACKER RUNNING !!!"
Gosub :Z_Strings~LINE
Echo "*" & $Z_Strings~line
Echo "*" & $boldred & "-=[" & $boldyellow & "G"& $boldred & "]=- " & $boldcyan & "GO !"
Echo "*" & $boldred & "-=[" & $boldyellow & "Q"& $boldred & "]=- " & $boldcyan & "Quit"
Echo "*"
GetConsoleInput $choice SINGLEKEY
UpperCase $choice
If ($choice = "S")
	SetVar $outputfileptr ($outputfileptr + 1)
	If ($outputfileptr > $outputfilecount + 1)
		SetVar $outputfileptr 1
	End
	If ($outputfileptr <= $outputfilecount)
		SetVar $listfile GAMENAME & "_" & $outputfiles[$outputfileptr]
	End
ElseIf ($choice = "A") and ($outputfileptr = $outputfilecount + 1)
	Echo "**" & ANSI_10 & "Enter the sector list filename (no " & GAMENAME & "_ this is added automatically)"
		Echo "*Don't forget the file extension (usually .txt): " & ANSI_15
	GetConsoleInput $filename
	If ($filename <> "") and ($filename <> #13)
		UpperCase $filename
		SetVar $outputfilecount ($outputfilecount + 1)
		SetVar $outputfiles[$outputfilecount] $filename
		SetVar $outputfileptr $outputfilecount
		SetVar $listfile GAMENAME & "_" & $outputfiles[$outputfileptr]
		Write "z-sectorlist.cfg" "OUTPUT:" & $outputfiles[$outputfileptr]
	End
ElseIf ($choice = "G")
	Goto :START
ElseIf ($choice = "Q")
	Goto :FINISH
End
Goto :STARTMENU
:START
ReadToArray $listfile $sectorlist
Send "t * * 3 " & $equload & "* t * * 1 *"
Gosub :GETSTATS
If ($equ < $equload) or ($ore < ($holds - $equ))
	Echo "***" & ANSI_12 & "Start this script on a PLANET with plenty of ore and equ. Exiting...**"
	Goto :FAIL
End
SetVar $startsector $current_sector
SetVar $prompt "Command"
Send "q "
While ($listptr <= $sectorlist)
	If ($Z_Lib~isunlimited = FALSE)
		Gosub :GETSTATS
		If ($turns < 20)
			Echo "***" & ANSI_12 & "Low on turns! Exiting...**"
			Goto :FAIL
		End
	End
	GetSectorParameter $sectorlist[$listptr] "BUSTED" $isbusted
	If ($isbusted = TRUE)
		Goto :SKIP
	End
	SetVar $target $sectorlist[$listptr]
	Gosub :TWARPING
	Gosub :GETSTATS
	Send #145
	WaitFor #145 & #8
	If ($current_sector <> $sectorlist[$listptr])
		If ($ore < 30)
			If ($scanner = "2") and ($twarp > 0) and ($credits > 5000)
				Gosub :Z_Gas~FINDFUEL
			End
			Send #145
			WaitFor #145 & #8
			Gosub :GETSTATS
			Gosub :TWARPING
			Gosub :GETSTATS
			Send #145
			WaitFor #145 & #8
			If ($current_sector <> $sectorlist[$listptr])
				Echo "***" & ANSI_12 & "Did not arrive at sector " & $sectorlist[$listptr] & ". Exiting...**"
				Goto :FAIL
			End
		Else
			Echo "***" & ANSI_12 & "Did not arrive at sector " & $sectorlist[$listptr] & ". Skipping...**"
			Goto :SKIP
		End
	End
	Send #145
	WaitFor #145 & #8
	KillAllTriggers
	SetTextTrigger buy :BUY "do you want to buy"
	SetTextTrigger sellore :SELLORE "Fuel Ore do you want to sell"
	SetTextTrigger sellequ :SELLEQU "Equipment do you want to sell"
	SetTextTrigger portdone :PORTDONE "Command [TL="
	Send "p*"
	Pause
:BUY
	SetTextTrigger buy :BUY "do you want to buy"
	Send "0*"
	Pause
:SELLORE
	Send "0*"
	Pause
:SELLEQU
	Send "10**"
	Pause
:PORTDONE
	KillAllTriggers
	Gosub :GETSTATS
	If ($equ < 10)
		SetVar $target $startsector
		Gosub :TWARPING
		Gosub :GETSTATS
		Send #145
		WaitFor #145 & #8
		If ($current_sector <> $startsector)
			If ($ore < 30)
				If ($scanner = "2") and ($twarp > 0) and ($credits > 5000)
					Gosub :Z_Gas~FINDFUEL
				End
				Send #145
				WaitFor #145 & #8
				Gosub :GETSTATS
				Gosub :TWARPING
				Gosub :GETSTATS
				Send #145
				WaitFor #145 & #8
				If ($current_sector <> $startsector)
					Echo "***" & ANSI_12 & "Did not arrive at sector " & $startsector & ". Exiting...**"
					Goto :FAIL
				End
			Else
				Echo "***" & ANSI_12 & "Did not arrive at sector " & $startsector & ". Exiting...**"
				Goto :FAIL
			End
		End
		Gosub :Z_Lib~RETURNTOPLANET
		Send "t * l 1 * t * l 3 * t * * 3 " & $equload & "* t * * 1 * "
		Send "q "
		Gosub :GETSTATS
		Send #145
		WaitFor #145 & #8
	End
:SKIP
	SetVar $listptr ($listptr + 1)
End
Gosub :Z_Lib~RETURNTOPLANET
Echo "***" & ANSI_15 & $scripttitle & " is DONE!. Exiting...**"
Goto :FINISH
:FAIL
Gosub :Z_Lib~COMMSON
Sound failed
Halt
:FINISH
Gosub :Z_Lib~COMMSON
Sound ding
Halt
:TWARPING
If ($current_sector = $target)
	Echo "**" & ANSI_12 & "You are already here.**"
	Goto :NOTWARP2
End
If ($prompt = "Citadel")
	SetTextTrigger getplanetnum :GETPLANETNUM "Planet #"
	Send "q*"
	Pause
:GETPLANETNUM
	KillAllTriggers
	GetWord CURRENTLINE $planetnumber 2
	StripText $planetnumber "#"
	SetTextTrigger gethops :TWGETHOPS "TransPort power ="
	SetTextTrigger notrans :NOTRANS "Planet command (?"
	Pause
:TWGETHOPS
	KillAllTriggers
	GetWord CURRENTLINE $transhops 5
	Send "c"
	Goto :GOTPLANETSTUFF
:NOTRANS
	KillAllTriggers
	SetVar $prompt "Command"
	Send "t**1*q "
	Gosub :GETSTATS
:GOTPLANETSTUFF
End
GetSectorParameter $target "FIGSEC" $directok
If (($target = STARDOCK) or ($target <= 10)) and ($align >= 1000)
	SetVar $directok TRUE
End
If ($directok <> TRUE)
	SetVar $warpsincount SECTOR.WARPINCOUNT[$target]
	SetVar $count "1"
	SetVar $availablewarps "0"
	While ($count <= $warpsincount)
		SetVar $thiswarp SECTOR.WARPSIN[$target][$count]
		GetSectorParameter $thiswarp "FIGSEC" $figged
		If ($figged = TRUE)
			SetVar $availablewarps ($availablewarps + 1)
			SetVar $warpsin[$availablewarps] $thiswarp
		End
		SetVar $count ($count + 1)
	End
	If ($availablewarps < 1)
		SetVar $jumpsector $target
	Else
		GetRnd $warp 1 $availablewarps
		SetVar $jumpsector $warpsin[$warp]
	End
Else
	SetVar $jumpsector $target
End
GetDistance $distance $current_sector $jumpsector
If ($distance = "-1")
	Goto :NOCOURSE
End
Goto :GOTCOURSE
:NOCOURSE
If ($jumpsector = $current_sector)
	Goto :CLEAR
End
SetTextTrigger trip1 :TRIP1 "The shortest path"
Send "c f" & $current_sector & "*" & $jumpsector "*q"
Pause
:TRIP1
KillAllTriggers
GetWord CURRENTLINE $distance 4
StripText $distance "("
:GOTCOURSE
If ($prompt = "Command")
	SetVar $oreneeded ($distance * 3)
	If ($ore < $oreneeded)
		GetSectorParameter $current_sector "BUSTED" $busted
		If (PORT.EXISTS[$current_sector] = TRUE) and (PORT.BUYFUEL[$current_sector] = FALSE) and (PORT.CLASS[$current_sector] <> "0") and ($busted <> TRUE)
			Send "p * * * * "
			Gosub :GETSTATS
		End
		If ($ore < $oreneeded)
			If ($planetnumber > 0)
				Send "lj" & #8 & #8 & $planetnumber & "*c"
			End
			Echo "**" & ANSI_12 & "You need at least " & $oreneeded & " ore for the trip! Exiting.**"
			Goto :NOTWARP2
		End
	End
Else
	Send "qt**1*c"
	Gosub :Z_Lib~SYNC
	SetVar $oreneeded ($distance * 10)
	SetTextTrigger planetore :PLANETORE "Fuel Ore"
	Send "q*"
	Pause
:PLANETORE
	KillAllTriggers
	GetWord CURRENTLINE $planetore 6
	StripText $planetore ","
	Send "c"
	If ($planetore < $oreneeded)
		Echo "**" & ANSI_12 & "You need at least " & $oreneeded & " ore on the planet! Exiting.**"
		Goto :NOTWARP2
	End
End
Gosub :Z_Lib~ISITUNLIMITED
If ($Z_Lib~isunlimited = FALSE)
	Send "c"
	WaitFor "Computer command [TL="
	SetTextLineTrigger turnsper :TURNSPER "Turns Per Warp:"
	Send ";q"
	Pause
:TURNSPER
	KillAllTriggers
	SetVar $line CURRENTLINE
	ReplaceText $line ":" " "
	GetWord $line $turnsperwarp 7
	If ($jumpsector = $target)
		If ($prompt = "Citadel")
			SetVar $minturns (($turnsperwarp * 3) + 1)
		Else
			SetVar $minturns ($turnsperwarp * 4)
		End
	Else
		If ($prompt = "Citadel")
			SetVar $minturns (($turnsperwarp * 4) + 1)
		Else
			SetVar $minturns ($turnsperwarp * 5)
		End
	End
	If ($turns < $minturns)
		Echo "**" & ANSI_12 & "You don't have enough turns left!. Exiting.**"
		Goto :NOTWARP2
	End
End
SetVar $heretrigger "["& $jumpsector &"] (?="
If ($prompt = "Command")
:TWARP
	KillAllTriggers
	SetVar $nothere FALSE
	SetTextTrigger trigger61 :USINGTWARP "Do you want to engage the TransWarp"
	SetTextTrigger trigger63 :WEREHERE "Warping to sector"
	SetTextTrigger trigger65 :WEREHERE $heretrigger
	SetTextTrigger trigger66 :AVOIDED "DANGER! You have marked sector"
	SetTextTrigger trigger70 :IGED "An Interdictor Generator in this sector holds you fast!"
	SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
	SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
	Send "m" & $jumpsector & "*"
	Pause
End
:IGED
KillAllTriggers
Echo "**" & ANSI_12 & "CAUGHT IN AN INTERDICTOR!!! Exiting.**"
Goto :FAIL
:USINGTWARP
KillAllTriggers
SetTextTrigger trigger61 :NOFUEL "not have enough Fuel Ore"
SetTextTrigger trigger62 :NOBEAM "No locating beam found"
SetTextTrigger trigger63 :TWARPOK "Locating beam pinpointed"
SetTextTrigger trigger69 :NOROUTE "No route within"
SetTextTrigger norange :NORANGE "This planetary transporter does not have the range."
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
If ($prompt = "Citadel")
	Send "b" & $jumpsector & "*"
Else
	Send "y"
End
Pause
:NORANGE
KillAllTriggers
Send "qq "
SetVar $prompt "Command"
Goto :TWARP
:NOROUTE
KillAllTriggers
Send "*"
Echo "**" & ANSI_12 & "NO ROUTE TO JUMP SECTOR " & $jumpsector & " !!! Exiting.**"
Goto :NOTWARP2
:TWARPOK
KillAllTriggers
If ($prompt = "Citadel")
	SetTextTrigger mined :MINED "Mined Sector: Do you wish to Avoid this sector in the future?"
	SetTextTrigger trigger65 :CLEAR $heretrigger
Else
	SetTextTrigger trigger65 :WEREHERE $heretrigger
	SetTextTrigger trigger63 :WEREHERE "TransWarp Drive Engaged!"
End
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
Send "y"
Pause
:AVOIDED
KillAllTriggers
Echo "**" & ANSI_12 & "JUMP SECTOR " & $jumpsector & " AVOIDED !!! Exiting.**"
Goto :NOTWARP2
:NOBEAM
KillAllTriggers
Send "n"
SetSectorParameter $jumpsector "FIGSEC" FALSE
Echo "**" & ANSI_12 & "NO FIGHTER IN JUMP SECTOR " & $jumpsector & " !!! Exiting.**"
Goto :NOTWARP2
:NOFUEL
KillAllTriggers
Echo "**" & ANSI_12 & "NOT ENOUGH FUEL TO MAKE THE JUMP !!! Exiting.**"
Goto :NOTWARP2
:WEREHERE
KillAllTriggers
SetVar $previoussector $current_sector
If ($jumpsector <> $target)
	SetTextTrigger mined :MINED "Mined Sector: Do you wish to Avoid this sector in the future?"
	SetTextTrigger clear :CLEAR "Command [TL="
	SetDelayTrigger clear2 :CLEAR 2000
	Send #145
	Pause
:MINED
	KillAllTriggers
	Send "n"
:CLEAR
	KillAllTriggers
	If ($jumpsector <> $target)
		Gosub :MOVE
	End
End
Gosub :Z_Lib~SYNC
:NOTWARP2
Return
:MOVE
SetVar $destination $target
SetVar $badpath FALSE
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
	If (($mowmode = "MOW") and ($z_mowfigs >= 0) and ($mowcourse[$leg] > 10) and ($mowcourse[$leg] <> STARDOCK) and ($leg > 1))
		If ($z_figtype = "d")
			SetVar $mowmacro ($mowmacro & "fz" & $z_mowfigs & "*" & $z_figowner & "q*d")
		Else
			SetVar $mowmacro ($mowmacro & "fz" & $z_mowfigs & "*" & $z_figowner & "q*" & $z_figtype & "q * ")
		End
		SetSectorParameter $mowcourse[$leg] "FIGSEC" TRUE
	end
	If (($mowmode = "MOW") and ($z_mowmines > 0) and ($mowcourse[$leg] > 10) and ($mowcourse[$leg] <> STARDOCK) and ($leg > 1))
		SetVar $mowmacro ($mowmacro & "h 1 z" & $z_mowmines & " * z" & $z_figowner & "* ")
		SetSectorParameter $mowcourse[$leg] "MINESEC" TRUE
	end
	If (($mowmode = "MOW") and ($z_mowlimps > 0) and ($mowcourse[$leg] > 10) and ($mowcourse[$leg] <> STARDOCK) and ($leg > 1))
		SetVar $mowmacro ($mowmacro & "h 2 z" & $z_mowlimps & " * z" & $z_figowner & "* ")
		SetSectorParameter $mowcourse[$leg] "LIMPSEC" TRUE
	end
	SetVar $leg ($leg + 1)
End
Send $mowmacro
If ($mowmode <> "TWARP")
	Gosub :DOOPTIONS
End
:ENDMOVE
Return
# GETCOURSE 
:GETCOURSE
#---------------------------------------------------------------
If (CURRENTSECTOR > 0) and (CURRENTSECTOR <= SECTORS) and ($destination > 0) and ($destination <= SECTORS)
	Getcourse $mowcourse CURRENTSECTOR $destination
	If ($mowcourse <> "-1")
		SetVar $mowcourselen ($mowcourse + 1)
		Goto :GETCOURSEDONE
	End
Else
	ECHO "*** GETCOURSE ERROR ! - CURRENT SECTOR = " & CURRENTSECTOR & " - DESTINATION = " & $destination & "***"
	Goto :FINISH
End
#---------------------------------------------------------------
SetArray $mowcourse 80
SetVar $rawsectors ""
SetTextLineTrigger linetrigger1 :STARTGETCOURSE " > "
setTextLineTrigger linetrigger6 :STARTGETCOURSE "Error - No route within"
Send "^f*" & $destination & "*q"
Pause
:STARTGETCOURSE
KillTrigger linetrigger1
KillTrigger linetrigger2
KillTrigger linetrigger3
KillTrigger linetrigger4
KillTrigger linetrigger5
KillTrigger linetrigger6
KillTrigger linetrigger7
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
	KillTrigger linetrigger1
	KillTrigger linetrigger2
	KillTrigger linetrigger3
	KillTrigger linetrigger4
	KillTrigger linetrigger5
	KillTrigger linetrigger6
	KillTrigger linetrigger7
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
# SETANSI 
:SETANSI
SetVar $cls "[2J"
SetVar $savecursor "[s"
SetVar $restorecursor "[u"
SetVar $black "[0;30m"
SetVar $red "[0;31m"
SetVar $green "[0;32m"
SetVar $yellow "[0;33m"
SetVar $blue "[0;34m"
SetVar $magenta "[0;35m"
SetVar $cyan "[0;36m"
SetVar $white "[0;37m"
SetVar $boldblack "[1;30m"
SetVar $boldred "[1;31m"
SetVar $boldgreen "[1;32m"
SetVar $boldyellow "[1;33m"
SetVar $boldblue "[1;34m"
SetVar $boldmagenta "[1;35m"
SetVar $boldcyan "[1;36m"
SetVar $boldwhite "[1;37m"
SetVar $blackbgd "[40m"
SetVar $redbgd "[41m"
SetVar $greenbgd "[42m"
SetVar $yellowbgd "[43m"
SetVar $bluebgd "[44m"
SetVar $magentabgd "[45m"
SetVar $cyanbgd "[46m"
SetVar $whitebgd "[47m"
SetVar $blinkon "[5m"
SetVar $blinkoff "[0m"
Return
# CONFIG 
:CONFIG
FileExists $cfgok "z-sectorlist.cfg"
If ($cfgok = TRUE)
	ReadToArray "z-sectorlist.cfg" $configfile
	SetVar $sourcefilecount 0
	SetVar $outputfilecount 0
	SetVar $i 1
	While ($i <= $configfile)
		UpperCase $configfile[$i]
		GetWordPos $configfile[$i] $pos "SOURCE:"
		If ($pos > 0)
			SetVar $sourcefilecount ($sourcefilecount + 1)
			SetVar $temp $configfile[$i]
			SetVar $temp ($temp & "!!!")
			GetText $temp $sourcefiles[$sourcefilecount] "SOURCE:" "!!!"
			StripText $sourcefiles[$sourcefilecount] " "
		End
		GetWordPos $configfile[$i] $pos "OUTPUT:"
		If ($pos > 0)
			SetVar $outputfilecount ($outputfilecount + 1)
			SetVar $temp $configfile[$i]
			SetVar $temp ($temp & "!!!")
			GetText $temp $outputfiles[$outputfilecount] "OUTPUT:" "!!!"
			StripText $outputfiles[$outputfilecount] " "
		End
		SetVar $i ($i + 1)
	End
	If ($sourcefilecount = 0) or ($outputfilecount = 0)
		Delete "z-sectorlist.cfg"
		Goto :CONFIG
	End
Else
	Write "z-sectorlist.cfg" "SOURCE:RAWLIST.TXT"
	SetVar $sourcefiles[1] "RAWLIST.TXT"
	Write "z-sectorlist.cfg" "SOURCE:BUBBLE.TXT"
	SetVar $sourcefiles[2] "BUBBLE.TXT"
	Write "z-sectorlist.cfg" "SOURCE:SECTORLIST.TXT"
	SetVar $sourcefiles[3] "SECTORLIST.TXT"
	Write "z-sectorlist.cfg" "OUTPUT:SECTORLIST.TXT"
	SetVar $outputfiles[1] "SECTORLIST.TXT"
	Write "z-sectorlist.cfg" "OUTPUT:BUBBLE.TXT"
	SetVar $outputfiles[2] "BUBBLE.TXT"
	Write "z-sectorlist.cfg" "OUTPUT:PORTLIST.TXT"
	SetVar $outputfiles[3] "PORTLIST.TXT"
	Write "z-sectorlist.cfg" "OUTPUT:PROXIMITY.TXT"
	SetVar $outputfiles[4] "PROXIMITY.TXT"
	Write "z-sectorlist.cfg" "OUTPUT:AVOIDSLIST.TXT"
	SetVar $outputfiles[5] "AVOIDSLIST.TXT"
	Write "z-sectorlist.cfg" "OUTPUT:RAWLIST.TXT"
	SetVar $outputfiles[6] "RAWLIST.TXT"
	SetVar $sourcefilecount 3
	SetVar $outputfilecount 6
End
Return
# INCLUDES
Include include\Z_Auth.ts
Include include\Z_Lib.ts
Include include\Z_Strings.ts
Include include\PlayerInfo.ts
Include include\Z_Gas.ts
# ZeD Compiled: Fri 09/11/2012 -  0:13:24.59 
# ZeD Compiled: Sat 07/09/2013 -  7:21:38.30 
