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

# SUB:       Gather
# Purpose:   Attempts to find and gather a specific type of product
# Passed:    $Sector - Sector of planet to deposit product
#            $PlanetID - ID of planet to deposit product
#            $Product - "1" to find fuel
#                       "2" to find organics
#                       "3" to find equipment
#                       "4" to find figs
#                       "C" to find colonists
#            $DestCategory - Destination category to drop any colonists gathered
#            $Quantity - Quantity of product to gather
#            $Holds - Ship holds ("0" if unknown)
#            $IgnoreList - List of planet IDs to ignore, separated by spaces
#            $StayOnPlanet - "1" to stay on the depositing planet when finished
#            $Seek - "1" to leave $Sector in search of products
#            $Haggle~HaggleFactor - Default haggle factor
#            + Parameters for Move sub
# Returned:  $IgnoreList - Updated ignorelist containing planets that didn't hold product
#            $Failed - "1" if failed to gather required amount
# Triggered: Sector command prompt
# Completed: Sector command prompt in $Sector (or on $PlanetID)

:Gather
  # sys_check
  
  setVar $gathered 0
  setVar $Failed 0

  if ($Holds = 0)
    gosub :PlayerInfo~InfoQuick
    setVar $Holds $PlayerInfo~Holds    
  end

  :goGather
  
  if (($Quantity - $gathered) < $Holds)
    setVar $get ($Quantity - $gathered)
  else
    setVar $get $Holds
  end

  if ($Seek)
    # go find the product
    setVar $Move~checkSub :Gather~CheckSector
    send "d"
    gosub :Move~Move
  else
    # just try to find it here
    setVar $FindProduct~Quantity $get
    setVar $FindProduct~Product $Product
    setVar $FindProduct~IgnoreList $IgnoreList
    setVar $FindProduct~StayOnPlanet 1
    setVar $FindProduct~Sector $Sector
  
    gosub :FindProduct~FindProduct
    
    setVar $IgnoreList $FindProduct~IgnoreList
    
    if ($FindProduct~Location = 0)
      # couldn't find it!
      setVar $Failed 1
      send "t"
      return
    end
    
    setVar $sourceSector $Sector
    setVar $found $FindProduct~Location
  end
  
  if ($Product = "C")
    setVar $MoveProduct~SourceCategory $FindProduct~Category
    setVar $MoveProduct~DestCategory $DestCategory
  end
  
  # we've found the product, now move it to its new location
  setVar $MoveProduct~Source $found
  setVar $MoveProduct~SourceSector $sourceSector
  setVar $MoveProduct~Dest $PlanetID
  setVar $MoveProduct~DestSector $Sector
  setVar $MoveProduct~Product $Product
  setVar $MoveProduct~Quantity ($Quantity - $gathered)
  setVar $MoveProduct~Safe 0
  gosub :MoveProduct~MoveProduct
  
  add $gathered $MoveProduct~Moved
  
  if ($gathered < $Quantity)
    send "q"
    goto :goGather
  end
  
  if ($StayOnPlanet = 0)
    send "q"
  end
  return

 

:Gather~CheckSector
  setVar $FindProduct~Quantity $get
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
include "include\moveProduct"
include "include\playerInfo"