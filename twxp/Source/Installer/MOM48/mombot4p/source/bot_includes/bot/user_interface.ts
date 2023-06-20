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
	elseif (($routing = "R") AND ($BOT~botIsOff <> TRUE))
		goto :command
	elseif (($routing = "P") AND ($BOT~botIsOff <> TRUE))
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
		setvar $BOT~user_command_line $CURRENTLINE
		setVar $BOT~user_command_line $BOT~user_command_line&"              "
		lowercase $BOT~user_command_line
		if ($radio_type = "'")
			getLength "'"&$temp_bot_name&" " $length
			cutText $BOT~user_command_line $BOT~user_command_line $length+1 9999
			setVar $user_sec_level 9
			getWord $CURRENTLINE $BOT~command 2
			getWordPos $BOT~command $pos "'"
			getWordPos $BOT~command $pos2 "`"
			if ($pos = 1) OR ($pos2 = 1)
				goto :BOT~wait_for_command
			end
			getLength $BOT~command&" " $BOT~commandLength
			cutText $BOT~user_command_line $BOT~user_command_line $BOT~commandLength+1 9999
			gosub :getParameters
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
		stripText $user_name " "
		cutText $currentline $BOT~user_command_line 10 999
		getWord $BOT~user_command_line $botname_chk 1
		if ($botname_chk <> $temp_bot_name)
			goto :BOT~wait_for_command
		end
		getLength $temp_bot_name&" " $length
		cutText $BOT~user_command_line&"          " $BOT~user_command_line $length+1 9999
		lowerCase $BOT~user_command_line
		setVar $BOT~user_command_line $BOT~user_command_line&"              "
		getWord $BOT~user_command_line $BOT~command 1
		if (($BOT~command = "bot") OR ($BOT~command = "relog"))
			goto :BOT~wait_for_command
		end
		getLength $BOT~command $length
		cutText $BOT~user_command_line&"          " $BOT~user_command_line $length+1 9999
		gosub :getParameters
		gosub :verify_user_status
		if ($authorization = 0)
			#send "'{" $SWITCHBOARD~bot_name "} - Send a corporate memo to login.*"
			goto :BOT~wait_for_command
		end
		goto :command_processing

	:page_command
		cutText $currentline $user_name 3 6
		stripText $user_name " "
		cutText $currentline $BOT~user_command_line 10 999
		getWordPos $BOT~user_command_line $pos $SWITCHBOARD~bot_name & ":" & $BOT~bot_password & ":" & $BOT~subspace
		if ($pos > 0)
			add $BOT~corpycount 1
			setVar $BOT~corpy[$BOT~corpycount] $user_name
			setVar $loggedin[$user_name] 1
			send "'{" $SWITCHBOARD~bot_name "} - User Verified - " $user_name "*"
		else
			getWord $BOT~user_command_line $botname_chk 1
			if ($botname_chk <> $temp_bot_name)
				goto :BOT~wait_for_command
			end
			getLength $temp_bot_name & " " $length
			cutText $BOT~user_command_line & "          " $BOT~user_command_line $length+1 9999
			lowerCase $BOT~user_command_line
			setVar $BOT~user_command_line $BOT~user_command_line & "              "
			getWord $BOT~user_command_line $BOT~command 1
			if (($BOT~command = "bot") OR ($BOT~command = "relog"))
				goto :BOT~wait_for_command
			end
			getLength $BOT~command $length
			cutText $BOT~user_command_line & "          " $BOT~user_command_line $length+1 9999
			echo "*"&ANSI_14&"["&ANSI_15&$BOT~user_command_line&ANSI_14&"]*"
			gosub :getParameters
			gosub :verify_user_status
			if ($authorization = 0)
				echo "*"&ANSI_14&"["&ANSI_15&"Bad attempt to control bot through private message."&ANSI_14&"]*"
				goto :BOT~wait_for_command
			end
			goto :command_processing            
		end
		goto :BOT~wait_for_command
# ============================== END COMMAND ROUTING SUB ==============================

#============================== SELF CONTROL ==============================
:User_Access
	gosub :BOT~bigdelay_killthetriggers
	gosub :selfCommandPrompt
	lowercase $BOT~user_command_line
	if ($BOT~user_command_line = "")
		echo CURRENTANSILINE
		goto :BOT~wait_for_command
	end
	setVar $SWITCHBOARD~self_command TRUE
	:runUserCommandLine
		setVar $BOT~user_command_line $BOT~user_command_line&"              "
		setVar $authorization 9
		setVar $user_sec_level 9
		getWord $BOT~user_command_line $BOT~command 1
		getLength $BOT~command&" " $BOT~commandLength
		getWordPos $BOT~command $pos "'"
		getWordPos $BOT~command $pos2 "`"
		if ($pos <> 1) AND ($pos2 <> 1)
			cutText $BOT~user_command_line $BOT~user_command_line $BOT~commandLength+1 9999
		end
		gosub :getParameters
		goto :command_processing
#============================== END SELF CONTROL SUB ==============================
:getParameters
	setVar $i 1
	while ($i <= 8)
		getWord (" " & $BOT~user_command_line & " ") $BOT~parms[$i] $i ""
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
			gosub :PLAYER~quikstats
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
				
				setVar $BOT~command "surround"
				setVar $BOT~user_command_line " surround"
				setVar $BOT~parm1 ""
				saveVar $BOT~parm1
				saveVar $BOT~command
				saveVar $BOT~user_command_line
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
							setVar $BOT~user_command_line "p "&SECTOR.WARPS[CURRENTSECTOR][$sector]&" scan"
							goto :runUserCommandLine
						else				
							if (($BOT~pgrid_bot <> "") and ($BOT~pgrid_bot <> 0))
								send "'" & $BOT~pgrid_bot & " pgrid "&SECTOR.WARPS[CURRENTSECTOR][$sector]&" d:" & SECTOR.DENSITY[SECTOR.WARPS[CURRENTSECTOR][$sector]] &" "&$BOT~pgrid_end_command "**"
							else
								setVar $BOT~user_command_line "pgrid "&SECTOR.WARPS[CURRENTSECTOR][$sector]&" "&$BOT~pgrid_end_command
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
					setVar $BOT~user_command_line "photon "&SECTOR.WARPS[CURRENTSECTOR][$sector]
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
				elseif (($character = #27&"[A") OR ($character = #28))
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
				elseif (($character = #27&"[B") OR ($character = #29))
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
	setVar $BOT~user_command_line $BOT~promptOutput
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
	cutText $BOT~user_command_line&"  " $checkForChat 1 1
	if ($BOT~user_command_line <> "")
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
			setVar $BOT~history[1] $BOT~user_command_line
			setVar $BOT~historyString $BOT~history[1]&"<<|HS|>>"&$BOT~historyString
		end
		saveVar $BOT~historyString
	end
return
#========================== COMMAND PROCESSING/EXTERNAL MODULE RUNNING =================
:command_processing
	gosub :BOT~load_watcher_variables
	lowercase $BOT~command
:command_filtering
	cutText $BOT~command&"  " $checkForChat 1 1
	cutText $BOT~command&"  " $checkForFinder 1 1
	if ($checkForChat = "'")
		goto :INTERNAL_COMMANDS~ss
	elseif ($checkForChat = "`")
		goto :INTERNAL_COMMANDS~fed
	end
	saveVar $SWITCHBOARD~self_command
	if ($BOT~command = "?")
		setVar $BOT~command "help"
	end
	setvar $update_list " limps figs armids cim "
	getwordpos $update_list $pos " "&$bot~command&" "
	if ($pos > 0)
		setvar $bot~parms[8] $bot~command
		setVar $BOT~command "update"
		setvar $bot~user_command_line $bot~parms[1]&" "&$bot~parms[2]&" "&$bot~parms[3]&" "&$bot~parms[4]&" "&$bot~parms[5]&" "&$bot~parms[6]&" "&$bot~parms[7]&" "&$bot~parms[8]&" "
	end
	setvar $deploy_list " lay put place limp mine armid plimp mines climp cmine pmine topoff mines fig "
	getwordpos $deploy_list $pos " "&$bot~command&" "
	if ($pos > 0)
		if (($bot~command <> "lay") or ($bot~command <> "put") or ($bot~command <> "place"))
			setvar $bot~parms[8] $bot~command
		end
		setVar $BOT~command "deploy"
		setvar $bot~user_command_line $bot~parms[1]&" "&$bot~parms[2]&" "&$bot~parms[3]&" "&$bot~parms[4]&" "&$bot~parms[5]&" "&$bot~parms[6]&" "&$bot~parms[7]&" "&$bot~parms[8]&" "
	end
	if ($BOT~command = "figmove") or ($BOT~command = "movefigs")
		setVar $BOT~command "movefig"	
	end
	if ($BOT~command = "build") or ($BOT~command = "create")
		setVar $BOT~command $bot~parms[1]
		setvar $bot~parms[1] "create"
		if ($bot~parms[1] = "port")
			setVar $BOT~command $bot~parms[1]
		else
			setVar $BOT~command "port"
		end
		setvar $bot~parms[8] $bot~parms[7]
		setvar $bot~parms[7] $bot~parms[6]
		setvar $bot~parms[6] $bot~parms[5]
		setvar $bot~parms[5] $bot~parms[4]
		setvar $bot~parms[4] $bot~parms[3]
		setvar $bot~parms[3] $bot~parms[2]
		setvar $bot~parms[2] $bot~parms[1]
		setvar $bot~parms[1] "create"
		setvar $bot~user_command_line $bot~parms[1]&" "&$bot~parms[2]&" "&$bot~parms[3]&" "&$bot~parms[4]&" "&$bot~parms[5]&" "&$bot~parms[6]&" "&$bot~parms[7]&" "&$bot~parms[8]&" "
	end
	if ($BOT~command = "kill") or ($BOT~command = "destroy") or ($BOT~command = "blow")
		#setVar $BOT~command $bot~parms[1]
		#setvar $bot~parms[1] "kill"
		if ($bot~parms[1] = "port")
			setVar $BOT~command $bot~parms[1]
			setvar $bot~parms[1] "kill"
			setvar $bot~user_command_line $bot~parms[1]&" "&$bot~parms[2]&" "&$bot~parms[3]&" "&$bot~parms[4]&" "&$bot~parms[5]&" "&$bot~parms[6]&" "&$bot~parms[7]&" "&$bot~parms[8]&" "
		end
	end
	if ($BOT~command = "upgrade") or ($BOT~command = "max")
		if ($bot~parms[1] = "port")
			setVar $BOT~command $bot~parms[1]
		else
			setVar $BOT~command "port"
		end
		setvar $bot~parms[8] $bot~parms[7]
		setvar $bot~parms[7] $bot~parms[6]
		setvar $bot~parms[6] $bot~parms[5]
		setvar $bot~parms[5] $bot~parms[4]
		setvar $bot~parms[4] $bot~parms[3]
		setvar $bot~parms[3] $bot~parms[2]
		setvar $bot~parms[2] $bot~parms[1]
		setvar $bot~parms[1] "upgrade"
		setvar $bot~user_command_line $bot~parms[1]&" "&$bot~parms[2]&" "&$bot~parms[3]&" "&$bot~parms[4]&" "&$bot~parms[5]&" "&$bot~parms[6]&" "&$bot~parms[7]&" "&$bot~parms[8]&" "
	end
	if ($BOT~command = "f") or ($BOT~command = "fde") or ($BOT~command = "ufde") or ($BOT~command = "nf") or ($BOT~command = "uf") or ($BOT~command = "de") or ($BOT~command = "fp") or ($BOT~command = "fup") or ($BOT~command = "nfup")
		setvar $bot~parms[8] $bot~parms[7]
		setvar $bot~parms[7] $bot~parms[6]
		setvar $bot~parms[6] $bot~parms[5]
		setvar $bot~parms[5] $bot~parms[4]
		setvar $bot~parms[4] $bot~parms[3]
		setvar $bot~parms[3] $bot~parms[2]
		setvar $bot~parms[2] $bot~parms[1]
		setvar $bot~parms[1] $bot~command
		setVar $BOT~command "find"
		setvar $bot~user_command_line $bot~parms[1]&" "&$bot~parms[2]&" "&$bot~parms[3]&" "&$bot~parms[4]&" "&$bot~parms[5]&" "&$bot~parms[6]&" "&$bot~parms[7]&" "&$bot~parms[8]&" "
	end
	setVar $i 1
	while ($i <= $BOT~parmS)
		if ($BOT~parmS[$i] = "s")
			setVar $BOT~parmS[$i] $MAP~stardock
		elseif ($BOT~parmS[$i] = "r")
			setVar $BOT~parmS[$i] $MAP~rylos
		elseif ($BOT~parmS[$i] = "a")
			setVar $BOT~parmS[$i] $MAP~alpha_centauri
		elseif ($BOT~parmS[$i] = "h")
			setVar $BOT~parmS[$i] $MAP~home_sector
		elseif ($BOT~parmS[$i] = "b")
			setVar $BOT~parmS[$i] $MAP~backdoor
		elseif ($BOT~parmS[$i] = "x")
			setVar $BOT~parmS[$i] $BOT~safe_ship
		elseif ($BOT~parmS[$i] = "l")
			if (($BOT~safe_planet <> "") AND ($BOT~safe_planet <> "0"))
				getSectorParameter $BOT~safe_planet "PSECTOR" $check
				setVar $BOT~parmS[$i] $check
			end
		end
		add $i 1
	end
	setVar $travelCommands "mow twarp bwarp pwarp smow m t b p "
	#replacing planet id's with planet sector
	getWordPos $travelCommands $pos $BOT~command
	if ($pos > 0)
		getWordPos " "&$BOT~user_command_line&" " $pos " planet "
		if ($pos > 0)
			if ($bot~parms[1] = "planet")
				setvar $bot~parms[1] $bot~parms[2]
				##  keep parm2 the same because it's the planet number  ##
				getSectorParameter $BOT~parms[1] "PSECTOR" $BOT~parms[1]
			end
			setVar $i 1
			while ($i <= $BOT~parms)
				if ($BOT~parms[$i] = "planet")
					setVar $old_value $BOT~parms[1]
					setVar $BOT~parms[$i] ""
					setvar $bot~parms[2] $bot~parms[1]
					getSectorParameter $BOT~parms[1] "PSECTOR" $BOT~parms[1]
				end
				add $i 1
			end
		end
	end
	setVar $BOT~parm1 $BOT~parmS[1]
	setVar $BOT~parm2 $BOT~parmS[2]
	setVar $BOT~parm3 $BOT~parmS[3]
	setVar $BOT~parm4 $BOT~parmS[4]
	setVar $BOT~parm5 $BOT~parmS[5]
	setVar $BOT~parm6 $BOT~parmS[6]
	setVar $BOT~parm7 $BOT~parmS[7]
	setVar $BOT~parm8 $BOT~parmS[8]
	if ($BOT~command = "0")
		loadvar $player~current_sector
		if (($player~current_sector = "0") or ($player~current_sector = ""))
			gosub :player~quikstats
		end
		send "'["&$BOT~mode&"] ["&$player~current_sector&"] {"&$SWITCHBOARD~bot_name&"} - You are logged into this bot.  Use "&$SWITCHBOARD~bot_name&" help for commands.*"
		goto :BOT~wait_for_command
	end
	getWordPos " "&$BOT~user_command_line&" " $stopCheck " off "
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
	if (($doesExist > 0) OR ($doesExistHidden > 0))
		goto :run_module
	else
		getWordPos $BOT~internalCommandList&$BOT~doubledCommandList $pos " "&$BOT~command&" "
		if ($pos > 0)
			gosub :BOT~killthetriggers
			goto ":INTERNAL_COMMANDS~"&$BOT~command
		end
	end
	setVar $SWITCHBOARD~message $formatted_command&" is not a valid command.*"
	gosub :SWITCHBOARD~switchboard
	goto :BOT~wait_for_command
:formatCommand
	cutText $BOT~command&" " $firstChar 1 1
	cutText $BOT~command&" " $restOfCommand 2 999
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
				fileExists $doesExist "scripts\"&$bot~mombot_directory&"\"&$BOT~CATAGORIES[$i]&"\"&$BOT~command&".cts"
				fileExists $doesExistHidden "scripts\"&$bot~mombot_directory&"\"&$BOT~CATAGORIES[$i]&"\_"&$BOT~command&".cts"
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
				fileExists $doesExist "scripts\"&$bot~mombot_directory&"\"&$BOT~CATAGORIES[$i]&"\"&$BOT~TYPES[$j]&"\"&$BOT~command&".cts"
				fileExists $doesExistHidden "scripts\"&$bot~mombot_directory&"\"&$BOT~CATAGORIES[$i]&"\"&$BOT~TYPES[$j]&"\_"&$BOT~command&".cts"
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
	gosub :MAIN~module_vars
	getWordPos " "&$BOT~user_command_line&" " $helpCheck " help "
	getWordPos " "&$BOT~user_command_line&" " $helpCheck2 " ? "
	if (($currentCategory = "Modes") and (($helpCheck <= 0) and ($helpCheck2 <= 0)))
		stop $BOT~LAST_LOADED_MODULE
		setVar $BOT~LAST_LOADED_MODULE "scripts\"&$bot~mombot_directory&"\"&$BOT~ModuleCategory&$BOT~command&".cts"
		setVar $BOT~mode $formatted_command
		savevar $bot~mode
	end

	stop "scripts\"&$bot~mombot_directory&"\"&$BOT~ModuleCategory&$BOT~command&".cts"
	load "scripts\"&$bot~mombot_directory&"\"&$BOT~ModuleCategory&$BOT~command&".cts"  
return
#============================ END COMMAND PROCESSING/EXTERNAL MODULE RUNNING =======================
#============================== HOTKEY CONTROL ==============================
:Hotkey_Access
	gosub :BOT~bigdelay_killthetriggers
	setVar $SWITCHBOARD~self_command TRUE
	setVar $BOT~command ""
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
			setVar $BOT~command $BOT~custom_commands[$temp]
		else
			setVar $invalid TRUE
		end
		cutText $BOT~command&"  " $test 1 1
		if ($charCode = "48")
			setVar $i 10
			goto :runHotScript
		elseif ($charCode = "63")
			setVar $BOT~user_command_line "help"
			goto :runUserCommandLine
		elseif (($charCode >= 49) AND ($charCode <= 57))
			setVar $i ($charCode-48)
			goto :runHotScript
		elseif (($test = ":") AND ($invalid = FALSE))
			goto $BOT~command
		elseif ($invalid = FALSE)
			setVar $BOT~user_command_line $BOT~command
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
	fileExists $chk $BOT~HOTKEY_SCRIPTS[$i]
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
		stripText $name " "
		lowerCase $name
		if ($user_name = $name)
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
