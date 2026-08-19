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

# TWX Script Pack 1: Basic trade script
# Author           : Xide
# Description      : Navigates the game through the use of a density scanner,
#                    running holo scans on sectors with unusual density.
#                    Docks at ports while it does this.  Useless in low turn
#                    games.
# Trigger Point    : Sector command prompt
# Warnings         : Don't run in low turn games.  Script has no defences
#                    so is easily destroyed by other players.  Easily
#                    obstructed by non port sectors with 100 density.
# Other            : A modified version of 1_Scout.  Very basic porting method
#                    of just sending the port command followed by lots of
#                    enters.

# check if we can run it from here
cutText CURRENTLINE $location 1 7

if ($location <> "Command")
        clientMessage "This script must be run from the game command menu"
        halt
end

logging off

# show script banner
echo "**" ANSI_3 "     --" ANSI_11 "===| " ANSI_15 "Basic World Trade v2.00" ANSI_11 " |===" ANSI_3 "--**"
echo ANSI_7 "No registration is required to use this script,*it is completely open source and can be opened*in notepad."
echo "**" ANSI_15 "For your own safety, please read the warnings*written at the top of the script before*using it!*"

# lets find out what sort of scanner this ship has
send "i"
setTextLineTrigger 1 :getScanner "LongRange Scan :"
waitFor "Credits      "
clientMessage "No long range scanner detected!"
halt
:getScanner
getWord CURRENTLINE $scanType 4

# away we go!
:sub_Scan
  send "s"

  if ($scanType = "Holographic")
    send "d"
  end
  
  waitFor "Relative Density Scan"

  # clear all the old warp info
  setVar $i 1
  :clearNext
  setVar $warp[$i] 0
  setVar $warpCount[$i] 0
  setVar $density[$i] "-1"
  setVar $weight[$i] 9999
  setVar $anom[$i] "No"
  setVar $explored[$i] 1
  if ($i = 6)
    goto :warpsCleared
  else
    add $i 1
    goto :clearNext
  end
  :warpsCleared

  # now we retrieve new warp info
  setVar $i 1
  setTextLineTrigger 1 :getWarp "Sector "
  setTextTrigger 2 :gotWarps "Command [TL="
  pause
  :getWarp
  setVar $line CURRENTLINE
  stripText $line "("
  getWord $line $warp 2
  getWord $line $density 4
  getWord $line $warpCount 7
  getWord $line $anom 13
  getLength $warp $length
  cutText $warp $explored $length 1
  if ($explored = ")")
    setVar $explored 0
  else
    setVar $explored 1
  end
  stripText $warp ")"
  stripText $density ","
  setVar $warp[$i] $warp
  setVar $density[$i] $density
  setVar $warpCount[$i] $warpCount
  setVar $anom[$i] $anom
  setVar $explored[$i] $explored
  add $i 1
  setTextLineTrigger 1 :getWarp "Sector "
  pause
  :gotWarps
  killTrigger 1
  killTrigger 2

  # ok - now that we've got all our warp info, we need
  # to use a weighting system with the sectors to determine
  # which would be the best to warp into

  setVar $i 1
  setVar $bestWarp 1
  setVar $holo 0
  :weightWarp
  if ($warp[$i] > 0)
    setVar $weight[$i] 0
    if ($density[$i] <> 100) and ($density[$i] <> 0)
      # very bad! don't warp into non 0 or 100 sector!
      add $weight[$i] 100
      add $weight[$i] $density[$i]
      setVar $holo 1
    end
    if ($anom[$i] <> "No")
      # avoid sectors with anomoly as much as possible
      add $weight[$i] 100
    end
    if ($explored[$i] = 1)
      # try and avoid explored sectors
      add $weight[$i] 20
    end
    if ($warp[$i] = $lastWarp)
      # avoid going backwards
      add $weight[$i] 5
    end

    # high amount of warps = higher chance of us going there!
    setVar $x 6
    subtract $x $warpCount[$i]

    # make sure we have some random in there to stop it from
    # getting stuck
    getRnd $rand 1 10
    add $weight[$i] $rand

    # find the best warp
    if ($weight[$bestWarp] > $weight[$i])
      setVar $bestWarp $i
    end
    add $i 1
    goto :weightWarp
  end

  # now we know our best warp, lets see if its a safe one
  if ($weight[$bestWarp] > 100)
    # looks unsafe, better to stop and wait for the user.
    clientMessage "Script walled in!  Halted."
    halt
  end

  # see if we need to holo scan first
  if ($scanType = "Holographic") and ($holo = 1)
    send "sh"
    waitFor "Command [TL="
  end

  # lets move
  send $warp[$bestWarp] "*"
  setVar $lastWarp $thisWarp
  setVar $thisWarp $warp[$bestWarp]
  waitFor "Sector  : "
  waitFor "Command [TL="
  getSector $warp[$bestWarp] $s

  # dock at a port if theres one here
  if ($s.port.class <> 0) and ($s.port.class <> 9)
    send "pt******"
  end

  goto :sub_Scan


