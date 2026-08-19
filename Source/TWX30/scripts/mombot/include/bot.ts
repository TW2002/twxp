#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot~killthetriggers
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
killalltriggers
setdelaytrigger unfreezingtrigger :unfreezebot 100000
return

:bot~bigdelay_killthetriggers
killalltriggers
setdelaytrigger unfreezingtriggerbigdelay :unfreezebot 1800000
return

:bot~unfreezebot
echo "*Bot timed out, unfreezing..*"
setdeafclients false
setvar $switchboard~message "Bot frozen for over 100 seconds, resetting...*"
gosub :switchboard~switchboard
goto :wait_for_command

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot~wait_for_command
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
killalltriggers

if (connected)
	setvar $connectivity~relogging false
	savevar $connectivity~relogging
end

setvar $user_interface~routing ""
setvar $user_interface~temp_bot_name ""
loadvar $bot~botisdeaf
loadvar $planet~planet
loadvar $bot~mode
loadvar $bot~in_kill_routine
setvar $bot~alive_count 0
loadvar $map~home_sector
loadvar $map~rylos
loadvar $map~alpha_centauri
loadvar $map~stardock
loadvar $map~backdoor
loadvar $bot~safe_ship
loadvar $bot~bot_turn_limit
loadvar $bot~pgrid_bot
if ($map~stardock <= 0)
	setvar $map~stardock stardock
	savevar $map~stardock
end
if ($map~rylos <= 0)
	setvar $map~rylos rylos
	savevar $map~rylos
end
if ($map~alpha_centauri <= 0)
	setvar $map~alpha_centauri alphacentauri
	savevar $map~alpha_centauri
end

setvar $switchboard~self_command false
setvar $bot~scrubonly false
settextouttrigger user :user_interface~user_access ">"
settextouttrigger uparrow :user_interface~user_access #28
settextouttrigger downarrow :user_interface~user_access #29
settextouttrigger uparrow2 :user_interface~user_access #27&"[A"
settextouttrigger downarrow2 :user_interface~user_access #27&"[B"
settextouttrigger tabkey :user_interface~hotkey_access #9

setvar $user_interface~authorization 0
setvar $user_interface~logged 0
if ($bot~bot_team_name = 0)
	setvar $bot~bot_team_name $bot~bot_name
	savevar $bot~bot_team_name
end
loadvar $bot~last_loaded_module
seteventtrigger shutdownthemodule :internal_commands~shutdown "SCRIPT STOPPED" $bot~last_loaded_module
settextlinetrigger own_command :user_interface~check_routing $bot~bot_name
settextlinetrigger own_command_team :user_interface~check_routing_team $bot~bot_team_name
settextlinetrigger own_command_all :user_interface~check_routing_all "all"
settextlinetrigger loginmemo :internal_commands~loginmemo "a corporate memo "

if (($bot~mode = "General") and (($bot~autoattack = true) and ($bot~in_kill_routine <> true)))
	settextlinetrigger 1 :internal_commands~autokill "warps into the sector."
	settextlinetrigger 2 :internal_commands~autokill "lifts off from"
	settextlinetrigger 3 :internal_commands~autokill "is powering up weapons systems!"
	settextlinetrigger 4 :internal_commands~autokill "enters the game."
	settextlinetrigger 5 :internal_commands~autokill "blasts off from the "
	settextlinetrigger 6 :internal_commands~autokill "Scanners detect a wormhole opening in this sector!"
end
seteventtrigger relog :connectivity~keepalive "CONNECTION LOST"
settexttrigger online_watch :connectivity~online_watch "Your session will be terminated in "
setdelaytrigger keepalive :connectivity~keepalive 60000
pause
pause

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot~save_the_variables
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
savevar $bot~command
savevar $bot~command_typed
savevar $bot~user_command_line
savevar $bot~bot_name
savevar $switchboard~bot_name
savevar $bot~self_command
savevar $switchboard~self_command
savevar $bot~parm1
savevar $bot~parm2
savevar $bot~parm3
savevar $bot~parm4
savevar $bot~parm5
savevar $bot~parm6
savevar $bot~parm7
savevar $bot~parm8
savevar $player~unlimitedgame
setvar $bot~unlimitedgame $player~unlimitedgame
setvar $~unlimitedgame $bot~unlimitedgame
savevar $~unlimitedgame
savevar $bot~unlimitedgame
savevar $ship~cap_file
savevar $planet~planet_file
savevar $bot~bot_turn_limit
savevar $bot~password
savevar $bot~mode
savevar $game~mbbs
savevar $game~ptradesetting
setvar $bot~_ck_ptradesetting $game~ptradesetting
savevar $bot~_ck_ptradesetting
savevar $map~rylos
savevar $map~alpha_centauri
savevar $map~stardock
savevar $map~backdoor
savevar $map~home_sector
savevar $bot~rylos
savevar $bot~alpha_centauri
savevar $bot~stardock
savevar $bot~backdoor
savevar $bot~home_sector
savevar $game~port_max
savevar $game~steal_factor
savevar $game~rob_factor
savevar $bot~subspace
savevar $game~multiple_photons
savevar $bot~alarm_list
savevar $bot~echointerval
if ($bot~bot_password = 0)
	setvar $bot~bot_password $bot~subspace
end
savevar $bot~bot_password
savevar $player~surroundavoidshieldedonly
savevar $player~surroundavoidallplanets
savevar $player~surrounddontavoid
savevar $bot~surroundautocapture
savevar $player~surroundfigs
savevar $player~surroundlimp
savevar $player~surroundmine
savevar $player~dropoffensive
savevar $player~droptoll
savevar $player~fighter_deploy_type
savevar $player~surroundoverwrite
savevar $player~surroundpassive
savevar $player~surroundnormal
savevar $bot~username
savevar $bot~servername
savevar $bot~letter
savevar $player~defendercapping
savevar $player~offensecapping
savevar $bot~safe_ship
savevar $bot~safe_planet
savevar $player~cappingaliens
savevar $player~surround_before_hkill
savevar $bot~command_prompt_extras
savevar $bot~silent_running
savevar $map~planet_list
savevar $bot~startshipname
savevar $bot~mowtodock
savevar $bot~mowtodockbackdoor
savevar $bot~startgamedelay
savevar $bot~isceo
savevar $bot~corpname
savevar $bot~corppassword
savevar $bot~newgameday1
savevar $bot~newgameolder
savevar $bot~pgrid_bot
savevar $bot~autoattack
gosub :bot~backwards_compatible
return

:bot~backwards_compatible
setvar  $safe_ship $bot~safe_ship
savevar $safe_ship
setvar  $safe_planet $bot~safe_planet
savevar $safe_planet
setvar $command $bot~command
savevar $command
setvar $command_typed $bot~command_typed
savevar $command_typed
setvar $user_command_line $bot~user_command_line
savevar $user_command_line
setvar $bot_name $bot~bot_name
savevar $bot_name
setvar $self_command $bot~self_command
savevar $self_command
setvar $command_caller $bot~command_caller
savevar $command_caller
setvar $parm1 $bot~parm1
setvar $parm2 $bot~parm2
setvar $parm3 $bot~parm3
setvar $parm4 $bot~parm4
setvar $parm5 $bot~parm5
setvar $parm6 $bot~parm6
setvar $parm7 $bot~parm7
setvar $parm8 $bot~parm8
if ($parm1 = "")
	setvar $parm1 "0"
end
if ($parm2 = "")
	setvar $parm2 "0"
end
if ($parm3 = "")
	setvar $parm3 "0"
end
if ($parm4 = "")
	setvar $parm4 "0"
end
if ($parm5 = "")
	setvar $parm5 "0"
end
if ($parm6 = "")
	setvar $parm6 "0"
end
if ($parm7 = "")
	setvar $parm7 "0"
end
if ($parm8 = "")
	setvar $parm8 "0"
end
savevar $parm1
savevar $parm2
savevar $parm3
savevar $parm4
savevar $parm5
savevar $parm6
savevar $parm7
savevar $parm8
setvar $rylos $map~rylos
savevar $rylos
setvar $alpha_centauri $map~alpha_centauri
savevar $alpha_centauri
setvar $stardock $map~stardock
savevar $stardock
setvar $backdoor $map~backdoor
savevar $backdoor
setvar $home_sector $map~home_sector
savevar $home_sector
setvar $alarm_list $bot~alarm_list
savevar $alarm_list
setvar $unlimitedgame $player~unlimitedgame
savevar $unlimitedgame
setvar $bot_turn_limit $bot~bot_turn_limit
savevar $bot_turn_limit
setvar $steal_factor $game~steal_factor
setvar $rob_factor $game~rob_factor
setvar $actual_steal_factor $game~actual_steal_factor
setvar $actual_rob_factor $game~actual_rob_factor
savevar $actual_steal_factor
savevar $actual_rob_factor
savevar $steal_factor
savevar $rob_factor
setvar $password $bot~password
savevar $password
setvar $mode $bot~mode
savevar $mode
setvar $silent_running $bot~silent_running
savevar $silent_running
setvar $only_help $bot~only_help
savevar $only_help
setvar $subspace $bot~subspace
savevar $subspace
setvar $letter $bot~letter
savevar $letter
setvar $game_menu_prompt_ansi $game~game_menu_prompt_ansi
setvar $game_menu_prompt $game~game_menu_prompt
setvar $offensecapping $player~offensecapping
setvar $cappingaliens $player~cappingaliens
setvar $atomic_cost $game~atomic_cost
setvar $beacon_cost $game~beacon_cost
setvar $corbo_cost $game~corbo_cost
setvar $cloak_cost $game~cloak_cost
setvar $probe_cost $game~probe_cost
setvar $planet_scanner_cost $game~planet_scanner_cost
setvar $limpet_cost $game~limpet_cost
setvar $armid_cost $game~armid_cost
setvar $photon_cost $game~photon_cost
setvar $holo_cost $game~holo_cost
setvar $density_cost $game~density_cost
setvar $disruptor_cost $game~disruptor_cost
setvar $genesis_cost $game~genesis_cost
setvar $twarpi_cost $game~twarpi_cost
setvar $twarpii_cost $game~twarpii_cost
setvar $psychic_cost $game~psychic_cost
setvar $photons_enabled $game~photons_enabled
setvar $photon_duration $game~photon_duration
setvar $max_commands $game~max_commands
setvar $goldenabled $game~goldenabled
setvar $mbbs $game~mbbs
setvar $multiple_photons $game~multiple_photons
setvar $colonist_regen $game~colonist_regen
setvar $ptradesetting $game~ptradesetting
setvar $clear_bust_days $game~clear_bust_days
setvar $port_max $game~port_max
setvar $production_rate $game~production_rate
setvar $production_regen $game~production_regen
setvar $debris_loss $game~debris_loss
setvar $radiation_lifetime $game~radiation_lifetime
setvar $limpet_removal_cost $game~limpet_removal_cost
setvar $max_planets_per_sector $game~max_planets_per_sector
savevar $game_menu_prompt_ansi
savevar $game_menu_prompt
savevar $offensecapping
savevar $cappingaliens
savevar $atomic_cost
savevar $beacon_cost
savevar $corbo_cost
savevar $cloak_cost
savevar $probe_cost
savevar $planet_scanner_cost
savevar $limpet_cost
savevar $armid_cost
savevar $photon_cost
savevar $holo_cost
savevar $density_cost
savevar $disruptor_cost
savevar $genesis_cost
savevar $twarpi_cost
savevar $twarpii_cost
savevar $psychic_cost
savevar $photons_enabled
savevar $photon_duration
savevar $max_commands
savevar $goldenabled
savevar $mbbs
savevar $multiple_photons
savevar $colonist_regen
savevar $ptradesetting
savevar $clear_bust_days
savevar $port_max
savevar $production_rate
savevar $production_regen
savevar $debris_loss
savevar $radiation_lifetime
savevar $limpet_removal_cost
savevar $max_planets_per_sector
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot~load_the_variables
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
loadvar $bot~corpname
loadvar $game~game_menu_prompt_ansi
loadvar $game~game_menu_prompt
loadvar $bot~alarm_list
loadvar $player~offensecapping
loadvar $player~cappingaliens
loadvar $planet~planet
loadvar $game~atomic_cost
loadvar $game~beacon_cost
loadvar $game~corbo_cost
loadvar $game~cloak_cost
loadvar $game~probe_cost
loadvar $game~planet_scanner_cost
loadvar $game~limpet_cost
loadvar $game~armid_cost
loadvar $game~photon_cost
loadvar $game~holo_cost
loadvar $game~density_cost
loadvar $game~disruptor_cost
loadvar $game~genesis_cost
loadvar $game~twarpi_cost
loadvar $game~twarpii_cost
loadvar $game~psychic_cost
loadvar $game~photons_enabled
loadvar $game~photon_duration
loadvar $game~max_commands
loadvar $game~goldenabled
loadvar $game~mbbs
loadvar $game~multiple_photons
loadvar $game~colonist_regen
loadvar $game~ptradesetting
loadvar $game~steal_factor
loadvar $game~rob_factor
loadvar $game~clear_bust_days
loadvar $game~port_max
loadvar $game~production_rate
loadvar $game~production_regen
loadvar $game~debris_loss
loadvar $game~radiation_lifetime
loadvar $game~limpet_removal_cost
loadvar $game~max_planets_per_sector
loadvar $bot~subspace
loadvar $bot~password
loadvar $bot~bot_password
if ($bot~bot_password = 0)
	setvar $bot~bot_password $bot~subspace
	savevar $bot~bot_password
end
loadvar $player~surroundavoidshieldedonly
loadvar $bot~surroundautocapture
loadvar $player~surroundavoidallplanets
loadvar $player~surrounddontavoid
loadvar $map~stardock
loadvar $map~backdoor
loadvar $map~rylos
loadvar $map~alpha_centauri
loadvar $map~home_sector
loadvar $player~surroundfigs
loadvar $player~surroundlimp
loadvar $player~surroundmine
loadvar $bot~bot_name
setvar $switchboard~bot_name $bot~bot_name
loadvar $player~surroundoverwrite
loadvar $player~surroundpassive
loadvar $player~surroundnormal
loadvar $bot~username
loadvar $bot~servername
loadvar $bot~letter
loadvar $player~defendercapping
loadvar $bot~bot_turn_limit
loadvar $bot~safe_ship
loadvar $bot~pgrid_bot
loadvar $bot~safe_planet
loadvar $bot~corppassword
loadvar $bot~bot_team_name
loadvar $bot~historystring
loadvar $bot~dorelog
loadvar $player~surround_before_hkill
loadvar $bot~command_prompt_extras
loadvar $bot~silent_running
loadvar $bot~autoattack
loadvar $player~fighter_deploy_type
loadvar $player~dropoffensive
loadvar $player~droptoll
gosub :loadvars~normalize_deploy_preferences
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot~migrate_game_folder
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
direxists $bot~legacy_folder_exists $bot~legacy_folder
if ($bot~legacy_folder_exists = 0)
	return
end

setvar $bot~migrate_file "bot.cfg"
gosub :bot~migrate_game_file
setvar $bot~migrate_file "bot_users.lst"
gosub :bot~migrate_game_file
setvar $bot~migrate_file "_ck_"&gamename&".figs"
gosub :bot~migrate_game_file
setvar $bot~migrate_file "ships.cfg"
gosub :bot~migrate_game_file
setvar $bot~migrate_file "dbonus-ships.cfg"
gosub :bot~migrate_game_file
setvar $bot~migrate_file "planets.cfg"
gosub :bot~migrate_game_file
setvar $bot~migrate_file "fighters.cfg"
gosub :bot~migrate_game_file
setvar $bot~migrate_file "fighters.cnt"
gosub :bot~migrate_game_file
setvar $bot~migrate_file "limpets.cfg"
gosub :bot~migrate_game_file
setvar $bot~migrate_file "limpets.cnt"
gosub :bot~migrate_game_file
setvar $bot~migrate_file "armids.cfg"
gosub :bot~migrate_game_file
setvar $bot~migrate_file "armids.cnt"
gosub :bot~migrate_game_file
setvar $bot~migrate_file "game_settings.cfg"
gosub :bot~migrate_game_file
setvar $bot~migrate_file "timer.cfg"
gosub :bot~migrate_game_file
setvar $bot~migrate_file "busts.cfg"
gosub :bot~migrate_game_file
setvar $bot~migrate_file "planet.nego"
gosub :bot~migrate_game_file
setvar $bot~migrate_file "bubble.list"
gosub :bot~migrate_game_file
setvar $bot~migrate_file "No_Credits.list"
gosub :bot~migrate_game_file
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot~migrate_game_file
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $bot~migrate_source $bot~legacy_folder&"/"&$bot~migrate_file
setvar $bot~migrate_dest $bot~folder&"/"&$bot~migrate_file
fileexists $bot~migrate_source_exists $bot~migrate_source
if ($bot~migrate_source_exists)
	fileexists $bot~migrate_dest_exists $bot~migrate_dest
	if ($bot~migrate_dest_exists = 0)
		rename $bot~migrate_source $bot~migrate_dest
	end
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot~getinitial_settings
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $connectivity~relogging false
savevar $connectivity~relogging
loadvar $game~gamestats
setvar $bot~pgrid_type "Normal"
setvar $bot~pgrid_end_command " scan "
getword currentline $player~startinglocation 1
fileexists $bot~script_file_chk $bot~script_file
if ($bot~script_file_chk)
	setarray $bot~hotkey_scripts 10 1
	setvar $bot~i 1
	setvar $bot~hotkey_scripts 0
	read $bot~script_file $bot~line $bot~i
	while ($bot~line <> "EOF")
		getword $bot~line $bot~filelocation 1
		getwordpos $bot~line $bot~pos #34
		if ($bot~pos <= 0)
			echo "Error with script file. either remove "&$bot~script_file&", or fix it*"
			halt
		end
		cuttext $bot~line $bot~scriptname $bot~pos 9999
		striptext $bot~scriptname #34
		setvar $bot~hotkey_scripts[$bot~i] $bot~filelocation
		setvar $bot~hotkey_scripts[$bot~i][1] $bot~scriptname
		add $bot~i 1
		add $bot~hotkey_scripts 1
		read $bot~script_file $bot~line $bot~i
	end
else
	setarray $bot~hotkey_scripts 10 1
end

fileexists $bot~gfile_chk $bot~gconfig_file
if ($bot~gfile_chk)
	loadvar $game~mbbs
	loadvar $game~steal_factor
	loadvar $game~rob_factor
	loadvar $game~ptradesetting
	loadvar $game~port_max
	loadvar $player~unlimitedgame
	setvar $bot~dorelog true
	savevar $bot~dorelog
	read $bot~gconfig_file $bot~bot_name 1
	setvar $switchboard~bot_name $bot~bot_name
	if (connected = true)
		gosub :player~quikstats
		setvar $player~startinglocation $player~current_prompt
	end
	if ((($player~startinglocation = "Command") or ($player~startinglocation = "Citadel")) and (connected = true))
		if ($game~ptradesetting = 0)
			gosub :game~gamestats
		end
		gosub :player~getinfo
		gosub :ship~getshipstats

		fileexists $ship~cap_file_chk $ship~cap_file
		if ($ship~cap_file_chk)
			gosub :ship~loadshipinfo
		else
			gosub :ship~getshipcapstats
			gosub :ship~loadshipinfo
		end
		fileexists $planet~planet_file_chk $planet~planet_file
		if ($planet~planet_file_chk)
			gosub :planet~loadplanetinfo
		else
			gosub :planet~getplanetstats
			gosub :planet~loadplanetinfo
		end
	else
		fileexists $ship~cap_file_chk $ship~cap_file
		if ($ship~cap_file_chk)
			gosub :ship~loadshipinfo
		end
		fileexists $planet~planet_file_chk $planet~planet_file
		if ($planet~planet_file_chk)
			gosub :planet~loadplanetinfo
		end
	end
else

	:bot~conf_bot
	setvar $player~surroundfigs 1
	savevar $player~surroundfigs
	if (connected = true)
		gosub :player~quikstats
	end
	echo ansi_13
	echo "*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-"
	echo "*  Getting intial settings for M()M Bot . . . *"
	echo "*  Game is not set up for M()M Bot, doing that now. "
	echo "*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-**"
	setdelaytrigger woah :keep_going 200
	pause
	pause

	:bot~keep_going
	gosub :menus~add_game
	if ((($player~startinglocation = "Command") or ($player~startinglocation = "Citadel")) and (connected = true))
		gosub :game~gamestats
		gosub :player~quikstats
		gosub :player~getinfo
		fileexists $ship~cap_file_chk $ship~cap_file
		if ($ship~cap_file_chk)
			gosub :ship~loadshipinfo
		else
			gosub :ship~getshipcapstats
			gosub :ship~loadshipinfo
		end
		fileexists $planet~planet_file_chk $planet~planet_file
		if ($planet~planet_file_chk)
			gosub :planet~loadplanetinfo
		else
			gosub :planet~getplanetstats
			gosub :planet~loadplanetinfo
		end

		echo ansi_13
		echo "*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-"
		echo "*  M()M Bot initialization completed . . .  *"
		echo "*  You should be setup and ready to go! "
		echo "*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-**"
	else
		fileexists $ship~cap_file_chk $ship~cap_file
		if ($ship~cap_file_chk)
			gosub :ship~loadshipinfo
		end
		fileexists $planet~planet_file_chk $planet~planet_file
		if ($planet~planet_file_chk)
			gosub :planet~loadplanetinfo
		end
		echo "*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-"
		echo "*  You weren't connected to the game when starting "
		echo "*    so you will want to reboot or refresh once "
		echo "* connected into the game to properly configure bot. "
		echo "*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-**"
	end
end

getsectorparameter 2 "FIG_COUNT" $bot~figcount
if ($bot~figcount = "")
	setsectorparameter 2 "FIG_COUNT" 0
end
loadvar $bot~echointerval
if ($bot~echointerval <= 0)
	setvar $bot~echointerval 5760
	savevar $bot~echointerval
end
setvar $bot~botisoff false
gosub :load_the_variables
if (($player~surroundavoidshieldedonly = false) and (($bot~surroundautocapture = false) and (($player~surroundavoidallplanets = false) and ($player~surrounddontavoid = false))))
	setvar $player~surroundavoidallplanets true
end
if ($bot~bot_team_name = 0)
	setvar $bot~bot_team_name $bot~bot_name
end
if ($bot~password = 0)
	setvar $bot~password password
end
if ($bot~username = 0)
	setvar $bot~username loginname
end
if ($bot~letter = 0)
	setvar $bot~letter game
end
if ($map~stardock <= 0)
	setvar $map~stardock stardock
	savevar $map~stardock
end
if ($map~rylos <= 0)
	setvar $map~rylos rylos
	savevar $map~rylos
end
if ($map~alpha_centauri <= 0)
	setvar $map~alpha_centauri alphacentauri
	savevar $map~alpha_centauri
end
gosub :save_the_variables

getfilelist $bot~startup_scripts "scripts\"&$bot~mombot_directory&"\startups\*.cts"
setvar $bot~i 1
while ($bot~i <= $bot~startup_scripts)
	stop "scripts\"&$bot~mombot_directory&"\startups\"&$bot~startup_scripts[$bot~i]
	stop "scripts\"&$bot~mombot_directory&"\startups\"&$bot~startup_scripts[$bot~i]
	stop "scripts\"&$bot~mombot_directory&"\startups\"&$bot~startup_scripts[$bot~i]
	stop "scripts\"&$bot~mombot_directory&"\startups\"&$bot~startup_scripts[$bot~i]
	setvar $bot~command $bot~startup_scripts[$bot~i]
	replacetext $bot~command ".cts" ""
	savevar $bot~command
	load "scripts\"&$bot~mombot_directory&"\startups\"&$bot~startup_scripts[$bot~i]
	add $bot~i 1
end

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot~run_bot
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if ((($player~startinglocation = "Citadel") or ($player~startinglocation = "Command")) and (connected = true))
	gosub :player~startcnsettings
	killalltriggers
	gosub :player~getinfo
	if ($player~corp <> 0)
		setvar $bot~my_name $player~trader_name
		trim $bot~my_name
		setvar $switchboard~message "Logging corp mates automatically - "
		if ($player~startinglocation = "Citadel")
			send "xa"
		else
			send "ta"
		end
		waiton "    Corp Member Name                   Sector  Fighters Shields Mines  Credits"
		waiton "------------------------------------------------------------------------------"

		:bot~ta_again
		settextlinetrigger taline :ta_check
		pause

		:bot~ta_check
		getwordpos currentline $bot~pos "P indicates Trader is on a planet in that sector"
		getwordpos currentline $bot~pos2 "Corporate command ["
		if (($bot~pos > 0) or ($bot~pos2 > 0))
			goto :done_ta
		end
		setvar $bot~line currentline
		getlength currentline $bot~length
		if ($bot~length > 30)
			setvar $bot~line currentline
			cuttext $bot~line $bot~name 1 30
			replacetext $bot~line $bot~name ""
			trim $bot~name
			if ($bot~name <> $bot~my_name)
				add $bot~corpycount 1
				setvar $bot~corpy[$bot~corpycount] $bot~name
				getword $bot~line $bot~corpy[$bot~corpycount][1] 1
			end
		else
			goto :done_ta
		end
		goto :ta_again

		:bot~done_ta
		send "q"
		if ($player~startinglocation = "Citadel")
			waiton "Citadel command ("
		else
			waiton "Command ["
		end
	end
	setvar $switchboard~message "is ACTIVE: Version - "&$bot~major_version&"."&$bot~minor_version " - type " #34 $bot~bot_name " help" #34 " for command list*"
	gosub :switchboard~switchboard
	setvar $switchboard~message "to login - send a corporate memo*"
	gosub :switchboard~switchboard
	if (($bot~username = "") or ($bot~letter = "") or ($bot~dorelog = false))
		setvar $switchboard~message "Auto Relog - Not Active*"
		gosub :switchboard~switchboard
		setvar $bot~dorelog false
	end

	fileexists $bot~team_file_check $bot~bot_user_file
	if ($bot~team_file_check)
		setarray $bot~corp_list 1
		readtoarray $bot~bot_user_file $bot~corp_list
		setvar $bot~i 1
		while ($bot~i <= $bot~corp_list)
			setvar $bot~j 1
			setvar $bot~isfound false
			while ($bot~j <= $bot~corpycount)
				setvar $bot~corpy_lower $bot~corpy[$bot~j]
				setvar $bot~corp_list_lower $bot~corp_list[$bot~i]
				lowercase $bot~corpy_lower
				lowercase $bot~corp_list_lower
				if ($bot~corp_list_lower = $bot~corpy_lower)
					setvar $bot~isfound true
				end
				add $bot~j 1
			end
			if ($bot~isfound <> true)
				add $bot~corpycount 1
				setvar $bot~corpy[$bot~corpycount] $bot~corp_list[$bot~i]
			end
			add $bot~i 1
		end
	end
	delete $bot~bot_user_file
	setvar $bot~i 1
	while ($bot~i <= $bot~corpycount)
		setvar $switchboard~message $switchboard~message&$bot~corpy[$bot~i]&", "
		write $bot~bot_user_file $bot~corpy[$bot~i]
		add $bot~i 1
	end
	if ($bot~corpycount > 0)
		replacetext $switchboard~message $bot~corpy[$bot~corpycount]&", " $bot~corpy[$bot~corpycount]
		if ($bot~corpycount = 1)
			setvar $switchboard~message $switchboard~message&" is added.*"
		else
			replacetext $switchboard~message $bot~corpy[$bot~corpycount] "and "&$bot~corpy[$bot~corpycount]
			setvar $switchboard~message $switchboard~message&" are added.*"
		end
		gosub :switchboard~switchboard
	end
else
	fileexists $bot~team_file_check $bot~bot_user_file
	if ($bot~team_file_check)
		setarray $bot~corp_list 1
		readtoarray $bot~bot_user_file $bot~corp_list
		setvar $bot~i 1
		while ($bot~i <= $bot~corp_list)
			setvar $bot~j 1
			setvar $bot~isfound false
			while ($bot~j <= $bot~corpycount)
				setvar $bot~corpy_lower $bot~corpy[$bot~j]
				setvar $bot~corp_list_lower $bot~corp_list[$bot~i]
				lowercase $bot~corpy_lower
				lowercase $bot~corp_list_lower
				if ($bot~corp_list_lower = $bot~corpy_lower)
					setvar $bot~isfound true
				end
				add $bot~j 1
			end
			if ($bot~isfound <> true)
				add $bot~corpycount 1
				setvar $bot~corpy[$bot~corpycount] $bot~corp_list[$bot~i]
			end
			add $bot~i 1
		end
	end
	echo "*{" $bot~bot_name "} is ACTIVE: Version - "&$bot~major_version&"."&$bot~minor_version " - type " #34 $bot~bot_name " help" #34 " for command list*"
	if (($bot~username = "") or ($bot~letter = "") or ($bot~dorelog = false))
		echo "{"&$bot~bot_name&"} - Auto Relog - Not Active*"
		setvar $bot~dorelog false
	end
end
savevar $bot~bot_name

:bot~initiate_bot
loadvar $bot~isshipdestroyed
if (connected <> true)
	goto :menus~pregamemenuload
else
	setvar $bot~isshipdestroyed false
	savevar $bot~isshipdestroyed
end

goto :wait_for_command

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot~load_watcher_variables
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
loadvar $ship~ship_max_attack
loadvar $ship~ship_fighters_max
loadvar $ship~ship_offensive_odds
loadvar $planet~planet
loadvar $player~current_sector
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot~enter_menu_deaf
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if ($bot~menu_deaf_depth <= 0)
	getdeafclients $bot~menu_deaf_restore
end
add $bot~menu_deaf_depth 1
setdeafclients true
setvar $bot~botisdeaf true
savevar $bot~botisdeaf
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot~init_hotkey_defaults
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setarray $bot~hotkeys 255
setarray $bot~custom_keys 33
setarray $bot~custom_commands 33
setvar $bot~custom_keys[1] "K"
setvar $bot~custom_keys[2] "C"
setvar $bot~custom_keys[3] "R"
setvar $bot~custom_keys[4] "S"
setvar $bot~custom_keys[5] "H"
setvar $bot~custom_keys[6] "T"
setvar $bot~custom_keys[7] "P"
setvar $bot~custom_keys[8] "Q"
setvar $bot~custom_keys[9] "L"
setvar $bot~custom_keys[10] #9
setvar $bot~custom_keys[11] "D"
setvar $bot~custom_keys[12] "X"
setvar $bot~custom_keys[13] "M"
setvar $bot~custom_keys[14] "F"
setvar $bot~custom_keys[15] "Z"
setvar $bot~custom_keys[16] "~"
setvar $bot~custom_keys[17] "B"
setvar $bot~custom_commands[1] ":INTERNAL_COMMANDS~autokill"
setvar $bot~custom_commands[2] ":INTERNAL_COMMANDS~autocap"
setvar $bot~custom_commands[3] ":INTERNAL_COMMANDS~autorefurb"
setvar $bot~custom_commands[4] ":INTERNAL_COMMANDS~surround"
setvar $bot~custom_commands[5] ":INTERNAL_COMMANDS~htorp"
setvar $bot~custom_commands[6] ":INTERNAL_COMMANDS~twarpswitch"
setvar $bot~custom_commands[7] ":INTERNAL_COMMANDS~kit"
setvar $bot~custom_commands[8] ":USER_INTERFACE~script_access"
setvar $bot~custom_commands[9] ":INTERNAL_COMMANDS~hkill"
setvar $bot~custom_commands[10] ":INTERNAL_COMMANDS~stopModules"
setvar $bot~custom_commands[11] ":INTERNAL_COMMANDS~kit"
setvar $bot~custom_commands[12] ":INTERNAL_COMMANDS~xenter"
setvar $bot~custom_commands[13] ":INTERNAL_COMMANDS~mowswitch"
setvar $bot~custom_commands[14] ":INTERNAL_COMMANDS~fotonswitch"
setvar $bot~custom_commands[15] ":INTERNAL_COMMANDS~clear"
setvar $bot~custom_commands[16] ":MENUS~preferencesMenu"
setvar $bot~custom_commands[17] ":INTERNAL_COMMANDS~dock_shopper"
gosub :bot~rebuild_hotkey_index
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot~load_hotkey_config
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
gosub :bot~init_hotkey_defaults
fileexists $bot~config_exists $bot~mombot_config_file
if ($bot~config_exists)
	readtoarray $bot~mombot_config_file $bot~hotkey_config_lines
	if ($bot~hotkey_config_lines = 33)
		gosub :bot~apply_hotkey_config
		if ($bot~hotkey_config_valid = true)
			delete "scripts/"&$bot~mombot_directory&"/hotkeys.cfg"
			delete "scripts/"&$bot~mombot_directory&"/custom_keys.cfg"
			delete "scripts/"&$bot~mombot_directory&"/custom_commands.cfg"
			return
		end
	end
end

fileexists $bot~legacy_keys_exist "scripts/"&$bot~mombot_directory&"/custom_keys.cfg"
fileexists $bot~legacy_commands_exist "scripts/"&$bot~mombot_directory&"/custom_commands.cfg"
if ($bot~legacy_keys_exist and $bot~legacy_commands_exist)
	readtoarray "scripts/"&$bot~mombot_directory&"/custom_keys.cfg" $bot~custom_keys
	readtoarray "scripts/"&$bot~mombot_directory&"/custom_commands.cfg" $bot~custom_commands
	if (($bot~custom_keys = 33) and ($bot~custom_commands = 33))
		gosub :bot~rebuild_hotkey_index
		gosub :bot~write_hotkey_config
		return
	end
end

gosub :bot~init_hotkey_defaults
gosub :bot~write_hotkey_config
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot~apply_hotkey_config
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $bot~hotkey_config_valid true
setarray $bot~hotkeys 255
setarray $bot~custom_keys 33
setarray $bot~custom_commands 33
setvar $bot~i 1
while ($bot~i <= 33)
	setvar $bot~hotkey_config_line $bot~hotkey_config_lines[$bot~i]
	trim $bot~hotkey_config_line
	if ($bot~hotkey_config_line = "")
		setvar $bot~hotkey_config_valid false
		return
	end

	splittext $bot~hotkey_config_line $bot~hotkey_config_parts "$"
	if ($bot~hotkey_config_parts >= 3)
		setvar $bot~hotkey_slot_token $bot~hotkey_config_parts[1]
		trim $bot~hotkey_slot_token
		if ($bot~hotkey_slot_token <> $bot~i)
			setvar $bot~hotkey_config_valid false
			return
		end
		setvar $bot~hotkey_key_token $bot~hotkey_config_parts[2]
		setvar $bot~hotkey_command_token $bot~hotkey_config_parts[3]
	elseif ($bot~hotkey_config_parts = 2)
		setvar $bot~hotkey_key_token $bot~hotkey_config_parts[1]
		setvar $bot~hotkey_command_token $bot~hotkey_config_parts[2]
	else
		setvar $bot~hotkey_config_valid false
		return
	end

	trim $bot~hotkey_key_token
	trim $bot~hotkey_command_token
	gosub :bot~decode_hotkey_token
	if ($bot~hotkey_key_valid <> true)
		setvar $bot~hotkey_config_valid false
		return
	end

	if ($bot~hotkey_command_token = "")
		setvar $bot~hotkey_command_token "0"
	end

	setvar $bot~custom_keys[$bot~i] $bot~hotkey_decoded_key
	setvar $bot~custom_commands[$bot~i] $bot~hotkey_command_token
	add $bot~i 1
end

gosub :bot~rebuild_hotkey_index
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot~rebuild_hotkey_index
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setarray $bot~hotkeys 255
setvar $bot~i 1
while ($bot~i <= 33)
	setvar $bot~hotkey_key_token $bot~custom_keys[$bot~i]
	gosub :bot~decode_hotkey_token
	if (($bot~hotkey_key_valid = true) and ($bot~hotkey_decoded_key <> "0"))
		setvar $bot~hotkey_temp $bot~hotkey_decoded_key
		lowercase $bot~hotkey_temp
		getcharcode $bot~hotkey_temp $bot~hotkey_lower
		setvar $bot~hotkey_temp $bot~hotkey_decoded_key
		uppercase $bot~hotkey_temp
		getcharcode $bot~hotkey_temp $bot~hotkey_upper
		if ($bot~hotkey_lower > 0)
			setvar $bot~hotkeys[$bot~hotkey_lower] $bot~i
		end
		if ($bot~hotkey_upper > 0)
			setvar $bot~hotkeys[$bot~hotkey_upper] $bot~i
		end
	end
	add $bot~i 1
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot~decode_hotkey_token
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $bot~hotkey_key_valid true
setvar $bot~hotkey_decoded_key $bot~hotkey_key_token
trim $bot~hotkey_decoded_key
uppercase $bot~hotkey_decoded_key
if (($bot~hotkey_decoded_key = "") or ($bot~hotkey_decoded_key = "0"))
	setvar $bot~hotkey_decoded_key "0"
elseif ($bot~hotkey_decoded_key = "TAB")
	setvar $bot~hotkey_decoded_key #9
elseif ($bot~hotkey_decoded_key = "ENTER")
	setvar $bot~hotkey_decoded_key #13
elseif ($bot~hotkey_decoded_key = "BACKSPACE")
	setvar $bot~hotkey_decoded_key #8
elseif ($bot~hotkey_decoded_key = "SPACE")
	setvar $bot~hotkey_decoded_key " "
else
	cuttext $bot~hotkey_key_token $bot~hotkey_decoded_key 1 1
	if ($bot~hotkey_decoded_key = "")
		setvar $bot~hotkey_key_valid false
	end
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot~encode_hotkey_token
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $bot~hotkey_encoded_key $bot~hotkey_key_token
if (($bot~hotkey_encoded_key = "") or ($bot~hotkey_encoded_key = "0"))
	setvar $bot~hotkey_encoded_key "0"
elseif ($bot~hotkey_encoded_key = #9)
	setvar $bot~hotkey_encoded_key "TAB"
elseif ($bot~hotkey_encoded_key = #13)
	setvar $bot~hotkey_encoded_key "ENTER"
elseif ($bot~hotkey_encoded_key = #8)
	setvar $bot~hotkey_encoded_key "BACKSPACE"
elseif ($bot~hotkey_encoded_key = " ")
	setvar $bot~hotkey_encoded_key "SPACE"
else
	cuttext $bot~hotkey_encoded_key $bot~hotkey_encoded_key 1 1
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot~write_hotkey_config
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
delete $bot~mombot_config_file
setvar $bot~i 1
while ($bot~i <= 33)
	setvar $bot~hotkey_key_token $bot~custom_keys[$bot~i]
	gosub :bot~encode_hotkey_token
	setvar $bot~hotkey_command_token $bot~custom_commands[$bot~i]
	if (($bot~hotkey_command_token = "") or ($bot~hotkey_command_token = 0))
		setvar $bot~hotkey_command_token "0"
	end
	write $bot~mombot_config_file $bot~i&"$"&$bot~hotkey_encoded_key&"$"&$bot~hotkey_command_token
	add $bot~i 1
end

delete "scripts/"&$bot~mombot_directory&"/hotkeys.cfg"
delete "scripts/"&$bot~mombot_directory&"/custom_keys.cfg"
delete "scripts/"&$bot~mombot_directory&"/custom_commands.cfg"
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot~exit_menu_deaf
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if ($bot~menu_deaf_depth > 0)
	subtract $bot~menu_deaf_depth 1
end

if ($bot~menu_deaf_depth <= 0)
	if ($bot~menu_deaf_restore = true)
		setdeafclients true
		setvar $bot~botisdeaf true
	else
		setdeafclients false
		setvar $bot~botisdeaf false
	end
	savevar $bot~botisdeaf
end

return

:bot~dosplashscreen
setdelaytrigger draw_delay :draw_delay 500
pause
pause

:draw_delay
echo ansi_4 "***"
echo ansi_4 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
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
echo "[0m*[1;33m       Created by: The Bounty Hunter, Mind Dagger, Lonestar, and Hammer[0m*[1;33m                    Testing by: Misbehavin and DaCreeper**"
echo "[0m*[1;33m       Credits: Oz, Zentock, SupG, Dynarri, Cherokee, Alexio, Xide,"
echo "[0m*[1;33m                Phx, Rincrast, Voltron, Traitor, Parrothead, PSI,"
echo "[0m*[1;33m                Elder Prophet, Caretaker, Deign, Rider, Shadow*"

echo "**"&ansi_14 "       Version: " ansi_15 $bot~major_version "." $bot~minor_version "*"
echo ansi_4 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "***"

return

include "source\include\user_interface"
include "source\include\player"
include "source\include\menus"
include "source\include\combat"
include "source\include\game"
include "source\include\planet"
include "source\include\map"
include "source\include\connectivity"
include "source\include\loadvars"
