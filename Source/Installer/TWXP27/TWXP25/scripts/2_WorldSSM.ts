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

setVar $Header~Script "World SSM"

# check location
cutText CURRENTLINE $location 1 12
if ($location <> "Command [TL=")
        clientMessage "This script must be run from the command menu"
        halt
end

reqRecording
logging off

gosub :Header~Pack2Header

# get defaults
loadVar $WorldSSMSaved

if ($WorldSSMSaved)
  loadVar $WorldSSM~Refurb
  loadVar $WorldSSM~BustFile
  loadVar $Haggle~HaggleFactor
else
  setVar $WorldSSM~Refurb 1
  setVar $WorldSSM~BustFile GAMENAME & "_busts.txt"
  setVar $Haggle~HaggleFactor 7
  
  saveVar $WorldSSM~Refurb
  saveVar $WorldSSM~BustFile
  saveVar $Haggle~HaggleFactor
  
  setVar $WorldSSMSaved 1
  saveVar $WorldSSMSaved
end

# create setup menu
addMenu "" "WorldSSM" "World SSM Settings" "." "" "Main" FALSE
addMenu "WorldSSM" "GO" "GO!" "G" :Menu_Go "" FALSE
addMenu "WorldSSM" "BustFile" "Bust list file" "B" :Menu_BustFile "" FALSE

setMenuValue "BustFile" $WorldSSM~BustFile
setMenuHelp "BustFile" "This option will let you set the name of a text file to record all busts to.  When the script is reloaded, it can read this bust list and remember the ports it should avoid stealing from.  If no bust list is specified, the script will not track its busts in any way."

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

setVar $Move~Menu "WorldSSM"
gosub :Move~Menu
setMenuHelp "Move" "This menu lets you configure how the script will behave as it searches for good xxB pairs to SSM."

# set SSM prefs
loadVar $SSM~Saved

if ($SSM~Saved)
  loadVar $SSM~DropFigs
else
  setVar $SSM~DropFigs 1
  saveVar $SSM~DropFigs
  
  setVar $SSM~Saved 1
  saveVar $SSM~Saved
end


loadVar $SellSteal~Saved

if ($SellSteal~Saved)
  loadVar $SellSteal~StealFactor
else
  setVar $SellSteal~StealFactor 30
  
  setVar $SellSteal~Saved 1
  saveVar $SellSteal~Saved
end

setVar $SSM~Menu "WorldSSM"
gosub :SSM~Menu
setMenuHelp "SSM" "This menu will let you configure how the script performs its SSM."

setVar $PortCheck~PortType 2
gosub :PortCheck~Menu

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

setVar $Refurb~Menu "WorldSSM"
gosub :Refurb~Menu
setMenuHelp "Refurb" "This menu will let you configure how the script will refurb itself after each bust"

# open config menu
openMenu "WorldSSM"

:Menu_BustFile
getInput $WorldSSM~BustFile "Enter the name of a file to store busts in (or leave blank not to store busts)"
saveVar $WorldSSM~BustFile
setMenuValue "BustFile" $WorldSSM~BustFile
openMenu "WorldSSM"

:Menu_Go
closeMenu

if ($WorldSSM~BustFile <> "")
  echo "**" ANSI_15 "Clear existing bust list? (Y/N)"
  getConsoleInput $clearBusts SINGLEKEY

  if ($clearBusts = "y") or ($clearBusts = "Y")
    delete $WorldSSM~BustFile
  end
end

setVar $WorldSSM~Quota 0
setEventTrigger disconnect :disconnected "Connection lost"
gosub :WorldSSM~WorldSSM
halt

:disconnected
  # disconnected.  Wait for the prompt then restart
  killAllTriggers
  
  waitFor "Command [TL="
  goto :Menu_Go
  

# includes:
include "include\header"
include "include\worldSSM"
