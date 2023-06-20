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

# SUB:       SaveShipOdds
# Passed:    $ShipFile - File name of file ship settings are stored in
# Triggered: Sector command prompt

:SaveShipOdds
  cutText CURRENTLINE $location 1 12
  if ($location <> "Command [TL=")
    clientMessage "Cannot grab settings unless at command prompt"
    return
  end

#  send "ccabcdefghijklmnoprstuvwxyzqq"
 send "ccabcdefghijklmnoprstuvwxyz+abcdefghijqq"
  delete $ShipFile
  setVar $Name ""
  
  :NextShip
  killTrigger GetName
  killTrigger GetShields
  killTrigger GetOffensive
  killTrigger GetDefensive
  killTrigger GetAttack
  killTrigger Done
  setTextLineTrigger GetName :GetName "Ship Category #"
  setTextLineTrigger GetShields :GetShields "Maximum Shields:"
  setTextLineTrigger GetOffensive :GetOffensive "Offensive Odds:"
  setTextLineTrigger GetDefensive :GetDefensive "Defensive Odds:"
  setTextLineTrigger GetAttack :GetAttack "Max Figs Per Attack:"
  setTextLineTrigger Done :Done "You shut off the Vid Term."
  pause
  
  :GetName
  if ($Name <> "")
    gosub :WriteShip
  end
  getWordPos CURRENTLINE $Name " : "
  add $Name 3
  cutText CURRENTLINE $Name $Name 999
  goto :NextShip
  
  :GetShields
  setVar $Line CURRENTLINE
  replaceText $Line ":" " "
  getWord $Line $Shield 10
  stripText $Shield ","
  goto :NextShip
  
  :GetOffensive
  setVar $Line CURRENTLINE
  replaceText $Line ":" " "
  getWord $Line $Offensive 10
  stripText $Offensive "."
  goto :NextShip
  
  :GetDefensive
  setVar $Line CURRENTLINE
  replaceText $Line ":" " "
  getWord $Line $Defensive 10
  stripText $Defensive "."
  goto :NextShip
  
  :GetAttack
  getWord CURRENTLINE $Attack 5
  stripText $Attack ","
  goto :NextShip
  
  :Done
  gosub :WriteShip
  return
  
  :WriteShip
  write $ShipFile $Name
  write $ShipFile $Shield
  write $ShipFile $Offensive
  write $ShipFile $Defensive
  write $ShipFile $Attack
  return

# SUB:       LoadShipOdds (template)
# Passed:    $ShipFile - File name of file ship settings are stored in
# Returned:  $ShipShield[] - Array of the max shield value of all ships
#            $ShipOffensive[] - Array of the offensive odds of all ships
#            $ShipDefensive[] - Array of the defensive odds of all ships
#            $ShipName[] - Array holding the names of all ships
#            $Count - The number of ships loaded

:LoadShipOdds
  fileExists $test $ShipFile
  
  if ($test = 0)
    clientMessage "Unable to load ship settings from file: " & $ShipFile
    return
  end

  setVar $Count 1
  setVar $Line 1
  
  :LoadNextShip
  read $ShipFile $ShipName[$Count] $Line
  add $Line 1
  
  if ($ShipName[$Count] = EOF)
    subtract $Count 1
    return
  end
  
  read $ShipFile $ShipShield[$Count] $Line
  add $Line 1
  read $ShipFile $ShipOffensive[$Count] $Line
  add $Line 1
  read $ShipFile $ShipDefensive[$Count] $Line
  add $Line 1
  read $ShipFile $ShipAttack[$Count] $Line
  add $Line 1
  add $Count 1
  goto :LoadNextShip


# SUB:       GetShipStats
# Passed:    $Name - Name of requested ship
# Returned:  $Shield - Ship's max shield
#            $Offensive - Ship's offensive odds (x10)
#            $Defensive - Ship's defensive odds (x10)
#            $Attack - Ship's max fighter attack force
  
:GetShipStats
  if ($ShipName[1] = 0)
    gosub :LoadShipOdds
  end
  setVar $i 1
  
  :Next
  
  if ($i > $Count)
    # set defaults
    setVar $Shield 0
    setVar $Offensive 10
    setVar $Defensive 10
    setVar $Attack 1000
    return
  end
  
  getWordPos $Name $Test $ShipName[$i]
  
  if ($Test > 0)
    setVar $Shield $ShipShield[$i]
    setVar $Offensive $ShipOffensive[$i]
    setVar $Defensive $ShipDefensive[$i]
    setVar $Attack $ShipAttack[$i]
    return
  end
  
  add $i 1
  goto :Next

