	:getCourse
		setArray $mowCourse 80
		setVar $sectors ""
		if ($starting_point <= 0)
			setVar $starting_point ""
		end
		setTextLineTrigger sectorlinetrig :sectorsline " > "
		send "^f"&$starting_point&"*"&$destination&"**q"
		pause
	:sectorsline
		killtrigger sectorlinetrig
		killtrigger sectorlinetrig2
		killtrigger sectorlinetrig3
		killtrigger sectorlinetrig4
		killtrigger donePath
		killtrigger donePath2
		setVar $line CURRENTLINE
		replacetext $line ">" " "
		striptext $line "("
		striptext $line ")"
		setVar $line $line&" "
		getWordPos $line $pos "So what's the point?"
		getWordPos $line $pos2 ": ENDINTERROG"
		getWordPos $line $pos3 " No route within "
		if (($pos > 0) OR ($pos2 > 0) OR ($pos3 > 0))
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
		setVar $sectors $sectors&" :::"
		setVar $courseLength 0
		setVar $index 1
		:keepGoing
		getWord $sectors $mowCourse[$index] $index
		while ($mowCourse[$index] <> ":::")
			add $courseLength 1
			add $index 1
			getWord $sectors $mowCourse[$index] $index
		end
		return
	:noPath

		send "q '{" $SWITCHBOARD~bot_name "} - No path to that sector!*"
		return
