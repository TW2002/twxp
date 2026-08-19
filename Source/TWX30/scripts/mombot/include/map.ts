# GETSTARDOCK routine by Shadow
:map~getstardock
killalltriggers
if (stardock > 11)
	setvar $map~stardock stardock
	savevar $map~stardock
	return
else
	gosub :player~currentprompt
	if ($player~current_prompt = "Command")
		setvar $gsd_sec 0
		send "nq"

		:gsd_loop
		settextlinetrigger gsd_sector :gsd_sector "Sector  :"
		settextlinetrigger gsd_dock :gsd_dock "Stargate Alpha I, Class 9"
		settextlinetrigger gsd_end :gsd_end "Choose NavPoint"
		pause

		:gsd_sector
		killalltriggers
		getword currentline $gsd_sec 4
		goto :gsd_loop

		:gsd_dock
		killalltriggers
		if ($gsd_sec > 11)
			setvar $map~stardock $gsd_sec
			savevar $map~stardock
		end
	end
end

:gsd_end
killalltriggers
return

:map~commas
if ($map~value < 1000)

elseif ($map~value < 1000000)
	getlength $map~value $map~len
	setvar $map~len ($map~len - 3)
	cuttext $map~value $map~tmp 1 $map~len
	cuttext $map~value $map~tmp1 ($map~len + 1) 999
	setvar $map~tmp $map~tmp&","&$map~tmp1
	setvar $map~value $map~tmp
elseif ($map~value <= 999999999)
	getlength $map~value $map~len
	setvar $map~len ($map~len - 6)
	cuttext $map~value $map~tmp 1 $map~len
	setvar $map~tmp $map~tmp&","
	cuttext $map~value $map~tmp1 ($map~len + 1) 3
	setvar $map~tmp $map~tmp&$map~tmp1&","
	cuttext $map~value $map~tmp1 ($map~len + 4) 999
	setvar $map~tmp $map~tmp&$map~tmp1
	setvar $map~value $map~tmp
end
return

:map~displayadjacentgridansi
setvar $map~marker_beacon 1
setvar $map~limpet_mine 2
setvar $map~armid_mine 10
setvar $map~fighter 5
setvar $map~hazard 21
setvar $map~unmanned_ship 38
setvar $map~manned_ship 40
setvar $map~destroyed_port 50
setvar $map~port 100
setvar $map~planet 500

setvar $map~i 1
if (currentsector = 0)
	gosub :player~quikstats
end
isnumber $map~test currentsector
if ($map~test)
	echo "**" ansi_4 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 "*"
	while (sector.warps[currentsector][$map~i] > 0)
		setvar $map~adj_sec sector.warps[currentsector][$map~i]
		setvar $map~isaliens false
		setvar $map~adjsectorowner sector.figs.owner[$map~adj_sec]
		setvar $map~adjlimpowner sector.limpets.owner[$map~adj_sec]
		setvar $map~adjmineowner sector.mines.owner[$map~adj_sec]

		getsectorparameter $map~adj_sec "FIGSEC" $map~isfigged
		getsectorparameter $map~adj_sec "LIMPSEC" $map~islimped
		if ($map~isfigged <> true)
			setvar $map~isfigged false
		end
		setvar $map~containsshieldedplanet false
		setvar $map~shieldedplanets 0
		if ($map~adj_sec >= 10000)
			setvar $map~adjust ""
		elseif ($map~adj_sec >= 1000)
			setvar $map~adjust " "
		elseif ($map~adj_sec >= 100)
			setvar $map~adjust "  "
		elseif ($map~adj_sec >= 10)
			setvar $map~adjust "   "
		else
			setvar $map~adjust "    "

		end
		gosub :formatsectorowner
		echo ansi_13 "* (" ansi_10 $map~i ansi_13 ")" ansi_15 " - " ansi_13 "<" $map~color $map~adj_sec ansi_13 ">" $map~adjust ansi_5
		echo " " ansi_15 "["

		echo $map~color $map~temp

		echo ansi_15 "]"

		echo "   Warps" ansi_14 ": " ansi_14 sector.warpcount[$map~adj_sec] "   "
		getsectorparameter $map~adj_sec "FIGSEC" $map~isfigged
		getsectorparameter $map~adj_sec "MSLSEC" $map~ismsl
		getsectorparameter $map~adj_sec "BUBBLE" $map~isbubble
		if ($map~isfigged = "")
			setvar $map~isfigged false
		end
		if ($map~ismsl = "")
			setvar $map~ismsl false
		end
		isnumber $map~isnumber sector.anomaly[$map~adj_sec]
		if ($map~isnumber)
			if (sector.anomaly[$map~adj_sec])
				echo ansi_15 " Anom: " ansi_11 "Yes" ansi_15
			else
				echo ansi_15 " Anom: " ansi_7 " No" ansi_15
			end
		else
			echo ansi_15 " Anom: " ansi_7 " ???" ansi_15
		end
		echo ansi_15 "  Dens: " ansi_14
		if (sector.density[$map~adj_sec] = "-1")
			echo "???        "
		else
			setvar $map~calculated_density 0
			setvar $map~calculated_density ($map~calculated_density + (sector.figs.quantity[$map~adj_sec] * $map~fighter))
			setvar $map~calculated_density ($map~calculated_density + (sector.mines.quantity[$map~adj_sec] * $map~armid_mine))
			setvar $map~calculated_density ($map~calculated_density + (sector.limpets.quantity[$map~adj_sec] * $map~limpet_mine))
			setvar $map~calculated_density ($map~calculated_density + (sector.navhaz[$map~adj_sec] * $map~hazard))
			if (sector.beacon[$map~i] <> "")
				setvar $map~calculated_density ($map~calculated_density + $map~marker_beacon)
			end
			if (port.exists[$map~adj_sec])
				setvar $map~calculated_density ($map~calculated_density + $map~port)
			end
			setvar $map~calculated_density ($map~calculated_density + (sector.planetcount[$map~adj_sec] * $map~planet))
			setvar $map~calculated_density ($map~calculated_density + (sector.tradercount[$map~adj_sec] * $map~manned_ship))
			setvar $map~calculated_density ($map~calculated_density + (sector.shipcount[$map~adj_sec] * $map~unmanned_ship))
			setvar $map~dens sector.density[$map~adj_sec]
			getlength sector.density[$map~adj_sec] $map~denslength

			if ($map~denslength >= 9)
				echo "HIGH      "
			else

				echo $map~dens
			end
			if ($map~calculated_density < $map~dens)
				if (($map~islimped <> true) and ((sector.anomoly[$map~adj_sec] = true) and ((($map~adjlimpowner <> "belong to your Corp") and ($map~adjlimpowner <> "yours")) and (sector.limpets.quantity[$map~adj_sec] <= 0))))
					setvar $map~possible_limpets (($map~dens - $map~calculated_density) / 2)
					if ($map~possible_limpets <= 0)
						setvar $map~possible_limpets 1
					end
					echo ansi_3 " [" ansi_12 $map~possible_limpets " Enemy Limpets Detected" ansi_3 "]"
				end
			elseif ($map~calculated_density = $map~dens)
				if ($map~sector.anomoly[$map~adj_sec] = true)
					echo ansi_3 " /\/\" ansi_12 "Cloaked Ship Detected" ansi_3 "\/\/"
				end
			end

		end
		if ($map~ismsl = true)
			echo ansi_15 " [" ansi_14 "MSL" ansi_15 "]" ansi_7
		end
		if ($map~isbubble = true)
			echo ansi_15 " [" ansi_10 "BUBBLE" ansi_15 "]" ansi_7
		end
		setvar $map~output ""
		if (port.exists[$map~adj_sec])
			setvar $map~class port.class[$map~adj_sec]
			setvar $map~output $map~output&ansi_5&"           Port"&ansi_14&"    : "&ansi_11&port.name[$map~adj_sec]&ansi_14&", "&ansi_5&"Class "&ansi_11&$map~class&" "
			if (($map~class <> 0) and ($map~class <> 9))
				setvar $map~output $map~output&ansi_5&"("
				if (port.buyfuel[$map~adj_sec])
					setvar $map~output $map~output&ansi_2&"B"
				else
					setvar $map~output $map~output&ansi_11&"S"
				end
				if (port.buyorg[$map~adj_sec])
					setvar $map~output $map~output&ansi_2&"B"
				else
					setvar $map~output $map~output&ansi_11&"S"
				end
				if (port.buyequip[$map~adj_sec])
					setvar $map~output $map~output&ansi_2&"B"
				else
					setvar $map~output $map~output&ansi_11&"S"
				end
				setvar $map~output $map~output&ansi_5&")"
			end
			setvar $map~output $map~output&""
			echo "*    "&$map~output&""
		end
		if (sector.figs.quantity[$map~adj_sec] > 0)
			setvar $map~fig_count sector.figs.quantity[$map~adj_sec]

			if ((sector.figs.owner[$map~adj_sec] = "belong to your Corp") or (sector.figs.owner[$map~adj_sec] = "yours"))
				setvar $map~fig_owner ansi_11&"("&ansi_3&sector.figs.owner[$map~adj_sec]&ansi_11&") "&ansi_6&"["&sector.figs.type[$map~adj_sec]&"]"
				setvar $map~fighter_color ansi_14
			elseif ($map~isaliens = true)
				setvar $map~fig_owner ansi_10&"("&ansi_2&sector.figs.owner[$map~adj_sec]&ansi_10&") "&ansi_6&"["&sector.figs.type[$map~adj_sec]&"]"
				setvar $map~fighter_color ansi_10
			else
				if ($map~isfigged <> true)
					setvar $map~fig_owner ansi_12&"("&ansi_4&sector.figs.owner[$map~adj_sec]&ansi_12&") "&ansi_6&"["&sector.figs.type[$map~adj_sec]&"]"
					setvar $map~fighter_color ansi_12
				else
					setvar $map~fig_owner ansi_11&"("&ansi_3&"Database hasn't updated yet."&ansi_11&") "
					setvar $map~fighter_color ansi_14
				end
			end
			setvar $map~value $map~fig_count
			gosub :commas
			setvar $map~fig_count $map~value
			echo ansi_5&"*               Fighters"&ansi_14&": "&$map~fighter_color&$map~fig_count&ansi_5&" "&$map~fig_owner

		end
		setvar $map~p 1
		setvar $map~output "*"
		while ($map~p <= sector.planetcount[$map~adj_sec])
			setvar $map~isshielded false
			setvar $map~temp sector.planets[$map~adj_sec][$map~p]
			getword $map~temp $map~test 1
			if ($map~test = "<<<<")
				setvar $map~isshielded true
			end
			getword $map~temp $map~type 2
			striptext $map~type "("
			striptext $map~type ")"
			if ($map~isshielded)
				getlength $map~temp $map~length
				cuttext $map~temp $map~temp 1 ($map~length - 15)
				cuttext $map~temp $map~temp 10 9999
				setvar $map~temp ansi_12&"<<<< "&ansi_10&"("&ansi_14&$map~type&ansi_10&") "&ansi_1&$map~temp&ansi_12&" >>>> "&ansi_2&"(Shielded)"
			else
				setvar $map~temp ansi_2&$map~temp
			end
			if ($map~p = 1)
				setvar $map~temp ansi_5&"               Planets "&ansi_14&": "&$map~temp
				setvar $map~output $map~output&$map~temp&""
			else
				setvar $map~output $map~output&"                         "&$map~temp&""
			end
			if ($map~p < sector.planetcount[$map~adj_sec])
				setvar $map~output $map~output&"*"
			end
			add $map~p 1
		end
		if (sector.planetcount[$map~adj_sec] > 0)
			echo ""&$map~output&""
		end
		setvar $map~p 1
		if (sector.tradercount[$map~adj_sec] > 0)
			echo ansi_6 "*               Traders" ansi_15 " : "&ansi_7
		end
		while ($map~p <= sector.tradercount[$map~adj_sec])
			echo "*                         "&ansi_11&sector.traders[$map~adj_sec][$map~p]
			add $map~p 1
		end
		setvar $map~p 1
		if (sector.shipcount[$map~adj_sec] > 0)
			echo ansi_5 "*               Ships   " ansi_15 ": "&ansi_11&"("&sector.shipcount[$map~adj_sec]&") Empty Ships"
		end
		add $map~i 1
	end
	setvar $map~gridwarpcount ($map~i - 1)
else
	echo ansi_15 " ERROR WITH CURRENTSECTOR  " ansi_7
end
echo "**" ansi_4 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196
echo "**" currentansiline
return

:map~displaynavigation
setvar $map~i 1
setvar $map~map ""
setarray $map~sectors_array 6
setvar $map~sectors_array[1] ""
setvar $map~sectors_array[2] ""
setvar $map~sectors_array[3] ""
setvar $map~sectors_array[4] ""
setvar $map~sectors_array[5] ""
setvar $map~sectors_array[6] ""
setvar $map~count 0
isnumber $map~test currentsector
if ($map~test)
	while (sector.warps[currentsector][$map~i] > 0)
		setvar $map~map ""
		setvar $map~adj_sec sector.warps[currentsector][$map~i]
		setvar $map~containsshieldedplanet false
		setvar $map~shieldedplanets 0
		if ($map~adj_sec >= 10000)
			setvar $map~adjust ""
		elseif ($map~adj_sec >= 1000)
			setvar $map~adjust " "
		elseif ($map~adj_sec >= 100)
			setvar $map~adjust "  "
		elseif ($map~adj_sec >= 10)
			setvar $map~adjust "   "
		else
			setvar $map~adjust "    "
		end
		setvar $map~map $map~map&ansi_13&"* ("&ansi_10&$map~i&ansi_13&")"&ansi_15&" - "&ansi_13&"<"&ansi_14&sector.warps[currentsector][$map~i]&ansi_13&">"&$map~adjust&ansi_15&" Warps: "&ansi_7&sector.warpcount[$map~adj_sec]
		getsectorparameter $map~adj_sec "FIGSEC" $map~isfigged
		getsectorparameter $map~adj_sec "MSLSEC" $map~ismsl
		if ($map~isfigged = "")
			setvar $map~isfigged false
		end
		if ($map~ismsl = "")
			setvar $map~ismsl false
		end
		if ($map~isfigged or ((($map~adjsectorowner = "belong to your Corp") or ($map~adjsectorowner = "yours")) and (sector.figs.quantity[$map~adj_sec] > 0)))
			setvar $map~map $map~map&ansi_15&" Owner: "&ansi_14&"   OURS   "
		else
			getword $map~adjsectorowner $map~aliencheck 1
			if (($map~adj_sec < 11) or ($map~adj_sec = $map~stardock))
				setvar $map~map $map~map&ansi_15&" Owner: "&ansi_9&" FEDSPACE "
			elseif ($map~adj_sec = $map~rylos)
				setvar $map~map $map~map&ansi_15&" Owner: "&ansi_9&"  RYLOS   "
			elseif ($map~adj_sec = $map~alpha_centauri)
				setvar $map~map $map~map&ansi_15&" Owner: "&ansi_9&"  ALPHA   "
			elseif ($map~adjsectorowner = "Rogue Mercenaries")
				setvar $map~map $map~map&ansi_15&" Owner: "&ansi_7&"  ROGUE   "
			elseif ($map~aliencheck = "the")
				setvar $map~map $map~map&ansi_15&" Owner: "&ansi_2&"  ALIENS  "
			elseif ($map~aliencheck = "The")
				setvar $map~map $map~map&ansi_15&" Owner: "&ansi_2&"  ALIENS  "
			elseif (($map~adjsectorowner <> "") and ($map~adjsectorowner <> "Unknown"))
				setvar $map~heads true
				getword $map~adjsectorowner $map~temp 3
				striptext $map~temp ","
				uppercase $map~temp
				getlength $map~temp $map~templength
				if ($map~templength >= 10)
					cuttext $map~temp $map~temp 1 10
				else
					while ((10 - $map~templength) > 0)
						if ($map~heads)
							setvar $map~temp $map~temp&" "
							setvar $map~heads false
						else
							setvar $map~temp " "&$map~temp
							setvar $map~heads true
						end
						getlength $map~temp $map~templength
					end
				end
				setvar $map~map $map~map&ansi_15&" Owner: "&ansi_12&$map~temp
			else
				setvar $map~map $map~map&ansi_15&" Owner: "&ansi_13&"   NONE   "
			end
		end
		isnumber $map~isnumber sector.anomaly[$map~adj_sec]
		if ($map~isnumber)
			if (sector.anomaly[$map~adj_sec])
				setvar $map~map $map~map&ansi_15&" Anom: "&ansi_11&"Yes"&ansi_15
			else
				setvar $map~map $map~map&ansi_15&" Anom: "&ansi_7&" No"&ansi_15
			end
		else
			setvar $map~map $map~map&ansi_15&" Anom: "&ansi_7&" ???"&ansi_15
		end
		setvar $map~map $map~map&ansi_15&"  Dens: "&ansi_14
		if (sector.density[$map~adj_sec] = "-1")
			setvar $map~map $map~map&"???        "
		else
			setvar $map~dens sector.density[$map~adj_sec]
			getlength sector.density[$map~adj_sec] $map~denslength
			if ($map~denslength >= 9)
				setvar $map~map $map~map&"HIGH      "
			else
				setvar $map~d $map~denslength
				while ($map~d <= 10)
					setvar $map~dens $map~dens&" "
					add $map~d 1
				end
				setvar $map~map $map~map&$map~dens
			end
		end

		if ($map~ismsl = true)
			setvar $map~map $map~map&ansi_15&"["&ansi_14&"MSL"&ansi_15&"]"&ansi_7
		end
		setvar $map~output ""
		if (port.exists[$map~adj_sec])
			setvar $map~class port.class[$map~adj_sec]
			setvar $map~output $map~output&ansi_5&"    Port   "&ansi_14&": "&ansi_11&port.name[$map~adj_sec]&ansi_14&", "&ansi_5&"Class "&ansi_11&$map~class&" "
			if (($map~class <> 0) and ($map~class <> 9))
				setvar $map~output $map~output&ansi_5&"("
				if (port.buyfuel[$map~adj_sec])
					setvar $map~output $map~output&ansi_2&"B"
				else
					setvar $map~output $map~output&ansi_11&"S"
				end
				if (port.buyorg[$map~adj_sec])
					setvar $map~output $map~output&ansi_2&"B"
				else
					setvar $map~output $map~output&ansi_11&"S"
				end
				if (port.buyequip[$map~adj_sec])
					setvar $map~output $map~output&ansi_2&"B"
				else
					setvar $map~output $map~output&ansi_11&"S"
				end
				setvar $map~output $map~output&ansi_5&")"
			end
			setvar $map~output $map~output&""
			setvar $map~map $map~map&"*    "&$map~output&""
		end
		if (sector.figs.quantity[$map~adj_sec] > 0)
			setvar $map~map $map~map&ansi_5&"*    Fighters   : "&ansi_11&sector.figs.quantity[$map~adj_sec]&ansi_5&" ("&sector.figs.owner[$map~adj_sec]&") "&ansi_6&"["&sector.figs.type[$map~adj_sec]&"]"
		end
		setvar $map~p 1
		setvar $map~output "*"
		while ($map~p <= sector.planetcount[$map~adj_sec])
			setvar $map~isshielded false
			setvar $map~temp sector.planets[$map~adj_sec][$map~p]
			getword $map~temp $map~test 1
			if ($map~test = "<<<<")
				setvar $map~isshielded true
			end
			getword $map~temp $map~type 2
			striptext $map~type "("
			striptext $map~type ")"
			if ($map~isshielded)
				getlength $map~temp $map~length
				cuttext $map~temp $map~temp 1 ($map~length - 15)
				cuttext $map~temp $map~temp 10 9999
				setvar $map~temp ansi_12&"<<<< "&ansi_10&"("&ansi_14&$map~type&ansi_10&") "&ansi_1&$map~temp&ansi_12&" >>>> "&ansi_2&"(Shielded)"
			else
				setvar $map~temp ansi_2&$map~temp
			end
			if ($map~p = 1)
				setvar $map~temp ansi_5&"     Planets "&ansi_14&"  : "&$map~temp
				setvar $map~output $map~output&$map~temp&""
			else
				setvar $map~output $map~output&"                 "&$map~temp&""
			end
			if ($map~p < sector.planetcount[$map~adj_sec])
				setvar $map~output $map~output&"*"
			end
			add $map~p 1
		end
		if (sector.planetcount[$map~adj_sec] > 0)
			setvar $map~map $map~map&""&$map~output&""
		end
		setvar $map~p 1
		if (sector.tradercount[$map~adj_sec] > 0)
			setvar $map~map $map~map&ansi_6&"*        Traders: "&ansi_7
		end
		while ($map~p <= sector.tradercount[$map~adj_sec])
			setvar $map~map $map~map&"*             "&ansi_11&sector.traders[$map~adj_sec][$map~p]
			add $map~p 1
		end
		setvar $map~p 1
		if (sector.shipcount[$map~adj_sec] > 0)
			setvar $map~map $map~map&ansi_6&"*       Ships   : "&ansi_11&"("&sector.shipcount[$map~adj_sec]&") Empty Ships"
		end
		setvar $map~sectors_array[$map~i] $map~map
		add $map~count 1
		add $map~i 1
	end
	setvar $map~gridwarpcount ($map~i - 1)
else
	setvar $map~map $map~map&ansi_15&" ERROR WITH CURRENTSECTOR  "&ansi_7
end
setvar $map~map $map~sectors_array[1]&"  "&$map~sectors_array[2]&"  "&$map~sectors_array[3]&"***"
setvar $map~displaysector currentsector
gosub :displaysector
setvar $map~map $map~map&$map~output&"*"
setvar $map~map $map~map&$map~sectors_array[4]&"  "&$map~sectors_array[5]&"  "&$map~sectors_array[6]&"*"
return

:map~displaysector
setvar $map~i $map~displaysector
setvar $map~output ansi_10&"    Sector  "&ansi_14&": "&ansi_11&$map~i&ansi_2&" in "
setvar $map~constellation sector.constellation[$map~i]
if ($map~constellation = "The Federation.")
	setvar $map~output $map~output&ansi_10&$map~constellation&"*"
else
	setvar $map~output $map~output&ansi_1&$map~constellation&"*"
end
if (sector.beacon[$map~i] <> "")
	setvar $map~output $map~output&ansi_5&"    Beacon  "&ansi_14&": "&ansi_12&sector.beacon[$map~i]&"*"
end
if (port.exists[$map~i])
	setvar $map~class port.class[$map~i]
	setvar $map~output $map~output&ansi_5&"    Ports   "&ansi_14&": "&ansi_11&port.name[$map~i]&ansi_14&", "&ansi_5&"Class "&ansi_11&$map~class&" "
	if (($map~class <> 0) and ($map~class <> 9))
		setvar $map~output $map~output&ansi_5&"("
		if (port.buyfuel[$map~i])
			setvar $map~output $map~output&ansi_2&"B"
		else
			setvar $map~output $map~output&ansi_11&"S"
		end
		if (port.buyorg[$map~i])
			setvar $map~output $map~output&ansi_2&"B"
		else
			setvar $map~output $map~output&ansi_11&"S"
		end
		if (port.buyequip[$map~i])
			setvar $map~output $map~output&ansi_2&"B"
		else
			setvar $map~output $map~output&ansi_11&"S"
		end
		setvar $map~output $map~output&ansi_5&")"
	end
	setvar $map~output $map~output&"*"
end
setvar $map~j 1
while ($map~j <= sector.planetcount[$map~i])
	setvar $map~isshielded false
	setvar $map~temp sector.planets[$map~i][$map~j]
	getword $map~temp $map~test 1
	if ($map~test = "<<<<")
		setvar $map~isshielded true
	end
	getword $map~temp $map~type 2
	striptext $map~type "("
	striptext $map~type ")"
	if ($map~isshielded)
		getlength $map~temp $map~length
		cuttext $map~temp $map~temp 1 ($map~length - 15)
		cuttext $map~temp $map~temp 10 9999
		setvar $map~temp ansi_12&"<<<< "&ansi_10&"("&ansi_14&$map~type&ansi_10&") "&ansi_1&$map~temp&ansi_12&" >>>> "&ansi_2&"(Shielded)"
	else
		setvar $map~temp ansi_2&$map~temp
	end
	if ($map~j = 1)
		setvar $map~temp ansi_5&"    Planets "&ansi_14&": "&$map~temp
		setvar $map~output $map~output&$map~temp&"*"
	else
		setvar $map~output $map~output&"              "&$map~temp&"*"
	end
	add $map~j 1
end
setvar $map~j 1
while ($map~j <= sector.tradercount[$map~i])
	setvar $map~temp sector.traders[$map~i][$map~j]
	setvar $map~temp ansi_2&$map~temp
	if ($map~j = 1)
		setvar $map~temp ansi_5&"    Traders "&ansi_14&": "&$map~temp
		setvar $map~output $map~output&$map~temp&"*"
	else
		setvar $map~output $map~output&"              "&$map~temp&"*"
	end
	add $map~j 1
end
setvar $map~j 1
while ($map~j <= sector.shipcount[$map~i])
	setvar $map~temp sector.ships[$map~i][$map~j]
	setvar $map~temp ansi_2&$map~temp
	if ($map~j = 1)
		setvar $map~temp ansi_5&"      Ships "&ansi_14&": "&$map~temp
		setvar $map~output $map~output&$map~temp&"*"
	else
		setvar $map~output $map~output&"              "&$map~temp&"*"
	end
	add $map~j 1
end
if (sector.figs.quantity[$map~i] > 0)
	setvar $map~output $map~output&ansi_5&"    Fighters"&ansi_14&": "&ansi_11&sector.figs.quantity[$map~i]&ansi_5&" ("&sector.figs.owner[$map~i]&") "&ansi_6&"["&sector.figs.type[$map~i]&"]*"
end
setvar $map~output $map~output&ansi_10&"    Warps to sector(s) "&ansi_14&":  "
setvar $map~k 1
while (sector.warps[$map~i][$map~k] > 0)
	if ($map~k <> 1)
		setvar $map~output $map~output&ansi_2&" - "
	end
	getsectorparameter sector.warps[$map~i][$map~k] "FIGSEC" $map~check
	if ($map~check = true)
		setvar $map~output $map~output&ansi_11&"["&sector.warps[$map~i][$map~k]&"]"
	else
		setvar $map~output $map~output&ansi_11&sector.warps[$map~i][$map~k]
	end
	add $map~k 1
end
setvar $map~k 1
while (sector.backdoors[$map~i][$map~k] > 0)
	if ($map~k <> 1)
		setvar $map~output $map~output&ansi_2&" - "
	else
		setvar $map~output $map~output&ansi_12&"*    Backdoor from sector(s) "&ansi_14&":  "
	end
	setvar $map~output $map~output&ansi_11&sector.backdoors[$map~i][$map~k]
	add $map~k 1
end
setvar $map~output $map~output&"*"
return

:map~formatsectorowner
setvar $map~most_recent_data false
setvar $map~datetime date&" "&time
if ($map~datetime = sector.updated[$map~adj_sec])
	setvar $map~most_recent_data true
end
if ($map~most_recent_data = true)
	if ((($map~adjsectorowner = "belong to your Corp") or ($map~adjsectorowner = "yours")) and (sector.figs.quantity[$map~adj_sec] > 0))
		setsectorparameter $map~adj_sec "FIGSEC" true
		setvar $map~isfigged true
	else
		setsectorparameter $map~adj_sec "FIGSEC" false
		setvar $map~isfigged false
	end
	if ((sector.anomoly[$map~adj_sec] = true) and (((($map~adjlimpowner = "belong to your Corp") or ($map~adjlimpowner = "yours")) and (sector.limpets.quantity[$map~adj_sec] > 0))))
		setsectorparameter $map~adj_sec "LIMPSEC" true
		setvar $map~islimped true
	else
		setsectorparameter $map~adj_sec "LIMPSEC" false
		setvar $map~islimped false
	end
	if ((($map~adjmineowner = "belong to your Corp") or ($map~adjmineowner = "yours")) and (sector.mines.quantity[$map~adj_sec] > 0))
		setsectorparameter $map~adj_sec "MINESEC" true
	else
		setsectorparameter $map~adj_sec "MINESEC" false
	end
end

if ($map~isfigged = true) or ((($map~adjsectorowner = "belong to your Corp") or ($map~adjsectorowner = "yours")) and (sector.figs.quantity[$map~adj_sec] > 0))
	setvar $map~text "OURS"
	setvar $map~color ansi_14
else
	getword $map~adjsectorowner $map~aliencheck 1
	if (($map~adj_sec < 11) or ($map~adj_sec = $map~stardock))
		setvar $map~color ansi_9
		setvar $map~text "FEDSPACE"
	elseif ($map~adj_sec = $map~rylos)
		setvar $map~color ansi_9
		setvar $map~text "RYLOS"
	elseif ($map~adj_sec = $map~alpha_centauri)
		setvar $map~color ansi_9
		setvar $map~text "ALPHA"
	elseif ($map~adjsectorowner = "Rogue Mercenaries")
		setvar $map~color ansi_7
		setvar $map~text "ROGUE"
	elseif ($map~aliencheck = "the")
		setvar $map~color ansi_2
		setvar $map~text "ALIEN"
		setvar $map~isaliens true
	elseif ($map~aliencheck = "The")
		setvar $map~color ansi_2
		setvar $map~text "ALIEN"
		setvar $map~isaliens true
	elseif (($map~adjsectorowner <> "") and ($map~adjsectorowner <> "Unknown"))
		setvar $map~heads true
		getword $map~adjsectorowner $map~temp 3
		striptext $map~temp ","
		uppercase $map~temp
		setvar $map~text $map~temp
		setvar $map~color ansi_12
	else
		setvar $map~text "NONE"
		setvar $map~color ansi_13
	end
end
setvar $map~temp $map~text
getlength $map~temp $map~templength
setvar $map~length 10
if ($map~templength >= $map~length)
	cuttext $map~temp $map~temp 1 $map~length
else
	while (($map~length - $map~templength) > 0)
		if ($map~heads)
			setvar $map~temp $map~temp&" "
			setvar $map~heads false
		else
			setvar $map~temp " "&$map~temp
			setvar $map~heads true
		end
		getlength $map~temp $map~templength
	end
end
return

:map~format_sector_owner
setvar $map~most_recent_data false
setvar $map~datetime date&" "&time
if ($map~datetime = sector.updated[$map~adj_sec])
	setvar $map~most_recent_data true
end
if ($map~most_recent_data = true)
	if ((($map~adjsectorowner = "belong to your Corp") or ($map~adjsectorowner = "yours")) and (sector.figs.quantity[$map~adj_sec] > 0))
		setsectorparameter $map~adj_sec "FIGSEC" true
		setvar $map~isfigged true
	else
		setsectorparameter $map~adj_sec "FIGSEC" false
		setvar $map~isfigged false
	end
	if ((sector.anomoly[$map~adj_sec] = true) and (((($map~adjlimpowner = "belong to your Corp") or ($map~adjlimpowner = "yours")) and (sector.limpets.quantity[$map~adj_sec] > 0))))
		setsectorparameter $map~adj_sec "LIMPSEC" true
		setvar $map~islimped true
	else
		setsectorparameter $map~adj_sec "LIMPSEC" false
		setvar $map~islimped false
	end
	if ((($map~adjmineowner = "belong to your Corp") or ($map~adjmineowner = "yours")) and (sector.mines.quantity[$map~adj_sec] > 0))
		setsectorparameter $map~adj_sec "MINESEC" true
	else
		setsectorparameter $map~adj_sec "MINESEC" false
	end
end

if ($map~isfigged = true) or ((($map~adjsectorowner = "belong to your Corp") or ($map~adjsectorowner = "yours")) and (sector.figs.quantity[$map~adj_sec] > 0))
	setvar $map~text "OURS"
	setvar $map~color ansi_14
else
	getword $map~adjsectorowner $map~aliencheck 1
	if (($map~adj_sec < 11) or ($map~adj_sec = $map~stardock))
		setvar $map~color ansi_9
		setvar $map~text "FEDSPACE"
	elseif ($map~adj_sec = $map~rylos)
		setvar $map~color ansi_9
		setvar $map~text "RYLOS"
	elseif ($map~adj_sec = $map~alpha_centauri)
		setvar $map~color ansi_9
		setvar $map~text "ALPHA"
	elseif ($map~adjsectorowner = "Rogue Mercenaries")
		setvar $map~color ansi_7
		setvar $map~text "ROGUE"
	elseif ($map~aliencheck = "the")
		setvar $map~color ansi_2
		setvar $map~text "ALIEN"
		setvar $map~isaliens true
	elseif ($map~aliencheck = "The")
		setvar $map~color ansi_2
		setvar $map~text "ALIEN"
		setvar $map~isaliens true
	elseif (($map~adjsectorowner <> "") and ($map~adjsectorowner <> "Unknown"))
		setvar $map~heads true
		getword $map~adjsectorowner $map~temp 3
		striptext $map~temp ","
		uppercase $map~temp
		setvar $map~text $map~temp
		setvar $map~color ansi_12
	else
		setvar $map~text "NONE"
		setvar $map~color ansi_13
	end
end
setvar $map~temp $map~text
getlength $map~temp $map~templength
setvar $map~length 10
if ($map~templength >= $map~length)
	cuttext $map~temp $map~temp 1 $map~length
else
	while (($map~length - $map~templength) > 0)
		if ($map~heads)
			setvar $map~temp $map~temp&" "
			setvar $map~heads false
		else
			setvar $map~temp " "&$map~temp
			setvar $map~heads true
		end
		getlength $map~temp $map~templength
	end
end
return

include "source\include\player"
