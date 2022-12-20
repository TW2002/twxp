:countPlanets
	setVar $planetCount 0
	killtrigger planetGrabber
	killtrigger beDone
	send "/"
	waitOn "Creds"
	setTextLineTrigger planetGrabber :planetline "   <"
	setTextLineTrigger beDone :done "Land on which planet "
	send "|lq*|"
	pause
	:planetline
		killtrigger getEnd
		killtrigger getLine2
		killtrigger planetGrabber
		killtrigger beDone
		getWordPos CURRENTLINE $pos "<<<< SHIELDED"
		if ($pos <= 0)
			setVar $line CURRENTLINE
			replacetext $line "<" " "
			replacetext $line ">" " "
			striptext $line ","
			add $planetCount 1
			getWord $line $planets[$planetCount] 1
		end
		setTextLineTrigger getLine2 :planetline "   <"
		setTextLineTrigger getEnd :done "Land on which planet "
		pause
	:done
	killtrigger getEnd
	killtrigger getLine2
	killtrigger planetGrabber
	killtrigger beDone

return

