	reqRecording
	gosub :BOT~loadVars
	setVar $BOT~command "saveme"
	loadVar $BOT~bot_turn_limit
	loadVar $MAP~stardock
	loadvar $bot~subspace
	loadvar $switchboard~self_command

	setVar $BOT~help[1]    $BOT~tab&"saveme [on/off] {delay} {"&#34&"target name"&#34&"} "
	setVar $BOT~help[2]    $BOT~tab&"       "
	setVar $BOT~help[3]    $BOT~tab&"      {delay} - number of seconds to wait before "
	setVar $BOT~help[4]    $BOT~tab&"                moving planet back to starting sector"         
	setVar $BOT~help[5]    $BOT~tab&"{target name} - saveme for only one player "
	setVar $BOT~help[6]    $BOT~tab&"   {defender} - Let's corp mates ride shields"
	setVar $BOT~help[7]    $BOT~tab&"                and lift. "
	setVar $BOT~help[8]    $BOT~tab&"       {kill} - Kill option to attack."
	setVar $BOT~help[9]    $BOT~tab&"                              "
	setVar $BOT~help[10]   $BOT~tab&"    While running saveme, you can say: "
	setVar $BOT~help[11]   $BOT~tab&"         bot_name personal limp - drop personal limp "
	setVar $BOT~help[12]   $BOT~tab&"         bot_name deploy mines - drop corporate mines"
	setVar $BOT~help[13]   $BOT~tab&"         abort saveme - cancel saveme call"
	setVar $BOT~help[14]   $BOT~tab&"         "
	setVar $BOT~help[15]   $BOT~tab&"               - Originally written by Cherokee"
	gosub :bot~helpfile


	setVar $PLAYER~save TRUE


	getSectorParameter SECTORS "FIGSEC" $isFigged

# Defender Vars
setVar $defender 0
setVar $defender_kill 0
setVar $defenders 0
setVar $cannonAtmos 0
setVar $millevel 0

		
# ============================== START ACTIVATE SAVEME (SAVEME) ==============================
:saveme

	gosub :player~quikstats
	setVar $startingLocation $player~CURRENT_PROMPT
	if ($bot~parm1 <> "on") and ($bot~parm1 <> "off")
		setvar $switchboard~message "Please use - saveme [on/off] format*"
		gosub :switchboard~switchboard
		halt
	end

	if ($bot~parm1 = "on")
		if ($startingLocation <> "Citadel")
			setvar $switchboard~message "Must start at Citadel prompt*"
			gosub :switchboard~switchboard
			halt
		end
		isNumber $isnum $bot~parm2
		if ($isnum = 1)
			if ($bot~parm2 > 0)
				setVar $returnHome TRUE
				setVar $savemeDelay $bot~parm2
			else
				setVar $returnHome FALSE
				setVar $savemeDelay 0
			end
			setVar $home_sector2 $player~CURRENT_SECTOR

		else
			setVar $returnHome FALSE
			setVar $savemeDelay 0

		end
		if ($returnHome)
			setvar $switchboard~message "Activating SaveMe, Return Home enabled*"
			gosub :switchboard~switchboard
		else
			setvar $switchboard~message "Activating SaveMe*"
			gosub :switchboard~switchboard
		end
		send "q"
		gosub :planet~getPlanetInfo
		send "c "
		setVar $targetingPerson FALSE
		getWordPos $bot~user_command_line $pos #34
		if ($pos > 0)	
			setvar $bot~user_command_line $bot~user_command_line&" "
			getText " "&$bot~user_command_line&" " $target " "&#34 #34&" "
			if ($target <> "")
				setVar $targetingPerson TRUE
				lowercase $target
				cutText $target $subTarget 1 6
				stripText $bot~user_command_line " "&#34&$target&#34&" "
			else
				setVar $targetingPerson FALSE
			end
		end
		getWordPos $bot~user_command_line $pos " defender"
		if ($pos > 0)	
			setVar $defmsg "Running with Defender*"
			setVar $defender 1
			getWordPos $bot~user_command_line $pos " kill"
			if ($pos > 0)
				setVar $defender_kill 1
				setVar $defmsg "Running with Defender and Kill.*"
				setvar $switchboard~message $defmsg 
				gosub :switchboard~switchboard
			end
			goSub :checkDefenders
			goSub :setdefender
		end
		if ($returnHome)
			if ($targetingPerson)
				setvar $switchboard~message "Saveme - Running from planet " & $planet~planet & " for "&$target&", " & $savemeDelay & " second return home delay.*"
				gosub :switchboard~switchboard
			else
				setvar $switchboard~message "Saveme - Running from planet " & $planet~planet & ", " & $savemeDelay & " second return home delay.*"
				gosub :switchboard~switchboard
			end

		else
			if ($targetingPerson)
				setvar $switchboard~message "Saveme - Running from planet " & $planet~planet & " for "&$target&".*"
				gosub :switchboard~switchboard
			else
				setvar $switchboard~message "Saveme - Running from planet " & $planet~planet & ".*"
				gosub :switchboard~switchboard
			end
		end
		gosub :SHIP~getShipStats
		goto :settriggers
	else
		setvar $switchboard~message "Please use - saveme [on/off] format**"
		gosub :switchboard~switchboard
		halt
	end
# ============================== END ACTIVATE SAVEME (SAVEME) SUB ==============================

# ============================== ACTIVATE SAVEME ON CORPIE CALL ==============================
:saveCall
	killalltriggers
	setVar $line CURRENTLINE
	gosub :authenticate
	if ($auth_result = "true")
		cutText $line $target_sector 9 13
	elseif ($auth_result = "self")
		cutText $line $target_sector 2 12
	else
		goto :settriggers
	end
	setVar $target_sector " " & $target_sector
	striptext $target_sector " 000"
	striptext $target_sector " 00"
	striptext $target_sector " 0"
	striptext $target_sector " "
	striptext $target_sector "=saveme"
	isNumber $isnum $target_sector
	setvar $mac  "P" & $target_sector & "*Y"
	setvar $saveme_mac $mac&$mac&$mac&$mac&$mac&$mac&$mac&$mac&$mac&$mac
	if ($isnum = 1)
		if (($target_sector > 0) AND ($target_sector <= SECTORS))
		setTextLineTrigger abort :abort "abort saveme"
		setTextLineTrigger there :there "You are already in that sector!"
		setVar $i 0
		setVar $j 0
		send $saveme_mac
		:pwarp1
			add $i 1
			add $j 1
			if ($j = 100)
				send "'no fig down yet, 100 attempts, aborting*"
				goto :settriggers
			elseif ($i = 10)
				send "'no fig down yet*"
				setVar $i 0
			end
			send "P" & $target_sector & "*Y"
			setTextLineTrigger nofig :nofig "You do not have any fighters"
			pause

		:nofig
                	goto :pwarp1

		:there
                	killtrigger abort
	                killtrigger nofig
			send "'Saveme script activated - Planet " & $planet~planet & " to " & $target_sector & " on attempt " & $j & ".*"
        	        send "IS*"
			if ($defender = 1)
				gosub :liftDefenders
			end
			if ($returnHome)
				setDelayTrigger savemereturn :returnsaveme ($savemeDelay*1000)
				pause
				:returnsaveme
					send "P" & $home_sector2 & "*Y"
                	end
			goto :settriggers

            	:abort
                	killtrigger nofig
       		    	killtrigger abort
	                setvar $switchboard~message "Save Aborted*"
	                gosub :switchboard~switchboard
        	        if ($returnHome)
						setDelayTrigger savemereturn :returnsaveme ($savemeDelay*1000)
						pause
						:returnsaveme
							send "P" & $home_sector2 & "*Y"
					end
					goto :settriggers

	        else
			send "'Invalid save call (out of range)*"
			if ($returnHome)
				setDelayTrigger savemereturn :returnsaveme ($savemeDelay*1000)
				pause
				:returnsaveme
					send "P" & $home_sector2 & "*Y"
                	end
                       goto :settriggers
		end

    	else
        	send "'Invalid save call (non-numeric)*"
	        if ($returnHome)
				setDelayTrigger savemereturn :returnsaveme ($savemeDelay*1000)
				pause
				:returnsaveme
					send "P" & $home_sector2 & "*Y"
                 end
                 goto :settriggers
	end



:End
	killalltriggers
	send "P" & $home_sector2 & "*Y"
        goto :settriggers

:authenticate
	killalltriggers
	setVar $subLine $line
	setVar $subLine $subLine & "             "
	getWord $subLine $spoof 1
	cutText $subLine $subSender 3 6
	setVar $auth_result "false"
	if ($targetingPerson = true)
		lowerCase $subSender
		trim $subsender
		trim $subtarget
		if ($spoof = "'")
			setVar $auth_result "self"
		elseif ($spoof = "R")
			#send "'["&$subsender&"] = ["&$subtarget&"]*"
			if ($subSender = $subTarget)
				setVar $auth_result "true"
			end
		end
	else
		if ($spoof = "'")
			setVar $auth_result "self"
		elseif ($spoof = "R")
			setVar $auth_result "true"
		end
	end
return

:settriggers
	killalltriggers
	setTextLineTrigger 1 :announce "script?"
	setTextLineTrigger 2 :announce "Script?"
	setTextLineTrigger 3 :saveCall "=saveme"
	setTextLineTrigger 4 :savemeDeployMines $bot~bot_name & " Deploy Mines"
	setTextLineTrigger 5 :savemePersonalLimpet $bot~bot_name & " Personal Limp"
	setTextLineTrigger 6 :savemeDeployMines $bot~bot_name & " deploy mines"
	setTextLineTrigger 7 :savemePersonalLimpet $bot~bot_name & " personal limp"
	settexttrigger     8 :attackpod "'s ship just exploded into a brilliant fireball!"
pause


:attackpod
	killalltriggers
	send "q q z n a y y " $ship~SHIP_MAX_ATTACK "* * z n q z n  l " $planet~planet "* n n * j m  * * * c  s*  @"
	waitOn "Average Interval Lag:"
	setvar $switchboard~message "Attempted to blow up pod in sector.  Not sure if it worked!*"
	gosub :switchboard~switchboard
	goto :settriggers

:announce
	killalltriggers
	gosub :authenticateannounce
	if ($auth_result)
		setvar $switchboard~message "*Save Me - Running from planet " & $planet~planet & "*---Command List---*" & $bot~bot_name & " Deploy Mines*" & $bot~bot_name & " Personal Limp*----End of List---** "
		gosub :switchboard~message
	end
	waitOn "----End of List---"
	goto :Settriggers

:authenticateannounce
    killalltriggers
    setVar $subLine CURRENTLINE
    cuttext $subLine $spoof 1 1
    setVar $auth_result FALSE
    if ($spoof = "R")
		setVar $auth_result TRUE
    end
return

# ============================== DEFENDER ROUTINES ==============================

:liftDefenders
	# can't wait for this one, we just hope for the best!

	send "'defender mac r ^M ^M *"
	
	
	if ($defender_kill = 1)
		setDelayTrigger killwait :killwait 400
		pause
		:killwait
		send "'defender kill*"
		
	end
	setTextLineTrigger wrongprompt :wrongprompt "Wrong prompt for auto kill"
	setTextLineTrigger resetsaveme :resetsaveme "resetsaveme"
	pause
	:wrongprompt
		killtrigger wrongprompt
		send "'defender kill*" 
		pause
	:resetsaveme

		goSub :setdefender
return

:checkDefenders

	setVar $defenders 0
	send "'defender callout*"
	
	
	setDelayTrigger defwait :defwait 3000
	:defmore
	setTextLineTrigger deffound :deffound "Team: defender"
	pause
	:deffound
		killtrigger deffound
		add $defenders 1
		goto :defmore
	:defwait
		killalltriggers

	if ($defenders = 0)
		setvar $switchboard~message "We need at least one defender in this mode*"
		gosub :switchboard~switchboard
		halt
	else
		setvar $switchboard~message "We have defenders.*"
		gosub :switchboard~switchboard
		
	end
		
return
:setdefender
	
	goSub :disArmPlanet

	send "'defender mac l" & $planet~planet & "^M^M*"
	
	setVar $defresp 0

	setDelayTrigger defwaitland :defwaitland 3000
	:deflandmore
	setTextLineTrigger deflanded :deflanded " - Macro Complete"
	pause
	:deflanded
		killtrigger deflanded
		add $defresp 1
		goto :deflandmore
	:defwaitland
		killalltriggers

	if ($defenders <> $defresp)
		setvar $switchboard~message "We didn't get all defenders landing, aborting!*"
		gosub :switchboard~switchboard
		halt
	end
	
	goSub :armPlanet
return

:disArmPlanet
	
	setVar $cannonAtmos $planet~ATMOSPHERE_CANNON
	setVar $millevel $planet~MILITARYREACTION
	setvar $switchboard~message "Disarming planet from Atmos Cannon: "& $cannonAtmos &" and MR:" & $millevel & "*"
	gosub :switchboard~switchboard
	
	send "la0*m0*qopc"
	waitfor "<Enter Citadel>"
	
return

:armPlanet
	
	setvar $switchboard~message "Arming planet to Atmos Cannon: "& $cannonAtmos &" and MR:" & $millevel & "*"
	gosub :switchboard~switchboard
	
	send "la" $cannonAtmos "*m" $millevel "*qocc"
	waitfor "<Enter Citadel>"
	
return

# ============================== END DEFENDER ROUTINES ==============================

# ============================== END ACTIVATE SAVEME ON CORPIE CALL SUB ==============================

# ============================== START PERSONAL LIMP (LIMP) SUB ==============================
:savemePersonalLimpet
	setVar $limp "p"
	setVar $bot~parm1 1
	goto :plimp


:plimp
	killalltriggers
	gosub :player~quikstats
	if ($player~LIMPETS <= 0)
		setvar $switchboard~message "Out of limpets!*"
		gosub :switchboard~switchboard
		goto :settriggers
	end
	if ($startingLocation = "Citadel")
		send "q q z* h2z" $bot~parm1 "* z " $limp " z * * *l " $planet~planet "* c"
		setTextLineTrigger toomanypl :toomany_limp "!  You are limited to "
		setTextLineTrigger plclear :plclear_limp "Done. You have "
		setTextLineTrigger enemypl :noperdown_limp "These mines are not under your control."
		setTextLineTrigger notenough :toomany_limp "You don't have that many mines available."
		pause
	elseif ($startingLocation = "Command")
		send "z* h2z" $bot~parm1 "* z " $limp " z * *"
		setTextLineTrigger toomanypl :toomany_limp "!  You are limited to "
		setTextLineTrigger plclear :plclear_limp "Done. You have "
		setTextLineTrigger enemypl :noperdown_limp "These mines are not under your control."
		setTextLineTrigger notenough :toomany_limp "You don't have that many mines available."
		pause
	else
		setvar $switchboard~message "Not at the correct prompt for deploying limpets.*"
		gosub :switchboard~switchboard
		goto :settriggers
	end
	
	
:plclear_limp
	killalltriggers
	if ($startingLocation = "Citadel")
		setTextTrigger checklimpcommand :continuechecklimpcitadel "Citadel command (?=help)"
		pause
		:continuechecklimpcitadel
		send "s* "
		setTextLineTrigger perdown :perdown_limp "(Type 2 Limpet) (yours)"
		setTextLineTrigger cordown :cordown_limp "(Type 2 Limpet) (belong to your Corp)"
		setTextLineTrigger noperdown :noperdown_limp "Citadel treasury contains"
		pause
	elseif ($startingLocation = "Command")
		setTextTrigger checklimpcommand :continuechecklimpcommand "Command [TL="
		pause
		:continuechecklimpcommand
		send "d* "
		setTextLineTrigger perdown :perdown_limp "(Type 2 Limpet) (yours)"
		setTextLineTrigger cordown :cordown_limp "(Type 2 Limpet) (belong to your Corp)"
		setTextLineTrigger noperdownp :noperdown_limp "Warps to Sector(s)"
		pause
	else
		setvar $switchboard~message "Not at the correct prompt for deploying limpets.*"
		gosub :switchboard~switchboard
		goto :settriggers
	end

:cordown_limp
	killalltriggers
	if ($startingLocation = "Citadel")
		waitOn "Citadel command (?=help)"
		setvar $switchboard~message  $bot~parm1&" Corporate Limpets Deployed!*"
		gosub :switchboard~switchboard
	end
	if ($startingLocation = "Command")
		waitOn "Command [TL="
		setvar $switchboard~message  $bot~parm1&" Corporate Limpets Deployed!*"
		gosub :switchboard~switchboard
	end
	setSectorParameter $player~current_sector "LIMPSEC" TRUE
	goto :settriggers


:perdown_limp
	killalltriggers
	if ($startingLocation = "Citadel")
		waitOn "Citadel command (?=help)"
		if ($bot~parm1 = 1)
			setvar $switchboard~message  $bot~parm1&" Personal Limpet Deployed!*"
			gosub :switchboard~switchboard
		else
			setvar $switchboard~message $bot~parm1&" Personal Limpets Deployed!*"
			gosub :switchboard~switchboard
		end
	end
	if ($startingLocation = "Command")
		waitOn "Command [TL="
		if ($bot~parm1 = 1)
			setvar $switchboard~message $bot~parm1&" Personal Limpet Deployed!*"
			gosub :switchboard~switchboard
		else
			setvar $switchboard~message $bot~parm1&" Personal Limpets Deployed!*"
			gosub :switchboard~switchboard
		end
	end
	goto :settriggers

:noperdown_limp
	killalltriggers
	if ($startingLocation = "Citadel")
		waitOn "Citadel command (?=help)"
		setvar $switchboard~message "Sector already has enemy limpets present!*"
		gosub :switchboard~switchboard
		goto :settriggers
	end
	if ($startingLocation = "Command")
		waitOn "Command [TL="
		setvar $switchboard~message "Sector already has enemy limpets present!*"
		gosub :switchboard~switchboard
		goto :settriggers
	end

:toomany_limp
	killalltriggers
	if ($startingLocation = "Citadel")
		waitOn "Citadel command (?=help)"
		setvar $switchboard~message "Cannot Deploy Limps!*"
		gosub :switchboard~switchboard
		goto :settriggers
	else
		waitOn "Command [TL="
		setvar $switchboard~message "Cannot Deploy Limps!*"
		gosub :switchboard~switchboard
		goto :settriggers
	end
# ============================== END PERSONAL LIMP SUB ==============================

# ============================== MINES (ARMID AND LIMP) SUB ==============================
:savemeDeployMines
	setVar $bot~parm1 3
	setVar $limp "c"
	setVar $armid "c"
	
:mines
	KillAllTriggers
	gosub :player~quikstats
	setVar $startingLocation $player~CURRENT_PROMPT
	if ($bot~parm1 = 0)
		setVar $bot~parm1 3
	end
	if ($startingLocation <> "Citadel") and ($startingLocation <> "Command")
     		setvar $switchboard~message "Must start at Citadel or Command Prompt.*"
     		gosub :switchboard~switchboard
     		goto :settriggers
	end
	if ($startingLocation = "Citadel")
		send "q "
		gosub :planet~getPlanetInfo
		send "c "
	end
	setVar $preDeployArmids $player~ARMIDS
	setvar $preDeployLimpets $player~LIMPETS



	if ($startingLocation = "Citadel")
		send "s* "
		waitOn "Warps to Sector(s) :"
		setVar $limpener SECTOR.LIMPETS.OWNER[$player~CURRENT_SECTOR]
		setVar $armidOwner SECTOR.MINES.OWNER[$player~CURRENT_SECTOR]
		if (($player~ARMIDS <= 0) AND (($armidOwner <> "belong to your Corp") AND ($armidOwner <> "yours")))
			setvar $switchboard~message "Out of armids!*"
			gosub :switchboard~switchboard
			goto :settriggers
		elseif (($bot~parm1 > $player~ARMIDS) AND (($armidOwner <> "belong to your Corp") AND ($armidOwner <> "yours")))
			setVar $bot~parm1 $player~ARMIDS
		end
		if (($player~LIMPETS <= 0) AND (($limpetOwner <> "belong to your Corp") AND ($limpetOwner <> "yours")))
			setvar $switchboard~message "Out of limpets!*"
			gosub :switchboard~switchboard
			goto :settriggers
		elseif (($bot~parm1 > $player~LIMPETS) AND (($limpetOwner <> "belong to your Corp") AND ($limpetOwner <> "yours")))
			setVar $bot~parm1 $player~LIMPETS
		end
		send "q q z n h 2 z " $bot~parm1 "*  z" $limp " * * h 1 z " $bot~parm1 "*  z " $armid " * * * l " $planet~planet "* c "
	end
	if ($startingLocation = "Command")
		send "** "
		waitOn "Warps to Sector(s) :"
		setVar $limpetOwner SECTOR.LIMPETS.OWNER[$player~CURRENT_SECTOR]
		setVar $armidOwner SECTOR.MINES.OWNER[$player~CURRENT_SECTOR]
		send "z n h 2 z " $bot~parm1 "*  z " $limp "  * * h 1 z " $bot~parm1 "*  z" $armid "  * * "
	end
	gosub :player~quikstats

	if (($predeployArmids > $player~ARMIDS) AND ($predeployLimpets > $player~LIMPETS))
		setvar $switchboard~message  $bot~parm1&" Armid and Limpet mines deployed into the sector!*"
		gosub :switchboard~switchboard
	elseif ($predeployArmids > $player~ARMIDS)
		setvar $switchboard~message  $bot~parm1&" Armid mine(s) deployed into the sector!*"
		gosub :switchboard~switchboard
	elseif ($predeployLimpets > $player~LIMPETS)
		setvar $switchboard~message  $bot~parm1&" Limpet mine(s) deployed into the sector!*"
		gosub :switchboard~switchboard
	end
	if ($predeployArmids < $player~ARMIDS)
		setvar $switchboard~message  ($player~armids-$predeployArmids)&" Armid mines picked up from sector!*"
		gosub :switchboard~switchboard
	elseif (($predeployArmids = $player~ARMIDS) AND (($armidOwner <> "belong to your Corp") AND ($armidOwner <> "yours")))
		setvar $switchboard~message "Enemy armid(s) present in sector, cannot deploy!*"
		gosub :switchboard~switchboard
	end
	if ($predeployLimpets < $player~LIMPETS)
		setvar $switchboard~message ($player~LIMPETS-$predeployLimpets)&" Limpet mines picked up from sector!*"
	elseif (($predeployLimpets = $player~LIMPETS) AND (($limpetOwner <> "belong to your Corp") AND ($limpetOwner <> "yours")))
		setvar $switchboard~message "Enemy limpet(s) present in sector, cannot deploy!*"
		gosub :switchboard~switchboard
	end
	goto :settriggers


# ============================== END MINES (ARMID AND LIMP) SUB ==============================


#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\ship\getshipstats\ship"
include "source\bot_includes\planet\getplanetinfo\planet"
