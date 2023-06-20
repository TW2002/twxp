    #=--------                                                                       -------=#
     #=------------------------------   DocMe w/Auto Return  ------------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	March 1, 2007  -  Version 1.0
	#		Author		:	LoneStar
	#		TWX			:	Should Work with TWX 2.03, 2.04b, and 2.04 Final
	#		Description	:	Start  From  Command/Planet  Prompts.  Will  Twarp  to  Dock,  use an
	#						Adjacent  Sector  if  Alignment's  Below 1,000. Once Docked, pressing
	#						the '<' (Less-than), key will auto return to starting sector. Lifting
	#						off  from  Dock  will  disengage  auto  return  and  halt  he Script.
	#		Credits		:	Mind Dagger's :quikstats Routine (improved version of Singularity's)
	reqRecording
	setVar	$TagLine		"LoneStar's DocMe v1.0"
	setVar	$TagLineB 		"DocMe"
	setVar	$Planet			0
	setVar	$Start_sector	0
	setVar	$Burst			""

	if ((STARDOCK = 0) OR (STARDOCK = ""))
		Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - StarDock Not Known Or Hasn't Been Visited.**"
		halt
	end
	send " * "
	gosub :quikstats
	
	setVar $Start_Sector $CURRENT_SECTOR

	setTextLineTrigger DoneBurst			:DoneBurst		"Are you sure you want to jettison all cargo?"
	setTextLineTrigger PlanetNumber		:PlanetNumber	"Planet #"

	if ($CURRENT_PROMPT = "Citadel")
		setVar $Burst ($Burst & "QDT N T 1* C ")
	elseif ($CURRENT_PROMPT = "Command")
		setVar $Burst ($Burst & " ** ")
	elseif ($CURRENT_PROMPT = "Computer")
		setVar $Burst ($Burst & " Q ** ")
	elseif ($CURRENT_PROMPT = "Planet")
		setVar $Burst ($Burst & "DT N T 1* Q * ")
	else
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - Must Start From The Citadel or Command Prompt**")
		halt
	end
	send $Burst & " C V O* Y N " & STARDOCK & "* V 0* Y N " & $Start_Sector & "* U Y Q Q Q Z N *  J * "
	pause

    :PlanetNumber
    	killTrigger PlanetNumber
		getWord CURRENTLINE $Planet 2
		stripText $Planet "#"
		isNumber $tst $Planet
		if ($tst = 0)
			setVar $Planet 0
		end
		pause
    :DoneBurst
    	killAllTriggers

	gosub :quikstats

	if ($TURNS = 0)
		gosub :TurnsDetect
		if ($UNLIM = FALSE)
			gosub :Land_Enter_Citadel
			Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - You Have Zero Turns.**")
			halt
		end
	elseif ($TURNS < 10)
		gosub :Land_Enter_Citadel
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - You have fewer than 10 Turns.**")
		halt
	end

	getDistance $Dist_To $Start_Sector STARDOCK
	if ($Dist_To = "-1")
		send "^F" & $Start_Sector & "*" & STARDOCK & "**q"
		waiton ": ENDINTERROG"
		getDistance $Dist_To $Start_Sector STARDOCK
		if ($Dist_To = "-1")
     		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - Unable To Determin Distance TO StarDock**")
			halt
		end
	end
	getDistance $Dist_Fr STARDOCK $Start_Sector
	if ($Dist_Fr = "-1")
		send "^F" & STARDOCK & "*" & $Start_Sector & "**q"
		waiton ": ENDINTERROG"
		getDistance $Dist_Fr $Start_Sector STARDOCK
		if ($Dist_Fr = "-1")
     		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - Unable To Determin Distance FROM StarDock**")
			halt
		end
	end

	setVar $Gas_Required (($Dist_To + $Dist_Fr) * 3)

	if ($ORE_HOLDS < $Gas_Required)
		gosub :Land_Enter_Citadel
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - " & $Gas_Required & " Units Of Ore Required, Ship Has Too Few Holds.**")
		halt
	end

	gosub	:To_Dock_OR_Not_To_Dock

    if ($OTay_2_Dock = FALSE)
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - Stardock Appears To Have Been Blown-Up.**")
		halt
	end

	if ($ALIGNMENT < 1000)
		gosub :FindJumpSector
		if ($RED_adj = 0)
			gosub :Land_Enter_Citadel
			Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - Unable To Find Jump Sector**")
			if ($LANDED = FALSE)
				Echo (ANSI_14 & $TagLineB & ANSI_15 & " - Unable To Reland. Planet #"&$planet&", not present.**")
				halt
			end
		else
			send ("Y  *  M" & STARDOCK & "*  P  S")
		end
	else
		send (" M" & STARDOCK & "* Y Y P S")
	end
	:Ack_ReLanding
	SetTextLineTrigger	Limpet_Found	:Limpet_Found	"A port official runs up to you as you dock and informs you that"
	SetTextTrigger			On_Dock			:On_Dock		"<StarDock> Where to?"
	Pause
	:Limpet_Found
		killTrigger Limpet_Found
		send " Y"
		pause
	:On_Dock
		killAllTriggers
		setTextTrigger		DeActivate		:DeActivate "Command [TL="
		setTextOutTrigger	Take_Me_Home	:Take_Me_Home "<"
		Echo ("***" & ANSI_14 & $TagLineB & ANSI_15 & " - On Dock. Press "&ANSI_14&"<"&ANSI_15&" From The '<StarDock>' Prompt, To Activate Auto Return*")
		send "/"
		pause
		:DeActivate
			killAllTriggers
			Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - Auto Return Return DeActivated**")
			halt
		:Take_Me_Home
			killAllTriggers
			gosub :quikstats
			if ($CURRENT_PROMPT <> "<StarDock>")
				Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - Auto Return Must Be Activated From StarDock Prompt.*")
				goto :On_Dock
			end

			if ($PHOTONS <> 0)
				if (SECTOR.NAVHAZ[$Start_Sector] <> 0)
					setVar $Detected_Haz TRUE
				end
				if (SECTOR.MINES.QUANTITY[$Start_Sector] <> 0)
					if ((SECTOR.MINES.OWNER[$Start_Sector] <> "belong to your Corp") AND (SECTOR.MINES.OWNER[$Start_Sector] <> "yours"))
						setVar $Detected_Armids TRUE
					end
				end

				if (($Detected_Haz) OR ($Detected_Armids))
					setVar $s "Ship Has Photons: "
					if ($Detected_Haz)
						setVar $s ($s & "Nav Haz")
					end
					if ($Detected_Armids)
						getWordPos $s $pos "Nav Haz"
						if ($pos <> 0)
							setvar $s ($s & " and ")
						end
						setVar $s ($s & "Enemy Mines")
					end
					setVar $s ($s & " has been detected in Return Sector. Risk Self Torping (Y/N)?")
					Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & $s)
					:Avoid_Self_Torp
					getConsoleInput $selection SINGLEKEY
					uppercase $selection
					if ($selection = "Y")
						goto :OverRide
					elseif ($selection = "N")
						halt
					else
						goto :Avoid_Self_Torp
					end
				end
			end

			:OverRide

		    setTextTrigger twarp_lock       :twarp_lock 	"All Systems Ready, shall we engage"
		    setTextTrigger no_twrp_lock     :no_twarp_lock	"Do you want to make this jump blind"
			send ("Q  M" & $Start_Sector & "* Y")
			pause
			:no_twarp_lock
				killAllTriggers
				send (" Q  Q  Q  Z  N  *  P  S")
				Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - Unable To Return Landed On StarDock!!**")
				goto :Ack_ReLanding
				halt
            :twarp_lock
            	killAllTriggers
            	if ($planet <> 0)
            		send "Y * "
	            	gosub :Land_Enter_Citadel
	            	if ($LANDED = FALSE)
	            		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - Unable To Reland Planet #"&$planet&", not Present")
	            	end
            	else
	            	send "Y * "
	            	waiton "<Re-Display>"
	            end

		Echo ("**" & ANSI_14 & $TagLine & ANSI_15 & " - Hope You've Enjoyed Your Flight**")
		halt

    #=--------                                                                       -------=#
     #=------------------------------      SUB ROUTINES      ------------------------------=#
    #=--------                                                                       -------=#
    #
    #		:Check_CN               Enters Computer, Checks CN 1, 2, 9, A, B, C, and D
    #								then Exits Computer
    #		:FindJumpSector			Attempts a Pre-Lock On a Sector Adj StarDock. If A
    #								pre-lock is established: $RED_adj <> 0
	#		:quikstats				Mind Dagger's version of Singularity's quikstat routine
	#		:To_Dock_OR_Not_To_Dock Returns $OTay_2_Dock = TRUE if Dock is detected.
	#		:TurnsDetect			Tries to determine if playing in an Unlim. $UNLIM = TRUE
	#		:Land_Enter_Citadel		Attempts landing if $planet <> 0,  $LANDED = TRUE if success
	#
:Check_CN
	send " CN"
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

	send ($str & " q q ")
	waitfor "Computer command [TL="
	return

:FindJumpSector
	setVar $i 1
	setVar $RED_adj 0

	while (SECTOR.WARPSIN[STARDOCK][$i] > 0)
		setVar $RED_adj SECTOR.WARPSIN[STARDOCK][$i]
		send ("m " & $RED_adj & "* y")
		setTextTrigger TwarpBlind 			:TwarpBlind "Do you want to make this jump blind? "
		setTextTrigger TwarpLocked			:TwarpLocked "All Systems Ready, shall we engage? "
		setTextLineTrigger TwarpVoided		:TwarpVoided "Danger Warning Overridden"
		setTextLineTrigger TwarpAdj			:TwarpAdj "<Set NavPoint>"
		pause
		:TwarpAdj
		killAllTriggers
		send " * "
		return

		:TwarpVoided
		killAllTriggers
		send " N N "
		goto :TryingNextAdj

		:TwarpLocked
		killAllTriggers
		return

		:TwarpBlind
		killAllTriggers
		send " N "

		:TryingNextAdj
    	add $i 1
	end

	:NoAdjsFound
		setVar $RED_adj 0
		return

	:SectorLocked
		return
:quikstats
	setVar $CURRENT_PROMPT 		"Undefined"
	killtrigger 		noprompt
	killtrigger 		prompt1
	killtrigger 		prompt2
	killtrigger 		prompt3
	killtrigger 		prompt4
	killtrigger 		statlinetrig
	killtrigger 		getLine2
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
	:statStart
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
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
		killtrigger statlinetrig
		killtrigger getLine2
	return

:To_Dock_OR_Not_To_Dock
	setVar $OTay_2_Dock FALSE

	send " C R " & STARDOCK & "*Q "
	setTextLineTrigger	itsalive 	:itsalive		"Items     Status  Trading % of max OnBoard"
	setTextLineTrigger	nosoupforme	:nosoupforme	"I have no information about a port in that sector"
	setDelayTrigger		WeHaveAProb	:WeHaveAProb	3000
	pause
	:WeHaveAProb
		killAllTriggers
		setVar $OTay_2_Dock FALSE
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " - Unexpected Problem. Halting.")
		halt
		return
	:nosoupforme
		killAllTriggers
		setVar $OTay_2_Dock FALSE
		waitfor "Command [TL"
		return
	:itsalive
		killAllTriggers
		setVar $OTay_2_Dock TRUE
		waitfor "Command [TL"
		return

:TurnsDetect
	send "  M0*"
	setTextLineTrigger TurnsDetect_NoTurns1		:TurnsDetect_NoTurns "You don't have enough turns left."
	setTextLineTrigger TurnsDetect_NoTurns2		:TurnsDetect_NoTurns "Engines will be back online within"
	setTextLineTrigger TurnsDetect_NoTurns3		:TurnsDetect_NoTurns "An Interdictor Generator in this sector holds you fast!"
	setTextLineTrigger TurnsDetect_GotTurns		:TurnsDetect_GotTurns "Warps to Sector(s) : "
	pause
	:TurnsDetect_NoTurns
	killAllTriggers
	setVar $UNLIM FALSE
	waitfor "(?="
	return
    :TurnsDetect_GotTurns
    killAllTriggers
	setVar $UNLIM TRUE
	waitfor "(?="
	return

:Land_Enter_Citadel
	setVar $LANDED FALSE
	if ($planet <> 0)
		setTextLineTrigger	NotLanded	:NotLanded		"Are you sure you want to jettison all cargo?"
		setTextLineTrigger	Landed1		:Landed			"<Build Citadel>"
		setTextLineTrigger	Landed2		:Landed			"<Enter Citadel>"
		send (" L Z" & #8 & $planet & "*  *  J  C  *  ")
		pause
		:NotLanded
			killAllTriggers
			return
		:Landed
			killAllTriggers
			setVar $LANDED TRUE
	end
	return