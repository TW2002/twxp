# Z_GetPlayers
#
# Gosub :Z_GetPlayers~GETPLAYERS 
# Returns $Z_GetPlayers~menu_count 
# Returns $Z_GetPlayers~menu_name[$Z_GetPlayers~menu_count]
:GETPLAYERS
SetTextTrigger scan :SCAN
If ($index = 0)
	Send "#/"
End
Pause
:SCAN
KillTrigger scan
SetVar $index ($index + 1)
SetVar $line[$index] CURRENTANSILINE
GetWordPos $line[$index] $pos #179
IF ($pos = 0)
	Goto :GETPLAYERS
End
SetVar $count 1
While ($count <= $index)
	GetText $line[$count] $pname[$count]  "36m" #27
	SetVar $count ($count + 1)
End
SetVar $count 1
While ($count <= $index)
	If ($pname[$count] <> "")
		SetVar $menu_count ($menu_count + 1)
		SetVar $menu_name[$menu_count] $pname[$count]
		LowerCase $menu_name[$menu_count]
	End
	SetVar $count ($count + 1)
End
Return
