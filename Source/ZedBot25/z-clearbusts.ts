# Title: Z-ClearBusts
# Author: Zed
# Copyright (c) 2010 by Archibald H. Vilanos III
# All Rights Reserved.
# Clears Busts according to a list provided by Swath 
# Requires Z-Login to fetch the Clear Bust Days from the T Menu Game Settings List. 
SetVar $version "1.01"
SetVar $scripttitle "Zed's Clear Busts"
SetVar $tagline "*" & ANSI_12 &"-=["& ANSI_14 & $scripttitle & " v"& $version & ANSI_12 &"]=-"
Gosub :CLEARSCREEN
Echo $tagline
Echo "*" & ANSI_12 &#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&"*"

LoadVar $bustclear
If ($bustclear = "0") or ($bustclear = "")
	Echo "*" & ANSI_4 & "Use Zed's Login Script to avoid the bust days question.**"
:GETBUSTDAYS
	Echo "*" & ANSI_15 & "How often (in days) are the busts cleared (Q to Quit)?:"
	GetConsoleInput $value
	If ($value = "q") or ($value = "Q")
		Goto :FINISH
	End
	IsNumber $isnum $value
	If ($isnum = TRUE)
		If ($value >= 1)
			SetVar $bustclear $value
		Else
			Echo "*" & ANSI_12 & "Must be a number larger than zero.*"
			Goto :GETBUSTDAYS
		End
	Else
		Echo "*" & ANSI_12 & "Must be a number larger than zero.*"
		Goto :GETBUSTDAYS
	End
End
SetVar $filename GAMENAME & "_bustlist.txt"
SetVar $oldfilename GAMENAME & "_bustlist.old"
:NOTREADY
FileExists $fileexist $filename
If ($fileexist <> TRUE)	
	Echo "**" & ANSI_14 & $filename & ANSI_12 & " does NOT exist in the TWX Root."
	Echo "*" & ANSI_12 & "Please create this file in your TWX Root and copy and paste"
	Echo "*" & ANSI_12 & "the SWATH bust list into it.. Note that this file will be"
	Echo "*" & ANSI_12 & "renamed to " & ANSI_14 & $oldfilename & ANSI_12 & " after use."
	Echo "**" & ANSI_12 & "Press [" & ANSI_15 & "C" & ANSI_12 & "] to continue or [" & ANSI_15 & "Q" & ANSI_12 & "] to QUIT."
:READYFILE
	GetConsoleInput $choice SINGLEKEY
	UpperCase $choice
	If ($choice = "C")
			Goto :NOTREADY
	ElseIf ($choice = "Q")
		Goto :FINISH
	Else
		Goto :READYFILE
	End
End
ReadToArray $filename $busts
If ($busts = 0)
	Echo "**" & ANSI_12 & "NO BUSTS FOUND! Exiting...*"
	Goto :FINISH
End
If ($busts = 1)
	GetWord $busts[1] $bustsector 1
	IsNumber $isnum $bustsector
	If ($isnum = FALSE) or ($bustsector = "0")
		Echo "**" & ANSI_12 & "NO BUSTS FOUND! Exiting...*"
		Goto :FINISH
	End
End
SetVar $clearbustcount 0
SetVar $count 1
SetVar $linecount 1
Echo "*" & ANSI_10 & "Bust cleared for sectors:*" & ANSI_15
While ($count <= $busts)
	GetWord $busts[$count] $bustsector 1
	GetWord $busts[$count] $bustdays 2
	IsNumber $isnum $bustsector
	IsNumber $isnum2 $bustdays
	If ($isnum = TRUE) and ($isnum2 = TRUE)
		If ($bustsector > 0) and ($bustsector <= SECTORS)
			If ($bustdays >= $bustclear)
				SetSectorParameter $bustsector "BUSTED" ""
				SetVar $clearbustcount ($clearbustcount + 1)
				Echo $bustsector & " "
				SetVar $linecount ($linecount + 1)
				If ($linecount > 13)
					Echo "*"
					SetVar $linecount 1
				End
			End
		End
	End
	SetVar $count ($count + 1)
End
Echo "**" & ANSI_15 & "Finished clearing busts... " & ANSI_10 & $clearbustcount & ANSI_15 & " cleared...*"
Delete $oldfilename
Rename $filename $oldfilename
Echo "*" & ANSI_14 & "Bustfile " & $filename & " renamed to " & $oldfilename & ".**"
Sound ding
:FINISH
Send "*"
Halt
# CLEARSCREEN
:CLEARSCREEN
     Echo "[2J"
Return
