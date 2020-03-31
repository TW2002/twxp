systemscript

###########################################
#Making sure default MSL variables are set#
###########################################
loadVar $MAP~stardock
loadvar $bot~subspace
loadvar $bot~bot_password
loadvar $bot~bot_name
loadGlobal $bot~last_fighter_attack
if ($bot~last_fighter_attack = 0)
	setvar $bot~last_fighter_attack ""
	saveGlobal $bot~last_fighter_attack
end
setSectorParameter 1 "MSLSEC" TRUE
setSectorParameter 2 "MSLSEC" TRUE
setSectorParameter 3 "MSLSEC" TRUE
setSectorParameter 4 "MSLSEC" TRUE
setSectorParameter 5 "MSLSEC" TRUE
setSectorParameter 6 "MSLSEC" TRUE
setSectorParameter 7 "MSLSEC" TRUE
setSectorParameter 8 "MSLSEC" TRUE
setSectorParameter 9 "MSLSEC" TRUE
setSectorParameter 10 "MSLSEC" TRUE
if ($MAP~stardock > 0)
	setSectorParameter $MAP~stardock "MSLSEC" TRUE
end



setTextLineTrigger  federase        :fedEraseFig        "The Federation We destroyed your Corp's "
setTextLineTrigger  fighterserase       :eraseFig       " of your fighters in sector "
setTextLineTrigger  fightersave 	:fightersave "Deployed Fighters "
settextlinetrigger  limpsave		:limpsave	"Limpet mine in "
setTextLineTrigger 	armidsave 		:armidsave "Your mines in "
setTextLineTrigger  warpfigerase        :eraseWarpFig       "You do not have any fighters in Sector "
setTextLineTrigger  pgridadd    :pgridadd   "Successfully P-gridded into sector "
setTextLineTrigger  pgridxportadd    :pgridxportadd   "Successfully P-gridded w/xport into sector "
setTextLineTrigger  pgridremove    :pgridremove   "Unsuccessful P-grid into sector "
setTextLineTrigger  clearbusts      :erasebusts     ">[Busted:"
setTextLineTrigger  addfigs      :addFigs     ">[Figged:"
setTextLineTrigger  planetmoved      :updatePlanetMovement     " moved to sector "
setTextLineTrigger      fightersadd     :addFig         "Should they be (D)efensive, (O)ffensive or Charge a (T)oll ?"
setTextLineTrigger  getPlanetNumber :setPlanetNumber    "Planet #"
setTextTrigger  sectordata      :checkSectorData    "(?=Help)? :"
setTextLineTrigger  getshipstats    :setShipOffensiveOdds   "Offensive Odds: "
setTextLineTrigger  getshipmaxfighters  :setShipMaxFigAttack    " TransWarp Drive:   "
setTextLineTrigger  captureLevelPlanet  :captureLevelPlanet " Level "
setTextLineTrigger  captureNoLevelPlanet  :captureNoLevelPlanet " No Citadel"
setTextLineTrigger  emergency_reboot      :emergency_reboot "<EMERGENCY REBOOT>"&$bot~bot_password
setTextLineTrigger  shipdestroyed         :shipdestroyed "You will have to start over from scratch!"
setTextLineTrigger  getPlanetNumberRaw    :setPlanetNumberRaw "Land on which planet <Q to abort> ? "
setTextLineTrigger  getShipNumberRaw       :setShipNumberRaw "Choose which ship to beam to (Q=Quit) "
setdelaytrigger		checkifbotalive       :checkifbotalive 60000
#setTextLineTrigger  mcicneg :mcicneg    "/unit - MCIC "
settextlinetrigger lracheck :lracheck "For stealing from this port, your alignment"
settextlinetrigger lracheck2 :lracheck "For robbing this port, your alignment"
settextlinetrigger busted :busted "For getting caught your alignment went down by"
settextlinetrigger fakebusted :fakebusted "(You realize the guards saw you last time!)"
settextlinetrigger manualsubspace :manualsubspace "Ok, you will send and receive sub-space messages on channel "
setTextLineTrigger foundbigbubble :foundbigbubble "[Found Big Bubble]"
setTextLineTrigger foundbigtunnel :foundbigtunnel "[Found Big Tunnel]"
pause

:foundbigbubble
	getText CURRENTLINE $bsec " Door: " " Internal Sec:"
	isnumber $test $bsec 
	if ($test = TRUE)
		getSectorParameter $bsec "BUBBLEDOOR" $param_tunnel
		if ($param_tunnel = "")
			setVar $param_tunnel FALSE
		end
		if ($param_tunnel = FALSE)
			setSectorParameter $bsec "BUBBLEDOOR" 1
			getText CURRENTLINE $int "Internal Sec:" ""
			setSectorParameter $bsec "BUBBLEINT" $int
		end
	end
	setTextLineTrigger foundbigbubble :foundbigbubble "[Found Big Bubble]"
	pause
:foundbigtunnel
	getText CURRENTLINE $dsec1 "Door 1: " " Door 2:"
	getText CURRENTLINE $dsec2 "Door 2: " " Internal"
	isnumber $test $dsec1 
	if ($test = TRUE)
		getSectorParameter $dsec1 "TUNNELDOOR" $param_tunnel

		if ($param_tunnel = "")
			setVar $param_tunnel FALSE
		end
		if ($param_tunnel = FALSE)
			setSectorParameter $dsec1 "TUNNELDOOR" 1
			setSectorParameter $dsec2 "TUNNELDOOR" 1
			getText CURRENTLINE $int "Internal Sec:" ""
			setSectorParameter $dsec1 "TUNNELINT" $int
			setSectorParameter $dsec2 "TUNNELINT" $int
		end
	end
	setTextLineTrigger foundbigtunnel :foundbigtunnel "[Found Big Tunnel]"
	pause
:manualsubspace
	getText CURRENTLINE&"  [XX][XX][XX]" $bot~subspace "Ok, you will send and receive sub-space messages on channel " " now.  [XX][XX][XX]"
	savevar $bot~subspace
	settextlinetrigger manualsubspace :manualsubspace "Ok, you will send and receive sub-space messages on channel "
	pause

:busted
	loadvar $player~current_sector
	setSectorParameter $player~current_sector "BUSTED" true
	setSectorParameter 1 "LRA" $player~current_sector
	settextlinetrigger busted :busted "For getting caught your alignment went down by"
	pause

:fakebusted
	loadvar $player~current_sector
	setSectorParameter $player~current_sector "FAKEBUST" true
	settextlinetrigger fakebusted :fakebusted "(You realize the guards saw you last time!)"
	pause

:lracheck
	killtrigger lracheck
	killtrigger lracheck2
	loadvar $player~current_sector
	setSectorParameter 1 "LRA" $player~current_sector
	settextlinetrigger lracheck :lracheck "For stealing from this port, your alignment"
	settextlinetrigger lracheck2 :lracheck "For robbing this port, your alignment"
	pause		

:mcicneg
	cutText CURRENTLINE&"   " $spoof 1 1
	if ($spoof <> "R")
		setTextLineTrigger  mcicneg :mcicneg    "/unit - MCIC "
		pause
	end
	getText CURRENTLINE&"  [XX][XX][XX]" $temp "/unit - MCIC " "  [XX][XX][XX]"
	if ($temp <> "")
		setSectorParameter $target "MCIC" $temp
	end
	setTextLineTrigger  mcicneg :mcicneg    "/unit - MCIC "
	pause


:setShipNumberRaw
	getWord CURRENTLINE $spoof 1
	if ($spoof = "Choose")
		getWord CURRENTLINE $PLAYER~SHIP_NUMBER 8
		isNumber $test $PLAYER~SHIP_NUMBER 
		if ($test = TRUE)
			saveVar $PLAYER~SHIP_NUMBER
		end
	end
	setTextLineTrigger  getShipNumberRaw       :setShipNumberRaw "Choose which ship to beam to (Q=Quit) "
	pause

pause


:setPlanetNumberRaw
	getWord CURRENTLINE $spoof 1
	if ($spoof = "Land")
		getWord CURRENTLINE $planet~planet 9
		isNumber $test $planet~planet
		if ($test = TRUE)
			saveVar $planet~planet
		end
	end
	setTextLineTrigger  getPlanetNumberRaw    :setPlanetNumberRaw "Land on which planet <Q to abort> ? "
	pause

pause

:fedEraseFig
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "The")
		goto :endFedEraseFig
	end
	getText CURRENTLINE&"  [XX][XX][XX]" $temp " fighters in sector " ".  [XX][XX][XX]"
	if ($temp <> "")
		isNumber $test $temp
		if ($test = TRUE)
			if (($temp <= SECTORS) AND ($temp > 0))
				setVar $target $temp
				setSectorParameter $target "MSLSEC" TRUE
				gosub :removefigfromdata
			end
		end
	end
:endFedEraseFig
	setTextLineTrigger  federase        :fedEraseFig        "The Federation We destroyed "
	pause
:eraseFig
	setvar $line CURRENTLINE
	setvar $ansi_line CURRENTANSILINE
	cutText $line&"     " $spoof 1 2 
	cutText $line&"     " $spoof2 1 1 
	if (($spoof = "R ") OR ($spoof = "F ") OR ($spoof = "P ") OR ($spoof2 = "'") OR ($spoof2 = "`"))
		goto :endEraseFig
	end
	getText $line&" [XX][XX][XX]" $temp " destroyed " " [XX][XX][XX]"
	if ($temp <> "")
		getWord $temp $fig_hit 7
		getWord $temp $fig_number 1
		isNumber $test $fig_hit 
		if (($test = TRUE) AND ($fig_number <> "0"))
			if (($fig_hit <= SECTORS) AND ($fig_hit > 0))
				getText $ansi_line $alien_check ": " "'s"
				getWordPos $alien_check $pos #27 & "[1;36m" & #27 & "["
				setVar $target $fig_hit
				if ($pos <= 0)
					setvar $bot~last_fighter_hit $fig_hit
					setvar $bot~last_hit $fig_hit
					saveGlobal $bot~last_fighter_hit
					saveGlobal $bot~last_hit
				end
				gosub :removefigfromdata
			end
		end
	end
:endEraseFig
	setTextLineTrigger fighterserase :eraseFig " of your fighters in sector "
	pause
:eraseWarpFig
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "You")
		setTextLineTrigger      warpfigerase        :eraseWarpFig       "You do not have any fighters in Sector "
		pause
	end
	getText CURRENTLINE&" [XX][XX][XX]" $temp "You do not have any fighters in Sector " ". [XX][XX][XX]"
	if ($temp <> "")
		isNumber $test $temp 
		if ($test)
			if (($temp <= SECTORS) AND ($temp > 0))
				setVar $target $temp
				gosub :removefigfromdata
			end
		end
	end
	setTextLineTrigger      warpfigerase        :eraseWarpFig       "You do not have any fighters in Sector "
	pause
:limpsave
	setvar $line CURRENTLINE
	cutText $line&"     " $spoof 1 2 
	cutText $line&"     " $spoof2 1 1 
	if (($spoof = "R ") OR ($spoof = "F ") OR ($spoof = "P ") OR ($spoof2 = "'") OR ($spoof2 = "`"))
		goto :endSaveLimp
	end
	getText $line&" [XX][XX][XX]" $temp "Limpet mine in " " activated"
	if ($temp <> "")
		setvar $limp_hit $temp
		isNumber $test $limp_hit 
		if ($test = TRUE)
			if (($limp_hit <= SECTORS) AND ($limp_hit > 0))
				setvar $bot~last_limpet_attack $line
				saveGlobal $bot~last_limpet_attack
				setvar $bot~last_hit_type "limpet"
				saveGlobal $bot~last_hit_type
				setvar $bot~last_limpet_hit $limp_hit
				setvar $bot~last_hit $limp_hit
				saveGlobal $bot~last_hit
				saveGlobal $bot~last_limpet_hit
			end
		end
	end
:endSaveLimp
	settextlinetrigger  limpsave		:limpsave	"Limpet mine in "
	pause

:armidsave
	setvar $line CURRENTLINE
	cutText $line&"     " $spoof 1 2 
	cutText $line&"     " $spoof2 1 1 
	if (($spoof = "R ") OR ($spoof = "F ") OR ($spoof = "P ") OR ($spoof2 = "'") OR ($spoof2 = "`"))
		goto :endSaveArmid
	end
	#Your mines in 4441 did 628 damage to Mind
	getText $line&" [XX][XX][XX]" $temp "Your mines in " " did "
	if ($temp <> "")
		setvar $mine_hit $temp
		isNumber $test $mine_hit 
		if ($test = TRUE)
			if (($mine_hit <= SECTORS) AND ($mine_hit > 0))
				setvar $bot~last_armid_attack $line
				saveGlobal $bot~last_armid_attack
				setvar $bot~last_hit_type "armid"
				saveGlobal $bot~last_hit_type
				setvar $bot~last_armid_hit $mine_hit
				setvar $bot~last_hit $mine_hit
				saveGlobal $bot~last_hit
				saveGlobal $bot~last_armid_hit
			end
		end
	end
:endSaveArmid
	setTextLineTrigger 	armidsave 		:armidsave "Your mines in "
	pause



:fightersave
	setvar $line CURRENTLINE
	setvar $ansi_line CURRENTANSILINE
	cutText $line&"     " $spoof 1 2 
	cutText $line&"     " $spoof2 1 1 
	if (($spoof = "R ") OR ($spoof = "F ") OR ($spoof = "P ") OR ($spoof2 = "'") OR ($spoof2 = "`"))
		goto :endfightersave
	end
	getText $ansi_line $alien_check ": " "'s"
	getWordPos $alien_check $pos #27 & "[1;36m" & #27 & "["
	if ($pos > 0)
		goto :endfightersave
	end
	#Deployed Fighters Report Sector 8920: Mind's Imperial StarShip entered sector.
	getText $line&" [XX][XX][XX]" $temp "Deployed Fighters Report Sector " ": "
	if ($temp <> "")
		setvar $fighit $temp
		isNumber $test $fighit 
		if ($test = TRUE)
			if (($fighit <= SECTORS) AND ($fighit > 0))
				setvar $bot~last_hit_type "fighter"
				saveGlobal $bot~last_hit_type
				setvar $bot~last_fighter_attack $line
				saveGlobal $bot~last_fighter_attack
				setvar $bot~ansi_last_fighter_attack $ansi_line
				saveGlobal $bot~ansi_last_fighter_attack
				setvar $bot~last_fighter_hit $fighit
				setvar $bot~last_hit $fighit
				saveGlobal $bot~last_hit
				saveGlobal $bot~last_fighter_hit
			end
		end
	end
:endfightersave
	setTextLineTrigger  fightersave 	:fightersave "Deployed Fighters "
	pause

:erasebusts
	loadvar $bot~subspace
	cutText CURRENTLINE&"   " $spoof 1 1
	getwordpos currentline $pos "<"&$bot~subspace&">["
	getwordpos currentline $pos2 "]<"&$bot~subspace&">"
	if (($pos <= 0) or ($pos2 <= 0))
		setvar $spoof true
	end
	if ($spoof <> "R")
		setTextLineTrigger  clearbusts      :erasebusts     ">[Busted:"
		pause
	end
	getText CURRENTLINE&" [XX][XX][XX]" $temp ">[Busted:" "]<"

	if ($temp <> "")
		isNumber $test $temp
		if ($test)
			if (($temp <= SECTORS) AND ($temp > 0))
				setSectorParameter $temp "BUSTED" FALSE
				setSectorParameter $temp "FAKEBUST" FALSE
			end
		end
	end
	setTextLineTrigger  clearbusts      :erasebusts     ">[Busted:"
	pause

:addFigs
	loadvar $bot~subspace
	cutText CURRENTLINE&"   " $spoof 1 1
	getwordpos currentline $pos "<"&$bot~subspace&">["
	getwordpos currentline $pos2 "]<"&$bot~subspace&">"
	if (($pos <= 0) or ($pos2 <= 0))
		setvar $spoof true
	end
	if ($spoof <> "R")
		setTextLineTrigger  addfigs      :addFigs     ">[Figged:"
	
		pause
	end
	getText CURRENTLINE&" [XX][XX][XX]" $temp ">[Figged:" "]<"
	if ($temp <> "")
		setvar $junk "JUNKJUNK"
		setvar $i 1
		:check_figs_again
			getWord $temp $temp_sector $i $junk
			if ($temp_sector <> $junk)
				isNumber $test $temp_sector
				if ($test)
					setSectorParameter $temp_sector "FIGSEC" true
					getSectorParameter 2 "FIG_COUNT" $figCount
					setSectorParameter 2 "FIG_COUNT" ($figCount+1)
				end
				add $i 1
				goto :check_figs_again
			end
	end
	setTextLineTrigger  addfigs      :addFigs     ">[Figged:"
	pause

:updatePlanetMovement
	cutText CURRENTLINE&"   " $spoof 1 1
	if ($spoof <> "R")
		setTextLineTrigger  planetmoved      :updatePlanetMovement     " moved to sector "
		pause
	end
	getWordPos CURRENTLINE $pos "} - Planet #" 
	getWordPos CURRENTLINE $pos2 " moved to sector " 
	if (($pos > 0) and ($pos2 > 0))
		getWord CURRENTLINE $planet~planet_id 6
		getWord CURRENTLINE $planet~planet_sector 10
		replaceText $planet~planet_id "#" ""
		replaceText $planet~planet_sector "." ""
		isNumber $test $planet~planet_sector
		if ($test)
			setSectorParameter $planet~planet_id "PSECTOR" $planet~planet_sector
		end
	end
	setTextLineTrigger  planetmoved      :updatePlanetMovement     " moved to sector "
	pause

:pgridadd
	cutText CURRENTLINE&"   " $spoof 1 1
	if ($spoof <> "R")
		setTextLineTrigger  pgridadd    :pgridadd   "Successfully P-gridded into sector "
		pause
	end

	getText CURRENTLINE&" [XX][XX][XX]" $temp "Successfully P-gridded into sector " " [XX][XX][XX]"
	if ($temp <> "")
		isNumber $test $temp
		if ($test)
			if (($temp <= SECTORS) AND ($temp > 0))
				setVar $target $temp
				gosub :addfigtodata 
			end
		end
	end
	setTextLineTrigger  pgridadd    :pgridadd   "Successfully P-gridded into sector "
	pause

:pgridxportadd
	cutText CURRENTLINE&"   " $spoof 1 1
	if ($spoof <> "R")
		setTextLineTrigger  pgridxportadd    :pgridxportadd   "Successfully P-gridded w/xport into sector "
		pause
	end

	getText CURRENTLINE&" [XX][XX][XX]" $temp "Successfully P-gridded w/xport into sector " " [XX][XX][XX]"
	if ($temp <> "")
		isNumber $test $temp
		if ($test)
			if (($temp <= SECTORS) AND ($temp > 0))
				setVar $target $temp
				gosub :addfigtodata 
			end
		end
	end
	setTextLineTrigger  pgridxportadd    :pgridxportadd   "Successfully P-gridded w/xport into sector "
	pause

:pgridremove
	cutText CURRENTLINE&"   " $spoof 1 1
	if ($spoof <> "R")
		setTextLineTrigger  pgridremove    :pgridremove   "Unsuccessful P-grid into sector "
		pause
	end

	getText CURRENTLINE&" [XX][XX][XX]" $temp "Unsuccessful P-grid into sector " ". Someone make sure bot is picked up."
	if ($temp <> "")
		isNumber $test $temp
		if ($test)
			if (($temp <= SECTORS) AND ($temp > 0))
				setVar $target $temp
				gosub :removefigfromdata 
			end
		end
	end
	setTextLineTrigger  pgridremove    :pgridremove   "Unsuccessful P-grid into sector "
	pause

:addFig
	isNumber $test CURRENTSECTOR
	if ($test)
		if ((CURRENTSECTOR > 10) AND (CURRENTSECTOR < SECTORS))
			setVar $target CURRENTSECTOR
			gosub :addfigtodata
		end
	end
	setTextLineTrigger      fightersadd     :addFig         "Should they be (D)efensive, (O)ffensive or Charge a (T)oll ?"
	pause



:removeFigFromData
	getSectorParameter $target "FIGSEC" $check
	if ($check = TRUE)
		getSectorParameter 2 "FIG_COUNT" $figCount
		setSectorParameter 2 "FIG_COUNT" ($figCount-1)
	end
	setSectorParameter $target "FIGSEC" FALSE
return
:addFigToData
	setSectorParameter $target "FIGSEC" TRUE
return


# ============================== START GET PLANET STATS TRIGGERS==============================
:setPlanetNumber
	getWordPos RAWPACKET $pos "Planet " & #27 & "[1;33m#" & #27 & "[36m"
	if ($pos > 0)
		getText RAWPACKET $planet~planet "Planet " & #27 & "[1;33m#" & #27 & "[36m" #27 & "[0;32m in sector "
		isNumber $test $planet~planet 
		if ($test = TRUE)
			saveVar $planet~planet
			setSectorParameter $planet~planet "PSECTOR" CURRENTSECTOR
		end
	end
	setTextLineTrigger  getPlanetNumber :setPlanetNumber    "Planet #"
	pause
# =============================== END GET PLANET STATS TRIGGERS===============================
# ============================== CHECK SECTOR DATA ========================================
:checkSectorData
	getText CURRENTLINE $cursec "]:[" "] ("
	if ($cursec = CURRENTSECTOR)
		setVar $PLAYER~CURRENT_SECTOR $cursec
		saveVar $PLAYER~CURRENT_SECTOR
		getSectorParameter $PLAYER~CURRENT_SECTOR "BUSTED" $isBusted
		loadVar $BOT~command_prompt_extras
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
		saveVar $SHIP~SHIP_OFFENSIVE_ODDS
		gettext CURRENTANSILINE $SHIP~SHIP_FIGHTERS_MAX "Max Fighters[1;33m:[36m" "[0;32m Offensive Odds"
		stripText $SHIP~SHIP_FIGHTERS_MAX ","
		stripText $SHIP~SHIP_FIGHTERS_MAX " "
		saveVar $SHIP~SHIP_FIGHTERS_MAX
	end
	setTextLineTrigger  getshipstats    :setShipOffensiveOdds   "Offensive Odds: "
	pause
:setShipMaxFigAttack
	getWordPos CURRENTANSILINE $pos "[0m[32m Max Figs Per Attack[1;33m:[36m"
	if ($pos > 0)
		getText CURRENTANSILINE $SHIP~SHIP_MAX_ATTACK "[0m[32m Max Figs Per Attack[1;33m:[36m" "[0;32mTransWarp"
		striptext $SHIP~SHIP_MAX_ATTACK " "
		saveVar $SHIP~SHIP_MAX_ATTACK
	end
	setTextLineTrigger  getshipmaxfighters  :setShipMaxFigAttack    " TransWarp Drive:   "
	pause
# ============================== END GET SHIP STATS TRIGGERS==============================
return

:captureLevelPlanet
#do better ansi checks for spoofing
getWordPos CURRENTANSILINE $pos "[32mLevel [1;33m"
if ($pos > 0)
	getWord CURRENTLINE $planet~planet_sector 1
	getWord CURRENTLINE $planet~planet_id 2
	if ($planet~planet_id = "T")
		getWord CURRENTLINE $planet~planet_id 3
	end
	replaceText $planet~planet_id "#" ""
	isNumber $test $planet~planet_id
	getWordPos $planet~planet_id $pos "."
	if (($test = TRUE) and ($pos <= 0))
		if ($planet~planet_id > 0)
			setSectorParameter $planet~planet_id "PSECTOR" $planet~planet_sector
		end
	end
end
setTextLineTrigger  captureLevelPlanet  :captureLevelPlanet " Level "
pause

:captureNoLevelPlanet
getWordPos CURRENTANSILINE $pos "[32m No Citadel"
if ($pos > 0)
	getWord CURRENTLINE $planet~planet_sector 1
	getWord CURRENTLINE $planet~planet_id 2
	if ($planet~planet_id = "T")
		getWord CURRENTLINE $planet~planet_id 3
	end
	replaceText $planet~planet_id "#" ""
	isNumber $test $planet~planet_id
	getWordPos $planet~planet_id $pos "."
	if (($test = TRUE) and ($pos <= 0))
		if ($planet~planet_id > 0)
			setSectorParameter $planet~planet_id "PSECTOR" $planet~planet_sector
		end
	end
end
setTextLineTrigger  captureNoLevelPlanet  :captureNoLevelPlanet " No Citadel"
pause

:shipdestroyed

getWordPos CURRENTANSILINE $pos "[32mYou will have to start over"
if ($pos > 0)
	DISCONNECT
	setVar $BOT~isShipDestroyed TRUE
	saveVar $BOT~isShipDestroyed
	setVar $i 1
	setVar $found FALSE
	setVar $rebooted FALSE
	echo "Mombot rebooting..**"
	setdelaytrigger waitforrebootlist :listokaynow 1500
	pause
	:listokaynow
	listActiveScripts $scripts
	while ($i <= $scripts)
		getWordPos "<><><>"&$scripts[$i] $pos "<><><>mombot"
		if ($pos > 0)
			if ($rebooted = FALSE)
				setdelaytrigger waitforreboot :okaynow 3000
				pause
				:okaynow
				load "scripts\mombot\"&$scripts[$i]
				setvar $rebooted true
			end
			stop $scripts[$i]
			setVar $found TRUE
		end
		add $i 1
	end
	if ($FOUND = FALSE)
		echo "No mombot script found to reboot.**"
	end
end

setTextLineTrigger  shipdestroyed         :shipdestroyed "You will have to start over from scratch!"
pause

:emergency_reboot
	loadvar $bot~subspace
	loadvar $bot~bot_name
	loadvar $bot~bot_password
	getwordpos currentline $pos $bot~bot_name&" "&$bot~subspace&"<EMERGENCY REBOOT>"&$bot~bot_password
	if ($pos <= 0)
		setTextLineTrigger  emergency_reboot      :emergency_reboot "<EMERGENCY REBOOT>"&$bot~bot_password
		pause
	end
	setVar $i 1
	setVar $found FALSE
	setVar $rebooted FALSE
	setdelaytrigger listokaynowemergency :listokaynowemergency 1500
	pause
	:listokaynowemergency
	listActiveScripts $scripts
	while ($i <= $scripts)
		getWordPos "<><><>"&$scripts[$i] $pos "mombot"
		if ($pos > 0)
			stop $scripts[$i]
			if ($found = FALSE)
				setVar $boot_this $scripts[$i]
				setVar $found TRUE
			end
		end
		add $i 1
	end
	if ($FOUND = FALSE)
		ECHO "No mombot script found to kill, so assuming default of mombot.cts*"
		setvar $boot_this "mombot.cts"
	end
	setdelaytrigger okaynowemergency :okaynowemergency 3000
	pause
	:okaynowemergency
	load "scripts\mombot\"&$boot_this
	setTextLineTrigger  emergency_reboot      :emergency_reboot "<EMERGENCY REBOOT>"&$bot~bot_password
	pause

:checkifbotalive
	loadvar $bot~do_not_resuscitate
	loadVar $map~stardock
	loadvar $bot~subspace
	loadvar $bot~bot_password
	loadvar $bot~bot_name

	if ($bot~do_not_resuscitate <> true)
		setvar $found false
		listActiveScripts $scripts
		setvar $i 1
		while (($i <= $scripts) and ($found = false))
			getWordPos "<><><>"&$scripts[$i] $pos "mombot"
			if ($pos > 0)
				if ($found = FALSE)
					setVar $found TRUE
				end
			end
			add $i 1
		end
		if ($FOUND = FALSE)
			ECHO "**"&ansi_2&"["&ansi_4&"No mombot is running, automatically booting up mombot."&ansi_2&"]**"
			load "scripts\mombot\mombot.cts"
		end
		setdelaytrigger		checkifbotalive       :checkifbotalive 60000
		pause
	end
