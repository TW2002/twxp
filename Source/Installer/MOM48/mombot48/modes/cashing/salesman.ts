	gosub :BOT~loadVars

	loadvar $GAME~ptradesetting
	loadVar $game~goldenabled
	loadVar $game~mbbs
	loadVar $game~port_max
	loadvar $game~rob_factor
	loadVar $game~production_rate
	loadVar $bot~folder
	setVar  $bot~no_credits_file $bot~folder&"/No_Credits.list"
	savevar $bot~no_credits_file
	loadvar $game~LIMPET_COST
	loadvar $game~ARMID_COST
	loadVar $game~LIMPET_REMOVAL_COST


	setVar $BOT~help[1]  $BOT~tab&"Visits all ports in grid and buys fuel"
	setVar $BOT~help[2]  $BOT~tab&"and sells/buys organics and equipment."
	setVar $BOT~help[3]  $BOT~tab&" "
	setVar $BOT~help[4]  $BOT~tab&"salesman [min port product] ({neg}otiate OR {hold}byhold)"
	setVar $BOT~help[5]  $BOT~tab&"{docim} {upgradefuel}"
	setVar $BOT~help[6]  $BOT~tab&"         "
	setVar $BOT~help[7]  $BOT~tab&"Options: "
	setVar $BOT~help[8]  $BOT~tab&"   {neg/hold}    Determines planet negotiate or hold selling"
	setVar $BOT~help[9]  $BOT~tab&"   {docim}       Does cim before starting route"
	setVar $BOT~help[10] $BOT~tab&"   {upgradefuel} Upgrades fuel ports selling fuel"
	setVar $BOT~help[11] $BOT~tab&"   {nohaggle}    Doesn't haggle when buying product"
	setVar $BOT~help[12] $BOT~tab&"   {sellfuel}    Sells fuel during travels"
	setVar $BOT~help[13] $BOT~tab&"       {grid}    Surround grid as you go"
	setVar $BOT~help[14] $BOT~tab&"        {rob}    Rob ports after buying down"
	setVar $BOT~help[15] $BOT~tab&"    {upgrade}    Slowly upgrade each port as it goes"
	gosub :bot~helpfile

	setVar $BOT~script_title "Traveling Salesman"
	gosub :BOT~banner

	setVar $PLAYER~save TRUE


		
:merchant
	gosub :PLAYER~quikstats
	setVar $startingLocation $PLAYER~CURRENT_PROMPT
	if ($startingLocation <> "Citadel")
		setVar $SWITCHBOARD~message "You must run Travelling Salesman command from a Citadel prompt.*"
		gosub :SWITCHBOARD~switchboard
 		halt
	end
	
	setVar $buyFuel TRUE
	
	getWordPos $bot~user_command_line $pos "docim"
	if ($pos > 0)
		setVar $docim TRUE
	else
		setVar $docim FALSE
	end
	getWordPos $bot~user_command_line $pos "grid"
	if ($pos > 0)
		setVar $grid TRUE
	else
		setVar $grid FALSE
	end

	getWordPos $bot~user_command_line $pos "nohaggle"
	if ($pos > 0)
		setVar $nohaggle TRUE
	else
		setVar $nohaggle FALSE
	end
	getWordPos " "&$bot~user_command_line&" " $pos " upgrade "
	if ($pos > 0)
		setVar $upgrade TRUE
	else
		setVar $upgrade FALSE
	end
	getWordPos $bot~user_command_line $pos "hold"
	if ($pos > 0)
		setVar $planet~planetNegotiate FALSE
	else
		setVar $planet~planetNegotiate TRUE
	end

	getWordPos $bot~user_command_line $pos "upgradefuel"
	if ($pos > 0)
		setVar $upgrade_fuel TRUE
	else
		setVar $upgrade_fuel FALSE
	end

	getWordPos $bot~user_command_line $pos "sellfuel"
	if ($pos > 0)
		setVar $sellfuel TRUE
	else
		setVar $sellfuel FALSE
	end

	getWordPos " "&$bot~user_command_line&" " $pos "mines"
	if ($pos > 0)
		setVar $mines TRUE
	else
		setVar $mines FALSE
	end

	getWordPos $bot~user_command_line $pos "rob"
	if ($pos > 0)
		setVar $do_rob TRUE
	else
		setVar $do_rob FALSE
	end

	setVar $minimumFuel $bot~parm1
	isNumber $number $minimumFuel
	if ($number <> 1)
		setVar $SWITCHBOARD~message " Minimum Port Product entered is not a number!*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
	if ($minimumFuel <= 0)
		setVar $SWITCHBOARD~message "Minimum Port Product must be greater than 0.*"
		gosub :SWITCHBOARD~switchboard
		halt
	end

	loadvar $PLAYER~surroundFigs 
	loadvar $PLAYER~surroundMine 
	loadvar $PLAYER~surroundLimp 
	loadvar $PLAYER~surroundAvoidAllPlanets 
	loadvar $PLAYER~surroundAvoidShieldedOnly 
	loadvar $PLAYER~surroundOverwrite 

	setvar $PLAYER~surroundNormal false 
	setvar $player~surroundPassive true


:merchant
	killalltriggers
	setArray $checkedPorts SECTORS
	setArray $que SECTORS
	setArray $checked SECTORS
	send "q"
	waitOn "Planet command (?"
	gosub :PLANET~getPlanetInfo
	send "c"
	if ($planet~citadel < 4)
		setVar $SWITCHBOARD~message "You must run Travelling Salesman from at least a level 4 planet.*"
		gosub :SWITCHBOARD~switchboard
 		halt
	end
	gosub :SHIP~getShipStats

	gosub :PLAYER~quikstats
	setVar $sectorCount 10
	setVar $totalHolds 0 
	setVar $spentCredits 0 
	setVar $startingSector $PLAYER~CURRENT_SECTOR
	setVar $sellingOrg TRUE
	setVar $sellingEquip TRUE
	if ($docim = TRUE)
		setVar $SWITCHBOARD~message "Travelling Salesman Downloading Current Port CIM Data - Comms Off*"
		gosub :SWITCHBOARD~switchboard
		send "^rq"
		waitFor ": ENDINTERROG"
		setVar $SWITCHBOARD~message "Travelling Salesman CIM Port Data Complete - Comms Back On*"
		gosub :SWITCHBOARD~switchboard
	end
	gosub :player~quikstats
	if (($player~limpets <= 3) and ($mines))
		gosub :attempt_refurb
	end

	while (TRUE)
		:inac
		if (($PLAYER~unlimitedGame = FALSE) AND ($PLAYER~TURNS <= $BOT~bot_turn_limit))
			setVar $SWITCHBOARD~message "Turns too low to continue.*"
			gosub :SWITCHBOARD~switchboard
			goto :doneMerchant
		end
		setVar $bottom 1
		setVar $top 1
		setArray $checked SECTORS
		setVar $que[1] $PLAYER~CURRENT_SECTOR
		setVar $checked[$PLAYER~CURRENT_SECTOR] 1
		:tryAgain2
		while ($bottom <= $top)
			# Now, pull out the next sector in the que, and make it our focus
			setVar $focus $que[$bottom]
			if ($docim = FALSE)
				if (($checkedPorts[$focus] <> TRUE) AND (PORT.EXISTS[$focus] = TRUE) AND (PORT.CLASS[$focus] > 0) AND (SECTOR.EXPLORED[$focus] = "YES"))
					send "cr"&$focus&"*"
					waiton "Computer command ["
					send "q "
					gosub :PLAYER~quikstats
				end
			end
			getSectorParameter $focus "BUSTED" $isBusted
			# If this sector is our xxB, we're done!
			if (($checkedPorts[$focus] <> TRUE) AND (PORT.EXISTS[$focus] = TRUE) AND (PORT.CLASS[$focus] > 0) AND ((PORT.FUEL[$focus] >= $minimumFuel) OR (PORT.ORG[$focus] >= $minimumFuel) OR (PORT.EQUIP[$focus] >= $minimumFuel)) AND ($isBusted <> TRUE))
				# fig found 0 hops
				setVar $NearFig $focus
				setVar $checkedPorts[$NearFig] TRUE
				goto :continueOn2
			else
				setVar $nearfig 0
			end
			# That wasn't it, so let's add all the adjacents to the que for future testing.
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
			setVar $SWITCHBOARD~message "Can't find a route to any other ports.*"
			gosub :SWITCHBOARD~switchboard
     		goto :doneMerchant
		:continueOn2
			if ($NearFig > 0)
				killAllTriggers
				send "p"&$NearFig&"*"
				setTextLineTrigger warped :emptyPort2 "Locating beam pinpointed, TransWarp Locked."
				setTextLineTrigger same :emptyPort2 "You are already in that sector!"
				setTextLineTrigger didnotwarp :noFigAtLocation "Your own fighters must be in the destination to make a safe jump."
				setTextLineTrigger notEnoughFuel :doneNoFuel2 "You do not have enough Fuel Ore on this planet to make the jump."
				pause			
				:emptyPort2
					send "y "
					setSectorParameter $NearFig "FIGSEC" TRUE



				killAllTriggers
				gosub :PLAYER~quikstats
				send "q"
				waitOn "Planet command (?"
				gosub :PLANET~getPlanetInfo
				send "c"
				if (((PORT.BUYFUEL[$player~current_sector] = FALSE)) and ($planet~planetfuel < ($planet~planetfuelmax/2)))
					setVar $total_creds_needed (300*100+50000)

					if (($total_creds_needed > $PLAYER~CREDITS) and (($player~credits+$planet~CITADEL_CREDITS) > $total_creds_needed))
						setVar $cashonhand $planet~CITADEL_CREDITS
						add $cashonhand $PLAYER~CREDITS
						if ($cashonhand > $total_creds_needed)
						        send "T T " & $PLAYER~CREDITS & "* "
				        		send "T F " & $total_creds_needed & "* "
				        		setVar $PLAYER~CREDITS $total_creds_needed
		    				end
					end
					send "q q *Oz15*z15*z15*z15*z15*z15*z15*z15*z15*z15*z15*z15*z15*z15*z15*z15*z15*z15*z15*z15*z*  z*CR*Q"
					gosub :PLAYER~quikstats
					gosub :PLANET~landOnPlanetEnterCitadel
				end
				if (($upgrade = true) and (port.exists[$player~current_sector] = true))
					send "q"
					waitOn "Planet command (?"
					gosub :PLANET~getPlanetInfo
					send "c"
					gosub :PLAYER~quikstats

					setVar $total_creds_needed ((300*100) + (500*100) + (700*100) + 500000)

					if (($total_creds_needed > $PLAYER~CREDITS) and (($player~credits+$planet~CITADEL_CREDITS) > $total_creds_needed))
						setVar $cashonhand $planet~CITADEL_CREDITS
						add $cashonhand $PLAYER~CREDITS
						if ($cashonhand > $total_creds_needed)
						        send "T T " & $PLAYER~CREDITS & "* "
				        		send "T F " & $total_creds_needed & "* "
				        		setVar $PLAYER~CREDITS $total_creds_needed
		    				end
					end
					send "q q *O 1 100*O 2 100*O 3 100** "
					gosub :PLAYER~quikstats
					gosub :PLANET~landOnPlanetEnterCitadel
					gosub :PLAYER~quikstats
				end

				if ($planet~planetNegotiate = TRUE)
					killAllTriggers
					setVar $planet~_ck_pnego_fueltosell "-1"
					if (($planet~planetfuel >= 100000) and ($sellfuel = true))
						setVar $planet~_ck_pnego_fueltosell "max"
					else
						setVar $planet~_ck_pnego_fueltosell "-1"
					end
					if ($planet~planetorg >= 500)
						setVar $planet~_ck_pnego_orgtosell "max"
					else
						setVar $planet~_ck_pnego_orgtosell "-1"
					end
					if ($planet~planetequip >= 500)
						setVar  $planet~_ck_pnego_equiptosell "max"
					else
						setVar  $planet~_ck_pnego_equiptosell "-1"
					end
					gosub :PLANET~planetNeg
				else	
					killAllTriggers
					gosub :PLAYER~quikstats
					send "q"
					waitOn "Planet command (?"
					gosub :PLANET~getPlanetInfo
					send "c"
	
					send "q q *cr*q"
					waitOn "Fuel Ore"
					getWord CURRENTLINE $totalPortFuel 4
					waitOn "Organics"
					getWord CURRENTLINE $totalPortOrganics 3
					waitOn "Equipment"
					getWord CURRENTLINE $totalPortEquipment 3		
					
					waitOn "<Computer deactivated>"
					if ((PORT.BUYFUEL[$NearFig] = TRUE) AND ($sellfuel = true) AND ($planet~planetfuel >= 100000))
						if ($planet~planetFuel < $totalPortFuel)
							setVar $player~turnsSellingProduct (($planet~planetFuel/$player~total_holds)-1)
						else
							setVar $player~turnsSellingProduct (($totalPortFuel/$player~total_holds))
						end
						if (($PLAYER~unlimitedGame = FALSE) AND (($PLAYER~TURNS - $player~turnsSellingProduct) <= $BOT~bot_turn_limit))
							setVar $SWITCHBOARD~message "Turns too low to continue.*"
							gosub :SWITCHBOARD~switchboard
							send "l "&$planet~planet&"* c "
							goto :doneMerchant
						end
						send "l "&$planet~planet&"* t n l 1* t nl 2* t n l 3* s n l 1* s n l 2* s n l 3* q jy "
							
						while ($player~turnsSellingProduct > 0)
							send "l " $planet~planet "*  t  *  * 2*  q P**"
							gosub :PLAYER~startHaggle
							send "0 * 0 *  /"
							if ($PLAYER~ni <> TRUE)
								subtract $player~turnsSellingProduct 1
								add $totalFuelHolds $player~total_holds
							end
							waitOn "³Turns"
						end
					end
					if ((PORT.BUYORG[$NearFig] = TRUE) AND ($sellingOrg))
						if ($planet~planetOrg < $totalPortOrganics)
							setVar $player~turnsSellingProduct (($planet~planetOrg/$player~total_holds)-1)
						else
							setVar $player~turnsSellingProduct (($totalPortOrganics/$player~total_holds))
						end
						if (($PLAYER~unlimitedGame = FALSE) AND (($PLAYER~TURNS - $player~turnsSellingProduct) <= $BOT~bot_turn_limit))
							setVar $SWITCHBOARD~message "Turns too low to continue.*"
							gosub :SWITCHBOARD~switchboard
							send "l "&$planet~planet&"* c "
							goto :doneMerchant
						end
						send "l "&$planet~planet&"* t n l 1* t nl 2* t n l 3* s n l 1* s n l 2* s n l 3* q jy "
							
						while ($player~turnsSellingProduct > 0)
							send "l " $planet~planet "*  t  *  * 2*  q P**"
							gosub :PLAYER~startHaggle
							send "0 * 0 *  /"
							if ($PLAYER~ni <> TRUE)
								subtract $player~turnsSellingProduct 1
								add $totalOrganicHolds $player~total_holds
							end
							waitOn "³Turns"
						end
					end
					if ((PORT.BUYEQUIP[$NearFig] = TRUE) AND ($sellingEquip))
						if ($planet~planetEquip < $totalPortEquipment)
							setVar $player~turnsSellingProduct (($planet~planetEquip/$player~total_holds)-1)
						else
							setVar $player~turnsSellingProduct (($totalPortEquipment/$player~total_holds))
						end
						send "l "&$planet~planet&"* t n l 1* t nl 2* t n l 3* s n l 1* s n l 2* s n l 3* q jy "
						while ($player~turnsSellingProduct > 0)
							
							while ($player~turnsSellingProduct > 0)
								send "l " $planet~planet "*  t  *  * 3*  q P**"
								gosub :PLAYER~startHaggle
								send "0 * 0 *  /"
								if ($PLAYER~ni <> TRUE)
									subtract $player~turnsSellingProduct 1
									add $totalEquipmentHolds $player~total_holds
								end
								waitOn "³Turns"
							end
						end
					end
					if ($planet~planetNegotiate <> TRUE)
						gosub :PLANET~landOnPlanetEnterCitadel
					end
					gosub :PLAYER~quikstats
				end
					if (PORT.BUYEQUIP[$NearFig] = FALSE)
						setVar $PLAYER~buyobject "e"
						if ($nohaggle)
							setVar $PLAYER~buytype "s"
						else
							setVar $PLAYER~buytype "b"
						end
						gosub :player~buy
						gosub :PLAYER~quikstats
					end
					if (PORT.BUYORG[$NearFig] = FALSE)
						setVar $PLAYER~buyobject "o"
						if ($nohaggle)
							setVar $PLAYER~buytype "s"
						else
							setVar $PLAYER~buytype "b"
						end
						gosub :player~buy
						gosub :PLAYER~quikstats
					end
					if (PORT.BUYFUEL[$NearFig] = FALSE)
						setVar $PLAYER~buyobject "f"
						setVar $PLAYER~buytype "s"
						gosub :player~buy
						gosub :PLAYER~quikstats
					end
										
				send "#"
				waitOn "                            Who's Playing"
				send "cr*"
				waiton "Computer command ["
				send "q "
				gosub :PLAYER~quikstats
				if ($grid)
					send "q m* * *  q "
					gosub :grid~surround
					gosub :PLAYER~quikstats
					gosub :PLANET~landOnPlanetEnterCitadel
				end
				gosub :player~quikstats
				if (((SECTOR.LIMPETS.QUANTITY[$player~current_sector] <= 0) or (SECTOR.MINES.QUANTITY[$player~current_sector] <= 0)) and (($player~limpets >= 3) and ($player~armids >= 3)) and ($mines = true))
					gosub :doMines
				end
				if ($mines)
					send "s* "
					gosub :player~quikstats
					if ((SECTOR.LIMPETS.QUANTITY[$player~current_sector] > 0) and (($player~limpets <= 5) or ($player~armids <= 5)))
						gosub :attempt_refurb
					end
				end
				if ($do_rob = true)
					gosub :rob
				end
			end	
		end
		:doneMerchant
			send "p"&$startingSector&"*y"
			setVar $SWITCHBOARD~message "Travelling Salesman completed.*"
			gosub :SWITCHBOARD~switchboard
			halt



:noFigAtLocation
	setSectorParameter $NearFig "FIGSEC" FALSE
	goto :tryAgain2


:rob
		
	killalltriggers
	gosub :player~quikstats
	setVar $startingLocation $player~current_prompt
	
	getSectorParameter $player~current_sector "BUSTED" $isBusted
	if ($isBusted = true)
		return
	end
	cutText $player~alignment $neg_ck 1 1
	
	stripText $player~alignment "-"
	if ($player~alignment < 100) and ($neg_ck = "-")
		return
	elseif ($neg_ck <> "-")
		return
	end
	send "q q pr * r"
	setTextLinetrigger valid :rob_continue "<R> Rob this Port"
	setTextLinetrigger notvalid :rob_not_valid "<Q> Quit, nevermind"
	pause
	:rob_continue
	killtrigger notvalid
	setTextLineTrigger fake :rob_fake "Busted!"
	setTextLinetrigger mega :rob_ok "port has in excess of"
	pause

:rob_fake
	killalltriggers
	if ($startingLocation = "Citadel")
		gosub :planet~landingSub
	end
	setSectorParameter $player~current_sector "BUSTED" TRUE
	setVar $SWITCHBOARD~message "Fake Busted*"
	gosub :switchboard~switchboard
	return

:rob_ok
	killalltriggers
	#setvar $rob $player~experience
	#multiply $rob 3
	#multiply $game~rob_factor 100
	setVar $rob ($game~rob_factor*$player~experience)
	getWord CURRENTLINE $port_cash 11

	stripText $port_cash ","
	setVar $original_port_cash $port_cash
	multiply $port_cash 10
	divide $port_cash 9
#	if (($port_cash >= 3000000) AND ($game~mbbs = TRUE))
#		send "'{" $bot~bot_name "} - " $port_cash " credits on port.  Port is ready for Mega Rob**"
#		gosub :planet~landingSub
#		goto :wait_for_command
#	end
	if ($port_cash < $minimumPort)
		echo "*Port has less than "&$minimumPort&" credits on it.*"
		send "0*"
		setVar $rob 0
	elseif ($port_cash >= $rob) 
		send $rob "*"
	elseif ($port_cash < $rob)
		setVar $rob $port_cash
		send $rob "*"
	end
	if ($port_cash < $minimumPort)
		setVar $checkedPorts[$player~current_sector] TRUE	
		setVar $EMPTY_GRID[$player~current_sector] TRUE
		write $bot~no_credits_file $player~current_sector		
	end
	setTextLineTrigger port_empty :rob_suc "Maybe some other day, eh?"
	setTextLineTrigger mega_suc :rob_suc "Success!"
	setTextLineTrigger mega_bust :rob_bust "Busted!"
	pause

:rob_bust
	killalltriggers
	if ($startingLocation = "Citadel")
		gosub :planet~landingSub
	end
	setSectorParameter $player~current_sector "BUSTED" TRUE
	send "'<"&$bot~subspace&">[Busted:"&$player~current_sector&"]<"&$bot~subspace&">* "
	return

:rob_ready_to_mega
	killalltriggers
	send "0*  "
	if ($startingLocation = "Citadel")
		gosub :planet~landingSub
	end
	return

:rob_not_valid
	killalltriggers
	setVar $checkedPorts[$player~current_sector] TRUE	
	setVar $EMPTY_GRID[$player~current_sector] TRUE
	write $bot~no_credits_file $player~current_sector	
	setVar $rob 0
	setVar $original_port_cash 0	
:rob_suc
	killalltriggers
	if ($startingLocation = "Citadel")
		send "l " $planet~planet "* c t t " $rob "* "
	end
	if ($rob > $original_port_cash)
		setVar $checkedPorts[$player~current_sector] TRUE	
		setVar $EMPTY_GRID[$player~current_sector] TRUE
		write $bot~no_credits_file $player~current_sector				
	end
	if ($rob > 0)
		setVar $laststeal $player~current_sector
		setVar $SWITCHBOARD~message "Success! - "&$rob&" credits robbed*"
		gosub :switchboard~switchboard
	end
	return
# ============================== END ROB (ROB) SUB ==============================

:doMines
	setVar $BOT~command "deploy"
	setVar $BOT~user_command_line " mines 3 silent "
	setvar $bot~parm1 "mines"
	setvar $bot~parm2 "2"

	saveVar $BOT~command
	saveVar $BOT~user_command_line
	saveVar $bot~parm1 

	load "scripts\"&$bot~mombot_directory&"\commands\grid\deploy.cts"
	setEventTrigger        minesend        :minesend "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\grid\deploy.cts"
	setdelaytrigger        minetime        :minetime  10000
	pause

	:minetime
		killtrigger minesend
		stop "scripts\"&$bot~mombot_directory&"\commands\grid\deploy.cts"
		gosub :player~quikstats
	:minesend
		killtrigger minetime
		gosub :player~quikstats
		if ($player~current_prompt <> "Citadel")
			send " q q q * l " $PLANET~PLANET " * n n * j m * * * j c  *  "
			gosub :player~quikstats
			if ($player~current_prompt <> "Citadel")
				setvar $switchboard~message "Not at correct prompt after mine deploy!  Maybe planet is gone?  Check please!*"
				gosub :switchboard~switchboard
				gosub :navigate~callsaveme
			end
		end

return

:attempt_refurb
	send  "q t nl 2* t n l 3* s n l 1* s n l 2* s n l 3* t nt 1* c "
	gosub :player~quikstats
	setVar $limpetCashNeeded ((($ship~SHIP_MINES_MAX-$player~limpets)*$game~limpet_cost)+$game~limpet_removal_cost)
	setVar $armidCashNeeded ((($ship~SHIP_MINES_MAX-$player~armids)*$game~armid_cost))
	setVar $cashNeeded ($limpetCashNeeded+$armidCashNeeded)
	setVar $furbing TRUE
	if ($cashNeeded > $player~credits)
		send "D" 
		waitOn "Citadel treasury contains "
		getWord CURRENTLINE $planet~CITADELCash 4
		stripText $planet~CITADELCash ","
		if ($planet~CITADELCash < $cashNeeded)
			send "'{" & $bot~bot_name & "} - Not enough cash for mine refurbs in treasury or on hand.*"	
			halt
		end
		send "t f "&($cashNeeded-$player~credits)&"* "
	end
	# check adj's for Dock.. if present, then we don't need a jump sector.
	setVar $i 1
	setVar $START_SECTOR $player~current_sector
	setVar $WeAreAdjDock FALSE
	while ($i <= SECTOR.WARPCOUNT[$START_SECTOR])
		setVar $adj_start SECTOR.WARPS[$START_SECTOR][$i]
		if ($adj_start = $map~stardock)
			setVar $WeAreAdjDock TRUE
		end
		add $i 1
	end

	if (($player~alignment < 1000) AND ($WeAreAdjDock = FALSE))
		setVar $player~RED_adj 0
		setvar $player~target $map~stardock
		gosub :player~findjumpsector
		if ($player~RED_adj = 0)
			waitfor "Command [TL="
			send "'{" & $bot~bot_name & "} - Cannot Find Jump Sector Adjacent Dock**"
			halt
		end
	end

	if ($player~alignment >= 1000)
		if ($WeAreAdjDock)
			send "^F" & $map~stardock & "*" & $START_SECTOR & "*Q/ "
		else
			send "^F" & $START_SECTOR & "*" & $map~stardock & "*F" & $map~stardock & "*" & $START_SECTOR & "*Q/ "
		end
	else
		if ($WeAreAdjDock)
			send "^F" & $map~stardock & "*" & $START_SECTOR & "*Q/ "
		else
			send "^F" & $START_SECTOR & "*" & $player~RED_adj & "*F" & $map~stardock & "*" & $START_SECTOR & "*Q/ "
		end
	end
	setTextLineTrigger noJoy :noJoy "*** Error - No route within"
	setTextTrigger cont :cont "(?="
	pause

	:noJoy
		killAllTriggers
		send "'{" $bot~bot_name "} - Cannot Find Path to StarDock!**"
		halt
	:cont
		killAllTriggers
		setDelayTrigger Latency_Delay		:Latency_Delay 500
		pause

		:Latency_Delay

		Echo "**" & ANSI_14 & "Please Stand By" & ANSI_15 & " - Calculating Distances...**"
		if (($player~alignment >= 1000) OR ($WeAreAdjDock))
			getdistance $dist1 $START_SECTOR $map~stardock
		else
			getdistance $dist1 $START_SECTOR $player~RED_adj
		end

		if ($dist1 <= 0)
			send "'{" $bot~bot_name "} " & $TagLineB & " - Insufficient Warp Data Plotting Course to Dock**"
			halt
		end

		getdistance $dist2 $map~stardock $START_SECTOR
		if ($dist2 <= 0)
			send "'{" $bot~bot_name "} " & $TagLineB & " - Insufficient Warp Data Plotting Return Course From Dock**"
			halt
		end

		setVar $ore_req (($dist1 + $dist2) * 3)

		if ($player~ore_holds < $ore_req)
			send "'{" $bot~bot_name "} - Not Enough ORE In Holds To Make Round Trip**"
			halt
		end

		if ($player~twarp_type = "No")
			send "'{" $bot~bot_name "} - Must Have Twarp 1 or 2**"
			halt
		end

		if ($player~unlimitedGame = 0)
			gosub :TurnsRequired
			if ($player~turnsRequired > $player~turns)
				send "'{" $bot~bot_name "} - Not Enough Turns. " & ANSI_12 & $player~turnsRequired & ANSI_15 & ", Required**"
				halt
			elseif ($player~turnsRequired <= $player~turns)
				setVar $tmp ($player~turns - $player~turnsRequired)
				if ($tmp <= $bot~bot_turn_limit)
					send "'{" $bot~bot_name "} - Proceeding Will Leave Fewer Than " & $bot~bot_turn_limit & " Turns!**"
					halt
				end
			end
		end

	send " C R " & $map~stardock & "*Q "
	setTextLineTrigger itsalive :itsalive "Items     Status  Trading % of max OnBoard"
	setTextLineTrigger nosoupforme :nosoupforme "I have no information about a port in that sector"
	pause
	:nosoupforme
		killAllTriggers
		send "'{" $bot~bot_name "} " & $TagLineB & " - StarDock appears to have been Blown Up!**"
		halt
	:itsalive
		killAllTriggers
		waitfor "(?="
		setVar $msg ""
		if (($player~alignment >= 1000) AND ($WeAreAdjDock = FALSE))
			setVar $player~warpto $map~stardock
			gosub :DoTwarp
		elseif (($WeAreAdjDock = FALSE) AND ($player~RED_adj <> 0))
			setVar $player~warpto $player~RED_adj
			gosub :DoTwarp
		else
			send " m " & $map~stardock & "*  *  P  S G Y G Q "
		end
		if ($msg = "")
			waitfor "You leave the Galactic Bank."
		else
			send "'{" $bot~bot_name "} - Unknown Problem Detected. Check TA!**"
			halt
		end
		gosub :player~quikstats

		setVar $_Limps "Max"
		setVar $_Mines "Max"
		gosub :DoPurchases
		send "Q Q Q Q Z N M " & $START_SECTOR & "* Y  Y  Y  * L Z" & #8 & $planet~planet & "* p  s  s * * c *"
		gosub :player~quikstats
		if ($player~current_sector = $map~stardock)
			send "'{" $bot~bot_name "} - Twarp Error, Should be Hiding on Dock!**"
			halt
		end
		send "q tnt1* c "
	

return

:DoTwarp
	setVar $msg ""
	setvar $paused false
	setvar $photoned false
	if ($player~warpto > 0)
		send "q t * t 1*  q * * mz" & $player~warpto "*"
		setTextTrigger there        :adj_warp "You are already in that sector!"
		setTextLineTrigger adj_warp :adj_warp "Sector  : " & $player~warpto & " "
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
			send "l " & #8 & $planet~planet "*c"
			setSectorParameter $player~warpto "FIGSEC" FALSE
			setVar $temp " "&$player~warpto&" "
			replaceText $database $temp " "
			subtract $database_count 1
			goto :select_boomsec

		:twarpIgd
			killAllTriggers
			setVar $msg "My ship is being held by Interdictor!"
			goto :twarpDone

		:twarpPhotoned
			killAllTriggers
			setVar $msg "I have been photoned and can not T-warp!"
			send "l " & #8 & $planet~planet "* j c *   "
			setvar $photoned true
			goto :twarpDone

		:itwarpnofuel
			killAllTriggers
			setVar $msg "I have no fuel!"
			send "l " & #8 & $planet~planet "* j c *   "
			goto :twarpDone

		:twarp_lock
			KillAlltriggers
			if ($player~alignment >= 1000)
				if ($furbing)
					setVar $str "y * * p s g y g q " 
				else
					setVar $str "y * *  " 
				end
				send $str
			else
				if ($furbing)
					setVar $str "y  *  *  m " & $map~stardock & " *  *  p s g y g q "
				else
					setVar $str "y * *  " 
				end
				send $str
			end
		:twarpDone
			if ($msg <> "")
				send "'{" $bot~bot_name "} Twarp Error - " & $msg & "**"
				setvar $paused true
			end
	end
	return

:bwarp

	killAllTriggers
	send "b" $player~warpto "*"
	setTextTrigger go :go5 "TransWarp Locked"
	setTextTrigger no :no5 "No locating beam found"
	goSub :delayTrigger
	pause

:no5
	killAllTriggers
	send "n "
	waitfor "Transporter shutting down."
	setVar $FIGHTER_GRID[$player~warpto] 0
	goto :select_boomsec

:go5
	killAllTriggers
	send "y z * "
	return



:TurnsRequired
	send "i"
	setTextLineTrigger TurnsRequired_TPW	:TurnsRequired_TPW "Turns to Warp  : "
	pause

	:TurnsRequired_TPW
	killAllTriggers
	getWord CURRENTLINE $PLAYER~TURNSRequired_TPW 5

	if ($player~RED_adj > 0)
		# twarp to jmp sector, then into SD sect, then twarp home
		setVar $PLAYER~TURNSRequired_temp ($PLAYER~TURNSRequired_TPW * 3)
		if ($_Tow > 0)
			# 2 Turns for exporting into other ship and back again
			add $PLAYER~TURNSRequired_temp 2
			# 3 Turns for initial Port then x into other ship, port & shop, then x and report
			#   b4 heading home
			add $PLAYER~TURNSRequired_temp 3
		else
			add $PLAYER~TURNSRequired_temp 1
		end
	else
		setVar $PLAYER~TURNSRequired_temp ($PLAYER~TURNSRequired_TPW * 2)
		# 1 Turn to port at dock
		add $PLAYER~TURNSRequired_temp 1
	end

	setVar $PLAYER~TURNSRequired $PLAYER~TURNSRequired_temp
	return


:callSaveMe
	send "q q q q * '"&$SWITCHBOARD~bot_name&" call*"
	halt

:DoPurchases
	send "h "
	waitfor "<Hardware Emporium>"
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
	return


#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\ship\getshipstats\ship"
include "source\bot_includes\planet\landonplanetentercitadel\planet"
include "source\bot_includes\planet\planetneg\planet"
include "source\bot_includes\player\starthaggle\player"
include "source\bot_includes\player\buy\player"
include "source\bot_includes\grid\surround\grid"
include "source\bot_includes\planet\landingsub\planet"
