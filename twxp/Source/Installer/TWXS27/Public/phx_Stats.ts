# Status Window
# 1.0?
# Add - Updates cloaking devices when purchased.

# v1.06
# Fix - Was changing ore in holds after a planet xport

# v1.05
# Fix - Updates holds when getting colos from terra
# Add - Calculates usage of ore in holds after a twarp

# v1.03
# I forgot what changes I made and I never uploaded it at this update...heh.
systemscript

# -----Script Setup------------------------------------------------------------
setvar $version "Status*Window  v1.06"
setvar $line GAMENAME
window stats 93 400 $line ONTOP
setwindowcontents stats $version & "****     PLEASE**     GET**     INITIAL**     UPDATE**     WITH**     I or /*********   p]-[x scripts*"
:start
    settextlinetrigger IS :infoscreen "<Info>"
    settextlinetrigger QS :quickstats #179
    pause

# -----Triggers----------------------------------------------------------------
:top
    killalltriggers
    settextlinetrigger AD :atomd "How many Atomic Detonators do you want (Max"
    settextlinetrigger AN1 :align1 "your alignment went "
    settextlinetrigger IG :ig "Your Interdictor generator is now "
    settextlinetrigger IS :infoscreen "<Info>"
    settextlinetrigger BN1 :beacon1 "Beacon Launched!"
    settextlinetrigger BN2 :beacon2 "How many Beacons do you want (Max"
    settextlinetrigger CK1 :cloak1 "How many Cloaking units do you want (Max"
    settextlinetrigger CT1 :creds1 " credits richer!"
    settextlinetrigger CT2 :creds2 " credits."
    settextlinetrigger CT3 :creds2 " credits and "
    settextlinetrigger CT4 :creds4 " per unit to upgrade the "
    settextlinetrigger CT5 :creds5 " credits, and the Treasury has "
    settextlinetrigger CT6 :creds6 " credits, and "
    settextlinetrigger CT7 :creds7 " credits have been "
    settextlinetrigger DG1 :damage1 "The console reports damages of "
    settextlinetrigger DG2 :damage2 "Shipboard Computers "
    settextlinetrigger EP1 :eprobe1 "Please enter a destination for this probe :"
    settextlinetrigger EP2 :eprobe2 "How many Probes do you want (Max"
    settextlinetrigger FG1 :figs1 "How many K-3A fighters do you want to buy (Max "
    settextlinetrigger FG2 :figs2 " fighter(s) in close support."
    settextlinetrigger FG3 :figs3 "How many Fighters do you want to "
    settextlinetrigger FG4 :figs4 "How many fighters do you want defending this sector?"
    settextlinetrigger FG5 :figs5 " shields left."
    settextlinetrigger FG6 :figs6 " fighters, and "
    settextlinetrigger FG7 :figs7 "Destroy the Marker Beacon here? Yes"
    settextlinetrigger GT :gtorp "How many Genesis Torpedoes do you want (Max"
    settextlinetrigger HD1 :holds1 "How many Cargo Holds do you want installed? "
    settextlinetrigger HD2 :holds2 "He arrives shortly and fines you "
    settextlinetrigger JN :jettison "Are you sure you want to jettison all cargo? (Y/N) Yes"
    settextlinetrigger MD1 :disrpt1 "Disruptor launched into sector "
    settextlinetrigger MD2 :disrpt2 "How many Mine Disruptors do you want (Max"
    settextlinetrigger MN1 :mines1 " mine(s) on board."
    settextlinetrigger MN2 :mines2 "We stock the traditional Armid Mines"
    settextlinetrigger MN3 :mines3 "Ah yes! The revolutionary Marlin Limpet Mine!"
    settextlinetrigger MV1 :move1 "<Move>"
    settextlinetrigger MV2 :move2 "Auto Warping to sector "
    settextlinetrigger MV3 :move3 "Planet is now in sector "
    settextlinetrigger MV7 :move7 "Beam to what sector? (U=Upgrade Q=Quit)"
    settextlinetrigger MV8 :moved "I towed you from sector "
    settextlinetrigger MV9 :moved "You fled from "
    settextlinetrigger PN1 :photon1 "Photon Missile launched into sector"
    settextlinetrigger PN2 :photon2 " launched a P-Missile in sector "
    settextlinetrigger PN3 :photon3 "How many Photon Missiles do you want (Max"
    settextlinetrigger PT1 :turnscut "<Port>"
    settextlinetrigger PT2 :turnscut "<Thievery>"
    settextlinetrigger PT3 :turnscut "Landing on Federation StarDock."
    settextlinetrigger PT4 :port4 "How many holds of"
    settextlinetrigger PS :planetscreen "Planet #"
    settextlinetrigger PL1 :planet1 " this planet you receive "
    settextlinetrigger PL2 :planet2 "Planet command (?=help) [D] Q"
    settextlinetrigger PL3 :planet3 "<Take/Leave Products>"
    settextlinetrigger PL4 :planet3 "<Load/Unload Colonists>"
    settextlinetrigger PL5 :planet3 "colonists ready to leave Terra."
    settextlinetrigger QS :quickstats #179
    settextlinetrigger SC1 :shipchange1 "Security code accepted, engaging transporter control."
    settextlinetrigger SC2 :shipchange1 "For getting blown up, you lost "
    settextlinetrigger SD1 :shields1 "How many shield armor points do you want to buy (Max"
    settextlinetrigger SD2 :shields2 " shields, and "
    settextlinetrigger TN1 :turns1 "You recover "
    settextlinetrigger TN2 :turns2 "One turn deducted, "
    settextlinetrigger XP1 :exp1 " experience point"
    settextlinetrigger XX1 :logout "...Now leaving Trade Wars 2002"
    settextlinetrigger XX2 :logout "You will have to start over from scratch!"
    pause

# -----Individual Triggers-----------------------------------------------------
# -Purchase cloaking devices-----------
:cloak1
    setvar $line CURRENTLINE
    getword $line $var 12
    if ($var <> "")
        add $clks $var
    end
    goto :update
# -Xported to another ship-------------
:shipchange1
    killalltriggers
    setwindowcontents stats $version & "***     SHIP**     CHANGED**     PLEASE**     GET**     INITIAL**     UPDATE**     WITH**     I or /******   p]-[x scripts*"
    goto :start
# -Purchase/sell products--------------
:port4
    goto :update

# -Purchase fighters---------------------------------------
:figs1
    setvar $line CURRENTLINE & "@"
    gettext $line $var "? " "@"
    if ($var <> "") and ($var <> 0)
        add $figs $var
    end
    goto :update
# -Update figs from other points-------
:figs2
    setvar $line CURRENTLINE
    getword $line $figs 4
    striptext $figs ","
    goto :update
# -Take or leave figs on planet--------
:figs3
    setvar $line CURRENTLINE & "@"
    getword $line $var2 8
    gettext $line $var "] ? " "@"
    if ($var = "")
        gettext $line $var ") [" "] ?"
    end
    if ($var2 = "take")
        add $figs $var
    elseif ($var2 = "leave")
        subtract $figs $var
    end
    goto :update
# -Tried to fig FedSpace? tisk tisk----
:figs4
    if ($sect < 11) or ($sect = STARDOCK)
        setvar $line CURRENTLINE & " @"
        getword $line $var 10
        add $figs $var
        setPrecision 2
        setVar $var ($figs * 0.1)
        setVar $var ($var - 0.5)
        round $var 0
        setPrecision 0
        subtract $figs $var
        setPrecision 2
        setVar $var ($hlds * 0.1)
        setVar $var ($var - 0.5)
        round $var 0
        setPrecision 0
        subtract $hlds $var
        goto :update
    end
    goto :top
# -Port attacked you!------------------
:figs5
    setvar $line CURRENTLINE
    getword $line $figs 3
    getword $line $shlds 6
    goto :update
# -Exchange figs with corpie-----------
:figs6
    setvar $line CURRENTLINE
    cuttext $line $var 1 9
    if ($var <> "You have ")
        goto :top
    end
    getword $line $figs 3
    goto :update
# -Destroy a beacon...and a fig--------
:figs7
    subtract $figs 1
    goto :update
# -Damage to ship------------------------------------------
:damage1
    setvar $line CURRENTLINE
    getword $line $var 6
    striptext $var ","
    if ($shlds > $var)
        subtract $shlds $var
    else
        subtract $var $shlds
        setvar $shlds 0
        subtract $figs $var
    end
    goto :update
:damage2
    setvar $line CURRENTLINE
    gettext $line $var "destroyed " " shield"
    if ($var <> "")
        gettext $line $var2 "and " " fighters"
        subtract $shlds $var
    elseif ($var = "")
        gettext $line $var2 "destroyed " " fighters"
    end
    if ($var2 <> "")
        subtract $figs $var2
    end
    goto :update
# -Credits update------------------------------------------
:creds1
    setvar $line CURRENTLINE
    getword $line $var 1
    striptext $var ","
    add $creds $var
    goto :update
:creds2
    setvar $line CURRENTLINE
    replacetext $line " and" "."
    getword $line $var2 4
    if ($var2 <> "credits.")
        goto :top
    end
    gettext $line $creds "have " " credits"
    striptext $creds ","
    goto :update
# -Credits after port upgrading--------
:creds4
    setvar $line CURRENTLINE
    getword $line $var 4
    killalltriggers
    settextlinetrigger A :upgrade "How many units do you want to invest? ("
    pause
    :upgrade
        setvar $line CURRENTLINE & " @"
        getword $line $var2 14
        multiply $var $var2
        subtract $creds $var
    goto :update
# -Credits to/from the treasure--------
:creds5
    setvar $line CURRENTLINE
    getword $line $creds 3
    striptext $creds ","
    goto :update
# -Exchange creds with corpie or treasury
:creds6
    setvar $line CURRENTLINE
    cuttext $line $var 1 9
    if ($var <> "You have ")
        goto :top
    end
    getword $line $creds 3
    striptext $creds ","
    goto :update
# -Deposit or withdraw creds from bank-
:creds7
    setvar $line CURRENTLINE
    getword $line $var 1
    striptext $var ","
    getword $line $var2 5
    if ($var2 = "deposited")
        subtract $creds $var
    elseif ($var2 = "withdrawn")
        add $creds $var
    end
    goto :update
# -Experience changes--------------------------------------
:exp1
    setvar $line CURRENTLINE
    gettext $line $line "you " " experience"
    getword $line $var 2
    getword $line $var2 1
    if ($var2 = "lost") or ($var2 = "LOSE")
        subtract $exp $var
    elseif ($var2 = "receive")
        add $exp $var
    end
    goto :update
# -Alignment changes---------------------------------------
:align1
    setvar $line CURRENTLINE
    gettext $line $line "went " " point"
    getword $line $var 3
    getword $line $var2 1
    if ($var2 = "down")
        subtract $aln $var
    elseif ($var2 = "up")
        add $aln $var
    end
    goto :update
# -Jettison holds------------------------------------------
:jettison
    setvar $ore 0
    setvar $org 0
    setvar $equ 0
    setvar $col 0
    goto :update
# -Turns recovery------------------------------------------
:turns1
    setvar $line CURRENTLINE
    getword $line $var 3
    add $turns $var
    goto :update
# -Turns update------------------------
:turns2
    setvar $line CURRENTLINE
    gettext $line $turns "deducted, " " turns"
    goto :update
# -Purchase cargo holds------------------------------------
:holds1
    setvar $line CURRENTLINE & "@"
    gettext $line $var "? " "@"
    if ($var <> "") and ($var <> 0)
        add $hlds $var
    end
    goto :update
# -Holds lost From busting-------------
:holds2
    setvar $line CURRENTLINE
    setvar $ore 0
    setvar $org 0
    setvar $equ 0
    getword $line $var 7
    subtract $hlds $var
    goto :update
# -Purchase shields----------------------------------------
:shields1
    setvar $line CURRENTLINE & "@"
    gettext $line $var "? " "@"
    if ($var <> "") and ($var <> 0)
        add $shlds $var
    end
    goto :update
# -Exchange shields with corpie or citadel
:shields2
    setvar $line CURRENTLINE
    cuttext $line $var 1 9
    if ($var <> "You have ")
        goto :top
    end
    getword $line $shlds 3
    goto :update
# -Turn Interdictor generator on and off-------------------
:ig
    setvar $line CURRENTLINE
    getword $line $ig 6
    goto :update
# -Use of Genesis Torpedoes and Atomic Detonators----------
:planet1
    setvar $line CURRENTLINE
    striptext $line "up "
    getword $line $var 2
    if ($var = "building")
        subtract $gtorp 1
        add $exp 25
    elseif ($var = "blowing")
        subtract $atmdt 1
        add $exp 50
        subtract $aln 1
    end
    goto :update
# -Checks to see if turns deduction needed after blastoff from planet
:planet2
    if ($turnscut = 1) and ($turns <> "Unlimited") and ($turns <> 0)
        subtract $turns 1
        setvar $turnscut 0
        goto :update
    end
    goto :top
# -Take product or colonists from planet
:planet3
    killalltriggers
    settextlinetrigger 1 :planet_take " do you want to take (["
    settextlinetrigger 2 :planet_leave " do you want to leave (["
    pause
    :planet_take
        setvar $line CURRENTLINE & "@"
        getword $line $var2 5
        gettext $line $var ") ? " "@"
        if ($var = "")
            gettext $line $var " ([" "] empty"
        end
        settextlinetrigger 1 :planet_cant_take
        pause
        :planet_cant_take
            setvar $line CURRENTLINE
            if ($line = "There aren't that many on the planet!")
                goto :top
            end
        if ($var2 = "Fuel")
            add $ore $var
        elseif ($var2 = "Organics")
            add $org $var
        elseif ($var2 = "Equipment")
            add $equ $var
        elseif ($var2 = "Colonists")
            add $col $var
        end
        if ($turnscut = 0)
            setvar $turnscut 1
        end
        goto :update
    :planet_leave
        setvar $line CURRENTLINE & "@"
        getword $line $var2 5
        gettext $line $var ") ? " "@"
        if ($var = "")
            gettext $line $var " ([" "] on"
        end
        if ($var2 = "Fuel")
            subtract $ore $var
        elseif ($var2 = "Organics")
            subtract $org $var
        elseif ($var2 = "Equipment")
            subtract $equ $var
        elseif ($var2 = "Colonists")
            subtract $col $var
        end
        goto :update
# -Purchase Atomic Detonators----------
:atomd
    setvar $line CURRENTLINE & "@"
    gettext $line $var "] ? " "@"
    if ($var <> "")
        add $atmdt $var
    end
    goto :update
# -Purchase Genesis Torpedoes----------
:gtorp
    setvar $line CURRENTLINE & "@"
    gettext $line $var "] ? " "@"
    if ($var <> "")
        add $gtorp $var
    end
    goto :update
# -Use a mine disrupter------------------------------------
:disrpt1
    subtract $mdis 1
    goto :update
# -Buy mine disrupters-----------------
:disrpt2
    setvar $line CURRENTLINE & "@"
    gettext $line $var "] ? " "@"
    if ($var <> "")
        add $mdis $var
    end
    goto :update
# -Fire a photon-------------------------------------------
:photon1
    subtract $phot 1
    goto :update
# -Get hit by a photon-----------------
:photon2
    if ($ig = "ON")
        setvar $ig "OFF"
    end
    if ($turns <> "Unlimited") and ($turns <> 0)
        setvar $turns 0
    end
    goto :update
# -Purchase photon missiles------------
:photon3
    setvar $line CURRENTLINE & "@"
    gettext $line $var "] ? " "@"
    if ($var <> "")
        add $phot $var
    end
    goto :update
# -Use an Ether Probe--------------------------------------
:eprobe1
    setvar $line CURRENTLINE & "@"
    gettext $line $var ":  " "@"
    if ($var <> "")
        subtract $eprb 1
    end
    goto :update
# -Puchase ether probes----------------
:eprobe2
    setvar $line CURRENTLINE & "@"
    gettext $line $var "? " "@"
    if ($var <> "")
        add $eprb $var
    end
    goto :update
# -Use a cloaking device-----------------------------------
:cloak1
    subtract $clks 1
    goto :update
# -Purchase cloaking devices-----------
:cloak2
    setvar $line CURRENTLINE
    getword $line $var 12
    add $clks $var
    goto :update
# -Launch a beacon-----------------------------------------
:beacon1
    subtract $bcns 1
    goto :update
# -Purchase beacons--------------------
:beacon2
    setvar $line CURRENTLINE
    getword $line $var 11
    add $bcns $var
    goto :update
# -Deploy mines--------------------------------------------
:mines1
    setvar $line CURRENTLINE
    getword $line $var 5
    if ($var = "Armid")
        getword $line $armd 4
    elseif ($var = "Limpet")
        getword $line $lmpt 4
    end
    goto :update
# -Purchase mines----------------------
:mines2
    setvar $var "Armid"
    goto :mines_buy
:mines3
    setvar $var "Limpet"
:mines_buy
    killalltriggers
    settextlinetrigger A :mines_line "How many mines do you want (Max"
    pause
    :mines_line
        setvar $line CURRENTLINE
        if ($var = "Armid")
            getword $line $var 11
            add $armd $var
        elseif ($var = "Limpet")
            getword $line $var 11
            add $lmpt $var
        end
    goto :update

# -Move to another sector----------------------------------
:move1
    killalltriggers
    settextlinetrigger A :movea "Sector  : "
    settextlinetrigger B :moveb "Command [TL="
    settextlinetrigger C :top "TransWarp Drive shutting down."
    pause
    :movea
        setvar $line CURRENTLINE
        getword $line $sect 3
        getdistance $var $sectlast $sect
        if ($var > 1)
            setvar $var ($var * 3)
            subtract $ore $var
        end
        goto :turnscut
    :moveb
        setvar $line CURRENTLINE
        gettext $line $sect "]:[" "] ("
        getdistance $var $sectlast $sect
        if ($var > 1)
            setvar $var ($var * 3)
            subtract $ore $var
        end
        goto :turnscut
:move2
    setvar $line CURRENTLINE
    getword $line $sect 5
    goto :turnscut
:move3
    setvar $line CURRENTLINE
    getword $line $sect 6
    goto :update
:move7
    killalltriggers
    settextlinetrigger A :movec "Sector  : "
    settextlinetrigger B :moved "Command [TL="
    settextlinetrigger C :top "Transporter shutting down."
    pause
    :movec
        setvar $line CURRENTLINE
        getword $line $sect 3
        goto :turnscut
    :moved
        setvar $line CURRENTLINE
        gettext $line $sect "]:[" "] ("
        goto :turnscut
# -Fled or towed to another sector-----
:moved
    setvar $line CURRENTLINE & "@"
    gettext $line $sect "to sector " "@"
    goto :update

# -----Subtract turns ----------------------------------------------------turns
:turnscut
    if ($tpw <> 0) and ($turns <> "Unlimited") and ($turns <> 0)
        subtract $turns $tpw
    end
    goto :update
# -----Update from planet display----------------------------------------------
:planetscreen
    setvar $line CURRENTLINE
    gettext CURRENTLINE $sect "sector " ": "
    :planet_lines
        killalltriggers
        settextlinetrigger A :planet_ore "Fuel Ore "
        settextlinetrigger B :planet_org "Organics "
        settextlinetrigger C :planet_equ "Equipment"
        settextlinetrigger D :planet_fig "Fighters "
        pause
        :planet_ore
            setvar $line CURRENTLINE
            getword $line $ore 7
            goto :planet_lines
        :planet_org
            setvar $line CURRENTLINE
            getword $line $org 6
            goto :planet_lines
        :planet_equ
            setvar $line CURRENTLINE
            getword $line $equ 6
            goto :planet_lines
        :planet_fig
            setvar $line CURRENTLINE
            getword $line $figs 6
            striptext $figs ","
    goto :update

# -----Info screen-------------------------------------------------------------
:infoscreen
    killalltriggers
    settextlinetrigger A :i_rank "Rank and Exp   :"
    settextlinetrigger C :i_tpw "Turns to Warp  : 1"
    settextlinetrigger D :i_sect "Current Sector :"
    settextlinetrigger E :i_turns "Turns left     :"
    settextlinetrigger F :i_hlds "Total Holds    :"
    settextlinetrigger G :i_figs "Fighters       :"
    settextlinetrigger H :i_shlds "Shield points  :"
    settextlinetrigger I :i_armid "Armid Mines  T1:"
    settextlinetrigger J :i_limpt "Limpet Mines T2:"
    settextlinetrigger K :i_bcns "Marker Beacons :"
    settextlinetrigger L :i_phot "Photon Missiles:"
    settextlinetrigger M :i_gtorp "Genesis Torps  :"
    settextlinetrigger N :i_atmdt "Atomic Detn.   :"
    settextlinetrigger P :i_clks "Cloaking Device:"
    settextlinetrigger Q :i_eprb "Ether Probes   :"
    settextlinetrigger R :i_mdis "Mine Disruptors:"
    settextlinetrigger X :i_ig "Interdictor ON :"
    settextlinetrigger Y :i_creds "Credits        :"
    pause
    :i_rank
        getword CURRENTLINE $exp 5
        striptext $exp ","
        getword CURRENTLINE $aln 7
        striptext $aln "Alignment="
        striptext $aln ","
        goto :infoscreen
    :i_tpw
        getword CURRENTLINE $tpw 5
        goto :infoscreen
    :i_sect
        getword CURRENTLINE $sect 4
        goto :infoscreen
    :i_turns
        getword CURRENTLINE $turns 4
        goto :infoscreen
# -----written by ElderProphet---------
     :i_hlds
         setVar $line CURRENTLINE & " @@"
         getWord $line $hlds 4
         replaceText $line "=" " "
         striptext $line "Fuel "
         setVar $var2 6
         setvar $ore 0
         setvar $org 0
         setvar $equ 0
         setvar $col 0
         getWord $line $text $var2
         while ($text <> "@@")
             cutText $text $var 1 3
             if ($var = "Ore")
                 getWord $line $ore ($var2 + 1)
             elseif ($var =  "Org")
                 getWord $line $org ($var2 + 1)
             elseif ($var = "Equ")
                 getWord $line $equ ($var2 + 1)
             elseif ($var = "Col")
                 getWord $line $col ($var2 + 1)
             end
             add $var2 1
             getWord $line $text $var2
         end
         setvar $var 0
         goto :infoscreen
# -----End EP's code-------------------
# -----My broken code------------------
#      :i_hlds
#           setvar $line CURRENTLINE & "X"
#           replacetext $line " " "X"
#           gettext $line $hlds ":X" "X-"
#           gettext $line $ore "Ore=" "X"
#            if ($var <> "")
#                setvar $ore $var
#            end
#           gettext $line $org "Organics=" "X"
#            if ($var <> "")
#                setvar $org $var
#            end
#           gettext $line $equ "Equipment=" "X"
#            if ($var <> "")
#                setvar $equ $var
#            end
#           gettext $line $col "Colonists=" "X"
#            if ($var <> "")
#                setvar $col $var
#            end
# -----End my broken code--------------
    :i_figs
        getword CURRENTLINE $figs 3
        striptext $figs ","
        goto :infoscreen
    :i_shlds
        getword CURRENTLINE $shlds 4
        striptext $shlds ","
        goto :infoscreen
    :i_armid
        getword CURRENTLINE $armd 4
        getword CURRENTLINE $lmpt 8
        goto :infoscreen
    :i_limpt
        getword CURRENTLINE $lmpt 4
        goto :infoscreen
    :i_bcns
        getword CURRENTLINE $bcns 4
        goto :infoscreen
    :i_phot
        getword CURRENTLINE $phot 3
        getword CURRENTLINE $gtorp 7
        goto :infoscreen
    :i_gtorp
        getword CURRENTLINE $gtorp 4
        goto :infoscreen
    :i_atmdt
        getword CURRENTLINE $atmdt 4
        getword CURRENTLINE $crbo 7
        goto :infoscreen
    :i_clks
        getword CURRENTLINE $clks 3
        getword CURRENTLINE $eprb 7
        goto :infoscreen
    :i_eprb
        getword CURRENTLINE $eprb 4
        goto :infoscreen
    :i_mdis
        getword CURRENTLINE $mdis 3
        goto :infoscreen
    :i_ig
        getword CURRENTLINE $ig 4
        if ($ig = "No")
            setvar $ig "OFF"
        elseif ($ig = "Yes")
            setvar $ig "ON"
        end
        goto :infoscreen
    :i_creds
        getword CURRENTLINE $creds 3
        striptext $creds ","
        goto :update

# -----QuickStats--------------------------------------------------------------
:quickstats
    setvar $line $line & "      "
    cuttext $line $var2 1 6
    if ($var2 <> " Sect ")
        setvar $line ""
    end
    setvar $var 0
    setvar $line $line & CURRENTLINE
    replacetext $line #179 " "
    striptext $line ","
    while ($var < 6)
        replacetext $line "  " " "
        add $var 1
    end
    getword $line $var 55
    getword $line $var2 53
    if ($var = "Ship") or ($var2 = "Ship")
        goto :qsstrip
    end
    goto :top
    :qsstrip
        getword $line $sect 2
        getword $line $turns 4
        getword $line $creds 6
        getword $line $figs 8
        getword $line $shlds 10
        getword $line $hlds 12
        getword $line $ore 14
        getword $line $org 16
        getword $line $equ 18
        getword $line $col 20
        getword $line $phot 21
        if ($phot = "Phot")
            getword $line $phot 22
        else
            setvar $phot ""
        end
        gettext $line $armd "Armd " " Lmpt"
        gettext $line $lmpt "Lmpt " " GTorp"
        gettext $line $gtorp "GTorp " " TWarp"
        gettext $line $clks "Clks " " Beacns"
        gettext $line $bcns "Beacns " " AtmDt"
        gettext $line $atmdt "AtmDt " " Crbo"
        gettext $line $eprb "EPrb " " MDis"
        gettext $line $mdis "MDis " " PsPrb"
        gettext $line $aln "Aln " " Exp"
        gettext $line $exp "Exp " " Corp"
        if ($exp = "")
            gettext $line $exp "Exp " " Ship"
        end
        setvar $line ""

# -----Update the script window------------------------------------------------
:update
    setvar $sectlast $sect
    setvar $var ($ore + $org)
    setvar $var ($var + $equ)
    setvar $var ($var + $col)
    setvar $empty ($hlds - $var)
    if ($aln > 4500000)
        setvar $aln 4500000
    end
    if ($aln < "-4500000")
        setvar $aln "-4500000"
    end
    if ($exp > 4500000)
        setvar $exp 4500000
    end
    setvar $credits $creds
    if ($credits >= 1000000000)
        setvar $credits "1 bil"
    elseif ($credits >= 100000000)
        cuttext $credits $var 1 3
        setvar $credits $var & " mil"
    elseif ($credits >= 10000000)
        cuttext $credits $var 1 2
        setvar $credits $var & " mil"
    end
    setwindowcontents stats "Trns:  " & $turns & "*" & "Sect:  " & $sect & "*" & "Exp:   " & $exp & "*" & "Algn:  " & $aln & "*" & "Crds:  " & $credits & "*" & "------HOLDS-----------*" & "Empt: " & $empty & "*" & "Ore:    " & $ore & "*" & "Org:    " & $org & "*" & "Equ:    " & $equ & "*" & "Col:     " & $col & "*" & "----TACTICAL-----------*" & "Figs:    " & $figs & "*" & "Shlds: " & $shlds & "*" & "Phot:   " & $phot & "*" & "Dsrpt:  " & $mdis & "*" & "Armd:  " & $armd & "*" & "Lmpt:   " & $lmpt & "*" & "IG:        " & $ig & "*" & "-------SHIP----------*" & "GTorp:  " & $gtorp & "*" & "AtmDt:  " & $atmdt & "*" & "EPrb:     " & $eprb & "*" & "Clks:     " & $clks & "*" & "Bcns:    " & $bcns & "*"
    goto :top

:logout
    halt
