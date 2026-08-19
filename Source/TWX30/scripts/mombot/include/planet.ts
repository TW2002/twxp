
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planet~countplanets
#
# Creates the following array:
# $planetcount = number of planets
# $planets[1] = id of planet 1
# $planets[1][1] = level of planet 1
# $planets[1][2] = military response pct of planet 1
# $planets[1][3] = number of fighters on planet 1
# $planets[1][4] = sector cannon pct on planet 1
# $planets[1][5] = class of planet 1
# $planets[1][6] = owner of planet 1
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
killalltriggers
setvar $planet~planetcount 0

gosub :player~msgs_off
send "lq*"
waiton "Registry"
settextlinetrigger planetgrabber :planetline "   <"
settextlinetrigger bedone :countdone "Land on which planet "
pause

:planet~planetline
killalltriggers
getwordpos currentline $pos "<<<< SHIELDED"
if ($pos > 0)
	goto :countdone
end
setvar $line currentline
replacetext $line "<" " "
replacetext $line ">" " "
striptext $line ","
add $planetcount 1
getword $line $planets[$planetcount] 1
getwordpos $line $pos "Level"
if ($pos > 0)
	cuttext $line $tmp_line $pos 999
	setarray $planets[$planetcount] 6
	getword $tmp_line $planets[$planetcount][1] 2
	getword $tmp_line $tmp 3
	striptext $tmp "%"
	setvar $planets[$planetcount][2] $tmp
	getword $tmp_line $tmpqcan 5
	striptext $tmpqcan "%"
	setvar $planets[$planetcount][4] $tmpqcan
	getword $tmp_line $tmpclass 6
	setvar $planets[$planetcount][5] $tmpclass
	getword $tmp_line $tmpfig 4
	getlength $tmpfig $len
	cuttext $tmpfig $multiplier $len 999
	if ($multiplier <> "")
		cuttext $tmpfig $tmpfig2 0 ($len - 1)
		if ($multiplier = "M")
			setvar $planets[$planetcount][3] ($tmpfig2 * 1000000)
		elseif ($multiplier = "T")
			setvar $planets[$planetcount][3] ($tmpfig2 * 1000)
		end
	end
end
settextlinetrigger ownedby :ownedby "Owned by: "
settextlinetrigger planetgrabber :planetline "   <"
settextlinetrigger getend :countdone "Land on which planet "
pause

:ownedby
killalltriggers
setvar $line currentline
gettext $line $owner "Owned by: " ""
getwordpos $owner $pos "["
if ($pos > 0)
    cuttext $owner $corp $pos 999
	striptext $corp "["
	striptext $corp "]"
	setvar $planets[$planetcount][6] "Corp " & $corp
else
	setvar $planets[$planetcount][6] $owner
end
settextlinetrigger planetgrabber :planetline "   <"
settextlinetrigger getend :countdone "Land on which planet "
pause

:countdone
killalltriggers
gosub :player~msgs_on
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planet~getplanets
#
# Creates the following array:
# $planetlistcount = number of planets
# $planetlist[x] = planet id
# $planetlist[x][1] = sector
# $planetlist[x][2] = class
# $planetlist[x][3] = citadel level
# $planetlist[x][4] = shields
# $planetlist[x][5] = ore production
# $planetlist[x][6] = org production
# $planetlist[x][7] = equ production
# $planetlist[x][8] = ore on hand
# $planetlist[x][9] = org on hand
# $planetlist[x][10] = equ on hand
# $planetlist[x][11] = fighters
# $planetlist[x][12] = credits
# $planetlist[x][13] = type (pers or corp)
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
gosub :player~currentprompt
setvar $startingprompt $player~current_prompt
if ($startingprompt = "Citadel")
	send "q "
end
if ($startingprompt = "Planet") or ($startingprompt = "Citadel")
	gosub :planet~getplanetinfo
	setvar $startingplanet $planet~planet
	send "q "
end
gosub :player~currentprompt
if ($player~current_prompt <> "Command")
	setvar $switchboard~message "Error - unknown prompt! :planet~getplanets exiting.*"
	gosub :switchboard~switchboard
	return
end

setarray $planetlist 2000 13
setvar $planetlistcount 0
setvar $pers false
send "tl"

:buildplanetlist
waitfor "========="
settextlinetrigger gotplanet :gotplanet "Class"
settextlinetrigger endtl :endtl "======   ============"
settextlinetrigger endtl2 :endtl "No Planets claimed"
settextlinetrigger endtl3 :endtl "Computer command"
pause

:gotplanet
setvar $line currentline
getword $line $sector 1
getword $line $pnum 2
cuttext $pnum $pnum_first_char 1 1
if ($pnum_first_char <> "#")
	getword $line $pnum 3
end
striptext $pnum "#"
getwordpos $line $pos "Class "
cuttext $line $tmpclass $pos 999
getwordpos $tmpclass $pos2 "   "
cuttext $tmpclass $class 1 ($pos2 - 1)
getwordpos $tmpclass $pos "Level "
if ($pos > 0)
	cuttext $tmpclass $lvl $pos 999
	getword $lvl $level 2
else
	setvar $level 0
end
add $planetlistcount 1
setvar $planetlist[$planetlistcount] $pnum
setvar $planetlist[$planetlistcount][1] $sector
setvar $planetlist[$planetlistcount][2] $class
setvar $planetlist[$planetlistcount][3] $level
settextlinetrigger gotplanet2 :gotplanet2 "  "
pause
:gotplanet2
setvar $line currentline
# shields
getword $line $num 1
gosub :convertnum
setvar $planetlist[$planetlistcount][4] $num
# ore production
getword $line $num 3
gosub :convertnum
setvar $planetlist[$planetlistcount][5] $num
# org production
getword $line $num 4
gosub :convertnum
setvar $planetlist[$planetlistcount][6] $num
# equ production
getword $line $num 5
gosub :convertnum
setvar $planetlist[$planetlistcount][7] $num
# ore on hand
getword $line $num 6
gosub :convertnum
setvar $planetlist[$planetlistcount][8] $num
# org on hand
getword $line $num 7
gosub :convertnum
setvar $planetlist[$planetlistcount][9] $num
# equ on hand
getword $line $num 8
gosub :convertnum
setvar $planetlist[$planetlistcount][10] $num
# fighters
getword $line $num 9
gosub :convertnum
setvar $planetlist[$planetlistcount][11] $num
# credits
getword $line $num 10
gosub :convertnum
setvar $planetlist[$planetlistcount][12] $num
if ($pers = true)
	setvar $planetlist[$planetlistcount][13] "pers"
else
	setvar $planetlist[$planetlistcount][13] "corp"
end
settextlinetrigger gotplanet :gotplanet "Class"
pause

:endtl
killalltriggers
if ($pers = false)
	setvar $pers true
	send "qcy"
	goto :buildplanetlist
else
	setvar $pers false
end
send "q "
if ($startingprompt = "Citadel") or ($startingprompt = "Planet")
	send "l " &$startingplanet&"* "
end
if ($startingprompt = "Citadel")
	send "c "
end
return

:convertnum
if ($num = 0)
	return
end
if ($num = "---")
	setvar $num 0
	return
end
getlength $num $len
cuttext $num $multiplier $len $len
if ($multiplier = "M")
	cuttext $num $num2 1 ($len - 1)
	setvar $num ($num2 * 1000000)
elseif ($multiplier = "T")
	cuttext $num $num2 1 ($len - 1)
	setvar $num ($num2 * 1000)
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planet~planetcheck
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $planet~planetcheck_i 1
setvar $planet~planetcheck_ignorecount 0

:planet~planetcheck_loadignore
getword $planet~planetcheck_ignorelist $planet~planetcheck_ignore[$planet~planetcheck_i] $planet~planetcheck_i
if ($planet~planetcheck_ignore[$planet~planetcheck_i] <> 0)
	add $planet~planetcheck_i 1
	add $planet~planetcheck_ignorecount 1
	goto :planet~planetcheck_loadignore
end

setvar $planet~planetcheck_ignorelist ""
setvar $planet~planetcheck_found 0
send "l"

settextlinetrigger planetcheck_noplanet :planet~planetcheck_noplanet "There isn't a planet in this sector."
settextlinetrigger planetcheck_multipleplanets :planet~planetcheck_multipleplanets "Registry# and Planet Name"
settextlinetrigger planetcheck_singleplanet :planet~planetcheck_singleplanet "Landing sequence engaged..."
pause

:planet~planetcheck_noplanet
killtrigger planetcheck_multipleplanets
killtrigger planetcheck_singleplanet
return

:planet~planetcheck_multipleplanets
killtrigger planetcheck_singleplanet
killtrigger planetcheck_noplanet
setvar $planet~planetcheck_lastid 0

:planet~planetcheck_nextplanet
settexttrigger planetcheck_planetschecked :planet~planetcheck_planetschecked "Land on which planet <Q to abort>"
settextlinetrigger planetcheck_getid :planet~planetcheck_getid "<"
pause

:planet~planetcheck_getid
getword currentline $planet~planetcheck_word 1
if ($planet~planetcheck_word = "Owned")
	settextlinetrigger planetcheck_getid :planet~planetcheck_getid "<"
	pause
end

killtrigger planetcheck_planetschecked
setvar $planet~planetcheck_line currentline
striptext $planet~planetcheck_line "<"
striptext $planet~planetcheck_line ">"
getword $planet~planetcheck_line $planet~planetcheck_id 1
if ($planet~planetcheck_id = "Land")
	goto :planet~planetcheck_planetschecked
end

gosub :planet~planetcheck_sub_checkignore

if (($planet~planetcheck_id > $planet~planetcheck_lastid) and ($planet~planetcheck_ignore = 0))
	send $planet~planetcheck_id "*"
	setvar $planet~planetcheck_lastid $planet~planetcheck_id
	gosub :planet~planetcheck_sub_check

	if ($planet~planetcheck_found <> 0)
		return
	end

	send "ql"
	waitfor "Registry# and Planet Name"
end
goto :planet~planetcheck_nextplanet

:planet~planetcheck_planetschecked
killtrigger planetcheck_getid
send "q*"
return

:planet~planetcheck_singleplanet
killtrigger planetcheck_multipleplanets
killtrigger planetcheck_noplanet
gosub :planet~planetcheck_sub_check
if ($planet~planetcheck_found = 0)
	send "q"
end
return

:planet~planetcheck_sub_check
settextlinetrigger planetcheck_check_getplanet :planet~planetcheck_check_getplanet "Planet #"
pause

:planet~planetcheck_check_getplanet
getword currentline $planet~planetcheck_check_planet 2
striptext $planet~planetcheck_check_planet "#"

setvar $planet~planetcheck_id $planet~planetcheck_check_planet
gosub :planet~planetcheck_sub_checkignore

if ($planet~planetcheck_ignore = 0)
	gosub $planet~planetchecksub

	if ($planet~planetcheck_found = 1)
		setvar $planet~planetcheck_found $planet~planetcheck_check_planet
	end
end

return

:planet~planetcheck_sub_checkignore
setvar $planet~planetcheck_j 1
setvar $planet~planetcheck_ignore 0

:planet~planetcheck_checkignore_loop
if ($planet~planetcheck_j <= $planet~planetcheck_ignorecount)
	if ($planet~planetcheck_ignore[$planet~planetcheck_j] = $planet~planetcheck_id)
		setvar $planet~planetcheck_ignore 1
	else
		add $planet~planetcheck_j 1
		goto :planet~planetcheck_checkignore_loop
	end
end

return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planet~updateplanetprods
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $prods_line $planet~planetfuel & " " & $planet~planetorg & " " & $planet~planetequip & " " & $planet~planet_class & "*"
loadvar $planet~planet_prods_file
fileexists $exists $planet~planet_prods_file
if ($exists)
	if ($skip_prods_read = 0)
		readtoarray $planet~planet_prods_file $prods_file_array
		setvar $skip_prods_read 0
	end
	setvar $prods_count $prods_file_array
	setvar $foundit 0
	setvar $i 1
	while ($i <= $prods_count)
		setvar $planetinf $prods_file_array[$i]
		getwordpos $planetinf $pos "Class "
		if ($pos > 0)
			cuttext $planetinf $class $pos 999
			if ($class = $planet~planet_class)
				if ($planetinf = $prods_line)
					return
				else
					setvar $prods_file_array[$i] $prods_line
					setvar $foundit 1
				end
			end
		end
		add $i 1
	end
end
if ($exists = false) or ($foundit = 0)
	write $planet~planet_prods_file $prods_line
else
	delete $planet~planet_prods_file
	setvar $i 1
	while ($i <= $prods_count)
		write $planet~planet_prods_file $prods_file_array[$i]
		add $i 1
	end
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planet~updateplanetcolos
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if ($planet~fuelcolos = 0) and ($planet~orgcolos = 0) and ($planet~equcolos = 0)
	return
end
setvar $planet_colos_line $planet~fuelcolos & " " & $planet~orgcolos & " " & $planet~equcolos & " " & $planet~planet_class & "*"
loadvar $planet~planet_colos_file
## temporary ##
setvar $planet~planet_colos_file $bot~folder & "/planetcolos.cfg"
savevar $planet~planet_colos_file
fileexists $exists $planet~planet_colos_file
if ($exists)
	if ($skip_colos_read = 0)
		readtoarray $planet~planet_colos_file $colos_file_array
		setvar $skip_colos_read 0
	end
	setvar $colos_count $colos_file_array
	setvar $foundit 0
	setvar $changed 0
	setvar $i 1
	while ($i <= $colos_count)
		setvar $planetinf $colos_file_array[$i]
		getwordpos $planetinf $pos "Class "
		if ($pos > 0)
			cuttext $planetinf $class $pos 999
			if ($class = $planet~planet_class)
				if ($planetinf = $planet_colos_line)
					return
				else
					setvar $changed 1
					getword $planetinf $fuelcolos_tmp 1
					getword $planetinf $orgcolos_tmp 2
					getword $planetinf $equcolos_tmp 3
					if ($fuelcolos > 0)
						setvar $tmpline $fuelcolos & " "
					else
						setvar $tmpline $fuelcolos_tmp & " "
					end
					if ($orgcolos > 0)
						setvar $tmpline $tmpline & $orgcolos & " "
					else
						setvar $tmpline $tmpline & $orgcolos_tmp & " "
					end
					if ($equcolos > 0)
						setvar $tmpline $tmpline & $equcolos & " "
					else
						setvar $tmpline $tmpline & $equcolos_tmp & " "
					end
					setvar $tmpline $tmpline & $planet~planet_class & "*"
					setvar $colos_file_array[$i] $tmpline
					setvar $foundit 1
				end
			end
		end
		add $i 1
	end
end
if ($exists = false) or ($foundit = 0)
	write $planet~planet_colos_file $planet_colos_line
elseif ($changed = 1)
	delete $planet~planet_colos_file
	setvar $i 1
	while ($i <= $colos_count)
		write $planet~planet_colos_file $colos_file_array[$i]
		add $i 1
	end
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planet~getplanetinfo
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $planet~noheader 0

:planet~planetinfo
setvar $planet~planet 0
setvar $planet~current_sector 0
setvar $planet~planet_fuel 0
setvar $planet~planet_fuel_max 0
setvar $planet~planet_organics 0
setvar $planet~planet_organics_max 0
setvar $planet~planet_equipment 0
setvar $planet~planet_equipment_max 0
setvar $planet~planet_fighters 0
setvar $planet~planet_fighters_rate 0
setvar $planet~planet_fighters_prod 0
setvar $planet~planet_transport 0
setvar $planet~planet_fighters_max 0
setvar $planet~citadel 0
setvar $planet~citadel_credits 0
setvar $planet~atmosphere_cannon 0
setvar $planet~sector_cannon 0
setvar $planet~buildtime 0
setvar $planet~militaryreaction 0
setvar $planet~creator ""
setvar $planet~owner ""
setvar $planet~planet_class "undefined"
setvar $planet~planet_class_name "undefined"
setvar $planet~planet_name "undefined"
setvar $planet~under_construction false
setvar $planet~maxed_level false
setvar $planet~colo[1] 0
setvar $planet~colo[2] 0
setvar $planet~colo[3] 0
setvar $planet~rate[1] 0
setvar $planet~rate[2] 0
setvar $planet~rate[3] 0
setvar $planet~rate[4] 0
setvar $planet~prod[1] 0
setvar $planet~prod[2] 0
setvar $planet~prod[3] 0
setvar $planet~prod[4] 0
setvar $planet~amount[1] 0
setvar $planet~amount[2] 0
setvar $planet~amount[3] 0
setvar $planet~amount[4] 0
setvar $planet~max[1] 0
setvar $planet~max[2] 0
setvar $planet~max[3] 0
setvar $planet~max[4] 0

if ($planet~noheader = 0)
	send "*"
	killtrigger planetinfo2
	settextlinetrigger planetinfo2 :planetinfo2 "Planet #"
	pause
else
	setvar $planet~noheader 0
end

goto :planetinfostart

:planet~planetinfo2
setvar $planet~citadel 0
setvar $planet~sector_cannon 0
setvar $planet~atmosphere_cannon 0
setvar $planet~citadel_credits 0
getword currentline $planet~planet 2
striptext $planet~planet "#"
isnumber $planet~tst $planet~planet
if ($planet~tst <> true)
	settextlinetrigger planetinfo2 :planetinfo2 "Planet #"
	pause
end
getword currentline $player~current_sector 5
striptext $player~current_sector ":"
getwordpos currentline $planet~pos ": "
cuttext currentline $planet~planet_name ($planet~pos + 2) 999
savevar $planet~planet
savevar $player~current_sector
setsectorparameter $planet~planet "PSECTOR" $player~current_sector

:planetinfostart
setvar $planet~current_sector $player~current_sector
settextlinetrigger class :getclass "Class "
settextlinetrigger creator :creator "Created by: "
settextlinetrigger owner :owner "Claimed by: "
pause

:planet~getclass
setvar $planet_class currentline
getword $planet_class $planet~code 2
striptext $planet~code ","
getlength $planet~code $len
cuttext $planet_class $planet~planet_class_name ($len + 9) 999
setvar $planet~class_name $planet~planet_class_name
pause

:planet~creator
getword currentline $test 3
if ($test = 0)
	setvar $planet~creator ""
else
	cuttext currentline $planet~creator 13 999
end
pause

:planet~owner
getword currentline $planet~owner 3
if ($planet~owner = 0)
	setvar $planet~owner ""
else
	cuttext currentline $planet~owner 13 999
end

waitfor "2 Build 1   Product    Amount     Amount     Maximum"
gosub :killplanettriggers

:planet~getplanetstuff
settextlinetrigger fuelstart :fuelstart "Fuel Ore"
settextlinetrigger orgstart :orgstart "Organics"
settextlinetrigger equipstart :equipstart "Equipment"
settextlinetrigger figstart :figstart "Fighters        N/A"
settextlinetrigger tport :planettport "-=-=-=-=-=- TransPort power ="
settextlinetrigger shields :planetshields "Planetary Defense Shielding Power Level ="
settextlinetrigger citadelstart :citadelstart "Planet has a level"
settextlinetrigger cannon :cannonstart ", AtmosLvl="
settexttrigger maxedig :maxedig "Planetary Interdictor Generator ="
settexttrigger underconst :underconst "under construction,"
settexttrigger planetinfodone :planetinfodone "Planet command (?=help)"
pause

:planet~underconst
setvar $planet~under_construction true
getwordpos currentline $pos " under construction, "
cuttext currentline $line $pos 999
getword $line $planet~buildtime 3
pause

:planet~maxedig
setvar $planet~maxed_level true
pause

:planet~planettport
gettext currentline $planet~planet_tpad "power =" "hops -"
striptext $planet~planet_tpad ","
striptext $planet~planet_tpad " "
isnumber $planet~tst $planet~planet_tpad
if ($planet~tst = 0)
	setvar $planet~planet_tpad 0
end
setvar $planet~planet_transport $planet~planet_tpad
pause

:planet~planetshields
getword currentline $planet~planet_shields 8
striptext $planet~planet_shields ","
isnumber $planet~tst $planet~planet_shields
if ($planet~tst = 0)
	setvar $planet~planet_shields 0
end
pause

:planet~fuelstart
getword currentline $planet~planet_fuel_colonists 3
getword currentline $planet~planet_fuel_rate 4
getword currentline $planet~planet_fuel_prod 5
getword currentline $planet~planet_fuel 6
getword currentline $player~ore_holds 7
getword currentline $planet~planet_fuel_max 8
getword currentline $planet~planetfuel 6
getword currentline $planet~planetfuelmax 8
striptext $planet~planetfuel ","
striptext $planet~planetfuelmax ","
striptext $planet~planet_fuel ","
striptext $planet~planet_fuel_max ","
striptext $planet~planet_fuel_colonists ","
striptext $planet~planet_fuel_prod ","
striptext $planet~planet_fuel_rate ","
pause

:planet~orgstart
getword currentline $planet~planet_organics_colonists 2
getword currentline $planet~planet_organics_rate 3
getword currentline $planet~planet_organics_prod 4
getword currentline $planet~planet_organics 5
getword currentline $player~organic_holds 6
getword currentline $planet~planet_organics_max 7
getword currentline $planet~planetorg 5
getword currentline $planet~planetorgmax 7
striptext $planet~planetorg ","
striptext $planet~planetorgmax ","
striptext $planet~planet_organics ","
striptext $planet~planet_organics_max ","
striptext $planet~planet_organics_colonists ","
striptext $planet~planet_organics_prod ","
striptext $planet~planet_organics_rate ","
pause

:planet~equipstart
getword currentline $planet~planet_equipment_colonists 2
getword currentline $planet~planet_equipment_rate 3
getword currentline $planet~planet_equipment_prod 4
getword currentline $planet~planet_equipment 5
getword currentline $player~equipment_holds 6
getword currentline $planet~planet_equipment_max 7
getword currentline $planet~planetequip 5
getword currentline $planet~planetequipmax 7
striptext $planet~planetequip ","
striptext $planet~planetequipmax ","
striptext $planet~planet_equipment ","
striptext $planet~planet_equipment_max ","
striptext $planet~planet_equipment_colonists ","
striptext $planet~planet_equipment_prod ","
striptext $planet~planet_equipment_rate ","
pause

:planet~figstart
getword currentline $planet~planet_fighters_rate 3
getword currentline $planet~planet_fighters_prod 4
getword currentline $planet~planet_fighters 5
getword currentline $planet~planet_fighters_max 7
striptext $planet~planet_fighters_rate ","
striptext $planet~planet_fighters_prod ","
striptext $planet~planet_fighters ","
striptext $planet~planet_fighters_max ","
pause

:planet~citadelstart
getword currentline $planet~citadel 5
getword currentline $planet~citadel_credits 9
striptext $planet~citadel_credits ","
pause

:planet~cannonstart
getword currentline $planet~militaryreaction 2
getword currentline $planet~atmosphere_cannon 5
getword currentline $planet~sector_cannon 6
striptext $planet~militaryreaction "reaction="
striptext $planet~militaryreaction "%"
striptext $planet~sector_cannon "SectLvl="
striptext $planet~sector_cannon "%"
striptext $planet~atmosphere_cannon "AtmosLvl="
striptext $planet~atmosphere_cannon "%"
striptext $planet~atmosphere_cannon ","
pause

:planet~planetinfodone
gosub :killplanettriggers
setvar $planet~colo[1] $planet~planet_fuel_colonists
setvar $planet~colo[2] $planet~planet_organics_colonists
setvar $planet~colo[3] $planet~planet_equipment_colonists
setvar $planet~rate[1] $planet~planet_fuel_rate
setvar $planet~rate[2] $planet~planet_organics_rate
setvar $planet~rate[3] $planet~planet_equipment_rate
setvar $planet~rate[4] $planet~planet_fighters_rate
setvar $planet~prod[1] $planet~planet_fuel_prod
setvar $planet~prod[2] $planet~planet_organics_prod
setvar $planet~prod[3] $planet~planet_equipment_prod
setvar $planet~prod[4] $planet~planet_fighters_prod
setvar $planet~amount[1] $planet~planet_fuel
setvar $planet~amount[2] $planet~planet_organics
setvar $planet~amount[3] $planet~planet_equipment
setvar $planet~amount[4] $planet~planet_fighters
setvar $planet~max[1] $planet~planet_fuel_max
setvar $planet~max[2] $planet~planet_organics_max
setvar $planet~max[3] $planet~planet_equipment_max
setvar $planet~max[4] $planet~planet_fighters_max
setvar $planet~noheader 0
setvar $planet~currentbotplanet $planet~planet
savevar $planet~currentbotplanet
savevar $planet~planet_fighters
savevar $player~current_sector
savevar $planet~planet
savevar $planet~planet_fuel
savevar $planet~planet_fuel_max
savevar $planet~planet_organics
savevar $planet~planet_organics_max
savevar $planet~planet_equipment
savevar $planet~planet_equipment_max
savevar $planet~planet_fighters
savevar $planet~planet_shields
savevar $planet~planet_transport
savevar $planet~planet_fighters_max
savevar $planet~citadel
savevar $planet~citadel_credits
savevar $planet~atmosphere_cannon
savevar $planet~sector_cannon
savevar $planet~planet_class_name
savevar $planet~planet_name
savevar $planet~under_construction
savevar $planet~maxed_level
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planet~killplanettriggers
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
killtrigger fuelstart
killtrigger orgstart
killtrigger equipstart
killtrigger figstart
killtrigger tport
killtrigger shields
killtrigger citadelstart
killtrigger cannon
killtrigger citexists
killtrigger maxedig
killtrigger underconst
killtrigger planetinfodone
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planet~getplanetnumber
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
send "*"
settextlinetrigger planetinfo3 :getjustthenumber "Planet #"
pause

:planet~getjustthenumber
send "  "
getword currentline $planet~planet 2
striptext $planet~planet "#"
getword currentline $player~current_sector 5
striptext $player~current_sector ":"
savevar $planet~planet
savevar $player~current_sector
setsectorparameter $planet~planet "PSECTOR" $player~current_sector
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planet~getplanetstats
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
send "cn"
waiton "(2) Animation display"
getword currentline $planet~ansi_onoff 5
if ($planet~ansi_onoff = "On")
	send "2qq"
else
	send "qq"
end
setarray $planet~alpha 20
delete $planet~planet_file
setvar $planet~alpha[1] "A"
setvar $planet~alpha[2] "B"
setvar $planet~alpha[3] "C"
setvar $planet~alpha[4] "D"
setvar $planet~alpha[5] "E"
setvar $planet~alpha[6] "F"
setvar $planet~alpha[7] "G"
setvar $planet~alpha[8] "H"
setvar $planet~alpha[9] "I"
setvar $planet~alpha[10] "J"
setvar $planet~alpha[11] "K"
setvar $planet~alpha[12] "L"
setvar $planet~alpha[13] "M"
setvar $planet~alpha[14] "N"
setvar $planet~alpha[15] "O"
setvar $planet~alpha[16] "P"
setvar $planet~alpha[17] "R"
setvar $planet~alphaloop 0
setvar $planet~totalplanets 0
setvar $planet~firstplanetname ""

setvar $planet~nextpage 1
send "CJ@?"
waiton "Average Interval Lag"
waiton "Which planet type are you interested in (?=List)"

:planet~shp_loop
settextlinetrigger grab_planet :planet~shp_planetnames "> "
pause

:planet~shp_planetnames
if (currentline = "")
	goto :planet~shp_loop
end
getword currentline $planet~stopper 1
if ($planet~stopper = "<+>")
	send "+"
	waiton "(?=List) ?"
	setvar $planet~nextpage 1
	goto :planet~shp_loop
elseif ($planet~stopper = "<Q>")
	goto :planet~shp_getplanetstats
end
if ($planet~nextpage = 1)
	setvar $planet~planetname currentline
	striptext $planet~planetname "<A> "
	if ($planet~planetname = $planet~firstplanetname)
		goto :planet~shp_getplanetstats
	end
	setvar $planet~nextpage 0
end
add $planet~totalplanets 1
if ($planet~totalplanets = 1)
	setvar $planet~firstplanetname currentline
	striptext $planet~firstplanetname "<A> "
end
goto :planet~shp_loop

:planet~shp_getplanetstats
setvar $planet~planetstatloop 0

:planet~shp_planetstats
delete $planet~planet_file
while ($planet~planetstatloop < $planet~totalplanets)
	add $planet~planetstatloop 1
	add $planet~alphaloop 1
	if ($planet~alphaloop > 17)
		send "+"
		setvar $planet~alphaloop 1
	end
	send $planet~alpha[$planet~alphaloop]
	settextlinetrigger sn :planet~sn "Planet Category #"
	pause

	:planet~sn
	setvar $planet~line currentline
	getwordpos $planet~line $planet~pos "Class"
	cuttext $planet~line $planet~planet_name $planet~pos 999

	setvar $planet~planet_fuel_colonists_max 0
	setvar $planet~planet_fuel_colonists_rate 0
	setvar $planet~planet_org_colonists_max 0
	setvar $planet~planet_org_colonists_rate 0
	setvar $planet~planet_equip_colonists_max 0
	setvar $planet~planet_equip_colonists_rate 0
	gosub :planet~readplanettypestats
	write $planet~planet_file $planet~planet_fuel_colonists_max&" "&$planet~planet_fuel_colonists_rate&" "&$planet~planet_org_colonists_max&" "&$planet~planet_org_colonists_rate&" "&$planet~planet_equip_colonists_max&" "&$planet~planet_equip_colonists_rate&" "&$planet~planet_name
end
send "qq"
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:readplanettypestats
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:readplanettypestats_wait
settextlinetrigger planetstat_cols :readplanettypestats_cols "Cols -"
settextlinetrigger planetstats_ore :readstatsprod "Fuel Ore"
settextlinetrigger planetstats_org :readstatsprod "Organics"
settextlinetrigger planetstats_equ :readstatsprod "Equipment"
settexttrigger planetstat_done :readplanettypestats_done "Which planet type are you interested in (?=List)"
pause

:readplanettypestats_cols
killalltriggers
setvar $stat_line currentline
setvar $parsed_cols 0
gettext $stat_line $parsed_cols "Cols -" "/"
striptext $parsed_cols " "
striptext $parsed_cols ","
isnumber $isnumber $parsed_cols
if ($isnumber <> true)
	setvar $parsed_cols 0
end

if ($parsed_cols > 0)
	getwordpos $stat_line $pos "Ore"
	if ($pos > 0)
		setvar $planet_fuel_colonists_max $parsed_cols
	end
	getwordpos $stat_line $pos "Org"
	if ($pos > 0)
		setvar $planet_org_colonists_max $parsed_cols
	end
	getwordpos $stat_line $pos "Eq"
	if ($pos > 0)
		setvar $planet_equip_colonists_max $parsed_cols
	end
end
goto :readplanettypestats_wait

:readstatsprod
killalltriggers
setvar $stat_line currentline
getwordpos $stat_line $pos ":1"
cuttext $stat_line $parsed_num ($pos - 4) 4
striptext $parsed_num " "
striptext $parsed_num "│"
#echo "**Parsed num: " & $parsed_num & "**"
isnumber $isnumber $parsed_num
if ($isnumber <> true)
	setvar $parsed_num 0
end
getwordpos $stat_line $pos "Fuel Ore"
if ($pos > 0)
	setvar $planet_fuel_colonists_rate $parsed_num
end
getwordpos $stat_line $pos "Organics"
if ($pos > 0)
	setvar $planet_org_colonists_rate $parsed_num
end
getwordpos $stat_line $pos "Equipment"
if ($pos > 0)
	setvar $planet_equip_colonists_rate $parsed_num
end
goto :readplanettypestats_wait

:readplanettypestats_done
killalltriggers
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planet~landingsub
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
gosub :killlandingtriggers
send "lz" #8 $planet~planet "*"
setvar $planet~successfulcitadel false
setvar $planet~successfulplanet false
# old typo, leaving in place for old scripts
setvar $planet~sucessfulcitadel false
setvar $planet~sucessfulplanet false
settextlinetrigger noplanet :noplanet "There isn't a planet in this sector."
settextlinetrigger no_land :no_land "since it couldn't possibly stand"
settextlinetrigger planet :planet "Planet #"
settextlinetrigger wrongone :wrong_num "That planet is not in this sector."
settextlinetrigger noplanetscanner :displayplanet "<Destroy Planet>"
pause

:planet~noplanet
gosub :killlandingtriggers
setvar $switchboard~message "No Planet in Sector!*"
gosub :switchboard~switchboard
return

:planet~no_land
gosub :killlandingtriggers
setvar $switchboard~message "This ship cannot land!*"
gosub :switchboard~switchboard
return

:planet~displayplanet
send "*"
waiton "Planet #"

:planet~planet
getword currentline $planet~pnum_ck 2
striptext $planet~pnum_ck "#"
gosub :killlandingtriggers
if ($planet~pnum_ck <> $planet~planet)
	send "q"
	goto :wrong_num
end
settexttrigger wrong_num :wrong_num "That planet is not in this sector."
settexttrigger planet :planet_prompt "Planet command"
pause

:planet~wrong_num
killtrigger planet
send "**"
setvar $switchboard~message "Incorrect Planet Number*"
gosub :switchboard~switchboard
return

:planet~planet_prompt
killtrigger wrong_num
setvar $planet~currentbotplanet $planet~planet
savevar $planet~currentbotplanet
savevar $planet~planet
setvar $planet~successfulplanet true
setvar $planet~sucessfulplanet true

if ($planet~land_and_lift = true)
	send "m* * * q  "
	return
end

if ($notakefigs <> true)
	send "m* * * "
else
	setvar $notakefigs false
end

if ($planet~nocit = "") or ($planet~nocit = true)
	setvar $planet~nocit false
	return
end

send "c"

settexttrigger build_cit :build_cit "Do you wish to construct one?"
settexttrigger in_cit :in_cit "Citadel command"
settexttrigger nocitallowed :build_cit "Citadels are not allowed in FedSpace."
settexttrigger citnotbuiltyet :build_cit "Be patient, your Citadel is not yet finished."
pause

:planet~build_cit
gosub :killlandingtriggers
setvar $planet~startinglocation "Planet"
send "n"
return

:planet~in_cit
gosub :killlandingtriggers
setvar $planet~successfulcitadel true
setvar $planet~sucessfulcitadel true
setvar $planet~startinglocation "Citadel"
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planet~pwarp
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $planet~do_scan false
setvar $planet~pwarpsuccess false
setvar $planet~msg ""
if ($planet~pwarp_scan = true)
	setvar $planet~do_scan true
end
setvar $planet~pwarp_scan false
send "q *"
waiton "Planet #"
getword currentline $planet~planet 2
striptext $planet~planet "#"
savevar $planet~planet

send "c p" $planet~warpto "*"

settextlinetrigger pwarp_lock       :pwarp_lock     "Locating beam pinpointed"
settextlinetrigger no_pwarp_lock    :no_pwarp_lock  "Your own fighters must be"
settextlinetrigger already      :already    "You are already in that sector!"
settextlinetrigger no_ore       :no_ore     "You do not have enough Fuel Ore"
settextlinetrigger no_pwarp     :nopwarp    "This Citadel does not have a Planetary TransWarp"
settextlinetrigger wrong_number     :wrong_number   "Invalid Sector number,"
pause

:wrong_number
killalltriggers
setvar $planet~msg "Not a valid sector to pwarp to!"
setvar $switchboard~message "Not a valid sector to pwarp to!*"
gosub :switchboard~switchboard
return

:nopwarp
killalltriggers
setvar $planet~msg "Planet Does Not Have A Planetary TransWarp Drive!"
setvar $switchboard~message "Planet Does Not Have A Planetary TransWarp Drive!*"
gosub :switchboard~switchboard
return

:no_pwarp_lock
killalltriggers
setvar $planet~target $planet~warpto
setvar $player~target $planet~target
setvar $planet~msg "No fighter down at that location!"
gosub :player~removefigfromdata
setvar $switchboard~message "No fighter down at that location!*"
gosub :switchboard~switchboard
return

:no_ore
killalltriggers
setvar $planet~msg "Not enough fuel for that pwarp."
setvar $switchboard~message "Not enough fuel for that pwarp.*"
gosub :switchboard~switchboard
return

:pwarp_lock
killalltriggers
send "y"
waiton "Planet is now in sector"
setvar $planet~pwarpsuccess true
setvar $planet~msg "Planet #"&$planet~planet&" moved to sector "&$planet~warpto&"."
setvar $switchboard~message $planet~msg&"*"
gosub :switchboard~switchboard
setvar $planet~target $planet~warpto
setvar $player~target $planet~target
loadvar $planet~planet
isnumber $test $planet~planet
if ($test)
	if (($planet~planet <> ".") and ($planet~planet > 0))
		setsectorparameter $planet~planet "PSECTOR" $planet~target
	end
end
#gosub :player~addfigtodata
if ($planet~do_scan = true)
	send "s"
	waiton "Warps to Sector(s) :"
	send "* "
end
return

:already
killalltriggers
setvar $planet~pwarpsuccess true
setvar $planet~msg "Planet already in that sector!."
setvar $switchboard~message "Planet already in that sector!.*"
gosub :switchboard~switchboard
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planet~killlandingtriggers
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
killtrigger noplanet
killtrigger no_land
killtrigger planet
killtrigger wrongone
killtrigger in_cit
killtrigger nocitallowed
killtrigger build_cit
killtrigger citnotbuiltyet
killtrigger noplanetscanner
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planet~landonplanetentercitadel
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
#send "l "&$planet~planet&"*tnl1*tnl2*tnl3*snl1*snl2*snl3*c* "
send "l "&$planet~planet&"*c* "
waiton "Fuel Ore"
getword currentline $planet~planetfuel 6
striptext $planet~planetfuel ","
getword currentline $planet~planet_fuel 6
striptext $planet~planet_fuel ","
send "/"
waiton "Creds"
getword currentline $player~credits 4
striptext $player~credits "³Figs"
striptext $player~credits ","
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planet~loadplanetinfo
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $planet~planetcounter 1
loadvar $planet~planet_file
fileexists $planet~exists $planet~planet_file

:planet~count_the_planets
if ($planet~exists)
	setvar $planet~i 1
	readtoarray $planet~planet_file $planet~planet_array
	setarray $planet~planetlist $planet~planet_array 7
	while ($planet~i <= $planet~planet_array)
		setvar $planet~planetinf $planet~planet_array[$planet~i]
		getword $planet~planetinf $planet~planet_fuel_colonists_min 1
		getlength $planet~planet_fuel_colonists_min $planet~length1
		getword $planet~planetinf $planet~planet_fuel_colonists_max 2
		getlength $planet~planet_fuel_colonists_max $planet~length2
		getword $planet~planetinf $planet~planet_org_colonists_min 3
		getlength $planet~planet_org_colonists_min $planet~length3
		getword $planet~planetinf $planet~planet_org_colonists_max 4
		getlength $planet~planet_org_colonists_max $planet~length4
		getword $planet~planetinf $planet~planet_equip_colonists_min 5
		getlength $planet~planet_equip_colonists_min $planet~length5
		getword $planet~planetinf $planet~planet_equip_colonists_max 6
		getlength $planet~planet_equip_colonists_max $planet~length6
		getword $planet~planetinf $planet~planet_is_keeper 7
		getlength $planet~planet_is_keeper $planet~length7
		setvar $planet~startlen ($planet~length1 + ($planet~length2 + ($planet~length3 + ($planet~length4 + ($planet~length5 + ($planet~length6 + ($planet~length7 + 7)))))))
		getlength $planet~planetinf $planet~length_planet_name
		if ($planet~startlen < $planet~length_planet_name)
			cuttext $planet~planetinf $planet~planetname $planet~startlen 999
		else
			echo "*"&$planet~planetinf&" error during processing planets.*"
		end
		setvar $planet~planetlist[$planet~i] $planet~planetname
		setvar $planet~planetlist[$planet~i][1] $planet~planet_fuel_colonists_min
		setvar $planet~planetlist[$planet~i][2] $planet~planet_fuel_colonists_max
		setvar $planet~planetlist[$planet~i][3] $planet~planet_org_colonists_min
		setvar $planet~planetlist[$planet~i][4] $planet~planet_org_colonists_max
		setvar $planet~planetlist[$planet~i][5] $planet~planet_equip_colonists_min
		setvar $planet~planetlist[$planet~i][6] $planet~planet_equip_colonists_max
		setvar $planet~planetlist[$planet~i][7] $planet~planet_is_keeper
		add $planet~i 1
	end
	setvar $planet~planetcounter $planet~planet_array
	setvar $planet~planetstats true
else
	echo "*No Planet File Found!*"
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planet~loadplanetprods
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $planet~planetcounter 0
setvar $planet~planetstats false
loadvar $planet~planet_prods_file
fileexists $exists $planet~planet_prods_file
if ($exists)
	readtoarray $planet~planet_prods_file $planet~planet_prods_array
	setvar $planet~planet_prods_capacity $planet~planet_prods_array
	add $planet~planet_prods_capacity 100
	if ($planet~planet_prods_capacity < 100)
		setvar $planet~planet_prods_capacity 100
	end
	setarray $planet~planetprods $planet~planet_prods_capacity 3
	setvar $i 1
	while ($i <= $planet~planet_prods_array)
		setvar $planetinf $planet~planet_prods_array[$i]
		getword $planetinf $planet_starting_ore 1
		getlength $planet_starting_ore $len1
		getword $planetinf $planet_starting_org 2
		getlength $planet_starting_org $len2
		getword $planetinf $planet_starting_equ 3
		getlength $planet_starting_equ $len3
		setvar $len ($len1 + $len2 + $len3 + 3)
		getlength $planetinf $pname_len
		if ($len < $pname_len)
			cuttext $planetinf $pname ($len + 1) 999
			trim $pname
			if ($pname <> "0") and ($pname <> "")
				add $planet~planetcounter 1
				setvar $planet~planetprods[$planet~planetcounter] $pname
				setvar $planet~planetprods[$planet~planetcounter][1] $planet_starting_ore
				setvar $planet~planetprods[$planet~planetcounter][2] $planet_starting_org
				setvar $planet~planetprods[$planet~planetcounter][3] $planet_starting_equ
			end
		else
			echo "*"&$planetinf&" error during processing planets.*"
		end
		add $i 1
	end
else
	setarray $planet~planetprods 100 3
end
setvar $i $planet~planetcounter
add $i 1
setvar $planet~planetprods[$i] "0"
setvar $planet~planetstats true
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planet~loadplanetcolos
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
loadvar $planet~planet_colos_file
if ($planet~planet_colos_file = 0)
	setvar $planet~planet_colos_file $bot~folder & "/planetcolos.cfg"
	savevar $planet~planet_colos_file
end
fileexists $exists $planet~planet_colos_file
if ($exists)
	readtoarray $planet~planet_colos_file $colos_file_array
	setvar $planet_colos_count $colos_file_array
	setvar $planet_colos_capacity $planet_colos_count
	add $planet_colos_capacity 100
	if ($planet_colos_capacity < 100)
		setvar $planet_colos_capacity 100
	end
	setarray $planet_colos $planet_colos_capacity 3
	setvar $i 1
	setvar $j 1
	while ($i <= $planet_colos_count)
		setvar $planetinf $colos_file_array[$i]
		getwordpos $planetinf $pos "Class "
		if ($pos > 0)
			cuttext $planetinf $planet_colos[$j] $pos 999
			getword $planetinf $planet_colos[$j][1] 1
			getword $planetinf $planet_colos[$j][2] 2
			getword $planetinf $planet_colos[$j][3] 3
			add $j 1
		end
		add $i 1
	end
	setvar $planet_colos_count ($j - 1)
else
	setvar $planet_colos_count 0
	setarray $planet_colos 100 3
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planet~moveproduct
:planet~movefighters
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $movesuccess false
setvar $planet~movesuccess false
setvar $movefailed false
gosub :player~currentprompt
setvar $startingprompt $player~current_prompt
if ($player~current_prompt = "Citadel")
	send "q"
elseif ($player~current_prompt <> "Planet")
	setvar $switchboard~message "You must start from the Citadel or Planet prompt!*"
	gosub :switchboard~switchboard
	return
end
if ($player~turns <= $bot~bot_turn_limit)
	return
	setvar $switchboard~message "Bot turn limit reached, cannot move product!*"
	gosub :switchboard~switchboard
	return
end

gosub :getplanetinfo
setvar $startingplanet $planet~planet
# $planet~planettofill
# $oretomove, $equtomove, $orgtomove, $fctomove, $octomove, $ectomove, $figtomove
# $category, $type

if ($planet~planettofill = 0)
	return
end

if ($planet~category = 6)
	goto :movecreds
end

if ($planet~type <> "t") and ($planet~type <> "s") and ($planet~type <> "m")
	return
end
if (($planet~moveholds = 0) and ($planet~moveamount = 0) and ($planet~moveextra = 0))
	return
end
if ($planet~category < 1) or ($planet~category > 6)
	return
end
if ($category = 4)
	loadvar $ship~ship_fighters_max
	isnumber $test $ship~ship_fighters_max
	if (($test = false) or ($ship~ship_fighters_max <= 0))
		setvar $switchboard~message "Unable to determine ship fighter capacity.*"
		gosub :switchboard~switchboard
		return
	end
	send "m n l*"
end

send "q j y l "&$startingplanet&"*"

gosub :player~quikstats
setvar $player~turns ($player~turns-1)
setvar $count 0
setvar $planet~burstsize 1000

:moveproductloop
killtrigger success
killtrigger empty
killtrigger full
killtrigger success_colos
killtrigger empty_colos

if ($player~turns <= $bot~bot_turn_limit)
	goto :move_done
end
if ($player~total_holds <= 0)
	goto :move_done
end
if (($planet~moveamount <= 0) and ($planet~moveholds <= 0) and ($planet~moveextra <= 0))
	goto :move_done
end

settexttrigger empty         :move_done "There aren't that many "
settexttrigger full          :move_failed "They don't have room for that many "
settexttrigger empty_colos   :move_failed "There isn't room on the planet"

if ($planet~moveamount > 0)
	goto :moveamountloop
end

setvar $loop 0

:moveholdsloop
setvar $i 0
while ($i < $planet~burstsize)
	add $i 1
	if ($loop >= $planet~moveholds)
		goto :moveextra
	end
	if ($category = 4)
		setvar $get $ship~ship_fighters_max
		gosub :sendmovefighters
	else
		setvar $get $player~total_holds
		gosub :sendmoveproduct
	end
	add $count $get
	add $loop 1
end
send "@"
waiton "Average Interval Lag"
goto :moveholdsloop

:moveextra
if ($planet~moveextra > 0)
	setvar $get $planet~moveextra
	if ($category = 4)
		gosub :sendmovefighters
	else
		gosub :sendmoveproduct
	end
	add $count $get
end
goto :move_done

:moveamountloop
if ($planet~moveamount <= 0)
	goto :move_done
end
setvar $j 0
while ($j < $planet~burstsize)
	add $j 1
	if ($planet~moveamount <= 0)
		goto :move_done
	end

	if ($category = 4)
		setvar $get $ship~ship_fighters_max
		if ($planet~moveamount >= $ship~ship_fighters_max)
			setvar $get $ship~ship_fighters_max
		else
			setvar $get $planet~moveamount
		end
	else
		if ($planet~moveamount >= $player~total_holds)
			setvar $get $player~total_holds
		else
			setvar $get $planet~moveamount
		end
	end
	if ($category = 4)
		gosub :sendmovefighters
	else
		gosub :sendmoveproduct
	end
	add $count $get
	setvar $planet~moveamount ($planet~moveamount - $get)
end
send "@"
waiton "Average Interval Lag"
goto :moveamountloop

:sendmoveproduct
setvar $move_dest_category $category
if ($type = "s") and ($destcategory > 0)
	setvar $move_dest_category $destcategory
end
send "l j"&#8&$startingplanet&"* j"&$type&"* jt"&$category&$get&"* x q l j"&#8&$planet~planettofill&"* j"&$type&"* jl"&$move_dest_category&"* x q "
return

:sendmovefighters
send "l j"&#8&$startingplanet&"* j"&$type&"* jt"&$get&"* x q l j"&#8&$planet~planettofill&"* j"&$type&"* jl"&$get&"* x q "
return

:move_failed
killalltriggers
setvar $movefailed true
setvar $moveerror currentline
send "q q * * j y "

:move_done
killalltriggers
setvar $planet~moveamount 0
setvar $planet~moveholds 0
setvar $planet~moveextra 0
setvar $planet~destcategory 0
if ($movefailed = true)
	setvar $planet~movesuccess false
else
	setvar $planet~movesuccess true
end
setvar $macro "l " &$startingplanet
if ($planet~category = 4)
	setvar $macro $macro & "* m n t*"
end

if ($startingprompt = "Citadel")
	send $macro&"* c"
	waiton "Citadel command"
else
	send $macro&"*"
	waiton "Planet command"
end
if ($movefailed = true)
	setvar $movesuccess false
else
	setvar $movesuccess true
end
return

:movecreds
gosub :player~quikstats
setvar $startingcredits $player~credits

send "c"
waiton "Citadel treasury contains"
getword currentline $planet~citadel_credits 4
striptext $planet~citadel_credits ","

if ($moveamount = 0) or ($moveamount = "")
	setvar $moveamount $planet~citadel_credits
end

if ($player~credits >= $planet~moveamount)
	send "q l "&$planet~planettofill&"* ctt"&$moveamount&"* q q l "&$startingplanet&"* ctf"&$moveamount&"* q q "
	setvar $planet~movesuccess true
	return
end

while ($moveamount > 0)
	setvar $credstoget ($moveamount - $player~credits)
	if ($credstoget > 999999999)
		setvar $credstoget (999999999 - $player~credits)
	end
	send "tf" & $credstoget & "* "
	add $player~credits $credstoget
	subtract $moveamount $player~credits
	send "q q l "&$planet~planettofill&"* ctt"&$player~credits&"* q q l "&$startingplanet&"* c"
	setvar $player~credits 0
end

send "tf"&$startingcredits&"*"
waiton "You have "
getword currentline $player~credits 3
striptext $player~credits ","
send "q q l "&$startingplanet&"* "
goto :move_done

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planet~stripplanet
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
gosub :player~currentprompt
setvar $startingplanet 0
setvar $restore_ship_fighters false
gosub :player~currentprompt
setvar $startingprompt $player~current_prompt
if ($startingprompt = "Citadel")
	send "q"
elseif ($startingprompt = "Command")
	if ($planet~planettofill = 0)
		setvar $switchboard~message "No destination planet selected to fill!*"
		gosub :switchboard~switchboard
		return
	end
	setvar $planet~nocit true
	setvar $planet~planet $planet~planettofill
	gosub :landingsub
elseif ($startingprompt <> "Planet")
	setvar $switchboard~message "You must start from the Citadel, Planet or Command prompt!*"
	gosub :switchboard~switchboard
	return
end
if ($planet~planettostrip <= 0)
	setvar $switchboard~message "No planet selected to strip!*"
	gosub :switchboard~switchboard
	return
end
if ($planet~planettostrip = $planet~planettofill)
	setvar $switchboard~message "Source and destination planets are the same; skipping strip.*"
	gosub :switchboard~switchboard
	return
end
gosub :planetinfo
isnumber $test $planet~planet
if ($test = false)
	setvar $switchboard~message "Could not read source planet info, halting strip.*"
	gosub :switchboard~switchboard
	halt
elseif ($planet~planet <= 0)
	setvar $switchboard~message "Could not read source planet info, halting strip.*"
	gosub :switchboard~switchboard
	halt
end
if ($startingprompt <> "Command")
	setvar $startingplanet $planet~planet
end
setvar $countfuel 0
setvar $countorganics 0
setvar $countequipment 0
setvar $countcolonists 0
setvar $oretofill ($planet~planet_fuel_max - $planet~planet_fuel)
setvar $orgtofill ($planet~planet_organics_max - $planet~planet_organics)
setvar $equtofill ($planet~planet_equipment_max - $planet~planet_equipment)
setvar $figstofill ($planet~planet_fighters_max - $planet~planet_fighters)
setvar $fuelcolstofill 999999999
setvar $orgcolstofill 999999999
setvar $equcolstofill 999999999
if ($skip_over_99)
	if ($planet~planet_fuel_max > 0) and (($planet~planet_fuel * 100) > ($planet~planet_fuel_max * 99))
		setvar $oretofill 0
	end
	if ($planet~planet_organics_max > 0) and (($planet~planet_organics * 100) > ($planet~planet_organics_max * 99))
		setvar $orgtofill 0
	end
	if ($planet~planet_equipment_max > 0) and (($planet~planet_equipment * 100) > ($planet~planet_equipment_max * 99))
		setvar $equtofill 0
	end
	if ($planet~planet_fighters_max > 0) and (($planet~planet_fighters * 100) > ($planet~planet_fighters_max * 99))
		setvar $figstofill 0
	end
	if ($planet~planet_fuel_colonists_max > 0)
		setvar $fuelcolstofill ($planet~planet_fuel_colonists_max - $planet~planet_fuel_colonists)
		if (($planet~planet_fuel_colonists * 100) > ($planet~planet_fuel_colonists_max * 99))
			setvar $fuelcolstofill 0
		end
	end
	if ($planet~planet_organics_colonists_max > 0)
		setvar $orgcolstofill ($planet~planet_organics_colonists_max - $planet~planet_organics_colonists)
		if (($planet~planet_organics_colonists * 100) > ($planet~planet_organics_colonists_max * 99))
			setvar $orgcolstofill 0
		end
	end
	if ($planet~planet_equipment_colonists_max > 0)
		setvar $equcolstofill ($planet~planet_equipment_colonists_max - $planet~planet_equipment_colonists)
		if (($planet~planet_equipment_colonists * 100) > ($planet~planet_equipment_colonists_max * 99))
			setvar $equcolstofill 0
		end
	end
end
setvar $spacebuffer $player~total_holds
if ($spacebuffer <= 0)
	setvar $spacebuffer 1
end
if ($oretofill <= $spacebuffer)
	setvar $oretofill 0
else
	subtract $oretofill $spacebuffer
end
if ($orgtofill <= $spacebuffer)
	setvar $orgtofill 0
else
	subtract $orgtofill $spacebuffer
end
if ($equtofill <= $spacebuffer)
	setvar $equtofill 0
else
	subtract $equtofill $spacebuffer
end
send "q"
if ($ship~ship_fighters_max <= 0)
	gosub :ship~getshipstats
end
if ($figstofill < $ship~ship_fighters_max)
	setvar $figstofill 0
end
if ($oretofill <= 0) and ($orgtofill <= 0) and ($equtofill <= 0) and ($figstofill <= 0)
	goto :strip_donewiththisplanet
end
send "l "&$planet~planettostrip&"*   "
gosub :planet~getplanetinfo
if ($emptyfuel)
	if ($oretofill <= 0)
		setvar $amount_to_strip 0
	else
		setvar $amount_to_strip $planet~planet_fuel
		if ($amount_to_strip > $oretofill)
			setvar $amount_to_strip $oretofill
		end
	end
	if ($amount_to_strip > 0)
		setvar $planet~category 1
		setvar $planet~type "t"
		setvar $planet~moveholds 0
		setvar $planet~moveextra 0
		setvar $planet~moveamount $amount_to_strip
		gosub :planet~moveproduct
		if ($movesuccess = false)
			setvar $switchboard~message "Failed to move product, halting.*"
			gosub :switchboard~switchboard
			halt
		end
		add $countfuel $planet~count
	end
end
if ($emptyorganics)
	if ($orgtofill <= 0)
		setvar $amount_to_strip 0
	else
		setvar $amount_to_strip $planet~planet_organics
		if ($amount_to_strip > $orgtofill)
			setvar $amount_to_strip $orgtofill
		end
	end
	if ($amount_to_strip > 0)
		setvar $planet~category 2
		setvar $planet~type "t"
		setvar $planet~moveholds 0
		setvar $planet~moveextra 0
		setvar $planet~moveamount $amount_to_strip
		gosub :planet~moveproduct
		if ($movesuccess = false)
			setvar $switchboard~message "Failed to move product, halting.*"
			gosub :switchboard~switchboard
			halt
		end
		add $countorganics $planet~count
	end
end
if ($emptyequipment)
	if ($equtofill <= 0)
		setvar $amount_to_strip 0
	else
		setvar $amount_to_strip $planet~planet_equipment
		if ($amount_to_strip > $equtofill)
			setvar $amount_to_strip $equtofill
		end
	end
	if ($amount_to_strip > 0)
		setvar $planet~category 3
		setvar $planet~type "t"
		setvar $planet~moveholds 0
		setvar $planet~moveextra 0
		setvar $planet~moveamount $amount_to_strip
		gosub :planet~moveproduct
		if ($movesuccess = false)
			setvar $switchboard~message "Failed to move product, halting.*"
			gosub :switchboard~switchboard
			halt
		end
		add $countequipment $planet~count
	end
end
if ($emptyfuelcolos)
	setvar $amount_to_strip $planet~planet_fuel_colonists
	if ($skip_over_99)
		if ($fuelcolstofill <= 0)
			setvar $amount_to_strip 0
		elseif ($amount_to_strip > $fuelcolstofill)
			setvar $amount_to_strip $fuelcolstofill
		end
	end
	if ($amount_to_strip > 0)
		setvar $planet~category 1
		setvar $planet~type "s"
		setvar $planet~moveholds 0
		setvar $planet~moveextra 0
		setvar $planet~moveamount $amount_to_strip
		gosub :planet~moveproduct
		if ($movesuccess = false)
			setvar $switchboard~message "Failed to move product, halting.*"
			gosub :switchboard~switchboard
			halt
		end
		add $countcolonists $planet~count
	end
end
if ($emptyorgcolos)
	setvar $amount_to_strip $planet~planet_organics_colonists
	if ($skip_over_99)
		if ($orgcolstofill <= 0)
			setvar $amount_to_strip 0
		elseif ($amount_to_strip > $orgcolstofill)
			setvar $amount_to_strip $orgcolstofill
		end
	end
	if ($amount_to_strip > 0)
		setvar $planet~category 2
		setvar $planet~type "s"
		setvar $planet~moveholds 0
		setvar $planet~moveextra 0
		setvar $planet~moveamount $amount_to_strip
		gosub :planet~moveproduct
		if ($movesuccess = false)
			setvar $switchboard~message "Failed to move product, halting.*"
			gosub :switchboard~switchboard
			halt
		end
		add $countcolonists $planet~count
	end
end
if ($emptyequcolos)
	setvar $amount_to_strip $planet~planet_equipment_colonists
	if ($skip_over_99)
		if ($equcolstofill <= 0)
			setvar $amount_to_strip 0
		elseif ($amount_to_strip > $equcolstofill)
			setvar $amount_to_strip $equcolstofill
		end
	end
	if ($amount_to_strip > 0)
		setvar $planet~category 3
		setvar $planet~type "s"
		setvar $planet~moveholds 0
		setvar $planet~moveextra 0
		setvar $planet~moveamount $amount_to_strip
		gosub :planet~moveproduct
		if ($movesuccess = false)
			setvar $switchboard~message "Failed to move product, halting.*"
			gosub :switchboard~switchboard
			halt
		end
		add $countcolonists $planet~count
	end
end

send "q "

if ($emptyfigs)
	if ($figstofill <= 0) or ($figstofill < $ship~ship_fighters_max)
		goto :strip_donewiththisplanet
	else
		setvar $amount_to_strip $planet~planet_fighters
		if ($amount_to_strip > $figstofill)
			setvar $amount_to_strip $figstofill
		end
	end
	if ($amount_to_strip > 0)
		setvar $restore_ship_fighters true
		send "l "&$planet~planettofill&"* m n l* q "
		:tryfighters
		killtrigger success
		killtrigger emptyempty
		killtrigger fullfill
		killtrigger fullfill2
		killtrigger empty
		send "l j"&#8&$planet~planettostrip&"* jmnt*x q l j"&#8&$planet~planettofill&"* jmnl*x q "
		settexttrigger success :tryfighters "The Fighters join your battle force."
		settexttrigger emptyempty :strip_donewiththisplanet "There isn't room on the planet"
		settexttrigger fullfill :strip_donewiththisplanet "They don't have room for that many "
		settexttrigger fullfill2 :strip_donewiththisplanet "You can't put more than"
		settexttrigger empty :strip_donewiththisplanet "How many Fighters do you want to take (0 Max) [0]"
		pause
	end
end

:strip_donewiththisplanet
killalltriggers
if ($startingplanet = 0)
	return
end
setvar $planet~planet $startingplanet
setvar $nocit true
gosub :landingsub
if ($restore_ship_fighters)
	send "m n t*"
	waiton "Planet command"
end
#if ($startingprompt = "Command")
#	send "c"
#end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:qset
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if ($planet~qset_setting = 0) or ($planet~qset_setting = "")
	setvar $switchboard~message "Quasar Cannon settings are not defined.*"
	gosub :switchboard~switchboard
	return
end
if ($planet~qset_type = 0) or ($planet~qset_type = "")
	setvar $switchboard~message "Quasar Cannon type is not defined.*"
	gosub :switchboard~switchboard
	return
end

gosub :player~currentprompt
setvar $startinglocation $player~current_prompt

setvar $totaldamage 0
setvar $cannontype $planet~qset_type
setvar $planet~qset_type 0
setvar $cannondamage $planet~qset_setting
setvar $planet~qset_setting 0

if ($startinglocation = "Citadel")
	send "q"
elseif ($startinglocation <> "Planet")
	setvar $switchboard~message "Qset must start from the Citadel or Planet prompt!*"
	gosub :switchboard~switchboard
	return
end

gosub :planet~getplanetinfo

if ($planet~citadel < 3)
	setvar $switchboard~message "Planet number " $planet~planet " does not have a quasar cannon.*"
	gosub :switchboard~switchboard
	if (($planet~citadel > 0) and ($startinglocation = "Citadel"))
		send "c "
	end
end

send "c "
if ($cannontype = "s")
	setvar $percenttoset (((3 * $cannondamage) * 100) / $planet~planet_fuel)
	if (((($planet~planet_fuel * $percenttoset) / 100) / 3) < $cannondamage)
		add $percenttoset 1
	end
	if ($percenttoset > 100)
		setvar $percenttoset 100
	end
	add $totaldamage ((($planet~planet_fuel * $percenttoset) / 100) / 3)
	send "l s "&$percenttoset&"* "
	setvar $damagetype "Sector"
else
	if ($mbbs)
		setvar $percenttoset ((($cannondamage / 2) * 100) / $planet~planet_fuel)
		if (((($planet~planet_fuel * $percenttoset) / 100) * 2) < $cannondamage)
			add $percenttoset 1
		end
	else
		setvar $percenttoset (((2 * $cannondamage) * 100) / $planet~planet_fuel)
		if (((($planet~planet_fuel * $percenttoset) / 100) / 2) < $cannondamage)
			add $percenttoset 1
		end
		if ($percenttoset > 100)
			setvar $percenttoset 100
		end
		if ($mbbs)
			add $totaldamage ((($planet~planet_fuel * $percenttoset) / 100) * 2)
		else
			add $totaldamage ((($planet~planet_fuel * $percenttoset) / 100) / 2)
		end
		send "l a "&$percenttoset&"* "
		setvar $damagetype "Atmosphere"
	end
end
if ($startinglocation = "Planet")
	send "q "
end
waiton "What level do you want"
setvar $switchboard~message "Quasar Cannon on planet "&$planet~planet&" is set to "&$totaldamage&". ("&$damagetype&")*"
gosub :switchboard~switchboard
return

# includes

include "source\include\player"
include "source\include\ship"
include "source\include\switchboard"
