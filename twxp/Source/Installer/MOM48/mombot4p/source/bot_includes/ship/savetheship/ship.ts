:savetheship

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
				setvar $switchboard~message "This ship is already stored in bot file.*"
				gosub :switchboard~switchboard
				send "q "
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
		setvar $switchboard~message $ship_name&" added to bot's ship file.*"
		gosub :switchboard~switchboard
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
