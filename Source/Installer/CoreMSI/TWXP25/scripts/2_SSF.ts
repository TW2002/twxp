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
loadVar $SSFSaved

if ($SSFSaved)
  loadVar $SSF_Haggle
  loadVar $SSF~ThisTrigger
  loadVar $SSF~OtherTrigger
  loadVar $SSF~TurnLimit
  loadVar $SSF~DamageLimit
  loadVar $SSF_Broadcast
else
  setVar $SSF_Haggle 1
  setVar $SSF~ThisTrigger "PING_1"
  setVar $SSF~OtherTrigger "PING_2"
  setVar $SSF~TurnLimit 30
  setVar $SSF~DamageLimit 15
  setVar $SSF_Broadcast 1
  
  saveVar $SSF_Haggle
  saveVar $SSF~TurnLimit
  saveVar $SSF~ThisTrigger
  saveVar $SSF~OtherTrigger
  saveVar $SSF~DamageLimit
  saveVar $SSF_Broadcast

  setVar $SSFSaved 1
  saveVar $SSFSaved
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
addMenu "" "SSF" "SSF Settings" "." "" "Main" FALSE
addMenu "SSF" "GO" "GO!" "G" :Menu_Go "" TRUE
addMenu "SSF" "Haggle" "Haggling" "H" :Menu_Haggle "" FALSE
addMenu "SSF" "ThisTrigger" "Ping trigger here" "P" :Menu_ThisTrigger "" FALSE
addMenu "SSF" "OtherTrigger" "Ping trigger other" "O" :Menu_OtherTrigger "" FALSE
addMenu "SSF" "TurnLimit" "Turn limit" "T" :Menu_TurnLimit "" FALSE
addMenu "SSF" "DamageLimit" "Damage limit" "D" :Menu_DamageLimit "" FALSE
addMenu "SSF" "Broadcast" "Broadcast busts on radio" "B" :Menu_Broadcast "" FALSE
addMenu "SSF" "StealFactor" "Steal factor" "S" :Menu_StealFactor "" FALSE

setMenuHelp "ThisTrigger" "This option lets you set the text the script will send on the radio when it needs to be 'pinged' out of this sector."
setMenuHelp "OtherTrigger" "This option lets you set the text the script will send on the radio when it needs to be 'pinged' out of the other sector."
setMenuHelp "TurnLimit" "This option lets you set a turn limit for the script.  The script will terminate before your turns fall below this limit."
setMenuHelp "DamageLimit" "This option lets you configure a damage limit for the script.  The script will terminate before your fighters+shield fall below this level."
setMenuHelp "Broadcast" "If this option is enabled, the script will broadcast bust details on the radio for your teammates to read."
setMenuHelp "StealFactor" "This option lets you set the steal-factor for any steals made by the script.  This factor controls the quantity of product the script believes it is able to safely steal without a high chance of being busted.  Usually, the steal factor is set to 30 for standard TWGS, and 21 for MBBS compatibility mode."
setMenuHelp "Haggle" "If this option is enabled, the script will always try to haggle for the best possible price."

gosub :sub_SetMenu

# open config menu
openMenu "SSF"

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
openMenu "SSF"

:Menu_Haggle
if ($SSF_Haggle)
  setVar $SSF_Haggle 0
else
  setVar $SSF_Haggle 1
end
saveVar $SSF_Haggle
gosub :sub_SetMenu
openMenu "SSF"

:Menu_ThisTrigger
getInput $SSF~ThisTrigger "Enter text to broadcast in this sector to trigger a 'ping' (or leave blank to disable)"
saveVar $SSF~ThisTrigger
gosub :sub_SetMenu
openMenu "SSF"

:Menu_OtherTrigger
getInput $SSF~OtherTrigger "Enter text to broadcast in other sector to trigger a 'ping' (or leave blank to disable)"
saveVar $SSF~OtherTrigger
gosub :sub_SetMenu
openMenu "SSF"

:Menu_TurnLimit
getInput $value "Enter a turn limit"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_TurnLimit
end
setVar $SSF~TurnLimit $value
saveVar $SSF~TurnLimit
gosub :sub_SetMenu
openMenu "SSF"

:Menu_DamageLimit
getInput $value "Enter a damage limit"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_DamageLimit
end
setVar $SSF~DamageLimit $value
saveVar $SSF~DamageLimit
gosub :sub_SetMenu
openMenu "SSF"

:Menu_Broadcast
if ($SSF_Broadcast)
  setVar $SSF_Broadcast 0
else
  setVar $SSF_Broadcast 1
end
saveVar $SSF_Broadcast
gosub :sub_SetMenu
openMenu "SSF"

:Menu_Go
setEventTrigger disconnect :disconnected "Connection lost"
gosub :PlayerInfo~InfoQuick

if ($SSF_Haggle)
  setVar $Haggle~HaggleFactor 8
else
  setVar $Haggle~HaggleFactor 0
end

setVar $startTurns $PlayerInfo~Turns
setVar $startCredits $PlayerInfo~Credits
setVar $startFigs $PlayerInfo~Fighters
setVar $startShield $PlayerInfo~Shields
gosub :SSF~SSF
gosub :PlayerInfo~InfoQuick

setVar $profit ($PlayerInfo~Credits - $startCredits)
setVar $turnsUsed ($startTurns - $PlayerInfo~Turns)
setVar $damage (($startFigs + $startShield) - ($PlayerInfo~Fighters + $PlayerInfo~Shields))

if ($turnsUsed = 0)
  setVar $efficiency $profit
else
  setVar $efficiency ($profit / $turnsUsed)
end

if ($SSF_Broadcast)
  if ($SSF~Result = 0)
    send "'Turn limit hit"
  elseif ($SSF~Result = 1)
    send "'Damage limit hit"
  elseif ($SSF~Result = 2)
    send "'Busted"
  else
    send "'Errored"
  end
  
  send ".  Holds lost: " $SSF~HoldsLost "   Turns used: " $turnsUsed "   Profit: " $profit "   Efficiency: " $efficiency " $/turn" "   Damage: " $damage "*"
end

halt

:sub_SetMenu
  if ($SSF_Broadcast)
    setMenuValue "Broadcast" "YES"
  else
    setMenuValue "Broadcast" "NO"
  end
  
  if ($SSF_Haggle)
    setMenuValue "Haggle" "YES"
  else
    setMenuValue "Haggle" "NO"
  end
  
  setMenuValue "ThisTrigger" $SSF~ThisTrigger
  setMenuValue "OtherTrigger" $SSF~OtherTrigger
  setMenuValue "TurnLimit" $SSF~TurnLimit
  setMenuValue "DamageLimit" $SSF~DamageLimit
  setMenuValue "StealFactor" $SellSteal~StealFactor
  
  return
  

:disconnected
  # disconnected.  Terminate script
  halt
  

# includes:
include "include\header"
include "include\SSF"
include "include\playerInfo"

