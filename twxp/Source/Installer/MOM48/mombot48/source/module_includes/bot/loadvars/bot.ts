:loadVars
	loadVar $mode
	loadVar $command 
	loadVar $SWITCHBOARD~bot_name
	setVar  $bot_name $SWITCHBOARD~bot_name
	loadvar $planet~planet_file
	loadvar $ship~cap_file
	loadVar $user_command_line 
	loadVar $parm1
	loadVar $parm2
	loadVar $parm3
	loadVar $parm4
	loadVar $parm5
	loadVar $parm6
	loadVar $parm7
	loadVar $parm8
	loadVar $bot_turn_limit
	loadVar $PLAYER~unlimitedGame
	loadVar $MAP~stardock
	loadVar $MAP~rylos
	loadVar $MAP~alpha_centauri
	loadvar $MAP~home_sector
	loadvar $MAP~backdoor
	loadVar $silent_running
	loadVar $botIsDeaf
	loadvar $switchboard~self_command
	loadvar $command_caller
	loadvar $planet~planet
	loadVar $password
	loadvar $letter
	loadVar $game~port_max
	loadVar $folder
	loadVar $mombot_directory
	loadVar $game~photon_duration
	loadvar $settings~override
	loadvar $PLAYER~dropOffensive
	loadvar $PLAYER~dropToll
	if ($player~dropOffensive = true)
		setvar $player~fighter_deploy_type "o"
	else
		if ($player~dropToll = true)
			setvar $player~fighter_deploy_type "t"
		else
			setvar $player~fighter_deploy_type "d"
		end
	end
	savevar $player~fighter_deploy_type

	setArray $help 60
	setVar $help 60
	setVar $TAB "     "

return
