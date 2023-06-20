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

# TWX Script Pack 1: Port pair trading script
# Author           : Xide
# Description      : Trades between two sectors with ports, buying and
#                    selling products between them.
#                    Haggles with a variable markup/markdown.
#                    First docking is at the CURRENT sector of the player.
# Trigger Point    : Sector command prompt
# Warnings         : Ports must have enough products on board to make
#                    this script worthwhile.  Ideally trading should stop
#                    once a port hits below 20%.  This script assumes
#                    there are no one-way warps between ports and that
#                    they are adjacent to eachother.  Be
#                    sure there are no obstructions in either sector.
# Other            : I wouldn't try learning the script language here,
#                    this script is quite complex and basically goes all
#                    over the damn place :)

# check if we can run it from here
cutText CURRENTLINE $location 1 12

if ($location <> "Command [TL=")
  clientMessage "This script must be run from the command prompt"
  halt
end

logging off

# show script banner
echo "**" ANSI_3 "     --" ANSI_11 "===| " ANSI_15 "Port Pair Trading v2.00" ANSI_11 " |===" ANSI_3 "--**"
echo ANSI_7 "No registration is required to use this script,*it is completely open source and can be opened*in notepad."
echo "**" ANSI_15 "For your own safety, please read the warnings*written at the top of the script before*using it!*"

# get user input
getinput $sector2 "Enter sector to trade to" 0
getinput $timesLeft "Enter times to execute script" 0
getinput $percent "Enter markup/markdown percentage" 5

# get the current sector
send "d"
setTextLineTrigger 1 :getSectorNumber "Sector  : "
pause

:getSectorNumber
getWord CURRENTLINE $sector1 3
setVar $thisSector $sector1

:sub_Trade
  killTrigger 0
  killTrigger 1
  killTrigger 2
  killTrigger 3
  killTrigger 4
  send "pt"
  waitfor "-----"
  getSector $thisSector $thisSect

  if ($thisSector = $sector1)
    getSector $sector2 $otherSect
  else
    getSector $sector1 $otherSect
  end

  if ($thisSect.Port.Class = 3) or ($thisSect.Port.Class = 4) or ($thisSect.Port.Class = 5) or ($thisSect.Class = 7)
    setVar $portStage 0
  end
  if ($thisSect.Port.Class = 2) or ($thisSect.Port.Class = 6)
    setVar $portStage 1
  else
    setVar $portStage 2
  end

  # haggle it!
  setTextLineTrigger 1 :selectHoldsSell "We are buying up to"
  setTextLineTrigger 2 :selectHoldsBuy "We are selling up to"
  setTextTrigger 3 :done "Command [TL="
  setTextTrigger 4 :sub_Trade "We're not interested."
  pause

  :selectHoldsSell
  send "*"
  setTextLineTrigger 1 :Haggle_Sell "We'll buy them for"
  pause

  :Haggle_Sell
  getWord CURRENTLINE $startPrice 5
  stripText $startPrice ","
  setVar $sellPerc (100 + $percent)

  :sub_Sell
    killTrigger 1
    killTrigger 0
    setVar $price $startPrice
    multiply $price $sellPerc
    divide $price 100
    send $price "*"
    subtract $sellPerc 1
    setTextLineTrigger 1 :sub_Sell "We'll buy them for"
    setTextLineTrigger 0 :sub_Sell "Our final offer"
    pause

  :selectHoldsBuy
  killTrigger 1
  killTrigger 0

  # see if we should buy this stuff - there might be a more profitable
  # thing to buy here

  # first see what we're trading
  setTextTrigger 2 :getTradeType "How many holds of"
  pause
  :getTradeType
  getWord CURRENTLINE $tradeType 5

  if ($tradeType = "Fuel")
    if (($thisSect.Port.Class = 5) or ($thisSect.Port.Class = 7)) and (($otherSect.Port.Class = 2) or ($otherSect.Port.Class = 3) or ($otherSect.Port.Class = 4) or ($otherSect.Port.Class = 8))
      # can buy equipment - fuel ore is worthless.
      send "0*"
      setTextLineTrigger 2 :selectHoldsBuy "We are selling up to"
      pause
    end

    if (($thisSect.Port.Class = 4) or ($thisSect.Port.Class = 7)) and (($otherSect.Port.Class = 1) or ($otherSect.Port.Class = 3) or ($otherSect.Port.Class = 5) or ($otherSect.Port.Class = 8))
      # can buy organics - fuel ore is worthless.
      send "0*"
      setTextLineTrigger 2 :selectHoldsBuy "We are selling up to"
      pause
    end

    if (($thisSect.Port.Class = 4) or ($thisSect.Port.Class = 7) or ($thisSect.Port.Class = 3) or ($thisSect.Port.Class = 5)) and (($otherSect.Port.Class = 3) or ($otherSect.Port.Class = 4) or ($otherSect.Port.Class = 5) or ($otherSect.Port.Class = 7))
      # no point buying fuel if it can't be sold
      send "0*"
      setTextLineTrigger 2 :selectHoldsBuy "We are selling up to"
      pause
    end
  end

  if ($tradeType = "Organics")
    if (($thisSect.Port.Class = 6) or ($thisSect.Port.Class = 7)) and (($otherSect.Port.Class = 2) or ($otherSect.Port.Class = 3) or ($otherSect.Port.Class = 4) or ($otherSect.Port.Class = 8))
      # can buy equipment - organics is worthless.
      send "0*"
      setTextLineTrigger 2 :selectHoldsBuy "We are selling up to"
      pause
    end

    if (($thisSect.Port.Class = 2) or ($thisSect.Port.Class = 4) or ($thisSect.Port.Class = 6) or ($thisSect.Port.Class = 7)) and (($otherSect.Port.Class = 2) or ($otherSect.Port.Class = 4) or ($otherSect.Port.Class = 6) or ($otherSect.Port.Class = 7))
      # no point buying organics if it can't be sold
      send "0*"
      setTextLineTrigger 2 :selectHoldsBuy "We are selling up to"
      pause
    end
  end

  if ($tradeType = "Equipment")
    if (($otherSect.Port.Class = 1) or ($otherSect.Port.Class = 5) or ($otherSect.Port.Class = 6) or ($otherSect.Port.Class = 7))
      # no point buying equipment if it can't be sold
      send "0*"
      setTextLineTrigger 2 :selectHoldsBuy "We are selling up to"
      pause
    end
  end

  send "*"
  setTextLineTrigger 2 :Haggle_Buy "We'll sell them for"
  pause

  :Haggle_Buy
  getWord CURRENTLINE $startPrice 5
  stripText $startPrice ","
  setVar $buyPerc (100 - $percent)
  
  :sub_Buy
    killTrigger 1
    killTrigger 0
    setVar $price (($startPrice * $buyPerc) / 100)
    send $price "*"
    add $buyPerc 1
    setTextLineTrigger 1 :sub_Buy "We'll sell them for"
    setTextLineTrigger 0 :sub_Buy "Our final offer"
    pause

  :done

  if ($thisSector = $sector1)
    send $sector2 "*"
    setVar $thisSector $sector2
  else
    subtract $timesLeft 1

    if ($timesLeft <= 0)
      halt
    end

    send $sector1 "*"
    setVar $thisSector $sector1
  end

  waitfor "Sector  : "
  goto :sub_Trade
