# INCLUDE: Z_Avoids 
#
# Gosub :Z_Avoids~AVOIDADJ 
# Gosub :Z_Avoids~UNAVOIDADJ 
#
# AVOIDADJ 
:AVOIDADJ
SetVar $cursec CURRENTSECTOR
If ($cursec > 0) and ($cursec <= SECTORS)
	SetVar $i 1
	SetVar $warps SECTOR.WARPCOUNT[$cursec]
	IsNumber $num $warps
	If ($num = 1)
		Send "^"
		WaitFor ":"
		While ($i <= $warps)
			Send "s " & SECTOR.WARPS[$cursec][$i] & "* "
			SetVar $i ($i + 1)
		End
		Send "q"
		WaitFor ": ENDINTERROG"
	End
End
Return
# UNAVOIDADJ 
:UNAVOIDADJ
SetVar $cursec CURRENTSECTOR
If ($cursec > 0) and ($cursec <= SECTORS)
	SetVar $i 1
	SetVar $warps SECTOR.WARPCOUNT[$cursec]
	IsNumber $num $warps
	If ($num = 1)
		Send "^"
		WaitFor ":"
		While ($i <= $warps)
			Send "c " & SECTOR.WARPS[$cursec][$i] & "* "
			SetVar $i ($i + 1)
		End
		Send "q"
		WaitFor ": ENDINTERROG"
	End
End
Return
