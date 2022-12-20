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

# TWX Script Pack 1: Trans-colonisation script
# Author           : Xide
# Description      : Colonisation script which twarps to terra and back.  Can
#                    obtain fuel from any planet or port within the target
#                    sector.
# Trigger Point    : Target planet surface
# Warnings         : NO BLIND WARP PROTECTION - make sure your alignment is
#                    above 1000 and you have figs in the target sector!
#                    Assumes the target sector has multiple planets or the
#                    ship has a planet scanner (no quick landings).  Doesn't
#                    keep track of your turns so keep an eye on them.
#                    Make sure you have cleared avoids as they can cause
#                    miscalculations of warp distance in rare occasions.
# Other            : A moderately complex script as it has to calculate the
#                    fuel ore required to get to and from terra.  Fairly
#                    straightforward though.

# check if we can run it from here
cutText CURRENTLINE $location 1 14

if ($location <> "Planet command")
  clientMessage "This script must be run from the surface of a planet"
  halt
end

# show script banner
echo "**" ANSI_3 "     --" ANSI_11 "===| " ANSI_15 "Trans-Colonisation v2.00" ANSI_11 " |===" ANSI_3 "--**"
echo ANSI_7 "No registration is required to use this script,*it is completely open source and can be opened*in notepad."
echo "**" ANSI_15 "For your own safety, please read the warnings*written at the top of the script before*using it!*"

# get info on where to get fuel from
:GetFuelSource
echo "*" ANSI_15 "Select fuel source:" "**"
echo ANSI_11 "1 " ANSI_3 " - Current Planet*"
echo ANSI_11 "2 " ANSI_3 " - Port*"
echo ANSI_11 "3 " ANSI_3 " - Other Planet*"
getConsoleInput $fuelSource SINGLEKEY

if ($fuelSource = 1)
  # work current planet
elseif ($fuelSource = 2)
  # work port
  setVar $fuelSource P
elseif ($fuelSource = 3)
  # work foreign planet
  getInput $fuelSource "Enter fuel source planet ID"
else
  goto :GetMoveFrom
end

:GetMoveFrom
echo "*" ANSI_15 "Select category to drop colonists:" "**"
echo ANSI_11 "1 " ANSI_3 " - Fuel Ore*"
echo ANSI_11 "2 " ANSI_3 " - Organics*"
echo ANSI_11 "3 " ANSI_3 " - Equipment*" ANSI_7
getConsoleInput $category SINGLEKEY

if ($category <> 1) and ($category <> 2) and ($category <> 3)
  goto :GetMoveFrom
end

logging off

# get the planet number
send "d"
setTextLineTrigger 1 :GetPlanetNumber "Planet #"
pause

:GetPlanetNumber
setVar $line CURRENTLINE
stripText $line "#"
getWord $line $planetNumber 2
waitfor "Planet command"
send "qcf*1*"
setTextLineTrigger 1 :GetSectorNumber "What is the starting sector"
pause

:GetSectorNumber
# get the sector number
setVar $line CURRENTLINE
stripText $line "["
stripText $line "]"
getWord $line $sectorNumber 6
send "f1*" $sectorNumber "*qil" $planetNumber "*"
setTextLineTrigger 1 :GetFuelNeededTo "The shortest path"
pause

:GetFuelNeededTo
# get the fuel needed to get to sector 1
setVar $line CURRENTLINE
stripText $line "("
getWord $line $fuelNeededTo 4
Multiply $fuelNeededTo 3
setTextLineTrigger 1 :GetFuelNeededFrom "The shortest path"
pause

:GetFuelNeededFrom
# get the fuel needed to get back from sector 1
setVar $line CURRENTLINE
stripText $line "("
getWord $line $fuelNeededFrom 4
Multiply $fuelNeededFrom 3
setVar $fuelNeeded $fuelNeededTo
add $fuelNeeded $fuelNeededFrom

# see if we have a planet scanner
setTextLineTrigger 1 :HasScanner "Planet Scanner"
setTextTrigger 2 :sub_Colonise "Planet command"
pause

:HasScanner
setVar $scanner 1
killTrigger 2

# now that we know the planet number, the sector its in, and the amount
# of fuel needed to get to sector 1 and back, we can begin colonising!

:sub_Colonise
  killTrigger 1
  if ($fuelSource = "p") or ($fuelSource = "P")
    send "qpt" $fuelNeeded "**0*0*"
  else
    if ($fuelSource = 1)
      send "tnt1" $fuelNeeded "*q"
    else
      send "ql" $fuelSource "*tnt1" $fuelNeeded "*q"
    end
  end

  send "1*yyl"

  if ($scanner = 1)
    send "1*"
  end

  send "**" $sectorNumber

  if (SECTORS > 5000) or ($sectorNumber < 600)
    # damn autocompleting sector numbers! I HATE EM!
    send "*"
  end

  send "yyl" $planetNumber "*snl" $category "*"
  setTextTrigger 2 :sub_Colonise "<Land on Terra>"
  pause
