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

setVar $Header~Script "Mass Upgrade"

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
loadVar $MassUpgradeSaved

if ($MassUpgradeSaved)
  loadVar $MassUpgrade~IgnoreList
  loadVar $MassUpgrade~Seek
else
  setVar $MassUpgrade~IgnoreList ""
  setVar $MassUpgrade~Seek 1
  saveVar $MassUpgrade~IgnoreList
  saveVar $MassUpgrade~Seek

  setVar $MassUpgradeSaved 1
  saveVar $MassUpgradeSaved
end

# create setup menu
addMenu "" "MassUpgrade" "Mass Upgrade Settings" "." "" "Main" FALSE
addMenu "MassUpgrade" "GO" "GO!" "G" :Menu_Go "" TRUE

setVar $MassUpgrade~Menu "MassUpgrade"
gosub :MassUpgrade~Menu

# set move routine prefs
loadVar $Move~Saved

if ($Move~Saved)
  loadVar $Move~ScanHolo
  loadVar $Move~Evasion
  loadVar $Move~Attack
  loadVar $Move~PortPriority
  loadVar $Move~ExtraSend
  replaceText $Move~ExtraSend #42 "*"
else
  setVar $Move~ScanHolo 1
  setVar $Move~Evasion 0
  setVar $Move~Attack 3
  setVar $Move~PortPriority 1
  setVar $Move~ExtraSend "f1" & #42 & "ct"
  saveVar $Move~ExtraSend
  replaceText $Move~ExtraSend #42 "*"
  
  saveVar $Move~ScanHolo
  saveVar $Move~Evasion
  saveVar $Move~Attack
  saveVar $Move~PortPriority
  
  setVar $Move~Saved 1
  saveVar $Move~Saved
end

setVar $Move~Menu "MassUpgrade"
gosub :Move~Menu
setMenuHelp "Move" "This menu will let you configure how the script will behave as it navigates the game, searching for products to upgrade with."


# open config menu
openMenu "MassUpgrade"

:Menu_Go
setEventTrigger disconnect :disconnected "Connection lost"
gosub :MassUpgrade~MassUpgrade
halt

:disconnected
  # disconnected.  Wait for the prompt then restart
  killAllTriggers
  setEventTrigger disconnect :disconnected "Connection lost"
  
  waitFor "Command [TL="
  goto :Menu_Go
  

# includes:
include "include\header"
include "include\massUpgrade"
include "include\move"
