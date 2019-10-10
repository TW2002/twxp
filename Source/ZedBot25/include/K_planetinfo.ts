#:K_planetinfo~PlanetInfo2
# SUB:       PlanetInfo
# Triggered: Within Sub to display of planet
# Passed:    $NoHeader - "1" to avoid triggering on "Planet #"
# Returned:  $planet - Planet ID number
#            $Class - Planet class name
#            $Code - Planet class code
#            $Sector - Planet sector
#            $Name - Planet name
#            $Creator - Planet creator
#            $Owner - Planet owner
#            $CitadelLevel - Planet citadel level
#            $Treasury - Planet treasury credits
#            $BuildTime - Time to construct next citadel level
#            $Colo[1] - Colonists in fuel production
#            $Colo[2] - Colonists in organics production
#            $Colo[3] - Colonists in equipment production
#            $Rate[1] - Production rate for fuel
#            $Rate[2] - Production rate for organics
#            $Rate[3] - Production rate for equipment
#            $Rate[4] - Production rate for figs
#            $Prod[1] - Daily production amount for fuel
#            $Prod[2] - Daily production amount for organics
#            $Prod[3] - Daily production amount for equipment
#            $Prod[4] - Daily production amount for figs
#            $Amount[1] - Fuel on planet
#            $Amount[2] - Organics on planet
#            $Amount[3] - Equipment on planet
#            $Amount[4] - Figs on planet
#            $Max[1] - Max fuel planet will hold
#            $Max[2] - Max organics planet will hold
#            $Max[3] - Max equipment planet will hold
#            $Max[4] - Max fighters planet will hold
#            $Full[1] - "1" if planet is overfull with colos in Fuel
#            $Full[2] - "1" if planet is overfull with colos in Organics
#            $Full[3] - "1" if planet is overfull with colos in Equipment
#            $DropCategory - Best category ("1", "2", "3") to deposit colonists

:PlanetInfo
  setprecision 0
  setVar $planet 0
  setVar $Sector 0
  setVar $Name ""
  setTextLineTrigger Header :Header "Planet #"
  setTextLineTrigger Class :Class "Class "
  setTextLineTrigger Creator :Creator "Created by: "
  setTextLineTrigger Owner :Owner "Claimed by: "
  send "*"
  pause

  :Header
  getWord CURRENTLINE $planet 2
   stripText $planet "#"
  getWord CURRENTLINE $Sector 5
  stripText $Sector ":"
  getWord CURRENTLINE $test 6

  if ($test <> "0")
    getWordPos CURRENTLINE $Pos ": "
    cutText CURRENTLINE $Name ($Pos + 2) 999
  else
    setVar $Name $test
  end

  pause

  :Class
  getWord CURRENTLINE $Code 2
  stripText $Code ","
  getLength $Code $Len
  cutText CURRENTLINE $Class ($Len + 9) 999
  pause

  :Creator
  getWord CURRENTLINE $test 3
  if ($test = "0")
    setVar $Creator ""
  else
    cutText CURRENTLINE $Creator 13 999
  end
  pause

  :Owner
  getWord CURRENTLINE $test 3
  if ($test = "0")
    setVar $Owner ""
  else
    cutText CURRENTLINE $Owner 13 999
    gettext $Owner $ourtest "[" "]"
    if ($ourtest = $qsscorp)
    setvar $Owner "Our Corp"
    end
  end
  waitOn "-------  ---------  ---------"

:planetinfo2
  setprecision 0
  setarray $Prod 4
  setarray $Rate 4
  setarray $Max  4
  setarray $Full 4
  setarray $Amount 4
  setarray $Colo 3
  setVar $BuildTime 0
  setVar $CitadelLevel 0
  setVar $Treasury 0
  setvar $Tpad 0
  add $loop 1
  killalltriggers
  setTextLineTrigger FuelOre :FuelOre "Fuel Ore   "
  setTextLineTrigger Organics :Organics "Organics   "
  setTextLineTrigger Equipment :Equipment "Equipment  "
  setTextLineTrigger Fighters :Fighters "Fighters    "
  setTextLineTrigger CitadelLevel :CitadelLevel "Planet has a level "
  setTextLineTrigger Defense :Defense "Military reaction="
  setTextLineTrigger Shields :Shields "Planetary Defense Shielding Power Level"
  setTextLineTrigger IG :IG "Planetary Interdictor Generator ="
  setTextLineTrigger Tpad :Tpad "TransPort power ="
  setTextLineTrigger BuildTime :BuildTime " under construction, "
  setTextTrigger InfoDone :InfoDone "Planet command (?=help) [D]"
  send "*"
  pause

  :FuelOre
  getWord CURRENTLINE $Colo[1] 3
  stripText $Colo[1] ","
  getWord CURRENTLINE $Rate[1] 4
  stripText $Rate[1] ","
  getWord CURRENTLINE $Prod[1] 5
  stripText $Prod[1] ","
  getWord CURRENTLINE $Amount[1] 6
  stripText $Amount[1] ","
  getWord CURRENTLINE $Max[1] 8
  stripText $Max[1] ","
  pause

  :Organics
  getWord CURRENTLINE $Colo[2] 2
  stripText $Colo[2] ","
  getWord CURRENTLINE $Rate[2] 3
  stripText $Rate[2] ","
  getWord CURRENTLINE $Prod[2] 4
  stripText $Prod[2] ","
  getWord CURRENTLINE $Amount[2] 5
  stripText $Amount[2] ","
  getWord CURRENTLINE $Max[2] 7
  stripText $Max[2] ","
  pause

  :Equipment
  getWord CURRENTLINE $Colo[3] 2
  stripText $Colo[3] ","
  getWord CURRENTLINE $Rate[3] 3
  stripText $Rate[3] ","
  getWord CURRENTLINE $Prod[3] 4
  stripText $Prod[3] ","
  getWord CURRENTLINE $Amount[3] 5
  stripText $Amount[3] ","
  getWord CURRENTLINE $Max[3] 7
  stripText $Max[3] ","
  pause

  :Fighters
  getWord CURRENTLINE $Rate[4] 3
  stripText $Rate[4] ","
  getWord CURRENTLINE $Prod[4] 4
  stripText $Prod[4] ","
  getWord CURRENTLINE $Amount[4] 5
  stripText $Amount[4] ","
  getWord CURRENTLINE $Max[4] 7
  stripText $Max[4] ","

  # calculate if planet is over-full
  setVar $i 1
  :eye

  if ($i <= 3)
    if ($Rate[$i] <> "N/A") and ($Rate[$i] <> "999999")
      if (($Colo[$i] / $Rate[$i]) > ($Prod[$i] + 1))
        setVar $Full[$i] 1
      end
    end

    add $i 1
    goto :eye
  end

  pause

  :CitadelLevel
  getWord CURRENTLINE $CitadelLevel 5
  getWord CURRENTLINE $Treasury 9
  stripText $Treasury ","
  pause

  :BuildTime
  getWordPos CURRENTLINE $pos " under construction, "
  cutText CURRENTLINE $line $pos 999
  getWord $line $BuildTime 3
  pause

  :Defense
  setvar $militaryline currentline
  gettext $militaryline $military "Military reaction=" "%"
  gettext $militaryline $power "QCannon power=" "%"
  gettext $militaryline $acannon "AtmosLvl=" "%"
  gettext $militaryline $scannon "SectLvl=" "%"
  pause
  
  :Tpad
  gettext CURRENTLINE $TPad "TransPort power =" "hops"
  striptext $Tpad " "
  pause
  
  :Shields
  gettext CURRENTLINE $Pshields "= " " "
  pause

  :IG
  getwordpos CURRENTLINE $pos "="
  if ($pos > 0)
  add $pos 2
  cuttext CURRENTLINE $Pig $pos 999
  end
  pause

  :InfoDone
  setdelaytrigger one :one 400
  pause
  :one

  # calculate which category is best for dropping more colonists
  setVar $best 0
  setvar $k 1
  while ($k <= 3)
  if ($Rate[$k] = "N/A")
    setvar $Rate[$k] 999999
  end
  if ($Full[$k] = 1)
    setvar $Rate[$k] 999999
  end
  add $k 1
  end

     if ($Rate[1] <= $Rate[2]) and ($Rate[1] <= $Rate[3])
       setvar $best 1

     elseif ($Rate[2] <= $Rate[1]) and ($Rate[2] <= $Rate[3])
       setvar $best 2

     elseif ($Rate[3] <= $Rate[1]) and ($Rate[3] <= $Rate[2])
       setvar $best 3

     else
       setvar $best 0
     end


  if ($best = 0)
    # no good drop categories, just use the first one
    setVar $DropCategory 1
  else
    setVar $DropCategory $best
  end

 #if ($CitadelLevel > 0)
 #settexttrigger notraders no:traders "There are no other Traders in the Citadel."
 #settextlinetrigger traders_done :traders_done "Citadel treasury"
 #send "cd"
 If ($loop = 1) And ($Amount[1] = 0)
 goto :planetinfo2
 end
 setvar $loop 0
  return
  pause
