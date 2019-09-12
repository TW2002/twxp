# ------------------------------------------------------------------
# Dnyarri's quicklogs. Pulls the logs for the current date quickly,
# answers pauses, etc. Good for looking up torp shots and stuff.
#
# Re-documented for the group
# More scripts and info at http://www.navhaz.com
# ------------------------------------------------------------------

# We're going to check the current prompt
send "*  "
waitFor "(?="
getword CURRENTLINE $location 1
# We got the location from the first word in the line.
# Is that location word command or citadel? If it isn't,
# halt the script.
if ($location <> "Command") AND ($location <> "Citadel")
        clientMessage "This script must be run from the Command or Citadel Prompt"
        halt
end

# We don't need to kill these triggers since they won't be 
# started, but I do kill them just in case I use this code 
# later somewhere else... I don't want those being a problem.
killtrigger pause_trig
killtrigger prompt_trg

# When you type "cd" from either the command or the cit prompt
# you are sent to the daily log prompt.
send "cd"

# Wait for the line of text that gives us the current date
waitFor "Enter the beginning date you wish to read from."

# Get the current date
getWord CURRENTLINE $the_date 12

# We're setting 2 triggers, one to handle pause and the other to
# handle the final computer command prompt.
setTextTrigger prompt_trg :atprmpt "Computer command"
setTextTrigger pause_trig :pauseit "[Pause]"

# Waiting for the actual date prompt
waitFor "Input search date :"

# Send the date string we just got
send $the_date & "*Y"

# Wait for the logs to begin
waitFor "-=-=-=-=-=-=-=-=-=-"
pause

# Earlier we set a trigger for the computer prompt. That trigger
# just got triggered, so we know that we're now at the computer
# prompt. We'll send Q, wait for the computer deactived message and
# then send an enter to get the command prompt to pop back up.
:atprmpt
send "q"
waitFor "<Computer deactivated>"
send "*  "
halt

# This is the pause handler area. We've just got hit with a pause.
:pauseit

# Kill it before we set it, we don't usually need to do that but
# it does keep us from getting confused on triggers later (see above).
killtrigger pause_trig

# We recreate the trigger so on the next pause it'll fire again.
setTextTrigger pause_trig :pauseit "[Pause]"

# Send enter to answer the pause prompt.
send "*"

# Wait for the next trigger to fire.
pause
