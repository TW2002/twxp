#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:fighters~deploy
# Deploy fighters to sector.  Uses the following variables which can be set:
# $fighters~personal	Make fighters personal (TRUE/FALSE; default=corporate)
# $fighters~toll		Drop toll fighters (default=defensive)
# $fighters~offensive	Drop offensive fighters (default=defensive)
# $fighters~amount		Amount of fighters to deploy (required)
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
loadvar $map~stardock
gosub :player~quikstats

if (($player~current_sector  < 11) or ($player~current_sector  = $map~stardock))
	setvar $switchboard~message "Can't deploy figs in fed*"
	gosub :switchboard~switchboard
	return
end

if ($bot~startinglocation = "Citadel")
	if ($player~current_prompt = "Citadel")
		send " q "
		gosub :planet~getplanetinfo
		send " q "
	elseif ($player~current_prompt = "Planet")
		gosub :planet~getplanetinfo
		send " q "
	end
end
if ($personal)
	setvar $owner "p"
	setvar $owner_label "personal"
else
	setvar $owner "c"
	setvar $owner_label "corporate"
end
if ($toll)
	setvar $type "t"
	setvar $type_label "toll"
elseif ($offensive)
	setvar $type "o"
	setvar $type_label "offensive"
else
	setvar $type "d"
	setvar $type_label "defensive"
end
send " f"

settextlinetrigger nocontrol :nocontrol "These fighters are not under your control."
settextlinetrigger abletodeploy :abletodeploy "fighters available."
settextlinetrigger cansupport :cansupport "Your ship can support"
pause

:nocontrol
killalltriggers
setvar $switchboard~message "We don't control the figs in this sector!*"
gosub :switchboard~switchboard
gosub :xenter~run
return

:abletodeploy
killtrigger nocontrol
killtrigger abletodeploy
getword currentline $available_fighters 3
striptext $available_fighters ","
striptext $available_fighters " "
pause

:cansupport
getword currentline $ftrs_to_leave 10
getword currentline $ship_fighters 7
striptext $ftrs_to_leave ","
striptext $ftrs_to_leave " "
striptext $ship_fighters ","
striptext $ship_fighters " "

if ($available_fighters >= $amount)
	if ($available_fighters < $ship_fighters)
		setvar $ftrs_to_leave $amount
	else
		setvar $ftrs_to_leave ($available_fighters-($player~fighters-$amount))
	end
else
	setvar $ftrs_to_leave $available_fighters
end

send " " $ftrs_to_leave " * " $owner " " $type

gosub :player~currentprompt
if ($bot~startinglocation = "Citadel")
	if ($player~current_prompt = "Command")
		gosub :planet~landingsub
	elseif ($player~current_prompt = "Planet")
		send "c "
		waiton "Citadel command (?=help)"
	end
end

#setVar $SWITCHBOARD~message $ftrs_to_leave&" "&$owner_label&" "&$type_label&" fighters have been deployed.*"
#gosub :SWITCHBOARD~switchboard

return

include "source\include\planet"
include "source\include\player"
include "source\include\switchboard"
include "source\include\xenter"
