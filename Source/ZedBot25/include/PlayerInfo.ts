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

# SUB:       InfoQuick
# Triggered: Anywhere the quick info global ("/") will work
# Returned:  $Sector - Current sector
#            $Turns - Turns left
#            $Credits - Credits
#            $Fighters - Fighters on ship
#            $Shields - Shield points on ship
#            $Holds - Total ship holds
#            $Ore - Fuel ore
#            $Org - Organics
#            $Equip - Equipment
#            $Colonists - Colonists
#            $Photons - Photons
#            $Mines - Armid mines
#            $Limpets - Limpet mines
#            $GenTorps - Genesis torps
#            $TWarp - TWarp level ("0", "1", "2")
#            $Cloaks - Cloaking devices
#            $Beacons - Marker beacons
#            $Dets - Atomic detonators
#            $Corbo - Corbomite devices
#            $Probes - Ether probes
#            $Disruptors - Mine disruptors
#            $PsiProbe - Psi Probe ("0" or "1")
#            $PlanetScanner - Planet scanner ("0" or "1")
#            $Scanner - Scanner type ("0", "1", "2")
#            $Align - Player alignment
#            $Experience - Player experience
#            $Corp - Player corp
#            $Ship - Player ship ID 

:InfoQuick
  # sys_check
  
  send "/"
  setVar $line ""
  KillTrigger line
  setTextLineTrigger line :line 
  pause

  :line
  getWordPos CURRENTLINE $Pos #179
  getWord CURRENTLINE $Test 1
  
  if ($Pos = "0") and ($Test <> "Ship")
    if ($line <> "")
      # check done
      return
    end
    setTextLineTrigger line :line 
    pause
  end

  setVar $line CURRENTLINE
  stripText $line ","
  replaceText $line #179 " "
  
  setVar $param 1
  :Next
  getWord $line $word $param
  getWord $line $value ($param + 1)
  
  if ($word = "0")
    setTextLineTrigger line :line 
    pause
  end
  
  if ($word = "Sect")
    setVar $Sector $value
  elseif ($word = "Turns")
    setVar $Turns $value
  elseif ($word = "Creds")
    setVar $Credits $value
  elseif ($word = "Figs")
    setVar $Fighters $value
  elseif ($word = "Shlds")
    setVar $Shields $value
  elseif ($word = "Hlds")
    setVar $Holds $value
  elseif ($word = "Ore")
    setVar $Ore $value
  elseif ($word = "Org")
    setVar $Org $value
  elseif ($word = "Equ")
    setVar $Equip $value
  elseif ($word = "Col")
    setVar $Colonists $value
  elseif ($word = "Phot")
    setVar $Photons $value
  elseif ($word = "Armd")
    setVar $Mines $value
  elseif ($word = "Lmpt")
    setVar $Limpets $value
  elseif ($word = "GTorp")
    setVar $GenTorps $value
  elseif ($word = "TWarp")
    if ($value = "No")
      setVar $TWarp "0"
    else
      setVar $TWarp $value
    end
  elseif ($word = "Clks")
    setVar $Cloaks $value
  elseif ($word = "Beacns")
    setVar $Beacons $value
  elseif ($word = "AtmDt")
    setVar $Dets $value
  elseif ($word = "Crbo")
    setVar $Corbo $value
  elseif ($word = "EPrb")
    setVar $Probes $value
  elseif ($word = "MDis")
    setVar $Disruptors $value
  elseif ($word = "PsPrb")
    if ($value = "Yes")
      setVar $PsiProbe "1"
    else
      setVar $PsiProbe "0"
    end
  elseif ($word = "PlScn")
    if ($value = "Yes")
      setVar $PlanetScanner "1"
    else
      setVar $PlanetScanner "0"
    end
  elseif ($word = "LRS")
    if ($value = "None")
      setVar $Scanner "0"
    elseif ($value = "Holo")
      setVar $Scanner "2"
    else
      setVar $Scanner "1"
    end
  elseif ($word = "Aln")
    setVar $Align $value
  elseif ($word = "Exp")
    setVar $Experience $value
  elseif ($word = "Corp")
    setVar $Corp $value
  elseif ($word = "Ship")
    setVar $Ship $value
  end
  
  add $param 2
  goto :Next
