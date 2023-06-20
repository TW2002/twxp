cutText CURRENTLINE $location 1 7
if ($location <> "Command")
	clientMessage "This script must be run from the game Command prompt."
    halt
end
processin 1 "SUPGSCRIPT_AUTO_OFF"
setVar $init 1
setVar $startBest 95
setVar $startWorst "142"
setVar $startWorstf "135"
gosub :ship_inc~setVoids
waitFor "Command [TL="
gosub :gameinfo_inc~quikstats
setVar $max_holds $gameinfo_inc~quikstats[HLDS]
setVar $start_cash $gameinfo_inc~quikstats[CREDS]
loadVar $SupGBuydown
if ($SupGBuydown)
	loadVar $SupGBuy_Prod
	loadVar $SupGBuy_Amnt
	loadVar $SupGBuy_Pnum
	loadVar $SupGBuy_Hagg
	loadVar $SupGBuy_Turn
	setVar $buyProd $SupGBuy_Prod
	setVar $buyAmnt $SupGBuy_Amnt
	setVar $buyPnum $SupGBuy_Pnum
	setVar $buyHagg $SupGBuy_Hagg
	setVar $turnLimit $SupGBuy_Turn
else
	setVar $buyProd "Fuel"
	setVar $buyAmnt 0
	setVar $buyPnum 0
	setVar $buyHagg "Best"
	setVar $turnLimit 10
end

loadVar $SupGBot_Script
if ($SupGBot_Script)
	setVAr $SupGBot_Script 0
	saveVar $SupGBot_Script
	gosub :SupGBot_inc~SupGBot_loadparms

	setVar $buyProd $SupGBot_inc~parm1
	setVar $buyAmnt $SupGBot_inc~parm2
	setVAr $buyHagg $SupGBot_inc~parm3
	setVar $buyPnum $SupGBot_inc~parm4
	
	setVar $botloaded 1
	setVar $turnLimit 10

	if ($buyProd = 1)
		setVar $buyProd "Fuel"
	elseif ($buyProd = 2)
		setVar $buyProd "Organics"
	elseif ($buyProd = 3)
		setVar $buyProd "Equipment"
	else
		send "'(SupGBuydown): Unable to run script, invalid product type.*"
		gosub :ship_inc~clearVoids
		halt
	end

	if ($buyAmnt < 0)
		send "'(SupGBuydown): Unable to run script, invalid amount.*"
		gosub :ship_inc~clearVoids
		halt
	end
	lowercase $buyHagg
	if ($buyHagg = "2")
		setVar $buyHagg "Best"
	elseif ($buyHagg = "0")
		setVar $buyHagg "No Haggle"
	elseif ($buyHagg = "1")
		setVar $buyHagg "Worst"
	else
		send "'(SupGBuydown): Unable to run script, invalid haggle type.*"
		gosub :ship_inc~clearVoids
		halt
	end
	send "'(SupGBuydown): script loaded by SupGBot - buying: " $buyprod ", haggle: " $buyhagg "*"
	
	gosub :SupGBot_inc~SupGBot_disableCommands
	waitFor "Bot Commands Disabled While Running Script"

	goto :top
end
gosub :save
:menu
echo "[2J"
:errmenu
setVar $signature_inc~scriptName "SupGBuydown"
setVar $signature_inc~version "1.e"
setVar $signature_inc~date "04/02/04"
gosub :signature_inc~signature
echo ANSI_15 "SupGBuydown Settings for " GAMENAME "*"
echo ANSI_14 "1." ANSI_15 " Product               " ANSI_10 "["
echo ANSI_6 $buyProd
echo ANSI_10 "]*"
echo ANSI_14 "2." ANSI_15 " Turn Limit            " ANSI_10 "["
echo ANSI_6 $turnlimit
echo ANSI_10 "]*"
echo ANSI_14 "3." ANSI_15 " Amount to Buy         " ANSI_10 "["
if ($buyAmnt = 0)
	echo ANSI_6 "All"
else
	echo ANSI_6 $buyAmnt
end
echo ANSI_10 "]*"
echo ANSI_14 "4." ANSI_15 " Haggle                " ANSI_10 "["
echo ANSI_6 $buyHagg
echo ANSI_10 "]*"
echo ANSI_14 "5." ANSI_15 " Planet Number         " ANSI_10 "["
if ($buyPnum = 0)
	echo ANSI_6 "Any"
else
	echo ANSI_6 $buyPnum
end
echo ANSI_10 "]*"
echo ANSI_5 "*Press the number of the option you*wish to change, or press" ANSI_14 " C" ANSI_5 " to continue.**"
getConsoleInput $choice singlekey
lowercase $choice
if ($choice = 1)
	if ($buyProd = "Fuel")
		setVar $buyProd "Organics"
	elseif ($buyProd = "Organics")
		setVar $buyProd "Equipment"
	else
		setVAr $buyProd "Fuel"
	end
elseif ($choice = 2)
	getInput $turnLimit "Enter Turn Limit"
	isNumber $chk $turnLimit
	if ($chk = 0)
		setVar $turnLimit 50
	end
elseif ($choice = 3)
	getInput $buyAmnt "Enter Amount to Buy"
	isNumber $chk $buyAmnt
	if ($chk = 0) OR ($buyAmnt < 0)
		setVar $buyAmnt 0
	end
elseif ($choice = 4)
	if ($buyHagg = "Best")
		setVar $buyHagg "No Haggle"
	elseif ($buyHagg = "No Haggle")
		setVar $buyHagg "Worst"
	else
		setVAr $buyHagg "Best"
	end
elseif ($choice = 5)
	getInput $buyPnum "Enter Planet Number (0 for first planet on list)"
	isNumber $chk $buyPnum
	if ($chk = 0) OR ($buyPnum < 0)
		setVar $buyPnum 0
	end
elseif ($choice = "c")
	:bot_cont
	gosub :save
	setVAr $init 1
	goto :top
else
	goto :menu	
end
goto :menu

:top
if ($turnlimit > 0)
	setVar $turnsleft $gameinfo_inc~quikstats[TURNS]
else
	setVar $turnsLeft 66000
end

send "cr*"
waitFor "Commerce report for"
setTextLineTrigger fuel :bd_fuel "Fuel Ore"
setTextLineTrigger orgs :bd_orgs "Organics"
setTextLineTrigger equi :bd_equi "Equipment"
pause

:bd_fuel
getWord CURRENTLINE $bd_FuelonPort 4
pause

:bd_orgs
getWord CURRENTLINE $bd_OrgsonPort 3
pause

:bd_equi
getWord CURRENTLINE $bd_EquionPort 3
send "q"

:bd_chkHolds
if ($commands~inc~quikstats[ORE] > 0) OR ($gameinfo_inc~quikstats[ORG] > 0) OR ($gameinfo_inc~quikstats[EQU] > 0) OR ($gameinfo_inc~quikstats[COL] > 0)
	gosub :dropProd
end
if ($buyProd = "Fuel")
	setVAr $prodOnPort $bd_FuelonPort
elseif ($buyProd = "Organics")
	setVAr $prodOnPort $bd_OrgsonPort
else
	setVAr $prodOnPort $bd_EquionPort
end
if ($prodOnPort < $buyAmnt)
	if ($botloaded)
		send "'(SupGBuydown): There isn't that much product on the port, switching to buy All product mode*"
	end
	setVar $buyAmnt $prodOnPort 
else
	if ($buyAmnt = 0)
		setVar $buyAmnt $prodOnPort 
	end
end
setVar $rounds (($buyAmnt / $max_holds) + 1)
setVAr $loop 0
while ($loop < $rounds)
	add $loop 1
	:bd_port
	if ($init = 1)
		send "PT"
		waitFor "We are selling up to"
		setVar $sayno 0
		:bd_chkProd
		setTextTrigger prod :bd_portsells "do you want to buy"
		setTextTrigger noprod :bd_nosell "Command [TL="
		pause
		
		:bd_portsells
		killtrigger noprod
		getWord CURRENTLINE $sellingProd 5
		if ($sellingProd <> $buyProd)
			send "0*"
			add $sayno 1
			goto :bd_chkProd
		else
			send "*"
		end
	else
		setVar $mac "pt  "
		if ($sayno = 0)
			setVar $mac $mac & "*"
		elseif ($sayno = 1)
			setVar $mac $mac & "0**"
		else
			setVar $mac $mac & "0*0**"
		end
		send $mac
	end
	if ($buyHagg = "Best")
		setVar $haggle_inc~multiplier $startBest
	elseif ($buyHagg = "No Haggle")
		send "*"
		goto :bd_finHag
	else
		if ($buyProd = "Fuel")
			setVar $haggle_inc~multiplier $startWorstf
		else
			setVar $haggle_inc~multiplier $startWorst
		end
	end
	:bd_backhaggle
	waitFor "Agreed,"
	gosub :haggle_inc~haggle
	gosub :chkturns
	if ($haggle_inc~nocred = 1)
		if ($botloaded)
			send "'(SupGBuydown): I don't have enough credits to continue*"
			waitFor "Message sent on sub-space channel"
			gosub :SupGBot_inc~SupGBot_enableCommands
		end
		echo ANSI_15 "*Not enough credits*"
		gosub :ship_inc~clearVoids
		halt
	end
	if ($haggle_inc~ni = 1)
		add $ninums 1
		if ($ninums > 2)
			if ($buyHagg = "Best")
				add $startBest 1
				echo ANSI_15 "*Auto-adjusting Haggle Factor to get less 'Not Interesteds*"
			else
				subtract $startWorst 1
				subtract $startWorstf 1
				echo ANSI_15 "*Auto-adjusting Haggle Factor to get less 'Not Interesteds*"
			end
		end
		goto :bd_port
	else
		if ($ninums > 0)
			subtract $ninums 1
		end
	end
	if ($haggle_inc~midhag = 0)
		add $nomid 1
		if ($nomid > 2)
			if ($buyHagg = "Best")
				if ($botLoaded)
					send "'(SupGBuydown): Auto-adjust, raising haggle factor by 1 percent*"
				else
					echo ANSI_15 "*Auto-adjusting Haggle Factor to get more mid haggles*"
				end
				subtract $startBest 1
			else
				if ($botLoaded)
					send "'(SupGBuydown): Auto-adjust, lowering haggle factor by 1 percent*"
				else
					echo ANSI_15 "*Auto-adjusting Haggle Factor to get more mid haggles*"
				end
				add $startWorst 1
				add $startWorstf 1
			end
			setVar $nomid 0
		end
	elseif ($haggle_inc~midhag > 0)
		if ($nomid > 0)
			subtract $nomid 1
		end
	else
		if ($botLoaded)
			send "'(SupGBuydown): I don't have enough credits to continue*"
			waitFor "Message sent on sub-space channel"
			gosub :SupGBot_inc~SupGBot_enableCommands
		end
		echo ANSI_15 "*Not enough credits*"
		gosub :ship_inc~clearVoids
		halt
	end
	:bd_finHag
	if ($buyPnum <> 0)
		setVar $init 0
	end
	gosub :dropProd
	gosub :SupGBot_inc~SupGBot_disableCommands
end
send "0*  @"
waitFor "Average Interval Lag:"
gosub :gameinfo_inc~quikstats
setVar $end_cash $gameinfo_inc~quikstats[CREDS]
setVar $spent ($start_cash - $end_cash)
setVar $buyAmnt ($rounds * $max_Holds)
gosub :ship_inc~clearVoids
if ($botloaded)
	send "'(SupGBuydown): Completed - " $buyAmnt " " $buyProd " for " $spent " credits.*"
	waitFor "Message sent on sub-space channel"
	gosub :SupGBot_inc~SupGBot_enableCommands
else
	echo ANSI_15 "*Complete - " $buyAmnt " " $buyProd " for " $spent " credits.**"
end
halt

:dropProd
if ($init = 1)
	if ($buyPnum = 0)
		send "l"
		setTextLineTrigger pnum :bd_pnum "   <"
		setTextTrigger onpl :bd_onpl "Planet #"
		pause
	
		:bd_pnum 
		killtrigger onpl
		getText CURRENTLINE $buyPnum "<" ">"
		stripText $buyPnum " "
		send $buyPnum "*"

		:bd_onpl
		killtrigger pnum
		getWord CURRENTLINE $buyPnum 2
		stripText $buyPnum "#"
	else
		send "l  " $buyPnum "*  "
	end
	send "tnl1*tnl2*tnl3*snl1*q"
else
	setVar $mac "l  " & $buyPnum & "*  "
	if ($buyProd = "Fuel")
		setVar $mac $mac & "tnl1*q"
	elseif ($buyProd = "Organics")
		setVar $mac $mac & "tnl2*q"
	else
		setVar $mac $mac & "tnl3*q"
	end
	send $mac
end
return




halt
include "supginclude\signature_inc"
include "supginclude\SupGBot_inc"
include "supginclude\gameinfo_inc"
include "supginclude\ship_inc"
include "supginclude\haggle_inc"

:save
setVar $SupGBuy_Prod $buyProd 
setVar $SupGBuy_Amnt $buyAmnt
setVar $SupGBuy_Pnum $buyPnum
setVar $SupGBuy_Hagg $buyHagg
setVar $SupGBuy_turn $turnlimit

saveVar $SupGBuy_Prod
saveVar $SupGBuy_Amnt
saveVar $SupGBuy_Pnum
saveVar $SupGBuy_Hagg
saveVar $SupGBuy_Turn

setVar $SupGBuydown 1
saveVar $supGBuydown
return

:bd_nosell
killtrigger prod
if ($botloaded)
	send "'(SupGBuydown): This port is not selling any " $buyProd ".*"
	waitFor "Message sent on sub-space channel"
	gosub :SupGBot_inc~SupGBot_enableCommands
	halt
else
	echo ANSI_15 "*Script Completed.*"
	gosub :ship_inc~clearVoids
	halt
end

:chkturns
subtract $turnsleft 1
if ($turnsleft < $turnLimit)
	echo ANSI_15 "Script Complete*"
	gosub :ship_inc~clearVoids
	if ($botloaded)
		send "'(SupGBuydown): Script completed, turn limit hit.*"
		waitFor "Message sent on sub-space channel"
		gosub :SupGBot_inc~SupGBot_enableCommands
	end
	halt
end
return