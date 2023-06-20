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

# SUB:       StripRank (template)
# Passed:    $Player - Player name with rank
# Triggered: Anywhere
# Returned:  $Player - Player name without rank
#            $Rank - Player rank

:StripRank
  # sys_check
  
  cutText $Player $Rank 1 6 
  if ($Rank = "Robber")
    cutText $Player $Player 8 999
    return
  end
  if ($Rank = "Pirate")
    cutText $Player $Player 8 999
    return
  end
  if ($Rank = "Ensign")
    cutText $Player $Player 8 999
    return
  end
  
  cutText $Player $Rank 1 7 
  if ($Rank = "Captain")
    cutText $Player $Player 9 999
    return
  end
  if ($Rank = "Admiral")
    cutText $Player $Player 9 999
    return
  end
  
  cutText $Player $Rank 1 8
  if ($Rank = "Civilian")
    cutText $Player $Player 10 999
    return
  end
  if ($Rank = "Corporal")
    cutText $Player $Player 10 999
    return
  end
  
  cutText $Player $Rank 1 9 
  if ($Rank = "Annoyance")
    cutText $Player $Player 11 999
    return
  end
  cutText $Player $Rank 1 9 
  if ($Rank = "Terrorist")
    cutText $Player $Player 11 999
    return
  end
  if ($Rank = "Commander")
    cutText $Player $Player 11 999
    return
  end
  if ($Rank = "Commodore")
    cutText $Player $Player 11 999
    return
  end
  
  cutText $Player $Rank 1 10 
  if ($Rank = "Prime Evil")
    cutText $Player $Player 12 999
    return
  end
  
  cutText $Player $Rank 1 12
  if ($Rank = "1st Sergeant")
    cutText $Player $Player 14 999
    return
  end
  if ($Rank = "Rear Admiral")
    cutText $Player $Player 14 999
    return
  end
  if ($Rank = "Vice Admiral")
    cutText $Player $Player 14 999
    return
  end
  if ($Rank = "Dread Pirate")
    cutText $Player $Player 14 999
    return
  end
  
  cutText $Player $Rank 1 13 
  if ($Rank = "Fleet Admiral")
    cutText $Player $Player 15 999
    return
  end
  
  cutText $Player $Rank 1 14
  if ($Rank = "Lance Corporal")
    cutText $Player $Player 16 999
    return
  end
  if ($Rank = "Sergeant Major")
    cutText $Player $Player 16 999
    return
  end
  if ($Rank = "Staff Sergeant")
    cutText $Player $Player 16 999
    return
  end
  
  cutText $Player $Rank 1 15
  if ($Rank = "Warrant Officer")
    cutText $Player $Player 17 999
    return
  end
  if ($Rank = "Lieutenant J.G.")
    cutText $Player $Player 17 999
    return
  end
  if ($Rank = "Smuggler Savant")
    cutText $Player $Player 17 999
    return
  end
  if ($Rank = "Infamous Pirate")
    cutText $Player $Player 17 999
    return
  end
  
  cutText $Player $Rank 1 16
  if ($Rank = "Gunnery Sergeant")
    cutText $Player $Player 18 999
    return
  end
  if ($Rank = "Menace 3rd Class")
    cutText $Player $Player 18 999
    return
  end
  if ($Rank = "Menace 2nd Class")
    cutText $Player $Player 18 999
    return
  end
  if ($Rank = "Menace 1st Class")
    cutText $Player $Player 18 999
    return
  end
  if ($Rank = "Notorious Pirate")
    cutText $Player $Player 18 999
    return
  end
  if ($Rank = "Galactic Scourge")
    cutText $Player $Player 18 999
    return
  end
  if ($Rank = "Heinous Overlord")
    cutText $Player $Player 18 999
    return
  end
  
  cutText $Player $Rank 1 17
  if ($Rank = "Private 1st Class")
    cutText $Player $Player 19 999
    return
  end
  
  cutText $Player $Rank 1 18 
  if ($Rank = "Nuisance 3rd Class")
    cutText $Player $Player 20 999
    return
  end
  if ($Rank = "Nuisance 2nd Class")
    cutText $Player $Player 20 999
    return
  end
  if ($Rank = "Nuisance 1st Class")
    cutText $Player $Player 20 999
    return
  end
  if ($Rank = "Smuggler 3rd Class")
    cutText $Player $Player 20 999
    return
  end
  if ($Rank = "Smuggler 2nd Class")
    cutText $Player $Player 20 999
    return
  end
  if ($Rank = "Smuggler 1st Class")
    cutText $Player $Player 20 999
    return
  end
  if ($Rank = "Enemy of the State")
    cutText $Player $Player 20 999
    return
  end
  if ($Rank = "Enemy of Humankind")
    cutText $Player $Player 20 999
    return
  end
  
  cutText $Player $Rank 1 19 
  if ($Rank = "Enemy of the People")
    cutText $Player $Player 21 999
    return
  end
  
  cutText $Player $Rank 1 20 
  if ($Rank = "Lieutenant Commander")
    cutText $Player $Player 22 999
    return
  end
  
  cutText $Player $Rank 1 21
  if ($Rank = "Chief Warrant Officer")
    cutText $Player $Player 23 999
    return
  end
  
  cutText $Player $Rank 1 7
  if ($Rank = "Private")
    cutText $Player $Player 9 999
    return
  end
  cutText $Player $Rank 1 8
  if ($Rank = "Sergeant")
    cutText $Player $Player 10 999
    return
  end
  cutText $Player $Rank 1 10 
  if ($Rank = "Lieutenant")
    cutText $Player $Player 12 999
    return
  end
  
  return

