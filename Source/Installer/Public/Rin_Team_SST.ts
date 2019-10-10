# ----- SCRIPT NAME AND VERSION -----
setVar $scriptname "Rincrast's Team SST script"
setVar $version "1.1"

# CREDITS
# -------
# Written by Rincrast, based on Cherokee's SST + Jet

# KNOWN ISSUES
# ------------
# None


# REVISION HISTORY
# ----------------
# 0.0.1 Alpha Development
# 1.0.0 Working Version with SST and Jettison, variable haggle percentage.
# 1.1.0 Starts sell haggle multiple low, and increases to find best
#       prices, rather than starting high and decreasing. This should
#       save 2-12 turns every time the script is run.
#       Checks to make sure adequate ore/orgs exist before trying to buy/jet them
# 1.1.1 Fixed bug when port got low on, or ran out of, fuel ore or organics.
#       Now only tries to buy/jet ore/orgs if port is selling enough.
# 1.2.0 Error trapping in xport function, port upgrade function.
# 1.3.0 Refined port upgrade logic
# 1.3.1 Added slight pause before getting input from user
# 1.3.2 skipped version
# 1.3.3 Abort ship display after initial xports.


# ----- make sure we are at a good prompt -----
:verifyprompt
    cutText CURRENTLINE $location 1 7
    if ($location <> "Command")
        echo "**Must start at Command Prompt for SST**"
        halt
    end

logging off

#gosub :startCNsettings

send "CZQ"
:getMannedShip
setTextLineTrigger mannedShip :mannedShip "+"
pause
:mannedShip
cutText CURRENTLINE $mannedShipPlus 11 1
if ($mannedShipPlus = "+")
    getWord CURRENTLINE $ship_1 1
else
    goto :getMannedShip
end
waitfor "Command [TL="
setDelayTrigger shipdispwait :shipdispwait 750
pause
pause
loadVar $ship_2
loadVar $stealDivisor
:shipdispwait
# ----- INPUT PARAMETERS
#getInput $ship_1 "Enter this ship's ID" 
if ($ship_2 = 0)
	getInput $ship_2 "Enter other ship's ID or 'wait': "
	isNumber $test2 $ship_2
	if ($test2 = 0)
		if ($ship_2 <> "wait")
			echo "*Invalid input.*"
			setVar $ship_2 0
			goto :shipdispwait
		end
	end
end
if ($stealDivisor = 0)
	getInput $steal_divisor "Enter the steal divisor: "
	isNumber $test1 $stealDivisor
	if ($test1 = 0)
		echo "*Invalid input.*"
		goto :shipdispwait
	end
end
#getInput $jet "Do you wish to jettison ore and organics for extra experience? (y/N)" "N"
if ($ship_2 = "wait")
	:sendmehere
	send "'Waiting for my SST partner to get busted.*"
	:waitOnRun
	waitFor "is clear; go ahead on your run."
	getWord CURRENTLINE $activateRun 1
	# Check on the accuracy of the word number for the ship number where friend was busted
	if ($activateRun = "R")
		getWord CURRENTLINE $ship_2 4
	else
		goto :waitOnRun
	end
end
# ----- INIT VARIABLES
#lowerCase $jet
#setVar $jetholds 10
#setVar $jetbonus 0
#setVar $jetcost 0
setVar $current_ship $ship_1
setVar $low_turns "NO"
setVar $skip_ships "NO"

setVar $debugdelay 0

:init

# ----- SHIP 1 INIT
    gosub :getInfo
    setVar $init_credits $credits
    setVar $init_exp $exp
    setVar $init_turns $turns
    send "'" & $scriptname & " v. " & $version & "*"
    send "'starting SST"
    if ($jet = "y")
        send "+JET"
    end
    send " with " & $init_credits & " credits and " & $init_exp & " experience.*"
    gosub :checkPort
    gosub :cleanShip
    gosub :steal
    gosub :xport

# ----- SHIP 2 INIT
    gosub :getInfo
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
    if ($turns > 40)
        goto :sstLoop
    else
        send "'Low Turns, Halting Script*"
        setVar $low_turns "YES"
        goto :finish
    end


# ----- FINISH
:finish
    setVar $turns_used $init_turns
    subtract $turns_used $turns
    setVar $cash_made $credits
    subtract $cash_made $init_credits
    setVar $exp_made $exp
    subtract $exp_made $init_exp
 #   gosub :endCNsettings
    send "'*I made " & $cash_made & " credits and " & $exp_made & " experience in " & $turns_used & " turns.*"
    if ($jet = "y")
        send "I made an extra " & $jetbonus & " experience at a cost of " & $jetcost & " credits.*"
    end
    send "Ship " & $ship_1 & "'s equip multiple was " & $port[$ship_1].multiple & ".*"
    send "Ship " & $ship_2 & "'s equip multiple was " & $port[$ship_2].multiple & ".*"
    if ($low_turns <> "YES")
        send "Busted in ship " & $current_ship & ", FURBing now.*"
        send "*"
    send "*"
   	setTextLineTrigger noBeacon :beacon "Beacon  :"
	setTextLineTrigger noAttack :noattack "There is nothing here to attack."
	setTextLineTrigger noMoreFurbs :noattack "NavPoint "
	setTextLineTrigger noCorpie :corpie "SAFETY OVERRIDE ENGAGED!"
	setVar $beacon 0
	send "D"
	waitFor "Sector  :"
	getWord CURRENTLINE $currentSector 3
	waitFor "Warps to Sector(s) :"
	setDelayTrigger waitToFurb :destroyFurb 800
	pause
	:beacon
		if ($furbMode = 2)
			goto :ewRefurb
			killTrigger noBeacon
		else
			killTrigger waitToFurb
			setVar $beacon 1
			killTrigger noBeacon
			goto :destroyFurb
		end
		pause
	:destroyFurb
	killTrigger noBeacon
	killTrigger waitToFurb
	send "f1*cd**"
		waitFor "appears in a brilliant flash of warp energies!"
		send "i"
		waitFor "Credits        :"
		getWord CURRENTLINE $myCurrentCredits 3
		stripText $myCurrentCredits ","
		stripText $myCurrentCredits ","
		stripText $myCurrentCredits ","
		stripText $myCurrentCredits ","
		setVar $myCurrentCredits ($myCurrentCredits - 300000)
		send "'Dumping cash on furber if I have more than 300,000 credits.*"
		if ($myCurrentCredits > 0)
			send "tcyt" & $myCurrentCredits & "*q"
			send "****qqqqqn"
		end
		waitFor "Ready to bring a furb."
	send "A"
	if ($beacon = 1)
		send "N"
	end
#	send "'Destroying Furb to replenish holds lost in bust.*"
	send "Y99*"
	waitFor "How many fighters do you wish to use"
	waitFor "Command [TL="
	killAllTriggers
	send "X"
	if ($current_ship = $ship_1)
		send $ship_2 & "*Q"
		send "'Ship " & $current_ship & " is clear; go ahead on your run.*"
		setVar $current_ship $ship_2
		setVar $ship_1 $current_ship
		send "'Waiting for my SST partner to get busted and send all clear.*"
		goto :waitOnRun
	elseif ($current_ship = $ship_2)
		send $ship_1 & "*Q"
		send "'Ship " & $current_ship & " is clear; go ahead on your run.*"
		setVar $current_ship $ship_1
		send "'Waiting for my SST partner to get busted and send all clear.*"
		goto :waitOnRun
	end
else
       send "'NO Bust, stopping because I'm down to " & $_ckinc_getInfo~turns & " turns.*"
       send "*"
end

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
        getWord CURRENTLINE $turns 4
        if ($turns = "Unlimited")
            setVar $turns 65535
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
        getWord CURRENTLINE $credits 3
        stripText $credits ","
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
            echo "**This is not an equipment buying port, you can't SST here!**"
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
                    goto :getSelling
                :getOrgSelling
                    killalltriggers
                    getWord CURRENTLINE $port[$current_ship].org_selling 3
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
                        echo "**You need more experience to SST!!! **"
                        halt
                    elseif ($holds[$current_ship] < 10)
                        echo "**You need more cargo holds to SST!!! **"
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
                        if ($credits >= $cash_needed)
                            send "o  3" & $upgrade_amount & "**"
                        else
                            send "'Not enough credits on hand to upgrade the port.*"
                            halt
                        end
                        setVar $upgrade_amount 0
                    end

            return
        end
    :noport
        killalltriggers
        echo "**There is no port, you can't SST here!**"
        halt


# ----- SUB :cleanShip
:cleanShip

    # BSB
    if ($port[$current_ship] = 2)
        if ($ore[$current_ship] <> 0) or ($equ[$current_ship] <> 0)
            subtract $turns 1
            send "PT"
            if ($ore[$current_ship] <> 0)
                send "**"
            end
            if ($equ[$current_ship] <> 0)
                send "**"
            end
            send "0*"
        else
            echo "**no need to port**"
        end

    # SBB
    elseif ($port[$current_ship] = 3)
        if ($org[$current_ship] <> 0) or ($equ[$current_ship] <> 0)
            subtract $turns 1
            send "PT"
            if ($org[$current_ship] <> 0)
                send "**"
            end
            if ($equ[$current_ship] <> 0)
                send "**"
            end
            send "0*"
        end

    # SSB
    elseif ($port[$current_ship] = 4)
        if ($equ[$current_ship] <> 0)
            subtract $turns 1
            send "PT**0*0*"
        end

    # BBB
    elseif ($port[$current_ship] = 8)
        if ($ore[$current_ship] <> 0) or ($org[$current_ship] <> 0) or ($equ[$current_ship] <> 0)
            subtract $turns 1
            send "PT"
            if ($ore[$current_ship] <> 0)
                send "**"
            end
            if ($org[$current_ship] <> 0)
                send "**"
            end
            if ($equ[$current_ship] <> 0)
                send "**"
            end
        end

    # not equ buyer
    else
        echo "**badport**"
        halt
    end
    send "JY"
    setVar $emp[$current_ship] $holds[$current_ship]
    setVar $ore[$current_ship] 0
    setVar $org[$current_ship] 0
    setVar $equ[$current_ship] 0
    setVar $col[$current_ship] 0
    setVar $sell_failures[$current_ship] 0
    waitFor "Are you sure you want to jettison"
    return


# ----- SUB :sell
:sell
    if ($equ[$current_ship] > 0)
        subtract $turns 1
        send "PT"
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
        getWord CURRENTLINE $credits 3
        stripText $credits ","
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

        add $sell_failures[$current_ship] 1
        subtract $port[$current_ship].multiple 1
        setVar $port[$current_ship].maxmultiple $port[$current_ship].multiple
        # send "'Ship " & $current_ship & " multiple decreased to " & $port[$current_ship].multiple & ".*"

        if ($sell_failures[$current_ship] > 5)
            send "'I'm having problems selling my equipment to the port. Script Halting*"
            halt
        end
        goto :sell
    :sellhagglesucceeded
        if ($port[$current_ship].maxmultiple = 0)
            add $port[$current_ship].multiple 2
            # send "'Ship " & $current_ship & " multiple increased to " & $port[$current_ship].multiple & ".*"
        end
        if ($jet = "y")
            if ($port[$current_ship] = 3) or ($port[$current_ship] = 4)
                if ($port[$current_ship].ore_selling > $jetholds)
                    if ($emp[$current_ship] >= $jetholds)
                        send $jetholds
                        gosub :buyhaggle
                        if ($buyhaggle = 1)
                            subtract $port[$current_ship].ore_selling $jetholds
                        end
                    else
                        send "0*"
                    end
                elseif ($port[$current_ship].ore_selling > 0)
                    send "0*"
                else
                    send "'This port is selling 0 ore, wait for it to regen to at least 1 unit, then restart.*"
                    halt
                end
            end
            if ($port[$current_ship] = 2) or ($port[$current_ship] = 4)
                if ($port[$current_ship].org_selling > $jetholds)
                    if ($emp[$current_ship] >= $jetholds)
                        send $jetholds
                        gosub :buyhaggle
                        if ($buyhaggle = 1)
                            subtract $port[$current_ship].org_selling $jetholds
                        end
                    else
                        send "0*"
                    end
                elseif ($port[$current_ship].org_selling > 0)
                    send "0*"
                else
                    send "'This port is selling 0 org, wait for it to regen to at least 1 unit, then restart.*"
                    halt
                end
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
                    send "'This port is selling 0 ore, wait for it to regen to at least 1 unit, then restart.*"
                    halt
                end
            end
            if ($port[$current_ship] = 2) or ($port[$current_ship] = 4)
                if ($port[$current_ship].org_selling > 0)
                    send "0*"
                else
                    send "'This port is selling 0 org, wait for it to regen to at least 1 unit, then restart.*"
                    halt
                end
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
        send "'There is no equ to sell, something is wrong*"
        halt
    end



# ----- SUB :buyhaggle
:buyhaggle
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
        getWord CURRENTLINE $credits 3
        stripText $credits ","
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
        echo "**You need more experience to SST!!! **"
        halt
    elseif ($holds[$current_ship] < 10)
        echo "**You need more cargo holds to SST!!! **"
        halt
    end
    if ($steal_holds > $emp[$current_ship])
        setVar $steal_holds $emp[$current_ship]
    end

    setVar $desired_holds_on_port $steal_holds
    add $desired_holds_on_port 2

    subtract $turns 1
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

                gosub :getInfo
                goto :finish
            :fake
                killAllTriggers
                send "  "
                send "N  N  *  *"
                send "'FAKE Busted in Ship " & $current_ship & ", need a super furb*"
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
                return
            :nosteal
                killalltriggers
                if ($upgrade_amount <> 0)
                    send "o  3" & $upgrade_amount & "**"
                end
                goto :steal


# ----- SUB :xport
# ----- USED WITHIN MAIN PROGRAM LOOP
:xport
    if ($ship_1 = $current_ship)
        setVar $current_ship $ship_2
    else
        setVar $current_ship $ship_1
    end
    subtract $turns 1
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
            send "'That is not an available ship, Script Halting.*"
            halt
        :noxportrange
            killalltriggers
            send "'Not enough transport range, Script Halting.*"
            halt
        :noxportpassword
            killalltriggers
            send "'Transport ship requires a password, Script Halting.*"
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
    if ($cn7 = 0)
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
