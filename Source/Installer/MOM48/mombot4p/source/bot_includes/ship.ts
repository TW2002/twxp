#Author: Mind Dagger
#Gets the stats of the ship you are currently in. 
#Needs: Start from Command prompt.

	# ============================  START SHIP VARIABLES ==========================
		setVar $SHIP_OFFENSIVE_ODDS	0
		setVar $SHIP_FIGHTERS_MAX	0
		setVar $SHIP_MAX_ATTACK		0
		setVar $SHIP_MINES_MAX		0
        setVar $SHIP_SHIELD_MAX     0
	# ============================   END SHIP VARIABLES  ==========================

:getShipStats
	send "c;q"
	setTextLineTrigger	getshipoffense		:shipoffenseodds	"Offensive Odds: "
	setTextLineTrigger	getshipfighters 	:shipmaxfigsperattack	" TransWarp Drive:   "
	setTextLineTrigger getshipmines        :shipmaxmines       " Mine Max:  "
    setTextLineTrigger  getshipgenesis        :shipmaxgenesis       " Genesis Max:  "
    setTextLineTrigger  getshipshields      :shipmaxshields     "Maximum Shields:"
    pause
	
    :shipmaxshields
        setVar $shield_line CURRENTLINE
        replaceText $shield_line ":" "  "
        replaceText $shield_line "," ""
        getWord $shield_line $SHIP_SHIELD_MAX 10
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

    :shipmaxgenesis
        getText CURRENTLINE $SHIP_GENESIS_MAX "Genesis Max:" "Long Range Scan:"
        stripText $SHIP_GENESIS_MAX " "
        pause
	
	:shipmaxfigsperattack
		getWordPos CURRENTANSILINE $pos "[0m[32m Max Figs Per Attack[1;33m:[36m"
		if ($pos > 0)
			getText CURRENTANSILINE $SHIP_MAX_ATTACK "[0m[32m Max Figs Per Attack[1;33m:[36m" "[0;32mTransWarp"
			striptext $SHIP_MAX_ATTACK " "
		end	
return

#============================= LOAD SHIP CATALOG DATA ========================================
:loadShipInfo
    setVar $shipcounter 1
    :count_the_ships
    loadvar $cap_file
    fileExists $exists $cap_file
    if ($exists)
        read $cap_file $shipInf $shipcounter
        if ($shipInf <> "EOF")
            add $shipCounter 1
            goto :count_the_ships
        end
        setArray $shipList $shipCounter 9
        setVar $shipcounter 1
        :readshiplist
        read $cap_file $shipInf $shipcounter
        if ($shipInf <> "EOF")
            gosub :process_ship_line
            setVar $ship[$ShipName] $SHIELDS & " " & $defodd
            setVar $shipList[$shipcounter] $ShipName
            setVar $shipList[$shipcounter][1] $SHIELDS
            setVar $shipList[$shipcounter][2] $defodd
            setVar $shipList[$shipcounter][3] $off_odds
            setVar $shipList[$shipcounter][4] $max_holds
            setVar $shipList[$shipcounter][5] $max_fighters
            setVar $shipList[$shipcounter][6] $init_holds
            setVar $shipList[$shipcounter][7] $tpw
            setVar $shipList[$shipcounter][8] $isDefender
            setVar $shipList[$shipcounter][9] $ship_cost
            add $shipcounter 1
            goto :readshiplist
        end
        setVar $shipStats TRUE
    end
return
:getShipCapStats
    send "cn"
    waitOn "(2) Animation display"
    getWord CURRENTLINE $ansi_onoff 5
    if ($ansi_onoff = "On")
        send "2qq"
    else
        send "qq"
    end
    setArray $alpha 20
    delete $CAP_FILE
    setVar $alpha[1] "A"
    setVar $alpha[2] "B"
    setVar $alpha[3] "C"
    setVar $alpha[4] "D"
    setVar $alpha[5] "E"
    setVar $alpha[6] "F"
    setVar $alpha[7] "G"
    setVar $alpha[8] "H"
    setVar $alpha[9] "I"
    setVar $alpha[10] "J"
    setVar $alpha[11] "K"
    setVar $alpha[12] "L"
    setVar $alpha[13] "M"
    setVar $alpha[14] "N"
    setVar $alpha[15] "O"
    setVar $alpha[16] "P"
    setVar $alpha[17] "R"
    setVar $alphaloop 0
    setVar $totalships 0
    setvar $FirstshipName ""
    setVar $nextpage 1
    send "CC@?"
    waitOn "Average Interval Lag"
    #get ship specifications
    :shp_loop
        setTextLineTrigger grab_ship :shp_shipnames "> "
        pause
    :shp_shipnames
        if (CURRENTLINE = "")
            goto :shp_loop
        end
        getWord CURRENTLINE $stopper 1
        if ($stopper = "<+>")
            send "+"
            waitOn "(?=List) ?"
            setVar $nextpage 1
            goto :shp_loop
        elseif ($stopper = "<Q>")
            goto :shp_getShipStats
        end
        if ($nextpage = 1)
            setVar $shipName CURRENTLINE
            stripText $shipName "<A> "
            if ($shipName = $FirstshipName)
                goto :shp_getShipStats
            end
            setVar $nextpage 0
        end
        add $totalships 1
        if ($totalships = 1)
            setVar $FirstshipName CURRENTLINE
            stripText $FirstshipName "<A> "
        end
        goto :shp_loop
    :shp_getShipStats
        setVar $shipStatLoop 0
    :shp_shipStats
        while ($shipStatLoop < $totalships)
                add $shipStatLoop 1
                add $alphaloop 1
                if ($alphaloop > 17)
                    send "+"
                    setVar $alphaloop 1
                end
                send $alpha[$alphaloop]
                setTextlineTrigger sn :sn "Ship Class :"
                pause
            :sn
                setVar $line CURRENTLINE
                getWordPos $line $pos ":"
                add $pos 2
                cutText $line $ship_Name $pos 999
                setTextLineTrigger hc :hc "Basic Hold Cost:"
                pause
            :hc
                setVar $line CURRENTLINE
                stripText $line "Basic Hold Cost:"
                stripText $line "Initial Holds:"
                stripText $line "Maximum Shields:"
                getWord $line $init_holds 2
                getWord $line $max_Shields 3
                stripText $max_Shields ","
                setTextLineTrigger oo :oo2 "Offensive Odds:"
                pause
            :oo2
                setVar $line CURRENTLINE
                stripText $line "Main Drive Cost:"
                stripText $line "Max Fighters:"
                stripText $line "Offensive Odds:"
                getWord $line $max_figs 2
                getWord $line $off_odds 3
                stripText $max_figs ","
                stripText $off_odds ":1"
                stripText $off_odds "."
                setTextLineTrigger do :do "Defensive Odds:"
                pause
            :do
                setVar $line CURRENTLINE
                stripText $line "Computer Cost:"
                stripText $line "Turns Per Warp:"
                stripText $line "Defensive Odds:"
                getWord $line $def_odds 3
                stripText $def_odds ":1"
                stripText $def_odds "."
                getWord $line $tpw 2
                setTextLIneTrigger sc :sc "Ship Base Cost:"
                pause
            :sc
                setVar $line CURRENTLINE
                stripText $line "Ship Base Cost:"
                getWord $line $cost 1
                stripText $cost ","
                getLength $cost $costLen
                if ($costLen = 7)
                    add $cost 10000000
                end
                setTextLineTrigger mh :mh "Maximum Holds:"
                pause
            :mh
                setVar $line CURRENTLINE
                stripText $line "Maximum Holds:"
                getWord $line $max_holds 1
                setVar $isDefender FALSE
                write $cap_file $max_shields & " " & $def_odds & " " & $off_odds & " " & $cost & " " & $max_holds & " " & $max_figs & " " & $init_holds & " " & $tpw & " " & $isDefender & " " & $ship_name
        end
        send "qq"
return

:save_the_ship

    setVar $shipcounter 1
    :_readshiplist
    loadvar $cap_file
    read $cap_file $shipInf $shipcounter
    if ($shipInf <> "EOF")
        gosub :process_ship_line
        setVar $database $database&"^^^^^^"&$ShipName&"^^^^^^"
        add $shipcounter 1
        goto :_readshiplist
    end
    send "c"
    Waiton "Computer command"
    send ";"
    :_keeplookingshipname
        killalltriggers
        setTextLineTrigger checkingForShipName :_checkshipname 
        pause
    :_checkshipname
        if (CURRENTLINE = "")
            goto :_keeplookingshipname
        else
            setVar $current_line CURRENTLINE
            getWord $current_line $temp 1
            cutText $temp $frontletter 1 1
            getText $current_line $ship_Name $frontletter "          "
            setVar $ship_name $frontletter&$ship_name
            getWordPos $database $pos "^^^^^^"&$Ship_Name&"^^^^^^"
            if ($pos > 0)
                send "'{" $SWITCHBOARD~bot_name "} - This ship is already stored in bot file.*"
                return
            end
        end
    :_sn
        setTextLineTrigger hc :_hc "Basic Hold Cost:"
        pause
    :_hc
        setVar $line CURRENTLINE
        stripText $line "Basic Hold Cost:"
        stripText $line "Initial Holds:"
        stripText $line "Maximum Shields:"
        getWord $line $init_holds 2
        getWord $line $max_Shields 3
        stripText $max_Shields ","
        setTextLineTrigger oo :_oo2 "Offensive Odds:"
        pause
    :_oo2
        setVar $line CURRENTLINE
        stripText $line "Main Drive Cost:"
        stripText $line "Max Fighters:"
        stripText $line "Offensive Odds:"
        getWord $line $max_figs 2
        getWord $line $off_odds 3
        stripText $max_figs ","
        stripText $off_odds ":1"
        stripText $off_odds "."
        setTextLineTrigger do :_do "Defensive Odds:"
        pause
    :_do
        setVar $line CURRENTLINE
        stripText $line "Computer Cost:"
        stripText $line "Turns Per Warp:"
        stripText $line "Defensive Odds:"
        getWord $line $def_odds 3
        stripText $def_odds ":1"
        stripText $def_odds "."
        getWord $line $tpw 2
        setTextLIneTrigger sc :_sc "Ship Base Cost:"
        pause
    :_sc
        setVar $line CURRENTLINE
        stripText $line "Ship Base Cost:"
        getWord $line $cost 1
        stripText $cost ","
        getLength $cost $costLen
        if ($costLen = 7)
            add $cost 10000000
        end
        setTextLineTrigger mh :_mh "Maximum Holds:"
        pause
    :_mh
        setVar $line CURRENTLINE
        stripText $line "Maximum Holds:"
        getWord $line $max_holds 1
        setVar $isDefender FALSE
        write $cap_file $max_shields & " " & $def_odds & " " & $off_odds & " " & $cost & " " & $max_holds & " " & $max_figs & " " & $init_holds & " " & $tpw & " " & $isDefender & " " & $ship_name
        send "'{" $SWITCHBOARD~bot_name "} - "&$ship_name&" added to bot's ship file.*"
        send "q"
        gosub :loadShipInfo
return

:process_ship_line
        getWord $shipInf $SHIELDS 1
        getLength $SHIELDS $shieldlen
        getWord $shipInf $defodd 2
        getLength $defodd $defoddlen
        getWord $shipinf $off_odds 3
        getLength $off_odds $filler1len
        getWord $shipinf $ship_cost 4
        getLength $ship_cost $filler2len
        getWord $shipinf $max_holds 5
        getLength $max_holds $filler3len
        getWord $shipinf $max_fighters 6
        getLength $max_fighters $filler4len
        getWord $shipinf $init_holds 7
        getLength $init_holds $filler5len
        getWord $shipinf $tpw 8
        getLength $tpw $filler6len
        getWord $shipinf $isDefender 9
        getLength $isDefender $filler7len
        setVar $startlen ($shieldlen + $defoddlen + $filler1len + $filler2len + $filler3len + $filler4len + $filler5len + $filler6len + $filler7len + 10)
        cutText $shipinf $ShipName $startlen 999
return
#=====================================END LOAD SHIP CATALOG INFO ======================================
