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

# SUB:       MassColonise
# Purpose:   Attempts to colonise every planet in the sector,
#            using whatever fuel sources are available.
# Passed:    $EWarp - "1" to allow express warp colonising
#            $TurnLimit - Turn limit
# Returned:  $Full - "1" if all planets are full of colonists
# Triggered: Sector command prompt

:MassColonise
  # sys_check
  
  setVar $Full 0
  
  # set game prefs to requirements
  setVar $GamePrefs~Bank "WorldTrade"
  setVar $GamePrefs~Animation[$GamePrefs~Bank] OFF
  setVar $GamePrefs~AbortDisplayAll[$GamePrefs~Bank] OFF
  setVar $GamePrefs~ScreenPauses[$GamePrefs~Bank] OFF
  gosub :GamePrefs~SetGamePrefs
  
  # get ship holds/credits
  gosub :PlayerInfo~InfoQuick
  setVar $holds $PlayerInfo~Holds
  setVar $credits $PlayerInfo~Credits
  setVar $align $PlayerInfo~Align
  
  # jet anything in holds
  send "jy"

  # find a planet to colonise
  setVar $PlanetCheck~PlanetCheckSub :MassColonise~findPlanet
  gosub :PlanetCheck~PlanetCheck
  
  setVar $planet $PlanetCheck~Found
  
  if ($planet = 0)
    # all planets are full
    setVar $Full 1
    return
  end
  
  send "q"
  
  if ($align >= 1000)
    # find a fuel source
    setVar $FindProduct~Sector 0
    setVar $FindProduct~Product 1
    setVar $FindProduct~Quantity $holds
    setVar $FindProduct~StayOnPlanet 0
    gosub :FindProduct~FindProduct
    
    if ($FindProduct~Location = "P") and ($credits < 5000)
      # no cash to buy from port
      setVar $FindProduct~Location 0
    end
    
    if ($FindProduct~Location = 0)
      # no fuel found!
      if ($EWarp)
        setVar $Colonise~Method 0
      else
        return
      end
    else
      setVar $Colonise~Method 1
    end
  else
    # can't Twarp colo, ewarp it
    if ($EWarp)
      setVar $Colonise~Method 0
    else
      return
    end
  end
  
  send "l" $planet "*"
  waitOn "Planet command (?=help)"
  
  setVar $Colonise~FastStart 0
  setVar $Colonise~FuelSource $FindProduct~Location

  setVar $Colonise~Category $bestCategory
  setVar $Colonise~TurnLimit $TurnLimit
  
  gosub :Colonise~Colonise
  
  if ($Colonise~Result = 1)
    return
  end
  
  # go find another planet
  send "q"
  goto :MassColonise

  
:findPlanet
  setVar $PlanetInfo~NoHeader 1
  gosub :PlanetInfo~PlanetInfo
  
  # calculate most productive category for this planet
  setVar $bestCategory 1
  setVar $bestRate 9999
  setVar $i 1
  
  while ($i <= 3)
    if ($PlanetInfo~Rate[$i] <> "N/A")
      if ($PlanetInfo~Rate[$i] < $bestRate)
        setVar $bestCategory $i
        setVar $bestRate $PlanetInfo~Rate[$i]
      end
    end
    add $i 1
  end
  
  if ($PlanetInfo~Full[$bestCategory] = 0) and ($bestRate < 9999)
    # found a good planet to colonise
    setVar $PlanetCheck~Found 1
  end
  
  return
  

# includes:

include "include\colonise"
include "include\planetCheck"
include "include\planetInfo"
include "include\findProduct"
include "include\playerInfo"
include "include\gamePrefs"