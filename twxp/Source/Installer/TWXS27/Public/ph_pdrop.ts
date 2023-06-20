#Parrothead Pdropper (Sub Prompt) - Public Version

:start0
listActiveScripts $scripts
listActiveScripts $scriptsx
setVar $a 1
while ($a <= $scripts)
lowercase $scripts[$a]
if ($scripts[$a] = "_ph_qss.cts")
setvar $qssrunning 1
end

add $a 1
end
if ($qssrunning = 0)
gosub :loadqss
end

:duplicates
setvar $a 1
:duplicates0
while ($a <= $scripts)
setvar $b 1
lowercase $scripts[$a]
lowercase $scriptsx[$a]
while ($b <= $scripts)
if (($a <> $b) and ($scripts[$a] = $scriptsx[$b]))
stop $scripts[$a]
goto :start0
end
add $b 1
end
add $a 1
end

loadvar $damage
loadvar $damagea
gosub :9_comms~off
waitOn "ommand"
setdelaytrigger start :start 800
pause
:start
setvar $bot (GAMENAME & ".stbot")
#=-=-=-=-=-check for file exists=-=-=-=-
if ($bot <> "")
  fileExists $exists $bot
    if ($exists)
    else

:add_game
send "* "
waitfor "ommand"
setdelaytrigger ag :ag 250
pause
:ag
echo ANSI_14 "*What is the 'in game' name of the bot? (one word, no spaces)*"
getConsoleinput $new_bot_name
stripText $new_bot_name "^"
stripText $new_bot_name " "
send "*"
if ($new_bot_name = "")
goto :add_game
end
write $bot $new_bot_name
    end
end

gosub :9_cprompt~prompt
waitOn "Citadel command"
send "* "
waitOn "Citadel command"

read $bot $name 1
mergetext $name " " $namex
SetVar $version "v2.0"
SetVar $title "ParrotHead's Direct Pdrop (Sub Prompt) "
Setvar $help "send '"& $name & " phdrop help' for script help"
Setvar $status "send 'script?' for status message"
setvar $run "ON "
setvar $sound "OFF"
setvar $return "OFF"
setVar $menu_gas (#27 & "[1;40;32m" & "25" & #27 & "[0m")
setvar $ph_gas 25
setvar $ph_delay 1000
setVar $menu_delay (#27 & "[1;40;32m" & "1 sec " & #27 & "[0m")
#menu labels variables
setvar $menulabel $title
setvar $menuone (#27 & "[40;32m" & $menulabel & #27 & "[0m")
setvar $menutwo (#27 & "[1;40;31m" & "Engage Script                         " & #27 & "[0m")
setvar $menuthree (#27 & "[1;40;31m" & "Start Script in Active Mode " & #27 & "[1;40;33m" & " {ON/OFF} " & #27 & "[0m")
setvar $menufour (#27 & "[1;40;31m" & "Auto-Return to Home Sector" & #27 & "[1;40;33m" & " {ON/OFF} " & #27 & "[0m")
setvar $menufive (#27 & "[1;40;31m" & "Minimum Gas Percentage -" & #27 & "[0m")
setvar $menusix (#27 & "[1;40;31m" & "Auto-Return Delay Factor - " & #27 & "[0m")
setvar $menuseven (#27 & "[1;40;31m" & "Alert Sound - " & #27 & "[0m")
#menu value variables
setvar $menuvaluetwo "Run"
setvar $menuvaluethree "Start"
setvar $menuvaluefour "Auto-Return"
setvar $menuvaluefive "Gas"
setvar $menuvaluesix "Delay"
setvar $menuvalueseven "Sound"
#MENU
addMenu "" $menulabel $menuone "." "" "Pdrop" FALSE
addMenu $menulabel $menuvaluetwo $menutwo "Z" :Menu_Run "" TRUE
addMenu $menulabel $menuvaluefive $menufive "3" :Menu_Gas "" FALSE
addMenu $menulabel $menuvaluethree $menuthree "2" :Menu_Start "" FALSE
addMenu $menulabel $menuvaluefour $menufour "1" :Menu_Return "" FALSE
addMenu $menulabel $menuvaluesix $menusix "4" :Menu_delay "" FALSE
addMenu $menulabel $menuvalueseven $menuseven "5" :Menu_sound "" FALSE
#menu help
setMenuHelp $menuvaluetwo "This Option Activates the PDrop Script."
setMenuHelp $menuvaluethree "This Option Toggles Active and Passive Mode."
setMenuHelp $menuvaluefour "This Option Toggles the Return Home After Drop."
setMenuHelp $menuvaluefive "This Option Sets the Minimum Gas Percentage."
setMenuHelp $menuvaluesix "This Option Sets the Auto Return Delay."
setMenuHelp $menuvalueseven "This Option Sets the Alert Sound on /off."


savevar $9_cprompt~planet
setVar $ml2 "ParrotHead's Pdrop Cannon Settings"
setvar $m1 (#27 & "[41;33m" & $ml2 & #27 & "[0m")
setvar $m6 (#27 & "[1;40;31m" & "Minimum Cannon Damage(sector) - " & #27 & "[0m")
setvar $m7 (#27 & "[1;40;31m" & "Minimum Cannon Damage(atmo)   - " & #27 & "[0m")
setvar $m2 (#27 & "[1;40;31m" & "Engage Script                         " & #27 & "[0m")
if ($damage < 1000)
setVar $damage 50000
end
if ($damagea < 1000)
setVar $damagea 50000
end
setvar $mdamage (#27 & "[1;40;33m" & $damage & "               " & #27 & "[0m")
setvar $mdamagea (#27 & "[1;40;33m" & $damagea & "               " & #27 & "[0m")
addMenu "" "ParrotHead's Pdrop Cannon Settings" $m1 "." "" "Cannon" FALSE
addMenu "ParrotHead's Pdrop Cannon Settings" "Run2" $m2 "Z" :Menu_Run2 "" TRUE
addMenu "ParrotHead's Pdrop Cannon Settings" "Damage2" $m6 "D" :Menu_Damage "" FALSE
addMenu "ParrotHead's Pdrop Cannon Settings" "Damage3" $m7 "A" :Menu_DamageA "" FALSE
setMenuHelp "Damage2" "This Option Sets the Minimum Cannon Damage.(Sector)- "
setMenuHelp "Damage3" "This Option Sets the Minimum Cannon Damage.(Atmo)- "
setMenuHelp "Run2" "This Option Activates the PDrop Script."



:start_menu
gosub :sub_setMenu
gosub :Header
openMenu $menulabel

:sub_setMenu
setMenuValue $menuvaluefour $return
setMenuValue $menuvaluethree $run
setMenuValue $menuvaluefive $menu_gas
setMenuValue $menuvaluesix $menu_delay
setMenuValue $menuvalueseven $sound
return

:Menu_gas
add $gas_mode 1
if ($gas_mode > "4")
setvar $gas_mode 0
end
if ($gas_mode = 0)
setvar $ph_gas "1"
setVar $menu_gas (#27 & "[1;40;32m" & "1 " & #27 & "[0m")
end
if ($gas_mode = 1)
setvar $ph_gas "10"
setVar $menu_gas (#27 & "[1;40;32m" & "10" & #27 & "[0m")
end
if ($gas_mode = 2)
setvar $ph_gas "20"
setVar $menu_gas (#27 & "[1;40;32m" & "20" & #27 & "[0m")
end
if ($gas_mode = 3)
setvar $ph_gas "25"
setVar $menu_gas (#27 & "[1;40;32m" & "25" & #27 & "[0m")
end
if ($gas_mode = 4)
setvar $ph_gas "33"
setVar $menu_gas (#27 & "[1;40;32m" & "33" & #27 & "[0m")
end
gosub :sub_setMenu
echo ANSI_10 #27 & "[11A" & #27 & "[K"
openMenu $menulabel

:Menu_delay
add $delay_mode 1
if ($delay_mode > "4")
setvar $delay_mode 0
end
if ($delay_mode = 0)
setvar $ph_delay 1000
setVar $menu_delay (#27 & "[1;40;32m" & "1 sec " & #27 & "[0m")
end
if ($delay_mode = 1)
setvar $ph_delay 5000
setVar $menu_delay (#27 & "[1;40;32m" & "5 sec " & #27 & "[0m")
end
if ($delay_mode = 2)
setvar $ph_delay 10000
setVar $menu_delay (#27 & "[1;40;32m" & "10 sec " & #27 & "[0m")
end
if ($delay_mode = 3)
setvar $ph_delay 15000
setVar $menu_delay (#27 & "[1;40;32m" & "15 sec " & #27 & "[0m")
end
if ($delay_mode = 4)
setvar $ph_delay 30000
setVar $menu_delay (#27 & "[1;40;32m" & "30 sec " & #27 & "[0m")
end
gosub :sub_setMenu
echo ANSI_10 #27 & "[11A" & #27 & "[K"
openMenu $menulabel

:Menu_Return
add $menu_return 1
	if ($menu_return = 1)
		setVar $return "ON "
	elseif ($menu_return = 0)
		setVar $menu_return 0
		setVar $return "OFF"
	else
		setVar $menu_return 0
		setVar $return "OFF"
	end
gosub :sub_setMenu
gosub :Header
echo ANSI_10 #27 & "[11A" & #27 & "[K"
openMenu $menulabel

:Menu_sound
add $menu_sound 1
	if ($menu_sound = 1)
		setVar $sound "ON "
	elseif ($menu_sound = 0)
		setVar $menu_sound 0
		setVar $sound "OFF"
	else
		setVar $menu_sound 0
		setVar $sound "OFF"
	end
gosub :sub_setMenu
gosub :Header
echo ANSI_10 #27 & "[11A" & #27 & "[K"
openMenu $menulabel

:Menu_Start
add $menu_start 1
	if ($menu_start = 1)
 	setVar $run "OFF"
	elseif ($menu_start = 0)
	setVar $menu_start 0
	setVar $run "ON "
	else
	setVar $menu_start 0
	setVar $run "ON "
	end
gosub :sub_setMenu
gosub :Header
echo ANSI_10 #27 & "[11A" & #27 & "[K"
openMenu $menulabel

:Menu_Run
send "** "
setdelaytrigger menuwait6 :menuwait6 800
pause
:menuwait6
:start_menu2
setvar $header 0
gosub :sub_setMenu2
#gosub :Header
if ($botloader = 1)
goto :Menu_Run2
end
openMenu $ml2

:sub_setMenu2
setMenuValue "Damage2" $mdamage
setMenuValue "Damage3" $mdamagea
return

:Menu_DamageA
echo ANSI_10 "*" & #27 & "[1A" & #27 & "[K" & "*Set Minimum Cannon Damage(atmo)-"
getconsoleInput $damagea
isnumber $numchk $damagea
if ($numchk)
else
echo ANSI_10 "*" & #27 & "[3A" & #27 & "[K" & "Must be number over Zero" & "*"
goto :Menu_Damage
end
if ($damagea > 0)
else
echo ANSI_10 "*" & #27 & "[3A" & #27 & "[K" & "Must be number over Zero" & "*"
goto :Menu_Damage
end
setvar $mdamagea (#27 & "[1;40;33m" & $damagea & "               " & #27 & "[0m")
gosub :sub_setMenu2
gosub :Header
echo ANSI_10 #27 & "[9A" & #27 & "[K"
openMenu $ml2


:Menu_Damage
echo ANSI_10 "*" & #27 & "[1A" & #27 & "[K" & "*Set Minimum Cannon Damage(sector)-"
getconsoleInput $damage
isnumber $numchk $damage
if ($numchk)
else
echo ANSI_10 "*" & #27 & "[3A" & #27 & "[K" & "Must be number over Zero" & "*"
goto :Menu_Damage
end
if ($damage > 0)
else
echo ANSI_10 "*" & #27 & "[3A" & #27 & "[K" & "Must be number over Zero" & "*"
goto :Menu_Damage
end
setvar $mdamage (#27 & "[1;40;33m" & $damage & "               " & #27 & "[0m")
gosub :sub_setMenu2
gosub :Header
echo ANSI_10 #27 & "[9A" & #27 & "[K"
openMenu $ml2


:Menu_Run2
send "* "
:drop
waitOn "itadel command"
gosub :9_comms~on
gosub :getqss
send "'*.*" & $title & $version & "*Running from Planet # " & $9_cprompt~planet
send "*MY TA is " & $QSSSECT & " in Ship # " & $QSSSHIP & "*" & $help & "*" & $status & "*.**"
waiton "Sub-space comm-link termina"
setvar $homesect $QSSSECT
gosub :setCannon
if ($run = "OFF")
killalltriggers
goto :modeoff
end

:go
if ($run = "OFF")
killalltriggers
goto :modeoff
end
killalltriggers
setTextTrigger lmphit :lmphit "Limpet mine in"
setTextTrigger fighit :fighit "Deployed Fighters"
setTextLineTrigger modebot :modeoff $namex
setTextLineTrigger inactivitywarning :inacpdrop "INACTIVITY WARNING:"
setTextLineTrigger halted :halted $name & " phdrop halt"
setTextLineTrigger reton :returnon $name & " phdrop return on"
setTextLineTrigger retoff :returnoff $name & " phdrop return off"
setTextLineTrigger mode :modeoff $name & " phdrop off"
setTextLineTrigger help :help $name & " phdrop help"
setTextLineTrigger pager :page $name & " phdrop pager"
setTextLineTrigger bot :bot "script?"
pause
:fighit
killAllTriggers
getword CURRENTLINE $dropsector 5
setvar $ansiline CURRENTANSILINE
getword $ansiline $tansi 6
cuttext $tansi $num 10 2
striptext $dropsector ":"
if ($num = "33")
send " * "
goto :go
end
setvar $send ("p" & $dropsector & "*y")
send $send
goto :result
:lmphit
killalltriggers
getWord CURRENTLINE $dropsector 4
setvar $send ("p" & $dropsector & "*y")
send $send
:result
setTextLineTrigger halted3 :halted $name & " phdrop halt"
setTextlineTrigger reset2 :reset $name & " phdrop reset"
setTextlineTrigger good :good "Planet is now"
setTextlineTrigger nogood :nogood "Citadel treasury"
setTextlineTrigger error :error "Invalid Sector number"
pause
:nogood
goto :go
:good
killalltriggers
send "* '*"
send "Pdropped to " & $dropsector & "**"
waiton "Sub-space comm-link termi"
send "s* "
if ($sound = "ON ")
sound alert.wav
end
goto :mode
:error
send #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & "q*"
goto :go
:mode
if ($return = "ON ")
setdelaytrigger waitreturn :waitreturn $ph_delay
pause
:waitreturn
send "p" & $homesect & "*y"
gosub :setCannon
elseif ($return = "OFF")
gosub :setCannon
end
goto :go
#=-=-=-=-=-=-=-bot section=-=-=-=-=-=-=-=-=-
:bot
killalltriggers
gosub :spam
gosub :statusmenu
if ($run = "ON ")
goto :go
else
goto :menuoff
end
:reset
killalltriggers
send #8 & #8 & #8 & #8 & #8 & #8 & #8 & "*q*"
goto :go
:modeoff
killalltriggers
gosub :spam
gosub :statusmenu
:menuoff
killalltriggers
send "'*.*" & $title & $version & "*Running from Planet # " & $9_cprompt~planet
send "*MY TA is " & $QSSSECT & " in Ship # " & $QSSSHIP & "*" & $help & "*" & $status & "*.**"
waiton "Sub-space comm-link termina"
setTextTrigger inactivitywarning2 :inacpdrop "INACTIVITY WARNING:"
setTextLineTrigger reton2 :returnon $name & " phdrop return on"
setTextLineTrigger retoff2 :returnoff $name & " phdrop return off"
setTextLineTrigger modeon2 :modeon $name & " phdrop on"
setTextLineTrigger help2 :help $name & " phdrop help"
setTextLineTrigger pager2 :page $name & " phdrop pager"
setTextLineTrigger halted2 :halted $name & " phdrop halt"
setTextLineTrigger bot1 :bot "script?"
pause
:modeon
killalltriggers
gosub :spam
setvar $run "ON "
gosub :statusmenu
goto :go

:returnon
killalltriggers
setvar $return "ON "
gosub :spam
gosub :statusmenu
goto :looper

:returnoff
setvar $return "OFF"
killalltriggers
gosub :spam
gosub :statusmenu

:looper
if ($run = "OFF")
goto :modeoff
else
goto :go
end

:page
killalltriggers
gosub :spam
Sound "page.wav"
send "* "
waiton "elp"
Send "'*User Paged!**"
WaitFor "Sub-space comm-link terminated"
if ($run = "OFF")
goto :modeoff
else
goto :go
end

:help
setdelaytrigger onewait :onewait 1000
pause
:onewait
gosub :spam
gosub :Headerone
echo ansi_9 "** ------------- " & ansi_10 $title & $version & ansi_9 " -------------*"
echo ansi_9 "* Modes switched by the following subspace commands"
echo ansi_9 "* send commands in lower case preceded by " & ANSI_14 $name
echo ansi_9 "* Mode           - 'phdrop on/off"
echo ansi_9 "* HALT SCRIPT    - 'phdrop halt'"
echo ansi_9 "* Script Mode    - 'script ?'"
echo ansi_9 "* Page User      - 'phdrop pager'"
echo ansi_9 "* Page User      - 'phdrop return on/off'"
echo ansi_9 "* Reset Triggers - 'phdrop reset'*"
echo ansi_9 "* ------------- " & ansi_10 $title & $version & ansi_9 " -------------*" & ANSI_0
send "* "
waitfor "elp"
if ($ck = "R")
gosub :statusmenu
end
goto :go

:errortrap
killalltriggers
goto :go

:inacpdrop
killalltriggers
if ($run = "ON ")
send "q*@"
WaitOn "elp"
goto :go
end
send "@"
WaitOn "elp"
goto :go

:statusmenu
gosub :spam
killalltriggers
send "*"
send "'*----- " & $title & $version & " -----*."
send "* Modes switched by the following subspace commands"
send "* send commands in lower case preceded by " & $name
send "* Mode           - 'Phdrop on/off"
send "* Script Mode    - 'Script ?'"
send "* HALT SCRIPT    - 'Phdrop halt'"
send "* Page User      - 'Phdrop pager'"
send "* Auto Return    - 'Phdrop return on/off'"
send "* Reset Triggers - 'Phdrop reset'"
if ($run = "OFF")
send "* " & $title & $version & " in Wait mode"
else
send "* " & $title & $version & " in Active mode"
end
send "* Auto-Return is " $return & "**"
waiton "Sub-space comm-link te"
return

:spam
killAllTriggers
getWord CURRENTLINE $ck 1
if ($run = "ON ")
send "q*"
end
killAllTriggers
getWord CURRENTLINE $ck 1
MergeText "'" $namex $callbot
MergeText "'" $name $callbot2
striptext $callbot2 " "
striptext $callbot " "
if ($ck <> $callbot) and ($ck <> "R") and ($ck <> "'script?") and ($ck <> $callbot2)
goto :go
end
return

:namegood
return
:out
stop _ph_pdrop
halt

:Header
if ($header = "1")
goto :endheader
end
:Headerone
ECHO ANSI_2 "*---------------------------------------------*"
ECHO ANSI_10 "    " & ANSI_1 "P" & ANSI_2 "a" & ANSI_3 "rr" & ANSI_4 "o" & ANSI_5 "t"
ECHO ANSI_6 "h" & ANSI_7 "e" & ANSI_8 "a" & ANSI_9 "d" & ANSI_10 "'s " & ANSI_11 "P"
ECHO ANSI_12 "d" & ANSI_13 "r" & ANSI_14 "o" & ANSI_15 "p"
ECHO ANSI_4 "*        " & $version & "      "
ECHO ANSI_2 "*---------------------------------------------*"
setvar $header 1
:endheader
return

:nogas
setvar $run "OFF"
send "p" & $homesect & "*y"
send "'Out of Gas*"
waiton "Message sent on sub-space channe"

:halted
if ($run = "ON ")
send "q*"
end
send "'Pdrop halted*"
stop _ph_pdrop
halt

:checkgas
send "q*cs"
settextlinetrigger thirtythree :gas "Fuel Ore"
pause
:gas
killtrigger gas
getword CURRENTLINE $maxgas 8
striptext $maxgas ","
striptext $maxgas ","
getword CURRENTLINE $gas 6
striptext $gas ","
striptext $gas ","
isnumber $numchk $gas
if ($numchk)
else
echo ANSI_10 "Bad number"
halt
end
isnumber $numchk $maxgas
if ($numchk)
else
echo ANSI_10 "Bad number"
halt
end
setPrecision 0
setvar $percentgasx ($maxgas * $ph_gas)
setvar $percentgas ($percentgasx / 100)
round $percentgas 0
if ($gas < $percentgas)
goto :nogas
end
if ($gas <= 25000)
goto :nogas
end
return

:setCannon
gosub :checkgas
setPrecision 10
setvar $maxdamage ($gas / 3)
if ($damage > $maxdamage)
setvar $run "OFF"
send "p" & $homesect & "*y"
send "'No Gas for Kill...Halting Pdrop*"
waiton "Message sent on sub-space channe"
goto :halted
end
setvar $temp ($maxdamage / $damage)
setvar $perx (1 / $temp)
setvar $percent ($perx * 100)
setvar $chkgas ($gas * $perx)
setPrecision 0
round $percent 0
add $percent 1
if ($percent > 80)
send "'*" & $title & " Out of gas---Pdrop going home.**"
goto :nogas
end
send "ls" & $percent & "*"
return

:getqss
loadvar $QSSSECT
loadvar $QSSTURN
loadvar $QSSCREDS
loadvar $QSSFIGS
loadvar $QSSSHLDS
loadvar $QSSHLDS
loadvar $QSSORE
loadvar $QSSORG
loadvar $QSSEQU
loadvar $QSSCOL
loadvar $QSSPHOT
loadvar $QSSARMD
loadvar $QSSLMPT
loadvar $QSSGTORP
loadvar $QSSTWRP
loadvar $QSSCLKS
loadvar $QSSBEACNS
loadvar $QSSATMDT
loadvar $QSSCRBO
loadvar $QSSEPRB
loadvar $QSSMDIS
loadvar $QSSPSPRB
loadvar $QSSPLSCN
loadvar $QSSLRSC
loadvar $QSSALNX
loadvar $QSSEXP
loadvar $QSSCORP
loadvar $QSSSHIP
return

:loadqss
load _ph_qss
return

:includes
include "include\9_comms.ts"
include "include\9_cprompt.ts"







