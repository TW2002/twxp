#Ender's Deploy/Xport/PlanetDrop v1.0
#Script used by solo players to quickly deploy fig, xport, land, drop planet.

Send "'Ender's deploy/xport/planetDrop v1.0 loaded! *"

:info
	echo ANSI_13 & "*What ship number would you like to xport to?*"
	getInput $shipNumber "Ship Number"

	echo ANSI_13 & "*What planet would you like to bring?*"
	getInput $planetNumber "Planet Number"

	echo ANSI_13 & "*What key would you like to activate script on?*"
	getInput $key "Key"
goto :getSector

:getSector
Send "D"
setTextLineTrigger getting :getting "Sector  :"
PAUSE
:getting
getword currentline $sector 3
striptext  $fighit ":"
goto :Trigger

:Trigger
	SetTextOutTrigger send :Send $key
	PAUSE
goto :Send

:Send
	send "f1*cd*"
	send "X" $shipNumber "**"
	send "L" $planetNumber "*cp" $sector "*y*"
	send "'Ender's Deploy/Xport/PlanetDrop executed! *"
HALT
