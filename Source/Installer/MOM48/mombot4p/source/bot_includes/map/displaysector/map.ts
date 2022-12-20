:displaySector
	setVar $i $displaySector
	setVar $output ANSI_10&"    Sector  "&ANSI_14&": "&ANSI_11&$i&ANSI_2&" in "
	setVar $constellation SECTOR.CONSTELLATION[$i]
	if ($constellation = "The Federation.")
		setVar $output $output&ANSI_10&$constellation&"*"
	else
		setVar $output $output&ANSI_1&$constellation&"*"
	end
	if (SECTOR.BEACON[$i] <> "")
		setVar $output $output&ANSI_5&"    Beacon  "&ANSI_14&": "&ANSI_12&SECTOR.BEACON[$i]&"*"
	end
	if (PORT.EXISTS[$i])
		setVar $class PORT.CLASS[$i]
		setVar $output $output&ANSI_5&"    Ports   "&ANSI_14&": "&ANSI_11&PORT.NAME[$i]&ANSI_14&", "&ANSI_5&"Class "&ANSI_11&$class&" "
		if (($class <> "0") AND ($class <> "9"))
			setVar $output $output&ANSI_5&"("
			if (PORT.BUYFUEL[$i])
				setVar $output $output&ANSI_2&"B"
			else
				setVar $output $output&ANSI_11&"S"
			end
			if (PORT.BUYORG[$i])
				setVar $output $output&ANSI_2&"B"
			else
				setVar $output $output&ANSI_11&"S"
			end
			if (PORT.BUYEQUIP[$i])
				setVar $output $output&ANSI_2&"B"
			else
				setVar $output $output&ANSI_11&"S"
			end
			setVar $output $output&ANSI_5&")"
		end
		setVar $output $output&"*"
	end
	setVar $j 1
	while ($j <= SECTOR.PLANETCOUNT[$i])
		setVar $isShielded FALSE
		setVar $temp SECTOR.PLANETS[$i][$j]
		getWord $temp $test 1
		if ($test = "<<<<")
			setVar $isShielded TRUE
		end
		getWord $temp $type 2
		stripText $type "("
		stripText $type ")"
		if ($isShielded)
			getLength $temp $length
			cutText $temp $temp 1 ($length-15)
			cutText $temp $temp 10 9999
			setVar $temp ANSI_12&"<<<< "&ANSI_10&"("&ANSI_14&$type&ANSI_10&") "&ANSI_1&$temp&ANSI_12&" >>>> "&ANSI_2&"(Shielded)"
		else
			setVar $temp ANSI_2&$temp
		end
		if ($j = 1)
			setVar $temp ANSI_5&"    Planets "&ANSI_14&": "&$temp
			setVar $output $output&$temp&"*"
		else
			setVar $output $output&"              "&$temp&"*"
		end
		add $j 1
	end
	setVar $j 1
	while ($j <= SECTOR.TRADERCOUNT[$i])
		setVar $temp SECTOR.TRADERS[$i][$j]
		setVar $temp ANSI_2&$temp
		if ($j = 1)
			setVar $temp ANSI_5&"    Traders "&ANSI_14&": "&$temp
			setVar $output $output&$temp&"*"
		else
			setVar $output $output&"              "&$temp&"*"
		end
		add $j 1
	end
	setVar $j 1
	while ($j <= SECTOR.SHIPCOUNT[$i])
		setVar $temp SECTOR.SHIPS[$i][$j]
		setVar $temp ANSI_2&$temp
		if ($j = 1)
			setVar $temp ANSI_5&"      Ships "&ANSI_14&": "&$temp
			setVar $output $output&$temp&"*"
		else
			setVar $output $output&"              "&$temp&"*"
		end
		add $j 1
	end
	if (SECTOR.FIGS.QUANTITY[$i] > 0)
		setVar $output $output&ANSI_5&"    Fighters"&ANSI_14&": "&ANSI_11&SECTOR.FIGS.QUANTITY[$i]&ANSI_5&" ("&SECTOR.FIGS.OWNER[$i]&") "&ANSI_6&"["&SECTOR.FIGS.TYPE[$i]&"]*"
	end
	setVar $output $output&ANSI_10&"    Warps to sector(s) "&ANSI_14&":  "
	setVar $k 1
	while (SECTOR.WARPS[$i][$k] > 0)
		if ($k <> 1)
			setVar $output $output&ANSI_2&" - "
		end
		getSectorParameter SECTOR.WARPS[$i][$k] "FIGSEC" $check
		if ($check = true)
			setVar $output $output&ANSI_11&"["&SECTOR.WARPS[$i][$k]&"]"
		else
			setVar $output $output&ANSI_11&SECTOR.WARPS[$i][$k]
		end
		add $k 1
	end
	setVar $k 1
	while (SECTOR.BACKDOORS[$i][$k] > 0)
		if ($k <> 1)
			setVar $output $output&ANSI_2&" - "
		else
			setVar $output $output&ANSI_12&"*    Backdoor from sector(s) "&ANSI_14&":  "
		end
		setVar $output $output&ANSI_11&SECTOR.BACKDOORS[$i][$k]
		add $k 1
	end
	setVar $output $output&"*"
return