
cutText CURRENTLINE $location 1 7
if ($location <> "Citadel") AND ($location <> "Planet ")
        clientMessage "This script must be run from the citadel or planet prompt."
    #    halt
end
processin 1 "SUPGSCRIPT_AUTO_OFF"
loadVar $SupGPSOSaved
loadVar $SupGBot_Script
if ($SupGPSOSaved)
	loadVar $pso_sell
	loadVar $pso_fuelBuy
	loadVar $pso_minPerc
	loadVar $pso_fuelLimit
else
	if ($SupGBot_Script)
		send "'(SupGWorldPTrade): unable to run script, no settings saved for script.*"
		setVar $SupGBot_Script 0
		saveVar $SupGBot_Script
		halt
	end
	setVar $pso_sell "Equipment"
	setVar $pso_fuelBuy "Off"
	setVar $pso_minPerc 95
	setVar $pso_fuelLimit 10000
end

gosub :save
loadVar $SupGBot_Script
if ($SupGBot_Script)
	loadVar $supgbot_parm1
	loadVar $supgbot_parm2
	loadVar $supgbot_parm3
	loadVar $supgbot_parm4

	setVar $parm1 $supgbot_parm1
	setVar $parm2 $supgbot_parm2
	setVar $parm3 $supgbot_parm3
	setVar $parm4 $supgbot_parm4
		
	setVar $botloaded 1

	setVar $SupGBot_Script 0
	setVar $supgbot_parm1 0
	setVar $supgbot_parm2 0
	setVar $supgbot_parm3 0
	
	saveVar $supGBot_Script
	saveVar $supgbot_parm1
	saveVar $supgbot_parm2
	saveVar $supgbot_parm3
	saveVar $supgbot_parm4

end

#setVar $botloaded $botloaded_inc~botloaded
if ($botloaded = 1)
	setVar $pso_sell $parm1
	lowerCase $pso_sell
	if ($pso_sell <> "e") AND ($pso_sell <> "o") AND ($pso_sell <> "b")
		send "'(SupGWorldPTrade): unable to run script, incorrect parameters.*"
		halt
	end
	if ($pso_sell = "e")
		setVar $pso_sell "Equipmanet"
	elseif ($pso_sell = "o")
		setVar $pso_sell "Organics"
	else
		setVar $pso_sell "Both"
	end
	setVar $fuelParm $parm2
	if ($fuelParm <> "y") AND ($fuelParm <> "n")
		send "'(SupGWorldPTrade): unable to run script, incorrect parameters.*"
		halt
	else
		if ($fuelParm = "y")
			setVar $pso_fuelBuy "On"
		else
			setVar $pso_fuelBuy "Off"
		end
	end
	send "'(SupGWorldPTrade): script loaded by SupGBot - selling: " $pso_sell ", fuel buy: " $pso_fuelBuy "*"
	gosub :botloaded_inc~botDisableCommands
	waitFor "Bot Commands Disabled While Running Script"
	goto :bot_cont
end

:menu
echo "[2J"
:errmenu

setVar $signature_inc~scriptName "SupGWorldPtrade"
setVar $signature_inc~version "1.a"
setVar $signature_inc~date "09/25/03"
gosub :signature_inc~signature

echo ANSI_15 "SupGWorldPTrade Settings for " GAMENAME "*"
echo ANSI_14 "1." ANSI_15 " Product               " ANSI_10 "["
echo ANSI_6 $pso_sell
echo ANSI_10 "]*"
echo ANSI_14 "2." ANSI_15 " Buy Fuel              " ANSI_10 "["
echo ANSI_6 $pso_fuelBuy
echo ANSI_10 "]*"
echo ANSI_14 "3." ANSI_15 " Port Min. Percent     " ANSI_10 "["
echo ANSI_6 $pso_minPerc
echo ANSI_10 "]*"
echo ANSI_14 "4." ANSI_15 " Fuel Limit            " ANSI_10 "["
echo ANSI_6 $pso_fuelLimit
echo ANSI_10 "]*"
echo ANSI_5 "*Press the number of the option you*wish to change, or press" ANSI_14 " C" ANSI_5 " to continue.**"
getConsoleInput $choice singlekey
lowercase $choice
if ($choice = 1)
	if ($pso_sell = "Equipment")
		setVar $pso_sell "Organics"
	elseif ($pso_sell = "Organics")
		setVar $pso_sell "Both"
	else
		setVar $pso_sell "Equipment"
	end
elseif ($choice = 2)
	if ($pso_fuelBuy = "Off")
		setVar $pso_fuelBuy "On"
	else
		setVar $pso_fuelBuy "Off"
	end
elseif ($choice = 3)
	getInput $pso_minPerc "Minimum percentage of product for a good port?"
	isNumber $tst $pso_minPerc
	if ($tst)
		if ($pso_minPerc < 1)
			setVar $pso_minPerc 1
		end
		if ($pso_minPerc > 100)
			setVar $pso_minPerc 100
		end
	else
		setVar $pso_minPerc 95
	end
elseif ($choice = 4)
	getInput $pso_fuelLimit "Fuel Limit?"
	isNumber $tst $pso_fuelLimit
	if ($tst)
		if ($pso_fuelLimit < 0)
			setVar $pso_fuelLimit 0
		end
	else
		setVar $pso_fuelLimit 10000
	end
elseif ($choice = "c")
	:bot_cont
	setVar $origsell $pso_sell
	gosub :save
	goto :top
end
goto :menu


:top
gosub :gameinfo_inc~quikstats
setVar $startCash $gameinfo_inc~quikstats[CREDS]
setVar $cursec $gameinfo_inc~quikstats[SECT]
if ($location = "Citadel")
	send "q"
end
send "d"
setTextLineTrigger pnum :pnum "Planet #"
pause

:pnum
getWord CURRENTLINE $pnum 2
stripText $pnum "#"
setTextLineTrigger fuelinf :fuelinf "Fuel Ore"
pause

:fuelinf
getWord CURRENTLINE $fuel_Planet 6
stripText $fuel_Planet ","
getWord CURRENTLINE $fuel_Max 8
stripText $fuel_Max ","
setTextLineTrigger orginf :orginf "Organics"
pause

:orginf
getWord CURRENTLINE $org_Planet 5
stripText $org_Planet ","
setTextLineTrigger equinf :equinf "Equipment"
pause

:equinf
getword CURRENTLINE $equ_Planet 5
stripText $equ_Planet ","
send "q"
waitfor "Blasting off from"

gosub :createWorklist
if ($nearfig_inc~figList[$cursec] = 1)
	if (PORT.BUYFUEL[$cursec] = 0) AND ($pso_fuelBuy = "On")
		add $fuel_Planet PORT.FUEL[$cursec]
		if ($fuel_planet > $fuel_Max)
			setVar $fuel_planet $fuel_Max
		end
	end
	gosub :selloff
	setVar $nearfig_inc~figList[$cursec] 0
	if (PORT.BUYORG[$cursec] = 1) AND (($pso_sell = "Organics") OR ($pso_sell = "Both"))
		subtract $org_Planet PORT.ORG[$cursec]
		if ($org_Planet <= 0)
			if ($pso_sell = "Both")
				setVar $pso_sell "Equipment"
			else
				setVAr $last 1
			end
		end
	end
	if (PORT.BUYEQUIP[$cursec] = 1) AND (($pso_sell = "Equipment") OR ($pso_sell = "Both"))
		subtract $equ_Planet PORT.EQUIP[$cursec]
		if ($equ_Planet <= 0)
			if ($pso_sell = "Both")
				setVar $pso_sell "Organics"
			else
				setVAr $last 1
			end
		end
	end
end

:pso_loop
if ($last = 0)
	gosub :plotCourse
elseif ($last = 1)
	send "'(SupGWorldPTrade): script completed, product sold...*"
	if ($botloaded =1)
		gosub :botloaded_inc~botEnableCommands
	end
	halt
elseif ($last = 2)
	send "'(SupGWorldPTrade): script completed, fuel limit hit...*"
	if ($botloaded =1)
		gosub :botloaded_inc~botEnableCommands
	end
	halt
elseif ($last = 3)
	send "'(SupGWorldPTrade): script completed, out of ports...*"
	if ($botloaded =1)
		gosub :botloaded_inc~botEnableCommands
	end
	halt
end

send "'(SupGWorldPTrade): course plotted...*"
setVar $cnt 0
send "'*course listing:*"
:printCourse
if ($cnt < $courseLen)
	add $cnt 1
	setVar $port_inc~classchk PORT.CLASS[$course[$cnt]]
	gosub :port_inc~chkclass
	send "    " $course[$cnt] "(" $port_inc~class ") - " $hops[$cnt] " hops.  [" PORT.FUEL[$course[$cnt]] "/" PORT.ORG[$course[$cnt]] "/" PORT.EQUIP[$course[$cnt]] "]*"
	goto :printCourse
end
send "*"
setVar $pso_sell $origsell
setVAr $cnt 0
:warp
send "l" $pnum "*c"
if ($botloaded = 1)
	gosub :botloaded_inc~botDisableCommands
end
if ($cnt < $courseLen)
	add $cnt 1
	send "'(SupGWorldPTrade): warping to " $course[$cnt] "*"
	setVar $planet_inc~pwarpto $course[$cnt]
	gosub :planet_inc~pwarp
	if ($planet_inc~pwarpto > 0)
		send "qq"
		setVAr $cursec $course[$cnt]
		gosub :selloff
	elseif ($planet_inc~pwarpto = "-1")
		send "'(SupGWorldPTrade): planet does not have pwarp, shutting down...*"
		halt
	elseif ($planet_inc~pwarpto = "-2")
		send "'(SupGWorldPTrade): warp unsuccessful, continuing with next sector...*"
		send "qq"
		goto :pso_loop
	elseif ($planet_inc~pwarpto = "-3")
		send "'(SupGWorldPTrade): out of fuel, shutting down...*"
		halt
	end
	goto :warp
end
send "qq"
goto :pso_loop
halt


:plotCourse
send "'(SupGWorldPTrade): creating warp course...*"
setVAr $courseLen 0
:plot
if ($courseLen < 10)
	setVar $nearfig_inc~origsec $cursec
	setVar $nearfig_inc~command 0
	if ($pso_sell = "Equipment")
		setVar $nearfig_inc~command "fport"
		setVar $nearfig_inc~cpfuel "x"
		setVar $nearfig_inc~cporg "x"
		setVar $nearfig_inc~cpequip "b"
	elseif ($pso_sell = "Organics")
		setVar $nearfig_inc~command "fport"
		setVar $nearfig_inc~cpfuel "x"
		setVar $nearfig_inc~cporg "b"
		setVar $nearfig_inc~cpequip "x"
	end
	gosub :nearfig_inc~closefig
	if ($nearfig_inc~result > 0)
		getdistance $dist $cursec $nearfig_inc~result
		setVar $subFuel ($dist * 400)
		subtract $fuel_Planet $subFuel
		if ($fuel_Planet > $pso_fuelLimit)
			add $courseLen 1
			setVar $course[$courseLen] $nearfig_inc~result
			setVar $hops[$courseLen] $dist
			setVar $cursec $nearfig_inc~result
			setVar $nearfig_inc~figList[$cursec] 0
			if (PORT.BUYFUEL[$cursec] = 0) AND ($pso_fuelBuy = "On")
				add $fuel_Planet PORT.FUEL[$cursec]
				if ($fuel_planet > $fuel_Max)
					setVar $fuel_planet $fuel_Max
				end
			end
			if (PORT.BUYORG[$cursec] = 1) AND (($pso_sell = "Organics") OR ($pso_sell = "Both"))
				subtract $org_Planet PORT.ORG[$cursec]
				if ($org_Planet <= 0)
					if ($pso_sell = "Both")
						setVar $pso_sell "Equipment"
					else
						setVAr $last 1
						return
					end
				end
			end
			if (PORT.BUYEQUIP[$cursec] = 1) AND (($pso_sell = "Equipment") OR ($pso_sell = "Both"))
				subtract $equ_Planet PORT.EQUIP[$cursec]
				if ($equ_Planet <= 0)
					if ($pso_sell = "Both")
						setVar $pso_sell "Organics"
					else
						setVAr $last 1
						return
					end
				end
			end
			goto :plot
		else
			setVar $last 2
			return
		end
	else
		setVar $last 3
		return
	end
end
return
		
:createWorklist
if ($botloaded)
	gosub :nearfig_inc~figrefresh
	gosub :botloaded_inc~botDisableCommands
else
	gosub :nearfig_inc~fig_list
end
waitFor "(?=Help)? :"
if ($botloaded = 1)
	gosub :botloaded_inc~botDisableCommands
end
gosub :gameinfo_inc~update_cim
if ($botloaded = 1)
	gosub :botloaded_inc~botDisableCommands
end
send "'(SupGWorldPTrade): creating worklist...*"
setVar $cnt 10
:checkPorts
if ($botloaded = 1)
	gosub :botloaded_inc~botDisableCommands
end
if ($cnt < SECTORS)
	add $cnt 1
	setVar $addPort 0
	if ($pso_sell = "Equipment") OR ($pso_sell = "Both")
		if (PORT.PERCENTEQUIP[$cnt] >= $pso_minPerc) AND (PORT.BUYEQUIP[$cnt] = 1) AND ($nearfig_inc~figList[$cnt] = 1) 
			setVar $addPort 1
		end
	end
	if ($pso_sell = "Organics") OR ($pso_sell = "Both")
		if (PORT.PERCENTORG[$cnt] >= $pso_minPerc) AND (PORT.BUYORG[$cnt] = 1) AND ($nearfig_inc~figList[$cnt] = 1) 
			setVar $addPort 1
		end
	end
	if ($addPort = 1)
		add $ports 1
		setVar $goodPorts[$ports] $cnt
	end
	goto :checkPorts
end
setArray $nearfig_inc~figList SECTORS
setVar $cnt 0
:updateFiglist
if ($cnt < $ports)
	add $cnt 1
	setVar $nearfig_inc~figList[$goodPorts[$cnt]] 1
	goto :updateFiglist
end
send "'(SupGWorldPTrade): worklist created...*"
return

:save
saveVar $pso_sell
saveVar $pso_fuelLimit
saveVar $pso_fuelBuy
saveVar $pso_minPerc

setVar $SupGPSOSaved 1
saveVar $SupGPSOSaved
return

:selloff
setVar $phaggle_inc~selloff 1
setVar $phaggle_inc~pnum $pnum
setVar $phaggle_inc~sellprod $pso_sell
setVar $phaggle_inc~minperc $pso_minPerc
gosub :phaggle_inc~planet_neg
if ($cash_inc~ni = 1)
	goto :selloff
end
if ($pso_fuelBuy = "On") and (PORT.BUYFUEL[$cursec] = 0)
	setVar $maxholds $gameinfo_inc~quikstats[HLDS]
	send "l" $pnum "*"
	waitFor "Planet #"
	setTextLineTrigger fop :fop "Fuel Ore"
	pause

	:fop
	getWord CURRENTLINE $fuel_Planet 6
	stripText $fuel_planet ","
	send "tnl1*tnl2*tnl3*snl1*q"
	setVar $max2buy ($fuel_Max - $fuel_Planet)
	if (PORT.FUEL[$cursec] > $max2buy)
		setVAr $fuel2buy $max2buy
	else
		setVAr $fuel2buy PORT.FUEL[$cursec]
	end
	setVar $rounds ($fuel2buy / $maxholds)
	
	setVar $cnter 0
	send "'(SupGWorldPTrade): buying fuel...*"
	:buyfuel
	if ($cnter < $rounds)
		add $cnter 1
		send "pt***l" $pnum "*tnl1*q"
		goto :buyfuel
	end
end
return

include "supginclude\gameinfo_inc"
include "supginclude\phaggle_inc"
include "supginclude\nearfig_inc"
include "supginclude\planet_inc"
include "supginclude\signature_inc"
include "supginclude\port_inc"