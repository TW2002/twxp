# SECTOR.TS -- Gets data about the current sector and adjacent sectors, including traders, fake traders, empty ships, and beacons.
#
# External routines:
# :sector~getsectordata
# :sector~getautosectordata
# :sector~getavoids
# :sector~setavoids

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:sector~getavoids
# Written by Shadow
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
gosub :player~quikstats
if ($player~current_prompt <> "Command") and ($player~current_prompt <> "Citadel")
	setvar $switchboard~message "You must be at the Citadel or Command prompt to get avoids.*"
	gosub :switchboard~switchboard
	halt
end
setvar $sector~avoidcount 0
setarray $sector~avoids sectors
send "cx"
waiton "<List Avoided Sectors>"

:avoidloop
settexttrigger endavoid :endavoid "Computer command"
settextlinetrigger endavoid2 :endavoid "No Sectors are currently"
settextlinetrigger gotavoids :gotavoids " "
pause

:gotavoids
killalltriggers
setvar $aline currentline

:avoidloop2
getwordpos $aline $pos " "
#echo "aline: " $aline "*"
if ($pos < 1)
	goto :avoidlast
end
if ($pos = 1)
	cuttext $aline $aline2 2 999
	setvar $aline $aline2
	goto :avoidloop2
end
#echo "aline: " $aline "*"
getword $aline $sect 1
#echo "gotsect: " $sect "*"
add $sector~avoidcount 1
setvar $sector~avoids[$sector~avoidcount] $sect
getwordpos $aline $pos " "
if ($pos < 1)
	goto :avoidlast
end
cuttext $aline $aline2 $pos 999
setvar $aline $aline2
goto :avoidloop2

:avoidlast
add $sector~avoidcount 1
setvar $sector~avoids[$sector~avoidcount] $aline
goto :avoidloop

:endavoid
killalltriggers
send "q"
settexttrigger sector_avoids_command :sector~avoids_prompt "Command [TL"
settexttrigger sector_avoids_citadel :sector~avoids_prompt "Citadel command"
pause

:sector~avoids_prompt
killalltriggers
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:sector~setavoids
# Written by Shadow
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if ($sector~avoidcount = 0)
	return
end
if ($player~current_prompt <> "Command") and ($player~current_prompt <> "Citadel")
	setvar $switchboard~message "You must be at the Citadel or Command prompt to set avoids.*"
	gosub :switchboard~switchboard
	halt
end
send "^"
waiton ": "
setvar $i 0
while ($i < $sector~avoidcount)
	add $i 1
	send "S" & $sector~avoids[$i] & "*"
end
send "Q"
setvar $sector~avoids 0
setvar $sector~avoidcount 0
waiton ": ENDINTERROG"
return

# Moved from :player and reworked by Shadow to be more user friendly and efficient
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:sector~voidadjacent
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
gosub :sector~getavoids
getsector $player~current_sector $sectorinfo
if ($sectorinfo.warp[1] = 0)
	setvar $switchboard~message "This sector has no warps, maybe you need to scan it first.*"
	gosub :switchboard~switchboard
	halt
else
	setvar $voidsect 0
	send "^"
	waiton ": "

	:voids
	add $voidsect 1
	if ($voidsect < 7)
		if ($sectorinfo.warp[$voidsect] <> 0)
			send "S"&$sectorinfo.warp[$voidsect]&"*"
		end
		goto :voids
	end
	send "Q"
	waiton ": ENDINTERROG"
end
return

# Moved from :player and reworked by Shadow to be more user friendly and efficient
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:sector~clearvoidadjacent
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
gosub :player~quikstats
if ($player~current_prompt <> "Command") and ($player~current_prompt <> "Citadel")
	setvar $switchboard~message "You must be at the Citadel or Command prompt to clear avoids.*"
	gosub :switchboard~switchboard
	return
end
if ($sector~avoidcount > 0)
	send "cv0*yyq"
	waiton "<Computer deactivated>"
	gosub :sector~setavoids
else
	getsector $player~current_sector $sectorinfo
	if ($sectorinfo.warp[1] = 0)
		setvar $switchboard~message "This sector has no warps, maybe you need to scan it first.*"
		gosub :switchboard~switchboard
		return
	end
	setvar $voidsect 0
	send "^"
	waiton ": "
	while ($voidsect < 7)
		add $voidsect 1
		if ($sectorinfo.warp[$voidsect] <> 0)
			send "C"&$sectorinfo.warp[$voidsect]&"*"
		end
	end
	send "Q"
	waiton ": ENDINTERROG"
end
return

##################################################################################################################################
# GETBACKDOOR routine by Shadow
:sector~getbackdoor
##################################################################################################################################

loadvar $map~stardock
setvar $isdock false
if ($sector~destination = $map~stardock)
	if ($map~stardock > 10) and (sector.warpcount[$map~stardock] = 6)
		setvar $isdock true
	else
		setvar $switchboard~message "Unable to determine backdoor because stardock is not set correctly.*"
		gosub :switchboard~switchboard
		return
	end
end

#setVar $validPrompts "Command Citadel"
#gosub :player~getcurrentprompt
#getWordPos " "&$validPrompts&" " $bot~pos $PLAYER~CURRENT_PROMPT
#if ($bot~pos <= 0)
#  setVar $SWITCHBOARD~message "Invalid starting prompt: ["&$PLAYER~CURRENT_PROMPT&"]. Valid prompt(s) for this command: ["&$validPrompts&"]*"
#  gosub :SWITCHBOARD~switchboard
#  return
#end

if ($sector~destination = 0)
	setvar $switchboard~message "Unable to determine backdoor because destination is not set.*"
	gosub :switchboard~switchboard
	return
else
	isnumber $tst $sector~destination
	if ($tst = false)
		setvar $switchboard~message "Unable to determine backdoor because destination is not a number.*"
		gosub :switchboard~switchboard
		return
	end
end

#setdeafclients TRUE

if (sector.warpcount[$sector~destination] = 0)
	send "^I"
	waiton ": "
	send "Q"
	waiton ": ENDINTERROG"
end

gosub :sector~getavoids

send "^"
setvar $i 1
while ($i <= sector.warpcount[$sector~destination])
	send "S" & sector.warps[$sector~destination][$i] & "*"
	add $i 1
end
send "Q"
waiton " ENDINTERROG"
setvar $sector~backdoor 0
if ($sector~destination < 10)
	send "cf11*" & $sector~destination & "*"
else
	send "cf1*" & $sector~destination & "*"
end
settextlinetrigger void1 :void1 "The shortest path"
settextlinetrigger nopath :nopath "Error - No route within "
pause

:nopath
killalltriggers
send "y"
goto :endgetbackdoor

:void1
killalltriggers
settexttrigger voiddone :voiddone "Computer command [TL"
settextlinetrigger void2 :void2 ">"
pause

:void2
setvar $lastline currentline
settextlinetrigger void2 :void2 " > "
pause

:voiddone
killalltriggers
#echo "*lastline: [" $lastline "]*"
splittext $lastline $sects " > "
setvar $i ($sects - 1)
setvar $sector~backdoor $sects[$i]
striptext $sector~backdoor " "
striptext $sector~backdoor "("
striptext $sector~backdoor ")"
if ($isdock = true)
	setvar $map~backdoor $sector~backdoor
	savevar $map~backdoor
end

:endgetbackdoor
send "q"
if ($sector~avoidcount > 0)
	gosub :sector~setavoids
else
	send "cv0*yyq"
	waiton "Avoided sectors Cleared."
end
#setdeafclients FALSE
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:sector~getsectordata
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $sector~endline "_ENDLINE_"
setvar $sector~startline "_STARTLINE_"
killalltriggers

if ($sector~passive = false)
	if ($player~startinglocation = "Citadel")
		send "s"
	else
		send "*"
	end
end

setvar $sector~sectordata ""

:sectorsline_cit_kill
setvar $sector~line currentansiline
setvar $sector~line $sector~startline&$sector~line&$sector~endline
setvar $sector~sectordata $sector~sectordata&$sector~line
getwordpos $sector~line $sector~pos "Sector  [33m: "
if ($sector~pos > 0)
	gettext $sector~line $sector~tempsector "Sector  [33m: [36m" " [0;32min"
	setvar $player~current_sector $sector~tempsector
end
getwordpos $sector~line $sector~pos "Warps to Sector(s) "
getword currentline $sector~check 1
if (($sector~pos > 0) and ($sector~check = "Warps"))
	goto :gotsectordata
else
	settextlinetrigger getline :sectorsline_cit_kill
end
pause

:gotsectordata
killtrigger getline
settexttrigger nomines :nomines "Citadel command (?=help)"
settexttrigger nomines2 :nomines "Command ["
settexttrigger mines :mines "Mined Sector: Do you wish to Avoid this sector in the future? (Y/N)"
pause

:mines
send "* "

:nomines
killtrigger nomines
killtrigger nomines2
killtrigger mines

getwordpos $sector~sectordata $sector~beaconpos "[0m[35mBeacon  [1;33m:"
if ($sector~beaconpos > 0)
	setvar $sector~containsbeacon true
else
	setvar $sector~containsbeacon false
end
setvar $player~current_sector currentsector
gosub :gettraders
gosub :getemptyships
gosub :getfaketraders
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:sector~getautosectordata
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $sector~endline "_ENDLINE_"
setvar $sector~startline "_STARTLINE_"
setarray $sector~adjacent 7
setarray $sector~adjacent_sector 7
setvar $sector~adjcount 1
killalltriggers

:startover
setvar $sector~sectordata ""
setvar $sector~first true

:auto_sectorsline_cit_kill
setvar $sector~line currentansiline
setvar $sector~line $sector~startline&$sector~line&$sector~endline
setvar $sector~sectordata $sector~sectordata&$sector~line
getwordpos $sector~line $sector~pos "Sector  [33m: "
if ($sector~pos > 0)
	if ($sector~first)
		setvar $sector~first false
		gettext $sector~line $sector~tempsector "Sector  [33m: [36m" " [0;32min"
	else
		setvar $sector~adjacent[$sector~adjcount] $sector~sectordata&$sector~startline&"[0m[1;32mWarps to Sector(s) "&$sector~endline
		setvar $sector~adjacent_sector[$sector~adjcount] $sector~tempsector
		add $sector~adjcount 1
		gettext $sector~line $sector~tempsector "Sector  [33m: [36m" " [0;32min"
		setvar $sector~sectordata $sector~line
	end
end
getwordpos $sector~line $sector~pos "Warps to Sector(s) "
getword currentline $sector~check 1
if (($sector~pos > 0) and ($sector~check = "Warps"))
	setvar $sector~adjacent[$sector~adjcount] $sector~sectordata
	setvar $sector~adjacent_sector[$sector~adjcount] $sector~tempsector
	goto :gotautosectordata
else
	settextlinetrigger getline :auto_sectorsline_cit_kill
end
pause

:gotautosectordata
settexttrigger nomines :nominesauto "Citadel command (?=help)"
settexttrigger nomines2 :nominesauto "Command ["
settexttrigger mines :minesauto "Mined Sector: Do you wish to Avoid this sector in the future? (Y/N)"
pause

:minesauto
send "* "

:nominesauto
killtrigger nomines
killtrigger nomines2
killtrigger mines
setvar $sector~sindex $sector~adjcount
while ($sector~sindex > 0)
	setvar $sector~holotargetfound false
	setvar $sector~sectortargetfound false
	setvar $sector~sectordata $sector~adjacent[$sector~sindex]
	setvar $sector~targetsector $sector~adjacent_sector[$sector~sindex]
	if (($sector~sectordata <> "") and ($sector~sectordata <> 0))
		getwordpos $sector~sectordata $sector~beaconpos "[0m[35mBeacon  [1;33m:"
		if ($sector~beaconpos > 0)
			setvar $sector~containsbeacon true
		else
			setvar $sector~containsbeacon false
		end
		setvar $player~current_sector $sector~targetsector
		if ($sector~sindex = $sector~adjcount)
			setvar $sector~starting_sector $sector~targetsector
		end
		gosub :gettraders
		gosub :getemptyships
		gosub :getfaketraders
		setvar $sector~c 1
		setvar $player~isfound false

		while (($sector~c <= $sector~realtradercount) and ($player~isfound = false))
			if ($player~traders[$sector~c][1] = $player~corp)

			elseif ((($player~current_sector <= 10) or ($player~current_sector = $map~stardock) or ($player~current_sector = stardock)) and ($player~traders[$sector~c][2] = true))

			elseif (($player~targetingship <> false) and ($player~traders[$sector~c][3] <> true))

			else
				setvar $sector~enemy_fighters $player~traders[$sector~c][4]
				setvar $sector~enemy_name $player~traders[$sector~c]
				if ($sector~safe_attack_only <> true)
					setvar $player~isfound true
				else

					setvar $sector~too_many_fighters (($ship~ship_offensive_odds * $player~fighters) < (($sector~enemy_fighters + $sector~target_shields) * $sector~target_defense_odds))
					if (($sector~safe_attack_only = true) and ($sector~too_many_fighters <> true))
						setvar $player~isfound true
					else
						echo "*Safe mode active - Too many fighters on " $sector~enemy_name ".  Can't attack them and survive.*"
					end
				end
				setvar $sector~target_in_defender_ship false
				if ($player~traders[$sector~c][1] = 100000)
					setvar $sector~target_in_defender_ship true
				end
			end
			add $sector~c 1
		end
		if ($player~isfound)
			if (($sector~adjcount = 1) or ($sector~sindex = $sector~adjcount))
				setvar $sector~sectortargetfound true
			else
				setvar $sector~holotargetfound true
			end
			goto :done_scanning
		end
	end
	subtract $sector~sindex 1
end

:done_scanning
return

:getemptyships
getwordpos $sector~sectordata $sector~posships "[0m[33mShips   [1m:"
if ($sector~posships > 0)
	gettext $sector~sectordata $sector~shipdata "[0m[33mShips   [1m:" "[0m[1;32mWarps to Sector(s) [33m:"
	setvar $sector~shipdata $sector~startline&$sector~shipdata
	gettext $sector~shipdata $sector~temp $sector~startline $sector~endline
	setvar $sector~emptyshipcount 0
	setvar $sector~myshipcount 0
	while ($sector~temp <> "")
		getlength $sector~startline&$sector~temp&$sector~endline $sector~length
		cuttext $sector~shipdata $sector~shipdata ($sector~length + 1) 9999
		striptext $sector~temp $sector~startline
		striptext $sector~temp "  "
		striptext $sector~temp $sector~endline
		getwordpos $sector~temp $sector~pos2 "[0;35m[[31mOwned by[35m]"
		if ($sector~pos2 > 0)
			cuttext $sector~temp $sector~temp $sector~pos2 9999
			striptext $sector~temp "[0;35m[[31mOwned by[35m] "
			getwordpos $sector~temp $sector~pos3 ",[0;32m w/"
			cuttext $sector~temp $sector~temp 0 $sector~pos3
			getwordpos $sector~temp $sector~pos4 "[34m[[1;36m"
			striptext $sector~temp "[1;33m,"
			if ($sector~pos4 > 0)
				cuttext $sector~temp $sector~temp $sector~pos4 9999
				striptext $sector~temp "[34m[[1;36m"
				striptext $sector~temp "[0;34m]"
			end
			setvar $player~emptyships[($sector~emptyshipcount + 1)] $sector~temp
			if (($player~emptyships[($sector~emptyshipcount + 1)] = $player~corp) or ($player~emptyships[($sector~emptyshipcount + 1)] = $player~trader_name))
				add $sector~myshipcount 1
			end
			add $sector~emptyshipcount 1
		end
		gettext $sector~shipdata $sector~temp $sector~startline $sector~endline
	end
else
	setvar $sector~emptyshipcount 0
	setvar $sector~myshipcount 0
end
return

:getfaketraders
setvar $sector~federalsinsector false
setvar $sector~federalcount 0
getwordpos $sector~sectordata $sector~posships "[0m[33mShips   [1m:"
getwordpos $sector~sectordata $sector~postraders "[0m[33mTraders [1m:"
getwordpos $sector~sectordata $sector~posfederals "[0m[33mFederals[1m:"
if ($sector~posfederals > 0)
	setvar $sector~federalsinsector true
end
if ($sector~postraders > 0)
	gettext $sector~sectordata $sector~fakedata "[1;32mSector  [33m:" "[0m[33mTraders [1m:"
	gosub :grabfakedata
elseif ($sector~posships > 0)
	gettext $sector~sectordata $sector~fakedata "[1;32mSector  [33m:" "[0m[33mShips   [1m:"
	gosub :grabfakedata
else
	gettext $sector~sectordata $sector~fakedata "[1;32mSector  [33m:" "[0m[1;32mWarps to Sector(s) [33m:"
	gosub :grabfakedata
end
return

:grabfakedata
setvar $sector~fakedata $sector~startline&$sector~fakedata
gettext $sector~fakedata $sector~temp $sector~startline $sector~endline
setvar $sector~faketradercount 0
while ($sector~temp <> "")
	getlength $sector~startline&$sector~temp&$sector~endline $sector~length
	cuttext $sector~fakedata $sector~fakedata ($sector~length + 1) 9999
	striptext $sector~temp $sector~startline
	striptext $sector~temp "  "
	striptext $sector~temp $sector~endline
	getwordpos $sector~temp $sector~pos "33m,[0;32m w/ "
	if ($sector~pos <= 0)
		getwordpos $sector~temp $sector~pos "[0;32mw/ "
	end
	getwordpos $sector~temp $sector~pos2 "[33m, [0;32mwith"
	getwordpos $sector~temp $sector~pos3 "[0;35m[[31mOwned by[35m]"
	getwordpos $sector~temp $sector~pos4 "[0;32mw/ "&#27&"[1;33m"
	getwordpos $sector~temp $sector~pos5 "in[36m "
	if ((($sector~pos4 > 0) or ($sector~pos > 0) or ($sector~pos2 > 0)) and ($sector~pos3 <= 0))
		setvar $player~faketraders[($sector~faketradercount + 1)] $sector~temp
		getwordpos $sector~temp $sector~posa "Zyrain"
		getwordpos $sector~temp $sector~posb "Clausewitz"
		getwordpos $sector~temp $sector~posc "Nelson"
		getwordpos $sector~temp $sector~posd "Wilson"
		if (($sector~posa > 0) or ($sector~posb > 0) or ($sector~posc > 0) or ($sector~posd > 0))
			add $sector~federalcount 1
		end
		add $sector~faketradercount 1
	end

	if ($sector~pos5 > 0)
		gettext $sector~temp $sector~shipname "[1;31m" ")"

		if ($sector~shipname = "")
			gettext $sector~temp $sector~shipname "(" ")"&#13
			gettext $sector~shipname&"ENDOFSHIP" $sector~shipname "m"&#27&"[" "ENDOFSHIP"
		end
		gettext $sector~shipname&"ENDOFSHIP" $sector~shipname "m" "ENDOFSHIP"
	end

	gettext $sector~fakedata $sector~temp $sector~startline $sector~endline
end
return

:gettraders
getwordpos $sector~sectordata $sector~postrader "[0m[33mTraders [1m:"
if ($sector~postrader > 0)
	gettext $sector~sectordata $sector~traderdata "[0m[33mTraders [1m:" "[0m[1;32mWarps to Sector(s) "
	setvar $sector~traderdata $sector~startline&$sector~traderdata
	gettext $sector~traderdata $sector~temp $sector~startline $sector~endline
	setvar $sector~realtradercount 0
	setvar $sector~corpiecount 0
	setvar $sector~defenderships 0
	while ($sector~temp <> "")
		getlength $sector~startline&$sector~temp&$sector~endline $sector~length
		cuttext $sector~traderdata $sector~traderdata ($sector~length + 1) 9999
		striptext $sector~temp $sector~startline
		striptext $sector~temp $sector~endline
		striptext $sector~temp "[0m          "
		striptext $sector~temp "[0m[33mTraders [1m:"
		setvar $sector~j 1
		setvar $sector~isfound false

		if (($player~current_sector <= 10) or ($player~current_sector = $map~stardock) or ($player~current_sector = stardock))
			while (($sector~j < $player~rankslength) and ($sector~isfound = false))
				getwordpos $sector~temp $sector~pos $player~ranks[$sector~j]
				if ($sector~pos > 0)
					getlength $player~ranks[$sector~j] $sector~length
					cuttext $sector~temp $sector~temp ($sector~pos + ($sector~length + 1)) 9999
					if ($sector~j <= 10)
						setvar $player~traders[($sector~realtradercount + 1)][2] true
					else
						setvar $player~traders[($sector~realtradercount + 1)][2] false
					end
					setvar $sector~isfound true
				end
				add $sector~j 1
			end
		else
			setvar $player~traders[($sector~realtradercount + 1)][2] false
		end
		getwordpos $sector~temp $sector~pos "[0;32m w/"
		getwordpos $sector~temp $sector~pos2 "[0;35m[[31mOwned by[35m]"
		getwordpos $sector~temp $sector~pos3 #27&"[0m      "&#27&"[32m     in "&#27

		if (($sector~pos > 0) and ($sector~pos2 <= 0))
			getwordpos $sector~temp $sector~pos "[[1;36m"
			if ($sector~pos > 0)
				gettext $sector~temp $sector~tempcorp "[[1;36m" "[0;34m]"
				striptext $sector~tempcorp ""
			else
				setvar $sector~tempcorp 99999
			end
			gettext $sector~temp $sector~number_of_fighters " w/ [1;33m" "[0;32m ftrs"
			striptext $sector~number_of_fighters ","
			replacetext $sector~temp "[0;34m" "[34m"
			getwordpos $sector~temp $sector~pos "[34m"
			cuttext $sector~temp $sector~temp 1 $sector~pos
			striptext $sector~temp ""
			lowercase $sector~temp
			striptext $sector~temp "[36m"
			striptext $sector~temp "[31m"
			striptext $sector~temp "36m"
			striptext $sector~temp "31m"
			setvar $player~traders[($sector~realtradercount + 1)] $sector~temp
			setvar $player~traders[($sector~realtradercount + 1)][1] $sector~tempcorp
			setvar $player~traders[($sector~realtradercount + 1)][4] $sector~number_of_fighters
			if ($sector~tempcorp = $player~corp)
				add $sector~corpiecount 1
			end
			add $sector~realtradercount 1
		end

		if (($sector~pos3 > 0) and (($sector~tempcorp <> $player~corp) and ($player~override <> true)))
			gettext $sector~temp $sector~shipname "(" ")"

			if ($sector~shipname = "")
				gettext $sector~shipname $sector~shipname "(" ")"
			end

			gettext $sector~shipname&"ENDOFSHIP" $sector~shipname "m" "ENDOFSHIP"
			setvar $sector~isfound false
			setvar $sector~s 1
			setvar $sector~isdefender false
			replacetext $sector~shipname ";" "m"
			striptext $sector~shipname "30m"
			striptext $sector~shipname "31m"
			striptext $sector~shipname "32m"
			striptext $sector~shipname "33m"
			striptext $sector~shipname "34m"
			striptext $sector~shipname "35m"
			striptext $sector~shipname "36m"
			striptext $sector~shipname "37m"
			striptext $sector~shipname "38m"
			striptext $sector~shipname "39m"
			striptext $sector~shipname "40m"
			striptext $sector~shipname "41m"
			striptext $sector~shipname "42m"
			striptext $sector~shipname "43m"
			striptext $sector~shipname "44m"
			striptext $sector~shipname "45m"
			striptext $sector~shipname "46m"
			striptext $sector~shipname "47m"
			striptext $sector~shipname "[0;30;47m"
			striptext $sector~shipname "[32;40m"
			striptext $sector~shipname "[0;"
			striptext $sector~shipname "[1;"
			striptext $sector~shipname "[0m"
			striptext $sector~shipname "[1m"
			striptext $sector~shipname #13
			striptext $sector~shipname #27
			striptext $sector~shipname ""
			striptext $sector~shipname "["

			if ($ship~shipcounter <= 0)
				gosub :ship~loadshipinfo
			end
			while (($sector~isfound = false) and ($sector~s < $ship~shipcounter))
				striptext $ship~shiplist[$sector~s] "["
				getwordpos $sector~shipname $sector~pos $ship~shiplist[$sector~s]

				if ($sector~pos > 0)

					setvar $sector~isfound true
					setvar $sector~isdefender $ship~shiplist[$sector~s][8]
					setvar $sector~target_defense_odds $ship~shiplist[$sector~s][2]
					setvar $sector~target_shields $ship~shiplist[$sector~s][1]
				end
				add $sector~s 1
			end
			setvar $player~traders[$sector~realtradercount][3] $sector~shipname
			if ($sector~isdefender = true)
				setvar $player~traders[$sector~realtradercount][1] 100000

				add $sector~defenderships 1
			end
			getwordpos $sector~shipname $sector~istargetedship $player~targetingship
			if ($sector~istargetedship > 0)
				setvar $player~traders[$sector~realtradercount][3] true

				add $sector~targetedships 1
			end
		end
		gettext $sector~traderdata $sector~temp $sector~startline $sector~endline
	end
else
	setvar $sector~realtradercount 0
	setvar $sector~corpiecount 0
	setvar $sector~defenderships 0
end
return

include "source\include\ship"
include "source\include\player"
