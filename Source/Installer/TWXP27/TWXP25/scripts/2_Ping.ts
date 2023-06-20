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

setVar $Header~Script "Ping"

# check location
cutText CURRENTLINE $location 1 12
if ($location <> "Command [TL=")
        clientMessage "This script must be run from the command menu"
        halt
end

reqRecording
logging off

gosub :Header~Pack2Header

# get defaults
loadVar $PingSaved

if ($PingSaved)
  loadVar $Ping_Target
  loadVar $Ping_Trigger
  loadVar $Ping_Safe
  loadVar $Ping_HaltOnBust
else
  setVar $Ping_Target "Player"
  setVar $Ping_Trigger "PING 1"
  setVar $Ping_Safe 1
  setVar $Ping_HaltOnBust 1
  
  saveVar $Ping_Target
  saveVar $Ping_Trigger
  saveVar $Ping_Safe
  saveVar $Ping_HaltOnBust
  
  setVar $PingSaved 1
  saveVar $PingSaved
end

# create setup menu
addMenu "" "Ping" "Ping Settings" "." "" "Main" FALSE
addMenu "Ping" "GO" "GO!" "G" :Menu_Go "" TRUE
addMenu "Ping" "Target" "Target name" "T" :Menu_Target "" FALSE
addMenu "Ping" "Trigger" "Trigger text" "R" :Menu_Trigger "" FALSE
addMenu "Ping" "Safe" "Safe pings" "S" :Menu_Safe "" FALSE
addMenu "Ping" "HaltOnBust" "Halt on bust" "H" :Menu_HaltOnBust "" FALSE

setMenuHelp "Target" "This option lets you set the name of the target you are pinging.  This can be the full or partial name of the trader performing SSF or SDF."
setMenuHelp "Trigger" "This option lets you adjust the text that this script will trigger its pings from.  When this script sees the trigger text, it will automatically try to ping the target player."
setMenuHelp "Safe" "This option lets you choose if you want to perform safe pinging.  Safe pinging will always check to see where the target player is before it pings them, it will also terminate the script if the player's fighter count gets too low.  Unfortunately it is also slower."
setMenuHelp "HaltOnBust" "If this option is enabled, this script will automatically terminate if the player performing SSF/SDF reports a bust on the radio."

gosub :sub_SetMenu

# open config menu
openMenu "Ping"

:Menu_Target
getInput $Ping_Target "Enter the name of the player to ping"

saveVar $Ping_Target
gosub :sub_SetMenu
openMenu "Ping"

:Menu_Trigger
getInput $Ping_Trigger "Enter the text to trigger a ping"
saveVar $Ping_Trigger
gosub :sub_SetMenu
openMenu "Ping"

:Menu_Safe
if ($Ping_Safe)
  setVar $Ping_Safe 0
else
  setVar $Ping_Safe 1
end

saveVar $Ping_Safe
gosub :sub_SetMenu
openMenu "Ping"

:Menu_HaltOnBust
if ($Ping_HaltOnBust)
  setVar $Ping_HaltOnBust 0
else
  setVar $Ping_HaltOnBust 1
end

saveVar $Ping_HaltOnBust
gosub :sub_SetMenu
openMenu "Ping"


:sub_SetMenu
  setMenuValue "Target" $Ping_Target
  setMenuValue "Trigger" $Ping_Trigger
  
  if ($Ping_Safe)
    setMenuValue "Safe" "YES"
  else
    setMenuValue "Safe" "NO"
  end
  
  if ($Ping_HaltOnBust)
    setMenuValue "HaltOnBust" "YES"
  else
    setMenuValue "HaltOnBust" "NO"
  end

  return
  

:Menu_Go
setEventTrigger disconnect :disconnected "Connection lost"

if ($Ping_HaltOnBust)
  setTextTrigger busted :busted "Busted."
end

if ($Ping_Safe)
  :pingSafe
  # repeat getTarget for every ping
  setVar $GetTarget~Target $Ping_Target
  gosub :GetTarget~GetTarget
  
  if ($GetTarget~Index <> "")
    if ($GetTarget~Figs <= 5)
      clientMessage "Target has too few fighters left to continue pinging"
      halt
    end
  
    gosub :GetAttack~GetAttack
    send $GetAttack~Attack "y1**"
  end
  
  setTextTrigger pingSafe :pingSafe $Ping_Trigger
  pause
else
  # get target attack string
  setVar $GetTarget~Target $Ping_Target
  gosub :GetTarget~GetTarget
  
  if ($GetTarget~Index = "")
    clientMessage "Target not found"
    halt
  end
  
  gosub :GetAttack~GetAttack
  setVar $attack $GetAttack~Attack & "y1**"

  :PingFast
  send $attack
  setTextTrigger pingFast :pingFast $Ping_Trigger
  pause
end


:busted
# verify it
getWord CURRENTLINE $test 1
if ($test = "R")
  getWord CURRENTLINE $test 2
  getWordPos $Ping_Target $pos $test
  if ($pos > 0)
    clientMessage "Ping target has busted - halting."
    halt
  end
end

setTextTrigger busted :busted "Busted."
pause

halt

:sub_MoveCheck
  # check adjacents to this sector
  setVar $i 1
  
  send "sh"
  waitOn "Long Range Scan"
  waitOn "Command [TL="
  setVar $Move~scannedHolo 1
  
  while ($i <= SECTOR.WARPCOUNT[$Move~CurSector])
    setVar $TestSector~Sector SECTOR.WARPS[$Move~CurSector][$i]
    gosub :TestSector~TestSector
    setVar $Move~Found $TestSector~Match
    
    if ($Move~Found)
      return
    end
    
    add $i 1
  end
  
  return


:disconnected
  # Disconnected.  Wait for reconnect then resume
  killAllTriggers
  setEventTrigger disconnect :disconnected "Connection lost"
  
  waitOn "Command [TL="
  goto :Menu_Go
  

# includes:
include "include\header"
include "include\getTarget"
include "include\getAttack"