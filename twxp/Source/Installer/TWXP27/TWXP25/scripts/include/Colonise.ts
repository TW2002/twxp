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

# SUB:       Colonise
# Passed:    $Method - "0" = Express warp colonising
#                      "1" = TWarp colonising
#                      "2" = TPad colonising
#            $FuelSource - Planet ID fuel source for TWarp ("P" for port, "T" for target planet)
#            $Category - Category to drop colonists ("1", "2", "3")
#            $TurnLimit - Turn limit
#            $CycleLimit - Cycle limit - "0" for none
#            $FastStart - "1" to use existing variables on startup (to resume colonising)
#            $Overload - "0" to avoid overloading the planet past its productive capacity
# Triggered: Target planet command prompt (holds must be empty and avoids clear)
# Returned:  $Turns - Turns remaining
#            $Colonists - Colonists on the planet in selected category
#            $TerraColonists - Colonists remaining on Terra
#            $Cycles - Number of colonising cycles completed
#            $Result - "0" = Category is full to max production
#                      "1" = Terra is out of colonists
#                      "2" = Out of fuel
#                      "3" = Cycle limit or quota hit
#                      "4" = Turn limit hit
#                      "5" = Transfer target is full
#                      "6" = Out of cash and buying from port
#                      "7" = Out of transfer product
#                      "8" = TWarp return to planet is blocked
#                      "9" = Startup failed due to alignment too low (on TWarp colonising)
#                      "10" = Startup failed due to no fighter in sector (on TWarp colonising)

:Colonise
  # sys_check
  
  if ($FastStart)
    goto :colo
  end
  
  setVar $Cycles 0
  setVar $TerraColonists 999999
  
  # get planet details
  send "d"
  gosub :PlanetInfo~PlanetInfo
  
  setVar $targetID $PlanetInfo~ID
  setVar $sector $PlanetInfo~Sector
  setVar $full[1] $PlanetInfo~FullFuel
  setVar $full[2] $PlanetInfo~FullOrg
  setVar $full[3] $PlanetInfo~FullEquip
  setVar $colo[1] $PlanetInfo~ColoFuel
  setVar $colo[2] $PlanetInfo~ColoOrg
  setVar $colo[3] $PlanetInfo~ColoEquip
  setVar $fuel $PlanetInfo~Amount[1]
  
  # get player info
  gosub :PlayerInfo~InfoQuick
  
  setVar $credits $PlayerInfo~Credits
  setVar $align $PlayerInfo~Align
  setVar $holds $PlayerInfo~Holds
  setVar $planetScanner $PlayerInfo~PlanetScanner
  
  if ($PlayerInfo~TWarp = 0)
    setVar $Method 0
  end
  
  # get distance to/from terra, TPW, port details and turns left
  
  if ($FuelSource = "P")
    setVar $PortCheck "cr*q"
  else
    setVar $PortCheck ""
  end
  
  send "qid" $PortCheck "cf*1*f1*" $sector "*ql" $targetID "*"
    
  if ($FuelSource = "P")
    setTextLineTrigger getPortFuel :getPortFuel "Fuel Ore  "
  end
  
  setTextLineTrigger getTPW :getTPW "Turns to Warp  :"
  setTextLineTrigger getTurns :getTurns "Turns left     :"
  setTextLineTrigger getDistance1 :getDistance1 " to sector 1 is:"
  setTextLineTrigger getDistance2 :getDistance2 ") from sector 1 to sector"
  pause
  
  :getPortFuel
  getWord CURRENTLINE $portFuel 4
  pause
  
  :getTPW
  getWord CURRENTLINE $TPW 5
  pause
  
  :getTurns
  getWord CURRENTLINE $Turns 4
  
  if ($Turns = "Unlimited")
    setVar $Turns 99999999
  end
  pause
    
  :getDistance1
  getWord CURRENTLINE $distance1 4
  stripText $distance1 "("
  pause
    
  :getDistance2
  getWord CURRENTLINE $distance2 4
  stripText $distance2 "("
  waitOn "Planet command (?=help)"

  if ($Method <> "0")
    # check alignment/sector fig
    if ($align < 1000)
      setVar $Result "9"
      return
    end
    if (SECTOR.FIGS.OWNER[$sector] <> "belong to your Corp") and (SECTOR.FIGS.OWNER[$sector] <> "yours")
      setVar $Result "10"
      return
    end
  end
  
  if ($Method = "0")
    # Express Warping there, no fuel needed
    setVar $pickup 0
    setVar $fuelNeeded 0
    setVar $turnsPerCycle (($distance1 + $distance2) * $TPW + 1)

    setVar $colosPerCycle $holds
    setVar $fuelSource "0"
  elseif ($Method = "1")
    # TWarping there - need a big pickup
    setVar $pickup (($distance1 + $distance2) * 3)
    setVar $fuelNeeded $pickup
    setVar $turnsPerCycle ($TPW * 2 + 2)
    setVar $colosPerCycle ($holds - $distance2 * 3)
  elseif ($Method = "2")
    # TPad there, TWarp back - small pickup, big fuel needs
    setVar $pickup ($distance2 * 3)
    setVar $fuelNeeded ($distance1 * 10 + $pickup)
    setVar $turnsPerCycle ($TPW + 3)
    setVar $colosPerCycle ($holds - $distance2 * 3)
  end
  
  :colo
  
  # check for full planet
  if ($full[$Category]) and ($Overload = 0)
    # planet filled to max productive capacity
    setVar $Result "0"
    return
  end

  # check cycles
  if ($Cycles >= $CycleLimit) and ($CycleLimit > 0)
    setVar $Result "3"
    return
  end
  
  # check turns
  if (($Turns - $turnsPerCycle) <= $TurnLimit)
    setVar $Result "4"
    return
  end

  if ($FuelSource = "P")
    # check if out of fuel/credits
    
    if ($portFuel < $fuelNeeded)
      setVar $Result "2"
      return
    end
    if ($credits < 5000)
      setVar $Result "6"
      return
    end
    
    subtract $portFuel $fuelNeeded
  elseif (($FuelSource = "T") or ($FuelSource = $targetID)) and ($fuel < $fuelNeeded)
    setVar $Result "2"
    return
  elseif ($FuelSource <> "0")
    # get status of fuel planet
    if ($FuelSource = "T")
      send "d"
    else
      send "ql" $FuelSource "*"
    end
    gosub :PlanetInfo~PlanetInfo
    setVar $fuel $PlanetInfo~Amount[1]
    
    if ($fuel < $fuelNeeded)
      send "ql" $targetID "*"
      waitOn "Planet #" & $targetID
      waitOn "Planet command "
      setVar $Result "2"
      return
    end
  end
  
  if ($Method <> "0")
    if ($FuelSource = "P")
      setVar $send "qp t " & $fuelNeeded & "**"
    
      if (PORT.BUYORG[$sector] = 0)
        setVar $send $send & "0*"
      end
      if (PORT.BUYEQUIP[$sector] = 0)
        setVar $send $send & "0*"
      end
    elseif ($Method = "1")
      setVar $send "tnt1" & $pickup & "*q"
    else
      setVar $send ""
    end
    
    if ($Method = "1")
      setVar $send $send & "1*yy "
    else
      setVar $send $send & "tnt1" & $pickup & "*cb1*y "
    end
      
    if ($planetScanner)
      setVar $send $send & "l 1* "
    else
      setVar $send $send & "l "
    end
    
    setVar $send $send & "t*"
    
    if (SECTORS > 5000) or ($sector < 600)
      send $send & $sector & "*yy "
    else
      send $send & $sector & "yy "
    end
    
    if ($FuelSource = "P")
      waitOn "<Port>"
      setTextLineTrigger getCredits :getCredits "You have "
      pause
      :getCredits
      getWord CURRENTLINE $credits 3
      stripText $credits ","
    end
    
    # get colonists left on terra
    setTextLineTrigger terraDry :terraDry "There aren't that many on Terra!"
    setTextLineTrigger notDry :notDry "You return to your ship and leave the planet."
    pause
    
    :terraDry
    killTrigger notDry
    setVar $Result 1
    return
    
    :notDry
    killTrigger terraDry
    
  else
    # EWarp colonising
    send "q"
    setVar $Warp~Mode "E"
    setVar $Warp~Pay "N"
    setVar $Warp~Dest "1"
    gosub :Warp~Warp
    
    if ($planetScanner)
      send "l 1* t*"
    else
      send "l t*"
    end
    
    setVar $Warp~Dest $sector
    gosub :Warp~Warp
  end
  
  # drop off colonists
  if ($planetScanner) or (SECTOR.PLANETCOUNT[$sector] > 0)
    send "l " $targetID "*snl" $category "*"
  else
    send "lsnl" $category "*"
  end
  
  # get updated planet info
  gosub :PlanetInfo~PlanetInfo
  
  setVar $targetID $PlanetInfo~ID
  setVar $sector $PlanetInfo~Sector
  setVar $Full[1] $PlanetInfo~Full[1]
  setVar $Full[2] $PlanetInfo~Full[2]
  setVar $Full[3] $PlanetInfo~Full[3]
  setVar $Colo[1] $PlanetInfo~Colo[1]
  setVar $Colo[2] $PlanetInfo~Colo[2]
  setVar $Colo[3] $PlanetInfo~Colo[3]
  setVar $Fuel $PlanetInfo~Amount[1]
  
  add $Cycles 1
  subtract $Turns $turnsPerCycle
  
  if ($FuelSource = "P")
    subtract $fuelLeft $fuelNeeded
  end
  
  goto :colo
  
  return


# includes:

include "include\planetInfo"
include "include\playerInfo"
include "include\warp"