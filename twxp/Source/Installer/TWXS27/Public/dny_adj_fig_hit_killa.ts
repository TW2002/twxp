# --------------------------------------------------------------
# Small attack script teaching example I just threw together.
# It doesn't get your current fig count so if it's less than
# max figs you'll fire off some wierd amount. If you move you
# should kill the script since the current sector will fubar.
# - Dnyarri, 5/17/06
# More scripts and info at http://www.navhaz.com
# --------------------------------------------------------------

# Require data recording, not really needed but is useful.
reqRecording

# Check current prompt
getWord CURRENTLINE $prompty 1
if ($prompty <> "Command")
     clientMessage "Must be on the command prompt!"
     halt
end

# Get current max figs
send " c ;q"
waitFor "Max Figs Per Attack:"
getword CURRENTLINE $max_figs 5
stripText $max_figs ","

# Scan current sector and get the sector num
send "dz  n  "
waitfor "Sector  :"
getWord CURRENTLINE $current_sector 3

# Send banner
# send "'Dnyarri's adj fighit killa loaded! Waiting for adj hit!*"
waitFor "Message sent on sub-space channel"

# Set the 2 triggers
:set_triggers
killtrigger hitaftr
killtrigger hitalmp
setTextLineTrigger hitaftr :hitaftr "Deployed Fighters Report Sector"
setTextLineTrigger hitalmp :hitlimp "Limpet mine in "
pause

# A ftr was hit. Kill the triggers. Check for spoof. If all is ok, 
# get the hit sector number and see if it's adj.
:hitaftr
killtrigger hitaftr
killtrigger hitalmp
getWord CURRENTLINE $spooftest 1
if ($spooftest <> "Deployed")
     goto :set_triggers
end
getWord CURRENTLINE $hit_sector 5
stripText $hit_sector ":"
goto :processhit

# Ditto for limpets
:hitlimp
killtrigger hitaftr
killtrigger hitalmp
getWord CURRENTLINE $spooftest 1
if ($spooftest <> "Limpet")
     goto :set_triggers
end
getWord CURRENTLINE $hit_sector 4
goto :processhit

# See if the hit was adj
:processhit
setVar $hit_was_adj FALSE

# Here we loop thru all of the incoming warps and compare.
setVar $idx 1
while ($idx <= SECTOR.WARPINCOUNT[$current_sector])
     if (SECTOR.WARPSIN[$current_sector][$idx] = $hit_sector)
          setVar $hit_was_adj TRUE
     end
     add $idx 1
end

# Comparison was true. Power up. Attack first and 2nd target.
if ($hit_was_adj = TRUE)
     send "   q  q  q  q  z  *  "
     send "   a  y  n  y  q  z  " & $max_figs & "  *  "
     send "   a  y  n  y  q  z  " & $max_figs & "  *  "
     send "   a  y  n  y  q  z  " & $max_figs & "  *  "
     send "   a  n  y  n  y  q  z  " & $max_figs & "  *  "
     send "   a  n  y  n  y  q  z  " & $max_figs & "  *  "
end
goto :set_triggers
