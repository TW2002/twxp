# MD Lawn Mow
 
	systemScript
	cutText CURRENTLINE $location 1 7
	cutText CURRENTANSILINE $location2 1 83
	
	if (($location <> "Command") AND ($location <> "Corpora") AND ($location <> "Compute") AND ($location2 <> "[0m[35mDo you wish to ([1;33mL[0;35m)eave or ([1;33mT[0;35m)ake Colonists? ") AND ($location <> "<StarDo") AND ($location <> "Do you ") AND ($location <> "<FedPol") AND ($location <> "<Tavern") AND ($location <> "<Libram") AND ($location <> "<Galact") AND ($location <> "<Hardwa") AND ($location <> "<Shipya") AND ($location <> "ÛÄÄÄ þþ"))
	        echo ANSI_12 "**This script must be started from the*Command, Computer, Corporation, StarDock, or Terra prompt.**"
	        halt
	end
	if ($location = "Command")
		send "c;q"
		waitOn "Max Figs Per Attack:"
		getWord CURRENTLINE $maxFigAttack 5
	else
		setVar $maxFigAttack 99991111
	end
	
:figPrompt
	echo ANSI_11 "*Drop Fighters? (Y/N)*" ANSI_7
	getConsoleInput $ask SINGLEKEY
	upperCase $ask
	if ($ask <> "Y") AND ($ask <> "N") 
  		goto :figPrompt
	end
	if ($ask = "Y")
		setVar $dropFigs TRUE
	else
		setVar $dropFigs FALSE
	end
	goSub :showTitle
	echo CURRENTANSILINE
:wait
	setTextOutTrigger waitForSign :execute ">"
	pause

:execute
	cutText CURRENTLINE $location 1 7
	if (($location <> "Command") AND ($location <> "Corpora") AND ($location <> "Compute") AND ($location2 <> "[0m[35mDo you wish to ([1;33mL[0;35m)eave or ([1;33mT[0;35m)ake Colonists? ") AND ($location <> "<StarDo") AND ($location <> "Do you ") AND ($location <> "<FedPol") AND ($location <> "<Tavern") AND ($location <> "<Libram") AND ($location <> "<Galact") AND ($location <> "<Hardwa") AND ($location <> "<Shipya") AND ($location <> "ÛÄÄÄ þþ"))
		goSub :showTitle
		echo CURRENTANSILINE
		goto :wait
	end
	getInput $destination #27&"[K"&"Mow To>"
	isNumber $number $destination
	if ($number <> 1)
		goSub :showTitle
		echo CURRENTANSILINE
		goto :wait
	elseif (($destination <= 0) OR ($destination > SECTORS))
		goSub :showTitle
		echo CURRENTANSILINE
		goto :wait
	end
	if (($location = "<FedPol") OR ($location = "<Tavern") OR ($location = "<Libram") OR ($location = "<Galact") OR ($location = "<Shipya") OR ($location = "ÛÄÄÄ þþ") OR ($location = "<Hardwa"))
		send "q"
	end
	gosub :getCourse
	
	setVar $j 2
	setVar $result ""		
	while ($j <= $courseLength)
		setVar $result $result&"m"&$COURSE[$j]&"* "
		if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK))
			setVar $result $result&"za"&$maxFigAttack&"* * "	
		end
		if (($dropFigs = TRUE) AND ($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK) AND ($j > 2))
			setVar $result $result&"f 1 * c t "
		end
		add $j 1	
	end
	if ($location = "Command")
		send $result&"/*"
	else 
		send "q "&$result&"/*"
	end
	waitOn "³"
	goSub :showTitle
	waitOn "Command ["
	echo CURRENTANSILINE
		
	goto :wait
	
	


:stoppingPoint
	halt



:getCourse
	killalltriggers
	setVar $sectors ""
	setTextLineTrigger sectorlinetrig :sectorsline " > "
	send "^f*"&$destination&"*q"
	pause



:sectorsline
	killAllTriggers
	setVar $line CURRENTLINE
	replacetext $line ">" " "
	striptext $line "("
	striptext $line ")"
	setVar $line $line&" "
	getWordPos $line $pos "So what's the point?"
	getWordPos $line $pos2 ": ENDINTERROG"
	if (($pos > 0) OR ($pos2 > 0))
		goto :noPath
	end
	getWordPos $line $pos " sector "
	getWordPos $line $pos2 "TO"
	if (($pos <= 0) AND ($pos2 <= 0))
		setVar $sectors $sectors & " " & $line
	end
	getWordPos $line $pos " "&$destination&" "
	getWordPos $line $pos2 "("&$destination&")"
	getWordPos $line $pos3 "TO"
	if ((($pos > 0) OR ($pos2 > 0)) AND ($pos3 <= 0))
		goto :gotSectors
	else
		setTextLineTrigger sectorlinetrig :sectorsline " > "
		setTextLineTrigger sectorlinetrig2 :sectorsline " "&$destination&" "
		setTextLineTrigger sectorlinetrig3 :sectorsline " "&$destination
		setTextLineTrigger sectorlinetrig4 :sectorsline "("&$destination&")"
		setTextLineTrigger donePath :sectorsline "So what's the point?"
		setTextLineTrigger donePath2 :sectorsline ": ENDINTERROG"
	end
	pause

:gotSectors
	killAllTriggers
	setVar $sectors $sectors&" :::"
	setVar $courseLength 0
	setVar $index 1
	:keepGoing
	getWord $sectors $COURSE[$index] $index
	while ($COURSE[$index] <> ":::")
		add $courseLength 1
		add $index 1
		getWord $sectors $COURSE[$index] $index
	end
	return
:noPath
	killAllTriggers
	goSub :showTitle
	goto :wait

:showTitle
	echo #27 "[1A" #27 "[99D" ANSI_14 "*MD Lawnmow " ANSI_6 "is running. Press " ANSI_14 ">" ANSI_6 " at Command, Stardock, or Terra prompts.*" ANSI_7
	return