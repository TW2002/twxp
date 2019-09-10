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

# SUB:       SellSteal
# Clockable: Yes, but not during initialisation.  Port MUST be heavily upgraded.  And must use quicksell
# Passed:    $experience - experience of player
#            $stealFactor - steal factor (i.e. 30 for 100%)
#            $Haggle~HaggleFactor - haggle factor for sell (i.e. 5)
#            $Sector - individual number identifying port details
#            $PortClass - "0" for no quicksell, otherwise is class of port in sector
# Triggered: Sector command prompt
# Returned:  $success - "2" if errored, "1" if success, "0" if busted
#            $holdsLost - equals holds lost if busted
#            $experience - updated player experience
#            $turns - updated player turns

:SellSteal
  # sys_check
  
  # check for bad steal factor
  if ($stealFactor <= 0)
    clientMessage "A steal factor of 0 or below cannot be used."
    halt
  end
  
  # initialise if no values exist
  if ($ShipHolds[$sector] = 0)
  
    # get ship equipment
    send "i"
    setTextLineTrigger GetEquip :GetEquip "Total Holds    : "
    pause
    :GetEquip
    getWord CURRENTLINE $ShipHolds[$sector] 4
    setVar $line CURRENTLINE
    replaceText $line "=" " "
    getWord $line $word 6
    if ($word = "Equipment")
      getWord $line $ShipEquip[$sector] 7
    else
      setVar $ShipEquip[$sector] 0
    end
    
    # get port equipment
    send "cr*q"
  
    # calculate how much port has on it
    waitFor "Commerce report for"
    setTextLineTrigger GetPort :GetPort "Equipment  Buying"
    pause
    :GetPort
    getWord CURRENTLINE $EquipBuy 3
    getWord CURRENTLINE $EquipPerc 4
    stripText $EquipPerc "%"
    setVar $x 10000
    if ($EquipPerc = 0)
      setVar $PortEquip[$sector] ($ShipHolds[$sector] + 10)
    else
      divide $x $EquipPerc
      multiply $x $EquipBuy
      divide $x 100
      subtract $x 1
      subtract $x $EquipBuy
      setVar $PortEquip[$sector] $x
    end
  end
  
  # sell equipment if we have any
  if ($ShipEquip[$sector] > 0)
    setVar $buyProd "None"
    
    if ($Haggle~HaggleFactor = 0) and ($PortClass <> "0")
      # quick sell
      setVar $send "p t **"
      
      if ($PortClass = 2) or ($PortClass = 3)
        setVar $send $send & "0*"
      elseif ($PortClass = 4)
        setVar $send $send & "0*0*"
      end
      
      send $send
    else
      :RetrySell
      send "p t"
      gosub :Haggle~Haggle
      if ($Haggle~abort = 1)
        goto :RetrySell
      end
    end
    
    add $PortEquip[$sector] $ShipEquip[$sector]
    setVar $ShipEquip[$sector] 0
  end
  
  # calculate how much we're stealing
  setVar $Holds[$sector] $experience
  divide $Holds[$sector] $stealFactor
  subtract $Holds[$sector] 1
  
  if ($Holds[$sector] > $ShipHolds[$sector])
    setVar $Holds[$sector] $ShipHolds[$sector]
  end

  # check port for steal
  if ($PortEquip[$sector] < $Holds[$sector])
    # port needs to be upgraded - find out how much
    setVar $Upgrade $Holds[$sector]
    subtract $Upgrade $PortEquip[$sector]
    add $PortEquip[$sector] $Upgrade
    add $Upgrade 5
    divide $Upgrade 10
    
    if ($Upgrade > "0")
      send "o 3" $Upgrade "* *"
    end
  end
  
  # steal equip off port
  :Steal
  send "p r* st3" $Holds[$sector] "*"

  waitOn "Enter your choice [T] ?"  
  setTextLineTrigger getTurns :getTurns "One turn deducted,"
  setTextLineTrigger Success :Success "Success!"
  setTextLineTrigger Busted :Busted "Busted!"
  setTextLineTrigger Failure :Failure "There aren't that many holds"
  pause
  
  :getTurns
  getWord CURRENTLINE $Turns 4
  pause
  
  :Success
  killTrigger getTurns
  killTrigger Busted
  killTrigger Failure
  subtract $PortEquip[$sector] $Holds[$sector]
  setVar $ShipEquip[$sector] $Holds[$sector]
  
  # check experience gain
  setTextLineTrigger GetExp :GetExp "and you receive"
  setTextTrigger NoExp :NoExp "Command [TL="
  pause
  
  :GetExp
  getWord CURRENTLINE $ExpGain 4
  add $experience $ExpGain
  
  :NoExp
  killTrigger GetExp
  killTrigger NoExp
  
  setVar $success 1
  return
  
  :Busted
  killTrigger getTurns
  killTrigger Success
  killTrigger Failure
  
  # find out how many holds we lost
  setTextLineTrigger GetLost :GetLost "He arrives shortly"
  pause
  :GetLost
  getWord CURRENTLINE $holdsLost 7
  if ($holdsLost > 0)
    # no cbys here
  end
  
  # cleared incase of reinitialisation later
  setVar $ShipHolds[$sector] 0
  
  setVar $success 0
  return
  
  :Failure
  killTrigger getTurns
  killTrigger Success
  killTrigger Busted
  
  # upgrade port and retry
  send "o 31* *"
  goto :SellSteal
  

# includes:

include "include\haggle"