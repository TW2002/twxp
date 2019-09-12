# Vid Kid/CareTaker  Timed Game Sub-Space Time Checker
Send "' Send timecheck? on Sub-Space Channel to check time left *"
WaitOn "sent on sub-space"
:top
        KillAllTriggers
        SetTextTrigger check :time "timecheck?"
        Pause
:time
        WaitOn "elp)"
        GetWord CURRENTLINE $location 1
	if ($location = "Command")
	SetTextLineTrigger turns :turns "Turns left     :"
        Send "i"
        WaitOn "ommand [TL="
	GetText CURRENTLINE $timeleft "[TL=" "]:["
	Send " * "
        ELSEIF ($location = "Citadel")
        send "c"
        WaitOn "ommand [TL="
        GetText CURRENTLINE $timeleft "[TL=" "]:["
        SetTextLineTrigger turns :turns "Turns left     :"
        Send "qi"
        ELSEIF ($location <> "Citadel") and ($location <> "Command")
        Send "'Not At Citadel or Command Prompt !*"
        GoTo :top
        End
        Pause
:turns
                GetWord CURRENTLINE $turns 4
                StripText $turns ","

WaitOn "elp)"
send "'*       - Turns     = " $turns "*"
Send "       - Time Left = " $timeleft "**"
WaitOn "comm-link terminated"
goto :top

