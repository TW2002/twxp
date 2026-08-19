:connectivity~keepalive
send #27
setvar $connectivity~relog_message ""
savevar $connectivity~relog_message
add $connectivity~alive_count 1
if ($connectivity~alive_count >= ($bot~echointerval * 2))
	setvar $connectivity~alive_count 0
	gosub :player~currentprompt
	getsectorparameter 2 "FIG_COUNT" $bot~figcount
	echo ansi_14 "*-= Time: " ansi_15 time ansi_14 " Fig Grid: " ansi_15 $bot~figcount ansi_14 " =-*" ansi_7
	echo currentansiline
end
if ((connected <> true) and ($bot~dorelog = true))
	if ($connectivity~relogging <> true)
		setvar $connectivity~relogging true
		savevar $connectivity~relogging
		goto :internal_commands~relog_attempt
	end
end

if ($connectivity~last_prompt_seen = currentline)

	if ((currentline = $game~game_menu_prompt) or (currentline = "Enter your choice: ") or (currentline = "Selection (? for menu): "))
		loadvar $bot~mode
		if (($connectivity~relogging <> true) and ($bot~mode <> "Xenter"))
			setvar $connectivity~relog_message "Stuck on baffling prompt: ["&currentline&"], so I relogged.*"
			savevar $connectivity~relog_message
			disconnect
			setvar $connectivity~relogging true
			savevar $connectivity~relogging
			goto :internal_commands~relog_attempt
		end
	end
end

setvar $connectivity~last_prompt_seen currentline
send #27
killtrigger keepalive
setdelaytrigger keepalive :keepalive 30000
pause

:connectivity~online_watch
if ((connected <> true) and ($bot~dorelog = true))
	if ($connectivity~relogging <> true)
		setvar $connectivity~relogging true
		savevar $connectivity~relogging
		goto :internal_commands~relog_attempt
	end
end
killtrigger keepalive
killtrigger online_watch
settexttrigger online_watch :online_watch "Your session will be terminated in "
setdelaytrigger keepalive :keepalive 20000
send #27
pause

:connectivity~do_relog
:connectivity~thedelay
gosub :killrelogtriggers
seteventtrigger continuelogin :continuelogin "CONNECTION ACCEPTED"
if (connected <> true)
	echo "*"&ansi_15&"["&ansi_3&"ATTEMPTING TO CONNECT"&ansi_15&"]*"
	connect
else
	goto :continuerelog3
end
pause

:connectivity~continuelogin
gosub :killrelogtriggers
settexttrigger relog3 :continuerelog3 "Please enter your name"
pause

:connectivity~continuerelog3
gosub :killrelogtriggers

settexttrigger loginsuccessful :continuerelog4v1 "Trade Wars 2002 Game Server v1"
settexttrigger loginsuccessful2 :continuerelog4v2 "TWGS v2"
send $bot~servername&"*"
pause

:connectivity~continuerelog4v1
setvar $connectivity~twgsversion 1
goto :continuerelog4

:connectivity~continuerelog4v2
setvar $connectivity~twgsversion 2
goto :continuerelog4

:connectivity~continuerelog4
gosub :killrelogtriggers
if ($connectivity~first_time)
	setvar $connectivity~first_time false
	disconnect
	goto :do_relog
end
settexttrigger relog69 :continuerelog5 "Make a Selection:"
settexttrigger relog3 :continuerelog5 "Selection (? for menu):"
send "#"&#8
pause

:connectivity~continuerelog5
gosub :killrelogtriggers

if ($connectivity~newgame)
	if ($connectivity~twgsversion = 1)
		settexttrigger firstpause :firstpause "[Pause]"
		settexttrigger enter :done_do_relog "Would you like to start a new character in this game?"
		settexttrigger v1enter :v1enter "Enter your choice"
		settextlinetrigger notopen :game_not_open "but this is a closed game."
		send $bot~letter&"                                           * "
		pause
	else
		settexttrigger firstpause :firstpause "[Pause]"
		settexttrigger enter :done_do_relog "Enter your choice"
		settexttrigger notopen :game_not_open "This game will open"
		send $bot~letter
		pause
	end

else
	settexttrigger firstpause :firstpause "[Pause]"
	settexttrigger enter :done_do_relog "Enter your choice"
	settexttrigger notopen :game_not_open "This game will open"
	send $bot~letter
	pause
end

:connectivity~firstpause
send "*"
settexttrigger firstpause :firstpause "[Pause]"
pause

:connectivity~v1enter
killtrigger firstpause
send "* T ***"
pause

:connectivity~done_do_relog
killalltriggers
if ($connectivity~newgame and ($connectivity~twgsversion = 2)) or ($connectivity~newgame = false)
	send "T***"
end
return

:connectivity~game_not_open
killalltriggers
if (connected <> true)
	goto :thedelay
end

if ($connectivity~newgame)
	if ($connectivity~twgsversion = 1)

		add $connectivity~newgamecounter 1
		if ($connectivity~newgamecounter > 20)
			killalltriggers
			disconnect
			setdelaytrigger waitamoment :waitamoment 5000
			pause

			:connectivity~waitamoment
			killalltriggers
			goto :thedelay
		end

		settexttrigger v1pause :v1pause "[Pause]"
		settexttrigger v1enter2 :v1enter2 "Enter your choice"
		setdelaytrigger 2 :new_game_delay2 1000
		settexttrigger 3 :tryagainnewgameday1 "Would you like to start a new character in this game?"
		settextlinetrigger 4 :tryagainentergame "but this is a closed game."
		send $bot~letter&"                                           * "
		pause

	else

		setdelaytrigger 2 :new_game_delay2 5000
		settexttrigger 3 :tryagainnewgameday1 "Enter your choice:"
		settextlinetrigger 4 :tryagainentergame "This game will open"
		send $bot~letter&" * "
		pause
	end

else

	setdelaytrigger 2 :new_game_delay2 5000
	settexttrigger 3 :tryagainnewgameday1 "Enter your choice:"
	settextlinetrigger 4 :tryagainentergame "This game will open"
	send $bot~letter&" * "
	pause
end

:connectivity~new_game_delay2
goto :game_not_open

:connectivity~tryagainentergame
goto :game_not_open

:connectivity~tryagainnewgameday1
if ($connectivity~newgame and ($connectivity~twgsversion = 2)) or ($connectivity~newgame = false)

	send "T ***"
end
killalltriggers
return

:connectivity~v1pause
send "*"
setvar $connectivity~newgamecounter 0
settexttrigger v1pause :v1pause "[Pause]"

pause

:connectivity~v1enter2
killtrigger v1pause
killtrigger firstpause
setvar $connectivity~newgamecounter 0
send "T ***"
pause
return

:connectivity~killrelogtriggers
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
killtrigger v1pause
setdelaytrigger thedelay2 :thedelay 5000
return

:connectivity~enter_new_game
setvar $connectivity~twgsversion ""

:connectivity~try_again
gosub :do_relog

:connectivity~gameclosed
killalltriggers
settextlinetrigger 1 :closed "I'm sorry, but this is a closed game."
settextlinetrigger 2 :closed "www.tradewars.com                                   Epic Interactive Strategy"
settextlinetrigger 3 :closed " day(s) to get back in."
setdelaytrigger 4 :closed 5000
settextlinetrigger 5 :on_planet "What do you want to name your home planet?"
settexttrigger 6 :wrong_name "Sorry, you cannot use the name "
settexttrigger 7 :back_in_game "Command [TL"

if ($connectivity~newgame)
	send "Y"&$bot~password&"*"&$bot~password&"*"
	settexttrigger 8 :whosplay "Who's Playing"
	settexttrigger 9 :newname "Use (N)ew Name or (B)BS Name"
	settexttrigger 10 :noalias "Choose a name carefully as you will have it for a while!"
else
	send $bot~password&"* * ************"
	waiton "What do you want to name your ship? (30 letters)"
	if ($menus~landonterra = true)
		send $bot~startshipname&"*Y l "
		return
	else
		send $bot~startshipname&"*Y "
	end
end
pause

:connectivity~whosplay
killtrigger 8
killtrigger 9
killtrigger 10
send "*N"&$bot~username&"*Y"&$bot~startshipname&"*Y * "
pause

:connectivity~newname
killtrigger 8
killtrigger 9
killtrigger 10
send "N"&$bot~username&"*Y"&$bot~startshipname&"*Y"
pause

:connectivity~noalias
killtrigger 8
killtrigger 9
killtrigger 10
send $bot~startshipname&"*Y * "
pause

:connectivity~wrong_name
killalltriggers
echo "[[  {"&$switchboard~bot_name&"} - Character name not allowed!  Start over and pick a new name!  ]]*"
halt

:connectivity~closed
killalltriggers
if (connected <> true)
	load "scripts\"&$bot~mombot_directory&"\commands\general\relog.cts"
	seteventtrigger 1 :relogended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\general\relog.cts"
	pause

	:connectivity~relogended
	goto :try_again
end
setdelaytrigger 2 :new_game_delay 300
settextlinetrigger 3 :tryagainnewgameday1 "T - Play Trade Wars 2002"
pause

:connectivity~new_game_delay
send $bot~letter&" * "
goto :gameclosed

:connectivity~on_planet
send ".*  Q  "
pause

:connectivity~back_in_game
killalltriggers
gosub :connectivity~clearreturnstate

if ($connectivity~newgame)
	gosub :connectivity~promotenewgamestate
end

if (($connectivity~newgame = true) and (($bot~isceo = true) and (($bot~corpname <> "") and ($bot~corppassword <> ""))))
	gosub :bot~killthetriggers
	send "tm" $bot~corpname "*y" $bot~corppassword "*yq"
	send "co*cq"
	setvar $connectivity~skipjoin true
	goto :resumestartaftercorpjoin
end
if ($connectivity~newgame and (($bot~isceo = false) and (($bot~corpname <> "") and ($bot~corppassword <> ""))))
	setvar $connectivity~skipjoin 0
	setvar $connectivity~attemps 0
	gosub :bot~killthetriggers

	:connectivity~checkforcorp2
	add $connectivity~attemps 1
	if ($connectivity~attemps >= 5)
		gosub :bot~killthetriggers
		send "q"
		goto :resumestartaftercorpjoin
	end
	send "*TD"
	gosub :player~quikstats
	settextlinetrigger 1 :thereismycorp2 "    "&$bot~corpname
	settexttrigger 2 :nocorpthatname2 "Corporate command ["
	send "L"
	pause

	:connectivity~nocorpthatname2
	gosub :bot~killthetriggers
	echo "[[ Waiting 3 seconds to check for corp again, press [Spacebar] to cancel. ]]*"
	setdelaytrigger 3 :checkforcorp2 200
	settextouttrigger 4 :alreadycorped #32
	pause

	:connectivity~thereismycorp2
	gosub :bot~killthetriggers
	getword currentline $connectivity~corpnumber 1

	:connectivity~continuecorpcreation2
	gosub :bot~killthetriggers
	send "J"&$connectivity~corpnumber&"*"&$bot~corppassword&"* * "
	setvar $connectivity~skipjoin 1
end

:connectivity~resumestartaftercorpjoin
if (($menus~mowdestination = 0) or ($menus~mowdestination = "0"))
	setvar $menus~mowdestination ""
end

if ($menus~mowdestination <> "")
	gosub :moving
end

if ($connectivity~newgame)
	gosub :bot~killthetriggers
	setvar $connectivity~wait_for_interrog false
	if (($bot~isceo = true) and (($bot~corpname <> "") and ($bot~corppassword <> "")))
		if ($connectivity~skipjoin <> true)
			settextlinetrigger 1 :alreadycorped "You may only be on one Corp at a time."
			settexttrigger 2 :continuecorpcreation "<Create New Corporation>"
			send "*TM"
			pause

			:connectivity~continuecorpcreation
			gosub :bot~killthetriggers
			send $bot~corpname&"*Y"&$bot~corppassword&"*Y"
			setvar $connectivity~wait_for_interrog true
		else
			goto :alldone
		end
	elseif (($bot~isceo = false) and (($bot~corpname <> "") and ($bot~corppassword <> "")))
		if ($connectivity~skipjoin <> true)

			:connectivity~checkforcorp
			send "*TD"
			gosub :player~quikstats
			settextlinetrigger 1 :thereismycorp "    "&$bot~corpname
			settexttrigger 2 :nocorpthatname "Corporate command ["
			send "L"
			pause

			:connectivity~nocorpthatname
			gosub :bot~killthetriggers
			echo "[[ Waiting 3 seconds to check for corp again, press [Spacebar] to cancel. ]]*"
			setdelaytrigger 3 :checkforcorp 3000
			settextouttrigger 4 :alreadycorped #32
			pause

			:connectivity~thereismycorp
			gosub :bot~killthetriggers
			getword currentline $connectivity~corpnumber 1

			:connectivity~continuecorpcreation
			gosub :bot~killthetriggers
			send "J"&$connectivity~corpnumber&"*"&$bot~corppassword&"* * "
			setvar $connectivity~wait_for_interrog true
		else
			goto :alldone
		end
	else

		:connectivity~alreadycorped
		gosub :bot~killthetriggers
	end
	if ($connectivity~wait_for_interrog = true)
		settextlinetrigger alldone :alldone ": ENDINTERROG"
		pause
	end

	:connectivity~alldone
	gosub :bot~killthetriggers
	gosub :connectivity~applypostloginprefs

end
if ($menus~mowdestination = "")
	gosub :moving
end

return

:connectivity~clearreturnstate
setvar $bot~do_not_resuscitate false
savevar $bot~do_not_resuscitate
setvar $bot~do_not_resuscitate false
savevar $bot~do_not_resuscitate
setvar $do_not_resuscitate false
savevar $do_not_resuscitate
setvar $bot~isshipdestroyed false
savevar $bot~isshipdestroyed
setvar $bot~isshipdestroyed false
savevar $bot~isshipdestroyed
return

:connectivity~promotenewgamestate
if ($bot~newgameday1 = true)
	setvar $bot~newgameday1 false
	savevar $bot~newgameday1
	setvar $bot~newgameolder true
	savevar $bot~newgameolder
end
return

:connectivity~applypostloginprefs
setvar $gameprefs~bank "CONNECTIVITY"
setvar $gameprefs~animation[$gameprefs~bank] "OFF"
if (($bot~subspace <> 0) and ($bot~subspace <> ""))
	setvar $gameprefs~subspace[$gameprefs~bank] $bot~subspace
end
gosub :gameprefs~setgameprefs
return

:connectivity~moving
echo #27 "[30D                        " #27 "[30D"
isnumber $connectivity~isnumber $menus~mowdestination
if ($connectivity~isnumber and ($bot~mowtodock or $menus~mowtorylos or $menus~mowtoalpha or $menus~mowtoother or $menus~fmowtodock))
	if ($bot~mowtodock or $menus~fmowtodock)
		if (((stardock = 0) or (stardock = "")) and ($map~stardock = 0))
			send "v"
			waiton "-=-=-=-  Current "
		end
		if (((stardock = 0) or (stardock = "")) and ($map~stardock = 0))
			setvar $switchboard~message "Stardock appears to be hidden in this game. Aborting mow.*"
			gosub :switchboard~switchboard
		else
			if ((stardock <> 0) and (stardock <> ""))
				setvar $map~stardock stardock
				savevar $map~stardock
			end
			setvar $menus~mowdestination $map~stardock
		end
	end
	if ($menus~fmowtodock = true)
		setvar $bot~user_command_line "fmow "&$menus~mowdestination&" 1 "
	else
		setvar $bot~user_command_line "mow "&$menus~mowdestination&" 1 "
	end
	setvar $bot~parm1 $menus~mowdestination
	setvar $bot~parm2 1
	if ($menus~start_mow_option <> "")
		setvar $bot~user_command_line $bot~user_command_line&$menus~start_mow_option&" "
		setvar $bot~parm3 $menus~start_mow_option
	end
	savevar $bot~user_command_line
	savevar $bot~parm1
	savevar $bot~parm2
	if ($menus~start_mow_option <> "")
		savevar $bot~parm3
	end
	setvar $menus~start_mow_option ""
	savevar $menus~start_mow_option
	if ($menus~fmowtodock = true)
		load "scripts\"&$bot~mombot_directory&"\modes\grid\fmow.cts"
		seteventtrigger 1 :fmowended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\modes\grid\fmow.cts"
		pause

		:connectivity~fmowended
	else
		load "scripts\"&$bot~mombot_directory&"\modes\grid\mow.cts"
		seteventtrigger 1 :mowended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\modes\grid\mow.cts"
		pause

		:connectivity~mowended
		loadvar $map~backdoor
	end
else
	if ($connectivity~isnumber and $menus~xporttoship)
		send "x    "&$menus~mowdestination&"  "
	else
		if ($menus~landonterra = true)
			settexttrigger 1 :landed_on_terra "Do you wish to (L)eave or (T)ake Colonists?"
			setdelaytrigger 2 :landing_timeout 5000
			send "l "
			pause

			:connectivity~landing_timeout
			killtrigger 2
			setvar $switchboard~message "Could not land on Terra!  Probably not in sector 1.*"
			gosub :switchboard~switchboard
			goto :done_landing_terra

			:connectivity~landed_on_terra
			killtrigger 1
			setvar $switchboard~message "Safely on Terra.*"
			gosub :switchboard~switchboard

			:connectivity~done_landing_terra
		elseif ($menus~landonstardock = true)
			settexttrigger 1 :landed_on_stardock "<Shipyards> Your option (?)"
			setdelaytrigger 2 :landing_timeout 5000
			send "pss "
			pause

			:connectivity~landing_timeout
			killtrigger 2
			setvar $switchboard~message "Could not land on Stardock!  Probably not in sector.*"
			gosub :switchboard~switchboard
			goto :done_landing_stardock

			:connectivity~landed_on_stardock
			killtrigger 1
			setvar $switchboard~message "Safely on Stardock.*"
			gosub :switchboard~switchboard

			:connectivity~done_landing_stardock
		end
	end
end

if (($menus~command_to_issue <> "") and ($menus~command_to_issue <> 0))
	setvar $bot~user_command_line $menus~command_to_issue
	setvar $menus~command_to_issue ""
	savevar $menus~command_to_issue
	goto :user_interface~runusercommandline
end
return

include "source\include\gameprefs"
include "source\include\user_interface"
include "source\include\player"
include "source\include\bot"
