# ---------------------------------------------------------------
# Easy gridder by Dnyarri.
#
# Script that helps to automate the casual gridding process.
# Kills figs if it hits them, lays figs as it goes, can dscan,
# can auto-answer no to ewarp to keep you from warping out,
# can automatically callsaveme on various bad things.
#
# It's fast enough to avoid getting directly pdropped, probably,
# but can still get you torped if you hit hostile figs. Still,
# useful if you just keep forgetting to dscan or fig as you go.
#
# More scripts and info at http://www.navhaz.com
# ---------------------------------------------------------------
reqRecording
# systemScript
# ---------------------------------------------------------------

send " *  "
waitFor "(?="
getWord CURRENTLINE $location 1
if ($location <> "Command")
     echo "*This must be ran from the Command prompt!*"
     halt
end

# ---------------------------------------------------------------

loadVar $dny_eg_figamt
loadVar $dny_eg_figmsh
loadVar $dny_eg_f_wave
loadVar $dny_eg_adscan
loadVar $dny_eg_newarp
loadVar $dny_eg_saveme
isNumber $num $dny_eg_figamt
if ($num < 1)
     setVar $dny_eg_figamt 1
end
if ($dny_eg_figmsh <> "Toll") AND ($dny_eg_figmsh <> "Offensive")
     setVar $dny_eg_figmsh "Defensive"
end
if ($dny_eg_figamt < 1)
     setVar $dny_eg_figamt 1
end
isNumber $num $dny_eg_f_wave
if ($num < 1)
     setVar $dny_eg_f_wave 99999
end
if ($dny_eg_f_wave < 1)
     setVar $dny_eg_f_wave 99999
end
if ($dny_eg_adscan <> "No")
     setVar $dny_eg_adscan "Yes"
end
if ($dny_eg_newarp <> "No")
     setVar $dny_eg_newarp "Yes"
end
if ($dny_eg_saveme <> "No")
     setVar $dny_eg_saveme "Yes"
end

# ---------------------------------------------------------------

:menu
echo #27 & "[2J*"
echo ANSI_13 & "------------ " & ANSI_12 & "Dnyarri's Easy Gridder" & ANSI_13 & " ------------*"
echo ANSI_11 & "F." & ANSI_9 & " Figs to Drop: " & ANSI_14 & $dny_eg_figamt & "*"
echo ANSI_11 & "M." & ANSI_9 & " Fig Mission:  " & ANSI_14 & $dny_eg_figmsh & "*"
echo ANSI_11 & "W." & ANSI_9 & " Fig Wave:     " & ANSI_14 & $dny_eg_f_wave & "*"
echo "*"
echo ANSI_11 & "D." & ANSI_9 & " Auto DScan:   " & ANSI_14 & $dny_eg_adscan & "*"
echo ANSI_11 & "E." & ANSI_9 & " EWarp Safety: " & ANSI_14 & $dny_eg_newarp & "*"
echo ANSI_11 & "S." & ANSI_9 & " CallSaveme:   " & ANSI_14 & $dny_eg_saveme & "*"
echo "*"
echo ANSI_11 & "G" & ANSI_9 & "o.*"
echo ANSI_11 & "Q" & ANSI_9 & "uit.*"
echo ANSI_13 & "-----------------------------------------------*"
echo ANSI_11 & "Your choice?"
getConsoleInput $choice singlekey
upperCase $choice
if ($choice = "F")
     getInput $test "How many figs to drop per sector (0 disables)? "
     isNumber $result $test
     if ($result < 1)
          goto :menu
     end
     if ($test < 0)
          goto :menu
     end
     setVar $dny_eg_figamt $test
     saveVar $dny_eg_figamt
     goto :menu
elseif ($choice = "M")
     if ($dny_eg_figmsh = "Toll")
          setVar $dny_eg_figmsh "Offensive"
     elseif ($dny_eg_figmsh = "Offensive")
          setVar $dny_eg_figmsh "Defensive"
     else
          setVar $dny_eg_figmsh "Toll"
     end
     saveVar $dny_eg_figmsh
     goto :menu
elseif ($choice = "W")
     getInput $test "How many figs to attack with? "
     isNumber $result $test
     if ($result < 1)
          goto :menu
     end
     if ($test < 1)
          goto :menu
     end
     setVar $dny_eg_f_wave $test
     saveVar $dny_eg_f_wave
     goto :menu
elseif ($choice = "D")
     if ($dny_eg_adscan = "Yes")
          setVar $dny_eg_adscan "No"
     else
          setVar $dny_eg_adscan "Yes"
     end
     saveVar $dny_eg_adscan
     goto :menu
elseif ($choice = "E")
     if ($dny_eg_newarp = "Yes")
          setVar $dny_eg_newarp "No"
     else
          setVar $dny_eg_newarp "Yes"
     end
     saveVar $dny_eg_newarp
     goto :menu
elseif ($choice = "S")
     if ($dny_eg_saveme = "Yes")
          setVar $dny_eg_saveme "No"
     else
          setVar $dny_eg_saveme "Yes"
     end
     saveVar $dny_eg_saveme
     goto :menu
elseif ($choice = "G") OR ($choice = "R")
     goto :start_er_up
elseif ($choice = "Q")
     send " *  "
     halt
end
goto :menu

# -------------------------------------------------------------------
:start_er_up
# -------------------------------------------------------------------

# Banner
send "'Dnyarri's Easy Gridder - Activated!*"

:wait_for_move
killalltriggers
setTextLineTrigger move_1 :moved "To which Sector ["
setTextLineTrigger move_2 :moved "Warping to Sector"
if ($dny_eg_newarp = "Yes")
     setTextTrigger ewarp1 :ewarp "Stop in this sector"
end
if ($dny_eg_saveme = "Yes")
     setTextTrigger saveme_1 :saveme "launched a P-Missile in sector"
     setTextTrigger saveme_2 :saveme "Your ship was hit by a Photon and has been disabled."
     setTextTrigger saveme_3 :saveme "You attempt to retreat but are held fast by an Interdictor Generator."
     setTextTrigger saveme_4 :saveme "An Interdictor Generator in this sector holds you fast!"
     setTextTrigger saveme_5 :saveme "The Quasar Cannon on"
     setTextTrigger saveme_6 :saveme "is powering up weapons systems!"
end
pause

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

:moved
killtrigger move_1
killtrigger move_2
setVar $new_sector 0

# Check for spoofs
getWord CURRENTLINE $test 1
if ($test <> "To") AND ($test <> "Warping")
     goto :wait_for_move
end

# Move started
killTrigger commdp
killTrigger minesp
killTrigger fightp
killTrigger avoidp
setTextTrigger commdp :commdp "Command [TL="
setTextTrigger minesp :minesp "Do you wish to Avoid this sector in the future? (Y/N)"
setTextTrigger fightp :fightp "Option? (A,D,I"
setTextTrigger avoidp :avoidp "Do you really want to warp there? (Y/N)"
pause

:avoidp
send " N N * "
pause

:minesp
send " N N * "
pause

:fightp
send " Z A " & $dny_eg_f_wave & " * Z A " & $dny_eg_f_wave & " * R * "
pause

:commdp
killTrigger commdp
killTrigger minesp
killTrigger fightp
killTrigger avoidp

# Get the current sector number
:get_the_current_sector
getText CURRENTLINE $this_sector "]:[" "] (?="
isNumber $num $this_sector
if ($num < 1)
     send " *  "
     waitFor "Command [TL="
     goto :get_the_current_sector
end
if ($this_sector < 1) OR ($this_sector > SECTORS)
     send " *  "
     waitFor "Command [TL="
     goto :get_the_current_sector
end

# We've moved, drop any figs and scan
setVar $macro ""

# Lay any figs
if ($dny_eg_figamt > 0) AND ($this_sector <> STARDOCK) AND ($this_sector > 10)
     if ($dny_eg_figmsh = "Toll")
          setVar $macro $macro & " f z " & $dny_eg_figamt & " * z c t * "
     elseif ($dny_eg_figmsh = "Offensive")
          setVar $macro $macro & " f z " & $dny_eg_figamt & " * z c o * "
     else
          setVar $macro $macro & " f z " & $dny_eg_figamt & " * z c d * "
     end
end

# DScan
if ($dny_eg_adscan = "Yes")
     setVar $macro $macro & "sz*"
end

# Send the macro
send $macro

# Wait for the command prompt
waitFor "Command [TL="

# Reset the triggers
goto :wait_for_move

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

# Handle ewarp prompts
:ewarp
getWord CURRENTLINE $test 1
if ($test = "Stop")
     send " Y * Z A " & $dny_eg_f_wave & " * < N N * R * "
end
goto :wait_for_move

# Handle saveme requests
:saveme
getWord CURRENTLINE $test 1
if ($test <> "R") AND ($test <> "F") AND ($test <> "P")
     send " N N * Z A 99999 * Q Q Q Q Z A 99999 * R * "
     waitFor "Command [TL="
     stop _ck_callsaveme
     stop _ck_callsaveme
     load _ck_callsaveme
     halt
end
goto :wait_for_move

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
