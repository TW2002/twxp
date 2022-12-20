gosub :BOT~loadVars

	setVar $BOT~help[1] $BOT~tab&"PLIST - Displays Sector planet scan on subspace "
	gosub :bot~helpfile


# ============================== START PLANET LIST (PLIST)  ==============================
:plist
	killalltriggers
	setVar $planet~planet 0
	gosub :PLAYER~quikstats
	setVar $planet~planetOutput ""
	setVar $startingLocation $PLAYER~CURRENT_PROMPT
	setVar $bot~startingLocation $PLAYER~CURRENT_PROMPT
	setVar $bot~validPrompts "Citadel Command"
	gosub :bot~checkStartingPrompt

:Planet_Listing_Start
	if ($startingLocation = "Citadel")
		send "S* Q"
		gosub :PLANET~getPlanetInfo
		send "Q"
	else
		send "** "
	end
	if ((SECTOR.PLANETCOUNT[$PLAYER~CURRENT_SECTOR] <= 1) AND ($player~planet_SCANNER = "No"))
				setVar $SWITCHBOARD~message "Must be more than one planet in sector if bot doesn't have planet scanner*"
		gosub :SWITCHBOARD~switchboard
		if ($startingLocation = "Citadel")
			gosub :PLANET~landingSub
		end
		halt
	end
		send "L"
	setTextTrigger beginscan :Planet_Listing_beginscan "Atmospheric maneuvering system engaged"
	pause
:Planet_Listing_beginscan
	killalltriggers
	setTextLineTrigger nothing2do :Planet_Listing_nothing2do "You can create one with a Genesis Torpedo"
	setTextTrigger pscandone :Planet_Listing_pscandone "Land on which planet"
	setTextLineTrigger line_trig :Planet_Listing_parse_scan_line
	pause
:Planet_Listing_nothing2do
	killalltriggers
	waitOn "(?="
		setVar $SWITCHBOARD~message "No Planets In Sector!*"
	gosub :SWITCHBOARD~switchboard
	halt
:Planet_Listing_parse_scan_line
	killTrigger line_trig
	setVar $s CURRENTLINE
	if (($s = "") OR ($s = 0))
		setVar $s "          "
	end
	replaceText $s "        Level" "Lvl"
	replaceText $s "-----------------------------------------------" "-------------------------------------------"
	replaceText $s "        Citadel" "Citadel"
	replaceText $s "l Fighters Q" "l  Figs Q"
	getLength $s $length
	if ($length > 70)
		cutText $s $s 1 70
	end
	setVar $planet~planetOutput $planet~planetOutput&$s&"*"
	killalltriggers
	goto :Planet_Listing_beginscan
:Planet_Listing_pscandone
	setVar $strlocal ""
	killalltriggers
	setVar $idx 1
	if (($planet~planet <> 0) AND ($PLAYER~CURRENT_SECTOR <> 1))
		send $planet~planet & "* c "
		setVar $SWITCHBOARD~message "On Planet #" & $planet~planet & "*"
	else
		send " * "
		setVar $SWITCHBOARD~message ""
	end
	waitOn "(?="
	send "'*"
	waitOn "Comm-link open on sub-space band"
	send $planet~planetOutput
	send "**"
	waitOn "Sub-space comm-link terminated"
	gosub :SWITCHBOARD~switchboard
	halt
# ============================== END PLANET LIST (PLIST) Sub ==============================







# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\module_includes\bot\checkstartingprompt\bot"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\planet\landingsub\planet"
