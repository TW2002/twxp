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

# SUB:       SST
# Passed:    $SellSteal~stealFactor - steal factor
#            $Haggle~HaggleFactor - haggle factor for sell
#            $OtherShip - ID of other ship to SST with
#            $TurnLimit - Turn limit
# Returned:  $Result - "0" for turn limit hit, "1" for busted, "2" for errored
#            $HoldsLost - Holds lost on completion of run
#            $Ship - ID of ship finished in
#            $Sector - Sector finished in
# Triggered: Sector command prompt

:SST
  # sys_check
  
  # set game prefs to requirements
  setVar $GamePrefs~Bank "SST"
  setVar $GamePrefs~Animation[$GamePrefs~Bank] OFF
  setVar $GamePrefs~AbortDisplayAll[$GamePrefs~Bank] OFF
  setVar $GamePrefs~ScreenPauses[$GamePrefs~Bank] OFF
  gosub :GamePrefs~SetGamePrefs
  
  # find other ship's sector
  send "czq"
  waitOn "-----------------------------"
  :getShipAgain
  setTextLineTrigger getShipSector :getShipSector $OtherShip
  pause
  :getShipSector
  getWord CURRENTLINE $test 1
  if ($test <> $OtherShip)
    goto :getShipAgain
  end
  getWord CURRENTLINE $otherShipSector 2
  
  # check that other ship isn't this one
  if ($otherShipSector > 0)
  end
  
  # get player details
  gosub :PlayerInfo~InfoQuick
  
  setVar $ship[1] $PlayerInfo~Ship
  setVar $ship[2] $OtherShip
  setVar $SellSteal~Experience $PlayerInfo~Experience
  setVar $firstRun 1
  setVar $sector 1
  setVar $sector[1] $PlayerInfo~Sector
  setVar $sector[2] $otherShipSector
  setVar $SellSteal~ShipHolds[1] 0
  setVar $SellSteal~ShipHolds[2] 0
  
  :cycle
  setVar $SellSteal~Sector $sector[$sector]
  setVar $Haggle~Sector $sector[$sector]
  setVar $SellSteal~PortClass PORT.CLASS[$sector[$sector]]
  gosub :SellSteal~SellSteal
  
  if ($SellSteal~Success = "0")
    setVar $Result 1
    setVar $HoldsLost $SellSteal~HoldsLost
    setVar $Ship $ship[$sector]
    setVar $Sector $sector[$sector]
    return
  elseif ($SellSteal~Success = "2")
    setVar $Result 2
    setVar $HoldsLost 0
    setVar $Ship $ship[$sector]
    setVar $Sector $sector[$sector]
    return
  end
  
  if ($SellSteal~Turns <= ($TurnLimit + 3))
    # turn limit hit
    setVar $Result 0
    setVar $HoldsLost 0
    setVar $Ship $ship[$sector]
    setVar $Sector $sector[$sector]
    return
  end
  
  if ($sector = "1")
    setVar $sector "2"
  else
    setVar $sector "1"
  end
  
  send "x " $ship[$sector] "* *"
  
  goto :cycle


# includes:

include "include\sellSteal"  
include "include\playerInfo"