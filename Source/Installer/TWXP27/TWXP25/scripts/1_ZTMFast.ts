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

# TWX Script Pack 1: Fast Zero Turn Mapping script
# Author           : Xide
# Description      : This version of the TWX Proxy ZTM script is much faster than
#                    1_ZTM, although not as accurate.  I find to get a good picture 
#                    of the game and an accurate bubble list, you should do at least 
#                    3 passes of Source -> destination/incremental
#                    mappings then export a bubble list and map at least 3 times to
#                    different sources using the exported list.
#
#                    For example:
#
#                    Pass 1:  Reverse sector mapping
#                    Pass 2:  Incremental mapping (using an incremental of 1)
#                    Pass 3:  Incremental mapping (using an incremental of 2)
#                    Pass 4:  Exported bubble list to sector 1 mapping
#                    Pass 5:  Another exported bubble list to sector 50 mapping
#                    Pass 6:  Another exported bubble list to sector 51 mapping
#
#                    Doing the above would get you an accurate picture of the game.
#                    Depending upon connection/server speed this could easily be done
#                    in under 3 hours in a 5k sector game.
# Trigger Point    : CIM Prompt
# Warnings         : Make sure your avoids are cleared when you begin
#                    this script.
# Other            : This script makes use of Script Windows.  These items
#                    are not supported in TWX Proxy 2.00, but the utilisation
#                    remains for future versions.


reqRecording

# check if we can run it from here
cutText CURRENTLINE $location 1 2

if ($location <> ": ")
  clientMessage "This script must be run from the CIM prompt"
  halt
end

logging off

# show script banner
echo "**" ANSI_3 "     --" ANSI_11 "===| " ANSI_15 "Fast Zero Turn Mapping v2.00" ANSI_11 " |===" ANSI_3 "--**"
echo ANSI_7 "No registration is required to use this script,*it is completely open source and can be opened*in notepad."
echo "**" ANSI_15 "For your own safety, please read the warnings*written at the top of the script before*using it!*"

echo "*" ANSI_15 "C" ANSI_12 "hoose ZTM type:" "**"
echo ANSI_15 "1 " ANSI_12 " - Source to every sector*"
echo ANSI_15 "2 " ANSI_12 " - Every sector to reverse sector*"
echo ANSI_15 "3 " ANSI_12 " - Every sector to incremental*"
echo ANSI_15 "4 " ANSI_12 " - Sector list to source**"
:getInput
getConsoleInput $type SINGLEKEY
if ($type <> 1) and ($type <> 2) and ($type <> 3) and ($type <> 4)
  goto :getInput
end

echo "*" ANSI_15 "E" ANSI_12 "nter start sector/index "
getConsoleInput $start

echo $start

if ($type = 1) or ($type = 4)
  echo "*" ANSI_15 "E" ANSI_12 "nter source "
  getConsoleInput $source
end

if ($type = 3)
  echo "*" ANSI_15 "E" ANSI_12 "nter incremental "
  getConsoleInput $inc
end

if ($type = 4)
  echo "*" ANSI_15 "E" ANSI_12 "nter file " ANSI_7
  getConsoleInput $file
end

setVar $i $start
setVar $a SECTORS
subtract $a $start
setVar $calcsDone 0
add $a 1
window ztm 170 94 "ZTM" ONTOP
setWindowContents ztm "Perc Done:*Est Time:*Speed:*Up to:"

:restart
setVar $burst 5
setVar $update 5

# set a trigger to continue if we get disconnect and get back in..
setDelayTrigger updateWindow :sub_UpdateWindow 60000
setEventTrigger disconnectEvent :sub_Disconnected "Connection lost"

# away we go
:sub_ZTM
  if ($type = 1)
    send "f" $source "*" $i "*f" $i "*" $source "*"
  end
  if ($type = 2)
    send "f" $i "*" $a "*"
  end
  if ($type = 3)
    setVar $a $i
    add $a $inc

    if ($a > SECTORS)
      halt
    end

    send "f" $i "*" $a "*"
  end
  if ($type = 4)
    read $file $line $i
    getWord $line $dest 1
    if ($dest = EOF)
      halt
    end
    send "f" $dest "*" $source "*"
  end


  if ($burst > 0)
    subtract $burst 1
  else
    if ($type = 1)
      setTextTrigger delay1 :delay1 ": "
      pause
      :delay1
    end
    setTextTrigger delay2 :delay2 ": "
    pause
    :delay2
  end

  add $i 1
  add $calcsDone 1
  subtract $a 1

  if ($i <= SECTORS)
    goto :sub_ZTM
  end

  halt


:sub_UpdateWindow
  if ($calcsDone = 0)
    setDelayTrigger updateWindow :sub_UpdateWindow 60000
    pause
  end

  # calculate time remaining        
  if ($type <> 4)
    setVar $percDone $i
    multiply $percDone 100
    divide $percDone SECTORS
    setVar $minsLeft SECTORS
    subtract $minsLeft $i
    divide $minsLeft $calcsDone
    setVar $hoursLeft $minsLeft
    divide $hoursLeft 60
    setVar $s $hoursLeft
    multiply $s 60
    subtract $minsLeft $s
  else
    setVar $hoursLeft "?"
    setVar $minsLeft "?"
  end
        
  setVar $contents "Perc Done: " & $percDone & "%*Est Time: " & $hoursLeft & " hrs " & $minsLeft & " mins*Speed: " & $calcsDone & " cmp*Up to: " & $i
  setWindowContents ztm $contents
  
  setVar $calcsDone 0
  setDelayTrigger updateWindow :sub_UpdateWindow 60000
  pause


:sub_Disconnected
  killAllTriggers
  subtract $i 5
  add $a 5
  setTextTrigger delay4 :delay4 "Command [TL="
  pause
  :delay4
  send "^"
  setTextTrigger delay3 :delay3 ": "
  pause
  :delay3
  goto :restart
