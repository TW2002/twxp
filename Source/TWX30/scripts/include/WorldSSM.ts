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

# SUB:       WorldSSM
# Passed:    $Quota - Credit quota, "0" for none
#            $Buy - "1" to buy figs/shield
#            $Refurb - Sector of port to refurb at (class 0 or 9)
#            $BustFile - File to record busts to (or "" for no bust record)
#            + Parameters for included routines
# Returned:  $Credits
#            $BustList[] - Bust list array (1/0)
# Triggered: Sector command prompt

:WorldSSM
  # sys_check
  
  setVar $Checked 0
  setVar $Credits 0
  setVar $holdsLost 0
  setVar $otherHoldsLost 0
  setVar $Move~CheckSub :WorldSSM~moveCheck
  setVar $Move~PortPriority "1"

  # load bust list
  if ($BustFile <> "")
    fileExists $exists $BustFile
  
    if ($exists)
      setArray $BustList SECTORS
      setVar $i 1
      read $BustFile $bust $i
      while ($bust <> EOF)
        setVar $BustList[$bust] 1
        add $i 1
        read $BustFile $bust $i
      end
    end
  end

  # set game prefs
  setVar $GamePrefs~Bank 0
  setVar $GamePrefs~Animation[0] OFF
  setVar $GamePrefs~AbortDisplayAll[0] OFF
  gosub :GamePrefs~SetGamePrefs
  
  :cycle
  
  # buy more holds if we didn't have the cash for the last refurb
  add $holdsLost $otherHoldsLost
  
  if ($holdsLost > 0)
    # refurb
    setVar $Refurb~HoldsLost $holdsLost
    gosub :Refurb~Refurb
    
    if ($Refurb~Failed)
      setVar $otherHoldsLost $holdsLost
    else
      setVar $otherHoldsLost 0
    end
    
    # warp to a random sector
    setVar $Warp~Mode "E"
    getRnd $Warp~Dest 11 SECTORS
    gosub :Warp~Warp
  end
  
  send "d"
  gosub :Move~Move
  
  # check credits
  gosub :PlayerInfo~InfoQuick
  setVar $Credits $PlayerInfo~Credits
  
  if ($Credits >= $Quota) and ($Quota > 0)
    # reached quota
    return
  end
  
  goto :cycle
 
  
:moveCheck
  if ($Checked)
    setVar $Checked 0
  else
    setVar $PortCheck~Sector $Move~CurSector
    setVar $PortCheck~Scanned 0
    gosub :PortCheck~PortCheck
    setVar $Move~NoScan $PortCheck~Scanned
    setVar $activeBust 0
    
    if ($BustFile <> "")
      # check that we havn't busted at either port
      
      if ($BustList[$Move~CurSector]) or ($BustList[$PortCheck~Pair])
        setVar $activeBust 1
      end
    end
    
    if ($PortCheck~Pair > 0) and ($activeBust = 0)
      # check that its not a backdoor
      send "cf" $PortCheck~Pair "*" $Move~CurSector "*q"
      setTextLineTrigger getDist :getDist "The shortest path ("
      pause
      :getDist
      getWord CURRENTLINE $dist 4
      if ($dist = "(1")
        if ($Move~CurSector > 10) 
          send "jy"
        end
        
        # begin SSM
        setVar $SSM~OtherSector $PortCheck~Pair
        setVar $SSM~DropFigs 1
        gosub :SSM~SSM
        setVar $HoldsLost $SSM~HoldsLost
        setVar $Move~Found 1    
        setVar $Checked 1
        
        if ($BustFile <> "")
          setVar $BustList[$SSM~Sector] 1
          write $BustFile $SSM~Sector
        end
      end
    end
  end
  
  return 
  
  
# includes:

include "include\refurb"
include "include\SSM"
include "include\move"
include "include\playerInfo"
include "include\warp"
include "include\portCheck"
include "include\gamePrefs"