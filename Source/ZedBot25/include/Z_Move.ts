# INCLUDE: Z_Move 
# Gosub :Z_Move~CHARGE 
# Gosub :Z_Move~MOW 
#
# SetVar $Z_Move~target (Sector) 
# SetVar $Z_Move~z_wave 
# SetVar $Z_Move~z_dockport (TRUE or FALSE) 
# For Mow Mode: 
# SetVar $Z_Move~z_mowfigs  (to drop) 
# SetVar $Z_Move~z_mowmines (to drop) 
# SetVar $Z_Move~z_mowlimps (to drop) 
#
:CHARGE
SetVar $mode "CHARGE"
If ($target >= 1) and ($target <= SECTORS)
	Gosub :MOVE
End
Return
:MOW
SetVar $mode "MOW"
If ($target >= 1) and ($target <= SECTORS)
	Gosub :MOVE
End
Return
:MOVE
SetVar $destination $target
Gosub :GETCOURSE
If ($badpath = TRUE)
	Goto :ENDMOVE
End
SetVar $leg 2
SetVar $mowmacro "q q q * "
While ($leg <= $mowcourselen)
	SetVar $mowmacro ($mowmacro & "m " & $mowcourse[$leg] & "*    ")
	If (($mowcourse[$leg] > 10) and ($mowcourse[$leg] <> STARDOCK))
		SetVar $mowmacro ($mowmacro & "za" & $z_wave & "* *  ")
	end
	If (($mode = "MOW") and ($z_mowfigs > 0) and ($mowcourse[$leg] > 10) and ($mowcourse[$leg] <> STARDOCK) and ($leg > 1))
		SetVar $mowmacro ($mowmacro & "fz" & $z_mowfigs & "*cqz*d")
		SetSectorParameter $mowcourse[$leg] "FIGSEC" TRUE
	end
	If (($mode = "MOW") and ($z_mowmines > 0) and ($mowcourse[$leg] > 10) and ($mowcourse[$leg] <> STARDOCK) and ($leg > 1))
		SetVar $mowmacro ($mowmacro & "h 1 z" & $z_mowmines & " * zc* ")
		SetSectorParameter $mowcourse[$leg] "MINESEC" TRUE
	end
	If (($mode = "MOW") and ($z_mowlimps > 0) and ($mowcourse[$leg] > 10) and ($mowcourse[$leg] <> STARDOCK) and ($leg > 1))
		SetVar $mowmacro ($mowmacro & "h 2 z" & $z_mowlimps & " * zc* ")
		SetSectorParameter $mowcourse[$leg] "LIMPSEC" TRUE
	end
	SetVar $leg ($leg + 1)
End
Send $mowmacro
If ($z_dockport = TRUE)
	If ($target = STARDOCK) and (PORT.EXISTS[$target] = TRUE)
	   Send "p sg yg q"
	ElseIf (PORT.EXISTS[$target] = TRUE)
	   Send "P *"
	Else
		Send "*"
	End
Else
	Send "*"
End
:ENDMOVE
Return
:GETCOURSE
#---------------------------------------------------------------
# Getcourse $mowcourse CURRENTSECTOR $destination
# If ($mowcourse <> "-1")
#	SetVar $mowcourselen ($mowcourse + 1)
#	Goto :GETCOURSEDONE
# End
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
