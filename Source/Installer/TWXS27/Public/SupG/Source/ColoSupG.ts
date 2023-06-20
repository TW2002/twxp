cutText CURRENTLINE $location 1 7
if ($location <> "Command")
	clientMessage "This script must be run from the game Command prompt."
    halt
end
setVar $init 1
# obtain ship information

gosub :gameinfo_inc~quikstats
setVar $align $gameinfo_inc~quikstats[ALN]
setVar $cursec $gameinfo_inc~quikstats[SECT]
setVar $holds $gameinfo_inc~quikstats[HLDS]


send "I"
setTextLineTrigger tpw :tpw "Turns to Warp  :"
setTextLineTrigger turns :turns "Turns left     :"
setTextTrigger pscanner :pscanner "Planet Scanner :"
setTextTrigger twarp :twarp "TransWarp Power"
setTextTrigger done :done "Credits"
pause

:tpw
getWord CURRENTLINE $tpw 5
pause

:turns
getWord CURRENTLINE $turns 4
pause

:pscanner
setVar $pscan 1
pause

:twarp
setVar $twarp 1
pause

:done
killtrigger pscanner
killtrigger twarp
# clear avoids
send "cx"
waitFor "<List Avoided Sectors>"
:grabvoids
setTextLineTrigger voidgrabber :voidgrab
pause

:voidgrab
getWord CURRENTLINE $chkEnd 1
if ($chkEnd = 0)
	add $spc 1
	if ($spc = 2)
		goto :voidsgrabbed
	end
	goto :grabvoids
elseif ($chkEnd = "No")
	setVar $numvoids 0
	goto :voidsgrabbed
else
	setVar $voidlist 0
	while ($voidlist < 11)
		add $voidlist 1
		getWord CURRENTLINE $void $voidlist
		if ($void > 0)
			add $numvoids 1
			setVar $voids[$numvoids] $void
		else
			goto :voidsgrabbed
		end
	end
	goto :grabvoids
end
:voidsgrabbed
send "v*yyf*1*" 
waitfor "> 1"
send "f1*" $cursec "*"
waitfor "> " & $cursec
send "Q"
waitfor "<Computer deactivated>"

send "C"
if ($numvoids > 0)
	setVar $redovoids 0
	while ($redovoids < $numvoids)
		add $redovoids 1
		send "v" $voids[$redovoids] "*"
	end
end
send "q"
waitFor "<Computer deactivated>"

loadVar $SupGColo
if ($SupGColo)
	loadVar $SupGColo_prod
	loadVar $SupGColo_method
	loadVar $SupGColo_Pnum
	loadVar $SupGColo_fuelplanet
	loadVar $SupGcolo_fuelsource
	loadVAr $SupGcolo_safemode

	setVar $colo_Prod $SupGColo_Prod
	setVar $colo_method $SupGColo_method
	setVar $colo_planet $SupGColo_Pnum
	setVar $colo_fuelplanet $SupGColo_fuelplanet
	setVar $colo_fuelsource $SupGColo_fuelsource
	setVar $colo_safemode $SupGColo_safemode

	if ($colo_fuelsource = "Port") AND ((PORT.CLASS[$cursec] < 0) OR (PORT.BUYFUEL[$cursec] = 1))
		setVar $colo_fuelsource "Planet"
	end
	
	if ($turns <> "Unlimited")
		setVar $colo_turnrun ($turns - 50)
	end
else
	setVar $colo_Prod "Fuel"
	setVar $colo_method "Auto"
	setVar $colo_planet 0
	setVar $colo_fuelsource "Planet"
	setVar $colo_fuelplanet 0
	setVar $colo_safemode "No"

	if ($turns <> "Unlimited")
		setVar $colo_turnrun ($turns - 50)
	end
end

loadVAr $SupGBot_Script
if ($SupGBot_Script)
	setVAr $SupGBot_Script 0
	saveVar $SupGBot_Script
	gosub :SupGBot_inc~SupGBot_loadparms

	setVar $coloProd $SupGBot_inc~parm1
	setVar $coloturns $SupGBot_inc~parm2
	setVAr $coloplanet $SupGBot_inc~parm3
	setVar $colosource $SupGBot_inc~parm4

	setVar $botloaded 1
	
	if ($coloProd = 1)
		setVar $colo_Prod "Fuel"
	elseif ($coloProd = 2)
		setVar $colo_Prod "Organics"
	elseif ($coloProd = 3)
		setVar $colo_Prod "Equipment"
	else
		send "'(SupGColo): Unable to run script, invalid product type.*"
		halt
	end

	if ($coloturns < 0)
		send "'(SupGColo): Unable to run script, invalid turn amount.*"
		halt
	elseif ($coloturns > $turns) OR ($coloturns = 0)
		setVar $colo_turnrun ($turns - 50)
	else
		setVar $colo_turnrun $coloturns
	end
	lowercase $coloSource
	if ($coloSource = "port")
		if (PORT.CLASS[$cursec] > 0) AND (PORT.BUYFUEL = 0)
			setVar $colo_fuelsource "Port"
		else
			send "'(SupGColo): Unable to run script, invalid fuel source type.*"
			halt
		end
	else
		isnumber $chk $colosource
		if ($chk) AND ($colosource > 1)
			setVar $colo_fuelsource "Planet"
			setVar $colo_fuelplanet $coloSource
		else
			send "'(SupGColo): Unable to run script, invalid fuel source type.*"
			halt
		end
	end
	isnumber $chk $coloplanet
	if ($chk) AND ($colosource > 1)
		setVAr $colo_planet $coloplanet
	else
		send "'(SupGColo): Unable to run script, invalid colo planet.*"
		halt
	end
	if ($align < 1000)
		send "'(SupGColo): Unable to run script, coloing with less than 1000 alignment is not supported via SupGBot.*"
		halt
	end
	setVar $colo_method "Auto"
	send "'(SupGColo): script loaded by SupGBot - coloing: " $colo_planet ".*"
	
	gosub :SupGBot_inc~SupGBot_disableCommands
	waitFor "Bot Commands Disabled While Running Script"
	
	goto :top
end
gosub :save

:menu
echo "[2J"
:errmenu

setVar $signature_inc~scriptName "SupGColo"
setVar $signature_inc~version "2.b"
setVar $signature_inc~date "03/25/04"
gosub :signature_inc~signature

echo ANSI_15 "SupGColo Settings for " GAMENAME "*"
echo ANSI_14 "1." ANSI_15 " Product               " ANSI_10 "["
echo ANSI_6 $colo_prod
echo ANSI_10 "]*"
echo ANSI_14 "2." ANSI_15 " Method                " ANSI_10 "["
echo ANSI_6 $colo_method
echo ANSI_10 "]*"
echo ANSI_14 "3." ANSI_15 " Turns To Run          " ANSI_10 "["
if ($turns = "Unlimited")
	echo ANSI_6 "Unlimited"
else
	echo ANSI_6 $colo_turnrun ANSI_15 " of " $turns 
end
echo ANSI_10 "]*"
echo ANSI_14 "4." ANSI_15 " Planet Number         " ANSI_10 "["
echo ANSI_6 $colo_planet
echo ANSI_10 "]*"
echo ANSI_14 "5." ANSI_15 " Safe Mode             " ANSI_10 "["
echo ANSI_6 $colo_safemode
echo ANSI_10 "]*"
if ($colo_method <> "Express")
	echo ANSI_14 "6." ANSI_15 " Fuel Source           " ANSI_10 "["
	echo ANSI_6 $colo_fuelsource
	echo ANSI_10 "]*"
end
if ($colo_method <> "Express")
	echo ANSI_14 "7." ANSI_15 " Fuel/Tpad Planet      " ANSI_10 "["
	echo ANSI_6 $colo_fuelplanet
	echo ANSI_10 "]*"
end
if ($gameinfo_inc~quikstats[ORE] > 0) OR ($gameinfo_inc~quikstats[ORG] > 0) OR ($gameinfo_inc~quikstats[EQU] > 0) OR ($gameinfo_inc~quikstats[COL] > 0)
	echo ANSI_12 "Warning : your holds are not empty, empty your holds for highest colo count."
end
echo ANSI_5 "*Press the number of the option you*wish to change, or press" ANSI_14 " C" ANSI_5 " to continue.**"
getConsoleInput $choice singlekey
lowercase $choice
if ($choice = 1)
	if ($colo_prod = "Fuel")
		setVar $colo_prod "Organics"
	elseif ($colo_prod = "Organics")
		setVar $colo_prod "Equipment"
	else
		setVar $colo_prod "Fuel"
	end
elseif ($choice = 2)
	if ($colo_method = "Auto")
		setVar $colo_method "Tpad"
	elseif ($colo_method = "Tpad")
		if ($twarp = 1)
			setVar $colo_method "Twarp"
		else
			setVAr $colo_method "Express"
		end
	elseif ($colo_method = "Twarp")
		setVar $colo_method "Express"
	else
		setVar $colo_method "Auto"
	end
elseif ($choice = 3)
	if ($turns = "Unlimited")
		clientMessage "You have unlimited turns, script will go until you stop it."
	else
		getInput $colo_turnrun "How many turns to run?"
		isNumber $tst $colo_turnrun
		if ($tst)
			if ($colo_turnrun > $turns)
				setVar $colo_turnrun ($turns - 10)
			end
			if ($colo_turnrun < 1)
				setVar $colo_turnrun ($turns - 50)
			end
		else
			setVar $colo_turnrun ($turns - 50)
		end
	end
elseif ($choice = 4)
	getInput $colo_planet "Planet to colonize?"
	isNumber $tst $colo_planet
	if ($tst)
		if ($colo_planet < 0)
			setVar $colo_planet 0
		end
	else
		setVar $colo_planet 0
	end
elseif ($choice = 5)
	if ($colo_safemode = "No")
		setVar $colo_safemode "Yes"
	else
		setVar $colo_safemode "No"
	end
elseif ($choice = 6)
	
	if (PORT.CLASS[$cursec] > 0) AND (PORT.BUYFUEL[$cursec] = 0) AND ($colo_fuelsource = "Planet")
		setVar $colo_fuelsource "Port"
	else
		setVar $colo_fuelsource "Planet"
	end
elseif ($choice = 7)
	getInput $colo_fuelplanet "Fuel Planet (0 if same as planet to be colonized)?"
	isNumber $tst $colo_fuelplanet
	if ($tst)
		if ($colofuelplanet < 0)
			setVar $colo_fuelplanet 0
		end
	else
		setVar $colo_fuelplanet 0
	end
elseif ($choice = "c")
	if ($colo_fuelplanet = 0)
		setVar $colo_fuelplanet $colo_planet
	end
	gosub :save
	goto :top
end
goto :menu
#####################################################################
:top

if ($colo_method = "Auto")
	gosub :getMethod
end
if ($colo_method <> "Express") AND ($turns <> "Unlimited")
	gosub :getFuelLoop
end
gosub :makeMacro

if ($colo_fuelsource = "Port") AND ($colo_method <> "Express")
	send "cr*"
	setTextLineTrigger foport :foport "Fuel Ore"
	pause
	
	:foport
	getWord CURRENTLINE $fuelonport 4
	setVar $fuelLoops ($fuelonport / $holds)
	send "Q"
end

if ($colo_method = "Express") AND ($turns <> "Unlimited")
	getDistance $there $cursec 1
	getDistance $back 1 $cursec
	setVar $best_numloops ($colo_turnrun / (($back + $there) * $tpw))
end
######################################################################
:macrorunner
setVar $loopcounter 0
setTextTrigger outacollies :outacollies "There aren't that many on Terra!"
if ($colo_fuelsource = "Planet")
	setTextTrigger outafuel :outafuel "There aren't that many on the planet!"
	setTextTrigger badplanet :badplanet "That planet is not in this sector."
end
if ($colo_method = "Tpad")
	setTextTrigger badplanet2 :badplanet2 "Self Destruct Aborted..."
	setTextTrigger outafuel2 :outafuel2 "Qcannon Control Type :"
end
if ($colo_method = "Twarp")
	setTextTrigger ourafuel2 :outafuel "<Set NavPoint>"
end
:loopcnter
setVar $sendmacro ""
if ($loopcounter < $best_numloops) OR ($turns = "Unlimited")
	add $loopcounter 1
	if ($loopcounter >= $fuelLoops) AND ($colo_fuelsource = "Port")
		setVar $colo_fuelSource "Planet"
		setVar $colo_fuelplanet $colo_planet
		gosub :makeMacro
	end
	setVar $macroreader 0
	setVar $pos 0
	:macroread
	add $macroreader 1
	getWord $macro $command $macroreader
	if ($command <> "END")
		getWordPos $command $pos "TWARP_"
		if ($pos > 0)
			stripText $command "TWARP_"
			if ($init = 1) OR ($colo_safemode = "Yes")
				replaceText $sendmacro "_" " "
				send $sendmacro
				setVAr $sendmacro ""
				setVar $ship_inc~twarpto $command
				gosub :ship_inc~twarp
				if ($twarpto < 0)
					clientMessage "Not safe to continue."
					halt
				end
			else	
				setVar $sendmacro $sendmacro & "m" & $command & "*yy"
			end
			goto :macroread
		end
		getWordPos $command $pos "TPAD_"
		if ($pos > 0)
			stripText $command "TPAD_"
			if ($init = 1) OR ($colo_safemode = "Yes")
				replaceText $sendmacro "_" " "
				send $sendmacro
				setVar $sendmacro ""
				send "b" $command "*"
				setTextTrigger noblind :noblind "No locating beam found for sector"
				setTextTrigger go :gogo "Locating beam pinpointed, TransWarp"
				setTextTrigger outafuel3 :outafuel2 "This planet does not have enough"
				pause

				:noblind
				killtrigger go
				killtrigger outafuel3
				if ($twarpto < 0)
					clientMessage "Not safe to continue."
					halt
				end

				:gogo
				killtrigger outafuel3
				killtrigger noblind
				send "y"
			else	
				setVar $sendmacro $sendmacro & "b" & $command & "*y"
			end
			goto :macroread
		end
		getWordPos $command $pos "EXPRESS_"
		if ($pos > 0)
			replaceText $sendmacro "_" " "
			send $sendmacro
			setVAr $sendmacro ""
			stripText $command "EXPRESS_"
			setVar $ship_inc~expressto $command
			gosub :ship_inc~express
			if ($expressto < 0)
				clientMessage "Not safe to continue"
				halt
			end
			goto :macroread
		end
		setVar $sendmacro $sendmacro & $command
		goto :macroread
	else
		replaceText $sendmacro "_" " "
		send $sendmacro
		gosub :SupGBot_inc~SupGBot_disableCommands
		send "@"
		waitFor "Average Interval Lag:"
		setVar $init 0
	end
	goto :loopcnter
end
echo ANSI_15 "*Colonization, completed.*"
if ($botloaded = 1)
	send "'(SupGColo): Script completed.*"
	waitFor "Message sent on sub-space channel"
	gosub :SupGBot_enableCommands
end
halt

:outacollies
waitOn "Trade Wars 2002 Version"
echo ANSI_15 "*Terra is out of colonists.*"
if ($botloaded = 1)
	send "'(SupGColo): Script complete, Terra is out of colonists.*"
	waitFor "Message sent on sub-space channel"
	gosub :SupGBot_inc~SupGBot_enableCommands
end
halt

:outafuel
waitOn "Trade Wars 2002 Version"
:outafuel2
echo ANSI_15 "*Out of fuel.*"
if ($botloaded = 1)
	send "'(SupGColo): Script complete, Fuel source out of fuel.*"
	waitFor "Message sent on sub-space channel"
	gosub :SupGBot_inc~SupGBot_enableCommands
end
halt

:badplanet
waitOn "Trade Wars 2002 Version"
:badplanet2
echo ANSI_15 "*Bad colonization planet.*"
if ($botloaded = 1)
	send "'(SupGColo): Script complete, bad colonization planet.*"
	waitFor "Message sent on sub-space channel"
	gosub :SupGBot_inc~SupGBot_enableCommands
end
send "q"
halt



:getMethod
send "l" $colo_fuelplanet "*"
waitFor "Planet #"
setVar $xport_power 0
setTextLineTrigger xport :power "TransPort power"
setTextTrigger noxport :nopower "Planet command"
setTextTrigger nofuelplanet :nofuelplanet "That planet is not in this sector."
pause

:power
killtrigger nofuelplanet
killtrigger noxport
getText CURRENTLINE $xport_power "power = " " hops"

:nopower
killtrigger nofuelplanet
killtrigger xport
send "Q"

getDistance $there $cursec 1
if (($turns = "Unlimited") OR ($tpw = 1) OR ($xport_power < $there)) AND ($twarp = 1)
	setVar $colo_method "Twarp"
	return
end
if ($xport_power >= $there)
	setVar $colo_Method "Tpad"
	return
end
if ($twarp = 0)
	if ($botloaded = 1)
		send "'(SupGColo): Cannot find acceptable method for colonization.*"
		waitFor "Message sent on sub-space channel"
		gosub :SupGBot_enableCommands
		halt
	end
	setVar $colo_Method "Express"
	return
end

:nofuelplanet
clientmessage "Fuel planet not in this sector, shutting down..."
if ($botloaded)
	send "'(SupGColo): Fuel planet not in this sector, shutting down.*"
	gosub :SupGBot_inc~SupGBot_enableCommands
end
send "q"
halt

:getFuelLoop
#do calculations
#-=Variable Key=-
#$fuel - amount of fuel for one trip
#$holdtrip - number of trips (back and forth) the ship can hold in fuel
#$index - number of trips (for testing)
#$subfuel - amount of fuel to subtract from the empty holds (to figure room for colos)
#$there - distance from base to 1
#$back - distance from 1 to base
#$usedore - amount of holds that are freed by used ore hoppin to 1
#$holdsore - amount of ore needed for pickup
#$freeholds - total number of freeholds to fill with collies
#$usedToore - amount of ore used to get to terra
#$usedBackore - amount of ore used to get home from terra
#$colosPicked - total amount of colos collected per loop
#$turns_trip - total amout of turns it takes for one full loop (loop is defined as the time between ore pickups)
#$numloops - number of loops the script can run with the given amout of turns
#$best - variable that holds the value of the best amount of colos (for comparison)
#$best_index - contains the value of the most economical amount of trips of ore to take
#$total_colos - total number of colos you will accumulate through all turns
 
getDistance $there $cursec 1
getDistance $back 1 $cursec
setVar $fuel 0
if ($colo_method = "Twarp")
	setVar $fuel (($back * 3) + ($there *3))
else
	setVar $fuel ($back * 3)
end
setVar $holdtrip ($holds / $fuel)
setVar $index 0
setVar $usedToOred ($there * 3)
setVar $usedBackore ($back * 3)

:index
setVar $loop 0
setVar $turns_trip 0
setVar $colosPicked 0
if ($index < $holdtrip)
   	add $index 1
    	setVar $holdsOre ($fuel * $index)
	setVar $freeHolds $holds
	subtract $freeHolds $holdsOre
	add $turns_trip 1
	:loop
	if ($loop < $index)
		add $loop 1
        	if ($colo_method = "Twarp")
			add $freeholds $usedToore
        		add $turns_trip $tpw
        	else
            		add $turns_trip 1
		end
        	add $turns_trip 1
		add $colosPicked $freeholds
        	add $freeholds $usedBackOre
        	add $turns_trip $tpw
		goto :loop
	end
	setVar $numloops ($colo_turnrun / $turns_trip)
	setVar $total_colos ($numloops * $colosPicked)
    	if ($index = 1)
		setVar $normalColo $total_colos
		setVar $best $total_colos
		setVar $best_index $index
    		setVar $best_numloops $numloops
	else
		if ($total_colos > $best)
			setVar $best $total_colos
			setVar $best_index $index
    			setVar $best_numloops $numloops
		else
			return
		end
	end
    	goto :index
end

:makeMacro
setVAr $macro ""
if ($colo_method = "Express")
	setVar $macro "EXPRESS_1 "
	if ($pscan = 1)
		setVar $macro $macro & "l__1*"
	else
		setVAr $macro $macro & "l__"
	end
	setVAr $macro $macro & "** EXPRESS_" & $cursec & " l_" & $colo_planet & "*__snl"
	if ($colo_product = "Fuel")
		setVar $macro $macro & "1"
	elseif ($colo_product = "Organics")
		setVar $macro $macro & "2"
	else
		setVar $macro $macro & "3"
	end
	setVar $macro $macro & "**__q"
	setVar $macro $macro & " END"
	return
end
if ($turns = "Unlimited")
	setVar $best_index 1
end

if ($align >= 1000)
	setVar $jump 1
else
	gosub :nearfig_inc~fig_list
	setVar $nearfig_inc~origsec 1
	gosub :nearfig_inc~closefig
	setVar $jump $nearfig_inc~result
	if ($jump = "-1")
		getInput $jump "Unable to locate a jump fig, please enter one."
	end
	:nearjump
	echo ANSI_15 "Nearest fighter to 1 is " $jump ", would you like to use this for a jump fig?"
	getConsoleInput $choice singlekey
	lowerCase $choice
	if ($choice = "n")
		getInput $jump "Please enter a jump fighter."
	elseif ($choice = "y")
		goto :contmacro
	else
		goto :nearjump
	end
		
end
:contmacro
getDistance $there $cursec $jump
getDistance $back 1 $cursec

if ($colo_method = "Twarp") AND ($there > 1)
	setVar $fuel ((($back * 3) + ($there * 3)) * $best_index)
else
	setVar $fuel (($back * 3) *  $best_index)
end
if ($twarp = 0)
	setVar $fuel 0
	setVar $leave $holds
else
	setVar $leave ($holds - $fuel)
end
if ($colo_fuelsource = "Port") AND ($colo_method <> "Express")
	setVar $macro "pt__***l_" & $colo_fuelplanet & "*__tnl1" & $leave & "*"
elseif ($colo_fuelsource = "Planet") AND ($colo_method <> "Express")
	send  "l " $colo_fuelplanet "*  tnt1" $fuel "*"
end
setVar $slappy 0
:slappy
if ($slappy < $best_index)
	add $slappy 1
	if ($colo_method = "Tpad")
		setVar $macro $macro & "c"
	elseif ($colo_method = "Twarp")
		setVar $macro $macro & "q"
	end
	if ($there > 1) AND ($colo_method = "Twarp")
		setVar $macro $macro & " TWARP_" & $jump & " "
	elseif ($there = 1) AND ($colo_method = "Twarp")
		setVar $macro $macro & " EXPRESS_" & $jump & " "
	elseif ($colo_method = "Tpad")
		setVar $macro $macro & " TPAD_" & $jump & " "
	end
	if ($jump <> 1)
		setVar $macro $macro & " EXPRESS_1 "
	end
	if ($pscan = 1)
		setVar $macro $macro & "l__1*__"
	else
		setVAr $macro $macro & "l__"
	end
	if ($twarp = 1)
		setVAr $macro $macro & "** TWARP_" & $cursec & " l_" & $colo_planet & "*__snl"
	else
		setVar $macro $macro & "** EXPRESS_" & $cursec & " l_" & $colo_planet & "*__snl"
	end
	if ($colo_prod = "Fuel")
		setVar $macro $macro & "1"
	elseif ($colo_prod = "Organics")
		setVar $macro $macro & "2"
	else
		setVar $macro $macro & "3"
	end
	setVar $macro $macro & "**__"
	if ($colo_fuelsource = "Planet") AND (($colo_fuelplanet <> 0) AND ($colo_fuelplanet <> $colo_planet)) AND ($colo_method <> "Express")
		setVar $macro $macro & "ql_" & $colo_fuelplanet & "*__"
	end
	goto :slappy
end
if ($colo_fuelsource = "Planet") AND ($colo_method <> "Express") AND ($twarp = 1)	
	setVar $macro $macro & "tnt1" & $fuel & "*"
end
if ($colo_fuelsource = "Port") AND ($colo_method <> "Express")
	setVAr $macro $macro & "q"
end
setVar $macro $macro & " END"
return
halt

:save
setVar $SupGColo_Prod $colo_Prod
setVar $SupGColo_method $colo_method
setVar $SupGColo_Pnum $colo_planet
setVar $SupGColo_fuelplanet $colo_fuelplanet
setVar $SupGColo_fuelsource $colo_fuelsource
setVar $SupGColo_safemode $colo_safemode

saveVar $SupGColo_Prod
saveVar $SupGColo_method
saveVar $SupGColo_Pnum
saveVar $SupGColo_fuelplanet
saveVar $SupGColo_fuelsource
saveVar $SupGColo_safemode

setVar $SupGColo 1
saveVar $supGColo
return



include "supginclude\gameinfo_inc"
include "supginclude\signature_inc"
include "supginclude\nearfig_inc"
include "supginclude\ship_inc"
include "supginclude\SupGBot_inc"