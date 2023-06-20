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

setVar $Header~Script "Sentinel"

reqRecording
logging off

gosub :Header~Pack2Header

# get defaults
loadVar $SentinelSaved

if ($SentinelSaved)
  loadVar $sentinel_PerformCIM
  loadVar $sentinel_PerformCLV
  loadVar $sentinel_PerformOnline
  loadVar $sentinel_BroadcastSS
  loadVar $sentinel_CLVDetail
  loadVar $sentinel_CLVCorp
  loadVar $sentinel_Inactivity
  loadVar $sentinel_CycleTime
  loadVar $sentinel_LogFile
else
  setVar $sentinel_PerformCIM 1
  setVar $sentinel_PerformCLV 1
  setVar $sentinel_PerformOnline 1
  setVar $sentinel_BroadcastSS 1
  setVar $sentinel_CLVDetail 1
  setVar $sentinel_CLVCorp 0
  setVar $sentinel_Inactivity 0
  setVar $sentinel_CycleTime 30000
  setVar $sentinel_LogFile ""

  saveVar $sentinel_PerformCIM
  saveVar $sentinel_PerformCLV
  saveVar $sentinel_PerformOnline
  saveVar $sentinel_BroadcastSS
  saveVar $sentinel_CLVDetail
  saveVar $sentinel_CLVCorp
  saveVar $sentinel_Inactivity
  saveVar $sentinel_CycleTime
  saveVar $sentinel_LogFile

  setVar $SentinelSaved 1
  saveVar $SentinelSaved
end

if (CONNECTED = 0)
  # jump to inactivity mode
  clientMessage "No connection detected - jumping to inactivity mode with last used settings"
  goto :Inactivity
end

addMenu "" "Sentinel" "Sentinel Settings" "." "" "Main" FALSE
addMenu "Sentinel" "GO" "GO!" "G" :Menu_Go "" TRUE
addMenu "Sentinel" "PerformCIM" "Perform CIM checks" "I" :Menu_PerformCIM "" FALSE
addMenu "Sentinel" "PerformCLV" "Perform CLV checks" "C" :Menu_PerformCLV "" FALSE
addMenu "Sentinel" "PerformOnline" "Perform online checks" "O" :Menu_PerformOnline "" FALSE
addMenu "Sentinel" "BroadcastSS" "Broadcast on subspace" "B" :Menu_BroadcastSS "" FALSE
addMenu "Sentinel" "CLVDetail" "CLV detail level" "D" :Menu_CLVDetail "" FALSE
addMenu "Sentinel" "CLVCorp" "Watch corp on CLV" "W" :Menu_CLVCorp "" FALSE
addMenu "Sentinel" "Inactivity" "Inactivity Mode" "A" :Menu_Inactivity "" FALSE
addMenu "Sentinel" "LogFile" "Log output to file" "L" :Menu_LogFile "" FALSE
addMenu "Sentinel" "CycleTime" "Check cycle time (ms)" "Y" :Menu_CycleTime "" FALSE

setMenuHelp "PerformCIM" "If this option is enabled, the script will perform a full CIM check with every cycle."
setMenuHelp "PerformCLV" "If this option is enabled, the script will perform a CLV check with every cycle.  Note that the script must be either at the sector command prompt or in a planet citadel for the CLV check to actually work."
setMenuHelp "PerformOnline" "If this option is enabled, the script will perform a user-online check with every cycle."
setMenuHelp "BroadcastSS" "If this option is enabled, the script will broadcast all changes on the sub-space radio."
setMenuHelp "CLVDetail" "This option lets you adjust the level of detail you want when the script performs its CLV checks.  There are three settings.**LOW: The script will report only changes in player's ships.*MEDIUM: The script will report only changes in player's ships, or shifts in alignment/experience >= 25.*HIGH: The script will report all changes in player's ships, alignment and experience."
setMenuHelp "CLVCorp" "This option will let you configure a corp number to 'watch' when performing CLV checks.  If MBBS mode is disabled, the script will report (through calculation of alignment shifts) on anyone that destroys fighters belonging to this corp."
setMenuHelp "Inactivity" "If this option is enabled, the script will run in the background and remain inactive until it receives an inactivity warning from the remote server."
setMenuHelp "LogFile" "This option lets you specify a text file to log all changes to.  These changes will be logged according to the date and time, making it easy for you to read over them later and see what happened."
setMenuHelp "CycleTime" "This option lets you set the time delay (in milliseconds) between each check cycle."

gosub :sub_SetMenu
openMenu "Sentinel"

:Menu_PerformCIM
if ($sentinel_PerformCIM)
  setVar $sentinel_PerformCIM 0
else
  setVar $sentinel_PerformCIM 1
end

saveVar $sentinel_PerformCIM
gosub :sub_SetMenu
openMenu "Sentinel"

:Menu_PerformCLV
if ($sentinel_PerformCLV)
  setVar $sentinel_PerformCLV 0
else
  setVar $sentinel_PerformCLV 1
end

saveVar $sentinel_PerformCLV
gosub :sub_SetMenu
openMenu "Sentinel"

:Menu_PerformOnline
if ($sentinel_PerformOnline)
  setVar $sentinel_PerformOnline 0
else
  setVar $sentinel_PerformOnline 1
end

saveVar $sentinel_PerformOnline
gosub :sub_SetMenu
openMenu "Sentinel"

:Menu_BroadcastSS
if ($sentinel_BroadcastSS)
  setVar $sentinel_BroadcastSS 0
else
  setVar $sentinel_BroadcastSS 1
end

saveVar $sentinel_BroadcastSS
gosub :sub_SetMenu
openMenu "Sentinel"

:Menu_CLVDetail
if ($sentinel_CLVDetail = 0)
  setVar $sentinel_CLVDetail 2
elseif ($sentinel_CLVDetail = 2)
  setVar $sentinel_CLVDetail 1
else
  setVar $sentinel_CLVDetail 0
end

saveVar $sentinel_CLVDetail
gosub :sub_SetMenu
openMenu "Sentinel"

:Menu_CLVCorp
getInput $sentinel_CLVCorp "Enter the number of the corp to 'watch', or '0' for none"
saveVar $sentinel_CLVCorp
gosub :sub_SetMenu
openMenu "Sentinel"

:Menu_LogFile
getInput $sentinel_LogFile "Enter a file name to log to, or blank for none"
saveVar $sentinel_LogFile
gosub :sub_SetMenu
openMenu "Sentinel"

:Menu_Inactivity
if ($sentinel_Inactivity)
  setVar $sentinel_Inactivity 0
else
  setVar $sentinel_Inactivity 1
end
saveVar $sentinel_Inactivity
gosub :sub_SetMenu
openMenu "Sentinel"

:Menu_CycleTime
getInput $sentinel_CycleTime "Enter time delay between check cycles (ms)"
saveVar $sentinel_CycleTime
gosub :sub_SetMenu
openMenu "Sentinel"

:Menu_Go

if ($sentinel_LogFile = "")
  setVar $sentinel_LogFile "0"
end

if ($sentinel_Inactivity)
  :inactivityReset
  killTrigger cycleDelay
  setTextLineTrigger inactivity :inactivity "INACTIVITY WARNING"
  pause
  
  :inactivity
  getWord CURRENTLINE $test 1
  if ($test <> "INACTIVITY")
    goto :inactivityReset
  end
  
  setTextOutTrigger inactivityTextOut :inactivityTextOut
  goto :activate
  
  :inactivityTextOut
  getOutText $text 
  processOut $text
  goto :inactivityReset
end


:activate

if ($sentinel_PerformCLV)
  # check if we're at the command prompt or in a citadel
  getWord CURRENTLINE $test 1
  
  if ($test = "Command") or ($test = "Citadel")
    setVar $CheckCLV~LogFile $sentinel_LogFile
    setVar $CheckCLV~Broadcast $sentinel_BroadcastSS
    setVar $CheckCLV~Detail $sentinel_CLVDetail
    setVar $CheckCLV~FigCorp $sentinel_CLVCorp
    send "clvq"
    gosub :CheckCLV~CheckCLV
  end
end

if ($sentinel_PerformOnline)
  setVar $CheckOnline~LogFile $sentinel_LogFile
  setVar $CheckOnline~Broadcast $sentinel_BroadcastSS
  gosub :CheckOnline~CheckOnline
end

if ($sentinel_PerformCIM)
  setVar $CheckCIM~LogFile $sentinel_LogFile
  setVar $CheckCIM~Broadcast $sentinel_BroadcastSS
  gosub :CheckCIM~CheckCIM
end

setDelayTrigger cycleDelay :activate $sentinel_CycleTime
pause


:sub_SetMenu
  if ($sentinel_PerformCIM)
    setMenuValue "PerformCIM" YES
  else
    setMenuValue "PerformCIM" NO
  end
  
  if ($sentinel_PerformCLV)
    setMenuValue "PerformCLV" YES
  else
    setMenuValue "PerformCLV" NO
  end
  
  if ($sentinel_PerformOnline)
    setMenuValue "PerformOnline" YES
  else
    setMenuValue "PerformOnline" NO
  end
  
  if ($sentinel_BroadcastSS)
    setMenuValue "BroadcastSS" YES
  else
    setMenuValue "BroadcastSS" NO
  end
  
  if ($sentinel_CLVDetail = 0)
    setMenuValue "CLVDetail" LOW
  elseif ($sentinel_CLVDetail = 2)
    setMenuValue "CLVDetail" MEDIUM
  else
    setMenuValue "CLVDetail" HIGH
  end
  
  if ($sentinel_Inactivity)
    setMenuValue "Inactivity" ON
  else
    setMenuValue "Inactivity" OFF
  end
  
  setMenuValue "CLVCorp" $sentinel_CLVCorp
  setMenuValue "LogFile" $sentinel_LogFile
  setMenuValue "CycleTime" $sentinel_CycleTime
  
  return


# includes:

include "include\header"
include "include\checkCLV"
include "include\checkOnline"
include "include\checkCIM"
