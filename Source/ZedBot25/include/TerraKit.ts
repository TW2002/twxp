:terra_kits
setvar $loop 0
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
if ($loop = 0)
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


echo ansi_12 "*                        -=(" ansi_14 " Terra Survival Toolkit" ansi_12 " )=-*"
echo ansi_12 "*               -=(" ansi_14 " Check for Twarp Before using Twarp Macros" ansi_12 " )=-*"
echo ansi_13 "     ----------------------------------------------------------------------*"
echo ansi_13 "     <" ansi_10 "1" ansi_13 ">  " ansi_14 "display Terra sector" ansi_9 ", land    " ansi_13 "<" ansi_10 "5" ansi_13 ">  " ansi_14 "check twarp lock" ansi_9 ", land*"
echo ansi_13 "     <" ansi_10 "2" ansi_13 ">  " ansi_14 "holoscan" ansi_9 ", land                " ansi_13 "<" ansi_10 "6" ansi_13 ">  " ansi_14 "lift, twarp out*"
echo ansi_13 "     <" ansi_10 "3" ansi_13 ">  " ansi_14 "density scan" ansi_9 ", land            " ansi_13 "<" ansi_10 "7" ansi_13 ">  " ansi_14 "lift, lock tow, twarp out*"
echo ansi_13 "     <" ansi_10 "4" ansi_13 ">  " ansi_14 "get xport list" ansi_9 ", land          " ansi_13 "<" ansi_10 "8" ansi_13 ">  " ansi_14 "xport" ansi_9 ", land*"
echo "*"
echo ansi_13 "     <" ansi_10 "A" ansi_13 ">  " ansi_14 "set avoid" ansi_9 "(Interragation mode) " ansi_13 "<" ansi_10 "E" ansi_13 ">  " ansi_14 "lift, cloak out*"
echo ansi_13 "     <" ansi_10 "B" ansi_13 ">  " ansi_14 "clear all voids" ansi_9 ", land         " ansi_13 "<" ansi_10 "F" ansi_13 ">  " ansi_14 "C U Y (enable t-warp)" ansi_9 " ,land*"
echo ansi_13 "     <" ansi_10 "C" ansi_13 ">  " ansi_14 "plot course" ansi_9 ", land             " ansi_13 "<" ansi_10 "G" ansi_13 ">  " ansi_14 "toggle c n 9*"
echo ansi_13 "     <" ansi_10 "D" ansi_13 ">  " ansi_14 "get corpie locations" ansi_9 ", land    " ansi_13 "<" ansi_10 "H" ansi_13 ">  " ansi_14 "xport , twarp out*"
echo ansi_13 "     ----------------------------------------------------------------------*"
:ask_terra
echo ansi_10 "Your choice? ('Q' to abort) "
getconsoleinput $choice singlekey
uppercase $choice
setvar $sector ""
setvar $ship ""
if ($choice = "Q")
return
send #145
waiton #145 & #8
goto :terra_kit
end

if ($choice = 1)
send "q d" & $land
goto :terra_kit
elseif ($choice = 2)
send "q szh*" & $land
goto :terra_kit
elseif ($choice = 3)
send "q sd" & $land
goto :terra_kit
elseif ($choice = 4)
send "q x ** " & $land
goto :terra_kit

elseif ($choice = 5)
getinput $sector "What sector to check for lock? "
uppercase $sector
if ($sector = "Q")
return
end
gosub :sector_check_terra
send "q m " & $sector & "* yn * " & $land
goto :terra_kit

elseif ($choice = 6)
getinput $sector "What sector to twarp to? "
uppercase $sector
if ($sector = "Q")
return
end
gosub :sector_check_terra
send "q m " & $sector & "*yy * "
return

elseif ($choice = 7)
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
elseif ($choice = 8)
       getinput $ship "What ship number to xport to? ('Q' to abort) "
       if (($ship = "Q") or ($ship = "q"))
       return
       end
       gosub :ship_check
       settexttrigger land1 :land1 "ready to leave Terra"
       settexttrigger land2 :land2 "Land on which planet"
       setdelaytrigger land3 :land2 10000
       send "q x *" & $ship & "* * " & $land
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
            getword currentline $test 1
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
         send "q x * " & $ship & "* * m " & $sector & "*yy "
         send #145
         waiton #145 & #8
         else
         return
         end
         goto :terra_kit
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
