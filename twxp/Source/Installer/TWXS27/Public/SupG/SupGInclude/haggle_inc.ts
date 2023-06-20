#=-=-=-=  Haggle  =-=-==-=-=-=-=-=-=-=
:haggle
setVar $ni 0
setVar $midhag "-1"
setVar $nocred 0
killtrigger 1
killtrigger 0
killtrigger donehaggling
setTextTrigger donehag :done_haggle "Command [TL="
SetTextTrigger donehaggling :done_haggle "empty cargo holds."
SetTextTrigger offerme :offerme "Your offer"
pause

:offerme
getWord CURRENTLINE $offer 3
stripText $offer "["
stripText $offer "]"
stripText $offer ","
stripText $offer "?"
setVar $orig_offer $offer

:rehaggle
killtrigger 0
killtrigger 2
killtrigger 3
setVar $offer (($orig_offer * $multiplier) / 100)
send $offer "*"
add $midhag 1
waitFor $offer
if ($multiplier > 100)
	subtract $multiplier 1
else
	add $multiplier 1
end
setTextTrigger 0 :done_haggle "How many holds of"
setTextTrigger 1 :rehaggle "Your offer"
setTextTrigger 2 :donehag "We're not interested."
setTextTrigger 3 :nocreds "You only have"
pause

:nocreds
setVAr $nocred 1
send "0*0*"
goto :done_haggle

:donehag
setVar $ni 1

:done_haggle
killtrigger donehag
killtrigger 0
killtrigger 1
killtrigger 2
killtrigger 3
killtrigger rehaggle
killtrigger donehaggling
killtrigger offerme
return
#/\/\ Variable Definitions /\/\
#$ni		- Boolean value for trading
#		1 - Port did not accept your offer
#		0 - Port bought/sold your/you product
#$offer		- Ports current offer and/or your offer
#$orig_offer	- Ports original offer
#$multiplier	- Multiplier for haggling
#/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
#=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
