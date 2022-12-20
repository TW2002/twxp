# Haggle.cts (haggle.ts) substitute to make TWX's Pack 2 routines compatable w/ EP's haggle.
# Replace the haggle.cts or haggle.ts file in the Include folder with this one.
:haggle
setTextLineTrigger buy :buy "We are selling up to "
setTextLineTrigger sell :sell "We are buying up to "
pause

:buy
killTrigger getCredits
killTrigger done
setTextTrigger onhand :buyOnHand "]?"
pause
	:buyOnHand
	getWord CURRENTLINE $product 5
	if ($product <> $BuyProd)
		send "0*"
		setTextTrigger getCredits :getCredits "empty cargo holds."
		pause
	end
	send "*"
	# External haggle occurs here
	setTextTrigger getCredits :getCredits "empty cargo holds."
	pause

:sell
killTrigger getCredits
killTrigger done
send "*"
# External haggle occurs here
setTextTrigger getCredits :getCredits "empty cargo holds."
pause

:getCredits
killTrigger buy
killTrigger sell
getWord CURRENTLINE $Credits 3
stripText $Credits ","
setTextLineTrigger buy :buy "We are selling up to "
setTextLineTrigger sell :sell "We are buying up to "
setTextTrigger done :done "Command [TL="
pause

:done
killTrigger buy
killTrigger sell
return