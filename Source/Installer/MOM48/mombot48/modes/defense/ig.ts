	loadVar $switchboard~bot_name
	loadVar $bot~parm1
	loadVar $bot~user_command_line
	loadVar $bot~parm2

# ============================== IG ==============================
:auto_ig
	killalltriggers
	gosub :player~quikstats
	setVar $startingLocation $player~CURRENT_PROMPT
	if ($startingLocation <> "Command")
		send "'{" $switchboard~bot_name "} - Must start at Citadel, Planet or Command prompt*"
		halt
	end
	setVar $ig_mode 0
	if ($bot~parm1 <> "on") AND ($bot~parm1 <> "off")
		send "'{" $switchboard~bot_name "} - Please use - IG [on/off]*"
		halt
	end
	send "'{" $switchboard~bot_name "} - Auto IG reset mode is now ON.*"
	setVar $planet~planet 0
	saveVar $planet~planet
	goto :ig_turn_it_on
	:photon_ig_damage_trigger
		halt

	:ig_turn_it_on
		killalltriggers
		getWord CURRENTLINE $test 1
		if ($test = "F") or ($test = "R") or ($test = "P")
			goto :photon_ig_damage_trigger
		end
		setVar $ig_mode 0
		setDelayTrigger ig_timeout :photon_ig_damage_trigger 3000
		setTextTrigger no_ig_trigger :no_ig_available "is not equipped with an Interdictor Generator!"
		setTextTrigger no_ig_beam :no_ig_beam "Beam to what sector? (U=Upgrade Q=Quit)"
		setTextTrigger no_ig_cby :no_ig_cby "ARE YOU SURE CAPTAIN? (Y/N)"
		setTextTrigger need_ig :ig_was_off "Your Interdictor generator is now OFF"
		setTextTrigger ig_fine :ig_was_on "Your Interdictor generator is now ON"
		setTextTrigger do_ig :do_ig_thing "Do you wish to change it? (Y/N)"
		send "q q q q* b"
		pause

	:no_ig_available
		killtrigger ig_timeout
		killtrigger no_ig_trigger
		killtrigger no_ig_beam
		killtrigger no_ig_cby
		killtrigger ig_was_on
		killtrigger do_ig_thing
		send "'{" $switchboard~bot_name "} - No IG available on this ship.*"
		halt

	:no_ig_beam
		killtrigger ig_timeout
		killtrigger no_ig_trigger
		killtrigger no_ig_beam
		killtrigger no_ig_cby
		killtrigger ig_was_on
		killtrigger do_ig_thing
		send " Q "
		halt

	:no_ig_cby
		killtrigger ig_timeout
		killtrigger no_ig_trigger
		killtrigger no_ig_beam
		killtrigger no_ig_cby
		killtrigger ig_was_on
		killtrigger do_ig_thing
		send " N "
		halt

	:ig_was_on
		setVar $ig_mode 1
		pause

	:ig_was_off
		setVar $ig_mode 0
		pause

	:do_ig_thing
		killtrigger ig_timeout
		killtrigger no_ig_trigger
		killtrigger no_ig_beam
		killtrigger no_ig_cby
		killtrigger ig_was_on
		killtrigger do_ig_thing
		if ($ig_mode = 0)
			send "Y"
			send "'{" $switchboard~bot_name "} - IG on!*"
		else
			send "N"
			send "'{" $switchboard~bot_name "} - IG was already on.*"
		end
			goto :ig_triggers


:ig_triggers
	setTextLineTrigger turnIGon :ig_turn_it_on " damaging your ship."
	setVar $planet~planet 0
	saveVar $planet~planet
	pause
return

	
# ============================== END IG SUB ==============================



include "source\bot_includes\player\quikstats\player"
