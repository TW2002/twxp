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

setVar $Header~Script "SDF"

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
loadVar $SDFSaved

if ($SDFSaved)
  loadVar $SDF~ThisHaggleFactor
  loadVar $SDF~OtherHaggleFactor
  loadVar $SDF~ThisTrigger
  loadVar $SDF~OtherTrigger
  loadVar $SDF~TurnLimit
  loadVar $SDF~ThisPlanet
  loadVar $SDF~OtherPlanet
  loadVar $SDF~DamageLimit
  loadVar $SDF_Broadcast
else
  setVar $SDF~ThisHaggleFactor 5
  setVar $SDF~OtherHaggleFactor 5
  setVar $SDF~ThisTrigger "PING_1"
  setVar $SDF~OtherTrigger "PING_2"
  setVar $SDF~TurnLimit 30
  setVar $SDF~ThisPlanet 0
  setVar $SDF~OtherPlanet 0
  setVar $SDF~DamageLimit 15
  setVar $SDF_Broadcast 1
  
  saveVar $SDF~ThisHaggleFactor
  saveVar $SDF~OtherHaggleFactor
  saveVar $SDF~ThisTrigger
  saveVar $SDF~OtherTrigger
  saveVar $SDF~TurnLimit
  saveVar $SDF~ThisPlanet
  saveVar $SDF~OtherPlanet
  saveVar $SDF~DamageLimit
  saveVar $SDF_Broadcast

  setVar $SDFSaved 1
  saveVar $SDFSaved
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
addMenu "" "SDF" "SDF Settings" "." "" "Main" FALSE
addMenu "SDF" "GO" "GO!" "G" :Menu_Go "" TRUE
addMenu "SDF" "ThisHaggleFactor" "Haggle factor here" "H" :Menu_ThisHaggleFactor "" FALSE
addMenu "SDF" "OtherHaggleFactor" "Haggle factor other" "F" :Menu_OtherHaggleFactor "" FALSE
addMenu "SDF" "ThisTrigger" "Ping trigger here" "E" :Menu_ThisTrigger "" FALSE
addMenu "SDF" "OtherTrigger" "Ping trigger other" "O" :Menu_OtherTrigger "" FALSE
addMenu "SDF" "TurnLimit" "Turn limit" "T" :Menu_TurnLimit "" FALSE
addMenu "SDF" "ThisPlanet" "Drop planet here" "P" :Menu_ThisPlanet "" FALSE
addMenu "SDF" "OtherPlanet" "Drop planet other" "L" :Menu_OtherPlanet "" FALSE
addMenu "SDF" "DamageLimit" "Damage limit" "D" :Menu_DamageLimit "" FALSE
addMenu "SDF" "Broadcast" "Broadcast busts on radio" "B" :Menu_Broadcast "" FALSE
addMenu "SDF" "StealFactor" "Steal factor" "S" :Menu_StealFactor "" FALSE

setMenuHelp "ThisHaggleFactor" "This option lets you set the haggle factor to be used for the port in your current sector.  Usually a haggle factor of about 5 is good for planet sales - but this will vary depending upon the port.  If the port rejects alot of your prices, you may want to turn the haggle factor down."
setMenuHelp "OtherHaggleFactor" "This option lets you set the haggle factor to be used for the other port you are SDFing with.  Usually a haggle factor of about 5 is good for planet sales - but this will vary depending upon the port.  If the port rejects alot of your prices, you may want to turn the haggle factor down."
setMenuHelp "ThisTrigger" "This option lets you set the text the script will send on the radio when it needs to be 'pinged' out of this sector."
setMenuHelp "OtherTrigger" "This option lets you set the text the script will send on the radio when it needs to be 'pinged' out of the other sector."
setMenuHelp "TurnLimit" "This option lets you set a turn limit for the script.  The script will terminate before your turns fall below this limit."
setMenuHelp "ThisPlanet" "This option lets you set the ID number of the planet you want to drop equipment on in your current sector.  If left blank, this will default to the first planet in the sector."
setMenuHelp "OtherPlanet" "This option lets you set the ID number of the planet you want to drop equipment on in the other sector.  If left blank, this will default to the first planet in the sector."
setMenuHelp "DamageLimit" "This option lets you configure a damage limit for the script.  The script will terminate before your fighters+shield fall below this level."
setMenuHelp "Broadcast" "If this option is enabled, the script will broadcast bust details on the radio for your teammates to read."
setMenuHelp "StealFactor" "This option lets you set the steal-factor for any steals made by the script.  This factor controls the quantity of product the script believes it is able to safely steal without a high chance of being busted.  Usually, the steal factor is set to 30 for standard TWGS, and 21 for MBBS compatibility mode."

gosub :sub_SetMenu

# open config menu
openMenu "SDF"

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
openMenu "SDF"

:Menu_ThisHaggleFactor
getInput $value "Enter the haggle factor for this location"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_ThisHaggleFactor
end
setVar $SDF~ThisHaggleFactor $value
saveVar $SDF~ThisHaggleFactor
gosub :sub_SetMenu
openMenu "SDF"

:Menu_OtherHaggleFactor
getInput $value "Enter the haggle factor for the other location"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_OtherHaggleFactor
end
setVar $SDF~OtherHaggleFactor $value
saveVar $SDF~OtherHaggleFactor
gosub :sub_SetMenu
openMenu "SDF"

:Menu_ThisTrigger
getInput $SDF~ThisTrigger "Enter text to broadcast in this sector to trigger a 'ping' (or leave blank to disable)"
saveVar $SDF~ThisTrigger
gosub :sub_SetMenu
openMenu "SDF"

:Menu_OtherTrigger
getInput $SDF~OtherTrigger "Enter text to broadcast in other sector to trigger a 'ping' (or leave blank to disable)"
saveVar $SDF~OtherTrigger
gosub :sub_SetMenu
openMenu "SDF"

:Menu_TurnLimit
getInput $value "Enter a turn limit"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_TurnLimit
end
setVar $SDF~TurnLimit $value
saveVar $SDF~TurnLimit
gosub :sub_SetMenu
openMenu "SDF"

:Menu_ThisPlanet
getInput $value "Enter the ID of the planet here to dump products on (0 for the first one)"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_ThisPlanet
end
setVar $SDF~ThisPlanet $value
saveVar $SDF~ThisPlanet
gosub :sub_SetMenu
openMenu "SDF"

:Menu_OtherPlanet
getInput $value "Enter the ID of the planet in the other sector to dump products on (0 for the first one)"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_OtherPlanet
end
setVar $SDF~OtherPlanet $value
saveVar $SDF~OtherPlanet
gosub :sub_SetMenu
openMenu "SDF"

:Menu_DamageLimit
getInput $value "Enter a damage limit"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_DamageLimit
end
setVar $SDF~DamageLimit $value
saveVar $SDF~DamageLimit
gosub :sub_SetMenu
openMenu "SDF"

:Menu_Broadcast
if ($SDF_Broadcast)
  setVar $SDF_Broadcast 0
else
  setVar $SDF_Broadcast 1
end
saveVar $SDF_Broadcast
gosub :sub_SetMenu
openMenu "SDF"

:Menu_Go
setEventTrigger disconnect :disconnected "Connection lost"
gosub :PlayerInfo~InfoQuick
setVar $startTurns $PlayerInfo~Turns
setVar $startCredits $PlayerInfo~Credits
setVar $StealDump~StealFactor $SellSteal~StealFactor
setVar $startFigs $PlayerInfo~Fighters
setVar $startShield $PlayerInfo~Shields
gosub :SDF~SDF
gosub :PlayerInfo~InfoQuick

setVar $profit ($PlayerInfo~Credits - $startCredits)
setVar $turnsUsed ($startTurns - $PlayerInfo~Turns)
setVar $damage (($startFigs + $startShield) - ($PlayerInfo~Fighters + $PlayerInfo~Shields))

if ($turnsUsed = 0)
  setVar $efficiency $profit
else
  setVar $efficiency ($profit / $turnsUsed)
end

if ($SDF_Broadcast)
  if ($SDF~Result = 2)
    send "'Busted"
  elseif ($SDF~Result = 3)
    send "'Errored"
  elseif ($SDF~Result = 0)
    send "'Turn limit hit"
  else
    send "'Damage limit hit"
  end
  
  send ".  Holds lost: " $SDF~HoldsLost "   Turns used: " $turnsUsed "   Profit: " $profit "   Efficiency: " $efficiency " $/turn" "   Damage: " $damage "*"
end

halt

:sub_SetMenu
  if ($SDF~ThisPlanet = 0)
    setMenuValue "ThisPlanet" "FIRST ONE"
  else
    setMenuValue "ThisPlanet" $SDF~ThisPlanet
  end
  
  if ($SDF~OtherPlanet = 0)
    setMenuValue "OtherPlanet" "FIRST ONE"
  else
    setMenuValue "OtherPlanet" $SDF~OtherPlanet
  end
  
  if ($SDF_Broadcast)
    setMenuValue "Broadcast" "YES"
  else
    setMenuValue "Broadcast" "NO"
  end
  
  setMenuValue "ThisHaggleFactor" $SDF~ThisHaggleFactor
  setMenuValue "OtherHaggleFactor" $SDF~OtherHaggleFactor
  setMenuValue "ThisTrigger" $SDF~ThisTrigger
  setMenuValue "OtherTrigger" $SDF~OtherTrigger
  setMenuValue "TurnLimit" $SDF~TurnLimit
  setMenuValue "DamageLimit" $SDF~DamageLimit
  setMenuValue "StealFactor" $SellSteal~StealFactor
  
  return
  

:disconnected
  # disconnected.  Terminate script
  halt
  

# includes:
include "include\header"
include "include\SDF"
include "include\playerInfo"
