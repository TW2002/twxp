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

setVar $Header~Script "Build"

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
loadVar $BuildSaved

if ($BuildSaved)
  loadVar $MassColonise~EWarp
  loadVar $build_planetsPerSector
  loadVar $build_planetsToBuild
  loadVar $build_upgradePort
else
  setVar $MassColonise~EWarp 1
  setVar $build_planetsPerSector 5
  setVar $build_planetsToBuild "Mountainous Volcanic"
  setVar $build_upgradePort 1
  
  saveVar $MassColonise~EWarp
  saveVar $build_planetsPerSector
  saveVar $build_planetsToBuild
  saveVar $build_upgradePort
  
  setVar $BuildSaved 1
  saveVar $BuildSaved
end

# create setup menu
addMenu "" "Build" "Build Settings" "." "" "Main" FALSE
addMenu "Build" "GO" "GO!" "G" :Menu_Go "" TRUE

loadVar $PPTSaved

if ($PPTSaved)
  loadVar $PPT~DropFigs
  loadVar $PPT~PercTrade
else
  setVar $PPT~DropFigs 1
  setVar $PPT~PercTrade 20
  
  saveVar $PPT~DropFigs
  saveVar $PPT~PercTrade
  
  setVar $PPTSaved 1
  saveVar $PPTSaved
end
setVar $PPT~Menu "Build"
gosub :PPT~Menu
setMenuHelp "PPT" "This menu allows you to adjust the way in which the script will trade between ports."

loadVar $PortCheckSaved

if ($PortCheckSaved)
  loadVar $PortCheck~Danger
  loadVar $PortCheck~FuelOrganics
  loadVar $PortCheck~PortType
else
  setVar $PortCheck~Danger 0
  setVar $PortCheck~FuelOrganics 1
  setVar $PortCheck~PortType 1
  
  saveVar $PortCheck~Danger
  saveVar $PortCheck~FuelOrganics
  saveVar $PortCheck~PortType
  
  setVar $PortCheckSaved 1
  saveVar $PortCheckSaved
end
gosub :PortCheck~Menu

loadVar $MoveSaved

if ($MoveSaved)
  loadVar $Move~ScanHolo
  loadVar $Move~ExtraSend
  replaceText $Move~ExtraSend #42 "*" 
  loadVar $Move~Evasion
  loadVar $Move~Attack
else
  setVar $Move~ScanHolo 1
  setVar $Move~ExtraSend "f1" & #42 & "ct"
  
  saveVar $Move~ScanHolo
  saveVar $Move~ExtraSend
  replaceText $Move~ExtraSend #42 "*" 
  
  setVar $MoveSaved 1
  saveVar $MoveSaved
end
setVar $Move~Menu "Build"
gosub :Move~Menu
setMenuHelp "Move" "This menu allows you to configure how this script behaves when it navigates the game, either while trading or finding a good spot to build a base."

addMenu "Build" "Colonise" "Colonise Settings" "C" "" "Colonise" FALSE
addMenu "Colonise" "Colonise_EWarp" "Allow EWarp colonising" "E" :Colonise_EWarp "" FALSE
addMenu "Build" "PlanetsPerSector" "Planets per sector" "L" :PlanetsPerSector "" FALSE
addMenu "Build" "PlanetsToBuild" "Planets to build" "B" :PlanetsToBuild "" FALSE
addMenu "Build" "UpgradePort" "Upgrade fuel port" "U" :UpgradePort "" FALSE

setMenuHelp "Colonise" "The colonise settings menu allows you to configure the way this script performs its colonising."
setMenuHelp "Colonise_EWarp" "If EWarp colonising is enabled, the script will colonise using an express-warp when there is no TWarp fuel available, no transwarp drive on the ship, or no ability to TWarp to fedspace."
setMenuHelp "PlanetsPerSector" "This is the number of planets this script will try to build in every base that it finds.  Always make sure this is lower than the game planet limit per sector."
setMenuHelp "PlanetsToBuild" "This is a list of planet types the script will attempt to build.  These should be the first word of every requested planet name, seperated by spaces.  I.e: Earth Volcanic Mountainous"
setMenuHelp "UpgradePort" "If this option is enabled, the script will throw a large amount of credits into upgrading the fuel on any Sxx port in the sector being built in.  This fuel will then be used for colonising."

gosub :sub_SetMenu

# open config menu
openMenu "Build"

:Colonise_EWarp
if ($MassColonise~EWarp)
  setVar $MassColonise~EWarp 0
else
  setVar $MassColonise~EWarp 1
end

saveVar $MassColonise~EWarp

gosub :sub_SetMenu
openMenu "Colonise"

:UpgradePort
if ($build_upgradePort)
  setVar $build_upgradePort 0
else
  setVar $build_upgradePort 1
end

saveVar $build_upgradePort

gosub :sub_SetMenu
openMenu "Build"

:PlanetsPerSector
getInput $value "Enter number of planets per sector"
isNumber $test $value
if ($test = 0)
  echo ANSI_15 "**Value must be a number*"
  goto :PlanetsPerSector
end
setVar $build_planetsPerSector $value
saveVar $build_planetsPerSector

gosub :sub_SetMenu
openMenu "Build"

:PlanetsToBuild
getInput $build_planetsToBuild "Enter a list of planets names to build, separated by spaces"
saveVar $build_planetsToBuild
gosub :sub_SetMenu
openMenu "Build"


:sub_SetMenu
  if ($MassColonise~EWarp)
    setMenuValue "Colonise_EWarp" "YES"
  else
    setMenuValue "Colonise_EWarp" "NO"
  end
  
  if ($build_upgradePort)
    setMenuValue "UpgradePort" "YES"
  else
    setMenuValue "UpgradePort" "NO"
  end
  
  setMenuValue "PlanetsPerSector" $build_planetsPerSector
  setMenuValue "PlanetsToBuild" $build_planetsToBuild
  return


:Menu_Go

# set game prefs to requirements
setVar $GamePrefs~Bank "Build"
setVar $GamePrefs~Animation[$GamePrefs~Bank] OFF
setVar $GamePrefs~PageMessages[$GamePrefs~Bank] OFF
setVar $GamePrefs~AbortDisplayAll[$GamePrefs~Bank] OFF
setVar $GamePrefs~ScreenPauses[$GamePrefs~Bank] OFF
gosub :GamePrefs~SetGamePrefs

setEventTrigger disconnect :disconnected "Connection lost"
setVar $built 0

# break ignore list down into array
setVar $i 1
setVar $MakePlanet~WantedPlanetCount 0
:i
getWord $build_planetsToBuild $MakePlanet~WantedPlanets[($i - 1)] $i
if ($MakePlanet~WantedPlanets[($i - 1)] <> 0)
  add $i 1
  add $MakePlanet~WantedPlanetCount 1
  goto :i
end  

 
:findBase
# find a base
setVar $reconnect :findBase
setVar $Move~CheckSub :~sub_BaseCheck
setVar $Move~PortPriority 1
setVar $Move~DedPriority 1
send "d"
gosub :Move~Move

# make sure we have it figged
send "f1*cd"

# make sure we have enough cash to build here
gosub :PlayerInfo~InfoQuick

if ($PlayerInfo~Credits < 3000000)
  # go trade up
  gosub :sub_Trade
end

# upgrade the port (if set to)
if ($build_upgradePort)
  send "o1"
  setTextTrigger getUpgrade :getUpgrade "0 to quit)"
  pause
  :getUpgrade
  getWord CURRENTLINE $upgrade 9
  stripText $upgrade "("
  send $upgrade "**"
end

:buildPlanets
setVar $reconnect :buildPlanets

# build planets in here
while (SECTOR.PLANETCOUNT[$base] < $build_planetsPerSector)
  setVar $MakePlanet~CreditLimit 2000000
  setVar $MakePlanet~Resupply 1
  setVar $MakePlanet~Sector $base
  setVar $MakePlanet~WarpType "T"
  gosub :MakePlanet~MakePlanet
  send "d"
  waitOn "Sector  : "
  waitOn "Command [TL="
end

if ($MakePlanet~Failure <> 0)
  # ran out of cash, go get more!
  gosub :sub_Trade
  goto :buildPlanets
end

:colonise
# colonise these planets
setVar $reconnect :colonise
gosub :MassColonise~MassColonise

:upgrade
# upgrade these planets
setVar $reconnect :upgrade
setVar $MassUpgrade~Sector $base
setVar $MassUpgrade~Seek 1
gosub :MassUpgrade~MassUpgrade

# now go find another spot for a base
setVar $built 1
goto :findBase


:sub_BaseCheck
  # see if this sector is worthy of being built up
  if ($built)
    setVar $built 0
  else
    if (PORT.CLASS[$Move~CurSector] > 0) and (PORT.BUYFUEL[$Move~CurSector] = 0) and (SECTOR.WARPCOUNT[$Move~CurSector] = 1) and (SECTOR.WARPINCOUNT[$Move~CurSector] <= 1) and ((SECTOR.FIGS.QUANTITY[$Move~CurSector] = 0) or (SECTOR.FIGS.OWNER[$Move~CurSector] = "yours") or (SECTOR.FIGS.OWNER[$Move~CurSector] = "belong to your Corp"))
      # found our base
      setVar $base $Move~CurSector
      setVar $Move~found 1
    end
  end
  
  return


:sub_Trade
  clientMessage "Going trading"
  setVar $reconnect :sub_Trade
  setVar $WorldTrade~Quota 4000000
  gosub :WorldTrade~WorldTrade
  
  # return to base
  setVar $Warp~Dest $base
  setVar $Warp~Method $warpMethod
  gosub :Warp~Warp
  
  return


:disconnected
  # disconnected.  Wait for the prompt then restart
  killAllTriggers
  setEventTrigger disconnect :disconnected "Connection lost"
  
  waitFor "Command [TL="
  
  if ($reconnect <> :sub_Trade)
    # check if we're at base
    getText CURRENTLINE $sect "]:[" "] (?=Help"
    
    if ($sect <> $base)
      setVar $Warp~Dest $base
      setVar $Warp~Method $warpMethod
      gosub :Warp~Warp
    end
  end
  
  goto $reconnect
  

# includes:
include "include\header"
include "include\worldTrade"
include "include\move"
include "include\makePlanet"
include "include\massColonise"
include "include\massUpgrade"
include "include\playerInfo"
include "include\warp"
include "include\gamePrefs"
