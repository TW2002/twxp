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

# SUB:       SSTScout
# Purpose:   FigWarp around the game to find a specified number of SST work ports (xxB)
# Passed:    $Ports - Count-based array of possible work ports
#            $RequiredPorts - Number of work ports required to complete scouting operation
#            $Warp~DropFig - Type of figs to drop while warping
#                       "N" = None, "D" = Defensive, "O" = Offensive, "T" = Toll
#            $WorldSST~BustList - Bust list boolean array
# Triggered: Sector command prompt

:SSTScout
  if ($RequiredPorts <= $Ports)
    # we've met our quota
    return
  end

  # figwarp to a random sector
  getRnd $Warp~Dest 11 SECTORS
  setVar $Warp~Mode "F"
  gosub :Warp~Warp
  
  # assess warp results to find work port
  setVar $i 2
  setVar $max ($Warp~Course + 1)
  while ($i <= $max)
    setVar $sect $Warp~Course[$i]
  
    if (PORT.BUYEQUIP[$sect]) and ($WorldSST~BustList[$sect] = 0)
      # we've found a work port
      add $Ports 1
      setVar $Ports[$Ports] $sect
    end
    
    add $i 1
  end
  
  goto :SSTScout
