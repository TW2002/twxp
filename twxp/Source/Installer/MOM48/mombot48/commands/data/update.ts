	logging off
	gosub :BOT~loadVars
	loadvar $bot~LIMP_COUNT_FILE
	loadVar $bot~ARMID_COUNT_FILE
	loadVar $bot~LIMP_FILE
	loadVar $bot~ARMID_FILE

	setVar $BOT~help[1]  $BOT~tab&" update {figs} {limps} {armids} {cim}"
	setVar $BOT~help[2]  $BOT~tab&"   "
	setVar $BOT~help[3]  $BOT~tab&"     Checks deployment lists and sets sector"
	setVar $BOT~help[4]  $BOT~tab&"     parameters.  Shows differences since last"
	setVar $BOT~help[5]  $BOT~tab&"     update"
	setVar $BOT~help[6]  $BOT~tab&"     "
	setVar $BOT~help[7]  $BOT~tab&"     {figs} - fighter refresh"
	setVar $BOT~help[8]  $BOT~tab&"    {limps} - limpet refresh, including active"
	setVar $BOT~help[9]  $BOT~tab&"   {armids} - armid refresh"
	setVar $BOT~help[10] $BOT~tab&"      {cim} - will refresh port and warp info"
	setVar $BOT~help[11] $BOT~tab&"             "
	setVar $BOT~help[12] $BOT~tab&"    update {cim} {upgrade level} {warps}   "
	setVar $BOT~help[13] $BOT~tab&"                             "
	setVar $BOT~help[14] $BOT~tab&"     Options:"
	setVar $BOT~help[15] $BOT~tab&"           {upgrade level} - Amount on port to  "
	setVar $BOT~help[16] $BOT~tab&"                             be considered upgraded"
	setVar $BOT~help[17] $BOT~tab&"                             (default 10,000)"
	setVar $BOT~help[18] $BOT~tab&"                                            "
	setVar $BOT~help[19] $BOT~tab&"                  {warps}  - Perform warp data  "
	setVar $BOT~help[20] $BOT~tab&"                             instead of port CIM"
	setVar $BOT~help[21] $BOT~tab&"                             "
	setVar $BOT~help[22] $BOT~tab&"     Examples:            "
	setVar $BOT~help[23] $BOT~tab&"            >update figs limps armids      "
	setVar $BOT~help[24] $BOT~tab&"            >update                 "
	setVar $BOT~help[25] $BOT~tab&"            >update cim warps     "
	setVar $BOT~help[26] $BOT~tab&"            >figs             "
	setVar $BOT~help[27] $BOT~tab&"            >limps            "
	setVar $BOT~help[28] $BOT~tab&"            >cim 10000       "

	gosub :bot~helpfile

	setVar $BOT~script_title "Update"
	gosub :BOT~banner

	
# ============================== START REFRESH LIMPETS (LIMPS) ==============================
	

	getwordpos " "&$bot~user_command_line&" " $pos " f"
	if ($pos > 0)
		setvar $fighter true
	else
		setvar $fighter false
	end

	getwordpos " "&$bot~user_command_line&" " $pos " l"
	if ($pos > 0)
		setvar $limpet true
	else
		setvar $limpet false
	end

	getwordpos " "&$bot~user_command_line&" " $pos " ar"
	getwordpos " "&$bot~user_command_line&" " $pos2 "mine"
	if (($pos > 0) or ($pos2 > 0))
		setvar $armid true
	else
		setvar $armid false
	end

	getwordpos " "&$bot~user_command_line&" " $pos " cim "
	if ($pos > 0)
		setvar $cim true
	else
		setvar $cim false
	end

	if (($fighter <> true) and ($armid <> true) and ($limpet <> true))
		setvar $all true
	end

	gosub  :player~currentPrompt
	setVar $startingLocation $PLAYER~CURRENT_PROMPT
	if ($startingLocation = "Command")

	elseif ($startingLocation = "Citadel")
		send "q"
		gosub :PLANET~getPlanetInfo
		send "q"
	elseif ($startingLocation = "Planet")
		gosub :PLANET~getPlanetInfo
		send "q"
	else
		setVar $SWITCHBOARD~message "Unknown Prompt*"
		gosub :SWITCHBOARD~switchboard
		halt
	end

	
	if ($cim)
		gosub :cim~update
		if (($startingLocation = "Citadel") OR ($startingLocation = "Planet"))
			gosub :PLANET~landingsub
		end
	else
		gosub :PLAYER~turnOffAnsi
		if ($all or $fighter)
			gosub :fighters~update
		end
		if ($all or $armid)
			gosub :armids~update
		end
		if ($all or $limpet)
			gosub :limpets~update
		end
		gosub :PLAYER~turnOnAnsi
		if (($startingLocation = "Citadel") OR ($startingLocation = "Planet"))
			gosub :PLANET~landingsub
		end

		setvar $switchboard~message ""
		if ($all or $fighter)
			gosub :fighters~report
		end
		if ($all or $armid)
			gosub :armids~report
		end
		if ($all or $limpet)
			gosub :limpets~report
		end
		if ($SWITCHBOARD~self_command = FALSE)
			setVar $SWITCHBOARD~self_command 2
		end

		gosub :SWITCHBOARD~switchboard
	end



halt
#===================================== END REFRESH LIMPS ========================================



#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\player\currentprompt\player"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\player\turnoffansi\player"
include "source\bot_includes\player\turnonansi\player"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\landingsub\planet"
include "source\module_includes\update\limpets"
include "source\module_includes\update\fighters"
include "source\module_includes\update\armids"
include "source\module_includes\update\cim"
include "source\bot_includes\player\formatnumberforspaces\player"
include "source\bot_includes\player\formatpercentagesforspaces\player"

