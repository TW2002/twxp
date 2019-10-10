# BACKDOORS 
# Gosub $Z_Backdoors~BACKDOORS 
# Returns $Z_Backdoors~sdbackdoor 
# Returns $Z_Backdoors~rybackdoor 
# Returns $Z_Backdoors~acbackdoor 
# Returns $Z_Backdoors~tebackdoor 
:BACKDOORS
If (STARDOCK > 0) and (STARDOCK <= SECTORS)
	SetVar $i 1
	While ($i <= SECTOR.BACKDOORCOUNT[STARDOCK])
		If (SECTOR.BACKDOORS[STARDOCK][$i] > 10)
			SetVar $sdbackdoor SECTOR.BACKDOORS[STARDOCK][$i]
			SetVar $i (SECTOR.BACKDOORCOUNT[STARDOCK] + 1)
		End
		SetVar $i ($i + 1)
	End
End
If (RYLOS > 0) and (RYLOS <= SECTORS)
	SetVar $i 1
	While ($i <= SECTOR.BACKDOORCOUNT[RYLOS])
		If (SECTOR.BACKDOORS[RYLOS][$i] > 10)
			SetVar $rybackdoor SECTOR.BACKDOORS[RYLOS][$i]
			SetVar $i (SECTOR.BACKDOORCOUNT[RYLOS] + 1)
		End
		SetVar $i ($i + 1)
	End
End
If (ALPHACENTAURI > 0) and (ALPHACENTAURI <= SECTORS)
	SetVar $i 1
	While ($i <= SECTOR.BACKDOORCOUNT[ALPHACENTAURI])
		If (SECTOR.BACKDOORS[ALPHACENTAURI][$i] > 10)
			SetVar $acbackdoor SECTOR.BACKDOORS[ALPHACENTAURI][$i]
			SetVar $i (SECTOR.BACKDOORCOUNT[ALPHACENTAURI] + 1)
		End
		SetVar $i ($i + 1)
	End
End
SetVar $i 1
While ($i <= SECTOR.BACKDOORCOUNT[1])
	If (SECTOR.BACKDOORS[1][$i] > 10)
		SetVar $tebackdoor SECTOR.BACKDOORS[1][$i]
		SetVar $i (SECTOR.BACKDOORCOUNT[1] + 1)
	End
	SetVar $i ($i + 1)
End
Return
