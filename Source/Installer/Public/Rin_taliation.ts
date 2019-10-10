# Rin-taliation script for attacking people who might catch
# you while you are afk. It is great in unlim games
# if you are cashing afk, especially if your would-be enemy
# has a ship with high offensive odds and lower defensive odds.
# WARNING: This script will NOT work right in FedSpace. There is a built
# in safety so you won't get splatted by Zyrain or his friends, but don't blame me
# if you ignore this warning. :)
# The script will run until it is terminated by the user or you are out of fighters when attacking.
# It can be initialized from any prompt, but will need to get to the command prompt. So,
# it will do it for you. :) Be ready for it, so don't do it somewhere that will get you killed
# such as StarDock. :)
# Version 1.01
# Open source because, well, I like to help people. :-)
# Revision information:
# 1.01 	added an IF statement to the MAIN part of the script so that an an enemy won't be able
#	to fool the script be sending a message over FedCom, SubSpace, or privately.



# Get to the command prompt!
send "QQQQQn"
send "'*Rin-taliation retaliation script, version 1.01 by Rincrast, now active.*Someone is in for a rude surprise if they attack me!**"
send "'*Remember, if one of my corp mates is in the same sector I am in if I am under attack, the script won't work right!**"

# Initialize necessary triggers
setTextLineTrigger needfigs :getNumfigs "Fighters       :"
setTextLineTrigger needwave :getWave "Max Figs Per Attack:"
setTextLineTrigger noBeacon :beacon "Beacon  :"
setTextLineTrigger noClausewitz :federal "Attack Fleet Admiral Clausewitz"
setTextLineTrigger noCorpie :corpie "SAFETY OVERRIDE ENGAGED!"
setTextLineTrigger noAttack :noattack "There is nothing here to attack."
setTextLineTrigger coward :enemyRetreated "warps out of the sector."
setTextLineTrigger destroyed :destroyedEnemy "For defeating this"
setTextLineTrigger oops :oops "<Set NavPoint>"
setTextLineTrigger yesZyrain :federal "Attack Captain Zyrain"
setTextLineTrigger yesNelson :federal "Attack Admiral Nelson"
setTextLineTrigger yesClausewitz :federal "Attack Fleet Admiral Clausewitz"
send "cn"
waitFor "(9) Abort display on keys    -"
getWord CURRENTLINE $abortKey 7
	if ($abortKey = "ALL")
		send "9"
	end
send "QQ"
send "i"
send "c;"
#send "n9"
send "QQQQn"
pause

# The script needs to know the number of fighters you have on your ship
:getNumFigs
	getWord CURRENTLINE $myFigs 3
	stripText $myFigs ","
	killTrigger needfigs
	pause

# Now the script needs to know how many fighters it can send
:getWave
	getWord CURRENTLINE $myWave 5
	killTrigger needwave
	goto :main

# Kill the marker beacon in the sector
:beacon
	if ($underAttack = 1)
		setVar $beacon 1
	else
		goto :main
	end

# YIKES! There is a FEDERAL in this sector -- maybe more than one!
:federal
	if ($underAttack = 1)
		setVar $federal 1
		goto :getReady
	else
		goto :main
	end

# Silly person -- the trader you attacked is a member of your corporation.
:corpie
	if ($underAttack = 1)
		send "'*I cannot and will not attack teamates, so KNOCK IT OFF! <G>* Please disregard my comment about being under attack.**"
	end
	goto :main

# Your enemy warped out of the sector -- coward! :)
:enemyRetreated
	if ($underAttack = 1)
		send "'*Hey, the person attacking me turned tail and ran! Hurry up and get me out of here!* Otherwise there won't be much left of me soon....**"
	end
	goto :main

# Nothing to attack?
:noAttack
	if ($underAttack = 1)
		send "'Odd, there is nothing here to attack.... This is suspicious...*"
	end
	goto :main	

# I destroyed his/her ship!
:destroyedEnemy
	send "'*WOW!! I destroyed his/her ship!* I'm probably still interdicted, so if you can help, great. Otherwise . . .**"
	goto :main

# In case there was a Federal but nothing else to attack
:oops
	if ($underAttack = 1)
		send "*"
		send "*"
		send "*"
		goto :main
	else
		goto :main
	end

# Main waiting prompt for script.
:main
	setVar $underAttack 0
	setVar $beacon 0
	setVar $federal 0
	gosub :reinitTriggers
	send "'Waiting for someone to attack . . . .*"
	waitFor "is powering up weapons systems!"
	getWord CURRENTLINE $realAttack 1
	if ($realAttack <> "F") AND ($realAttack <> "R") AND ($realAttack <> "P")
		setVar $underAttack 1
		send "'*I'm under attack!*If someone can find a way to get me out of here, now would be a good time!**"
	else
		send "'*Someone is sending false attack messages, trying to fool*the script. I am likely going to be attacked soon.**"
		goto :main
	end

# Send the attack command
:attackNow
	send "D"
	waitFor "Warps to Sector(s) :"
	send "A"
	
# Placeholder for safety triggers, like beacons and federals
:getReady
	if ($beacon = 1)
		send "Y"
		setVar $beacon 0
		setVar $myFigs ($myFigs - 1)
		if ($myFigs < $myWave)
			setVar $myWave $myFigs
		end
	end
	if ($federal = 1)
		send "*"
		waitFor "No"
		setVar $federal 0
	end
	gosub :reinitTriggers

# Counter-attack part of script
:retaliation
	send "'Preparing to fire!*"
	waitFor "Preparing to fire!"
	if ($federal = 0)
		send "'Firing weapons!*"
		send "y"
		waitFor "How many fighters do you wish to use"
		send  $myWave "*"
		waitFor "You lost"
		getWord CURRENTLINE $myFigs 5
		stripText $myFigs ","
		if ($myFigs < $myWave)
			setVar $myWave $myFigs
			goto :attackNow
		elseif ($myFigs = 0)
			send "'*ARGH! I'm out of fighters!! I'm doomed! Good-bye, cruel universe!**"
			halt
		else
			waitFor "Command [TL="
			goto :attackNow
		end
	else
		goto :getReady
	end

# Come here to get your triggers!!
:reinitTriggers
	killAllTriggers
	setTextLineTrigger noBeacon :beacon "Beacon  :"
	setTextLineTrigger noCorpie :corpie "SAFETY OVERRIDE ENGAGED!"
	setTextLineTrigger noAttack :noattack "There is nothing here to attack."
	setTextLineTrigger coward :enemyRetreated "warps out of the sector."
	setTextLineTrigger destroyed :destroyedEnemy "For defeating this"
	setTextLineTrigger oops :oops "<Set NavPoint>"
	setTextLineTrigger yesZyrain :federal "Attack Captain Zyrain"
	setTextLineTrigger yesNelson :federal "Attack Admiral Nelson"
	setTextLineTrigger yesClausewitz :federal "Attack Fleet Admiral Clausewitz"

return

# Variable Descriptions
# myFigs = The current number of fighters you have
# myWave = the maximum number of fighters your ship can send in one attack.
# underAttack = boolean operator
#	    0 = I'm not currently under attack
#	    1 = I am currently under attack
# abortKey = what keys abort text display
# beacon = boolean operator
#	    0 = no beacon
#	    1 = beacon present
# federal = boolean operator
#	    0 = no federal
#	    1 = federal present
# realAttack = first word from the line when the attack message appears; used to weed out FedCom, SS, or private messages rather than genuine attacks