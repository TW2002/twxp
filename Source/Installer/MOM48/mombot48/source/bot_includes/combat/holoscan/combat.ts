:holoScan
	# safe_attack_only makes sure holokill and in sector attack only happens when you can win the fight #
	setvar $sector~safe_attack_only true
	
	setvar $before_holo_kill_sector $player~current_sector
	gosub :combat~holokill
	killalltriggers
	if (($sector~holotargetfound = true) and ($player~current_sector <> $before_holo_kill_sector))
		setVar $PLAYER~WARPTO $before_holo_kill_sector
		gosub :PLAYER~twarp
		if (($PLAYER~twarpSuccess = FALSE) and ($player~msg <> "Already in that sector!"))
			setvar $switchboard~message "Could not make it back to starting sector after holokill. - ["&$player~msg&"]*"
		end
	end
	if ($switchboard~message <> "No targets found adjacent.*")
		gosub :switchboard~switchboard
	end
return
