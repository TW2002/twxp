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

# SUB:       MakePlanet
# Passed:    $WantedPlanets[] - Zero based array of full/partial names of wanted planets
#            $Sector - Current sector ("0" if unknown)
#            $WantedPlanetCount - Number of items in array
#            $WarpType - "T" to twarp to/from stardock
#                        "E" to ewarp
#                        "S" to single step warp
#            $Resupply - "1" to resupply from stardock
#            $CreditLimit - Sub will abort if credits fall below this
#            $Haggle~HaggleFactor - Default hagglefactor
# Triggered: Anywhere
# Returned:  $PlanetID - ID of planet created
#            $Type - Type of planet created
#            $Name - Name of planet created
#            $Credits - Player credits
#            $Failed - "1" if failed to create planet (out of cash)
#                      "2" if failed to create planet


	gosub :BOT~loadVars

	setVar $BOT~help[1]    $BOT~tab&"makeplanet {ewarp} {create:} {"&#34&"custom planet name"&#34&"} "
	setVar $BOT~help[2]    $BOT~tab&"       "
	setVar $BOT~help[3]    $BOT~tab&"     {ewarp}  - Will refurb torps and atomics by ewarp "
	setVar $BOT~help[4]    $BOT~tab&"                This is NOT safe."         
	setVar $BOT~help[5]    $BOT~tab&"       "
	setVar $BOT~help[6]    $BOT~tab&"   {create:}  - List of planet types to make.  First word"
	setVar $BOT~help[7]    $BOT~tab&"                of planet types separated by commas and no spaces."
	setVar $BOT~help[8]    $BOT~tab&"                Default will use keeper planets in preferences."
	setVar $BOT~help[9]    $BOT~tab&"                "
	setVar $BOT~help[10]   $BOT~tab&"{custom name} - Name the planet will be.  Otherwise it's a random   "
	setVar $BOT~help[11]   $BOT~tab&"                name from a database              "
	setVar $BOT~help[12]   $BOT~tab&"                              "
	setVar $BOT~help[13]   $BOT~tab&"      Examples:                   "
	setVar $BOT~help[14]   $BOT~tab&"            >makeplanet create:earth,volcanic,oceanic "
	setVar $BOT~help[15]   $BOT~tab&"            >makeplanet ewarp create:earth         "
	setVar $BOT~help[16]   $BOT~tab&"            >makeplanet "&#34&"death"&#34&" create:volcanic "
	setVar $BOT~help[17]   $BOT~tab&"                              "
	setVar $BOT~help[18]   $BOT~tab&"               - Originally written by Xide"
	gosub :bot~helpfile

	loadVar $GAME~GENESIS_COST
	loadVar $GAME~ATOMIC_COST
	loadVar $MAP~STARDOCK 
	loadvar $bot~folder
	loadvar $game~MAX_PLANETS_PER_SECTOR
	loadvar $planet~planet_file

gosub :player~quikstats
setVar $startingLocation $PLAYER~CURRENT_PROMPT
if ($startingLocation = "Command")

elseif ($startingLocation = "Citadel")
	send "q"
	gosub :PLANET~getPlanetInfo
	setvar $startingPlanet $planet~planet
	send "q"
elseif ($startingLocation = "Planet")
	gosub :PLANET~getPlanetInfo
	setvar $startingPlanet $planet~planet
	send "q"
else
	setVar $SWITCHBOARD~message "Have to be on Command, Planet, or Citadel prompt to start upgrader.*"
	gosub :SWITCHBOARD~switchboard
	halt
end

gosub :PLANET~loadplanetInfo

getWordPos " "&$bot~user_command_line&" " $pos "ewarp"
setvar $warptype "T"
if ($pos > 0)
	setVar $warptype "E"
end


getWordPos " "&$bot~user_command_line&" " $pos "create:"
if ($pos > 0)
	getText " "&$bot~user_command_line&" " $create_list "create:" " "
	getwordpos $create_list $pos ","
	if ($pos > 0)
		splitText $create_list $wantedplanets  ","
	else
		setarray $wantedplanets 1
		setvar $wantedplanets[1] $create_list
		setvar $wantedplanets 1
	end
else
	setVar $i 1
	setVar $foundPlanet FALSE
	setVar $isAKeeper FALSE
	while (($i <= $planet~planetcounter) AND ($foundPlanet = FALSE))
		if ($planet~planetList[$i][7] = true)
			setVar $isAKeeper TRUE
		end
		add $i 1
	end
	if ($isAKeeper <> TRUE)
		setVar $SWITCHBOARD~message "Create list not defined, and no keeper planets defined in preferences.*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
end

setvar $custom_planet_name ""
getWordPos $bot~user_command_line $pos #34
if ($pos > 0)	
	setvar $bot~user_command_line $bot~user_command_line&" "
	getText " "&$bot~user_command_line&" " $custom_planet_name " "&#34 #34&" "
	if ($custom_planet_name <> "")
		stripText $bot~user_command_line " "&#34&$custom_planet_name&#34&" "
		cuttext $custom_planet_name $first_letter 1 1 
		cuttext $custom_planet_name $rest_of_letters 2 9999 
		uppercase $first_letter
		setvar $custom_planet_name $first_letter&$rest_of_letters
	end
end

gosub :planet~make_planet_array

gosub :makeplanet
if (($startingLocation = "Citadel") OR ($startingLocation = "Planet"))
	setvar $planet~planet $startingPlanet
	gosub :PLANET~landingsub
end
halt

:MakePlanet
  # sys_check
  


  setVar $Failed 0
  gosub :player~quikstats

  setvar $sector currentsector
  setVar $Credits currentcredits
  setVar $holds currentholds
  setVar $torps currentgentorps
  setVar $dets currentatomics
  setVar $figs currentfighters
  setVar $shield currentshields
  

  # see if we really can twarp
  if ((SECTOR.FIGS.QUANTITY[$Sector] <= 0) or ((SECTOR.FIGS.OWNER[$Sector] <> "belong to your Corp") and (SECTOR.FIGS.OWNER[$Sector] = "yours")) or (currenttwarptype = 0) or (currentalignment < 1000)) and ($WarpType = "T")
	setVar $SWITCHBOARD~message "Cannot twarp safely, so halting.  Check alignment and make sure fighter is in sector.*"
	gosub :SWITCHBOARD~switchboard
	halt
  end
  
  :bust

  if ($torps <= 0) or ($dets <= 1)
    # resupply
    gosub :sub_Resupply
  end
  
  if ($Failed > 0)
    return
  end

  send "uy n " #8 #8
  subtract $torps 1
  setTextLineTrigger 1 :Bust_TestPlanet "What do you want to name"
  pause

  :Bust_TestPlanet
  getWord CURRENTLINE $Type 11
  stripText $Type ")"
  lowercase $type
  
if ($wantedplanets[1] = 0)
	setvar $planet~planet_type $type
	lowercase $planet~planet_type
	striptext $planet~planet_type ")"
	#echo $planet~planet_type&"*"

	setVar $i 1
	setVar $foundPlanet FALSE
	setVar $isAKeeper FALSE
	while (($i <= $planet~planetcounter) AND ($foundPlanet = FALSE))
		lowercase $planet~planetList[$i]
		lowercase $planet~planet_type
		getWordPos $planet~planetList[$i] $pos $planet~planet_type
		if ($pos > 0)
			setVar $isAKeeper $planet~planetList[$i][7]
			setVar $foundPlanet TRUE
		end
		add $i 1
	end
	if ($isAKeeper = true)
		goto :Bust_Wanted
	end
else

  if ($wantedplanets = 0)
		setVar $SWITCHBOARD~message "Somehow no wanted planets are defined.  Halting.*"
		gosub :SWITCHBOARD~switchboard
		halt
  end
  # see if we want it
  setVar $i 1
  while ($i <= $WantedPlanets)
    if ($WantedPlanets[$i] = $Type)
		setVar $SWITCHBOARD~message "Made "&$WantedPlanets[$i]&" planet!.*"
		gosub :SWITCHBOARD~switchboard
		goto :Bust_Wanted
    else
		#setVar $SWITCHBOARD~message "Looking for "&$WantedPlanets[$i]&", but found "&$Type&" instead.*"
		#gosub :SWITCHBOARD~switchboard
    end
    add $i 1
  end
end

  # we don't want it
  getRnd $name 1000 99999
  mergeText "Kill-" $name $longName
  send $longName "*cl"
  waitFor "Command [TL="

  # get its ID
  setTextLineTrigger 1 :Bust_Landed "Landing sequence engaged..."
  setTextLineTrigger 2 :Bust_GetID $longName
  pause
  :Bust_GetID
  setVar $line CURRENTLINE
  stripText $line "<"
  stripText $line ">"
  getWord $line $planetID 1
  send $planetID "* "
  killTrigger 1

  :Bust_Landed
  killTrigger 2
  # nuke it
  send "zdy  "
  subtract $dets 1
  goto :bust

  :Bust_Wanted
  # give it a nice name

if ($custom_planet_name = "")
	getRnd $planet~planet_pointer 1 1000
	setVar $first_part $planet~planet_names[$planet~planet_pointer]
	getWord $first_part $first_half 1
	getRnd $planet~planet_pointer 1 1000
	setVar $second_part $planet~planet_names[$planet~planet_pointer]
	getRnd $flip_a_coin 1 2
	getWord $second_part $last_half $flip_a_coin
	if (($last_half = "")  OR ($last_half = "0"))
		getWord $second_part $last_half 1
	end
	setVar $planet~planetLabel $first_half&" "&$last_half
	setVar $name $planet~planetLabel
else
	setvar $name $custom_planet_name
end
  send $Name "*cl"
  
  # get its ID
  waitOn "Should this be a"
  setTextLineTrigger 1 :Bust_Landed2 "Landing sequence engaged..."
  setTextLineTrigger 2 :Bust_GetID2 $Name
  pause
  :Bust_GetID2
  setVar $line CURRENTLINE
  stripText $line "<"
  stripText $line ">"
  getWord $line $PlanetID 1
  send "q*"
  killTrigger 1
  return

  :Bust_Landed2
  setTextLineTrigger 1 :Bust_Landed3 "Planet #"
  pause
  :Bust_Landed3
  getWord CURRENTLINE $PlanetID 2
  stripText $PlanetID "#"
  killTrigger 2
  send "q"  
  return


:sub_Resupply
  if ($Credits < $CreditLimit)
    # low on cash
    setVar $Failed 1
    return
  end
  
  gosub :PlayerInfo~InfoQuick
  setVar $buyFigs ($figs - currentfighters)
  setVar $buyShield ($shield - currentshields)
  setVar $Credits currentcredits
  
  loadvar $map~stardock
	  
  if ($WarpType = "T")
    # TWarp to stardock
    setVar $SeekProduct~Product 1
    setVar $SeekProduct~Holds currenttotalholds
    gosub :SeekProduct~SeekProduct
    
    if ($map~stardock < 600) or (SECTORS > 5000)
      send $map~stardock "*yy"
    else
      send $map~stardock "yy"
    end
  else
    setVar $Warp~Mode $WarpType
    setVar $Warp~Dest $map~stardock
    gosub :Warp~Warp
  end

  send "ps  g yg qh t"
  waitFor "Planning on starting a colony eh?"

  setTextTrigger Resupply_GetTorps :Resupply_GetTorps ") [0] ?"
  pause
  
  :Resupply_GetTorps
  getWord CURRENTLINE $Resupply_Torps 9
  stripText $Resupply_Torps ")"
  if ($torps >= 20)
    send "*a"
  elseif ($Resupply_Torps < (20 - $torps))
    send $Resupply_Torps "*a"
  else
    send (20 - $torps) "*a"
  end
  add $torps $Resupply_Torps
  
  waitFor "We have the standard Nuerevy Atomic Detonator"
  setTextTrigger Resupply_GetDets :Resupply_GetDets ") [0] ?"
  pause
  
  :Resupply_GetDets
  getWord CURRENTLINE $Resupply_Dets 9
  stripText $Resupply_Dets ")"
  send $Resupply_Dets "*"
  add $dets $Resupply_Dets
  
  if ($buyFigs > 0) or ($buyShield > 0)
    send "qs p "  
  
    if ($buyFigs > 0)
      send "b" $buyFigs "*"
    end
    if ($buyFigs > 0)
      send "c" $buyShield "*"
    end
    
    send "q"
  end

  send "qq"  
  
  if ($WarpType = "T")
    if ($Sector < 600) or (SECTORS > 5000)
      send $Sector "*yy"
    else
      send $Sector "yy"
    end
  else
    setVar $Warp~Mode $WarpType
    setVar $Warp~Dest $Sector
    gosub :Warp~Warp
  end
  
  return
  
  

# includes:

include "source\pack2_includes\playerInfo"
include "source\pack2_includes\warp"
include "source\pack2_includes\seekProduct"
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\loadplanetinfo\planet"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\planet\landingsub\planet"
include "source\bot_includes\player\twarp\player"
include "source\bot_includes\planet\makeplanetarray\planet"


