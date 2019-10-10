# Z_GetPlayers
#
# Gosub :Z_GetPlayers~GETPLAYERS 
# Returns $Z_GetPlayers~menu_count 
# Returns $Z_GetPlayers~menu_name[$Z_GetPlayers~menu_count]
# Returns $Z_GetPlayers~menu_corp[$Z_GetPlayers~menu_count]
:GETPLAYERS
SetVar $menu_count 0
SetArray $menu_name 0
SetVar $index 0
SetArray $menu_corp 0
:GETPLAYERS2
SetTextLineTrigger scan :SCAN
If ($index = 0)
	Send "#/"
End
Pause
:SCAN
KillTrigger scan
SetVar $index ($index + 1)
SetVar $line[$index] CURRENTLINE
GetWordPos $line[$index] $pos #179
IF ($pos = 0)
	Goto :GETPLAYERS2
Else
	SetVar $index ($index - 1)
End
Gosub :RANKS
SetVar $count 1
SetVar $pcount 0
While ($count <= $index)
	SetVar $i 1
	While ($i <= $ranks)
		GetWordPos $line[$count] $pos $ranks[$i]
		If ($pos > 0)
			StripText $line[$count] $ranks[$i]
			SetVar $pcount ($pcount + 1)
			GetWord $line[$count] $pname[$pcount] 1
			GetText $line[$count] $corp[$pcount] "[" "]"
			SetVar $i $ranks
		End
		SetVar $i ($i + 1)
	End
	SetVar $count ($count + 1)
End
SetVar $count 1
While ($count <= $pcount)
	If ($pname[$count] <> "")
		SetVar $menu_count ($menu_count + 1)
		SetVar $menu_name[$menu_count] $pname[$count]
		LowerCase $menu_name[$menu_count]
		SetVar $menu_corp[$menu_count] $corp[$count]
	End
	SetVar $count ($count + 1)
End
#Send "*"
SetVar $index 0
Return

:RANKS
setArray $ranks 46
SetVar $ranks 46
setVar $ranks[1] 	"Civilian"
setVar $ranks[2] 	"Private 1st Class"
setVar $ranks[3] 	"Private"
setVar $ranks[4] 	"Lance Corporal"
setVar $ranks[5] 	"Corporal"
setVar $ranks[6] 	"Staff Sergeant"
setVar $ranks[7] 	"Gunnery Sergeant"
setVar $ranks[8] 	"1st Sergeant"
setVar $ranks[9] 	"Sergeant Major"
setVar $ranks[10]	"Sergeant"
setVar $ranks[11] 	"Annoyance"
setVar $ranks[12] 	"Nuisance 3rd Class"
setVar $ranks[13] 	"Nuisance 2nd Class"
setVar $ranks[14] 	"Nuisance 1st Class"
setVar $ranks[15] 	"Menace 3rd Class"
setVar $ranks[16] 	"Menace 2nd Class"
setVar $ranks[17] 	"Menace 1st Class"
setVar $ranks[18] 	"Smuggler 3rd Class"
setVar $ranks[19] 	"Smuggler 2nd Class"
setVar $ranks[20] 	"Smuggler 1st Class"
setVar $ranks[21] 	"Smuggler Savant"
setVar $ranks[22] 	"Robber"
setVar $ranks[23] 	"Terrorist"
setVar $ranks[24] 	"Infamous Pirate"
setVar $ranks[25] 	"Notorious Pirate"
setVar $ranks[26] 	"Dread Pirate"
setVar $ranks[27] 	"Pirate"
setVar $ranks[28] 	"Galactic Scourge"
setVar $ranks[29] 	"Enemy of the State"
setVar $ranks[30] 	"Enemy of the People"
setVar $ranks[31] 	"Enemy of Humankind"
setVar $ranks[32] 	"Heinous Overlord"
setVar $ranks[33] 	"Prime Evil"
setVar $ranks[34] 	"Chief Warrant Officer"
setVar $ranks[35] 	"Warrant Officer"
setVar $ranks[36] 	"Ensign"
setVar $ranks[37] 	"Lieutenant J.G."
setVar $ranks[38] 	"Lieutenant Commander"
setVar $ranks[39] 	"Lieutenant"
setVar $ranks[40] 	"Commander"
setVar $ranks[41] 	"Captain"
setVar $ranks[42] 	"Commodore"
setVar $ranks[43] 	"Rear Admiral"
setVar $ranks[44] 	"Vice Admiral"
setVar $ranks[45] 	"Fleet Admiral"
setVar $ranks[46] 	"Admiral"
Return
