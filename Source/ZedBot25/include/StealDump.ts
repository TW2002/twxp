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

# SUB:       Steal Dump
# Passed:    $experience - experience of player
#            $stealFactor - steal factor (i.e. 30 for 100%)
#            $haggleFactor - haggle factor for sell (i.e. 5)
#            $sector - individual number identifying port details
#            $planet - planet ID to dump product on ("0" for first in sector)
#            $OverClock - "1" to overclock (not yet implemented)
# Triggered: Sector command prompt
# Returned:  $success - "2" if errored, "1" if success, "0" if busted
#            $holdsLost - equals holds lost if busted
#            $experience - updated player experience
#            $turns - updated player turns
#            $Planet - "0" if was able to execute a fast landing on planet,
#                      otherwise equal to planet ID landed on.

:StealDump
  # sys_check
  
  # Calculate how much we're stealing
  setVar $Holds[$Sector] $experience
  divide $Holds[$Sector] $stealFactor
  subtract $Holds[$Sector] 1

  # initialise if no values exist
  if ($MaxEquip[$sector] = 0) or ($ReInit[$sector])
    gosub :sub_SDInit
    setVar $PortEquip[$sector] $SDInit_PortEquip
    setVar $MaxEquip[$sector] $SDInit_MaxEquip
    setVar $ShipHolds[$sector] $SDInit_Holds
    
    if ($Holds[$Sector] > $ShipHolds[$Sector])
      setVar $Holds[$Sector] $ShipHolds[$Sector]
    end
  end

  if ($Holds[$Sector] > $ShipHolds[$Sector])
    setVar $Holds[$Sector] $ShipHolds[$Sector]
  end
  
  if ($MaxEquip[$Sector] < $SDInit_Holds[$Sector])
    # not enough holds to continue SD
    setVar $success 2
    return
  end
  
  # see if we have to sell first
  if (($PortEquip[$sector] - 2) < $Holds[$Sector])
    gosub :sub_SDSell
    setVar $PortEquip[$sector] $MaxEquip[$sector]
  end

  # steal from the port
  send "pr*st3" $Holds[$sector] "*"
  
  # get turns
  setTextLineTrigger GetTurns :GetTurns "One turn deducted,"
  setTextLineTrigger NoTurns :NoTurns "After docking with the port"
  pause
  :GetTurns
  killTrigger NoTurns
  getWord CURRENTLINE $turns 4
  :NoTurns
  killTrigger GetTurns
  
  # get remaining equipment
  setTextLineTrigger getEquipLeft :getEquipLeft "Equipment  Buying"
  setTextLineTrigger fakeBust :Busted "Suddenly you're Busted!"
  pause
  :getEquipLeft
  killTrigger fakeBust
  getWord CURRENTLINE $PortEquip[$sector] 4
  
  # check for bust/success
  setTextLineTrigger Success :Success "Success!"
  setTextLineTrigger Busted :Busted "Busted!"
  setTextLineTrigger Failure :Failure "There aren't that many holds"
  pause
  
  :Failure
  killTrigger Busted
  killTrigger Success

  send "o33*q"
  goto :StealDump
  
  :Success
  # check experience gain
  killTrigger Busted
  killTrigger Failure
  setTextLineTrigger GetExp :GetExp "and you receive"
  setTextTrigger NoExp :NoExp "Command [TL="
  pause
  
  :GetExp
  getWord CURRENTLINE $expGain 4
  add $experience $expGain
  
  :NoExp
  killTrigger GetExp
  killTrigger NoExp
  
  # drop the product on the first planet in sector
  if ($Planet = "Q")
clientMessage "Quicklanding on planet"
    send "l tnl3*q"
  elseif ($Planet <> "0")
clientMessage "Landing on planet " & $Planet
    send "l" $Planet "* tnl3*q"
  else
clientMessage "Landing on first planet"
    gosub :Land~Land
    setVar $Planet $Land~Planet
    send "tnl3*q"
  end
  setVar $success 1
  subtract $PortEquip[$sector] $Holds[$sector]
  return
  
  :Busted
  # find out how many holds we lost
  killTrigger Success
  killTrigger Failure
  killTrigger getEquipLeft
  setTextLineTrigger GetLost :GetLost "He arrives shortly"
  pause
  :GetLost
  getWord CURRENTLINE $holdsLost 7
  if ($holdsLost > 0)
    # no cbys here
  end
  
  # cleared incase of reinitialisation later
  setVar $MaxEquip[$sector] 0
  
  setVar $success 0
  return


:sub_SDInit
  # get holds on this ship
  send "i"
  setTextLineTrigger SDInit_GetHolds :SDInit_GetHolds "Total Holds    :"
  pause
  :SDInit_GetHolds
  getWord CURRENTLINE $SDInit_Holds 4
  setVar $SDInit_line CURRENTLINE
  replaceText $SDInit_line "=" " "
  getWord $SDInit_line $SDInit_Cargo 6
  if ($SDInit_Cargo = "Equipment")
    getWord $SDInit_line $SDInit_ShipEquip 7
  else
    setVar $SDInit_ShipEquip 0
  end

  # get amount of equip on planet
  if ($Planet <> "0")
    send "l" $Planet "*"
  else
    gosub :Land~Land
    setVar $Planet $Land~Planet
  end
  setTextLineTrigger SDInit_getPlanetEquip :SDInit_getPlanetEquip "Equipment   "
  pause
  :SDInit_getPlanetEquip
  getWord CURRENTLINE $SDInit_PlanetEquip 5
  stripText $SDInit_PlanetEquip ","
  
  # leave equipment if we have it
  if ($SDInit_ShipEquip > 0)
    send "tnl3*"
    add $SDInit_PlanetEquip $SDInit_ShipEquip
  end

  # get port details
  send "qcr*q"
  
  # calculate how much port has on it
  waitFor "Commerce report for"
  setTextLineTrigger SDInit_GetEquip :SDInit_GetEquip "Equipment  Buying"
  pause
  :SDInit_GetEquip
  getWord CURRENTLINE $SDInit_EquipBuy 3
  getWord CURRENTLINE $SDInit_EquipPerc 4
  stripText $SDInit_EquipPerc "%"
  
  if ($SDInit_EquipPerc = 0)
    setVar $SDInit_PortEquip 1000
    setVar $SDInit_MaxEquip 2000
    setVar $ReInit[$sector] 1
    return
  else
    setVar $ReInit[$sector] 0
  end
  
  setVar $x 10000
  divide $x $SDInit_EquipPerc
  multiply $x $SDInit_EquipBuy
  divide $x 100
  subtract $x 15
  subtract $x $SDInit_EquipBuy
  setVar $SDInit_PortEquip $x
  
  setVar $SDInit_MaxEquip $SDInit_PortEquip
  add $SDInit_MaxEquip $SDInit_PlanetEquip
  
  return


# SUB:       SDSell
# Triggered: Sector command prompt
# Passed:    $HaggleFactor

:sub_SDSell
  # port
  send "pn"
  
  if ($planet <> "0")
    send $planet "*"
    goto :PlanetSell
  end
  
  # get the ID of the first planet
  waitFor "Registry# and "
  setTextLineTrigger GetID :GetID "<"
  pause
  
  :GetID
  setVar $line CURRENTLINE
  stripText $line "<"
  stripText $line ">"
  getWord $line $ID 1
  send $ID "*"

  :PlanetSell  
  setTextTrigger Fuel :NoSell "How many units of Fuel Ore do you want"
  setTextTrigger Organics :NoSell "How many units of Organics do you want"
  setTextTrigger Equipment :Sell "How many units of Equipment do you want"
  pause
  
  :NoSell
  send "0*"
  pause
  
  :Sell
  killTrigger Fuel
  killTrigger Organics
  gosub :sub_SDHaggle
  
  if ($SDHaggle_abort = 1)
    goto :sub_SDSell
  end
  
  return


:sub_SDHaggle
  :Sell
  send "*"
  setVar $Abort 0
  setVar $firstOffer 0
  setVar $offerPerc 100
  add $offerPerc $HaggleFactor
  setTextLinetrigger SellDone :SellDone "You have "
  setTextLineTrigger Abort :Abort "We're not interested"
  :SellReset
  killtrigger Offer
  killtrigger FinalOffer
  setTextLinetrigger Offer :SellOffer "We'll buy them for"
  setTextLinetrigger FinalOffer :SellOffer "Our final offer"
  pause
  
  :SellOffer
  # get the first offer (if we don't have it)
  if ($firstOffer = 0)
    getWord CURRENTLINE $firstOffer 5
    stripText $firstOffer ","
  end
  
  # calculate and make an offer
  setVar $offer $firstOffer
  multiply $offer $offerPerc
  divide $offer 100
  send $offer "*"
  subtract $offerPerc 1
  goto :SellReset
  
  :SellDone
  # product sold, get credits
  getWord CURRENTLINE $credits 3
  killtrigger Offer
  killtrigger FinalOffer
  killTrigger Abort
  return
  
  :Abort
  killtrigger Offer
  killtrigger FinalOffer
  killTrigger SellDone
  setVar $Abort 1
  return
  
  
# includes:

include "include\land"