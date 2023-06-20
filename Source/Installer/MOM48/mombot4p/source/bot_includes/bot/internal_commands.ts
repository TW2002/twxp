# ============================== END MAIN BODY WAIT FOR COMMANDS SUB ==============================
:loginmemo
	getWordPos CURRENTANSILINE $pos (#27 & "[32mYou have a corporate memo from " & #27 & "[1;36m")
	getwordpos currentansiline $pos2 ("[K[0;32mYou have a corporate memo from [1;36m")
	if ($pos > 0)
		getText CURRENTANSILINE $user_name (#27 & "[32mYou have a corporate memo from " & #27 & "[1;36m") (#27 & "[0;32m." & #13)
		gosub :checklogin
	elseif ($pos2 > 0)
		getText CURRENTANSILINE $user_name ("[K[0;32mYou have a corporate memo from " & #27 & "[1;36m") (#27 & "[0;32m." & #13)
		gosub :checklogin
	end
	:endloginmemo
		killtrigger loginmemo
		setTextLineTrigger	  loginmemo			   :loginmemo			"You have a corporate memo from "
		pause


		:checklogin
			setVar $i 1
			setVar $tempUsername $user_name
			lowercase $tempUsername
			lowerCase $user_name
			while ($i <= $BOT~corpycount)
			setVar $tempCorpy $BOT~corpy[$i]
			lowerCase $tempCorpy
			if ($tempCorpy = $tempUsername)
				return
			end
			add $i 1
			end
			add $BOT~corpycount 1
			setVar $BOT~corpy[$BOT~corpycount] $user_name
			cutText $user_name $cut_user_name 1 6
			stripText $cut_user_name " "
			setVar $loggedin[$cut_user_name] 1
			send "'["&$BOT~mode&"]{"&$SWITCHBOARD~bot_name&"} - User Verified - "&$user_name&"*"
		return
# ======================================= COMMAND ROUTING =========================================


:stop
	gosub :BOT~killthetriggers
	listActiveScripts $scripts
	setVar $i 1
	setVar $found FALSE
	while ($i <= $scripts)
		lowerCase $scripts[$i]
		getWordPos "<><><>"&$scripts[$i] $pos "<><><>"&$BOT~parm1
		getWordPos "<><><>"&$scripts[$i] $pos2 "<><><>mombot"
		if (($pos > 0) and ($pos2 <= 0))
			stop $scripts[$i]
			setVar $found TRUE
			setVar $SWITCHBOARD~message "Script ["&$scripts[$i]&"] killed.*"
			gosub :SWITCHBOARD~switchboard
		end
		add $i 1
	end
	if ($FOUND = FALSE)
		setVar $SWITCHBOARD~message "No script starting with "&$BOT~parm1&" was found to kill.*"
		gosub :SWITCHBOARD~switchboard
	end
	goto :BOT~wait_for_command

# ========================== START STOPALL (STOPALL) SUBROUTINE ==============================
:stopall
	gosub :BOT~killthetriggers
	openMenu TWX_STOPALLFAST FALSE
	setVar $BOT~mode "General"
	savevar $bot~mode
	gosub :msgs_on

	if ($was_silent)
		setVar $SWITCHBOARD~message "All non-system scripts and modules killed, and modes reset. Also, turned messages back on.*"
	else
		setVar $SWITCHBOARD~message "All non-system scripts and modules killed, and modes reset.*"
	end
	gosub :SWITCHBOARD~switchboard
	goto :BOT~wait_for_command

:msgs_on
	setVar $was_silent TRUE
	:msgs_on_again
	setTextTrigger onMSGS_ON  :onMSGS_ON "Displaying all messages."
	setTextTrigger onMSGS_OFF :onMSGS_OFF "Silencing all messages."
	send "|"
	pause
	:onMSGS_OFF
	killtrigger onMSGS_ON
	SETVAR $was_silent FALSE
	goto :msgs_on_again
	:onMSGS_ON
	killtrigger onMSGS_OFF
	loadvar $BOT~botIsDeaf
	if ($BOT~botIsDeaf = TRUE)
		gosub :MENUS~donePrefer
	end
return

# =========================== END STOPALL (STOPALL) SUBROUTINE ================================
:listall
	listActiveScripts $scripts
	setVar $a 1
	setVar $SWITCHBOARD~message " Current script(s) loaded*"
	setVar $SWITCHBOARD~message $SWITCHBOARD~message&"--------------------------*"
	while ($a <= $scripts)
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&"   "&$scripts[$a]&"*"
		add $a 1
	end
	if (($SWITCHBOARD~self_command <> TRUE) OR ($bot~silent_running <> TRUE))
		setVar $SWITCHBOARD~self_command 2
	end
	gosub :SWITCHBOARD~switchboard  
goto :BOT~wait_for_command
# ================================== START GENERAL MODE RESET ====================================
:stopModules
	openMenu TWX_STOPALLFAST FALSE
	stop $BOT~LAST_LOADED_MODULE
	echo ANSI_14 "*<<" ANSI_15 "General Mode Reset" ANSI_14 ">>*" ANSI_7
	setVar $BOT~mode "General"
	savevar $bot~mode
	setVar $BOT~LAST_LOADED_MODULE ""
	gosub :msgs_on
	goto :BOT~wait_for_command
# ================================= END GENERAL MODE RESET ==========================================
:help
	setVar $BOT~user_command_line "help "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine

:callin
	setVar $new_bot_team_name $BOT~parm1
	stripText $new_bot_team_name "^"
	stripText $new_bot_team_name " "
	lowerCase $new_bot_team_name
	if ($new_bot_team_name = "")
		setVar $SWITCHBOARD~message "Invalid team name entered, cannot join that one.*"
		gosub :SWITCHBOARD~switchboard
		goto :BOT~wait_for_command		
	else
		if (($new_bot_team_name ="all") OR ($new_bot_team_name = "0"))
			setVar $SWITCHBOARD~message "Invalid team name*"
			gosub :SWITCHBOARD~switchboard
			goto :BOT~wait_for_command
		else
			setVar $BOT~bot_team_name $new_bot_team_name
			saveVar $BOT~bot_team_name
			setVar $SWITCHBOARD~message "I am now part of team: " & $BOT~bot_team_name & "*"
			gosub :SWITCHBOARD~switchboard
		end
	end
goto :BOT~wait_for_command

# ============================== START TWARP HOTKEY ===============================
:twarpswitch
	getInput $BOT~parm1 "Twarp To:"
	getWord $BOT~parm1 $BOT~parm1 1
	stripText $BOT~parm1 " "
	if ($BOT~parm1 = "")
		goto :BOT~wait_for_command
	end
	setVar $BOT~user_command_line "twarp "&$BOT~parm1&" "
	goto :USER_INTERFACE~runUserCommandLine
#================================  END TWARP HOTKEY =================================

# ============================== START MOW HOTKEY ===============================
:mowswitch
	getInput $BOT~parm1 "Mow To:"
	getWord $BOT~parm1 $BOT~parm1 1
	stripText $BOT~parm1 " "
	if ($BOT~parm1 = "")
		goto :BOT~wait_for_command
	end
	setVar $BOT~user_command_line "mow "&$BOT~parm1&" 1"
	goto :USER_INTERFACE~runUserCommandLine
#================================  END MOW HOTKEY =================================
#============================= START PHOTON HOTKEY ================================
:fotonswitch
	if ($BOT~mode = "Foton")
		setVar $BOT~user_command_line "foton off"
		goto :USER_INTERFACE~runUserCommandLine
	else
		setVar $BOT~user_command_line "foton on p"
		goto :USER_INTERFACE~runUserCommandLine
	end
goto :BOT~wait_for_command
#=========================== END PHOTON HOTKEY =======================================

:clear
   setVar $BOT~user_command_line "clear"
	goto :USER_INTERFACE~runUserCommandLine

:kit
   setVar $BOT~user_command_line "macro_kit"
	goto :USER_INTERFACE~runUserCommandLine

:dock_shopper
	setVar $BOT~user_command_line "dock_shopper"
	goto :USER_INTERFACE~runUserCommandLine


:x
:xport
	setVar $BOT~user_command_line "xport "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine
	
:mow
:m
	setVar $BOT~user_command_line "mow "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine

:land
:l
	setVar $BOT~user_command_line "land "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4
	goto :USER_INTERFACE~runUserCommandLine

:sector
:secto
:sect
:sec
	setVar $BOT~user_command_line "sector "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4
	goto :USER_INTERFACE~runUserCommandLine
:qss
:status
	setVar $BOT~user_command_line "status "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4
	goto :USER_INTERFACE~runUserCommandLine

:parm
:parms
:params
	setVar $BOT~user_command_line "param "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4
	goto :USER_INTERFACE~runUserCommandLine

:t
:twarp
	setVar $BOT~user_command_line "twarp "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8	
	goto :USER_INTERFACE~runUserCommandLine

:b
:bwarp
	setVar $BOT~user_command_line "bwarp "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8	
	goto :USER_INTERFACE~runUserCommandLine

:p
:pwarp
	setVar $BOT~user_command_line "pwarp "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine

:d
:dep
	setVar $BOT~user_command_line "dep "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4
	goto :USER_INTERFACE~runUserCommandLine

:w
:with
	setVar $BOT~user_command_line "with "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4
	goto :USER_INTERFACE~runUserCommandLine

:holotorp
:htorp
	setVar $BOT~user_command_line "htorp "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4
	goto :USER_INTERFACE~runUserCommandLine


#==================================== LOG OFF SUB ===========================================
:logoff
:logout
	killalltriggers
	gosub :PLAYER~quikstats
	setVar $startingLocation $PLAYER~CURRENT_PROMPT
	setVar $quittingWithNoTimer FALSE
	isNumber $test $BOT~parm1

	if ($startingLocation = "Citadel")
		send "q "
		gosub :PLANET~getPlanetInfo
		send "c "
	end
	if ($test = FALSE)
		setVar $quittingWithNoTimer TRUE
	elseif (($BOT~parm1 <= 0) OR ($BOT~parm1 = "cloak"))
		setVar $quittingWithNoTimer TRUE
	else
		setVar $timeToLogBackIn ($BOT~parm1*60)
		gosub :calcTime
	end
	setVar $cloakingOut FALSE
	getWordPos " "&$BOT~user_command_line&" " $pos " cloak "
	if ($pos > 0)
		setVar $cloakingOut TRUE
	end
	if (($cloakingOut = TRUE) AND ($PLAYER~CLOAKS > 0))
		if ($quittingWithNoTimer)
			send "'{" $SWITCHBOARD~bot_name "} - Logging and cloaking out until I am at keys to login again.*"
		else
			send "'{" $SWITCHBOARD~bot_name "} - Logging and cloaking out for "&$hours&" hours, "&$minutes&" minutes, and "&$seconds&" seconds.*"
		end
		send "q q q q  * * * * q q q q y y x *"
		waitOn "==-- Trade Wars 2002 --=="
	else
		if ($quittingWithNoTimer)
			send "'{" $SWITCHBOARD~bot_name "} - Logging out until I am at keys to login again.*"
		else
			send "'{" $SWITCHBOARD~bot_name "} - Logging out for "&$hours&" hours, "&$minutes&" minutes, and "&$seconds&" seconds.*"
		end
		if ($startingLocation = "Citadel")
			send "ryy* x *##"
			waitOn "Game Server"
		else
			send "q q q q  * * * * q q q q y*"
			waitOn "==-- Trade Wars 2002 --=="
		end
	end
	disconnect
	setVar $timer 0
	if ($quittingWithNoTimer)
		setvar $bot~do_not_resuscitate true
		savevar $bot~do_not_resuscitate
		halt
	end
	setTextOutTrigger logearly :endLogoffGame #32
	while ($timeToLogBackIn > 0)
		gosub :calcTime
		echo ANSI_10 #27 & "[1A" & #27 & "[K" & $hours ":" $minutes ":" $seconds " left before entering game " GAME " (" GAMENAME ") "&ANSI_15&" ["&ANSI_14&"Spacebar to relog"&ANSI_15&"]*"
		setDelayTrigger timeBeforeRelog :relogTimer 1000
		pause
		:relogTimer
			setVar $timeToLogBackIn $timeToLogBackIn-1
	end
	:endLogoffGame
	killtrigger logearly
	killtrigger timeBeforeRelog
	goto :relog_attempt


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
#==================================== END LOG OFF SUB ========================================

#===================================== SURROUND SUB =============================================================
:surround
	setVar $BOT~user_command_line "surround "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine

#========================== END SURROUND SUB ==============================================


:emx
:reset
	disconnect
	goto :BOT~wait_for_command
:emq
	send " q q q * p d 0* 0* 0* * *** * c q q q q q z 2 2 c q * z * *** * * "
	goto :BOT~wait_for_command
:lift
	send "0* 0* 0* q q q q q z a 999* * * * "
	goto :BOT~wait_for_command
# ============================== START LOGIN (login) Sub ==============================
:login
	gosub :BOT~killthetriggers
	gosub  :player~currentPrompt
	setVar $PLAYER~startingLocation $PLAYER~CURRENT_PROMPT
	setVar $BOT~validPrompts "Citadel Command"
	gosub :BOT~checkStartingPrompt
	if ($PLAYER~startingLocation = "Command")
		send "t tLogin** q "
	elseif ($PLAYER~startingLocation = "Citadel")
		send "x tLogin** q "
	end
goto :BOT~wait_for_command
# ============================== END LOGIN (login) Sub ==============================




# ============================== START STORE SHIP ====================================
:storeship
:shipstore
		gosub  :player~currentPrompt
		setVar $PLAYER~startingLocation $PLAYER~CURRENT_PROMPT
		setVar $BOT~validPrompts "Command Citadel"
		gosub :BOT~checkStartingPrompt
		gosub :ship~savetheship
		goto :BOT~wait_for_command
# ================================== END STORE SHIP ==============================================




:exit
:xenter
	setVar $BOT~user_command_line "xenter "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine


:pscan
:pinfo
	setVar $BOT~user_command_line "pscan "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine

#====================================SHUTDOWN MODULE SUB =====================================
:shutdown
	setVar $BOT~mode "General"
	savevar $bot~mode
	goto :BOT~wait_for_command
#===================================END SHUTDOWN MODULE SUB ==================================


# ----- CN settings -----
:cn
:cn9
	setVar $BOT~user_command_line "cn9 "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine


#============================== BOT PROMPT COMMUNICATION =================================
:ss
	cutText $BOT~user_command_line $BOT~user_command_line 2 9999
	send "'"&$BOT~user_command_line&"*"
	goto :BOT~wait_for_command
:fed
	cutText $BOT~user_command_line $BOT~user_command_line 2 9999
	send "`"&$BOT~user_command_line&"*"
	goto :BOT~wait_for_command
#============================ END BOT PROMPT COMMUNICATION ================================
:about
	gosub :menus~doSplashScreen
	echo "*" CURRENTANSILINE
	goto :BOT~wait_for_command
# ======================== START TURN BOT ON/OFF (BOT) SUBROUTINE =========================
:bot
	setVar $SWITCHBOARD~message ""
	if ($BOT~parm1 = "on")
		setVar $BOT~botIsOff FALSE
		saveVar $BOT~botIsOff 
		setVar $SWITCHBOARD~message "Bot Active*"
	end
	if ($BOT~parm1 = "off")
		setVar $BOT~botIsOff TRUE
		saveVar $BOT~botIsOff 
		setVar $SWITCHBOARD~message "Bot Deactivated*"
	end
	if (($BOT~parm1 <> "off") AND ($BOT~parm1 <> "on"))
		setVar $SWITCHBOARD~message "That status option is unknown..*"
	end
	gosub :SWITCHBOARD~switchboard
goto :BOT~wait_for_command
:relog
	setVar $SWITCHBOARD~message ""
	if ($BOT~parm1 = "on")
		setVar $SWITCHBOARD~message "Relog Active*"
		setVar $BOT~doRelog TRUE
		savevar $bot~dorelog
	end
	if ($BOT~parm1 = "off")
		setVar $SWITCHBOARD~message "Relog Deactivated*"
		setVar $BOT~doRelog FALSE
		savevar $bot~dorelog
	end
	if (($BOT~parm1 <> "off") AND ($BOT~parm1 <> "on"))
		setVar $SWITCHBOARD~message "Please use relog [on/off] format.*"
		goto :BOT~wait_for_command
	end
	gosub :SWITCHBOARD~switchboard
goto :BOT~wait_for_command
# ====================== END TURN BOT ON/OFF (BOT) SUBROUTINE ==========================
#============================= REFRESH BOT SUB ===============================================
:refresh
	gosub :BOT~killthetriggers
	gosub :PLAYER~quikstats
	setVar $BOT~validPrompts "Citadel Command"
	gosub :BOT~checkStartingPrompt
	if ($PLAYER~CURRENT_PROMPT = "Citadel")
		send "q"
		gosub :PLANET~getPlanetInfo
		send "q"
	end
	gosub :PLAYER~getInfo
	gosub :GAME~gamestats
	
	gosub :SHIP~getShipStats
	
	gosub :PLAYER~quikstats
	gosub :SHIP~getShipCapStats
	gosub :SHIP~loadShipInfo

	gosub :PLANET~getPlanetStats
	gosub :PLANET~loadPlanetInfo

	if ($PLAYER~CURRENT_PROMPT = "Citadel")
		gosub :PLANET~landingSub
	end
	send "'{" & $SWITCHBOARD~bot_name & "} - Bot data refresh completed.*"
goto :BOT~wait_for_command
#========================== END REFRESH BOT SUB =================================================

#####===============================================  BOT HELP SECTION ================================================#####
:holo_kill
:hkill
	setVar $BOT~user_command_line "hkill "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine

#####==========================================  BOT INTERNAL MENUS SECTION ===========================================#####

# ========================================= SETVAR ======================================================
:getvar
	setVar $BOT~user_command_line "getvar "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine

:setvar
	setVar $BOT~user_command_line "setvar "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine

# ======================================== END SETVAR ===================================================

#=============================== AUTO KILL ==========================================
:autoKill
	setvar $bot~parm1 "furb"
	setvar $bot~parm2 "silent"
:kill
	setVar $BOT~user_command_line "kill "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine

#============================ END AUTO KILL ============================================
:autoCapture
:autoCap
:cap
	setVar $BOT~user_command_line "cap "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine

:do_relog
	setvar $bot~parm1 "do_relog"
:relog_attempt
	setVar $BOT~user_command_line "relog "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine

#========================= AUTO REFURB SUB ===============================================
:scrub
	setVar $BOT~user_command_line "scrub "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine

:autorefurb
:refurb
	setVar $BOT~user_command_line "refurb "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine

:switchbot
	SwitchBot $bot~parm1
	halt

