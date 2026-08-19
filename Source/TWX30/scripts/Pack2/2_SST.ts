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

setVar $Header~Script "SST"

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
loadVar $SSTSaved

if ($SSTSaved)
  loadVar $SST_Haggle
  loadVar $SST~OtherShip
  loadVar $SST~TurnLimit
  loadVar $SST_Broadcast
else
  setVar $SST_Haggle 1
  setVar $SST~OtherShip 0
  setVar $SST~TurnLimit 30
  setVar $SST_Broadcast 1
  
  saveVar $SST_Haggle
  saveVar $SST~OtherShip
  saveVar $SST~TurnLimit
  saveVar $SST_Broadcast

  setVar $SSTSaved 1
  saveVar $SSTSaved
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
addMenu "" "SST" "SST Settings" "." "" "Main" FALSE
addMenu "SST" "GO" "GO!" "G" :Menu_Go "" TRUE
addMenu "SST" "Haggle" "Haggling" "H" :Menu_Haggle "" FALSE
addMenu "SST" "OtherShip" "Other ship" "I" :Menu_OtherShip "" FALSE
addMenu "SST" "TurnLimit" "Turn limit" "T" :Menu_TurnLimit "" FALSE
addMenu "SST" "Broadcast" "Broadcast busts on radio" "B" :Menu_Broadcast "" FALSE
addMenu "SST" "StealFactor" "Steal factor" "S" :Menu_StealFactor "" FALSE

setMenuHelp "TurnLimit" "This option lets you set a turn limit for the script.  The script will terminate before your turns fall below this limit."
setMenuHelp "Broadcast" "If this option is enabled, the script will broadcast bust details on the radio for your teammates to read."
setMenuHelp "StealFactor" "This option lets you set the steal-factor for any steals made by the script.  This factor controls the quantity of product the script believes it is able to safely steal without a high chance of being busted.  Usually, the steal factor is set to 30 for standard TWGS, and 21 for MBBS compatibility mode."
setMenuHelp "OtherShip" "This option lets you enter the ID number of the other ship you will be using for SST."
setMenuHelp "Haggle" "If this option is enabled, the script will always try to haggle for the best possible price."

gosub :sub_SetMenu

# open config menu
openMenu "SST"

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
openMenu "SST"

:Menu_Haggle
if ($SST_Haggle)
  setVar $SST_Haggle 0
else
  setVar $SST_Haggle 1
end

saveVar $SST_Haggle
gosub :sub_SetMenu
openMenu "SST"

:Menu_OtherShip
getInput $value "Enter ID number of the other ship to SST with"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_OtherShip
end
setVar $SST~OtherShip $value
saveVar $SST~OtherShip
gosub :sub_SetMenu
openMenu "SST"

:Menu_TurnLimit
getInput $value "Enter a turn limit"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_TurnLimit
end
setVar $SST~TurnLimit $value
saveVar $SST~TurnLimit
gosub :sub_SetMenu
openMenu "SST"

:Menu_Broadcast
if ($SST_Broadcast)
  setVar $SST_Broadcast 0
else
  setVar $SST_Broadcast 1
end
saveVar $SST_Broadcast
gosub :sub_SetMenu
openMenu "SST"

:Menu_Go
setEventTrigger disconnect :disconnected "Connection lost"
gosub :PlayerInfo~InfoQuick
setVar $startTurns $PlayerInfo~Turns
setVar $startCredits $PlayerInfo~Credits
setVar $StealDump~StealFactor $SellSteal~StealFactor

if ($SST_Haggle)
  setVar $Haggle~HaggleFactor 8
else
  setVar $Haggle~HaggleFactor 0
end

gosub :SST~SST
gosub :PlayerInfo~InfoQuick

setVar $profit ($PlayerInfo~Credits - $startCredits)
setVar $turnsUsed ($startTurns - $PlayerInfo~Turns)

if ($turnsUsed = 0)
  setVar $efficiency $profit
else
  setVar $efficiency ($profit / $turnsUsed)
end


if ($SST_Broadcast)
  if ($SST~Result = 1)
    send "'Busted"
  elseif ($SST~Result = 2)
    send "'Errored"
  else
    send "'Turn limit hit"
  end
  
  send ".  Ship: " $SST~Ship "    Holds lost: " $SST~HoldsLost "    Turns used: " $turnsUsed "    Profit: " $profit "    Efficiency: " $efficiency " $/turn*"
end

halt

:sub_SetMenu
  if ($SST_Broadcast)
    setMenuValue "Broadcast" "YES"
  else
    setMenuValue "Broadcast" "NO"
  end
  
  if ($SST_Haggle)
    setMenuValue "Haggle" "YES"
  else
    setMenuValue "Haggle" "NO"
  end
  
  setMenuValue "OtherShip" $SST~OtherShip
  setMenuValue "TurnLimit" $SST~TurnLimit
  setMenuValue "StealFactor" $SellSteal~StealFactor
  
  return
  

:disconnected
  # disconnected.  Terminate script
  halt
  

# includes:
include "include\header"
include "include\SST"
include "include\gamePrefs"
include "include\playerInfo"

