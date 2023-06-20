# adjacent sector speedbuy
setVar $buyFuel "n"
setVar $buyOrganic "n"
setVar $buyEquipment "n"
setVar $bp 1
setVar $finalTrip 0

getword Currentline $prompt 1
if ($prompt <> "Planet")
    echo ANSI_12 "** This script must start at the planet prompt!! **"
    echo ANSI_12 "** Please get to the planet prompt... **"
    setTextTrigger pPrompt :planetPrompt "Planet command (?"
    pause
end

:planetPrompt
    send "*"
    setTextLineTrigger info :info "in sector"
    pause
    :info
    getword currentline $planetNumber 2
    stripText $planetNumber "#"
    getword currentline $cs 5
    stripText $cs ":"


send "tnl1*tnl2*tnl3*snl1*"
send "qi"
setTextLineTrigger th :th "Total Holds"
pause
:th
getword CURRENTLINE $holds 4
waitfor "Command"
gosub :getAdjacentSectors
gosub :checkPortSelling
:menu
echo "[2J"
echo ANSI_12 "*<<<<<<<<<< " ANSI_15 "ProAdjacent SpeedBuy v1.0" ANSI_12 " >>>>>>>>>>*"
echo ANSI_12 "*  1.  Select Sector to use: " ANSI_9 $tradeSector "  " ANSI_11 "<" $sectorType ">"
echo ANSI_12 "*  2.  Buy Fuel y/n:       (" ANSI_14 $portFuel ANSI_12 " on hand) "
if ($buyFuel = "y")
   echo ANSI_9 $amtFuel
else
   echo ANSI_9 $buyFuel
end
echo ANSI_12 "*  3   Buy Organics? y/n:  (" ANSI_14 $portOrganics ANSI_12 " on hand) "
if ($buyOrganic = "y")
   echo ANSI_9 $amtOrganic
else
   echo ANSI_9 $buyOrganic
end
echo ANSI_12 "*  4   Buy Equipment? y/n: (" ANSI_14 $portEquipment ANSI_12 " on hand) "
if ($buyEquipment = "y")
   echo ANSI_9 $amtEquipment
else
   echo ANSI_9 $buyEquipment
end
echo ANSI_12 "*  S.  Start me Up."
echo ansi_14 "*  Q.  " ANSI_12 "Quit*"
echo ANSI_12 "*<<<<<<<<<<<<<<<< " ANSI_15 "by Promethius" ANSI_12 " >>>>>>>>>>>>>>>>*"
getConsoleInput $menuChoice singlekey
lowercase $menuChoice

if ($menuChoice = "1")
    gosub :getAdjacentSectors
    gosub :checkPortSelling
elseif ($menuChoice = "2")
   if ($buyFuel = "n")
       setVar $buyFuel "y"
       echo ANSI_13 "**Enter the amount of fuel to buy*"
       getConsoleInput $amtFuel
       if ($amtFuel > $portFuel)
          setVar $amtFuel $portFuel
       end
   else
       setVar $buyFuel "n"
       setVar $amtFuel "0"
   end

elseif ($menuChoice = "3")
   if ($buyOrganic = "n")
       setVar $buyOrganic "y"
       echo ANSI_13 "**Enter the amount of organics to buy*"
       getConsoleInput $amtOrganic
       if ($amtOrganic > $portOrganics)
          setVar $amtOrganic $portOrganics
       end
   else
       setVar $buyOrganic "n"
       setVar $amtOrganic "0"
   end

elseif ($menuChoice = "4")
    if ($buyEquipment = "n")
        setVar $buyEquipment "y"
        echo ANSI_13 "**Enter the amount of equipment to buy*"
        getConsoleInput $amtEquipment
        if ($amtEquipment > $portEquipment)
           setVar $amtEquipment $portEquipment
        end
    else
        setVar $buyEquipment "n"
        setVar $amtEquipment "0"
    end
elseif ($menuChoice = "s")
    goto :startMeUp
elseif ($menuChoice = "q")
    halt
end

goto :menu

:startMeUp
if ($buyFuel = "y")
    setVar $bp 1
    setVar $buyProduct "Fuel"
    setVar $buyAmount $amtFuel
    gosub :buyItAlready
end
if ($buyOrganic = "y")
   setVar $bp 2
   setVar $buyProduct "Organics"
   setVar $buyAmount $amtOrganic
    gosub :buyItAlready
end
if ($buyEquipment = "y")
   setVar $bp 3
   setVar $buyProduct "Equipment"
   setVar $buyAmount $amtEquipment
    gosub :buyItAlready
end
send "'ProAdjacent Speedbuy 1.0 run completed*"
halt

:buyItAlready
  killalltriggers
  send "cr" $tradeSector "*q"
  waitfor " -----     ------"
    setTextlineTrigger fo :prod $buyProduct
    pause
    :prod
     if ($bp = 1)
        getword currentline $onhand 4
     else
        getword currentline $onhand 3
     end
  if ($onHand < $buyamount)
       setVar $buyAmount $onHand
  end
  setVar $trips ($buyamount / $holds)
  setVar $ckTrips ($holds * $trips)
  if ($buyamount > $ckTrips)
      add $trips 1
      setVar $finalTrip ($buyamount - $ckTrips)
  end
  setVar $i 1
  waitfor "Command"
  while ($i <= $trips)
    send "m" $tradeSector "*  p  t  "
    waitfor "Enter your"
    :buyProduct
     killalltriggers
     setTextTrigger howmanyFuel :gotIt "How many holds of Fuel"
     setTextTrigger howmanyOrg :gotIt "How many holds of Organics"
     setTextTrigger howmanyEq :gotIt "How many holds of Equipment"
     setTextTrigger done :doneBuy "Command ["
     pause
     :gotIt
        killAllTriggers
        getword currentline $type 5
        if ($type = $buyProduct)
           if ($finalTrip <> 0) and ($i = $trips)
              send $finalTrip "**0*  0*  "
           else
              send $holds "**0*  0*  "
           end
        else
           send "0*"
           goto :buyproduct
        end
       :doneBuy
           killAllTriggers
           send "<  l  " $planetNumber "*  t  n  l  " $bp "*q  "
           add $i 1
  end
 return

# ------- GoSubs ------- #

:getAdjacentSectors
  setArray $secNums SECTOR.WARPINCOUNT[$cs]
  setVar $i 1
  setVar $secValue 1
#  if ($secNums = 1)
#     goto :endAdjacent
#  end

  echo "**" ANSI_11 " Select trade sector *"
  while ($i <= SECTOR.WARPINCOUNT[$cs])
     setVar $secNumsType[$i] ""
     setVar $secNums[$i] SECTOR.WARPSIN[$cs][$i]

     if (PORT.BUYfuel[$secNums[$i]] = TRUE) and (PORT.EXISTS[$secNums[$i]] = TRUE)
        setVar $secNumsType[$i] "B"
     else
        setVar $secNumsType[$i] "S"
     end
     if (PORT.BUYorg[$secNums[$i]] = TRUE) and (PORT.EXISTS[$secNums[$i]] = TRUE)
        setVar $secNumsType[$i] $secNumsType[$i] & "B"
     else
        setVar $secNumsType[$i] $secNumsType[$i] & "S"
     end

     if (PORT.BUYequip[$secNums[$i]] = TRUE) and (PORT.EXISTS[$secNums[$i]] = TRUE)
         setVar $secNumsType[$i] $secNumsType[$i] & "B"
     else
         setVar $secNumsType[$i] $secNumsType[$i] & "S"
     end
     if (PORT.EXISTS[$secNums[$i]] = TRUE)
        echo ANSI_15 "* <" $i ">  " ANSI_9 $secNums[$i] ANSI_11 " (" $secNumsType[$i] ")"
     else
        echo ANSI_15 "* <" $i ">  " ANSI_9 $secNums[$i] ANSI_12 " No Port!"
        setVar $secNumsType[$i] "---"
     end

     add $i 1
  end
  echo "* "
  getConsoleInput $secValue singlekey
  :endAdjacent
  setVar $tradeSector $secNums[$secValue]
  setVar $sectorType $secNumsType[$secValue]

  return

:checkPortSelling
    setVar $portFuel "0"
    setVar $portOrganics "0"
    setVar $portEquipment "0"
    send "cr" $tradeSector "*q"
    if (port.BuyFuel[$tradeSector] = 0)
        setTextLineTrigger pFuel :pFuel "Fuel Ore"
    end
    if (port.buyOrg[$tradeSector] = 0)
        setTextLineTrigger pOrganic :pOrganic "Organics"
    end
    if (port.buyEquip[$tradeSector] = 0)
        setTextLineTrigger pEquipment :pEquipment "Equipment"
    end
    setTextTrigger doneckSelling :doneCkSelling "Command [TL"
    pause
    :pfuel
       getword Currentline $portFuel 4
       pause
    :pOrganic
       getWord Currentline $portOrganics 3
       pause
    :pEquipment
       getWord Currentline $portEquipment 3
       pause
    :doneCkSelling
    killalltriggers
 return

