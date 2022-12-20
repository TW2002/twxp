    #=--------                                                                       -------=#
     #=--------------------------    LoneStar's Density Photon    -------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	May 20, 2007 - Version 1.0
	#		Author		:	LoneStar
	#		TWX			:	Should Work with All Versions of TWX --Tested with 2.04 Final
	#		Credits		:	Mind Daggers modified version of Singularity's quikstats
	#						Used E.P's Timming Code from Scripting Reference File
	#                       B.Y.O.C MMVII - Was To Be true litmus-test, but alas ended too
	#						soon --Kudos To: M()M Mind Dagger & The Bounty Hunter
	#
	#		To Run		:	You will Need the following addressed
	#                                    - Need At Least One Photon
	#                                    - Density Scanner
	#                                    - Best Possible Ping Time
	#
	#		Fixes		:	Initial Release
	#
	#		Description	:	Performs a continual Density Scan of Adjacent-sectors looking for
	#                       *any* change, and fires a Photon into respective sector.
	#
	#                       While Script is running press the  -  ..key at anytime to halt. It
	#                       can be initiated from: Planet; Command; Port; StarDock, Prompts
	#                       and will return once '-' is pressed.
	#
	#						I've devised a completely original Density-Value-Change detection
	#                       routine that has tested (on average), faster than Big12OzHog's. I
	#                       have left in the Timing-code (commented out), for anyone to play
	#                       around with. Results of my testing:
	#
	#                         Running From A 6way (Density Change in 6th Warp
	#                            [LSDTorp]  TimeLapse: 4533696 Ticks, or 0.001743729230769231 Seconds.
	#                            [OZ DTorp] TimeLapse: 6195384 Ticks, or 0.002382840000000000 Seconds.
	#                         Running From a Dead End
	#                            [LSDTorp]  TimeLapse: 2979420 Ticks, or 0.001145930769230769 Seconds.
	#                            [OZ DTorp] TimeLapse: 3286192 Ticks, or 0.001263920000000000 Seconds.
	#
	logging off
	reqRecording
	setVar		$TagLine	"LoneStar's Density Torp'R"
	setVar		$TagLineB	"[LSDTorp]"
	setArray	$Adjs		6 1
	setVar		$Adj_cnt	0

	goSub	:Global_Grover

	:ReCheck_PROMPT
	goSub	:quikstats
	if ($SCAN_TYPE = "None")
		Echo  ("**" & ANSI_14 &$TagLineB&ANSI_15&" Must Have At Least a Density Scanner; Halting!*")
		halt
	end
	if ($PHOTONS < 1)
		Echo  ("**" & ANSI_14 &$TagLineB&ANSI_15&" No Photons Available; Halting!*")
		halt
	end

	if ($CURRENT_PROMPT = $COMMAND_PROMPT)

	elseif ($CURRENT_PROMPT = $CITADEL_PROMPT)
		send "   QDQ   "
		waitfor "Planet #"
		getWord CURRENTLINE $PLANET 2
		stripText $PLANET "#"
		isNumber $tst $PLANET
		if ($tst = 0)
			setVar $PLANET 0
		end
	elseif ($CURRENT_PROMPT = $COMPUTER_PROMPT)
		send "   Q   "
    	goto :ReCheck_PROMPT
	elseif ($CURRENT_PROMPT = $CORPORATE_PROMPT)
		send "   Q   "
    	goto :ReCheck_PROMPT
	elseif ($CURRENT_PROMPT = $PORT_PROMPT)
		send "   0*  0*  0*  0*  0*"
		waitfor "Warps to Sector(s) :"
	elseif ($CURRENT_PROMPT = $PLANET_PROMPT)
		send "   DQ   "
		waitfor "Planet #"
		getWord CURRENTLINE $PLANET 2
		stripText $PLANET "#"
		isNumber $tst $PLANET
		if ($tst = 0)
			setVar $PLANET 0
		end
	elseif ($CURRENT_PROMPT = $HARDWARE_PROMPT)
		send "Q Q   "
	elseif ($CURRENT_PROMPT = $SHIPYARD_PROMPT)
		send "Q Q   "
    elseif ($CURRENT_PROMPT = $STARDOCK_PROMPT)
		send "Q  "
	else
		Echo  ("**" & ANSI_14 &$TagLineB&ANSI_15&" Must Start From: Planet, Command, Port, or StarDock.*")
		halt
	end

	setVar $START_PROMPT $CURRENT_PROMPT

	send ("'"&$TagLine&" Activated!!*")

	goSub	:CN_Check

	setVar $i 1
	setVar $Density_Weight_TOTAL 0
	setVar $Adj_cnt	SECTOR.WARPCOUNT[$CURRENT_SECTOR]

	send " C N 1 Q Q SD"
	waitfor "Relative Density Scan"
	:Init_Loop
	setTextTrigger	Done_Init_Scan		:Done_Init_Scan		"Command [TL="
	setTextLineTrigger	Adj_Sector		:Adj_Sector			"Sector"
	pause
	:Adj_Sector
		killTrigger Done_Init_Scan
		killTrigger Adj_Sector
		setVar $Adjs[$i] SECTOR.WARPS[$CURRENT_SECTOR][$i]
		CutText CURRENTLINE $temp 1 45
		setVar $Adjs[$i][1] $temp
		add $Density_Weight_TOTAL $i
		add $i 1
		goto :Init_Loop

	:Done_Init_Scan
		killTrigger Done_Init_Scan
		killTrigger Adj_Sector
		if (($i - 1) <> $Adj_cnt)
			send ("'"&$TagLineB&" Abnormal Error with Adjacent Sector Sync!*")
			waitfor "Message sent on sub-space channel"
			send " C N 1 Q Q  "
			gosub :Return_To_Start
			halt
		end

		setTextOutTrigger manual_stop :manual_stop "-"

		send "sd"
		:Reset_Triggers
		#getTimer $startTicks
		setVar $Density_Weight $Density_Weight_TOTAL
		setVar $i 1
		while ($i <= $Adj_cnt)
			setTextTrigger (Adj_Trigger_ & $i)  (:Adj_Trigger_ & $i)	$Adjs[$i][1]
        	add $i 1
		end
		setTextTrigger	Done_Scan	:DoneScan	"Command [TL="
		pause
:Adj_Trigger_1
	subtract $Density_Weight 1
	pause
:Adj_Trigger_2
	subtract $Density_Weight 2
	pause
:Adj_Trigger_3
	subtract $Density_Weight 3
	pause
:Adj_Trigger_4
	subtract $Density_Weight 4
	pause
:Adj_Trigger_5
	subtract $Density_Weight 5
	pause
:Adj_Trigger_6
	subtract $Density_Weight 6
	pause
:DoneScan
	if ($Density_Weight <> 0)
		SetVar $Hitting $Adjs[$Density_Weight]
    	send ("C  P  Y  "&$Hitting&"  *  Q ")
		send ("'"&$TagLineB&" Photon Fired-> "&$Hitting&"*")
		#getTimer $stopTicks
		waitfor "Message sent on sub-space channel"
		gosub :Return_To_Start
		gosub :quikstats
		if ($START_PROMPT <> $CURRENT_PROMPT)
			send ("'"&$TagLineB&" Starting Prompt Not Reached!*")
		end
		#setVar $duration ($stopTicks - $startTicks)
		#setPrecision 18
		#setVar $seconds ($duration / 2600000000)
		#setPrecision 0
        #send "'"&$TagLineB&" TimeLapse: " & $duration & " Ticks, or " & $seconds & " Seconds.*"
		#waitfor "Message sent on sub-space channel"
		halt
	end
	if ($Cycles >= 50)
		setVar $Cycles 1
		send ("'"&$TagLineB&"  !!DENSITY FOTON RUNNING AT MY TA!!*")
		waitfor "Message sent on sub-space channel"
	end
	add $Cycles 1
	send "sd"
	waitfor "Relative Density Scan"
	goto :Reset_Triggers

:Manual_stop
	killAllTriggers
	gosub :Return_To_Start
	gosub :quikstats
	if ($START_PROMPT <> $CURRENT_PROMPT)
		send ("'"&$TagLineB&" Starting Prompt Not Reached!*")
	end
	halt

:Return_To_Start
	send "  C N 1  Q  Q  "
	if ($START_PROMPT = $COMMAND_PROMPT)
		send "   **   "
	elseif ($START_PROMPT = $CITADEL_PROMPT)
		if ($PLANET <> 0)
			send ("   L  Z" & #8 & #8 & $PLANET & "*  *  J  C  *   /")
		end
	elseif ($START_PROMPT = $PORT_PROMPT)
		send "   P  Z T  N   "
	elseif ($START_PROMPT = $PLANET_PROMPT)
		if ($PLANET <> 0)
			send ("   L  Z" & #8 & #8 & $PLANET & "*  *  ")
		end
	elseif ($START_PROMPT = $HARDWARE_PROMPT)
		send "   P  Z S H Y Q H *   "
	elseif ($START_PROMPT = $SHIPYARD_PROMPT)
		send "   P  Z S S Y Q S *   "
    elseif ($START_PROMPT = $STARDOCK_PROMPT)
		send "   P  Z S G Y Q G *   "
	else

	end
	send ("'"&$TagLineB&" Deactivated*")
	waitfor ($TagLineB&" Deactivated")
	return

:Global_Grover
	setVar $CURRENT_PROMPT 		"Undefined"
	setVar $PSYCHIC_PROBE 		"NO"
	setVar $PLANET_SCANNER 		"NO"
	setVar $SCAN_TYPE 			"NONE"
	setVar $CURRENT_SECTOR 		0
	setVar $TURNS 				0
	setVar $CREDITS 			0
	setVar $FIGHTERS 			0
	setVar $SHIELDS 			0
	setVar $TOTAL_HOLDS 		0
	setVar $ORE_HOLDS 			0
	setVar $ORGANIC_HOLDS 		0
	setVar $EQUIPMENT_HOLDS 	0
	setVar $COLONIST_HOLDS		0
	setVar $PHOTONS 			0
	setVar $ARMIDS 				0
	setVar $LIMPETS 			0
	setVar $GENESIS 			0
	setVar $TWARP_TYPE 			0
	setVar $CLOAKS 				0
	setVar $BEACONS 			0
	setVar $ATOMIC 				0
	setVar $CORBO 				0
	setVar $EPROBES 			0
	setVar $MINE_DISRUPTORS 	0
	setVar $ALIGNMENT 			0
	setVar $EXPERIENCE			0
	setVar $CORP 				0
	setVar $SHIP_NUMBER			0
	setVar $TURNS_PER_WARP 		0
	setVar $COMMAND_PROMPT 		"Command"
	setVar $COMPUTER_PROMPT 	"Computer"
	setVar $CITADEL_PROMPT		"Citadel"
	setVar $PLANET_PROMPT		"Planet"
	setVar $CORPORATE_PROMPT	"Corporate"
	setVar $STARDOCK_PROMPT 	"Stardock"
	setVar $HARDWARE_PROMPT 	"Hardware"
	setVar $SHIPYARD_PROMPT 	"Shipyard"
	setVar $TERRA_PROMPT 		"Terra"
	setVar $PORT_PROMPT			"Port"
	setVar $PORT_PROMPT_TYPE	""
	return

:quikstats
	setVar $CURRENT_PROMPT 		"Undefined"
	killtrigger 		noprompt
	killtrigger 		prompt1
	killtrigger 		prompt2
	killtrigger 		prompt3
	killtrigger 		prompt4
	killtrigger			prompt5
	killtrigger 		statlinetrig
	killtrigger 		getLine2
	setTextTrigger 		prompt1 		:allPrompts 		"(?="
	setTextLineTrigger 	prompt2 		:secondaryPrompts 	"(?)"
	setTextLineTrigger 	statlinetrig 	:statStart 			#179
	setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
	setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
	setTextTrigger		prompt5			:portPrompt			"How many holds of"
	send "^Q/"
	pause
	:allPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			setVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt1 :allPrompts "(?="
		pause
	:secondaryPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			setVar $CURRENT_PROMPT $tempPrompt
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
		end
		setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
		setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
		pause
	:portPrompt
		getWord CURRENTANSILINE $checkPrompt 1
		setVar $PORT_PROMPT_TYPE CURRENTLINE
		getWord $PORT_PROMPT_TYPE $tempPrompt 1
		getWordPos $checkPrompt $pos "[35mHow"
		if ($pos > 0)
			setVar $CURRENT_PROMPT "Port"
		end
		setTextTrigger		prompt5			:portPrompt			"How many holds of"
		pause

	:statStart
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
		killtrigger prompt5
		killtrigger noprompt
		setVar $stats ""
		setVar $wordy ""

	:statsline
		killtrigger statlinetrig
		killtrigger getLine2
		setVar $line2 CURRENTLINE
		replacetext $line2 #179 " "
		striptext $line2 ","
		setVar $stats $stats & $line2
		getWordPos $line2 $pos "Ship"
		if ($pos > 0)
			goto :gotStats
		else
			setTextLineTrigger getLine2 :statsline
			pause
		end

	:gotStats
		setVar $stats $stats & " @@@"

		setVar $current_word 0
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
				getWord $stats $GENESIS  			($current_word + 1)
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
				getWord $stats $EPROBES   			($current_word + 1)
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
				getWord $stats $CORP   				($current_word + 1)
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
		killtrigger prompt5
		killtrigger statlinetrig
		killtrigger getLine2
		stripText $CURRENT_PROMPT "<"
		stripText $CURRENT_PROMPT ">"
	return

:CN_Check
	send " cn"
	setTextLineTrigger 	CN1				:CN1			" ANSI graphics            - Off"
	setTextLineTrigger	CN2				:CN2			" Animation display        - On"
	setTextLineTrigger	CN9				:CN9			" Abort display on keys    - ALL KEYS"
	setTextLineTrigger	CNA				:CNA			" Message Display Mode     - Long"
	setTextLineTrigger	CNB				:CNB			" Screen Pauses            - Yes"
	setTextLineTrigger	CNC				:CNC			" Online Auto Flee         - On"
	setTextTrigger		CND				:CND			"Settings command (?=Help)"
	pause

	:CN1
		killTrigger CN1
		setVar $CN1 TRUE
		pause
	:CN2
		killTrigger CN2
		setVar $CN2 TRUE
		pause
	:CN9
		killTrigger CN9
		setVar $CN9 TRUE
		pause
	:CNA
		killTrigger CNA
		setVar $CNA TRUE
		pause
	:CNB
		killTrigger CNB
		setVar $CNB TRUE
		pause
	:CNC
		killTrigger CNC
		setVar $CNC TRUE
		pause
	:CND
		killAllTriggers
		setVar $str ""
		if ($CN1)
			setVar $str ($str & "1")
		end
		if ($CN2)
			setVar $str ($str & "2")
		end
		if ($CN9)
			setVar $str ($str & "9")
		end
		if ($CNA)
			setVar $str ($str & "A")
		end
		if ($CNB)
			setVar $str ($str & "B")
		end
		if ($CNC)
			setVar $str ($str & "C")
		end

	send $str & " q q "
	return
