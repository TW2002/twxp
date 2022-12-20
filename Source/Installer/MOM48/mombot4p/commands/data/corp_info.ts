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

gosub :BOT~loadVars
setVar $i 0
setVar $myCount 0
setVar $numFig 0
setArray $cits 7
setVar $resetCN9 0
setVar $cBarLen 25
setVar $shipTypes "All"
setVar $minesDeployed "Yes"
setVar $baseDetails "Yes"
setVar $baseID "Sector"
setVar $output "SubSpace"
setVar $totalBaseFighters 0


		setVar $shipTypes "All"
		setVar $minesDeployed "Yes"
		setVar $baseDetails "Yes"
		setVar $output "SubSpace"



setVar $bot~validPrompts "Citadel Planet Command"
gosub :bot~checkStartingPrompt
if (($PLAYER~startingLocation = "Citadel") or ($PLAYER~startingLocation = "Planet"))
	send " q "
	gosub :PLANET~getPlanetInfo
	send " q "
end


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
	add $player~limpetsectors 1
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
setvar $switchboard~message "<--------------------- Corporate Assets Report --------------------->*"
setvar $switchboard~message $switchboard~message&" *"
setvar $switchboard~message $switchboard~message&" ------------------ *"
setvar $switchboard~message $switchboard~message&" Deployed Fighters *"
setvar $switchboard~message $switchboard~message&" ------------------*"
setvar $switchboard~message $switchboard~message&"  "&$mycount&" of "&$mySectors&" Sectors - "&$tmp&"% Coverage*"
setvar $switchboard~message $switchboard~message&"  "&$numFig&" Total Fighters Deployed*"
if ($minesDeployed = "Yes")
   setvar $switchboard~message $switchboard~message&" *"
   setvar $switchboard~message $switchboard~message&" ------------------ *"
   setvar $switchboard~message $switchboard~message&" Mines Deployed  *"
   setvar $switchboard~message $switchboard~message&" ------------------*"
   setvar $switchboard~message $switchboard~message&"  Limpet mines in "&$player~limpetsectors&" sectors totaling "&$limpetTotal&" mines.*"
   setvar $switchboard~message $switchboard~message&"  Aramid mines in "&$aramidSectors&" sectors totaling "&$aramidTotal&" mines.*"
end
setvar $switchboard~message $switchboard~message&" *"
setvar $switchboard~message $switchboard~message&" ------------------ *"
if ($baseDetails = "Yes")
   setvar $switchboard~message $switchboard~message&" Detail"
end
setvar $switchboard~message $switchboard~message&" Base Status  *"
setvar $switchboard~message $switchboard~message&" ------------------*"


if ($baseDetails = "Yes")
   setvar $switchboard~message $switchboard~message&" Base     Planets   Status     Cit Levels      Figs     Credits*"
else
   setvar $switchboard~message $switchboard~message&" Base     Planets   Status       Base     Planets   Status*"
end
  setVar $plCnt 0
  setVar $plntCnt 0
  setVar $i 11
  while ($i < SECTORS)
	   if ($planet~planets[$i] > 0)
		  add $plntCnt 1
		  add $plCnt 1
		  setVar $padit 6
		  if ($baseID = "Base")
			 SetVar $inStr $plCnt
			 gosub :padLeft
			 setvar $switchboard~message $switchboard~message&"  "&$padL&$plCnt&"    "&$planet~planets[$i]
		  else
			 setVar $instr $i
			 gosub :padLeft
			 setvar $switchboard~message $switchboard~message&"  "&$padL&$i&"    "&$planet~planets[$i]
		  end
		  if ($planet~planets[$i] > $maxPlanets)
			 setvar $switchboard~message $switchboard~message&"    OVERLOADED"
		  else
			 setvar $switchboard~message $switchboard~message&"    Checked Ok"
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
			  setVar $padit 5
			  gosub :padLeft
				setvar $switchboard~message $switchboard~message&"    "&$baseDetail[$i]&$basefig&$padL&$citCash
				setvar $switchboard~message $switchboard~message&"*"
			  setVar $plntCnt 0
		  end
	   end
	   if ($plntCnt = 2)
			setvar $switchboard~message $switchboard~message&"*"
			setVar $plntCnt 0
	   end
	   add $i 1
  end
  if ($plCnt = 0)
	 setvar $switchboard~message $switchboard~message&"               No Planets Found for your Corp*"
  else
	 setvar $switchboard~message $switchboard~message&" *"
	 setvar $switchboard~message $switchboard~message&" *"
	 setvar $switchboard~message $switchboard~message&" ------------------ *"
	 setvar $switchboard~message $switchboard~message&" Citadel Status*"
	 setvar $switchboard~message $switchboard~message&" ------------------ *"
	 setvar $switchboard~message $switchboard~message&"   Lvl 0   Lvl 1   Lvl 2   Lvl 3   Lvl 4   Lvl 5   Lvl 6*"
	 setvar $switchboard~message $switchboard~message&"     "&$cits[1]
	 setvar $switchboard~message $switchboard~message&"       "&$cits[2]
	 setvar $switchboard~message $switchboard~message&"       "&$cits[3]
	 setvar $switchboard~message $switchboard~message&"       "&$cits[4]
	 setvar $switchboard~message $switchboard~message&"       "&$cits[5]
	 setvar $switchboard~message $switchboard~message&"       "&$cits[6]
	 setvar $switchboard~message $switchboard~message&"       "&$cits[7]&"*"
	 setvar $switchboard~message $switchboard~message&" *"
	 setvar $switchboard~message $switchboard~message&" ------------------ *"
	 setvar $switchboard~message $switchboard~message&" Planet Assets*"
	 setvar $switchboard~message $switchboard~message&" ------------------ *"
	 setvar $switchboard~message $switchboard~message&"                Ore  Org  Equ   Ore   Org   Equ   Fighters*"
	 setvar $switchboard~message $switchboard~message&"Population     -=Productions=-  -=-=-=-=-On Hands-=-=-=-=-    Credits*"
	 setvar $switchboard~message $switchboard~message&$bott&"*"
	 setvar $switchboard~message $switchboard~message&" *"
	 setvar $switchboard~message $switchboard~message&" ------------------ *"
	 setvar $switchboard~message $switchboard~message&" Available Ships*"
	 setvar $switchboard~message $switchboard~message&" ------------------ *"
	 setvar $switchboard~message $switchboard~message&"   Cnt   Type                      Total Figs*"
	 setVar $i 1
	 setVar $totalShip 0
	 if ($shipCnt[1] > 0)
		while ($i <= 20)
		   if ($shipCnt[$i] > 0)
			  setvar $switchboard~message $switchboard~message&"    "&$shipCnt[$i]&" -- "&$shipTypes[$i]&" -- "&$shipFigs[$i]&"*"
		   end
		   add $totalShip $shipFigs[$i]
		   add $i 1
		end
		setvar $switchboard~message $switchboard~message&"                      All Ships -- "&$totalShip&"*"
	 else
		setvar $switchboard~message $switchboard~message&"   No corporate ships are available*"
	 end
  end
	 setvar $switchboard~message $switchboard~message&" *"
	 setvar $switchboard~message $switchboard~message&" -------------------- *"
	 setvar $switchboard~message $switchboard~message&" Corp Assets vs Game *"
	 setvar $switchboard~message $switchboard~message&" -------------------- *"
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
		setvar $switchboard~message $switchboard~message&" ! Fighters on unmanned ships do not count for game totals !*"
	 end
	 setVar $instr $totalCorpFigs
	 setVar $padit 16
	 gosub :padLeft
	 setvar $switchboard~message $switchboard~message&" Corp fighters: "&$totalCorpFigs&" ("&(($totalCorpFigs*100)/$gameFighters)&"%)"&$padL&"Game fighters:  "&$gameFighters&"*"
	 setvar $switchboard~message $switchboard~message&" Corp planets: "
	 setVar $i 1
	 setVar $player~corpPlanets 0
	 setVar $player~corpCits 0
	 while ($i <= 7)
		   add $player~corpPlanets $cits[$i]
		   add $i 1
	 end
	 setVar $i 2
	 while ($i <= 7)
		   add $player~corpCits $cits[$i]
		   add $i 1
	 end
	 setvar $switchboard~message $switchboard~message&$player~corpPlanets&" ("&$player~corpCits&") Citadels    Game planets: "&$gamePlanets&" ("&$gameCitadels&") Citadels*"

  setvar $switchboard~message $switchboard~message&" *"
  setvar $switchboard~message $switchboard~message&"<--------------------------- Promethius ---------------------------->*"
  setvar $switchboard~message $switchboard~message&"*"
  gosub :switchboard~switchboard

  	killalltriggers
	if (($player~startinglocation = "Citadel") or ($player~startinglocation = "Planet"))
		gosub :planet~landingsub
	end

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
setArray $planet~planets SECTORS
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
 add $planet~planets[$plSector] 1
 if ($planet~planets[$plSector] = 1)
	setVar $baseDetail[$plSector] ""
 end
 cuttext CURRENTLINE $cit 77 1
 if ($cit = "l")
	 add $cits[1] 1
	 setVar $planet~planetCits "0"
 else
	 setVar $planet~planetCits $cit
	 add $cit 1
	 add $cits[$cit] 1
 end
 setVar $baseDetail[$plSector] $baseDetail[$plSector] & " " & $planet~planetCits
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
   setVar $winDisp $winDisp &  "  Limpet mines in " & $player~limpetsectors & " sectors totaling " & $limpetTotal & " mines.*"
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
	   if ($planet~planets[$i] > 0)
		  add $plntCnt 1
		  add $plCnt 1
		  setVar $padit 10
		  if ($baseID = "Base")
			 SetVar $inStr $plCnt
			 gosub :padLeft
			 setVar $winDisp $winDisp & "  " & $padL & $plCnt & "        " & $planet~planets[$i]
		  else
			 setVar $instr $i
			 gosub :padLeft
			 setVar $winDisp $winDisp &  "  " & $padL & $i & "        " & $planet~planets[$i]
		  end
		  if ($planet~planets[$i] > $maxPlanets)
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

#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\bot_includes\switchboard"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\player\currentprompt\player"
include "source\module_includes\bot\checkstartingprompt\bot"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\planet\landingsub\planet"

