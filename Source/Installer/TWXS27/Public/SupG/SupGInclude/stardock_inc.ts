:stardock
send "p"
setTextTrigger noport :sd_noport "There is no port in this sector!"
setTextTrigger nosd :sd_nosd "Enter your choice"
setTextTrigger sd :sd_sd "<S> Land on the StarDock"
pause

:sd_noport
killtrigger noport
killtrigger nosd
killtrigger sd
setVar $dock "-1"
return

:sd_sd
killtrigger noport
killtrigger nosd
killtrigger sd
send "s"
setTextTrigger pause :sd_pause "[Pause]"
SetTextLineTrigger nolimp :sd_limpet "and removal?"
setTextTrigger onsd :sd_onsd "<StarDock> Where to?"
setTextTrigger noturns :sd_noturns "You don't have any turns left."
pause

:sd_noturns
killtrigger pause
killtrigger onsd
killtrigger nolimpet
setVar $dock "-2"
return

:sd_limpet
send "y"
pause

:sd_pause
send "*"
pause

:sd_onsd
killtrigger noturns
killtrigger pause
killtrigger nolimp
if ($dock = "shipyard")
	send "s"
elseif ($dock = "police")
	send "p"
elseif ($dock = "bank")
	send "b"
end
return