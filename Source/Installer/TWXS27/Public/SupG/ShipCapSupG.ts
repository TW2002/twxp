# Script Name      : SupGShipCap
# Author           : SupG
# Description      : Calculates appropriate amount of figs to shoot at an enemy ship
#                    to capture it, shoots one time and is activated by user pressing
#                    Y at the attack prompt on the target ship.
# Trigger Point    : Sector command prompt
# Warnings         : The first time you run this script in any particular game it goes
#                    through the ship catalog and gets the known ship specs, up to 2
#                    pages of ships will be recorded. Don't run this for the first time
#		     in a particular game if you are trying to cap an online players ship
#		     or you will be waiting for the ship catalog to scroll by, start this 
#		     script when you first begin a game so you have the data available.
# Other            : You are free to modify this script to your liking, but please give me
#                    credit for any of my code that you use.
#		     By releasing the source code to this script I fear that people with 
#		     scripting knowledge will know better how to "beat" this script, though
#		     I highly doubt many people will actually use the tactics involved that it
#		     would take to do so.
systemscript
#initialize Variables

setVar $cap_file GAMENAME & "_SHIPS.txt"
loadVar $capSaved
if ($capSaved)
	goto :start
else
	delete $cap_file
	setVar $capSaved 1
	saveVar $capSaved
end

:start
fileExists $chck $cap_file
# check if we can run it from here
cutText CURRENTLINE $location 1 7
if ($location <> "Command") AND ($location <> "Citadel")
        clientMessage "This script must be run from the command menu"
        halt
end

if ($chck = 0)
	gosub :shipinfo_inc~shipInfo
else
	goto :cap_ship
end

#time for some ship cappin
:cap_ship
gosub :loadShipInfo
#get own offensive odds
send "c;"
setTextLineTrigger oo :oo "Offensive Odds:"
pause

:oo
setVar $oddsline CURRENTLINE
stripText $oddsline "Main Drive Cost:"
stripText $oddsline "Max Fighters:"
stripText $oddsline "Offensive Odds:"
getword $oddsline $real_odds 3
stripText $real_odds "."
stripText $real_odds ":1"
send "q"

:wait
#wait for user to attack
setVar $unmanned "NO"
setVar $own_odds $real_odds 
setVar $cap_points 0
setVar $max_figs 0
setVar $cap_shield_points 0
setVar $ship_fighters 0
waitFor "[N]? Yes"
setVar $cap_ship_info CURRENTLINE
getWord $cap_ship_info $attack_prompt 1
if ($attack_prompt <> "Attack")
	goto :wait
end
setVar $type_count 0
setVar $is_ship 0

#find out the ship type
:ship_type
if ($type_count < $shipCounter)
	add $type_count 1
	getWordPos $cap_ship_info $is_ship $shipList[$type_count]
	getWordPos $cap_ship_info $unman "'s unmanned"
	if ($unman > 0)
		setVar $unmanned "YES"
	end
	if ($is_ship > 0)
		getWord $ship[$shipList[$type_count]] $shields 1
		getWord $ship[$shipList[$type_count]] $defodds 2
		goto :send_attack
	else
		goto :ship_type
	end
else
	clientMessage "Unknown ship type, cannot calculate attack, you must do it manually"
	goto :wait
end

#how many fighters do they have
:send_attack
getText $cap_ship_info $ship_fighters $shipList[$type_count] "(Y/N)"
getText $ship_fighters $ship_fighters "-" ")"
stripText $ship_fighters ","
setVar $ship_shield_percent 0
setVar $shieldpoints 0
#how many shields do they have
setTextLineTrigger combat :combat_scan "Combat scanners show enemy shields at"
setTextTrigger nocombat :cap_it "How many fighters do you wish to use"
pause

:combat_scan
getWord CURRENTLINE $shieldperc 7
stripText $shieldperc "%"
setVar $shieldPoints (($shields * $shieldperc) / 100)
pause

#calculate and attack
:cap_it
killtrigger combat
getWord CURRENTLINE $max_figs 11
stripText $max_figs ","
stripText $max_figs ")"
setVar $cap_points 0
add $cap_points $shieldPoints
add $cap_points $ship_fighters
multiply $cap_points $defodds
setVar $cap_points ((($shieldPoints + $ship_fighters) * $defodds) / $own_odds)
setVar $cap_points (($cap_points * 95) / 100)

if ($unmanned = "YES")
	divide $cap_points 2
end
if ($cap_points = 0)
	setVar $cap_points 1
elseif ($cap_points > $max_figs)
	setVar $cap_points $max_figs
end
send $cap_points "*"
goto :wait

:loadShipInfo
setVar $shipcounter 1
:readshiplist
read $cap_file $shipInf $shipcounter
if ($shipInf <> "EOF")
	getWord $shipInf $shields 1
	getLength $shields $shieldlen
	
	getWord $shipInf $defodd 2
	getLength $defodd $defoddlen
	
	getWord $shipinf $off_odds 3
	getLength $off_odds $filler1len
	
	getWord $shipinf $ship_cost 4
	getLength $ship_cost $filler2len
	
	getWord $shipinf $max_holds 5
	getLength $max_holds $filler3len
	
	getWord $shipinf $max_fighters 6
	getLength $max_fighters $filler4len
	
	getWord $shipinf $init_holds 7
	getLength $init_holds $filler5len

	getWord $shipinf $tpw 8
	getLength $tpw $filler6len

	setVar $startlen ($shieldlen + $defoddlen + $filler1len + $filler2len + $filler3len + $filler4len + $filler5len + $filler6len + 9)
	cutText $shipinf $ShipName $startlen 999
	setVar $ship[$ShipName] $shields & " " & $defodd
	setVar $shipList[$shipcounter] $ShipName
	add $shipcounter 1
	goto :readshiplist
end
return

include "supginclude\shipinfo_inc"