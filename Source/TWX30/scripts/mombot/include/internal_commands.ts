:internal_commands~loginmemo
getword currentline $internal_commands~word 1
if ($internal_commands~word <> "You")
	killtrigger loginmemo
	settextlinetrigger loginmemo :loginmemo "You have a corporate memo from "
	pause
end
gettext currentline $internal_commands~user_name "You have a corporate memo from " "."

setvar $internal_commands~i 1
setvar $internal_commands~tempusername $internal_commands~user_name
lowercase $internal_commands~tempusername
lowercase $internal_commands~user_name
while ($internal_commands~i <= $bot~corpycount)
	setvar $internal_commands~tempcorpy $bot~corpy[$internal_commands~i]
	lowercase $internal_commands~tempcorpy
	if ($internal_commands~tempcorpy = $internal_commands~tempusername)
		goto :bot~wait_for_command
	end
	add $internal_commands~i 1
end
add $bot~corpycount 1
setvar $bot~corpy[$bot~corpycount] $internal_commands~user_name
cuttext $internal_commands~user_name $internal_commands~cut_user_name 1 6
striptext $internal_commands~cut_user_name " "
setvar $internal_commands~loggedin[$internal_commands~cut_user_name] 1
send "'["&$bot~mode&"]{"&$switchboard~bot_name&"} - User Verified - "&$internal_commands~user_name&"*"
goto :bot~wait_for_command

:internal_commands~stop
gosub :bot~killthetriggers
listactivescripts $internal_commands~scripts
setvar $internal_commands~i 1
setvar $internal_commands~found false
while ($internal_commands~i <= $internal_commands~scripts)
	lowercase $internal_commands~scripts[$internal_commands~i]
	getwordpos "<><><>"&$internal_commands~scripts[$internal_commands~i] $internal_commands~pos "<><><>"&$bot~parm1
	getwordpos "<><><>"&$internal_commands~scripts[$internal_commands~i] $internal_commands~pos2 "<><><>mombot"
	if (($internal_commands~pos > 0) and ($internal_commands~pos2 <= 0))
		stop $internal_commands~scripts[$internal_commands~i]
		setvar $internal_commands~found true
		setvar $switchboard~message "Script ["&$internal_commands~scripts[$internal_commands~i]&"] killed.*"
		gosub :switchboard~switchboard
	end
	add $internal_commands~i 1
end
if ($internal_commands~found = false)
	setvar $switchboard~message "No script starting with "&$bot~parm1&" was found to kill.*"
	gosub :switchboard~switchboard
end
goto :bot~wait_for_command

:internal_commands~stopall
gosub :bot~killthetriggers
gosub :bot~enter_menu_deaf
openmenu twx_stopallfast false
gosub :bot~exit_menu_deaf
setvar $bot~mode "General"
savevar $bot~mode
gosub :msgs_on

if ($internal_commands~was_silent)
	setvar $switchboard~message "All non-system scripts and modules killed, and modes reset. Also, turned messages back on.*"
else
	setvar $switchboard~message "All non-system scripts and modules killed, and modes reset.*"
end
gosub :switchboard~switchboard
goto :bot~wait_for_command

:internal_commands~msgs_on
setvar $internal_commands~was_silent true

:internal_commands~msgs_on_again
settexttrigger onmsgs_on :onmsgs_on "Displaying all messages."
settexttrigger onmsgs_off :onmsgs_off "Silencing all messages."
send "|"
pause

:internal_commands~onmsgs_off
killtrigger onmsgs_on
setvar $internal_commands~was_silent false
goto :msgs_on_again

:internal_commands~onmsgs_on
killtrigger onmsgs_off
loadvar $bot~botisdeaf
if ($bot~botisdeaf = true)
	gosub :menus~doneprefer
end
return

:internal_commands~listall
listactivescripts $internal_commands~scripts
setvar $internal_commands~a 1
setvar $switchboard~message " Current script(s) loaded*"
setvar $switchboard~message $switchboard~message&"--------------------------*"
while ($internal_commands~a <= $internal_commands~scripts)
	setvar $switchboard~message $switchboard~message&"   "&$internal_commands~scripts[$internal_commands~a]&"*"
	add $internal_commands~a 1
end
if (($switchboard~self_command <> true) or ($bot~silent_running <> true))
	setvar $switchboard~self_command 2
end
gosub :switchboard~switchboard
goto :bot~wait_for_command

:internal_commands~stopmodules
gosub :bot~enter_menu_deaf
openmenu twx_stopallfast false
gosub :bot~exit_menu_deaf
stop $bot~last_loaded_module
echo ansi_14 "*<<" ansi_15 "General Mode Reset" ansi_14 ">>*" ansi_7
setvar $bot~mode "General"
savevar $bot~mode
setvar $bot~last_loaded_module ""
savevar $bot~last_loaded_module
gosub :msgs_on
goto :bot~wait_for_command

:internal_commands~callin
setvar $internal_commands~new_bot_team_name $bot~parm1
striptext $internal_commands~new_bot_team_name "^"
striptext $internal_commands~new_bot_team_name " "
lowercase $internal_commands~new_bot_team_name
getlength $internal_commands~new_bot_team_name $internal_commands~targetlength
if (($internal_commands~new_bot_team_name = "") or ($internal_commands~targetlength < 3))
	setvar $switchboard~message "Invalid team name entered, cannot join that one.  Must be more than 2 letters long.*"
	gosub :switchboard~switchboard
	goto :bot~wait_for_command
else
	if (($internal_commands~new_bot_team_name = "all") or ($internal_commands~new_bot_team_name = 0))
		setvar $switchboard~message "Invalid team name*"
		gosub :switchboard~switchboard
		goto :bot~wait_for_command
	else
		setvar $bot~bot_team_name $internal_commands~new_bot_team_name
		savevar $bot~bot_team_name
		setvar $switchboard~message "I am now part of team: "&$bot~bot_team_name&"*"
		gosub :switchboard~switchboard
	end
end
goto :bot~wait_for_command

:internal_commands~twarpswitch
getinput $bot~parm1 "Twarp To:"
getword $bot~parm1 $bot~parm1 1
striptext $bot~parm1 " "
if ($bot~parm1 = "")
	goto :bot~wait_for_command
end
setvar $bot~user_command_line "twarp "&$bot~parm1&" "
goto :user_interface~runusercommandline

:internal_commands~mowswitch
getinput $bot~parm1 "Mow To:"
getword $bot~parm1 $bot~parm1 1
striptext $bot~parm1 " "
if ($bot~parm1 = "")
	goto :bot~wait_for_command
end
setvar $bot~user_command_line "mow "&$bot~parm1&" 1"
goto :user_interface~runusercommandline

:internal_commands~fotonswitch
if ($bot~mode = "Foton")
	setvar $bot~user_command_line "foton off"
	goto :user_interface~runusercommandline
else
	setvar $bot~user_command_line "foton on p"
	goto :user_interface~runusercommandline
end
goto :bot~wait_for_command

:internal_commands~kit
setvar $bot~user_command_line "macro_kit"
goto :user_interface~runusercommandline

:internal_commands~dock_shopper
setvar $bot~user_command_line "dock_shopper"
goto :user_interface~runusercommandline

:internal_commands~help
setvar $bot~user_command_line "help "&$bot~parm1&" "&$bot~parm2&" "&$bot~parm3&" "&$bot~parm4&" "&$bot~parm5&" "&$bot~parm6&" "&$bot~parm7&" "&$bot~parm8
goto :user_interface~runusercommandline

:internal_commands~sector
:internal_commands~secto
:internal_commands~sect
:internal_commands~sec
setvar $bot~user_command_line "sector "&$bot~parm1&" "&$bot~parm2&" "&$bot~parm3&" "&$bot~parm4
goto :user_interface~runusercommandline

:internal_commands~parm
:internal_commands~parms
:internal_commands~params
setvar $bot~user_command_line "param "&$bot~parm1&" "&$bot~parm2&" "&$bot~parm3&" "&$bot~parm4
goto :user_interface~runusercommandline

:internal_commands~holotorp
:internal_commands~htorp
setvar $bot~user_command_line "htorp "&$bot~parm1&" "&$bot~parm2&" "&$bot~parm3&" "&$bot~parm4

gosub :bot~killthetriggers

gosub :player~quikstats
if ($player~scan_type <> "Holo")
	setvar $switchboard~message "You can not run htorp without a holographic scanner.*"
	gosub :switchboard~switchboard
	goto :bot~wait_for_command
end
setvar $player~startinglocation $player~current_prompt
if ($player~startinglocation = "Command")

elseif ($player~startinglocation = "Citadel")
	send "q "
	gosub :planet~getplanetinfo
else
	echo "*Wrong prompt for htorp.*"
	goto :bot~wait_for_command
end
if ($player~startinglocation = "Citadel")
	send "q szh* l "&$planet~planet&"* c "
else
	send "szh* "
end
settextlinetrigger checkforholo :continuecheckholo "Select (H)olo Scan or (D)ensity Scan or (Q)uit?"
settextlinetrigger checkfordens :photonedhtorp "Relative Density Scan"
pause

:internal_commands~continuecheckholo
settexttrigger htorpsector :continuehtorpsector "["&$player~current_sector&"]"
pause

:internal_commands~continuehtorpsector
if ($player~photons <= 0)
	echo ansi_14&"*No Photons on hand.**"&ansi_7
	goto :bot~wait_for_command
end
setvar $internal_commands~i 1
while (sector.warps[$player~current_sector][$internal_commands~i] > 0)
	setvar $internal_commands~adj_sec sector.warps[$player~current_sector][$internal_commands~i]
	if (sector.tradercount[$internal_commands~adj_sec] > 0)
		setvar $internal_commands~targetinsector false
		setvar $internal_commands~corpmemberinsector false
		setvar $internal_commands~j 1
		while (sector.traders[$internal_commands~adj_sec][$internal_commands~j] <> 0)
			setvar $internal_commands~temptarget sector.traders[$internal_commands~adj_sec][$internal_commands~j]
			getlength $internal_commands~temptarget $internal_commands~targetlength
			if ($internal_commands~targetlength >= 4)
				cuttext $internal_commands~temptarget $internal_commands~targetcorp ($internal_commands~targetlength - 4) 999
				gettext $internal_commands~targetcorp $internal_commands~targetcorp "[" "]"
				if ($internal_commands~targetcorp <> $player~corp)
					setvar $internal_commands~targetinsector true
				end
				if ($internal_commands~targetcorp = $player~corp)
					setvar $internal_commands~corpmemberinsector true
				end
			end
			add $internal_commands~j 1
		end
		if (($internal_commands~targetinsector = true) and ($internal_commands~corpmemberinsector = false))
			send "c p y " $internal_commands~adj_sec "* *q"
			setvar $switchboard~message "Photon fired into sector "&$internal_commands~adj_sec&"!*"
			gosub :switchboard~switchboard
			goto :bot~wait_for_command
		end
	end
	add $internal_commands~i 1
end
if ($player~startinglocation = "Citadel")
	settexttrigger waitforcit :continuewaitforcit "Citadel command (?=help)"
	pause

	:internal_commands~continuewaitforcit
end
echo ansi_14&"*No valid targets**"&ansi_7
goto :bot~wait_for_command

:internal_commands~photonedhtorp
setvar $switchboard~message "You have no holographic scanner, perhaps you were photoned?*"
gosub :switchboard~switchboard
goto :bot~wait_for_command

:internal_commands~logoff
:internal_commands~logout
killalltriggers
gosub :player~quikstats
setvar $internal_commands~startinglocation $player~current_prompt
setvar $internal_commands~quittingwithnotimer false
isnumber $internal_commands~test $bot~parm1

if ($internal_commands~startinglocation = "Citadel")
	send "q "
	gosub :planet~getplanetinfo
	send "c "
end
if ($internal_commands~test = false)
	setvar $internal_commands~quittingwithnotimer true
elseif (($bot~parm1 <= 0) or ($bot~parm1 = "cloak"))
	setvar $internal_commands~quittingwithnotimer true
else
	setvar $internal_commands~timetologbackin ($bot~parm1 * 60)
	gosub :calctime
end
setvar $internal_commands~cloakingout false
getwordpos " "&$bot~user_command_line&" " $internal_commands~pos " cloak "
if ($internal_commands~pos > 0)
	setvar $internal_commands~cloakingout true
end
if ($internal_commands~quittingwithnotimer)
	setvar $bot~do_not_resuscitate true
	savevar $bot~do_not_resuscitate
	setvar $bot~dorelog false
	savevar $bot~dorelog
end
if (($internal_commands~cloakingout = true) and ($player~cloaks > 0))
	if ($internal_commands~quittingwithnotimer)
		setvar $switchboard~message "Logging and cloaking out until I am at keys to login again.*"
		gosub :switchboard~switchboard
	else
		setvar $switchboard~message "Logging and cloaking out for "&$internal_commands~hours&" hours, "&$internal_commands~minutes&" minutes, and "&$internal_commands~seconds&" seconds.*"
		gosub :switchboard~switchboard
	end
	send "q q q q  * * * * q q q q y y x *"
	waiton "==-- Trade Wars 2002 --=="
else
	if ($internal_commands~quittingwithnotimer)
		setvar $switchboard~message "Logging out until I am at keys to login again.*"
		gosub :switchboard~switchboard
	else
		setvar $switchboard~message "Logging out for "&$internal_commands~hours&" hours, "&$internal_commands~minutes&" minutes, and "&$internal_commands~seconds&" seconds.*"
		gosub :switchboard~switchboard
	end
	if ($internal_commands~startinglocation = "Citadel")
		send "ryy* x *##"
		waiton "Game Server"
	else
		send "q q q q  * * * * q q q q y*"
		waiton "==-- Trade Wars 2002 --=="
	end
end
disconnect
setvar $internal_commands~timer 0
if ($internal_commands~quittingwithnotimer)
	halt
end
settextouttrigger logearly :endlogoffgame #32
while ($internal_commands~timetologbackin > 0)
	gosub :calctime
	echo ansi_10 #27&"[1A"&#27&"[K"&$internal_commands~hours ":" $internal_commands~minutes ":" $internal_commands~seconds " left before entering game " game " (" gamename ") "&ansi_15&" ["&ansi_14&"Spacebar to relog"&ansi_15&"]*"
	setdelaytrigger timebeforerelog :relogtimer 1000
	pause

	:internal_commands~relogtimer
	setvar $internal_commands~timetologbackin ($internal_commands~timetologbackin - 1)
end

:internal_commands~endlogoffgame
killtrigger logearly
killtrigger timebeforerelog
goto :relog_attempt

:internal_commands~calctime
setvar $internal_commands~hours 0
setvar $internal_commands~minutes 0
setvar $internal_commands~seconds 0
setvar $internal_commands~testtime $internal_commands~timetologbackin
if ($internal_commands~testtime >= 3600)
	setvar $internal_commands~hours ($internal_commands~testtime / 3600)
	setvar $internal_commands~testtime ($internal_commands~testtime - ($internal_commands~hours * 3600))
end
if ($internal_commands~testtime >= 60)
	setvar $internal_commands~minutes ($internal_commands~testtime / 60)
	setvar $internal_commands~testtime ($internal_commands~testtime - ($internal_commands~minutes * 60))
end
if ($internal_commands~testtime >= 1)
	setvar $internal_commands~seconds $internal_commands~testtime
end
if ($internal_commands~hours < 10)
	setvar $internal_commands~hours 0&$internal_commands~hours
end
if ($internal_commands~minutes < 10)
	setvar $internal_commands~minutes 0&$internal_commands~minutes
end
if ($internal_commands~seconds < 10)
	setvar $internal_commands~seconds 0&$internal_commands~seconds
end
return

:internal_commands~surround
setvar $bot~user_command_line "surround "&$bot~parm1&" "&$bot~parm2&" "&$bot~parm3&" "&$bot~parm4&" "&$bot~parm5&" "&$bot~parm6&" "&$bot~parm7&" "&$bot~parm8
goto :user_interface~runusercommandline

:internal_commands~clear
setvar $bot~user_command_line "clear "&$bot~parm1&" "&$bot~parm2&" "&$bot~parm3&" "&$bot~parm4&" "&$bot~parm5&" "&$bot~parm6&" "&$bot~parm7&" "&$bot~parm8
goto :user_interface~runusercommandline

:internal_commands~exit
:internal_commands~xenter
setvar $bot~user_command_line "xenter "&$bot~parm1&" "&$bot~parm2&" "&$bot~parm3&" "&$bot~parm4&" "&$bot~parm5&" "&$bot~parm6&" "&$bot~parm7&" "&$bot~parm8
goto :user_interface~runusercommandline

:internal_commands~shutdown
setvar $bot~mode "General"
savevar $bot~mode
goto :bot~wait_for_command

:internal_commands~about
gosub :bot~dosplashscreen
echo "*" currentansiline
goto :bot~wait_for_command

:internal_commands~bot
setvar $switchboard~message ""
if ($bot~parm1 = "on")
	setvar $bot~botisoff false
	savevar $bot~botisoff
	setvar $switchboard~message "Bot Active*"
end
if ($bot~parm1 = "off")
	setvar $bot~botisoff true
	savevar $bot~botisoff
	setvar $switchboard~message "Bot Deactivated*"
end
if (($bot~parm1 <> "off") and ($bot~parm1 <> "on"))
	setvar $switchboard~message "That status option is unknown..*"
end
gosub :switchboard~switchboard
goto :bot~wait_for_command

:internal_commands~refresh
gosub :bot~killthetriggers
gosub :player~quikstats
setvar $bot~validprompts "Citadel Command"
gosub :player~checkstartingprompt
if ($player~current_prompt = "Citadel")
	send "q"
	gosub :planet~getplanetinfo
	send "q"
end

gosub :player~getinfo
gosub :game~gamestats

gosub :ship~getshipstats

gosub :player~quikstats
gosub :ship~getshipcapstats
gosub :ship~loadshipinfo

gosub :planet~getplanetstats
gosub :planet~loadplanetinfo

if ($player~current_prompt = "Citadel")
	gosub :planet~landingsub
end
setvar $switchboard~message "Bot data refresh completed.*"
gosub :switchboard~switchboard
goto :bot~wait_for_command

:internal_commands~holo_kill
:internal_commands~hkill
setvar $bot~user_command_line "hkill "&$bot~parm1&" "&$bot~parm2&" "&$bot~parm3&" "&$bot~parm4&" "&$bot~parm5&" "&$bot~parm6&" "&$bot~parm7&" "&$bot~parm8

gosub :bot~killthetriggers

loadvar $player~surround_before_hkill
getwordpos $bot~user_command_line $internal_commands~pos "surround"
if ($internal_commands~pos > 0)
	setvar $player~surround_before_hkill true
else
	if ($player~surround_before_hkill <> true)
		setvar $player~surround_before_hkill false
	end
end

setvar $player~cit false
gosub :player~quikstats
setvar $internal_commands~startinglocation $player~current_prompt
setvar $bot~validprompts "Citadel Command"
gosub :player~checkstartingprompt
gosub :combat~holokill
if ($switchboard~message <> "")
	gosub :switchboard~switchboard
end

goto :bot~wait_for_command

:internal_commands~autokill
setvar $bot~parm1 "furb"
setvar $bot~parm2 "silent"

:internal_commands~kill
gosub :bot~killthetriggers
if ($bot~parm1 = "furb")
	setvar $internal_commands~furb true
end

gosub :player~currentprompt
setvar $player~startinglocation $player~current_prompt

if ($player~startinglocation <> "Command")
	if ($player~startinglocation = "Citadel")
		loadvar $bot~mode
		if ($bot~mode <> "Citkill")
			setvar $bot~user_command_line "citkill on override"
			setvar $bot~autoattack false
			savevar $bot~autoattack
			goto :user_interface~runusercommandline
		else
			setvar $bot~user_command_line "citkill off"
			goto :user_interface~runusercommandline
		end
	end
	setvar $switchboard~message "Wrong prompt for auto kill.*"
	gosub :switchboard~switchboard
	if ($bot~autoattack)
		setvar $bot~autoattack false
		savevar $bot~autoattack
		setvar $switchboard~message "Since in wrong prompt, shutting down autokill option in bot.  Restart in options.*"
		gosub :switchboard~switchboard
	end
	goto :bot~wait_for_command
end
loadvar $ship~ship_max_attack
loadvar $ship~ship_fighters_max
loadvar $ship~ship_offensive_odds
if ($ship~ship_max_attack <= 0)
	gosub :ship~getshipstats
end
setvar $player~isfound false
gosub :sector~getsectordata
gosub :combat~fastattack
if ((($player~current_sector = 1) or ($player~current_sector = $map~stardock)) and ($internal_commands~furb = true))
	if ($player~isfound)
		load "scripts\"&$bot~mombot_directory&"\commands\resource\refurb.cts"
		seteventtrigger 1 :refurbended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\resource\refurb.cts"
		pause

		:internal_commands~refurbended
		gosub :sector~getsectordata
		gosub :combat~fastattack
	end
end
goto :bot~wait_for_command

:internal_commands~autocapture
:internal_commands~autocap
:internal_commands~cap
setvar $bot~user_command_line "cap "&$bot~parm1&" "&$bot~parm2&" "&$bot~parm3&" "&$bot~parm4&" "&$bot~parm5&" "&$bot~parm6&" "&$bot~parm7&" "&$bot~parm8

gosub :bot~killthetriggers
gosub :player~quikstats
setvar $player~startinglocation $player~current_prompt
if ($player~startinglocation <> "Command")
	if ($player~startinglocation = "Citadel")
		loadvar $bot~mode
		if ($bot~mode <> "Citcap")
			setvar $bot~command "citcap"
			setvar $bot~user_command_line " citcap on "
			setvar $bot~parm1 "on"
			goto :user_interface~runusercommandline
		else
			setvar $bot~command "citcap"
			setvar $bot~user_command_line " citcap off "
			setvar $bot~parm1 "off"
			goto :user_interface~runusercommandline
		end
		goto :bot~wait_for_command
	end
	setvar $switchboard~message "Wrong prompt for auto capture.*"
	gosub :switchboard~switchboard
	goto :bot~wait_for_command
end
getwordpos $bot~user_command_line $internal_commands~pos "alien"
if ($internal_commands~pos > 0)
	setvar $player~onlyaliens true
else
	setvar $player~onlyaliens false
end
fileexists $ship~cap_file_chk $ship~cap_file
if ($ship~cap_file_chk <> true)
	gosub :ship~getshipcapstats
end
loadvar $ship~ship_max_attack
loadvar $ship~ship_fighters_max
loadvar $ship~ship_offensive_odds
if ($ship~ship_offensive_odds <= 0)
	gosub :ship~getshipstats
end
setvar $internal_commands~lasttarget ""
setvar $internal_commands~thistarget ""
gosub :sector~getsectordata
gosub :combat~fastcapture

goto :bot~wait_for_command

:internal_commands~do_relog
setvar $bot~parm1 "do_relog"

:internal_commands~relog_attempt
setvar $bot~user_command_line "relog "&$bot~parm1&" "&$bot~parm2&" "&$bot~parm3&" "&$bot~parm4&" "&$bot~parm5&" "&$bot~parm6&" "&$bot~parm7&" "&$bot~parm8
goto :user_interface~runusercommandline

:internal_commands~scrub
setvar $bot~user_command_line "scrub "&$bot~parm1&" "&$bot~parm2&" "&$bot~parm3&" "&$bot~parm4&" "&$bot~parm5&" "&$bot~parm6&" "&$bot~parm7&" "&$bot~parm8
goto :user_interface~runusercommandline

:internal_commands~autorefurb
:internal_commands~refurb
setvar $bot~user_command_line "refurb "&$bot~parm1&" "&$bot~parm2&" "&$bot~parm3&" "&$bot~parm4&" "&$bot~parm5&" "&$bot~parm6&" "&$bot~parm7&" "&$bot~parm8
goto :user_interface~runusercommandline

:internal_commands~switchbot
switchbot $bot~parm1
halt

include "source\include\user_interface"
include "source\include\bot"
