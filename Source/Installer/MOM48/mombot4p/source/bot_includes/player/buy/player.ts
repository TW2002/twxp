# ====================================== START BUY COMMAND ==============================================
:buy

	#required params:
	#$overrided - true/false
	#$buytype - 1/2/3
	#$buyobject - e/o/f


# ============================== START HAGGLE VARIABLES ============================
	setVar $overhagglemultiple 	147
	setVar $cyclebuffer 		1
	setVar $cyclebufferlimit 	20
# ============================== END HAGGLE VARIABLES ============================


	send "@"
	waitOn "Average Interval Lag:"
	gosub :quikstats
	setVar $startingLocation $CURRENT_PROMPT
	
	setVar $output ""
	setVar $equiprounds 0
	setVar $orgrounds 0
	setVar $fuelrounds 0
	if ($buydownRoundsFromParam <= 0)
		setVar $buydownRoundsFromParam 999999
	end   
	if ($buytype = "w")
			setVar $buydown_mode 3
	elseif ($buytype = "b")
			setVar $buydown_mode 2
	else 
		setVar $buydown_mode 1
	end
	if ($buyobject = "e")
		setVar $buydown_equiprounds $buydownRoundsFromParam
		setVar $buydown_orgrounds 0
		setVar $buydown_fuelrounds 0
	elseif ($buyobject = "o")
		setVar $buydown_equiprounds 0
		setVar $buydown_orgrounds $buydownRoundsFromParam
		setVar $buydown_fuelrounds 0
	elseif ($buyobject = "f")
		setVar $buydown_equiprounds 0
		setVar $buydown_orgrounds 0
		setVar $buydown_fuelrounds $buydownRoundsFromParam
	else
		setVar $exit_message "Please use format buy [type] {speed} {#cycles} {override}*"
		return
	end

	if ($startingLocation = "Citadel")
		send "Q"
	end
	send "t n l 1* t n l 2* t n l 3* s n l1*"
	waitOn "How many groups of Colonists do you want to leave"
	gosub :PLANET~getPlanetinfo
	if ($startingLocation = "Citadel")
		send "C s* "
	else
		send "Q D"
	end
	gosub :getinfo
	if ($TOTAL_HOLDS <> $EMPTY_HOLDS)
		if ($startingLocation <> "Citadel")
			gosub :PLANET~landingSub
		end
		setVar $SWITCHBOARD~message "Planet full, cannot empty ship holds*"
		gosub :SWITCHBOARD~switchboard
		goto :buydownExit
	end
	gosub :voidAdjacent
	gosub :getPortInfo
	if ($validPortFound <> TRUE)
		echo "*No valid port found*"
		if ($startingLocation <> "Citadel")
			gosub :PLANET~landingSub
		end
		gosub :clearAdjacent
		goto :buydownExit   
	end
	if ($startingLocation = "Citadel")
		send "Q"
	else
		send "L " & $PLANET~PLANET & "* "
	end
	setDelayTrigger initpause :initpause 500
	pause

:initpause


:getinputs
	setVar $turns_needed 0
		setVar $turns_allowed $TURNS
		subtract $turns_allowed 1

	# --- calculate how much fuel we can buy
	if ($buydown_fuelrounds > 0)
		setVar $fuelrounds 0
		setVar $planetfuelroom $PLANET~PLANET_FUEL_MAX
		subtract $planetfuelroom $PLANET~PLANET_FUEL
		setVar $maxfueltobuy $fuelselling
		if ($fuelselling > $planetfuelroom)
			setVar $maxfueltobuy $planetfuelroom
		end
		setVar $maxfuelrounds $maxfueltobuy
		divide $maxfuelrounds $TOTAL_HOLDS
		if ($maxfuelrounds > $turns_allowed)
			setVar $maxfuelrounds $turns_allowed
		end
		if ($maxfuelrounds > $buydown_fuelrounds)
				setVar $maxfuelrounds $buydown_fuelrounds
		end
		if ($maxfuelrounds > 0)
			setVar $fuelrounds $maxfuelrounds
		end
		add $turns_needed $fuelrounds
		subtract $turns_allowed $fuelrounds
	end
		# --- calculate how much org we can buy
		if ($buydown_orgrounds > 0)
		setVar $orgrounds 0
			setVar $planetorgroom $PLANET~PLANET_ORGANICS_MAX
			subtract $planetorgroom $PLANET~PLANET_ORGANICS
			setVar $maxorgtobuy $orgselling
			if ($orgselling > $planetorgroom)
				setVar $maxorgtobuy $planetorgroom
			end
			setVar $maxorgrounds $maxorgtobuy
			divide $maxorgrounds $TOTAL_HOLDS
			if ($maxorgrounds > $turns_allowed)
				setVar $maxorgrounds $turns_allowed
			end
			if ($maxorgrounds > $buydown_orgrounds)
				setVar $maxorgrounds $buydown_orgrounds
			end
			if ($maxorgrounds > 0)
				setVar $orgrounds $maxorgrounds
			end
		add $turns_needed $orgrounds
			subtract $turns_allowed $orgrounds
		end 
		# --- calculate how much equip we can buy
		if ($buydown_equiprounds > 0)
		setVar $equiprounds 0
			setVar $planetequiproom $PLANET~PLANET_EQUIPMENT_MAX
			subtract $planetequiproom $PLANET~PLANET_EQUIPMENT
			setVar $maxequiptobuy $equipselling
			if ($equipselling > $planetequiproom)
				setVar $maxequiptobuy $planetequiproom
			end
			setVar $maxequiprounds $maxequiptobuy
			divide $maxequiprounds $TOTAL_HOLDS
			if ($maxequiprounds > $turns_allowed)
			setVar $maxequiprounds $turns_allowed
			end
			if ($maxequiprounds > $buydown_equiprounds)
				setVar $maxequiprounds $buydown_equiprounds
			end
			if ($maxequiprounds > 0)
				setVar $equiprounds $maxequiprounds
			end
		add $turns_needed $equiprounds
			subtract $turns_allowed $equiprounds
		end
		if (($fuelrounds = 0) and ($orgrounds = 0) and ($equiprounds = 0))
			if ($startingLocation = "Citadel")
					send "C "
			else
				send "q "
		end
			echo "*Nothing to buy*"
		gosub :clearAdjacent
			goto :buydownExit
		end

		:getMode
			if ($buydown_mode = 1)
				setVar $buydown_mode "Speedbuy"
			elseif ($buydown_mode = 2)
				setVar $buydown_mode "Best Price"
			elseif ($buydown_mode = 3)
				setVar $buydown_mode "Worst Price"
			end
			setVar $fuelroundsleft $fuelrounds
			setVar $orgroundsleft $orgrounds
			setVar $equiproundsleft $equiprounds
		setVar $fuel_creds_needed 0
		setVar $org_creds_needed 0
		setVar $equip_creds_needed 0

		# determine how much this will all cost, and get credits from citadel if needed
			if ($fuelrounds > 0)
					setVar $fuel_creds_needed $fuelrounds
					multiply $fuel_creds_needed $TOTAL_HOLDS
					multiply $fuel_creds_needed 30
					if ($buydown_mode = "Worst Price")
						multiply $fuel_creds_needed 3
						divide $fuel_creds_needed 2
					end
			end
	if ($orgrounds > 0)
			setVar $org_creds_needed $orgrounds
			multiply $org_creds_needed $TOTAL_HOLDS
			multiply $org_creds_needed 60
			if ($buydown_mode = "Worst Price")
				multiply $org_creds_needed 3
				divide $org_creds_needed 2
			end
	end
	if ($equiprounds > 0)
			setVar $equip_creds_needed $equiprounds
			multiply $equip_creds_needed $TOTAL_HOLDS
			multiply $equip_creds_needed 100
			if ($buydown_mode = "Worst Price")
				multiply $equip_creds_needed 3
				divide $equip_creds_needed 2
			end
	end
	setVar $total_creds_needed 0
	add $total_creds_needed $fuel_creds_needed
	add $total_creds_needed $org_creds_needed
	add $total_creds_needed $equip_creds_needed
	setVar $startingCredits $CREDITS
	if ($total_creds_needed > $CREDITS)
			setVar $cashonhand $PLANET~CITADEL_CREDITS
			add $cashonhand $CREDITS
			if ($cashonhand > $total_creds_needed)
				send "C"
				send "T T " & $CREDITS & "* "
				send "T F " & $total_creds_needed & "* "
				setVar $CREDITS $total_creds_needed
				send "Q"
			else
				if ($startingLocation = "Citadel")
						send "C "
				else
					send "q "
			end
				setVar $exit_message "Not enough cash onhand"
			gosub :clearAdjacent
				goto :buydownExit
			end
	end
	setVar $init_credits $CREDITS

:buydownequip
	if ($equiproundsleft > 0)
			send "Q P T  "
			if ($fuelselling > 0)
					send "0* "
			end
			if ($orgselling > 0)
					send "0*"
			end
			gosub :choosehaggle
			send "L " & $PLANET~PLANET & "* t n l 3* "
			subtract $equiproundsleft 1
			goto :buydownequip
		end
		if ($equiprounds > 0)
			if ($buydown_mode = "Worst Price")
					setVar $output $output & " - Equipment overhaggled at " & $overhagglemultiple & "*"
			end
		end

:buydownorg
		if ($orgroundsleft > 0)
			send "Q P T  "
			if ($fuelselling > 0)
					send "0*"
			end
			gosub :choosehaggle
			send "0* L " & $PLANET~PLANET & "* t n l 2* "
			subtract $orgroundsleft 1
			goto :buydownorg
		end
		if ($orgrounds > 0)
			if ($buydown_mode = "Worst Price")
				setVar $output $output & " - Organics overhaggled at " & $overhagglemultiple & "*"
			end
		end

:buydownfuel
		if ($fuelroundsleft > 0)
			send "Q P T "
			gosub :choosehaggle
			send "0* 0* L " & $PLANET~PLANET & "* t n l 1* "
			subtract $fuelroundsleft 1
			goto :buydownfuel
		end
		if ($fuelrounds > 0)
			if ($buydown_mode = "Worst Price")
					setVar $output $output & " - Fuel Ore overhaggled at " & $overhagglemultiple & "*"
			end
		end

:buydownFinish
		if ($startingLocation = "Citadel")
			send "C "
		end
		gosub :getinfo
		setVar $credits_spent $init_credits
		subtract $credits_spent $CREDITS
		gosub :clearAdjacent
		if ($startingLocation = "Planet")
			send "L " & $PLANET~PLANET & "* "
		end
		if ($CREDITS > $startingCredits)
			if ($startingLocation = "Citadel")
				send "T T " & ($CREDITS-$startingCredits) & "* "
			end
		end
		setVar $exit_message "Normal Exit"

	:buydownExit
			return

#==================================   END BUY DOWN (BUY) SUB  ========================================

# ======================     START BUYING SUBROUTINES     =================
# ----- SUB :choosehaggle
:choosehaggle
	if ($buydown_mode = "Speedbuy")
		gosub :buynohaggle
	else
		gosub :buyhaggle
	end
	return


# ----- SUB :buyhaggle
:buyhaggle
	killtrigger buyfirstoffer

	setVar $empty $TOTAL_HOLDS
	send "*"
	setTextLineTrigger buyfirstoffer :buyfirstoffer "We'll sell them for"
	pause

	:buyfirstoffer
		gosub :killbuytriggers
		getWord CURRENTLINE $offer 5
		striptext $offer ","

		gosub :swathoff
		if ($swathoff = 0)
			send "L " & $PLANET~PLANET & "* "
		if ($startingLocation = "Citadel")
			send "C "
		end
			setVar $exit_message $swathOffMessage
			goto :buydownExit
		end


		setVar $counter $offer
		if ($buydown_mode = "Best Price")
			multiply $counter 92
			divide $counter 100
		elseif ($buydown_mode = "Worst Price")
			multiply $counter $overhagglemultiple
			divide $counter 100
		end
		send $counter & "*"
	:buyofferloop
		setTextLineTrigger buyprice :buyprice "We'll sell them for"
		setTextLineTrigger buyfinaloffer :buyfinaloffer "Our final offer"
		setTextLineTrigger buynotinterested :buynotinterested "We're not interested."
		setTextLineTrigger buyexperience :buyexperience "experience point(s)"
		setTextLineTrigger buyempty :buyempty "empty cargo holds"
		setTextLineTrigger buyscrewup1 :buyscrewup "Get real ion-brain, make me a real offer."
		setTextLineTrigger buyscrewup2 :buyscrewup "This is the big leagues Jr.  Make a real offer."
		setTextLineTrigger buyscrewup3 :buyscrewup "My patience grows short with you."
		setTextLineTrigger buyscrewup4 :buyscrewup "I have much better things to do than waste my time.  Try again."
		setTextLineTrigger buyscrewup5 :buyscrewup "HA! HA, ha hahahhah hehehe hhhohhohohohh!  You choke me up!"
		setTextLineTrigger buyscrewup6 :buyscrewup "Quit playing around, you're wasting my time!"
		setTextLineTrigger buyscrewup7 :buyscrewup "Make a real offer or get the "
		setTextLineTrigger buyscrewup8 :buyscrewup "WHAT?!@!? you must be crazy!"
		setTextLineTrigger buyscrewup9 :buyscrewup "So, you think I'm as stupid as you look? Make a real offer."
		setTextLineTrigger buyscrewup10 :buyscrewup "What do you take me for, a fool?  Make a real offer!"
		pause
		pause
	:buyscrewup
		gosub :killbuytriggers
		if ($buydown_mode = "Best Price")
			multiply $counter 102
			divide $counter 100
		elseif ($buydown_mode = "Worst Price")
			subtract $overhagglemultiple 1
			setVar $counter $offer
			multiply $counter $overhagglemultiple
			divide $counter 100
		end
		send $counter & "*"
		goto :buyofferloop
	:buyprice
		gosub :killbuytriggers
		setVar $old_offer $offer
		setVar $old_counter $counter
		getWord CURRENTLINE $offer 5
		striptext $offer ","
		setVar $offer_pct $offer
		multiply $offer_pct 1000
		divide $offer_pct $old_offer
		if ($offer_pct > 990)
			setVar $offer_pct 990
		end
		multiply $counter 1000
		divide $counter $offer_pct
		if ($counter <= $old_counter)
			add $counter 1
		end
		send $counter & "*"
		goto :buyofferloop
	:buyfinaloffer
		gosub :killbuytriggers
		setVar $old_offer $offer
		setVar $old_counter $counter
		getWord CURRENTLINE $offer 5
		striptext $offer ","
		setVar $offer_change $offer
		subtract $offer_change $old_offer
		subtract $offer_change 1
		multiply $offer_change 25
		divide $offer_change 10
		subtract $counter $offer_change
		if ($counter = $old_counter)
			add $counter 1
		end
		add $counter 1
		send $counter & "*"
		goto :buyofferloop
	:buynotinterested
		gosub :killbuytriggers
		send "0* "
		send "0* "
		goto :buyhagglefailed
	:buyexperience
		gosub :killbuytriggers
		getWord CURRENTLINE $exp_bonus 7
		add $exp $exp_bonus
		add $jetbonus $exp_bonus
		goto :buyofferloop
	:buyempty
		gosub :killbuytriggers
		getWord CURRENTLINE $CREDITS 3
		stripText $CREDITS ","
		setVar $oldempty $empty
		getWord CURRENTLINE $empty 6
		if ($oldempty = $empty)
			goto :buyhagglefailed
		else
			goto :buyhagglesucceeded
		end
	:buyhagglefailed
		setVar $buyhaggle 0
		return
	:buyhagglesucceeded
		setVar $buyhaggle 1
		return


# ----- SUB :buynohaggle
:buynohaggle
	if ($swathoff = 0)

		waitOn "How many holds of"
		send "*"
		gosub :swathoff
		send "*"
	else
		send "**"
	end
	setVar $cyclebufferlimit    20
	add $cyclebuffer 1
	if ($cyclebuffer = $cyclebufferlimit)
		setVar $cyclebuffer 1
		send "/"
		waitOn " Sect "
	end
	return


:killbuytriggers
	killtrigger buyprice 
	killtrigger buyfinaloffer 
	killtrigger buynotinterested 
	killtrigger buyexperience 
	killtrigger buyempty 
	killtrigger buyscrewup1 
	killtrigger buyscrewup2 
	killtrigger buyscrewup3 
	killtrigger buyscrewup4 
	killtrigger buyscrewup5 
	killtrigger buyscrewup6 
	killtrigger buyscrewup7 
	killtrigger buyscrewup8 
	killtrigger buyscrewup9 
	killtrigger buyscrewup10 
return

include "source\bot_includes\player\swathoff\player"
include "source\bot_includes\player\clearadjacent\player"
include "source\bot_includes\player\voidadjacent\player"
include "source\bot_includes\player\getportinfo\player"
include "source\bot_includes\player\getinfo\player"
include "source\bot_includes\planet\landingsub\planet"

