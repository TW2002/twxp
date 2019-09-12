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

# SUB:       Haggle
# Passed:    $BuyProd - Product to buy ("Fuel", "Organics", "Equipment")
#            $HaggleFactor - Default haggle factor (must be negative for worst price)
#            $Quantity - Amount of product to buy ("0" for max)
#            $Sector - Sector to bank price % by
#            $BuyFactor[$Sector] - Buy haggle factor of port
#            $SellFactor[$Sector] - Sell haggle factor of port
#            $BuyDone[$Sector] - "1" if successfully bought something from the port before
#            $SellDone[$Sector] - "1" if successfully sold something to the port before
# Triggered: On port docking (right after 'pt', no delays)
# Returned:  $Abort - equal to 1 on 'not interested'
#            $Credits - equal to cash onhand (with comma segmentation)
#            $BuyFactor[$Sector] - Buy haggle factor of port
#            $SellFactor[$Sector] - Sell haggle factor of port
#            $BuyDone[$Sector] - "1" if successfully bought something from the port before
#            $SellDone[$Sector] - "1" if successfully sold something to the port before

:Haggle
  # sys_check
  
  setVar $abort 0
  
  if ($BuyFactor[$Sector] = 0)
    setVar $BuyFactor[$Sector] ($HaggleFactor * 10)
  end
  if ($SellFactor[$Sector] = 0)
    setVar $SellFactor[$Sector] ($HaggleFactor * 10)
  end
  
  waitOn "Docking..."
  setTextLineTrigger sell :sell "We are buying up to "
  setTextLineTrigger buy :buy "We are selling up to "
  setTextTrigger done :done "Command [TL="
  pause

  :sell
  killTrigger done
  send "*"
  setVar $firstOffer 0
  setVar $offerPerc (1000 + $SellFactor[$Sector])
  :SellReset
  killTrigger line
  killTrigger offer
  setTextLineTrigger line :sellLine
  setTextTrigger offer :sellOffer "Your offer ["
  pause
  
  :sellLine
  getWord CURRENTLINE $test 1
  
  if ($test = 0)
    setVar $lastLineBlank 1
  else
    setVar $lastLinkBlank 0
  
    if (CURRENTLINE = "We're not interested.")
      goto :abort
    else
      cutText CURRENTLINE $test 1 12

    
      if ($test = "Command [TL=")
        goto :done
      else
        cutText CURRENTLINE $test 1 9
        
        if ($test = "You have ")
          goto :sellDone
        end  
      end
    end
  end  
  
  setTextLineTrigger line :sellLine
  pause 
  
  :sellOffer
  # get the first offer (if we don't have it)
  if ($firstOffer = 0)
    getWord CURRENTLINE $firstOffer 3
    stripText $firstOffer "["
    stripText $firstOffer "]"
    stripText $firstOffer ","
  end
  
  # calculate and make an offer
  setVar $offer $firstOffer
  multiply $offer $offerPerc
  divide $offer 1000
  send $offer "*"
  if ($SellFactor[$Sector] < 0)
    if ($SellDone[$Sector])
      add $offerPerc 5
      add $SellFactor[$Sector] 5
    else
      add $offerPerc 10
      add $SellFactor[$Sector] 10
    end
  else
    if ($SellDone[$Sector])
      subtract $offerPerc 3
      subtract $SellFactor[$Sector] 3
    else
      subtract $offerPerc 10
      subtract $SellFactor[$Sector] 10
    end
  end
  goto :sellReset
  
  :sellDone
  # product sold, get credits
  getWord CURRENTLINE $test 3
  if ($test <> "been")
    setVar $Credits $test
    stripText $Credits ","
  end
  killTrigger offer
  killTrigger line
  setVar $SellDone[$Sector] 1
  if ($SellFactor[$Sector] < 0)
    subtract $SellFactor[$sector] 4
  else
    add $SellFactor[$Sector] 6
  end
  setTextTrigger done :done "Command [TL="
  pause
  
  :buy
  killTrigger done
  
  # make sure we're buying the right stuff
  waitOn "do you want to buy ["
  getWord CURRENTLINE $Product 5
  if ($Product <> $buyProd)
    send "0*"
    setTextLineTrigger Buy :Buy "We are selling up to "
    setTextTrigger done :done "Command [TL="
    pause
  end
  
  if ($Quantity > 0)
    send $Quantity "*"
  else
    send "*"
  end
    
  setVar $firstOffer 0
  setVar $offerPerc (1000 - $BuyFactor[$Sector])
  :buyReset
  killTrigger line
  killTrigger offer
  setTextLineTrigger line :buyLine
  setTextTrigger offer :BuyOffer "Your offer ["
  pause
  
  :buyLine
  getWord CURRENTLINE $test 1
  
  if ($test = 0)
    setVar $lastLineBlank 1
  else
    setVar $lastLinkBlank 0
  
    if (CURRENTLINE = "We're not interested.")
      goto :Abort
    else
      cutText CURRENTLINE $test 1 12
    
      if ($test = "Command [TL=")
        goto :Done
      else
        cutText CURRENTLINE $test 1 9
        
        if ($test = "You have ")
          goto :BuyDone
        end  
      end
    end
  end  
  
  setTextLineTrigger line :buyLine
  pause
  
  :buyOffer
  if ($lastLinkBlank)
    # prompt display caused by a message
    setTextTrigger offer :buyOffer "Your offer ["
    pause
  end
  
  # get the first offer (if we don't have it)
  if ($firstOffer = 0)
    getWord CURRENTLINE $firstOffer 3
    stripText $firstOffer "["
    stripText $firstOffer "]"
    stripText $firstOffer ","
  end
  
  # calculate and make an offer
  setVar $offer $firstOffer
  multiply $offer $offerPerc
  divide $offer 1000
  send $offer "*"
  if ($BuyFactor[$Sector] < 0)
    if ($BuyDone[$Sector])
      subtract $offerPerc 5
      add $BuyFactor[$Sector] 5
    else
      subtract $offerPerc 10
      add $BuyFactor[$Sector] 10
    end
  else
    if ($BuyDone[$Sector])
      add $offerPerc 3
      subtract $BuyFactor[$Sector] 3
    else
      add $offerPerc 10
      subtract $BuyFactor[$Sector] 10
    end
  end
  goto :BuyReset
  
  :buyDone
  # product bought, get credits
  getWord CURRENTLINE $test 3
  if ($test <> "been")
    setVar $Credits $test
    stripText $Credits ","
  end
  killTrigger offer
  killTrigger line
  setVar $BuyDone[$Sector] 1
  
  if ($BuyFactor[$Sector] < 0)
    subtract $BuyFactor[$sector] 4
  else
    add $BuyFactor[$Sector] 6
  end
  
  setTextLineTrigger buy :buy "We are selling up to "
  setTextTrigger done :done "Command [TL="
  pause
  
  :abort
  setVar $abort 1
  killTrigger buy
  killTrigger sell
  killTrigger done
  killTrigger line
  killTrigger offer
  setTextLineTrigger buy :buy "We are selling up to "
  setTextLineTrigger sell :sell "We are buying up to "
  setTextTrigger done :done "Command [TL="
  pause

  :Done
  killTrigger abort
  killTrigger sell
  killTrigger buy
  setVar $Quantity 0
  return
