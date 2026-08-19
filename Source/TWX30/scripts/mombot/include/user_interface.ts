:user_interface~check_routing_all
setvar $user_interface~temp_bot_name "all"
goto :do_routing

:user_interface~check_routing_team
setvar $user_interface~temp_bot_name $bot~bot_team_name
goto :do_routing

:user_interface~check_routing
setvar $user_interface~temp_bot_name $switchboard~bot_name

:user_interface~do_routing
setvar $user_interface~currentline currentline
setvar $user_interface~currentansiline currentansiline
gosub :bot~killthetriggers
getword currentline $user_interface~routing 1
if ($user_interface~routing = "'"&$user_interface~temp_bot_name)
	goto :own_command
elseif ($user_interface~routing = "R")
	goto :command
elseif ($user_interface~routing = "P")
	goto :page_command
else
	goto :bot~wait_for_command
end

:user_interface~own_command
cuttext $user_interface~currentansiline $user_interface~ansi_ck1 1 1
if ($user_interface~ansi_ck1 <> "")
	goto :bot~wait_for_command
end
getword $user_interface~currentline $user_interface~radio_type 1
striptext $user_interface~radio_type $user_interface~temp_bot_name
setvar $bot~user_command_line $user_interface~currentline
setvar $bot~user_command_line $bot~user_command_line&"              "
lowercase $bot~command_lines[$user_interface~b]
if ($user_interface~radio_type = "'")
	getlength "'"&$user_interface~temp_bot_name&" " $user_interface~length
	cuttext $bot~user_command_line $bot~user_command_line ($user_interface~length + 1) 9999
	setvar $user_interface~user_sec_level 9
	getword $user_interface~currentline $bot~command 2
	getwordpos $bot~command $user_interface~pos "'"
	getwordpos $bot~command $user_interface~pos2 "`"
	if (($user_interface~pos = 1) or ($user_interface~pos2 = 1))
		goto :bot~wait_for_command
	end
	setvar $bot~command_caller "self"
	savevar $bot~command_caller
	getwordpos $bot~user_command_line $user_interface~pos "|"
	if ($user_interface~pos > 0)
		savevar $switchboard~self_command
		savevar $bot~user_command_line
		load "scripts\"&$bot~mombot_directory&"\commands\general\run.cts"
		goto :bot~wait_for_command
	end
	gosub :check_for_multi_commands
	goto :command_processing
else
	goto :bot~wait_for_command
end

:user_interface~command
setvar $user_interface~ansi_line $user_interface~currentansiline
getwordpos $user_interface~ansi_line $user_interface~pos "[36mR"
getwordpos $user_interface~ansi_line $user_interface~pos2 "[0;36mR"
if (($user_interface~pos <= 0) and ($user_interface~pos2 <= 0))
	goto :bot~wait_for_command
end
cuttext $user_interface~currentline $user_interface~user_name 3 6

gosub :verify_user_status
if ($user_interface~authorization = 0)
	goto :bot~wait_for_command
end

cuttext $user_interface~currentline $bot~user_command_line 10 999
getword $bot~user_command_line $user_interface~botname_chk 1
if ($user_interface~botname_chk <> $user_interface~temp_bot_name)
	goto :bot~wait_for_command
end
getlength $user_interface~temp_bot_name&" " $user_interface~length
cuttext $bot~user_command_line&"          " $bot~user_command_line ($user_interface~length + 1) 9999
setvar $bot~user_command_line $bot~user_command_line&"              "
getword $bot~user_command_line $bot~command 1
if (($bot~command = "bot") or ($bot~command = "relog"))
	goto :bot~wait_for_command
end
getwordpos $bot~user_command_line $user_interface~pos "|"
if ($user_interface~pos > 0)
	savevar $switchboard~self_command
	savevar $bot~user_command_line
	load "scripts\"&$bot~mombot_directory&"\commands\general\run.cts"
	goto :bot~wait_for_command
end
gosub :check_for_multi_commands
goto :command_processing

:user_interface~page_command
cuttext $user_interface~currentline $user_interface~user_name 3 6
cuttext $user_interface~currentline $bot~user_command_line 10 999
getwordpos $bot~user_command_line $user_interface~pos $switchboard~bot_name&":"&$bot~bot_password&":"&$bot~subspace
if ($user_interface~pos > 0)
	add $bot~corpycount 1
	setvar $bot~corpy[$bot~corpycount] $user_interface~user_name
	setvar $user_interface~loggedin[$user_interface~user_name] 1
	setvar $switchboard~message "User Verified - " $user_interface~user_name "*"
	gosub :switchboard~switchboard
else
	gosub :verify_user_status
	if ($user_interface~authorization = 0)
		echo "*"&ansi_14&"["&ansi_15&"Bad attempt to control bot through private message."&ansi_14&"]*"
		goto :bot~wait_for_command
	end
	getword $bot~user_command_line $user_interface~botname_chk 1
	if ($user_interface~botname_chk <> $user_interface~temp_bot_name)
		goto :bot~wait_for_command
	end
	getlength $user_interface~temp_bot_name&" " $user_interface~length
	cuttext $bot~user_command_line&"          " $bot~user_command_line ($user_interface~length + 1) 9999
	lowercase $bot~user_command_line
	setvar $bot~user_command_line $bot~user_command_line&"              "
	getword $bot~user_command_line $bot~command 1
	if (($bot~command = "bot") or ($bot~command = "relog"))
		goto :bot~wait_for_command
	end
	getwordpos $bot~user_command_line $user_interface~pos "|"
	if ($user_interface~pos > 0)
		savevar $switchboard~self_command
		savevar $bot~user_command_line
		load "scripts\"&$bot~mombot_directory&"\commands\general\run.cts"
		goto :bot~wait_for_command
	end
	gosub :check_for_multi_commands
	goto :command_processing
end
goto :bot~wait_for_command

:user_interface~user_access
gosub :bigdelay_killthetriggers
gosub :selfcommandprompt
setvar $bot~command_caller "self"
savevar $bot~command_caller
lowercase $bot~user_command_line
if ($bot~user_command_line = "")
	echo currentansiline
	goto :bot~wait_for_command
end
setvar $switchboard~self_command true
getwordpos $bot~user_command_line $user_interface~pos "|"
if ($user_interface~pos > 0)
	savevar $switchboard~self_command
	savevar $bot~user_command_line
	load "scripts\"&$bot~mombot_directory&"\commands\general\run.cts"
	goto :bot~wait_for_command
end

:user_interface~runusercommandline
setvar $bot~user_command_line $bot~user_command_line&"              "
setvar $user_interface~authorization 9
setvar $user_interface~user_sec_level 9

gosub :check_for_multi_commands

goto :command_processing

:user_interface~check_for_multi_commands
gosub :user_interface~normalize_user_command_line

setarray $bot~command_lines 10 10
setarray $user_interface~typed_commands 10
setarray $user_interface~command_remainders 10
setarray $user_interface~command_remainders_from_eight 10
getwordpos $bot~user_command_line $user_interface~pos "|"
if ($user_interface~pos > 0)

	splittext $bot~user_command_line $bot~commands "|"
	setvar $user_interface~b 1
	setvar $bot~command_lines 0
	while ($user_interface~b <= $bot~commands)
		getword $bot~commands[$user_interface~b] $bot~command_lines[$user_interface~b][9] 1
		getlength $bot~command_lines[$user_interface~b][9]&" " $bot~commandlength
		getwordpos $bot~command_lines[$user_interface~b][9] $user_interface~pos "'"
		getwordpos $bot~command_lines[$user_interface~b][9] $user_interface~pos2 "`"
		if (($user_interface~pos <> 1) and ($user_interface~pos2 <> 1))
			cuttext $bot~commands[$user_interface~b]&"    " $bot~commands[$user_interface~b] ($bot~commandlength + 1) 9999
		end
		setvar $bot~command_lines[$user_interface~b] $bot~commands[$user_interface~b]
		setvar $bot~command_lines[$user_interface~b][9] $bot~command_lines[$user_interface~b][9]

		setvar $bot~command_lines[$user_interface~b] $bot~commands[$user_interface~b]
		gosub :getparameters
		gosub :user_interface~set_command_remainder
		add $bot~command_lines 1
		add $user_interface~b 1
	end
else
	setarray $bot~command_lines 1
	setvar $bot~command_lines 1
	setvar $bot~command_lines[1] $bot~user_command_line
	getword $bot~command_lines[1] $bot~command_lines[1][9] 1
	getlength $bot~command_lines[1][9]&" " $bot~commandlength
	getwordpos $bot~command_lines[1][9] $user_interface~pos "'"
	getwordpos $bot~command_lines[1][9] $user_interface~pos2 "`"
	if (($user_interface~pos <> 1) and ($user_interface~pos2 <> 1))
		cuttext $bot~command_lines[1]&"    " $bot~command_lines[1] ($bot~commandlength + 1) 9999
	end
	setvar $user_interface~b 1
	gosub :getparameters
	gosub :user_interface~set_command_remainder
end

return

:user_interface~normalize_user_command_line
setvar $user_interface~raw_command_line $bot~user_command_line
getlength $user_interface~raw_command_line $user_interface~raw_length
if ($user_interface~raw_length <= 0)
	return
end

setvar $user_interface~normalized_command_line ""
setvar $user_interface~cursor 1
setvar $user_interface~i 1
while ($user_interface~i <= $user_interface~raw_length)
	cuttext $user_interface~raw_command_line $user_interface~current_char $user_interface~i 1
	if ($user_interface~current_char = #8)
		if ($user_interface~cursor > 1)
			subtract $user_interface~cursor 1
		end
	elseif ($user_interface~current_char <> #13)
		getlength $user_interface~normalized_command_line $user_interface~normalized_length
		if ($user_interface~cursor > $user_interface~normalized_length)
			setvar $user_interface~normalized_command_line $user_interface~normalized_command_line & $user_interface~current_char
		else
			if ($user_interface~cursor > 1)
				cuttext $user_interface~normalized_command_line $user_interface~normalized_front 1 ($user_interface~cursor - 1)
			else
				setvar $user_interface~normalized_front ""
			end
			cuttext $user_interface~normalized_command_line $user_interface~normalized_tail ($user_interface~cursor + 1) 9999
			setvar $user_interface~normalized_command_line $user_interface~normalized_front & $user_interface~current_char & $user_interface~normalized_tail
		end
		add $user_interface~cursor 1
	end
	add $user_interface~i 1
end
trim $user_interface~normalized_command_line
setvar $bot~user_command_line $user_interface~normalized_command_line
return

:user_interface~getparameters
setvar $user_interface~test_value 0
setvar $user_interface~i 1
while ($user_interface~test_value <> "")
	getword " "&$bot~command_lines[$user_interface~b]&" " $user_interface~test_value $user_interface~i ""
	getwordpos " "&$user_interface~test_value&" " $user_interface~posthousands "k "
	getwordpos " "&$user_interface~test_value&" " $user_interface~posmillions "m "
	getwordpos " "&$user_interface~test_value&" " $user_interface~posbillions "b "
	if (($user_interface~posmillions > 0) or ($user_interface~posthousands > 0) or ($user_interface~posbillions > 0))
		replacetext $user_interface~test_value "k" ""
		replacetext $user_interface~test_value "m" ""
		replacetext $user_interface~test_value "b" ""
		trim $user_interface~test_value
		isnumber $user_interface~is_a_number $user_interface~test_value
		if ($user_interface~is_a_number = true)
			if ($user_interface~test_value <> 0)
				replacetext $bot~command_lines[$user_interface~b] $user_interface~test_value&"k" $user_interface~test_value&000
				replacetext $bot~command_lines[$user_interface~b] $user_interface~test_value&"m" $user_interface~test_value&000000
				replacetext $bot~command_lines[$user_interface~b] $user_interface~test_value&"b" $user_interface~test_value&000000000
			end
		end
	end
	add $user_interface~i 1
end

setvar $user_interface~i 1
while ($user_interface~i <= 8)
	getword " "&$bot~command_lines[$user_interface~b]&" " $bot~command_lines[$user_interface~b][$user_interface~i] $user_interface~i ""
	add $user_interface~i 1
end
return

:user_interface~set_command_remainder
setvar $user_interface~command_remainders[$user_interface~b] ""
setvar $user_interface~remainder_index 9
setvar $user_interface~remainder_word "x"
while ($user_interface~remainder_word <> "")
	getword " "&$bot~command_lines[$user_interface~b]&" " $user_interface~remainder_word $user_interface~remainder_index ""
	if ($user_interface~remainder_word <> "")
		setvar $user_interface~command_remainders[$user_interface~b] $user_interface~command_remainders[$user_interface~b]&" "&$user_interface~remainder_word
	end
	add $user_interface~remainder_index 1
end
setvar $user_interface~command_remainders_from_eight[$user_interface~b] ""
setvar $user_interface~remainder_index 8
setvar $user_interface~remainder_word "x"
while ($user_interface~remainder_word <> "")
	getword " "&$bot~command_lines[$user_interface~b]&" " $user_interface~remainder_word $user_interface~remainder_index ""
	if ($user_interface~remainder_word <> "")
		setvar $user_interface~command_remainders_from_eight[$user_interface~b] $user_interface~command_remainders_from_eight[$user_interface~b]&" "&$user_interface~remainder_word
	end
	add $user_interface~remainder_index 1
end
return

:user_interface~selfcommandprompt
loadvar $bot~historystring
setvar $bot~historycount 0
getwordpos $bot~historystring $user_interface~pos "<<|HS|>>"
while (($user_interface~pos > 0) and ($bot~historycount < $bot~historymax))
	cuttext $bot~historystring $user_interface~archive 1 ($user_interface~pos - 1)
	replacetext $bot~historystring $user_interface~archive&"<<|HS|>>" ""
	setvar $bot~history[($bot~historycount + 1)] $user_interface~archive
	add $bot~historycount 1
	getwordpos $bot~historystring $user_interface~pos "<<|HS|>>"
end
gosub :bot~bigdelay_killthetriggers
setvar $user_interface~prompt ansi_10&#27&"[255D"&#27&"[255B"&#27&"[K"&ansi_4&"{"&ansi_14&$bot~mode&ansi_4&"}"&ansi_15&" "&$switchboard~bot_name&ansi_2&">"&ansi_7
echo $user_interface~prompt

:user_interface~getinput
setvar $bot~promptoutput ""
killtrigger text
killtrigger reecho
killtrigger keepalive
settextouttrigger text :getcharacter
setdelaytrigger keepalive :connectivity~keepalive 30000
settexttrigger reecho :reecho
pause

:user_interface~getcharacter
getouttext $user_interface~character
setvar $user_interface~found_enter_key false
if ($user_interface~character = #13)
	gosub :do_enter_key
	goto :doneselfcommandprompt
end
if (($user_interface~character = ">") and ($bot~charcount <= 0))

	:user_interface~cleargridprompt
	loadvar $planet~planet
	gosub :bot~bigdelay_killthetriggers
	gosub :player~quikstats
	settextouttrigger text :getcharacter
	setdelaytrigger keepalive :connectivity~keepalive 30000
	settexttrigger reecho :reecho
	setdelaytrigger griddelay :grid_menu_continue 30
	pause

	:user_interface~grid_menu_continue
	echo #27&"[2J"
	echo "**"

	:user_interface~gridprompt
	setdelaytrigger griddelay2 :grid_menu_continue2 50
	pause

	:user_interface~grid_menu_continue2
	gosub :bot~bigdelay_killthetriggers
	setvar $user_interface~doholo false
	setvar $user_interface~dodens false

	gosub :map~displayadjacentgridansi
	setvar $user_interface~gridprompt ansi_10&#27&"[255D"&#27&"[255B"&#27&"[K"&ansi_4&"{"&ansi_14&"Grid Menu - ["&ansi_15&"H"&ansi_14&"]olo ["&ansi_15&"D"&ansi_14&"]ens ["&ansi_15&"S"&ansi_14&"]urround "
	if ($player~photons > 0)
		setvar $user_interface~gridprompt $user_interface~gridprompt&"["&ansi_15&">"&ansi_14&"] Photon "
	end
	if ($player~current_prompt = "Citadel")
		setvar $user_interface~gridprompt $user_interface~gridprompt&"["&ansi_15&"+"&ansi_14&"]["&ansi_15&$bot~pgrid_type&ansi_14&"] ["&ansi_15&1&ansi_14&"-"&ansi_15&$map~gridwarpcount&ansi_14&"]"&ansi_4&"}"&ansi_14&ansi_2&">"&ansi_7&" "
	elseif ($player~current_prompt = "Command")
		setvar $user_interface~gridprompt $user_interface~gridprompt&"["&ansi_15&1&ansi_14&"-"&ansi_15&$map~gridwarpcount&ansi_14&"]"&ansi_4&"}"&ansi_14&" Move"&ansi_4&"}"&ansi_2&">"&ansi_7
	else
		echo ansi_12&"*Wrong prompt for Grid Menu*"
		goto :donegriddingprompt
	end
	echo $user_interface~gridprompt
	gosub :bot~bigdelay_killthetriggers
	settexttrigger reechogridmenu :reechogridmenu
	settextouttrigger text0 :gridprompt "?"
	if ($player~photons > 0)
		settextouttrigger text12 :photonprompt ">"
	end
	setdelaytrigger keepalive :connectivity~keepalive 30000
	setvar $user_interface~i 1
	while ($user_interface~i <= $map~gridwarpcount)
		settextouttrigger "grid_map"&$user_interface~i :visitsectorpgrid $user_interface~i
		add $user_interface~i 1
	end
	settextouttrigger text7 :hologrid #72
	settextouttrigger text8 :hologrid #104
	settextouttrigger text13 :hologrid "h"
	settextouttrigger text14 :hologrid "H"
	settextouttrigger text20 :surroundgrid #115
	settextouttrigger text16 :surroundgrid #83
	settextouttrigger text17 :surroundgrid "s"
	settextouttrigger text18 :surroundgrid "S"
	settextouttrigger text9 :densgrid #68
	settextouttrigger text10 :densgrid #100
	if ($player~current_prompt = "Citadel")
		settextouttrigger text15 :changepgridtype "+"
	end
	settextouttrigger text11 :donegriddingprompt
	pause

	:user_interface~photonprompt
	setdelaytrigger photondelay :photon_menu_continue 50
	pause

	:user_interface~photon_menu_continue
	gosub :bot~bigdelay_killthetriggers
	echo #27&"[2J"
	echo "**"
	echo ansi_10&#27&"[255D"&#27&"[255B"&#27&"[K"
	echo ansi_7&"               -----------------------------------*"
	echo ansi_7&"               | "&ansi_4&"PHOTON "&ansi_15&"armed and ready to fire! "&ansi_7&"|*"
	echo ansi_7&"               -----------------------------------*"
	gosub :map~displayadjacentgridansi
	setvar $user_interface~gridprompt ansi_10&#27&"[255D"&#27&"[255B"&#27&"[K"&ansi_4&"{"&ansi_14&"Photon Menu - ["&ansi_15&"H"&ansi_14&"]olo ["&ansi_15&"D"&ansi_14&"]ens "
	if ($player~current_prompt = "Citadel")
		setvar $user_interface~gridprompt $user_interface~gridprompt&"["&ansi_12&1&ansi_14&"-"&ansi_12&$map~gridwarpcount&ansi_14&"]"&ansi_4&"}"&ansi_14&ansi_2&">"&ansi_7&" "
	elseif ($player~current_prompt = "Command")
		setvar $user_interface~gridprompt $user_interface~gridprompt&"["&ansi_15&1&ansi_14&"-"&ansi_15&$map~gridwarpcount&ansi_14&"]"&ansi_4&"}"&ansi_4&"}"&ansi_2&">"&ansi_7
	else
		echo ansi_12&"*Wrong prompt for Photon Menu*"
		goto :donegriddingprompt
	end
	echo $user_interface~gridprompt
	gosub :bot~bigdelay_killthetriggers
	settexttrigger reechogridmenu :reechogridmenu
	settextouttrigger text0 :photonprompt "?"
	settextouttrigger text12 :cleargridprompt ">"
	setdelaytrigger keepalive :connectivity~keepalive 30000
	setvar $user_interface~i 1
	while ($user_interface~i <= $map~gridwarpcount)
		settextouttrigger "grid_map"&$user_interface~i :photonsectorpgrid $user_interface~i
		add $user_interface~i 1
	end
	settextouttrigger text7 :holophoton #72
	settextouttrigger text8 :holophoton #104
	settextouttrigger text13 :holophoton "h"
	settextouttrigger text14 :holophoton "H"
	settextouttrigger text9 :densphoton #68
	settextouttrigger text10 :densphoton #100
	settextouttrigger text11 :donegriddingprompt
	pause

	:user_interface~surroundgrid
	gosub :bot~bigdelay_killthetriggers

	setvar $bot~command "surround"
	setvar $bot~user_command_line " surround"
	setvar $bot~parm1 ""
	savevar $bot~parm1
	savevar $bot~command
	savevar $bot~user_command_line
	load "scripts\"&$bot~mombot_directory&"\commands\grid\surround.cts"
	seteventtrigger surroundended :surroundended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\grid\surround.cts"
	pause

	:user_interface~surroundended
	goto :gridprompt

	:user_interface~holophoton
	setvar $user_interface~doholo true
	gosub :dogridscan
	goto :photonprompt

	:user_interface~densphoton
	setvar $user_interface~dodens true
	gosub :dogridscan
	goto :photonprompt

	:user_interface~hologrid
	setvar $user_interface~doholo true
	gosub :dogridscan
	goto :gridprompt

	:user_interface~densgrid
	setvar $user_interface~dodens true
	gosub :dogridscan
	goto :gridprompt

	:user_interface~dogridscan
	gosub :bot~bigdelay_killthetriggers
	if ($player~current_prompt = "Citadel")
		setvar $user_interface~scantext "q q z n "
	else
		setvar $user_interface~scantext ""
	end
	if ($user_interface~doholo = true)
		setvar $user_interface~scantext $user_interface~scantext&"szhzn* "
	elseif ($user_interface~dodens = true)
		setvar $user_interface~scantext $user_interface~scantext&"sdz* "
	end
	if ($player~current_prompt = "Citadel")
		setvar $user_interface~scantext $user_interface~scantext&"l "&$planet~planet&"*  c  "
	end
	send $user_interface~scantext
	if ($player~current_prompt = "Citadel")
		waiton "<Enter Citadel>"
	else
		waiton "["&currentsector&"]"
	end
	return

	:user_interface~changepgridtype
	if ($bot~pgrid_type = "Normal")
		if ($bot~safe_ship <= 0)
			setvar $bot~pgrid_type "Xport (Not Available)"
			setvar $bot~pgrid_end_command " scan "
		else
			setvar $bot~pgrid_type "Xport"
			setvar $bot~pgrid_end_command " x:"&$bot~safe_ship&" scan "
		end
	elseif (($bot~pgrid_type = "Xport") or ($bot~pgrid_type = "Xport (Not Available)"))
		setvar $bot~pgrid_type "Retreat"
		setvar $bot~pgrid_end_command " r scan "
	else
		setvar $bot~pgrid_type "Normal"
		setvar $bot~pgrid_end_command " scan "
	end
	goto :gridprompt

	:user_interface~visitsectorpgrid
	getouttext $user_interface~sector
	gosub :bot~bigdelay_killthetriggers
	if (sector.warps[currentsector][$user_interface~sector] > 0)
		if ($player~current_prompt = "Citadel")
			getsectorparameter sector.warps[currentsector][$user_interface~sector] "FIGSEC" $user_interface~isfigged
			if ($user_interface~isfigged)
				setvar $bot~user_command_line "p "&sector.warps[currentsector][$user_interface~sector]&" scan"
				goto :runusercommandline
			else
				if (($bot~pgrid_bot <> "") and ($bot~pgrid_bot <> 0))
					send "'"&$bot~pgrid_bot&" pgrid "&sector.warps[currentsector][$user_interface~sector]&" d:"&sector.density[sector.warps[currentsector][$user_interface~sector]]&" "&$bot~pgrid_end_command "**"
				else
					setvar $bot~user_command_line "pgrid "&sector.warps[currentsector][$user_interface~sector]&" "&$bot~pgrid_end_command
					goto :runusercommandline
				end
			end

		elseif ($player~current_prompt = "Command")
			setvar $move~moveintosector sector.warps[currentsector][$user_interface~sector]
			gosub :move~moveintosector
		end
	end

	:user_interface~donegriddingprompt
	echo #27&"[255D"&#27&"[255B"&#27&"[K"
	setvar $user_interface~ansi currentansiline
	striptext $user_interface~ansi "Y"
	echo $user_interface~ansi
	goto :bot~wait_for_command

	:user_interface~photonsectorpgrid
	getouttext $user_interface~sector
	gosub :bot~bigdelay_killthetriggers
	if (sector.warps[currentsector][$user_interface~sector] > 0)
		setvar $bot~user_command_line "photon "&sector.warps[currentsector][$user_interface~sector]
		goto :runusercommandline
	end
	goto :donegriddingprompt

	:user_interface~nextmenu
	settextouttrigger text12 :nextmenu ">"
	pause

	:user_interface~reechogridmenu
	echo ansi_10&#27&"[255D"&#27&"[255B"&#27&"[K"&$user_interface~gridprompt
	settexttrigger reechogridmenu :reechogridmenu
	pause
else
	getlength $user_interface~character $user_interface~characterlength
	if (($user_interface~characterlength > 1) or ($user_interface~character = #8))
		if ($user_interface~character = #8)
			if ($bot~charcount <= 0)
				setvar $bot~charcount 0
				setvar $bot~charpos 0
			else
				if ($bot~charpos >= $bot~charcount)
					setvar $user_interface~frontmacro $bot~promptoutput
					setvar $user_interface~tailmacro ""
				else
					cuttext $bot~promptoutput $user_interface~tailmacro ($bot~charpos + 1) 9999
					cuttext $bot~promptoutput $user_interface~frontmacro 1 $bot~charpos
				end
				getlength $user_interface~frontmacro $user_interface~frontlength
				if ($user_interface~frontlength > 1)
					cuttext $user_interface~frontmacro $user_interface~frontmacro 1 ($user_interface~frontlength - 1)
				else
					setvar $user_interface~frontmacro ""
				end
				setvar $bot~promptoutput $user_interface~frontmacro&$user_interface~tailmacro
				getlength $bot~promptoutput $bot~charcount
				subtract $bot~charpos 1
				if ($bot~charpos <= 0)
					setvar $bot~charpos 0
				end
				if (($bot~charcount - $bot~charpos) > 0)
					echo $user_interface~prompt $bot~promptoutput #27 "[" ($bot~charcount - $bot~charpos) "D"
				else
					echo $user_interface~prompt $bot~promptoutput
				end
			end
		elseif (($user_interface~character = #27&"[A") or ($user_interface~character = #28) or ($user_interface~character = #27&#79&#65))
			if ($bot~historycount > 0)
				if ($bot~historyindex <= 0)
					setvar $bot~currentprompttext $bot~promptoutput
				end
				add $bot~historyindex 1
				if ($bot~historyindex > $bot~historymax)
					setvar $bot~historyindex $bot~historymax
				elseif ($bot~historyindex > $bot~historycount)
					setvar $bot~historyindex $bot~historycount
				end
				getlength $bot~history[$bot~historyindex] $bot~charcount
				setvar $bot~charpos $bot~charcount
				echo $user_interface~prompt $bot~history[$bot~historyindex]
				setvar $bot~promptoutput $bot~history[$bot~historyindex]
			end
		elseif (($user_interface~character = #27&"[B") or ($user_interface~character = #29) or ($user_interface~character = #27&#79&#66))
			if ($bot~historycount > 0)
				if ($bot~historyindex <= 0)
					setvar $bot~currentprompttext $bot~promptoutput
				end
				subtract $bot~historyindex 1
				if ($bot~historyindex < 1)
					setvar $bot~historyindex 0
					getlength $bot~currentprompttext $bot~charcount
					setvar $bot~charpos $bot~charcount
					echo $user_interface~prompt $bot~currentprompttext
					setvar $bot~promptoutput $bot~currentprompttext
				else
					getlength $bot~history[$bot~historyindex] $bot~charcount
					setvar $bot~charpos $bot~charcount
					echo $user_interface~prompt $bot~history[$bot~historyindex]
					setvar $bot~promptoutput $bot~history[$bot~historyindex]
				end
			end
		elseif (($user_interface~character = #27&"[D") or ($user_interface~character = #31))
			if ($bot~charpos > 0)
				subtract $bot~charpos 1
				echo ansi_10 $user_interface~character
			end
		elseif (($user_interface~character = #27&"[C") or ($user_interface~character = #30))
			if ($bot~charpos <= $bot~charcount)
				add $bot~charpos 1
				echo ansi_10 $user_interface~character
			end
		else
			getwordpos $user_interface~character $user_interface~pos #13
			if ($user_interface~pos > 0)
				setvar $user_interface~found_enter_key true
			end
			striptext $user_interface~character #27&"[A"
			striptext $user_interface~character #27&"[B"
			striptext $user_interface~character #27&"[C"
			striptext $user_interface~character #27&"[D"
			striptext $user_interface~character #8
			striptext $user_interface~character #13
			getlength $user_interface~character $user_interface~characterlength
			goto :treatasusual
		end
	else

		:user_interface~treatasusual
		if ($bot~charpos >= $bot~charcount)
			setvar $user_interface~frontmacro $bot~promptoutput
			setvar $user_interface~tailmacro ""&$user_interface~character&""
		else
			cuttext $bot~promptoutput $user_interface~frontmacro 1 $bot~charpos
			cuttext $bot~promptoutput $user_interface~tailmacro ($bot~charpos + 1) ($bot~charcount - ($bot~charpos - 1))
			setvar $user_interface~frontmacro $user_interface~frontmacro&$user_interface~character
		end
		setvar $bot~promptoutput $user_interface~frontmacro&$user_interface~tailmacro
		getlength $bot~promptoutput $bot~charcount
		add $bot~charpos $user_interface~characterlength
		if (($bot~charcount - $bot~charpos) > 0)
			echo $user_interface~prompt $bot~promptoutput #27 "[" ($bot~charcount - ($bot~charpos + 1)) "D"
		else
			echo $user_interface~prompt $bot~promptoutput
		end
		if ($user_interface~found_enter_key)
			gosub :do_enter_key
			goto :doneselfcommandprompt
		end

	end
end
settextouttrigger text :getcharacter
pause

:user_interface~reecho
if (($bot~charcount - $bot~charpos) > 0)
	echo $user_interface~prompt&$bot~promptoutput&#27&"["&($bot~charcount - ($bot~charpos + 1))&"D"
else
	echo $user_interface~prompt&$bot~promptoutput
end
settexttrigger reecho :reecho
pause

:user_interface~doneselfcommandprompt
killtrigger text
killtrigger reecho
return

:user_interface~do_enter_key
echo #27&"[255D"&#27&"[255B"&#27&"[K"
setvar $bot~user_command_line $bot~promptoutput
gosub :doaddhistory
return

:user_interface~doaddhistory
setvar $bot~charcount 0
setvar $bot~currentprompttext ""
setvar $bot~historyindex 0
setvar $bot~charpos 0
setvar $bot~promptoutput ""
setvar $bot~historystring ""
cuttext $bot~user_command_line&"  " $user_interface~checkforchat 1 1
if ($bot~user_command_line <> "")
	add $bot~historycount 1
	if ($bot~historycount > 1)
		setvar $user_interface~i $bot~historymax
		while ($user_interface~i > 1)
			setvar $bot~history[$user_interface~i] $bot~history[($user_interface~i - 1)]
			setvar $bot~historystring $bot~history[$user_interface~i]&"<<|HS|>>"&$bot~historystring
			subtract $user_interface~i 1
		end
	end

	if ($user_interface~checkforchat <> "`")
		setvar $bot~history[1] $bot~user_command_line
		setvar $bot~historystring $bot~history[1]&"<<|HS|>>"&$bot~historystring
	end
	savevar $bot~historystring
end
return

:user_interface~command_processing
gosub :bot~load_watcher_variables
setvar $user_interface~b 1
while ($user_interface~b <= $bot~command_lines)
	lowercase $bot~command_lines[$user_interface~b][9]

	:user_interface~command_filtering
	cuttext $bot~command_lines[$user_interface~b][9]&"  " $user_interface~checkforchat 1 1
	cuttext $bot~command_lines[$user_interface~b][9]&"  " $user_interface~checkforfinder 1 1
	if ($user_interface~checkforchat = "'")
		cuttext $bot~command_lines[$user_interface~b] $bot~command_lines[$user_interface~b] 2 9999
		setvar $bot~command_lines[$user_interface~b][9] "ss"
	elseif ($user_interface~checkforchat = "`")
		cuttext $bot~command_lines[$user_interface~b] $bot~command_lines[$user_interface~b] 2 9999
		setvar $bot~command_lines[$user_interface~b][9] "fed"
	end
	if ($bot~command_caller <> "self")
		if (($bot~command_lines[$user_interface~b][9] = "ss") or ($bot~command_lines[$user_interface~b][9] = "fed"))

			goto :bot~wait_for_command
		end
	end
	savevar $switchboard~self_command
	setvar $user_interface~typed_commands[$user_interface~b] $bot~command_lines[$user_interface~b][9]
	gosub :user_interface~resolve_command_alias
	if ($user_interface~typed_commands[$user_interface~b] = $bot~command_lines[$user_interface~b][9])
		setvar $user_interface~typed_commands[$user_interface~b] ""
	end
	setvar $user_interface~use_word_eight_remainder false
	setvar $user_interface~update_list " limps figs armids cim "
	getwordpos " "&$bot~command_lines[$user_interface~b]&" " $user_interface~pos " override "
	getwordpos " "&$bot~command_lines[$user_interface~b]&" " $user_interface~pos2 " overide "
	setvar $player~override false
	if (($user_interface~pos > 0) or ($user_interface~pos2 > 0))
		setvar $player~override true
	end
	savevar $player~override
	getwordpos $user_interface~update_list $user_interface~pos " "&$bot~command_lines[$user_interface~b][9]&" "
	if ($user_interface~pos > 0)
		setvar $user_interface~use_word_eight_remainder true
		setvar $bot~command_lines[$user_interface~b][8] $bot~command_lines[$user_interface~b][9]
		setvar $bot~command_lines[$user_interface~b][9] "update"
		setvar $bot~command_lines[$user_interface~b] $bot~command_lines[$user_interface~b][1]&" "&$bot~command_lines[$user_interface~b][2]&" "&$bot~command_lines[$user_interface~b][3]&" "&$bot~command_lines[$user_interface~b][4]&" "&$bot~command_lines[$user_interface~b][5]&" "&$bot~command_lines[$user_interface~b][6]&" "&$bot~command_lines[$user_interface~b][7]&" "&$bot~command_lines[$user_interface~b][8]&" "
	end
	setvar $user_interface~deploy_list " lay put place limp mine armid plimp mines climp cmine pmine topoff mines fig "
	getwordpos $user_interface~deploy_list $user_interface~pos " "&$bot~command_lines[$user_interface~b][9]&" "
	if ($user_interface~pos > 0)
		setvar $user_interface~use_word_eight_remainder true
		if (($bot~command_lines[$user_interface~b][9] <> "lay") or ($bot~command_lines[$user_interface~b][9] <> "put") or ($bot~command_lines[$user_interface~b][9] <> "place"))
			setvar $bot~command_lines[$user_interface~b][8] $bot~command_lines[$user_interface~b][9]
		end
		setvar $bot~command_lines[$user_interface~b][9] "deploy"
		setvar $bot~command_lines[$user_interface~b] $bot~command_lines[$user_interface~b][1]&" "&$bot~command_lines[$user_interface~b][2]&" "&$bot~command_lines[$user_interface~b][3]&" "&$bot~command_lines[$user_interface~b][4]&" "&$bot~command_lines[$user_interface~b][5]&" "&$bot~command_lines[$user_interface~b][6]&" "&$bot~command_lines[$user_interface~b][7]&" "&$bot~command_lines[$user_interface~b][8]&" "
	end
	if (($bot~command_lines[$user_interface~b][9] = "figmove") or ($bot~command_lines[$user_interface~b][9] = "movefigs"))
		setvar $bot~command_lines[$user_interface~b][9] "movefig"
	end
	if (($bot~command_lines[$user_interface~b][9] = "build") or ($bot~command_lines[$user_interface~b][9] = "create") or ($bot~command_lines[$user_interface~b][9] = "make"))

		setvar $user_interface~use_word_eight_remainder true
		if ($bot~command_lines[$user_interface~b][1] = "port")
			setvar $bot~command_lines[$user_interface~b][9] $bot~command_lines[$user_interface~b][1]
		elseif ($bot~command_lines[$user_interface~b][1] = "planet")
			setvar $bot~command_lines[$user_interface~b][9] $bot~command_lines[$user_interface~b][1]
		else
			setvar $bot~command_lines[$user_interface~b][9] "port"
		end
		setvar $bot~command_lines[$user_interface~b][8] $bot~command_lines[$user_interface~b][7]
		setvar $bot~command_lines[$user_interface~b][7] $bot~command_lines[$user_interface~b][6]
		setvar $bot~command_lines[$user_interface~b][6] $bot~command_lines[$user_interface~b][5]
		setvar $bot~command_lines[$user_interface~b][5] $bot~command_lines[$user_interface~b][4]
		setvar $bot~command_lines[$user_interface~b][4] $bot~command_lines[$user_interface~b][3]
		setvar $bot~command_lines[$user_interface~b][3] $bot~command_lines[$user_interface~b][2]
		setvar $bot~command_lines[$user_interface~b][2] $bot~command_lines[$user_interface~b][1]
		setvar $bot~command_lines[$user_interface~b][1] "create"
		setvar $bot~command_lines[$user_interface~b] $bot~command_lines[$user_interface~b][1]&" "&$bot~command_lines[$user_interface~b][2]&" "&$bot~command_lines[$user_interface~b][3]&" "&$bot~command_lines[$user_interface~b][4]&" "&$bot~command_lines[$user_interface~b][5]&" "&$bot~command_lines[$user_interface~b][6]&" "&$bot~command_lines[$user_interface~b][7]&" "&$bot~command_lines[$user_interface~b][8]&" "
	end
	if (($bot~command_lines[$user_interface~b][9] = "kill") or ($bot~command_lines[$user_interface~b][9] = "destroy") or ($bot~command_lines[$user_interface~b][9] = "blow"))
		if ($bot~command_lines[$user_interface~b][1] = "port")
			setvar $bot~command_lines[$user_interface~b][9] $bot~command_lines[$user_interface~b][1]
			setvar $bot~command_lines[$user_interface~b][1] "kill"
		elseif ($bot~command_lines[$user_interface~b][1] = "planet")
			setvar $bot~command_lines[$user_interface~b][9] $bot~command_lines[$user_interface~b][1]
			setvar $bot~command_lines[$user_interface~b][1] "kill"
		else

			setvar $bot~command_lines[$user_interface~b][9] "kill"
		end
		setvar $bot~command_lines[$user_interface~b] $bot~command_lines[$user_interface~b][1]&" "&$bot~command_lines[$user_interface~b][2]&" "&$bot~command_lines[$user_interface~b][3]&" "&$bot~command_lines[$user_interface~b][4]&" "&$bot~command_lines[$user_interface~b][5]&" "&$bot~command_lines[$user_interface~b][6]&" "&$bot~command_lines[$user_interface~b][7]&" "&$bot~command_lines[$user_interface~b][8]&" "
	end
	if (($bot~command_lines[$user_interface~b][9] = "upgrade") or ($bot~command_lines[$user_interface~b][9] = "max"))
		setvar $user_interface~use_word_eight_remainder true
		if ($bot~command_lines[$user_interface~b][1] = "port")
			setvar $bot~command_lines[$user_interface~b][9] $bot~command_lines[$user_interface~b][1]
		elseif ($bot~command_lines[$user_interface~b][1] = "planet")
			setvar $bot~command_lines[$user_interface~b][9] $bot~command_lines[$user_interface~b][1]
		else
			setvar $bot~command_lines[$user_interface~b][9] "port"
		end
		setvar $bot~command_lines[$user_interface~b][8] $bot~command_lines[$user_interface~b][7]
		setvar $bot~command_lines[$user_interface~b][7] $bot~command_lines[$user_interface~b][6]
		setvar $bot~command_lines[$user_interface~b][6] $bot~command_lines[$user_interface~b][5]
		setvar $bot~command_lines[$user_interface~b][5] $bot~command_lines[$user_interface~b][4]
		setvar $bot~command_lines[$user_interface~b][4] $bot~command_lines[$user_interface~b][3]
		setvar $bot~command_lines[$user_interface~b][3] $bot~command_lines[$user_interface~b][2]
		setvar $bot~command_lines[$user_interface~b][2] $bot~command_lines[$user_interface~b][1]
		setvar $bot~command_lines[$user_interface~b][1] "upgrade"
		setvar $bot~command_lines[$user_interface~b] $bot~command_lines[$user_interface~b][1]&" "&$bot~command_lines[$user_interface~b][2]&" "&$bot~command_lines[$user_interface~b][3]&" "&$bot~command_lines[$user_interface~b][4]&" "&$bot~command_lines[$user_interface~b][5]&" "&$bot~command_lines[$user_interface~b][6]&" "&$bot~command_lines[$user_interface~b][7]&" "&$bot~command_lines[$user_interface~b][8]&" "
	end
	if (($bot~command_lines[$user_interface~b][9] = "f") or ($bot~command_lines[$user_interface~b][9] = "fde") or ($bot~command_lines[$user_interface~b][9] = "ufde") or ($bot~command_lines[$user_interface~b][9] = "nf") or ($bot~command_lines[$user_interface~b][9] = "uf") or ($bot~command_lines[$user_interface~b][9] = "de") or ($bot~command_lines[$user_interface~b][9] = "fp") or ($bot~command_lines[$user_interface~b][9] = "fup") or ($bot~command_lines[$user_interface~b][9] = "nfup"))
		setvar $user_interface~use_word_eight_remainder true
		setvar $bot~command_lines[$user_interface~b][8] $bot~command_lines[$user_interface~b][7]
		setvar $bot~command_lines[$user_interface~b][7] $bot~command_lines[$user_interface~b][6]
		setvar $bot~command_lines[$user_interface~b][6] $bot~command_lines[$user_interface~b][5]
		setvar $bot~command_lines[$user_interface~b][5] $bot~command_lines[$user_interface~b][4]
		setvar $bot~command_lines[$user_interface~b][4] $bot~command_lines[$user_interface~b][3]
		setvar $bot~command_lines[$user_interface~b][3] $bot~command_lines[$user_interface~b][2]
		setvar $bot~command_lines[$user_interface~b][2] $bot~command_lines[$user_interface~b][1]
		setvar $bot~command_lines[$user_interface~b][1] $bot~command_lines[$user_interface~b][9]
		setvar $bot~command_lines[$user_interface~b][9] "find"
		setvar $bot~command_lines[$user_interface~b] $bot~command_lines[$user_interface~b][1]&" "&$bot~command_lines[$user_interface~b][2]&" "&$bot~command_lines[$user_interface~b][3]&" "&$bot~command_lines[$user_interface~b][4]&" "&$bot~command_lines[$user_interface~b][5]&" "&$bot~command_lines[$user_interface~b][6]&" "&$bot~command_lines[$user_interface~b][7]&" "&$bot~command_lines[$user_interface~b][8]&" "
	end
	setvar $user_interface~append_remainder $user_interface~command_remainders[$user_interface~b]
	if ($user_interface~use_word_eight_remainder = true)
		setvar $user_interface~append_remainder $user_interface~command_remainders_from_eight[$user_interface~b]
	end
	getword " "&$bot~command_lines[$user_interface~b]&" " $user_interface~ninth_word 9 ""
	if (($user_interface~ninth_word = "") and ($user_interface~append_remainder <> ""))
		setvar $bot~command_lines[$user_interface~b] $bot~command_lines[$user_interface~b]&$user_interface~append_remainder&" "
	end
	setvar $user_interface~i 1
	while ($user_interface~i <= 8)
		if ($bot~command_lines[$user_interface~b][$user_interface~i] = "s")
			setvar $bot~command_lines[$user_interface~b][$user_interface~i] $map~stardock
		elseif ($bot~command_lines[$user_interface~b][$user_interface~i] = "r")
			setvar $bot~command_lines[$user_interface~b][$user_interface~i] $map~rylos
		elseif ($bot~command_lines[$user_interface~b][$user_interface~i] = "a")
			setvar $bot~command_lines[$user_interface~b][$user_interface~i] $map~alpha_centauri
		elseif ($bot~command_lines[$user_interface~b][$user_interface~i] = "h")
			setvar $bot~command_lines[$user_interface~b][$user_interface~i] $map~home_sector
		elseif ($bot~command_lines[$user_interface~b][$user_interface~i] = "b")
			setvar $bot~command_lines[$user_interface~b][$user_interface~i] $map~backdoor
		elseif ($bot~command_lines[$user_interface~b][$user_interface~i] = "x")
			setvar $bot~command_lines[$user_interface~b][$user_interface~i] $bot~safe_ship
		elseif ($bot~command_lines[$user_interface~b][$user_interface~i] = "l")
			if (($bot~safe_planet <> "") and ($bot~safe_planet <> 0))
				getsectorparameter $bot~safe_planet "PSECTOR" $user_interface~check
				setvar $bot~command_lines[$user_interface~b][$user_interface~i] $user_interface~check
			end
		end
		add $user_interface~i 1
	end
	setvar $user_interface~travelcommands "mow twarp bwarp pwarp smow m t b p "

	getwordpos $user_interface~travelcommands $user_interface~pos $bot~command_lines[$user_interface~b][9]
	if ($user_interface~pos > 0)
		getwordpos " "&$bot~command_lines[$user_interface~b]&" " $user_interface~pos " planet "
		if ($user_interface~pos > 0)
			if ($bot~command_lines[$user_interface~b][1] = "planet")
				setvar $bot~command_lines[$user_interface~b][1] $bot~command_lines[$user_interface~b][2]

				getsectorparameter $bot~command_lines[$user_interface~b][1] "PSECTOR" $bot~command_lines[$user_interface~b][1]
			end
			setvar $user_interface~i 1
			while ($user_interface~i <= $bot~parms)
				if ($bot~command_lines[$user_interface~b][$user_interface~i] = "planet")
					setvar $user_interface~old_value $bot~command_lines[$user_interface~b][1]
					setvar $bot~command_lines[$user_interface~b][$user_interface~i] ""
					setvar $bot~command_lines[$user_interface~b][2] $bot~command_lines[$user_interface~b][1]
					getsectorparameter $bot~command_lines[$user_interface~b][1] "PSECTOR" $bot~command_lines[$user_interface~b][1]
				end
				add $user_interface~i 1
			end
		end
	end

	setvar $bot~parm1 $bot~command_lines[$user_interface~b][1]
	setvar $bot~parm2 $bot~command_lines[$user_interface~b][2]
	setvar $bot~parm3 $bot~command_lines[$user_interface~b][3]
	setvar $bot~parm4 $bot~command_lines[$user_interface~b][4]
	setvar $bot~parm5 $bot~command_lines[$user_interface~b][5]
	setvar $bot~parm6 $bot~command_lines[$user_interface~b][6]
	setvar $bot~parm7 $bot~command_lines[$user_interface~b][7]
	setvar $bot~parm8 $bot~command_lines[$user_interface~b][8]
	if ($bot~command_lines[$user_interface~b][9] = 0)
		loadvar $player~current_sector
		if (($player~current_sector = 0) or ($player~current_sector = ""))
			gosub :player~quikstats
		end
		send "'["&$bot~mode&"] ["&$player~current_sector&"] {"&$switchboard~bot_name&"} - You are logged into this bot.  Use "&$switchboard~bot_name&" help for commands.*"
		goto :bot~wait_for_command
	end
	getwordpos " "&$bot~command_lines[$user_interface~b]&" " $user_interface~stopcheck " off "
	gosub :formatcommand
	gosub :findcommand
	if ($user_interface~currentcategory = "Modes")
		if ($user_interface~stopcheck > 0)
			killtrigger shutdownthemodule
			stop $bot~last_loaded_module
			setvar $bot~mode "General"
			savevar $bot~mode
			setvar $switchboard~message ""&$user_interface~formatted_command&" mode is now off.*"
			gosub :switchboard~switchboard
			goto :bot~wait_for_command
		end
	end
	setvar $user_interface~isfound false
	if (($user_interface~doesexist > 0) or ($user_interface~doesexisthidden > 0))
		setvar $user_interface~isfound true
		gosub :load_the_module
		if ($user_interface~b < $bot~command_lines)

			killtrigger loadended
			seteventtrigger loadended :loadended "SCRIPT STOPPED" $user_interface~loaded
			pause

			:user_interface~loadended
			if ($user_interface~currentcategory = "Modes")
				setvar $bot~mode "General"
				savevar $bot~mode
			end
		else
			goto :bot~wait_for_command
		end
	else
		getwordpos $bot~internalcommandlist&$bot~doubledcommandlist $user_interface~pos " "&$bot~command_lines[$user_interface~b][9]&" "
		if ($user_interface~pos > 0)
			setvar $user_interface~isfound true
			gosub :bot~killthetriggers
			gosub ":INTERNAL_COMMANDS~"&$bot~command_lines[$user_interface~b][9]
		end
	end
	if ($user_interface~isfound <> true)
		if ($user_interface~temp_bot_name <> "all")
			setvar $switchboard~message $user_interface~formatted_command&" is not a valid command.*"
			gosub :switchboard~switchboard
		end
	end
	add $user_interface~b 1
end
goto :bot~wait_for_command

:user_interface~resolve_command_alias
fileexists $user_interface~aliases_exist "scripts\"&$bot~mombot_directory&"\aliases.cfg"
if ($user_interface~aliases_exist <> true)
	return
end

readtoarray "scripts\"&$bot~mombot_directory&"\aliases.cfg" $user_interface~alias_lines
setvar $user_interface~alias_pass 1
while ($user_interface~alias_pass <= 5)
	setvar $user_interface~alias_match false
	setvar $user_interface~alias_index 1
	while ($user_interface~alias_index <= $user_interface~alias_lines)
		setvar $user_interface~alias_line $user_interface~alias_lines[$user_interface~alias_index]
		cuttext $user_interface~alias_line&" " $user_interface~alias_first_char 1 1
		if ($user_interface~alias_first_char <> "#")
			getwordpos $user_interface~alias_line $user_interface~alias_eq_pos "="
			if ($user_interface~alias_eq_pos > 1)
				cuttext $user_interface~alias_line $user_interface~alias_name 1 ($user_interface~alias_eq_pos - 1)
				cuttext $user_interface~alias_line $user_interface~alias_target ($user_interface~alias_eq_pos + 1) 9999
				lowercase $user_interface~alias_name
				lowercase $user_interface~alias_target
				setvar $user_interface~alias_names ","&$user_interface~alias_name&","
				striptext $user_interface~alias_names " "
				getwordpos $user_interface~alias_names $user_interface~alias_name_pos ","&$bot~command_lines[$user_interface~b][9]&","
				if ($user_interface~alias_name_pos > 0)
					setvar $bot~command_lines[$user_interface~b][9] $user_interface~alias_target
					setvar $user_interface~alias_match true
					goto :user_interface~next_alias_pass
				end
			end
		end
		add $user_interface~alias_index 1
	end

	if ($user_interface~alias_match <> true)
		return
	end

	:user_interface~next_alias_pass
	add $user_interface~alias_pass 1
end
return

:user_interface~formatcommand
cuttext $bot~command_lines[$user_interface~b][9]&" " $user_interface~firstchar 1 1
cuttext $bot~command_lines[$user_interface~b][9]&" " $user_interface~restofcommand 2 999
uppercase $user_interface~firstchar
setvar $user_interface~formatted_command $user_interface~firstchar&$user_interface~restofcommand
striptext $user_interface~formatted_command " "
return

:user_interface~findcommand
setvar $bot~modulecategory ""
gosub :user_interface~check_preload
if ($user_interface~doesexisthidden)
	return
end
setvar $user_interface~i 1
while ($user_interface~i <= 3)
	setvar $user_interface~j 1
	while ($user_interface~j <= 7)
		if ($user_interface~i = 3)
			fileexists $user_interface~doesexist "scripts\"&$bot~mombot_directory&"\"&$bot~catagories[$user_interface~i]&"\"&$bot~command_lines[$user_interface~b][9]&".cts"
			fileexists $user_interface~doesexisthidden "scripts\"&$bot~mombot_directory&"\"&$bot~catagories[$user_interface~i]&"\_"&$bot~command_lines[$user_interface~b][9]&".cts"
			if ($user_interface~doesexist or $user_interface~doesexisthidden)
				setvar $user_interface~currentcategory $bot~catagories[$user_interface~i]
				if ($user_interface~doesexisthidden)
					setvar $bot~modulecategory $bot~catagories[$user_interface~i]&"\_"
				else
					setvar $bot~modulecategory $bot~catagories[$user_interface~i]&"\"
				end
				setvar $user_interface~currentlist $bot~internalcommandlist[$user_interface~j]
				return
			end
		else
			fileexists $user_interface~doesexist "scripts\"&$bot~mombot_directory&"\"&$bot~catagories[$user_interface~i]&"\"&$bot~types[$user_interface~j]&"\"&$bot~command_lines[$user_interface~b][9]&".cts"
			fileexists $user_interface~doesexisthidden "scripts\"&$bot~mombot_directory&"\"&$bot~catagories[$user_interface~i]&"\"&$bot~types[$user_interface~j]&"\_"&$bot~command_lines[$user_interface~b][9]&".cts"
			if ($user_interface~doesexist or $user_interface~doesexisthidden)
				setvar $user_interface~currentcategory $bot~catagories[$user_interface~i]
				if ($user_interface~doesexisthidden)
					setvar $bot~modulecategory $bot~catagories[$user_interface~i]&"\"&$bot~types[$user_interface~j]&"\_"
				else
					setvar $bot~modulecategory $bot~catagories[$user_interface~i]&"\"&$bot~types[$user_interface~j]&"\"
				end
				setvar $user_interface~currentlist $bot~internalcommandlist[$user_interface~j]
				return
			end
		end
		add $user_interface~j 1
	end
	add $user_interface~i 1
end
return

:user_interface~check_preload
setvar $user_interface~doesexist 0
setvar $user_interface~doesexisthidden 0
fileexists $user_interface~doesexisthidden "scripts\"&$bot~mombot_directory&"\preload\_"&$bot~command_lines[$user_interface~b][9]&".cts"
if ($user_interface~doesexisthidden <> true)
	return
end

setvar $bot~modulecategory "preload\_"
if ($bot~command_lines[$user_interface~b][9] = "ldrop")
	setvar $user_interface~currentcategory "Modes"
	setvar $user_interface~currentlist $bot~internalcommandlist[6]
elseif ($bot~command_lines[$user_interface~b][9] = "macro_kit")
	setvar $user_interface~currentcategory "Commands"
	setvar $user_interface~currentlist $bot~internalcommandlist[3]
elseif ($bot~command_lines[$user_interface~b][9] = "dock_shopper")
	setvar $user_interface~currentcategory "Commands"
	setvar $user_interface~currentlist $bot~internalcommandlist[7]
elseif ($bot~command_lines[$user_interface~b][9] = "kazi")
	setvar $user_interface~currentcategory "Commands"
	setvar $user_interface~currentlist $bot~internalcommandlist[6]
else
	setvar $user_interface~currentcategory "Commands"
	setvar $user_interface~currentlist ""
end
return

:user_interface~run_module
gosub :load_the_module
goto :bot~wait_for_command

:user_interface~load_the_module
setvar $bot~user_command_line $bot~command_lines[$user_interface~b]
setvar $bot~command $bot~command_lines[$user_interface~b][9]
setvar $bot~command_typed $user_interface~typed_commands[$user_interface~b]
setvar $bot~parm1 $bot~command_lines[$user_interface~b][1]
setvar $bot~parm2 $bot~command_lines[$user_interface~b][2]
setvar $bot~parm3 $bot~command_lines[$user_interface~b][3]
setvar $bot~parm4 $bot~command_lines[$user_interface~b][4]
setvar $bot~parm5 $bot~command_lines[$user_interface~b][5]
setvar $bot~parm6 $bot~command_lines[$user_interface~b][6]
setvar $bot~parm7 $bot~command_lines[$user_interface~b][7]
setvar $bot~parm8 $bot~command_lines[$user_interface~b][8]
gosub :bot~backwards_compatible
getwordpos " "&$bot~command_lines[$user_interface~b]&" " $user_interface~helpcheck " help "
getwordpos " "&$bot~command_lines[$user_interface~b]&" " $user_interface~helpcheck2 " ? "
if (($user_interface~currentcategory = "Modes") and (($user_interface~helpcheck <= 0) and ($user_interface~helpcheck2 <= 0)))
	stop $bot~last_loaded_module
	setvar $bot~last_loaded_module "scripts\"&$bot~mombot_directory&"\"&$bot~modulecategory&$bot~command_lines[$user_interface~b][9]&".cts"
	setvar $bot~mode $user_interface~formatted_command
	savevar $bot~mode
	savevar $bot~last_loaded_module
end
setvar $user_interface~loaded "scripts\"&$bot~mombot_directory&"\"&$bot~modulecategory&$bot~command_lines[$user_interface~b][9]&".cts"
stop $user_interface~loaded
load $user_interface~loaded
return

:user_interface~hotkey_access
gosub :bot~bigdelay_killthetriggers
setvar $switchboard~self_command true
setvar $user_interface~b 1
setvar $bot~command_lines[$user_interface~b][9] ""
setvar $user_interface~invalid false
setvar $bot~parm1 ""
setvar $bot~parm2 ""
setvar $bot~parm3 ""
setvar $bot~parm4 ""
setvar $bot~parm5 ""
setvar $bot~parm6 ""
setvar $bot~parm7 ""
setvar $bot~parm8 ""

echo #27 "[1A" #27 "[K" ansi_15 "**Hotkey" ansi_4
getconsoleinput $user_interface~tempcharacter singlekey

:user_interface~checkhotkey
getcharcode $user_interface~tempcharacter $user_interface~charcode
gosub :bot~killthetriggers
if ($user_interface~charcode <= 0)
	echo #27 "[10D          " #27 "[10D"
	goto :bot~wait_for_command
end
setvar $user_interface~temp $bot~hotkeys[$user_interface~charcode]
if (($user_interface~temp <> 0) and ($user_interface~temp <> ""))
	setvar $bot~command_lines[$user_interface~b][9] $bot~custom_commands[$user_interface~temp]
else
	setvar $user_interface~invalid true
end
cuttext $bot~command_lines[$user_interface~b][9]&"  " $user_interface~test 1 1
if ($user_interface~charcode = 48)
	setvar $user_interface~i 10
	goto :runhotscript
elseif ($user_interface~charcode = 63)
	setvar $bot~command_lines[$user_interface~b] "help"
	goto :runusercommandline
elseif (($user_interface~charcode >= 49) and ($user_interface~charcode <= 57))
	setvar $user_interface~i ($user_interface~charcode - 48)
	goto :runhotscript
elseif (($user_interface~test = ":") and ($user_interface~invalid = false))
	goto $bot~command_lines[$user_interface~b][9]
elseif ($user_interface~invalid = false)
	setvar $bot~command_lines[$user_interface~b] $bot~command_lines[$user_interface~b][9]
	goto :runusercommandline
end
echo #27 "[10D          " #27 "[10D"
goto :bot~wait_for_command

:user_interface~script_access
gosub :bot~killthetriggers
setvar $user_interface~i 1
echo #27 "[3A" #27 "[K*" #27 "[K*" #27 "[K*" ansi_14 "*Which script to run?                      *----------------------------------"
while (($user_interface~i <= $bot~hotkey_scripts) and ($user_interface~i <= 10))
	if ($bot~hotkey_scripts[$user_interface~i] <> 0)
		if ($user_interface~i >= 10)
			settextouttrigger "key"&$user_interface~i :triggerhotscript 0
			echo "*"&ansi_15&0&ansi_14&") "&ansi_15&$bot~hotkey_scripts[$user_interface~i][1]
		else
			settextouttrigger "key"&$user_interface~i :triggerhotscript $user_interface~i
			echo "*"&ansi_15&$user_interface~i&ansi_14&") "&ansi_15&$bot~hotkey_scripts[$user_interface~i][1]
		end
	end
	add $user_interface~i 1
end
settextouttrigger echohelp2 :script_access #63
setdelaytrigger notfastenough2 :donescripts 9000
settextouttrigger noneavail2 :donescripts
echo #27 "[1A" #27 "[K" ansi_14 "***Scripts" ansi_15 ">" ansi_7
pause

:user_interface~donescripts
echo #27 "[10D          " #27 "[10D"
goto :bot~wait_for_command

:user_interface~triggerhotscript
getouttext $user_interface~i
if ($user_interface~i = 0)
	setvar $user_interface~i 10
end

:user_interface~runhotscript
load $bot~hotkey_scripts[$user_interface~i]
getwordpos $bot~hotkey_scripts[$user_interface~i] $user_interface~pos "scripts/"
if ($user_interface~pos > 0)
	fileexists $user_interface~chk $bot~hotkey_scripts[$user_interface~i]
else
	fileexists $user_interface~chk "scripts/"&$bot~hotkey_scripts[$user_interface~i]
end
if ($user_interface~chk <> true)
	echo ansi_4&"*"&$bot~hotkey_scripts[$user_interface~i]&" does not exist in specified location.  Please check your "&$bot~script_file&" file to make sure it is correct.*"&ansi_7
end
goto :bot~wait_for_command

:user_interface~verify_user_status
setvar $user_interface~i 1
lowercase $user_interface~user_name
while ($user_interface~i <= $bot~corpycount)
	cuttext $bot~corpy[$user_interface~i] $user_interface~name 1 6
	setvar $user_interface~unstripped_name $user_interface~name
	lowercase $user_interface~name
	trim $user_interface~user_name
	trim $user_interface~name
	if ($user_interface~user_name = $user_interface~name)
		setvar $bot~command_caller $user_interface~unstripped_name
		savevar $bot~command_caller
		setvar $user_interface~authorization 1
		return
	end
	add $user_interface~i 1
end
return

:user_interface~chk_login
if ($user_interface~loggedin[$user_interface~user_name] = 1)
	setvar $user_interface~logged 1
else
	setvar $user_interface~logged 0
end
return

:bigdelay_killthetriggers
killalltriggers
setdelaytrigger unfreezingtriggerbigdelay :unfreezebot 1800000
return

:unfreezebot
echo "*Bot timed out, unfreezing..*"
setdeafclients false
setvar $switchboard~message "Bot frozen for over 100 seconds, resetting...*"
gosub :switchboard~switchboard
goto :bot~wait_for_command

include "source\include\internal_commands"
include "source\include\move"
include "source\include\bot"
