
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