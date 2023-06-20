:scanitcitkill
	gosub :checkForVictimsFromCitadel
	echo ansi_12 "*NO Targets*"
	return

:checkForVictimsFromCitadel
	gosub :player~quikstats
	setVar $player~startingLocation $player~CURRENT_PROMPT
	gosub :sector~getSectorData
	if ($sector~corpieCount < $sector~realTraderCount)
		goSub :combat~fastCitadelAttack
		goto :checkForVictimsFromCitadel
	end
return

include "source\bot_includes\sector\getSectorData\sector"