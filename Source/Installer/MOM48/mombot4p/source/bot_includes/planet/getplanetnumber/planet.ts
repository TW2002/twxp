#Author: Mind Dagger
#Gets all planet information from planet prompt.
#Needs: Start from Planet prompt


:getPlanetNumber
	send "*"
	setTextLineTrigger planetInfo3 :getJustTheNumber "Planet #"
	pause

	:getJustTheNumber
		send "  "
		getWord CURRENTLINE $PLANET 2
		stripText $PLANET "#"
		getWord CURRENTLINE $PLAYER~CURRENT_SECTOR 5
		stripText $PLAYER~CURRENT_SECTOR ":"
		saveVar $PLANET
		saveVar $PLAYER~CURRENT_SECTOR
		setSectorParameter $PLANET "PSECTOR" $PLAYER~CURRENT_SECTOR

return