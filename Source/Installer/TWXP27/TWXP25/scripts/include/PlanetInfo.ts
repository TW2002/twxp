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

# SUB:       PlanetInfo
# Triggered: Prior to display of planet
# Passed:    $NoHeader - "1" to avoid triggering on "Planet #"
# Returned:  $ID - Planet ID number
#            $Class - Planet class name
#            $Code - Planet class code
#            $Sector - Planet sector
#            $Name - Planet name
#            $Creator - Planet creator
#            $Owner - Planet owner
#            $CitadelLevel - Planet citadel level
#            $Treasury - Planet treasury credits
#            $BuildTime - Time to construct next citadel level
#            $Colo[1] - Colonists in fuel production
#            $Colo[2] - Colonists in organics production
#            $Colo[3] - Colonists in equipment production
#            $Rate[1] - Production rate for fuel
#            $Rate[2] - Production rate for organics
#            $Rate[3] - Production rate for equipment
#            $Rate[4] - Production rate for figs
#            $Prod[1] - Daily production amount for fuel
#            $Prod[2] - Daily production amount for organics
#            $Prod[3] - Daily production amount for equipment
#            $Prod[4] - Daily production amount for figs
#            $Amount[1] - Fuel on planet
#            $Amount[2] - Organics on planet
#            $Amount[3] - Equipment on planet
#            $Amount[4] - Figs on planet
#            $Max[1] - Max fuel planet will hold
#            $Max[2] - Max organics planet will hold
#            $Max[3] - Max equipment planet will hold
#            $Max[4] - Max fighters planet will hold
#            $Full[1] - "1" if planet is overfull with colos in Fuel
#            $Full[2] - "1" if planet is overfull with colos in Organics
#            $Full[3] - "1" if planet is overfull with colos in Equipment
#            $DropCategory - Best category ("1", "2", "3") to deposit colonists

:PlanetInfo
  # sys_check
  
  if ($NoHeader = 0)
    setTextLineTrigger Header :Header "Planet #"
  else
    setVar $ID 0
    setVar $Sector 0
    setVar $Name ""
  end
  
  setVar $BuildTime 0
  setVar $CitadelLevel 0
  setVar $Treasury 0
    
  setTextLineTrigger Class :Class "Class "
   setTextLineTrigger Creator :Creator "Created by: "
  setTextLineTrigger Owner :Owner "Claimed by: "
  pause
  
  :Header
  getWord CURRENTLINE $ID 2

  stripText $ID "#"
  getWord CURRENTLINE $Sector 5
  stripText $Sector ":"
  getWord CURRENTLINE $test 6
  
  if ($test <> "0")
    getWordPos CURRENTLINE $Pos ": "
    cutText CURRENTLINE $Name ($Pos + 2) 999
  else
    setVar $Name $test
  end
  
  pause
  
  :Class
  getWord CURRENTLINE $Code 2
  stripText $Code ","
  getLength $Code $Len
  cutText CURRENTLINE $Class ($Len + 9) 999
  pause
  
  :Creator
  getWord CURRENTLINE $test 3
  if ($test = "0")
    setVar $Creator ""
  else
    cutText CURRENTLINE $Creator 13 999
  end
  pause
  
  :Owner
  getWord CURRENTLINE $test 3
  if ($test = "0")
    setVar $Owner ""
  else
    cutText CURRENTLINE $Owner 13 999
  end
  
  waitOn "-------  ---------  ---------"
  setTextLineTrigger FuelOre :FuelOre "Fuel Ore   "
  setTextLineTrigger Organics :Organics "Organics   "
  setTextLineTrigger Equipment :Equipment "Equipment  "
  setTextLineTrigger Fighters :Fighters "Fighters    "
  setTextLineTrigger CitadelLevel :CitadelLevel "Planet has a level "
  setTextLineTrigger BuildTime :BuildTime " under construction, "
  setTextTrigger InfoDone :InfoDone "Planet command (?=help) [D]"
  pause
  
  :FuelOre
  getWord CURRENTLINE $Colo[1] 3
  stripText $Colo[1] ","
  getWord CURRENTLINE $Rate[1] 4
  stripText $Rate[1] ","
  getWord CURRENTLINE $Prod[1] 5
  stripText $Prod[1] ","
  getWord CURRENTLINE $Amount[1] 6
  stripText $Amount[1] ","
  getWord CURRENTLINE $Max[1] 8
  stripText $Max[1] ","
  pause
  
  :Organics
  getWord CURRENTLINE $Colo[2] 2
  stripText $Colo[2] ","
  getWord CURRENTLINE $Rate[2] 3
  stripText $Rate[2] ","
  getWord CURRENTLINE $Prod[2] 4
  stripText $Prod[2] ","
  getWord CURRENTLINE $Amount[2] 5
  stripText $Amount[2] ","
  getWord CURRENTLINE $Max[2] 7
  stripText $Max[2] ","
  pause
  
  :Equipment
  getWord CURRENTLINE $Colo[3] 2
  stripText $Colo[3] ","
  getWord CURRENTLINE $Rate[3] 3
  stripText $Rate[3] ","
  getWord CURRENTLINE $Prod[3] 4
  stripText $Prod[3] ","
  getWord CURRENTLINE $Amount[3] 5
  stripText $Amount[3] ","
  getWord CURRENTLINE $Max[3] 7
  stripText $Max[3] ","
  pause
  
  :Fighters
  getWord CURRENTLINE $Rate[4] 3
  stripText $Rate[4] ","
  getWord CURRENTLINE $Prod[4] 4
  stripText $Prod[4] ","
  getWord CURRENTLINE $Amount[4] 5
  stripText $Amount[4] ","
  getWord CURRENTLINE $Max[4] 7
  stripText $Max[4] ","
  
  # calculate if planet is over-full
  setVar $i 1
  :i
  setVar $Full[$i] 0
  
  if ($i <= 3)
    if ($Rate[$i] <> "N/A")
      if (($Colo[$i] / $Rate[$i]) > ($Prod[$i] + 1))
        setVar $Full[$i] 1
      end
    end
    
    add $i 1
    goto :i
  end
  
  pause
  
  :CitadelLevel
  getWord CURRENTLINE $CitadelLevel 5
  getWord CURRENTLINE $Treasury 9
  pause

  :BuildTime
  getWordPos CURRENTLINE $pos " under construction, "
  cutText CURRENTLINE $line $pos 999
  getWord $line $BuildTime 3
  pause
  
  :InfoDone
  
  # calculate which category is best for dropping more colonists
  setVar $best 0
  setVar $bestScore 500000
  setVar $i 1
  
  while ($i <= 3)
    if ($Rate[$i] <> "N/A") and ($Full[$i] = 0)
      if ($Rate[$i] < $bestScore)
        setVar $best $i
        setVar $bestScore $Rate[$i]
      end
    end
  
    add $i 1
  end
  
  if ($best = 0)
    # no good drop categories, just use the first one
    setVar $DropCategory 1
  else
    setVar $DropCategory $best
  end  
  
  killTrigger BuildTime
  killTrigger CitadelLevel
  setVar $NoHeader 0
  return
