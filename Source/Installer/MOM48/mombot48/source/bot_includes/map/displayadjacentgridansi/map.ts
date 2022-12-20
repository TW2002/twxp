#0 = Empty Sector, Anomaly YES = Cloaked Ship
#1 = Marker Beacon
#2 = Limpet Mine, Anomaly YES
#5 = Single Fighter
#10 = Single Armid Mine
#21 = Navigational Hazard (per 1 percent)
#38 = Unmanned Ship
#40 = Manned Ship - Trader, Alien, or Ferrengi Assault Trader
#50 = Destroyed Starport
#77 = Ferrengi Scorpion Ship
#100 = Starport, Ferrengi Battle Cruiser or Ferrengi Dreadnaught
#462 = Federation Starship under Admiral Nelson
#489 = Federation Starship under Captain Zyrain
#500 = Planet
#512 = Federation Starship under Admiral Clausewitz






:displayAdjacentGridAnsi
setvar $marker_beacon 1
setvar $limpet_mine 2
setvar $armid_mine 10
setvar $fighter 5
setvar $hazard 21
setvar $unmanned_ship 38
setvar $manned_ship 40
setvar $destroyed_port 50
setvar $port 100
setvar $planet 500

	setVar $i 1
	if (CURRENTSECTOR = 0)
		gosub :player~quikstats
	end
	isNumber $test CURRENTSECTOR
	if ($test)
		echo "**" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"        
		while (SECTOR.WARPS[CURRENTSECTOR][$i] > 0)
			setVar $ADJ_SEC SECTOR.WARPS[CURRENTSECTOR][$i]
			setvar $isaliens false
			setVar $adjSectorOwner SECTOR.FIGS.OWNER[$ADJ_SEC]
			setvar $adjLimpOwner SECTOR.LIMPETS.OWNER[$adj_sec]
			setvar $adjMineOwner SECTOR.MINES.OWNER[$adj_sec]

			getSectorParameter $adj_sec "FIGSEC" $isFigged
			getSectorParameter $adj_sec "LIMPSEC" $isLimped
			if ($isFigged <> true)
				setvar $isFigged false
			end
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

		   
			gosub :formatsectorowner
			echo ANSI_13 "* (" ANSI_10 $i ANSI_13 ")" ANSI_15 " - " ANSI_13 "<" $color $ADJ_SEC ANSI_13 ">" $adjust ANSI_5 
			echo " " ansi_15 "["

		   
			echo $color $temp

			echo ansi_15 "]"


			echo "   Warps" ANSI_14 ": " ANSI_14  SECTOR.WARPCOUNT[$ADJ_SEC] "   "
			getSectorParameter $ADJ_SEC "FIGSEC" $isFigged
			getSectorParameter $ADJ_SEC "MSLSEC" $isMSL
			getSectorParameter $ADJ_SEC "BUBBLE" $isBubble
			if ($isFigged = "")
				setVar $isFigged FALSE
			end
			if ($isMSL = "")
				setVar $isMSL FALSE
			end
			isNumber $isNumber SECTOR.ANOMALY[$ADJ_SEC]
			if ($isNumber)
				if (SECTOR.ANOMALY[$ADJ_SEC])
					echo ANSI_15 " Anom: " ANSI_11 "Yes" ANSI_15
				else
					echo ANSI_15 " Anom: " ANSI_7 " No" ANSI_15
				end
			else
				echo ANSI_15 " Anom: " ANSI_7 " ???" ANSI_15
			end
			echo ANSI_15 "  Dens: " ANSI_14 
			if (SECTOR.DENSITY[$ADJ_SEC] = "-1")
				echo "???        "
			else
				setvar $calculated_density 0
				setvar $calculated_density ($calculated_density + ((SECTOR.figs.quantity[$ADJ_SEC]) * ($fighter))) 
				setvar $calculated_density ($calculated_density + ((SECTOR.MINES.QUANTITY[$ADJ_SEC] * $armid_mine))) 
				setvar $calculated_density ($calculated_density + ((SECTOR.LIMPETS.QUANTITY[$ADJ_SEC] * $limpet_mine))) 
				setvar $calculated_density ($calculated_density + ((SECTOR.NAVHAZ[$ADJ_SEC] * $hazard)))
				if (SECTOR.BEACON[$i] <> "")
					setvar $calculated_density ($calculated_density + $marker_beacon) 
				end
				if (PORT.EXISTS[$ADJ_SEC])
					setvar $calculated_density ($calculated_density + $port) 
				end
				setvar $calculated_density ($calculated_density + (((SECTOR.planetcount[$ADJ_SEC]) * $planet)))
				setvar $calculated_density ($calculated_density + (((SECTOR.tradercount[$ADJ_SEC]) * $manned_ship)))
				setvar $calculated_density ($calculated_density + (((SECTOR.shipcount[$ADJ_SEC]) * $unmanned_ship)))
				setVar $dens SECTOR.DENSITY[$ADJ_SEC]
				getLength SECTOR.DENSITY[$ADJ_SEC] $densLength
				
				if ($densLength >= 9)
					echo "HIGH      "
				else
					#setVar $d $densLength
					#while ($d <= 10)
					#    setVar $dens $dens&" "
					#    add $d 1
					#end
					echo $dens
				end
				if ($calculated_density < $dens)
					if (($isLimped <> true) and (SECTOR.ANOMOLY[$ADJ_SEC] = true) and ((($adjLimpOwner <> "belong to your Corp") AND ($adjLimpOwner <> "yours")) AND (SECTOR.LIMPETS.QUANTITY[$ADJ_SEC] <= 0)))
						setvar $possible_limpets (($dens-$calculated_density)/2)
						if ($possible_limpets <= 0)
							setvar $possible_limpets 1
						end
						echo ansi_3 " [" ansi_12  $possible_limpets " Enemy Limpets Detected" ansi_3 "]"
					end
				elseif ($calculated_density = $dens)
					if ($SECTOR.ANOMOLY[$ADJ_SEC] = true)
						echo ansi_3 " /\/\" ansi_12 "Cloaked Ship Detected" ansi_3 "\/\/"
					end
				else
					#echo ansi_3 " [" ansi_12 "Odd Density Detected" ansi_3 "]"
				end
				
			end
			if ($isMSL = TRUE)
				echo ANSI_15 " [" ANSI_14 "MSL" ANSI_15 "]" ANSI_7 
			end
			if ($isBubble = true)
				echo ANSI_15 " [" ANSI_10 "BUBBLE" ANSI_15 "]" ANSI_7 
			end
			setVar $output ""
			if (PORT.EXISTS[$adj_sec])
				setVar $class PORT.CLASS[$adj_sec]
				setVar $output $output&ANSI_5&"           Port"&ANSI_14&"    : "&ANSI_11&PORT.NAME[$adj_sec]&ANSI_14&", "&ANSI_5&"Class "&ANSI_11&$class&" "
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
				echo "*    "&$output&""
			end
			if (SECTOR.FIGS.QUANTITY[$adj_sec] > 0)
				setvar $fig_count SECTOR.FIGS.QUANTITY[$adj_sec]

				if ((SECTOR.FIGS.OWNER[$adj_sec] = "belong to your Corp") or (SECTOR.FIGS.OWNER[$adj_sec] = "yours"))
					setvar $fig_owner ansi_11&"("&ansi_3&SECTOR.FIGS.OWNER[$adj_sec]&ansi_11&") "&ansi_6&"["&SECTOR.FIGS.TYPE[$adj_sec]&"]"
					setvar $fighter_color ansi_14
				elseif ($isaliens = true)
					setvar $fig_owner ansi_10&"("&ansi_2&SECTOR.FIGS.OWNER[$adj_sec]&ansi_10&") "&ansi_6&"["&SECTOR.FIGS.TYPE[$adj_sec]&"]"
					setvar $fighter_color ansi_10
				else
					if ($isFigged <> true)
						setvar $fig_owner ansi_12&"("&ansi_4&SECTOR.FIGS.OWNER[$adj_sec]&ansi_12&") "&ansi_6&"["&SECTOR.FIGS.TYPE[$adj_sec]&"]"
						setvar $fighter_color ansi_12
					else
						setvar $fig_owner ansi_11&"("&ansi_3&"Database hasn't updated yet."&ansi_11&") "
						setvar $fighter_color ansi_14                    
					end
				end
				setvar $value $fig_count
				gosub :commas
				setvar $fig_count $value
				echo ANSI_5&"*               Fighters"&ANSI_14&": "&$fighter_color&$fig_count&ANSI_5&" "&$fig_owner

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
					setVar $temp ANSI_5&"               Planets "&ANSI_14&": "&$temp
					setVar $output $output&$temp&""
				else
					setVar $output $output&"                         "&$temp&""
				end
				if ($p < SECTOR.PLANETCOUNT[$adj_sec])
					setVar $output $output&"*"
				end
				add $p 1
			end
			if (SECTOR.PLANETCOUNT[$adj_sec] > 0)
				echo ""&$output&""
			end
			setVar $p 1
			if (SECTOR.TRADERCOUNT[$adj_sec] > 0)
				echo ANSI_6 "*               Traders" ansi_15 " : "&ANSI_7
			end
			while ($p <= SECTOR.TRADERCOUNT[$adj_sec])
				echo "*                         "&ANSI_11&SECTOR.TRADERS[$adj_sec][$p]
				add $p 1
			end
			setVar $p 1
			if (SECTOR.SHIPCOUNT[$adj_sec] > 0)
				echo ANSI_5 "*               Ships   " ansi_15 ": "&ANSI_11&"("&SECTOR.SHIPCOUNT[$adj_sec]&") Empty Ships"
			end
			add $i 1
		end
		setVar $gridWarpCount ($i-1)
	else
		echo ANSI_15 " ERROR WITH CURRENTSECTOR  " ANSI_7
	end
	echo "**" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 
	echo "**" CURRENTANSILINE
return

include "source\bot_includes\map\formatsectorowner\map"
include "source\bot_includes\map\commas\map"
