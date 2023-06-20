# ProZTM_Speed
# Written by:  Promethius
# May 2006

#  This script is written for speed and not total accuracy.  Good to use
#  when StarDock is hidden or you are wanting data quickly.  The first pass
#  will be approximately 84 - 87% accurate and the second pass between 95 -
#  and 97.5% accurate.

#  Approximately 3.7 to 4.5 hours required for this script to run.

#  This is a beta version.

reqRecording

# Set Vars
setVar $game GAMENAME
setVar $totSectors SECTORS
setArray $chkedSectors SECTORS
loadVar $startSectorPass1
loadVar $endSectorPass1
loadVar $startSectorPass2
loadVar $endSectorPass2
loadVar $deadEndDone
setVar $deadEndList "y"
setVar $7Warps "y"
setVar $6Warps "y"
setVar $backdoor "n"
setVar $cim "y"

if ($startSectorPass1 = 0)
   setVar $startSectorPass1 1
   setVar $endSectorPass1 SECTORS
end

if ($startSectorPass2 = 0)
   setVar $startSectorPass2 1
   setVar $endSectorPass2 SECTORS
end

:menu
echo "[2J"
echo "test"
echo "**" ANSI_12 "<-------------------| " ANSI_15 "ZTM by Promethius" ANSI_12 " |------------------->"
echo "*" ANSI_15 "  1.  " ANSI_11 "Create dead-end list? y/n " ANSI_12 $deadEndList
echo "*" ANSI_15 "  2.  " ANSI_11 "Create 7-warps in list? y/n " ANSI_12 $7Warps
echo "*" ANSI_15 "  3.  " ANSI_11 "Create 6-warps Out list? y/n " ANSI_12 $6Warps
echo "*" ANSI_15 "  4.  " ANSI_11 "Create sector backdoor list? y/n " ANSI_12 $backdoor
echo "*" ANSI_15 "  5.  " ANSI_11 "Update CIM Warps? y/n " ANSI_12 $cim
echo "**" ANSI_11 "  S.  " ANSI_15 "Start ZTM"
echo "*" ANSI_11  "  Q.  " ANSI_15 "Quit ZTM"
echo "* " ANSI_12 "<----------------------------------------------------------->*"
getConsoleInput $menuChoice SINGLEKEY

If ($menuChoice = "1")
   if ($deadEndList = "y")
      setVar $deadEndList "n"
   else
      setVar $deadEndList "y"
   end
elseIf ($menuChoice = "2")
   if ($7Warps = "y")
      setVar $7Warps "n"
   else
      setVar $7Warps "y"
   end
elseif ($menuChoice = "3")
   if ($6Warps = "y")
       setVar $6Warps "n"
   else
       setVar $6Warps "y"
   end
elseif ($menuChoice = "4")
   if ($backdoor = "y")
      setVar $backdoor "n"
   else
      setVar $backdoor "y"
   end
elseif ($menuChoice = "5")
   if ($cim = "y")
      setVar $cim "n"
   else
      setVar $cim "y"
   end
elseif ($menuChoice = "s")
      goto :beginWindow
elseIf ($menuChoice = "q")
      halt
end

goto :menu

:beginWindow
getTime $stTime "'Start time:  ' h:nn:ss"
setVar $Window 1
Window ZTM 450 325 "      ProZTM_Speed v.beta             " & $stTime  ONTOP
setVar $Window "*     ProZTM was written by Promethius*" & "     Version:  beta*" & "     Public Release*"
setVar $Window $Window & "* Please let me know of any issues on eisonline.com.*"
setWindowContents ZTM $Window
setDelayTrigger st :sttime 3000
pause

:sttime
 if ($cim = "y")
    setvar $WindowMessage "  Game:           "& $game & "*  Sectors:        " & $totSectors  & "*  Updating CIM" & "*"
    setWindowContents ZTM $WindowMessage
    send "^i"
 else
    send "^"
 end
waitfor ":"
# update window
 setvar $WindowMessagePass0 "*  Game:    "& $game & "*  Sectors: " & $totSectors  & "*"
 setVar $windowMessagepass1 "*  Pass 1:  Mapping @ 0%*"
 setVar $windowMessagePass2 "*  Pass 2: *"
 setVar $windowMessagePass3 "*  Pass 3: *"
 setVar $windowMessagePass4 "*"
 setVar $windowMessagePass5 "*"
 gosub :ztmWindowUpdate

:firstPass
while ($startSectorPass1 <= $totSectors) and ($endSectorPass1 > 0)
    :validstartSector
      if (SECTOR.WARPCOUNT[$startSectorPass1] > 0)
         add $startSectorPass1 1
         if ($startSectorPass1 > $totSectors)
            gosub :verify
            goto :warpMinCheck
         else
            goto :validstartSector
         end
      end
    :validendSector
      if (SECTOR.WARPINCOUNT[$endSectorPass1] > 0)
         subtract $endSectorPass1 1
         if ($endSectorPass1 < 1)
            gosub :verify
            goto :warpMinCheck
         else
           goto :validendSector
         end
      end
      if ($startSectorPass1 = $endSectorPass1)
         subtract $endSectorPass1 1
         if ($endSectorPass1 < 1)
            gosub :verify
            goto :warpMinCheck
         end
      end
      send "f" $startSectorPass1 "*" $endSectorPass1 "*y"
      waitfor "FM > " & $startSectorPass1
      if (SECTOR.WARPINCOUNT[$startSectorPass1] = 0) or (SECTOR.WARPCOUNT[$endSectorPass1] = 0)
         send "f" $endSectorPass1 "*" $startSectorPass1 "*y"
      end
      saveVar $startSectorPass1
      saveVar $endSectorPass1
      add $startSectorPass1 1
      subtract $endSectorPass1 1

      setVar $tot_sectors $startSectorPass1
      multiply $tot_sectors 100
      divide $tot_Sectors $totSectors
      multiply $tot_sectors 2
      if ($ckUpdate <> $tot_sectors)
             setVar $windowMessagePass1 "*  Pass 1:  Mapping @ " & $tot_Sectors & "%*"
             gosub :ztmWindowUpdate
      end
      setVar $ckUpdate $tot_Sectors

end
gosub :verify
goto :checkDeadEnds

:verify
  gosub :totalWarps
  gettime $passEndTime "hh:nn:ss"
  setVar $windowMessagePass1 "*  Pass 1:  Complete @ " & $passEndTime & " Warps  " & $totalWarps
  setVar $i 2
  setVar $verifyIn 0
  setVar $verifyOut 0
  while ($i <= $totSectors)
     if (sector.warpincount[$i] = 0)
         send "f1*" $i "*y"
         add $verifyIn 1
     end
     if (sector.warpCount[$i] = 0)
        send "f" $i "*1*y"
        add $verifyOut 1
     end
     add $i 1
  end
  add $verifyIn  $verifyOut
  setVar $windowMessagePass1 $windowMessagePass1 & "*  Verified Sectors - " & $verifyIn & "*"
  return

:warpMinCheck
  if ($deadEndDone <> 0)
      goto :DeDone
  end
  setVar $windowMessagePass2 "*  Pass 2:  Warp Min Check*"
  gosub :ztmWindowUpdate

  setVar $iwarps 1
#  while ($iwarps <= 3)
  while ($iwarps <= 4)
    setVar $i 1
       while ($i <= $totSectors)
          getSector $i $i
           if (SECTOR.WARPCOUNT[$i] = $iWarps)
             add $ideadCnt 1
             setvar $isDeadEnd[$ideadCnt] $i
             if ($ideadCnt > 2)
                 setVar $dEndCnt ($ideadCnt - 1)
                 send "f" $isDeadEnd[$ideadCnt] "*" $isDeadEnd[$dEndCnt] "*y"
                 waitfor "FM > " & $isDeadEnd[$ideadCnt]
                 send "f" $isDeadEnd[$dEndCnt] "*" $isDeadEnd[$ideadCnt] "*y"
                 waitfor "FM > " & $isDeadEnd[$dEndCnt]
             end
          end
          add $i 1
       end
    add $iWarps 1
    end
#    send "q"
  :deDone
  setVar $deadEndDone 1
  gettime $4PassEndTime "hh:nn:ss"
  gosub :totalWarps
  setVar $windowMessagePass2 "*  Pass 2:  Warp Min Check Complete @" & $4PassEndTime & "Warps " & $totalWarps & "*"
  gosub :ztmWindowUpdate


:finalDeadEnd
    setVar $i 11
    setVar $windowMessagePass3 "*  Pass 3:  Dead end check running*"
       while ($i <= $totSectors)
          getSector $i $i
          if (SECTOR.WARPS[$i][2] < 2)
             add $ideadCnt 1
             setvar $isDeadEnd[$ideadCnt] $i
             if ($ideadCnt > 2)
                 setVar $dEndCnt ($ideadCnt - 1)
                 send "f" $isDeadEnd[$ideadCnt] "*" $isDeadEnd[$dEndCnt] "*y"
                 waitfor "FM > " & $isDeadEnd[$ideadCnt]
             end
          end
          add $i 1
       end
    send "q"
  gettime $3passEndTime "hh:nn:ss"
  gosub :totalWarps
  setVar $windowMessagePass3 "*  Pass 3:  Completed @ " & $3passEndTime  & "  Warps " & $totalWarps & "*"
  gosub :ztmWindowUpdate

:DeadEndList
  setVar $windowMessagePass4 "* <-- Creating Data Files -->*"
  setVar $i 11
  setVar $deCnt 0
  if ($deadEndList = "y")
     setVar $log GAMENAME & "_DeadEnds.txt"
     while ($i <= $totSectors)
           if (SECTOR.Warpcount[$i] = 1)
              write $log $i
              add $deCnt 1
           end
           add $i 1
     end
     setVar $windowMessagePass5  "* " & $deCnt & " dead ends sectors.  File: " & $log & "*"
  end

:7WarpsIn
if ($7Warps = "y")
   setVar $7inlog GAMENAME & "_7WarpsIn.txt"
   setVar $i 1
   setVar $7inCnt 0
   while ($i <= $totSectors)
      getSector $i $i
      if (sector.warpincount[$i] = 7)
         write $7inlog $i
         add $7inCnt 1
      end
      add $i 1
   end
  setVar $windowMessagePass5 $windowMessagePass5 & "* " & $7inCnt & " 7-warps in sectors.  File: " & $7inLog & "*"
end

:6Warps
if ($6Warps = "y")
   setVar $6WarpsLog GAMENAME & "_6WarpsOut.txt"
   setVar $i 1
   setVar $6outCnt 0
   while ($i < $totSectors)
       getSector $i $i
       if (sector.warpcount[$i] = 6)
          add $6outCnt 1
          write $6WarpsLog $i
       end
       add $i 1
   end
   setVar $windowmessagePass5 $windowMessagePass5 & "* " & $6outCnt & " sectors with 6 warps.  File: " & $6WarpsLog & "*"
end

:backdoors
  if ($backdoor = "y")
      setVar $bDoorLog $game & "_backDoors.txt"
      setVar $i 1
      while ($i < $totSectors)
          getSector $i $i
          if (sector.backdoorcount[$i] > 0)
              setVar $doorCnt 1
              setVar $doorDisp $i & " backdoors: "
              while ($doorCnt <= sector.backdoorcount[$i])
                    setVar $doorDisp $doorDisp & " - " & SECTOR.BACKDOORS[$i][$doorCnt]
                    add $doorCnt 1
              end
              write $bDoorLog $doorDisp
          end
          add $i 1
      end
      setVar $windowMessagePass5 $windowmessagePass5 & "*   Backdoor file:  " & $bDoorLog & "*"
  end

gettime $ztmFinished "hh:nn:ss"
setvar $windowmesagePass5  $windowMessagePass5 & "**   ZTM Finished @ " & $ztmFinished & "*"
gosub :ztmWindowUpdate
send "#"

:stayAlive
  setdelayTrigger inactiv :inactivity 30000
  pause
  :inactivity
   send "#"
   goto :stayAlive


:totalWarps
setVar $totalWarps 0
setVar $ttlwrps 0
while ($ttlwrps < SECTORS)
    add $ttlwrps 1
    add $totalWarps SECTOR.WARPCOUNT[$ttlwrps]
end
return


:ztmWindowUpdate
  setVar $window $windowMessagePass0 & $windowMessagePass1 & $windowMessagePass2
  setVar $window $window & $windowMessagePass3 & $windowMessagePass4 & $windowMessagePass5
  setWindowContents ZTM $window
return
