:clearadjacent
	getSector $CURRENT_SECTOR $sectorInfo
	if ($sectorInfo.warp[1] = 0)
		setVar $SWITCHBOARD~message "This sector has no warps, try to scan it first!*"
		gosub :SWITCHBOARD~switchboard
		return
	else
		setVar $voidsect 0
		:clearvoids
		add $voidsect 1
		if ($voidsect < 7)
			if ($sectorInfo.warp[$voidsect] <> 0)
				send "CV0*YN" & $sectorInfo.warp[$voidsect] & "*Q"
			end
			goto :clearvoids
		end

		send "/"
		waitOn " Sect "
	end
return
