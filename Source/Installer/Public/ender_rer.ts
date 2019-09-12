#Ender's Red Evac (Red) v1.1
#Waits for a custom message from a blue running Ender's Red Evac, then evacs to a safe jp.

send "'Ender's Red Evac (Red) v2.0 loaded *"

:info
	echo ANSI_13 & "*On what message would you like to evac?*"
	getInput $evacmessage "Message?"

	echo ANSI_13 & "*Do you need to xport to your jump ship?*"
	getInput $xport "(Y)es / (N)o"

	If ($xport = "Y") or ($xport = "y")
		echo ANSI_13 & "*What ship # would you like to xport to?*"
		getInput $ship "Ship number?"
	end

	echo ANSI_13 & "*What sector would you like to twarp to on evac?*"
	getInput $sector "Sector"
:trigger
	setTextLineTrigger subspace :subspace
PAUSE

:subspace
	getWord CURRENTLINE $message 3
	If ($message = $evacmessage)
		If ($xport = "Y") or ($xport = "y")
			send "x" $ship "*q"
		end
		send $sector "* yy"
		send "'I evaced sector due to Blue calling for evac *"
	end
goto :trigger
	
HALT