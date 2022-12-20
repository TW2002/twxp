# Copyright (C) 2008  Karl Leifeste
# 
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 

# Limpet Watcher
# What limpets have changed since you last looked?

:main
  goSub :init
  goSub :readLimpetsFromFile
  goSub :refreshLimpets
  goSub :identifyNewLimpets
  goSub :writeLimpetsToFile
halt

# go through the new short list.
# Compare the value at these indeces with the old list.
:identifyNewLimpets
  setVar $i 0
  while ($i < $limpetIndex)
    add $i 1
    if ($limpetVector[$limpetIndex[$i]] > $lastLimpetVector[$limpetIndex[$i]])
      echo "*New Limpet in " $limpetIndex[$i] "*"
    #else 
    #  echo "*No New Limpet in " $limpetIndex[$i] "*"
    end
  end
return


#  * Put all limpets in a short array
#  * Increment every sector in the SECTORS vectorspace when a
#    limpet is seen.
:refreshLimpets
  setVar $i 0
  setTextLineTrigger activated :activated "Activated  Limpet  Scan"
  send "k2"
  pause
  :activated
  waitFor "Sector    Personal/Corp"
  setTextLineTrigger total :total "Total"
  waitFor "========================"
  :loopInit
    killTrigger personal
    killTrigger corporate
    setTextLineTrigger personal :personal "Personal"
    setTextLineTrigger corporate :corporate "Corporate"
    pause
    :personal
    :corporate
    add $i 1
    setVar $currentLine CURRENTLINE
    getWord $currentline $sector 1
    setVar $limpetIndex[$i] $sector
    add $limpetVector[$sector] 1
  goTo :loopInit
  :total
  setVar $limpetIndex $i
  killTrigger personal
  killTrigger corporate
return

:init
  setArray $limpetVector SECTORS
  setArray $lastLimpetVector SECTORS
  setVar $limpetFile GAMENAME & "-active-limpets"
  setVar $currentLine CURRENTLINE
  getWord $currentLine $firstWord 1
  if ($firstWord <> "Command")
    echo "*Must start at command prompt*"
    halt
  end
return

:writeLimpetsToFile
  fileExists $testFile $limpetFile
  if ($testFile = 1)
    delete $testFile
  end
  setVar $i 0
  while ($i < $limpetIndex)
    add $i 1
    write $limpetFile $limpetIndex[$i]
  end
return


# * Put all limpets in a short array.
# * Cycle the short array and add 1 to the SECTORS vectorspace
#   for each limpet seen
:readLimpetsFromFile
  fileExists $testFile $limpetFile
  if ($testFile = 1)
    readToArray $limpetFile $lastLimpetIndex
  else
    setVar $lastLimpetIndex 0
  end
  setVar $i 0
  while ($i < $lastLimpetIndex)
    add $i 1
    add $lastLimpetVector[$lastLimpetIndex[$i]] 1
  end
return
