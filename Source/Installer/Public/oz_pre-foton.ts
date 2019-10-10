# OZ pwarp anticipation photon - for those pesky chargers
# see if we can run here...

setVar $oz_pantphot_version "OZ Anticipation Foton 2.0"

cutText CURRENTLINE $location 1 7
striptext $location " "
if ($location = "Citadel")
	goto :start_info
else
	echo ANSI_12 "**NEED TO BE AT CIT PROMPT!!**"
	halt
end

:start_info

	setVar $targetwarps 2
	setVar $scan "OFF"
	setVar $return "OFF"
	setVar $delay 1
	setVar $type "PWARP"

	
addMenu "" "OZ Anticipation Foton" "OZ Anticipation Photon Settings" "." "" "Main" FALSE
addMenu "OZ Anticipation Foton" "Run" "Run Script." "Z" :Menu_Run "" TRUE
addMenu "OZ Anticipation Foton" "Type" "Type" "T" :Menu_Type "" FALSE
addMenu "OZ Anticipation Foton" "Auto-Return"  "Auto-Return" "R" :Menu_Return "" FALSE
addMenu "OZ Anticipation Foton" "Target-Warps"  "Target-Warps" "W" :Menu_warps "" FALSE
addMenu "OZ Anticipation Foton" "Delay-ms" "Delay-ms" "D" :Menu_Delay "" FALSE

setMenuHelp "Run" "This Option Activates the PWarp Anticipation Foton."
setMenuHelp "Type" "This Option Toggles the type from PWarp to BWarp."
setMenuHelp "Auto-Return" "This Option Toggles the Return Home After Foton."
setMenuHelp "Target-Warps" "This Option Toggles the fire from 2 to 3 warpers."
setMenuHelp "Delay-ms" "This Option Sets the Manual Fire Delay in ms."

:start_menu
gosub :sub_setMenu
gosub :ozHeader
openMenu "OZ Anticipation Foton"



:ozHeader
ECHO ANSI_2 "*----------------------------------------*"
ECHO ANSI_10 "        " $oz_pantphot_version "       "
ECHO ANSI_2 "*----------------------------------------*"
return

:Menu_type
add $menu_type 1
	if ($menu_type = 1)
		setVar $type "PWARP"
	elseif ($menu_type = 0) 
		setVar $menu_type 0
		setVar $tpye "BWARP"
	else
		setVar $menu_type 0
		setVar $type "BWARP"
	end
gosub :sub_setMenu
gosub :ozheader
openMenu "OZ Anticipation Foton"

:menu_warps
add $menu_warps 1
	if ($menu_warps = 1)
		setVar $targetwarps "3"
	elseif ($menu_warps = 0) 
		setVar $menu_warps 0
		setVar $targetwarps "2"
	else
		setVar $menu_warps 0
		setVar $targetwarps "2"
	end
gosub :sub_setMenu
gosub :ozheader
openMenu "OZ Anticipation Foton"



:Menu_Return
add $menu_return 1
	if ($menu_return = 1)
		setVar $return "ON"
	elseif ($menu_return = 0) 
		setVar $menu_return 0
		setVar $return "OFF"
	else
		setVar $menu_return 0
		setVar $return "OFF"
	end
gosub :sub_setMenu
gosub :ozheader
openMenu "OZ Anticipation Foton"

:Menu_Delay
getInput $delay "Enter the fire delay ms time"
isNumber $number $delay
	if ($number <> 1)
		echo ANSI_12 "*Invalid Number*"
		goto :Menu_Delay
	end
gosub :sub_setMenu
gosub :ozheader
openMenu "OZ Anticipation Foton"


:sub_setMenu
	setMenuValue "Target-Warps" $targetwarps
	setMenuValue "Type" $type
	setMenuValue "Auto-Return" $return
	setMenuValue "Delay-ms" $delay
return

:menu_run
:mode5

send "' Activating OZ Antizipate Fast Foton*"
send "|"
waitFor "(?="
:get_info
send "I"
setTextLineTrigger home :home "Current Sector :"
setTextLineTrigger ptorps :ptorps5 "Photon Missiles:"
setTextLineTrigger notorps :notorps5 "Credits"
pause

:home
getWord CURRENTLINE $homesec 4
pause

:notorps5
echo ANSI_12 "**No Photons!!!**"
send "|"
halt

:ptorps5
killtrigger notorps
getWord CURRENTLINE $ptorps 3
send "q"
:getplanetnum
send "D"
setTextLineTrigger pnum :pnum "Planet #"
pause

:pnum
getWord CURRENTLINE $planet 2
stripText $planet "#"
send "c"


:letswait
:refresh
:glist
:get_da_figs
setVar $figfile "_ck_" & GAMENAME & ".figs"
setVar $read_count 0
setVar $merge_count 1
:read
add $read_count 1
read $figfile $read[$read_count] $read_count
if ($read[$read_count] = "EOF")
	goto :done_read
end
if ($read_count > 1)
	mergeText $read[1] $read[$read_count] $read[1]
end
goto :read

:done_read
:set_fig_array
setArray $figlist SECTORS
setVar $fig_array_count 0
:make_array
add $fig_array_count 1
if ($fig_array_count > SECTORS)
	goto :done_fig_array
end
getWord $read[1] $fig_check $fig_array_count
if ($fig_check <> 0)
	setVar $figlist[$fig_array_count] 1
end
goto :make_array

:done_fig_array
waitFor "Citadel command (?="
send "|"
:hehe5
killTrigger hitfig
setTextLineTrigger hitfig :get_distance5 "Deployed Fighters Report Sector"
pause

:get_distance5
getWord CURRENTLINE $activated_sector 5
stripText $activated_sector ":"
getWord CURRENTLINE $deadFig 5
stripText $deadfig ":"
setVar $figlist[$deadfig] 0


if ($targetwarps = 2)
	goto :targetwarps2
elseif ($targetwarps = 3)
	goto :targetwarps3
else
	goto :hehe5
end

:targetwarps2
:checkforwarps2
getSector $activated_sector $info

if ($info.warps = 2) 
	goto :checkfig2
	
else
	goto :hehe5
end

:checkfig2
setVar $adjs 0

if ($figlist[$info.warp[1]] = 1)
	setVar $target $info.warp[1]
	goto :check12
elseif ($figlist[$info.warp[2]] = 1)
	setVar $target $info.warp[2]
	goto :check22
else
	goto :hehe5
end

:check12
getSector $info.warp[1] $chk
:subcheck12
add $adjs 1
if ($adjs > $chk.warps)
	goto :hehe5
elseif ($figlist[$chk.warp[$adjs]] = 1)
	setVar $beamme $chk.warp[$adjs]
	goto :beam5
else
	goto :subcheck12
end

:check22
getSector $info.warp[2] $chk
:subcheck22
add $adjs 1
if ($adjs > $chk.warps)
	goto :hehe5
elseif ($figlist[$chk.warp[$adjs]] = 1)
	setVar $beamme $chk.warp[$adjs]
	goto :beam5
else
	goto :subcheck22
end


:targetwarps3
:checkforwarps3
getSector $activated_sector $info

if ($info.warps < 4) and ($info.warps > 1) 
	goto :checkfig3
	
else
	goto :hehe5
end

:checkfig3
setVar $adjs 0

if ($figlist[$info.warp[1]] = 1)
	setVar $target $info.warp[1]
	goto :check13
elseif ($figlist[$info.warp[2]] = 1)
	setVar $target $info.warp[2]
	goto :check23
elseif ($figlist[$info.warp[3]] = 1)
	setVar $target $info.warp[3]
	goto :check33
else
	goto :hehe5
end

:check13
getSector $info.warp[1] $chk
:subcheck13
add $adjs 1
if ($adjs > $chk.warps)
	goto :hehe5
elseif ($figlist[$chk.warp[$adjs]] = 1)
	setVar $beamme $chk.warp[$adjs]
	goto :beam5
else
	goto :subcheck13
end

:check23
getSector $info.warp[2] $chk
:subcheck23
add $adjs 1
if ($adjs > $chk.warps)
	goto :hehe5
elseif ($figlist[$chk.warp[$adjs]] = 1)
	setVar $beamme $chk.warp[$adjs]
	goto :beam5
else
	goto :subcheck23
end

:check33
getSector $info.warp[3] $chk
:subcheck33
add $adjs 1
if ($adjs > $chk.warps)
	goto :hehe5
elseif ($figlist[$chk.warp[$adjs]] = 1)
	setVar $beamme $chk.warp[$adjs]
	goto :beam5
else
	goto :subcheck23
end






:beam5
if ($delay = 0)
	setVar $delay 1
end
setDelayTrigger warpdelay :warpdelay $delay
pause

:warpdelay
if ($type = "PWARP")
	goto :pwarp5
elseif ($type = "BWARP")
	goto :bwarp5
else
	goto :hehe5
end


:pwarp5
	killAllTriggers
	send "p" $beamme "*y  c  p  y  " $target "**q"
	setTextLineTrigger wrong :wrong "That is not an adjacent sector"
	setTextLineTrigger gotem :gotem "Photon Missile launched into sector"
	pause

:wrong
	killAllTriggers
	goto :hehe5
:gotem
	killAllTriggers
	send "' OZ Antizipate Fast Foton Fired - Sector -> " $target "!*"
	goto :aftershot
	
:bwarp5

	killAllTriggers
	send "b" $beamme "*"
	setTextTrigger go :go5 "TransWarp Locked"
	setTextTrigger no :no5 "No locating beam found"
	pause

:no5
killTrigger go
send "n"
waitfor "Transporter shutting down."
setVar $figlist[$beamme] 0
goto :hehe5

:go5
killTrigger no
send "y  z  a  999*  *  c  p  y  " $target "*  q  z  n  "
subtract $ptorps 1
send "'Anticipation Photon Fired - Sector " $target "!*"

:aftershot
if ($type = "PWARP")
	goto :pwarpreturn5
elseif ($type ="BWARP")
	goto :bwarpreturn5
end

send "m" $homesec "*y"
SetTextLineTrigger homelock :homelock "TransWarp Locked"
setTextLineTrigger adj :adj5 "<Set NavPoint>"
setTextLineTrigger nohomelock :nohomelock "No locating beam found"
setTextLineTrigger outof :nohomelock "not have enough Fuel"
pause

:nohomelock
send "n"
echo ANSI_12 "**Can't Get Home!!!**"
halt




:homelock
killTrigger adj
killTrigger nohomelock
killTrigger outof
send "y"
:nonadj5
waitFor "Warps to Sector(s)"
goto :restock5

:adj5
killTrigger homelock
killTrigger nohomelock
killTrigger outof
send "q"
goto :restock5

:restock5
halt









:pwarpreturn5
send "p" $homesec "*y"
SetTextLineTrigger homelock :homelock5 "Locating beam pinpointed"
setTextLineTrigger nohomelock :nohomelock5 "Your own fighters must be"
pause

:nohomelock5
echo ANSI_12 "**Can't Get Home!!!**"
halt


:homelock5
killTrigger nohomelock
halt

