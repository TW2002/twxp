#		fixes
#				moved stuff around for speed
#				added the 'manual' trigger
#				successful plock msg is sent b4 actual lock is made as a
#				fix for when interactive subprompts are off.
#				fixed :plockFinished, sent " n s* ", if the planet is a
#				level 6, this would have no effect

	gosub :BOT~loadVars

	loadvar $GAME~ptradesetting
	loadVar $game~goldenabled
	loadVar $game~mbbs
	loadVar $game~port_max
	loadvar $game~rob_factor
	loadVar $game~production_rate
	loadVar $bot~folder
	setVar  $bot~no_credits_file $bot~folder&"/No_Credits.list"
	savevar $bot~no_credits_file
	loadvar $game~LIMPET_COST
	loadvar $game~ARMID_COST
	loadVar $game~LIMPET_REMOVAL_COST


	setVar $BOT~help[1]  $BOT~tab&"plock {sector} {kill} {fastkill} {fastdrop}"
	setVar $BOT~help[2]  $BOT~tab&"    "
	setVar $BOT~help[3]  $BOT~tab&"   Pre-locks with planet onto a sector."
	setVar $BOT~help[4]  $BOT~tab&"    "
	setVar $BOT~help[5]  $BOT~tab&"    Options: "
	setVar $BOT~help[6]  $BOT~tab&"      {kill} - attempts citkill after landing"
	setVar $BOT~help[7]  $BOT~tab&"  {fastkill} - macro kill after landing"
	setVar $BOT~help[8]  $BOT~tab&"  {fastdrop} - deploys fighters after landing"
	gosub :bot~helpfile

	setVar $BOT~script_title "Plock"
	gosub :BOT~banner


goto :Starting

:settriggers
	killalltriggers
	setTextLineTrigger	1	:manual			("Planet is now in sector "&$target_sector)
	setTextTrigger 		2	:plockFinished	("Planetary TransWarp Drive shutting down.")
	setTextTrigger 		3	:goFighterPlock 		("Report Sector "&$target_sector&": ")
	setTextTrigger 		4	:goLimpetPlock 		("Limpet mine in "&$target_sector&" ")
	setTextTrigger 		5	:goArmidPlock 		("Your mines in "&$target_sector&" ")
	setTextTrigger 		6	:goPlock 		("Locator beam lost.")
	pause


:goArmidPlock
	cutText currentline&"    " $ck 1 4
	setvar $spoof false
	if ($ck <> "Your")
		setTextTrigger 		5	:goArmidPlock 		("Your mines in "&$target_sector&" ")
		pause
	end
	if ($game~hasAliens = true)
		#[K[32mYour mines in [1;33m8174[0;32m did [1;33m14[0;32m damage to #[1;36m[33mFerrengi[36m Nik
		setvar $alien false
		getText $bot~ansi_last_armid_attack&"[xx][xx][xx]" $alien_check " damage to " "[xx][xx][xx]"
		getWordPos $alien_check $pos #27 & "[1;36m" & #27 & "["
		if ($pos > 0)
			setTextTrigger 		5	:goArmidPlock 		("Your mines in "&$target_sector&" ")
			pause
		end
	end
	goto :goplock

:goLimpetPlock
	cutText currentline&"      " $ck 1 6
	setvar $spoof false
	if ($ck <> "Limpet")
		setTextTrigger 		4	:goLimpetPlock 		("Limpet mine in "&$target_sector&" ")
		pause
	end
	goto :goplock
:goFighterPlock
	getWord currentline $spoof_test 1
	getWord currentansiline $ansi_spoof_test 1
	getWordPos $ansi_spoof_test $ansi_spoof_pos #27 & "[1;33m"
	setvar $spoof false
	if ($spoof_test <> "Deployed") OR ($ansi_spoof_pos <= 0)
		setTextTrigger 		3	:goFighterPlock 		("Report Sector "&$target_sector&": ")
		pause
	end
	if ($game~hasAliens = true)
		setvar $alien false
		getText currentansiline $alien_check ": " "'s"
		getWordPos $alien_check $pos #27 & "[1;36m" & #27 & "["
		if ($pos > 0)
			setTextTrigger 		3	:goFighterPlock 		("Report Sector "&$target_sector&": ")
			pause
		end
	end


:goPlock
	killalltriggers
	if ($plock_delay > 0)
		setdelaytrigger plockdelay :continuePlock $plock_delay
		pause
	end
	:continuePlock
	send "y '{" $switchboard~bot_name "} - PLOCK Launched*"
	gosub :plockkill
	if ($plockKill)
		goto :scanit_again
	else
		send "s* "
		halt
	end
:plockFinished
	send "  s*   "
	setvar $switchboard~message "PLOCK Sector Cleared*"
	gosub :switchboard~switchboard
	halt
:manual
	killAllTriggers
	gosub :plockkill
	if ($plockKill)
		goto :scanit_again
	else
		send "s* "
	end
	halt

:Starting

# ======================     START PRELOCK DROP (PLOCK) SUBROUTINE    ==========================
:start_plock
	gosub :player~quikstats
	setVar $startingLocation $player~CURRENT_PROMPT
	if ($startingLocation <> "Citadel")
		setvar $switchboard~message "You must run Plocker from Citadel prompt.*"
		gosub :switchboard~switchboard
		halt
	end
	send "Q"
	gosub :planet~getPlanetInfo
	send "C "
	setVar $targeting~PLANET $planet~planet
	gosub :combat~init
	gosub :ship~getshipstats
	setvar $game~hasAliens false

	send "#/"
	waiton "Who's Playing"
	setTextLineTrigger	1	:alien	"are on the move!"
	setTextTrigger		2	:aliendone (#179 & "Turns")
	pause
	:alien
		setvar $game~hasAliens true
	:aliendone
		killtrigger 1
		killtrigger 2
		savevar $game~hasAliens


	getWordPos " "&$bot~user_command_line&" " $pos " kill "
	if ($pos > 0)
		setVar $plockKill TRUE
	else
		setVar $plockKill FALSE
	end
	getWordPos " "&$bot~user_command_line&" " $pos " fastkill "
	if ($pos > 0)
		setVar $fastkill TRUE
	else
		setVar $fastkill FALSE
	end
	getWordPos " "&$bot~user_command_line&" " $pos " fastdrop "
	if ($pos > 0)
		setVar $fastdrop TRUE
	else
		setVar $fastdrop FALSE
	end
	setVar $target_sector $bot~parm1
	isNumber $isnum $target_sector
	if ($isnum = 1)
		if (($target_sector > 10) and ($target_sector <= SECTORS) and ($target_sector <> STARDOCK))
			goto :planetPrelock
		elseif (($target_sector < 10) or ($target_sector >= SECTORS) or ($target_sector = STARDOCK))
			setvar $switchboard~message "Not a Valid PLOCK Sector*"
			gosub :switchboard~switchboard
			halt
		end
	elseif ($isnum <> 1)
		setvar $switchboard~message "PLOCK Sector must be a number*"
		gosub :switchboard~switchboard
		halt
	end
	isNumber $isnum $bot~parm2
	if ($isnum)
		setvar $plock_delay $bot~parm2
	else
		isNumber $isnum $bot~parm3
		if ($isnum = 1)
			setvar $plock_delay $bot~parm3
		end
	end

:planetPrelock
	setvar $switchboard~message "PLOCK Ready to fire Sector: "&$target_sector
	if ($plockKill)
		setvar $switchboard~message $switchboard~message&", auto kill enabled."
	end
	if ($fastkill)
		setvar $switchboard~message $switchboard~message&" -  fast kill enabled too."
	end
	setvar $switchboard~message $switchboard~message&"*"
	gosub :switchboard~switchboard

	send "p " $target_sector "*"
	setTextLineTrigger prelockNo :plockNo "You do not have any fighters in Sector " & $target_sector & "."
	setTextLineTrigger prelockYes :plockYes "Locating beam pinpointed, TransWarp Locked."
	setTextLineTrigger prelockAlreadyThere :plockFinished "You are already in that sector!"
	pause

:plockNo
	setvar $switchboard~message "You do not have any fighters in that Sector*"
	gosub :switchboard~switchboard
	halt


:plockYes
	goto :settriggers



:main
	killalltriggers
	gosub :player~quikstats
	setTextLineTrigger 	limp 	:scanit_cit_kill 	"Limpet mine in "&$player~CURRENT_SECTOR
	setTextLineTrigger 	warps 	:scanit_cit_kill 	"warps into the sector."
	setTextLineTrigger 	lifts 	:scanit_cit_kill 	"lifts off from"
	setTextLineTrigger 	deffig 	:scanit_cit_kill 	"Deployed Fighters Report Sector "&$player~CURRENT_SECTOR
	setTextLineTrigger 	secgun 	:scanit_cit_kill 	"Quasar Cannon on"
	setTextLineTrigger 	ig		:scanit_cit_kill 	"Shipboard Computers The Interdictor Generator on"
	setTextLineTrigger 	power 	:scanit_cit_kill 	"is powering up weapons systems!"
	settextlinetrigger  wave    :scanit_cit_kill    " launches a wave of fighters at  "
	settextlinetrigger  planet  :scanit_cit_kill	" launches a Genesis Torpedo into the sector!"
	settextlinetrigger  atomic  :scanit_cit_kill    " appears from the planetary rubble."
	setTextLineTrigger 	exits 	:scanit_cit_kill 	"exits the game."
	setTextLineTrigger 	enters 	:scanit_cit_kill 	"enters the game."
	setDelayTrigger		delay	:scanit_cit_kill	30000
	setTextTrigger 		pause 	:pausing 		"Planet command (?="
	setTextTrigger 		pause2 	:pausing 		"Computer command ["
	setTextTrigger 		pause3 	:pausing 		"Corporate command ["
	pause


:pausing
	killAllTriggers
	echo ANSI_6 "*[" ANSI_14 "Plock Citadel Killer paused. To restart, re-enter citadel prompt" ANSI_6 "]*" ANSI_7
	setTextTrigger restart :restarting "Citadel command ("
	pause
:restarting
	killAllTriggers
	echo ANSI_6 "*[" ANSI_14 "Plock Citadel Killer restarted" ANSI_6 "]*" ANSI_7
	goto :main

:scanit_cit_kill
	killAllTriggers
	getWord CURRENTLINE $test 1
	if (($test = "P") OR ($test = "F") OR ($test = "R") OR ($test = ">"))
		echo ANSI_14 "*spoof attempt!*"
		goto :main
	end	
:scanit_again
	killAllTriggers
	gosub :player~quikstats
	setvar $planet~planet_count SECTOR.PLANETCOUNT[$player~current_sector]
	if (($planet~planet_count = 1) and ($overide = false))
		setvar $one_planet true
		setvar $player~override true
	else
		setvar $player~override $override
	end
	gosub :sector~getSectorData
	if ($sector~realTraderCount > ($sector~corpieCount + $sector~defenderShips))
		goSub :combat~fastCitadelAttack
		if ($player~fighters <= 0)
			setvar $switchboard~message "Fighters are gone - halting.*"
			gosub :switchboard~switchboard
			halt
		end
		goto :scanit_again
	elseif (($sector~emptyShipCount > $sector~myShipCount) AND ($capEmptyShips = TRUE))
		setvar $player~startinglocation "Citadel"
		gosub :combat~fastCapture
		gosub :player~quikstats
		if ($player~current_prompt = "Command")
			send " l " $PLANET~PLANET " * n n * j m * * * j c  *  "
			gosub :player~quikstats
			if ($player~fighters <= 0)
				setvar $switchboard~message "Fighters are gone - halting.*"
				gosub :switchboard~switchboard
				halt
			end
		end
		goto :scanit_again
	end
	goto :halt

:halt
:final
	echo ansi_12 "*NO Targets*"
	if ($sector~defenderShips > 0)
		setvar $switchboard~message "Enemy defender ship in sector!  Not attacking.  Override if you want to attempt to kill them.*"
		gosub :switchboard~switchboard
	end
	goto :main


:plockkill
	if ($fastdrop = true)
		setVar $send $send&"q q fz200000*z c d * l "&$planet~planet&"*  m  *** c  "
	end
	if ($fastkill = true)    
		setvar $send $send&"q q a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** q z n a y y "&$ship~SHIP_MAX_ATTACK&"* * z n q z n  l "&$planet~planet&"*  m  *** c  "
	end
	send $send
return
# ======================     END PLOCK (PLOCK) SUBROUTINE     ==========================
include "source\module_includes\bot\loadvars\bot"
include "source\bot_includes\combat\init\combat"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\targeting\scanitcitkill\targeting"
include "source\bot_includes\targeting\initializetargeting\targeting"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\ship\getshipstats\ship"
include "source\bot_includes\sector\getsectordata\sector"
include "source\bot_includes\combat\fastcitadelattack\combat"
include "source\bot_includes\combat\fastcapture\combat"

