# ---------------------------------------------------------
# Dnyarri's quick figs - A fig refresh that works from
# several prompts, turns off ansi and writes the data in
# both a CK figfile and as sector parms. This requires TWX
# 2.04 to work correctly but will be required for my public
# scripts in the near future.
# More scripts and info at http://www.navhaz.com
# ---------------------------------------------------------

# Get the current prompt
send " *  "
:get_prompt
waitFor "(?="
getWord CURRENTLINE $prompt 1

# Handle various acceptible prompts, switch ANSI off.
if ($prompt = "Citadel")
   gosub :ansi_off
   send " q d"
   waitFor "Planet #"
   getWord CURRENTLINE $planet 2
   stripText $planet "#"
   send " q "
elseif ($prompt = "Planet")
   send " d"
   waitFor "Planet #"
   getWord CURRENTLINE $planet 2
   stripText $planet "#"
   send " q "
   gosub :ansi_off
elseif ($prompt = "Command")
   gosub :ansi_off
elseif ($prompt = "Computer")
   send " q "
   goto :get_prompt
else
   clientMessage "Can't run from this prompt!"
   halt
end

# Send banner
send "'Dnyarri's Quick Figs - Refreshing figs, please wait...*"

# Init some vars and stuff
setPrecision 0
setVar   $fcnt 0
setArray $figs SECTORS

# Send the G command
send "G"
waitFor "Deployed  Fighter  Scan"
waitFor "======================================"

# Set the initial line trigger.
killtrigger line_trigger
killtrigger command_pmpt
setTextTrigger command_pmpt :finished_list "Command [TL="
setTextLineTrigger line_trigger :read_line ""
pause

# Processing the line
:read_line

# Does it have the word "Total" in it?
getWordPos CURRENTLINE $pos "Total"
if ($pos > 0)
   goto :reset_trigger
end

# Read the first word
getWord CURRENTLINE $first_word 1

# Are we at the command prompt?
if ($first_word = "Command")
   goto :finished_list
end

# Is it a number?
isNumber $result $first_word
if ($result < 1)
   goto :reset_trigger
end

# Is it out of bounds?
if ($first_word < 1) OR ($first_word > SECTORS)
   goto :reset_trigger
end

# Nope, looks like a valid fig!
add $fcnt 1
setVar $figs[$first_word] TRUE

# Reset the trigger
:reset_trigger
killtrigger line_trigger
setTextLineTrigger line_trigger :read_line ""
pause

# Done w/ list. Summarize everything
:finished_list

# Kill the triggers
killtrigger line_trigger
killtrigger command_pmpt

# Land if possible, switch ANSI back on
if ($prompt = "Citadel")
   send "L J " & #8 & #8 & $planet & " * * j c * "
   waitFor "Citadel command (?=help)"
   gosub :ansi_on
elseif ($prompt = "Planet")
   gosub :ansi_on
   send "L J " & #8 & #8 & $planet & " * * "
   waitFor "Planet command (?=help)"
else
   gosub :ansi_on   
end

# Record the data
:record_the_data

# Notify the user
echo ANSI_9 & "**One moment, recording data...**"

# Prep the CK figfile
setVar $figfile "_ck_" & GAMENAME & ".figs"
delete $figfile

# Init the ftr string
setVar $ftr_str ""

# Loop thru the fig array
setVar $idx 1
while ($idx <= SECTORS)
   # Use a space or no?
   if ($idx = 1)
      setVar $pad ""
   else
      setVar $pad " "
   end

   # Do the data thing
   if ($figs[$idx] = TRUE)
      setSectorParameter $idx "FIGSEC" TRUE
      setVar $ftr_str $ftr_str & $pad & $idx
   else
      setSectorParameter $idx "FIGSEC" FALSE
      setVar $ftr_str $ftr_str & $pad & "0"
   end

   # Inc the idx
   add $idx 1
end

# Write the ck fig file
write $figfile $ftr_str

# Do the math
setPrecision 2
setVar $percent (($fcnt * 100) / (SECTORS - 11))
setPrecision 0

# Send final banner
send "'Dnyarri's Quick Figs - " & $fcnt & " sectors figged (" & $percent & "%).*"

# And we're done!
halt

# ---------------------------------------------------------
# I like to seperate my subroutines like this. It makes it
# easier to read them later.
# ---------------------------------------------------------

:ansi_off
   send " c n"
   waitFor "(1) ANSI graphics"
   getWord CURRENTLINE $ansi 5
   if ($ansi = "On")
      setVar $toggled TRUE
      send "1 q q"
   else
      setVar $toggled FALSE
      send "q q"
   end
   waitFor "<Computer deactivated>"
   echo ANSI_12 & "...*"
return

:ansi_on
   if ($toggled = TRUE)
        send " c n 1 q q"
        waitFor "<Computer deactivated>"
   end
return

# ---------------------------------------------------------
