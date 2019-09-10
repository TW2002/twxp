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

# SUB:       SDF
# Passed:    $StealDump~StealFactor - steal factor
#            $ThisHaggleFactor - haggle factor for sell at this port
#            $OtherHaggleFactor - haggle factor for sell at other port
#            $ThisPlanet - ID of planet to land on in current sector ("0" for first planet)
#            $OtherPlanet - ID of planet to land on in other sector ("0" for first planet)
#            $TurnLimit - Turn limit
#            $DamageLimit - Routine will stop if figs+shield are <= this value
#            $ThisTrigger - Trigger text to broadcast on ping request in current sector
#            $OtherTrigger - Trigger text to broadcast on ping request in other sector
# Returned:  $HoldsLost - Holds lost on completion of run
#            $Sector - Sector finished in
#            $Result - "0" = Hit turn limit, "1" = Damage limit hit, "2" = busted, "3" = errored
# Triggered: Sector command prompt

:SDF
  # sys_check
  
  # set game prefs to requirements
  setVar $GamePrefs~Bank "SDF"
  setVar $GamePrefs~Animation[$GamePrefs~Bank] OFF
  setVar $GamePrefs~AbortDisplayAll[$GamePrefs~Bank] OFF
  setVar $GamePrefs~ScreenPauses[$GamePrefs~Bank] OFF
  gosub :GamePrefs~SetGamePrefs
  
  # get player details
  gosub :PlayerInfo~InfoQuick
  
  setVar $trigger[1] $ThisTrigger
  setVar $trigger[2] $OtherTrigger
  setVar $damage ($PlayerInfo~Fighters + $PlayerInfo~Shields)
  setVar $StealDump~Experience $PlayerInfo~Experience
  setVar $firstRun 1
  setVar $sector 1
  setVar $sector[1] $PlayerInfo~Sector
  setVar $sector[2] "0"
  setVar $planet[1] $ThisPlanet
  setVar $planet[2] $OtherPlanet
  setVar $haggle[1] $ThisHaggleFactor
  setVar $haggle[2] $OtherHaggleFactor
  setVar $StealDump~ReInit[1] 1
  setVar $StealDump~ReInit[2] 1
  
  # check damage
  if ($damage <= $DamageLimit)
    setVar $HoldsLost 0
    setVar $Sector $sector[$sector]
    setVar $Result 1
    return
  end
  
  :cycle
  
  if ($sector[$sector] = 0)


    # get this sector
    send "d"
    setTextLineTrigger getSector :getSector "Sector  : "
    pause
    :getSector
    getWord CURRENTLINE $sector[$sector] 3
  end
  
  setVar $StealDump~Sector $sector[$sector]
  setVar $StealDump~HaggleFactor $haggle[$sector]
  setVar $StealDump~Planet $planet[$sector]
  gosub :StealDump~StealDump
  
  if ($StealDump~Success = "0")
    setVar $HoldsLost $StealDump~HoldsLost
    setVar $Sector $sector[$sector]
    setVar $Result 2
    return
  elseif ($StealDump~Success = "2")
    setVar $HoldsLost 0
    setVar $Sector $sector[$sector]
    setVar $Result 3
    return
  end
  
  if ($StealDump~Turns < ($TurnLimit + 3))
    setVar $HoldsLost 0
    setVar $Sector $sector[$sector]
    setVar $Result 0
    return
  end
  
  if ($trigger[$sector] <> "")
    send "'" $trigger[$sector] "*"
  end
  
  waitOn "is powering up weapons"
  setTextLineTrigger lostShield :lostShield " shield points and "
  setTextLineTrigger lostFigs :lostFigs " fighters."
  setTextLineTrigger fled :fled "You fled from"
  pause
  
  :lostShield
  getWordPos CURRENTLINE $pos " destroyed "
  cutText CURRENTLINE $line $pos 999
  getWord $line $lostShield 2
  getWord $line $lostFigs 6
  pause
  
  :lostFigs
  setVar $lostShield 0
  getWordPos CURRENTLINE $pos " destroyed "
  cutText CURRENTLINE $line $pos 999
  getWord $line $lostFigs 2
  pause
  
  :fled
  killTrigger lostShield
  killTrigger lostFigs
  
  if ($sector = "1")
    setVar $sector "2"
  else
    setVar $sector "1"
  end  
  
  subtract $damage ($lostShield + $lostFigs)
  
  if ($damage <= $DamageLimit)
    setVar $HoldsLost 0
    setVar $Sector $sector[$sector]
    setVar $Result 1
    return
  end
  
  goto :cycle


# includes:

include "include\stealDump"
include "include\playerInfo"
include "include\gamePrefs"