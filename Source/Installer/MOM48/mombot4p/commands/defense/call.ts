	gosub :BOT~loadVars
	loadVar $BOT~ARMID_COUNT_FILE

	setVar $BOT~help[1] $BOT~tab&"CALL - Call SaveMe Command"
	setVar $BOT~help[2] $BOT~tab&"       Used to trigger a SaveMe Script"
	setVar $BOT~help[3] $BOT~tab&"     "
	setVar $BOT~help[4] $BOT~tab&"       - Originally written by Cherokee"
	gosub :bot~helpfile


	getwordpos " "&$bot~user_command_line&" " $pos " kill "
	if ($pos > 0)
		setvar $kill true
	else
		setvar $kill false
	end

	getwordpos " "&$bot~user_command_line&" " $pos " cap "
	if ($pos > 0)
		setvar $cap true
	else
		setvar $cap false
	end

		
:callSaveMe
	killAllTriggers
	send "q q q * * * * "
	gosub :player~quikstats
		setVar $figstodeploy 1


	gosub :deployfigs
	send "'" & $player~current_sector & "=saveme*"
	send "'pickup " & $player~current_sector  & " ::*"
	

:waitforhelp
	setTextLineTrigger friendlytwarp :friendlytwarp "appears in a brilliant flash of warp energies!"
	setTextLineTrigger friendlyplanet :friendlyplanet "Saveme script activated - Planet "
	setTextLineTrigger towlocked :towlocked "locks a tractor beam on your ship."
	setDelayTrigger timeout :timeout 30000
	pause

	:timeout
		killalltriggers
		send "'30 seconds after save call, script halted.*"
		halt

	:friendlytwarp
		killalltriggers
		setVar $figstodeploy "ALL"
		gosub :deployfigs
		goto :waitforhelp

	:friendlyplanet
		killalltriggers
		getText CURRENTLINE $planet~planet "Saveme script activated - Planet " " to "
		send "L " & $planet~planet & "* m* * * C 'I landed on planet " & $planet~planet & "*"

		gosub :player~quikstats
		if ($player~fighters > 100)
			if ($kill)
				send "'" & $SWITCHBOARD~bot_name " citkill on*"	
			elseif ($cap)
				send "'" & $SWITCHBOARD~bot_name " citcap on*"
			end
		end
		halt

	:towlocked
		killalltriggers
		send "'Tow locked, get us out of here!*"
		halt


:deployfigs
	if ($figstodeploy = 0)
		setVar $figstodeploy 1
	end
	if (($player~current_sector  < 11) or ($player~current_sector  = STARDOCK))
		send "'Can't deploy figs in fed*"
		return
	end
	send "a y y 9999* F"
	setTextLineTrigger nocontrol :nocontrol "These fighters are not under your control."
	setTextLineTrigger abletodeploy :abletodeploy "fighters available."
	pause

	:nocontrol
		killalltriggers
		send "'We don't control the figs in this sector!*"
		gosub :xenter~run
	return

	:abletodeploy
		killalltriggers
		getWord CURRENTLINE $figsavailable 3
		striptext $figsavailable ","
		if ($figstodeploy = "ALL")
			setVar $figstodeploy $figsavailable
		end
		if ($figsavailable = 0)
			send "0* ZC D* 'I have no figs to deploy!*"
		else
			send $figstodeploy & "* ZC D* '" & $figstodeploy & " figs deployed*"
		end
return


#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\external\xenter"

