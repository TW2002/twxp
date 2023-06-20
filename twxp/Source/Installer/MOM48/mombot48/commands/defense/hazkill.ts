	gosub :BOT~loadVars

	setVar $BOT~help[1] $BOT~tab&"HAZKILL - Remove NavHaz Command"
	setVar $BOT~help[2] $BOT~tab&"          Scans Current-Sector and launches Genesis Torpedos"
	setVar $BOT~help[3] $BOT~tab&"          to removes any NavHaz"
	gosub :bot~helpfile



# ============================== START NAV HAZ KILLER (navhaz) Sub ==============================
:hazKill
	setVar $pName "M()M - NAV HAZ KiLLA!"
	gosub :player~quikstats
	setVar $startingLocation $player~CURRENT_PROMPT
	if (($startingLocation <> "Command") AND ($startingLocation <> "Citadel"))
	        setvar $switchboard~message "Please Start from Command or Citadel Prompts!*"
	        gosub :switchboard~switchboard
		halt
	end
	if ($player~GENESIS <= 0)
		setvar $switchboard~message "No Genesis Torps On Hand.*"
		gosub :switchboard~switchboard
		halt
	end
	if ($startingLocation = "Citadel")
		send "Q"
		gosub :planet~getPlanetInfo
		send "  Q  "
		waitfor "Command [TL="
	end
	send "*"
	waitfor "(?="
	setVar $haz SECTOR.NAVHAZ[$player~CURRENT_SECTOR]
	if ($haz <= 10)
		setVar $2Bpopped 1
	elseif ($haz <= 20)
		setVar $2Bpopped 2
	elseif ($haz <= 30)
		setVar $2Bpopped 3
	elseif ($haz <= 40)
		setVar $2Bpopped 4
	elseif ($haz <= 50)
		setVar $2Bpopped 5
	elseif ($haz <= 60)
		setVar $2Bpopped 6
	elseif ($haz <= 70)
		setVar $2Bpopped 7
	elseif ($haz <= 80)
		setVar $2Bpopped 8
	elseif ($haz <= 90)
		setVar $2Bpopped 9
	else
		setVar $2Bpopped 10
	end
	if ($2Bpopped > $player~GENESIS)
		setvar $switchboard~message "Short " & ($2Bpopped - $player~GENESIS) & " Genesis Torps.*"
		gosub :switchboard~switchboard
		setVar $2Bpopped $player~GENESIS
		waitfor "Message sent on sub-space"
	end
	while ($2Bpopped > 0)
		send "U Y "
		setTextLineTrigger planetname :planetname "What do you want to name this planet?"
		setTextTrigger override :override "Do you wish to abort?"
		pause
   		:override
			send "N "
			pause
			:planetname
			killtrigger planetname
			killtrigger override
			send $pName & "* Z  C * "
			subtract $2Bpopped 1
	end
	if ($startingLocation = "Citadel")
		send " L " & $planet~planet & "* C "
	end
	setvar $switchboard~message "Nav Haz Killa Complete!*"
	gosub :switchboard~switchboard

halt
# ============================== END NAV HAZ KILLER (navhaz) Sub ==============================


#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\getplanetinfo\planet"
