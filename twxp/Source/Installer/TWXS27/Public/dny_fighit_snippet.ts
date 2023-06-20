# ------------------------------------------------------
# When dealing with fighit responses like torps, drops,
# etc, it's important to check for certain conditions.
# Is it an alien? Is it a spoof? Are they retreating?
# Is the sector number really a number and within sector
# bounds? It's important not to trust any text that comes
# from the game. This does add a small amount of time to
# the script processing, but removes almost all spoofing
# opportunities.
# - Dnyarri
# ------------------------------------------------------

:set_triggers
killtrigger fighit
setTextLineTrigger fighit :fighit "Deployed Fighters Report Sector"
pause

# - - - - - - - - - - - - - -

:fighit

# Check for alien hits
getText CURRENTANSILINE $alien_check ": " "'s"
getWordPos $alien_check $apos #27 & "[1;36m" & #27 & "["
if ($apos > 0)
     goto :set_triggers
end

# Check for spoofs
getWord CURRENTLINE $spoof_test 1
getWord CURRENTANSILINE $ansi_spoof_test 1
getWordPos $ansi_spoof_test $ansi_spoof_pos #27 & "[1;33m"
if ($spoof_test <> "Deployed") OR ($ansi_spoof_pos <= 0)
     goto :set_triggers
end

# Check for entry, no sense in acting twice
getWordPos CURRENTLINE $epos "entered sector."
if ($epos < 1)
     goto :set_triggers
end

# Get the sector number
getWord CURRENTLINE $hit_sec 5
stripText $hit_sec ":"
isNumber $result $hit_sec
if ($result < 1)
     goto :set_triggers
end
if ($hit_sec > SECTORS) OR ($hit_sec <= 10)
     goto :set_triggers
end

# Looks good, continue processing!

# [Your code goes here]
