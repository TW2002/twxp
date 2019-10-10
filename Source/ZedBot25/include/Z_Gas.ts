# FINDFUEL
#
# Ship must have a Transwarp and a holo scanner. 
# Make sure the current prompt is the COMMAND PROMPT. 
# Gosub :Z_Gas~FINDFUEL
#
:FINDFUEL
ECHO "**" & ANSI_12 & "LOOKING FOR FUEL !!! **"
Send "'Searching for fuel...*"
Gosub :GETSTATS
SetVar $lastsector 0
Send #145
WaitOn #145 & #8
SetVar $line CURRENTLINE
CutText $line $word 1 7
If ($word = "Citadel")
	Send "q t * * 1 * c "
ElseIf ($word = "Planet ")
	Send "t * * 1 * "
ElseIf ($word = "Command") and ($current_sector = $base) and ($planet <> "0")
	Send "l j" & #8 & #8 & $planet & "*"
	Send "t * * 1 * q"
End
Gosub :GETSTATS
If ($ore = $holds)
	SetVar $prefcount 0
	Goto :GOTFUEL
End
:FINDFUEL2
SetVar $gotfuel FALSE
Send "shsd"
Send "*"
Gosub :GETSTATS
KillTrigger abort
KillTrigger smallwait
SetTextOutTrigger abort :ABORT #8
SetDelayTrigger smallwait :SMALLWAIT 50
Pause
:ABORT
KillTrigger smallwait
KillTrigger abort
Echo "***" & ANSI_12 &  "[5m" & "ABORTED by user...***" & "[0m"
Goto :FINISH
:SMALLWAIT
KillTrigger smallwait
KillTrigger abort
Gosub :SYNC
If ($ore = $holds)
	SetVar $prefcount 0
	Goto :GOTFUEL
End
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
					Goto :FINDFUEL2
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
			If (PORT.EXISTS[$thatsector] = TRUE) and (PORT.BUYFUEL[$thatsector] = FALSE) and (PORT.CLASS[$thatsector] <> "0") and ($lastsector <> $thatsector)
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
	Goto :FINDFUEL2
End
If (SECTOR.FIGS.QUANTITY[$thatsector] <> "0") and ($figged <> TRUE)
   Goto :FINDFUEL2
End
If ($thatsector = STARDOCK)
	Goto :FINDFUEL2
End
If ($thatsector < 11)
	Send "m" & $thatsector & "* za" & $z_wave & "* *  "
Else
	Send "m" & $thatsector & "* za" & $z_wave & "* *  fz1*cq*d"
End
SetVar $lastsector $thatsector
Goto :FINDFUEL2
:GOTFUEL
SetVar $gotfuel TRUE
Send "'Got fuel...*"
:FINISH
Return

# CHECKSECTORSAFE 
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
# TWARPNEXT 
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
# CONNECTIONLOST 
:CONNECTIONLOST
Halt
# SYNC 
:SYNC
KillTrigger av
KillTrigger av2
SetTextTrigger av :AV "Average Interval Lag:"
SetTextTrigger av2 :AV "Network Ping:"
Send "@"
Pause
:AV
KillTrigger av
KillTrigger av2
Return
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
Return

# INCLUDES 
Include include\PlayerInfo.ts
