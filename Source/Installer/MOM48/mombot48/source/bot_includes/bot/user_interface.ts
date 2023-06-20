:check_routing_all
	setVar $temp_bot_name "all"
	goto :do_routing
:check_routing_team
	setVar $temp_bot_name $BOT~bot_team_name
	goto :do_routing
:check_routing
	setVar $temp_bot_name $SWITCHBOARD~bot_name

:do_routing
	setVar $currentline CURRENTLINE
	setVar $currentansiline CURRENTANSILINE
	gosub :BOT~killthetriggers
	getWord CURRENTLINE $routing 1
	if ($routing = "'" & $temp_bot_name) 
		goto :own_command
	elseif ($routing = "R")
		goto :command
	elseif ($routing = "P")
		goto :page_command
	else
		goto :BOT~wait_for_command
	end

	:own_command
		cutText $CURRENTANSILINE $ansi_ck1 1 1
		if ($ansi_ck1 <> "")
			goto :BOT~wait_for_command
		end
		getWord $CURRENTLINE $radio_type 1
		stripText $radio_type $temp_bot_name
		setvar $bot~user_command_line $CURRENTLINE
		setVar $bot~user_command_line $bot~user_command_line&"              "
		lowercase $bot~command_lines[$b]
		if ($radio_type = "'")
			getLength "'"&$temp_bot_name&" " $length
			cutText $bot~user_command_line $bot~user_command_line $length+1 9999
			setVar $user_sec_level 9
			getWord $CURRENTLINE $bot~command 2
			getWordPos $bot~command $pos "'"
			getWordPos $bot~command $pos2 "`"
			if ($pos = 1) OR ($pos2 = 1)
				goto :BOT~wait_for_command
			end
			setvar $bot~command_caller "self"
			savevar $bot~command_caller
			getwordpos $bot~user_command_line $pos "|"
			if ($pos > 0)
				savevar $switchboard~self_command
				saveVar $BOT~user_command_line
				load "scripts\"&$bot~mombot_directory&"\commands\general\run.cts"
				goto :BOT~wait_for_command
			end
			gosub :check_for_multi_commands
			goto :command_processing
		else
			goto :BOT~wait_for_command
		end

	:command
		setVar $ansi_line $currentansiline
		getWordPos $ansi_line $pos "[36mR"
		getwordPos $ansi_line $pos2 "[0;36mR"
		if (($pos <= 0) and ($pos2 <= 0))
			goto :BOT~wait_for_command
		end
		cutText $currentline $user_name 3 6

		gosub :verify_user_status
		if ($authorization = 0)
			goto :BOT~wait_for_command
		end

		cutText $currentline $bot~user_command_line 10 999
		getWord $bot~user_command_line $botname_chk 1
		if ($botname_chk <> $temp_bot_name)
			goto :BOT~wait_for_command
		end
		getLength $temp_bot_name&" " $length
		cutText $bot~user_command_line&"          " $bot~user_command_line $length+1 9999
		setVar $bot~user_command_line $bot~user_command_line&"              "
		getWord $bot~user_command_line $bot~command 1
		if (($bot~command = "bot") OR ($bot~command = "relog"))
			goto :bot~wait_for_command
		end
		getwordpos $bot~user_command_line $pos "|"
		if ($pos > 0)
			savevar $switchboard~self_command
			saveVar $BOT~user_command_line
			load "scripts\"&$bot~mombot_directory&"\commands\general\run.cts"
			goto :BOT~wait_for_command
		end
		gosub :check_for_multi_commands
		goto :command_processing

	:page_command
		cutText $currentline $user_name 3 6
		cutText $currentline $bot~user_command_line 10 999
		getWordPos $bot~user_command_line $pos $SWITCHBOARD~bot_name & ":" & $BOT~bot_password & ":" & $BOT~subspace
		if ($pos > 0)
			add $BOT~corpycount 1
			setVar $BOT~corpy[$BOT~corpycount] $user_name
			setVar $loggedin[$user_name] 1
			send "'{" $SWITCHBOARD~bot_name "} - User Verified - " $user_name "*"
		else
			gosub :verify_user_status
			if ($authorization = 0)
				echo "*"&ANSI_14&"["&ANSI_15&"Bad attempt to control bot through private message."&ANSI_14&"]*"
				goto :BOT~wait_for_command
			end
			getWord $bot~user_command_line $botname_chk 1
			if ($botname_chk <> $temp_bot_name)
				goto :BOT~wait_for_command
			end
			getLength $temp_bot_name & " " $length
			cutText $bot~user_command_line & "          " $bot~user_command_line $length+1 9999
			lowerCase $bot~user_command_line
			setVar $bot~user_command_line $bot~user_command_line & "              "
			getWord $bot~user_command_line $bot~command 1
			if (($bot~command = "bot") OR ($bot~command = "relog"))
				goto :BOT~wait_for_command
			end
			getwordpos $bot~user_command_line $pos "|"
			if ($pos > 0)
				savevar $switchboard~self_command
				saveVar $BOT~user_command_line
				load "scripts\"&$bot~mombot_directory&"\commands\general\run.cts"
				goto :BOT~wait_for_command
			end
			gosub :check_for_multi_commands
			goto :command_processing            
		end
		goto :BOT~wait_for_command
# ============================== END COMMAND ROUTING SUB ==============================

#============================== SELF CONTROL ==============================
:User_Access
	gosub :BOT~bigdelay_killthetriggers
	gosub :selfCommandPrompt
	setvar $bot~command_caller "self"
	savevar $bot~command_caller
	lowercase $bot~user_command_line
	if ($bot~user_command_line = "")
		echo CURRENTANSILINE
		goto :BOT~wait_for_command
	end
	setVar $SWITCHBOARD~self_command TRUE
	getwordpos $bot~user_command_line $pos "|"
	if ($pos > 0)
		savevar $switchboard~self_command
		saveVar $BOT~user_command_line
		load "scripts\"&$bot~mombot_directory&"\commands\general\run.cts"
		goto :BOT~wait_for_command
	end
	:runUserCommandLine
		setVar $bot~user_command_line $bot~user_command_line&"              "
		setVar $authorization 9
		setVar $user_sec_level 9

		gosub :check_for_multi_commands

		goto :command_processing
#============================== END SELF CONTROL SUB ==============================
:check_for_multi_commands
	######################################################
	# $bot~command_lines[1]     - bot~user_command_line  #
	# $bot~command_lines[1][1]  - bot~parm1              #
	# $bot~command_lines[1][2]  - bot~parm2              #
	# $bot~command_lines[1][3]  - bot~parm3              #
	# $bot~command_lines[1][4]  - bot~parm4              #
	# $bot~command_lines[1][5]  - bot~parm5              #
	# $bot~command_lines[1][6]  - bot~parm6              #
	# $bot~command_lines[1][7]  - bot~parm7              #
	# $bot~command_lines[1][8]  - bot~parm8              #
	# $bot~command_lines[1][9]  - bot~command            #
	# $bot~command_lines[1][10] - not sure yet           #
	######################################################

	setarray $bot~command_lines 10 10
	getwordpos $bot~user_command_line $pos "|"
	if ($pos > 0)
		# multi commands given #
		splittext $bot~user_command_line $bot~commands "|"
		setvar $b 1
		setvar $bot~command_lines 0
		while ($b <= $bot~commands)
			getWord $BOT~commands[$b] $bot~command_lines[$b][9] 1
			getLength $bot~command_lines[$b][9]&" " $BOT~commandLength
			getWordPos $bot~command_lines[$b][9] $pos "'"
			getWordPos $bot~command_lines[$b][9] $pos2 "`"
			if ($pos <> 1) AND ($pos2 <> 1)
				cutText $BOT~commands[$b]&"    " $BOT~commands[$b] $BOT~commandLength+1 9999
			end
			setvar $bot~command_lines[$b] $bot~commands[$b]
			setvar $bot~command_lines[$b][9] $bot~command_lines[$b][9]

			setvar $bot~command_lines[$b] $bot~commands[$b]
			gosub :getParameters
			add $bot~command_lines 1
			add $b 1
		end			
	else
		setarray $bot~command_lines 1
		setvar $bot~command_lines 1
		setvar $bot~command_lines[1] $bot~user_command_line
		getWord $bot~command_lines[1] $bot~command_lines[1][9] 1
		getLength $bot~command_lines[1][9]&" " $BOT~commandLength
		getWordPos $bot~command_lines[1][9] $pos "'"
		getWordPos $bot~command_lines[1][9] $pos2 "`"
		if ($pos <> 1) AND ($pos2 <> 1)
			cutText $bot~command_lines[1]&"    " $bot~command_lines[1] $BOT~commandLength+1 9999
		end
		setvar $b 1
		gosub :getParameters
	end

return

:getParameters
	##############################################
	# $bot~command_lines[$b] is bot~user_command_line #
	##############################################
	setvar $test_value 0
	setVar $i 1
	while ($test_value <> "")
		getWord (" " & $bot~command_lines[$b] & " ") $test_value $i ""
		getWordPos " "&$test_value&" " $posThousands "k "
		getWordPos " "&$test_value&" " $posMillions "m "
		getWordPos " "&$test_value&" " $posBillions "b "
		if (($posMillions > 0) or ($posThousands > 0) or ($posBillions > 0))
			replaceText $test_value "k" ""
			replaceText $test_value "m" ""
			replaceText $test_value "b" ""
			trim $test_value
			isNumber $is_a_number $test_value
			if ($is_a_number = true)
				if ($test_value <> 0)
					replaceText $bot~command_lines[$b] $test_value&"k" $test_value&"000"
					replaceText $bot~command_lines[$b] $test_value&"m" $test_value&"000000"
					replaceText $bot~command_lines[$b] $test_value&"b" $test_value&"000000000"
				end
			end
		end
		add $i 1
	end

	setVar $i 1
	while ($i <= 8)
		getWord (" " & $bot~command_lines[$b] & " ") $bot~command_lines[$b][$i] $i ""
		add $i 1
	end
return
# ======================     START SELF COMMAND PROMPT SUBROUTINE    ==========================
:selfCommandPrompt
	loadVar $BOT~historyString
	setVar $BOT~historyCount 0
	getWordPos $BOT~historyString $pos "<<|HS|>>"
	while (($pos > 0) AND ($BOT~historyCount < $BOT~historyMax))
		cutText $BOT~historyString $archive 1 ($pos-1)
		replaceText $BOT~historyString $archive&"<<|HS|>>" "" 
		setVar $BOT~history[($BOT~historyCount+1)] $archive
		add $BOT~historyCount 1
		getWordPos $BOT~historyString $pos "<<|HS|>>"
	end
	gosub :BOT~bigdelay_killthetriggers
	setVar $prompt ANSI_10&#27&"[255D"&#27&"[255B"&#27&"[K"&ANSI_4&"{"&ANSI_14&$BOT~mode&ANSI_4&"}"&ANSI_15&" "&$SWITCHBOARD~bot_name&ANSI_2&">"&ANSI_7
	echo $prompt
	:getInput
		setVar $BOT~promptOutput ""
		killTrigger             text
		killtrigger             reecho
		killtrigger             keepalive
		setTextOutTrigger       text                    :getCharacter
		setDelayTrigger         keepalive               :CONNECTIVITY~keepalive           30000
		settexttrigger          reecho                  :reEcho
		pause
	:getCharacter
		getOutText $character
		setvar $found_enter_key false
		if ($character = #13)
			gosub :do_enter_key
			goto :doneSelfCommandPrompt
		end
		if (($character = ">") AND ($BOT~charCount <= 0))
			:cleargridprompt
			loadvar $planet~planet
			gosub :BOT~bigdelay_killthetriggers
			gosub :PLAYER~quikstats
			setTextOutTrigger       text                    :getCharacter
			setDelayTrigger         keepalive               :CONNECTIVITY~keepalive           30000
			settexttrigger          reecho                  :reEcho
			setDelayTrigger     griddelay               :grid_menu_continue           30
			pause
			:grid_menu_continue
			Echo #27 & "[2J"
			Echo "**"
			:gridprompt
				setDelayTrigger     griddelay2               :grid_menu_continue2           50
				pause
				:grid_menu_continue2
				gosub :BOT~bigdelay_killthetriggers
				setVar $doHolo FALSE
				setVar $doDens FALSE
				#echo ANSI_10&#27&"[255D"&#27&"[255B"&#27&"[K"
				gosub :MAP~displayAdjacentGridAnsi
				setVar $gridprompt ANSI_10&#27&"[255D"&#27&"[255B"&#27&"[K"&ANSI_4&"{"&ANSI_14&"Grid Menu - ["&ANSI_15&"H"&ANSI_14&"]olo ["&ANSI_15&"D"&ANSI_14&"]ens ["&ANSI_15&"S"&ANSI_14&"]urround "
				if ($PLAYER~PHOTONS > 0)
					setVar $gridPrompt $gridPrompt&"["&ANSI_15&">"&ANSI_14&"] Photon "
				end
				if ($PLAYER~CURRENT_PROMPT = "Citadel")
					setVar $gridprompt $gridprompt&"["&ANSI_15&"+"&ANSI_14&"]["&ANSI_15&$BOT~pgrid_type&ANSI_14&"] ["&ANSI_15&"1"&ANSI_14&"-"&ANSI_15&$MAP~gridWarpCount&ANSI_14&"]"&ANSI_4&"}"&ANSI_14&ANSI_2&">"&ANSI_7&" "
				elseif ($PLAYER~CURRENT_PROMPT = "Command")
					setVar $gridprompt $gridprompt&"["&ANSI_15&"1"&ANSI_14&"-"&ANSI_15&$MAP~gridWarpCount&ANSI_14&"]"&ANSI_4&"}"&ANSI_14&" Move"&ANSI_4&"}"&ANSI_2&">"&ANSI_7
				else
					echo ANSI_12&"*Wrong prompt for Grid Menu*"
					goto :donegriddingprompt
				end
				echo $gridprompt
				gosub :BOT~bigdelay_killthetriggers
				settexttrigger reEchogridmenu :reEchogridmenu
				setTextOutTrigger text0 :gridprompt "?"
				if ($PLAYER~PHOTONS > 0)
					setTextOutTrigger text12 :photonprompt ">"
				end
				setDelayTrigger keepalive   :CONNECTIVITY~keepalive  30000
				setVar $i 1
				while ($i <= $MAP~gridWarpCount)
					setTextOutTrigger "grid_map"&$i :visitSectorPgrid $i
					add $i 1
				end
				setTextOutTrigger text7  :hologrid #72
				setTextOutTrigger text8  :hologrid #104
				setTextOutTrigger text13 :hologrid "h"
				setTextOutTrigger text14 :hologrid "H"
				setTextOutTrigger text20 :surroundgrid #115
				setTextOutTrigger text16 :surroundgrid #83
				setTextOutTrigger text17 :surroundgrid "s"
				setTextOutTrigger text18 :surroundgrid "S"
				setTextOutTrigger text9  :densgrid #68
				setTextOutTrigger text10 :densgrid #100
				if ($PLAYER~CURRENT_PROMPT = "Citadel")
					setTextOutTrigger text15 :changePgridType "+"
				end
				setTextOutTrigger text11 :donegriddingprompt
				pause
			:photonprompt
				setDelayTrigger     photondelay               :photon_menu_continue           50
				pause
				:photon_menu_continue
				gosub :BOT~bigdelay_killthetriggers
				Echo #27 & "[2J"
				Echo "**"
				echo ANSI_10&#27&"[255D"&#27&"[255B"&#27&"[K"
				echo ANSI_7&"               -----------------------------------*"
				echo ANSI_7&"               | "&ANSI_4&"PHOTON "&ANSI_15&"armed and ready to fire! "&ANSI_7&"|*"
				echo ANSI_7&"               -----------------------------------*"
				gosub :MAP~displayAdjacentGridAnsi
				setVar $gridprompt ANSI_10&#27&"[255D"&#27&"[255B"&#27&"[K"&ANSI_4&"{"&ANSI_14&"Photon Menu - ["&ANSI_15&"H"&ANSI_14&"]olo ["&ANSI_15&"D"&ANSI_14&"]ens "
				if ($PLAYER~CURRENT_PROMPT = "Citadel")
					setVar $gridprompt $gridprompt&"["&ANSI_12&"1"&ANSI_14&"-"&ANSI_12&$MAP~gridWarpCount&ANSI_14&"]"&ANSI_4&"}"&ANSI_14&ANSI_2&">"&ANSI_7&" "
				elseif ($PLAYER~CURRENT_PROMPT = "Command")
					setVar $gridprompt $gridprompt&"["&ANSI_15&"1"&ANSI_14&"-"&ANSI_15&$MAP~gridWarpCount&ANSI_14&"]"&ANSI_4&"}"&ANSI_4&"}"&ANSI_2&">"&ANSI_7
				else
					echo ANSI_12&"*Wrong prompt for Photon Menu*"
					goto :donegriddingprompt
				end
				echo $gridprompt
				gosub :BOT~bigdelay_killthetriggers
				settexttrigger reEchogridmenu :reEchogridmenu
				setTextOutTrigger text0 :photonprompt "?"
				setTextOutTrigger text12 :cleargridprompt ">"
				setDelayTrigger keepalive   :CONNECTIVITY~keepalive  30000
				setVar $i 1
				while ($i <= $MAP~gridWarpCount)
					setTextOutTrigger "grid_map"&$i :photonSectorPgrid $i
					add $i 1
				end
				setTextOutTrigger text7  :holophoton #72
				setTextOutTrigger text8  :holophoton #104
				setTextOutTrigger text13 :holophoton "h"
				setTextOutTrigger text14 :holophoton "H"
				setTextOutTrigger text9  :densphoton #68
				setTextOutTrigger text10 :densphoton #100
				setTextOutTrigger text11 :donegriddingprompt
				pause

			:surroundgrid
				gosub :BOT~bigdelay_killthetriggers
				
				setVar $bot~command "surround"
				setVar $bot~user_command_line " surround"
				setVar $BOT~parm1 ""
				saveVar $BOT~parm1
				saveVar $bot~command
				saveVar $bot~user_command_line
				load "scripts\"&$bot~mombot_directory&"\commands\grid\surround.cts"
				setEventTrigger		surroundended		:surroundended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\grid\surround.cts"
				pause
				:surroundended
				
				goto :gridprompt
			:holophoton
				setVar $doHolo TRUE
				gosub :doGridScan
				goto :photonprompt
			:densphoton
				setVar $doDens TRUE
				gosub :doGridScan
				goto :photonprompt
			:hologrid
				setVar $doHolo TRUE
				gosub :doGridScan
				goto :gridprompt
			:densgrid
				setVar $doDens TRUE
				gosub :doGridScan
				goto :gridprompt
			:doGridScan
				gosub :BOT~bigdelay_killthetriggers
				if ($PLAYER~CURRENT_PROMPT = "Citadel")
					setVar $scantext "q q z n "
				else
					setVar $scantext ""
				end
				if ($doHolo = TRUE)
					setVar $scantext $scantext&"szhzn* "
				elseif ($doDens = TRUE)
					setVar $scantext $scantext&"sdz* "
				end
				if ($PLAYER~CURRENT_PROMPT = "Citadel")
					setVar $scantext $scantext&"l "&$PLANET~PLANET&"*  c  "
				end
				send $scantext
				if ($PLAYER~CURRENT_PROMPT = "Citadel")
					waitOn "<Enter Citadel>"
				else
					waitOn "["&CURRENTSECTOR&"]"
				end
				return
			:changePgridType
				if ($BOT~pgrid_type = "Normal")
					if ($BOT~safe_ship <= 0)
						setVar $BOT~pgrid_type "Xport (Not Available)"
						setVar $BOT~pgrid_end_command " scan "
					else
						setVar $BOT~pgrid_type "Xport"
						setVar $BOT~pgrid_end_command " x:"&$BOT~safe_ship&" scan "
					end
				elseif (($BOT~pgrid_type = "Xport") OR ($BOT~pgrid_type = "Xport (Not Available)"))
					setVar $BOT~pgrid_type "Retreat"
					setVar $BOT~pgrid_end_command " r scan "
				else
					setVar $BOT~pgrid_type "Normal"
					setVar $BOT~pgrid_end_command " scan "
				end
				goto :gridprompt
			:visitSectorPgrid
				getOutText $sector
				gosub :BOT~bigdelay_killthetriggers
				if (SECTOR.WARPS[CURRENTSECTOR][$sector] > 0)
					if ($PLAYER~CURRENT_PROMPT = "Citadel")
						getSectorParameter SECTOR.WARPS[CURRENTSECTOR][$sector] "FIGSEC" $isFigged
						if ($isFigged)
							setVar $bot~user_command_line "p "&SECTOR.WARPS[CURRENTSECTOR][$sector]&" scan"
							goto :runUserCommandLine
						else				
							if (($BOT~pgrid_bot <> "") and ($BOT~pgrid_bot <> 0))
								send "'" & $BOT~pgrid_bot & " pgrid "&SECTOR.WARPS[CURRENTSECTOR][$sector]&" d:" & SECTOR.DENSITY[SECTOR.WARPS[CURRENTSECTOR][$sector]] &" "&$BOT~pgrid_end_command "**"
							else
								setVar $bot~user_command_line "pgrid "&SECTOR.WARPS[CURRENTSECTOR][$sector]&" "&$BOT~pgrid_end_command
								goto :runUserCommandLine
							end
						end
						
					elseif ($PLAYER~CURRENT_PROMPT = "Command")
						setVar $PLAYER~moveIntoSector SECTOR.WARPS[CURRENTSECTOR][$sector]
						gosub :PLAYER~moveIntoSector
					end
				end
			:donegriddingprompt
				echo #27&"[255D"&#27&"[255B"&#27&"[K"
				setVar $ansi CURRENTANSILINE
				striptext $ansi "Y"
				echo $ansi
				goto :BOT~wait_for_command
			:photonSectorPgrid
				getOutText $sector
				gosub :BOT~bigdelay_killthetriggers
				if (SECTOR.WARPS[CURRENTSECTOR][$sector] > 0)
					setVar $bot~user_command_line "photon "&SECTOR.WARPS[CURRENTSECTOR][$sector]
					goto :runUserCommandLine
				end
				goto :donegriddingprompt
			:nextMenu
				setTextOutTrigger text12 :nextMenu ">"
				pause
			:reechogridmenu
				echo ANSI_10&#27&"[255D"&#27&"[255B"&#27&"[K"&$gridprompt
				settexttrigger reEchogridmenu :reEchogridmenu
				pause
		else
			getLength $character $characterLength
			if (($characterLength > 1) or ($character = #8))
				if ($character = #8)
					if ($BOT~charCount <= 0)
						setVar $BOT~charCount 0
						setVar $BOT~charPos 0
					else
						if ($BOT~charPos >= $BOT~charCount)
							setvar $frontMacro $BOT~promptOutput
							setvar $tailMacro ""
						else
							cuttext $BOT~promptOutput $tailMacro ($BOT~charPos+1) 9999
							cuttext $BOT~promptOutput  $frontMacro 1 ($BOT~charPos)
						end
						getlength $frontMacro $frontLength
						if ($frontLength > 1)
							cuttext $frontMacro $frontMacro 1 ($frontLength - 1)
						else
							setVar $frontMacro ""
						end
						setvar $BOT~promptOutput $frontMacro & $tailMacro
						getlength $BOT~promptOutput $BOT~charCount
						subtract $BOT~charPos 1
						if ($BOT~charPos <= 0)
							setvar $BOT~charPos 0
						end
						if (($BOT~charCount-$BOT~charPos) > 0)
							echo $prompt $BOT~promptOutput #27 "[" ($BOT~charCount-($BOT~charPos)) "D"
						else
							echo $prompt $BOT~promptOutput
						end
					end
				elseif (($character = #27&"[A") OR ($character = #28) OR ($character = (#27&#79&#65)))
					if ($BOT~historyCount > 0)
						if ($BOT~historyIndex <= 0)
							setVar $BOT~currentPromptText $BOT~promptOutput
						end
						add $BOT~historyIndex 1
						if ($BOT~historyIndex > $BOT~historyMax)
							setVar $BOT~historyIndex $BOT~historyMax
						elseif ($BOT~historyIndex > $BOT~historyCount)
							setVar $BOT~historyIndex $BOT~historyCount
						end
						getLength $BOT~history[$BOT~historyIndex] $BOT~charCount
						setVar $BOT~charPos $BOT~charCount
						echo $prompt $BOT~history[$BOT~historyIndex]
						setVar $BOT~promptOutput $BOT~history[$BOT~historyIndex]
					end
				elseif (($character = #27&"[B") OR ($character = #29) OR ($character = (#27&#79&#66)))
					if ($BOT~historyCount > 0)
						if ($BOT~historyIndex <= 0)
							setVar $BOT~currentPromptText $BOT~promptOutput
						end
						subtract $BOT~historyIndex 1
						if ($BOT~historyIndex < 1)
							setVar $BOT~historyIndex 0
							getLength $BOT~currentPromptText $BOT~charCount
							setVar $BOT~charPos $BOT~charCount
							echo $prompt $BOT~currentPromptText
							setVar $BOT~promptOutput $BOT~currentPromptText
						else
							getLength $BOT~history[$BOT~historyIndex] $BOT~charCount
							setVar $BOT~charPos $BOT~charCount
							echo $prompt $BOT~history[$BOT~historyIndex]
							setVar $BOT~promptOutput $BOT~history[$BOT~historyIndex]
						end
					end
				elseif (($character = #27&"[D") OR ($character = #31))
					if ($BOT~charPos > 0)
						subtract $BOT~charPos 1
						echo ANSI_10 $character
					end
				elseif (($character = #27&"[C") OR ($character = #30))
					if ($BOT~charPos <= $BOT~charCount)
						add $BOT~charPos 1
						echo ANSI_10 $character
					end
				else
					getwordpos $character $pos #13
					if ($pos > 0)
						setvar $found_enter_key true
					end
					striptext $character #27&"[A"
					striptext $character #27&"[B"
					striptext $character #27&"[C"
					striptext $character #27&"[D"
					striptext $character #8
					striptext $character #13
					getLength $character $characterLength
					goto :treatAsUsual
				end
			else
				:treatAsUsual
					if ($BOT~charPos >= $BOT~charCount)
						setvar $frontMacro $BOT~promptOutput
						setvar $tailMacro ""&$character&""
					else
						cuttext $BOT~promptOutput $frontMacro 1 ($BOT~charPos)
						cuttext $BOT~promptOutput $tailMacro  ($BOT~charPos+1) ($BOT~charCount - ($BOT~charPos-1))
						setVar $frontMacro $frontMacro&$character
					end
					setvar $BOT~promptOutput $frontMacro&$tailMacro
					getlength $BOT~promptOutput $BOT~charCount
					add $BOT~charPos $characterLength
					if (($BOT~charCount-$BOT~charPos) > 0)
						echo $prompt $BOT~promptOutput #27 "[" ($BOT~charCount-$BOT~charPos+1) "D"
					else
						echo $prompt $BOT~promptOutput
					end
					if ($found_enter_key)
						gosub :do_enter_key
						goto :doneSelfCommandPrompt

					end
			end
		end
		setTextOutTrigger text :getCharacter
		pause
	:reecho
		if (($BOT~charCount-$BOT~charPos) > 0)
			echo $prompt&$BOT~promptOutput&#27&"["&($BOT~charCount-$BOT~charPos+1)&"D"
		else
			echo $prompt&$BOT~promptOutput
		end
		settexttrigger reEcho :reEcho
		pause
	:doneSelfCommandPrompt
	killtrigger text
	killtrigger reecho
return

:do_enter_key
	echo #27&"[255D"&#27&"[255B"&#27&"[K"
	setVar $bot~user_command_line $BOT~promptOutput
	gosub :doAddHistory
return
# ======================     END SELF COMMAND PROMPT SUBROUTINE    ==========================

:doAddHistory
	setVar $BOT~charCount 0
	setVar $BOT~currentPromptText ""
	setVar $BOT~historyIndex 0
	setVar $BOT~charPos 0
	setVar $BOT~promptOutput ""
	setVar $BOT~historyString ""
	cutText $bot~user_command_line&"  " $checkForChat 1 1
	if ($bot~user_command_line <> "")
		add $BOT~historyCount 1
		if ($BOT~historyCount > 1)
			setVar $i $BOT~historyMax
			while ($i > 1)
				setVar  $BOT~history[$i] $BOT~history[($i-1)]
				setVar $BOT~historyString $BOT~history[$i]&"<<|HS|>>"&$BOT~historyString
				subtract $i 1
			end
		end
		#No need to cache fed chat
		if ($checkForChat <> "`")
			setVar $BOT~history[1] $bot~user_command_line
			setVar $BOT~historyString $BOT~history[1]&"<<|HS|>>"&$BOT~historyString
		end
		saveVar $BOT~historyString
	end
return
#========================== COMMAND PROCESSING/EXTERNAL MODULE RUNNING =================
:command_processing
	gosub :BOT~load_watcher_variables
	setvar $b 1
	while ($b <= $bot~command_lines)
		lowercase $bot~command_lines[$b][9]
		:command_filtering
		cutText $bot~command_lines[$b][9]&"  " $checkForChat 1 1
		cutText $bot~command_lines[$b][9]&"  " $checkForFinder 1 1
		if ($checkForChat = "'")
			cutText $bot~command_lines[$b] $bot~command_lines[$b] 2 9999
			setvar $bot~command_lines[$b][9] "ss"
		elseif ($checkForChat = "`")
			cutText $bot~command_lines[$b] $bot~command_lines[$b] 2 9999
			setvar $bot~command_lines[$b][9] "fed"
		end
		if ($bot~command_caller <> "self")
			if (($bot~command_lines[$b][9] = "ss") or ($bot~command_lines[$b][9] = "fed"))
				# no speaking with bot unless it's the bot owner #
				goto :bot~wait_for_command
			end
		end
		saveVar $SWITCHBOARD~self_command
		if ($bot~command_lines[$b][9] = "?")
			setVar $bot~command_lines[$b][9] "help"
		end
		setvar $update_list " limps figs armids cim "
		getwordpos " "&$bot~command_lines[$b]&" " $pos " override "
		getwordpos " "&$bot~command_lines[$b]&" " $pos2 " overide "
		setvar $settings~override false
		if (($pos > 0) or ($pos2 > 0))
			setvar $settings~override true
		end
		savevar $settings~override
		getwordpos $update_list $pos " "&$bot~command_lines[$b][9]&" "
		if ($pos > 0)
			setvar $bot~command_lines[$b][8] $bot~command_lines[$b][9]
			setVar $bot~command_lines[$b][9] "update"
			setvar $bot~command_lines[$b] $bot~command_lines[$b][1]&" "&$bot~command_lines[$b][2]&" "&$bot~command_lines[$b][3]&" "&$bot~command_lines[$b][4]&" "&$bot~command_lines[$b][5]&" "&$bot~command_lines[$b][6]&" "&$bot~command_lines[$b][7]&" "&$bot~command_lines[$b][8]&" "
		end
		setvar $deploy_list " lay put place limp mine armid plimp mines climp cmine pmine topoff mines fig "
		getwordpos $deploy_list $pos " "&$bot~command_lines[$b][9]&" "
		if ($pos > 0)
			if (($bot~command_lines[$b][9] <> "lay") or ($bot~command_lines[$b][9] <> "put") or ($bot~command_lines[$b][9] <> "place"))
				setvar $bot~command_lines[$b][8] $bot~command_lines[$b][9]
			end
			setVar $bot~command_lines[$b][9] "deploy"
			setvar $bot~command_lines[$b] $bot~command_lines[$b][1]&" "&$bot~command_lines[$b][2]&" "&$bot~command_lines[$b][3]&" "&$bot~command_lines[$b][4]&" "&$bot~command_lines[$b][5]&" "&$bot~command_lines[$b][6]&" "&$bot~command_lines[$b][7]&" "&$bot~command_lines[$b][8]&" "
		end
		if ($bot~command_lines[$b][9] = "figmove") or ($bot~command_lines[$b][9] = "movefigs")
			setVar $bot~command_lines[$b][9] "movefig"	
		end
		if ($bot~command_lines[$b][9] = "build") or ($bot~command_lines[$b][9] = "create") or ($bot~command_lines[$b][9] = "make")
			#setVar $bot~command_lines[$b][9] $bot~command_lines[$b][1]
			#setvar $bot~command_lines[$b][1] "create"
			if ($bot~command_lines[$b][1] = "port")
				setVar $bot~command_lines[$b][9] $bot~command_lines[$b][1]
			elseif ($bot~command_lines[$b][1] = "planet")
				setVar $bot~command_lines[$b][9] $bot~command_lines[$b][1]
			else
				setVar $bot~command_lines[$b][9] "port"
			end
			setvar $bot~command_lines[$b][8] $bot~command_lines[$b][7]
			setvar $bot~command_lines[$b][7] $bot~command_lines[$b][6]
			setvar $bot~command_lines[$b][6] $bot~command_lines[$b][5]
			setvar $bot~command_lines[$b][5] $bot~command_lines[$b][4]
			setvar $bot~command_lines[$b][4] $bot~command_lines[$b][3]
			setvar $bot~command_lines[$b][3] $bot~command_lines[$b][2]
			setvar $bot~command_lines[$b][2] $bot~command_lines[$b][1]
			setvar $bot~command_lines[$b][1] "create"
			setvar $bot~command_lines[$b] $bot~command_lines[$b][1]&" "&$bot~command_lines[$b][2]&" "&$bot~command_lines[$b][3]&" "&$bot~command_lines[$b][4]&" "&$bot~command_lines[$b][5]&" "&$bot~command_lines[$b][6]&" "&$bot~command_lines[$b][7]&" "&$bot~command_lines[$b][8]&" "
		end
		if ($bot~command_lines[$b][9] = "kill") or ($bot~command_lines[$b][9] = "destroy") or ($bot~command_lines[$b][9] = "blow")
			if ($bot~command_lines[$b][1] = "port")
				setVar $bot~command_lines[$b][9] $bot~command_lines[$b][1]
				setvar $bot~command_lines[$b][1] "kill"
			elseif ($bot~command_lines[$b][1] = "planet")
				setVar $bot~command_lines[$b][9] $bot~command_lines[$b][1]
				setvar $bot~command_lines[$b][1] "kill"
			else
				##########################################
				# default should be regular kill command #
				##########################################
				setVar $bot~command_lines[$b][9] "kill"
			end
			setvar $bot~command_lines[$b] $bot~command_lines[$b][1]&" "&$bot~command_lines[$b][2]&" "&$bot~command_lines[$b][3]&" "&$bot~command_lines[$b][4]&" "&$bot~command_lines[$b][5]&" "&$bot~command_lines[$b][6]&" "&$bot~command_lines[$b][7]&" "&$bot~command_lines[$b][8]&" "
		end
		if ($bot~command_lines[$b][9] = "upgrade") or ($bot~command_lines[$b][9] = "max")
			if ($bot~command_lines[$b][1] = "port")
				setVar $bot~command_lines[$b][9] $bot~command_lines[$b][1]
			elseif ($bot~command_lines[$b][1] = "planet")
				setVar $bot~command_lines[$b][9] $bot~command_lines[$b][1]
			else
				setVar $bot~command_lines[$b][9] "port"
			end
			setvar $bot~command_lines[$b][8] $bot~command_lines[$b][7]
			setvar $bot~command_lines[$b][7] $bot~command_lines[$b][6]
			setvar $bot~command_lines[$b][6] $bot~command_lines[$b][5]
			setvar $bot~command_lines[$b][5] $bot~command_lines[$b][4]
			setvar $bot~command_lines[$b][4] $bot~command_lines[$b][3]
			setvar $bot~command_lines[$b][3] $bot~command_lines[$b][2]
			setvar $bot~command_lines[$b][2] $bot~command_lines[$b][1]
			setvar $bot~command_lines[$b][1] "upgrade"
			setvar $bot~command_lines[$b] $bot~command_lines[$b][1]&" "&$bot~command_lines[$b][2]&" "&$bot~command_lines[$b][3]&" "&$bot~command_lines[$b][4]&" "&$bot~command_lines[$b][5]&" "&$bot~command_lines[$b][6]&" "&$bot~command_lines[$b][7]&" "&$bot~command_lines[$b][8]&" "
		end
		if ($bot~command_lines[$b][9] = "f") or ($bot~command_lines[$b][9] = "fde") or ($bot~command_lines[$b][9] = "ufde") or ($bot~command_lines[$b][9] = "nf") or ($bot~command_lines[$b][9] = "uf") or ($bot~command_lines[$b][9] = "de") or ($bot~command_lines[$b][9] = "fp") or ($bot~command_lines[$b][9] = "fup") or ($bot~command_lines[$b][9] = "nfup")
			setvar $bot~command_lines[$b][8] $bot~command_lines[$b][7]
			setvar $bot~command_lines[$b][7] $bot~command_lines[$b][6]
			setvar $bot~command_lines[$b][6] $bot~command_lines[$b][5]
			setvar $bot~command_lines[$b][5] $bot~command_lines[$b][4]
			setvar $bot~command_lines[$b][4] $bot~command_lines[$b][3]
			setvar $bot~command_lines[$b][3] $bot~command_lines[$b][2]
			setvar $bot~command_lines[$b][2] $bot~command_lines[$b][1]
			setvar $bot~command_lines[$b][1] $bot~command_lines[$b][9]
			setVar $bot~command_lines[$b][9] "find"
			setvar $bot~command_lines[$b] $bot~command_lines[$b][1]&" "&$bot~command_lines[$b][2]&" "&$bot~command_lines[$b][3]&" "&$bot~command_lines[$b][4]&" "&$bot~command_lines[$b][5]&" "&$bot~command_lines[$b][6]&" "&$bot~command_lines[$b][7]&" "&$bot~command_lines[$b][8]&" "
		end
		setVar $i 1
		while ($i <= 8)
			if ($bot~command_lines[$b][$i] = "s")
				setVar $bot~command_lines[$b][$i] $MAP~stardock
			elseif ($bot~command_lines[$b][$i] = "r")
				setVar $bot~command_lines[$b][$i] $MAP~rylos
			elseif ($bot~command_lines[$b][$i] = "a")
				setVar $bot~command_lines[$b][$i] $MAP~alpha_centauri
			elseif ($bot~command_lines[$b][$i] = "h")
				setVar $bot~command_lines[$b][$i] $MAP~home_sector
			elseif ($bot~command_lines[$b][$i] = "b")
				setVar $bot~command_lines[$b][$i] $MAP~backdoor
			elseif ($bot~command_lines[$b][$i] = "x")
				setVar $bot~command_lines[$b][$i] $BOT~safe_ship
			elseif ($bot~command_lines[$b][$i] = "l")
				if (($BOT~safe_planet <> "") AND ($BOT~safe_planet <> "0"))
					getSectorParameter $BOT~safe_planet "PSECTOR" $check
					setVar $bot~command_lines[$b][$i] $check
				end
			end
			add $i 1
		end
		if ($bot~command_lines[$b][9] = "l")
			setvar $bot~command_lines[$b][9] "land"
		end
		if ($bot~command_lines[$b][9] = "x")
			setvar $bot~command_lines[$b][9] "xport"
		end
		if ($bot~command_lines[$b][9] = "qss")
			setvar $bot~command_lines[$b][9] "status"
		end
		if ($bot~command_lines[$b][9] = "d")
			setvar $bot~command_lines[$b][9] "dep"
		end
		if ($bot~command_lines[$b][9] = "w")
			setvar $bot~command_lines[$b][9] "with"
		end
		if ($bot~command_lines[$b][9] = "k")
			setvar $bot~command_lines[$b][9] "keep"
		end
		if ($bot~command_lines[$b][9] = "exit")
			setvar $bot~command_lines[$b][9] "xenter"
		end
		if ($bot~command_lines[$b][9] = "cn")
			setvar $bot~command_lines[$b][9] "cn9"
		end
		if ($bot~command_lines[$b][9] = "emx")
			setvar $bot~command_lines[$b][9] "reset"
		end
		if ($bot~command_lines[$b][9] = "pinfo")
			setvar $bot~command_lines[$b][9] "pscan"
		end
		if ($bot~command_lines[$b][9] = "shipstore")
			setvar $bot~command_lines[$b][9] "storeship"
		end
		setVar $travelCommands "mow twarp bwarp pwarp smow m t b p "
		#replacing planet id's with planet sector
		getWordPos $travelCommands $pos $bot~command_lines[$b][9]
		if ($pos > 0)
			if ($bot~command_lines[$b][9] = "m")
				setvar $bot~command_lines[$b][9] "mow"
			end
			if ($bot~command_lines[$b][9] = "p")
				setvar $bot~command_lines[$b][9] "pwarp"
			end
			if ($bot~command_lines[$b][9] = "t")
				setvar $bot~command_lines[$b][9] "twarp"
			end
			if ($bot~command_lines[$b][9] = "b")
				setvar $bot~command_lines[$b][9] "bwarp"
			end

			getWordPos " "&$bot~command_lines[$b]&" " $pos " planet "
			if ($pos > 0)
				if ($bot~command_lines[$b][1] = "planet")
					setvar $bot~command_lines[$b][1] $bot~command_lines[$b][2]
					##  keep parm2 the same because it's the planet number  ##
					getSectorParameter $bot~command_lines[$b][1] "PSECTOR" $bot~command_lines[$b][1]
				end
				setVar $i 1
				while ($i <= $BOT~parms)
					if ($bot~command_lines[$b][$i] = "planet")
						setVar $old_value $bot~command_lines[$b][1]
						setVar $bot~command_lines[$b][$i] ""
						setvar $bot~command_lines[$b][2] $bot~command_lines[$b][1]
						getSectorParameter $bot~command_lines[$b][1] "PSECTOR" $bot~command_lines[$b][1]
					end
					add $i 1
				end
			end
		end

		setVar $BOT~parm1 $bot~command_lines[$b][1]
		setVar $BOT~parm2 $bot~command_lines[$b][2]
		setVar $BOT~parm3 $bot~command_lines[$b][3]
		setVar $BOT~parm4 $bot~command_lines[$b][4]
		setVar $BOT~parm5 $bot~command_lines[$b][5]
		setVar $BOT~parm6 $bot~command_lines[$b][6]
		setVar $BOT~parm7 $bot~command_lines[$b][7]
		setVar $BOT~parm8 $bot~command_lines[$b][8]
		if ($bot~command_lines[$b][9] = "0")
			loadvar $player~current_sector
			if (($player~current_sector = "0") or ($player~current_sector = ""))
				gosub :player~quikstats
			end
			send "'["&$BOT~mode&"] ["&$player~current_sector&"] {"&$SWITCHBOARD~bot_name&"} - You are logged into this bot.  Use "&$SWITCHBOARD~bot_name&" help for commands.*"
			goto :BOT~wait_for_command
		end
		getWordPos " "&$bot~command_lines[$b]&" " $stopCheck " off "
		gosub :formatCommand
		gosub :findCommand
		if ($currentCategory = "Modes")
			if ($stopCheck > 0)
				killtrigger shutdownthemodule
				stop $BOT~LAST_LOADED_MODULE
				setVar $BOT~mode "General"
				savevar $bot~mode
				send "'{" $SWITCHBOARD~bot_name "} - "&$formatted_command&" mode is now off.*"
				goto :BOT~wait_for_command
			end
		end
		setvar $isFound false
		if (($doesExist > 0) OR ($doesExistHidden > 0))
			setvar $isFound true
			gosub :load_the_module
			if ($b < $bot~command_lines)
				# the last script in the list has not loaded #
				killtrigger loadended
				setEventTrigger	loadended :loadended "SCRIPT STOPPED" $loaded
				pause
				:loadended
				if ($currentCategory = "Modes")
					setVar $BOT~mode "General"
					savevar $bot~mode
				end
			else
				goto :BOT~wait_for_command
			end
		else
			getWordPos $BOT~internalCommandList&$BOT~doubledCommandList $pos " "&$bot~command_lines[$b][9]&" "
			if ($pos > 0)
				setvar $isFound true
				gosub :BOT~killthetriggers
				gosub ":INTERNAL_COMMANDS~"&$bot~command_lines[$b][9]
			end
		end
		if ($isFound <> true)
			if ($temp_bot_name <> "all")
				setVar $SWITCHBOARD~message $formatted_command&" is not a valid command.*"
				gosub :SWITCHBOARD~switchboard
			end
		end
		add $b 1
	end
	goto :BOT~wait_for_command

:formatCommand
	cutText $bot~command_lines[$b][9]&" " $firstChar 1 1
	cutText $bot~command_lines[$b][9]&" " $restOfCommand 2 999
	uppercase $firstChar
	setVar $formatted_command $firstChar&$restOfCommand
	stripText $formatted_command " "    
return
:findCommand
	setVar $BOT~ModuleCategory ""
	setVar $i 1
	while ($i <= 3)
		setVar $j 1
		while ($j <= 7)
			if ($i = 3)
				fileExists $doesExist "scripts\"&$bot~mombot_directory&"\"&$BOT~CATAGORIES[$i]&"\"&$bot~command_lines[$b][9]&".cts"
				fileExists $doesExistHidden "scripts\"&$bot~mombot_directory&"\"&$BOT~CATAGORIES[$i]&"\_"&$bot~command_lines[$b][9]&".cts"
				if (($doesExist) OR ($doesExistHidden))
					setVar $currentCategory $BOT~CATAGORIES[$i]
					if ($doesExistHidden)
						setVar $BOT~ModuleCategory $BOT~CATAGORIES[$i]&"\_"
					else
						setVar $BOT~ModuleCategory $BOT~CATAGORIES[$i]&"\"
					end
					setVar $HELP~currentList $BOT~internalCommandList[$j]
					return
				end
			else
				fileExists $doesExist "scripts\"&$bot~mombot_directory&"\"&$BOT~CATAGORIES[$i]&"\"&$BOT~TYPES[$j]&"\"&$bot~command_lines[$b][9]&".cts"
				fileExists $doesExistHidden "scripts\"&$bot~mombot_directory&"\"&$BOT~CATAGORIES[$i]&"\"&$BOT~TYPES[$j]&"\_"&$bot~command_lines[$b][9]&".cts"
				if (($doesExist) OR ($doesExistHidden))
					setVar $currentCategory $BOT~CATAGORIES[$i]
					if ($doesExistHidden)
						setVar $BOT~ModuleCategory $BOT~CATAGORIES[$i]&"\"&$BOT~TYPES[$j]&"\_"
					else
						setVar $BOT~ModuleCategory $BOT~CATAGORIES[$i]&"\"&$BOT~TYPES[$j]&"\"
					end
					setVar $HELP~currentList $BOT~internalCommandList[$j]
					return
				end
			end
			add $j 1
		end
		add $i 1
	end
return

:run_module
	gosub :load_the_module
	goto :BOT~wait_for_command

:load_the_module
	setvar $bot~user_command_line $bot~command_lines[$b]
	setvar $bot~command $bot~command_lines[$b][9]
	setvar $bot~parm1 $bot~command_lines[$b][1]
	setvar $bot~parm2 $bot~command_lines[$b][2]
	setvar $bot~parm3 $bot~command_lines[$b][3]
	setvar $bot~parm4 $bot~command_lines[$b][4]
	setvar $bot~parm5 $bot~command_lines[$b][5]
	setvar $bot~parm6 $bot~command_lines[$b][6]
	setvar $bot~parm7 $bot~command_lines[$b][7]
	setvar $bot~parm8 $bot~command_lines[$b][8]
	gosub :MAIN~module_vars
	getWordPos " "&$bot~command_lines[$b]&" " $helpCheck " help "
	getWordPos " "&$bot~command_lines[$b]&" " $helpCheck2 " ? "
	if (($currentCategory = "Modes") and (($helpCheck <= 0) and ($helpCheck2 <= 0)))
		stop $BOT~LAST_LOADED_MODULE
		setVar $BOT~LAST_LOADED_MODULE "scripts\"&$bot~mombot_directory&"\"&$BOT~ModuleCategory&$bot~command_lines[$b][9]&".cts"
		setVar $BOT~mode $formatted_command
		savevar $bot~mode
		savevar $bot~LAST_LOADED_MODULE
	end
	setvar $loaded "scripts\"&$bot~mombot_directory&"\"&$BOT~ModuleCategory&$bot~command_lines[$b][9]&".cts"
	stop $loaded
	load $loaded  
return
#============================ END COMMAND PROCESSING/EXTERNAL MODULE RUNNING =======================
#============================== HOTKEY CONTROL ==============================
:Hotkey_Access
	gosub :BOT~bigdelay_killthetriggers
	setVar $SWITCHBOARD~self_command TRUE
	setVar $bot~command_lines[$b][9] ""
	setVar $invalid FALSE
	setVar $BOT~parm1 ""
	setVar $BOT~parm2 ""
	setVar $BOT~parm3 ""
	setVar $BOT~parm4 ""
	setVar $BOT~parm5 ""
	setVar $BOT~parm6 ""
	setVar $BOT~parm7 ""
	setVar $BOT~parm8 ""
	#gosub :BOT~save_the_variables
	
	echo #27 "[1A" #27 "[K" ANSI_15 "**Hotkey" ANSI_4
	getConsoleInput $tempCharacter SINGLEKEY
	:checkHotKey
		getCharCode $tempCharacter $charCode
		gosub :BOT~killthetriggers
		setVar $temp $BOT~hotkeys[$charCode]
		if (($temp <> "0") AND ($temp <> ""))
			setVar $bot~command_lines[$b][9] $BOT~custom_commands[$temp]
		else
			setVar $invalid TRUE
		end
		cutText $bot~command_lines[$b][9]&"  " $test 1 1
		if ($charCode = "48")
			setVar $i 10
			goto :runHotScript
		elseif ($charCode = "63")
			setVar $bot~command_lines[$b] "help"
			goto :runUserCommandLine
		elseif (($charCode >= 49) AND ($charCode <= 57))
			setVar $i ($charCode-48)
			goto :runHotScript
		elseif (($test = ":") AND ($invalid = FALSE))
			goto $bot~command_lines[$b][9]
		elseif ($invalid = FALSE)
			setVar $bot~command_lines[$b] $bot~command_lines[$b][9]
			goto :runUserCommandLine
		end
		echo #27 "[10D          " #27 "[10D"
		goto :BOT~wait_for_command
#============================== END HOTKEY CONTROL SUB ==============================
#============================== START SCRIPT ACCESS CONTROL SUB ==============================
:script_access
		gosub :BOT~killthetriggers
	setVar $i 1
	echo #27 "[3A" #27 "[K*" #27 "[K*" #27 "[K*" ANSI_14 "*Which script to run?                      *----------------------------------"
	while (($i <= $BOT~HOTKEY_SCRIPTS) AND ($i <= 10))
		if ($BOT~HOTKEY_SCRIPTS[$i] <> 0)
			if ($i >= 10)
				SetTextOutTrigger "key"&$i  :triggerHotScript   0
				echo "*"&ANSI_15&"0"&ANSI_14&") "&ANSI_15&$BOT~HOTKEY_SCRIPTS[$i][1]
			else
				SetTextOutTrigger "key"&$i  :triggerHotScript   $i
				echo "*"&ANSI_15&$i&ANSI_14&") "&ANSI_15&$BOT~HOTKEY_SCRIPTS[$i][1]
			end
		end
		add $i 1
	end
	SetTextOutTrigger echohelp2      :script_access     #63
	setDelayTrigger   notfastenough2 :doneScripts       9000
	SetTextOutTrigger noneAvail2     :doneScripts
	echo #27 "[1A" #27 "[K" ANSI_14 "***Scripts" ANSI_15 ">" ANSI_7
	pause
	:doneScripts
		echo #27 "[10D          " #27 "[10D"
		goto :BOT~wait_for_command
:triggerHotScript
	getOutText $i
	if ($i = 0)
		setVar $i 10
	end
:runHotScript
	load $BOT~HOTKEY_SCRIPTS[$i]
	getwordpos $BOT~HOTKEY_SCRIPTS[$i] $pos "scripts/"
	if ($pos > 0)
		fileExists $chk $BOT~HOTKEY_SCRIPTS[$i]
	else
		fileExists $chk "scripts/"&$BOT~HOTKEY_SCRIPTS[$i]
	end
	if ($chk <> true)
		echo ANSI_4&"*"&$BOT~HOTKEY_SCRIPTS[$i]&" does not exist in specified location.  Please check your "&$BOT~SCRIPT_FILE&" file to make sure it is correct.*"&ANSI_7
	end
goto :BOT~wait_for_command
#============================== END SCRIPT ACCESS CONTROL SUB ==============================

# ============================== BOT SECURITY ==============================
:verify_user_status
	setVar $i 1
	lowerCase $user_name
	while ($i <= $BOT~corpycount)
		cutText $BOT~corpy[$i] $name 1 6
		setvar $unstripped_name $name
		lowerCase $name
		trim $user_name
		trim $name
		if ($user_name = $name)
			setvar $bot~command_caller $unstripped_name
			savevar $bot~command_caller
			setVar $authorization 1
			return
		end
		add $i  1
	end
return
:chk_login
	if ($loggedin[$user_name] = 1)
		setVar $logged 1
	else
		setVar $logged 0
	end
return
# ============================== BOT SECURITY ==============================
