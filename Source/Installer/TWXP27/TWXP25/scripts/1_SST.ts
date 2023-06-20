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

# TWX Script Pack 1: Sell-Steal-Transport script
# Author           : Xide
# Description      : SST money making script for evils - a more advanced
#                    version of SSM which uses less turns by transporting
#                    between ships.  The first sector stolen from is the
#                    OPPOSITE to the one the player is in.
# Trigger Point    : Sector prompt containing xxB port with second ship
#                    aligned with another xxB port.
# Warnings         : Make sure you havn't been busted at either port.  Ensure
#                    The last port stolen from is NOT the sector
#                    you will be SSTing to.  Also make sure the holds you
#                    are stealing are not greater than the ideal amount.
#                    Failure to follow any of these precautions will bust
#                    you.  Also make sure both sectors are free from
#                    obstruction and that both ships are withing transport
#                    range of eachother.
# Other            : Quite a simple script, simply runs until the player
#                    is busted.  Unless the game's steal ratio has been
#                    changed, the ideal steal amount should be 1 hold
#                    for 30 experience.

# check if we can run it from here
cutText CURRENTLINE $location 1 7

if ($location <> "Command")
  clientMessage "This script must be run from the game command menu"
  halt
end

logging off

# show script banner
echo "**" ANSI_3 "     --" ANSI_11 "===| " ANSI_15 "Sell-Steal-Transport v2.00" ANSI_11 " |===" ANSI_3 "--**"
echo ANSI_7 "No registration is required to use this script,*it is completely open source and can be opened*in notepad."
echo "**" ANSI_15 "For your own safety, please read the warnings*written at the top of the script before*using it!*"

# input parameters
getInput $shipNumber1 "Enter this ship's ID" 0
getInput $shipNumber2 "Enter other ship's ID" 0
getInput $holds1 "Enter max holds to steal for this ship" 0
getInput $holds2 "Enter max holds to steal for other ship" 0

# get the current sector and the type of port in it
send "d"
setTextLineTrigger 1 :getSector "Sector  : "
pause

:getSector
getWord CURRENTLINE $sectorNumber1 3
getSector $sectorNumber1 $sector1

# now get the details of the second sector
send "x" $shipNumber2 "*qd"
setTextLineTrigger 1 :getSector2 "Sector  : "
pause
:getSector2
getWord CURRENTLINE $sectorNumber2 3
waitfor "Command [TL="
getSector $sectorNumber2 $sector2

# now we know all the details.  Lets go!

:sub_SSM
  # sell what we have in $sector2
  send "pt**"

  # if this port sells ore or organics, we need to cater for it
  if ($sector2.port.class = 2) or ($sector2.port.class = 3)
    send "0*"
  end
  if ($sector2.port.class = 4)
    send "0*0*"
  end

  # now steal it back!
  send "pr*s3" $holds2 "*"

  # now.. wait to see if we got busted.  If we did, we'd better stop
  setTextTrigger 1 :continue "Success!"
  setTextTrigger 2 :stop "Busted!"
  pause

  :stop
  halt

  :continue
  killTrigger 2

  # tele back to $shipNumber1 ...
  waitfor "Command [TL="
  send "x" $shipNumber1 "*qpt**"

  # if this port sells ore or organics, we need to cater for it
  if ($sector1.port.class = 2) or ($sector1.port.class = 3)
    send "0*"
  end
  if ($sector1.port.class = 4)
    send "0*0*"
  end

  # now steal it back!
  send "pr*s3" $holds1 "*"

  # now.. wait to see if we got busted.  If we did, we'd better stop
  setTextTrigger 1 :continue2 "Success!"
  setTextTrigger 2 :stop2 "Busted!"
  pause

  :stop2
  halt

  :continue2
  killTrigger 2

  # repeat
  waitfor "Command [TL="
  send "x" $shipNumber2 "*q"
  goto :sub_SSM
