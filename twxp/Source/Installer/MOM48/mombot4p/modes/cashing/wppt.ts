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

gosub :BOT~loadVars

setVar $BOT~help[1]   $BOT~tab&"- wppt {holoscan} {evade}" 
setVar $BOT~help[2]   $BOT~tab&"  World PPT - Originally written by Xide                          " 
setVar $BOT~help[3]   $BOT~tab&"                                                                  " 
setVar $BOT~help[4]   $BOT~tab&"   - {holoscan}    = 0 - doesn't holoscan                         " 
setVar $BOT~help[5]   $BOT~tab&"                     1 - holoscans on odd densities               "
setVar $BOT~help[6]   $BOT~tab&"                     2 - always holoscans (default)               " 
setVar $BOT~help[7]   $BOT~tab&"                                                                  " 
setVar $BOT~help[8]   $BOT~tab&"   - {evade}       = 0 - normal (default)                         " 
setVar $BOT~help[9]   $BOT~tab&"                     1 - paranoid                                 " 
setVar $BOT~help[10]  $BOT~tab&"                     2 - avoids nothing                           " 
setVar $BOT~help[11]  $BOT~tab&"                                                                  " 
setVar $BOT~help[12]  $BOT~tab&"   - {nohaggle}    = doesn't haggle                               " 

gosub :BOT~helpfile

setVar $BOT~script_title "World PPT"
gosub :BOT~banner


if (($bot~parm1 = 0) OR ($bot~parm1 = 1) OR ($bot~parm1 = 2))
  setVar $Move~ScanHolo $bot~parm1
  setVar $PortCheck~ScanHolo $bot~parm1
else
  setVar $Move~ScanHolo 2
  setVar $PortCheck~ScanHolo 2
end


if (($bot~parm1 = 0) OR ($bot~parm1 = 1) OR ($bot~parm1 = 2))
  setVar $Move~Evasion $bot~parm2
else
  setVar $Move~Evasion 0
end

    setTextLineTrigger  prompt      :allPrompts     #145 & #8
    send #145&"/"
    pause
    :allPrompts
        getWord CURRENTLINE $CURRENT_PROMPT 1
        stripText $CURRENT_PROMPT #145
        stripText $CURRENT_PROMPT #8
killalltriggers

# check location

if ($CURRENT_PROMPT <> "Command")
        clientMessage "This script must be run from the command menu"
        halt
end

reqRecording
logging off

getWordPos $bot~user_command_line $pos "nohaggle"
if ($pos > 0)
	setVar $Haggle~HaggleFactor 0
	setvar $bot~nohaggle true
else
	setvar $bot~nohaggle false
	gosub :player~isEpHaggle
	if ($player~isEphaggle)
	  setVar $Haggle~HaggleFactor 7
	else
	  setVar $Haggle~HaggleFactor 0
	end
end


  
  setVar $Move~Attack 2
  setVar $Move~PortPriority 1
  setVar $Move~ExtraSend "f 1 " & #42 & " c d "
  replaceText $Move~ExtraSend #42 "*"
    
  setVar $Move~Saved 1

  setVar $PPT~DropFigs 1
    
  setVar $PPT~Saved 1


  setVar $PortCheck~Danger 1
  setVar $PortCheck~FuelOrganics 1
  setVar $PortCheck~PortType 1
  
  setVar $PortCheck~Saved 1


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
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\player\isephaggle\player"
include "source\bot_includes\player\quikstats\player"
include "source\module_includes\wppt\worldTrade"

