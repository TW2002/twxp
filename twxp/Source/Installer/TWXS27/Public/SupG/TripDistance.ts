# TWX SupG Script       : TripDistanceSupG
# Author          	: SupG
#Date Completed/Updated : 01/30/03
# Description      	: Monitors fig hits and sends a subspace message containing the distance from
#			  your current location
# Trigger Point    	: Command or Citadel prompt
# Other            	: Let me know of any problems with this script
#		www.scripterstavern.com

setVar $trip_file GAMENAME & "_FIGHITS.txt"
cutText CURRENTLINE $location 1 7

if ($location <> "Command") AND ($location <> "Citadel")
        clientMessage "This script must be run from the command prompt"
        halt
end
if ($location = "Command")
	send "d"
else
	send "s"
end
:wait
killalltriggers
setTextLineTrigger currentsector :get_sector "Sector  :"
setTextLineTrigger hitfig :get_distance "Deployed Fighters Report Sector"
pause

:get_distance
setVar $attacking 0
getWordPos CURRENTLINE $attacking " is attacking!"
if ($attacking = 0)
	getWordPos CURRENTLINE $attacking " paid the toll of "
end
getWord CURRENTLINE $activated_sector 5
stripText $activated_sector ":"
isNumber $test $activated_sector
if ($test = 0) or ($attacking > 0)
	goto :wait
end
getText CURRENTLINE $person ": " "'s"
getDistance $hops $activated_sector $current_sector
if ($hops >= 1)
	waitfor "(?="
	send "' " $person " hit a fighter " $hops " hops from my current location.*"
	write $trip_file $person & " hit a fighter in " & $activated_sector & ", " & $hops & " hops from " & $current_sector
end
goto :wait

:get_sector
getWord CURRENTLINE $current_sector 3 
goto :wait
