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

# TWX Script Pack 1: Fast port pair trading script
# Author           : Xide
# Description      : A faster but much less efficient version of 1_Port.twx.
#                    Simply runs between each port sector sending the command
#                    to port followed by a bunch of enters.  Very fast, but
#                    doesn't haggle and doesn't trade the best product.
# Trigger Point    : Sector command prompt
# Warnings         : Ports must have enough products on board to make
#                    this script worthwhile.  Ideally trading should stop
#                    once a port hits below 20%.  This script assumes
#                    there are no one-way warps between ports and that
#                    they are adjacent to eachother.  Be
#                    sure there are no obstructions in either sector.
# Other            : This is an excellent script to play around with and
#                    use to learn the language.  Its simple and doesn't
#                    twist all over the place like 1_Port.twx.
                    

# check if we can run it from here
cutText CURRENTLINE $location 1 12

if ($location <> "Command [TL=")
  clientMessage "This script must be run from the command prompt"
  halt
end

logging off

# show script banner
echo "**" ANSI_3 "     --" ANSI_11 "===| " ANSI_15 "Fast Port Pair Trading v2.00" ANSI_11 " |===" ANSI_3 "--**"
echo ANSI_7 "No registration is required to use this script,*it is completely open source and can be opened*in notepad."
echo "**" ANSI_15 "For your own safety, please read the warnings*written at the top of the script before*using it!*"

# get user input
getinput $otherSector "Enter sector to trade to" 0
getinput $timesLeft "Enter times to execute script" 0

multiply $timesLeft 2

# get the current sector
send "d"
setTextLineTrigger 1 :getSectorNumber "Sector  : "
pause

:getSectorNumber
getWord CURRENTLINE $thisSector 3

:sub_Trade
  send "pt******"

  subtract $timesLeft 1
  if ($timesLeft <= 0)
          halt
  end

  send $otherSector
  setVar $oldOtherSector $otherSector
  setVar $otherSector $thisSector
  setVar $thisSector $oldOtherSector

  send "*"
  waitfor "<Move>"
  goto :sub_Trade
