#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:grid~surround
:grid~startsurround
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if ($player~surroundpassive)
	send "szd"
	settextlinetrigger surroundscanden :donesurroundscanden "Select (H)olo Scan or (D)ensity Scan or (Q)uit? [D] D"
	settexttrigger surroundscanfailden :donesurroundscan "Do you want instructions (Y/N) [N]?"
	pause

	:grid~donesurroundscanden
	killtrigger surroundscanden
	killtrigger surroundscanfailden
	send "szh"
	waiton "Select (H)olo Scan or (D)ensity Scan or (Q)uit? [D] H"
	send "* "
else
	send "szh"
	settextlinetrigger surroundscan :donesurroundscan "Select (H)olo Scan or (D)ensity Scan or (Q)uit? [D] H"
	settexttrigger surroundscanfail :donesurroundscan "Do you want instructions (Y/N) [N]?"
	pause

	:grid~donesurroundscan
	killtrigger surroundscan
	killtrigger surroundscanfail
	send "* "
end
killtrigger surroundsector
settexttrigger surroundsector :continuesurroundsector "["&$player~current_sector&"]"
pause

:grid~continuesurroundsector
if ($grid~already_checked_ship <> true)
	gosub :ship~getshipstats
end
if ($ship~ship_max_attack > $player~fighters)
	setvar $ship~ship_max_attack ($player~fighters / 2)
end
setvar $grid~avoidedsectors " "
gosub :sector~getavoids
setvar $grid~avoid_i 0
while ($grid~avoid_i < $sector~avoidcount)
	add $grid~avoid_i 1
	setvar $grid~avoidedsectors $grid~avoidedsectors&$sector~avoids[$grid~avoid_i]&" "
end

setvar $grid~i 1
setvar $grid~surroundstring "c v 0* y* "&$player~current_sector&"* q "
setvar $player~surroundoutput ""
setvar $grid~yourowncount 0
if ($player~dropoffensive = true)
	setvar $grid~deployfig "o"
elseif ($player~droptoll = true)
	setvar $grid~deployfig "t"
else
	setvar $grid~deployfig "d"
end
setvar $grid~totalwarps sector.warpcount[$player~current_sector]
while (sector.warps[$player~current_sector][$grid~i] > 0)
	setvar $grid~adj_sec sector.warps[$player~current_sector][$grid~i]
	getdistance $grid~distance $grid~adj_sec $player~current_sector
	if ($grid~distance <= 0)
		send "^f"&$grid~adj_sec&"*"&$player~current_sector&"*q"
		waiton "ENDINTERROG"
		getdistance $grid~distance $grid~adj_sec $player~current_sector
	end
	setvar $grid~containsshieldedplanet false
	setvar $grid~p 1
	while ($grid~p <= sector.planetcount[$grid~adj_sec])
		getword sector.planets[$grid~adj_sec][$grid~p] $grid~test 1
		if ($grid~test = "<<<<")
			setvar $grid~containsshieldedplanet true
		end
		add $grid~p 1
	end
	setvar $grid~tempoffodd $ship~ship_offensive_odds
	multiply $grid~tempoffodd $ship~ship_max_attack
	divide $grid~tempoffodd 12
	setvar $grid~figowner sector.figs.owner[$grid~adj_sec]
	setvar $grid~mineowner sector.mines.owner[$grid~adj_sec]
	setvar $grid~limpowner sector.limpets.owner[$grid~adj_sec]
	getwordpos $grid~avoidedsectors $grid~avoid_pos " "&$grid~adj_sec&" "
	getword $grid~figowner $grid~aliencheck 1
	lowercase $grid~aliencheck

	if (($player~surroundoverwrite = false) and (($grid~figowner = "belong to your Corp") or ($grid~figowner = "yours")))
		add $grid~yourowncount 1
		if ($grid~yourowncount = $grid~totalwarps)
			setvar $player~surroundoutput $player~surroundoutput&"(Surround) All sectors around are friendly fighters.*"
			return
		end
	elseif (sector.figs.quantity[$grid~adj_sec] >= $grid~tempoffodd)
		setvar $player~surroundoutput $player~surroundoutput&"(Surround) Too many fighters in sector "&$grid~adj_sec&".*"
	elseif (($grid~adj_sec <= 10) or ($grid~adj_sec = $map~stardock))
		setvar $player~surroundoutput $player~surroundoutput&"(Surround) Avoided Fed Space, sector "&$grid~adj_sec&".*"
	elseif ($grid~avoid_pos > 0)
		setvar $player~surroundoutput $player~surroundoutput&"(Surround) Avoided user-avoided sector "&$grid~adj_sec&".*"
	elseif ((sector.planetcount[$grid~adj_sec] > 0) and $player~surroundavoidallplanets)
		setvar $player~surroundoutput $player~surroundoutput&"(Surround) Avoided planet in sector "&$grid~adj_sec&".*"
	elseif (($grid~containsshieldedplanet = true) and ($player~surroundavoidshieldedonly = true))
		setvar $player~surroundoutput $player~surroundoutput&"(Surround) Avoided shielded planet in sector "&$grid~adj_sec&".*"
	elseif ($grid~distance > 1)
		setvar $player~surroundoutput $player~surroundoutput&"(Surround) Avoided one way in sector "&$grid~adj_sec&".*"
	elseif (($player~surroundpassive = true) and (((sector.anomaly[$grid~adj_sec] = true) and (($grid~limpowner <> "belong to your Corp") and ($grid~limpowner <> "yours"))) or ((sector.figs.quantity[$grid~adj_sec] > 0) and ($grid~aliencheck <> "the")) or ((sector.mines.quantity[$grid~adj_sec] > 0) and (($grid~mineowner <> "belong to your Corp") and ($grid~mineowner <> "yours")))))
		setvar $player~surroundoutput $player~surroundoutput&"(Surround) Avoided non-passive situation in sector "&$grid~adj_sec&".*"
	else
		setvar $grid~surroundstring $grid~surroundstring&" m z "&$grid~adj_sec&"* z a "&$ship~ship_max_attack&"* * "
		if (($player~surroundfigs > 0) and ($player~fighters > $player~surroundfigs))
			setvar $grid~surroundstring $grid~surroundstring&"f z"&$player~surroundfigs&"*zc"&$grid~deployfig&"*  "
			subtract $player~fighters $player~surroundfigs
			setvar $grid~target $grid~adj_sec
			setsectorparameter $grid~target "FIGSEC" true
		end
		if (($player~surroundlimp > 0) and (($player~limpets > $player~surroundlimp) and ($player~limpets > 0)))
			setvar $grid~surroundstring $grid~surroundstring&"h2 z"&$player~surroundlimp&"*zc* "
			subtract $player~limpets $player~surroundlimp
		end

		if (($player~surroundmine > 0) and (($player~armids > $player~surroundmine) and ($player~armids > 0)))
			setvar $grid~surroundstring $grid~surroundstring&"h1 z"&$player~surroundmine&"*zc* "
			subtract $player~armids $player~surroundmine
		end

		setvar $grid~surroundstring $grid~surroundstring&"< "
		if (($player~current_sector <> $map~stardock) and ($player~current_sector > 10))
			setvar $grid~surroundstring $grid~surroundstring&"za z "&$ship~ship_max_attack&"* * "
		end
	end
	add $grid~i 1
end
if ((($player~surroundfigs > 0) and ($player~fighters > $player~surroundfigs)) and (($player~current_sector <> $map~stardock) and ($player~current_sector > 10)))
	setvar $grid~surroundstring $grid~surroundstring&"f z"&$player~surroundfigs&"*zc"&$grid~deployfig&"*  "
	subtract $player~fighters $player~surroundfigs
	setvar $grid~target $player~current_sector
	setsectorparameter $grid~target "FIGSEC" true
end
send $grid~surroundstring
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:grid~pgrid
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
# Required:
# $grid~pgridSector
#
# Optional:
# $grid~xporting
# $grid~pgrid_xportship
# $grid~pgrid_scan
# $grid~pgrid_wave
# $grid~pgrid_fighterDrop
# $grid~pgrid_surrender
# $grid~pgrid_waves

loadvar $map~stardock
loadvar $ship~ship_max_attack

if ($pgridsector = 0)
	setvar $switchboard~message "Invalid sector number.*"
	gosub :switchboard~switchboard
	halt
end
if ($pgridsector < 11)
	setvar $switchboard~message "Cannot PGRID into FedSpace!*"
	gosub :switchboard~switchboard
	halt
elseif ($pgridsector = $map~stardock)
	setvar $switchboard~message "Cannot PGRID into STARDOCK!*"
	gosub :switchboard~switchboard
	halt
end

if ($grid~incitadel = 0)
	setvar $grid~incitadel ""
end

if ($grid~pgrid_fighterdrop = 0)
	setvar $grid~pgrid_fighterdrop 1
end

if ($grid~pgrid_waves = 0)
	setvar $grid~pgrid_waves 1
end

# yes, true is the default, unless explicitly false
if ($grid~pgrid_surrender = 0)
	setvar $grid~pgrid_surrender true
end

gosub :player~quikstats
setvar $startinglocation $player~current_prompt
setvar $startingsector $player~current_sector
setvar $startingship $player~ship_number
setvar $bot~validprompts "Command Citadel"
gosub :player~checkstartingprompt

if ($startinglocation = "Citadel")
	setvar $incitadel "Q Q "
else
	setvar $incitadel ""
end

if ($grid~pgrid_xporting = "")
	setvar $grid~pgrid_xporting false
end

setvar $pgrid_xportshipfound false

if ($grid~pgrid_xporting = true)
	send "czq"
	waitfor "-----------------------------------------------------------------------------"

	:shipsagain
	settexttrigger shipsdone :shipsdone "Computer command ["
	settextlinetrigger shipfound :shipfound ""
	pause

	:shipfound
	killalltriggers
	getword currentline $maybeship 1
	isnumber $test $maybeship
	if ($test)
		if ($maybeship = $pgrid_xportship)
			getword currentline $xportshipsector 2
			setvar $pgrid_xportshipfound true
			goto :shipsdone
		end
	else
		if ($maybeship = "Computer")
			goto :shipsdone
		end
	end
	goto :shipsagain

	:shipsdone
	killalltriggers
	if ($pgrid_xportshipfound = false)
		setvar $switchboard~message "Could not find xport ship in shipscan*"
		gosub :switchboard~switchboard
		halt
	end
	if ($pgrid_xportshipfound = true)
		if ($ship~ship_xport_range <= 0)
			gosub :ship~getshipstats
		end
		send "cf" $pgridsector "*" $xportshipsector "*q"
		settextlinetrigger shortestpath1 :shortestpath1 "The shortest path"
		settextlinetrigger noroutetosec1 :noroutetosec1 "No route within "
		settextlinetrigger whatsthepoint1 :whatsthepoint1 "So what's the point?"
		pause

		:noroutetosec1
		killalltriggers
		setvar $switchboard~message "Error determining path, ship out of range or avoids blocking path.*"
		gosub :switchboard~switchboard
		halt

		:shortestpath1
		killalltriggers
		getword currentline $dist1 4
		striptext $dist1 "("
		if ($dist1 > $ship~ship_xport_range)
			setvar $switchboard~message "Return XPort will be out of range.*"
			gosub :switchboard~switchboard
			halt
		end

		:whatsthepoint1
		killalltriggers

		send "cf" $xportshipsector "*" $pgridsector "*q"
		settextlinetrigger shortestpath2 :shortestpath2 "The shortest path"
		settextlinetrigger noroutetosec2 :noroutetosec2 "No route within "
		settextlinetrigger whatsthepoint2 :whatsthepoint2 "So what's the point?"
		pause

		:noroutetosec2
		killalltriggers
		setvar $switchboard~message "Error determining path, ship out of range or avoids blocking path.*"
		gosub :switchboard~switchboard
		halt

		:shortestpath2
		killalltriggers
		getword currentline $dist2 4
		striptext $dist2 "("
		if ($dist2 > $ship~ship_xport_range)
			setvar $switchboard~message "First XPort will be out of range.*"
			gosub :switchboard~switchboard
			halt
		end

		:whatsthepoint2
		killalltriggers
	else
		setvar $switchboard~message "Invalid xport ship entered*"
		gosub :switchboard~switchboard
		halt
	end
end

if ($startinglocation = "Citadel")
	send "q"
	gosub :planet~getplanetinfo
	send "c "
end

if ($ship~ship_max_attack <= 0)
	gosub :ship~getshipstats
end

setvar $i 1
setvar $isfound false
while (sector.warps[$player~current_sector][$i] > 0)
	if (sector.warps[$player~current_sector][$i] = $pgridsector)
		setvar $isfound true
	end
	add $i 1
end
if ($isfound = false)
	setvar $switchboard~message "Cannot PGRID.  Sector " & $pgridsector & " not Adjacent, aborting..*"
	gosub :switchboard~switchboard
	halt
end
setvar $switchboard~message "Planet gridding into sector " & $pgridsector & "* c v* y* " & $pgridsector & "* q "

setvar $mac " * "
if ($pgrid_waves <= 0)
	setvar $pgrid_waves 1
end
if ($wave > 0)
	setvar $mac $mac & "a z"&$wave&"* * r * "
else
	if ($player~fighters < $ship~ship_max_attack)
		setvar $mac $mac & "a z " & ($player~fighters-1) & "9999" & "* * "
	else
		setvar $i 1
		while (($i <= $pgrid_waves) and ($player~fighters >= $ship~ship_max_attack))
			setvar $mac $mac & "a z " & ($ship~ship_max_attack-1) & "9999" & "* * "
			add $i 1
			subtract $player~fighters ($ship~ship_max_attack-1)
		end
	end
end
if ($unsafe = true)
	setvar $mac $mac & "f z "&$fighterdrop&" * z c d l j" & #8 & $planet~planet & "* l j" & #8 & $planet~planet & "*  "
elseif ($xporting = false)
	setvar $mac $mac & "j r * f z "&$fighterdrop&" * z c d * "
else
	# still testing - but not adding anything - not even the reteat
end
setvar $previousplanetsinsector sector.planetcount[$player~current_sector]
if ($pgrid_scan = true)
	send "s* "
end
if (($player~scan_type <> "None") and ($pgrid_scan = true))

	:density_scanning
	if ($pgrid_density > 0)
		setvar $tempdensity $pgrid_maxdensity
	else
		setvar $tempdensity sector.density[$pgridsector]
	end

	# setVar $tempDensity SECTOR.DENSITY[$pgridsector]
	setvar $pgriddensity "-99"
	send "q q sdz* l " & $planet~planet & "* c  "
	waiton "Relative Density Scan"
	settextlinetrigger denscheck  :getdensitypgrid " " & $pgridsector & "  ==>"
	settextlinetrigger denscheck2 :getdensitypgrid2 " " & $pgridsector & ") ==>"
	settextlinetrigger denscheck3 :getdensitypgrid "(" & $pgridsector & ") ==>"
	settextlinetrigger denscheckdone :donedensitycheck "<Enter Citadel>"
	pause

	:getdensitypgrid
	killtrigger denscheck
	killtrigger denscheck3
	killtrigger denscheck2
	getword currentline $pgriddensity 4
	striptext $pgriddensity ","
	striptext $pgriddensity "."
	pause

	:getdensitypgrid2
	killtrigger denscheck
	killtrigger denscheck3
	killtrigger denscheck2
	getword currentline $pgriddensity 5
	striptext $pgriddensity ","
	striptext $pgriddensity "."
	pause

	:donedensitycheck
	killalltriggers
	if ($tempdensity <> "-1")
		if ($pgriddensity = "-99")
			setvar $switchboard~message "Last Density Scan was not correctly grabbed, cannot safely continue.*"
			gosub :switchboard~switchboard
			halt
		elseif ($pgriddensity > $tempdensity)
			setvar $switchboard~message "Density increased since last scan in sector "&$pgridsector&". ("&$pgriddensity&")*"
			gosub :switchboard~switchboard
			halt
		end
	else
		setvar $switchboard~message "You must density scan sector "&$pgridsector&" at least once before pgridding.*"
		gosub :switchboard~switchboard
		halt
	end
end
setvar $newplanetsinsector sector.planetcount[$player~current_sector]
if (($previousplanetsinsector < $newplanetsinsector) and ($newplanetsinsector > 1))
	setvar $switchboard~message "Planet number increased since last scan in this sector. Try again to override.*"
	gosub :switchboard~switchboard
	halt
end
if ($pgrid_retreat)
	send $incitadel & "m " & $pgridsector & $mac & "< n n n * "

	if ($pgrid_surrender = true)
		send " h s y * "
	end
	if ($planet~planet > 0)
		send "l j" & #8 & $planet~planet & "*  *  "
	end
	gosub :player~quikstats
	if (($player~current_sector <> $grid~startingsector))
		send "'" & $pgridsector & "=saveme* "
		gosub :emergencylanding
		setvar $switchboard~message "Unsuccessful retreat from sector " & $pgridsector & ". Attempted saveme call.*"
	else
		if ($player~current_prompt = "Planet")
			send "m * * * c p " & $pgridsector & "* y s* "
		end
		gosub :player~quikstats
		if ($player~current_sector = $pgridsector)
			setvar $switchboard~message "Successfully P-gridded into sector " & $pgridsector & "*"
			setvar $target $pgridsector
			setsectorparameter $target "FIGSEC" true
		else
			setvar $switchboard~message "No fighter deployed in sector " & $pgridsector & "*"
			gosub :switchboard~switchboard
		end
	end
else

	if ($xporting = false)
		setvar $pgridstring "'" & $pgridsector & "=saveme* " & $incitadel & "m " & $pgridsector & $mac
	else
		# Xporting - we will grid in > Xport out > wait > xport in and drop fig/saveme
		setvar $pgridstring $incitadel & "m " & $pgridsector & $mac

	end

	if ($xporting)
		setvar $pgridstring $pgridstring & "x   " & $pgrid_xportship & "* * "
	else
		if ($pgrid_surrender = true)
			setvar $pgridstring $pgridstring & " h s y * "
		end
	end
	send $pgridstring
	if ($xporting)
		gosub :player~quikstats
		if ($player~ship_number = $startingship)
			gosub :emergencylanding
			setvar $switchboard~message "Unsuccessful xport out of sector " & $pgridsector & ". Ship too far away or I was photoned.*"
			gosub :switchboard~switchboard
			send " f 1* c d  * * "
			send "'" & $player~current_sector & "=saveme* "
			gosub :emergencylanding
		else
			getrnd $thedelay 150 450
			setdelaytrigger waitpgridxport :gopgridxport $thedelay
			pause

			:gopgridxport
			send "'" & $pgridsector & "=saveme* x   " & $startingship & "* * f "&$fighterdrop&" * c d "
			gosub :emergencylanding
			gosub :player~quikstats
			if ($player~current_prompt = "Planet")
				send "m * * * c s* "
			end
			if ($player~ship_number <> $startingship)
				setvar $switchboard~message "Gridding ship not available for re-export.  Bot is in safe ship.*"
				gosub :switchboard~switchboard
			else
				setvar $switchboard~message "Successfully P-gridded w/xport into sector " & $pgridsector & "*"
				gosub :switchboard~switchboard
			end

		end
	else
		gosub :emergencylanding
		gosub :player~quikstats
		if (($player~current_sector <> $pgridsector))
			setvar $switchboard~message "Unsuccessful P-grid into sector " & $pgridsector & ". Someone make sure bot is picked up.*"
			gosub :switchboard~switchboard
		else
			setvar $switchboard~message "Successfully P-gridded into sector " & $pgridsector & "*"
			gosub :switchboard~switchboard
			setvar $target $pgridsector
			setsectorparameter $target "FIGSEC" true
		end
	end
end
halt

:emergencylanding
setvar $i 0
while ($i < 15)
	add $i 1
	send "l j" & #8 & $planet~planet & "*  *  "
end
gosub  :player~currentprompt
if ($player~current_prompt = "Planet")
	send "m * * * c s* "
end
return
# ======================     END PGRID (PGRID) SUBROUTINE     ==========================

include "source\include\ship"
include "source\include\planet"
include "source\include\player"
include "source\include\sector"
