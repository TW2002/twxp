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

setVar $Header~Script "Find"

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
loadVar $FindSaved

if ($FindSaved)
  loadVar $Find_FoundText
else
  setVar $Find_FoundText "'Found target sector by my location" & #42
  
  saveVar $Find_FoundText
  
  setVar $FindSaved 1
  saveVar $FindSaved
end

# create setup menu
addMenu "" "Find" "Find Settings" "." "" "Main" FALSE
addMenu "Find" "GO" "GO!" "G" :Menu_Go "" TRUE
addMenu "Find" "FoundText" "Send when found" "S" :Menu_FoundText "" FALSE

setMenuHelp "FoundText" "When the script has found its target sector, it will automatically send this text to the server before terminating.  This is useful for placing commands to T-Warp you back to fedspace if you find an enemy base."

loadVar $MoveSaved

if ($MoveSaved)
  loadVar $Move~ScanHolo
  loadVar $Move~ExtraSend
  replaceText $Move~ExtraSend #42 "*" 
  loadVar $Move~Evasion
  loadVar $Move~Attack
else
  setVar $Move~ScanHolo 1
  setVar $Move~ExtraSend "f1" & #42 & "ct"
  
  saveVar $Move~ScanHolo
  saveVar $Move~ExtraSend
  replaceText $Move~ExtraSend #42 "*" 
  
  setVar $MoveSaved 1
  saveVar $MoveSaved
end

setVar $Move~Menu "Find"
gosub :Move~Menu
setMenuHelp "Move" "This menu will let you configure how the script will navigate the game in search of its target sector."

setVar $TestSector~Menu "Find"
setVar $TestSector~Title "Define sector to find"
gosub :TestSector~SetMenuDefaults
gosub :TestSector~Menu

setMenuHelp "TestSector" "This menu will let you configure a blueprint for the sector you are trying to find.  This script will terminate when it finds the sector."

gosub :sub_SetMenu

# open config menu
openMenu "Find"

:Menu_FoundText
getInput $Find_FoundText "Enter the text to send to the game when the defined sector has been found"
saveVar $Find_FoundText
gosub :sub_SetMenu
openMenu "Find"

:sub_SetMenu
  setMenuValue "FoundText" $Find_FoundText
  return
  

:Menu_Go
setEventTrigger disconnect :disconnected "Connection lost"

# set script prefs to requirements
setVar $GamePrefs~Bank "Find"
setVar $GamePrefs~Animation[$GamePrefs~Bank] OFF
setVar $GamePrefs~PageMessages[$GamePrefs~Bank] OFF
setVar $GamePrefs~AbortDisplayAll[$GamePrefs~Bank] OFF
setVar $GamePrefs~ScreenPauses[$GamePrefs~Bank] OFF
gosub :GamePrefs~SetGamePrefs

# find target sector
setVar $Move~CheckSub :~sub_MoveCheck
send "d"
gosub :Move~Move
replaceText $Find_FoundText #42 "*"
send $Find_FoundText

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
include "include\move"
include "include\testSector"
include "include\gamePrefs"

