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

setVar $Header~Script "SDT"

# check location
cutText CURRENTLINE $location 1 12
if ($location <> "Command [TL=")
        clientMessage "This script must be run from the command menu"
        halt
end

reqRecording
logging off

gosub :Header~Pack2Header

# get defaults
loadVar $SDTSaved

if ($SDTSaved)
  loadVar $SDT~ThisHaggleFactor
  loadVar $SDT~OtherHaggleFactor
  loadVar $SDT~OtherShip
  loadVar $SDT~TurnLimit
  loadVar $SDT~ThisPlanet
  loadVar $SDT~OtherPlanet
  loadVar $SDT_Broadcast
else
  setVar $SDT~ThisHaggleFactor 5
  setVar $SDT~OtherHaggleFactor 5
  setVar $SDT~OtherShip 0
  setVar $SDT~TurnLimit 30
  setVar $SDT~ThisPlanet 0
  setVar $SDT~OtherPlanet 0
  setVar $SDT_Broadcast 1
  
  saveVar $SDT~ThisHaggleFactor
  saveVar $SDT~OtherHaggleFactor
  saveVar $SDT~OtherShip
  saveVar $SDT~TurnLimit
  saveVar $SDT~ThisPlanet
  saveVar $SDT~OtherPlanet
  saveVar $SDT_Broadcast

  setVar $SDTSaved 1
  saveVar $SDTSaved
end

loadVar $SellSteal~Saved

if ($SellSteal~Saved)
  loadVar $SellSteal~StealFactor
else
  setVar $SellSteal~StealFactor 30
  
  setVar $SellSteal~Saved 1
  saveVar $SellSteal~Saved
end

# create setup menu
addMenu "" "SDT" "SDT Settings" "." "" "Main" FALSE
addMenu "SDT" "GO" "GO!" "G" :Menu_Go "" TRUE
addMenu "SDT" "ThisHaggleFactor" "Haggle factor here" "H" :Menu_ThisHaggleFactor "" FALSE
addMenu "SDT" "OtherHaggleFactor" "Haggle factor other" "F" :Menu_OtherHaggleFactor "" FALSE
addMenu "SDT" "OtherShip" "Other ship" "I" :Menu_OtherShip "" FALSE
addMenu "SDT" "TurnLimit" "Turn limit" "T" :Menu_TurnLimit "" FALSE
addMenu "SDT" "ThisPlanet" "Drop planet here" "P" :Menu_ThisPlanet "" FALSE
addMenu "SDT" "OtherPlanet" "Drop planet other" "L" :Menu_OtherPlanet "" FALSE
addMenu "SDT" "Broadcast" "Broadcast busts on radio" "B" :Menu_Broadcast "" FALSE
addMenu "SDT" "StealFactor" "Steal factor" "S" :Menu_StealFactor "" FALSE

setMenuHelp "ThisHaggleFactor" "This option lets you set the haggle factor to be used for the port in your current sector.  Usually a haggle factor of about 5 is good for planet sales - but this will vary depending upon the port.  If the port rejects alot of your prices, you may want to turn the haggle factor down."
setMenuHelp "OtherHaggleFactor" "This option lets you set the haggle factor to be used for the other port you are SDTing with.  Usually a haggle factor of about 5 is good for planet sales - but this will vary depending upon the port.  If the port rejects alot of your prices, you may want to turn the haggle factor down."
setMenuHelp "TurnLimit" "This option lets you set a turn limit for the script.  The script will terminate before your turns fall below this limit."
setMenuHelp "ThisPlanet" "This option lets you set the ID number of the planet you want to drop equipment on in your current sector.  If left blank, this will default to the first planet in the sector."
setMenuHelp "OtherPlanet" "This option lets you set the ID number of the planet you want to drop equipment on in the other sector.  If left blank, this will default to the first planet in the sector."
setMenuHelp "Broadcast" "If this option is enabled, the script will broadcast bust details on the radio for your teammates to read."
setMenuHelp "StealFactor" "This option lets you set the steal-factor for any steals made by the script.  This factor controls the quantity of product the script believes it is able to safely steal without a high chance of being busted.  Usually, the steal factor is set to 30 for standard TWGS, and 21 for MBBS compatibility mode."
setMenuHelp "OtherShip" "This option lets you enter the ID number of the other ship you will be using for SDT."

gosub :sub_SetMenu

# open config menu
openMenu "SDT"

:Menu_StealFactor
getInput $value "Enter steal factor"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_StealFactor
end
if ($value < 0)
  echo ANSI_15 "**Bad percentage*"
  goto :Menu_StealFactor
end
setVar $SellSteal~StealFactor $value
saveVar $SellSteal~StealFactor
gosub :sub_SetMenu
openMenu "SDT"

:Menu_ThisHaggleFactor
getInput $value "Enter the haggle factor for this location"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_ThisHaggleFactor
end
setVar $SDT~ThisHaggleFactor $value
saveVar $SDT~ThisHaggleFactor
gosub :sub_SetMenu
openMenu "SDT"

:Menu_OtherHaggleFactor
getInput $value "Enter the haggle factor for the other location"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_OtherHaggleFactor
end
setVar $SDT~OtherHaggleFactor $value
saveVar $SDT~OtherHaggleFactor
gosub :sub_SetMenu
openMenu "SDT"

:Menu_OtherShip
getInput $value "Enter ID number of the other ship to SDT with"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_OtherShip
end
setVar $SDT~OtherShip $value
saveVar $SDT~OtherShip
gosub :sub_SetMenu
openMenu "SDT"

:Menu_TurnLimit
getInput $value "Enter a turn limit"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_TurnLimit
end
setVar $SDT~TurnLimit $value
saveVar $SDT~TurnLimit
gosub :sub_SetMenu
openMenu "SDT"

:Menu_ThisPlanet
getInput $value "Enter the ID of the planet here to dump products on (0 for the first one)"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_ThisPlanet
end
setVar $SDT~ThisPlanet $value
saveVar $SDT~ThisPlanet
gosub :sub_SetMenu
openMenu "SDT"

:Menu_OtherPlanet
getInput $value "Enter the ID of the planet in the other sector to dump products on (0 for the first one)"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_OtherPlanet
end
setVar $SDT~OtherPlanet $value
saveVar $SDT~OtherPlanet
gosub :sub_SetMenu
openMenu "SDT"

:Menu_Broadcast
if ($SDT_Broadcast)
  setVar $SDT_Broadcast 0
else
  setVar $SDT_Broadcast 1
end
saveVar $SDT_Broadcast
gosub :sub_SetMenu
openMenu "SDT"

:Menu_Go
setEventTrigger disconnect :disconnected "Connection lost"
gosub :PlayerInfo~InfoQuick
setVar $startTurns $PlayerInfo~Turns
setVar $startCredits $PlayerInfo~Credits
setVar $StealDump~StealFactor $SellSteal~StealFactor
gosub :SDT~SDT
gosub :PlayerInfo~InfoQuick

setVar $profit ($PlayerInfo~Credits - $startCredits)
setVar $turnsUsed ($startTurns - $PlayerInfo~Turns)

if ($turnsUsed = 0)
  setVar $efficiency $profit
else
  setVar $efficiency ($profit / $turnsUsed)
end

if ($SDT_Broadcast)
  if ($SDT~Result = 1)
    send "'Busted"
  elseif ($SDT~Result = 2)
    send "'Errored"
  else
    send "'Turn limit hit"
  end
  
  send ".  Ship: " $SDT~Ship "    Holds lost: " $SDT~HoldsLost "    Turns used: " $turnsUsed "    Profit: " $profit "    Efficiency: " $efficiency " $/turn*"
end

halt

:sub_SetMenu
  if ($SDT~ThisPlanet = 0)
    setMenuValue "ThisPlanet" "FIRST ONE"
  else
    setMenuValue "ThisPlanet" $SDT~ThisPlanet
  end
  
  if ($SDT~OtherPlanet = 0)
    setMenuValue "OtherPlanet" "FIRST ONE"
  else
    setMenuValue "OtherPlanet" $SDT~OtherPlanet
  end
  
  if ($SDT_Broadcast)
    setMenuValue "Broadcast" "YES"
  else
    setMenuValue "Broadcast" "NO"
  end
  
  setMenuValue "ThisHaggleFactor" $SDT~ThisHaggleFactor
  setMenuValue "OtherHaggleFactor" $SDT~OtherHaggleFactor
  setMenuValue "OtherShip" $SDT~OtherShip
  setMenuValue "TurnLimit" $SDT~TurnLimit
  setMenuValue "StealFactor" $SellSteal~StealFactor
  
  return
  

:disconnected
  # disconnected.  Terminate script
  halt
  

# includes:
include "include\header"
include "include\SDT"
include "include\playerInfo"
