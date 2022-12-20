:fastCitadelAttack
	setVar $refurbString "l "&$PLANET&"* m * * * "
	setVar $attackString ""
	setVar $targetString  "a z "
	setVar $targetShotgunString "a z z y z"&$ship~SHIP_MAX_ATTACK&"* a z z * y z"&$ship~SHIP_MAX_ATTACK&"* a z z * * y z"&$ship~SHIP_MAX_ATTACK&"* "
	setVar $isFound FALSE
	getWordPos $sectorData $beaconPos "[0m[35mBeacon  [1;33m:"
	if ($player~FIGHTERS > 0)
		if ((($player~CURRENT_SECTOR > 10) AND ($player~CURRENT_SECTOR <> STARDOCK)) AND ($beaconPos > 0))
			setVar $targetString $targetString&"* "
		end
	else
		echo ANSI_12 "*You have no fighters.*" ANSI_7
		return
	end
	if (($emptyShipCount + $fakeTraderCount + $realTraderCount) > 0)
		setVar $i 0
		while ($i < ($emptyShipCount + $fakeTraderCount))
			setVar $targetString $targetString&"* "
			add $i 1
		end
		setVar $c 1
		while (($c <= $realTraderCount) AND ($isFound = FALSE))
			if ((($player~CURRENT_SECTOR <= 10) OR ($player~CURRENT_SECTOR = STARDOCK)) AND $TRADERS[$c][2] = TRUE)
				setVar $targetString $targetString&"* "
			elseif ($TRADERS[$c][1] = $player~CORP)
				setVar $targetString $targetString&"* "
			elseif (($targetingCorp = TRUE) AND ($TRADERS[$c][1] <> $target))
				setVar $targetString $targetString&"* "
			elseif (($targetingPerson = TRUE) AND ($TRADERS[$c] <> $target))
				setVar $targetString $targetString&"* "
			else
				setVar $isFound TRUE
				setVar $targetString $targetString&"z y z"
				
			end
			add $c 1
		end

	else
		echo ANSI_12 "*You have no targets.*" ANSI_7
		return
	end
	if ($isFound = TRUE)
		setVar $attackString ""
		setVar $count 8
		while ($count > 0)
			if ($shotgun)
				setVar $attackString $attackString&"q "&$targetShotgun&$refurbString
			else
				if ($doubletap)
					setVar $attackString $attackString&"q "&$targetString&$ship~SHIP_MAX_ATTACK&"* "&$targetString&$ship~SHIP_MAX_ATTACK&"* "&$refurbString
				else
					setVar $attackString $attackString&"q "&$targetString&$ship~SHIP_MAX_ATTACK&"* "&$refurbString
				end
			end
			subtract $count 1
		end
	else
		echo ANSI_12 "*You have no valid targets.*" ANSI_7
		return
	end
	send "q "&$attackString&" c "
return

