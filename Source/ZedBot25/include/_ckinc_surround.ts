# ----- What type of figs to surround with? -----
loadVar $ckSurroundFigtype
if ($ckSurroundFigtype = "T")
    setVar $ckSurroundFigtype "T"
elseif ($ckSurroundFigtype = "D")
    setVar $ckSurroundFigtype "D"
else
    setVar $ckSurroundFigtype "O"
end
saveVar $ckSurroundFigtype

# ----- How many Figs to surround with? -----
loadVar $ckSurroundFigamount
isNumber $isanum $ckSurroundFigamount
if ($isanum)
    if ($ckSurroundFigamount < 1)
        setVar $ckSurroundFigamount "1"
    elseif ($ckSurroundFigamount > 1000)
        setVar $ckSurroundFigamount "1000"
    end
else
    setVar $ckSurroundFigamount "1"
end
saveVar $ckSurroundFigamount

# ----- How many Armids to surround with? -----
loadVar $ckSurroundArmidamount
isNumber $isanum $ckSurroundArmidamount
if ($isanum)
    if ($ckSurroundArmidamount < 0)
        setVar $ckSurroundArmidamount "0"
    elseif ($ckSurroundArmidamount > 250)
        setVar $ckSurroundArmidamount "250"
    end
else
    setVar $ckSurroundArmidamount "0"
end
saveVar $ckSurroundArmidamount


# ----- How many Limpets to surround with? -----
loadVar $ckSurroundLimpetamount
isNumber $isanum $ckSurroundLimpetamount
if ($isanum)
    if ($ckSurroundLimpetamount < 0)
        setVar $ckSurroundLimpetamount "0"
    elseif ($ckSurroundLimpetamount > 250)
        setVar $ckSurroundLimpetamount "250"
    end
else
    setVar $ckSurroundLimpetamount "0"
end
saveVar $ckSurroundLimpetamount


# ----- AutoLoad ShipCap ? -----
loadVar $ckShipCapAutoLoad
if ($ckShipCapAutoLoad = "anywhere")
    setVar $ckShipCapAutoLoad "anywhere"
elseif ($ckShipCapAutoLoad = "nowhere")
    setVar $ckShipCapAutoLoad "nowhere"
else
    setVar $ckShipCapAutoLoad "nodock"
end
saveVar $ckShipCapAutoLoad


# ----- Lift -----
if ($_ckinc_getPlanetInfo~planet <> 0)
    send "QQ  *  *  "
end


send "NQSDSH* "
setTextLineTrigger density :density "Relative Density Scan"
pause

:density
    setVar $warps 0
    setTextLineTrigger 1 :getWarp "Sector "
    setTextTrigger 2 :gotWarps "Command [TL="
    pause

:getWarp
    add $warps 1
    setVar $line CURRENTLINE
    stripText $line "("
    getWord $line $warp 2
    getWord $line $density 4
    getWord $line $warpCount 7
    getWord $line $haz 10
    getWord $line $anom 13
    getLength $warp $length
    striptext $haz "%"
    cutText $warp $explored $length 1
    if ($explored = ")")
            setVar $explored 0
    else
            setVar $explored 1
    end
    stripText $warp ")"
    stripText $density ","
    setVar $warp[$warps] $warp
    setVar $density[$warps] $density
    setVar $warpCount[$warps] $warpCount
    setVar $haz[$warps] $haz
    setVar $anom[$warps] $anom
    setVar $explored[$warps] $explored
    setTextLineTrigger 1 :getWarp "Sector "
    pause

:gotWarps
    # ok - now we've got all our warp info
    killTrigger 1
    killTrigger 2
    setVar $figs_needed $warps
    add $figsneeded 1
    multiply $figs_needed $ckSurroundFigamount
    add $figs_needed $warps
    if ($figs_needed > $_ckinc_getInfo~figs)
        ECHO "**You don't have enough figs to drop " & $ckSurroundFigamount & " - Dropping 1 instead**"
        setVar $ckSurroundFigamount 1
    end
    setTextLineTrigger holo :holo "Select (H)olo Scan or (D)ensity Scan"
    setTextLineTrigger noholo :noholo "Handle which mine type"
    pause

:holo
    killalltriggers
    setVar $i 0
    :sectorholo
        setTextLineTrigger sect :sect "Sector  :"
        setTextLineTrigger planets :planets "Planets :"
        setTextLineTrigger figs :figs "Fighters:"
        setTextLineTrigger mines :mines "Mines   :"
        setTextTrigger gotHolo :gotHolo "Command [TL="
        pause

        :sect
            killalltriggers
            add $i 1
            setVar $figowner[$i] ""
            setVar $figamt[$i] 0
            goto :sectorholo

        :planets
            killalltriggers
            setVar $planets[$i] 1
            goto :sectorholo

        :figs
            killalltriggers
            GetWordPos CURRENTLINE $startpos "(belong"
            cuttext CURRENTLINE $figowner[$i] $startpos 21
            GetWord CURRENTLINE $figamt[$i] 2
            stripText $figamt[$i] ","
            GetLength CURRENTLINE $figlength
            setVar $figtypestart $figlength
            subtract $figtypestart 11
            cutText CURRENTLINE $figtype[$i] $figtypestart 11
            goto :sectorholo

        :mines
            killalltriggers
            #Mines   : 50 (Type 1 Armid) (belong to Corp#2, birdies)
            getWord CURRENTLINE $minetype 6
            if ($minetype = "Armid)")
                GetWordPos CURRENTLINE $startpos "(belong"
                getLength CURRENTLINE $minelength
                subtract $minelength $startpos
                add $minelength 1
                cuttext CURRENTLINE $mineowner[$i] $startpos $minelength
                GetWord CURRENTLINE $mineamt[$i] 3
            end
            goto :sectorholo

        :gotHolo
            killalltriggers
            goto :surround

:noholo
    killalltriggers
    setVar $i 0
    :nofigloop
        add $i 1
        setVar $figowner[$i] ""
        if ($i < $warps)
            goto :nofigloop
        end
    goto :surround


:surround

    setVar $mineMacro ""
    if ($ckSurroundArmidamount <> 0)
        setVar $mineMacro $mineMacro & "H1Z" & $ckSurroundArmidamount & "*  ZCZ*  "
    end
    if ($ckSurroundLimpetamount <> 0)
        setVar $mineMacro $mineMacro & "H2Z" & $ckSurroundLimpetamount & "*  ZCZ*  "
    end

    :subspaceMessage
        send "'Surrounding sector " & $ck_surround_sector & "*"
        setVar $i 0
        setVar $output ""
        setVar $complete 1

    :figSector
        add $i 1
        getDistance $the_distance $warp[$i] $ck_surround_sector
        if ($figowner[$i] = "(belong to your Corp)")
            echo "**SECTOR " & $warp[$i] & " already has our figs.**"
        elseif (($warp[$i] < 11) OR ($warp[$i] = STARDOCK))
            setVar $output $output & "Didn't go to sector " & $warp[$i] & " (FEDSPACE).*"
            setVar $complete 0
        elseif ($the_distance > 1)
            setVar $output $output & "Didn't go to sector " & $warp[$i] & " (ONEWAY).*"
            setVar $complete 0
        elseif ($planets[$i] = 1)
            setVar $output $output & "Didn't go to sector " & $warp[$i] & " (PLANETS).*"
            setVar $complete 0
        elseif (($figtype[$i] = "[Offensive]") and ($_ckinc_getInfo~photons <> 0))
            setVar $output $output & "Didn't go to sector " & $warp[$i] & " (OFFENSIVE FIGS).*"
            setVar $complete 0
        elseif (($mineowner[$i] <> 0) and ($mineowner[$i] <> "(belong to your Corp)") and ($_ckinc_getInfo~photons <> 0))
            setVar $output $output & "Didn't go to sector " & $warp[$i] & " (ARMID MINES - " & $mineowner[$i] & ").*"
            setVar $complete 0
        elseif (($haz[$i] <> 0) and ($_ckinc_getInfo~photons <> 0))
            setVar $output $output & "Didn't go to sector " & $warp[$i] & " (NAV HAZ).*"
            setVar $complete 0
        elseif ($figamt[$i] > 1000)
            setVar $output $output & "Didn't go to sector " & $warp[$i] & " (TOO MANY FIGS).*"
            setVar $complete 0
#  Uncomment the next 2 lines if you do NOT want to fig dead ends.
#        elseif ($warpCount[$i] = 1)
#            setVar $output $output & "Sector " & $warp[$i] & " is a deadend, pod MIGHT flee there.*"

# This is the macro used to clear a sector and return.
        elseif (($ck_surround_sector < 11) OR ($ck_surround_sector = STARDOCK))
            send "M" & $warp[$i] & "* * za9999* * F Z" & $ckSurroundFigamount & "* ZC " & $ckSurroundFigtype & "* " & $mineMacro & "< * * Za9999* * "
        else
            send "M" & $warp[$i] & "* * za9999* * F Z" & $ckSurroundFigamount & "* ZC " & $ckSurroundFigtype & "* " & $mineMacro & "< * * Za9999* * F Z" & $ckSurroundFigamount & "* ZC " & $ckSurroundFigtype & "* "
        end
        if ($i < $warps)
            goto :figSector
        end

        if ($_ckinc_getPlanetInfo~planet <> 0)
            send "L " & $_ckinc_getPlanetInfo~planet & "* M  N  T  *  C  "
        end

        if ($complete = 1)
            setVar $output $output & "Sector " & $ck_surround_sector & " is surrounded.*"
        end
        send "'*" & $output & "*"
        if ($complete = 1)
            send "/"
            Waitfor " Sect "
            setTextTrigger cap1 :cap "Citadel command"
            setTextTrigger cap2 :cap "Command [TL="
            pause

            :cap
            if (($ckShipCapAutoLoad = "anywhere") or (($ckShipCapAutoLoad = "nodock") and ($ck_surround_sector <> STARDOCK)))
                load "__ck_ship_cap.cts"
            end
        end

