:loadplanetInfo
	setVar $planetcounter 1
	loadvar $planet_file
	fileExists $exists $planet_file
	:count_the_planets
	if ($exists)
		setVar $i 1
		readToArray $planet_file $planet_array
		setArray $planetList $planet_array 7
		while ($i <= $planet_array)
			setVar $planetInf $planet_array[$i]
			gosub :process_planet_line
			setVar $planetList[$i] $planetName
			setVar $planetList[$i][1] $PLANET_FUEL_COLONISTS_MIN
			setVar $planetList[$i][2] $PLANET_FUEL_COLONISTS_MAX
			setVar $planetList[$i][3] $PLANET_ORG_COLONISTS_MIN
			setVar $planetList[$i][4] $PLANET_ORG_COLONISTS_MAX
			setVar $planetList[$i][5] $PLANET_EQUIP_COLONISTS_MIN
			setVar $planetList[$i][6] $PLANET_EQUIP_COLONISTS_MAX
			setVar $planetList[$i][7] $PLANET_IS_KEEPER
			add $i 1
		end
		setVar $planetcounter $planet_array
		setVar $planetStats TRUE
	else
		echo "*No Planet File Found!*"
	end
return

:process_planet_line
		getWord $planetInf $PLANET_FUEL_COLONISTS_MIN 1
		getLength $PLANET_FUEL_COLONISTS_MIN $length1
		getWord $planetInf $PLANET_FUEL_COLONISTS_MAX 2
		getLength $PLANET_FUEL_COLONISTS_MAX $length2
		getWord $planetInf $PLANET_ORG_COLONISTS_MIN 3
		getLength $PLANET_ORG_COLONISTS_MIN $length3
		getWord $planetInf $PLANET_ORG_COLONISTS_MAX 4
		getLength $PLANET_ORG_COLONISTS_MAX $length4
		getWord $planetInf $PLANET_EQUIP_COLONISTS_MIN 5
		getLength $PLANET_EQUIP_COLONISTS_MIN $length5
		getWord $planetInf $PLANET_EQUIP_COLONISTS_MAX 6
		getLength $PLANET_EQUIP_COLONISTS_MAX $length6
		getWord $planetInf $PLANET_IS_KEEPER 7
		getLength $PLANET_IS_KEEPER $length7
		setVar $startlen ($length1 + $length2 + $length3 + $length4 + $length5 + $length6 + $length7 + 7)
		getLength $planetInf $length_planet_name
		if ($startlen < $length_planet_name)
			cutText $planetInf $planetname $startlen 999
		else
			echo "*"&$planetInf&" error during processing planets.*"
		end
return