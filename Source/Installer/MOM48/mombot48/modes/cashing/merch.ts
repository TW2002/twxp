	logging off
	gosub :BOT~loadVars
	loadVar $PLAYER~unlimitedGame
	loadvar $GAME~ptradesetting
	loadvar $bot~bot_turn_limit
	loadvar $bot~mcic_file

	setVar $BOT~help[1]  $BOT~tab&"           Visits all ports in grid and sells organics          "
	setVar $BOT~help[2]  $BOT~tab&"           and/or equipment.       "
	setVar $BOT~help[3]  $BOT~tab&"       "
	setVar $BOT~help[4]  $BOT~tab&" merch {sector param} {min port product} [o | e] ({neg}otiate OR {hold}byhold)  "
	setVar $BOT~help[5]  $BOT~tab&"       {buyfuel} {docim}  "
	setVar $BOT~help[6]  $BOT~tab&"       "
	setVar $BOT~help[7]  $BOT~tab&"Options:"
	setVar $BOT~help[8]  $BOT~tab&"    {neg/hold}   Determines planet negotiate or hold "
	setVar $BOT~help[9]  $BOT~tab&"                 selling approach"
	setVar $BOT~help[10] $BOT~tab&"     {skipcim}   Uses current cim data and skips searching"
	setVar $BOT~help[11] $BOT~tab&"       {docim}   Does cim check before starting and skips searching"
	setVar $BOT~help[12] $BOT~tab&"     {buyfuel}   Buys all the fuel in fuel selling ports "
	setVar $BOT~help[13] $BOT~tab&"                 on route  "
	setVar $BOT~help[14] $BOT~tab&"        {half}   sell half of port (neg only for now) "
	gosub :bot~helpfile

	setVar $BOT~script_title "Planet Merchant"
	gosub :BOT~banner

		
:merchant
	gosub :player~quikstats
	setVar $startingLocation $player~current_prompt
	if ($startingLocation <> "Citadel")
		setvar $switchboard~message "You must run Planet Merchant command from a Citadel prompt.*"
     	gosub :switchboard~switchboard
		halt
	end
	setvar $bot~parmameter ""
	setVar $minimumFuel $bot~parm1
	isNumber $number $minimumFuel
	if ($number <> true)
		setvar $bot~parmameter $bot~parm1
		uppercase $bot~parmameter
		setVar $minimumFuel $bot~parm2
		isNumber $number $minimumFuel
		if ($number <> true)
			setvar $minimumfuel 1000
		end
	end
	if ($minimumFuel <= 0)
		setvar $switchboard~message "Minimum Port Product must be greater than 0.*"
		gosub :switchboard~switchboard
		halt
	end
	
	getWordPos $bot~user_command_line $pos "hold"
	if ($pos > 0)
		setVar $planet~planetNegotiate FALSE
	else
		setVar $planet~planetNegotiate TRUE
	end
	getWordPos $bot~user_command_line $pos "half"
	if ($pos > 0)
		setVar $sellhalf true
	else
		setVar $sellhalf false
	end
	getWordPos " "&$bot~user_command_line&" " $pos " o "
	if ($pos > 0)
		setVar $sellingOrg TRUE
	else
		setVar $sellingOrg FALSE
	end
	getWordPos " "&$bot~user_command_line&" " $pos " e "
	if ($pos > 0)
		setVar $sellingEquip TRUE
	else
		setVar $sellingEquip FALSE
	end
	
	getWordPos $bot~user_command_line&" " $pos " buyfuel "
	if ($pos > 0)
		setVar $buyFuel TRUE
	else
		setVar $buyFuel FALSE
	end
	
	if (($sellingOrg = FALSE) AND ($sellingEquip = FALSE))
		setvar $switchboard~message "Please pick [o]rganics and/or [e]quipment to sell.  merch [min product] {o} {e} {docim} {skipcim} {negotiate/hold}*"
		gosub :switchboard~switchboard
		halt
	end
	getWordPos $bot~user_command_line $pos "docim"
	if ($pos > 0)
		setVar $docim TRUE
	else
		setVar $docim FALSE
	end

	getWordPos $bot~user_command_line $pos "skipcim"
	if ($pos > 0)
		setVar $skipcim TRUE
	else
		setVar $skipcim FALSE
	end



:merchant
	killalltriggers
	setArray $checkedPorts SECTORS
	setArray $que SECTORS
	setArray $checked SECTORS
	send "q"
	waitOn "Planet command (?"
	gosub :planet~getPlanetInfo
	send "c"
	if ($planet~citadel < 4)
		setvar $switchboard~message "You must run Planet Merchant from at least a level 4 planet.*"
     	gosub :switchboard~switchboard
		halt
	end
	gosub :player~quikstats
	setVar $sectorCount 10
	setVar $totalHolds 0 
	setVar $spentCredits 0 
	setVar $startingSector $player~current_sector
	
	if ($docim = TRUE)
		setvar $switchboard~message "Planet Merchant Downloading Current Port CIM Data - Comms Off*"
		gosub :switchboard~switchboard
		send "^rq"
		waitFor ": ENDINTERROG"
		setvar $switchboard~message "Planet Merchant CIM Port Data Complete - Comms Back On*"
		gosub :switchboard~switchboard
	end
	loadvar $game~port_max
	setvar $half_port_max $game~port_max
	divide $half_port_max 2
	while ((($sellingOrg) AND ($planet~planet_organics >= 500)) OR (($sellingEquip) AND ($planet~planet_equipment >= 500)))
		:inac
		if (($player~unlimitedGame = FALSE) AND ($player~TURNS <= $bot_turn_limit))
			setvar $switchboard~message "Turns too low to continue.*"
			gosub :switchboard~switchboard
			goto :doneMerchant
		end
		setVar $bottom 1
		setVar $top 1
		setArray $checked SECTORS
		setVar $que[1] $player~current_sector
		setVar $checked[$player~current_sector] 1

		:tryAgain2
		while ($bottom <= $top)
			# Now, pull out the next sector in the que, and make it our focus
			setVar $focus $que[$bottom]
			if ($bot~parmameter <> "")
				getsectorparameter $focus $bot~parmameter $isGoodSector
			end
			if (($bot~parmameter <> "") and ($isGoodSector <> true))
				goto :notit
			end
			if (($docim = FALSE) AND ($skipcim = FALSE))
				if (($checkedPorts[$focus] <> TRUE) AND (PORT.EXISTS[$focus] = TRUE) AND (PORT.CLASS[$focus] > 0) AND (SECTOR.EXPLORED[$focus] = "YES") AND ((($sellingOrg = TRUE) AND ($planet~planet_organics > 500) AND (PORT.BUYORG[$focus])) OR (($sellingEquip = TRUE) AND ($planet~planet_equipment > 500) AND (PORT.BUYEQUIP[$focus]))))
					send "cr"&$focus&"*q"
					gosub :player~quikstats
				end
			end
			# If this sector is our xxB, we're done!
			getSectorParameter $focus "BUSTED" $isBusted
			if (($isBusted <> TRUE) AND ($checkedPorts[$focus] <> TRUE) AND (PORT.EXISTS[$focus] = true) AND ((($sellingOrg) AND ($planet~planet_organics > 500) AND (PORT.BUYORG[$focus]) and (((PORT.PERCENTORG[$focus] > 50) and (port.org[$focus] > $half_port_max) and ($sellhalf = true)) or ($sellhalf <> true)) AND (PORT.ORG[$focus] >= $minimumFuel)) OR (($sellingEquip) AND ($planet~planet_equipment > 500) AND (PORT.BUYEQUIP[$focus]) AND (((PORT.PERCENTEQUIP[$focus] > 50) and ($sellhalf = true) and (port.equip[$focus] > $half_port_max)) or ($sellhalf <>true)) and (PORT.EQUIP[$focus] >= $minimumFuel))))
				# fig found 0 hops
				setVar $NearFig $focus
				setVar $checkedPorts[$NearFig] TRUE
				goto :continueOn2
			else
				:notit
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
			setvar $switchboard~message "Can't find a route to any other ports.*"
			gosub :switchboard~switchboard
     		goto :doneMerchant
		:continueOn2
			if ($NearFig > 0)
				killAllTriggers
				send "p"&$NearFig&"*y"
				setTextLineTrigger warped :emptyPort2 "-=-=-=- Planetary TransWarp Drive Engaged! -=-=-=-"
				setTextLineTrigger same :emptyPort2 "You are already in that sector!"
				setTextLineTrigger didnotwarp :noFigAtLocation "Your own fighters must be in the destination to make a safe jump."
				setTextLineTrigger notEnoughFuel :doneNoFuel2 "You do not have enough Fuel Ore on this planet to make the jump."
				pause			
				:emptyPort2
					send "s*  "
					gosub :player~quikstats
					send "cr*q"
					gosub :player~quikstats
					setSectorParameter $NearFig "FIGSEC" TRUE
				if (PORT.EXISTS[$NearFig] <> true)
					goto :tryAgain2
				end
				if ($planet~planetNegotiate = TRUE)
					killAllTriggers
					setVar $planet~_ck_pnego_fueltosell "-1"
					if ($sellingOrg)
						if ($sellhalf)
							setvar $org_to_sell (PORT.ORG[$NearFig]-$half_port_max)
							if ($org_to_sell <= 0)
								setVar $planet~_ck_pnego_orgtosell "-1"
							else
								setVar $planet~_ck_pnego_orgtosell $org_to_sell
							end
						else
							setVar $planet~_ck_pnego_orgtosell "max"
						end
					else
						setVar $planet~_ck_pnego_orgtosell "-1"
					end
					if ($sellingEquip)
						if ($sellhalf)
							setvar $equip_to_sell (PORT.EQUIP[$NearFig]-$half_port_max)
							if ($equip_to_sell <= 0)
								setVar  $planet~_ck_pnego_equiptosell "-1"
							else
								setVar $planet~_ck_pnego_equiptosell $equip_to_sell
							end
						else
							setVar  $planet~_ck_pnego_equiptosell "max"
						end
					else
						setVar  $planet~_ck_pnego_equiptosell "-1"
					end
					gosub :planet~planetNeg
					send "cr*q"
					gosub :player~quikstats
					if (($sellingEquip) and (port.equip[$nearfig] > $minimumfuel))
						setVar $checkedPorts[$NearFig] false
					end
					if (($sellingorg) and (port.org[$nearfig] > $minimumfuel))
						setVar $checkedPorts[$NearFig] false
					end
					if (($buyFuel = TRUE) AND (PORT.BUYFUEL[$NearFig] = FALSE))
						setVar $PLAYER~buyobject "f"
						setVar $PLAYER~buytype "s"
						setVar $PLAYER~buydownRoundsFromParam $player~turnsToEmpty
						gosub :player~buy
						gosub :PLAYER~quikstats
					end
				else
					killAllTriggers
					gosub :player~quikstats
					send "q"
					waitOn "Planet command (?"
					gosub :planet~getPlanetInfo
					send "c"
	
					send "q q *cr*q"
					waitOn "Fuel Ore"
					getWord CURRENTLINE $totalPortFuel 4
					waitOn "Organics"
					getWord CURRENTLINE $totalPortOrganics 3
					waitOn "Equipment"
						getWord CURRENTLINE $totalPortEquipment 3		
					
					waitOn "<Computer deactivated>"
					if (($planet~planet_fuel_max-$planet~planet_fuel) < $totalPortFuel)
						setVar $player~turnsToEmptyFuel ((($planet~planet_fuel_max-$planet~planet_fuel)/$player~total_holds-1)
					else
						setVar $player~turnsToEmptyFuel (($totalPortFuel/$player~total_holds)-1)
					end
					if ((PORT.BUYORG[$NearFig] = TRUE) AND ($sellingOrg))
						if ($planet~planet_organics < $totalPortOrganics)
							setVar $player~turnsSellingProduct (($planet~planet_organics/$player~total_holds)-1)
						else
							setVar $player~turnsSellingProduct (($totalPortOrganics/$player~total_holds))
						end
						if (($player~unlimitedGame = FALSE) AND (($player~TURNS - $player~turnsSellingProduct) <= $bot~bot_turn_limit))
							setvar $switchboard~message "Turns too low to continue.*"
							gosub :switchboard~switchboard
							send "l "&$planet~planet&"* c "
							goto :doneMerchant
						end
						if ((PORT.BUYFUEL[$NearFig] = FALSE) AND ($buyFuel = TRUE))
							send "l "&$planet~planet&"* t n l 1* t nl 2* t n l 3* s n l 1* s n l 2* s n l 3* q jy "
							gosub :player~quikstats
							while (($player~turnsSellingProduct > 0) AND ($player~turnsToEmptyFuel > 1))
									send "l " $planet~planet "*   t  *  l 1* t  *  * 2*  q P * *"
									gosub :player~starthaggle
									send "*"
									gosub :player~starthaggle
									send " 0 *  /"
									if ($ni <> TRUE)
										subtract $player~turnsSellingProduct 1
									end
									subtract $player~turnsToEmptyFuel 1
									add $totalOrganicHolds $player~total_holds
									waitOn "쿟urns"
							end
						end
						send "l "&$planet~planet&"* t n l 1* t nl 2* t n l 3* s n l 1* s n l 2* s n l 3* q jy "
						gosub :player~quikstats	
						while ($player~turnsSellingProduct > 0)
							send "l " $planet~planet "*  t  *  * 2*  q P * *"
							gosub :player~starthaggle
							send "0 * 0 *  /"
							waitOn "쿟urns"
							if ($ni <> TRUE)
								subtract $player~turnsSellingProduct 1
							end
							add $totalOrganicHolds $player~total_holds
						end
					end
					if ((PORT.BUYEQUIP[$NearFig] = TRUE) AND ($sellingEquip))
						if ($planet~planet_equipment < $totalPortEquipment)
							setVar $player~turnsSellingProduct (($planet~planet_equipment/$player~total_holds)-1)
						else
							setVar $player~turnsSellingProduct (($totalPortEquipment/$player~total_holds))
						end
						if ((PORT.BUYFUEL[$NearFig] = FALSE) AND ($buyFuel = TRUE))
							send "l "&$planet~planet&"* t n l 1* t nl 2* t n l 3* s n l 1* s n l 2* s n l 3* q jy "
							while (($player~turnsSellingProduct > 0) AND ($player~turnsToEmptyFuel > 1))
								send "l " $planet~planet "*   t  *  l 1* t  *  * 3*  q P * *"
								gosub :player~starthaggle
								send "*"
								gosub :player~starthaggle
								send " 0 *  /"
								if ($ni <> TRUE)
									subtract $player~turnsSellingProduct 1
								end
								subtract $player~turnsToEmptyFuel 1
								add $totalEquipmentHolds $player~total_holds
								waitOn "쿟urns"
							end
						end
						send "l "&$planet~planet&"* t n l 1* t nl 2* t n l 3* s n l 1* s n l 2* s n l 3* q jy "
						while ($player~turnsSellingProduct > 0)
							send "l " $planet~planet "*  t  *  * 3*  q P * *"
							gosub :player~starthaggle
							send "0 * 0 *  /"
							if ($ni <> TRUE)
								subtract $player~turnsSellingProduct 1
							end
							add $totalEquipmentHolds $player~total_holds
							waitOn "쿟urns"
						end
					end
				end
					
				send "#"
				waitOn "                            Who's Playing"
				if ($planet~planetNegotiate <> TRUE)
					gosub :planet~landOnPlanetEnterCitadel
				end
				send "cr*q"
				gosub :player~quikstats
			end	
		end
		:doneMerchant
			send "p"&$startingSector&"*y"
			setvar $switchboard~message "Planet Merchant completed.*"
			gosub :switchboard~switchboard
		halt

:noFigAtLocation
	setSectorParameter $NearFig "FIGSEC" FALSE
	goto :tryAgain2


#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\planet\planetneg\planet"
include "source\bot_includes\player\buy\player"
include "source\bot_includes\player\starthaggle\player"
include "source\bot_includes\planet\landonplanetentercitadel\planet"
