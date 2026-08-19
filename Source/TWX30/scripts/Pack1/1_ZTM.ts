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

# TWX Script Pack 1: Zero Turn Mapping script
# Author           : Xide
# Description      : A HORRIFICALLY slow ZTM script.  Plots courses from
#                    a source sector to every other sector in the game and
#                    back, setting avoids at every calculation to make
#                    sure no warps are missed.  VERY accurate, but VERY
#                    slow! :(
#                    Always write down the last sector it plotted the
#                    course to so that you can resume the script from that
#                    point.
# Trigger Point    : CIM Prompt
# Warnings         : Make sure your avoids are cleared when you begin
#                    this script.
# Other            : This script makes use of Script Windows.  These items
#                    are not supported in TWX Proxy 2.00, but the utilisation
#                    remains for future versions.

# check if we can run it from here
cutText CURRENTLINE $location 1 2

if ($location <> ": ")
        clientMessage "This script must be run from the CIM prompt"
        halt
end

reqRecording
logging off

# show script banner
echo "**" ANSI_3 "     --" ANSI_11 "===| " ANSI_15 "Zero Turn Mapping v2.00" ANSI_11 " |===" ANSI_3 "--**"
echo ANSI_7 "No registration is required to use this script,*it is completely open source and can be opened*in notepad."
echo "**" ANSI_15 "For your own safety, please read the warnings*written at the top of the script before*using it!*"

# get source sector
getInput $source "Enter source sector" 0
getInput $start "Enter start sector" 0

window ztm 170 94 "ZTM" ONTOP
setWindowContents ztm "Perc Done:*Est Time:*Speed:*Up to:"

setVar $i $start
setVar $calcsDone 0
mergeText $source " > " $waitLine

:restart

# set a trigger to continue if we get disconnect and get back in..
setEventTrigger disconnectEvent :sub_Disconnected "Connection lost"
setDelayTrigger updateWindow :sub_UpdateWindow 60000

# away we go
:sub_ZTM
  if ($i <> $source)
    add $calcsDone 1
    send "f" $i "*" $source "*"
    # have to use triggers rather than waitFor here - otherwise the delayTrigger
    # could mess things up.                
    setTextLineTrigger 1 :wait "  TO > "
    pause
    :wait
    :nextPlot
    # plot the course
    send "f" $source "*" $i "*"
    setTextLineTrigger 1 :wait2 "FM > "
    pause
    :wait2
    setTextLineTrigger 1 :getLastSector $waitLine
    setTextLineTrigger 2 :plotDone "No route within"
    pause
    :getLastSector
    killTrigger 2
    # find the total words on the line
    setVar $total 1

    :sub_getWord
      getWord CURRENTLINE $word $total
      if ($word = "0")
        if ($total >= 3)
          subtract $total 3
          getWord CURRENTLINE $word $total
        else
          setVar $word $lastWord
        end
        if ($word = $source)
          # don't try and avoid the source
          goto :finishedPlot
        end
        if ($word = ">")
          # end of line - wait for next line
          subtract $total 1
          getWord CURRENTLINE $lastWord $total
          setTextLineTrigger 1 :getLastSector " "
          pause
        end
        # avoid the sector and plot again
        stripText $word "("
        stripText $word ")"
        send "s" $word "*"
        goto :nextPlot
      end
      add $total 1
      goto :sub_getWord

    :plotDone
    killTrigger 1
    send "y"
    :finishedPlot
  end

  add $i 1

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
  setVar $percDone (($i * 100) / SECTORS)
  setVar $minsLeft ((SECTORS - $i) / $calcsDone)
  setVar $hoursLeft ($minsLeft / 60)
  subtract $minsLeft ($hoursLeft * 60)
  
  setVar $contents "Perc Done: " & $percDone & "%*Est Time: " & $hoursLeft & " hrs " & $minsLeft & " mins*Speed: " & $calcsDone & " cmp*Up to: " & $i
  setWindowContents ztm $contents
  
  setVar $calcsDone 0
  setDelayTrigger updateWindow :sub_UpdateWindow 60000
  pause

:sub_Disconnected
  waitFor "Command [TL="
  send "cv0*yyq^"
  killAllTriggers
  goto :restart
