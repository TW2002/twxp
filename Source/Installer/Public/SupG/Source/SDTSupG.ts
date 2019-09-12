setVar $version "1.g"
#Turn off AutoHaggle/Steal on SupGQuikPanel (if running)
processin 1 "SUPGSCRIPT_AUTO_OFF"

#check prompt
cutText CURRENTLINE $location 1 12
if ($location <> "Command [TL=")
  clientMessage "This script must be run from the command prompt"
  halt
end
#initialize Variables
setVar $numships 1
setVar $init 1
gosub :gameinfo_inc~quikstats
setVar $turns $gameinfo_inc~quikstats[TURNS]
setVar $startTurns $turns
setVar $ship[$numships] $gameinfo_inc~quikstats[SHIP]
setVar $startcash $gameinfo_inc~quikstats[CREDS]
setVar $exp $gameinfo_inc~quikstats[EXP]
setVar $cursec $gameinfo_inc~quikstats[SECT]
setVar $curship 1
if ($gameinfo_inc~quikstats[ALN] > "-100")
	send "'(SupGSDT): I cannot run this script, I am not evil enough*"
	halt
end

#load preferences
loadVar $SupGsdtSaved
loadVar $SupGBot_Script
if ($SupGsdtSaved)
	loadVar $quik_sfactor
	loadVar $sdt_turnLimit
	loadVar $sdt_autoUpgrade
	loadVar $furb_Ship
	loadVar $furb_fakeShip
	loadVar $sdt_fastMode
	loadVar $quik_lsteal
	loadVar $quik_lbust
else
	if ($SupGBot_Script)
		send "'(SupGSDT): Unable to run script, no settings saved for script.*"
		setVar $SupGBot_Script 0
		saveVar $SupGBot_Script
		halt
	end
	loadVar $quikSaved
	if ($quikSaved)
		loadVar $quik_lsteal
		loadVar $quik_lbust
		loadVar $quik_sfactor
	else
		setVar $quik_sfactor 30
	end
	setVar $sdt_turnLimit 20
	setVar $sdt_autoUpgrade "On"
	setVar $sdt_fastMode "Off"
	loadVar $furbSaved
	if ($furbsaved)
		loadVar $furb_Ship
		loadVar $furb_fakeShip
	else
		gosub :shipinfo_inc~furbFinder
		setVar $furb_Ship $shipinfo_inc~bestShip
		setVAr $furb_fakeShip $shipinfo_inc~bestFakeShip
	end
end

setVar $autoUpgrade $sdt_autoUpgrade
setVar $sfactor $quik_sfactor
setVar $turnLimit $sdt_turnLimit
setVar $furbship $furb_Ship
setVar $fastMode $sdt_fastMode
setVar $lastSteal $quik_lsteal
setVar $lastBust $quik_lbust

gosub :save

#check if this script has been loaded by SupGBot
if ($SupGBot_Script)
	setVAr $SupGBot_Script 0
	saveVar $SupGBot_Script
	gosub :SupGBot_inc~SupGBot_loadparms

	setVar $parm1 $SupGBot_inc~parm1
	setVar $parm2 $SupGBot_inc~parm2
	setVar $parm3 $SupGBot_inc~parm3
	setVar $parm4 $SupGBot_inc~parm4
	
	setVar $botloaded 1

	if ($parm1 > 0)
		add $numships 1
		setVar $ship[2] $parm1
	else
		goto :set_fstmode
	end
	
	if ($parm2 > 0)
		add $numships 1
		setVar $ship[3] $parm2
	else
		goto :set_fstmode
	end
	
	if ($parm3 > 0)
		add $numships 1
		setVar $ship[4] $parm3
	else
		goto :set_fstmode
	end
	
	if ($parm4 > 0)
		add $numships 1
		setVar $ship[5] $parm4
	else
		goto :set_fstmode
	end

	:set_fstmode
	send "'(SupGSDT): Script Loaded by SupGBot - Running in Slow(safe) mode, with saved settings*"
	gosub :SupGBot_inc~SupGBot_disableCommands
	waitFor "Bot Commands Disabled While Running Script"
	goto :bot_cont
end

getInput $pnumber "Enter planet number for current ship (0 for auto)"
isNumber $chk $pnumber
if ($chk = 1)
	if ($pnumber > 1)
		setVar $pnum[$numships] $pnumber
	else
		setVar $pnum[$numships] "Auto"
	end
else
	setVar $pnum[$numships] "Auto"
end

#draw menu
:menu
echo "[2J"
:errmenu
setVar $signature_inc~scriptName "SupGSDT"
setVar $signature_inc~version $version
setVar $signature_inc~date "03/04/04"
gosub :signature_inc~signature
echo ANSI_15 "SupGSDT Settings for " GAMENAME "*"
echo ANSI_14 "1." ANSI_15 " Steal Factor          " ANSI_10 "["
echo ANSI_6 $sfactor
echo ANSI_10 "]*"
echo ANSI_14 "2." ANSI_15 " Turn Limit            " ANSI_10 "["
echo ANSI_6 $turnlimit
echo ANSI_10 "]*"
echo ANSI_14 "3." ANSI_15 " Auto Upgrade Ports    " ANSI_10 "["
echo ANSI_6 $autoUpgrade
echo ANSI_10 "]*"
echo ANSI_14 "4." ANSI_15 " Fast Mode             " ANSI_10 "["
echo ANSI_6 $fastMode
echo ANSI_10 "]*"
echo ANSI_14 "5." ANSI_15 " Add Ship Number       " ANSI_10 "["
setVar $shipCnt 0
:shpCnter
if ($shipCnt < $numships)
	add $shipCnt 1
	if ($shipCnt > 1)
		echo ", "
	end
	echo ANSI_6 $ship[$shipCnt] ":" $pnum[$shipCnt]
	goto :shpCnter
end
echo ANSI_10 "]*"
echo ANSI_5 "*Press the number of the option you*wish to change, or press" ANSI_14 " C" ANSI_5 " to continue.**"
echo ANSI_10 "Furb Ship : " ANSI_15 $furbShip "*"
echo ANSI_10 "Fake Furb Ship : " ANSI_15 $furb_fakeShip "*"
echo ANSI_10 "Last Bust : " ANSI_15 $lastBust "*"
echo ANSI_10 "Last Steal : " 
if ($cursec = $lastSteal)
	echo ANSI_12
else
	echo ANSI_15
end
echo $lastSteal "*"
getConsoleInput $choice singlekey
lowercase $choice
if ($choice = 1)
	getInput $sfactor "Enter Steal Factor"
	isNumber $chk $sfactor
	if ($chk = 0)
		setVar $sfactor 21
	end
elseif ($choice = 2)
	getInput $turnLimit "Enter Turn Limit"
	isNumber $chk $turnLimit
	if ($chk = 0)
		setVar $turnLimit 50
	end
elseif ($choice = 3)
	if ($autoUpgrade = "Off")
		setVar $autoUpgrade "On"
	else
		setVar $autoUpgrade "Off"
	end
elseif ($choice = 4)
	if ($fastMode = "Off")
		setVar $fastMode "On"
	else
		setVar $fastMode "Off"
	end
elseif ($choice = 5)
	send "x"
	waitFor "Choose which ship to beam to"
	send "q"
	waitFor "Q"
	echo "*"
	getInput $snumber "Enter Ship Number"
	isNumber $chk $snumber
	if ($chk = 1)
		add $numships 1
		setVar $ship[$numships] $snumber
	else
		goto :menu
	end
	getInput $pnumber "Enter Planet Number (0 for auto)"
	isNumber $chk $pnumber
	if ($chk = 1)
		if ($pnumber > 1)
			setVar $pnum[$numships] $pnumber
		else
			setVar $pnum[$numships] "Auto"
		end
	else
		setVar $pnum[$numships] "Auto"
	end
elseif ($choice = "c")
	:bot_cont
	gosub :save
	goto :top	
end
goto :menu

:top
if ($lastSteal = $cursec) and ($botloaded = 0)
	echo ANSI_15 "**This is your last recorded steal, are you sure you wish to continue?"
	getConsoleInput $fake SINGLEKEY
	lowerCase $fake
	if ($fake = "y")
		send "'(SupGSDT): Bypassing last steal protection.*"
	else
		halt
	end
elseif ($lastSteal = $cursec) and ($botloaded = 1)
	send "'(SupGSDT): Last steal protection, halting script.*"
	gosub :SupGBot_inc~SupGBot_enableCommands
	halt
end
	
if ($numships < 2)
	clientMessage "Need at least 2 ships to run script."
	if ($botloaded = 1)
		send "'(SupGSDT): Script requires more than 1 ship to run*"
		halt
	end
	goto :errmenu
end

send "'SupGSDT ver. " $version " started with " $startTurns " turns and " $startcash " credits.*"
#start the Stealing

:sdt_steal
#set Avoids and get max holds amount in each ship
if ($init = 1)
	gosub :ship_inc~setVoids
	waitFor "<Computer deactivated>"
	waitFor "Command [TL="
	gosub :gameinfo_inc~quikstats
	if ($gameinfo_inc~quikstats[ORE] > 0) OR ($gameinfo_inc~quikstats[ORG] > 0) OR ($gameinfo_inc~quikstats[EQU] > 0) OR ($gameinfo_inc~quikstats[COL] > 0)
		gosub :sdt_drop
	end
	setVar $sect[$curship] $gameinfo_inc~quikstats[SECT]
	setVar $holds[$curship] $gameinfo_inc~quikstats[HLDS]
	gosub :sdt_check_product
end

:sdt_sport
if ($botloaded = 1)
	gosub :SupGBot_inc~SupGBot_disableCommands
end
setVar $faked 0
if ($init = 1)
	send "pr*s"
else
	send "pr*s  "
end
setTextTrigger fake :sdt_Fakebusted "Suddenly you're Busted!"
setTextTrigger ondock :sdt_cont "Which product?"
pause

:sdt_cont
killtrigger fake
setVar $maxhold ($exp / $sfactor)
send "3"

:sdt_thold
if ($maxhold > $holds[$curship])
	setVar $maxhold $holds[$curship]
end

setTextLineTrigger success :sdt_success "Success!"
setTextLineTrigger busted :sdt_busted "Suddenly you're Busted"
setTextLineTrigger upgrade :sdt_upgrade "There aren't that many holds"
send $maxhold "*"
pause

:sdt_upgrade
killtrigger success
killtrigger busted
gosub :sdt_chkturns
setVar $upgrade (($maxhold / 10) + 1)
#upgrades port enough for one steal, compensates for port regeneration.
send "o3" $upgrade "*q"
send "'(SupGSDT) : Ship - " $ship[$curship] " - Upgraded port by " $upgrade ".*" 
goto :sdt_sport

:sdt_success
killtrigger busted
killtrigger upgrade
setVar $last_steal $curship
setVAr $lastSteal $sect[$curship]
gosub :save
gosub :sdt_chkturns
setVar $addexp ($maxhold * 90)
if ($addexp < 1000)
	goto :norec
end
divide $addexp 1000
add $exp $addexp
gosub :sdt_drop
subtract $onport[$curship] $maxhold
if ($onport[$curship] <= 0)
	gosub :sdt_rhag
	setVar $onport[$curship] $onportbase[$curship]
end

:sdt_nxtship
gosub :nextship
goto :sdt_steal

:sdt_rhag
:pneg
send "'(SupGSDT): Selling, ship " $ship[$curship] "*"
setVar $phaggle_inc~sdt 1
setVar $phaggle_inc~pnum $pnum[$curship]
gosub :phaggle_inc~planet_neg
gosub :sdt_chkturns
if ($phaggle_inc~ni = 1)
	goto :sdt_rhag
end
return

:sdt_Fakebusted
setVar $faked 1
:sdt_busted
if ($faked = 1)
	setVar $furbship $furb_fakeShip
else
	setVar $furbship $furb_Ship
end
killtrigger success
killtrigger upgrade
killtrigger ondock
setVar $busted[$ship[$curship]] 1
add $busts 1
setVar $lastBust $sect[$curship]
setVar $lastSteal $sect[$curship]
gosub :sdt_chkturns
gosub :sdt_rhag
gosub :sdt_furb
setVar $furbShip $furb_ship
gosub :save
goto :sdt_nxtship

:sdt_norec
clientmessage "Not enough experience"
if ($botloaded = 1)
	send "'(SupGSDT): Not enough experience to continue*"
	gosub :SupGBot_inc~SupGBot_enableCommands
end
halt

:sdt_drop

if ($init = 1)
	if ($pnum[$curship] = "Auto") OR ($pnum[$curship] = 0)
		send "l"
		setVAr $pnum 0
		setTextLineTrigger pnum :sdt_pnum " <"
		setTextTrigger onpl :sdt_onpl "Planet #"
		pause
	
		:sdt_pnum 
		killtrigger onpl
		getText CURRENTLINE $plnum "<" ">"
		stripText $plnum " "
		send $plnum "*"	

		:sdt_onpl
		killtrigger pnum
		if ($plnum = 0)
			getWord CURRENTLINE $plnum 2
			stripText $plnum "#"
		end
		setVar $pnum[$curship] $plnum
	else
		send "l  " $pnum[$curship] "* "
	end	
	if ($gameinfo_inc~quikstats[ORE] > 0)
		send "tnl1*"
	end
	if ($gameinfo_inc~quikstats[ORG] > 0)
		send "tnl2*"
	end
	if ($gameinfo_inc~quikstats[COL] > 0)
		send "snl1*"
	end
	send "tnl3*q"
	return
else
	send "l  " $pnum[$curship] "*  tnl3*q"
	return
end
:nextship
setVar $bustable ($numships - 1)
if ($busts = $bustable)
	:bustlist
	send "@"
	waitFor "Average Interval Lag:"
	waitfor "Command [TL"
	gosub :gameinfo_inc~quikstats
	setVar $turns $gameinfo_inc~quikstats[TURNS]
	setVar $endCash $gameinfo_inc~quikstats[CREDS]
	setVar $turnsRan ($startTurns - $turns)
	setVar $profit ($endCash - $startCash)
	send "'*SupGSDT : Script complete, " $turns " turns left, ships :*"
	setVar $bl_loop 0
	:list_busts
	if ($bl_loop < $numships)
		add $bl_loop 1
		if ($busted[$ship[$bl_loop]] = 1)
			send " " $ship[$bl_loop] " - " $furbed[$bl_loop] "*" 
		end
		goto :list_busts
	end
	if ($busts = 0)
		send " No Busts.*"
	end
	if ($turnsRan > 0)
		setVar $cpt ($profit / $turnsRan)
	else
		setVar $cpt "No Turns Ran"
	end
	send "SupGSDT : Profit - " $profit ", Cash/Turn - " $cpt "*"
	send "*"
	if ($botloaded =1)
		gosub :SupGBot_inc~SupGBot_enableCommands
	end
	halt
end

:chk_nextship
if ($curship < $numships)
	add $curship 1
	if ($busted[$ship[$curship]] = 0) and ($last_steal <> $curship)
		if ($fastMode = "Off") or ($init = 1)
			setVar $ship_inc~xportto $ship[$curship]
			gosub :ship_inc~xport
			if ($ship_inc~xportto > 0)
				gosub :sdt_chkturns
				return
			elseif ($ship_inc~xportto = "-1")
				send "'SupGSDT : Out of turns, Unable to xport, halting script.*"
				goto :bustlist
			elseif ($ship_inc~xportto = "-2") or ($commands_inc~xportto = "-3") or ($commands_inc~xportto = "-5") or ($commands_inc~xportto = "-5")
				send "'SupGSDT : Ship not available, halting script.*"
				setVar $busted[$ship[$curship]] 1
				setVar $furbed[$curship] "Ship Unavailable - Not Busted"
				goto :bustlist
			elseif ($ship_inc~xportto = "-4")
				setVar $busted[$ship[$curship]] 1
				setVar $furbed[$curship] "Ship Out of Range - Not Busted"
				add $busts 1
				goto :nextship
			end
		else
			send "x  " $ship[$curship] "*  q"
			gosub :sdt_chkturns
			return
		end
	end
else
	setVar $init 0
	setVar $curship 0
end
goto :chk_nextship

:sdt_check_product
send "cr*"
setTextLineTrigger equip :sdt_equiponport "Equipment  Buying"
pause

:sdt_equiponport
send "q"
getWord CURRENTLINE $equip_perc 4
getWord CURRENTLINE $equip_trade 3
stripText $equip_perc "%"
setVar $equip_onport ((($equip_trade * 100) / $equip_perc) - $equip_trade)
echo "* " $equip_onport " "
if ($pnum[$curship] = "Auto") OR ($pnum[$curship] = 0)
	send "l"
	setTextLineTrigger pnum :chk_pnum "  <"
	setTextTrigger onpnum :chk_onpnum "Planet #"
	setTextLineTrigger onpl :chk_onpl "Equipment"
	pause

	:chk_onpnum
	killtrigger pnum
	getText CURRENTLINE $pnum[$curship] "#" " in"
	pause
	
	:chk_pnum
	killtrigger chk_onpnum
	getText CURRENTLINE $pnumb "<" ">"
	stripText $pnumb " "
	stripText $pnumblnum " "
	send $pnumb "*"
	setVar $pnum[$curship] $pnumb
	waitFor "Landing sequence engaged..."
	pause
else
	send "l  " $pnum[$curship] "*"
	setTextLineTrigger onpl :chk_onpl "Equipment"
	pause
end
:chk_onpl
killtrigger pnum
getWord CURRENTLINE $equip_plnt 5
stripText $equip_plnt ","
setVar $upgradeAmnt (2000 - $equip_onport)
if ($equip_plnt < $upgradeAmnt)
	setVar $upgrade ((($upgradeAmnt - $equip_plnt) / 10) + 1)
else
	setVar $upgrade 0
end
send "q"

if ($upgrade > 0) and ($autoUpgrade = "On")
	setVar $port_inc~upg_prod 3
	setVar $port_inc~upg_amnt $upgrade
	gosub :port_inc~upgradePort
	if ($port_inc~upg_amnt = "-1")
		setVar $busted[$ship[$curship]] 1
		setVar $furbed[$curship] "Couldn't upgrade port - Not Busted"
		add $busts 1
		goto :nextship
	end
	send "'(SupGSDT) : Ship - " $ship[$curship] " - Upgraded port by " $upgrade ".*" 
	setVar $equip_onport (($upgrade * 10) + $equip_onport)
	setVar $onportbase[$curship] 2000
	setVar $onport[$curship] $equip_onport
else
	setVar $gotE ($equip_plnt + $equip_onport)
	if ($gotE >= 2250)
		subtract $gotE 250
	end
	setVar $onportbase[$curship] $gotE
	if ($equip_onport >= 250)
		setVar $gotEP ($equip_onport - 250)
	end
	setVar $onport[$curship] $gotEP
end
return

:sdt_furb
send "a"
waitFor "<Attack>"
:sdt_furb_trigger
setTextTrigger nofurb :sdt_nofurb "There is nothing here to attack."
setTextTrigger ship :sdt_chkship ") (Y/N) [N]?"
setTextTrigger nofurbs :sdt_nofurb "Command [TL="
pause

:sdt_chkship
killtrigger nofurb
killtrigger nofurbs
setVar $pos 0
getWordPos CURRENTLINE $pos $furbShip
if ($pos > 0)
	setTextTrigger gotholds :sdt_holds "You destroyed the ship"
	setTextTrigger corp :sdt_nofurb "SAFETY OVERRIDE ENGAGED!"
	setTextTrigger noholds :sdt_nofurb "Command [TL="
	send "y9*"
	pause
else
	send "n"
	goto :sdt_furb_trigger
end

:sdt_nofurb
killtrigger gotholds
killtrigger corp
killtrigger noholds
killtrigger nofurb
killtrigger ship
killtrigger nofurbs
if ($faked = 1)
	setVar $furbed[$curship] "Not Furbed - FAKE busted"
else
	setVar $furbed[$curship] "Not Furbed - Busted"
end
return

:sdt_holds
killtrigger gotholds
killtrigger corp
killtrigger noholds
killtrigger nofurb
killtrigger ship
killtrigger nofurbs
if ($faked = 1)
	setVar $furbed[$curship] "Furbed - Fake Bust"
else
	setVar $furbed[$curship] "Furbed - Busted"
end
return

:sdt_chkturns
subtract $turns 1
if ($turns <= $turnLimit)
	goto :bustlist
end
return

:save
setVar $sdt_autoUpgrade $autoUpgrade
setVar $quik_sfactor $sfactor
setVar $sdt_turnLimit $turnLimit
setVar $furb_ship $furbShip
setVar $sdt_fastMode $fastMode
setVar $quik_lsteal $lastSteal
setVar $quik_lbust $lastBust


saveVar $quik_sfactor
saveVar $sdt_autoUpgrade
saveVar $sdt_turnLimit
saveVar $furb_Ship
saveVar $sdt_fastMode
saveVar $furb_fakeShip
saveVar $quik_lsteal
saveVar $quik_lbust

setVar $SupGsdtSaved 1
saveVar $SupGsdtSaved
return


include "supginclude\signature_inc"
include "supginclude\ship_inc"
include "supginclude\gameinfo_inc"
include "supginclude\phaggle_inc"
include "supginclude\shipinfo_inc"
include "supginclude\port_inc"
include "supginclude\supgbot_inc"