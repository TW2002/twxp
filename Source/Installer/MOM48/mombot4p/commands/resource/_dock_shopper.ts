	gosub :BOT~loadVars

#=============================================  DOCK SHOPPER MENU  ==================================================
:dock_shopper
 # ============================ START DOCK SHOPPER VARIABLES ==========================
    setVar $LSD_CURENT_VERSION "4.0"
    setVar $LSD_TagLineB "LSDv" & $LSD_CURENT_VERSION
    setVar $LSD_ShipData_Valid      FALSE
    setVar $LSD_Ships_Names         "][LSD]["
    setVar $LSD_Ships_File          "LSD_" & GAMENAME & ".ships"
    setVar $LSD_ShipListMax         50
    setVar $LSD_BOTTING         $bot~bot_name
    setVar $LSD__PAD            "@"
    setArray $LSD_ShipList          $LSD_ShipListMax 3
# ============================ END DOCK SHOPPER VARIABLES ==========================


    setVar $isDockShopper TRUE
    setVar $LSD__Atomics ""
    setVar $LSD__Beacons ""
    setVar $LSD__Corbo ""
    setVar $LSD__Cloak ""
    setVar $LSD__Probe ""
    setVar $LSD__PScan ""
    setVar $LSD__Limps ""
    setVar $LSD__Mines ""
    setVar $LSD__Photon ""
    setVar $LSD__LRScan ""
    setVar $LSD__Disrupt ""
    setVar $LSD__GenTorp ""
    setVar $LSD__T2Twarp ""
    setVar $LSD__Holds ""
    setVar $LSD__Figs ""
    setVar $LSD__Shields ""
    setVar $LSD__Trickster ""
    setVar $LSD_NumberOfShip ""
    setVar $LSD__TOTAL 0
    setVar $LSD_Tow 0
    setVar $LSD_Order ""
    setVar $SWITCHBOARD~bot_name $bot~bot_name
    setVar $SWITCHBOARD~self_command $self_command
    gosub :PLAYER~quikstats
    setVar $startingLocation $PLAYER~CURRENT_PROMPT
    setVar $bot~validPrompts "Command Citadel"
    setVar $bot~startingLocation $startingLocation
    gosub :bot~checkStartingPrompt
    if ($startingLocation = "Citadel")
        send " Q DC  "
        waitfor "Planet #"
        getword CURRENTLINE $planet~planet 2
        stripText $planet~planet "#"
        isNumber $LSD_tst $planet~planet
        if ($LSD_tst = 0)
            setVar $planet~planet 0
        end
    end
    gosub :LoadShipData
    gosub :GetClass0Costs
    gosub :CheckCosts
:start
:TopOfMenu
    echo #27 & "[2J"
:TopOfMenu_NoClear
    gosub :SetMenuEchos
    echo "***"
    echo ("     "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
    echo ANSI_14 & "*        LoneStar's StarDock Shopper"
    echo ANSI_9 & "*         Mind ()ver Matter Edition"
    echo ANSI_15 & "*          Emporium Daily Specials"
    echo ANSI_14 & "*                Version " & $LSD_CURENT_VERSION & "*"
    Echo ("     "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
    echo "*"
    setVar $LSD_PadThisCost $GAME~LSD_ATOMICCOST
    gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "A" & ANSI_5 & ">" & ANSI_9 & " Atomic Detonators      " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Atomics
    setVar $LSD_PadThisCost $GAME~LSD_BEACON
    gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "B" & ANSI_5 & ">" & ANSI_9 & " Marker Beacons         " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Beacons
    setVar $LSD_PadThisCost $GAME~LSD_CORBOCOST
    gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "C" & ANSI_5 & ">" & ANSI_9 & " Corbomite Devices      " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Corbo
    setVar $LSD_PadThisCost $GAME~LSD_CLOAKCOST
    gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "D" & ANSI_5 & ">" & ANSI_9 & " Cloaking Devices       " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Cloak
    setVar $LSD_PadThisCost $GAME~LSD_EPROBE
    gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "E" & ANSI_5 & ">" & ANSI_9 & " SubSpace Ether Probes  " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Probe
    setVar $LSD_PadThisCost $GAME~LSD_PSCAN
    gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "F" & ANSI_5 & ">" & ANSI_9 & " Planet Scanners        " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_PScan
    setVar $LSD_PadThisCost $GAME~LSD_LIMPCOST
    gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "L" & ANSI_5 & ">" & ANSI_9 & " Limpet Tracking Mines  " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Limps
    setVar $LSD_PadThisCost $GAME~LSD_ARMIDCOST
    gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "M" & ANSI_5 & ">" & ANSI_9 & " Space Mines            " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Mines
    setVar $LSD_PadThisCost $GAME~LSD_PHOTONCOST
    gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "P" & ANSI_5 & ">" & ANSI_9 & " Photon Missiles        " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Photon
    setVar $LSD_PadThisCost $GAME~LSD_HOLOCOST
    gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "R" & ANSI_5 & ">" & ANSI_9 & " Long Range Scanners    " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_LRScan
    setVar $LSD_PadThisCost $GAME~LSD_DISRUPTCOST
    gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "S" & ANSI_5 & ">" & ANSI_9 & " Mine Disruptors        " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Disrupt
    setVar $LSD_PadThisCost $GAME~LSD_GENCOST
    gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "T" & ANSI_5 & ">" & ANSI_9 & " Genesis Torpedoes      " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_GenTorp
    setVar $LSD_PadThisCost $GAME~LSD_TWARPIICOST
    gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "W" & ANSI_5 & ">" & ANSI_9 & " T2 TransWarp Drives    " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_T2Twarp
    setVar $LSD_PadThisCost $LSD_HoldCost
    gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "1" & ANSI_5 & ">" & ANSI_9 & " Holds                  " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Holds
    setVar $LSD_PadThisCost $LSD_FighterCost
    gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "2" & ANSI_5 & ">" & ANSI_9 & " Figs                   " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Figs
    setVar $LSD_PadThisCost $LSD_Shield
    gosub :PadItemCosts
    echo ANSI_5 & "*    <" & ANSI_2 & "3" & ANSI_5 & ">" & ANSI_9 & " Shields                " & $LSD_PadThisCost & ANSI_14 & ": " & $LSD_Echo_Shields
    if ($LSD__TOTAL <> 0)
        setVar $LSD_CashAmount $LSD__TOTAL
        gosub :CommaSize
        echo "*                                 " & ANSI_15 & " TOTAL (" & ANSI_7 & "$" & $LSD_CashAmount & ANSI_15 & ")"
        setVar $LSD__TOTAL 0
    end
    echo "*    " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196
    if ($LSD_ShipData_Valid)
        echo ANSI_5 & "*    <" & ANSI_8 & "G" & ANSI_5 & ">" & ANSI_5 & " Buy Ship(s): " & ANSI_8 & $LSD_Echo_Trickster
    else
        echo ANSI_5 & "*    <" & ANSI_8 & "G" & ANSI_5 & ">" & ANSI_5 & " Buy Ship(s): " & ANSI_8 & "Must Run StandAlone Version"
        setVar $LSD__Trickster ""
    end
    if ($LSD__Trickster = "")
        echo ANSI_5 & "*    <" & ANSI_8 & "Y" & ANSI_5 & ">" & ANSI_5 & " Tow & Outfit Another Ship   "  & ANSI_8
        if ($LSD_Tow > 0)
            echo ANSI_15 & "#" & $LSD_Tow
        end
    else
        setVar $LSD_Tow 0
    end
    echo ANSI_5 & "*    <" & ANSI_8 & "Z" & ANSI_5 & ">" & ANSI_5 & " Max Out Ship On Everything!"
    echo ANSI_5 & "*    <" & ANSI_15 & "V" & ANSI_5 & ">" & ANSI_5 & " Name Of Bot To Command " & ANSI_14&": "
    if ($LSD_BOTTING = "") OR ($LSD_BOTTING = "0")
        setVar $LSD_BOTTING $bot~bot_name
    end
    echo ANSI_15 & $LSD_BOTTING
    echo "*        " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196
    echo "*        " & ANSI_14 & "X" & ANSI_15 & " - Execute    " & ANSI_14 & "Q" & ANSI_15 & " - Quit**"
    getConsoleInput $LSD_selection SINGLEKEY
    upperCase $LSD_selection
    setVar $yes_no FALSE
    setVar $item_max 1000
    if ($LSD_selection = "Q")
        echo "**" & ANSI_12 "  Script Halted" & ANSI_15 & "**"
        halt
    elseif ($LSD_selection = "A")
        setVar $item_name "Atomics"
        setVar $item_max 100
        gosub :getItemInput
        setVar $LSD__Atomics $LSD_Selection
    elseif ($LSD_selection = "B")
        setVar $item_name "Marker Beacons"
        setVar $item_max 100
        gosub :getItemInput
        setVar $LSD__Beacons $LSD_Selection
    elseif ($LSD_selection = "C")
        setVar $item_name "Coromite Devices"
        setVar $item_max 100000
        gosub :getItemInput
        setVar $LSD__Corbo $LSD_Selection
    elseif ($LSD_selection = "D")
        setVar $item_name "Cloaking Devices"
        gosub :getItemInput
        setVar $LSD__Cloak $LSD_Selection
    elseif ($LSD_selection = "E")
        setVar $item_name "SubSpace Ether Probe Devices"
        gosub :getItemInput
        setVar $LSD__Probe $LSD_Selection
    elseif ($LSD_selection = "F")
        setVar $item_name "Install Planet Scanner (Y/N)?"
        setVar $yes_no TRUE
        gosub :getItemInput
        setVar $LSD__PScan $LSD_Selection
    elseif ($LSD_selection = "L")
        setVar $item_name "Limpet Tracking Devices"
        gosub :getItemInput
        setVar $LSD__Limps $LSD_Selection
    elseif ($LSD_selection = "M")
        setVar $item_name "Armid Mines To Buy"
        gosub :getItemInput
        setVar $LSD__Mines $LSD_Selection
    elseif ($LSD_selection = "P")
        setVar $item_name "Photon Devices To Buy"
        gosub :getItemInput
        setVar $LSD__Photon $LSD_Selection
    elseif ($LSD_selection = "R")
        setVar $item_name "Holo Scanner (Y/N)?"
        setVar $yes_no TRUE
        gosub :getItemInput
        setVar $LSD__LRScan $LSD_Selection
    elseif ($LSD_selection = "S")
        setVar $item_name "Mine Disruptors"
        gosub :getItemInput
        setVar $LSD__Disrupt $LSD_Selection
    elseif ($LSD_selection = "T")
        setVar $item_name "Genesis Torpedoes"
        gosub :getItemInput
        setVar $LSD__GenTorp $LSD_Selection
    elseif ($LSD_selection = "W")
        setVar $item_name "Install Trans Warp 2 Drive (Y/N)?"
        setVar $yes_no TRUE
        gosub :getItemInput
        setVar $LSD__T2Twarp $LSD_Selection
    elseif ($LSD_Selection = "Y")
        #-------------------------------------------- Tow a Ship
        if ($player~TWARP_TYPE = 2)
            getInput $LSD_selection ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Tow and Outfit a Ship (0 to Cancel)?"
            isNumber $LSD_tst $LSD_selection
            if ($LSD_tst <> 0)
                if (($LSD_selection < 0) or ($LSD_selection > 250))
                    setVar $LSD_Tow 0
                else
                    setVar $LSD_Tow $LSD_selection
                end
            else
                setVar $LSD_Tow 0
            end
        end
    elseif ($LSD_selection = "Z")
        #-------------------------------------------- Buy Max ship on everything
        setVar $LSD__Photon "Max"
        :buyphotonenthoughthereshaz2
        setVar $LSD__TOTAL 0
        setVar $LSD__Atomics "Max"
        setVar $LSD__Beacons "Max"
        setVar $LSD__Corbo "Max"
        setVar $LSD__Cloak "Max"
        setVar $LSD__Probe "Max"
        setVar $LSD__PScan "Yes"
        setVar $LSD__Limps "Max"
        setVar $LSD__Mines "Max"
        setVar $LSD__LRScan "Yes"
        setVar $LSD__Disrupt "Max"
        setVar $LSD__GenTorp "Max"
        setVar $LSD__T2Twarp "Yes"
        setVar $LSD__Holds "Max"
        setVar $LSD__Figs "Max"
        setVar $LSD__Shields "Max"
    elseif ($LSD_selection = "V")
        getInput $LSD_BOTTING ("  " & ANSI_5 & "Enter the Bot Name To Issue LSD Command Too? ")
        if ($LSD_BOTTING = $LSD__PAD)
            setVar $LSD_BOTTING $bot~bot_name
        end
    elseif ($LSD_selection = "1")
        setVar $item_name "Cargo Holds"
        setVar $item_max 255
        gosub :getItemInput
        setVar $LSD__Holds $LSD_Selection
    elseif ($LSD_selection = "2")
        setVar $item_name "Fighters"
        setVar $item_max 400000
        gosub :getItemInput
        setVar $LSD__Figs $LSD_Selection
    elseif ($LSD_selection = "3")
        setVar $item_name "Shields"
        setVar $item_max 16000
        gosub :getItemInput
        setVar $LSD__Shields $LSD_Selection
    elseif (($LSD_selection = "G") AND ($LSD_ShipData_Valid))
        gosub :DisplayMenu
    elseif ($LSD_selection = "X")
        if (($LSD__Atomics = "") AND ($LSD__Beacons = "") AND ($LSD__Corbo = "") AND ($LSD__Cloak = "") AND ($LSD__Probe = "") AND ($LSD__PScan = "") AND   ($LSD__Limps = "") AND ($LSD__Mines = "") AND ($LSD__Photon = "") AND ($LSD__LRScan = "") AND ($LSD__Disrupt = "") AND  ($LSD__GenTorp = "") AND ($LSD__T2Twarp = "") AND ($LSD__Buffers = "") AND ($LSD__Holds = "") AND ($LSD__Figs = "") AND ($LSD__Shields = ""))
            if ($LSD__Trickster = "")
                echo "**" & ANSI_14 & $LSD_TagLineB & ANSI_15 & " - Nothing Was Selected From The Menu**"
                goto :TopOfMenu_NoClear
            end
        end
        if (($LSD_BOTTING = "") or ($LSD_BOTTING = $LSD__PAD))
                echo "****" & ANSI_14 & $LSD_TagLineB & ANSI_15 & " - Please specify name of Bot to address!"
            goto :TopOfMenu_NoClear
        end
        echo "**" ANSI_15
        setVar $item_type $LSD__Atomics
        gosub :prepareOrder
        setVar $item_type $LSD__Beacons
        gosub :prepareOrder
        setVar $item_type $LSD__Corbo
        gosub :prepareOrder
        setVar $item_type $LSD__Cloak
        gosub :prepareOrder
        setVar $item_type $LSD__Probe
        gosub :prepareOrder
        setVar $item_type $LSD__PScan
        setVar $yes_no TRUE
        gosub :prepareOrder
        setVar $item_type $LSD__Limps
        gosub :prepareOrder
        setVar $item_type $LSD__Mines
        gosub :prepareOrder
        setVar $item_type $LSD__Photon
        gosub :prepareOrder
        setVar $item_type $LSD__LRScan
        setVar $yes_no TRUE
        gosub :prepareOrder
        setVar $item_type $LSD__Disrupt
        gosub :prepareOrder
        setVar $item_type $LSD__GenTorp
        gosub :prepareOrder
        setVar $item_type $LSD__T2Twarp
        setVar $yes_no TRUE
        gosub :prepareOrder
        setVar $item_type $LSD__Holds
        gosub :prepareOrder
        setVar $item_type $LSD__Figs
        gosub :prepareOrder
        setVar $item_type $LSD__Shields
        gosub :prepareOrder

	if (($LSD_Tow <> "") and ($LSD_Tow <> 0))
            setVar $LSD_Order ($LSD_Order & $LSD_Tow)
        else
            setVar $LSD_Order ($LSD_Order & 0)
        end
        setVar $LSD_Order ($LSD_Order & $LSD__PAD)
        if ($LSD__Trickster <> "")
            getWordPos $LSD__Trickster $LSD_Pos "^^"
            cuttext $LSD__Trickster $LSD__Trickster 1 ($LSD_pos - 1)
            stripText $LSD__Trickster " "
            stripText $LSD__Trickster "^"
        end
        if ($LSD__Trickster <> "")
            setVar $LSD_Order ($LSD_Order & $LSD__Trickster)
        else
            setVar $LSD_Order ($LSD_Order & 0)
        end
        setVar $LSD_Order ($LSD_Order & $LSD__PAD)
        if ($LSD_NumberOfShip <> "")
            setVar $LSD_Order ($LSD_Order & $LSD_NumberOfShip)
        else
            setVar $LSD_Order ($LSD_Order & 0)
        end
        setVar $LSD_Order ($LSD_Order & $LSD__PAD)
        if ($LSD_CustomShipName <> "")
            setVar $LSD_Order ($LSD_Order & $LSD_CustomShipName)
        else
            setVar $LSD_Order ($LSD_Order & $LSD_Ships_Names)
        end
        if ($LSD_BOTTING = $bot~bot_name)
            setVar $LSD_Order ($LSD_Order & "              ")
            setVar $bot~user_command_line "lsd " & $LSD_Order
            gosub :doAddHistory
        end
        setVar $LSD_Attempt 1
        :LSD_Login_Loop
            killalltriggers
            setTextLineTrigger  NeedtoLogin     :NeedtoLogin    "Send a corporate memo to login."
            setTextLineTrigger  BotsBusy        :BotsBusy       "- Time Left   = "
            setTextLineTrigger  BotsNotBusy     :BotsNotBusy    "Bot Mode :"
            setTextLineTrigger  BotsNotBusy3    :BotsNotBusy    "Bot Mode :General"
            setDelayTrigger     BotNotThere     :BotNotThere    4000
            send ("'" & $LSD_BOTTING & " Status*")
            pause
        :BotNotThere
            killalltriggers
            Echo "**" & ANSI_14 & $LSD_TagLineB & ANSI_15 & " - " & $LSD_BOTTING & "-bot Is Not Responding**"
            halt
            :NeedtoLogin
                killalltriggers
            if ($LSD_Attempt <= 3)
                if ($startingLocation = "Command")
                    send " T T Login***"
                elseif ($startingLocation = "Citadel")
                    send " X T Login***"
                else
                    Echo "**" & ANSI_14 & $LSD_TagLineB & ANSI_15 & " - Please Login to Bots!**"
                    halt
                end
                setDelayTrigger     AreWeLoggedIn   :AreWeLoggedIn  4000
                setTextLineTrigger  WeLoggedIn1     :WeLoggedIn     "- User Verified -"
                setTextLineTrigger  WeLoggedIn2     :WeLoggedIn     "- You are logged into this bot"
                Echo "**" & ANSI_14 & $LSD_TagLineB & ANSI_15 & " - Waiting For Response (Attempt #"&$LSD_Attempt&") ...**"
                pause
                :AreWeLoggedIn
                    killalltriggers
                    add $LSD_Attempt 1
                    goto :LSD_Login_Loop
                :WeLoggedIn
                    killalltriggers
                    #Looping Back to get bot's status
                    goto :LSD_Login_Loop
            else
                Echo "**" & ANSI_14 & $LSD_TagLineB & ANSI_15 & " - Unable To Login to Bot!!**"
                halt
            end
        :BotsBusy
            killalltriggers
            Echo "**" & ANSI_14 & $LSD_TagLineB & ANSI_15 & " - Bot must be in General Mode**"
            halt
        :BotsNotBusy
            killalltriggers
            if ($LSD_BOTTING = $bot~bot_name)
                goto :MODE_RESET
            end
            setTextLineTrigger  MODE_RESET  :MODE_RESET "All non-system scripts and modules killed, and modes reset."
            setDelayTrigger     MODE_ISSUE  :MODE_ISSUE 4000
            Echo "**" & ANSI_14 & $LSD_TagLineB & ANSI_15 & " - Waiting 4 Seconds For Response...**"
            send ("'" & $LSD_BOTTING & " StopAll*")
            pause
            :MODE_ISSUE
                killalltriggers
                Echo "**" & ANSI_14 & $LSD_TagLineB & ANSI_15 & " - StopAll Timed Out. Please Try Again!**"
                halt
            :MODE_RESET
                killalltriggers
                send ("'" & $LSD_BOTTING & " LSD " & $LSD_Order & "*")
                halt
    end
    goto :TopOfMenu
:pad_this
    if ($LSD_str_pad < 10)
        setVar $LSD_str_pad "     " & $LSD_str_pad
    elseif ($LSD_str_pad < 100)
        setVar $LSD_str_pad "    " & $LSD_str_pad
    elseif ($LSD_str_pad < 1000)
        setVar $LSD_str_pad "   " & $LSD_str_pad
    elseif ($LSD_str_pad < 10000)
        setVar $LSD_str_pad "  " & $LSD_str_pad
    elseif ($LSD_str_pad < 100000)
        setVar $LSD_str_pad " " & $LSD_str_pad
    end
return
:CommaSize
    if ($LSD_CashAmount < 1000)
    elseif ($LSD_CashAmount < 1000000)
            getLength $LSD_CashAmount $LSD_len
        setVar $LSD_len ($LSD_len - 3)
        cutText $LSD_CashAmount $LSD_tmp 1 $LSD_len
        cutText $LSD_CashAMount $LSD_tmp1 ($LSD_len + 1) 999
        setVar $LSD_tmp $LSD_tmp & "," & $LSD_tmp1
        setVar $LSD_CashAmount $LSD_tmp
    elseif ($LSD_CashAmount <= 999999999)
        getLength $LSD_CashAmount $LSD_len
        setVar $LSD_len ($LSD_len - 6)
        cutText $LSD_CashAmount $LSD_tmp 1 $LSD_len
        setVar $LSD_tmp $LSD_tmp & ","
        cutText $LSD_CashAmount $LSD_tmp1 ($LSD_len + 1) 3
        setVar $LSD_tmp $LSD_tmp & $LSD_tmp1 & ","
        cutText $LSD_CashAmount $LSD_tmp1 ($LSD_len + 4) 999
        setVar $LSD_tmp $LSD_tmp & $LSD_tmp1
        setVar $LSD_CashAmount $LSD_tmp
    end
    return
:getItemInput
    if ($yes_no)
        Echo #27 & "[1A" & #27 & "[K" & ANSI_14 & "*" & $item_name & "                         *"
        getConsoleInput $LSD_selection SINGLEKEY
    else
        getInput $LSD_selection ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*" & $item_name & " To Buy (M for Maximum)?"
    end
    uppercase $LSD_selection
    if ($LSD_selection = "M")
        setVar $LSD_Selection "Max"
    elseif ($LSD_selection = "Y")
        setVar $LSD_Selection "Yes"
    elseif ($LSD_selection = "N")
        setVar $LSD_Selection ""
    else
        if ($yes_no)
            setVar $LSD_Selection ""
        else
            isNumber $LSD_tst $LSD_selection
            if ($LSD_tst <> 0)
                if ($LSD_selection = 0)
                    setVar $LSD_Selection ""
                elseif ($LSD_selection > $item_max)
                    setVar $LSD_Selection $item_max
                else
                    setVar $LSD_Selection $LSD_selection
                end
            end
        end
    end
return
:prepareOrder
    if ($yes_no)
        if ($item_type <> "")
            setVar $LSD_Order ($LSD_Order & "Y")
        else
            setVar $LSD_Order ($LSD_Order & "N")
        end
    else
        if ($item_type <> "")
            if ($item_type = "Max")
                setVar $LSD_Order ($LSD_Order & "M")
            else
                setVar $LSD_Order ($LSD_Order & $item_type)
            end
        else
            setVar $LSD_Order ($LSD_Order & 0)
        end
    end
    setVar $LSD_Order ($LSD_Order & $LSD__PAD)
    setVar $yes_no FALSE
return
:CheckCosts
    setVar $LSD_CostsAreGood TRUE
    loadVar $GAME~LSD_LIMPREMOVALCOST
    loadVar $GAME~LSD_GENCOST
    loadVar $GAME~LSD_ARMIDCOST
    loadVar $GAME~LSD_LIMPCOST
    loadVar $GAME~LSD_BEACON
    loadVar $GAME~LSD_TWARPICOST
    loadVar $GAME~LSD_TWARPIICOST
    loadVar $GAME~LSD_TWARPUPCOST
    loadVar $GAME~LSD_PSCAN
    loadVar $GAME~LSD_ATOMICCOST
    loadVar $GAME~LSD_CORBOCOST
    loadVar $GAME~LSD_EPROBE
    loadVar $GAME~LSD_PHOTONCOST
    loadVar $GAME~LSD_CLOAKCOST
    loadVar $GAME~LSD_DISRUPTCOST
    loadVar $GAME~LSD_HOLOCOST
    loadVar $GAME~LSD_DSCANCOST
    loadVar $GAME~LSD_ReRegisterCost
    if (($GAME~LSD_LIMPREMOVALCOST = 0) OR ($GAME~LSD_GENCOST = 0) OR ($GAME~LSD_ARMIDCOST = 0) OR ($GAME~LSD_LIMPCOST = 0) OR ($GAME~LSD_BEACON = 0) OR ($GAME~LSD_TWARPICOST = 0) OR ($GAME~LSD_TWARPIICOST = 0) OR ($GAME~LSD_TWARPUPCOST = 0) OR ($GAME~LSD_PSCAN = 0) OR ($GAME~LSD_ATOMICCOST = 0) OR ($GAME~LSD_CORBOCOST = 0) OR ($GAME~LSD_EPROBE = 0) OR ($GAME~LSD_PHOTONCOST = 0) OR ($GAME~LSD_CLOAKCOST = 0) OR ($GAME~LSD_DISRUPTCOST = 0) OR ($GAME~LSD_HOLOCOST = 0) OR ($GAME~LSD_DSCANCOST = 0) OR ($GAME~LSD_ReRegisterCost = 0))
        gosub :GAME~gamestats
    end
return
:PadItemCosts
    getLength $LSD_PadThisCost $LSD_len
    if ($LSD_len = 1)
        setVar $LSD_PadThisCost "      " & $LSD_PadThisCost
    elseif ($LSD_len = 2)
        setVar $LSD_PadThisCost "     " & $LSD_PadThisCost
    elseif ($LSD_len = 3)
        setVar $LSD_PadThisCost "    " & $LSD_PadThisCost
    elseif ($LSD_len = 4)
        setVar $LSD_PadThisCost "   " & $LSD_PadThisCost
    elseif ($LSD_len = 5)
        setVar $LSD_PadThisCost "  " & $LSD_PadThisCost
    elseif ($LSD_len = 6)
        setVar $LSD_PadThisCost " " & $LSD_PadThisCost
    else

    end
    return
:GetClass0Costs
    send "CR1*Q  "
    waitfor "Commerce report for:"
    setTextLineTrigger LSD_CargoHolds   :LSD_CargoHolds "A  Cargo holds     : "
    setTextLineTrigger LSD_Fighters     :LSD_Fighters "B  Fighters        : "
    setTextLineTrigger LSD_Shields      :LSD_Shields "C  Shield Points   : "
    setTextTrigger LSD_Fini1        :LSD_Fini "Command [TL="
    setTextTrigger LSD_Fini2        :LSD_Fini "Citadel command (?"
    pause
    :LSD_CargoHolds
        killTrigger LSD_CargoHolds
        getWord CURRENTLINE $LSD_HoldCost 5
        isNumber $LSD_tst $LSD_HoldCost
        if ($LSD_tst = 0)
            setVar $LSD_HoldCost 0
        end
        pause
    :LSD_Fighters
        killTrigger LSD_Fighters
        getWord CURRENTLINE $LSD_FighterCost 4
        isNumber $LSD_tst $LSD_FighterCost
        if ($LSD_tst = 0)
            setVar $LSD_FighterCost 0
        end
        pause
    :LSD_Shields
        killTrigger LSD_Shields
        getWord CURRENTLINE $LSD_Shield 5
        isNumber $LSD_tst $LSD_Shield
        if ($LSD_tst = 0)
            setVar $LSD_Shield 0
        end
        pause
    :LSD_Fini
        killalltriggers
    setVar $LSD_CashAmount $LSD_HoldCost
    gosub :CommaSize
    setVar $LSD_LSD_HoldCost $LSD_CashAmount
    setVar $LSD_CashAmount $LSD_FighterCost
    gosub :CommaSize
    setVar $LSD_FighterCost $LSD_CashAmount
    setVar $LSD_CashAmount $LSD_Shield
    gosub :CommaSize
    setVar $LSD_Shield  $LSD_CashAmount
    return
:SetMenuEchos
    isNumber $LSD_tst $LSD_NumberOfShip
    if ($LSD_tst <> 0)
        if ($LSD_NumberOfShip > 0)
            getText $LSD__Trickster $LSD_Cost "^^" "@@"
            stripText $LSD_Cost ","
            stripText $LSD_Cost " "
            getText $LSD__Trickster $LSD_temp "@@" "!!"
            stripText $LSD_ReRegisterCost ","
            setVar $LSD_Cost ($LSD_Cost + $LSD_ReRegisterCost)
            setVar $LSD_MathOut ($LSD_NumberOfShip * $LSD_Cost)
            setVar $LSD__TOTAL ($LSD__TOTAL + $LSD_Mathout)
            setVar $LSD_CashAmount $LSD_Mathout
            gosub :CommaSize
                setVar $LSD_Echo_Trickster ANSI_15 & $LSD_NumberOfShip & " " & $LSD_temp & ANSI_7 & "  ($" & $LSD_CashAmount & ")"
            else
            setVar $LSD_Echo_Trickster ""
        end
    else
        setVar $LSD_Echo_Trickster ""
    end
    setVar $item_number $LSD__Atomics
    setVar $LSD_Cost $GAME~LSD_ATOMICCOST
    gosub :doSetMenuEcho
    setVar $LSD_Echo_Atomics $item_echo 
    setVar $item_number $LSD__Beacons
    setVar $LSD_Cost $GAME~LSD_BEACON
    gosub :doSetMenuEcho
    setVar $LSD_Echo_Beacons $item_echo 
    setVar $item_number $LSD__Corbo
    setVar $LSD_Cost $GAME~LSD_CORBOCOST
    gosub :doSetMenuEcho
    setVar $LSD_Echo_Corbo $item_echo 
    setVar $item_number $LSD__Cloak
    setVar $LSD_Cost $GAME~LSD_CLOAKCOST
    gosub :doSetMenuEcho
    setVar $LSD_Echo_Cloak $item_echo 
    setVar $item_number $LSD__Probe
    setVar $LSD_Cost $GAME~LSD_EPROBE
    gosub :doSetMenuEcho
    setVar $LSD_Echo_Probe $item_echo 
    if ($LSD__PScan = "Yes")
        setVar $LSD_Cost $GAME~LSD_PSCAN
        stripText $LSD_Cost ","
        setVar $LSD_MathOut $LSD_Cost
        isNumber $LSD_tst $LSD_NumberOfShip
        if ($LSD_tst <> 0)
            setVar $LSD_MathOut ($LSD_MathOut * $LSD_NumberOfShip)
            setVar $LSD_Multiplier ANSI_8 & "(X" & $LSD_NumberOfShip & ")"
        else
            setVar $LSD_Multiplier ""
        end
        setVar $LSD__TOTAL ($LSD__TOTAL + $LSD_MathOut)
        setVar $LSD_CashAmount $LSD_MathOut
        gosub :CommaSize
        setVar $LSD_Echo_PScan ANSI_15 & $LSD__PScan & "  " & $LSD_Multiplier & ANSI_7 & "($" & $LSD_CashAmount & ")"
    else
        setVar $LSD_Echo_PScan ""
    end
    setVar $item_number $LSD__Limps
    setVar $LSD_Cost $GAME~LSD_LIMPCOST
    gosub :doSetMenuEcho
    setVar $LSD_Echo_Limps $item_echo 
    setVar $item_number $LSD__Mines
    setVar $LSD_Cost $GAME~LSD_ARMIDCOST
    gosub :doSetMenuEcho
    setVar $LSD_Echo_Mines $item_echo 
    setVar $item_number $LSD__Photon
    setVar $LSD_Cost $GAME~LSD_PHOTONCOST
    gosub :doSetMenuEcho
    setVar $LSD_Echo_Photon $item_echo 
    if ($LSD__LRScan = "Yes")
        setVar $LSD_Cost $GAME~LSD_HOLOCOST
        stripText $LSD_Cost ","
        setVar $LSD_MathOut $LSD_Cost
        isNumber $LSD_tst $LSD_NumberOfShip
        if ($LSD_tst <> 0)
            setVar $LSD_MathOut ($LSD_MathOut * $LSD_NumberOfShip)
            setVar $LSD_Multiplier ANSI_8 & "(X" & $LSD_NumberOfShip & ")"
        else
            setVar $LSD_Multiplier ""
        end
        setVar $LSD__TOTAL ($LSD__TOTAL + $LSD_MathOut)
        setVar $LSD_CashAmount $LSD_MathOut
        gosub :CommaSize
        setVar $LSD_Echo_LRScan ANSI_15 & $LSD__LRScan & "  " & $LSD_Multiplier & ANSI_7 & "($" & $LSD_CashAmount & ")"
    else
        setVar $LSD_Echo_LRScan ""
    end
    setVar $item_number $LSD__Disrupt
    setVar $LSD_Cost $GAME~LSD_DISRUPTCOST
    gosub :doSetMenuEcho
    setVar $LSD_Echo_Disrupt $item_echo 
    setVar $item_number $LSD__GenTorp
    setVar $LSD_Cost $GAME~LSD_GENCOST
    gosub :doSetMenuEcho
    setVar $LSD_Echo_GenTorp $item_echo 
    if ($LSD__T2Twarp = "Yes")
        setVar $LSD_Cost $GAME~LSD_TWARPIICOST
        stripText $LSD_Cost ","
        setVar $LSD_MathOut $LSD_Cost
        isNumber $LSD_tst $LSD_NumberOfShip
        if ($LSD_tst <> 0)
            setVar $LSD_MathOut ($LSD_MathOut * $LSD_NumberOfShip)
            setVar $LSD_Multiplier ANSI_8 & "(X" & $LSD_NumberOfShip & ")"
        else
            setVar $LSD_Multiplier ""
        end
        setVar $LSD__TOTAL ($LSD__TOTAL + $LSD_MathOut)
        setVar $LSD_CashAmount $LSD_MathOut
        gosub :CommaSize
        setVar $LSD_Echo_T2Twarp ANSI_15 & $LSD__T2Twarp & "  " & $LSD_Multiplier & ANSI_7 & "($" & $LSD_CashAmount & ")"
    else
        setVar $LSD_Echo_T2Twarp ""
    end
    setVar $item_number $LSD__Holds
    setVar $LSD_Cost $LSD_HOLDCOST
    gosub :doSetMenuEcho
    setVar $LSD_Echo_Holds $item_echo 
    setVar $item_number $LSD__Figs
    setVar $LSD_Cost $GAME~LSD_FIGHTERCOST
    gosub :doSetMenuEcho
    setVar $LSD_Echo_Figs $item_echo 
    setVar $item_number $LSD__Shields
    setVar $LSD_Cost $GAME~LSD_SHIELD
    gosub :doSetMenuEcho
    setVar $LSD_Echo_Shields $item_echo 
return
:doSetMenuEcho
    isNumber $LSD_tst $item_number
    if ($LSD_tst <> 0)
        stripText $LSD_Cost ","
        setVar $LSD_MathOut ($item_number * $LSD_Cost)
        isNumber $LSD_tst $LSD_NumberOfShip
        if ($LSD_tst <> 0)
            setVar $LSD_MathOut ($LSD_MathOut * $LSD_NumberOfShip)
            setVar $LSD_Multiplier ANSI_8 & "(X" & $LSD_NumberOfShip & ")"
        else
            setVar $LSD_Multiplier ""
        end
        setVar $LSD__TOTAL ($LSD__TOTAL + $LSD_MathOut)
        setVar $LSD_CashAmount $LSD_MathOut
        gosub :CommaSize
        setVar $item_echo ANSI_15 & $item_number & "  " & $LSD_Multiplier & ANSI_7 & "($" & $LSD_CashAmount & ")"
    elseif ($item_number  = "Max")
        setVar $item_echo "Max"
    else
        setVar $item_echo ""
    end
return
:LoadShipData
    fileExists $LSD_test $LSD_Ships_File
    if ($LSD_test)
        setVar $LSD_i 1
        read $LSD_Ships_File $LSD_Line $LSD_i
        while (($LSD_Line <> EOF) AND ($LSD_i <= $LSD_ShipListMax))
            getWordPos $LSD_Line $LSD_pos #9
            if ($LSD_pos <> 2)
                setVar $LSD_ShipData_Valid FALSE
                return
            end
            cutText $LSD_Line $LSD_temp 1 1
            setVar $LSD_ShipList[$LSD_i] $LSD_temp
            cutText $LSD_Line $LSD_Line2 3 999
            SetVar $LSD_Line $LSD_line2
            getWordPos $LSD_Line $LSD_pos #9
            if ($LSD_pos = 0)
                setVar $LSD_ShipData_Valid FALSE
                return
            end
            cutText $LSD_Line $LSD_temp1 1 ($LSD_pos - 1)
            setVar $LSD_ShipList[$LSD_i][1] $LSD_temp1
            stripText $LSD_Line $LSD_temp1 & #9
            getWordPos $LSD_Line $LSD_pos #9
            if ($LSD_pos = 0)
                setVar $LSD_ShipData_Valid FALSE
                return
            end
            cutText $LSD_Line $LSD_temp2 1 ($LSD_pos - 1)
            setVar $LSD_ShipList[$LSD_i][2] $LSD_temp2
            stripText $LSD_Line $LSD_temp2 & #9
            setVar $LSD_ShipList[$LSD_i][3] $LSD_Line
            :NextRealLine
            add $LSD_i 1
            read $LSD_Ships_File $LSD_Line $LSD_i
            end
            setVar $LSD_ShipData_Valid TRUE
    else
        setVar $LSD_ShipData_Valid FALSE
    end
    return
:ParseShipData
    delete $LSD_Ships_File
    setVar $LSD_i 0
    send "S B N Y ?"
    waitfor "Which ship are you interested in "
    setTextLineTrigger NextPage     :NextPage "<+> Next Page"
    :NextPageReset
    setTextLineTrigger Quit2Leave   :Quit2Leave "<Q> To Leave"
    :LineTrigNext
    setTextLineTrigger LineTrig     :LineTrig
    pause
    :NextPage
        killalltriggers
        add $LSD_i 1
        setVar $LSD_ShipList[$LSD_i] "+"
        setVar $LSD_ShipList[$LSD_i][1] "This Inidcates"
        setVar $LSD_ShipList[$LSD_i][2] "Another"
        setVar $LSD_ShipList[$LSD_i][3] "Page is availble for display"
        send "+"
        waitfor "Which ship are you interested in "
        setTextLineTrigger LineTrig     :LineTrig
        setTextLineTrigger NextPage     :Quit2Leave "<+> Next Page"
        setTextLineTrigger Quit2Leave   :Quit2Leave "<Q> To Leave"
        pause
    :Quit2Leave
        killalltriggers
        send " Q Q "
        waitfor "<StarDock> Where to? (?="
        delete $LSD_tstFile
        setVar $LSD_ii 1
        while ($LSD_ii <= $LSD_i)
            write $LSD_Ships_File $LSD_ShipList[$LSD_ii] & #9 & $LSD_ShipList[$LSD_ii][1] & #9 & $LSD_ShipList[$LSD_ii][2] & #9 & $LSD_ShipList[$LSD_ii][3]
            add $LSD_ii 1
        end
        return
    :LineTrig
        setVar $LSD_temp CURRENTLINE & "@@@"
        if ($LSD_temp <> "@@@")
            getWordPos $LSD_temp $LSD_pos "<"
            if ($LSD_pos = 1)
                getWordPos $LSD_temp $LSD_pos "<Q>"
                if ($LSD_pos = 0)
                    add $LSD_i 1
                    GetText $LSD_temp $LSD_ShipList[$LSD_i] "<" ">"
                    GetText $LSD_temp $LSD_ShipList[$LSD_i][1] "> " "   "
                    GetText $LSD_temp $LSD_ShipList[$LSD_i][2] "   " "@@@"
                    stripText $LSD_ShipList[$LSD_i][2] " "
                    if ($LSD_ShipList[$LSD_i][2] = "")
                        setvar $LSD_ShipList[$LSD_i][2] "999,999,999"
                    end
                    GetText CURRENTANSILINE  $LSD_ShipList[$LSD_i][3] "[35m> " "    "
                end
            end
        end
        goto :LineTrigNext
:DisplayMenu
    setVar $LSD_LineWidthMax 45
    setVar $LSD_PAGES_EXIST FALSE
    setVar $LSD_NumberOfShip ""
    setVar $LSD_i 1
    :NextPagePlease
        Echo #27 & "[2J"
        Echo "***"
        if ($isDockShopper)
            Echo ("     "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
            echo ANSI_14 & "*        LoneStar's StarDock Shopper"
            echo ANSI_9 & "*         Mind ()ver Matter Edition"
            echo ANSI_15 & "*          Emporium Daily Specials"
            echo ANSI_8 & "*                Version " & $LSD_CURENT_VERSION & "*"
            Echo ("     "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
            echo "*"
        end
        setArray $LSD_MenuSelections $LSD_ShipListMax
        while ($LSD_ShipList[$LSD_i] <> 0)
            if ($LSD_ShipList[$LSD_i] <> "+")
                setVar $LSD_Spaces $LSD_LineWidthMax
                setVar $LSD_ANSI_Line "  " & ANSI_5 & "<" & ANSI_6 & $LSD_ShipList[$LSD_i] & ANSI_5 & "> "
                setVar $LSD_temp $LSD_ShipList[$LSD_i][2]
                stripText $LSD_temp ","
                stripText $LSD_temp " "
                getLength $LSD_ShipList[$LSD_i][1] $LSD_len
                if ($LSD_len > ($LSD_LineWidthMax - 10))
                    subtract $LSD_len 10
                    cutText $LSD_ShipList[$LSD_i][3] $LSD_temp 1 $LSD_len
                else
                    setVar $LSD_temp $LSD_ShipList[$LSD_i][3]
                end
                setVar $LSD_ANSI_Line $LSD_ANSI_Line & $LSD_temp
                subtract $LSD_Spaces $LSD_len
                getLength $LSD_ShipList[$LSD_i][2] $LSD_len
                subtract $LSD_Spaces $LSD_len
                setVar $LSD_Spacer ""
                while ($LSD_Spaces > 0)
                    setVar $LSD_Spacer $LSD_Spacer & " "
                    subtract $LSD_Spaces 1
                end
                setVar $LSD_ANSI_Line $LSD_ANSI_Line & $LSD_Spacer & ANSI_14 & $LSD_ShipList[$LSD_i][2] & "*"
                setVar $LSD_MenuSelections[$LSD_i] $LSD_ShipList[$LSD_i]
                echo $LSD_ANSI_Line
            else
                setVar $LSD_PAGES_EXIST TRUE
                SetVar $LSD_PageIDX $LSD_i
                goto :PageDone
            end
            add $LSD_i 1
        end
    :PageDone
        echo "   " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196
        echo "*"
        if ($LSD_PAGES_EXIST)
            Echo "  " & ANSI_5 & "<" & ANSI_6 & "+" & ANSI_5 & ">" & ANSI_6 & " NextPage*"
        end
        echo "  " & ANSI_5 & "<" & ANSI_6 & "Q" & ANSI_5 & ">" & ANSI_6 & " To Leave*"
        echo "*"
    :MakingAnotherSlection
        echo "  " & ANSI_5 & "Which ship are you interested in? "
        getConsoleInput $LSD_selection SINGLEKEY
        upperCase $LSD_selection
        if ($LSD_selection = "Q")
            return
        elseif (($LSD_PAGES_EXIST) AND ($LSD_selection = "+"))
        if ($LSD_i = $LSD_PageIDX)
            setVar $LSD_PageTwoSelected TRUE
            add $LSD_i 1
        else
            setVar $LSD_PageTwoSelected FALSE
            setVar $LSD_i 1
        end
        goto :NextPagePlease
        else
        setVar $LSD_ptr 1
        while ($LSD_ptr <= $LSD_ShipListMax)
            if ($LSD_MenuSelections[$LSD_ptr] <> 0)
                if ($LSD_MenuSelections[$LSD_ptr] = $LSD_selection)
                    setPrecision 0
                    setVar $LSD_NumberOfShip ""
                    :InputAnotherAmount
                        getInput $LSD_NumberOfShip "  " & ANSI_5 & "How Many " & $LSD_ShipList[$LSD_ptr][1] & "'s ?"
                        isNumber $LSD_test $LSD_NumberOfShip
                        if ($LSD_test = 0)
                            goto :InputAnotherAmount
                        end
                        if (($LSD_NumberOfShip < 0))
                            setVar $LSD_NumberOfShip 0
                            setVar $LSD__Trickster ""
                            goto :InputAnotherAmount
                        end
                        if ($LSD_NumberOfShip = 0)
                            setVar $LSD__Trickster ""
                        else
                            if ($LSD_PageTwoSelected)
                                setVar $LSD__Trickster "+" & $LSD_selection & "^^" & $LSD_ShipList[$LSD_ptr][2] & "@@" & $LSD_ShipList[$LSD_ptr][3] & "!!"
                            else
                                setVar $LSD__Trickster $LSD_selection & "^^" & $LSD_ShipList[$LSD_ptr][2] & "@@" & $LSD_ShipList[$LSD_ptr][3] & "!!"
                            end
                            getInput $LSD_CustomShipName "  " & ANSI_5 & "What do you want to name this ship? (30 chars) "
                            if ($LSD_CustomShipName = "")
                                setVar $LSD_CustomShipName $LSD_Ships_Names
                            else
                                setVar $LSD_CustomShipNameTEST $LSD_CustomShipName
                                stripText $LSD_CustomShipNameTEST " "
                                if ($LSD_CustomShipNameTEST = "")
                                    setVar $LSD_CustomShipName $LSD_Ships_Names
                                else
                                    getLength $LSD_CustomShipName $LSD_len
                                    if ($LSD_len > 30)
                                        cutText $LSD_CustomShipName $LSD_CustomShipName 1 30
                                    end
                                end
                            end
                        end
                    return
                end
            end
            add $LSD_ptr 1
        end
    end
    echo "*"
    echo #27 & "[1A" & #27 & "[2K"
    goto :MakingAnotherSlection
return
:doAddHistory
        loadVar $BOT~historyString
        setVar $BOT~history[1] $bot~user_command_line
        setVar $BOT~historyString $BOT~history[1]&"<<|HS|>>"&$BOT~historyString
        saveVar $BOT~historyString
return
#============================================= END DOCK SHOPPER MENU  ==================================================

#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\bot_includes\player\quikstats\player"
include "source\module_includes\bot\checkstartingprompt\bot"
include "source\bot_includes\game\gamestats\game"
