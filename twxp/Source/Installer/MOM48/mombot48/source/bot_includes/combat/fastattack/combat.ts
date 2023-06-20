:fastAttack
	
	setVar $targetString  "a"
	setVar $player~isFound FALSE
	setVar $targetShotgun "a z z y z"&$SHIP~SHIP_MAX_ATTACK&"* * a z z * y z"&$SHIP~SHIP_MAX_ATTACK&"* * a z z * * y z"&$SHIP~SHIP_MAX_ATTACK&"* * "

	if ($SHIP~SHIP_MAX_ATTACK <= 0)
		gosub :ship~getshipstats
	end

	if (($player~current_sector = stardock) or ($player~current_sector <= 10))
		setvar $player~fedspace true
	end
		if ($player~fighters <= 0)
			gosub :player~quikstats
			if (($player~current_sector = 1) or (port.class[$player~current_sector] = 0) or ($player~current_sector = $map~stardock))
				if ($player~current_sector = $map~stardock)
					send "P  S G Y G Q s p"
				else
					send "p ty"
				end
				waitOn "B  Fighters        :"
				getWord CURRENTLINE $figsToBuy 8
				waitOn "C  Shield Points   :"
				getWord CURRENTLINE $shieldsToBuy 9

				send "b " $figsToBuy "* c " $shieldsToBuy "* "

				gosub :player~quikstats
				if ($player~fighters <= 0)
					setvar $switchboard~message ANSI_12&"*You have no fighters even after refurb.  Hiding out on dock.*"&ANSI_7
					gosub :bot~echo
				end
				if ($player~current_sector = $map~stardock)
					send " q q q "
				else
					send " q "
				end
				return
			else
				gosub :player~quikstats
				if ($player~fighters <= 0)
					setvar $switchboard~message ANSI_12&"*You have no fighters.*"&ANSI_7
					gosub :bot~echo
					return
				end
			end
		end
	if ($player~fedspace <> true)
		getWordPos $SECTOR~sectorData $beaconPos "[0m[35mBeacon  [1;33m:"
		if ($beaconPos > 0)
			setVar $targetString $targetString&"*"
		end
	end
	if (($SECTOR~emptyShipCount + $SECTOR~fakeTraderCount + $SECTOR~realTraderCount) > 0)
		setVar $i 0
		while ($i < ($SECTOR~emptyShipCount + $SECTOR~fakeTraderCount))
			setVar $targetString $targetString&"* "
			add $i 1
		end
		setVar $c 1
		while (($c <= $SECTOR~realTraderCount) AND ($player~isFound = FALSE))

			if (($player~traders[$c][1]) = ($player~CORP))
				setVar $targetString $targetString&"* "
			elseif (($player~fedspace = true) AND ($player~traders[$c][2] = TRUE))
				setVar $targetString $targetString&"* "
			elseif (($PLAYER~targetingShip <> false) and ($player~traders[$c][3] <> true))
				setVar $targetString $targetString&"* "
			else
				setvar $enemy_fighters $player~traders[$c][4]
				setvar $enemy_name $player~traders[$c]
				if ($sector~safe_attack_only <> true)
					setVar $player~isFound TRUE
				else
					# calculate odds of ships - only attack if you can win #
					setvar $too_many_fighters (($ship~SHIP_OFFENSIVE_ODDS * $player~fighters) < (($enemy_fighters + $target_shields) * $target_defense_odds))
					if (($sector~safe_attack_only = true) and ($too_many_fighters <> true))
						setVar $player~isFound TRUE
					else
						echo "*Safe mode active - Too many fighters on " $enemy_name ".  Can't attack them and survive.*"
					end
				end
				if ($player~isFound = true)
					setVar $targetString $targetString&"zy z"
				end
			end
			add $c 1
		end
	else
		#if ($sector~passive <> true)
			setvar $switchboard~message "*You have no targets.*" 
			gosub :bot~echo
		#end
		goto :stoppingPoint
	end
	if ($player~isFound = TRUE)
		setVar $attackString ""
		if (($player~GENESIS > 0) and ($defender = true))
			setVar $attackString "u y n.* c "
			setvar $player~genesis ($player~genesis-1)
		end

		setvar $starting_fighters $player~fighters
		while ($player~fighters > 0)
			if ($player~fighters < $SHIP~SHIP_MAX_ATTACK)
				if ($player~shotgun)
					setVar $attackString $attackString&$targetShotgun&$player~refurbString
				else
					if ($player~doubletap)
						setVar $attackString $attackString&$targetString&$player~fighters&"* * "&$targetString&$player~fighters&"* * "&$player~refurbString
					else
						setVar $attackString $attackString&$targetString&$player~fighters&"* * "&$player~refurbString
					end
				end
				setVar $player~fighters 0
			else
				if ($player~shotgun)
					setVar $attackString $attackString&$targetShotgun&$player~refurbString
				else
					if ($player~doubletap)
						setVar $attackString $attackString&$targetString&$SHIP~SHIP_MAX_ATTACK&"* * "&$targetString&$SHIP~SHIP_MAX_ATTACK&"* * "&$player~refurbString
						setVar $player~fighters ($player~fighters - $SHIP~SHIP_MAX_ATTACK)
					else
						setVar $attackString $attackString&$targetString&$SHIP~SHIP_MAX_ATTACK&"* * "&$player~refurbString
					end
				end
				setVar $player~fighters ($player~fighters - $SHIP~SHIP_MAX_ATTACK)
			end
		end
	else
		#if ($sector~passive <> true)
			setvar $switchboard~message "*You have no valid targets.*" 
			gosub :bot~echo
		#end
		goto :stoppingPoint
	end
	if (($sector~passive = true) and ($starting_fighters < $enemy_fighters))
		setvar $player~fighters $starting_fighters
		setvar $switchboard~message "*Enemy has too many fighters to attack auto ("&$enemy_fighters&").*" 
		gosub :bot~echo
	else
		send $attackString&"* "
		#gosub :player~quikstats
	end
	:stoppingPoint
return

