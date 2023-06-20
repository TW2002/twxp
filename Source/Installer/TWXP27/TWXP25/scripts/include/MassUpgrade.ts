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

# SUB:       MassUpgrade
# Purpose:   Attempts to upgrade every planet in a sector
#            using whatever resources are available.
# Passed:    $Sector - Current sector, or "0" if unknown
#            $IgnoreList - List of planets to avoid upgrading, separated by spaces
#            $Seek - "1" to leave the sector in search of products if they are unavailable
#            + Parameters for move routine
# Returned:  
# Triggered: Sector command prompt

:MassUpgrade
  # sys_check
  
  # set game prefs to requirements
  setVar $GamePrefs~Bank "MassUpgrade"
  setVar $GamePrefs~Animation[$GamePrefs~Bank] OFF
  setVar $GamePrefs~AbortDisplayAll[$GamePrefs~Bank] OFF
  setVar $GamePrefs~ScreenPauses[$GamePrefs~Bank] OFF
  gosub :GamePrefs~SetGamePrefs
  
  if ($Sector = 0)
    # get current sector
    send "d"
    setTextLineTrigger getSector :getSector "Sector  : "
    pause
    :getSector
    getWord CURRENTLINE $Sector 3
    waitOn "Command [TL="
  end
  
  if (SECTOR.PLANETCOUNT[$Sector] = 0)
    # nothing to upgrade
    return
  end
  
  send "jy"
  gosub :PlayerInfo~InfoQuick
  setVar $holds $PlayerInfo~Holds
  
  setVar $PlanetLoop~LoopSub :MassUpgrade~checkPlanet
  setVar $PlanetLoop~IgnoreList $IgnoreList
  gosub :PlanetLoop~PlanetLoop
  
  # must be done
  return


:checkPlanet
  # upgrade this planet
  setVar $PlanetUpgrade~PlanetID $PlanetLoop~ID
  setVar $PlanetUpgrade~Sector $Sector
  setVar $PlanetUpgrade~Seek $Seek
  gosub :PlanetUpgrade~PlanetUpgrade
  return


# SUB:       Menu
# Purpose:   Adds subroutine setup options to menu
# Passed:    $Menu - Name of menu to add options to

:Menu
  addMenu $Menu "IgnoreList" "Planets to ignore" "I" :Menu_IgnoreList "" FALSE
  addMenu $Menu "Seek" "Seek products" "S" :Menu_Seek "" FALSE
  setMenuHelp "IgnoreList" "This is a list of planet numbers (seperated by spaces) for the script to avoid upgrading."
  setMenuHelp "Seek" "If this option is enabled, the script will leave the current sector in search of materials to upgrade the planets (if it needs to)."
  
  gosub :sub_SetMenu
  return
  
  :Menu_Seek
  if ($Seek)
    setVar $Seek 0
  else
    setVar $Seek 1
  end
  saveVar $Seek
  gosub :sub_SetMenu
  openMenu $Menu
  
  :Menu_IgnoreList
  getInput $IgnoreList "Enter a list of planets to ignore, separated by spaces"
  saveVar $IgnoreList
  gosub :sub_SetMenu
  openMenu $Menu
  
:sub_SetMenu
  if ($Seek)
    setMenuValue "Seek" "ON"
  else
    setMenuValue "Seek" "OFF"
  end
  
  setMenuValue "IgnoreList" $IgnoreList
  return  
  

# includes:

include "include\planetUpgrade"
include "include\playerInfo"
include "include\planetLoop"
include "include\gamePrefs"
