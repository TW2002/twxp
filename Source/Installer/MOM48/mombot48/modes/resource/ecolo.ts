logging off
	gosub :BOT~loadVars
									

setVar $BOT~help[1] $BOT~tab&"Uses ecolo {all}"
setVar $BOT~help[2] $BOT~tab&"Uses E-warp to colonize.  For red or non-twarp ships."
setVar $BOT~help[3] $BOT~tab&"   Options:"
setVar $BOT~help[4] $BOT~tab&"   Will attempt to fill all planets in sector owned by you."
gosub :bot~helpfile

setVar $BOT~script_title "E-Colonizer"
gosub :BOT~banner


# ======================     START COLO (COLO) SUBROUTINE    ==========================
goto :Start_Up_Routines
:colo_next
	setVar $PLAYER~destination 1
	gosub :player~getCourse
    setVar $j 2
    setVar $result "q * "
    while ($j <= $PLAYER~courseLength)
        if ($PLAYER~mowCourse[$j] <> $PLAYER~CURRENT_SECTOR)
            setVar $result $result&"m    "&$PLAYER~mowCourse[$j]&"*               "
            if (($PLAYER~mowCourse[$j] > 10) AND ($PLAYER~mowCourse[$j] <> $MAP~stardock))
                setVar $result $result&"za  "&$SHIP~SHIP_MAX_ATTACK&"* *             "
            end
        end
        add $j 1
    end
    setVar $to_mow $result

    setVar $PLAYER~starting_point 1
	setVar $PLAYER~destination $PLAYER~CURRENT_SECTOR
	gosub :player~getCourse
    setVar $j 2
    setVar $result ""
    while ($j <= $PLAYER~courseLength)
        if ($PLAYER~mowCourse[$j] <> $PLAYER~starting_point)
            setVar $result $result&"m    "&$PLAYER~mowCourse[$j]&"*             "
            if (($PLAYER~mowCourse[$j] > 10) AND ($PLAYER~mowCourse[$j] <> $MAP~stardock))
                setVar $result $result&"za  "&$SHIP~SHIP_MAX_ATTACK&"* *           "
            end
        end
        add $j 1
    end
    setVar $from_mow $result

	setVar $i 1
	while ($i <= $planet~planetCount)
		setVar $colo_prod 1
		while ($colo_prod < 4)
			setVar $planet~planet $planet~planets[$i]
			if ($PLAYER~PLANET_SCANNER = "No")
				setVar $coloBurst $to_mow&"    l * * "&$from_mow&" l "&$planet~planet&"* s * * "&$colo_prod&"*"
			else
				setVar $coloBurst $to_mow&"    l 1* * * "&$from_mow&" l "&$planet~planet&"* s * * "&$colo_prod&"*"
			end
			send $coloBurst
			setTextLineTrigger 33 :morespeed "The Colonists disembark"
			setTextLineTrigger 34 :next_item_speed "There isn't room on the planet"
			setTextLineTrigger 35 :donespeed "There aren't that many on Terra!"
			pause

			:donespeed
				killtrigger 33
				killtrigger 34
				send "'{" $switchboard~bot_name "} - Terra is empty. Colonizer shutting down.*"
				if ($startingLocation = "Citadel")
					send "c "
				end
				halt
			:next_item_speed
				killtrigger 33
				killtrigger 35
				#CHANGE ITEM TO NEXT
				add $colo_prod 1
				if ($colo_prod >= 4)
					send "'{" $switchboard~bot_name "} - Planet "&$planet~planet&" is full of colonists, no more can be added.*"
				end
			:morespeed
				killtrigger 33
				killtrigger 34
				killtrigger 35

		end
		add $i 1
	end
halt

:Start_Up_Routines
	loadVar $player~unlimitedGame
	loadVar $bot_turn_limit
	loadVar $bot~user_command_line
	loadVar $bot~parm1
	loadVar $bot~parm2
	loadVar $bot~parm3
	loadVar $bot~parm4
	loadVar $bot~parm5
	loadVar $bot~parm6
	loadVar $bot~parm7
	loadVar $bot~parm8
	loadVar $switchboard~bot_name


# ======================     START COLO  (COLO) SUBROUTINE    ==========================
:colo_setup
	gosub :PLAYER~quikstats
	setVar $startingLocation $PLAYER~CURRENT_PROMPT
	if (($startingLocation <> "Citadel") AND ($startingLocation <> "Planet"))
		send "'{" $switchboard~bot_name "} - Colo must be run from Planet or Citadel prompt*"
		halt
	end
	if ($startingLocation = "Citadel")
		send "Q"
	end
	gosub :PLANET~getPlanetInfo
	send " t n l 1* t n l 2* t n l 3* s n l 1* s n l 2* s n l 3* q c u y q "

	if ($bot~parm1 = "all")
		gosub :PLANET~countPlanets
	else
		setVar $planet~planets[1] $planet~planet
		setVar $planet~planetCount 1
	end
	gosub :PLAYER~getInfo
	gosub :SHIP~getShipStats
	goto :colo_next

	#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\player\getcourse\player"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\planet\countplanets\planet"
include "source\bot_includes\player\getinfo\player"
include "source\bot_includes\ship\getshipstats\ship"
