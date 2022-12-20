	gosub :BOT~loadVars

	setVar $BOT~help[1]  $BOT~tab&" citcap {"&#34&"player name"&#34&" | corp#}"
	setVar $BOT~help[2]  $BOT~tab&" Citadel Capper captures enemy ships from planet citadel"
	setVar $BOT~help[3]  $BOT~tab&"  "
	setVar $BOT~help[4]  $BOT~tab&" {"&#34&"player name"&#34&"} - Player to target, name must be"
	setVar $BOT~help[5]  $BOT~tab&"                   surrounded by double quotes"
	setVar $BOT~help[6]  $BOT~tab&"         {corp#} - Corporation number to target"
	setVar $BOT~help[7]  $BOT~tab&"      {override} - Override to cap defender ships"
	setVar $BOT~help[8]  $BOT~tab&"         {empty} - Empty ships only"
	setVar $BOT~help[9]  $BOT~tab&"        {onetap} - Fire once only"
	setVar $BOT~help[10] $BOT~tab&"        {slowmo} - Adds random pause between waves."
	setVar $BOT~help[11] $BOT~tab&"      {unloader} - Waits for unloader to finish b4 next attack."
	setVar $BOT~help[12]  $BOT~tab&"         "
	setVar $BOT~help[13]  $BOT~tab&"         Examples:"
	setVar $BOT~help[14] $BOT~tab&"              >citcap "
	setVar $BOT~help[15] $BOT~tab&"              >citcap "&#34&"player name"&#34&" "
	setVar $BOT~help[16] $BOT~tab&"              >citcap 3"
	gosub :bot~helpfile

	setVar $BOT~script_title "Citadel Capper"
	gosub :BOT~banner

	loadVar $GAME~LATENCY

	setArray $shipList 	200
	gosub :player~quikstats
	gosub :player~getInfo
	setVar $startingLocation $player~current_prompt
	setVar $player~targetingPerson FALSE
	setVar $player~targetingCorp FALSE
	setVar $player~cappingAliens TRUE
	setVar $player~target ""
	setvar $capEmptyShips true

	setvar $bot~mode "Citcap"
	saveVar $bot~mode

	if ($startingLocation <> "Citadel")
		setvar $switchboard~message "Citadel Capper must be run from the Citadel Prompt*"
		gosub :switchboard~switchboard
		setVar $mode "General"
		halt
	end
	isNumber $test $bot~parm1
	if ($test)
		if ($bot~parm1 > 0)
			setVar $targetingCorp TRUE
			setVar $player~target $bot~parm1
		end
	else
		getWordPos $bot~user_command_line $pos #34
		if ($pos > 0)
			setvar $bot~user_command_line $bot~user_command_line&" "
			getText $bot~user_command_line $player~target " "&#34 #34&" "
			if ($player~target <> "")
				setVar $targetingPerson TRUE
				stripText $player~target #34
				lowercase $player~target
			else
				setVar $targetingPerson FALSE
			end
		end
	end

	getWordPos $bot~user_command_line $pos "override"
	if ($pos > 0)
		setVar $override TRUE
	else
		setVar $override FALSE
	end
	getWordPos $bot~user_command_line $pos "empty"
	if ($pos > 0)
		setVar $player~empty_ships_only TRUE
	else
		setVar $player~empty_ships_only FALSE
	end
	getWordPos $bot~user_command_line $pos "onetap"
	if ($pos > 0)
		setVar $player~onetap TRUE
	else
		setVar $player~onetap FALSE
	end

	getWordPos $bot~user_command_line $pos "slowmo"
	if ($pos > 0)
		setVar $player~slowmo TRUE
		setVar $player~onetap FALSE
	else
		setVar $player~slowmo FALSE
	end
	
	getWordPos $bot~user_command_line $pos "unloader"
	if ($pos > 0)
		setVar $player~unloader TRUE
	else
		setVar $player~unloader FALSE
	end
	
	gosub :player~quikstats
	setVar $player~startingLocation $player~current_prompt
	

	if ($player~current_prompt <> "Citadel")
		setvar $switchboard~message "Must start at the citadel prompt*"
		gosub :switchboard~switchboard
		halt
	end
	loadvar $ship~CAP_FILE	
	fileExists $CAP_FILE_chk $ship~CAP_FILE
	if ($CAP_FILE_chk)
		gosub :ship~loadshipinfo
	else
		gosub :ship~getShipCapStats
		gosub :ship~loadShipInfo
	end 



:start_cit_cap
	setvar $switchboard~message "Citadel Capper :: Powering Up!*"
	gosub :switchboard~switchboard
:stats_cit_cap
	gosub :ship~getShipStats
:warning_cit_kill
	send "q m * * * "
	gosub :planet~getPlanetInfo
	format $planet~planet_fighters $formatted_fighters NUMBER
	if ($targetingPerson)
		setvar $switchboard~message "Citadel Capper Targeting "&$player~target&" :: Running on Planet "&$planet~planet&" :: "&$formatted_fighters&" Fighters available on surface.*"
	elseif ($targetingCorp)
		setvar $switchboard~message "Citadel Capper Targeting Corp "&$player~target&" :: Running on Planet"&$planet~planet&" :: "&$formatted_fighters&" Fighters available on surface.*"
	else
		setvar $switchboard~message "Citadel Capper :: Running on Planet "&$planet~planet&" :: "&$formatted_fighters&" Fighters available on surface.*"
	end
	

	if ($player~onetap = TRUE)
		setvar $switchboard~message  $switchboard~message & "*One Tap Preparing to fire*"
	end
	gosub :switchboard~switchboard
	send "c  "

	goto :scanit_cit_cap


:main
	killalltriggers
	gosub :player~quikstats
	setTextLineTrigger 	limp 	:scanit_cit_cap 	"Limpet mine in "&$player~CURRENT_SECTOR
	setTextLineTrigger 	warps 	:scanit_cit_cap 	"warps into the sector."
	setTextLineTrigger 	lifts 	:scanit_cit_cap 	"lifts off from"
	setTextLineTrigger 	deffig 	:scanit_cit_cap 	"Deployed Fighters Report Sector "&$player~CURRENT_SECTOR
	setTextLineTrigger 	secgun 	:scanit_cit_cap 	"Quasar Cannon on"
	setTextLineTrigger 	ig		:scanit_cit_cap 	"Shipboard Computers The Interdictor Generator on"
	setTextLineTrigger 	power 	:scanit_cit_cap 	"is powering up weapons systems!"
	settextlinetrigger  wave    :scanit_cit_cap    	" launches a wave of fighters at  "
	settextlinetrigger  planet  :scanit_cit_cap		" launches a Genesis Torpedo into the sector!"
	settextlinetrigger  atomic  :scanit_cit_cap    	" appears from the planetary rubble."
	setTextLineTrigger 	exits 	:scanit_cit_cap 	"exits the game."
	setTextLineTrigger 	enters 	:scanit_cit_cap 	"enters the game."
	setDelayTrigger		delay	:scanit_cit_cap		30000
	setTextTrigger 		pause 	:pausing 			"Planet command (?="
	setTextTrigger 		pause2 	:pausing 			"Computer command ["
	setTextTrigger 		pause3 	:pausing 			"Corporate command ["
	pause


:pausing
	killAllTriggers
	echo ANSI_6 "*[" ANSI_14 "Citadel Capture paused. To restart, re-enter citadel prompt" ANSI_6 "]*" ANSI_7
	setTextTrigger restart :restarting "Citadel command ("
	pause
	:restarting
	killAllTriggers
	echo ANSI_6 "*[" ANSI_14 "Citadel Capture restarted" ANSI_6 "]*" ANSI_7
	goto :main


:scanit_cit_cap
	killalltriggers
	getWord CURRENTLINE $test 1
	if (($test = "P") OR ($test = "F") OR ($test = "R") OR ($test = ">"))
		echo ANSI_14 "*spoof attempt!*"
		goto :main
	end	
	gosub :checkForCappingVictimsFromCitadel
	goto :main

:checkForCappingVictimsFromCitadel
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
		setvar $player~startinglocation "Citadel"
		if (($sector~realTraderCount > ($sector~corpieCount + $sector~defenderShips)) or ((($sector~emptyShipCount > $sector~myShipCount) AND ($capEmptyShips = TRUE))) or (($SECTOR~fakeTraderCount > $SECTOR~federalCount) and ($PLAYER~cappingAliens = TRUE)))
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
		echo ansi_12 "*NO Targets*"
		if ($sector~defenderShips > 0)
			setvar $switchboard~message "Enemy defender ship in sector!  Not attacking.  Override if you want to attempt to kill them.*"
			gosub :switchboard~switchboard
		end
		if ($player~onetap = TRUE)
			setvar $switchboard~message "One Tap mode was on, so exiting Citcap.*"
			gosub :switchboard~switchboard
			halt
		end
return
 


#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\player\getinfo\player"
include "source\bot_includes\combat\init\combat"
include "source\bot_includes\ship\loadshipinfo\ship"
include "source\bot_includes\ship\getshipcapstats\ship"
include "source\bot_includes\ship\getshipstats\ship"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\sector\getsectordata\sector"
include "source\bot_includes\combat\fastcapture\combat"
