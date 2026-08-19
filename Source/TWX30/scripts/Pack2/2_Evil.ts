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

setVar $Header~Script "Evil"

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
loadVar $EvilSaved

if ($EvilSaved)
  loadVar $evil_stealFactor
  loadVar $evil_robFactor
  loadVar $evil_continue
  loadVar $evil_broadcast
  loadVar $evil_shipsetup
  loadVar $evil_haggle
else
  setVar $evil_stealFactor 30
  setVar $evil_robFactor 3
  setVar $evil_continue 1
  setVar $evil_broadcast 1
  setVar $evil_shipSetup ""
  setVar $evil_haggle 1
  
  saveVar $evil_stealFactor
  saveVar $evil_robFactor
  saveVar $evil_continue
  saveVar $evil_broadcast
  saveVar $evil_shipSetup
  saveVar $evil_haggle
  
  setVar $EvilSaved 1
  saveVar $EvilSaved
end

# create setup menu
addMenu "" "Evil" "Evil Settings" "." "" "Main" FALSE
addMenu "Evil" "GO" "GO!" "G" :Menu_Go "" TRUE
addMenu "Evil" "StealFactor" "Steal Factor" "S" :Menu_StealFactor "Steal Factor" FALSE
addMenu "Evil" "RobFactor" "Rob Factor" "R" :Menu_RobFactor "Rob Factor" FALSE
addMenu "Evil" "Continue" "Continue on Bust" "C" :Menu_Continue "" FALSE
addMenu "Evil" "Broadcast" "Broadcast Busts on Radio" "B" :Menu_Broadcast "" FALSE
addMenu "Evil" "Haggling" "Haggling" "H" :Menu_Haggling "Haggling" FALSE
addMenu "Evil" "ShipSetup" "Ship Setup" "I" "" "Ships" FALSE
addMenu "ShipSetup" "QuickSetup" "Quick Setup" "U" :Menu_Ships_QuickSetup "Quick Setup" FALSE
addMenu "ShipSetup" "List" "List Ships" "L" :Menu_Ships_List "" FALSE
addMenu "ShipSetup" "Add" "Add Ship" "A" :Menu_Ships_Add "Add" FALSE
addMenu "ShipSetup" "Remove" "Remove Ship" "R" :Menu_Ships_Remove "Remove" FALSE
addMenu "ShipSetup" "Clear" "Clear Ships" "C" :Menu_Ships_Clear "" FALSE
addMenu "ShipSetup" "Show" "Show Game Ships" "S" :Menu_Ships_Show "" FALSE
addMenu "" "ShipOp" "Select Operation" "." "" "Op" FALSE
addMenu "ShipOp" "RTR" "RTR (Rob-Transport-Rob)" "R" :Menu_ShipOp_RTR "" FALSE
addMenu "ShipOp" "SDT" "SDT (Steal-Dump-Transport)" "D" :Menu_ShipOp_SDT "" FALSE
addMenu "ShipOp" "SST" "SST (Sell-Steal-Transport)" "S" :Menu_ShipOp_SST "" FALSE

setMenuHelp "StealFactor" "This option lets you set the steal-factor for any steals made by the script.  This factor controls the quantity of product the script believes it is able to safely steal without a high chance of being busted.  Usually, the steal factor is set to 30 for standard TWGS, and 21 for MBBS compatibility mode."
setMenuHelp "RobFactor" "This option lets you set the rob-factor for any robbing done by the script.  The amount of credits robbed by the script will always be this value multiplied by your player experience.  Typically, the safest amount to rob is with a factor of 3 for TWGS, or 6 for MBBS compatibility mode."
setMenuHelp "Continue" "If this option is enabled, the script will continue with any remaining ships if it is busted.  The script will terminate if less than two unbusted ships are available."
setMenuHelp "Broadcast" "If this option is enabled, the script will broadcast messages on sub-space informing teammates of busts."
setMenuHelp "Haggling" "If this option is enabled, the script will attempt to haggle all port and planet sales for SST/SDT to get the best possible price."
setMenuHelp "ShipSetup" "This will take you to a menu that will let you configure the ships that will be used by the script."
setMenuHelp "QuickSetup" "This option will let you enter in a code to quickly configure your ships.  This is just an alternative way of setting things up - you can also use the other menu options to add and remove ships from the work list."
setMenuHelp "List" "This option will list all the ships you have entered into your work list."
setMenuHelp "Add" "This option will add a ship to your work list."
setMenuHelp "Remove" "This option will remove a ship from your work list."
setMenuHelp "Clear" "This option will completely clear your work list, allowing you to configure your ships from scratch."
setMenuHelp "Show" "This option will send the commands CZQ to the game, showing you a list of all the ships owned by you or your corporation."

gosub :sub_SetMenu

# open config menu
openMenu "Evil"

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
setVar $evil_stealFactor $value
saveVar $evil_stealFactor
gosub :sub_SetMenu
openMenu "Evil"

:Menu_RobFactor
getInput $value "Enter rob factor"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_RobFactor
end
if ($value < 0)
  echo ANSI_15 "**Bad percentage*"
  goto :Menu_RobFactor
end
setVar $evil_robFactor $value
saveVar $evil_robFactor
gosub :sub_SetMenu
openMenu "Evil"

:Menu_Continue
if ($evil_continue)
  setVar $evil_continue 0
else
  setVar $evil_continue 1
end

saveVar $evil_continue
gosub :sub_SetMenu
openMenu "Evil"

:Menu_Broadcast
if ($evil_broadcast)
  setVar $evil_broadcast 0
else
  setVar $evil_broadcast 1
end

saveVar $evil_broadcast
gosub :sub_SetMenu
openMenu "Evil"

:Menu_Haggling
if ($evil_haggle)
  setVar $evil_haggle 0
else
  setVar $evil_haggle 1
end

saveVar $evil_haggle
gosub :sub_SetMenu
openMenu "Evil"

:Menu_Ships_QuickSetup
getInput $evil_shipSetup "Enter ship setup code"
upperCase $evil_shipSetup
saveVar $evil_shipSetup
gosub :sub_SetMenu
openMenu "ShipSetup"

:Menu_Ships_List
# decode and display ship setup

echo "**" ANSI_15 "ShipID" #9 "Operation*----------------------*" ANSI_7

setVar $i 1
getWord $evil_shipSetup $set $i
getLength $set $len
while (($set <> 0) and ($len > 1))
  cutText $set $op 1 1
  cutText $set $id 2 $len
  
  if ($op = "R")
    setVar $op "RTR"
  elseif ($op = "S")
    setVar $op "SST"
  else
    setVar $op "SDT"
  end
  
  echo $id #9 $op "*"
  
  add $i 1
  getWord $evil_shipSetup $set $i
end

echo "**"

openMenu "ShipSetup"

:Menu_Ships_Add
getInput $id "Enter ship ID"
openMenu "ShipOp"

:Menu_ShipOp_RTR
if ($evil_shipSetup = "")
  setVar $evil_shipSetup "R" & $id  
else
  setVar $evil_shipSetup $evil_shipSetup & " " & "R" & $id
end

saveVar $evil_shipSetup
gosub :sub_SetMenu
openMenu "ShipSetup"

:Menu_ShipOp_SST
if ($evil_shipSetup = "")
  setVar $evil_shipSetup "S" & $id  
else
  setVar $evil_shipSetup $evil_shipSetup & " " & "S" & $id
end

saveVar $evil_shipSetup
gosub :sub_SetMenu
openMenu "ShipSetup"

:Menu_ShipOp_SDT
if ($evil_shipSetup = "")
  setVar $evil_shipSetup "D" & $id  
else
  setVar $evil_shipSetup $evil_shipSetup & " " & "D" & $id
end

saveVar $evil_shipSetup
gosub :sub_SetMenu
openMenu "ShipSetup"

:Menu_Ships_Remove
getInput $removeId "Enter ship ID to remove"

setVar $newShipSetup ""
setVar $i 1
getWord $evil_shipSetup $set $i
getLength $set $len
while (($set <> 0) and ($len > 1))
  cutText $set $id 2 $len
  
  if ($id <> $removeId)
    if ($newShipSetup = "")
      setVar $newShipSetup $set
    else    
      setVar $newShipSetup $newShipSetup & " " & $set
    end
  end
  
  add $i 1
  getWord $evil_shipSetup $set $i
end

setVar $evil_shipSetup $newShipSetup
saveVar $evil_shipSetup
gosub :sub_SetMenu
openMenu "ShipSetup"

:Menu_Ships_Clear
setVar $evil_shipSetup ""
saveVar $evil_shipSetup
gosub :sub_SetMenu
openMenu "ShipSetup"

:Menu_Ships_Show
send "czq"
waitOn "<Active Ship Scan>"
waitOn "Command [TL="
openMenu "ShipSetup"

:sub_SetMenu
  if ($evil_haggle)
    setMenuValue "Haggling" "ON"
  else
    setMenuValue "Haggling" "OFF"
  end
  
  if ($evil_continue > 0)
    setMenuValue "Continue" "YES"
  else
    setMenuValue "Continue" "NO"
  end
  
  if ($evil_broadcast > 0)
    setMenuValue "Broadcast" "YES"
  else
    setMenuValue "Broadcast" "NO"
  end
  
  setMenuValue "StealFactor" $evil_stealFactor
  setMenuValue "RobFactor" $evil_robFactor
  setMenuValue "ShipSetup" $evil_shipSetup
  setMenuValue "QuickSetup" $evil_shipSetup
  return


:Menu_Go
setVar $Evil~ShipSetup $evil_shipSetup
setVar $Evil~StealFactor $evil_stealFactor
setVar $Evil~RobFactor $evil_robFactor
setVar $Evil~Continue $evil_continue
setVar $Evil~Broadcast $evil_broadcast

if ($evil_haggle)
  setVar $Haggle~HaggleFactor 8
else
  setVar $Haggle~HaggleFactor 0
end

gosub :Evil~Evil

halt


# includes:

include "include\gamePrefs"
include "include\evil"
include "include\header"

