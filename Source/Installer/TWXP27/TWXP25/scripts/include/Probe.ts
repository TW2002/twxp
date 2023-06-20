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

# SUB:       Probe
# Passed:    $CreditLimit - Credit limit
#            $TurnLimit - Turn limit
#            $ProbeExplored - "1" to probe sectors already explored
#            $AvoidBlocks - "1" to set blocked sectors on avoids
#            $CheckSub - Check subroutine to call for every sector probed ("0" for none)
#            $ProbeSub - Subroutine called to test if sector will be probed, ("0" for none)
#            $ListFile - Name of probe list
#            $Start - Index of first sector (or sector index in file) to probe
#            $UnreachedFile - Name of file to save unreached sector numbers
#            $BlockedFile - Name of file to save blocked sector numbers
# Triggered: Sector command prompt of stardock
# Completed: Sector command prompt of stardock
# Returned:  $Blocked[] - Array of sectors that blocked probes ("1" = blocked, "0" = clear)
#            $Unreached[] - Array of sectors that were unreached by probes ("1" = unreached, "0" = reached)
#            $Index - Index of last sector probed (or index of last probed sector in file)
#            $Turns - Updated player turns
#            $Credits - Updated player credits
#            $Probes - Probes remaining on ship
#            $Result - "0" if all requested sectors probed
#                      "1" if out of cash
#                      "2" if out of turns
#                      "3" if stopped due to found something in $CheckSub

:Probe
  # sys_check
  
  # get player details
  gosub :PlayerInfo~InfoQuick
  setVar $Probes $PlayerInfo~Probes
  setVar $Credits $PlayerInfo~Credits
  setVar $Turns $PlayerInfo~Turns
  setVar $probeMax 0
  setVar $Result 0
  setVar $Index ($Start - 1)
  setVar $Sector 0
  setVar $lastBuy 0
  
  if ($ListFile = "")
    setVar $ListFile 0
  end
  
  if ($UnreachedFile = "")
    setVar $UnreachedFile 0
  end
  
  if ($BlockedFile = "")
    setVar $BlockedFile 0
  end
  
  setArray $Blocked SECTORS
  setArray $Unreached SECTORS
  
  setVar $GamePrefs~Bank "Probe"
  setVar $GamePrefs~AbortDisplayAll[$GamePrefs~Bank] OFF
  
  gosub :GamePrefs~SetGamePrefs
  
  if ($Probes <= 0)
    goto :buyProbes
  end
  
  :launchProbe
  
  # get next sector to probe
  if ($ListFile = "0")
    setVar $Sector ($Index + 1)
  else
    read $ListFile $Sector ($Index + 1)
  end
  
  if ($Sector = "EOF")
    gosub :sub_ProbeEnd
    return
  end
  
  if ($Sector > SECTORS)
    gosub :sub_ProbeEnd
    return
  end
  
  if ((SECTOR.EXPLORED[$Sector] = YES) and ($ProbeExplored = 0)) or ($Blocked[$Sector])
    add $Index 1
    goto :launchProbe
  end
  
  if ($ProbeSub <> "0")
    setVar $LaunchProbe 0
    gosub $ProbeSub
  else
    setVar $LaunchProbe 1
  end
  
  if ($LaunchProbe)
    send "e" $Sector "*"
    setVar $curProbeSector 0
    setVar $madeIt 1

    waitOn "Please enter a destination for this probe "    
    setTextLineTrigger noRoute :noRoute " Error - No route within"

    :nextSector
    setTextLineTrigger getSector :getSector "Probe entering sector : "
    setTextLineTrigger probeDestroyed :probeDestroyed "Probe Destroyed!"
    setTextTrigger getPrompt :getPrompt "Command [TL="
    pause
    
    :noRoute
    killTrigger getSector
    killTrigger probeDestroyed
    killTrigger getPrompt
    
    if ($Unreached[$Sector] = 0)
      setVar $Unreached[$Sector] 1
      write $UnreachedFile $Sector
    end
    
    send "n"
    add $Index 1
    goto :launchProbe
      
    :probeDestroyed
    killTrigger getSector
    killTrigger getPrompt
    killTrigger noRoute
    setVar $madeIt 0
    goto :probeDone
    
    :getSector
    killTrigger getPrompt
    killTrigger probeDestroyed
    killTrigger noRoute
    setVar $ProbeSector $curProbeSector
    getWord CURRENTLINE $curProbeSector 5
    gosub :sub_TestSector

    if ($Found)
      setVar $Result 3
      return
    end
    
    goto :nextSector
    
    :getPrompt
    killTrigger getSector
    killTrigger probeDestroyed
    killTrigger noRoute
    setVar $ProbeSector $curProbeSector
    gosub :sub_TestSector
    
    if ($Found)
      setVar $Result 3
      return
    end
    
    :probeDone
    
    subtract $Probes 1
    
    if ($madeIt)
      # probe reached destination
      add $Index 1
    else
      # probe was destroyed en-route
      
      setVar $Blocked[$curProbeSector] 1
      write $BlockedFile $curProbeSector
        
      if ($AvoidBlocks)
        send "cv" $curProbeSector "*q"
          
        if ($curProbeSector = $Sector)
          if ($Unreached[$Sector] = 0)
            setVar $Unreached[$Sector] 1
            write $UnreachedFile $curProbeSector
          end
          add $Index 1
        end
      else
        if ($Unreached[$Sector] = 0)
          setVar $Unreached[$Sector] 1
          write $UnreachedFile $curProbeSector
        end
        add $Index 1
      end
    end
  end  

  :buyProbes
  
  if ($Probes <= 0)
    # buy probes
    
    if ($Turns <= $TurnLimit) and ($TurnLimit > 0)
      # hit turn limit
      setVar $Result 2
      return
    end
    
    if ($lastBuy)
      setVar $Result 1
      gosub :sub_ProbeEnd
      return
    end
    
    if ($probeMax = 0)
      # buy probes for the first time - get max etc
      send "ps"
      
      setTextLineTrigger limpet :limpet "A port official runs up"
      setTextTrigger onDock :onDock "<StarDock> Where to? (?=Help)"
      pause
      
      :limpet
      send "y"
      pause
      
      :onDock
      killTrigger limpet
      send "h e"
      waitOn "<Hardware Emporium> So what are you looking"
      
      # get probe price
      setTextLineTrigger getProbePrice :getProbePrice "We sell them for"
      pause
      
      :getProbePrice
      getWord CURRENTLINE $probePrice 5
      stripText $probePrice ","
      
      waitOn ") [0] ?"
      getWord CURRENTLINE $maxProbes 8
      stripText $maxProbes ")"
      
      gosub :sub_CalcProbeBuy
      
      if ($buy <= 0)
        setVar $Result 1
        send "*qq"
        gosub :sub_ProbeEnd
        return
      end
      
      send $buy "*qq"
    else
      gosub :sub_CalcProbeBuy
      
      if ($buy <= 0)
        setVar $Result 1
        gosub :sub_ProbeEnd
        return
      end
      
      send "p s h e " $buy "*qq"
    end
    
    setVar $Probes $buy
    subtract $Turns 1
  end
  
  goto :launchProbe


:sub_TestSector
  if ($ProbeSector > 0) and ($CheckSub <> "0")
    setVar $Found 0
    gosub $CheckSub
  end
  
  return


:sub_CalcProbeBuy
  setVar $buy $maxProbes
  
  if ((($buy * $probePrice) + $CreditLimit) > $Credits)
    setVar $buy (($Credits - $CreditLimit) / $probePrice)
    setVar $lastBuy 1
  end
  
  subtract $Credits ($buy * $probePrice)
  return  


:sub_ProbeEnd
  setVar $GamePrefs~Bank "Probe"
  gosub :GamePrefs~SetGamePrefs
  
  return


  
# includes:

include "include\playerInfo"
include "include\gamePrefs"
