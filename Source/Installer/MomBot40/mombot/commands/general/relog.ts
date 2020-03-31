	gosub :BOT~loadVars
	loadvar $bot~username
	loadvar $bot~letter
	loadvar $bot~password
	loadvar $bot~servername

	setvar $bot~command "relog"	
	setVar $BOT~help[1] $BOT~tab&"relog"
	setVar $BOT~help[2] $BOT~tab&"  - attempt to log the bot back into the game"
	gosub :bot~helpfile


	:relog_attempt
		loadvar $bot~dorelog 
		if ($BOT~doRelog <> TRUE)
			halt
		end

		if (connected)
			disconnect
		end
		
		killalltriggers
		setDelayTrigger waitForRelogDelay :continueDoingRelog 500
		pause
		:continueDoingRelog
			setvar $first_time TRUE
			gosub :do_relog
		:enter
			gosub :relog_freeze_trigger
			killtrigger relog
			killtrigger relog2
			killtrigger firstpause
			send "T*"
			setTextTrigger showtoday :continueshowtoday "Show today's log?"
			pause
		:continueshowtoday
			gosub :relog_freeze_trigger
			send "*"
			setTextTrigger pause2 :continuepause2 "[Pause]"
			pause
		:continuepause2
			gosub :relog_freeze_trigger
			send "*"
			setTextTrigger password :continuepassword "A password is required to enter this game."
			pause
		:continuepassword
			gosub :relog_freeze_trigger
			send $BOT~password & "*"
		:alldone_relog
			killtrigger clearvoids
			killtrigger novoids
			killtrigger morepauses
			gosub :relog_freeze_trigger
			send "Z*  *  Z*  Z   A 9999*  Z*  /"
			setvar $switchboard~message "Auto-relog activated*"
			gosub :switchboard~switchboard
			setDelayTrigger 1 :didnotmakeittogame 10000
			waiton #179
		:continuerelogmessage
			gosub :PLAYER~quikstats
			gosub :relog_freeze_trigger
			if ($PLAYER~CURRENT_PROMPT = "Planet")
				send "*"
				gosub :PLANET~getPlanetInfo
				if ($planet~CITADEL > 0)
					send "c "
					setvar $switchboard~message "In citadel, planet "&$planet~planet&".*"
					gosub :switchboard~switchboard
					halt
				else
					setvar $switchboard~message "On planet "&$planet~planet&".*"
					gosub :switchboard~switchboard
					halt
				end
			end
			if (($relog_message <> "") and ($relog_message <> "0"))
				setvar $switchboard~message $relog_message
				gosub :switchboard~switchboard
			end
			loadVar $planet~planet
			if (($planet~planet <> 0) AND ($PLAYER~CURRENT_SECTOR <> 1) AND ($PLAYER~CURRENT_SECTOR <> $MAP~stardock))
				gosub :planet~landingsub
			end
	halt

	:didnotmakeittogame
		echo ANSI_4&"*Didn't make it into the game!  Bot will try again in about 30 seconds.*"&ANSI_15
		halt
#============================== END ONLINE WATCH/RELOG SUB ==============================

:relog_freeze_trigger
	  killtrigger unfreezingTrigger
	  killtrigger unfreezingTriggerBigDelay
return


:do_relog
		:thedelay
			if (CONNECTED <> TRUE)
				connect
			end
			gosub :killrelogtriggers
			setEventTrigger continuelogin :continuelogin "CONNECTION ACCEPTED"
			pause
			:continuelogin
			gosub :killrelogtriggers
			setTextTrigger relog3 :continueRelog3 "Please enter your name"
			pause
		:continueRelog3
			gosub :killrelogtriggers
			setTextTrigger loginsuccessful :continueRelog4 "Trade Wars 2002"
			setTextTrigger loginsuccessful2 :continueRelog4 "Copyright (C) EIS"
			send $BOT~servername & "*"
			pause

		:continueRelog4
			gosub :killrelogtriggers
			setTextTrigger relog69 :continueRelog5 "Make a Selection:"
			setTextTrigger relog3 :continueRelog5 "Selection (? for menu):"
			send "#"&#8
			pause
		:continueRelog5
			gosub :killrelogtriggers
			setTextTrigger firstpause :firstpause "[Pause]"
			setTextTrigger enter :done_do_relog "Enter your choice"
			send $BOT~letter
			pause
		:firstpause
			send "*"
			setTextTrigger firstpause :firstpause "[Pause]"
			pause
		:done_do_relog
			killalltriggers
return

:killrelogtriggers
	killtrigger continuelogin
	killtrigger thedelay
	killtrigger thedelay2
	killtrigger relog
	killtrigger relog2
	killtrigger relog3
	killtrigger relog69
	killtrigger relog89
	killtrigger loginsuccessful
	killtrigger loginsuccessful2
	killtrigger firstpause
	killtrigger enter
	setDelayTrigger thedelay2 :thedelay 5000
return



#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\planet\landingsub\planet"
