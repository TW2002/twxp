# Oz-Bot 2.0
setVar $version "1.09b"

#Initializations  =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:getInitial_Settings
	fileExists $file_cheker "scripts\_ck_buydown.cts"
	if ($file_cheker = 0)
		echo ansi_12 "* You need to download Cherokee's Buydown for bot to function*"
		halt
	end
	fileExists $file_cheker "scripts\_ck_planet_nego.cts"
	if ($file_cheker = 0)
		echo ansi_12 "* You need to download Cherokee's Planet Nego for bot to function*"
		halt
	end
	fileExists $file_cheker "scripts\_ck_saveme.cts"
	if ($file_cheker = 0)
		echo ansi_12 "* You need to download Cherokee's Saveme for bot to function*"
		halt
	end
	setVar $_ck_username LOGINNAME
	setVar $_ck_password PASSWORD
	setVar $_ck_letter GAME
	setVar $keepalive_ctr 0
	setVar $gconfig_file GAMENAME & ".stbot"
	setVar $init 1
	setVar $warn "OFF"
	fileExists $gfile_chk $gconfig_file
	setVar $mode "General"
	if ($gfile_chk = 1)
		loadVar $mbbs
		loadVar $steal_factor
		loadVar $rob_factor
		read $gconfig_file $bot_name 1
		loadVar $corpycount
		setVar $corpiesCount 1
		while ($corpiesCount <= $corpycount)
			loadVar $corpy[$corpiesCount]
			add $corpiesCount 1
		end
		goto :run_bot
	else
:conf_bot	
	send "'<ST-Bot> - Initializing... *"
	send "'<ST-Bot> - Momentary Com Blackout...*"
	send "|"
	setTextTrigger com_check :com_check "all messages."
	pause
:com_check
	getWord CURRENTLINE $com_check 1
	if ($com_check = "Displaying")
		send "|"
	end
	echo ANSI_13 "*This Game is not configured for ST-Bot, doing this now.*"
	gosub :quikstats
	gosub :add_game
	send "|"
	gosub :getCorpies
	gosub :gameStats
	goto :run_bot
	end	
#GameStats =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:gamestats
	if ($location = "Citadel")
		send "qqzn"
	end
	if (PASSWORD = "")
		getInput $password "Please Enter your Game password"
	end
	send "qyn"
	send #42 "*"
	waitFor "MBBS Compatibility="
	getWord CURRENTLINE $mbbs_ck 2
	stripText $mbbs_ck "Compatibility="
	if ($mbbs_ck = "True")
		setVar $mbbs 1
		saveVar $mbbs
	elseif ($mbbs_ck = "False")
		setVar $mbbs 0
		saveVar $mbbs
	end
	waitFor "Trade Percent="
	getWord CURRENTLINE $_ck_ptradesetting 2
	stripText $_ck_ptradesetting "Percent="
	stripText $_ck_ptradesetting "%"
	saveVar $_ck_ptradesetting
	waitFor "Steal Factor="
	getWord CURRENTLINE $steal_factor 2
	stripText $steal_factor "Factor="
	stripText $steal_factor "%"
	saveVar $steal_factor
	waitFor "Rob Factor="
	getWord CURRENTLINE $rob_factor 2
	stripText $rob_factor "Factor="
	stripText $rob_factor "%"
	saveVar $rob_factor
	send "t*n*" 
	if (PASSWORD = "")
		send $password
	else
		send PASSWORD
	end
	send "**  zaznznza999*zn"
	if ($quikstats[$h[1]] > 11) and ($quikstats[$h[1]] <> STARDOCK)
		send "f1*cd"
	end
	waitFor "(?="
	return


#GetCorpies =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:getCorpies
	setVar $corpyCount 0
	waitFor "(?="
	getWord CURRENTLINE $location 1 
	if ($location = "Planet") or ($location = "Computer")
		send "q"
		setVar $location "Command"
	elseif ($location = "Citadel") or ($location = "Command")
		goto :grabCorpies
	else
		send "'<" $bot_name "> - Invalid Start Prompt - Halting*"
		halt
	end
:grabCorpies
	if ($location = "Citadel")
		send "xaq"
	elseif ($location = "Command")
		send "taq"
	end
	WaitFor "--------------------------"
:parseCorpies
	setTextLineTrigger corpies :corpies ""
	pause
:corpies
	getWord CURRENTLINE $corpy_prompt_ck 1
	if ($corpy_prompt_ck = "Corporate") or ($corpy_prompt_ck = 0) or ($corpy_prompt_ck = "P")
		goto :doneWithCorpies
	end
	add $corpyCount 1
	cutText CURRENTLINE $corpy[$corpyCount] 1 39
	setVar $pos 38
:stripCorpies
	cutText $corpy[$corpycount] $blank_ck $pos 1
	if ($blank_ck = " ")
		cutText $corpy[$corpyCount] $corpy[$corpyCount] 1 $pos
		subtract $pos 1
		goto :stripCorpies
	else
		cutText $corpy[$corpyCount] $corpy[$corpyCount] 1 $pos
		saveVar $corpy[$corpycount]
		saveVar $corpyCount
		goto :parseCorpies
	end

:doneWithCorpies
	return
	


#Wait for Commands =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
:run_bot
	gosub :startCNsettings
	send "'<" $bot_name "> is ACTIVE: Version - " $version " - type " #34 $bot_name " help" #34 " for command list*"
	send "'<" $bot_name "> - to login - hail user with " #34 " use " $bot_name " " #34 " *"
	if ($_ck_username = "") or ($_ck_password = "") or ($_ck_letter = "")
		send "'<" $bot_name "> - Auto Relog - Not Active*"
	end
	waitFor "Message sent on sub-space"
	waitFor "(?="
:initiate_bot
gosub :quikstats
#<><><>Main<><><>
:wait_for_command
	setVar $warpies 1
	killAllTriggers
	setVar $authorization 0
	setVar $logged 0
	if ($mode = "Reloader")
		setTextLineTrigger reload :sub_reload "Shipboard Computers"
	end
:photon_sub_command
	if ($mode = "Photon")
		setDelayTrigger resetdelay :load_photon 300000
		While ($warpies <= $pwarps)
			setTextTrigger phot&$warpies :shoot&$warpies "Deployed Fighters Report Sector "&SECTOR.WARPS[$psec][$warpies]&":"
			setTextTrigger limp&$warpies :shoot&$warpies "Limpet mine in "&SECTOR.WARPS[$psec][$warpies]&" activated"
			add $warpies 1
		end
	end
	if ($mode <> "Photon")	
		setTextLineTrigger findfig :findfig "Deployed Fighters Report Sector"	
	end
	setTextLineTrigger own_command :check_routing $bot_name
	seteventtrigger relog :relog "CONNECTION LOST"
	setDelayTrigger online_watch :online_watch 300000
	pause



#Command Routing =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

:check_routing
getWord CURRENTLINE $routing 1
if ($routing = "'"&$bot_name)
	goto :own_command
elseif ($routing = "P")
	goto :page_command
elseif ($routing = "R")
	goto :command
else
	killAllTriggers
	goto :wait_for_command
end


:own_command
killAllTriggers
cutText CURRENTANSILINE $ansi_ck1 1 6
if ($ansi_ck1 <> "[35m'")
	goto :wait_for_command
end
getWord CURRENTLINE $radio_type 1
stripText $radio_type $bot_name
if ($radio_type = "'")
	setVar $user_sec_level 9
	cutText CURRENTLINE $command_line 2 999
	getWord CURRENTLINE $command 2
	getWord CURRENTLINE $parm1 3
	getWord CURRENTLINE $parm2 4
	getWord CURRENTLINE $parm3 5
	getWord CURRENTLINE $parm4 6
	getWord CURRENTLINE $parm5 7
	getWord CURRENTLINE $parm6 8
	getWord CURRENTLINE $parm7 9
	getWord CURRENTLINE $parm8 10
	goto :pah
else
	goto :wait_for_command
end

:page_command
	killAllTriggers
	getWord CURRENTLINE $radio_type 1
	if ($radio_type = "P")
		cutText CURRENTLINE $user_name 3 6
		setVar $key_name $user_name
		stripText $user_name " "
		gosub :verify_user_status
		if ($authorization = 0)
			goto :wait_for_command
	 	end
		cutText CURRENTLINE $command_line 9 999
		stripText $command_line " "
		if ($command_line = "use"&$bot_name)
			goto :loginout
		end
	else
		goto :wait_for_command
	end

:command
killAllTriggers
setVar $ansi_line CURRENTANSILINE
stripText $ansi_line "[1A"
cutText $ansi_line $ansi_ck2 1 9

if ($ansi_ck2 <> "[K[36mR")
#	write GAMENAME & ".ansi" "bad=" & $ansi_ck2
	goto :wait_for_command
end
#write GAMENAME & ".ansi" "good=" & $ansi_ck2
getWord CURRENTLINE $radio_type 1
if ($radio_type = "R")
	cutText CURRENTLINE $user_name 3 6
	stripText $user_name " "
	cutText CURRENTLINE $ta_id 3 6
	cutText CURRENTLINE $command_line 10 999
	getWord $command_line $botname_chk 1
	if ($botname_chk <> $bot_name)
		goto :wait_for_command
	end
		lowerCase $command_line
	getWord $command_line $command 2
	getWord $command_line $parm1 3
	getWord $command_line $parm2 4
	getWord $command_line $parm3 5
	getWord $command_line $parm4 6
	getWord $command_line $parm5 7
	getWord $command_line $parm6 8
	getWord $command_line $parm7 9
	getWord $command_line $parm8 10
#	stripText $user_name " "
	gosub :verify_user_status
	if ($authorization = 0)
		goto :wait_for_command
 	end
	gosub :chk_login
	if ($logged = 0)
		send "'<" $bot_name "> - You must log in to use " $bot_name "*"
		goto :wait_for_command
	end
else
	goto :wait_for_command
end



#=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
:pah
killAllTriggers
lowerCase $command
lowerCase $parm1
lowerCase $parm2
if ($command = "qss") 
	goto :qss
elseif ($mode = "Finder") and ($command = "f") or ($command = "fig") or ($command = "nf") or ($command = "fp") or ($command = "p") or ($command = "de")
	goto :finder
elseif ($command = "help")
	goto :command_list
elseif ($command = "runaway") and ($mode = "Runaway") or ($mode = "General")
	goto :runaway	
elseif ($command = "saveme") and ($mode = "SaveMe") or ($mode = "General")
	goto :saveme
elseif ($command = "mac")
	goto :mac
elseif ($command = "nmac")
	goto :nmac
elseif ($command = "cim")
	goto :go_cim
elseif ($command = "status")
	goto :status
elseif ($command = "warn") and ($mode <> "Photon")
	goto :warn
elseif ($command = "figs") and ($mode = "General") or ($mode = "Finder")
	goto :bot_refresh_figs
elseif ($command = "page")
	goto :page
elseif ($command = "photon") and ($mode = "General") or ($mode = "Photon")
	goto :photon
elseif ($command = "mega") and ($mode = "General")
	goto :mega
elseif ($command = "rob") and ($mode = "General")
	goto :rob
elseif ($command = "land")
	goto :land
elseif ($command = "reloader") and ($mode = "Reloader") or ($mode = "General")
	goto :reloader
elseif ($command = "lift")
	goto :lift
elseif ($command = "buy") and ($mode = "General")
	goto :buy
elseif ($command = "neg") and ($mode = "General")
	goto :neg
elseif ($command = "finder") and ($mode = "General") or ($mode = "Finder")
	goto :finder
elseif ($mode = "SaveMe") and ($command = "mega") or ($command = "rob") or ($command = "buy") or ($command = "neg") or ($command = "reloader") or ($command = "figs") or ($command = "finder")
	send "'<" $bot_name "> - You must Deactivate SaveMe to access this function*"
elseif ($mode = "Reloader") and ($command = "mega") or ($command = "rob") or ($command = "buy") or ($command = "neg") or ($command = "saveme") or ($command = "figs") or ($command = "finder")
	send "'<" $bot_name "> - You must Deactivate Reloader to access this function*"
elseif ($mode = "Photon") and ($command = "mac") or ($command = "nmac") or ($command = "mega") or ($command = "rob") or ($command = "buy") or ($command = "neg") or ($command = "saveme") or ($command = "figs") or ($command = "finder")
	send "'<" $bot_name "> - You must Deactivate Adjacent Photon to access this function*"
elseif ($mode = "Finder") and ($command = "mac") or ($command = "nmac") or ($command = "mega") or ($command = "rob") or ($command = "buy") or ($command = "neg") or ($command = "reloader") or ($command = "saveme") or ($command = "photon")
	send "'<" $bot_name "> - You must Deactivate Finder to access this function*"
else
	send "'<" $bot_name "> - Invalid Command*"
end
goto :wait_for_command
halt

:loginout
	send "=" $Corpy[$corpieCount] "*"
	setTextLineTrigger WrongName :wrongname "Unknown Trader!"
	setTextLineTrigger offline :wrongname "Galactic M.A.I.L."
	setTextLineTrigger rightName :rightName "Secure comm-link established,"
	pause

:wrongName 
	killAllTriggers
	goto :wait_for_command
:rightName
	killAllTriggers
	getRnd $key 100 999
	send $key ": You have 5 seconds to type " $key " on subspace**"
	setTextLineTrigger key :key "R"&" "&$key_name&" "&$key
	setDelayTrigger keyDelay :keyDelay 5000
	pause

:keyDelay
	killAllTriggers
	setVar $loggedin[$user_name] 0
	goto :wait_for_command

:key
	killAllTriggers
	setVar $loggedin[$user_name] 1
	send "'<" $bot_name "> - User Verified - " $corpy[$corpiecount] "*"
	goto :wait_for_command
			

#Add Game =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:add_game
	echo ANSI_13 "*What is the 'in game' name of the bot? (one word, no spaces)*"
	getConsoleinput $new_bot_name
	stripText $new_bot_name "^"
	stripText $new_bot_name " "
	if ($new_bot_name = "")
		goto :add_game
	end
	write $gconfig_file $new_bot_name
	setVar $bot_name $new_bot_name
	return 

#Security =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-=-=-
#User Verification
:verify_user_status
	setVar $corpieCount 1
:verify
	if ($corpieCount > $corpyCount)
		setVar $authorization 0
		goto :end_verify
	end
	cutText $corpy[$corpieCount] $name 1 6
	stripText $name " "
	if ($user_name = $name)
		setVar $authorization 1
		goto :end_verify
	else
		add $corpieCount  1
		goto :verify
	end
	
:end_verify
	return

#check logged in
:chk_login
	if ($loggedin[$user_name] = 1)
		setVar $logged 1
	else
		setVar $logged 0
	end
	return



#qss =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:qss
	setVar $space[1] 18
	setVar $space[2] 18
	setVar $space[3] 18
	setVar $space[4] 14
	setVar $space[5] 14
	setVar $space[6] 10
	setVar $space[7] 10
	setVar $space[8] 10
	setVar $space[9] 10
	setVar $space[10] 10
	setVar $space[11] 14
	setVar $space[12] 12
	setVar $space[13] 12
	setVar $space[14] 12
	setVar $space[15] 11
	setVar $space[16] 9
	setVar $space[17] 12
	setVar $space[18] 12
	setVar $space[19] 14
	setVar $space[20] 11
	setVar $space[21] 14
	setVar $space[22] 11
	setVar $space[23] 11
	setVar $space[24] 11
	setVar $space[25] 18
	setVar $space[26] 18
	setVar $space[27] 0
	setVar $qss_ss 0
	setVar $qss_count 0
	setVar $spc " "
	gosub :quikstats
	setVar $overall 15

:qss_gather
	add $qss_count 1
	setVar $spc_count 1
	setVar $qss_var[$qss_count] $h[$qss_count]&" = "&$quikstats[$h[$qss_count]]
	getLength $qss_var[$qss_count] $length
	subtract $space[$qss_count] $length
	while ($spc_count <= $space[$qss_count])
		mergeText $qss_var[$qss_count] $spc $qss_var[$qss_count]
		add $spc_count 1
	end
	if ($qss_count = 26)
		goto :qss_send
	else
		goto :qss_gather
	end

:qss_send
	send "'*"
	send $qss_var[1]&"|"&$qss_var[6]&"|"&$qss_var[4]&"|"&$qss_var[12]&"|"&$qss_var[15]&"*"
	send $qss_var[2]&"|"&$qss_var[7]&"|"&$qss_var[5]&"|"&$qss_var[13]&"|"&$qss_var[23]&"*"
	send $qss_var[3]&"|"&$qss_var[8]&"|"&$qss_var[11]&"|"&$qss_var[14]&"|"&$qss_var[24]&"*"
	send $qss_var[25]&"|"&$qss_var[9]&"|"&$qss_var[19]&"|"&$qss_var[18]&"|"&$qss_var[22]&"*"
	send $qss_var[26]&"|"&$qss_var[10]&"|"&$qss_var[21]&"|"&$qss_var[17]&"|"&$qss_var[20]&"**"
	
goto :wait_for_command


#quickstats -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:quikstats
	setVar $h[1] "Sect"
	setVar $h[2] "Turns"
	setVar $h[3] "Creds"
	setVar $h[4] "Figs"
	setVar $h[5] "Shlds"
	setVar $h[6] "Hlds"
	setVar $h[7] "Ore"
	setVar $h[8] "Org"
	setVar $h[9] "Equ"
	setVar $h[10] "Col" 
	setVar $h[11] "Phot"
	setVar $h[12] "Armd"
	setVar $h[13] "Lmpt"
	setVar $h[14] "GTorp"
	setVar $h[15] "TWarp"
	setVar $h[16] "Clks"
	setVar $h[17] "Beacns"
	setVar $h[18] "AtmDt"
	setVar $h[19] "Crbo"
	setVar $h[20] "EPrb"
	setVar $h[21] "MDis"
	setVar $h[22] "PsPrb"
	setVar $h[23] "PlScn"
	setVar $h[24] "LRS"
	setVar $h[25] "Aln"
	setVar $h[26] "Exp"
	setVar $h[27] "Ship"
	setVar $cnt 0
	send "/"
:chk
	setTextLineTrigger getLine :getLine
	pause

:getLine
	killtrigger done
	add $cnt 1
	setVar $culine CURRENTLINE
	replaceText $culine #179 " " & #179 & " "
	setVar $line[$cnt] $culine
	getWordPos $culine $pos " Ship "
	if ($pos > 0)
	     goto :done_read_qss
	end
	goto :chk

:done_read_qss
	killtrigger getLine
	setVar $hcount 0
:hcount
	if ($hcount < 27)
	     add $hcount 1
	     setVar $lncount 1
:lncount
	     if ($lncount < $cnt)
        	  add $lncount 1
	          getWordPos $line[$lncount] $pos $h[$hcount]
	          if ($pos > 0)
	               setVar $work $line[$lncount]
	               cutText $work $work $pos 9999
	               upperCase $h[$hcount]
	               getWord $work $quikstats[$h[$hcount]] 2
	               stripText $quikstats[$h[$hcount]] ","
	          else
	               goto :lncount
	          end
	     end
	     goto :hcount
	end
	return

#mac=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
:mac
	gosub :quikstats
	setVar $mac_send_count 0
	stripText $command_line $bot_name
	StripText $command_line " mac "
	replaceText $Command_line "^m" "*"
	replaceText $command_line #42 "*"
:mac_send_it
	send $command_line

:end_mac_send
	send "'<" $bot_name "> - Macro Complete*"
	goto :wait_for_command

#nmac =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
:nmac
	gosub :quikstats
	setVar $nmac_send_count 0
	setVar $nmac_count 0
	stripText $command_line $bot_name
	StripText $command_line " nmac "
	getWord $command_line $nmac 1
	if ($nmac = 0)
		send "'<" $bot_name "> - Invalid Macro Count*"
		goto :wait_for_command
	end
	stripText $command_line $nmac&" "
	replaceText $Command_line "^m" "*"
	replaceText $command_line #42 "*"
:nmac_send_it
	send $command_line
		add $nmac_count 1
		if ($nmac_count = $nmac)
			goto :end_nmac_send
		else
			setVar $nmac_send_count 0
			goto :nmac_send_it
		end
	goto :nmac_send_it

:end_nmac_send
	send "'<" $bot_name "> - Numbered Macro - " $nmac " Cycles Complete*"
	goto :wait_for_command
#mega =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
:mega
	gosub :quikstats
	cutText $quikstats[$h[25]] $neg_ck 1 1
	setVar $align $quikstats[$h[25]]
	stripText $align "-"
	if ($align < 100) and ($neg_ck = "-")
		send "'<" $bot_name "> - Need -100 Alignment Minimum*"
		goto :wait_for_command
	elseif ($neg_ck <> "-")
		send "'<" $bot_name "> - Need -100 Alignment Minimum*"
		goto :wait_for_command 
	end
	waitFor "(?="
	getWord CURRENTLINE $location 1
	if ($location = "Planet") or ($location = "Computer")
		send "q"
		goto :mega
	end
	if ($location = "Citadel")
		send "qdq"
		waitFor "Planet #"
		getWord CURRENTLINE $planet 2
		stripText $planet "#"
	end
	setVar $second_mega 0
	setVar $mega_min 2970000
	setVar $mega_max 5939999
	send "pr*r"
	setTextLineTrigger fake :mega_fake "Busted!"
	setTextLinetrigger mega :mega_ok "port has in excess of"
	pause

:mega_fake
	killAllTriggers
	if ($location = "Citadel")
		send "l" $planet "*c"
	end
	send "'<" $bot_name "> - Fake Busted*"
	goto :wait_for_command

:mega_ok
	killAllTriggers
	getWord CURRENTLINE $port_cash 11
	stripText $port_cash ","
	if ($port_cash < $mega_min)
		multiply $port_cash 10
		divide $port_cash 9
		setVar $mega_short 3300000
		subtract $mega_short $port_cash
		send "0*"
		if ($location = "Citadel")
			send "l" $planet "*c"
		end
		send "'<" $bot_name "> - Port is short " $mega_short " credits*"
		goto :wait_for_command
	end
	setVar $actual_cash $port_cash
	multiply $actual_cash 10
	divide $actual_cash 9
	setVar $mega_cash $actual_cash
	if ($actual_cash >= 3300000)
:mega_loop
		if ($mega_cash > 6600000)
			subtract $mega_cash 3300000
			add $leftover_cash 3300000
			setVar $second_mega 1
			goto :mega_loop
		end
		if ($second_mega = 0)
			send $actual_cash "*"
		elseif ($second_mega = 1)
			send $mega_cash "*"
			setVar $actual_cash $mega_cash
		end
	
	end
		
		setTextLineTrigger mega_suc :mega_suc "Success!"
		setTextLineTrigger mega_bust :mega_bust "Busted!"
		pause

:mega_bust
		killAllTriggers
		if ($location = "Citadel")
			send "l" $planet "*c"
		end
		send "'<" $bot_name "> - Busted*"
		goto :wait_for_command
:mega_suc
		killAllTriggers
		if ($location = "Citadel")
			send "l" $planet "*ctt" $actual_cash "*"
		end
		send "'<" $bot_name "> - Success! - " $actual_cash " credits robbed*"
		if ($second_mega = 1)
			send "'<" $bot_name "> - There are " $leftover_cash " credits left for a second mega*"
			setvar $leftover_cash 0
		end
		goto :wait_for_command

#rob =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:rob
	gosub :quikstats
	cutText $quikstats[$h[25]] $neg_ck 1 1
	setVar $align $quikstats[$h[25]]
	setVar $xp $quikstats[$h[26]]
	stripText $align "-"
	if ($align < 100) and ($neg_ck = "-")
		send "'<" $bot_name "> - Need -100 Alignment Minimum*"
		goto :wait_for_command
	elseif ($neg_ck <> "-")
		send "'<" $bot_name "> - Need -100 Alignment Minimum*"
		goto :wait_for_command 
	end
	waitFor "(?="
	getWord CURRENTLINE $location 1
	if ($location = "Planet") or ($location = "Computer")
		send "q"
		goto :rob
	end
	if ($location = "Citadel")
		send "qdq"
		waitFor "Planet #"
		getWord CURRENTLINE $planet 2
		stripText $planet "#"
	end
	send "pr*r"
	setTextLineTrigger fake :rob_fake "Busted!"
	setTextLinetrigger mega :rob_ok "port has in excess of"
	pause

:rob_fake
	killAllTriggers
	if ($location = "Citadel")
		send "l" $planet "*c"
	end
	send "'<" $bot_name "> - Fake Busted*"
	goto :wait_for_command

:rob_ok
	killAllTriggers
	setvar $rob $xp
	multiply $rob 3
	multiply $rob 100
	divide $rob $rob_factor
	getWord CURRENTLINE $port_cash 11
	stripText $port_cash ","
	multiply $port_cash 10
	divide $port_cash 9
	if ($port_cash >= $rob) 
		send $rob "*"
	elseif ($port_cash < $rob)
		setVar $rob $port_cash
		send $rob "*"
	end
		
		setTextLineTrigger port_empty :rob_suc "Maybe some other day, eh?"
		setTextLineTrigger mega_suc :rob_suc "Success!"
		setTextLineTrigger mega_bust :rob_bust "Busted!"
		pause

:rob_bust
		killAllTriggers
		if ($location = "Citadel")
			send "l" $planet "*c"
		end
		send "'<" $bot_name "> - Busted*"
		goto :wait_for_command
:rob_suc
		killAllTriggers
		if ($location = "Citadel")
			send "l" $planet "*ctt" $rob "*"
		end
		send "'<" $bot_name "> - Success! - " $rob " credits robbed*"
		goto :wait_for_command






#land =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:land
	setTextTrigger landprompt :cont_land "(?="
	setDelayTrigger timeout :timeout 5000
	pause
:cont_land
	killAllTriggers
	getWord CURRENTLINE $location 1
	if ($location <> "Command")
		send "'<" $bot_name "> - Not at Command Prompt*"	
		goto :wait_for_command
	end
	setVar $planet $parm1
	isNumber $number $planet
		if ($number = 0) or ($planet = 0)
			send "'<" $bot_name "> - Incorrect Planet number*"
			goto :wait_for_command
		end
	send "l" $planet "*znzn*"
	setTextLineTrigger noplanet :noplanet "There isn't a planet in this sector."
	setTextLineTrigger no_land :no_land "since it couldn't possibly stand"
	setTextLineTrigger planet :planet "Planet #"
	setTextLineTrigger wrongone :wrong_num "That planet is not in this sector."
	pause

:noplanet
	killAllTriggers
	send "'<" $bot_name "> - No Planet in Sector!*"
	goto :Wait_for_command

:no_land
	killAllTriggers
	send "'<" $bot_name "> - This ship cannot land!*"
	goto :wait_for_command

:planet
	getWord CURRENTLINE $pnum_ck 2
	stripText $pnum_ck "#"
	if ($pnum_ck <> $planet)
		killAllTriggers
		send "q"
		goto :wrong_num
	end
	killAllTriggers
	setTextTrigger wrong_num :wrong_num "That planet is not in this sector."
	setTextTrigger planet :planet_prompt "Planet command"
	pause

:wrong_num 
	killAllTriggers
	send "**'<" $bot_name "> - Incorrect Planet Number*"
	goto :wait_for_command

:planet_prompt
	killAllTriggers
	send "c"
	setTextTrigger build_cit :build_cit "Do you wish to construct one?"
	setTextTrigger in_cit :in_cit "Citadel command"
	pause

:build_cit
	killAllTriggers
	send "n*'<" $bot_name "> - At Planet Prompt - No Cit*"
	setVar $bot_planet $planet 
	goto :wait_for_command

:in_cit
	killAllTriggers
	send "'<" $bot_name "> - In Cit - Planet " $planet "*"
	setVar $bot_planet $planet 
	goto :wait_for_command

#lift =-=-=-=-=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=
:lift
	setTextTrigger landprompt :cont_lift "(?="
	setDelayTrigger timeout :timeout 5000
	pause
:cont_lift
	killAllTriggers
	getWord CURRENTLINE $location 1
	if ($location = "Computer")
		send "q"	
		waitFor "<Computer deactivated>"
		goto :lift
	end
	if ($location = "Planet") 
		send "qza999**"
		setVar $bot_planet 0
	elseif ($location = "Citadel")
		send "qqza999**"
		setVar $bot_planet 0
	else
		send "'<" $bot_name "> - Incorrect Prompt*"
	end
	goto :wait_for_command

#status =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:status
	gosub :quikstats
	setTextTrigger landprompt :cont_status "(?="
	setDelayTrigger timeout :timeout 5000
	pause
:cont_status
	killAllTriggers
	GetWord CURRENTLINE $location 1
	if ($location = "Command") or ($location = "Citadel")
		send "i"
		setTextLineTrigger checkig :checkig "Interdictor ON :"
		setTextLineTrigger noig :noig "Credits"
		pause

:checkig
		getWord CURRENTLINE $igstat 4
		goto :doneig

:noig
		setVar $igstat "NO IG"
	else
		setVar $igstat "Invalid Prompt"
	end
:doneig
		killAllTriggers
	send "'<" $bot_name "> --- Status Report ---*"
	send "'       - Sector  = " $quikstats[$h[1]] "*"
	send "'       - Prompt  = " $location "*"
	send "'       - Turns   = " $quikstats[$h[2]] "*"
	send "'       - Photons = " $quikstats[$h[11]] "*"
	send "'       - Mode    = " $mode "*"
	send "'       - IG      = " $igstat "*"
	send "'       - Warning = " $warn
	if ($warn = "ON")
		send " - Sector - " $warn_sec " - " $warn_hops " hop(s)*"
	elseif ($warn = "OFF")
		send "*"
	end
	goto :wait_for_command 

#reloader =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:reloader
	gosub :quikstats
	setTextTrigger landprompt :cont_reloader "(?="
	setDelayTrigger timeout :timeout 5000
	pause
:cont_reloader
	killAllTriggers
	if ($parm1 = "off")
		setVar $mode "General"
		send "'<" $bot_name "> - Deactivating Reloader*"
		goto :wait_for_command
	elseif ($mode = "Reloader") and ($parm1 = "on")
		send "'<" $bot_name "> - Reloader Already Active - Using Planet " $planet "*"
		goto :wait_for_command
	end
	getWord CURRENTLINE $location 1
	if ($location <> "Citadel") and ($location <> "Planet")
		send "'<" $bot_name "> - Must start at planet or cit prompt*"
		goto :wait_for_command
	end
	if ($parm1 = "on")
		setVar $mode "Reloader"
	else
		send "'<" $bot_name "> - Please select (on/off) for reloader*"
		goto :wait_for_command
	end
	if ($location = "Citadel")
		send "q"
	end
	send "d"
	waitFor "Planet #"
	getWord CURRENTLINE $planet 2
	stripText $planet "#"
	send "q"
	send "\"
	setTextLineTrigger flee_off :flee_off "Online Auto Flee is disabled."
	setTextLineTrigger flee_on :flee_on "Online Auto Flee is enabled."
	pause

:flee_on
	killAllTriggers
	send "\"

:flee_off
	killAllTriggers
	isNumber $number $parm2
	if ($number = 0) or ($parm2 = 0)
		setVar $threshold $quikstats[$h[4]]
		divide $threshold 2
	else
			setVar $threshold $parm2
	end
	send "'<" $bot_name "> - Reloader Active - Using Planet " $planet " - " $threshold " fig threshold*"
	goto :wait_for_command
		
:sub_reload
	killAllTriggers	
	getWord CURRENTANSILINE $ck 1
	getWord CURRENTLINE $ck2 4
	getWord CURRENTLINE $ck3 5
	getWord CURRENTLINE $ck4 6
	getWord CURRENTLINE $ck5 7
	if ($ck <> "[K[1A[1;33mShipboard")
		killAllTriggers
		goto :wait_for_command
	end
# -=-=-=-- new section -=-=-=-=-=-=-
	setVar $reloaderline CURRENTLINE
	GetWordPos $reloaderLine $reloaderCheck "destroyed"
	if ($reloaderCheck = 0)
		echo "Found no damage"
		goto :wait_for_command
	end
	While ($reloaderCheck <> 0)
		SetVar $PreviousreloaderLine $reloaderLine
		CutText $PreviousreloaderLine $reloaderLine ($reloaderCheck + 10) 999
		GetWordPos $reloaderLine $reloaderCheck "destroyed"
	end
	GetWordPos $PreviousreloaderLine $reloaderCheck "destroyed"
	CutText $PreviousreloaderLine $PreviousreloaderLine $reloaderCheck 9999
	getText $PreviousreloaderLine $FigDamage "destroyed" "fighters."
	stripText $FigDamage "shield points and"
	getWord $FigDamage $Shield_pnts 1
	getWord $FigDamage $Fig_pnts 2

# -=-=-=-=- new section end -=-=-=-=-=-=-=-
# Shipboard Computers Coke 1 destroyed 5 shield points and 30 fighters.

#	if ($ck2 = "destroyed") or ($ck3 = "destroyed") or ($ck4 = "destroyed") or ($ck5 = "destroyed")
#		killAllTriggers
#		goto :get_loss
#	else
#		goto :wait_for_command
#	end
#:get_loss
#	getText CURRENTLINE $fig_loss "destroyed" "fighters."
#	stripText $fig_loss "shield points and"
#	getWord $fig_loss $shield_pnts 1
#	getWord $fig_loss $fig_pnts 2
	if ($shield_pnts > 0)
		add $loss $shield_pnts
	end
	if ($fig_pnts > 0)
		add $loss $fig_pnts
	end

	if ($loss >= $threshold)
		goto :reload
	else
		killAllTriggers
		goto :wait_for_command
	end


:reload
	send "l  " $planet "  *  z  n  z  n  *  m  n  t  *  q  z  n  z  n  "
	killAllTriggers
	setVar $loss 0
	goto :wait_for_command

#buy =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:buy
	setTextTrigger landprompt :cont_buy "(?="
	setDelayTrigger timeout :timeout 5000
	pause
:cont_buy
	killAllTriggers
	getWord CURRENTLINE $location 1
	if ($location <> "Citadel") and ($location <> "Planet")
		send "'<" $bot_name "> - Must start at planet or cit prompt*"
		goto :wait_for_command
	end
	isNumber $number $parm3
		if ($number = 0)
			send "'<" $bot_name "> - Please use - buy [type] [mode] [cycle] format*"
			goto :wait_for_command
		end
	if ($parm1 <> "f") and ($parm1 <> "o") and ($parm1 <> "e")
		send "'<" $bot_name "> - Please use - buy [type] [mode] [cycle] format*"
		goto :wait_for_command
	elseif ($parm2 <> "s") and ($parm2 <> "b") and ($parm2 <> "w")
		send "'<" $bot_name "> - Please use - buy [type] [mode] [cycle] format*"
		goto :wait_for_command
	end
	if ($parm1 = "f") and ($parm3 = 0)
		setVar $_ck_buydown_fuelrounds "max"
		saveVar $_ck_buydown_fuelrounds 
		setVar $_ck_buydown_orgrounds "-1"
		saveVar $_ck_buydown_orgrounds
		setVar $_ck_buydown_equiprounds "-1"
		saveVar $_ck_buydown_equiprounds
	elseif ($parm1 = "o") and ($parm3 = 0)
		setVar $_ck_buydown_fuelrounds "-1"
		saveVar $_ck_buydown_fuelrounds 
		setVar $_ck_buydown_orgrounds "max"
		saveVar $_ck_buydown_orgrounds
		setVar $_ck_buydown_equiprounds "-1"
		saveVar $_ck_buydown_equiprounds
	elseif ($parm1 = "e") and ($parm3 = 0)
		setVar $_ck_buydown_fuelrounds "-1"
		saveVar $_ck_buydown_fuelrounds 
		setVar $_ck_buydown_orgrounds "-1"
		saveVar $_ck_buydown_orgrounds
		setVar $_ck_buydown_equiprounds "max"
		saveVar $_ck_buydown_equiprounds
	elseif ($parm1 = "f") and ($parm3 > 0)
		setVar $_ck_buydown_fuelrounds $parm3
		saveVar $_ck_buydown_fuelrounds 
		setVar $_ck_buydown_orgrounds "-1"
		saveVar $_ck_buydown_orgrounds
		setVar $_ck_buydown_equiprounds "-1"
		saveVar $_ck_buydown_equiprounds
	elseif ($parm1 = "o") and ($parm3 > 0)
		setVar $_ck_buydown_fuelrounds "-1"
		saveVar $_ck_buydown_fuelrounds 
		setVar $_ck_buydown_orgrounds $parm3
		saveVar $_ck_buydown_orgrounds
		setVar $_ck_buydown_equiprounds "-1"
		saveVar $_ck_buydown_equiprounds
	elseif ($parm1 = "e") and ($parm3 > 0)
		setVar $_ck_buydown_fuelrounds "-1"
		saveVar $_ck_buydown_fuelrounds 
		setVar $_ck_buydown_orgrounds "-1"
		saveVar $_ck_buydown_orgrounds
		setVar $_ck_buydown_equiprounds $parm3
		saveVar $_ck_buydown_equiprounds
	end
	if ($parm2 = "s")
		setVar $_ck_buydown_mode "s"
		saveVar $_ck_buydown_mode
	elseif ($parm2 = "b")
		 setVar $_ck_buydown_mode "b"
		saveVar $_ck_buydown_mode
	elseif ($parm2 = "w")
		 setVar $_ck_buydown_mode "w"
		saveVar $_ck_buydown_mode
	end
	load _ck_buydown
	setTextTrigger done_buy :done_buy "CK Buydown exiting"
	if ($parm2 = "s")
		setDelayTrigger bad_buy :bad_buy 300000
	else
		setDelayTrigger bad_buy :bad_buy 600000
	end
	pause

:bad_buy
	killAllTriggers
	stop _ck_buydown
	send "'<" $bot_name "> - Script Timeout - Halting Buydown*"
:done_buy
	killAllTriggers
	goto :wait_for_command

#neg =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:neg
	setTextTrigger landprompt :cont_neg "(?="
	setDelayTrigger timeout :timeout 5000
	pause
:cont_neg
	killAllTriggers
	getWord CURRENTLINE $location 1
	if ($location <> "Citadel") and ($location <> "Planet")
		send "'<" $bot_name "> - Must start at planet or cit prompt*"
		goto :wait_for_command
	end
	if ($parm1 <> "f") and ($parm1 <> "o") and ($parm1 <> "e")
		send "'<" $bot_name "> - Please use - neg [item] format*"
		goto :wait_for_command
	end
	if ($parm1 = "f") 
		setVar $_ck_pnego_fueltosell "max"
		saveVar $_ck_pnego_fueltosell 
		setVar $_ck_pnego_orgtosell "-1"
		saveVar $_ck_pnego_orgtosell
		setVar  $_ck_pnego_equiptosell "-1"
		saveVar $_ck_pnego_equiptosell
	elseif ($parm1 = "o") 
		setVar $_ck_pnego_fueltosell "-1"
		saveVar $_ck_pnego_fueltosell 
		setVar $_ck_pnego_orgtosell "max"
		saveVar $_ck_pnego_orgtosell
		setVar  $_ck_pnego_equiptosell "-1"
		saveVar $_ck_pnego_equiptosell
	elseif ($parm1 = "e") and ($parm3 = 0)
		setVar $_ck_pnego_fueltosell "-1"
		saveVar $_ck_pnego_fueltosell 
		setVar $_ck_pnego_orgtosell "-1"
		saveVar $_ck_pnego_orgtosell
		setVar  $_ck_pnego_equiptosell "max"
		saveVar $_ck_pnego_equiptosell
	end
	load _ck_planet_nego
	setTextTrigger done_buy :done_neg "CK Planet Nego exiting"
	setDelayTrigger bad_buy :bad_neg 120000
	pause

:bad_neg
	killAllTriggers
	stop _ck_planet_nego
	send "'<" $bot_name "> - Script Timeout - Halting Negotiate*"
:done_neg
	killAllTriggers
	goto :wait_for_command

#help =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:command_list
if ($parm1 = 0)
	setTextTrigger landprompt :cont_help "(?="
	setDelayTrigger timeout :timeout 5000
	pause
:cont_help
	killAllTriggers
	send "'*-=-=-=-=-=-=-=-=-=-=-= Available Commands =-=-=-=-=-=-=-=-=-=-=-=-*"
	send " Commands -  <HELP> <MAC> <NMAC> <LIFT> <LAND> <STATUS> <WARN> *"
	send "          -  <ROB> <CIM> <QSS> <BUY> <NEG> <MEGA> <PAGE> <FIGS>*"
	send "  *"
	send " Modes    -  <RELOADER> <SAVEME> <FINDER> <PHOTON> <RUNAWAY>*"
	send "*"
	goto :wait_for_command
elseif ($parm1 = "mac")
	send "'<" $bot_name "> - mac [string] - executes string*"
	send "'  - use ^m or " #42 " for carriage return*"
	goto :wait_for_command
elseif ($parm1 = "nmac")
	send "'<" $bot_name "> - nmac [cycles] [string] - repeats macro string for set cycles*"
	send "'  - use ^m or " #42 " for carriage return*"
	goto :wait_for_command
elseif ($parm1 = "lift")
	send "'<" $bot_name "> - lift - lifts off planet*"
	goto :wait_for_command
elseif ($parm1 = "figs")
	send "'<" $bot_name "> - figs - refreshes fig list*"
	goto :wait_for_command
elseif ($parm1 = "page")
	send "'<" $bot_name "> - page - pages bot owner*"
	goto :wait_for_command
elseif ($parm1 = "land")
	send "'<" $bot_name "> - land [planet number] - lands on desired planet*"
	goto :wait_for_command
elseif ($parm1 = "rob")
	send "'<" $bot_name "> - rob - robs port according to gamesettings*"
	goto :wait_for_command
elseif ($parm1 = "mega")
	send "'<" $bot_name "> - mega - mega-robs port if able*"
	goto :wait_for_command
elseif ($parm1 = "status")
	send "'<" $bot_name "> - status - displays bot status*"
	goto :wait_for_command	
elseif ($parm1 = "warn")
	send "'<" $bot_name "> - warn - sets fighit warning for a sector*"
	send "'  - warn [on/off] [sector] [hops] format*"
	goto :wait_for_command
elseif ($parm1 = "qss")
	send "'<" $bot_name "> - qss - displays quickstats on ss*"
	goto :wait_for_command
elseif ($parm1 = "cim")
	send "'<" $bot_name "> - cim - perfoms cim and outputs port info to corp memo*"
	goto :wait_for_command
elseif ($parm1 = "finder")
	send "'<" $bot_name "> - finder - finds closest sector data*"
	send "'  - use [type] [sector] [port type] format*"	
	send "'  - [type]   = [de]ad-end or [f]igged or [fig] adds-fig [fp] figged port [p]ort*"
	send "'  - [sector] = sector number that you need finder data on*"
	send "'  - [port type] = port type (s)ell , (b)uy, or (x) either*"
	goto :wait_for_command
elseif ($parm1 = "buy")
	send "'<" $bot_name "> - buy [item] [mode] [cycles] - runs port buydown *"
	send "'  - [item]   = [f]uel or [o]rg or [e]quip*"
	send "'  - [mode]   = [b]est or [s]peed or [w]orst*"
	send "'  - [cycles] = number of cycles - default is max*" 
	goto :wait_for_command	
elseif ($parm1 = "neg")
	send "'<" $bot_name "> - neg [item] - runs port negoiate *"
	send "'  - [item]   = [f]uel or [o]rg or [e]quip*"
	goto :wait_for_command	
elseif ($parm1 = "reloader")
	send "'<" $bot_name "> - reloader [on/off] [threshold] - enables reloader mode *"
	send "'  - [threshold] = number of fig/shield point loss before reload*"
	goto :wait_for_command	
elseif ($parm1 = "saveme")
	send "'<" $bot_name "> - saveme [on/off] - activates saveme mode*"
	goto :wait_for_command
elseif ($parm1 = "photon")
	send "'<" $bot_name "> photon [on/off/reset] activates adjacent photon mode *"
	goto :wait_for_command
elseif ($parm1 = "runaway")
	send "'<" $bot_name "> - runaway [on/off] [preset flee sector] - sets runaway*"
	goto :wait_for_command
else
	send  "'<" $bot_name "> - Invalid Help Request*"
	goto :wait_for_command	
end

#saveme =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--=-
:saveme
	setTextTrigger landprompt :cont_saveme "(?="
	setDelayTrigger timeout :timeout 5000
	pause
:cont_saveme
	killAllTriggers
	getWord CURRENTLINE $location 1
	if ($location <> "Citadel")
		send "'<" $bot_name "> - Must start at Citadel prompt*"
		goto :wait_for_command
	end
	if ($parm1 <> "on") and ($parm1 <> "off")
		send "'<" $bot_name "> - Please use - saveme [on/off] format*"
		goto :wait_for_command
	end
	
	if ($mode = "General") and ($parm1 = "on")
		send "'<" $bot_name "> - Activating SaveMe*"
		setVar $mode "SaveMe"
		load _ck_saveme
		goto :wait_for_command
	elseif ($mode = "SaveMe") and ($parm1 = "off")
		send "'<" $bot_name "> - Deactivating SaveMe*"
		setVar $mode "General"
		stop _ck_saveme
		goto :wait_for_command
	elseif ($mode = "SaveMe") and ($parm1 = "on")
		send "'<" $bot_name "> - SaveMe Already Active*"
		goto :wait_for_command
	else
		send "'<" $bot_name "> - Please use - saveme [on/off] format**"
		goto :wait_for_command
	end

#photon =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:photon
	setTextTrigger landprompt :cont_photon "(?="
	setDelayTrigger timeout :timeout 5000
	pause
:cont_photon
	killAllTriggers
	getWord CURRENTLINE $location 1
	if ($warn = "ON")
		send "'<" $bot_name "> - Disengaging Warning*"
		setVar $warn "OFF"
	end
	if ($location <> "Citadel") and ($location <> "Command")
		send "'<" $bot_name "> - Must start at Citadel or Command prompt*"
		goto :wait_for_command
	end
	if ($parm1 <> "on") and ($parm1 <> "off") and ($parm1 <> "reset")
		send "'<" $bot_name "> - Please use - photon [on/off/reset] format*"
		goto :wait_for_command
	end
	if ($mode = "General") and ($parm1 = "on")
		send "'<" $bot_name "> - Activating Adjacent Photon - Tubes Open, Photons Hot!*"
		setVar $mode "Photon"
		goto :load_photon
	elseif ($mode = "Photon") and ($parm1 = "off")
		send "'<" $bot_name "> - Deactivating Adjacent Photon*"
		setVar $mode "General"
		goto :wait_for_command
	elseif ($mode = "Photon") and ($parm1 = "on")
		send "'<" $bot_name "> - Adjacent Photon Already Active*"
		goto :wait_for_command
	elseif ($mode = "Photon") and ($parm1 = "reset")
		send "'<" $bot_name "> - Adjacent Photon - Resetting Sector*"
		goto :load_photon
	else
		send "'<" $bot_name "> - Please use - photon [on/off/reset] format**"
		goto :wait_for_command
	end

:load_photon
	killAllTriggers
	waitFor "(?="
	getWord CURRENTLINE $location 1
	if ($location <> "Citadel") and ($location <> "Command")
		send "'<" $bot_name "> - Must start at Citadel or Command prompt*"
		goto :wait_for_command
	end
	if ($location = "Citadel")
		send "s*"
		waitFor "<Scan Sector>"
		waitFor "(?="
	elseif ($location = "Command")
		send "*zn"
		waitFor "<Re-Display>"
		waitFor "Command [TL"
	end
	gosub :quikstats
	setVar $photons $quikstats[$h[11]]
	if ($photons = 0)
		send "'<" $bot_name "> - Out of Photons - Adjacent Photon Deactivated*"
		setVar $mode "General"
		goto :wait_for_command
	end
	if ($quikstats[$h[1]] <> $psec) and ($psec <> 0)
		send "'<" $bot_name "> - Resetting Adjacent Photon to Sector " $quikstats[$h[1]] "*"
		setVar $psec $quikstats[$h[1]]
	end
	setVar $psec $quikstats[$h[1]]
		send "'<" $bot_name "> - Adjacent Photon Running in Sector " $psec " - " $photons " Photon(s) Aboard!*"
	setVar $pwarps SECTOR.WARPCOUNT[$psec]
	goto :wait_for_command

:shoot1
	killAllTriggers
	send "c  p  y  " SECTOR.WARPS[$psec][1] "**  q*"
	setTextTrigger shot :shot1 "Photon Missile launched into sector "&SECTOR.WARPS[$psec][1]
	setTextTrigger missed :missed1 "<Computer deactivated>"
	pause
:missed1
	killAllTriggers
	goto :wait_for_command
:shot1
	killAllTriggers
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Deployed") and ($spoof <> "Limpet")
		goto :wait_for_command
	end
	send "'<" $bot_name "> - Adjacent Photon Fired -> Sector " SECTOR.WARPS[$psec][1] "*"
	subtract $photons 1
	if ($photons = 0)
		send "'<" $bot_name "> - Out of Photons - Adjacent Photon Deactivated*"
		setVar $mode "General"
		goto :wait_for_command
	end
	setDelayTrigger cool :wait_for_command 500
	pause
	goto :wait_for_command
:shoot2
	killAllTriggers
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Deployed") and ($spoof <> "Limpet")
		goto :wait_for_command
	end
	send "c  p  y  " SECTOR.WARPS[$psec][2] "**  q*"
	setTextTrigger shot :shot2 "Photon Missile launched into sector "&SECTOR.WARPS[$psec][2]
	setTextTrigger missed :missed2 "<Computer deactivated>"
	pause
:missed2
	killAllTriggers
	goto :wait_for_command
:shot2
	send "'<" $bot_name "> - Adjacent Photon Fired -> Sector " SECTOR.WARPS[$psec][2] "*"
	subtract $photons 1
	if ($photons = 0)
		send "'<" $bot_name "> - Out of Photons - Adjacent Photon Deactivated*"
		setVar $mode "General"
		goto :wait_for_command
	end
	setDelayTrigger cool :wait_for_command 500
	pause
	goto :wait_for_command
:shoot3
	killAllTriggers
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Deployed") and ($spoof <> "Limpet")
		goto :wait_for_command
	end
	send "c  p  y  " SECTOR.WARPS[$psec][3] "**  q*"
	setTextTrigger shot :shot3 "Photon Missile launched into sector "&SECTOR.WARPS[$psec][3]
	setTextTrigger missed :missed3 "<Computer deactivated>"
	pause
:missed3
	killAllTriggers
	goto :wait_for_command
:shot3
	send "'<" $bot_name "> - Adjacent Photon Fired -> Sector " SECTOR.WARPS[$psec][3] "*"
	subtract $photons 1
	if ($photons = 0)
		send "'<" $bot_name "> - Out of Photons - Adjacent Photon Deactivated*"
		setVar $mode "General"
		goto :wait_for_command
	end
	setDelayTrigger cool :wait_for_command 500
	pause
	goto :wait_for_command
:shoot4
	killAllTriggers
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Deployed") and ($spoof <> "Limpet")
		goto :wait_for_command
	end
	send "c  p  y  " SECTOR.WARPS[$psec][4] "**  q*"
	setTextTrigger shot :shot4 "Photon Missile launched into sector "&SECTOR.WARPS[$psec][4]
	setTextTrigger missed :missed4 "<Computer deactivated>"
	pause
:missed4
	killAllTriggers
	goto :wait_for_command
:shot4
	send "'<" $bot_name "> - Adjacent Photon Fired -> Sector " SECTOR.WARPS[$psec][4] "*"
	subtract $photons 1
	if ($photons = 0)
		send "'<" $bot_name "> - Out of Photons - Adjacent Photon Deactivated*"
		setVar $mode "General"
		goto :wait_for_command
	end
	setDelayTrigger cool :wait_for_command 500
	pause
	goto :wait_for_command
:shoot5
	killAllTriggers
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Deployed") and ($spoof <> "Limpet")
		goto :wait_for_command
	end
	send "c  p  y  " SECTOR.WARPS[$psec][5] "**  q*"
	setTextTrigger shot :shot5 "Photon Missile launched into sector "&SECTOR.WARPS[$psec][5]
	setTextTrigger missed :missed5 "<Computer deactivated>"
	pause
:missed5
	killAllTriggers
	goto :wait_for_command
:shot5
	send "'<" $bot_name "> - Adjacent Photon Fired -> Sector " SECTOR.WARPS[$psec][5] "*"
	subtract $photons 1
	if ($photons = 0)
		send "'<" $bot_name "> - Out of Photons - Adjacent Photon Deactivated*"
		setVar $mode "General"
		goto :wait_for_command
	end
	setDelayTrigger cool :wait_for_command 500
	pause
	goto :wait_for_command
:shoot6
	killAllTriggers
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Deployed") and ($spoof <> "Limpet")
		goto :wait_for_command
	end
	send "c  p  y  " SECTOR.WARPS[$psec][6] "**  q*"
	setTextTrigger shot :shot6 "Photon Missile launched into sector "&SECTOR.WARPS[$psec][6]
	setTextTrigger missed :missed6 "<Computer deactivated>"
	pause
:missed6
	killAllTriggers
	goto :wait_for_command
:shot6
	send "'<" $bot_name "> - Adjacent Photon Fired -> Sector " SECTOR.WARPS[$psec][6] "*"
	subtract $photons 1
	if ($photons = 0)
		send "'<" $bot_name "> - Out of Photons - Adjacent Photon Deactivated*"
		setVar $mode "General"
		goto :wait_for_command
	end
	setDelayTrigger cool :wait_for_command 500
	pause
	goto :wait_for_command

#page =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--
:page
	killAllTriggers
	send "'<" $bot_name "> - Paging Bot Owner...*"
	sound page.wav
	sound page.wav
	sound page.wav
	sound page.wav
	sound page.wav	
	send "'<" $bot_name "> - Bot Owner Paged*"
	goto :wait_for_command
	
#refreshfigs =-=-=-=-=-=-=-=-=-=-=-=-=-=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:bot_refresh_figs
	killAllTriggers
	setTextTrigger landprompt :cont_refresh "(?="
	setDelayTrigger timeout :timeout 5000
	pause
:cont_refresh
	killAllTriggers
	getWord CURRENTLINE $location 1
	if ($location = "Citadel")
		send "qd"
		waitFor "Planet #"
		getWord CURRENTLINE $planet 2
		stripText $planet "#"
		send "q"
		goto :refresh
	elseif ($location = "Command")
		goto :refresh
	else
		send "'<" $bot_name "> - Fig Refresh must be run from Citadel or Command Prompt*"
		goto :wait_for_command
	end
		
:refresh
	send "'<" $bot_name "> - Refreshing figs - one moment please...*"
	setVar $figfile "_ck_"&GAMENAME&".figs"
	send "g"
	setArray $figlist SECTORS
	setVar $figgies "."
	setVar $fig_count 0
	setVar $fig_sec 0
	waitFor "==========================="
:get_figs
	getWord CURRENTLINE $sector 1
	getWord CURRENTLINE $stopper 2
	isNumber $secnum $sector
:addin
	if ($stopper = "Total")
		killTrigger abort
		goto :doneglist
	end
	if ($secnum = 1)
		add $fig_count 1
		setVar $figlist[$sector] 1
	end
	setTextLineTrigger grab :get_figs
	pause


:doneglist
	gosub :parse_array
	delete $figfile
	write $figfile $figgies
	setVar $total_figs $fig_count
	multiply $fig_count 100
	divide $fig_count SECTORS
	send "'<" $bot_name "> - Fig Count - " $total_figs " sector(s) - " $fig_count "%*"
	killAllTriggers
	if ($location = "Citadel")
		setVar $parm1 $planet
		goto :land
	end
	if ($nofile = 1)
		goto :finder
	end
	goto :wait_for_command


# -=-=-=-=-
:parse_array
	setVar $array_count 0
:start_parse
	add $array_count 1
	if ($array_count < SECTORS) and ($figlist[$array_count] = 0)
		replaceText $figgies "." "0 ."
		goto :start_parse
	elseif ($array_count < SECTORS) and ($figlist[$array_count] = 1)
		replaceText $figgies "." $array_count&" ."
		goto :start_parse
	elseif ($array_count = SECTORS) and ($figlist[$array_count] = 0)
		replaceText $figgies "." "0"
	elseif ($array_count = SECTORS) and ($figlist[$array_count] = 1)
		replaceText $figgies "." $array_count
	end
return

#finder =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
:finder
	killAllTriggers
	if ($command = "finder") and ($parm1 <> "on") and ($parm1 <> "off")
		send "'<" $bot_name "> - Please use - finder [on/off] format*"
		goto :wait_for_command
	end
	
	if ($mode = "General") and ($command = "finder") and ($parm1 = "on")
		send "'<" $bot_name "> - Activating finder*"
		setVar $mode "Finder"
		goto :finder_ztm
	elseif ($mode = "Finder") and ($command = "finder") and ($parm1 = "off")
		send "'<" $bot_name "> - Deactivating Finder*"
		setVar $mode "General"
		goto :wait_for_command
	elseif ($mode = "Finder") and ($command = "finder") and ($parm1 = "on")
		send "'<" $bot_name "> - Finder Already Active*"
		goto :wait_for_command
	elseif ($mode = "Finder") and ($command = "f") or ($command = "nf") or ($command = "fig") or ($command = "fp") or ($command = "p") or ($command = "de")
		goto :near
	else
		send "'<" $bot_name "> - Please use - finder [on/off] format**"
		goto :wait_for_command
	end

:finder_ztm
	send "'<" $bot_name "> - ZTM check *"
	setVar $ztm_count 1

:start
	While ($ztm_count < SECTORS)
		if (SECTOR.WARPCOUNT[$ztm_count] = 0)
			goto :bad_ztm
		end
		add $ztm_count 1
	end
	send "'<" $bot_name "> - ZTM check - PASSED*"
		goto :get_da_figs

:bad_ztm
echo "*" $ztm_count "*"
	send "'<" $bot_name "> - ZTM check - FAILED*"
		goto :wait_for_command
	
		
:get_da_figs
	send "'<" $bot_name "> - Finder Mode Engaged - Loading Figs*"
	setVar $figfile "_ck_" & GAMENAME & ".figs"
	fileExists $exists $figfile
	if ($exists = 0)
		setVar $nofile 1
		send "'<" $bot_name "> - No fig data found - refreshing*"
		goto :bot_refresh_figs
	end
	setVar $read_count 0
	setVar $merge_count 1
:read_fig_array
	add $read_count 1
	read $figfile $read[$read_count] $read_count
	if ($read[$read_count] = "EOF")
		goto :done_read_fig_array
	end
	if ($read_count > 1)
		mergeText $read[1] $read[$read_count] $read[1]
	end
	goto :read_fig_array

:done_read_fig_array
:set_fig_array
	setArray $figlist SECTORS
	setVar $fig_array_count 0
:make_array
	add $fig_array_count 1
	if ($fig_array_count > SECTORS)
		goto :done_fig_array
	end
	getWord $read[1] $fig_check $fig_array_count
	if ($fig_check <> 0)
		setVar $figlist[$fig_array_count] 1
	end
	goto :make_array

:done_fig_array
	send "'<" $bot_name "> - Fig Array Complete*"
	goto :wait_for_command
	
# -=-=-=-=-=-=-=-=-=- subroutine to find near fig -=-=-=-=-=-=-=-=-=-=-=-
# _NearestFigFinder2:
:near
	setVar $near $command
	setVar $source $parm1
	if ($near <> "f") and ($near <> "nf") and ($near <> "fig") and ($near <> "fp") and ($near <> "p") and ($near <> "de")
		send "'<" $bot_name "> - Please use - [type] [sector] format*"
		goto :wait_for_command
	end
	if ($near = "f") or ($near = "nf") or ($near = "fig") or ($near = "de")
		isNumber $number $source
		if ($number = 0)
			send "'<" $bot_name "> - Please use - [type] [sector] format*"
			goto :wait_for_command
		elseif ($source > SECTORS) or ($source = 0)
			send "'<" $bot_name "> - Sector is out of bounds*"
			goto :wait_for_command
		end
	elseif ($near = "fp") or ($near = "p")
		setVar $ptype $parm2
		getLength $ptype $plength
		if ($ptype = 0)
			send "'<" $bot_name "> - Invalid Port Type*"
			send "'<" $bot_name "> - Please use - [fp/p] [sector] [port type] format *"
			goto :wait_for_command
		elseif ($plength <> 3)
			send "'<" $bot_name "> - Invalid Port Type*"
			send "'<" $bot_name "> - Please use - [fp/p] [sector] [port type] format *"
			goto :wait_for_command
		end
		cutText $ptype $pfuel 1 1
		if ($pfuel <> "s") and ($pfuel <> "b") and ($pfuel <> "x")
			send "'<" $bot_name "> - Invalid Port Type*"
			send "'<" $bot_name "> - Please use - [fp/p] [sector] [port type] format *"
			goto :wait_for_command
		end
		cutText $ptype $porg 2 1
		if ($porg <> "s") and ($porg <> "b") and ($porg <> "x")
			send "'<" $bot_name "> - Invalid Port Type*"
			send "'<" $bot_name "> - Please use - [fp/p] [sector] [port type] format *"
			goto :wait_for_command
		end
		cutText $ptype $pequip 3 1
		if ($pequip <> "s") and ($pequip <> "b") and ($pequip <> "x")
			send "'<" $bot_name "> - Invalid Port Type*"
			send "'<" $bot_name "> - Please use - [fp/p] [sector] [port type] format *"
			goto :wait_for_command
		end
	end
:near_hit
	if ($near = "f")
		killAllTriggers
		if ($figlist[$source] = 1)
      		  send "'<" $bot_name "> -Sector " & $source & " is figged.*"
    		else
        		setVar $breadth_mode "reverse"
        		gosub :breadth_search
        		if ($return_data <> "")
            			send "'<" $bot_name ">*" & "'*" & $return_data & "**"
        		end
    		end
		goto :wait_for_command
	elseif ($near = "nf")
		killAllTriggers
		if ($figlist[$source] = 0) and ($source > 10) and ($source <> STARDOCK)
        		send "'<" $bot_name "> - Sector " & $source & " is a unfigged dead-end.*"
    		else
		      	setVar $breadth_mode "forward"
		       	gosub :breadth_search
		        if ($return_data <> "")
		            send "'<" $bot_name ">*" & "'*" & $return_data & "**"
		        end
                end
		goto :wait_for_command
	elseif ($near = "de")
		killAllTriggers
		if ($figlist[$source] = 0) and (SECTOR.WARPCOUNT[$source] = 1)
        		send "'<" $bot_name "> - Sector " & $source & " is not figged.*"
    		else
		      	setVar $breadth_mode "forward"
		       	gosub :breadth_search
		        if ($return_data <> "")
		            send "'<" $bot_name ">*" & "'*" & $return_data & "**"
		        end
                end
		goto :wait_for_command
	elseif ($near = "fig")
		killAllTriggers
		setVar $figlist[$source] 1
   	        send "'<" $bot_name "> - " & $source & " added.*"
		goto :wait_for_command
	elseif ($near = "fp")
		killAllTriggers
		if ($figlist[$source] = 1) and ((PORT.CLASS[$source] > 0) and (PORT.CLASS[$source] < 9))
			if (($pfuel = "b") AND (PORT.BUYFUEL[$source] = 1)) or (($pfuel = "s") AND (PORT.BUYFUEL[$source] = 0)) or ($pfuel = "x")
				if (($porg = "b") AND (PORT.BUYORG[$source] = 1)) or (($porg = "s") AND (PORT.BUYORG[$source] = 0)) or ($porg = "x")	
					if (($pequip = "b") AND (PORT.BUYEQUIP[$source] = 1)) or (($pequip = "s") AND (PORT.BUYEQUIP[$source] = 0)) or ($pequip = "x")
						send "'<" $bot_name "> - Sector " & $source & " has a " & $ptype & " port that's figged.*"
						goto :wait_For_command
					else
						goto :find_fp
					end
				else
					goto :find_fp
				end
			else
				goto :find_fp
			end
		else
:find_fp
			setVar $breadth_mode "forward"
		       	gosub :breadth_search
		        if ($return_data <> "")
		            send "'<" $bot_name ">*" & "'*" & $return_data & "**"
		        end
		end
		goto :wait_for_command
	elseif ($near = "p")
		killAllTriggers
		if ((PORT.CLASS[$source] > 0) and (PORT.CLASS[$source] < 9))
			if (($pfuel = "b") AND (PORT.BUYFUEL[$source] = 1)) or (($pfuel = "s") AND (PORT.BUYFUEL[$source] = 0)) or ($pfuel = "x")
				if (($porg = "b") AND (PORT.BUYORG[$source] = 1)) or (($porg = "s") AND (PORT.BUYORG[$source] = 0)) or ($porg = "x")	
					if (($pequip = "b") AND (PORT.BUYEQUIP[$source] = 1)) or (($pequip = "s") AND (PORT.BUYEQUIP[$source] = 0)) or ($pequip = "x")
						send "'<" $bot_name "> - Sector " & $source & " has a " & $ptype & " port.*"
						goto :wait_For_command
					else
						goto :find_p
					end
				else
					goto :find_p
				end
			else
				goto :find_p
			end
		else
:find_p
			setVar $breadth_mode "forward"
		       	gosub :breadth_search
		        if ($return_data <> "")
		            send "'<" $bot_name ">*" & "'*" & $return_data & "**"
		        end
		end
		goto :wait_for_command

	else
		send "'<" $bot_name "> - Invalid Port Type*"
		send "'<" $bot_name "> - Please use - [fp/p] [sector] [port type] format *"
		goto :wait_for_command
	end
	
# ----- SUB :breadth_search -----
:breadth_search
    # (var $source should be passed from main)
    # (var $breadth_mode should be passed from main)
    # (var $near should be passed from main)
    setVar $database[1] $source
    setVar $array_size 1
    setVar $array_pos 0
    setVar $num_sectors SECTORS
    setArray $checked $num_sectors
    setVar $checked[$source] 1
    setArray $path $num_sectors
    setVar $path[$source] ""
    setArray $distance $num_sectors
    setVar $distance[$source] 0

    :SectorLoop
        add $array_pos 1
        if ($array_pos > $array_size)
            setVar $return_data "Array Pos exceeds Array Size - ABNORMAL EXIT FROM SUBROUTINE"
            return
        end
        setVar $current_sector $database[$array_pos]
        setVar $warpnum 0
        :checkwarps
            add $warpnum 1
            if ($breadth_mode = "reverse")
                setVar $target SECTOR.WARPSIN[$current_sector][$warpnum]
            else
                setVar $target SECTOR.WARPS[$current_sector][$warpnum]
            end
            if ($checked[$target] = 0)
                setVar $checked[$target] 1
                add $array_size 1
                setVar $database[$array_size] $target

                if ($breadth_mode = "reverse")
                    setVar $path[$target] $path[$current_sector] & " " & $target
                else
                    setVar $path[$target] $target & " " & $path[$current_sector]
                end

                setVar $distance[$target] $distance[$current_sector]
                add $distance[$target] 1

                if ($distance[$target] > 20)
                    setVar $return_data "Distance over 20 hops, halting request"
                    return
                end

                if ($near = "f")
                    if ($figlist[$target] <> 0)
                        setVar $return_data "Nearest Fig to " & $source & " is " & $target & " (" & $distance[$target] & " hops)  << " & $path[$target] & " >> "
                        return
                    end
                elseif ($near = "nf") 
                    if ($figlist[$target] = 0) and ($target > 10) and ($target <> STARDOCK)
                        setVar $return_data "Nearest Non-Fig to " & $source & " is " & $target & " (" & $distance[$target] & " hops)  << " & $path[$target] & " >> "
                        return
                    end
		elseif ($near = "de")
		    if ($figlist[$target] = 0) and (SECTOR.WARPCOUNT[$target] = 1)
                        setVar $return_data "Nearest Non-Fig DE to " & $source & " is " & $target & " (" & $distance[$target] & " hops)  << " & $path[$target] & " >> "
                        return
                    end
		elseif ($near = "fp") 
			if ($figlist[$target] = 1) and ((PORT.CLASS[$target] > 0) and (PORT.CLASS[$target] < 9))
				if (($pfuel = "b") AND (PORT.BUYFUEL[$target] = 1)) or (($pfuel = "s") AND (PORT.BUYFUEL[$target] = 0)) or ($pfuel = "x")
					if (($porg = "b") AND (PORT.BUYORG[$target] = 1)) or (($porg = "s") AND (PORT.BUYORG[$target] = 0)) or ($porg = "x")	
						if (($pequip = "b") AND (PORT.BUYEQUIP[$target] = 1)) or (($pequip = "s") AND (PORT.BUYEQUIP[$target] = 0)) or ($pequip = "x")
							setVar $return_data "Nearest Figged " & $ptype & " port to " & $source & " is "  & $target & " (" & $distance[$target] & " hops)  << " & $path[$target] & " >> "
							return
						end
					end
				end
			end
		elseif ($near = "p") 
			if ((PORT.CLASS[$target] > 0) and (PORT.CLASS[$target] < 9))
				if (($pfuel = "b") AND (PORT.BUYFUEL[$target] = 1)) or (($pfuel = "s") AND (PORT.BUYFUEL[$target] = 0)) or ($pfuel = "x")
					if (($porg = "b") AND (PORT.BUYORG[$target] = 1)) or (($porg = "s") AND (PORT.BUYORG[$target] = 0)) or ($porg = "x")	
						if (($pequip = "b") AND (PORT.BUYEQUIP[$target] = 1)) or (($pequip = "s") AND (PORT.BUYEQUIP[$target] = 0)) or ($pequip = "x")
							setVar $return_data "Nearest " & $ptype & " port to " & $source & " is "  & $target & " (" & $distance[$target] & " hops)  << " & $path[$target] & " >> "
							return
						end
					end
				end
			end			
                else
                    setVar $return_data "Unknown function"
                    return
                end

            end
            if ($array_size = $num_sectors)
                setVar $return_data "None Found"
                return
            end
            if ($breadth_mode = "reverse")
                if ($warpnum < SECTOR.WARPINCOUNT[$current_sector])
                    goto :checkwarps
                end
            else
                if ($warpnum < SECTOR.WARPCOUNT[$current_sector])
                    goto :checkwarps
                end
            end
            goto :SectorLoop


#fidner fig hit =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:findfig
	killAllTriggers
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Deployed")
		goto :wait_for_command
	end
	getWord CURRENTLINE $fighit 5
	stripText $fighit ":"
	if ($figlist[$fighit] = 0)
		goto :wait_for_command
	end
	setVar $figlist[$fighit] 0
	if ($warn = "ON")
		if ($fighit = $warn_sec)
			send "'<" $bot_name "> - Warning Activated!!!*"
			goto :page
		end
		getDistance $dist_ck $fighit $warn_sec
		if ($dist_ck <= $warn_hops) and ($dist_ck <> 0)
			send "'<" $bot_name "> - Warning Activated!!!*"
			goto :page
		end
	end
	if ($mode = "Finder")
		setVar $near "f"
		setVar $source $fighit
		goto :near_hit
	end
	if ($mode = "Runaway")
		getDistance $dist $fighit $runsec
		if ($dist <= 2)
			goto :run_pwarp
		end
	end
	goto :wait_for_command
#warn =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
:warn 
	killAllTriggers
	if ($parm1 <> "on") and ($parm1 <> "off")
		send "'<" $bot_name "> - Please use - warn [on/off] [sector] [hops] format*"
		goto :wait_for_command
	end
	isNumber $number $parm2
	if ($number = 0) or ($parm2 > SECTORS) or ($parm1 = 0)
		send "'<" $bot_name "> - warning sector out of bounds - 1 -> " SECTORS "*"
		send "'<" $bot_name "> - Please use - warn [on/off] [sector] [hops] format*"
		goto :wait_for_command
	end
	isNumber $number $parm3
	if ($number = 0)
		send "'<" $bot_name "> - warning hops is not a number*"
		send "'<" $bot_name "> - Please use - warn [on/off] [sector] [hops] format*"
		goto :wait_for_command
	end
	if ($parm1 = "on") and ($warn = "OFF")
		setVar $warn "ON"
	elseif ($parm1 = "on") and ($warn = "ON")
		send "'<" $bot_name "> - Warn - Already Engaged*"
		goto :wait_for_command
	elseif ($parm1 = "off")	
		setVar $warn "OFF"
		send "'<" $bot_name "> - Disengaging Warn*"
		goto :wait_for_command
	end
	setVar $warn_sec $parm2
	setVar $warn_hops $parm3
	send "'<" $bot_name "> - Engaging Warn - Sector " $warn_sec " - " $warn_hops " hop(s)*"
	goto :wait_for_command

#relog portion-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--=-=-
:online_watch
killalltriggers
    setTextLineTrigger whos :whos "Who's Playing"
    setTextTrigger alternate :whos ""
    setDelayTrigger verifydelay :verifydelay 3000
    send "#"
    pause

    :whos
        killalltriggers
        goto :wait_for_command

    :verifyDelay
        killalltriggers
        disconnect
        goto :relog
:relog
    killalltriggers
    setDelayTrigger thedelay :thedelay 200
    pause
    :thedelay
killAllTriggers
#    seteventtrigger relog :relog "CONNECTION LOST"
    connect
seteventtrigger relog :relog "CONNECTION LOST"
    waitfor "Please enter your name (ENTER for none):"
    sound "C:\alert.wav"
    send $_ck_username & "*"
    waitfor "Trade Wars 2002 Game Server"
    send $_ck_letter

:extrapause
    setTextTrigger firstpause :firstpause "[Pause]"
    setTextTrigger enter :enter "Enter your choice"
    pause

:firstpause
    killtrigger firstpause
    killtrigger enter
    send "*"
    goto :extrapause

:enter
    killtrigger firstpause
    killtrigger enter
    send "T*"
    waitfor "Show today's log?"
    send "*"
    waitfor "[Pause]"
    send "*"
    waitfor "A password is required to enter this game."
    send $_ck_password & "*"

:skipjunk
    setTextTrigger morepauses :morepauses "[Pause]"
    setTextTrigger clearvoids :alldone_relog "Do you wish to clear some avoids?"
    setTextTrigger novoids :alldone_relog "No Sectors are currently being avoided."
    pause

:morepauses
    killtrigger clearvoids
    killtrigger novoids
    send "*"
    goto :skipjunk

:alldone_relog
    killtrigger clearvoids
    killtrigger novoids
    killtrigger morepauses
    send "Z*  Z*  ZA9999*  Z*  "
    send "'<" $bot_name "> - Auto-relog activated*"
    killAllTriggers
    if ($bot_planet <> 0)
	setVar $parm1 $planet
	goto :land
    end
    goto :wait_for_command
# cn settings =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
# ----- SUB: Start CN settings -----
:startCNsettings
    send "CN"

        SetTextLineTrigger ansi0 :ansi0 "(1) ANSI graphics            - Off"
        SetTextLineTrigger ansi1 :ansi1 "(1) ANSI graphics            - On"
        pause

        :ansi0
            killalltriggers
            setVar $cn1 0
            goto :cn1done
        :ansi1
            killalltriggers
            setVar $cn1 1
        :cn1done

        SetTextLineTrigger anim0 :anim0 "(2) Animation display        - Off"
        SetTextLineTrigger anim1 :anim1 "(2) Animation display        - On"
        pause

        :anim0
            killalltriggers
            setVar $cn2 0
            goto :cn2done
        :anim1
            killalltriggers
            setVar $cn2 1
        :cn2done

        SetTextLineTrigger page0 :page0 "(3) Page on messages         - Off"
        SetTextLineTrigger page1 :page1 "(3) Page on messages         - On"
        pause

        :page0
            killalltriggers
            setVar $cn3 0
            goto :cn3done
        :page1
            killalltriggers
            setVar $cn3 1
        :cn3done

        SetTextLineTrigger silence0 :silence0 "(7) Silence ALL messages     - No"
        SetTextLineTrigger silence1 :silence1 "(7) Silence ALL messages     - Yes"
        pause

        :silence0
            killalltriggers
            setVar $cn7 0
            goto :cn7done
        :silence1
            killalltriggers
            setVar $cn7 1
        :cn7done

        SetTextLineTrigger abortdisplay0 :abortdisplay0 "(9) Abort display on keys    - SPACE"
        SetTextLineTrigger abortdisplay1 :abortdisplay1 "(9) Abort display on keys    - ALL KEYS"
        pause

        :abortdisplay0
            killalltriggers
            setVar $cn9 0
            goto :cn9done
        :abortdisplay1
            killalltriggers
            setVar $cn9 1
        :cn9done

        SetTextLineTrigger messagedisplay0 :messagedisplay0 "(A) Message Display Mode     - Compact"
        SetTextLineTrigger messagedisplay1 :messagedisplay1 "(A) Message Display Mode     - Long"
        pause

        :messagedisplay0
            killalltriggers
            setVar $cna 0
            goto :cnadone
        :messagedisplay1
            killalltriggers
            setVar $cna 1
        :cnadone

        SetTextLineTrigger screenpauses0 :screenpauses0 "(B) Screen Pauses            - No"
        SetTextLineTrigger screenpauses1 :screenpauses1 "(B) Screen Pauses            - Yes"
        pause

        :screenpauses0
            killalltriggers
            setVar $cnb 0
            goto :cnbdone
        :screenpauses1
            killalltriggers
            setVar $cnb 1
        :cnbdone

#        waitfor "Settings command (?=Help)"
        gosub :sendCNstring
#        send "?"
#        waitfor "Settings command (?=Help)"
        send "QQ"
        SetTextTrigger subStartCNcontinue1 :subStartCNcontinue "Command [TL="
        SetTextTrigger subStartCNcontinue2 :subStartCNcontinue "Citadel command (?=help)"
        pause
        :subStartCNcontinue
        killalltriggers
        return



# ----- SUB: end CN settings -----
:endCNsettings
    send "CN"
    waitfor "Settings command (?=Help)"
    gosub :sendCNstring
    send "?"
    waitfor "Settings command (?=Help)"
    send "QQ"
    SetTextTrigger subEndCNcontinue1 :subEndCNcontinue "Command [TL="
    SetTextTrigger subEndCNcontinue2 :subEndCNcontinue "Citadel command (?=help)"
    pause
    :subEndCNcontinue
    killalltriggers
    return


# ----- SUB: send CN string -----
:sendCNstring
    if ($cn1 = 0)
        send "1  "
    end
    if ($cn2 = 1)
        send "2  "
    end
    if ($cn3 = 1)
        send "3  "
    end
    if ($cn7 = 1)
        send "7  "
    end
    if ($cn9 = 1)
        send "9  "
    end
    if ($cna = 1)
        send "A  "
    end
    if ($cnb = 1)
        send "B  "
    end
    return
# -=-=-=-=-=-=-=- timeout -=-=-=-=-=-=-=-=-
:timeout
killAllTriggers
send "'<" $bot_name "> - command timeout*"
goto :wait_for_command


# -=-=-=-=-=-=-=- runaway -=--=-=-=-=-=-=-=-
:runaway
setTextTrigger runprompt :cont_runaway "(?="
	setDelayTrigger timeout :timeout 5000
	pause
:cont_runaway
	killAllTriggers
	getWord CURRENTLINE $location 1
	if ($location <> "Citadel")
		send "'<" $bot_name "> - Must start at Citadel prompt*"
		goto :wait_for_command
	end
	if ($parm1 <> "on") and ($parm1 <> "off")
		send "'<" $bot_name "> - Please use - Runaway [on/off] format*"
		goto :wait_for_command
	end
	
	if ($mode = "General") and ($parm1 = "on")
		send "'<" $bot_name "> - Activating Runaway*"
		setVar $mode "Runaway"	
		goto :load_runaway
	elseif ($mode = "Runaway") and ($parm1 = "off")
		send "'<" $bot_name "> - Deactivating Runaway*"
		setVar $mode "General"
		goto :wait_for_command
	elseif ($mode = "Runaway") and ($parm1 = "on")
		send "'<" $bot_name "> - Runaway Already Active*"
		goto :wait_for_command
	else
		send "'<" $bot_name "> - Please use - Runaway [on/off] format**"
		goto :wait_for_command
	end

:load_runaway
	setVar $parm2 $firstrun
	killAllTriggers
		send "s*"
		waitFor "<Scan Sector>"
		waitFor "(?="
	gosub :quikstats	
	setVar $runsec $quikstats[$h[1]]
#		send "'<" $bot_name "> - Runaway initiated - Mapping...*"
	setVar $pwarps SECTOR.WARPCOUNT[$runsec]

:get_da_figs2
	send "'<" $bot_name "> - Runaway Mode Engaged - Loading Figs*"
	setVar $figfile "_ck_" & GAMENAME & ".figs"
	fileExists $exists $figfile
	if ($exists = 0)
		setVar $nofile 1
		send "'<" $bot_name "> - No fig data found - Halting Runaway*"
		setVar $mode "General"
		goto :wait_for_command
	end
	setVar $read_count 0
	setVar $merge_count 1
:read_fig_array2
	add $read_count 1
	read $figfile $read[$read_count] $read_count
	if ($read[$read_count] = "EOF")
		goto :done_read_fig_array2
	end
	if ($read_count > 1)
		mergeText $read[1] $read[$read_count] $read[1]
	end
	goto :read_fig_array2

:done_read_fig_array2
:set_fig_array2
	setArray $figlist SECTORS
	setVar $fig_array_count 0
:make_array2
	add $fig_array_count 1
	if ($fig_array_count > SECTORS)
		goto :done_fig_array2
	end
	getWord $read[1] $fig_check $fig_array_count
	if ($fig_check <> 0)
		setVar $figlist[$fig_array_count] 1
	end
	goto :make_array2

:done_fig_array2
	send "'<" $bot_name "> - Fig Array Complete*"
:set_flee_data
	send "'<" $bot_name "> - Runaway initiated - Mapping...*"
#	waitFor "(?="
#	gosub :quikstats	
#	setVar $runsec $quikstats[$h[1]]
	setVar $run_count 1
	setVar $run_database_count 0
	setVar $sectiona SECTORS
	divide $sectiona 78
	setVar $echo_count 1
	echo "** Plotting Primary Flee Sectors...**"
:start_run_count
	while ($run_count <= SECTORS)
		if (SECTOR.WARPCOUNT[$run_count] <> 2)
			add $run_count 1 
				if ($echo_count = $sectiona)
					echo ansi_13 #178
					setVar $echo_count 1
				else
					add $echo_count 1
				end
			goto :start_run_count
		end
		getDistance $rundist $runsec $run_count
		if ($rundist < 4) 
			add $run_count 1 
				if ($echo_count = $sectiona)
					echo ansi_13 #178
					setVar $echo_count 1
				else
					add $echo_count 1
				end
			goto :start_run_count
		end
		if ($rundist > 12)
			add $run_count 1 
				if ($echo_count = $sectiona)
					echo ansi_13 #178
					setVar $echo_count 1
				else
					add $echo_count 1
				end
			goto :start_run_count
		end
		if ($figlist[$run_count] <> 1)
			add $run_count 1 
				if ($echo_count = $sectiona)
					echo ansi_13 #178
					setVar $echo_count 1
				else
					add $echo_count 1
				end
			goto :start_run_count
		end
		setvar $adjrunsec1 SECTOR.WARPS[$run_count][1]
		setVar $adjrunsec2 SECTOR.WARPS[$run_count][2]
		if (SECTOR.WARPCOUNT[$adjrunsec1] = 1)
			add $run_count 1
				if ($echo_count = $sectiona)
					echo ansi_13 #178
					setVar $echo_count 1
				else
					add $echo_count 1
				end
			goto :start_run_count
		end
		if (SECTOR.WARPCOUNT[$adjrunsec2] = 1)
			add $run_count 1
				if ($echo_count = $sectiona)
					echo ansi_13 #178
					setVar $echo_count 1
				else
					add $echo_count 1
				end
			goto :start_run_count
		end
		if ($figlist[$adjrunsec1] <> 1)
			add $run_count 1
				if ($echo_count = $sectiona)
					echo ansi_13 #178
					setVar $echo_count 1
				else
					add $echo_count 1
				end
			goto :start_run_count
		end
		if ($figlist[$adjrunsec2] <> 1)
			add $run_count 1
				if ($echo_count = $sectiona)
					echo ansi_13 #178
					setVar $echo_count 1
				else
					add $echo_count 1
				end
			goto :start_run_count
		end
		add $run_database_count 1
				if ($echo_count = $sectiona)
					echo ansi_13 #178
					setVar $echo_count 1
				else
					add $echo_count 1
				end
		setVar $run_database[$run_database_count]  $run_count
		add $run_count 1
	end
	if ($run_database_count < 20)
		send "'<" $bot_name "> - Runaway list to short- ReMapping...*"
		waitFor "Message sent on"
	else 
		goto :end_map
	end
	setVar $run_count 1
:second_run_count
	echo "** Plotting Secondary Flee Sectors...**"
	setVar $echo_count 1
	while ($run_count <= SECTORS)
		if (SECTOR.WARPCOUNT[$run_count] <> 1]
			add $run_count 1 
				if ($echo_count = $sectiona)
					echo ansi_13 #178
					setVar $echo_count 1
				else
					add $echo_count 1
				end
			goto :second_run_count
		end
		getDistance $rundist $runsec $run_count
		if ($rundist < 4) 
			add $run_count 1 
				if ($echo_count = $sectiona)
					echo ansi_13 #178
					setVar $echo_count 1
				else
					add $echo_count 1
				end
			goto :second_run_count
		end
		if ($rundist > 12)
			add $run_count 1 
				if ($echo_count = $sectiona)
					echo ansi_13 #178
					setVar $echo_count 1
				else
					add $echo_count 1
				end
			goto :second_run_count
		end
		if ($figlist[$run_count] <> 1)
			add $run_count 1 
				if ($echo_count = $sectiona)
					echo ansi_13 #178
					setVar $echo_count 1
				else
					add $echo_count 1
				end
			goto :second_run_count
		end
		setvar $adjrunsec1 SECTOR.WARPS[$run_count][1]
		if ($figlist[$adjrunsec1] <> 1)
			add $run_count 1
				if ($echo_count = $sectiona)
					echo ansi_13 #178
					setVar $echo_count 1
				else
					add $echo_count 1
				end
			goto :second_run_count
		end
		add $run_database_count 1
				if ($echo_count = $sectiona)
					echo ansi_13 #178
					setVar $echo_count 1
				else
					add $echo_count 1
				end
		setVar $run_database[$run_database_count]  $run_count
		add $run_count 1
	end
:end_map
	send "'<" $bot_name "> - Runaway - " $run_database_count " flee sectors plotted.*"
#	setvar $echocount 1
# while ($echocount <= $run_database_count)
#	echo $run_database[$echocount] "*"
#	add $echocount 1
# end


	goto :wait_for_command
:run_pwarp
	if ($firstrun <> 0)
		setVar $pwarp $firstrun
		setVar $firstrun 0
	else
		getRnd $random 1 $run_database_count
		setVar $pwarp $run_database[$random]
		if ($pwarp = 0)
			goto :run_pwarp
		end
	end
	send "p" $pwarp "*y"
	setTextLineTrigger pwarp_lock :pwarp_lock "Locating beam pinpointed"
	setTextLineTrigger no_pwarp_lock :no_pwarp_lock "Your own fighters must be"
	setTextLineTrigger already :already "You are already in that sector!"
	setTextLineTrigger no_ore :no_ore "You do not have enough Fuel Ore"
	pause

:no_pwarp_lock
	killAllTriggers
	setVar $figlist[$pwarp] 0
	setVar $run_database[$random] 0
	goto :run_pwarp

:no_ore
	killAllTriggers
	send "'<" $bot_name "> - Runaway - out of ore...halting.*"
	setVar $mode "General"
	goto :wait_for_command
	

:pwarp_lock
	killAllTriggers
	waitFor "Planet is now in sector"
	setVar $run_database[$random] 0
	send "'<" $bot_name "> - Runaway - Fled Sector!.*"
	setVar $runsec $pwarp
	goto :wait_for_command
:already
	killAllTriggers
	setVar $un_database[$random] 0
	send "'<" $bot_name "> - Runaway -Already in flee sector!.*"
	setVar $runsec $pwarp
	goto :wait_for_command

# -=-=-=-=-=-=-=-=-=-=-=- cim -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--=-=-=-=-=-
:go_cim
	send "'<" $bot_name "> - Stand By - CIMMING...*"
	send "^irq"
	waitFor ": ENDINTERROG"
#	goto :wait_for_command
:mcic_looper
	setVar $mcicfile "_ck_" & GAMENAME & ".nego"
	fileExists $mcic_ck $mcicfile
	if ($mcic_ck = 0)
		goto :done_mcic_read
	end
	setVar $mcic_count 1
:mcic_read_loop
		read $mcicfile $mcicline $mcic_count
		if ($mcicline = EOF)
			goto :done_mcic_read
		end
		if ($mcicline = "")
			add $mcic_count 1
			goto :mcic_read_loop
		end
		getWord $mcicline $mcic_sec 2
		isNumber $number $mcic_sec
		if ($number = 0)
			add $mcic_count 1
			goto :mcic_read_loop
		end
		if ($mcic_sec <> "equ") or ($mcic_sec <> "org")
			add $mcic_count 1
:mcic_count_in
			read $mcicfile $mcicline $mcic_count
			getWord $mcicline $mcic_line_ck 5
			if ($mcic_line_ck <> "cr")
				add $mcic_count 1
				goto :mcic_count_in
			end
			getWord $mcicline $mcic_org 2
			if ($mcic_org = "org")
				add $mcic_count 2
				goto :mcic_read_loop
			end
			getWord $mcicline $actual_mcic 13
			stripText $actual_mcic "/-65"
			if ($actual_mcic = "-65") or  ($actual_mcic = "-64") or  ($actual_mcic = "-63") or  ($actual_mcic = "-62") or  ($actual_mcic = "-61") or  ($actual_mcic = "-60") 
				setVar $mcic[$mcic_sec] $actual_mcic
			end
			add $mcic_count 1
		else
			add $mcic_count 2
		end
		goto :mcic_read_loop
	
:done_mcic_read
	setVar $cim_count 1
	
:cim_looper
	setVar $sectiona SECTORS
	divide $sectiona 78
	setVar $echo_count 1	
		
	send "'<" $bot_name "> - Processing CIM...*"
	waitFor "Message sent on sub-space"
	echo "**"
	While ($cim_count <= SECTORS)
		getSector $cim_count $seccim
		if ($seccim.port.exists = 1)
			setVar $class[$cim_count] "foe"
			if (PORT.BUYFUEL[$cim_count] = 1)
				replaceText $class[$cim_count] "f" "B"
			else
				replaceText $class[$cim_count] "f" "S"
			end
			if (PORT.BUYORG[$cim_count] = 1)
				replaceText $class[$cim_count] "o" "B"
			else
				replaceText $class[$cim_count] "o" "S"
			end
			if (PORT.BUYEQUIP[$cim_count] = 1)
				replaceText $class[$cim_count] "e" "B"
			else
				replaceText $class[$cim_count] "e" "S"
			end
			multiply $seccim.port.ore 100
			if ($seccim.port.perc_ore <> 0)
				divide $seccim.port.ore $seccim.port.perc_ore
			else
				divide $seccim.port.ore 1
			end
			if ($seccim.port.ore > 3000)
				setVar $upped[$cim_count] 1
			end
			multiply $seccim.port.org 100
			if ($seccim.port.perc_org <> 0)
				divide $seccim.port.org $seccim.port.perc_org
			else
				divide $seccim.port.org 1
			end
			if ($seccim.port.org > 3000)
				setVar $upped[$cim_count] 1
			end
			multiply $seccim.port.equip 100
			if ($seccim.port.perc_equip <> 0)
				divide $seccim.port.equip $seccim.port.perc_equip
			else
				divide $seccim.port.equip 1
			end
			if ($seccim.port.equip > 3000)
				setVar $upped[$cim_count] 1
			end
		end
		add $cim_count 1
		if ($echo_count = $sectiona)
			echo ansi_13 #178
			setVar $echo_count 1
		else
			add $echo_count 1
		end
	end

	WaitFor "(?="
	getWord CURRENTLINE $location 1
	if ($location = "Command")
		send "tt"
	elseif ($location = "Citadel")
		send "xt"
	else 
		goto :wait_for_command
	end 
	send "<><><><><><><><><><><><><><><>  " $bot_name "  <><><><><><><><><><><><><><><>*"
	send "Upped Ports:*"
	setVar $cimout_count 1
	while ($cimout_count <= SECTORS)
		if ($upped[$cimout_count] = 1)
			send $cimout_count & "(" & $class[$cimout_count] & ") "
		end
		add $cimout_count 1
	end
	send "***"
	if ($mcic_ck = 1)
		if ($location = "Command")
			send "tt"
		elseif ($location = "Citadel")
			send "xt"
		else
			goto :wait_for_command
		end
	else 
			goto :wait_for_command
		
	end
	send "Ports with MCIC at least -60/-65 :*"
:mcic_send_loop
	setVar $mcic_send_count 1
	while ($mcic_send_count <= SECTORS)
		if ($mcic[$mcic_send_count] <> 0)
			send $mcic_send_count & "(" & $class[$mcic_send_count] & ") " & "MCIC = " & $mcic[$mcic_send_count] & "*"
		end
		add $mcic_send_count 1
	end
	send "***"
	send "'<" $bot_name "> - CIM Processing Complete!*"
	goto :wait_for_command




















