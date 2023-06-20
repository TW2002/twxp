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

# SUB:       SDT
# Passed:    $StealDump~StealFactor - steal factor
#            $ThisHaggleFactor - haggle factor for sell at this port
#            $OtherHaggleFactor - haggle factor for sell at other port
#            $OtherShip - ID of other ship to SST with
#            $ThisPlanet - ID of planet to land on in current ship ("0" for first planet)
#            $OtherPlanet - ID of planet to land on in other ship ("0" for first planet)
#            $TurnLimit - Turn limit
# Returned:  $HoldsLost - Holds lost on completion of run
#            $Ship - ID of ship finished in
#            $Sector - Sector finished in
#            $Result - "0" = Hit turn limit, "1" = busted, "2" = errored
# Triggered: Sector command prompt

:SDT
  # sys_check
  
  # set game prefs to requirements
  setVar $GamePrefs~Bank "SDT"
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
  setVar $StealDump~Experience $PlayerInfo~Experience
  setVar $firstRun 1
  setVar $sector 1
  setVar $sector[1] $PlayerInfo~Sector
  setVar $sector[2] $otherShipSector
  setVar $planet[1] $ThisPlanet
  setVar $planet[2] $OtherPlanet
  setVar $haggle[1] $ThisHaggleFactor
  setVar $haggle[2] $OtherHaggleFactor
  setVar $overclock[1] $OverClock
  setVar $overclock[2] $OverClock
  setVar $StealDump~ReInit[1] 1
  setVar $StealDump~ReInit[2] 1
  
  :cycle
  setVar $StealDump~Sector $sector[$sector]
  setVar $StealDump~HaggleFactor $haggle[$sector]
  setVar $StealDump~Planet $planet[$sector]
  setVar $StealDump~Overclock $overclock[$sector]
  gosub :StealDump~StealDump
  setVar $planet[$sector] $StealDump~Planet
  
  if ($StealDump~Success = "0")
    setVar $HoldsLost $StealDump~HoldsLost
    setVar $Ship $ship[$sector]
    setVar $Sector $sector[$sector]
    setVar $Result 1

    return
  elseif ($StealDump~Success = "2")
    setVar $HoldsLost 0
    setVar $Ship $ship[$sector]
    setVar $Sector $sector[$sector]
    setVar $Result 2
    return
  end
  
  if ($StealDump~Turns < ($TurnLimit + 3))
    setVar $HoldsLost 0
    setVar $Ship $ship[$sector]
    setVar $Sector $sector[$sector]
    setVar $Result 0
    return
  end
  
  if ($sector = "1")
    setVar $sector "2"
  else
    setVar $sector "1"
  end
  
  send "x " $ship[$sector] "* *"
  waitOn "<Q> Exit Transporter"
  
  goto :cycle


# includes:

include "include\stealDump"
include "include\playerInfo"
include "include\gamePrefs"