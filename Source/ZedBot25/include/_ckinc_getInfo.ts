goto :GetInfoEOF

# ----- SUB :getInfo
:getInfo
    setVar $photons 0
    setVar $scan_type "None"
    setVar $twarp_type 0
    setVar $corpstring "[0]"
    send "I"
    waitfor "<Info>"
    :waitForInfo
        setTextLineTrigger getTraderName :getTraderName "Trader Name    :"
        setTextLineTrigger getExpAndAlign :getExpAndAlign "Rank and Exp"
        setTextLineTrigger getCorp :getCorp "Corp           #"
        setTextLineTrigger getShipType :getShipType "Ship Info      :"
        setTextLineTrigger getTPW :getTPW "Turns to Warp  :"
        setTextLineTrigger getSect :getSect "Current Sector :"
        setTextLineTrigger getTurns :getTurns "Turns left"
        setTextLineTrigger getHolds :getHolds "Total Holds"
        setTextLineTrigger getFighters :getFighters "Fighters       :"
        setTextLineTrigger getShields :getShields "Shield points  :"
        setTextLineTrigger getPhotons :getPhotons "Photon Missiles:"
        setTextLineTrigger getScanType :getScanType "LongRange Scan :"
        setTextLineTrigger getTwarpType1 :getTwarpType1 "  (Type 1 Jump):"
        setTextLineTrigger getTwarpType2 :getTwarpType2 "  (Type 2 Jump):"
        setTextLineTrigger getCredits :getCredits "Credits"
        setTextTrigger getInfoDone :getInfoDone "Command [TL="
        setTextTrigger getInfoDone2 :getInfoDone "Citadel command"
        pause
        pause
    :getTraderName
        killAllTriggers
        setVar $tradername CURRENTLINE
        stripText $tradername "Trader Name    : "
        stripText $tradername "3rd Class "
        stripText $tradername "2nd Class "
        stripText $tradername "1st Class "
        stripText $tradername "Nuisance "
        stripText $tradername "Menace "
        stripText $tradername "Smuggler Savant "
        stripText $tradername "Smuggler "
        stripText $tradername "Robber "
        stripText $tradername "Private "
        stripText $tradername "Lance Corporal "
        stripText $tradername "Corporal "
        stripText $tradername "Staff Sergeant "
        stripText $tradername "Gunnery Sergeant "
        stripText $tradername "1st Sergeant "
        stripText $tradername "Sergeant Major "
        stripText $tradername "Sergeant "
        stripText $tradername "Chief Warrant Officer "
        stripText $tradername "Warrant Officer "
        stripText $tradername "Terrorist "
        stripText $tradername "Infamous Pirate "
        stripText $tradername "Notorious Pirate "
        stripText $tradername "Dread Pirate "
        stripText $tradername "Pirate "
        stripText $tradername "Galactic Scourge "
        stripText $tradername "Enemy of the State "
        stripText $tradername "Enemy of the People "
        stripText $tradername "Enemy of Humankind "
        stripText $tradername "Heinous Overlord "
        stripText $tradername "Prime Evil "
        stripText $tradername "Ensign "
        stripText $tradername "Lieutenant J.G. "
        stripText $tradername "Lieutenant Commander "
        stripText $tradername "Lieutenant "
        stripText $tradername "Commander "
        stripText $tradername "Captain "
        stripText $tradername "Commodore "
        stripText $tradername "Rear Admiral "
        stripText $tradername "Vice Admiral "
        stripText $tradername "Fleet Admiral "
        stripText $tradername "Admiral "
        stripText $tradername "Civilian "
        stripText $tradername "Annoyance "
        goto :waitForInfo
    :getExpAndAlign
        killAllTriggers
        getWord CURRENTLINE $exp 5
        getWord CURRENTLINE $align 7
        stripText $exp ","
        stripText $align ","
        stripText $align "Alignment="
        goto :waitForInfo
    :getCorp
        killAllTriggers
        getWord CURRENTLINE $corp 3
        stripText $corp ","
        setVar $corpstring "[" & $corp & "]"
        goto :waitForInfo
    :getShipType
        killAllTriggers
        getWordPos CURRENTLINE $shiptypeend "Ported="
        subtract $shiptypeend 18
        cutText CURRENTLINE $shiptype 18 $shiptypeend
        goto :waitForInfo
    :getTPW
        killAllTriggers
        getWord CURRENTLINE $tpw 5
        goto :waitForInfo
    :getSect
        killAllTriggers
        getWord CURRENTLINE $current_sector 4
        goto :waitForInfo
    :getTurns
        killAllTriggers
        getWord CURRENTLINE $turns 4
        if ($turns = "Unlimited")
            setVar $turns 65000
        end
        goto :waitForInfo
    :getHolds
        killAllTriggers
        setVar $line CURRENTLINE
        getWord $line $holds 4
        getWordPos $line $textpos "Ore="
        if ($textpos <> 0)
            cutText CURRENTLINE $temp $textpos 100
            getWord $temp $oreholds 1
            stripText $oreholds "Ore="
        else
            setVar $oreholds 0
        end
        getWordPos $line $textpos "Organics="
        if ($textpos <> 0)
            cutText CURRENTLINE $temp $textpos 100
            getWord $temp $orgholds 1
            stripText $orgholds "Organics="
        else
            setVar $orgholds 0
        end
        getWordPos $line $textpos "Equipment="
        if ($textpos <> 0)
            cutText CURRENTLINE $temp $textpos 100
            getWord $temp $equholds 1
            stripText $equholds "Equipment="
        else
            setVar $equholds 0
        end
        getWordPos $line $textpos "Colonists="
        if ($textpos <> 0)
            cutText CURRENTLINE $temp $textpos 100
            getWord $temp $coloholds 1
            stripText $coloholds "Colonists="
        else
            setVar $coloholds 0
        end
        getWordPos $line $textpos "Empty="
        if ($textpos <> 0)
            cutText CURRENTLINE $temp $textpos 100
            getWord $temp $emptyholds 1
            stripText $emptyholds "Empty="
        else
            setVar $emptyholds 0
        end
        goto :waitForInfo
    :getFighters
        killAllTriggers
        getWord CURRENTLINE $figs 3
        stripText $figs ","
        goto :waitForInfo
    :getShields
        killAllTriggers
        getWord CURRENTLINE $shields 4
        stripText $shields ","
        goto :waitForInfo
    :getPhotons
        killAllTriggers
        getWord CURRENTLINE $photons 3
        goto :waitForInfo
    :getScanType
        killAllTriggers
        getWord CURRENTLINE $scan_type 4
        goto :waitForInfo
    :getTwarpType1
        killAllTriggers
        getWord CURRENTLINE $twarp_1_range 4
        setVar $twarp_type 1
        goto :waitForInfo
    :getTwarpType2
        killAllTriggers
        getWord CURRENTLINE $twarp_2_range 4
        setVar $twarp_type 2
        goto :waitForInfo
    :getCredits
        killAllTriggers
        getWord CURRENTLINE $credits 3
        stripText $credits ","
        goto :waitForInfo
    :getInfoDone
        killalltriggers
        return

:GetInfoEOF
