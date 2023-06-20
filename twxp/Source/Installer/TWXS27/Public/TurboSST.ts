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

# check location
cutText CURRENTLINE $location 1 12
if ($location <> "Command [TL=")
        clientMessage "This script must be run from the command menu"
        halt
end

reqRecording
logging off

clientMessage "----- Turbo World SST -----"

# get defaults
loadVar $TurboSSTSaved

if ($TurboSSTSaved)
  # load saved setup
  loadVar $WorldSST~BustFile
  loadVar $WorldSST~ShipList
  loadVar $WorldSST~StealFactor
else
  # set from defaults and save
  
  setVar $WorldSST~BustFile GAMENAME & "_busts.txt"
  setVar $WorldSST~ShipList ""
  setVar $WorldSST~StealFactor 30
  
  saveVar $WorldSST~BustFile
  saveVar $WorldSST~ShipList
  saveVar $WorldSST~StealFactor
end

setVar $TurboSSTSaved 1
saveVar $TurboSSTSaved

# create setup menu
addMenu "" "WorldSST" "Turbo World SST Settings" "." "" "Main" FALSE
addMenu "WorldSST" "GO" "GO!" "G" :Menu_Go "" FALSE
addMenu "WorldSST" "BustFile" "Bust list file" "B" :Menu_BustFile "" FALSE
addMenu "WorldSST" "StealFactor" "Steal factor" "S" :Menu_StealFactor "" FALSE
addMenu "WorldSST" "ShipList" "Ship list" "H" :Menu_ShipList "Ships" FALSE

setMenuValue "BustFile" $WorldSST~BustFile
setMenuValue "StealFactor" $WorldSST~StealFactor
setMenuValue "ShipList" $WorldSST~ShipList

# set move routine prefs
loadVar $Move~Saved

if ($Move~Saved)
  loadVar $Move~ScanHolo
  loadVar $Move~Evasion
  loadVar $Move~Attack
  loadVar $Move~PortPriority
  loadVar $Move~ExtraSend    
  replaceText $Move~ExtraSend #42 "*"
else
  setVar $Move~ScanHolo 1
  setVar $Move~Evasion 0
  setVar $Move~Attack 0
  setVar $Move~PortPriority 1
  setVar $Move~ExtraSend "f1" & #42 & "ct"
  saveVar $Move~ExtraSend
  replaceText $Move~ExtraSend #42 "*"
  
  saveVar $Move~ScanHolo
  saveVar $Move~Evasion
  saveVar $Move~Attack
  saveVar $Move~PortPriority
  
  setVar $Move~Saved 1
  saveVar $Move~Saved
end

setVar $Move~Menu "WorldSST"
gosub :Move~Menu

# set Refurb prefs
loadVar $Refurb~Saved

if ($Refurb~Saved)
  loadVar $Refurb~RefurbPort
  loadVar $Refurb~BuyFigs
  loadVar $Refurb~BuyShield
  loadVar $Refurb~CreditLimit
  loadVar $Refurb~Method
else
  setVar $Refurb~RefurbPort 1
  setVar $Refurb~BuyFigs 0
  setVar $Refurb~BuyShield 0
  setVar $Refurb~CreditLimit 300000
  setVar $Refurb~Method 0
  
  saveVar $Refurb~RefurbPort
  saveVar $Refurb~BuyFigs
  saveVar $Refurb~BuyShield
  saveVar $Refurb~CreditLimit
  saveVar $Refurb~Method
  
  setVar $Refurb~Saved 1
  saveVar $Refurb~Saved
end

setVar $Refurb~Menu "WorldSST"
gosub :Refurb~Menu

# open setup menu
openMenu "WorldSST"

:Menu_BustFile
getInput $WorldSST~BustFile "Enter the name of a file to store busts in (or leave blank not to store busts)"
saveVar $WorldSST~BustFile
setMenuValue "BustFile" $WorldSST~BustFile
openMenu "WorldSST"

:Menu_StealFactor
getInput $WorldSST~StealFactor "Enter the steal factor (i.e. 30)"
saveVar $WorldSST~StealFactor
setMenuValue "StealFactor" $WorldSST~StealFactor
openMenu "WorldSST"

:Menu_ShipList
getInput $WorldSST~ShipList "Enter a list of ships separated by spaces (i.e. '5 15 25')"
saveVar $WorldSST~ShipList
setMenuValue "ShipList" $WorldSST~ShipList
openMenu "WorldSST"

:Menu_Go
closeMenu

if ($WorldSST~BustFile <> "")
  echo "**" ANSI_15 "Clear existing bust list? (Y/N)"
  getConsoleInput $clearBusts SINGLEKEY

  if ($clearBusts = "y") or ($clearBusts = "Y")
    delete $WorldSST~BustFile
  end
end

setEventTrigger disconnect :disconnected "Connection lost"
gosub :WorldSST~WorldSST
halt

:disconnected
  # disconnected.  Terminate.
  halt  


# includes:

include "include\worldSST"
include "include\move"
include "include\refurb"