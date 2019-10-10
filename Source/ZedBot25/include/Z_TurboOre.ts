# INCLUDE: Z_TurboOre 
#
# Gosub :Z_TurboOre~BUYDOWN 
#

# BUYDOWN 
# SetVar $Z_TurboOre~credits 
# SetVar $Z_TurboOre~holds 
# SetVar $Z_TurboOre~turns 
# Returns $Z_TurboOre~failed TRUE - if failed. 
# Returns $Z_TurboOre~failreason - reason for failure. 
#
# START from the Citadel or Planet prompt. 
#
:BUYDOWN
SetVar $failed FALSE
SetVar $failreason ""
Send #145
WaitFor #145 & #8
CutText CURRENTLINE $prompt 1 7
If ($holds < 75)
	Echo "**" & ANSI_12 & "Sorry, I aint doin it with " & $holds & " holds. You need 75 or more..**"
	SetVar $failed TRUE
	SetVar $failreason "Not enough holds"
	Goto :ENDBUYDOWN
End
If ($prompt = "Citadel")
	SetVar $oncitadel TRUE
	SetTextLineTrigger getcitcash :ZGETCITCASH "Citadel treasury contains"
	Send "*"
	Pause
:ZGETCITCASH
	KillTrigger getcitcash
	GetText CURRENTLINE $citcash "contains " " credits."
	Striptext $citcash ","
	Gosub :GETPORTDATA
	If ($credits < 1200000) and ($citcash >= 1200000)
		Send "tf1200000*"
		SetVar $credits ($credits + 1200000)
	End
	Send "q"
ElseIf ($prompt <> "Planet ")
	Echo "**" & ANSI_12 & "WRONG PROMPT ! Citadel or Planet Prompts OK. Not "  & $prompt & ".**"
	SetVar $failed TRUE
	SetVar $failreason "Wrong prompt"
	Goto :ENDBUYDOWN
Else
	SetVar $citcash "0"
End	
SetTextLineTrigger getpnum :GETPNUM "Planet #"
Send "*"
Pause
:GETPNUM
KillTrigger getpnum
GetWord CURRENTLINE $planetnum 2
StripText $planetnum "#"
SetTextLineTrigger getfuelinfo :GETFUELINFO "Fuel Ore"
Pause
:GETFUELINFO
KillTrigger getfuelinfo
SetVar $line CURRENTLINE
GetWord $line $currentfuel 6
GetWord $line $maxfuel 8
StripText $currentfuel ","
StripText $maxfuel ","
SetVar $canbuy ($maxfuel - $currentfuel)
If ($canbuy < $holds)
	Echo "**" & ANSI_12 & "Can't carry any more ore.**"
	SetVar $failed TRUE
	SetVar $failreason "Full of Ore"
	Goto :ENDBUYDOWN
End
Send "t*l1*t*l2*t*l3*"
If ($prompt = "Planet ")
	Send "q*"
	Gosub :GETPORTDATA
	Send "lj" & #8 & $planetnum & "*"
End
If ($oretosell < $holds)
	Echo "**" & ANSI_12 & "Not enough ore on sale here.**"
	SetVar $failed TRUE
	SetVar $failreason "Not enough Ore on sale"
	Goto :ENDBUYDOWN
End
If ($credits < ($holds * 18))
	Echo "**" & ANSI_12 & "Not enough cash to continue.**"
	SetVar $failed TRUE
	SetVar $failreason "Not enough cash"
	Goto :ENDBUYDOWN
End
SetVar $canafford ($credits / 18)
SetVar $maxcanbuy (($turns - 20) * $holds)
If ($canbuy < $oretosell)
	SetVar $max $canbuy
Else
	SetVar $max $oretosell
End
If ($maxcanbuy < $max)
	SetVar $max $maxcanbuy
End
If ($canafford < $max)
	SetVar $max $canafford
End
SetVar $trips (($max / $holds) - 1)
Echo "**" & ANSI_15 & "Creating Turbo macro burst... hold on to sumfin..**"
Setvar $mac ""
SetVar $i 1
SetVar $trip "q p * * * l j" & #8 & $planetnum & "* t * l 1 * "
While ($i <= $trips)
	SetVar $mac ($mac & $trip)
	SetVar $i ($i + 1)
End
#----
Send "qq*"
Send #145
WaitFor #145 & #8
Send "l" & $planetnum & "*"
#----
Gosub :Z_Avoids~AVOIDADJ
Logging "OFF"
Send $mac & #145
WaitFor #145 & #8
Logging "ON"
Gosub :Z_Avoids~UNAVOIDADJ
If ($oncitadel = TRUE)
	Send "c"
End
Echo "**" & ANSI_15 & "Zed's Turbo Ore buydown complete.. We bought " & $max & " units of ore..**"
:ENDBUYDOWN
Return
:GETPORTDATA
SetTextTrigger comact :COMACT "<Computer activated>"
Send "c"
Pause
:COMACT
SetTextLineTrigger portdata :PORTDATA "Fuel Ore"
SetTextLineTrigger noport :NOPORT "I have no information about a port in that sector."
Send "r*q"
Pause
:NOPORT
KillTrigger portdata
KillTrigger noport
SetVar $oretosell 0
SetVar $oretradetype 0
SetVar $failed TRUE
SetVar $failreason "No Port"
Goto :NOPORT2
:PORTDATA
KillTrigger portdata
KillTrigger noport
SetVar $line CURRENTLINE
GetWord $line $oretradetype 3
GetWord $line $oretosell 4
:NOPORT2
Return
# INCLUDES 
Include include\Z_Avoids.ts
