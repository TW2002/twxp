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

# SUB:       MoveProduct
# Purpose:   Moves a product between two ports/planets, they can be in different areas
# Passed:    $Source - ID of planet to take product from ("P" for port)
#            $SourceSector - Sector of source planet
#            $Dest - ID of planet to deposit product
#            $DestSector - Sector of planet to deposit product
#            $PortQuantity - Quantity of product on port ("0" if unknown)
#            $Product - "1" to move fuel
#                       "2" to move organics
#                       "3" to move equipment
#                       "4" to move figs
#                       "C" to move colonists
#            $SourceCategory - Product category to take colonists from
#            $DestCategory - Product category to drop colonists off
#            $Quantity - Max quantity of product to move
#            $Safe - "0" for speed movement, works from cycle counting
#                    "1" for safe (but slow) movement, needs displays on
#            $Haggle~HaggleFactor - Haggle factor if $Safe = "1"
# Returned:  $Moved - Quantity of product moved
# Triggered: Sector command prompt of source sector (if port), otherwise planet $Source
# Completed: Planet $Dest

:MoveProduct
  # sys_check
  
  gosub :PlayerInfo~InfoQuick
  
  setVar $pScan $PlayerInfo~PlanetScanner
  setVar $credits $PlayerInfo~Credits
  setVar $Moved 0
  
  if ($Product = 4)
    # find the max figs for this ship
    send "qc;ql " $Source "* "
    
    setTextLineTrigger getMaxFigs :getMaxFigs "Max Fighters:"
    pause
    :getMaxFigs
    cutText CURRENTLINE $holds 48 7
    stripText $holds ","
    stripText $holds " "
  else
    setVar $holds $PlayerInfo~Holds
  end
  
  if ($SourceSector <> $DestSector)
    setVar $Safe 1
  end
  
  if ($Product = "C")
    setVar $pickupText "snt" & $SourceCategory
    setVar $dropOffText "snl" & $DestCategory
    setVar $waitText "Which production group are you changing?"
  elseif ($Product = 4)
    setVar $pickupText "mnt"
    setVar $dropOffText "mnl"
    setVar $waitText "There are currently "
  else
    setVar $pickupText "tnt" & $Product
    setVar $dropOffText "tnl" & $Product
    setVar $waitText "Which product are you leaving?"
  end
  
  if ($Source = "P") and ($PortQuantity = 0)
    # find what the port max is
    send "cr*q"
    
    waitOn "Commerce report for "
    
    if ($Product = 1)
      setTextLineTrigger getProduct :getProduct "Fuel Ore   "
    elseif ($Product = 2)
      setTextLineTrigger getProduct :getProduct "Organics   "
    else
      setTextLineTrigger getProduct :getProduct "Equipment  "
    end
    pause
    
    :getProduct
    if ($Product = 1)
      getWord CURRENTLINE $PortQuantity 4
    else
      getWord CURRENTLINE $PortQuantity 3
    end
  end
  
  # set quantity to max possible
  if ($Source = "P")
    if ($PortQuantity < $Quantity)
      setVar $Quantity $PortQuantity
    end
  else
    send "d"
    gosub :PlanetInfo~PlanetInfo
    
    if ($Product = "C")
      if ($PlanetInfo~Colo[$SourceCategory] < $Quantity)
        setVar $Quantity $PlanetInfo~Colo[$SourceCategory]
      end
    else
      if ($PlanetInfo~Amount[$Product] < $Quantity)
        setVar $Quantity $PlanetInfo~Amount[$Product]
      end
    end
  end
  
  if ($Safe)
    setVar $firstRun 1
    setVar $finished 0
    
    if ($Product = "C")
      setVar $planetAmount $PlanetInfo~Colo[$SourceCategory]
    else
      setVar $planetAmount $PlanetInfo~Amount[$Product]
    end
    
    :safeCycle
    
    if ($Quantity < $holds)
      setVar $pickup $Quantity
    else
      setVar $pickup $holds
    end
      
    if ($Source = "P")
      if ($pickup = 0)
        # we're done, land on $Dest
        gosub :sub_LandDest
        waitOn "Planet #" & $Dest
        waitOn "Planet command (?=help)"
        return
      end
    
      # buy the product from the port
      if ($Product = 1)
        setVar $Haggle~BuyProd "Fuel"
      elseif ($Product = 2)
        setVar $Haggle~BuyProd "Organics"
      else
        setVar $Haggle~BuyProd "Equipment"
      end
      
      :RetryHaggle
      send "pt"
      setVar $Haggle~Sector $SourceSector
      
      if ($pickup < $holds)
        setVar $Haggle~Quantity $pickup
      end
        
      gosub :Haggle~Haggle
      
      if ($Haggle~Abort)
        goto :RetryHaggle
      end
      
      if ($Haggle~Credits < 10000)
        # out of cash
        setVar $finished 1
      end
    else
      # grab the product from the planet
      
      if ($firstRun = 0)
        # find out how much is left on this planet
        gosub :PlanetInfo~PlanetInfo
        
        if ($Product = "C")
          setVar $planetAmount $PlanetInfo~Colo[$SourceCategory]
        else
          setVar $planetAmount $PlanetInfo~Amount[$Product]
        end
      end
      
      if ($planetAmount < $pickup)
        setVar $pickup $planetAmount
      end
      
      if ($pickup = 0)
        # we're done
        setVar $finished 1
        send "q"
      else
        if ($pickup = $holds)
          send $pickupText "*q"
        else
          send $pickupText $pickup "*q"
        end
      end
    end
    
    # go to the destination sector (if we're not in it)
    if ($SourceSector <> $DestSector)
      setVar $Warp~Dest $DestSector
      setVar $Warp~Mode "E"
      gosub :Warp~Warp
    end
    
    # drop it off on the destination planet
    if ($finished)
      gosub :sub_landDest
      waitOn "<Preparing ship to land"
    else
      if ($pScan) or (SECTOR.PLANETCOUNT[$DestSector] > 1)
        send "l " $Dest "*" $dropOffText "*"
      else
        send "l " $dropOffText "*"
      end
      waitOn $waitText
    end
    
    waitOn "Planet command (?=help)"
    subtract $Quantity $pickup
    add $Moved $pickup
    
    if ($Quantity <= 0) or ($finished)
      # we're done
      return
    end
    
    send "q"
    
    if ($SourceSector <> $DestSector)
      setVar $Warp~Dest $SourceSector
      setVar $Warp~Mode "E"
      gosub :Warp~Warp
    end

    if ($Source <> "P")
      # land on $Source again
      gosub :sub_LandSource
    end
    
    setVar $firstRun 0
    goto :safeCycle
    
  else
    # calculate number of cycles
    setVar $cycles ($Quantity / $holds)
    setVar $remainder ($Quantity - ($cycles * $holds))
    
    if ($remainder > 0)
      add $cycles 1
    end
    
    if ($Source <> "P")
      send "q"
    end
    
    # clock it as fast as we can for local product movement
    
    if ($cycles <= 0)
      # can't move any products - just land on $Dest
      gosub :sub_LandDest
      return
    end
    
    setVar $GamePrefs~Bank MoveProduct
    setVar $GamePrefs~AbortDisplayAll[$GamePrefs~Bank] ON
    setVar $GamePrefs~ANSI[$GamePrefs~Bank] ON
    gosub :GamePrefs~SetGamePrefs
    
    setVar $clock 3
    
    :cycle
    
    setVar $send ""
    
    if ($Source = "P")
      # grab product from the port
      
      setVar $send "pt"
      
      if (($Product = 2) or ($Product = 3)) and (PORT.BUYFUEL[$SourceSector] = 0)
        setVar $send $send & "0*"
      end
      if ($Product = 3) and (PORT.BUYORG[$SourceSector] = 0)
        setVar $send $send & "0*"
      end
      
      if ($cycles = 1) and ($remainder > 0)
        setVar $send $send & $remainder & "**"
      else
        setVar $send $send & "**"
      end
      
      if (($Product = 1) or ($Product = 2)) and (PORT.BUYEQUIP[$SourceSector] = 0)
        setVar $send $send & "0*"
      end
      if ($Product = 1) and (PORT.BUYORG[$SourceSector] = 0)
        setVar $send $send & "0*"
      end
      
    else
      # grab product from the planet
      
      if ($pScan) or (SECTOR.PLANETCOUNT[$SourceSector] > 1)
        setVar $send $send & "l" & $Source & "*"
      else
        setVar $send $send & "l"
      end
     
      if ($cycles = 1) and ($remainder > 0)
        setVar $send $send & $pickupText & $remainder & "*q"
      else
        setVar $send $send & $pickupText & "*q"
      end
    end
    
    # drop the product off
    setVar $send $send & "l" & $Dest & "*" & $dropOffText & "*q"
    
    send $send      
    subtract $cycles 1
    
    if ($cycles = 1) and ($remainder > 0)
      add $Moved $remainder
    else
      add $Moved $holds
    end
    
    if ($cycles <= 0)
      # we're done
      
      # run the clock down
      while ($clock < 4)
        waitOn $waitText
        add $clock 1
      end
      
      # restore game prefs
      setVar $GamePrefs~Bank MoveProduct
      gosub :GamePrefs~SetGamePrefs
      
      send "l" $Dest "*"
      waitOn "Planet command (?=help)"
      
      return
    end
    
    if ($clock > 0)
      subtract $clock 1
    else
      if ($Source = "P")
        # update credits
        setTextLineTrigger getCredits :getCredits "Your offer ["
        pause
        :getCredits
        getWord CURRENTLINE $offer 3
        stripText $offer ","
        stripText $offer "["
        stripText $offer "]"
        subtract $credits $offer
        
        if ($credits < 10000)
          # out of cash
          setVar $cycles 0
        end
      end
      waitOn $waitText
    end
    
    goto :cycle
  end


:sub_LandDest
  if ($pScan) or (SECTOR.PLANETCOUNT[$DestSector] > 1)
    send "l " $Dest "*"
  else
    send "l "
  end
      
  return
  
:sub_LandSource
  if ($pScan) or (SECTOR.PLANETCOUNT[$SourceSector] > 1)
    send "l " $Source "*"
  else
    send "l"
  end
      
  return
  
  
# includes

include "include\playerInfo"
include "include\planetInfo"
include "include\gamePrefs"
include "include\warp"
include "include\haggle"