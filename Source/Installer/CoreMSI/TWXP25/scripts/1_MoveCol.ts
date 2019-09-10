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

# TWX Script Pack 1: Move colonist script
# Author           : Xide
# Description      : Move colonists from one planet to another.  Can work
#                    with planets which are multiple hops apart.  Assumes
#                    the ship being used to transport has a planet scanner,
#                    or that there are multiple planets in each sector.
# Trigger Point    : Source planet surface
# Warnings         : If transporting between multiple hops, be sure the
#                    warp lane between the sectors is clear and no additional
#                    prompts will be given.  This script will express warp.
# Other            : Moderately complex script as it does warp calculations
#                    to check the distance between planets.

# check if we can run it from here
cutText CURRENTLINE $location 1 14

if ($location <> "Planet command")
  clientMessage "This script must be run from the surface of a planet"
  halt
end

logging off

# show script banner
echo "**" ANSI_3 "     --" ANSI_11 "===| " ANSI_15 "Move Colonist v2.00" ANSI_11 " |===" ANSI_3 "--**"
echo ANSI_7 "No registration is required to use this script,*it is completely open source and can be opened*in notepad."
echo "**" ANSI_15 "For your own safety, please read the warnings*written at the top of the script before*using it!*"

:GetMoveFrom
echo "*" ANSI_15 "Select category to move FROM:" "**"
echo ANSI_11 "1 " ANSI_3 " - Fuel Ore*"
echo ANSI_11 "2 " ANSI_3 " - Organics*"
echo ANSI_11 "3 " ANSI_3 " - Equipment*"
getConsoleInput $MoveFrom SINGLEKEY

if ($MoveFrom <> 1) and ($MoveFrom <> 2) and ($MoveFrom <> 3)
  goto :GetMoveFrom
end

:GetMoveTo
echo "*" ANSI_15 "Select category to move TO:" "**"
echo ANSI_11 "1 " ANSI_3 " - Fuel Ore*"
echo ANSI_11 "2 " ANSI_3 " - Organics*"
echo ANSI_11 "3 " ANSI_3 " - Equipment*"
getConsoleInput $MoveTo SINGLEKEY

if ($MoveTo <> 1) and ($MoveTo <> 2) and ($MoveTo <> 3)
  goto :GetMoveTo


end

getinput $planet2 "Enter planet ID to move to" 0


getinput $sector2 "Enter sector of planet to move to (S = same sector)" 0
getinput $quantity "Enter quantity to move" 0

# Set trigger to stop script if disconnected
setEventTrigger 0 :End "Connection lost"

# get the planet number for the planet we're on
send "d"
setTextLineTrigger 1 :getPlanet "Planet #"
pause
:getPlanet
getWord CURRENTLINE $planet1 2
stripText $planet1 "#"

# get the sector we're in
send "qd"
setTextLineTrigger 1 :getSector "Sector  : "
pause
:getSector
getWord CURRENTLINE $sector1 3

# get the distance between sectors
if ($sector1 = $sector2) or ($sector2 = "S") or ($sector2 = "s")
  setVar $distance 0
else
  send "cf" "*" $sector2 "*q"
  setTextLineTrigger 1 :getDistance "The shortest path"
  pause
  :getDistance
  getWord CURRENTLINE $distance 4
  stripText $distance "("
end
send "l" $planet1 "*"

# get the total free holds in this ship
setTextLineTrigger 1 :getHolds "You have "
pause
:getHolds
getWord CURRENTLINE $holds 3

# don't run script without free cargo holds
if ($holds = 0)
  clientMessage "No free cargo holds!"
  halt
end

# calculate exactly how many trips we're making
# and how much we're carrying on our last trip
setVar $trips ($quantity / $holds)
setVar $x ($trips * $holds)
setVar $lastTrip ($quantity - $x)
if ($lastTrip = 0)
  setVar $lastTrip $holds
else
  add $trips 1
end

setTextTrigger 1 :sub_Done "There aren't that many on the planet"
setVar $twarp 0

# away we go!
:sub_Move
  send "snt" $MoveFrom
 
  # if its the last trip, we may need to carry an amount not
  # equal to the ship's max free cargo holds in order to make
  # the total quantity moved equal to the desired quantity moved
  if ($trips = 1)
    send $lastTrip "*q"
  else
    send "*q"
  end
 
  if ($distance > 0)
    send $sector2
    if (SECTORS > 5000) or ($sector2 < 600)
      send "*"
    end
  end
 
  if ($distance > 1)
    if ($twarp = 0)
      # we don't know if this ship can twarp yet
      # so we find out now
      setTextTrigger 2 :setTwarp "Do you want to engage"
      setTextTrigger 3 :setNoTwarp "The shortest path"
      pause
      :setTwarp
      killTrigger 3
      setVar $twarp "Y"
      goto :gotTwarp
      :setNoTwarp
      killTrigger 2
      setVar $twarp "N"
      :gotTwarp
    end

    if ($twarp = "Y")
      # twarp capable ship - add an extra "n"
      send "ne"
    else
      send "e"
    end
  end
 
  send "l" $planet2 "*snl" $MoveTo "*q"
 
  if ($distance > 0)
    send $sector1
    if (SECTORS > 5000) or ($sector1 < 600)
      send "*"
    end
  end
 
  if ($distance > 1)
    if ($twarp = "Y")
      send "ne"
    else
      send "e"
    end
  end
 
  send "l" $planet1 "*"
  mergeText "Planet #" $planet2 $waitText
  waitFor $waitText
  subtract $trips 1

  if ($trips > 0)
    goto :sub_Move
  end

:sub_Done
  # transferred it all
  halt

:End
