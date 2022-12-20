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

# SUB:       Capture
# Passed:    $ShipOffensive - Offensive odds of current ship (12 = 1.2)
# Triggered: Before powerup lock on target (after "annny"), after the "<Attack>"

:Capture
  setTextLineTrigger GetTarget :GetTarget "(Y/N) [N]? Yes"
  setTextTrigger Missed :Missed "Command [TL="
  pause
  
  :GetTarget
  killTrigger Missed
  
  # get ship type and figs
  getText CURRENTLINE $ShipName "'s " " ("
  getWordPos CURRENTLINE $X $ShipName
  getLength $ShipName $Y
  add $X $Y
  cutText CURRENTLINE $Line $X 9999
  replaceText $Line "(" " "
  replaceText $Line "-" " "
  replaceText $Line ")" " "
  stripText $Line ","
  getWord $Line $Figs 2
  
  # see if its unmanned
  getWordPos CURRENTLINE $Unmanned "'s unmanned "
  
  setVar $ShieldPerc 0
  setTextLineTrigger GetShield :GetShield "Combat scanners show"
  setTextTrigger Attack :Attack "How many fighters do"
  pause
  :GetShield
  killTrigger Attack
  getWord CURRENTLINE $ShieldPerc 7
  stripText $ShieldPerc "%"
  
  :Attack
  killTrigger GetShield
  setVar $ShipStats~Name $ShipName
  gosub :ShipStats~GetShipStats
  
  if ($ShieldPerc > 0)
    # calculate shields on target
    setVar $X 1000
    divide $X $ShieldPerc
    setVar $Shield $ShipStats~Shield
    multiply $Shield 10
    divide $Shield $X
  else
    setVar $Shield 0
  end
  
  # calculate how much to hit with
  setVar $Attack $Figs
  add $Attack $Shield
  
  if ($Unmanned > 0)
    divide $Attack 2
  end
  
  multiply $Attack $ShipStats~Defensive
  divide $Attack $ShipOffensive
  setVar $X $Attack
  multiply $X 10

  divide $X 192
  
  subtract $Attack $X
  
  if ($Attack > 130)
    add $Attack 4
  else
    add $Attack 1
  end
  
  echo "*Ship: " $ShipName
  echo "*Figs: " $Figs
  echo "*Shield: " $Shield " (" $ShieldPerc "%)"
  echo "*Unmanned: " $Unmanned
  echo "*Odds: " $ShipStats~Defensive
  echo "*My Odds: " $ShipOffensive
  echo "*Attacking with: " $Attack "**"
  
  send $Attack "**"
  return
  
  :Missed
  killTrigger GetTarget
  send "**"
  
  return


# includes:

include "include\shipStats"