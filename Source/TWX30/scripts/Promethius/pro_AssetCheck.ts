# proAssetCheck.ts   ---  Provide an asset report for the corp.
# This script will broadcast over subspace (make sure it isn't set to 0)
# a report of corporate assets.  It will also check base locations for
# overloaded corporate planets.  It will not take into account any
# personal planets that someone may have made.
# --------- Original script:  Promethius
# --------- Version:          2.3
# --------- Edit script:
# --------- Edit changes:  05/14/2005  - Added limpet and aramid deployments and corpie ships.
# ---------                06/23/2005  - Planet detail option added.
# ---------                12/15/2005  - Added window display in addition to SS display
# ---------                01/19/2006  - Added corp fighters/planets/citadel comparison vs game totals
# --------- Bug fix:       06/23/2005  - Script lockup if no mines deployed.
# ---------                01/14/2006  - Fixed cut past end of line problem.

# --------- Please NOTE:  The window display is a kludge and was not done efficiently at all
# ---------               as I simply duplicated existing code - was lazy on this part.

# to do -- add Tpad to planet details

setVar $i 0
setVar $myCount 0
setVar $numFig 0
setArray $cits 7
setVar $resetCN9 0
setVar $cBarLen 25
setVar $shipTypes "All"
setVar $minesDeployed "No"
setVar $baseDetails "No"
setVar $baseID "Base"
setVar $output "SubSpace"
setVar $totalBaseFighters 0

echo "**" ANSI_11 "Checking CN4 and CN9 Setting"
setdelaytrigger ckCN4 :CN4 1000
pause

:CN4
  send "cn"
  setTextLineTrigger cnSS :CNSS "Sub-space radio"
  pause
  :CNSS
  getword CURRENTLINE $channel 6
  :CN9
#  send "cn"
  setTextLineTrigger cnSet :CN9Setting " on keys"
  pause
:CN9Setting
  getword CURRENTLINE $cn9Set 7
  if ($cn9Set <> "SPACE")
     send "9"
     setVar $resetCN9 1
  end
  send "qq"
  waitfor "Command"
  if ($channel = 0)
      echo "[2J"
      echo ANSI_12 "<!!! CAUTION:  Your Sub-Space Channel is 0 - Fed Com !!!>"
      echo ANSI_12 "*<!!!           Press c to continue*"
      getConsoleInput $inkey SINGLEKEY
      if ($inkey <> "c")
         halt
      end
  end

:menu
  echo "[2J"
  echo ANSI_15 "                   Corporate Assets Report by Promethius*"
  gosub :colorbar
  echo ANSI_15 "*1.  " ANSI_11 "Ship Assets to show: " ANSI_14 $shipTypes
  echo ANSI_15 "*2.  " ANSI_11 "Include mine deployments? " ANSI_14 $minesDeployed
  echo ANSI_15 "*3.  " ANSI_11 "Provide detailed base assets? " ANSI_14 $baseDetails
  echo ANSI_15 "*4.  " ANSI_11 "Show base locations by sector or base number? " ANSI_14 $baseID
  echo ANSI_15 "*5   " ANSI_11 "Output data to? " ANSI_14 $output
  echo ANSI_15 "*Q.  " ANSI_11 "Quit"
  echo ANSI_15 "*S.  " ANSI_11 "Start analysis of assets"
  if ($channel = 0)
      echo ANSI_13 "**!!!!  Report set to go out on Fed-Com - Hope you are sure  !!!!*"
  end
  echo "*"
  gosub :colorbar
  echo "*"
  getConsoleInput $menuSelect SINGLEKEY
  if ($menuSelect = 1)
     if ($shipTypes = "All")
        setVar $shipTypes "Spares"
     else
        setVar $shipTypes "All"
     end
  elseif ($menuSelect = 2)
     if ($minesDeployed = "No")
        setVar $minesDeployed "Yes"
     else
        setVar $minesDeployed "No"
     end
  elseif ($menuSelect = 3)
      if ($baseDetails = "No")
         setVar $baseDetails "Yes"
      else
         setVar $baseDetails "No"
      end
  elseif ($menuSelect = 4)
      if ($baseID = "Base")
         setVar $baseID "Sector"
      else
         setVar $baseID "Base"
      end
  elseif ($menuSelect = 5)
      if ($output = "SubSpace")
          setVar $output "Window"
      else
          setVar $output "SubSpace"
      end
  elseif ($menuSelect = "q")
      clientmessage "Aborting assets report..."
      halt
  end
  if ($menuSelect <> "s")
     goto :menu
  end

if ($resetCN9 = 1)
   waitfor "<Computer deactivated>"
   echo "**" ANSI_12 "     ______________________________________________"
   echo "*"
   echo "*" ANSI_11 "       Your CN9 setting has been changed to Space."
   echo "*" ANSI_11 "               YOU will need to reset it!"
   echo "*" ANSI_12 "     ______________________________________________"
   setDelayTrigger remind :reminder 2000
   pause
   :reminder
end

# send "'Updating Corporate Asset Data" "*"

# get game stats from V screen
send "v"
waitfor "Traders on a Corp:"
getWord CURRENTLINE $maxPlanets 8
stripText $maxPlanets ","
waitfor "% have Citadels."
getWord CURRENTLINE $gamePlanets 1
getWord CURRENTLINE $gameCitPerCent 7
stripText $gamePlanets ","
stripText $gameCitPerCent "%"
waitfor "Mines are in use"
getword CURRENTLINE $gameFighters 1
stripText $gameFighters ","
setVar $gameCitadels ($gamePlanets * $gameCitPerCent)
divide $gameCitadels 100

send "cn1qq"
send "g"
waitfor "==="

:buildFigArray
  setTextTrigger Corpfig :addtoList "Corp"
  if ($minesDeployed = "No")
     setTextTrigger ListDone :chkShips "Command"
  else
     setTextTrigger ListComplete :mineAssets "Command"
  end
pause

:addtoList
 KillAllTriggers
 add $myCount 1
 getword currentline $figSector 1
 getword currentline $num 2
 setvar $fighter[$mycount] $figSector
 getwordpos $num $pos "T"
 if ($pos > 1)
    striptext $num "T"
    multiply $num 1000
 end
 getwordpos $num $pos "M"
 if ($pos > 1)
    striptext $num "M"
    multiply $num 1000000
 end
 getwordpos $num $pos "B"
 if ($pos > 1)
     stripText $num "B"
     multiply $num 1000000000
 end
 if ($num = 0)
     add $numFig 1
 else
     add $numFig $num
     setVar $num 0
 end
goto :buildFigArray

:mineAssets
  killalltriggers
  setVar $aramidTotal 0
  send "k1"
  waitfor "====="

  :chkAramids
    setTextTrigger CorpAramid :addAramidtoList "Corp"
    setTextTrigger noAramids :noAramidsFound "No mines deployed"
    setTextTrigger AramidDone :limpetAssets "Total"
    pause

  :addAramidtoList
    killalltriggers
    getword currentline $aramidAmount 2
    add $aramidTotal $aramidAmount
    add $aramidSectors 1
    goto :chkAramids

  :noAramidsFound
    # No aramids are deployed

  :limpetAssets
    killalltriggers
    setVar $limpetTotal 0
    send "k2"
    waitfor "====="

  :chklimpets
    setTextTrigger CorpLimpet :addLimpettoList "Corp"
    setTextTrigger noLimpets :noLimpetsFound "No Limpet mines deployed"
    setTextTrigger LimpetDone :chkShips "Total"
    pause

  :addLimpettoList
    killalltriggers
    getword currentline $limpetAmount 2
    add $limpetTotal $limpetAmount
    add $limpetSectors 1
    goto :chkLimpets



:displayAll
if ($output = "Window")
   goto :windowDisplayAll
end
send "cn1qq"
setVar $myCountX $myCount
multiply $myCountX 100
setVar $tmp ($mycountX / Sectors)
setVar $tmpStr $myCount
gosub :myformat
setVar $myCount $tmpstr
setVar $tmpStr SECTORS
gosub :myformat
setVar $mySectors $tmpStr
setVar $tmpStr $numFig
gosub :myformat
setVar $numFig $tmpStr
send "'*"
send "<--------------------- Corporate Assets Report --------------------->*"
send " *"
send " ------------------ *"
send " Deployed Fighters *"
send " ------------------*"
send "  " $mycount " of " $mySectors " Sectors - " $tmp "% Coverage*"
send "  " $numFig " Total Fighters Deployed*"
if ($minesDeployed = "Yes")
   send " *"
   send " ------------------ *"
   send " Mines Deployed  *"
   send " ------------------*"
   send "  Limpet mines in " $limpetSectors " sectors totaling " $limpetTotal " mines.*"
   send "  Aramid mines in " $aramidSectors " sectors totaling " $aramidTotal " mines.*"
end
send " *"
send " ------------------ *"
if ($baseDetails = "Yes")
   send " Detail"
end
send " Base Status  *"
send " ------------------*"


if ($baseDetails = "Yes")
   send "     Base     Planets   Status     Cit Levels      Figs     Credits*"
else
   send "     Base     Planets   Status       Base     Planets   Status*"
end
  setVar $plCnt 0
  setVar $plntCnt 0
  setVar $i 11
  while ($i < SECTORS)
       if ($planets[$i] > 0)
          add $plntCnt 1
          add $plCnt 1
          setVar $padit 6
          if ($baseID = "Base")
             SetVar $inStr $plCnt
             gosub :padLeft
             send "  " $padL $plCnt "        " $planets[$i]
          else
             setVar $instr $i
             gosub :padLeft
             send "  " $padL $i "        " $planets[$i]
          end
          if ($planets[$i] > $maxPlanets)
             send "    OVERLOADED"
          else
             send "    Checked Ok"
          end
          if ($baseDetails = "Yes")
              getlength $baseDetail[$i] $strLen
              while ($strLen < 10)
                   setVar $baseDetail[$i] $baseDetail[$i] & " "
                   add $strLen 1
              end
              add  $totalBaseFighters $baseFigs[$i]
              setVar $baseFig $baseFigs[$i]
              if ($basefig > 999999999)
                 divide $basefig 1000000000
                 setVar $basefig $basefig & "B"
              elseif ($basefig > 999999)
                 divide $basefig 1000000
                 setVar $basefig $basefig & "M"
              elseif ($basefig > 999)
                 divide $basefig 1000
                 setVar $basefig $basefig & "K"
              end
              setvar $instr $basefig
              setVar $padit 8
              gosub :padLeft
              setVar $basefig $padL & $baseFig

              setVar $citCash $baseCash[$i]
              if ($baseCash[$i] > 999999999)
                 divide $citCash 1000000000
                 setVar $citCash $citCash & "B"
              elseif ($baseCash[$i] > 999999)
                 divide $citCash 1000000
                 setVar $citCash $citCash & "M"
              elseif ($baseCash[$i] > 999)
                 divide $citCash 1000
                 setVar $citCash $citCash & "K"
              end
              setvar $instr $citCash
              setVar $padit 9
              gosub :padLeft
               send "    " $baseDetail[$i] $basefig $padL $citCash
              send "*"
              setVar $plntCnt 0
          end
       end
       if ($plntCnt = 2)
           send "*"
           setVar $plntCnt 0
       end
       add $i 1
  end
  if ($plCnt = 0)
     send "               No Planets Found for your Corp*"
  else
     send " *"
     send " *"
     send " ------------------ *"
     send " Citadel Status*"
     send " ------------------ *"
     send "   Lvl 0   Lvl 1   Lvl 2   Lvl 3   Lvl 4   Lvl 5   Lvl 6*"
     send "     " $cits[1]
     send "       " $cits[2]
     send "       " $cits[3]
     send "       " $cits[4]
     send "       " $cits[5]
     send "       " $cits[6]
     send "       " $cits[7] "*"
     send " *"
     send " ------------------ *"
     send " Planet Assets*"
     send " ------------------ *"
     send "                Ore  Org  Equ   Ore   Org   Equ   Fighters*"
     send "Population     -=Productions=-  -=-=-=-=-On Hands-=-=-=-=-    Credits*"
     send $bott "*"
     send " *"
     send " ------------------ *"
     send " Available Ships*"
     send " ------------------ *"
     send "   Cnt   Type                      Total Figs*"
     setVar $i 1
     setVar $totalShip 0
     if ($shipCnt[1] > 0)
        while ($i <= 20)
           if ($shipCnt[$i] > 0)
              send "    " $shipCnt[$i] " -- " $shipTypes[$i] " -- " $shipFigs[$i] "*"
           end
           add $totalShip $shipFigs[$i]
           add $i 1
        end
        send "                      All Ships -- " $totalShip "*"
     else
        send "   No corporate ships are available*"
     end
  end
     send " *"
     send " -------------------- *"
     send " Corp Assets vs Game *"
     send " -------------------- *"
     stripText $numFig ","
     add $totalShip $numFig
     setVar $totalCorpFigs $totalShip
     if ($totalBaseFighters = 0)
         getword $bott $fig 8
        getwordpos $fig $tpos "T"
        getwordpos $fig $mpos "M"
        getwordpos $fig $bpos "B"
        if ($tpos > 0)
           stripText $fig "T"
           multiply $fig 1000
        elseif ($mpos > 0)
          stripText $fig "M"
          multiply $fig 1000000
        elseif ($bpos > 0)
          stripText $fig "B"
          multiply $fig 1000000000
       end
       add $totalCorpFigs $fig
     else
       add $totalCorpFigs $totalBaseFighters
     end
     if ($totalCorpFigs > $gameFighters)
        send "   !! Fighters on unmanned ships do not count for game totals !!*"
     end
     setVar $instr $totalCorpFigs
     setVar $padit 16
     gosub :padLeft
     send " Corp fighters: " $totalCorpFigs $padL "Game fighters:  " $gameFighters "*"
     send " Corp planets: "
     setVar $i 1
     setVar $corpPlanets 0
     setVar $corpCits 0
     while ($i <= 7)
           add $corpPlanets $cits[$i]
           add $i 1
     end
     setVar $i 2
     while ($i <= 7)
           add $corpCits $cits[$i]
           add $i 1
     end
     send $corpPlanets " (" $corpCits ") Citadels    Game planets: " $gamePlanets " (" $gameCitadels ") Citadels*"

  send " *"
  send "<--------------------------- Promethius ---------------------------->*"
  send "*"
  waitfor "comm-link terminated"
halt

:noLimpetsFound
  # No limpets were deployed
:chkShips
  killalltriggers
  setArray $shipTypes 20
  setArray $shipCnt 20
  setArray $shipFigs 20
  if ($shipTypes = "All")
     send "cz"
  else
     send "x "
  end
  waitfor "----"
:getShips
  killalltriggers
#  setTextLineTrigger ship :corpShip "Corp "
  setTextLineTrigger ship :corpShip ""
  if ($shipTypes = "All")
     setTextTrigger allShips :chkPlanets "Computer command [TL"
  else
     setTextTrigger endShip :chkPlanets "details"
     setTextTrigger noShips :noShips "You do not own"
  end
  pause

:noShips
  setVar $shipTypes[1] "You do not own any other ships!"
  setVar $i 1
  goto :chkPlanets

:corpShip

  getlength CURRENTLINE $len
  if ($len < 57)
      goto :getShips
  end
  setVar $cutPoint $len-56
  cuttext CURRENTLINE $type 56 $cutPoint
  # 22
  cuttext CURRENTLINE $sFigs 35 7
  striptext $sFigs " "
  getwordpos $sFigs $pos "T"
  if ($pos > 0)
     striptext $sFigs "T"
     multiply $sFigs 1000
  end
  setVar $i 1
  while ($i <= 20)
    if ($shipTypes[$i] = 0)
       setVar $shipTypes[$i] $type
    end
    if ($shipTypes[$i] = $type)
       add $shipCnt[$i] 1
       add $shipFigs[$i] $sFigs
       add $i 21
    end
    add $i 1
  end
  goto :getShips

:chkPlanets
if ($shipTypes[1] <> "You do not own any other ships!")
   send "q"
end
killalltriggers
setArray $Planets SECTORS
send "tl"
waitfor "========="

:buildPlanetList
 setTextLineTrigger more :findplanet "Class"
 setTextLineTrigger bottom :botLine "======   ============"
 setTextTrigger nomore :plDisplay "Corporate command [TL="
 pause

:plDisplay
  send "q"
  goto :DisplayAll

:botLine
  killalltriggers
#  waitfor " ("
  setTextLineTrigger bot :botTotal ")  "
  pause
  :botTotal
  getlength CURRENTLINE $len
  subtract $len 8
  striptext $len " "
  cuttext CURRENTLINE $bott 9 $len
  goto :buildPlanetList

:findplanet
 killalltriggers
 getword CURRENTLINE $plSector 1
 add $planets[$plSector] 1
 if ($planets[$plSector] = 1)
    setVar $baseDetail[$plSector] ""
 end
 cuttext CURRENTLINE $cit 77 1
 if ($cit = "l")
     add $cits[1] 1
     setVar $planetCits "0"
 else
     setVar $planetCits $cit
     add $cit 1
     add $cits[$cit] 1
 end
 setVar $baseDetail[$plSector] $baseDetail[$plSector] & " " & $planetCits
 setTextLineTrigger getCash :cash ")"
 pause
 :cash
 cuttext CURRENTLINE $cash 72 7
 stripText $cash " "
 stripText $cash ","
 if ($cash = "---")
 else
     getwordpos $cash $pos "T"
     if ($pos > 0)
         stripText $cash "T"
         multiply $cash 1000
     end
     getwordpos $cash $pos "M"
     if ($pos > 0)
         stripText $cash "M"
         multiply $cash 1000000
     end
     getwordpos $cash $pos "B"
     if ($pos > 0)
        stripText $cash "B"
        multiply $cash 1000000000
     end
     add $baseCash[$plSector] $cash
 end
 gosub :planetFigs
goto :buildPlanetList

:myFormat
getLength $tmpStr $tLen
If ($tlen < 4)
    return
end
setVar $inStr $tmpStr
setVar $i 1
add $tlen 1
if ($tLen > 3)
    setVar $tmpStr ""
    while ($i < $tlen)
       cuttext $inStr $tmpStr1 ($tlen - $i) 1
       setVar $tmpStr ($tmpStr1 & $tmpStr)
       if ($i = 3)
          setVar $tmpStr ("," & $tmpStr)
       end
       if ($i = 6) and ($tlen > 7)
          setVar $tmpStr ("," & $tmpStr)
       end
       if ($i = 9) and ($tlen > 10)
           setVar $tmpStr ("," & $tmpStr)
       end
       add $i 1
    end

end
return

:format
setVar $padL ""
setVar $padR ""
getlength $i $tlen
while ($tlen < 5)
   setVar $padL $padL & " "
   add $tlen 1
end
getlength $numFig[$i] $tlen
while ($tlen < 5)
    setVar $padR $padR & " "
     add $tlen 1
end
return

:padLeft
  setVar $padL ""
  getlength $inStr $tlen
  while ($tlen <= $padit)
         setVar $padL ($padL & " ")
         add $tlen 1
  end
return

:colorBar
   setVar $i 1
   while ($i <= $cBarLen)
         echo ansi_12 "-" ansi_15 "=" ansi_11 "-"
         add $i 1
   end
return

:planetFigs
cuttext currentline $num 60 7
striptext $num " "
striptext $num ","
getwordpos $num $pos "T"
 if ($pos > 1)
    striptext $num "T"
    multiply $num 1000
 end
 getwordpos $num $pos "M"
 if ($pos > 1)
    striptext $num "M"
    multiply $num 1000000
 end
 getwordpos $num $pos "B"
 if ($pos > 1)
     stripText $num "B"
     multiply $num 1000000000
 end
 add $baseFigs[$plSector] $num
return


:windowDisplayAll
setVar $Window 1
Window ProAssets 640 780 "                        Corporate Assets Report        by Promethius            "  ONTOP
send "cn1qq"
setVar $myCountX $myCount
multiply $myCountX 100
setVar $tmp ($mycountX / Sectors)
setVar $tmpStr $myCount
gosub :myformat
setVar $myCount $tmpstr
setVar $tmpStr SECTORS
gosub :myformat
setVar $mySectors $tmpStr
setVar $tmpStr $numFig
gosub :myformat
setVar $numFig $tmpStr
setVar $winDisp "*" & " ------------------------ *" & " Deployed Fighters *" & " ------------------------*"
setVar $winDisp $winDisp & "  " & $mycount & " of " & $mySectors & " Sectors - " & $tmp & "% Coverage*"
setVar $winDisp $winDisp & "  " & $numFig & " Total Fighters Deployed*"
if ($minesDeployed = "Yes")
   setVar $winDisp $winDisp &  " *"
   setVar $winDisp $winDisp &  " ------------------------ *" & " Mines Deployed  *" &  " ------------------------*"
   setVar $winDisp $winDisp &  "  Limpet mines in " & $limpetSectors & " sectors totaling " & $limpetTotal & " mines.*"
   setVar $winDisp $winDisp &  "  Aramid mines in " & $aramidSectors & " sectors totaling " & $aramidTotal & " mines.*"
end
setVar $winDisp $winDisp &  "*" &  " ------------------------ *"
if ($baseDetails = "Yes")
   setVar $winDisp $winDisp & " Detail"
end
setVar $winDisp $winDisp & " Base Status  *" & " ------------------------*"


if ($baseDetails = "Yes")
   setVar $winDisp $winDisp &  "     Base     Planets   Status     Cit Levels      Figs     Credits*"
else
   setVar $winDisp $winDisp &  "     Base     Planets   Status                       Base     Planets   Status*"
end
  setVar $plCnt 0
  setVar $plntCnt 0
  setVar $i 11
  while ($i < SECTORS)
       if ($planets[$i] > 0)
          add $plntCnt 1
          add $plCnt 1
          setVar $padit 10
          if ($baseID = "Base")
             SetVar $inStr $plCnt
             gosub :padLeft
             setVar $winDisp $winDisp & "  " & $padL & $plCnt & "        " & $planets[$i]
          else
             setVar $instr $i
             gosub :padLeft
             setVar $winDisp $winDisp &  "  " & $padL & $i & "        " & $planets[$i]
          end
          if ($planets[$i] > $maxPlanets)
             setVar $winDisp $winDisp &  "              OVERLOADED"
          else
             setVar $winDisp $winDisp &  "              Checked Ok"
          end
          if ($baseDetails = "Yes")
              getlength $baseDetail[$i] $strLen
              while ($strLen < 10)
                   setVar $baseDetail[$i] $baseDetail[$i] & " "
                   add $strLen 1
              end
              setVar $baseFig $baseFigs[$i]
              if ($basefig > 999999999)
                 divide $basefig 1000000000
                 setVar $basefig $basefig & "B"
              elseif ($basefig > 999999)
                 divide $basefig 1000000
                 setVar $basefig $basefig & "M"
              elseif ($basefig > 999)
                 divide $basefig 1000
                 setVar $basefig $basefig & "K"
              end
              setvar $instr $basefig
              setVar $padit 8
              gosub :padLeft
              setVar $basefig $padL & $baseFig

              setVar $citCash $baseCash[$i]
              if ($baseCash[$i] > 999999999)
                 divide $citCash 1000000000
                 setVar $citCash $citCash & "B"
              elseif ($baseCash[$i] > 999999)
                 divide $citCash 1000000
                 setVar $citCash $citCash & "M"
              elseif ($baseCash[$i] > 999)
                 divide $citCash 1000
                 setVar $citCash $citCash & "K"
              end
              setvar $instr $citCash
              setVar $padit 9
              gosub :padLeft

              setVar $winDisp $winDisp &  "    " & $baseDetail[$i] & $basefig & $padL & $citCash
              setVar $winDisp $winDisp &  "*"
              setVar $plntCnt 0
          end
       end
       if ($plntCnt = 2)
           setVar $winDisp $winDisp & "*"
           setVar $plntCnt 0
       end
       add $i 1
  end
  if ($plCnt = 0)
     setVar $winDisp $winDisp & "               No Planets Found for your Corp*"
  else
     setVar $winDisp $winDisp & "*" & " ------------------------ *" & " Citadel Status*" & " ------------------------ *"
     setVar $winDisp $winDisp & "   Lvl 0   Lvl 1   Lvl 2   Lvl 3   Lvl 4   Lvl 5   Lvl 6*"
     setVar $winDisp $winDisp & "      " & $cits[1] & "         " & $cits[2] &  "         " & $cits[3]
     setVar $winDisp $winDisp & "         " & $cits[4] & "         " & $cits[5] & "         " & $cits[6]
     setVar $winDisp $winDisp & "         " & $cits[7] & "*"
     setVar $winDisp $winDisp & " *" & " ------------------------ *" & " Planet Assets*" & " ------------------------ *"
     setVar $winDisp $winDisp & "                Ore  Org  Equ   Ore   Org   Equ   Fighters*"
     setVar $winDisp $winDisp & "Population     -=Productions=-  -=-=-=-=-On Hands-=-=-=-=-    Credits*"
     setVar $winDisp $winDisp & $bott & "*"
     setVar $winDisp $winDisp & " *" & " ------------------------ *" & " Available Ships*" & " ------------------------ *"
     setVar $winDisp $winDisp &  "   Cnt   Type                      Total Figs*"
     setVar $i 1
     setVar $totalShip 0
     if ($shipCnt[1] > 0)
        while ($i <= 20)
           if ($shipCnt[$i] > 0)
              setVar $winDisp $winDisp &  "    " & $shipCnt[$i]& " -- " & $shipTypes[$i] & " -- " & $shipFigs[$i] & "*"
           end
           add $totalShip $shipFigs[$i]
           add $i 1
        end
        setVar $winDisp $winDisp &  "                         All Ships -- " & $totalShip & "*"
     else
        setVar $winDisp $winDisp &  "   No corporate ships are available*"
     end
  end
  setVar $winDisp $winDisp & "*"
  setWindowContents ProAssets $winDisp
  echo "**" ANSI_12 "Press any key to continue"
  getConsoleInput $inkey SINGLEKEY
halt

