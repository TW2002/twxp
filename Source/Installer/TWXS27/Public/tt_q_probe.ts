# _T_q_probe.ts
# Script Name	: Traitor's Quick Prober
# Author        : Traitor <traitor@tw-cabal.com> 
# Description   : A simple tool to speed up manual pobing
setvar $version "1.0.1 04/20/06"

# see the notes in :outputBlocked and :outputDestroyed for more info
#   on how I use the following arrays in this script.
setarray $$blockedSector SECTORS
setarray $$destroyedSector SECTORS

# Look at the pretty banner.  
gosub :egoBanner

# Echo the instructions.
gosub :instructions

# This is what makes the script a system script.
# You can quit the script any time from the command prompt by
#   pressing e, then q.
systemscript

:start
# This is where I initialize my triggers.  They are always active,
#   and when one of these gets activated, it's reset right away.
#   It's not the traditional way of using triggers, but I find it
#   much easier to manage. Notice how I mostly have pauses at the
#   end of most of my routines, instead of GOTOs. 
settexttrigger probeEnter :probeEnter "Probe entering sector :"
settexttrigger probeDestroy :probeDestroy "Probe Destroyed!"
settexttrigger probeLoaded :probeLoaded "SubSpace Ether Probe loaded"
settexttrigger noProbes :noProbes "You do not have any Ether Probes."
settexttrigger hasProbes :hasProbes "Please enter a "
settexttrigger noRoute :noRoute "Error - No route within"
settexttrigger probeSelfDest :probeSelfDest "Probe Self Destructs"
pause

:probeEnter
# This trigger caps the probes current sector.
# Each time the probe enters a new sector, this trigger is tripped
#   after it's tripped, it resets.
settexttrigger probeEnter :probeEnter "Probe entering sector :"
# I also use some anti-spoofing here.  This anti-spoofing uses ANSI
#   control codes to ensure that the messages aren't spoofed. It 
#   is used all through the script.  It prevents nefarious people
#   from using the coms, beacons, etc... to mess with the script.  
getword CURRENTANSILINE $testSpoof 1
# The #27 is the ASCII character for Esc, so I am using the raw 
#   ANSI codes to check for the validity of the message.
#   If you were to write $testSpoof to a file, you would get 
#   a funny character (that is the #27) followed by [33mProbe.
#   So to check to see if that first word matches, I just use the
#   & to string the Esc char with the [33mProbe.  It's the same 
#   thing really.
if ($testSpoof <> #27 & "[33mProbe")
	pause
end
getword CURRENTLINE $sector 5
pause

:probeDestroy
# This trigger looks for your probe being destroyed.
# This is also where Destroyed probes are tracked.  See the notes
#    in :outputDestroyed for more info.
# If you have probes left, it voids probe destroyed sector and asks if
#   you want to probe your target sector again.
# It also resets itself, and tracks the sector where the probe was
#   destroyed.
settexttrigger probeDestroy :probeDestroy "Probe Destroyed!"
getword CURRENTANSILINE $testSpoof 1
if ($testSpoof <> #27 & "[0m" & #27 & "[1;5;31mProbe")
	pause
end
send "cv" $sector "*q"
waitfor "<Computer deactivated>"
# here is where I set the Probe Destroyed array values.
setvar $destroyedSector[$sector] 1
setvar $destroyedSector[$sector][1] $probeEnd
echo ANSI_10 "**You have " ($probesLeft -1) " probes left.  Probe sector " $probeEnd " again? (y/n)"
getconsoleinput $yn SINGLEKEY
if ($yn = "y")
	if ($probesLeft <> 1)
		setvar $continue 1
		send "e" $probeEnd "*"
	else
		echo ANSI_10 "**No probes left, get more**"
	end
end
pause

:probeLoaded
# This just gets the current number of probes you have left, then
#   resets the trigger
settexttrigger probeLoaded :probeLoaded "SubSpace Ether Probe loaded"
getword CURRENTANSILINE $testSpoof 1
if ($testSpoof <> #27 & "[0m" & #27 & "[32mSubSpace")
	pause
end
getword CURRENTLINE $probesLeft 8
pause

:noProbes
# If you have no probes left, it goes here.
# This is not really needed, but I put it in here as a marker.
settexttrigger noProbes :noProbes "You do not have any Ether Probes."
getword CURRENTANSILINE $testSpoof 1
if ($testSpoof <> #27 & "[0m" & #27 & "[32mYou")
	pause
end
pause

:hasprobes
# If you have probes, it uses the getProbeDestination trigger to grab your
#   probes destination sector.  That is how it knows where you are
#   sending the probe.  I use some ANSI tricks to replace the text
#   you would normally see with text of my own.
# Basically, getProbeDestination is waiting on you to press any key.
# It is also resetting the hasProbes trigger.
settexttrigger hasProbes :hasProbes "Please enter a "
getword CURRENTANSILINE $testSpoof 1
if ($testSpoof <> #27 & "[0m" & #27 & "[35mPlease")
	pause
end
# The $continue variable is set so if you are probing again after a
#   probe has been destroyed, it doesn't do the ANSI text trick on
#   the additional probes.  If this isn't done, it can munch text
#   that you actually want to see because of timing issues.
# In either case, I reset the $continue variable to 0.
if ($continue = 1)
	setvar $continue 0
	pause
else
	# Here is where I move the cursor up 3 lines.
	echo #27 "[3A"
	# This is where I replace the text with my own.
	echo "*" #27 "[99D" #27 "[K" ANSI_10 "Traitor's Quick Prober!  You have " ANSI_11 $probesLeft ANSI_10 " probes left."
	echo "*" #27 "[99D" #27 "[K" ANSI_10 "Press " ANSI_11 "b" ANSI_10 " to review blocked sectors, " ANSI_11 "d" ANSI_10 " for destroyed, or " ANSI_11 "q" ANSI_10 " to exit this script."
	echo "*" #27 "[99D" #27 "[K" ANSI_5 "Please enter a destination for this probe " ANSI_14 ":  "
	setvar $probeDestination ""
	# Any key pressed at this point gets sent to the :getProbeDestination routine.
	settextouttrigger getProbeDestination :getProbeDestination
	setvar $continue 0
	pause
end

:getProbeDestination
# This is where the keystrokes get evaluated.
# First, I grab the keystroke in the output buffer.
getouttext $tempDestination
# Then I check if the output buffer has #13 (which is "enter" on your keyboard)
# If it is #13, then it sets the destination ($probeEnd), and sends the enter.  
# If you just press enter, with no additional text, it aborts the probe launch
#   like normal, and goes back to waiting for you to launch a probe.
if ($tempDestination = #13)
	setvar $probeEnd $probeDestination
	processout $tempDestination
	pause
else
	# Check to see if the key press is a number.
	isnumber $yn $tempDestination
	# If the key is a number, then it does the following.
	if ($yn = 1)
		# If it's a number, it adds it to the $tempDestination variable.
		#   $tempDestination becomes $probeEnd when you press Enter.
		setvar $probeDestination $probeDestination & $tempDestination
		# If the destination sector somehow is larger than the total number of
		#    sectors, then it returns an error and dumps out of the launch probe
		#    sequence.
		if ($probeDestination > SECTORS)
			# The #8 = backspace, #13 = enter.
			send #8 #8 #8 #8 #8 #8 #13
			echo ANSI_12 "*Error generating Probe Destination variable.*Try pressing fewer numbers next time*"
			pause
		end
		# Assuming the keystroke passes all the tests, it gets sent on to the server.
		#   And then I reset the trigger to catch the next keystroke.
		processout $tempDestination
		settextouttrigger getProbeDestination :getProbeDestination
		pause
	else
		# Check to see if they want to check out Blocked sectors.
		#   If they do, then bail out of the etherprobe prompt
		#   and echo the Blocked sectors, then return to waiting.
		if ($tempDestination = "b")
			send #8 #8 #8 #8 #8 #13
			gosub :outputBlocked
			pause
		# Check to see if they want to check out Destroyed sectors.
		#   If they do, then bail out of the etherprobe prompt
		#   and echo the Destroyed sectors, then return to waiting
		elseif ($tempDestination = "d")
			send #8 #8 #8 #8 #8 #13
			gosub :outputDestroyed
			pause
		# Check to see if they want to quit the script.  Since it's
		#   a system script, this is a convienient way to exit it.
		elseif ($tempDestination = "q")
			send #8 #8 #8 #8 #8 #13
			halt		
		# If they type in a backspace, this sends a backspace and
		#    removes the last number added to the $probeDestination
		#    variable.  You can't just add a backspace to the end
		#    of the $tempDestination variable and expect it to
		#    work.  if you do, you get problems.  I.E. if you want
		#    to probe sector 1234, but hit 125 then backspace, then
		#    34, you will get 125#834, which isn't a number.  So, 
		#    you MUST use getlength and cuttext to remove the 5.
		elseif ($tempDestination = #8)
			getlength $probeDestination $length
			cuttext $probeDestination $probeDestination 1 ($length - 1)
			processout $tempDestination
			settextouttrigger getProbeDestination :getProbeDestination
			pause
		# If it's not any of the above, process the key anyway because
		#    there might be other scripts that are looking for certain keys,
		#    but don't add the key to $probeDestination.  I.E. you have a
		#    'panic button' script that stops all scripts, or whatever. By
		#    processing the keystroke, those scripts will still work.
		else
			processout $tempDestination
			settextouttrigger getProbeDestination :getProbeDestination
			pause
		end
	end	
end	

:noRoute
# There was no route to the destination sector.
# Here is where Blocked sectors are created.  See the notes in :outputBlocked
# Also resets the noRoute trigger.
settexttrigger noRoute :noRoute "Error - No route within"
getword CURRENTANSILINE $testSpoof 2
if ($testSpoof <> #27 & "[1;5;31mError" & #27 & "[0m" & #27 & "[32m")
	pause
end
send "n"
echo ANSI_10 "**Could " ANSI_14 "NOT" ANSI_10 " probe sector: " $probeEnd " because of enemy figs!*Sector added to Blocked list!**"
setvar $blockedSector[$probeEnd] 1
pause

:probeSelfDest
# If the probe self destructs, it goes here and then resets the trigger.
# Technically, this isn't needed, but here as a placeholder if I ever
#   decide to take some action if the probe succeeds.
# I also didn't put any anti-spoofing in here, since it doesn't take
#   any action once the trigger is tripped.  
settexttrigger probeSelfDest :probeSelfDest "Probe Self Destructs"
pause

:outputBlocked
# This is where the blocked sectors get sent to the screen.  I use an
#   array to track the blocked sectors.  Each index in the array represents
#   a sector number, and if the value in the index is set to 1, that means
#   it's blocked.  A simple while loop walks through the array, and echos
#   any sectors with a value of 1 in a given index (sector)
setvar $count 1
echo ANSI_10 "**Blocked Sectors:*"
while ($count <= SECTORS)
	if ($blockedSector[$count] = 1)
		echo ANSI_10 $count "*"
	end
	add $count 1
end
echo ANSI_10 "*"
return

:outputDestroyed
# This is where the Probe Destroyed sectors get sent to the screen.  I use an
#   multi-dimensional array to track the sectors.  Each index in the array represents
#   a sector number, and if the value in the index is set to 1, that means
#   it's had a probe destroyed there.  Additinally, I track the destination of
#   the destroyed probe in a sub-index of each index the sub-index is [1].
#   So, if a probe is destroyed in sector 20 trying to get to sector 1111,
#   in the array $destroyedSector, index 20 has a value of 1, representing that
#   sector 20 was a sector that a probe was destroyed in, while the sub-index [1] of
#   index 20 is equal to 1111, or $destroyedSector[20][1] = 1111.
#   The following are the commands that set these variables.
#      setvar $destroyedSector[$sector] 1
#      setvar $destroyedSector[$sector][1] $probeEnd
#   If you don't understand this, go to the following link for more help:
#     http://www.tw-cabal.com/strategy/twxscripthelp.html
# A simple while loop walks through the array, and echos any sectors that had probes
#   get destroyed in them, as well as the destination sector.
setvar $count 1
echo ANSI_10 "**Probe Destroyed Sectors:*"
while ($count <= SECTORS)
	if ($destroyedSector[$count] = 1)
		echo ansi_10 $count " trying to probe sector " $destroyedSector[$count][1] "*"
	end
	add $count 1
end
echo ANSI_10 "*"
return

:instructions
# The instructions.
# A couple of things here.  #42 = *, so that's how I get the ***'s at the beginning
# Also, the send #145 is a special character that tells TWGS to send the current
#   prompt back.  Makes it look a lot cleaner after you run the script.
echo ANSI_9 "**        " #42 #42 #42 ANSI_10 " Traitor's " ANSI_11 "Quick Prober, " ANSI_3 "version: " ANSI_11 $version " " ANSI_9 #42 #42 #42 "**"
echo ANSI_10 "*This is my quick prober.  It simplifies manual probing by automatically"
echo ANSI_10 "*voiding sectors when your probes are destroyed, prompting after voiding"
echo ANSI_10 "*if you want to probe that same sector, tracking blocked sectors, and"
echo ANSI_10 "*tracking sectors where your probes get destroyed.*"
echo ANSI_10 "*This script runs in the background, and I recommend you turn it off if"
echo ANSI_10 "*you are planning on using any other probe script.*"
echo ANSI_10 "*To activate the script, just send a probe, and follow along.  It's fairly"
echo ANSI_10 "*simple.  You can review Probe Destroyed and Blocked sectors at any time"
echo ANSI_10 "*by pressing " ANSI_11 "e" ANSI_10 " and then " ANSI_11 "d" ANSI_10 " or " ANSI_11 "b" ANSI_10 " respectivly.  Blocked sectors are ones that "
echo ANSI_10 "*you never got a probe too, while destroyed are sectors where your probes"
echo ANSI_10 "*were destroyed."
echo ANSI_10 "*"
send #145
return

# My Ego Banner :)  Ooooh....shiny....
# Is the banner not nifty?
# Worship the banner!
:egoBanner
echo ANSI_14 "***"
echo ANSI_14 "                                 /\         *"
echo ANSI_14 "                                /  \        *"
echo ANSI_14 "                               /    \       *"
echo ANSI_14 "                              / ____ \      *"
echo ANSI_14 "                             / /\   \_\     *"
echo ANSI_14 "                            /   " #17 #42 & #16 "-   \    *"
echo ANSI_14 "                           /    " #245 "\_     \   *"
echo ANSI_14 "                          /______________\  *"
echo ANSI_14 "                          www.tw-cabal.com"
return