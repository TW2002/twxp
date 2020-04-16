# ============================  START PLAYER INFO SUBROUTINE  =================
:getInfo
	setvar $NOFLIP  true
	setVar $PHOTONS 0
	setVar $towed ""
	setVar $SCAN_TYPE "None"
	setVar $TWARP_TYPE 0
	setVar $CORPstring "[0]"
	setVar $igstat 0
	:waitOnInfo
	send "?"
	waitOn "<!>"
		setTextLineTrigger getInfo_CN9_Check_1      :getInfo_CN9_Check "<N> Interdictor Control"
		setTextLineTrigger getInfo_CN9_Check_2      :getInfo_CN9_Check "<N> Move to NavPoint"
		setTextLineTrigger getTraderName            :getTraderName "Trader Name    :"
		setTextLineTrigger getExpAndAlign           :getExpAndAlign "Rank and Exp"
		setTextLineTrigger getCorp                  :getCorp "Corp           #"
		setTextLineTrigger getShipType              :getShipType "Ship Info      :"
		setTextLineTrigger getTPW                   :getTPW "Turns to Warp  :"
		setTextLineTrigger getSect                  :getSect "Current Sector :"
		setTextLineTrigger getTurns                 :getTurns "Turns left"
		settextlinetrigger gettow					:gettow "Tractor Beam   : ON, towing "
		setTextLineTrigger getHolds                 :getHolds "Total Holds"
		setTextLineTrigger getFighters              :getFighters "Fighters       :"
		setTextLineTrigger getShields               :getShields "Shield points  :"
		setTextLineTrigger getPhotons               :getPhotons "Photon Missiles:"
		setTextLineTrigger getScanType              :getScanType "LongRange Scan :"
		setTextLineTrigger getTwarpType1            :getTwarpType1 "  (Type 1 Jump):"
		setTextLineTrigger getTwarpType2            :getTwarpType2 "  (Type 2 Jump):"
		setTextLineTrigger getCredits               :getCredits "Credits"
		setTextLineTrigger checkig                  :checkig "Interdictor ON :"
		send "i"
		pause
	:getInfo_CN9_Check
		setvar $NOFLIP  TRUE
		pause
	:getTraderName
		killTrigger getInfo_CN9_Check_1
		killTrigger getInfo_CN9_Check_2
		setVar $TRADER_NAME CURRENTLINE
		stripText $TRADER_NAME "Trader Name    : "
		setVar $i 1
		while ($i <= $ranksLength)
			setVar $temp $ranks[$i]
			stripText $temp "31m"
			stripText $temp "36m"
			stripText $TRADER_NAME $temp&" "
			add $i 1
		end
		pause
	:gettow
			setvar $line currentline&"<<|END|>>"
			gettext $line $towed "Tractor Beam   : ON, towing " "<<|END|>>"
			pause
	:getExpAndAlign
			getWord CURRENTLINE $EXPERIENCE 5
			getWord CURRENTLINE $ALIGNMENT 7
			stripText $EXPERIENCE ","
			stripText $ALIGNMENT ","
			stripText $ALIGNMENT "Alignment="
			pause
	:getCorp
			getWord CURRENTLINE $CORP 3
			stripText $CORP ","
			setVar $CORPstring "[" & $CORP & "]"
			pause
	:getShipType
			getWordPos CURRENTLINE $shiptypeend "Ported="
			subtract $shiptypeend 18
			cutText CURRENTLINE $SHIP_TYPE 18 $shiptypeend
			pause
	:getTPW
			getWord CURRENTLINE $TURNS_PER_WARP 5
			pause
	:getSect
			getWord CURRENTLINE $CURRENT_SECTOR 4
			pause
	:getTurns
			getWord CURRENTLINE $TURNS 4
			if ($TURNS = "Unlimited")
				setVar $TURNS 65000
				setVar $unlimitedGame TRUE
			end
			saveVar $unlimitedGame
			pause
	:getHolds
		setVar $Temp (CURRENTLINE & " ")
		getText $Temp $ORE_HOLDS "Ore=" " "
		if ($ORE_HOLDS = "")
			setVar $ORE_HOLDS 0
		end
		getText $Temp $ORGANIC_HOLDS "Organics=" " "
		if ($ORGANIC_HOLDS = "")
			setVar $ORGANIC_HOLDS 0
		end
		getTExt $Temp $EQUIPMENT_HOLDS "Equipment=" " "
		if ($EQUIPMENT_HOLDS = "")
			setVar $EQUIPMENT_HOLDS 0
		end
		getTExt $Temp $COLONIST_HOLDS "Colonists=" " "
		if ($COLONIST_HOLDS = "")
			setVar $COLONIST_HOLDS 0
		end
		getText $Temp $EMPTY_HOLDS "Empty=" " "
		if ($EMPTY_HOLDS = "")
			setVar $EMPTY_HOLDS 0
		end
				pause
	:getFighters
			getWord CURRENTLINE $FIGHTERS 3
			stripText $FIGHTERS ","
			pause
	:getShields
			getWord CURRENTLINE $SHIELDS 4
			stripText $SHIELDS ","
			pause
	:getPhotons
			getWord CURRENTLINE $PHOTONS 3
			pause
	:getScanType
			getWord CURRENTLINE $SCAN_TYPE 4
			pause
	:getTwarpType1
			getWord CURRENTLINE $TWARP_1_RANGE 4
			setVar $TWARP_TYPE 1
			pause
	:getTwarpType2
			getWord CURRENTLINE $TWARP_2_RANGE 4
			setVar $TWARP_TYPE 2
			pause
	:checkig
		getWord CURRENTLINE $igstat 4
		pause
	:getCredits
		getWord CURRENTLINE $CREDITS 3
		stripText $CREDITS ","
		if ($igstat = 0)
			setVar $igstat "NO IG"
		end
	:getInfoDone
					killtrigger getExpAndAlign     
				killtrigger getCorp         
				killtrigger getShipType       
				killtrigger getTPW   
				killtrigger gettow        
				killtrigger getSect          
				killtrigger getTurns                 
				killtrigger getHolds                 
				killtrigger getFighters              
				killtrigger getShields               
				killtrigger getPhotons               
				killtrigger getScanType             
				killtrigger getTwarpType1          
				killtrigger getTwarpType2           
				killtrigger getCredits              
				killtrigger checkig          
				killtrigger getInfoDone          
				killtrigger getInfoDone2   
				killtrigger getInfo_CN9_Check_1
				killtrigger getInfo_CN9_Check_2
				
				saveVar $unlimitedGame
				
				if ($save)
					
					saveVar $CREDITS
					saveVar $FIGHTERS
					saveVar $SHIELDS
					saveVar $TOTAL_HOLDS
					saveVar $ORE_HOLDS
					saveVar $ORGANIC_HOLDS
					saveVar $EQUIPMENT_HOLDS
					saveVar $COLONIST_HOLDS
					saveVar $PHOTONS
					saveVar $ARMIDS
					saveVar $LIMPETS
					saveVar $GENESIS
					saveVar $TWARP_TYPE
					saveVar $CLOAKS
					saveVar $BEACONS
					saveVar $ATOMIC
					saveVar $CORBO
					saveVar $EPROBES
					saveVar $MINE_DISRUPTORS
					saveVar $PSYCHIC_PROBE
					saveVar $PLANET_SCANNER
					saveVar $SCAN_TYPE
					saveVar $ALIGNMENT
					saveVar $EXPERIENCE
					saveVar $SHIP_NUMBER
					saveVar $TRADER_NAME
				end
return
# ==============================  END PLAYER INFO SUBROUTINE  =================
