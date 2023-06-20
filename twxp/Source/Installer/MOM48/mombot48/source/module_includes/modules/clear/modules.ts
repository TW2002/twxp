:clear
	loadvar $game~game_menu_prompt
	gosub :PLAYER~QUIKSTATS
	setVar $startingLocation $PLAYER~CURRENT_PROMPT
	if ((currentsector = $map~stardock) or (currentsector <= 10))
		setVar $SWITCHBOARD~message "Can't clear fedspace.*"
		gosub :SWITCHBOARD~switchboard
		return
	end
	setVar $bot~validPrompts "Command Citadel"
	gosub :bot~checkStartingPrompt

	setvar $bwarp false
	if ($startingLocation = "Citadel")
		send "q"
		gosub :PLANET~getPlanetInfo
		send "c  s*"
		if (($planet~planet_TRANSPORT >= 1) and ($player~unlimitedGame = true))
			setvar $bwarp true
		end
	else
		send "*"
	end
	getWordPos " "&$bot~user_command_line&" " $pos " bwarp "
	if ($pos > 0)
		setVar $bwarp TRUE
	end

	setVar $beforeLimpets $PLAYER~LIMPETS
	setVar $beforeArmids  $PLAYER~ARMIDS
	setVar $placedLimpet FALSE
	setVar $placedArmid FALSE
	waitOn "Warps to Sector(s) :"
	setVar $limpetOwner SECTOR.LIMPETS.OWNER[$PLAYER~CURRENT_SECTOR]
	setVar $armidOwner SECTOR.MINES.OWNER[$PLAYER~CURRENT_SECTOR]
	if (($PLAYER~LIMPETS <= 0) AND (($limpetOwner <> "belong to your Corp") AND ($limpetOwner <> "yours")))
		setVar $SWITCHBOARD~message "Need limpets to clear this sector*"
		return 
	end
	if (($PLAYER~ARMIDS <= 0) AND (($armidOwner <> "belong to your Corp") AND ($armidOwner <> "yours")))
		setVar $SWITCHBOARD~message "Need armids to clear this sector*"
		return
	end
	if ((($limpetOwner = "belong to your Corp") or ($limpetOwner = "yours")) and (($armidOwner = "belong to your Corp") or ($armidOwner = "yours")))
		setVar $SWITCHBOARD~message "Current Sector Already Clear of Enemy Mines!*"
		return
	end
	gosub :attemptClearingMines
	while (($placedLimpet = FALSE) OR ($placedArmid = FALSE))
		gosub :attemptClearingMines
	end
	setSectorParameter $PLAYER~CURRENT_SECTOR "LIMPSEC" TRUE
	setSectorParameter $PLAYER~CURRENT_SECTOR "MINESEC" TRUE
	setvar $switchboard~message "Sector Cleared*"
		
	return
	

	:attemptClearingMines
	killtrigger LAID_LIMP
	killtrigger LAID_ARMID
	setVar $LAID_ARMID $placedArmid
	setVar $LAID_LIMP $placedLimpet

	if ($bwarp = true)
		setVar $i 0
		setvar $bwarp_move  "b"&$player~current_sector&"*"
		setvar $bwarp_clear "y   *  l j" & #8 & #8 & #8 & #8 & #8 & $planet~planet & "*  j  c  *  "
		
		if ($reckless <> true)
			while ($i <= 5)
				killtrigger 1
				killtrigger 2
				killtrigger 3
				killtrigger 4
				setTextTrigger 1 :no_bwarp_lock "Do you want to make this transport blind?"
				setTextTrigger 2 :bwarp_lock "All Systems Ready, shall we engage?"
				setTextLineTrigger 3 :bwarpNoFuel "This planet does not have enough Fuel Ore to transport you."
				settexttrigger 4 :switchtononbwarp "Your ship was hit by a Photon and has been disabled."
				send $bwarp_move
				pause

				:no_bwarp_lock
					killalltriggers
					send "n "
					setVar $SWITCHBOARD~message "Fighter is gone from sector!  Stopping, check for enemies!*"
					gosub :SWITCHBOARD~switchboard
					halt

				:bwarpNofuel
					killalltriggers
					setVar $SWITCHBOARD~message "Not enough fuel on the planet! Stopping.*"
					gosub :SWITCHBOARD~switchboard
					halt
				:bwarp_lock
					send $bwarp_clear
	
				add $i 1
			end
		else
			send $bwarp_move "  " $bwarp_clear $bwarp_move "  " $bwarp_clear $bwarp_move "  " $bwarp_clear $bwarp_move "  " $bwarp_clear $bwarp_move "  " $bwarp_clear
		end

		killtrigger 1 
		killtrigger 2
		killtrigger 3
		if ($player~surroundmine <= 0)
			setvar $player~surroundmine 3
		end
		if ($player~surroundlimp <= 0)
			setvar $player~surroundlimp 3
		end
		setvar $grid_armids $player~surroundmine
		setvar $grid_limpets $player~surroundlimp
		if ($grid_armids = 0)
			setVar $_ARMIDS_ " "
			setVar $placedArmid TRUE
		else
			setVar $_ARMIDS_ " h 1 z " & $grid_armids & "* z c * "
			setTextLineTrigger	LAID_ARMID	:LAID_ARMID	"Armid mine(s) on board."
		end
		if ($grid_limpets = 0)
			setVar $_LIMPS_ " "
			setVar $placedLimpet TRUE
		else
			setVar $_LIMPS_ "h 2 z " & $grid_limpets & "* z c * "
			setTextLineTrigger	LAID_LIMP	:LAID_LIMP	"Limpet mine(s) on board."
		end

		send "q  q  "&$_ARMIDS_&$_LIMPS_&" l "&$planet~planet&"*  c  "
		
		gosub :PLAYER~quikstats
		waiton "Citadel command"

	else
		:switchtononbwarp
		setvar $modules~minesToDeploy $grid_armids
		setvar $modules~limpsToDeploy $grid_limpets
		gosub :player~quikstats
		if ($player~current_prompt = "Qcannon")
			send "s" $percentToSet "* "
			gosub :player~quikstats
		end
		gosub :clear_sector_attemptClearingMines
		gosub :player~quikstats
		setSectorParameter $PLAYER~CURRENT_SECTOR "MINESEC" TRUE
		setSectorParameter $PLAYER~CURRENT_SECTOR "LIMPSEC" TRUE
		setVar $LAID_ARMID TRUE
		setVar $LAID_LIMP TRUE
		setVar $placedLimpet TRUE
		setVar $placedArmid TRUE
	end
return
	:LAID_ARMID
		setVar $LAID_ARMID TRUE
		setVar $placedArmid TRUE
		pause
	:LAID_LIMP
		setVar $LAID_LIMP TRUE
		setVar $placedLimpet TRUE
		pause



	:clear_sector_attemptClearingMines
		setVar $i 0
		while ($i < 10)
			gosub :clear_sector_xenter
			add $i 1
		end
		gosub :player~quikstats
		gosub :clear_sector_deployEquipment
		return
	:clear_sector_xenter
		if ($startingLocation = "Command")
			setvar $exit_mac "q y n * "
			setvar $exit_enter " t* * *"&$BOT~password&"*    *    *       za9999*   z*   /"
		else
			setvar $exit_mac "r   y   * * "
			setvar $exit_enter " t* * *"&$BOT~password&"*    *    *    m * * *   q  *    *    *     za9999*   z*   f z1* z c d *  l j"&#8&$planet~planet&"* c  /"
		end
		killtrigger 1
		killtrigger 2
		killtrigger 3
		send $exit_mac
		settexttrigger 1 :pickgame "Selection (? for menu)"
		settexttrigger 2 :enter_choice "Enter your choice:"
		settexttrigger 3 :pickgame $game~game_menu_prompt
		pause
		:enter_choice

		killtrigger 1
		killtrigger 2
		killtrigger 3
		send $exit_enter
		waitOn #179

	return
	:clear_sector_deployEquipment
		if ($startingLocation = "Citadel")
			send "q qq z n *  "
		end
		if ($player~surroundmine <= 0)
			setvar $player~surroundmine 3
		end
		if ($player~surroundlimp <= 0)
			setvar $player~surroundlimp 3
		end
		if ($minesToDeploy <= 0)
			if ($PLAYER~ARMIDS < $player~surroundmine)
				setVar $minesToDeploy $PLAYER~ARMIDS
			else
				setVar $minesToDeploy $player~surroundmine
			end
		end
		if ($limpsToDeploy <= 0)
			if ($PLAYER~LIMPETS < $player~surroundlimp)
				setVar $limpsToDeploy $PLAYER~LIMPETS
			else
				setVar $limpsToDeploy $player~surroundlimp
			end
		end
		setVar $clearMac ""
		if (($armidOwner <> "belong to your Corp") AND ($armidOwner <> "yours"))
			setVar $clearMac $clearMac&"h  1  z " & $minesToDeploy & "*  z c  *  "
		end
		if (($limpetOwner <> "belong to your Corp") AND ($limpetOwner <> "yours"))
			setVar $clearMac $clearMac&"h  2  z " & $limpsToDeploy & "*  z c  *   "
		end
		send $clearMac
		gosub :PLAYER~quikstats
		if (($beforeLimpets > $PLAYER~LIMPETS) OR (($limpetOwner = "belong to your Corp") OR ($limpetOwner = "yours")))
			setVar $placedLimpet TRUE
		end
		if (($beforeArmids > $PLAYER~ARMIDS) OR (($armidOwner = "belong to your Corp") OR ($armidOwner = "yours")))
			setVar $placedArmid TRUE
		end
		if ($startingLocation = "Citadel")
			send "l j"&#8&$planet~planet&"* c  "
		end
		return
return

:pickgame
	killtrigger 2
	killtrigger 3
	send $BOT~letter&"  *  "
	waiton "[Pause]"
	send " * "
	goto :enter_choice


