goto :voidadjacentEOF

:voidadjacent
    getSector $_ckinc_getInfo~current_sector $sectorInfo
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

        send "'Avoids set on all adjacent sectors*"
        send "/"
        waitfor " Sect "
        return
    end


:clearadjacent
    getSector $_ckinc_getInfo~current_sector $sectorInfo
    if ($sectorInfo.warp[1] = 0)
        send "'This sector has no warps, maybe you need to scan it first*"
        halt
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

        send "'Avoids cleared on all adjacent sectors*"
        send "/"
        waitfor " Sect "
        return
    end

:voidadjacentEOF
