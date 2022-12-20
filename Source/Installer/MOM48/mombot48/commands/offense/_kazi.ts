	gosub :BOT~loadVars

	setVar $BOT~help[1]   $BOT~tab&"- kazi [planet] {shields} {defender} {zdy}" 
	setVar $BOT~help[2]   $BOT~tab&"    Automates planet invasion. " 
	setVar $BOT~help[3]   $BOT~tab&"                           " 
	setVar $BOT~help[4]   $BOT~tab&"    [planet]               "
	setVar $BOT~help[5]   $BOT~tab&"       - Planet number to attack   " 
	setVar $BOT~help[6]   $BOT~tab&"    [shields]                      " 
	setVar $BOT~help[7]   $BOT~tab&"       - Will kill planetary shields. Stops when below 50. "  
	setVar $BOT~help[8]   $BOT~tab&"    [defender]                                        " 
	setVar $BOT~help[9]   $BOT~tab&"       - Will land defensively to take out military reaction." 
	setVar $BOT~help[10]  $BOT~tab&"    [zdy]                         " 
	setVar $BOT~help[11]  $BOT~tab&"       - Option to blow planet as soon as you land.   " 

	gosub :bot~helpfile
	
# ======================     START KAMIKAZE (KAZI) SUBROUTINE    ==========================
:kamikaze
	gosub :player~quikstats
	setVar $startingLocation $player~CURRENT_PROMPT
	if (($startingLocation <> "Citadel") AND ($startingLocation <> "Command"))
		setvar $switchboard~message "Must start from Citadel or Command Prompt*"
		halt
	end
	setVar $message ""
	setVar $planet~planetToAttack $bot~parm1
	getWordPos $bot~user_command_line $pos "zdy"
	if ($pos > 0)
		setVar $zdy TRUE
	else
		setVar $zdy FALSE
	end
	getWordPos $bot~user_command_line $pos "sh"
	if ($pos > 0)
		setVar $player~shieldsOnly TRUE
	else
		setVar $player~shieldsOnly FALSE
	end
	getWordPos $bot~user_command_line $pos "def"
	if ($pos > 0)
		setVar $defender TRUE
	else
		setVar $defender FALSE
	end
	if ($startingLocation = "Citadel")
		send "q"
		gosub :planet~getPlanetInfo
		send "m * * * c "
		gosub :ship~getShipStats
		send " q "
		setVar $refurbString "l "&$planet~planet&"* m * * * "
		setVar $attackString ""
		setVar $targetString  "q l j"&#8&$planet~planetToAttack&"*z *  @"
	else
		gosub :ship~getShipStats
		gosub :grabfigs
		gosub :player~quikstats
		setVar $attackString ""
		setVar $targetString  "l j"&#8&$planet~planetToAttack&"*z *  @"
	end
	:tryInvadeAgain
	gosub :player~quikstats
	if (($zdy = TRUE) AND ($player~ATOMIC < 1))
		setvar $switchboard~message "Cannot run zdy version of kamikaze without detonators!*"
		halt
	end
	while ($player~FIGHTERS = $ship~SHIP_FIGHTERS_MAX)
		setVar $attackString ""
		send $targetString
		setTextTrigger 		invadeShields 		:keepInvading 		"You have to destroy the fighters defending the planet to land." 
		setTextTrigger 		invadeContinue 		:shieldInvade 		"You have to destroy the Planetary Shields defending the planet to land." 
		setTextTrigger 		invadeDone     		:Invaded 		"<Destroy Planet>"
		setTextTrigger  	blockedInvade		:blockedInvading 	"Do you want instructions (Y/N)"
		setTextLineTrigger      noPlanet                :noPlanetToInvade       "Invalid registry number, landing aborted."
		setTextLineTrigger	invadequick		:Invaded		"  Item    Colonists  Colonists    Daily     Planet      Ship      Planet"
		setTextLineTrigger	noland			:doneInvading		"since it couldn't possibly stand the stress of landing."
		setTextLineTrigger      invadePod               :destroyedWhile         "Average Interval Lag:"
		pause
		:destroyedWhile
			killalltriggers
			send "* * q q q q r * l j"&#8&$planet~planet&"* j c * "
			setvar $switchboard~message "Podded while being a kamikaze, what did you really expect? Calling saveme in case I am not safely back on the planet.*"
			send $message
			halt
		:noPlanetToInvade
			killalltriggers
			setvar $switchboard~message "Planet number entered is not in this sector.*"
			goto :doneInvading
		:shieldInvade
			killalltriggers
			gosub :player~quikstats
			setVar $damageTaken ($ship~SHIP_FIGHTERS_MAX-$player~FIGHTERS)
			setvar $switchboard~message ""&$damageTaken&" points of damage taken from quasar cannon*"
			setVar $player~FIGHTERS ($player~FIGHTERS-$damageTaken)
			if ($player~FIGHTERS <= 0)
				goto :invadeRefurb
			end
			if ($player~shieldsOnly = TRUE)
				send "*"
				waitOn " / Shields "
				getWord CURRENTLINE $player~FIGHTERS 2
				getWord CURRENTLINE $planet~planet_shields 5
				if ($planet~planet_shields < 50)
					setvar $switchboard~message "Planet has less than 50 planetary shields.*"
					goto :doneInvading
				end
				while (($planet~planet_shields >= 50) AND ($player~FIGHTERS > 0))
					setVar $temp (((($planet~planet_shields-45)*20)*10)/$ship~SHIP_OFFENSIVE_ODDS)
					if ($temp >= $ship~SHIP_MAX_ATTACK)
						if ($player~FIGHTERS >= $ship~SHIP_MAX_ATTACK)
							setVar $amount $ship~SHIP_MAX_ATTACK
							setVar $temp ($temp-$ship~SHIP_MAX_ATTACK)
							setVar $player~FIGHTERS ($player~FIGHTERS-$ship~SHIP_MAX_ATTACK)
						else
							setVar $amount $player~FIGHTERS
							setVar $temp ($temp-$player~FIGHTERS)
							setVar $player~FIGHTERS 0
						end
					else
						setVar $amount $temp
						setVar $temp 0
					end
					send "a"&$amount&"*"
					waitOn " / Shields "
					getWord CURRENTLINE $planet~planet_shields 5

				end
				if ($planet~planet_shields < 50)
					setvar $switchboard~message "Planet has less than 50 planetary shields.*"
					goto :doneInvading
				end
			else
				while ($player~FIGHTERS > 0)
					if ($player~FIGHTERS >= $ship~SHIP_MAX_ATTACK)
						setVar $attackString $attackString&"z a "&$ship~SHIP_MAX_ATTACK&"* * "
						subtract $player~FIGHTERS $ship~SHIP_MAX_ATTACK
					else
						setVar $attackString $attackString&"z a "&$player~FIGHTERS&"* * "
						setVar $player~FIGHTERS 0
					end
				end
				send $attackString
			end
			goto :invadeRefurb
		:keepInvading
			killalltriggers
			gosub :player~quikstats
			setVar $figsToUse 9999
			setVar $attackString ""
			if ($defender = TRUE)
				if ($player~FIGHTERS = $ship~SHIP_FIGHTERS_MAX)
					setvar $switchboard~message "No damage being taken when landing defensively.*"
					goto :doneInvading
				end
			else
				while ($player~FIGHTERS > 0)
					if ($player~FIGHTERS >= $ship~SHIP_MAX_ATTACK)
						setVar $attackString $attackString&"z a "&$ship~SHIP_MAX_ATTACK&"* * "
						subtract $player~FIGHTERS $ship~SHIP_MAX_ATTACK
					else
						setVar $attackString $attackString&"z a "&$player~FIGHTERS&"* * "
						setVar $player~FIGHTERS 0
					end
				end
				send $attackString
				gosub :player~quikstats
				if ($player~FIGHTERS > 0)
					gosub :claimOrDestroyPlanet
					goto :doneInvading
				end
			end
		:invadeRefurb
			killalltriggers
			if ($startingLocation = "Citadel")
				send "z R * "&$refurbString
			else
				send "z R * "
				gosub :grabfigs
				gosub :player~quikstats
				if ($player~FIGHTERS < 100)
					gosub :grabfigs
				end
			end
			gosub :player~quikstats
	end
	goto :doneInvading
	:blockedInvading
		killalltriggers
		send "a y y "&$ship~SHIP_MAX_ATTACK&"* "&$refurbString
		goto :tryInvadeAgain
	:Invaded
		killalltriggers
		gosub :claimOrDestroyPlanet
	:doneInvading
		killalltriggers
		if ($startingLocation = "Citadel")
			send "q q q q * "&$refurbString&"C "
		else
			send "z R * q q q q * "
			gosub :grabfigs
		end
		setvar $switchboard~message "Kamikaze run ended.*"
		gosub :switchboard~switchboard
		halt

	:claimOrDestroyPlanet
		if ($zdy)
			if ($player~FIGHTERS > 1000)
				send "z a y "&($player~FIGHTERS-1000)&"* * Z D Y"
			else
				send "z d y "
			end
			setvar $switchboard~message "Invaded and attempting to blow planet, check for pods!*"
		else
			send "* * * o z c * c v y q q "
			setvar $switchboard~message "Invaded and claiming planet, attempting to evict all from citadel, check for people to kill!*"
		end
	return

:grabfigs
	send " F"
	waitOn "Your ship can support up to"
	getWord CURRENTLINE $ftrs_to_leave 10
	stripText $ftrs_to_leave ","
	stripText $ftrs_to_leave " "
	if ($ftrs_to_leave < 1)
		setVar $ftrs_to_leave 1
	end
	send " " & $ftrs_to_leave & " * C D"
return
# ======================     END KAMIKAZE (KAZI) SUBROUTINE    ==========================

#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\ship\getshipstats\ship"
