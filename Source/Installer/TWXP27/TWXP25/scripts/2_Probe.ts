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

setVar $Header~Script "Probe"

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
loadVar $ProbeSaved

if ($ProbeSaved)
  loadVar $probe_CreditLimit
  loadVar $probe_UseSearchSector
  loadVar $probe_ListFile
  loadVar $probe_UnreachedFile
  loadVar $probe_BlockedFile
  loadVar $probe_Start
  loadVar $probe_ProbeExplored
  loadVar $probe_AvoidBlocks
  loadVar $probe_TurnLimit
  loadVar $probe_UseSearchSector
else
  setVar $probe_UseSearchSector 0
  setVar $probe_ListFile ""
  setVar $probe_UnreachedFile ""
  setVar $probe_BlockedFile ""
  setVar $probe_Start 1

  saveVar $probe_CreditLimit
  saveVar $probe_UseSearchSector
  saveVar $probe_ListFile
  saveVar $probe_UnreachedFile
  saveVar $probe_BlockedFile
  saveVar $probe_Start
  saveVar $probe_ProbeExplored
  saveVar $probe_AvoidBlocks
  saveVar $probe_TurnLimit
  saveVar $probe_UseSearchSector

  setVar $ProbeSaved 1
  saveVar $ProbeSaved
end



# create setup menu
addMenu "" "Probe" "Probe Settings" "." "" "Main" FALSE
addMenu "Probe" "GO" "GO!" "G" :Menu_Go "" TRUE
addMenu "Probe" "CreditLimit" "Credit limit" "C" :Menu_CreditLimit "" FALSE
addMenu "Probe" "TurnLimit" "Turn limit" "T" :Menu_TurnLimit "" FALSE
addMenu "Probe" "ProbeExplored" "Probe explored sectors" "X" :Menu_ProbeExplored "" FALSE
addMenu "Probe" "AvoidBlocks" "Avoid blocked sectors" "B" :Menu_AvoidBlocks "" FALSE
addMenu "Probe" "ListFile" "Sector list file" "L" :Menu_ListFile "" FALSE
addMenu "Probe" "Start" "Start sector index" "S" :Menu_Start "" FALSE
addMenu "Probe" "UnreachedFile" "Unreached sector file" "U" :Menu_UnreachedFile "" FALSE
addMenu "Probe" "BlockedFile" "Blocked sector file" "K" :Menu_BlockedFile "" FALSE
addMenu "Probe" "UseSearchSector" "Use search sector" "E" :Menu_UseSearchSector "" FALSE

setMenuHelp "CreditLimit" "This option controls how many credits this script will use.  This script will terminate before your player's credits fall below this level."
setMenuHelp "TurnLimit" "This option controls how many turns this script will use.  This script will terminate before your player's turns fall below this level."
setMenuHelp "ProbeExplored" "If this option is enabled, this script will send probes to sectors that have already been explored - otherwise it will ignore them, even if they are listed."
setMenuHelp "AvoidBlocks" "If this option is enabled, this script will automatically avoid any sectors where probes are destroyed.  As the avoid list gets bigger, less probes will be lost to enemy fighters."
setMenuHelp "ListFile" "This option lets you choose a list file to probe from.  List files are simply text files have each probe sector on a new line.  If no list file is supplied, the script will probe to every sector in the game in sequence from 1 to " & SECTORS
setMenuHelp "Start" "This option lets you choose the first sector to probe to.  Note that this is the INDEX of the sector, not its number.  If you are using a sector list, you need to enter the line number in your list of the first sector you want to probe to."
setMenuHelp "UnreachedFile" "This option allows you to set a file to output to a list of sectors that your probes were unable to reach."
setMenuHelp "BlockedFile" "This option allows you to set a file to output to a list of sectors that your probes were destroyed in."
setMenuHelp "UseSearchSector" "If this option is enabled, the script will make use of the specified search sector."

setVar $TestSector~Menu "Probe"
setVar $TestSector~Title "Define search sector"
gosub :TestSector~SetMenuDefaults
gosub :TestSector~Menu
setMenuHelp "TestSector" "This menu lets you define the blueprint for a sector you are searching for.  When a probe passes through a sector matching this blueprint, the script will terminate."

gosub :sub_SetMenu
openMenu "Probe"

:Menu_CreditLimit
getInput $value "Enter a credit limit (0 for none)"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_CreditLimit
end
if ($value < 0)
  echo ANSI_15 "**Bad value*"
  goto :Menu_CreditLimit
end
setVar $probe_CreditLimit $value
saveVar $probe_CreditLimit
gosub :sub_SetMenu
openMenu "Probe"

:Menu_Start
getInput $value "Enter an index to start from"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_Start
end
if ($value < 0)
  echo ANSI_15 "**Bad value*"
  goto :Menu_Start
end
setVar $probe_Start $value
saveVar $probe_Start
gosub :sub_SetMenu
openMenu "Probe"

:Menu_TurnLimit
getInput $value "Enter a turn limit (0 for none)"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :Menu_TurnLimit
end
if ($value < 0)
  echo ANSI_15 "**Bad value*"
  goto :Menu_TurnLimit
end
setVar $probe_TurnLimit $value
saveVar $probe_TurnLimit
gosub :sub_SetMenu
openMenu "Probe"

:Menu_ProbeExplored
if ($probe_ProbeExplored)
  setVar $probe_ProbeExplored 0
else
  setVar $probe_ProbeExplored 1
end

saveVar $probe_ProbeExplored
gosub :sub_SetMenu
openMenu "Probe"

:Menu_AvoidBlocks
if ($probe_AvoidBlocks)
  setVar $probe_AvoidBlocks 0
else
  setVar $probe_AvoidBlocks 1
end

saveVar $probe_AvoidBlocks
gosub :sub_SetMenu
openMenu "Probe"

:Menu_ListFile
getInput $probe_ListFile "Enter sector list filename (blank for none)"
saveVar $probe_ListFile
gosub :sub_SetMenu
openMenu "Probe"

:Menu_UnreachedFile
getInput $probe_UnreachedFile "Enter unreached sector list filename (blank for none)"
saveVar $probe_UnreachedFile
gosub :sub_SetMenu
openMenu "Probe"

:Menu_BlockedFile
getInput $probe_BlockedFile "Enter blocked sector list filename (blank for none)"
saveVar $probe_BlockedFile
gosub :sub_SetMenu
openMenu "Probe"

:Menu_UseSearchSector
if ($probe_UseSearchSector)
  setVar $probe_UseSearchSector 0
else
  setVar $probe_UseSearchSector 1
end

saveVar $probe_UseSearchSector
gosub :sub_SetMenu
openMenu "Probe"


:Menu_Go
setVar $Probe~CreditLimit $probe_CreditLimit
setVar $Probe~TurnLimit $probe_TurnLimit
setVar $Probe~ProbeExplored $probe_ProbeExplored
setVar $Probe~AvoidBlocks $probe_AvoidBlocks
setVar $Probe~ListFile $probe_ListFile
setVar $Probe~Start $probe_Start
setVar $Probe~UnreachedFile $probe_UnreachedFile
setVar $Probe~BlockedFile $probe_BlockedFile
setVar $Probe~CheckSub :~sub_CheckSearch
gosub :Probe~Probe
halt

:sub_SetMenu
  # set menu values
  setMenuValue "CreditLimit" $probe_CreditLimit
  setMenuValue "TurnLimit" $probe_TurnLimit
  
  if ($probe_ProbeExplored)
    setMenuValue "ProbeExplored" YES
  else
    setMenuValue "ProbeExplored" NO
  end
  
  if ($probe_AvoidBlocks)
    setMenuValue "AvoidBlocks" YES
  else
    setMenuValue "AvoidBlocks" NO
  end
  
  setMenuValue "ListFile" $probe_ListFile
  setMenuValue "Start" $probe_Start
  setMenuValue "UnreachedFile" $probe_UnreachedFile
  setMenuValue "BlockedFile" $probe_BlockedFile
  
  if ($probe_UseSearchSector)
    setMenuValue "UseSearchSector" YES
  else
    setMenuValue "UseSearchSector" NO
  end
  
  return
  

:sub_CheckSearch
  if ($probe_UseSearchSector)
    setVar $TestSector~Sector $Probe~ProbeSector
    gosub :TestSector~TestSector
    setVar $Probe~Found $TestSector~Match
  else
    setVar $Probe~Found 0
  end
  
  return



# includes:

include "include\header"
include "include\probe"
include "include\testSector"

