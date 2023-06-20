:pwarpto
:pwarp
	setvar $pwarpSuccess false
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
		setvar $pwarpSuccess false
		gosub :killpwarptriggers
		setVar $msg "Not a valid sector to pwarp to!*"
		return
		
	:noPwarp
		setvar $pwarpSuccess false
		gosub :killpwarptriggers
		setVar $msg "Planet Does Not Have A Planetary TransWarp Drive!*"
		return
	:no_pwarp_lock
		setvar $pwarpSuccess false
		gosub :killpwarptriggers
		setVar $bot~target $PLAYER~warpto
		gosub :bot~removefigfromdata
		setVar $msg "No fighter down at that location!*"
		return
	:no_ore
		setvar $pwarpSuccess false
		gosub :killpwarptriggers
		setVar $msg "Not enough fuel for that pwarp.*"
		return
	:pwarp_lock
		setvar $pwarpSuccess true
		gosub :killpwarptriggers
		waitOn "Planet is now in sector"
		setVar $msg "Planet #"&$planet~planet&" moved to sector "&$PLAYER~warpto&".*"
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
		setvar $pwarpSuccess true
		gosub :killpwarptriggers
		setVar $msg "Planet already in that sector!.*"
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
