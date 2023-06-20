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

# TWX Script Pack 1: Sell-Steal-Move script
# Author           : Xide
# Description      : SSM script for evils.  The first steal is from the
#                    sector the player is in.  Basically the script 
#                    just jumps between the two ports, selling then stealing
#                    equipment.  Your holds must be empty when you run this
#                    script.
# Trigger Point    : Sector containing an xxB port, with an xxB port adjacent
# Warnings         : Make sure you havn't been busted at either port.  Ensure
#                    The last port stolen from is NOT the sector you are in.
#                    Also make sure you set your steal factor correctly.
#                    Failure to follow any of these precautions will bust
#                    you.  Also make sure both sectors are free from
#                    obstruction and that your not SSMing through a one
#                    way warp.

reqRecording

# check location
cutText CURRENTLINE $location 1 12
if ($location <> "Command [TL=")
        clientMessage "This script must be run from the command menu"
        halt
end

# show script banner
echo "**" ANSI_3 "     --" ANSI_11 "===| " ANSI_15 "Sell-Steal-Move v2.00" ANSI_11 " |===" ANSI_3 "--**"
echo ANSI_7 "No registration is required to use this script,*it is completely open source and can be opened*in notepad."
echo "**" ANSI_15 "For your own safety, please read the warnings*written at the top of the script before*using it!*"

# get steal percentage
echo ANSI_15 "*E" ANSI_12 "nter steal factor (" ANSI_15 "30" ANSI_12 " = " ANSI_15 "100%" ANSI_12 ") "
getConsoleInput $stealPerc

# get other sector
echo ANSI_15 "*E" ANSI_12 "nter other sector"
getConsoleInput $sector[2]

logging off

send "i"

# get experience and cargo contents
setTextLineTrigger 1 :getExp "Rank and Exp"
pause
:getExp
getWord CURRENTLINE $exp 5
stripText $exp ","

setTextLineTrigger 1 :getSector "Current Sector : "
pause
:getSector
getWord CURRENTLINE $sector[1] 4

setTextLineTrigger 1 :getCargo "Total Holds  "
pause
:getCargo
getWord CURRENTLINE $holds 4
getText CURRENTLINE $cargo " - " "="

if ($cargo <> "Empty")
  waitFor "Command [TL="
  clientMessage "Your holds must be empty to run this script"
  halt
end

setVar $curSector 1
setVar $buyProd 0

:sub_SSM
  # calculate how much we're stealing
  setVar $steal $exp
  divide $steal $stealPerc
  subtract $steal 1
  
  if ($steal > $holds)
    setVar $steal $holds
  end

  send "pr*st3" $steal "*"

  waitOn "<Thievery>"
  setTextLineTrigger getEquip :getEquip "Equipment  Buying"
  setTextLineTrigger busted :busted "Busted!"
  setTextLineTrigger fail :fail "There aren't that many holds"
  setTextLineTrigger success :success "Success!"
  pause
  
  :getEquip
  getWord CURRENTLINE $portEquip 4
  pause
  
  :busted
  halt
  
  :fail
  # upgrade the port and continue
  setVar $upgrade $steal
  subtract $upgrade $portEquip
  divide $upgrade 10
  add $upgrade 1
  send "o3" $upgrade "*q"
  
  setTextLineTrigger getExpUpgrade :getExpUpgrade "For upgrading this StarPort, you receive"
  setTextLineTrigger noExpUpgrade :noExpUpgrade "StarPort upgraded!"
  pause
  :getExpUpgrade
  getWord CURRENTLINE $getExp 7
  add $exp $getExp
  :noExpUpgrade
  
  killAllTriggers
  goto :sub_SSM

  :success
  # get experience gained
  setTextLineTrigger getExpSteal :getExpSteal "and you receive "
  setTextTrigger noExpSteal :noExpSteal "Command [TL="
  pause
  :getExpSteal
  getWord CURRENTLINE $getExp 4
  add $exp $getExp
  pause
  :noExpSteal
  killTrigger getExpSteal
  
  # move to the other sector, sell this stuff
  if ($curSector = 1)
    setVar $curSector 2
  else
    setVar $curSector 1
  end
  
  if ($curSector < 600) or (SECTORS > 5000)
    send $sector[$curSector] "*pt"
  else
    send $sector[$curSector] "pt"
  end
  
  send "**0*0*"
  
  killAllTriggers
  goto :sub_SSM
