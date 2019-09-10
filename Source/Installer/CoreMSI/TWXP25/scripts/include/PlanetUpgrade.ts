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

# SUB:       PlanetUpgrade
# Purpose:   Attempts to upgrade a planet using whatever resources are available.
# Passed:    $PlanetID - ID of this planet
#            $Sector - Sector of this planet
#            $Seek - "1" to leave sector in search of products
# Returned:  $Failed - "1" if upgrade failed due to insufficent resources
# Triggered: During planet landing
# Completed: Planet surface

:PlanetUpgrade
  # sys_check
  
  setVar $Failed 0

  # get planet info
  setVar $PlanetInfo~NoHeader 1
  gosub :PlanetInfo~PlanetInfo
  setVar $level $PlanetInfo~CitadelLevel
  setVar $destCategory $PlanetInfo~DropCategory
  
  if (($PlanetInfo~BuildTime > 0) or ($level = 6))
    # planet already upgrading/upgraded
    return
  end
  
  # try to upgrade
  if ($level = 0)
    send "cy"
  else
    send "cuyq"
  end
  
  # get upgrade results
  setTextLineTrigger cantUpgrade :cantUpgrade "This Citadel cannot be upgraded further."
  setTextLineTrigger canUpgrade :canUpgrade "the following:"
  pause
  
  :cantUpgrade
  # we can't upgrade it any further
  killTrigger canUpgrade
  return
  
  :canUpgrade
  killTrigger cantUpgrade
  setTextLineTrigger getColos :getColos "Colonists to support the construction,"
  setTextLineTrigger getFuel :getFuel "units of Fuel Ore,"
  setTextLineTrigger getOrg :getOrg "units of Organics,"
  setTextLineTrigger getEquip :getEquip "units of Equipment and"
  setTextLineTrigger getDays :getDays "days to construct."
  pause
  
  :getColos
  getWord CURRENTLINE $colosNeeded 1
  pause
  
  :getFuel
  getWord CURRENTLINE $fuelNeeded 1
  pause
  
  :getOrg
  getWord CURRENTLINE $orgNeeded 1
  pause
  
  :getEquip
  getWord CURRENTLINE $equipNeeded 1
  pause
  
  :getDays
  getWord CURRENTLINE $daysNeeded 1
  stripText $colosNeeded ","
  stripText $fuelNeeded ","
  stripText $orgNeeded ","
  stripText $equipNeeded ","
  divide $colosNeeded 1000

  # find out how much we really need of each product
  setVar $totalColos ($PlanetInfo~Colo[1] + $PlanetInfo~Colo[2] + $PlanetInfo~Colo[3])
  subtract $colosNeeded $totalColos
  subtract $fuelNeeded $PlanetInfo~Amount[1]
  subtract $orgNeeded $PlanetInfo~Amount[2]
  subtract $equipNeeded $PlanetInfo~Amount[3]
  
  if ($colosNeeded <= 0) and ($fuelNeeded <= 0) and ($orgNeeded <= 0) and ($equipNeeded <= 0)
    # the upgrade must have worked - see if its a 0 day one
    if ($daysNeeded = 0)
      # we may be able to upgrade it further
      
      # delay of 1000ms for TWGS to process the upgrade
      setDelayTrigger upgradePause :upgradePause 1000
      pause
      
      :upgradePause
      send "d"
      goto :PlanetUpgrade
    end
    
    return
  end
  
  send "q"
 
  if ($fuelNeeded > 0)
    # go find fuel
    setVar $Gather~Sector $Sector
    setVar $Gather~Product 1
    setVar $Gather~StayOnPlanet 0
    setVar $Gather~IgnoreList $PlanetID
    setVar $Gather~PlanetID $PlanetID
    setVar $Gather~Quantity $fuelNeeded
    setVar $Gather~Seek $Seek
    gosub :Gather~Gather
    
    if ($Gather~Failed)
      setVar $Failed 1
      return
    end
  end
  
  if ($orgNeeded > 0)
    # go find organics
    setVar $Gather~Sector $Sector
    setVar $Gather~Product 2
    setVar $Gather~StayOnPlanet 0
    setVar $Gather~IgnoreList $PlanetID
    setVar $Gather~PlanetID $PlanetID
    setVar $Gather~Quantity $orgNeeded
    setVar $Gather~Seek $Seek
    gosub :Gather~Gather
    
    if ($Gather~Failed)
      setVar $Failed 1
      return
    end
  end
  
  if ($equipNeeded > 0)
    # go find equipment
    setVar $Gather~Sector $Sector
    setVar $Gather~Product 3
    setVar $Gather~StayOnPlanet 0
    setVar $Gather~IgnoreList $PlanetID
    setVar $Gather~PlanetID $PlanetID
    setVar $Gather~Quantity $equipNeeded
    setVar $Gather~Seek $Seek
    gosub :Gather~Gather
    
    if ($Gather~Failed)
      setVar $Failed 1
      return
    end
  end
  
  if ($colosNeeded > 0)
    # go find colonists
    setVar $Gather~Sector $Sector
    setVar $Gather~Product C
    setVar $Gather~StayOnPlanet 0
    setVar $Gather~IgnoreList $PlanetID
    setVar $Gather~Quantity $colosNeeded
    setVar $Gather~PlanetID $PlanetID
    setVar $Gather~DestCategory $destCategory
    setVar $Gather~Seek $Seek
    gosub :Gather~Gather
    
    if ($Gather~Failed)
      setVar $Failed 1
      return
    end
  end
  
  # products gathered - try to upgrade again
  send "l" $PlanetID "*"
  goto :PlanetUpgrade
  
  
# includes:

include "include\planetInfo"
include "include\gather"