	gosub :BOT~loadVars
	
	setArray $TYPES 7
	setVar $TYPES[1] "General"
	setVar $TYPES[2] "Defense"
	setVar $TYPES[3] "Offense"
	setVar $TYPES[4] "Resource"
	setVar $TYPES[5] "Grid"
	setVar $TYPES[6] "Cashing"
	setVar $TYPES[7] "Data"


	
	setVar $BOT~help[1] $BOT~tab&"help - displays help files for commands "
	setVar $BOT~help[2] $BOT~tab&"	   "
	gosub :bot~helpfile


		if ($BOT~parm1 <> "")
			lowerCase $BOT~parm1
			setVar $i 1
			while ($i <= 7)
				setVar $temptype $types[$i]
				lowerCase $temptype
				if ($BOT~parm1 = $temptype)
					setVar $currentList $BOT~INTERNALCOMMANDLISTS[$i]
					goto :command_list
				end
				add $i 1
			end
			fileExists $doesExist "scripts\mombot\help\"&$BOT~parm1&".txt"
			if ($doesExist)
				readToArray "scripts\mombot\help\"&$BOT~parm1&".txt" $bot~help
				gosub :bot~displayhelp

			else
				setVar $SWITCHBOARD~message "No help file available for "&$BOT~parm1&".*"
				gosub :SWITCHBOARD~switchboard
			end
			halt
		else
			if ($SWITCHBOARD~self_command)
				goto :echo_help
			else
				goto :ss_help
			end
		end



#####==============================================  BOT HELP SECTION =================================================#####
:command_list
	setVar $SWITCHBOARD~helpList TRUE
	setVar $helpList TRUE
	setVar $SWITCHBOARD~message ""
	if ($BOT~parm1 = 0)
		gosub :PLAYER~quikstats
		setVar $SWITCHBOARD~message "  --------------Mind ()ver Matter Bot Help Categories------------*"
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&"                          Version: "&$BOT~major_version&"_"&$BOT~minor_version&"*"
				setVar $SWITCHBOARD~message $SWITCHBOARD~message&" *"
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&"                [OFFENSE]|[DEFENSE]|[DATA]|[CASHING]*"
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&"                     [RESOURCE]|[GRID]|[GENERAL]*"
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&" *"
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  ---------------------------------------------------------------*"
	else
		getFileList $commandList "scripts\mombot\commands\"&$BOT~parm1&"\*.cts"
		getFileList $modeList "scripts\mombot\modes\"&$BOT~parm1&"\*.cts"
		setVar $maxStringLength 34
		setVar $paddingDashes "                                 "
		upperCase $BOT~parm1
		setVar $SWITCHBOARD~message "  *  *                                   *"
		getLength "-="&$BOT~parm1&"=-" $comLength
		setVar $sideLength (($maxStringLength-$comLength)/2)
		cutText $paddingDashes $leftPad 1 $sideLength
		cutText $paddingDashes $rightPad 1 (($maxStringLength-$comLength)-$sideLength)
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  "&$leftPad&ansi_8&"-="&ansi_7&$BOT~parm1&ansi_8&"=-"&ansi_15&$rightPad&" *"
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&ansi_7&"  -"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"- *"&ansi_15
			upperCase $currentList
			setVar $i 1
			while ($i <= $commandList)
				setVar $tempCommand $commandList[$i]&"###"
				stripText $tempCommand "scripts\mombot\commands\"&$BOT~parm1&"\"
				stripText $tempCommand ".cts###"
				upperCase $tempCommand
				cutText $tempCommand&" " $hidden 1 1
				if ($hidden = "_")
					getLength $tempCommand $tempLength
					if (($SWITCHBOARD~self_command = TRUE) AND ($tempLength > 1))
						cutText $tempCommand $tempCommand 2 9999
						setVar $currentList $currentList&" [<><>HIDDEN<><>]"&$tempCommand&" "
					end
				else
					getWordPos $currentList $pos " "&$tempCommand&" "
					if ($pos <= 0)
						setVar $currentList $currentList&" "&$tempCommand&" "
					end
				end
				add $i 1
			end
			setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  *             "&ansi_2&"-="&ansi_10&"Commands"&ansi_2&"=-"&ansi_15&"            *"
			setVar $commandCount 0
			setVar $bufferCount 0
			gosub :bufferList
		if ($modelist > 0)
			setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  *              "&ansi_2&"-="&ansi_10&"Modes"&ansi_2&"=-"&ansi_15&"              *"
			setVar $currentList " "
			setVar $i 1
			while ($i <= $modelist)
				setVar $tempCommand $modelist[$i]&"###"
				stripText $tempCommand "scripts\mombot\modes\"&$BOT~parm1&"\"
				stripText $tempCommand ".cts###"
				upperCase $tempCommand
				cutText $tempCommand&" " $hidden 1 1
				if ($hidden = "_")
					getLength $tempCommand $tempLength
					if (($SWITCHBOARD~self_command = TRUE) AND ($tempLength > 1))
						cutText $tempCommand $tempCommand 2 9999
						setVar $currentList $currentList&" [<><>HIDDEN<><>]"&$tempCommand&" "
					end
				else
					setVar $currentList $currentList&" "&$tempCommand&" "
				end
				add $i 1
			end
			gosub :bufferList
		end
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&ansi_7&"  *  -"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"-"&ansi_7&"-"&ansi_8&"- *"&ansi_15
	end
	if (($SWITCHBOARD~self_command = true) or ($BOT~silent_running = TRUE))

	else
		setVar $SWITCHBOARD~self_command 2
	end
	gosub :SWITCHBOARD~switchboard
halt
:bufferList
	setVar $i 1
	getWord $currentList $test $i "[<><>NONE<><>]"
	setVar $paddingDashes "                                "
	while ($test <> "[<><>NONE<><>]")
		if ($test <> "0")
			setVar $tempCommand $test
			setVar $tempCommandHidden FALSE
			setVar $nextHidden FALSE
			setVar $next2Hidden FALSE
			getWord $currentList $next ($i+1)
			getWord $currentList $next2 ($i+2)
			getWordPos $tempCommand $pos "[<><>HIDDEN<><>]"
			if ($pos > 0)
				stripText $tempCommand "[<><>HIDDEN<><>]"
				setVar $tempCommandHidden TRUE
				setVar $tempCommand2 ANSI_14&$tempCommand&ANSI_15
			else
				setVar $tempCommand2 $tempCommand
			end
			if ($next <> 0)
				getWordPos $next $pos "[<><>HIDDEN<><>]"
				stripText $next "[<><>HIDDEN<><>]"
				if ($pos > 0)
					setVar $nextHidden TRUE
					setVar $tempCommand2 $tempCommand2&"   "&ANSI_14&$next&ANSI_15
				else
					setVar $tempCommand2 $tempCommand2&"   "&$next
				end
				setVar $tempCommand $tempCommand&"   "&$next
				add $i 1
			end
			if ($next2 <> 0)
				getWordPos $next2 $pos "[<><>HIDDEN<><>]"
				stripText $next2 "[<><>HIDDEN<><>]"
				if ($pos > 0)
					setVar $next2Hidden TRUE
					setVar $tempCommand2 $tempCommand2&"   "&ANSI_14&$next2&ANSI_15
				else
					setVar $tempCommand2 $tempCommand2&"   "&$next2
				end
				setVar $tempCommand $tempCommand&"   "&$next2
				add $i 1
			end
			getLength $tempCommand $comLength
			upperCase $tempCommand
			setVar $sideLength (($maxStringLength-$comLength)/2)
			cutText $paddingDashes $leftPad 1 $sideLength
			cutText $paddingDashes $rightPad 1 (($maxStringLength-$comLength)-$sideLength)
			if ($SWITCHBOARD~self_command = TRUE)
				setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  "&$leftPad&$tempCommand2&$rightPad&" *"
			else
				setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  "&$leftPad&$tempCommand&$rightPad&" *"  
			end
			add $commandCount 1
		end
		add $i 1
		getWord $currentList $test $i "[<><>NONE<><>]"
	end
return
:echo_help
	loadvar $bot~major_version
	loadvar $bot~minor_version

	echo "*"
	echo ansi_13 "  ----------------" ansi_14 "Mind " ansi_4 "()" ansi_14 "ver Matter Bot Help Categories" ansi_13 "---------------*"
		echo ansi_13 "                            Version: "&$BOT~major_version&"."&$BOT~minor_version&"*"
		echo ansi_13 "                  [OFFENSE]|[DEFENSE]|[DATA]|[CASHING]*"
	echo ansi_13 "                      [RESOURCE]|[GRID]|[GENERAL]    *"
	fileExists $exists1 "scripts/mombot/hotkeys.cfg"
	fileExists $exists2 "scripts/mombot/custom_keys.cfg"
	fileExists $exists3 "scripts/mombot/custom_commands.cfg"
	if ($exists1 AND $exists2 AND $exists3)
		echo ansi_13 "  ----------------------------- "&ANSI_14&"Hot Keys"&ANSI_13&" -----------------------------*"
		readToArray "scripts/mombot/hotkeys.cfg" $bot~hotkeys
		readToArray "scripts/mombot/custom_keys.cfg" $bot~custom_keys
		readToArray "scripts/mombot/custom_commands.cfg" $bot~custom_commands
		gosub :MENUS~echoHotKeys
	end
	
	echo ansi_13 "  ----------------------------- "&ANSI_14&"Daemons"&ANSI_13&" ------------------------------*"
	getFileList $daemonList "scripts\mombot\daemons\*.cts"
	if ($daemonList > 0)
		setVar $paddingDashes "                                 "
		setVar $currentList ""
		setVar $maxStringLength 68
		setVar $i 1
		while ($i <= $daemonList)
			setVar $tempCommand $daemonList[$i]&"###"
			stripText $tempCommand "scripts\mombot\daemons\"&$BOT~parm1&"\"
			stripText $tempCommand ".cts###"
			setVar $currentList $currentList&" "&$tempCommand&" "
			add $i 1
		end
		setVar $SWITCHBOARD~message ""
		gosub :bufferList
		echo $SWITCHBOARD~message

		echo ansi_13 "  ------------------------"&ANSI_14&" Hints/Tips "&ANSI_13&"--------------------------------  *"
		gosub :get_hint_tips
		
		echo ansi_15 "  *  "&$hint_tip&"*  *"
		echo ansi_13 "  --------------------------------------------------------------------***"
	end
	halt
:ss_help
	loadvar $bot~major_version
	loadvar $bot~minor_version
	setVar $helpString "'*"
	setVar $helpString $helpString&"  -----------------Mind ()ver Matter Bot Help Categories--------------*"
	setVar $helpString $helpString&"                              Version: "&$BOT~major_version&"."&$BOT~minor_version&"*"
	setVar $helpString $helpString&"                   [OFFENSE]|[DEFENSE]|[DATA]|[CASHING]*"
	setVar $helpString $helpString&"                        [RESOURCE]|[GRID]|[GENERAL]    *"
	setVar $helpString $helpString&"  --------------------------------------------------------------------**"
	send $helpString
	halt
# ============================== END HELP FOR COMMANDS SUB ==============================

:get_hint_tips

	setArray $hints 12
	setvar $hints 12
	setvar $hints[1] "You can run most commands silently by adding a 'silent' parameter*  to any command line.*  There is also a silent option in the bot preference menu to*  keep things quiet on the ss channel."
	setvar $hints[2] "There are different surround options in the bot menu.*  Press tab-~ to see them. TAB-s will surround."
	setvar $hints[3] "There are variables you can use in the command line as shortcuts:*    h - home sector*    r - rylos*    a - alpha centauri*    b - backdoor to stardock*    s - stardock*    x - safe ship*    l - safe planet*  *  If you place these into any script, the letter will be replaced*  with a sector number for each.*  *  (Except the safe ship, that will be replaced with the ship number.)"
	setvar $hints[4] "Some commands have shortened names!  Examples are:*    twarp (t)         bwarp (b)*    mow (m)           pwarp (p)*    xport (x)         deposit (d)*    withdrawal (w)    land (l)"
	setvar $hints[5] "TAB-TAB will stop all scripts, plus it will reset messages.*  Never doubt if you are deaf again!"
	setvar $hints[6] "Hotkeys can be defined in the bot preference menu (TAB-~).*  You can fire almost any command with the click of the hotkey."
	setvar $hints[7] "Don't forget the gridding menu!  Just press > >.*  The photon menu is one more >."
	setvar $hints[8] "Always add new alien ships to your bot by using the storeship command.*  That will make capturing them easier."
	setvar $hints[9] "Your bot will grab the planet number of the planet you are landing on.*  If you want to reland, just use the l command.  No number required!"
	setvar $hints[10] "Need to restart a bot?  Try the 'reboot' command.*  It will kill your current bot and reload a new one."
	setvar $hints[11] "If your bot doesn't seem to have the correct game info, try using*  the 'refresh' command."
	setvar $hints[12] "You can scroll through your history of commands by*  pressing the up and down arrow in the self command prompt."
	getRnd $selected_hint 1 $hints
	setvar $hint_tip $hints[$selected_hint]

return



# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\displayhelp\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\bot\menus"
