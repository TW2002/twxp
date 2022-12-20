# ============================== GAME STATS ==============================
:gamestats
	send ":y"
    if ($PLAYER~startingLocation = "Citadel")
        send "qqzn"
    end
    if (($PLAYER~startingLocation = "Command") OR ($PLAYER~startingLocation = "Citadel"))
        send "vqyn"
        send #42 "*"
        setTextLineTrigger settings1 :findGold "Gold Enabled="
        setTextLineTrigger settings2 :findMBBS "MBBS Compatibility="
        setTextLineTrigger settings3 :findAliens "Internal Aliens="
        setTextLineTrigger settings4 :findFerrengi "Internal Ferrengi="
        setTextLineTrigger settings5 :findMaxCommands "Max Commands="
        setTextLineTrigger settings6 :findInactive "Inactive Time="
        setTextLineTrigger settings7 :findColoRegen "Colonist Regen Rate="
        setTextLineTrigger settings8 :findPhotonDur "Photon Missile Duration="
        setTextLineTrigger settings9 :findDebris "Debris Loss Percent="
        setTextLineTrigger settings10 :findTradePercent "Trade Percent="
        setTextLineTrigger settings11 :findProductionRate "Production Rate="
        setTextLineTrigger settings12 :findMaxProductionRate "Max Production Regen="
        setTextLineTrigger settings13 :findMultiplePhotons "Multiple Photons="
        setTextLineTrigger settings14 :findClearBusts "Clear Bust Days="
        setTextLineTrigger settings15 :findStealFactor "Steal Factor="
        setTextLineTrigger settings16 :findRobFactor "Rob Factor="
        setTextLineTrigger settings17 :findPortMax "Port Production Max="
        setTextLineTrigger settings18 :findRadiation "Radiation Lifetime="
        setTextLineTrigger Reregister :Reregister "Reregister Ship="
        setTextLineTrigger settings37 :findLimpetRemoval "Limpet Removal="
        setTextLineTrigger settings20 :findGenesis "Genesis Torpedo="
        setTextLineTrigger settings21 :findArmid "Armid Mine="
        setTextLineTrigger settings22 :findLimpet "Limpet Mine="
        setTextLineTrigger settings23 :findBeacon "Beacon="
        setTextLineTrigger settings24 :findTwarpI "Type I TWarp="
        setTextLineTrigger settings25 :findTwarpII "Type II TWarp="
        setTextLineTrigger settings26 :findTwarpUpgrade "TWarp Upgrade="
        setTextLineTrigger settings27 :findPsychic "Psychic Probe="
        setTextLineTrigger settings28 :findPlanetScanner "Planet Scanner="
        setTextLineTrigger settings29 :findAtomic "Atomic Detonator="
        setTextLineTrigger settings30 :findCorbo "Corbomite="
        setTextLineTrigger settings31 :findEther "Ether Probe="
        setTextLineTrigger settings32 :findPhoton "Photon Missile="
        setTextLineTrigger settings33 :findCloak "Cloaking Device="
        setTextLineTrigger settings34 :findDisruptor  "Mine Disruptor="
        setTextLineTrigger settings35 :findHoloScanner "Holographic Scanner="
        setTextLineTrigger settings36 :findDensityScan "Density Scanner="
        setTextLineTrigger settings38 :findMaxPlanets "Max Planet Sector="
        setTextLineTrigger settings39 :findMaxGamePlanets ", sectors"
        setTextLineTrigger settings40 :findFedSpacePhotons "FedSpace Photons="
        pause
        :findGold
            getWord CURRENTLINE $check 2
            stripText $check "Enabled="
            if ($check = "True")
                setVar $goldEnabled TRUE
                saveVar $goldEnabled
            else
                setVar $goldEnabled FALSE
                saveVar $goldEnabled
            end
            pause
	:findFedSpacePhotons
	    getWord CURRENTLINE $check 2
            stripText $check "Photons="
            if ($check = "True")
                setVar $fedSpacePhotons TRUE
                saveVar $fedSpacePhotons
            else
                setVar $fedSpacePhotons FALSE
                saveVar $fedSpacePhotons
            end
            pause
		
        :findMaxPlanets
            getWord CURRENTLINE $check 3
            stripText $check "Sector="
            setVar $MAX_PLANETS_PER_SECTOR $check
            saveVar $MAX_PLANETS_PER_SECTOR
            pause
        :findMaxGamePlanets
            getWord CURRENTLINE $check 9
	    stripText $check "."
            setVar $MAX_PLANETS_IN_GAME $check
            saveVar $MAX_PLANETS_IN_GAME
            pause
        :findMBBS
            getWord CURRENTLINE $mbbs_ck 2
            stripText $mbbs_ck "Compatibility="
            if ($mbbs_ck = "True")
                setVar $mbbs TRUE
                saveVar $mbbs
            elseif ($mbbs_ck = "False")
                setVar $mbbs FALSE
                saveVar $mbbs
            end
            pause
        :findAliens
            getWord CURRENTLINE $check 2
            stripText $check "Aliens="
            if ($check = "True")
                setVar $internalAliens TRUE
                saveVar $internalAliens
            elseif ($check = "False")
                setVar $internalAliens FALSE
                saveVar $internalAliens
            end
            pause
        :findFerrengi
            getWord CURRENTLINE $check 2
            stripText $check "Ferrengi="
            if ($check = "True")
                setVar $internalFerrengi TRUE
                saveVar $internalFerrengi
            elseif ($check = "False")
                setVar $internalFerrengi FALSE
                saveVar $internalFerrengi
            end
            pause
        :findMaxCommands
            getWord CURRENTLINE $check 2
            stripText $check "Commands="
            setVar $MAX_COMMANDS $check
            saveVar $MAX_COMMANDS
            pause
        :findInactive
            getWord CURRENTLINE $check 2
            stripText $check "Time="
            setVar $INACTIVE_TIME $check
            saveVar $INACTIVE_TIME
            pause
        :findColoRegen
            setVar $line CURRENTLINE
            stripText $line "Colonist Regen Rate="
            stripText $line ","
            lowerCase $line
            replaceText $line "m" "000000"
            replaceText $line "k" "000"
            setVar $colonist_regen $line
            saveVar $colonist_regen
            pause
        :findPhotonDur
            getWord CURRENTLINE $check 3
            stripText $check "Duration="
            setVar $PHOTON_DURATION $check
            saveVar $PHOTON_DURATION
            if ($PHOTON_DURATION <= 0)
                setVar $PHOTONS_ENABLED FALSE
            else
                setVar $PHOTONS_ENABLED TRUE
            end
            saveVar $PHOTONS_ENABLED
            pause
        :findDebris
            getWord CURRENTLINE $check 3
            stripText $check "Percent="
            stripText $check "%"
            setVar $DEBRIS_LOSS $check
            saveVar $DEBRIS_LOSS
            pause
        :findTradePercent
            getWord CURRENTLINE $ptradesetting 2
            stripText $ptradesetting "Percent="
            stripText $ptradesetting "%"
            saveVar $ptradesetting
            pause
        :findProductionRate
            getWord CURRENTLINE $PRODUCTION_RATE 2
            stripText $PRODUCTION_RATE "Rate="
            saveVar $PRODUCTION_RATE
            pause
        :findMaxProductionRate
            getWord CURRENTLINE $PRODUCTION_REGEN 3
            stripText $PRODUCTION_REGEN "Regen="
            saveVar $PRODUCTION_REGEN
            pause
        :findMultiplePhotons
            getWord CURRENTLINE $MULTIPLE_PHOTONS 2
            stripText $MULTIPLE_PHOTONS "Photons="
            saveVar $MULTIPLE_PHOTONS
            pause
        :findClearBusts
            getWord CURRENTLINE $CLEAR_BUST_DAYS 3
            stripText $CLEAR_BUST_DAYS "Days="
            saveVar $CLEAR_BUST_DAYS
            pause
        :findStealFactor
            getWord CURRENTLINE $steal_factor 2
            stripText $steal_factor "Factor="
            stripText $steal_factor "%"
            saveVar $STEAL_FACTOR
            pause
        :findRobFactor
            getWord CURRENTLINE $rob_factor 2
            stripText $rob_factor "Factor="
            stripText $rob_factor "%"
            saveVar $rob_factor
            pause
        :findPortMax
            setVar $line CURRENTLINE
            stripText $line "Port Production Max="
            setVar $port_max $line
            saveVar $port_max
            pause
        :findRadiation
            getWord CURRENTLINE $RADIATION_LIFETIME 2
            stripText $RADIATION_LIFETIME "Lifetime="
            saveVar $RADIATION_LIFETIME
            pause
        :findLimpetRemoval
            getWord CURRENTLINE $LIMPET_REMOVAL_COST 2
            stripText $LIMPET_REMOVAL_COST "Removal="
            stripText $LIMPET_REMOVAL_COST ","
            stripText $LIMPET_REMOVAL_COST "$"
            saveVar $LIMPET_REMOVAL_COST
            setVar  $LSD_LIMPREMOVALCOST $LIMPET_REMOVAL_COST
            saveVar $LSD_LIMPREMOVALCOST
            pause
        :findGenesis
            getWord CURRENTLINE $GENESIS_COST 2
            stripText $GENESIS_COST "Torpedo="
            stripText $GENESIS_COST ","
            stripText $GENESIS_COST "$"
            saveVar $GENESIS_COST
            setVar  $LSD_GENCOST $GENESIS_COST
            saveVar $LSD_GENCOST
            pause
        :findArmid
            getWord CURRENTLINE $ARMID_COST 2
            stripText $ARMID_COST "Mine="
            stripText $ARMID_COST ","
            stripText $ARMID_COST "$"
            saveVar $ARMID_COST
            setVar  $LSD_ARMIDCOST $ARMID_COST
            saveVar $LSD_ARMIDCOST
            pause
        :findLimpet
            getWord CURRENTLINE $LIMPET_COST 2
            stripText $LIMPET_COST "Mine="
            stripText $LIMPET_COST ","
            stripText $LIMPET_COST "$"
            saveVar $LIMPET_COST
            setVar  $LSD_LIMPCOST $LIMPET_COST
            saveVar $LSD_LIMPCOST
            pause
        :findBeacon
            getWord CURRENTLINE $BEACON_COST 1
            stripText $BEACON_COST "Beacon="
            stripText $BEACON_COST ","
            stripText $BEACON_COST "$"
            saveVar $BEACON_COST
            setVar $LSD_BEACON $BEACON_COST
            saveVar $LSD_BEACON
            pause
        :findTwarpI
            getWord CURRENTLINE $TWARPI_COST 3
            stripText $TWARPI_COST "TWarp="
            stripText $TWARPI_COST ","
            stripText $TWARPI_COST "$"
            saveVar $TWARPI_COST
            setVar $LSD_TWARPICOST $TWARPI_COST
            saveVar $LSD_TWARPICOST
            pause
        :findTwarpII
            getWord CURRENTLINE $TWARPII_COST 3
            stripText $TWARPII_COST "TWarp="
            stripText $TWARPII_COST ","
            stripText $TWARPII_COST "$"
            saveVar $TWARPII_COST
            setVar $LSD_TWARPIICOST $TWARPII_COST
            saveVar $LSD_TWARPIICOST
            pause
        :findTwarpUpgrade
            getWord CURRENTLINE $TWARP_UPGRADE_COST 2
            stripText $TWARP_UPGRADE_COST "Upgrade="
            stripText $TWARP_UPGRADE_COST ","
            stripText $TWARP_UPGRADE_COST "$"
            saveVar $TWARP_UPGRADE_COST
            setVar $LSD_TWARPUPCOST $TWARP_UPGRADE_COST
            saveVar $LSD_TWARPUPCOST
            pause
        :findPsychic
            getWord CURRENTLINE $PSYCHIC_COST 2
            stripText $PSYCHIC_COST "Probe="
            stripText $PSYCHIC_COST ","
            stripText $PSYCHIC_COST "$"
            saveVar $PSYCHIC_COST
            pause
        :findPlanetScanner
            getWord CURRENTLINE $PLANET_SCANNER_COST 2
            stripText $PLANET_SCANNER_COST "Scanner="
            stripText $PLANET_SCANNER_COST ","
            stripText $PLANET_SCANNER_COST "$"
            saveVar $PLANET_SCANNER_COST
            setVar $LSD_PSCAN $PLANET_SCANNER_COST
            saveVar $LSD_PSCAN
            pause
        :findAtomic
            getWord CURRENTLINE $ATOMIC_COST 2
            stripText $ATOMIC_COST "Detonator="
            stripText $ATOMIC_COST ","
            stripText $ATOMIC_COST "$"
            saveVar $ATOMIC_COST
            setVar $LSD_ATOMICCOST $ATOMIC_COST
            saveVar $LSD_ATOMICCOST
            pause
        :Reregister
            killTrigger Reregister
            gosub :GetCost
            setVar $lsd_ReRegisterCost $LSD_Cost
            saveVar $lsd_ReRegisterCost
            pause
        :findCorbo
            getWord CURRENTLINE $CORBO_COST 1
            stripText $CORBO_COST "Corbomite="
            stripText $CORBO_COST ","
            stripText $CORBO_COST "$"
            saveVar $CORBO_COST
            setVar $LSD_CORBOCOST $CORBO_COST
            saveVar $LSD_CORBOCOST
            pause
        :findEther
            getWord CURRENTLINE $PROBE_COST 2
            stripText $PROBE_COST "Probe="
            stripText $PROBE_COST ","
            stripText $PROBE_COST "$"
            saveVar $PROBE_COST
            setVar $LSD_EPROBE $PROBE_COST
            saveVar $LSD_EPROBE
            pause
        :findPhoton
            getWord CURRENTLINE $PHOTON_COST 2
            stripText $PHOTON_COST "Missile="
            stripText $PHOTON_COST ","
            stripText $PHOTON_COST "$"
            saveVar $PHOTON_COST
            setVar $LSD_PHOTONCOST $PHOTON_COST
            saveVar $LSD_PHOTONCOST
            pause
        :findCloak
            getWord CURRENTLINE $CLOAK_COST 2
            stripText $CLOAK_COST "Device="
            stripText $CLOAK_COST ","
            stripText $CLOAK_COST "$"
            saveVar $CLOAK_COST
            setVar $LSD_CLOAKCOST $CLOAK_COST
            saveVar $LSD_CLOAKCOST
            pause
        :findDisruptor
            getWord CURRENTLINE $DISRUPTOR_COST 2
            stripText $DISRUPTOR_COST "Disruptor="
            stripText $DISRUPTOR_COST ","
            stripText $DISRUPTOR_COST "$"
            saveVar $DISRUPTOR_COST
            setVar $LSD_DISRUPTCOST $DISRUPTOR_COST
            saveVar $LSD_DISRUPTCOST
            pause
        :findHoloScanner
            getWord CURRENTLINE $HOLO_COST 2
            stripText $HOLO_COST "Scanner="
            stripText $HOLO_COST ","
            stripText $HOLO_COST "$"
            saveVar $HOLO_COST
            setVar $LSD_HOLOCOST $HOLO_COST
            saveVar $LSD_HOLOCOST
            pause
        :findDensityScan
	
            getWord CURRENTLINE $DENSITY_COST 2
            stripText $DENSITY_COST "Scanner="
            stripText $DENSITY_COST ","
            stripText $DENSITY_COST "$"
            saveVar $DENSITY_COST
            setVar $LSD_DSCANCOST $DENSITY_COST
            saveVar $LSD_DSCANCOST
            setVar $fileHeadings "MBBS     COLO_REGEN     PTRADE     SF     RF     PORTMAX"
            setVar $fileOutput $mbbs&"     "&$colonist_regen&"     "&$ptradesetting&"     "&$steal_factor&"     "&$rob_factor&"     "&$port_max
            delete $GAME_SETTINGS_FILE
            write $GAME_SETTINGS_FILE $fileHeadings
            write $GAME_SETTINGS_FILE $fileOutput
            setVar $steal_factor ((30*$steal_factor)/100)
            saveVar $steal_factor
            setVar $rob_factor ((3*100)/$rob_factor)
            saveVar $rob_factor

            send "x*"

			setTextTrigger      prompt          :allPromptsCatch        ""
			setDelayTrigger     prompt_delay    :current_prompt_delay   5000
			send "?"
			pause
			:current_prompt_delay
				# should have the last line in the server menu by now #
				killtrigger prompt
				goto :back_to_game

			:allPromptsCatch
				setvar $game_menu_prompt CURRENTLINE
				setvar $game_menu_prompt_ansi CURRENTANSILINE
				savevar $game_menu_prompt
				savevar $game_menu_prompt_ansi
				setTextTrigger      prompt          :allPromptsCatch        ""
				pause

			:back_to_game
            send $bot~letter&" * t*n*"
            if (PASSWORD = "")
                send $BOT~password
            else
                send PASSWORD
            end
            if ($fedSpacePhotons = "")
		# Setting not available in v1, so forcing save here.
		setVar $fedSpacePhotons FALSE
		saveVar $fedSpacePhotons
            end
            send "   *   *  zaz*z*za9999*z*"
            #if ($PLAYER~CURRENT_SECTOR > 11) and ($PLAYER~CURRENT_SECTOR <> $MAP~STARDOCK)
            #    send "f1*cd"
            #end
            gosub :PLAYER~quikstats
    end
    killtrigger settings5
    setVar $gamestats TRUE
    saveVar $gamestats
return
# ============================== END GAME STATS SUB ==============================

:GetCost
    setVar $LSD_Cost 0
    getWordPos CURRENTLINE $LSD_pos "="
    if ($LSD_pos <> 0)
        cutText CURRENTLINE $LSD_Cost ($LSD_pos + 1) 999
        striptext $LSD_Cost " cr"
    end
return
