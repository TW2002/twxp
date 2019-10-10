#dont forget to call array at bottom b4 using these
#example
#gosub :9_promptck~p_array
#gosub :9_promptck~comorcit0

#:9_promptck~prompt
:prompt
setvar $prompt ""
setdelaytrigger one :one 2000
send #145
waiton #145 & #8
killtrigger one
killtrigger waiton1
cuttext CURRENTLINE  $prompt 1 7
striptext $prompt " "
send "'I'm at the " & $prompt & " prompt*"
gosub :9_waittrigger~waittrigger
goto :outprompt
:one
killtrigger one
killtrigger waiton1
send "* * * "
goto :prompt
:outprompt
killtrigger one
killtrigger waiton1
return

#:9_promptck~promptck
:promptck
setvar $prompt ""
if ($loop > 3)
goto :outpck
elseif ($loop > 1)
send "* * * "
end
send #145
setdelaytrigger two :two 2000
waiton #145 & #8
killtrigger two
killtrigger waiton2
cuttext CURRENTLINE $promptx 1 7
goto :outpromptck
:two
killtrigger two
killtrigger waiton2
send "*"
add $loop 1
goto :promptck
:outpromptck
setvar $k 1
while ($k <= 35)
if ($promptx = $prom[$k])
setvar $promptck $k
goto :outpck
end
add $k 1
end
setvar $promptck "999"
:outpck
setvar $loop 0
killtrigger two
killtrigger waiton2
return

#:9_promptck~wait
:wait
setdelaytrigger three :9_waittrigger~timeout 2000
send #145
waiton #145 & #8
killtrigger three
killtrigger waiton3
return

#:9_promptck~planetprompt
:planetprompt
gosub :promptck
if ($promptck = 3)
setvar $error 0
elseif ($promptck = 2)
send "q"
goto :planetprompt
else
setvar $error 1
send "'[" $name "] - Must start at Planet prompt*"
gosub :9_waittrigger~waittrigger
gosub :prompt
end
return

#:9_promptck~commdprompt
:commdprompt
gosub :promptck
if ($promptck = 1)
setvar $error 0
else
setvar $error 1
send "'[" $name "] - Must start at Command prompt*"
gosub :9_waittrigger~waittrigger
gosub :prompt
end
return

#:9_promptck~waitcit
:waitcit
setvar $error 0
setdelaytrigger three :twowc 2000
settexttrigger two :onewc "Citadel command"
send #145
pause
:twowc
setvar $error 1
:onewc
killtrigger three
killtrigger two
:outwc
return

#:9_promptck~waitcitorcom
:waitcitorcom 
setdelaytrigger one :twococ 2000
settexttrigger two :onecoc "Citadel command"
settexttrigger three :onecoc "Command [TL="
send #145
pause
:twococ
setvar $error 1
goto :outcoc
:onecoc
setvar $error 0
killtrigger one
killtrigger two
killtrigger three
:outcoc
return

#:9_promptck~waitcommand
:waitcommand
setdelaytrigger threem :twowcm 2000
settexttrigger twom :onewcm "Command [TL="
send #145
pause
:twowcm
setvar $error 1
:onewcm
setvar $error 0
killtrigger threem
killtrigger twom
return

#:9_promptck~wait30
:wait30
setdelaytrigger threem :twowcm 30000
settexttrigger twom :onewcm "Command [TL="
settexttrigger twoma :onewcm "Citadel command"
send #145
pause
:twowcm
setvar $error 1
:onewcm
setvar $error 0
killtrigger threem
killtrigger twom
return

#:9_promptck~commdprompt0
:commdprompt0
gosub :promptck
if ($promptck = 1)
setvar $error 0
else
setvar $error 1
echo "Must start at Command prompt*"
end
return

#:9_promptck~getcit
:getcit
setvar $cit_level 0
settexttrigger pcom :out_cit0 "Planet command (?="
if ($loop = 5)
send "'[" $name "] - Planet Number Error*"
gosub :9_waittrigger~waittrigger
goto :out_cit
end
if ($promptck = 3)
send " *"
elseif ($promptck = 2)
send "q *"
else
goto :out_cit
end
waiton "Planet has a level"
killtrigger pcom
getword currentline $cit_level 5
isnumber $ck $cit_level
if ($ck = "0")
add $loop 1
goto :getpnum
end
if ($promptck = 2)
send "c "
end
:out_cit
killtrigger pcom
setvar $loop 0
return
:out_cit0
killAllTriggers
setvar $cit_level 0
return

#:9_promptck~getpnum
:getpnum
setvar $error 0
setvar $planet 0
setvar $loop 0
:getpnum0
if ($loop = 5)
send "'[" $name "] - Planet Number Error*"
gosub :9_waittrigger~waittrigger
setvar $error 1
goto :outpnum
end
setdelayTrigger pnum98 :pnum99 5000
setTextLineTrigger pnum99 :pnum99 "Planet #"
if ($promptck = 3)
send "*"
elseif ($promptck = 2)
send "q *"
else
#Echo ansi_12 "NOT ON PLANET*"
goto :outpnum
end
pause
:pnum99
killTrigger pnum98
killTrigger pnum99
getWord CURRENTLINE $planet 2
stripText $planet "#"
if ($promptck = 2)
send "c"
end
if ($planet = "0")
add $loop 1
goto :getpnum0
end
isnumber $ck $planet
if ($ck = "0")
add $loop 1
goto :getpnum0
end
:outpnum
killTrigger pnum98
killTrigger pnum99
setvar $loop 0
return

#:9_promptck~major
:major
gosub :promptck
if ($promptck < 4)
setvar $error 0
else
setvar $error 1
send "'[" $name "] - Must start at a Major prompt*"
gosub :9_waittrigger~waittrigger
gosub :prompt
end
return

#:9_promptck~planetsprompt
:planetsprompt
gosub :promptck
if (($promptck = 2) OR ($promptck = 3))
setvar $error 0
else
setvar $error 1
send "'[" $name "] - Must start at Planet or Citadel prompt*"
gosub :9_waittrigger~waittrigger
gosub :prompt
end
return

#:9_promptck~comorcit
:comorcit
gosub :promptck
if ($promptck = 1) OR ($promptck = 2)
setvar $error 0
else
setvar $error 1
send "'[" $name "] - Must start at Command or Citadel Prompt*"
gosub :9_waittrigger~waittrigger
gosub :prompt
end
return

#:9_promptck~comorcit0
:comorcit0
gosub :promptck
if ($promptck = 1) OR ($promptck = 2)
setvar $error 0
else
setvar $error 1
echo "Must start at Command or Citadel Prompt*"
end
return

#:9_promptck~citprompt
:citprompt
gosub :promptck
if ($promptck = 2)
setvar $error 0
else
setvar $error 1
send "'[" $name "] - Must start at Citadel prompt*"
gosub :9_waittrigger~waittrigger
gosub :prompt
end
return

#:9_promptck~citprompt0
:citprompt0
gosub :promptck
if ($promptck = 2)
setvar $error 0
else
setvar $error 1
echo ansi_13 "*Must start at Citadel prompt*"
send " * "
end
return

#:9_promptck~p_array
:p_array
#major prompts 1-6
setarray $prom 39
setvar $prom[1] "Command"
setvar $prom[2] "Citadel"
setvar $prom[3] "Planet "
setvar $prom[4] "Compute"
setvar $prom[5] "Corpora"
setvar $prom[6] "<StarDo"
#first port prompt
setvar $prom[7] "Enter y"
#port attack prompt
setvar $prom[8] "Are you"
#port sell buy attack prompt also planet/fig population prompt and cit generator subprompt "**"
setvar $prom[9] "How man"
#planet prompts "*"
setvar $prom[10] "Display"
#ownership "c or p only if on corp else no prompt"
setvar $prom[11] "Should "
#population "*"
setvar $prom[12] "(1)Ore,"
#fig and planet IG and make cit "**"
setvar $prom[13] "Do you "
#add/take colos "*"
setvar $prom[14] "(L)eave"
#planet attack "*"
setvar $prom[15] "Planeta"
#planet det "**"
setvar $prom[16] "<DANGER"
#cit ship exchange "*"
setvar $prom[17] "Trade w"
setvar $prom[18] "Choose "
setvar $prom[19] "Qcannon"
setvar $prom[20] "Option?"
setvar $prom[21] "<Tavern"
setvar $prom[22] "<Shipya"
setvar $prom[23] "<Hardwa"
setvar $prom[24] "<Libram"
setvar $prom[25] "<FedPol"
setvar $prom[26] "<Galact"
setvar $prom[27] "<StarDo"
#corporate display
setvar $prom[28] "Which L"
#tpad
setvar $prom[29] "Beam to"
#planet shield
setvar $prom[30] "Transfe"
#military reaction  "*"
setvar $prom[31] "What le"
#pause
setvar $prom[32] "[Pause]"
#Planet IG and quit in cit and planet kill colos "**"
setvar $prom[33] "Do you "
#Pwarp
setvar $prom[34] "What se"
#Cit money and shield generator
setvar $prom[35] "Transfe"
#Evict
setvar $prom[36] "Are you"
#memo (ceo)
setvar $prom[37] "C: ‘"
#Corp password (ceo)
setvar $prom[38] "Enter C"
#Remove Corpy (ceo)
setvar $prom[39] "Remove "
return

#:9_promptck~land
:land
if ($promptck = "2")
 if ($save_me_mode = TRUE)
    send "l j" & #8 & #8 & #8 & $9_promptck~planet & "* mnt* mnl101* c"
 else
    send "l j" & #8 & #8 & #8 & $9_promptck~planet & "* mnt* c"
 end
elseif ($promptck = "3")
 if ($save_me_mode = TRUE)
    send "l j" & #8 & #8 & #8 & $9_promptck~planet & "* mnt* mnl101*"
 else
    send "l j" & #8 & #8 & #8 & $9_promptck~planet & "* mnt*"
 end
end
:landout
return

:includes
include "include\9_waittrigger.ts"