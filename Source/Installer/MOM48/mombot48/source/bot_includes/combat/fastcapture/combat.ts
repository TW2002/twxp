# [Attack Captain Wilson (60,000-45,000) (Y/N) [N]? Yes] #
:fastCapture
	setVar $player~isFound FALSE
	setVar $targetIsAlien FALSE
	setVar $stillShields FALSE
	setVar $ship_fighters 0
	
	loadvar $ship~SHIP_MAX_ATTACK
	loadvar $SHIP~SHIP_OFFENSIVE_ODDS

	if ($SHIP~SHIP_MAX_ATTACK <= 0)
		gosub :ship~getshipstats
	end

	if ((currentsector = stardock) or (currentsector <= 10))
		setvar $player~fedspace true
	end
	if ($player~onetap = TRUE) or ($player~slowmo = TRUE)
		setVar $refurbString " l "&$PLANET~PLANET&" * n n * j m * * * j * c " 
	else
		setVar $refurbString " l "&$PLANET~PLANET&" * n n * j m * * * j q * " 
	end
	:checkingFigs
		if ($player~fighters <= 0)
			gosub :player~quikstats
			if ($player~fighters <= 0)
				setVar $SWITCHBOARD~message "No fighters on ship.*" 
				gosub :SWITCHBOARD~switchboard
				goto :capstoppingPoint
			else
				goto :checkingFigs
			end
		end
		setVar $targetString "a "

	if (($SECTOR~realTraderCount > $SECTOR~corpieCount) AND ($player~onlyAliens <> TRUE) and ($player~empty_ships_only <> true))
		if ($player~fedspace <> true)
			getWordPos $SECTOR~sectorData $beaconPos "[0m[35mBeacon  [1;33m:"
			if ($beaconPos > 0)
				setVar $targetString $targetString&"*"
			end
		end
		setVar $i 0
		while ($i < ($SECTOR~emptyShipCount + $SECTOR~fakeTraderCount))
			setVar $targetString $targetString&"* "
			add $i 1
		end
		setVar $c 1
		while (($c <= $SECTOR~realTraderCount) AND ($player~isFound = FALSE))
			#echo "*"&$player~traders[$c]&"[]"&$player~traders[$c][1]&"[]"&$player~traders[$c][2]&"*"
			if (($player~fedspace = true) AND ($player~traders[$c][2] = TRUE))
				setVar $targetString $targetString&"* "
			elseif (($player~traders[$c][1] = $player~CORP) OR ($player~traders[$c][1] = 100000))
				setVar $targetString $targetString&"* "
			elseif (($player~targetingCorp = TRUE) AND ($player~traders[$c][1] <> $target))
				setVar $targetString $targetString&"* "
			elseif (($player~targetingPerson = TRUE) AND ($player~traders[$c] <> $target))
				setVar $targetString $targetString&"* "
			else
				setVar $player~isFound TRUE
				setVar $targetString $targetString&"zy z"
			end
			add $c 1
		end
	end

	if ((($SECTOR~fakeTraderCount > 0) AND ($player~cappingAliens = TRUE)) AND ($player~isFound <> TRUE) and ($player~empty_ships_only <> true))
		setVar $targetString "a "
		if ($player~fedspace <> true)
			getWordPos $SECTOR~sectorData $beaconPos "[0m[35mBeacon  [1;33m:"
			if ($beaconPos > 0)
				setVar $targetString $targetString&"*"
			end
		end
		setVar $a 1
		while (($a <= $SECTOR~fakeTraderCount) AND ($player~isFound = FALSE))
			getWordPos $player~faketraders[$a] $pos "Zyrain"
			getWordPos $player~faketraders[$a] $pos2 "Clausewitz"
			getWordPos $player~faketraders[$a] $pos3 "Nelson"
			getWordPos $player~faketraders[$a] $pos4 "Wilson"
			if (($pos <= 0) AND ($pos2 <= 0) AND ($pos3 <= 0) AND ($pos4 <= 0))
				setVar $i 0
				setVar $player~isFound TRUE
				setVar $targetIsAlien TRUE
				setVar $targetString $targetString&"zy z"
			else
				setVar $targetString $targetString&"* "
			end
			add $a 1
			
		end
	end
	
	if (($player~isFound = FALSE) AND ($SECTOR~emptyShipCount > 0) and ($player~fedspace <> true))
		# Add this reset to TargetString - When a ship is defender and there are empty ships
		# The block of code above (targetting players), accounts for these ships
		# However, if player~isFound = FALSE, then it isn't ACTUALLY going to attack.
		# It means we have already skipped these ships, before we get to target them.

		setVar $targetString "a "
		if ($player~fedspace <> true)
			getWordPos $SECTOR~sectorData $beaconPos "[0m[35mBeacon  [1;33m:"
			if ($beaconPos > 0)
				setVar $targetString $targetString&"*"
			end
		end
		if ($player~fedspace <> true)
			getWordPos $SECTOR~sectorData $beaconPos "[0m[35mBeacon  [1;33m:"
			if ($beaconPos > 0)
				setVar $targetString $targetString&"*"
			end
		end
		setVar $c 1
		setVar $player~isFound FALSE
		while (($c <= $SECTOR~emptyShipCount) AND ($player~isFound = FALSE) and ($player~fedspace <> true))
			if (($player~emptyships[$c] = $player~CORP) OR ($player~emptyships[$c] = $player~TRADER_NAME))
				setVar $targetString $targetString&"* " 
			else
				setVar $player~isFound TRUE
				setVar $targetString $targetString&"zy z"
			end
			add $c 1
		end
	end
	if ($player~isFound = FALSE)
		if ($player~onetap = TRUE)			
			setvar $switchboard~message "No Targets - One Tap Complete.*"
			gosub :switchboard~switchboard
			halt
		end
		setvar $switchboard~message "*You have no targets.*" 
		gosub :bot~echo
		goto :capstoppingPoint
	else
		if ($player~startingLocation = "Citadel")
			send "q q * "
		end
		setVar $attackString ""
		:cap_ship
			#get own offensive odds
			setVar $unmanned false
			setVar $own_odds $SHIP~SHIP_OFFENSIVE_ODDS
			setVar $cap_points 0
			setVar $max_figs 0
			setVar $cap_shield_points 0
			setVar $ship_fighters 0
			setVar $player~lasttarget ""
			setvar $firstLoop true
		while ($player~fighters > 0)
			killalltriggers
			setVar $stillShields FALSE
			setVar $isSameTarget FALSE
			:cgoahead
				killtrigger checkcaptarget
				setTextTrigger  foundcaptarget  :foundcaptarget  "(Y/N) [N]? Y"
				setTextTrigger checkcaptarget :checkcaptarget "Yes"
				setTextLineTrigger noctarget    :nocappingtargets "Do you want instructions (Y/N) [N]?"
				#echo "*[" $targetString "]*"
				send $targetString
				pause
				pause
			:checkcaptarget
				getwordpos CURRENTANSILINE $pos "36mYes"
				if ($pos > 0)
					goto :foundcaptarget

				else
					setTextTrigger checkcaptarget :checkcaptarget "Yes"
					pause
					pause
				end

			:foundcaptarget
				killtrigger noctarget
				killtrigger foundcaptarget
				killtrigger checkcaptarget
				killtrigger wrongtarget
				setVar $cap_ship_info CURRENTLINE
				getwordpos $cap_ship_info $targetpos " ["&$player~corp&"]'s unmanned "
				if ($targetpos > 0)
					goto :nocappingtargets
				end
				setVar $thisTarget CURRENTANSILINE
				getWord $cap_ship_info $attack_prompt 1
				#Attack Nikpor's *** Vulcan Pod *** (125,000-5,161) (Y/N) [N]? Yes
				if ($attack_prompt <> "Attack")
					killalltriggers
					return
				end
				getWordPos $thisTarget $pos "[0;33m([1;36m"
				cutText $thisTarget $thisTarget 1 $pos
				if ($pos > 0)
					setvar $thistarget $cap_ship_info
					setvar $temp $thistarget
					getwordpos $temp $pos " ("
					# get to the last " (" in the string #
					setvar $end_of_line_pos 0
					while ($pos > 0)
						setvar $targetpos $pos
						cutText $temp $possibletarget 1 $pos
						replacetext $temp $possibletarget ""
						getwordpos $temp $pos " ("
						if ($pos > 0)
							add $end_of_line_pos ($targetpos+1)
						end
					end
					if ($end_of_line_pos <= 0)
						#stupid ansi ship names possibly, just look for (Yes
						getwordpos $thistarget $end_of_line_pos " (Y"
						# get to the last " (Y" in the string #
						#should probably do a while loop here to get to end of string, but not worth it right now
					end                
					cutText $thistarget $thistarget 1 $end_of_line_pos
						
				end
				#echo "*["&$thistarget&"]*"
				#echo "*["&$player~lasttarget&"]*"
				if (($thisTarget = $player~lasttarget) and ($firstLoop <> true))
					setVar $isSameTarget TRUE
					getwordpos $thisTarget $ourshippos " ["&$player~CORP&"]'s unmanned "
					if ($ourshippos > 0)
						# our ship, so stop! #
						setvar $isSameTarget false
					end
				elseif ($player~lasttarget = "")
					setVar $player~lasttarget $thisTarget
					setvar $firstLoop false
				else
					goto :nocappingtargets
				end
				if ($isSameTarget)
					goto :send_attack
				end
			:ship_type
				setVar $type_count 0
				setVar $is_ship 0
				if ($ship~shipcounter <= 0)
					setvar $switchboard~message "ERROR with capture.  No ship data loaded.  Look into loadshipinfo not being called.*"
					gosub :switchboard~switchboard
				end
				while ($type_count < $SHIP~shipcounter)
					add $type_count 1
					#echo "*["&$cap_ship_info&"]*"
					#echo "*["&$SHIP~shipList[$type_count]&"]*"
					getWordPos $cap_ship_info $is_ship $SHIP~shipList[$type_count]
					getWordPos $cap_ship_info $unman "'s unmanned "
					getwordpos $cap_ship_info $unman2 "s' unmanned "
					if (($unman > 0) or ($unman2 > 0))
						setVar $unmanned true
						#echo "*[unmanned]*"
					else
						#echo "*[manned]*"
						setVar $unmanned false
					end
					if (($is_ship > 0) AND ($SHIP~shipList[$type_count] <> "0"))
						getWord $SHIP~ship[$SHIP~shipList[$type_count]] $player~shields 1
						getWord $SHIP~ship[$SHIP~shipList[$type_count]] $defodds 2
						goto :send_attack
					end
				end

				#  if you don't know the ship, just guess weakest with most shield.  Probably blow it up, but better than doing nothing #
				setVar $SWITCHBOARD~message "Unknown ship type, cannot calculate attack.  I'm going to guess. ["&$cap_ship_info&"]*" 
				gosub :SWITCHBOARD~switchboard
				setvar $shieldpoints 16000
				setVar $defodds 5
			:send_attack
				killtrigger foundcaptarget
				killtrigger noctarget
				killtrigger combat
				killtrigger cap_it
				killtrigger notarget
				killtrigger notarget2
				killtrigger nocombat
				killtrigger theyattacked
				killtrigger wrongtarget
				#Attack Hammer's <<**DRAT**>> (3,406-10,000) (Y/N) [N]? Yes
				getText $cap_ship_info $cap_info $SHIP~shipList[$type_count] "(Y/N)"
				#echo "*["&$cap_ship_info&"]**["&$cap_info&"]*"
				if ($cap_info <> "")
					#[ (8,714-9,951) ]
					getText $cap_info $ship_fighters " (" ")"
				else
					getText $cap_ship_info $ship_fighters " (" ") (Y/N)"
				end
				getText $ship_fighters&"ENDOFLINE" $ship_fighters "-" "ENDOFLINE"
				stripText $ship_fighters ","

				#echo "*["&$ship_fighters&"]**["&$SHIP~shipList[$type_count]&"]*"
				

				setVar $ship_shield_percent 0
				setVar $shieldpoints 0
				setTextLineTrigger combat :combat_scan "Combat scanners show enemy shields at"
				setTextTrigger nocombat :cap_it "How many fighters do you wish to use"
				setTextLineTrigger notarget :nocappingtargets "Do you want instructions (Y/N) [N]?"
				setTextLineTrigger notarget2 :nocappingtargets "'s unmanned"
				#setTextLineTrigger theyattacked :theyattacked "Shipboard Computers "
				#Shipboard Computers Vulcan Larlet destroyed 980 shield points and 0 fighters.
				#Shipboard Computers The Interdictor Generator on Platinum Talon prevented Larlet from escaping on 05/17/48 #at 12:11:16 AM
				pause
				pause

			:combat_scan
				getWord CURRENTLINE $shieldperc 7
				stripText $shieldperc "%"
				setVar $shieldPoints (($player~shields * $shieldperc) / 100)
				setVar $stillShields TRUE
				pause
				pause
			:theyattacked
				getwordpos currentline $pos " The Interdictor Generator on "
				if ($pos > 0)
					setTextLineTrigger theyattacked :theyattacked "Shipboard Computers "
					pause
				end
				setvar $switchboard~message "*They attacked me, switching to 1 fighter attacks.*"
				gosub :bot~echo
				setVar $ship_fighters 1
			:cap_it
				killtrigger combat_scan
				killtrigger cap_it
				killtrigger notarget
				killtrigger theyattacked
				getWord CURRENTLINE $max_figs 11 $ship~SHIP_MAX_ATTACK
				stripText $max_figs ","
				stripText $max_figs ")"
				if ($ship_fighters = "")
					setVar $ship_fighters 1
				end
				#echo "*["&$defodds&"]*"
				#echo "*["&$ship_fighters&"]*"
				setVar $cap_points (($shieldPoints + $ship_fighters) * $defodds)
				#echo "*Cap Points: ["&$cap_points&"]*"
				if ((($player~defenderCapping = TRUE) AND ($unmanned <> true)) AND ($targetIsAlien = TRUE))
					if ($stillShields = TRUE)
						if ($ship_fighters > 750)
							 setVar $cap_points (($shieldPoints / $own_odds) + ($cap_points/100))
						else
							setVar $cap_points ($shieldPoints+1)
						end
					else
						if ($ship_fighters > 750)
							 setVar $cap_points (($cap_points / $own_odds) - ($cap_points/70))
						else
							setVar $cap_points 1
						end
					end
				else
					#echo "*["&$own_odds&"]*"
					setVar $cap_points ($cap_points / $own_odds)
				end
				if ($unmanned = true)
					setvar $cap_points ($cap_points/2)
				end
				setVar $cap_points (($cap_points * 70) / 100)
				if ($cap_points <= 0)
					setVar $cap_points 1
				elseif ($cap_points > $max_figs)
					setVar $cap_points $max_figs
				end
				setVar $sendAttack "z"&$cap_points&"*  "
				if ($player~startingLocation = "Citadel")
					setvar $sendAttack $sendAttack&$refurbString
				elseif (($player~refurbString <> "") and ($player~refurbString <> "0"))
					setvar $sendAttack $sendAttack&$player~refurbString
				end
				send $sendAttack
				if ($player~onetap = TRUE)
					
					setvar $switchboard~message "One tap complete.*"
					gosub :switchboard~switchboard
					halt
				end
				if ($player~slowmo = TRUE)
					getRnd $slowRnd 10 25
					setVar $slowBreak (($slowRnd * $GAME~LATENCY) + 1000)
					setDelayTrigger citCapBreak :citCapBreak $slowBreak 
					pause
					:citCapBreak
						killtrigger citCapBreak
						return
				end
				if ($cap_points = 1)
					setvar $i 1
					setvar $burst ""
					while ($i <= 3)
						setvar $burst $burst&" "&$targetString&$sendAttack
						setVar $player~fighters ($player~fighters-$cap_points)
						add $i 1
					end
					send $burst
					setdelaytrigger littleslower :donelittleslower 10
					pause
					:donelittleslower
					gosub :player~quikstats
					
				end
		:keepcapping
		end
	end
	goto :capStoppingPoint
	:nocappingtargets
		killtrigger noctarget
		killtrigger wrongtarget
		killtrigger foundcaptarget
		killtrigger combat_scan
		killtrigger cap_it
		killtrigger notarget
		killtrigger notarget2
		killtrigger theyattacked
		send "* "
	:capStoppingPoint
	killalltriggers
return
