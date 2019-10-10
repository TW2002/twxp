goto :getCurrentShipStatsEOF

# ----- SUB :getCurrentShipStats
:getCurrentShipStats
    send "C;Q"
    waitfor "<Computer activated>"
    :waitForInfo
        setTextLineTrigger getTPW :getTPW "Turns Per Warp:"
        setTextLineTrigger getMaxMines :getMaxMines "Mine Max:"
        setTextLineTrigger getMaxWave :getMaxWave "Max Figs Per Attack:"
        setTextLineTrigger getXportRange :getXportRange "Transport Range:"
        # --------------------------------------------------------------------------------
        setTextTrigger getCurrentShipStatsDone :getCurrentShipStatsDone "Command [TL="
        setTextTrigger getCurrentShipStatsDone2 :getCurrentShipStatsDone "Citadel command"
        pause
    :getTPW
        killAllTriggers
        setVar $line CURRENTLINE
        replaceText $line ":" " "
        getWord $line $TPW 7
        goto :waitForInfo
    :getMaxMines
        killAllTriggers
        setVar $line CURRENTLINE
        replaceText $line ":" " "
        getWord $line $maxMines 7
        goto :waitForInfo
    :getMaxWave
        killAllTriggers
        setVar $line CURRENTLINE
        replaceText $line ":" " "
        getWord $line $maxWave 5
        goto :waitForInfo
    :getXportRange
        killAllTriggers
        setVar $line CURRENTLINE
        replaceText $line ":" " "
        getWord $line $xportRange 6
        goto :waitForInfo
    :getCurrentShipStatsDone
        killalltriggers
        return

:getCurrentShipStatsEOF



#                                  Red Patrol
#
#     Basic Hold Cost:  125,000   Initial Holds:    100 Maximum Shields: 6,666
#     Main Drive Cost:  125,000    Max Fighters: 66,666  Offensive Odds: 1.4:1
#       Computer Cost:  125,000  Turns Per Warp:      4  Defensive Odds: 1.5:1
#      Ship Hull Cost:  100,000        Mine Max:    166      Beacon Max:   166
#      Ship Base Cost:  475,000     Genesis Max:     16 Long Range Scan:   Yes
# Max Figs Per Attack:     6666 TransWarp Drive:    Yes  Planet Scanner:   Yes
#       Maximum Holds:      166 Transport Range:     15 Photon Missiles:   Yes
