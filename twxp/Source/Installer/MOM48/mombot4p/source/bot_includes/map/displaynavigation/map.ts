:displayNavigation
	setVar $i 1
	setvar $map ""
	setarray $sectors_array 6
	setvar $sectors_array[1] ""
	setvar $sectors_array[2] ""
	setvar $sectors_array[3] ""
	setvar $sectors_array[4] ""
	setvar $sectors_array[5] ""
	setvar $sectors_array[6] ""
	setvar $count 0
	isNumber $test CURRENTSECTOR
	if ($test)
		while (SECTOR.WARPS[CURRENTSECTOR][$i] > 0)
			setvar $map ""
			setVar $ADJ_SEC SECTOR.WARPS[CURRENTSECTOR][$i]
			setVar $containsShieldedPlanet FALSE
			setVar $shieldedPlanets 0
			if ($ADJ_SEC >= 10000)
				setVar $adjust ""
			elseif $ADJ_SEC >= 1000
				setVar $adjust " "
			elseif $ADJ_SEC >= 100
				setVar $adjust "  "
			elseif $ADJ_SEC >= 10
				setVar $adjust "   "
			else
				setVar $adjust "    "
			end
			setVar $map $map&ANSI_13&"* ("&ANSI_10&$i&ANSI_13&")"&ANSI_15&" - "&ANSI_13&"<"&ANSI_14&SECTOR.WARPS[CURRENTSECTOR][$i]&ANSI_13&">"&$adjust&ANSI_15&" Warps: "&ANSI_7&SECTOR.WARPCOUNT[$ADJ_SEC] 
			getSectorParameter $ADJ_SEC "FIGSEC" $isFigged
			getSectorParameter $ADJ_SEC "MSLSEC" $isMSL
			if ($isFigged = "")
				setVar $isFigged FALSE
			end
			if ($isMSL = "")
				setVar $isMSL FALSE
			end
			if (($isFigged) OR (($adjSectorOwner = "belong to your Corp") OR ($adjSectorOwner = "yours")) AND (SECTOR.FIGS.QUANTITY[$ADJ_SEC] > 0))
				setvar $map $map&ANSI_15&" Owner: "&ANSI_14&"   OURS   "
			else
				getWord $adjSectorOwner $alienCheck 1
				if (($ADJ_SEC < 11) OR ($ADJ_SEC = $stardock))
					setvar $map $map&ANSI_15&" Owner: "&ANSI_9&" FEDSPACE " 
				elseif ($ADJ_SEC = $rylos)
					setvar $map $map&ANSI_15&" Owner: "&ANSI_9&"  RYLOS   " 
				elseif ($ADJ_SEC = $alpha_centauri)
					setvar $map $map&ANSI_15&" Owner: "&ANSI_9&"  ALPHA   " 
				elseif ($adjSectorOwner = "Rogue Mercenaries")
					setvar $map $map&ANSI_15&" Owner: "&ANSI_7&"  ROGUE   " 
				elseif ($alienCheck = "the")
					setvar $map $map&ANSI_15&" Owner: "&ANSI_2&"  ALIENS  " 
				elseif ($alienCheck = "The")
					setvar $map $map&ANSI_15&" Owner: "&ANSI_2&"  ALIENS  " 
				elseif (($adjSectorOwner <> "") AND ($adjSectorOwner <> "Unknown"))
					setVar $heads TRUE
					getWord $adjSectorOwner $temp 3
					stripText $temp ","
					upperCase $temp
					getLength $temp $tempLength
					if ($tempLength >= 10)
						cutText $temp $temp 1 10
					else
						while ((10 - $tempLength) > 0)
							if ($heads)
								setVar $temp $temp&" "
								setVar $heads FALSE
							else
								setVar $temp " "&$temp
								setVar $heads TRUE
							end
							getLength $temp $tempLength
						end
					end
					setvar $map $map&ANSI_15&" Owner: "&ANSI_12&$temp
				else
					setvar $map $map&ANSI_15&" Owner: "&ANSI_13&"   NONE   "
				end
			end
			isNumber $isNumber SECTOR.ANOMALY[$ADJ_SEC]
			if ($isNumber)
				if (SECTOR.ANOMALY[$ADJ_SEC])
					setvar $map $map&ANSI_15&" Anom: "&ANSI_11&"Yes"&ANSI_15
				else
					setvar $map $map&ANSI_15&" Anom: "&ANSI_7&" No"&ANSI_15
				end
			else
				setvar $map $map&ANSI_15&" Anom: "&ANSI_7&" ???"&ANSI_15
			end
			setvar $map $map&ANSI_15&"  Dens: "&ANSI_14 
			if (SECTOR.DENSITY[$ADJ_SEC] = "-1")
				setvar $map $map&"???        "
			else
				setVar $dens SECTOR.DENSITY[$ADJ_SEC]
				getLength SECTOR.DENSITY[$ADJ_SEC] $densLength
				if ($densLength >= 9)
					setvar $map $map&"HIGH      "
				else
					setVar $d $densLength
					while ($d <= 10)
						setVar $dens $dens&" "
						add $d 1
					end
					setvar $map $map&$dens
				end
				
			end
			if ($isMSL = TRUE)
				setvar $map $map&ANSI_15&"["&ANSI_14&"MSL"&ANSI_15&"]"&ANSI_7 
			end
			setVar $output ""
			if (PORT.EXISTS[$adj_sec])
				setVar $class PORT.CLASS[$adj_sec]
				setVar $output $output&ANSI_5&"    Port   "&ANSI_14&": "&ANSI_11&PORT.NAME[$adj_sec]&ANSI_14&", "&ANSI_5&"Class "&ANSI_11&$class&" "
				if (($class <> "0") AND ($class <> "9"))
					setVar $output $output&ANSI_5&"("
					if (PORT.BUYFUEL[$adj_sec])
						setVar $output $output&ANSI_2&"B"
					else
						setVar $output $output&ANSI_11&"S"
					end
					if (PORT.BUYORG[$adj_sec])
						setVar $output $output&ANSI_2&"B"
					else
						setVar $output $output&ANSI_11&"S"
					end
					if (PORT.BUYEQUIP[$adj_sec])
						setVar $output $output&ANSI_2&"B"
					else
						setVar $output $output&ANSI_11&"S"
					end
					setVar $output $output&ANSI_5&")"
				end
				setVar $output $output&""
				setvar $map $map&"*    "&$output&""
			end
			if (SECTOR.FIGS.QUANTITY[$adj_sec] > 0)
				setvar $map $map&ANSI_5&"*    Fighters   : "&ANSI_11&SECTOR.FIGS.QUANTITY[$adj_sec]&ANSI_5&" ("&SECTOR.FIGS.OWNER[$adj_sec]&") "&ANSI_6&"["&SECTOR.FIGS.TYPE[$adj_sec]&"]"
			end
			setVar $p 1
			setVar $output "*"
			while ($p <= SECTOR.PLANETCOUNT[$adj_sec])
				setVar $isShielded FALSE
				setVar $temp SECTOR.PLANETS[$adj_sec][$p]
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
				if ($p = 1)
					setVar $temp ANSI_5&"     Planets "&ANSI_14&"  : "&$temp
					setVar $output $output&$temp&""
				else
					setVar $output $output&"                 "&$temp&""
				end
				if ($p < SECTOR.PLANETCOUNT[$adj_sec])
					setVar $output $output&"*"
				end
				add $p 1
			end
			if (SECTOR.PLANETCOUNT[$adj_sec] > 0)
				setvar $map $map&""&$output&""
			end
			setVar $p 1
			if (SECTOR.TRADERCOUNT[$adj_sec] > 0)
				setvar $map $map&ANSI_6&"*        Traders: "&ANSI_7
			end
			while ($p <= SECTOR.TRADERCOUNT[$adj_sec])
				setvar $map $map&"*             "&ANSI_11&SECTOR.TRADERS[$adj_sec][$p]
				add $p 1
			end
			setVar $p 1
			if (SECTOR.SHIPCOUNT[$adj_sec] > 0)
				setvar $map $map&ANSI_6&"*       Ships   : "&ANSI_11&"("&SECTOR.SHIPCOUNT[$adj_sec]&") Empty Ships"
			end
			setVar $sectors_array[$i] $map
			add $count 1
			add $i 1
		end
		setVar $gridWarpCount ($i-1)
	else
		setvar $map $map&ANSI_15&" ERROR WITH CURRENTSECTOR  "&ANSI_7
	end
	setvar $map $sectors_array[1]&"  "&$sectors_array[2]&"  "&$sectors_array[3]&"***"
	setvar $displaySector currentsector
	gosub :displaySector
	setvar $map $map&$output&"*"
	setvar $map $map&$sectors_array[4]&"  "&$sectors_array[5]&"  "&$sectors_array[6]&"*"
return


include "source\bot_includes\map\displaysector\map"