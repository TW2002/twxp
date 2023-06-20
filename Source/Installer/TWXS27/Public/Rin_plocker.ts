#Rin's plock waiter, ver 1.2

send "'Rincrast's plock waiter, ver 1.2 now active.*"
:waittowarp
killAllTriggers
setTextLineTrigger warper :waittowarp "Planetary TransWarp Drive shutting down."
setTextLineTrigger nolock :waittowarp "Your own fighters must be in the destination to make a safe jump."
setTextLineTrigger alreadywarped :waittowarp "-=-=-=- Planetary TransWarp Drive Engaged! -=-=-=-"
waitFor "hops away from here."
getWord CURRENTLINE $newsector 2
waitFor "Locating beam pinpointed, TransWarp Locked."
send "'P-locked onto sector " & $newsector " and waiting to drop!*"
:waitToDrop
#Limpet mine in 4770 activated
setTextLineTrigger limpetTrigger :fireNow "Limpet mine in "
waitFor "Locator beam lost.  Warp lock integrity is decaying!"
:fireaway
killTrigger alreadywarped
send "y"
send "'Planet successfully dropped into sector " & $newsector & "!*"
goto :waittowarp

:fireNow
getWord CURRENTLINE $testSector 4
if ($testSector = $newsector)
	killTrigger limpetTrigger
	goto :fireaway
else
	killTrigger limpetTrigger
	goto :waitToDrop
end
pause