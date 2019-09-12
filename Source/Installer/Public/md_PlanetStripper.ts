# MD Planet Stripper
	reqRecording
	logging off
	cutText CURRENTLINE $location 1 12
	if ($location <> "Command [TL=")
	        echo ANSI_6 "*[" ANSI_14 "This script must be run from the Command Prompt" ANSI_6 "]*" ANSI_7
		halt
	end
	
	send "djy"

	goSub :get_stats

	if (SECTOR.PLANETCOUNT[$currentSector] <= 1)
		echo ANSI_6 "*[" ANSI_14 "This script must be run with at least two planets in the sector" ANSI_6 "]*" ANSI_7
		halt
	end
	gosub :countPlanets
	gosub :clearScreen

:menu_info
	loadVar $MDProductMoverSaved
	if ($MDProductMoverSaved)
		loadVar $emptyFuel
		loadVar $emptyOrganics
		loadVar $emptyEquipment
		loadVar $emptyFuelColonists
		loadVar $emptyOrganicColonists
		loadVar $emptyEquipmentColonists
	else 
		setVar $emptyFuel FALSE
		setVar $emptyOrganics FALSE
		setVar $emptyEquipment FALSE
		setVar $emptyFuelColonists FALSE
		setVar $emptyOrganicColonists FALSE
		setVar $emptyEquipmentColonists FALSE
		
		saveVar $emptyFuel
		saveVar $emptyOrganics
		saveVar $emptyEquipment
		saveVar $emptyFuelColonists
		saveVar $emptyOrganicColonists
		saveVar $emptyEquipmentColonists
		
		setVar $MDProductMoverSaved TRUE
		saveVar $MDProductMoverSaved
	end

	addMenu "" "MDProductMover" ANSI_14&"MD Planet Stripper Options"&ANSI_7 "." "" "Main" FALSE
	addMenu "MDProductMover" "Go" ANSI_15&"Start Mover" "G" :Menu_Go "" TRUE
	addMenu "MDProductMover" "Fill" ANSI_15&"Planet to Fill             " "1" :Menu_Fill "" False
	addMenu "MDProductMover" "Empty" ANSI_15&"Planet(s) to Empty         " "2" :Menu_Empty "" False
	addMenu "MDProductMover" "Fuel" ANSI_15&"  Fuel                     " "3" :Menu_Fuel "" FALSE
	addMenu "MDProductMover" "Organics" ANSI_15&"  Organics                 " "4" :Menu_Organics "" FALSE
	addMenu "MDProductMover" "Equipment" ANSI_15&"  Equipment                " "5" :Menu_Equipment "" FALSE
	addMenu "MDProductMover" "FuelColonists" ANSI_15&"  Fuel Colonists           " "6" :Menu_FuelColonists "" FALSE
	addMenu "MDProductMover" "OrganicColonists" ANSI_15&"  Organic Colonists        " "7" :Menu_OrganicColonists "" FALSE
	addMenu "MDProductMover" "EquipmentColonists" ANSI_15&"  Equipment Colonists      " "8" :Menu_EquipmentColonists "" FALSE
	
	setMenuHelp "Go" "Starts the script."
	setVar $fillIndex 1
	setVar $emptyIndex 0
	gosub :sub_setmenu
	setMenuOptions "MDProductMover" FALSE FALSE FALSE
	echo ANSI_13
	openMenu "MDProductMover"

:Menu_Fill
	gosub :clearScreen
	if ($fillIndex < $planetCount)
		add $fillIndex 1
	else
		setVar $fillIndex 1
	end
	if ($emptyIndex = $fillIndex)
		add $fillIndex 1
		if ($fillIndex > $planetCount)
			setVar $fillIndex 1
		end
	end
	gosub :sub_setmenu
	gosub :clearScreen
	openMenu "MDProductMover"

:Menu_Empty
	gosub :clearScreen
	if ($emptyIndex < $planetCount)
		add $emptyIndex 1
	else
		setVar $emptyIndex 0
	end
	if ($emptyIndex = $fillIndex)
		add $emptyIndex 1
		if ($emptyIndex > $planetCount)
			setVar $emptyIndex 0
		end
	end
	gosub :sub_setmenu
	gosub :clearScreen
	openMenu "MDProductMover"

:Menu_Fuel
	gosub :clearScreen
	if ($emptyFuel)
		setVar $emptyFuel FALSE
	else
		setVar $emptyFuel TRUE
	end
	
	gosub :sub_setmenu
	gosub :clearScreen
	openMenu "MDProductMover"

:Menu_Organics
	gosub :clearScreen
	if ($emptyOrganics)
		setVar $emptyOrganics FALSE
	else
		setVar $emptyOrganics TRUE
	end
	
	gosub :sub_setmenu
	gosub :clearScreen
	openMenu "MDProductMover"

:Menu_Equipment
	gosub :clearScreen
	if ($emptyEquipment)
		setVar $emptyEquipment FALSE
	else
		setVar $emptyEquipment TRUE
	end
	
	gosub :sub_setmenu
	gosub :clearScreen
	openMenu "MDProductMover"

:Menu_FuelColonists
	gosub :clearScreen
	if ($emptyFuelColonists)
		setVar $emptyFuelColonists FALSE
	else
		setVar $emptyFuelColonists TRUE
	end
	
	gosub :sub_setmenu
	gosub :clearScreen
	openMenu "MDProductMover"

:Menu_OrganicColonists
	gosub :clearScreen
	if ($emptyOrganicColonists)
		setVar $emptyOrganicColonists FALSE
	else
		setVar $emptyOrganicColonists TRUE
	end
	
	gosub :sub_setmenu
	gosub :clearScreen
	openMenu "MDProductMover"

:Menu_EquipmentColonists
	gosub :clearScreen
	if ($emptyEquipmentColonists)
		setVar $emptyEquipmentColonists FALSE
	else
		setVar $emptyEquipmentColonists TRUE
	end
	
	gosub :sub_setmenu
	gosub :clearScreen
	openMenu "MDProductMover"


:sub_setMenu
	setMenuValue "Fill" ANSI_14&"#"&$planets[$fillIndex]&", "&ANSI_15&SECTOR.PLANETS[$currentSector][$fillIndex]&ANSI_7
	if ($emptyIndex <= 0)
		setMenuValue "Empty" ANSI_14&"All"&ANSI_7
	else
		setMenuValue "Empty" ANSI_14&"#"&$planets[$emptyIndex]&", "&ANSI_15&SECTOR.PLANETS[$currentSector][$emptyIndex]&ANSI_7
	end
	saveVar $planetToFill
	saveVar $planetToEmpty
	saveVar $emptyFuel
	saveVar $emptyOrganics
	saveVar $emptyEquipment
	saveVar $emptyOrganicColonists
	saveVar $emptyEquipmentColonists
	saveVar $emptyFuelColonists
	
	if ($emptyFuel)
		setMenuValue "Fuel" ANSI_14&"Yes"&ANSI_7
	else
		setMenuValue "Fuel" ANSI_14&"No"&ANSI_7
	
	end
	if ($emptyOrganics)
		setMenuValue "Organics" ANSI_14&"Yes"&ANSI_7
	else
		setMenuValue "Organics" ANSI_14&"No"&ANSI_7
	
	end
	if ($emptyEquipment)
		setMenuValue "Equipment" ANSI_14&"Yes"&ANSI_7
	else
		setMenuValue "Equipment" ANSI_14&"No"&ANSI_7
	
	end
	if ($emptyFuelColonists)
		setMenuValue "FuelColonists" ANSI_14&"Yes"&ANSI_7
	else
		setMenuValue "FuelColonists" ANSI_14&"No"&ANSI_7
	
	end
	if ($emptyOrganicColonists)
		setMenuValue "OrganicColonists" ANSI_14&"Yes"&ANSI_7
	else
		setMenuValue "OrganicColonists" ANSI_14&"No"&ANSI_7
	
	end
	if ($emptyEquipmentColonists)
		setMenuValue "EquipmentColonists" ANSI_14&"Yes"&ANSI_7
	else
		setMenuValue "EquipmentColonists" ANSI_14&"No"&ANSI_7
	
	end
return

:Menu_Go
	
:startUpMessage
	setVar $planetToFill $planets[$fillIndex]
	if ($emptyIndex > 0)
		setVar $planetCount 1
		setVar $planets[1] $planets[$emptyIndex]
	end
	send "'[MD Planet Stripper Powering Up!  Filling Planet "&$planetToFill&"]*"
	
:startFilling
	setVar $i 1
	setVar $countFuel 0
	setVar $countOrganics 0
	setVar $countEquipment 0
	setVar $countColonists 0
	setVar $coloType 1
	:lookUpPlanetStats
		send "l "&$planetToFill&"*"
		killAllTriggers
		setTextLineTrigger wrongPlanet :badPlanet "That planet is not in this sector."
		setTextLineTrigger badPlanet :badPlanet "Invalid registry number, landing aborted."
		setTextLineTrigger goodPlanet :goodPlanet "Claimed by:"
		pause
	:badPlanet
		killAllTriggers
		send "q*"
		echo ansi_12 "*[Planet #"&$planetToFill&" is not valid for this sector]*" ANSI_7
		halt	
	:goodPlanet
		killAllTriggers
		waiton "Fuel Ore"
		getWord CURRENTLINE $currentFuelColos 3
		stripText $currentFuelColos ","
		getWord CURRENTLINE $currentFuel 6
		stripText $currentFuel ","
		waiton "Organics"
		getWord CURRENTLINE $currentOrganicColos 2
		stripText $currentOrganicColos ","
		getWord CURRENTLINE $currentOrganics 5
		stripText $currentOrganics ","
		waiton "Equipment"
		getWord CURRENTLINE $currentEquipmentColos 2
		stripText $currentEquipmentColos ","
		getWord CURRENTLINE $currentEquipment 5
		stripText $currentEquipment ","
		
		send "q "
	while ($i <= $planetCount)
		if ($planetToFill <> $planets[$i])
			:tryFuel
				killAllTriggers
				if ($emptyFuel)
					send "l "&$planets[$i]&"* tnt1*q l "&$planetToFill&"* tnl1*q "
					setTextTrigger fuelSuccess :tryFuel "You load the "				
					setTextTrigger fuelEmpty :tryOrganics "There aren't that many "
					setTextTrigger fuelFull :emptyFuel "They don't have room for that many "
					pause
				end
			:emptyFuel
				send "jy "
			:tryOrganics
				killAllTriggers
				if ($emptyOrganics)
					send "l "&$planets[$i]&"* tnt2*q l "&$planetToFill&"* tnl2*q "
					setTextTrigger success :tryOrganics "You load the "
					setTextTrigger emptyEmpty :tryEquipment "There aren't that many "
					setTextTrigger fullFill :emptyOrganics "They don't have room for that many "
					pause
				end
			:emptyOrganics
				send "jy "
			:tryEquipment
				killAllTriggers
				if ($emptyEquipment)
					send "l "&$planets[$i]&"* tnt3*q l "&$planetToFill&"* tnl3*q "
					setTextTrigger success :tryEquipment "You load the "
					setTextTrigger emptyEmpty :tryFuelColonists "There aren't that many "
					setTextTrigger fullFill :emptyEquipment "They don't have room for that many "
					pause
				end
			:emptyEquipment
				send "jy "
			:tryFuelColonists
				killAllTriggers
				if ($emptyFuelColonists)
					send "l "&$planets[$i]&"* snt1*q l "&$planetToFill&"* snl"&$coloType&"*q "
					setTextTrigger success :tryFuelColonists "The Colonists disembark to "
					setTextTrigger emptyEmpty :switchFuel "There isn't room on the planet"
					setTextTrigger fullFill :tryOrganicColonists "They don't have room for that many "
					setTextTrigger empty :emptyFColonists  "There aren't that many on the planet!"
					pause
					:switchFuel
						killAllTriggers
						add $coloType 1
						if ($coloType >= 4)
							goto :doneWithThisPlanet
						end
						goto :tryFuelColonists
				end
			:emptyFColonists
				send "jy "
			:tryOrganicColonists
				killAllTriggers
				if ($emptyOrganicColonists)
					send "l "&$planets[$i]&"* snt2*q l "&$planetToFill&"* snl"&$coloType&"*q "
					setTextTrigger success :tryOrganicColonists "The Colonists disembark to "
					setTextTrigger emptyEmpty :switchOrganics "There isn't room on the planet"
					setTextTrigger fullFill :tryEquipmentColonists "They don't have room for that many "
					setTextTrigger empty :emptyOColonists "There aren't that many on the planet!"
					pause
					:switchOrganics
						killAllTriggers
						add $coloType 1
						if ($coloType >= 4)
							goto :doneWithThisPlanet
						end
						goto :tryOrganicColonists
				end
			:emptyOColonists
				send "jy "
			:tryEquipmentColonists
				killAllTriggers
				if ($emptyEquipmentColonists)
					send "l "&$planets[$i]&"* snt3*q l "&$planetToFill&"* snl"&$coloType&"*q "
					setTextTrigger success :tryEquipmentColonists "The Colonists disembark to "
					setTextTrigger emptyEmpty :switchEquipment "There isn't room on the planet"
					setTextTrigger fullFill :doneWithThisPlanet "They don't have room for that many "
					setTextTrigger empty :doneWithThisPlanet "There aren't that many on the planet!"
					pause
					:switchEquipment
						killAllTriggers
						add $coloType 1
						if ($coloType >= 4)
							goto :doneWithThisPlanet
						end
						goto :tryEquipmentColonists
				end
				
			:doneWithThisPlanet
		end
			
		add $i 1
	end
	:lookUpPlanetStats2
		send "l "&$planetToFill&"*"
		killAllTriggers
		setTextLineTrigger wrongPlanet :badPlanet2 "That planet is not in this sector."
		setTextLineTrigger badPlanet :badPlanet2 "Invalid registry number, landing aborted."
		setTextLineTrigger goodPlanet :goodPlanet2 "Claimed by:"
		pause
	:badPlanet2
		killAllTriggers
		send "q*"
		echo ansi_12 "*[Planet #"&$planetToFill&" is not valid for this sector]*" ANSI_7
		halt	
	:goodPlanet2
		killAllTriggers
		waiton "Fuel Ore"
		getWord CURRENTLINE $newFuelColos 3
		stripText $newFuelColos ","
		getWord CURRENTLINE $newFuel 6
		stripText $newFuel ","
		waiton "Organics"
		getWord CURRENTLINE $newOrganicColos 2
		stripText $newOrganicColos ","
		getWord CURRENTLINE $newOrganics 5
		stripText $newOrganics ","
		waiton "Equipment"
		getWord CURRENTLINE $newEquipmentColos 2
		stripText $newEquipmentColos ","
		getWord CURRENTLINE $newEquipment 5
		stripText $newEquipment ","
		
		send "q "
	gosub :endReport
	send "/"
	waitOn #179
	echo ANSI_6 "*[" ANSI_14 "MD Planet Stripper Shutting Down" ANSI_6 "]*" ANSI_7
	halt

:clearScreen
	echo #27 & "[2J"
	return

# -=-=-=-=- quikstats -=-=-=-=-=-=-
:get_stats
	

     killalltriggers
     setTextLineTrigger statlinetrig :statsline #179
     setVar $stats ""
     setVar $wordy ""
     send "/"
     pause

:statsline
     killalltriggers
     setVar $line2 CURRENTLINE
     replacetext $line2 #179 " "
     striptext $line2 ","
     setVar $stats $stats & $line2
     getWordPos $line2 $pos "Hlds"
     if ($pos > 0)
	  goto :gotStats
     else
          setTextLineTrigger getLine2 :statsline 
     end
     pause

:gotStats
     killalltriggers
     setVar $stats $stats & " @@@"
     upperCase $stats
     setVar $current_word 0
     while ($wordy <> "@@@")
          if ($wordy = "SECT")
               getWord $stats $currentSector   ($current_word + 1)
          elseif ($wordy = "TURNS")
               getWord $stats $turns  ($current_word + 1)
          elseif ($wordy = "CREDS")
               getWord $stats $credits  ($current_word + 1)
          elseif ($wordy = "HLDS")
               getWord $stats $holds   ($current_word + 1)
          end
          add $current_word 1
          getWord $stats $wordy $current_word
     end
return

:countPlanets

	setVar $planetCount 0
	killalltriggers
	setTextLineTrigger planetGrabber :planetline "   <"
	setTextLineTrigger beDone :done "Land on which planet "
	send "lq*"
	pause
	:planetline
		killalltriggers
		setVar $line CURRENTLINE
		replacetext $line "<" " "
		replacetext $line ">" " "
		striptext $line ","
		add $planetCount 1
		getWord $line $planets[$planetCount] 1
		setTextLineTrigger getLine2 :planetline "   <"
		setTextLineTrigger getEnd :done "Land on which planet "
		pause
	:done
return

:endReport
	setVar $formattedCountFuel ""
	setVar $countFuel ($newFuel - $currentFuel)
	getLength $countFuel $length
	while ($length > 3)
		cutText $countFuel $snippet $length-2 9999
		cutText $countFuel $countFuel 1 $length-3
		getLength $countFuel $length
		setVar $formattedCountFuel ","&$snippet&$formattedCountFuel
	end
	setVar $formattedCountFuel $countFuel&$formattedCountFuel
	
	setVar $formattedCountOrganics ""
	setVar $countOrganics ($newOrganics - $currentOrganics)
	getLength $countOrganics $length
	while ($length > 3)
		cutText $countOrganics $snippet $length-2 9999
		cutText $countOrganics $countOrganics 1 $length-3
		getLength $countOrganics $length
		setVar $formattedCountOrganics ","&$snippet&$formattedCountOrganics
	end
	setVar $formattedCountOrganics $countOrganics&$formattedCountOrganics
	
	setVar $formattedCountEquipment ""
	setVar $countEquipment ($newEquipment - $currentEquipment)
	getLength $countEquipment $length
	while ($length > 3)
		cutText $countEquipment $snippet $length-2 9999
		cutText $countEquipment $countEquipment 1 $length-3
		getLength $countEquipment $length
		setVar $formattedCountEquipment ","&$snippet&$formattedCountEquipment
	end
	setVar $formattedCountEquipment $countEquipment&$formattedCountEquipment
	
	setVar $formattedCountColonists ""
	setVar $countColonists ($newFuelColos - $currentFuelColos)
	add $countColonists ($newOrganicColos - $currentOrganicColos)
	add $countColonists ($newEquipmentColos - $currentEquipmentColos)
	getLength $countColonists $length
	while ($length > 3)
		cutText $countColonists $snippet $length-2 9999
		cutText $countColonists $countColonists 1 $length-3
		getLength $countColonists $length
		setVar $formattedCountColonists ","&$snippet&$formattedCountColonists
	end
	setVar $formattedCountColonists $countColonists&$formattedCountColonists
	
	send "'*[MD Planet Stripper - Completion Report]*"	
	if ($emptyFuel)
		send "  Fuel Ore  Moved: "&$formattedCountFuel&" Holds*"
	end
	if ($emptyOrganics)
		send "  Organics  Moved: "&$formattedCountOrganics&" Holds*"
	end
	if ($emptyEquipment)
		send "  Equipment Moved: "&$formattedCountEquipment&" Holds*"
	end
	if ($emptyFuelColonists OR $emptyOrganicColonists OR $emptyEquipmentColonists)
		send "  Colonists Moved: "&$formattedCountColonists&" Holds*"
	end
	send  "[MD Planet Stripper - Completion Report]**"
return

:nextColoType
	killAllTriggers
	add $coloType 1
	if ($coloType >= 4)
		goto :halt
	end
return