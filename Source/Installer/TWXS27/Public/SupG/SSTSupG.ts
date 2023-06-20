
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
setVar $curship 1
if ($gameinfo_inc~quikstats[ALN] > "-100")
	send "'(SupGSDT): I cannot run this script, I am not evil enough*"
	halt
end

#load preferences
loadVar $SupGsstSaved
loadVar $SupGBot_Script
if ($SupGsstSaved)
	loadVar $quik_sfactor
	loadVar $sst_turnLimit
	loadVar $furb_Ship
	loadVar $furb_fakeShip
	loadVar $sst_fastMode
	loadVar $sst_jettison
else
	if ($SupGBot_Script)
		send "'(SupGSDT): Unable to run script, no settings saved for script.*"
		setVar $SupGBot_Script 0
		saveVar $SupGBot_Script
		halt
	end
	loadVar $quikSaved
	if ($quikSaved)
		loadVar $quik_sfactor
	else
		setVar $quik_sfactor 30
	end
	setVar $sst_turnLimit 50
	setVar $sst_fastMode "Off"
	setVar $sst_jettison "No"
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

setVar $sfactor $quik_sfactor
setVar $turnLimit $sst_turnLimit
setVar $furbship $furb_Ship
setVar $fastMode $sst_fastMode
setVar $jettison $sst_jettison

gosub :save

#check if this script has been loaded by SupGBot
if ($SupGBot_Script)
	loadVar $supgbot_parm1
	loadVar $supgbot_parm2
	loadVar $supgbot_parm3
	if ($supgbot_parm1 > 0)
		add $numships 1
		setVar $ship[2] $supgbot_parm1
	else
		goto :set_fstmode
	end
	if ($supgbot_parm2 > 0)
		add $numships 1
		setVar $ship[3] $supgbot_parm2
	else
		goto :set_fstmode
	end
	if ($supgbot_parm3 > 0)
		add $numships 1
		setVar $ship[4] $supgbot_parm3
	end
	:set_fstmode
	setVAr $fastMode "Off"
	setVar $SupGBot_Script 0
	setVar $supgbot_parm1 0
	setVar $supgbot_parm2 0
	setVar $supgbot_parm3 0
	
	saveVar $supGBot_Script
	saveVar $supgbot_parm1
	saveVar $supgbot_parm2
	saveVar $supgbot_parm3
	
	setVar $gameinfo_inc~cn9 "SPACE"
	gosub :gameinfo_inc~cn
	setVar $botloaded 1
	send "'(SupGSST): Script Loaded by SupGBot - Running in Slow(safe) mode, with saved settings*"
	processin 1 "SUPGBOT_DISABLE_COMMAND"
	goto :bot_cont
end

#draw menu
:menu
echo "[2J"
:errmenu
setVar $signature_inc~scriptName "The Unknown - SST w/Jet"
setVar $signature_inc~version "1.a"
setVar $signature_inc~date "02/24/04"
gosub :signature_inc~signature
echo ANSI_15 "SupGSST Settings for " GAMENAME "*"
echo ANSI_14 "1." ANSI_15 " Steal Factor          " ANSI_10 "["
echo ANSI_6 $sfactor
echo ANSI_10 "]*"
echo ANSI_14 "2." ANSI_15 " Turn Limit            " ANSI_10 "["
echo ANSI_6 $turnlimit
echo ANSI_10 "]*"
echo ANSI_14 "3." ANSI_15 " Fast Mode             " ANSI_10 "["
echo ANSI_6 $fastMode
echo ANSI_10 "]*"
echo ANSI_14 "4." ANSI_15 " Jet for Exp           " ANSI_10 "["
echo ANSI_6 $jettison
echo ANSI_10 "]*"
echo ANSI_14 "5." ANSI_15 " Add Ship Number       " ANSI_10 "["
setVar $shipCnt 0
:shpCnter
if ($shipCnt < $numships)
	add $shipCnt 1
	if ($shipCnt > 1)
		echo ", "
	end
	echo ANSI_6 $ship[$shipCnt]
	goto :shpCnter
end
echo ANSI_10 "]*"
echo ANSI_5 "*Press the number of the option you*wish to change, or press" ANSI_14 " C" ANSI_5 " to continue.**"
echo ANSI_10 "Furb Ship : " ANSI_15 $furbShip "*"
echo ANSI_10 "Fake Furb Ship : " ANSI_15 $furb_fakeShip "*"
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
	if ($fastMode = "Off")
		setVar $fastMode "On"
	else
		setVar $fastMode "Off"
	end
elseif ($choice = 4)
	if ($jettison = "Yes")
		setVAr $jettison "No"
	else
		setVar $jettison "Yes"
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
	end
elseif ($choice = "c")
	:bot_cont
	gosub :save
	goto :top
end
goto :menu

:top

if ($numships < 2)
	clientMessage "Need at least 2 ships to run script."
	if ($botloaded = 1)
		send "'(SupGSST): Script requires more than 1 ship to run*"
		halt
	end
	goto :errmenu
end


#start the Stealing

:sst_steal
#set Avoids and get max holds amount in each ship
if ($init = 1)
	gosub :ship_inc~setVoids
	waitFor "Command [TL="
	gosub :gameinfo_inc~quikstats
	if ($gameinfo_inc~quikstats[ORE] > 0) OR ($gameinfo_inc~quikstats[ORG] > 0) OR ($gameinfo_inc~quikstats[COL] > 0)
		send "jy"
	end
	if ($gameinfo_inc~quikstats[EQU] > 0)
		gosub :sst_sell
		gosub :sst_chkturns
	end
	setVar $holds[$curship] $gameinfo_inc~quikstats[HLDS]
end

:sst_sport
if ($botloaded = 1)
	processin 1 "SUPGBOT_DISABLE_COMMAND"
end
setVar $faked 0
send "pr*s"
setTextTrigger fake :sst_Fakebusted "Suddenly you're Busted!"
setTextLineTrigger ondock :sst_cont "Equipment  Buying"
pause

:sst_cont
killtrigger fake
setVar $maxhold ($exp / $sfactor)
send "3"

:sst_thold
if ($maxhold > $holds[$curship])
	setVar $maxhold $holds[$curship]
end

setTextLineTrigger success :sst_success "Success!"
setTextLineTrigger busted :sst_busted "Suddenly you're Busted"
setTextLineTrigger upgrade :sst_upgrade "There aren't that many holds"
send $maxhold "*"
pause

:sst_upgrade
killtrigger success
killtrigger busted
gosub :sst_chkturns
setVar $upgrade (($maxhold / 10) + 1)
#upgrades port enough for one steal, compensates for port regeneration.
send "o3" $upgrade "*q"
goto :sst_sport

:sst_success
killtrigger busted
killtrigger upgrade
gosub :sst_chkturns
setVar $last_steal $curship
setVar $addexp ($maxhold * 90)
if ($addexp < 1000)
	goto :norec
end
divide $addexp 1000
add $exp $addexp
gosub :sst_sell
gosub :sst_chkturns


:sst_nxtship
gosub :nextship
goto :sst_steal


:sst_Fakebusted
setVar $faked 1
:sst_busted
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
gosub :sst_chkturns
gosub :sst_furb
goto :sst_nxtship

:sst_norec
clientmessage "Not enough experience"
if ($botloaded = 1)
	send "'(SupGSST): Not enough experience to continue*"
end
halt

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
	send "'*SupGSST : Script complete, " $turns " turns left, busted out ships :*"
	setVar $bl_loop 0
	:list_busts
	if ($bl_loop < $numships)
		add $bl_loop 1
		if ($busted[$ship[$bl_loop]] = 1)
			send " " $ship[$bl_loop] " - " $furbed[$bl_loop] "*" 
		end
		goto :list_busts
	end
	if ($turnsRan > 0)
		setVar $cpt ($profit / $turnsRan)
	else
		setVar $cpt "No Turns Ran"
	end
	send "SupGSST : Profit - " $profit ", Cash/Turn - " $cpt "*"
	send "*"
	if ($botloaded =1)
		processin 1 "SUPGBOT_ENABLE_COMMAND"
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
				gosub :sst_chkturns
				return
			elseif ($ship_inc~xportto = "-1")
				send "'SupGSST : Out of turns, Unable to xport, halting script.*"
				goto :bustlist
			elseif ($ship_inc~xportto = "-2") or ($ship_inc~xportto = "-3") or ($ship_inc~xportto = "-5") or ($ship_inc~xportto = "-5")
				send "'SupGSST : Ship not available, halting script.*"
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
			send "x" $ship[$curship] "*q"
			gosub :sst_chkturns
			return
		end
	end
else
	setVar $init 0
	setVar $curship 0
end
goto :chk_nextship

:sst_furb
send "a"
waitFor "<Attack>"
:sst_furb_trigger
setTextTrigger nofurb :sst_nofurb "There is nothing here to attack."
setTextTrigger ship :sst_chkship ") (Y/N) [N]?"
setTextTrigger nofurbs :sst_nofurb "Command [TL="
pause

:sst_chkship
killtrigger nofurb
killtrigger nofurbs
setVar $pos 0
getWordPos CURRENTLINE $pos $furbShip
if ($pos > 0)
	setTextTrigger gotholds :sst_holds "You destroyed the ship"
	setTextTrigger corp :sst_nofurb "SAFETY OVERRIDE ENGAGED!"
	setTextTrigger noholds :sst_nofurb "Command [TL="
	send "y9*"
	pause
else
	send "n"
	goto :sst_furb_trigger
end

:sst_nofurb
killtrigger gotholds
killtrigger corp
killtrigger noholds
killtrigger nofurb
killtrigger ship
killtrigger nofurbs
if ($faked = 1)
	setVar $furbed[$curship] "Not Furbed - FAKE busted"
else
	setVar $furbed[$curship] "Not Furbed"
end
return

:sst_holds
killtrigger gotholds
killtrigger corp
killtrigger noholds
killtrigger nofurb
killtrigger ship
killtrigger nofurbs
if ($faked = 1)
	setVar $furbed[$curship] "Furbed - Fake Bust"
else
	setVar $furbed[$curship] "Furbed"
end
return

:sst_chkturns
subtract $turns 1
if ($turns <= $turnLimit)
	goto :bustlist
end
return

:save
setVar $quik_sfactor $sfactor
setVar $sst_turnLimit $turnLimit
setVar $furb_ship $furbShip
setVar $sst_fastMode $fastMode
setVar $sst_jettison $jettison

saveVar $sst_jettison
saveVar $quik_sfactor
saveVar $sst_turnLimit
saveVar $furb_Ship
saveVar $sst_fastMode
saveVar $furb_fakeShip

setVar $SupGsstSaved 1
saveVar $SupGsstSaved
return

:sst_sell
send "pt  *"
waitFor "do you want to sell"
setVar $haggle_inc~multiplier 104
gosub :haggle_inc~haggle
setVar $sellEq $haggle_inc~ni
if ($sellEq = 1)
	send "0*0*"
	goto :sst_sell
end
if ($jettison = "Yes")
	:buyTriggers
	setTextTrigger buy :buy "]?"
	setTextTrigger nobuy :nobuy "Command [TL="
	pause

	:buy
	killtrigger nobuy
	getText CURRENTLINE $maxBuy "buy [" "]?"
	if ($maxBuy > 2)
		if ($maxBuy >= 40)
			send "20*"
		else
			setVar $buy ($maxBuy / 2)
			send $buy "*"
		end
		setVar $haggle_inc~multiplier 95
		gosub :haggle_inc~haggle
	else
		send "0*"
	end
	goto :buytriggers

	:nobuy 
	killtrigger buy
	send "jy"
else
	send "0*0*"
end
return

include "supginclude\haggle_inc"
include "supginclude\ship_inc"
include "supginclude\gameinfo_inc"
include "supginclude\signature_inc"
include "supginclude\shipinfo_inc"