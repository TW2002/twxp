:ppt~ppt




































gosub :playerinfo~infoquick

setvar $ppt~ore $playerinfo~ore
setvar $ppt~org $playerinfo~org
setvar $ppt~equip $playerinfo~equip
setvar $ppt~holds $playerinfo~holds
setvar $ppt~displayoff 0
setvar $ppt~aborted 0

if ($ppt~ore > 0)
  setvar $ppt~onhand "Fuel"
elseif ($ppt~org > 0)
  setvar $ppt~onhand "Organics"
elseif ($ppt~equip > 0)
  setvar $ppt~onhand "Equipment"
else
  setvar $ppt~onhand "None"
end

setvar $ppt~oneway 0


send "cr*r" $ppt~sectorb "*q"

waitfor "Commerce report for"
settextlinetrigger GETSELLPRODUCTA :GETSELLPRODUCTA $ppt~proda
settextlinetrigger GETBUYPRODUCTA :GETBUYPRODUCTA $ppt~prodb
settexttrigger GOTPRODUCTA :GOTPRODUCTA "Computer command"
pause
:ppt~getsellproducta
setvar $ppt~line CURRENTLINE
striptext $ppt~line "Ore"
getword $ppt~line $ppt~sellamounta 3
pause
:ppt~getbuyproducta
setvar $ppt~line CURRENTLINE
striptext $ppt~line "Ore"
getword $ppt~line $ppt~buyamounta 3
pause
:ppt~gotproducta

waiton "Commerce report for"
settextlinetrigger GETSELLPRODUCTB :GETSELLPRODUCTB $ppt~prodb
settextlinetrigger GETBUYPRODUCTB :GETBUYPRODUCTB $ppt~proda
settexttrigger GOTPRODUCTB :GOTPRODUCTB "Computer command"
pause
:ppt~getsellproductb
setvar $ppt~line CURRENTLINE
striptext $ppt~line "Ore"
getword $ppt~line $ppt~sellamountb 3
pause
:ppt~getbuyproductb
setvar $ppt~line CURRENTLINE
striptext $ppt~line "Ore"
getword $ppt~line $ppt~buyamountb 3
pause
:ppt~gotproductb


setvar $ppt~trade 100
setvar $ppt~x 100
multiply $ppt~x $ppt~holds
subtract $ppt~trade $ppt~perctrade
multiply $ppt~sellamounta $ppt~trade
multiply $ppt~sellamountb $ppt~trade
multiply $ppt~buyamounta $ppt~trade
multiply $ppt~buyamountb $ppt~trade
divide $ppt~sellamounta $ppt~x
divide $ppt~sellamountb $ppt~x
divide $ppt~buyamounta $ppt~x
divide $ppt~buyamountb $ppt~x

if ($haggle~hagglefactor = 0)
  setvar $ppt~clock 4
else
  setvar $ppt~clock 0
end

if (($ppt~sellamounta <= 1) or ($ppt~sellamountb <= 1) or ($ppt~buyamounta <= 1) or ($ppt~buyamountb <= 1))

  setvar $ppt~sector $ppt~sectora
  setvar $ppt~aborted 1
  return
end


if (($ppt~sectora <> STARDOCK) and ($ppt~sectora > 10))

  if ($ppt~dropfigs = 1)
    send "f1*ct"
  end

  send "jy"
end



setvar $ppt~firstrun 1
:ppt~porta


send "pt"
if ($haggle~hagglefactor = 0)

  if ($ppt~onhand <> "None")
    send "**"
  end
  if (($ppt~sellamounta <= 0) or ($ppt~buyamountb <= 0))
    if (PORT.CLASS[$ppt~sectora] < 8)
      send "0*"
    end
    if (PORT.CLASS[$ppt~sectora] > 3)
      send "0*"
    end
  else
    if (PORT.BUYFUEL[$ppt~sectora] = 0)
      if ($ppt~proda = "Fuel")
        send "**"
      else
        send "0*"
      end
    end
    if (PORT.BUYORG[$ppt~sectora] = 0)
      if ($ppt~proda = "Organics")
        send "**"
      else
        send "0*"
      end
    end
    if (PORT.BUYEQUIP[$ppt~sectora] = 0)
      if ($ppt~proda = "Equipment")
        send "**"
      else
        send "0*"
      end
    end

    setvar $ppt~onhand $ppt~proda
  end


  if ($ppt~clock > 0)
    waitfor "<Port>"
    waitfor "Command [TL="
    subtract $ppt~clock 1
  end
else


  if (($ppt~sellamounta <= 0) or ($ppt~buyamountb <= 0))
    setvar $haggle~buyprod "none"
  else
    setvar $haggle~buyprod $ppt~proda
  end
  setvar $haggle~sector $ppt~sectora
  gosub :haggle~haggle
  setvar $ppt~credits $haggle~credits
  if ($haggle~abort = 1)
    goto :PORTA
  end
end
subtract $ppt~buyamounta 1
subtract $ppt~sellamounta 1

if (($ppt~sellamounta <= "-1") or ($ppt~buyamountb <= "-1"))
  setvar $ppt~sector $ppt~sectora
  if (($haggle~hagglefactor = 0) and $ppt~displayoff)
    send "cn 9 qq"
  end

  return
end




if (($ppt~sectorb < 600) or (SECTORS > 5000))
  send $ppt~sectorb "*"
else
  send $ppt~sectorb
end

if ($ppt~firstrun = 1)
  setvar $ppt~firstrun 0

  if ($haggle~hagglefactor = 0)
    setvar $ppt~displayoff 1
    send "cn 9 qq"
  end

  if (($ppt~sectorb <> STARDOCK) and (($ppt~sectorb > 10) and ($ppt~dropfigs = 1)))
    send "f1*ct"
  end

  waiton "Warping to Sector "&$ppt~sectorb
  waiton "Command [TL="


  getdistance $ppt~distance $ppt~sectorb $ppt~sectora
  if ($ppt~distance = 1)
    goto :PORTB
  else



    if (($haggle~hagglefactor = 0) and $ppt~displayoff)
      send "cn 9 qq"
    end

    setvar $ppt~oneway 1
    setvar $ppt~sector $ppt~sectorb

    if (($ppt~sectorb > 10) and ($ppt~sectorb <> STARDOCK))
      send "jy"
    end
    return
  end
end
:ppt~portb

send "pt"
if ($haggle~hagglefactor = 0)

  if ($ppt~onhand <> "None")
    send "**"
  end
  if (($ppt~sellamountb <= 0) or ($ppt~buyamounta <= 0))
    if (PORT.CLASS[$ppt~sectorb] < 8)
      send "0*"
    end
    if (PORT.CLASS[$ppt~sectorb] > 3)
      send "0*"
    end
  else
    if (PORT.BUYFUEL[$ppt~sectorb] = 0)
      if ($ppt~prodb = "Fuel")
        send "**"
      else
        send "0*"
      end
    end
    if (PORT.BUYORG[$ppt~sectorb] = 0)
      if ($ppt~prodb = "Organics")
        send "**"
      else
        send "0*"
      end
    end
    if (PORT.BUYEQUIP[$ppt~sectorb] = 0)
      if ($ppt~prodb = "Equipment")
        send "**"
      else
        send "0*"
      end
    end

    setvar $ppt~onhand $ppt~prodb
  end



  if ($ppt~clock > 0)
    waitfor "<Port>"
    waitfor "Command [TL="
    subtract $ppt~clock 1
  end
else


  if (($ppt~sellamountb <= 0) or ($ppt~buyamounta <= 0))
    setvar $haggle~buyprod "none"
  else
    setvar $haggle~buyprod $ppt~prodb
  end
  setvar $haggle~sector $ppt~sectorb
  gosub :haggle~haggle
  setvar $ppt~credits $haggle~credits
  if ($haggle~abort = 1)
    goto :PORTB
  end
end

subtract $ppt~buyamountb 1
subtract $ppt~sellamountb 1

if (($ppt~sellamountb <= "-1") or ($ppt~buyamounta <= "-1"))
  if (($haggle~hagglefactor = 0) and $ppt~displayoff)
    send "cn 9 qq"
  end

  setvar $ppt~sector $ppt~sectorb
  return
end

if (($ppt~sectora < 600) or (SECTORS > 5000))
  send $ppt~sectora "*"
else
  send $ppt~sectora
end




goto :PORTA
:ppt~menu






addmenu $ppt~menu "PPT" "PPT Settings" "P" "" "PPT" FALSE
addmenu "PPT" "DropFigs" "Drop figs under ports" "F" ":MENU_DROPFIGS" "" FALSE
addmenu "PPT" "PercTrade" "Trade to % of max" "T" ":MENU_PERCTRADE" "" FALSE
addmenu "PPT" "Haggle" "Haggling" "H" ":MENU_HAGGLE" "" FALSE

setmenuhelp "Dropfigs" "If this option is enabled, the script will drop a toll fighter under every port it trades at."
setmenuhelp "PercTrade" "This option adjusts how far the script will trade a port down before it determines it to no longer be profitable."
setmenuhelp "Haggle" "If this option is enabled, the script will haggle every trade for best price."

gosub :SUB_SETMENU
return
:ppt~menu_dropfigs

if ($ppt~dropfigs)
  setvar $ppt~dropfigs 0
else
  setvar $ppt~dropfigs 1
end
savevar $ppt~dropfigs
gosub :SUB_SETMENU
openmenu "PPT"
:ppt~menu_perctrade

getinput $ppt~value "Enter % of max to trade to"
isnumber $ppt~test $ppt~value
if ($ppt~test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :MENU_PERCTRADE
end
if ($ppt~value > 100)
  echo ANSI_15 "**Bad percentage*"
  goto :MENU_PERCTRADE
end
setvar $ppt~perctrade $ppt~value
savevar $ppt~perctrade
gosub :SUB_SETMENU
openmenu "PPT"
:ppt~menu_haggle

if ($haggle~hagglefactor = 0)
  setvar $haggle~hagglefactor 7
else
  setvar $haggle~hagglefactor 0
end
savevar $haggle~hagglefactor
gosub :SUB_SETMENU
openmenu "PPT"
:ppt~sub_setmenu

if ($ppt~dropfigs)
  setmenuvalue "DropFigs" "ON"
else
  setmenuvalue "DropFigs" "OFF"
end

if ($haggle~hagglefactor > 0)
  setmenuvalue "Haggle" "ON"
else
  setmenuvalue "Haggle" "OFF"
end

setmenuvalue "PercTrade" $ppt~perctrade
return
