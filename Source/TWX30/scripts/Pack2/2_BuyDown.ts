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

setVar $Header~Script "BuyDown"

# check location
getWord CURRENTLINE $location 1
if ($location <> "Planet")
  clientMessage "This script must be run from a planet surface"
  halt
end

reqRecording
logging off

gosub :PlayerInfo~InfoQuick
setVar $holds $PlayerInfo~Holds
setVar $turns $PlayerInfo~Turns
setVar $sector $PlayerInfo~Sector

gosub :Header~Pack2Header

# get defaults
loadVar $BuyDownSaved

if ($BuyDownSaved)
  loadVar $buydown_product
  loadVar $buydown_turnLimit
  loadVar $buydown_quantity
  loadVar $buydown_haggle
else
  setVar $buydown_product 1
  setVar $buydown_haggle 3
  setVar $buydown_turnLimit 0
  setVar $buydown_quantity 99999
  
  saveVar $buydown_product
  saveVar $buydown_haggle
  saveVar $buydown_turnLimit
  saveVar $buydown_quantity
  
  setVar $BuyDownSaved 1
  saveVar $BuyDownSaved
end

addMenu "" "BuyDown" "BuyDown Settings" "." "" "Main" FALSE
addMenu "BuyDown" "GO" "GO!" "G" :Menu_Go "" TRUE
addMenu "BuyDown" "Product" "Product" "P" :Menu_Product "" FALSE
addMenu "BuyDown" "TurnLimit" "Turn limit" "T" :Menu_TurnLimit "" FALSE
addMenu "BuyDown" "Quantity" "Quantity" "U" :Menu_Quantity "" FALSE
addMenu "BuyDown" "Haggle" "Haggling" "H" :Menu_HaggleFactor "" FALSE

setMenuHelp "Product" "This option adjusts the base product you want to buy down.  Naturally, this can be Fuel Ore, Organics or Equipment."
setMenuHelp "TurnLimit" "This option adjusts the script's turn limiter.  The script will terminate before your turns fall below this point."
setMenuHelp "Quantity" "This option allows you to set the quantity of the product you want to buy down."
setMenuHelp "Haggle" "This option allows you to set your haggling preference.  There are three settings:*BEST PRICE: The script will try to haggle for the 'best' possible price, using the standard PPT haggling algorithm.*WORST PRICE: The script will reverse haggle to try to give the port as many credits as possible.  This is useful for megarob preparation.*NONE: The script will speed-buy the product without haggling."

gosub :sub_SetMenu

openMenu "BuyDown"

:Menu_Product
if ($buydown_product = 1)
  setVar $buydown_product 2
elseif ($buydown_product = 2)
  setVar $buydown_product 3
else
  setVar $buydown_product 1
end
saveVar $buydown_product
gosub :sub_SetMenu
openMenu "BuyDown"

:Menu_TurnLimit
getInput $value "Enter turn limit"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_StealFactor
end
setVar $buydown_turnLimit $value

setVar $buydown_quantity (($turns - $value) * $holds)
saveVar $buydown_turnLimit
saveVar $buydown_quantity

gosub :sub_SetMenu
openMenu "BuyDown"

:Menu_Quantity
getInput $value "Enter quantity to buy down"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_StealFactor
end
setVar $buydown_quantity $value

if ($turns = 0)
  setVar $buydown_turnLimit "-1"
else
  # auto set turn limit
  setVar $buydown_turnLimit ($turns - ($value + $holds - 1) / $holds)
end

saveVar $buydown_quantity
saveVar $buydown_turnLimit

gosub :sub_SetMenu
openMenu "BuyDown"

:Menu_HaggleFactor
if ($buydown_haggle = 1)
  setVar $buydown_haggle 2
elseif ($buydown_haggle = 2)
  setVar $buydown_haggle 3
else
  setVar $buydown_haggle 1
end

saveVar $buydown_haggle
gosub :sub_SetMenu
openMenu "BuyDown"


:Menu_Go

# get planet ID
send "dq"
setTextLineTrigger getPlanet :getPlanet "Planet #"
pause
:getPlanet
getWord CURRENTLINE $planet 2
stripText $planet "#"

setVar $MoveProduct~Source "P"
setVar $MoveProduct~SourceSector $sector
setVar $MoveProduct~Dest $planet
setVar $MoveProduct~DestSector $sector
setVar $MoveProduct~Product $buydown_product
setVar $MoveProduct~Quantity $buydown_quantity

if ($buydown_haggle = 1)
  setVar $Haggle~HaggleFactor 8
elseif ($buydown_haggle = 2)
  setVar $Haggle~HaggleFactor "-48"
else
  setVar $Haggle~HaggleFactor 0
end

if ($Haggle~HaggleFactor = 0)
  setVar $MoveProduct~Safe 0
else
  setVar $MoveProduct~Safe 1
end

gosub :MoveProduct~MoveProduct
halt



:sub_SetMenu
  if ($buydown_product = 1)
    setMenuValue "Product" "FUEL ORE"
  elseif ($buydown_product = 2)
    setMenuValue "Product" "ORGANICS"
  else
    setMenuValue "Product" "EQUIPMENT"
  end
  
  if ($buydown_haggle = 1)
    setMenuValue "Haggle" "BEST PRICE"
  elseif ($buydown_haggle = 2)
    setMenuValue "Haggle" "WORST PRICE"
  else
    setMenuValue "Haggle" "NONE"
  end
  
  setMenuValue "TurnLimit" $buydown_turnLimit
  setMenuValue "Quantity" $buydown_quantity
  
  return


# includes:

include "include\playerInfo"
include "include\header"
include "include\moveProduct"
