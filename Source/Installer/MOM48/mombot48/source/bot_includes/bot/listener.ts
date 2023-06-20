# ============================== START GET PLANET STATS TRIGGERS==============================
:setPlanetNumber
	getWordPos RAWPACKET $pos "Planet " & #27 & "[1;33m#" & #27 & "[36m"
	if ($pos > 0)
		getText RAWPACKET $PLANET~PLANET "Planet " & #27 & "[1;33m#" & #27 & "[36m" #27 & "[0;32m in sector "
		saveVar $PLANET~PLANET
	end
	setTextLineTrigger  getPlanetNumber :setPlanetNumber    "Planet #"
	pause
# =============================== END GET PLANET STATS TRIGGERS===============================
# ============================== CHECK SECTOR DATA ========================================
:checkSectorData
	getText CURRENTLINE $cursec "]:[" "] ("
	if ($cursec = CURRENTSECTOR)
		setVar $PLAYER~CURRENT_SECTOR $cursec
		getSectorParameter $PLAYER~CURRENT_SECTOR "BUSTED" $isBusted
		if (($BOT~command_prompt_extras = TRUE) and ($isBusted = TRUE))
			echo ANSI_5 "[" ANSI_12 "BUSTED" ANSI_5 "] : "
		end
		getSectorParameter $PLAYER~CURRENT_SECTOR "MSLSEC" $isMSL
		if (($BOT~command_prompt_extras = TRUE) and ($isMSL = TRUE))
			echo ANSI_5 "[" ANSI_9 "MSL" ANSI_5 "] : "
		end
	end
	setTextTrigger  sectordata      :checkSectorData    "(?=Help)? :"
	pause
# ============================ END CHECK SECTOR DATA ========================================
# ============================== START GET SHIP STATS TRIGGERS==============================
:setShipOffensiveOdds
	getWordPos CURRENTANSILINE $pos "[0;31m:[1;36m1"
	if ($pos > 0)
		getText CURRENTANSILINE $SHIP~SHIP_OFFENSIVE_ODDS "Offensive Odds[1;33m:[36m " "[0;31m:[1;36m1"
		stripText $SHIP~SHIP_OFFENSIVE_ODDS "."
		stripText $SHIP~SHIP_OFFENSIVE_ODDS " "
		gettext CURRENTANSILINE $SHIP~SHIP_FIGHTERS_MAX "Max Fighters[1;33m:[36m" "[0;32m Offensive Odds"
		stripText $SHIP~SHIP_FIGHTERS_MAX ","
		stripText $SHIP~SHIP_FIGHTERS_MAX " "
	end
	setTextLineTrigger  getshipstats    :setShipOffensiveOdds   "Offensive Odds: "
	pause
:setShipMaxFigAttack
	getWordPos CURRENTANSILINE $pos "[0m[32m Max Figs Per Attack[1;33m:[36m"
	if ($pos > 0)
		getText CURRENTANSILINE $SHIP~SHIP_MAX_ATTACK "[0m[32m Max Figs Per Attack[1;33m:[36m" "[0;32mTransWarp"
		striptext $SHIP~SHIP_MAX_ATTACK " "
	end
	setTextLineTrigger  getshipmaxfighters  :setShipMaxFigAttack    " TransWarp Drive:   "
	pause
# ============================== END GET SHIP STATS TRIGGERS==============================
return
