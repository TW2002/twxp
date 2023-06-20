#################################################################
setVar $botusr "scripts/supgbot/" & GAMENAME & "_BOTUSR.txt"
setVar $seenlst "scripts/supgbot/" & GAMENAME & "_BOTSEEN.txt"
fileExists $exist $botusr
fileExists $seenex $seenlst
fileExists $confexist "scripts/supgbot/bot.cfg"
setVar $init 1
setVAr $disable 0
if ($confexist)
	if ($exist)
		gosub :readusr
	else
		echo ANSI_15 "*No user list for this game, creating profile..."
		gosub :createusr
	end
	setVar $reader 1
	gosub :readcnf
	if ($olwch = 1) AND ($seenex = 1)
		setVar $reader 1
		gosub :readseen
	end
	goto :bot
else
	clientMessage "bot.cfg not found. Please place your bot.cfg file in the scripts/supgbot/ directory."
	halt
end

##################################################################
:bot
gosub :globalPromptCheck
if ($promptCheck = 1)
	if ($disable = 1)
		send "'SupGBot is running, commands are temporarily disabled*"
	else
		send "'SupGBot is running, login and type " #34 $botName  " ?" #34 " for a list of commands.*"	
	end
	if ($cim > 0)
		send "'Cim Hunter running, next cim update in : " $cimtimer " minutes.*"
	end
end

:alive
setDelayTrigger keepalive :keepalive 60000
:wf_command
killtrigger 0
killtrigger cmd_timeout
killtrigger admin
if ($olwch = 1)
	killtrigger whoonline
	setTextLineTrigger whoonline :whoonline "Who's Playing"
end
if ($disable = 0)
	setTextLIneTrigger pgcmd :chkcomms "P "
	setTextLineTrigger sscmd :chkcomms "R "
end
setTextOutTrigger admin :admin "}"
setEventTrigger 0 :disconnected "Connection lost"
pause

####################################################################
:chkcomms
killtrigger whoonline
killtrigger pgcmd
killtrigger admin
killtrigger sscmd
getWord CURRENTLINE $radio_type 1
if ($radio_type = "R")
	cutText CURRENTLINE $user 3 6
	setVar $trim_inc~word $user
	gosub :trim_inc~trim
	setVar $user $trim_inc~word
	cutText CURRENTLINE $command 9 999
	getWord $command $bname 1
	if ($bname = $botName)
		if ($logged[$user] > 0)
			setVar $logged[$user] $inactivity
			getWord $command $cmd 2
			setDelayTrigger cmd_timeout :cmd_timeout 20000
			goto :pcscmd
		end
	end
end
if ($radio_type = "P")
	cutText CURRENTLINE $user 3 6
	cutText CURRENTLINE $command 9 999
	getWord $command $bname 1
	if ($bname = $botname)
		getWord $command $cmd 2
		if ($cmd = "login")
			getWord $command $pass 3
			gosub :login
		elseif ($cmd = "logout")
			gosub :logout
		end
	end
end
goto :wf_command
##################################################################
:pcscmd
if ($cmd = "?")
	gosub :displayhelp
elseif (($cmd = "express") OR ($cmd = "e")) AND ($seclvl[$user] >= 4)
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd " ?): 'express <sector>' or 'e <sector>' - express warps you to given sector.*"
			goto :wf_command
		end
	end
	isNumber $num $to
	if ($num = 1)
		waitfor "?"
		gosub :globalPromptCheck
		if ($to > 0) AND ($to <= SECTORS)
			if ($prompt <> "Command")
				if ($promptCheck = 1)
					send "'" $botName "(" $cmd "): Cannot Express, incorrect prompt.*"
				end
			else
				setVar $ship_inc~expressto $to
				gosub :ship_inc~express
				if ($ship_inc~expressto > 0)
					send "'" $botName "(" $cmd "): Express warp complete.*"
				elseif ($ship_inc~expressto = "-1")
					send "'" $botName "(" $cmd "): Could not complete warp, stuck in Interdictor. Help may be required.*"
				elseif ($ship_inc~expressto = "-2")
					send "'" $botName "(" $cmd "): Could not warp, sector is avoided.*"
				end
			end
		else
			if ($promptCheck = 1)
				send "'" $botName "(" $cmd "): Invalid sector number for express*"
			end
		end
	end
elseif (($cmd = "resetprompt") OR ($cmd = "rp"))
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd " ?): 'resetprompt' or 'rp' - reset to Command, Citadel, or Planet prompt if bot is stuck.*"
			goto :wf_command
		end
	end
	:prmptchk
	setTextTrigger chk :chek "?"
	setTextTrigger pse :pse "[Pause]"
	pause
	:chek
	killtrigger pse
	getWord CURRENTLINE $prompt 1
	if ($prompt = "Command") OR ($prompt = "Citadel") OR ($prompt = "Planet")
		send "'" $botName "(" $cmd "): At " $prompt " prompt.*"
	elseif ($prompt = "Stop")
		send "y"
		goto :prmptchk
	elseif ($prompt = "Do") or ($prompt = "Engage")
		send "n"
		goto :prmptchk
	else
		send "*q0*"
		goto :prmptchk
	end
elseif (($cmd = "script") OR ($cmd = "s")) AND ($seclvl[$user] = 5)
	waitFor "(?="
	gosub :globalPromptCheck
	getWord $command $scriptname 3
	if ($scriptname = "?") AND ($promptCheck = 1)
		send "'*" $botName "(" $cmd "): Scripts Available to run via SupGBot*"
		send "Type '" $botName " " $cmd " <scriptname> ?' if you need help on a specific script*"
		if ($numscripts > 0)
			setVar $loop 0
			setVar $cnter 0
			:prntscrhlp
			if ($loop < $numscripts)
				add $loop 1
				send "    " $loadedscripts[$loop] "*"
				goto :prntscrhlp
			end	
		else
			send "     No scripts available*"
		end
		send "*"
		goto :wf_command
	end
	getWord $script[$scriptname] $chk 1
	getWord $command $hlpchk 4
	getWord $script[$scriptname] $runprmpt 2
	getWord $script[$scriptname] $numprms 3
	if ($chk = 1)
		if ($hlpchk = "?") AND ($promptCheck = 1)
			send "'*" $botName "(" $cmd "): Help for script : " $scriptname "*"
			send "      Start Prompt : " $runprmpt "*"
			send "	    Parameters :*"
			if ($numprms = 0)
				send "	     No parameters required*"   
			else
				setVar $hlpparms 0
				:hlpprms
				if ($hlpparms < $numprms)
					add $hlpparms 1
					setVar $parmgrab (3 + $hlpparms)
					getWord $script[$scriptname] $parmtype $parmgrab
					send "      parm" $hlpparms " - " $parmtype " - " $desc[$scriptname]_[$hlpparms] "*"
					goto :hlpprms
				end
			end
			send "*"
			goto :wf_command
		end
		if ($runprmpt <> $prompt) AND ($runprmpt <> "Any")
			if ($promptCheck = 1)
				send "'" $botName "(" $cmd "): cannot run script from this prompt, needs : " $runprmpt ", on : " $prompt ".*"
			end
			goto :wf_command
		else
			setVar $runline $scriptname
			if ($numprms = 0)
				goto :runscript
			end
			setVar $loop 3
			setVar $stop (3 + $numprms)
			:bleh
			if ($loop < $stop)
				add $loop 1
				getWord $script[$scriptname] $parameter $loop
				getWord $command $given $loop
				if ($parameter = "")
					if ($promptCheck = 1)
						send "'" $botName "(" $cmd "): cannot run script incorrect parameters.*"
					end
					goto :wf_command
				else
					if ($parameter = "int")
						isNumber $val $given
						if ($val = 0)
							if ($promptCheck = 1)
								send "'" $botName "(" $cmd "): cannot run script incorrect parameters.*"
							end
							goto :wf_command
						end
					elseif ($parameter = "text")
						isNumber $val $given
						if ($val = 1)
							if ($promptCheck = 1)
								send "'" $botName "(" $cmd "): cannot run script incorrect parameters.*"
							end
							goto :wf_command
						end
					elseif ($parameter = "tori")
					else
						if ($promptCheck = 1)
							send "'" $botName "(" $cmd "): cannot run script, parameters not defined correctly in configuration file.*"
						end
						goto :wf_command
					end
					
					setVar $bot_parm[($loop - 3)] $given
				end
				goto :bleh
			end
		end
		:runscript
		if ($bot_parm[1] <> "")
			setVar $SupGBot_inc~supgbot_parm1 $bot_parm[1]
			saveVar $SupGBot_inc~supgbot_parm1
		else
			goto :loadscript
		end
		if ($bot_parm[2] <> "")
			setVar $SupGBot_inc~supgbot_parm2 $bot_parm[2]
			saveVar $SupGBot_inc~supgbot_parm2
		else
			goto :loadscript
		end
		if ($bot_parm[3] <> "")
			setVar $SupGBot_inc~supgbot_parm3 $bot_parm[3]
			saveVar $SupGBot_inc~supgbot_parm3
		end
		if ($bot_parm[4] <> "")
			setVar $SupGBot_inc~supgbot_parm4 $bot_parm[4]
			saveVar $SupGBot_inc~supgbot_parm4
		end
		:loadScript
		if ($cim > 0)
			setVar $cim 0
			if ($promptCheck = 1)
				send "'" $botName "(" $cmd " ?):  Disabling cim hunter.*"
			end
		end
		if ($clv > 0)
			setVar $clv 0
			if ($promptCheck = 1)
				send "'" $botName "(" $cmd " ?):  Disabling clv check.*"
			end
		end
		setVar $SupGBot_Script 1
		saveVar $SupGBot_Script
		setTextLineTrigger disable :disable "SUPGBOT_DISABLE_COMMAND"
		setDelayTrigger nodisable :nodisable 5000
		load $scriptname
		pause

		:nodisable
		killtrigger disable
	end
elseif ($cmd = "seen")
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd " ?): 'seen <tradername>' - Reports the last time the bot has seen given trader on the who's playing screen.*"
			goto :wf_command
		end
	end
	waitFor "?"
	getWord $command $sntder 3
	if ($seen[$sntder] = 0)
		send "'" $botName "(" $cmd "): I have never seen that trader.*"
	else
		getDate $date
		getTime $time "hh:mm:ss"
		send "'*" $botName "(" $cmd "): I last saw that trader on - " $seen[$sntder] " my time.*" $botName "(" $cmd "): My current date and time is - " $date " " $time ".**"
	end
elseif ($cmd = "scan")
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd " ?): 'scan' - Displays current bot sector in subspace.*"
			goto :wf_command
		end
	end
	gosub :scanme
elseif (($cmd = "land") or ($cmd = "l"))
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd " ?): 'land <pnum>' or 'l <pnum>' - lands on given planet.*"
			goto :wf_command
		end
	end
	waitFor "?"
	gosub :globalPromptCheck
	if ($prompt = "Command")
		getWord $command $planet_inc~pnum 3
		isNumber $num $planet_inc~pnum
		if ($num = 1)
			gosub :planet_inc~land
			if ($planet_inc~planetResult = 0)
				send "'" $botName "(" $cmd "): There are no planets in this sector.*"
			elseif ($planet_inc~planetResult > 0)
				send "'" $botName "(" $cmd "): I am now on planet number " $planet_inc~planetResult ", at " $planet_inc~pprompt " prompt.*"
			elseif ($planet_inc~planetResult = "-1")
				send "'" $botName "(" $cmd "): Unable to land on planet, invalid planet number supplied.*"
			elseif ($planet_inc~planetResult = "-2")
				send "'" $botName "(" $cmd "): Unable to land, " $planet_inc~pfigs " fighters are defending planet.*"
			elseif ($planet_inc~planetResult = "-3")
				send "'" $botName "(" $cmd "): Unable to land, This ship cannot land.*"
			elseif ($planet_inc~planetResult = "-4")
				send "'" $botName "(" $cmd "): Unable to land, I was podded while attempting to land.*"
			elseif ($planet_inc~planetResult = "-5")
				send "'" $botName "(" $cmd "): Unable to land, " $planet_inc~blocker " is blocking my landing.*"
			end
		else
			send "'" $botName "(" $cmd "): Invalid planet number.*"
		end
		if ($planet_inc~qdamage > 0)
			send "'" $botName "(" $cmd "): I took " $planet_inc~qdamage " damage from a quasar cannon while attempting to land.*"
		end	
		if ($planet_inc~fdamage > 0)
			send "'" $botName "(" $cmd "): I took " $planet_inc~fdamage " damage from attacking fighters while attempting to land.*"
		end
	else
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd "): Cannot Land, incorrect prompt.*"
		end
	end
elseif (($cmd = "blast") or ($cmd = "b"))
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd " ?): 'blast' - Blasts off from planet.*"
			goto :wf_command
		end
	end
	waitFor "?"
	gosub :globalPromptCheck
	if ($prompt = "Planet")
		send "q"
	elseif ($prompt = "Citadel")
		send "qq"
	elseif ($prompt = "Command")
		send "'" $botName "(" $cmd "): Could not blast, not on a planet*"
		goto :wf_command
	else
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd "): Could not blast, incorrect prompt. You may need to use resetprompt*"
		end
		goto :wf_command
	end
	send "'" $botName "(" $cmd "):  No longer on planet*"

elseif (($cmd = "twarp") or ($cmd = "tw"))
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd " ?): 'twarp <sector>' or 'tw <sector>' - twarps you to given sector.*"
			goto :wf_command
		end
	end
	waitFor "?"
	gosub :globalPromptCheck
	if ($prompt = "Command")
		getWord $command $ship_inc~twarpto 3
		isNumber $num $ship_inc~twarpto
		if ($num = 1)
			if ($ship_inc~twarpto > 0) AND ($ship_inc~twarpto <= SECTORS)
				gosub :ship_inc~twarp
				if ($ship_inc~twarpto > 0)
					send "'" $botName "(" $cmd "): Transwarp complete.*"
				elseif ($ship_inc~twarpto = "-1")
					send "'" $botName "(" $cmd "): Unable to transwarp, I don't have a transwarp drive.*"
				elseif ($ship_inc~twarpto = "-2")
					send "'" $botName "(" $cmd "): Unable to transwarp, I'm being held by an IG. May need assistance.*"
				elseif ($ship_inc~twarpto = "-3")
					send "'" $botName "(" $cmd "): Unable to transwarp, I don't have enough fuel.*"
				elseif ($ship_inc~twarpto = "-4")
					send "'" $botName "(" $cmd "): Unable to transwarp, no jump point fighter. Cannot blind warp.*"
				end
			else
				send "'" $botName "(" $cmd "): Invalid sector number.*"
			end
		else
			send "'" $botName "(" $cmd "): Invalid sector number.*"
		end
	else
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd "): Cannot Transwarp, incorrect prompt.*"
		end
	end
elseif (($cmd = "pwarp") or ($cmd = "pw"))
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd " ?): 'pwarp <sector>' or 'pw <sector>' - warps planet to given sector.*"
			goto :wf_command
		end
	end
	waitFor "?"
	gosub :globalPromptCheck
	if ($prompt = "Citadel")
		getWord $command $planet_inc~pwarpto 3
		isNumber $num $planet_inc~pwarpto
		if ($num = 1)
			if ($planet_inc~pwarpto > 0) AND ($planet_inc~pwarpto <= SECTORS)
				gosub :planet_inc~pwarp
				if ($planet_inc~pwarpto > 0)
					send "'" $botName "(" $cmd "): Planetary Transwarp complete.*"
				elseif ($planet_inc~pwarpto = "-1")
					send "'" $botName "(" $cmd "): Unable to transwarp, Planet is not level 4+.*"
				elseif ($planet_inc~pwarpto = "-3")
					send "'" $botName "(" $cmd "): Unable to transwarp, I don't have enough fuel.*"
				elseif ($planet_inc~pwarpto = "-2")
					send "'" $botName "(" $cmd "): Unable to warp, no jump point fighter. Cannot blind warp.*"
				end
			else
				send "'" $botName "(" $cmd "): Invalid sector number.*"
			end
		else
			send "'" $botName "(" $cmd "): Invalid sector number.*"
		end
	else
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd "): Cannot warp, incorrect prompt.*"
		end
	end
elseif ($cmd = "dropcorp")
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd " ?): 'dropcorp' - removes bot from corporation.*"
			goto :wf_command
		end
	end
	waitFor "?"
	gosub :globalPromptCheck
	if ($prompt = "Citadel")
		setVar $corp_inc~prompt "Citadel"
	elseif ($prompt = "Command")
		setVar $corp_inc~prompt "Command"
	elseif ($promptCheck = 1)
		send "'" $botName "(" $cmd "): Incorrect prompt.*"
		goto :wf_command
	else
		goto :wf_command
	end
	gosub :corp_inc~dropcorp
	if ($corp_inc~dropCorp = 1)
		send "'" $botName "(" $cmd "): Dropped corp.*"
	else
		send "'" $botName "(" $cmd "): Not in a corp.*"
	end
	goto :wf_command
elseif ($cmd = "joincorp")
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd " ?): 'joincorp <corpnumber> <password>' - joins bot to given corpnumber with given password.*"
			goto :wf_command
		end
	end
	waitFor "?"
	gosub :globalPromptCheck
	getWord $command $corpnum 3
	getWord $command $corp_inc~corppass 4
	isNumber $num $corpNum
	if ($num = 1)
		setVar $corp_inc~corpnum $corpnum
	else
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd "): Bad corp number.*"
		end
	end
	if ($prompt = "Citadel")
		setVar $corp_inc~prompt "Citadel"
	elseif ($prompt = "Command")
		setVar $corp_inc~prompt "Command"
	elseif ($promptCheck = 1)
		send "'" $botName "(" $cmd "): Incorrect prompt.*"
		goto :wf_command
	else
		goto :wf_command
	end
	
	gosub :corp_inc~joinCorp
	if ($corp_inc~corpnum = "-1")
		send "'" $botName "(" $cmd "): Could not join corp, bad password.*"
	elseif ($corp_inc~corpnum = "-2")
		send "'" $botName "(" $cmd "): Could not join corp, alignment conflict.*"
	elseif ($corp_inc~corpnum = "-3")
		send "'" $botName "(" $cmd "): Could not join corp, corp is full.*"
	elseif ($corp_inc~corpnum = "-4")
		send "'" $botName "(" $cmd "): Could not join corp, corp number not active.*"
	else		
		send "'" $botName "(" $cmd "): Joined corp " $corpnum "*"
	end
	goto :wf_command
	
elseif ($cmd = "page")
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd " ?): 'page' - makes beeping noise on bot owners computer.*"
			goto :wf_command
		end
	end
	waitFor "?"
	gosub :globalPromptCheck
	sound message.wav
	sound message.wav
	sound message.wav
	if ($promptCheck = 1)
		send "'" $botName "(" $cmd "): Bot owner has been paged.*"
	end
elseif (($cmd = "xport") OR ($cmd = "x"))
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd " ?): 'xport <ship>' or 'x <ship>' - transports bot to given ship.*"
			goto :wf_command
		end
	end
	waitFor "?"
	gosub :globalPromptCheck
	if ($prompt = "Command")
		getWord $command $ship_inc~xportto 3
		isNumber $num $ship_inc~xportto
		if ($num = 1)
			gosub :ship_inc~xport
			if ($ship_inc~xportto > 0)
				send "'" $botName "(" $cmd "): Transport complete.*"
			elseif ($ship_inc~xportto = "-1")
				send "'" $botName "(" $cmd "): Unable to transport, I am out of turns.*"
			elseif ($ship_inc~xportto = "-2") OR ($ship_inc~xportto = "-7")
				send "'" $botName "(" $cmd "): Unable to transport, ship is not available.*"
			elseif ($ship_inc~xportto = "-3")
				send "'" $botName "(" $cmd "): Unable to transport, I am not a CEO.*"
			elseif ($ship_inc~xportto = "-4")
				send "'" $botName "(" $cmd "): Unable to transport, ship is out of range.*"
			elseif ($ship_inc~xportto = "-5")
				send "'" $botName "(" $cmd "): Unable to transport, I need a federal commission.*"
			elseif ($ship_inc~xportto = "-6")
				send "'" $botName "(" $cmd "): Unable to transport, I don't have enough experience.*"
			end
		else
			send "'" $botName "(" $cmd "): Invalid shipnumber.*"
		end
	else
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd "): Cannot Transport, incorrect prompt.*"
		end
	end
elseif (($cmd = "photon") OR ($cmd = "p"))
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd " ?): 'photon <sector>' or 'p <sector>' - photons into given sector.*"
			goto :wf_command
		end
	end
	waitFor "?"
	gosub :globalPromptCheck
	if ($prompt = "Command") OR ($prompt = "Citadel")
		getWord $command $ship_inc~photonto 3
		isNumber $num $ship_inc~photonto
		if ($num = 1)
			if ($ship_inc~photonto > 10) AND ($ship_inc~photonto <= SECTORS)
				gosub :ship_inc~ptorp
				if ($ship_inc~photonto > 0)
					send "'" $botName "(" $cmd "): Photon complete.*"
				elseif ($ship_inc~photonto = "-1")
					send "'" $botName "(" $cmd "): Unable to photon, sector is not adjacent.*"
				elseif ($ship_inc~photonto = "-2")
					send "'" $botName "(" $cmd "): Unable to photon, photons are disabled.*"
				elseif ($ship_inc~photonto = "-3")
					send "'" $botName "(" $cmd "): Unable to photon, multi-photon off or photon from fed is off.*"
				elseif ($ship_inc~photonto = "-4")
					send "'" $botName "(" $cmd "): Unable to photon, cannot photon into fedspace.*"
				elseif ($ship_inc~photonto = "-5")
					send "'" $botName "(" $cmd "): Unable to photon, no photons.*"
				end
			else
				send "'" $botName "(" $cmd "): Invalid sector number.*"
			end				
		else
			send "'" $botName "(" $cmd "): Invalid sector number.*"
		end
	else
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd "): Cannot photon, incorrect prompt.*"
		end
	end
elseif ($cmd = "status")
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd " ?): 'status' - shows basic information about bot.*"
			goto :wf_command
		end
	end
	waitFor "?"
	gosub :globalPromptCheck
	if ($promptCheck = 1)
		gosub :gameinfo_inc~quikstats
		send "'" $botName "(" $cmd "): Sector " $gameinfo_inc~quikstats[SECT] " | Turns " $gameinfo_inc~quikstats[TURNS] " | Photons " $gameinfo_inc~quikstats[PHOT] "*"
		send "'" $botName "(" $cmd "): users logged in:*"
		setVar $advave 0
		send "'*    Username - Inactive*"
		:advave
		if ($advave < $numlogged)
			add $advave 1
			setVar $timeLeft ($inactivity - $logged[$usrlog[$advave]]) 
			send "      " $usrlog[$advave] " - " $timeleft " minutes*"
			goto :advave
		end
		if ($numlogged = 0)
			send "      noone logged in*"
		end
		send "*"
	end
elseif ($cmd = "give")
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'*" $botName "(" $cmd " ?): 'give <resource> <amount> <corpmember>' - gives corpmate given resources.*"
			send "   Resources : c-credits, f-fighters, s-shields, m1-armid mines,*   m2-limpet mines*"
			send "   You may specify a negative number when transferring credits, this*   will leave that number of credits on the bot.*"
			send "   ie... -50000 would leave the bot with 50000 credits, the corp mate *   is given the rest.*"
			send "   Entering an amount of 0 will attempt to give the maximum amount of*   resources to your corpie*"
			send "   Use the first couple letters of your corpmember's name, no spaces.**"
			goto :wf_command
		end
	end
	waitFor "?"
	gosub :globalPromptCheck
	if ($prompt = "Command")
		getWord $command $amnt 4
		getword $command $target 5
		isNumber $num $amnt
		setVar $err 0
		if ($num <> 1)
			send "'" $botName "(" $cmd "): Bad amount.*"
		end
		setVar $corp_inc~target $target
		if ($to = "c")
			setVar $corp_inc~giveCreds $amnt
			gosub :corp_inc~giveCreds
			if ($corp_inc~giveCreds >= 0)
				send "'" $botName "(" $cmd "): Gave " $corp_inc~giveCreds " credits to " $target ".*"
			elseif ($corp_inc~giveCreds < 0)
				setVar $err $corp_inc~giveCreds
			end
		elseif ($to = "f")
			if ($amnt >= 0)
				setVar $corp_inc~giveFigs $amnt
			else
				send "'" $botName "(" $cmd "): Bad amount.*"
			end
			gosub :corp_inc~giveFigs
			if ($corp_inc~giveFigs >= 0)
				send "'" $botName "(" $cmd "): Gave " $corp_inc~giveFigs " fighters to " $target ".*"
			elseif ($corp_inc~giveFigs < 0)
				setVar $err $corp_inc~giveFigs
			end
		elseif ($to = "m1")
			if ($amnt >= 0)
				setVar $corp_inc~giveMines $amnt
				setVar $corp_inc~mineType 1
			else
				send "'" $botName "(" $cmd "): Bad amount.*"
			end
			gosub :corp_inc~giveMines
			if ($corp_inc~giveMines >= 0)
				send "'" $botName "(" $cmd "): Gave " $corp_inc~giveMines " Armid mines to " $target ".*"
			elseif ($corp_inc~giveMines < 0)
				setVar $err $corp_inc~giveMines
			end
		elseif ($to = "m2")
			if ($amnt >= 0)
				setVar $corp_inc~giveMines $amnt
				setVar $corp_inc~mineType 2
			else
				send "'" $botName "(" $cmd "): Bad amount.*"
			end
			gosub :corp_inc~giveMines
			if ($corp_inc~giveMines >= 0)
				send "'" $botName "(" $cmd "): Gave " $corp_inc~giveMines " Limpet mines to " $target ".*"
			elseif ($corp_inc~giveMines < 0)
				setVar $err $corp_inc~giveMines
			end
		elseif ($to = "s")
			if ($amnt >= 0)
				setVar $corp_inc~giveShields $amnt
			else
				send "'" $botName "(" $cmd "): Bad amount.*"
			end
			gosub :corp_inc~giveShields
			if ($corp_inc~giveShields >= 0)
				send "'" $botName "(" $cmd "): Gave " $corp_inc~giveShields " shields to " $target ".*"
			elseif ($corp_inc~giveShields < 0)
				setVar $err $corp_inc~giveShields
			end
		else
			send "'" $botName "(" $cmd "): Cannot give, incorrect resource type.*"
		end
		if ($err = "-1")
			send "'" $botName "(" $cmd "): Cannot give, I am not on a corp.*"
		elseif ($err = "-2")
			send "'" $botName "(" $cmd "): Cannot give, no traders in sector.*"
		elseif ($err = "-3")
			send "'" $botName "(" $cmd "): Cannot give, target trader is not available.*"
		end
	else
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd "): Cannot give, incorrect prompt.*"
		end
	end
elseif ($cmd = "take")
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'*" $botName "(" $cmd " ?): 'take <resource> <amount> <corpmember>' - takes resourses from a given corpmate.*"
			send "   Resources : c-credits, f-fighters, s-shields, m1-armid mines,*   m2-limpet mines*"
			send "   You may specify a negative number when transferring credits, this*   will leave that number of credits on corp mate.*"
			send "   ie... -50000 would leave your corpie with 50000 credits while you*   took the rest.*"
			send "   Entering an amount of 0 will attempt to take the maximum amount of*   resources from your corpie*"
			send "   Use the first couple letters of your corpmember's name, no spaces.**"
			goto :wf_command
		end
	end
	waitFor "?"
	gosub :globalPromptCheck
	if ($prompt = "Command")
		getWord $command $amnt 4
		getword $command $target 5
		setVAr $err 0
		isNumber $num $amnt
		if ($num <> 1)
			send "'" $botName "(" $cmd "): Bad amount.*"
		end
		setVar $corp_inc~target $target
		if ($to = "c")
			setVar $corp_inc~takeCreds $amnt
			gosub :corp_inc~takeCreds
			if ($corp_inc~takeCreds >= 0)
				send "'" $botName "(" $cmd "): Took " $corp_inc~takeCreds " credits from " $target ".*"
			elseif ($corp_inc~takeCreds < 0)
				setVar $err $corp_inc~takeCreds
			end
		elseif ($to = "f")
			if ($amnt >= 0)
				setVar $corp_inc~takeFigs $amnt
			else
				send "'" $botName "(" $cmd "): Bad amount.*"
			end
			gosub :corp_inc~takeFigs
			if ($corp_inc~takeFigs >= 0)
				send "'" $botName "(" $cmd "): Took " $corp_inc~takeFigs " fighters from " $target ".*"
			elseif ($corp_inc~takeFigs < 0)
				setVar $err $corp_inc~takeFigs
			end
		elseif ($to = "m1")
			if ($amnt >= 0)
				setVar $corp_inc~takeMines $amnt
				setVar $corp_inc~mineType 1
			else
				send "'" $botName "(" $cmd "): Bad amount.*"
			end
			gosub :corp_inc~takeMines
			if ($corp_inc~takeMines >= 0)
				send "'" $botName "(" $cmd "): Took " $corp_inc~takeMines " Armid mines from " $target ".*"
			elseif ($corp_inc~takeMines < 0)
				setVar $err $corp_inc~takeMines
			end
		elseif ($to = "m2")
			if ($amnt >= 0)
				setVar $corp_inc~takeMines $amnt
				setVar $corp_inc~mineType 2
			else
				send "'" $botName "(" $cmd "): Bad amount.*"
			end
			gosub :corp_inc~takeMines
			if ($corp_inc~takeMines >= 0)
				send "'" $botName "(" $cmd "): Took " $corp_inc~takeMines " Limpet mines from " $target ".*"
			elseif ($corp_inc~takeMines < 0)
				setVar $err $corp_inc~takeMines
			end
		elseif ($to = "s")
			if ($amnt >= 0)
				setVar $corp_inc~takeShields $amnt
			else
				send "'" $botName "(" $cmd "): Bad amount.*"
			end
			gosub :corp_inc~takeShields
			if ($corp_inc~takeShields >= 0)
				send "'" $botName "(" $cmd "): Took " $corp_inc~takeShields " shields from " $target ".*"
			elseif ($corp_inc~takeShields < 0)
				setVar $err $corp_inc~takeShields
			end
		else
			send "'" $botName "(" $cmd "): Cannot take, incorrect resource type.*"
		end
		if ($err = "-1")
			send "'" $botName "(" $cmd "): Cannot take, you are not on a corp.*"
		elseif ($err = "-2")
			send "'" $botName "(" $cmd "): Cannot take, no traders in sector.*"
		elseif ($err = "-3")
			send "'" $botName "(" $cmd "): Cannot take, target trader is not available.*"
		end
	else
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd "): Cannot give, incorrect prompt.*"
		end
	end
elseif ($cmd = "cim")
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'*" $botName "(" $cmd " ?): 'cim <minutes> <i>' - runs basic cim hunter, <minutes> between cim checks, 0 turns hunter off.  Placing an 'i' after the minute parameter will ignore port percentage changes and only report opens and closures of ports.**"
			goto :wf_command
		end
	end
	waitFor "?"
	gosub :globalPromptCheck
	if ($promptCheck = 0)
		goto :wf_command
	end
	isNumber $heh $to
	if ($heh  = 0)
		send "'" $botName "(" $cmd "): Invalid input.*"
		goto :wf_command
	end
	if ($to = 0)
		send "'" $botName "(" $cmd "): Cim hunter disabled.*"
		setVar $cim 0
	elseif ($to > 0)
		getWord $command $ign 4
		if ($ign = "i")
			setVar $cimhunt_inc~ignore 1
		else
			setVAr $cimhunt_inc~ignore 0
		end
		send "'" $botName "(" $cmd "): Cim hunter enabled.*"
		setVar $cim $to
		setVar $cimhunt_inc~init 1
		setVar $cimtimer 0
	else
		send "'" $botName "(" $cmd "): Invalid input.*"
		goto :wf_command
	end
elseif ($cmd = "clv")
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd " ?): 'clv <minutes>' - runs clv check, <minutes> between clv checks, 0 turns checker off.=.*"
			goto :wf_command
		end
	end
	waitFor "?"
	gosub :globalPromptCheck
	if ($prompt <> "Command") AND ($prompt <> "Citadel")
		goto :wf_command
	end
	isNumber $heh $to
	if ($heh  = 0)
		send "'" $botName "(" $cmd "): Invalid input.*"
		goto :wf_command
	end
	if ($to = 0)
		send "'" $botName "(" $cmd "): CLV Check disabled.*"
		setVar $cim 0
	elseif ($to > 0)
		send "'" $botName "(" $cmd "): CLV Check enabled.*"
		setVar $clv $to
		setVar $clv_inc~init 1
		setVar $clvtimer 0
	else
		send "'" $botName "(" $cmd "): Invalid input.*"
		goto :wf_command
	end
elseif ($cmd = "db")
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'*" $botName "(" $cmd " ?): 'db <conditions>' - checks the bot's TWX database and reports results.*"
			send "Conditions :*"
			send " AND                - Compares search criteria using the AND operator.*"
			send " BACKDOOR           - Finds sectors that are backdoors.*"
			send " BUYORE             - Finds sectors buying ore.*"
			send " BUYORGS            - Finds sectors buying orgs.*"
			send " BUYEQU             - Finds sectors buying equipment.*"
			send " DEADEND            - Finds sectors that are deadends.*"
			send " DENSITY <>= number - Finds sectors with densities matching your*"
			send "                      criteria.*"
			send " DISTANCE hops sect - Finds sectors <hops> hops from <sect>.*"
			send "                      DISTANCE calculations are slow, try to only use*"
			send "                      distance as a final search criteria, and try*"
			send "                      never to use it following an OR.*"
			send " FIGGED             - Finds figged sectors.*"
			send " OR                 - Compares search criteria using the OR operator.*"
			send " PLANETS <>= number - Finds sectors with number of planets matching*"
			send " RESULTS            - Results from previous query.*"
			send " SELLORE            - Finds sectors selling ore.*"
			send " SELLORGS           - Finds sectors selling orgs.*"
			send " SELLEQU            - Finds sectors selling equipment.*"
			send " TRADERS <>= number - Finds sectors with number of traders matching*"
			send "                      your criteria.*"
			send " UNFIGGED           - Finds unfigged sectors.*"
			send " WARPS <>= number   - Finds sectors with warps out matching your*"
			send "                      criteria.*"
			send " WARPSIN <>= number - Finds sectors with warps in matching your*"
			send "                      criteria.**"
			goto :wf_command
		end
	end
	waitFor "?"
	gosub :globalPromptCheck
	if ($promptCheck = 0)
		goto :wf_command
	end
	getWord $command $start 3
	getWordPos $command $pos $start
	cutText $command $db_inc~commandList $pos 999
	gosub :db_inc~db
	if ($db_inc~err = 0)
		send "'*" $botName "(" $cmd "): Query - " $db_inc~commandList " - Returned " $db_inc~results " results.*"
		if ($db_inc~results > 0) and ($db_inc~results <= 40)
			send " Sectors : "
			setVar $printloop 0
			:printloop2
			if ($printloop < $db_inc~results)
				add $printloop 1
				send $db_inc~resultList[$printloop] " "
				goto :printloop2
			end
		elseif ($db_inc~results > 40)
			send "Use the results command to view the results for this query.*"
		end
		send "**"
	elseif ($db_inc~err = 1)
		send "'" $botName "(" $cmd "): Error during query, bad numerical value.*"
	elseif ($db_inc~err = 2)
		send "'" $botName "(" $cmd "): Error during query, invalid operator.*"
	elseif ($db_inc~err = 3)
		send "'" $botName "(" $cmd "): Error during query, invalid syntax.*"
	elseif ($db_inc~err = 4)
		send "'" $botName "(" $cmd "): Erro during query, invalid command.*"
	elseif ($db_inc~err = 5)
		send "'" $botName "(" $cmd "): Error during query, RESULTS can only be used as the first command.*"
	end
elseif ($cmd = "results")
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd " ?): 'results <display/save>' - displays in subspace or writes results to a file the results of most recent db query.*"
			goto :wf_command
		end
	end
	waitFor "?"
	gosub :globalPromptCheck
	if ($promptCheck = 0)
		goto :wf_command
	end
	if ($db_inc~results = 0)
		send "'" $botName "(" $cmd "): No previous query or query returned no results.*"
		goto :wf_command
	end
	if ($to = "display")
		send "'*" $botName "(" $cmd "): Query - " $db_inc~commandList " - Returned " $db_inc~results " results.*"
		send " Sectors : "
		setVar $printloop 0
		:printloop3
		if ($printloop < $db_inc~results)
			add $printloop 1
			send $db_inc~resultList[$printloop] " "
			goto :printloop3
		end
		send "**"
	elseif ($to = "save")
		getTime $time "yy.mm.dd-hh.nn.ss"
		setVar $fname "scripts\supgbot\" & $user & "-" & $time & "_RESULTS.txt"
		write $fname "Query - " & $db_inc~commandList & " - Returned " & $db_inc~results & " results."
		setVar $printloop 0
		:printloop4
		if ($printloop < $db_inc~results)
			add $printloop 1
			write $fname $db_inc~resultList[$printloop]
			goto :printloop4
		end
		send "'" $botName "(" $cmd "): Results saved.*"
	else
		send "'*" $botName "(" $cmd "): Query - " $db_inc~commandList " - Returned " $db_inc~results " results.*"
		if ($db_inc~results > 0) and ($db_inc~results <= 40)
			send " Sectors : "
			setVar $printloop 0
			:printloop5
			if ($printloop < $db_inc~results)
				add $printloop 1
				send $db_inc~resultList[$printloop] " "
				goto :printloop5
			end
			send "**"
		elseif ($db_inc~results > 40)
			send "Use the results command to view the results for this query.*"
		end
		send "**"
	end
elseif ($cmd = "figrefresh")
	getWord $command $to 3
	if ($to = "?")
		waitFor "(?="
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd " ?): 'figrefresh' - gets an updated G list.*"
			goto :wf_command
		end
	end
	waitFor "?"
	gosub :globalPromptCheck
	if ($prompt <> "Command")
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd "): Invalid prompt.*"
		end
		goto :wf_command
	end
	gosub :nearfig_inc~figrefresh
end		
goto :wf_command


halt
####################################################################
:readusr
read $botusr $botName 1
setVar $stardock STARDOCK
return
#####################################################################
:createusr
getInput $botName "What would you like to call your bot in this game? (No spaces)"
write $botusr $botName
goto :admin
return
####################################################################
:adduser
getInput $user "Enter the username EXACTLY as it appears in the game."
getInput $password "Enter " & $user & "'s password. (No spaces)"
:seclevel
getInput $seclevel "Enter " & $user & "'s security level (1 - 5)."
isNumber $isnum $seclevel 
if ($isnum)
	if ($seclevel > 0) AND ($seclevel <= 5)
		write $botusr $seclevel & " " & $password & " " & $user
		gosub :globalPromptCheck
		if ($promptCheck = 0)
			goto :wf_command
		end
		send "=" $user "*"
		setTextTrigger conest :conesta "Secure comm-link established, Captain."
		setTextTrigger conmail :conesta "Rerouting message to Galactic M.A.I.L. Server."
		setTextTrigger noex :connoa "Unknown Trader!"
		setTextTrigger domean :domeana "Do you mean"
		pause
	
		:conesta
		gosub :globalPromptCheck
		send $botName "(admin): You have been added as a user to SupGBot. You may log in by hailing me and saying " #34 $botname " login " $password #34 "**"
		waitFor "terminated."
	
		:connoa
		killtrigger noex
		killtrigger conest
		killtrigger conmail
		killtrigger domean
		goto :manageusers
	
		:domeana
		killtrigger conest
		killtrigger conmail
		killtrigger domean
		send "n"
		setTextTrigger domean :domeana "Do you mean"
		pause
		goto :addmore
	end
end
goto :seclevel
:addmore
echo ANSI_15 "*Would you like to add another user?"
getConsoleInput $answer singlekey
lowercase $answer
if ($answer = "y")
	goto :adduser
end
return
###################################################################
:readcnf
read "scripts/supgbot/bot.cfg" $olwch 2
getWord $olwch $olwch 1
read "scripts/supgbot/bot.cfg" $inactivity 3
getWord $inactivity $inactivity 1
read "scripts/supgbot/bot.cfg" $showsec 4
getWord $showsec $showsec 1
setVar $reader 6
setVar $numscripts 0
:cnfreader
read "scripts/supgbot/bot.cfg" $scrinf $reader
if ($scrinf <> "EOF")
	getWord $scrinf $new 1
	if ($new = ";")
		:newscrpt
		gosub :writeparms
		getWord $scrinf $srname 2
		add $reader 1
		read "scripts/supgbot/bot.cfg" $scrinf $reader
		getWord $scrinf $ldprmpt 1
		if ($scrinf = "EOF") OR ($ldprmpt = ";") OR ($ldprmpt = "")
			clientMessage "Error loading script information for " & $srname & ", bot.cfg must be properly configured for this script to work with your bot. (Expected game start prompt)"
			if ($ldprmpt = ";")
				goto :newscrpt
			end
		else
			add $numscripts 1
			setVar $loadedscripts[$numscripts] $srname
			setVar $script[$srname] "1 " & $ldprmpt
		end
	else
		add $parms 1
		getWord $scrinf $parme[$parms] 1
		getLength $parme[$parms] $len
		getWordPos $scrinf $pos $parme[$parms]
		setVar $start ($pos + $len + 1)
		cutText $scrinf $desc[$srname]_[$parms] $start 999
	end
	add $reader 1
	goto :cnfreader		
end
gosub :writeparms
if ($numscripts > 0)
	setVar $loop 0
	setVar $cnter 0
	echo ANSI_15 "*Available Scripts Accessable via " $botName ":*"
	:prntscr
	if ($loop < $numscripts)
		add $loop 1
		add $cnter 1
		echo ANSI_12 $loadedscripts[$loop] "   "
		if ($cnter = 5)
			echo "*"
			setVar $cnter 0
		end
		goto :prntscr
	end
end		
return
####################################################################
:login
waitFor "?"
gosub :globalPromptCheck
setVar $trim_inc~word $user
gosub :trim_inc~trim
setVar $user $trim_inc~word
if ($logged[$user] > 0) AND ($promptCheck = 1)
	if ($promptCheck = 1)
		send "'" $botName "(" $cmd "): User, " $user " is already logged in.*"
	end
	setVar $logged[$user] $inactivity
	return
end
setVar $reader 2
:reader
read $botusr $authuser $reader
if ($authuser <> "EOF")
	getWord $authuser $password 2
	getWord $authuser $slvl 1
	getLength $password $passlen	
	setVar $len ($passlen + 4)
	cutText $authuser $authname $len 6
	getLength $authname $authlen
	setVar $addspc (6 - $authlen)
	if ($addspc > 0)
		setVar $splp 0
		:splp
		if ($splp < $addspc)
			add $splp 1
			setVar $authname $authname & " "
			goto :splp
		end
	end
	setVar $trim_inc~word $authname
	gosub :trim_inc~trim
	setVar $authname $trim_inc~word
	if ($authname = $user) AND ($password = $pass)
		setVar $trim_inc~word $user
		gosub :trim_inc~trim
		setVar $user $trim_inc~word
		if ($promptCheck = 1)
			send "'" $botName "(" $cmd "): User, " $user " logged in.*"
		end
		setVar $logged[$user] $inactivity
		setVar $seclvl[$user] $slvl
		add $numlogged 1
		setVar $usrlog[$numlogged] $user
	else
		add $reader 1
		goto :reader
	end
end
return
########################################################################
:logout
waitFor "?"
gosub :globalPromptCheck
setVar $trim_inc~word $user
gosub :trim_inc~trim
setVar $user $trim_inc~word
if ($logged[$user] > 0)
	setVar $logged[$user] 0
	setVar $newlist 0
	if ($promptCheck = 1)
		send "'" $botName "(" $cmd "): User, " $user " logged out.*"
	end
	setVar $logloop 0
	:lper
	if ($logloop < $numlogged)
		add $logloop 1
		if ($logged[$usrlog[$logloop]] > 0)
			add $newlist 1
			setVar $usrlog[$newlist] $usrlog[$logloop]
		end
		goto :lper
	end
	setVar $numlogged $newlist
end		
return
########################################################################
:keepalive
killtrigger whoonline
killtrigger pgcmd
killtrigger sscmd
setVar $newlist 0
add $kpnum 1
if ($numlogged > 0)
	setVar $logloop 0
	:logloop
	if ($logloop < $numlogged)
		add $logloop 1
		subtract $logged[$usrlog[$logloop]] 1
		if ($logged[$usrlog[$logloop]] > 0)
			add $newlist 1
			setVar $usrlog[$newlist] $usrlog[$logloop]
		else
			gosub :globalPromptCheck
			if ($promptCheck = 1)
				send "'" $botName ": User, " $usrlog[$logloop] " logged off due to inactivity.*"
			end
		end
		goto :logloop
	end
	setVar $numlogged $newlist
end
if ($cim > 0)
	subtract $cimtimer 1
	if ($cimtimer <= 0)
		gosub :globalPromptCheck
		if ($promptCheck = 1)
			send "'" $botName "(cim): Updating CIM data.*"
			gosub :cimhunt_inc~runcim
			setVar $print_loop 0
			if ($cimhunt_inc~used_port_count > 0)
				getDate $date
				getTime $time
				write $cimhunt_inc~log_file $date & " " & $time
				waitfor "?"
				send "'*"
				:print_results
				if ($print_loop	< $cimhunt_inc~used_port_count)
					add $print_loop 1
					getWord $cimhunt_inc~change_port[$print_loop] $prtclass 4
					setVar $port_inc~classchk PORT.CLASS[$prtclass]
					gosub :port_inc~chkclass
					setVar $replace $prtclass & "(" & $port_inc~class & ")"
					replaceText $cimhunt_inc~change_port[$print_loop] $prtclass $replace
					send $cimhunt_inc~change_port[$print_loop] "*"
					write $cimhunt_inc~log_file $cimhunt_inc~change_port[$print_loop]
					goto :print_results
				else
					send "*"
				end
			end
			waitfor "(?="	
			setVar $cimtimer $cim
		end
	end
end
if ($clv > 0)
	subtract $clvtimer 1
	if ($clvtimer <= 0)
		gosub :globalPromptCheck
		if ($prompt = "Command") OR ($prompt = "Citadel")
			gosub :clv_inc~sendclv
			waitfor "(?="	
			setVar $clvtimer $clv
		end
	end
end
send "#"
if ($kpnum < 20)
	goto :alive
else
	setVar $kpnum 0
	goto :bot
end

:writeparms
if ($parms > 0)
	setVar $prmloop 0
	setVar $script[$srname] $script[$srname] & " " & $parms
	:prmloop
	if ($prmloop < $parms)
		add $prmloop 1
		setVar $script[$srname] $script[$srname] & " " & $parme[$prmloop]
		goto :prmloop
	end
end
setVar $parms 0
return

:pse
killtrigger chk
send "*"
goto :prmptchk
##########################################################################
:whoonline
killtrigger sscmd
killtrigger pgcmd
getWord CURRENTLINE $tst 1
if ($tst <> "Who's")
	goto :wf_command
end
setVar $old_list $num_new_list
setVar $poof 0
setVar $arrived_trader_count 0
if ($init <> 1)
:poof
	if ($poof < $old_list)
		add $poof 1
		setVar $old[$poof] $traders[$poof]	
		setVar $otrade[$traders[$poof]] 1
		setVar $List[$traders[$poof]] 0
		goto :poof
	end
end	

setVar $blank 0
waitfor "Who's Playing"
setVar $num_new_list 0
:whos_online
setTextLineTrigger get_names :name_grabber
pause

:name_grabber
setVar $whos_online_ansi CURRENTANSILINE
setVar $whos_online CURRENTLINE
if ($whos_online = "")
	add $blank 1
	if ($blank > 1)
		goto :print_list
	end
else
	add $num_new_list 1
	setVar $ranked_trader $whos_online
	gosub :striprank
	getLength $rstripped_trader $boogie
	if ($seen[$rstripped_trader] = 0)
		setVar $write 1
	else
		setVAr $write 0
	end
	getDate $date
	getTime $time "hh:mm:ss"
	setVar $seen[$rstripped_trader] $date & " " & $time
	if ($write = 1)
		write $seenlst $date & " " & $time & " " & $rstripped_trader
	end
	setVar $traders[$num_new_list] $rstripped_trader
	setVar $List[$rstripped_trader] 1
	if ($otrade[$rstripped_trader] = 0)
		if ($init <> 1)
			add $arrived_Trader_count 1
			setVar $arrived_Trader[$arrived_Trader_count] $rstripped_trader
		end
	end
end
goto :whos_online


:print_list

setVar $poop 0
setVar $departed_Trader_count 0

if ($init <> 1)
:poop
	if ($poop < $old_list)	
		add $poop 1
		setVar $oldname $old[$poop]
			if ($List[$oldname] = 0)
				add $departed_Trader_count 1
				setVar $otrade[$oldname] 0
				setVar $departed_Trader[$departed_Trader_count] $oldname
			end
		goto :poop
	end
end
setVar $init 0
if ($departed_Trader_count > 0)
	setVar $print_depart 0
	send "'*" $botName "(online): Departed Player[s]*"
:print_departed
	if ($print_depart < $departed_Trader_count)
		add $print_depart 1
		stripText $departed_Trader[$print_depart] "^"
		send " " $departed_Trader[$print_depart] "*"
		goto :print_departed
	else
		send "*"
	end
end
if ($arrived_Trader_count > 0)
	setVar $print_arrived 0
	send "'*" $botName "(online): New Player[s]*"
:print_arrived
	if ($print_arrived < $arrived_Trader_count)
		add $print_arrived 1
		stripText $arrived_Trader[$print_arrived] "^"
		send " " $arrived_Trader[$print_arrived] "*"
		goto :print_arrived
	else
		send "*"
	end
end
setVar $reader 1
setVar $cnter 0
gosub :updateseen
goto :wf_command

:striprank
getWordPos $whos_online_ansi $pos "[0m[1;31m"
if ($pos > 0)
	getText $whos_online_ansi $rank "[0m[1;31m" "[36m"
	setVar $rstripped_trader CURRENTLINE
	striptext $rstripped_trader $rank
	goto :stripcorp
end
getWordPos $whos_online_ansi $pos "[0m[32m"
if ($pos > 0)
	getText $whos_online_ansi $rank "[0m[32m" "[1;36m"
	setVar $rstripped_trader CURRENTLINE
	striptext $rstripped_trader $rank
	goto :stripcorp
end
getWordPos $whos_online_ansi $pos "[1;34m"
if ($pos > 0)
	getText $whos_online_ansi $rank "[1;34m" "[36m"
	setVar $rstripped_trader CURRENTLINE
	striptext $rstripped_trader $rank
	goto :stripcorp
end
getWordPos $whos_online_ansi $pos "[32m"
if ($pos > 0)
	getText $whos_online_ansi $rank "[32m" "[1;36"
	setVar $rstripped_trader CURRENTLINE
	striptext $rstripped_trader $rank
	goto :stripcorp
end
getWordPos $whos_online_ansi $pos "[1;31m"
if ($pos > 0)	
	getText $whos_online_ansi $rank "[1;31m" "[36m"
	setVar $rstripped_trader CURRENTLINE
	striptext $rstripped_trader $rank
end
:stripcorp
getWordPos $whos_online_ansi $pos "[[1;36m"
if ($pos > 0)
	getText $whos_online_ansi $corp "[[1;36m" "[0;34m]"
	stripText $rstripped_trader " [" & $corp & "]"
end
return
#################################################################
:readseen
read $seenlst $seenpeep $reader
if ($seenpeep <> "EOF")
	getWord $seenpeep $date 1
	getWord $seenpeep $time 2
	getLength $date $datelen
	getLength $time $timelen
	setVar $start ($datelen + $timelen + 3)
	cutText $seenpeep $guy $start 999
	setVar $seen[$guy] $date & " " & $time
	add $reader 1
	goto :readseen
end
return
################################################################
:updateseen
read $seenlst $seenpeep $reader
if ($seenpeep <> "EOF")
	add $cnter 1
	getWord $seenpeep $date 1
	getWord $seenpeep $time 2
	getLength $date $datelen
	getLength $time $timelen
	setVar $start ($datelen + $timelen + 3)
	cutText $seenpeep $guy $start 999
	setVar $newseen[$cnter] $seen[$guy] & " " & $guy
	add $reader 1
	goto :updateseen
end
setVar $looper 0
delete $seenlst
:seenlooper
if ($looper < $cnter)
	add $looper 1
	write $seenlst $newseen[$looper]
	goto :seenlooper
end
return	
####################################################################
:scanme
setVar $newlocation 0
waitfor "?"
setvar $liner 1
gosub :globalPromptCheck
if ($prompt = "Command")
	send "d"
elseif ($prompt = "Citadel") 
	send "s"
else
	if ($promptCheck = 1)
		send "'Invalid Prompt, could not scan.*"
	end
	return
end
settextlinetrigger scan :scan "<Scan Sector>"
settextlinetrigger scan2 :scan "<Re-Display>"
pause

:scan
killtrigger scan2
killtrigger scan
if ($newlocation = "Warps")
	goto :messageit 
else 
	settextlinetrigger scanner :scanner
	pause
end

:scanner
if (CURRENTLINE <> "")
	setvar $sline[$liner] CURRENTLINE
	cutText CURRENTLINE $newlocation 1 5
	striptext $newlocation " "
	add $liner 1 
end  
goto :scan  

:messageit
setvar $linecount 0
send "'*"

:linecount
if ($linecount < $liner)
	add $linecount 1
	getWord $sline[$linecount] $chk 1
	if (($chk = "Sector") OR ($chk = "Warps") OR ($chk = "Ports")) AND ($showsec = 0)
		replaceText $sline[$linecount] "1" "x"
		replaceText $sline[$linecount] "2" "x"
		replaceText $sline[$linecount] "3" "x"
		replaceText $sline[$linecount] "4" "x"
		replaceText $sline[$linecount] "5" "x"
		replaceText $sline[$linecount] "6" "x"
		replaceText $sline[$linecount] "7" "x"
		replaceText $sline[$linecount] "8" "x"
		replaceText $sline[$linecount] "9" "x"
		replaceText $sline[$linecount] "0" "x"
	end
	if ($chk = "Beacon") AND ($showsec = 0)
		goto :linecount
	end
	if ($chk = "Ports") AND ($showsec = 0)
		getText $sline[$linecount] $portname ": " ","
		getText $sline[$linecount] $porttype " (" ") "
		replaceText $sline[$linecount] $porttype "xxx"
		replaceText $sline[$linecount] $portname "Port Name"
	end
	if ($chk = 0)
		goto :linecount
	end
	send $sline[$linecount] "*"
	goto :linecount
end
send "*"
return
###############################################################

:displayhelp
waitFor "(?="
gosub :globalPromptCheck
if ($promptCheck = 0)
	goto :wf_command
end
setVar $trim_inc~word $user
gosub :trim_inc~trim
setVar $user $trim_inc~word
send "'*" $botName "(" $cmd "): Command help for " $user "."
if ($seclvl[$user] > 0)
	send "*Globals: ?"
	send " cim"
	send " clv"
	send " db"
	send " page"
	send " results"
	send " resetprompt/rp"
	if ($seclvl[$user] > 4)
		send " script/s"
	end
	send " seen"
	send " status*"
	setVar $hlpcommands 0
	send $prompt ":"
	if ($prompt = "Command")
		send " figrefresh"
		send " give"
		send " land/l"
		send " take"
		send " xport/x"
	end
	if ($prompt = "Citadel") OR ($prompt = "Planet")
		send " blast/b"
	end
	if ($prompt = "Command") OR ($prompt = "Citadel")
		send " photon/p"
		send " scan"
	end
end
if ($seclvl[$user] > 3)
	if ($prompt = "Command")
		send " express/e"
		send " twarp/tw"
	end
	if ($prompt = "Citadel")
		send " pwarp/pw"
	end
end
if ($seclvl[$user] > 4)	
	if ($prompt = "Command") OR ($prompt = "Citadel")
		send " dropcorp"
		send " joincorp"
	end
end
send "**"
return


:cmd_timeout
killalltriggers
gosub :globalPromptCheck
if ($promptCheck = 1)
	send "'" $botName "(" $cmd "): Command timed out, aborting command, restarting bot...*"
	send "#"
end
goto :bot

:disable
killalltriggers
waitFor "?"
gosub :globalPromptCheck
if ($promptCheck = 1)
	send "'" $botName "(" $cmd "): Bot Commands Disabled While Running Script*"
end
:continue_disable
killtrigger disable
killtrigger nodisable
killtrigger enable
setDelayTrigger nodisable :nodisable2 60000
setTextLineTrigger disable :continue_disable "SUPGBOT_DISABLE_COMMAND"
setTextLineTrigger enable :nodisable2 "SUPGBOT_ENABLE_COMMAND"
pause

:nodisable2
killtrigger disable
killtrigger nodisable
killtrigger enable
waitFor "?"
gosub :globalPromptCheck
if ($promptCheck = 1)
	send "'" $botName "(" $cmd "): Bot Commands Enabled, Script completed.*"
end
write stopscript.ts "stop " & $scriptname
load stopscript.ts
delete stopscript.ts
goto :bot

:disconnected
killalltriggers
waitFor "(?=Help)?"
goto :bot

:admin
killalltriggers
echo "[2J"
:errmenu
setVar $signature_inc~scriptName "SupGBot Admin"
setVar $signature_inc~version "1.a"
setVar $signature_inc~date "09/26/03"
gosub :signature_inc~signature
echo ANSI_15 "SupGBot Admin"
echo "**" ANSI_14 "1." ANSI_15 " Manage Users*"
if ($disable = 1)
	echo ANSI_14 "2." ANSI_15 " Enable Commands*"
else
	echo ANSI_14 "2." ANSI_15 " Disable Commands*"
end
echo ANSI_14 "3." ANSI_15 " Reload configuration file*"
echo ANSI_14 "h." ANSI_15 " Cim Hunter*"
echo ANSI_14 "t." ANSI_15 " CLV Check*"
echo ANSI_5 "*Press the number of the option you*wish to change, or press" ANSI_14 " C" ANSI_5 " to run*the script.*"
getConsoleInput $choice singlekey

if ($choice = 1)
	gosub :manageusers
elseif ($choice = 2)
	if ($disable = 1)
		setVar $disable 0
	else
		setVar $disable 1
	end
elseif ($choice = 3)
	gosub :readcnf
	goto :errmenu
elseif ($choice = "c")
	goto :bot
elseif ($choice = "h")
	getInput $cim "Time between cim checks, 0 disables checks."
	isnumber $heh $cim
	if ($heh = 0) OR ($cim < 0)
		setVar $cim 0
		goto :manageusers
	end
	if ($cim > 0)
		echo ANSI_15 "*Ignore port percentage changes?*"
		getConsoleInput $heh singlekey
		lowercase $heh
		if ($heh = "y")
			setVar $cimhunt_inc~ignore 1
		else
			setVar $cimhunt_inc~ignore 0
		end
	end
	setVar $cimtimer 0
elseif ($choice = "t")
	getInput $clv "Time between clv checks, 0 disables checks."
	isnumber $heh $clv
	if ($heh = 0) OR ($clv < 0)
		setVar $clv 0
		goto :manageusers
	end
	setVar $clvtimer 0
end
goto :admin


:manageusers
setVar $passchange 0
echo "[2J"
setVar $signature_inc~version "1.a"
setVar $signature_inc~date "09/26/03"
gosub :signature_inc~signature
echo ANSI_15 "SupGBot Admin - Manage Users*"
setVar $reader 2
setVAr $users 0
:rduselist
read $botusr $listusrs $reader
if ($listusrs <> "EOF")
	add $users 1
	setVar $userList[$users] $listusrs
	getWord $listusrs $listpassword 2
	getLength $listpassword $passlen	
	setVar $len ($passlen + 4)
	cutText $listusrs $user $len 9999
	echo ANSI_14 $users ". " ANSI_15 $user "*"
	add $reader 1
	goto :rduselist
end
if ($users = 0)
	echo "No users to list.*"
end
echo ANSI_14 "*a." ANSI_15 " Add user                "
echo ANSI_5 "*Press the number of the user you*wish to edit, or press" ANSI_14 " C" ANSI_5 " to go*back to main.*"
getConsoleInput $choice $singlekey
isNumber $chk $choice
if ($chk)
	if ($choice > 0) AND ($choice <= $users)
		:selectmenu
		echo "[2J"
		:savedmenu
		getWord $userList[$choice] $selectpassword 2
		getWord $userList[$choice] $slvl 1
		getLength $selectpassword $passlen	
		setVar $len ($passlen + 4)
		cutText $userList[$choice] $user $len 9999
		setVar $signature_inc~version "1.b"
		setVar $signature_inc~date "01/28/04"
		gosub :signature_inc~signature
		echo ANSI_15 "SupGBot Admin - Manage Users - " $user "*"
		echo ANSI_14 "1." ANSI_15 " Username              " ANSI_10 "["
		echo ANSI_6 $user
		echo ANSI_10 "]*"
		echo ANSI_14 "2." ANSI_15 " Password              " ANSI_10 "["
		echo ANSI_6 $selectpassword
		echo ANSI_10 "]*"
		echo ANSI_14 "3." ANSI_15 " Security Level        " ANSI_10 "["
		echo ANSI_6 $slvl
		echo ANSI_10 "]*"
		echo ANSI_14 "*d." ANSI_15 " Delete                "
		echo ANSI_5 "*Press the number of the user you*wish to edit, or press" ANSI_14 " C" ANSI_5 " to go*back to main.*"	
		getConsoleInput $choice2 $singlekey
		if ($choice2 = 1)
			getInput $newuser "Enter the username EXACTLY as it appears in the game."
			replaceText $userList[$choice] $user $newuser
			echo ANSI_15 "Your settings will be saved when you press C"
			goto :savedmenu
		elseif ($choice2 = 2)
			getInput $newpassword "Enter " & $user & "'s password. (No spaces)"
			setVar $userList[$choice] $slvl & " " & $newpassword & " " & $user
			if ($newpassword <> $selectpassword)
				setVar $passchange 1
			end
			echo ANSI_15 "Your settings will be saved when you press C"
			gosub :savedmenu
		elseif ($choice2 = 3)
			getInput $seclevel "Enter " & $user & "'s security level (1 - 5)."
			isNumber $isnum $seclevel 
			if ($isnum)
				if ($seclevel > 0) AND ($seclevel <= 5)
					setVar $userList[$choice] $seclevel & " " & $password & " " & $user
					echo ANSI_15 "Your settings will be saved when you press C"
				end
			end
		elseif ($choice2 = "d")
			delete $botusr
			write $botusr $botname
			setVar $cnt 0
			:resaveusrd
			if ($cnt < $users)
				add $cnt 1
				if ($cnt <> $choice)
					write $botusr $userList[$cnt]
				end
				goto :resaveusrd
			end
			goto :manageusers			
		elseif ($choice2 = "c")
			delete $botusr
			write $botusr $botname
			setVar $cnt 0
			:resaveusr
			if ($cnt < $users)
				add $cnt 1
				write $botusr $userList[$cnt]
				goto :resaveusr
			end
			if ($passchange = 1)
				gosub :globalPromptCheck
				if ($promptCheck = 0)
					goto :wf_command
				end
				send "=" $user "*"
				setTextTrigger conest :conest "Secure comm-link established, Captain."
				setTextTrigger conmail :conest "Rerouting message to Galactic M.A.I.L. Server."
				setTextTrigger noex :conno "Unknown Trader!"
				setTextTrigger domean :domean "Do you mean"
				pause
	
				:conest
				send $botName "(admin): Your SupGBot password has been changed to : " $selectpassword "**"
				waitFor "terminated."
				

				:conno
				killtrigger noex
				killtrigger conest
				killtrigger conmail
				killtrigger domean
				goto :manageusers
			
				:domean
				killtrigger conest
				killtrigger conmail
				killtrigger domean
				send "n"
				setTextTrigger domean :domean "Do you mean"
				pause
			end
			goto :manageusers
		end
		goto :selectmenu
	end
else
	if ($choice = "c")
		goto :admin
	end
	if ($choice = "a")
		gosub :adduser
	end
end
goto :manageusers
return

:globalPromptCheck
setVar $promptCheck 0
getWord CURRENTLINE $prompt 1
if ($prompt = "Command") OR ($prompt = "Citadel") OR ($prompt = "Computer") OR ($prompt = "Corporate") OR ($prompt = "<StarDock>") OR ($prompt = "Planet") OR ($prompt = "Engage") OR ($prompt = "Option?") OR ($prompt = "<Tavern>")
	setVar $promptCheck 1
end
return


include "supginclude\gameinfo_inc.ts"
include "supginclude\signature_inc.ts"
include "supginclude\ship_inc.ts"
include "supginclude\planet_inc.ts"
include "supginclude\corp_inc.ts"
include "supginclude\trim_inc.ts"
include "supginclude\cimhunt_inc.ts"
include "supginclude\clv_inc.ts"
include "supginclude\port_inc.ts"
include "supginclude\nearfig_inc.ts"
include "supginclude\db_inc.ts"


