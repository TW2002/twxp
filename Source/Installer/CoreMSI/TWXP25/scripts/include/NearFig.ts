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

# SUB:       NearFig
# Passed:    $Sector - Sector to find nearest fig to
#            $Cache~Figs[] - Fig cache array (1/0)
# Returned:  $NearFig - Sector of nearest fig (0 if no fig found)

:NearFig
  # sys_check
  
  setVar $SeekSectors[1] $Sector
  setVar $SeekSectorsSize 1
  setVar $SeekIndex 1
  
  if ($checkIndex = 0) or ($checkIndex >= 99)
    setVar $checkIndex 1
    setArray $checkedList SECTORS
  else
    add $checkIndex 1
  end
  
  if ($Cache~Figs[$Sector] = 1)
    # fig found 0 hops
    setVar $NearFig $Sector
    return
  end
  
  :CheckNext
  if ($SeekIndex > $SeekSectorsSize)
    # no fig found
    setVar $NearFig 0
    return
  end
  
  setVar $WarpIndex 1
  :NextWarp
  setVar $TestSector SECTOR.WARPSIN[$SeekSectors[$SeekIndex]][$WarpIndex]
  if ($TestSector > 0)
    if ($Cache~Figs[$TestSector] = 1)
      # found a fig
      setVar $NearFig $TestSector
      return      
    end
  
    if ($checkedList[$TestSector] <> $checkIndex)
      add $SeekSectorsSize 1
      setVar $SeekSectors[$SeekSectorsSize] $TestSector
      setVar $checkedList[$TestSector] $checkIndex
    end
    
    add $WarpIndex 1
    goto :NextWarp
  end
  
  add $SeekIndex 1
  goto :CheckNext


# SUB:       NearAOS
# Passed:    $Sector - Sector to find nearest AOS to
#            $Cache~AOS[] - Areas of significance array (1/0)
# Returned:  $NearAOS - Sector of nearest AOS (0 if no fig found)
#            $AOSType - Type of nearest AOS 
#              "P" = Upgraded port
#              "B" = Base
#              "C" = Class 0
#              "S" = Stardock
#              "F" = Fedspace sector

:NearAOS
  # sys_check
  
  setVar $SeekSectors[1] $Sector
  setVar $SeekSectorsSize 1
  setVar $SeekIndex 1
  
  if ($checkIndex = 0) or ($checkIndex >= 99)
    setVar $checkIndex 1
    setArray $checkedList SECTORS
  else
    add $checkIndex 1
  end
  
  if ($Cache~AOS[$Sector] <> 0) and ($Cache~AOS[$Sector] <> L)
    # AOS found 0 hops
    setVar $NearAOS $Sector
    setVar $AOSType $Cache~AOS[$Sector]
    return
  end
  
  :CheckNextAOS
  if ($SeekIndex > $SeekSectorsSize)
    # no fig found
    setVar $NearAOS 0
    return
  end
  
  setVar $WarpIndex 1
  :NextWarpAOS
  setVar $TestSector SECTOR.WARPS[$SeekSectors[$SeekIndex]][$WarpIndex]
  if ($TestSector > 0)
    if ($Cache~AOS[$TestSector] <> 0) and ($Cache~AOS[$TestSector] <> L)
      # found an AOS
      setVar $NearAOS $TestSector
      setVar $AOSType $Cache~AOS[$TestSector]
      return      
    end
  
    if ($checkedList[$TestSector] <> $checkIndex)
      add $SeekSectorsSize 1
      setVar $SeekSectors[$SeekSectorsSize] $TestSector
      setVar $checkedList[$TestSector] $checkIndex
    end
      
    add $WarpIndex 1
    goto :NextWarpAOS
  end
  
  add $SeekIndex 1
  goto :CheckNextAOS

