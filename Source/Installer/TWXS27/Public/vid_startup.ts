# Vid Kid/CareTaker
SetVar $version "1.09"
Send " * "
WaitOn "]:["
CutText CURRENTLINE $location 1 12
If ($location <> "Command [TL=")
        Send Ansi_15 "**This script must be run from the Command Prompt"
        Halt
End
:SetGamePrefs
  # get current game settings
  Send "cn"
  WaitOn "<Set ANSI and misc settings>"
  SetTextLineTrigger ANSI :ANSI "ANSI graphics"
  SetTextLineTrigger Animation :Animation "Animation display"
  SetTextLineTrigger PageMessages :PageMessages "Page on messages"
  SetTextLineTrigger Subspace :Subchk "Sub-space radio channel"
  SetTextLineTrigger FedCom :FedCom "Federation comm-link"
  SetTextLineTrigger Hails :Hails "Receive private hails"
  SetTextLineTrigger SilenceMessages :SilenceMessages "Silence ALL messages"
  SetTextLineTrigger AbortDisplayAll :AbortDisplayAll "Abort display on keys"
  SetTextLineTrigger MessageDisplayLong :MessageDisplayLong "Message Display Mode"
  SetTextLineTrigger ScreenPauses :ScreenPauses "Screen Pauses"
  SetTextLineTrigger AutoFlee :AutoFlee "Online Auto Flee"
  SetTextTrigger displayDone :displayDone "Settings command (?=Help)"
  Pause
  :ANSI
  GetWord CURRENTLINE $Ansi 5
  UpperCase $Ansi
  Pause
  :Animation
  GetWord CURRENTLINE $Animation 5
  UpperCase $Animation
  Pause
  :PageMessages
  GetWord CURRENTLINE $PageMessages 6
  UpperCase $PageMessages
  Pause
  :Subchk
  GetWord CURRENTLINE $Subspac 6
  Pause
  :FedCom
  GetWord CURRENTLINE $FedCom 5
  UpperCase $FedCom
  Pause
  :Hails
  GetWord CURRENTLINE $Hails 6
  UpperCase $Hails
  Pause
  :SilenceMessages
  GetWord CURRENTLINE $SilenceMessages 6
  UpperCase $SilenceMessages
  Pause
  :AbortDisplayAll
  GetWord CURRENTLINE $AbortDisplayAll 7
  UpperCase $AbortDisplayAll
  Pause
  :MessageDisplayLong
  GetWord CURRENTLINE $MessageDisplayLong 6
  UpperCase $MessageDisplayLong
  Pause
  :ScreenPauses
  GetWord CURRENTLINE $ScreenPauses 5
  UpperCase $ScreenPauses
  Pause
  :AutoFlee
  GetWord CURRENTLINE $AutoFlee 6
  UpperCase $AutoFlee
  Pause
  :displayDone
  KillAllTriggers
  # Set current game settings to new ones - and apply changes
  SetVar $Send ""
  IF ($ANSI <> "ON")
    SetVar $Send $Send & " 1  "
  End
  IF ($Animation <> "OFF")
    SetVar $Send $Send & " 2  "
  End
  IF ($PageMessages <> "OFF")
    SetVar $Send $Send & " 3  "
  End
  If ($Subspac = "0")
   GetRnd $SSchan 1 60000
   SetVar $Send $Send &" 4  "& $SSchan &" *"
   End
  IF ($FedCom <> "ON")
    SetVar $Send $Send & " 5  "
  End
  IF ($Hails <> "YES")
    SetVar $Send $Send & " 6  "
  End
  IF ($SilenceMessages <> "NO")
    SetVar $Send $Send & " 7  "
  End
  IF ($AbortDisplayAll <> "SPACE")
    SetVar $Send $Send & " 9  "
  End
  IF ($MessageDisplayLong <> "COMPACT")
    SetVar $Send $Send & " a  "
  End
  IF ($ScreenPauses <> "NO")
    SetVar $Send $Send & " b  "
  End
  IF ($AutoFlee <> "OFF")
    SetVar $Send $Send & " c  "
  End
  Send $Send "q"
# makes TransWarp drive always available
Send " u y q"
WaitOn "elp"
WaitOn "elp"
Send #145
Halt
