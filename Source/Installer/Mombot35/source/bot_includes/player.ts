#Author: Mind Dagger
#Gets player stats from the hitting the / key.  Also grabs the current prompt that you are at.
#The only prompt this will stall on is in the middle of chatting
#gotStats routine by Dynarri/Singularity
#added getinfo and current_prompt subs as well since they share the same variables they are updating

:init
# ============================ START SECTOR DATA VARIABLES ==========================
    setArray $TRADERS   50
    setArray $FAKETRADERS   50
    setArray $EMPTYSHIPS   100
    setVar $ranksLength     46
    setArray $ranks     $ranksLength
    setVar $ranks[1]    "36mCivilian"
    setVar $ranks[2]    "36mPrivate 1st Class"
    setVar $ranks[3]    "36mPrivate"
    setVar $ranks[4]    "36mLance Corporal"
    setVar $ranks[5]    "36mCorporal"
    setVar $ranks[6]    "36mStaff Sergeant"
    setVar $ranks[7]    "36mGunnery Sergeant"
    setVar $ranks[8]    "36m1st Sergeant"
    setVar $ranks[9]    "36mSergeant Major"
    setVar $ranks[10]   "36mSergeant"
    setVar $ranks[11]   "31mAnnoyance"
    setVar $ranks[12]   "31mNuisance 3rd Class"
    setVar $ranks[13]   "31mNuisance 2nd Class"
    setVar $ranks[14]   "31mNuisance 1st Class"
    setVar $ranks[15]   "31mMenace 3rd Class"
    setVar $ranks[16]   "31mMenace 2nd Class"
    setVar $ranks[17]   "31mMenace 1st Class"
    setVar $ranks[18]   "31mSmuggler 3rd Class"
    setVar $ranks[19]   "31mSmuggler 2nd Class"
    setVar $ranks[20]   "31mSmuggler 1st Class"
    setVar $ranks[21]   "31mSmuggler Savant"
    setVar $ranks[22]   "31mRobber"
    setVar $ranks[23]   "31mTerrorist"
    setVar $ranks[24]   "31mInfamous Pirate"
    setVar $ranks[25]   "31mNotorious Pirate"
    setVar $ranks[26]   "31mDread Pirate"
    setVar $ranks[27]   "31mPirate"
    setVar $ranks[28]   "31mGalactic Scourge"
    setVar $ranks[29]   "31mEnemy of the State"
    setVar $ranks[30]   "31mEnemy of the People"
    setVar $ranks[31]   "31mEnemy of Humankind"
    setVar $ranks[32]   "31mHeinous Overlord"
    setVar $ranks[33]   "31mPrime Evil"
    setVar $ranks[34]   "36mChief Warrant Officer"
    setVar $ranks[35]   "36mWarrant Officer"
    setVar $ranks[36]   "36mEnsign"
    setVar $ranks[37]   "36mLieutenant J.G."
    setVar $ranks[38]   "36mLieutenant Commander"
    setVar $ranks[39]   "36mLieutenant"
    setVar $ranks[40]   "36mCommander"
    setVar $ranks[41]   "36mCaptain"
    setVar $ranks[42]   "36mCommodore"
    setVar $ranks[43]   "36mRear Admiral"
    setVar $ranks[44]   "36mVice Admiral"
    setVar $ranks[45]   "36mFleet Admiral"
    setVar $ranks[46]   "36mAdmiral"
    setVar $lastTarget  ""

# ============================ END SECTOR DATA VARIABLES ==========================
return

#=================================QUIKSTATS================================================
:quikstats
    setVar $CURRENT_PROMPT      "Undefined"
    killtrigger noprompt
    killtrigger prompt
    killtrigger statlinetrig
    killtrigger getLine2
    setvar $fedspace false
    loadvar $unlimitedGame
    setTextLineTrigger  prompt      :allPrompts     #145 & #8
    setTextLineTrigger  statlinetrig    :statStart      #179
    send #145&"/"
    pause
    :allPrompts
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
            elseif ($wordy = "Shlds")
                getWord $stats $SHIELDS         ($current_word + 1)
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

# ============================  START PLAYER INFO SUBROUTINE  =================
:getInfo
    setvar $NOFLIP  true
    setVar $PHOTONS 0
    setVar $SCAN_TYPE "None"
    setVar $TWARP_TYPE 0
    setVar $CORPstring "[0]"
    setVar $igstat 0
    :waitOnInfo
    send "?"
    waitOn "<!>"
        setTextLineTrigger getInfo_CN9_Check_1      :getInfo_CN9_Check "<N> Interdictor Control"
        setTextLineTrigger getInfo_CN9_Check_2      :getInfo_CN9_Check "<N> Move to NavPoint"
        setTextLineTrigger getTraderName            :getTraderName "Trader Name    :"
        setTextLineTrigger getExpAndAlign           :getExpAndAlign "Rank and Exp"
        setTextLineTrigger getCorp                  :getCorp "Corp           #"
        setTextLineTrigger getShipType              :getShipType "Ship Info      :"
        setTextLineTrigger getTPW                   :getTPW "Turns to Warp  :"
        setTextLineTrigger getSect                  :getSect "Current Sector :"
        setTextLineTrigger getTurns                 :getTurns "Turns left"
        setTextLineTrigger getHolds                 :getHolds "Total Holds"
        setTextLineTrigger getFighters              :getFighters "Fighters       :"
        setTextLineTrigger getShields               :getShields "Shield points  :"
        setTextLineTrigger getPhotons               :getPhotons "Photon Missiles:"
        setTextLineTrigger getScanType              :getScanType "LongRange Scan :"
        setTextLineTrigger getTwarpType1            :getTwarpType1 "  (Type 1 Jump):"
        setTextLineTrigger getTwarpType2            :getTwarpType2 "  (Type 2 Jump):"
        setTextLineTrigger getCredits               :getCredits "Credits"
        setTextLineTrigger checkig                  :checkig "Interdictor ON :"
        send "i"
        pause
    :getInfo_CN9_Check
        setvar $NOFLIP  TRUE
        pause
    :getTraderName
        killTrigger getInfo_CN9_Check_1
        killTrigger getInfo_CN9_Check_2
        setVar $TRADER_NAME CURRENTLINE
        stripText $TRADER_NAME "Trader Name    : "
        setVar $i 1
        while ($i <= $ranksLength)
            setVar $temp $ranks[$i]
            stripText $temp "31m"
            stripText $temp "36m"
            stripText $TRADER_NAME $temp&" "
            add $i 1
        end
        pause
    :getExpAndAlign
            getWord CURRENTLINE $EXPERIENCE 5
            getWord CURRENTLINE $ALIGNMENT 7
            stripText $EXPERIENCE ","
            stripText $ALIGNMENT ","
            stripText $ALIGNMENT "Alignment="
            pause
    :getCorp
            getWord CURRENTLINE $CORP 3
            stripText $CORP ","
            setVar $CORPstring "[" & $CORP & "]"
            pause
    :getShipType
            getWordPos CURRENTLINE $shiptypeend "Ported="
            subtract $shiptypeend 18
            cutText CURRENTLINE $SHIP_TYPE 18 $shiptypeend
            pause
    :getTPW
            getWord CURRENTLINE $TURNS_PER_WARP 5
            pause
    :getSect
            getWord CURRENTLINE $CURRENT_SECTOR 4
            pause
    :getTurns
            getWord CURRENTLINE $TURNS 4
            if ($TURNS = "Unlimited")
                setVar $TURNS 65000
                setVar $unlimitedGame TRUE
            end
            saveVar $unlimitedGame
            pause
    :getHolds
        setVar $Temp (CURRENTLINE & " ")
        getText $Temp $ORE_HOLDS "Ore=" " "
        if ($ORE_HOLDS = "")
            setVar $ORE_HOLDS 0
        end
        getText $Temp $ORGANIC_HOLDS "Organics=" " "
        if ($ORGANIC_HOLDS = "")
            setVar $ORGANIC_HOLDS 0
        end
        getTExt $Temp $EQUIPMENT_HOLDS "Equipment=" " "
        if ($EQUIPMENT_HOLDS = "")
            setVar $EQUIPMENT_HOLDS 0
        end
        getTExt $Temp $COLONIST_HOLDS "Colonists=" " "
        if ($COLONIST_HOLDS = "")
            setVar $COLONIST_HOLDS 0
        end
        getText $Temp $EMPTY_HOLDS "Empty=" " "
        if ($EMPTY_HOLDS = "")
            setVar $EMPTY_HOLDS 0
        end
                pause
    :getFighters
            getWord CURRENTLINE $FIGHTERS 3
            stripText $FIGHTERS ","
            pause
    :getShields
            getWord CURRENTLINE $SHIELDS 4
            stripText $SHIELDS ","
            pause
    :getPhotons
            getWord CURRENTLINE $PHOTONS 3
            pause
    :getScanType
            getWord CURRENTLINE $SCAN_TYPE 4
            pause
    :getTwarpType1
            getWord CURRENTLINE $TWARP_1_RANGE 4
            setVar $TWARP_TYPE 1
            pause
    :getTwarpType2
            getWord CURRENTLINE $TWARP_2_RANGE 4
            setVar $TWARP_TYPE 2
            pause
    :checkig
        getWord CURRENTLINE $igstat 4
        pause
    :getCredits
        getWord CURRENTLINE $CREDITS 3
        stripText $CREDITS ","
        if ($igstat = 0)
            setVar $igstat "NO IG"
        end
    :getInfoDone
                    killtrigger getExpAndAlign     
                killtrigger getCorp         
                killtrigger getShipType       
                killtrigger getTPW           
                killtrigger getSect          
                killtrigger getTurns                 
                killtrigger getHolds                 
                killtrigger getFighters              
                killtrigger getShields               
                killtrigger getPhotons               
                killtrigger getScanType             
                killtrigger getTwarpType1          
                killtrigger getTwarpType2           
                killtrigger getCredits              
                killtrigger checkig          
                killtrigger getInfoDone          
                killtrigger getInfoDone2   
                killtrigger getInfo_CN9_Check_1
                killtrigger getInfo_CN9_Check_2
                
                saveVar $unlimitedGame
                
				if ($save)
					
					saveVar $CREDITS
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
# ==============================  END PLAYER INFO SUBROUTINE  =================


:current_prompt
    setTextTrigger      prompt          :allPromptsCatch        #145 & #8
    setDelayTrigger     prompt_delay    :current_prompt_delay   5000
    send #145
    pause
    :current_prompt_delay
        setTextOutTrigger   atkeys      :current_prompt_at_keys
        setDelayTrigger     prompt_delay    :verifyDelay        30000
        pause
    :current_prompt_at_keys
        getOutText $out
        send $out
        killtrigger prompt_delay
        return
    :allPromptsCatch
        killtrigger prompt_delay
        getWord CURRENTLINE $CURRENT_PROMPT 1
        if ($CURRENT_PROMPT = 0)
            getWord CURRENTANSILINE $CURRENT_PROMPT 1
        end
        stripText $CURRENT_PROMPT #145
        stripText $CURRENT_PROMPT #8
        setVar $startingLocation $CURRENT_PROMPT
return

    :verifyDelay
            killalltriggers
        disconnect


:bwarp
    send "b"
    setTextTrigger noBwarp  :noBwarp  "Would you like to place a subspace order for one? "
    setTextTrigger yesBwarp :yesBwarp "Beam to what sector? (U="
    setTextTrigger IGBwarp  :bwarpPhotoned "Your ship was hit by a Photon and has been disabled"
    pause
    :noBwarp
        killtrigger yesBwarp
        killtrigger IGBwarp
        killtrigger noBwarp
        send "*"
        setVar $SWITCHBOARD~message "No Bwarp installed on this planet*"
        gosub :SWITCHBOARD~switchboard
        return
    :yesBwarp
        killtrigger yesBwarp
        killtrigger IGBwarp
        killtrigger noBwarp
        send $warpto&"*"
        setTextTrigger bwarp_lock :bwarp_no_range "This planetary transporter does not have the range."
        setTextTrigger no_bwrp_lock :no_bwarp_lock "Do you want to make this transport blind?"
        setTextTrigger bwarp_ready :bwarp_lock "All Systems Ready, shall we engage?"
        setTextLineTrigger no_bwarpfuel :bwarpNoFuel "This planet does not have enough Fuel Ore to transport you."
        pause
    :bwarp_no_range
        killtrigger bwarp_lock
        killtrigger no_bwrp_lock
        killtrigger bwarp_ready
        killtrigger no_bwarpfuel
        setVar $SWITCHBOARD~message "Not enough range on this planet's transporter.*"
        gosub :SWITCHBOARD~switchboard
        return
    :no_bwarp_lock
        killtrigger bwarp_lock
        killtrigger no_bwrp_lock
        killtrigger bwarp_ready
        killtrigger no_bwarpfuel
        send "* "
        setVar $target $warpto
        setSectorParameter $target "FIGSEC" FALSE
        setVar $SWITCHBOARD~message "No fighter down at that destination, aborting*"
        gosub :SWITCHBOARD~switchboard
        return
    :bwarp_lock
        killtrigger bwarp_lock
        killtrigger no_bwrp_lock
        killtrigger bwarp_ready
        killtrigger no_bwarpfuel
        send "y     * "
        setVar $target $warpto
        setSectorParameter $target "FIGSEC" TRUE
        setVar $SWITCHBOARD~message "B-warp completed.*"
        gosub :SWITCHBOARD~switchboard
        return
    :bwarpNoFuel
        killtrigger bwarp_lock
        killtrigger no_bwrp_lock
        killtrigger bwarp_ready
        killtrigger no_bwarpfuel
        setVar $SWITCHBOARD~message "Not enough fuel on the planet to make the transport!*"
        gosub :SWITCHBOARD~switchboard
        return
    :bwarpPhotoned
        killtrigger yesBwarp
        killtrigger IGBwarp
        killtrigger noBwarp
        setVar $SWITCHBOARD~message "I have been photoned and can not B-warp!*"
        gosub :SWITCHBOARD~switchboard
        return

# ======================    START INTERNAL TWARP SUBROUTINE     ==========================
:twarp
    setVar $twarpSuccess FALSE
    setVar $original 9999999
    setVar $target 0
    if ($CURRENT_SECTOR = $warpto)
        setVar $msg "Already in that sector!"
        goto :twarpDone
    elseif (($warpto <= 0) OR ($warpto > SECTORS))
        setVar $msg "Destination sector is out of range!"
        goto :twarpDone
    end
    if ($TWARP_TYPE = "No")
        setVar $msg "No T-warp drive on this ship!"
        goto :twarpDone
    end
    # check adj's for Dock.. if present, then we don't need a jump sector.
    setVar $WeAreAdjDock FALSE
    if (($warpto = $MAP~stardock) OR ($warpto <= 10))
        setVar $target $warpto
        setVar $a 1
        setVar $START_SECTOR $CURRENT_SECTOR
        while ($a <= SECTOR.WARPCOUNT[$START_SECTOR])
            setVar $adj_start SECTOR.WARPS[$START_SECTOR][$a]
            if ($adj_start = $target)
                setVar $WeAreAdjDock TRUE
            end
            add $a 1
        end
    end
    setVar $RED_adj 0
    if (($ALIGNMENT < 1000) AND ($WeAreAdjDock = FALSE) AND (($warpto = $MAP~stardock) OR ($warpto <= 10)))
        setVar $target $warpto
        gosub :FindJumpSector
        if ($RED_adj <> 0)
            setVar $original $warpto
            setVar $WARPTO $RED_adj
        else
            waitfor "Command [TL="
            setVar $msg "Cannot Find Jump Sector Adjacent Sector " & $target & "."
            goto :twarpDone
        end
    end
    if ($RED_adj <> 0)
        goto :twarp_lock
    end
    if ($startingLocation = "Citadel")
        send "q t*t1* q q * c u y q mz" $warpto "*"
    elseif ($startingLocation = "Planet")
        send "t*t1* q q * c u y q mz" $warpto "*"
    else
        send "q q q n n 0 * c u y q mz" $warpto "*"
    end
    setTextTrigger      there      :adj_warp       "You are already in that sector!"
    setTextLineTrigger  adj_warp   :adj_warp       "Sector  : "&$warpto&" "
    setTextTrigger      locking    :locking        "Do you want to engage the TransWarp drive?"
    setTextTrigger      igd        :twarpIgd       "An Interdictor Generator in this sector holds you fast!"
    setTextTrigger      noturns    :twarpPhotoned  "Your ship was hit by a Photon and has been disabled"
    setTextTrigger      noroute    :twarpNoRoute   "Do you really want to warp there? (Y/N)"
    setTextLineTrigger no_fuel     :twarpNoFuel "You do not have enough Fuel Ore"
    pause
    :adj_warp   
        gosub :killtwarptriggers
        send "z*"
        goto :twarp_adj
    :locking
        gosub :killtwarptriggers
        send "y"
        setTextLineTrigger twarp_lock :twarp_lock "TransWarp Locked"
        setTextLineTrigger no_twrp_lock :no_twarp_lock "No locating beam found"
        setTextLineTrigger twarp_adj :twarp_adj "<Set NavPoint>"
        setTextLineTrigger no_fuel :twarpNoFuel "You do not have enough Fuel Ore"
        pause
    :twarpNoFuel
        gosub :killtwarptriggers
        setVar $msg "Not enough fuel for T-warp."
        goto :twarpDone
    :twarp_adj
        gosub :killtwarptriggers
        send "z* "
        setVar $msg "That sector is next door, just plain warping."
        setVar $twarpSuccess TRUE
        goto :twarpDone
    :twarpNoRoute
        gosub :killtwarptriggers
        send "n* z* "
        setVar $msg "No route available to that sector!"
        goto :twarpDone
    :no_twarp_lock
        gosub :killtwarptriggers
        send "n* z* "
        setVar $target $warpto
        setSectorParameter $target "FIGSEC" FALSE
        setVar $msg "No fighters at T-warp point!"
        goto :twarpDone
    :twarpIgd
        gosub :killtwarptriggers
        setVar $msg "My ship is being held by Interdictor!"
        goto :twarpDone
    :twarpPhotoned
        gosub :killtwarptriggers
        setVar $msg "I have been photoned and can not T-warp!"
        goto :twarpDone
    :twarp_lock
        gosub :killtwarptriggers
        setVar $target $warpto
        setSectorParameter $target "FIGSEC" TRUE
        send "y   *     "
        setVar $msg "T-warp completed."
        setVar $twarpSuccess TRUE
    :twarpDone
    if (($twarpSuccess = TRUE) AND (($original = $MAP~stardock) OR ($original <= 10)))
        send "* m "&$original&"*  za9999* * "
    end
return
:killtwarptriggers
    killtrigger there
    killtrigger adj_warp
    killtrigger locking
    killtrigger igd
    killtrigger noturns
    killtrigger noroute
    killtrigger twarp_lock
    killtrigger no_twrp_lock
    killtrigger twarp_adj
    killtrigger no_fuel
return
# ======================    END INTERNAL TWARP SUBROUTINE     ==========================



    :getCourse
        setArray $mowCourse 80
        setVar $sectors ""
        if ($starting_point <= 0)
            setVar $starting_point ""
        end
        setTextLineTrigger sectorlinetrig :sectorsline " > "
        send "^f"&$starting_point&"*"&$destination&"**q"
        pause
    :sectorsline
        killtrigger sectorlinetrig
        killtrigger sectorlinetrig2
        killtrigger sectorlinetrig3
        killtrigger sectorlinetrig4
        killtrigger donePath
        killtrigger donePath2
        setVar $line CURRENTLINE
        replacetext $line ">" " "
        striptext $line "("
        striptext $line ")"
        setVar $line $line&" "
        getWordPos $line $pos "So what's the point?"
        getWordPos $line $pos2 ": ENDINTERROG"
        getWordPos $line $pos3 " No route within "
        if (($pos > 0) OR ($pos2 > 0) OR ($pos3 > 0))
            goto :noPath
        end
        getWordPos $line $pos " sector "
        getWordPos $line $pos2 "TO"
        if (($pos <= 0) AND ($pos2 <= 0))
            setVar $sectors $sectors & " " & $line
        end
        getWordPos $line $pos " "&$destination&" "
        getWordPos $line $pos2 "("&$destination&")"
        getWordPos $line $pos3 "TO"
        if ((($pos > 0) OR ($pos2 > 0)) AND ($pos3 <= 0))
            goto :gotSectors
        else
            setTextLineTrigger sectorlinetrig :sectorsline " > "
            setTextLineTrigger sectorlinetrig2 :sectorsline " "&$destination&" "
            setTextLineTrigger sectorlinetrig3 :sectorsline " "&$destination
            setTextLineTrigger sectorlinetrig4 :sectorsline "("&$destination&")"
            setTextLineTrigger donePath :sectorsline "So what's the point?"
            setTextLineTrigger donePath2 :sectorsline ": ENDINTERROG"
        end
        pause
    :gotSectors
        setVar $sectors $sectors&" :::"
        setVar $courseLength 0
        setVar $index 1
        :keepGoing
        getWord $sectors $mowCourse[$index] $index
        while ($mowCourse[$index] <> ":::")
            add $courseLength 1
            add $index 1
            getWord $sectors $mowCourse[$index] $index
        end
        return
    :noPath

        send "q '{" $SWITCHBOARD~bot_name "} - No path to that sector, cannot mow!*"
        return

:FindJumpSector
    setVar $i 1
    setVar $RED_adj 0
    send "q t*t1* q*"
    while (SECTOR.WARPSIN[$target][$i] > 0)
        setVar $RED_adj SECTOR.WARPSIN[$target][$i]
        if ($RED_adj > 10)
            send "m " & $RED_adj & "* y"
            setTextTrigger TwarpBlind           :TwarpBlind "Do you want to make this jump blind? "
            setTextTrigger TwarpLocked          :TwarpLocked "All Systems Ready, shall we engage? "
            setTextLineTrigger TwarpVoided      :TwarpVoided "Danger Warning Overridden"
            setTextLineTrigger TwarpAdj         :TwarpAdj "<Set NavPoint>"
            pause
            :TwarpAdj
                killtrigger TwarpBlind
                killtrigger TwarpLocked
                killtrigger TwarpVoided
                killtrigger TwarpAdj
                send " * "
                return

            :TwarpVoided
                killtrigger TwarpBlind
                killtrigger TwarpLocked
                killtrigger TwarpVoided
                killtrigger TwarpAdj
                send " N N "
                goto :TryingNextAdj

            :TwarpLocked
                killtrigger TwarpBlind
                killtrigger TwarpLocked
                killtrigger TwarpVoided
                killtrigger TwarpAdj
                goto :SectorLocked

            :TwarpBlind
                killtrigger TwarpBlind
                killtrigger TwarpLocked
                killtrigger TwarpVoided
                killtrigger TwarpAdj
                send " N "
        end
        :TryingNextAdj
                add $i 1
    end

    :NoAdjsFound
        setVar $RED_adj 0
        return

    :SectorLocked
        if ($target = $MAP~stardock)
            setVar $MAP~backdoor $RED_adj
            saveVar $MAP~backdoor
        end
return

:mow
        
        if ($bot~startingLocation = "Citadel")
            send "q"
            gosub :PLANET~getPlanetInfo
            send "c "
        end
        if ($bot~startingLocation = "Command")
            gosub :SHIP~getShipStats
            setVar $mow_SHIP_MAX_ATTACK $SHIP~SHIP_MAX_ATTACK
        elseif ($SHIP~SHIP_MAX_ATTACK <= 0)
            setVar $mow_SHIP_MAX_ATTACK 99991111
        else
            setVar $mow_SHIP_MAX_ATTACK $SHIP~SHIP_MAX_ATTACK
        end
        setVar $destination $BOT~parm1
        isNumber $number $destination
        if ($number <> 1)
            send "'{" $SWITCHBOARD~bot_name "} - Sector entered is not a number, cannot mow!*"
            return
        elseif (($destination <= 0) OR ($destination > SECTORS))
            send "'{" $SWITCHBOARD~bot_name "} - Sector entered is not valid, cannot mow!*"
            return
        end
        setVar $destination ($BOT~parm1+0)
        getWordPos " "&$BOT~user_command_line&" " $pos "kill"
        if ($pos > 0)
            setVar $mow_kill TRUE
        else
            setVar $mow_kill FALSE
        end
        getWordPos " "&$BOT~user_command_line&" " $pos "saveme"
        if ($pos > 0)
            setVar $mow_saveme TRUE
        else
            setVar $mow_saveme FALSE
        end
        getWordPos " "&$BOT~user_command_line&" " $pos " p "
        if ($pos > 0)
            setVar $are_we_docking TRUE
        else
            setVar $are_we_docking FALSE
        end
        setVar $figsToDrop $BOT~parm2
        isNumber $number $figsToDrop
        if ($number <> TRUE)
            setVar $figsToDrop 0
        else
            if ($figsToDrop > 50000)
                send "'{" $SWITCHBOARD~bot_name "} - Cannot drop more than 50,000 fighters per sector!*"
                return
            elseif ($figsToDrop > $FIGHTERS)
                send "'{" $SWITCHBOARD~bot_name "} - Fighters to drop cannot exceed total ship fighters.*"
                return
            end
        end
        if ($mow_SHIP_MAX_ATTACK > $FIGHTERS)
            setVar $mow_SHIP_MAX_ATTACK 9999
        end
        if ($CURRENT_SECTOR <> CURRENTSECTOR)
            setVar $CURRENT_SECTOR 0
        end
        gosub :getCourse
        setVar $j 2
        setVar $result "q q q * "
        while ($j <= $courseLength)
            if ($mowCourse[$j] <> $CURRENT_SECTOR)
                setVar $result $result&"m  "&$mowCourse[$j]&"*   "
                if (($mowCourse[$j] > 10) AND ($mowCourse[$j] <> $MAP~stardock))
                    setVar $result $result&"za  "&$mow_SHIP_MAX_ATTACK&"* *  "
                end
                if (($figsToDrop > 0) AND ($mowCourse[$j] > 10) AND ($mowCourse[$j] <> $MAP~stardock) AND ($j > 2))
                    setVar $result $result&"f "&$figsToDrop&" * c d "
                    setVar $target $mowCourse[$j]
                    gosub :addfigtodata
                end
                if (($j >= $courseLength) AND ($mow_saveme = TRUE) AND ($figstoDrop = 0))
                    setVar $result $result&"f 1 * c d "
                    setVar $target $mowCourse[$j]
                    gosub :addfigtodata
                end
                if (($called = FALSE) AND ($mow_saveme = TRUE) AND ($j >= ($courseLength-2)))
                    setVar $result $result&"'"&$destination&"=saveme*  "
                    setVar $called TRUE
                end
            end
            add $j 1
        end
        setVar $docking_instructions ""
        if ($are_we_docking)
            setVar $docking_instructions " p z t *"
            if ($destination = $MAP~stardock)
                setVar $docking_instructions " p z s g y g q h *"
            end
            setVar $result $result & $docking_instructions
        elseif (($mow_saveme = TRUE) AND ($startingLocation = "Citadel"))
            setVar $i 0
            while ($i < 8)
                add $i 1
                #setVar $result $result&"l j" & #8 & $PLANET~PLANET & "*  *  "
                setVar $result $result&"l j" & #8 & $PLANET~PLANET & "*  *  j  c  *  *  "
            end
        end
        send $result
        gosub :quikstats
        if (($CURRENT_PROMPT = "Command") AND ($mow_kill = TRUE))
            setVar $startingLocation "Command"
            goSub :SECTOR~getSectorData
            goSub :fastAttack
        elseif ($CURRENT_PROMPT = "Planet")
            send "m * * * c "
            if ($mow_kill = FALSE)
                send "s* "
            else
                setVar $bot~startingLocation "Citadel"
                gosub :scanit_cit_kill
            end
        elseif ($are_we_docking = FALSE)
            send "*"
        end
return
# ======================     END MOW SUBROUTINES     ==========================

:topoff
    :do_topoff_again
        killtrigger topoff_success
        killtrigger topoff_failure1
        killtrigger topoff_failure2
        send " F"
        waitOn "Your ship can support up to"
        getWord CURRENTLINE $ftrs_to_leave 10
        stripText $ftrs_to_leave ","
        stripText $ftrs_to_leave " "
        if ($ftrs_to_leave < 1)
            setVar $ftrs_to_leave 1
        end
        send " " & $ftrs_to_leave & " * c d"
        setTextLineTrigger topoff_success :topoff_success "Done. You have "
        setTextLineTrigger topoff_failure1 :do_topoff_again "You don't have that many fighters available."
        setTextLineTrigger topoff_failure2 :do_topoff_again "Too many fighters in your fleet!  You are limited to"
        pause
    :topoff_success
        killtrigger topoff_failure1
        killtrigger topoff_failure2
return

# ============================== ANSI CONTROLS ==========================================
:turnOffAnsi
    send "c n"
    killalltriggers
    waitOn "(1) ANSI graphics"
    getWord CURRENTLINE $ansiStatus 5
    waitOn "(2) Animation display"
    getWord CURRENTLINE $animationStatus 5
    if ($animationStatus = "On")
        send "2"
    end
    if ($ansiStatus = "On")
        send "1 q q"
    else
        send "q q"
    end
    waitOn "<Computer deactivated>"
    return

:turnOnAnsi
    send "c n"
    killalltriggers
    waitOn "(1) ANSI graphics"
    getWord CURRENTLINE $ansiStatus 5
    if ($ansiStatus = "Off")
        send "1 q q"
    else
        send "q q"
    end
    waitOn "<Computer deactivated>"
    return
# ==================================== END ANSI CONTROLS =====================================


# ====================================== START BUY COMMAND ==============================================
:buy

    #required params:
    #$overrided - true/false
    #$buytype - 1/2/3
    #$buyobject - e/o/f


# ============================== START HAGGLE VARIABLES ============================
	setVar $overhagglemultiple 	147
	setVar $cyclebuffer 		1
	setVar $cyclebufferlimit 	20
# ============================== END HAGGLE VARIABLES ============================


    send "@"
    waitOn "Average Interval Lag:"
    gosub :quikstats
    setVar $startingLocation $CURRENT_PROMPT
    
    setVar $output ""
    setVar $equiprounds 0
    setVar $orgrounds 0
    setVar $fuelrounds 0
    if ($buydownRoundsFromParam <= 0)
        setVar $buydownRoundsFromParam 999999
    end   
    if ($buytype = "w")
            setVar $buydown_mode 3
    elseif ($buytype = "b")
            setVar $buydown_mode 2
    else 
        setVar $buydown_mode 1
    end
    if ($buyobject = "e")
        setVar $buydown_equiprounds $buydownRoundsFromParam
        setVar $buydown_orgrounds 0
        setVar $buydown_fuelrounds 0
    elseif ($buyobject = "o")
        setVar $buydown_equiprounds 0
        setVar $buydown_orgrounds $buydownRoundsFromParam
        setVar $buydown_fuelrounds 0
    elseif ($buyobject = "f")
        setVar $buydown_equiprounds 0
        setVar $buydown_orgrounds 0
        setVar $buydown_fuelrounds $buydownRoundsFromParam
    else
        setVar $SWITCHBOARD~message "Please use format buy [type] {speed} {#cycles} {override}*"
        gosub :SWITCHBOARD~switchboard
        return
    end

    if ($startingLocation = "Citadel")
        send "Q"
    end
    send "t n l 1* t n l 2* t n l 3* s n l1*"
    waitOn "How many groups of Colonists do you want to leave"
    gosub :PLANET~getPlanetinfo
    if ($startingLocation = "Citadel")
        send "C s* "
    else
        send "Q D"
    end
    gosub :getinfo
    if ($TOTAL_HOLDS <> $EMPTY_HOLDS)
        if ($startingLocation <> "Citadel")
            gosub :PLANET~landingSub
        end
        setVar $SWITCHBOARD~message "Planet full, cannot empty ship holds*"
        gosub :SWITCHBOARD~switchboard
        goto :buydownExit
    end
    gosub :voidAdjacent
    gosub :getPortInfo
    if ($validPortFound <> TRUE)
        echo "*No valid port found*"
        if ($startingLocation <> "Citadel")
            gosub :PLANET~landingSub
        end
        gosub :clearAdjacent
        goto :buydownExit   
    end
    if ($startingLocation = "Citadel")
        send "Q"
    else
        send "L " & $PLANET~PLANET & "* "
    end
    setDelayTrigger initpause :initpause 500
    pause

:initpause


:getinputs
    setVar $turns_needed 0
        setVar $turns_allowed $TURNS
        subtract $turns_allowed 1

    # --- calculate how much fuel we can buy
    if ($buydown_fuelrounds > 0)
        setVar $fuelrounds 0
        setVar $planetfuelroom $PLANET~PLANET_FUEL_MAX
        subtract $planetfuelroom $PLANET~PLANET_FUEL
        setVar $maxfueltobuy $fuelselling
        if ($fuelselling > $planetfuelroom)
            setVar $maxfueltobuy $planetfuelroom
        end
        setVar $maxfuelrounds $maxfueltobuy
        divide $maxfuelrounds $TOTAL_HOLDS
        if ($maxfuelrounds > $turns_allowed)
            setVar $maxfuelrounds $turns_allowed
        end
        if ($maxfuelrounds > $buydown_fuelrounds)
                setVar $maxfuelrounds $buydown_fuelrounds
        end
        if ($maxfuelrounds > 0)
            setVar $fuelrounds $maxfuelrounds
        end
        add $turns_needed $fuelrounds
        subtract $turns_allowed $fuelrounds
    end
        # --- calculate how much org we can buy
        if ($buydown_orgrounds > 0)
        setVar $orgrounds 0
            setVar $planetorgroom $PLANET~PLANET_ORGANICS_MAX
            subtract $planetorgroom $PLANET~PLANET_ORGANICS
            setVar $maxorgtobuy $orgselling
            if ($orgselling > $planetorgroom)
                setVar $maxorgtobuy $planetorgroom
            end
            setVar $maxorgrounds $maxorgtobuy
            divide $maxorgrounds $TOTAL_HOLDS
            if ($maxorgrounds > $turns_allowed)
                setVar $maxorgrounds $turns_allowed
            end
            if ($maxorgrounds > $buydown_orgrounds)
                setVar $maxorgrounds $buydown_orgrounds
            end
            if ($maxorgrounds > 0)
                setVar $orgrounds $maxorgrounds
            end
        add $turns_needed $orgrounds
            subtract $turns_allowed $orgrounds
        end 
        # --- calculate how much equip we can buy
        if ($buydown_equiprounds > 0)
        setVar $equiprounds 0
            setVar $planetequiproom $PLANET~PLANET_EQUIPMENT_MAX
            subtract $planetequiproom $PLANET~PLANET_EQUIPMENT
            setVar $maxequiptobuy $equipselling
            if ($equipselling > $planetequiproom)
                setVar $maxequiptobuy $planetequiproom
            end
            setVar $maxequiprounds $maxequiptobuy
            divide $maxequiprounds $TOTAL_HOLDS
            if ($maxequiprounds > $turns_allowed)
            setVar $maxequiprounds $turns_allowed
            end
            if ($maxequiprounds > $buydown_equiprounds)
                setVar $maxequiprounds $buydown_equiprounds
            end
            if ($maxequiprounds > 0)
                setVar $equiprounds $maxequiprounds
            end
        add $turns_needed $equiprounds
            subtract $turns_allowed $equiprounds
        end
        if (($fuelrounds = 0) and ($orgrounds = 0) and ($equiprounds = 0))
            if ($startingLocation = "Citadel")
                    send "C "
            else
                send "q "
        end
            echo "*Nothing to buy*"
        gosub :clearAdjacent
            goto :buydownExit
        end

        :getMode
            if ($buydown_mode = 1)
                setVar $buydown_mode "Speedbuy"
            elseif ($buydown_mode = 2)
                setVar $buydown_mode "Best Price"
            elseif ($buydown_mode = 3)
                setVar $buydown_mode "Worst Price"
            end
            setVar $fuelroundsleft $fuelrounds
            setVar $orgroundsleft $orgrounds
            setVar $equiproundsleft $equiprounds
        setVar $fuel_creds_needed 0
        setVar $org_creds_needed 0
        setVar $equip_creds_needed 0

        # determine how much this will all cost, and get credits from citadel if needed
            if ($fuelrounds > 0)
                    setVar $fuel_creds_needed $fuelrounds
                    multiply $fuel_creds_needed $TOTAL_HOLDS
                    multiply $fuel_creds_needed 30
                    if ($buydown_mode = "Worst Price")
                        multiply $fuel_creds_needed 3
                        divide $fuel_creds_needed 2
                    end
            end
    if ($orgrounds > 0)
            setVar $org_creds_needed $orgrounds
            multiply $org_creds_needed $TOTAL_HOLDS
            multiply $org_creds_needed 60
            if ($buydown_mode = "Worst Price")
                multiply $org_creds_needed 3
                divide $org_creds_needed 2
            end
    end
    if ($equiprounds > 0)
            setVar $equip_creds_needed $equiprounds
            multiply $equip_creds_needed $TOTAL_HOLDS
            multiply $equip_creds_needed 100
            if ($buydown_mode = "Worst Price")
                multiply $equip_creds_needed 3
                divide $equip_creds_needed 2
            end
    end
    setVar $total_creds_needed 0
    add $total_creds_needed $fuel_creds_needed
    add $total_creds_needed $org_creds_needed
    add $total_creds_needed $equip_creds_needed
    setVar $startingCredits $CREDITS
    if ($total_creds_needed > $CREDITS)
            setVar $cashonhand $PLANET~CITADEL_CREDITS
            add $cashonhand $CREDITS
            if ($cashonhand > $total_creds_needed)
                send "C"
                send "T T " & $CREDITS & "* "
                send "T F " & $total_creds_needed & "* "
                setVar $CREDITS $total_creds_needed
                send "Q"
            else
                if ($startingLocation = "Citadel")
                        send "C "
                else
                    send "q "
            end
                setVar $exit_message "Not enough cash onhand"
            gosub :clearAdjacent
                goto :buydownExit
            end
    end
    setVar $init_credits $CREDITS

:buydownequip
    if ($equiproundsleft > 0)
            send "Q P T  "
            if ($fuelselling > 0)
                    send "0* "
            end
            if ($orgselling > 0)
                    send "0*"
            end
            gosub :choosehaggle
            send "L " & $PLANET~PLANET & "* t n l 3* "
            subtract $equiproundsleft 1
            goto :buydownequip
        end
        if ($equiprounds > 0)
            if ($buydown_mode = "Worst Price")
                    setVar $output $output & " - Equipment overhaggled at " & $overhagglemultiple & "*"
            end
        end

:buydownorg
        if ($orgroundsleft > 0)
            send "Q P T  "
            if ($fuelselling > 0)
                    send "0*"
            end
            gosub :choosehaggle
            send "0* L " & $PLANET~PLANET & "* t n l 2* "
            subtract $orgroundsleft 1
            goto :buydownorg
        end
        if ($orgrounds > 0)
            if ($buydown_mode = "Worst Price")
                setVar $output $output & " - Organics overhaggled at " & $overhagglemultiple & "*"
            end
        end

:buydownfuel
        if ($fuelroundsleft > 0)
            send "Q P T "
            gosub :choosehaggle
            send "0* 0* L " & $PLANET~PLANET & "* t n l 1* "
            subtract $fuelroundsleft 1
            goto :buydownfuel
        end
        if ($fuelrounds > 0)
            if ($buydown_mode = "Worst Price")
                    setVar $output $output & " - Fuel Ore overhaggled at " & $overhagglemultiple & "*"
            end
        end

:buydownFinish
        if ($startingLocation = "Citadel")
            send "C "
        end
        gosub :getinfo
        setVar $credits_spent $init_credits
        subtract $credits_spent $CREDITS
        gosub :clearAdjacent
        if ($startingLocation = "Planet")
            send "L " & $PLANET~PLANET & "* "
        end
        if ($CREDITS > $startingCredits)
            if ($startingLocation = "Citadel")
                send "T T " & ($CREDITS-$startingCredits) & "* "
            end
        end
        setVar $exit_message "Normal Exit"

    :buydownExit
            return

#==================================   END BUY DOWN (BUY) SUB  ========================================

# ======================     START BUYING SUBROUTINES     =================
# ----- SUB :choosehaggle
:choosehaggle
    if ($buydown_mode = "Speedbuy")
        gosub :buynohaggle
    else
        gosub :buyhaggle
    end
    return


# ----- SUB :buyhaggle
:buyhaggle
    killtrigger buyfirstoffer

    setVar $empty $TOTAL_HOLDS
    send "*"
    setTextLineTrigger buyfirstoffer :buyfirstoffer "We'll sell them for"
    pause

    :buyfirstoffer
        killtrigger buyprice 
        killtrigger buyfinaloffer 
        killtrigger buynotinterested 
        killtrigger buyexperience 
        killtrigger buyempty 
        killtrigger buyscrewup1 
        killtrigger buyscrewup2 
        killtrigger buyscrewup3 
        killtrigger buyscrewup4 
        killtrigger buyscrewup5 
        killtrigger buyscrewup6 
        killtrigger buyscrewup7 
        killtrigger buyscrewup8 
        killtrigger buyscrewup9 
        killtrigger buyscrewup10 

        getWord CURRENTLINE $offer 5
        striptext $offer ","

        gosub :swathoff
        if ($swathoff = 0)
            send "L " & $PLANET~PLANET & "* "
        if ($startingLocation = "Citadel")
            send "C "
        end
            setVar $exit_message $swathOffMessage
            goto :buydownExit
        end


        setVar $counter $offer
        if ($buydown_mode = "Best Price")
            multiply $counter 92
            divide $counter 100
        elseif ($buydown_mode = "Worst Price")
            multiply $counter $overhagglemultiple
            divide $counter 100
        end
        send $counter & "*"
    :buyofferloop
        setTextLineTrigger buyprice :buyprice "We'll sell them for"
        setTextLineTrigger buyfinaloffer :buyfinaloffer "Our final offer"
        setTextLineTrigger buynotinterested :buynotinterested "We're not interested."
        setTextLineTrigger buyexperience :buyexperience "experience point(s)"
        setTextLineTrigger buyempty :buyempty "empty cargo holds"
        setTextLineTrigger buyscrewup1 :buyscrewup "Get real ion-brain, make me a real offer."
        setTextLineTrigger buyscrewup2 :buyscrewup "This is the big leagues Jr.  Make a real offer."
        setTextLineTrigger buyscrewup3 :buyscrewup "My patience grows short with you."
        setTextLineTrigger buyscrewup4 :buyscrewup "I have much better things to do than waste my time.  Try again."
        setTextLineTrigger buyscrewup5 :buyscrewup "HA! HA, ha hahahhah hehehe hhhohhohohohh!  You choke me up!"
        setTextLineTrigger buyscrewup6 :buyscrewup "Quit playing around, you're wasting my time!"
        setTextLineTrigger buyscrewup7 :buyscrewup "Make a real offer or get the "
        setTextLineTrigger buyscrewup8 :buyscrewup "WHAT?!@!? you must be crazy!"
        setTextLineTrigger buyscrewup9 :buyscrewup "So, you think I'm as stupid as you look? Make a real offer."
        setTextLineTrigger buyscrewup10 :buyscrewup "What do you take me for, a fool?  Make a real offer!"
        pause
        pause
    :buyscrewup
        killtrigger buyprice 
        killtrigger buyfinaloffer 
        killtrigger buynotinterested 
        killtrigger buyexperience 
        killtrigger buyempty 
        killtrigger buyscrewup1 
        killtrigger buyscrewup2 
        killtrigger buyscrewup3 
        killtrigger buyscrewup4 
        killtrigger buyscrewup5 
        killtrigger buyscrewup6 
        killtrigger buyscrewup7 
        killtrigger buyscrewup8 
        killtrigger buyscrewup9 
        killtrigger buyscrewup10 
      
        if ($buydown_mode = "Best Price")
            multiply $counter 102
            divide $counter 100
        elseif ($buydown_mode = "Worst Price")
            subtract $overhagglemultiple 1
            setVar $counter $offer
            multiply $counter $overhagglemultiple
            divide $counter 100
        end
        send $counter & "*"
        goto :buyofferloop
    :buyprice
        killtrigger buyprice 
        killtrigger buyfinaloffer 
        killtrigger buynotinterested 
        killtrigger buyexperience 
        killtrigger buyempty 
        killtrigger buyscrewup1 
        killtrigger buyscrewup2 
        killtrigger buyscrewup3 
        killtrigger buyscrewup4 
        killtrigger buyscrewup5 
        killtrigger buyscrewup6 
        killtrigger buyscrewup7 
        killtrigger buyscrewup8 
        killtrigger buyscrewup9 
        killtrigger buyscrewup10 
        setVar $old_offer $offer
        setVar $old_counter $counter
        getWord CURRENTLINE $offer 5
        striptext $offer ","
        setVar $offer_pct $offer
        multiply $offer_pct 1000
        divide $offer_pct $old_offer
        if ($offer_pct > 990)
            setVar $offer_pct 990
        end
        multiply $counter 1000
        divide $counter $offer_pct
        if ($counter <= $old_counter)
            add $counter 1
        end
        send $counter & "*"
        goto :buyofferloop
    :buyfinaloffer
        killtrigger buyprice 
        killtrigger buyfinaloffer 
        killtrigger buynotinterested 
        killtrigger buyexperience 
        killtrigger buyempty 
        killtrigger buyscrewup1 
        killtrigger buyscrewup2 
        killtrigger buyscrewup3 
        killtrigger buyscrewup4 
        killtrigger buyscrewup5 
        killtrigger buyscrewup6 
        killtrigger buyscrewup7 
        killtrigger buyscrewup8 
        killtrigger buyscrewup9 
        killtrigger buyscrewup10 
        setVar $old_offer $offer
        setVar $old_counter $counter
        getWord CURRENTLINE $offer 5
        striptext $offer ","
        setVar $offer_change $offer
        subtract $offer_change $old_offer
        subtract $offer_change 1
        multiply $offer_change 25
        divide $offer_change 10
        subtract $counter $offer_change
        if ($counter = $old_counter)
            add $counter 1
        end
        add $counter 1
        send $counter & "*"
        goto :buyofferloop
    :buynotinterested
        killtrigger buyprice 
        killtrigger buyfinaloffer 
        killtrigger buynotinterested 
        killtrigger buyexperience 
        killtrigger buyempty 
        killtrigger buyscrewup1 
        killtrigger buyscrewup2 
        killtrigger buyscrewup3 
        killtrigger buyscrewup4 
        killtrigger buyscrewup5 
        killtrigger buyscrewup6 
        killtrigger buyscrewup7 
        killtrigger buyscrewup8 
        killtrigger buyscrewup9 
        killtrigger buyscrewup10 
        send "0* "
        send "0* "
        goto :buyhagglefailed
    :buyexperience
        killtrigger buyprice 
        killtrigger buyfinaloffer 
        killtrigger buynotinterested 
        killtrigger buyexperience 
        killtrigger buyempty 
        killtrigger buyscrewup1 
        killtrigger buyscrewup2 
        killtrigger buyscrewup3 
        killtrigger buyscrewup4 
        killtrigger buyscrewup5 
        killtrigger buyscrewup6 
        killtrigger buyscrewup7 
        killtrigger buyscrewup8 
        killtrigger buyscrewup9 
        killtrigger buyscrewup10 
        getWord CURRENTLINE $exp_bonus 7
        add $exp $exp_bonus
        add $jetbonus $exp_bonus
        goto :buyofferloop
    :buyempty
        killtrigger buyprice 
        killtrigger buyfinaloffer 
        killtrigger buynotinterested 
        killtrigger buyexperience 
        killtrigger buyempty 
        killtrigger buyscrewup1 
        killtrigger buyscrewup2 
        killtrigger buyscrewup3 
        killtrigger buyscrewup4 
        killtrigger buyscrewup5 
        killtrigger buyscrewup6 
        killtrigger buyscrewup7 
        killtrigger buyscrewup8 
        killtrigger buyscrewup9 
        killtrigger buyscrewup10 
        getWord CURRENTLINE $CREDITS 3
        stripText $CREDITS ","
        setVar $oldempty $empty
        getWord CURRENTLINE $empty 6
        if ($oldempty = $empty)
            goto :buyhagglefailed
        else
            goto :buyhagglesucceeded
        end
    :buyhagglefailed
        setVar $buyhaggle 0
        return
    :buyhagglesucceeded
        setVar $buyhaggle 1
        return


# ----- SUB :buynohaggle
:buynohaggle
    if ($swathoff = 0)

        waitOn "How many holds of"
        send "*"
        gosub :swathoff
        send "*"
    else
        send "**"
    end
    setVar $cyclebufferlimit    20
    add $cyclebuffer 1
    if ($cyclebuffer = $cyclebufferlimit)
        setVar $cyclebuffer 1
        send "/"
        waitOn " Sect "
    end
    return





# ----- SUB :getPortInfo -----
:getPortInfo
    if ($startingLocation = "Citadel")
    send "S*CR*Q"
    else
        send "*CR*Q"
    end
    setVar $validPortFound FALSE
    setTextLineTrigger foundport :foundport2 "Items     Status  Trading % of max OnBoard"
    setTextLineTrigger noport :noport2 "I have no information about a port in that sector."
    setTextLineTrigger noport2 :noport2 "You have never visted sector"
    setTextLineTrigger noport3 :noport2 "credits / next hold"
    setTextLineTrigger noport4 :noport2 "A  Cargo holds     :"
    pause

    :noport2
    killtrigger foundport
    killtrigger noport
    killtrigger noport2
    killtrigger noport3
    killtrigger noport4
    return

    :foundport2
    killtrigger foundport
    killtrigger noport
    killtrigger noport2
    killtrigger noport3
    killtrigger noport4
    setVar $fuelselling 0
        setVar $orgselling 0
        setVar $equipselling 0
    setVar $validPortFound TRUE
        :getselling
            setTextLineTrigger portfuelinfo :portfuelinfo2 "Fuel Ore   Selling"
            setTextLineTrigger portorginfo :portorginfo2 "Organics   Selling"
            setTextLineTrigger portequipinfo :portequipinfo2 "Equipment  Selling"
            setTextLineTrigger gotallportinfo :gotallportinfo2 "<Computer deactivated>"
            pause

        :portfuelinfo2
            getWord CURRENTLINE $fuelselling 4
            setTextLineTrigger portfuelinfo :portfuelinfo2 "Fuel Ore   Selling"
            pause

        :portorginfo2
            getWord CURRENTLINE $orgselling 3
            setTextLineTrigger portorginfo :portorginfo2 "Organics   Selling"
        pause

        :portequipinfo2
            getWord CURRENTLINE $equipselling 3
            setTextLineTrigger portequipinfo :portequipinfo2 "Equipment  Selling"
        pause

        :gotallportinfo2
            killtrigger portfuelinfo
        killtrigger portorginfo
        killtrigger portequipinfo
        killtrigger gotallportinfo
return

# ======================     END BUYING SUBROUTINES     =================
# =================================== ADJACENT CONTROLS ====================================
:voidadjacent
    getSector $CURRENT_SECTOR $sectorInfo
    if ($sectorInfo.warp[1] = 0)
        send "'This sector has no warps, maybe you need to scan it first*"
        halt
    else
        setVar $voidsect 0
        :voids
        add $voidsect 1
        if ($voidsect < 7)
            if ($sectorInfo.warp[$voidsect] <> 0)
                send "CV" & $sectorInfo.warp[$voidsect] & "*Q"
            end
            goto :voids
        end

        send "/"
        waitOn " Sect "    
    end
return
:clearadjacent
    getSector $CURRENT_SECTOR $sectorInfo
    if ($sectorInfo.warp[1] = 0)
        setVar $SWITCHBOARD~message "This sector has no warps, try to scan it first!*"
        gosub :SWITCHBOARD~switchboard
        return
    else
        setVar $voidsect 0
        :clearvoids
        add $voidsect 1
        if ($voidsect < 7)
            if ($sectorInfo.warp[$voidsect] <> 0)
                send "CV0*YN" & $sectorInfo.warp[$voidsect] & "*Q"
            end
            goto :clearvoids
        end

        send "/"
        waitOn " Sect "
    end
return
# =============================== END ADJACENT CONTROLS =============================================

# ===========================  START SWATH DISABLING SUBROUTINE  =================
:swathoff
    if ($swathoff = FALSE)
        setTextTrigger swathison :swathison "Command [TL="
        setDelayTrigger swathisoff :swathisoff 2000
        pause

        :swathison
        killtrigger swathisoff
        killtrigger swathison
        setVar $swathOffMessage "Detected SWATH Autohaggle"
        setVar $swathoff FALSE
        return

        :swathisoff
        killtrigger swathisoff
        killtrigger swathison
        setVar $swathoff TRUE
    end
return
# ==========================   END SWATH DISABLING SUBROUTINE  =================

:startHaggle
    setVar $hfactor 5
:units
        killtrigger ptrade
        killtrigger strade
        killtrigger go
        killtrigger done
    gosub :setConnectionTriggers
        SetTextTrigger ptrade :bunits "do you want to buy ["
        SetTextTrigger strade :sunits "do you want to sell ["
        setTextLineTrigger go :finishhaggle "Agreed, "
        setTextLineTrigger done :donehaggle "empty cargo holds."
        pause

:finishhaggle
        killtrigger done
        gosub :haggle

:donehaggle
 
return

:bunits
        setVar $multiplier (100 - $hfactor)
        goto :units

:sunits
        setVar $multiplier (100 + $hfactor)
    goto :units

:haggle
        setVar $ni 0
        setVar $midhag "-1"
        setVar $nocred 0
        killtrigger 1
        killtrigger 0
        killtrigger donehaggling
    killtrigger donhag
    killtrigger offerme
        gosub :setConnectionTriggers
        setTextTrigger donehag :done_haggle "Command [TL="
        SetTextTrigger donehaggling :done_haggle "empty cargo holds."
        SetTextTrigger offerme :offerme "] ?"
        pause

:offerme
        getWord CURRENTLINE $offer 3
        stripText $offer "["
        stripText $offer "]"
        stripText $offer ","
        stripText $offer "?"
        setVar $orig_offer $offer

:rehaggle
        killtrigger 1
    killtrigger 0
        killtrigger 2
        killtrigger 3
        setVar $offer (($orig_offer * $multiplier) / 100)
        send $offer "*"
        add $midhag 1
        waitFor $offer
        IF ($multiplier > 100)
           subtract $multiplier 1
        ELSE
           add $multiplier 1
        END
        gosub :setConnectionTriggers
        send "@"
        waiton "Average Interval Lag:"
        setTextTrigger 0 :done_haggle "How many holds of"
        setTextTrigger 1 :rehaggle "Your offer"
        setTextTrigger 2 :donehag "We're not interested."
        setTextTrigger 3 :nocreds "You only have"
        pause

:nocreds
        setVAr $nocred 1
        send "0*0*"
        goto :done_haggle

:donehag
        setVar $ni 1

:done_haggle
        killtrigger donehag
        killtrigger 0
        killtrigger 1
        killtrigger 2
        killtrigger 3
        killtrigger rehaggle
        killtrigger donehaggling
        killtrigger offerme
    killalltriggers
return

:setConnectionTriggers
    killtrigger discod1
    killtrigger discod2
    SetEventTrigger     Discod1     :Discod         "CONNECTION LOST"
    SetEventTrigger     Discod2     :Discod         "Connections have been temporarily disabled."

return

#=============================== FORMATTING FOR SPACES =======================================
:formatNumberForSpaces
	if ($inputVariable < 10)
		setVar $outputVariable "    " & $inputVariable
	elseif ($inputVariable < 100)
		setVar $outputVariable "   " & $inputVariable
	elseif ($inputVariable < 1000)
		setVar $outputVariable "  " & $inputVariable
	elseif ($inputVariable < 10000)
		setVar $outputVariable " " & $inputVariable
	else
		setVar $outputVariable $inputVariable
	end
return

:formatPercentageForSpaces
	if ($inputVariable < 10)
		setVar $outputVariable "  (" & $inputVariable&"%)"
	elseif ($inputVariable < 100)
		setVar $outputVariable " (" & $inputVariable&"%)"
	elseif ($inputVariable < 1000)
		setVar $outputVariable "(" & $inputVariable&"%)"
	else
		setVar $outputVariable $inputVariable
	end
return
#============================= END FORMATTING FOR SPACES =====================================

:startCNsettings
    send "CN"
        SetTextLineTrigger ansi1 :cncheck "(1) ANSI graphics            - Off"
        SetTextLineTrigger anim1 :cncheck "(2) Animation display        - On"
        SetTextLineTrigger page1 :cncheck "(3) Page on messages         - On"
        SetTextLineTrigger setsschn :setsschn "(4) Sub-space radio channel"
        SetTextLineTrigger silence1 :cncheck "(7) Silence ALL messages     - Yes"
        SetTextLineTrigger abortdisplay1 :cncheck "(9) Abort display on keys    - ALL KEYS"
        SetTextLineTrigger messagedisplay1 :cncheck "(A) Message Display Mode     - Long"
        SetTextLineTrigger screenpauses1 :cncheck "(B) Screen Pauses            - Yes"
        SetTextLineTrigger onlineautoflee0 :cncdone "(C) Online Auto Flee         - Off"
        SetTextLineTrigger onlineautoflee1 :cncalmostdone "(C) Online Auto Flee         - On"
        pause
    :cncheck
        gosub :getCNC
        pause
        :setsschn
            getWord CURRENTLINE $BOT~subspace 6
        if ($BOT~subspace = 0)
            getRnd $BOT~subspace 101 60000
            send "4" & $BOT~subspace & "*"
        end
        saveVar $BOT~subspace
        pause
    :cncalmostdone
        gosub :getCNC
    :cncdone
            send "QQ"
            killtrigger 1
            killtrigger 2
            SetTextTrigger 1 :subStartCNcontinue "Command [TL="
            SetTextTrigger 2 :subStartCNcontinue "Citadel command (?=help)"
            pause
            :subStartCNcontinue
            killtrigger 1
            killtrigger 2
return
:getCNC
    getWord CURRENTLINE $cnc 1
    stripText $cnc "("
    stripText $cnc ")"
    send $cnc&"  "
return

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


