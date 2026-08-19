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

setVar $Header~Script "Colonisation"

# check location
cutText CURRENTLINE $location 1 23
if ($location <> "Planet command (?=help)")
  clientMessage "This script must be run from the surface of a planet"
  halt
end

reqRecording
logging off

gosub :Header~Pack2Header

# get defaults
loadVar $ColSaved

if ($ColSaved)
  loadVar $Col_Method
  loadVar $Col_Category
  loadVar $Col_TurnLimit
  loadVar $Col_CycleLimit
  loadVar $Col_FuelSource
  loadVar $Col_Overload
else
  setVar $Col_Method 1
  setVar $Col_Category 1
  setVar $Col_TurnLimit 20
  setVar $Col_CycleLimit 0
  setVar $Col_FuelSource P
  setVar $Col_Overload 0
  
  saveVar $Col_Method
  saveVar $Col_Category
  saveVar $Col_TurnLimit
  saveVar $Col_CycleLimit
  saveVar $Col_FuelSource
  saveVar $Col_Overload

  setVar $ColSaved 1
  saveVar $ColSaved
end

# create setup menu
addMenu "" "Col" "Colonisation Settings" "." "" "Main" FALSE
addMenu "Col" "GO" "GO!" "G" :Menu_Go "" TRUE
addMenu "Col" "Method" "Method" "M" :Menu_Method "" FALSE
addMenu "Col" "Category" "Drop Category" "D" :Menu_Category "" FALSE
addMenu "Col" "TurnLimit" "Turn Limit" "T" :Menu_TurnLimit "" FALSE
addMenu "Col" "CycleLimit" "Cycle Limit" "C" :Menu_CycleLimit "" FALSE
addMenu "Col" "FuelSource" "Fuel Source" "F" :Menu_FuelSource "" FALSE
addMenu "Col" "Overload" "Overload Planet" "O" :Menu_Overload "" FALSE

setMenuHelp "Method" "This option lets you set the colonising method that will be used.  There are three settings.**EXPRESS-WARP: The script will express-warp to and from terra, dropping off colonists without the need for TWarp fuel.*T-WARP: The script will use the transwarp drive on your ship to shortcut its colonising.*T-PAD: The script will use the planetary transporter on a planet in the same sector to teleport itself to terra, then will use your ship's transwarp drive to return with colonists."
setMenuHelp "Category" "This option lets you choose the drop category for colonists.  This can be Fuel Ore, Organics or Equipment."
setMenuHelp "TurnLimit" "This option lets you configure a turn limiter for the script.  The script will terminate before your turns fall below this point."
setMenuHelp "CycleLimit" "This option lets you configure a cycle limit for the script.  The script will terminate when it has repeated itself this many times."
setMenuHelp "Overload" "If this option is enabled, the script will overload the planet past its maximum productive quantity of colonists.  With this disabled, the script will terminate before it impairs the planet's production."
setMenuHelp "FuelSource" "The fuelsource option lets you configure where the script will get its fuel from.  If the script is using the T-Warp method for colonising, it will automatically take fuel from this planet number as it colonises.  If the script is using the T-Pad method for colonising, it will use a transporter pad on this planet number AND take fuel from it as it colonises.  The fuel source must be the number of a valid planet in the same sector as the planet you are colonising - you can also enter 'P' to get fuel from the port, or 'T' to get fuel from the same planet as the one you are colonising."

gosub :sub_SetMenu

# open config menu
openMenu "Col"

:Menu_Method
if ($Col_Method < 2)
  add $Col_Method 1
else
  setVar $Col_Method 0
end
saveVar $Col_Method
gosub :sub_SetMenu
openMenu "Col"

:Menu_Category
if ($Col_Category < 2)
  add $Col_Category 1
else
  setVar $Col_Category 0
end
saveVar $Col_Category
gosub :sub_SetMenu
openMenu "Col"

:Menu_TurnLimit
getInput $value "Enter a turn limit"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_TurnLimit
end
setVar $Col_TurnLimit $value
saveVar $Col_TurnLimit
gosub :sub_SetMenu
openMenu "Col"

:Menu_CycleLimit
getInput $value "Enter a cycle limit (0 for none)"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_CycleLimit
end
setVar $Col_CycleLimit $value
saveVar $Col_CycleLimit
gosub :sub_SetMenu
openMenu "Col"

:Menu_FuelSource
getInput $Col_FuelSource "Enter the ID of the planet to take fuel from ('P' to get fuel from port, or 'T' to get fuel from target planet)"
if ($Col_FuelSource = "p")
  setVar $Col_FuelSource "P"
elseif ($Col_FuelSource = "t")
  setVar $Col_FuelSource "T"
end
saveVar $Col_FuelSource
gosub :sub_SetMenu
openMenu "Col"

:Menu_Overload
if ($Col_Overload)
  setVar $Col_Overload 0
else
  setVar $Col_Overload 1
end
saveVar $Col_Overload
gosub :sub_SetMenu
openMenu "Col"

:Menu_Go
setEventTrigger disconnect :disconnected "Connection lost"
setVar $Colonise~Method $Col_Method
setVar $Colonise~FuelSource $Col_FuelSource
setVar $Colonise~Category $Col_Category
setVar $Colonise~TurnLimit $Col_TurnLimit
setVar $Colonise~CycleLimit $Col_CycleLimit
setVar $Colonise~FastStart 0
setVar $Colonise~Overload $Col_Overload
gosub :Colonise~Colonise

if ($Colonise~Result = 0)
  clientMessage "Planet is full to maximum productive capacity"
elseif ($Colonise~Result = 1)
  clientMessage "Terra is out of colonists"
elseif ($Colonise~Result = 2)
  clientMessage "Out of fuel"
elseif ($Colonise~Result = 3)
  clientMessage "Cycle limit or quota hit"
elseif ($Colonise~Result = 4)
  clientMessage "Turn limit hit"
elseif ($Colonise~Result = 6)
  clientMessage "Out of cash while buying from port"
elseif ($Colonise~Result = 8)
  clientMessage "TWarp return to planet is blocked"
elseif ($Colonise~Result = 9)
  clientMessage "Unable to TWarp to fedspace (alignment is too low)"
elseif ($Colonise~Result = 10)
  clientMessage "Unable to TWarp to this sector - no fighter is in place"
end

halt

:sub_SetMenu
  if ($Col_Method = 0)
    setMenuValue "Method" "EXPRESS-WARP"
  elseif ($Col_Method = 1)
    setMenuValue "Method" "T-WARP"
  else
    setMenuValue "Method" "T-PAD"
  end
  
  if ($Col_Category = 1)
    setMenuValue "Category" "FUEL ORE"
  elseif ($Col_Category = 2)
    setMenuValue "Category" "ORGANICS"
  else
    setMenuValue "Category" "EQUIPMENT"
  end
  
  if ($Col_FuelSource = "P")
    setMenuValue "FuelSource" "PORT"
  elseif ($Col_FuelSource = "T")
    setMenuValue "FuelSource" "TARGET PLANET"
  else
    setMenuValue "FuelSource" "PLANET #" & $Col_FuelSource
  end
  
  if ($Col_CycleLimit > 0)
    setMenuValue "CycleLimit" $Col_CycleLimit
  else
    setMenuValue "CycleLimit" "NONE"
  end

  if ($Col_Overload)
    setMenuValue "Overload" "YES"
  else
    setMenuValue "Overload" "NO"
  end
  
  setMenuValue "TurnLimit" $Col_TurnLimit
  
  return
  

:disconnected
  # disconnected.  Terminate script
  halt
  

# includes:
include "include\header"
include "include\Colonise"


