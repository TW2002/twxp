SystemScript
# Title: Z-Authorise
# Author: Zed
# Copyright (c) 2010 by Archibald H. Vilanos III
# All Rights Reserved.
# Script Authorisation.
SetVar $version "1.07"
SetVar $scriptname "Z-Authorise"
SetVar $scripttitle "Zed's Script Authoriser"
SetVar $tagline "*" & ANSI_12 & "-=[" & ANSI_14 & $scripttitle & " v" & $version & "+" & ANSI_12 & "]=-"
Gosub :CHECKONCE
# AUTHORISE 
#
# Enter the BOT NAME to lock to.
SetVar $bot ""
# Enter the NUMBER of NAMES to register. 
SetVar $names 1
# Enter the LICENSEE on the next line between the "" (leave the first one blank for unrestricted). 
SetVar $restrictto[1] ""
SetVar $restrictto[2] ""
SetVar $restrictto[3] ""
SetVar $restrictto[4] ""
# Enter the Expiry date - Use time format d m yyyy h 
SetVar $restrictdate ""
# ---------------------------------------------------
# !!! DO NOT EDIT BELOW !!!
# ---------------------------------------------------
SetVar $license ""
If ($restrictto[1] = "") or ($restrictto[1] = "0")
	If ($bot = "") or ($bot = "0")
		Goto :AUTHORISED
   End
End
SetVar $license (ANSI_10 & "         Licensed to: " & ANSI_15 & $restrictto[1])
SetVar $restricted LOGINNAME
LoadVar $z_botname
Read GAMENAME & ".stbot" $botname 1
UpperCase $restricted
SetVar $okay TRUE
If ($bot <> $z_botname) or ($bot <> $botname)
	If ($bot <> "")
		SetVar $okay FALSE
	End
End
If ($okay = TRUE)
	If ($restrictto[1] <> "")
		SetVar $okay FALSE
	End
	SetVar $x 1
	While ($x <= $names) 
		UpperCase $restrictto[$x]
		If ($restricted = $restrictto[$x])
			SetVar $okay TRUE
			SetVar $x ($names + 1)
		End
		SetVar $x ($x + 1)
	End
Else
	SetVar $okay FALSE
End
SetVar $bot ""
SetVar $botname ""
SetVar $z_botname ""
If ($restrictdate <> "") and ($restrictdate <> "0")
	SetVar $Z_Dates~date $restrictdate
	Gosub :Z_Dates~DAYS
	SetVar $endhours $Z_Dates~hours
	GetTime $now "d m yyyy h"
	SetVar $Z_Dates~date $now
	Gosub :Z_Dates~DAYS
	SetVar $nowhours $Z_Dates~hours
	If ($nowhours >= $endhours)
		SetVar $okay FALSE
	End
	SetVar $nowhours ""
	SetVar $endhours ""
	SetVar $now ""
End
If ($okay = FALSE)
   Echo "***" & ANSI_14 & "Sorry, this script is RESTRICTED !***"
   Halt
End
:AUTHORISED
SetVar $tagline ($tagline & $license)
SetVar $x 1
While ($x <= $names) 
	SetVar $restrictto[$x] ""
	SetVar $x ($x + 1)
End
SetVar $restricted ""
# End Authorise 
Gosub :CLEARSCREEN
Echo $tagline
Echo "*" & ANSI_12 & "------------------------------------------------------------------------------**"
:START
SetTextTrigger go :GO "[Z]!AUTHORISE![Z]"
SetTextTrigger stop1 :STOP "[Z]!BOTNAME![Z]"
Pause
:STOP
KillAllTriggers
Halt
:GO
KillTrigger stop1
GetLength LOGINNAME $total
SetVar $count "1"
SetVar $hash $total
While ($count <= $total)
	CutText LOGINNAME $a $count 1
	GetCharCode $a $b
	SetVar $hash ($hash + $b)
	SetVar $count ($count + 1)
End
SetVar $response (SECTORS + STARDOCK + RYLOS + ALPHACENTAURI + $hash)
PROCESSIN 1 "[Z]!" & $response & "![Z]"
SetVar $response ($response + 642)
PROCESSIN 1 "[Z]!" & $response & "![Z]"
SetVar $response ""
SetVar $hash ""
SetVar $count ""
SetVar $total ""
SetVar $a ""
SetVar $b ""
Goto :START
# CHECKONCE
# Set the variable $scriptname to the name of the script to test for.
:CHECKONCE
   SetVar $script_name $scriptname & "."
   ListActiveScripts $scripts
   SetVar $count 1
   SetVar $instances 0
   UpperCase $script_name
   While ($count <= $scripts)
      UpperCase $scripts[$count]
      GetWordPos $scripts[$count] $pos $script_name
      If ($pos > 0)
         SetVar $instances ($instances + 1)
      End
      SetVar $count ($count + 1)
   End
   If ($instances > 1)
      Echo "**" & ANSI_12 & "Already running script " & $script_name & "!**"
      Halt
   End
   SetArray $scripts 0
Return
# CLEARSCREEN
:CLEARSCREEN
     Echo "[2J"
Return
# INCLUDES 
INCLUDE include\Z_Dates.ts

# ZeD Compiled: Mon 10/01/2011 -  5:10:11.14 
# ZeD Compiled: Mon 24/01/2011 -  1:16:08.29 
# ZeD Compiled: Fri 28/01/2011 - 14:15:43.87 
# ZeD Compiled: Sun 30/01/2011 -  6:57:42.96 
# ZeD Compiled: Fri 22/04/2011 -  0:32:03.35 
# ZeD Compiled: Fri 22/04/2011 -  1:19:06.18 
# ZeD Compiled: Mon 15/08/2011 - 11:16:15.00 
# ZeD Compiled: Mon 15/08/2011 - 21:39:02.11 
# ZeD Compiled: Sat 20/08/2011 -  7:43:07.65 
# ZeD Compiled: Sat 20/08/2011 -  7:45:12.71 
# ZeD Compiled: Thu 22/03/2012 -  2:26:19.93 
# ZeD Compiled: Wed 13/06/2012 -  0:36:11.59 
# ZeD Compiled: Sat 27/07/2013 -  2:06:33.76 
# ZeD Compiled: Fri 09/08/2013 - 23:08:00.21 
# ZeD Compiled: Sun 11/08/2013 - 13:21:53.18 
# ZeD Compiled: Tue 20/08/2013 -  2:03:00.33 
# ZeD Compiled: Mon 26/08/2013 - 17:05:16.99 
# ZeD Compiled: Mon 26/08/2013 - 17:06:34.60 
# ZeD Compiled: Sun 01/12/2013 - 22:03:12.71 
# ZeD Compiled: Sat 04/01/2014 -  1:58:36.69 
