	#	Version 2.50
	#	Dec 21 06  -	fixed haz warning when Max'n everything --increasing self-torp avoidance
	#	Dec 21 06  -	fixed sector Fig detection.
	#	Dec 24 06  -	Made script Red Friendly and added some Cost menu outputing
	#	Jan 01 07  -    added Armid mine detection for a found Red Jump sector.
	#	Jan 09 07  -    Add purchased Ship Naming, fine tuned a few things.. and added handling for
	#                   reaching game Number of Ships maximum.
	#	Jan 17 07  -    Added 500ms delay to allow for DBase commit course plot -latency
	#                   Removed errant space that brought up Mugging prompt at Dock upon 1st visit.
	#
	#
    reqRecording
    send "*"
    getword CURRENTLINE $PromptCheck 1
	if ($PromptCheck = "Command")
		getWordPos CURRENTANSILINE $pos #27
		if ($pos = 0)
			send " c n 1 q q "
			waitfor "Command [TL="
		end
	elseif ($PromptCheck = "Citadel")
		getWordPos CURRENTANSILINE $pos #27
		if ($pos = 0)
			send " c n 1 q q "
			waitfor "Citadel command"
		end
	elseif ($PromptCheck = "Planet")

		setVar $Theres_Citadel FALSE
		setTextTrigger THERES_NO_CIT :THERES_NO_CIT "Planet command (?=help)"
		setTextLineTrigger THERE_CIT :THERES_CIT "Planet has a level "
		pause
		:THERES_CIT
			setVar $Theres_Citadel TRUE
			pause
		:THERES_NO_CIT
			killAllTriggers

		if ($Theres_Citadel)
			send " C "
		else
			send " Q "
		end
		getWordPos CURRENTANSILINE $pos #27
		if ($pos = 0)
			send " c n 1 q q "
			if ($Theres_Citadel)
				waitfor "Citadel command"
			else
				waitfor "Command "
			end
		end
	end

    gosub :quikstats

    setVar $CURENT_VERSION "3.3"
    setVar $TagLineB "LSDv" & $CURENT_VERSION
	setVar $location $CURRENT_PROMPT
    setVar $Starting_CREDITS $CREDITS
    setVar $Starting_TURNS $TURNS
    setVar $START_SECTOR $CURRENT_SECTOR

	setVar $ShipData_Valid		FALSE
	setVar $Ships_Names			"][LSD]["
	setVar $Ships_File 			"LSD_" & GAMENAME & ".ships"
	setVar $ShipListMax			50
	setArray $ShipList			$ShipListMax 3
	setVar $SpeacalMSG 			""
	setVar $Runs2Dock 			0

	if (($location = "Citadel") OR ($location = "Command"))
		gosub :CN1_AND_CN9_CHECKING
	else
		echo ANSI_12 "**NEED TO BE AT CITADEL OR COMMAND PROMPT!!**"
		halt
	end

    gosub :GoodToGo
	gosub :LoadShipData

	if ($location = "Citadel")
		send " C  V  0*  Y  N" & $START_SECTOR & "* V  0*  Y  N" & STARDOCK & "*  U  Y  Q  Q  DS  N  L  1* S  N  L  2*  S  N  L  3*  T  N  L  2*  T  N  L  3*  T  N  T  1*  *  Q *  w  n  * "
		setTextLineTrigger pnum :pnum "Planet #"
		pause
		:pnum
		killAllTriggers
		getWord CURRENTLINE $planet 2
		stripText $planet "#"
	elseif ($location = "Command")
		send " C  V  0*  Y  N" & $START_SECTOR & "* V  0*  Y  N" & STARDOCK & "* U Y Q *  w  n  * "
	end

	gosub :quikstats

	setVar $Start_Creds $CREDITS
	setVar $Start_Exp $EXPERIENCE
	setVar $Start_Holds $TOTAL_HOLDS

	waitfor "(?="
	if ($TURNS = 0)
		gosub :TurnsDetect
		if ($UNLIM = FALSE)
			Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - You do not have enough Turns!**"
			setVar $START_TRUNS $TURNS
			halt
		end
	end

	if ($TOTAL_HOLDS <> $ORE_HOLDS)
		Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Please Restart with Full Ore in Holds!!**"
		halt
	end

	gosub :GetClass0Costs
	gosub :GetSetPrices

:start
	setVar $_Atomics ""
	setVar $_Beacons ""
	setVar $_Corbo ""
	setVar $_Cloak ""
	setVar $_Probe ""
	setVar $_PScan ""
	setVar $_Limps ""
	setVar $_Mines ""
	setVar $_Photon ""
	setVar $_LRScan ""
	setVar $_Disrupt ""
	setVar $_GenTorp ""
	setVar $_T2Twarp ""
	setVar $_Buffers ""
	setVar $_Holds ""
	setVar $_Figs ""
	setVar $_Shields ""
	setVar $_Trickster ""
	setVar $NumberOfShip ""
	setVar $_TOTAL 0

	#Safety OverRide - Indicates PLayers has been warned about HAZ and Photons on ship when selecting to Buy Photons
	#				   is used when eXecuted and Haz is present but User is not buying Photons but has some on board.
	setVar $SafetyOverDide FALSE
	setVar $figcnt SECTOR.FIGS.QUANTITY[$START_SECTOR]
	setVar $figowner SECTOR.FIGS.OWNER[$START_SECTOR]
	if (($figcnt = 0) OR (($figOwner <> "belong to your Corp") AND ($figOwner <> "yours")))
		Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Fig Required In Current Sector**"
		halt
	end

:TopOfMenu
	echo #27 & "[2J"
:TopOfMenu_NoClear
	gosub :SetMenuEchos
	echo "***"
	echo "   " & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-"
	echo ANSI_14 & "*        LoneStar's StarDock Shopper"
	echo ANSI_15 & "*          Emporium Daily Specials"
	echo ANSI_8 & "*                Version " & $CURENT_VERSION & "*"
	echo "   " & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-"
	echo "*"
	setVar $PadThisCost $LSD_ATOMICCOST
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "A" & ANSI_5 & ">" & ANSI_9 & " Atomic Detonators      " & $PadThisCost & ANSI_14 & ": " & $Echo_Atomics
	setVar $PadThisCost $LSD_BEACON
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "B" & ANSI_5 & ">" & ANSI_9 & " Marker Beacons         " & $PadThisCost & ANSI_14 & ": " & $Echo_Beacons
	setVar $PadThisCost $LSD_CORBOCOST
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "C" & ANSI_5 & ">" & ANSI_9 & " Corbomite Devices      " & $PadThisCost & ANSI_14 & ": " & $Echo_Corbo
	setVar $PadThisCost $LSD_CLOAKCOST
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "D" & ANSI_5 & ">" & ANSI_9 & " Cloaking Devices       " & $PadThisCost & ANSI_14 & ": " & $Echo_Cloak
	setVar $PadThisCost $LSD_EPROBE
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "E" & ANSI_5 & ">" & ANSI_9 & " SubSpace Ether Probes  " & $PadThisCost & ANSI_14 & ": " & $Echo_Probe
	setVar $PadThisCost $LSD_PSCAN
	gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "F" & ANSI_5 & ">" & ANSI_9 & " Planet Scanners        " & $PadThisCost & ANSI_14 & ": " & $Echo_PScan
	setVar $PadThisCost $LSD_LIMPCOST
	gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "L" & ANSI_5 & ">" & ANSI_9 & " Limpet Tracking Mines  " & $PadThisCost & ANSI_14 & ": " & $Echo_Limps
	setVar $PadThisCost $LSD_ARMIDCOST
	gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "M" & ANSI_5 & ">" & ANSI_9 & " Space Mines            " & $PadThisCost & ANSI_14 & ": " & $Echo_Mines
	setVar $PadThisCost $LSD_PHOTONCOST
	gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "P" & ANSI_5 & ">" & ANSI_9 & " Photon Missiles        " & $PadThisCost & ANSI_14 & ": " & $Echo_Photon
	setVar $PadThisCost $LSD_HOLOCOST
	gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "R" & ANSI_5 & ">" & ANSI_9 & " Long Range Scanners    " & $PadThisCost & ANSI_14 & ": " & $Echo_LRScan
	setVar $PadThisCost $LSD_DISRUPTCOST
	gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "S" & ANSI_5 & ">" & ANSI_9 & " Mine Disruptors        " & $PadThisCost & ANSI_14 & ": " & $Echo_Disrupt
	setVar $PadThisCost $LSD_GENCOST
	gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "T" & ANSI_5 & ">" & ANSI_9 & " Genesis Torpedoes      " & $PadThisCost & ANSI_14 & ": " & $Echo_GenTorp
	setVar $PadThisCost $LSD_TWARPIICOST
	gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "W" & ANSI_5 & ">" & ANSI_9 & " T2 TransWarp Drives    " & $PadThisCost & ANSI_14 & ": " & $Echo_T2Twarp
	setVar $PadThisCost $LSD_HoldCost
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "1" & ANSI_5 & ">" & ANSI_9 & " Holds                  " & $PadThisCost & ANSI_14 & ": " & $Echo_Holds
	setVar $PadThisCost $LSD_FighterCost
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "2" & ANSI_5 & ">" & ANSI_9 & " Figs                   " & $PadThisCost & ANSI_14 & ": " & $Echo_Figs
	setVar $PadThisCost $LSD_Shield
	gosub :PadItemCosts
	echo ANSI_5 & "*    <" & ANSI_2 & "3" & ANSI_5 & ">" & ANSI_9 & " Shields                " & $PadThisCost & ANSI_14 & ": " & $Echo_Shields

	if ($_TOTAL <> 0)
		setVar $CashAmount $_TOTAL
		gosub :CommaSize
		if ($_TOTAL <= $CREDITS)
			echo "*                                 " & ANSI_15 & " TOTAL (" & ANSI_7 & "$" & $CashAmount & ANSI_15 & ")"
		else
			setVar $_TOTAL_DIFF ($_TOTAL - $CREDITS)

			echo "*                                 " & ANSI_15 & " TOTAL " & ANSI_12 & "(" & "$" & $CashAmount & ")  Short $"
			setVar $CashAmount $_TOTAL_DIFF
			gosub :CommaSize
			echo $CashAmount
		end
		setVar $_TOTAL 0
	else
		echo "*"
	end
	if ($location = "Citadel")
		if ($TWARP_TYPE = 2)
			if ($ShipData_Valid)
				echo ANSI_5 & "*    <" & ANSI_8 & "G" & ANSI_5 & ">" & ANSI_5 & " Buy Ship(s): " & ANSI_8 & $Echo_Trickster
			else
				echo ANSI_5 & "*    <" & ANSI_8 & "G" & ANSI_5 & ">" & ANSI_5 & " Buy Ship(s): " & ANSI_8 & "Script Must Run Once To Get Prices"
				setVar $_Trickster ""
			end
		else
			echo ANSI_5 & "*    <" & ANSI_8 & "G" & ANSI_5 & ">" & ANSI_7 & " Buy & Trick-Out Ship(s)     " & ANSI_8 & "Type Twarp 2 Needed"
		end
	else
		echo ANSI_5 & "*    <" & ANSI_8 & "G" & ANSI_5 & ">" & ANSI_5 & " Buy Ship(s): " & ANSI_8 & "Must Start Script From Citadel"
		setVar $_Trickster ""
	end
	if ($TWARP_TYPE = 2)
		if ($_Trickster = "")
			echo ANSI_5 & "*    <" & ANSI_8 & "Y" & ANSI_5 & ">" & ANSI_5 & " Tow & Outfit Another Ship   "  & ANSI_8
			if ($Tow > 0)
				echo ANSI_15 & "#" & $Tow
			end
		else
			setVar $Tow 0
		end
	else
		echo ANSI_5 & "*    <" & ANSI_7 & "Y" & ANSI_5 & ">" & ANSI_7 & " Tow & Outfit Another Ship " & ANSI_8 & "Type Twarp 2 Needed"
	end

	echo ANSI_5 & "*    <" & ANSI_8 & "V" & ANSI_5 & ">" & ANSI_5 & " Buy Buffer Ships: " & ANSI_15 & $_Buffers
	echo ANSI_5 & "*    <" & ANSI_8 & "Z" & ANSI_5 & ">" & ANSI_5 & " Max Out Ship On Everything!"
	echo ANSI_9 & "*        Cash On Hand " & ANSI_14 & ": "
	setVar $CashAmount $CREDITS
	gosub :CommaSize
	echo ANSI_7 & "$" & $CashAmount
	echo "**        " & ANSI_14 & "X" & ANSI_15 & " - Execute    " & ANSI_14 & "Q" & ANSI_15 & " - Quit**"
	getConsoleInput $selection SINGLEKEY
	upperCase $selection
		if ($selection = "Q")
			if ($location = "Citadel")
				send " L Z" & #8 & $planet & "*  J  C  *  "
				waitfor "(?="
				waitfor "(?="
			end
			echo "**" & ANSI_12 "  Script Halted" & ANSI_15 & "**"
			send " * "
			halt
		elseif ($selection = "A")
		#-------------------------------------------- Buy ATOMICS
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Atomics To Buy (M for Maximum)?"
		uppercase $selection
		if ($selection = "M")
			setVar $_Atomics "Max"
		else
			isNumber $tst $selection
			if ($tst <> 0)
				if ($selection = 0)
					setVar $_Atomics ""
				elseif ($selection > 100)
					setVar $_Atomics 100
				else
					setVar $_Atomics $selection
				end
			end
		end
	elseif ($selection = "B")
		#-------------------------------------------- Buy BEACONS
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Marker Beacons To Buy (M for Maximum)?"
		uppercase $selection
		if ($selection = "M")
			setVar $_Beacons "Max"
		else
			isNumber $tst $selection
			if ($tst <> 0)
				if ($selection = 0)
					setVar $_Beacons ""
				elseif ($selection > 100)
					setVar $_Beacons 100
				else
					setVar $_Beacons $selection
				end
			end
		end
	elseif ($selection = "C")
		#-------------------------------------------- Buy CORBO
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Coromite Devices To Buy (M for Maximum)?"
		uppercase $selection
		if ($selection = "M")
			setVar $_Corbo "Max"
		else
			isNumber $tst $selection
			if ($tst <> 0)
				if ($selection = 0)
					setVar $_Corbo ""
				elseif ($selection > 100000)
					setVar $_Corbo 100000
				else
					setVar $_Corbo $selection
				end
			end
		end
	elseif ($selection = "D")
		#-------------------------------------------- Buy CLOAKS
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Cloaking Devices To Buy (M for Maximum)?"
		uppercase $selection
		if ($selection = "M")
			setVar $_Cloak "Max"
		else
			isNumber $tst $selection
			if ($tst <> 0)
				if ($selection = 0)
					setVar $_Cloak ""
				elseif ($selection > 1000)
					setVar $_Cloak 1000
				else
					setVar $_Cloak $selection
				end
			end
		end
	elseif ($selection = "E")
		#-------------------------------------------- Buy PROBES
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*SubSpace Either Probe Devices To Buy (M for Maximum)?"
		uppercase $selection
		if ($selection = "M")
			setVar $_Probe "Max"
		else
			isNumber $tst $selection
			if ($tst <> 0)
				if ($selection = 0)
					setVar $_Probe ""
				elseif ($selection > 1000)
					setVar $_Probe 1000
				else
					setVar $_Probe $selection
				end
			end
		end
	elseif ($selection = "F")
		#-------------------------------------------- Buy PSCANNER
		Echo #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Install Planet Scanner (Y/N)?                         *"
		:Probe_query
		getConsoleInput $selection SINGLEKEY
		uppercase $selection
		if ($selection = "Y")
			setVar $_PScan "Yes"
		elseif ($selection = "N")
			setVar $_PScan ""
		else
			goto :Probe_query
		end
	elseif ($selection = "L")
		#-------------------------------------------- Buy LIMPS
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Limpet Tracking Devices To Buy (M for Maximum)?"
		uppercase $selection
		if ($selection = "M")
			setVar $_Limps "Max"
		else
			isNumber $tst $selection
			if ($tst <> 0)
				if ($selection = 0)
					setVar $_Limps ""
				elseif ($selection > 1000)
					setVar $_Limps 1000
				else
					setVar $_Limps $selection
				end
			end
		end
	elseif ($selection = "M")
		#-------------------------------------------- Buy ARMIDS
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Armid Mines To Buy (M for Maximum)?"
		uppercase $selection
		if ($selection = "M")
			setVar $_Mines "Max"
		else
			isNumber $tst $selection
			if ($tst <> 0)
				if ($selection = 0)
					setVar $_Mines ""
				elseif ($selection > 1000)
					setVar $_Mines 1000
				else
					setVar $_Mines $selection
				end
			end
		end
	elseif ($selection = "P")
		#-------------------------------------------- Buy PHOTONS
		if (SECTOR.NAVHAZ[$START_SECTOR] > 0)
			:scuzemewhatwasthat
			echo ANSI_14 & #27 & "[1A" & #27 & "[2K" & "*Nav Haz Detected in Sector " & ANSI_15 & "- Buy Photons (Y/N)?                *"
			getconsoleInput $selection SINGLEKEY
			uppercase $selection
			if ($selection = "N")
				setVar $SafetyOverDide FALSE
				setVar $_Photon ""
				goto :TopOfMenu
			elseif ($selection = "Y")
				setVar $SafetyOverDide TRUE
				goto :buyphotonenthoughthereshaz
			else
				echo #27 & "[2K" & #27 & "[1A"
				goto :scuzemewhatwasthat
			end
		end
		:buyphotonenthoughthereshaz
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Photon Devices To Buy (M for Maximum)?"
		uppercase $selection
		if ($selection = "M")
			setVar $_Photon "Max"
		else
			isNumber $tst $selection
			if ($tst <> 0)
				if ($selection = 0)
					setVar $_Photon ""
				elseif ($selection > 1000)
					setVar $_Photon 1000
				else
					setVar $_Photon $selection
				end
			end
		end
	elseif ($selection = "R")
		#-------------------------------------------- Buy HOLO
		echo ANSI_15 & #27 & "[1A" & #27 & "[K" & "*Holo Scanner (Y/N)?:                                  *"
		:Scan_query
		getConsoleInput $selection SINGLEKEY
		uppercase $selection
		if ($selection = "Y")
			setVar $_LRScan "Yes"
		#elseif ($selection = "D")
		#	setVar $_LRScan "Density"
		elseif ($selection = "N")
			setVar $_LRScan ""
		else
			goto :Scan_query
		end
	elseif ($selection = "S")
		#-------------------------------------------- Buy DISRUPTORS
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Mine Disruptors To Buy (M for Maximum)?"
		uppercase $selection
		if ($selection = "M")
			setVar $_Disrupt "Max"
		else
			isNumber $tst $selection
			if ($tst <> 0)
				if ($selection = 0)
					setVar $_Disrupt ""
				elseif ($selection > 1000)
					setVar $_Disrupt 1000
				else
					setVar $_Disrupt $selection
				end
			end
		end
	elseif ($selection = "T")
		#-------------------------------------------- Buy GEN TORPS
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Genesis Torpedoes To Buy (M for Maximum)?"
		uppercase $selection
		if ($selection = "M")
			setVar $_GenTorp "Max"
		else
			isNumber $tst $selection
			if ($tst <> 0)
				if ($selection = 0)
					setVar $_GenTorp ""
				elseif ($selection > 1000)
					setVar $_GenTorp 1000
				else
					setVar $_GenTorp $selection
				end
			end
		end
	elseif ($selection = "W")
		#-------------------------------------------- Buy TWARP
		echo ANSI_15 & #27 & "[1A" & #27 & "[K" & "*Install Trans Warp 2 Drive (Y/N)?:                               *"
		:Twarp_query
		getConsoleInput $selection SINGLEKEY
		uppercase $selection
		if ($selection = "Y")
			setVar $_T2Twarp "Yes"
		elseif ($selection = "N")
			setVar $_T2Twarp ""
		else
			goto :Twarp_query
		end
	elseif ($Selection = "Y")
		#-------------------------------------------- Tow a Ship
		if ($TWARP_TYPE = 2)
			getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Tow and Outfit a Ship (0 to Cancel)?"
			isNumber $tst $selection
			if ($tst <> 0)
				if (($selection < 0) or ($selection > 2000))
					setVar $Tow 0
				else
					setVar $Tow $selection
				end
			else
				setVar $Tow 0
			end
		end
	elseif ($selection = "V")
		#-------------------------------------------- Buy BUFFER SHIPS
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Number Of Buffer Ships To Buy (0 to Cancel)?"
		isNumber $tst $selection
		if ($tst <> 0)
			if ($selection = 0)
				setVar $_Buffers ""
			elseif ($selection > 20)
				setVar $_Buffers 20
			else
				setVar $_Buffers $selection
			end
		end
	elseif ($selection = "Z")
		#-------------------------------------------- Buy Max ship on everything
		if (SECTOR.NAVHAZ[$START_SECTOR] > 0)
			:scuzemewhatwasthat2
			echo ANSI_10 & #27 & "[1A" & #27 & "[2K" & "*Nav Haz Detected in Sector " & ANSI_15 & " - Buy Photons (Y/N)?       *"
			getconsoleInput $selection SINGLEKEY
			uppercase $selection
			if ($selection = "N")
				setVar $_Photon ""
				goto :buyphotonenthoughthereshaz2
			elseif ($selection = "Y")
				setVar $SafetyOverDide TRUE
				setVar $_Photon "Max"
				goto :buyphotonenthoughthereshaz2
			else
				echo #27 & "[2K" & #27 & "[1A"
				goto :scuzemewhatwasthat2
			end
		else
			setVar $_Photon "Max"
		end
		:buyphotonenthoughthereshaz2
		setVar $_TOTAL 0
		setVar $_Atomics "Max"
		setVar $_Beacons "Max"
		setVar $_Corbo "Max"
		setVar $_Cloak "Max"
		setVar $_Probe "Max"
		setVar $_PScan "Yes"
		setVar $_Limps "Max"
		setVar $_Mines "Max"
		setVar $_LRScan "Yes"
		setVar $_Disrupt "Max"
		setVar $_GenTorp "Max"
		setVar $_T2Twarp "Yes"
		setVar $_Holds "Max"
		setVar $_Figs "Max"
		setVar $_Shields "Max"
	elseif ($selection = "1")
		#-------------------------------------------- Buy HOLDS
		echo ANSI_15 & #27 & "[1A" & #27 & "[K" & "*   Cargo Holds to buy (M for Maximum)?:                         *"
		getConsoleInput $selection
		uppercase $selection
		if ($selection = "M")
			setVar $_Holds "Max"
		else
			isNumber $tst $selection
			if ($tst <> 0)
				if ($selection < 0)
					setVar $_Holds ""
				elseif ($selection = 0)
					setVar $_Holds ""
				else
					setVar $_Holds $selection
				end
			end
		end
	elseif ($selection = "2")
		#-------------------------------------------- Buy FIGS
		echo ANSI_15 & #27 & "[1A" & #27 & "[K" & "*   Fighters to buy (M for Maximum)?:                             *"
		getConsoleInput $selection
		uppercase $selection
		if ($selection = "M")
			setVar $_Figs "Max"
		else
			isNumber $tst $selection
			if ($tst <> 0)
				if ($selection < 0)
					setVar $_Figs ""
				elseif ($selection = 0)
					setVar $_Figs ""
				else
					setVar $_Figs $selection
				end
			end
		end
	elseif ($selection = "3")
		#-------------------------------------------- Buy SHIELDS
		echo ANSI_15 & #27 & "[1A" & #27 & "[K" & "*   Shields to buy (M for Maximum)?:                              *"
		getConsoleInput $selection
		uppercase $selection
		if ($selection = "M")
			setVar $_Shields "Max"
		else
			isNumber $tst $selection
			if ($tst <> 0)
				if ($selection < 0)
					setVar $_Shields ""
				elseif ($selection = 0)
					setVar $_Shields ""
				else
					setVar $_Shields $selection
				end
			end
		end
	elseif (($selection = "G") AND ($ShipData_Valid) AND ($location = "Citadel"))
		gosub :DisplayMenu
	elseif ($selection = "X")
	    #=--------                                                                       -------=#
	     #=------------------------------       Main Event       ------------------------------=#
	    #=--------                                                                       -------=#
		setVar $RUN_ONCE TRUE

		if (($_Atomics = "") AND ($_Beacons = "") AND ($_Corbo = "") AND ($_Cloak = "") AND ($_Probe = "") AND ($_PScan = "") AND 	($_Limps = "") AND ($_Mines = "") AND ($_Photon = "") AND ($_LRScan = "") AND ($_Disrupt = "") AND 	($_GenTorp = "") AND ($_T2Twarp = "") AND ($_Buffers = "") AND ($_Holds = "") AND ($_Figs = "") AND ($_Shields = ""))
			if ($_Trickster = "")
				Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Nothing Was Selected From The Menu**"
				goto :TopOfMenu
			else

			end
		end

		if ($_Trickster <> "")
			Echo "**"
			:scuzemewhatwasthat33
			Echo #27 & "[1A" & #27 & "[2K"
			Echo "**" & ANSI_14 & " Note" & ANSI_7 " - You have selected to purchase a number of  Ships as  well as some"
			Echo "*" & ANSI_7 & "        items from the Emporium.  This Script  will  endeavor to purchase"
			Echo "*" & ANSI_7 & "        specified number of Ships as well as  Outfit  all purchased ships"
			Echo "*" & ANSI_7 & "        with Items selected from the Emporium. The true total cost may be"
			Echo "*" & ANSI_7 & "        much higher than indicated."
			Echo "**" & ANSI_14 & "        Do you wish to proceed (" & ANSI_7 & "Y" & ANSI_15 & "/" & ANSI_7 & "N" & ANSI_14 & ")?*"
           	getconsoleInput $selection SINGLEKEY
           	uppercase $selection
           	if ($selection = "N")
				goto :TopOfMenu
			elseif ($selection = "Y")

			else
				echo #27 & "[2K" & #27 & "[1A"
				goto :scuzemewhatwasthat33
			end
		end

		if ((SECTOR.NAVHAZ[$START_SECTOR] > 0) AND ($PHOTONS <> 0) AND ($SafetyOverDide = 0))
			:scuzemewhatwasthat3
			echo ANSI_14 & #27 & "[1A" & #27 & "[2K" & "*Photons On Board & Nav Haz Detected in Sector " & ANSI_15 & "- Risk Self Torping (Y/N)?       *"
			getconsoleInput $selection SINGLEKEY
			uppercase $selection
			if ($selection = "N")
				if ($location = "Citadel")
					send " L Z" & #8 & $planet & "*  J  C  *  "
					waitfor "(?="
					waitfor "(?="
				end
				echo "**" & ANSI_12 "  Script Halted" & ANSI_15 & "**"
				send " * "
				halt
			elseif ($selection = "Y")

			else
				echo #27 & "[2K" & #27 & "[1A"
				goto :scuzemewhatwasthat3
			end
		end
	#=-------------------This is where we loop too if buying more than one ship
	:HERE_WE_GO_AGAIN
		setVar $CurrentShip $SHIP_NUMBER
		add $Runs2Dock 1

		if (($Tow > 0) AND ($_Trickster = ""))
			setVar $Pass ""
			gosub :GetPassWord
        	gosub :LockTow
        else
        	setVar $Tow 0
        	send " W N * "
		end

		if ($RUN_ONCE)
			# check adj's for Dock.. if present, then we don't need a jump sector.
			setVar $i 1
			setVar $WeAreAdjDock FALSE
			while ($i <= SECTOR.WARPCOUNT[$START_SECTOR])
				setVar $adj_start SECTOR.WARPS[$START_SECTOR][$i]
				if ($adj_start = STARDOCK)
					setVar $WeAreAdjDock TRUE
				end
				add $i 1
			end

			if (($ALIGNMENT < 1000) AND ($WeAreAdjDock = FALSE))
				setVar $RED_adj 0
				gosub :FindJumpSector
				if ($RED_adj <> 0)
					echo "**" & ANSI_14 & "Jump Sector Found" & ANSI_15 & " - Using Sector " & $RED_adj & "**"
				else
					waitfor "Command [TL="
					Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Cannot Find Jump Sector Adjacent Dock**"
					halt
				end
			end

			if ($ALIGNMENT > 1000)
				if ($WeAreAdjDock)
					send "^F" & STARDOCK & "*" & $START_SECTOR & "*Q/ "
				else
					send "^F" & $START_SECTOR & "*" & STARDOCK & "*F" & STARDOCK & "*" & $START_SECTOR & "*Q/ "
				end
			else
				if ($WeAreAdjDock)
					send "^F" & STARDOCK & "*" & $START_SECTOR & "*Q/ "
				else
					send "^F" & $START_SECTOR & "*" & $RED_adj & "*F" & STARDOCK & "*" & $START_SECTOR & "*Q/ "
				end
			end
			setTextLineTrigger noJoy :noJoy "*** Error - No route within"
			setTextTrigger cont :cont "(?="
			pause

			:noJoy
				killAllTriggers
				Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Cannot Find Path to StarDock!**"
				halt
	       	:cont
				killAllTriggers

				setDelayTrigger Latency_Delay		:Latency_Delay 500
				pause

				:Latency_Delay

	       		Echo "**" & ANSI_14 & "Please Stand By" & ANSI_15 & " - Calculating Distances...**"
				if (($ALIGNMENT >= 1000) OR ($WeAreAdjDock))
					getdistance $dist1 $START_SECTOR STARDOCK
				else
					getdistance $dist1 $START_SECTOR $RED_adj
				end

				if ($dist1 <= 0)
					Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Insufficient Warp Data Plotting Course to Dock**"
					halt
				end

				getdistance $dist2 STARDOCK $START_SECTOR
				if ($dist2 <= 0)
					Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Insufficient Warp Data Plotting Return Course From Dock**"
					halt
				end

				setVar $ore_req (($dist1 + $dist2) * 3)

				if ($Tow > 0)
					setVar $ore_req ($ore_req * 2)
				elseif ($_Trickster <> "")
					setVar $ore_req ($dist1 * 3)
					setVar $ore_req $ore_req + ($dist2 * 6)
				end

				if ($ORE_HOLDS < $ore_req)
					Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Not Enough ORE In Holds To Make Round Trip**"
					halt
				end

				if ($TWARP_TYPE = "No")
					Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Must Have Twarp 1 or 2**"
					halt
				end

				if ($UNLIM = 0)
					gosub :TurnsRequired
					if ($TurnsRequired > $TURNS)
						Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & "Not Enough Turns. " & ANSI_12 & $TurnsRequired & ANSI_15 & ", Required**"
						halt
					elseif ($TurnsRequired <= $TURNS)
						setVar $tmp ($TURNS - $TurnsRequired)
						if ($tmp <= 10)
							Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Proceeding Will Leave You with Fewer Than 10 Turns!**"
							halt
	    				end
	                end
				end
			end

			send " C R " & STARDOCK & "*Q "
			setTextLineTrigger itsalive :itsalive "Items     Status  Trading % of max OnBoard"
			setTextLineTrigger nosoupforme :nosoupforme "I have no information about a port in that sector"
			pause
			:nosoupforme
				killAllTriggers
				Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - StarDock appears to have been Blown Up!**"
				halt
			:itsalive
				killAllTriggers
				waitfor "(?="
				setVar $msg ""
				if (($ALIGNMENT >= 1000) AND ($WeAreAdjDock = FALSE))
					setVar $TwarpTo STARDOCK
					gosub :DoTwarp
				elseif (($WeAreAdjDock = FALSE) AND ($RED_adj <> 0))
					setVar $TwarpTo $RED_adj
					gosub :DoTwarp
				else
					send " m " & STARDOCK & "*  *  P  S"
				end
				if ($msg = "")
						setTextTrigger limp :have_limp "A port official runs up to you as you dock and informs you that"
						setTextTrigger no_limp :dont_limp "<StarDock> Where to?"
						pause
					:have_limp
						killAllTriggers
						send "y"
					:dont_limp
						killAllTriggers
				else
					Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Unknown Problem Detected. Check TA!**"
					halt
				end

	    gosub :quikstats

        if (($Start_Creds <= 100) AND ($Start_Exp < $EXPERIECE) AND ($Start_Holds <> $TOTAL_HOLDS))
        	Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Appears You've Been Podded!**"
        	halt
		end

		if ($Tow > 0)
            if ($CURRENT_PROMPT = "<StarDock>")
				gosub :DoShipTowedCheck
				setVar $shipnum $Tow
				gosub :DoXport
			else
				Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Not at Expected StarDock Prompt!**"
				halt
			end
		elseif ($_Trickster <> "")
            if ($CURRENT_PROMPT = "<StarDock>")
				gosub :BUYSHIP
				if ($NewShipNumber > 0)
					setVar $Tow $NewShipNumber
					setVar $pass ""
				else
					setVar $Tow 0
					setVar $NumberOfShip 0
					goto :GO_HOME_EMPTY_HANDED
				end
			else
				Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Not at Expected StarDock Prompt!**"
				halt
			end
        end

		gosub :DoPurchases

		if ($Tow > 0)
			if ($pass = "")
				setVar $shipnum $CurrentShip
			else
				setVar $shipnum $CurrentShip & "*" & $pass & "*   "
			end

			gosub :DoXport
		    gosub :quikstats

			if ($CURRENT_PROMPT <> "<StarDock>")
				Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Not at Expected StarDock Prompt!**"
				halt
    		end
        end

		:GO_HOME_EMPTY_HANDED

		if ($Tow > 0)
			if ($location = "Citadel")
				send "q q q  z  n  w  n  *  w  n" & $Tow & "*  n  n  *  m " & $START_SECTOR & " *  y  y  y  *  d  w  n * L Z" & #8 & $planet & "* p  s s * * c *"
			else
				send "q q q  z  n  w  n  *  w  n" & $Tow & "*  n  n  *  m " & $START_SECTOR & " *  y  y  y  *  d  w  n *  p z s s *"
			end
		else
			if ($location = "Citadel")
				send "Q Q Q Q Z N M " & $START_SECTOR & "* Y  Y  Y  * L Z" & #8 & $planet & "* p  s  s * * c *"
			else
				send "Q Q Q Q Z N M " & $START_SECTOR & "* Y  Y  Y  *  P Z S S *"
			end
		end

		gosub :quikstats

		waitfor "(?="
		if ($CURRENT_SECTOR = STARDOCK)
			Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Twarp Error, Should be Hiding on Dock!**"
			halt
		end

		if ($NumberOfShip <> "")
			if ($NumberOfShip > 1)
				if ($CURRENT_PROMPT = "Citadel")
					setVar $Tow 0
					send " Q  T  N  T  1*  Q  "
					waitfor "Command [TL"
					subtract $NumberOfShip 1

					gosub :quikstats
					if ($TOTAL_HOLDS <> $ORE_HOLDS)
						echo "**" & ANSI_14 & "Out Of Gas " & ANSI_15 & "- Planet appears to have too little ORE to continue!**"
						halt
					end

					if ($RUN_ONCE)
						if ($UNLIM = FALSE)
							setVar $Turn_Diff ($Starting_TURNS - $TURNS)
							setVar $Turn_Req ($Turn_Diff * $NumberOfShip)

							if ($Turn_Req > $TURNS)
								setPrecision 0
								setVar $Turn_Req ($TURNS / $Turn_Diff)

								if ($Turn_Req < 1)
									setVar $NumberOfShip 0
									setVar $Turn_Req $Turn_Diff
								end
							end
				    	end

						setVar $ActualCost ($Starting_CREDITS - $CREDITS)
						setVar $BottomLine ($ActualCost * $NumberOfShip)
						setVar $BottomLine ($ActualCost + $BottomLine)

						if ($BottomLine > $CREDITS)
							setPrecision 0
							setVar $NumberOfShip ($CREDITS / $ActualCost)
							if ($NumberOfShip < 1)
								setVar $NumberOfShip 0
								setVar $BottomLine $ActualCost
							else
								setVar $BottomLine ($ActualCost * ($NumberOfShip + 1))
							end
						end

						if ($UNLIM = FALSE)
							setVar $SpeacalMSG $SpeacalMSG & "                + " & $Turn_Diff & " Turns Used Per Trip.*"
							setVar $SpeacalMSG $SpeacalMSG & "                + " & ($Turn_Diff * ($NumberOfShip + 1)) & " Total Turns Expended.*"
						end
						setVar $CashAmount $ActualCost
						gosub :CommaSize
						setVar $SpeacalMSG $SpeacalMSG & "                + $" & $CashAmount & " Spent On Each Ship.*"
						setVar $CashAmount $BottomLine
						gosub :CommaSize
						setVar $SpeacalMSG $SpeacalMSG & "                + $" & $CashAmount & " Grand Total!*"
						setVar $RUN_ONCE FALSE
					end

					if ($NumberOfShip = 0)
						goto :WE_DONE
					else
		        		goto :HERE_WE_GO_AGAIN
		        	end
		        end
		    end
		end

        :WE_DONE

		#Not sure what I was thinking. commented out the if statement. JAN 29 07
		#if ($Tow > 0)
			if ($location = "Citadel")
				send " q q "
				waitfor "Command [TL="
				gosub :ig_turn_it_on
				send " l z" & #8 & $planet & "*  j  c  *  "
			else
				gosub :ig_turn_it_on
			end
		#end

		setPrecision 0
		setVar $CashAmount ($Starting_CREDITS - $CREDITS)
		gosub :CommaSize
		setVar $_Spent $CashAmount
		setVar $CashAmount $CREDITS
		gosub :CommaSize
		setVar $_Remain $CashAmount

		if (($Tow <> 0) AND ($_Trickster = ""))
			send "'LSDv" & $CURENT_VERSION & " Complete - Spent: $" & $_Spent & " on Ship #" & $Tow & ", OnHand: $" & $_Remain & "*"
			waitfor "Message sent on sub-space channel"
		elseif ($SpeacalMSG <> "")
			send "'*"
			setTextLineTrigger COMMSrON 	:COMMSrON "Comm-link open on sub-space band"
			setTextLineTrigger COMMSrOFF	:COMMSrOFF "You'll need to select a radio channel first."
			pause
			:COMMSrON
				killAllTriggers
				send "LSDv" & $CURENT_VERSION & " Complete - Spent: $" & $_Spent & " on " & $Runs2Dock & " Ships, OnHand: $" & $_Remain & "*"
				send $SpeacalMSG & "*"
				send "* * "
				waitfor "Sub-space comm-link terminated"
			:COMMSrOFF
				killAllTriggers
		else
			send "'LSDv" & $CURENT_VERSION & " Completed - Spent: $" & $_Spent & ", On Hand: $" & $_Remain & "*"
			waitfor "Message sent on sub-space channel"
		end

		halt
		#=---------------------------------------- THE BIG FINISH --------------------------------------------=#
	end
	echo "*"

	goto :TopOfMenu

	halt

    #=--------                                                                       -------=#
     #=------------------------------      SUB ROUTINES      ------------------------------=#
    #=--------                                                                       -------=#
	#		:pad_this
	#		:quikstats
	#		:DoPurchases
	#		:LockTow
	#		:DoXport
	#		:DoTwarp
	#		:DoShipTowedCheck
	#		:GetPassWord
	#		:CommaSize
	#		:GoodToGo
	#		:GetSetPrices
	#		:GetCost
	#		:CheckCosts
	#		:PadItemCosts
	#		:GetClass0Costs
	#		:SetMenuEchos
	#		:FindJumpSector
	#		:ig_turn_it_on
	#		:TurnsDetect
	#		:TurnsRequired
	#		:LoadShipData
	#		:ParseShipData
	#		:DisplayMenu		setVar $_Trickster $selection & "^^" & $ShipList[$ptr][2] & "@@" & $ShipList[$ptr][3] & "!!"
	#							$NumberOfShip
	#							#  Array Format [X]Ship Letter [Ship Name][Cost][ANSI Ship Name]

:pad_this
	if ($str_pad < 10)
		setVar $str_pad "     " & $str_pad
	elseif ($str_pad < 100)
		setVar $str_pad "    " & $str_pad
	elseif ($str_pad < 1000)
		setVar $str_pad "   " & $str_pad
	elseif ($str_pad < 10000)
		setVar $str_pad "  " & $str_pad
	elseif ($str_pad < 100000)
		setVar $str_pad " " & $str_pad
	end
	return

:quikstats
	setVar $CURRENT_PROMPT 		"Undefined"
	killtrigger noprompt
	killtrigger prompt1
	killtrigger prompt2
	killtrigger prompt3
	killtrigger prompt4
	killtrigger statlinetrig
	killtrigger getLine2
	setTextTrigger 		prompt1 	:allPrompts 		"(?="
	setTextLineTrigger 	prompt2 	:secondaryPrompts 	"(?)"
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
				getWord $stats $TURNS  			($current_word + 1)
			elseif ($wordy = "Creds")
				getWord $stats $CREDITS  		($current_word + 1)
			elseif ($wordy = "Figs")
				getWord $stats $FIGHTERS   		($current_word + 1)
			elseif ($wordy = "Shlds")
				getWord $stats $SHIELDS  		($current_word + 1)
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
				getWord $stats $PHOTONS   		($current_word + 1)
			elseif ($wordy = "Armd")
				getWord $stats $ARMIDS   		($current_word + 1)
			elseif ($wordy = "Lmpt")
				getWord $stats $LIMPETS   		($current_word + 1)
			elseif ($wordy = "GTorp")
				getWord $stats $GENESIS  		($current_word + 1)
			elseif ($wordy = "TWarp")
				getWord $stats $TWARP_TYPE  		($current_word + 1)
			elseif ($wordy = "Clks")
				getWord $stats $CLOAKS   		($current_word + 1)
			elseif ($wordy = "Beacns")
				getWord $stats $BEACONS 		($current_word + 1)
			elseif ($wordy = "AtmDt")
				getWord $stats $ATOMIC  		($current_word + 1)
			elseif ($wordy = "Corbo")
				getWord $stats $CORBO   		($current_word + 1)
			elseif ($wordy = "EPrb")
				getWord $stats $EPROBES   		($current_word + 1)
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
				getWord $stats $CORP   			($current_word + 1)
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
# ============================== END QUICKSTATS SUB==============================
:DoPurchases
	if ($ShipData_Valid = 0)
		gosub :ParseShipData
	end
	send "h "
	waitfor "<Hardware Emporium>"
	#=============================================== PURCHASE ATOMICS
	if ($_Atomics <> "")
		send "a "
		waitfor "How many Atomic Detonators do you want"
		if ($_Atomics = "Max")
			getText CURRENTLINE $buy "(Max" ")"
			send $buy & "* "
		else
			send $_Atomics & "* "
		end
		waitfor "<Hardware Emporium>"
	end
	#=============================================== PURCHASE BEACONS
	if ($_Beacons <> "")
		send "b "
		waitfor "How many Beacons do you want"
		if ($_Beacons = "Max")
			getText CURRENTLINE $buy "(Max" ")"
			send $buy & "* "
		else
			send $_Beacons & "* "
		end
		waitfor "<Hardware Emporium>"
	end
	#=============================================== PURCHASE CORBO
	if ($_Corbo <> "")
		send "C "
		waitfor "How many Corbomite Transducers do you want"
		if ($_Corbo = "Max")
			getText CURRENTLINE $buy "(Max" ")"
			send $buy & "* "
		else
			send $_Corbo & "* "
		end
		waitfor "<Hardware Emporium>"
	end
	#=============================================== PURCHASE CLOAKS
	if ($_Cloak <> "")
		send "D "
		waitfor "How many Cloaking units do you want"
		if ($_Cloak = "Max")
			getText CURRENTLINE $buy "(Max" ")"
		else
			setVar $buy $_Cloak
		end
		send $buy & "* "
		waitfor "<Hardware Emporium>"
	end
	#=============================================== PURCHASE PROBES
	if ($_Probe  <> "")
		send "E "
		waitfor "How many Probes do you want"
		if ($_Probe  = "Max")
			getText CURRENTLINE $buy "(Max" ")"
			send $buy & "* "
		else
			send $_Probe & "* "
		end
		waitfor "<Hardware Emporium>"
	end
	#=============================================== PURCHASE PSCAN
	if ($_PScan  <> "")
		send "F "
		setTextTrigger canpscan		:canpscan "I can let you have one for"
		setTextTrigger cantpscan	:cantpscan "<Hardware Emporium> So what are you looking for"
		pause
		:canpscan
			killTrigger canpscan
			send "Y"
			pause
		:cantpscan
			killAllTriggers

	end
	#=============================================== PURCHASE LIMPS
	if ($_Limps  <> "")
		send "L "
		waitfor "How many mines do you want"
		if ($_Limps  = "Max")
			getText CURRENTLINE $buy "(Max" ")"
			send $buy & "* "
		else
			send $buy $_Limps & "* "
		end
		waitfor "<Hardware Emporium>"
	end
	#=============================================== PURCHASE ARMIDS
	if ($_Mines  <> "")
		send "M "
		setVar $buy 0
		waitfor "How many mines do you"
		if ($_Mines  = "Max")
			getText CURRENTLINE $buy "(Max" ")"
			send $buy & "* "
		else
			send $_Mines & "* "
		end
		waitfor "<Hardware Emporium>"
	end
	#=============================================== PURCHASE PHOTONS
	if ($_Photon  <> "")
		setTextTrigger canhouse :canhouse "How many Photon Missiles do you want"
		#setTextTrigger canthouse :canthouse "Sorry, your ship is not equipped to handle Photon Missiles"
		setTextTrigger canthouse :canthouse "<Hardware Emporium> So what are you looking for"
		send "P "
		pause
		:canhouse
			killAllTriggers
			if ($_Photon  = "Max")
				getText CURRENTLINE $buy "(Max" ")"
				send $buy & "* "
			else
				send $_Photon & "* "
			end
			waitfor "<Hardware Emporium>"
		:canthouse
			killAllTriggers
	end
	#=============================================== PURCHASE LRSCAN
	if ($_LRScan  = "Yes")
		setTextTrigger CanBuyLRScan		:CanBuyLRScan "Which would you like?"
		setTextTrigger CantBuyLRScan	:CantBuyLRScan "<Hardware Emporium> So what are you looking for"
		send "R "
		pause
		:CanBuyLRScan
			killAllTriggers
			send "h"
			waitfor "<Hardware Emporium>"
		:CantBuyLRScan
			killAllTriggers
	end
	#=============================================== PURCHASE DISRUPTORS
	if ($_Disrupt  <> "")
		send "S "
		waitfor "How many Mine Disruptors do you want"
		if ($_Disrupt  = "Max")
			getText CURRENTLINE $buy "(Max" ")"
			send $buy & "* "
		else
			send $_Disrupt & "* "
		end
		waitfor "<Hardware Emporium>"
	end
	#=============================================== PURCHASE GEN TORPS
	if ($_GenTorp  <> "")
		send "T "
		waitfor "How many Genesis Torpedoes do you want"
		if ($_GenTorp  = "Max")
			getText CURRENTLINE $buy "(Max" ")"
		else
			setVar $buy $_GenTorp
		end
		send $buy & "* "
		waitfor "<Hardware Emporium>"
	end
	#=============================================== PURCHASE TWARP DRIVE
	if ($_T2Twarp  <> "")
		send "W "
		setTextTrigger canTwarp :canTwarp "Which would you like? (1/2/U/Quit)"
		setTextTrigger cantTwarp :cantTwarp "<Hardware Emporium> So what are you looking for"
		pause
		:canTwarp
			killTrigger canTwarp
			if ($TWARP_TYPE = 1)
				send "U "
			else
				send "2 "
			end
			pause
		:cantTwarp
			killAllTriggers
	end
	#=============================================== SHIP YARD
	if (($_Holds <> "") OR ($_Figs <> "") OR ($_Shields <> "") OR ($_Buffers <> ""))
		send "q s p "
		waitfor "Which item do you wish to buy?"
		#=============================================== SHIP YARD
		if ($_Holds  = "Max")
			send "?"
			waitfor "A  Cargo holds     : "
			getWord CURRENTLINE $_Holds 10
			isNumber $tst $_Holds
			if ($tst <> 0)
				send "A " & $_Holds & "* y "
			end
		elseif ($_Holds <> "")
			send "A "
			waitfor "How many Cargo Holds do you want installed?"
			send $_Holds & "* y "
		end
 		if ($_Figs = "Max")
			send "B "
			waitfor "How many K-3A fighters do you want to buy"
			getWord CURRENTLINE $_Figs 11
			stripText $_Figs ")"
			send $_Figs & "* "
		elseif ($_Figs <> "")
			send "B "
			waitfor "How many K-3A fighters do you want to buy"
			send $_Figs & "* "
		end
		if ($_Shields = "Max")
			send "C "
			waitfor "How many shield armor points do you want to buy"
			getWord CURRENTLINE $_Shields 12
			stripText $_Shields ")"
			send $_Shields & "*"
		elseif ($_Shields <> "")
			send "C "
			waitfor "How many shield armor points do you want to buy"
			send $_Shields & "*"
		end

		if ($_Buffers <> "")
			send "Q "
			waitfor "<Shipyards>"
			while ($_Buffers > 0)
				send "B N Y B"

				setTextLineTrigger NoDecoy :NoDEcoy "You can not afford it!"
				setTextTrigger YaDecoy :YaDEcoy "Want to buy it? "
				pause
				:NoDecoy
					killAllTriggers
					goto :MovingAlong
				:YaDEcoy
					killAllTriggers
					send "Y P" & #8 & "LSD DECOY - You've Been Had!* N *"
					waitfor "<Shipyards>"
					subtract $_Buffers 1
			end
			:MovingAlong
		end
	end
	return

:LockTow
	:TryLockAgain
	setVar $Turns_Req2Tow 0
	send "W"
	setTextTrigger DoTow 		:DoTow "Do you wish to tow a manned ship? "
	setTextLineTrigger BeamOff	:BeamOff "You shut off your Tractor Beam"
	pause

    :BeamOff
    	killAllTriggers
    	goto :TryLockAgain

	:DoTow
		if ($CURRENT_SECTOR < 10)
			setVar $TowingPadded $Tow & "     " & $CURRENT_SECTOR
		elseif ($CURRENT_SECTOR < 100)
			setVar $TowingPadded $Tow & "    " & $CURRENT_SECTOR
		elseif ($CURRENT_SECTOR < 1000)
			setVar $TowingPadded $Tow & "   " & $CURRENT_SECTOR
		elseif ($CURRENT_SECTOR < 10000)
			setVar $TowingPadded $Tow & "  " & $CURRENT_SECTOR
		else
			setVar $TowingPadded $Tow & " " & $CURRENT_SECTOR
		end
		send "N"
		killAllTriggers
		setTextLineTrigger NoShips	:NotHere "You do not own any other ships in this sector!"
		setTextTrigger ShipScan		:ShipScan $TowingPadded
   		setTextTrigger NotHere		:NotHere "Choose which ship to tow "
		pause

        :NotHere
        killAllTriggers
        send "Q* "
        Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Ship To Be Towed Not Found**"
        halt

        :ShipScan
        killAllTriggers
        send $Tow & "**"
		setTextTrigger PWProtected		:PWProtected "Enter the password for "
		setTextLineTrigger TurnsReq		:TowEngaged "It will now cost you "
   		#setTextLineTrigger TowEngaged 	:TowEngaged "You lock your Tractor Beam on"
		pause
		    :PWProtected
	    	killAllTriggers
	    	send " *  * "
	    	Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Cannot Tow A Ship With A Set Password**"
	    	halt

			:TowEngaged
			killAllTriggers
			getText CURRENTLINE $Turns_Req2Tow "cost you " " turns"
			stripText $Turns_Req2Tow " "
			isNumber $tst $Turns_Req2Tow
			if ($tst = 0)
				Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Unable to Ascertain Turns Required.**"
				halt
			end

		return

:DoXport
	setVar $msg ""
	killtrigger det_trg1
	killtrigger det_trg2
	killtrigger det_trg3
	killtrigger det_trg4
	killtrigger det_trg5
	killtrigger det_trg6
	killtrigger det_trg7
	setTextLineTrigger det_trg1	:xport_notavail "That is not an available ship."
	setTextLineTrigger det_trg2	:xport_badrange "only has a transport range of"
	setTextLineTrigger det_trg3	:xport_security "SECURITY BREACH! Invalid Password, unable to link transporters."
	setTextLineTrigger det_trg4	:xport_noaccess "Access denied!"
	setTextLineTrigger det_trg5	:xport_xprtgood "Security code accepted, engaging transporter control."
	setTextLineTrigger det_trg6	:xport_go_ahead "Landing on Federation StarDock."
     # Send the macro
     #send "qqq  z  n  x    " & $shipnum & "    *    *    *    p  s s "
     send "qqq  z  n  x    " & $shipnum & "    *    *    *    p  s"
     pause
     return

     :xport_notavail
     setVar $msg "**" & ANSI_14 & "Export Status" & ANSI_15 & " - Incorrect Ship Number!**"
     pause

     :xport_badrange
     setVar $msg "**" & ANSI_14 & "Export Status" & ANSI_15 & " - Ship Is Out Of Export Range**"
     pause

     :xport_security
     setVar $msg "**" & ANSI_14 & "Export Status" & ANSI_15 & " - Cannot Export to Password Protected Ship**"
     pause

     :xport_noaccess
     setVar $msg "**" & ANSI_14 & "Export Status" & ANSI_15 & " - Unable to Access Ship**"
     pause

     :xport_xprtgood
     setVar $msg "**" & ANSI_14 & "Export Status" & ANSI_15 & " - Export Success!**"
     pause

     :xport_go_ahead
	 setTextLineTrigger det_trg7 	:xport_scrub "A port official runs up to you as you dock and informs you that"
	 setTextTrigger det_trg8			:xport_docked "<StarDock> Where to? (?="
	 pause
     :xport_scrub
     send " y"
     pause
     :xport_docked
     killAllTriggers
     echo $msg
     return

:DoTwarp
	setVar $msg ""
	if ($TwarpTo > 0)
		send "mz" & $TwarpTo " * "
		setTextTrigger there        :adj_warp "You are already in that sector!"
		setTextLineTrigger adj_warp :adj_warp "Sector  : " & $TwarpTo & " "
		setTextTrigger locking      :locking "Do you want to engage the TransWarp drive?"
		setTextTrigger igd          :twarpIgd "An Interdictor Generator in this sector holds you fast!"
		setTextTrigger noturns      :twarpPhotoned "Your ship was hit by a Photon and has been disabled"
		setTextTrigger noroute      :twarpNoRoute "Do you really want to warp there? (Y/N)"
		pause
		:adj_warp
			killAllTriggers
			send "z*"
			goto :twarp_adj
		:locking
			killAllTriggers
			send "y"
			setTextLineTrigger twarp_lock 		:twarp_lock "TransWarp Locked"
			setTextLineTrigger no_twrp_lock 	:no_twarp_lock "No locating beam found"
			setTextLineTrigger twarp_adj 		:twarp_adj "<Set NavPoint>"
			setTextLineTrigger no_fuel 			:twarpNoFuel "You do not have enough Fuel Ore"
			pause
		:twarpNoFuel
			killAllTriggers
			setVar $msg "Not enough fuel for T-warp."
			goto :twarpDone

		:twarp_adj
			killAllTriggers
			send " * p s"
			goto :twarpDone

		:twarpNoRoute
			killAllTriggers
			send "n* z* "
			setVar $msg "No route available!"
			goto :twarpDone

		:no_twarp_lock
			killAllTriggers
			send "n* z* "
			setVar $msg "No fighter Deployed, cannot Twarp"
			goto :twarpDone

		:twarpIgd
			killAllTriggers
			setVar $msg "My ship is being held by Interdictor!"
			goto :twarpDone

		:twarpPhotoned
			killAllTriggers
			setVar $msg "I have been photoned and can not T-warp!"
			goto :twarpDone

		:twarp_lock
			KillAlltriggers
			if ($ALIGNMENT >= 1000)
				send "y * * p s"
			else
				send "y  *  *  m " & STARDOCK & " *  *  p s"
			end
		:twarpDone
			if ($msg <> "")
				echo "**" & ANSI_14 & "Twarp Error " & ANSI_15 & " - " & $msg & "**"
			end
	end
	return

:DoShipTowedCheck
	if (STARDOCK < 10)
		setVar $SellingShip $Tow & "     " & STARDOCK
	elseif (STARDOCK < 100)
		setVar $SellingShip $Tow & "    " & STARDOCK
	elseif (STARDOCK < 1000)
		setVar $SellingShip $Tow & "   " & STARDOCK
	elseif (STARDOCK < 10000)
		setVar $SellingShip $Tow & "  " & STARDOCK
	else
		setVar $SellingShip $Tow & " " & STARDOCK
	end

	send "S S"
	setTextLineTrigger Nothing2Sell		:Nothing2Sell "You do not own any other ships orbiting the Stardock!"
	setTextLineTrigger Something2Sell	:Something2Sell $SellingShip
	setTextTrigger NotInList			:NotInList "Choose which ship to sell "
	pause

	:NotInList
	killAllTriggers
	send "Q"
	:Nothing2Sell
	killAllTriggers
	send "Q/"
	waitfor "(?="
	echo "**" & ANSI_14 & "Tow Error " & ANSI_15 & " - Ship Wasn't Towed!**"
	halt

	:Something2Sell
	killAllTriggers
	send "QQ"
	return

:GetPassWord
	send "co"
	setTextTrigger PLine :PLine "tell it to.  Your last password was : "
	pause
	:PLine
	killAllTriggers
	setVar $currentline CURRENTLINE & ""
    getText $currentline $pass ": " ""

	if ($pass <> "")
		send $pass
	end

	send "*"

	setTextTrigger MakeCorp		:MakeCorp "Should this be a (C)orporate ship or (P)ersonal ship? "
	setTextTrigger NotAnOption	:NotAnOption "Computer command [TL="
	pause
	:MakeCorp
	killAllTriggers
	send "C"
	:NotAnOption
	killAllTriggers
	send " Q "

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

:GoodToGo
	if (PASSWORD = "")
		Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Game Password Not Set**"
		halt
	end
	if (STARDOCK <= 0)
		Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Cannot Find Dock!**"
		halt
	end
	if (SECTOR.EXPLORED[STARDOCK] <> "YES")
		Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - You Must Visit have Visited StarDock!**"
		halt
	end

	return

:GetSetPrices
	gosub :CheckCosts

	if ($CostsAreGood = 0)
		:GetAnotherResponse
		Echo ANSI_14 & #27 & "[1A" & #27 & "[2K" & "*Item Costs Need To Be Updated, Proceed (" & ANSI_15 & "Y/N" & ANSI_14 & ")?                            *"

		getConsoleInput $selection SINGLEKEY
		uppercase $selection

		if ($selection = "Y")
		elseif ($selection = "N")
			Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Script Halted**"
			halt
		else
			echo #27 & "[2K" & #27 & "[1A"
			goto :GetAnotherResponse
		end

		send "   Q  Y  *  " & #42 & "*T*  *  * " & PASSWORD & "*    *    *    "

		waitfor "[Costs]"
		setTextLineTrigger Reregister			:Reregister "Reregister Ship="
		setTextLineTrigger LimpetRemoval		:LimpetRemoval "Limpet Removal="
		setTextLineTrigger GenesisTorpedo		:GenesisTorpedo "Genesis Torpedo="
		setTextLineTrigger ArmidMine			:ArmidMine "Armid Mine="
		setTextLineTrigger LimpetMine			:LimpetMine "Limpet Mine="
		setTextLineTrigger Beacon				:Beacon "Beacon="
		setTextLineTrigger TypeITwarp			:TypeITwarp "Type I TWarp="
		setTextLineTrigger TypeIITwarp			:TypeIITwarp "Type II TWarp="
		setTextLineTrigger TwarpUpgrade			:TwarpUpgrade "TWarp Upgrade="
		setTextLineTrigger PlanetScanner		:PlanetScanner "Planet Scanner="
		setTextLineTrigger AtomicDetonator		:AtomicDetonator "Atomic Detonator="
		setTextLineTrigger Corbomite			:Corbomite "Corbomite="
		setTextLineTrigger EtherProbe			:EtherPRobe "Ether Probe="
		setTextLineTrigger PhotonMissile		:PhotonMissile "Photon Missile="
		setTextLineTrigger CloakingDevice		:CloakingDevice "Cloaking Device="
		setTextLineTrigger MineDisruptor		:MineDisruptor "Mine Disruptor="
		setTextLineTrigger HoloScanner			:HoloScanner "Holographic Scanner="
		setTextLineTrigger DensityScanner		:DensityScanner "Density Scanner"
		setTextLineTrigger WaitingOnSystem		:WaitingOnSystem "Max Times Blown Up"
		setTextTrigger Fini						:Fini "Command [TL="
		pause

		:Reregister
        	killTrigger Reregister
        	gosub :GetCost
			setVar $lsd_ReRegisterCost $Cost
			saveVar $lsd_ReRegisterCost
			pause
		:LimpetRemoval
			killTrigger LimpetRemoval
			gosub :GetCost
			setVar $lsd_LimpRemovalCost $Cost
			saveVar $lsd_LimpRemovalCost
			pause
		:GenesisTorpedo
			killTrigger GenesisTorpedo
			gosub :GetCost
			setVar $lsd_GenCost $Cost
			saveVar $lsd_GenCost
			pause
		:ArmidMine
			killTrigger ArmidMine
			gosub :GetCost
			setVar $lsd_ArmidCost $Cost
			saveVar $lsd_ArmidCost
			pause
		:LimpetMine
			killTrigger LimpetMine
			gosub :GetCost
			setVar $lsd_LimpCost $Cost
			saveVar $lsd_LimpCost
			pause
		:Beacon
			killTrigger Beacon
			gosub :GetCost
			setVar $lsd_Beacon $Cost
			saveVar $lsd_Beacon
			pause
		:TypeITwarp
			killTrigger TypeITwarp
			gosub :GetCost
			setVar $lsd_TwarpICost $Cost
			saveVar $lsd_TwarpICost
			pause
		:TypeIITwarp
			killTrigger TypeIITwarp
			gosub :GetCost
			setVar $lsd_TwarpIICost $Cost
			saveVar $lsd_TwarpIICost
			pause
		:TwarpUpgrade
			killTrigger TwarpUpgrade
			gosub :GetCost
			setVar $lsd_TwarpUpCost $Cost
			saveVar $lsd_TwarpUpCost
			pause
		:PlanetScanner
			killTrigger PlanetScanner
			gosub :GetCost
			setVar $lsd_PScan $Cost
			saveVar $lsd_PScan
			pause
		:AtomicDetonator
			killTrigger AtomicDetonator
			gosub :GetCost
			setVar $lsd_AtomicCost $Cost
			saveVar $lsd_AtomicCost
			pause
		:Corbomite
			killTrigger Corbomite
			gosub :GetCost
			setVar $lsd_CorboCost $Cost
			saveVar $lsd_CorboCost
			pause
		:EtherPRobe
			killTrigger EtherProbe
			gosub :GetCost
			setVar $lsd_EProbe $Cost
			saveVar $lsd_EProbe
			pause
		:PhotonMissile
			killTrigger PhotonMissile
			gosub :GetCost
			setVar $lsd_PhotonCost $Cost
			saveVar $lsd_PhotonCost
			pause
		:CloakingDevice
			killTrigger CloakingDevice
			gosub :GetCost
			setVar $lsd_CloakCost $Cost
			saveVar $lsd_CloakCost
			pause
		:MineDisruptor
			killTrigger MineDisruptor
			gosub :GetCost
			setVar $lsd_DisruptCost $Cost
			saveVar $lsd_DisruptCost
			pause
		:HoloScanner
			killTrigger HoloScanner
			gosub :GetCost
			setVar $lsd_HoloCost $Cost
			saveVar $lsd_HoloCost
			pause
		:DensityScanner
			killTrigger DensityScanner
			gosub :GetCost
			setVar $lsd_DScanCost $Cost
			saveVar $lsd_DScanCost
			pause
		:WaitingOnSystem
			killTrigger WaitingOnSystem
			echo "*" & ANSI_14 & "Stand By" & ANSI_15 & " - Waiting On The Server*"
			pause
		:Fini
			killAllTriggers
	end
	return

:GetCost
	setVar $Cost 0
	getWordPos CURRENTLINE $pos "="
	if ($pos <> 0)
		cutText CURRENTLINE $Cost ($pos + 1) 999
		striptext $Cost " cr"
	end
	return

:CheckCosts
	setVar $CostsAreGood TRUE
	loadVar $LSD_LIMPREMOVALCOST
	loadVar $LSD_GENCOST
	loadVar $LSD_ARMIDCOST
	loadVar $LSD_LIMPCOST
	loadVar $LSD_BEACON
	loadVar $LSD_TWARPICOST
	loadVar $LSD_TWARPIICOST
	loadVar $LSD_TWARPUPCOST
	loadVar $LSD_PSCAN
	loadVar $LSD_ATOMICCOST
	loadVar $LSD_CORBOCOST
	loadVar $LSD_EPROBE
	loadVar $LSD_PHOTONCOST
	loadVar $LSD_CLOAKCOST
	loadVar $LSD_DISRUPTCOST
	loadVar $LSD_HOLOCOST
	loadVar $LSD_DSCANCOST
	loadVar $LSD_ReRegisterCost

	if (($LSD_LIMPREMOVALCOST = 0) OR ($LSD_GENCOST = 0) OR ($LSD_ARMIDCOST = 0) OR ($LSD_LIMPCOST = 0) OR ($LSD_BEACON = 0) OR ($LSD_TWARPICOST = 0) OR ($LSD_TWARPIICOST = 0) OR ($LSD_TWARPUPCOST = 0) OR ($LSD_PSCAN = 0) OR ($LSD_ATOMICCOST = 0) OR ($LSD_CORBOCOST = 0) OR ($LSD_EPROBE = 0) OR ($LSD_PHOTONCOST = 0) OR ($LSD_CLOAKCOST = 0) OR ($LSD_DISRUPTCOST = 0) OR ($LSD_HOLOCOST = 0) OR ($LSD_DSCANCOST = 0) OR ($LSD_ReRegisterCost = 0))
		setVar $CostsAreGood FALSE
	end
	return

:PadItemCosts
	getLength $PadThisCost $len

	if ($len = 1)
		setVar $PadThisCost "      " & $PadThisCost
	elseif ($len = 2)
		setVar $PadThisCost "     " & $PadThisCost
	elseif ($len = 3)
		setVar $PadThisCost "    " & $PadThisCost
	elseif ($len = 4)
		setVar $PadThisCost "   " & $PadThisCost
	elseif ($len = 5)
		setVar $PadThisCost "  " & $PadThisCost
	elseif ($len = 6)
		setVar $PadThisCost " " & $PadThisCost
	else

	end
	return

:GetClass0Costs
	send "CR1*Q  "
	setTextLineTrigger LSD_CargoHolds	:LSD_CargoHolds "A  Cargo holds     : "
	setTextLineTrigger LSD_Fighters		:LSD_Fighters "B  Fighters        : "
	setTextLineTrigger LSD_Shields		:LSD_Shields "C  Shield Points   : "
	setTextTrigger LSD_Fini				:LSD_Fini "Command [TL="
	pause

	:LSD_CargoHolds
		killTrigger LSD_CargoHolds
		getWord CURRENTLINE $LSD_HoldCost 5
		isNumber $tst $LSD_HoldCost
		if ($tst = 0)
			setVar $LSD_HoldCost 0
		end
        pause
	:LSD_Fighters
		killTrigger LSD_Fighters
		getWord CURRENTLINE $LSD_FighterCost 4
		isNumber $tst $LSD_FighterCost
		if ($tst = 0)
			setVar $LSD_FighterCost 0
		end
		pause
	:LSD_Shields
		killTrigger LSD_Shields
		getWord CURRENTLINE $LSD_Shield 5
		isNumber $tst $LSD_Shield
		if ($tst = 0)
			setVar $LSD_Shield 0
		end
		pause
	:LSD_Fini
		killAllTriggers

	setVar $CashAmount $LSD_HoldCost
	gosub :CommaSize
	setVar $LSD_HoldCost $CashAmount
	setVar $CashAmount $LSD_FighterCost
	gosub :CommaSize
	setVar $LSD_FighterCost $CashAmount
	setVar $CashAmount $LSD_Shield
	gosub :CommaSize
	setVar $LSD_Shield  $CashAmount
	return

:SetMenuEchos
	#Returned	setVar $_Trickster $selection & "^^" & $ShipList[$ptr][2] & "@@" & $ShipList[$ptr][3] & "!!"
	#			$NumberOfShip
	isNumber $tst $NumberOfShip
	if ($tst <> 0)
		if ($NumberOfShip > 0)
			getText $_Trickster $Cost "^^" "@@"
			stripText $Cost ","
			stripText $Cost " "
			getText $_Trickster $temp "@@" "!!"
			stripText $LSD_ReRegisterCost ","
			setVar $Cost ($Cost + $LSD_ReRegisterCost)
			setVar $MathOut ($NumberOfShip * $Cost)
			setVar $_TOTAL ($_TOTAL + $Mathout)
			setVar $CashAmount $Mathout
			gosub :CommaSize
	        setVar $Echo_Trickster ANSI_15 & $NumberOfShip & " " & $temp & ANSI_7 & "  ($" & $CashAmount & ")"
	    else
		    setVar $Echo_Trickster ""
	    end
	else
		setVar $Echo_Trickster ""
	end

	isNumber $tst $_Atomics
	if ($tst <> 0)
		setVar $Cost $LSD_ATOMICCOST
		stripText $Cost ","
		setVar $MathOut ($_Atomics * $Cost)

		# Adjust for multiple Ship Purcahse
		isNumber $tst $NumberOfShip
		if ($tst <> 0)
			setVar $MathOut ($MathOut * $NumberOfShip)
			setVar $Multiplier ANSI_8 & "(X" & $NumberOfShip & ")"
		else
			setVar $Multiplier ""
		end
		setVar $_TOTAL ($_TOTAL + $MathOut)
		setVar $CashAmount $MathOut
		gosub :CommaSize
		setVar $Echo_Atomics ANSI_15 & $_Atomics & "  " & $Multiplier & ANSI_7 & "($" & $CashAmount & ")"
	elseif ($_Atomics  = "Max")
		setVar $Echo_Atomics "Max"
	else
		setVar $Echo_Atomics ""
	end
	isNumber $tst $_Beacons
	if ($tst <> 0)
		setVar $Cost $LSD_BEACON
		stripText $Cost ","
		setVar $MathOut ($_Beacons * $Cost)

		# Adjust for multiple Ship Purcahse
		isNumber $tst $NumberOfShip
		if ($tst <> 0)
			setVar $MathOut ($MathOut * $NumberOfShip)
			setVar $Multiplier ANSI_8 & "(X" & $NumberOfShip & ")"
		else
			setVar $Multiplier ""
		end


		setVar $_TOTAL ($_TOTAL + $MathOut)
		setVar $CashAmount $MathOut
		gosub :CommaSize
		setVar $Echo_Beacons ANSI_15 & $_Beacons & "  " & $Multiplier & ANSI_7 & "($" & $CashAmount & ")"
	elseif ($_Beacons = "Max")
		setVar $Echo_Beacons "Max"
	else
		setVar $Echo_Beacons ""
	end
	isNumber $tst $_Corbo
	if ($tst <> 0)
		setVar $Cost $LSD_CORBOCOST
		stripText $Cost ","
		setVar $MathOut ($_Corbo * $Cost)

		# Adjust for multiple Ship Purcahse
		isNumber $tst $NumberOfShip
		if ($tst <> 0)
			setVar $MathOut ($MathOut * $NumberOfShip)
			setVar $Multiplier ANSI_8 & "(X" & $NumberOfShip & ")"
		else
			setVar $Multiplier ""
		end


		setVar $_TOTAL ($_TOTAL + $MathOut)
		setVar $CashAmount $MathOut
		gosub :CommaSize
		setVar $Echo_Corbo ANSI_15 & $_Corbo & "  " & $Multiplier & ANSI_7 & "($" & $CashAmount & ")"
	elseif ($_Corbo = "Max")
		setVar $Echo_Corbo "Max"
	else
		setVar $Echo_Corbo ""
	end
	isNumber $tst $_Cloak
	if ($tst <> 0)
		setVar $Cost $LSD_CLOAKCOST
		stripText $Cost ","
		setVar $MathOut ($_Cloak * $Cost)

		# Adjust for multiple Ship Purcahse
		isNumber $tst $NumberOfShip
		if ($tst <> 0)
			setVar $MathOut ($MathOut * $NumberOfShip)
			setVar $Multiplier ANSI_8 & "(X" & $NumberOfShip & ")"
		else
			setVar $Multiplier ""
		end


		setVar $_TOTAL ($_TOTAL + $MathOut)
		setVar $CashAmount $MathOut
		gosub :CommaSize
		setVar $Echo_Cloak ANSI_15 & $_Cloak & "  " & $Multiplier & ANSI_7 & "($" & $CashAmount & ")"
	elseif ($_Cloak = "Max")
		setVar $Echo_Cloak "Max"
	else
		setVar $Echo_Cloak ""
	end
	isNumber $tst $_Probe
	if ($tst <> 0)
		setVar $Cost $LSD_EPROBE
		stripText $Cost ","
		setVar $MathOut ($_Probe * $Cost)

		# Adjust for multiple Ship Purcahse
		isNumber $tst $NumberOfShip
		if ($tst <> 0)
			setVar $MathOut ($MathOut * $NumberOfShip)
			setVar $Multiplier ANSI_8 & "(X" & $NumberOfShip & ")"
		else
			setVar $Multiplier ""
		end


		setVar $_TOTAL ($_TOTAL + $MathOut)
		setVar $CashAmount $MathOut
		gosub :CommaSize
		setVar $Echo_Probe ANSI_15 & $_Probe & "  " & $Multiplier & ANSI_7 & "($" & $CashAmount & ")"
	elseif ($_Probe = "Max")
		setVar $Echo_Probe "Max"
	else
		setVar $Echo_Probe ""
	end
	if ($_PScan = "Yes")
		setVar $Cost $LSD_PSCAN
		stripText $Cost ","
		setVar $MathOut $Cost

		# Adjust for multiple Ship Purcahse
		isNumber $tst $NumberOfShip
		if ($tst <> 0)
			setVar $MathOut ($MathOut * $NumberOfShip)
			setVar $Multiplier ANSI_8 & "(X" & $NumberOfShip & ")"
		else
			setVar $Multiplier ""
		end


		setVar $_TOTAL ($_TOTAL + $MathOut)
		setVar $CashAmount $MathOut
		gosub :CommaSize
		setVar $Echo_PScan ANSI_15 & $_PScan & "  " & $Multiplier & ANSI_7 & "($" & $CashAmount & ")"
	else
		setVar $Echo_PScan ""
	end
	isNumber $tst $_Limps
	if ($tst <> 0)
		setVar $Cost $LSD_LIMPCOST
		stripText $Cost ","
		setVar $MathOut ($_Limps * $Cost)

		# Adjust for multiple Ship Purcahse
		isNumber $tst $NumberOfShip
		if ($tst <> 0)
			setVar $MathOut ($MathOut * $NumberOfShip)
			setVar $Multiplier ANSI_8 & "(X" & $NumberOfShip & ")"
		else
			setVar $Multiplier ""
		end


		setVar $_TOTAL ($_TOTAL + $MathOut)
		setVar $CashAmount $MathOut
		gosub :CommaSize
		setVar $Echo_Limps ANSI_15 & $_Limps & "  " & $Multiplier & ANSI_7 & "($" & $CashAmount & ")"
	elseif ($_Limps = "Max")
		setVar $Echo_Limps "Max"
	else
		setVar $Echo_Limps ""
	end
	isNumber $tst $_Mines
	if ($tst <> 0)
		setVar $Cost $LSD_ARMIDCOST
		stripText $Cost ","
		setVar $MathOut ($_Mines * $Cost)

		# Adjust for multiple Ship Purcahse
		isNumber $tst $NumberOfShip
		if ($tst <> 0)
			setVar $MathOut ($MathOut * $NumberOfShip)
			setVar $Multiplier ANSI_8 & "(X" & $NumberOfShip & ")"
		else
			setVar $Multiplier ""
		end


		setVar $_TOTAL ($_TOTAL + $MathOut)
		setVar $CashAmount $MathOut
		gosub :CommaSize
		setVar $Echo_Mines ANSI_15 & $_Mines & "  " & $Multiplier & ANSI_7 & "($" & $CashAmount & ")"
	elseif ($_Mines = "Max")
		setVar $Echo_Mines "Max"
	else
		setVar $Echo_Mines ""
	end
	isNumber $tst $_Photon
	if ($tst <> 0)
		setVar $Cost $LSD_PHOTONCOST
		stripText $Cost ","
		setVar $MathOut ($_Photon * $Cost)

		# Adjust for multiple Ship Purcahse
		isNumber $tst $NumberOfShip
		if ($tst <> 0)
			setVar $MathOut ($MathOut * $NumberOfShip)
			setVar $Multiplier ANSI_8 & "(X" & $NumberOfShip & ")"
		else
			setVar $Multiplier ""
		end


		setVar $_TOTAL ($_TOTAL + $MathOut)
		setVar $CashAmount $MathOut
		gosub :CommaSize
		setVar $Echo_Photon ANSI_15 & $_Photon & "  " & $Multiplier & ANSI_7 & "($" & $CashAmount & ")"
	elseif ($_Photon = "Max")
		setVar $Echo_Photon "Max"
	else
		setVar $Echo_Photon ""
	end
	if ($_LRScan = "Yes")
		setVar $Cost $LSD_HOLOCOST
		stripText $Cost ","
		setVar $MathOut $Cost

		# Adjust for multiple Ship Purcahse
		isNumber $tst $NumberOfShip
		if ($tst <> 0)
			setVar $MathOut ($MathOut * $NumberOfShip)
			setVar $Multiplier ANSI_8 & "(X" & $NumberOfShip & ")"
		else
			setVar $Multiplier ""
		end


		setVar $_TOTAL ($_TOTAL + $MathOut)
		setVar $CashAmount $MathOut
		gosub :CommaSize
		setVar $Echo_LRScan ANSI_15 & $_LRScan & "  " & $Multiplier & ANSI_7 & "($" & $CashAmount & ")"
	else
		setVar $Echo_LRScan ""
	end
	isNumber $tst $_Disrupt
	if ($tst <> 0)
		setVar $Cost $LSD_DISRUPTCOST
		stripText $Cost ","
		setVar $MathOut ($_Disrupt * $Cost)

		# Adjust for multiple Ship Purcahse
		isNumber $tst $NumberOfShip
		if ($tst <> 0)
			setVar $MathOut ($MathOut * $NumberOfShip)
			setVar $Multiplier ANSI_8 & "(X" & $NumberOfShip & ")"
		else
			setVar $Multiplier ""
		end


		setVar $_TOTAL ($_TOTAL + $MathOut)
		setVar $CashAmount $MathOut
		gosub :CommaSize
		setVar $Echo_Disrupt ANSI_15 & $_Disrupt & "  " & $Multiplier & ANSI_7 & "($" & $CashAmount & ")"
	elseif ($_Disrupt = "Max")
		setVar $Echo_Disrupt "Max"
	else
		setVar $Echo_Disrupt ""
	end
	isNumber $tst $_GenTorp
	if ($tst <> 0)
		setVar $Cost $LSD_GENCOST
		stripText $Cost ","
		setVar $MathOut ($_GenTorp * $Cost)

		# Adjust for multiple Ship Purcahse
		isNumber $tst $NumberOfShip
		if ($tst <> 0)
			setVar $MathOut ($MathOut * $NumberOfShip)
			setVar $Multiplier ANSI_8 & "(X" & $NumberOfShip & ")"
		else
			setVar $Multiplier ""
		end


		setVar $_TOTAL ($_TOTAL + $MathOut)
		setVar $CashAmount $MathOut
		gosub :CommaSize
		setVar $Echo_GenTorp ANSI_15 & $_GenTorp & "  " & $Multiplier & ANSI_7 & "($" & $CashAmount & ")"
	elseif ($_GenTorp = "Max")
		setVar $Echo_GenTorp "Max"
	else
		setVar $Echo_GenTorp ""
	end
	if ($_T2Twarp = "Yes")
		setVar $Cost $LSD_TWARPIICOST
		stripText $Cost ","
		setVar $MathOut $Cost

		# Adjust for multiple Ship Purcahse
		isNumber $tst $NumberOfShip
		if ($tst <> 0)
			setVar $MathOut ($MathOut * $NumberOfShip)
			setVar $Multiplier ANSI_8 & "(X" & $NumberOfShip & ")"
		else
			setVar $Multiplier ""
		end


		setVar $_TOTAL ($_TOTAL + $MathOut)
		setVar $CashAmount $MathOut
		gosub :CommaSize
		setVar $Echo_T2Twarp ANSI_15 & $_T2Twarp & "  " & $Multiplier & ANSI_7 & "($" & $CashAmount & ")"
	else
		setVar $Echo_T2Twarp ""
	end
	isNumber $tst $_Holds
	if ($tst <> 0)
		setVar $Cost $LSD_HoldCost
		stripText $Cost ","
		setVar $MathOut ($_Holds * $Cost)

		# Adjust for multiple Ship Purcahse
		isNumber $tst $NumberOfShip
		if ($tst <> 0)
			setVar $MathOut ($MathOut * $NumberOfShip)
			setVar $Multiplier ANSI_8 & "(X" & $NumberOfShip & ")"
		else
			setVar $Multiplier ""
		end


		setVar $_TOTAL ($_TOTAL + $MathOut)
		setVar $CashAmount $MathOut
		gosub :CommaSize
		setVar $Echo_Holds ANSI_15 & $_Holds & "  " & $Multiplier & ANSI_7 & "($" & $CashAmount & ")"
	elseif ($_Holds = "Max")
		setVar $Echo_Holds "Max"
	else
		setVar $Echo_Holds ""
	end
	isNumber $tst $_Figs
	if ($tst <> 0)
		setVar $Cost $LSD_FighterCost
		stripText $Cost ","
		setVar $MathOut ($_Figs * $Cost)

		# Adjust for multiple Ship Purcahse
		isNumber $tst $NumberOfShip
		if ($tst <> 0)
			setVar $MathOut ($MathOut * $NumberOfShip)
			setVar $Multiplier ANSI_8 & "(X" & $NumberOfShip & ")"
		else
			setVar $Multiplier ""
		end


		setVar $_TOTAL ($_TOTAL + $MathOut)
		setVar $CashAmount $MathOut
		gosub :CommaSize

		setVar $Echo_Figs ANSI_15 & $_Figs & "  " & $Multiplier & ANSI_7 & "($" & $CashAmount & ")"
	elseif ($_Figs = "Max")
		setVar $Echo_Figs "Max"
	else
		setVar $Echo_Figs ""
	end
	isNumber $tst $_Shields
	if ($tst <> 0)
		setVar $Cost $LSD_Shield
		stripText $Cost ","
		setVar $MathOut ($_Shields * $Cost)

		# Adjust for multiple Ship Purcahse
		isNumber $tst $NumberOfShip
		if ($tst <> 0)
			setVar $MathOut ($MathOut * $NumberOfShip)
			setVar $Multiplier ANSI_8 & "(X" & $NumberOfShip & ")"
		else
			setVar $Multiplier ""
		end

		setVar $_TOTAL ($_TOTAL + $MathOut)
		setVar $CashAmount $MathOut
		gosub :CommaSize
		setVar $Echo_Shields ANSI_15 & $_Shields & "  " & $Multiplier & ANSI_7 & "($" & $CashAmount & ")"
	elseif ($_Shields = "Max")
		setVar $Echo_Shields "Max"
	else
		setVar $Echo_Shields ""
	end
	return

:FindJumpSector
	setVar $i 1
	setVar $RED_adj 0

	while (SECTOR.WARPSIN[STARDOCK][$i] > 0)
		setVar $RED_adj SECTOR.WARPSIN[STARDOCK][$i]
		send "m " & $RED_adj & "* y"
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
		send " N "

		if (((SECTOR.NAVHAZ[$RED_adj] > 0) OR (SECTOR.MINES.QUANTITY[$RED_adj] <> 0)) AND ($PHOTONS <> 0))
			if ((SECTOR.MINES.OWNER[$RED_adj] <> "belong to your Corp") AND (SECTOR.MINES.OWNER[$RED_adj] <> "yours"))
				waitfor "Command [TL="
				echo "**" & ANSI_14 & "         !!ARMID MINE / NAV HAZ - ALERT!!" & ANSI_15 & "*         Jump Sector " & ANSI_6 & $RED_adj & ANSI_15 & ", shows in the TWX DBase with Armids And/Or Haz present*         With photons on board there's a risk of Self-Torping**         Override Safety and use this Jump Sector (Y/N)?"
				getConsoleInput $selection SINGLEKEY
				upperCase $selection
				if ($selection = "Y")

				else
					goto :TryingNextAdj
				end
			end
		end
		goto :SectorLocked

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

:ig_turn_it_on
	killalltriggers
	setVar $ig_mode 0
	setTextTrigger no_ig_trigger :no_ig_available "is not equipped with an Interdictor Generator!"
	setTextTrigger no_ig_beam    :no_ig_beam "Beam to what sector? (U=Upgrade Q=Quit)"
	setTextTrigger no_ig_cby     :no_ig_cby "ARE YOU SURE CAPTAIN? (Y/N)"
	setTextTrigger need_ig       :ig_was_off "Your Interdictor generator is now OFF"
	setTextTrigger ig_fine       :ig_was_on "Your Interdictor generator is now ON"
	setTextTrigger do_ig         :do_ig_thing "Do you wish to change it? (Y/N)"
	send " b"
	pause

	:no_ig_available
   	Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - No IG available on this ship.**"
	return

	:no_ig_beam
	send " Q "
	Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Cannot turn IG On, Incorrect Prompt.**"
	return

	:no_ig_cby
	send " Q Q Q Z N "
	waitfor "(?="
	goto :ig_turn_it_on

	:ig_was_on
	setVar $ig_mode 1
	pause

	:ig_was_off
	setVar $ig_mode 0
	pause

:do_ig_thing
	killAllTriggers
	if ($ig_mode = 0)
		send "Y"
		Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - IG On!**"
	else
		send "N"
	end
	return


:TurnsDetect
	send "  M0*"
	setTextLineTrigger TurnsDetect_NoTurns		:TurnsDetect_NoTurns "You don't have enough turns left."
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

:TurnsRequired
	send "i"
	setTextLineTrigger TurnsRequired_TPW	:TurnsRequired_TPW "Turns to Warp  : "
	pause

	:TurnsRequired_TPW
	killAllTriggers
	getWord CURRENTLINE $TurnsRequired_TPW 5

	if ($RED_adj > 0)
		# twarp to jmp sector, then into SD sect, then twarp home
		setVar $TurnsRequired_temp ($TurnsRequired_TPW * 3)
		if ($Tow > 0)
			# 2 Turns for exporting into other ship and back again
			add $TurnsRequired_temp 2
			# 3 Turns for initial Port then x into other ship, port & shop, then x and report
			#   b4 heading home
			add $TurnsRequired_temp 3
		else
			add $TurnsRequired_temp 1
		end
	else
		setVar $TurnsRequired_temp ($TurnsRequired_TPW * 2)
		# 1 Turn to port at dock
		add $TurnsRequired_temp 1
	end

	setVar $TurnsRequired $TurnsRequired_temp
	return


:LoadShipData
	fileExists $test $Ships_File
	if ($test)
		setVar $i 1
		read $Ships_File $Line $i
		while (($Line <> EOF) AND ($i <= $ShipListMax))
			getWordPos $Line $pos #9
			if ($pos <> 2)
				setVar $ShipData_Valid FALSE
				return
			end
			cutText $Line $temp 1 1
			setVar $ShipList[$i] $temp
			cutText $Line $Line2 3 999
			SetVar $Line $line2
			#stripText $Line $temp & #9

			getWordPos $Line $pos #9
			if ($pos = 0)
				setVar $ShipData_Valid FALSE
				return
			end
			cutText $Line $temp1 1 ($pos - 1)
			setVar $ShipList[$i][1] $temp1
			stripText $Line $temp1 & #9

			getWordPos $Line $pos #9
			if ($pos = 0)
				setVar $ShipData_Valid FALSE
				return
			end
			cutText $Line $temp2 1 ($pos - 1)
			setVar $ShipList[$i][2] $temp2
			stripText $Line $temp2 & #9

			setVar $ShipList[$i][3] $Line

	        :NextRealLine
	        add $i 1
	        read $Ships_File $Line $i
		end
		setVar $ShipData_Valid TRUE
	else
		setVar $ShipData_Valid FALSE
	end
	return


:ParseShipData
	#[]Ship Letter [Ship Name][Cost][ANSI Ship Name]
	delete $Ships_File
	setVar $i 0
	send "S B N Y ?"
	waitfor "Which ship are you interested in "
	setTextLineTrigger NextPage		:NextPage "<+> Next Page"
	:NextPageReset
	setTextLineTrigger Quit2Leave	:Quit2Leave "<Q> To Leave"
	:LineTrigNext
	setTextLineTrigger LineTrig		:LineTrig
	pause
	:NextPage
		killAllTriggers
		add $i 1
		setVar $ShipList[$i] "+"
		setVar $ShipList[$i][1] "This Inidcates"
		setVar $ShipList[$i][2] "Another"
		setVar $ShipList[$i][3] "Page is availble for display"
		send "+"
		waitfor "Which ship are you interested in "
		setTextLineTrigger LineTrig		:LineTrig
		setTextLineTrigger NextPage		:Quit2Leave "<+> Next Page"
		setTextLineTrigger Quit2Leave	:Quit2Leave "<Q> To Leave"
		pause
	:Quit2Leave
		killAllTriggers
		send " Q Q "
		waitfor "<StarDock> Where to? (?="
		delete $tstFile
		setVar $ii 1
		while ($ii <= $i)
			write $Ships_File $ShipList[$ii] & #9 & $ShipList[$ii][1] & #9 & $ShipList[$ii][2] & #9 & $ShipList[$ii][3]
	    	add $ii 1
		end
		return
	:LineTrig
		setVar $temp CURRENTLINE & "@@@"

		if ($temp <> "@@@")
			getWordPos $temp $pos "<"
			if ($pos = 1)
				getWordPos $temp $pos "<Q>"
				if ($pos = 0)
					add $i 1
					GetText $temp $ShipList[$i] "<" ">"
					GetText $temp $ShipList[$i][1] "> " "   "
					GetText $temp $ShipList[$i][2] "   " "@@@"
					stripText $ShipList[$i][2] " "
					GetText CURRENTANSILINE  $ShipList[$i][3] "[35m> " "    "
				end
			end
		end
		goto :LineTrigNext


:DisplayMenu
	#Array Format [X]Ship Letter [Ship Name][Cost][ANSI Ship Name]
	setVar $LineWidthMax 45
	setVar $PAGES_EXIST FALSE
	setVar $NumberOfShip ""
	setVar $i 1
	Echo #27 & "[2J"
	:NextPagePlease
	Echo "***"
	echo "   " & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-"
	echo ANSI_14 & "*        LoneStar's StarDock Shopper"
	echo ANSI_15 & "*          Emporium Daily Specials"
	echo ANSI_8 & "*                Version " & $CURENT_VERSION & "*"
	echo "   " & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-"
	echo "*"
	setArray $MenuSelections $ShipListMax
	while ($ShipList[$i] <> 0)
		if ($ShipList[$i] <> "+")
			setVar $Spaces $LineWidthMax
			setVar $ANSI_Line "  " & ANSI_5 & "<" & ANSI_6 & $ShipList[$i] & ANSI_5 & "> "

            setVar $temp $ShipList[$i][2]
            stripText $temp ","
            stripText $temp " "

			if ($temp <= $CREDITS)
				setVar $CANTAFFORDiT FALSE
			else
				setVar $CANTAFFORDiT TRUE
			end
			# Work out Length of ShipName
			getLength $ShipList[$i][1] $len
			if ($len > ($LineWidthMax - 10))
				subtract $len 10
				cutText $ShipList[$i][3] $temp 1 $len
			else
				setVar $temp $ShipList[$i][3]
			end

			setVar $ANSI_Line $ANSI_Line & $temp
			subtract $Spaces $len
			# Ship cost padding
			getLength $ShipList[$i][2] $len

			subtract $Spaces $len

			setVar $Spacer ""
			while ($Spaces > 0)
				setVar $Spacer $Spacer & " "
				subtract $Spaces 1
			end

			if ($CANTAFFORDiT)
				setVar $ANSI_Line $ANSI_Line & $Spacer & ANSI_7 & $ShipList[$i][2] & "*"
			else
				setVar $ANSI_Line $ANSI_Line & $Spacer & ANSI_14 & $ShipList[$i][2] & "*"
				setVar $MenuSelections[$i] $ShipList[$i]
			end

            echo $ANSI_Line
		else
			setVar $PAGES_EXIST TRUE
			SetVar $PageIDX $i
			goto :PageDone
		end
		add $i 1
	end
	:PageDone
	echo ANSI_9 & "*          Cash On Hand    " & ANSI_14 & ": "
	setVar $CashAmount $CREDITS
	gosub :CommaSize
	echo ANSI_7 & "$" & $CashAmount
	echo "*"
	if ($PAGES_EXIST)
		Echo "  " & ANSI_5 & "<" & ANSI_6 & "+" & ANSI_5 & ">" & ANSI_6 & " NextPage*"
	end
	Echo "  " & ANSI_5 & "<" & ANSI_6 & "Q" & ANSI_5 & ">" & ANSI_6 & " To Leave*"
	Echo "*"
	:MakingAnotherSlection
	Echo "  " & ANSI_5 & "Which ship are you interested in ? "
	getConsoleInput $selection SINGLEKEY
	upperCase $selection
	if ($selection = "Q")
		return
	elseif (($PAGES_EXIST) AND ($selection = "+"))
    	if ($i = $PageIDX)
    		setVar $PageTwoSelected TRUE
	    	add $i 1
    	else
    		setVar $PageTwoSelected FALSE
    		setVar $i 1
	    end
    	goto :NextPagePlease
	else
    	setVar $ptr 1

        while ($ptr <= $ShipListMax)
			if ($MenuSelections[$ptr] <> 0)
	        	if ($MenuSelections[$ptr] = $selection)
	        		setPrecision 0
		       		setVar $NumberOfShip ""
	    			setVar $temp $ShipList[$ptr][2]
	    			stripText $temp ","
	    			stripText $temp " "
	    			setVar $temp ($CREDITS / $temp)
	    			:InputAnotherAmount
	            	getInput $NumberOfShip "  " & ANSI_5 & "How Many " & $ShipList[$ptr][1] & "'s (" & ANSI_15 & "0" & ANSI_5 & " to " & ANSI_15 & $temp & ANSI_5 & ") ?"
					isNumber $test $NumberOfShip
					if ($test = 0)
						goto :InputAnotherAmount
					end
					if (($NumberOfShip < 0) OR ($NumberOfShip > $temp))
						setVar $NumberOfShip 0
						setVar $_Trickster ""
						goto :InputAnotherAmount
					end

	                if ($NumberOfShip = 0)
						setVar $_Trickster ""
					else
						if ($PageTwoSelected)
		                	setVar $_Trickster "+" & $selection & "^^" & $ShipList[$ptr][2] & "@@" & $ShipList[$ptr][3] & "!!"
		                else
		                	setVar $_Trickster $selection & "^^" & $ShipList[$ptr][2] & "@@" & $ShipList[$ptr][3] & "!!"
		                end

						getInput $CustomShipName "  " & ANSI_5 & "What do you want to name this ship? (30 chars) "
						if ($CustomShipName = "")
	                        setVar $CustomShipName $Ships_Names
	                    else
	                    	setVar $CustomShipNameTEST $CustomShipName
							stripText $CustomShipNameTEST " "
							if ($CustomShipNameTEST = "")
								setVar $CustomShipName $Ships_Names
							else
		                    	getLength $CustomShipName $len
		                    	if ($len > 30)
									cutText $CustomShipName $CustomShipName 1 30
		                    	end
		                    end
	                    end
					end
					return
				end
			end
			add $ptr 1
		end
	end
	#  Array Format [X]Ship Letter [Ship Name][Cost][ANSI Ship Name]
	Echo "*"
	Echo #27 & "[1A" & #27 & "[2K"
   	goto :MakingAnotherSlection
	return


	#=----------------------------------------------------------------------------------------------------------------
:BuyShip
	getWordPos $_Trickster $Pos "^^"
	if ($pos = 0)
		echo "**" & ANSI_14 & "Uh Oh" & ANSI_15 " -  What To Do, What To Do...**"
		halt
	end

	cuttext $_Trickster $SelectedShip 1 ($pos - 1)
	stripText $SelectedShip " "
	stripText $SelectedShip "^"

	send "S B N Y " & $SelectedShip & "Y"
	setTextLineTrigger NotEnoughCash	:NotEnoughCash "You can not afford it!"
	setTExtLineTrigger NotEnoughEXP		:NotEnoughEXP "Hey!  You need at least "
	setTextTrigger MakeShipCorp			:MakeShipCorp "Should this be a (C)orporate ship or (P)ersonal ship?"
	setTextLineTrigger NameTheShip		:NameTheShip "What do you want to name this ship?"
	setTextLineTrigger ShipsBoughtOut	:ShipsBoughtOut "Well if that don't beat all, looks like we don't have anymore ships"
	pause
	:ShipsBoughtOut
		killAllTriggers
		send " * Q Q "
		waitfor "<StarDock> Where to?"
		echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - The Maximum Allowable Number of Ships Has Been Reached!**"
		setVar $NewShipNumber 0
		return
	:NotEnoughEXP
		killAllTriggers
		send " Q Q "
		waitfor "<StarDock> Where to?"
		echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Not Enough Experience**"
		halt

	:NotEnoughCash
		killAllTriggers
		send " Q Q "
		waitfor "<StarDock> Where to?"
		echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Purchase Failed, Unknown Reason!**"
		halt

    :MakeShipCorp
    	send "C"
		pause
	:NameTheShip
		killAllTriggers
		getRnd $RegistryNumber 100000 999999
		send "LSDREG#" & $RegistryNumber & "*N * S"
		setTextLineTrigger PurchasedFailed 		:PurchasedFailed "You do not own any other ships orbiting the Stardock!"
		setTextLineTrigger GetNewShipNumber		:GetNewShipNumber " " & STARDOCK & " " & "LSDREG#" & $RegistryNumber
		setTextTrigger GotNewShipNumber			:GotNewShipNumber "Choose which ship to sell "
		pause

	:PurchasedFailed
		killAllTriggers
		send " Q "
		waitfor "<StarDock> Where to?"
		echo "**" & ANSI_14 & "No Ship" & ANSI_15 & " - Purchase Failed**"
		setVar $NewShipNumber 0
		halt
	:GotNewShipNumber
		killAllTriggers
		#send " Q "
		send " Q Q Q Z N * X   " & $NewShipNumber & "*  *  P S S R Y " & $CustomShipName & "* Y Q "
		waitfor "<StarDock> Where to?"
		echo "**" & ANSI_14 & "Purchase Success" & ANSI_15 & " - New Ship Number is " & ANSI_7 & $NewShipNumber & "**"
		return

	:GetNewShipNumber
		killTrigger GetNewShipNumber
		killTrigger PurchasedFailed
		setVar $CURLINE CURRENTLINE
		getWordPos $CURLINE $pos " " & STARDOCK
		if ($pos = 0)
			send " Q "
			waitfor "<StarDock> Where to?"
			echo "**" & ANSI_14 & "No Ship" & ANSI_15 & " - Purchase Failed**"
			halt
		end
		cutText $CURLINE $NewShipNumber 1 $pos
		stripText $NewShipNumber " "
		pause


:CN1_AND_CN9_CHECKING
	#=---------------- CN1 Check ---------------------------------
	# Done at beginning of script
	#getWordPos CURRENTANSILINE $pos #27
	#if ($pos = 0)
	#	send " c n 1 q q "
	#	waitfor "Command [TL="
	#end
	#=---------------- CN9 Check ---------------------------------
	if ($location = "Command")
		send "?d"
		setTextTrigger ALLKEYS_OFF	:ALLKEYS_OFF "=-=-=-=-=-=-=-="
		setTextTrigger ALLKEY_ON	:ALLKEY_ON "Warps to Sector(s) : "
	else
		send "sn**"
		setTextTrigger ALLKEYS_OFF	:ALLKEYS_OFF "Warps to Sector(s) : "
		setTextTrigger ALLKEY_ON	:ALLKEY_ON "<B> Transporter Control"
	end
	pause
	:ALLKEYS_OFF
	killTrigger ALLKEYS_OFF
	setVar $ALLKEYS_OFF TRUE
	pause
	:ALLKEY_ON
	killAllTriggers
	if ($ALLKEYS_OFF = FALSE)
		send " c n 9 q q"
		waitfor "<Computer deactivated>"
	end
	return