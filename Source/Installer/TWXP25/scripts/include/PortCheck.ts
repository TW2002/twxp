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

# SUB:       PortCheck
# Passed:    $Sector       - Current sector
#            $PortType     - "1" to look for PPT ports
#                            "2" to look for SSM ports
#            $Scanned      - "0" if havn't scanned yet
#                            "1" if density scanned
#                            "2" if holo scanned
#            $Danger       - "0" if pair sector must be clear of all danger
#                          - "1" if pair sector may contain up to 20 hostile figs, 5 mines, 3% navhaz
#                          - "2" if pair sector may contain possible hazard (planet, heavy figs/mines, navhaz)
#            $FuelOrganics - "0" to not trade fuel/organics
#                            "1" to trade it
#            $Ignore       - Set to the number of adjacent port pairs to ignore (from the top of scan down)
# Triggered: Sector command prompt
# Returned:  $Pair       - Sector of port pair with this sector (or "0")
#            $TradeProdA - Name of product to buy from $Sector
#            $TradeProdB - Name of product to buy from $Pair
#            $Scanned    - Updated scan status (see above)

:PortCheck
  # sys_check
  
  setVar $Pair "0"
  setVar $Figged "0"

  if ($PortType = 1)
    if ((PORT.CLASS[$Sector] < 1) or (PORT.CLASS[$Sector] > 8))
      # not a port we can trade at
      setVar $Ignore "0"
      return
    end
  else
    if (PORT.BUYEQUIP[$Sector] = 0)
      # not a port we can SSM at
      setVar $Ignore "0"
      return
    end
  end

  if ($Scanned = "0")
    # get density details
    send "sd"
    waitOn "Relative Density Scan"
    waitOn "Command [TL="
    setVar $Scanned "1"
  end
  
  if ($Scanned = "1")
    # see if its worth holo-scanning
    setVar $holoScan 0
    setVar $i 1

    while ($i <= SECTOR.WARPCOUNT[$Sector])
      setVar $sect SECTOR.WARPS[$Sector][$i]
      
      if ((PORT.CLASS[$sect] > 0) or (SECTOR.DENSITY[$sect] >= 100))
        setVar $holoScan 1
      end
    
      add $i 1
    end
    
    if ($holoScan)
      send "sh"
      waitOn "Long Range Scan"
      waitOn "Command [TL="
      setVar $Scanned "2"
    end
  end
  
  if ($Scanned = "2")
    # we have enough information to check adjacents for port pairs
    setVar $i 1
    setVar $class PORT.CLASS[$Sector]
    setVar $TradeProdA ""
    setVar $TradeProdB ""
    
    while ($i <= SECTOR.WARPCOUNT[$Sector]) and ($TradeProdA = "")
      setVar $sect SECTOR.WARPS[$Sector][$i]
      setVar $pairClass PORT.CLASS[$sect]
      
      if (($pairClass > 0) and ($pairClass < 9) and ((SECTOR.FIGS.QUANTITY[$sect] = "0") or (SECTOR.FIGS.OWNER[$sect] = "yours") or (SECTOR.FIGS.OWNER[$sect] = "belong to your Corp") or (($Danger = "1") and ($SECTOR.FIGS.QUANTITY[$sect] <= 20)) or ($Danger = "2")) and ((SECTOR.MINES.QUANTITY[$sect] = "0") or (SECTOR.MINES.OWNER[$sect] = "yours") or (SECTOR.MINES.OWNER[$sect] = "belong to your Corp") or (($Danger = "1") and ($SECTOR.MINES.QUANTITY[$sect] <= 5)) or ($Danger = "2")) and ((SECTOR.NAVHAZ[$sect] = 0) or ((SECTOR.NAVHAZ[$sect] <= 3) and ($Danger = "1")) or ($Danger = "2")) and ((SECTOR.PLANETCOUNT[$sect] = 0) or ($Danger = "2")) and ((SECTOR.TRADERCOUNT[$sect] = 0) or ($Danger = "2")))
        
        if ($PortType = 1)
          gosub :sub_PPTCheck
        else
          if (PORT.BUYEQUIP[$sect])
            setVar $TradeProdA "Equipment"
          end
        end
        
        if ($TradeProdA <> "")
          subtract $Ignore 1
          
          if ($Ignore >= 0)
            setVar $TradeProdA ""
            setVar $TradeProdB ""
          else
            setVar $Pair $sect
          end
        end
      end
    
      add $i 1
    end
  end

  setVar $Ignore "0"
      
  return
  
  
:sub_PPTCheck
  if (($class = 1) and ($pairClass = 2))
    setVar $TradeProdA "Equipment"
    setVar $TradeProdB "Organics"
  end
  if (($class = 1) and ($pairClass = 3))
    setVar $TradeProdA "Equipment"
    setVar $TradeProdB "Fuel"
  end
  if (($class = 1) and ($pairClass = 4))
    setVar $TradeProdA "Equipment"
    setVar $TradeProdB "Organics"
  end
  if (($class = 2) and ($pairClass = 1))
    setVar $TradeProdA "Organics"
    setVar $TradeProdB "Equipment"
  end
  if (($class = 2) and ($pairClass = 3) and ($FuelOrganics))
    setVar $TradeProdA "Organics"
    setVar $TradeProdB "Fuel"
  end
  if (($class = 2) and ($pairClass = 5))
    setVar $TradeProdA "Organics"
    setVar $TradeProdB "Equipment"
  end
  if (($class = 3) and ($pairClass = 1))
    setVar $TradeProdA "Fuel"
    setVar $TradeProdB "Equipment"
  end
  if (($class = 3) and ($pairClass = 2) and ($FuelOrganics))
    setVar $TradeProdA "Fuel"
    setVar $TradeProdB "Organics"
  end
  if (($class = 3) and ($pairClass = 6))
    setVar $TradeProdA "Fuel"
    setVar $TradeProdB "Equipment"
  end
  if (($class = 4) and ($pairClass = 1))
    setVar $TradeProdA "Organics"
    setVar $TradeProdB "Equipment"
  end
  if (($class = 4) and ($pairClass = 5))
    setVar $TradeProdA "Organics"
    setVar $TradeProdB "Equipment"
  end
  if (($class = 4) and ($pairClass = 6))
    setVar $TradeProdA "Fuel"
    setVar $TradeProdB "Equipment"
  end
  if (($class = 5) and ($pairClass = 2))
    setVar $TradeProdA "Equipment"
    setVar $TradeProdB "Organics"
  end
  if (($class = 5) and ($pairClass = 4))
    setVar $TradeProdA "Equipment"
    setVar $TradeProdB "Organics"
  end
  if (($class = 5) and ($pairClass = 6) and ($FuelOrganics))
    setVar $TradeProdA "Fuel"
    setVar $TradeProdB "Organics"
  end
  if (($class = 6) and ($pairClass = 3))
    setVar $TradeProdA "Equipment"
    setVar $TradeProdB "Fuel"
  end
  if (($class = 6) and ($pairClass = 4))
    setVar $TradeProdA "Equipment"
    setVar $TradeProdB "Fuel"
  end
  if (($class = 6) and ($pairClass = 5) and ($FuelOrganics))
    setVar $TradeProdA "Organics"
    setVar $TradeProdB "Fuel"
  end
  
  return


# SUB:       Menu
# Purpose:   Creates subroutine setup submenu (merging with PPT/SSM)

:Menu
  if ($PortType = 1)
    setVar $portMenu "PPT"
    addMenu "PPT" "FuelOrganics" "Trade fuel/organics" "R" :Menu_FuelOrganics "" FALSE
    setMenuHelp "FuelOrganics" "If this option is enabled, the script will trade fuel/organics where this combination is available."
  else
    setVar $portMenu "SSM"
  end

#  addMenu $portMenu "Danger" "Safety Level" "S" :Menu_Danger "" FALSE
  
  gosub :sub_SetMenu
  return
  
  :Menu_Danger
  if ($Danger = 2)
    setVar $Danger 0
  else
    add $Danger 1
  end
  saveVar $Danger
  gosub :sub_SetMenu
  openMenu $portMenu
  
  :Menu_FuelOrganics
  if ($FuelOrganics)
    setVar $FuelOrganics 0
  else
    setVar $FuelOrganics 1
  end
  saveVar $FuelOrganics
  gosub :sub_SetMenu
  openMenu $portMenu
  
  :sub_SetMenu
  if ($PortType = 1)
    if ($FuelOrganics)
      setMenuValue "FuelOrganics" "ON"
    else
      setMenuValue "FuelOrganics" "OFF"
    end
  end
  
  # hack:
  return
  
  if ($Danger = 0)
    setMenuValue "Danger" "PARANOID"
  elseif ($Danger = 1)
    setMenuValue "Danger" "STANDARD"
  else
    setMenuValue "Danger" "RECKLESS"
  end
  
  return  
