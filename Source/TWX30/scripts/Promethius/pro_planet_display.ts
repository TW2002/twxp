# planetDisplay.ts by Promethius
# planet displays sorted by sector order
# display lines used to seperate bases
# echos to screen display only

send "tl"
waitfor "=============================================================================="
setVar $i 1
setVar $toggle 0
:trg
setTextLineTrigger getLine :lineOut ""
setTextTrigger done :sortSectors "Corporate command"
pause

:lineOut
getword currentline $chkDone 1
if ($chkDone = "======")
     goto :skip
end
getwordpos currentline $sectorLine "Class"
if ($sectorLine > 0)
    setVar $sector[$i] $chkDone
end

add $toggle 1
if ($toggle = 1)
      setVar $line[$i] currentANSILine
elseif ($toggle = 2)
    setVar $line2[$i] currentANSILine
    setVar $toggle 0
    add $i 1
end
:skip
setTextLineTrigger getLine :lineOut ""
pause


:sortSectors
  setVar $ii ($i - 1)
  while ($ii >= 1)
    setVar $ij 1
    while ($ij <= ($ii - 1))
      setVar $ijDist1 $sector[$ij]
      stripText $ijDist1 ","
      setVar $ijNext ($ij + 1)
      setVar $ijDist2 $sector[$ijNext]
      stripText $ijDist2 ","
      if ($ijDist1 < $ijdist2)
        setVar $temp $sector[$ij]
        setVar $tempLine $line[$ij]
        setVar $tempLine2 $line2[$ij]
        setVar $Sector[$ij] $Sector[$ijNext]
        setVar $line[$ij] $line[$ijNext]
        setVar $line2[$ij] $line2[$ijNext]
        setVar $Sector[$ijNext] $temp
        setVar $line[$ijNext] $tempLine
        setVar $line2[$ijNext] $tempLine2
       end
      add $ij 1
    end
    subtract $ii 1
  end

:display
killtrigger getline
send "q"
echo ansi_15 "**                           Corporate Planet Scan"
echo "*"
echo ansi_11 "* Sector  Planet Name    Ore  Org  Equ   Ore   Org   Equ   Fighters    Citadel"
echo ansi_11 "* Shields Population    -=Productions=-  -=-=-=-=-On Hands-=-=-=-=-    Credits"
echo ansi_13 "*==============================================================================*"
setVar $dispCnt 1
setVar $sectorChng $sector[1]
while ($dispCnt < $i)

   if ($sectorChng <> $sector[$dispCnt])
      echo ansi_9 "------------------------------------------------------------------------------*"
      setVar $sectorChng $sector[$dispCnt]
   end
   if (($dispCnt + 1) = $i)
       echo ansi_13 "======   ============  ==== ==== ==== ===== ===== ===== ========== ==========*"
   end
   echo $line[$dispCnt]
   echo $line2[$dispCnt]

   add $dispCnt 1
end
halt