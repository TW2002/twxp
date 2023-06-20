# Copyright (C) 2005  Remco Mulder
# 
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
# 
# For source notes please refer to Notes.txt
# For license terms please refer to GPL.txt.
# 
# These files should be stored in the root of the compression you 
# received this source in.

# SUB:       TestSector
# Passed:    $Sector - Sector index to be tested
#             + Values set by subroutine setup submenu
# Triggered: Anywhere
# Completed: N/A
# Returned:  Match - "1" for sector passes test
#                    "0" for sector fails test

:TestSector
  # sys_check
  
  setVar $Match 1
  
  if ($Explored <> "")
    if ($Explored <> SECTOR.EXPLORED[$Sector])
      setVar $Match 0
      return
    end
  end
  
  if ($Fedspace <> "")
    if ($Sector <= 10) or (PORT.CLASS[$Sector] = 9)
      if ($Fedspace = "NO")
        setVar $Match 0
        return
      end
    else
      if ($Fedspace = "YES")
        setVar $Match 0
        return
      end
    end
  end
  
  if ($WarpsOut <> "")
    setVar $rangeList $WarpsOut
    setVar $value SECTOR.WARPCOUNT[$Sector]
    gosub :sub_CheckRange
    
    if ($valueMatch = 0)
      setVar $Match 0
      return
    end
  end
  
  if ($PortClass <> "")
    setVar $rangeList $PortClass
    setVar $value PORT.CLASS[$Sector]
    gosub :sub_CheckRange
    
    if ($valueMatch = 0)
      setVar $Match 0
      return
    end
  end
  
  if ($Planets <> "")
    setVar $i 1
    setVar $found 0
    while ($i <= SECTOR.PLANETCOUNT[$Sector])
      cutText SECTOR.PLANETS[$Sector][$i] $test 5 999
    
      if ($test = $Planets)
        setVar $found 1
      end
    
      add $i 1
    end
    
    if ($found = 0)
      setVar $Match 0
      return
    end
  end
  
  if ($PlanetsQuantity <> "")
    setVar $rangeList $PlanetsQuantity
    setVar $value SECTOR.PLANETCOUNT[$Sector]
    gosub :sub_CheckRange
    
    if ($valueMatch = 0)
      setVar $Match 0
      return
    end
  end
  
  if ($Traders <> "")
    setVar $i 1
    setVar $found 0
    while ($i <= SECTOR.TRADERCOUNT[$Sector])
      cutText SECTOR.TRADERS[$Sector][$i] $test 5 999
    
      if ($test = $Traders)
        setVar $found 1
      end
    
      add $i 1
    end
    
    if ($found = 0)
      setVar $Match 0
      return
    end
  end
  
  if ($TradersQuantity <> "")
    setVar $rangeList $TradersQuantity
    setVar $value SECTOR.TRADERCOUNT[$Sector]
    gosub :sub_CheckRange
    
    if ($valueMatch = 0)
      setVar $Match 0
      return
    end
  end
  
  if ($Ships <> "")
    setVar $i 1
    setVar $found 0
    while ($i <= SECTOR.SHIPCOUNT[$Sector])
      cutText SECTOR.SHIPS[$Sector][$i] $test 5 999
    
      if ($test = $Ships)
        setVar $found 1
      end
    
      add $i 1
    end
    
    if ($found = 0)
      setVar $Match 0
      return
    end
  end
  
  if ($ShipsQuantity <> "")
    setVar $rangeList $ShipsQuantity
    setVar $value SECTOR.SHIPCOUNT[$Sector]
    gosub :sub_CheckRange
    
    if ($valueMatch = 0)
      setVar $Match 0
      return
    end
  end
  
  if ($Mines <> "")
    if (SECTOR.MINES.OWNER <> $Mines)
      setVar $Match 0
      return
    end
  end
  
  if ($MinesQuantity <> "")
    setVar $rangeList $MinesQuantity
    setVar $value SECTOR.MINES.QUANTITY[$Sector]
    gosub :sub_CheckRange
    
    if ($valueMatch = 0)
      setVar $Match 0
      return
    end
  end
  
  if ($Figs <> "")
    if (SECTOR.FIGS.OWNER <> $Figs)
      setVar $Match 0
      return
    end
  end
  
  if ($FigsQuantity <> "")
    setVar $rangeList $FigsQuantity
    setVar $value SECTOR.FIGS.QUANTITY[$Sector]
    gosub :sub_CheckRange
    
    if ($valueMatch = 0)
      setVar $Match 0
      return
    end
  end
  
  if ($Beacon <> "")
    if (SECTOR.BEACON[$Sector] <> $Beacon)
      setVar $Match 0
      return
    end
  end
  
  if ($Navhaz <> "")
    setVar $rangeList $Navhaz
    setVar $value SECTOR.NAVHAZ[$Sector]
    gosub :sub_CheckRange
    
    if ($valueMatch = 0)
      setVar $Match 0
      return
    end
  end
  
  if ($Density <> "")
    setVar $rangeList $Density
    setVar $value SECTOR.DENSITY[$Sector]
    gosub :sub_CheckRange
    
    if ($valueMatch = 0)
      setVar $Match 0
      return
    end
  end
  
  if ($NoBackdoors <> "")
    if (SECTOR.BACKDOORCOUNT > 0)
      if ($NoBackdoors = "NO")
        setVar $Match 0
        return
      end
    else
      if ($NoBackdoors = "YES")
        setVar $Match 0
        return
      end
    end
  end
  
  return


:sub_CheckRange
  # check to see if $value fits into $rangeList
  setVar $valueMatch 0
  replaceText $rangeList "," " "
  
  setVar $i 1
  getWord $rangeList $word $i ""
  
  while ($word <> "")
    getWordPos $word $pos "-"
    
    if ($pos > 0)
      # its a range
      cutText $word $rangeStart 1 ($pos - 1)
      cutText $word $rangeEnd ($pos + 1) 999
      
      if ($rangeEnd < $rangeStart)
        setVar $x $rangeStart
        setVar $rangeStart $rangeEnd
        setVar $rangeEnd $x
      end
      
      if ($value >= $rangeStart) and ($value <= $rangeEnd)
        setVar $valueMatch 1
        return
      end
    else
      # its just a value
      if ($value = $word)
        setVar $valueMatch 1
        return
      end
    end
    
    add $i 1
    getWord $rangeList $word $i ""
  end

  return

  
# SUB:       Menu
# Purpose:   Creates subroutine setup submenu
# Passed:    $Menu - Name of parent menu
#            $Title - Submenu title

:Menu
  addMenu $Menu "TestSector" $Title "I" "" "Sector" FALSE
  addMenu "TestSector" "Explored" "Explored" "E" "" "Explored" FALSE
  addMenu "TestSector" "Fedspace" "Fedspace sector" "F" "" "Fedspace" FALSE
  addMenu "TestSector" "WarpsOut" "Warps out" "W" :Menu_WarpsOut "Warps Out" FALSE
  addMenu "TestSector" "PortClass" "Port class" "P" :Menu_PortClass "Port Class" FALSE
  addMenu "TestSector" "Planets" "Planets" "L" "" "Planets" FALSE
  addMenu "TestSector" "Traders" "Traders" "T" "" "Traders" FALSE
  addMenu "TestSector" "Ships" "Ships" "H" "" "Ships" FALSE
  addMenu "TestSector" "Mines" "Mines" "M" "" "Mines" FALSE
  addMenu "TestSector" "Figs" "Fighters" "G" "" "Figs" FALSE
  addMenu "TestSector" "Beacon" "Beacon" "B" :Menu_Beacon "" FALSE
  addMenu "TestSector" "Navhaz" "Navhaz" "N" :Menu_Navhaz "Navhaz" FALSE
  addMenu "TestSector" "Density" "Density" "D" :Menu_Density "Density" FALSE
  addMenu "TestSector" "NoBackdoors" "No backdoors" "K" "" "" FALSE
  
  addMenu "Explored" "Explored_NotTested" "Don't care" "0" :Menu_Explored_NotTested "" FALSE
  addMenu "Explored" "Explored_Yes" "Yes" "1" :Menu_Explored_Yes "" FALSE
  addMenu "Explored" "Explored_No" "No" "2" :Menu_Explored_No "" FALSE
  addMenu "Explored" "Explored_Density" "Density scanned" "3" :Menu_Explored_Density "" FALSE
  addMenu "Explored" "Explored_Calc" "Warp calculated" "4" :Menu_Explored_Calc "" FALSE
  
  setVar $mnu "Fedspace"
  gosub :sub_SetBooleanMenu
  
  setVar $mnu "Planets"
  gosub :sub_SetTextMenu
  
  setVar $mnu "Traders"
  gosub :sub_SetTextMenu
  
  setVar $mnu "Ships"
  gosub :sub_SetTextMenu
  
  setVar $mnu "Mines"
  gosub :sub_SetTextMenu
  
  setVar $mnu "Figs"
  gosub :sub_SetTextMenu
  
  setVar $mnu "NoBackdoors"
  gosub :sub_SetBooleanMenu    
  
  gosub :sub_SetMenu
  return
  
  :Menu_WarpsOut
  getInput $WarpsOut "Enter a series of values or ranges, separated by commas (i.e. '1-3,5'), or blank to not test"
  saveVar $WarpsOut
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_PortClass
  getInput $PortClass "Enter a series of values or ranges, separated by commas (i.e. '1-3,5'), or blank to not test"
  saveVar $PortClass
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Beacon
  getInput $Beacon "Enter beacon text, or blank to not test"
  saveVar $Beacon
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Navhaz
  getInput $Navhaz "Enter a series of values or ranges, separated by commas (i.e. '1-30,50'), or blank to not test"
  saveVar $Navhaz
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Density
  getInput $Density "Enter a series of values or ranges, separated by commas (i.e. '100-300,5000'), or blank to not test"
  saveVar $Density
  gosub :sub_SetMenu
  openMenu "TestSector"  

  :Menu_Explored_NotTested
  setVar $Explored ""
  saveVar $Explored
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Explored_Yes
  setVar $Explored "YES"
  saveVar $Explored
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Explored_No
  setVar $Explored "NO"
  saveVar $Explored
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Explored_Density
  setVar $Explored "DENSITY"
  saveVar $Explored
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Explored_Calc
  setVar $Explored "CALC"
  saveVar $Explored
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Fedspace_NotTested
  setVar $Fedspace ""
  saveVar $Fedspace
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Fedspace_Yes
  setVar $Fedspace "YES"
  saveVar $Fedspace
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Fedspace_No
  setVar $Fedspace "NO"
  saveVar $Fedspace
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Planets_NotTested
  setVar $Planets ""
  setVar $PlanetsQuantity ""
  saveVar $Planets
  saveVar $PlanetsQuantity
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Planets_Quantity
  getInput $PlanetsQuantity "Enter a series of values or ranges, separated by commas (i.e. '1-3,5,8')"
  saveVar $PlanetsQuantity
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Planets_Name
  getInput $Planets "Enter a planet name"
  saveVar $Planets
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Traders_NotTested
  setVar $Traders ""
  setVar $TradersQuantity ""
  saveVar $Traders
  saveVar $TradersQuantity
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Traders_Quantity
  getInput $TradersQuantity "Enter a series of values or ranges, separated by commas (i.e. '1-3,5,8')"
  saveVar $TradersQuantity
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Traders_Name
  getInput $Traders "Enter a trader name"
  saveVar $Traders
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Ships_NotTested
  setVar $Ships ""
  setVar $ShipsQuantity ""
  saveVar $Ships
  saveVar $ShipsQuantity
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Ships_Quantity
  getInput $ShipsQuantity "Enter a series of values or ranges, separated by commas (i.e. '1-3,5,8')"
  saveVar $ShipsQuantity
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Ships_Name
  getInput $Ships "Enter a ship's name"
  saveVar $Ships
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Mines_NotTested
  setVar $Mines ""
  setVar $MinesQuantity ""
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Mines_Quantity
  getInput $MinesQuantity "Enter a series of values or ranges, separated by commas (i.e. '1-3,5,8')"
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Mines_Name
  getInput $Mines "Enter an owner for the mines"
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Figs_NotTested
  setVar $Figs ""
  setVar $FigsQuantity ""
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Figs_Quantity
  getInput $FigsQuantity "Enter a series of values or ranges, separated by commas (i.e. '1-3,5,8')"
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_Figs_Name
  getInput $Figs "Enter an owner for the fighters"
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_NoBackdoors_NotTested
  setVar $NoBackdoors ""
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_NoBackdoors_Yes
  setVar $NoBackdoors "YES"
  gosub :sub_SetMenu
  openMenu "TestSector"
  
  :Menu_NoBackdoors_No
  setVar $NoBackdoors "NO"
  gosub :sub_SetMenu
  openMenu "TestSector"
  

:sub_SetMenu
  setMenuValue "Explored" $Explored
  setMenuValue "Fedspace" $Fedspace
  setMenuValue "WarpsOut" $WarpsOut
  setMenuValue "PortClass" $PortClass
  
  if ($Planets = "") and ($PlanetsQuantity = "")
    setMenuValue "Planets" ""
  else
    setMenuValue "Planets" $Planets & ";" & $PlanetsQuantity
  end
  
  if ($Traders = "") and ($TradersQuantity = "")
    setMenuValue "Traders" ""
  else
    setMenuValue "Traders" $Traders & ";" & $TradersQuantity
  end
  
  if ($Ships = "") and ($ShipsQuantity = "")
    setMenuValue "Ships" ""
  else
    setMenuValue "Ships" $Ships & ";" & $ShipsQuantity
  end
  
  if ($Mines = "") and ($MinesQuantity = "")
    setMenuValue "Mines" ""
  else
    setMenuValue "Mines" $Mines & ";" & $MinesQuantity
  end
  
  if ($Figs = "") and ($FigsQuantity = "")
    setMenuValue "Figs" ""
  else
    setMenuValue "Figs" $Figs & ";" & $FigsQuantity
  end
  
  setMenuValue "Beacon" $Beacon
  setMenuValue "Navhaz" $Navhaz
  setMenuValue "Density" $Density
  setMenuValue "NoBackdoors" $NoBackdoors  

  return
 
  
:sub_SetBooleanMenu
  # set $mnu up as a boolean menu
  addMenu $mnu "Menu_Boolean_NotTested" "Don't care" "0" ":Menu_" & $mnu & "_NotTested" "" FALSE
  addMenu $mnu "Menu_Boolean_Yes" "Yes" "Y" ":Menu_" & $mnu & "_Yes" "" FALSE
  addMenu $mnu "Menu_Boolean_No" "No" "N" ":Menu_" & $mnu & "_No" "" FALSE
  return
  
:sub_SetTextMenu
  # set $mnu up as a text menu
  addMenu $mnu "Menu_Text_NotTested" "Don't care" "0" ":Menu_" & $mnu & "_NotTested" "" FALSE
  addMenu $mnu "Menu_Text_Quantity" "Quantity" "U" ":Menu_" & $mnu & "_Quantity" "" FALSE
  addMenu $mnu "Menu_Text_Name" "Name" "N" ":Menu_" & $mnu & "_Name" "" FALSE
  return

  
# SUB:       SetMenuDefaults
# Purpose:   Sets default menu values

:SetMenuDefaults
  loadVar $Saved
  
  if ($Saved)
    loadVar $Explored
    loadVar $Fedspace
    loadVar $WarpsOut
    loadVar $PortClass 
    loadVar $Planets 
    loadVar $PlanetsQuantity 
    loadVar $Traders 
    loadVar $TradersQuantity 
    loadVar $Ships 
    loadVar $ShipsQuantity 
    loadVar $Mines 
    loadVar $MinesQuantity 
    loadVar $Figs 
    loadVar $FigsQuantity 
    loadVar $Beacon 
    loadVar $Navhaz 
    loadVar $Density 
    loadVar $NoBackdoors 
  else
    setVar $Explored ""
    setVar $Fedspace ""
    setVar $WarpsOut ""
    setVar $PortClass ""
    setVar $Planets ""
    setVar $PlanetsQuantity ""
    setVar $Traders ""
    setVar $TradersQuantity ""
    setVar $Ships ""
    setVar $ShipsQuantity ""
    setVar $Mines ""
    setVar $MinesQuantity ""
    setVar $Figs ""
    setVar $FigsQuantity ""
    setVar $Beacon ""
    setVar $Navhaz ""
    setVar $Density ""
    setVar $NoBackdoors ""
    
    saveVar $Explored
    saveVar $Fedspace
    saveVar $WarpsOut
    saveVar $PortClass 
    saveVar $Planets 
    saveVar $PlanetsQuantity 
    saveVar $Traders 
    saveVar $TradersQuantity 
    saveVar $Ships 
    saveVar $ShipsQuantity 
    saveVar $Mines 
    saveVar $MinesQuantity 
    saveVar $Figs 
    saveVar $FigsQuantity 
    saveVar $Beacon 
    saveVar $Navhaz 
    saveVar $Density 
    saveVar $NoBackdoors 
    
    setVar $Saved 1
    saveVar $Saved
  end
  
  return
