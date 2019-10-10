# INCLUDE: Z_Surround 
#
# Gosub :Z_Surround~SURROUND 
#
# SURROUND 
# SetVar $Z_Surround~surroundwave to the attack wave 
# SetVar $Z_Surround~surroundowner to "c" or "p" (optional) 
# SetVar $Z_Surround~surroundfigs to number of figs to drop (optional) 
# SetVar $Z_Surround~surroundmines to number of mines to drop (optional) 
# SetVar $Z_Surround~surroundlimps to number of limps to drop (optional) 
# SetVar $Z_Surround~suppressss to TRUE to suppress SS output (optional) 
# SetVar $Z_Surround~forced to ignore limpets in sector (optional) 
# Call from the COMMAND prompt. 
:SURROUND
Send "*"
send "sd"
Gosub :SYNC
If ($surroundowner = "") or ($surroundowner = "0")
	SetVar $surroundowner "c"
End
If ($surroundfigs = "") or ($surroundfigs = "0")
	SetVar $Z_Surround~surroundfigs 1
End
SetVar $surround CURRENTSECTOR
SetVar $warpcount SECTOR.WARPCOUNT[$surround]
SetVar $count 1
SetVar $ssoutput "Zed's Surround*-----------------*"
While ($count <= $warpcount)
	SetVar $adjacent SECTOR.WARPS[$surround][$count]
	SetVar $anomoly SECTOR.ANOMOLY[$adjacent]
	SetVar $density SECTOR.DENSITY[$adjacent]
	SetVar $navhaz SECTOR.NAVHAZ[$adjacent]
	GetSectorParameter $adjacent "FIGSEC" $isfigged
	If ($isfigged <> TRUE) and ($density < 500) and ($navhaz <= 10) and ($adjacent > 10) and ($adjacent <> STARDOCK)
		If ($anomoly = TRUE)
			GetSectorParameter $adjacent "LIMPSEC" $islimped
			If ($islimped <> TRUE) and ($forced <> TRUE)
				SetVar $Z_Strings~padchar " "
				SetVar $Z_Strings~padlen 5
				SetVar $Z_Strings~unpadded $adjacent
				Gosub :Z_Strings~PAD
				SetVar $ssoutput ($ssoutput & " Sector: " & $Z_Strings~padded & " NOT visited - detected anomalies.*")
				SetSectorParameter $adjacent "FIGSEC" TRUE
				Goto :SURROUNDNOTOK
			End
		End
		SetTextLineTrigger sok :SURROUNDOK $adjacent & " > "
		Send "^f" & $adjacent & "*" & $surround & "*"
		Pause
:SURROUNDOK
		GetWord CURRENTLINE $returnsurround 3
		Send "q"
		If ($returnsurround = $surround)
			If ($surroundmines > 0) and ($surroundlimps > 0)
				Send "m " & $adjacent & "*    za" & $surroundwave & "* *  fz" & $surroundfigs & "*" & $surroundowner & "qz*d* h 1 z" & $surroundmines & " * z" & $surroundowner & "* h 2 z" & $surroundlimps & " * z" & $surroundowner & "* <za" & $surroundwave & "* *  "
				SetSectorParameter $adjacent "MINESEC" TRUE
				SetSectorParameter $adjacent "LIMPSEC" TRUE
			ElseIf ($surroundmines > 0)
				Send "m " & $adjacent & "*    za" & $surroundwave & "* *  fz" & $surroundfigs & "*" & $surroundowner & "qz*d* h 1 z" & $surroundmines & " * z" & $surroundowner & "* <za" & $surroundwave & "* *  "
				SetSectorParameter $adjacent "MINESEC" TRUE
			ElseIf ($surroundlimps > 0)
				Send "m " & $adjacent & "*    za" & $surroundwave & "* *  fz" & $surroundfigs & "*" & $surroundowner & "qz*d* h 2 z" & $surroundlimps & " * z" & $surroundowner & "* <za" & $surroundwave & "* *  "
				SetSectorParameter $adjacent "LIMPSEC" TRUE
			Else
				Send "m " & $adjacent & "*    za" & $surroundwave & "* *  fz" & $surroundfigs & "*" & $surroundowner & "qz*d*<za" & $surroundwave & "* *  "
			End
			SetVar $Z_Strings~padchar " "
			SetVar $Z_Strings~padlen 5
			SetVar $Z_Strings~unpadded $adjacent
			Gosub :Z_Strings~PAD
			SetVar $ssoutput ($ssoutput & " Sector: " & $Z_Strings~padded & " Visited     - now figged.*")
			SetSectorParameter $adjacent "FIGSEC" TRUE
		Else
			SetVar $Z_Strings~padchar " "
			SetVar $Z_Strings~padlen 5
			SetVar $Z_Strings~unpadded $adjacent
			Gosub :Z_Strings~PAD
			SetVar $ssoutput ($ssoutput & " Sector: " & $Z_Strings~padded & " NOT visited - detected one-way.*")
		End
:SURROUNDNOTOK
	Else
		If ($density > 499)
			SetVar $Z_Strings~padchar " "
			SetVar $Z_Strings~padlen 5
			SetVar $Z_Strings~unpadded $adjacent
			Gosub :Z_Strings~PAD
			SetVar $ssoutput ($ssoutput & " Sector: " & $Z_Strings~padded & " NOT visited - density levels too high.*")
		ElseIf ($navhaz > 10)
			SetVar $Z_Strings~padchar " "
			SetVar $Z_Strings~padlen 5
			SetVar $Z_Strings~unpadded $adjacent
			Gosub :Z_Strings~PAD
			SetVar $ssoutput ($ssoutput & " Sector: " & $Z_Strings~padded & " NOT visited - navhaz detected.*")
		ElseIf ($adjacent <= 10) or ($adjacent = STARDOCK)
			SetVar $Z_Strings~padchar " "
			SetVar $Z_Strings~padlen 5
			SetVar $Z_Strings~unpadded $adjacent
			Gosub :Z_Strings~PAD
			SetVar $ssoutput ($ssoutput & " Sector: " & $Z_Strings~padded & " NOT visited - Fedspace.*")
		ElseIf ($isfigged = TRUE)
			SetVar $Z_Strings~padchar " "
			SetVar $Z_Strings~padlen 5
			SetVar $Z_Strings~unpadded $adjacent
			Gosub :Z_Strings~PAD
			SetVar $ssoutput ($ssoutput & " Sector: " & $Z_Strings~padded & " NOT visited - already figged.*")
		End
	End
	SetVar $count ($count + 1)
End
If ($suppressss <> TRUE)
	Send "'*"
	Send "------------------------------------------------------------*"
	Send $ssoutput
	Send "------------------------------------------------------------**"
End
Return
# SYNC 
:SYNC
SetTextTrigger av :AV "Average Interval Lag:"
Send "@"
Pause
:AV
KillTrigger av
Return
# INCLUDES 
Include include\Z_Strings.ts
