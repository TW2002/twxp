##############################################################################
# requires $player~startingLocation to be set before getSectorData is called #
##############################################################################

:getSectorData
	setVar $ENDLINE     "_ENDLINE_"
	setVar $STARTLINE   "_STARTLINE_"
	
	killalltriggers

	if ($passive)

	else
		if ($PLAYER~startingLocation = "Citadel")
			send "s"
		else
			if ($player~fedspace = true)
				send "*"
			else
				send "*"
			end
		end
	end
	:startover
	setVar $sectorData ""
	:sectorsline_cit_kill
		setVar $line CURRENTANSILINE
		setVar $line $STARTLINE&$line&$ENDLINE
		setVar $sectorData $sectorData&$line
		getWordPos $line $pos "Sector  [33m: "
		if ($pos > 0)
			getText $line $tempSector "Sector  [33m: [36m" " [0;32min" 
			setvar $player~current_sector $tempSector
		end
		getWordPos $line $pos "Warps to Sector(s) "
		if ($pos > 0)
			goto :gotSectorData
		else
			setTextLineTrigger getLine :sectorsline_cit_kill
		end
		pause
	:gotSectorData
		settexttrigger nomines :nomines "Citadel command (?=help)" 
		settexttrigger nomines2 :nomines "Command ["
		settexttrigger mines :mines "Mined Sector: Do you wish to Avoid this sector in the future? (Y/N)"
		pause

		:mines
		send "* "
		:nomines
		killtrigger nomines
		killtrigger nomines2
		killtrigger mines

		getWordPos $sectorData $beaconPos "[0m[35mBeacon  [1;33m:"
		if ($beaconPos > 0)
			setVar $containsBeacon TRUE
		else
			setVar $containsBeacon FALSE
		end
		setvar $player~current_sector currentsector
		goSub :getTraders
		goSub :getEmptyShips
		goSub :getFakeTraders
return


include "source\bot_includes\sector\getemptyships\sector"
include "source\bot_includes\sector\getfaketraders\sector"
include "source\bot_includes\sector\gettraders\sector"
