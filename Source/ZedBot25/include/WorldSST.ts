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

# SUB:       WorldSST
# Passed:    $StealFactor - Steal factor for SST operation
#            $Refurb - Port to refurb from (class 0)
#            $BustFile - File to record busts to (or "" for no bust record)
#            $ShipList - List of all ships to be used, separated by spaces
#            + Parameters for included routines
# Triggered: Sector command prompt, in primary scout ship

:WorldSST
  setVar $GamePrefs~Bank "WorldSST"
  setVar $GamePrefs~Animation[$GamePrefs~Bank] "OFF"
  setVar $GamePrefs~AbortDisplayAll[$GamePrefs~Bank] "OFF"
  gosub :GamePrefs~SetGamePrefs

  # assemble shiplist array
  setVar $i 0
  while ($ShipList[$i] > "-1")
    add $i 1
    getWord $ShipList $ShipList[$i] $i "-1"
  end
  setVar $ShipList ($i - 1)

  # load bust list
 # setArray $BustList SECTORS
  if ($BustFile <> "")
    fileExists $exists $BustFile
  
    if ($exists)
      setVar $i 1
      read $BustFile $bust $i
      while ($bust <> EOF)
        setVar $BustList[$bust] 1
        add $i 1
        read $BustFile $bust $i
      end
    end
  end
    
  # scout out and identify free ports for working (xxB)
  setVar $Warp~Mode "F"
  setVar $Warp~DropFig "D"
  setVar $SSTScout~RequiredPorts 10
  gosub :SSTScout~SSTScout
  
  # we now have our work ports - find out where our ships are
  
  send "czq"
  waitOn "---------------------------------"
  :nextShip
  setTextLineTrigger getShipPos :getShipPos
  pause
  
  :getShipPos
  getWord CURRENTLINE $shipNum 1
  if ($shipNum > 0)
    setVar $i 1
    while ($i <= $ShipList)
      if ($ShipList[$i] = $shipNum)
        setVar $line CURRENTLINE
        replaceText $line "+" " "
        getWord $line $ShipPos[$i] 2
        setVar $i ($ShipList + 1)
      end
      add $i 1
    end
    goto :nextShip
  end
  
  # identify unplaced or busted ships and calculate where we can put them
  :placeShips
  setVar $i 1
  setVar $placementFailure 5
  while ($i <= $ShipList)
clientMessage "Scoping ship " & $i & " (" & $ShipList[$i] & ")"

    # check that no other ship has been assigned to this ship's sector
    setVar $checkSector $ShipTargetPos[$i]
    setVar $checkShip $ShipList[$i]
    gosub :sub_CheckSector

    if (PORT.BUYEQUIP[$ShipPos[$i]] = 0) or ($BustList[$ShipPos[$i]]) or ($checkResult) or ($placed[$i] = 0)
      # this ship needs placement, find a clear unbusted spot within X hops of prior ship

clientMessage "Checking ship " & $ShipList[$i]
      
      setVar $j 1
      setVar $found 0
      while ($j <= $SSTScout~Ports)
        setVar $test $SSTScout~Ports[$j]
		
clientMessage "Checking port #" & $j & " (" & $SSTScout~Ports[$j] & ") ... " & $BustList[$test]
 
        # verify that this port hasn't been assigned already
        setVar $checkSector $test
        setVar $checkShip $ShipList[$i]
        gosub :sub_CheckSector

        if ($BustList[$test] = 0) and ($checkResult = 0)
        
          setVar $max 20
          setVar $next ($i + 1)
          if ($next > $ShipList)
            setVar $next 1
          end
          
          if ($ShipTargetPos[$next] = $ShipPos[$next])
            # the next ship has already been placed, so we need to plot our transport into it
            
            setVar $pointA $test
            setVar $pointB $ShipTargetPos[$next]
            gosub :sub_TestDistance
            setVar $distOut $dist
          else
            setVar $distOut 0
          end
        
          if ($i = 1) and ($ShipPos[$ShipList] <> $ShipTargetPos[$ShipList])
            # this is the first ship and the last ship hasn't been placed, so don't bother checking transport in
            setVar $distIn 0
          else
            # check transport placement for transport in
            
            if ($i = 1)
              setVar $lastShip $ShipList
            else
              setVar $lastShip ($i - 1)
            end
              
            setVar $pointA $ShipTargetPos[$lastShip]
            setVar $pointB $test
            gosub :sub_TestDistance
            setVar $distIn $dist
          end
            
clientMessage "Distance for transport in: " & $distIn
clientMessage "Distance for transport out: " & $distOut
          
          if ($distIn <= $max) and ($distOut <= $max)
            # we can use this sector
            setVar $ShipTargetPos[$i] $test
            setVar $j $SSTScout~Ports
            setVar $found 1
clientMessage "Sector identified."
          end
        end
        add $j 1
      end
      
      if ($found = 0)
clientMessage "Ship could not be placed"  
        subtract $placementFailure 1
        
        if ($placementFailure = 0)
clientMessage "Placement failure - starting from scratch."  

          # we really can't find a port that fits in, so scrap it all and restart
          setVar $i 1
          while ($i <= $ShipList)
            setVar $placed[$i] 0
            setVar $ShipTargetPos[$i] 0
            setVar $ShipList 5
            goto :placeShips
          end
        end
        
        # we have unplaced ships - so we need to find more ports
        setVar $Warp~Mode "F"
        setVar $Warp~DropFig "D"
        setVar $SSTScout~RequiredPorts ($SSTScout~Ports + 5)
        gosub :SSTScout~SSTScout
        subtract $i 1
      else
        setVar $placed[$i] 1
      end
    else
      setVar $ShipTargetPos[$i] $ShipPos[$i]
clientMessage "Ship location defaulted on ship " & $ShipList[$i]
    end
    
    add $i 1
  end
  
  # check that the holds of our current ship are low enough for a refurb (70% of max steal or below)
  gosub :PlayerInfo~InfoQuick
  setVar $thisSector $PlayerInfo~Sector
  
clientMessage $PlayerInfo~Experience & " is experience, steal factor " & $StealFactor

  setVar $holdTest ($PlayerInfo~Experience / $StealFactor - 1)
  
  # HARD CODED: Max ship holds
  if ($holdTest > 255)
    setVar $holdTest 255
  end

  setVar $holdTest (($holdTest * 7) / 8)
  
clientMessage "Checking for refurb ... " & $PlayerInfo~Holds & " on ship, against " & $holdTest

  if ($PlayerInfo~Holds < $holdTest)
    # refurb this ship and move it back
    setVar $Refurb~HoldsLost 0
    setVar $Refurb~Method "F"
    gosub :Refurb~Refurb
    
    setVar $Warp~Mode "F"
    setVar $Warp~DropFig "D"
    setVar $Warp~Dest $thisSector
    gosub :Warp~Warp 
  end  
  
  # placement for our ships has now been planned - move them into position
  setVar $i 1
  while ($i <= $ShipList)
    if ($ShipPos[$i] <> $ShipTargetPos[$i])
      setVar $MoveShip~Ship $ShipList[$i]
      setVar $MoveShip~SourceSector $ShipPos[$i]
      setVar $MoveShip~DestSector $ShipTargetPos[$i]
      gosub :MoveShip~MoveShip
      setVar $ShipPos[$i] $MoveShip~DestSector
    end
    
    add $i 1
  end
  
  # all ships are now placed at unbusted ports.  initialise SST.
  gosub :FastSST~FastSST
 
  # replace busted ships and continue
  goto :placeShips 
  

:sub_TestDistance
  # Test the true distance between $pointA and $pointB for an expected less than $max, return in $dist
  getDistance $dist $pointA $pointB
  
  if ($dist = "-1") or ($dist > $max)
    # use the in-game course plotter
    send "cf" $pointA "*" $pointB "*q"
    waitOn "What is the starting sector"
    waitOn "Command [TL="
    getDistance $dist $pointA $pointB
  end
  
  return
  
:sub_CheckSector
  # Verify that no ships other than $checkShip have been assigned to $checkSector, 
  # return 1 in $checkResult if sector has been assigned
  
  setVar $checkCount 1
  setVar $checkResult 0
  
  while ($checkCount <= $ShipList)
    if (($checkShip <> $ShipList[$checkCount]) and ($ShipTargetPos[$checkCount] = $checkSector))
      setVar $checkResult 1
      setVar $checkCount $ShipList
    end
  
    add $checkCount 1
  end

  return
  
    
  
# includes:

include "include\SSTScout"
include "include\moveShip"
include "include\fastSST"
include "include\playerInfo"
include "include\refurb"
include "include\warp"