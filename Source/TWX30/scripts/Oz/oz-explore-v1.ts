# heh yeh baby
# hunter in the house
# charge clears nnf dead ends

# lets check for dead ends here first
# need to have them exported to file gamename.dend
# lets get some inputs to start
# check if we can run it from here

loadvar $unlimitedGame

# revisit figged sectors (for explore mode)
setvar $gridall 1

cutText CURRENTLINE $location 1 7

if ($location <> "Command")
        clientMessage "This script must be run from the Command Prompt"
        halt
end
setVar $oz_hunter_version "OZ-Hunter 2.0"

gosub :quikstats

if ($FIGHTERS > 0)
	setvar $hunter_figs ($FIGHTERS / 2)
else
	setvar $hunter_figs 1
end
setVar $hunter_turns 100
setVar $menu_twarp 1
setVar $menu_area 1
setVar $hunter_area "File List"
setVar $menu_hscan 1
setVar $hunter_level 500
setVar $planet 0

if ($SCAN_TYPE = "Holo") and ($unlimitedGame)
	setvar $hunter_hscan "ON"
else
	setvar $hunter_hscan "OFF"
end

if ($TWARP_TYPE > 0)
	setvar $hunter_twarp "ON"
else
	setvar $hunter_twarp "OFF"
end

addMenu "" "OZ-Hunter" "OZ-Hunter Settings" "." "" "Main" FALSE
addMenu "OZ-Hunter" "Run" "Run Script." "Z" :Menu_Run "" TRUE
addMenu "OZ-Hunter" "Min Figs" "Min Figs" "F" :Menu_Figs "" FALSE
addMenu "OZ-Hunter" "Min Turns" "Min Turns" "T" :Menu_Turns "" FALSE
addMenu "OZ-Hunter" "Twarp" "Twarp" "W" :Menu_Twarp "" FALSE
addMenu "OZ-Hunter" "Area" "Area" "A" :Menu_Area "" FALSE
addMenu "OZ-Hunter" "Holo Scan" "Holo Scan" "H" :Menu_hscan "" FALSE

setMenuHelp "Run" "This Option Activates the Responder."
setMenuHelp "Min Figs" "This Option Sets the Minimum Figs for Hunter to Stop."
setMenuHelp "Min Turns" "This Option Sets the Minimum Turns for Hunter to Stop."
setMenuHelp "Twarp" "This Option Sets twarp on or off for gridding and autobuys ore."
setMenuHelp "Area" "This Option Sets the area to grid."
setMenuHelp "Holo Scan" "This Option Sets the on/off option to use holo scanning"




:start_menu
	gosub :sub_setMenu
	gosub :ozHeader
	openMenu "OZ-Hunter"



:ozHeader
	ECHO ANSI_2 "*----------------------------------------*"
	ECHO ANSI_10 "             " $oz_hunter_version "       "
	ECHO ANSI_2 "*----------------------------------------*"
	return

:Menu_Figs
	getInput $hunter_figs "Enter the minimum fig level to stop at"
	echo ANSI_12 "*" $hunter_figs "*"
	isNumber $number $hunter_figs
		if ($number <> 1)
			echo ANSI_12 "*Invalid Number*"
			goto :Menu_Figs
		end
	saveVar $hunter_figs
	gosub :sub_setMenu
	gosub :ozheader
	openMenu "OZ-Hunter"

:Menu_Turns
	getInput $hunter_turns "Enter the minimum turn level to stop at"
	echo ANSI_12 "*" $hunter_turns "*"
	isNumber $number $hunter_turns
		if ($number <> 1)
			echo ANSI_12 "*Invalid Number*"
			goto :Menu_Turns
		end
	saveVar $hunter_turns
	gosub :sub_setMenu
	gosub :ozheader
	openMenu "OZ-Hunter"

:Menu_Twarp
	add $menu_twarp 1
	if ($menu_twarp = 2)
		setVar $hunter_Twarp "ON"
	elseif ($menu_twarp = 3)
		setVar $hunter_Twarp "PLANET"
		getInput $planet "Enter Planet Number"
		saveVar $planet
	else
		setVar $menu_twarp 1
		setVar $hunter_twarp "OFF"
	end
	saveVar $hunter_twarp
	saveVar $menu_twarp
	gosub :sub_setMenu
	gosub :ozheader
	openMenu "OZ-Hunter"

:Menu_Area
	add $menu_area 1
	if ($menu_area = 2)
		setVar $hunter_area "Unexplored"
	elseif ($menu_area = 3)
		setVar $hunter_area "Nearest Unfigged"
	else
		setVar $menu_area 1
		setVar $hunter_area "File List"
	end
	saveVar $hunter_area
	saveVar $menu_area
	gosub :sub_setMenu
	gosub :ozheader
	openMenu "OZ-Hunter"
	
:menu_hscan
	add $menu_hscan 1
	if ($menu_hscan = 2)
		setVar $hunter_hscan "ON"
	else
		setVar $menu_hscan 1
		setVar $hunter_hscan "OFF"
	end
	saveVar $hunter_hscan
	saveVar $menu_hscan
	gosub :sub_setMenu
	gosub :ozheader
	openMenu "OZ-Hunter"

:sub_setMenu
	setMenuValue "Min Figs" $hunter_figs
	setMenuValue "Min Turns" $Hunter_turns
	setMenuValue "Twarp" $hunter_twarp
	setMenuValue "Area" $hunter_area
	setMenuValue "Holo Scan" $hunter_hscan
	return

:menu_run
	# globals
	setVar $fig_num 1
	setVar $fig_type d
	# lets get figgies first
	send "'OZ Hunter - Gridding -*"
	send "'   - Area       = " $hunter_area "*"
	send "'   - Holo Scan  = " $hunter_hscan "*"
	send "'   - Min Figs   = " $hunter_figs "*"
	send "'   - Min Turns  = " $hunter_turns "*"
	send "'   - TWarp      = " $hunter_twarp "*"
	
:figrefresh
setarray $figlist SECTORS
setarray $limps SECTORS
setarray $armids SECTORS
setarray $didholo SECTORS
setvar $sec 10

echo "*Processing figs, one moment...*"

while ($sec < SECTORS)
	add $sec 1	
	getSectorParameter $sec "FIGSEC" $isfigged
	getSectorParameter $sec "LIMPSEC" $islimped
	getSectorParameter $sec "MINESEC" $ismined
	
	setvar $didholo[$sec] 0
	
	isNumber $test $isfigged
	if ($test)
		if ($isfigged <> 0)
			setvar $figlist[$sec] 1
		else
			setvar $figlist[$sec] 0
		end
	end
	
	isNumber $test $islimped
	if ($test)
		if ($islimped <> 0)
			setvar $limps[$sec] 1
			add $limpcount 1
		else
			setvar $limps[$sec] 0
		end
	end
	
	isNumber $test $ismined
	if ($test)
		if ($ismined <> 0)
			setvar $armids[$sec] 1
			add $armidcount 1
		else
			setvar $armids[$sec] 0
		end
	end
end

:info_nab
	KillAllTriggers
	gosub :quikstats
	setVar $cursec $CURRENT_SECTOR
	setVar $sd STARDOCK
	gosub :startCNsettings
	#gosub :quikstats	

	if ($hunter_area = "File List")
		goto :check_dend
	end

:got_de_info
	if ($hunter_twarp = "PLANET")
		send "l" $planet "*c"
		waitFor "<Enter Citadel>"
	end

:start_it
	if ($hunter_area = "File List")
		setVar $near "de"
	elseif ($hunter_area = "Unexplored")	
		setVar $near "ux"
	elseif ($hunter_area = "Nearest Unfigged")
		setVar $near "nnf"
	end
:start_search
	setVar $nnfcheck $cursec
#	Echo "*" "Current Sector = " $cursec "*"

	setVar $return 1
	setVar $breadth_mode "forward"
	goto :nnf_find
:return1
	setVar $my_sec $jumpfig
#	echo "*" "Target Sector = " $my_sec "*"
	getDistance $distance $cursec $my_sec
	if ($distance = 1) and ($void[$my_sec] = 0)
		goto :twarp_return
	elseif ($distance = 1) and ($void[$my_sec] = 1)
		#setVar $figlist[$my_sec] 1
		goto :start_it
	end
	if ($hunter_twarp = "ON") or ($hunter_twarp = "PLANET")
		setVar $nnfcheck $jumpfig
		setVar $near "nf"
		setVar $return 2
		setVar $breadth_mode "reverse"
		goto :nnf_find
	end
:return2
	setVar $my_twarp $jumpfig
	if ($hunter_twarp = "ON") and ($my_twarp = $cursec)
		goto :twarp_return
	elseif ($hunter_twarp = "ON") and ($my_twarp <> $cursec)
		setVar $twarp_sec $my_twarp
		goto :twarp
	elseif ($hunter_twarp = "PLANET") and ($my_twarp = $cursec)
		goto :twarp_return
	elseif ($hunter_twarp = "PLANET") and ($my_twarp <> $cursec)
		setVar $twarp_sec $my_twarp
		goto :bwarp
	end
:twarp_return
	setVar $charge_sec $my_sec
	goto :getnav	
:done_with_charge
	if ($hunter_twarp = "PLANET")
		goto :callsaveme
:return_callsaveme
	end
	goto :start_it

:getShipStats
	
	send "c;q"
	setTextLineTrigger	getshipoffense		:shipoffenseodds	"Offensive Odds: "
	setTextLineTrigger	getshipfighters 	:shipmaxfigsperattack	" TransWarp Drive:   "
	setTextLineTrigger	getshipmines 		:shipmaxmines		" Mine Max:  "
	pause
	
	:shipoffenseodds
		getWordPos CURRENTANSILINE $pos "[0;31m:[1;36m1"
		if ($pos > 0)
			getText CURRENTANSILINE $SHIP_OFFENSIVE_ODDS "Offensive Odds[1;33m:[36m " "[0;31m:[1;36m1"
			stripText $SHIP_OFFENSIVE_ODDS "."
			stripText $SHIP_OFFENSIVE_ODDS " "
			gettext CURRENTANSILINE $SHIP_FIGHTERS_MAX "Max Fighters[1;33m:[36m" "[0;32m Offensive Odds"
			stripText $SHIP_FIGHTERS_MAX ","
			stripText $SHIP_FIGHTERS_MAX " "
		end
		pause
	:shipmaxmines
		getText CURRENTLINE $SHIP_MINES_MAX "Mine Max:" "Beacon Max:"
		stripText $SHIP_MINES_MAX " "
		pause

	:shipmaxfigsperattack
		getWordPos CURRENTANSILINE $pos "[0m[32m Max Figs Per Attack[1;33m:[36m"
		if ($pos > 0)
			getText CURRENTANSILINE $SHIP_MAX_ATTACK "[0m[32m Max Figs Per Attack[1;33m:[36m" "[0;32mTransWarp"
			striptext $SHIP_MAX_ATTACK " "
			#setVar $SHIP_MAX_ATTACK 1000
		end
return

# -=-=-=-=-=-- charge subroutine -=-=-=-=-=-=-=-=-=-

# -=-=-=-=-- warp course getter -=-=-=-=-=-=-=-=-
:getnav
	setArray $warppath 200
	setVar $plot 1
:WarpPathBuilder
	setVar $distance 2
	send "^f" $cursec "*" $charge_sec "*q"
	setTextlinetrigger BuildPath :BuildPath $cursec&" > "
	setTextLineTrigger NoRoute :NoRoute "No route within"
	pause
:BuildPath
	killAllTriggers
	setVar $routeline CURRENTLINE
	striptext $routeline " >"
	striptext $routeline "("
	striptext $routeline ")"
:PathLoop
	getWord $routeline $warppath[$plot] $distance
	if ($warppath[$plot] = $charge_sec)
		add $plot 1
		add $distance 1
		Goto :gotPath
	end
	if ($warppath[$plot] = "0")
		settextlinetrigger NextLine :NextLine " "
		pause
	end
	add $plot 1
	add $distance 1
	goto :PathLoop
:NextLine
	setVar $distance 1
	setVar $routeline CURRENTLINE
	striptext $routeline " >"
	striptext $routeline ")"
	striptext $routeline "("
	goto :PathLoop
:noroute
	killAllTriggers
	send "nq"
	setVar $de[$charge_sec] 0
	#setVar $figlist[$charge_sec] 1
	goto :done_charge
	
:gotPath
#	if ($to_count = $parse)
#		goto :done_course
#	end
#	add $from_count 1
#	add $to_count 1
#	goto :WarpPathBuilder



# -=-=-=-=-=-=-=-=- old -=-=-
	#send "'Charging " $cursec " --> " $charge_sec "*"
	killalltriggers
	setVar $move_count 0
	
gosub :getShipStats
settexttrigger bail :bail "Are you sure you want to surrender"

:bang_it
	send "sd"
	setvar $didholo 0
	if (hunter_hscan = "ON")
		setvar $doholo 0
		setvar $i 0
		while ($i < SECTOR.WARPCOUNT[$cursec])
			add $i 1
			setvar $sec SECTOR.WARPS[$cursec][$i]
			if ($didholo[$sec] = 0)
				setvar $doholo 1
			end
		end
		if ($doholo = 1)
			send "sh"
			setvar $didholo[$sec] 1
		end
	end
	add $move_count 1
	if ($move_count = $plot)
		goto :done_charge
	end
	if ($hunter_level <> 0)
		waitFor "Relative Density Scan"
		waitFor "["&$cursec&"]"
		getSector $warppath[$move_count] $dens_check
		setVar $havesector $warppath[$move_count]
		setvar $target $warppath[$move_count]
		getSectorParameter $target "MINESEC" $isarmid		

	 	if ($void[$target] = 1) or ($dens_check.density > 0)
			if ($dens_check.anomoly = "YES") and ($limps[$havesector] = 0)
				send "'Density Anomoly Detected - Sector " $warppath[$move_count] ".*" 
				if ($warppath[$move_count] = $charge_sec)
					#send "^s" $warppath[$move_count] "*q"
					setavoid $warppath[$move_count]
					setVar $void[$warppath[$move_count]] 1
					if ($de[$charge_sec] = 1)
						setVar $de[$charge_sec] 0
					end
					#setVar $figlist[$charge_sec] 1
					goto :done_charge
				end
				#send "^s" $warppath[$move_count] "*q"
				setavoid $warppath[$move_count]
				setVar $void[$warppath[$move_count]] 1
				if ($de[$charge_sec] = 1)
					setVar $de[$charge_sec] 0
				end
				#setVar $figlist[$warppath[$move_count]] 1
				goto :getNav
			elseif (($isarmid > 0) AND ($armidOwner <> "belong to your Corp") AND ($armidOwner <> "yours"))
				send "'Density Anomoly Detected - Sector " $warppath[$move_count] ".*" 
				if ($warppath[$move_count] = $charge_sec)
					#send "^s" $warppath[$move_count] "*q"
					setavoid $warppath[$move_count]
					setVar $void[$warppath[$move_count]] 1
					if ($de[$charge_sec] = 1)
						setVar $de[$charge_sec] 0
					end
					#setVar $figlist[$charge_sec] 1
					goto :done_charge
				end
				#send "^s" $warppath[$move_count] "*q"
				setavoid $warppath[$move_count]
				setVar $void[$warppath[$move_count]] 1
				if ($de[$charge_sec] = 1)
					setVar $de[$charge_sec] 0
				end
				#setVar $figlist[$warppath[$move_count]] 1
				goto :getNav
			elseif ($figlist[$warppath[$move_count]] > 0)
				goto :contgrid
			elseif ($dens_check.density = 100) and (SECTOR.FIGS.QUANTITY[$target] < 1)
				goto :contgrid
			else
				send "'Density Anomoly Detected - Sector " $warppath[$move_count] ".*" 
				if ($warppath[$move_count] = $charge_sec)
					#send "^s" $warppath[$move_count] "*q"
					setavoid $warppath[$move_count]
					setVar $void[$warppath[$move_count]] 1
					if ($de[$charge_sec] = 1)
						setVar $de[$charge_sec] 0
					end
					#setVar $figlist[$charge_sec] 1
					goto :done_charge
				end
				#send "^s" $warppath[$move_count] "*q"
				setavoid $warppath[$move_count]
				setVar $void[$warppath[$move_count]] 1
				if ($de[$charge_sec] = 1)
					setVar $de[$charge_sec] 0
				end
				#setVar $figlist[$warppath[$move_count]] 1
				goto :getNav
			end
		end
	end
	:contgrid
	send "m" $warppath[$move_count] "*  z  e  a  " $SHIP_MAX_ATTACK "  z  n  d"
	setVar $cursec $warppath[$move_count]
		if ($warppath[$move_count] > 10) and ($warppath[$move_count] <> $sd)
			send "f  z" $fig_num "*  z  c  " $fig_type "  z  n"
			setVar $figList[$cursec] 1
			if ($de[$cursec] = 1)
				setVar $de[$cursec] 0
			end
			subtract $FIGHTERS $fig_num
		end
		
		goto :bang_it
		
:uhOh
	echo ANSI_12 "**uh-Oh**"
	halt

:done_charge
	send "@"
	waitFor "Average Interval Lag"
	waitFor "(?="
	gosub :quikstats
#	if ($quikstats[$h[2]] < $hunter_turns)
#			goto :low_turns
#	end
	if ($FIGHTERS < $hunter_figs)
		goto :low_figs
	end
		

:charge_qs_return
	if ($charge_ore = 1)
		setVar $charge_ore 0
		goto :return_from_charge
	else
		goto :done_with_charge
	end

:low_turns
send "'Min Turn Level Reached*"
halt

:low_figs
send "'Min Fig Level Reached*"
halt

:bail
send "nnrrrrrrrrrrr*"
halt


# -=-=-=-=-=-subroutine to add non figged dead ends to the de array-=-=-=-=-=
:check_dend
	setVar $a 0
	setVar $de_count 0
	setArray $de SECTORS
	setVar $dead_end_info GAMENAME & ".list"
	fileExists $exist $dead_end_info
		if ($exist = 1)
			gosub :get_de
		else
			send "'OZ Hunter - No File List*"
			halt
		end
:get_de
	add $a 1
	read $dead_end_info $desec $a
		if ($desec <> "EOF")
			#if ($figList[$desec] = 0)
				setVar $de[$desec] 1
				add $de_count 1
				goto :get_de
			#else
			#	goto :get_de
			#end
		elseif ($desec = "EOF")
			goto :got_de_info
		end
	

# ----- SUB :breadth_search -----
:nnf_find
:breadth_search
    # (var $nnfcheck should be passed from main)
    # (var $breadth_mode should be passed from main)
    # (var $near should be passed from main)
    setVar $database[1] $nnfcheck
    setVar $array_size 1
    setVar $array_pos 0
    setVar $num_sectors SECTORS
    setArray $checked $num_sectors
    setVar $checked[$nnfcheck] 1
    setArray $path $num_sectors
    setVar $path[$nnfcheck] ""
    setArray $distance $num_sectors
    setVar $distance[$nnfcheck] 0

    :SectorLoop
        add $array_pos 1
        if ($array_pos > $array_size)
            setVar $return_data "Array Pos exceeds Array Size - ABNORMAL EXIT FROM SUBROUTINE"
            send "'All Sectors Cleared*"
		halt
        end
        setVar $current_sector $database[$array_pos]
        setVar $warpnum 0
        :checkwarps
            add $warpnum 1
            if (SECTOR.WARPSIN[$current_sector][$warpnum] <> 0)
             if ($breadth_mode = "reverse")
                 setVar $lala SECTOR.WARPSIN[$current_sector][$warpnum]
             else
                 setVar $lala SECTOR.WARPS[$current_sector][$warpnum]
             end
            end
	if ($checked[$lala] = 0)
	setVar $checked[$lala] 1
	add $array_size 1
	setVar $database[$array_size] $lala

	if ($breadth_mode = "reverse")
	    setVar $path[$lala] $path[$current_sector] & " " & $lala
	else
	    setVar $path[$lala] $lala & " " & $path[$current_sector]
	end

	setVar $distance[$lala] $distance[$current_sector]
	add $distance[$lala] 1



	if ($near = "nf")
	    if ($figlist[$lala] = 1)
		setVar $jumpfig $lala
		goto :found_nnf
	    end
	elseif ($near = "nnf") 
	    #if ($figlist[$lala] = 0) and ($lala > 10) and ($lala <> STARDOCK)
	    if ($lala > 10) and ($lala <> STARDOCK)
		setVar $jumpfig $lala
		goto :found_nnf
	    end
	elseif ($near = "ux") and ($figlist[$lala] = 0)
		getSector $lala $hunter_sec
		if ($hunter_sec.explored <> "YES") and ($hunter_sec.explored <> "DENSITY")
			setVar $jumpfig $lala
			goto :found_nnf
		end
	elseif ($near = "de")
	    if ($de[$lala] = 1) 
		setVar $jumpfig $lala
		goto :found_nnf
	    end
	elseif ($near = "fuel") and ($figlist[$lala] = 1)
		getSector $lala $hunter_sec
		if ($hunter_sec.port.exists = 1) and ($hunter_sec.port.buy_ore = "NO") and ($void[$lala] = 0)
			setVar $jumpfig $lala
			goto :found_nnf
		end

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

:found_nnf
if ($return = 1)
	goto :return1
elseif ($return = 2)
	goto :return2
elseif ($return = 3)
	goto :return3
end
# -=-=-=-=-=-=-=-= bwarp routine -=-=-=-=-=-=-=-=-
:bwarp
	killAllTriggers
	send "b" $twarp_sec "*"
	setTextTrigger go :go5 "TransWarp Locked"
	setTextTrigger no :no5 "No locating beam found"
	pause

:no5
killTrigger go
send "n"
waitfor "Transporter shutting down."
setVar $figlist[$twarp_sec] 0
send "'BWarp Failed to Achieve Lock, Charging...*"
	goto :twarp_return

:go5
killTrigger no
send "yzn"
send "'BWarping --> " $twarp_sec "*"
	setVar $cursec $twarp_Sec
	subtract $turns 1
	waitFor "Warps to Sector(s)"
	goto :twarp_return

# -=-=-=-=-=-=- call saveme -=-=-=-=-=--=-=-=
:callsaveme
send "'" $CURRENT_SECTOR "=saveme*"
waitfor "just materialized from the void!"
send "l" $planet "*c"
waitfor "<Enter Citadel>"
goto :return_callsaveme

# -=-=-=-=-=-=-=- twarp subroutine -=-=-=-=-=-=-=-=-=-=-=-=-=-
:twarp
	if ($void[$twarp_sec] = 1)
		echo "*Just about kilt myself!*"
		halt
	end
#	echo "*" "Twarping to = " $twarp_sec "*"
	send "m" $twarp_sec "*"
	setTextTrigger there :adj_warp "You are already in that sector!"
	setTextLineTrigger adj_warp :adj_warp "Sector  : "&$twarp_sec
	setTextLineTrigger locking :locking "That Warp Lane is not adjacent"
	pause

:adj_warp
	killAllTriggers
	send "zn"
	goto :twarp_adj
:locking
	killAllTriggers
	send "y"
	setTextLineTrigger twarp_lock :twarp_lock "TransWarp Locked"
	setTextLineTrigger no_twrp_lock :no_twarp_lock "No locating beam found"
	setTextLineTrigger twarp_adj :twarp_adj "<Set NavPoint>"
	setTextLineTrigger no_ore :no_ore "You do not have enough Fuel Ore"
	pause


:no_ore
	killAllTriggers
	if ($move_ore = 1)
		setVar $charge_ore 1
		goto :return_twarp_ore
	end
	send "'Getting Ore...*"
	goto :get_some_ore
		

:twarp_adj
	send "zn"
	send "'TWarping --> " $twarp_sec "*"
	setVar $cursec $twarp_sec
	subtract $turns $tpw
	killAllTriggers
	if ($move_ore = 1)
		setVar $charge_ore 0
		goto :return_twarp_ore
	end
	goto :twarp_return

:twarp_lock
	KillAlltriggers
	send "y*zn"
	send "'TWarping --> " $twarp_sec "*"
	setVar $cursec $twarp_Sec
	subtract $turns $tpw
	waitFor "Warps to Sector(s)"
	if ($move_ore = 1)
		setVar $charge_ore 0
		goto :return_twarp_ore
	end
	goto :twarp_return

:no_twarp_lock
	killAllTriggers
	send "n*zn"
	if ($move_ore = 1)
		setVar $charge_ore 1
		goto :return_twarp_ore
	end
	send "'Twarp Failed to Achieve Lock, Charging...*"
	goto :twarp_return

# -=-=-=-=-=-=- get ore for twarp -=-=-=-=-=-=-=-=-=-=
:get_some_ore
	setVar $near "fuel"
	setVar $return 3
	setVar $nnfcheck $cursec
	setVar $breadth_mode "forward"
	goto :nnf_find

:return3
	setVar $fuel_sec $jumpfig
	setVar $twarp_sec $fuel_sec
	setVar $move_ore 1
	goto :twarp
:return_twarp_ore	
	if ($charge_ore = 1)
		setVar $charge_sec $fuel_sec
		goto :getnav
	end
:return_from_charge
	setVar $move_ore 0
	goto :buy_ore
:got_ore
	
	goto :start_it

# -=-=-=-=-=-=-=-= buy ore subroutine -=-=-=-=-=-=-=-=-=-=-=-=-
:buy_ore
	send "pt"
	setTextLineTrigger port_sell :port_sell "Fuel Ore   Selling"
	pause
:port_sell
	getWord CURRENTLINE $port_ore 4
	if ($port_ore < $holds)
		send "0*0*0*"
		goto :upgrade_ore
	end
	send "**"
	subtract $turns 1
	goto :got_ore


# -=-=-=-=-=-=-=- upgrade ore subroutine -=-=-=-=-=-=-=-=-=-=-=
:upgrade_ore
	setVar $upore $holds
	divide $upore 10
	divide $upore 9
	setVar $up_count 0
:up_it
	send "o19*q"
	add $up_count 1
	if ($up_count > $upore)
		goto :buy_ore
	else
		goto :up_it
	end

##############################################################################
:quikstats
	setVar $CURRENT_PROMPT 		"Undefined"
	killtrigger 		noprompt
	killtrigger 		prompt1
	killtrigger 		prompt2
	killtrigger 		prompt3
	killtrigger 		prompt4
	killtrigger			prompt5
	killtrigger 		statlinetrig
	killtrigger 		getLine2
	setTextTrigger 		prompt1 		:allPrompts 		"(?="
	setTextLineTrigger 	prompt2 		:secondaryPrompts 	"(?)"
	setTextLineTrigger 	statlinetrig 	:statStart 			#179
	setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
	setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
	setTextTrigger		prompt5			:portPrompt			"How many holds of"
	send "^Q/"
	pause

	:allPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			setVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt1 :allPrompts "(?="
		pause
	:secondaryPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			setVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt2 :secondaryPrompts "(?)"
		pause
	:terraPrompts
		killtrigger prompt3
		killtrigger prompt4
		getWord currentansiline $checkPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			setVar $CURRENT_PROMPT "Terra"
		end
		setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
		setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
		pause
	:portPrompt
		getWord CURRENTANSILINE $checkPrompt 1
		setVar $PORT_PROMPT_TYPE CURRENTLINE
		getWord $PORT_PROMPT_TYPE $tempPrompt 1
		getWordPos $checkPrompt $pos "[35mHow"
		if ($pos > 0)
			setVar $CURRENT_PROMPT "Port"
		end
		setTextTrigger		prompt5			:portPrompt			"How many holds of"
		pause

	:statStart
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
		killtrigger prompt5
		killtrigger noprompt
		setVar $stats ""
		setVar $wordy ""

	:statsline
		killtrigger statlinetrig
		killtrigger getLine2
		setVar $line2 CURRENTLINE
		replacetext $line2 #179 " "
		striptext $line2 ","
		setVar $stats $stats & $line2
		getWordPos $line2 $pos "Ship"
		if ($pos > 0)
			goto :gotStats
		else
			setTextLineTrigger getLine2 :statsline
			pause
		end

	:gotStats
		setVar $stats $stats & " @@@"

		setVar $current_word 0
		while ($wordy <> "@@@")
			if ($wordy = "Sect")
				getWord $stats $CURRENT_SECTOR   	($current_word + 1)
			elseif ($wordy = "Turns")
				getWord $stats $TURNS  				($current_word + 1)
			elseif ($wordy = "Creds")
				getWord $stats $CREDITS  			($current_word + 1)
			elseif ($wordy = "Figs")
				getWord $stats $FIGHTERS   			($current_word + 1)
			elseif ($wordy = "Shlds")
				getWord $stats $SHIELDS  			($current_word + 1)
			elseif ($wordy = "Hlds")
				getWord $stats $TOTAL_HOLDS   		($current_word + 1)
			elseif ($wordy = "Ore")
				getWord $stats $ORE_HOLDS    		($current_word + 1)
			elseif ($wordy = "Org")
				getWord $stats $ORGANIC_HOLDS    	($current_word + 1)
			elseif ($wordy = "Equ")
				getWord $stats $EQUIPMENT_HOLDS    	($current_word + 1)
			elseif ($wordy = "Col")
				getWord $stats $COLONIST_HOLDS    	($current_word + 1)
			elseif ($wordy = "Phot")
				getWord $stats $PHOTONS   			($current_word + 1)
			elseif ($wordy = "Armd")
				getWord $stats $ARMIDS   			($current_word + 1)
			elseif ($wordy = "Lmpt")
				getWord $stats $LIMPETS   			($current_word + 1)
			elseif ($wordy = "GTorp")
				getWord $stats $GENESIS  			($current_word + 1)
			elseif ($wordy = "TWarp")
				getWord $stats $TWARP_TYPE  		($current_word + 1)
			elseif ($wordy = "Clks")
				getWord $stats $CLOAKS   			($current_word + 1)
			elseif ($wordy = "Beacns")
				getWord $stats $BEACONS 			($current_word + 1)
			elseif ($wordy = "AtmDt")
				getWord $stats $ATOMIC  			($current_word + 1)
			elseif ($wordy = "Corbo")
				getWord $stats $CORBO   			($current_word + 1)
			elseif ($wordy = "EPrb")
				getWord $stats $EPROBES   			($current_word + 1)
			elseif ($wordy = "MDis")
				getWord $stats $MINE_DISRUPTORS   	($current_word + 1)
			elseif ($wordy = "PsPrb")
				getWord $stats $PSYCHIC_PROBE  		($current_word + 1)
			elseif ($wordy = "PlScn")
				getWord $stats $PLANET_SCANNER  	($current_word + 1)
			elseif ($wordy = "LRS")
				getWord $stats $SCAN_TYPE    		($current_word + 1)
			elseif ($wordy = "Aln")
				getWord $stats $ALIGNMENT    		($current_word + 1)
			elseif ($wordy = "Exp")
				getWord $stats $EXPERIENCE    		($current_word + 1)
			elseif ($wordy = "Corp")
				getWord $stats $CORP   				($current_word + 1)
			elseif ($wordy = "Ship")
				getWord $stats $SHIP_NUMBER   		($current_word + 1)
			end
			add $current_word 1
			getWord $stats $wordy $current_word
		end
	:doneQuikstats
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
		killtrigger prompt5
		killtrigger statlinetrig
		killtrigger getLine2

		stripText $CURRENT_PROMPT "<"
		stripText $CURRENT_PROMPT ">"
return

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