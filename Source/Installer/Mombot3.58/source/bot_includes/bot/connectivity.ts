#===================================== KEEP ALIVE ============================================
:keepalive
		send #27
		setvar $relog_message ""
		add $alive_count 1
	if ($alive_count >= ($BOT~echoInterval * 2))
		setVar $alive_count 0
		gosub  :player~currentPrompt
		getSectorParameter 2 "FIG_COUNT" $BOT~figCount
		echo ANSI_14 "*-= Time: " ANSI_15 TIME ANSI_14 " Fig Grid: " ANSI_15 $BOT~figCount ANSI_14 " =-*" ANSI_7
		echo CURRENTANSILINE
	end
	if ((CONNECTED <> TRUE) AND ($BOT~doRelog = TRUE))
		if ($relogging <> true)
			setvar $relogging true
			savevar $relogging
			goto :internal_commands~relog_attempt
		end
	end
	
	# if the last line hasn't changed for the last two keep alive checks #
	if ($last_prompt_seen = CURRENTLINE)
		# at server game menu for some reason #
		if ((CURRENTLINE = $game~game_menu_prompt) or (CURRENTLINE = "[Pause] - [Press Space or Enter to continue]") or (CURRENTLINE = "Enter your choice: ") or (CURRENTLINE = "Selection (? for menu): "))
			if ($relogging <> true)
				setvar $relog_message "Stuck on baffling prompt: ["&CURRENTLINE&"], so I relogged.*"
				DISCONNECT
				setvar $relogging true
				savevar $relogging
				goto :internal_commands~relog_attempt
			end
		end
		# TODO - add checking for subprompt interactivity turned off and resetting prompts that turn off comms if stuck there #
	end
	setvar $last_prompt_seen CURRENTLINE
	send #27
	killtrigger keepalive
	setDelayTrigger     keepalive               :keepalive           30000
	pause
#=================================== END KEEP ALIVE ==========================================



#================================= ONLINE WATCH/RELOG ========================================
:online_watch
	if ((CONNECTED <> TRUE) AND ($BOT~doRelog = TRUE))
		if ($relogging <> true)
			setvar $relogging true
			savevar $relogging
			goto :internal_commands~relog_attempt
		end
	end
	setTextTrigger      online_watch            :online_watch              "Your session will be terminated in "
	send #27
	pause



:do_relog
		:thedelay
			gosub :killrelogtriggers
			setEventTrigger continuelogin :continuelogin "CONNECTION ACCEPTED"
			if (CONNECTED <> TRUE)
				ECHO "*"&ansi_15&"["&ansi_3&"ATTEMPTING TO CONNECT"&ansi_15&"]*"
				connect
			else
				goto :continueRelog3
			end
			pause
			:continuelogin
			gosub :killrelogtriggers
			setTextTrigger relog3 :continueRelog3 "Please enter your name"
			pause
		:continueRelog3
			gosub :killrelogtriggers
			# formly "Trade Wars 2002"
			# formly "Copyright (C) EIS"
			setTextTrigger loginsuccessful :continueRelog4v1 "Trade Wars 2002 Game Server v1"
			setTextTrigger loginsuccessful2 :continueRelog4v2 "TWGS v2"
			send $BOT~username & "*"
			pause
		
		:continueRelog4v1
			setVar $twgsVersion "1"
			goto :continueRelog4
		:continueRelog4v2
			setVar $twgsVersion "2"
			goto :continueRelog4

		:continueRelog4
			gosub :killrelogtriggers
			if ($first_time)
				setVar $first_time FALSE
				disconnect
				goto :do_relog
			end
			setTextTrigger relog69 :continueRelog5 "Make a Selection:"
			setTextTrigger relog3 :continueRelog5 "Selection (? for menu):"
			send "#"&#8
			pause
		:continueRelog5
			gosub :killrelogtriggers

			if ($newgame)
				if  ($twgsVersion = "1")
					setTextTrigger		firstpause	:firstpause "[Pause]"
					setTextTrigger		enter		:done_do_relog	"Would you like to start a new character in this game?"
					setTextTrigger		v1enter		:v1enter "Enter your choice"
					setTextLineTrigger      notopen		:game_not_open	"but this is a closed game."
					send $BOT~letter&" * "
					pause
				else
					setTextTrigger firstpause :firstpause "[Pause]"
					setTextTrigger enter :done_do_relog "Enter your choice"
					setTextTrigger notopen :game_not_open "This game will open"
					send $BOT~letter
					pause

				end

			else
				setTextTrigger firstpause :firstpause "[Pause]"
				setTextTrigger enter :done_do_relog "Enter your choice"
				setTextTrigger notopen :game_not_open "This game will open"
				send $BOT~letter
				pause

			end
			
		:firstpause
			send "*"
			setTextTrigger firstpause :firstpause "[Pause]"
			pause
		:v1enter
			killtrigger firstpause
			send "* T ***"
			pause
		:done_do_relog
			killalltriggers
			if ((($newgame) and ($twgsVersion = "2")) or ($newgame = FALSE))
				send "T***"
			end
			return
		:game_not_open			
			killalltriggers
			if (CONNECTED <> TRUE)
				goto :thedelay
			end

			if ($newgame)
				if  ($twgsVersion = "1")
					# occasionally fails to keep sending commands - going to see if this solves
					add $newGameCounter 1
					if ($newGameCounter > 20)
						killalltriggers
						disconnect
						setDelayTrigger waitAMoment :waitAMoment 5000
						pause
						:waitAMoment
							killalltriggers
							goto :thedelay
					end
		
					setTextTrigger		v1Pause	:v1Pause "[Pause]"
					setTextTrigger		v1Enter2 :v1Enter2 "Enter your choice"
					setDelayTrigger		2	:new_game_delay2 2000
					setTextTrigger		3	:tryAgainNewGameDay1	"Would you like to start a new character in this game?"
					setTextLineTrigger      4       :tryAgainEnterGame	"but this is a closed game."
					send $BOT~letter&" * "
					pause


				else
		
					setDelayTrigger		2	:new_game_delay2 5000
					setTextTrigger		3	:tryAgainNewGameDay1	"Enter your choice:"
					setTextLineTrigger      4       :tryAgainEnterGame	"This game will open"
					send $BOT~letter&" * "
					pause

				end

			else
	
				setDelayTrigger		2	:new_game_delay2 5000
				setTextTrigger		3	:tryAgainNewGameDay1	"Enter your choice:"
				setTextLineTrigger      4       :tryAgainEnterGame	"This game will open"
				send $BOT~letter&" * "
				pause

			end
			
			:new_game_delay2
				goto :game_not_open
			:tryAgainEnterGame
				goto :game_not_open
			:tryAgainNewGameDay1

			if ((($newgame) and ($twgsVersion = "2")) or ($newgame = FALSE))
	
				send "T ***"
			end
			killalltriggers
			return
		:v1Pause
			send "*"
			setVar  $newGameCounter 0
			setTextTrigger v1Pause :v1Pause "[Pause]"
			
			pause
		:v1Enter2
			killtrigger v1Pause
			killtrigger firstpause
			setVar  $newGameCounter 0
			send "T ***"
			pause
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
	killtrigger notopen
	killtrigger v1enter
	killtrigger v1enter2
	killtrigger v1Pause
	setDelayTrigger thedelay2 :thedelay 5000
return

:enter_new_game 
	setVar $twgsVersion ""
	:try_again
	gosub :do_relog
	:GameClosed
	setTextLineTrigger  1 :closed 		"I'm sorry, but this is a closed game."
	setTextLineTrigger  2 :closed 		"www.tradewars.com                                   Epic Interactive Strategy"
	setTextLineTrigger  3 :closed		" day(s) to get back in."
	setDelayTrigger     4 :closed 		5000
	setTextLineTrigger  5 :on_planet	"What do you want to name your home planet?"
	settexttrigger      6 :wrong_name	"Sorry, you cannot use the name "
	setTextTrigger      7 :back_in_game	"Command [TL"


	if ($newgame)
		send "Y"&$BOT~password&"*"&$BOT~password&"*"
		setTextTrigger 8 :whosplay	"Who's Playing"
		setTextTrigger 9 :newname	"Use (N)ew Name or (B)BS Name"
		setTextTrigger 10 :noalias	"Choose a name carefully as you will have it for a while!"
	else
		send $BOT~password&"***"&$BOT~startShipName&"*Y "
	end
	pause
	:whosplay
		killtrigger 8
		killtrigger 9
		killtrigger 10
		send "*N"&$BOT~username&"*Y"&$BOT~startShipName&"*Y * "
		pause
	:newname
		killtrigger 8
		killtrigger 9
		killtrigger 10
		send "N"&$BOT~username&"*Y"&$BOT~startShipName&"*Y"
		pause
	:noalias
		killtrigger 8
		killtrigger 9
		killtrigger 10
		send $BOT~startShipName&"*Y * "
		pause
	:wrong_name
		killalltriggers
		echo "[[  {"&$SWITCHBOARD~bot_name&"} - Character name not allowed!  Start over and pick a new name!  ]]*"
		halt
	:closed
		killalltriggers
		if (CONNECTED <> TRUE)
			load "scripts\mombot\commands\general\relog.cts"
			setEventTrigger		1		:relogended	"SCRIPT STOPPED" "scripts\mombot\commands\general\relog.cts"
			pause
			:relogended
			goto :try_again
		end
		setDelayTrigger		2	:new_game_delay 300
		setTextLineTrigger	3	:tryAgainNewGameDay1	"T - Play Trade Wars 2002"
		pause
	:new_game_delay
		send $BOT~letter&" * "
		goto :GameClosed
	:on_planet
		send ".*  Q  "
		pause
	:back_in_game
	killalltriggers

	if ($menus~mowDestination <> "")
		gosub :moving
	end
	if ($newgame)
		gosub :BOT~killthetriggers
		if (($BOT~isCEO = TRUE) AND ($BOT~corpName <> "") AND ($BOT~corpPassword <> ""))
			setTextLineTrigger	1 :alreadyCorped		"You may only be on one Corp at a time."
			setTextTrigger 		2 :continueCorpCreation	"<Create New Corporation>"
			send "*TM"
			pause
			:continueCorpCreation
				gosub :BOT~killthetriggers
				send $BOT~corpName&"*Y"&$BOT~corpPassword&"*Y*CN24"&$BOT~subspace&"* Q Q Q ZN* ^Q c o* c q "

		elseif (($BOT~isCEO = FALSE) AND ($BOT~corpName <> "") AND ($BOT~corpPassword <> ""))
			:checkForCorp
				send "*TD"
				gosub :PLAYER~quikstats
				setTextLineTrigger	1 :thereIsMyCorp	"    "&$BOT~corpName
				setTextTrigger 		2 :noCorpThatName	"Corporate command ["
				send "L"
				pause
			:noCorpThatName
				gosub :BOT~killthetriggers
				echo "[[ Waiting 3 seconds to check for corp again, press [Spacebar] to cancel. ]]*"
				setDelayTrigger		3 :checkForCorp		3000
				setTextOutTrigger 	4 :alreadyCorped 	#32
				pause
			:thereIsMyCorp
				gosub :BOT~killthetriggers
				getWord CURRENTLINE $corpNumber 1
			:continueCorpCreation
				gosub :BOT~killthetriggers
				send "J"&$corpNumber&"*"&$BOT~corpPassword&"* * *CN24"&$BOT~subspace&"* Q Q Q ZN* ^Q c o* c q "
		else
			:alreadyCorped
				gosub :BOT~killthetriggers
				send "* * *CN24"&$BOT~subspace&"*Q Q Q ZN* ^Q c o* c q q * "
		end
		setTextLineTrigger      AllDone     :AllDone ": ENDINTERROG"
		pause
		:AllDone
			gosub :BOT~killthetriggers

	end

	# Don't think is needed now I've moved command_to_issue to below
	if ($menus~mowDestination = "")
		gosub :moving
	end

	if (($menus~command_to_issue <> "") and ($menus~command_to_issue <> "0"))
		setVar $BOT~user_command_line $menus~command_to_issue
		setVar $menus~command_to_issue ""
		saveVar $menus~command_to_issue
		goto :USER_INTERFACE~runUserCommandLine
	end

return

:moving

		echo #27 "[30D                        " #27 "[30D"
		isNumber $isNumber $menus~mowDestination  
		if ($isNumber and ((($BOT~mowToDock) OR ($menus~mowToRylos) OR ($menus~mowToAlpha) OR ($menus~mowToOther))))
			if ($BOT~mowToDock)
				if (((STARDOCK = "0") OR (STARDOCK = "")) and ($map~stardock = "0"))
					send "v"
					waitOn "-=-=-=-  Current "
				end
				if (((STARDOCK = "0") OR (STARDOCK = "")) and ($map~stardock = "0"))
					send "'{" $SWITCHBOARD~bot_name "} - Stardock appears to be hidden in this game. Aborting mow.*"
				else
					if ((STARDOCK <> "0") and (STARDOCK <> ""))
						setVar $MAP~stardock STARDOCK
						savevar $map~stardock
					end
					setVar $menus~mowDestination $MAP~stardock
				end
			end
			setvar $BOT~user_command_line "mow "&$menus~mowDestination&" "
			setVar $BOT~parm1 $menus~mowDestination
			if ($menus~start_mow_option <> "")
				setvar $BOT~user_command_line $BOT~user_command_line & $menus~start_mow_option & " "
				setVar $BOT~parm2 $menus~start_mow_option
			end
			savevar $bot~user_command_line
			savevar $bot~parm1
			if ($menus~start_mow_option <> "")
				savevar $bot~parm2
			end
			setVar $menus~start_mow_option ""
			saveVar $menus~start_mow_option
			load "scripts\mombot\modes\grid\mow.cts"
			setEventTrigger		1		:mowended	"SCRIPT STOPPED" "scripts\mombot\modes\grid\mow.cts"
			pause
			:mowended
		else
			if (($isNumber) and ($menus~xportToShip))
				send "x    "&$menus~mowDestination&"  "
			else
				if ($menus~landOnTerra = true)
					setTextTrigger 		1	:landed_on_terra	"Do you wish to (L)eave or (T)ake Colonists?"
					setDelayTrigger     2	:landing_timeout	5000
					send "l "
					pause
					:landing_timeout
						killtrigger 2
						send "'{" $SWITCHBOARD~bot_name "} - Could not land on Terra!  Probably not in sector 1.*"
						goto :done_landing_terra
					:landed_on_terra
						killtrigger 1
						send "'{" $SWITCHBOARD~bot_name "} - Safely on Terra.*"
					:done_landing_terra
				end
			end
		end

return

