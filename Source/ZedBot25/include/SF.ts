
# Find steal factor
# Team Kraaken script
:Top
LoadVar $STEAL_FACTOR
Send " * "
WaitFor "elp"
CutText CURRENTLINE $location 1 7
GetWord CURRENTLINE $prompt 1
IF ($location <> "Command") and ($location <> "Citadel")
        ClientMessage "**This script must be run from the Command or Citadel prompt"
        Sound failed
        Halt
END
If ($location = "Citadel")
SetTextTrigger base :base "Planet #"
Send "q*"
Pause
Else
Goto :start
END
:base
KillTrigger base
GetWord CURRENTLINE $planet 2
StripText $planet "#"

:start

  IF ($STEAL_FACTOR = "0")
       IF (PASSWORD = "")
       Echo "**"& ANSI_12 &"Fill in TWX PassWord before continuing!*"
       Sound failed
       Halt
       END
If (CURRENTSECTOR > "10") and (CURRENTSECTOR <> STARDOCK) and ($location = "Citadel")
Send "z q q q z n q n q y n"
  WaitFor "Enter your choice:"
  Send #42 &"*"
  WaitFor "Steal Factor="
  GetText CurrentLine $STEAL_FACTOR "=" "%"
  SetPrecision 6
  SetVar $STEAL_DIVISOR (($STEAL_FACTOR * 30) / 100)
  SetPrecision 0
  SetVar $STEAL_DIVISOR ($STEAL_DIVISOR * 1)
  WaitFor "Enter your choice:"
  Send "t * n *"& PASSWORD &"* * * * * a * a z 9999 * * * * * * * * z n n q * fz1*cd l "& $planet &" * m n n t n n*cs* "
ElseIF (CURRENTSECTOR > "10") and (CURRENTSECTOR <> STARDOCK) and ($location = "Command")
Send "z q q q z n q n q y n"
  WaitFor "Enter your choice:"
  Send #42 &"*"
  WaitFor "Steal Factor="
  GetText CurrentLine $STEAL_FACTOR "=" "%"
  SetPrecision 6
  SetVar $STEAL_DIVISOR (($STEAL_FACTOR * 30) / 100)
  SetPrecision 0
  SetVar $STEAL_DIVISOR ($STEAL_DIVISOR * 1)
  WaitFor "Enter your choice:"
  Send "t * n *"& PASSWORD &"* * * * * a * a z 9999 * * * * * * * * z n n q * fz1*cd"
Else
Send "z q q q z n q n q y n"
  WaitFor "Enter your choice:"
  Send #42 &"*"
  WaitFor "Steal Factor="
  GetText CurrentLine $STEAL_FACTOR "=" "%"
  SetPrecision 6
  SetVar $STEAL_DIVISOR (($STEAL_FACTOR * 30) / 100)
  SetPrecision 0
  SetVar $STEAL_DIVISOR ($STEAL_DIVISOR * 1)
  WaitFor "Enter your choice:"
  Send "t * n *"& PASSWORD &"* * * * **"
End
  End
LoadVar $STEAL_DIVISOR
IF ($STEAL_DIVISOR = "0")
  SetPrecision 6
  SetVar $STEAL_DIVISOR (($STEAL_FACTOR * 30) / 100)
  SetPrecision 0
  SetVar $STEAL_DIVISOR ($STEAL_DIVISOR * 1)
  If ($location = "Citadel")
  Send "l "& $Planet &"*j c s* * "
  END
END
SetPrecision 0
 Return
