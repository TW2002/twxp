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

# SUB:       Evil
# Passed:    $ShipSetup  - String containing ship configuration (i.e. "S50 R31 D6")
#            $StealFactor - Steal factor
#            $RobFactor - Rob factor
#            $Continue - "1" to continue with remaining ships on bust
#            $Broadcast - "1" to broadcast busts on radio
#            $Haggle~HaggleFactor - Haggle Factor
# Triggered: Sector command prompt
# Completed: Sector command prompt in sector/ship of bust port
# Returned:  $Bust - Ship ID busted in
#            $Failed - "1" for ship configuration error

:Evil
  # sys_check
  
  # set game prefs to requirements
  setVar $GamePrefs~Bank "Evil"
  setVar $GamePrefs~Animation[$GamePrefs~Bank] OFF
  setVar $GamePrefs~AbortDisplayAll[$GamePrefs~Bank] OFF
  setVar $GamePrefs~ScreenPauses[$GamePrefs~Bank] OFF
  gosub :GamePrefs~SetGamePrefs
  
  setVar $Bust 0
  
  # break ShipSetup down into an array
  setVar $i 1
  getWord $ShipSetup $set $i
  getLength $set $len
  while (($set <> 0) and ($len > 1))
    cutText $set $op 1 1
    cutText $set $id 2 $len
    
    setVar $op[$i] $op
    setVar $ship[$i] $id
    
    add $i 1
    getWord $shipSetup $set $i
  end
  
  setVar $shipCount ($i - 1)
  
  if ($shipCount < 2)
    # can't work with less than two ships
    return
  end
  
  # find ship sectors
  send "czq"
  waitOn "---------------------------"
  
  :nextLine
  setTextLineTrigger getShipLine :getShipLine
  pause
  
  :getShipLine
  getWord CURRENTLINE $id 1
  if ($id > 0)
    setVar $line CURRENTLINE
    replaceText $line "+" " "
    
    setVar $i 1
    while (($i <= $shipCount) and ($ship[$i] <> $id))
      add $i 1
    end
    
    if ($i <= $shipCount)
      # found the ship, set its sector
      getWord $line $sect[$i] 2
    end
    
    goto :nextLine
  end
  
  # make sure we've got all the ship sectors
  setVar $i 1
  while ($i <= $shipCount)
    if ($sect[$i] = 0)
      # don't know this ship's sector
      setVar $Failed 1
      return
    end
    add $i 1
  end
  
  gosub :PlayerInfo~InfoQuick
  
  setVar $startShip $PlayerInfo~Ship
  setVar $experience $PlayerInfo~Experience

  setVar $ship 1
  while ($ship[$ship] > 0)
    if ($ship[$ship] = $startShip)
      goto :run
    end
    add $ship 1
  end

  # begin in first ship
  setVar $ship 1
  
  if ($PlayerInfo~Sector <= 10) or (PORT.CLASS[$PlayerInfo~Sector] = 9)
    send "x*" $ship[$ship] "**"
  else
    send "x" $ship[$ship] "**"
  end

  :run
  
  setVar $fromSect $sect[$ship]

  if ($op[$ship] = "D")
    setVar $StealDump~Experience $experience
    setVar $StealDump~StealFactor $StealFactor
    setVar $StealDump~Sector $sect[$ship]
    gosub :StealDump~StealDump
    setVar $success $StealDump~Success
    setVar $holdsLost $StealDump~HoldsLost
    setVar $experience $StealDump~Experience
    setVar $turns $StealDump~Turns
  elseif ($op[$ship] = "S")
    setVar $SellSteal~Experience $experience
    setVar $SellSteal~StealFactor $StealFactor
    setVar $SellSteal~Sector $sect[$ship]
    gosub :SellSteal~SellSteal
    setVar $success $SellSteal~Success
    setVar $holdsLost $SellSteal~HoldsLost
    setVar $experience $SellSteal~Experience
    setVar $turns $SellSteal~Turns
  elseif ($op[$ship] = "R")
    setVar $Rob~Experience $experience
    setVar $Rob~RobFactor $RobFactor
    gosub :Rob~Rob
    setVar $success $Rob~Success
    setVar $holdsLost $Rob~HoldsLost
    setVar $experience $Rob~Experience
  end

  if ($success = 0)
    if ($Broadcast)
      if ($op[$ship] = "D")
        setVar $op "SDT"
      elseif ($op[$ship] = "S")   
        setVar $op "SST"
      elseif ($op[$ship] = "R")
        setVar $op "RTR"
      end
    
      send "'Busted in ship " $ship[$ship] " (" $op "), holds lost: " $holdsLost "*"
    end
    if ($Continue)
      gosub :sub_ShuffleList
    else
      halt
    end
  elseif ($success = 2)
    if ($method[$ship] = RTR)
      gosub :sub_ShuffleList    
    else
      clientMessage "Insufficient holds available for SDT"
      halt
    end
  else
    add $ship 1
  end

  if ($ship > $shipCount)
    setVar $ship 1
  end
  
  if ($fromSect <= 10) or (PORT.CLASS[$fromSect] = 9) 
    send "x* " $ship[$ship] "* *"
  else
    send "x " $ship[$ship] "* *"
  end
  
  goto :run


:sub_ShuffleList
  # reshuffle list
  setVar $x1 $ship
  setVar $j1 $ship
  add $j1 1
  :nextShip1
  if ($x1 <= $shipCount)
    setVar $ship[$x1] $ship[$j1]
    setVar $op[$x1] $op[$j1]
    setVar $sect[$x1] $sect[$j1]
    add $x1 1
    add $j1 1
    goto :nextShip1
  end
  
  subtract $shipCount 1
  if ($shipCount <= 1)
    # not enough ships to continue
    halt
  end
  
  return


# includes:

include "include\playerInfo"
include "include\sellSteal"
include "include\stealDump"
include "include\rob"
include "include\gamePrefs"