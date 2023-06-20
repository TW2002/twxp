:plimp
:deploy
	if ($personal)
		setvar $limp "p"
	else
		setvar $limp "c"
	end

:_limp
	gosub :mineProtections
	if ($amount > $PLAYER~LIMPETS)
		setVar $amount $PLAYER~LIMPETS
	end
:plimp1
	killalltriggers
	if ($PLAYER~LIMPETS <= 0)
		setvar $switchboard~message "Out of limpets!*"
		gosub :SWITCHBOARD~switchboard
		return
	end
	if ($PLAYER~startingLocation = "Citadel")
		send "q q z* h2z" $amount "* z " $limp " z * * *l " $planet~planet "* c"
	elseif ($PLAYER~startingLocation = "Command")
		send "z* h2z" $amount "* z " $limp " z * *"
	end
	setTextLineTrigger toomanypl :toomany_limp "!  You are limited to "
	setTextLineTrigger plclear :plclear_limp "Done. You have "
	setTextLineTrigger enemypl :noperdown_limp "These mines are not under your control."
	setTextLineTrigger notenough :toomany_limp "You don't have that many mines available."
	pause
:plclear_limp
	killalltriggers
	setVar $isLimped TRUE

	if ($PLAYER~startingLocation = "Citadel")
		waiton "Citadel command (?=help)"
		send "s* "
	elseif ($PLAYER~startingLocation = "Command")
		send "d* "
	end
	setTextLineTrigger perdown :perdown_limp "(Type 2 Limpet) (yours)"
	setTextLineTrigger cordown :cordown_limp "(Type 2 Limpet) (belong to your Corp)"
	setTextLineTrigger noperdown :noperdown_limp "Warps to Sector(s) :"
	pause
:cordown_limp
	killalltriggers
	setVar $SWITCHBOARD~message $amount&" Corporate Limpets Deployed!*"
	gosub :SWITCHBOARD~switchboard
	goto :done_limp
:perdown_limp
	killalltriggers
	setVar $SWITCHBOARD~message $amount&" Personal Limpet Deployed!*"
	gosub :SWITCHBOARD~switchboard
	goto :done_limp
:noperdown_limp
	killalltriggers
	setVar $SWITCHBOARD~message "Sector already has enemy limpets present!*"
	gosub :SWITCHBOARD~switchboard
	setVar $isLimped FALSE
	goto :done_limp
:toomany_limp
	setVar $SWITCHBOARD~message "Too many mines in the sector!*"
	gosub :SWITCHBOARD~switchboard
:done_limp
	if ($isLimped)
		setSectorParameter $PLAYER~CURRENT_SECTOR "LIMPSEC" TRUE
	else
		setSectorParameter $PLAYER~CURRENT_SECTOR "LIMPSEC" FALSE
	end
	killalltriggers
	return
# ============================== END PERSONAL LIMP SUB ==============================

:mineProtections
	killalltriggers
	gosub :PLAYER~quikstats
	if (($PLAYER~CURRENT_SECTOR < 10) OR ($PLAYER~CURRENT_SECTOR = $MAP~stardock))
		setVar $SWITCHBOARD~message "Cannot deploy in FedSpace!*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
	setVar $PLAYER~startingLocation $PLAYER~CURRENT_PROMPT
	isNumber $test $amount
	if (($test = FALSE) OR ($amount = 0))
		setVar $amount 1
	end
	setVar $bot~startingLocation $PLAYER~CURRENT_PROMPT
	setVar $bot~validPrompts "Command Citadel"
	gosub :bot~checkStartingPrompt
	if ($PLAYER~startingLocation = "Citadel")
		send "q"
		gosub :PLANET~getPlanetInfo
		send "c"
	end
return
