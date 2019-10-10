# Edited by archy to allow for the zbot on command. 
:terra_kits
setvar $loop "0"
#Echo "[2J"
:terra_kit
   killalltriggers
   setdelaytrigger terra0 :terra0 10000
   send #145
   waiton #145 & #8
   killalltriggers
   getwordpos currentline $terra_prompt "Colonists"
if ($terra_prompt = 0)
	echo ansi_13 "MUST BE AT TERRA PROMPT*"
	send #145
	return
end
killalltriggers
if ($loop = "0")
setdelaytrigger terra0 :terra0 10000
settexttrigger pscan :pscan "PlScn"
settexttrigger pro :pro "(L)eave or (T)ake"
send "/"
pause
:pscan
killalltriggers
gettext currentline $pscan "PlScn" "LRS"
striptext $pscan " "
striptext $pscan #179
uppercase $pscan
    if ($pscan = "YES")
       setvar $land "l 1* "
    else
        setvar $land "l "
    end
add $loop 1
end
:pro
killalltriggers
echo "*"
echo "*"& ansi_12 "                      -=(" ansi_14 " Terra Survival Toolkit" ansi_12 " )=-*"
echo "*"& ansi_12 "             -=(" ansi_14 " Check for Twarp Before using Twarp Macros" ansi_12 " )=-*"
echo ansi_13 "     ----------------------------------------------------------------------*"
echo ansi_13 "     <" ansi_10 "1" ansi_13 ">  " ansi_14 "display Terra sector" ansi_11 ", land    " ansi_13 "<" ansi_10 "5" ansi_13 ">  " ansi_14 "check twarp lock" ansi_11 ", land*"
echo ansi_13 "     <" ansi_10 "2" ansi_13 ">  " ansi_14 "holoscan" ansi_11 ", land                " ansi_13 "<" ansi_10 "6" ansi_13 ">  " ansi_14 "lift, twarp out*"
echo ansi_13 "     <" ansi_10 "3" ansi_13 ">  " ansi_14 "density scan" ansi_11 ", land            " ansi_13 "<" ansi_10 "7" ansi_13 ">  " ansi_14 "lift, lock tow, twarp out*"
echo ansi_13 "     <" ansi_10 "4" ansi_13 ">  " ansi_14 "get xport list" ansi_11 ", land          " ansi_13 "<" ansi_10 "8" ansi_13 ">  " ansi_14 "xport" ansi_11 ", land*"
echo ansi_13 "     <" ansi_10 "A" ansi_13 ">  " ansi_14 "set avoid" ansi_11 "(Interrogation mode) " ansi_13 "<" ansi_10 "E" ansi_13 ">  " ansi_14 "lift, cloak out*"
echo ansi_13 "     <" ansi_10 "B" ansi_13 ">  " ansi_14 "clear all voids" ansi_11 ", land         " ansi_13 "<" ansi_10 "F" ansi_13 ">  " ansi_14 "C U Y (enable t-warp)" ansi_11 " ,land*"
echo ansi_13 "     <" ansi_10 "C" ansi_13 ">  " ansi_14 "plot course" ansi_11 ", land             " ansi_13 "<" ansi_10 "G" ansi_13 ">  " ansi_14 "toggle c n 9*"
echo ansi_13 "     <" ansi_10 "D" ansi_13 ">  " ansi_14 "get corpie locations" ansi_11 ", land    " ansi_13 "<" ansi_10 "H" ansi_13 ">  " ansi_14 "xport, twarp out*"
echo ansi_13 "     <" ansi_10 "#" ansi_13 ">  " ansi_14 "Check Who's Online" ansi_11 "            " ansi_13 "<" ansi_10 "I" ansi_13 ">  " ansi_14 "Lift, charge out*"
echo ansi_13 "      " ansi_10 " " ansi_13 "   " ansi_14 "                  " ansi_11 "            " ansi_13 "<" ansi_10 "Z" ansi_13 ">  " ansi_14 "C B Y and Die*"
echo "*"
echo ansi_13 "     <" ansi_10 "Q" ansi_13 ">  " ansi_14 "Quit  - " & ANSI_12 & " and Continue Login in Sector 1*"
echo ansi_13 "     ----------------------------------------------------------------------*"
:ask_terra
Echo "*" & ANSI_10 & "     Your choice?  ("& ANSI_15 #34 ANSI_14 &"!"&  ANSI_15 #34 ANSI_10 &" to Abort Login) "
# Added by Archy 
KillAllTriggers
If ($z_botname <> "") and ($z_botname <> "0")
	SetTextTrigger loadbot :LOADZBOT $z_botname & " " & "zbot on"
End
SetTextOutTrigger a1 :A1 "1"
SetTextOutTrigger a2 :A2 "2"
SetTextOutTrigger a3 :A3 "3"
SetTextOutTrigger a4 :A4 "4"
SetTextOutTrigger a5 :A5 "5"
SetTextOutTrigger a6 :A6 "6"
SetTextOutTrigger a7 :A7 "7"
SetTextOutTrigger a8 :A8 "8"
SetTextOutTrigger a9 :A9 "a"
SetTextOutTrigger a10 :A10 "b"
SetTextOutTrigger a11 :A11 "c"
SetTextOutTrigger a12 :A12 "d"
SetTextOutTrigger a13 :A13 "#"
SetTextOutTrigger a14 :A14 "e"
SetTextOutTrigger a15 :A15 "f"
SetTextOutTrigger a16 :A16 "g"
SetTextOutTrigger a17 :A17 "h"
SetTextOutTrigger a18 :A18 "z"
SetTextOutTrigger a19 :A19 "q"
SetTextOutTrigger a20 :A20 "!"
SetTextOutTrigger a21 :A21 "i"
Pause
:A1
SetVar $choice "1"
Goto :ENDARCHY
:A2
SetVar $choice "2"
Goto :ENDARCHY
:A3
SetVar $choice "3"
Goto :ENDARCHY
:A4
SetVar $choice "4"
Goto :ENDARCHY
:A5
SetVar $choice "5"
Goto :ENDARCHY
:A6
SetVar $choice "6"
Goto :ENDARCHY
:A7
SetVar $choice "7"
Goto :ENDARCHY
:A8
SetVar $choice "8"
Goto :ENDARCHY
:A9
SetVar $choice "a"
Goto :ENDARCHY
:A10
SetVar $choice "b"
Goto :ENDARCHY
:A11
SetVar $choice "c"
Goto :ENDARCHY
:A12
SetVar $choice "d"
Goto :ENDARCHY
:A13
SetVar $choice "#"
Goto :ENDARCHY
:A14
SetVar $choice "e"
Goto :ENDARCHY
:A15
SetVar $choice "f"
Goto :ENDARCHY
:A16
SetVar $choice "g"
Goto :ENDARCHY
:A17
SetVar $choice "h"
Goto :ENDARCHY
:A18
SetVar $choice "z"
Goto :ENDARCHY
:A19
SetVar $choice "q"
Goto :ENDARCHY
:A20
SetVar $choice "!"
Goto :ENDARCHY
:A21
SetVar $choice "i"
Goto :ENDARCHY
:ENDARCHY
KillAllTriggers
#----------------
#getconsoleinput $choice singlekey
uppercase $choice
setvar $sector ""
setvar $ship ""
#IF ($choice <> "Q") and ($choice <> "1") and ($choice <> "2") and ($choice <> "3") and ($choice <> "4") and ($choice <> "5") and ($choice <> "6") and ($choice <> "7") and ($choice <> "8") and ($choice <> "A") and ($choice <> "B") and ($choice <> "C") and ($choice <> "D") and ($choice <> "E") and ($choice <> "F") and ($choice <> "G") and ($choice <> "H") and ($choice <> "#") and ($choice <> "Z")
#	GoTo :terra_kit
#End
if ($choice = "Q")
Send "q "
return
#send #145
#waiton #145 & #8
#goto :terra_kit
end
If ($choice = "!")
	halt
elseif ($choice = "1")
send "q d" & $land
goto :terra_kit
elseif ($choice = "2")
send "q szh*" & $land
goto :terra_kit
elseif ($choice = "3")
send "q sd" & $land
goto :terra_kit
elseif ($choice = "4")
send "q x ** " & $land
goto :terra_kit

elseif ($choice = "5")
getinput $sector "What sector to check for lock? "
uppercase $sector
if ($sector = "Q")
return
end
gosub :sector_check_terra
send "q m " & $sector & "* yn * " & $land
goto :terra_kit

elseif ($choice = "6")
getinput $sector "What sector to twarp to? "
uppercase $sector
if ($sector = "Q")
return
end
gosub :sector_check_terra
send "q m " & $sector & "*yy * "
return

elseif ($choice = "7")
getinput $sector "What sector to twarp to? ('Q' to abort) "
uppercase $sector
if ($sector = "Q")
return
end
gosub :sector_check_terra
getinput $ship "What ship number to tow? ('Q' to abort) "
uppercase $ship
if ($ship = "Q")
return
end
gosub :ship_check
echo "*Engage? (Y/N)? "
getconsoleinput $engage singlekey
uppercase $engage
          if ($engage = "Y")
          send "q w n " & $ship & "* m " & $sector & "*yy * "
          else
          return
          end

return
elseif ($choice = "8")
       getinput $ship "What ship number to xport to? ('Q' to abort) "
       if (($ship = "Q") or ($ship = "q"))
       return
       end
       gosub :ship_check
       settexttrigger land1 :land1 "ready to leave Terra"
       settexttrigger land2 :land2 "Land on which planet"
       setdelaytrigger land3 :land2 10000
       send "q x * " & $ship & " * * " & $land
       pause

            :land2
            killalltriggers
            send "1* "
            :land1
            killalltriggers
            setdelaytrigger terra1 :terra0 10000
            settexttrigger pscan1 :pscan0 "PlScn"
            send "/"
            pause
            :pscan0
            killalltriggers
            gettext currentline $pscan "PlScn" "LRS"
            striptext $pscan " "
            striptext $pscan #179
            uppercase $pscan
            if ($pscan = "YES")
            setvar $land "l 1* "
            else
            setvar $land "l "
            end

            #put back on right promp
            setdelaytrigger terra2 :terra0 10000
            send #145
            waiton  #145 & #8
            killalltriggers
            getword currentline $test "1"
            lowercase $test
            if ($test = "how")
            send "0* " & $land
            elseif ($test = "do")
            else
            send "0* 0* q q zn " & $land
            end
       goto :terra_kit


elseif ($choice = "A")
       getinput $sector "What sector to void? ('Q' to abort) "
       uppercase $sector
       if ($sector = "Q")
       return
       end
       gosub :sector_check_terra
       send "^?s" & $sector "*q"
       goto :terra_kit

elseif ($choice = "B")
send "q cv0*yyq " & $land
goto :terra_kit

elseif ($choice = "C")
getinput $sector "What sector to check plot? ('Q' to abort) "
uppercase $sector
if ($sector = "Q")
return
end
gosub :sector_check_terra
send "qcf1*" & $sector & "*q" & $land
goto :terra_kit

elseif ($choice = "D")
send "q t aq " & $land
goto :terra_kit


elseif ($choice = "E")
send "q q y y?*"
goto :terra_kit

elseif ($choice = "F")
send "q c u y q " & $land
goto :terra_kit

elseif ($choice = "G")
send "q c n 9 q q " & $land
goto :terra_kit
Elseif ($choice = "#")
send "#"
goto :terra_kit
elseif ($choice = "Z")
send "q c b y "
goto :terra_kit

elseif ($choice = "H")
		getinput $sector "What sector to twarp to? ('Q' to abort) "
         uppercase $sector
          if ($sector = "Q")
          return
          end
          gosub :sector_check_terra
          getinput $ship "What ship number to xport to? ('Q' to abort) "
         uppercase $ship
         if ($ship = "Q")
         return
         end
         gosub :ship_check
         echo "*Engage? (Y/N)? "
         getconsoleinput $engage singlekey
         uppercase $engage
         if ($engage = "Y")
         send "q x * " & $ship & " * * m " & $sector & "*yy "
         send #145
         waiton #145 & #8
         else
         return
         end
         goto :terra_kit



# ADDED by Archy 
		 
elseif ($choice = "I")
getinput $sector "What sector to charge to? "
uppercase $sector
if ($sector = "Q")
goto :terra_kit
end
if ($sector = "B")
	SetVar $sector $z_base
End
if ($sector = "D")
	SetVar $sector STARDOCK
End
if ($sector = "R")
	SetVar $sector RYLOS
End
if ($sector = "A")
	SetVar $sector ALPHACENTAURI
End
if ($sector = "S")
	SetVar $sector $z_safesector
End
gosub :sector_check_terra
SetVar $Z_Move~target $sector
SetVar $Z_Move~z_wave 99999
SetVar $Z_Move~z_dockport FALSE
Gosub :Z_Move~CHARGE
return

# ------------------------



end
return

:ship_check
isnumber $ck0 $ship
if ($ck0 = 0)
goto :terra_kit
end
return

:sector_check_terra
uppercase $sector
isnumber $ck $sector
if ($ck = 0)
send #145
goto :terra_kit
elseif ($sector = 0)
send #145
goto :terra_kit
elseif ($sector > sectors)
send #145
goto :terra_kit
end
return
:terra0
return
# ADDED by Archy
:LOADZBOT
KillAllTriggers
setvar $Line CURRENTLINE
If ($Line <> "")
	CutText $line $ck 1 1
End
If ($ck = "R") OR ($ck = "'")
	Send "'LOGIN: Attempting to start Z-Bot in Sector 1. Please Wait...*"
	WaitOn "ub-space c"
	Stop "Z-Bot"
	KillTrigger waitbot
	SetDelayTrigger waitbot :WAITBOTSTOP 3000
	Pause
	:WAITBOTSTOP
	KillAllTriggers
	Send "q "
	Load "Z-Bot.cts"
	Halt
	Return
End
goto :pro
Include include\Z_Move.ts
#------------------------

