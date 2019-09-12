# ---------------------------------------------------------
# Dnyarri's quick pwarp foton. Uses sector parms and macros
# the torp process. About as fast as you're going to get
# while still catching errors. Commented for easy reading.
# More scripts and info at http://www.navhaz.com
# ---------------------------------------------------------

# Check prompt
send " *  "
waitFor "(?="
getWord CURRENTLINE $prompt 1
if ($prompt <> "Citadel")
     send "'[Dnyarri's Quick Foton]: This needs to run from the Citadel Prompt!*"
     halt
end

# Do stats
gosub :do_quickstats

# Get initial sector, check for torps.
setVar $return_sector $quickstats[SECT]
setVar $photon_count  $quickstats[PHOT]

# Do we have torps?
if ($photon_count <= 0)
     send "'[Dnyarri's Quick Foton]: You need photons for this to run!*"
     halt
end

# SS banner
send "'Dnyarri's Quick Foton ACTIVATED!*"

# Display sector
send " s*  "

# - - - - - - - - - - - - - - - - - - -

# Wait for fig and limp hits, kill any hanging triggers.
:set_triggers
killtrigger hitlmp
killtrigger hitftr
killtrigger no_torp
killtrigger fired
killtrigger nofire
killtrigger no_fed
killtrigger no_safe
killtrigger no_mult
setTextLineTrigger hitlmp :limpet_hit "Limpet mine in "
setTextLineTrigger hitftr :fightr_hit "Deployed Fighters Report Sector "
pause

# - - - - - - - - - - - - - - - - - - -

# Got a limpet hit?
:limpet_hit
killtrigger hitlmp
killtrigger hitftr

# Check for spoofs
getWord CURRENTLINE $spoof_test 1
getWord CURRENTANSILINE $ansi_spoof_test 1
getWordPos $ansi_spoof_test $ansi_spoof_pos #27 & "[32m"
if ($spoof_test <> "Limpet") OR ($ansi_spoof_pos <= 0)
     goto :set_triggers
end

# Get the sector number
getWord CURRENTLINE $hit_sec 4
isNumber $result $hit_sec
if ($result < 1)
     goto :set_triggers
end
if ($hit_sec > SECTORS) OR ($hit_sec <= 10)
     goto :set_triggers
end

# Don't torp our return sector, we shouldn't pwarp out.
if ($hit_sec = $return_sector)
      goto :set_triggers
end

# Find the adjacent fig
goto :get_adjacent

# - - - - - - - - - - - - - - - - - - -

# Got a fighter hit?
:fightr_hit
killtrigger hitlmp
killtrigger hitftr

# Check for spoofs
getWord CURRENTLINE $spoof_test 1
getWord CURRENTANSILINE $ansi_spoof_test 1
getWordPos $ansi_spoof_test $ansi_spoof_pos #27 & "[1;33m"
if ($spoof_test <> "Deployed") OR ($ansi_spoof_pos <= 0)
     goto :set_triggers
end

# Torp only on sector entry
getWordPos CURRENTLINE $pos "entered sector."
if ($pos < 1)
     goto :set_triggers
end

# Check for alien hits
getText CURRENTANSILINE $alien_check ": " "'s"
getWordPos $alien_check $pos #27 & "[1;36m" & #27 & "["
if ($pos > 0)
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

# Don't torp our return sector, we shouldn't pwarp out.
if ($hit_sec = $return_sector)
      goto :set_triggers
end

# Set the parm
setSectorParameter $hit_sec "FIGSEC" FALSE

# We're good to go!

# - - - - - - - - - - - - - - - - - - -

# We've got a valid hit! Find the adjacent.
:get_adjacent

# First, is the hit adjacent to our return sector?
setVar $hit_is_adj FALSE
setVar $idx 1
while ($idx <= SECTOR.WARPCOUNT[$return_sector])
     if (SECTOR.WARPS[$return_sector][$idx] = $hit_sec)
          setVar $hit_is_adj TRUE
     end
     add $idx 1
end

# No? Ok, let's find an adjacent fig!
if ($hit_is_adj = FALSE)
     # We're going to loop thru all adjacents
     setVar $adj_fig 0
     setVar $idx SECTOR.WARPCOUNT[$hit_sec]
     while ($idx > 0)
          # Got an adj sector
          setVar $test_sector SECTOR.WARPS[$hit_sec][$idx]

          # Look up the parm, check for data corruption
          getSectorParameter $test_sector "FIGSEC" $figged
          isNumber $result $figged
          if ($result < 1)
               setVar $figged 0
          end

          # It's figged!
          if ($figged > 0)
               setVar $adj_fig $test_sector
               goto :fire_foton
          end

          # It isn't figged, check the next adjacent.
          subtract $idx 1
     end
end

# - - - - - - - - - - - - - - - - - - -

# Fire!!!
:fire_foton

# Set the foton triggers
killtrigger no_torp
killtrigger fired
killtrigger nofire
killtrigger no_fed
killtrigger no_safe
killtrigger no_mult
setTextLineTrigger no_torp :adj_notorps "You do not have any Photon Missiles!"
setTextLineTrigger fired   :adj_fired   "Photon Wave Duration"
setTextLineTrigger nofire  :adj_didnt   "That is not an adjacent sector"
setTextLineTrigger no_fed  :adj_nofed   "The Feds do not permit Photon Torpedos to be launched into FedSpace"
setTextLineTrigger no_safe :adj_nofed   "The Feds do not permit protected players to launch Photon Missiles"
setTextLineTrigger no_mult :adj_singles "The missile tubes will overheat, Captain!  We better wait awhile."

# Was the hit adjacent?
if ($hit_is_adj = TRUE)
     send " c p y " & $hit_sec & "* * q "
else
     # Hit was not adj to return sector.
     if ($adj_fig > 10)
          send " p " & $adj_fig & " * y c p y " & $hit_sec & "* * q p " & $return_sector & " * y "
     else
          # We didn't find a fig. Reset the triggers.
          goto :set_triggers
     end
end
pause

# No torps
:adj_notorps
killtrigger no_torp
killtrigger fired
killtrigger nofire
killtrigger no_fed
killtrigger no_safe
killtrigger no_mult
send "'[Dnyarri's Quick Foton]: We're out of torps! Shutting down...*"
halt

# Didn't fire
:adj_didnt
killtrigger no_torp
killtrigger fired
killtrigger nofire
killtrigger no_fed
killtrigger no_safe
killtrigger no_mult
goto :set_triggers

# Wierd fedspace error, wtf?
:adj_nofed
killtrigger no_torp
killtrigger fired
killtrigger nofire
killtrigger no_fed
killtrigger no_safe
killtrigger no_mult
goto :set_triggers

# No multiples and we're still waiting for the wave to end.
:adj_singles
killtrigger no_torp
killtrigger fired
killtrigger nofire
killtrigger no_fed
killtrigger no_safe
killtrigger no_mult
waitFor "Photon Wave Duration has ended in sector"
goto :set_triggers

# We fired!
:adj_fired
killtrigger no_torp
killtrigger fired
killtrigger nofire
killtrigger no_fed
killtrigger no_safe
killtrigger no_mult

# Send SS message
send "'[Dnyarri's Quick Foton]: Fired foton -> " & $hit_sec & "*"

# Check the torp count
subtract $photon_count 1
if ($photon_count <= 0)
     send "'[Dnyarri's Quick Foton]: We're out of torps! Shutting down...*"
     halt
end

# Wait for the wave to end
waitFor "Photon Wave Duration has ended in sector"

# Send update message on SS
send "'[Dnyarri's Quick Foton]: Tubes ready! " & $photon_count & " shots left.*"

# Reset the triggers
goto :set_triggers

# -------------------------------------------------------------------
halt
# -------------------------------------------------------------------

# Subroutines below...

# -------------------------------------------------------------------
# Quickstats routine by Dnyarri. A simple way to parse the slash stats
# into something useful.
# -------------------------------------------------------------------

:do_quickstats
     killtrigger statlinetrig
     setVar $stats ""
     setTextLineTrigger statlinetrig :statsline #179
     send "/"
pause

:statsline
     killtrigger statlinetrig
     setVar $line CURRENTLINE
     replacetext $line #179 " "
     striptext $line ","
     setVar $stats $stats & $line
     getWordPos $line $pos "Ship"
     if ($pos > 0)
          goto :gotStats
     else
          setTextLineTrigger statlinetrig :statsline
     end
pause

:gotStats
     setVar $quickstats[SECT] 0
     setVar $quickstats[TURNS] 0
     setVar $quickstats[CREDS] 0
     setVar $quickstats[FIGS] 0
     setVar $quickstats[SHLDS] 0
     setVar $quickstats[HLDS] 0
     setVar $quickstats[ORE] 0
     setVar $quickstats[ORG] 0
     setVar $quickstats[EQU] 0
     setVar $quickstats[COL] 0
     setVar $quickstats[PHOT] 0
     setVar $quickstats[ARMD] 0
     setVar $quickstats[LMPT] 0
     setVar $quickstats[GTORP] 0
     setVar $quickstats[TWARP] 0
     setVar $quickstats[CLKS] 0
     setVar $quickstats[BEACNS] 0
     setVar $quickstats[ATMDT] 0
     setVar $quickstats[CRBO] 0
     setVar $quickstats[EPRB] 0
     setVar $quickstats[MDIS] 0
     setVar $quickstats[PSPRB] "NO"
     setVar $quickstats[PLSCN] "NO"
     setVar $quickstats[LRS] "NONE"
     setVar $quickstats[ALN] 0
     setVar $quickstats[EXP] 0
     setVar $quickstats[CORP] 0
     setVar $quickstats[SHIP] 0
     setVar $quickstats[TYPE] 0
     setVar $stats $stats & " @@@"
     upperCase $stats
     setVar $current_word 0
     setVar $wordy ""
     while ($wordy <> "@@@")
          if ($wordy = "SECT")
               getWord $stats $quickstats[SECT]   ($current_word + 1)
          elseif ($wordy = "TURNS")
               getWord $stats $quickstats[TURNS]  ($current_word + 1)
          elseif ($wordy = "CREDS")
               getWord $stats $quickstats[CREDS]  ($current_word + 1)
          elseif ($wordy = "FIGS")
               getWord $stats $quickstats[FIGS]   ($current_word + 1)
          elseif ($wordy = "SHLDS")
               getWord $stats $quickstats[SHLDS]  ($current_word + 1)
          elseif ($wordy = "HLDS")
               getWord $stats $quickstats[HLDS]   ($current_word + 1)
          elseif ($wordy = "ORE")
               getWord $stats $quickstats[ORE]    ($current_word + 1)
          elseif ($wordy = "ORG")
               getWord $stats $quickstats[ORG]    ($current_word + 1)
          elseif ($wordy = "EQU")
               getWord $stats $quickstats[EQU]    ($current_word + 1)
          elseif ($wordy = "COL")
               getWord $stats $quickstats[COL]    ($current_word + 1)
          elseif ($wordy = "PHOT")
               getWord $stats $quickstats[PHOT]   ($current_word + 1)
          elseif ($wordy = "ARMD")
               getWord $stats $quickstats[ARMD]   ($current_word + 1)
          elseif ($wordy = "LMPT")
               getWord $stats $quickstats[LMPT]   ($current_word + 1)
          elseif ($wordy = "GTORP")
               getWord $stats $quickstats[GTORP]  ($current_word + 1)
          elseif ($wordy = "TWARP")
               getWord $stats $quickstats[TWARP]  ($current_word + 1)
          elseif ($wordy = "CLKS")
               getWord $stats $quickstats[CLKS]   ($current_word + 1)
          elseif ($wordy = "BEACNS")
               getWord $stats $quickstats[BEACNS] ($current_word + 1)
          elseif ($wordy = "ATMDT")
               getWord $stats $quickstats[ATMDT]  ($current_word + 1)
          elseif ($wordy = "CRBO")
               getWord $stats $quickstats[CRBO]   ($current_word + 1)
          elseif ($wordy = "EPRB")
               getWord $stats $quickstats[EPRB]   ($current_word + 1)
          elseif ($wordy = "MDIS")
               getWord $stats $quickstats[MDIS]   ($current_word + 1)
          elseif ($wordy = "PSPRB")
               getWord $stats $quickstats[PSPRB]  ($current_word + 1)
          elseif ($wordy = "PLSCN")
               getWord $stats $quickstats[PLSCN]  ($current_word + 1)
          elseif ($wordy = "LRS")
               getWord $stats $quickstats[LRS]    ($current_word + 1)
          elseif ($wordy = "ALN")
               getWord $stats $quickstats[ALN]    ($current_word + 1)
          elseif ($wordy = "EXP")
               getWord $stats $quickstats[EXP]    ($current_word + 1)
          elseif ($wordy = "CORP")
               getWord $stats $quickstats[CORP]   ($current_word + 1)
          elseif ($wordy = "SHIP")
               getWord $stats $quickstats[SHIP]   ($current_word + 1)
               getWord $stats $quickstats[TYPE]   ($current_word + 2)
          end
          add $current_word 1
          getWord $stats $wordy $current_word
     end
return

# -------------------------------------------------------------------
