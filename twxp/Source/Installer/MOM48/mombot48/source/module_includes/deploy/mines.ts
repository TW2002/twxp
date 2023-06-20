:deploy

	if ($personal)
		setvar $mine "p"
	else
		setvar $mine "c"
	end

	gosub :PLAYER~QUIKSTATS

	if (($player~current_sector = $map~stardock) OR ($player~current_sector <= 10))
		setVar $SWITCHBOARD~message "Can't deploy into Fed Space!*"
		gosub :SWITCHBOARD~switchboard
		return
	end
	setVar $bot~startingLocation $PLAYER~CURRENT_PROMPT

	setVar $bot~validPrompts "Command Citadel"
	gosub :bot~checkStartingPrompt
	if ($bot~startingLocation = "Citadel")
		send "q "
		gosub :PLANET~getPlanetInfo
		send "c "
	end
	setVar $preDeployArmids $player~armids
	setvar $preDeployLimpets $player~limpets
	if ($bot~startingLocation = "Citadel")
		send "s"
		setVar $start_mac "q q "
		setVar $end_mac "l "&$planet~planet&"* c s"
	else
		send "*"
		setVar $start_mac ""
		setVar $end_mac "*"
	end
	waitOn "Warps to Sector(s) :"
	send "* "
	setvar $armid_count SECTOR.MINES.QUANTITY[$player~current_sector]
	setvar $limpet_count SECTOR.LIMPETS.QUANTITY[$player~current_sector]
	setVar $limpetOwner SECTOR.LIMPETS.OWNER[$player~current_sector]
	setVar $armidOwner SECTOR.MINES.OWNER[$player~current_sector]

	if (($player~armids <= 0) AND (($armidOwner <> "belong to your Corp") AND ($armidOwner <> "yours")))
		setVar $SWITCHBOARD~message "Out of armids!*"
		gosub :SWITCHBOARD~switchboard
		return
	elseif ($amount > $player~armids)
		setVar $amount $player~armids
	end
	if (($player~limpets <= 0) AND (($limpetOwner <> "belong to your Corp") AND ($limpetOwner <> "yours")))
		setVar $SWITCHBOARD~message "Out of limpets!*"
		gosub :SWITCHBOARD~switchboard
		return
	elseif ($amount > $player~limpets)
		setVar $amount $player~limpets
	end
	if ((($armidOwner <> "belong to your Corp") OR ($armidOwner <> "yours")) and (($limpetOwner <> "belong to your Corp") OR ($limpetOwner <> "yours")) and ($limpet_count >= $amount) and ($armid_count >= $amount))
		setVar $SWITCHBOARD~message "Armid and limpet mines already deployed into this sector!*"
		gosub :SWITCHBOARD~switchboard
		return
	end

	send $start_mac "z n h 2 z " $amount "*  z" $mine "* h 1 z " $amount "*  z " $mine "* q q * " $end_mac
	waiton "Warps to Sector(s) :"
	gosub :PLAYER~quikstats
	send "* "
	
	if ((($predeployArmids > $player~armids) AND ($predeployLimpets > $player~limpets)) OR (($predeployLimpets = $player~limpets) AND (($limpetOwner = "belong to your Corp") OR ($limpetOwner = "yours")) AND ($predeployArmids = $player~armids) AND (($armidOwner = "belong to your Corp") OR ($armidOwner = "yours"))))
		setVar $SWITCHBOARD~message $amount&" Armid and Limpet mines deployed into the sector!*"
		gosub :SWITCHBOARD~switchboard
		setSectorParameter $player~current_sector "LIMPSEC" TRUE
		setSectorParameter $player~current_sector "MINESEC" TRUE
	else
		if ($predeployArmids > $player~armids)
			setVar $SWITCHBOARD~message $switchboard~message&$amount&" Armid mine(s) deployed into the sector!*"
			setSectorParameter $player~current_sector "MINESEC" TRUE
		end
		if ($predeployLimpets > $player~limpets)
			setVar $SWITCHBOARD~message $switchboard~message&$amount&" Limpet mine(s) deployed into the sector!*"
			setSectorParameter $player~current_sector "LIMPSEC" TRUE
		end
		gosub :SWITCHBOARD~switchboard
	end
	if ($predeployArmids < $player~armids)
		setVar $SWITCHBOARD~message ($player~armids-$predeployArmids)&" Armid mines picked up from sector!*"
	elseif (($predeployArmids = $player~armids) AND (($armidOwner <> "belong to your Corp") AND ($armidOwner <> "yours")))
		setVar $SWITCHBOARD~message "Enemy armid(s) present in sector, cannot deploy!*"
	end
	gosub :SWITCHBOARD~switchboard
	if ($predeployLimpets < $player~limpets)
		setVar $SWITCHBOARD~message ($player~limpets-$predeployLimpets)&" Limpet mines picked up from sector!*"
	elseif (($predeployLimpets = $player~limpets) AND (($limpetOwner <> "belong to your Corp") AND ($limpetOwner <> "yours")))
		setVar $SWITCHBOARD~message "Enemy limpet(s) present in sector, cannot deploy!*"
	end
	gosub :SWITCHBOARD~switchboard
	return
# ============================== END MINES (ARMID AND LIMP) SUB ==============================
