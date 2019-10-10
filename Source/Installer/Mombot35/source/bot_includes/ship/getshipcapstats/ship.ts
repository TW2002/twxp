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
