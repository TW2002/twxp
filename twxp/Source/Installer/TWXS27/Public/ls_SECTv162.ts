    #=--------                                                                       -------=#
     #=---------------------      LoneStar's Express Col & Tow    -------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	June 13, 2007 - Version 1.62
	#		Author		:	LoneStar
	#		TWX			:	TWX 2.04b or TWX 2.04 Final
	#		Credits		:	Mind Daggers Mow Routine
	#                       Mind Daggers modified version of Singularity's quikstats
	#
	#		To Run		:	You will Need the following addressed
	#                                    - Be In Ship #1, Ship #2 in Sector
	#                                    - Command Prompt
	#
	#		Fixes       :	Add Value Checking For Production Group ($Cat). Defaults to 1,  if
	#						User forgot to make a selection.
	#						Add more safety Triggers to the support File,  and a Status Window
	#						pops up if there's a problem.
	#						Added a continual Status Window  show Cols remaining  on Terra and
	#						difference  in col  level  since last trip (gage the competition),
	#						and finally Number of Trips Made.
	#						Add Msg's turn Off and On, to make using menu better
	#						Had one too many Spaces in the macro string aborted a necessary
	#						line the Status Window needed.
	#                       JAN 22/08 - Commented out Lines 561 to 573
	#
	#
	#		Description	:   Simple Express Col Script that Tows a  Second Ship.  With a Planet
	#						Adj Fed-Space, this process gives a Red about the same preformance
	#						and Speed as a Commish'd player.  Holds on  *BOTH* ships should be
	#						be Maxed & Empty, otherwise you'd be waisting your time.
	#
	#						LSECT  generates a large Macro,  and sends it out all  in one shot
	#						as  a result,  some things can occur that can cause make the col'n
	#						process an awfull experience  -like NavHaz put in your path.  As a
	#						precaution,  this script automatically creates  a companion script
	#						that wactches for things like NavHaz while Burst E-Colonizing, and
	#						Disconnects from the server PDQ (the only way to stop a long Burst
	#						is to diconnect from the server.)

	setVar $Master_File	"LSECTv162"
	setVar $Code_File	"LSECv10b.ts"
	setVar $TagLine		"LoneStar's Express COL & TOW"
	setVar $TagLineB	"[LSECv1.62]"
	setVar $TagLineC	ANSI_9&"["&ANSI_14&"LSEC"&ANSI_10&"v"&ANSI_14&"1"&ANSI_10&"."&ANSI_14&"62"&ANSI_9&"]"
	setVar $Version		"1.62"
	setVar $planet 		""
	setVar $ship1 		""
	setVar $ship2 		""
	setVar $ship2_HOLDS ""
	setVar $Trips 		""
	setVar $Category 	"Fuel ORE"
	setVar $Cat 		1

	gosub :quikstats

	if ($CURRENT_PROMPT <> "Command")
		Echo ("***" & $TagLineC & ANSI_15 & " Must Start From Command Prompt.***")
		echo "*" $CURRENT_PROMPT
		halt
	end

	LoadVar $LSECT_Planet
	isNumber $tst $LSECT_Planet
	if ($tst = 0)
		setVar $LSECT_Planet 0
	end
	if ($LSECT_Planet = 0)
		setVar $planet ""
	else
		setVar $planet $LSECT_Planet
	end

	LoadVar	$LSECT_Ship2
	isNumber $tst $LSECT_Ship2
	if ($tst = 0)
		setVar $LSECT_Ship2 0
	end
	if ($LSECT_Ship2 = 0)
		setVar $ship2 ""
		setVar $ship2_PScan FALSE
	else
		setVar $ship2 $LSECT_Ship2
	end

	if ($SHIP_NUMBER = $Ship2)
    	setVar $ship2 ""
		setVar $ship2_PScan FALSE
	end

	if ($ship2 <> "")
		gosub :Ship2_Info
		if ($GOOD_SHIP_LOLIPOP = FALSE)
			setVar $ship2 ""
			setVar $ship2_PScan FALSE
		end
	end

	send "   **    "
	waiton "Warps to Sector(s)"
	waiton "Command"

	if (SECTOR.NAVHAZ[$CURRENT_SECTOR] <> 0)
		Echo ("***" & $TagLineC & ANSI_15 & " NavHaz Detected! Might Be Faster Pressing: CBY***")
		halt
	end

	if (SECTOR.PLANETCOUNT[$CURRENT_SECTOR] = 0)
		Echo ("***" & $TagLineC & ANSI_15 & " Colonizing Phantom Planets Are We?***")
		halt
	end

	gosub	:MSGS_OFF

	setVar $ship1 $SHIP_NUMBER
	:Menu_Top
	stop $Code_File
	stop $Code_File
	echo #27 & "[2J"
	echo "**"
	Echo ("    " & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
	echo ANSI_14 & "*       LoneStar's Express Col & Tow"
	echo ANSI_8 & "*               Version " & $Version & "*"
	Echo ("    "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&#196&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
	Echo "*" & ANSI_15 & #9 & "Ship " & ANSI_8 & "1" & ANSI_15 & " (Ship you're in) " & ANSI_14 & ": " & ANSI_8 & $ship1
	Echo "*" & ANSI_15 & #9 & "Ship " & ANSI_8 & "2" & ANSI_15 & " (Ship to tow)    " & ANSI_14 & ": " & ANSI_8 & $ship2
	Echo "*" & ANSI_8 & #9 & "P" & ANSI_15 & "lanet Number           " & ANSI_14 & ": " & ANSI_8 & $planet
	Echo "*" & ANSI_8 & #9 & "N" & ANSI_15 & "umber Of Trips         " & ANSI_14 & ": " & ANSI_8 & $Trips
	isNumber $tst $Trips
	if ($tst = 1)
		if ($ship2_HOLDS <> "")
			setVar $Moving (($TOTAL_HOLDS + $ship2_HOLDS) * $Trips)
			setVar $CashAmount $Moving
			gosub :CommaSize
			Echo ("  " & ANSI_8 & "(" & ANSI_7 & $CashAmount & " Cols" & ANSI_8 & ")")
		end
	end
	Echo "*" & ANSI_8 & #9 & "C" & ANSI_15 & "ol Production Group    " & ANSI_14 & ": " & ANSI_8 & $Category
    Echo "*    " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196
	Echo "*" & ANSI_8 & #9 & "Q" & ANSI_15 & "uit"
	Echo "*" & ANSI_8 & #9 & "G" & ANSI_15 & "o!"
	Echo "*"
	getConsoleInput $s SINGLEKEY
	uppercase $s
	if ($s = "Q")
		Echo "**" & #9
		gosub :MSGS_ON
		halt
	elseif ($s = "1")
		getInput $ship1 "*" & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Ship Number 1 (Ship you're in)?"
		isNumber $tst $ship1
		if ($tst = 0)
			setVar $ship1 ""
		end
	elseif ($s = "2")
		getInput $ship2 "*" & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Ship Number 2 (Ship to tow)?"
		isNumber $tst $ship2
		if ($tst = 0)
			setVar $ship2 ""
		else
			gosub :Ship2_Info
			if ($GOOD_SHIP_LOLIPOP)
			else
				setVar $ship2 ""
			end
		end
	elseif ($s = "P")
		getInput $planet "*" & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Planet Number?"
		isNumber $tst $planet
		if ($tst = 0)
			setVar $planet ""
		else
			setVar $LSECT_Planet $planet
			saveVar $LSECT_Planet
		end
	elseif ($s = "N")
		getInput $Trips "*" & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Number Of Trips?"
		isNumber $tst $Trips
		if ($tst = 0)
			setVar $Trips ""
		end
	elseif ($s = "C")
		if ($Category = "Fuel ORE")
			setVar $Category "Organics"
			setVar $cat 2
		elseif ($Category = "Organics")
			setVar $Category "Equipment"
			setVar $cat 3
		else
			setVar $Category "Fuel ORE"
			setVar $cat 1
		end
	elseif ($s = "G")
		if ($CURRENT_SECTOR < 10)
			SetVar $PADDED_BRA "     "
		elseif ($CURRENT_SECTOR < 100)
			SetVar $PADDED_BRA "    "
		elseif ($CURRENT_SECTOR < 1000)
			SetVar $PADDED_BRA "   "
		elseif ($CURRENT_SECTOR < 10000)
			SetVar $PADDED_BRA "  "
		else
			SetVar $PADDED_BRA " "
		end

		killAllTriggers
		send "W"
		setTextLineTrigger		BeamOff		:BeamOff	"You shut off your Tractor Beam"
		setTextTrigger			TowCtrl		:TowCtrl	"Do you wish to tow a manned ship"
		:BeamOff
			send "W"
			pause
		:TowCtrl
			killAllTriggers
			send "N*"

		waitfor "--------------------------------------------------------"
		setTextLineTrigger	Found2ndShip	:Found2ndShip	($ship2&$PADDED_BRA&$CURRENT_SECTOR&" ")
		setTextTrigger		NotFound		:NotFound		("]:["&$CURRENT_SECTOR&"] (?=H")
		pause
		:NotFound
			killAlltriggers
			Echo ("***"&$TagLineC&ANSI_15&" Ship "&ANSI_14&$ship2&ANSI_15&" Must Be In Same Sector!***")
			halt
		:Found2ndShip
			killAlltriggers
			send ("    X    " & $SHIP2 & "*    *  J Y  X    " & $SHIP1 & "*    *  J Y  ")
			waitfor "Are you sure you want to"
			waitfor "jettison all cargo"

		if (($Cat <> 1) AND ($Cat <> 2) AND ($Cat <> 3))
			setVar $Cat 1
		end
		isNumber $tst $Trips
		if ($tst = 0)
			setVar $Trips 0
		end
		isNumber $tst $ship1
		if ($tst = 0)
			setVar $ship1 0
		end
		isNumber $tst $ship2
		if ($tst = 0)
			setVar $ship2 0
		end
		isNumber $tst $planet
		if ($tst = 0)
			setVar $Planet 0
		end
		goto :Lets_Boogie
	end
	goto :Menu_Top

:Lets_Boogie
	setVar $i 1
	setVar $ss ""
    setvar $maxFigAttack 9999999000
	setVar $source CURRENTSECTOR
	setVar $destination 1
	gosub :getCourse
	setVar $j 4
	setVar $mow_to ""
	while ($j <= $courselength)
		setVar $mow_to ($mow_to&"       m "&$COURSE[$j]&"*       ")
		if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK))
			setVar $mow_to ($mow_to&"     z        a       "&$maxFigAttack&"*      *       ")
		end
    	add $j 1
    end
	setVar $source 1
	setVar $destination CURRENTSECTOR
	gosub :getCourse
	setVar $j 4
	setVar $mow_from ""
	while ($j <= $courselength)
		setVar $mow_from ($mow_from&"       m "&$COURSE[$j]&"*       ")
		if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK))
			setVar $mow_from ($mow_from&"      z        a        "&$maxFigAttack&"*       *       ")
		end
    	add $j 1
    end
	Echo ("**" & $TagLineC & ANSI_15 & " Generating Macro, Please StandBy...*")
	while ($i <= $Trips)
		#lock Tow
		setVar $s " w n  " & $ship2 & "* "
		#mow to terra
		setVar $s ($s & $mow_to)

		#get cols
		if ($PLANET_SCANNER = "Yes")
			setVar $s ($s & " l 1* * * ")
		else
			setVar $s ($s & " l * * ")
		end
		setVar $s ($s & "x    " & $ship2 & "*   * ")
		if ($ship2_PScan)
			setVar $s ($s & " l 1* *  * ")
		else
			setVar $s ($s & " l * * ")
		end
		setVar $s ($s & " w n " & $ship1 & "* ")
		#mow home
		setVar $s ($s & $mow_from)
		#drop cols
		setVar $s ($s & " l z" & #8 & $planet & "*      *         J          s        n         l        " & $Cat & "*       j        q        *        x     " & $ship1 & "*     *        l z" & #8 & $planet & "*        *        J        s        n        l        " & $Cat & "*       j       q        ")
		setvar $ss ($ss & $s)
		add $i 1
	end

	gosub	:Make_New_File

	setDelayTrigger		WriteBehind	:WriteBehind 1000
	pause
	:WriteBehind
	load $Code_File

	gosub :MSGS_ON

	send ("'" & $TagLineB & " Planet #" & $planet & ", " & $Category & " (" & $Trips & " Trips)*")
	send ($ss & "'" & $TagLineB & " Completed " & $Trips & " Trips*")
	setTextLineTrigger Finito	:Finito ($TagLineB & " Completed " & $Trips & " Trips")
	pause
	:Finito
		killAllTriggers
		stop $Code_File
		stop $Code_File
		halt
		halt
	waitfor #179
    #=--------                                                                       -------=#
     #=------------------------------      SUB ROUTINES      ------------------------------=#
    #=--------                                                                       -------=#

:getCourse
	killalltriggers
	setVar $sectors ""
	setTextLineTrigger sectorlinetrig :sectorsline " > "
	send "^f"&$source&"*"&$destination&"*q"
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

    :CommaSize
	if ($CashAmount < 1000)
		#do nothing
	elseif ($CashAmount < 1000000)
    	getLength $CashAmount $len
		setVar $len ($len - 3)
		cutText $CashAmount $tmp 1 $len
		cutText $CashAMount $tmp1 ($len + 1) 999
		setVar $tmp $tmp & "," & $tmp1
		setVar $CashAmount $tmp
	elseif ($CashAmount <= 999999999)
		getLength $CashAmount $len
		setVar $len ($len - 6)
		cutText $CashAmount $tmp 1 $len
		setVar $tmp $tmp & ","
		cutText $CashAmount $tmp1 ($len + 1) 3
		setVar $tmp $tmp & $tmp1 & ","
		cutText $CashAmount $tmp1 ($len + 4) 999
		setVar $tmp $tmp & $tmp1
		setVar $CashAmount $tmp
	end
	return

:Make_New_File
	setVar $Temp ""
	Delete ("scripts\" & $Code_File)
	setVar $temp ($temp &"#This File Was automatically Created By the LSECT Script.*")
	setVar $temp ($temp &"#This Script is a companion Script that monitors and terminates*")
	setVar $temp ($temp &"#the connection to the server at @any@ point during a long Macro Burst*")
	setVar $temp ($temp &"#    *")
	setVar $temp ($temp &"#You can Edit, Change or Delete this file. LSECT will recreate*")
	setVar $temp ($temp &"#a new file every time LSECT is used.*")
	setVar $temp ($temp &"#    *")
	setVar $temp ($temp &"#                                          Another LoneStar Classic*")
	# If not using the latest TWX-Proxy remove or comment-out these lines (Line 561 to 573 Inclusive)....
	#setVar $temp ($temp &"	listActiveScripts $LST*")
	#setVar $temp ($temp &"	setVar $i 1*")
	#setVar $temp ($temp &"	while ($i <= $LST)*")
	#setVar $temp ($temp &"		getWordPos $LST[$i] $pos #34" & $Master_File & "#34*")
	#setVar $temp ($temp &"		if ($pos <> 0)*")
	#setVar $temp ($temp &"			Goto :Good_To_Go*")
	#setVar $temp ($temp &"		end*")
	#setVar $temp ($temp &"		add $i 1*")
	#setVar $temp ($temp &"	end*")
	#setVar $temp ($temp &"	Echo #34@@@" & $TagLineC & "#34 & ANSI_15 & #34 Attempting To Start " & $Master_File & "@@#34*")
	#setVar $temp ($temp &"	load #34LoneStar_Pack\" & $Master_File & "#34*")
	#setVar $temp ($temp &"	halt*")
	#setVar $temp ($temp &"	:Good_To_Go*")
	# ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	setVar $temp ($temp &"	setVar $Status_Msg #34#34*")
	setVar $temp ($temp &"	setVar $ColsDifference 0*")
	setVar $temp ($temp &"	setVar $Cycle_Sync 0*")
	setVar $temp ($temp &"	setVar $Coloed 0*")
	setVar $temp ($temp &"	setVar $TripsMade 0*")
	setVar $temp ($temp &"	window status 450 120 #34 " & $TagLine & " Version " & $Version & "  [" & GAMENAME & "]#34  ONTOP *")
	setVar $temp ($temp &"	setWindowContents status #34@   " & $TagLine & " Version " & $Version & "@#34*")
	setVar $temp ($temp &"	setTextLineTrigger	NavHaz1		:NavHaz		#34Collision Damage! Asteroids/Debris#34*")
	setVar $temp ($temp &"	setTextLineTrigger	NavHAz2		:NavHaz		#34WARNING! WARNING! Space Debris/Asteroids narrowly avoided#34*")
	setVar $temp ($temp &"	setTextLineTrigger	NoCols		:NoCols		#34There aren't that many on Terra!#34*")
	setVar $temp ($temp &"	setTextLineTrigger	HoldsFull	:HoldsFull	#34How many groups of Colonists do you want to take ([0] empty holds)#34*")
	setVar $temp ($temp &"	setTextLineTrigger	ProdFull	:ProdFull	#34There isn't room on the planet for that many!#34*")
	setVar $temp ($temp &"	setTextLineTrigger	PlntGone	:PlntGone	#34<Jettison Cargo>#34*")
	setVar $temp ($temp &"	setTextLineTrigger	ShipGone	:ShipGone	#34You do not own any other ships in this sector!#34*")
	setVar $temp ($temp &"	setTextLineTrigger	ColCount	:ColCount	#34colonists ready to leave Terra.#34*")
	setVar $temp ($temp &"	setTextLineTrigger	ColAquired	:ColAquired #34How many groups of Colonists do you want to leave#34*")
	setVar $temp ($temp &"	pause*")
	setVar $temp ($temp &"	:ColAquired*")
	setVar $temp ($temp &"  	getText CURRENTLINE $temp #34leave ([#34 #34] on board#34*")
	setVar $temp ($temp &"		stripText $temp #34 #34*")
	setVar $temp ($temp &"		isNumber $tst $temp*")
	setVar $temp ($temp &"		if ($tst = 0)*")
	setVar $temp ($temp &"			setVar $temp 0*")
	setVar $temp ($temp &"		end*")
	setVar $temp ($temp &"		add $Coloed $temp*")
	setVar $temp ($temp &"		setTextLineTrigger	ColAquired	:ColAquired #34How many groups of Colonists do you want to leave#34*")
	setVar $temp ($temp &"		pause*")
	setVar $temp ($temp &"	:ColCount*")
	setVar $temp ($temp &"		if ($Cycle_Sync = 0)*")
	setVar $temp ($temp &"			add $Cycle_Sync 1*")
	setVar $temp ($temp &"			add $TripsMade 1*")
	setVar $temp ($temp &"			getWord CURRENTLINE $ColsOnTerra 4*")
	setVar $temp ($temp &"			if ($ColsDifference = 0)*")
	setVar $temp ($temp &"      		setWindowContents status #34@   Colonists Remaining : #34 & $ColsOnTerra & #34@   Col Level Dropped   : N/A@   Trips Made          : #34 & $TripsMade & #34 of " & $Trips & "@   Cols Grabbed        : #34 & $Coloed & #34@@#34*")
	setVar $temp ($temp &"			else*")
	setVar $temp ($temp &"      		setWindowContents status #34@   Colonists Remaining : #34 & $ColsOnTerra & #34@   Col Level Dropped   : #34 & ($ColsDifference - $ColsOnTerra) & #34@   Trips Made          : #34 & $TripsMade & #34 of " & $Trips & "@   Cols Grabbed        : #34 & $Coloed & #34@@#34*")
    setVar $temp ($temp &"			end*")
	setVar $temp ($temp &"			setVar $ColsDifference $ColsOnTerra*")
	setVar $temp ($temp &"		else*")
	setVar $temp ($temp &"			setVar $Cycle_Sync 0*")
	setVar $temp ($temp &"		end*")
	setVar $temp ($temp &"		setTextLineTrigger	ColCount	:ColCount	#34colonists ready to leave Terra.#34*")
	setVar $temp ($temp &"		pause*")
	setVar $temp ($temp &"	:ShipGone*")
	setVar $temp ($temp &"		killAllTriggers*")
	setVar $temp ($temp &"		setVar $Status_Msg	(#34Second Ship Appears To Be Gone!!@#34)*")
	setVar $temp ($temp &"		goto :FIN*")
	setVar $temp ($temp &"	:PlntGone*")
	setVar $temp ($temp &"		killAllTriggers*")
	setVar $temp ($temp &"		setVar $Status_Msg	(#34Planet Appears To Have Disappeared!!@#34)*")
	setVar $temp ($temp &"		goto :FIN*")
	setVar $temp ($temp &"	:HoldsFull*")
	setVar $temp ($temp &"		killAllTriggers*")
	setVar $temp ($temp &"		setVar $Status_Msg	(#34Holds Appear To Be Full - Not Getting Cols@#34)*")
	setVar $temp ($temp &"		goto :FIN*")
	setVar $temp ($temp &"    :ProdFull*")
	setVar $temp ($temp &"		killAllTriggers*")
	setVar $temp ($temp &"		setVar $Status_Msg	(#34No Room For Cols@#34)*")
	setVar $temp ($temp &"		goto :FIN*")
	setVar $temp ($temp &"	:NoCols*")
	setVar $temp ($temp &"		killAllTriggers*")
	setVar $temp ($temp &"		setVar $Status_Msg	(#34Terra's Dry@#34)*")
	setVar $temp ($temp &"		goto :FIN*")
	setVar $temp ($temp &"	:NavHaz*")
	setVar $temp ($temp &"		killAllTriggers*")
	setVar $temp ($temp &"		setVar $Status_Msg	(#34NavHaz Detected!!@#34)*")
	setVar $temp ($temp &"		goto :FIN*")
	setVar $temp ($temp &"       *")
	setVar $temp ($temp &"	:FIN*")
	setVar $temp ($temp &"		DISCONNECT*")
	setVar $temp ($temp &"		if ($Status_Msg <> #34#34)*")
	setVar $temp ($temp &"			setWindowContents status #34Colonization Halted Due To:@        #34 & $Status_Msg*")
	setVar $temp ($temp &"		end*")
	setVar $temp ($temp &"		setDelayTrigger	PleaseTryAgain	:PleaseTryAgain	10000*")
	setVar $temp ($temp &"		pause*")
	setVar $temp ($temp &"		:PleaseTryAgain*")
	setVar $temp ($temp &"		Echo #34@@@" & $TagLineC & "#34 & ANSI_14 & #34 Colonization Halted Due To: #34 & ANSI_15 & $Status_Msg & #34@@#34*")
	setVar $temp ($temp &"		stop #34" & $Master_File & "#34*")
	setVar $temp ($temp &"		stop #34" & $Master_File & "#34*")
	setVar $temp ($temp &"		Halt*")
	replaceText $temp "#34" #34
	replaceText $temp "@"  #42
	write ("Scripts\" & $Code_File) $temp
	return


:MSGS_ON
    :ON_AGAIN
    setTextTrigger onMSGS_ON  :onMSGS_ON "Displaying all messages."
    setTextTrigger onMSGS_OFF :onMSGS_OFF "Silencing all messages."
    send "|"
    pause
    :onMSGS_OFF
    killAllTriggers
    goto :ON_AGAIN
    :onMSGS_ON
    killAllTriggers
    setVar $MSGS_ON TRUE
    return

:MSGS_OFF
    :OFF_AGAIN
    setTextTrigger offMSGS_OFF :offMSGS_OFF "Silencing all messages."
    setTextTrigger offMSGS_ON  :offMSGS_ON "Displaying all messages."
    send "|"
    pause
    :offMSGS_ON
    killAllTriggers
    goto :OFF_AGAIN
    :offMSGS_OFF
    setVar $MSGS_ON FALSE
    killAllTriggers
    return

:Ship2_Info
	setVar $ship2_PScan 		FALSE
	setVar $GOOD_SHIP_LOLIPOP	TRUE
	send "X   I" & $ship2 & "**   *   "
	waitfor "Choose which ship to beam to"
	setTextLineTrigger		T_Holds		:T_Holds 	"Total Holds    :"
	setTextLineTrigger		N_HOLDS		:N_HOLDS 	"<Re-Display>"
	setTextLineTrigger		P_SCAN		:P_SCAN		"Planet Scanner : Yes"
	setTextLineTrigger		NoShip		:NoShip		"That is not an available ship."
	setTextTrigger			Done		:Done		"Command [TL="
	pause
	:NoShip
		killAllTriggers
		waitfor "<Re-Display>"
	    Echo ("***"&$TagLineC&ANSI_15&" Ship "&ANSI_14&$ship2&ANSI_15&" Is Not Available!***")
	    setVar $GOOD_SHIP_LOLIPOP FALSE
		return
	:T_Holds
		getWord CURRENTLINE $ship2_HOLDS 4
		isNumber $tst $ship2_HOLDS
		if ($tst = 0)
			setVar $ship2 ""
			setVar $ship2_HOLDS ""
		end
		pause
	:P_SCAN
		setVar $ship2_PScan TRUE
		pause
	:N_Holds
		killAllTriggers
		setVar $ship2 ""
		setVar $ship2_HOLDS ""
	:Done
		killAllTriggers
		setVar 	$LSECT_Ship2 $ship2
		saveVar $LSECT_Ship2
		return