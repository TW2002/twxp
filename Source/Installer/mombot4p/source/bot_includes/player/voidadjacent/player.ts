# =================================== ADJACENT CONTROLS ====================================
:voidadjacent
	getSector $CURRENT_SECTOR $sectorInfo
	if ($sectorInfo.warp[1] = 0)
		send "'This sector has no warps, maybe you need to scan it first*"
		halt
	else
		setVar $voidsect 0
		:voids
		add $voidsect 1
		if ($voidsect < 7)
			if ($sectorInfo.warp[$voidsect] <> 0)
				send "CV" & $sectorInfo.warp[$voidsect] & "*Q"
			end
			goto :voids
		end

		send "/"
		waitOn " Sect "    
	end
return
