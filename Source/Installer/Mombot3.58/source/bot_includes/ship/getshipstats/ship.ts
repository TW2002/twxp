#Author: Mind Dagger
#Gets the stats of the ship you are currently in. 
#Needs: Start from Command prompt.

	# ============================  START SHIP VARIABLES ==========================
		setVar $SHIP_OFFENSIVE_ODDS	0
		setVar $SHIP_FIGHTERS_MAX	0
		setVar $SHIP_MAX_ATTACK		0
		setVar $SHIP_MINES_MAX		0
		setVar $SHIP_SHIELD_MAX     0
	# ============================   END SHIP VARIABLES  ==========================

:getShipStats
	send "c;q"
	setTextLineTrigger	getshipoffense		:shipoffenseodds	"Offensive Odds: "
	setTextLineTrigger	getshipfighters 	:shipmaxfigsperattack	" TransWarp Drive:   "
	setTextLineTrigger getshipmines        :shipmaxmines       " Mine Max:  "
	setTextLineTrigger  getshipgenesis        :shipmaxgenesis       " Genesis Max:  "
	setTextLineTrigger  getshipshields      :shipmaxshields     "Maximum Shields:"
	pause
	
	:shipmaxshields
		setVar $shield_line CURRENTLINE
		replaceText $shield_line ":" "  "
		replaceText $shield_line "," ""
		getWord $shield_line $SHIP_SHIELD_MAX 10
		pause
	:shipoffenseodds
		getWordPos CURRENTANSILINE $pos "[0;31m:[1;36m1"
		if ($pos > 0)
			getText CURRENTANSILINE $SHIP_OFFENSIVE_ODDS "Offensive Odds[1;33m:[36m " "[0;31m:[1;36m1"
			stripText $SHIP_OFFENSIVE_ODDS "."
			stripText $SHIP_OFFENSIVE_ODDS " "
			gettext CURRENTANSILINE $SHIP_FIGHTERS_MAX "Max Fighters[1;33m:[36m" "[0;32m Offensive Odds"
			stripText $SHIP_FIGHTERS_MAX ","
			stripText $SHIP_FIGHTERS_MAX " "
			savevar $SHIP~SHIP_OFFENSIVE_ODDS
		end
		pause
	:shipmaxmines
		getText CURRENTLINE $SHIP_MINES_MAX "Mine Max:" "Beacon Max:"
		stripText $SHIP_MINES_MAX " "
		pause

	:shipmaxgenesis
		getText CURRENTLINE $SHIP_GENESIS_MAX "Genesis Max:" "Long Range Scan:"
		stripText $SHIP_GENESIS_MAX " "
		pause
	
	:shipmaxfigsperattack
		getWordPos CURRENTANSILINE $pos "[0m[32m Max Figs Per Attack[1;33m:[36m"
		if ($pos > 0)
			getText CURRENTANSILINE $SHIP_MAX_ATTACK "[0m[32m Max Figs Per Attack[1;33m:[36m" "[0;32mTransWarp"
			striptext $SHIP_MAX_ATTACK " "
		end
		savevar $ship_max_attack
return
