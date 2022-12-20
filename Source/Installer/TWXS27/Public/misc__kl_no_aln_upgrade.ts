#
# Karl's 0 alignment gain port upgrading script
# v 0.1
# 
# You want XP but no alignment change?  Here's a solution.
#
#

# Check fuel max
goSub :check_fuel_max

# Check organics max
goSub :check_org_max

# Check equipment max
goSub :check_equ_max


# process fuel request
echo "**How many units of fuel ore?  (max: " $fuel_max "):  "
getConsoleInput $units
isNumber $numTest $units
if ($numTest = 0)
  echo "*Invalid Input*"
  halt
end
if ($units > $fuel_max)
  echo "*User input > " $fuel_max "*"
  halt
end
setVar $mod_x $units
setVar $mod_n 10
goSub :sp_mod
setVar $ore_cycles $mod_div
#echo "cycles = " $ore_cycles "*"
setVar $ore_leftovers ($ore_cycles * $mod_n)
#echo "*" $ore_cycles " x " $mod_n " = " $ore_leftovers "*"
setVar $ore_leftovers $mod_r
#echo "*" $units " - " $ore_leftovers " = " $ore_leftovers "*"


# process org request
echo "*How many units of organics?  (max: " $org_max "):  "
getConsoleInput $units
isNumber $numTest $units
if ($numTest = 0)
  echo "*Invalid Input*"
  halt
end
# need to recheck org_max, in case player is short on cash
goSub :check_org_max
if ($units > $org_max)
  echo "*User input > " $org_max "*"
  halt
end
setVar $mod_x $units
setVar $mod_n 5
goSub :sp_mod
setVar $org_cycles $mod_div
setVar $org_leftovers ($org_cycles * $mod_n)
setVar $org_leftovers $mod_r

echo "*How many units of equipment?  (max: " $equ_max "):  "
getConsoleInput $units
isNumber $numTest $units
if ($numTest = 0)
  echo "*Invalid Input*"
  halt
end
# need to recheck equ_max, in case player is short on cash
goSub :check_equ_max
if ($units > $equ_max)
  echo "*User input > " $equ_max "*"
  halt
end
setVar $mod_x $units
setVar $mod_n 4
goSub :sp_mod
setVar $equ_cycles $mod_div
setVar $equ_leftovers ($equ_cycles * $mod_n)
setVar $equ_leftovers $mod_r

# echo "*" $ore_cycles ", " $ore_leftovers
# echo "*" $org_cycles ", " $org_leftovers
# echo "*" $equ_cycles ", " $equ_leftovers "*"

send "o"

setVar $i 1
while ($i <= $ore_cycles)
  send " 110*"
  add $i 1
end 
if ($ore_leftovers <> 0)
  send " 1" $ore_leftovers "*"
end

setVar $i 1
while ($i <= $org_cycles)
  send " 25*"
  add $i 1
end
if ($org_leftovers <> 0)
  send " 2" $org_leftovers "*" 
end

setVar $i 1
while ($i <= $equ_cycles) 
  send " 34*"
  add $i 1
end
if ($equ_leftovers <> 0)
  send " 3" $equ_leftovers "*"
end

send "*"



halt
:sp_mod
  # mod_x mod mod_n = mod_r
  setVar $mod_div  ($mod_x / $mod_n)
  # echo "*" $mod_x " / " $mod_n " = " $mod_div 

  setVar $mod_sub  ($mod_n * $mod_div)
  # echo "*" $mod_n " x " $mod_div " = " $mod_sub 

  setVar $mod_r  ($mod_x - $mod_sub)
  # echo "*" $mod_x " - " $mod_sub " = " $mod_r "***"

return

:check_fuel_max
  send "o 1*"
  killTrigger o_1
  setTextLineTrigger o_1 :o_1 "How many units do you want to invest?"
  pause
  :o_1
  getWord CURRENTLINE $fuel_max 9
  stripText $fuel_max "("
  waitFor "Command [TL="
return

:check_org_max
  send "o 2*"
  setTextLineTrigger o_2 :o_2 "How many units do you want to invest?"
  pause
  :o_2
  getWord CURRENTLINE $org_max 9
  stripText $org_max "("
  waitFor "Command [TL="
return

:check_equ_max
  send "o 3*"
  setTextLineTrigger o_3 :o_3 "How many units do you want to invest?"
  pause
  :o_3
  getWord CURRENTLINE $equ_max 9
  stripText $equ_max "("
  waitFor "Command [TL="
return
