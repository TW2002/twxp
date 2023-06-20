# ---------------------------------------------------------
# Dnyarri's really simple callsaveme planet gridder.
# I trust you're smart enough to scan before you go.
# Make sure you have a planet scanner or you'll land
# on other planets as you grid around.
# More scripts and info at http://www.navhaz.com
# ---------------------------------------------------------

# Check the current prompt
getWord CURRENTLINE $prompt 1
if ($prompt <> "Citadel")
     clientMessage "Run this from the Citadel Prompt!"
     halt
end

# Banner
send "'Dnyarri's Simple PGridder - Activating!*"

# Get fig wave
send "  c  ;q  "
waitOn "Max Figs Per Attack:"
getWord CURRENTLINE $maxFigAttack 5

# Set lurk trigger
:lurk
killTrigger hotkey
echo ANSI_15 & "**Press the - key to pgrid.*"
send #145
setTextOutTrigger hotkey :scan_the_sector "-"
pause

# Get the current sector and record it's doors
:scan_the_sector
send " s*  "
waitFor "<Scan Sector>"
waitFor "Sector  :"
setVar $line CURRENTLINE
replacetext $line ":" " "
getWord $line $current_sector 2
waitFor "Warps to Sector(s) :"
waitFor "Citadel command (?=help)"

# Show the doors menu
:display_menu
killTrigger hotkey
echo "*"
setVar $warps_out SECTOR.WARPCOUNT[$current_sector]
setVar $idx 1
while ($idx <= $warps_out)
      echo ANSI_11 & $idx & ANSI_8 " - " & ANSI_12 & SECTOR.WARPS[$current_sector][$idx] & "*"
      add $idx 1
end
echo ANSI_14 & "Door " & ANSI_9 & "(Q=quit)" & ANSI_15 & "? "
getConsoleInput $chosen_option SINGLEKEY
upperCase $chosen_option

if ($chosen_option = "Q") OR ($chosen_option = "X")
     send " *  "
     halt
else
     isNumber $result $chosen_option
     if ($result > 0)
          if ($chosen_option >= 1) AND ($chosen_option <= $warps_out)
               setVar $sector SECTOR.WARPS[$current_sector][$chosen_option]
               goto :go_for_it
          else
               goto :lurk
          end
     else
          goto :lurk
     end
end

# -----------------------------------------------
:go_for_it
# -----------------------------------------------

# Call saveme
setVar $land_count 0
send "'" & $sector & "=saveme*"
waitFor "Message sent on sub-space channel"

# Clear the avoid - Add 1 lag cycle to the saveme call.
send "c v 0 * y n " & $sector & " * q "
waitFor "has been cleared and will be used in future plots."
waitFor "Citadel command (?=help)"

# Refig - Add another lag cycle jIc
send " q dj m * * * /"
waitFor "Planet #"
getWord CURRENTLINE $planet 2
stripText $planet "#"
waitFor #179
waitFor "Planet command (?=help) [D]"

# Move
send "q m z " & $sector & " * n n * z a " & $maxFigAttack & " * z a " & $maxFigAttack & " * f z 1 * z c d r * "

# Land loop
:land_now
killtrigger at_planet
killtrigger no_planet
setTextTrigger at_planet :at_planet "Planet command (?=help)"
setTextTrigger no_planet :no_planet "Average Interval Lag:"
setVar $land_idx 1
while ($land_idx <= 10)
     send "L J " & #8 & #8 & $planet & " * * "
     add $land_idx 1
end
send "@"
pause

# Where's the planet?
:no_planet
killtrigger at_planet
killtrigger no_planet
add $land_count 1
send " Z A 99999 * Z A 99999 * f z 1 * z c d * /"
waitFor #179
setVar $line CURRENTLINE
replacetext $line #179 " "
getWord $line $current_sector 2
send "'Help!! The saveme planet is no where to be found!!*"
send "'" & $current_sector & "=saveme*"
send "'pickup " & $current_sector & " ::*"
if ($land_count >= 3)
     send " < R N N * Z A 99999 * "
     send "'No saveme found! Couldn't land. Help me!*"
     goto :lurk
else
     goto :land_now
end

# We reached the planet, kill the other trigger
:at_planet
killtrigger at_planet
killtrigger no_planet
send "'Landed safely.*"
send " j m * * * c "
waitFor "Citadel command (?=help)"
goto :lurk

# ---------------------------------------------------------
