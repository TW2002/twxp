	gosub :BOT~loadVars

	setVar $BOT~help[1]  $BOT~tab&"pwarp {sector:#} {"&#34&"trader_name"&#34&"} "
	setVar $BOT~help[2]  $BOT~tab&"      "
	setVar $BOT~help[3]  $BOT~tab&"        planet warps to sector "
	setVar $BOT~help[4]  $BOT~tab&"      "
	setVar $BOT~help[5]  $BOT~tab&"    Options: "
	setVar $BOT~help[6]  $BOT~tab&"           {sector:#} - sector to pwarp to "
	setVar $BOT~help[7]  $BOT~tab&"      {"&#34&"trader_name"&#34&"} - trader to pwarp to"
	setVar $BOT~help[8]  $BOT~tab&"         "
	setVar $BOT~help[9]  $BOT~tab&"    Examples:"
	setVar $BOT~help[10] $BOT~tab&"               >p 233 - normal pwarp"
	setVar $BOT~help[11] $BOT~tab&"         >p planet 12 - pwarp to last known "
	setVar $BOT~help[12] $BOT~tab&"                        location of planet 12 "
	setVar $BOT~help[13] $BOT~tab&"              >p mind - pwarp to a corp member with mind"
	setVar $BOT~help[14] $BOT~tab&"                        in their name"
	setVar $BOT~help[15] $BOT~tab&"     >p "&#34&"mind dagger"&#34&" - pwarp to corp member"
	gosub :bot~helpfile

# ======================     START PWARP SUBROUTINES     =================
:pwarp
:p
	killalltriggers
	setvar $player~save true
	if ($bot~parm1 <> $PLAYER~CURRENT_SECTOR)
		gosub  :player~currentPrompt
	else
		gosub :PLAYER~quikstats
	end
	setVar $PLAYER~startingLocation $PLAYER~CURRENT_PROMPT
	setVar $bot~validPrompts "Citadel"
	gosub :bot~checkstartingprompt

	gosub :player~checkfortravelname

	isNumber $test $bot~parm1
	if (($test = FALSE) OR ($bot~parm1 = ""))
		setVar $SWITCHBOARD~message "Sector must be entered as a number between 11-"&SECTORS&"*"
		gosub :SWITCHBOARD~switchboard
		goto :wait_for_command
	else    
		if (($bot~parm1 > SECTORS) OR ($bot~parm1 < 11))    
			setVar $SWITCHBOARD~message "Sector must be entered as a number between 11-"&SECTORS&"*"  
			gosub :SWITCHBOARD~switchboard
			goto :wait_for_command
		else
			setVar $PLAYER~warpto $bot~parm1
			if ($PLAYER~CURRENT_SECTOR = $PLAYER~warpto)
				setVar $SWITCHBOARD~message "Already in that sector!*"
				gosub :SWITCHBOARD~switchboard
				goto :wait_for_command
			end
		end
	end
	
	getWordPos " "&$bot~user_command_line&" " $pos " scan "
	if ($pos > 0)
		setVar $scan TRUE
	else
		setVar $scan FALSE
	end

	gosub :pwarpto
	goto :wait_for_command
:pwarpto
	send "q *"
	waitOn "Planet #"
	getWord CURRENTLINE $planet~planet 2
	stripText $planet~planet "#"
	saveVar $planet~planet



	send "c p" $PLAYER~warpto "*"

	setTextLineTrigger pwarp_lock       :pwarp_lock     "Locating beam pinpointed"
	setTextLineTrigger no_pwarp_lock    :no_pwarp_lock  "Your own fighters must be"
	setTextLineTrigger already      :already    "You are already in that sector!"
	setTextLineTrigger no_ore       :no_ore     "You do not have enough Fuel Ore"
	setTextLineTrigger No_pwarp     :noPwarp    "This Citadel does not have a Planetary TransWarp"
	setTextLineTrigger wrong_number     :wrong_number   "Invalid Sector number,"
	pause
	:wrong_number
		killalltriggers
		setVar $SWITCHBOARD~message "Not a valid sector to pwarp to!*"
		gosub :SWITCHBOARD~switchboard
		return
		
	:noPwarp
		killalltriggers
		setVar $SWITCHBOARD~message "Planet Does Not Have A Planetary TransWarp Drive!*"
		gosub :SWITCHBOARD~switchboard
		return
	:no_pwarp_lock
		killalltriggers
		setVar $bot~target $PLAYER~warpto
		gosub :bot~removefigfromdata
		setVar $SWITCHBOARD~message "No fighter down at that location!*"
		gosub :SWITCHBOARD~switchboard
		return
	:no_ore
		killalltriggers
		setVar $SWITCHBOARD~message "Not enough fuel for that pwarp.*"
		gosub :SWITCHBOARD~switchboard
		return
	:pwarp_lock
		killalltriggers
		send "y"
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
		if ($scan)
			send "s"
			waiton "Warps to Sector(s) :"
			send "* "
		end
		return
	:already
		killalltriggers
		setVar $SWITCHBOARD~message "Planet already in that sector!.*"
		gosub :SWITCHBOARD~switchboard
return
# ======================     END PWARP SUBROUTINES     ==========================

:wait_for_command
halt



# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\currentprompt\player"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\player\checkcorp\player"
include "source\module_includes\bot\checkstartingprompt\bot"
include "source\module_includes\bot\removefigfromdata\bot"
include "source\module_includes\bot\addfigtodata\bot"
include "source\bot_includes\player\checkfortravelname\player"
