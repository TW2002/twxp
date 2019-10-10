:checkStartingPrompt
	if ($PLAYER~CURRENT_PROMPT = "0")
		gosub  :player~currentPrompt
	end
	getWordPos " "&$validPrompts&" " $pos $PLAYER~CURRENT_PROMPT
	if ($pos <= 0)
		setVar $SWITCHBOARD~message "Invalid starting prompt: ["&$PLAYER~CURRENT_PROMPT&"]. Valid prompt(s) for this command: ["&$validPrompts&"]*"
		gosub :SWITCHBOARD~switchboard
		goto :wait_for_command
	end
return

#============================== KILLING ALL THE TRIGGERS/SETTING DELAY TRIGGER ==============
:killthetriggers
	killalltriggers
	setDelayTrigger unfreezingTrigger :unfreezebot 100000
return
:bigdelay_killthetriggers
	killalltriggers
	setDelayTrigger unfreezingTriggerBigDelay :unfreezebot 1800000
return
:unfreezebot
	echo "*Bot timed out, unfreezing..*"
	send "'{" $SWITCHBOARD~bot_name "} - Bot frozen for over 100 seconds, resetting...*"
	goto :wait_for_command
#==================================== END KILL TRIGGERS ======================================

# ============================== MAIN BODY WAIT FOR COMMANDS ==============================
:wait_for_command
	killallTriggers

	if (connected)
		setvar $connectivity~relogging false
		savevar $connectivity~relogging
	end

	setVar $USER_INTERFACE~routing ""
	setVar $USER_INTERFACE~temp_bot_name ""
	loadVar $botIsDeaf
	loadvar $planet~planet
	loadvar $bot~mode
	loadvar $in_kill_routine
	setVar $alive_count 0
	if ($MAP~stardock <= 0)
		setVar $MAP~stardock STARDOCK
		saveVar $MAP~stardock
	end
	if ($MAP~rylos <= 0)
		setVar $MAP~rylos RYLOS
		savevar $map~rylos
	end
	if ($MAP~alpha_centauri <= 0)
		setVar $MAP~alpha_centauri ALPHACENTAURI
		saveVar $MAP~alpha_centauri
	end
	loadvar $map~home_sector
	loadvar $map~rylos
	loadvar $map~alpha_centauri
	loadvar $map~stardock
	loadvar $map~backdoor 
	loadvar $bot~safe_ship
	loadvar $bot~bot_turn_limit
	loadvar $bot~pgrid_bot

	setVar $SWITCHBOARD~self_command FALSE
	setVar $scrubonly FALSE
	SetTextOutTrigger   user        :USER_INTERFACE~User_Access    ">"
	settextouttrigger   UpArrow     :USER_INTERFACE~User_Access    #28
	SetTextOutTrigger   DownArrow   :USER_INTERFACE~User_Access    #29
	SetTextOutTrigger   UpArrow2    :USER_INTERFACE~User_Access    #27&"[A"
	SetTextOutTrigger   DownArrow2  :USER_INTERFACE~User_Access    #27&"[B"
	SetTextOutTrigger   Tabkey      :USER_INTERFACE~Hotkey_Access  #9
	SetTextOutTrigger   RightArrow  :USER_INTERFACE~Hotkey_Access  #27&"[D"
	SetTextOutTrigger   RightArrow2 :USER_INTERFACE~Hotkey_Access  #31
	SetTextOutTrigger   LeftArrow   :USER_INTERFACE~Hotkey_Access  #27&"[C"
	SetTextOutTrigger   LeftArrow2  :USER_INTERFACE~Hotkey_Access  #30

	setVar $USER_INTERFACE~authorization 0
	setVar $USER_INTERFACE~logged 0
	if ($bot_team_name = "0")
		setvar $bot_team_name $bot_name
		savevar $bot_team_name
	end

	setEventTrigger     shutdownthemodule       :INTERNAL_COMMANDS~shutDown            "SCRIPT STOPPED"      $LAST_LOADED_MODULE
	if ($botIsOff <> TRUE)
		setTextLineTrigger  own_command             :USER_INTERFACE~check_routing          $SWITCHBOARD~bot_name
		setTextLineTrigger  own_command_team        :USER_INTERFACE~check_routing_team     $bot_team_name
		setTextLineTrigger  own_command_all         :USER_INTERFACE~check_routing_all     "all"
		setTextLineTrigger  loginmemo               :INTERNAL_COMMANDS~loginmemo           "You have a corporate memo from "
	end
	setEventTrigger     relog                   :CONNECTIVITY~keepalive           "CONNECTION LOST"
	setTextTrigger      online_watch            :CONNECTIVITY~online_watch             "Your session will be terminated in "
	setDelayTrigger     keepalive               :CONNECTIVITY~keepalive                30000
	pause
	pause

:save_the_variables
	saveVar $command
	saveVar $user_command_line
	saveVar $SWITCHBOARD~bot_name
	saveVar $bot_name
	saveVar $self_command
	saveVar $SWITCHBOARD~self_command
	saveVar $parm1
	saveVar $parm2
	saveVar $parm3
	saveVar $parm4
	saveVar $parm5
	saveVar $parm6
	saveVar $parm7
	saveVar $parm8
	saveVar $PLAYER~unlimitedGame
	setVar $unlimitedGame $PLAYER~unlimitedGame
	setVar $~unlimitedGame $unlimitedGame
	saveVar $~unlimitedGame
	saveVar $unlimitedGame
	saveVar $SHIP~cap_file
	saveVar $PLANET~planet_file
	saveVar $bot_turn_limit
	saveVar $password
	saveVar $mode
	saveVar $GAME~mbbs
	saveVar $GAME~ptradesetting
	setVar  $_CK_PTRADESETTING $GAME~ptradesetting
	saveVar $_CK_PTRADESETTING
	saveVar $MAP~rylos
	saveVar $MAP~alpha_centauri
	saveVar $MAP~stardock
	saveVar $MAP~backdoor
	saveVar $MAP~home_sector
	saveVar $rylos
	saveVar $alpha_centauri
	saveVar $stardock
	saveVar $backdoor
	saveVar $home_sector
	saveVar $GAME~port_max
	saveVar $GAME~STEAL_FACTOR
	saveVar $GAME~rob_factor
	saveVar $subspace
	saveVar $GAME~MULTIPLE_PHOTONS
	saveVar $alarm_list
	saveVar $echoInterval
	if ($bot_password = 0)
		setvar $bot_password $subspace
	end
	saveVar $bot_password
	saveVar $PLAYER~surroundAvoidShieldedOnly
	saveVar $PLAYER~surroundAvoidAllPlanets
	saveVar $PLAYER~surroundDontAvoid
	saveVar $surroundAutoCapture
	saveVar $PLAYER~surroundFigs
	saveVar $PLAYER~surroundLimp
	saveVar $PLAYER~surroundMine
	saveVar $PLAYER~surroundOverwrite
	saveVar $PLAYER~surroundPassive
	saveVar $PLAYER~surroundNormal
	saveVar $username
	saveVar $letter
	saveVar $PLAYER~defenderCapping
	saveVar $PLAYER~offenseCapping
	saveVar $safe_ship
	saveVar $safe_planet
	saveVar $PLAYER~cappingAliens
	saveVar $PLAYER~surround_before_hkill
	saveVar $command_prompt_extras
	saveVar $silent_running
	saveVar $MAP~planet_list
	saveVar $startShipName
	saveVar $mowToDock
	saveVar $mowToDockBackdoor
	saveVar $startGameDelay
	saveVar $isCEO
	saveVar $corpName
	saveVar $corpPassword
	saveVar $newGameDay1
	saveVar $newGameOlder
	saveVar $pgrid_bot
	savevar $autoattack
	gosub :MAIN~backwards_compatible
return

:load_the_variables
	loadvar $corpname
	loadvar $game~game_menu_prompt_ansi
	loadvar $game~game_menu_prompt
	loadvar $alarm_list
	loadVar $PLAYER~offenseCapping
	loadVar $PLAYER~cappingAliens
	loadVar $PLANET~PLANET
	loadVar $GAME~ATOMIC_COST
	loadVar $GAME~BEACON_COST
	loadVar $GAME~CORBO_COST
	loadVar $GAME~CLOAK_COST
	loadVar $GAME~PROBE_COST
	loadVar $GAME~PLANET_SCANNER_COST
	loadVar $GAME~LIMPET_COST
	loadVar $GAME~ARMID_COST
	loadVar $GAME~PHOTON_COST
	loadVar $GAME~HOLO_COST
	loadVar $GAME~DENSITY_COST
	loadVar $GAME~DISRUPTOR_COST
	loadVar $GAME~GENESIS_COST
	loadVar $GAME~TWARPI_COST
	loadVar $GAME~TWARPII_COST
	loadVar $GAME~PSYCHIC_COST
	loadVar $GAME~PHOTONS_ENABLED
	loadVar $GAME~PHOTON_DURATION
	loadVar $GAME~MAX_COMMANDS
	loadVar $GAME~goldEnabled
	loadVar $GAME~mbbs
	loadVar $GAME~MULTIPLE_PHOTONS
	loadVar $GAME~colonist_regen
	loadVar $GAME~ptradesetting
	loadVar $GAME~STEAL_FACTOR
	loadVar $GAME~rob_factor
	loadVar $GAME~CLEAR_BUST_DAYS
	loadVar $GAME~port_max
	loadVar $GAME~PRODUCTION_RATE
	loadVar $GAME~PRODUCTION_REGEN
	loadVar $GAME~DEBRIS_LOSS
	loadVar $GAME~RADIATION_LIFETIME
	loadVar $GAME~LIMPET_REMOVAL_COST
	loadVar $GAME~MAX_PLANETS_PER_SECTOR
	loadVar $subspace
	loadVar $password
	loadVar $bot_password
	if ($bot_password = 0)
		setvar $bot_password $subspace
		savevar $bot_password
	end
	loadVar $PLAYER~surroundAvoidShieldedOnly
	loadVar $surroundAutoCapture
	loadVar $PLAYER~surroundAvoidAllPlanets
	loadVar $PLAYER~surroundDontAvoid
	loadVar $MAP~stardock
	loadVar $MAP~backdoor
	loadVar $MAP~rylos
	loadVar $MAP~alpha_centauri
	loadVar $MAP~home_sector
	loadVar $PLAYER~surroundFigs
	loadVar $PLAYER~surroundLimp
	loadVar $PLAYER~surroundMine
	loadVar $SWITCHBOARD~bot_name
	setVar $bot_name $SWITCHBOARD~bot_name
	loadVar $PLAYER~surroundOverwrite
	loadVar $PLAYER~surroundPassive
	loadVar $PLAYER~surroundNormal
	loadVar $username
	loadVar $letter
	loadVar $PLAYER~defenderCapping
	loadVar $bot_turn_limit
	loadVar $safe_ship
	loadVar $pgrid_bot
	loadVar $safe_planet
	loadvar $corppassword

	loadVar $bot_team_name
	loadVar $historyString
	loadVar $doRelog
	loadVar $PLAYER~surround_before_hkill
	loadVar $command_prompt_extras
	loadVar $silent_running
	loadvar $autoattack

return
:load_bot
#####=============================================== BOT STARTUP FUNCTIONS ============================================#####
	# reset do not resuscitate when bot starts #

	setvar $do_not_resuscitate false
	savevar $do_not_resuscitate

	setvar $hotkeys_file         "scripts/mombot/hotkeys.cfg"
	setvar $custom_keys_file     "scripts/mombot/custom_keys.cfg"
	setvar $custom_commands_file "scripts/mombot/custom_commands.cfg"

	gosub :MENUS~doSplashScreen
	fileExists $exists1 $hotkeys_file
	fileExists $exists2 $custom_keys_file
	fileExists $exists3 $custom_commands_file
	if ($exists1 AND $exists2 AND $exists3)
		readToArray $hotkeys_file $hotkeys
		readToArray $custom_keys_file $custom_keys
		readToArray $custom_commands_file $custom_commands
	end

	if (($exists1 = FALSE) OR ($exists2 = FALSE) OR ($exists3 = FALSE) OR ($hotkeys <> "255") OR ($custom_keys <> "33") OR ($custom_commands <> "33"))
		delete $hotkeys_file
		delete $custom_keys_file
		delete $custom_commands_file
		setArray $hotkeys 255
		setArray $custom_keys 33
		setArray $custom_commands 33
		setVar $hotkeys[76] 9
		setVar $hotkeys[108] 9
		setVar $hotkeys[102] 14
		setVar $hotkeys[70] 14
		setVar $hotkeys[109] 13
		setVar $hotkeys[77] 13
		setVar $hotkeys[104] 5
		setVar $hotkeys[72] 5
		setVar $hotkeys[107] 1
		setVar $hotkeys[75] 1
		setVar $hotkeys[99] 2
		setVar $hotkeys[67] 2
		setVar $hotkeys[98] 17
		setVar $hotkeys[66] 17
		setVar $hotkeys[112] 7
		setVar $hotkeys[80] 7
		setVar $hotkeys[100] 11
		setVar $hotkeys[68] 11
		setVar $hotkeys[116] 6
		setVar $hotkeys[84] 6
		setVar $hotkeys[114] 3
		setVar $hotkeys[82] 3
		setVar $hotkeys[115] 4
		setVar $hotkeys[83] 4
		setVar $hotkeys[120] 12
		setVar $hotkeys[88] 12
		setVar $hotkeys[122] 15
		setVar $hotkeys[90] 15
		setVar $hotkeys[126] 16
		setVar $hotkeys[113] 8
		setVar $hotkeys[81] 8
		setVar $hotkeys[9] 10
		setvar $i 1
		while ($i <= 255)
			write $hotkeys_file $hotkeys[$i]
			add $i 1
		end
		setVar $custom_keys[1] "K"
		setVar $custom_keys[2] "C"
		setVar $custom_keys[3] "R"
		setVar $custom_keys[4] "S"
		setVar $custom_keys[5] "H"
		setVar $custom_keys[6] "T"
		setVar $custom_keys[7] "P"
		setVar $custom_keys[8] "Q"
		setVar $custom_keys[9] "L"
		setVar $custom_keys[10] #9
		setVar $custom_keys[11] "D"
		setVar $custom_keys[12] "X"
		setVar $custom_keys[13] "M"
		setVar $custom_keys[14] "F"
		setVar $custom_keys[15] "Z"
		setVar $custom_keys[16] "~"
		setVar $custom_keys[17] "B"
		setvar $i 1
		while ($i <= 33)
			write $custom_keys_file $custom_keys[$i]
			add $i 1
		end

		setVar $custom_commands[1] ":INTERNAL_COMMANDS~autokill"
		setVar $custom_commands[2] ":INTERNAL_COMMANDS~autocap"
		setVar $custom_commands[3] ":INTERNAL_COMMANDS~autorefurb"
		setVar $custom_commands[4] ":INTERNAL_COMMANDS~surround"
		setVar $custom_commands[5] ":INTERNAL_COMMANDS~htorp"
		setVar $custom_commands[6] ":INTERNAL_COMMANDS~twarpswitch"
		setVar $custom_commands[7] ":INTERNAL_COMMANDS~kit"
		setVar $custom_commands[8] ":USER_INTERFACE~script_access"
		setVar $custom_commands[9] ":INTERNAL_COMMANDS~hkill"
		setVar $custom_commands[10] ":INTERNAL_COMMANDS~stopModules"
		setVar $custom_commands[11] ":INTERNAL_COMMANDS~kit"
		setVar $custom_commands[12] ":INTERNAL_COMMANDS~xenter"
		setVar $custom_commands[13] ":INTERNAL_COMMANDS~mowswitch"
		setVar $custom_commands[14] ":INTERNAL_COMMANDS~fotonswitch"
		setVar $custom_commands[15] ":INTERNAL_COMMANDS~clear"
		setVar $custom_commands[16] ":MENUS~preferencesMenu"
		setVar $custom_commands[17] ":INTERNAL_COMMANDS~dock_shopper"
		setvar $i 1
		while ($i <= 33)
			write $custom_commands_file $custom_commands[$i]
			add $i 1
		end
	end
	setVar $PLAYER~startingLocation ""
	setArray $INTERNALCOMMANDLISTS 7
	setVar $internalCommandLists[1]  " stopall stop listall reset emq bot relog tow refresh login logoff unlock lift with dep callin about cn extern twarp bwarp pwarp relog help switchbot "
	setVar $internalCommandLists[2]  " " 
	setVar $internalCommandLists[3]  " "
	setVar $internalCommandLists[4]  " "
	setVar $internalCommandLists[5]  "  "
	setVar $internalCommandLists[6]  " "
	setVar $internalCommandLists[7]  " storeship setvar getvar "
	setVar $doubledCommandList       " parm params parms qss sec sect secto cn9 logout emx l m t b p port x shipstore w d "
	setVar $internalCommandList     $internalCommandLists[1]&$internalCommandLists[2]&$internalCommandLists[3]&$internalCommandLists[4]&$internalCommandLists[5]&$internalCommandLists[6]&$internalCommandLists[7]
	setArray $TYPES 7
	setVar $TYPES[1] "General"
	setVar $TYPES[2] "Defense"
	setVar $TYPES[3] "Offense"
	setVar $TYPES[4] "Resource"
	setVar $TYPES[5] "Grid"
	setVar $TYPES[6] "Cashing"
	setVar $TYPES[7] "Data"
	setArray $CATAGORIES 3
	setVar $CATAGORIES[1] "Modes"
	setVar $CATAGORIES[2] "Commands"
	setVar $CATAGORIES[3] "Daemons"
	setVar $corpycount 0
	setArray $corpy 30
# ============================== START BOT VARIABLES ============================
	SetVar $gameStats       FALSE
	SetVar $script_name		"Mind ()ver Matter Bot "
	SetVar $mode            "General"
	setVar $SWITCHBOARD~self_command        FALSE
	SetVar $OkayToUse               TRUE
	SetVar $PLAYER~TRADER_NAME             ""
	SetArray $PARMS         8
	Setvar $PARMS           8
	SetVar $ModuleCategory      ""
# ============================== END BOT VARIABLES ============================
# ============================== STANDARD GAME TEXT VARIABLES======================
	setVar $START_FIG_HIT "Deployed Fighters Report Sector "
	setVar $END_FIG_HIT   ":"
	setVar $ALIEN_ANSI    #27 & "[1;36m" & #27 & "["
	setVar $START_FIG_HIT_OWNER ":"
	setVar $END_FIG_HIT_OWNER "'s"
# ================================END STANDARD GAME TEXT VARIABLES=================
# ============================== START FILE VARIABLES ==============================
	setvar $folder "scripts/mombot/games/"&GAMENAME
	makedir $folder
	setVar  $gconfig_file           $folder&"/bot.cfg"
	setVar  $CK_FIG_FILE            $folder&"/_ck_" & GAMENAME & ".figs"
	setVar  $FIG_FILE               $folder&"/fighters.cfg"
	setVar  $FIG_COUNT_FILE         $folder&"/fighters.cnt"
	setVar  $LIMP_FILE              $folder&"/limpets.cfg"
	setVar  $LIMP_COUNT_FILE        $folder&"/limpets.cnt"
	setVar  $ARMID_COUNT_FILE       $folder&"/armids.cnt"
	setVar  $ARMID_FILE             $folder&"/armids.cfg"
	setvar  $timer_file             $folder&"/timer.cfg"
	setVar  $GAME~GAME_SETTINGS_FILE     $folder&"/game_settings.cfg"
	setVar  $BOT_USER_FILE          $folder&"/bot_users.lst"
	setVar  $SHIP~cap_file          $folder&"/ships.cfg"
	setVar  $PLANET~planet_file     $folder&"/planets.cfg"
	setVar  $SCRIPT_FILE            "scripts/mombot/hotkey_scripts.cfg"
	setVar  $BUST_FILE              $folder&"/busts.cfg"
	setVar  $MCIC_FILE              $folder&"/planet.nego"

	setVar $LAST_LOADED_MODULE  ""
	saveVar  $gconfig_file    
	savevar  $folder       
	saveVar  $CK_FIG_FILE            
	saveVar  $FIG_FILE               
	saveVar  $FIG_COUNT_FILE         
	saveVar  $LIMP_FILE              
	saveVar  $LIMP_COUNT_FILE        
	saveVar  $ARMID_COUNT_FILE       
	saveVar  $ARMID_FILE             
	saveVar  $GAME~GAME_SETTINGS_FILE
	saveVar  $BOT_USER_FILE          
	saveVar  $SHIP~cap_file          
	saveVar  $PLANET~planet_file     
	saveVar  $SCRIPT_FILE            
	saveVar  $BUST_FILE              
	saveVar  $MCIC_FILE   
	savevar  $timer_file
# ============================== END FILE VARIABLES ==============================
# ============================= START PROMPT VARIABLES ===========================
	setArray $history       100
	setVar $promptOutput        ""
	setVar $charCount       0
	setVar $historyIndex        0
	setVar $currentPromptText   ""
	setVar $historyMax      100
	setVar $historyCount        0
	setVar $charPos         0
# ============================== END PROMPT VARIABLES ==============================
# ============================ START GAME VARIABLES ==========================
	setVar $PLAYER_CASH_MAX     999999999
	setVar $PLANET~CITADEL_CASH_MAX    999999999999999
# ============================ END GAME VARIABLES ==========================
# ============================ START QUIKSTAT VARIABLES ==========================
	setVar $PLAYER~CURRENT_PROMPT      "Undefined"
	setVar $PLAYER~PSYCHIC_PROBE       "No"
	setVar $PLAYER~PLANET_SCANNER      "No"
	setVar $PLAYER~SCAN_TYPE       "None"
# ============================ END QUIKSTAT VARIABLES ==========================
# =============================== BOT STARTUP =================================
:getInitial_Settings
	setvar $connectivity~relogging false
	savevar $connectivity~relogging
	loadVar $GAME~gamestats
	setVar $pgrid_type "Normal"
	setVar $pgrid_end_command " scan "
	getWord CURRENTLINE $PLAYER~startingLocation 1
	fileExists $SCRIPT_FILE_chk $SCRIPT_FILE
	if ($SCRIPT_FILE_chk)
		setArray $HOTKEY_SCRIPTS 10 1
		setVar $i 1
		setVar $HOTKEY_SCRIPTS 0
		read $SCRIPT_FILE $line $i
		while ($line <> "EOF")
			getWord $line $fileLocation 1
			getWordPos $line $pos #34
			if ($pos <= 0)
				echo "Error with script file. either remove " & $SCRIPT_FILE & ", or fix it*"
				halt
			end
			cutText $line $scriptName $pos 9999
			stripText $scriptName #34
			setVar $HOTKEY_SCRIPTS[$i] $fileLocation
			setVar $HOTKEY_SCRIPTS[$i][1] $scriptName
			add $i 1
			add $HOTKEY_SCRIPTS 1
			read $SCRIPT_FILE $line $i
		end
	else
		setArray $HOTKEY_SCRIPTS 10 1
	end

	fileExists $gfile_chk $gconfig_file
	if ($gfile_chk)
		loadVar $GAME~mbbs
		loadVar $GAME~STEAL_FACTOR
		loadVar $GAME~rob_factor
		loadVar $GAME~ptradesetting
		loadVar $GAME~port_max
		loadVar $PLAYER~unlimitedGame
		setVar $doRelog TRUE
		saveVar $doRelog
		read $gconfig_file $bot_name 1
		if (CONNECTED = TRUE)
			gosub :PLAYER~quikstats      
		end
		if ((($PLAYER~startingLocation = "Command") OR ($PLAYER~startingLocation = "Citadel")) AND (CONNECTED = TRUE))
			if ($GAME~ptradesetting = 0)
				gosub :GAME~gamestats
			end
			gosub :player~quikstats
			gosub :PLAYER~getInfo
			gosub :SHIP~getShipStats
			gosub :player~quikstats

			fileExists $SHIP~cap_file_chk $SHIP~cap_file
			if ($SHIP~cap_file_chk)
				gosub :SHIP~loadShipInfo
			else
				gosub :SHIP~getShipCapStats
				gosub :SHIP~loadShipInfo
			end
			fileExists $PLANET~planet_file_chk $PLANET~planet_file
			if ($PLANET~planet_file_chk)
				gosub :PLANET~loadPlanetInfo
			else
				gosub :PLANET~getPlanetStats
				gosub :PLANET~loadPlanetInfo
			end
		else
			fileExists $SHIP~cap_file_chk $SHIP~cap_file
			if ($SHIP~cap_file_chk)
				gosub :SHIP~loadShipInfo
			end
			fileExists $PLANET~planet_file_chk $PLANET~planet_file
			if ($PLANET~planet_file_chk)
				gosub :PLANET~loadPlanetInfo
			end
		end
	else
		:conf_bot
			setVar $PLAYER~surroundFigs 1
			saveVar $PLAYER~surroundFigs
			if (CONNECTED = true)
				gosub :player~quikstats
			end
			echo ANSI_13
			echo "*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-"
			echo "*  Getting intial settings for M()M Bot . . . *"
			echo "*  Game is not set up for M()M Bot, doing that now. "
			echo "*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-**"
			setDelayTrigger woah :keep_going 500
			pause
			pause
			:keep_going 
				gosub :MENUS~add_game
				if ((($PLAYER~startingLocation = "Command") OR ($PLAYER~startingLocation = "Citadel")) AND ((CONNECTED = TRUE)))
					gosub :GAME~gamestats
					gosub :PLAYER~quikstats
					gosub :PLAYER~getInfo
					fileExists $SHIP~cap_file_chk $SHIP~cap_file
					if ($SHIP~cap_file_chk)
						gosub :SHIP~loadShipInfo
					else
						gosub :SHIP~getShipCapStats
						gosub :SHIP~loadShipInfo
					end
					fileExists $PLANET~planet_file_chk $PLANET~planet_file
					if ($PLANET~planet_file_chk)
						gosub :PLANET~loadPlanetInfo
					else
						gosub :PLANET~getPlanetStats
						gosub :PLANET~loadPlanetInfo
					end

					echo ANSI_13
					echo "*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-"
					echo "*  M()M Bot initialization completed . . .  *"
					echo "*  You should be setup and ready to go! "
					echo "*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-**"
				else
					fileExists $SHIP~cap_file_chk $SHIP~cap_file
					if ($SHIP~cap_file_chk)
						gosub :SHIP~loadShipInfo
					end
					fileExists $PLANET~planet_file_chk $PLANET~planet_file
					if ($PLANET~planet_file_chk)
						gosub :PLANET~loadPlanetInfo
					end
					echo "*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-"
					echo "*  You weren't connected to the game when starting "
					echo "*    so you will want to reboot or refresh once "
					echo "* connected into the game to properly configure bot. "
					echo "*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-**"
				end
			setDelayTrigger woah :keep_going2 1500
			pause
			pause
			:keep_going2 
	end




	getSectorParameter 2 "FIG_COUNT" $figCount
	if ($figCount = "")
		setSectorParameter 2 "FIG_COUNT" 0
	end
	loadVar $echoInterval
	if ($echoInterval <= 0)
		setVar $echoInterval 5760
		saveVar $echoInterval
	end
	setVar $botIsOff FALSE
	gosub :load_the_variables
	if (($PLAYER~surroundAvoidShieldedOnly = FALSE) AND ($surroundAutoCapture = FALSE) AND ($PLAYER~surroundAvoidAllPlanets = FALSE) AND ($PLAYER~surroundDontAvoid = FALSE))
		setVar $PLAYER~surroundAvoidAllPlanets TRUE
	end
	if ($bot_team_name = 0)
		setVar $bot_team_name $SWITCHBOARD~bot_name
	end
	if ($password = 0)
		setVar $password PASSWORD
	end
	if ($username = 0)
		setVar $username LOGINNAME
	end
	if ($letter = 0)
		setVar $letter GAME
	end
	if ($MAP~stardock <= 0)
		setVar $MAP~stardock STARDOCK
		saveVar $MAP~stardock
	end
	if ($MAP~rylos <= 0)
		setVar $MAP~rylos RYLOS
		saveVar $MAP~rylos
	end
	if ($MAP~alpha_centauri <= 0)
		setVar $MAP~alpha_centauri ALPHACENTAURI
		saveVar $MAP~alpha_centauri
	end
	gosub :save_the_variables

	getFileList $startup_scripts "scripts\mombot\Startups\*.cts"
	setVar $i 1 
	while ($i <= $startup_scripts)
		stop "scripts\mombot\startups\"&$startup_scripts[$i]
		stop "scripts\mombot\startups\"&$startup_scripts[$i]
		stop "scripts\mombot\startups\"&$startup_scripts[$i]
		stop "scripts\mombot\startups\"&$startup_scripts[$i]
		setVar $BOT~command $startup_scripts[$i]
		replacetext $BOT~command ".cts" ""
		saveVar $BOT~command
		load "scripts\mombot\startups\"&$startup_scripts[$i]
		add $i 1
	end

:run_bot
	if ((($PLAYER~startingLocation = "Citadel") OR ($PLAYER~startingLocation = "Command")) AND ((CONNECTED = TRUE)))
		gosub :player~startCNsettings
		gosub :PLAYER~quikstats
		gosub :PLAYER~getInfo
		send "'{" $SWITCHBOARD~bot_name "} - is ACTIVE: Version - " & $BOT~major_version & "." & $BOT~minor_version " - type " #34 $SWITCHBOARD~bot_name " help" #34 " for command list*"
		send "'{" $SWITCHBOARD~bot_name "} - to login - send a corporate memo*"
		if (($username = "") or ($letter = "") or ($doRelog = FALSE))
			send "'{" $SWITCHBOARD~bot_name "} - Auto Relog - Not Active*"
			setVar $doRelog FALSE
		end

		gosub :PLAYER~quikstats

		stop "scripts\mombot\daemons\ephaggle.cts"
		stop "scripts\mombot\daemons\ephaggle.cts"
		stop "scripts\mombot\daemons\ephaggle.cts"
		stop "scripts\mombot\daemons\ephaggle.cts"
		load "scripts\mombot\daemons\ephaggle.cts"
	else
		echo "*{" $SWITCHBOARD~bot_name "} is ACTIVE: Version - "&$BOT~major_version&"."&$BOT~minor_version " - type " #34 $SWITCHBOARD~bot_name " help" #34 " for command list*"
		if (($username = "") or ($letter = "") or ($doRelog = FALSE))
			echo "{"&$SWITCHBOARD~bot_name&"} - Auto Relog - Not Active*"
			setVar $doRelog FALSE
		end
		echo "{"&$SWITCHBOARD~bot_name&"} - No EP Haggle is running because the bot was started offline.*"
	end
	saveVar $SWITCHBOARD~bot_name
	:initiate_bot
		loadVar $BOT~isShipDestroyed
		if (CONNECTED <> TRUE)
			goto :MENUS~pregameMenuLoad
		else
			setVar $BOT~isShipDestroyed FALSE
			saveVar $BOT~isShipDestroyed
		end


# ========================================= END START THE BOT SUB ==========================================
#####============================================ END BOT STARTUP FUNCTIONS ===========================================#####
goto :wait_for_command

:load_watcher_variables
	loadVar $SHIP~SHIP_MAX_ATTACK
	loadVar $SHIP~SHIP_FIGHTERS_MAX
	loadVar $SHIP~SHIP_OFFENSIVE_ODDS
	loadVar $PLANET~PLANET
	loadVar $PLAYER~CURRENT_SECTOR
return

