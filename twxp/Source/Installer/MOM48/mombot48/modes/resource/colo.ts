logging off
gosub :BOT~loadVars

#HELP FILE
        setVar $BOT~help[1]  $BOT~tab&"Gets colos from Terra  "
        setVar $BOT~help[2]  $BOT~tab&"  "
        setVar $BOT~help[3]  $BOT~tab&"colo [r/s/m/t/p] {misc} {t/b} {f} {c:x}  "
        setVar $BOT~help[4]  $BOT~tab&"         "
        setVar $BOT~help[5]  $BOT~tab&"Options: "
        setVar $BOT~help[6]  $BOT~tab&"   - [r/s/m/t/p] = [r]ed/[s]peed/[m]ilk/[t]imed/speed [p]ort"
        setVar $BOT~help[7]  $BOT~tab&"     speed = cycles - cycles to grab colos (default max)"
        setVar $BOT~help[8]  $BOT~tab&"     milk  = min colos - min colos before grab (default 0)"
        setVar $BOT~help[9]  $BOT~tab&"     timed = delay  - time to wait each cycle (default 15 seconds)"
        setVar $BOT~help[10]  $BOT~tab&"    red   = jump sector - sector next to terra (can place planet there too)"
        setVar $BOT~help[11]  $BOT~tab&"     speed port   = same as speed but uses port for ore"
        setVar $BOT~help[12] $BOT~tab&"   - [misc]  = cycles/min colos/delay"
        setVar $BOT~help[13] $BOT~tab&"   - [t/b]   = [t]warp/[b]warp  (default is [t]warp)"
        setVar $BOT~help[14] $BOT~tab&"   - [f]   = Bwarp [S] Mode Only - Pick up fuel every 2nd trip"
        setVar $BOT~help[15] $BOT~tab&"   - [c:x]   = [c]amo holds (example: c:3 adds 3 holds extra fuel)"
        gosub :bot~helpfile

setVar $BOT~script_title "Colonizer"
gosub :BOT~banner


# ======================     START COLO (COLO) SUBROUTINE    ==========================
goto :Start_Up_Routines
:colo_next
	setvar $colo_sector $PLAYER~CURRENT_SECTOR
	setvar $mcol_holds $player~total_holds

	
	if ($colo_type = "r")
		if ($bot~parm2 <= 0)
			setVar $SWITCHBOARD~message "No jump sector defined for red colo. Halting.*"
			gosub :SWITCHBOARD~switchboard
			halt
		end
	    setVar $PLAYER~starting_point $bot~parm2
		setVar $PLAYER~destination 1
		gosub :player~getCourse
	    setVar $j 2
	    setVar $result ""
	    while ($j <= $PLAYER~courseLength)
	        if ($PLAYER~mowCourse[$j] <> $PLAYER~CURRENT_SECTOR)
	            setVar $result $result&"m    "&$PLAYER~mowCourse[$j]&"*               "
	            if (($PLAYER~mowCourse[$j] > 10) AND ($PLAYER~mowCourse[$j] <> $MAP~stardock))
	                setVar $result $result&"za  "&$SHIP~SHIP_MAX_ATTACK&"* *             "
	            end
	        end
	        add $j 1
	    end
    	setVar $to_mow $result
    	setvar $no_twarp false
    	if ($colo_sector <> $bot~parm2)
			send "cf" $colo_sector "*"&$bot~parm2&"*q"
			waitfor "The shortest path"
			getword CURRENTLINE $colo_hops1 4
			striptext $colo_hops1 "("
			setVar $colo_fuel1 ($colo_hops1 * 3)
		else
			#already as close to terra as possible
			setvar $colo_fuel1 0
			setvar $colo_hops1 0
			setvar $no_twarp true
		end
	else
		send "cf" $colo_sector "*1*q"
		waitfor "The shortest path"
		getword CURRENTLINE $colo_hops1 4
		striptext $colo_hops1 "("
		setVar $colo_fuel1 ($colo_hops1 * 3)
	end
	send "cf1*" $colo_sector "*q"
	waitfor "The shortest path"
	getword CURRENTLINE $colo_hops2 4
	striptext $colo_hops2 "("
	setVar $colo_fuel2 ($colo_hops2 * 3)
	if ($BWARP)
		if ($colo_hops1 > $planet~planet_TRANSPORT)
			setVar $SWITCHBOARD~message "B-Warp on planet not upgraded enough for B-warp Colo*"
			gosub :SWITCHBOARD~switchboard
			halt
		end
		#ham setvar $colo_fuel $colo_fuel2
		if ($doubleOre = TRUE)
			
			setvar $colo_fuel ($colo_fuel2 * 2)
		else
			setvar $colo_fuel $colo_fuel2
		end
		setvar $colo_get ($mcol_holds - $colo_fuel1)
		setVar $PLAYER~TURNSPerCycle (1+$PLAYER~TURNS_PER_WARP+1+1)
 	else
		setvar $colo_fuel ($colo_fuel1 + $colo_fuel2)
		setvar $colo_get ($mcol_holds - $colo_fuel1)
		setVar $PLAYER~TURNSPerCycle ($PLAYER~TURNS_PER_WARP+$PLAYER~TURNS_PER_WARP+1+1)
 	end

	### Speed Port - Work out max cycles
	# ASsumption is that even with bwarp we are just using fuel from port.
	# else why else do it?

	if ($colo_type = "p")
		if ($BWARP)
			# Fuel THere
			setvar $fuel_req ($colo_hops1 * 10)
			
			# plus back
			add $fuel_req $colo_fuel2
		else
			setvar $fuel_req ($colo_fuel1 + $colo_fuel2)
		end
		send "cr*q"
		waitfor "Commerce report for"
		waitfor "Fuel Ore"
		getword CURRENTLINE $fuel_avail 4
		if ($allore = TRUE)
			# buying a full load each trip
			setvar $max_trips ($fuel_avail/$mcol_holds)
			setvar $portbuy $mcol_holds
		else
			# buying just what is required
			setvar $max_trips ($fuel_avail/$fuel_req)
			setvar $portbuy $fuel_req
		end

		# BWARP Only
		setvar $leave_ore ($portbuy - $colo_fuel2)
		# user has chosen a max trips
		if ($colo_misc > 0)
			# just bring it down to max trips
			if ($colo_misc > $max_trips)
				setVar $colo_misc $max_trips
			end
		else
			#user did not choose but we will choose for them to not run out of fuel
			setVar $colo_misc $max_trips
		end

		setVar $portBurst "p  t  "&$portbuy&"  *  * "
		
		if ($allore = FALSE)
			if (PORT.BUYORG[CURRENTSECTOR] = 0)
				setVar $portBurst $portBurst&"0*  "
			end
			if (PORT.BUYEQUIP[CURRENTSECTOR] = 0)
				setVar $portBurst $portBurst&"0*  "
			end
		end
	end

### 

:colo_land
	if ($camoHolds = TRUE)
		if (($camo_holds + $colo_fuel) >= $player~total_holds)
			setVar $SWITCHBOARD~message "Too many camo holds for this ship.*"
			gosub :SWITCHBOARD~switchboard
			halt
		end
		send " j y l " $planet~planet "*  t * t 1 " ($colo_fuel+$camo_holds) "*  "
	else
		if ($doubleOre = TRUE)
			
			send " j y l " $planet~planet "*  "
			if ($doubleOreGet = TRUE)
				setVar $doubleOreGet FALSE
				send "t * t 1 " $colo_fuel "*  "
			else
				setVar $doubleOreGet TRUE
				
			end
		else
			if ($colo_type = "p")
				send " j y " $portBurst " l " $planet~planet "*  "
				if ($BWARP)
					send " t  n   l   1   " $leave_ore " *  "
				end
			else
				send " j y l " $planet~planet "*  t * t 1 " $colo_fuel "*  "
			end
		end
	end
	if ($BWARP = TRUE)
		send "c "
	else
		send "q "
	end


	if ($PLAYER~PLANET_SCANNER = "No")
		SetVar $Land_mac "  L  T  " & $BOT~parm2 & "*   "
	else
		SetVar $Land_mac "  L  1*  T  " & $BOT~parm2 & "*   "
	end
	if ($colo_type = "m")
	   if ($BOT~parm2 < 1)
	      setvar $BOT~parm2 1
	   end
		setVar $colo_min $colo_misc
		while (TRUE)
			if (($PLAYER~unlimitedGame = FALSE) AND ($PLAYER~TURNS < ($BOT~bot_turn_limit+$PLAYER~TURNSPerCycle)))
				if ($BWARP = FALSE)
					send "l "&$planet~planet&"* "
					if ($startingLocation = "Citadel")
						send "c "
					end
				end
				setVar $SWITCHBOARD~message "Too low on turns to continue. Turn limit set to: "&($BOT~bot_turn_limit)&" turns.*"
				gosub :SWITCHBOARD~switchboard
				halt
			end
			if ($BWARP)
				send "b 1*y "
				setTextLineTrigger 36 :noFuel2 "This planet does not have enough Fuel Ore to transport you."
			else
				send "m 1* y y "
				setTextLineTrigger 36 :noFuel2 "<Set NavPoint>"
			end
			setTextLineTrigger 37 :colo_wait "All Systems Ready, shall we engage?"
			pause
			:noFuel2
				killalltriggers
				if ($BWARP = FALSE)
					send "* * l "&$planet~planet&"* "
					if ($startingLocation = "Citadel")
						send "c "
					end
				end
				setVar $SWITCHBOARD~message "Colonizer needs more fuel on planet "&$planet~planet&"."
				gosub :SWITCHBOARD~switchboard
				halt

			:colo_wait
				gosub :player~quikstats
				setvar $empty_holds ($player~total_holds - ($player~COLONIST_HOLDS + $player~ore_holds))
				#There are currently 3417042 colonists ready to leave Terra.
				if ($empty_holds <= 0)
					goto :grabbed
				end
				:check_colos
				if ($PLAYER~PLANET_SCANNER = "No")
					send "  l q "
				else
					send "  l  1*q "
				end
				waiton " colonists ready to leave Terra."
				getword currentline $scam_check 1
				if ($scam_check <> "There")
					goto :check_colos
				end
				getword currentline $colos_on_terra 4
				if ($colos_on_terra < $colo_min)
					goto :check_colos
				end
				if ($colos_on_terra > $empty_holds)
					setvar $amount_to_grab $empty_holds
				else
					setvar $amount_to_grab $colos_on_terra
				end
				if ($PLAYER~PLANET_SCANNER = "No")
					SetVar $Land_mac "  L  T"&$amount_to_grab&"*   "
				else
					SetVar $Land_mac "  L  1*  T"&$amount_to_grab&"*   "
				end

				Send $Land_mac
				setTextLineTrigger	Done	:Done		"The Colonists file aboard your ship"
				setTextLineTrigger	None	:Done		"There aren't that many on Terra!"
				settextlinetrigger  none2   :Done       "You return to your ship and leave the planet."
				setTextTrigger		Grabbed	:Grabbed	"([0] empty holds)"
				pause
			:Done
				killAllTriggers
				goto :colo_wait
			:Grabbed
				killAllTriggers

			send " M"& $colo_sector & "* Y "
			setTextLineTrigger	Whoops			:Whoops			"You don't have enough turns left"
		    setTextTrigger 		twarp_lock		:twarp_lock 	"All Systems Ready, shall we engage"
		    setTextTrigger 		no_twrp_lock	:no_twarp_lock	"Do you want to make this jump blind"
			pause
			:Whoops
				killAlltriggers
				send "  **  "
				setVar $SWITCHBOARD~message "Out Of Turns. At Terra!*"
				gosub :SWITCHBOARD~switchboard
				halt
			:no_twarp_lock
				killAllTriggers
				send " N "
				setVar $SWITCHBOARD~message "Unable To Return Twarp, No Fighter Lock!*"
				gosub :SWITCHBOARD~switchboard
				halt

			:twarp_lock
				killAllTriggers
				send " y * l "&$planet~planet&"* s**"&$colo_prod&"* "

			setTextLineTrigger	33 				:more			"The Colonists disembark"
			setTextLineTrigger	34				:next_item		"There isn't room on the planet"
			pause


			:next_item
			killAllTriggers
			#CHANGE ITEM TO NEXT
			add $colo_prod 1
			#IF PLANET FULL, HALT SCRIPT
			if ($colo_prod >= 4)
				setVar $SWITCHBOARD~message "Planet is full of colonists, no more can be added. Colonizer shutting down.**"
				gosub :SWITCHBOARD~switchboard
				send "l "&$planet~planet&"* "
				if ($startingLocation = "Citadel")
					send "c "
				end
				halt
			end
			send "s**"&$colo_prod&"* "
			:more
			#KEEP RUNNING
			
			if ($BWARP)
				send "t * t 1"&$colo_fuel&"* c "
			else
				send "t * t 1"&$colo_fuel&"* q "
			end
			gosub :PLAYER~quikstats
			killalltriggers
		end
	elseif ($colo_type = "p")
		setVar $colo_cycles $colo_misc
		setVar $i 0
		if ($colo_cycles = 0)
			setVar $keepGoing TRUE
		else
			setVar $keepGoing FALSE
		end
		while (($i < $colo_cycles) OR ($keepGoing))
			if (($PLAYER~unlimitedGame = FALSE) AND ($PLAYER~TURNS < ($BOT~bot_turn_limit+$PLAYER~TURNSPerCycle)))
				if ($BWARP = FALSE)
					send "l "&$planet~planet&"* "
					if ($startingLocation = "Citadel")
						send "c "
					end
				end
				setVar $SWITCHBOARD~message "Too low on turns to continue. Turn limit set to: "&($BOT~bot_turn_limit)&" turns.*"
				gosub :SWITCHBOARD~switchboard
				halt
			end
			:colo_speed_port
			killalltriggers


			if ($BWARP = TRUE)
				if ($PLAYER~PLANET_SCANNER = "No")
					setVar $coloBurst "b 1*y    l * * "
				else
					setVar $coloBurst "b 1*y    l 1* * * "
				end
			else
				if ($PLAYER~PLANET_SCANNER = "No")
					setVar $coloBurst "m 1* y y    l * * "
				else
					setVar $coloBurst "m 1* y y    l 1* * * "
				end

			end
			setVar $coloBurst $coloBurst&"m "&$colo_sector&"* y y    * l "&$planet~planet&"* s * * "&$colo_prod&"*"
			
			

			if ($BWARP = TRUE)
				if ($colo_prod < 3)
					setVar $coloBurst $coloBurst&"s * * "&($colo_prod+1)&"* "
				else
					setVar $coloBurst $coloBurst&""
				end

				
				#setVar $coloBurst $coloBurst&"  t * t 1"&$colo_fuel&"* c "
				setVar $coloBurst $coloBurst& "   q   "&$portBurst&"l "&$planet~planet&"*  t  n   l   1   "&$leave_ore&" *  c "
			else
				if ($colo_prod < 3)
					#setVar $coloBurst $coloBurst&"s * * "&($colo_prod+1)&"* t * t 1"&$colo_fuel&"* q q * "
					setVar $coloBurst $coloBurst&"s * * "&($colo_prod+1)&"* q * "&$portBurst 
				else
					#setVar $coloBurst $coloBurst&" t * t 1"&$colo_fuel&"* q "
					setVar $coloBurst $coloBurst&" q * " &$portBurst
				end
			end
			send $coloBurst
			if ($BWARP = TRUE)
				setTextLineTrigger 136 :noFuelPort "This planet does not have enough Fuel Ore to transport you."
			else
				setTextLineTrigger 136 :noFuelPort "<Set NavPoint>"
			end
			setTextLineTrigger 137 :fuelport "All Systems Ready, shall we engage?"
			pause

			:fuelport
			killalltriggers
			waitfor "There are currently"
			getword CURRENTLINE $colo_colos 4

			setTextLineTrigger 133 :moreport "The Colonists disembark"
			setTextLineTrigger 134 :next_item_port "There isn't room on the planet"
			setTextLineTrigger 135 :doneport "There aren't that many on Terra!"
			pause
			:noFuelPort
				killalltriggers
				if ($BWARP <> TRUE)
					send "* * l "&$planet~planet&"* "
					if ($startingLocation = "Citadel")
						send "c "
					end
				end
				setVar $SWITCHBOARD~message "Colonizer needs more fuel on planet "&$planet~planet&".*"
				gosub :SWITCHBOARD~switchboard
				halt
			:doneport
				killalltriggers
				setVar $SWITCHBOARD~message "Terra is empty. Colonizer shutting down.*"
				gosub :SWITCHBOARD~switchboard
				if ($BWARP <> TRUE)
					send "l "&$planet~planet&"* "
					if ($startingLocation = "Citadel")
						send "c "
					end
				end
				halt
			:next_item_port
				killAllTriggers
				#CHANGE ITEM TO NEXT
				add $colo_prod 1
				#IF PLANET FULL, HALT SCRIPT
				if ($colo_prod >= 4)
					setVar $mode "General"
					saveVar $mode
					setVar $SWITCHBOARD~message "Planet is full of colonists, no more can be added. Colonizer shutting down.*"
					gosub :SWITCHBOARD~switchboard
					send "l "&$planet~planet&"* "
					if ($startingLocation = "Citadel")
						send "c "
					end
					halt
				end
			:moreport
				killalltriggers
				add $i 1
				if ($PLAYER~unlimitedGame = FALSE)
					setVar $PLAYER~turns ($PLAYER~turns-$PLAYER~TURNSPerCycle)
				end
		end
	elseif ($colo_type = "s")
		setVar $colo_cycles $colo_misc
		setVar $i 0
		if ($colo_cycles = 0)
			setVar $keepGoing TRUE
		else
			setVar $keepGoing FALSE
		end
		while (($i < $colo_cycles) OR ($keepGoing))
			if (($PLAYER~unlimitedGame = FALSE) AND ($PLAYER~TURNS < ($BOT~bot_turn_limit+$PLAYER~TURNSPerCycle)))
				if ($BWARP = FALSE)
					send "l "&$planet~planet&"* "
					if ($startingLocation = "Citadel")
						send "c "
					end
				end
				setVar $SWITCHBOARD~message "Too low on turns to continue. Turn limit set to: "&($BOT~bot_turn_limit)&" turns.*"
				gosub :SWITCHBOARD~switchboard
				halt
			end
			:colo_speed
			killalltriggers


			if ($BWARP = TRUE)
				if ($PLAYER~PLANET_SCANNER = "No")
					setVar $coloBurst "b 1*y    l * * "
				else
					setVar $coloBurst "b 1*y    l 1* * * "
				end
			else
				if ($PLAYER~PLANET_SCANNER = "No")
					setVar $coloBurst "m 1* y y    l * * "
				else
					setVar $coloBurst "m 1* y y    l 1* * * "
				end

			end
			setVar $coloBurst $coloBurst&"m "&$colo_sector&"* y y    * l "&$planet~planet&"* s * * "&$colo_prod&"*"
			if ($BWARP = TRUE)
				if ($colo_prod < 3)
					setVar $coloBurst $coloBurst&"s * * "&($colo_prod+1)&"* "
				else
					setVar $coloBurst $coloBurst&""
				end
				if ($doubleOre = TRUE)
					if ($doubleOreGet = TRUE)
						setVar $doubleOreGet FALSE
						setVar $coloBurst $coloBurst&" t * t 1"&$colo_fuel&"* c "
					else
						setVar $doubleOreGet TRUE
						setVar $coloBurst $coloBurst&" c "
					end
					
				else
					setVar $coloBurst $coloBurst&"  t * t 1"&$colo_fuel&"* c "
				end

			else
				if ($colo_prod < 3)
					setVar $coloBurst $coloBurst&"s * * "&($colo_prod+1)&"* t * t 1"&$colo_fuel&"* q q * "
				else
					setVar $coloBurst $coloBurst&" t * t 1"&$colo_fuel&"* q "
				end
			end
			send $coloBurst
			if ($BWARP = TRUE)
				setTextLineTrigger 36 :noFuel "This planet does not have enough Fuel Ore to transport you."
			else
				setTextLineTrigger 36 :noFuel "<Set NavPoint>"
			end
			setTextLineTrigger 37 :fuel "All Systems Ready, shall we engage?"
			pause

			:fuel
			killalltriggers
			waitfor "There are currently"
			getword CURRENTLINE $colo_colos 4

			setTextLineTrigger 33 :morespeed "The Colonists disembark"
			setTextLineTrigger 34 :next_item_speed "There isn't room on the planet"
			setTextLineTrigger 35 :donespeed "There aren't that many on Terra!"
			pause
			:noFuel
				killalltriggers
				if ($BWARP <> TRUE)
					send "* * l "&$planet~planet&"* "
					if ($startingLocation = "Citadel")
						send "c "
					end
				end
				setVar $SWITCHBOARD~message "Colonizer needs more fuel on planet "&$planet~planet&".*"
				gosub :SWITCHBOARD~switchboard
				halt
			:donespeed
				killalltriggers
				setVar $SWITCHBOARD~message "Terra is empty. Colonizer shutting down.*"
				gosub :SWITCHBOARD~switchboard
				if ($BWARP <> TRUE)
					send "l "&$planet~planet&"* "
					if ($startingLocation = "Citadel")
						send "c "
					end
				end
				halt
			:next_item_speed
				killAllTriggers
				#CHANGE ITEM TO NEXT
				add $colo_prod 1
				#IF PLANET FULL, HALT SCRIPT
				if ($colo_prod >= 4)
					setVar $mode "General"
					saveVar $mode
					setVar $SWITCHBOARD~message "Planet is full of colonists, no more can be added. Colonizer shutting down.*"
					gosub :SWITCHBOARD~switchboard
					send "l "&$planet~planet&"* "
					if ($startingLocation = "Citadel")
						send "c "
					end
					halt
				end
			:morespeed
				killalltriggers
				add $i 1
				if ($PLAYER~unlimitedGame = FALSE)
					setVar $PLAYER~turns ($PLAYER~turns-$PLAYER~TURNSPerCycle)
				end
		end
	elseif ($colo_type = "t")
		setVar $colo_delay $colo_misc
		setVar $i 0
		setvar $colo_Got 0
		setVar $colo_Gotten 0
		setVar $colo_Trips 0
		if ($colo_delay = 0)
			setVar $colo_delay 15
		end
		while ($colo_prod < 4)
			:colo_timed
			killalltriggers
			gosub :PLAYER~quikstats
			if (($PLAYER~unlimitedGame = FALSE) AND ($PLAYER~turns < ($BOT~bot_turn_limit+$PLAYER~TURNSPerCycle)))
				if ($BWARP = FALSE)
					send "l "&$planet~planet&"* "
					if ($startingLocation = "Citadel")
						send "c "
					end
				end
				setVar $SWITCHBOARD~message "Too low on turns to continue. Turn limit set to: "&($bot_turn_limit)&" turns.*"
				gosub :SWITCHBOARD~switchboard
				halt
			end

			if ($BWARP)
				if ($PLAYER~PLANET_SCANNER = "No")
					setVar $coloBurst "b 1*y    l * "
				else
					setVar $coloBurst "b 1*y    l 1* * "
				end
			else
				if ($PLAYER~PLANET_SCANNER = "No")
					setVar $coloBurst "m 1* y y    l * "
				else
					setVar $coloBurst "m 1* y y    l 1* * "
				end
			end
			send $coloBurst
			waitfor "There are currently"
			getword CURRENTLINE $colo_colos 4
			if ($colo_colos > $colo_get)
				send $colo_get&"* "
				setVar $colo_got $colo_get
			else
				send $colo_colos&"* "
				setVar $colo_got $colo_colos
			end
			setVar $coloBurst "m "&$colo_sector&"* y y    * l "&$planet~planet&"* s * * "&$colo_prod&"*"
			if ($BWARP)
				if ($colo_prod < 3)
					setVar $coloBurst $coloBurst&"s * * "&($colo_prod+1)&"* t * t 1"&$colo_fuel&"* c "
				else
					setVar $coloBurst $coloBurst&" t * t 1"&$colo_fuel&"* c "
				end
			else
				if ($colo_prod < 3)
					setVar $coloBurst $coloBurst&"s * * "&($colo_prod+1)&"* t * t 1"&$colo_fuel&"* q q * "
				else
					setVar $coloBurst $coloBurst&" t * t 1"&$colo_fuel&"* q "
				end
			end
			send $coloBurst
			if ($BWARP)
				setTextLineTrigger 36 :noFuelTimed "This planet does not have enough Fuel Ore to transport you."
			else
				setTextLineTrigger 36 :noFuelTimed "<Set NavPoint>"
			end
			setTextLineTrigger 37 :fuelTimed "All Systems Ready, shall we engage?"
			pause

			:fuelTimed
			killalltriggers

			setTextLineTrigger 33 :moretimed "The Colonists disembark"
			setTextLineTrigger 34 :next_item_timed "There isn't room on the planet"
			pause
			:noFuelTimed
				killalltriggers
				if ($BWARP <> TRUE)
					send "* * l "&$planet~planet&"* "
					if ($startingLocation = "Citadel")
						send "c "
					end
				end
				setVar $SWITCHBOARD~message "Colonizer needs more fuel on planet "&$planet~planet&".*"
				gosub :SWITCHBOARD~switchboard
				halt

			:next_item_timed
				killAllTriggers
				#CHANGE ITEM TO NEXT
				add $colo_prod 1
				#IF PLANET FULL, HALT SCRIPT
				if ($colo_prod >= 4)
					setVar $SWITCHBOARD~message "Planet is full of colonists, no more can be added. Colonizer shutting down.*"
					gosub :SWITCHBOARD~switchboard
					if ($BWARP <> TRUE)
						send "l "&$planet~planet&"* "
						if ($startingLocation = "Citadel")
							send "c "
						end
					end
					halt
				end
			:moretimed
				killalltriggers
				if ($colo_colos < $colo_get)
					add $colo_Gotten $colo_got
					add $colo_Trips 1
					setVar $SWITCHBOARD~message "Cols Grabbed: " & $colo_got & " (" & $colo_Trips & " Trips, Total: " & $colo_Gotten & ")*"
					gosub :SWITCHBOARD~switchboard
					setDelayTrigger 40 :colo_timed ($colo_delay*1000)
					pause
				end
		end
	elseif ($colo_type = "r")
		setVar $jump_sector $colo_misc
		setVar $colo_prod 1
		while (TRUE)
			if (($PLAYER~unlimitedGame = FALSE) AND ($PLAYER~TURNS < ($BOT~bot_turn_limit+$PLAYER~TURNSPerCycle)))
				if ($BWARP = FALSE)
					send "l "&$planet~planet&"* "
					if ($startingLocation = "Citadel")
						send "c "
					end
				end
				setVar $SWITCHBOARD~message "Too low on turns to continue. Turn limit set to: "&($BOT~bot_turn_limit)&" turns.*"
				gosub :SWITCHBOARD~switchboard
				halt
			end
			:colo_red
			killalltriggers
			if ($no_twarp = true)
					if ($PLAYER~PLANET_SCANNER = "No")
						setVar $coloBurst $to_mow&"          l * * "
					else
						setVar $coloBurst $to_mow&"          l 1* * * "
					end
			else
				if ($BWARP = TRUE)
					if ($PLAYER~PLANET_SCANNER = "No")
						setVar $coloBurst "b "&$jump_sector&"*y      "&$to_mow&"          l * * "
					else
						setVar $coloBurst "b "&$jump_sector&"*y       "&$to_mow&"          l 1* * * "
					end
				else
					if ($PLAYER~PLANET_SCANNER = "No")
						setVar $coloBurst "m "&$jump_sector&"* y y       "&$to_mow&"        l * * "
					else  
						setVar $coloBurst "m "&$jump_sector&"* y y       "&$to_mow&"        l 1* * * "
					end

				end
			end
			setVar $coloBurst $coloBurst&"m "&$colo_sector&"* y y    * l "&$planet~planet&"* s * * "&$colo_prod&"*"
			if ($BWARP = TRUE)
				if ($colo_prod < 3)
					setVar $coloBurst $coloBurst&"s * * "&($colo_prod+1)&"* t * t 1"&$colo_fuel&"* c "
				else
					setVar $coloBurst $coloBurst&" t * t 1"&$colo_fuel&"* c "
				end
			else
				if ($colo_prod < 3)
					setVar $coloBurst $coloBurst&"s * * "&($colo_prod+1)&"* t * t 1"&$colo_fuel&"* q q * "
				else
					setVar $coloBurst $coloBurst&" t * t 1"&$colo_fuel&"* q "
				end
			end
			send $coloBurst
			if ($BWARP = TRUE)
				setTextLineTrigger 36 :noFuelRed "This planet does not have enough Fuel Ore to transport you."
			else
				setTextLineTrigger 36 :noFuelRed "<Set NavPoint>"
			end
			setTextLineTrigger 37 :fuelRed "All Systems Ready, shall we engage?"
			pause

			:fuelRed
#			killalltriggers
#			waitfor "There are currently"
#			getword CURRENTLINE $colo_colos 4

			setTextLineTrigger 33 :morered "The Colonists disembark"
			setTextLineTrigger 34 :next_item_red "There isn't room on the planet"
			setTextLineTrigger 35 :donered "There aren't that many on Terra!"
			pause
			:noFuelRed
				killalltriggers
				if ($BWARP <> TRUE)
					send "* * l "&$planet~planet&"* "
					if ($startingLocation = "Citadel")
						send "c "
					end
				end
				setVar $SWITCHBOARD~message "Colonizer needs more fuel on planet "&$planet~planet&".*"
				gosub :SWITCHBOARD~switchboard
				halt
			:donered
				killalltriggers
				setVar $SWITCHBOARD~message "Terra is empty. Colonizer shutting down.*"
				gosub :SWITCHBOARD~switchboard
				if ($BWARP <> TRUE)
					send "l "&$planet~planet&"* "
					if ($startingLocation = "Citadel")
						send "c "
					end
				end
				halt
			:next_item_red
				#CHANGE ITEM TO NEXT
				add $colo_prod 1
				#IF PLANET FULL, HALT SCRIPT
				if ($colo_prod >= 4)
					setVar $mode "General"
					saveVar $mode
					setVar $SWITCHBOARD~message "Planet is full of colonists, no more can be added. Colonizer shutting down.*"
					gosub :SWITCHBOARD~switchboard
					send "l "&$planet~planet&"* "
					if ($startingLocation = "Citadel")
						send "c "
					end
					halt
				end
			:morered
				killalltriggers
				if ($PLAYER~unlimitedGame = FALSE)
					setVar $PLAYER~turns ($PLAYER~turns-$PLAYER~TURNSPerCycle)
				end
		end
	end


# ======================     END COLO MILKER (colo) SUBROUTINE     ==========================
halt

:Start_Up_Routines
  	getWordPos " "&$bot~user_command_line&" " $pos " b "
	if ($pos > 0)
		setVar $Bwarp TRUE
		getWordPos " "&$bot~user_command_line&" " $pos " f "
		if ($pos > 0)
			setVar $doubleOre TRUE
			setVar $doubleOreGet TRUE
		else
			setVar $doubleOre FALSE
		end
	else
		setVar $Bwarp FALSE
	end

	getWordPos " "&$bot~user_command_line&" " $pos " allore "
	if ($pos > 0)
		setVar $allore TRUE
	else
		setVar $allore FALSE
	end

  	getWordPos " "&$bot~user_command_line&" " $pos " c:"
	if ($pos > 0)
		getText " "&$bot~user_command_line&" " $camo_holds "c:" " "
		isNumber $test $camo_holds
		if ($test)
			setVar $camoHolds TRUE
		else
			send "'{" $SWITCHBOARD~bot_name "} - Invalid camo holds entered*"
		end

	else
		setVar $camoHolds FALSE
	end

# ======================     START COLO  (COLO) SUBROUTINE    ==========================
:colo_setup
	gosub :PLAYER~quikstats
	getWord $bot~user_command_line $bot~parm1 1
	getWord $bot~user_command_line $bot~parm2 2
	getWord $bot~user_command_line $bot~parm3 3
	getWord $bot~user_command_line $bot~parm4 4
	getWord $bot~user_command_line $bot~parm5 5
	getWord $bot~user_command_line $bot~parm6 6

	setVar $startingLocation $PLAYER~CURRENT_PROMPT
	if (($startingLocation <> "Citadel") AND ($startingLocation <> "Planet"))
		setVar $SWITCHBOARD~message "Colo must be run from Planet or Citadel prompt*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
	
	if (($bot~parm1 <> "s") AND ($bot~parm1 <> "m") AND ($bot~parm1 <> "t") AND ($bot~parm1 <> "r") AND ($bot~parm1 <> "p"))
		setVar $SWITCHBOARD~message "Please use colo [s]peed, [m]ilk, [r]ed, [t]imed*, or speed [p]ort*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
	
	
	setVar $colo_type $bot~parm1
	if (($colo_type = "p") and (PORT.EXISTS[CURRENTSECTOR] = 0))
		setVar $SWITCHBOARD~message "No port here to buy fuel ore.*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
	if (($colo_type = "p") and (PORT.BUYFUEL[CURRENTSECTOR] = 1))
		setVar $SWITCHBOARD~message "Port must sell fuel to use speed port colo.*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
	if (($PLAYER~alignment < 1000) AND ($colo_type <> "r"))
		setVar $SWITCHBOARD~message "Alignment is to low to colo for blue colo. Try colo r for red colo.*"
		gosub :SWITCHBOARD~switchboard
		halt
	elseif ($PLAYER~TWARP_TYPE <> "1") and ($PLAYER~TWARP_TYPE <> "2")
		setVar $SWITCHBOARD~message "Must have Type 1 or 2 Twarp for Colo*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
	isNumber $test $bot~parm2
	if ($test <> TRUE)
		setVar $bot~parm2 0
	end
	Setvar $colo_misc $bot~parm2
# ======================     END COLO (COLO) SUBROUTINE     ==========================
	setVar $colo_prod 1
	setVar $colo_delay 1000
	if ($startingLocation = "Citadel")
		send "Q"
	end
	gosub :PLANET~getPlanetInfo
	send " t n l 1* t n l 2* t n l 3* s n l 1* s n l 2* s n l 3* q c u y q f 1* cd "
	gosub :PLAYER~getInfo
	goto :colo_next

#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\player\getcourse\player"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\player\getinfo\player"
