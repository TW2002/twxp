#requires $planet
#requires $bot_name
#requires switchboard

:landingSub
	gosub :killlandingtriggers
	send "l" $PLANET "*z  n  z  n  *  "
	setVar $sucessfulCitadel FALSE
	setVar $sucessfulPlanet FALSE
	setTextLineTrigger noplanet :noplanet "There isn't a planet in this sector."
	setTextLineTrigger no_land :no_land "since it couldn't possibly stand"
	setTextLineTrigger planet :planet "Planet #"
	setTextLineTrigger wrongone :wrong_num "That planet is not in this sector."
	pause
:noplanet
	gosub :killlandingtriggers
	setVar $SWITCHBOARD~message "No Planet in Sector!*"
	gosub :SWITCHBOARD~switchboard
	return
:no_land
	gosub :killlandingtriggers
	setVar $SWITCHBOARD~message "This ship cannot land!*"
	gosub :SWITCHBOARD~switchboard
	return
:planet
	getWord CURRENTLINE $pnum_ck 2
	stripText $pnum_ck "#"
	gosub :killlandingtriggers
	if ($pnum_ck <> $PLANET)
		send "q"
		goto :wrong_num
	end
	setTextTrigger wrong_num :wrong_num "That planet is not in this sector."
	setTextTrigger planet :planet_prompt "Planet command"
	pause
:wrong_num
	killtrigger planet
	send "**"
	setVar $SWITCHBOARD~message "Incorrect Planet Number*"
	gosub :SWITCHBOARD~switchboard
	return
:planet_prompt
	killtrigger wrong_num
	setVar $currentBotPlanet $planet
	saveVar $currentBotPlanet 
	saveVar $PLANET
	setVar $sucessfulPlanet TRUE
	if ($land_and_lift = true)
		send "m* * * q  "
		return
	end
	send "m* * * c*"
	setTextTrigger build_cit :build_cit "Do you wish to construct one?"
	setTextTrigger in_cit :in_cit "Citadel command"
	setTextTrigger nocitallowed :build_cit "Citadels are not allowed in FedSpace."
	setTextTrigger citnotbuiltyet :build_cit "Be patient, your Citadel is not yet finished."
	pause
:build_cit
	gosub :killlandingtriggers
	setVar $sucessfulPlanet TRUE
	setVar $startingLocation "Planet"
	return
:in_cit
	gosub :killlandingtriggers
	setVar $sucessfulCitadel TRUE
	setVar $startingLocation "Citadel"
return


:killlandingtriggers
	killtrigger noplanet
	killtrigger no_land
	killtrigger planet
	killtrigger wrongone
	killtrigger in_cit
	killtrigger nocitallowed
	killtrigger build_cit
	killtrigger citnotbuiltyet
return