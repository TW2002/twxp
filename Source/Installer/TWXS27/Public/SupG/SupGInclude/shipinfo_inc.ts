###################################################
:shipInfo
send "cn"
waitfor "(2) Animation display"
getWord CURRENTLINE $ansi_onoff 5

if ($ansi_onoff = "On")
	send "2qq"
else
	send "qq"
end
setVar $cap_file GAMENAME & "_SHIPS.txt"
delete $cap_file
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
setVar $nextpage 1
send "CC?"
waitfor "(?=List) ?"
#get ship specifications
:shp_loop
setTextLineTrigger grab_ship :shp_shipnames
pause

:shp_shipnames
if (CURRENTLINE = "")
	goto :shp_loop
end
getWord CURRENTLINE $stopper 1
if ($stopper = "<+>")
	send "+"
	waitFor "(?=List) ?"
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
if ($shipStatLoop < $totalships)
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
	
	setTextLineTrigger oo :oo "Offensive Odds:"
	pause
	
	:oo		
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

	write $cap_file $max_shields & " " & $def_odds & " " & $off_odds & " " & $cost & " " & $max_holds & " " & $max_figs & " " & $init_holds & " " & $tpw & " " & $ship_name
	goto :shp_shipStats
	
end
send "qq"
return


#########################################
:furbFinder
setVar $cap_file GAMENAME & "_SHIPS.txt"
fileExists $exists $cap_file
if ($exists = 0)
	:ff_question
	ECHO ANSI_15 "*Unable to determine furb ship, you don't have a ship stats file. Create one now?*[y/n]"
	getConsoleInput $mkshpsts singlekey
	lowercase $mkshpsts
	if ($mkshpsts = "y")
		gosub :shipInfo
	elseif ($mkshpsts = "n")
		setVar $bestShip "-1"
		return
	else
		goto :ff_question
	end
end


setVar $bestCost 999999999
setVar $bestFakeCost 99999999
:loadShipInfo
setVar $shipcounter 1
:readshiplist
read $cap_file $shipInf $shipcounter
if ($shipInf <> "EOF")
	getWord $shipInf $shields 1
	getLength $shields $shieldlen
	
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

	setVar $startlen ($shieldlen + $defoddlen + $filler1len + $filler2len + $filler3len + $filler4len + $filler5len + $filler6len + 9)
	cutText $shipinf $ShipName $startlen 999
	
	if ($max_holds >= 147)
		setVar $buyto 147
		gosub :getHoldCost
		add $totalcost $ship_cost
		setVar $totalcost ($totalcost + (6500 * $tpw))
		if ($totalcost < $bestFakeCost)
			setVar $bestFakeShip $shipName
			setVar $bestFakeCost $totalcost
			setVar $bestFakeStartHolds $init_holds
			setVar $bestFakeTPW $tpw
		end
	end
	if ($max_holds >= 63)
		setVar $buyto 63
		gosub :getHoldCost
		add $totalcost $ship_cost
		setVar $totalcost ($totalcost + (6500 * $tpw))
		if ($totalcost < $bestCost)
			setVar $bestShip $shipName
			setVar $bestCost $totalcost
			setVar $bestStartHolds $init_holds
			setVar $bestTPW $tpw
		end
	end
	add $shipcounter 1
	goto :readshiplist
end

return

:getHoldCost
setVar $start 1
setVAr $firstHoldCost 265
:startcost
if ($start < $init_holds)
	add $firstHoldCost 20
	add $start 1
	goto :startcost
end
setVar $holdCost $firstHoldCost
setVar $totalCost $holdCost
setVar $looper ($init_holds + 1)
:totalCost
if ($looper < $buyto)
	add $holdCost 20
	add $totalCost $holdCost
	add $looper 1
	goto :totalCost
end
return

#############################