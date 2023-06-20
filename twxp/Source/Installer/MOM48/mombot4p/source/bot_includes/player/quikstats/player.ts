#=================================QUIKSTATS================================================
:quikstats
	setVar $CURRENT_PROMPT      "Undefined"
	killtrigger noprompt
	killtrigger prompt
	killtrigger statlinetrig
	killtrigger getLine2
	setvar $fedspace false
	if ($towed = "0")
		setvar $towed ""
	end
	loadvar $unlimitedGame
	setTextLineTrigger  prompt      :allPrompts     #145 & #8
	setTextLineTrigger  statlinetrig    :statStart      #179
	send #145&"/"
	pause
	:allPrompts
		setvar $ansiline currentansiline
		setvar $self_destruct_prompt false
		getwordpos $ansiline $pos "ARE YOU SURE CAPTAIN? (Y/N) [N]"
		if ($pos > 0)
			setvar $self_destruct_prompt true
		end

		getWord CURRENTLINE $CURRENT_PROMPT 1
		setVar $FULL_CURRENT_PROMPT CURRENTLINE
		stripText $FULL_CURRENT_PROMPT #145
		stripText $FULL_CURRENT_PROMPT #8
		stripText $CURRENT_PROMPT #145
		stripText $CURRENT_PROMPT #8
		setTextLineTrigger  prompt      :allPrompts     #145 & #8
		pause
	:statStart
		killtrigger prompt
		setVar $stats ""
		setVar $wordy ""
	:statsline
		killtrigger statlinetrig
		killtrigger getLine2
		setVar $line2 CURRENTLINE
		replacetext $line2 #179 " "
		striptext $line2 ","
		setVar $stats $stats & $line2
		getWordPos $line2 $pos "Ship"
		if ($pos > 0)
			goto :gotStats
		else
			setTextLineTrigger getLine2 :statsline
			pause
		end
	:gotStats
		setVar $stats $stats & " @@@"
		setVar $current_word 0
		while ($wordy <> "@@@")
			if ($wordy = "Sect")
				getWord $stats $CURRENT_SECTOR      ($current_word + 1)
				if (($current_sector <= 10) or ($current_sector = STARDOCK) or ($current_sector = $map~stardock))
					setvar $fedspace true
				end
			elseif ($wordy = "Turns")
				getWord $stats $TURNS           ($current_word + 1)
				if ($unlimitedGame = TRUE)
					setVar $TURNS 65000
				end
			elseif ($wordy = "Creds")
				getWord $stats $CREDITS         ($current_word + 1)
			elseif ($wordy = "Figs")
				getWord $stats $FIGHTERS        ($current_word + 1)
				savevar $fighters
			elseif ($wordy = "Shlds")
				getWord $stats $SHIELDS         ($current_word + 1)
				savevar $shields
			elseif ($wordy = "Hlds")
				getWord $stats $TOTAL_HOLDS         ($current_word + 1)
			elseif ($wordy = "Ore")
				getWord $stats $ORE_HOLDS           ($current_word + 1)
			elseif ($wordy = "Org")
				getWord $stats $ORGANIC_HOLDS       ($current_word + 1)
			elseif ($wordy = "Equ")
				getWord $stats $EQUIPMENT_HOLDS     ($current_word + 1)
			elseif ($wordy = "Col")
				getWord $stats $COLONIST_HOLDS      ($current_word + 1)
			elseif ($wordy = "Phot")
				getWord $stats $PHOTONS         ($current_word + 1)
			elseif ($wordy = "Armd")
				getWord $stats $ARMIDS          ($current_word + 1)
			elseif ($wordy = "Lmpt")
				getWord $stats $LIMPETS         ($current_word + 1)
			elseif ($wordy = "GTorp")
				getWord $stats $GENESIS         ($current_word + 1)
			elseif ($wordy = "TWarp")
				getWord $stats $TWARP_TYPE          ($current_word + 1)
			elseif ($wordy = "Clks")
				getWord $stats $CLOAKS          ($current_word + 1)
			elseif ($wordy = "Beacns")
				getWord $stats $BEACONS         ($current_word + 1)
			elseif ($wordy = "AtmDt")
				getWord $stats $ATOMIC          ($current_word + 1)
			elseif ($wordy = "Corbo")
				getWord $stats $CORBO           ($current_word + 1)
			elseif ($wordy = "EPrb")
				getWord $stats $EPROBES         ($current_word + 1)
			elseif ($wordy = "MDis")
				getWord $stats $MINE_DISRUPTORS     ($current_word + 1)
			elseif ($wordy = "PsPrb")
				getWord $stats $PSYCHIC_PROBE       ($current_word + 1)
			elseif ($wordy = "PlScn")
				getWord $stats $PLANET_SCANNER      ($current_word + 1)
			elseif ($wordy = "LRS")
				getWord $stats $SCAN_TYPE           ($current_word + 1)
			elseif ($wordy = "Aln")
				getWord $stats $ALIGNMENT           ($current_word + 1)
			elseif ($wordy = "Exp")
				getWord $stats $EXPERIENCE          ($current_word + 1)
			elseif ($wordy = "Corp")
				getWord $stats $CORP            ($current_word + 1)
				setvar $corpnumber $corp
				savevar $corpnumber
			elseif ($wordy = "Ship")
				getWord $stats $SHIP_NUMBER         ($current_word + 1)
				getWord $stats $SHIP_TYPE         ($current_word + 2)
			end
			add $current_word 1
			getWord $stats $wordy $current_word
		end
	:doneQuikstats
	killtrigger statlinetrig
	killtrigger getLine2
	saveVar $unlimitedGame
	if ($save)
		savevar $corp
		saveVar $CREDITS
		saveVar $CURRENT_SECTOR
		saveVar $TURNS
		saveVar $FIGHTERS
		saveVar $SHIELDS
		saveVar $TOTAL_HOLDS
		saveVar $ORE_HOLDS
		saveVar $ORGANIC_HOLDS
		saveVar $EQUIPMENT_HOLDS
		saveVar $COLONIST_HOLDS
		saveVar $PHOTONS
		saveVar $ARMIDS
		saveVar $LIMPETS
		saveVar $GENESIS
		saveVar $TWARP_TYPE
		saveVar $CLOAKS
		saveVar $BEACONS
		saveVar $ATOMIC
		saveVar $CORBO
		saveVar $EPROBES
		saveVar $MINE_DISRUPTORS
		saveVar $PSYCHIC_PROBE
		saveVar $PLANET_SCANNER
		saveVar $SCAN_TYPE
		saveVar $ALIGNMENT
		saveVar $EXPERIENCE
		saveVar $SHIP_NUMBER
		saveVar $TRADER_NAME
	end
return
# ============================== END QUICKSTATS SUB==============================
