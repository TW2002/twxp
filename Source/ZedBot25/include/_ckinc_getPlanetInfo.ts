goto :getPlanetInfoEOF


# ----- SUB :getPlanetInfo -----
:getPlanetInfo
    send "*"
    setTextLineTrigger planetInfo :planetInfo "Planet #"
    pause

    :planetinfo
        killalltriggers
        setVar $citadel 0
        setVar $citadelcredits 0
        getWord CURRENTLINE $planet 2
        stripText $planet "#"
        getWord CURRENTLINE $current_sector 5
        stripText $current_sector ":"
        waitfor "2 Build 1   Product    Amount     Amount     Maximum"

        :getPlanetStuff
            setTextLineTrigger fuelstart :fuelstart "Fuel Ore"
            setTextLineTrigger orgstart :orgstart "Organics"
            setTextLineTrigger equipstart :equipstart "Equipment"
            setTextLineTrigger figstart :figstart "Fighters        N/A"
            setTextLineTrigger citadelstart :citadelstart "Planet has a level"
            setTextTrigger planetInfoDone :planetInfoDone "Planet command (?=help)"
            pause

        :fuelstart
            killalltriggers
            getWord CURRENTLINE $planetfuel 6
            getWord CURRENTLINE $planetfuelmax 8
            stripText $planetfuel ","
            stripText $planetfuelmax ","
            goto :getPlanetStuff

        :orgstart
            killalltriggers
            getWord CURRENTLINE $planetorg 5
            getWord CURRENTLINE $planetorgmax 7
            stripText $planetorg ","
            stripText $planetorgmax ","
            goto :getPlanetStuff

        :equipstart
            killalltriggers
            getWord CURRENTLINE $planetequip 5
            getWord CURRENTLINE $planetequipmax 7
            stripText $planetequip ","
            stripText $planetequipmax ","
            goto :getPlanetStuff

        :figstart
            killalltriggers
            getWord CURRENTLINE $planetfig 5
            getWord CURRENTLINE $planetfigmax 7
            stripText $planetfig ","
            stripText $planetfigmax ","
            goto :getPlanetStuff

        :citadelstart
            killalltriggers
            getWord CURRENTLINE $citadel 5
            getWord CURRENTLINE $citadelcredits 9
            striptext $citadelcredits ","

    :planetInfoDone
        return

:getPlanetInfoEOF
