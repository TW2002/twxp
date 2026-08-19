
###############################################################################
#     Please leave this header intact.  This script is released for the players
#     and scripters to use.

#     proZTM Originally written by Promethius
#     Release Date:   Aug 2005
#     Updated:  v.6   Oct 2005
#     Updated:  v1.0  Aug 2006
#     Updated:  v1.4  Nov 2006
#     Updated:  v1.4A Jan 2007
#     Updated:  v2.0  Apr 2008
#     Updated:  v3.0  Nov 2008
#     Updated:  v4.0  Dec 2008
#     Updated:  v4.11 Jun 2009
#     Source Released Dec 25, 2009
###############################################################################
  


setVar $game GAMENAME
setVar $version "ProZTM 4.11"
setVar $computerInt "n"
setVar $useWatch "Yes"
setVar $cim "Yes"
setVar $ztmMode "Interrogation"
setVar $7WarpsList "No"
setVar $deadEndList "No"
setVar $swathData "No"
setVar $trafficAnalysis "No"
setVar $ztmRange "No"
setVar $ztmVarRefresh "No"
setVar $7WarpsInMonitor "Yes"
setVar $showWarpsFound "Yes"
setVar $1stPassWarpSpec "No"
setVar $endPassWarps FALSE
setVar $warpsPlotted 0
setVar $reConn 0
loadVar $ztmMin
loadVar $ztmMax
if ($ztmMin = 0) or ($ztmMax = 0)
   setVar $ztmMin 1
   setVar $ztmMax SECTORS
   saveVar $ztmMin
   saveVar $ztmMax
end
setVar $ztmStart $ztmMin
echo "[2J"
setDelayTrigger bot :botted 10000
setTextOutTrigger noBot :noBot "~"
echo ANSI_12 "**You have 10 seconds to enter " ANSI_15 "~" ANSI_12 " or default values will run*"
echo ANSI_12 "*BOT/default will allow SS download of warpspec*"
pause
:botted
  killtrigger noBot
  setVar $ztmSend "Yes"
  goto :begin
:noBot
killtrigger bot
setVar $ztmSend "No"

:menu

echo "[2J"
echo "**" ANSI_12 "  <----------------| " ANSI_15 "ZTM by Promethius" ANSI_12 " |---------------->"
echo "**"  ANSI_10 "           1.  Monitor who is online?  " ANSI_14 $useWatch
echo "*"  ANSI_10 "           2.  Update CIM warp report? " ANSI_14 $cim
if ($prompt = "<StarDock>")
    echo "*"  ANSI_12 "             =-=-= Computer mode not available at StarDock"
else
   echo "*"  ANSI_10 "           3.  ZTM mode is set to:     " ANSI_14 $ztmMode
end
echo "*"  ANSI_10 "           4.  Send ZTM over SS when complete?          " ANSI_14 $ztmSend
echo "*"  ANSI_10 "           5.  Constrain ZTM to specified sector range? " ANSI_14 $ztmRange
echo "*"  ANSI_10 "           6.  Reset all vars for a fresh ZTM           " ANSI_14 $ztmVarRefresh
echo "*"  ANSI_10 "           7.  Monitor 7-warps in?                      " ANSI_14 $7WarpsInMonitor
echo "*"  ANSI_10 "           8.  Show warps found during passes?          " ANSI_14 $showWarpsFound
echo "*"  ANSI_10 "           9.  Write WarpSpec after 1st pass?           " ANSI_14 $1stPassWarpSpec
echo "*"  ANSI_10 "           D.  Set Data Options"
echo "**" ANSI_11 "           S.  " ANSI_15 "Start ZTM"
echo "*"  ANSI_11 "           Q.  " ANSI_15 "Quit ZTM*"
echo "*"  ANSI_12 "  <--------------------| " ANSI_15 $version ANSI_12 " |-------------------->*         "
getConsoleInput $menuChoice SINGLEKEY
lowerCase $menuChoice
if ($menuChoice = 1)
   if ($useWatch = "Yes")
      setVar $useWatch "No"
   else
      setVar $useWatch "Yes"
   end
elseif ($menuChoice = 2)
    if ($cim = "Yes")
       setVar $cim "No"
    else
       setVar $cim "Yes"
    end
 elseif ($menuChoice = 3)
    if ($ztmMode = "Interrogation")
       setVar $ztmMode "Computer"
    else
       setVar $ztmMode "Interrogation"
    end
elseif ($menuChoice = 4)
    if ($ztmSend = "No")
       setVar $ztmSend "Yes"
    else
       setVar $ztmSend "No"
    end
elseif ($menuChoice = 5)
    if ($ztmRange = "No")
        echo ANSI_12 "*Enter the starting sector number for the ztm*"
        getConsoleInput $ztmMin
        echo ANSI_12 "*Enter the ending sector number for the ztm*"
        getConsoleInput $ztmMax
        saveVar $ztmMin
        saveVar $ztmMax
        setVar $ztmStart $ztmMin
        saveVar $ztmStart
        setVar $ztmEnd $ztmMax
        saveVar $ztmEnd
        setVar $ztmRange "Yes"
    else
        setVar $ztmRange "No"
        setVar $ztmMin 1
        setVar $ztmMax SECTORS
    end
elseif ($menuChoice = 6)
      setVar $ztmVarRefresh "Yes"
      setVar $ztmMin 1
      saveVar $ztmMin
      setVar $ztmMax SECTORS
      saveVar $ztmMax
      setVar $ztmStart 0
      saveVar $ztmStart
      setVar $ztmEnd SECTORS
      saveVar $ztmEnd
      setVar $verifyStart 0
      saveVar $verifyStart
      setVar $verifyEnd 0
      saveVar $verifyEnd
      setVar $firstPassVerified 0
      saveVar $firstPassVerified
      setVar $sPassZTMStart $ztmMin
      saveVar $sPassZTMStart
      setVar $sPassZTMEnd $ztmEnd
      saveVar $spassZTMEnd
elseif ($menuChoice = 7)
      if ($7WarpsInMonitor = "No")
          setVar $7WarpsInMonitor "Yes"
      else
          setVar $7WarpsInMonitor "No"
      end
elseIf ($menuChoice = 8)
      if ($showWarpsFound = "Yes")
         setVar $showWarpsFound "No"
      else
         setVar $showWarpsFound "Yes"
      end
elseif ($menuChoice = 9)
      if ($1stPassWarpSpec = "No")
          setVar $1stPassWarpSpec "Yes"
      else
          setVar $1stPassWarpSpec "No"
      end
elseif ($menuChoice = "d")
     gosub :dataMenu
elseif ($menuChoice = "s")
      goto :begin
elseif ($menuchoice = "q")
      halt
end
goto :menu



:begin

setEventTrigger connLost :connLost "CONNECTION LOST"
setTextTrigger connLost2 :connLost "Connection lost"
getword CURRENTLINE $prompt 1

# plotDisplay setting
setVar $plotDisplay (($ztmMax - $ztmMin + 1) / 100)
if ($plotDisplay < 100)
    setVar $plotDisplay 100
end


if ($reconn > 0)
#   setVar $reconn 0
   goto :intMode
end
gosub :getTitles
gosub :windowSetup
if ($useWatch = "Yes")
   setVar $onLine 1
   Window onLine 300 175 "      " & $version & " OnLine Watch"
   gosub :onlineWatch
end
if ($7WarpsInMonitor = "Yes")
   Window 7In 175 350 "      " & $version & " 7-In Warp List"
end

:windowMessages
 setvar $WindowMessagePass0 "*  Game:    "& $game & "*  Sectors: " & SECTORS  & "*"
 setVar $windowMessagepassCim "*  CIM "
 setVar $windowMessagepass1 "*  Pass 1:  Mapping @ 0%*"
 setVar $windowMessagePass2 "*  Pass 2: *"
 setVar $windowMessagePass3 "*  Pass 3: *"
 setVar $windowMessagePass4 "*  Pass 4: *"
 setVar $windowMessagePass5 "*  Pass 5: *"
gosub :ztmWindowUpdate


:intMode

 if ($ztmMode = "Interrogation") and ($cim = "Yes")
     if ($recon = 1)
        send "^"
     else
       send "^iq"
       waitfor ": ENDINTERROG"
       send "^"
     end
     setVar $cimmed 1
 elseif ($ztmMode = "Interrogation") and ($cim = "No")
    send "^"
 elseif ($ztmMode = "Computer") and ($cim = "Yes")
    setVar $cimmed 1
    if ($recon = 1)
       send "qc"
    else
      send "^iqc"
      waitfor ": ENDINTERROG"
    end
 elseif ($ztmMode = "Computer") and ($cim = "No")
    send "c"
  end

:firstPass
   gosub :totalWarps
   setVar $prevWarpCnt $totalWarps
   if ($cimmed = 1)
      setVar $windowMessagepassCim "*  CIM found: " & $totalWarps & " Warps*"
      gosub :ztmWindowUpdate
   end
  loadVar $ztmStart
  loadVar $ztmEnd
  setVar $plots 0
  setVar $burstCnt 0
  setVar $burst ""
  setVar $forwardPlot FALSE
  # was 0
  setVar $2ndIn 0
  if ($ztmStart = 0)
    setVar $ztmStart $ztmMin
  end
  if ($ztmEnd = 0)
    setVar $ztmEnd $ztmMax
  end
while ($ztmStart <= $ztmMax)
  :ztmFirstSector
   if ($ztmStart > $ztmMax)
      goto :secondPass
   end
     # changed from = 0 to <=2
     if (sector.warpcount[$ztmStart] = 0) and ($ztmStart <= $ztmMax) and (sector.explored[$ztmStart] <> YES)
       goto :ztmSecondSector
    else
       add $ztmStart 1
       if ($ztmStart > $ztmMax)
          goto :secondPass
       end
       goto :ztmFirstSector
    end

  :ztmSecondSector
    # was < 2
   if (sector.warpInCount[$ztmEnd] <= $2ndIn) and ($ztmEnd <> $ztmStart) and ($ztmEnd > ($ztmMin-1)) and (sector.explored[$ztmEnd] <> YES)
       setVar $burst $burst & "f" & $ztmStart & "*" & $ztmEnd & "*y"
       if ($forwardPlot = FALSE)
          setVar $burst $burst & "f" & $ztmEnd & "*" & $ztmStart & "*y"
          add $plots 2
          add $warpsPlotted 2
       else
          add $plots 1
          add $warpsPlotted 1
       end
       add $burstCnt 1
       if ($burstCnt > 5)
          goto :firstPassPlot
       else
          subtract $ztmEnd 1
       end
       if ($ztmEnd < $ztmMin)
          setVar $ztmEnd $ztmMax
          add $2ndIn 1
       end
       add $ztmStart 1
       if ($ztmStart = $ztmEnd)
          subtract $ztmEnd 1
          if ($ztmEnd < $ztmMin
             setVar $ztmMin $ztmEnd
             add $2ndIn 1
          end
       end
       add $burstCnt 1
       goto :ztmFirstSector

    else
       subtract $ztmEnd 1
       if ($ztmEnd < $ztmMin)
          setVar $ztmEnd $ztmMax
          add $2ndIn 1
       end
       goto :ztmSecondSector
    end

  :firstPassPlot
  if ($ztmMode = "Interrogation")
    send $burst
    setVar $burst ""
    setVar $burstCnt 0
    if ($forwardPlot = TRUE)
       waitfor "FM > " & $ztmStart
    else
       waitfor "FM > " & $ztmEnd
    end
  else
    send $burst
    setVar $burst ""
    setVar $burstCnt 0
    setVar $chkSector $ztmStart
    gosub :checkComp
  end
    saveVar $ztmStart
    saveVar $ztmEnd
    add $ztmStart 1
    subtract $ztmEnd 1
    setVar $tot_sectors $ztmStart
    multiply $tot_sectors 100
    divide $tot_Sectors ($ztmMax - $ztmMin)
    if ($ckUpdate <> $tot_sectors) and ($plots >= $plotDisplay)
      gosub :totalWarps
      if ($useWatch = "Yes")
        gosub :onLineWatch
      end
      if ($showWarpsFound = "Yes")
        if ($warpsPlotted > 0)
        setprecision 3
        setVar $plotEfficiency  (($totalWarps - $prevWarpCnt) / $warpsPlotted)
        setprecision 0
      end
      if ($plotEfficiency < 6.5)
         setVar $forwardPlot TRUE
      end
        setVar $windowMessagePass1 "*  Pass 1:  Mapping @ " & $tot_Sectors & "%" & " Warps: " & $totalWarps & ", Warps:Plot " & $plotEfficiency & "*"
      else
        setVar $windowMessagePass1 "*  Pass 1:  Mapping @ " & $tot_Sectors & "%*"
      end
      gosub :ztmWindowUpdate
      setVar $ckUpdate $tot_sectors
      setVar $plots 0
   end
end

#-----------------

:secondPass
send $burst
loadvar $2ndvStart
loadVar $2ndvEnd
setVar $burstCnt 0
setVar $warpsPlotted 0
setVar $windowMessagePass2 ""
setVar $plots 0
setVar $burst ""
   setVar $plots 0
   getTime $1PassEndTime "hh:nn:ss"
   setVar $ckUpdate 0
   setVar $tot_Sectors 0
   gosub :totalWarps
   setVar $prevWarpCnt $totalWarps
   setVar $windowMessagePass1 "*  Pass 1:  Completed @ " & $1PassEndTime & ", " & $totalWarps & " warps found*"
   if ($1stPassWarpSpec = "Yes")
      setVar $windowMessagePass2 "*  Writing " & gamename & "warpSpec.txt*"
      gosub :ztmWindowUpdate
      gosub :writeWarpSpec
      setVar $windowMessagePass2 "*  WarpSpec Written to " & gamename & "warpSpec.txt*"
   end
   setVar $windowMessagePass2 $windowMessagePass2 & "*  Pass 2:  Mapping @ " & $tot_Sectors & "%" & " Warps: " & $totalWarps & "*"
   gosub :ztmWindowUpdate

if ($2ndvStart = 0)
   setVar $2ndvStart $ztmMin
   setVar $2ndvEnd $ztmMax
end
while ($2ndvStart <= $ztmMax)
      if (sector.warpcount[$2ndvStart] = 1) and (sector.explored[$2ndvStart] <> YES)
         setVar $voidClear "c" & sector.warps[$2ndvStart][1] & "*"
         setVar $burst $burst & "s" & sector.warps[$2ndvStart][1] & "*f" & $2ndvStart & "*"
      elseif (sector.warpCount[$2ndvStart] = 0)
         setVar $burst $burst & "f" & $2ndvStart & "*"
         setVar $voidClear ""
      else
         goto :endSecondvPass
      end
      :get2ndvEnd
      if (sector.warpInCount[$2ndvEnd] < 2)
         setVar $burst $burst & $2ndvEnd & "*Y" & $voidClear
         add $plots 1
         add $burstCnt 1
         add $warpsPlotted 1
      else
         subtract $2ndvEnd 1
         if ($2ndvEnd = $2ndvStart)
             subtract $2ndvEnd 1
         end
         if ($2ndvEnd < $ztmMin)
            setVar $2ndvEnd $ztmMax
         end
         goto :get2ndvEnd
      end
      if ($burstCnt > 5)
          send $burst
          savevar $2ndvStart
          saveVar $2ndvEnd
             if ($ztmMode = "Interrogation")
                waitfor "FM > " & $2ndvStart
             else
                setVar $chkSector $2ndvStart
                gosub :checkComp
             end
          setVar $burst ""
          setVar $burstCnt 0
      end
      subtract $2ndvEnd 1
      if ($2ndvEnd < $ztmMin)
         setVar $2ndvEnd $ztmMax
      end
      :endSecondvPass
      add $2ndvStart 1
      if ($2ndvStart = $2ndvEnd)
         subtract $2ndvEnd 1
         if ($2ndvEnd < $ztmMin)
            setVar $2ndvEnd $2ndvMax
         end
      end
      setVar $tot_sectors $2ndvStart
             multiply $tot_sectors 100
             divide $tot_Sectors ($ztmMax - $ztmMin)
             if ($ckUpdate <> $tot_sectors) and ($plots >= $plotDisplay)
                 setVar $plots 1
                 gosub :totalWarps
                 setPrecision 3
                setVar $plotEfficiency (($totalWarps - $prevWarpCnt) / $warpsPlotted)
                setprecision 0
             if ($useWatch = "Yes")
                gosub :onLineWatch
             end
             if ($showWarpsFound = "Yes")
                setVar $windowMessagePass2 "*  Pass 2:  Mapping @ " & $tot_Sectors & "%" & " Warps: " & $totalWarps & " Warps:Plot: " & $plotEfficiency & "*"
            else
                setVar $windowMessagePass2 "*  Pass 2:  Mapping @ " & $tot_Sectors & "%*"
            end
            gosub :ztmWindowUpdate
            setVar $ckUpdate $tot_sectors
         end
 end
send $burst


#--------------------


:thirdPass
 setVar $plots 0
 setVar $firstPassVerified 1
 saveVar $firstPassVerified
 getTime $1PassEndTime "hh:nn:ss"
 setVar $ckUpdate 0
 setVar $tot_Sectors 0
 setVar $endPassWarps TRUE
 gosub :totalWarps
 if ($warpsPlotted > 0)
     setPrecision 3
     setVar $plotEfficiency  ($totalWarps - $prevWarpCnt) / $warpsPlotted
     setPrecision 0
 end
 setVar $endPassWarps FALSE
 setVar $windowMessagePass2 "*  Pass 2:  Completed @ " & $1PassEndTime & ", " & $totalWarps & " warps*"
 setVar $windowMessagePass3 "*  Pass 3:  Mapping @ " & $tot_Sectors & "%*"
 gosub :ztmWindowUpdate
 loadVar $sPassZTMStart
 loadVar $sPassZTMEnd
 setVar $ckUpdate 0
 if ($sPassZTMStart = 0)
    setVar $sPassZTMStart $ztmMin
 end
 if ($sPassZTMEnd = 0)
    setVar $sPassZTMEnd $ztmMax
 end
 while ($sPassZTMStart <= $ztmMax)
      :sPassPlotFrom
        # added sector.warpcount = 1
     if (sector.warpcount[$sPassZTMStart] = 6) or (sector.explored[$sPassZTMStart] = YES) or (sector.warpcount[$sPassZTMStart] = 1)
        add $sPassZTMStart 1
        if ($sPassZTMStart > $ztmMax)
           goto :data
        end
        goto :sPassPlotFrom
     end
      :getAvoids
      setVar $sendBurst ""
      setVar $i 1
       while ($i <= SECTOR.WARPCOUNT[$sPassZTMStart])
             if (SECTOR.WARPS[$sPassZTMStart][$i] > 0)
                if ($computerInt = "n")
                   setVar $sendBurst $sendBurst & "s" & SECTOR.WARPS[$sPassZTMStart][$i] & "*"
                else
                   setVar $sendBurst $sendBurst & "v" & SECTOR.WARPS[$sPassZTMStart][$i] & "*"
                end
             end
             add $i 1
       end
       :burstIt
       if ($sPassZTMStart = $sPassZTMEnd)
          subtract $sPassZTMEnd 1
          if ($sPassZTMEnd < $ztmMin)
             setVar $sPassZTMEnd $ztmMax
          end
       end
       send $sendBurst "f" $sPassZTMStart "*" $sPassZTMEnd "*y"
       setTextlineTrigger sect :addVoid $sPassZTMStart & " > "
       setTextTrigger compClear :clearVoids "Clear Avoids"
       pause
     :addVoid
      killtrigger compClear
        getword CURRENTLINE $nVoid 3
        stripText $nvoid ")"
        stripText $nvoid "("
       if ($nvoid = $sPassZTMEnd)
          subtract $spassZTMEnd 1
          goto :burstIt
       end
       # catch sectors that are next door
       if ($ztmMode = "Interrogation")
           setVar $sendBurst "s" & $nVoid & "*"
       else
           setVar $sendBurst "v" & $nVoid & "*"
       end
       goto :burstIt
     :clearVoids
       killtrigger sect
       saveVar $sPassZTMStart
       saveVar $sPassZTMEnd
       add $plots 1
       add $sPassZTMStart 1
       subtract $sPassZTMEnd 1
      setVar $tot_sectors $sPassZTMStart
      multiply $tot_sectors 100
      divide $tot_Sectors ($ztmMax - $ztmMin)
      if ($ckUpdate <> $tot_sectors) and ($plots >= $plotDisplay)
             gosub :totalWarps
             if ($useWatch = "Yes")
                gosub :onLineWatch
             end
             if ($showWarpsFound = "Yes")
                setVar $windowMessagePass3 "*  Pass 3:  Mapping @ " & $tot_Sectors & "%" & " Warps: " & $totalWarps & "*"
             else
                setVar $windowMessagePass3 "*  Pass 3:  Mapping @ " & $tot_Sectors & "%*"
             end
             gosub :ztmWindowUpdate
             setVar $ckUpdate $tot_sectors
             setVar $plots 0
      end
  end

  :data
    gettime $thirdPassEndTime "hh:nn:ss"
    setVar $endPassWarps TRUE
    gosub :totalWarps
        setVar $endPassWarps FALSE
    setVar $windowMessagePass3 "*  Pass 3:  Completed @ " & $thirdPassEndTime & ", " & $totalWarps & " warps found.*"
    gosub :ztmWindowUpdate


 :fourthPass
 loadVar $backdoorComplete
 if ($backdoorComplete = 1)
    goto :doneBackDoorCheck
 end
 setVar $windowMessagePass4 "*  Pass 4:  Running*"
 gosub :ztmWindowUpdate
 setVar $i $ztmMin
 setVar $burstCnt 0
 setVar $burst ""
 while ($i <= SECTORS)
   if (sector.backDoorCount[$i] > 0)
      setVar $backDoorCnt 0
      :backdoor
      if ($backdoorCnt < sector.backDoorCount[$i])
         add $backDoorCnt 1
         setVar $burst $burst & "f" & $i & "*" & sector.backdoors[$i][$backDoorCnt] & "*y"
         add $burstCnt 1
         goto :backdoor
      end
   end
   if ($burstCnt > 5)
      send $burst
      setVar $burstCnt 0
      setVar $burst ""
      if ($ztmMode = "Interrogation")
         waitfor "FM > " & $i
      else
         setVar $chkSector $i
         gosub :checkComp
     end
   end
   add $i 1
 end
 send $burst
   :doneBackDoorCheck
  gettime $4PassEndTime "hh:nn:ss"
  setVar $endPassWarps TRUE
  gosub :totalWarps
  setVar $endPassWarps FALSE
  setVar $windowMessagePass4 "*  Pass 4:  Completed @ " & $4PassEndTime & ", " & $totalWarps & " warps found.*"
  gosub :ztmWindowUpdate
  setVar $backdoorComplete 1
  saveVar $backdoorComplete
  send "q"


:DeadEndList
  if ($deadEndList = "Yes")
     setVar $windowMessagePass4 "* <-- Creating Data Files -->*"
     setVar $i 11
     setVar $deCnt 0
     if ($deadEndList = "y")
        setVar $log GAMENAME & "_DeadEnds.txt"
        while ($i <= $ztmMax)
           if (SECTOR.Warpcount[$i] = 1)
              write $log $i
              add $deCnt 1
           end
           add $i 1
        end
        setVar $windowMessagePass5 $windowMessagePass5 & "* " & $deCnt & " dead ends sectors.  File: " & $log & "*"
     end
  end

:7WarpsIn
 if ($7WarpsList = "Yes")
   setVar $7inlog GAMENAME & "_7WarpsIn.txt"
   setVar $i 1
   setVar $7inCnt 0
   while ($i <= $ztmMax)
      getSector $i $i
      if (sector.warpincount[$i] = 7)
        getLength $i $len
        setVar $padWarp ""
        while ($len < 5)
            setVar $padWarp $padWarp & " "
            add $len 1
        end
        setVar $7Ins $7Ins & "*" & $i & $padWarp & "  BD = " & SECTOR.BACKDOORS[$ttlwrps][1]
         write $7inlog $7Ins
         add $7inCnt 1
      end
      add $i 1
   end
  setVar $windowMessagePass5 $windowMessagePass5 & "* " & $7inCnt & " 7-warps in sectors.  File: " & $7inLog & "*"
end

:SWATH
if ($swathData = "Yes")
   fileexists $exists "WarpSpec" & gamename & ".txt"
   if ($exists)
      delete "WarpSpec" & gamename & ".txt"
   end
   setVar $windowmessagePass5 $windowMessagePass5 & "* WarpSpec file:  WarpSpec" & gamename & ".txt"
   setVar $i 1
   write "WarpSpec" & gamename & ".txt" ":"
   while ($i <= $ztmMax)
        setVar $icnt 1
        setVar $iTxt $i
        while ($icnt <= sector.warpcount[$i])
#            setVar $iTxt sector.warps[$i][$icnt]
            setVar $iTxt $iTxt & " " & sector.warps[$i][$icnt]
            add $icnt 1
        end
        write "WarpSpec" & gamename & ".txt" $itxt
        add $i 1
   end
   write "WarpSpec" & gamename & ".txt" ""
   write "WarpSpec" & gamename & ".txt" ": ENDINTERROG"
   write "WarpSpec" & gamename & ".txt" ""
end


if ($trafficAnalysis = "Yes")
    gosub :trafficCheck
    setVar $windowmessagePass5 $windowMessagePass5 &  "*   Trafic file:  traffic_" & gamename & ".txt*"
end
gettime $ztmFinished "hh:nn:ss"
setvar $windowmessagePass5  $windowMessagePass5 & "**   ZTM Finished @ " & $ztmFinished & "*"
gosub :ztmWindowUpdate



:universe
  send "#"
  setVar $sectors7In 0
  setVar $totalWarps 0
  setVar $backdoors 0
  setVar $backDoorSectors 0
  setVar $universe 1
  setArray $uni 6
  while ($universe <= SECTORS)
       if (sector.warpcount[$universe] > 0)
          add $totalWarps sector.warpCount[$universe]
          add $uni[sector.warpcount[$universe]] 1
          if (sector.warpInCount[$universe] = 7)
             add $sectors7In 1
           end
          if (sector.backDoorCount[$universe] > 0)
             add $backDoors sector.backDoorCount[$universe]
             add $backDoorSectors 1
          end
       end
       add $universe 1
  end

  Window Uni 275 275 $version ONTOP
  setVar $uniWindow "*        Universe Summary*"
  setVar $uniWindow $uniWindow & "      Sectors        Warps*"
  getlength $uni[1] $len
  gosub :padLeftLen
  setVar $uniWindow $uniWindow & "    " & $padIt & $uni[1] & "            1*"
  getLength $uni[2] $len
  gosub :padLeftLen
  setVar $uniWindow $uniWindow & "    " & $padit & $uni[2] & "            2*"
  getLength $uni[3] $len
  gosub :padLeftLen
  setVar $uniWindow $uniWindow & "    " & $padIt & $uni[3] & "            3*"
  getLength $uni[4] $len
  gosub :padLeftLen
  setVar $uniWindow $uniWindow & "    " & $padIt & $uni[4] & "            4*"
  getLength $uni[5] $len
  gosub :padLeftLen
  setVar $uniWindow $uniWindow & "    " & $padIt & $uni[5] & "            5*"
  getLength $uni[6] $len
  gosub :padLeftLen
  setVar $uniWindow $uniWindow & "    " & $padIt & $uni[6] & "            6*"
  setVar $uniWindow $uniWindow & "*  -----------------------------*"
  getLength $sectors7In $len
  gosub :padLeftLen
  setVar $uniWindow $uniWindow & $padit & $sectors7In & " sectors with 7-warps in.*"
  getLength $backDoorSectors $len
  gosub :padLeftLen
  setVar $uniWindow $uniWindow & $padit & $backdoorSectors & " sectors with backdoors.*"
  getLength $backdoors $len
  setVar $uniWindow $uniWindow & $padit & $backdoors & " total backdoors.*"
  getLength $totalWarps $len
  gosub :padLeftLen
  setVar $uniWindow $uniWindow & $padit & $totalWarps & " total warps found.*"
  setWindowContents Uni $uniWindow


:stayAlive
  send "#"
  if ($ztmSend = "Yes")
     goto :sendWarpSpec
  end
  setdelayTrigger inactiv :stayAlive 30000
  pause


:sendWarpSpec
killalltriggers
setVar $sendReceive "s"
:sender
killtrigger botkill
send "'"
setTextTrigger goodSenderRadio :goodSenderRadio "Sub-space radio"
setDelayTrigger badSenderRadio :badSenderRadio 3000
pause
:badSenderRadio
  echo ANSI_12 "*Something went wrong - no sub-space radio detected! Halting**"
  halt
:goodSenderRadio
killtrigger badSenderRadio
send "*ProSSWarpSpec v1.0 by Promethius*"
send "Waiting on Receiver script to fire.*"
setTextTrigger receiverOn :receiverOn "ProWarpSpec Receiver Active"
setTextTrigger aborted :aborted "Sub-space comm-link terminated"
setTextTrigger botKill :botKill "kill prowarpspec"
setEventTrigger connLost :connLost "CONNECTION LOST"
setTextTrigger connLost2 :connLost "Connection lost"
setDelayTrigger broadCast :broadcast 45000
pause
:botkill
  killalltriggers
  send "**"
  send "'ProWarpSpec by Promethius Shutting Down*"
  halt
:broadCast
  killalltriggers
  send "'Kill script with kill prowarpspec on SS*"
  send "**"
  goto :sender
:aborted
# ID10T error - they hit the enter key and aborted SS!!!
  echo ANSI_12 "**SS Link Terminated - Halting Script!**"
  halt
:receiverOn
killtrigger broadCast
killtrigger aborted
send "Receiver detected*"
setVar $i 1
setVar $keepAliveSend 1
while ($i <= sectors)
   getLength $i $len
   gosub :padLen
    setVar $warpString "[++] " & $i & $padIt
   setVar $warpCounter 1
   if (sector.warpcount[$i] > 0)
      while ($warpCounter <= sector.warpcount[$i])
         getLength sector.warps[$i][$warpCounter] $len
         gosub :padLen
         setVar $warpString $warpString & sector.warps[$i][$warpCounter] & $padIt
         add $warpCounter 1
      end
      send $warpString & " [--]*"
   end
   add $i 1
   add $keepaliveSend 1
   if ($keepaliveSend = 750)
      setVar $keepaliveSend 1
      send "?Alive?*"
      setTextTrigger aliveRespond :aliveRespond "!Alive!"
      setDelayTrigger noOneAlive :noOneAlive 3000
      pause
      :noOneAlive
       send "**"
       goto :sendWarpSpec
      :aliveRespond
      killtrigger noOneAlive
   end
end
send "ProWarpSpec Complete**"
waitfor "ProWarpSpec Receiver Complete"
goto :sender

# our padding routine
:padLen
 setVar $padIt ""
 while ($len < 6)
    setVar $padIt $padIt & " "
    add $len 1
 end
 return
 
:padLeftLen
 setVar $padIt ""
 while ($len < 7)
    setVar $padIt " " & $padIt
    add $len 1
 end
 return

# goSubs

:windowSetup
getTime $stTime "'Start time:  ' h:nn:ss"
setVar $Window 1
Window ZTM 475 375 "      " & $version & "  by Promethius    " & $stTime  ONTOP
setVar $Window "*     Public Release*"
setVar $Window $Window & "     Release Date:   Aug 2005*"
setVar $Window $Window & "     Updated:  v.6   Oct 2005*"
setVar $Window $Window & "     Updated:  v1.0  Aug 2006*"
setVar $Window $Window & "     Updated:  v1.4  Nov 2006*"
setVar $Window $Window & "     Updated:  v1.4A Jan 2007*"
setVar $Window $Window & "     Updated:  v2.0  Apr 2008*"
setVar $window $window & "     Updated:  v3.0  Nov 2008*"
setVar $window $window & "     Updated:  v4.0  Dec 2008*"
setVar $window $window & "     Updated:  v4.11 Jun 2009"
setVar $Window $Window & " Please let me know of any issues on classicTW.com.*"
setWindowContents ZTM $Window
setDelayTrigger WindowSplash :windowSplash 3000
pause
:windowSplash
return

:ztmWindowUpdate
  setVar $window $windowMessagePass0 & $windowMessagepassCim & $windowMessagePass1 & $windowMessagePass2
  setVar $window $window & $windowMessagePass3 & $windowMessagePass4 & $windowMessagePass5
  setWindowContents ZTM $window
return

:totalWarps
setVar $totalWarps 0
setVar $ttlwrps 0
setVar $7Ins ""
if ($showWarpsFound = "Yes") or ($7WarpsInMonitor = "Yes") or ($endPassWarps = TRUE)
   while ($ttlwrps < SECTORS)
       add $ttlwrps 1
       add $totalWarps SECTOR.WARPCOUNT[$ttlwrps]
       if (SECTOR.WARPINCOUNT[$ttlwrps] = 7) and ($7WarpsInMonitor = "Yes")
          if (sector.explored[$ttlwrps] = YES)
              setVar $padIt " -e- "
          else
              setVar $padIt " -u- "
          end

          if ($ttlWrps < 10)
             setVar $padIt $padIt & "     BD = "
          elseif ($ttlWrps < 100)
             setVar $padIt $padIt & "    BD = "
          elseif ($ttlWrps < 1000)
             setVar $padIt $padIt & "   BD = "
          elseif ($ttlWrps < 10000)
             setVar $padIt $padIt & "  BD = "
          elseif ($ttlWrps > 9999)
          setVar $padIt $padIt & " BD = "
          end
          setVar $update7In 1
          setVar $7Ins $7Ins & "*" & $ttlwrps & $padIt & SECTOR.BACKDOORS[$ttlwrps][1]
       end
   end
end
if ($7WarpsInMonitor = "Yes")
   if ($update7In = 1)
      setVar $upDate7In 0
      setwindowContents 7In $7Ins & "*"
   else
      setwindowContents 7In "*No Sectors Matched*"
   end
end
return


:onLineWatch
  setVar $onlineWindow ""
  send "#"
  waitfor "Who's Playing"
  :roll
  setVar $iroll 1
  setTextTrigger alien :plyrDone "on the move"
  setTextTrigger dockwatch :plyrDone "<StarDock>"
  setTextTrigger onlinedone :plyrDone ":"
  while ($iroll <= 24)
      setTextLineTrigger $iroll & "player" :players $titles[$iroll]
      add $iroll 1
  end
  pause
  :players
   killtrigger alien
   killtrigger onlinedone
   killtrigger dockwatch
   setVar $iroll 1
   while ($iroll <= 24)
      killtrigger $iroll & "player"
      add $iroll 1
   end
   setVar $onLineWindow $onlineWindow & " " & currentline & "*"
   goto :roll
   :plyrDone
   killtrigger alien
   killtrigger onlinedone
   killtrigger dockwatch
   setVar $iroll 1
   while ($iroll <= 24)
      killtrigger $iroll & "player"
      add $iroll 1
   end
   setwindowcontents onLine $onLineWindow
   return

:getTitles
  setVar $titles[1] "Class "
  setVar $titles[2] "Nuisance "
  setVar $titles[3] "Menace "
  setVar $titles[4] "Smuggler "
  setVar $titles[5] "Robber "
  setVar $titles[6] "Private "
  setVar $titles[7] "Corporal "
  setVar $titles[8] "Sergeant "
  setVar $titles[9] "Warrant "
  setVar $titles[10] "Terrorist "
  setVar $titles[11] "Pirate "
  setVar $titles[12] "Galactic"
  setVar $titles[13] "Enemy"
  setVar $titles[14] "Heinous Overlord "
  setVar $titles[15] "Prime Evil "
  setVar $titles[16] "Ensign "
  setVar $titles[17] "Lieutenant "
  setVar $titles[18] "Commander "
  setVar $titles[19] "Captain "
  setVar $titles[20] "Commodore "
  setVar $titles[21] "Admiral "
  setVar $titles[22] "Civilian "
  setVar $titles[23] "Annoyance "
  setVar $titles[24] "Ambassador"
return


:dataMenu
    setVar $dataChoice ""
  while ($dataChoice <> "r")
    echo "[2J"
    echo "**" ANSI_12 "  <----------------| " ANSI_15 "ZTM by Promethius" ANSI_12 " |---------------->"
    echo "**"  ANSI_10 "           1.  Write dead-end list?    " ANSI_14 $deadEndList
    echo "*"  ANSI_10 "           2.  Write 7 warps-in list?  " ANSI_14 $7WarpsList
    echo "*"  ANSI_10 "           3.  Write SWATH warp data?  " ANSI_14 $swathData
    echo "*"  ANSI_10 "           4.  Write traffic analysis? " ANSI_14 $trafficAnalysis
    echo "*"  ANSI_11 "*           R.  " ANSI_15 "Return to Main Menu          *"
    echo "*"  ANSI_12 "  <--------------------| " ANSI_15 $version ANSI_12 " |-------------------->*         "
    getConsoleInput $dataChoice singleKey
    lowercase $dataChoice
    if ($dataChoice = 1)
       if ($deadEndList = "No")
          setVar $deadEndList "Yes"
       else
          setVar $deadEndList "No"
       end
    elseif ($dataChoice = 2)
          if ($7WarpsList = "No")
             setVar $7WarpsList "Yes"
          else
             setVar $7WarpsList "No"
          end
    elseIf ($dataChoice = 3)
          if ($swathData = "No")
             setVar $swathData "Yes"
          else
             setVar $swathData "No"
          end
    elseif ($dataChoice = 4)
          if ($trafficAnalysis = "No")
             setVar $trafficAnalysis "Yes"
          else
             setVar $trafficAnalysis "No"
          end
    end
end


return


:trafficCheck
Window TRAFFIC 375 110 " " & $version & "  Traffic Analysis"  ONTOP
setVar $tMessage "* Beginning traffic check - be patient.*"
setWindowContents TRAFFIC $tMessage
setdelaytrigger mwin :mwin 1500
pause
:mwin
setVar $chkUpdate 0
setVar $i 1
setVar $end SECTORS
setArray $traffic SECTORS
while ($i <= SECTORS)
  getCourse $course $i $end
  setVar $ti 1
  while ($ti < $course)
      add $traffic[$COURSE[$ti]] 1
      add $ti 1
  end
  add $i 1
  subtract $end 1
  if ($i = $end)
     subtract $end 1
  end
  setVar $tot_sectors $i
  multiply $tot_sectors 100
  divide $tot_Sectors SECTORS
  if ($ckUpdate <> $tot_sectors) and ($tot_sectors > 0)
      setVar $tMessage "*  Traffic Analysis Pass 1 @ " & $tot_sectors & "%*"
      setWindowContents TRAFFIC $tMessage
   end
   setVar $ckUpdate $tot_Sectors
end
# added Nov 2006
send "#"
# run Deadend to Deadend courses
setVar $i 11
setVar $DE1 0
send "#"
while ($i <= $totSectors)
   if (SECTOR.WARPCOUNT[$i] = 1)
      add $DE1 1
      setvar $DE[$DE1] $i
      if ($DE1 > 1)
         setVar $DE2 ($DE1 - 1)
         getCourse $course $DE[$DE1] $DE[$DE2]
         setVar $ti 1
         while ($ti < $course)
            add $traffic[$COURSE[$ti]] 1
            add $ti 1
         end
      end
   end
  add $i 1
  setVar $tot_sectors $i
  multiply $tot_sectors 100
  divide $tot_Sectors SECTORS
  if ($ckUpdate <> $tot_sectors) and ($tot_sectors > 0)
      setVar $tMessage "*  Traffic Analysis Pass 2 @ " & $tot_Sectors & "%*"
      setWindowContents TRAFFIC $tMessage
   end
   setVar $ckUpdate $tot_Sectors
end

:writeTraffic
send "#"
setVar $tMessage "*Writeing traffic analysis file*"
setWindowContents TRAFFIC $tMessage
setVar $i 1
fileExists $exists "traffic_" & gamename & ".txt"
if ($exists)
    delete "traffic_" & gamename & ".txt"
end
write "traffic_" & gamename & ".txt" "Sector-------Warps-------Paths-------BackDoors"
while ($i <= Sectors)
   getlength $i $len
   setVar $ipad $i
   while ($len < 5)
      setVar $ipad " " & $ipad
      add $len 1
   end
   getlength $traffic[$i] $len
   while ($len < 5)
      setVar  $traffic[$i] " " &  $traffic[$i]
      add $len 1
   end
   if (sector.backdoorcount[$i] > 0)
      setVar $bCnt 1
      setVar $bkDoor ""
      while ($bCnt <= sector.backdoorcount[$i])
             setVar $bkDoor $bkDoor & sector.backdoors[$i][$bCnt] & " "
             add $bCnt 1
      end
   else
      setVar $bkDoor " "
   end
   write "traffic_" & gamename & ".txt" $ipad & "          " & sector.warpcount[$i] & "        " & $traffic[$i] & "            " & $bkDoor
   add $i 1
end
setVar $tMessage "* Traffic analysis file:  traffic_" & gamename & ".txt*"
 setWindowContents TRAFFIC $tMessage
return


:checkComp
  setTextTrigger intGood2 :computerDone2 $chkSector & " > "
  setTextTrigger compClear2 :clearVoids2 "Clear Avoids"
  pause
 :clearVoids2
  killtrigger intGood2
  send "y"
 :computerDone2
 killtrigger compClear2
return

:connLost
 killalltriggers
  waitfor "Command [TL"
      loadVar $ztmMin
      loadVar $ztmMax
      loadVar $ztmStart
      loadVar $ztmEnd
      loadVar $verifyStart
      loadVar $verifyEnd
      loadVar $firstPassVerified
      loadVar $sPassZTMStart
      loadVar $spassZTMEnd
      echo ansi_12 "*" & $version & " resuming in " ansi_14 "10 " ANSI_12 "seconds."
      setDelayTrigger relogDelay :begin 10000
      setVar $reConn 1
      pause
  goto :begin
  halt

:writeWarpSpec
setVar $i 1
delete  gamename & "warpSpec.txt"
while ($i <= sectors)
   getLength $i $len
   gosub :padLen
    setVar $warpString $i & $padIt
   setVar $warpCounter 1
   if (sector.warpcount[$i] > 0)
      while ($warpCounter <= sector.warpcount[$i])
         getLength sector.warps[$i][$warpCounter] $len
         gosub :padLen
         setVar $warpString $warpString & sector.warps[$i][$warpCounter] & $padIt
         add $warpCounter 1
      end
      write gamename & "warpSpec.txt"  $warpString
   end
   add $i 1
end
return