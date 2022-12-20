    #=--------                                                                       -------=#
     #=-----------------------------  LoneStar's NewGame  ---------------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	April 1, 2007
	#		Version		:	1.92
	#		Author		:	LoneStar
	#		TWX			:	Works with TWX 2.04b, or 2.04 Final
	#		Credits		:	Mind Daggers modified version of Singularity's quikstats
	#   					Mind Daggers Mow routine
	#
	#		To Run		:	Start a TWX-Proxy (new) Game
	#						Run script while *not* connected
	#						Set options. Can only make a Corp script cannot join one
	#
	#		Description	:	Script will enter a new-game. Optionally will set SS chan,
	#						make a Corp, mow to StarDock, or run an external script upon
	#						completion. If you're no longer fed-safe, after mowing to dock,
	#						script will Port.
	#
	#						Will handle games that are not open (ie locked), and those annoying
	#						game edits that start you out with a planet.
	#
	#		Changes		:	JUNE 14	- Increased 5 second Delay to 10 seconds.
	#							FEB 2009 - Added logic to handle servers that do not allow
	#										in game aliases.

	setVar $TagLine			"New Game Login & Mow"
	setVar $CURENT_VERSION	"1.92"
	setVar $maxFigAttack	100
	setVar $LoginName		""
	setVar $GameAlias		""
	setVar $PassWord		""
	setVar $GameLetter	""
	setVar $CorpName		""
	setVar $CorpPW			""
	setVar $RunScript		""
	setVar $SSChan			0
	setVar $Mow				FALSE
	setVar $DOOR_NUMBER		1
	setVar $MAKE_CORP		FALSE
	setVar $KeepFiringYouAssholes FALSE
	setVar $GRAB FALSE

	if (PASSWORD <> "")
		setVar $PassWord PASSWORD
	end
	if (LOGINNAME <> "")
		setVar $LoginName LOGINNAME
		setVar $GameAlias LOGINNAME
	end
	if (GAME <> "")
		setVar $GameLetter GAME
	end

	getRnd $SSChan 100 60000

	if (CONNECTED)
		echo ANSI_15 & "**Must Not Be Connected To Server!**"
		halt
	end

	gosub :PASSWORDS

	:Menu_Top
	echo #27 & "[2J"
	echo "**"
	Echo ("    "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
	echo ANSI_14 & "*          " & $TagLine
	echo ANSI_8 & "*              Version " & $CURENT_VERSION
	echo ANSI_15 & "*       TWX Info: " & ANSI_14 & GAMENAME & "*"
	Echo ("    "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
	echo ANSI_15&"*     1 - Login Name    : " & ANSI_14 & $LoginName
	echo ANSI_15&"*     2 - Game Alias    : " & ANSI_14 & $GameAlias
	echo ANSI_15&"*     3 - PassWord      : " & ANSI_14 & $PassWord
	echo ANSI_15&"*     4 - Game Letter   : " & ANSI_14 & $GameLetter
	echo ANSI_15&"*     5 - Make A Corp   : "
	if ($MAKE_CORP)
		echo ANSI_15&"*        a - Corp Name  : " & ANSI_14 & $CorpName
		echo ANSI_15&"*        b - PassWord   : " & ANSI_14 & $CorpPW
	end
	echo ANSI_15&"*     6 - SS Chan       : " & ANSI_14 & $SSChan
	echo ANSI_15&"*     7 - Mow To Dock   : "
		if ($Mow)
			echo ANSI_14 & "Yep" & " (" & ANSI_6 & "Door Number " & $DOOR_NUMBER & ANSI_14 & ")"
		else
			echo ANSI_14 & "Nope"
			setVar $DOOR_NUMBER 0
		end
	echo ANSI_15&"*     8 - Run Script    : " & ANSI_14 & $RunScript
	echo ANSI_15&"*     9 - Grab Cols?    : "
		if ($GRAB)
			Echo ANSI_14 & "Yes"
		else
			Echo ANSI_14 & "No"
		end
	Echo ANSI_15&"*     0 - Jet Cols      : "
		if ($JET)
			Echo ANSI_14 & "Yes"
		else
			Echo ANSI_14 & "No"
		end
    ECHO "*    " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196
	echo ANSI_15&"*     X - Execute!    Q - Quit!"
	echo "**"
	:Input_Again
    getConsoleInput $selection SINGLEKEY
    upperCase $selection
	if ($selection = 1)
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Server Login Name?"
		getlength $selection $len
		if ($len > 40)
			cutText $selection $selection 1 40
		end
		setvar $LoginName $selection
		if ($GameAlias = "")
			setVar $GameAlias $selection
		end
	elseif ($selection = 2)
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Trade Name?"
		getlength $selection $len
		if ($len > 40)
			cutText $selection $selection 1 40
		end
		setvar $GameAlias $selection
	elseif ($selection = 3)
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Game Password?"
		striptext $selection " "
		setVar $PassWord $selection
	elseif ($selection = 4)
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Game Letter?"
		upperCase $selection
		getLength $selection $len
		if ($len > 1)
			cutText $selection $selection 1 2
		end
		setVar $GameLetter $selection
	elseif ($selection = 5)
		if ($MAKE_CORP)
			setVar $MAKE_CORP FALSE
		else
			setVar $MAKE_CORP TRUE
		end
	elseif (($selection = "A") AND ($MAKE_CORP))
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Corp Name?"
		setVar $CorpName $selection
	elseif (($selection = "B") AND ($MAKE_CORP))
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Corp PassWord?"
		setVar $CorpPW $selection
	elseif ($selection = 6)
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*SS Chan (between 1 and 60000)?"
		isNumber $tst $selection
		if ($tst = 0)
			setVar $SSChan 1
		else
			setVar $SSChan $selection
		end
	elseif ($selection = 7)
		if ($Mow)
			setVar $Mow FALSE
			setVar $DOOR_NUMBER 0
		else
			setVar $Mow TRUE
			:Another_Door
			getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Mow To Which Door Number: 1 to 6 (0 To Cancel)?"
			isNumber $tst $selection
			if ($tst = 0)
				setVar $DOOR_NUMBER 0
				setVar $Mow FALSE
				goto :Another_Door
			else
				if ($selection > 6)
				   echo "**"
				   goto :Another_Door
				elseif ($selection = 0)
					setVar $DOOR_NUMBER 0
					setVar $Mow FALSE
				else
					setVar $DOOR_NUMBER $selection
				end
			end
		end
	elseif ($selection = 8)
		ECHO "*  " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196
		:Another_Script
		getFileList $Scripts "scripts\*.*ts"
		setVar $i 1
		setVar $COL 0
		while (($i <= $Scripts) AND ($i <= 100))
			setVar $str $Scripts[$i]
			getLength $str $len
			if ($len > 38)
				cutText $str $str 1 35
			end
			if ($COL = 0)
				setVar $COL 1
				setVar $len (38 - $len)
				setvar $ii 1
				if ($i >= 10)
					setVar $len ($len - 1)
				end
				while ($ii <= $len)
					setVar $str ($str & " ")
					add $ii 1
				end
				echo "*  " & ANSI_15 & $i & " " & ANSI_14 & $str
			else
				setVar $COL 0
				echo " " & ANSI_15 & $i & " " & ANSI_14 & $str
			end
			add $i 1
		end
		ECHO "*  " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196
		Echo "*"
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*File Name Of Script To Run At End Of Script?"
		isNumber $tst $selection
		if ($tst = 0)
			goto :Another_Script
		end

		if (($selection >= $i) OR ($selection < 1))
			setVar $RunScript ""
		else
			setVar $RunScript $Scripts[$selection]
		end
	elseif ($selection = "9")
		if ($GRAB)
			setVar $GRAB FALSE
		else
			setVar $GRAB TRUE
		end
	elseif ($selection = "0")
		if ($JET)
			setVar $JET FALSE
		else
			setVar $JET TRUE
		end
	elseif ($selection = "X")
		goto :Lets_Get_It_On
	elseif ($selection = "Q")
		halt
	else
    	goto :Input_Again
	end
   	goto :Menu_Top

:Lets_Get_It_On
	if (($PassWord = "") OR ($LoginName = "") OR ($GameLetter = "") OR ($GameAlias = ""))
		echo ANSI_14 & "**DATA Missing" & ANSI_15 & " - Some or all Login Info Is Missing.**"
		halt
	end
	if (($MAKE_CORP) AND (($CorpName = "") OR ($CorpPW = "")))
		echo ANSI_14 & "**DATA Missing" & ANSI_15 & " - Some or all Corp Info Is Missing.**"
		halt
	end
	:Verifydelay
		killAllTriggers
		DISCONNECT
	:Disco_Test
		setDelayTrigger		Emancipate_CPU		:Emancipate_CPU 300
		pause
	:Emancipate_CPU
		killAllTriggers
		setTextTrigger	ENTER		:ENTER	"Please enter your name (ENTER for none):"
   	CONNECT
	if (CONNECTED <> TRUE)
		Echo "**" & ANSI_14 & "Awaiting Connection!**"
		goto :Disco_Test
	end
	setDelayTrigger VerifyDelay :VerifyDelay 3000
	pause
	:ENTER
	send $LoginName & "*"
	waitfor "Trade Wars 2002 Game Server"
	killtrigger VerifyDelay
    send $GameLetter
    killAllTriggers
    setTextTrigger		Pause1		:Pause		"[Pause]"
    setTextTrigger		Pause2		:Pause		"[Press Space or Enter to continue]"
    setTextLineTrigger	NoPause		:NoPause	20000
    Echo "**" & ANSI_14 & "Waiting 20 Seconds for a "&ANSI_5&"["&ANSI_6&"Pause"&ANSI_5&"]**"
	pause
	:NoPause
		killAllTriggers
		DISCONNECT
		setDelayTrigger	NoPauseYadda		:NoPauseYadda		1000
		pause
		:NoPauseYadda
		goto :Verifydelay
    :Pause
    killTrigger PAUSE1
    killTrigger PAUSE2
    send "*"
    waitfor "Enter your choice:"
    killAllTriggers
	setTextLineTrigger	NoName		:NoName			"Sorry, you cannot use the name Test, its already in use."
	setTextLineTrigger	GoName		:GoName			"That alias would look like this in the game"
    setTextLineTrigger	GameClosed1	:GameClosed		"I'm sorry, but this is a closed game."
	setTextLineTrigger	GameClosed2	:GameClosed		"www.tradewars.com                                   Epic Interactive Strategy"
    setTextLineTrigger	GameClosed3 :GameClosed		"I'm sorry, but the game is in tournament mode and is no longer"
    setTextLineTrigger	Damn_Planet	:Damn_Planet	"What do you want to name your home planet?"
    setTextLineTrigger	NOALIASES	:NO_ALIAS		"What do you want to name your ship?"
    setTextLineTrigger	ALIASES		:ALIAS			"Do you wish to make up a new Alias for your Trader Name"
	setTextTrigger		Phew		:Phew			"Command [TL"
	send "T***Y" & $PassWord & "*" & $PassWord & "**"
	pause
	:NO_ALIAS
		killTrigger ALIASES
		killTrigger GameClosed1
		killTrigger GameClosed2
		killTrigger GameClosed3
		send ".*Y"
		pause
	:ALIAS
		killTrigger NOALIASES
		send "N" & $GameAlias & "*"
		pause
	:NoName
		killTrigger GameClosed1
		killTrigger GameClosed2
		killTrigger GameClosed3
		waiton "is what you want? (Y/N) Yes"
		pause
	:GoName
		killTrigger GameClosed1
		killTrigger GameClosed2
		killTrigger GameClosed3
		send "Y.*Y"
		pause
	:GameClosed
		killAllTriggers
		DISCONNECT
		setDelayTrigger  WhistleWhileYouWork	:WhistleWhileYouWork 1000
		pause
		:WhistleWhileYouWork
		if ($KeepFiringYouAssholes = 0)
			:KeepTying
			echo ANSI_14 & "**Game's Closed" & ANSI_15 & " - Ack! Keep Trying (Y/N)?*"
		    getConsoleInput $selection SINGLEKEY
		    upperCase $selection
		    if ($selection = "Y")
		    	setVar $KeepFiringYouAssholes	TRUE
				goto :Lets_Get_It_On
			elseif ($selection = "N")
				halt
			else
				goto :KeepTying
			end
		else
			goto :Lets_Get_It_On
		end
	:Damn_Planet
		killTrigger GameClosed1
		killTrigger GameClosed2
		killTrigger GameClosed3
		send ".*  Q  "
		pause
	:Phew
		killAllTriggers
	    if (($MAKE_CORP) AND (($CorpName <> "") OR ($CorpPW <> "")))
			send "*TM"&$CorpName&"*Y"&$CorpPW&"*YQCN24"&$SSChan&"*QQQZN*^Q"
		else
			send "*CN24"&$SSChan&"*QQQZN*^Q"
		end
		setTextLineTrigger		AllDone		:AllDone ": ENDINTERROG"
		pause

    :AllDone
    	killAllTriggers
    	if ($GRAB)
    		send "L  *  *  *  "
    		waiton "<Re-Display>"
    	end

    	if ($Mow)
    		send "V"
    		waitOn "-=-=-=-  Current Stats for"
    		waiton "Command [TL="
			if ((STARDOCK = "0") OR (STARDOCK = ""))
				echo ("**" & ANSI_14 & "Cannot MOW To StarDock. It Appears to be Hidden.**")
				halt
			end
			setVar $To STARDOCK
			setVar $from CURRENTSECTOR
			gosub :Find_2nd_Door
			gosub :quikstats
       		gosub :getCourse
			setVar $j 1
			setVar $mow_to ""
			while ($j <= $courselength)
				setVar $mow_to ($mow_to & "  m " & $COURSE[$j] & "*  ")
				if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK))
					setVar $mow_to ($mow_to & "z a " & $maxFigAttack & "998877665544332211000*  *  ")
				end
				if (($JET) AND ($j = ($courselength - 1)))
					setVar $mow_to ($mow_to & " j y ")
				end
		    	add $j 1
		    end

			send ($mow_to & "^ Q  ")
			waitfor ": ENDINTERROG"
			gosub :quikstats
			if ($CURRENT_SECTOR = $TO)
    	    	if ($ALIGNMENT < 0)
					send "  P  S G Y G Q"
					waiton "You leave the Galactic Bank."
					send "/"
					waiton "<StarDock> Where to?"
               		echo ANSI_15 & "**Alignment Below Zero - Hiding On Dock!**"
               		halt
            	else
            		send "IVD"
               	end
			else
				send " N * /"
				waitfor "Command [TL"
				echo ANSI_15 & "**Whoops, Not At Dock!**"
				halt
			end
        else
        	send "CV*YYQIVD"
		end

		if ($RunScript <> "")
			Echo "****"&ANSI_14&"Starting Script: " &  ANSI_15 & $RunScript
			setDelayTrigger	WaitingForGaDoe		:WaitingForGaDoe	1000
			pause
			:WaitingForGaDoe
			killAllTriggers
			load $RunScript
		end
	halt

:getCourse
	killalltriggers
	setVar $sectors ""
	setTextLineTrigger sectorlinetrig :sectorsline " > "
	send "^f"&$From&"*"&$To&"*nq"
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
	getWordPos $line $pos3 "*** Error"

	if (($pos > 0) OR ($pos2 > 0))
		setVar $courseLength 0
		return
	end
	getWordPos $line $pos " sector "
	getWordPos $line $pos2 "TO"
	if (($pos <= 0) AND ($pos2 <= 0))
		setVar $sectors $sectors & " " & $line
	end
	getWordPos $line $pos " "&$To&" "
	getWordPos $line $pos2 "("&$To&")"
	getWordPos $line $pos3 "TO"
	if ((($pos > 0) OR ($pos2 > 0)) AND ($pos3 <= 0))
		goto :gotSectors
	else
		setTextLineTrigger sectorlinetrig :sectorsline " > "
		setTextLineTrigger sectorlinetrig2 :sectorsline " "&$To&" "
		setTextLineTrigger sectorlinetrig3 :sectorsline " "&$To
		setTextLineTrigger sectorlinetrig4 :sectorsline "("&$To&")"
		setTextLineTrigger donePath :sectorsline "So what's the point?"
		setTextLineTrigger donePath2 :sectorsline ": ENDINTERROG"
	end
	pause

:gotSectors
	killAllTriggers
	setVar $COURSE 0
	setVar $sectors $sectors&" :::"
	setVar $courseLength 0
	setVar $index 1
	:keepGoing
	if ($sectors = " FM     :::")
		return
	end
	getWord $sectors $TEMPO $index
	while ($TEMPO <> ":::")
		if ($TEMPO <> "FM") AND ($TEMPO <> $From)
			add $courseLength 1
			setVar $COURSE[$courseLength] $TEMPO
		end
		add $index 1
		getWord $sectors $TEMPO $index
	end
	return

:noPath
	killAllTriggers
	goSub :showTitle
	goto :wait

:quikstats
	SetVar $CURRENT_PROMPT 		"Undefined"
	killtrigger noprompt
	killtrigger prompt1
	killtrigger prompt2
	killtrigger prompt3
	killtrigger prompt4
	killtrigger statlinetrig
	killtrigger getLine2
	setTextTrigger 		prompt1 		:allPrompts 		"(?="
	setTextLineTrigger 	prompt2 		:secondaryPrompts 	"(?)"
	setTextLineTrigger 	statlinetrig 	:statStart 		#179
	setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
	setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
	send "^Q/"
	pause

	:allPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			SetVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt1 :allPrompts "(?="
		pause
	:secondaryPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			SetVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt2 :secondaryPrompts "(?)"
		pause
	:terraPrompts
		killtrigger prompt3
		killtrigger prompt4
		getWord currentansiline $checkPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			SetVar $CURRENT_PROMPT "Terra"
		end
		setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
		setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
		pause
	:statStart
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
		killtrigger noprompt
		SetVar $stats ""
		SetVar $wordy ""
	:statsline
		killtrigger statlinetrig
		killtrigger getLine2
		SetVar $line2 CURRENTLINE
		replacetext $line2 #179 " "
		striptext $line2 ","
		SetVar $stats $stats & $line2
		getWordPos $line2 $pos "Ship"
		if ($pos > 0)
			goto :gotStats
		else
			setTextLineTrigger getLine2 :statsline
			pause
		end

	:gotStats
		SetVar $stats $stats & " @@@"

		SetVar $current_word 0
		while ($wordy <> "@@@")
			if ($wordy = "Sect")
				getWord $stats $CURRENT_SECTOR   	($current_word + 1)
			elseif ($wordy = "Turns")
				getWord $stats $TURNS  				($current_word + 1)
			elseif ($wordy = "Creds")
				getWord $stats $CREDITS  			($current_word + 1)
			elseif ($wordy = "Figs")
				getWord $stats $FIGHTERS   			($current_word + 1)
			elseif ($wordy = "Shlds")
				getWord $stats $SHIELDS  			($current_word + 1)
			elseif ($wordy = "Hlds")
				getWord $stats $TOTAL_HOLDS   		($current_word + 1)
			elseif ($wordy = "Ore")
				getWord $stats $ORE_HOLDS    		($current_word + 1)
			elseif ($wordy = "Org")
				getWord $stats $ORGANIC_HOLDS    	($current_word + 1)
			elseif ($wordy = "Equ")
				getWord $stats $EQUIPMENT_HOLDS    	($current_word + 1)
			elseif ($wordy = "Col")
				getWord $stats $COLONIST_HOLDS    	($current_word + 1)
			elseif ($wordy = "Phot")
				getWord $stats $PHOTONS   			($current_word + 1)
			elseif ($wordy = "Armd")
				getWord $stats $ARMIDS   			($current_word + 1)
			elseif ($wordy = "Lmpt")
				getWord $stats $LIMPETS   			($current_word + 1)
			elseif ($wordy = "GTorp")
				getWord $stats $GENESIS 	 		($current_word + 1)
			elseif ($wordy = "TWarp")
				getWord $stats $TWARP_TYPE  		($current_word + 1)
			elseif ($wordy = "Clks")
				getWord $stats $CLOAKS   			($current_word + 1)
			elseif ($wordy = "Beacns")
				getWord $stats $BEACONS 			($current_word + 1)
			elseif ($wordy = "AtmDt")
				getWord $stats $ATOMIC  			($current_word + 1)
			elseif ($wordy = "Corbo")
				getWord $stats $CORBO   			($current_word + 1)
			elseif ($wordy = "EPrb")
				getWord $stats $EPROBES 	  		($current_word + 1)
			elseif ($wordy = "MDis")
				getWord $stats $MINE_DISRUPTORS   	($current_word + 1)
			elseif ($wordy = "PsPrb")
				getWord $stats $PSYCHIC_PROBE  		($current_word + 1)
			elseif ($wordy = "PlScn")
				getWord $stats $PLANET_SCANNER  	($current_word + 1)
			elseif ($wordy = "LRS")
				getWord $stats $SCAN_TYPE    		($current_word + 1)
			elseif ($wordy = "Aln")
				getWord $stats $ALIGNMENT    		($current_word + 1)
			elseif ($wordy = "Exp")
				getWord $stats $EXPERIENCE    		($current_word + 1)
			elseif ($wordy = "Corp")
				getWord $stats $CORP  	 			($current_word + 1)
			elseif ($wordy = "Ship")
				getWord $stats $SHIP_NUMBER   		($current_word + 1)
			end
			add $current_word 1
			getWord $stats $wordy $current_word
		end
	:doneQuikstats
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
		killtrigger statlinetrig
		killtrigger getLine2
	return

:Find_2nd_Door
	if ($DOOR_NUMBER > 1)
		setVar $i 1
		send "C"
		while ($i < $DOOR_NUMBER)
			gosub :getCourse
			setVar $k 2
			while ($k <= $courselength)
				if ($COURSE[$k] = $TO)
					setVar $adj $COURSE[($k - 1)]
					send ("V" & $adj & "*")
				end
		    	add $k 1
			end
			add $i 1
		end
		send "Q"
		waitfor "<Computer deactivated>"
	end
	return

:PASSWORDS
setVar $PASSWORDS[1] "ABC123"
setVar $PASSWORDS[2] "YO"
setVar $PASSWORDS[3] "WOWZER"
setVar $PASSWORDS[4] "FIRMA"
setVar $PASSWORDS[5] "TERRA"
setVar $PASSWORDS[6] "TRIX"
setVar $PASSWORDS[7] "THUNDER"
setVar $PASSWORDS[8] "GREECE"
setVar $PASSWORDS[9] "MUSTANG"
setVar $PASSWORDS[10] "SEXY"
setVar $PASSWORDS[11] "VIRGO"
setVar $PASSWORDS[12] "COFFEE"
setVar $PASSWORDS[13] "LMAO"
setVar $PASSWORDS[14] "BUTTERFACE"
setVar $PASSWORDS[15] "TURKEY"
setVar $PASSWORDS[16] "CRACKER"
setVar $PASSWORDS[17] "ELITE"
setVar $PASSWORDS[18] "MORON"
setVar $PASSWORDS[19] "BOOBLESS"
setVar $PASSWORDS[20] "MOONER"
setVar $PASSWORDS[21] "SPACE"
setVar $PASSWORDS[22] "STAR"
setVar $PASSWORDS[23] "EARTH"
setVar $PASSWORDS[24] "TUNA"
setVar $PASSWORDS[25] "FRIG"
setVar $PASSWORDS[26] "OXYGEN"
setVar $PASSWORDS[27] "ZEUS"
setVar $PASSWORDS[28] "12345"
setVar $PASSWORDS[29] "FERBALL"
setVar $PASSWORDS[30] "NOOB"
setVar $PASSWORDS[31] "BAKED"
setVar $PASSWORDS[32] "QWERTY"
setVar $PASSWORDS[33] "BOOBS"
setVar $PASSWORDS[34] "KILLER"
setVar $PASSWORDS[35] "SWORDFISH"
setVar $PASSWORDS 35
getRnd $INDEX 1 35
setVar $CorpPW $PASSWORDS[$INDEX]
return