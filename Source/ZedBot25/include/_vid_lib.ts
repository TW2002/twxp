# Vid's Library Idea came from Archy & CareTakers coversations on include lib usasage.
# Ver 1.01
#
#-=-=-=-=-Includes-=-=-=-=-
#Include "include\_vid_lib"
#-=-=-=-=-=-=-=-=-=-=-=-=-=
#
# GoSub :_vid_lib~ADDCOMMAS
# GoSub :_vid_lib~ROUNDTO
# GoSub :_vid_lib~ANYKEY
# GoSub :_vid_lib~PAUSE
# GoSub :_vid_lib~CLEARSCREEN
# GoSub :_vid_lib~Comms_On
# GoSub :_vid_lib~Comms_Off
#
#ADDCOMMAS
# SetVar $_vid_lib~CommasAdded $CommasAdded NUMBER to be converted.
# GoSub :_vid_lib~ADDCOMMAS
# The commas will be added to the number and returned.
# Returns $_vid_lib~$CommasAdded
#
# ROUNDTO 
# SetVar $_vid_lib~roundtoval to the value to round 
# SetVar $_vid_lib~roundtodiv to the number to round by Eg: 1000 
# GoSub :_vid_lib~ROUNDTO
# Returns $_vid_lib~roundtoresult (the number rounded up) 
#
#PAUSE
#SetVar _vid_Lib~pausekey $pausekey  to change the unpause key
#GoSub :_vid_lib~PAUSE
#
:ADDCOMMAS
If ($CommasAdded < 1000)
       #do nothing
ElseIf ($CommasAdded < 1000000)
       GetLength $CommasAdded $len
       SetVar $len ($len - 3)
       CutText $CommasAdded $tmp 1 $len
       CutText $CommasAdded $tmp1 ($len + 1) 999
       SetVar $tmp $tmp & "," & $tmp1
       SetVar $CommasAdded $tmp
ElseIf ($CommasAdded <= 999999999)
       GetLength $CommasAdded $len
       SetVar $len ($len - 6)
       CutText $CommasAdded $tmp 1 $len
       SetVar $tmp $tmp & ","
       CutText $CommasAdded $tmp1 ($len + 1) 3
       SetVar $tmp $tmp & $tmp1 & ","
       CutText $CommasAdded $tmp1 ($len + 4) 999
       SetVar $tmp $tmp & $tmp1
       SetVar $CommasAdded $tmp
End
Return

:ROUNDTO
SetVar $roundtoresult $roundtoval
If ($roundtoval < 1) or ($roundtodiv < 1)
	Goto :ENDROUNDTO
End
SetVar $rtemp $roundtoval
While ($rtemp >= $roundtodiv)
	SetVar $rtemp ($rtemp - $roundtodiv)
	SetVar $rval ($rval + 1)
End
SetVar $roundtoresult ($rval * $roundtodiv)
If ($rtemp <> 0)
	SetVar $roundtoresult ($roundtoresult + $roundtodiv)
End
:ENDROUNDTO
Return
# ANYKEY
:ANYKEY
Echo "*" & ANSI_10 & "Press any key to continue..."
GetConsoleInput $anykey SINGLEKEY
Return
# PAUSE
:PAUSE
If ($pausekey = "") or ($pausekey = "0")
	SetVar $pausekey #42
End
Echo "**" & ANSI_11 & "[5m" & "PAUSED: "  & "[0m" & ANSI_15 & "Press " & ANSI_12 & "[" & ANSI_14 & $pausekey & ANSI_12 & "]" & ANSI_15 & " to continue...**"
SetTextOutTrigger paus :UNPAUSEKEYPRESSED $pausekey
Pause
:UNPAUSEKEYPRESSED
KillTrigger paus
Echo "**" & ANSI_13 & "[5m" & "UNPAUSED: "  & "[0m" & ANSI_15 & "Continuing..."
Return
# CLEARSCREEN 
:CLEARSCREEN
Echo "[2J"
Echo "[1;1H"
Return
# COMMS_ON
:COMMS_ON
     Send "|"
     KillAllTriggers
     WaitOn "all messages."
     GetWord CURRENTLINE $messages "1"
     IF ($messages <> "Displaying")
     Send "|"
     KillAllTriggers
     WaitOn "all messages."
#     WaitOn "elp"
     END
Return
# COMMS_OFF
:COMMS_OFF
     Send "|"
     KillAllTriggers
     WaitOn "all messages."
     GetWord CURRENTLINE $messages "1"
     IF ($messages <> "Silencing")
     Send "|"
     KillAllTriggers
     WaitOn "all messages."
#     WaitOn "elp"
     END
Return

:DIAL
Echo "**" ANSI_10 "Creating list... [" & ANSI_15 & #249  & ANSI_10 & "]" 
SetVar $meter "0"
SetArray $dial 8
SetVar $dial[1] "/"
SetVar $dial[2] "-"
SetVar $dial[3] "\"
SetVar $dial[4] #179
SetVar $dial[5] "/"
SetVar $dial[6] "-"
SetVar $dial[7] "\"
SetVar $dial[8] #179
#SetArray $isadupe SECTORS
SetVar $unsortedcount "0"
SetVar $keepcount "0"
SetVar $count "1"
# in While loop
	SetVar $count ($count + 1)
	SetVar $meter ($meter + 1)
	If ($meter > 8)
		SetVar $meter 1
	End 
	Echo #27 & "[2D" & ANSI_15 & $dial[$meter] & #27 & "[1C"
	Send #27
# end of loop
Return


