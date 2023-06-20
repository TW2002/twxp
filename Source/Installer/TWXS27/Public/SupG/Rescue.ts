getInput $planetNumber "Planet Number?"
getInput $decont "Decontamination sector?"
send "i"
setTextLineTrigger cursector :cursector "Current Sector :"
pause

:cursector
getWord CURRENTLINE $home 4
send "'SupGRescue running, type 'help my ta' in SS if you need planetary assistance.*"

:top
killalltriggers
setTextLineTrigger rescue :rescue "help my ta"
pause

:rescue
setVar $line CURRENTLINE
getWord $line $test 1
if ($test <> "R")
	goto :top
end
getText $line $who "R " " help my ta"
send "ta"
waitfor "--------------------"
setTextLineTrigger getrescuepoint :rescuepoint $who
pause

:rescuepoint
cutText CURRENTLINE $sector 40 6
stripText $sector " "
send "q"

:gogetem
send "l" $planetNumber "*cp" $sector "*yqq"
waitfor "What sector"
setTextLineTrigger bjump :screwed "Citadel command"
setTextLineTrigger jump_success :success "shall we engage? Yes"
setTextLineTrigger in_sector_already :already_there "You are already in that sector!"
setTextLineTrigger no_fuel :screwed "You do not have enough Fuel Ore"
pause

:screwed
killalltriggers
send "'Sorry, you're screwed, I can't get there.*"
goto :top

:success
killalltriggers
setDelayTrigger home :clearlimp 5000
send "'Planet will be warping to decomtamination sector in 5 seconds.*"
pause

:clearlimp
send "'Planet Now warping to decontamination area.*l  " $planetNumber "*  cp" $decont "*yqq"
send "h2"
setTextLineTrigger nolay :nolay "These mines are not under your control."
setTextLineTrigger lay :lay "Your ship can support"
pause

:lay
killtrigger nolay
send "1*p"
setTextLineTrigger nolimp :nolay "You don't have that many mines available."
setTextLineTrigger laid :laid "Done. You have"
pause

:laid
send "'Limpet mine laid for clearing.*"
goto :gohome

:nolay
send "'I don't have any limpet mines.*"

:gohome
send "'Type 'gohome' in subspace to return to base.*"
waitfor "Message sent on sub-space channel"
:heh
setTextLineTrigger gohome :homechk "R " & $who & " gohome"
pause

:homechk
getWord CURRENTLINE $chk 1
if ($chk <> "R")
	goto :heh
end
send "'Planet Now warping home.*l  " $planetNumber "*  cp" $home "*yqq"
goto :top

:already_there
goto :top
