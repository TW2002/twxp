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

# default execution:

getInput $Sector "Enter sector to find routes from"
getInput $RouteFile "Enter filename to write routes to"
getInput $Inverse "Enter '1' to search for closed fig areas, '0' to search for open areas"
setVar $Cache~FigFile "figs.txt"
gosub :Cache~CacheFigsFromFile
clientMessage "Figs cached, calculating routes..."
gosub :Routes
clientMessage "Found " & $RoutesSize & " routes"
halt

# SUB:       Routes
# Passed:    $Sector - Sector to find all open routes from
#            $RouteFile - File to write route sectors to ("0" to return array only)
#            $Cache~Figs[] - Fig cache array (1/0)
#            $Inverse - "1" if to check for routes containing figs, "0" for open sectors
# Returned:  $Routes[] - Array of route sectors

:Routes
  if ($RouteFile <> "0")
    delete $RouteFile
  end
  
  if ($RoutesSize > 0)
    # zero checked sectors array
    setVar $i 1
    :ZeroNext
    if ($i < SECTORS)
      setVar $Checked[$i] 0
      add $i 1
      goto :ZeroNext
    end
  end

  setVar $Routes[1] $Sector
  setVar $RoutesSize 1
  setVar $RouteIndex 1
  
  :CheckNext
  if ($RouteIndex > $RoutesSize)
    # route calculation complete 
    return
  end
  
  setVar $WarpIndex 1
  :NextWarp
  setVar $TestSector SECTOR.WARPSIN[$Routes[$RouteIndex]][$WarpIndex]
  if ($TestSector > 0) and ($Checked[$TestSector] = "0") and ((($Cache~Figs[$TestSector] = "0") and ($Inverse = "0")) or (($Cache~Figs[$TestSector] = "1") and ($Inverse = "1")))
    add $RoutesSize 1
    setVar $Routes[$RoutesSize] $TestSector
    setVar $Checked[$TestSector] 1
    
    if ($RouteFile <> "0")
      write $RouteFile $TestSector
    end
    
    add $WarpIndex 1
    goto :NextWarp
  end
  
  add $RouteIndex 1
  goto :CheckNext


# includes:

include "include\cache"