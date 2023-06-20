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

setVar $Header~Script "Mass Colonise"

# check location
cutText CURRENTLINE $location 1 12
if ($location <> "Command [TL=")
        clientMessage "This script must be run from the command menu"
        halt
end

reqRecording
logging off

gosub :Header~Pack2Header

loadVar $MassColoniseSaved

if ($MassColoniseSaved)
  loadVar $MassColonise_EWarp
else
  setVar $MassColonise_EWarp 0
  saveVar $MassColonise_EWarp

  setVar $MassColoniseSaved 1
  saveVar $MassColoniseSaved
end

# create setup menu
addMenu "" "MassColonise" "Mass Colonise Settings" "." "" "Main" FALSE
addMenu "MassColonise" "GO" "GO!" "G" :Menu_Go "" TRUE
addMenu "MassColonise" "EWarp" "Allow E-Warp colonising" "E" :Menu_EWarp "" FALSE

setMenuHelp "EWarp" "If this option is enabled, this script will perform Express-Warp colonising if it runs out of fuel or for some reason is unable to T-Warp to fedspace."

gosub :sub_SetMenu

# open config menu
openMenu "MassColonise"

:Menu_EWarp
if ($MassColonise_EWarp)
  setVar $MassColonise_EWarp 0
else
  setVar $MassColonise_EWarp 1
end

saveVar $MassColonise_EWarp
gosub :sub_SetMenu
openMenu "MassColonise"

:Menu_Go
setEventTrigger disconnect :disconnected "Connection lost"
setVar $MassColonise~EWarp $MassColonise_EWarp
gosub :MassColonise~MassColonise
halt

:disconnected
  # disconnected.  Wait for the prompt then restart
  killAllTriggers
  
  waitFor "Command [TL="
  goto :Menu_Go

:sub_SetMenu
  if ($MassColonise_EWarp)
    setMenuValue "EWarp" "YES"
  else
    setMenuValue "EWarp" "NO"
  end
  
  return
  

# includes:
include "include\header"
include "include\massColonise"

