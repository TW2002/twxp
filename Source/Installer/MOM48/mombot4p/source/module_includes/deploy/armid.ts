	gosub :BOT~loadVars

	setVar $BOT~help[1]  $BOT~tab&"pmine - place personal armids in sector"
	gosub :bot~helpfile

# ============================== MINES  ==============================
:deploy
	if ($personal)
		setvar $armid "p"
	else
		setvar $armid "c"
	end

:_mine
	gosub :mineProtections
	if ($bot~parm1 > $PLAYER~ARMIDS)
		setVar $bot~parm1 $PLAYER~ARMIDS
	end
:_cmine
	killalltriggers
	if ($PLAYER~ARMIDS <= 0)
		setVar $SWITCHBOARD~message "Out of Armid Mines!*"
		gosub :SWITCHBOARD~switchboard
		return
	end
	if ($PLAYER~startingLocation = "Citadel")
		send "q q z n h1 z " $bot~parm1 "*  z" $armid " z n n  *l " $PLANET~PLANET "* c"
	else
		send "z n h1 z " $bot~parm1 "*  z" $armid " z n"
	end
	setTextLineTrigger toomanypl :toomany_mine "!  You are limited to "
	setTextLineTrigger plclear :plclear_mine "Done. You have "
	setTextLineTrigger enemypl :noperdown_mine "These mines are not under your control."
	setTextLineTrigger notenough :toomany_mine "You don't have that many mines available."
	pause
:plclear_mine
	killalltriggers
	setVar $isMined TRUE
	if ($PLAYER~startingLocation = "Citadel")
		waitOn "Citadel command (?=help)" 
		send "s*"
	else
		waitOn "Command [TL="
		send "d*"
	end
	setTextLineTrigger perdown :perdown_mine "(Type 1 Armid) (yours)"
	setTextLineTrigger cordown :cordown_mine "(Type 1 Armid) (belong to your Corp)"
	setTextLineTrigger noperdown :noperdown_mine "Citadel treasury contains"
	pause
:cordown_mine
		setVar $SWITCHBOARD~message $bot~parm1&" Corporate Mines Deployed!*"
		gosub :SWITCHBOARD~switchboard
	goto :done_armid
:perdown_mine
		setVar $SWITCHBOARD~message $bot~parm1&" Personal Mines Deployed!*"
		gosub :SWITCHBOARD~switchboard
	goto :done_armid
:noperdown_mine
		setVar $SWITCHBOARD~message "Sector already has enemy Armid Mines present!*"
		gosub :SWITCHBOARD~switchboard
	setVar $isMined FALSE
	goto :done_armid
:toomany_mine
	setVar $SWITCHBOARD~message "Too many mines in the sector!*"
	gosub :SWITCHBOARD~switchboard
:done_armid
	if ($isMined)
		setSectorParameter $PLAYER~CURRENT_SECTOR "MINESEC" TRUE
	else
		setSectorParameter $PLAYER~CURRENT_SECTOR "MINESEC" FALSE
	end
	return
# ============================== END MINES SUB ==============================   

:mineProtections
	killalltriggers
	gosub :PLAYER~quikstats
	if (($PLAYER~CURRENT_SECTOR < 10) OR ($PLAYER~CURRENT_SECTOR = $MAP~stardock))
		setVar $SWITCHBOARD~message $bot~parm1&" Cannot deploy in FedSpace!*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
	setVar $PLAYER~startingLocation $PLAYER~CURRENT_PROMPT
	isNumber $test $bot~parm1
	if (($test = FALSE) OR ($bot~parm1 = 0))
		setVar $bot~parm1 1
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
