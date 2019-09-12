
# move cols/product to planet from a donor planet for Citadel upgrade
# Original Script by:  Promethius - Released as .cts 01/2011
#                      03/2011 - Source released into the wild.
# Enhancements planned:
# done (1) Auto generation of the sectors/planets from the TL - list saved to file
# (2) Checking against the upgrade tracking to see if a trip to a sector is required - ignoring L6 and upgrades in progress
# done (3) Window status of donar planet, x of y sectors done status, current fill planet status
# done (4) Possibly the use of a second planet if the first runs low on cols/product.
# done (5) Generation of best route
# Done (6) Turns monitoring



setVar $version "Mass CitBuilder v 0.9"
# upgrade results file
setVar $gameFile GAMENAME &  "PlanetUpgrades.txt"
# file created from auto-gen
setVar $autoGenFile GAMENAME & "UpgradeSectorList.txt"
getword currentLine $prompt 1

if ($prompt <> "Planet") and ($prompt <> "Citadel")
   echo ANSI_12 "**!!! You must start from the planet's surface !!!"
   echo ANSI_12 "*!!! of the planet to move product from.      !!!"
   halt
end

gosub :qStats
setVar $shipholds $ship_hlds

:menu

  echo ANSI_12 "**Use second planet if first runs low on col/prod? y/n*"
  getConsoleInput $useSecond singleKey
  if ($useSecond = "y")
     echo ANSI_11 "*Enter the planet number to use*"
     getConsoleInput $secondPlanet
     echo ANSI_11 "*Enter the sector for the second planet*"
     getConsoleInput $secondPlanetSector
  end
  echo ANSI_12 "**Minimum turns to stop at or 0 for unlimited*"
  getConsoleInput $minTurns
  echo ANSI_12 "**Auto-generate a list of sectors? y/n*"
  getConsoleInput $autoGen singleKey
  if ($autoGen = "n")
     echo ANSI_11 "*Enter sectors or file name of sectors to mass upgrade.*"
     getConsoleInput $useList
     replaceText $useList "," " "
  end
  echo ANSI_13 "*  Q - Quit"
  echo ANSI_10 "*  S - Start"
  getConsoleInput $pChoice SINGLEKEY
  if ($pChoice = "q")
      halt
  elseif ($pChoice = "s")
      setVar $sectorArray[1] CURRENTSECTOR
      goto :workList
  end
  echo ANSI_12 "**  Sorry, " ANSI_15 $pChoice ANSI_12 " is not a valid choice)"
  setDelayTrigger ID10T :ID10T 5000
  pause
  :ID10T
  goto :menu

  :workList
   if ($autoGen <> "n")
     gosub :autoGen
  end
  getword $useList $firstNum 1
  isNumber $test $firstNum
  getword $useList $secondNum 2
  isNumber $test2 $secondNum

  if ($test = 0)
     fileexists $exists $useList
     if ($exists)
        readToArray $useList $sectorArray
        setVar $upGradeSectors $sectorArray
        gosub :sortRoute
     else
        echo ANSI_12 "**!!! " $useList " not found - Halting !!!"
        halt
     end
  elseif ($test) and ($test2)
      setVar $i 1
      getword $useList $sectorArray[$i] $i
      while ($sectorArray[$i] <> 0)
        add $i 1
        getword $useList $sectorArray[$i] $i
      end
      setVar $upGradeSectors ($i - 1)
      gosub :sortRoute
  else
     setVar $upGradeSectors 1
     gosub :disp
  end

Window citBuilder 335 435 $version & " by Promethius  "  ONTOP
setVar $sectCounter 1

:startMeUp
  killalltriggers
if ($prompt = "Citadel")
   send "q"
end
 send "*"
setTextLineTrigger mySector :mySector "in sector"
pause
:mySector
getword currentline $mySector 5
stripText $mySector ":"
getword currentline $startPlanet 2
stripText $startPlanet "#"
  setVar $startPlanetCols 0
getDistance $oreSafeMin $baseSector $mySector
multiply $oreSafeMin 400
add $sortOre $oreSafeMin
setVar $inputVar $unSortOre
gosub :genFormat
     setvar $msg1 "* Unsorted Route: " & $outPutVar & " Ore Req"
setVar $inputVar $sortOre
gosub :genFormat
     setVar $msg1 $msg1 & "* Sorted Route  : " & $outPutVar  & " Ore Req*"
add $oreSafeMin 2000
  waitfor "-------  ---------"
  setTextLineTrigger startOre :startOre "Fuel Ore "
  setTextLineTrigger startOrg :startOrg "Organics "
  setTextLineTrigger startEqu :startEqu "Equipment"
  pause
  :startOre
    getword currentline $startPlanetFuelCol 3
    getword currentline $startPlanetFuel 6
    stripText $startPlanetFuelCol ","
    stripText $startPlanetFuel ","
    subtract  $startPlanetFuel $oreSafeMin
    pause
  :startOrg
    getword currentline $startPlanetOrgCol 2
    getword currentline $startPlanetOrg 5
    stripText $startPlanetOrgCol ","
    stripText $startPlanetOrg ","
    pause
  :startEqu
    getword currentline $startPlanetEquCol 2
    getword currentline $startPlanetEqu 5
    stripText $startPlanetEquCol ","
    stripText $startPlanetEqu ","
    setVar $startPlanetCols ($startPlanetFuelcol + $startPlanetOrgCol + $startPlanetEquCol)
    send "c "

# setup our moves
# need a resume method

gosub :setWindow
while ($sectorArray[$sectCounter] <> 0)
      send "p " $sectorArray[$sectCounter] "*y"
      setTextTrigger pBurnHops :pBurnHops "hops away from here"
      setTextTrigger alreadyThere :alreadyThere "You are already in that sector!"
      pause
      :pBurnHops
      killtrigger alreadyThere
      getword currentLine $pBurnHops 4
      setTextTrigger goodPWarp :goodPWarp "Locating beam pinpointed, TransWarp"
      setTextTrigger badPWarp :badPWarp "You cannot "
      pause
      :badPWarp
        killtrigger goodPWarp
        killtrigger alreadyThere
        write $gameFile " *"
        write $gameFile "!!! No fighter down for sector " & $sectorArray[$sectCounter] & " !!!*"
        echo ANSI_12 "*** !!! No fighter down in " $sectorArray[$sectCounter] " !!!***"
        goto :endLoop
      :goodPWarp
        killtrigger badPWarp
        killtrigger alreadyThere
        echo ANSI_11 "** Planet now in sector " $sectorArray[$sectCounter] "**"
        subtract $startPlanetFuel ($pBurnHops * 400)
      :alreadyThere
       killtrigger badPWarp
       killtrigger goodPWarp
       killtrigger pBurnHops
   send "qq"
   gosub :getplanetNumbers
   setVar $planetsFilled 1
   while ($planetsFilled <= $pNumCnt)
         setVar $fillPlanet $pNumber[$planetsFilled]
         gosub :setWindow
         send "qqjy l  " #8 $fillPlanet "* "
         waitfor "Planet command"
         gosub :checkPlanetNeeds
         if ($notEnoughVar = 1)
             if ($useSecond = "y")
                 killalltriggers
                 send "q l " & #8 & $startPlanet & "* c p " $secondPlanetSector "* y"
                 send "qq l " & #8 & $secondPlanet "**c"
                 waitfor "#" & $secondPlanet
                 setVar $prompt "Citadel"
                 setVar $notEnoughVar 0
                 goto :startMeUP
              end
          end
         add $planetsFilled 1
   end
   :endLoop
   add $sectCounter 1
   if ($sectCounter > $upgradeSectors)
       goto :endScript
   end
end
 :endScript
 send "p " $mysector "* y s"
 echo ANSI_14 "**+-+-+-  File Saved As: " ANSI_10 $gameFile ANSI_14 "  -+-+-+**"
halt


:checkPlanetNeeds
  killalltriggers
  getDate $dateChecked
  setVar $citExists ""
  send "*"
  waitfor "Planet #" & $pNumber[$planetsFilled]
  waitfor " -------  ---------  ---------  ---------  ---------  ---------"
  setTextLineTrigger endOre :endOre "Fuel Ore "
  setTextLineTrigger endOrg :endOrg "Organics "
  setTextLineTrigger endEqu :endEqu "Equipment"
  setTextTrigger citExists :citExists "Citadel, treasury"
  setTextTrigger PlanetDone :planetDone "Planet command (?"
  setTextTrigger maxedIG :maxedIG "Planetary Interdictor Generator ="
  setTextTrigger underConst :underConst "under construction,"
  pause
  :endOre
    getword currentline $endPlanetFuelCol 3
    getword currentline $endPlanetFuel 6
    stripText $endPlanetFuelCol ","
    stripText $endPlanetFuel ","
    pause
  :endOrg
    getword currentline $endPlanetOrgCol 2
    getword currentline $endPlanetOrg 5
    stripText $endPlanetOrgCol ","
    stripText $endPlanetOrg ","
    pause
  :endEqu
    getword currentline $endPlanetEquCol 2
    getword currentline $endPlanetEqu 5
    stripText $endPlanetEquCol ","
    stripText $endPlanetEqu ","
    setVar $endPlanetCols ($endPlanetFuelCol + $endPlanetOrgCol + $endPlanetEquCol)
    pause
  :citExists
    setVar $citExists "q"
    pause
   :underConst
     killalltriggers
     echo ansi_12 "**!!! " CURRENTLINE & " !!! **"
     gosub :planetUpGradeStat
     send "q*  l " #8 $startPlanet "* c "
     return
  :maxedIG
   killalltriggers
   write $gameFile "Planet: " & $stat_fillPlanet  & " | Sector: " & $stat_sector & " | Date: " & $dateChecked & " | " & "0 Day(s) | Planetary Interdictor"
   send "q*  l " #8 $startPlanet "* c "
   return
  :planetDone


:checkCitRequirements
   killalltriggers
   send "c u* " $citExists "*"
   setTextTrigger cannot :cannotUpgrade "This Citadel cannot"
   setTextTrigger inProgress :inProgress "Be patient, your Citadel"
   setTextTrigger colsNeeded :colsNeeded " Colonists to support"
   setTextTrigger fuelNeeded :fuelNeeded " units of Fuel Ore,"
   setTextTrigger orgNeeded :orgNeeded " units of Organics,"
   setTextTrigger equNeeded :equNeeded " units of Equipment and"
   setTextTrigger beingBuild :beingBuilt "You may not upgrade while"
   pause

:beingBuilt
     killalltriggers
     echo ansi_12 "**" & CURRENTLINE & "!!!*"
     send "q*  l " #8 $startPlanet "* c "
     return

   :inProgress
     killalltriggers
     send "*"
     setTextTrigger L1Cit :L1Cit "day(s) till complete"
     pause
     :L1Cit
     gosub :planetUpGradeStat
     send "q*  l " #8 $startPlanet "* c "
     return

   :cannotUpgrade
     killalltriggers
     echo ANSI_12 "***   This planet CANNOT be upgraded!**"
     gosub :planetUpGradeStat
     send "qq*  l " #8 $startPlanet "* c "
     return

   :colsNeeded
     getword CURRENTLINE $colsNeeded 1
     stripText $colsNeeded ","
     pause
   :fuelNeeded
     getword CURRENTLINE $fuelNeeded 1
     stripText $fuelNeeded ","
     pause
   :orgNeeded
     getword CURRENTLINE $orgNeeded 1
     stripText $orgNeeded ","
     pause
   :equNeeded
     getword CURRENTLINE $equNeeded 1
     stripText $equNeeded ","

:calcRequirements
    killalltriggers
    setVar $notEnoughVar 0
    divide $colsNeeded 1000
    subTract $colsNeeded $endPlanetCols
    if ($colsNeeded > $startPlanetCols)
        setVar $notEnoughVar 1
    end
   subTract $fuelNeeded $endPlanetFuel
    if ($fuelNeeded > $startPlanetfuel)
        setVar $notEnoughVar 1
    end
    subTract $orgNeeded $endPlanetorg
    if ($orgNeeded > $startPlanetorg)
        setVar $notEnoughVar 1
    end
   subTract $EquNeeded $endPlanetEqu
    if ($EquNeeded > $startPlanetEqu)
        setVar $notEnoughVar 1
    end
    if ($notEnoughVar = 1)
       if ($useSecond = "y")
         return
       end
       echo ANSI_12 "* You do not have enough cols and/or product to upgrade with*"
       echo ANSI_11 "**Do you want to continue? y/n"
       getConsoleInput $yesNo singlekey
       if ($yesNo = "n") or ($yesNo = "N")
          halt
       end
    end

:goodToGo
   setVar $errorNoRoom 0
   if ($colsNeeded > 0)
      if ($startPlanetEquCol > $colsNeeded)
         setVar $take "snt3"
         setVar $leave "snl1"
         setVar $prodID 13
      ELSEIf ($startPlanetOrgCol > $colsNeeded)
         setVar $take "snt2"
         setVar $leave "snl1"
         setVar $prodID 12
      ElseIf ($startPlanetFuelCol > $colsNeeded)
         setVar $take "snt1"
         setVar $leave "snl1"
         setVar $prodID 11
      end
      setVar $trigger "How many groups of Colonists do you want to leave"
      setVar $amtNeeded $colsNeeded
      gosub :moveIt
   end
   if ($fuelNeeded > 0) and ($errorNoRoom = 0)
      setVar $take "tnt1"
      setVar $leave "tnl1"
      setVar $trigger "How many holds of Fuel Ore do you want to leave"
      setVar $amtNeeded $fuelNeeded
      setVar $prodID 2
      gosub :moveIt
   end
   if ($orgNeeded > 0) and ($errorNoRoom = 0)
      setVar $take "tnt2"
      setVar $leave "tnl2"
      setVar $trigger "How many holds of Organics do you want to leave"
      setVar $amtNeeded $orgNeeded
      setVar $prodID 3
      gosub :moveIt
   end
   if ($equNeeded > 0) and ($errorNoRoom = 0)
      setVar $take "tnt3"
      setVar $leave "tnl3"
      setVar $trigger "How many holds of Equipment do you want to leave"
      setVar $amtNeeded $equNeeded
      setVar $prodID 4
      gosub :moveIt
   end
   if ($errorNoRoom = 0)
      send "l  " #8 $fillPlanet "*cuy"
      waitfor "Do you wish to construct"
      setTextTrigger chkPrompt :chkPrompt " command"
      pause
      :chkPrompt
      getword currentline $chkPrompt 1
      if ($chkPrompt = "Citadel")
         send "q"
      end
   else
     send "l " #8 $startPlanet "* c "
     return
   end
   setDelayTrigger bogusDelay :bogusDelay 2000
   pause
   :bogusDelay
   goto :checkPlanetNeeds

:moveIt
   setVar $temp $amtNeeded
   divide $temp $shipHolds
   multiply $temp $shipHolds
   setVar $fraction 0
   if ($temp < $amtNeeded)
       setVar $fraction ($amtNeeded - $temp)
   elseif ($temp > $amtNeeded)
       subtract $amtNeeded 1
       setVar $fraction ($temp - $amtNeeded)
   end
   divide $amtNeeded $shipHolds
   add $amtNeeded 1
   setVar $i 1
   setTextTrigger noRoom :noRoom "They don't have room for that many on the planet!"
   while ($i <= $amtNeeded)
      gosub :setWindow
      send "l  " & #8 & $startPlanet & "*  " & $take & "*ql  " & #8 & $fillPlanet & "*  " & $leave & "*q"
      setTextLineTrigger myTurns :myTurns "One turn deducted,"
      setTextTrigger doneLeave :doneLeave $trigger
      pause
      :myTurns
       getword currentline $myTurns 4
       if ($minTurns > 0)
          if ($myTurns <= $minTurns)
             killtrigger doneLeave
             echo ANSI_12 "***!!!! " ANSI_11 "Minimum Turn Level Reached" ANSI_12 " !!!!***"
             send "l  " & #8 & $startPlanet & "* c "
             halt
          end
       pause
       end
      :doneLeave
       killtrigger myTurns
       killtrigger doneLeave
      if ($prodID = 11)
         subtract $startPlanetCols $shipHolds
         subtract $startPlanetFuelCol $shipHolds
         subTract $colsNeeded $shipHolds
      elseif ($prodID = 12)
         subtract $startPlanetCols $shipHolds
         subtract $startPlanetOrgCol $shipHolds
         subTract $colsNeeded $shipHolds
      elseif ($prodID = 13)
         subtract $startPlanetCols $shipHolds
         subtract $startPlanetEquCol $shipHolds
         subTract $colsNeeded $shipHolds
      elseif ($prodID = 2)
         subtract $startPlanetFuel $shipHolds
         subtract $fuelNeeded $shipHolds
      elseif ($prodID = 3)
         subTract $startPlanetOrg $shipHolds
         subtract $orgNeeded $shipHolds
      elseif ($prodID = 4)
         subTract $startPlanetEqu $shipHolds
         subTract $equNeeded $shipHolds
      end
      add $i 1
   end
   if ($fraction > 0)
       send "l  " #8 $startPlanet "*  " $take & $fraction "*ql  " #8 $fillPlanet "*  " $leave $fraction "*q"
      if ($prodID = 11)
         subtract $startPlanetCols $fraction
         subtract $startPlanetFuelCol $fraction
         subTract $colsNeeded $fraction
      elseif ($prodID = 12)
         subtract $startPlanetCols $fraction
         subtract $startPlanetOrgCol $fraction
         subTract $colsNeeded $fraction
      elseif ($prodID = 13)
         subtract $startPlanetCols $fraction
         subtract $startPlanetEquCol $fraction
         subTract $colsNeeded $fraction
      elseif ($prodID = 2)
         subtract $startPlanetFuel $fraction
         subtract $fuelNeeded $fraction
      elseif ($prodID = 3)
         subTract $startPlanetOrg $fraction
         subtract $orgNeeded $fraction
      elseif ($prodID = 4)
         subTract $startPlanetEqu $fraction
         subTract $equNeeded $fraction
      end
      gosub :setWindow
   end
   killtrigger noRoom
return

:noRoom
 killalltriggers
 echo ansi_12 "*!!!! NO ROOM ON THIS PLANET ABORTING !!!!***"
 setVar $errorNoRoom 1
return

:getPlanetNumbers
# always more than 1 planet in sector
send "l"
setVar $pNumCnt 0
waitfor "---------"
:getPlanetNum
  killalltriggers
  setTextLineTrigger pNum :pNum "   <"
  setTextTrigger pNumDone :pNumDone "Land on which"
  pause
  :pNum
    killtrigger pNumDone
#    getWord currentline $planet 2
     getText currentline $planet "  <" "> "
     stripText $planet " "
#    stripText $planet ">"
    if ($planet <> $startPlanet)
       add $pNumCnt 1
       setVar $pNumber[$pNumCnt] $planet
    end
    goto :getPlanetNum
  :pNumDone
  send "  " #8 $startPlanet "* c"
  killtrigger pNum
  return

:padR
  getLength $inString $len
  while ($len < $padLen)
        setVar $inString $inString & " "
        add $len 1
  end
  return

:planetUpGradeStat
  setVar $inString $fillPlanet
  setVar $padLen 4
  gosub :padR
  setVar $stat_fillPlanet $inString
  setVar $instring $sectorArray[$sectCounter]
  setVar $padLen 5
  gosub :padR
  setVar $stat_sector $inString
  if ($lastSector <> $sectorArray[$sectCounter])
     setVar $lastSector $sectorArray[$sectCounter]
     write $gameFile " *"
  end
  getText currentline $UpgradeStat ", " " till complete"
  setVar $pStat "|" & currentline
  getText $pstat $pstat "|" "under construction"
  write $gameFile "Planet: " & $stat_fillPlanet  & " | Sector: " & $stat_sector & " | Date: " & $dateChecked & " | " & $upGradeStat & " | " & $pstat
  return

:setWindow
setVar $msg "* Return Sector:   " & $mySector
setVar $msg $msg & "* Current Sector " & $sectorArray[$sectCounter]
setVar $msg $msg & "* Working        " & $sectCounter & " of " & $upGradeSectors & " sectors."
if ($minTurns > 0)
   setVar $msg $msg & "* Remaining Turns: " & $myTurns
end
setVar $msg $msg & "* ---------------- *"
setVar $msg $msg & "* Donar Planet:    " & $startPlanet
setVar $inputVar $startPlanetFuelCol
gosub :genFormat
setVar $msg $msg & "* Fuel Cols Avail: " & $outPutVar
setVar $inputVar $startPlanetOrgCol
gosub :genFormat
setVar $msg $msg & "* Org Cols Avail:  " & $outPutVar
setVar $inputVar $startPlanetEquCol
gosub :genFormat
setVar $msg $msg & "* Equ Cols Avail:  " & $OutPutVar
setVar $inputVar $startPlanetFuel
gosub :genFormat
setVar $msg $msg & "* Fuel Avail:      " & $outPutVar
setVar $inputVar $startPlanetFuelOrg
gosub :genFormat
setVar $msg $msg & "* Org Avail:       " & $outPutVar
setVar $inputVar $startPlanetEqu
gosub :genFormat
setVar $msg $msg & "* Equip Avail:     " & $outPutVar
setVar $inputVar $oreSafeMin
gosub :genFormat
setVar $msg $msg & "* Min Fuel Set To: " & $outPutVar
setVar $msg $msg & "* ---------------- *"
setVar $msg $msg & "* Upgrade Planet:  " & $fillPlanet
setVar $msg $msg & "* Upgrading:       " & $planetsFilled & " of " & $pNumCnt & " planets"
setVar $inputVar $colsNeeded
gosub :genFormat
setVar $msg $msg & "* Cols Needed:     " & $outPutVar
setVar $inputVar $fuelNeeded
gosub :genFormat
setVar $msg $msg & "* Ore Needed:      " & $outPutVar
setVar $inputVar $orgNeeded
gosub :genFormat
setVar $msg $msg & "* Org Needed:      " & $outPutVar
setVar $inputVar $equNeeded
gosub :genFormat
setVar $msg $msg & "* Equ Needed:      " & $outPutVar
setVar $msg $msg & "*----------------- *"
setWindowContents citBuilder $msg & $msg1
return

:genFormat
  setVar $outputVar ""
  getLength $inputVar $cutLen
  while ($cutLen > 3)
      cutText $inputVar $tmpVar ($cutLen - 2) 3
      setVar $outPutVar  "," & $tmpVar & $outputVar
      subtract $cutLen 3
  end
  cutText $inputVar $tmpVar 1 $cutLen
  setVar $outputVar $tmpVar & $outputVar
  return

:autoGen
delete $autoGenFile
setVar $useList ""
if ($prompt = "Citadel")
    send "q"
end
send "*"
waitFor "Planet #"
getword currentline $agPnum 2
stripText $agPnum "#"
send "qtl"
waitfor "=============================================================================="
:getAutoGenList
settextLineTrigger autoG :autoG "  Class "
setTextLineTrigger agDone :agDone "======   ============  ===="
pause
:autoG
settextLineTrigger autoG :autoG "  Class "
getwordPos CURRENTLINE $pos "Level 6"
    getword currentline $ag 1
if ($pos = 0) and ($ag <> STARDOCK) and ($ag > 10)
    if ($agSectors[$ag] = 0)
       setVar $useList $useList & $ag & " "
       setVar $agSectors[$ag] $ag
       write $autoGenFile $ag
    end
end
pause
:agDone
 send "ql " #8 $agPnum "* c"
 setVar $prompt "Citadel"
 waitfor "Planet command"
 echo ANSI_12 "**Auto-gen sector list saved to: " & ansi_11 & $autoGenFile "**"
 killtrigger autoG
 return
 
:qstats
  setVar $line ""
  send "/"
   :setup
     setTextLineTrigger done :done "Ship "
     setTextLineTrigger funky :funky ""
     pause

  :funky
     killtrigger done
     setVar $line $line & currentline & "³"
     goto :setup

  :done
     killtrigger funky
     setVar $line $line & currentline & "³"

     # get the ship line and parse
     getText $line $shipTemp "Ship" "³"
     getword $shipTemp $ship_no 1
     stripText $line " "
     stripText $line ","

     # parse the rest of the string
     getText $line $ship_curSector "Sect" "³"
     getText $line $ship_turns "Turns" "³"
     getText $line $ship_creds "Creds" "³"
     getText $line $ship_figs "Figs" "³"
     getText $line $ship_shlds "Shlds" "³"
     getText $line $ship_hlds "Hlds" "³"
     getText $line $ship_ore "Ore" "³"
     getText $line $ship_org "Org" "³"
     getText $line $ship_equ "Equ" "³"
     getText $line $ship_col "Col" "³"
     getText $line $ship_phot "Phot" "³"
     getText $line $ship_armd "Armd" "³"
     getText $line $ship_lmpt "Lmpt" "³"
     getText $line $ship_gTorp "GTorp" "³"
     getText $line $ship_tWarp "TWarp" "³"
     getText $line $ship_clks "Clks" "³"
     getText $line $ship_beacns "Beacns" "³"
     getText $line $ship_atmDt "AtmDt" "³"
     getText $line $ship_crbo "Crbo" "³"
     getText $line $ship_eprob "EPrb" "³"
     getText $line $ship_mDis "MDis" "³"
     getText $line $ship_psPrb "PsPrb" "³"
     getText $line $ship_plScn "PlScn" "³"
     getText $line $ship_lrs "LRS" "³"
     getText $line $ship_aln "Aln" "³"
     getText $line $ship_exp "Exp" "³"
     getText $line $ship_corp "Corp" "³"
return


:sortRoute
echo ANSI_11 "**!!!! Routing in Progress !!!!**"
setVar $baseSector CURRENTSECTOR
setVar $path ""
setVar $pass 1
setVar $unSortOre 0
setVar $sortOre 0

:initGetDistance
setVar $counter 1
while ($counter <= $upGradeSectors)
     setVar $iDist 1
     while ($iDist <= $upGradeSectors)
            setVar $oreChkDist $idist
           getword $path $pos " " &  $sectorArray[$idist] & " "
           if ($pos = 0)
              getDistance $dist[$iDist] $baseSector $sectorArray[$iDist]
           end
           if ($pass = 1)
              add $unSortOre ($dist[$iDist] * 400)
           end
           add $iDist 1
     end
     if ($pass = 1)
       add $unSortOre ($dist[$iDist] * 400)
       setVar $pass 2
     end

   :getNearest
    setVar $i 1
    setVar $temp 999
     while ($i <= $upGradeSectors)
       getwordpos $path $pos " " & $sectorArray[$i] & " "
       if ($pos = 0)
          if ($temp > $dist[$i])
             setVar $baseSector $sectorArray[$i]
             setVar $temp $dist[$i]
          end
       end
     add $i 1
     end
     setVar $path $path & " " & $baseSector & " "
     if ($temp > 0)
        add $sortOre ($temp * 400)
     end
     add $counter 1
end

setVar $i 1
while ($i <= $upgradeSectors)
      getword $path $sectorArray[$i] $i
      add $i 1
end

:disp
setVar $inputVar $unSortOre
gosub :genFormat
     setvar $msg1 "* Unsorted Route: " & $outPutVar & " Ore Req"
setVar $inputVar $sortOre
gosub :genFormat
     setVar $msg1 $msg1 & "* Sorted Route  : " & $outPutVar  & " Ore Req*"
return