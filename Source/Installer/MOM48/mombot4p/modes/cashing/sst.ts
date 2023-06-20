

:load_variables
	loadVar $switchboard~bot_name
	loadVar $bot~user_command_line
	loadvar $PLAYER~unlimitedGame
	loadvar $bot~subspace

	gosub :BOT~loadVars
	loadvar $bot~subspace
			
	loadVar $BOT~bot_turn_limit
	loadVar $GAME~steal_factor
	
	setVar $BOT~help[1] $BOT~tab&" sst {resetlra} [ship1] [ship2] {jet} {resetlra}"
	setVar $BOT~help[2] $BOT~tab&"  - Do NOT need to start in Ship 1 or Ship 2."
	setVar $BOT~help[3] $BOT~tab&"  - First Steal will be from Ship 1."
	setVar $BOT~help[4] $BOT~tab&"  - Checks last rob and busts from Sec Params"
	setVar $BOT~help[5] $BOT~tab&"  - {jet} will mega jet product for extra experience "
	setVar $BOT~help[6] $BOT~tab&"          but will stop at mulitplier of 300 holds. "
	setVar $BOT~help[7] $BOT~tab&"  - {resetlra} will reset last rob sector and exit"
	setVar $BOT~help[8] $BOT~tab&"  - Will use EP Haggle if running in bot"
	setVar $BOT~help[9] $BOT~tab&"  - Created by Cherokee"
	gosub :bot~helpfile

	setVar $BOT~script_title "SST and JET"
	gosub :BOT~banner

	if ($bot~parm1 = "resetlra")
		setSectorParameter 1 "LRA" 1
		send "'Last rob sector reset*"
		halt
	end

	isNumber $test $bot~parm1
	IF ($test)
	ELSE
		setVar $SWITCHBOARD~message "Ship 1 Must Be a Number.*"
		gosub :switchboard~switchboard
		HALT
	END
	isNumber $test $bot~parm2
	IF ($test)
	ELSE
		setVar $SWITCHBOARD~message "Ship 2 Must Be a Number.*"
		gosub :switchboard~switchboard
		HALT
	END
	setVar $ship_1 $bot~parm1
	setVar $ship_2 $bot~parm2
	setVar $steal_divisor $GAME~steal_factor

	
	IF ($bot~parm3 = "jet")
			setVar $jet "y"
	END

	IF ($bot~parm4 = "jet")
			setVar $jet "y"
	END
	gosub :player~isEpHaggle
	if ($player~isEphaggle)
		setVar $ephaggle "y"
		setVar $SWITCHBOARD~message "Using EP HAGGLE!*"
		gosub :switchboard~switchboard
	else
		setVar $epHaggleFail 0
		setVar $ephaggle "n"
	END
	
	if ($steal_divisor = 0)
		setVar $steal_divisor 21
		send "'No Steal divisor, assuming 21. Bot needs to refresh perhaps?*"

	end

getSectorParameter	1 "LRA" $last_rob_attempt
	
# ----- make sure we are at a good prompt -----


:verifyprompt
		gosub :player~quikstats
		
		setVar $location $player~current_prompt
		IF ($location <> "Command")
			   send "'{" $switchboard~bot_name "} - Must start at Command Prompt for SST*"
			   halt
		END

	send "czq"
	waitOn "-----------------------------------------------------------------------------"
	settextlinetrigger     shipnumber     :getshipnumber "Corp"
	settextlinetrigger     doneships      :doneships "Computer command ["
	pause

	:getshipnumber
	getword CURRENTLINE $shiptest 1
	getword CURRENTLINE $shiplocation 2
	isNumber $is_a_number $shiplocation
	if ($is_a_number)
	    if ($ship_1 = $shiptest)
		if ($shiplocation = $last_rob_attempt)
		    setVar $temp $ship_1
		    setVar $ship_1 $ship_2
		    setVar $ship_2 $temp 
		    goto :doneships
		end
	     end
	end
	settextlinetrigger     shipnumber     :getshipnumber "Corp"
	pause
 :doneships
killalltriggers

:verifyship
		IF ($player~ship_number <> $ship_1)
			send "x " $ship_1 "* q z n"
		END
		gosub :player~quikstats
		IF ($player~ship_number <> $ship_1)
			send "'{" $switchboard~bot_name "} - Cannot Xport to Ship 1.  Check Xport Range.  Halting.*"
			HALT
		END
logging off

gosub :startCNsettings

send "CZQ"
waitfor "Command [TL="
setDelayTrigger shipdispwait :shipdispwait 750
pause
pause
:shipdispwait

# ----- INIT VARIABLES
setVar $jetholds 10
setVar $jetholdsore 10
setVar $jetholdsorg 5
setVar $jetbonus 0
setVar $jetcost 0
setVar $current_ship $ship_1
setVar $low_turns "NO"
setVar $skip_ships "NO"

setVar $debugdelay 0
setvar $sec1void 0
setvar $sec2void 0

:init

# ----- SHIP 1 INIT
	gosub :getInfo
	setVar $init_credits $player~credits
	setVar $init_exp $exp
	setVar $init_turns $player~turns
	send "'{" $switchboard~bot_name "} - Starting SST"
	


	if ($jet = "y")
		send "+JET"
	end
	send " with " & $init_credits & " credits and " & $init_exp & " experience.*"
	gosub :player~quikstats

	

	send "'{" $switchboard~bot_name "} - last rob attempt: "&$last_rob_attempt&"*"
	if ($last_rob_attempt = $player~current_sector)
		send "'{" $switchboard~bot_name "} - last rob attempt is this sector! HAlting*"
		gosub :endCNsettings
		gosub :clearadjacent
		halt
	end
	gosub :voidAdjacent

	getSectorParameter $player~current_sector "BUSTED" $bustthissec
	if ($bustthissec = TRUE)
		send "'{" $switchboard~bot_name "} - According to my data i've busted here - ending*"
		gosub :clearadjacent
		gosub :endCNsettings
		halt
	end
	
	gosub :checkPort
	gosub :cleanShip
	gosub :steal
	gosub :xport

# ----- SHIP 2 INIT
	gosub :getInfo
	gosub :voidAdjacent
	setvar $sec2void 1
	getSectorParameter $player~current_sector "BUSTED" $bustthissec
	if ($bustthissec = TRUE)
		send "'{" $switchboard~bot_name "} - According to my data i've busted here - ending*"
		 gosub :endCNsettings
		 gosub :clearadjacent
		halt
	end

	gosub :checkPort
	gosub :cleanShip
	gosub :steal
	gosub :xport

setVar $skip_ships "YES"

# ----- MAIN PROGRAM LOOP
:sstLoop
	gosub :sell
	gosub :steal
	gosub :xport
	if ($player~turns > 29)
		goto :sstLoop
	else
		send "'{" $switchboard~bot_name "} - Low Turns, Halting Script*"
		setVar $low_turns "YES"
		goto :finish
	end


# ----- FINISH
:finish
	
	gosub :clearadjacent

	setVar $player~turns_used $init_turns
	subtract $player~turns_used $player~turns
	gosub :player~quikstats

	setVar $cash_made ($player~CREDITS - $init_credits)
	setVar $exp_made $player~experience
	subtract $exp_made $init_exp
	gosub :endCNsettings
	send "'*{" $switchboard~bot_name "} -*"
	IF ($PLAYER~unlimitedGame)
			send "I made " & $cash_made & " credits and " & $exp_made & " experience.*"
	ELSE
			send "I made " & $cash_made & " credits and " & $exp_made & " experience.*"
	END
	IF ($jet = "y")
			send "I made an extra " & $jetbonus & " experience at a cost of " & $jetcost & " credits.*"
	END
	send "Ship " & $ship_1 & "'s equip multiple was " & $port[$ship_1].multiple & ".*"
	send "Ship " & $ship_2 & "'s equip multiple was " & $port[$ship_2].multiple & ".*"
	gosub :player~quikstats
	if ($low_turns <> "YES")
		#send "Busted in ship " & $current_ship & ".**"
	send "Busted in ship " & $current_ship & ", FURB please, I still have " & $player~turns & " turns to run.**"

	end
	halt



# ----- SUB :getInfo
:getInfo
	send "I"
	waitfor "<Info>"
	:waitForInfo
		setTextLineTrigger getExpAndAlign :getExpAndAlign "Rank and Exp"
		setTextLineTrigger getTurns :getTurns "Turns left"
		setTextLineTrigger getHolds :getHolds "Total Holds"
		setTextLineTrigger getCredits :getCredits "Credits"
		setTextTrigger getInfoDone :getInfoDone "Command [TL="
		pause
		pause
	:getExpAndAlign
		killAllTriggers
		getWord CURRENTLINE $exp 5
		getWord CURRENTLINE $align 7
		stripText $exp ","
		stripText $align ","
		stripText $align "Alignment="
		goto :waitForInfo
	:getTurns
		killAllTriggers
		getWord CURRENTLINE $player~turns 4
		if ($player~turns = "Unlimited")
			setVar $player~turns 65535
		end
		goto :waitForInfo
	:getHolds
		killAllTriggers
		setVar $line CURRENTLINE
		getWord $line $holds[$current_ship] 4
		getWordPos $line $textpos "Ore="
		if ($textpos <> 0)
			cutText CURRENTLINE $temp $textpos 100
			getWord $temp $ore[$current_ship] 1
			stripText $ore[$current_ship] "Ore="
		else
			setVar $ore[$current_ship] 0
		end
		getWordPos $line $textpos "Organics="
		if ($textpos <> 0)
			cutText CURRENTLINE $temp $textpos 100
			getWord $temp $org[$current_ship] 1
			stripText $org[$current_ship] "Organics="
		else
			setVar $org[$current_ship] 0
		end
		getWordPos $line $textpos "Equipment="
		if ($textpos <> 0)
			cutText CURRENTLINE $temp $textpos 100
			getWord $temp $equ[$current_ship] 1
			stripText $equ[$current_ship] "Equipment="
		else
			setVar $equ[$current_ship] 0
		end
		getWordPos $line $textpos "Colonists="
		if ($textpos <> 0)
			cutText CURRENTLINE $temp $textpos 100
			getWord $temp $col[$current_ship] 1
			stripText $col[$current_ship] "Colonists="
		else
			setVar $col[$current_ship] 0
		end
		getWordPos $line $textpos "Empty="
		if ($textpos <> 0)
			cutText CURRENTLINE $temp $textpos 100
			getWord $temp $emp[$current_ship] 1
			stripText $emp[$current_ship] "Empty="
		else
			setVar $emp[$current_ship] 0
		end
		goto :waitForInfo
	:getCredits
		killAllTriggers
		getWord CURRENTLINE $player~credits 3
		stripText $player~credits ","
		goto :waitForInfo
	:getInfoDone
		killalltriggers
		return


# ----- SUB :checkPort
:checkPort
	send "D"
	waitfor "<Re-Display>"
	setTextLineTrigger getPort :getPort "Ports   :"
	setTextLineTrigger noport :noport "Command [TL="
	pause
	pause
	:getPort
		killalltriggers
		getText CURRENTLINE $port[$current_ship] ", Class " " ("
		if ($port[$current_ship] <> 2) and ($port[$current_ship] <> 3) and ($port[$current_ship] <> 4) and ($port[$current_ship] <> 8)
			send "'{" $switchboard~bot_name "} - This is not an equipment buying port, you can't SST here!*"
		 gosub :endCNsettings
		 gosub :clearadjacent
			halt
		else
			setVar $port[$current_ship].multiple 110
			setVar $port[$current_ship].maxmultiple 0
			send "CR*Q"
				:getSelling
				if ($port[$current_ship] = 3) or ($port[$current_ship] = 4)
					setTextLineTrigger getOreSelling :getOreSelling "Fuel Ore   Selling"
				else
					setVar $port[$current_ship].ore_selling 0
			
				end
				if ($port[$current_ship] = 2) or ($port[$current_ship] = 4)
					setTextLineTrigger getOrgSelling :getOrgSelling "Organics   Selling"
				else
					setVar $port[$current_ship].org_selling 0
		   
				end
				setTextLineTrigger getEquOnPort :getEquOnPort "Equipment  Buying"
				pause
				pause
				:getOreSelling
					killalltriggers
					getWord CURRENTLINE $port[$current_ship].ore_selling 4
			if ($port[$current_ship].ore_selling = 0)
			send "o 1 1 * q"
			setVar $port[$current_ship].ore_selling 10
			end
					goto :getSelling
				:getOrgSelling
					killalltriggers
					getWord CURRENTLINE $port[$current_ship].org_selling 3
			if ($port[$current_ship].org_selling = 0)
			 send "o 2 1 * q"
			setVar $port[$current_ship].org_selling 10
			end
					goto :getSelling
				:getEquOnPort
					killalltriggers
					getWord CURRENTLINE $port[$current_ship].equ_amount 3
					getWord CURRENTLINE $port[$current_ship].equ_pct 4
					stripText $port[$current_ship].equ_pct "%"
					setVar $port[$current_ship].equ_max $port[$current_ship].equ_amount
					multiply $port[$current_ship].equ_max 100
					divide $port[$current_ship].equ_max $port[$current_ship].equ_pct
					setVar $port[$current_ship].equ_on_dock $port[$current_ship].equ_max
					subtract $port[$current_ship].equ_on_dock $port[$current_ship].equ_amount

					setVar $steal_holds $exp
					divide $steal_holds $steal_divisor
					if ($steal_holds < 10)
						send "'{" $switchboard~bot_name "} - You need more experience to SST!!!*"
			 gosub :endCNsettings
			 gosub :clearadjacent
						halt
					elseif ($holds[$current_ship] < 10)
						send "'{" $switchboard~bot_name "} - You need more cargo holds to SST!!!*"
			 gosub :endCNsettings
			gosub :clearadjacent
						halt
					end
					if ($steal_holds > $holds[$current_ship])
						setVar $steal_holds $holds[$current_ship]
					end

					setVar $temp $equ[current_ship]
					add $temp $port[$current_ship].equ_on_dock
					if ($steal_holds > $temp)
						setVar $upgrade_amount $steal_holds
						subtract $upgrade_amount $port[$current_ship].equ_on_dock
						subtract $upgrade_amount $equ[$current_ship]
						divide $upgrade_amount 10
						add $upgrade_amount 1
						setVar $cash_needed $upgrade_amount
						multiply $cash_needed 900
						if ($player~credits >= $cash_needed)
							send "o  3" & $upgrade_amount & "**"
						else
							send "'{" $switchboard~bot_name "} - Not enough credits on hand to upgrade the port.*"
			 gosub :endCNsettings
				gosub :clearadjacent
							halt
						end
						setVar $upgrade_amount 0
					end

			return
		end
	:noport
		killalltriggers
		send "'{" $switchboard~bot_name "} - There is no port, you can't SST here!*"
	 gosub :endCNsettings
		 gosub :clearadjacent
		halt


# ----- SUB :cleanShip
:cleanShip

	# BSB
	if ($port[$current_ship] = 2)
		if ($ore[$current_ship] <> 0) or ($equ[$current_ship] <> 0)
			subtract $player~turns 1
			send "PT"
			if ($ore[$current_ship] <> 0)
		gosub :cleansell
			end
			if ($equ[$current_ship] <> 0)
				gosub :cleansell
			end
			send "0*"
		else
			echo "**no need to port**"
		end

	# SBB
	elseif ($port[$current_ship] = 3)
		if ($org[$current_ship] <> 0) or ($equ[$current_ship] <> 0)
			subtract $player~turns 1
			send "PT"
			if ($org[$current_ship] <> 0)
				gosub :cleansell
			end
			if ($equ[$current_ship] <> 0)
				gosub :cleansell
			end
			send "0*"
		end

	# SSB
	elseif ($port[$current_ship] = 4)
		if ($equ[$current_ship] <> 0)
			subtract $player~turns 1
			send "PT"
		if ($equ[$current_ship] <> 0)
				gosub :cleansell
			end
		send "0*0*"
		end

	# BBB
	elseif ($port[$current_ship] = 8)
		if ($ore[$current_ship] <> 0) or ($org[$current_ship] <> 0) or ($equ[$current_ship] <> 0)
			subtract $player~turns 1
			send "PT"
			if ($ore[$current_ship] <> 0)
			   gosub :cleansell
			end
			if ($org[$current_ship] <> 0)
			   gosub :cleansell
			end
			if ($equ[$current_ship] <> 0)
			   gosub  :cleansell
			end
		end

	# not equ buyer
	else
		echo "**badport**"
	 gosub :endCNsettings
		 gosub :clearadjacent
		halt
	end

	gosub :checkEPHaggle

	send "JY"
	setVar $emp[$current_ship] $holds[$current_ship]
	setVar $ore[$current_ship] 0
	setVar $org[$current_ship] 0
	setVar $equ[$current_ship] 0
	setVar $col[$current_ship] 0
	setVar $sell_failures[$current_ship] 0
	waitFor "Are you sure you want to jettison"
	return

:cleansell
	if ($epHaggleFail = 1)
		send "**"
		return
	end
	if ($ephaggle = "y")
		waitfor "We are buying up to "
		send "*"
		setTextLineTrigger sellempty2 :sellempty2 "empty cargo holds"
		setDelayTrigger epsellwait2 :epsellwait2 7000
		pause
		:epsellwait2
			killalltriggers
			send "'{" $switchboard~bot_name "} - Ep Haggle timed out on equipment Haggle*"
			send "'{" $switchboard~bot_name "} - Ep Haggle Disabled and bot will exit at end of cycle.*"
			setvar $ephaggle "n"
			setVar $epHaggleFail 1
			send "*"
		
		:sellempty2
			killalltriggers
	else
		send "**"
	end

return
# ----- SUB :sell
:sell
	if ($equ[$current_ship] > 0)
		subtract $player~turns 1
	
	killalltriggers
		send "PT"
	if ($ephaggle = "y")
		waitfor "do you want to sell"
		send "*"
		waitfor "Agreed,"
	
		setTextLineTrigger sellempty :sellempty "empty cargo holds"
		setDelayTrigger epsellwait :epsellwait 7000
		pause
		:epsellwait
			killalltriggers
			send "'{" $switchboard~bot_name "} - Ep Haggle timed out on equipment Haggle*"
			send "'{" $switchboard~bot_name "} - Ep Haggle Disabled and bot will exit at end of cycle.*"
			setvar $ephaggle "n"
			setVar $epHaggleFail 1
			send "*"
			goto :sellempty
	end
	:sellhaggle
		send "*"
		setTextLineTrigger sellfirstoffer :sellfirstoffer "We'll buy them for"
		pause
		pause
	:sellfirstoffer
		killalltriggers
		getWord CURRENTLINE $offer 5
		striptext $offer ","
		setVar $counter $offer
		multiply $counter $port[$current_ship].multiple
		divide $counter 100
		send $counter & "*"
	:sellofferloop
		setTextLineTrigger sellprice :sellprice "We'll buy them for"
		setTextLineTrigger sellfinaloffer :sellfinaloffer "Our final offer"
		setTextLineTrigger sellnotinterested :sellnotinterested "We're not interested."
		setTextLineTrigger sellexperience :sellexperience "experience point(s)"
		setTextLineTrigger sellempty :sellempty "empty cargo holds"

		setTextLineTrigger sellscrewup1 :sellscrewup "Get real ion-brain, make me a real offer."
		setTextLineTrigger sellscrewup2 :sellscrewup "This is the big leagues Jr.  Make a real offer."
		setTextLineTrigger sellscrewup3 :sellscrewup "My patience grows short with you."
		setTextLineTrigger sellscrewup4 :sellscrewup "I have much better things to do than waste my time.  Try again."
		setTextLineTrigger sellscrewup5 :sellscrewup "HA! HA, ha hahahhah hehehe hhhohhohohohh!  You choke me up!"
		setTextLineTrigger sellscrewup6 :sellscrewup "Quit playing around, you're wasting my time!"
		setTextLineTrigger sellscrewup7 :sellscrewup "Make a real offer or get the h*ll out of here!"
		setTextLineTrigger sellscrewup8 :sellscrewup "WHAT?!@!? you must be crazy!"
		setTextLineTrigger sellscrewup9 :sellscrewup "So, you think I'm as stupid as you look? Make a real offer."
		setTextLineTrigger sellscrewup10 :sellscrewup "What do you take me for, a fool?  Make a real offer!"
		pause
		pause
	:sellscrewup
		killalltriggers
		multiply $counter 98
		divide $counter 100
		send $counter & "*"
		goto :sellofferloop
	:sellprice
		killalltriggers
		setVar $old_offer $offer
		setVar $old_counter $counter
		getWord CURRENTLINE $offer 5
		striptext $offer ","
		setVar $offer_pct $offer
		multiply $offer_pct 1000
		divide $offer_pct $old_offer
		if ($offer_pct < 1003)
			setVar $offer_pct 1003
		end
		multiply $counter 1000
		divide $counter $offer_pct
		if ($counter >= $old_counter)
			subtract $counter 1
		end
		send $counter & "*"
		goto :sellofferloop
	:sellfinaloffer
		killalltriggers
		setVar $old_offer $offer
		setVar $old_counter $counter
		getWord CURRENTLINE $offer 5
		striptext $offer ","
		setVar $offer_change $offer
		subtract $offer_change $old_offer
		multiply $offer_change 25
		divide $offer_change 10
		subtract $counter $offer_change
		subtract $counter 3
		send $counter & "*"
		goto :sellofferloop
	:sellnotinterested
		killalltriggers
		goto :sellhagglefailed
	:sellexperience
		killalltriggers
		getWord CURRENTLINE $exp_bonus 7
		add $exp $exp_bonus
		goto :sellofferloop
	:sellempty
		killalltriggers
		getWord CURRENTLINE $player~credits 3
		stripText $player~credits ","
		setVar $oldemp[$current_ship] $emp[$current_ship]
		getWord CURRENTLINE $emp[$current_ship] 6
		if ($oldemp[$current_ship] = $emp[$current_ship])
			goto :sellhagglefailed
		else
			goto :sellhagglesucceeded
		end
	:sellhagglefailed
		if ($port[$current_ship] = 2) or ($port[$current_ship] = 3)
			send "0*"
		elseif ($port[$current_ship] = 4)
			send "0*0*"
		end
	gosub :checkEPHaggle

		add $sell_failures[$current_ship] 1
		subtract $port[$current_ship].multiple 1
		setVar $port[$current_ship].maxmultiple $port[$current_ship].multiple
		# send "'Ship " & $current_ship & " multiple decreased to " & $port[$current_ship].multiple & ".*"

		if ($sell_failures[$current_ship] > 5)
			send "'{" $switchboard~bot_name "} - I'm having problems selling my equipment to the port. Script Halting*"
		 gosub :endCNsettings
		 gosub :clearadjacent
			halt
		end
		goto :sell
	:sellhagglesucceeded
		if ($port[$current_ship].maxmultiple = 0)
			add $port[$current_ship].multiple 2
			# send "'Ship " & $current_ship & " multiple increased to " & $port[$current_ship].multiple & ".*"
		end
		if ($jet = "y")
		setVar $doOreUpgrade 0
		setVar $doOrgUpgrade 0

			if ($port[$current_ship] = 3) or ($port[$current_ship] = 4)
				if ($port[$current_ship].ore_selling > $jetholdsore)
					if ($emp[$current_ship] >= $jetholdsore)
			
						send $jetholdsore
						gosub :buyhaggle
						if ($buyhaggle = 1)
							subtract $port[$current_ship].ore_selling $jetholdsore
						end
					else
						send "0*"
					end
				elseif ($port[$current_ship].ore_selling > 0)
			send "'{" $switchboard~bot_name "} - This port is selling little ore, I will upgrade a small amount.*"
			add $port[$current_ship].ore_selling 500
			setVar $doOreUpgrade 1
					send "0*"
				else
					send "'{" $switchboard~bot_name "} - This port is selling 0 ore, I will upgrade a small amount.*"
			add $port[$current_ship].ore_selling 500
			setVar $doOreUpgrade 1
		   
				end
			end
			if ($port[$current_ship] = 2) or ($port[$current_ship] = 4)
				if ($port[$current_ship].org_selling > $jetholdsorg)
					if ($emp[$current_ship] >= $jetholdsorg)
						send $jetholdsorg
						gosub :buyhaggle
						if ($buyhaggle = 1)
							subtract $port[$current_ship].org_selling $jetholdsorg
						end
					else
						send "0*"
					end
				elseif ($port[$current_ship].org_selling > 0)
			send "'{" $switchboard~bot_name "} - This port is selling little org, I will upgrade a small amount.*"
			add $port[$current_ship].org_selling 500
			setVar $doOrgUpgrade 1
					send "0*"
				else
					send "'{" $switchboard~bot_name "} - This port is selling 0 org, I will upgrade a small amount.*"
			add $port[$current_ship].org_selling 500
			setVar $doOrgUpgrade 1
				end
			end
		gosub :checkEPHaggle
		if ($doOreUpgrade = 1)
		setVar $doOreUpgrade 0
		send "o 1 10 *  1 10 *  1 10 *  1 10 *  1 10 * q"
		end
		if ($doOrgUpgrade = 1)
		setVar $doOrgUpgrade 0
		send "o 2 5 *  2 5 *  2 5 *  2 5 *  2 5 *  2 5 *  2 5 *  2 5 *  2 5 *  2 5 * q"
		end
			send "JY"
			setVar $emp[$current_ship] $holds[$current_ship]
			setVar $ore[$current_ship] 0
			setVar $org[$current_ship] 0
			setVar $equ[$current_ship] 0
			setVar $col[$current_ship] 0
		else
		# no jet
			if ($port[$current_ship] = 3) or ($port[$current_ship] = 4)
				if ($port[$current_ship].ore_selling > 0)
					send "0*"
				else
					send "'{" $switchboard~bot_name "} - This port is selling 0 ore, I will upgrade a small amount.*"
			setVar $doOreUpgrade 1
					add $port[$current_ship].ore_selling 10
				end
			end
			if ($port[$current_ship] = 2) or ($port[$current_ship] = 4)
				if ($port[$current_ship].org_selling > 0)
					send "0*"
				else
					send "'{" $switchboard~bot_name "} - This port is selling 0 org, I will upgrade a small amount.*"
			setVar $doOrgUpgrade 1
			add $port[$current_ship].org_selling 10
				end
			end
		if ($doOreUpgrade = 1)
		setVar $doOreUpgrade 0
		send "o 1 1 * q"
		end
		if ($doOrgUpgrade = 1)
		setVar $doOrgUpgrade 0
		send "o 2 1 * q"
		end
			send "JY"
			setVar $emp[$current_ship] $holds[$current_ship]
			setVar $ore[$current_ship] 0
			setVar $org[$current_ship] 0
			setVar $equ[$current_ship] 0
			setVar $col[$current_ship] 0
		end
		return
	else
		send "'{" $switchboard~bot_name "} - There is no equ to sell, something is wrong*"
	 gosub :endCNsettings
		 gosub :clearadjacent
		halt
	end



# ----- SUB :buyhaggle
:buyhaggle
	
	if ($epHaggleFail = 1)
	send "**"
	return
	end
	if ($ephaggle = "y")
		waitfor "do you want to buy"
		send "*"
		waitfor "Agreed,"
		
		setTextLineTrigger buyempty :buyempty "empty cargo holds"
		setDelayTrigger epbuywait :epbuywait 7000
		pause
		:epbuywait
			killalltriggers
			send "'{" $switchboard~bot_name "} - Ep Haggle timed out on product purchase Haggle*"
			send "'{" $switchboard~bot_name "} - Ep Haggle Disabled and bot will exit at end of cycle.*"
			setvar $ephaggle "n"
			setVar $epHaggleFail 1
			send "*"
			goto :buyempty
		
		
	end
	send "*"
	setTextLineTrigger buyfirstoffer :buyfirstoffer "We'll sell them for"
	pause
	pause
	:buyfirstoffer
		killalltriggers
		getWord CURRENTLINE $offer 5
		striptext $offer ","
		setVar $counter $offer
		multiply $counter 92
		divide $counter 100
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
		setTextLineTrigger buyscrewup7 :buyscrewup "Make a real offer or get the h*ll out of here!"
		setTextLineTrigger buyscrewup8 :buyscrewup "WHAT?!@!? you must be crazy!"
		setTextLineTrigger buyscrewup9 :buyscrewup "So, you think I'm as stupid as you look? Make a real offer."
		setTextLineTrigger buyscrewup10 :buyscrewup "What do you take me for, a fool?  Make a real offer!"
		pause
		pause
	:buyscrewup
		killalltriggers
# send "'buyscrewup*"
		multiply $counter 102
		divide $counter 100
		send $counter & "*"
		goto :buyofferloop
	:buyprice
		killalltriggers
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
		killalltriggers
		setVar $old_offer $offer
		setVar $old_counter $counter
		getWord CURRENTLINE $offer 5
		striptext $offer ","
		setVar $offer_change $offer
		subtract $offer_change $old_offer
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
		killalltriggers
		goto :buyhagglefailed
	:buyexperience
		killalltriggers
		getWord CURRENTLINE $exp_bonus 7
		add $exp $exp_bonus
		add $jetbonus $exp_bonus
# send "'buyhagglebonus " & $exp_bonus & "*"
		goto :buyofferloop
	:buyempty
		killalltriggers
		getWord CURRENTLINE $player~credits 3
		stripText $player~credits ","
		setVar $oldemp[$current_ship] $emp[$current_ship]
		getWord CURRENTLINE $emp[$current_ship] 6
		if ($oldemp[$current_ship] = $emp[$current_ship])
			goto :buyhagglefailed
		else
			goto :buyhagglesucceeded
		end
	:buyhagglefailed
# send "'buyhaggle failed*"
		setVar $buyhaggle 0
		return
	:buyhagglesucceeded
		add $jetcost $counter
		setVar $buyhaggle 1
		return




# ----- SUB :steal
:steal
	setVar $steal_holds $exp
	divide $steal_holds $steal_divisor
	if ($steal_holds < 10)
		send "'{" $switchboard~bot_name "} - You need more experience to SST!!!*"
	 gosub :endCNsettings
	gosub :clearadjacent
		halt
	elseif ($holds[$current_ship] < 10)
		send "'{" $switchboard~bot_name "} - You need more cargo holds to SST!!!*"
	 gosub :endCNsettings
	gosub :clearadjacent
		halt
	end
	 if (($steal_holds > 300) and ($jet = "y"))
	send "'{" $switchboard~bot_name "} - We are at " $steal_holds " holds of experience, stopping JET*"
	setVar $jet ""
	 end
	if ($steal_holds > $emp[$current_ship])
		setVar $steal_holds $emp[$current_ship]
	end

	setVar $desired_holds_on_port $steal_holds
	add $desired_holds_on_port 2

	subtract $player~turns 1
	send "PR*SZ3"
	waitfor "furtively about"
	setTextLineTrigger equOnPort :equOnPort "Equipment  Buying"
	setTextLineTrigger fake :fake "Suddenly you're Busted!"
	pause
	pause
	:equOnPort
		killalltriggers
		getWord CURRENTLINE $holds_on_port 4
		if ($holds_on_port < $desired_holds_on_port)
			setVar $upgrade_amount $desired_holds_on_port
			subtract $upgrade_amount $holds_on_port
			divide $upgrade_amount 10
			add $upgrade_amount 1
		else
			setVar $upgrade_amount 0
		end
		if ($holds_on_port  < 10)
			setVar $steal_holds 0
			goto :dothedeed
		elseif ($holds_on_port < $steal_holds)
			setVar $temp $steal_holds
			multiply $temp 10
			divide $temp $holds_on_port
			if ($temp <= 20)
				setVar $steal_holds $holds_on_port
			else
				setVar $steal_holds 0
			end
		end
		:dothedeed
			if ($debugdelay <> 0)
				setdelaytrigger testing :testing $debugdelay
				pause
				pause
			end
			:testing
			send $steal_holds & "*"
			setTextLineTrigger bust :bust "For getting caught"
			setTextLineTrigger nosteal :nosteal "You leave the port"
			setTextLineTrigger good :good "and you receive"
			pause
			pause
			:bust
				killalltriggers
		

		setSectorParameter 1 "LRA" CURRENTSECTOR
		SetVar $ckLRA CURRENTSECTOR
				SaveVar $ckLRA    
		setSectorParameter CURRENTSECTOR "BUSTED" TRUE
		send "'<"&$bot~subspace&">[Busted:"& CURRENTSECTOR "]<"&$bot~subspace&">*"
				gosub :getInfo
				goto :finish
			:fake
				killAllTriggers
		gosub :player~quikstats
		setSectorParameter $player~current_sector "FAKEBUST" TRUE
				send "  "
				send "N  N  *  *"
				send "'{" $switchboard~bot_name "} - FAKE Busted in Ship " & $current_ship & ", need a super furb*"
		gosub :endCNsettings
		 gosub :clearadjacent
				halt
			:good
				killalltriggers

				getWord CURRENTLINE $exp_bonus 4
				add $exp $exp_bonus
				add $equ[$current_ship] $steal_holds
				subtract $emp[$current_ship] $steal_holds
				if ($upgrade_amount <> 0)
					send "o  3" & $upgrade_amount & "**"
				end
		setSectorParameter 1 "LRA" CURRENTSECTOR
		SetVar $ckLRA CURRENTSECTOR
				SaveVar $ckLRA    

				return
			:nosteal
				killalltriggers
				if ($upgrade_amount <> 0)
					send "o  3" & $upgrade_amount & "**"
				end
				goto :steal

:EPHaggle

	waitfor "Agreed,"

	setTextLineTrigger tradeFin :tradeFin "empty cargo holds"
	pause
	:tradeFin
	
return

# ----- SUB :xport
# ----- USED WITHIN MAIN PROGRAM LOOP
:xport
	if ($ship_1 = $current_ship)
		setVar $current_ship $ship_2
	else
		setVar $current_ship $ship_1
	end
	subtract $player~turns 1
	if ($skip_ships = "YES")
		setVar $xportString "X  " & $current_ship & "*  Q"
		send $xportString
		return
	else
		setVar $xportString "X  " & $current_ship & "*Q"
		send $xportString
		setTextLineTrigger noxportship :noxportship "That is not an available ship"
		setTextLineTrigger noxportrange :noxportrange "only has a transport range"
		setTextLineTrigger noxportpassword :noxportpassword "Enter the password for"
		setTextLineTrigger xportsuccess :xportsuccess "Security code accepted"
		pause
		pause
		:noxportship
			killalltriggers
			send "'{" $switchboard~bot_name "} - That is not an available ship, Script Halting.*"
		 gosub :endCNsettings
		 gosub :clearadjacent
			halt
		:noxportrange
			killalltriggers
			send "'{" $switchboard~bot_name "} - Not enough transport range, Script Halting.*"
		 gosub :endCNsettings
		 gosub :clearadjacent
			halt
		:noxportpassword
			killalltriggers
			send "'{" $switchboard~bot_name "} - Transport ship requires a password, Script Halting.*"
		 gosub :endCNsettings
		 gosub :clearadjacent
			halt
		:xportsuccess
			killalltriggers
			return
	end

# ----- SUB: Start CN settings -----
:startCNsettings
	send "CN"

		SetTextLineTrigger ansi0 :ansi0 "(1) ANSI graphics            - Off"
		SetTextLineTrigger ansi1 :ansi1 "(1) ANSI graphics            - On"
		pause

		:ansi0
			killalltriggers
			setVar $cn1 0
			goto :cn1done
		:ansi1
			killalltriggers
			setVar $cn1 1
		:cn1done

		SetTextLineTrigger anim0 :anim0 "(2) Animation display        - Off"
		SetTextLineTrigger anim1 :anim1 "(2) Animation display        - On"
		pause

		:anim0
			killalltriggers
			setVar $cn2 0
			goto :cn2done
		:anim1
			killalltriggers
			setVar $cn2 1
		:cn2done

		SetTextLineTrigger page0 :page0 "(3) Page on messages         - Off"
		SetTextLineTrigger page1 :page1 "(3) Page on messages         - On"
		pause

		:page0
			killalltriggers
			setVar $cn3 0
			goto :cn3done
		:page1
			killalltriggers
			setVar $cn3 1
		:cn3done

		SetTextLineTrigger silence0 :silence0 "(7) Silence ALL messages     - No"
		SetTextLineTrigger silence1 :silence1 "(7) Silence ALL messages     - Yes"
		pause

		:silence0
			killalltriggers
			setVar $cn7 0
			goto :cn7done
		:silence1
			killalltriggers
			setVar $cn7 1
		:cn7done

		SetTextLineTrigger abortdisplay0 :abortdisplay0 "(9) Abort display on keys    - SPACE"
		SetTextLineTrigger abortdisplay1 :abortdisplay1 "(9) Abort display on keys    - ALL KEYS"
		pause

		:abortdisplay0
			killalltriggers
			setVar $cn9 0
			goto :cn9done
		:abortdisplay1
			killalltriggers
			setVar $cn9 1
		:cn9done

		SetTextLineTrigger messagedisplay0 :messagedisplay0 "(A) Message Display Mode     - Compact"
		SetTextLineTrigger messagedisplay1 :messagedisplay1 "(A) Message Display Mode     - Long"
		pause

		:messagedisplay0
			killalltriggers
			setVar $cna 0
			goto :cnadone
		:messagedisplay1
			killalltriggers
			setVar $cna 1
		:cnadone

		SetTextLineTrigger screenpauses0 :screenpauses0 "(B) Screen Pauses            - No"
		SetTextLineTrigger screenpauses1 :screenpauses1 "(B) Screen Pauses            - Yes"
		pause

		:screenpauses0
			killalltriggers
			setVar $cnb 0
			goto :cnbdone
		:screenpauses1
			killalltriggers
			setVar $cnb 1
		:cnbdone

		waitfor "Settings command (?=Help)"
		gosub :sendCNstring
		send "?"
		waitfor "Settings command (?=Help)"
		send "QQ"
		SetTextTrigger subStartCNcontinue1 :subStartCNcontinue "Command [TL="
		SetTextTrigger subStartCNcontinue2 :subStartCNcontinue "Citadel command (?=help)"
		pause
		:subStartCNcontinue
		killalltriggers
		return



# ----- SUB: end CN settings -----
:endCNsettings
	send "CN"
	waitfor "Settings command (?=Help)"
	gosub :sendCNstring
	send "?"
	waitfor "Settings command (?=Help)"
	send "QQ"
	SetTextTrigger subEndCNcontinue1 :subEndCNcontinue "Command [TL="
	SetTextTrigger subEndCNcontinue2 :subEndCNcontinue "Citadel command (?=help)"
	pause
	:subEndCNcontinue
	killalltriggers
	return


# ----- SUB: send CN string -----
:sendCNstring
	if ($cn1 = 0)
		send "1  "
	end
	if ($cn2 = 1)
		send "2  "
	end
	if ($cn3 = 1)
		send "3  "
	end
	if ($cn7 = 1)
		send "7  "
	end
	if ($cn9 = 1)
		send "9  "
	end
	if ($cna = 1)
		send "A  "
	end
	if ($cnb = 1)
		send "B  "
	end
	return

:player~quikstats

		# ============================ START QUIKSTAT VARIABLES ==========================
				setVar $player~current_prompt          "Undefined"
				setVar $player~psychic_probe           "No"
				setVar $player~planet_scanner          "No"
				setVar $player~scan_type               "None"
				setVar $player~current_sector          0
				setVar $player~turns                   0
				setVar $player~credits                 0
				setVar $player~fighters                0
				setVar $player~shields                 0
				setVar $player~total_holds             0
				setVar $player~ore_holds               0
				setVar $player~organic_holds           0
				setVar $player~equipment_holds         0
				setVar $player~colonist_holds          0
				setVar $player~photons                 0
				setVar $player~armids                  0
				setVar $player~limpets                 0
				setVar $player~genesis                 0
				setVar $player~twarp_type              0
				setVar $player~cloaks                  0
				setVar $player~beacons                 0
				setVar $player~atomic                  0
				setVar $player~corbo                   0
				setVar $player~eprobes                 0
				setVar $player~mine_disruptors         0
				setVar $player~alignment               0
				setVar $player~experience              0
				setVar $player~corp                    0
				setVar $player~ship_number             0
				setVar $player~turns_PER_WARP          0
				setVar $COMMAND_PROMPT          "Command"
				setVar $COMPUTER_PROMPT         "Computer"
				setVar $planet~CITADEL_PROMPT          "Citadel"
				setVar $planet~planet_PROMPT           "Planet"
				setVar $player~corpORATE_PROMPT        "Corporate"
				setVar $STARDOCK_PROMPT         "<Stardock>"
				setVar $HARDWARE_PROMPT         "<Hardware"
				setVar $SHIPYARD_PROMPT         "<Shipyard>"
				setVar $TERRA_PROMPT            "Terra"
		# ============================ END QUIKSTAT VARIABLES ==========================

		setVar $player~current_prompt 		"Undefined"
	killtrigger noprompt
	killtrigger prompt1
	killtrigger prompt2
	killtrigger prompt3
	killtrigger prompt4
	killtrigger statlinetrig
	killtrigger getLine2
	setTextLineTrigger 	prompt		:allPrompts	 	#145 & #8
	setTextLineTrigger 	statlinetrig 	:statStart 		#179
	send #145&"/"
	pause

	:allPrompts
		getWord CURRENTLINE $player~current_prompt 1
		stripText $player~current_prompt #145
		stripText $player~current_prompt #8
		#getWord currentansiline $checkPrompt 1
		#getWord currentline $tempPrompt 1
		#getWordPos $checkPrompt $pos "[35m"
		#if ($pos > 0)
		#	setVar $player~current_prompt $tempPrompt
		#end
		setTextLineTrigger 	prompt		:allPrompts	 	#145 & #8
		pause

	:statStart
		killtrigger prompt
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
		killtrigger noprompt
		setVar $stats ""
		setVar $wordy ""


	:statsline
		killtrigger statlinetrig
		killtrigger getLine2
		setVar $line2 CURRENTLINE
		replacetext $line2 #179 " "
		striptext $line2 ","
		setVar $stats $stats & $line2
		getWordPos $line2 $pos "Ship"
		if ($pos > 0)
			goto :gotStats
		else
			setTextLineTrigger getLine2 :statsline
			pause
		end

	:gotStats
		setVar $stats $stats & " @@@"

		setVar $current_word 0
		while ($wordy <> "@@@")
			if ($wordy = "Sect")
				getWord $stats $player~current_sector   	($current_word + 1)
			elseif ($wordy = "Turns")
				getWord $stats $player~turns  			($current_word + 1)
			elseif ($wordy = "Creds")
				getWord $stats $player~credits  		($current_word + 1)
			elseif ($wordy = "Figs")
				getWord $stats $player~fighters   		($current_word + 1)
			elseif ($wordy = "Shlds")
				getWord $stats $player~shields  		($current_word + 1)
			elseif ($wordy = "Hlds")
				getWord $stats $player~total_holds   		($current_word + 1)
			elseif ($wordy = "Ore")
				getWord $stats $player~ore_holds    		($current_word + 1)
			elseif ($wordy = "Org")
				getWord $stats $player~organic_holds    	($current_word + 1)
			elseif ($wordy = "Equ")
				getWord $stats $player~equipment_holds    	($current_word + 1)
			elseif ($wordy = "Col")
				getWord $stats $player~colonist_holds    	($current_word + 1)
			elseif ($wordy = "Phot")
				getWord $stats $player~photons   		($current_word + 1)
			elseif ($wordy = "Armd")
				getWord $stats $player~armids   		($current_word + 1)
			elseif ($wordy = "Lmpt")
				getWord $stats $player~limpets   		($current_word + 1)
			elseif ($wordy = "GTorp")
				getWord $stats $player~genesis  		($current_word + 1)
			elseif ($wordy = "TWarp")
				getWord $stats $player~twarp_type  		($current_word + 1)
			elseif ($wordy = "Clks")
				getWord $stats $player~cloaks   		($current_word + 1)
			elseif ($wordy = "Beacns")
				getWord $stats $player~beacons 		($current_word + 1)
			elseif ($wordy = "AtmDt")
				getWord $stats $player~atomic  		($current_word + 1)
			elseif ($wordy = "Corbo")
				getWord $stats $player~corbo   		($current_word + 1)
			elseif ($wordy = "EPrb")
				getWord $stats $player~eprobes   		($current_word + 1)
			elseif ($wordy = "MDis")
				getWord $stats $player~mine_disruptors   	($current_word + 1)
			elseif ($wordy = "PsPrb")
				getWord $stats $player~psychic_probe  		($current_word + 1)
			elseif ($wordy = "PlScn")
				getWord $stats $player~planet_scanner  	($current_word + 1)
			elseif ($wordy = "LRS")
				getWord $stats $player~scan_type    		($current_word + 1)
			elseif ($wordy = "Aln")
				getWord $stats $player~alignment    		($current_word + 1)
			elseif ($wordy = "Exp")
				getWord $stats $player~experience    		($current_word + 1)
			elseif ($wordy = "Corp")
				getWord $stats $player~corp   			($current_word + 1)
			elseif ($wordy = "Ship")
				getWord $stats $player~ship_number   		($current_word + 1)
			end
			add $current_word 1
			getWord $stats $wordy $current_word
		end
	:doneQuikstats
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
		killtrigger statlinetrig
		killtrigger getLine2

return
# ============================== END QUICKSTATS SUB==============================

:checkEPHaggle
	if ($epHaggleFail = 1)
	gosub :endCNsettings
	gosub :clearadjacent
	halt
	end
return


:voidadjacent
	send "*"
	gosub :player~quikstats
	
	if ($sec1void = 0)
	setVar $sec1void $player~current_sector
	else
	setVar $sec2void $player~current_sector
	end 
	if (SECTOR.WARPS[$player~current_sector][1] = 0)
			send "'{" $switchboard~bot_name "} - This sector has no warps, maybe you need to scan it first*"
		 gosub :endCNsettings
		 gosub :clearadjacent
		halt
	else
		setVar $voidsect 0
		:voids
		add $voidsect 1
		if ($voidsect < 7)
			if (SECTOR.WARPS[$player~current_sector][$voidsect] <> 0)
				send "CV" & SECTOR.WARPS[$player~current_sector][$voidsect] & "*Q"
			end
			goto :voids
		end

		send "'{" $switchboard~bot_name "} - Avoids set on all adjacent sectors*"
		send "/"
		waitfor " Sect "
		return
	end


	
:clearadjacent
	

	setVar $voidsect 0
	:clearvoids
	if ($sec1void > 0)
		add $voidsect 1
		if ($voidsect < 7)
			if (SECTOR.WARPS[$sec1void][$voidsect] <> 0)
			send "CV0*YN" & SECTOR.WARPS[$sec1void][$voidsect] & "*Q"
			end
			goto :clearvoids
		end
	end

	send "'{" $switchboard~bot_name "} - Avoids cleared on all adjacent sectors*"
	send "/"
	waitfor " Sect "
	
	if ($sec2void > 0)
		setVar $voidsect 0
		:clearvoids2
		add $voidsect 1
		if ($voidsect < 7)
			if (SECTOR.WARPS[$sec2void][$voidsect] <> 0)
			send "CV0*YN" & SECTOR.WARPS[$sec2void][$voidsect] & "*Q"
			end
			goto :clearvoids2
		end

		send "'{" $switchboard~bot_name "} - Avoids cleared on all adjacent sectors*"
		send "/"
		waitfor " Sect "

	end
		return
	
#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\player\isephaggle\player"
include "source\bot_includes\player\quikstats\player"
