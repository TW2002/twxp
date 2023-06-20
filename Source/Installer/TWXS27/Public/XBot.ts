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

systemScript

# give any other XBot scripts time to terminate
setDelayTrigger startPause :startPause 100
pause
:startPause

# Configuration
setVar $ShipStats~ShipFile GAMENAME & ".set"
setVar $Capture~ShipOffensive 10
setArray $macros 255

loadVar $xbot_saved

if ($xbot_saved)
  loadVar $xbot_CheckCIM
  loadVar $xbot_CheckCLV
  loadVar $xbot_CLVDetail
  loadVar $xbot_CLVCorp
  loadVar $xbot_CheckOnline
  loadVar $xbot_Broadcast
else
  setVar $xbot_CheckCIM 4
  setVar $xbot_CheckCLV 1
  setVar $xbot_CLVDetail 2
  setVar $xbot_CLVCorp 1
  setVar $xbot_CheckOnline 1
  setVar $xbot_Broadcast 1
  
  saveVar $xbot_CheckCIM
  saveVar $xbot_CheckCLV
  saveVar $xbot_CLVDetail
  saveVar $xbot_CLVCorp
  saveVar $xbot_CheckOnline
  saveVar $xbot_Broadcast
  
  setVar $xbot_saved 1
  saveVar $xbot_saved
end

# Terminal Menu Additions
addMenu "TWX_MAIN" "XBot_Main" "XBot Options" "O" "" "XBot" FALSE
addMenu "XBot_Main" "XBot_Inactivity" "Activate Inactivity Mode" "I" :inactivity "" TRUE
addMenu "XBot_Main" "XBot_CIMFreq" "CIM Check Frequency" "F" :Menu_CIMFreq "" FALSE
addMenu "XBot_Main" "XBot_PerformCLV" "Perform CLV checks" "C" :Menu_PerformCLV "" FALSE
addMenu "XBot_Main" "XBot_PerformOnline" "Perform online checks" "O" :Menu_PerformOnline "" FALSE
addMenu "XBot_Main" "XBot_BroadcastSS" "Broadcast on subspace" "B" :Menu_BroadcastSS "" FALSE
addMenu "XBot_Main" "XBot_CLVDetail" "CLV detail level" "D" :Menu_CLVDetail "" FALSE
addMenu "XBot_Main" "XBot_CLVCorp" "Watch corp on CLV" "W" :Menu_CLVCorp "" FALSE
addMenu "XBot_Main" "XBot_Restart" "Restart script" "R" :Menu_Restart "" TRUE
addMenu "XBot_Main" "XBot_ShipSetup" "Download ship setup" "S" :Menu_ShipSetup "" TRUE
addMenu "XBot_Main" "XBot_XPort" "Set Xport mode" "X" :Menu_XPort "" TRUE
addMenu "XBot_Main" "XBot_Macro" "Set Macro" "M" :Menu_SetMacro "" TRUE

gosub :sub_SetMenu
goto :init

:Menu_CIMFreq
getInput $xbot_CheckCIM "Enter CIM check frequency"
saveVar $xbot_CheckCIM
gosub :sub_SetMenu
openMenu "XBot_Main"

:Menu_PerformCLV
if ($xbot_CheckCLV)
  setVar $xbot_CheckCLV 0

else
  setVar $xbot_CheckCLV 1
end
saveVar $xbot_CheckCLV
gosub :sub_SetMenu
openMenu "XBot_Main"

:Menu_PerformOnline
if ($xbot_CheckOnline)
  setVar $xbot_CheckOnline 0
else
  setVar $xbot_CheckOnline 1
end
saveVar $xbot_CheckOnline
gosub :sub_SetMenu
openMenu "XBot_Main"

:Menu_BroadcastSS
if ($xbot_Broadcast)
  setVar $xbot_Broadcast 0
else
  setVar $xbot_Broadcast 1
end
saveVar $xbot_Broadcast
gosub :sub_SetMenu
openMenu "XBot_Main"

:Menu_CLVDetail
if ($xbot_CLVDetail = 0)
  setVar $xbot_CLVDetail 2
elseif ($xbot_CLVDetail = 2)
  setVar $xbot_CLVDetail 1
else
  setVar $xbot_CLVDetail 0
end
saveVar $xbot_CLVDetail
gosub :sub_SetMenu
openMenu "XBot_Main"

:Menu_CLVCorp
getInput $xbot_CLVCorp "Enter watch corp index"
saveVar $xbot_CLVCorp
gosub :sub_SetMenu
openMenu "XBot_Main"

:Menu_Restart
killAllTriggers
load XBotNew.ts
halt

:Menu_ShipSetup
gosub :ShipStats~SaveShipOdds
goto :start

:Menu_XPort
getWord CURRENTLINE $test 1
if ($test = "Choose")
  gosub :PlayerInfo~InfoQuick
  setVar $xportBack $PlayerInfo~Ship
  getInput $xport "Enter the ID of the clear ship (or 0 to abort)"
else
  clientMessage "You need to be at the transport prompt to initiate the xport setup"
end
gosub :sub_SetMenu
goto :start

:Menu_SetMacro
killAllTriggers
setDelayTrigger wait :wait 1
pause
:wait
echo "**" ANSI_15 "Select macro key: "
getConsoleInput $macroKey SINGLEKEY
getCharCode $macroKey $code
getInput $macro "Enter macro"
replaceText $macro #42 "*"
setVar $macros[$code] $macro

goto :start

:sub_SetMenu
  if ($xbot_CheckCLV)
    setMenuValue "XBot_PerformCLV" "ON"
  else
    setMenuValue "XBot_PerformCLV" "OFF"
  end
  
  if ($xbot_CheckOnline)
    setMenuValue "XBot_PerformOnline" "ON"
  else
    setMenuValue "XBot_PerformOnline" "OFF"
  end
  
  if ($xbot_Broadcast)
    setMenuValue "XBot_BroadcastSS" "ON"
  else
    setMenuValue "XBot_BroadcastSS" "OFF"
  end
  
  if ($xbot_CLVDetail = 0)
    setMenuValue "XBot_CLVDetail" "LOW"
  elseif ($xbot_CLVDetail = 2)
    setMenuValue "XBot_CLVDetail" "MEDIUM"
  else
    setMenuValue "XBot_CLVDetail" "HIGH"
  end
  
  setMenuValue "XBot_CIMFreq" $XBot_CheckCIM
  setMenuValue "XBot_CLVCorp" $XBot_CLVCorp
  setMenuValue "XBot_XPort" $xport
  
  return




# Initialisation
:init
setVar $buffer ""
setVar $inCommand 0
if (CONNECTED)
  goto :start
else
  setTextTrigger start :start "Trade Wars 2002 Win32 module now loading."
  pause
end

:start
logging on
gosub :sub_SetGlobals
pause

# Process outgoing buffer
:textOut

if ($inactivityOn)
  gosub :sub_SetGlobals
  logging on
else
  killTrigger inactivity
  setDelayTrigger inactivity :inactivity 240000
  setTextOutTrigger textOut :textOut
end

getOutText $outText
getLength $outText $len

if ($outText = #212)
  # reset command
  setVar $burst ""
  setVar $buffer ""
  setVar $inCommand 0
  setVar $xport 0
  echo ANSI_12 & "*XBot: " & ANSI_15 & "Buffer operation terminated: System reset*"
  goto :start
end
  
if ($buffer = "") and ($len = 1) and ($xport = 0)
  # speed hack - if its not a macro or special command, just send it straight away
  getCharCode $outText $code
  
  if ($macros[$code] = "0") and ($code < 128)
    processOut $outText
    goto :textOutDone
  end
end

# replace it with macros as we add it to the buffer
setVar $i 1
while ($i <= $len)
  cutText $outText $char $i 1
  getCharCode $char $code
  
  if ($outText = ".") and ($xport > 0)
    setVar $buffer $buffer & "x " & $xportBack & "* "
  elseif ($macros[$code] <> "0")
    setVar $buffer $buffer & $macros[$code]
  else
    setVar $buffer $buffer & $char
  end
  
  add $i 1
end

getLength $buffer $len

if ($inCommand)
  # we're still running a command, don't process whats in the buffer yet
  goto :textOutDone
end

if ($xport > 0) and ($outText <> ".")
  goto :textOutDone
elseif ($xport > 0)
  send $xport "* q"
end

# process whatever is in the buffer
setVar $burst ""
:processBuffer
getLength $buffer $len

if ($len > 0)
  cutText $buffer $char 1 1
  getCharCode $char $code
  
  if ($code < 128)
    # add to burst
    setVar $burst $burst & $char
  else
    # send/clear burst and process special code
    processOut $burst
    setVar $burst ""
    
    setVar $inCommand 1
    setVar $XBotCmd~Code $code
    gosub :XBotCmd~ProcessCmd
    setVar $inCommand 0
  end
  
  if ($len = 1)
    setVar $buffer ""
  else
    cutText $buffer $buffer 2 $len
  end
  
  goto :processBuffer
end

if ($burst <> "")
  processOut $burst
  setVar $burst ""
end

:textOutDone
pause


# Activate inactivity mode
:inactivity
if ($activeScripts > 0)
  # don't activate - we have other scripts running.
  goto :start
end
killAllTriggers
logging off
setVar $inactivityOn 1
setTextOutTrigger textOut :textOut
setTextTrigger page :page "XideXideXide"
setEventTrigger scriptload :scriptload "Script loaded"
setEventTrigger scriptstop :scriptstop "Script stopped"
setTextLineTrigger saveChatRadio :saveChatRadio "R "
goto :inactivityLoop
pause

# Do page
:page
sound alarm2.wav
setTextTrigger page :page "XideXideXide"
pause

:inactivityLoop
cutText CURRENTLINE $test 1 12
#if ($test <> "Command [TL=") and ($test <> "Citadel comm")
  setVar $doCLV 0
#else
#  setVar $doCLV 1
#end

setDelayTrigger checkFailure :checkFailure (((SECTORS / 1000) * 40000) + 60000)

if ($xbot_CheckCIM > 0)
  if ($CheckCIM <= 1)
    setVar $CheckCIM~LogFile GAMENAME & ".log"
    setVar $CheckCIM~CIMLogFile GAMENAME & ".CIM"
    setVar $CheckCIM~Broadcast $xbot_Broadcast
    gosub :CheckCIM~CheckCIM
    setVar $CheckCIM $xbot_CheckCIM
  elseif ($CheckCIM > 1)
    subtract $CheckCIM 1
  end
end
if (($xbot_CheckCLV) and ($doCLV))

  send "clvq"
  setVar $CheckCLV~LogFile GAMENAME & ".log"
  setVar $CheckCLV~Broadcast $xbot_Broadcast
  setVar $CheckCLV~Colour 1
  setVar $CheckCLV~Detail $xbot_CLVDetail
  setVar $CheckCLV~FigCorp $xbot_CLVCorp
  gosub :CheckCLV~CheckCLV
end
if ($xbot_CheckOnline)
  setVar $CheckOnline~LogFile GAMENAME & ".log"
  setVar $CheckOnline~Broadcast $xbot_Broadcast
  gosub :CheckOnline~CheckOnline
end

killTrigger checkFailure
setDelayTrigger inactivityLoop :inactivityLoop 30000
pause

:checkFailure
# check failed - disconnect and reconnect
killAllTriggers
disconnect
setDelayTrigger reconnect :reconnect 2000
pause
:reconnect
connect
goto :init


# get player ship info
:getShipInfo
cutText CURRENTLINE $ShipStats~Name 18 999
gosub :ShipStats~GetShipStats
setVar $CheckCLV~CLVPod $ShipName[1]
setVar $XBotCmd~ShipAttack $ShipStats~Attack
setVar $XBotCmd~ShipDefensive $ShipStats~Defensive
setVar $XBotCmd~ShipOffensive $ShipStats~Offensive
setVar $XBotCmd~ShipShield $ShipStats~Shield
setVar $Capture~ShipOffensive $XBotCmd~ShipOffensive
setTextLineTrigger getShipInfo :getShipInfo "Ship Info      :"
pause


# get player corp number
:getCorp
getWord CURRENTLINE $corp 3
stripText $corp ","
setVar $XBotCmd~Corp $corp
setTextLineTrigger getCorp :getCorp "Corp           #"
pause


# handle fig hit
:figHit
getWord CURRENTLINE $check 1
if ($check = "Report") or ($check = "Deployed")
  if ($inactivityOn)
    getDate $date
    getTime $time
    if ($check = "Deployed")
      cutText CURRENTLINE $line 33 999
      write GAMENAME & ".log" $date & " " & $time & " - " & "FIG:" & $line
    else
      cutText CURRENTLINE $line 15 999
      write GAMENAME & ".log" $date & " " & $time & " - " & "FIG:" & $line
    end
    
    if ($check = "Report")
      getWord CURRENTLINE $sect 3
    else
      getWord CURRENTLINE $sect 5
    end
    
    stripText $sect ":"
    if ($Cache~AOSInit)
      setVar $NearFig~Sector $sect
      gosub :NearFig~NearAOS
      setVar $Cache~AOS $NearFig~NearAOS
      gosub :Cache~GetAOSName
      getDistance $dist $sect $NearFig~NearAOS
      send "'Nearest AOS to " & $sect & ": " & $NearFig~NearAOS & ", " & $Cache~AOSName & ", " & $dist & " hops*"
    end
    
    sound click.wav
  end
end
killTrigger figHit
setTextLineTrigger figHit :figHit "Report Sector "
pause


# handle script load
:scriptLoad
add $activeScripts 1
setEventTrigger scriptload :scriptload "Script loaded"
pause


# handle script stop
:scriptStop
subtract $activeScripts 1
setEventTrigger scriptstop :scriptstop "Script stopped"
pause


# get player sector
:getSector
getWord CURRENTLINE $check 3
if ($check = "(?=Help)?")
  getText CURRENTLINE $curSector "]:[" "] (?="
end
setVar $XBotCmd~CurSector $curSector
setTextTrigger getSector :getSector "Command [TL="
pause


# Handle diconnect
:disconnected
killAllTriggers
setVar $CheckCIM~Init 0
setVar $CheckCLV~Init 0
setVar $CheckOnline~Init 0
goto :init


# save radio chat
:saveChatRadio
getWord CURRENTLINE $test 1
if ($test = "R")
  write GAMENAME & ".log" #3 & "3" & CURRENTLINE  
end
setTextLineTrigger saveChatRadio :saveChatRadio "R "
pause

:sub_SetGlobals
  killAllTriggers
  setVar $inactivityOn 0
  
  # Set global triggers
  setTextOutTrigger textOut :textOut
  setDelayTrigger inactivity :inactivity 240000
  setTextLineTrigger getShipInfo :getShipInfo "Ship Info      :"
  setTextLineTrigger getCorp :getCorp "Corp           #"
  setEventTrigger disconnected :disconnected "CONNECTION LOST"
  setTextLineTrigger figHit :figHit "Report Sector "
  setEventTrigger scriptload :scriptload "Script loaded"
  setEventTrigger scriptstop :scriptstop "Script stopped"
  setTextLineTrigger saveChatRadio :saveChatRadio "R "
  setTextTrigger getSector :getSector "Command [TL="
  return

# includes:
include "XBotCmd"
include "include\capture"
include "include\checkCIM"
include "include\checkCLV"
include "include\checkOnline"
include "include\shipStats"
include "include\playerInfo"