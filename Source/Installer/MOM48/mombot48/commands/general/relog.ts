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
			killtrigger timedwaitForRelogDelay
			killtrigger showtoday
			send "T*"
			setTextTrigger showtoday :continueshowtoday "Show today's log?"
			setDelayTrigger timedwaitForRelogDelay :enter 500
			setDelayTrigger unfreezingTrigger :relog_attempt 20000
			pause
		:continueshowtoday
			killtrigger timedwaitForRelogDelay
			gosub :relog_freeze_trigger
			send "*"
			setTextTrigger pause2 :continuepause2 "[Pause]"
			setDelayTrigger unfreezingTrigger :relog_attempt 20000
			pause
		:continuepause2
			gosub :relog_freeze_trigger
			send "*"
			setTextTrigger password :continuepassword "A password is required to enter this game."
			setDelayTrigger unfreezingTrigger :relog_attempt 20000
			pause
		:continuepassword
			gosub :relog_freeze_trigger
			settextlinetrigger dead :dead "What do you want to name your ship? (30 letters)"
			settexttrigger alive :alldone_relog "Command ["
			settexttrigger aliveOnPlanet :alldone_relog "Planet command (?=help) [D]"
			settexttrigger avoids :continueavoids "Do you wish to clear some avoids? (Y/N) [N]"
			settexttrigger messages :continuemessages "[Pause]"
			settexttrigger delete :continuedelete "[Pause] - Delete messages? (Y/N)"
			settexttrigger timed :timed_game_closed "Access to this game is limited.  Access modes are as follows:"
			setDelayTrigger unfreezingTrigger :relog_attempt 20000
			send $BOT~password & "**  *  *  "
			pause
		:timed_game_closed
			killalltriggers
			waiton "Current time: "
			getText currentline&"[END]" $game_current_time ":" "[END]"
			waiton "It will reopen at "
			getText currentline $game_open_time "It will reopen at " "."
			
			splittext $game_current_time $current_time " " 
			splittext $game_open_time $open_time " "
			splittext $current_time[1] $current_time_split ":"
			splittext $open_time[1] $open_time_split ":"
			# check if am and pm match #
			setvar $foundTime false
			setvar $current_hour $current_time_split[1]
			setvar $open_hour $open_time_split[1]
			setvar $current_minute $current_time_split[2]
			setvar $open_minute $open_time_split[2]
			lowercase $current_time[2]
			lowercase $open_time[2]
			if (($open_time[2] = "pm") and ($open_hour <> "12"))
				setvar $open_hour $open_hour+12
			end
			if (($current_time[2] = "pm") and ($current_hour <> "12"))
				setvar $current_hour $current_hour+12
			end
			setvar $hour_hand $current_hour
			setvar $hours_difference 0
			while ($hour_hand <> $open_hour)
				add $hours_difference 1
				add $hour_hand 1
				if ($hour_hand > 24)
					setvar $hour_hand 1
				end
			end
			setvar $minute_hand $current_minute
			setvar $minute_difference 0
			while ($minute_hand <> $open_minute)
				add $minute_difference 1
				add $minute_hand 1
				if ($minute_hand > 60)
					setvar $minute_hand 0
				end
			end
			if ($minute_difference > 60)
				setvar $minute_difference ($minute_difference-60)
			else
				if ($minute_difference > 0)
					setvar $hours_difference ($hours_difference-1)
				end
			end
			setvar $minutes_until_game (($hours_difference*60)+$minute_difference)			
			if ($minutes_until_game > 2)
				killalltriggers
				disconnect
				setVar $timer 0
				setTextOutTrigger logearly :endLogoffGame #32
				setvar $timeToLogBackIn (($minutes_until_game-2)*60)
				while ($timeToLogBackIn > 0)
					gosub :calcTime
					echo ANSI_10 #27 & "[1A" & #27 & "[K" & $hours ":" $minutes ":" $seconds " left before entering game " GAME " (" GAMENAME ") (2 minutes early)"&ANSI_15&" ["&ANSI_14&"Spacebar to relog"&ANSI_15&"]*"
					setDelayTrigger timeBeforeRelog :relogTimer 1000
					pause
					:relogTimer
						setVar $timeToLogBackIn $timeToLogBackIn-1
				end
				:endLogoffGame
				killtrigger logearly
				killtrigger timeBeforeRelog
				goto :relog_attempt
			else
				setDelayTrigger timedwaitForRelogDelay :enter 500
				setDelayTrigger unfreezingTrigger :relog_attempt 20000
				pause
			end
		:continuedelete
			send "*  * "
			pause
		:continuemessages
			send "  "
			gosub :relog_freeze_trigger
			settexttrigger messages :continuemessages "[Pause]"
			setDelayTrigger unfreezingTrigger :relog_attempt 20000
			pause
		:continueavoids
			send "* * "
			pause
		:dead
			send "Mind ()ver Matter*y "
			pause		
		:alldone_relog
			killtrigger clearvoids
			killtrigger novoids
			killtrigger morepauses
			killtrigger avoids
			killtrigger messages
			killtrigger alive
			killtrigger aliveOnPlanet
			killtrigger delete
			send "Z*  *  Z*  Z   A 9999*  Z*  "
			setvar $switchboard~message "Auto-relog activated*"
			gosub :switchboard~switchboard
			loadvar $bot~startMacro
			if ($bot~startMacro <> "")
				halt
			end
			gosub :relog_freeze_trigger
			killtrigger 1
			setDelayTrigger 1 :didnotmakeittogame 10000
			gosub :player~quikstats
			killtrigger 1
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
			loadvar $relog_message
			if (($relog_message <> "") and ($relog_message <> "0"))
				setvar $switchboard~message $relog_message
				gosub :switchboard~switchboard
				setvar $relog_message ""
				savevar $relog_message
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

:calcTime
	setVar $hours 0
	setVar $minutes 0
	setVar $seconds 0
	setVar $testTime $timeToLogBackIn
	if ($testTime >= 3600)
		setVar $hours ($testTime/3600)
		setVar $testTime $testTime-($hours*3600)
	end
	if ($testTime >= 60)
		setVar $minutes ($testTime/60)
		setVar $testTime $testTime-($minutes*60)
	end
	if ($testTime >= 1)
		setVar $seconds $testTime
	end
	if ($hours < 10)
		setVar $hours "0"&$hours
	end
	if ($minutes < 10)
		setVar $minutes "0"&$minutes
	end
	if ($seconds < 10)
		setVar $seconds "0"&$seconds
	end
return

#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\planet\landingsub\planet"
