# ----------------------------------------------------------------------------
# Dnyarri's "Holo killa" version 2.
# Holoscans, goes adj and kills enemy before trying to retreat to safety.
# A bit dangerous, but hey... so is life.
# More scripts and info at http://www.navhaz.com
# ----------------------------------------------------------------------------
# Mod to catch kills at the center sector, too

reqRecording

:init
send "*  "
waitFor "(?="
getword CURRENTLINE $location 1
if ($location <> "Command") AND ($location <> "Citadel")
     clientMessage "This script must be run from the Command or Citadel Prompt"
     halt
end

if ($location = "Citadel")
     send " q dc  "
     waitFor "Planet command (?=help) [D]"
     waitFor "Planet #"
     getWord CURRENTLINE $planetnum 2
     stripText $planetnum "#"
     waitFor "Citadel command (?=help)"
end

send " c ;q"
waitFor "Max Fighters:"
setVar $line CURRENTLINE
replaceText $line ":" " "
getword $line $max_figs 7
stripText $max_figs ","
waitFor "Max Figs Per Attack:"
setVar $line CURRENTLINE
replaceText $line ":" " "
getword $line $max_fig_wave 5
stripText $max_fig_wave ","
if ($max_fig_wave = $max_figs)
     setVar $max_fig_wave ($max_fig_wave - 100)
end
setVar $waves_to_send ($max_figs / $max_fig_wave)

:kill_check
killtrigger noscan1
killtrigger noscan2
killtrigger scanned
setTextLineTrigger noscan1 :noscanner "Handle which mine type, 1 Armid or 2 Limpet"
setTextLineTrigger noscan2 :noscanner "You don't have a long range scanner."
setTextLineTrigger scanned :scandone  "Select (H)olo Scan or (D)ensity Scan or (Q)uit? [D] H"
if ($location = "Citadel")
     send " qqqz* sh*  l " & $planetnum & " * j c * "
else
     send " sh*  "
end
pause

:noscanner
killtrigger noscan1
killtrigger noscan2
killtrigger scanned
clientMessage "You don't have a HoloScanner!"
send " *  "
halt

:scandone
killtrigger noscan1
killtrigger noscan2
killtrigger scanned
waitFor "Warps to Sector(s) :"

:get_prompt
waitFor "Command [TL="
getText CURRENTLINE $current_sector "]:[" "] (?="

:get_current_sector
isNumber $result $current_sector
if ($result < 1)
     send "/"
     setVar $line CURRENTLINE
     replacetext $line #179 " "
     getWord $line $current_sector 2
     goto :get_current_sector
end
if ($current_sector < 1) OR ($current_sector > SECTORS)
     send "/"
     setVar $line CURRENTLINE
     replacetext $line #179 " "
     getWord $line $current_sector 2
     goto :get_current_sector
end

setVar $killsector 0
setVar $idx 1
while ($idx <= SECTOR.WARPCOUNT[$current_sector])
     setVar $test_sector SECTOR.WARPS[$current_sector][$idx]
     if ($test_sector <> STARDOCK) AND ($test_sector > 10) AND (SECTOR.TRADERCOUNT[$test_sector] > 0) AND (SECTOR.PLANETCOUNT[$test_sector] < 1)
          setVar $killsector $test_sector
          goto :killem
     end
     add $idx 1
end

:killem
if ($killsector > 10) AND ($killsector <> STARDOCK)
     # Send SS alert
     send "'Dnyarri's HoloKilla - Attacking sector " & $test_sector & ".*"

     # Build the no string
     setVar $no_str ""
     setVar $no_cnt SECTOR.SHIPCOUNT[$killsector]
     setVar $no_idx 1
     while ($no_idx <= $no_cnt)
          setVar $no_str $no_str & "n"
          add $no_idx 1
     end

     # Clear any avoids.
     send " c v 0 * y n " & $test_sector & " * q "

     # Lift from the planet
     if ($location = "Citadel")
          send " qqqz* "
     end

     # Move there, drop a fig.
     send " m z " & $test_sector & " *  *  z  a  99999  *  z  a  99999  *  R  *  f  z  1  *  z  c  o  *   "

     # Kill em
     setVar $kill_idx 1
     while ($kill_idx <= $waves_to_send)
          send " a " & $no_cnt & " y n y q z " & $max_fig_wave & " * "
          add $kill_idx 1
     end

     # Try to retreat back
     send " DZ N  R  *  <  N  N  *  Z  A  99999  *  "

     # Lift from the planet
     if ($location = "Citadel")
          send " l " & $planetnum & " * n n * j m * * * j c  *  "
     end

     # Kill again?
     # goto :kill_check
else
     if ($location = "Citadel")
          send " s* "
          waitFor "<Scan Sector>"
          waitFor "Citadel command (?=help)"
          clientMessage "No targets found adj!"
          send " *  "
     else
          send " dz * "
          waitFor "<Re-Display>"
          waitFor "Command [TL="
          clientMessage "No targets found adj!"
          send " *  "
     end
     halt
end
halt
