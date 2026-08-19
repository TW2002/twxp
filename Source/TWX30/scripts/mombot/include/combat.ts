# COMBAT.TS -- Combat related functions and subroutines.
#
# Exposed routines:
#
# :combat~fastattack - The routine that will calculate and send an attack string for the current combat situation.
# :combat~fastcapture - The routine that will calculate and send an attack string for the current capture situation.
# :combat~fastcitadelattack - The routine that will calculate and send an attack string for attacking a citadel.
# :combat~holokill - The routine that will calculate and send an attack string for a holocapture kill.
# :combat~holocapture - The routine that will calculate and send an attack string for a holocapture.
# :combat~passiveholocap - The routine that will calculate and send an attack string for a passive holocapture.
# :combat~passiveholokill - The routine that will calculate and send an attack string for a passive holocapture kill.
# :combat~callsaveme - Call saveme to get picked up by a corpie.
#
# Exposed variables:
#
# $combat~attackstring - The string that will be sent to attack.
# $combat~defender - Set to TRUE if the bot is attacking a defender.  Used for capture calculations.

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:combat~fastattack
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $targetstring "a"
setvar $player~isfound false
setvar $targetshotgun "a z z y z"&$ship~ship_max_attack&"* * a z z * y z"&$ship~ship_max_attack&"* * a z z * * y z"&$ship~ship_max_attack&"* * "

if ($ship~ship_max_attack <= 0)
	gosub :ship~getshipstats
end

setvar $fedspace false
if (($player~current_sector = stardock) or ($player~current_sector <= 10))
	setvar $fedspace true
elseif ($player~current_sector = $map~stardock)
	setvar $fedspace true
end
if ($player~fighters <= 0)
	gosub :player~quikstats
	if (($player~current_sector = 1) or (port.class[$player~current_sector] = 0) or ($player~current_sector = $map~stardock))
		if ($player~current_sector = $map~stardock)
			send "P  S G Y G Q s p"
		else
			send "p ty"
		end
		waiton "B  Fighters        :"
		getword currentline $figstobuy 8
		waiton "C  Shield Points   :"
		getword currentline $shieldstobuy 9

		send "b " $figstobuy "* c " $shieldstobuy "* "

		gosub :player~quikstats
		if ($player~fighters <= 0)
			setvar $switchboard~message ansi_12&"*You have no fighters even after refurb.  Hiding out on dock.*"&ansi_7
			gosub :player~echo
		end
		if ($player~current_sector = $map~stardock)
			send " q q q "
		else
			send " q "
		end
		return
	else
		gosub :player~quikstats
		if ($player~fighters <= 0)
			setvar $switchboard~message ansi_12&"*You have no fighters.*"&ansi_7
			gosub :player~echo
			return
		end
	end
end
if ($fedspace <> true)
	getwordpos $sector~sectordata $beaconpos "[0m[35mBeacon  [1;33m:"
	if ($beaconpos > 0)
		setvar $targetstring $targetstring&"*"
	end
end
if (($sector~emptyshipcount + ($sector~faketradercount + $sector~realtradercount)) > 0)
	setvar $i 0
	while ($i < ($sector~emptyshipcount + $sector~faketradercount))
		setvar $targetstring $targetstring&"* "
		add $i 1
	end
	setvar $c 1
	while (($c <= $sector~realtradercount) and ($player~isfound = false))

		if ($player~traders[$c][1] = $player~corp)
			setvar $targetstring $targetstring&"* "
		elseif (($fedspace = true) and ($player~traders[$c][2] = true))
			setvar $targetstring $targetstring&"* "
		elseif (($player~targetingship <> false) and ($player~traders[$c][3] <> true))
			setvar $targetstring $targetstring&"* "
		else
			setvar $enemy_fighters $player~traders[$c][4]
			setvar $enemy_name $player~traders[$c]
			if ($sector~safe_attack_only <> true)
				setvar $player~isfound true
			else

				setvar $too_many_fighters (($ship~ship_offensive_odds * $player~fighters) < (($enemy_fighters + $target_shields) * $target_defense_odds))
				if (($sector~safe_attack_only = true) and ($too_many_fighters <> true))
					setvar $player~isfound true
				else
					echo "*Safe mode active - Too many fighters on " $enemy_name ".  Can't attack them and survive.*"
				end
			end
			if ($player~isfound = true)
				setvar $targetstring $targetstring&"zy z"
			end
		end
		add $c 1
	end
else

	setvar $switchboard~message "*You have no targets.*"
	gosub :player~echo

	goto :stoppingpoint
end
if ($player~isfound = true)
	setvar $combat~attackstring ""
	if (($player~genesis > 0) and ($combat~defender = true))
		setvar $combat~attackstring "u y n.* c "
		setvar $player~genesis ($player~genesis - 1)
	end

	setvar $starting_fighters $player~fighters
	while ($player~fighters > 0)
		if ($player~fighters < $ship~ship_max_attack)
			if ($player~shotgun)
				setvar $combat~attackstring $combat~attackstring&$targetshotgun&$player~refurbstring
			else
				if ($player~doubletap)
					setvar $combat~attackstring $combat~attackstring&$targetstring&$player~fighters&"* * "&$targetstring&$player~fighters&"* * "&$player~refurbstring
				else
					setvar $combat~attackstring $combat~attackstring&$targetstring&$player~fighters&"* * "&$player~refurbstring
				end
			end
			setvar $player~fighters 0
		else
			if ($player~shotgun)
				setvar $combat~attackstring $combat~attackstring&$targetshotgun&$player~refurbstring
			else
				if ($player~doubletap)
					setvar $combat~attackstring $combat~attackstring&$targetstring&$ship~ship_max_attack&"* * "&$targetstring&$ship~ship_max_attack&"* * "&$player~refurbstring
					setvar $player~fighters ($player~fighters - $ship~ship_max_attack)
				else
					setvar $combat~attackstring $combat~attackstring&$targetstring&$ship~ship_max_attack&"* * "&$player~refurbstring
				end
			end
			setvar $player~fighters ($player~fighters - $ship~ship_max_attack)
		end
	end
else

	setvar $switchboard~message "*You have no valid targets.*"
	gosub :player~echo

	goto :stoppingpoint
end
if (($sector~passive = true) and ($starting_fighters < $enemy_fighters))
	setvar $player~fighters $starting_fighters
	setvar $switchboard~message "*Enemy has too many fighters to attack auto ("&$enemy_fighters&").*"
	gosub :player~echo
else
	send $combat~attackstring&"* "
end

:stoppingpoint
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:combat~fastcapture
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $player~isfound false
setvar $targetisalien false
setvar $stillshields false
setvar $ship_fighters 0

loadvar $ship~ship_max_attack
loadvar $ship~ship_offensive_odds

if ($ship~ship_max_attack <= 0)
	gosub :ship~getshipstats
end

setvar $fedspace false
if ((currentsector = stardock) or (currentsector <= 10))
	setvar $fedspace true
elseif (currentsector = $map~stardock)
	setvar $fedspace true
end
if (($player~onetap = true) or ($player~slowmo = true))
	setvar $refurbstring " l "&$planet~planet&" * n n * j m * * * j * c "
else
	setvar $refurbstring " l "&$planet~planet&" * n n * j m * * * j q * "
end

:checkingfigs
if ($player~fighters <= 0)
	gosub :player~quikstats
	if ($player~fighters <= 0)
		setvar $switchboard~message "No fighters on ship.*"
		gosub :switchboard~switchboard
		goto :capstoppingpoint
	else
		goto :checkingfigs
	end
end
setvar $targetstring "a "

if (($sector~realtradercount > $sector~corpiecount) and (($player~onlyaliens <> true) and ($player~empty_ships_only <> true)))
	if ($fedspace <> true)
		getwordpos $sector~sectordata $beaconpos "[0m[35mBeacon  [1;33m:"
		if ($beaconpos > 0)
			setvar $targetstring $targetstring&"*"
		end
	end
	setvar $i 0
	while ($i < ($sector~emptyshipcount + $sector~faketradercount))
		setvar $targetstring $targetstring&"* "
		add $i 1
	end
	setvar $c 1
	while (($c <= $sector~realtradercount) and ($player~isfound = false))

		if (($fedspace = true) and ($player~traders[$c][2] = true))
			setvar $targetstring $targetstring&"* "
		elseif (($player~traders[$c][1] = $player~corp) or ($player~traders[$c][1] = 100000))
			setvar $targetstring $targetstring&"* "
		elseif (($player~targetingcorp = true) and ($player~traders[$c][1] <> $target))
			setvar $targetstring $targetstring&"* "
		elseif (($player~targetingperson = true) and ($player~traders[$c] <> $target))
			setvar $targetstring $targetstring&"* "
		else
			setvar $player~isfound true
			setvar $targetstring $targetstring&"zy z"
		end
		add $c 1

	end
end
if ((($sector~faketradercount > 0) and ($player~cappingaliens = true)) and (($player~isfound <> true) and ($player~empty_ships_only <> true)))
	setvar $targetstring "a "
	if ($fedspace <> true)
		getwordpos $sector~sectordata $beaconpos "[0m[35mBeacon  [1;33m:"
		if ($beaconpos > 0)
			setvar $targetstring $targetstring&"*"
		end
	end
	setvar $a 1
	while (($a <= $sector~faketradercount) and ($player~isfound = false))
		getwordpos $player~faketraders[$a] $pos "Zyrain"
		getwordpos $player~faketraders[$a] $pos2 "Clausewitz"
		getwordpos $player~faketraders[$a] $pos3 "Nelson"
		getwordpos $player~faketraders[$a] $pos4 "Wilson"
		if (($pos <= 0) and (($pos2 <= 0) and (($pos3 <= 0) and ($pos4 <= 0))))
			setvar $i 0
			setvar $player~isfound true
			setvar $targetisalien true
			setvar $targetstring $targetstring&"zy z"
		else
			setvar $targetstring $targetstring&"* "
		end
		add $a 1
	end
end

if (($player~isfound = false) and (($sector~emptyshipcount > 0) and ($fedspace <> true)))

	setvar $targetstring "a "
	if ($fedspace <> true)
		getwordpos $sector~sectordata $beaconpos "[0m[35mBeacon  [1;33m:"
		if ($beaconpos > 0)
			setvar $targetstring $targetstring&"*"
		end
	end
	if ($fedspace <> true)
		getwordpos $sector~sectordata $beaconpos "[0m[35mBeacon  [1;33m:"
		if ($beaconpos > 0)
			setvar $targetstring $targetstring&"*"
		end
	end
	setvar $c 1
	setvar $player~isfound false
	while (($c <= $sector~emptyshipcount) and (($player~isfound = false) and ($fedspace <> true)))
		if (($player~emptyships[$c] = $player~corp) or ($player~emptyships[$c] = $player~trader_name))
			setvar $targetstring $targetstring&"* "
		else
			setvar $player~isfound true
			setvar $targetstring $targetstring&"zy z"
		end
		add $c 1
	end
end
if ($player~isfound = false)
	if ($player~onetap = true)
		setvar $switchboard~message "No Targets - One Tap Complete.*"
		gosub :switchboard~switchboard
		halt
	end
	setvar $switchboard~message "*You have no targets.*"
	gosub :player~echo
	goto :capstoppingpoint
else
	if ($player~startinglocation = "Citadel")
		send "q q * "
	end
	setvar $combat~attackstring ""

	:combat~cap_ship
	setvar $unmanned false
	setvar $own_odds $ship~ship_offensive_odds
	setvar $cap_points 0
	setvar $max_figs 0
	setvar $cap_shield_points 0
	setvar $ship_fighters 0
	setvar $player~lasttarget ""
	setvar $firstloop true
	while ($player~fighters > 0)
		killalltriggers
		setvar $stillshields false
		setvar $issametarget false

		:cgoahead
		killtrigger checkcaptarget
		settexttrigger foundcaptarget :foundcaptarget "(Y/N) [N]? Y"
		settexttrigger checkcaptarget :checkcaptarget "Yes"
		settextlinetrigger noctarget :nocappingtargets "Do you want instructions (Y/N) [N]?"
		send $targetstring
		pause
		pause

		:checkcaptarget
		getwordpos currentansiline $pos "36mYes"
		if ($pos > 0)
			goto :foundcaptarget

		else
			settexttrigger checkcaptarget :checkcaptarget "Yes"
			pause
			pause
		end

		:foundcaptarget
		killtrigger noctarget
		killtrigger foundcaptarget
		killtrigger checkcaptarget
		killtrigger wrongtarget
		setvar $cap_ship_info currentline
		getwordpos $cap_ship_info $targetpos " ["&$player~corp&"]'s unmanned "
		if ($targetpos > 0)
			goto :nocappingtargets
		end
		setvar $thistarget currentansiline
		getword $cap_ship_info $attack_prompt 1

		if ($attack_prompt <> "Attack")
			killalltriggers
			return
		end
		getwordpos $thistarget $pos "[0;33m([1;36m"
		cuttext $thistarget $thistarget 1 $pos
		if ($pos > 0)
			setvar $thistarget $cap_ship_info
			setvar $temp $thistarget
			getwordpos $temp $pos " ("

			setvar $end_of_line_pos 0
			while ($pos > 0)
				setvar $targetpos $pos
				cuttext $temp $possibletarget 1 $pos
				replacetext $temp $possibletarget ""
				getwordpos $temp $pos " ("
				if ($pos > 0)
					add $end_of_line_pos ($targetpos + 1)
				end
			end
			if ($end_of_line_pos <= 0)

				getwordpos $thistarget $end_of_line_pos " (Y"
			end

			cuttext $thistarget $thistarget 1 $end_of_line_pos
		end

		if (($thistarget = $player~lasttarget) and ($firstloop <> true))
			setvar $issametarget true
			getwordpos $thistarget $ourshippos " ["&$player~corp&"]'s unmanned "
			if ($ourshippos > 0)

				setvar $issametarget false
			end
		elseif ($player~lasttarget = "")
			setvar $player~lasttarget $thistarget
			setvar $firstloop false
		else
			goto :nocappingtargets
		end
		if ($issametarget)
			goto :send_attack
		end

		:ship_type
		setvar $type_count 0
		setvar $is_ship 0
		if ($ship~shipcounter <= 0)
			setvar $switchboard~message "ERROR with capture.  No ship data loaded.  Look into loadshipinfo not being called.*"
			gosub :switchboard~switchboard
		end
		while ($type_count < $ship~shipcounter)
			add $type_count 1
			getwordpos $cap_ship_info $is_ship $ship~shiplist[$type_count]
			getwordpos $cap_ship_info $unman "'s unmanned "
			getwordpos $cap_ship_info $unman2 "s' unmanned "
			if (($unman > 0) or ($unman2 > 0))
				setvar $unmanned true

			else

				setvar $unmanned false
			end
			if (($is_ship > 0) and ($ship~shiplist[$type_count] <> 0))
				getword $ship~ship[$ship~shiplist[$type_count]] $player~shields 1
				getword $ship~ship[$ship~shiplist[$type_count]] $defodds 2
				goto :send_attack
			end
		end

		echo "*Unknown ship type, cannot calculate attack.  I'm going to guess. ["&$cap_ship_info&"]"
		setvar $shieldpoints 16000
		setvar $defodds 5

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
		gettext $cap_ship_info $cap_info $ship~shiplist[$type_count] "(Y/N)"

		if ($cap_info <> "")

			gettext $cap_info $ship_fighters " (" ")"
		else
			gettext $cap_ship_info $ship_fighters " (" ") (Y/N)"
		end
		gettext $ship_fighters&"ENDOFLINE" $ship_fighters "-" "ENDOFLINE"
		striptext $ship_fighters ","
		setvar $stillshields false
		setvar $ship_shield_percent 0
		setvar $shieldpoints 0
		setvar $shieldperc 0
		settextlinetrigger combat :combat_scan "Combat scanners show enemy shields at"
		settexttrigger nocombat :cap_it "How many fighters do you wish to use"
		settextlinetrigger notarget :nocappingtargets "Do you want instructions (Y/N) [N]?"
		settextlinetrigger notarget2 :nocappingtargets "'s unmanned"
		pause
		pause

		:combat_scan
		getword currentline $shieldperc 7
		striptext $shieldperc "%"
		setvar $shieldpoints (($player~shields * $shieldperc) / 100)
		setvar $stillshields true
		pause
		pause

		:theyattacked
		getwordpos currentline $pos " The Interdictor Generator on "
		if ($pos > 0)
			settextlinetrigger theyattacked :theyattacked "Shipboard Computers "
			pause
		end
		setvar $switchboard~message "*They attacked me, switching to 1 fighter attacks.*"
		gosub :player~echo
		setvar $ship_fighters 1

		:combat~cap_it
		killtrigger combat_scan
		killtrigger cap_it
		killtrigger notarget
		killtrigger theyattacked
		getword currentline $max_figs 11 $ship~ship_max_attack
		striptext $max_figs ","
		striptext $max_figs ")"
		if ($ship_fighters = "")
			setvar $ship_fighters 1
		end

		setvar $cap_points (($shieldpoints + $ship_fighters) * $defodds)

		if ((($player~defendercapping = true) and ($unmanned <> true)) and ($targetisalien = true))
			if ($stillshields = true)
				if ($ship_fighters > 3500)
					setvar $cap_points (($shieldpoints / $own_odds) + ($cap_points / 100))
				else
					setvar $cap_points (($shieldpoints / $own_odds) + 1)
				end
			else
				# Changes imported from TBH version
				#if ($SHIP_FIGHTERS > 750)
				#  setvar $CAP_POINTS (($CAP_POINTS / $OWN_ODDS) - ($CAP_POINTS / 70))
				#else
				setvar $cap_points 1
				#end
			end
		else
			setvar $cap_points ($cap_points / $own_odds)
		end
		if ($unmanned = true)
			setvar $cap_points ($cap_points / 2)
		end
		setvar $cap_points (($cap_points * 70) / 100)
		if ($cap_points <= 0)
			setvar $cap_points 1
		elseif ($cap_points > $max_figs)
			setvar $cap_points $max_figs
		end
		#echo ANSI_15&"sendattack: z"&$cap_points&"*  "
		#echo "shieldperc:["&$shieldperc&"]*"
		# added from TBH version
		if ((($last_shield_percentage = $shieldperc) and ($shieldperc > 0)))
			setvar $cap_points $cap_points+$added_attack
			setvar $added_attack $added_attack+2
			setvar $cummulative_added_attack $cummulative_added_attack+$cap_points
		else
			if (($last_shield_percentage > 0) and ($shieldperc > 0))
				setvar $shield_difference ($last_shield_percentage - $shieldperc)
				if ($shieldperc > 1)
					setvar $a_little_extra (($cummulative_added_attack/$shield_difference)/2)
					setvar $cap_points ((($cummulative_added_attack/$shield_difference) * $shieldperc)-$a_little_extra)
					setvar $cummulative_added_attack 0
				end
			else
				setvar $added_attack 2
			end
		end
		setvar $last_shield_percentage $shieldperc
		setvar $sendattack "z"&$cap_points&"*  "
		if ($player~startinglocation = "Citadel")
			setvar $sendattack $sendattack&$refurbstring
		elseif (($player~refurbstring <> "") and ($player~refurbstring <> 0))
			setvar $sendattack $sendattack&$player~refurbstring
		end
		#echo ANSI_15&"sendattack: "&$sendAttack&"*"
		send $sendattack
		if ($player~onetap = true)
			setvar $switchboard~message "One tap complete.*"
			gosub :switchboard~switchboard
			halt
		end
		if ($player~slowmo = true)
			getrnd $slowrnd 10 25
			setvar $slowbreak (($slowrnd * $game~latency) + 1000)
			setdelaytrigger citcapbreak :citcapbreak $slowbreak
			pause

			:citcapbreak
			killtrigger citcapbreak
			return
		end
		#echo ANSI_15&"sendattack: z"&$cap_points&"*  "
		#echo "shieldperc:["&$shieldperc&"]*"
		if ($cap_points = 1)
			setvar $i 1
			setvar $burst ""
			while ($i <= 3)
				setvar $burst $burst&" "&$targetstring&$sendattack
				setvar $player~fighters ($player~fighters - $cap_points)
				add $i 1
			end
			#echo ANSI_15&"burst: " & $COMBAT_BURST
			send $burst
			setdelaytrigger littleslower :donelittleslower 10
			pause

			:donelittleslower
			gosub :player~quikstats
		end

		:keepcapping
	end

end
goto :capstoppingpoint

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

:capstoppingpoint
killalltriggers
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:combat~fastcitadelattack
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if ($ship~ship_max_attack <= 0)
	gosub :ship~getshipstats
end
setvar $refurbstring " l "&$planet~planet&" * n n * j m * * * "
setvar $combat~attackstring ""
setvar $targetstring "a z "
setvar $targetshotgun "a z z y z"&$ship~ship_max_attack&"* * a z z * y z"&$ship~ship_max_attack&"* * a z z * * y z"&$ship_max_attack&"* * "
setvar $player~isfound false
if ($player~fighters > 0)
	if ($player~fedspace <> true)
		getwordpos $sector~sectordata $beaconpos "[0m[35mBeacon  [1;33m:"
		if ($beaconpos > 0)
			setvar $targetstring $targetstring&"*"
		end
	end
else
	send "q m***c "
	gosub :player~quikstats
	if ($player~fighters <= 0)
		setvar $switchboard~message "Out of fighters, shutting down "&$command&".*"
		gosub :switchboard~switchboard
		setvar $error true
		return
	end
end

if (($sector~emptyshipcount + ($sector~faketradercount + $sector~realtradercount)) > 0)
	setvar $i 0
	while ($i < ($sector~emptyshipcount + $sector~faketradercount))
		setvar $targetstring $targetstring&"* "
		add $i 1
	end
	setvar $c 1
	while (($c <= $sector~realtradercount) and ($player~isfound = false))
		if (($player~fedspace = true) and ($player~traders[$c][2] = true))
			setvar $targetstring $targetstring&"* "
		elseif (($player~traders[$c][1] = $player~corp) or ($player~traders[$c][1] = 100000))
			setvar $targetstring $targetstring&"* "
		elseif (($player~targetingcorp = true) and ($player~traders[$c][1] <> $target))
			setvar $targetstring $targetstring&"* "
		elseif (($player~targetingperson = true) and ($player~traders[$c] <> $target))
			setvar $targetstring $targetstring&"* "
		else
			setvar $player~isfound true
			setvar $targetstring $targetstring&"z y z"

		end
		add $c 1

	end
else
	if ($player~onetap = true)
		setvar $switchboard~message "No Targets - One Tap Complete.*"
		gosub :switchboard~switchboard
		halt
	end
	setvar $switchboard~message ansi_12&"*You have no targets.*"&ansi_7
	gosub :player~echo
	return
end
if ($player~isfound = true)
	setvar $player~thiskilltarget ""
	setvar $player~lastkilltarget ""
	if ($player~smart)
		setvar $combat~attackstring ""
		send "q "
		setvar $count 8
		while ($count > 0)
			if ($player~shotgun)
				send $combat~attackstring $combat~attackstring&"q "&$targetshotgun&$refurbstring
			else
				if ($player~doubletap)
					send $combat~attackstring $combat~attackstring&"q "&$targetstring&$ship~ship_max_attack&"* * "&$targetstring&$ship~ship_max_attack&"* * "&$refurbstring
				else
					send $combat~attackstring $combat~attackstring&"q "&$targetstring&$ship~ship_max_attack&"* * "&$refurbstring
				end
			end
			settexttrigger foundkilltarget :foundkilltarget "(Y/N) [N]? Y"
			settextlinetrigger noktarget :nokilltargets "Do you want instructions (Y/N) [N]?"
			pause

			:foundkilltarget
			killalltriggers
			setvar $kill_ship_info currentline
			setvar $player~thiskilltarget currentansiline
			getwordpos $player~thiskilltarget $pos "[0;33m([1;36m"
			cuttext $player~thiskilltarget $player~thiskilltarget 1 $pos
			getwordpos $player~thiskilltarget $pos "'s "
			while ($pos > 0)
				cuttext $player~thiskilltarget $player~thiskilltarget ($pos + 3) 9999
				getwordpos $player~thiskilltarget $pos "'s "
			end
			gettext $player~thiskilltarget $player~thiskilltarget #27&"[0m"&#27 #27&"["
			gettext $player~thiskilltarget&"/\ENDOFSHIPTAG/\" $player~thiskilltarget "m" "/\ENDOFSHIPTAG/\"
			getwordpos $player~traders[($c - 1)][1] $pos $player~thiskilltarget
			if (($player~lastkilltarget <> "") and ($player~thiskilltarget <> $player~lastkilltarget))
				setvar $switchboard~message "*Target has changed, time to rescan..*"
				gosub :player~echo
				send " c "
				goto :donekill
			end
			setvar $player~lastkilltarget $player~thiskilltarget

			:nokilltargets
			killalltriggers
			subtract $count 1
		end
		send " c "
	else
		setvar $combat~attackstring ""
		if ($player~onetap = true)
			setvar $count 1
		elseif ($player~slowmo = true)
			setvar $count 2
		else
			setvar $count 8
		end
		while ($count > 0)
			if ($player~shotgun)
				setvar $combat~attackstring $combat~attackstring&"q "&$targetshotgun&$refurbstring
			else
				if ($player~doubletap)
					setvar $combat~attackstring $combat~attackstring&"q "&$targetstring&$ship~ship_max_attack&"* * "&$targetstring&$ship~ship_max_attack&"* * "&$refurbstring
				else
					setvar $combat~attackstring $combat~attackstring&"q "&$targetstring&$ship~ship_max_attack&"* * "&$refurbstring
				end
			end
			subtract $count 1
		end
		send " q "&$combat~attackstring&" c "
		if ($player~onetap = true)
			setvar $switchboard~message "One Tap Complete.*"
			gosub :switchboard~switchboard
			halt
		end
		if ($player~slowmo = true)
			getrnd $slowrnd 10 25
			setvar $slowbreak (($slowrnd * $game~latency) + 1000)
			setdelaytrigger citkillbreak :citkillbreak $slowbreak
			pause

			:citkillbreak
			killtrigger citkillbreak
			return
		end
		if ($player~unloader = true)
			settextlinetrigger unloaderwait :unloaderwait "@unloaddone"
			pause

			:unloaderwait
			killtrigger unloaderwait

			setvar $slowbreak 400
			setdelaytrigger unloaderbreak :unloaderbreak $slowbreak
			pause

			:unloaderbreak
			killtrigger unloaderbreak
			return
		end
	end
else
	if ($player~onetap = true)
		setvar $switchboard~message "No Targets - One Tap Complete.*"
		gosub :switchboard~switchboard
		halt
	end
	setvar $switchboard~message ansi_12&"*You have no valid targets.*"&ansi_7
	gosub :player~echo
	return
end

:donekill
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:combat~holocap
setvar $holocapture true

:combat~holokill
:combat~holo_kill
:combat~holo_kill_kill_check
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $error false
if ($ship~ship_max_attack <= 0)
	gosub :ship~getshipstats
end

setvar $too_many_fighters ($ship~ship_offensive_odds * $ship~ship_max_attack)
divide $too_many_fighters 12
settexttrigger noscan1 :holo_kill_noscanner "Handle which mine type, 1 Armid or 2 Limpet"
settextlinetrigger noscan2 :holo_kill_noscanner "You don't have a long range scanner."
if ($player~current_prompt = "Citadel")
	send " q q * sh"
	setvar $player~cit true
else
	send " sh"
end
waiton "Select (H)olo Scan or (D)ensity Scan or (Q)uit? [D] H"
gosub :sector~getautosectordata
goto :holo_kill_scandone

:holo_kill_noscanner
killalltriggers
setvar $switchboard~message "You don't have a HoloScanner!*"
if ($player~cit)
	send "*  l "&$planet~planet&"* j c * "
else
	send "* "
end
setvar $error true
return

:holo_kill_scandone
getword currentline $check 1
if ($player~cit)
	send "*  l "&$planet~planet&"* j c * "
else
	send "* "
end

:holo_kill_get_prompt
:holo_kill_get_current_sector
setvar $hkill_start_sector $sector~starting_sector
setvar $player~current_sector $starting_sector
setvar $killsector 0
setvar $test_sector $sector~targetsector
setvar $safeplanets true
setvar $containsshieldedplanet false
setvar $containsenemytrader false
if ($sector~holotargetfound)
	gosub :player~quikstats
	if (($player~photons > 0) and (($photon_only = true) or ($photon_and_kill = true)))
		send "c  p  y  " $test_sector "* * q "
		if ($photon_only = true)
			setvar $switchboard~message "Photoned "&$sector~enemy_name&" in sector "&$test_sector&"!  In photon only mode right now.*"
			return
		end
	end
	if (sector.planetcount[$test_sector] > 0)
		setvar $p 1
		while ($p <= sector.planetcount[$test_sector])
			getword sector.planets[$test_sector][$p] $test 1
			if ($test = "<<<<")
				setvar $containsshieldedplanet true
			end
			add $p 1
		end
		if ($sector~target_in_defender_ship = true)

			setvar $safeplanets false
		end
		if ($player~surroundavoidallplanets)
			setvar $safeplanets false
		elseif ($containsshieldedplanet and $player~surroundavoidshieldedonly)
			setvar $safeplanets false
		end
	end
	setvar $figowner sector.figs.owner[$test_sector]
	if (($test_sector <> $map~stardock) and ((($test_sector > 10) and ((($safeplanets = true) and ((sector.figs.quantity[$test_sector] < ($too_many_fighters * 2)) or ($figowner = "belong to your Corp") or ($figowner = "yours")))))))
		setvar $killsector $test_sector
	else
		if ($sector~target_in_defender_ship = true)
			setvar $switchboard~message "Cannot holokill - "&$sector~enemy_name&" is in a defender ship with planets under them.*"
			return
		else
			setvar $switchboard~message "Cannot holokill - check for planets or too many figs?*"
			return
		end
	end
else
	if ($sector~sectortargetfound = true)
		if ($player~cit = true)
			gosub :fastcitadelattack
		else
			gosub :fastattack
		end
		setvar $switchboard~message "Found "&$sector~enemy_name&" in MY sector!  Attacked them.*"
	else
		setvar $switchboard~message "No targets found adjacent.*"
	end
	return
end

:holo_kill_killem
add $holokill_count 1
if ($slingshot)
	setvar $title "Slingshot Holokill"
else
	setvar $title "Holokill"
end
if ($noavoid <> true)
	send "c v 0 * y n " $test_sector " *  q  "
end
if ($slingshot)
	if ($player~cit = true)
		if ($switch)
			send " e y q m * * * q  m z " $test_sector "*     *   *  *  z  a  " $ship~ship_max_attack "*  z  a  " $ship~ship_max_attack "*  j R  *  '" $test_sector "=saveme* f  z  1  *  z  c  d  *   "
		else
			send " q m * * * q  m z " $test_sector "*     *   *  *  z  a  " $ship~ship_max_attack "*  z  a  " $ship~ship_max_attack "*  j R  *  '" $test_sector "=saveme* f  z  1  *  z  c  d  *   "
		end
	else
		send " m z " $test_sector "*     *   *  *  z  a  " $ship~ship_max_attack "*  z  a  " $ship~ship_max_attack "*  j R  *  '" $test_sector "=saveme* f  z  1  *  z  c  d  *   "
	end
	setvar $i 0
	while ($i < 15)
		add $i 1
		send "l j" #8 #8 $planet~planet "* "
	end

	gosub :player~quikstats
	if ($player~current_sector <> $test_sector)
		setvar $switchboard~message "Possible splatter on a planet, check for pod.*"
		gosub :switchboard~switchboard
		return
	end
	if ($player~current_prompt = "Planet")
		send "m * * * c "
		setvar $player~startinglocation "Citadel"
		setvar $player~current_prompt "Citadel"
		if ($holocapture)
			gosub :fastcapture
			send "l j" #8 #8 $planet~planet "* j m * * * j c  *  "

			gosub :player~quikstats
		else
			gosub :fastcitadelattack
		end
		send "p " $hkill_start_sector "* y "
		gosub :player~quikstats
	end
	if ($player~current_sector <> $hkill_start_sector)
		gosub :callsaveme
		setvar $switchboard~message "After save me, resetting.*"
	else
		setvar $switchboard~message $title&" - Attacking sector "&$test_sector&".*"
		setvar $switchboard~message $switchboard~message&"Attack made and back in original sector!*"
	end
else
	if ($player~cit = true)
		if ($switch)
			send " e y q m * * * q  m z " $test_sector "*     *     *  z  a  " $ship~ship_max_attack "*  z  a  " $ship~ship_max_attack "*  R  *  "
		else
			send " q m * * * q  m z " $test_sector "*     *     *  z  a  " $ship~ship_max_attack "*  z  a  " $ship~ship_max_attack "*  R  *   "
		end
	else
		send " m z " $test_sector " *      *     *  z  a  " $ship~ship_max_attack "*  z  a  " $ship~ship_max_attack "*  R  *   "
	end
	if (($player~genesis > 0) and ($combat~defender = true))
		send "u y n.* c "
	end
	if ($player~surround_before_hkill = true)
		gosub :player~quikstats
		gosub :grid~surround
		setvar $insurround_before_hkill false
		gosub :player~quikstats
	end

	setvar $player~startinglocation "Command"
	setvar $player~current_prompt "Command"
	if ($holocapture)
		gosub :fastcapture
	else
		gosub :fastattack
	end
	if ($player~cit = true)
		if ($switch)
			send "  f  z  1  *  z  c  d  *   m " $hkill_start_sector " *  *  z  a  99999  *  z  a  99999  *  R  *    l " $planet~planet " * n n * j m * * * j c  *   e y "
		else
			send "  f  z  1  *  z  c  d  *   m " $hkill_start_sector " *  *  z  a  99999  *  z  a  99999  *  R  *    l " $planet~planet " * n n * j m * * * j c  *  "
		end
	else
		send "  f  z  1  *  z  c  d  *   m " $hkill_start_sector " *  *  z  a  99999  *  z  a  99999  *  R  *   "
	end
	gosub :player~quikstats
	if ($player~current_sector <> $hkill_start_sector)
		gosub :callsaveme
		gosub :player~quikstats
		setvar $switchboard~message "After save me, resetting.*"
	else
		setvar $switchboard~message "Holokill attacked "&$sector~enemy_name&" in sector "&$test_sector&".*"
		setvar $switchboard~message $switchboard~message&"Attack made and back in original sector!*"
	end
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:combat~callsaveme
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:callsaveme
killalltriggers
send "q q q * * * * "
gosub :player~quikstats
setvar $figstodeploy 1

gosub :deployfigs
send "'" & $player~current_sector & "=saveme*"
send "'pickup " & $player~current_sector  & " ::*"

:waitforhelp
settextlinetrigger friendlytwarp :friendlytwarp "appears in a brilliant flash of warp energies!"
settextlinetrigger friendlyplanet :friendlyplanet "Saveme script activated - Planet "
settextlinetrigger towlocked :towlocked "locks a tractor beam on your ship."
setdelaytrigger timeout :timeout 30000
pause

:timeout
killalltriggers
send "'30 seconds after save call, script halted.*"
halt

:friendlytwarp
killalltriggers
setvar $figstodeploy "ALL"
gosub :deployfigs
goto :waitforhelp

:friendlyplanet
killalltriggers
gettext currentline $planet~planet "Saveme script activated - Planet " " to "
send "L " & $planet~planet & "* m* * * C 'I landed on planet " & $planet~planet & "*"

gosub :player~quikstats
if ($player~fighters > 100)
	if ($combat~kill = true)
		send "'" & $switchboard~bot_name " citkill on*"
	elseif ($combat~cap = true)
		send "'" & $switchboard~bot_name " citcap on*"
	end
end
return

:towlocked
killalltriggers
send "'Tow locked, get us out of here!*"
return

:deployfigs
if ($figstodeploy = 0)
	setvar $figstodeploy 1
end
if (($player~current_sector  < 11) or ($player~current_sector  = stardock))
	send "'Can't deploy figs in fed*"
	return
end
send "a y y 9999* F"
settextlinetrigger nocontrol :nocontrol "These fighters are not under your control."
settextlinetrigger abletodeploy :abletodeploy "fighters available."
pause

:nocontrol
killalltriggers
send "'We don't control the figs in this sector!*"
gosub :xenter~run
return

:abletodeploy
killalltriggers
getword currentline $figsavailable 3
striptext $figsavailable ","
striptext $figsavailable "."
if ($figstodeploy = "ALL")
	setvar $figstodeploy $figsavailable
end
if ($figsavailable = 0)
	send "0* ZC D* 'I have no figs to deploy!*"
else
	send $figstodeploy & "* ZC D* '" & $figstodeploy & " figs deployed*"
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:combat~holoscan
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $sector~safe_attack_only true
setvar $before_holo_kill_sector $player~current_sector
gosub :holokill
killalltriggers
if (($sector~holotargetfound = true) and ($player~current_sector <> $before_holo_kill_sector))
	setvar $player~warpto $before_holo_kill_sector
	gosub :move~twarp
	if (($player~twarpsuccess = false) and ($player~msg <> "Already in that sector!"))
		setvar $switchboard~message "Could not make it back to starting sector after holokill. - ["&$player~msg&"]*"
	end
end
if ($switchboard~message <> "No targets found adjacent.*")
	gosub :switchboard~switchboard
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:combat~init
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $player~realtradercount 0
setvar $player~faketradercount 0
setvar $player~corpiecount 0
setvar $player~emptyshipcount 0
setvar $player~containsbeacon false
setarray $player~traders 200
setarray $player~faketraders 100
setarray $player~emptyships 100
gosub :player~initranks
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:combat~passiveholocap
setvar $holocapture true

:combat~passiveholokill
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if ($ship~ship_max_attack <= 0)
	gosub :ship~getshipstats
end

setvar $too_many_fighters ($ship~ship_offensive_odds * $ship~ship_max_attack)
divide $too_many_fighters 12

setvar $hkill_start_sector $sector~starting_sector
setvar $killsector 0
setvar $test_sector $sector~targetsector
setvar $safeplanets true
setvar $containsshieldedplanet false
setvar $containsenemytrader false

if (sector.planetcount[$test_sector] > 0)
	setvar $p 1
	while ($p <= sector.planetcount[$test_sector])
		getword sector.planets[$test_sector][$p] $test 1
		if ($test = "<<<<")
			setvar $containsshieldedplanet true
		end
		add $p 1
	end
	if ($player~surroundavoidallplanets)
		setvar $safeplanets false
	elseif ($containsshieldedplanet and $player~surroundavoidshieldedonly)
		setvar $safeplanets false
	end
end
setvar $figowner sector.figs.owner[$test_sector]
if (($test_sector <> $map~stardock) and ((($test_sector > 10) and ((($safeplanets = true) and ((sector.figs.quantity[$test_sector] < ($too_many_fighters * 2)) or ($figowner = "belong to your Corp") or ($figowner = "yours")))))))
	setvar $killsector $test_sector
else
	setvar $switchboard~message "Cannot holokill - check for planets or too many figs?*"
	return
end
send "c v 0 * y n " $test_sector " *  q  m z " $test_sector " *  *  z  a  " $ship~ship_max_attack "*  z  a  " $ship~ship_max_attack "*  R  * "
if ($player~surround_before_hkill = true)
	gosub :player~quikstats
	gosub :grid~surround
	setvar $insurround_before_hkill false
	gosub :player~quikstats
end

setvar $player~startinglocation "Command"
if ($holocapture)
	gosub :fastcapture
else
	gosub :fastattack
end
if (($hkill_start_sector <= 10) or ($hkill_start_sector = $map~stardock) or ($hkill_start_sector = stardock))
	send "  f  z  1  *  z  c  d  *   m " $hkill_start_sector " *   "
else
	send "  f  z  1  *  z  c  d  *   m " $hkill_start_sector " *  *  z  a  99999  *  z  a  99999  *  R  *   "
end
gosub :player~quikstats
if ($player~current_sector <> $hkill_start_sector)
	gosub :callsaveme
	gosub :player~quikstats
	setvar $switchboard~message "After save me, resetting.*"
else
	setvar $switchboard~message "Auto holokill attacked "&$sector~enemy_name&" in sector "&$test_sector&".*"
	setvar $switchboard~message $switchboard~message&"Attack made and back in original sector!*"
end
return

include "source\include\grid"
include "source\include\sector"
include "source\include\move"
include "source\include\player"
include "source\include\xenter"
