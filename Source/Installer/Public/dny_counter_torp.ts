# ------------------------------------------------------------------
# Dnyarri's counter-torper. Ender wrote one a while back, it never
# worked... and the idea is useful in some situations. Only real
# problem is the fact that once torped, you can't holoscan. So you
# can only try to guess from a density scan. Means it's easy to 
# miss, and even easier to spoof. Still, kindof useful in games 
# where people aren't too bright or early on before people start 
# putting larger fig lays out and about.
# More scripts and info at http://www.navhaz.com
# ------------------------------------------------------------------

# Send warning banner
send "'Dnyarri's Counter-Torp is now active!*"

:set_da_trigger
killtrigger gothit
setTextLineTrigger gothit :gothit "launched a P-Missile in sector"
pause

:gothit
# jIc
killtrigger gothit

# Spoof test
getWord CURRENTLINE $test 1
cutText CURRENTLINE $test2 1 1
if ($test = "F") or ($test = "R") or ($test = "P") or ($test = ">") or ($test = "S:") or ($test2 = "`") or ($test2 = "'") or ($test2 = "=")
     goto :set_da_trigger
end

# Are we on a planet?
setVar $planet 0
waitFor "(?="
getWord CURRENTLINE $prompty 1
if ($prompty = "Command")
     send " sdz n "
elseif ($prompty = "Planet")
     send "d"
     waitFor "Planet #"
     getWord CURRENTLINE $planet 2
     stripText $planet "#"
     send " q sdz n l " & $planet & " * "
elseif ($prompty = "Citadel")
     send " q d"
     waitFor "Planet #"
     getWord CURRENTLINE $planet 2
     stripText $planet "#"
     send " q sdz n l " & $planet & " * j c * "
else
     echo ANSI_12 & "*Cannot Counter-Torp from this prompt!*"
     send "/"
     halt
end

# Process scan
setTextLineTrigger noscan :noscanner "You don't have a long range scanner."
waitFor "Relative Density Scan"

:get_prompt
waitFor "Command [TL="
goto :check_adjs

:noscanner
killtrigger noscan
echo ANSI_12 & "*Cannot Counter-Torp without a Density Scanner!*"
send "/"
halt

:check_adjs
killtrigger noscan
getText CURRENTLINE $current_sector "]:[" "] (?="
isNumber $result $current_sector
if ($result < 1)
     send " *  "
     goto :get_prompt
end
if ($current_sector < 1) OR ($current_sector > SECTORS)
     send " *  "
     goto :get_prompt
end

:torp_check
setVar $hitsec 0
setVar $maxdensity 0
setVar $idx 1
while ($idx <= SECTOR.WARPCOUNT[$current_sector])
     setVar $test_sector SECTOR.WARPS[$current_sector][$idx]
     if ($test_sector <> STARDOCK) AND ($test_sector > 10)
          setVar $dens SECTOR.DENSITY[$test_sector]
          if ($dens >= 500)
               subtract $dens 500
          end
          if ($dens >= 100)
               subtract $dens 100
          end
          if ($dens > $maxdensity) AND ($dens > 0)
               setVar $maxdensity $dens
               setVar $hitsec $test_sector
          end
     end
     add $idx 1
end

if ($hitsec > 0)
     killtrigger no_torp
     killtrigger fired
     killtrigger nofire
     killtrigger no_fed
     killtrigger no_safe
     killtrigger no_mult
     setTextLineTrigger no_torp :notorps "You do not have any Photon Missiles!"
     setTextLineTrigger fired   :fired   "Photon Wave Duration"
     setTextLineTrigger nofire  :didnt   "That is not an adjacent sector"
     setTextLineTrigger no_fed  :nofed   "The Feds do not permit Photon Torpedos to be launched into FedSpace"
     setTextLineTrigger no_safe :nofed   "The Feds do not permit protected players to launch Photon Missiles"
     setTextLineTrigger no_mult :singles "The missile tubes will overheat, Captain!  We better wait awhile."
     if ($prompty = "Citadel")
          send " c py " & $hitsec & "**q"
     else
          send " q q q z * c py " & $hitsec & "**q"
          if ($planet > 0)
               send " l " & $planet & " * "
          end
     end
     pause

     :notorps
     killtrigger no_torp
     killtrigger fired
     killtrigger nofire
     killtrigger no_fed
     killtrigger no_safe
     killtrigger no_mult
     echo ANSI_12 & "*Cannot Counter-Torp without Torps!*"
     send "/"
     halt
     
     :fired
     killtrigger no_torp
     killtrigger fired
     killtrigger nofire
     killtrigger no_fed
     killtrigger no_safe
     killtrigger no_mult
     echo ANSI_12 & "*Torp fired into " & $hitsec & "!*"
     send "/"
     goto :set_da_trigger

     :didnt
     killtrigger no_torp
     killtrigger fired
     killtrigger nofire
     killtrigger no_fed
     killtrigger no_safe
     killtrigger no_mult
     echo ANSI_12 & "*Couldn't fire into target sector?!?*"
     send "/"
     goto :set_da_trigger

     :nofed
     killtrigger no_torp
     killtrigger fired
     killtrigger nofire
     killtrigger no_fed
     killtrigger no_safe
     killtrigger no_mult
     echo ANSI_12 & "*Cannot fire into or from FedSpace!*"
     send "/"
     goto :set_da_trigger

     :singles
     killtrigger no_torp
     killtrigger fired
     killtrigger nofire
     killtrigger no_fed
     killtrigger no_safe
     killtrigger no_mult
     echo ANSI_12 & "*You've fired too recently to fire again so soon!*"
     send "/"
     goto :set_da_trigger
else
     echo ANSI_12 & "*No effective target sector found!*"
     send "/"
     goto :set_da_trigger
end
halt
