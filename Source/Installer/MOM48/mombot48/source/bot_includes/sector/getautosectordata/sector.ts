##################################################################################
# requires $player~startingLocation to be set before getAutoSectorData is called #
##################################################################################

:getAutoSectorData
	setVar $ENDLINE     "_ENDLINE_"
	setVar $STARTLINE   "_STARTLINE_"
	
	setarray $adjacent 7
	setarray $adjacent_sector 7
	setvar $adjcount 1

	
	killalltriggers
	:startover
	setVar $sectorData ""
	setvar $first true
	:auto_sectorsline_cit_kill
		setVar $line CURRENTANSILINE
		setVar $line $STARTLINE&$line&$ENDLINE
		setVar $sectorData $sectorData&$line
		getWordPos $line $pos "Sector  [33m: "
		if ($pos > 0)
			if ($first)
				setvar $first false				
				getText $line $tempSector "Sector  [33m: [36m" " [0;32min" 
			else
				setvar $adjacent[$adjcount] $sectorData&$STARTLINE&"[0m[1;32mWarps to Sector(s) "&$ENDLINE
				setvar $adjacent_sector[$adjcount] $tempSector
				add $adjcount 1
				getText $line $tempSector "Sector  [33m: [36m" " [0;32min" 
				setVar $sectorData $line				
			end
		end
		getWordPos $line $pos "Warps to Sector(s) "
		getword currentline $check 1			
		if (($pos > 0) and ($check = "Warps"))
			setvar $adjacent[$adjcount] $sectorData
			setvar $adjacent_sector[$adjcount] $tempSector
			goto :gotAutoSectorData
		else
			setTextLineTrigger getLine :auto_sectorsline_cit_kill
		end
		pause
	:gotAutoSectorData
		settexttrigger nomines :nominesauto "Citadel command (?=help)" 
		settexttrigger nomines2 :nominesauto "Command ["
		settexttrigger mines :minesauto "Mined Sector: Do you wish to Avoid this sector in the future? (Y/N)"
		pause

		:minesauto
		send "* "
		:nominesauto
		killtrigger nomines
		killtrigger nomines2
		killtrigger mines

		setvar $sindex $adjcount
		while ($sindex > 0)
			setvar $holotargetfound false
			setvar $sectortargetfound false
			setvar $sectorData $adjacent[$sindex]
			setvar $targetSector $adjacent_sector[$sindex]
			if (($sectorData <> "") and ($sectorData <> "0"))
				getWordPos $sectorData $beaconPos "[0m[35mBeacon  [1;33m:"
				if ($beaconPos > 0)
					setVar $containsBeacon TRUE
				else
					setVar $containsBeacon FALSE
				end
				setvar $player~current_sector $targetSector
				if ($sindex = $adjcount)
					setvar $starting_sector $targetSector
				end
				goSub :getTraders
				goSub :getEmptyShips
				goSub :getFakeTraders
				setVar $c 1
				setvar $player~isFound false
				#echo "*Number of real traders: " $realTraderCount " in sector " $player~current_sector "*"
				while (($c <= $realTraderCount) AND ($player~isFound = FALSE))
					if (($player~traders[$c][1]) = ($player~CORP))
						#ignore
					elseif (((($player~current_sector <= 10) or ($player~current_sector = $map~stardock) or ($player~current_sector = stardock))) AND ($player~traders[$c][2] = TRUE))
						#ignore
					elseif (($PLAYER~targetingShip <> false) and ($player~traders[$c][3] <> true))
						#ignore
					else
						setvar $enemy_fighters $player~traders[$c][4]
						setvar $enemy_name $player~traders[$c]
						if ($safe_attack_only <> true)
							setVar $player~isFound TRUE
						else
							# calculate odds of ships - only attack if you can win #
							setvar $too_many_fighters (($ship~SHIP_OFFENSIVE_ODDS * $player~fighters) < (($enemy_fighters + $target_shields) * $target_defense_odds))
							if (($safe_attack_only = true) and ($too_many_fighters <> true))
								setVar $player~isFound TRUE
							else
								echo "*Safe mode active - Too many fighters on " $enemy_name ".  Can't attack them and survive.*"
							end
						end
						setvar $target_in_defender_ship false
						if ($player~traders[$c][1] = 100000)
							setvar $target_in_defender_ship true
						end
					end
					add $c 1
				end
				if ($player~isFound)
					if (($adjcount = 1) or ($sindex = $adjcount))
						setvar $sectortargetfound true
					else
						setvar $holotargetfound true
					end
					goto :done_scanning
				end
			end
			subtract $sindex 1

		end
		:done_scanning
return


include "source\bot_includes\sector\getemptyships\sector"
include "source\bot_includes\sector\getfaketraders\sector"
include "source\bot_includes\sector\gettraders\sector"
