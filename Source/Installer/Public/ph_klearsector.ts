#Team Kraaken Clear Sector
#author Parrothead
#thanks to Caretaker
#thanks to Dnyarri's white paper on macro's
#modification of this script is ok but
#credits and banner should remain
#relabeling other peeps work is not cool
#Password must be set in setup tab of twx
#version 2.00
setvar $klearsector 10
#use this variable to set number of exit enters
:prompt
if ($loop >= "3")
goto :promptend
end
send #145
waiton "?"
        cutText CURRENTLINE $location 1 7
        stripText $location " "
if ($location = "Citadel")
	send "q*"
	waitFor "Planet #"
	getWord CURRENTLINE $planet 2
	stripText $planet "#"
	if ($planet = "0")
        setvar $loop 1
        goto :prompt
        end
	goto :promptend
elseif ($location = "Planet")
	send "*"
	waitFor "Planet #"
	getWord CURRENTLINE $planet 2
	stripText $planet "#"
	if ($planet = "0")
        setvar $loop 1
        goto :prompt
        end
	goto :promptend
elseif ($location = "Command")
	goto :promptend
else
send "0* q z n * * "
add $loop 1
goto :prompt
end
:promptend
send "q q q q z r * "
if ($loop >= "3")
        echo ANSI_12 "*Not at Major prompt*"
        echo "or Bad Planet Number ....Halting Script"
	halt
end
:start
#remove this line to use this script for mothing
gosub :checksector
:clear
setvar $yy 1
while ($yy <= $klearsector)
send "q y n t * n *" & PASSWORD & "*** * z a 999988887777666655554444333322221111*  *  "
add $yy 1
end
send " * "
waiton "<Re-Display>"
waiton "Command [TL"
gosub :checksector
:finish
send " *"
waiton "Sector  :"
waiton "Command [TL"
if ($location = "Citadel") OR ($location = "Planet")
settexttrigger planet :planet "Planet command"
setdelaytrigger timeout :timeout 3000
send "l j " & #8 & #8 & #8 & $planet "*"
pause
:planet
killtrigger planet
killtrigger timeout
if ($location = "Citadel")
send "c s* "
waitfor "<Scan Sector>"
waitfor "Citadel treasury"
end
end
:timeout
killtrigger planet
killtrigger timeout
sound "ding.wav"
gosub :Header
send " * "
stop _ph_klearsector
halt
:Header
ECHO ANSI_10 "*T" & ANSI_2 "e" & ANSI_3 "a" & ANSI_4 "m " & ANSI_5 "K"
ECHO ANSI_6 "r" & ANSI_7 "aa" & ANSI_8 "k" & ANSI_9 "e" & ANSI_10 "n" & ANSI_11 "'s "
ECHO ANSI_12 "K" & ANSI_13 "l" & ANSI_14 "e" & ANSI_15 "a" & ANSI_10 "r" & ANSI_2 "s" & ANSI_3 "e"
ECHO ANSI_4 "c" & ANSI_5 "t" & ANSI_6 "o" & ANSI_6 "r*"
return

:checksector
killalltriggers
settexttrigger one :one "do you want defending this sector"
settexttrigger two :clear "These mines are not under your control"
send "h 10* "
pause
:one
killtrigger one
killtrigger two
settexttrigger three :finish "do you want defending this sector"
settexttrigger four :clear "These mines are not under your control"
send "h 20* "
pause
:clear
killalltriggers
return