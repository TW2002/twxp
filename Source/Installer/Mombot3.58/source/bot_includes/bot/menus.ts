# ======================     START PREFERENCES MENU SUBROUTINE    ==========================
:preferencesMenu
	setVar $botIsDeaf TRUE
	saveVar $botIsDeaf
	openMenu TWX_TOGGLEDEAF false
	closeMenu
:refreshPreferencesMenu
	gosub :BOT~killthetriggers
	gosub :BOT~load_watcher_variables
	gosub :bot~load_the_variables
	setArray $h 31
	setArray $qss 31
	setVar $h[2]  "                 "
	setVar $h[3]  "Bot Name         "
	setVar $h[4]  "Login Password   "
	setVar $h[5]  "Bot Password     "
	setVar $h[6]  "Figs to drop:         "
	setVar $h[7]  "Limps to drop:        "
	setVar $h[8]  "Armids to drop:       "
	setVar $h[9]  "Avoid Planets?        "
	setVar $h[10] "                      "
	setVar $h[11] "Max Attack:      "
	setVar $h[12] "Offensive Odds:  "
	setVar $h[13] "Stardock         (S)  "
	setVar $h[14] "Rylos            (R)  "
	setVar $h[15] "Alpha            (A)  "
	setVar $h[16] "Home Sector      (H)  "
	setVar $h[17] "Max Fighters:    "
	setVar $h[18] "Login Name:      "
	setVar $h[19] "Surround type?        "
	setVar $h[20] "Turn Limit:      "
	setVar $h[21] "Game Letter:     "
	setVar $h[22] "Safe Ship:       (X)  "
	setVar $h[23] "Banner Interval: "
	setVar $h[24] "Alien Ships:     "
	setVar $h[25] "Backdoor         (B)  "
	setVar $h[26] "Fig Type:             "
	setVar $h[27] "Alarm List            "
	setVar $h[28] "Surround HKILL?       "
	setVar $h[29] "MSL/Busted Prompt"
	setVar $h[30] "Silent Mode:     "
	setVar $h[31] "Safe Planet:     (L)  "
	
	setVar $qss[2] ""
	setVar $qss[3] $SWITCHBOARD~bot_name
	setVar $qss[4] $BOT~password
	if ($BOT~bot_password = 0)
		setvar $bot~bot_password $bot~subspace
		savevar $bot~bot_password
	end
	setVar $qss[5] $BOT~bot_password
	setVar $qss[6] $PLAYER~surroundFigs
	setVar $qss[7] $PLAYER~surroundLimp
	setVar $qss[8] $PLAYER~surroundMine
	if ($PLAYER~surroundAvoidShieldedOnly)
		setVar $qss[9] "Shielded"
	elseif ($PLAYER~surroundAvoidAllPlanets)
		setVar $qss[9] "All"
	else
		setVar $qss[9] "None"
	end
	setVar $qss[11] $SHIP~SHIP_MAX_ATTACK
	setVar $qss[12] $SHIP~SHIP_OFFENSIVE_ODDS
	if ($MAP~stardock > 0)
		setVar $qss[13] $MAP~stardock
	else
		setVar $qss[13] "Not Defined"
	end
	if ($MAP~backdoor > 0)
		setVar $qss[25] $MAP~backdoor
	else
		setVar $qss[25] "Not Defined"
	end
	if ($MAP~rylos > 0)
		setVar $qss[14] $MAP~rylos
	else
		setVar $qss[14] "Not Defined"
	end
	if ($MAP~alpha_centauri > 0)
		setVar $qss[15] $MAP~alpha_centauri
	else
		setVar $qss[15] "Not Defined"
	end
	if ($MAP~home_sector > 0)
		setVar $qss[16] $MAP~home_sector
	else
		setVar $qss[16] "Not Defined"
	end
	setVar $qss[17] $SHIP~SHIP_FIGHTERS_MAX
	setVar $qss[18] $BOT~username
	if ($PLAYER~surroundOverwrite)
		setVar $qss[19] "All Sectors"
	elseif ($PLAYER~surroundPassive)
		setVar $qss[19] "Passive"
	else
		setVar $qss[19] "Normal"
		end
	if ($PLAYER~unlimitedGame)
		setVar $qss[20] "Unlimited"
	else
		setVar $qss[20] $BOT~bot_turn_limit
	end
	setVar $qss[21] $BOT~letter
	if ($BOT~safe_ship > 0)
		setVar $qss[22] $BOT~safe_ship
	else
		setVar $qss[22] "Not Defined"
	end
	setVar $qss[23] $BOT~echoInterval&" Minutes"
	if ($PLAYER~dropOffensive)
		setVar $qss[26] "Offensive"
	elseif ($PLAYER~dropToll)
		setVar $qss[26] "Toll"
	else
		setVar $qss[26] "Defensive"
	end
	if ($PLAYER~defenderCapping)
		setVar $qss[24] "Using defense"
	elseif ($PLAYER~offenseCapping)
		setVar $qss[24] "Using offense"
	else
		setVar $qss[24] "Don't attack"  
	end
	if ($PLAYER~surround_before_hkill)
		setVar $qss[28] "Yes"
	else
		setVar $qss[28] "No"
	end
	if (($BOT~alarm_list <> "") AND ($BOT~alarm_list <> 0))
		setVar $qss[27] "Active"
	else
		setVar $qss[27] "None"
		setVar $BOT~alarm_list ""
	end

	if ($BOT~command_prompt_extras)
		setVar $qss[29] "Yes"
	else
		setVar $qss[29] "No"
	end
	if ($BOT~silent_running)
		setVar $qss[30] "Yes"
	else
		setVar $qss[30] "No"
	end
	if ($BOT~safe_planet > 0)
		setVar $qss[31] $BOT~safe_planet
	else
		setVar $qss[31] "Not Defined"
	end
	setVar $qss_total 31
	gosub :menuSpacing
	Echo #27 & "[2J"
	Echo "**"
	echo ANSI_11&"         General Info                     Gridding/Attack Options*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mC"&#27&"[35m> "&ANSI_7&$qss_var[18]&ANSI_10&#27&"[35m<"&#27&"[32m3"&#27&"[35m> "&ANSI_7&$qss_var[6]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mP"&#27&"[35m> "&ANSI_7&$qss_var[4]&ANSI_10&#27&"[35m<"&#27&"[32m4"&#27&"[35m> "&ANSI_7&$qss_var[7]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mN"&#27&"[35m> "&ANSI_7&$qss_var[3]& ANSI_10&#27&"[35m<"&#27&"[32m5"&#27&"[35m> "&ANSI_7&$qss_var[8]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mZ"&#27&"[35m> "&ANSI_7&$qss_var[5]& ANSI_10&#27&"[35m<"&#27&"[32m6"&#27&"[35m> "&ANSI_7&$qss_var[26]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mG"&#27&"[35m> "&ANSI_7&$qss_var[21]& ANSI_10&#27&"[35m<"&#27&"[32m7"&#27&"[35m> "&ANSI_7&$qss_var[10]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mE"&#27&"[35m> "&ANSI_7&$qss_var[23]&ANSI_10&#27&"[35m<"&#27&"[32m8"&#27&"[35m> "&ANSI_7&$qss_var[9]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m1"&#27&"[35m> "&ANSI_7&$qss_var[20]&ANSI_10&#27&"[35m<"&#27&"[32m9"&#27&"[35m> "&ANSI_7&$qss_var[19]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m0"&#27&"[35m> "&ANSI_7&$qss_var[29]&ANSI_10&#27&"[35m<"&#27&"[32mK"&#27&"[35m> "&ANSI_7&$qss_var[28]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mV"&#27&"[35m> "&ANSI_7&$qss_var[30]&ANSI_10&#27&"[35m<"&#27&"[32mJ"&#27&"[35m> "&ANSI_7&$qss_var[27]&"*"
	echo ANSI_11&"         Capture Options                   Location Variables*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m2"&#27&"[35m> "&ANSI_7&$qss_var[24]&ANSI_10&#27&"[35m<"&#27&"[32mS"&#27&"[35m> "&ANSI_7&$qss_var[13]&"*"
	echo ANSI_11&"        Current Ship Stats             "&#27&"[35m<"&#27&"[32mB"&#27&"[35m> "&ANSI_7&$qss_var[25]&"*"
	echo ANSI_10&"  "&ANSI_7&$qss_var[12]&ANSI_10&"  "&#27&"[35m<"&#27&"[32mR"&#27&"[35m> "&ANSI_7&$qss_var[14]&"*"
	echo ANSI_10&"  "&ANSI_7&$qss_var[11]&ANSI_10&"  "&ANSI_10&""&#27&"[35m<"&#27&"[32mA"&#27&"[35m> "&ANSI_7&$qss_var[15]&"*"
	echo ANSI_10&"  "&ANSI_7&$qss_var[17]&ANSI_10&"  "&#27&"[35m<"&#27&"[32mH"&#27&"[35m> "&ANSI_7&$qss_var[16]&"*"
	echo ANSI_10&"  "&ANSI_7&$qss_var[2]&ANSI_10&"  "&#27&"[35m<"&#27&"[32mX"&#27&"[35m> "&ANSI_7&$qss_var[22]&"*"
	echo ANSI_10&"  "&ANSI_7&$qss_var[2]&ANSI_10&"  "&#27&"[35m<"&#27&"[32mL"&#27&"[35m> "&ANSI_7&$qss_var[31]&"*"
	echo "*"
	echo ANSI_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ANSI_15&"Trader List                    Game Stats"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ANSI_7&"**"
	getConsoleInput $chosen_option SINGLEKEY
	upperCase $chosen_option
	gosub :BOT~killthetriggers
	:process_command
		if ($chosen_option = "?")
			 goto :refreshPreferencesMenu
		elseif ($chosen_option = "+")
			 goto :chatMenu
		elseif ($chosen_option = "N")
				gosub :BOT~killthetriggers
			getInput $new_bot_name ANSI_13&"What is the 'in game' name of the bot? (one word, no spaces)"&ANSI_7
			stripText $new_bot_name "^"
			stripText $new_bot_name " "
			lowerCase $new_bot_name
			if ($new_bot_name = "")
				goto :refreshPreferencesMenu
			end
			delete $BOT~gconfig_file
			write $BOT~gconfig_file $new_bot_name
			setVar $SWITCHBOARD~bot_name $new_bot_name
			saveVar $SWITCHBOARD~bot_name

		elseif ($chosen_option = "P")
			gosub :BOT~killthetriggers
			getInput $BOT~password "Please Enter your Game Password"
		elseif ($chosen_option = "Z")
			gosub :BOT~killthetriggers
			getInput $BOT~bot_password "Please Enter your Bot Password"
		elseif ($chosen_option = "G")
			gosub :BOT~killthetriggers
			getInput $BOT~letter "Please Enter your Game Letter"
		elseif ($chosen_option = "C")
			gosub :BOT~killthetriggers
			getInput $BOT~username "Please Enter your Login Name"
		elseif ($chosen_option = "1")
			if ($PLAYER~unlimitedGame = FALSE)
				gosub :BOT~killthetriggers
				getInput $temp "What are the minimum turns you need to do bot commands?"
				isNumber $test $temp
				if ($test)
					if (($temp <= 65000) AND ($temp >= 0))
						setVar $BOT~bot_turn_limit $temp
					end
				end
			end
		elseif ($chosen_option = "3")
			gosub :BOT~killthetriggers
			getInput $temp "How many fighters to drop on surround?"
			isNumber $test $temp
			if ($test)
				if (($temp <= 50000) AND ($temp >= 0))
					setVar $PLAYER~surroundFigs $temp
				end
			end
		elseif ($chosen_option = "4")
			gosub :BOT~killthetriggers
			getInput $temp "How many limpets to drop on surround?"
			isNumber $test $temp
			if ($test)
				if (($temp <= 250) AND ($temp >= 0))
					setVar $PLAYER~surroundLimp $temp
				end
			end
		elseif ($chosen_option = "5")
			gosub :BOT~killthetriggers
			getInput $temp "How many armid mines to drop on surround?"
			isNumber $test $temp
			if ($test)
				if (($temp <= 250) AND ($temp >= 0))
					setVar $PLAYER~surroundMine $temp
				end
			end
		elseif ($chosen_option = "8")
			if ($PLAYER~surroundAvoidShieldedOnly)
				setvar $PLAYER~surroundAvoidShieldedOnly FALSE
				setVar $PLAYER~surroundAvoidAllPlanets TRUE
				setVar $PLAYER~surroundDontAvoid FALSE
			elseif ($PLAYER~surroundAvoidAllPlanets)
				setVar $PLAYER~surroundAvoidShieldedOnly FALSE
				setVar $PLAYER~surroundAvoidAllPlanets FALSE
				setVar $PLAYER~surroundDontAvoid TRUE
			else
				setVar $PLAYER~surroundAvoidShieldedOnly TRUE
				setVar $PLAYER~surroundAvoidAllPlanets FALSE
				setVar $PLAYER~surroundDontAvoid FALSE
			end
		elseif ($chosen_option = "2")
			if ($PLAYER~defenderCapping)
				setvar $PLAYER~defenderCapping FALSE
				setVar $PLAYER~offenseCapping TRUE
				setVar $PLAYER~cappingAliens TRUE
			elseif ($PLAYER~offenseCapping)
				setVar $PLAYER~defenderCapping FALSE
				setVar $PLAYER~offenseCapping FALSE
				setVar $PLAYER~cappingAliens FALSE
			else
				setVar $PLAYER~defenderCapping TRUE
				setVar $PLAYER~offenseCapping FALSE
				setVar $PLAYER~cappingAliens TRUE
			end
		elseif ($chosen_option = "6")
			if ($PLAYER~dropOffensive)
				setvar $PLAYER~dropOffensive FALSE
				setvar $PLAYER~dropToll TRUE
			elseif ($PLAYER~dropToll)
				setvar $PLAYER~dropOffensive FALSE
				setvar $PLAYER~dropToll FALSE
			else
				setvar $PLAYER~dropOffensive TRUE
				setvar $PLAYER~dropToll FALSE
			end
		elseif ($chosen_option = "0")
			if ($BOT~command_prompt_extras)
				setvar $BOT~command_prompt_extras FALSE
			else
				setVar $BOT~command_prompt_extras TRUE
			end
		elseif ($chosen_option = "V")
			if ($BOT~silent_running)
				setvar $BOT~silent_running FALSE
				saveVar $BOT~silent_running
			else
				setVar $BOT~silent_running TRUE
				saveVar $BOT~silent_running
			end
		elseif ($chosen_option = "K")
			if ($PLAYER~surround_before_hkill)
				setvar $PLAYER~surround_before_hkill FALSE
			else
				setVar $PLAYER~surround_before_hkill TRUE
			end
		elseif ($chosen_option = "S")
			gosub :BOT~killthetriggers
			getInput $temp "What sector is the Stardock? (0 to set to twx variable)"
			isNumber $test $temp
			if ($test)
				if (($temp <= SECTORS) AND ($temp >= 1))
					setVar $MAP~stardock $temp
					setVar $MAP~stardock $temp
				elseif ($temp = 0)
					setVar $MAP~stardock STARDOCK
					setVar $MAP~stardock STARDOCK
				end
			end
		elseif ($chosen_option = "J")
			gosub :BOT~killthetriggers
			getInput $temp "Please enter name of traders, seperated by commas.  Can also use [2],[1] for Corporations."
			setVar $BOT~alarm_list $temp
			saveVar $BOT~alarm_list
		elseif ($chosen_option = "X")
			gosub :BOT~killthetriggers
			getInput $temp "What ship number is your safe ship?"
			isNumber $test $temp
			if ($test)
				setVar $BOT~safe_ship $temp
			end
		elseif ($chosen_option = "L")
			gosub :BOT~killthetriggers
			getInput $temp "What planet is your safe planet?"
			isNumber $test $temp
			if ($test)
				setVar $BOT~safe_planet $temp
			end
		elseif ($chosen_option = "E")
			gosub :BOT~killthetriggers
			setvar $temp 5760
			getInput $temp "How many minutes afk do you want the echo banner to show each time?"
			isNumber $test $temp
			if ($test)
				if ($temp > 0)
					setVar $BOT~echoInterval $temp
				else
					setVar $BOT~echoInterval 5760
				end
			end
		elseif ($chosen_option = "R")
			gosub :BOT~killthetriggers
			getInput $temp "What sector is the Rylos port? (0 to set to twx variable)"
			isNumber $test $temp
			if ($test)
				if (($temp <= SECTORS) AND ($temp >= 1))
					setVar $MAP~rylos $temp
				elseif ($temp = 0)
					setVar $MAP~rylos RYLOS
				end
				savevar $MAP~rylos
			end
		elseif ($chosen_option = "A")
			gosub :BOT~killthetriggers
			getInput $temp "What sector is the Alpha Centauri port? (0 to set to twx variable)"
			isNumber $test $temp
			if ($test)
				if (($temp <= SECTORS) AND ($temp >= 1))
					setVar $MAP~alpha_centauri $temp
				elseif ($temp = 0)
					setVar $MAP~alpha_centauri ALPHACENTAURI
				end
				savevar $MAP~alpha_centauri 
			end
		elseif ($chosen_option = "B")
			gosub :BOT~killthetriggers
			getInput $temp "What sector is the Backdoor to Stardock?"
			isNumber $test $temp
			if ($test)
				if (($temp <= SECTORS) AND ($temp >= 1))
					setVar $MAP~backdoor $temp
				end
				savevar $MAP~backdoor 
			end
		elseif ($chosen_option = "H")
			gosub :BOT~killthetriggers
			getInput $temp "What sector is the Home Sector port?"
			isNumber $test $temp
			if ($test)
				if (($temp <= SECTORS) AND ($temp >= 1))
					setVar $MAP~home_sector $temp
					savevar $MAP~home_sector 
				end
			end
		elseif ($chosen_option = "9")
			if ($PLAYER~surroundOverwrite)
				setvar $PLAYER~surroundOverwrite FALSE
				setVar $PLAYER~surroundPassive   TRUE
				setVar $PLAYER~surroundNormal    FALSE
			elseif ($PLAYER~surroundPassive)
				setVar $PLAYER~surroundOverwrite FALSE
				setVar $PLAYER~surroundPassive   FALSE
				setVar $PLAYER~surroundNormal    TRUE
			else
				setVar $PLAYER~surroundOverwrite TRUE
				setVar $PLAYER~surroundPassive   FALSE
				setVar $PLAYER~surroundNormal    FALSE
						end
		elseif ($chosen_option = ">")
			goto :preferencesMenuPage2
		elseif ($chosen_option = "<")
			goto :preferencesMenuPage6
		else
			gosub :donePrefer
		end
		gosub :preferenceStats
		goto :refreshPreferencesMenu
:donePrefer
	openMenu TWX_TOGGLEDEAF false
	closeMenu
		echo #27 "[30D                        " #27 "[30D"
		echo CURRENTANSILINE
		setVar $BOT~botIsDeaf FALSE
		saveVar $BOT~botIsDeaf
		goto :BOT~wait_for_command
return
:preferenceStats
	gosub :BOT~save_the_variables
return

:preferencesMenuPage2
	gosub :BOT~killthetriggers
	setArray $h 34
	setArray $qss 34
	setVar $h[1]  "Atomic Detonators      "
	setVar $h[2]  "Marker Beacons         "
	setVar $h[3]  "Corbomite Devices      "
	setVar $h[4]  "Cloaking Devices       "
	setVar $h[5]  "SubSpace Ether Probes  "
	setVar $h[6]  "Planet Scanners        "
	setVar $h[7]  "Limpet Tracking Mines  "
	setVar $h[8]  "Space Mines            "
	setVar $h[9]  "Photon Missiles        "
	setVar $h[10] "Holographic Scan       "
	setVar $h[11] "Density Scan           "
	setVar $h[12] "Mine Disruptors        "
	setVar $h[13] "Genesis Torpedoes      "
	setVar $h[14] "TransWarp I            "
	setVar $h[15] "TransWarp II           "
	setVar $h[16] "Psychic Probes         "
	setVar $h[17] "Limpet Removal         "
	setVar $h[18] "Server Max Commands    "
	setVar $h[19] "Gold Enabled           "
	setVar $h[20] "MBBS Mode              "
	setVar $h[21] "Multiple Photons?      "
	setVar $h[22] "                       "
	setVar $h[23] "Colonists Per Day      "
	setVar $h[24] "Planet Trade           "
	setVar $h[25] "Steal Factor           "
	setVar $h[26] "Rob Factor             "
	setVar $h[27] "Days To Bust Clear     "
	setVar $h[28] "                       "
	setVar $h[29] "Port Maximum           "
	setVar $h[30] "Port Production Rate   "
	setVar $h[31] "Max Port Regen Per Day "
	setVar $h[32] "                       "
	setVar $h[33] "Nav Haz Loss Per Day   "
	setVar $h[34] "Radiation Lifetime     "
	setVar $qss[1] $GAME~ATOMIC_COST
	setVar $qss[2] $GAME~BEACON_COST
	setVar $qss[3] $GAME~CORBO_COST
	setVar $qss[4] $GAME~CLOAK_COST
	setVar $qss[5] $GAME~PROBE_COST
	setVar $qss[6] $GAME~PLANET_SCANNER_COST
	setVar $qss[7] $GAME~PLANET_SCANNER_COST
	setVar $qss[8] $GAME~ARMID_COST
	if ($GAME~PHOTONS_ENABLED)
		setVar $qss[9] $GAME~PHOTON_COST
	else
		setVar $qss[9] "Disabled"
	end
	setVar $qss[10] $GAME~HOLO_COST
	setVar $qss[11] $GAME~DENSITY_COST
	setVar $qss[12] $GAME~DISRUPTOR_COST
	setVar $qss[13] $GAME~GENESIS_COST
	setVar $qss[14] $GAME~TWARPI_COST
	setVar $qss[15] $GAME~TWARPII_COST
	setVar $qss[16] $GAME~PSYCHIC_COST
	setVar $qss[17] $GAME~LIMPET_REMOVAL_COST
	if ($GAME~MAX_COMMANDS = 0)
		setVar $qss[18] "Unlimited"
	else
		setVar $qss[18] $GAME~MAX_COMMANDS
	end
	if ($GAME~goldEnabled)
		setVar $qss[19] "Yes"
	else
		setVar $qss[19] "No"
	end
	if ($GAME~mbbs)
		setVar $qss[20] "Yes"
	else
		setVar $qss[20] "No"
		end
	if ($GAME~PHOTONS_ENABLED = TRUE)
		if ($GAME~MULTIPLE_PHOTONS = TRUE)
			setVar $qss[21] "Yes"
		else
			setVar $qss[21] "No"
		end
	else
		setVar $qss[21] "Disabled"
	end
	setVar $qss[22] ""
	setVar $qss[23] $GAME~colonist_regen
	setVar $qss[24] $GAME~ptradesetting&"%"
	setVar $qss[25] $GAME~STEAL_FACTOR
	setVar $qss[26] $GAME~rob_factor
	setVar $qss[27] $GAME~CLEAR_BUST_DAYS
	setVar $qss[28] ""
	setVar $qss[29] $GAME~port_max
	setVar $qss[30] $GAME~PRODUCTION_RATE&"%"
	setVar $qss[31] $GAME~PRODUCTION_REGEN&"%"
	setVar $qss[32] ""
	setVar $qss[33] $GAME~DEBRIS_LOSS&"%"
	setVar $qss[34] $GAME~RADIATION_LIFETIME
	setVar $qss_total 34
	gosub :menuSpacing
	Echo #27 & "[2J"
	Echo "**"
	echo ANSI_11&"      Stardock Prices                 Game Statistics*"
	echo ANSI_10&" "&ANSI_7&$qss_var[1]&ANSI_10&""&ANSI_7&$qss_var[18]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[2]&ANSI_10&""&ANSI_7&$qss_var[19]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[3]&ANSI_10&""&ANSI_7&$qss_var[20]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[4]&ANSI_10&""&ANSI_7&$qss_var[21]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[5]&ANSI_10&""&ANSI_7&$qss_var[22]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[6]&ANSI_10&""&ANSI_7&$qss_var[23]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[7]&ANSI_10&""&ANSI_7&$qss_var[24]&"*"
	echo ANSI_11&" "&ANSI_7&$qss_var[8]&ANSI_10&""&ANSI_7&$qss_var[25]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[9]&ANSI_10&""&ANSI_7&$qss_var[26]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[10]&ANSI_10&""&ANSI_7&$qss_var[27]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[11]&ANSI_10&""&ANSI_7&$qss_var[28]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[12]&ANSI_10&""&ANSI_7&$qss_var[29]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[13]&ANSI_10&""&ANSI_7&$qss_var[30]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[14]&ANSI_10&""&ANSI_7&$qss_var[31]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[15]&ANSI_10&""&ANSI_7&$qss_var[32]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[16]&ANSI_10&""&ANSI_7&$qss_var[33]&"*"
	echo ANSI_10&" "&ANSI_7&$qss_var[17]&ANSI_10&""&ANSI_7&$qss_var[34]&"*"
	echo "*"
	echo ANSI_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ANSI_15&"Preferences                Hot Keys"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ANSI_7&"**"
	getConsoleInput $chosen_option SINGLEKEY
	upperCase $chosen_option
	gosub :BOT~killthetriggers
	upperCase $chosen_option
	:process_commandPage2
		if ($chosen_option = "?")
			 goto :preferencesMenuPage2     
		elseif ($chosen_option = ">")
			goto :preferencesMenuPage3
		elseif ($chosen_option = "<")
			goto :refreshPreferencesMenu
		else
			gosub :donePrefer
		end
:preferencesMenuPage3
	gosub :BOT~killthetriggers
	Echo #27 & "[2J"
	Echo "**"
	echo ANSI_11&"                  Custom Hotkey Definitions           *"
	gosub :echoHotkeys
	echo "*"
	echo ANSI_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ANSI_15&"Game Stats                    Ship Info"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ANSI_7&"**"
	setVar $options "1234567890ABCDEFGHIJKLMNOPRSTUVWX	 "
	getConsoleInput $chosen_option SINGLEKEY
	upperCase $chosen_option
	getWordPos $options $pos $chosen_option
	gosub :BOT~killthetriggers
	
	:process_commandPage3
		if ($chosen_option = "?")
			 goto :preferencesMenuPage3 
		elseif ($chosen_option = ">")
			goto :preferencesMenuPage4
		elseif ($chosen_option = "<")
			goto :preferencesMenuPage2
		elseif ($pos > 0)
			gosub :BOT~killthetriggers
			echo "*What should this hotkey be set to?*"
			getConsoleInput $temp SINGLEKEY
			lowerCase $temp
			getCharCode $temp $lower
			upperCase $temp
			getCharCode $temp $upper
			setVar $key $BOT~custom_keys[$pos]
			upperCase $key
			getCharCode $key $old_upper
			lowerCase $key
			getCharCode $key $old_lower
			if (((($BOT~hotkeys[$upper] = "0") OR ($BOT~hotkeys[$upper] = "")) AND (($BOT~hotkeys[$lower] = "0") OR ($BOT~hotkeys[$lower] = ""))) AND (($lower < 48) OR ($lower > 57)) AND ($temp <> "?"))
				setVar $BOT~hotkeys[$old_upper] ""
				setVar $BOT~hotkeys[$old_lower] ""
				setVar $BOT~hotkeys[$upper] $pos
				setVar $BOT~hotkeys[$lower] $pos
				setVar $BOT~custom_keys[$pos] $temp
				if ($pos > 17)
					getInput $temp "What is the bot command to connect to this hotkey?"
					setVar $BOT~custom_commands[$pos] $temp
				end
				setVar $i 1
				delete "scripts/mombot/hotkeys.cfg"
				delete "scripts/mombot/custom_keys.cfg"
				delete "scripts/mombot/custom_commands.cfg"
				while ($i <= 255)
					write "scripts/mombot/hotkeys.cfg" $BOT~hotkeys[$i]
					add $i 1
				end
				setVar $i 1
				while ($i <= 33)
					write "scripts/mombot/custom_keys.cfg" $BOT~custom_keys[$i]
					add $i 1
				end
				setVar $i 1
				while ($i <= 33)
					write "scripts/mombot/custom_commands.cfg" $BOT~custom_commands[$i]
					add $i 1
				end
			else
				echo ANSI_4 "*Hot key already bound to another function.**" ANSI_7
				setDelayTrigger warningdelay :preferencesMenuPage3 1000
				pause
			end
			goto :preferencesMenuPage3
		else
			gosub :donePrefer
		end     
:preferencesMenuPage4
	gosub :BOT~killthetriggers
	setVar $i 1
	setVar $shipsChanged FALSE
	if ($SHIP~shipcounter > 10)
		setVar $pagesExist TRUE
	else
		setVar $pagesExist FALSE
	end
	:NextShipPage
		setVar $thisPage $i
		setVar $menuCount 0
		Echo #27 & "[2J"
		Echo "**"
		echo ANSI_11&"                      Known Ship Information           **"
		echo ANSI_15 "    Type                      Def  Off  TPW  D-Bonus?   Shields   Fighters *"
		echo "   " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
		while (($i < $SHIP~shipcounter) AND ($menuCount < 10))
			cutText $SHIP~shipList[$i]&"                                    " $temp 1 25
			cutText $SHIP~shipList[$i][2]&"  " $tempdefhead 1 1
			cutText $SHIP~shipList[$i][2]&"  " $tempdeftail 2 1
			cutText $SHIP~shipList[$i][3]&"  " $tempoffhead 1 1
			cutText $SHIP~shipList[$i][3]&"  " $tempofftail 2 1
			if ($SHIP~shipList[$i][8])
				setVar $tempdefender ANSI_12&"Yes"&ANSI_14
			else
				setVar $tempdefender "No "
			end
			cutText $SHIP~shipList[$i][1]&"              " $tempshields 1 10
			cutText $SHIP~shipList[$i][5]&"              " $tempfighters 1 6
			cutText $SHIP~shipList[$i][7]&"              " $temptpw 1 3
			echo ANSI_14 "<" $menuCount "> " $temp " " $tempdefhead "." $tempdeftail "  " $tempoffhead "." $tempofftail "   " $temptpw "   " $tempdefender "       " $tempshields " " $tempfighters "*"
			add $i 1
			add $menuCount 1
		end
		echo "   " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
		echo "*"
		if ($pagesExist = TRUE)
			Echo "  " & ANSI_5 & "<" & ANSI_6 & "+" & ANSI_5 & ">" & ANSI_6 & " More Ships*"
		end
		echo "*"
		echo ANSI_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ANSI_15&"Hot Keys                 Planet Types"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ANSI_7&"**"

		echo "  " & ANSI_5 & "Toggle defender status (0-9)? "
		getConsoleInput $selection SINGLEKEY
		setVar $options "1234567890"
		upperCase $selection
		getWordPos $options $pos $selection
		gosub :BOT~killthetriggers
		if ($selection = "<")
			gosub :rewrite_cap_file
			goto :PreferencesMenuPage3
		elseif ($selection = ">")
			gosub :rewrite_cap_file
			goto :PREFERENCESMENUPAGEPLANET
		elseif ($selection = "?")
			gosub :rewrite_cap_file
			goto :PreferencesMenuPage4
		elseif (($pagesExist) AND ($selection = "+"))
			if ($i >= $SHIP~shipcounter)
				setVar $i 1
			end
			goto :NextShipPage
		elseif ($pos > 0)
			if ($SHIP~shipList[($selection+$thisPage)][8])
				setVar $SHIP~shipList[($selection+$thisPage)][8] FALSE
			else
				setVar $SHIP~shipList[($selection+$thisPage)][8] TRUE
			end
			setVar $i $thisPage
			setVar $shipsChanged TRUE
			goto :NextShipPage
		else
			gosub :rewrite_cap_file
			gosub :donePrefer
		end

:preferencesMenuPagePlanet
	gosub :BOT~killthetriggers
	setVar $i 1
	setVar $planetsChanged FALSE
	if ($PLANET~planetcounter > 10)
		setVar $pagesExist TRUE
	else
		setVar $pagesExist FALSE
	end
	:NextPlanetInfoPage
		setVar $thisPage $i
		setVar $menuCount 0
		Echo #27 & "[2J"
		Echo "**"
		echo ANSI_11&"            Planet Type Information  (Max Colos Per Product Type)         **"
		echo ANSI_15 "    Type                       Min Fuel  Max Fuel  Min Org  Max Org  Min Equ  Max Equ  Keeper? *"
		echo "   " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
		while (($i <= $PLANET~planetcounter) AND ($menuCount < 10))
			cutText $PLANET~planetList[$i]&"                                    " $temp 8 28
			cutText $PLANET~planetList[$i][1]&"                                 " $tempfuelmin 1 8
			cutText $PLANET~planetList[$i][2]&"                                 " $tempfuel 1 8
			cutText $PLANET~planetList[$i][3]&"                                 " $temporgmin 1 8
			cutText $PLANET~planetList[$i][4]&"                                 " $temporg 1 8
			cutText $PLANET~planetList[$i][5]&"                                 " $tempequipmin 1 8
			cutText $PLANET~planetList[$i][6]&"                                 " $tempequip 1 8
			if ($PLANET~planetList[$i][7] = TRUE)
				setVar $tempKeeper "Yes"
			else
				setVar $tempKeeper "No"
			end
			echo ANSI_14 "<" $menuCount ">" $temp " " $tempfuelmin " " $tempfuel "  " $temporgmin "  " $temporg "  " $tempequipmin "  " $tempequip " " $tempkeeper "*"
			add $i 1
			add $menuCount 1
		end
		echo "   " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
		echo "*"
		if ($pagesExist = TRUE)
			Echo "  " & ANSI_5 & "<" & ANSI_6 & "+" & ANSI_5 & ">" & ANSI_6 & " More Planets*"
		end
		echo "*"
		echo ANSI_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ANSI_15&"Hot Keys                 Planet List"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ANSI_7&"**"
		if ($toggleagain = true)
			goto :toggleagain
		end

		echo "  " & ANSI_5 & "Update Planet Info (0-9)?   Toggle (k)eeper planet"
		getConsoleInput $selection SINGLEKEY
		setVar $options "1234567890"
		upperCase $selection
		getWordPos $options $pos $selection
		gosub :BOT~killthetriggers
		if ($selection = "<")
			gosub :rewrite_planet_file
			goto :PreferencesMenuPage4
		elseif ($selection = ">")
			gosub :rewrite_planet_file
			goto :PREFERENCESMENUPAGE5
		elseif ($selection = "?")
			gosub :rewrite_planet_file
			goto :PreferencesMenuPagePlanet
		elseif ($selection = "K")
			:toggleagain
			echo "  " & ANSI_5 & "Which planet to set keeper status? (0-9)"
			getConsoleInput $planet SINGLEKEY
			setVar $options "1234567890"
			upperCase $planet
			getWordPos $options $pos $planet
			setvar $toggleagain false
			if ($pos > 0)
				if ($PLANET~planetList[($planet+$thisPage)][7] = true)
					setVar $PLANET~planetList[($planet+$thisPage)][7] false		
				else
					setVar $PLANET~planetList[($planet+$thisPage)][7] true		
				end
				setvar $toggleagain true
			else
				gosub :rewrite_planet_file
			end
			goto :PreferencesMenuPagePlanet
		elseif (($pagesExist) AND ($selection = "+"))
			if ($i >= $PLANET~planetcounter)
				setVar $i 1
			end
			goto :NextPlanetInfoPage
		elseif ($pos > 0)
			getInput $temp "What are the min fuel colos for "&$PLANET~planetList[($selection+$thisPage)]&"?"
			isNumber $test $temp
			if ($test = FALSE)
				goto :PreferencesMenuPagePlanet
			end
			setVar $PLANET~planetList[($selection+$thisPage)][1] $temp

			getInput $temp "What are the max fuel colos for "&$PLANET~planetList[($selection+$thisPage)]&"?"
			isNumber $test $temp
			if ($test = FALSE)
				goto :PreferencesMenuPagePlanet
			end
			setVar $PLANET~planetList[($selection+$thisPage)][2] $temp

			getInput $temp "What are the min organics colos for "&$PLANET~planetList[($selection+$thisPage)]&"?"
			isNumber $test $temp
			if ($test = FALSE)
				goto :PreferencesMenuPagePlanet
			end
			setVar $PLANET~planetList[($selection+$thisPage)][3] $temp

			getInput $temp "What are the max organics colos for "&$PLANET~planetList[($selection+$thisPage)]&"?"
			isNumber $test $temp
			if ($test = FALSE)
				goto :PreferencesMenuPagePlanet
			end
			setVar $PLANET~planetList[($selection+$thisPage)][4] $temp

			getInput $temp "What are the min equipment colos for "&$PLANET~planetList[($selection+$thisPage)]&"?"
			isNumber $test $temp
			if ($test = FALSE)
				goto :PreferencesMenuPagePlanet
			end
			setVar $PLANET~planetList[($selection+$thisPage)][5] $temp

			getInput $temp "What are the max equipment colos for "&$PLANET~planetList[($selection+$thisPage)]&"?"
			isNumber $test $temp
			if ($test = FALSE)
				goto :PreferencesMenuPagePlanet
			end
			setVar $PLANET~planetList[($selection+$thisPage)][6] $temp

			echo "Is this planet a keeper? (y/n)*"
			getConsoleInput $keeperselection SINGLEKEY
			upperCase $keeperselection
			if ($keeperselection = "Y")
				setVar $PLANET~planetList[($selection+$thisPage)][7] TRUE
			else
				setVar $PLANET~planetList[($selection+$thisPage)][7] FALSE
			end
			setVar $i $thisPage
			setVar $planetsChanged TRUE
			gosub :rewrite_planet_file
			goto :PreferencesMenuPagePlanet
		else
			gosub :rewrite_planet_file
			gosub :donePrefer
		end


:rewrite_cap_file
	if ($shipsChanged)
		setVar $j 1
		while ($j < $SHIP~shipcounter)
			write $SHIP~cap_file $SHIP~shipList[$j][1] & " " & $SHIP~shipList[$j][2] & " " & $SHIP~shipList[$j][3] & " " & $SHIP~shipList[$j][9] & " " & $SHIP~shipList[$j][4] & " " & $SHIP~shipList[$j][5] & " " & $SHIP~shipList[$j][6] & " " & $SHIP~shipList[$j][7] & " " & $SHIP~shipList[$j][8] & " " & $SHIP~shipList[$j]
			add $j 1
		end
	end
return


:rewrite_planet_file
	if ($planetsChanged)
		delete $PLANET~planet_file
		setVar $j 1
		while ($j <= $PLANET~planetcounter)
			write $PLANET~planet_file $PLANET~planetList[$j][1] & " " & $PLANET~planetList[$j][2] & " " & $PLANET~planetList[$j][3] & " " & $PLANET~planetList[$j][4] & " " & $PLANET~planetList[$j][5] & " " & $PLANET~planetList[$j][6] & " " & $PLANET~planetList[$j][7] & "  " & $PLANET~planetList[$j]
			add $j 1
		end
	end
return

:PREFERENCESMENUPAGE5
	setVar $i 2
:nextPlanetPage
	echo ANSI_12 "*Searching for enemy planets in database" ANSI_14 "...*"
	gosub :BOT~killthetriggers
	setVar $foundSectors 0
	setVar $display ""
	while (($i <= SECTORS) AND ($foundSectors < 3))
		getSectorParameter $i "BUBBLE" $isBubble
		if ($isBubble <> TRUE)
			if (SECTOR.PLANETCOUNT[$i] > 0)
				setVar $MAP~displaySector $i
				gosub :MAP~displaySector
				setVar $display $display&"*"&$MAP~output
				add $foundSectors 1
			end
		end
		add $i 1
	end
	Echo #27 & "[2J"
	Echo "**"
	echo ANSI_11&"                         Known Planet List*             ("&ANSI_14&"Planets in database (Not in bubble)"&ANSI_11&")              **"
	echo "   " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
	setVar $pagesExist FALSE
	if ($foundSectors > 0)
		echo $display
		if ($i >= SECTORS)
			echo "*    [End of List]"
			setVar $i 2
		else
			setVar $pagesExist TRUE
		end
	else
		echo "*    [End of List]"
	end
	echo "*"
	echo "   " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
	echo "*"
	if ($pagesExist)
		Echo "  " & ANSI_5 & "<" & ANSI_6 & "+" & ANSI_5 & ">" & ANSI_6 & " More Planets*"
	end
	echo "*"
	echo ANSI_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ANSI_15&"Planet Types                 Trader List"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ANSI_7&"**"
	getConsoleInput $selection SINGLEKEY
	setVar $options ""
	upperCase $selection
	getWordPos $options $pos $selection
	gosub :BOT~killthetriggers
	if ($selection = "<")
		goto :PreferencesMenuPagePlanet
	elseif ($selection = ">")
		goto :PREFERENCESMENUPAGE6
	elseif ($selection = "?")
		goto :PreferencesMenuPage5
	elseif ($selection = "+")
		goto :nextPlanetPage
	else
		gosub :donePrefer
	end

	:PREFERENCESMENUPAGE6
	setVar $i 2
:nextTraderPage
	echo ANSI_12 "*Searching for traders in database" ANSI_14 "...*"
	gosub :BOT~killthetriggers
	setVar $foundSectors 0
	setVar $display ""
	while (($i <= SECTORS) AND ($foundSectors < 3))
			if (SECTOR.TRADERCOUNT[$i] > 0)
				setVar $MAP~displaySector $i
				gosub :MAP~displaySector
				setVar $display $display&"*"&$MAP~output
				add $foundSectors 1
			end
		add $i 1
	end
	Echo #27 & "[2J"
	Echo "**"
	echo ANSI_11&"                         Trader List*             ("&ANSI_14&"Traders last seen in sectors"&ANSI_11&")              **"
	echo "   " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
	setVar $pagesExist FALSE
	if ($foundSectors > 0)
		echo $display
		if ($i >= SECTORS)
			echo "*    [End of List]"
			setVar $i 2
		else
			setVar $pagesExist TRUE
		end
	else
		echo "*    [End of List]"
	end
	echo "*"
	echo "   " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
	echo "*"
	if ($pagesExist)
		Echo "  " & ANSI_5 & "<" & ANSI_6 & "+" & ANSI_5 & ">" & ANSI_6 & " More Planets*"
	end
	echo "*"
	echo ANSI_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ANSI_15&"Planet Info                 Preferences"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ANSI_7&"**"

	#echo "  " & ANSI_5 & "Toggle defender status (0-9)? "
	getConsoleInput $selection SINGLEKEY
	setVar $options ""
	upperCase $selection
	getWordPos $options $pos $selection
	gosub :BOT~killthetriggers
	if ($selection = "<")
		goto :PreferencesMenuPage5
	elseif ($selection = ">")
		goto :refreshPreferencesMenu
	elseif ($selection = "?")
		goto :PreferencesMenuPage6
	elseif ($selection = "+")
		goto :nextTraderPage
	else
		gosub :donePrefer
	end




:echoHotKeys
	setArray $h 34
	setArray $qss 34
	setVar $h[1]  "Auto Kill            "
	setVar $h[2]  "Auto Capture         "
	setVar $h[3]  "Auto Refurb          "
	setVar $h[4]  "Surround             "
	setVar $h[5]  "Holo-Torp            "
	setVar $h[6]  "Transwarp Drive      "
	setVar $h[7]  "Planet Macros        "
	setVar $h[8]  "Quick Script Loading "
	setVar $h[9]  "Dny Holo Kill        "
	setVar $h[10] "Stop Current Mode    "
	setVar $h[11] "Dock Macros          "
	setVar $h[12] "Exit Enter           "
	setVar $h[13] "Mow                  "
	setVar $h[14] "Fast Foton           "
	setVar $h[15] "Clear Sector         "
	setVar $h[16] "Preferences          "
	setVar $h[17] "LS Dock Shopper      "
	setVar $i 1
	while ($i <= 16)
		if ($BOT~custom_commands[($i+17)] <> "0")
			setVar $h[($i+17)] $BOT~custom_commands[($i+17)]&"                              "
			cutText $h[($i+17)] $h[($i+17)] 1 22
		else
			setVar $h[($i+17)] "Custom Hotkey "&$i&"        "
			cutText $h[($i+17)] $h[($i+17)] 1 22
		end
		add $i 1
	end
	setVar $h[34] "                     "
	setVar $i 1
	while ($i <= 33)
		if (($BOT~custom_keys[$i] <> "0") AND ($BOT~custom_keys[$i] <> ""))
			if (($BOT~custom_keys[$i] = #9) or ($BOT~custom_keys[$i] = "	"))
				setVar $qss[$i] "TAB-TAB"
			elseif ($BOT~custom_keys[$i] = #13)
				setVar $qss[$i] "TAB-Enter"
			elseif ($BOT~custom_keys[$i] = #8)
				setVar $qss[$i] "TAB-Backspace"
			elseif ($BOT~custom_keys[$i] = #32)
				setVar $qss[$i] "TAB-Spacebar"
			else
				setVar $qss[$i] "TAB-"&$BOT~custom_keys[$i]
			end
		else
			setVar $qss[$i] "Undefined"
		end
		add $i 1
	end
	setVar $qss[34] ""
	setVar $qss_total 34
	gosub :menuSpacing
	echo ANSI_10&#27&"[35m<"&#27&"[32m1"&#27&"[35m> "&ANSI_7&$qss_var[1]&ANSI_10&#27&"[35m<"&#27&"[32mH"&#27&"[35m> "&ANSI_7&$qss_var[18]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m2"&#27&"[35m> "&ANSI_7&$qss_var[2]&ANSI_10&#27&"[35m<"&#27&"[32mI"&#27&"[35m> "&ANSI_7&$qss_var[19]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m3"&#27&"[35m> "&ANSI_7&$qss_var[3]&ANSI_10&#27&"[35m<"&#27&"[32mJ"&#27&"[35m> "&ANSI_7&$qss_var[20]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m4"&#27&"[35m> "&ANSI_7&$qss_var[4]&ANSI_10&#27&"[35m<"&#27&"[32mK"&#27&"[35m> "&ANSI_7&$qss_var[21]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m5"&#27&"[35m> "&ANSI_7&$qss_var[5]&ANSI_10&#27&"[35m<"&#27&"[32mL"&#27&"[35m> "&ANSI_7&$qss_var[22]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m6"&#27&"[35m> "&ANSI_7&$qss_var[6]&ANSI_10&#27&"[35m<"&#27&"[32mM"&#27&"[35m> "&ANSI_7&$qss_var[23]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m7"&#27&"[35m> "&ANSI_7&$qss_var[7]&ANSI_10&#27&"[35m<"&#27&"[32mN"&#27&"[35m> "&ANSI_7&$qss_var[24]&"*"
	echo ANSI_11&#27&"[35m<"&#27&"[32m8"&#27&"[35m> "&ANSI_7&$qss_var[8]&ANSI_10&#27&"[35m<"&#27&"[32mO"&#27&"[35m> "&ANSI_7&$qss_var[25]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m9"&#27&"[35m> "&ANSI_7&$qss_var[9]&ANSI_10&#27&"[35m<"&#27&"[32mP"&#27&"[35m> "&ANSI_7&$qss_var[26]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m0"&#27&"[35m> "&ANSI_7&$qss_var[10]&ANSI_10&#27&"[35m<"&#27&"[32mR"&#27&"[35m> "&ANSI_7&$qss_var[27]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mA"&#27&"[35m> "&ANSI_7&$qss_var[11]&ANSI_10&#27&"[35m<"&#27&"[32mS"&#27&"[35m> "&ANSI_7&$qss_var[28]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mB"&#27&"[35m> "&ANSI_7&$qss_var[12]&ANSI_10&#27&"[35m<"&#27&"[32mT"&#27&"[35m> "&ANSI_7&$qss_var[29]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mC"&#27&"[35m> "&ANSI_7&$qss_var[13]&ANSI_10&#27&"[35m<"&#27&"[32mU"&#27&"[35m> "&ANSI_7&$qss_var[30]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mD"&#27&"[35m> "&ANSI_7&$qss_var[14]&ANSI_10&#27&"[35m<"&#27&"[32mV"&#27&"[35m> "&ANSI_7&$qss_var[31]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mE"&#27&"[35m> "&ANSI_7&$qss_var[15]&ANSI_10&#27&"[35m<"&#27&"[32mW"&#27&"[35m> "&ANSI_7&$qss_var[32]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mF"&#27&"[35m> "&ANSI_7&$qss_var[16]&ANSI_10&#27&"[35m<"&#27&"[32mX"&#27&"[35m> "&ANSI_7&$qss_var[33]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mG"&#27&"[35m> "&ANSI_7&$qss_var[17]&ANSI_10&""&ANSI_7&$qss_var[34]&"*"
return
# ======================     END PREFERENCES MENU SUBROUTINE    ==========================


# ============================== STARTING IN A NEW GAME SUB ==============================
:add_game
	setvar $new_bot_name ""
	getInput $new_bot_name ANSI_13&"What is the 'in game' name of the bot? (one word, no spaces)"&ANSI_7
	stripText $new_bot_name "^"
	stripText $new_bot_name " "
	lowerCase $new_bot_name
	if ($new_bot_name = "")
		goto :add_game
	end
	setVar $BOT~password PASSWORD
	setVar $BOT~username LOGINNAME
	setVar $BOT~letter GAME
	if (($BOT~letter = "") or ($bot~letter = "0"))
		getInput $BOT~letter "Please Enter your Game Letter"
	end
	if (($BOT~username = "") or ($bot~username = "0"))
		getInput $BOT~username "Please Enter your Login Name"
	end
	if (($BOT~password = "") or ($bot~password = "0"))
		getInput $BOT~password "Please Enter your Game password"
	end
	saveVar $BOT~letter
	saveVar $BOT~username
	saveVar $BOT~password
	
	delete $BOT~gconfig_file
	write $BOT~gconfig_file $new_bot_name
	setVar $SWITCHBOARD~bot_name $new_bot_name
	saveVar $SWITCHBOARD~bot_name 
return
# ============================== END STARTING IN A NEW GAME SUB ==============================


# ========================= START PREGAME MENU ========================================
:preGameMenuLoad
	killalltriggers
	loadVar $BOT~password
	loadVar $SWITCHBOARD~bot_name
	setVar $BOT~bot_name $SWITCHBOARD~bot_name
	loadVar $BOT~startShipName
	loadVar $BOT~mowToDock
	loadVar $BOT~mowToDockBackdoor
	loadVar $BOT~startGameDelay
	loadVar $BOT~isCEO
	loadVar $BOT~corpName
	if ($BOT~corpName = 0)
		setVar $BOT~corpName ""
		saveVar $BOT~corpName
	end
	loadVar $BOT~subspace
	loadVar $corpNumber
	loadVar $BOT~corpPassword
	if ($BOT~corpPassword = 0)
		setVar $BOT~corpPassword ""
		saveVar $BOT~corpPassword
	end
	loadVar $BOT~username
	loadVar $BOT~letter
	loadVar $BOT~password
	if ($BOT~password = 0)
		setVar $BOT~password PASSWORD
	end
	if ($BOT~username = 0)
		setVar $BOT~username LOGINNAME
	end
	if ($BOT~letter = 0)
		setVar $BOT~letter GAME
	end
	if (($BOT~startShipName = 0) OR ($BOT~startShipName = ""))
		setVar $BOT~startShipName "Mind ()ver Matter"
	end
	if ($SWITCHBOARD~bot_name = "")
		setVar $BOT~newGameDay1 TRUE
		setVar $BOT~newGameOlder FALSE
	else
		setVar $BOT~newGameDay1 FALSE
		setVar $BOT~newGameOlder TRUE
	end
	if ($BOT~isShipDestroyed = TRUE)
		setVar $BOT~newGameDay1 FALSE
		setVar $BOT~newGameOlder FALSE
	end
:preGameMenu
	setArray $h 26
	setArray $qss 26
	setVar $h[1]  "Bot Name:        "
	setVar $h[2]  "Login Name:      "
	setVar $h[3]  "Password:        "
	setVar $h[4]  "Game Letter:     "
	setVar $h[5]  "Ship Name:       "
	setVar $h[6]  "Type of login:   "
	setVar $h[7]  "Are you CEO?     "
	setVar $h[8]  "Corp Name:       "
	setVar $h[9]  "Corp Password:   "
	setVar $h[10] "Subspace Channel:"
	setVar $h[11] "Delay (Minutes): "
	setVar $h[12] "After login:     "
	setVar $h[13] "Bot command to perform:"
	setVar $h[14] "                 "
	setVar $h[15] "                 "
	setVar $h[16] "                 "
	setVar $h[17] "                 "
	setVar $h[18] "                 "
	setVar $h[19] "                 "
	setVar $h[20] "                 "
	setVar $h[21] "                 "
	setVar $h[22] "                 "
	setVar $h[23] "                 "
	setVar $h[24] "                 "
	setVar $h[25] "                 "
	setVar $h[26] "                 "
	setVar $qss[1] $SWITCHBOARD~bot_name
	setVar $qss[2] $BOT~username
	setVar $qss[3] $BOT~password
	setVar $qss[4] $BOT~letter
	setVar $qss[5] $BOT~startShipName
	if ($BOT~newGameDay1)
		setVar $qss[6] "New Game Account Creation"
	elseif ($BOT~newGameOlder)
		setVar $qss[6] "Normal Relog"
	else
		setVar $qss[6] "Return after being destroyed."
	end
	if ($BOT~isCEO)
		setVar $qss[7] "Yes"
	else
		setVar $qss[7] "No"
	end
	loadvar $bot~corpName
	setVar $qss[8] $BOT~corpName
	setVar $qss[9] $BOT~corpPassword
	setVar $qss[10] $BOT~subspace
	setVar $qss[11] $BOT~startGameDelay
	if ($BOT~mowToDock)
		setVar $qss[12] "Mow To Stardock"
	elseif ($mowToAlpha)
		setVar $qss[12] "Mow To Alpha"
	elseif ($mowToRylos)
		setVar $qss[12] "Mow To Rylos"
	elseif ($mowToOther)
		setVar $qss[12] "Mow To Custom TA"
	elseif ($xportToShip)
		setVar $qss[12] "Xport to ship"
	elseif ($landOnTerra)
		setVar $qss[12] "Land on Terra"
	else
		setVar $qss[12] "Nothing"
	end
	loadvar $command_to_issue
	if (($command_to_issue = "") or ($command_to_issue = "0"))
		setVar $qss[13] "None"
	else
		setVar $qss[13] $command_to_issue
	end
	setVar $qss[14] ""
	setVar $qss[15] ""
	setVar $qss[16] ""
	setVar $qss[17] ""
	setVar $qss[18] ""
	setVar $qss[19] ""
	setVar $qss[20] ""
	setVar $qss[21] ""
	setVar $qss[22] ""
	setVar $qss[23] ""
	setVar $qss[24] ""
	setVar $qss[25] ""
	setVar $qss[26] ""
	setVar $qss_total 26
	gosub :menuSpacing
	echo "**"
	echo ANSI_11&" Relog Menu   (Q to quit, Z to start logging in.)         *"
	echo ANSI_10&#27&"[35m<"&#27&"[32m1"&#27&"[35m> "&ANSI_7&$qss_var[6] &"*"
	echo "*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mB"&#27&"[35m> "&ANSI_7&$qss_var[1] &"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mL"&#27&"[35m> "&ANSI_7&$qss_var[2] &"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mP"&#27&"[35m> "&ANSI_7&$qss_var[3] &"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32mG"&#27&"[35m> "&ANSI_7&$qss_var[4] &"*"
	if ($BOT~newGameOlder = FALSE)
		echo ANSI_10&#27&"[35m<"&#27&"[32mS"&#27&"[35m> "&ANSI_7&$qss_var[5] &"*"
	end
	if ($BOT~newGameDay1 = TRUE)
		echo ANSI_10&#27&"[35m<"&#27&"[32m2"&#27&"[35m> "&ANSI_7&$qss_var[7] &"*"
		echo ANSI_10&#27&"[35m<"&#27&"[32m3"&#27&"[35m> "&ANSI_7&$qss_var[8] &"*"
		echo ANSI_10&#27&"[35m<"&#27&"[32m4"&#27&"[35m> "&ANSI_7&$qss_var[9] &"*"
		echo ANSI_10&#27&"[35m<"&#27&"[32m5"&#27&"[35m> "&ANSI_7&$qss_var[10]&"*"
	end
	echo ANSI_10&#27&"[35m<"&#27&"[32m6"&#27&"[35m> "&ANSI_7&$qss_var[11]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m7"&#27&"[35m> "&ANSI_7&$qss_var[12]&"*"
	echo ANSI_10&#27&"[35m<"&#27&"[32m8"&#27&"[35m> "&ANSI_7&$qss_var[13]&"*"
	echo "*"
	:getStartGameInput
		getConsoleInput $chosen_option SINGLEKEY
		killalltriggers
		upperCase $chosen_option
	:process_start_command
		if ($chosen_option = "?")
			 goto :pregameMenu
		elseif ($chosen_option = "B")
			killalltriggers
			getInput $new_bot_name ANSI_13&"What is the 'in game' name of the bot? (one word, no spaces)"&ANSI_7
			stripText $new_bot_name "^"
			stripText $new_bot_name " "
			if ($new_bot_name = "")
				goto :pregameMenu
			end
			delete $BOT~gconfig_file
			write $BOT~gconfig_file $new_bot_name
			setVar $SWITCHBOARD~bot_name $new_bot_name
			saveVar $SWITCHBOARD~bot_name
		elseif ($chosen_option = "P")
			killalltriggers
			getInput $BOT~password "Please Enter your Game Password"
		elseif ($chosen_option = "G")
			killalltriggers
			getInput $BOT~letter "Please Enter your Game Letter"
		elseif ($chosen_option = "L")
			killalltriggers
			getInput $BOT~username "Please Enter your Login Name"
		elseif ($chosen_option = "S")
			killalltriggers
			getInput $BOT~startShipName "What ship name would you like?"
		elseif ($chosen_option = "1")
			if ($BOT~newGameDay1)
				setvar $BOT~newGameDay1 FALSE
				setvar $BOT~newGameOlder TRUE
			elseif ($BOT~newGameOlder)
				setvar $BOT~newGameDay1 FALSE
				setvar $BOT~newGameOlder FALSE
			else
				setvar $BOT~newGameDay1 TRUE
				setvar $BOT~newGameOlder FALSE
			end
		elseif ($chosen_option = "2") AND (($BOT~newGameDay1 = TRUE) OR ($BOT~newGameOlder = TRUE))
			if ($BOT~isCEO)
				setvar $BOT~isCEO FALSE
			else
				setVar $BOT~isCEO TRUE
			end
		elseif ($chosen_option = "3") AND (($BOT~newGameDay1 = TRUE) OR ($BOT~newGameOlder = TRUE))
			getInput $temp "What Corp Name will you use?"
			if ($temp = "0")
				setVar $temp ""
			end
			setVar $BOT~corpName $temp
			savevar $bot~corpName
		elseif ($chosen_option = "4") AND (($BOT~newGameDay1 = TRUE) OR ($BOT~newGameOlder = TRUE))
			getInput $temp "What Corp Password will you use?"
			if ($temp = "0")
				setVar $temp ""
			end
			setVar $BOT~corpPassword $temp
		elseif ($chosen_option = "5") AND (($BOT~newGameDay1 = TRUE) OR ($BOT~newGameOlder = TRUE))
			getInput $temp "What subspace channel do you want to use?"
			isNumber $test $temp
			if ($test)
				if (($temp <= 60000) AND ($temp >= 0))
					setVar $BOT~subspace $temp
				end
			end
		elseif ($chosen_option = "6")
			getInput $temp "How long in minutes before the game starts?"
			isNumber $test $temp
			if ($test)
				setVar $BOT~startGameDelay $temp
			end
		elseif ($chosen_option = "7")
			if ($xportToShip)
				setVar $qss[12] "Nothing"
				setvar $BOT~mowToDock FALSE
				setVar $mowToAlpha FALSE
				setVar $mowToRylos FALSE
				setvar $xportToShip false
				setVar $mowToOther FALSE
				setVar $landOnTerra false
				setVar $mowDestination ""
				setvar $do_nothing false
			elseif (($BOT~mowToDock = false) and ($mowToAlpha = false) and ($mowToRylos = false) and ($mowToOther = false) and ($xportToShip = false) and ($landOnTerra = false))
				setVar $qss[12] "Land on Terra"
				setvar $do_nothing true
				setvar $BOT~mowToDock FALSE
				setVar $mowToAlpha false
				setVar $mowToRylos FALSE
				setVar $mowToOther FALSE
				setvar $xportToShip false
				setVar $landOnTerra true
				setVar $mowDestination ""		
			elseif ($landOnTerra)
				setVar $qss[12] "Mow To Custom TA"
				setvar $BOT~mowToDock FALSE
				setVar $mowToAlpha FALSE
				setVar $mowToRylos FALSE
				setVar $mowToOther TRUE
				setvar $xportToShip false
				setVar $landOnTerra false
				setVar $mowDestination ""
				setvar $do_nothing false
			elseif ($mowToOther)
				setVar $qss[12] "Mow to Stardock"
				setvar $BOT~mowToDock TRUE
				setVar $mowToAlpha FALSE
				setVar $mowToRylos FALSE
				setvar $xportToShip false
				setVar $mowToOther FALSE
				setVar $landOnTerra false
				setvar $do_nothing false
				setVar $mowDestination $MAP~stardock
			elseif ($bot~mowToDock)
				setVar $qss[12] "Xport to Ship"
				setvar $xportToShip TRUE
				setVar $mowToAlpha FALSE
				setVar $mowToRylos FALSE
				setVar $mowToOther FALSE
				setVar $landOnTerra false
				setVar $bot~mowToDock  FALSE
				setVar $mowDestination ""
				setvar $do_nothing false
			end
			savevar $xportToShip 
			savevar $mowToAlpha 
			savevar $mowToRylos 
			savevar $mowToOther 
			savevar $bot~mowToDock  
			savevar $landOnTerra
			savevar $do_nothing
		elseif ($chosen_option = "8")
			getInput $temp "Enter a command line for the bot to run after entering game (No bot name needed)"
			setVar $command_to_issue $temp
			savevar $command_to_issue

		elseif ($chosen_option = "Q")
			stop $BOT~LAST_LOADED_MODULE
			halt
		elseif ($chosen_option = "Z")
			:getMowSector
			killalltriggers
			if ($mowToOther)
				getInput $temp "What mow destination do you want to use?"
				isNumber $test $temp
				if ($test)
					if (($temp <= SECTORS) AND ($temp > 0))
						setVar $mowDestination $temp
					else
						goto :getMowSector
					end
				else
					goto :getMowSector
				end
			end
			if ($xportToShip)
				getInput $temp "What ship do you want to xport to?"
				isNumber $test $temp
				if ($test <> true)
					goto :getMowSector
				else
					setVar $mowDestination $temp
				end
			end
			setVar $INTERNAL_COMMANDS~timeToLogBackIn ($BOT~startGameDelay * 60)
			if ($INTERNAL_COMMANDS~timeToLogBackIn > 0)
				killalltriggers
			end
			setTextOutTrigger logearly :endDelayStartGame #32
			while ($INTERNAL_COMMANDS~timeToLogBackIn > 0)
				gosub :INTERNAL_COMMANDS~calcTime
				echo ANSI_10 #27 & "[1A" & #27 & "[K" & $INTERNAL_COMMANDS~hours ":" $INTERNAL_COMMANDS~minutes ":" $INTERNAL_COMMANDS~seconds " left before entering game " GAME " (" GAMENAME ") "&ANSI_15&" ["&ANSI_14&"Spacebar to relog"&ANSI_15&"]*"
				setDelayTrigger timeBeforeRelog :startGameTimer 1000
				pause
				:startGameTimer
					setVar $INTERNAL_COMMANDS~timeToLogBackIn $INTERNAL_COMMANDS~timeToLogBackIn-1
			end
			:endDelayStartGame
			killalltriggers
			if ($BOT~newGameOlder = TRUE)
				setvar $connectivity~newgame false
				load "scripts\mombot\commands\general\relog.cts"
				setEventTrigger		1		:relogended	"SCRIPT STOPPED" "scripts\mombot\commands\general\relog.cts"
				pause
				:relogended
				gosub :connectivity~moving
			elseif ($BOT~newGameDay1 = TRUE)
				setvar $connectivity~newgame true
				gosub :connectivity~enter_new_game
			else
				setvar $connectivity~newgame false
				gosub :connectivity~enter_new_game
			end
			goto :donePreGame
		else
			goto :getStartGameInput
		end
		gosub :pregameStats
		goto :pregameMenu
:donePreGame
	goto :BOT~getInitial_Settings

return
:pregameStats
	gosub :BOT~save_the_variables
return
:menuSpacing
	setArray $qss_var 100
	setVar $qss_ss 0
	setVar $qss_count 1
	setVar $spc " "
	setVar $overall 15
	while ($qss_count <= $qss_total)
		setVar $spc_count 1
		setVar $checkLength $h[$qss_count]&""&$qss[$qss_count]
		setVar $qss_var[$qss_count] ANSI_15&$h[$qss_count]&" "&ANSI_14&$qss[$qss_count]&ANSI_7
		getLength $checkLength $length
		setVar $space 34
		subtract $space $length
		while ($spc_count <= $space)
			mergeText $qss_var[$qss_count] $spc $qss_var[$qss_count]
			add $spc_count 1
		end
		add $qss_count 1
	end
return
# ========================== END PREGAME MENU =========================================
:doSplashScreen
	setDelayTrigger     DRAW_DELAY   :DRAW_DELAY 500
	pause
	pause

	:DRAW_DELAY
			echo ansi_4 "***"
			echo ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196  "*"   
			echo ansi_12
			echo "                                                                                     *"
			echo "                                                                                     *"
			echo " /$$      /$$ /$$                 /$$         /$$$/$$$                               *"
			echo "| $$$    /$$$|__/                | $$        /$$_/_  $$                              *"
			echo "| $$$$  /$$$$ /$$ /$$$$$$$   /$$$$$$$       /$$/   \  $$ /$$    /$$/$$$$$$   /$$$$$$ *"
			echo "| $$ $$/$$ $$| $$| $$__  $$ /$$__  $$      | $$     | $$|  $$  /$$/$$__  $$ /$$__  $$*"
			echo "| $$  $$$| $$| $$| $$  \ $$| $$  | $$      | $$     | $$ \  $$/$$/ $$$$$$$$| $$  \__/*"
			echo "| $$\  $ | $$| $$| $$  | $$| $$  | $$      |  $$    /$$/  \  $$$/| $$_____/| $$      *"
			echo "| $$ \/  | $$| $$| $$  | $$|  $$$$$$$       \  $$$/$$$/    \  $/ |  $$$$$$$| $$      *"
			echo "|__/     |__/|__/|__/  |__/ \_______/        \___/___/      \_/   \_______/|__/      *"
			echo "                                                                                     *"
			echo "                                                                                     *"
			echo "                                                                                     *"
			echo "       /$$      /$$             /$$     /$$                                          *"
			echo "      | $$$    /$$$            | $$    | $$                                          *"
			echo "      | $$$$  /$$$$  /$$$$$$  /$$$$$$ /$$$$$$    /$$$$$$   /$$$$$$                   *"
			echo "      | $$ $$/$$ $$ |____  $$|_  $$_/|_  $$_/   /$$__  $$ /$$__  $$                  *"
			echo "      | $$  $$$| $$  /$$$$$$$  | $$    | $$    | $$$$$$$$| $$  \__/                  *"
			echo "      | $$\  $ | $$ /$$__  $$  | $$ /$$| $$ /$$| $$_____/| $$                        *"
			echo "      | $$ \/  | $$|  $$$$$$$  |  $$$$/|  $$$$/|  $$$$$$$| $$                        *"
			echo "      |__/     |__/ \_______/   \___/   \___/   \_______/|__/                        *"
			echo "                                                                                     *"
			echo "                                                                                     *"
			echo "                                                                                     *"
			echo "                 /$$$$$$$              /$$                                           *"
			echo "                | $$__  $$            | $$                                           *"
			echo "                | $$  \ $$  /$$$$$$  /$$$$$$                                         *"
			echo "                | $$$$$$$  /$$__  $$|_  $$_/                                         *"
			echo "                | $$__  $$| $$  \ $$  | $$                                           *"
			echo "                | $$  \ $$| $$  | $$  | $$ /$$                                       *"
			echo "                | $$$$$$$/|  $$$$$$/  |  $$$$/                                       *"
			echo "                |_______/  \______/    \___/                                         *"
			echo "                                                                                     *"
			echo "[0m*[1;33m       Created by: The Bounty Hunter, Mind Dagger, Lonestar, and Hammer[0m*[1;33m                    Testing by: Misbehavin and DaCreeper*"

			echo "**" & ANSI_14 "       Version: " ANSI_15 $BOT~major_version "." $BOT~minor_version "*"
			echo ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "***"   
			
return





#####========================================== END BOT INTERNAL MENUS SECTION ========================================#####




