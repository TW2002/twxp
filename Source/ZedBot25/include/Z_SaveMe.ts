# INCLUDE: Z_SaveMe 
#
# Gosub :Z_SaveMe~CALL 
#
# CALL 
# Returns Z_SaveMe~badsave TRUE if it fails 
:CALL
SetTextTrigger getsect :GETSAVESECT #179
Send "/"
Pause
:GETSAVESECT
KillTrigger getsect
SetVar $line CURRENTLINE
GetText $line $current_sector "Sect " #179 & "Turns"
StripText $current_sector " "
SetVar $Z_Strings~padchar "0"
SetVar $Z_Strings~padlen 5
SetVar $Z_Strings~unpadded $current_sector
GoSub :Z_Strings~PAD
SetVar $formattedsector $Z_Strings~padded
SetVar $triedsaveagain 1
SetVar $badsave FALSE
If ($current_sector = 0)
	SetVar $badsave TRUE
	Send "'Saveme failed ! Sector 0 doesn't work for me :(*"
	Goto :SAVEDONE
ElseIf ($current_sector > 10) and ($current_sector <> STARDOCK)  and ($current_sector <= SECTORS)
	Send "q q q *   fz1*cqz*d*"
:TRYSAVEAGAIN
	Send "'" & $formattedsector & "=saveme*"
	Gosub :SYNC
	Echo "**" & ANSI_15 & "WAITING FOR RESCUE SERVICE...: " & (($triedsaveagain - 1) * 10) & " seconds*"  &"**"
	SetSectorParameter $current_sector "FIGSEC" TRUE
	SetDelayTrigger savedelay :SAVEDELAY 200
	SetDelayTrigger savetoolong :SAVETOOLONG 10000
	SetTextTrigger saveplanet :LANDONPLANET "Saveme script activated - Planet "
	SetTextTrigger hookedtow :HOOKEDTOW "locks a tractor beam on your ship."
	SetTextOutTrigger abortrescue :ABORTRESCUE "~"
	Pause
:SAVEDELAY
	Pause
:ABORTRESCUE
	KillAllTriggers
	Echo "**" & ANSI_10 & " !!! SAVE ME ABORTED !!!**"
	Goto :SAVEDONE
:HOOKEDTOW
	KillTrigger savedelay
	KillTrigger savetoolong
	KillTrigger saveplanet
	KillTrigger hookedtow
	KillTrigger abortrescue
	send "'Tow locked, get us out of here!*"
	Goto :SAVEDONE
:LANDONPLANET
	KillTrigger savedelay
	KillTrigger savetoolong
	KillTrigger saveplanet
	KillTrigger hookedtow
	KillTrigger abortrescue
	GetText CURRENTLINE $planet "Saveme script activated - Planet " " to "
	If ($planet <> 0)
		Send "l j" & #8 & $planet & "* zqm***cx q */ 'I landed on planet " & $planet & "*"
	End
	Goto :SAVEDONE
:SAVETOOLONG	
	KillTrigger savedelay
	KillTrigger savetoolong
	KillTrigger saveplanet
	KillTrigger hookedtow
	KillTrigger abortrescue
	IF ($triedsaveagain <= 4)
		SetVar $triedsaveagain ($triedsaveagain + 1)
		Send "'Still waiting for Saveme: " & (($triedsaveagain -1) * 10) & " seconds*"
		Goto :TRYSAVEAGAIN
	Else
		SetVar $badsave TRUE
		Send "'Saveme failed after " & $triedsaveagain & " attempts at 10 second intervals!*"
		Gosub :SYNC
		Echo "**" & ANSI_12 & "SAVEME FAILED after " & ANSI_14 & $triedsaveagain & ANSI_12 & " attempts at " & ANSI_14 & "10 " & ANSI_12 & "second intervals!**"
		Goto :SAVEDONE
	End
Else
	SetVar $badsave TRUE
	Send "'Saveme failed ! Cannot Call Saveme from Fedspace!*"
	Goto :SAVEDONE
End
:SAVEDONE
Return
# SYNC 
:SYNC
SetTextTrigger av :AV "Average Interval Lag:"
Send "@"
Pause
:AV
KillTrigger av
#WaitFor "] (?=Help)? :"
:AV2
Return
# CALLFAST 
:CALLFAST
SetVar $triedagain 0
SetTextTrigger getsect :GETSAVEFASTSECT #179
Send "/"
Pause
:GETSAVEFASTSECT
KillTrigger getsect
SetVar $line CURRENTLINE
GetText $line $current_sector "Sect " #179 & "Turns"
StripText $current_sector " "
SetVar $Z_Strings~padchar "0"
SetVar $Z_Strings~padlen 5
SetVar $Z_Strings~unpadded $current_sector
GoSub :Z_Strings~PAD
SetVar $formattedsector $Z_Strings~padded
SetVar $badsave FALSE
#SetTextLineTrigger rescueok :RESCUEOK "Save Me - Running from planet"
#SetDelayTrigger rescuenotok :RESCUENOTOK 5000
#Send "'script?*"
#Pause
#:RESCUENOTOK
#KillTrigger rescueok
#KillTrigger rescuenotok
#Send "'Saveme failed ! NO RESCUE SERVICE AVAILABLE! :(*"
#SetVar $badsave TRUE
#Goto :SAVEFASTDONE
#:RESCUEOK
#KillTrigger rescueok
#KillTrigger rescuenotok
#GetText CURRENTLINE $planet "planet " "."
SetVar $nosend FALSE
:MOVEMENTCALL
If ($current_sector = 0)
	SetVar $badsave TRUE
	Send "'Saveme failed ! Sector 0 doesn't work for me :(*"
	Goto :SAVEFASTDONE
ElseIf ($current_sector > 10) and ($current_sector <> STARDOCK)  and ($current_sector <= SECTORS)
	Send "q q q *   fz1*cqz*d*"
	SetSectorParameter $current_sector "FIGSEC" TRUE
:TRYSAVEFASTAGAIN
	SetVar $triedsaveagain 1
	If ($nosend = TRUE)
		SetVar $nosend FALSE
	Else
		Send "'" & $formattedsector & "=saveme*"
	End
	Echo "**" & ANSI_15 & "WAITING FOR RESCUE SERVICE...: " & (($triedagain * 100) + $triedsaveagain - 1) & " attempts*"  & "**"
:SAVENOTLANDED
	Send #145
	WaitOn #145 & #8
	SetVar $triedsaveagain ($triedsaveagain + 1)
	If ($triedsaveagain > 100)
		SetVar $triedagain ($triedagain + 1)
		If ($triedagain > 1)
			Goto :NOFASTSAVE
		End
		Goto :TRYSAVEFASTAGAIN
	End
	KillTrigger savelanded
	KillTrigger savenotlanded
	SetTextTrigger savelanded :SAVELANDED "Planet #"
	SetTextTrigger savenotlanded :SAVENOTLANDED "<Jettison Cargo>"
	Send "l j " & #8 & #8 & $planet & "*"
	Pause
:SAVELANDED
	KillTrigger savelanded
	KillTrigger savenotlanded
	Send "z q m * * * c x q z s* /'I landed on planet " & $planet & " after " & (($triedagain * 100) + $triedsaveagain - 1) & " attempts.*"
	Goto :SAVEFASTDONE
:NOFASTSAVE
	KillTrigger savelanded
	KillTrigger savenotlanded
	SetVar $badsave TRUE
	Send "'Saveme failed after " & (($triedagain * 100) + $triedsaveagain - 1) & " attempts!*"
	Gosub :SYNC
	Echo "**" & ANSI_12 & "SAVEME FAILED after " & ANSI_14 & (($triedagain * 100) + $triedsaveagain - 1) & ANSI_12 & " attempts!**"
	Goto :SAVEFASTDONE
Else
	SetVar $badsave TRUE
	Send "'Saveme failed ! Cannot Call Saveme from Fedspace!*"
	Goto :SAVEFASTDONE
End
:SAVEFASTDONE
Return
# INCLUDES
Include include\Z_Strings.ts
