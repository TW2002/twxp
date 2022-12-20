:pwarpto
:pwarp
	if ($scan)
		send "q *c p" $PLAYER~warpto "*ys"
	else
		send "q *c p" $PLAYER~warpto "*y"
	end
	waitOn "Planet #"
	getWord CURRENTLINE $planet~planet 2
	stripText $planet~planet "#"
	saveVar $planet~planet

	setTextLineTrigger pwarp_lock       :pwarp_lock     "Locating beam pinpointed"
	setTextLineTrigger no_pwarp_lock    :no_pwarp_lock  "Your own fighters must be"
	setTextLineTrigger already      :already    "You are already in that sector!"
	setTextLineTrigger no_ore       :no_ore     "You do not have enough Fuel Ore"
	setTextLineTrigger No_pwarp     :noPwarp    "This Citadel does not have a Planetary TransWarp"
	setTextLineTrigger wrong_number     :wrong_number   "Invalid Sector number,"
	pause
	:wrong_number
		gosub :killpwarptriggers
		setVar $SWITCHBOARD~message "Not a valid sector to pwarp to!*"
		gosub :SWITCHBOARD~switchboard
		return
		
	:noPwarp
		gosub :killpwarptriggers
		setVar $SWITCHBOARD~message "Planet Does Not Have A Planetary TransWarp Drive!*"
		gosub :SWITCHBOARD~switchboard
		return
	:no_pwarp_lock
		gosub :killpwarptriggers
		setVar $bot~target $PLAYER~warpto
		gosub :bot~removefigfromdata
		setVar $SWITCHBOARD~message "No fighter down at that location!*"
		gosub :SWITCHBOARD~switchboard
		return
	:no_ore
		gosub :killpwarptriggers
		setVar $SWITCHBOARD~message "Not enough fuel for that pwarp.*"
		gosub :SWITCHBOARD~switchboard
		return
	:pwarp_lock
		gosub :killpwarptriggers
		waitOn "Planet is now in sector"
		setVar $SWITCHBOARD~message "Planet #"&$planet~planet&" moved to sector "&$PLAYER~warpto&".*"
		gosub :SWITCHBOARD~switchboard
		setVar $bot~target $PLAYER~warpto
		loadVar $planet~planet
		isNumber $test $planet~planet
		if ($test)
			if (($planet~planet <> ".") and ($planet~planet > 0))
				setSectorParameter $planet~planet "PSECTOR" $bot~target
			end
		end
		gosub :bot~addfigtodata
		return
	:already
		gosub :killpwarptriggers
		setVar $SWITCHBOARD~message "Planet already in that sector!.*"
		gosub :SWITCHBOARD~switchboard
return

:killpwarptriggers
	killtrigger pwarp_lock
	killtrigger no_pwarp_lock
	killtrigger already
	killtrigger no_ore
	killtrigger No_pwarp
	killtrigger wrong_number
return

include "source\module_includes\bot\removefigfromdata\bot"
include "source\module_includes\bot\addfigtodata\bot"
