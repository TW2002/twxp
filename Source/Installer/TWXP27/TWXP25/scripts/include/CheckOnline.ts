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

# SUB:       CheckOnline (template)
# Passed:    $LogFile - Name of file to log changes to ("0" for no logging)
#            $Broadcast - "1" to broadcast changes on sub-space
#            $Init - "0" if CheckOnline subroutine has not been run, or is to be cleared
# Triggered: Anywhere the "#" global will work

:CheckOnline
  # sys_check
  
  send "#"
  setTextLineTrigger pause5 :pause5 "     Who's Playing     "
  pause
  :pause5
  killTrigger checkFailed
  setVar $Count 1
  setTextLineTrigger GetPlayer :GetPlayer
  pause
  
  :GetPlayer
  
  if (CURRENTLINE = "")
    if ($Count = 1)
      setTextLineTrigger GetPlayer :GetPlayer
      pause
    else
      goto :GotPlayers
    end
  end
  
  setVar $StripRank~Player CURRENTLINE
  gosub :StripRank~StripRank
  
  setVar $StripCorp~Player $StripRank~Player
  gosub :StripCorp~StripCorp
  
  setVar $Player $StripCorp~Player
  
  # see if the player exists
  setVar $I 1
  setVar $Found 0
  :NextPlayer
  if ($LastPlayers[$I] <> 0)
    if ($LastPlayers[$I] = $Player)
      setVar $Found 1
    end
    add $I 1
    goto :NextPlayer
  end
  
  if ($Found = 0) and ($Init = 1)
    getDate $date
    getTime $time
    
    if ($Broadcast = "1")
      send "'ONLINEUPDATE: " $Player " has entered the game*"
    end
    if ($LogFile <> "0")
      write $LogFile $date & " " & $time & " - " & "#: " & $Player & " has entered the game"
    end
  end
  
  setVar $Players[$Count] $Player
  add $Count 1
  setTextLineTrigger GetPlayer :GetPlayer
  pause
  
  :GotPlayers
  setVar $Players[$Count] 0

  # check for missing players
  setVar $Count 1
  
  :CheckNextPlayer
  if ($LastPlayers[$Count] <> 0)
    setVar $I 1
    setVar $Found 0
    
    :CheckNextPlayer2
    if ($Players[$I] <> 0)
      if ($Players[$I] = $LastPlayers[$Count])
        setVar $Found 1
      end
      add $I 1
      goto :CheckNextPlayer2
    end
    
    if ($Found = 0)
      getDate $date
      getTime $time
      
      if ($Broadcast = "1")
        send "'ONLINEUPDATE: " $LastPlayers[$Count] " has left the game*"
      end
      if ($LogFile <> "0")
        write $LogFile $date & " " & $time & " - " & "#: " & $LastPlayers[$Count] & " has left the game"
      end
    end
    
    add $Count 1
    goto :CheckNextPlayer
  end
  
  # copy old new list over old one
  setVar $Count 1
  
  :GetNextPlayer
  if ($Players[$Count] <> 0)
    setVar $LastPlayers[$Count] $Players[$Count]
    add $Count 1
    goto :GetNextPlayer
  end
  
  setVar $LastPlayers[$Count] 0
  setVar $Init 1
  return


# includes:
include "include\stripCorp"
include "include\stripRank"
