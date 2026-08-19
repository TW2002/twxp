#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:merchant~merchant
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
logging off
killalltriggers

if ($docim = true)
	setvar $switchboard~message "Downloading Current Port CIM Data - Comms Off*"
	gosub :switchboard~switchboard
	send "^rq"
	waitfor ": ENDINTERROG"
	setvar $switchboard~message "CIM Port Data Complete - Comms Back On*"
	gosub :switchboard~switchboard
end

if (($player~limpets <= $player~surroundlimp) and ($merchant~mines = true))
	gosub :attempt_refurb
end

loadvar $bot~bot_folder
setvar $hagglefile $bot~folder&"/haggledata.txt"
setvar $sectorcount 10
setvar $totalholds 0
setvar $spentcredits 0
setvar $half_port_max $game~port_max
divide $half_port_max 2
setvar $merch_sample_amount $player~total_holds

if ($merch_sample_amount <= 0)
	setvar $merch_sample_amount 255
end

setvar $merch_neg_sample_amount $merch_sample_amount
if ($merch_neg_sample_amount > 255)
	setvar $merch_neg_sample_amount 255
end

if ($checkmcic = true)
	if ($planet~planetnegotiate = true)
		setvar $minprod $merch_neg_sample_amount
	else
		setvar $minprod $merch_sample_amount
	end
end

if ($merchant~use_file = true)
	setvar $sector_idx 1
end

gosub :player~startcnsettings
setvar $haggle~nativehagglemode $nativehagglemode
gosub :haggle~configurenativehaggle

setarray $checkedports sectors
setarray $que sectors
setarray $checked sectors

:select_next_port
while ($sellingorg and ($planet~planet_organics >= $minprod)) or ($sellingequip and ($planet~planet_equipment >= $minprod)) or ($salesman = true)
	if (($player~unlimitedgame = false) and ($player~turns <= $bot~bot_turn_limit))
		setvar $switchboard~message "Turns too low to continue.*"
		gosub :switchboard~switchboard
		return
	end

	if ($merchant~use_file = true)
		setvar $nearfig 0
		while ($sector_idx <= $merchant~sectors)
			setvar $focus $merchant~sectors[$sector_idx]
			add $sector_idx 1
			gosub :checkport
			if ($goodport = true)
				setvar $nearfig $focus
				setvar $checkedports[$nearfig] true
				goto :merch_sector
			end
		end
		if ($nearfig <= 0)
			goto :done
		end
	end

	# selloff first to all the high value ports
	if ($checkmcic <> true)
		setvar $sellscore 0
		setvar $sellsector 0
		setvar $focus 1
		setvar $merchcheckremote false

		while ($focus <= sectors)
			gosub :checkport
			if ($goodport = true) and ($port~portvalue > $sellscore)
				setvar $sellscore $port~portvalue
				setvar $sellsector $focus
			end
			add $focus 1
		end
		if ($sellsector > 0)
			setvar $nearfig $sellsector
			setvar $checkedports[$nearfig] true
			goto :merch_sector
		end
	end

	setvar $bottom 1
	setvar $top 1

	setarray $checked sectors
	setvar $que[1] $player~current_sector
	setvar $checked[$player~current_sector] 1

	# go to the rest of the good ports in order of proximity
	:tryagain2
	while ($bottom <= $top)
		setvar $focus $que[$bottom]
		setvar $merchcheckremote true
		gosub :checkport

		# found good port
		if ($goodport = true)
			setvar $nearfig $focus
			setvar $checkedports[$nearfig] true
			goto :merch_sector
		else
			setvar $nearfig 0
		end

		# That wasn't it, so let's add all the adjacents to the que for future testing.
		setvar $a 1
		while (sector.warps[$focus][$a] > 0)
			setvar $adjacent sector.warps[$focus][$a]
			# But only add them if they haven't been added previously
			if ($checked[$adjacent] = 0)
				# Okay, this one hasn't been checked, so tag it and que it.
				setvar $checked[$adjacent] 1
				add $top 1
				setvar $que[$top] $adjacent
			end
			add $a 1
		end
		# The adjacents of $focus were all queued, now on to the next one.
		add $bottom 1
	end

	setvar $switchboard~message "No ports available*"
	gosub :switchboard~switchboard
	return
end

:done
setvar $switchboard~message "Merchant successfully completed.*"
gosub :switchboard~switchboard
return

:merch_sector
if ($nearfig > 0) and ($nearfig <> $player~current_sector)
	killalltriggers
	setvar $planet~warpto $nearfig
	gosub :planet~pwarp
	if ($planet~pwarpsuccess = false)
		goto :select_next_port
	end
	setvar $player~current_sector $nearfig
	gosub :refreshport
	setvar $oretrading $port~oretrading
	setvar $orgtrading $port~orgtrading
	setvar $equtrading $port~equtrading

	if ($liveport <> true)
		goto :select_next_port
	end

	gosub :merchant~refreshtradeflags
	setvar $thisportvalue 0
	if ($cansellequiphere = true)
		add $thisportvalue $port~equvalue
	end
	if ($cansellorghere = true)
		add $thisportvalue $port~orgvalue
	end
	if ($salesman = true) and ($merchant~upgrade = true) and (port.exists[$player~current_sector] = true)
		gosub :merchant~salesmanupgradeall
	end
	if ($salesman <> true) and ($cansellfuelhere <> true) and ($cansellorghere <> true) and ($cansellequiphere <> true)
		gosub :postport
		goto :select_next_port
	end
	if (($cansellfuelhere <> true) and ($cansellorghere <> true) and ($cansellequiphere <> true) and ($canbuyfuelhere <> true) and ($canbuyorghere <> true) and ($canbuyequiphere <> true))
		gosub :postport
		goto :select_next_port
	end

	if ($planet~planetnegotiate = true)
		gosub :sellhaggle
	else
		gosub :sellnative
	end

	if ($salesman)
		gosub :refreshtradeflags
		setvar $planetroom ($planet~planetequipmax - $planet~planetequip)
		if (($equipselling >= $merchant~minprod) and ($planetroom >= $merchant~minprod))
			setvar $buyproduct "e"
			setvar $buyavailable $equipselling
			gosub :buyproduct
		end
		setvar $planetroom ($planet~planetorgmax - $planet~planetorg)
		if (($orgselling >= $merchant~minprod) and ($planetroom >= $merchant~minprod))
			setvar $buyproduct "o"
			setvar $buyavailable $orgselling
			gosub :buyproduct
		end
		setvar $planetroom ($planet~planetfuelmax - $planet~planetfuel)
		if (($fuelselling >= $merchant~minprod) and ($merchant~buyfuel = true) and ($planetroom >= $merchant~minprod))
			setvar $buyproduct "f"
			setvar $buyavailable $fuelselling
			gosub :buyproduct
		end
	end

	gosub :player~quikstats
	if (($player~credits + $planet~citadel_credits) < 5000000) and ($checkmcic = true) and (($uporg = true) or ($upequ = true))
		setvar $switchboard~message "Not enough credits to continue MCIC check*"
		gosub :switchboard~switchboard
		halt
	end

	if ($uporg = true)
		getsectorparameter $nearfig "ORGMCIC" $tmp
		if ($tmp <= $upmcic)
			setvar $port~product 2
			gosub :upgradeport
		end
	end

	if ($upequ = true)
		getsectorparameter $nearfig "EQUMCIC" $tmp
		if ($tmp <= $upmcic)
			setvar $port~product 3
			gosub :upgradeport
		end
	end

	if ($player~current_prompt = "Command")
		gosub :planet~landingsub
	elseif ($player~current_prompt = "Citadel")
		send "q"
	end

	gosub :planet~getplanetinfo
	send "c"
	gosub :player~quikstats
	gosub :port~getportinfo
end
gosub :postport
goto :select_next_port

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:sellhaggle
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
killalltriggers
setvar $attemptedsell false
setvar $planethaggle~_ck_pnego_fueltosell "-1"
if ($cansellfuelhere)
	if ($checkmcic = true)
		setvar $planethaggle~_ck_pnego_fueltosell $merch_neg_sample_amount
	elseif ($sellhalf)
		setvar $fuel_to_sell ($port~oretrading - $half_port_max)
		if ($fuel_to_sell <= 0)
			setvar $planethaggle~_ck_pnego_fueltosell "-1"
		else
			setvar $planethaggle~_ck_pnego_fueltosell $fuel_to_sell
		end
	else
		setvar $fuel_to_sell (100000 - $port~oretrading)
		setvar $planethaggle~_ck_pnego_fueltosell $fuel_to_sell
	end
else
	setvar $planethaggle~_ck_pnego_fueltosell "-1"
end
if ($cansellorghere)
	if ($checkmcic = true)
		setvar $planethaggle~_ck_pnego_orgtosell $merch_neg_sample_amount
	elseif ($sellhalf)
		setvar $org_to_sell ($port~orgtrading - $half_port_max)
		if ($org_to_sell <= 0)
			setvar $planethaggle~_ck_pnego_orgtosell "-1"
		else
			setvar $planethaggle~_ck_pnego_orgtosell $org_to_sell
		end
	else
		setvar $planethaggle~_ck_pnego_orgtosell "max"
	end
else
	setvar $planethaggle~_ck_pnego_orgtosell "-1"
end
if ($cansellequiphere)
	if ($checkmcic = true)
		setvar $planethaggle~_ck_pnego_equiptosell $merch_neg_sample_amount
	elseif ($sellhalf)
		setvar $equip_to_sell ($port~equtrading - $half_port_max)
		if ($equip_to_sell <= 0)
			setvar $planethaggle~_ck_pnego_equiptosell "-1"
		else
			setvar $planethaggle~_ck_pnego_equiptosell $equip_to_sell
		end
	else
		setvar $planethaggle~_ck_pnego_equiptosell "max"
	end
else
	setvar $planethaggle~_ck_pnego_equiptosell "-1"
end
setvar $planethaggle~hasprods 1
gosub :player~quikstats
setvar $precreds $player~credits
gosub :planethaggle~planetneg
gosub :player~quikstats
setvar $profit ($planethaggle~oreprofit + $planethaggle~orgprofit + $planethaggle~equprofit)
setvar $haggledata $profit & " " & $thisportvalue & " " & $oretrading & " " & $orgtrading & " " & $equtrading & "*"
write $hagglefile $haggledata
setvar $planethaggle~hasprods 0
if ($planethaggle~sellhagglesucceeded = true)
	gosub :refreshport
	if ($checkmcic <> true)
		if ($cansellequiphere and ($port~equtrading >= $minprod))
			setvar $checkedports[$nearfig] false
		end
		if ($cansellorghere and ($port~orgtrading >= $minprod))
			setvar $checkedports[$nearfig] false
		end
	end
end
if ($merchant~upfuel = true) and ($port~orebuying = "Selling") and ($planet~planetfuel < ($planet~planetfuelmax / 2)) and ($port~oretrading < $game~port_max)
	setvar $port~product 1
	gosub :upgradeport
end
if ($canbuyfuelhere = true)
	setvar $player~buyobject "f"
	setvar $player~buytype "s"
	setvar $player~buydownroundsfromparam $player~turnstoempty
	gosub :planethaggle~buy
	gosub :player~quikstats
end
if (($player~unlimitedgame = false) and (($player~turns - $player~turnssellingproduct) <= $bot~bot_turn_limit))
	setvar $switchboard~message "Turns too low to continue.*"
	gosub :switchboard~switchboard
	send "l "&$planet~planet&"* c "
	return
end
#send "l "&$planet~planet&"* t n l 1* t nl 2* t n l 3* s n l 1* s n l 2* s n l 3* q jy "
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:sellnative
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
killalltriggers
gosub :refreshport
if (($planet~planet_fuel_max - $planet~planet_fuel) < $port~oretrading)
	setvar $player~turnstoemptyfuel ((($planet~planet_fuel_max - $planet~planet_fuel) / $player~total_holds) - 1)
else
	setvar $player~turnstoemptyfuel (($port~oretrading / $player~total_holds) - 1)
end
if ($cansellorghere)
	if ($checkmcic = true)
		setvar $player~turnssellingproduct 1
	elseif ($planet~planet_organics < $port~orgtrading)
		setvar $player~turnssellingproduct (($planet~planet_organics / $player~total_holds) - 1)
	else
		setvar $player~turnssellingproduct ($port~orgtrading / $player~total_holds)
	end
	if (($player~unlimitedgame = false) and (($player~turns - $player~turnssellingproduct) <= $bot~bot_turn_limit))
		setvar $switchboard~message "Turns too low to continue.*"
		gosub :switchboard~switchboard
		send "l "&$planet~planet&"* c "
		return
	end
	send "l "&$planet~planet&"* t n l 1* t nl 2* t n l 3* s n l 1* s n l 2* s n l 3* q jy "
	gosub :player~quikstats
	while ($player~turnssellingproduct > 0)
		send "l " $planet~planet "*  t  *  * 2*  q P * *"
		send "0 * 0 *  /"
		waiton "Turns"
		if ($ni <> true)
			subtract $player~turnssellingproduct 1
		end
		add $totalorganicholds $player~total_holds
	end
end
if ($cansellequiphere)
	if ($checkmcic = true)
		setvar $player~turnssellingproduct 1
	elseif ($planet~planet_equipment < $port~equtrading)
		setvar $player~turnssellingproduct (($planet~planet_equipment / $player~total_holds) - 1)
	else
		setvar $player~turnssellingproduct ($port~equtrading / $player~total_holds)
	end
	send "l "&$planet~planet&"* t n l 1* t nl 2* t n l 3* s n l 1* s n l 2* s n l 3* q jy "
	while ($player~turnssellingproduct > 0)
		send "l " $planet~planet "*  t  *  * 3*  q P * *"
		send "0 * 0 *  /"
		if ($ni <> true)
			subtract $player~turnssellingproduct 1
		end
		add $totalequipmentholds $player~total_holds
		waiton "Turns"
	end
end
if (($port~orebuying = "Selling") and ($buyfuel = true))
	send "l "&$planet~planet&"* t n l 1* t nl 2* t n l 3* s n l 1* s n l 2* s n l 3* q jy "
	gosub :player~quikstats
	while (($player~turnssellingproduct > 0) and ($player~turnstoemptyfuel > 1))
		send "l " $planet~planet "*   t  *  l 1* t  *  * 2*  q P * *"
		send "*"
		send " 0 * "
		if ($ni <> true)
			subtract $player~turnssellingproduct 1
		end
		subtract $player~turnstoemptyfuel 1
		subtract $player~turns 1
		waiton "Turns"
	end
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:merchant~rob
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
killalltriggers
gosub :player~quikstats
setvar $startinglocation $player~current_prompt

getsectorparameter $player~current_sector "BUSTED" $isbusted
if ($isbusted = true)
	return
end
cuttext $player~alignment $neg_ck 1 1

striptext $player~alignment "-"
if ($player~alignment < 100) and ($neg_ck = "-")
	return
elseif ($neg_ck <> "-")
	return
end
send "q q pr * r"
settextlinetrigger valid :rob_continue "<R> Rob this Port"
settextlinetrigger notvalid :rob_not_valid "<Q> Quit, nevermind"
pause

:rob_continue
killtrigger notvalid
settextlinetrigger fake :rob_fake "Busted!"
settextlinetrigger mega :rob_ok "port has in excess of"
pause

:rob_fake
killalltriggers
if ($startinglocation = "Citadel")
	gosub :planet~landingsub
end
setsectorparameter $player~current_sector "BUSTED" true
setvar $switchboard~message "Fake Busted*"
gosub :switchboard~switchboard
return

:rob_ok
killalltriggers
#setvar $rob $player~experience
#multiply $rob 3
#multiply $game~rob_factor 100
setvar $rob ($game~rob_factor*$player~experience)
getword currentline $port_cash 11

striptext $port_cash ","
setvar $original_port_cash $port_cash
multiply $port_cash 10
divide $port_cash 9
#	if (($port_cash >= 3000000) AND ($game~mbbs = TRUE))
#		send "'{" $bot~bot_name "} - " $port_cash " credits on port.  Port is ready for Mega Rob**"
#		gosub :planet~landingSub
#		goto :wait_for_command
#	end
if ($port_cash < $minimumport)
	echo "*Port has less than "&$minimumport&" credits on it.*"
	send "0*"
	setvar $rob 0
elseif ($port_cash >= $rob)
	send $rob "*"
elseif ($port_cash < $rob)
	setvar $rob $port_cash
	send $rob "*"
end
if ($port_cash < $minimumport)
	setvar $checkedports[$player~current_sector] true
	setvar $empty_grid[$player~current_sector] true
	write $bot~no_credits_file $player~current_sector
end
settextlinetrigger port_empty :rob_suc "Maybe some other day, eh?"
settextlinetrigger mega_suc :rob_suc "Success!"
settextlinetrigger mega_bust :rob_bust "Busted!"
pause

:rob_bust
killalltriggers
if ($startinglocation = "Citadel")
	gosub :planet~landingsub
end
setsectorparameter $player~current_sector "BUSTED" true
send "'<"&$bot~subspace&">[Busted:"&$player~current_sector&"]<"&$bot~subspace&">* "
return

:rob_ready_to_mega
killalltriggers
send "0*  "
if ($startinglocation = "Citadel")
	gosub :planet~landingsub
end
return

:rob_not_valid
killalltriggers
setvar $checkedports[$player~current_sector] true
setvar $empty_grid[$player~current_sector] true
write $bot~no_credits_file $player~current_sector
setvar $rob 0
setvar $original_port_cash 0

:rob_suc
killalltriggers
if ($startinglocation = "Citadel")
	send "l " $planet~planet "* c t t " $rob "* "
end
if ($rob > $original_port_cash)
	setvar $checkedports[$player~current_sector] true
	setvar $empty_grid[$player~current_sector] true
	write $bot~no_credits_file $player~current_sector
end
if ($rob > 0)
	setvar $laststeal $player~current_sector
	setvar $switchboard~message "Success! - "&$rob&" credits robbed*"
	gosub :switchboard~switchboard
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:merchant~upgradeport
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if ($port~product < 1)
	return
end

setvar $total_creds_needed ((300*100) + (500*100) + (700*100) + 500000)
if (($total_creds_needed > $player~credits) and (($player~credits+$planet~citadel_credits) > $total_creds_needed))
	setvar $cashonhand $planet~citadel_credits
	add $cashonhand $player~credits
	if ($cashonhand > $total_creds_needed)
		send "T T " & $player~credits & "* "
		send "T F " & $total_creds_needed & "* "
		setvar $player~credits $total_creds_needed
	end
end
send "q q q z a 999* * * * "
gosub :port~domaxport
gosub :player~quikstats
gosub :planet~landingsub
gosub :refreshport
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:merchant~salesmanupgradefuel
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $total_creds_needed (300 * 100 + 50000)
if (($total_creds_needed > $player~credits) and (($player~credits + $planet~citadel_credits) > $total_creds_needed))
	setvar $cashonhand $planet~citadel_credits
	add $cashonhand $player~credits
	if ($cashonhand > $total_creds_needed)
		send "T T " & $player~credits & "* "
		send "T F " & $total_creds_needed & "* "
		setvar $player~credits $total_creds_needed
	end
end
setvar $salesmanfuelupgradeamount ($game~port_max - $port~oretrading)
if ($salesmanfuelupgradeamount > 100)
	setvar $salesmanfuelupgradeamount 100
end
if ($salesmanfuelupgradeamount > 0)
	send "q q *O 1 " & $salesmanfuelupgradeamount & "* *CR*Q"
	gosub :player~quikstats
	gosub :planet~landonplanetentercitadel
	gosub :refreshport
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:merchant~buyfuel
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $merchant~buyfuel_success false
setvar $merchant~buyfuel_bought false
setvar $merchant~buyfuel_upgraded false
setvar $merchant~buyfuel_message ""
if ($merchant~buyfuel_minimum <= 0)
	setvar $merchant~buyfuel_minimum 10000
end
gosub :player~quikstats
if ($player~current_prompt <> "Citadel")
	setvar $merchant~buyfuel_message "Merchant buyfuel must start from Citadel prompt."
	return
end
if ($player~empty_holds <> $player~total_holds)
	setvar $merchant~buyfuel_message "Ship holds are not empty."
	return
end
gosub :refreshport
if ($liveport <> true)
	if ($merchant~refreshport_message <> "")
		setvar $merchant~buyfuel_message $merchant~refreshport_message
	else
		setvar $merchant~buyfuel_message "No port in sector."
	end
	return
end
if ($port~orebuying <> "Selling")
	setvar $merchant~buyfuel_message "Port is not selling fuel."
	return
end
if ($planet~planet_fuel_max <= 0)
	setvar $merchant~buyfuel_message "Planet fuel capacity is unknown."
	return
end
setvar $planetroom ($planet~planet_fuel_max - $planet~planet_fuel)
if ($planetroom <= 0)
	setvar $merchant~buyfuel_message "Planet is full of fuel."
	return
end
if ($merchant~buyfuel_min_room_pct > 0)
	setvar $merchant~buyfuel_min_room ($planet~planet_fuel_max * $merchant~buyfuel_min_room_pct)
	divide $merchant~buyfuel_min_room 100
	if ($planetroom < $merchant~buyfuel_min_room)
		setvar $merchant~buyfuel_message "Planet is not low enough on fuel."
		return
	end
end
setvar $merchant~buyfuel_capacity $port~oretrading
if ($port~orepercent > 0)
	setvar $merchant~buyfuel_capacity ($port~oretrading * 100)
	divide $merchant~buyfuel_capacity $port~orepercent
end
if ($merchant~buyfuel_capacity < $merchant~buyfuel_minimum)
	gosub :buyfuelupgrade
	if ($merchant~buyfuel_upgrade_success <> true)
		return
	end
	gosub :refreshport
	if (($liveport <> true) or ($port~orebuying <> "Selling"))
		if ($merchant~refreshport_message <> "")
			setvar $merchant~buyfuel_message $merchant~refreshport_message
		else
			setvar $merchant~buyfuel_message "Fuel port unavailable after upgrade."
		end
		return
	end
end
if ($port~oretrading <= 0)
	setvar $merchant~buyfuel_message "No fuel available to buy."
	return
end
setvar $merchant~buyfuel_restore_nohaggle $merchant~nohaggle
setvar $merchant~buyfuel_restore_nativehaggle $merchant~nativehagglemode
setvar $merchant~nohaggle true
setvar $merchant~nativehagglemode false
setvar $buyproduct "f"
setvar $buyavailable $port~oretrading
setvar $planetroom ($planet~planet_fuel_max - $planet~planet_fuel)
gosub :buyproduct
setvar $merchant~nohaggle $merchant~buyfuel_restore_nohaggle
setvar $merchant~nativehagglemode $merchant~buyfuel_restore_nativehaggle
if ($player~exit_message = "Normal Exit")
	setvar $merchant~buyfuel_success true
	setvar $merchant~buyfuel_bought true
	setvar $merchant~buyfuel_message "Fuel bought."
else
	setvar $merchant~buyfuel_message $player~exit_message
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:merchant~buyfuelupgrade
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $merchant~buyfuel_upgrade_success false
setvar $merchant~buyfuel_upgrade_needed ($merchant~buyfuel_minimum - $merchant~buyfuel_capacity)
divide $merchant~buyfuel_upgrade_needed 10
if (($merchant~buyfuel_capacity + ($merchant~buyfuel_upgrade_needed * 10)) < $merchant~buyfuel_minimum)
	add $merchant~buyfuel_upgrade_needed 1
end
if ($merchant~buyfuel_upgrade_needed <= 0)
	setvar $merchant~buyfuel_upgrade_success true
	return
end
setvar $merchant~buyfuel_creds_needed ($merchant~buyfuel_upgrade_needed * 300)
if ($merchant~buyfuel_creds_needed > $player~credits)
	setvar $merchant~buyfuel_cashonhand $planet~citadel_credits
	add $merchant~buyfuel_cashonhand $player~credits
	if ($merchant~buyfuel_cashonhand >= $merchant~buyfuel_creds_needed)
		send "t t " & $player~credits & "* "
		send "t f " & $merchant~buyfuel_creds_needed & "* "
		setvar $player~credits $merchant~buyfuel_creds_needed
	else
		setvar $merchant~buyfuel_message "Not enough cash to upgrade fuel port."
		return
	end
end
send "q q *o 1 " & $merchant~buyfuel_upgrade_needed & "* *cr*q"
waiton "<Computer deactivated>"
setvar $merchant~buyfuel_upgraded true
setvar $merchant~buyfuel_upgrade_success true
gosub :planet~landonplanetentercitadel
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:merchant~salesmanupgradeall
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $total_creds_needed ((300 * 100) + (500 * 100) + (700 * 100) + 500000)
if (($total_creds_needed > $player~credits) and (($player~credits + $planet~citadel_credits) > $total_creds_needed))
	setvar $cashonhand $planet~citadel_credits
	add $cashonhand $player~credits
	if ($cashonhand > $total_creds_needed)
		send "T T " & $player~credits & "* "
		send "T F " & $total_creds_needed & "* "
		setvar $player~credits $total_creds_needed
	end
end
send "q q *O 1 100*O 2 100*O 3 100** "
gosub :player~quikstats
gosub :planet~landonplanetentercitadel
gosub :player~quikstats
gosub :refreshport
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:merchant~checkport
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $goodport false
setvar $mcicscore 0
setvar $cansellfuelhere false
setvar $cansellorghere false
setvar $cansellequiphere false
setvar $canbuyfuelhere false
setvar $canbuyorghere false
setvar $canbuyequiphere false

## review this logic
if ($bot~parameter <> "") and ($bot~parameter <> 0)
	getsectorparameter $focus $bot~parameter $isgoodsector
	if ($isgoodsector <> true)
		return
	end
end

getsectorparameter $focus "FIGSEC" $hasfigatfocus
if (($focus <> $player~current_sector) and ($hasfigatfocus <> true))
	return
end

getsectorparameter $focus "BUSTED" $isbusted
if (($isbusted = true) or ($checkedports[$focus] = true) or (port.exists[$focus] <> true))
	return
end

setvar $port~target $focus
gosub :port~getportdbinfo

# If running in checkmcic mode, skip ports that are upgraded or that we already have MCIC for
if ($checkmcic = true)
	if ($port~oretotal > 25000) or ($port~orgtotal > 25000) or ($port~equtotal > 25000)
		return
	end
	if ($port~orebuying = "Buying") and ($port~oremcic = 0) and ($port~oretrading >= $minprod) and ($port~orepercent >= $minpct)
		setvar $cansellfuelhere true
	end
	if ($port~orgbuying = "Buying") and ($port~orgmcic = 0) and ($port~orgtrading >= $minprod) and ($port~orgpercent >= $minpct)
		setvar $cansellorghere true
	end
	if ($port~equbuying = "Buying") and ($port~equmcic = 0) and ($port~equtrading >= $minprod) and ($port~equpercent >= $minpct)
		setvar $cansellequiphere true
	end
	if ($cansellfuelhere = true) or ($cansellorghere = true) or ($cansellequiphere = true)
		setvar $goodport true
	end
	return
end

# Everything else is not in checkmcic mode

if ($sellingfuel = true)
	if ($planet~planet_fuel >= 100000) and ($port~orebuying = "Buying") and ($port~oretrading >= $minprod) and ($port~orepercent >= $minpct)
		setvar $cansellfuelhere true
	end
end

if ($sellingorg = true)
	if ($planet~planet_organics >= $minprod) and ($port~orgbuying = "Buying") and ($port~orgtrading >= $minprod) and ($port~orgpercent >= $minpct)
		setvar $cansellorghere true
	end
end

if ($sellingequip = true)
	if ($planet~planet_equipment >= $minprod) and ($port~equbuying = "Buying") and ($port~equtrading >= $minprod) and ($port~equpercent >= $minpct)
		setvar $cansellequiphere true
	end
end

if ($salesman = true)
	setvar $planetroom ($planet~planet_equipment_max - $planet~planet_equipment)
	if ($port~equbuying = "Selling") and ($planetroom >= $minprod) and ($port~equtrading >= $minprod)
		setvar $canbuyequiphere true
	end
	setvar $planetroom ($planet~planet_organics_max - $planet~planet_organics)
	if ($port~orgbuying = "Selling") and ($planetroom >= $minprod) and ($port~orgtrading >= $minprod)
		setvar $canbuyorghere true
	end
end

if ($buyfuel = true)
	setvar $planetroom ($planet~planet_fuel_max - $planet~planet_fuel)
	if ($port~orebuying = "Selling") and ($planetroom >= $minprod) and ($port~oretrading >= $minprod)
		setvar $canbuyfuelhere true
	end
end

if ($cansellfuelhere = true) or ($cansellorghere = true) or ($cansellequiphere = true)
	setvar $goodport true
end

if ($salesman = true) and (($canbuyfuelhere = true) or ($canbuyorghere = true) or ($canbuyequiphere = true))
	setvar $goodport true
end

return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:merchant~refreshtradeflags
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $cansellfuelhere false
setvar $cansellorghere false
setvar $cansellequiphere false
setvar $canbuyfuelhere false
setvar $canbuyorghere false
setvar $canbuyequiphere false

if ($sellingfuel = true)
	if (($planet~planet_fuel >= 100000) and ($port~orebuying = "Buying") and ($port~oretrading >= $minprod))
		if (($checkmcic = true) or ($salesman = true) or ($sellhalf <> true) or (($port~orepercent >= $minpct) and ($port~oretrading > $half_port_max)))
			setvar $cansellfuelhere true
		end
	end
end

if ($sellingorg = true)
	if (((($salesman = true) and ($planet~planet_organics >= $minprod)) or (($salesman <> true) and ($planet~planet_organics >= $minprod))) and ($port~orgbuying = "Buying") and ($port~orgtrading >= $minprod))
		if (($checkmcic = true) or ($salesman = true) or ($sellhalf <> true) or (($port~orgpercent >= $minpct) and ($port~orgtrading > $half_port_max)))
			setvar $cansellorghere true
		end
	end
end

if ($sellingequip = true)
	if (((($salesman = true) and ($planet~planet_equipment >= $minprod)) or (($salesman <> true) and ($planet~planet_equipment >= $minprod))) and ($port~equbuying = "Buying") and ($port~equtrading >= $minprod))
		if (($checkmcic = true) or ($salesman = true) or ($sellhalf <> true) or (($port~equpercent >= $minpct) and ($port~equtrading > $half_port_max)))
			setvar $cansellequiphere true
		end
	end
end

if ($buyfuel = true)
	setvar $planetroom ($planet~planet_fuel_max - $planet~planet_fuel)
	if (($port~orebuying = "Selling") and ($planetroom >= $minprod) and ($port~oretrading >= $minprod))
		setvar $canbuyfuelhere true
	end
end

if ($salesman = true)
	setvar $planetroom ($planet~planet_equipment_max - $planet~planet_equipment)
	if (($port~equbuying = "Selling") and ($planetroom >= $minprod) and ($port~equtrading >= $minprod))
		setvar $canbuyequiphere true
	end
	setvar $planetroom ($planet~planet_organics_max - $planet~planet_organics)
	if (($port~orgbuying = "Selling") and ($planetroom >= $minprod) and ($port~orgtrading >= $minprod))
		setvar $canbuyorghere true
	end
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:merchant~merchupgradedport
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $merchupgraded false
setvar $upgradedfuel false
setvar $upgradedorg false
setvar $upgradedequip false
if (port.percentfuel[$focus] > 0)
	setvar $merchporttotal (port.fuel[$focus] * 100)
	divide $merchporttotal port.percentfuel[$focus]
	if ($merchporttotal > $game~port_max)
		setvar $merchupgraded true
		setvar $upgradedfuel true
	end
elseif (port.fuel[$focus] > $game~port_max)
	setvar $merchupgraded true
	setvar $upgradedfuel true
end
if (port.percentorg[$focus] > 0)
	setvar $merchporttotal (port.org[$focus] * 100)
	divide $merchporttotal port.percentorg[$focus]
	if ($merchporttotal > $game~port_max)
		setvar $merchupgraded true
		setvar $upgradedorg true
	end
elseif (port.org[$focus] > $game~port_max)
	setvar $merchupgraded true
	setvar $upgradedorg true
end
if (port.percentequip[$focus] > 0)
	setvar $merchporttotal (port.equip[$focus] * 100)
	divide $merchporttotal port.percentequip[$focus]
	if ($merchporttotal > $game~port_max)
		setvar $merchupgraded true
		setvar $upgradedequip true
	end
elseif (port.equip[$focus] > $game~port_max)
	setvar $merchupgraded true
	setvar $upgradedequip true
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:merchant~refreshport
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $liveport false
setvar $merchant~refreshport_message ""
gosub :player~currentprompt
if ($player~current_prompt = "Computer")
	send "q"
	settexttrigger refreshportcomputer :refreshportcomputer "<Computer deactivated>"
	setdelaytrigger refreshportfail :refreshportfail 5000
	pause

	:refreshportcomputer
	killalltriggers
	gosub :player~currentprompt
end
if ($player~current_prompt = "Citadel")
	send "q"
	settexttrigger refreshportplanet :refreshportplanet "Planet command (?"
	setdelaytrigger refreshportfail :refreshportfail 5000
	pause

	:refreshportplanet
	killalltriggers
	gosub :player~currentprompt
end
if ($player~current_prompt <> "Planet")
	setvar $merchant~refreshport_message "Unable to reach Planet prompt while refreshing port."
	return
end
gosub :planet~getplanetinfo
gosub :player~currentprompt
if ($player~current_prompt = "Computer")
	send "q"
	settexttrigger refreshportcomputer2 :refreshportcomputer2 "<Computer deactivated>"
	setdelaytrigger refreshportfail :refreshportfail 5000
	pause

	:refreshportcomputer2
	killalltriggers
	gosub :player~currentprompt
end
if ($player~current_prompt = "Planet")
	send "c"
	settexttrigger refreshportcitadel :refreshportcitadel "Citadel command"
	setdelaytrigger refreshportfail :refreshportfail 5000
	pause

	:refreshportcitadel
	killalltriggers
	gosub :player~currentprompt
end
if ($player~current_prompt <> "Citadel")
	setvar $merchant~refreshport_message "Unable to reach Citadel prompt while refreshing port."
	return
end
setvar $fuelselling 0
setvar $orgselling 0
setvar $equipselling 0
setvar $port~startinglocation "Citadel"
gosub :port~getportinfo
if ($port~noport = 1)
	return
end
setvar $liveport true
if ($port~orebuying = "Selling")
	setvar $fuelselling $port~oretrading
end
if ($port~orgbuying = "Selling")
	setvar $orgselling $port~orgtrading
end
if ($port~equbuying = "Selling")
	setvar $equipselling $port~equtrading
end
return

:refreshportfail
killalltriggers
setvar $merchant~refreshport_message "Prompt timed out while refreshing port."
gosub :player~currentprompt
if ($player~current_prompt = "Computer")
	send "q"
end
return

:postport
#send "#"
#waiton "                            Who's Playing"
gosub :player~quikstats
if ($merchant~grid = true)
	send "q m* * *  q "
	gosub :grid~surround
	gosub :player~quikstats
	gosub :planet~landonplanetentercitadel
end
if (((sector.limpets.quantity[$player~current_sector] <= 0) or (sector.mines.quantity[$player~current_sector] <= 0)) and (($player~limpets >= 3) and ($player~armids >= 3)) and ($merchant~mines = true))
	gosub :domines
end
if ($merchant~mines = true)
	send "s* "
	gosub :player~quikstats
	if ((sector.limpets.quantity[$player~current_sector] > 0) and (($player~limpets <= 5) or ($player~armids <= 5)))
		gosub :attempt_refurb
	end
end
if ($merchant~do_rob = true)
	gosub :rob
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:merchant~domines
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $bot~command "deploy"
setvar $bot~user_command_line " mines 3 silent "
setvar $bot~parm1 "mines"
setvar $bot~parm2 "2"

savevar $bot~command
savevar $bot~user_command_line
savevar $bot~parm1

load "scripts\"&$bot~mombot_directory&"\commands\grid\deploy.cts"
seteventtrigger        minesend        :minesend "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\grid\deploy.cts"
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
	send " q q q * l " $planet~planet " * n n * j m * * * j c  *  "
	gosub :player~quikstats
	if ($player~current_prompt <> "Citadel")
		setvar $switchboard~message "Not at correct prompt after mine deploy!  Maybe planet is gone?  Check please!*"
		gosub :switchboard~switchboard
		gosub :combat~callsaveme
	end
end

return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:merchant~attempt_refurb
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
send  "q t nl 2* t n l 3* s n l 1* s n l 2* s n l 3* t nt 1* c "
gosub :player~quikstats
setvar $limpetcashneeded ((($ship~ship_mines_max-$player~limpets)*$game~limpet_cost)+$game~limpet_removal_cost)
setvar $armidcashneeded ((($ship~ship_mines_max-$player~armids)*$game~armid_cost))
setvar $cashneeded ($limpetcashneeded+$armidcashneeded)
setvar $furbing true
if ($cashneeded > $player~credits)
	send "D"
	waiton "Citadel treasury contains "
	getword currentline $planet~citadelcash 4
	striptext $planet~citadelcash ","
	if ($planet~citadelcash < $cashneeded)
		setvar $switchboard~message "Not enough cash for mine refurbs in treasury or on hand.*"
		gosub :switchboard~switchboard
		return
	end
	send "t f "&($cashneeded-$player~credits)&"* "
end
# check adj's for Dock.. if present, then we don't need a jump sector.
setvar $i 1
setvar $start_sector $player~current_sector
setvar $weareadjdock false
while ($i <= sector.warpcount[$start_sector])
	setvar $adj_start sector.warps[$start_sector][$i]
	if ($adj_start = $map~stardock)
		setvar $weareadjdock true
	end
	add $i 1
end

if (($player~alignment < 1000) and ($weareadjdock = false))
	setvar $player~red_adj 0
	setvar $player~target $map~stardock
	gosub :move~findjumpsector
	if ($player~red_adj = 0)
		waitfor "Command [TL="
		send "l " & $startingplanet & "* c"
		waiton "Citadel command"
		setvar $switchboard~message "Cannot Find Jump Sector Adjacent Dock**"
		gosub :switchboard~switchboard
		return
	end
end

if ($player~alignment >= 1000)
	if ($weareadjdock)
		send "^F" & $map~stardock & "*" & $start_sector & "*Q/ "
	else
		send "^F" & $start_sector & "*" & $map~stardock & "*F" & $map~stardock & "*" & $start_sector & "*Q/ "
	end
else
	if ($weareadjdock)
		send "^F" & $map~stardock & "*" & $start_sector & "*Q/ "
	else
		send "^F" & $start_sector & "*" & $player~red_adj & "*F" & $map~stardock & "*" & $start_sector & "*Q/ "
	end
end
settextlinetrigger nojoy :nojoy "*** Error - No route within"
settexttrigger cont :cont "(?="
pause

:nojoy
killalltriggers
setvar $switchboard~message "Cannot Find Path to StarDock!**"
gosub :switchboard~switchboard
return

:cont
killalltriggers
setdelaytrigger latency_delay		:latency_delay 500
pause

:latency_delay
echo "**" & ansi_14 & "Please Stand By" & ansi_15 & " - Calculating Distances...**"
if (($player~alignment >= 1000) or ($weareadjdock))
	getdistance $dist1 $start_sector $map~stardock
else
	getdistance $dist1 $start_sector $player~red_adj
end

if ($dist1 <= 0)
	setvar $switchboard~message $taglineb & " - Insufficient Warp Data Plotting Course to Dock**"
	gosub :switchboard~switchboard
	return
end

getdistance $dist2 $map~stardock $start_sector
if ($dist2 <= 0)
	setvar $switchboard~message $taglineb & " - Insufficient Warp Data Plotting Return Course From Dock**"
	gosub :switchboard~switchboard
	return
end

setvar $ore_req (($dist1 + $dist2) * 3)

if ($player~ore_holds < $ore_req)
	setvar $switchboard~message "Not Enough ORE In Holds To Make Round Trip**"
	gosub :switchboard~switchboard
	return
end

if ($player~twarp_type = "No")
	setvar $switchboard~message "Must Have Twarp 1 or 2**"
	gosub :switchboard~switchboard
	return
end

if ($player~unlimitedgame = 0)
	gosub :turnsrequired
	if ($player~turnsrequired > $player~turns)
		setvar $switchboard~message "Not Enough Turns. " & ansi_12 & $player~turnsrequired & ansi_15 & ", Required**"
		gosub :switchboard~switchboard
		return
	elseif ($player~turnsrequired <= $player~turns)
		setvar $tmp ($player~turns - $player~turnsrequired)
		if ($tmp <= $bot~bot_turn_limit)
			setvar $switchboard~message "Proceeding Will Leave Fewer Than " & $bot~bot_turn_limit & " Turns!**"
			gosub :switchboard~switchboard
			return
		end
	end
end

send " C R " & $map~stardock & "*Q "
settextlinetrigger itsalive :itsalive "Items     Status  Trading % of max OnBoard"
settextlinetrigger nosoupforme :nosoupforme "I have no information about a port in that sector"
pause

:nosoupforme
killalltriggers
setvar $switchboard~message $taglineb & " - StarDock appears to have been Blown Up!**"
gosub :switchboard~switchboard
return

:itsalive
killalltriggers
waitfor "(?="
setvar $msg ""
if (($player~alignment >= 1000) and ($weareadjdock = false))
	setvar $player~warpto $map~stardock
	gosub :dotwarp
elseif (($weareadjdock = false) and ($player~red_adj <> 0))
	setvar $player~warpto $player~red_adj
	gosub :dotwarp
else
	send " m " & $map~stardock & "*  *  P  S G Y G Q "
end
if ($msg = "")
	waitfor "You leave the Galactic Bank."
else
	setvar $switchboard~message "Unknown Problem Detected. Check TA!**"
	gosub :switchboard~switchboard
	halt
end
gosub :player~quikstats

setvar $_limps "Max"
setvar $_mines "Max"
gosub :dopurchases
send "Q Q Q Q Z N M " & $start_sector & "* Y  Y  Y  * L Z" & #8 & $planet~planet & "* p  s  s * * c *"
gosub :player~quikstats
if ($player~current_sector = $map~stardock)
	setvar $switchboard~message "Twarp Error, Should be Hiding on Dock!**"
	gosub :switchboard~switchboard
	halt
end
send "q tnt1* c "

return

:dotwarp
setvar $msg ""
setvar $paused false
setvar $photoned false
if ($player~warpto > 0)
	send "q t * t 1*  q * * mz" & $player~warpto "*"
	settexttrigger there        :adj_warp "You are already in that sector!"
	settextlinetrigger adj_warp :adj_warp "Sector  : " & $player~warpto & " "
	settexttrigger locking      :locking "Do you want to engage the TransWarp drive?"
	settexttrigger igd          :twarpigd "An Interdictor Generator in this sector holds you fast!"
	settexttrigger noturns      :twarpphotoned "Your ship was hit by a Photon and has been disabled"
	settexttrigger noroute      :twarpnoroute "Do you really want to warp there? (Y/N)"
	pause

	:adj_warp
	killalltriggers
	send "z*"
	goto :twarp_adj

	:locking
	killalltriggers
	send "y"
	settextlinetrigger twarp_lock 		:twarp_lock "TransWarp Locked"
	settextlinetrigger no_twrp_lock 	:no_twarp_lock "No locating beam found"
	settextlinetrigger twarp_adj 		:twarp_adj "<Set NavPoint>"
	settextlinetrigger no_fuel 		:itwarpnofuel "You do not have enough Fuel Ore"
	pause

	:twarpnofuel
	killalltriggers
	setvar $switchboard~message "Not enough fuel for T-warp.*"
	gosub :switchboard~switchboard
	halt

	:twarp_adj
	killalltriggers
	send " * p s"
	goto :twarpdone

	:twarpnoroute
	killalltriggers
	send "n* z* "
	setvar $msg "No route available!"
	goto :twarpdone

	:no_twarp_lock
	killalltriggers
	send "n*zn"
	send "l " & #8 & $planet~planet "*c"
	setsectorparameter $player~warpto "FIGSEC" false
	setvar $temp " "&$player~warpto&" "
	replacetext $database $temp " "
	subtract $database_count 1
	goto :select_boomsec

	:twarpigd
	killalltriggers
	setvar $msg "My ship is being held by Interdictor!"
	goto :twarpdone

	:twarpphotoned
	killalltriggers
	setvar $msg "I have been photoned and can not T-warp!"
	send "l " & #8 & $planet~planet "* j c *   "
	setvar $photoned true
	goto :twarpdone

	:itwarpnofuel
	killalltriggers
	setvar $msg "I have no fuel!"
	send "l " & #8 & $planet~planet "* j c *   "
	goto :twarpdone

	:twarp_lock
	killalltriggers
	if ($player~alignment >= 1000)
		if ($furbing)
			setvar $str "y * * p s g y g q "
		else
			setvar $str "y * *  "
		end
		send $str
	else
		if ($furbing)
			setvar $str "y  *  *  m " & $map~stardock & " *  *  p s g y g q "
		else
			setvar $str "y * *  "
		end
		send $str
	end

	:twarpdone
	if ($msg <> "")
		setvar $switchboard~message "Twarp Error - " & $msg & "**"
		gosub :switchboard~switchboard
		setvar $paused true
	end
end
return

:bwarp
killalltriggers
send "b" $player~warpto "*"
settexttrigger go :go5 "TransWarp Locked"
settexttrigger no :no5 "No locating beam found"
pause

:no5
killalltriggers
send "n "
waitfor "Transporter shutting down."
setvar $fighter_grid[$player~warpto] 0
goto :select_boomsec

:go5
killalltriggers
send "y z * "
return

:turnsrequired
send "i"
settextlinetrigger turnsrequired_tpw	:turnsrequired_tpw "Turns to Warp  : "
pause

:turnsrequired_tpw
killalltriggers
getword currentline $player~turnsrequired_tpw 5

if ($player~red_adj > 0)
	# twarp to jmp sector, then into SD sect, then twarp home
	setvar $player~turnsrequired_temp ($player~turnsrequired_tpw * 3)
	if ($_tow > 0)
		# 2 Turns for exporting into other ship and back again
		add $player~turnsrequired_temp 2
		# 3 Turns for initial Port then x into other ship, port & shop, then x and report
		#   b4 heading home
		add $player~turnsrequired_temp 3
	else
		add $player~turnsrequired_temp 1
	end
else
	setvar $player~turnsrequired_temp ($player~turnsrequired_tpw * 2)
	# 1 Turn to port at dock
	add $player~turnsrequired_temp 1
end

setvar $player~turnsrequired $player~turnsrequired_temp
return

:select_boomsec
setvar $i 1
setvar $foundboomsec false
while ($i <= $database_count)
	if (getsectorparameter $i "FIGSEC" = true)
		setvar $foundboomsec true
		send "l " & #8 & $planet~planet & "* c"
		gosub :player~quikstats
		goto :tryagain2
	end
	add $i 1
end
if ($foundboomsec = false)
	setvar $switchboard~message "No FIGs found in database!**"
	gosub :switchboard~switchboard
	return
end

:dopurchases
send "h "
waitfor "<Hardware Emporium>"
#=============================================== PURCHASE LIMPS
if ($_limps  <> "")
	send "L "
	waitfor "How many mines do you want"
	if ($_limps  = "Max")
		gettext currentline $buy "(Max" ")"
		send $buy & "* "
	else
		send $buy $_limps & "* "
	end
	waitfor "<Hardware Emporium>"
end
#=============================================== PURCHASE ARMIDS
if ($_mines  <> "")
	send "M "
	setvar $buy 0
	waitfor "How many mines do you"
	if ($_mines  = "Max")
		gettext currentline $buy "(Max" ")"
		send $buy & "* "
	else
		send $_mines & "* "
	end
	waitfor "<Hardware Emporium>"
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:merchant~callsaveme
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
send "q q q q * "
gosub :combat~callsaveme
halt

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:merchant~buyproduct
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if (($buyavailable <= 0) or ($planetroom <= 0))
	return
end
if (($player~unlimitedgame = false) and ($player~turns <= $bot~bot_turn_limit))
	setvar $switchboard~message "Turns too low to continue.*"
	gosub :switchboard~switchboard
	return
end
if ($player~total_holds <= 0)
	return
end

setvar $buyunits $buyavailable
if ($buyunits > $planetroom)
	setvar $buyunits $planetroom
end
if ($buyunits <= 0)
	return
end

setvar $player~buyobject $buyproduct
if ($merchant~nohaggle)
	setvar $player~buytype "s"
elseif (($buyproduct = "f") and ($merchant~nativehagglemode <> true))
	setvar $player~buytype "s"
else
	setvar $player~buytype "b"
end

setvar $player~buydownroundsfromparam $buyunits
divide $player~buydownroundsfromparam $player~total_holds
if ($player~buydownroundsfromparam <= 0)
	setvar $player~buydownroundsfromparam 1
end

gosub :planethaggle~buy
gosub :player~quikstats
return

# includes:
include "source\include\planethaggle"
include "source\include\port"
include "source\include\grid"
include "source\include\sector"
include "source\include\haggle"
include "source\include\player"
include "source\include\planet"
include "source\include\combat"
include "source\include\switchboard.ts"
