:CheckIt
# ============================ VARIABLES ==========================
SetVar $COMMAND_PROMPT          "Command"
SetVar $PLANET_PROMPT           "Planet"
SetVar $CURRENT_PROMPT 		"Undefined"
send "@"
waiton "Average"
SetTextTrigger figprmt :figprmt "Option? (A,"
SetTextTrigger prompt :doublecheck "elp"
Send #145
Pause
:doublecheck
KillAllTriggers
		GetWord CURRENTLINE $CURRENT_PROMPT "1"
		StripText $CURRENT_PROMPT #145
		StripText $CURRENT_PROMPT #8
  If ($CURRENT_PROMPT = $PLANET_PROMPT)
  Send " c "
  Goto :InGame
  End
  If ($CURRENT_PROMPT = $COMMAND_PROMPT)
    IF (CurrentSector = "1")
     SetTextTrigger scannerz :scannerz "1> Terra"
     Send "l1 "
     WaitOn "There are currently"
     Load TerraKit
#     GoSub :TerraKit~terra_kits
     Goto :InGame
    End
    IF (CurrentSector = STARDOCK)
     Send " p sg yg qh"
    End
  End
  Goto :InGame

:scannerz
KillAllTriggers
Send "*"
Load TerraKit
#GoSub :TerraKit~terra_kits

:InGame
Send "'I'm in Game Now!*"
Sound ding
WaitOn "ub-space c"
#Return
Halt
:figprmt
KillAllTriggers
Send " a z 9999 y z n a z 9999 * z n a z 9999 * f z 1 * z c d *"
Goto :InGame

#-=-=-=-=-includes-=-=-=-=-
#INCLUDE "include\TerraKit"
