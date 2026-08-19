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

# SUB:       SSM
# Passed:    $SellSteal~stealFactor - steal factor
#            $Haggle~HaggleFactor - haggle factor for sell
#            $OtherSector - sector to SSM to
#            $DropFigs - "1" to drop/clear figs in opposite sector when starting run
# Returned:  $HoldsLost - Holds lost on completion of run
#            $Sector - Sector finished in
# Triggered: Sector command prompt

:SSM
  # sys_check
  
  # set game prefs to requirements
  setVar $GamePrefs~Bank "SSM"
  setVar $GamePrefs~Animation[$GamePrefs~Bank] OFF
  setVar $GamePrefs~AbortDisplayAll[$GamePrefs~Bank] OFF
  setVar $GamePrefs~ScreenPauses[$GamePrefs~Bank] OFF
  gosub :GamePrefs~SetGamePrefs
  
  # get player details
  gosub :PlayerInfo~InfoQuick
  
  setVar $SellSteal~Experience $PlayerInfo~Experience
  setVar $firstRun 1
  setVar $sector 1
  setVar $sector[1] $PlayerInfo~Sector
  setVar $sector[2] $OtherSector
  setVar $SellSteal~ShipHolds[1] 0
  setVar $SellSteal~ShipHolds[2] 0
  
  :cycle
  setVar $SellSteal~Sector $sector[$sector]
  setVar $Haggle~Sector $sector[$sector]
  setVar $SellSteal~PortClass PORT.CLASS[$sector[$sector]]
  gosub :SellSteal~SellSteal
  
  if ($SellSteal~Success = "0")
    setVar $HoldsLost $SellSteal~HoldsLost
    setVar $Sector $sector[$sector]
    return
  elseif ($SellSteal~Success = "2")
    setVar $HoldsLost 0
    setVar $Sector $sector[$sector]
    return
  end
  
  if ($sector = "1")
    setVar $sector "2"
  else
    setVar $sector "1"
  end
  
  if ($firstRun) 
    if (PORT.CLASS[$sector] < 9) and ($sector > 10)
      if ($DropFigs)
        send "f1*ct" & $sector[$sector] "*at999**f1*ct"
      else
        send $sector[$sector] "*at999**"
      end
    else
      send $sector[$sector] "*"
    end
    
    setVar $firstRun 0
  else
    if ($sector[$sector] < 600) or (SECTORS > 5000)
      send $sector[$sector] "*"
    else
      send $sector[$sector]
    end
  end
  
  goto :cycle


# SUB:       Menu
# Purpose:   Creates subroutine setup submenu
# Passed:    $Menu - Name of parent menu

:Menu
  addMenu $Menu "SSM" "SSM Settings" "S" "" "PPT" FALSE
  addMenu "SSM" "DropFigs" "Drop figs under ports" "F" :Menu_DropFigs "" FALSE
  addMenu "SSM" "StealFactor" "Steal factor" "T" :Menu_StealFactor "" FALSE
  addMenu "SSM" "Haggle" "Haggling" "H" :Menu_Haggle "" FALSE
  
  setMenuHelp "DropFigs" "If this option is enabled, the script will drop a single toll fighter under every port it works at."
  setMenuHelp "StealFactor" "This option lets you set the steal-factor for any steals made by the script.  This factor controls the quantity of product the script believes it is able to safely steal without a high chance of being busted.  Usually, the steal factor is set to 30 for standard TWGS, and 21 for MBBS compatibility mode."
  setMenuHelp "Haggle" "If this option is enabled, the script will always try to haggle for the best possible price."
  
  gosub :sub_SetMenu
  return
  
  :Menu_DropFigs
  if ($DropFigs)
    setVar $DropFigs 0
  else
    setVar $DropFigs 1
  end
  saveVar $DropFigs
  gosub :sub_SetMenu
  openMenu "SSM"
  
  :Menu_StealFactor
  getInput $value "Enter steal factor (i.e. '21' for 70%)"
  isNumber $test $value
  if ($test = 0)
    echo ANSI_15 "**Value must be a number*"
    goto :Menu_StealFactor
  end
  if ($value > 100)
    echo ANSI_15 "**Bad percentage*"
    goto :Menu_StealFactor
  end
  setVar $SellSteal~StealFactor $value
  saveVar $SellSteal~StealFactor
  gosub :sub_SetMenu
  openMenu "SSM"
  
  :Menu_Haggle
  if ($Haggle~HaggleFactor = 0)
    setVar $Haggle~HaggleFactor 7
  else
    setVar $Haggle~HaggleFactor 0
  end
  saveVar $Haggle~HaggleFactor
  gosub :sub_SetMenu
  openMenu "SSM"
  
  :sub_SetMenu
  if ($DropFigs)
    setMenuValue "DropFigs" "ON"
  else
    setMenuValue "DropFigs" "OFF"
  end
  
  if ($Haggle~HaggleFactor > 0)
    setMenuValue "Haggle" "ON"
  else
    setMenuValue "Haggle" "OFF"
  end
  
  setMenuValue "StealFactor" $SellSteal~StealFactor
  return  


# includes:

include "include\sellSteal"  
include "include\playerInfo"
include "include\gamePrefs"