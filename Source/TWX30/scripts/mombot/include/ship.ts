#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:ship~getshipcapstats
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
send "cn"
waiton "(2) Animation display"
getword currentline $ship~ansi_onoff 5
if ($ship~ansi_onoff = "On")
	send "2qq"
else
	send "qq"
end
setarray $ship~alpha 20
delete $ship~cap_file
setvar $ship~alpha[1] "A"
setvar $ship~alpha[2] "B"
setvar $ship~alpha[3] "C"
setvar $ship~alpha[4] "D"
setvar $ship~alpha[5] "E"
setvar $ship~alpha[6] "F"
setvar $ship~alpha[7] "G"
setvar $ship~alpha[8] "H"
setvar $ship~alpha[9] "I"
setvar $ship~alpha[10] "J"
setvar $ship~alpha[11] "K"
setvar $ship~alpha[12] "L"
setvar $ship~alpha[13] "M"
setvar $ship~alpha[14] "N"
setvar $ship~alpha[15] "O"
setvar $ship~alpha[16] "P"
setvar $ship~alpha[17] "R"
setvar $ship~alphaloop 0
setvar $ship~totalships 0
setvar $ship~firstshipname ""
setvar $ship~nextpage 1
send "CC@?"
waiton "Average Interval Lag"

:ship~shp_loop
settextlinetrigger grab_ship :ship~shp_shipnames "> "
pause

:ship~shp_shipnames
if (currentline = "")
	goto :ship~shp_loop
end
getword currentline $ship~stopper 1
if ($ship~stopper = "<+>")
	send "+"
	waiton "(?=List) ?"
	setvar $ship~nextpage 1
	goto :ship~shp_loop
elseif ($ship~stopper = "<Q>")
	goto :ship~shp_getshipstats
end
if ($ship~nextpage = 1)
	setvar $ship~shipname currentline
	striptext $ship~shipname "<A> "
	if ($ship~shipname = $ship~firstshipname)
		goto :ship~shp_getshipstats
	end
	setvar $ship~nextpage 0
end
add $ship~totalships 1
if ($ship~totalships = 1)
	setvar $ship~firstshipname currentline
	striptext $ship~firstshipname "<A> "
end
goto :ship~shp_loop

:ship~shp_getshipstats
setvar $ship~shipstatloop 0

:ship~shp_shipstats
while ($ship~shipstatloop < $ship~totalships)
	add $ship~shipstatloop 1
	add $ship~alphaloop 1
	if ($ship~alphaloop > 17)
		send "+"
		setvar $ship~alphaloop 1
	end
	send $ship~alpha[$ship~alphaloop]
	settextlinetrigger sn :ship~sn "Ship Class :"
	pause

	:ship~sn
	setvar $ship~line currentline
	getwordpos $ship~line $ship~pos ":"
	add $ship~pos 2
	cuttext $ship~line $ship~ship_name $ship~pos 999
	settextlinetrigger hc :ship~hc "Basic Hold Cost:"
	pause

	:ship~hc
	setvar $ship~line currentline
	striptext $ship~line "Basic Hold Cost:"
	striptext $ship~line "Initial Holds:"
	striptext $ship~line "Maximum Shields:"
	getword $ship~line $ship~init_holds 2
	getword $ship~line $ship~max_shields 3
	striptext $ship~max_shields ","
	settextlinetrigger oo :ship~oo2 "Offensive Odds:"
	pause

	:ship~oo2
	setvar $ship~line currentline
	striptext $ship~line "Main Drive Cost:"
	striptext $ship~line "Max Fighters:"
	striptext $ship~line "Offensive Odds:"
	getword $ship~line $ship~max_figs 2
	getword $ship~line $ship~off_odds 3
	striptext $ship~max_figs ","
	striptext $ship~off_odds ":1"
	striptext $ship~off_odds "."
	settextlinetrigger do :ship~do "Defensive Odds:"
	pause

	:ship~do
	setvar $ship~line currentline
	striptext $ship~line "Computer Cost:"
	striptext $ship~line "Turns Per Warp:"
	striptext $ship~line "Defensive Odds:"
	getword $ship~line $ship~def_odds 3
	striptext $ship~def_odds ":1"
	striptext $ship~def_odds "."
	getword $ship~line $ship~tpw 2
	settextlinetrigger sc :ship~sc "Ship Base Cost:"
	pause

	:ship~sc
	setvar $ship~line currentline
	striptext $ship~line "Ship Base Cost:"
	getword $ship~line $ship~cost 1
	striptext $ship~cost ","
	getlength $ship~cost $ship~costlen
	if ($ship~costlen = 7)
		add $ship~cost 10000000
	end
	settextlinetrigger mh :ship~mh "Maximum Holds:"
	pause

	:ship~mh
	setvar $ship~line currentline
	striptext $ship~line "Maximum Holds:"
	getword $ship~line $ship~max_holds 1
	setvar $ship~isdefender false
	write $ship~cap_file $ship~max_shields&" "&$ship~def_odds&" "&$ship~off_odds&" "&$ship~cost&" "&$ship~max_holds&" "&$ship~max_figs&" "&$ship~init_holds&" "&$ship~tpw&" "&$ship~isdefender&" "&$ship~ship_name
end
send "qq"
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:ship~getshipstats
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
send "c;"
settextlinetrigger getshipoffense :ship~shipoffenseodds "Offensive Odds: "
settextlinetrigger getshipfighters :ship~shipmaxfigsperattack " TransWarp Drive:   "
settextlinetrigger getshipmines :ship~shipmaxmines " Mine Max:  "
settextlinetrigger getshipgenesis :ship~shipmaxgenesis " Genesis Max:  "
settextlinetrigger getshipshields :ship~shipmaxshields "Maximum Shields:"
settextlinetrigger getshiprange :ship~shiptransportrange "Transport Range:"
pause

:ship~shipmaxshields
setvar $ship~shield_line currentline
replacetext $ship~shield_line ":" "  "
replacetext $ship~shield_line "," ""
getword $ship~shield_line $ship~ship_shield_max 10
savevar $ship~ship_shield_max
pause

:ship~shipoffenseodds
getwordpos currentansiline $ship~pos "[0;31m:[1;36m1"
if ($ship~pos > 0)
	gettext currentansiline $ship~ship_offensive_odds "Offensive Odds[1;33m:[36m " "[0;31m:[1;36m1"
	striptext $ship~ship_offensive_odds "."
	striptext $ship~ship_offensive_odds " "
	gettext currentansiline $ship~ship_fighters_max "Max Fighters[1;33m:[36m" "[0;32m Offensive Odds"
	striptext $ship~ship_fighters_max ","
	striptext $ship~ship_fighters_max " "
	savevar $ship~ship_fighters_max
	savevar $ship~ship_offensive_odds
else
	getwordpos currentline $ship~pos "Offensive Odds:"
	if ($ship~pos > 0)
		gettext currentline $ship~ship_offensive_odds "Offensive Odds:" ":1"
		striptext $ship~ship_offensive_odds "."
		striptext $ship~ship_offensive_odds " "
		gettext currentline $ship~ship_fighters_max "Max Fighters:" "Offensive Odds:"
		striptext $ship~ship_fighters_max ","
		striptext $ship~ship_fighters_max " "
		savevar $ship~ship_fighters_max
		savevar $ship~ship_offensive_odds
	end
end
pause

:ship~shipmaxmines
gettext currentline $ship~ship_mines_max "Mine Max:" "Beacon Max:"
striptext $ship~ship_mines_max " "
savevar $ship~ship_mines_max
pause

:ship~shipmaxgenesis
gettext currentline $ship~ship_genesis_max "Genesis Max:" "Long Range Scan:"
striptext $ship~ship_genesis_max " "
savevar $ship~ship_genesis_max
pause

:ship~shipmaxfigsperattack
getwordpos currentansiline $ship~pos "[0m[32m Max Figs Per Attack[1;33m:[36m"
if ($ship~pos > 0)
	gettext currentansiline $ship~ship_max_attack "[0m[32m Max Figs Per Attack[1;33m:[36m" "[0;32mTransWarp"
	striptext $ship~ship_max_attack " "
else
	getwordpos currentline $ship~pos "Max Figs Per Attack:"
	if ($ship~pos > 0)
		gettext currentline $ship~ship_max_attack "Max Figs Per Attack:" "TransWarp Drive:"
		striptext $ship~ship_max_attack " "
	end
end
savevar $ship~ship_max_attack
pause

:ship~shiptransportrange
gettext currentline $ship~ship_max_holds "Maximum Holds:" "Transport Range:"
striptext $ship~ship_max_holds " "
gettext currentline $ship~ship_xport_range "Transport Range:" "Photon Missiles:"
striptext $ship~ship_xport_range " "
savevar $ship~ship_xport_range
send "q"
settexttrigger waiton45 :ship~getshipstats_returnprompt "Command [TL="
settexttrigger waiton45citadel :ship~getshipstats_returnprompt "Citadel command (?=help)"
pause

:ship~getshipstats_returnprompt
killalltriggers
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:ship~loadshipinfo
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $ship~shipcounter 1

:ship~count_the_ships
loadvar $ship~cap_file
fileexists $ship~exists $ship~cap_file
if ($ship~exists)
	read $ship~cap_file $ship~shipinf $ship~shipcounter
	if ($ship~shipinf <> "EOF")
		add $ship~shipcounter 1
		goto :ship~count_the_ships
	end
	setarray $ship~shiplist $ship~shipcounter 9
	setvar $ship~shipcounter 1

	:ship~readshiplist
	read $ship~cap_file $ship~shipinf $ship~shipcounter
	if ($ship~shipinf <> "EOF")
		gosub :ship~process_ship_line
		setvar $ship~ship[$ship~shipname] $ship~shields&" "&$ship~defodd
		setvar $ship~shiplist[$ship~shipcounter] $ship~shipname
		setvar $ship~shiplist[$ship~shipcounter][1] $ship~shields
		setvar $ship~shiplist[$ship~shipcounter][2] $ship~defodd
		setvar $ship~shiplist[$ship~shipcounter][3] $ship~off_odds
		setvar $ship~shiplist[$ship~shipcounter][4] $ship~max_holds
		setvar $ship~shiplist[$ship~shipcounter][5] $ship~max_fighters
		setvar $ship~shiplist[$ship~shipcounter][6] $ship~init_holds
		setvar $ship~shiplist[$ship~shipcounter][7] $ship~tpw
		setvar $ship~shiplist[$ship~shipcounter][8] $ship~isdefender
		setvar $ship~shiplist[$ship~shipcounter][9] $ship~ship_cost
		add $ship~shipcounter 1
		goto :ship~readshiplist
	end
	setvar $ship~shipstats true
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:ship~process_ship_line
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
getword $ship~shipinf $ship~shields 1
getlength $ship~shields $ship~shieldlen
getword $ship~shipinf $ship~defodd 2
getlength $ship~defodd $ship~defoddlen
getword $ship~shipinf $ship~off_odds 3
getlength $ship~off_odds $ship~filler1len
getword $ship~shipinf $ship~ship_cost 4
getlength $ship~ship_cost $ship~filler2len
getword $ship~shipinf $ship~max_holds 5
getlength $ship~max_holds $ship~filler3len
getword $ship~shipinf $ship~max_fighters 6
getlength $ship~max_fighters $ship~filler4len
getword $ship~shipinf $ship~init_holds 7
getlength $ship~init_holds $ship~filler5len
getword $ship~shipinf $ship~tpw 8
getlength $ship~tpw $ship~filler6len
getword $ship~shipinf $ship~isdefender 9
getlength $ship~isdefender $ship~filler7len
setvar $ship~startlen ($ship~shieldlen + ($ship~defoddlen + ($ship~filler1len + ($ship~filler2len + ($ship~filler3len + ($ship~filler4len + ($ship~filler5len + ($ship~filler6len + ($ship~filler7len + 10)))))))))
cuttext $ship~shipinf $ship~shipname $ship~startlen 999
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:ship~savetheship
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $ship~shipcounter 1

:ship~savetheship_readshiplist
loadvar $ship~cap_file
read $ship~cap_file $ship~shipinf $ship~shipcounter
if ($ship~shipinf <> "EOF")
	gosub :ship~process_ship_line
	setvar $ship~database $ship~database&"^^^^^^"&$ship~shipname&"^^^^^^"
	add $ship~shipcounter 1
	goto :ship~savetheship_readshiplist
end
send "c"
waiton "Computer command"
send ";"

:ship~savetheship_keeplookingshipname
killalltriggers
settextlinetrigger checkingforshipname :ship~savetheship_checkshipname
pause

:ship~savetheship_checkshipname
if (currentline = "")
	goto :ship~savetheship_keeplookingshipname
else
	setvar $ship~current_line currentline
	getword $ship~current_line $ship~temp 1
	cuttext $ship~temp $ship~frontletter 1 1
	gettext $ship~current_line $ship~ship_name $ship~frontletter "          "
	setvar $ship~ship_name $ship~frontletter&$ship~ship_name
	getwordpos $ship~database $ship~pos "^^^^^^"&$ship~ship_name&"^^^^^^"
	if ($ship~pos > 0)
		setvar $switchboard~message "This ship is already stored in bot file.*"
		gosub :switchboard~switchboard
		send "q "
		return
	end
end

:ship~savetheship_sn
settextlinetrigger hc :ship~savetheship_hc "Basic Hold Cost:"
pause

:ship~savetheship_hc
setvar $ship~line currentline
striptext $ship~line "Basic Hold Cost:"
striptext $ship~line "Initial Holds:"
striptext $ship~line "Maximum Shields:"
getword $ship~line $ship~init_holds 2
getword $ship~line $ship~max_shields 3
striptext $ship~max_shields ","
settextlinetrigger oo :ship~savetheship_oo2 "Offensive Odds:"
pause

:ship~savetheship_oo2
setvar $ship~line currentline
striptext $ship~line "Main Drive Cost:"
striptext $ship~line "Max Fighters:"
striptext $ship~line "Offensive Odds:"
getword $ship~line $ship~max_figs 2
getword $ship~line $ship~off_odds 3
striptext $ship~max_figs ","
striptext $ship~off_odds ":1"
striptext $ship~off_odds "."
settextlinetrigger do :ship~savetheship_do "Defensive Odds:"
pause

:ship~savetheship_do
setvar $ship~line currentline
striptext $ship~line "Computer Cost:"
striptext $ship~line "Turns Per Warp:"
striptext $ship~line "Defensive Odds:"
getword $ship~line $ship~def_odds 3
striptext $ship~def_odds ":1"
striptext $ship~def_odds "."
getword $ship~line $ship~tpw 2
settextlinetrigger sc :ship~savetheship_sc "Ship Base Cost:"
pause

:ship~savetheship_sc
setvar $ship~line currentline
striptext $ship~line "Ship Base Cost:"
getword $ship~line $ship~cost 1
striptext $ship~cost ","
getlength $ship~cost $ship~costlen
if ($ship~costlen = 7)
	add $ship~cost 10000000
end
settextlinetrigger mh :ship~savetheship_mh "Maximum Holds:"
pause

:ship~savetheship_mh
setvar $ship~line currentline
striptext $ship~line "Maximum Holds:"
getword $ship~line $ship~max_holds 1
setvar $ship~isdefender false
write $ship~cap_file $ship~max_shields&" "&$ship~def_odds&" "&$ship~off_odds&" "&$ship~cost&" "&$ship~max_holds&" "&$ship~max_figs&" "&$ship~init_holds&" "&$ship~tpw&" "&$ship~isdefender&" "&$ship~ship_name
setvar $switchboard~message $ship~ship_name&" added to bot's ship file.*"
gosub :switchboard~switchboard
send "q"
gosub :ship~loadshipinfo
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:ship~save_the_ship
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $ship~shipcounter 1

:ship~save_the_ship_readshiplist
loadvar $ship~cap_file
read $ship~cap_file $ship~shipinf $ship~shipcounter
if ($ship~shipinf <> "EOF")
	gosub :ship~process_ship_line
	setvar $ship~database $ship~database&"^^^^^^"&$ship~shipname&"^^^^^^"
	add $ship~shipcounter 1
	goto :ship~save_the_ship_readshiplist
end
send "c"
waiton "Computer command"
send ";"

:ship~save_the_ship_keeplookingshipname
killalltriggers
settextlinetrigger checkingforshipname :ship~save_the_ship_checkshipname
pause

:ship~save_the_ship_checkshipname
if (currentline = "")
	goto :ship~save_the_ship_keeplookingshipname
else
	setvar $ship~current_line currentline
	getword $ship~current_line $ship~temp 1
	cuttext $ship~temp $ship~frontletter 1 1
	gettext $ship~current_line $ship~ship_name $ship~frontletter "          "
	setvar $ship~ship_name $ship~frontletter&$ship~ship_name
	getwordpos $ship~database $ship~pos "^^^^^^"&$ship~ship_name&"^^^^^^"
	if ($ship~pos > 0)
		setvar $switchboard~message "This ship is already stored in bot file.*"
		gosub :switchboard~switchboard
		return
	end
end

:ship~save_the_ship_sn
settextlinetrigger hc :ship~save_the_ship_hc "Basic Hold Cost:"
pause

:ship~save_the_ship_hc
setvar $ship~line currentline
striptext $ship~line "Basic Hold Cost:"
striptext $ship~line "Initial Holds:"
striptext $ship~line "Maximum Shields:"
getword $ship~line $ship~init_holds 2
getword $ship~line $ship~max_shields 3
striptext $ship~max_shields ","
settextlinetrigger oo :ship~save_the_ship_oo2 "Offensive Odds:"
pause

:ship~save_the_ship_oo2
setvar $ship~line currentline
striptext $ship~line "Main Drive Cost:"
striptext $ship~line "Max Fighters:"
striptext $ship~line "Offensive Odds:"
getword $ship~line $ship~max_figs 2
getword $ship~line $ship~off_odds 3
striptext $ship~max_figs ","
striptext $ship~off_odds ":1"
striptext $ship~off_odds "."
settextlinetrigger do :ship~save_the_ship_do "Defensive Odds:"
pause

:ship~save_the_ship_do
setvar $ship~line currentline
striptext $ship~line "Computer Cost:"
striptext $ship~line "Turns Per Warp:"
striptext $ship~line "Defensive Odds:"
getword $ship~line $ship~def_odds 3
striptext $ship~def_odds ":1"
striptext $ship~def_odds "."
getword $ship~line $ship~tpw 2
settextlinetrigger sc :ship~save_the_ship_sc "Ship Base Cost:"
pause

:ship~save_the_ship_sc
setvar $ship~line currentline
striptext $ship~line "Ship Base Cost:"
getword $ship~line $ship~cost 1
striptext $ship~cost ","
getlength $ship~cost $ship~costlen
if ($ship~costlen = 7)
	add $ship~cost 10000000
end
settextlinetrigger mh :ship~save_the_ship_mh "Maximum Holds:"
pause

:ship~save_the_ship_mh
setvar $ship~line currentline
striptext $ship~line "Maximum Holds:"
getword $ship~line $ship~max_holds 1
setvar $ship~isdefender false
write $ship~cap_file $ship~max_shields&" "&$ship~def_odds&" "&$ship~off_odds&" "&$ship~cost&" "&$ship~max_holds&" "&$ship~max_figs&" "&$ship~init_holds&" "&$ship~tpw&" "&$ship~isdefender&" "&$ship~ship_name
setvar $switchboard~message ""&$ship~ship_name&" added to bot's ship file.*"
gosub :switchboard~switchboard
send "q"
gosub :ship~loadshipinfo
return

include "source\include\switchboard"
