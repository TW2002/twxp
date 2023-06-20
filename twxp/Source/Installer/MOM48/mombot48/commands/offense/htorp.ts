	logging off
	gosub :BOT~loadVars
		
	setVar $BOT~help[1] $BOT~tab&"htorp "
	setVar $BOT~help[2] $BOT~tab&"  - Holoscans and then photons if enemy in adjacent sector."
	gosub :bot~helpfile


#===============================START HTORP (HTORP) =================================
:htorp

	gosub :PLAYER~quikstats
	if ($PLAYER~SCAN_TYPE <> "Holo")
		setvar $switchboard~message "You can not run htorp without a holographic scanner.*"
		gosub :switchboard~switchboard
		halt
	end
	setVar $PLAYER~startingLocation $PLAYER~CURRENT_PROMPT
	if ($PLAYER~startingLocation = "Command")
	
	elseif ($PLAYER~startingLocation = "Citadel")
		send "q "
		gosub :PLANET~getPlanetInfo
	else
		echo "*Wrong prompt for htorp.*"
		halt
	end
	if ($PLAYER~startingLocation = "Citadel")
		send "q szh* l " & $planet~planet & "* c "
	else
		send "szh* "
	end
	setTextLineTrigger checkForHolo :continueCheckHolo "Select (H)olo Scan or (D)ensity Scan or (Q)uit?"
	setTextLineTrigger checkForDens :photonedhtorp "Relative Density Scan"  
	pause
	:continueCheckHolo
		setTextTrigger htorpsector :continuehtorpsector "[" & $PLAYER~CURRENT_SECTOR & "]"
		pause
	:continuehtorpsector
	if ($PLAYER~PHOTONS <= 0)
		echo ANSI_14 & "*No Photons on hand.**" & ANSI_7
		halt
	end
	setVar $i 1
	while (SECTOR.WARPS[$PLAYER~CURRENT_SECTOR][$i] > 0)
		setVar $adj_sec SECTOR.WARPS[$PLAYER~CURRENT_SECTOR][$i]
		if (SECTOR.TRADERCOUNT[$ADJ_SEC] > 0)
			setVar $targetInSector FALSE
			setVar $player~corpMemberInSector FALSE
			setVar $j 1
			while (SECTOR.TRADERS[$ADJ_SEC][$j] <> 0)
				setVar $tempTarget SECTOR.TRADERS[$ADJ_SEC][$j]
				getLength $tempTarget $targetLength
				if ($targetLength >= 4)
					cutText $tempTarget $targetCorp ($targetLength-4) 999
					getText $targetCorp $targetCorp "[" "]"
					if ($targetCorp <> $PLAYER~CORP)
						setVar $targetInSector TRUE
					end
					if ($targetCorp = $PLAYER~CORP)
						setVar $player~corpMemberInSector TRUE
					end
				end
				add $j 1
			end
			if (($targetInSector = TRUE) AND ($player~corpMemberInSector = FALSE) and ($adj_sec > 10) and ($adj_sec <> $map~stardock))
				send "c p y " $ADJ_SEC "* *q"
				setvar $switchboard~message "Photon fired into sector " & $ADJ_SEC & "!*"
				gosub :switchboard~switchboard
				halt
			end
		end
		add $i 1
	end
	if ($PLAYER~startingLocation = "Citadel")
		setTextTrigger waitforcit :continuewaitforcit "Citadel command (?=help)"
		pause
		:continuewaitforcit
	end
	echo ANSI_14 & "*No valid targets**" & ANSI_7
	halt
:photonedHtorp
	setvar $switchboard~message "You have no holographic scanner, perhaps you were photoned?*"
	gosub :switchboard~switchboard
halt
#========================== END HTORP SUB ==============================================



#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\getplanetinfo\planet"
