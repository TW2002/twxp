:startHaggle

gosub :isEpHaggle
if ($isEpHaggle)
	waitfor "Agreed,"
	setTextLineTrigger tradeFin :tradeFin "empty cargo holds"
	pause
	:tradeFin
		killtrigger tradeFin
		getWord CURRENTLINE $nCredits 3
		stripText $nCredits ","
		
		if ($nCredits = $cCredits)
			setVar $report 1
		else
			setVar $cCredits $nCredits
		end	
else
	setVar $hfactor 5
	:units
		killtrigger ptrade
		killtrigger strade
		killtrigger go
		killtrigger done
		gosub :setConnectionTriggers
		SetTextTrigger ptrade :bunits "do you want to buy ["
		SetTextTrigger strade :sunits "do you want to sell ["
		setTextLineTrigger go :finishhaggle "Agreed, "
		setTextLineTrigger done :donehaggle "empty cargo holds."
		pause

	:finishhaggle
		killtrigger done
		gosub :haggle

	:donehaggle
end

 
return

:bunits
		setVar $multiplier (100 - $hfactor)
		goto :units

:sunits
		setVar $multiplier (100 + $hfactor)
	goto :units

:haggle
		setVar $ni 0
		setVar $midhag "-1"
		setVar $nocred 0
		killtrigger 1
		killtrigger 0
		killtrigger donehaggling
	killtrigger donhag
	killtrigger offerme
		gosub :setConnectionTriggers
		setTextTrigger donehag :done_haggle "Command [TL="
		SetTextTrigger donehaggling :done_haggle "empty cargo holds."
		SetTextTrigger offerme :offerme "] ?"
		pause

:offerme
		getWord CURRENTLINE $offer 3
		stripText $offer "["
		stripText $offer "]"
		stripText $offer ","
		stripText $offer "?"
		setVar $orig_offer $offer

:rehaggle
		killtrigger 1
	killtrigger 0
		killtrigger 2
		killtrigger 3
		setVar $offer (($orig_offer * $multiplier) / 100)
		send $offer "*"
		add $midhag 1
		waitFor $offer
		IF ($multiplier > 100)
		   subtract $multiplier 1
		ELSE
		   add $multiplier 1
		END
		gosub :setConnectionTriggers
		send "@"
		waiton "Average Interval Lag:"
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
	killalltriggers
return

include "source\bot_includes\player\isephaggle\player"

