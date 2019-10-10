goto :swathoffEOF

:swathoff
    if ($_ckinc_swathoff~swathoff = 0)
        setTextTrigger swathison :swathison "Command [TL="
        setDelayTrigger swathisoff :swathisoff 2000
        pause

        :swathison
        killalltriggers
        setVar $_ckinc_swathoff~message "Detected SWATH Autohaggle"
        setVar $_ckinc_swathoff~swathoff 0
        return

        :swathisoff
        killalltriggers
        setVar $_ckinc_swathoff~swathoff 1
    end
    return

:swathoffEOF
