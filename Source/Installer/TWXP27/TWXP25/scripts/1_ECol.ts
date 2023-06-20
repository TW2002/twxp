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

# TWX Script Pack 1: Express colonisation script
# Author           : Xide
# Description      : Express warps between terra and the planet, grabbing
#                    and dropping off colonists.  Heavy on turns, so its
#                    only really good for unlimited turn games.  Also very
#                    unsafe.  I wouldn't do it with aggressive players
#                    online.
# Trigger Point    : Target planet surface
# Warnings         : Express route to and from terra must be clear of all
#                    obstruction.  Assumes the sector with the target
#                    planet has either multiple planets or that the ship
#                    being used has a planet scanner (no quick landing).
#                    Always works one cycle ahead of its position, so
#                    make sure your parameters are right or you'll go
#                    treking around the game.  Doesn't keep track of your
#                    turns so keep an eye on them.
# Other            : Good script to play around with if you want to learn
#                    something.  Its simple and straight forward.

# check if we can run it from here
cutText CURRENTLINE $location 1 14

if ($location <> "Planet command")
        clientMessage "This script must be run from the surface of a planet"
        halt
end

logging off

# show script banner
echo "**" ANSI_3 "     --" ANSI_11 "===| " ANSI_15 "Express-Colonisation v2.00" ANSI_11 " |===" ANSI_3 "--**"
echo ANSI_7 "No registration is required to use this script,*it is completely open source and can be opened*in notepad."
echo "**" ANSI_15 "For your own safety, please read the warnings*written at the top of the script before*using it!*"

:GetDropCategory
echo "*" ANSI_15 "Select drop category:" "**"
echo ANSI_11 "1 " ANSI_3 " - Fuel Ore*"
echo ANSI_11 "2 " ANSI_3 " - Organics*"
echo ANSI_11 "3 " ANSI_3 " - Equipment*" ANSI_7
getConsoleInput $DropCat SINGLEKEY


if ($DropCat <> 1) and ($DropCat <> 2) and ($DropCat <> 3)
  goto :GetDropCategory
end

# Set trigger to stop script if disconnected
setEventTrigger 0 :End "Connection lost"

# get the planet number
send "d"
setTextLineTrigger 1 :GetPlanetNumber "Planet #"
pause
:GetPlanetNumber
setVar $line CURRENTLINE
stripText $line "#"
getWord $line $planetNumber 2
getWord $line $sectorNumber 5
stripText $sectorNumber ":"
waitfor "Planet command"

# see if we have a planet scanner
send "qil"
send $planetNumber
send "*"
setTextLineTrigger 1 :HasScanner "Planet Scanner"
setTextLineTrigger 2 :HasTwarp "TransWarp Power"
setTextLineTrigger 3 :gotStuff "Credits   "
pause

:HasTwarp
setVar $twarp 1
pause
:HasScanner
setVar $scanner 1
pause
:gotStuff
killTrigger 1
killTrigger 2

# away we go!

:sub_Colonise
  if ($twarp = 1)
    send "q1*nel"
  else
    send "q1*el"
  end

  if ($scanner = 1)
    send "1*"
  end

  send "**" $sectorNumber

  if (SECTORS > 5000) or ($sectorNumber < 600)
    # damn autocompleting sector numbers! I HATE EM!
    send "*"
  end

  if ($twarp = 1)
    send "nel" $planetNumber "*snl" $DropCat "*"
  else
    send "el" $planetNumber "*snl" $DropCat "*"
  end

  setTextTrigger 2 :sub_Colonise "<Land on Terra>"
  pause
  
  
:End