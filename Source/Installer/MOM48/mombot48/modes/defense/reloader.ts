	logging off
	gosub :BOT~loadVars

	setVar $BOT~help[1]  $BOT~tab&"reloader [on/off] [fig minimum] {ig} {topoff} {fig}"
	setVar $BOT~help[2]  $BOT~tab&"  - Sector Reloader Mode"
	setVar $BOT~help[3]  $BOT~tab&"    Sits above planet and lands/reloads fighters when hit."
	setVar $BOT~help[4]  $BOT~tab&"  "
	setVar $BOT~help[5]  $BOT~tab&"    Options: "
	setVar $BOT~help[6]  $BOT~tab&"           [on/off]   Turns Reloader On or Off"
	setVar $BOT~help[7]  $BOT~tab&"      [fig minimum]   Number of ship fighters to lose before "
	setVar $BOT~help[8]  $BOT~tab&"                      landing and refilling"
	setVar $BOT~help[9]  $BOT~tab&"               [ig]   Reset IG if photoned "
	setVar $BOT~help[10] $BOT~tab&"           [topoff]   Uses fighters in sector first "
	setVar $BOT~help[11] $BOT~tab&"              [fig]   Place fighter if sector figs attacked "
	setVar $BOT~help[11] $BOT~tab&"           [noland]   Do not land - should be running citfill "
	gosub :bot~helpfile

	setVar $BOT~script_title "Reloader"
	gosub :BOT~banner


	gosub :player~quikstats
	loadvar $planet~planet

	if ($bot~parm1 = "on")

	else
		setvar $bot~parm2 $bot~parm1
	end

	getwordpos " "&$bot~user_command_line&" " $pos " ig "
	if ($pos > 0)
		setvar $ig true
	else
		setvar $ig false
	end

	getwordpos " "&$bot~user_command_line&" " $pos " topoff "
	if ($pos > 0)
		setvar $topoff true
	else
		setvar $topoff false
	end

	getwordpos " "&$bot~user_command_line&" " $pos " fig "
	if ($pos > 0)
		setvar $replace_fig true
	else
		setvar $replace_fig false
	end

	send "\"
	setTextLineTrigger flee_off :flee_off "Online Auto Flee is disabled."
	setTextLineTrigger flee_on :flee_on "Online Auto Flee is enabled."
	pause

:flee_on
	killtrigger flee_off
	send "\"

:flee_off
	killtrigger flee_on
	isNumber $number $bot~parm2
	if ($number = 0) or ($bot~parm2 = 0)
		setVar $threshold $player~fighters
		divide $threshold 2
	else
			setVar $threshold $bot~parm2
	end


setvar $version "1.7"
goto :_START_

:settriggers
	killtrigger 1
	killtrigger 2
	killtrigger 3
	killtrigger 4
	setTextLineTrigger 1 :sub_reload "Shipboard Computers"
	setTextLineTrigger 2 :landed		"{"&$bot~bot_name&"} - In Cit - Planet"
	if ($ig = true)
		setTextLineTrigger 3 :ig_turn_it_on " damaging your ship."
	end
	if ($replace_fig)
		setTextLineTrigger 4 :replace_fig " of your fighters in sector "&$player~current_sector
	end
	pause

:replace_fig
	setvar $line currentline
	getWord $line $test 1
	getwordpos " "&$line&" " $pos " "&$player~current_sector&" "
	if (($test = "F") or ($test = "R") or ($test = "P") or ($pos <= 0))
		setTextLineTrigger 4 :replace_fig " of your fighters in sector "&$player~current_sector
		pause
	end
	killtrigger 1
	killtrigger 2
	killtrigger 3
	gosub :topoff
	add $loss 1
	goto :settriggers


:landed
	killtrigger 1
	killtrigger 3
	killtrigger 4
	send " q  q  q  q  q  z  n  ** "
	waiton "Warps to Sector(s) :"
	waiton "Command [TL"
	gosub :player~quikstats
	if ($player~current_prompt <> "Command")
		setvar $switchboard~message "Unable to get to Command Prompt. Halting!*"
		gosub :switchboard~switchboard
		halt
	end
	goto :settriggers
:sub_reload
	getWord CURRENTANSILINE $ck 1
	getWord CURRENTLINE $ck2 4
	getWord CURRENTLINE $ck3 5
	getWord CURRENTLINE $ck4 6
	getWord CURRENTLINE $ck5 7
	if ($ck <> "[K[1A[1;33mShipboard")
		echo "spoof"
		setTextLineTrigger 1 :sub_reload "Shipboard Computers"
		pause
	end
	setVar $reloaderline CURRENTLINE
	GetWordPos $reloaderLine $reloaderCheck "destroyed"
	if ($reloaderCheck = 0)
		echo "Found no damage*"
		setTextLineTrigger 1 :sub_reload "Shipboard Computers"
		pause
	end
	killtrigger 2
	killtrigger 3
	killtrigger 4
	While ($reloaderCheck <> 0)
		SetVar $PreviousreloaderLine $reloaderLine
		CutText $PreviousreloaderLine $reloaderLine ($reloaderCheck + 10) 999
		GetWordPos $reloaderLine $reloaderCheck "destroyed"
	end
	GetWordPos $PreviousreloaderLine $reloaderCheck "destroyed"
	CutText $PreviousreloaderLine $PreviousreloaderLine $reloaderCheck 9999
	getText $PreviousreloaderLine $FigDamage "destroyed" "fighters."
	stripText $FigDamage "shield points and"
	getWord $FigDamage $Shield_pnts 1
	getWord $FigDamage $Fig_pnts 2
	if ($shield_pnts > 0)
		add $loss $shield_pnts
	end
	if ($fig_pnts > 0)
		add $loss $fig_pnts
	end
	if ($loss >= $threshold)
		goto :reload
	else
		goto :settriggers
	end

:reload
	if ($topoff = true)
		gosub :topoff
	else
		send "l " $planet~planet "*  m  *  *  *  q "
	end
	setVar $loss 0
	gosub :player~quikstats
	if ($player~fighters < $ship~ship_fighters_max)
		if ($topoff = true)
			gosub :topoff
			gosub :player~quikstats
			if ($player~fighters < $ship~ship_fighters_max)
				setvar $topoff false
				goto :reload
			end
		end
		setvar $switchboard~message "Planet Too Low On Fighters. Reloader Shutting Down*"
		gosub :switchboard~switchboard
		halt
	end
	goto :settriggers

:_START_

# ============================== RELOADER (RELOAD) ==============================
:reloader
	setVar $startingLocation $player~current_prompt
	if ($startingLocation <> "Citadel") and ($startingLocation <> "Planet")
		if ($planet~planet = 0)
			setvar $switchboard~message "Must start at planet or cit prompt*"
			gosub :switchboard~switchboard
			halt
		else
			setvar $switchboard~message "Attempting to use planet "&$planet~planet&".*"
			setvar $planet~land_and_lift true
			gosub :planet~landingsub 
			if ($planet~sucessfulPlanet <> true)
				setvar $switchboard~message "Planet does not appear to be available.  Stopping.*"
				gosub :switchboard~switchboard
				halt
			else
				setvar $startinglocation "Planet"
				if ($planet~sucessfulCitadel = true)
					setvar $startinglocation "Citadel"
				end
			end
		end
	else
		send "q "
		gosub :planet~getplanetinfo
		send "q"
	end
	gosub :ship~getshipstats

	if ($planet~planet_fighters > 0)
		setvar $switchboard~message "Reloader "&$VERSION&" Active - Using Planet "&$planet~planet&" with "&$planet~planet_FIGHTERS&" fighters.*"
	else
		setvar $switchboard~message "Reloader "&$VERSION&" Active - Using Planet "&$planet~planet&".*"
	end
	gosub :switchboard~switchboard
	setvar $switchboard~message "Will reload when I get below "&$threshold&" ship fighters.*"
	gosub :switchboard~switchboard
	if ($topoff = true)
		setvar $switchboard~message "Will topoff from sector figs before using planet.*"
		gosub :switchboard~switchboard
	end
	if ($ig = true)
		goto :ig_turn_it_on
	end
	goto :settriggers

# ============================== RELOADER (RELOAD) ==============================

halt

:ig_turn_it_on
		
		getWord CURRENTLINE $test 1
		if ($test = "F") or ($test = "R") or ($test = "P")
			setTextLineTrigger 3 :ig_turn_it_on " damaging your ship."
			pause
		end
		killtrigger 1
		killtrigger 2
		killtrigger 3
		setVar $ig_mode 0
		setDelayTrigger ig_timeout :photon_ig_damage_trigger 3000
		setTextTrigger no_ig_trigger :no_ig_available "is not equipped with an Interdictor Generator!"
		setTextTrigger no_ig_beam :no_ig_beam "Beam to what sector? (U=Upgrade Q=Quit)"
		setTextTrigger no_ig_cby :no_ig_cby "ARE YOU SURE CAPTAIN? (Y/N)"
		setTextTrigger need_ig :ig_was_off "Your Interdictor generator is now OFF"
		setTextTrigger ig_fine :ig_was_on "Your Interdictor generator is now ON"
		setTextTrigger do_ig :do_ig_thing "Do you wish to change it? (Y/N)"
		send "q q* b"
		pause

	:no_ig_available
		killtrigger ig_timeout
		killtrigger no_ig_trigger
		killtrigger no_ig_beam
		killtrigger no_ig_cby
		killtrigger ig_fine
		killtrigger do_ig
		setvar $switchboard~message "No IG available on this ship.*"
		gosub :switchboard~switchboard
		setvar $ig false
		goto :settriggers

	:no_ig_beam
		killtrigger ig_timeout
		killtrigger no_ig_trigger
		killtrigger no_ig_beam
		killtrigger no_ig_cby
		killtrigger ig_fine
		killtrigger do_ig
		send " Q "
		goto :settriggers

	:no_ig_cby
		killtrigger ig_timeout
		killtrigger no_ig_trigger
		killtrigger no_ig_beam
		killtrigger no_ig_cby
		killtrigger ig_fine
		killtrigger do_ig
		send " N "
		goto :settriggers

	:ig_was_on
		setVar $ig_mode 1
		pause

	:ig_was_off
		setVar $ig_mode 0
		pause

	:do_ig_thing
		killtrigger ig_timeout
		killtrigger no_ig_trigger
		killtrigger no_ig_beam
		killtrigger no_ig_cby
		killtrigger ig_fine
		killtrigger do_ig
		killtrigger need_ig
		if ($ig_mode = 0)
			send "Y"
			setvar $switchboard~message "IG turned on!*"
			gosub :switchboard~switchboard
		else
			send "N"
			setvar $switchboard~message "IG was already on.*"
			gosub :switchboard~switchboard
		end
		goto :settriggers


:topoff
    :do_topoff_again
        killtrigger topoff_success
        killtrigger topoff_failure1
        killtrigger topoff_failure2
        send "f"
        waitOn "Your ship can support up to"
        getWord CURRENTLINE $ftrs_to_leave 10
        stripText $ftrs_to_leave ","
        stripText $ftrs_to_leave " "
        if ($ftrs_to_leave < 1)
            setVar $ftrs_to_leave 1
        end
        send $ftrs_to_leave & "* c d "
return





#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\landingsub\planet"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\ship\getshipstats\ship"
