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

# SUB:       Approach
# Passed:    $TargetSector - Sector to approach
#            $XPort - ID of ship to transport to/from while approaching - "0" for none
#            $Cache~Figs[] - Fig cache array
# Returned:  $Failed - "0" if reached target sector
#                      "1" if failed to reach target sector
#                      "2" if not enough turns to safely reach target sector
#                      "3" stopped due to possible hostile adjacent
#                      "4" stopped due to heavy fig blockade
#            $HostileSector - Sector of hostile adjacent (if there is one)
#            $Sector - Current sector
# Triggered: Sector command prompt, ship must have TWarp and fuel

:Approach
  # get player info
  gosub :PlayerInfo~InfoQuick
  setVar $turns $PlayerInfo~Turns
  setVar $ship $PlayerInfo~Ship
  setVar $Sector $PlayerInfo~Sector
  
  send "i"
  setTextLineTrigger getTPW :getTPW "Turns to Warp  :"
  pause
  :getTPW
  getWord CURRENTLINE $TPW 5 

  # find approach point
  setVar $NearFig~Sector $TargetSector
  :NextPoint
  gosub :NearFig~NearFig
  
  if ($NearFig~NearFig <> $Sector)
    getCourse $course $NearFig~NearFig $TargetSector
    
    send $NearFig~NearFig
    
    if ($NearFig~NearFig < 600) or (SECTORS > 5000)
      send "*"
    end
      
    if ($course > 1)
      send "y"
      
      setTextLineTrigger warpClear :warpClear "Locating beam pinpointed, TransWarp Locked"
      setTextLineTrigger warpBlind :warpBlind "to make this jump blind?"
      pause
      :warpBlind
      killTrigger warpClear
      setVar $Cache~Figs[$NearFig~NearFig] 0
      goto :NextPoint
    
      :warpClear
      killTrigger warpBlind
    end
  end

  # see if we have enough turns
  setVar $turnsTotal (($TPW + 3) * ($course + 2))
  
  if ($turnsTotal >= $turns)
    # not enough turns to safely approach
    setVar $Failed "2"
    return
  end
  
  send "y*"
  setVar $Sector $NearFig~NearFig
  setVar $courseIndex 2
  
  # begin approach
  setVar $first 1
  :NextSector
  send "sdsh"
  setVar $xported 0
  
  if ($first)
    setVar $first 0
  elseif ($XPort > "0")
    send "x " $XPort "* "
    setVar $xported 1
  end
  
  waitOn "Scan or (Q)uit? [D] H"
  waitOn "Command [TL="
  
  if ($xported)
    send $ship "* *"
  end
  
  # assess scan results
  setVar $i 1
  :NextScan
  setVar $sect SECTOR.WARPS[$Sector][$i]
  if ($sect > 0)
    if (SECTOR.TRADERCOUNT[$sect] > 0)
      # possible adjacent hostile
      setVar $HostileSector $sect
      setVar $Failed "3"
      return
    end
    add $i 1
    goto :NextScan
  end
  
  setVar $sect $course[$courseIndex]
  
  if (SECTOR.FIGS.QUANTITY[$sect] > 10000)
    # fig blocked.
    setVar $Failed "4"
    return
  end
  
  setVar $send ""
  
  if (SECTOR.FIGS.QUANTITY[$sect] = 0)
    # add extra "*"s for unmanned ships in the sector
    setVar $i SECTOR.SHIPCOUNT[$sect]
    :AddSend
    if ($i > 0)
      setVar $send $send & "*"
      subtract $i 1
      goto :AddSend
    end
  end

  # clear sector
  setVar $Sector $sect
  if ($sect < 600) or (SECTORS > 5000)
    setVar $sect $sect & "*"
  end
  
  send $sect "at9999**f1*co" $send
  add $courseIndex 1
  
  if ($course[$courseIndex] = "0")
    # arrived at destination
    setVar $Failed "0"
    return
  end
  
  goto :NextSector
  
  
# includes:

include "include\nearFig"
include "include\playerInfo"
include "include\cache"