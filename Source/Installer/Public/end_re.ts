#Ender's Red Evac v1.0
#Will wait for a fig hit a sepcified number of hoops away, then order the reds to warp to a safe jp.

send "'Ender's Red Evac v2.0 loaded *"
	
:info
	echo ANSI_13 & "*How many hops away would you like to order the reds out on?*"
	getInput $figlay "Hops?"

	echo ANSI_13 & "*What message would you like to send to reds if evac is needed?*"
	getInput $order "Message?"

	echo ANSI_13 & "*Would you like to evac sector if hop is hit?*"
	getInput $blueevac "(Y)es / (N)o"

	If ($blueevac = "Y") or ($blueevac = "y")
	echo ANSI_13 & "*What is the jp you would like to twarp to?*"
	getInput $jp "Jump point?"
	end

send "'I am calling for evac on " $figlay " hops. *"
:trigger
	setTextLineTrigger hit :hit "Deployed Fighters Report Sector"
PAUSE

:hit
getword currentline $fighit 5
striptext  $fighit ":"

send "'Figther hit in " $fighit "*"
send $fighit "*n"

setTextLineTrigger hop :hop "The shortest path ("
PAUSE

:hop
getword currentline $hop 4
striptext $hop "("
send "'Figther is " $hop " hops away *"

If ($figlay = $hop)
	send "'" $order "*"
	send "'" $order "*"
	send "N"
		If ($blueevac = "Y") or ($blueevac = "y")
			send $jp "* yy"
		end
	HALT
end

If ($figlay <> $hop)
	send "N"
end
goto :trigger

	
