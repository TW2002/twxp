#mental notes
#tweak same planet col transfer (needs the loop)
#script multi planet col transfer
#script express and Twarp multi planet transfer
#script terra Express and Twarp col transfer
#script e-probe path safety
#figure out the limits for the rest of the planets
#configure a optional planet buster

cutText CURRENTLINE $location 1 14

if ($location <> "Planet command")
  clientMessage "This script must be run from the surface of a planet"
  halt
end

:trigger
killAllTriggers
setEventTrigger 100 :End "Connection lost"
setTextLineTrigger 101 :End "Command [TL="
setTextLineTrigger 102 :End "Citadel command"
setvar $Ear "M"
setvar $Des "K-BE"
setvar $Oce "O-J"
setvar $Mt. "L-E"
setvar $Ice "C-EJ"
setvar $Vol "H-KEJ"
setvar $Gas "U-GJ"
goto :scan
pause

:scan
killTrigger 0
send " D"
setTextLineTrigger 2 :grab_class "Class "
pause

:grab_class
getWord CURRENTLINE $class 2
stripText $class ","
goto :class_filter
pause

:class_filter
  if ($ear = $class)
goto :ear
  elseif ($des = $class)
goto :des
  elseif ($oce = $class)
goto :oce
  elseif ($mt. = $class)
goto :mt.
  elseif ($ice = $class)
goto :ice
  elseif ($vol = $class)
goto :vol
  elseif ($gas = $class)
goto :gas
  else
  echo " **error**"
  goto :class_refilter
end
pause

:class_refilter
  if ($ear = $class)
goto :ear
  elseif ($des = $class)
goto :des
  elseif ($oce = $class)
goto :oce
  elseif ($mt. = $class)
goto :mt.
  elseif ($ice = $class)
goto :ice
  elseif ($vol = $class)
goto :vol
  elseif ($gas = $class)
goto :gas
  else
  echo " **error**"
  halt
end
pause

:ear
echo " **I HAVENT FINISHED Earth Type CLASS YET!**Earth Type Class is Optimized at 15,000**"
setVar $limit "15000"
setVar $no_room "30000"
send " d"
setTextLineTrigger 1 :fuel_grab "Fuel Ore"
pause

:des
echo " **I HAVENT FINISHED Desert wasteland CLASS YET!**Desert wasteland Class is Optimized at ???**"
setVar $limit "0"
setVar $no_room "0"
send " d"
setTextLineTrigger 1 :fuel_grab "Fuel Ore"
pause

:oce
echo " **I HAVENT FINISHED Oceanic CLASS YET!**Oceanic Class is Optimized at 100,000**"
setVar $limit "100000"
setVar $no_room "200000"
send " d"
setTextLineTrigger 1 :fuel_grab "Fuel Ore"
pause

:mt.
echo " **I HAVENT FINISHED Mountainous CLASS YET!**Mountainous Class is Optimized at 20,000**"
setVar $limit "20000"
setVar $no_room "40000"
send " d"
setTextLineTrigger 1 :fuel_grab "Fuel Ore"
pause

:ice
echo " **I HAVENT FINISHED Glacial CLASS YET!**Glacial Class is Optimized at ???**"
setVar $limit "0"
setVar $no_room "0"
send " d"
setTextLineTrigger 1 :fuel_grab "Fuel Ore"
pause

:vol
echo " **I HAVENT FINISHED Volcanic CLASS YET!**Volcanic Class is Optimized at 50,000**"
setVar $limit "50000"
setVar $no_room "100000"
send " d"
setTextLineTrigger 1 :fuel_grab "Fuel Ore"
pause

:gas
echo " **I HAVENT FINISHED Vaporous/Gaseous CLASS YET!**Vaporous/Gaseous Class is Optimized at ???**"
setVar $limit "0"
setVar $no_room "0"
send " d"
setTextLineTrigger 1 :fuel_grab "Fuel Ore"
pause

:fuel_grab
killTrigger 1
getWord CURRENTLINE $fuel_grab 3
stripText $fuel_grab ","
setVar $fuel_room ($no_room - $fuel_grab)
send " d"
setTextLineTrigger 2 :org_grab "Organics"
pause

:org_grab
killTrigger 2
getWord CURRENTLINE $org_grab 2
stripText $org_grab ","
setVar $org_room ($no_room - $org_grab)
send " d"
setTextLineTrigger 3 :equip_grab "Equipment"
pause

:equip_grab
killTrigger 3
getWord CURRENTLINE $equip_grab 2
stripText $equip_grab ","
setVar $equip_room ($no_room - $equip_grab)
goto :filter_limit
pause

:filter_limit
if (($limit < 1000) OR ($limit = 1000))
  goto :limit_bad
elseif ($limit > 1000)
  goto :limit_good
else
  echo " **error**"
  halt
end
pause

:limit_bad
echo " **your limit was**" $limit "**canceling script**"
halt
pause

:limit_good
echo " **your limit was**" $limit "**proceding**"
goto :Fuel_move_1
pause

:fuel_move_1
if ((($fuel_grab < $limit) OR ($fuel_grab = $limit)) AND (($org_grab < $limit) OR (org_grab = $limit)) AND (($equip_grab < $limit) OR ($equip_grab = $limit)))
  echo " **all of the colonists are optimized.**stoping script**"
  halt
elseif ($fuel_grab > $limit)
  setVar $move_fuel ($fuel_grab - $limit)
  goto :fuel_move_2
elseif (($fuel_grab < $limit) OR ($fuel_grab = $limit))
  goto :org_move_1
else
  echo " **error**"
  halt
end
pause

:fuel_move_2
if ($class = $vol)
  goto :fuel_vol
elseif (($move_fuel < $org_room) OR ($Move_fuel = $org_room))
  send " pn1" $move_fuel "*2"
  goto :org_move_1
elseif ((($move_fuel > $org_room) AND ($move_fuel < $equip_room)) OR (($move_fuel > $org_room) AND ($move_fuel = $equip_room)))
  send " pn1" $move_fuel "*3"
  goto :org_move_1
elseif (($move_fuel > $org_room) AND ($move_fuel > $equip_room))
  echo " **there is nowhere to put the fuel colonists**advise you move some off planet**"
  goto :org_move_1
else
  echo " **error**"
  halt
end
pause

:fuel_vol
if (($move_fuel < $org_room) OR ($Move_fuel = $org_room))
  send " pn1" $move_fuel "*3"
  goto :equip_move_1
else
  echo " **error**"
  halt
end
pause

:org_move_1
if ((($fuel_grab < $limit) OR ($fuel_grab = $limit)) AND (($org_grab < $limit) OR (org_grab = $limit)) AND (($equip_grab < $limit) OR ($equip_grab = $limit)))
  echo " **all of the colonists are optimized.**stoping script**"
  halt
elseif ($org_grab > $limit)
  setVar $move_org ($org_grab - $limit)
  goto :org_move_2
elseif (($org_grab < $limit) OR ($org_grab = $limit))
  goto :equip_move_1
else
  echo " **error**"
  halt
end
pause

:org_move_2
if (($move_org < $equip_room) OR ($Move_org = $equip_room))
  send " pn2" $move_org "*3"
  goto :equip_move_1
elseif (($move_org > $equip_room) AND ($fuel_grab < $limit))
  setVar $move_org_fuel ($move_org - ($limit - $fuel_grab))
  send " pn2" $move_org_fuel "*1"
  goto :equip_move_1
elseif (($move_org > $equip_room) AND (($fuel_grab > $limit) OR (fuel_grab = $limit)))
  echo " **there is nowhere to put the organic colonists**advise you move some off planet**"
  goto :equip_move_1
else
  echo " **error**"
  halt
end
pause

:Equip_move_1
if ((($fuel_grab < $limit) OR ($fuel_grab = $limit)) AND (($org_grab < $limit) OR (org_grab = $limit)) AND (($equip_grab < $limit) OR ($equip_grab = $limit)))
  echo " **all of the colonists are optimized.**stoping script**"
  halt
elseif ($equip_grab > $limit)
  setVar $move_equip ($equip_grab - $limit)
  goto :equip_move_2
elseif (($equip_grab < $limit) OR ($equip_grab = $limit))
  goto :end
else
  echo " **error**"
  halt
end
pause

:equip_move_2
if ($class = $vol)
  goto :equip_vol
elseif ($fuel_grab < $limit)
  setVar $move_equip_fuel ($move_equip - ($limit - $fuel_grab))
  send " pn3" $move_equip_fuel "*1"
  goto :end
elseif ((($fuel_grab > $limit) OR ($fuel_grab = $limit)) AND ($org_grab < $limit))
  setVar $move_equip_org ($move_equip - ($limit - $org_grab))
  send " pn3" $move_equip_org "*2"
  goto :end
elseif ((($fuel_grab > $limit) OR ($fuel_grab = $limit)) AND (($org_grab > $limit) OR (org_grab = $limit)))
  echo " **there is nowhere to put the equipment colonists**advise you move some off planet**"
  halt
else
  echo " **error**"
  halt
end
pause

:equip_vol
if ($fuel_grab < $limit)
  setVar $move_equip_fuel ($move_equip - ($limit - $fuel_grab))
  send " pn3" $move_equip_fuel "*1"
  goto :end
else
  echo " **error**"
  halt
end
pause

:end
echo " **end hit**terminating script**"
halt
pause