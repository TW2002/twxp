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

setVar $Header~Script "Gather"

# check location
getWord CURRENTLINE $location 1
if ($location <> "Planet")
  clientMessage "This script must be run from a planet surface"
  halt
end

reqRecording
logging off

gosub :Header~Pack2Header

# get defaults

loadVar $GatherSaved

if ($GatherSaved)
  loadVar $gather_product
  loadVar $gather_dropCategory
  loadVar $gather_haggle
  loadVar $gather_turnLimit
  loadVar $gather_quantity  
  loadVar $gather_seek
else
  setVar $gather_product 1
  setVar $gather_dropCategory 1
  setVar $gather_haggle 3
  setVar $gather_turnLimit 0
  setVar $gather_quantity 9999999
  setVar $gather_seek 0
  
  saveVar $gather_product
  saveVar $gather_dropCategory
  saveVar $gather_haggle
  saveVar $gather_turnLimit
  saveVar $gather_quantity
  saveVar $gather_seek
  
  setVar $GatherSaved 1
  saveVar $GatherSaved
end

addMenu "" "Gather" "Gather Settings" "." "" "Main" FALSE
addMenu "Gather" "GO" "GO!" "G" :Menu_Go "" TRUE
addMenu "Gather" "Product" "Product" "P" :Menu_Product "" FALSE
addMenu "Gather" "DropCategory" "Drop colonist category" "C" :Menu_DropCategory "" FALSE
addMenu "Gather" "Quantity" "Quantity" "U" :Menu_Quantity "" FALSE
addMenu "Gather" "Seek" "Seek" "S" :Menu_Seek "" FALSE
addMenu "Gather" "Haggle" "Haggling" "H" :Menu_HaggleFactor "" FALSE

setMenuHelp "Product" "This option lets you choose the base product you want to gather onto your planet.  This can be either Fuel Ore, Organics, Equipment or Colonists."
setMenuHelp "DropCategory" "This option lets you choose the drop category for your colonists, if you are gathering them."
setMenuHelp "Quantity" "This option will let you choose the amount of the product you want to gather."
setMenuHelp "Seek" "If this option is enabled, this script will leave the current sector in search of products.  If it is disabled, this script will do its gathering only in the current sector."
setMenuHelp "Haggle" "If this option is enabled, this script will try to haggle for the best possible price when gathering any kind of product from a port."

# set move routine prefs
loadVar $Move~Saved

if ($Move~Saved)
  loadVar $Move~ScanHolo
  loadVar $Move~Evasion
  loadVar $Move~Attack
  loadVar $Move~PortPriority
  loadVar $Move~ExtraSend
  replaceText $Move~ExtraSend #42 "*"
else
  setVar $Move~ScanHolo 1
  setVar $Move~Evasion 0
  setVar $Move~Attack 0
  setVar $Move~PortPriority 1
  setVar $Move~ExtraSend "f1" & #42 & "ct"
  saveVar $Move~ExtraSend
  replaceText $Move~ExtraSend #42 "*"
  
  saveVar $Move~ScanHolo
  saveVar $Move~Evasion
  saveVar $Move~Attack
  saveVar $Move~PortPriority
  
  setVar $Move~Saved 1
  saveVar $Move~Saved
end

setVar $Move~Menu "Gather"
gosub :Move~Menu
setMenuHelp "Move" "This menu will let you configure how the script behaves when it navigates the game searching for the product it is gathering.  The options in this menu only apply if the 'Seek' option is enabled."

gosub :sub_SetMenu
openMenu "Gather"

:Menu_Seek
if ($gather_seek = 1)
  setVar $gather_seek 0
else
  setVar $gather_seek 1
end

saveVar $gather_seek
gosub :sub_SetMenu
openMenu "Gather"

:Menu_Product
if ($gather_product = 1)
  setVar $gather_product 2
elseif ($gather_product = 2)
  setVar $gather_product 3
elseif ($gather_product = 3)
  setVar $gather_product C
else
  setVar $gather_product 1
end

saveVar $gather_product
gosub :sub_SetMenu
openMenu "Gather"

:Menu_DropCategory
if ($gather_dropCategory = 1)
  setVar $gather_dropCategory 2
elseif ($gather_dropCategory = 2)
  setVar $gather_dropCategory 3
else
  setVar $gather_dropCategory 1
end

saveVar $gather_dropCategory
gosub :sub_SetMenu
openMenu "Gather"

:Menu_Quantity
getInput $value "Enter the quantity to gather"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_StealFactor
end
setVar $gather_quantity $value

saveVar $gather_quantity
gosub :sub_SetMenu
openMenu "Gather"

:Menu_HaggleFactor
if ($gather_haggle = 1)
  setVar $gather_haggle 0
else
  setVar $gather_haggle 1
end

saveVar $gather_haggle
gosub :sub_SetMenu
openMenu "Gather"


:Menu_Go

# get planet ID
send "dq"
setTextLineTrigger getPlanet :getPlanet "Planet #"
pause
:getPlanet
getWord CURRENTLINE $planet 2
getWord CURRENTLINE $sector 5
stripText $sector ":"
stripText $planet "#"

if ($gather_haggle = 1)
  setVar $Haggle~HaggleFactor 8
else
  setVar $Haggle~HaggleFactor 0
end

setVar $Gather~Product $gather_product
setVar $Gather~DestCategory $gather_dropCategory
setVar $Gather~PlanetID $planet
setVar $Gather~Quantity $gather_quantity
setVar $Gather~Seek $gather_seek
setVar $Gather~StayOnPlanet 1
setVar $Gather~IgnoreList $planet
setVar $Gather~Sector $sector

gosub :Gather~Gather
send "*"
halt



:sub_SetMenu
  if ($gather_product = 1)
    setMenuValue "Product" "FUEL ORE"
  elseif ($gather_product = 2)
    setMenuValue "Product" "ORGANICS"
  elseif ($gather_product = 3)
    setMenuValue "Product" "EQUIPMENT"
  else
    setMenuValue "Product" "COLONISTS"
  end
  
  if ($gather_dropCategory = 1)
    setMenuValue "DropCategory" "FUEL ORE"
  elseif ($gather_dropCategory = 2)
    setMenuValue "DropCategory" "ORGANICS"
  else
    setMenuValue "DropCategory" "EQUIPMENT"
  end
  
  if ($gather_haggle = 1)
    setMenuValue "Haggle" "ON"
  else
    setMenuValue "Haggle" "OFF"
  end
  
  if ($gather_seek = 1)
    setMenuValue "Seek" "YES"
  else
    setMenuValue "Seek" "NO"
  end
  
  setMenuValue "Quantity" $gather_quantity
  
  return


# includes:

include "include\header"
include "include\gather"
