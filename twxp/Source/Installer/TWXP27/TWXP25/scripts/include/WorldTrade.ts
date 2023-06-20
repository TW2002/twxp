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

# SUB:       WorldTrade
# Purpose:   Navigates the game, trading port pairs to reach a cash quota
# Passed:    $Quota - Credit quota to reach ("0" for no limit")
#            + Parameters for used includes.
# Returned:  $Credits - Player credits
# Triggered: Sector command prompt

:WorldTrade
  # sys_check

  setVar $Move~CheckSub :WorldTrade~Sub_MoveCheck
  setVar $Credits 0
  setVar $Checked 0
  
  # set game prefs to requirements
  setVar $GamePrefs~Bank "WorldTrade"
  setVar $GamePrefs~Animation[$GamePrefs~Bank] OFF
  setVar $GamePrefs~AbortDisplayAll[$GamePrefs~Bank] OFF
  setVar $GamePrefs~ScreenPauses[$GamePrefs~Bank] OFF
  gosub :GamePrefs~SetGamePrefs
  
  :start
  
  # check credits
  if ($Credits >= $Quota) and ($Quota > 0)
    return
  end
  
  # find and trade a port pair
  send "d"
  gosub :Move~Move
  
  # repeat
  goto :start

  
:sub_MoveCheck
  if ($Checked)
    setVar $Checked 0
  elseif (SECTOR.FIGS.OWNER[$Move~CurSector] = "yours") or (SECTOR.FIGS.OWNER[$Move~CurSector] = "belong to your Corp") or (SECTOR.FIGS.QUANTITY[$Move~CurSector] = 0)
    setVar $PortCheck~Sector $Move~CurSector
    setVar $PortCheck~Scanned 0
    setVar $PortCheck~PortType 1
    gosub :PortCheck~PortCheck
    setVar $Move~NoScan $PortCheck~Scanned
    
    if ($PortCheck~Pair > 0)
      # begin PPT
      setVar $PPT~SectorA $Move~CurSector
      setVar $PPT~SectorB $PortCheck~Pair
      setVar $PPT~ProdA $PortCheck~TradeProdA
      setVar $PPT~ProdB $PortCheck~TradeProdB
      gosub :PPT~PPT
      
      if ($PPT~Aborted = "0")
        if ($Haggle~HaggleFactor = 0)
          gosub :PlayerInfo~InfoQuick
          setVar $Credits $PlayerInfo~Credits
        else
          setVar $Credits $Haggle~Credits
        end
      
        setVar $Move~Found 1
      end
      
      setVar $Checked 1
    end
  end
  
  return    


# includes:

include "include\PPT"
include "include\PortCheck"
include "include\move"
include "include\haggle"
include "include\playerInfo"
include "include\gamePrefs"
