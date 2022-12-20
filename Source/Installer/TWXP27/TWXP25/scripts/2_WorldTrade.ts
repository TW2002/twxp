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

setVar $Header~Script "World Trade"

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
loadVar $WorldTradeSaved

if ($WorldTradeSaved)
  loadVar $Haggle~HaggleFactor
else
  setVar $Haggle~HaggleFactor 7
  saveVar $Haggle~HaggleFactor
  
  setVar $WorldTradeSaved 1
  saveVar $WorldTradeSaved
end

# create setup menu
addMenu "" "WorldTrade" "World Trade Settings" "." "" "Main" FALSE
addMenu "WorldTrade" "GO" "GO!" "G" :Menu_Go "" TRUE

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
  setVar $Move~Attack 0
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
setVar $Move~Menu "WorldTrade"
gosub :Move~Menu
setMenuHelp "Move" "This menu lets you configure how the script will navigate the game, searching for port pairs."

# set PPT prefs
loadVar $PPT~Saved

if ($PPT~Saved)
  loadVar $PPT~DropFigs
  loadVar $PPT~PercTrade
else
  setVar $PPT~DropFigs 1
  setVar $PPT~PercTrade 20
  
  saveVar $PPT~DropFigs
  saveVar $PPT~PercTrade
  
  setVar $PPT~Saved 1
  saveVar $PPT~Saved
end

setVar $PPT~Menu "WorldTrade"
gosub :PPT~Menu

# set PPTCheck prefs
loadVar $PortCheck~Saved

if ($PortCheck~Saved)
  loadVar $PortCheck~Danger
  loadVar $PortCheck~FuelOrganics
  loadVar $PortCheck~PortType    
else
  setVar $PortCheck~Danger 0
  setVar $PortCheck~FuelOrganics 1
  setVar $PortCheck~PortType 1
  
  saveVar $PortCheck~Danger
  saveVar $PortCheck~FuelOrganics
  saveVar $PortCheck~PortType
  
  setVar $PortCheck~Saved 1
  saveVar $PortCheck~Saved
end

gosub :PortCheck~Menu
setMenuHelp "PPT" "This menu lets you configure how the script performs its port-pair-trading."

# open config menu
openMenu "WorldTrade"

:Menu_Go
setVar $WorldTrade~Quota 0
setEventTrigger disconnect :disconnected "Connection lost"
gosub :WorldTrade~WorldTrade
halt

:disconnected
  # disconnected.  Wait for the prompt then restart
  killAllTriggers
  
  waitFor "Command [TL="
  goto :Menu_Go
  

# includes:
include "include\header"
include "include\worldTrade"
