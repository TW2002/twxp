:passiveholocap
	setvar $holocapture true
:passiveholokill
	if ($SHIP~SHIP_MAX_ATTACK <= 0)
		gosub :ship~getshipstats
	end

	
	setvar $too_many_fighters (($ship~SHIP_OFFENSIVE_ODDS * $SHIP~SHIP_MAX_ATTACK))
	divide $too_many_fighters 12

		setVar $hkill_start_sector $sector~starting_sector
		setVar $killsector 0
			setVar $test_sector $sector~targetSector
			setVar $safePlanets TRUE
			setVar $containsShieldedPlanet FALSE
			setvar $containsEnemyTrader FALSE
			if (SECTOR.PLANETCOUNT[$test_sector] > 0)
				setVar $p 1
				while ($p <= SECTOR.PLANETCOUNT[$test_sector])
					getWord SECTOR.PLANETS[$test_sector][$p] $test 1
					if ($test = "<<<<")
						setVar $containsShieldedPlanet TRUE
					end
					add $p 1
				end
				if ($player~surroundAvoidAllPlanets)
					setVar $safePlanets FALSE
				elseif (($containsShieldedPlanet) AND ($player~surroundAvoidShieldedOnly))
					setVar $safePlanets FALSE
				end
			end
			setVar $figowner SECTOR.FIGS.OWNER[$test_sector]
			if (($test_sector <> $MAP~stardock) AND ($test_sector > 10) AND ($safePlanets = TRUE) and ((SECTOR.FIGS.QUANTITY[$test_sector] < ($too_many_fighters*2)) OR (($figOwner = "belong to your Corp") OR ($figOwner = "yours"))))
				setVar $killsector $test_sector
			else
				setVar $SWITCHBOARD~message "Cannot holokill - check for planets or too many figs?*"
				return
			end
			send "c v 0 * y n "  $test_sector  " *  q  m z "  $test_sector  " *  *  z  a  " $SHIP~SHIP_MAX_ATTACK "*  z  a  " $SHIP~SHIP_MAX_ATTACK "*  R  * "
			if ($player~surround_before_hkill = TRUE)
				gosub :player~quikstats
				gosub :grid~surround
				setVar $insurround_before_hkill FALSE
				gosub :player~quikstats
			end
			#gosub  :player~quikstats
			#if ($player~current_prompt <> "Command")
			#	setVar $SWITCHBOARD~message "Wrong prompt for holokill kill.*"
			#	return
			#end
			setvar $PLAYER~startingLocation "Command"
			if ($holocapture)
				gosub :fastCapture
			else
				goSub :fastAttack
			end		
			if (($hkill_start_sector <= 10) or ($hkill_start_sector = $map~stardock) or ($hkill_start_sector = stardock))
				send "  f  z  1  *  z  c  d  *   m "  $hkill_start_sector  " *   "
			else
				send "  f  z  1  *  z  c  d  *   m "  $hkill_start_sector  " *  *  z  a  99999  *  z  a  99999  *  R  *   "
			end
			gosub :player~quikstats
			if ($player~current_sector <> $hkill_start_sector)
				gosub :callsaveme
				gosub :player~quikstats
				setVar $SWITCHBOARD~message "After save me, resetting.*"
			else
				setvar $switchboard~message "Auto holokill attacked "&$sector~enemy_name&" in sector "&$test_sector&".*"
				setVar $SWITCHBOARD~message $switchboard~message&"Attack made and back in original sector!*"
			end
	return


:callsaveme
	setVar $BOT~command "call"
	setvar $bot~parm1 ""
	setVar $BOT~user_command_line " call  "
	setvar $bot~parm2 ""
	setvar $bot~parm3 ""
	setvar $bot~parm4 ""
	setvar $bot~parm5 ""
	setvar $bot~parm6 ""
	saveVar $BOT~command
	saveVar $BOT~user_command_line
	savevar $bot~parm1
	savevar $bot~parm2
	savevar $bot~parm3
	savevar $bot~parm4
	savevar $bot~parm5
	savevar $bot~parm6
	load "scripts\"&$bot~mombot_directory&"\commands\defense\call.cts"
	setEventTrigger        callend1        :callend1 "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\defense\call.cts"
	pause
	:callend1
return
