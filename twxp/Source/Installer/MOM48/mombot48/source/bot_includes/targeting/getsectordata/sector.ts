:getSectorData
	#Collects all sector data, and consolidates it
		killalltriggers
	if ($startingLocation = "Citadel")
		send "s* "
	else
		send "** "
	end
	setVar $sectorData ""

	:sectorsline_cit_kill
		setVar $line CURRENTANSILINE
		setVar $line $STARTLINE&$line&$ENDLINE
		setVar $sectorData $sectorData&$line
		getWordPos $line $pos "Warps to Sector(s) "
		if ($pos > 0)
			goto :gotSectorData
		else
			setTextLineTrigger getLine :sectorsline_cit_kill
		end
		pause

	:gotSectorData
		getWordPos $sectorData $beaconPos "[0m[35mBeacon  [1;33m:"
		if ($beaconPos > 0)
		   setVar $containsBeacon TRUE
				else
					setVar $containsBeacon FALSE
				end
		goSub :getTraders
		goSub :getEmptyShips
		goSub :getFakeTraders
return


include "source\bot_includes\targeting\getemptyships\targeting"
include "source\bot_includes\targeting\getfaketraders\targeting"
include "source\bot_includes\targeting\gettraders\targeting"
