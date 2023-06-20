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

# SUB:       FastSST
# Passed:    $WorldSST~StealFactor - Steal factor for SST operation
#            $WorldSST~ShipList - Count-based array of ships to use for SST
#            $WorldSST~ShipPos - Array of sector positions of the above ships
#            $WorldSST~BustFile - File to record busts to (or "" for no bust record)
#            $LastSteal - The sector last stolen from
# Returned:  $WorldSST~BustList - Bust results
# Triggered: Sector command prompt in any ship within transport range of first SST ship,
#            or in any SST ship.

:FastSST
  # check if we are in an SST ship
  gosub :PlayerInfo~InfoQuick
  setVar $thisShip $PlayerInfo~Ship
  setVar $exp $PlayerInfo~Experience
  setVar $align $PlayerInfo~Align
  
  setVar $i 1
  setVar $curShip 0
  setVar $send ""
  while ($i <= $WorldSST~ShipList)
    if ($WorldSST~ShipList[$i] = $thisShip)
      setVar $send $send & "icr*q"
      setVar $curShip $i
    else
      # check status of work ships and ports
      setVar $send $send & "xx i" & $WorldSST~ShipList[$i] & "***cr" & $WorldSST~ShipPos[$i] & "*q"
    end
    
    add $i 1
  end
  
  send $send
  
  # check results of status check
  setVar $i 1
  while ($i <= $WorldSST~ShipList)
    if ($WorldSST~ShipList[$i] = $thisShip)
      waitOn "Trader Name   "
    else
clientMessage "Waiting on ship: " & $WorldSST~ShipList[$i]
      waitOn "Details on which ship [Q] : " & $WorldSST~ShipList[$i]
    end
      
    setTextLineTrigger getHolds :getHolds "Total Holds    : "
    pause
    
    :getHolds
    getWord CURRENTLINE $shipHolds[$i] 4
    getWordPos CURRENTLINE $hasFuel "Fuel"
    getWordPos CURRENTLINE $hasOrg "Organics"
    
    if ($hasFuel > 0) or ($hasOrg > 0)
      setVar $shipHasJunk[$i] 1
    else
      setVar $shipHasJunk[$i] 0
      getWord CURRENTLINE $content 6
      replaceText $content "=" " "
      getWord $content $test 1
      
      if ($test = "Equipment")
        getWord $content $shipEquip[$i] 2
      else
        setVar $shipEquip[$i] 0
      end
    end
    
    waitOn "What sector is the port in? ["
    setTextLineTrigger getPortEquip :getPortEquip "Equipment  Buying"
    pause
    
    :getPortEquip
    getWord CURRENTLINE $equipBuy 3
    getWord CURRENTLINE $equipPerc 4
    stripText $equipPerc "%"
    setVar $x 10000
    if ($equipPerc = 0)
      setVar $portEquip[$i] ($shipHolds[$i] + 50)
    else
      divide $x $equipPerc
      multiply $x $equipBuy
      divide $x 100
      subtract $x 1
      subtract $x $equipBuy
      
      if ($x < 0)
        setVar $portEquip[$i] 0
      else
        setVar $portEquip[$i] $x
      end
    end
  
    add $i 1
  end
  
  # set display settings
  setVar $GamePrefs~Bank "FastSST"
  setVar $GamePrefs~ANSI[$GamePrefs~Bank] "ON"
  setVar $GamePrefs~AbortDisplayAll[$GamePrefs~Bank] "ON"
  gosub :GamePrefs~SetGamePrefs

  if ($curShip = 0)
    # transport to first ship to steal from
    if ($LastSteal = $WorldSST~ShipPos[1])
      send "xx " $WorldSST~ShipList[1] "*" $WorldSST~ShipList[2] "**"
    else
      send "xx " $WorldSST~ShipList[1] "**"
    end
  elseif ($WorldSST~ShipPos[$curShip] = $LastSteal)
    gosub :sub_NextShip
  end
  
  # begin SST
  
  if ($curShip = 1)
    setVar $lastShip $WorldSST~ShipList
  else
    setVar $lastShip ($curShip - 1)
  end

  setVar $i $curShip
  setVar $busted 0
  setVar $curClock 0
  setVar $curResult $curShip
  
  :doCycle
  
  # identify next ship
  if ($i = $WorldSST~ShipList)
    setVar $nextShip 1
  else
    setVar $nextShip ($i + 1)
  end
    
  if ($busted = 0)
    setVar $maxSteal ($exp / $WorldSST~StealFactor - 1)
    setVar $send ""
    
    if ($shipHasJunk[$i])
      # jet the junk
      setVar $send $send & "jy"
      setVar $shipHasJunk[$i] 0
    elseif ($shipEquip[$i] > 0)
      # sell off existing equipment
      
      setVar $send $send & "pt**"
      
      if (PORT.BUYFUEL[$WorldSST~ShipPos[$i]] = 0)
        setVar $send $send & "0*"
      end
      if (PORT.BUYORG[$WorldSST~ShipPos[$i]] = 0)
        setVar $send $send & "0*"
      end
      
      setVar $shipEquip[$i] 0
      add $portEquip[$i] $shipEquip[$i]
    end
    
    # steal as much as we are able to on this ship
    if ($shipHolds[$i] < $maxSteal)
      setVar $steal $shipHolds[$i]
    else
      setVar $steal $maxSteal
    end
  
    if ($portEquip[$i] < ($steal + 20))
      setVar $upgrade ($steal - $portEquip[$i])
      divide $upgrade 10
      add $upgrade 4
      setVar $send $send & "o3" & $upgrade & "**"
      add $portEquip[$i] ($upgrade * 10)
    end

    setVar $send $send & "pr*sz3" & $steal & "*x"
    setVar $shipEquip[$i] $steal
clientMessage "Stealing from ship ID " & $i & " (" & $WorldSST~ShipList[$i] & "), sector " & $WorldSST~ShipPos[$i] & ", port should have " & $portEquip[$i]
    
    if ($WorldSST~ShipPos[$i] <= 10) or ($WorldSST~ShipPos[$i] = STARDOCK)
      # extra enter for fedspace transport
      setVar $send $send & "*"
    end
    
    send $send & $WorldSST~ShipList[$nextShip] & "**"
    
    setVar $LastSteal $WorldSST~ShipPos[$i]
    add $curClock 1
  end
  
  if ($curClock >= $WorldSST~ShipList) or (($busted) and ($curClock > 0))
  
    # calculate experience gain or hold loss
    setVar $stake ($steal - 1) / 11      
    
clientMessage "Waiting for result #" & $curResult & " (port " & $WorldSST~ShipPos[$curResult] & ")"
    waitOn "(R)ob this port, (S)teal product"
    setTextLineTrigger success :success "Success!"
    setTextLineTrigger busted :busted "Suddenly you're Busted!"
    setTextLineTrigger fakeBust :busted "Do you want instructions (Y/N) [N]?"
    pause
    
    :success
    add $exp $stake
    goto :continue
    
    :busted
    
    # calculate holds lost and flag this sector as busted
    subtract $shipHolds[$curResult] $stake
    setVar $WorldSST~BustList[$WorldSST~ShipPos[$curResult]] 1
    
    if ($WorldSST~BustFile <> "") and ($WorldSST~BustFile <> "0")
      write $WorldSST~BustFile $WorldSST~ShipPos[$curResult]
    end
    
    setVar $busted 1
    
    :continue
    killTrigger success
    killTrigger fakeBust
    killTrigger busted
clientMessage "Result registered - clock now at " & $curClock
    subtract $curClock 1
    add $curResult 1
    
    if ($curResult > $WorldSST~ShipList)
      setVar $curResult 1
    end
  end

  # move to next ship
  if ($i = $WorldSST~ShipList)
    setVar $i 1
  else
    add $i 1  
  end
  
  if ($curClock > 0)
    goto :doCycle
  end
  
  # reset display settings
  gosub :GamePrefs~SetGamePrefs
 
  return
  

:sub_NextShip
  if ($curShip >= $WorldSST~ShipList)
    setVar $curShip 1
  else
    add $curShip 1
  end
  
  return

  
# includes:

include "include\playerInfo"
include "include\gamePrefs"