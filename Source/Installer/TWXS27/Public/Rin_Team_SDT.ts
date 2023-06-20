# ----- SCRIPT NAME AND VERSION -----
setVar $scriptname ">> Rincrast's << Auto-Team SDT"
setVar $version "1.4"
ECHO "**----- " & $scriptname & " v. " & $version & " -----**"

# ----- INCLUDES -----
include "include\_ckinc_CNsettings.ts"
include "include\_ckinc_getInfo.ts"
include "include\_ckinc_getPlanetInfo.ts"
include "include\_ckinc_swathoff.ts"
#include "include\_ckinc_voidadjacent.ts"
# added SupG's ship include at bottom so that I can use the express move function and refurb too


# CREDITS
# -------
# Original SDT written by Cherokee
# Team SDT version by Rincrast

# REVISION HISTORY
# ----------------
# 1.00 Working Version adapted from Cherokee's SDT
# 1.1 Added option to self-furb using express warp to a Class 0 port entered by the user
# 	Also edited script so it will not encounter an error if busted at the first steal attempt
# 1.2 Added option to wait for a furber and cash him or destroy furbs already in sector
# 1.3 -- added saveme option for photon slap
# 1.3.1 -- error on first bust still happening. attempted again to correct it.
# 1.3.2 -- took out avoid thing completely -- added the auto flee off option
# 1.4 -- enabled script to be called from Rinbot script

# ----- make sure we are at a good prompt -----
:verifyprompt
    cutText CURRENTLINE $location 1 7
    if ($location <> "Command")
        setVar $exit_message "Must start at Command Prompt for SDT"
        goto :exit
    end

:loadVars
    loadVar $_ck_ptradesetting

# ----- PTRADE SETTING-----
if ($_ck_ptradesetting = 0)
    :ptradeSetting
    echo "*What is this game's Planetary Trade Percentage? "
    getConsoleInput $_ck_ptradesetting
end
isnumber $isnum $_ck_ptradesetting
if ($isnum = 0)
    goto :ptradeSetting
elseif (($_ck_ptradesetting < 20) OR ($_ck_ptradesetting > 100))
    goto :ptradeSetting
end
saveVar $_ck_ptradesetting


logging off

gosub :_ckinc_CNsettings~startCNsettings

#makes script callable from Rinbot
loadVar $safeSector
loadVar $furbMode
loadVar $waitForFurber
loadVar $classZero
loadVar $ship_2

LoadVar $ckLRA
LoadVar $ckStealFactor
LoadVar $ckSDTquiet
if ($ckSDTquiet = 0)
    setVar $ckSDTquiet "OFF"
    saveVar $ckSDTquiet
end

#---auto flee stuff


send "\"
waitFor "Online Auto Flee"
getWord CURRENTLINE $fleetest 5
if ($fleetest = "enabled.")
	send "\"
end

:getAllInputs
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
setDelayTrigger shipdispwait :shipdispwait 500
pause
:shipdispwait

# ----- INPUT PARAMETERS
if ($ckStealFactor = 0)
	setVar $ckStealFactor 21
end
if ($ship_2 = "wait")
	goto :sendmehere
end
if ($ship_2 <> 0)
	goto :variablesInit
end
:getStealFactor
if ($ckStealFactor = 0)
    getInput $ckStealFactor "Enter the steal factor" 30
end
if (($ckStealFactor <> 3) and ($ckStealFactor <> 6) and ($ckStealFactor <> 9) and ($ckStealFactor <> 12) and ($ckStealFactor <> 15) and ($ckStealFactor <> 18) and ($ckStealFactor <> 21) and ($ckStealFactor <> 24) and ($ckStealFactor <> 27) and ($ckStealFactor <> 30) and ($ckStealFactor <> 33) and ($ckStealFactor <> 36) and ($ckStealFactor <> 39) and ($ckStealFactor <> 42) and ($ckStealFactor <> 45) and ($ckStealFactor <> 48) and ($ckStealFactor <> 51) and ($ckStealFactor <> 54) and ($ckStealFactor <> 57) and ($ckStealFactor <> 60))
    echo ANSI_15 & "*Invalid Steal Factor - must be 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60**"
    setVar $ckStealFactor 0
    saveVar $ckStealFactor
    goto :getStealFactor
else
    SaveVar $ckStealFactor
end

# This was code in CK's script originally for Jhereg's beam furbing.
# It is not permitted here. :)
# :clearForBeamFurbing
# getInput $beamFurbing "Use Jhereg's Beam Furbing? (Y/N)"
# lowerCase $beamFurbing
# if (($beamFurbing <> "n") and ($beamFurbing <> "y"))
#    echo ANSI_15 & "*Invalid, please answer Y or N**"
#    goto :clearForBeamFurbing
# end



:startMeUp


:getSafeSector
if ($safeSector = 0)
	echo ANSI_15 & "*Please enter a sector that you will attempt to escape to should your partner*get photoned or you get attacked in wait mode: "
	getInput $safeSector "Sector number? "
end
isNumber $test $safeSector
if ($test <> 1) OR ($safeSector < 0) OR ($safeSector > 20000)
	echo ANSI_15 & "*Invalid safe sector number.*"
	setVar $safeSector 0
	goto :getSafeSector
end
:chooseFurbOption
if ($furbMode = 0)
	echo ANSI_15 & "**You are in ship number " & $ship_1 & "*"
	echo ANSI_15 & "First, choose the way you'll refurb your ships.*"
	echo ANSI_15 & "To choose to destroy furb ships, type '1' -- to express warp to a class 0 port, type '2'*"
	getInput $furbMode "Enter refurb option (1 or 2): "
end
if ($furbMode <> 1) AND ($furbMode <> 2)
	echo ANSI_15 & "*Invalid option.*"
	setVar $furbMode 0
	goto :chooseFurbOption
end
if ($furbMode = 1) AND ($waitForFurber = 0)
	echo ANSI_15 & "*Now, we must decide if you wait for a furber or destroy furbs already in sector.*"
	getInput $waitForFurber "Wait for furber? (y/n) "
	if ($waitForFurber <> "y") AND ($waitForFurber <> "n")
	lowercase $waitForFurber
	echo "*Invalid input.*"
	setVar $furbMode 0
	setVar $waitForFurber 0
	goto :chooseFurbOption
end
if ($furbMode = 2) AND ($classZero = 0)
	getInput $classZero "Enter sector of class 0 port: "
	isNumber $testZero $classZero
	if ($testZero = 0)
		echo ANSI_15 & "*Invalid sector number.*"
		setVar $furbMode 0
		setVar $classZero 0
		goto :chooseFurbOption
	end
end
if ($ship_2 = 0)
	echo ANSI_15 & "*Steal Factor is " & ANSI_12 & $ckStealFactor & ANSI_15 & " - to change, type in 'factor'*"
	echo ANSI_15 & "Quiet Mode is " & $ckSDTquiet & " - to change, type in 'quiet'*"
	#new code for team work
	echo ANSI_15 & "If you are NOT the person SDTing first, type 'wait'*"
	echo ANSI_15 & "Do NOT enter the ship number of your SDT partner's current ship.*"
	getInput $ship_2 "Enter second ship's ID, or other command: "
end

if ($ship_2 = "factor")
    setVar $ckStealFactor 0
    saveVar $ckStealFactor
	setVar $safeSector 0
	setVar $furbMode 0
	setVar $waitForFuber 0
	setVar $classZero 0
	setVar $ship_2 0
    goto :getStealFactor
elseif ($ship_2 = "quiet")
    if ($ckSDTquiet = "OFF")
        setVar $ckSDTquiet "ON"
    else
        setVar $ckSDTquiet "OFF"
    end
    saveVar $ckSDTquiet
	setVar $safeSector 0
	setVar $furbMode 0
	setVar $waitForFuber 0
	setVar $classZero 0
	setVar $ship_2 0
    goto :getStealFactor
elseif  ($ship_2 = "?")
	setVar $safeSector 0
	setVar $furbMode 0
	setVar $waitForFuber 0
	setVar $classZero 0
	setVar $ship_2 0
    goto :getAllInputs
#new info for second SDTer -- waiting for the other to be refurbed and give all clear
elseif ($ship_2 = "wait")
	:sendmehere
	send "'Waiting for my SDT partner to get busted.*"
	:waitOnRun
	setTextLineTrigger photonhit :photonHit " damaging your ship."
	setTextLineTrigger attacked :underAttack "is powering up weapons systems!"
	waitFor "is clear; go ahead on your run."
	killTrigger photonhit
	killTrigger attacked
	getWord CURRENTLINE $activateRun 1
	# Check on the accuracy of the word number for the ship number where friend was busted
	if ($activateRun = "R")
		getWord CURRENTLINE $ship_2 4
	else
		goto :waitOnRun
	end
end
isNumber $numericTest $ship_2
if ($numericTest = 0)
    echo ANSI_14 & "*Bad ship number - try again*" & ANSI_15
    goto :getStealFactor
end


# ----- INIT VARIABLES
:variablesInit
setVar $_ckinc_getInfo~corp 0
setVar $current_ship $ship_1
setVar $low_turns "NO"
setVar $skip_ships "NO"
# Code to help prevent script crashing if it busts on the first stealing attempt
setVar $goodStealCount 0
# Allows to restock your fighters and shields when you ewarp refurb
setVar $rs "Yes"

# ----------------------------------------
setVar $maxcycles 12
setVar $maxbadsells 4
setVar $debugdelay 0
# ----------------------------------------

:init

# ----- SHIP 1 INIT
    setVar $total_revenue[$current_ship] 0
    setVar $equ_sold[$current_ship] 0
    gosub :_ckinc_getInfo~getInfo
        setVar $sector[$current_ship] $_ckinc_getInfo~current_sector
        setVar $holds[$current_ship] $_ckinc_getInfo~holds
        setVar $init_credits $_ckinc_getInfo~credits
        setVar $init_exp $_ckinc_getInfo~exp
        setVar $init_turns $_ckinc_getInfo~turns
        setVar $turns_used 0
        send "'" & $scriptname & " v. " & $version & " - running ships " & $ship_1 & "/" & $ship_2
        if ($ckSDTquiet = "OFF")
            send " - Verbose mode*"
        else
            send " - Quiet mode*"
        end
        send "'starting with " & $init_credits & " credits, " & $init_exp & " experience, and " & $init_turns & " turns.*"
    send "*"
    waitFor "(?=Help)?"
#    gosub :_ckinc_voidAdjacent~voidAdjacent
#   setVar $ship[$current_ship].voids "set"
killTrigger gohome
setTextLineTrigger gohome :runAwaySafe "Emergency! Emergency!"
    gosub :checkPlanet
killTrigger gohome
setTextLineTrigger gohome :runAwaySafe "Emergency! Emergency!"
    gosub :checkPort
killTrigger gohome
setTextLineTrigger gohome :runAwaySafe "Emergency! Emergency!"
    gosub :checkUpgrade
killTrigger gohome
setTextLineTrigger gohome :runAwaySafe "Emergency! Emergency!"
    gosub :stealdump
killTrigger gohome
setTextLineTrigger gohome :runAwaySafe "Emergency! Emergency!"
    gosub :xport
killTrigger gohome
setTextLineTrigger gohome :runAwaySafe "Emergency! Emergency!"

# ----- SHIP 2 INIT
    setVar $total_revenue[$current_ship] 0
    setVar $equ_sold[$current_ship] 0
    gosub :_ckinc_getInfo~getInfo
        setVar $sector[$current_ship] $_ckinc_getInfo~current_sector
        setVar $holds[$current_ship] $_ckinc_getInfo~holds
    send "*"
    waitFor "(?=Help)?"
#    gosub :_ckinc_voidAdjacent~voidAdjacent
#   setVar $ship[$current_ship].voids "set"
killTrigger gohome
setTextLineTrigger gohome :runAwaySafe "Emergency! Emergency!"
    gosub :checkPlanet
killTrigger gohome
setTextLineTrigger gohome :runAwaySafe "Emergency! Emergency!"
    gosub :checkPort
killTrigger gohome
setTextLineTrigger gohome :runAwaySafe "Emergency! Emergency!"
    gosub :checkUpgrade
killTrigger gohome
setTextLineTrigger gohome :runAwaySafe "Emergency! Emergency!"
    gosub :stealdump
killTrigger gohome
setTextLineTrigger gohome :runAwaySafe "Emergency! Emergency!"
    gosub :xport
killTrigger gohome
setTextLineTrigger gohome :runAwaySafe "Emergency! Emergency!"

setVar $skip_ships "YES"

# ----- MAIN PROGRAM LOOP
:sdtLoop
    gosub :checkUpgrade
killTrigger gohome
setTextLineTrigger gohome :runAwaySafe "Emergency! Emergency!"
    gosub :stealdump
    setVar $_ckinc_getInfo~turns $init_turns
    subtract $_ckinc_getInfo~turns $turns_used
    if ($_ckinc_getInfo~turns > 10)
        gosub :xport
        goto :sdtLoop
    else
        send "'Low Turns, Halting Script*"
        setVar $low_turns "YES"
        goto :finish
    end

# ----- FINISH
:finish
# fixes the crashing problem of the script and clears all avoids if it busts on the first steal attempt.
#if ($ship[$current_ship].voids = "set")
#        gosub :_ckinc_voidAdjacent~clearadjacent
#else
#	send "cv*yyq"
#end

    if ($current_ship = $ship_1)
        setVar $_ckinc_getInfo~current_sector $sector[$ship_2]
    else
        setVar $_ckinc_getInfo~current_sector $sector[$ship_1]
    end
#    if ($ship[$current_ship].voids = "set")
#       gosub :_ckinc_voidAdjacent~clearadjacent
#   else
#	send "cv*yyq"
#end

    gosub :_ckinc_CNsettings~endCNsettings

    setVar $cash_made $_ckinc_getInfo~credits
    subtract $cash_made $init_credits
    setVar $exp_made $exp
    subtract $exp_made $init_exp

    if ($equ_sold[$ship_1] <> 0)
        setVar $credsPerUnit[$ship_1] $total_revenue[$ship_1]
        divide $credsPerUnit[$ship_1] $equ_sold[$ship_1]
    else
        setVar $credsPerUnit[$ship_1] 0
    end

    if ($equ_sold[$ship_2] <> 0)
        setVar $credsPerUnit[$ship_2] $total_revenue[$ship_2]
        divide $credsPerUnit[$ship_2] $equ_sold[$ship_2]
    else
        setVar $credsPerUnit[$ship_2] 0
    end

    if ($turns_used <> 0)
        setVar $credsPerTurn $cash_made
        divide $credsPerTurn $turns_used
    else
        setVar $credsPerTurn 0
    end


    if ($low_turns <> "YES")
        if ($_ckinc_getInfo~corp <> 0)
            send "TTBusted - Sector " & $sector[$current_ship] & " - Ship " & $current_ship & "***"
        end
    end

    send "'* *"
    send "Ship " & $ship_1 & " - " & $total_revenue[$ship_1] & " cr - " & $equ_sold[$ship_1] & " units (" & $credsPerUnit[$ship_1] & "/unit) - MCIC " & $MCIC[$ship_1] & "*"
    send "Ship " & $ship_2 & " - " & $total_revenue[$ship_2] & " cr - " & $equ_sold[$ship_2] & " units (" & $credsPerUnit[$ship_2] & "/unit) - MCIC " & $MCIC[$ship_2] & "*"
    send "Net " & $cash_made & " credits in " & $turns_used & " turns (" & $credsPerTurn & "/turn).*"
    send " *"
    if ($low_turns <> "YES")
# Add new code and messages to allow to continue automatically
            send "Busted in ship " & $current_ship & ", FURBing now. I still have " & $_ckinc_getInfo~turns & " turns to run.*"
            send "*"
# New code -- start here when resuming programming
# an IF statement will be needed when other options for furbing are included
	setTextLineTrigger noBeacon :beacon "Beacon  :"
	setTextLineTrigger noAttack :noattack "There is nothing here to attack."
	setTextLineTrigger noMoreFurbs :noattack "NavPoint "
	setTextLineTrigger noCorpie :corpie "SAFETY OVERRIDE ENGAGED!"
	setVar $beacon 0
	send "D"
	waitFor "Sector  :"
	getWord CURRENTLINE $currentSector 3
	waitFor "Warps to Sector(s) :"
	if ($furbMode = 1)
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
		if ($waitForFurber = "y")
#ship vanishes from scanners with a brilliant flash!
#appears in a brilliant flash of warp energies!
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
		end
		send "A"
		if ($beacon = 1)
			send "N"
		end
		send "'Destroying Furb to replenish holds lost in bust.*"
		send "Y"
		send "99*"
		waitFor "How many fighters do you wish to use"
		waitFor "Command [TL="
# Code for express warp self-furbing
	elseif ($furbMode = 2)
		:ewRefurb
		send "'Express warping to sector " & $classZero & " to refurb my holds.*"
		setVar $ship_inc~expressto $classZero
		gosub :ship_inc~express
		send "pt"
		setTextLineTrigger c0c :c0c "You have"
		pause
		:c0c
		getWord CURRENTLINE $credits 3
		stripText $credits ","
		setTextTrigger limpet :remove_limpet "A port official runs up to you"
		setTextLineTrigger c0h :c0h "A  Cargo holds     :"
		pause

		:remove_limpet
		send "y"
		pause

		:c0h
		killtrigger limpet
		getWord CURRENTLINE $max_buyable_holds 10
		send "a" $max_buyable_holds "*y"
		setTextLineTrigger c0mh :c0mh "more holds is"
		pause
		:c0mh
		getWord CURRENTLINE $price 8
		stripText $price ","
		subtract $credits $price
		if ($rs = "Yes")
			setTextLineTrigger c0sp :c0sp "C  Shield Points   :"
			setTextLineTrigger c0fg :c0fg "B  Fighters        :"
			pause
			:c0fg
			getWord CURRENTLINE $figprice 4
			getWord CURRENTLINE $maxfigbuy 8
			pause
			:c0sp
			getWord CURRENTLINE $shieldprice 5
			getWord CURRENTLINE $maxshieldbuy 9
			if ($shieldprice < $figprice)
				setVar $bought "s"
			else
				setVar $bought "f"
			end
			setVar $fsbuy 0
			:bfigshi
			if ($credits > 500000)
				setVar $spendable ($credits - 500000)
				if ($bought = "s")	
					setVar $buyable ($spendable / $shieldprice)
					if ($buyable > $maxshieldbuy)
						send "c" $maxshieldbuy "*"
						setVar $credits ($credits - ($maxshieldbuy * $shieldprice))
					else
						send "c" $buyable "*q"
						setVar $credits ($credits - ($buyable * $shieldprice))
						goto :warping_out
					end
				else
					setVar $buyable ($spendable / $figprice)
					if ($buyable > $maxfigbuy)
						send "b" $maxfigbuy "*"
						setVar $credits ($credits - ($maxfigbuy * $figprice))
					else
						send "b" $buyable "*q"
						setVar $credits ($credits - ($maxfigbuy * $figprice))
						goto :warping_out
					end
				end
				if ($fsbuy < 1)
					add $fsbuy 1
					if ($bought = "s")
						setVar $bought "f"
					else
						setVar $bought "s"
					end
					goto :bfigshi
				end
			end

		end
		send "Q"
		setVar $ship_inc~expressto $currentSector
		gosub :ship_inc~express
	end
end

				
# Now, get to the other ship now that you are refurbed, so your teammate can begin his/her run
	killAllTriggers
	send "X"
	if ($current_ship = $ship_1)
		send $ship_2 & "*Q"
		send "'Ship " & $current_ship & " is clear; go ahead on your run.*"
		setVar $current_ship $ship_2
		setVar $ship_1 $current_ship
		send "'Waiting for my SDT partner to get busted and send all clear.*"
		goto :waitOnRun
	elseif ($current_ship = $ship_2)
		send $ship_1 & "*Q"
		send "'Ship " & $current_ship & " is clear; go ahead on your run.*"
		setVar $current_ship $ship_1
		send "'Waiting for my SDT partner to get busted and send all clear.*"
		goto :waitOnRun
	end
    else
        send "'NO Bust, stopping because I'm down to " & $_ckinc_getInfo~turns & " turns.*"
        send "*"
	goto :exit
    end
    pause



# ----- BEGIN SUBROUTINES SECTION -----




# ----- SUB :checkPlanet
:checkPlanet
    setTextLineTrigger noplanet :noplanet "There isn't a planet in this sector."
    setTextLineTrigger planetnum :planetnum "Registry# and Planet Name"
    setTextLineTrigger landing :landing "Landing sequence engaged..."
    send "L"
    pause
    pause
    :noplanet
        killalltriggers
        gosub :_ckinc_CNsettings~endCNsettings
        setVar $exit_message "There isn't a planet in this sector."
        goto :exit
    :planetnum
        killalltriggers
        if ($planet[$current_ship] <> 0)
            send $planet[$current_ship] & "*"
        else
            echo ANSI_15 & "*Type in the planet number to use: "
        end
        setTextLineTrigger wrongplanet :wrongplanet "That planet is not in this sector."
        setTextLineTrigger wrongplanet2 :wrongplanet "Invalid registry number, landing aborted."
        setTextLineTrigger landing :landing "Landing sequence engaged..."
        pause
        pause
        :wrongplanet
            killalltriggers
            send "Q*"
            gosub :_ckinc_CNsettings~endCNsettings
            setVar $exit_message "That planet is not in this sector."
            goto :exit
    :landing
        killalltriggers
        send "SNL1*TNL1*TNL2*TNL3*"
        waitfor "How many holds of Equipment do you want to leave"
        waitfor "Planet command"
        gosub :_ckinc_getPlanetInfo~getPlanetInfo
        setvar $planet[$current_ship] $_ckinc_getPlanetInfo~planet
        setVar $planet[$current_ship].equ $_ckinc_getPlanetInfo~planetequip
        send "QJY"
        waitfor "Are you sure you want to jettison"
        return


# ----- SUB :checkPort
:checkPort
    send "D"
    waitfor "<Re-Display>"
    setTextLineTrigger getPort :getPort "Ports   :"
    setTextTrigger noport :noport "Command [TL="
    pause
    pause
    :getPort
        killalltriggers
        getText CURRENTLINE $port[$current_ship] ", Class " " ("
        if ($port[$current_ship] <> 2) and ($port[$current_ship] <> 3) and ($port[$current_ship] <> 4) and ($port[$current_ship] <> 8)
            gosub :_ckinc_CNsettings~endCNsettings
            setVar $exit_message "This is not an equipment buying port; you can't SDT here! You need a class 2, 3, 4, or 8."
            goto :exit
        else
            send "CR*Q"
                setTextLineTrigger getEquOnPort :getEquOnPort "Equipment  Buying"
                pause
                pause
                :getEquOnPort
                    killalltriggers
                    getWord CURRENTLINE $port[$current_ship].equ_amount 3
                    getWord CURRENTLINE $port[$current_ship].equ_pct 4
                    stripText $port[$current_ship].equ_pct "%"
                    add $port[$current_ship].equ_pct 1
                    setVar $port[$current_ship].equ_max $port[$current_ship].equ_amount
                    multiply $port[$current_ship].equ_max 100
                    divide $port[$current_ship].equ_max $port[$current_ship].equ_pct
                    setVar $port[$current_ship].equ_on_port $port[$current_ship].equ_max
                    subtract $port[$current_ship].equ_on_port $port[$current_ship].equ_amount
            return
        end
    :noport
        killalltriggers
        gosub :_ckinc_CNsettings~endCNsettings
        setVar $exit_message "There is no port in this sector! You cannot SDT here!"
        goto :exit


# ----- SUB :checkUpgrade
# ----- USED WITHIN MAIN PROGRAM LOOP
:checkUpgrade

    setVar $steal_holds $_ckinc_getInfo~exp
    divide $steal_holds $ckStealFactor
    if ($steal_holds < 10)
        gosub :_ckinc_CNsettings~endCNsettings
        setVar $exit_message "You need more experience to SDT!!!"
        goto :exit
    elseif ($holds[$current_ship] < 10)
        gosub :_ckinc_CNsettings~endCNsettings
        setVar $exit_message "You need more cargo holds to SDT!!!"
        goto :exit
    end
    if ($steal_holds > $holds[$current_ship])
        setVar $steal_holds $holds[$current_ship]
    end

    :calcSectorEqu
    setVar $sector_equ[$current_ship] $planet[$current_ship].equ
    add $sector_equ[$current_ship] $port[$current_ship].equ_on_port
    setVar $sector_equ_needed[$current_ship] $steal_holds
    multiply $sector_equ_needed[$current_ship] $maxcycles
    add $sector_equ_needed[$current_ship] 10

    if ($port[$current_ship].equ_on_port >= $steal_holds)
        return
    else
        if ($sector_equ[$current_ship] >= $sector_equ_needed[$current_ship])
            gosub :sell
            return
        else
            setVar $upgrade_amount $steal_holds
            subtract $upgrade_amount $port[$current_ship].equ_on_port
            divide $upgrade_amount 10
            add $upgrade_amount 5
            setVar $cash_needed $upgrade_amount
            multiply $cash_needed 900
            if ($_ckinc_getInfo~credits >= $cash_needed)
                send "o  3" & $upgrade_amount & "*  *"
                multiply $upgrade_amount 10
                add $port[$current_ship].equ_on_port $upgrade_amount
                if ($ckSDTquiet = "OFF")
                    send "'Ship " & $current_ship & " - port upgraded " & $upgrade_amount & " units.*"
                end
                setVar $upgrade_amount 0
                subtract $_ckinc_getInfo~credits $cash_needed
            else
                if ($planet[$current_ship].equ >= $steal_holds)
                    send "'Not enough credits to upgrade, selling early.*"
                    gosub :sell
                else
                    gosub :_ckinc_CNsettings~endCNsettings
                    setVar $exit_message "Not enough credits on hand to upgrade the port."
                    goto :exit
                end
            end
            return
        end
    end

# ----- SUB :sell
# ----- USED WITHIN MAIN PROGRAM LOOP
:sell
    if ($planet[$current_ship].equ > 0)

        add $turns_used 1
        send "PN" & $planet[$current_ship] & "*"
        :getpercts
            setTextLineTrigger equpct :equpct "Equipment  Buying"
            pause
            pause

            :equpct
                getWord CURRENTLINE $_ckinc_getInfo~current_sector.equpercent 4
                striptext $_ckinc_getInfo~current_sector.equpercent "%"

        :sellproduct
            setTextTrigger sellfuel :sellfuel "How many units of Fuel Ore"
            setTextTrigger sellorg :sellorg "How many units of Organics"
            setTextTrigger sellequ :sellequ "How many units of Equipment"
            pause
            pause

            :sellfuel
                killalltriggers
                send "0*"
                goto :sellproduct
            :sellorg
                killalltriggers
                send "0*"
                goto :sellproduct
            :sellequ
                killalltriggers
                send "*"
                setTextLineTrigger equamount :equamount "Agreed,"
                pause
                pause

            :equamount
                getWord CURRENTLINE $portbuying 2
                striptext $portbuying ","

    :sellhaggle
        setTextLineTrigger sellfirstoffer :sellfirstoffer "We'll buy them for"
        pause

    :sellfirstoffer
        killalltriggers
        getWord CURRENTLINE $offer 5
        striptext $offer ","

        gosub :_ckinc_swathoff~swathoff
        if ($_ckinc_swathoff~swathoff = 0)
            setVar $exit_message $_ckinc_swathoff~message
            goto :exit
        end


        # ----- CALCULATE the port's "quality" -----
        setVar $perunitinitoffer $offer

        #NEW CODE ADDED TO SUPPORT NON-100% PTRADES
        multiply $perunitinitoffer 100
        divide $perunitinitoffer $_ck_ptradesetting

        # multiply by 100 to increase accuracy of results, we'll need to divide by 100 later
        multiply $perunitinitoffer 100

        # divide by the number of units you are selling
        divide $perunitinitoffer $portbuying

        #initialize portmaxinit
        setVar $portmaxinit $perunitinitoffer

        # return to 10 scale
        divide $perunitinitoffer 10

            # port max init  =(($perunitinitoffer-90.6281)/($percent-10.98921))*(89.01079)+90.6281
            setVar $basevalue 906281000
            setVar $basepercent 10989
            setVar $basepercentinverse 89010
            setVar $percentfrombase $_ckinc_getInfo~current_sector.equpercent

        if ($percentfrombase >= 15)
            # multiply by 100,000 for precision
            multiply $portmaxinit 100000

            # subtract basevalue (in 10,000,000 scale)
            subtract $portmaxinit $basevalue

            # multiply by 1000 for precision
            multiply $percentfrombase 1000

            # subtract equ base percent (1,000 scale)
            subtract $percentfrombase $basepercent

            # calculate PMI/PFB
            divide $portmaxinit $percentfrombase

            # multiply by inverse of equ base percent (1,000 scale)
            multiply $portmaxinit $basepercentinverse

            # add the basevalue (in 10,000,000 scale)
            add $portmaxinit $basevalue

            # return to 10 scale
            divide $portmaxinit 1000000

        else
            setVar $portmaxinit 1063
        end




        # ----- LOOKUP the counteroffer percentage to use at this "quality" port -----
            if ($portmaxinit >= 1393)
                setVar $MCIC "-65"
                setVar $multiple 1347

            elseif ($portmaxinit >= 1386)
                setVar $MCIC "-64"
                setVar $multiple 1341

            elseif ($portmaxinit >= 1379)
                setVar $MCIC "-63"
                setVar $multiple 1336

            elseif ($portmaxinit >= 1372)
                setVar $MCIC "-62"
                setVar $multiple 1330

            elseif ($portmaxinit >= 1365)
                setVar $MCIC "-61"
                setVar $multiple 1324

            elseif ($portmaxinit >= 1358)
                setVar $MCIC "-60"
                setVar $multiple 1319

            elseif ($portmaxinit >= 1351)
                setVar $MCIC "-59"
                setVar $multiple 1313

            elseif ($portmaxinit >= 1344)
                setVar $MCIC "-58"
                setVar $multiple 1307

            elseif ($portmaxinit >= 1337)
                setVar $MCIC "-57"
                setVar $multiple 1302

            elseif ($portmaxinit >= 1329)
                setVar $MCIC "-56"
                setVar $multiple 1296

            elseif ($portmaxinit >= 1323)
                setVar $MCIC "-55"
                setVar $multiple 1291

            elseif ($portmaxinit >= 1315)
                setVar $MCIC "-54"
                setVar $multiple 1285

            elseif ($portmaxinit >= 1308)
                setVar $MCIC "-53"
                setVar $multiple 1279

            elseif ($portmaxinit >= 1301)
                setVar $MCIC "-52"
                setVar $multiple 1274

            elseif ($portmaxinit >= 1294)
                setVar $MCIC "-51"
                setVar $multiple 1268

            elseif ($portmaxinit >= 1287)
                setVar $MCIC "-50"
                setVar $multiple 1262

            elseif ($portmaxinit >= 1279)
                setVar $MCIC "-49"
                setVar $multiple 1254

            elseif ($portmaxinit >= 1272)
                setVar $MCIC "-48"
                setVar $multiple 1247

            elseif ($portmaxinit >= 1265)
                setVar $MCIC "-47"
                setVar $multiple 1246

            elseif ($portmaxinit >= 1258)
                setVar $MCIC "-46"
                setVar $multiple 1241

            elseif ($portmaxinit >= 1251)
                setVar $MCIC "-45"
                setVar $multiple 1235

            elseif ($portmaxinit >= 1243)
                setVar $MCIC "-44"
                setVar $multiple 1229

            elseif ($portmaxinit >= 1236)
                setVar $MCIC "-43"
                setVar $multiple 1224

            elseif ($portmaxinit >= 1229)
                setVar $MCIC "-42"
                setVar $multiple 1218

            elseif ($portmaxinit >= 1221)
                setVar $MCIC "-41"
                setVar $multiple 1213

            elseif ($portmaxinit >= 1214)
                setVar $MCIC "-40"
                setVar $multiple 1208

            elseif ($portmaxinit >= 1206)
                setVar $MCIC "-39"
                setVar $multiple 1201

            elseif ($portmaxinit >= 1199)
                setVar $MCIC "-38"
                setVar $multiple 1196

            elseif ($portmaxinit >= 1192)
                setVar $MCIC "-37"
                setVar $multiple 1190

            elseif ($portmaxinit >= 1184)
                setVar $MCIC "-36"
                setVar $multiple 1185

            elseif ($portmaxinit >= 1177)
                setVar $MCIC "-35"
                setVar $multiple 1180

            elseif ($portmaxinit >= 1169)
                setVar $MCIC "-34"
                setVar $multiple 1174

            elseif ($portmaxinit >= 1162)
                setVar $MCIC "-33"
                setVar $multiple 1169

            elseif ($portmaxinit >= 1154)
                setVar $MCIC "-32"
                setVar $multiple 1164

            elseif ($portmaxinit >= 1147)
                setVar $MCIC "-31"
                setVar $multiple 1158

            elseif ($portmaxinit >= 1139)
                setVar $MCIC "-30"
                setVar $multiple 1152

            elseif ($portmaxinit >= 1132)
                setVar $MCIC "-29"
                setVar $multiple 1149

            elseif ($portmaxinit >= 1124)
                setVar $MCIC "-28"
                setVar $multiple 1144

            elseif ($portmaxinit >= 1116)
                setVar $MCIC "-27"
                setVar $multiple 1136

            elseif ($portmaxinit >= 1109)
                setVar $MCIC "-26"
                setVar $multiple 1132

            elseif ($portmaxinit >= 1101)
                setVar $MCIC "-25"
                setVar $multiple 1126

            elseif ($portmaxinit >= 1093)
                setVar $MCIC "-24"
                setVar $multiple 1122

            elseif ($portmaxinit >= 1086)
                setVar $MCIC "-23"
                setVar $multiple 1117

            elseif ($portmaxinit >= 1078)
                setVar $MCIC "-22"
                setVar $multiple 1110

            elseif ($portmaxinit >= 1071)
                setVar $MCIC "-21"
                setVar $multiple 1105

            elseif ($portmaxinit >= 1063)
                setVar $MCIC "-20"
                setVar $multiple 1102

            else
                setVar $MCIC "0"
                setVar $multiple 1102

            end

        setVar $counter $offer
        divide $counter 10
        multiply $counter $multiple
        # divide by 1000 instead of 100 because the multiple is in 10 scale
        divide $counter 100
        send $counter & "*"
        setVar $midhaggles 0
    :sellofferloop
        setTextLineTrigger sellprice :sellprice "We'll buy them for"
        setTextLineTrigger sellfinaloffer :sellfinaloffer "Our final offer"
        setTextLineTrigger sellnotinterested :sellnotinterested "We're not interested."
        setTextLineTrigger sellexperience :sellexperience "experience point(s)"
        setTextLineTrigger sellyouhave :sellyouhave "You have"

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
        add $midhaggles 1
        setVar $old_offer $offer
        setVar $old_counter $counter
        getWord CURRENTLINE $offer 5
        striptext $offer ","

            # new method
            setVar $offer_change $offer
            subtract $offer_change $old_offer
            if ($MCIC > "-50")
                multiply $offer_change 65
                divide $offer_change 100
                subtract $counter $offer_change
                subtract $counter 25
            else
                multiply $offer_change 60
                divide $offer_change 100
                subtract $counter $offer_change
                subtract $counter 10
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
        subtract $counter 10
        send $counter & "*"
        goto :sellofferloop
    :sellnotinterested
        killalltriggers
        goto :sellhagglefailed
    :sellexperience
        killalltriggers
        getWord CURRENTLINE $exp_bonus 7
        add $_ckinc_getInfo~exp $exp_bonus
        goto :sellofferloop
    :sellyouhave
        killalltriggers
        setVar $oldcredits $_ckinc_getInfo~credits
        getWord CURRENTLINE $_ckinc_getInfo~credits 3
        stripText $_ckinc_getInfo~credits ","
        if ($oldcredits = $_ckinc_getInfo~credits)
            setVar $currenthaggle "failed"
            goto :sellhagglefailed
        else
            setVar $currenthaggle "succeeded"
            goto :sellhagglesucceeded
        end
    :sellhagglefailed
        add $sell_failures 1
        add $total_sell_failures 1
        # echo "*haggle failed - " & $sell_failures & "**"
        # send "' Failed Haggle (" & $perunitinitoffer & " init offer).*"
        if ($sell_failures >= $maxbadsells)
            send "'I'm having problems selling my equipment to the port (" & $perunitinitoffer & "). Script Halting*"
            goto :finish
        end
        goto :sell
    :sellhagglesucceeded
        setVar $MCIC[$current_ship] $MCIC
        subtract $planet[$current_ship].equ $portbuying
        add $port[$current_ship].equ_on_port $portbuying
        add $equ_sold[$current_ship] $portbuying
        add $total_revenue[$current_ship] $counter
        setVar $perunit $counter
        divide $perunit $portbuying
        if ($ckSDTquiet = "OFF")
            send "'Ship " & $current_ship & " - " & $portbuying & " EQU haggled for " & $counter & " credits (" & $perunit & " per unit).*"
        end
    else
        send "'There is no equ to sell at this port*"
    end
    return


# ----- SUB :stealdump
# ----- USED WITHIN MAIN PROGRAM LOOP
:stealdump
    if ($sector[$current_ship] = $ckLRA)
        setDelayTrigger askLRAdelay :askLRA 300
        pause
        :askLRA
            killalltriggers
            getInput $proceedLRA "The script has reason to believe this is your last rob attempt (LRA) - proceed anyway? (y/n)"
            if (($proceedLRA = "Y") or ($proceedLRA = "y"))
                send "'LRA protection bypassed - script continuing*"
            elseif (($proceedLRA = "N") or ($proceedLRA = "n"))
                gosub :_ckinc_CNsettings~endCNsettings
                setVar $exit_message "LRA protection - script halting"
                goto :exit
            else
                goto :askLRA
            end
    end
    add $turns_used 1
    send "PR*SZ3"
    send $steal_holds & "*"
    waitfor "furtively about"
    setTextLineTrigger equOnPort :equOnPort "Equipment  Buying"
    setTextLineTrigger fake :fake "Suddenly you're Busted!"
    pause
    pause
    :equOnPort
        killalltriggers
        getWord CURRENTLINE $port[$current_ship].equ_on_port 4
        SetVar $ckLRA $sector[$current_ship]
        SaveVar $ckLRA
        :dothedeed
            setTextLineTrigger bust :bust "For getting caught"
            setTextLineTrigger good :good "and you receive"
            pause
            pause
            :bust
                killalltriggers
# New code needed here to go back to the beginning of the script and wait for a ship to be clear.
# Also needs code for refurbing, depending on furb type entered.
                gosub :_ckinc_getInfo~getInfo
                goto :finish
            :fake
                killAllTriggers
                send "  "
                send "N  N  *  *"
# New code needed here to go back to the beginning of the script and wait for a ship to be clear.
# Also needs code for refurbing, depending on furb type entered.
                gosub :_ckinc_CNsettings~endCNsettings
                setVar $exit_message "FAKE Busted in Ship " & $current_ship & ", need a super furb. Script halting."
                goto :exit
            :good
# adds to the successful steal count so it won't crash if it busts on the first steal attempt.
	setVar $goodStealCount ($goodStealCount + 1)
                killalltriggers
                getWord CURRENTLINE $exp_bonus 4
                add $_ckinc_getInfo~exp $exp_bonus
                setVar $sendString "L  " & $planet[$current_ship] & "*  TNL3*Q"
                send $sendString
                add $planet[$current_ship].equ $steal_holds
                subtract $port[$current_ship].equ_on_port $steal_holds
                if ($debugdelay <> 0)
                    setDelayTrigger testing :testing $debugdelay
                    pause
                    pause
                end
                :testing
                return


# ----- SUB :xport
# ----- USED WITHIN MAIN PROGRAM LOOP
:xport
    if ($ship_1 = $current_ship)
        setVar $current_ship $ship_2
    else
        setVar $current_ship $ship_1
    end
    add $turns_used 1
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
            gosub :_ckinc_CNsettings~endCNsettings
            setVar $exit_message "That is not an available ship; script halting."
            goto :exit
        :noxportrange
            killalltriggers
            gosub :_ckinc_CNsettings~endCNsettings
            setVar $exit_message "Not enough transport range; script halting."
            goto :exit
        :noxportpassword
            killalltriggers
            gosub :_ckinc_CNsettings~endCNsettings
            setVar $exit_message "Transport ship requires a password; script halting."
            goto :exit
        :xportsuccess
            killalltriggers
            return
    end

:noattack
	send "'There are no more furbs here in this sector. Rincrast's Auto-Team SDT script exiting.*"
	send "QQQn"
	halt
	pause
:corpie
	send "'ERROR! There is a corporately owned ship in this sector; the script cannot continue.*"
	halt
	pause
:exit
    if ($exit_message <> 0)
        send "'" & $exit_message & "*"
    end
    halt

:photonHit
getWord CURRENTLINE $didIGetHit 1
if ($didIGetHit <> "F") AND ($didIGetHit <> "R") AND ($didIGetHit <> "P") AND ($didIGetHit <> "'") AND ($didIGetHit <> "`")
	send "'*Emergency! Emergency! I've been photoned!! Retreat to safe sector!!**"
	waitFor "Command [TL="
	load _ck_callsaveme.cts
	waitFor "Command [TL="
	halt
end
killTrigger photonhit
goto :waitOnRun	

:runAwaySafe
getWord CURRENTLINE $away 1
if ($away = "R")
	send " * * * * *qqqqq***"
	send "jypt***"
	send "m" & $safeSector & "*yy"
	waitFor "Command [TL="
	send "'Safely evacuated ship to sector " & $safeSector & ". Script halting.*"
	setVar $safeSector 0
	setVar $furbMode 0
	setVar $waitForFurber 0
	setVar $classZero 0
	setVar $ship_2 0
	halt
end
send "* * * * * qqqq*"
goto :sdtLoop

:underAttack
getWord CURRENTLINE $didIGetHit 1
if ($didIGetHit <> "F") AND ($didIGetHit <> "R") AND ($didIGetHit <> "P") AND ($didIGetHit <> "'") AND ($didIGetHit <> "`")
	send "jypt"
	send "'Emergency! Emergency! I'm under attack! I'm getting out of here to safe sector!*"
	setDelayTrigger waittoescape :waittoescape 500
	pause
	:waittoescape
	send "****" & "m" & $safeSector & "*yy"
	waitFor "Command [TL="
	send "'Safely evacuated ship to sector " & $safeSector & ". Script halting.*"
	setVar $safeSector 0
	setVar $furbMode 0
	setVar $waitForFurber 0
	setVar $classZero 0
	setVar $ship_2 0
	halt
end
goto :waitOnRun

include "supginclude\ship_inc"