	gosub :BOT~loadVars

	setArray $INTERNALCOMMANDLISTS 7
	setVar $bot~internalCommandLists[1]  " stopall stop listall reset emq bot relog tow refresh login logoff unlock lift with dep callin about cn extern twarp bwarp pwarp relog help switchbot "
	setVar $bot~internalCommandLists[2]  " " 
	setVar $bot~internalCommandLists[3]  " hkill kill htorp "
	setVar $bot~internalCommandLists[4]  " refurb scrub "
	setVar $bot~internalCommandLists[5]  " surround exit xenter mow "
	setVar $bot~internalCommandLists[6]  " "
	setVar $bot~internalCommandLists[7]  " find pscan sector storeship setvar getvar "
	setVar $bot~doubledCommandList       " parm params parms qss sec sect secto cn9 logout emx smow port shipstore finder xenter status pinfo holotorp"
	setVar $bot~internalCommandList     $bot~internalCommandLists[1]&$bot~internalCommandLists[2]&$bot~internalCommandLists[3]&bot~$internalCommandLists[4]&$bot~internalCommandLists[5]&$bot~internalCommandLists[6]&$bot~internalCommandLists[7]
	setArray $bot~TYPES 7
	setVar $bot~TYPES[1] "General"
	setVar $bot~TYPES[2] "Defense"
	setVar $bot~TYPES[3] "Offense"
	setVar $bot~TYPES[4] "Resource"
	setVar $bot~TYPES[5] "Grid"
	setVar $bot~TYPES[6] "Cashing"
	setVar $bot~TYPES[7] "Data"
	setArray $bot~CATAGORIES 3
	setVar $bot~CATAGORIES[1] "Modes"
	setVar $bot~CATAGORIES[2] "Commands"
	setVar $bot~CATAGORIES[3] "Daemons"



goto :USER_INTERFACE~runUserCommandLine

halt



:bot~load_watcher_variables
	loadVar $SHIP~SHIP_MAX_ATTACK
	loadVar $SHIP~SHIP_FIGHTERS_MAX
	loadVar $SHIP~SHIP_OFFENSIVE_ODDS
	loadVar $PLANET~PLANET
	loadVar $PLAYER~CURRENT_SECTOR
return


:MAIN~module_vars
	saveVar $bot~command
	saveVar $bot~user_command_line
	setVar $switchboard~bot_name $bot~bot_name
	saveVar $switchboard~bot_name
	savevar $bot~name
	saveVar $bot~parm1
	saveVar $bot~parm2
	saveVar $bot~parm3
	saveVar $bot~parm4
	saveVar $bot~parm5
	saveVar $bot~parm6
	saveVar $bot~parm7
	saveVar $bot~parm8
	saveVar $bot~bot_turn_limit
	saveVar $player~unlimitedGame
	gosub :MAIN~backwards_compatible
return

:bot~wait_for_command
halt


:MAIN~backwards_compatible
	setVar  $safe_ship $bot~safe_ship
	saveVar $safe_ship
	setVar  $safe_planet $bot~safe_planet
	saveVar $safe_planet
	setVar $command $bot~command
	saveVar $command
	setvar $user_command_line $bot~user_command_line
	saveVar $user_command_line
	setVar $bot_name $bot~bot_name
	saveVar $bot_name
	setVar $self_command $bot~self_command
	saveVar $self_command
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
	saveVar $parm1
	saveVar $parm2
	saveVar $parm3
	saveVar $parm4
	saveVar $parm5
	saveVar $parm6
	saveVar $parm7
	saveVar $parm8
	setVar $rylos $map~rylos
	saveVar $rylos
	setVar $alpha_centauri $map~alpha_centauri
	saveVar $alpha_centauri
	setVar $stardock $map~stardock
	saveVar $stardock
	setVar $backdoor $map~backdoor
	saveVar $backdoor
	setVar $home_sector $map~home_sector
	saveVar $home_sector
	setVar $alarm_list $bot~alarm_list
	saveVar $alarm_list
	setVar $unlimitedGame $player~unlimitedGame
	saveVar $unlimitedGame
	setVar $bot_turn_limit $bot~bot_turn_limit
	saveVar $bot_turn_limit
	setVar $steal_factor $game~steal_factor
	setVar $rob_factor $game~rob_factor
	setVar $actual_steal_factor $game~actual_steal_factor
	setVar $actual_rob_factor $game~actual_rob_factor
	saveVar $actual_steal_factor
	saveVar $actual_rob_factor
	saveVar $steal_factor
	saveVar $rob_factor
	setVar $password $bot~password
	saveVar $password
	setVar $mode $bot~mode
	saveVar $mode
	setVar $subspace $bot~subspace
	saveVar $subspace
	setvar $letter $bot~letter
	savevar $letter
	setvar $game_menu_prompt_ansi $game~game_menu_prompt_ansi
	setvar $game_menu_prompt $game~game_menu_prompt
	setvar $offenseCapping $PLAYER~offenseCapping
	setvar $cappingAliens $PLAYER~cappingAliens
	setvar $ATOMIC_COST $GAME~ATOMIC_COST
	setvar $BEACON_COST $GAME~BEACON_COST
	setvar $CORBO_COST $GAME~CORBO_COST
	setvar $CLOAK_COST $GAME~CLOAK_COST
	setvar $PROBE_COST $GAME~PROBE_COST
	setvar $PLANET_SCANNER_COST $GAME~PLANET_SCANNER_COST
	setvar $LIMPET_COST $GAME~LIMPET_COST
	setvar $ARMID_COST $GAME~ARMID_COST
	setvar $PHOTON_COST $GAME~PHOTON_COST
	setvar $HOLO_COST $GAME~HOLO_COST
	setvar $DENSITY_COST $GAME~DENSITY_COST
	setvar $DISRUPTOR_COST $GAME~DISRUPTOR_COST
	setvar $GENESIS_COST $GAME~GENESIS_COST
	setvar $TWARPI_COST $GAME~TWARPI_COST
	setvar $TWARPII_COST $GAME~TWARPII_COST
	setvar $PSYCHIC_COST $GAME~PSYCHIC_COST
	setvar $PHOTONS_ENABLED $GAME~PHOTONS_ENABLED
	setvar $PHOTON_DURATION $GAME~PHOTON_DURATION
	setvar $MAX_COMMANDS $GAME~MAX_COMMANDS
	setvar $goldEnabled $GAME~goldEnabled
	setvar $mbbs $GAME~mbbs
	setvar $MULTIPLE_PHOTONS $GAME~MULTIPLE_PHOTONS
	setvar $colonist_regen $GAME~colonist_regen
	setvar $ptradesetting $GAME~ptradesetting
	setvar $CLEAR_BUST_DAYS $GAME~CLEAR_BUST_DAYS
	setvar $port_max $GAME~port_max
	setvar $PRODUCTION_RATE $GAME~PRODUCTION_RATE
	setvar $PRODUCTION_REGEN $GAME~PRODUCTION_REGEN
	setvar $DEBRIS_LOSS $GAME~DEBRIS_LOSS
	setvar $RADIATION_LIFETIME $GAME~RADIATION_LIFETIME
	setvar $LIMPET_REMOVAL_COST $GAME~LIMPET_REMOVAL_COST
	setvar $MAX_PLANETS_PER_SECTOR $GAME~MAX_PLANETS_PER_SECTOR
	savevar $game_menu_prompt_ansi 
	savevar $game_menu_prompt 
	savevar $offenseCapping
	savevar $cappingAliens
	savevar $ATOMIC_COST 
	savevar $BEACON_COST 
	savevar $CORBO_COST 
	savevar $CLOAK_COST 
	savevar $PROBE_COST 
	savevar $PLANET_SCANNER_COST 
	savevar $LIMPET_COST 
	savevar $ARMID_COST 
	savevar $PHOTON_COST 
	savevar $HOLO_COST 
	savevar $DENSITY_COST 
	savevar $DISRUPTOR_COST 
	savevar $GENESIS_COST 
	savevar $TWARPI_COST 
	savevar $TWARPII_COST 
	savevar $PSYCHIC_COST 
	savevar $PHOTONS_ENABLED 
	savevar $PHOTON_DURATION 
	savevar $MAX_COMMANDS 
	savevar $goldEnabled 
	savevar $mbbs 
    savevar $MULTIPLE_PHOTONS 
	savevar $colonist_regen 
	savevar $ptradesetting 
	savevar $CLEAR_BUST_DAYS 
    savevar $port_max 
    savevar $PRODUCTION_RATE 
    savevar $PRODUCTION_REGEN 
    savevar $DEBRIS_LOSS 
    savevar $RADIATION_LIFETIME 
    savevar $LIMPET_REMOVAL_COST 
    savevar $MAX_PLANETS_PER_SECTOR 
return

#-=-=-=-=-includes-=-=-=-=-
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\bot\internal_commands"
include "source\bot_includes\bot\user_interface"
