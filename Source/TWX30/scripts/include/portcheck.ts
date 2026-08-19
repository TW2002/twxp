:portcheck~portcheck











































setvar $portcheck~pair 0
setvar $portcheck~figged 0

if ($portcheck~porttype = 1)
  if ((PORT.CLASS[$portcheck~sector] < 1) or (PORT.CLASS[$portcheck~sector] > 8))

    setvar $portcheck~ignore 0
    return
  end
else
  if (PORT.BUYEQUIP[$portcheck~sector] = 0)

    setvar $portcheck~ignore 0
    return
  end
end

if ($portcheck~scanned = 0)

  send "sd"
  waiton "Relative Density Scan"
  waiton "Command [TL="
  setvar $portcheck~scanned 1
end

if ($portcheck~scanned = 1)

  setvar $portcheck~holoscan 0
  setvar $portcheck~i 1

  while ($portcheck~i <= SECTOR.WARPCOUNT[$portcheck~sector])
    setvar $portcheck~sect SECTOR.WARPS[$portcheck~sector][$portcheck~i]

    if ((PORT.CLASS[$portcheck~sect] > 0) or (SECTOR.DENSITY[$portcheck~sect] >= 100))
      setvar $portcheck~holoscan 1
    end

    add $portcheck~i 1
  end

  if ($portcheck~holoscan)
    send "sh"
    waiton "Long Range Scan"
    waiton "Command [TL="
    setvar $portcheck~scanned 2
  end
end

if ($portcheck~scanned = 2)

  setvar $portcheck~i 1
  setvar $portcheck~class PORT.CLASS[$portcheck~sector]
  setvar $portcheck~tradeproda ""
  setvar $portcheck~tradeprodb ""

  while (($portcheck~i <= SECTOR.WARPCOUNT[$portcheck~sector]) and ($portcheck~tradeproda = ""))
    setvar $portcheck~sect SECTOR.WARPS[$portcheck~sector][$portcheck~i]
    setvar $portcheck~pairclass PORT.CLASS[$portcheck~sect]

    if (($portcheck~pairclass > 0) and ((($portcheck~pairclass < 9) and ((((SECTOR.FIGS.QUANTITY[$portcheck~sect] = 0) or (SECTOR.FIGS.OWNER[$portcheck~sect] = "yours") or (SECTOR.FIGS.OWNER[$portcheck~sect] = "belong to your Corp") or (($portcheck~danger = 1) and ($portcheck~sector.figs.quantity[$portcheck~sect] <= 20)) or ($portcheck~danger = 2)) and ((((SECTOR.MINES.QUANTITY[$portcheck~sect] = 0) or (SECTOR.MINES.OWNER[$portcheck~sect] = "yours") or (SECTOR.MINES.OWNER[$portcheck~sect] = "belong to your Corp") or (($portcheck~danger = 1) and ($portcheck~sector.mines.quantity[$portcheck~sect] <= 5)) or ($portcheck~danger = 2)) and ((((SECTOR.NAVHAZ[$portcheck~sect] = 0) or ((SECTOR.NAVHAZ[$portcheck~sect] <= 3) and ($portcheck~danger = 1)) or ($portcheck~danger = 2)) and ((((SECTOR.PLANETCOUNT[$portcheck~sect] = 0) or ($portcheck~danger = 2)) and ((SECTOR.TRADERCOUNT[$portcheck~sect] = 0) or ($portcheck~danger = 2)))))))))))))

      if ($portcheck~porttype = 1)
        gosub :SUB_PPTCHECK
      else
        if (PORT.BUYEQUIP[$portcheck~sect])
          setvar $portcheck~tradeproda "Equipment"
        end
      end

      if ($portcheck~tradeproda <> "")
        subtract $portcheck~ignore 1

        if ($portcheck~ignore >= 0)
          setvar $portcheck~tradeproda ""
          setvar $portcheck~tradeprodb ""
        else
          setvar $portcheck~pair $portcheck~sect
        end
      end
    end

    add $portcheck~i 1
  end
end

setvar $portcheck~ignore 0

return
:portcheck~sub_pptcheck


if (($portcheck~class = 1) and ($portcheck~pairclass = 2))
  setvar $portcheck~tradeproda "Equipment"
  setvar $portcheck~tradeprodb "Organics"
end
if (($portcheck~class = 1) and ($portcheck~pairclass = 3))
  setvar $portcheck~tradeproda "Equipment"
  setvar $portcheck~tradeprodb "Fuel"
end
if (($portcheck~class = 1) and ($portcheck~pairclass = 4))
  setvar $portcheck~tradeproda "Equipment"
  setvar $portcheck~tradeprodb "Organics"
end
if (($portcheck~class = 2) and ($portcheck~pairclass = 1))
  setvar $portcheck~tradeproda "Organics"
  setvar $portcheck~tradeprodb "Equipment"
end
if (($portcheck~class = 2) and (($portcheck~pairclass = 3) and $portcheck~fuelorganics))
  setvar $portcheck~tradeproda "Organics"
  setvar $portcheck~tradeprodb "Fuel"
end
if (($portcheck~class = 2) and ($portcheck~pairclass = 5))
  setvar $portcheck~tradeproda "Organics"
  setvar $portcheck~tradeprodb "Equipment"
end
if (($portcheck~class = 3) and ($portcheck~pairclass = 1))
  setvar $portcheck~tradeproda "Fuel"
  setvar $portcheck~tradeprodb "Equipment"
end
if (($portcheck~class = 3) and (($portcheck~pairclass = 2) and $portcheck~fuelorganics))
  setvar $portcheck~tradeproda "Fuel"
  setvar $portcheck~tradeprodb "Organics"
end
if (($portcheck~class = 3) and ($portcheck~pairclass = 6))
  setvar $portcheck~tradeproda "Fuel"
  setvar $portcheck~tradeprodb "Equipment"
end
if (($portcheck~class = 4) and ($portcheck~pairclass = 1))
  setvar $portcheck~tradeproda "Organics"
  setvar $portcheck~tradeprodb "Equipment"
end
if (($portcheck~class = 4) and ($portcheck~pairclass = 5))
  setvar $portcheck~tradeproda "Organics"
  setvar $portcheck~tradeprodb "Equipment"
end
if (($portcheck~class = 4) and ($portcheck~pairclass = 6))
  setvar $portcheck~tradeproda "Fuel"
  setvar $portcheck~tradeprodb "Equipment"
end
if (($portcheck~class = 5) and ($portcheck~pairclass = 2))
  setvar $portcheck~tradeproda "Equipment"
  setvar $portcheck~tradeprodb "Organics"
end
if (($portcheck~class = 5) and ($portcheck~pairclass = 4))
  setvar $portcheck~tradeproda "Equipment"
  setvar $portcheck~tradeprodb "Organics"
end
if (($portcheck~class = 5) and (($portcheck~pairclass = 6) and $portcheck~fuelorganics))
  setvar $portcheck~tradeproda "Fuel"
  setvar $portcheck~tradeprodb "Organics"
end
if (($portcheck~class = 6) and ($portcheck~pairclass = 3))
  setvar $portcheck~tradeproda "Equipment"
  setvar $portcheck~tradeprodb "Fuel"
end
if (($portcheck~class = 6) and ($portcheck~pairclass = 4))
  setvar $portcheck~tradeproda "Equipment"
  setvar $portcheck~tradeprodb "Fuel"
end
if (($portcheck~class = 6) and (($portcheck~pairclass = 5) and $portcheck~fuelorganics))
  setvar $portcheck~tradeproda "Organics"
  setvar $portcheck~tradeprodb "Fuel"
end

return
:portcheck~menu





if ($portcheck~porttype = 1)
  setvar $portcheck~portmenu "PPT"
  addmenu "PPT" "FuelOrganics" "Trade fuel/organics" "R" ":MENU_FUELORGANICS" "" FALSE
  setmenuhelp "FuelOrganics" "If this option is enabled, the script will trade fuel/organics where this combination is available."
else
  setvar $portcheck~portmenu "SSM"
end



gosub :SUB_SETMENU
return
:portcheck~menu_danger

if ($portcheck~danger = 2)
  setvar $portcheck~danger 0
else
  add $portcheck~danger 1
end
savevar $portcheck~danger
gosub :SUB_SETMENU
openmenu $portcheck~portmenu
:portcheck~menu_fuelorganics

if ($portcheck~fuelorganics)
  setvar $portcheck~fuelorganics 0
else
  setvar $portcheck~fuelorganics 1
end
savevar $portcheck~fuelorganics
gosub :SUB_SETMENU
openmenu $portcheck~portmenu
:portcheck~sub_setmenu

if ($portcheck~porttype = 1)
  if ($portcheck~fuelorganics)
    setmenuvalue "FuelOrganics" "ON"
  else
    setmenuvalue "FuelOrganics" "OFF"
  end
end


return

if ($portcheck~danger = 0)
  setmenuvalue "Danger" "PARANOID"
elseif ($portcheck~danger = 1)
  setmenuvalue "Danger" "STANDARD"
else
  setmenuvalue "Danger" "RECKLESS"
end

return
