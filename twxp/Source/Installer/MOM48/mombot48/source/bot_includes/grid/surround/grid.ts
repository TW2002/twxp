#Author: Mind Dagger


#ASSUMES YOU HAVE RUN QUIKSTATS BEFORE RUNNING THIS SUBROUTINE
:surround
	:StartSurround
		if ($player~surroundPassive)
			send "szd"
			settextlinetrigger surroundscanden :donesurroundscanden "Select (H)olo Scan or (D)ensity Scan or (Q)uit? [D] D"
			settexttrigger surroundscanfailden :donesurroundscan "Do you want instructions (Y/N) [N]?"
			pause
			:donesurroundscanden
				killtrigger surroundscanden
				killtrigger surroundscanfailden
			send "szh" 
			waiton "Select (H)olo Scan or (D)ensity Scan or (Q)uit? [D] H"
			send "* " 
		else
			send "szh" 
			settextlinetrigger surroundscan :donesurroundscan "Select (H)olo Scan or (D)ensity Scan or (Q)uit? [D] H"
			settexttrigger surroundscanfail :donesurroundscan "Do you want instructions (Y/N) [N]?"
			pause
			:donesurroundscan
				killtrigger surroundscan
				killtrigger surroundscanfail
				send "* " 
		end
		killtrigger surroundsector
		setTextTrigger surroundsector :continuesurroundsector "[" & $player~current_sector & "]"
		pause
		:continuesurroundsector
		if ($already_checked_ship <> TRUE)
			gosub :SHIP~getShipStats
		end
		if ($SHIP~SHIP_MAX_ATTACK > $player~fighters)
			setVar $SHIP~SHIP_MAX_ATTACK ($player~fighters/2)
		end

		setVar $i 1
		setVar $surroundString "c v 0* y* "&$player~current_sector&"* q "
		setVar $player~surroundOutput ""
		setVar $yourOwnCount 0
		if ($player~dropOffensive = TRUE)
			setVar $deployFig "o"
		elseif ($player~dropToll = TRUE)
			setVar $deployFig "t"
		else
			setVar $deployFig "d"
		end
		setvar $totalWarps SECTOR.WARPCOUNT[$player~current_sector]
		while (SECTOR.WARPS[$player~current_sector][$i] > 0)
			setVar $adj_sec SECTOR.WARPS[$player~current_sector][$i]
			getDistance $distance $adj_sec $player~current_sector
			if ($distance <= 0)
				send "^f" & $adj_sec & "*" & $player~current_sector & "*q"
				waitOn "ENDINTERROG"
				getDistance $distance $adj_sec $player~current_sector
			end
			setVar $containsShieldedPlanet FALSE
			setVar $p 1
			while ($p <= SECTOR.PLANETCOUNT[$adj_sec])
				getWord SECTOR.PLANETS[$adj_sec][$p] $test 1
				if ($test = "<<<<")
					setVar $containsShieldedPlanet TRUE
				end
				add $p 1
			end
			setVar $tempOffOdd $SHIP~SHIP_OFFENSIVE_ODDS
			multiply $tempOffOdd $SHIP~SHIP_MAX_ATTACK
			divide $tempoffodd 12
			setVar $figOwner SECTOR.FIGS.OWNER[$ADJ_SEC]
			setVar $mineOwner SECTOR.MINES.OWNER[$ADJ_SEC]
			setVar $limpOwner SECTOR.LIMPETS.OWNER[$ADJ_SEC]
			getWord $figOwner $alienCheck 1
			lowercase $alienCheck
			
			if (($player~surroundOverwrite = FALSE) AND (($figOwner = "belong to your Corp") OR ($figOwner = "yours")))
				add $yourOwnCount 1
				if ($yourOwnCount = $totalWarps)
					setVar $player~surroundOutput $player~surroundOutput&"(Surround) All sectors around are friendly fighters.*"
					return
				end
			elseif (SECTOR.FIGS.QUANTITY[$ADJ_SEC] >= $tempoffodd)
				setVar $player~surroundOutput $player~surroundOutput&"(Surround) Too many fighters in sector "&$adj_sec&".*"
			elseif (($adj_sec <= 10) OR ($adj_Sec = $MAP~stardock))
				setVar $player~surroundOutput $player~surroundOutput&"(Surround) Avoided Fed Space, sector "&$adj_sec&".*"
			elseif ((SECTOR.PLANETCOUNT[$ADJ_SEC] > 0) AND ($player~surroundAvoidAllPlanets))
				setVar $player~surroundOutput $player~surroundOutput&"(Surround) Avoided planet in sector "&$adj_sec&".*"
			elseif (($containsShieldedPlanet = TRUE) AND ($player~surroundAvoidShieldedOnly = TRUE))
				setVar $player~surroundOutput $player~surroundOutput&"(Surround) Avoided shielded planet in sector "&$adj_sec&".*"
			elseif ($distance > 1)
				setVar $player~surroundOutput $player~surroundOutput&"(Surround) Avoided one way in sector "&$adj_sec&".*"
			elseif (($player~surroundPassive = TRUE) AND (((SECTOR.ANOMALY[$ADJ_SEC] = TRUE) AND (($limpOwner <> "belong to your Corp") AND ($limpOwner <> "yours"))) OR ((SECTOR.FIGS.QUANTITY[$ADJ_SEC] > 0) and ($alienCheck <> "the")) OR ((SECTOR.MINES.QUANTITY[$ADJ_SEC] > 0) AND (($mineOwner <> "belong to your Corp") AND ($mineOwner <> "yours")))))
				setVar $player~surroundOutput $player~surroundOutput&"(Surround) Avoided non-passive situation in sector "&$adj_sec&".*"
			else
				setVar $surroundString $surroundString&" m z "&$adj_sec&"* z a "&$SHIP~SHIP_MAX_ATTACK&"* * "
				if (($player~surroundFigs > 0) AND ($player~fighters > $player~surroundFigs))
					setVar $surroundString $surroundString&"f z" & $player~surroundFigs & "*zc"&$deployFig&"*  "
					subtract $player~fighters $player~surroundFigs
					setVar $target $ADJ_SEC
					setSectorParameter $target "FIGSEC" TRUE
				end
				if (($player~surroundLimp > 0) AND ($player~limpets > $player~surroundLimp) AND ($player~limpets > 0))
					setVar $surroundString $surroundString&"h2 z" & $player~surroundLimp & "*zc* "
					subtract $player~limpets $player~surroundLimp
					#setSectorParameter $ADJ_SEC "LIMPSEC" TRUE
				end
				if (($player~surroundMine > 0) AND ($player~armids > $player~surroundMine) AND ($player~armids > 0))
					setVar $surroundString $surroundString&"h1 z" & $player~surroundMine & "*zc* "
					subtract $player~armids $player~surroundMine
					#setSectorParameter $ADJ_SEC "MINESEC" TRUE
				end
				setVar $surroundString $surroundString&"< "
				if (($player~current_sector <> $map~stardock) and ($player~current_sector > 10))
					setVar $surroundString $surroundString&"za z "&$SHIP~SHIP_MAX_ATTACK&"* * "
				end
			end
			add $i 1
		end
		if ((($player~surroundFigs > 0) AND ($player~fighters > $player~surroundFigs)) and (($player~current_sector <> $map~stardock) and ($player~current_sector > 10)))
			setVar $surroundString $surroundString&"f z" & $player~surroundFigs & "*zc"&$deployFig&"*  "
			subtract $player~fighters $player~surroundFigs
			setVar $target $player~current_sector
			setSectorParameter $target "FIGSEC" TRUE
		end
		send $surroundString
return

include "source\bot_includes\ship\getshipstats\ship"

