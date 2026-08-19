:menus~preferencesmenu
gosub :bot~enter_menu_deaf
gosub :bot~killthetriggers
gosub :bot~load_watcher_variables
gosub :bot~load_the_variables
setarray $menus~h 31
setarray $menus~qss 31
setarray $menus~qss_var 100

:menus~refreshpreferencesmenu
setvar $menus~h[2] "                 "
setvar $menus~h[3] "Bot Name         "
setvar $menus~h[4] "Login Password   "
setvar $menus~h[5] "Bot Password     "
setvar $menus~h[6] "Figs to drop:         "
setvar $menus~h[7] "Limps to drop:        "
setvar $menus~h[8] "Armids to drop:       "
setvar $menus~h[9] "Avoid Planets?        "
setvar $menus~h[10] "Auto Kill Mode?       "
setvar $menus~h[11] "Max Attack:      "
setvar $menus~h[12] "Offensive Odds:  "
setvar $menus~h[13] "Stardock         (S)  "
setvar $menus~h[14] "Rylos            (R)  "
setvar $menus~h[15] "Alpha            (A)  "
setvar $menus~h[16] "Home Sector      (H)  "
setvar $menus~h[17] "Max Fighters:    "
setvar $menus~h[18] "Login Name:      "
setvar $menus~h[19] "Surround type?        "
setvar $menus~h[20] "Turn Limit:      "
setvar $menus~h[21] "Game Letter:     "
setvar $menus~h[22] "Safe Ship:       (X)  "
setvar $menus~h[23] "Banner Interval: "
setvar $menus~h[24] "Alien Ships:     "
setvar $menus~h[25] "Backdoor         (B)  "
setvar $menus~h[26] "Fig Type:             "
setvar $menus~h[27] "Alarm List            "
setvar $menus~h[28] "Surround HKILL?       "
setvar $menus~h[29] "MSL/Busted Prompt"
setvar $menus~h[30] "Silent Mode:     "
setvar $menus~h[31] "Safe Planet:     (L)  "

setvar $menus~qss[2] ""
setvar $menus~qss[3] $switchboard~bot_name
setvar $menus~qss[4] $bot~password
if ($bot~bot_password = 0)
	setvar $bot~bot_password $bot~subspace
	savevar $bot~bot_password
end
setvar $menus~qss[5] $bot~bot_password
setvar $menus~qss[6] $player~surroundfigs
setvar $menus~qss[7] $player~surroundlimp
setvar $menus~qss[8] $player~surroundmine
if ($player~surroundavoidshieldedonly)
	setvar $menus~qss[9] "Shielded"
elseif ($player~surroundavoidallplanets)
	setvar $menus~qss[9] "All"
else
	setvar $menus~qss[9] "None"
end
if ($bot~autoattack)
	setvar $menus~qss[10] "Yes"
else
	setvar $menus~qss[10] "No"
end
setvar $menus~qss[11] $ship~ship_max_attack
setvar $menus~qss[12] $ship~ship_offensive_odds
if ($map~stardock > 0)
	setvar $menus~qss[13] $map~stardock
else
	setvar $menus~qss[13] "Not Defined"
end
if ($map~backdoor > 0)
	setvar $menus~qss[25] $map~backdoor
else
	setvar $menus~qss[25] "Not Defined"
end
if ($map~rylos > 0)
	setvar $menus~qss[14] $map~rylos
else
	setvar $menus~qss[14] "Not Defined"
end
if ($map~alpha_centauri > 0)
	setvar $menus~qss[15] $map~alpha_centauri
else
	setvar $menus~qss[15] "Not Defined"
end
if ($map~home_sector > 0)
	setvar $menus~qss[16] $map~home_sector
else
	setvar $menus~qss[16] "Not Defined"
end
setvar $menus~qss[17] $ship~ship_fighters_max
setvar $menus~qss[18] $bot~username
if ($player~surroundoverwrite)
	setvar $menus~qss[19] "All Sectors"
elseif ($player~surroundpassive)
	setvar $menus~qss[19] "Passive"
else
	setvar $menus~qss[19] "Normal"
end
if ($player~unlimitedgame)
	setvar $menus~qss[20] "Unlimited"
else
	setvar $menus~qss[20] $bot~bot_turn_limit
end
setvar $menus~qss[21] $bot~letter
if ($bot~safe_ship > 0)
	setvar $menus~qss[22] $bot~safe_ship
else
	setvar $menus~qss[22] "Not Defined"
end
setvar $menus~qss[23] $bot~echointerval&" Minutes"
if ($player~dropoffensive)
	setvar $menus~qss[26] "Offensive"
elseif ($player~droptoll)
	setvar $menus~qss[26] "Toll"
else
	setvar $menus~qss[26] "Defensive"
end
if ($player~defendercapping)
	setvar $menus~qss[24] "Using defense"
elseif ($player~offensecapping)
	setvar $menus~qss[24] "Using offense"
else
	setvar $menus~qss[24] "Don't attack"
end
if ($player~surround_before_hkill)
	setvar $menus~qss[28] "Yes"
else
	setvar $menus~qss[28] "No"
end
if (($bot~alarm_list <> "") and ($bot~alarm_list <> 0))
	setvar $menus~qss[27] "Active"
else
	setvar $menus~qss[27] "None"
	setvar $bot~alarm_list ""
end

if ($bot~command_prompt_extras)
	setvar $menus~qss[29] "Yes"
else
	setvar $menus~qss[29] "No"
end
if ($bot~silent_running)
	setvar $menus~qss[30] "Yes"
else
	setvar $menus~qss[30] "No"
end
if ($bot~safe_planet > 0)
	setvar $menus~qss[31] $bot~safe_planet
else
	setvar $menus~qss[31] "Not Defined"
end
setvar $menus~qss_total 31
gosub :menuspacing
echo #27&"[2J"
echo "**"
echo ansi_11&"         General Info                     Gridding/Attack Options*"
echo ansi_10&#27&"[35m<"&#27&"[32mC"&#27&"[35m> "&ansi_7&$menus~qss_var[18]&ansi_10&#27&"[35m<"&#27&"[32m3"&#27&"[35m> "&ansi_7&$menus~qss_var[6]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32mP"&#27&"[35m> "&ansi_7&$menus~qss_var[4]&ansi_10&#27&"[35m<"&#27&"[32m4"&#27&"[35m> "&ansi_7&$menus~qss_var[7]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32mN"&#27&"[35m> "&ansi_7&$menus~qss_var[3]&ansi_10&#27&"[35m<"&#27&"[32m5"&#27&"[35m> "&ansi_7&$menus~qss_var[8]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32mZ"&#27&"[35m> "&ansi_7&$menus~qss_var[5]&ansi_10&#27&"[35m<"&#27&"[32m6"&#27&"[35m> "&ansi_7&$menus~qss_var[26]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32mG"&#27&"[35m> "&ansi_7&$menus~qss_var[21]&ansi_10&#27&"[35m<"&#27&"[32m7"&#27&"[35m> "&ansi_7&$menus~qss_var[10]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32mE"&#27&"[35m> "&ansi_7&$menus~qss_var[23]&ansi_10&#27&"[35m<"&#27&"[32m8"&#27&"[35m> "&ansi_7&$menus~qss_var[9]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32m1"&#27&"[35m> "&ansi_7&$menus~qss_var[20]&ansi_10&#27&"[35m<"&#27&"[32m9"&#27&"[35m> "&ansi_7&$menus~qss_var[19]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32m0"&#27&"[35m> "&ansi_7&$menus~qss_var[29]&ansi_10&#27&"[35m<"&#27&"[32mK"&#27&"[35m> "&ansi_7&$menus~qss_var[28]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32mV"&#27&"[35m> "&ansi_7&$menus~qss_var[30]&ansi_10&#27&"[35m<"&#27&"[32mJ"&#27&"[35m> "&ansi_7&$menus~qss_var[27]&"*"
echo ansi_11&"         Capture Options                   Location Variables*"
echo ansi_10&#27&"[35m<"&#27&"[32m2"&#27&"[35m> "&ansi_7&$menus~qss_var[24]&ansi_10&#27&"[35m<"&#27&"[32mS"&#27&"[35m> "&ansi_7&$menus~qss_var[13]&"*"
echo ansi_11&"        Current Ship Stats             "&#27&"[35m<"&#27&"[32mB"&#27&"[35m> "&ansi_7&$menus~qss_var[25]&"*"
echo ansi_10&"  "&ansi_7&$menus~qss_var[12]&ansi_10&"  "&#27&"[35m<"&#27&"[32mR"&#27&"[35m> "&ansi_7&$menus~qss_var[14]&"*"
echo ansi_10&"  "&ansi_7&$menus~qss_var[11]&ansi_10&"  "&ansi_10&""&#27&"[35m<"&#27&"[32mA"&#27&"[35m> "&ansi_7&$menus~qss_var[15]&"*"
echo ansi_10&"  "&ansi_7&$menus~qss_var[17]&ansi_10&"  "&#27&"[35m<"&#27&"[32mH"&#27&"[35m> "&ansi_7&$menus~qss_var[16]&"*"
echo ansi_10&"  "&ansi_7&$menus~qss_var[2]&ansi_10&"  "&#27&"[35m<"&#27&"[32mX"&#27&"[35m> "&ansi_7&$menus~qss_var[22]&"*"
echo ansi_10&"  "&ansi_7&$menus~qss_var[2]&ansi_10&"  "&#27&"[35m<"&#27&"[32mL"&#27&"[35m> "&ansi_7&$menus~qss_var[31]&"*"
echo "*"
echo ansi_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ansi_15&"Trader List                    Game Stats"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ansi_7&"**"
getconsoleinput $menus~chosen_option singlekey
uppercase $menus~chosen_option

:menus~process_command
if ($menus~chosen_option = "?")
	goto :refreshpreferencesmenu
elseif ($menus~chosen_option = "+")
	goto :chatmenu
elseif ($menus~chosen_option = "N")

	setvar $menus~question ansi_13&"What is the 'in game' name of the bot? (one word, no spaces)"&ansi_7
	gosub :getinput
	setvar $menus~new_bot_name $menus~response

	striptext $menus~new_bot_name "^"
	striptext $menus~new_bot_name " "
	lowercase $menus~new_bot_name
	if ($menus~new_bot_name = "")
		goto :refreshpreferencesmenu
	end
	delete $bot~gconfig_file
	write $bot~gconfig_file $menus~new_bot_name
	setvar $switchboard~bot_name $menus~new_bot_name
	savevar $switchboard~bot_name
	setvar $bot~bot_name $menus~new_bot_name
	savevar $bot~bot_name

elseif ($menus~chosen_option = "P")
	setvar $menus~question "Please Enter your Game Password"
	gosub :getinput
	setvar $bot~password $menus~response
elseif ($menus~chosen_option = "Z")
	setvar $menus~question "Please Enter your Bot Password"
	gosub :getinput
	setvar $bot~bot_password $menus~response
elseif ($menus~chosen_option = "G")
	setvar $menus~question "Please Enter your Game Letter"
	gosub :getinput
	setvar $bot~letter $menus~response
elseif ($menus~chosen_option = "C")
	setvar $menus~question "Please Enter your Login Name"
	gosub :getinput
	setvar $bot~username $menus~response
elseif ($menus~chosen_option = 1)
	if ($player~unlimitedgame = false)
		setvar $menus~question "What are the minimum turns you need to do bot commands?"
		gosub :getinput
		setvar $menus~temp $menus~response
		isnumber $menus~test $menus~temp
		if ($menus~test)
			if (($menus~temp <= 65000) and ($menus~temp >= 0))
				setvar $bot~bot_turn_limit $menus~temp
			end
		end
	end
elseif ($menus~chosen_option = 3)
	setvar $menus~question "How many fighters to drop on surround/gridding?"
	gosub :getinput
	setvar $menus~temp $menus~response
	isnumber $menus~test $menus~temp
	if ($menus~test)
		if (($menus~temp <= 50000) and ($menus~temp >= 0))
			setvar $player~surroundfigs $menus~temp
		end
	end
elseif ($menus~chosen_option = 4)
	setvar $menus~question "How many limpets to drop on surround/gridding?"
	gosub :getinput
	setvar $menus~temp $menus~response
	isnumber $menus~test $menus~temp
	if ($menus~test)
		if (($menus~temp <= 250) and ($menus~temp >= 0))
			setvar $player~surroundlimp $menus~temp
		end
	end
elseif ($menus~chosen_option = 5)
	setvar $menus~question "How many armid mines to drop on surround/gridding?"
	gosub :getinput
	setvar $menus~temp $menus~response
	isnumber $menus~test $menus~temp
	if ($menus~test)
		if (($menus~temp <= 250) and ($menus~temp >= 0))
			setvar $player~surroundmine $menus~temp
		end
	end
elseif ($menus~chosen_option = 8)
	if ($player~surroundavoidshieldedonly)
		setvar $player~surroundavoidshieldedonly false
		setvar $player~surroundavoidallplanets true
		setvar $player~surrounddontavoid false
	elseif ($player~surroundavoidallplanets)
		setvar $player~surroundavoidshieldedonly false
		setvar $player~surroundavoidallplanets false
		setvar $player~surrounddontavoid true
	else
		setvar $player~surroundavoidshieldedonly true
		setvar $player~surroundavoidallplanets false
		setvar $player~surrounddontavoid false
	end
elseif ($menus~chosen_option = 7)
	if ($bot~autoattack)
		setvar $bot~autoattack false
	else
		setvar $bot~autoattack true
	end
elseif ($menus~chosen_option = 2)
	if ($player~defendercapping)
		setvar $player~defendercapping false
		setvar $player~offensecapping true
		setvar $player~cappingaliens true
	elseif ($player~offensecapping)
		setvar $player~defendercapping false
		setvar $player~offensecapping false
		setvar $player~cappingaliens false
	else
		setvar $player~defendercapping true
		setvar $player~offensecapping false
		setvar $player~cappingaliens true
	end
elseif ($menus~chosen_option = 6)
	if ($player~dropoffensive)
		setvar $player~dropoffensive false
		setvar $player~droptoll true
	elseif ($player~droptoll)
		setvar $player~dropoffensive false
		setvar $player~droptoll false
	else
		setvar $player~dropoffensive true
		setvar $player~droptoll false
	end
elseif ($menus~chosen_option = 0)
	if ($bot~command_prompt_extras)
		setvar $bot~command_prompt_extras false
	else
		setvar $bot~command_prompt_extras true
	end
elseif ($menus~chosen_option = "V")
	if ($bot~silent_running)
		setvar $bot~silent_running false
		savevar $bot~silent_running
		setvar $silent_running false
		savevar $silent_running
	else
		setvar $bot~silent_running true
		savevar $bot~silent_running
		setvar $silent_running true
		savevar $silent_running
	end
elseif ($menus~chosen_option = "K")
	if ($player~surround_before_hkill)
		setvar $player~surround_before_hkill false
	else
		setvar $player~surround_before_hkill true
	end
elseif ($menus~chosen_option = "S")
	setvar $menus~question "What sector is the Stardock? (0 to set to twx variable)"
	gosub :getinput
	setvar $menus~temp $menus~response
	isnumber $menus~test $menus~temp
	if ($menus~test)
		if (($menus~temp <= sectors) and ($menus~temp >= 1))
			setvar $map~stardock $menus~temp
			setvar $map~stardock $menus~temp
		elseif ($menus~temp = 0)
			setvar $map~stardock stardock
			setvar $map~stardock stardock
		end
	end
elseif ($menus~chosen_option = "J")
	setvar $menus~question "Please enter name of traders, seperated by commas.  Can also use [2],[1] for Corporations."
	gosub :getinput
	setvar $menus~temp $menus~response
	setvar $bot~alarm_list $menus~temp
	savevar $bot~alarm_list
elseif ($menus~chosen_option = "X")
	setvar $menus~question "What ship number is your safe ship?"
	gosub :getinput
	setvar $menus~temp $menus~response
	isnumber $menus~test $menus~temp
	if ($menus~test)
		setvar $bot~safe_ship $menus~temp
	end
elseif ($menus~chosen_option = "L")
	setvar $menus~question "What planet is your safe planet?"
	gosub :getinput
	setvar $menus~temp $menus~response
	isnumber $menus~test $menus~temp
	if ($menus~test)
		setvar $bot~safe_planet $menus~temp
	end
elseif ($menus~chosen_option = "E")
	setvar $menus~temp 5760
	setvar $menus~question "How many minutes afk do you want the echo banner to show each time?"
	gosub :getinput
	setvar $menus~temp $menus~response
	isnumber $menus~test $menus~temp
	if ($menus~test)
		if ($menus~temp > 0)
			setvar $bot~echointerval $menus~temp
		else
			setvar $bot~echointerval 5760
		end
	end
elseif ($menus~chosen_option = "R")
	setvar $menus~question "What sector is the Rylos port? (0 to set to twx variable)"
	gosub :getinput
	setvar $menus~temp $menus~response
	isnumber $menus~test $menus~temp
	if ($menus~test)
		if (($menus~temp <= sectors) and ($menus~temp >= 1))
			setvar $map~rylos $menus~temp
		elseif ($menus~temp = 0)
			setvar $map~rylos rylos
		end
		savevar $map~rylos
	end
elseif ($menus~chosen_option = "A")
	setvar $menus~question "What sector is the Alpha Centauri port? (0 to set to twx variable)"
	gosub :getinput
	setvar $menus~temp $menus~response
	isnumber $menus~test $menus~temp
	if ($menus~test)
		if (($menus~temp <= sectors) and ($menus~temp >= 1))
			setvar $map~alpha_centauri $menus~temp
		elseif ($menus~temp = 0)
			setvar $map~alpha_centauri alphacentauri
		end
		savevar $map~alpha_centauri
	end
elseif ($menus~chosen_option = "B")
	setvar $menus~question "What sector is the Backdoor to Stardock?"
	gosub :getinput
	setvar $menus~temp $menus~response
	isnumber $menus~test $menus~temp
	if ($menus~test)
		if (($menus~temp <= sectors) and ($menus~temp >= 1))
			setvar $map~backdoor $menus~temp
		end
		savevar $map~backdoor
	end
elseif ($menus~chosen_option = "H")
	setvar $menus~question "What sector is the Home Sector?"
	gosub :getinput
	setvar $menus~temp $menus~response
	isnumber $menus~test $menus~temp
	if ($menus~test)
		if (($menus~temp <= sectors) and ($menus~temp >= 1))
			setvar $map~home_sector $menus~temp
			savevar $map~home_sector
		end
	end
elseif ($menus~chosen_option = 9)
	if ($player~surroundoverwrite)
		setvar $player~surroundoverwrite false
		setvar $player~surroundpassive true
		setvar $player~surroundnormal false
	elseif ($player~surroundpassive)
		setvar $player~surroundoverwrite false
		setvar $player~surroundpassive false
		setvar $player~surroundnormal true
	else
		setvar $player~surroundoverwrite true
		setvar $player~surroundpassive false
		setvar $player~surroundnormal false
	end
elseif ($menus~chosen_option = ">")
	goto :preferencesmenupage2
elseif ($menus~chosen_option = "<")
	goto :preferencesmenupage6
else
	gosub :doneprefer
end
goto :refreshpreferencesmenu

:menus~doneprefer
gosub :bot~exit_menu_deaf
echo "*Saving preferences..*"
gosub :bot~save_the_variables

echo #27 "[30D                        " #27 "[30D"
echo currentansiline
goto :bot~wait_for_command
return

:menus~preferencesmenupage2
gosub :bot~killthetriggers
setarray $menus~h 34
setarray $menus~qss 34
setvar $menus~h[1] "Atomic Detonators      "
setvar $menus~h[2] "Marker Beacons         "
setvar $menus~h[3] "Corbomite Devices      "
setvar $menus~h[4] "Cloaking Devices       "
setvar $menus~h[5] "SubSpace Ether Probes  "
setvar $menus~h[6] "Planet Scanners        "
setvar $menus~h[7] "Limpet Tracking Mines  "
setvar $menus~h[8] "Space Mines            "
setvar $menus~h[9] "Photon Missiles        "
setvar $menus~h[10] "Holographic Scan       "
setvar $menus~h[11] "Density Scan           "
setvar $menus~h[12] "Mine Disruptors        "
setvar $menus~h[13] "Genesis Torpedoes      "
setvar $menus~h[14] "TransWarp I            "
setvar $menus~h[15] "TransWarp II           "
setvar $menus~h[16] "Psychic Probes         "
setvar $menus~h[17] "Limpet Removal         "
setvar $menus~h[18] "Server Max Commands    "
setvar $menus~h[19] "Gold Enabled           "
setvar $menus~h[20] "MBBS Mode              "
setvar $menus~h[21] "Multiple Photons?      "
setvar $menus~h[22] "                       "
setvar $menus~h[23] "Colonists Per Day      "
setvar $menus~h[24] "Planet Trade           "
setvar $menus~h[25] "Steal Factor           "
setvar $menus~h[26] "Rob Factor             "
setvar $menus~h[27] "Days To Bust Clear     "
setvar $menus~h[28] "                       "
setvar $menus~h[29] "Port Maximum           "
setvar $menus~h[30] "Port Production Rate   "
setvar $menus~h[31] "Max Port Regen Per Day "
setvar $menus~h[32] "                       "
setvar $menus~h[33] "Nav Haz Loss Per Day   "
setvar $menus~h[34] "Radiation Lifetime     "
setvar $menus~qss[1] $game~atomic_cost
setvar $menus~qss[2] $game~beacon_cost
setvar $menus~qss[3] $game~corbo_cost
setvar $menus~qss[4] $game~cloak_cost
setvar $menus~qss[5] $game~probe_cost
setvar $menus~qss[6] $game~planet_scanner_cost
setvar $menus~qss[7] $game~planet_scanner_cost
setvar $menus~qss[8] $game~armid_cost
if ($game~photons_enabled)
	setvar $menus~qss[9] $game~photon_cost
else
	setvar $menus~qss[9] "Disabled"
end
setvar $menus~qss[10] $game~holo_cost
setvar $menus~qss[11] $game~density_cost
setvar $menus~qss[12] $game~disruptor_cost
setvar $menus~qss[13] $game~genesis_cost
setvar $menus~qss[14] $game~twarpi_cost
setvar $menus~qss[15] $game~twarpii_cost
setvar $menus~qss[16] $game~psychic_cost
setvar $menus~qss[17] $game~limpet_removal_cost
if ($game~max_commands = 0)
	setvar $menus~qss[18] "Unlimited"
else
	setvar $menus~qss[18] $game~max_commands
end
if ($game~goldenabled)
	setvar $menus~qss[19] "Yes"
else
	setvar $menus~qss[19] "No"
end
if ($game~mbbs)
	setvar $menus~qss[20] "Yes"
else
	setvar $menus~qss[20] "No"
end
if ($game~photons_enabled = true)
	if ($game~multiple_photons = true)
		setvar $menus~qss[21] "Yes"
	else
		setvar $menus~qss[21] "No"
	end
else
	setvar $menus~qss[21] "Disabled"
end
setvar $menus~qss[22] ""
setvar $menus~qss[23] $game~colonist_regen
setvar $menus~qss[24] $game~ptradesetting&"%"
setvar $menus~qss[25] $game~steal_factor
setvar $menus~qss[26] $game~rob_factor
setvar $menus~qss[27] $game~clear_bust_days
setvar $menus~qss[28] ""
setvar $menus~qss[29] $game~port_max
setvar $menus~qss[30] $game~production_rate&"%"
setvar $menus~qss[31] $game~production_regen&"%"
setvar $menus~qss[32] ""
setvar $menus~qss[33] $game~debris_loss&"%"
setvar $menus~qss[34] $game~radiation_lifetime
setvar $menus~qss_total 34
gosub :menuspacing
echo #27&"[2J"
echo "**"
echo ansi_11&"      Stardock Prices                 Game Statistics*"
echo ansi_10&" "&ansi_7&$menus~qss_var[1]&ansi_10&""&ansi_7&$menus~qss_var[18]&"*"
echo ansi_10&" "&ansi_7&$menus~qss_var[2]&ansi_10&""&ansi_7&$menus~qss_var[19]&"*"
echo ansi_10&" "&ansi_7&$menus~qss_var[3]&ansi_10&""&ansi_7&$menus~qss_var[20]&"*"
echo ansi_10&" "&ansi_7&$menus~qss_var[4]&ansi_10&""&ansi_7&$menus~qss_var[21]&"*"
echo ansi_10&" "&ansi_7&$menus~qss_var[5]&ansi_10&""&ansi_7&$menus~qss_var[22]&"*"
echo ansi_10&" "&ansi_7&$menus~qss_var[6]&ansi_10&""&ansi_7&$menus~qss_var[23]&"*"
echo ansi_10&" "&ansi_7&$menus~qss_var[7]&ansi_10&""&ansi_7&$menus~qss_var[24]&"*"
echo ansi_11&" "&ansi_7&$menus~qss_var[8]&ansi_10&""&ansi_7&$menus~qss_var[25]&"*"
echo ansi_10&" "&ansi_7&$menus~qss_var[9]&ansi_10&""&ansi_7&$menus~qss_var[26]&"*"
echo ansi_10&" "&ansi_7&$menus~qss_var[10]&ansi_10&""&ansi_7&$menus~qss_var[27]&"*"
echo ansi_10&" "&ansi_7&$menus~qss_var[11]&ansi_10&""&ansi_7&$menus~qss_var[28]&"*"
echo ansi_10&" "&ansi_7&$menus~qss_var[12]&ansi_10&""&ansi_7&$menus~qss_var[29]&"*"
echo ansi_10&" "&ansi_7&$menus~qss_var[13]&ansi_10&""&ansi_7&$menus~qss_var[30]&"*"
echo ansi_10&" "&ansi_7&$menus~qss_var[14]&ansi_10&""&ansi_7&$menus~qss_var[31]&"*"
echo ansi_10&" "&ansi_7&$menus~qss_var[15]&ansi_10&""&ansi_7&$menus~qss_var[32]&"*"
echo ansi_10&" "&ansi_7&$menus~qss_var[16]&ansi_10&""&ansi_7&$menus~qss_var[33]&"*"
echo ansi_10&" "&ansi_7&$menus~qss_var[17]&ansi_10&""&ansi_7&$menus~qss_var[34]&"*"
echo "*"
echo ansi_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ansi_15&"Preferences                Hot Keys"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ansi_7&"**"
getconsoleinput $menus~chosen_option singlekey
uppercase $menus~chosen_option
gosub :bot~killthetriggers
uppercase $menus~chosen_option

:menus~process_commandpage2
if ($menus~chosen_option = "?")
	goto :preferencesmenupage2
elseif ($menus~chosen_option = ">")
	goto :preferencesmenupage3
elseif ($menus~chosen_option = "<")
	goto :refreshpreferencesmenu
else
	gosub :doneprefer
end

:menus~preferencesmenupage3
gosub :bot~killthetriggers
echo #27&"[2J"
echo "**"
echo ansi_11&"                  Custom Hotkey Definitions           *"
gosub :echohotkeys
echo "*"
echo ansi_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ansi_15&"Game Stats                    Ship Info"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ansi_7&"**"
setvar $menus~options "1234567890ABCDEFGHIJKLMNOPRSTUVWX\t "
getconsoleinput $menus~chosen_option singlekey
uppercase $menus~chosen_option
getwordpos $menus~options $menus~pos $menus~chosen_option
gosub :bot~killthetriggers

:menus~process_commandpage3
if ($menus~chosen_option = "?")
	goto :preferencesmenupage3
elseif ($menus~chosen_option = ">")
	goto :preferencesmenupage4
elseif ($menus~chosen_option = "<")
	goto :preferencesmenupage2
elseif ($menus~pos > 0)
	setdeafclients false
	echo "*What should this hotkey be set to?*"
	getconsoleinput $menus~temp singlekey
	setdeafclients true
	lowercase $menus~temp
	getcharcode $menus~temp $menus~lower
	uppercase $menus~temp
	getcharcode $menus~temp $menus~upper
	setvar $menus~key $bot~custom_keys[$menus~pos]
	uppercase $menus~key
	getcharcode $menus~key $menus~old_upper
	lowercase $menus~key
	getcharcode $menus~key $menus~old_lower
	if ((((($bot~hotkeys[$menus~upper] = 0) or ($bot~hotkeys[$menus~upper] = "")) and (($bot~hotkeys[$menus~lower] = 0) or ($bot~hotkeys[$menus~lower] = "")))) and (((($menus~lower < 48) or ($menus~lower > 57)) and ($menus~temp <> "?"))))
		setvar $bot~hotkeys[$menus~old_upper] ""
		setvar $bot~hotkeys[$menus~old_lower] ""
		setvar $bot~hotkeys[$menus~upper] $menus~pos
		setvar $bot~hotkeys[$menus~lower] $menus~pos
		setvar $bot~custom_keys[$menus~pos] $menus~temp
		if ($menus~pos > 17)
			setvar $menus~question "What is the bot command to connect to this hotkey?"
			gosub :getinput
			setvar $menus~temp $menus~response
			setvar $bot~custom_commands[$menus~pos] $menus~temp
		end
		gosub :bot~write_hotkey_config
	else
		setdeafclients false
		echo ansi_4 "*Hot key already bound to another function.**" ansi_7
		setdeafclients true
		setdelaytrigger warningdelay :preferencesmenupage3 1000
		pause
	end
	goto :preferencesmenupage3
else
	gosub :doneprefer
end

:menus~preferencesmenupage4
gosub :bot~killthetriggers
setvar $menus~i 1
if ($ship~shipcounter > 10)
	setvar $menus~pagesexist true
else
	setvar $menus~pagesexist false
end

:menus~nextshippage
gosub :ship~loadshipinfo
setvar $menus~shipschanged false
setvar $menus~thispage $menus~i
setvar $menus~menucount 0
echo #27&"[2J"
echo "**"
echo ansi_11&"                      Known Ship Information           **"
echo ansi_15 "    Type                      Def  Off  TPW  D-Bonus?   Shields   Fighters *"
echo "   " #27 "[1m" ansi_4 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
while (($menus~i < $ship~shipcounter) and ($menus~menucount < 10))
	cuttext $ship~shiplist[$menus~i]&"                                    " $menus~temp 1 25
	cuttext $ship~shiplist[$menus~i][2]&"  " $menus~tempdefhead 1 1
	cuttext $ship~shiplist[$menus~i][2]&"  " $menus~tempdeftail 2 1
	cuttext $ship~shiplist[$menus~i][3]&"  " $menus~tempoffhead 1 1
	cuttext $ship~shiplist[$menus~i][3]&"  " $menus~tempofftail 2 1
	if ($ship~shiplist[$menus~i][8])
		setvar $menus~tempdefender ansi_12&"Yes"&ansi_14
	else
		setvar $menus~tempdefender "No "
	end
	cuttext $ship~shiplist[$menus~i][1]&"              " $menus~tempshields 1 10
	cuttext $ship~shiplist[$menus~i][5]&"              " $menus~tempfighters 1 6
	cuttext $ship~shiplist[$menus~i][7]&"              " $menus~temptpw 1 3
	echo ansi_14 "<" $menus~menucount "> " $menus~temp " " $menus~tempdefhead "." $menus~tempdeftail "  " $menus~tempoffhead "." $menus~tempofftail "   " $menus~temptpw "   " $menus~tempdefender "       " $menus~tempshields " " $menus~tempfighters "*"
	add $menus~i 1
	add $menus~menucount 1
end
echo "   " #27 "[1m" ansi_4 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
echo "*"
if ($menus~pagesexist = true)
	echo "  "&ansi_5&"<"&ansi_6&"+"&ansi_5&">"&ansi_6&" More Ships*"
end
echo "*"
echo ansi_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ansi_15&"Hot Keys                 Planet Types"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ansi_7&"**"

echo "  "&ansi_5&"Toggle defender status (0-9)? "
getconsoleinput $menus~selection singlekey
setvar $menus~options 1234567890
uppercase $menus~selection
getwordpos $menus~options $menus~pos $menus~selection
gosub :bot~killthetriggers
if ($menus~selection = "<")
	gosub :rewrite_cap_file
	goto :preferencesmenupage3
elseif ($menus~selection = ">")
	gosub :rewrite_cap_file
	goto :preferencesmenupageplanet
elseif ($menus~selection = "?")
	gosub :rewrite_cap_file
	goto :preferencesmenupage4
elseif ($menus~pagesexist and ($menus~selection = "+"))
	if ($menus~i >= $ship~shipcounter)
		setvar $menus~i 1
	end
	goto :nextshippage
elseif ($menus~pos > 0)
	if ($ship~shiplist[($menus~selection + $menus~thispage)][8])
		setvar $ship~shiplist[($menus~selection + $menus~thispage)][8] false
	else
		setvar $ship~shiplist[($menus~selection + $menus~thispage)][8] true
	end
	setvar $menus~i $menus~thispage
	setvar $menus~shipschanged true
	gosub :rewrite_cap_file
	goto :nextshippage
else
	gosub :rewrite_cap_file
	gosub :doneprefer
end

:menus~preferencesmenupageplanet
gosub :bot~killthetriggers
setvar $menus~i 1
setvar $menus~planetschanged false
if ($planet~planetcounter > 10)
	setvar $menus~pagesexist true
else
	setvar $menus~pagesexist false
end

:menus~nextplanetinfopage
setvar $menus~thispage $menus~i
setvar $menus~menucount 0
echo #27&"[2J"
echo "**"
echo ansi_11&"            Planet Type Information  (Max Colos Per Product Type)         **"
echo ansi_15 "    Type                       Min Fuel  Max Fuel  Min Org  Max Org  Min Equ  Max Equ  Keeper? *"
echo "   " #27 "[1m" ansi_4 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
while (($menus~i <= $planet~planetcounter) and ($menus~menucount < 10))
	cuttext $planet~planetlist[$menus~i]&"                                    " $menus~temp 8 28
	cuttext $planet~planetlist[$menus~i][1]&"                                 " $menus~tempfuelmin 1 8
	cuttext $planet~planetlist[$menus~i][2]&"                                 " $menus~tempfuel 1 8
	cuttext $planet~planetlist[$menus~i][3]&"                                 " $menus~temporgmin 1 8
	cuttext $planet~planetlist[$menus~i][4]&"                                 " $menus~temporg 1 8
	cuttext $planet~planetlist[$menus~i][5]&"                                 " $menus~tempequipmin 1 8
	cuttext $planet~planetlist[$menus~i][6]&"                                 " $menus~tempequip 1 8
	if ($planet~planetlist[$menus~i][7] = true)
		setvar $menus~tempkeeper "Yes"
	else
		setvar $menus~tempkeeper "No"
	end
	echo ansi_14 "<" $menus~menucount ">" $menus~temp " " $menus~tempfuelmin " " $menus~tempfuel "  " $menus~temporgmin "  " $menus~temporg "  " $menus~tempequipmin "  " $menus~tempequip " " $menus~tempkeeper "*"
	add $menus~i 1
	add $menus~menucount 1
end
echo "   " #27 "[1m" ansi_4 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
echo "*"
if ($menus~pagesexist = true)
	echo "  "&ansi_5&"<"&ansi_6&"+"&ansi_5&">"&ansi_6&" More Planets*"
end
echo "*"
echo ansi_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ansi_15&"Hot Keys                 Planet List"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ansi_7&"**"
if ($menus~toggleagain = true)
	goto :toggleagain
end

echo "  "&ansi_5&"Update Planet Info (0-9)?   Toggle (k)eeper planet"
getconsoleinput $menus~selection singlekey
setvar $menus~options 1234567890
uppercase $menus~selection
getwordpos $menus~options $menus~pos $menus~selection
gosub :bot~killthetriggers
if ($menus~selection = "<")
	gosub :rewrite_planet_file
	goto :preferencesmenupage4
elseif ($menus~selection = ">")
	gosub :rewrite_planet_file
	goto :preferencesmenupage5
elseif ($menus~selection = "?")
	gosub :rewrite_planet_file
	goto :preferencesmenupageplanet
elseif ($menus~selection = "K")

	:menus~toggleagain
	echo "  "&ansi_5&"Which planet to set keeper status? (0-9)"
	getconsoleinput $menus~planet singlekey
	setvar $menus~options 1234567890
	uppercase $menus~planet
	getwordpos $menus~options $menus~pos $menus~planet
	setvar $menus~toggleagain false
	if ($menus~pos > 0)
		if ($planet~planetlist[($menus~planet + $menus~thispage)][7] = true)
			setvar $planet~planetlist[($menus~planet + $menus~thispage)][7] false
		else
			setvar $planet~planetlist[($menus~planet + $menus~thispage)][7] true
		end
		setvar $menus~toggleagain true
	else
		gosub :rewrite_planet_file
	end
	setvar $menus~i $menus~thispage
	setvar $menus~planetschanged true
	gosub :rewrite_planet_file
	goto :preferencesmenupageplanet
elseif ($menus~pagesexist and ($menus~selection = "+"))
	if ($menus~i >= $planet~planetcounter)
		setvar $menus~i 1
	end
	goto :nextplanetinfopage
elseif ($menus~pos > 0)
	setvar $menus~question "What are the min fuel colos for "&$planet~planetlist[($menus~selection + $menus~thispage)]&"?"
	gosub :getinput
	setvar $menus~temp $menus~response
	isnumber $menus~test $menus~temp
	if ($menus~test = false)
		goto :preferencesmenupageplanet
	end
	setvar $planet~planetlist[($menus~selection + $menus~thispage)][1] $menus~temp

	setvar $menus~question "What are the max fuel colos for "&$planet~planetlist[($menus~selection + $menus~thispage)]&"?"
	gosub :getinput
	setvar $menus~temp $menus~response
	isnumber $menus~test $menus~temp
	if ($menus~test = false)
		goto :preferencesmenupageplanet
	end
	setvar $planet~planetlist[($menus~selection + $menus~thispage)][2] $menus~temp

	setvar $menus~question "What are the min organics colos for "&$planet~planetlist[($menus~selection + $menus~thispage)]&"?"
	gosub :getinput
	setvar $menus~temp $menus~response
	isnumber $menus~test $menus~temp
	if ($menus~test = false)
		goto :preferencesmenupageplanet
	end
	setvar $planet~planetlist[($menus~selection + $menus~thispage)][3] $menus~temp

	setvar $menus~question "What are the max organics colos for "&$planet~planetlist[($menus~selection + $menus~thispage)]&"?"
	gosub :getinput
	setvar $menus~temp $menus~response
	isnumber $menus~test $menus~temp
	if ($menus~test = false)
		goto :preferencesmenupageplanet
	end
	setvar $planet~planetlist[($menus~selection + $menus~thispage)][4] $menus~temp

	setvar $menus~question "What are the min equipment colos for "&$planet~planetlist[($menus~selection + $menus~thispage)]&"?"
	gosub :getinput
	setvar $menus~temp $menus~response
	isnumber $menus~test $menus~temp
	if ($menus~test = false)
		goto :preferencesmenupageplanet
	end
	setvar $planet~planetlist[($menus~selection + $menus~thispage)][5] $menus~temp

	setvar $menus~question "What are the max equipment colos for "&$planet~planetlist[($menus~selection + $menus~thispage)]&"?"
	gosub :getinput
	setvar $menus~temp $menus~response
	isnumber $menus~test $menus~temp
	if ($menus~test = false)
		goto :preferencesmenupageplanet
	end
	setvar $planet~planetlist[($menus~selection + $menus~thispage)][6] $menus~temp

	setdeafclients false
	echo "Is this planet a keeper? (y/n)*"
	getconsoleinput $menus~keeperselection singlekey
	setdeafclients true
	uppercase $menus~keeperselection
	if ($menus~keeperselection = "Y")
		setvar $planet~planetlist[($menus~selection + $menus~thispage)][7] true
	else
		setvar $planet~planetlist[($menus~selection + $menus~thispage)][7] false
	end
	setvar $menus~i $menus~thispage
	setvar $menus~planetschanged true
	gosub :rewrite_planet_file
	goto :preferencesmenupageplanet
else
	gosub :rewrite_planet_file
	gosub :doneprefer
end

:menus~rewrite_cap_file
if ($menus~shipschanged)
	setvar $menus~gbonus_file $bot~folder&"/dbonus-ships.cfg"
	delete $menus~gbonus_file
	delete $ship~cap_file
	setvar $menus~j 1
	while ($menus~j < $ship~shipcounter)
		write $ship~cap_file $ship~shiplist[$menus~j][1]&" "&$ship~shiplist[$menus~j][2]&" "&$ship~shiplist[$menus~j][3]&" "&$ship~shiplist[$menus~j][9]&" "&$ship~shiplist[$menus~j][4]&" "&$ship~shiplist[$menus~j][5]&" "&$ship~shiplist[$menus~j][6]&" "&$ship~shiplist[$menus~j][7]&" "&$ship~shiplist[$menus~j][8]&" "&$ship~shiplist[$menus~j]
		if ($ship~shiplist[$menus~j][8])
			write $menus~gbonus_file $ship~shiplist[$menus~j]
		end
		add $menus~j 1
	end
end
return

:menus~rewrite_planet_file
if ($menus~planetschanged)
	delete $planet~planet_file
	setvar $menus~j 1
	while ($menus~j <= $planet~planetcounter)
		write $planet~planet_file $planet~planetlist[$menus~j][1]&" "&$planet~planetlist[$menus~j][2]&" "&$planet~planetlist[$menus~j][3]&" "&$planet~planetlist[$menus~j][4]&" "&$planet~planetlist[$menus~j][5]&" "&$planet~planetlist[$menus~j][6]&" "&$planet~planetlist[$menus~j][7]&"  "&$planet~planetlist[$menus~j]
		add $menus~j 1
	end
end
return

:menus~preferencesmenupage5
setvar $menus~i 2

:menus~nextplanetpage
echo ansi_12 "*Searching for enemy planets in database" ansi_14 "...*"
gosub :bot~killthetriggers
setvar $menus~foundsectors 0
setvar $menus~display ""
while (($menus~i <= sectors) and ($menus~foundsectors < 3))
	getsectorparameter $menus~i "BUBBLE" $menus~isbubble
	if ($menus~isbubble <> true)
		if (sector.planetcount[$menus~i] > 0)
			setvar $map~displaysector $menus~i
			gosub :map~displaysector
			setvar $menus~display $menus~display&"*"&$map~output
			add $menus~foundsectors 1
		end
	end
	add $menus~i 1
end
echo #27&"[2J"
echo "**"
echo ansi_11&"                         Known Planet List*             ("&ansi_14&"Planets in database (Not in bubble)"&ansi_11&")              **"
echo "   " #27 "[1m" ansi_4 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
setvar $menus~pagesexist false
if ($menus~foundsectors > 0)
	echo $menus~display
	if ($menus~i >= sectors)
		echo "*    [End of List]"
		setvar $menus~i 2
	else
		setvar $menus~pagesexist true
	end
else
	echo "*    [End of List]"
end
echo "*"
echo "   " #27 "[1m" ansi_4 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
echo "*"
if ($menus~pagesexist)
	echo "  "&ansi_5&"<"&ansi_6&"+"&ansi_5&">"&ansi_6&" More Planets*"
end
echo "*"
echo ansi_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ansi_15&"Planet Types                 Trader List"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ansi_7&"**"
getconsoleinput $menus~selection singlekey
setvar $menus~options ""
uppercase $menus~selection
getwordpos $menus~options $menus~pos $menus~selection
gosub :bot~killthetriggers
if ($menus~selection = "<")
	goto :preferencesmenupageplanet
elseif ($menus~selection = ">")
	goto :preferencesmenupage6
elseif ($menus~selection = "?")
	goto :preferencesmenupage5
elseif ($menus~selection = "+")
	goto :nextplanetpage
else
	gosub :doneprefer
end

:menus~preferencesmenupage6
setvar $menus~i 2

:menus~nexttraderpage
echo ansi_12 "*Searching for traders in database" ansi_14 "...*"
gosub :bot~killthetriggers
setvar $menus~foundsectors 0
setvar $menus~display ""
while (($menus~i <= sectors) and ($menus~foundsectors < 3))
	if (sector.tradercount[$menus~i] > 0)
		setvar $map~displaysector $menus~i
		gosub :map~displaysector
		setvar $menus~display $menus~display&"*"&$map~output
		add $menus~foundsectors 1
	end
	add $menus~i 1
end
echo #27&"[2J"
echo "**"
echo ansi_11&"                         Trader List*             ("&ansi_14&"Traders last seen in sectors"&ansi_11&")              **"
echo "   " #27 "[1m" ansi_4 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
setvar $menus~pagesexist false
if ($menus~foundsectors > 0)
	echo $menus~display
	if ($menus~i >= sectors)
		echo "*    [End of List]"
		setvar $menus~i 2
	else
		setvar $menus~pagesexist true
	end
else
	echo "*    [End of List]"
end
echo "*"
echo "   " #27 "[1m" ansi_4 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
echo "*"
if ($menus~pagesexist)
	echo "  "&ansi_5&"<"&ansi_6&"+"&ansi_5&">"&ansi_6&" More Planets*"
end
echo "*"
echo ansi_12&"           "&#27&"[35m["&#27&"[32m<"&#27&"[35m]"&ansi_15&"Planet Info                 Preferences"&#27&"[35m["&#27&"[32m>"&#27&"[35m]*"&ansi_7&"**"

getconsoleinput $menus~selection singlekey
setvar $menus~options ""
uppercase $menus~selection
getwordpos $menus~options $menus~pos $menus~selection
gosub :bot~killthetriggers
if ($menus~selection = "<")
	goto :preferencesmenupage5
elseif ($menus~selection = ">")
	goto :refreshpreferencesmenu
elseif ($menus~selection = "?")
	goto :preferencesmenupage6
elseif ($menus~selection = "+")
	goto :nexttraderpage
else
	gosub :doneprefer
end

:menus~echohotkeys
setarray $menus~h 34
setarray $menus~qss 34
setvar $menus~h[1] "Auto Kill            "
setvar $menus~h[2] "Auto Capture         "
setvar $menus~h[3] "Auto Refurb          "
setvar $menus~h[4] "Surround             "
setvar $menus~h[5] "Holo-Torp            "
setvar $menus~h[6] "Transwarp Drive      "
setvar $menus~h[7] "Planet Macros        "
setvar $menus~h[8] "Quick Script Loading "
setvar $menus~h[9] "Dny Holo Kill        "
setvar $menus~h[10] "Stop Current Mode    "
setvar $menus~h[11] "Dock Macros          "
setvar $menus~h[12] "Exit Enter           "
setvar $menus~h[13] "Mow                  "
setvar $menus~h[14] "Fast Foton           "
setvar $menus~h[15] "Clear Sector         "
setvar $menus~h[16] "Preferences          "
setvar $menus~h[17] "LS Dock Shopper      "
setvar $menus~i 1
while ($menus~i <= 16)
	if ($bot~custom_commands[($menus~i + 17)] <> 0)
		setvar $menus~h[($menus~i + 17)] $bot~custom_commands[($menus~i + 17)]&"                              "
		cuttext $menus~h[($menus~i + 17)] $menus~h[($menus~i + 17)] 1 22
	else
		setvar $menus~h[($menus~i + 17)] "Custom Hotkey "&$menus~i&"        "
		cuttext $menus~h[($menus~i + 17)] $menus~h[($menus~i + 17)] 1 22
	end
	add $menus~i 1
end
setvar $menus~h[34] "                     "
setvar $menus~i 1
while ($menus~i <= 33)
	if (($bot~custom_keys[$menus~i] <> 0) and ($bot~custom_keys[$menus~i] <> ""))
		if (($bot~custom_keys[$menus~i] = #9) or ($bot~custom_keys[$menus~i] = "\t"))
			setvar $menus~qss[$menus~i] "TAB-TAB"
		elseif ($bot~custom_keys[$menus~i] = #13)
			setvar $menus~qss[$menus~i] "TAB-Enter"
		elseif ($bot~custom_keys[$menus~i] = #8)
			setvar $menus~qss[$menus~i] "TAB-Backspace"
		elseif ($bot~custom_keys[$menus~i] = #32)
			setvar $menus~qss[$menus~i] "TAB-Spacebar"
		else
			setvar $menus~qss[$menus~i] "TAB-"&$bot~custom_keys[$menus~i]
		end
	else
		setvar $menus~qss[$menus~i] "Undefined"
	end
	add $menus~i 1
end
setvar $menus~qss[34] ""
setvar $menus~qss_total 34
gosub :menuspacing
echo ansi_10&#27&"[35m<"&#27&"[32m1"&#27&"[35m> "&ansi_7&$menus~qss_var[1]&ansi_10&#27&"[35m<"&#27&"[32mH"&#27&"[35m> "&ansi_7&$menus~qss_var[18]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32m2"&#27&"[35m> "&ansi_7&$menus~qss_var[2]&ansi_10&#27&"[35m<"&#27&"[32mI"&#27&"[35m> "&ansi_7&$menus~qss_var[19]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32m3"&#27&"[35m> "&ansi_7&$menus~qss_var[3]&ansi_10&#27&"[35m<"&#27&"[32mJ"&#27&"[35m> "&ansi_7&$menus~qss_var[20]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32m4"&#27&"[35m> "&ansi_7&$menus~qss_var[4]&ansi_10&#27&"[35m<"&#27&"[32mK"&#27&"[35m> "&ansi_7&$menus~qss_var[21]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32m5"&#27&"[35m> "&ansi_7&$menus~qss_var[5]&ansi_10&#27&"[35m<"&#27&"[32mL"&#27&"[35m> "&ansi_7&$menus~qss_var[22]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32m6"&#27&"[35m> "&ansi_7&$menus~qss_var[6]&ansi_10&#27&"[35m<"&#27&"[32mM"&#27&"[35m> "&ansi_7&$menus~qss_var[23]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32m7"&#27&"[35m> "&ansi_7&$menus~qss_var[7]&ansi_10&#27&"[35m<"&#27&"[32mN"&#27&"[35m> "&ansi_7&$menus~qss_var[24]&"*"
echo ansi_11&#27&"[35m<"&#27&"[32m8"&#27&"[35m> "&ansi_7&$menus~qss_var[8]&ansi_10&#27&"[35m<"&#27&"[32mO"&#27&"[35m> "&ansi_7&$menus~qss_var[25]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32m9"&#27&"[35m> "&ansi_7&$menus~qss_var[9]&ansi_10&#27&"[35m<"&#27&"[32mP"&#27&"[35m> "&ansi_7&$menus~qss_var[26]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32m0"&#27&"[35m> "&ansi_7&$menus~qss_var[10]&ansi_10&#27&"[35m<"&#27&"[32mR"&#27&"[35m> "&ansi_7&$menus~qss_var[27]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32mA"&#27&"[35m> "&ansi_7&$menus~qss_var[11]&ansi_10&#27&"[35m<"&#27&"[32mS"&#27&"[35m> "&ansi_7&$menus~qss_var[28]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32mB"&#27&"[35m> "&ansi_7&$menus~qss_var[12]&ansi_10&#27&"[35m<"&#27&"[32mT"&#27&"[35m> "&ansi_7&$menus~qss_var[29]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32mC"&#27&"[35m> "&ansi_7&$menus~qss_var[13]&ansi_10&#27&"[35m<"&#27&"[32mU"&#27&"[35m> "&ansi_7&$menus~qss_var[30]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32mD"&#27&"[35m> "&ansi_7&$menus~qss_var[14]&ansi_10&#27&"[35m<"&#27&"[32mV"&#27&"[35m> "&ansi_7&$menus~qss_var[31]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32mE"&#27&"[35m> "&ansi_7&$menus~qss_var[15]&ansi_10&#27&"[35m<"&#27&"[32mW"&#27&"[35m> "&ansi_7&$menus~qss_var[32]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32mF"&#27&"[35m> "&ansi_7&$menus~qss_var[16]&ansi_10&#27&"[35m<"&#27&"[32mX"&#27&"[35m> "&ansi_7&$menus~qss_var[33]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32mG"&#27&"[35m> "&ansi_7&$menus~qss_var[17]&ansi_10&""&ansi_7&$menus~qss_var[34]&"*"
return

:menus~add_game
setvar $menus~new_bot_name ""
getinput $menus~new_bot_name ansi_13&"What is the 'in game' name of the bot? (one word, no spaces)"&ansi_7
striptext $menus~new_bot_name "^"
striptext $menus~new_bot_name " "
lowercase $menus~new_bot_name
if ($menus~new_bot_name = "")
	goto :add_game
end
setvar $bot~password password
setvar $bot~username loginname
setvar $bot~letter game
if (($bot~letter = "") or ($bot~letter = 0))
	getinput $bot~letter "Please Enter your Game Letter"
end
if (($bot~username = "") or ($bot~username = 0))
	getinput $bot~username "Please Enter your Login Name"
end
if (($bot~password = "") or ($bot~password = 0))
	getinput $bot~password "Please Enter your Game password"
end
savevar $bot~letter
savevar $bot~username
savevar $bot~password

delete $bot~gconfig_file
write $bot~gconfig_file $menus~new_bot_name
setvar $switchboard~bot_name $menus~new_bot_name
savevar $switchboard~bot_name
setvar $bot~bot_name $menus~new_bot_name
savevar $bot~bot_name
return

:menus~pregamemenuload
killalltriggers
loadvar $bot~password
loadvar $switchboard~bot_name
setvar $bot~bot_name $switchboard~bot_name
loadvar $bot~startshipname
loadvar $bot~mowtodock
loadvar $bot~mowtodockbackdoor
loadvar $bot~startgamedelay
loadvar $bot~isceo
loadvar $bot~corpname
if ($bot~corpname = 0)
	setvar $bot~corpname ""
	savevar $bot~corpname
end
loadvar $bot~subspace
loadvar $menus~corpnumber
loadvar $bot~corppassword
if ($bot~corppassword = 0)
	setvar $bot~corppassword ""
	savevar $bot~corppassword
end
loadvar $bot~username
loadvar $bot~letter
loadvar $bot~password
if ($bot~password = 0)
	setvar $bot~password password
end
if ($bot~username = 0)
	setvar $bot~username loginname
	savevar $bot~username
end
if ($bot~servername = 0)
	setvar $bot~servername loginname
	savevar $bot~servername
end
if ($bot~letter = 0)
	setvar $bot~letter game
	savevar $bot~letter
end
if (($bot~startshipname = 0) or ($bot~startshipname = ""))
	setvar $bot~startshipname "Mind ()ver Matter"
end
if ($switchboard~bot_name = "")
	setvar $bot~newgameday1 true
	setvar $bot~newgameolder false
else
	setvar $bot~newgameday1 false
	setvar $bot~newgameolder true
end
if ($bot~isshipdestroyed = true)
	setvar $bot~newgameday1 false
	setvar $bot~newgameolder false
end
setvar $bot~startmacro ""

:menus~pregamemenu
setarray $menus~h 26
setarray $menus~qss 26
setvar $menus~h[1] "Bot Name:        "
setvar $menus~h[2] "Server Name:     "
setvar $menus~h[3] "Login Name:      "
setvar $menus~h[4] "Password:        "
setvar $menus~h[5] "Game Letter:     "
setvar $menus~h[6] "Ship Name:       "
setvar $menus~h[7] "Type of login:   "
setvar $menus~h[8] "Are you CEO?     "
setvar $menus~h[9] "Corp Name:       "
setvar $menus~h[10] "Corp Password:   "
setvar $menus~h[11] "Subspace Channel:"
setvar $menus~h[12] "Delay (Minutes): "
setvar $menus~h[13] "After login:     "
setvar $menus~h[14] "Bot command to perform:"
setvar $menus~h[15] "Mow Option       "
setvar $menus~h[16] "Macro to fire after login:"
setvar $menus~h[17] "Teammate names:  "
setvar $menus~h[18] "                 "
setvar $menus~h[19] "                 "
setvar $menus~h[20] "                 "
setvar $menus~h[21] "                 "
setvar $menus~h[22] "                 "
setvar $menus~h[23] "                 "
setvar $menus~h[24] "                 "
setvar $menus~h[25] "                 "
setvar $menus~h[26] "                 "
setvar $menus~qss[1] $switchboard~bot_name
setvar $menus~qss[2] $bot~servername
setvar $menus~qss[3] $bot~username
setvar $menus~qss[4] $bot~password
setvar $menus~qss[5] $bot~letter
setvar $menus~qss[6] $bot~startshipname
if ($bot~newgameday1)
	setvar $menus~qss[7] "New Game Account Creation"
elseif ($bot~newgameolder)
	setvar $menus~qss[7] "Normal Relog"
else
	setvar $menus~qss[7] "Return after being destroyed."
end
if ($bot~isceo)
	setvar $menus~qss[8] "Yes"
else
	setvar $menus~qss[8] "No"
end
loadvar $bot~corpname
setvar $menus~qss[9] $bot~corpname
setvar $menus~qss[10] $bot~corppassword
setvar $menus~qss[11] $bot~subspace
setvar $menus~qss[12] $bot~startgamedelay
if ($bot~mowtodock)
	setvar $menus~qss[13] "Mow To Stardock"
elseif ($menus~fmowtodock)
	setvar $menus~qss[13] "Fuel Mow to Stardock"
elseif ($menus~mowtoalpha)
	setvar $menus~qss[13] "Mow To Alpha"
elseif ($menus~mowtorylos)
	setvar $menus~qss[13] "Mow To Rylos"
elseif ($menus~mowtoother)
	setvar $menus~qss[13] "Mow To Custom TA"
elseif ($menus~xporttoship)
	setvar $menus~qss[13] "Xport to ship"
elseif ($menus~landonterra)
	setvar $menus~qss[13] "Land on Terra"
elseif ($menus~landonstardock)
	setvar $menus~qss[13] "Land on Stardock"
else
	setvar $menus~qss[13] "Nothing"
end
loadvar $menus~command_to_issue
if (($menus~command_to_issue = "") or ($menus~command_to_issue = 0))
	setvar $menus~qss[14] "None"
else
	setvar $menus~qss[14] $menus~command_to_issue
end
loadvar $menus~start_mow_option
if (($menus~start_mow_option = "") or ($menus~start_mow_option = 0))
	setvar $menus~qss[15] "Direct"
elseif ($menus~start_mow_option = "backdoor")
	setvar $menus~qss[15] "Via Backdoor"
elseif ($menus~start_mow_option = "i1")
	setvar $menus~qss[15] "Indirect Mow 1"
elseif ($menus~start_mow_option = "i2")
	setvar $menus~qss[15] "Indirect Mow 2"
elseif ($menus~start_mow_option = "i3")
	setvar $menus~qss[15] "Indirect Mow 3"
end
if (($bot~startmacro = "") or ($bot~startmacro = 0))
	setvar $menus~qss[16] "None"
else
	replacetext $bot~startmacro "*" #42
	setvar $menus~qss[16] $bot~startmacro
end
if (($bot~teammates = "") or ($bot~teammates = 0))
	setvar $menus~qss[17] "None"
else
	setvar $menus~qss[17] $bot~startmacro
end
setvar $menus~qss[18] ""
setvar $menus~qss[19] ""
setvar $menus~qss[20] ""
setvar $menus~qss[21] ""
setvar $menus~qss[22] ""
setvar $menus~qss[23] ""
setvar $menus~qss[24] ""
setvar $menus~qss[25] ""
setvar $menus~qss[26] ""
setvar $menus~qss_total 26
gosub :menuspacing
echo "**"
echo ansi_11&" Relog Menu   (Q to quit, Z to start logging in.)         *"
echo ansi_10&#27&"[35m<"&#27&"[32m1"&#27&"[35m> "&ansi_7&$menus~qss_var[7]&"*"
echo "*"
echo ansi_10&#27&"[35m<"&#27&"[32mB"&#27&"[35m> "&ansi_7&$menus~qss_var[1]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32mN"&#27&"[35m> "&ansi_7&$menus~qss_var[2]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32mL"&#27&"[35m> "&ansi_7&$menus~qss_var[3]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32mP"&#27&"[35m> "&ansi_7&$menus~qss_var[4]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32mG"&#27&"[35m> "&ansi_7&$menus~qss_var[5]&"*"
if ($bot~newgameolder = false)
	echo ansi_10&#27&"[35m<"&#27&"[32mS"&#27&"[35m> "&ansi_7&$menus~qss_var[6]&"*"
end
if ($bot~newgameday1 = true)
	echo ansi_10&#27&"[35m<"&#27&"[32m2"&#27&"[35m> "&ansi_7&$menus~qss_var[8]&"*"
	echo ansi_10&#27&"[35m<"&#27&"[32m3"&#27&"[35m> "&ansi_7&$menus~qss_var[9]&"*"
	echo ansi_10&#27&"[35m<"&#27&"[32m4"&#27&"[35m> "&ansi_7&$menus~qss_var[10]&"*"
	echo ansi_10&#27&"[35m<"&#27&"[32m5"&#27&"[35m> "&ansi_7&$menus~qss_var[11]&"*"
end
echo ansi_10&#27&"[35m<"&#27&"[32m6"&#27&"[35m> "&ansi_7&$menus~qss_var[12]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32m7"&#27&"[35m> "&ansi_7&$menus~qss_var[13]&"*"
if (($bot~mowtodock = true) or ($menus~mowtoalpha = true) or ($menus~mowtorylos = true) or ($menus~mowtoother = true) or ($menus~fmowtodock = true))
	echo ansi_10&#27&"[35m<"&#27&"[32mM"&#27&"[35m> "&ansi_7&$menus~qss_var[15]&"*"
end
echo ansi_10&#27&"[35m<"&#27&"[32m8"&#27&"[35m> "&ansi_7&$menus~qss_var[14]&"*"
echo ansi_10&#27&"[35m<"&#27&"[32m9"&#27&"[35m> "&ansi_7&$menus~qss_var[16]&"*"
if ($bot~newgameolder <> true)
	echo ansi_10&#27&"[35m<"&#27&"[32mT"&#27&"[35m> "&ansi_7&$menus~qss_var[17]&"*"
end
echo "*"

:menus~getstartgameinput
getconsoleinput $menus~chosen_option singlekey
killalltriggers
uppercase $menus~chosen_option

:menus~process_start_command
if ($menus~chosen_option = "?")
	goto :pregamemenu
elseif ($menus~chosen_option = "B")
	killalltriggers
	getinput $menus~new_bot_name ansi_13&"What is the 'in game' name of the bot? (one word, no spaces)"&ansi_7
	striptext $menus~new_bot_name "^"
	striptext $menus~new_bot_name " "
	if ($menus~new_bot_name = "")
		goto :pregamemenu
	end
	delete $bot~gconfig_file
	write $bot~gconfig_file $menus~new_bot_name
	setvar $bot~bot_name $menus~new_bot_name
	setvar $switchboard~bot_name $menus~new_bot_name
	savevar $switchboard~bot_name
	savevar $bot~bot_name
elseif ($menus~chosen_option = "P")
	killalltriggers
	getinput $bot~password "Please Enter your Game Password"
	savevar $bot~password
elseif ($menus~chosen_option = "G")
	killalltriggers
	getinput $bot~letter "Please Enter your Game Letter"
	savevar $bot~letter
elseif ($menus~chosen_option = "N")
	killalltriggers
	getinput $bot~servername "Please Enter your Server Name"
	savevar $bot~servername
elseif ($menus~chosen_option = "L")
	killalltriggers
	getinput $bot~username "Please Enter your Login Name"
	savevar $bot~username
elseif ($menus~chosen_option = "S")
	killalltriggers
	getinput $bot~startshipname "What ship name would you like?"
	savevar $bot~startshipname
elseif ($menus~chosen_option = 1)
	if ($bot~newgameday1)
		setvar $bot~newgameday1 false
		setvar $bot~newgameolder true
	elseif ($bot~newgameolder)
		setvar $bot~newgameday1 false
		setvar $bot~newgameolder false
	else
		setvar $bot~newgameday1 true
		setvar $bot~newgameolder false
	end
elseif (($menus~chosen_option = 2) and (($bot~newgameday1 = true) or ($bot~newgameolder = true)))
	if ($bot~isceo)
		setvar $bot~isceo false
	else
		setvar $bot~isceo true
	end
elseif (($menus~chosen_option = 3) and (($bot~newgameday1 = true) or ($bot~newgameolder = true)))
	getinput $menus~temp "What Corp Name will you use?"
	if ($menus~temp = 0)
		setvar $menus~temp ""
	end
	setvar $bot~corpname $menus~temp
	savevar $bot~corpname
elseif (($menus~chosen_option = 4) and (($bot~newgameday1 = true) or ($bot~newgameolder = true)))
	getinput $menus~temp "What Corp Password will you use?"
	if ($menus~temp = 0)
		setvar $menus~temp ""
	end
	setvar $bot~corppassword $menus~temp
elseif (($menus~chosen_option = 5) and (($bot~newgameday1 = true) or ($bot~newgameolder = true)))
	getinput $menus~temp "What subspace channel do you want to use?"
	isnumber $menus~test $menus~temp
	if ($menus~test)
		if (($menus~temp <= 60000) and ($menus~temp >= 0))
			setvar $bot~subspace $menus~temp
		end
	end
elseif ($menus~chosen_option = 6)
	getinput $menus~temp "How long in minutes before the game starts?"
	isnumber $menus~test $menus~temp
	if ($menus~test)
		setvar $bot~startgamedelay $menus~temp
	end
elseif ($menus~chosen_option = 7)
	if ($menus~xporttoship)
		setvar $menus~qss[12] "Nothing"
		setvar $bot~mowtodock false
		setvar $menus~mowtoalpha false
		setvar $menus~mowtorylos false
		setvar $menus~xporttoship false
		setvar $menus~mowtoother false
		setvar $menus~landonterra false
		setvar $menus~landonstardock false
		setvar $menus~mowdestination ""
		setvar $menus~do_nothing true
		setvar $menus~fmowtodock false
	elseif (($bot~mowtodock = false) and (($menus~mowtoalpha = false) and (($menus~fmowtodock = false) and (($menus~mowtorylos = false) and (($menus~mowtoother = false) and (($menus~xporttoship = false) and (($menus~landonterra = false) and ($menus~landonstardock = false))))))))
		setvar $menus~qss[12] "Land on Terra"
		setvar $menus~do_nothing false
		setvar $bot~mowtodock false
		setvar $menus~mowtoalpha false
		setvar $menus~mowtorylos false
		setvar $menus~mowtoother false
		setvar $menus~xporttoship false
		setvar $menus~landonterra true
		setvar $menus~landonstardock false
		setvar $menus~mowdestination ""
		setvar $menus~fmowtodock false
	elseif ($menus~landonterra)
		setvar $menus~qss[12] "Land on Stardock"
		setvar $bot~mowtodock false
		setvar $menus~mowtoalpha false
		setvar $menus~mowtorylos false
		setvar $menus~mowtoother false
		setvar $menus~xporttoship false
		setvar $menus~landonterra false
		setvar $menus~landonstardock true
		setvar $menus~mowdestination ""
		setvar $menus~do_nothing false
		setvar $menus~fmowtodock false
	elseif ($menus~landonstardock)
		setvar $menus~qss[12] "Mow To Custom TA"
		setvar $bot~mowtodock false
		setvar $menus~mowtoalpha false
		setvar $menus~mowtorylos false
		setvar $menus~mowtoother true
		setvar $menus~xporttoship false
		setvar $menus~landonterra false
		setvar $menus~landonstardock false
		setvar $menus~mowdestination ""
		setvar $menus~do_nothing false
		setvar $menus~fmowtodock false
	elseif ($menus~mowtoother)
		setvar $menus~qss[12] "Mow to Stardock"
		setvar $bot~mowtodock true
		setvar $menus~mowtoalpha false
		setvar $menus~mowtorylos false
		setvar $menus~xporttoship false
		setvar $menus~mowtoother false
		setvar $menus~landonterra false
		setvar $menus~landonstardock false
		setvar $menus~do_nothing false
		setvar $menus~fmowtodock false
		setvar $menus~mowdestination $map~stardock
	elseif ($bot~mowtodock)
		setvar $menus~qss[12] "Fuel Mow to Stardock"
		setvar $bot~mowtodock false
		setvar $menus~mowtoalpha false
		setvar $menus~mowtorylos false
		setvar $menus~xporttoship false
		setvar $menus~mowtoother false
		setvar $menus~landonterra false
		setvar $menus~landonstardock false
		setvar $menus~do_nothing false
		setvar $menus~fmowtodock true
		setvar $menus~mowdestination $map~stardock
	elseif ($menus~fmowtodock)
		setvar $menus~qss[12] "Xport to Ship"
		setvar $menus~xporttoship true
		setvar $menus~mowtoalpha false
		setvar $menus~mowtorylos false
		setvar $menus~mowtoother false
		setvar $menus~landonterra false
		setvar $menus~landonstardock false
		setvar $bot~mowtodock false
		setvar $menus~mowdestination ""
		setvar $menus~do_nothing false
		setvar $menus~fmowtodock false
	end
	savevar $menus~xporttoship
	savevar $menus~fmowtodock
	savevar $menus~mowtoalpha
	savevar $menus~mowtorylos
	savevar $menus~mowtoother
	savevar $bot~mowtodock
	savevar $menus~landonterra
	savevar $menus~landonstardock
	savevar $menus~do_nothing
elseif ($menus~chosen_option = "M")

	if ($menus~start_mow_option = "i3")
		setvar $menus~qss[14] "Direct"
		setvar $menus~start_mow_option ""
	elseif (($menus~start_mow_option = "") or ($menus~start_mow_option = 0))
		setvar $menus~qss[14] "Via Backdoor"
		setvar $menus~start_mow_option "backdoor"
	elseif ($menus~start_mow_option = "backdoor")
		setvar $menus~qss[14] "Indirect Mow 1"
		setvar $menus~start_mow_option "i1"
	elseif ($menus~start_mow_option = "i1")
		setvar $menus~qss[14] "Indirect Mow 2"
		setvar $menus~start_mow_option "i2"
	elseif ($menus~start_mow_option = "i2")
		setvar $menus~qss[14] "Indirect Mow 3"
		setvar $menus~start_mow_option "i3"
	end
	savevar $menus~start_mow_option
elseif ($menus~chosen_option = 8)
	getinput $menus~temp "Enter a command line for the bot to run after entering game (No bot name needed)"
	setvar $menus~command_to_issue $menus~temp
	savevar $menus~command_to_issue

elseif ($menus~chosen_option = 9)
	getinput $bot~startmacro "What macro should fire upon entry?"
	replacetext $bot~startmacro "*" #42
elseif ($menus~chosen_option = "T")
	getinput $bot~teammates "Enter teammate names (separated by commas)"
elseif ($menus~chosen_option = "Q")
	stop $bot~last_loaded_module
	savevar $bot~last_loaded_module
	halt
elseif ($menus~chosen_option = "Z")
	replacetext $bot~startmacro "^m" #42
	replacetext $bot~startmacro "^M" #42
	savevar $bot~startmacro

	:menus~getmowsector
	killalltriggers
	if ($menus~mowtoother)
		getinput $menus~temp "What mow destination do you want to use?"
		isnumber $menus~test $menus~temp
		if ($menus~test)
			if (($menus~temp <= sectors) and ($menus~temp > 0))
				setvar $menus~mowdestination $menus~temp
			else
				goto :getmowsector
			end
		else
			goto :getmowsector
		end
	end
	if ($menus~xporttoship)
		getinput $menus~temp "What ship do you want to xport to?"
		isnumber $menus~test $menus~temp
		if ($menus~test <> true)
			goto :getmowsector
		else
			setvar $menus~mowdestination $menus~temp
		end
	end
	setvar $timetologbackin ($bot~startgamedelay * 60)
	if ($timetologbackin > 0)
		killalltriggers
	end
	settextouttrigger logearly :enddelaystartgame #32
	while ($timetologbackin > 0)
		gosub :calctime
		echo ansi_10 #27&"[1A"&#27&"[K"&$hours ":" $minutes ":" $seconds " left before entering game " game " (" gamename ") "&ansi_15&" ["&ansi_14&"Spacebar to relog"&ansi_15&"]*"
		setdelaytrigger timebeforerelog :startgametimer 1000
		pause

		:menus~startgametimer
		setvar $timetologbackin ($timetologbackin - 1)
	end

	:menus~enddelaystartgame
	killalltriggers
	if ($bot~newgameolder = true)
		setvar $connectivity~newgame false
		setvar $menus~post_relog_resume true
		load "scripts\"&$bot~mombot_directory&"\commands\general\relog.cts"
		seteventtrigger 1 :relogended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\general\relog.cts"
		pause

		:menus~relogended
		gosub :connectivity~moving
	elseif ($bot~newgameday1 = true)
		setvar $connectivity~newgame true
		gosub :connectivity~enter_new_game
	else
		setvar $connectivity~newgame false
		gosub :connectivity~enter_new_game
	end
	loadvar $bot~startmacro
	if ($bot~startmacro <> "")
		replacetext $bot~startmacro #42 "*"
		send $bot~startmacro
		setvar $bot~startmacro ""
		savevar $bot~startmacro
	end
	goto :donepregame
else
	goto :getstartgameinput
end
gosub :pregamestats
goto :pregamemenu

:menus~donepregame
if (($bot~teammates <> "") and ($bot~teammates <> 0))
	splittext $bot~teammates $menus~corp_list ","
	setvar $menus~i 1
	while ($menus~i <= $menus~corp_list)
		setvar $menus~j 1
		setvar $menus~isfound false
		trim $menus~corp_list[$menus~i]
		while ($menus~j <= $menus~corpycount)
			trim $bot~corpy[$menus~j]
			setvar $menus~corpy_lower $bot~corpy[$menus~j]
			setvar $menus~corp_list_lower $menus~corp_list[$menus~i]
			lowercase $menus~corpy_lower
			lowercase $menus~corp_list_lower
			if ($menus~corp_list_lower = $menus~corpy_lower)
				setvar $menus~isfound true
			end
			add $menus~j 1
		end
		if ($menus~isfound <> true)
			add $menus~corpycount 1
			setvar $bot~corpy[$menus~corpycount] $menus~corp_list[$menus~i]
		end
		add $menus~i 1
	end
end
if ($menus~post_relog_resume = true)
	setvar $menus~post_relog_resume false
	goto :bot~run_bot
end
goto :bot~getinitial_settings

return

:menus~pregamestats
gosub :bot~save_the_variables
return

:menus~menuspacing
setvar $menus~qss_ss 0
setvar $menus~qss_count 1
setvar $menus~spc " "
setvar $menus~overall 15
while ($menus~qss_count <= $menus~qss_total)
	setvar $menus~spc_count 1
	setvar $menus~checklength $menus~h[$menus~qss_count]&""&$menus~qss[$menus~qss_count]
	setvar $menus~qss_var[$menus~qss_count] ansi_15&$menus~h[$menus~qss_count]&" "&ansi_14&$menus~qss[$menus~qss_count]&ansi_7
	getlength $menus~checklength $menus~length
	setvar $menus~space 34
	subtract $menus~space $menus~length
	while ($menus~spc_count <= $menus~space)
		mergetext $menus~qss_var[$menus~qss_count] $menus~spc $menus~qss_var[$menus~qss_count]
		add $menus~spc_count 1
	end
	add $menus~qss_count 1
end
return

:menus~getinput
gosub :bot~killthetriggers
setdeafclients false
getinput $menus~response $menus~question
setdeafclients true
return

:chatmenu
setvar $bot~botisdeaf false
savevar $bot~botisdeaf
gosub :buildcomstring

setvar $i 1
while ($i <= $figsize)
	setvar $figs[$i] ""
	add $i 1
end

:start
getdeafclients $bot~botisdeaf
if (($bot~botisdeaf = true) and ($active_viewscreen = true))
	gosub :refreshchatmenu
end

:start_no_refresh
setvar $comtype ""
gosub :killchattriggers
settextlinetrigger lookforp :lookforcom "P "
settextlinetrigger lookforr :lookforcom "R "
settextlinetrigger lookforf :lookforcom "F "
settextlinetrigger lookforselfr :lookforcom "'"
settextlinetrigger lookforselff :lookforcom "`"
settextlinetrigger lookforselfmul :lookforcom "S: "
settextlinetrigger fighit :fighitprocess "of your fighters in sector"
settextlinetrigger offfighit :fighitprocess "Your fighters in sector"
#settextlinetrigger entered :figHitProcess "Deployed Fighters Report Sector"

#setdelaytrigger    silentdelay :checksilent 900000
#settextlinetrigger limpet :limpetProcess "Limpet mine in "

getdeafclients $bot~botisdeaf
if ($bot~botisdeaf = true)
	setdelaytrigger delay :refresh 500
end
settextouttrigger open :process_command "_"
getdeafclients $bot~botisdeaf
if ($bot~botisdeaf = true)
	settextouttrigger talk2 :process_down "d"
	settextouttrigger talk3 :process_down "D"
	settextouttrigger talk4 :process_up "u"
	settextouttrigger talk5 :process_up "U"
	settextouttrigger ignore :process_chat "'"
	settextouttrigger ignore2 :process_chat "`"

	settextouttrigger talk7 :toggle_mute_me "+"
	settextouttrigger talk6 :start_no_refresh ""
end
pause

:process_chat
gosub :killchattriggers
getouttext $chat_symbol
processout $chat_symbol

:wait_for_chat
settextouttrigger chat :processchatstring ""
pause

:processchatstring
getouttext $character
processout $character
getwordpos $character $pos #13
setvar $found_enter_key false
if ($pos > 0)
	setvar $found_enter_key true
end
if ($found_enter_key = true)
	goto :start
else
	goto :wait_for_chat
end

:process_up
gosub :killchattriggers
getdeafclients $bot~botisdeaf
if ($bot~botisdeaf)
	if ($comm_window_start_index < ($comsize-$comm_window_size))
		add $comm_window_start_index $comm_window_size
		if ($comm_window_start_index > ($comsize-$comm_window_size))
			setvar $comm_window_start_index ($comsize-$comm_window_size)
		end
	end
end
goto :start

:process_down
gosub :killchattriggers
if ($bot~botisdeaf)
	if ($comm_window_start_index > 1)
		subtract $comm_window_start_index $comm_window_size
		if ($comm_window_start_index < 1)
			setvar $comm_window_start_index 1
		end
	end
end
goto :start

:process_command
gosub :killchattriggers
getdeafclients $bot~botisdeaf
if ($bot~botisdeaf)
	setvar $active_viewscreen false
	setdeafclients false
	echo #27&"[255D"&#27&"[255B"&#27&"[K"
	echo "*"&ansi_5&"Viewscreen shutting down..*"&ansi_15&currentansiline
else
	setvar $active_viewscreen true
	setdeafclients true
	setvar $comm_window_start_index 1
	setvar $old_output ""
	gosub :refreshchatmenu
end
getdeafclients $bot~botisdeaf
savevar $bot~botisdeaf
goto :start

:toggle_battle_screen
gosub :killchattriggers
getdeafclients $bot~botisdeaf
if ($bot~botisdeaf)
	if ($battle_screen = true)
		setvar $battle_screen false
	else
		setvar $battle_screen true
	end
	goto :start
end

:toggle_mute_me
gosub :killchattriggers
getdeafclients $bot~botisdeaf
if ($bot~botisdeaf)
	if ($ignoreme = true)
		setvar $ignoreme false
	else
		setvar $ignoreme true
	end
	goto :start
end

:refresh
getdeafclients $bot~botisdeaf
if (($bot~botisdeaf) and ($active_viewscreen = true))
	gosub :refreshchatmenu
	setdelaytrigger delay :refresh 500
end
pause

:lookforcom
gosub :killchattriggers
setvar $line currentline
cuttext $line $checkcom 1 2
cuttext $line $firstchar 1 1
getword $checkcom $checkcom 1
if ($firstchar = "'") or ($firstchar = "`") or ($checkcom = "P") or ($checkcom = "R") or ($checkcom = "F") or ($checkcom = "S:")
	if ($checkcom = "P")
		getword $line $checkcorpscan 2
		if ($checkcorpscan = "indicates")
			goto :start
		end
	end
	getlength $line $length
	setvar $isme false
	if ($length > 4)
		if ($firstchar = "'")
			cuttext $line $line 2 9999
			setvar $line "R ME     "&$line
			setvar $isme true
		end
		if ($firstchar = "`")
			cuttext $line $line 2 9999
			setvar $line "F ME     "&$line
			setvar $isme true
		end
		if ($checkcom = "S:")
			cuttext $line $line 4 9999
			setvar $line "R ME     "&$line
			setvar $isme true
		end
		gosub :addcom2window
	end
	goto :start
else
	goto :start
end

:fighitprocess
gosub :killchattriggers
setvar $line currentline
getword $line $spoofcheck 1
if ($spoofcheck = "P") or ($spoofcheck = "F") or ($spoofcheck = "R") or ($spoofcheck = ">")
	goto :start
else
	gosub :addfig2window
	goto :start
end

:limpetprocess
gosub :killchattriggers
setvar $line currentline
getword $line $spoofcheck 1
if ($spoofcheck = "P") or ($spoofcheck = "F") or ($spoofcheck = "R") or ($spoofcheck = ">")
	goto :start
else
	#getword CURRENTLINE $sector 4
	#getdistance $distance $sector CURRENTSECTOR
	#setvar $line " Hops: " & $distance & " " & $line
	gosub :addfig2window
	goto :start
end

:addcom2window
gosub :gettime
if ($startdate <> $year & $month & $day)
	setvar $startdate $year & $month & $day
	setvar $logfilename $bot~folder&"/"&$year & $month & $day & ".comms"
end
write $logfilename $hour & ":" & $minute & ":" & $second & ":" & $msec & "  " &$line
getlength $line $length
setvar $numline 1
setvar $line2 ""
setvar $line " " & $line
if (($isme = true) and ($ignoreme = true))
	# ignore self chat if ignore me is set. #
else
	if ($length > ($comm_line_length+1))
		cuttext $line $line1 1 ($comm_line_length)
		cuttext $line $line2 ($comm_line_length+1) 200
		setvar $line $line1&"* "&$line2
		setvar $numline 2

		setvar $line $line1
		getlength $line $length
		gosub :formatline
		if ($line2 <> "")
			setvar $line "+         "&$line2
			getlength $line $length
			gosub :formatline
		end
	else
		gosub :formatline
	end
end
return

:addfig2window
gosub :gettime
setvar $time " "&$hour & ":" & $minute & ":" & $second & ":" & $msec & "  "
if ($isodd)
	setvar $isodd false
	setvar $time ansi_4&$time&ansi_11
else
	setvar $isodd true
	setvar $time ansi_12&$time&ansi_11
end
gettext " "&$line $attacker " " " destroyed "
gettext " "&$line $howmany " destroyed " " of your fighters in sector "
gettext $line&"[end][end]" $attacked " in sector " "[end][end]"
replacetext $line $attacker&" " ansi_11&$attacker&" "&ansi_2
replacetext $line " "&$howmany&" " ansi_6&" "&$howmany&" "&ansi_2
replacetext $line $attacked ansi_6&$attacked&ansi_2
isnumber $isnumber $attacked
if ($isnumber)
	if (($attacked > 10)  and ($attacked <= sectors))
		getdistance $distance $attacked currentsector
		if ($map~home_sector > 0)
			getdistance $distance_home $attacked $map~home_sector
		end
		setvar $hops ""
		if ($distance > 0)
			setvar $hops ansi_2&" ("&ansi_15&$distance & " hops away"&ansi_2&")"
			if ($map~home_sector > 0)
				setvar $hops $hops&" ("&ansi_15&$distance_home & " from home"&ansi_2&")"
			end
		end
		setvar $line  $time&$line&$hops
		gosub :buildfigstring
	end
end
return

:addentry2window
gosub :gettime
setvar $time " "&$hour & ":" & $minute & ":" & $second & ":" & $msec & "  "
if ($isodd)
	setvar $isodd false
	setvar $time ansi_4&$time&ansi_11
else
	setvar $isodd true
	setvar $time ansi_12&$time&ansi_11
end
getword currentline $attacked 5
replacetext $attacked ":" ""
replacetext $line $attacked ansi_6&$attacked&ansi_2
replacetext $line "Deployed Fighters Report Sector" ansi_2&"Deployed Fighters Report Sector"&ansi_2
#    isNumber $isNumber $attacked
#    if ($isNumber)
#        if (($attacked > 10)  AND ($attacked <= SECTORS))
#                       getdistance $distance $attacked CURRENTSECTOR
#                       if ($MAP~home_sector > 0)
#                               getdistance $distance_home $attacked $MAP~home_sector
#                       end
#                       setVar $hops ""
#                       if ($distance > 0)
#                               setvar $hops ANSI_2&" ("&ANSI_15&$distance & " hops away"&ANSI_2&")"
#                               if ($MAP~home_sector > 0)
#                                       setVar $hops $hops&" ("&ANSI_15&$distance_home & " from home"&ANSI_2&")"
#                               end
#                       end
setvar $line  $time&$line&$hops
gosub :buildfigstring
#       end
#    end
return

:formatline
if ($length > 11)
	cuttext $line $commchar 1 2
	cuttext $line $thename 3 8
	cuttext $line $therest 10 9999
	setvar $line ansi_3&$commchar&ansi_11&$thename&ansi_14&$therest
	if ($ignore <> true)
		gosub :buildcomstring
	end
	setvar $ignore false
end
return

:buildfigstring
setvar $figstring ""
setvar $windowstring ""
setvar $i $figsize
while ($i > 0)
	if ($i = 1)
		setvar $figs[1] $line
		#setvar $figs[1][1] $numline
	else
		setvar $figs[$i] $figs[($i-1)]
		#setvar $figs[$i][1] $figs[($i-1)][1]
	end
	subtract $i 1
end

#setvar $count 2
#while (($numline < ($figsize-1)) AND ($count < $figsize))
#    setvar $numline ($numline + $figs[$count][1])
#    add $count 1
#end
while ($count >=1)
	if ($figs[$count] = 0)
		setvar $figs[$count] ""
	end
	setvar $figstring $figstring & $figs[$count] & "*"
	subtract $count 1
end
return

:buildcomstring
setvar $comstring ""
setvar $windowstring ""
setvar $i $comsize
while ($i > 0)
	if ($i = 1)
		setvar $coms[1] $line
		#setvar $coms[1][1] $numline
	else
		setvar $coms[$i] $coms[($i-1)]
		#setvar $coms[$i][1] $coms[($i-1)][1]
	end
	subtract $i 1
end

#setvar $count 2
#while (($numline < ($comsize-1)) AND ($count < $comsize))
#    setvar $numline ($numline + $coms[$count][1])
#    add $count 1
#end
while ($count >=1)
	if ($coms[$count] = 0)
		setvar $coms[$count] ""
	end
	setvar $comstring $comstring & $coms[$count] & "*"
	subtract $count 1
end
return

# ----====[Get the date and time ]====----
# creates a unique number timestamp
# if time/date is 10:50:00am 9/15/05 then output = 20050915105000
# if time/date is 5:33:22pm 9/15/05 then output = 20050915173322
:gettime
gettime $datetime "yyyymmddhhnnsszzz am/pm"
getword $datetime $ampmcheck 2
getword $datetime $finaltime 1
cuttext $finaltime $12check 9 2
if ($ampmcheck = "pm")
	if ($12check <> 12)
		add $finaltime 120000000
	end
end
cuttext $finaltime $year 1 4
cuttext $finaltime $month 5 2
cuttext $finaltime $day 7 2
cuttext $finaltime $hour 9 2
cuttext $finaltime $minute 11 2
cuttext $finaltime $second 13 2
cuttext $finaltime $msec 15 3
# echo ANSI_10 "*" $finalTime
# echo ANSI_10 "**" $month "/" $day "/" $year " - " $hour ":" $minute ":" $second
# echo ANSI_10 "*Date: " DATE " Time: " TIME "*"
return

:getstats
gosub :loadvars

if ($player~current_sector = 0)
	setvar $stats[1] "    Sector: "&currentsector&"*"
else
	setvar $stats[1] "    Sector: "&$player~current_sector&"*"
end
if ($planet~planet <> 0)
	setvar $stats[2] "    Planet: "&$planet~planet&"*"
else
	setvar $stats[2] "    Planet: None*"
end
if ($player~unlimitedgame)
	setvar $stats[3] "     Turns: Unlimited*"
else
	setvar $stats[3] "     Turns: "&currentturns&"*"
end
setvar $player~value currentexperience
gosub :player~commasize
setvar $stats[4]  "       Exp: "&$player~value&"*"
setvar $player~value currentalignment
gosub :player~commasize
setvar $stats[5]  "     Align: "&$player~value&"*"
setvar $player~value currentcredits
gosub :player~commasize
setvar $stats[6]  "   Credits: "&$player~value&"*"
setvar $stats[7]  "Holds Info: "&currenttotalholds&"*"
setvar $stats[8] "  Fuel Ore: "&currentoreholds&"*"
setvar $stats[9] "  Organics: "&currentorgholds&"*"
setvar $stats[10] " Equipment: "&currentequholds&"*"
setvar $stats[11] " Colonists: "&currentcolholds&"*"
setvar $empty_holds (currenttotalholds - currentoreholds)
setvar $empty_holds ($empty_holds - currentorgholds)
setvar $empty_holds ($empty_holds - currentequholds)
setvar $empty_holds ($empty_holds - currentcolholds)

setvar $stats[12] "     Empty: "&currentemptyholds&"*"
setvar $stats[13] "    Ship #: "&currentshipnumber&"*"
setvar $player~value currentfighters
gosub :player~commasize
setvar $stats[14] "  Fighters: "&$player~value&"*"
setvar $player~value currentshields
gosub :player~commasize
setvar $stats[15] "   Shields: "&$player~value&"*"
setvar $player~value $ship~ship_fighters_max
gosub :player~commasize
setvar $stats[16] "  Max Figs: "&$player~value&"*"
setvar $player~value $ship~ship_max_attack
gosub :player~commasize
setvar $stats[17] "  Max Wave: "&$player~value&"*"
setvar $stats[18] "Turns/Warp: "&$player~turns_per_warp&"*"

cuttext currentarmids&"    " $player~armids 0 3
cuttext currentcloaks&"    " $player~cloaks 0 3
cuttext currentgentorps&"    " $player~genesis 0 3
cuttext currentminedisr&"    " $player~mine_disruptors 0 3
cuttext currenteprobes&"    " $player~eprobes 0 3
cuttext currenttwarptype&"    " $player~twarp_type 0 3
cuttext currentscantype&"    " $player~scan_type 0 3

setvar $stats[19] "   EProbes: "&currenteprobes&ansi_5&"   Beacons: "&currentbeacons&"*"
setvar $stats[20] "   Disrupt: "&currentminedisr&ansi_5&"   Photons: "&currentphotons&"*"
setvar $stats[21] "    Armids: "&currentarmids&ansi_5&"   Limpets: "&currentlimpets&"*"
setvar $stats[22] "   Genesis: "&currentgentorps&ansi_5&"   AtmDets: "&currentatomics&"*"
setvar $player~value currentcorbomite
gosub :player~commasize
setvar $stats[23] "    Cloaks: "&currentcloaks&ansi_5&"    Corbos: "&$player~value&"*"
setvar $stats[24] "     Twarp: "&currenttwarptype&ansi_5&"   PlnScan: "&currentplanetscanner&"*"
setvar $stats[25] "   Scanner: "&currentscantype&ansi_5&"   PsiProb: "&currentpsychicprobe&"*"
setvar $stats[26] "     *"
return

:loadvars
loadvar $planet~planet
loadvar $player~unlimitedgame
loadvar $player~trader_name
loadvar $map~stardock
loadvar $map~alpha_centauri
loadvar $map~rylos
loadvar $map~backdoor
loadvar $ship~ship_fighters_max
loadvar $ship~ship_max_attack
loadvar $player~turns_per_warp
return

:refreshchatmenu
loadvar $bot~who_is_online
loadvar $window_content
loadvar $switchboard~window_content
if ($switchboard~window_content <> "")
	setvar $window_content $window_content&"** "&$switchboard~window_content
end
replacetext $bot~who_is_online "," "*"
replacetext $window_content "[][]" "*"

gosub :getstats
setvar $output #27 & "[2J"
setvar $output $output&"**"
if (($bot~who_is_online <> "0") and ($bot~who_is_online <> ""))
	setvar $i 1
	listactivescripts $scripts
	setvar $found false
	while ($i <= $scripts)
		getwordpos $scripts[$i] $pos "online.cts"
		if ($pos > 0)
			setvar $found true
		end
		add $i 1
	end
	if ($found = true)
		setvar $output $output&ansi_15&"---------------------------------------"&ansi_13&" Who's Online? "&ansi_15&"---------------------------------------------*"
		setvar $output $output&ansi_10&""&ansi_7&$bot~who_is_online
	else
		setvar $bot~who_is_online ""
		savevar $bot~who_is_online
	end
else
	if ($bot~who_is_online = "0")
		setvar $bot~who_is_online ""
		savevar $bot~who_is_online
	end
end
if ($battle_screen = true)
	setvar $output $output&ansi_15&"---------------------------------------------------------------------------------------------------*"
	gosub :map~displaynavigation
	setvar $output $output&$map~map&"*"
else

	if (($window_content <> "") and ($window_content <> "0"))
		if ($window_content = $previous_window_content)
			add $window_content_time 500
		else
			setvar $window_content_time 0
		end
		if ($window_content_time < 120000)
			setvar $output $output&ansi_15&"------------------------------------"&ansi_13&" Script Status Window "&ansi_15&"-----------------------------------------*"
			setvar $output $output&ansi_10&""&ansi_15&$window_content&"*"
			setvar $previous_window_content $window_content
		else
			setvar $window_content ""
			savevar $window_content
			setvar $switchboard~window_content ""
			savevar $switchboard~window_content
			setvar $window_content_time 0
		end
	else
		if ($window_content = "0")
			setvar $window_content ""
			savevar $window_content
		end
	end
	setvar $output $output&ansi_15&"---------------------------------"&ansi_13&" Communications "&ansi_15&"--------------------------------"&ansi_13&" Stats "&ansi_15&"-----------*"

	splittext $window_content $window_linecount "*"
	splittext $bot~who_is_online $who_linecount "*"

	setvar $i $figsize
	setvar $j 1
	setvar $fighter_output ""
	setvar $figlines 0
	while ($i >= 1)
		setvar $line $figs[$i]
		if ($line <> "")
			setvar $fighter_output $fighter_output&$line&"*"
			add $figlines 1
		end
		subtract $i 1
	end

	setvar $subtract_com_lines 0
	if ($bot~who_is_online <> "")
		add $subtract_com_lines $who_linecount
	end
	if ($window_content <> "")
		add $subtract_com_lines $window_linecount
	end
	add $subtract_com_lines $figlines

	setvar $i ($comm_window_size - $subtract_com_lines)
	setvar $j 1
	while ($i >= 0)
		setvar $line $coms[($comm_window_start_index+$i)]
		getwordpos $line $posf "F"
		getwordpos $line $posr "R"
		getwordpos $line $posp "P"
		getwordpos $line $posplus "+"

		#if (($posF = 1) OR ($posR = 1) OR ($posP = 1) OR ($posPlus = 1))
		setvar $line_length ($comm_line_length+24)
		#else
		#       setVar $line_length $comm_line_length
		#end
		getlength $line $length
		while ($length <= $line_length)
			setvar $line $line&" "
			getlength $line $length
		end
		replacetext $stats[$j] ":" ansi_14&":"&ansi_11
		replacetext $stats[$j] "|" ansi_5&":"&ansi_11
		setvar $output $output&$line&" "&ansi_5&$stats[$j]
		subtract $i 1
		add $j 1
	end
end
if ($fighter_output <> "")
	setvar $output $output&ansi_15&"-----------------------------------------"&ansi_2&" Fighter Hits "&ansi_15&"--------------------------------------------*"&$fighter_output
else
	setvar $output $output&"*"
end
setvar $output $output&ansi_15&"--------"&ansi_12&" "&ansi_5&"["&ansi_2&"'"&ansi_5&"]"&ansi_15&"Sub ("&$bot~subspace&") "&ansi_15&"----- "&ansi_5&"["&ansi_2&"`"&ansi_5&"]"&ansi_15&"Fed "&ansi_15&"---- "&ansi_5&"Page ["&ansi_2&"U"&ansi_5&"]p Chat "&ansi_15&"--"&ansi_5&" Page "&ansi_5&"["&ansi_2&"D"&ansi_5&"]own Chat "&ansi_15&"---- "
loadvar $bot~subspace

if ($ignoreme = true)
	setvar $output $output&ansi_5&"["&ansi_2&"+"&ansi_5&"]Show Me"&ansi_15&" ---------*"
else
	setvar $output $output&ansi_5&"["&ansi_2&"+"&ansi_5&"]Ignore Me"&ansi_15&" -------*"
end

if ($output <> $old_output)
	echo $output
	setvar $old_output $output
end
return

:calctime
setvar $hours 0
setvar $minutes 0
setvar $seconds 0
setvar $testtime $timetologbackin
if ($testtime >= 3600)
	setvar $hours ($testtime / 3600)
	setvar $testtime ($testtime - ($hours * 3600))
end
if ($testtime >= 60)
	setvar $minutes ($testtime / 60)
	setvar $testtime ($testtime - ($minutes * 60))
end
if ($testtime >= 1)
	setvar $seconds $testtime
end
if ($hours < 10)
	setvar $hours 0&$hours
end
if ($minutes < 10)
	setvar $minutes 0&$minutes
end
if ($seconds < 10)
	setvar $seconds 0&$seconds
end
return

:checksilent
:msgs_on_again
killtrigger onmsgs_on
killtrigger onmsgs_off
killtrigger silentdelay
settexttrigger onmsgs_on  :onmsgs_on "Displaying all messages."
settexttrigger onmsgs_off :onmsgs_off "Silencing all messages."
send "|"
pause

:onmsgs_off
killtrigger onmsgs_on
setvar $was_silent false
goto :msgs_on_again

:onmsgs_on
killtrigger onmsgs_off
getdeafclients $bot~botisdeaf
if ($bot~botisdeaf = true)
	gosub :menus~doneprefer
end
killtrigger silentdelay
setdelaytrigger    silentdelay :checksilent 900000
pause

:killchattriggers
killtrigger lookforp
killtrigger lookforr
killtrigger lookforf
killtrigger lookforf2
killtrigger lookforr2
killtrigger lookforselfr
killtrigger lookforselff
killtrigger open
killtrigger talk
killtrigger talk2
killtrigger talk3
killtrigger talk4
killtrigger talk5
killtrigger talk6
killtrigger talk7
killtrigger talk8
killtrigger silentdelay
killtrigger fighit
killtrigger offfighit
killtrigger limpet
killtrigger lookforselfmul
killtrigger enter
killtrigger delay
killtrigger lookforp
killtrigger ignore
killtrigger ignore2
return

#include "source\include\internal_commands"
