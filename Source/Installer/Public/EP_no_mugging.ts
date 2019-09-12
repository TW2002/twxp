# Script Name	: No_Mugging.ts
#		: aka Traitor's "I'm a moron at SD" script
# Author        : Inspired by Traitor, mostly written by Elder Prophet
#               :   Comments by Traitor.
# Description   : A simple tool to protect you from hitting the wrong key while at 
#               :   Stardock and getting mugged.
# Version       : 1.0  03/15/05
# What it does	: This script checks to see when you have ported at the Stardock.
#		:   Once at dock, it prevents you from hitting a key that would
#		:   get you mugged.  Gives you a friendly reminder when a key is
#		:   pressed that would result in you losing 1/2 your cash.  It
#		:   runs in the background as a system script, and can be loaded
#		:   while you are offline.  If you have SWATH, you probably don't
#		:   need this, but for those of us (Traitor) that only use ZOC and
#		:   TWX, it's a real cashsaver.  
# Limitations &	: This script has a few limitations:
# Warnings	:   If you are bursting, or typing really fast, it probably
#		:     won't catch a mistake in time to save you. i.e. bad planet 
#               :     busting macros will still get you mugged.  
#               :   It's for general day to day protection only.
#		:   The script needs to be loaded BEFORE you land at dock.
#		:   It uses ANSI codes for spoof protection, so you must have
#		:     ANSI turned ON.
#		:   If you are running a furb script or a planet busting
#               :     script, you might want to stop this one, as it might cause
#               :     later conflicts if they are going too fast for it to keep up.
#               :   We have tried to test for every possibility, but some things
#               :     you may try are so stupid, not even Traitor could think them
#               :     up.  Use at your own risk.

# This is a system script, so $sx won't terminate it.
systemscript

# ====[ Create Safe Keys Array ]====
# This sets up a simple array that contains all the keys you can press at the
# <StarDock> prompt that won't cause you to get mugged.
# Creates the array, $GoodKeys, which looks like this:
# $GoodKeys[1] = c
# $GoodKeys[2] = C
# $GoodKeys[3] = g
# $GoodKeys[4] = G
# etc...
setVar $GoodKeys "c C g G h H l L p P s S t T u U ? ! q Q ' ` = # @ / | ^ \"
setVar $i 1
while ($i < 30)
	getWord $goodKeys $goodKeys[$i] $i
	add $i 1
end

# ====[ Waiting for the player to Port at SD ]====
# this is where the script spends most of it's time, waiting for the player 
# to land at dock.  When it sees the "Landing on Federation Stardock." it goes
# into action.
:wait2port
killTrigger checkkey
settextlinetrigger portAtDock :portatdock "Landing on Federation StarDock."
pause

# ====[ Spoof Check ]====
# Here is where we check to see if the player is really landing at dock, or
#   if someone is trying to spoof it via hails or ship names or whatever.
#   The message "Landing on Federation Stardock." is ALWAYS sent whenever
#   you land on dock, and it's ALWAYS white text on a blue background.
#   Our spoof protection reads in the ANSI codes to verify that the first 
#   word is Landing, and it's the right color.
:portAtDock
# here is where it grabs the first word.  Using CURRENTANSILINE to grab
#   the ANSI codes too.
getword CURRENTANSILINE $spoofcheck1 1
# here is where it does the actual compare.  Note the ANSI codes in there.
#   We used & to string multiple codes together.  The <> means "not equal"
if ($spoofcheck1 <> #27 & "[0m" & #27 & "[1;44mLanding")
	echo ANSI_10 "**Spoof Attempt Detected Against No_Mugger.ts!**" ANSI_7
	goto :wait2port
else
# If the message checks out ok, it goes to :checkKey, where it will stay
#   until it sees you return to the Command prompt, i.e. you leave SD.
#   At which time it returns to :wait2port, waiting for you to dock at 
#   StarDock again.  (That's what the 2nd trigger on the line after does.
#   It stays active waiting for you to leave dock.)
	settextouttrigger checkkey :checkKey
	setTextTrigger command :wait2port "Command [TL="
	pause
end

# ====[ checkKey ]====
# This section grabs any input from the user, and compares it to the array $GoodKeys.
#   If the keystroke isn't in the array, it's discarded, if it is in the array, it's
#   processed normally.
:checkKey
# This grabs your current prompt.  i.e. Command, Stardock, Computer, etc...
#   It dumps the first word on the current line into the variable $sdprompt
getWord CURRENTLINE $sdprompt 1
# This is where the the outgoing text is captured.  The outgoing keystroke is put in
#   the variable $keycode
getOutText $keycode
# This verifies that you are at the <StarDock> prompt.  If you aren't at that prompt,
#   then it processes your keystroke normally.
if ($sdprompt = "<StarDock>")
# This takes the $keycode varaiable and compares it to the array, $GoodKeys, looking
#   for a match.  We create a 2nd variable, called $keystroke that holds the value of
#   $keycode.  We create a 2nd variable because we're going to be modifying it, and 
#   we want to preserve the original value in $keycode for later.
	setVar $keystroke $keycode
	setVar $i 1
# Here, we attempt to remove all the "good keys" from the variable $keystroke by 
#   striptexting out everything in the $GoodKeys array.
	while ($i < 30)
		stripText $keystroke $goodkeys[$i]
		add $i 1
	end
# If there is noting left in $keystroke, then we know it was a "good key", so we can
#   go ahead and send the text, $keycode.
	if ($keystroke = "")
		processOut $keycode
	else
# If there is ANYTHING left in $keystroke, then we know that it's not on the "good key"
#   list, and therefore we don't want to send it.   We give you a nice little echo to 
#   show you how this script just saved you 1/2 your hard earned creds.
		echo ANSI_12 "*Heh, Saved you 1/2 your credits... now watch it!*" ANSI_7
	end
else
# If the prompt isn't <StarDock>, like you're at one of the sub-menus, then it's
#   probably safe to allow the keystroke.  Here is where that happens.
	processOut $keycode
end
# Now that it's finished processing your keystroke, it returns to waiting for you to 
#   press another key.  When it detects a key, it goes to :checKey, and the process
#   starts all over again.
settextouttrigger checkkey :checkKey 
pause