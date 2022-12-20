setVar $includesDir ".\includes"

gosub :BOT~loadVars

setVar $BOT~help[1] $BOT~tab&"keep {amount} "
setVar $BOT~help[2] $BOT~tab&"   Will withdraw or deposit to/from citadel so you"
setVar $BOT~help[3] $BOT~tab&"   have the amount of credits requested."
setVar $BOT~help[4] $BOT~tab&"     "
setVar $BOT~help[5] $BOT~tab&"   Examples:"
setVar $BOT~help[6] $BOT~tab&"      >keep 500k"
setVar $BOT~help[7] $BOT~tab&"      >keep 2m"
setVar $BOT~help[8] $BOT~tab&"      >keep 200000"
setVar $BOT~help[8] $BOT~tab&"     "
setVar $BOT~help[8] $BOT~tab&"                     - Author: Deign "
gosub :bot~helpfile

gosub :player~quikstats
setVar $loc $player~CURRENT_PROMPT
setVar $roll $player~CREDITS

IF ($loc <> "Citadel")
     setvar $switchboard~message "Must be at the Citadel prompt (not " & $loc & ")*"
     gosub :switchboard~switchboard
     halt
END

replaceText $bot~parm1 "m" "000000"
replaceText $bot~parm1 "M" "000000"
replaceText $bot~parm1 "k" "000"
replaceText $bot~parm1 "K" "000"

IF ($bot~parm1 > 0)
     setVar $k $bot~parm1
ELSE
     setVar $k 500000
END

setTextLineTrigger treas :checkBalance "You have"

IF ($roll > $k)
  setVar $cmd "tt"
ELSEIF ($roll < $k)
  setVar $cmd "tf"
ELSE
	setvar $switchboard~message "No transaction required*"
	gosub :switchboard~switchboard
	halt
END

send $cmd
pause
:treasReturn
IF ($roll > $k)
  setVar $x $roll-$k
  format $x $formatted_x NUMBER
  setvar $switchboard~message $formatted_x & " credits deposited into citadel*"
ELSEIF ($roll < $k)
  setVar $x $k-$roll
  format $x $formatted_x NUMBER
  setvar $switchboard~message $formatted_x & " credits taken from citadel*"
  IF ($x > $balance)
    setVar $x 0
    setvar $switchboard~message "NSF error*"
  END
END
send $x "*"
gosub :switchboard~switchboard

halt

:checkBalance
setVar $treasLine CURRENTLINE
replaceText $treasLine "," ""
replaceText $treasLine "." ""
getWord $treasLine $roll 3
getWord $treasLine $balance 9
killTrigger treas
goto :treasReturn

#includes
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
