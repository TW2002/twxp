	#
	#Routine finds safe path to mow when stuck in a pod
	#
	clearAllAvoids
	clearAllAvoids
	gosub :prompt
	if ($CURRENT_PROMPT <> "Command")
		echo "**" & ANSI_15 & "Start From Command Prompt!**"
		halt
	end

	send " ** "
	waiton "Warps to Sector(s)"
	waiton "Command [TL"
	setVar $DEST	STARDOCK
	setVar $CS 		CURRENTSECTOR
	setVar $PATH	" ** "
	setVar $DEBUG	""
	setVar $Steps	0
	setVar $ATTEMPTS	0
	setVar $ABORT	TRUE

	:_MENU_
	Echo "***"
	Echo ANSI_15 & "   1 " & ANSI_7 & "Destination : " & $DEST & "*"
	Echo ANSI_15 & "   2 " & ANSI_7 & "Abort Sector: "
	if ($ABORT)
		Echo "Yes*"
	else
		Echo "No*"
	end
	Echo ANSI_15 & "   X " & ANSI_7 & "Execute*"
	Echo ANSI_15 & "   Q " & ANSI_7 & "Quit**"
	getConsoleInput $s SINGLEKEY
	uppercase $S
	if ($s = "Q")
		Echo "**" & ANSI_14 & "Script Halted!**"
		halt
	elseif ($s = "X")
		goto :_AGAIN_
	elseif ($s = "1")
		getInput $dest "*"&#27&"[K"&"Mow To>"
		isNumber $tst $dest
		if ($tst = 0)
			setVar $dest 0
		end
		if ($dest < 1)
			setVar $dest 1
		end
		if ($dest > SECTORS)
			setVar $dest SECTORS
		end
	elseif ($s = "2")
		if ($ABORT)
			setVar $ABORT FALSE
		else
			setVar $ABORT TRUE
		end
	end
	goto :_MENU_
:_AGAIN_
	setVar $COURSE 0
	if ($ATTEMPTS >= 4000)
		Echo "**Too many attempts. cannot find safe path*"
		if ($DEBUG <> "")
			Echo ANSI_15 & "Found: "
			Echo ANSI_14 & "*" & $DEBUG & "***"
		end
		halt
	end
	getCourse $COURSE $CS $DEST
	if ($COURSE = "-1")
		send "C F"&$CS&"*"&$DEST&"*Q"
		waiton "Computer command"
		waiton "Command ["
		getCourse $COURSE $CS $DEST
	end
	if ($COURSE = "-1")
		Echo "**Cannot Find a Path**"
		halt
	end

	setVar $i 1
	while ($i <= $COURSE)
		setVar $Focus $COURSE[$i]
		if ($Focus <> $CS)
			getSectorParameter $Focus "FIGSEC" $Flag
			isNumber $tst $Flag
			if ($tst)
				if ($Flag)
					add $Steps 1
					if ($ABORT)
						setVar $PATH ($PATH & "  M" & $Focus & "*   *   ")
					else
						setVar $PATH ($PATH & "M" & $Focus & "* *")
					end
	        		setVar $DEBUG ($DEBUG & ANSI_15 & $Focus & ANSI_7 & "->")
					setVar $CS $Focus
				else
					setAvoid $Focus
					add $ATTEMPTS 1
					goto :_AGAIN_
				end
			else
				setAvoid $Focus
				add $ATTEMPTS 1
				goto :_AGAIN_
			end
		end
		add $i 1
	end

	Echo "***"
	Echo ANSI_15 & "Safe Path Found (" & ($Steps+1) & " Hops):"
	Echo "*" & $DEBUG & ANSI_14 & $DEST & "**"
	Echo ANSI_14 & "Engage Mow?"
	getConsoleInput $s SINGLEKEY
	uppercase $s
	if ($s = "Y")
		send $PATH & " M"&$DEST&"* *"
	end
	halt

:PROMPT
	setVar $CURRENT_PROMPT 		"Undefined"
	setTextTrigger 		prompt1 		:allPrompts 		"(?="
	setTextLineTrigger 	prompt2 		:secondaryPrompts 	"(?)"
	setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
	setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
	setTextTrigger		prompt5			:EWarpPrompt		"[Y]"
	setDelayTrigger		TimeOut			:TimeOut			1000
	send (#8 & #8 & #8 & #8 & #8 & #8 & #8 & "^Q")
	pause
	:TimeOut
		killAllTriggers
		setVar $CURRENT_PROMPT 		"Undefined"
		return

	:EWarpPrompt
	:allPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			setVar $CURRENT_PROMPT $tempPrompt
			killAlltriggers
			return
		end
		setTextLineTrigger prompt1 :allPrompts "(?="
		pause
	:secondaryPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			setVar $CURRENT_PROMPT $tempPrompt
			killAlltriggers
			return
		end
		setTextLineTrigger prompt2 :secondaryPrompts "(?)"
		pause
	:terraPrompts
		killtrigger prompt3
		killtrigger prompt4
		getWord currentansiline $checkPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			setVar $CURRENT_PROMPT "Terra"
			killAlltriggers
			return
		end
		setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
		setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
		pause
