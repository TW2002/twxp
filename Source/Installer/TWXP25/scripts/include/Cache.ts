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

# SUB:       CacheFigs
# Returned:  $Figs[] - Fig cache array
#            $FigCount - Number of figs cached
# Triggered: Sector command prompt

:CacheFigs
  # sys_check

  setArray $Figs SECTORS
  setVar $FigCount 0

  send "g"
  
  setTextLineTrigger FigListStart :FigListStart "========================"
  pause
  
  :FigListStart
  setTextLineTrigger FigListLine :FigListLine
  pause
  
  :FigListLine
  if (CURRENTLINE = "")
    return
  end
  
  getWord CURRENTLINE $Fig 1
  getWord CURRENTLINE $Test 2
  if ($Test <> "Total")
    setVar $Figs[$Fig] 1
    add $FigCount 1
  end
  goto :FigListStart


# SUB:       CacheFigsFromFile
# Passed:    $FigFile - File name of fig list
# Returned:  $Figs[] - Fig cache array

:CacheFigsFromFile
  # sys_check
  
  if ($Fig <> "0")
    # clear fig cache
    setVar $i 1
    :ClearNext
    if ($i <= $Fig)
      setVar $Figs[$i] 0
      add $i 1
      goto :ClearNext
    end
  end
  
  setVar $FigIndex 1
  
  :NextFig
  read $FigFile $Fig $FigIndex
  
  if ($Fig = EOF)
    # fig list read complete
    return
  end
  
  setVar $Figs[$Fig] 1
  add $FigIndex 1
  goto :NextFig
  

# SUB:       CacheAOS
# Passed:    $AOSFile - File name of AOS list
#            $CachePorts - "1" to cache port AOS list, "0" to only cache other stuff
#            $AOSInit - "1" if cache initialised - "0" to clear cache
# Returned:  $AOS[] - Areas of significance array
#            $AOSDate[] - Date of AOS recording
#            $AOSInit - Equal to "1"

:CacheAOS
  # sys_check
  
  gosub :CacheFigs
  
  if ($AOSInit = 0)
    setArray $AOS SECTORS
    setArray $AOSDate SECTORS
    setVar $AOSInit 1
  end  
  
  delete $AOSFile
  
  # identify all planets with corp citadels and set them as significant
  send "tlq"
  
  waitOn "Corporate Planet Scan"
  waitOn "======================================================"
  setTextLineTrigger getPlanet :getPlanet " Class "
  setTextLineTrigger TLDone :TLDone "======   ============  ==== ===="
  pause
  
  :getPlanet
  cutText CURRENTLINE $level 77 1
  getWord CURRENTLINE $sect 1
  if ($level <> "l")
    setVar $AOS[$sect] B
    setVar $AOSDate[$sect] DATE & " at " & TIME
    write $AOSFile $sect & " " & $AOS[$sect] & " " & $AOSDate[$sect]
  elseif ($AOS[$sect] = 0)
    setVar $AOS[$sect] L
  end
  setTextLineTrigger getPlanet :getPlanet " Class "
  pause
  
  :TLDone
  killTrigger getPlanet
  
  # identify current SDT zones
  send "czq"
  waitOn "--------------------------------------------------------"
  setTextLineTrigger getShip :getShip " Corp "
  setTextTrigger shipsDone :shipsDone "Computer command [TL="
  pause
  
  :getShip
  setVar $line CURRENTLINE
  replaceText $line "+" " "
  getWord $line $sect 2
  
  if ($AOS[$sect] = L) and ($Figs[$sect])
    # flag SDT zone    
    setVar $AOS[$sect] D
    setVar $AOSDate[$sect] DATE & " at " & TIME
    write $AOSFile $sect & " " & $AOS[$sect] & " " & $AOSDate[$sect]
  end
  setTextLineTrigger getShip :getShip " Corp "
  pause
  
  :shipsDone
  killTrigger getShip
  
  if ($CachePorts = 0)
    return
  end
  
  # identify all upgraded ports and set them as significant
  setVar $i 1
    
  while ($i <= SECTORS)
    if (PORT.PERCENTFUEL[$i] = 0)
      setVar $fuel 0
    else
      setVar $fuel ((PORT.FUEL[$i] * 100) / PORT.PERCENTFUEL[$i])
    end
    if (PORT.PERCENTORG[$i] = 0)
      setVar $org 0
    else
      setVar $org ((PORT.ORG[$i] * 100) / PORT.PERCENTORG[$i])
    end
    if (PORT.PERCENTEQUIP[$i] = 0)
      setVar $equip 0
    else
      setVar $equip ((PORT.EQUIP[$i] * 100) / PORT.PERCENTEQUIP[$i])
    end
    
    if (($fuel > 10000) or ($org > 10000) or ($equip > 10000)) and (($AOS[$i] = "0") or ($AOS[$i] = "L"))
      setVar $AOS[$i] P
    elseif (PORT.CLASS[$i] = 0)
      setVar $AOS[$i] C
    elseif (PORT.CLASS[$i] = 9)
      setVar $AOS[$i] S
    elseif ($i <= 10)
      setVar $AOS[$i] F
    end
    
    if ($AOS[$i] <> "0") and ($AOS[$i] <> "L")
      setVar $AOSDate[$i] DATE & " at " & TIME
      write $AOSFile $i & " " & $AOS[$i] & " " & $AOSDate[$i]
    end
    
    add $i 1
  end
  
  return
  
  
# SUB:       GetAOSName
# Passed:    $AOS - AOS Sector
# Returned:  $AOSName - AOS Description and Date

:GetAOSName
  if ($AOS[$AOS] = "L")
    setVar $AOSName "Empty planet"
  elseif ($AOS[$AOS] = "P")
    setVar $AOSName "Upgraded port"
  elseif ($AOS[$AOS] = "D")
    setVar $AOSName "SDT zone"
  elseif ($AOS[$AOS] = "F")
    setVar $AOSName "Fedspace sector"
  elseif ($AOS[$AOS] = "S")
    setVar $AOSName "Stardock"
  elseif ($AOS[$AOS] = "B")
    setVar $AOSName "Our base"
  end
  
  setVar $AOSName $AOSName & ".  Recorded " & $AOSDate[$AOS]

  return
 
