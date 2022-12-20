# ============================== END MAIN BODY WAIT FOR COMMANDS SUB ==============================
:loginmemo
	getword currentline $word 1
	if ($word <> "You")
		killtrigger loginmemo
		setTextLineTrigger	  loginmemo			   :loginmemo			"You have a corporate memo from "
		pause
	end
	gettext currentline $user_name "You have a corporate memo from " "."

	setVar $i 1
	setVar $tempUsername $user_name
	lowercase $tempUsername
	lowerCase $user_name
	while ($i <= $BOT~corpycount)
		setVar $tempCorpy $BOT~corpy[$i]
		lowerCase $tempCorpy
		if ($tempCorpy = $tempUsername)
			goto :bot~wait_for_command
		end
		add $i 1
	end
	add $BOT~corpycount 1
	setVar $BOT~corpy[$BOT~corpycount] $user_name
	cutText $user_name $cut_user_name 1 6
	stripText $cut_user_name " "
	setVar $loggedin[$cut_user_name] 1
	send "'["&$BOT~mode&"]{"&$SWITCHBOARD~bot_name&"} - User Verified - "&$user_name&"*"
goto :bot~wait_for_command
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
	savevar $bot~LAST_LOADED_MODULE
	gosub :msgs_on
	goto :BOT~wait_for_command
# ================================= END GENERAL MODE RESET ==========================================

:callin
	setVar $new_bot_team_name $BOT~parm1
	stripText $new_bot_team_name "^"
	stripText $new_bot_team_name " "
	lowerCase $new_bot_team_name
	getLength $new_bot_team_name $targetLength 
	if (($new_bot_team_name = "") or ($targetLength < 3))
		setVar $SWITCHBOARD~message "Invalid team name entered, cannot join that one.  Must be more than 2 letters long.*"
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
	if ($bot~parm1 = "")
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
	if ($bot~parm1 = "")
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

:kit
	setVar $BOT~user_command_line "macro_kit"
	goto :USER_INTERFACE~runUserCommandLine

:dock_shopper
	setVar $BOT~user_command_line "dock_shopper"
	goto :USER_INTERFACE~runUserCommandLine

:help
	setVar $BOT~user_command_line "help "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine

	
:sector
:secto
:sect
:sec
	setVar $BOT~user_command_line "sector "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4
	goto :USER_INTERFACE~runUserCommandLine

:parm
:parms
:params
	setVar $BOT~user_command_line "param "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4
	goto :USER_INTERFACE~runUserCommandLine

:holotorp
:htorp
	setVar $BOT~user_command_line "htorp "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4

	gosub :BOT~killthetriggers

	gosub :PLAYER~quikstats
	if ($PLAYER~SCAN_TYPE <> "Holo")
		setvar $switchboard~message "You can not run htorp without a holographic scanner.*"
		gosub :switchboard~switchboard
		goto :BOT~wait_for_command
	end
	setVar $PLAYER~startingLocation $PLAYER~CURRENT_PROMPT
	if ($PLAYER~startingLocation = "Command")
	
	elseif ($PLAYER~startingLocation = "Citadel")
		send "q "
		gosub :PLANET~getPlanetInfo
	else
		echo "*Wrong prompt for htorp.*"
		goto :BOT~wait_for_command
	end
	if ($PLAYER~startingLocation = "Citadel")
		send "q szh* l " & $planet~planet & "* c "
	else
		send "szh* "
	end
	setTextLineTrigger checkForHolo :continueCheckHolo "Select (H)olo Scan or (D)ensity Scan or (Q)uit?"
	setTextLineTrigger checkForDens :photonedhtorp "Relative Density Scan"  
	pause
	:continueCheckHolo
		setTextTrigger htorpsector :continuehtorpsector "[" & $PLAYER~CURRENT_SECTOR & "]"
		pause
	:continuehtorpsector
	if ($PLAYER~PHOTONS <= 0)
		echo ANSI_14 & "*No Photons on hand.**" & ANSI_7
		goto :BOT~wait_for_command
	end
	setVar $i 1
	while (SECTOR.WARPS[$PLAYER~CURRENT_SECTOR][$i] > 0)
		setVar $adj_sec SECTOR.WARPS[$PLAYER~CURRENT_SECTOR][$i]
		if (SECTOR.TRADERCOUNT[$ADJ_SEC] > 0)
			setVar $targetInSector FALSE
			setVar $corpMemberInSector FALSE
			setVar $j 1
			while (SECTOR.TRADERS[$ADJ_SEC][$j] <> 0)
				setVar $tempTarget SECTOR.TRADERS[$ADJ_SEC][$j]
				getLength $tempTarget $targetLength
				if ($targetLength >= 4)
					cutText $tempTarget $targetCorp ($targetLength-4) 999
					getText $targetCorp $targetCorp "[" "]"
					if ($targetCorp <> $PLAYER~CORP)
						setVar $targetInSector TRUE
					end
					if ($targetCorp = $PLAYER~CORP)
						setVar $corpMemberInSector TRUE
					end
				end
				add $j 1
			end
			if (($targetInSector = TRUE) AND ($corpMemberInSector = FALSE))
				send "c p y " $ADJ_SEC "* *q"
				setvar $switchboard~message "Photon fired into sector " & $ADJ_SEC & "!*"
				gosub :switchboard~switchboard
				goto :BOT~wait_for_command
			end
		end
		add $i 1
	end
	if ($PLAYER~startingLocation = "Citadel")
		setTextTrigger waitforcit :continuewaitforcit "Citadel command (?=help)"
		pause
		:continuewaitforcit
	end
	echo ANSI_14 & "*No valid targets**" & ANSI_7
	goto :BOT~wait_for_command
:photonedHtorp
	setvar $switchboard~message "You have no holographic scanner, perhaps you were photoned?*"
	gosub :switchboard~switchboard
	goto :BOT~wait_for_command

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



:clear
	setVar $BOT~user_command_line "clear "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine

:exit
:xenter
	setVar $BOT~user_command_line "xenter "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8
	goto :USER_INTERFACE~runUserCommandLine

#====================================SHUTDOWN MODULE SUB =====================================
:shutdown
	setVar $BOT~mode "General"
	savevar $bot~mode
	goto :BOT~wait_for_command
#===================================END SHUTDOWN MODULE SUB ==================================


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
	setvar $switchboard~message "Bot data refresh completed.*"
	gosub :switchboard~switchboard
goto :BOT~wait_for_command
#========================== END REFRESH BOT SUB =================================================

#####===============================================  BOT HELP SECTION ================================================#####
:holo_kill
:hkill
	setVar $BOT~user_command_line "hkill "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8

	gosub :BOT~killthetriggers

	loadvar $player~surround_before_hkill
	getWordPos $bot~user_command_line $pos "surround"
	if ($pos > 0)
		setVar $player~surround_before_hkill TRUE
	else
		if ($player~surround_before_hkill <> true)
			setVar $player~surround_before_hkill FALSE
		end
	end

	setVar $player~CIT FALSE
	gosub :PLAYER~quikstats
	setVar $startingLocation $PLAYER~current_prompt
	setVar $BOT~validPrompts "Citadel Command"
	gosub :BOT~checkStartingPrompt
	gosub :combat~holokill
	if ($SWITCHBOARD~message <> "")
		gosub :SWITCHBOARD~switchboard
	end
	
	goto :BOT~wait_for_command

#####==========================================  BOT INTERNAL MENUS SECTION ===========================================#####

#=============================== AUTO KILL ==========================================
:autoKill
	setvar $bot~parm1 "furb"
	setvar $bot~parm2 "silent"
:kill
	gosub :BOT~killthetriggers
	if ($bot~parm1 = "furb")
		setvar $furb true
	end

	gosub  :player~currentPrompt
	setVar $PLAYER~startingLocation $PLAYER~CURRENT_PROMPT

	if ($PLAYER~startingLocation <> "Command")
		if ($PLAYER~startingLocation = "Citadel")
			loadvar $bot~mode
			if ($bot~mode <> "Citkill")
				setVar $bot~user_command_line "citkill on override"
				setvar $bot~autoattack false
				savevar $bot~autoattack
				goto :USER_INTERFACE~runUserCommandLine
			else
				setVar $bot~user_command_line "citkill off"
				goto :USER_INTERFACE~runUserCommandLine
			end
		end
		setVar $SWITCHBOARD~message "Wrong prompt for auto kill.*" 
		gosub :SWITCHBOARD~switchboard
		if ($bot~autoattack)
			setvar $bot~autoattack false
			savevar $bot~autoattack
			setVar $SWITCHBOARD~message "Since in wrong prompt, shutting down autokill option in bot.  Restart in options.*" 
			gosub :SWITCHBOARD~switchboard
		end
		goto :BOT~wait_for_command
	end
	loadVar $SHIP~SHIP_MAX_ATTACK
	loadVar $SHIP~SHIP_FIGHTERS_MAX
	loadVar $SHIP~SHIP_OFFENSIVE_ODDS
	if ($SHIP~SHIP_MAX_ATTACK <= 0)
		gosub :SHIP~getShipStats
	end
	setvar $player~isFound false
	goSub :SECTOR~getSectorData
	goSub :combat~fastAttack
	if ((($player~current_sector = 1) or ($player~current_sector = $map~stardock)) and ($furb = true))
		if ($player~isFound)
			load "scripts\"&$bot~mombot_directory&"\commands\general\refurb.cts"
			setEventTrigger		1		:refurbended	"SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\general\refurb.cts"
			pause
			:refurbended
			goSub :SECTOR~getSectorData
			goSub :combat~fastAttack
		end
	end
	goto :BOT~wait_for_command
#============================ END AUTO KILL ============================================
:autoCapture
:autoCap
:cap

	setVar $BOT~user_command_line "cap "&$BOT~parm1&" "&$BOT~parm2&" "&$BOT~parm3&" "&$BOT~parm4&" "&$BOT~parm5&" "&$BOT~parm6&" "&$BOT~parm7&" "&$BOT~parm8

	gosub :BOT~killthetriggers
	gosub :PLAYER~quikstats
	setVar $PLAYER~startingLocation $PLAYER~CURRENT_PROMPT
	if ($PLAYER~startingLocation <> "Command")
		if ($PLAYER~startingLocation = "Citadel")
			loadvar $bot~mode
			if ($bot~mode <> "Citcap")
				setVar $BOT~command "citcap"
				setVar $BOT~user_command_line " citcap on "
				setVar $BOT~parm1 "on"			
				goto :USER_INTERFACE~runUserCommandLine
			else
				setVar $BOT~command "citcap"
				setVar $BOT~user_command_line " citcap off "
				setVar $BOT~parm1 "off"			
				goto :USER_INTERFACE~runUserCommandLine
			end
			goto :BOT~wait_for_command
		end
		setVar $SWITCHBOARD~message "Wrong prompt for auto capture.*"
		gosub :SWITCHBOARD~switchboard
		goto :BOT~wait_for_command
	end
	getWordPos $BOT~user_command_line $pos "alien"
	if ($pos > 0)
		setVar $PLAYER~onlyAliens TRUE
	else
		setVar $PLAYER~onlyAliens FALSE
	end
	fileExists $SHIP~cap_file_chk $SHIP~cap_file
	if ($SHIP~cap_file_chk <> TRUE)
		gosub :SHIP~getShipCapStats
	end
	loadVar $SHIP~SHIP_MAX_ATTACK
	loadVar $SHIP~SHIP_FIGHTERS_MAX
	loadVar $SHIP~SHIP_OFFENSIVE_ODDS
	if ($SHIP~SHIP_OFFENSIVE_ODDS <= 0)
		gosub :SHIP~getShipStats
	end
	setVar $lastTarget ""
	setVar $thisTarget ""
	goSub :SECTOR~getSectorData
	goSub :combat~fastCapture
	
	goto :BOT~wait_for_command


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
