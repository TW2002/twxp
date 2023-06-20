# ==============================  START PLANET INFO SUBROUTINE  =================
:getPlanetInfo

	# ============================ START PLANET VARIABLES ==========================
		setVar $PLANET          0
		setVar $PLANET_FUEL     0
		setVar $PLANET_FUEL_MAX     0
		setVar $PLANET_ORGANICS     0   
		setVar $PLANET_ORGANICS_MAX 0
		setVar $PLANET_EQUIPMENT    0
		setVar $PLANET_EQUIPMENT_MAX    0
		setVar $PLANET_FIGHTERS     0
		setVar $PLANET_TRANSPORT    0
		setVar $PLANET_FIGHTERS_MAX 0
		setVar $CITADEL         0
		setVar $CITADEL_CREDITS     0
		setVar $ATMOSPHERE_CANNON   0
		setVar $SECTOR_CANNON       0
		setVar $PLANET_CLASS_NAME   "undefined"
		setVar $PLANET_NAME     "undefined"
		setVar $UNDER_CONSTRUCTION  FALSE
		setVar $MAXED_LEVEL         FALSE
	# ============================  END PLANET VARIABLES ==========================


	send "*"
	killtrigger planetInfo2
	setTextLineTrigger planetInfo2 :planetInfo2 "Planet #"
	pause

	:planetinfo2
		setVar $CITADEL 0
		setVar $SECTOR_CANNON 0
		setVar $ATMOSPHERE_CANNON 0
		setVar $CITADEL_CREDITS 0
		getWord CURRENTLINE $PLANET 2
		stripText $PLANET "#"
		getWord CURRENTLINE $PLAYER~CURRENT_SECTOR 5
		stripText $PLAYER~CURRENT_SECTOR ":"
		getWordPos CURRENTLINE $Pos ": "
		cutText CURRENTLINE $PLANET_NAME ($Pos + 2) 999
		savevar $planet
		savevar $player~current_sector
		setSectorParameter $PLANET "PSECTOR" $PLAYER~CURRENT_SECTOR

		setTextLineTrigger class :getclass "Class "
		pause
	:getclass
		setVar $PLANET_CLASS_NAME CURRENTLINE
		waitfor "2 Build 1   Product    Amount     Amount     Maximum"

		gosub :killplanettriggers

		:getPlanetStuff
		setTextLineTrigger fuelstart :fuelstart "Fuel Ore"
		setTextLineTrigger orgstart :orgstart "Organics"
		setTextLineTrigger equipstart :equipstart "Equipment"
		setTextLineTrigger figstart :figstart "Fighters        N/A"
		setTextLineTrigger tport    :planettport    "-=-=-=-=-=- TransPort power ="
		setTextLineTrigger shields :PlanetShields "Planetary Defense Shielding Power Level ="
		setTextLineTrigger citadelstart :citadelstart "Planet has a level"
		setTextLineTrigger cannon :cannonstart ", AtmosLvl="
		#setTextTrigger citExists :citExists "Citadel, treasury"
		setTextTrigger maxedIG :maxedIG "Planetary Interdictor Generator ="
		setTextTrigger underConst :underConst "under construction,"
		setTextTrigger planetInfoDone :planetInfoDone "Planet command (?=help)"
		pause

		:underConst
			setvar $under_construction true
			pause

		:maxedIG
			setvar $maxed_level true
			pause
			
		:planettport
		getText CURRENTLINE $Planet_TPad "power =" "hops -"
		stripText $Planet_TPad ","
		stripText $Planet_TPad " "
		isNumber $tst $Planet_TPad
		if ($tst = 0)
			setVar $Planet_TPad 0
		end
		setvar $PLANET_TRANSPORT $Planet_TPad
		pause

		:PlanetShields
		getWord CURRENTLINE $Planet_Shields 8
		stripText $Planet_Shields ","
		isNumber $tst $Planet_Shields
		if ($tst = 0)
			setVar $Planet_Shields 0
		end
		pause

		:fuelstart
		getWord CURRENTLINE $PLANET_FUEL_COLONISTS 3
		getWord CURRENTLINE $PLANET_FUEL 6
		getWord CURRENTLINE $PLANET_FUEL_MAX 8
		getWord CURRENTLINE $planetfuel 6
		getWord CURRENTLINE $planetfuelmax 8
		stripText $planetfuel ","
		stripText $planetfuelmax ","
		stripText $PLANET_FUEL ","
		stripText $PLANET_FUEL_MAX ","
		stripText $PLANET_FUEL_COLONISTS ","
		pause

		:orgstart
		getWord CURRENTLINE $PLANET_ORGANICS_COLONISTS 2
		getWord CURRENTLINE $PLANET_ORGANICS 5
		getWord CURRENTLINE $PLANET_ORGANICS_MAX 7
		getWord CURRENTLINE $planetorg 5
		getWord CURRENTLINE $planetorgmax 7
		stripText $planetorg ","
		stripText $planetorgmax ","
		stripText $PLANET_ORGANICS ","
		stripText $PLANET_ORGANICS_MAX ","
		stripText $PLANET_ORGANICS_COLONISTS ","
		pause

		:equipstart
		getWord CURRENTLINE $PLANET_EQUIPMENT_COLONISTS 2
		getWord CURRENTLINE $PLANET_EQUIPMENT 5
		getWord CURRENTLINE $PLANET_EQUIPMENT_MAX 7
		getWord CURRENTLINE $planetequip 5
		getWord CURRENTLINE $planetequipmax 7
		stripText $planetequip ","
		stripText $planetequipmax ","
		stripText $PLANET_EQUIPMENT ","
		stripText $PLANET_EQUIPMENT_MAX ","
		stripText $PLANET_EQUIPMENT_COLONISTS ","
		pause

		:figstart
		getWord CURRENTLINE $PLANET_FIGHTERS 5
		getWord CURRENTLINE $PLANET_FIGHTERS_MAX 7
		stripText $PLANET_FIGHTERS ","
		stripText $PLANET_FIGHTERS_MAX ","
		pause

		:citadelstart
		getWord CURRENTLINE $CITADEL 5
		getWord CURRENTLINE $CITADEL_CREDITS 9
		striptext $CITADEL_CREDITS ","
		pause

	:cannonstart
		getWord CURRENTLINE $MILITARYREACTION 2
		getWord CURRENTLINE $ATMOSPHERE_CANNON 5
		getWord CURRENTLINE $SECTOR_CANNON 6
		stripText $MILITARYREACTION "reaction="
		striptext $MILITARYREACTION "%"
		stripText $SECTOR_CANNON "SectLvl="
		striptext $SECTOR_CANNON "%"
		stripText $ATMOSPHERE_CANNON "AtmosLvl="
		striptext $ATMOSPHERE_CANNON "%"
		striptext $ATMOSPHERE_CANNON ","
		pause
	:planetInfoDone
		gosub :killplanettriggers
	
		setVar $currentBotPlanet $PLANET
		saveVar $currentBotPlanet
		saveVar $planet_fighters
		savevar $player~CURRENT_SECTOR 
		savevar $PLANET      
		savevar $PLANET_FUEL     
		savevar $PLANET_FUEL_MAX     
		savevar $PLANET_ORGANICS        
		savevar $PLANET_ORGANICS_MAX 
		savevar $PLANET_EQUIPMENT    
		savevar $PLANET_EQUIPMENT_MAX    
		savevar $PLANET_FIGHTERS     
		savevar $PLANET_SHIELDS     
		savevar $PLANET_TRANSPORT    
		savevar $PLANET_FIGHTERS_MAX 
		savevar $CITADEL         
		savevar $CITADEL_CREDITS     
		savevar $ATMOSPHERE_CANNON   
		savevar $SECTOR_CANNON       
		savevar $PLANET_CLASS_NAME   
		savevar $PLANET_NAME     
		savevar $UNDER_CONSTRUCTION  
		savevar $MAXED_LEVEL      


return
# ==============================  END PLANET INFO SUBROUTINE  =================


:killplanettriggers
	killtrigger fuelstart 
	killtrigger orgstart 
	killtrigger equipstart
	killtrigger figstart
	killtrigger tport
	killtrigger shields
	killtrigger citadelstart
	killtrigger cannon
	killtrigger citExists
	killtrigger maxedIG
	killtrigger underConst
	killtrigger planetInfoDone
return