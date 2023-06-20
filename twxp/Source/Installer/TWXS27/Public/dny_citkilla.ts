# -------------------------------------------------------------------
# Dnyarri's CitKilla - v1.1 release.
#
# Thanks to Vid and Parrothead for the real-life testing.
#
# Kills traders in your sector by lifting from the citadel. This can
# be a powerful way to defend your base, but it can also get you
# killed. This script adds in some extra safeties to reduce your risk.
#
# Ships with guardian bonus can be put into the file "gbonus-ships.txt"
# and will not be attacked if there's more than 1 planet in the sector.
# The script will also keep a tally of the figs on the planet and if
# it drops too low to fire another round it will shut off... keeping
# you from using an empty planet. 
#
# It also tries to keep track of your fig wave as you shoot so that if
# it drops too low then it knows that the planet is either low on figs
# or you're in a pod... so it'll halt. Not all edits have pods with 
# low fig waves, however, so this isn't perfect indicator. Also added
# haz tracking. If you get podded the haz will change so we can check
# our shiptype after a haz change and detect if we've been podded.
#
# Script also polls every 20 minutes to check your figwave and planet
# number in case you've changed either ship or planet. Nothing worse
# than getting stuck in sector because you started on another planet.
#
# I've added CN checking so you don't autoflee and abandon your planet.
# I've also added quite a bit of spoof checking to keep people from
# using the most common tricks against you.
#
# The attack burst macro is built and sent all at once to get stuff
# sent within the same packet.
# More scripts and info at http://www.navhaz.com
# -------------------------------------------------------------------

# Check the current prompt.
:promptify
send #145
waitFor #145 & #8
getWord CURRENTLINE $prompt 1
stripText $prompt #145
stripText $prompt #8
if ($prompt <> "Citadel")
     send "'[Dnyarri's Citkilla]: Cannot load from this prompt!*"
     halt
end


# Read the gbonus file.
setVar $gbonus_file "gbonus-ships.txt"
fileExists $exists $gbonus_file
if ($exists = TRUE)
     readtoarray $gbonus_file $read_array
     setVar $gbonus_count 0
     setVar $idx 1
     while ($idx <= $read_array)
          if ($read_array[$idx] <> "") AND ($read_array[$idx] <> 0)
               add $gbonus_count 1
               lowerCase $read_array[$idx]
               setVar $gbonus_types[$gbonus_count] $read_array[$idx]
          end
          add $idx 1
     end
end
send "'[Dnyarri's Citkilla]: " & $gbonus_count & " GBonus shiptypes read.*"


# Init some variables
setArray $lasthaz SECTORS


# Fix CN settings
gosub :fix_cn_settings


# Get current stats.
gosub :do_quickstats
if ($quickstats[TYPE] = "EscPod")
     send "'[Dnyarri's Citkilla]: I'm in a pod! Halting...*"
     halt
end
setVar $mycorp $quickstats[CORP]


# Get starter data.
:get_more_stats
send " c ;q  "
waitFor "Figs Per Attack:"
getWord CURRENTLINE $figwave 5
send "q dm * * *  c  "
waitFor "Planet #"
getWord CURRENTLINE $planet 2
stripText $planet "#"
if ($figwave < 500)
     send "'[Dnyarri's Citkilla]: This ship is too weak! Halting...*"
     halt
end


# Set the status check trigger.
:set_check_trigger
killTrigger checkstatus
setDelayTrigger checkstatus :check_status 1200000
send "'[Dnyarri's Citkilla]: v1.1 - Running from planet #" & $planet & ".*"


# Set the triggers
:set_the_triggers
killTrigger inactivity
killTrigger interdictor
killTrigger quasar_cann
killTrigger warps_into
killTrigger lifts_from
killTrigger powers_up
killTrigger exits_game
killTrigger enters_game
killTrigger materializd
killTrigger planet_left
killTrigger scanned_sec
setTextLineTrigger inactivity  :inactivity   "INACTVITY WARNING:"
setTextLineTrigger interdictor :spoofcheck   "Shipboard Computers The Interdictor Generator on"
setTextLineTrigger quasar_cann :spoofcheck   "Quasar Cannon on"
setTextLineTrigger warps_into  :spoofcheck   "warps into the sector."
setTextLineTrigger lifts_from  :spoofcheck   "lifts off from"
setTextLineTrigger powers_up   :spoofcheck   "is powering up weapons systems!"
setTextLineTrigger exits_game  :spoofcheck   "exits the game."
setTextLineTrigger enters_game :spoofcheck   "enters the game."
setTextLineTrigger materializd :spoofcheck   "has just materialized from the void!"
setTextLineTrigger planet_left :spoofcheck   "is no longer in this sector!"
setTextLineTrigger scanned_sec :scannedsec   "<Scan Sector>"
pause


# Simple inactivity timeout handler
:inactivity
send #27
goto :set_the_triggers


# Every 20 minutes we check our prompt, fig wave and planet number.
# This ensures that if we've swapped ships or planets, or left the
# citadel, we won't get stuck with out-of-date information.
:check_status
send #145
waitFor #145 & #8
getWord CURRENTLINE $prompt 1
stripText $prompt #145
stripText $prompt #8
if ($prompt <> "Citadel")
     send "'[Dnyarri's Citkilla]: I've left the Citadel! Halting...*"
     halt
end
goto :get_more_stats


# Check for spoofs.
:spoofcheck
getWord CURRENTLINE $spooftest 1
if ($spooftest = "R") OR ($spooftest = "P") OR ($spooftest = "F")
     # It's a comms spoof, blah.
     goto :set_the_triggers
end


# Scan the sector.
:scan_sector
send " *  s* "
waitFor "<Scan Sector>"


# Process the sector scan.
:scannedsec
killTrigger inactivity
killTrigger interdictor
killTrigger quasar_cann
killTrigger warps_into
killTrigger lifts_from
killTrigger powers_up
killTrigger exits_game
killTrigger enters_game
killTrigger materializd
killTrigger planet_left
killTrigger scanned_sec
killTrigger update_sector
killTrigger scan_complete
killTrigger prompt_from_scan
setVar $current_sector 0
setVar $scan_completed FALSE
setTextLineTrigger update_sector :update_sector "Sector  :"
setTextLineTrigger scan_complete :scan_complete "Warps to Sector(s) :"
setTextTrigger prompt_from_scan  :prompt_from_scan "Citadel command (?=help)"
pause


# Update the current sector number.
:update_sector
killtrigger update_sector
getWord CURRENTLINE $spooftest 1
if ($spooftest = "R") OR ($spooftest = "P") OR ($spooftest = "F")
     # It's a comms spoof, blah.
     goto :set_the_triggers
end
getWord CURRENTLINE $current_sector 3
pause


# Mark the scan has being complete.
:scan_complete
setVar $scan_completed TRUE
pause


# We're done with the scan.
:prompt_from_scan
if ($scan_completed <> TRUE)
     # The scan display was aborted.
     goto :set_the_triggers
end


# Check to make sure the current sector variable is within bounds.
isNumber $result $current_sector
if ($result < 1)
     goto :scan_sector
end
if ($current_sector < 1) OR ($current_sector > SECTORS)
     goto :scan_sector
end


# Check the navhaz count to look for blown ship debris.
if (SECTOR.NAVHAZ[$current_sector] <> $lasthaz[$current_sector])
     # There's been a change in navhaz. Are we podded?
     setVar $lasthaz[$current_sector] SECTOR.NAVHAZ[$current_sector]
     gosub :do_quickstats
     if ($quickstats[TYPE] = "EscPod")
          send "'[Dnyarri's Citkilla]: I'm in a pod! Halting...*"
          halt
     end
end


# Are there traders in the sector?
if (SECTOR.TRADERCOUNT[$current_sector] <= 0)
     # Nope
     goto :set_the_triggers
end


# Check the trader list for enemies
getSector $current_sector $sec
setVar $target_num 0
setVar $trader_idx 1
while ($trader_idx <= SECTOR.TRADERCOUNT[$current_sector]) 
     setvar $test_target SECTOR.TRADERS[$current_sector][$trader_idx]
  
     # Check trader's corp
     setVar $corp_line $test_target & " " & #172 & #185 & #172
     setVar $word_idx 1
     :get_next_wordy
        # Here we count the number of words in the trader's name.
        getWord $corp_line $wordy $word_idx
        if ($wordy = #172 & #185 & #172)
             # We've found the pad, so back up one.
             subtract $word_idx 1
             if ($word_idx > 0)
                  # This sets the corp test to the last word in their name.
                  getWord $corp_line $corp_check $word_idx
             else
                  # Defaults to "xxx" if something wierd happens.
                  setVar $corp_check "xxx"
             end
             goto :got_corp_num
        end
        add $word_idx 1
     goto :get_next_wordy
     # We've got the corp string, strip the brackets.
     :got_corp_num
     if ($corp_check = "[" & $mycorp & "]")
          # They're on our corp, skip them.
          goto :check_next_trader
     end

     # He/she isn't on our corp so now we check their ship type.
     setVar $target_shiptype $sec.TRADER[$trader_idx].SHIP
     lowerCase $target_shiptype
     setVar $gtest_idx 1
     while ($gtest_idx <= $gbonus_count)
          # Is there a matching gbonus entry?
          getWordPos $target_shiptype $gtest $gbonus_types[$gtest_idx]
          if ($gtest > 0) AND (SECTOR.PLANETCOUNT[$current_sector] > 1)
               # Yes and there's more than 1 planet in the sector.
               # Skip to the next trader!
               goto :check_next_trader
          end
          add $gtest_idx 1
     end

     # Ok, we can target this guy. Get the target number.
     setVar $target_num (SECTOR.SHIPCOUNT[$current_sector] + $trader_idx)
     if (SECTOR.BEACON[$current_sector] <> 0) AND (SECTOR.BEACON[$current_sector] <> "")
          add $target_num 1
     end
     goto :found_a_target

     # Check next trader
     :check_next_trader
     add $trader_idx 1
end
if ($target_num = 0)
     # No targets found
     goto :set_the_triggers
end


# We found a target, let's make the no string.
:found_a_target
setVar $no_count ($target_num - 1)
setVar $no_string ""
setVar $no_idx 1
while ($no_idx <= $no_count)
     setVar $no_string $no_string & " n "
     add $no_idx 1
end


# Make the attack macro... one piece at a time.

# Lift and killfig if needed.
setVar $attack_macro " * q q q q z a " & $figwave & " * "

# Fire 3 waves
setVar $attack_macro $attack_macro & " a " & $no_string & " y n y q z " & $figwave & " * l j " & #8 & #8 & $planet & "* j m *** "
setVar $attack_macro $attack_macro & " q a " & $no_string & " y n y q z " & $figwave & " * l j " & #8 & #8 & $planet & "* j m *** "
setVar $attack_macro $attack_macro & " q a " & $no_string & " y n y q z " & $figwave & " * l j " & #8 & #8 & $planet & "* j m *** "

# Re-enter the citadel.
setVar $attack_macro $attack_macro & " j c * "


# Send the macro burst.
send $attack_macro
waitFor "Command [TL="


# Wait for the results.
setVar $low_figs FALSE
killtrigger planet_figs
killtrigger attack_wave
killtrigger at_citadel
setTextLineTrigger planet_figs :planet_figs "Fighters on this planet."
setTextLineTrigger attack_wave :attack_wave "How many fighters do you wish to use"
setTextTrigger     at_citadel  :at_citadel  "Citadel command (?=help)"
pause


# Keep track of the attack wave.
:attack_wave
# Check for spoofing -- _[35mHow many fighters do you wish to use
getWord CURRENTLINE $spoof_test 1
getWord CURRENTANSILINE $ansi_spoof_test 1
getWordPos $ansi_spoof_test $ansi_spoof_pos #27 & "[35m"
if ($spoof_test = "How") AND ($ansi_spoof_pos > 0)
     getWord CURRENTLINE $ship_fig_count 11
     isNumber $result $ship_fig_count
     if ($result > 0)
          if ($ship_fig_count < 500)
               setVar $low_figs TRUE
          end
     end
end
killtrigger attack_wave
setTextLineTrigger attack_wave :attack_wave "How many fighters do you wish to use"
pause


# Keep a rolling count of the figs.
:planet_figs
# Check for spoofing -- _[33mThere are currently
getWord CURRENTLINE $spoof_test 1
getWord CURRENTANSILINE $ansi_spoof_test 1
getWordPos $ansi_spoof_test $ansi_spoof_pos #27 & "[33m"
if ($spoof_test = "There") AND ($ansi_spoof_pos > 0)
     getWord CURRENTLINE $planet_fig_count 4
     isNumber $result $planet_fig_count
     if ($result > 0)
          if ($planet_fig_count < $figwave)
               setVar $low_figs TRUE
          end
     end
end
killtrigger planet_figs
setTextLineTrigger planet_figs :planet_figs "Fighters on this planet."
pause


# Reached the citadel?
:at_citadel
# Check for spoofing -- _[35mCitadel
getWord CURRENTLINE $spoof_test 1
getWord CURRENTANSILINE $ansi_spoof_test 1
getWordPos $ansi_spoof_test $ansi_spoof_pos #27 & "[35m"
if ($spoof_test <> "Citadel") OR ($ansi_spoof_pos < 1)
     # Dirty spoofers.
     killtrigger at_citadel
     setTextTrigger at_citadel :at_citadel "Citadel command (?=help)"
end


# Not a spoof, we've fired a set.
killtrigger planet_figs
killtrigger attack_wave
killtrigger at_citadel
if ($low_figs = TRUE)
     send "'[Dnyarri's Citkilla]: Houston, we have a problem! Halting...*"
     halt
else
     # Fired a round and still have figs. Scan again.
     goto :scan_sector
end


# -------------------------------------------------------------------
halt
# -------------------------------------------------------------------

# Subroutines below...

# -------------------------------------------------------------------
# Simple CN settings fixer. Don't want to autoflee while running
# citkilla now do we? =)
# -------------------------------------------------------------------

:fix_cn_settings
   setVar $cn_str ""
   send "cn"
   waitFor "(9) Abort display on keys"
   getWord CURRENTLINE $abort 7
   if ($abort <> "SPACE")
        setVar $cn_str $cn_str & "9"
   end
   waitFor "(A) Message Display Mode"
   getWord CURRENTLINE $msgmode 6
   if ($msgmode <> "Compact")
        setVar $cn_str $cn_str & "A"
   end
   waitFor "(C) Online Auto Flee"
   getWord CURRENTLINE $autoflee 6
   if ($autoflee <> "Off")
        setVar $cn_str $cn_str & "C"
   end
   waitFor "Settings command (?=Help)"
   send $cn_str & "qq"
   return


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
