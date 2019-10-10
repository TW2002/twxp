# INCLUDE: Z_Refurb
# Gosub :Z_Refurb~REFURB
#
# SetVar $Z_REFURB~z_buyholds FALSE 
# SetVar $Z_REFURB~z_buyfigs FALSE 
# SetVar $Z_REFURB~z_buymines FALSE 
# SetVar $Z_REFURB~z_buylimps FALSE 
# SetVar $Z_REFURB~z_buytorps FALSE 
# SetVar $Z_REFURB~z_buydets FALSE 
# SetVar $Z_REFURB~z_buycloaks FALSE 
# SetVar $Z_REFURB~z_buybeacons FALSE 
# SetVar $Z_REFURB~$z_buyprobes FALSE 
# SetVar $Z_REFURB~$z_buymdis FALSE 
# SetVar $Z_REFURB~$z_buyshields FALSE 
# SetVar $Z_REFURB~$z_buyphotons FALSE 
# SetVar $Z_REFURB~$z_buy1photon FALSE 
# SetVar $Z_REFURB~$z_buycorbs FALSE 
#
# SetVar $Z_REFURB~prompt $prompt (Command or Citadel) 
#
# Run from the COMMAND or CITADEL prompt. 
#
:REFURB
If ($z_buy1photon = TRUE)
	SetVar $z_buyphotons FALSE
End
Gosub :GETSTATS
If (CURRENTSECTOR = STARDOCK)
   Echo "**" & ANSI_12 & "You are already at STARDOCK... Exiting.**"
   Send "'You are already at STARDOCK... Exiting.**"
   Goto :FAILED
End
If ($twarp = "0")
   Echo "**" & ANSI_12 & "You need a Transwarp Drive... Exiting.**"
   Send "'You need a Transwarp Drive... Exiting.**"
   Goto :FAILED
End
Send "c u y q "
SetVar $returnsector CURRENTSECTOR
GetSectorParameter $returnsector "FIGSEC" $figged
If ($figged <> TRUE)
	Echo "**" & ANSI_12 & "Please drop a fig in the current sector first... Exiting.**"
	Send "'Please drop a fig in the current sector first... Exiting.**"
	Goto :FAILED
End
If ($prompt = "Citadel")
	SetTextTrigger getplanetnum :GETPLANETNUM "Planet #"
	Send "q*"
	Pause
:GETPLANETNUM
	KillAllTriggers
	GetWord CURRENTLINE $planetnumber 2
	StripText $planetnumber "#"
	SetTextTrigger gethops :GETHOPS "TransPort power ="
	SetTextTrigger notrans :NOTRANS "Planet command (?"
	Pause
:GETHOPS
	KillAllTriggers
	GetWord CURRENTLINE $transhops 5
	Send "c"
	Goto :GOTPLANETSTUFF
:NOTRANS
	SetVar $prompt "Command"
	Send "t**1*q"
	Gosub :GETSTATS
:GOTPLANETSTUFF
End
If (STARDOCK = "0")
	If ($prompt = "Command")
		Send "v"
	Else
		Send "q q vlj" & #8 & #8 & $planetnumber & "*c"
	End
	If (STARDOCK = "0")
		Echo "**" & ANSI_12 & "YOU NEED TO FIND STARDOCK!!! Exiting.**"
		Send "'YOU NEED TO FIND STARDOCK!!! Exiting.**"
		Goto :FAILED
	End
End
SetTextTrigger noport :NOPORT "I have no information about a port in that sector."
SetTextTrigger portok :PORTOK "Commerce report for"
Send "c r" & STARDOCK & "*q"
Pause
:NOPORT
KillAllTriggers
Echo "**" & ANSI_12 & "STARDOCK SEEMS TO BE MISSING!!! Exiting.**"
Send "'STARDOCK SEEMS TO BE MISSING!!! Exiting.**"
Goto :FAILED
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
		Echo "**" & ANSI_12 & "NO FIGGED ADJACENTS TO STARDOCK !!! Exiting.**"
		Send "'NO FIGGED ADJACENTS TO STARDOCK !!! Exiting.**"
		Goto :FAILED
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
If ($prompt = "Command")
	SetVar $oreneeded ($distance * 3)
	If ($ore < $oreneeded)
		If (PORT.EXISTS[CURRENTSECTOR] = TRUE) and (PORT.BUYFUEL[CURRENTSECTOR] = FALSE) and (PORT.CLASS[CURRENTSECTOR] <> "0")
			Send "p * * * * "
			Gosub :GETSTATS
		End
		If ($ore < $oreneeded)
			If ($planetnumber > 0)
				Send "lj" & #8 & #8 & $planetnumber & "*c"
			End
			Echo "**" & ANSI_12 & "You need at least " & $oreneeded & " ore for the return trip! Exiting.**"
			Send "'You need at least " & $oreneeded & " ore for the return trip! Exiting.**"
			Goto :FAILED
		End
	End
Else
	SetVar $oreneeded ($hops2 * 3)
	If ($ore < $oreneeded)
		Send "qt**1*c"
		Gosub :GETSTATS
	End
	If ($ore < $oreneeded)
		Echo "**" & ANSI_12 & "You need at least " & $oreneeded & " ore for the return trip! Exiting.**"
		Send "'You need at least " & $oreneeded & " ore for the return trip! Exiting.**"
		Goto :FAILED
	End
	Send "@"
	WaitOn "Average Interval Lag:"
	SetVar $oreneeded ($hops1 * 10)
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
		Send "'You need at least " & $oreneeded & " ore on the planet! Exiting.**"
		Goto :FAILED
	End
End
SetVar $Z_Lib~isunlimited FALSE
Gosub :Z_Lib~ISITUNLIMITED
Send "*"
If ($prompt = "Citadel")
	WaitFor "Citadel command (?="
Else
	WaitFor "] ("
End
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
		Send "'You don't have enough turns left!. Exiting.**"
		Goto :FAILED
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
	SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
	SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
	Send "f z1* cq* d "
	Send "m" & $jumpsector & "*"
	Pause
End
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
Send "qq"
SetVar $prompt "Command"
Goto :TWARP
:NOROUTE
KillAllTriggers
Send "*"
Echo "**" & ANSI_12 & "NO ROUTE TO JUMP SECTOR " & $jumpsector & " !!! Exiting.**"
Send "'NO ROUTE TO JUMP SECTOR " & $jumpsector & " !!! Exiting.**"
Goto :FAILED
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
Send "'JUMP SECTOR " & $jumpsector & " AVOIDED !!! Exiting.**"
Goto :FAILED
:NOBEAM
KillAllTriggers
Send "n"
SetSectorParameter $jumpsector "FIGSEC" FALSE
Echo "**" & ANSI_12 & "NO FIGHTER IN JUMP SECTOR " & $jumpsector & " !!! Exiting.**"
Send "'NO FIGHTER IN JUMP SECTOR " & $jumpsector & " !!! Exiting.**"
Goto :FAILED
:NOFUEL
KillAllTriggers
Echo "**" & ANSI_12 & "NOT ENOUGH FUEL TO MAKE THE JUMP !!! Exiting.**"
Send "'NOT ENOUGH FUEL TO MAKE THE JUMP !!! Exiting.**"
Goto :FAILED
:WEREHERE
KillAllTriggers
If ($jumpsector = STARDOCK)
	Send "p sg yg q h"
Else
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
	Send "m" & STARDOCK & "* p sg yg q h"
End
WaitOn "<Hardware Emporium> So what are you looking for (?)"
If ($z_buymines = TRUE)
	KillAllTriggers
	SetTextTrigger buy :buy1 "How many mines do you want"
	Send "m"
	Pause
:buy1
	KillAllTriggers
	GetText CURRENTLINE $amt "(Max " ")"
	StripText $amt ","
	Send $amt & "*"
End
If ($z_buylimps = TRUE)
	KillAllTriggers
	SetTextTrigger buy :buy2 "How many mines do you want"
	Send "l"
	Pause
:buy2
	KillAllTriggers
	GetText CURRENTLINE $amt "(Max " ")"
	StripText $amt ","
	Send $amt & "*"
End
If ($z_buytorps = TRUE)
	KillAllTriggers
	SetTextTrigger buy :buy3 "How many Genesis Torpedoes do you want"
	Send "t"
	Pause
:buy3
	KillAllTriggers
	GetText CURRENTLINE $amt "(Max " ")"
	StripText $amt ","
	Send $amt & "*"
End
If ($z_buydets = TRUE)
	KillAllTriggers
	SetTextTrigger buy :buy4 "How many Atomic Detonators do you want"
	Send "a"
	Pause
:buy4
	KillAllTriggers
	GetText CURRENTLINE $amt "(Max " ")"
	StripText $amt ","
	Send $amt & "*"
End
If ($z_buycloaks = TRUE)
	KillAllTriggers
	SetTextTrigger buy :buy5 "How many Cloaking units do you want"
	Send "d"
	Pause
:buy5
	KillAllTriggers
	GetText CURRENTLINE $amt "(Max " ")"
	StripText $amt ","
	Send $amt & "*"
End
If ($z_buybeacons = TRUE)
	KillAllTriggers
	SetTextTrigger buy :buy6 "How many Beacons do you want"
	Send "b"
	Pause
:buy6
	KillAllTriggers
	GetText CURRENTLINE $amt "(Max " ")"
	StripText $amt ","
	Send $amt & "*"
End
If ($z_buyprobes = TRUE)
	KillAllTriggers
	SetTextTrigger buy :buy7 "How many Probes do you want"
	Send "e"
	Pause
:buy7
	KillAllTriggers
	GetText CURRENTLINE $amt "(Max " ")"
	StripText $amt ","
	Send $amt & "*"
End
If ($z_buymdis = TRUE)
	KillAllTriggers
	SetTextTrigger buy :buy8 "How many Mine Disruptors do you want"
	Send "s"
	Pause
:buy8
	KillAllTriggers
	GetText CURRENTLINE $amt "(Max " ")"
	StripText $amt ","
	Send $amt & "*"
End
If ($z_buyphotons = TRUE)
	KillAllTriggers
	SetTextTrigger buy :buy9 "How many Photon Missiles do you want"
	SetTextTrigger nobuy :nobuy1 "Sorry, your ship is not equipped to handle Photon Missiles!"
	Send "p"
	Pause
:buy9
	KillAllTriggers
	GetText CURRENTLINE $amt "(Max " ")"
	StripText $amt ","
	Send $amt & "*"
:nobuy1
KillAllTriggers
End
If ($z_buy1photon = TRUE)
	KillAllTriggers
	SetTextTrigger buy :buy9a "How many Photon Missiles do you want"
	SetTextTrigger nobuy2 :nobuy2 "Sorry, your ship is not equipped to handle Photon Missiles!"
	Send "p"
	Pause
:buy9a
	KillAllTriggers	
	Send "1*"
:nobuy2
KillAllTriggers
End
If ($z_buycorbs = TRUE)
	KillAllTriggers
	SetTextTrigger buy :buy10 "How many Corbomite Transducers do you want"
	Send "c"
	Pause
:buy10
	KillAllTriggers
	GetText CURRENTLINE $amt "(Max " ")"
	StripText $amt ","
	Send $amt & "*"
End
SetTextTrigger holds :HOLDS "A  Cargo holds     :"
Send "qsp"
Pause
:HOLDS
KillAllTriggers
GetWord CURRENTLINE $canbuyholds 10
If ($z_buyholds = TRUE) and ($canbuyholds > 0)
	KillAllTriggers
	SetTextTrigger buy :buy11 "How many Cargo Holds do you want installed"
	Send "a"
	Pause
:buy11
	KillAllTriggers
	Send $canbuyholds & "*y"
End
If ($z_buyfigs = TRUE)
	KillAllTriggers
	SetTextTrigger buy :buy12 "How many K-3A fighters do you want to buy"
	Send "b"
	Pause
:buy12
	KillAllTriggers
	GetText CURRENTLINE $amt "(Max " ")"
	StripText $amt ","
	Send $amt & "*"
End
If ($z_buyshields = TRUE)
	KillAllTriggers
	SetTextTrigger buy :buy13 "How many shield armor points do you want to buy"
	Send "c"
	Pause
:buy13
	KillAllTriggers
	GetText CURRENTLINE $amt "(Max " ")"
	StripText $amt ","
	Send $amt & "*"
End
:GOHOME
KillAllTriggers
SetVar $nothere FALSE
SetVar $heretrigger "["& $returnsector &"] (?="
# SetTextTrigger trigger61 :USINGTWARP2 "Do you want to engage the TransWarp"
SetTextTrigger trigger63 :WEREHERE2 "Warping to sector"
SetTextTrigger trigger65 :WEREHERE2 $heretrigger
# SetTextTrigger trigger66 :AVOIDED2 "DANGER! You have marked sector"
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
# Send "qqq * m" & $returnsector & "*"
Send "qqq * m" & $returnsector & "* y y "
Pause
:USINGTWARP2
KillAllTriggers
SetTextTrigger trigger61 :NOFUEL2 "not have enough Fuel Ore"
SetTextTrigger trigger62 :NOBEAM2 "No locating beam found"
SetTextTrigger trigger63 :TWARPOK2 "Locating beam pinpointed"
SetTextTrigger trigger69 :NOROUTE2 "No route within"
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
Send "y"
Pause
:NOROUTE2
KillAllTriggers
Send "*"
Echo "**" & ANSI_12 & "NO ROUTE TO RETURN SECTOR " & $returnsector & " !!! Exiting.**"
Send "'NO ROUTE TO RETURN SECTOR " & $returnsector & " !!! Exiting.**"
Goto :FAILED
:TWARPOK2
KillAllTriggers
SetTextTrigger trigger63 :WEREHERE2 "TransWarp Drive Engaged!"
SetEventTrigger connectlost :CONNECTIONLOST "CONNECTION LOST"
SetEventTrigger disconnected :CONNECTIONLOST "CLIENT DISCONNECTED"
Send "y"
Pause
:AVOIDED2
KillAllTriggers
Echo "**" & ANSI_12 & "RETURN SECTOR " & $returnsector & " AVOIDED !!! Exiting.**"
Send "'RETURN SECTOR " & $returnsector & " AVOIDED !!! Exiting.**"
Goto :FAILED
:NOBEAM2
KillAllTriggers
Send "n"
SetSectorParameter $returnsector "FIGSEC" FALSE
Echo "**" & ANSI_12 & "NO FIGHTER IN JUMP SECTOR " & $returnsector & " !!! Exiting.**"
Send "'NO FIGHTER IN JUMP SECTOR " & $returnsector & " !!! Exiting.**"
Goto :FAILED
:NOFUEL2
KillAllTriggers
Echo "**" & ANSI_12 & "NOT ENOUGH FUEL TO MAKE THE JUMP !!! Exiting.**"
Send "'NOT ENOUGH FUEL TO MAKE THE JUMP !!! Exiting.**"
Goto :FAILED
:WEREHERE2
KillAllTriggers
Send "/"
If ($prompt = "Command")
	If ($planetnumber > 0)
		Send "lj" & #8 & #8 & $planetnumber & "*c"
		Send "@"
		WaitOn "Average Interval Lag:"
	Else
		Send "@"
		WaitOn "Average Interval Lag:"
		Send "*"
	End
Else
	Send "lj" & #8 & #8 & $planetnumber & "*c"
	Send "@"
	WaitOn "Average Interval Lag:"
	Send "s"
End
Goto :FINISH
:CONNECTIONLOST
KillAllTriggers
Halt
:FAILED
Halt
:FINISH
Return
# GETSTATS
:GETSTATS
Gosub :PlayerInfo~InfoQuick
SetVar $ore $PlayerInfo~Ore
SetVar $credits $PlayerInfo~Credits
SetVar $twarp $PlayerInfo~TWarp
SetVar $turns $PlayerInfo~Turns
SetVar $align $PlayerInfo~Align
SetVar $experience $PlayerInfo~Experience
SetVar $holds $PlayerInfo~Holds
Return
# Includes
Include include\PlayerInfo.ts
Include include\Z_Lib.ts
