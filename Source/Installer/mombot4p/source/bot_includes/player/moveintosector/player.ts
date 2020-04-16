:moveIntoSector
	setVar $result ""
	setVar $dropFigs TRUE
	setVar $result $result&"m "&$moveIntoSector&"*"
	if (($moveIntoSector > 10) AND ($moveIntoSector <> $map~stardock))
		if ($fighters > $ship~ship_max_attack)
			setVar $result $result&"za"&$ship~ship_max_attack&"* * "
		else
			setVar $result $result&"za"&$fighters&"* * "
		end
	end
	if ($surroundFigs <= 0)
		setvar $surroundFigs 1
	end
	if (($moveIntoSector > 10) AND ($moveIntoSector <> $map~stardock))
		if ($surroundFigs > 0)
			setVar $result $result&"f  z  "&$surroundFigs&"* z  c  d  *  "
		end
		if ($surroundlimp > 0)
			setVar $result $result&"  H  2  Z  "&$surroundLimp&"*  Z C  *  "
		end
		if ($surroundmine > 0)
			setVar $Result $result&"  H  1  Z  "&$surroundMine&"*  Z C  *  "
		end
	end
	send $result
return

