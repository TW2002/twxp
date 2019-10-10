#Ender's quick xport v1.0
#Quicly xports you into a safe ship.

send "'Ender's quick xport v1.0 loaded! *"
:info
	echo ANSI_13 & "*What ship number would you like to xport to?*"
	getInput $shipNumber "Ship Number"

	echo ANSI_13 & "*What key would you like to activate quick xport on?*"
	getInput $key "Acitvate key?"

	send "'Ender's xport will now run in background with ship number " $shipnumber "*"
	echo ANSI_13 & "*Script is active, press " $key " to launch*"

	send "'Press @ to reset ship number... *"
goto :trigger

:trigger
	SetTextOutTrigger send :send $key
	SetTextOutTrigger reset :reset "@"
	SetTextLineTrigger noShip :noShip "That is not an available ship."
PAUSE

:send
	send "X" $shipNumber "**"
	send "'Ender's quick xport activated, xporting if ship is in range! *"

	send "'Ender's quick xport v1.0 loaded! *"
	killAllTriggers
goto :trigger

:reset
	killAllTriggers
goto :info

:noShip
	send "'That ship is not avaliable, please reset ship # *"
	killAllTriggers
goto :trigger
