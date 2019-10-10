# INCLUDE: Z_Auth 
# Gosub :Z_Auth~CHECK 
# Version 1.05 
#
:CHECK
GetLength LOGINNAME $total
SetVar $count "1"
SetVar $hash $total
While ($count <= $total)
	CutText LOGINNAME $a $count 1
	GetCharCode $a $b
	SetVar $hash ($hash + $b)
	SetVar $count ($count + 1)
End
SetVar $response (SECTORS + STARDOCK + RYLOS + ALPHACENTAURI + $hash + 642)
SetTextTrigger ok :OK "[Z]!" & $response & "![Z]"
SetDelayTrigger bad :BAD 1500
PROCESSIN 1 "[Z]!AUTHORISE![Z]"
Pause
:BAD
KillAllTriggers
If ($allowpublic <> TRUE)
	Echo "***" & ANSI_14 & "Sorry, this script is RESTRICTED !***"
	Halt
End
Goto :OK2
:OK
KillAllTriggers
If ($allowpublic = TRUE)
	SetVar $k TRUE
End
:OK2
SetVar $response ""
SetVar $hash ""
SetVar $count ""
SetVar $total ""
SetVar $a ""
SetVar $b ""
SetVar $allowpublic ""
Return
