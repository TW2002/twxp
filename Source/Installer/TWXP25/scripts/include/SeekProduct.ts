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

# SUB:       SeekProduct
# Purpose:   Finds and buys/picksup a full load of a product
# Passed:    $Product - "1" to find fuel
#                       "2" to find organics
#                       "3" to find equipment
#                       "4" to find figs
#                       "C" to find colonists
#            $Holds - Ship holds ("0" if unknown)
#            $IgnoreList - List of planet IDs to ignore, separated by spaces
#            $Haggle~HaggleFactor - Default haggle factor
#            + Parameters for Move sub
# Returned:  $IgnoreList - Updated ignorelist containing planets that didn't hold product
# Triggered: Sector command prompt
# Completed: Sector command prompt

:SeekProduct
  # sys_check
  
  if ($Holds = 0)
    gosub :PlayerInfo~InfoQuick
    setVar $Holds $PlayerInfo~Holds    
  end

  :goGather

  # go find the product
  setVar $Move~checkSub :SeekProduct~CheckSector
  send "d"
  gosub :Move~Move
  
  if ($found = "P")
    :buyProduct
  
    # buy it from the port
    
    if ($Product = 1)
      setVar $Haggle~BuyProd "Fuel"
    elseif ($Product = 2)
      setVar $Haggle~BuyProd "Organics"
    else
      setVar $Haggle~BuyProd "Equipment"
    end
    
    setVar $Haggle~Quantity 0
    setVar $Haggle~Sector $sourceSector
    send "pt"
    gosub :Haggle~Haggle
    
    if ($Haggle~Abort)
      goto :buyProduct
    end
  else
    # grab it from this planet
    send "tnt" & $Product "*q"
  end
  
  return

 

:checkSector
  setVar $FindProduct~Quantity $Holds
  setVar $FindProduct~Product $Product
  setVar $FindProduct~IgnoreList $IgnoreList
  setVar $FindProduct~StayOnPlanet 1
  setVar $FindProduct~Sector $Move~CurSector

  gosub :FindProduct~FindProduct
  
  setVar $IgnoreList $FindProduct~IgnoreList
  
  if ($FindProduct~Location <> 0)
    setVar $Move~Found 1
    setVar $sourceSector $Move~CurSector
    setVar $found $FindProduct~Location
  end
  
  return

  
# includes:

include "include\move"
include "include\findProduct"
include "include\playerInfo"
include "include\haggle"