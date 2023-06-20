gosub :BOT~loadVars


	setVar $BOT~help[1]  $BOT~tab&"       Day 1 trader aimed at doing the best trade and testing MCIC "
	setVar $BOT~help[2]  $BOT~tab&"       Keep equipment/empty holds so you always have ability to test ports."
	setVar $BOT~help[3]  $BOT~tab&"       Script will attempt to haggle at any port for equip buy or sell."
	setVar $BOT~help[4]  $BOT~tab&"       Best used with EP Haggle to get MCIC for buy/sell in megarob games."
	setVar $BOT~help[5]  $BOT~tab&"        - Avoids trading small amounts of Fuel/Org to avoid experience."
	setVar $BOT~help[6]  $BOT~tab&"       "
	setVar $BOT~help[7]  $BOT~tab&"       trade {q} {mcic}"
	setVar $BOT~help[8]  $BOT~tab&"       "
	setVar $BOT~help[9]  $BOT~tab&" Options:"
	setVar $BOT~help[10]  $BOT~tab&"    {q}       How much equipment to keep post trade. "
	setVar $BOT~help[11]  $BOT~tab&"              - Default is 5"
	setVar $BOT~help[12]  $BOT~tab&"    {mcic}    Will just test MCIC and keep fuel."
	setVar $BOT~help[12]  $BOT~tab&"       EP haggle will be used if it is running in the bot. "
	
	gosub :bot~helpfile

	setVar $BOT~script_title "Trade"
	gosub :BOT~banner


	
	setVar $haggle "t"
	setVar $keepEquip 5
	
	getWord $bot~user_command_line $bot~parm1 1
	getWord $bot~user_command_line $bot~parm2 2

	setVar $mciconly FALSE

	if ($bot~parm1 = "mcic")
		setVar $mciconly TRUE
		setVar $keepEquip 30
		setVar $SWITCHBOARD~message "MCIC Only Mode.*"
		gosub :SWITCHBOARD~switchboard
	else
		if ($bot~parm1 <> "")
			isNumber $test $bot~parm1
			if ($test = FALSE)
				setVar $SWITCHBOARD~message "Pleae enter a number for the equip to keep.*"
				gosub :SWITCHBOARD~switchboard
				halt
			else
				setVar $keepEquip $bot~parm1
			end
		end
		if ($keepEquip = 0)
			#setVar $keepEquip 5
		end
	end	


	gosub :player~quikstats
	
	setVar $startingLocation $PLAYER~CURRENT_PROMPT
	if ($startingLocation <> "Command")
		setVar $SWITCHBOARD~message "Trade Must start at command prompt.*"
		gosub :SWITCHBOARD~switchboard
		halt

	end

	
	
	setVar $empty_holds ($player~total_holds - ($player~ore_holds + $player~organic_holds + $player~equipment_holds + $player~colonist_holds))

	if ($player~colonist_holds > 0)
		setVar $SWITCHBOARD~message "Don't bore the tourists, offload the colonists.*"
		gosub :SWITCHBOARD~switchboard
		halt
	end



	gosub :chkFtr
	
	setVar $virtFreeHolds $empty_holds
	setVar $sellOre 0
	setVar $sellOrg 0
	setVar $sellEquip 0

	setVar $buyOre 0
	setVar $buyOrg 0
	setVar $buyEquip 0

	if ($mciconly = FALSE)
		if (($player~ore_holds > 0) and (PORT.BUYFUEL[CURRENTSECTOR] = 1))
			setVar $sellOre $player~ore_holds
			setVar $virtFreeHolds ($virtFreeHolds + $sellOre)
		end

		if (($player~organic_holds > 0) and (PORT.BUYORG[CURRENTSECTOR] = 1))
			setVar $sellOrg $player~organic_holds
			setVar $virtFreeHolds ($virtFreeHolds + $sellOrg)
		end

		if (($player~equipment_holds > 0) and (PORT.BUYEQUIP[CURRENTSECTOR] = 1))
			if ($player~equipment_holds <= $keepEquip)
				setVar $sellEquip 1
				setVar $virtFreeHolds ($virtFreeHolds + 1)
			else
				setVar $sellEquip ($player~equipment_holds - $keepEquip)
				setVar $virtFreeHolds ($virtFreeHolds + $sellEquip)
			end
			
		end
		
		if ($virtFreeHolds > $keepEquip)
		
			if (PORT.BUYEQUIP[CURRENTSECTOR] = 0)
				setVar $buyEquip ($virtFreeHolds - $keepEquip)

			else
				if (PORT.BUYORG[CURRENTSECTOR] = 0)
					setVar $buyOrg ($virtFreeHolds - $keepEquip)
					if ($buyOrg < $keepEquip)
						setVar $buyOrg 0
					end 
				else
					if (PORT.BUYFUEL[CURRENTSECTOR] = 0)
						setVar $buyOre ($virtFreeHolds - $keepEquip)
						if ($buyOre < $keepEquip)
							setVar $buyOre 0
						end 
					end
				end
			end
		else
			if (($virtFreeHolds <= $keepEquip) and ($virtFreeHolds > 0))
				if (PORT.BUYEQUIP[CURRENTSECTOR] = 0)
					setVar $buyEquip 1
				end
			end
		end
		
	else
		# MCIC Testing
		#    We buy 5 or Sell 5 tops.
		#    Top ore where we can
		#    Always leave 30 holds for equipment management
echo "TRADING: *"
echo "$player~equipment_holds: " $$player~equipment_holds "*"
echo "player~ore_holds: " $player~ore_holds "*"
echo "sellEquip: " $sellEquip "*"
echo "buyOre: " $buyOre "*"
echo "buyOrg: " $buyOrg "*"
echo "buyEquip: " $buyEquip "*"
echo "virtFreeHolds: " $virtFreeHolds "*"


		# They sell equipment - sell 5 max
		if (($player~equipment_holds > 0) and (PORT.BUYEQUIP[CURRENTSECTOR] = 1))
			if ($player~equipment_holds <= 5)
				setVar $sellEquip $player~equipment_holds
				setVar $virtFreeHolds ($virtFreeHolds + $player~equipment_holds)
			else
				setVar $sellEquip 5
				setVar $virtFreeHolds ($virtFreeHolds + 5)
			end
		end

		# they buy equipment, buy 5 max
		if (PORT.BUYEQUIP[CURRENTSECTOR] = 0)
			if ($virtFreeHolds < 5)
				setvar $buyEquip $virtFreeHolds
			else
				setVar $buyEquip 5
			end
			setVar $virtFreeHolds ($virtFreeHolds - $buyEquip)
		end
		if (PORT.BUYFUEL[CURRENTSECTOR] = 0)
			if ($virtFreeHolds > $keepEquip)
				setVar $buyOre ($virtFreeHolds - $keepEquip)
			end
			#if ($buyOre < $keepEquip)
			#	setVar $buyOre 0
			#end 
		end
		
	end
echo "TRADING: *"
echo "sellOre: " $sellOre "*"
echo "sellOrg: " $sellOrg "*"
echo "sellEquip: " $sellEquip "*"
echo "buyOre: " $buyOre "*"
echo "buyOrg: " $buyOrg "*"
echo "buyEquip: " $buyEquip "*"
echo "virtFreeHolds: " $virtFreeHolds "*"



	setVar $trading ($sellOre + $sellOrg + $sellEquip + $buyOre + $buyOrg + $buyEquip)
	if ($trading > 0)
		gosub :voidadjacent
		goSub :portandtrade
		gosub :clearadjacent
	else
		setVar $SWITCHBOARD~message "Nothing to trade; have a nice day!*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
	

halt


:portandtrade
	
	//
	setVar $report 0
	send "p   t"
	waitfor "Commerce report for"
	
	setTextLineTrigger checkCash :checkCash "empty cargo holds"
	setTextLineTrigger portFail :portFail "ou don't have anything they want, and they don't have anything you can b"
	pause
	:portFail
		setVar $SWITCHBOARD~message "Oops nothing to trade; script fail?*"
		gosub :SWITCHBOARD~switchboard
		halt
	:checkCash
		killAllTriggers
		


	killalltriggers
	:tradeloop
	setTextTrigger sell1 :sell1 "How many holds of Fuel Ore do you want to sell"
	setTextTrigger sell2 :sell2 "How many holds of Organics do you want to sell"
	setTextTrigger sell3 :sell3 "How many holds of Equipment do you want to sell"
	setTextTrigger buy1 :buy1 "How many holds of Fuel Ore do you want to buy"
	setTextTrigger buy2 :buy2 "How many holds of Organics do you want to buy"
	setTextTrigger buy3 :buy3 "How many holds of Equipment do you want to buy"
	setTextTrigger tradeloopdone :tradeloopdone "Command ["
	pause

	:sell1
		killalltriggers
		setVar $PLAYER~multiplier 105
		if ($sellOre > 0)
			setVar $tradeQuant $sellOre
			gosub :doTrade
		else
			gosub :noTrade
		end
		goto :tradeloop
	:sell2
		killalltriggers
		setVar $PLAYER~multiplier 105
		if ($sellOrg > 0)
			setVar $tradeQuant $sellOrg
			gosub :doTrade
		else
			gosub :noTrade
		end
		goto :tradeloop
	:sell3
		killalltriggers
		setVar $PLAYER~multiplier 105
		if ($sellEquip > 0)
			setVar $tradeQuant $sellEquip
			gosub :doTrade
		else
			gosub :noTrade
		end
		goto :tradeloop
		
	:buy1
		killalltriggers
		setVar $PLAYER~multiplier 95
		if ($buyOre > 0)
			setVar $tradeQuant $buyOre
			gosub :doTrade
		else
			gosub :noTrade
		end
		goto :tradeloop
	:buy2
		killalltriggers
		setVar $PLAYER~multiplier 95
		if ($buyOrg > 0)
			setVar $tradeQuant $buyOrg
			gosub :doTrade
		else
			gosub :noTrade
		end
		goto :tradeloop
	:buy3
		killalltriggers
		setVar $PLAYER~multiplier 95

		if ($buyEquip > 0)
			setVar $tradeQuant $buyEquip
			gosub :doTrade
		else
			gosub :noTrade
		end
		goto :tradeloop

	:tradeloopdone
		killalltriggers
return


:noTrade
	send "0*"
	waitfor "empty cargo holds."
return

:doTrade
	
	send $tradeQuant "*"
	
		
	if ($haggle = "t")
		waitfor "Agreed,"
		setTextLineTrigger tradeFin :tradeFin "empty cargo holds"
		pause
		:tradeFin
			killAllTriggers
			getWord CURRENTLINE $nCredits 3
			stripText $nCredits ","
			stripText $nCredits "."
			
			if ($nCredits = $cCredits)
				setVar $report 1
			else
				setVar $cCredits $nCredits
			end	
	elseif ($haggle = "h")
	
		gosub :PLAYER~startHaggle
	end
	
return





:chkFtr
	
	if (SECTOR.FIGS.QUANTITY[CURRENTSECTOR] = 0)
		if (CURRENTSECTOR > 10)
			send "f   1  *  c  d "

		end
	end

return



:voidadjacent
	
	setVar $voidSector CURRENTSECTOR
	gosub :voidadjacentPPT
	

return
:clearadjacent
	
	setVar $voidSector CURRENTSECTOR
	gosub :clearadjacentPPT

return

:voidadjacentPPT
	getSector $voidSector $sectorInfo
	if ($sectorInfo.warp[1] = 0)
		send "'This sector has no warps, maybe you need to scan it first*"
		halt
	else
		setVar $voidsect 0
		:voids
		add $voidsect 1
		if ($voidsect < 7)
			if ($sectorInfo.warp[$voidsect] <> 0)
		
		send "CV" & $sectorInfo.warp[$voidsect] & "*Q"
		
			end
			goto :voids
		end
	setVar $SWITCHBOARD~message "Avoids set on adjacent sectors!*"
	gosub :SWITCHBOARD~switchboard
	   
		send "/"
		waitfor " Sect "    
	end
return

:clearadjacentPPT
	getSector $voidSector $sectorInfo
	if ($sectorInfo.warp[1] = 0)
		setvar $switchboard~message "-This sector has no warps, try to scan it first!*"
		gosub :SWITCHBOARD~switchboard
		halt
	else
		setVar $voidsect 0
		:clearvoids
		add $voidsect 1
		if ($voidsect < 7)
			if ($sectorInfo.warp[$voidsect] <> 0)
		
		send "CV0*YN" & $sectorInfo.warp[$voidsect] & "*Q"
		
			end
			goto :clearvoids
		end

		setVar $SWITCHBOARD~message "Avoids cleared on adjacent sectors!*"
	gosub :SWITCHBOARD~switchboard
	   
		send "/"
		waitfor " Sect "
	end
return

halt

#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\player\starthaggle\player"
