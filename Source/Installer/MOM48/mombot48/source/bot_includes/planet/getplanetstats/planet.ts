:getplanetStats
	send "cn"
	waitOn "(2) Animation display"
	getWord CURRENTLINE $ansi_onoff 5
	if ($ansi_onoff = "On")
		send "2qq"
	else
		send "qq"
	end
	setArray $alpha 20
	delete $PLANET_FILE
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
	setVar $totalplanets 0
	setvar $FirstplanetName ""

	setVar $nextpage 1
	send "CJ@?"
	waitOn "Average Interval Lag"
	waitOn "Which planet type are you interested in (?=List)"
	#get planet specifications
	
	:shp_loop
		setTextLineTrigger grab_planet :shp_planetnames "> "
		pause
	:shp_planetnames
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
			goto :shp_getplanetStats
		end
		if ($nextpage = 1)
			setVar $planetName CURRENTLINE
			stripText $planetName "<A> "
			if ($planetName = $FirstplanetName)
				goto :shp_getplanetStats
			end
			setVar $nextpage 0
		end
		add $totalplanets 1
		if ($totalplanets = 1)
			setVar $FirstplanetName CURRENTLINE
			stripText $FirstplanetName "<A> "
		end
		goto :shp_loop
	:shp_getplanetStats
		setVar $planetStatLoop 0
	:shp_planetStats
		while ($planetStatLoop < $totalplanets)
				add $planetStatLoop 1
				add $alphaloop 1
				if ($alphaloop > 17)
					send "+"
					setVar $alphaloop 1
				end
				send $alpha[$alphaloop]
				setTextlineTrigger sn :sn "Planet Category #"
				pause
			:sn
				setVar $line CURRENTLINE
				getWordPos $line $pos "Class"
				#subtract $pos 5
				cutText $line $planet_name $pos 999
				write $planet_file  "50000 50000 50000 50000 50000 50000 0  "&$planet_name
		end
		send "qq"
return
