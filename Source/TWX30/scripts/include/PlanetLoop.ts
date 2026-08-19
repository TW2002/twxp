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

# SUB:       PlanetLoop
# Passed:    $LoopSub - Planet check sub
#            $IgnoreList - List of planet IDs to ignore, separated by spaces
# Triggered: Sector command prompt
# Returned:  


:PlanetLoop
  # sys_check
  
  # break ignore list down into array
  setVar $i 1
  setVar $ignoreCount 0
  :i
  getWord $IgnoreList $ignore[$i] $i
  if ($ignore[$i] <> 0)
    add $i 1
    add $ignoreCount 1
    goto :i
  end  
  setVar $IgnoreList ""
  
  # check all planets in sector that aren't on ignore
  setVar $found 0
  send "l"
  
  setTextLineTrigger noPlanet :noPlanet "There isn't a planet in this sector."
  setTextLineTrigger multiplePlanets :multiplePlanets "Registry# and Planet Name"
  setTextLineTrigger singlePlanet :singlePlanet "Landing sequence engaged..."
  pause
  
  :noPlanet
  killTrigger multiplePlanets
  killTrigger singlePlanet
  return
  
  :multiplePlanets
  killTrigger singlePlanet
  killTrigger noPlanet
  setVar $LastID 0

  :nextPlanet
  setTextTrigger planetsChecked :PlanetsChecked "Land on which planet <Q to abort>"
  setTextLineTrigger getID :getID "<"
  pause
  
  :getID
  getWord CURRENTLINE $word 1
  if ($word = "Owned")
    setTextLineTrigger getID :getID "<"
    pause
  end
  
  killTrigger planetsChecked
  setVar $Line CURRENTLINE
  stripText $Line "<"
  stripText $Line ">"
  getWord $Line $ID 1
  if ($ID = "Land")
    goto :PlanetsChecked
  end
  
  gosub :sub_CheckIgnore
  
  if ($ID > $LastID) and ($ignore = 0)
    send $ID "*"
    setVar $LastID $ID
    gosub :sub_Check
    
    if ($found <> 0)  
      return
    end
    
    send "ql"
    waitFor "Registry# and Planet Name"
  end
  goto :nextPlanet
  
  :PlanetsChecked
  killTrigger getID
  send "q*"
  return
  
  :singlePlanet
  killTrigger multiplePlanets
  killTrigger noPlanet
  gosub :sub_Check
  if ($found = 0)
    send "q"
  end
  return
  
  :sub_Check
    # check the planet
    setTextLineTrigger Check_GetPlanet :Check_GetPlanet "Planet #"
    pause
    :Check_GetPlanet
    getWord CURRENTLINE $Check_Planet 2
    stripText $Check_Planet "#"
    
    # check if we're ignoring it
    setVar $ID $Check_Planet
    gosub :sub_CheckIgnore
    
    if ($ignore = 0)
      gosub $LoopSub
    end
    
    return


:sub_CheckIgnore
  # check if we're ignoring this planet
  setVar $j 1
  setVar $ignore 0
  :j
  if ($j <= $ignoreCount)
    if ($ignore[$j] = $ID)
      setVar $ignore 1
    else
      add $j 1
      goto :j
    end
  end

  return
  