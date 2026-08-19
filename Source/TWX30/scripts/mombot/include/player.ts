#
# PLAYER.TS -- Routines related to the player, such as getting player info
#
# Routines:
#
# :player~quikstats - Gets the player's current stats by parsing the '/' command output.
# :player~currentprompt - Gets the player's current prompt and saves it to $PLAYER~CURRENT_PROMPT
# :player~checkstartingprompt - Checks if the player's current prompt is valid for the command they are trying to use.
# :player~getinfo - Gets various pieces of player info by parsing the output of the 'I' command.
# :player~bwarp - B-warp to a sector, with checking for range, fighter lock, and fuel.
# :player~getcourse - Find a course from a sector to a sector and save the result in $PLAYER~COURSE
# :player~turnonansi / :player~turnoffansi - Turns on or off the player's ANSI setting
# :player~voidadjacent / :player~clearadjacent - Voids or clears voids on all adjacent sectors to the player's current sector.

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~bwarp
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
send "b"
settexttrigger nobwarp :nobwarp "Would you like to place a subspace order for one? "
settexttrigger yesbwarp :yesbwarp "Beam to what sector? (U="
settexttrigger igbwarp :bwarpphotoned "Your ship was hit by a Photon and has been disabled"
pause

:player~nobwarp
gosub :killbwarptriggers
send "*"
setvar $switchboard~message "No Bwarp installed on this planet*"
gosub :switchboard~switchboard
return

:player~yesbwarp
gosub :killbwarptriggers
send $player~warpto&"*"
settexttrigger bwarp_lock :bwarp_no_range "This planetary transporter does not have the range."
settexttrigger no_bwrp_lock :no_bwarp_lock "Do you want to make this transport blind?"
settexttrigger bwarp_ready :bwarp_lock "All Systems Ready, shall we engage?"
settextlinetrigger no_bwarpfuel :bwarpnofuel "This planet does not have enough Fuel Ore to transport you."
pause

:player~bwarp_no_range
gosub :killbwarptriggers
setvar $switchboard~message "Not enough range on this planet's transporter.*"
gosub :switchboard~switchboard
return

:player~no_bwarp_lock
gosub :killbwarptriggers
send "* "
setvar $player~target $player~warpto
setsectorparameter $player~target "FIGSEC" false
setvar $switchboard~message "No fighter down at that destination, aborting*"
gosub :switchboard~switchboard
return

:player~bwarp_lock
gosub :killbwarptriggers
send "y     * "
setvar $player~target $player~warpto
setsectorparameter $player~target "FIGSEC" true
setvar $switchboard~message "B-warp completed.*"
gosub :switchboard~switchboard
return

:player~bwarpnofuel
gosub :killbwarptriggers
setvar $switchboard~message "Not enough fuel on the planet to make the transport!*"
gosub :switchboard~switchboard
return

:player~bwarpphotoned
gosub :killbwarptriggers
setvar $switchboard~message "I have been photoned and can not B-warp!*"
gosub :switchboard~switchboard
return

:player~killbwarptriggers
killtrigger yesbwarp
killtrigger igbwarp
killtrigger nobwarp
killtrigger bwarp_lock
killtrigger no_bwrp_lock
killtrigger bwarp_ready
killtrigger no_bwarpfuel
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~echo
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
loadvar $bot~botisdeaf
getdeafclients $bot~botisdeaf
if ($bot~botisdeaf)
	setvar $bot~silent_running true
	setvar $silent_running true
	savevar $silent_running
	savevar $bot~silent_running
	gosub :switchboard~switchboard
else
	echo $switchboard~message
end

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~checkstartingprompt
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
loadvar $bot~validprompts
if ($player~current_prompt = 0)
	gosub :player~currentprompt
end
getwordpos " "&$bot~validprompts&" " $pos $player~current_prompt
if ($pos <= 0)
	setvar $switchboard~message "Invalid starting prompt: ["&$player~current_prompt&"]. Valid prompt(s) for this command: ["&$bot~validprompts&"]*"
	gosub :switchboard~switchboard
	halt
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~checkcorp
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

setarray $player~corp_members 10 1
setvar $player~corp_count 0
gosub :quikstats
if ($player~current_prompt = "Citadel")
	send "xa"
else
	send "ta"
end
waiton "    Corp Member Name                   Sector  Fighters Shields Mines  Credits"
waiton "------------------------------------------------------------------------------"

:player~ta_again
settextlinetrigger taline :ta_check
pause

:player~ta_check
getwordpos currentline $player~pos "P indicates Trader is on a planet in that sector"
getwordpos currentline $player~pos2 "Corporate command ["
if (($player~pos > 0) or ($player~pos2 > 0))
	goto :done_ta
end
setvar $player~line currentline
trim $player~line
if ($player~line <> "")
	cuttext $player~line $player~name 1 30
	replacetext $player~line $player~name ""
	trim $player~name
	add $player~corp_count 1
	setvar $player~corp_members[$player~corp_count] $player~name
	getword $player~line $player~corp_members[$player~corp_count][1] 1
	replacetext $player~corp_members[$player~corp_count][1] "P" ""
end
goto :ta_again

:player~done_ta
send "q"
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~checkfortravelname
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

if ($parm1 = "me")
	if ($command_caller = "self")
		setvar $switchboard~message "I don't think you need to travel to yourself.*"
		gosub :switchboard~switchboard
		halt
	end
	setvar $player~who_called_me $command_caller
	gosub :checkcorp
	setvar $player~i 1
	while ($player~i <= $player~corp_count)
		lowercase $player~corp_members[$player~i]
		lowercase $player~who_called_me
		getwordpos $player~corp_members[$player~i] $player~pos $player~who_called_me
		if ($player~pos > 0)
			setvar $parm1 $player~corp_members[$player~i][1]
			goto :go_after_me
		end
		add $player~i 1
	end
end
isnumber $player~test $parm1
if ($player~test <> true)
	getwordpos $user_command_line $player~pos "sector:"
	if ($player~pos > 0)
		setvar $player~cline $user_command_line&" "
		gettext $player~cline $parm1 "sector:" " "
		goto :go_after_me
	end
	getwordpos $user_command_line $player~pos #34
	if ($player~pos > 0)
		gettext $user_command_line $player~trader #34 #34
		if ($player~trader = false)
			setvar $player~trader $parm1
		end
	else
		setvar $player~trader $parm1
	end

	gosub :checkcorp
	setvar $player~i 1
	while ($player~i <= $player~corp_count)
		lowercase $player~corp_members[$player~i]
		lowercase $player~trader
		getwordpos $player~corp_members[$player~i] $player~pos $player~trader
		if ($player~pos > 0)
			setvar $parm1 $player~corp_members[$player~i][1]
			goto :go_after_me
		end
		add $player~i 1
	end
end

:player~go_after_me
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~clearadjacent
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

getsector $player~current_sector $player~sectorinfo
if ($player~sectorinfo.warp[1] = 0)
	setvar $switchboard~message "This sector has no warps, try to scan it first!*"
	gosub :switchboard~switchboard
	return
else
	setvar $player~voidsect 0

	:player~clearvoids
	add $player~voidsect 1
	if ($player~voidsect < 7)
		if ($player~sectorinfo.warp[$player~voidsect] <> 0)
			send "CV0*YN"&$player~sectorinfo.warp[$player~voidsect]&"*Q"
		end
		goto :clearvoids
	end

	send "/"
	waiton " Sect "
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~commasize
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
format $player~value $player~value "NUMBER"
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~currentprompt
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
settexttrigger prompt :allpromptscatch #145&#8
setdelaytrigger prompt_delay :current_prompt_delay 5000
send #145
pause

:player~current_prompt_delay
settextouttrigger atkeys :current_prompt_at_keys
setdelaytrigger prompt_delay :verifydelay 30000
pause

:player~current_prompt_at_keys
getouttext $player~out
send $player~out
killtrigger prompt_delay
return

:player~allpromptscatch
killtrigger prompt_delay
gosub :player~parse_current_prompt_line
setvar $player~startinglocation $player~current_prompt
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~parse_current_prompt_line
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $player~ansiline currentansiline
setvar $player~self_destruct_prompt false
getwordpos $player~ansiline $player~pos "ARE YOU SURE CAPTAIN? (Y/N) [N]"
if ($player~pos > 0)
	setvar $player~self_destruct_prompt true
end
setvar $player~full_current_prompt currentline
striptext $player~full_current_prompt #145
striptext $player~full_current_prompt #8
getword $player~full_current_prompt $player~current_prompt 1
if ($player~current_prompt = 0)
	setvar $player~full_current_prompt currentansiline
	striptext $player~full_current_prompt #145
	striptext $player~full_current_prompt #8
	getword $player~full_current_prompt $player~current_prompt 1
end
striptext $player~current_prompt #145
striptext $player~current_prompt #8
return

:player~verifydelay
killalltriggers
disconnect

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~formatnumberforspaces
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if ($player~inputvariable < 10)
	setvar $player~outputvariable "    "&$player~inputvariable
elseif ($player~inputvariable < 100)
	setvar $player~outputvariable "   "&$player~inputvariable
elseif ($player~inputvariable < 1000)
	setvar $player~outputvariable "  "&$player~inputvariable
elseif ($player~inputvariable < 10000)
	setvar $player~outputvariable " "&$player~inputvariable
else
	setvar $player~outputvariable $player~inputvariable
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~formatpercentagesforspaces
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if ($player~inputvariable < 10)
	setvar $player~outputvariable "  ("&$player~inputvariable&"%)"
elseif ($player~inputvariable < 100)
	setvar $player~outputvariable " ("&$player~inputvariable&"%)"
elseif ($player~inputvariable < 1000)
	setvar $player~outputvariable "("&$player~inputvariable&"%)"
else
	setvar $player~outputvariable $player~inputvariable
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~getinfo
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $player~noflip true
setvar $player~photons 0
setvar $player~towed ""
setvar $player~scan_type "None"
setvar $player~twarp_type 0
setvar $player~corpstring "[0]"
setvar $player~igstat 0

gosub :player~currentprompt
if ($player~current_prompt <> "Command") and ($player~current_prompt <> "Citadel")
	setvar $switchboard~message "getinfo must be run at the Command or Citadel prompt.*"
	gosub :switchboard~switchboard
	return
end

:player~waitoninfo
settextlinetrigger getinfo_cn9_check_1 :getinfo_cn9_check "<N> Interdictor Control"
settextlinetrigger getinfo_cn9_check_2 :getinfo_cn9_check "<N> Move to NavPoint"
settextlinetrigger gettradername :gettradername "Trader Name    :"
settextlinetrigger getexpandalign :getexpandalign "Rank and Exp"
settextlinetrigger getcorp :getcorp "Corp           #"
settextlinetrigger getshiptype :getshiptype "Ship Info      :"
settextlinetrigger gettpw :gettpw "Turns to Warp  :"
settextlinetrigger getsect :getsect "Current Sector :"
settextlinetrigger getturns :getturns "Turns left"
settextlinetrigger gettow :gettow "Tractor Beam   : ON, towing "
settextlinetrigger getholds :getholds "Total Holds"
settextlinetrigger getfighters :getfighters "Fighters       :"
settextlinetrigger getshields :getshields "Shield points  :"
settextlinetrigger getphotons :getphotons "Photon Missiles:"
settextlinetrigger getscantype :getscantype "LongRange Scan :"
settextlinetrigger gettwarptype1 :gettwarptype1 "  (Type 1 Jump):"
settextlinetrigger gettwarptype2 :gettwarptype2 "  (Type 2 Jump):"
settextlinetrigger getcredits :getcredits "Credits"
settextlinetrigger checkig :checkig "Interdictor ON :"
send "i"
pause

:player~getinfo_cn9_check
setvar $player~noflip true
pause

:player~gettradername
killtrigger getinfo_cn9_check_1
killtrigger getinfo_cn9_check_2
setvar $player~trader_name currentline
striptext $player~trader_name "Trader Name    : "
setvar $player~i 1
while ($player~i <= $player~rankslength)
	setvar $player~temp $player~ranks[$player~i]
	striptext $player~temp "31m"
	striptext $player~temp "36m"
	striptext $player~trader_name $player~temp&" "
	add $player~i 1
end
pause

:player~gettow
setvar $player~line currentline&"<<|END|>>"
gettext $player~line $player~towed "Tractor Beam   : ON, towing " "<<|END|>>"
pause

:player~getexpandalign
getword currentline $player~experience 5
getword currentline $player~alignment 7
striptext $player~experience ","
striptext $player~alignment ","
striptext $player~alignment "Alignment="
pause

:player~getcorp
getword currentline $player~corp 3
striptext $player~corp ","
setvar $player~corpstring "["&$player~corp&"]"
pause

:player~getshiptype
getwordpos currentline $player~shiptypeend "Ported="
subtract $player~shiptypeend 18
cuttext currentline $player~ship_type_long 18 $player~shiptypeend
pause

:player~gettpw
getword currentline $player~turns_per_warp 5
pause

:player~getsect
getword currentline $player~current_sector 4
pause

:player~getturns
getword currentline $player~turns 4
if ($player~turns = "Unlimited")
	setvar $player~turns 65000
	setvar $player~unlimitedgame true
end
savevar $player~unlimitedgame
pause

:player~getholds
setvar $player~temp currentline&" "
gettext $player~temp $player~ore_holds "Ore=" " "
if ($player~ore_holds = "")
	setvar $player~ore_holds 0
end
gettext $player~temp $player~organic_holds "Organics=" " "
if ($player~organic_holds = "")
	setvar $player~organic_holds 0
end
gettext $player~temp $player~equipment_holds "Equipment=" " "
if ($player~equipment_holds = "")
	setvar $player~equipment_holds 0
end
gettext $player~temp $player~colonist_holds "Colonists=" " "
if ($player~colonist_holds = "")
	setvar $player~colonist_holds 0
end
gettext $player~temp $player~empty_holds "Empty=" " "
if ($player~empty_holds = "")
	setvar $player~empty_holds 0
end
pause

:player~getfighters
getword currentline $player~fighters 3
striptext $player~fighters ","
pause

:player~getshields
getword currentline $player~shields 4
striptext $player~shields ","
pause

:player~getphotons
getword currentline $player~photons 3
pause

:player~getscantype
getword currentline $player~scan_type 4
pause

:player~gettwarptype1
getword currentline $player~twarp_1_range 4
setvar $player~twarp_type 1
pause

:player~gettwarptype2
getword currentline $player~twarp_2_range 4
setvar $player~twarp_type 2
pause

:player~checkig
getword currentline $player~igstat 4
pause

:player~getcredits
getword currentline $player~credits 3
striptext $player~credits ","
if ($player~igstat = 0)
	setvar $player~igstat "NO IG"
end

:player~getinfodone
killtrigger getexpandalign
killtrigger getcorp
killtrigger getshiptype
killtrigger gettpw
killtrigger gettow
killtrigger getsect
killtrigger getturns
killtrigger getholds
killtrigger getfighters
killtrigger getshields
killtrigger getphotons
killtrigger getscantype
killtrigger gettwarptype1
killtrigger gettwarptype2
killtrigger getcredits
killtrigger checkig
killtrigger getinfodone
killtrigger getinfodone2
killtrigger getinfo_cn9_check_1
killtrigger getinfo_cn9_check_2

savevar $player~unlimitedgame

if ($player~save)

	savevar $player~credits
	savevar $player~fighters
	savevar $player~shields
	savevar $player~total_holds
	savevar $player~ore_holds
	savevar $player~organic_holds
	savevar $player~equipment_holds
	savevar $player~colonist_holds
	savevar $player~photons
	savevar $player~armids
	savevar $player~limpets
	savevar $player~genesis
	savevar $player~twarp_type
	savevar $player~cloaks
	savevar $player~beacons
	savevar $player~atomic
	savevar $player~corbo
	savevar $player~eprobes
	savevar $player~mine_disruptors
	savevar $player~psychic_probe
	savevar $player~planet_scanner
	savevar $player~scan_type
	savevar $player~alignment
	savevar $player~experience
	savevar $player~ship_number
	savevar $player~trader_name
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~quikstats
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $player~current_prompt "Undefined"
setvar $player~quikstats_retry 0
if ($player~towed = 0)
	setvar $player~towed ""
end
loadvar $player~unlimitedgame

:player~trypromptagain
killtrigger toolongprompt
killtrigger noprompt
killtrigger prompt
killtrigger statlinetrig
killtrigger getline2
settextlinetrigger prompt :allprompts #145&#8
settextlinetrigger statlinetrig :statstart #179
setdelaytrigger toolongprompt :trypromptagain 10000
send #145&"/"
pause

:player~allprompts
gosub :player~parse_current_prompt_line
settextlinetrigger prompt :allprompts #145&#8
pause

:player~statstart
killtrigger prompt
setvar $player~stats ""
setvar $player~wordy ""

:player~statsline
killtrigger statlinetrig
killtrigger getline2
setvar $player~line2 currentline
replacetext $player~line2 #179 " "
striptext $player~line2 ","
setvar $player~stats $player~stats&$player~line2
getwordpos $player~line2 $player~pos "Ship"
if ($player~pos > 0)
	goto :gotstats
else
	settextlinetrigger getline2 :statsline
	pause
end

:player~gotstats
killtrigger toolongprompt
killtrigger getline2
setvar $player~stats $player~stats&" @@@"
getwordpos $player~stats $player~pos "Sect "
if ($player~pos = 0)
	add $player~quikstats_retry 1
	if ($player~quikstats_retry <= 3)
		goto :player~trypromptagain
	end
end
getwordpos $player~stats $player~pos "Figs "
if ($player~pos = 0)
	add $player~quikstats_retry 1
	if ($player~quikstats_retry <= 3)
		goto :player~trypromptagain
	end
end
setvar $player~current_word 1
getword $player~stats $player~wordy $player~current_word

:player~parsestats
if ($player~wordy <> "@@@")
	if ($player~wordy = "Sect")
		getword $player~stats $player~current_sector ($player~current_word + 1)
	elseif ($player~wordy = "Turns")
		getword $player~stats $player~turns ($player~current_word + 1)
		if ($player~unlimitedgame = true)
			setvar $player~turns 65000
		end
	elseif ($player~wordy = "Creds")
		getword $player~stats $player~credits ($player~current_word + 1)
	elseif ($player~wordy = "Figs")
		getword $player~stats $player~fighters ($player~current_word + 1)
		savevar $player~fighters
	elseif ($player~wordy = "Shlds")
		getword $player~stats $player~shields ($player~current_word + 1)
		savevar $player~shields
	elseif ($player~wordy = "Hlds")
		getword $player~stats $player~total_holds ($player~current_word + 1)
	elseif ($player~wordy = "Ore")
		getword $player~stats $player~ore_holds ($player~current_word + 1)
	elseif ($player~wordy = "Org")
		getword $player~stats $player~organic_holds ($player~current_word + 1)
	elseif ($player~wordy = "Equ")
		getword $player~stats $player~equipment_holds ($player~current_word + 1)
	elseif ($player~wordy = "Col")
		getword $player~stats $player~colonist_holds ($player~current_word + 1)
	elseif ($player~wordy = "Phot")
		getword $player~stats $player~photons ($player~current_word + 1)
	elseif ($player~wordy = "Armd")
		getword $player~stats $player~armids ($player~current_word + 1)
	elseif ($player~wordy = "Lmpt")
		getword $player~stats $player~limpets ($player~current_word + 1)
	elseif ($player~wordy = "GTorp")
		getword $player~stats $player~genesis ($player~current_word + 1)
	elseif ($player~wordy = "TWarp")
		getword $player~stats $player~twarp_type ($player~current_word + 1)
	elseif ($player~wordy = "Clks")
		getword $player~stats $player~cloaks ($player~current_word + 1)
	elseif ($player~wordy = "Beacns")
		getword $player~stats $player~beacons ($player~current_word + 1)
	elseif ($player~wordy = "AtmDt")
		getword $player~stats $player~atomic ($player~current_word + 1)
	elseif ($player~wordy = "Corbo")
		getword $player~stats $player~corbo ($player~current_word + 1)
	elseif ($player~wordy = "EPrb")
		getword $player~stats $player~eprobes ($player~current_word + 1)
	elseif ($player~wordy = "MDis")
		getword $player~stats $player~mine_disruptors ($player~current_word + 1)
	elseif ($player~wordy = "PsPrb")
		getword $player~stats $player~psychic_probe ($player~current_word + 1)
	elseif ($player~wordy = "PlScn")
		getword $player~stats $player~planet_scanner ($player~current_word + 1)
	elseif ($player~wordy = "LRS")
		getword $player~stats $player~scan_type ($player~current_word + 1)
	elseif ($player~wordy = "Aln")
		getword $player~stats $player~alignment ($player~current_word + 1)
	elseif ($player~wordy = "Exp")
		getword $player~stats $player~experience ($player~current_word + 1)
	elseif ($player~wordy = "Corp")
		getword $player~stats $player~corp ($player~current_word + 1)
		setvar $player~corpnumber $player~corp
		savevar $player~corpnumber
	elseif ($player~wordy = "Ship")
		getword $player~stats $player~ship_number ($player~current_word + 1)
		getword $player~stats $player~ship_type ($player~current_word + 2)
	end
	add $player~current_word 1
	getword $player~stats $player~wordy $player~current_word
	goto :player~parsestats
end
if ($player~current_prompt = "Undefined")
	settextlinetrigger promptafterstats :player~promptafterstats #145&#8
	setdelaytrigger noprompt :player~noprompt 1000
	pause
end
goto :player~donequikstats

:player~promptafterstats
killtrigger noprompt
gosub :player~parse_current_prompt_line
goto :player~donequikstats

:player~noprompt
killtrigger promptafterstats
goto :player~donequikstats

:player~donequikstats
killtrigger statlinetrig
killtrigger getline2
killtrigger prompt
setvar $player~empty_holds $player~total_holds
subtract $player~empty_holds $player~ore_holds
subtract $player~empty_holds $player~organic_holds
subtract $player~empty_holds $player~equipment_holds
subtract $player~empty_holds $player~colonist_holds
savevar $player~unlimitedgame
if ($player~save)
	savevar $player~corp
	savevar $player~credits
	savevar $player~current_sector
	savevar $player~turns
	savevar $player~fighters
	savevar $player~shields
	savevar $player~total_holds
	savevar $player~ore_holds
	savevar $player~organic_holds
	savevar $player~equipment_holds
	savevar $player~colonist_holds
	savevar $player~empty_holds
	savevar $player~photons
	savevar $player~armids
	savevar $player~limpets
	savevar $player~genesis
	savevar $player~twarp_type
	savevar $player~cloaks
	savevar $player~beacons
	savevar $player~atomic
	savevar $player~corbo
	savevar $player~eprobes
	savevar $player~mine_disruptors
	savevar $player~psychic_probe
	savevar $player~planet_scanner
	savevar $player~scan_type
	savevar $player~alignment
	savevar $player~experience
	savevar $player~ship_number
	savevar $player~trader_name
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~exit_menu_deaf
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if ($bot~menu_deaf_depth > 0)
	subtract $bot~menu_deaf_depth 1
end

if ($bot~menu_deaf_depth <= 0)
	if ($bot~menu_deaf_restore = true)
		setdeafclients true
		setvar $bot~botisdeaf true
	else
		setdeafclients false
		setvar $bot~botisdeaf false
	end
	savevar $bot~botisdeaf
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~discod
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $player~tagline "["&$command&"]"
setvar $player~taglineb "["&$command&"]"
killalltriggers
echo "**"&ansi_14&$player~taglineb&ansi_15&" Disconnected **"

:player~disco_test
if (connected <> true)
	setdelaytrigger emancipate_cpu :emancipate_cpu 3000
	echo "**"&ansi_14&$player~taglineb&ansi_15&" Auto Resume Initiated - Awaiting Connection!**"
	pause

	:player~emancipate_cpu
	goto :disco_test
end
waitfor "(?="
setdelaytrigger waitingabit :waitingabit 3000
echo "**"&ansi_14&$player~taglineb&ansi_15&" Connected - Waiting For Command Prompt!**"
pause

:player~waitingabit
killalltriggers
gosub :quikstats
if ($player~current_prompt = "Command")
	setvar $switchboard~message $player~taglineb&" - Restarting!**"
	gosub :switchboard~switchboard
	waitfor "Message sent on sub-space channel"
	# goto :inac
	halt
elseif ($player~current_prompt = "Citadel")
	setvar $switchboard~message $player~taglineb&" - Restarting!**"
	gosub :switchboard~switchboard
	waitfor "Message sent on sub-space channel"
	send "qqqq**"
	# goto :inac
	halt
else
	send " p d 0* 0* 0* * *** * c q q q q q z 2 2 c q * z * *** * * '"&$player~taglineb&"Attempting to Reach Correct Prompt...*"
	settextlinetrigger emq_complete :emq_delay "Attempting to Reach Correct Prompt..."
	setdelaytrigger emq_delay :emq_delay 3000
	pause

	:player~emq_delay
	killalltriggers
	goto :disco_test
end

:player~setconnectiontriggers
killtrigger discod1
killtrigger discod2
seteventtrigger discod1 :discod "CONNECTION LOST"
seteventtrigger discod2 :discod "Connections have been temporarily disabled."
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~startcnsettings
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
send "CN"
settextlinetrigger ansi1 :cncheck "(1) ANSI graphics            - Off"
settextlinetrigger anim1 :cncheck "(2) Animation display        - On"
settextlinetrigger page1 :cncheck "(3) Page on messages         - On"
settextlinetrigger setsschn :setsschn "(4) Sub-space radio channel"
settextlinetrigger silence1 :cncheck "(7) Silence ALL messages     - Yes"
settextlinetrigger abortdisplay1 :cncheck "(9) Abort display on keys    - ALL KEYS"
settextlinetrigger messagedisplay1 :cncheck "(A) Message Display Mode     - Long"
settextlinetrigger screenpauses1 :cncheck "(B) Screen Pauses            - Yes"
settextlinetrigger onlineautoflee0 :cncdone "(C) Online Auto Flee         - Off"
settextlinetrigger onlineautoflee1 :cncalmostdone "(C) Online Auto Flee         - On"
pause

:player~cncheck
gosub :getcnc
pause

:player~setsschn
getword currentline $subspace 6
if ($subspace = 0)
	getrnd $subspace 101 60000
	send 4&$subspace&"*"
end
savevar $subspace
pause

:player~cncalmostdone
gosub :getcnc

:player~cncdone
send "QQ"
killtrigger 1
killtrigger 2
settexttrigger 1 :substartcncontinue "Command [TL="
settexttrigger 2 :substartcncontinue "Citadel command (?=help)"
pause

:player~substartcncontinue
killtrigger 1
killtrigger 2
return

:player~getcnc
getword currentline $player~cnc 1
striptext $player~cnc "("
striptext $player~cnc ")"
send $player~cnc&"  "
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~swathoff
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
loadvar $player~swathoff

if ($player~swathoff = false)
	settexttrigger swathison :swathison "Command [TL="
	setdelaytrigger swathisoff :swathisoff 2000
	pause

	:player~swathison
	killtrigger swathisoff
	killtrigger swathison
	setvar $player~swathoffmessage "Detected SWATH Autohaggle"
	setvar $player~swathoff false
	savevar $player~swathoff
	return

	:player~swathisoff
	killtrigger swathisoff
	killtrigger swathison
	setvar $player~swathoff true
	savevar $player~swathoff
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~topoff
:player~do_topoff_again
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
killtrigger topoff_success
killtrigger topoff_failure1
killtrigger topoff_failure2
send " F"
waiton "Your ship can support up to"
getword currentline $player~ftrs_to_leave 10
striptext $player~ftrs_to_leave ","
striptext $player~ftrs_to_leave " "
if ($player~ftrs_to_leave < 1)
	setvar $player~ftrs_to_leave 1
end
send " "&$player~ftrs_to_leave&" * c d"
settextlinetrigger topoff_success :topoff_success "Done. You have "
settextlinetrigger topoff_failure1 :do_topoff_again "You don't have that many fighters available."
settextlinetrigger topoff_failure2 :do_topoff_again "Too many fighters in your fleet!  You are limited to"
pause

:player~topoff_success
killtrigger topoff_failure1
killtrigger topoff_failure2
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~turnoffansi
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
send "c n"
killalltriggers
waiton "(1) ANSI graphics"
getword currentline $player~ansistatus 5
waiton "(2) Animation display"
getword currentline $player~animationstatus 5
if ($player~animationstatus = "On")
	send 2
end
if ($player~ansistatus = "On")
	send "1 q q"
else
	send "q q"
end
waiton "<Computer deactivated>"
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~turnonansi
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
send "c n"
killalltriggers
waiton "(1) ANSI graphics"
getword currentline $player~ansistatus 5
if ($player~ansistatus = "Off")
	send "1 q q"
else
	send "q q"
end
waiton "<Computer deactivated>"
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~stripansi
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
# [1;33m[0m[1;31mRoyal [5;37mFlush[0;32m
if ($player~input = 0) or ($player~input = "")
	return
end
getwordpos $player~input $pos "["
if ($pos < 1)
	return
elseif ($pos = 1)
	setvar $pre ""
else
	cuttext $player~input $pre 1 ($pos - 1)
end
cuttext $player~input $post ($pos + 6) 999
setvar $player~input ($pre & $post)
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~init
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setarray $player~traders 200
setarray $player~faketraders 200
setarray $player~emptyships 100

:player~initranks
setvar $player~rankslength 46
setarray $player~ranks $player~rankslength
setvar $player~ranks[1] "36mCivilian"
setvar $player~ranks[2] "36mPrivate 1st Class"
setvar $player~ranks[3] "36mPrivate"
setvar $player~ranks[4] "36mLance Corporal"
setvar $player~ranks[5] "36mCorporal"
setvar $player~ranks[6] "36mStaff Sergeant"
setvar $player~ranks[7] "36mGunnery Sergeant"
setvar $player~ranks[8] "36m1st Sergeant"
setvar $player~ranks[9] "36mSergeant Major"
setvar $player~ranks[10] "36mSergeant"
setvar $player~ranks[11] "31mAnnoyance"
setvar $player~ranks[12] "31mNuisance 3rd Class"
setvar $player~ranks[13] "31mNuisance 2nd Class"
setvar $player~ranks[14] "31mNuisance 1st Class"
setvar $player~ranks[15] "31mMenace 3rd Class"
setvar $player~ranks[16] "31mMenace 2nd Class"
setvar $player~ranks[17] "31mMenace 1st Class"
setvar $player~ranks[18] "31mSmuggler 3rd Class"
setvar $player~ranks[19] "31mSmuggler 2nd Class"
setvar $player~ranks[20] "31mSmuggler 1st Class"
setvar $player~ranks[21] "31mSmuggler Savant"
setvar $player~ranks[22] "31mRobber"
setvar $player~ranks[23] "31mTerrorist"
setvar $player~ranks[24] "31mInfamous Pirate"
setvar $player~ranks[25] "31mNotorious Pirate"
setvar $player~ranks[26] "31mDread Pirate"
setvar $player~ranks[27] "31mPirate"
setvar $player~ranks[28] "31mGalactic Scourge"
setvar $player~ranks[29] "31mEnemy of the State"
setvar $player~ranks[30] "31mEnemy of the People"
setvar $player~ranks[31] "31mEnemy of Humankind"
setvar $player~ranks[32] "31mHeinous Overlord"
setvar $player~ranks[33] "31mPrime Evil"
setvar $player~ranks[34] "36mChief Warrant Officer"
setvar $player~ranks[35] "36mWarrant Officer"
setvar $player~ranks[36] "36mEnsign"
setvar $player~ranks[37] "36mLieutenant J.G."
setvar $player~ranks[38] "36mLieutenant Commander"
setvar $player~ranks[39] "36mLieutenant"
setvar $player~ranks[40] "36mCommander"
setvar $player~ranks[41] "36mCaptain"
setvar $player~ranks[42] "36mCommodore"
setvar $player~ranks[43] "36mRear Admiral"
setvar $player~ranks[44] "36mVice Admiral"
setvar $player~ranks[45] "36mFleet Admiral"
setvar $player~ranks[46] "36mAdmiral"
setvar $player~lasttarget ""
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~getcourse
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if (($player~destination <= 0) or ($player~destination = ""))
	setvar $player~courselength 0
	return
end
if (($player~starting_point <= 0) or ($player~starting_point = ""))
	setvar $player~starting_point currentsector
end

# try getcourse system function first, if we have grid data
getcourse $player~course $player~starting_point $player~destination
if ($player~course > 0)
	setvar $player~courselength ($player~course + 1)
	return
end

setvar $player~sectors ""
setarray $player~course 80
settextlinetrigger sectorlinetrig :sectorsline " > "
send "^f"&$player~starting_point&"*"&$player~destination&"*"
pause

:player~gotsectors
setvar $player~sectors $player~sectors&" :::"
setvar $player~courselength 0
setvar $player~index 1
goto :player~keepgoing

:player~keepgoing
getword $player~sectors $player~course[$player~index] $player~index
while ($player~course[$player~index] <> ":::")
	add $player~courselength 1
	add $player~index 1
	getword $player~sectors $player~course[$player~index] $player~index
end
return

:player~nocappingtargets
killtrigger noctarget
killtrigger foundcaptarget
send "* "

:player~sectorsline
killtrigger sectorlinetrig
killtrigger sectorlinetrig2
killtrigger sectorlinetrig3
killtrigger sectorlinetrig4
killtrigger donepath
killtrigger donepath2
setvar $player~line currentline
replacetext $player~line ">" " "
striptext $player~line "("
striptext $player~line ")"
setvar $player~line $player~line&" "
getwordpos $player~line $player~pos "So what's the point?"
getwordpos $player~line $player~pos2 ": ENDINTERROG"
getwordpos $player~line $player~pos3 " No route within "

if (($player~pos > 0) or ($player~pos2 > 0) or ($player~pos3 > 0))
	goto :nopath
end
getwordpos $player~line $player~pos " sector "
getwordpos $player~line $player~pos2 "TO"

if (($player~pos <= 0) and ($player~pos2 <= 0))
	setvar $player~sectors $player~sectors&" "&$player~line
end
getwordpos $player~line $player~pos " "&$player~destination&" "
getwordpos $player~line $player~pos2 "("&$player~destination&")"
getwordpos $player~line $player~pos3 "TO"

if ((($player~pos > 0) or ($player~pos2 > 0)) and ($player~pos3 <= 0))
	send "* q "
	goto :gotsectors
else
	settextlinetrigger sectorlinetrig :sectorsline " > "
	settextlinetrigger sectorlinetrig2 :sectorsline " "&$player~destination&" "
	settextlinetrigger sectorlinetrig3 :sectorsline " "&$player~destination
	settextlinetrigger sectorlinetrig4 :sectorsline "("&$player~destination&")"
	settextlinetrigger donepath :sectorsline "So what's the point?"
	settextlinetrigger donepath2 :sectorsline ": ENDINTERROG"
end
pause

:player~nopath
send "q '{" $switchboard~bot_name "} - No path to that sector, cannot mow!*"
setvar $player~course 0
setvar $player~courselength 0
return

:player~stoppingpoint
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~addfigtodata
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if (($player~target > 0) and ($player~target <= sectors))
	setsectorparameter $player~target "FIGSEC" true
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~removefigfromdata
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
getsectorparameter $player~target "FIGSEC" $player~check
if ($player~check = true)
	getsectorparameter 2 "FIG_COUNT" $player~figcount
	setsectorparameter 2 "FIG_COUNT" ($player~figcount - 1)
end
setsectorparameter $player~target "FIGSEC" false
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~enter_menu_deaf
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if ($bot~menu_deaf_depth <= 0)
	getdeafclients $bot~menu_deaf_restore
end
add $bot~menu_deaf_depth 1
setdeafclients true
setvar $bot~botisdeaf true
savevar $bot~botisdeaf
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~ansicolors
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $player~cls #27 & "[2J"
setvar $player~black #27 & "[1;30m"
setvar $player~red #27 & "[1;31m"
setvar $player~green #27 & "[1;32m"
setvar $player~yellow #27 & "[1;33m"
setvar $player~blue #27 & "[1;34m"
setvar $player~magenta #27 & "[1;35m"
setvar $player~cyan #27 & "[1;36m"
setvar $player~white #27 & "[1;37m"
setvar $player~blackwhite #27 & "[0;30;47m"
setvar $player~whitered #27 & "[1;37;41m"
setvar $player~redwhite #27 & "[1;31;47m"
setvar $player~yellowred #27 & "[1;33;41m"
setvar $player~resetblack #27 & "[1;37;40m"
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~msgs_off
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $was_silent false

:msgs_off_again
settexttrigger onmsgs_on :onmsgs_on "Displaying all messages."
settexttrigger onmsgs_off :onmsgs_off "Silencing all messages."
send "|"
pause

:onmsgs_on
killtrigger onmsgs_off
setvar $was_silent true
goto :msgs_off_again

:onmsgs_off
killtrigger onmsgs_on
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:player~msgs_on
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $was_silent true

:msgs_on_again
settexttrigger onmsgs_on2 :onmsgs_on "Displaying all messages."
settexttrigger onmsgs_off2 :onmsgs_off "Silencing all messages."
send "|"
pause

:onmsgs_off2
killtrigger onmsgs_on2
setvar $was_silent false
goto :msgs_on_again

:onmsgs_on2
killtrigger onmsgs_off2
return

include "source\include\switchboard"
