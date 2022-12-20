	reqrecording

	gosub :BOT~loadVars

	loadVar $GAME~GENESIS_COST
	loadVar $GAME~ATOMIC_COST
	loadVar $MAP~STARDOCK 
	loadvar $bot~folder
	loadvar $game~MAX_PLANETS_PER_SECTOR
	loadvar $planet~planet_file
	loadVar $BOT~botIsDeaf
	loadVar $BOT~silent_running
	loadvar $game~steal_factor

	setVar $BOT~command "wsst"

	setVar $BOT~help[1]   $BOT~tab&"World Sell-Steal-Transport "
	setVar $BOT~help[2]   $BOT~tab&" - wsst [ship2] {cash dropoff} {f} {s} {safe|passive} {furbpoint} "
	setVar $BOT~help[3]   $BOT~tab&"   Options: "
	setVar $BOT~help[4]   $BOT~tab&"     {cash dropoff} - if started from planet citadel  "
	setVar $BOT~help[5]   $BOT~tab&"     {f}            - buy fighters"
	setVar $BOT~help[6]   $BOT~tab&"     {s}            - buy shields "
	setVar $BOT~help[7]   $BOT~tab&"     {safe}         - Will not mow to locations, scans and moves"
	setVar $BOT~help[8]   $BOT~tab&"     {passive}      - Will be safe, as well as avoid any enemy fighters "
	setVar $BOT~help[9]   $BOT~tab&"     {furbpoint}    - Terra, Dock (default), Alpha, Rylos "
	setVar $BOT~help[10]  $BOT~tab&"     {limp}         - Will lay 3 limps/sector if Furbing at Dock. "
	setVar $BOT~help[11]  $BOT~tab&"     {armid}        - Will lay 3 armids/sector if Furbing at Dock. "
	setVar $BOT~help[12]  $BOT~tab&"     {quiet}        - Will not braodcast BUSTED msg's on SubSpace  "
	setVar $BOT~help[13]  $BOT~tab&"     {x100}         - Will Drop 100 Fighters per sector "

	gosub :bot~helpfile

	setvar $player~save true

	goto :Starting
	
:transport
	if ($inShip1)
		send ("x     "&$psst_Ship2&"* q * ")
		setvar $player~ship_number $psst_ship2
	else
		send ("x     "&$psst_Ship1&"* q * ")
		setvar $player~ship_number $psst_ship1
	end
	savevar $player~ship_number
	killtrigger 1
	killtrigger 2
	killtrigger 3
	setTextLineTrigger 1 :transported "Security code accepted"
	setTextLineTrigger 2 :noneAvailable "That is not an available ship."
	setTextLineTrigger 3 :outOfRange "only has a transport range of"
	pause
	:outOfRange
	:noneAvailable
		killtrigger 1
		killtrigger 2
		killtrigger 3
		halt
		goto :transport
	:transported
		killtrigger 1
		killtrigger 2
		killtrigger 3
		if ($inShip1)
			setVar $inShip1 FALSE
		else
			setVar $inShip1 TRUE
		end
		setVar $player~turns ($player~turns-1)
		savevar $player~turns
	return

:GoGo
	window cash 300 170 ("World SST - " & GAMENAME) ONTOP
	gosub :displayCredits
	while (TRUE)
		if (($player~unlimitedGame = FALSE) AND ($player~turns <= $bot~bot_turn_limit))
			goto :endSST
		end
		gosub :findSSTPorts
		setVar $busted FALSE
		while ($busted = FALSE)
			if (($player~unlimitedGame = FALSE) AND ($player~turns <= $bot~bot_turn_limit))
				goto :endSST
			end
			gosub :steal
		end
		send "#"
		gosub :player~quikstats
		loadVar $bot~alarm_list
		if (($alarm_active) AND ($bot~alarm_list <> ""))
			loadVar $bot~who_is_online
			lowercase $bot~alarm_list
			lowercase $bot~who_is_online
			getWordPos $bot~alarm_list $pos ","
			if ($pos > 0)
				splitText $bot~alarm_list $alarm ","
			else
				setArray $alarm 1
				setVar $alarm[1] $bot~alarm_list
				setVar $alarm 1
			end
			setVar $i 1
			while ($i <= $alarm)
				getWordPos $bot~who_is_online $pos " "&$alarm[$i]&" "
				if ($pos > 0)
					send "'Alarm triggered by "&$alarm[$i]&", contingency plan engaged.*"
					send "'"&$bot~bot_name&" x x*"
					halt
				end
				add $i 1
			end
		end
		setVar $minRefurb ($player~experience / $game~steal_factor - 1)
		if ($minRefurb > 255)
			setVar $minRefurb 255
		end
		setVar $minRefurb (($minRefurb * 7) / 8)
		if (($ship1TotalHolds < $minRefurb) OR ($ship2TotalHolds < $minRefurb))
			gosub :refurb
		end
		if (($dropCashAtBase = TRUE) AND ($player~credits > $dropCashLimit))
			gosub :dropCashAtBase
		end
	end
	goto :endSST


:checkSSTShips
	setVar $foundShip2 FALSE
	killalltriggers
	send "wn*"
	setTextLineTrigger other :shipline " "&$player~current_sector&" "
	setTextLineTrigger noShips :shipDone "You do not own any other ships in this sector!"
	pause

	:shipline
		killalltriggers
		add $shipCount 1
		getWord CURRENTLINE $tempID 1
		if ($tempID = $psst_Ship2)
			setVar $foundShip2 TRUE
		end
		setTextLineTrigger other :shipline " "&$player~current_sector&" "
		setTextLineTrigger noMore :shipDone "Choose which ship to tow "
		pause
	:shipDone
	killalltriggers
	return

:moveIntoSector
	setVar $result ""
	setVar $dropFigs TRUE
	setVar $result $result&"m "&$moveIntoSector&"*"
	if (($moveIntoSector > 10) AND ($moveIntoSector <> $map~stardock))
		if ($player~fighters > $ship~ship_max_attack)
			setVar $result $result&"za"&$ship~ship_max_attack&"* * "
		else
			setVar $result $result&"za"&$player~fighters&"* * "
		end
	end
	if (($dropFigs = TRUE) AND ($moveIntoSector > 10) AND ($moveIntoSector <> $map~stardock) AND ($j > 2))
		setVar $FIG_DROP 1
		if ($x100)
			if ($player~fighters > 1000)
				setVar $FIG_DROP 100
				setvar $player~fighters ($player~fighters - 100)
			end
		elseif ($x1000)
			if ($player~fighters > 10000)
				setVar $FIG_DROP 1000
				setvar $player~fighters ($player~fighters - 1000)
			end
		end
		setVar $result $result&"f  z  "&$FIG_DROP&"* z  c  d  *  "
	end
	if ($DROPLIMPS)
		setVar $result $result&"  H  2  Z  3*  Z C  *  "
	end
	if ($DROPARMIDS)
		setVar $Result $result&"  H  1  Z  3*  Z C  *  "
	end
	send $result
	#waitOn "["&$moveIntoSector&"]"
	#if (($dropFigs) AND ($moveIntoSector > 10) AND ($moveIntoSector <> $map~stardock) AND ($j > 2))
	#	waitOn "<Drop/Take Fighters>"
	#end
	send "  sdsh"
	waitOn "Long Range Scan"
	waiton "Warps to Sector(s) :"
	return

:findSSTPorts

	while ($ship1NeedsPort = TRUE)
		if ($inShip1 <> TRUE)
			goSub :transport
		end
		:tryNewRouteShip1
		setVar $destination 0
		while ($destination = 0)
			gosub :getRandomCourse
			gosub :player~quikstats
		end
		setVar $j 3
		while (($j <= $courseLength) AND ($ship1NeedsPort = TRUE))
			setVar $moveIntoSector $COURSE[$j]
			setVar $containsShieldedPlanet FALSE
			setVar $p 1
			#echo "**["&$moveintosector&"]**["&$sectors&"]*"
			while ($p <= SECTOR.PLANETCOUNT[$moveIntoSector])
				getWord SECTOR.PLANETS[$moveIntoSector][$p] $test 1
				if ($test = "<<<<")
					setVar $containsShieldedPlanet TRUE
				end
				add $p 1
			end
        		if ($containsShieldedPlanet)
				echo "*Avoiding shielded planet*"
				goto :tryNewRouteShip1
			end
			setVar $figOwner  SECTOR.FIGS.OWNER[$moveIntoSector]
			setVar $mineOwner SECTOR.MINES.OWNER[$moveIntoSector]
			setVar $limpOwner SECTOR.LIMPETS.OWNER[$moveIntoSector]
			setVar $figCount  SECTOR.FIGS.QUANTITY[$moveIntoSector]
			if (($figCount > $safeFighterLevel) AND (($figOwner <> "belong to your Corp") AND ($figOwner <> "yours")))
				echo "*Avoiding too many enemy fighters*"
				goto :tryNewRouteShip1
			end
			gosub :moveIntoSector
			getSectorParameter $moveIntoSector "BUSTED" $isBusted
			if ((PORT.BUYEQUIP[$moveIntoSector] = TRUE) AND ($isBusted <> TRUE) AND ($moveIntoSector <> $ship2Sector))
				gosub :player~quikstats
				setVar $ship1NeedsPort FALSE
				setVar $ship1Sector $COURSE[$j]
				setVar $testSector $COURSE[$j]
				gosub :getSSTPortInfo
				setVar $ship1TotalHolds $player~total_holds
				setVar $ship1Equipment $player~equipment_holds
				gosub :displayCredits
			else
				setVar $k 1
				setVar $isFound FALSE
				while ((SECTOR.WARPS[$COURSE[$j]][$k] > 0) AND ($isFound = FALSE))
					setVar $checkingNeighbor SECTOR.WARPS[$COURSE[$j]][$k]
					getSectorParameter $checkingNeighbor "BUSTED" $isBusted
					setVar $containsShieldedPlanet FALSE
					setVar $p 1
					while ($p <= SECTOR.PLANETCOUNT[$checkingNeighbor])
						getWord SECTOR.PLANETS[$checkingNeighbor][$p] $test 1
						if ($test = "<<<<")
							setVar $containsShieldedPlanet TRUE
						end
						add $p 1
					end
					setVar $figOwner  SECTOR.FIGS.OWNER[$checkingNeighbor]
					setVar $mineOwner SECTOR.MINES.OWNER[$checkingNeighbor]
					setVar $limpOwner SECTOR.LIMPETS.OWNER[$checkingNeighbor]
					setVar $figCount  SECTOR.FIGS.QUANTITY[$checkingNeighbor]
					if ((PORT.BUYEQUIP[$checkingNeighbor] = TRUE) AND ($isBusted <> TRUE) AND ($checkingNeighbor <> $ship2Sector) AND ($containsShieldedPlanet = FALSE) AND (($figCount <= $safeFighterLevel) AND (($figOwner = "belong to your Corp") OR ($figOwner = "yours"))))
						setVar $moveIntoSector $checkingNeighbor
						gosub :moveIntoSector
						setVar $ship1NeedsPort FALSE
						setVar $ship1Sector $checkingNeighbor
						gosub :player~quikstats
						setVar $testSector $checkingNeighbor
						gosub :getSSTPortInfo
						setVar $ship1TotalHolds $player~total_holds
						setVar $ship1Equipment $player~equipment_holds
						gosub :displayCredits
						setVar $isFound TRUE
					end
					add $k 1
				end
			end
			add $j 1
		end
	end

	while ($ship2NeedsPort = TRUE)
		if ($inShip1)
			goSub :transport
		end
		:tryNewRouteShip2
		setVar $destination 0
		while ($destination = 0)
			gosub :getRandomCourse
			gosub :player~quikstats
		end
		setVar $j 3
		while (($j <= $courseLength) AND ($ship2NeedsPort = TRUE))
			setVar $moveIntoSector $COURSE[$j]
			setVar $containsShieldedPlanet FALSE
			setVar $p 1
			#echo "**["&$moveintosector&"]**["&$sectors&"]*"
			while ($p <= SECTOR.PLANETCOUNT[$moveIntoSector])
				getWord SECTOR.PLANETS[$moveIntoSector][$p] $test 1
				if ($test = "<<<<")
					setVar $containsShieldedPlanet TRUE
				end
				add $p 1
			end
			if ($containsShieldedPlanet)
				goto :tryNewRouteShip2
			end
			setVar $figOwner  SECTOR.FIGS.OWNER[$moveIntoSector]
			setVar $mineOwner SECTOR.MINES.OWNER[$moveIntoSector]
			setVar $limpOwner SECTOR.LIMPETS.OWNER[$moveIntoSector]
			setVar $figCount  SECTOR.FIGS.QUANTITY[$moveIntoSector]
			if (($figCount > $safeFighterLevel) AND (($figOwner <> "belong to your Corp") AND ($figOwner <> "yours")))
				echo "*Avoiding too many enemy fighters*"
				goto :tryNewRouteShip2
			end
			gosub :moveIntoSector
			getSectorParameter $COURSE[$j] "BUSTED" $isBusted
			if ((PORT.BUYEQUIP[$COURSE[$j]] = TRUE) AND ($isBusted <> TRUE) AND ($COURSE[$j] <> $ship1Sector))
				setVar $ship2NeedsPort FALSE
				setVar $ship2Sector $COURSE[$j]
				gosub :player~quikstats
				setVar $testSector $COURSE[$j]
				gosub :getSSTPortInfo
				setVar $ship2TotalHolds $player~total_holds
				setVar $ship2Equipment $player~equipment_holds
				gosub :displayCredits
			else
				setVar $k 1
				setVar $isFound FALSE
				while ((SECTOR.WARPS[$COURSE[$j]][$k] > 0) AND ($isFound = FALSE))
					setVar $checkingNeighbor SECTOR.WARPS[$COURSE[$j]][$k]
					setVar $containsShieldedPlanet FALSE
					setVar $p 1
					while ($p <= SECTOR.PLANETCOUNT[$checkingNeighbor])
						getWord SECTOR.PLANETS[$checkingNeighbor][$p] $test 1
						if ($test = "<<<<")
							setVar $containsShieldedPlanet TRUE
						end
						add $p 1
					end
					setVar $figOwner  SECTOR.FIGS.OWNER[$checkingNeighbor]
					setVar $mineOwner SECTOR.MINES.OWNER[$checkingNeighbor]
					setVar $limpOwner SECTOR.LIMPETS.OWNER[$checkingNeighbor]
					setVar $figCount  SECTOR.FIGS.QUANTITY[$checkingNeighbor]
					getSectorParameter $checkingNeighbor "BUSTED" $isBusted
					if ((PORT.BUYEQUIP[$checkingNeighbor] = TRUE) AND ($isBusted <> TRUE) AND ($checkingNeighbor <> $ship1Sector) AND ($containsShieldedPlanet = FALSE) AND (($figCount <= $safeFighterLevel) AND (($figOwner = "belong to your Corp") OR ($figOwner = "yours"))))
						setVar $moveIntoSector $checkingNeighbor
						gosub :moveIntoSector
						setVar $ship2NeedsPort FALSE
						setVar $ship2Sector $checkingNeighbor
						gosub :player~quikstats
						setVar $testSector $checkingNeighbor
						gosub :getSSTPortInfo
						setVar $ship2TotalHolds $player~total_holds
						setVar $ship2Equipment $player~equipment_holds
						gosub :displayCredits
						setVar $isFound TRUE
					end
					add $k 1
				end
			end
			add $j 1
		end
	end

	gosub :FindShip

	if (($dist1 > $transportRange) OR ($dist2 > $transportRange))
		if ($inship1)
			setVar $ship1NeedsPort TRUE
		else
			setVar $ship2NeedsPort TRUE
		end
    	gosub :getCourse
		setVar $j 2
		setVar $result ""
		while ($j <= ($courseLength - 1))
			setVar $result $result&" m "&$COURSE[$j]&"* "
			if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK))
				setVar $result $result & " z a " & $ship~ship_max_attack & "* * "
			end
			if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK) AND ($j > 2))
				setVar $result $result&" f 1 * c d "
				setSectorParameter $Course[$j] "FIGSEC" TRUE

			end
			add $j 1
		end
		send $result & " ** "
		gosub :player~quikstats
		goto :findSSTPorts
	end
	return

:getRandomCourse
#Does Random Course Calculation
	killalltriggers
	setArray $COURSE 80
	setVar $courseLength 0
	setVar $sectors ""
	setTextLineTrigger sectorlinetrig :sectorsline " > "
	getRnd $destination 11 SECTORS
	send "^f*"&$destination&"**q"
	pause

:getCourse
#Does Specific Course Calculation
	killalltriggers
	setVar $courseLength 0
	setArray $COURSE 80
	setVar $sectors ""
	setTextLineTrigger sectorlinetrig :sectorsline " > "
	send "^f*"&$destination&"**q"
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
	getWordPos $line $pos3 "*** Error - No route within"
	if (($pos > 0) OR ($pos2 > 0) OR ($pos3 > 0))
		goto :noPath
	end
	getWordPos $line $pos " sector "
	getWordPos $line $pos2 "TO"
	if (($pos <= 0) AND ($pos2 <= 0))
		setVar $sectors $sectors & " " & $line
	end
	getWordPos $line&" " $pos " "&$destination&" "
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

:noPath
	if ($courseLength <= 0)
		setVar $destination 0
	end
	killAllTriggers
	return

:steal
	
	getSectorParameter $ship1Sector "BUSTED" $isBusted1
	getSectorParameter $ship2Sector "BUSTED" $isBusted2
	if (($isBusted1 <> TRUE) AND ($isBusted2 <> TRUE))
		setVar $maxSteal ($player~experience / $game~steal_factor - 1)
		setVar $send ""
			if ($inShip1)
				if ($ship1Equipment > 0)
					# sell off existing equipment
					setVar $send $send & "p t * * 0* 0* "
					setVar $ship1Equipment 0
					add $equipAtPort[$ship1Sector] $ship1Equipment
				end
				# steal as much as we are able to on this ship
				if ($ship1TotalHolds < $maxSteal)
					setVar $steal $ship1TotalHolds
				else
					setVar $steal $maxSteal
				end

				while ($equipAtPort[$ship1Sector] < ($steal + 20))
					setVar $upgrade ($steal - $equipAtPort[$ship1Sector])
					divide $upgrade 10
					add $upgrade 4
					setVar $send $send & "o 3" & $upgrade & "* * "
					add $equipAtPort[$ship1Sector] ($upgrade * 10)
				end
 				setVar $send $send & "p r * s z 3 " & $steal & "* x    "
				setVar $ship1Equipment $steal
			else
				if ($ship2Equipment > 0)
					# sell off existing equipment
					setVar $send $send & "p t * * 0* 0* "
      					setVar $ship2Equipment 0
					add $equipAtPort[$ship2Sector] $ship2Equipment
				end
				# steal as much as we are able to on this ship
				if ($ship2TotalHolds < $maxSteal)
					setVar $steal $ship2TotalHolds
				else
					setVar $steal $maxSteal
				end

				while ($equipAtPort[$ship2Sector] < ($steal + 20))
					setVar $upgrade ($steal - $equipAtPort[$ship2Sector])
					divide $upgrade 10
					add $upgrade 4
					setVar $send $send & "o 3" & $upgrade & "* * "
					add $equipAtPort[$ship2Sector] ($upgrade * 10)
				end
 				setVar $send $send & "p r* s   z3  " & $steal & "*  x    "
				setVar $ship2Equipment $steal
			end

			if ($inShip1)
				send $send & $psst_Ship2 & "*  * "
				setVar $inShip1 FALSE
			else
   				send $send & $psst_Ship1 & "*  * "
				setVar $inShip1 TRUE
			end
			setVar $player~turns ($player~turns-2)
			savevar $player~turns

   			if ($inShip1)
				setVar $LastSteal $ship1Sector
			else
				setVar $LastSteal $ship2Sector
			end
		end

			# calculate experience gain or hold loss
			setVar $stake ($steal - 1) / 11

			waitOn "(R)ob this port, (S)teal product"
			killtrigger 1
			killtrigger 2
			killtrigger 3
			killtrigger 4			
			setTextLineTrigger 1 :success "Success!"
			setTextLineTrigger 2 :busted "Suddenly you're Busted!"
			setTextLineTrigger 3 :busted "There aren't that many holds of Equipment at this port!"
			setTextLineTrigger 4 :busted "Do you want instructions (Y/N) [N]?"
			pause

			:success
				add $player~experience $stake
				savevar $player~experience
				if ($inShip1)
					setVar $ship2Equipment 1
					setVar $lastStealRobSector $ship2Sector
					saveVar $lastStealRobSector
				else
					setVar $ship1Equipment 1
					setVar $lastStealRobSector $ship1Sector
					saveVar $lastStealRobSector
				end
				goto :continue

			:busted
    		# calculate holds lost and flag this sector as busted
				if ($inShip1)
					subtract $ship2TotalHolds $stake
					setSectorParameter $ship2Sector "BUSTED" TRUE
					setVar $lastBustSector $ship2Sector
					saveVar $lastBustSector
					setVar $ship2Equipment 0
   				else
					subtract $ship1TotalHolds $stake
					setSectorParameter $ship1Sector "BUSTED" TRUE
					setVar $lastBustSector $ship1Sector
					saveVar $lastBustSector
					setVar $ship1Equipment 0
				end
				add $numberbusted 1
				setVar $busted 1
				gosub :transport
				if ($inShip1)
					setVar $ship1NeedsPort TRUE
				else
					setVar $ship2NeedsPort TRUE
				end
				if ($QUIET = 0)
					send "'<"&$bot~subspace&">[Busted:"&$lastBustSector&"]<"&$bot~subspace&">* "
				end

			:continue
				killtrigger 1
				killtrigger 2
				killtrigger 3
				killtrigger 4			
return

:getSSTPortInfo
	
	send "* cr*q"
	waitOn "What sector is the port in? ["
	:portInfo
		killtrigger 1
		killtrigger 2
		setTextLineTrigger 1 :getPortEquip "Equipment  Buying"
		setTextLineTrigger 2  :noEquipHere "I have no information about a port in that sector."
		pause

		:noEquipHere
			killalltriggers
			setVar $equipBuy 0
			setVar $equipPerc 0
			goto :gotAllPortInfo

		:getPortEquip
			killAllTriggers
			getWord CURRENTLINE $equipBuy 3
			getWord CURRENTLINE $equipPerc 4
			stripText $equipPerc "%"
			setVar $x 10000
			if ($equipPerc = 0)
 				setVar $equipAtPort[$TestSector] ($player~total_holds + 50)
			else
				divide $x $equipPerc
				multiply $x $equipBuy
				divide $x 100
				subtract $x 1
				subtract $x $equipBuy

				if ($x < 0)
					setVar $equipAtPort[$TestSector] 0
				else
       	 				setVar $equipAtPort[$TestSector] $x
				end
			end
		:gotallportinfo
			killtrigger 1
			killtrigger 2

  return
:refurb

	setvar $twarp_refurb_success false
	setVar $refurbPort $FURBING
	if (($player~twarp_type <> "No") and ($refurbPort = $map~stardock))

		gosub :twarprefurb
		gosub :player~quikstats

	end
	if ($twarp_refurb_success <> true)
		if ($FURBING <> 0)
			setVar $mowIntoSector $FURBING
			setVar $refurbPort $FURBING
		else
			setVar $mowIntoSector $refurbPort
		end
		if ($ultraSafe)
			:trySafeMowAgainRefurb
				gosub :safemowIntoSector
				if ($isSafe = FALSE)
					goto :trySafeMowAgainRefurb
				end
		else
			gosub :mowIntoSector
		end
		gosub :player~quikstats
		if ($player~current_sector = $refurbPort)
			if ($FURBING <> $map~stardock)
				send "p ty"
				waitOn "A  Cargo holds     :"
				getWord CURRENTLINE $holdsprice 5
				getWord CURRENTLINE $holdsToBuy 10
				setVar $beforeFurbCredits $player~credits
				setVar $player~credits ($player~credits-($holdsprice * $holdsToBuy))
				if ($player~credits > $CASH_TO_HOLD_ONTO)
					if ($refurbFighters)
						waitOn "B  Fighters        :"
						getWord CURRENTLINE $figprice 4
						getWord CURRENTLINE $figsToBuy 8
					else
						setVar $figsToBuy 0
					end
					if ($refurbShields)
						waitOn "C  Shield Points   :"
						getWord CURRENTLINE $shieldprice 5
						getWord CURRENTLINE $player~shieldsToBuy 9
					else
						setVar $player~shieldsToBuy 0
					end
					if ($figsToBuy > 0)
						if (($figprice * $figsToBuy) > ($player~credits-$CASH_TO_HOLD_ONTO))
							setVar $figsToBuy (($player~credits-$CASH_TO_HOLD_ONTO)/$figprice)
						end
						setVar $player~credits ($player~credits-($figprice * $figsToBuy))
					end
					if ($player~shieldsToBuy > 0)
						if (($shieldprice * $player~shieldsToBuy) > ($player~credits-$CASH_TO_HOLD_ONTO))
							setVar $player~shieldsToBuy (($player~credits-$CASH_TO_HOLD_ONTO)/$shieldprice)
						end
						setVar $player~credits ($player~credits-($shieldprice * $player~shieldsToBuy))
					end
				else
					setVar $figsToBuy 0
					setVar $player~shieldsToBuy 0
				end
				send "a "&$holdsToBuy&"* y b "&$figsToBuy&"* c "&$player~shieldsToBuy&"* q q q z n * "
				return
			else
				send "p s g y g q "
			end
		end
	end

	if ($player~current_sector = $refurbPort)
		killAllTriggers
		send " s p"
		waitOn "A  Cargo holds     :"
		getWord CURRENTLINE $holdsprice 5
		getWord CURRENTLINE $holdsToBuy 10
		setVar $beforeFurbCredits $player~credits
		if ($player~credits > $CASH_TO_HOLD_ONTO)
			if ($refurbFighters)
				waitOn "B  Fighters        :"
				getWord CURRENTLINE $figprice 4
				getWord CURRENTLINE $figsToBuy 8
			else
				setVar $figsToBuy 0
			end
			if ($refurbShields)
				waitOn "C  Shield Points   :"
				getWord CURRENTLINE $shieldprice 5
				getWord CURRENTLINE $player~shieldsToBuy 9
			else
				setVar $player~shieldsToBuy 0
			end
			if ($holdsToBuy > 0)
				if (($holdsprice * $holdsToBuy) > ($player~credits-$CASH_TO_HOLD_ONTO))
					setVar $holdsToBuy (($player~credits-$CASH_TO_HOLD_ONTO)/$holdsprice)
				end
				setVar $player~credits ($player~credits-($holdsprice * $holdsToBuy))
			end
			if ($figsToBuy > 0)
				if (($figprice * $figsToBuy) > ($player~credits-$CASH_TO_HOLD_ONTO))
					setVar $figsToBuy (($player~credits-$CASH_TO_HOLD_ONTO)/$figprice)
				end
				setVar $player~credits ($player~credits-($figprice * $figsToBuy))
			end
			if ($player~shieldsToBuy > 0)
				if (($shieldprice * $player~shieldsToBuy) > ($player~credits-$CASH_TO_HOLD_ONTO))
					setVar $player~shieldsToBuy (($player~credits-$CASH_TO_HOLD_ONTO)/$shieldprice)
				end
				setVar $player~credits ($player~credits-($shieldprice * $player~shieldsToBuy))
			end
		else
			setVar $figsToBuy 0
			setVar $player~shieldsToBuy 0
			setvar $holdsToBuy 0
		end
			send "a "&$holdsToBuy&"* y b "&$figsToBuy&"* c "&$player~shieldsToBuy&"* q q h "
			waitfor "<Hardware Emporium>"
			if ($DROPLIMPS)
				send "L"
				waitfor "How many mines do you want"
				getText CURRENTLINE $Buy "(Max" ") ["
				striptext $buy " "
				send $buy & "*"
				waitfor "<Hardware Emporium>"
			end
			if ($DROPARMIDS)
				send "M"
				waitfor "How many mines do you want"
				getText CURRENTLINE $Buy "(Max" ") ["
				striptext $buy " "
				send $buy & "*"
				waitfor "<Hardware Emporium>"
			end

			send "/"
			waitfor #179 & "Figs"
			getText CURRENTLINE $player~credits (#179 & "Creds") (#179 & "Figs")
			striptext $player~credits " "
			stripText $player~credits ","

		setVar $spentCredits ($spentCredits+($beforeFurbCredits-$player~credits))
		setVar $player~fightersPurchased ($player~fightersPurchased+$figsToBuy)
		setVar $player~shieldsPurchased ($player~shieldsPurchased+$player~shieldsToBuy)
	else
		send "'Something bad happened on refurb, I am probably in big trouble. [Temp error message until saveme implemented]*"
	end
	if ($twarp_refurb_success = true)
		send "Q Q Q Q Z N M " & $START_SECTOR & "* Y  Y  Y  * *"
		gosub :PLAYER~quikstats
		if (player~current_sector = $MAP~stardock)
			setvar $switchboard~message "Twarp Error, Should be Hiding on Dock!*"
			gosub :switchboard~switchboard
			send "*"
			halt
		end
		send "jy*"

	else
		:donenormalfurb
		setvar $twarp_refurb_success false
		send " Q Q "
	end	
return

:old_refurb

	if ($FURBING <> 0)
		setVar $mowIntoSector $FURBING
		setVar $refurbPort $FURBING
	else
		setVar $mowIntoSector $refurbPort
	end
	if ($ultraSafe)
		:trySafeMowAgainRefurb
			gosub :safemowIntoSector
			if ($isSafe = FALSE)
				goto :trySafeMowAgainRefurb
			end
	else
		gosub :mowIntoSector
	end
	gosub :player~quikstats

	if ($player~current_sector = $refurbPort)
		killAllTriggers
		if ($FURBING <> $map~stardock)
			send "p ty"
		else
			send "p s g y g q s p"
		end
		waitOn "A  Cargo holds     :"
		getWord CURRENTLINE $holdsprice 5
		getWord CURRENTLINE $holdsToBuy 10
		setVar $beforeFurbCredits $player~credits
		setVar $player~credits ($player~credits-($holdsprice * $holdsToBuy))
		if ($player~credits > $CASH_TO_HOLD_ONTO)
			if ($refurbFighters)
				waitOn "B  Fighters        :"
				getWord CURRENTLINE $figprice 4
				getWord CURRENTLINE $figsToBuy 8
			else
				setVar $figsToBuy 0
			end
			if ($refurbShields)
				waitOn "C  Shield Points   :"
				getWord CURRENTLINE $shieldprice 5
				getWord CURRENTLINE $player~shieldsToBuy 9
			else
				setVar $player~shieldsToBuy 0
			end
			if ($figsToBuy > 0)
				if (($figprice * $figsToBuy) > ($player~credits-$CASH_TO_HOLD_ONTO))
					setVar $figsToBuy (($player~credits-$CASH_TO_HOLD_ONTO)/$figprice)
				end
				setVar $player~credits ($player~credits-($figprice * $figsToBuy))
			end
			if ($player~shieldsToBuy > 0)
				if (($shieldprice * $player~shieldsToBuy) > ($player~credits-$CASH_TO_HOLD_ONTO))
					setVar $player~shieldsToBuy (($player~credits-$CASH_TO_HOLD_ONTO)/$shieldprice)
				end
				setVar $player~credits ($player~credits-($shieldprice * $player~shieldsToBuy))
			end
		else
			setVar $figsToBuy 0
			setVar $player~shieldsToBuy 0
		end
		if ($FURBING <> $map~stardock)
			send "a "&$holdsToBuy&"* y b "&$figsToBuy&"* c "&$player~shieldsToBuy&"* q q q z n * "
		elseif (($FURBING = $map~stardock) AND (($DROPLIMPS) OR ($DROPARMIDS)) AND ($player~credits > ($CASH_TO_HOLD_ONTO + 2000000)))
			send "a "&$holdsToBuy&"* y b "&$figsToBuy&"* c "&$player~shieldsToBuy&"* q q h "
			waitfor "<Hardware Emporium>"
			if ($DROPLIMPS)
				send "L"
				waitfor "How many mines do you want"
				getText CURRENTLINE $Buy "(Max" ") ["
				striptext $buy " "
				send $buy & "*"
				waitfor "<Hardware Emporium>"
			end
			if ($DROPARMIDS)
				send "M"
				waitfor "How many mines do you want"
				getText CURRENTLINE $Buy "(Max" ") ["
				striptext $buy " "
				send $buy & "*"
				waitfor "<Hardware Emporium>"
			end
			send "/"
			waitfor #179 & "Figs"
			getText CURRENTLINE $player~credits (#179 & "Creds") (#179 & "Figs")
			striptext $player~credits " "
			stripText $player~credits ","
			send " Q Q "
		else
			send "a "&$holdsToBuy&"* y b "&$figsToBuy&"* c "&$player~shieldsToBuy&"* q q q z n * "
		end

		setVar $spentCredits ($spentCredits+($beforeFurbCredits-$player~credits))
		setVar $player~fightersPurchased ($player~fightersPurchased+$figsToBuy)
		setVar $player~shieldsPurchased ($player~shieldsPurchased+$player~shieldsToBuy)
	else
		send "'Something bad happened on mow, I am probably in big trouble. [Temp error message until saveme implemented]*"
	end

return

:safemowIntoSector
	setVar $isSafe TRUE
	setVar $destination $mowIntoSector
	gosub :getCourse
	setVar $j 2
	setVar $result ""
	while (($j <= $courseLength) AND ($isSafe))
		setVar $nextSafeSector $Course[$j]
		send "sdsh"
		waitOn "Long Range Scan"
		waiton "Warps to Sector(s) :"
		#gosub :player~quikstats
		setVar $minesafe TRUE
		setVar $figsSafe  ((SECTOR.FIGS.QUANTITY[$nextSafeSector] <= 0) OR (((SECTOR.FIGS.OWNER[$nextSafeSector] = "yours") OR (SECTOR.FIGS.OWNER[$nextSafeSector] = "belong to your Corp"))))
		setVar $planet~planetSafe ((SECTOR.PLANETCOUNT[$nextSafeSector] <= 0) OR (($nextSafeSector = $map~stardock) OR ($nextSafeSector <= 10)))
		setVar $navHazSafe TRUE
		setVar $densitySafe TRUE
		setVar $player~limpetsafe TRUE
		if ($densitySafe OR ($player~limpetsSafe AND $figsSafe AND $minesSafe AND $navHazSafe AND $planet~planetSafe))
			setVar $result ($result & "m "&$Course[$j]&"* ")
			if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK))
				setVar $result ($result & "za"&$ship~ship_max_attack&"* * ")
			end
		else
			setVar $result ($result & "c v"&$nextSafeSector&"*q ")
			setVar $isSafe FALSE
			send $result
			return
		end
		if (($Course[$j] > 10) AND ($Course[$j] <> STARDOCK) AND ($j > 2))
			setVar $result ($result & "f z 1* z c d * ")
			setSectorParameter $Course[$j] "FIGSEC" TRUE
	       	if ($DROPLIMPS)
				setVar $result $result&"  H  2  Z  3*  Z C  *  "
			end
			if ($DROPARMIDS)
				setVar $Result $result&"  H  1  Z  3*  Z C  *  "
			end
		end
		setVar $result ($result & "  /")
		send $result
		waitfor (#179 & "Turns")
		add $j 1
	end
return

:mowIntoSector
	setVar $destination $mowIntoSector
	gosub :getCourse
	setVar $j 2
	setVar $result ""
	while ($j <= $courseLength)
		setVar $result $result&"m"&$COURSE[$j]&"* "
		if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK))
			setVar $result $result&"za"&$ship~ship_max_attack&"* * "
		end
		if (($dropFigs = TRUE) AND ($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK) AND ($j > 2))
			setVar $FIG_DROP 1
			if ($x100)
				if ($player~fighters > 1000)
					setVar $FIG_DROP 100
					setvar $player~fighters ($player~fighters - 100)
				end
			elseif ($x1000)
				if ($player~fighters > 10000)
					setVar $FIG_DROP 1000
					setvar $player~fighters ($player~fighters - 1000)
				end
			end
			setVar $result $result&"f  z  "&$FIG_DROP&"* z  c  d  *  "
			setSectorParameter $Course[$j] "FIGSEC" TRUE
		end

       	if ($DROPLIMPS)
			setVar $result $result&"  H  2  Z  3*  Z C  *  "
			setSectorParameter $Course[$j] "LIMPSEC" TRUE
		end
		if ($DROPARMIDS)
			setVar $Result $result&"  H  1  Z  3*  Z C  *  "
			setSectorParameter $Course[$j] "MINESEC" TRUE
		end

		add $j 1
	end
	send $result
return
:dropCashAtBase
	if ($player~credits > $dropCashLimit)
		setVar $mowIntoSector $cashDropSector
		if ($ultraSafe)
			:trySafeMowAgain
				gosub :safemowIntoSector
				if ($isSafe = FALSE)
					goto :trySafeMowAgain
				end
		else
			gosub :mowIntoSector
		end
		gosub :player~quikstats
		if ($player~current_sector = $cashDropSector)
			send "l "&$cashDropPlanet &"* c t t "&($player~credits-1000000)&"* qq* "
			#send "l "&$cashDropPlanet &"* m n l "&($player~fighters/2)&"*  c t t "&($player~credits-1000000)&"* qq* "
			add $cashDeposited ($player~credits-1000000)
			setVar $player~credits 1000000
			gosub :displayCredits
		else
			send "'Something bad happened on mow, I am probably in big trouble. [Temp error message until saveme implemented]*"
		end
	end
return
:displayCredits
	
	setVar $formattedDepositedCredits ""
	setVar $spentCredits2 $cashDeposited
	getLength $spentCredits2 $length
	while ($length > 3)
		cutText $spentCredits2 $snippet $length-2 9999
		cutText $spentCredits2 $spentCredits2 1 $length-3
		getLength $spentCredits2 $length
		setVar $formattedDepositedCredits ","&$snippet&$formattedDepositedCredits
	end
	setVar $formattedDepositedCredits $spentCredits2&$formattedDepositedCredits

	setVar $formattedOnHandCredits ""
	setVar $spentCredits2 $player~credits
	getLength $spentCredits2 $length
	while ($length > 3)
		cutText $spentCredits2 $snippet $length-2 9999
		cutText $spentCredits2 $spentCredits2 1 $length-3
		getLength $spentCredits2 $length
		setVar $formattedOnHandCredits ","&$snippet&$formattedOnHandCredits
	end
	setVar $formattedOnHandCredits $spentCredits2&$formattedOnHandCredits

	setVar $formattedSpentCredits ""
	setVar $spentCredits2 $spentCredits
	getLength $spentCredits2 $length
	while ($length > 3)
		cutText $spentCredits2 $snippet $length-2 9999
		cutText $spentCredits2 $spentCredits2 1 $length-3
		getLength $spentCredits2 $length
		setVar $formattedSpentCredits ","&$snippet&$formattedSpentCredits
	end
	setVar $formattedSpentCredits $spentCredits2&$formattedSpentCredits

	setVar $formattedFighters ""
	setVar $spentCredits2 $player~fightersPurchased
	getLength $spentCredits2 $length
	while ($length > 3)
		cutText $spentCredits2 $snippet $length-2 9999
		cutText $spentCredits2 $spentCredits2 1 $length-3
		getLength $spentCredits2 $length
		setVar $formattedFighters ","&$snippet&$formattedFighters
	end
	setVar $formattedFighters $spentCredits2&$formattedFighters

	setVar $formattedShields ""
	setVar $spentCredits2 $player~shieldsPurchased
	getLength $spentCredits2 $length
	while ($length > 3)
		cutText $spentCredits2 $snippet $length-2 9999
		cutText $spentCredits2 $spentCredits2 1 $length-3
		getLength $spentCredits2 $length
		setVar $formattedShields ","&$snippet&$formattedShields
	end
	setVar $formattedShields $spentCredits2&$formattedShields

	add $portaverage $cashDeposited
	add $portaverage $player~credits
	add $portaverage $spentCredits
	subtract $portaverage $startcash
	if ($numberbusted = 0)
		setvar $numberbusted 1
	end
	divide $portaverage $numberbusted

	setVar $formattedPortAverage ""
	setVar $spentCredits2 $portaverage
	getLength $spentCredits2 $length
	while ($length > 3)
		cutText $spentCredits2 $snippet $length-2 9999
		cutText $spentCredits2 $spentCredits2 1 $length-3
		getLength $spentCredits2 $length
		setVar $formattedPortAverage ","&$snippet&$formattedPortAverage
	end
	setVar $formattedPortAverage $spentCredits2&$formattedPortAverage

	setvar $window_content "*    Cash Deposited: "&$formattedDepositedCredits&"*  Busted xxB Ports: "&$numberbusted&"*  Credits per Port: "&$formattedPortAverage&"*   Fighters bought: "&$formattedFighters&"*    Shields bought: "&$formattedShields&"*"

	setWindowContents cash $window_content
	replacetext $window_content "*" "[][]"
	savevar $window_content

	return

:endSST
	killalltriggers
	send "q q q q  * * * "
	setvar $switchboard~message "World SST has completed, make sure you pick up the bot and its ships.*"
	gosub :switchboard~switchboard
	halt




:FindShip
	setVar $Found1 0
	setVar $Found2 0
	send "czq"
	waitOn "---------------------------------"
	:nextShip
	setTextLineTrigger		Ships	:Ships
	pause
	:Ships
		getWord CURRENTLINE $shipNum 1
		isNumber $tst $shipNum
		if ($tst <> 0)
			if ($shipnum = $psst_Ship2)
				setVar $Found2 CURRENTLINE
				replaceText $Found2 "+" " "
				getWord $Found2 $Found2 2
			elseif ($shipNum = $psst_Ship1)
				setVar $Found1 CURRENTLINE
				replaceText $Found1 "+" " "
				getWord $Found1 $Found1 2
			end
			goto :NextShip
		end
		if ($inShip1)
			setVar $destination $Found2
		else
			setVar $destination $Found1
		end
		gosub :player~quikstats

		getDistance $dist1 $player~current_sector $destination
		#if (($dist1 = "-1") or ($dist1 > $transportRange))
		if ($dist1 = "-1")
			send "cf" & $player~current_sector & "*" & $destination & "*q"
			waitOn "What is the starting sector"
			waitOn "Command [TL="
			getDistance $dist1 $player~current_sector $destination
		end
		getDistance $dist2 $destination $player~current_sector
		#if (($dist2 = "-1") or ($dist2 > $transportRange))
		if ($dist2 = "-1")
			send "cf" & $destination & "*" & $player~current_sector & "*q"
			waitOn "What is the starting sector"
			waitOn "Command [TL="
			getDistance $dist2 $destination $player~current_sector
		end
		return

:Starting
	loadVar $game~steal_factor
	loadVar $player~unlimitedGame
	loadVar $bot~bot_turn_limit
	loadVar $bot~user_command_line
	loadVar $bot~parm1
	loadVar $bot~parm2
	loadVar $bot~parm3
	loadVar $bot~parm4
	loadVar $bot~parm5
	loadVar $bot~parm6
	loadVar $bot~parm7
	loadVar $bot~parm8
	loadVar $bot~bot_name
	loadVar $map~stardock
	loadVar $map~rylos
	loadVar $map~alpha_centauri
	loadVar $bot~subspace
	loadVar $bot~safe_ship
	setVar $CASH_TO_HOLD_ONTO 1000000




	gosub :player~quikstats
	
	setVar $DROPLIMPS (" " & $bot~user_command_line & " ")
	lowercase $DROPLIMPS
	getWordPos $DROPLIMPS $pos " limp "
	if ($pos = 0)
		setVar $DROPLIMPS FALSE
	else
		setVar $DROPLIMPS TRUE
	end

	setVar $DROPARMIDS (" " & $bot~user_command_line & " ")
	lowercase $DROPARMIDS
	getWordPos $DROPARMIDS $pos " armid "
	if ($pos = 0)
		setVar $DROPARMIDS FALSE
	else
		setVar $DROPARMIDS TRUE
	end

	setVar $QUIET (" " & $bot~user_command_line & " ")
	lowercase $QUIET
	getWordPos $QUIET $pos " quiet "
	if ($pos = 0)
		setVar $QUIET FALSE
	else
		setVar $QUIET TRUE
	end

	setVar $x100 (" " & $bot~user_command_line & " ")
	lowercase $x100
	getWordPos $x100 $pos " x100 "
	if ($pos = 0)
		setVar $x100 FALSE
	else
		setVar $x100 TRUE
	end

	setVar $x1000 (" " & $bot~user_command_line & " ")
	lowercase $x1000
	getWordPos $x1000 $pos " x1000 "
	if ($pos = 0)
		setVar $x1000 FALSE
	else
		setVar $x1000 TRUE
		setvar $x100 FALSE
	end


	setVar $startingLocation $player~current_prompt
	isNumber $isParamOneNumber   $bot~parm1
	isNumber $isParamTwoNumber   $bot~parm2
	isNumber $isParamThreeNumber $bot~parm3

	if (($startingLocation <> "Citadel") AND ($startingLocation <> "Command"))
		setvar $switchboard~message "World SST must be run from command or citadel prompt*"
		gosub :switchboard~switchboard
		halt
	end
	gosub :ship~getshipstats

	lowerCase $bot~parm1
	if ($isParamOneNumber = TRUE)
		setVar $psst_Ship2 $bot~parm1
		if ($isParamTwoNumber = TRUE)
			setVar $dropCashLimit $bot~parm2
		end
	else
		setvar $switchboard~message "Please use wsst [ship2#] format.*"
		gosub :switchboard~switchboard
		halt
	end
	if ($player~experience < 500)
		setvar $switchboard~message "You do not have enough experience to run WorldSST.*"
		gosub :switchboard~switchboard
		halt
	end
	if ($player~credits < 200000)
		setvar $switchboard~message "You must have at least 200,000 credits on hand to run WorldSST.*"
		gosub :switchboard~switchboard
		halt
	end
	cutText $player~alignment $neg_ck 1 1

	stripText $player~alignment "-"
	if ($player~alignment < 100) and ($neg_ck = "-")
		setvar $switchboard~message "Need -100 Alignment Minimum to run World SST.*"
		gosub :switchboard~switchboard
		halt
	elseif ($neg_ck <> "-")
		setvar $switchboard~message "Need -100 Alignment Minimum to run World SST.*"
		gosub :switchboard~switchboard
		halt
	end
	getWordPos " "&$bot~user_command_line&" " $pos " f "
	if ($pos > 0)
		setVar $refurbFighters TRUE
	else
		setVar $refurbFighters FALSE
	end

	getWordPos " "&$bot~user_command_line&" " $pos " s "
	if ($pos > 0)
		setVar $refurbShields TRUE
	else
		setVar $refurbShields FALSE
	end
	setVar $safeFighterLevel 5000
	getWordPos " "&$bot~user_command_line&" " $pos " safe "
	if ($pos > 0)
		setVar $ultrasafe TRUE
		setVar $safeFighterLevel 100
	else
		setVar $ultrasafe FALSE
	end

	getWordPos " "&$bot~user_command_line&" " $pos " passive "
	if ($pos > 0)
		setVar $passive TRUE
		setVar $safeFighterLevel 0
	else
		setVar $passive FALSE
	end

	setVar $FURBING $map~stardock

	setVar $Temp ("  " & $bot~user_command_line & "  ")
	getwordpos $Temp $pos " alpha "
	if (($pos <> 0) AND ($map~alpha_centauri <> 0))
		setVar $FURBING $map~alpha_centauri
	end
	getWordpos $Temp $pos " rylos "
	if (($pos <> 0) AND ($map~rylos <> 0))
		setVar $FURBING $map~rylos
	end
	getWordPos $Temp $pos " dock "
	if (($pos <> 0) AND ($map~stardock <> 0))
		setVar $FURBING $map~stardock
	end

	getWordPos $Temp $pos " terra "
	if (($pos <> 0) AND ($map~stardock <> 0))
		setVar $FURBING 1
	end

	setVar $portaverage 1
	send "jy*"
	setVar $cashDeposited 0
	goSub :player~quikstats
	setvar $startcash $player~credits
	setVar $psst_Ship1 $player~ship_number
	setVar $startingLocation $player~current_prompt
	if ($startingLocation = "Citadel")
	        send "q"
                gosub :planet~getplanetinfo
                send "q* "
		setVar $cashDropPlanet $planet~planet
                setVar $cashDropSector $player~current_sector
 	else
	        setVar $cashDropPlanet 0
                setVar $cashDropSector 0

        end
	if ($dropCashLimit <= 10000000)
		setVar $dropCashLimit 10000000
	end
	if (($cashDropSector = 0) OR ($cashDropPlanet = 0))
		setVar $dropCashAtBase FALSE
	else
		setVar $dropCashAtBase TRUE
	end

	if (($psst_Ship2 <= 0) OR ($game~steal_factor <= 0))
		send "'This module should be run from the MOM Bot.*"
		setVar $bot~mode "General"
		saveVar $bot~mode
		halt
	end

	setVar $alarm_check (" " & $bot~user_command_line & " ")
	lowercase $alarm_check
	getWordPos $alarm_check $pos " alarm "
	if ($pos = 0)
		setVar $alarm_active FALSE
	else
		setVar $alarm_active TRUE
		if ($bot~safe_ship <= 0)
			send "'You can't run alarm without safe ship variable set.*"
			halt
		end
		if (($bot~safe_ship = $psst_ship1) OR ($bot~safe_ship = $psst_ship2))
			send "'You can't run alarm and use your safe ship to WSST.*"
			halt
		end
	end

	setVar $startingSector $player~current_sector
	setVar $inShip1 TRUE
	setvar $p1chk 3
	setvar $p2chk 3
	if ($map~rylos > 10)
		setVar $refurbPort $map~rylos
	elseif ($map~alpha_centauri > 10)
		setVar $refurbPort $map~alpha_centauri
	else
		setVar $refurbPort 1
	end

	gosub :checkSSTShips

	if ($foundShip2 <> TRUE)
		setvar $switchboard~message "Ship #2 entered for Planet SST was not valid for this sector.*"
		gosub :switchboard~switchboard
		halt
	end
	setvar $switchboard~message "World SST Powering Up!*"
	gosub :switchboard~switchboard
	send "c;qjy "
	waitOn "Transport Range:"
	getWord CURRENTLINE $transportRange1 6
	getWord CURRENTLINE $maxHolds1 3
	gosub :transport
	send "c;qjy "
	waitOn "Transport Range:"
	getWord CURRENTLINE $transportRange2 6
	getWord CURRENTLINE $maxHolds2 3
	gosub :transport
	if ($transportRange1 <= $transportRange2)
		setVar $transportRange $transportRange1
	else
		setVar $transportRange $transportRange2
	end
	setvar $switchboard~message "Minimum transport range of these two ships is "&$transportRange&".*"
	gosub :switchboard~switchboard

	setVar $ship1Sector $player~current_sector
	setVar $ship2Sector $player~current_sector
	setVar $ship1NeedsPort TRUE
	setVar $ship2NeedsPort TRUE
	setVar $i 1
	setVar $yes TRUE
	setVar $busted FALSE
	setArray $equipAtPort SECTORS
	setArray $fuelAtPort SECTORS
goto :GoGo


:twarprefurb

	# check adj's for Dock.. if present, then we don't need a jump sector.
	setVar $i 1
	setVar $START_SECTOR $player~current_sector
	setVar $WeAreAdjDock FALSE
	while ($i <= SECTOR.WARPCOUNT[$START_SECTOR])
		setVar $adj_start SECTOR.WARPS[$START_SECTOR][$i]
		if ($adj_start = $MAP~stardock)
			setVar $WeAreAdjDock TRUE
		end
		add $i 1
	end

	Echo "**" & ANSI_14 & "Please Stand By" & ANSI_15 & " - Calculating Distances...**"
	getdistance $dist1 $START_SECTOR $MAP~stardock

	if ($dist1 <= 0)
		setvar $switchboard~message "Insufficient Warp Data Plotting Course to Dock*"
		gosub :switchboard~switchboard
		send "*"
		halt
	end

	getdistance $dist2 $MAP~stardock $START_SECTOR
	if ($dist2 <= 0)
		setvar $switchboard~message "Insufficient Warp Data Plotting Return Course From Dock*"
		gosub :switchboard~switchboard
		send "*"
		halt
	end

	setVar $ore_req (($dist1 + $dist2) * 3)

	if ($PLAYER~ORE_HOLDS < $ore_req)
		#setvar $switchboard~message "Not Enough ORE In Holds To Make Round Trip.  Needs "&$ore_req&".*"
		#gosub :switchboard~switchboard
		send "*"
		gosub :getsomefuel
	end


	if (($player~alignment < 1000) AND ($WeAreAdjDock = FALSE))
		setVar $RED_adj 0
		gosub :FindJumpSector
		if ($RED_adj = 0)
			waitfor "Command [TL="
#			setvar $switchboard~message "Cannot Find Jump Sector Adjacent Dock*"
#			gosub :switchboard~switchboard
			send "*"
			return
		end
	end

	if ($player~alignment >= 1000)
		if ($WeAreAdjDock)
			send "^F" & $MAP~stardock & "*" & $START_SECTOR & "*Q/ "
		else
			send "^F" & $START_SECTOR & "*" & $MAP~stardock & "*F" & $MAP~stardock & "*" & $START_SECTOR & "*Q/ "
		end
	else
		if ($WeAreAdjDock)
			send "^F" & $MAP~stardock & "*" & $START_SECTOR & "*Q/ "
		else
			send "^F" & $START_SECTOR & "*" & $RED_adj & "*F" & $MAP~stardock & "*" & $START_SECTOR & "*Q/ "
		end
	end
	setTextLineTrigger noJoy :noJoy "*** Error - No route within"
	setTextTrigger cont :cont "(?="
	pause

	:noJoy
		killAllTriggers
		setvar $switchboard~message "Cannot Find Path to StarDock!*"
		gosub :switchboard~switchboard
		send "*"
		halt
	:cont
		killAllTriggers
		setDelayTrigger Latency_Delay		:Latency_Delay 500
		pause

		:Latency_Delay


		if ($PLAYER~TWARP_TYPE = "No")
			setvar $switchboard~message "Must Have Twarp 1 or 2*"
			gosub :switchboard~switchboard
			send "*"
			halt
		end

		if ($PLAYER~unlimitedGame = 0)
			gosub :TurnsRequired
			if ($turnsRequired > currentturns)
				setvar $switchboard~message "Not Enough Turns. "&$turnsRequired&", Required*"
				gosub :switchboard~switchboard
				send "*"
				halt
			elseif ($turnsRequired <= currentturns)
				setVar $tmp (currentturns - $turnsRequired)
				if ($tmp <= $bot~bot_turn_limit)
					setvar $switchboard~message "Proceeding Will Leave Fewer Than " & $bot~bot_turn_limit & " Turns!*"
					gosub :switchboard~switchboard
					send "*"
					halt
				end
			end
		end

	send " C R " & $MAP~stardock & "*Q "
	setTextLineTrigger itsalive :itsalive "Items     Status  Trading % of max OnBoard"
	setTextLineTrigger nosoupforme :nosoupforme "I have no information about a port in that sector"
	pause
	:nosoupforme
		killAllTriggers
		setvar $switchboard~message "StarDock appears to have been Blown Up!*"
		gosub :switchboard~switchboard
		send "*"
		halt
	:itsalive
		killAllTriggers
		waitfor "(?="
		setVar $msg ""
		if ((currentalignment >= 1000) AND ($WeAreAdjDock = FALSE))
			setVar $warpto $MAP~stardock
			gosub :DoTwarp
		elseif (($WeAreAdjDock = FALSE) AND ($RED_adj <> 0))
			setVar $warpto $RED_adj
			gosub :DoTwarp
		else
			send "q q *  m " & $MAP~stardock & "*  *  P  S G Y G Q "
		end
		if ($msg = "")
			waitfor "You leave the Galactic Bank."
		else
			setvar $switchboard~message "Unknown Problem Detected. Check TA!*"
			gosub :switchboard~switchboard
			send "*"
			halt
		end
		gosub :PLAYER~quikstats


return


:getsomefuel
	gosub :player~quikstats
	setVar $bottom 1
	setVar $top 1
	setArray $checked SECTORS
	setVar $que[1] $player~current_sector
	setVar $checked[$player~current_sector] 1
	setvar $a 1
	:try_again
	while ($bottom <= $top)
		# Now, pull out the next sector in the queue, and make it our focus
		setVar $focus $que[$bottom]
		getsectorparameter $focus "FIGSEC" $isFigged
		getsectorparameter $focus "BUSTED" $isBusted

		send " C R " & $focus & "*Q "
		gosub :player~quikstats
		if ((PORT.BUYFUEL[$focus] <> true) and (PORT.FUEL[$focus] > $player~total_holds) and ($isBusted <> true))
			setVar $mowintosector $focus
			gosub :mowIntoSector
			if (((PORT.BUYORG[$focus]) and ($player~organic_holds > 0)) OR ((PORT.BUYEQUIP[$focus]) and ($player~equipment_holds > 0)))
				send "p t * * * * * * "
			else
				send "j y p t * * 0 * 0 * "
			end
			return
		end
		# That wasn't it, so let's add all the adjacents to the queue for future testing.
		setVar $a 1
		while (SECTOR.WARPS[$focus][$a] > 0)
			setVar $adjacent SECTOR.WARPS[$focus][$a]
			# But only add them if they haven't been added previously
			if ($checked[$adjacent] = 0)
				# Okay, this one hasn't been checked, so tag it and que it.
				setVar $checked[$adjacent] 1
				add $top 1
				setVar $que[$top] $adjacent
			end
			add $a 1
		end
		# The adjacents of $focus were all queued, now on to the next one.
		add $bottom 1
	end	
	setVar $SWITCHBOARD~message "Can't find a route to fuel.  Halting*"
	gosub :SWITCHBOARD~switchboard
	halt

return


:FindJumpSector
	setVar $i 1
	setVar $RED_adj 0
	send "qq*"
	while (SECTOR.WARPSIN[$MAP~stardock][$i] > 0)
		setVar $RED_adj SECTOR.WARPSIN[$MAP~stardock][$i]
		send "m " & $RED_adj & "* y"
		setTextTrigger TwarpBlind 			:TwarpBlind "Do you want to make this jump blind? "
		setTextTrigger TwarpLocked			:TwarpLocked "All Systems Ready, shall we engage? "
		setTextLineTrigger TwarpVoided			:TwarpVoided "Danger Warning Overridden"
		setTextLineTrigger TwarpAdj			:TwarpAdj "<Set NavPoint>"
		settextlinetrigger twarpempty	:twarpempty "You do not have enough Fuel Ore to make the jump"
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

		goto :SectorLocked

		:TwarpBlind
		killAllTriggers
		send " N "

		:twarpempty
		killAllTriggers
		
		:TryingNextAdj
    	add $i 1
	end

	:NoAdjsFound
		setVar $RED_adj 0
		return

	:SectorLocked
		return


:TurnsRequired
	send "i"
	setTextLineTrigger TurnsRequired_TPW	:TurnsRequired_TPW "Turns to Warp  : "
	pause

	:TurnsRequired_TPW
	killAllTriggers
	getWord CURRENTLINE $turnsRequired_TPW 5

	if ($RED_adj > 0)
		# twarp to jmp sector, then into SD sect, then twarp home
		setVar $turnsRequired_temp ($turnsRequired_TPW * 3)
		if ($_Tow > 0)
			# 2 Turns for exporting into other ship and back again
			add $turnsRequired_temp_temp 2
			# 3 Turns for initial Port then x into other ship, port & shop, then x and report
			#   b4 heading home
			add $turnsRequired_temp 3
		else
			add $turnsRequired_temp 1
		end
	else
		setVar $turnsRequired_temp ($turnsRequired_TPW * 2)
		# 1 Turn to port at dock
		add $turnsRequired_temp 1
	end

	setVar $turnsRequired $turnsRequired_temp
	return


:callSaveMe
	send "q q q q * '"&$SWITCHBOARD~bot_name&" call*"
	halt

:DoTwarp
	setVar $msg ""
	if ($warpto > 0)
		send "q q * * mz" & $warpto "*"
		setTextTrigger there        :adj_warp "You are already in that sector!"
		setTextLineTrigger adj_warp :adj_warp "Sector  : " & $warpto & " "
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
			setTextLineTrigger no_fuel 		:itwarpNoFuel "You do not have enough Fuel Ore"
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
			send "n*zn"
			send "l " & #8 & $PLANET~PLANET "*c"
			setSectorParameter $warpto "FIGSEC" FALSE
			setvar $msg "no twarp lock"
			return

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
			if (currentalignment >= 1000)
				setVar $str "y * * p s g y g q " 
				send $str
			else
				setVar $str "y  *  *  m " & $MAP~stardock & " *  *  p s g y g q "
				send $str
			end
			setvar $twarp_refurb_success true
		:twarpDone
			if ($msg <> "")
				setvar $switchboard~message "Twarp Error - " & $msg & "*"
				gosub :switchboard~switchboard
				send "*"
			end
	end
	return

:bwarp

	killAllTriggers
	send "b" $warpto "*"
	setTextTrigger go :go5 "TransWarp Locked"
	setTextTrigger no :no5 "No locating beam found"
	goSub :delayTrigger
	pause

:no5
	killAllTriggers
	send "n "
	waitfor "Transporter shutting down."
	return

:go5
	killAllTriggers
	send "y z * "
	return

#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\ship\getshipstats\ship"
include "source\bot_includes\planet\getplanetinfo\planet"
