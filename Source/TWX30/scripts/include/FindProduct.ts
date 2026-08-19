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

# SUB:       FindProduct
# Purpose:   Attempts to locate a type of product within the current sector
# Passed:    $Sector - Current sector ("0" if unknown)
#            $Product - "1" to find fuel
#                       "2" to find organics
#                       "3" to find equipment
#                       "4" to find figs
#                       "C" to find colonists
#            $Quantity - Minimum quantity of product to accept
#            $StayOnPlanet - "1" to stay on the planet if product is found on it
#            $IgnoreList - List of planet IDs to ignore, separated by spaces
# Returned:  $Location - Planet ID holding product, or "P" for port, "0" for not found
#            $Category - Category of colonists on planet (if finding colos)
#            $IgnoreList - Updated ignorelist containing planets that didn't hold product
# Triggered: Sector command prompt
# Completed: Sector command prompt

:FindProduct
  # sys_check
  
  if ($Sector = 0)
    send "d"
    setTextLineTrigger getSector :getSector "Sector  : "
    pause
    :getSector
    getWord CURRENTLINE $Sector 3
  end

  setVar $Location 0
  
  if (SECTOR.PLANETCOUNT[$Sector] > 0)
    # check the planets first
    setVar $PlanetCheck~IgnoreList $IgnoreList
    setVar $PlanetCheck~PlanetCheckSub :FindProduct~checkProduct    
    gosub :PlanetCheck~PlanetCheck
    
    if ($PlanetCheck~Found > 0)
      setVar $Location $PlanetCheck~Found
      
      if ($StayOnPlanet = 0)
        send "q"
      end
      
      return
    end
  end
  
  # check the port
  if (PORT.CLASS[$Sector] > 0) and (PORT.CLASS[$Sector] < 8)
    if ((PORT.BUYFUEL[$Sector] = 0) and ($Product = 1)) or ((PORT.BUYORG[$Sector] = 0) and ($Product = 2)) or ((PORT.BUYEQUIP[$Sector] = 0) and ($Product = 3))
      send "cr*q"
      
      waitOn "Commerce report for "
      
      if ($Product = 1)
        setTextLineTrigger getProduct :getProduct "Fuel Ore   "
      elseif ($Product = 2)
        setTextLineTrigger getProduct :getProduct "Organics   "
      else
        setTextLineTrigger getProduct :getProduct "Equipment  "
      end
      pause
      
      :getProduct
      if ($Product = 1)
        getWord CURRENTLINE $ProdAmount 4
      else
        getWord CURRENTLINE $ProdAmount 3
      end
      
      if ($ProdAmount >= $Quantity)
        setVar $Location "P"
      end
    end
  end
  
  return
  
  
:checkProduct
  setVar $PlanetInfo~NoHeader 1
  gosub :PlanetInfo~PlanetInfo
  
  if ($Product = "C")
    # check for colonists
    
    setVar $i 1
    while ($i <= 3)
      if ($PlanetInfo~Colo[$i] >= $Quantity)
        setVar $Category $i
        setVar $PlanetCheck~Found 1
        return
      end
      add $i 1
    end
  else
    if ($PlanetInfo~Amount[$Product] >= $Quantity)
      setVar $PlanetCheck~Found 1
    end
  end
  
  if ($PlanetCheck~Found = 0)
    setVar $IgnoreList ($IgnoreList & " " & $PlanetCheck~Check_Planet)
  end
  
  return
  
# includes:

include "include\planetCheck"
include "include\planetInfo"