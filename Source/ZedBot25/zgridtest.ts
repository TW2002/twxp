# Edited by Archy (Zed) 14/10/2012 
# To work with Sector parameter FIGSEC  

# heh yeh baby
# hunter in the house
# charge clears nnf dead ends

# lets check for dead ends here first
# need to have them exported to file gamename.dend
# lets get some inputs to start
# check if we can run it from here
cutText CURRENTLINE $location 1 7

if ($location <> "Command")
        clientMessage "This script must be run from the Command Prompt"
        halt
end
setVar $oz_hunter_version "OZ-Hunter 2.0z"


	setVar $hunter_figs 100
	setVar $hunter_turns 100
	setVar $menu_twarp 1
	setVar $hunter_twarp "OFF"
	setVar $menu_area 1
	setVar $hunter_area "File List"
	setVar $menu_dscan 1
	setVar $hunter_dscan "OFF"
	setVar $hunter_level 500
	setVar $planet 0
	


addMenu "" "OZ-Hunter" "OZ-Hunter Settings" "." "" "Main" FALSE
addMenu "OZ-Hunter" "Run" "Run Script." "Z" :Menu_Run "" TRUE
addMenu "OZ-Hunter" "Min Figs" "Min Figs" "F" :Menu_Figs "" FALSE
addMenu "OZ-Hunter" "Min Turns" "Min Turns" "T" :Menu_Turns "" FALSE
addMenu "OZ-Hunter" "Twarp" "Twarp" "W" :Menu_Twarp "" FALSE
addMenu "OZ-Hunter" "Area" "Area" "A" :Menu_Area "" FALSE
addMenu "OZ-Hunter" "D-Scan" "D-Scan" "D" :Menu_Dscan "" FALSE
addMenu "OZ-Hunter" "Density Level" "Density Level" "L" :Menu_Level "" FALSE

setMenuHelp "Run" "This Option Activates the Responder."
setMenuHelp "Min Figs" "This Option Sets the Minimum Figs for Hunter to Stop."
setMenuHelp "Min Turns" "This Option Sets the Minimum Turns for Hunter to Stop."
setMenuHelp "Twarp" "This Option Sets twarp on or off for gridding and autobuys ore."
setMenuHelp "Area" "This Option Sets the area to grid."
setMenuHelp "D-Scan" "This Option Sets the on/off option to use dscan protection"
setMenuHelp "Density Level" "This Option Sets the max density to avoid if d-scan is on."




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
	
:menu_dscan
	add $menu_dscan 1
	if ($menu_dscan = 2)
		setVar $hunter_dscan "ON"
	else
		setVar $menu_dscan 1
		setVar $hunter_dscan "OFF"
	end
	saveVar $hunter_dscan
	saveVar $menu_dscan
	gosub :sub_setMenu
	gosub :ozheader
	openMenu "OZ-Hunter"

:menu_level
	getInput $hunter_level "Enter the minimum density level to avoid"
	echo ANSI_12 "*" $hunter_level "*"
	isNumber $number $hunter_level
		if ($number <> 1)
			echo ANSI_12 "*Invalid Number*"
			goto :Menu_level
		end
	saveVar $hunter_level
	gosub :sub_setMenu
	gosub :ozheader
	openMenu "OZ-Hunter"

:sub_setMenu
	setMenuValue "Min Figs" $hunter_figs
	setMenuValue "Min Turns" $Hunter_turns
	setMenuValue "Twarp" $hunter_twarp
	setMenuValue "Area" $hunter_area
	setMenuValue "D-Scan" $hunter_dscan
	setMenuValue "Density Level" $hunter_level
	return

:menu_run
	# globals
	setVar $fig_num 1
	setVar $fig_type d
	# lets get figgies first
	send "'OZ Hunter - Gridding -*"
	send "'   - Area       = " $hunter_area "*"
	send "'   - DScan      = " $hunter_dscan "*"
	if ($hunter_dscan = "ON")
		send "'   - Max Dens   = " $hunter_level "*"
	end
	send "'   - Min Figs   = " $hunter_figs "*"
	send "'   - Min Turns  = " $hunter_turns "*"
	send "'   - TWarp      = " $hunter_twarp "*"
	
:figrefresh
#--------------------------------------------------------
# Added by Archy 

	SetVar $z 10
	setArray $figlist SECTORS
	setArray $void SECTORS
	While ($z < SECTORS)
		SetVar $z ($z + 1)
		GetSectorParameter $z "FIGSEC" $isfigged
		If ($isfigged = TRUE)
			SetVar $figlist[$z] 1
		End
	End
	Goto :done_fig_array
	
	
	
#--------------------------------------------------------
# Cut out by Archy	
	
	setVar $figfile "_ck_" & GAMENAME & ".figs"
	setVar $read_count 0
	setVar $merge_count 1
:read
	Add $read_count 1
	read $figfile $read[$read_count] $read_count
	if ($read[$read_count] = "EOF")
	goto :done_read
	end
	if ($read_count > 1)
		mergeText $read[1] $read[$read_count] $read[1]
	end
	goto :read

:done_read
:set_fig_array
	setArray $voids SECTORS
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

#--------------------------------------------------------	
	
	
	
:done_fig_array
	send "'OZ Hunter - Fig Array complete...*"
:do_limpets
	if ($hunter_dscan = "ON")
		goto :get_limps
	end
:got_limps
	if ($hunter_dscan = "ON")
		send "'OZ Hunter - Limpet Array complete...*"
	end
	waitFor "Message sent on sub-space channel"
:info_nab
	KillAllTriggers
	gosub :quikstats
	setVar $cursec $quikstats[$h[1]]
	setVar $sd STARDOCK
	gosub :startCNsettings
	gosub :quikstats	



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
		setVar $figlist[$my_sec] 1
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
	setVar $figlist[$charge_sec] 1
	goto :done_charge
	
:gotPath
#	if ($to_count = $parse)
#		goto :done_course
#	end
#	add $from_count 1
#	add $to_count 1
#	goto :WarpPathBuilder



# -=-=-=-=-=-=-=-=- old -=-=-
	send "'Charging " $cursec " --> " $charge_sec "*"
	killalltriggers
	setVar $move_count 0
	
	
:bang_it
	if ($hunter_dscan = "ON")
		send "sd"
	end
	add $move_count 1
	if ($move_count = $plot)
		goto :done_charge
	end
	if ($hunter_dscan = "ON") and ($hunter_level <> 0)
		waitFor "Relative Density Scan"
		waitFor "["&$cursec&"]"
		getSector $warppath[$move_count] $dens_check
		setVar $havesector $warppath[$move_count]

# echo "* hunter dscan " $hunter_dscan "*"
# echo "* sector " $warppath[$move_count] "*"
# echo "* density " $dens_check.density "*"
# echo "* level " $hunter_level "*"

	 	if ($dens_check.density > $hunter_level)
			send "'High Density Detected - Sector " $warppath[$move_count] " - Actual - " $dens_check.density ".*" 
			if ($warppath[$move_count] = $charge_sec)
				send "^s" $warppath[$move_count] "*q"
				setVar $void[$warppath[$move_count]] 1
				if ($de[$charge_sec] = 1)
					setVar $de[$charge_sec] 0
				end
				setVar $figlist[$charge_sec] 1
				goto :done_charge
			end
			send "^s" $warppath[$move_count] "*q"
			setVar $void[$warppath[$move_count]] 1
			if ($de[$charge_sec] = 1)
					setVar $de[$charge_sec] 0
			end
			setVar $figlist[$warppath[$move_count]] 1
			goto :getNav
		elseif ($dens_check.anomoly = "YES") and ($limps[$havesector] = 0)
			send "'Density Anomoly Detected - Sector " $warppath[$move_count] ".*" 
			if ($warppath[$move_count] = $charge_sec)
				send "^s" $warppath[$move_count] "*q"
				setVar $void[$warppath[$move_count]] 1
				if ($de[$charge_sec] = 1)
					setVar $de[$charge_sec] 0
				end
				setVar $figlist[$charge_sec] 1
				goto :done_charge
			end
			send "^s" $warppath[$move_count] "*q"
			setVar $void[$warppath[$move_count]] 1
			if ($de[$charge_sec] = 1)
					setVar $de[$charge_sec] 0
			end
			setVar $figlist[$warppath[$move_count]] 1
			goto :getNav
		end
	end
	send "m" $warppath[$move_count] "*  z  e  a  9955*  z  n  "
	setVar $cursec $warppath[$move_count]
		if ($warppath[$move_count] > 10) and ($warppath[$move_count] <> $sd)
			send "f  z" $fig_num "*  z  c  " $fig_type "  z  n"
			setVar $figList[$cursec] 1
			if ($de[$cursec] = 1)
					setVar $de[$cursec] 0
				end
			subtract $quikstats[$h[4]] $fig_num
		end
		
		goto :bang_it
		
:uhOh
	echo ANSI_12 "**uh-Oh**"
	halt

:done_charge
	send "@"
	waitFor "hundredths"
	waitFor "(?="
	gosub :quikstats
	if ($quikstats[$h[2]] < $hunter_turns)
			goto :low_turns
	end
	if ($quikstats[$h[4]] < $hunter_figs)
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
			if ($figList[$desec] = 0)
				setVar $de[$desec] 1
				add $de_count 1
				goto :get_de
			else
				goto :get_de
			end
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
            if ($breadth_mode = "reverse")
                setVar $lala SECTOR.WARPSIN[$current_sector][$warpnum]
            else
                setVar $lala SECTOR.WARPS[$current_sector][$warpnum]
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
                    if ($figlist[$lala] = 0) and ($lala > 10) and ($lala <> STARDOCK)
                        setVar $jumpfig $lala
			goto :found_nnf
                    end
		elseif ($near = "ux") and ($figlist[$lala] = 0)
			getSector $lala $hunter_sec
			if ($hunter_sec.explored <> "YES")
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
send "'" $quikstats[$h[1]] "=saveme*"
waitfor "just materialized from the void!"
send "l" $planet "*c"
waitfor "<Enter Citadel>"
goto :return_callsaveme

# -=-=-=-=-=-=-=- twarp subroutine -=-=-=-=-=-=-=-=-=-=-=-=-=-
:twarp
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

# -=-=-=-=-=-=- quick stats subroutine -=-=-=-=-=-=-=-=-=-=-=-=
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
	     goto :done_read_again
	end
	goto :chk

:done_read_again
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

# -=-=-=- limp array -=-=-=-=-=--=-
:get_limps
	send "k2"
	setArray $limps SECTORS
	waitFor "============="
:limp_trigger
	setTextLineTrigger limpets :limpets
	pause
	
:limpets
	getWord CURRENTLINE $limpy 1
	getWord CURRENTLINE $nolimps 2
	if ($nolimps = "Active") or ($nolimps = "Limpet")
		killAllTriggers
		goto :got_limps
	end
	isNumber $number $limpy
	if ($number = 1) and ($limpy > 0)
		setVar $limps[$limpy] 1
	end
	goto :limp_trigger

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