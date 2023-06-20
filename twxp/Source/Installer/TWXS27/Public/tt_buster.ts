# Script Name	: Traitor's Safer Planet Busting Script
#		: _0_0_T_Buster.ts
#		:   
# Author        : Traitor  traitor@tw-cabal.com
#               : 
# Description   : A script for reds to use for planet busting for exp.  It's 
#               :   safer than most I've seen out there, and mostly idiot proof.
#		: It has tons of features.  Read below for detail
#		:   
# Script Version: 1.7  06/28/05
#		: fixed the "bust the first planet on the list" exploit that nobody
#		:   bothered to tell me about.
#		: added support for transwarp ships (only if extra planets at dock,
#		:   and only if people are messing with you.  prevens you from 
#		:   flying off if you have twarp on your bust ship
#		: silences messages to help prevent spoofing.  will unsilence them
#		:   when it needs messages.  Will unsilence when finished, or when
#		:   the script halts (assuming you don't manually stop it)
#		: busts extra planets at dock in random order now. helps stop exploits
#		: Added checks to ensure that people aren't screwing around with 
#		:   planet names in an attempt to spoof certain triggers.
#		:   
# TWX Version	: Designed and tested with twx 2.03 final.  Prior or later versions
#		:   of TWX may or may not work with this script.
#		:
# Bug Reporting	: Please send any bugs to e-mail: traitor@tw-cabal.com
#		: Please include a description of what went wrong, and a screen cap
#		:   or text log if possible.  Line numbers much appreciated!
#		:   
# Features	: This script is a planet busting script for reds to use to gain
#		:   exp quickly.  It must be run while you are at StarDock.
#		:   If your alignment is less than 199, and you have at least
#		:   enough cash to do 1 cycle (a cycle in this case is 1 gtorp/adet)
#		:   it will load and run.  
#		: It checks to see if you have a planet scanner (it will work with one,
#		:   but it will cost more turns, and be more dangerous)
#		: It checks to see if you are on a corp
#		: It turns off auto-flee, so if you get pinged, you still land on dock.
#		:   (if you want that turned back on, you have to do that manually) 
#		: It checks for Animation, and will offer to macro turn it off.
#		: It checks for CN9 to be space.  If it's all, it will offer to macro
#		:   change it to space.  Will ask if you want it changed back when done.
#		: It checks your bank status, and will use your bank for funds if you
#		:   want it too.
#		: It asks if you have a corpie who can x-fer you funds via your bank.
#		:   when busting this way, it tries to keep your cash at 0, so if you
#		:   do get podded, you aren't out all your startup cash.
#		:   IT IS UP TO YOUR CORPIE TO X-FER CASH.  This script will wait till
#		:   there is enough transfered into your bank to resume.
#		: It silences messages to help prevent spoofing.  If you have
#		:   a corpie feeding you cash, it turns on messages while it's waiting
#		:   for cash.
#		: It checks your alignment, and if it's between 199 and 1, it will offer
#		:   to fix it at the underground and set a new PW.
#		: It asks for your target exp (how much you want to end up with) and 
#		:   will bust till you reach your target exp, or run out of cash.
#		:   (If your corpie stops giving you cash you may have to stop it 
#		:    yourself)
#		: It has 3 operational modes:
#		:   Safe mode, 1 planet at a time, docking after each one.
#		:   2fer mode, 2 planets at a time, docking after 2.
#		:     (checks to see if ship only holds 1 of each, if so, runs safe mode)
#		:   Max mode, as many as the ship can hold at a time, docking after it
#		:     runs out of supplies.
#		: It has an option to insert a random delay after each docking, to try
#		:   to throw off attack macros.
#		: It builds the macros on the fly, for the mode you are in.
#		: If it detects that someone spawned a planet over dock, it will
#		:   launch a new planet, and grab all the planet numbers, then
#		:   macro bust them down to zero planets at dock, then it will
#		:   resume it's previous mode.  If someone is going crazy popping
#		:   planets, you use more turns, but I look at it like free money.
#		:   NOTE: if you have a planet scanner, it will end up in this mode
#		:     which is not desireable, as it wastes turns!
#		:   NOTE: It now busts the extra planets in random order to help
#		:     prevent people from messing with you at dock.
#		: If someone busts a planet that it's looking for, it will macro get
#		:   the planet numbers again.

# Limitations &	: This script has a few limitations:
# Warnings	:   The script must be loaded while at the <StarDock> prompt
#		:   You must be a member of a Corp for these to work.  If you
#		:     don't want to be in a corp, just create a temp one while
#		:     you are busting up.  Or change the macros.  I'm too lazy.
#		:   Your alignment needs to be 199 or less to run this.
#		:   This script may get you killed, especially in max bust mode!
#		:     It can only MINIMIZE your chances of getting killed at dock.
#		:     USE AT YOUR OWN RISK!
#		:   In big games or tournaments, I highly recommend you use either
#		:     the Safe Mode or the 2fer Mode.  There is some delay between
#		:     busting your first and second planet.  It's much more likely
#		:     you will get podded if you bust more than 2 at a time.
#		:     Busting 1 at a time (safe mode) with random delays is about as
#		:     safe as you are going to get.
#		:   If you have a corpie willing to x-fer funds to your bank, I
#		:     HIGHLY recommend that you start with ZERO credits on your
#		:     person, a full bank, and let the script prompt your corpie
#		:     for when you need more credits.  It will ONLY pull out
#		:     as much as it needs from your bank.  If you do it this way
#		:     and you get podded or #SD#, the enemy won't get any cash 
#		:     from taking you out.
#               :   I have tried to test for every possibility, but some things
#               :     you may try are so stupid, not even I could think them
#               :     up.  Again, USE AT YOUR OWN RISK!
#		:   If two or more people are using this script at the same time, 
#		:     BAD THINGS can happen.  I advise you to either wait, turn
#		:     on delays and cross your fingers, or go for it and see what
#		:     happens.  Did I mention USE AT YOUR OWN RISK?
#		:   If the script gets interuppted, or it halts because of an error,
#		:     it won't reset your CN9 settings back to ALL.  Just keep that
#		:     in mind when using this script.
#		:   If you abort the script manually, remember to check the status 
#		:     of your messages, they may still be silenced!

#		: 
# TO DO LIST	: Add better checks to see if you got podded!  Right now, if you get
#		:   podded, it may or may not catch it.  Will need further testing.
#		: 
# The Macros:	: macro #1: "q  u  y  n  .*cl  *  z  d  y  p  s "
# if you want	: if you see: Invalid registry number, landing aborted., macro #2
# to do this    : to get the planet number(s)
# by hand.	: macro #2 "q  u  y  n  .*cl*  z  d  y  p  s "
#		: once you have number, use macro 3 (note the hardcoded planet number,
# these won't	:   in this case, 4.  You will want to change that to match the real 
# work if you 	:   planet number...
# don't belong	: macro #3 "q  l  4*  n  z  n  d  y  *  p  s "
# to a corp!	: if you see : That planet is not in this sector. then you know 
#		:   someone created your planet number someplace else, then spawned 
#		:   an additional planet at dock.  Or they blew it up.
#		:   Run macro #2 and get the new number. Maybe insult them over fed :P
#		: These macros are designed for hand use  Feel free to rip them.

# prompt check
# checks to be sure you are at the <StarDock> prompt.
getword CURRENTLINE $promptCheck 1
if ($promptCheck = "<StarDock>")
	goto :getUserInfo
else
	echo ANSI_12 "**You must be at the StarDock prompt to run this script!!*"
	echo ANSI_12 "You are at the " ANSI_11 $promptCheck  ANSI_12 " prompt!*Halting!**"
	halt
end

:getUserInfo
# this is the first round of checks.
# the following checks to see if you have a planet scanner installed on your ship
# the script will work with a planet scanner, but it's sub optimal, and will cost
# extra turns.
gosub :silenceMessages
gosub :quickstats
echo ANSI_10 "**plScan: " $plScn
if ($plScn = "Yes")
	echo ANSI_12 "**Planet Scanner Detected!  This is not prefered!*"
# Temporarily removed till I figure out why the scanner sometimes makes things buggy.
	echo ANSI_10 "Continue anyway? (y/n)*"
	getconsoleinput $usePlScn SINGLEKEY
	if ($usePlScn = "n")
		gosub :hearMessages
		echo ANSI_10 "**Halting!*Remember, you are at the <StarDock> prompt!*"
		halt
	end
end
# the following checks to see if you belong to a corp.
if ($checkCorp = "Corp")
	goto :checkAutoFlee
else
	gosub :hearMessages
	echo ANSI_12 "**You don't seem to belong to a corp!*"
	echo ANSI_10 "You must be on a corp for this script to work.*halting!*"
	echo ANSI_10 "(I can't think of a good reason NOT to be on a corp.*"
	echo ANSI_10 "   But that doesn't mean a good reason doesn't exist.*"
	echo ANSI_10 "   You can always make a temporary corp, then disband*"
	echo ANSI_10 "   it when you are done with this script.  Or you can*"
	echo ANSI_10 "   change the macros...)*"
	echo ANSI_10 "Remember, you are at the <StarDock> prompt!*"
	halt
end

:checkAutoFlee
# I think you want autoflee to be off while running this script.
# that way if you get pinged, you stay in sector, and can port
# It doesn't help you if you get podded.  If you get podded,
# hopefully the sector is surrounded, so you get back on dock.
# otherwise, your pod will fly off, and BAD THINGS could happen.
send "\"
settextlinetrigger checkFlee :checkFlee "Online Auto Flee is"
pause

:checkFlee
killtrigger checkFlee
getword CURRENTLINE $autoFlee 5
striptext $autoFlee "."
# waitfor "<StarDock> Where to?"
if ($autoflee = "enabled")
	send "\"
end
goto :checkCN2

:checkCN2
# this checks to be sure you have animation turned off.
# if you have animation turned on, it will offer to turn it off
# for you.
waitfor "<StarDock>"
send "c"
settextlinetrigger cn2off :cn2off "Sorry, only Traders with ANSI"
settexttrigger cn2on :cn2on "Select(1-5,Q)"
pause

:cn2off
echo ANSI_10 "**Ansi Animation Off!!*"
killtrigger cn2off
killtrigger cn2on
goto :checkCN9

:cn2on
killtrigger cn2off
killtrigger cn2on
send "q"
waitfor "<StarDock> Where to?"
echo ANSI_12 "**UGH!! You still have animaton turned on!*"
echo ANSI_12 "This script can't run with animation turned on!*"
echo ANSI_10 "I can fix this if you would like by sending the following macro:*"
echo ANSI_11 "q  c  n  2  q  q  p  s*"
echo ANSI_10 "Would you like me to attempt to fix it? (y/n)*"
getconsoleinput $fixCN2 SINGLEKEY
if ($fixCN2 = "y")
	send " q  c  n  2  q  q  p  s"
	waitfor "<StarDock> Where to?"
	echo ANSI_10 "**Should be fixed, animation turned " ANSI_11 "OFF" ANSI_10 ".**"
	subtract $yourTurns 1
	goto :checkCN9
else
	echo ANSI_12 "**OK, you need to turn off animation yourself!*HALTING!*"
	echo ANSI_10 "Remember, you are at the <StarDock> prompt!*"
	halt
end

:checkCN9
# this checks to see if you have CN9 set to All.
# if you do, this will offer to switch it to space.
# this routine also checks your bank balance.
# I figured I could kill 2 birds with one stone this way.
# Also, a flag is set here, so when the script is done, if
# you had CN9 set to ALL, it will return it to ALL once the script is done.
send "ge"
settextlinetrigger cn9space :cn9space "You enter the most"
settextlinetrigger cn9all :cn9all "<Galactic Bank>"
pause

:cn9space
killtrigger cn9space
killtrigger cn9all
setvar $cn9 "space"
settextlinetrigger checkBankAcct :checkBankAcct "credits in your account."
pause

:cn9all
killtrigger cn9space
killtrigger cn9all
setvar $cn9 "all"
settextlinetrigger checkBankAcct :checkBankAcct "credits in your account."
pause

:checkBankAcct
# here is where it checks your bank balance
killtrigger checkBankAcct
getword CURRENTLINE $bankCreds 3
striptext $bankCreds ","
send "q"
waitfor "<StarDock> Where to?"
goto :getPricing

:getPricing
# this is where it checks the costs for Atomic Dets and G-Torps
send "ha"
settextlinetrigger getDetCost :getDetCost "We sell them for"
pause

:getDetCost
killtrigger getDetCost
getword CURRENTLINE $detCost 5
striptext $detCost ","
settexttrigger howManyDets :howManyDets "How many Atomic Detonators do you want"
pause

:howManyDets
killtrigger howManyDets
getword CURRENTLINE $maxDets 9
striptext $maxDets ")"
setvar $maxDets ($maxDets + $ADets)
send "0*t"
settextlinetrigger getGTorpCost :getGTorpCost "Aldus Genesis Torpedo."
pause

:getGTorpCost
killtrigger getGTorpCost
getword CURRENTLINE $gtorpCost 6
striptext $gtorpCost ","
settexttrigger howManyGtorps :howManyGtorps "How many Genesis Torpedoes do you want"
pause

:howManyGtorps
killtrigger howManyGtorps
getword CURRENTLINE $maxGtorps 9
striptext $maxGtorps ")"
setvar $maxGtorps ($maxGtorps + $Gtorps)
send "0*q"
waitfor "See you later."
goto :checkForProblems

:checkForProblems
echo ANSI_10 "**Checking for Problems*"
# ok, now that you got that figured out, 
# check to make sure they have > 0 turns.
#   if not, ask if unlimited turns game.
# It's looking for a minimum of 50 turns.
if ($yourTurns = 0)
	echo ANSI_12 "**You appear to have ZERO turns.*"
	echo ANSI_10 "Is this an unlimited turn game? (y/n)*"
	getconsoleinput $unlimited SINGLEKEY
	lowercase $unlimited
	if ($unlimited = "y")
		goto :fixCN9
	else
	gosub :hearMessages
		echo ANSI_10 "**You need at least 50 turns to run this script!!*"
		echo ANSI_10 "I advise you hang out on the dock till you recover some turns!**"
		echo ANSI_10 "Halting the script!  Good Luck!*"
		echo ANSI_10 "Remember, you are at the <StarDock> prompt!*"
		halt
	end
elseif ($yourTurns < 50)
	gosub :hearMessages
	echo ANSI_12 "**You seem to have only " $yourTurns " turns!*"
	echo ANSI_10 "You need at least 50 turns to run this script!!*"
	echo ANSI_10 "I advise you hang out on the dock till you recover some turns!**"
	echo ANSI_10 "Halting the script!  Good Luck!*"
	echo ANSI_10 "Remember, you are at the <StarDock> prompt!*"
	halt
else
	echo ANSI_10 "**Turns " ANSI_11 "OK!!*"
	goto :fixCN9
end	

# this is where it actually fixes any CN9 problems	
# check to make sure they have CN9 set to "space"
#   if not, offer to fix it for them?
:fixCN9
if ($cn9 = "all")
	echo ANSI_12 "*Abort display on keys appears to be set to " ANSI_11 "all.*"
	echo ANSI_10 "This Script requires it to be set to" ANSI_11 " space.*"
	echo ANSI_10 "Do you want me to fix this with a Macro?*"
	echo ANSI_10 "Answering" ANSI_11 " yes " ANSI_10 "will send the following burst:*"
	echo ANSI_11 "qcn9  q  q  p  s*"
	echo ANSI_10 "Answering " ANSI_12 "no" ANSI_10 " will halt the script, and you will have to*"
	echo ANSI_10 "  fix this problem yourself. "
	echo ANSI_10 "So, shall I attempt to fix? (y/n)"
	getconsoleinput $changeCN9 SINGLEKEY
	lowercase $changeCN9
	echo ANSI_10 "*When script finished, do you want CN9 restored to 'all'? (y/n)"
	getconsoleinput $restoreCN9 SINGLEKEY
	lowercase $restoreCN9
	if ($changeCN9 = "y")
		echo ANSI_10 "**Attempting to change CN9 Setting to Space!"
		subtract $yourTurns 1
		send "qcn9  q  q  p  s"
		# >>> Need to add check to see if you got to dock ok or not. <<<
		# Using a simple waitfor for now to ensure the timing is ok.
		waitfor "Landing on Federation StarDock."
		echo ANSI_10 "**Should be fixed, CN9 set to " ANSI_11 "space" ANSI_10 ".**" 
		subtract $yourTurns 1
	else
		gosub :hearMessages
		echo ANSI_10 "**Ok, good luck!  Halting!"
		echo ANSI_10 "Remember, you are at the <StarDock> prompt!*"
		halt
	end
else
	echo ANSI_10 "CN9 Setting " ANSI_11 "OK!!*"
end
goto :checkFunds

:checkFunds
# check to make sure that they have enough cash to do at least one
# bust cycle, or have stuff on hand.
setvar $totalInitialCreds ($yourCredits + $bankCreds)
if ($totalInitialCreds < ($GtorpCost + $detCost)) AND ($ADets = 0) AND ($Gtorps = 0)
	gosub :hearMessages
	echo ANSI_12 "**You don't have enough cash to even do 1 cycle!*"
	echo ANSI_10 "You need at least " ($GtorpCost + $detCost) " credits to run this script.*"
	echo ANSI_10 "Either make some cash, or have someone transfer some into your bank*"
	echo ANSI_10 "Halting!**"
	echo ANSI_10 "Remember, you are at the <StarDock> prompt!*"
	halt
else
	echo ANSI_10 "Initial Cash" ANSI_11 " OK!!*"
	goto :checkAlign
end

:checkAlign
# check to make sure their align is 0 or less
# If align is between 1 and 199, it will
#   offer to go to the underground and fix.
if ($yourAlign > 0) and ($yourAlign < 200)
	echo ANSI_12 "**Your alignment is positive!*"
	echo ANSI_10 "Do you want me to go to the underground to fix? (y/n)*"
	getconsoleinput $askFixAlign SINGLEKEY
	if ($askFixAlign = "y")
		echo ANSI_10 "**Ok, geting pricing. stand by**"
		send "ttmafia*y"
		settexttrigger getMafiaPWPrice :getMafiaPWPrice "will ye pay?"
		pause
		
		:getMafiaPWPrice
		# here is where it gets the pricing for the underground PW
		killtrigger getMafiaPWPrice
		getword CURRENTLINE $mafiaPWPrice 6
		striptext $mafiaPWPrice ","
		send "n*q"
		waitfor "You make a hasty exit from the Tavern."
		setvar $fixAlign $yourAlign
		setvar $fixAlignCreds (($fixAlign * 250) + $mafiaPWPrice)
		echo ANSI_10 "***Your current alignment is " ANSI_11 $yourAlign ANSI_10 ". Will cost " ANSI_11 $fixAlignCreds ANSI_10 " to fix*"
		echo ANSI_10 "You have " ANSI_11 ($yourCredits + $bankCreds) ANSI_10 " available.*"
		echo ANSI_10 "(That counts getting the underground password too.)*"
		echo ANSI_10 "Proceed? (y/n)*"
		getconsoleinput $askFixAlignAgain SINGLEKEY
		if ($askFixAlignAgain = "n")
			gosub :hearMessages
			echo ANSI_12 "**Ok, you know best.  Halting!**"
			echo ANSI_10 "Remember, you are at the <StarDock> prompt!*"
			halt
		end
		echo ANSI_10 "*Do you want me to set up a new password while I'm at it? (y/n)*"
		getconsoleinput $changeMafiaPW SINGLEKEY
		if ($changeMafiaPW = "n")
			setvar $newMafiaPW $mafiaPW
		else
			getinput $newMafiaPW ANSI_10 & "Enter the new Undergound PW: "
		end		
		goto :getMafiaPW
	else
		gosub :hearMessages
		echo ANSI_10 "**Ok, you know best.  Halting!**"
		echo ANSI_10 "Remember, you are at the <StarDock> prompt!*"
		halt
	end
elseif ($yourAlign > 199)
	gosub :hearMessages
	echo ANSI_12 "**Your alignment is too high for me to fix!!*"
	echo ANSI_12 "Your Alignemnt is: " ANSI_11 $yourAlign ANSI_12 ". It must be less than 200.*"
	echo ANSI_12 "You need to lower your alignment first.  Good Luck!*"
	echo ANSI_10 "Remember, you are at the <StarDock> prompt!*"
	halt
else
	echo ANSI_10 "Alignment " ANSI_11 "OK!!*"
	goto :getUserInput
end

:getMafiaPW
# here is where it actually gets the mafia pw from grimy
send "ttmafia*yy"
settextlinetrigger mafiaPW :mafiaPW "The password today is"
pause

:mafiaPW
killtrigger mafiaPW
gettext CURRENTLINE $tempMafiaPW "today is " & #34 ""
getlength $tempMafiaPW $mafiaPWLength
cuttext $tempMafiaPW $mafiaPW 1 ($mafiaPWLength - 1)
send "*q"
waitfor "<StarDock>"
goto :underground

:underground
# here it tries to go into the undergound.
echo ANSI_10 "**Mafia PW: '" $mafiaPW "'*"
send "u"
waitfor "Your reply :"
send $mafiaPW "*"
settexttrigger PWworks :PWworks "The magnetic shielding goes down and the door opens."
settexttrigger PWfails :PWfails "<StarDock> Where to? (?=Help)"
pause

:PWfails
killtrigger PWworks
killtrigger PWfails
echo ANSI_12 "**Underground PW failed!!*"
echo ANSI_10 "**You will have to fix manually.  Halting Script*"
echo ANSI_10 "Remember, you are at the <StarDock> prompt!*"
halt

:PWworks
killtrigger PWworks
killtrigger PWfails
if ($changeMafiaPW = "n")
	send "n"
else
	send "y" $newMafiaPW "*"
end

:placeContract
# this is where it attempts to post on a trader.
# it picks a trader name more or less at random, but since
# the amount of money is trivial, I think this is ok.
# $letters is based on list of letter frequency in english.
# and yes, you can post on yourself.
setvar $letters "e t a o i n s r h l d c u m f p g w y b v k x j q z"
setvar $count 1
:pickTrader4contract
if ($count <= 26)
	getword $letters $temp $count
	send "p" $temp "*"
	settexttrigger knownTrader :knownTrader "Do you mean"
	settexttrigger unknownTrader :unknownTrader "Unknown Trader!"
	pause
else
	gosub :hearMessages
	echo ANSI_12 "**Unable to discern a trader name!!*"
	echo ANSI_10 "You will have to do this manually.*"
	echo ANSI_10 "Run this script again when your alignment is 0 or less*"
	echo ANSI_10 "Halting Script."
	echo ANSI_10 "Remember, you are at the <StarDock> prompt!*"
	halt
end

:unknownTrader
killtrigger knownTrader
killtrigger unknownTrader
add $count 1
goto :pickTrader4contract

:knownTrader
killtrigger knownTrader
killtrigger unknownTrader
send "y" ($fixAlign * 250) "*q"
waitfor "<StarDock>"
send "@"
waitfor "hundredths"
gosub :quickstats
goto :getUserInput

:getUserInput
# this is where it figures out what the max # of cycles your ship can do.
if ($maxDets >= $maxGTorps)
	setvar $maxPerCycle $maxGTorps
else
	setvar $maxPerCycle $maxDets
end
# ask some questions
# 1) target exp?  or spend XXX cash?
# 2) bust safe (1 at a time) or go for it (ship max at a time)?
# 3) do you have a corpie who can give you cash via the bank?
echo ANSI_10 "**You have " ANSI_11 $yourCredits ANSI_10 " on you, and " ANSI_11 $bankCreds ANSI_10 " in your bank.*"
echo ANSI_10 "(say yes to the following if a corpie is going to xfer funds to you)*"
echo ANSI_11 "OK, do you want to use your bank funds? (y/n)*"
getconsoleinput $useBank SINGLEKEY
if ($useBank = "y")
	setvar $totalCycles (((($yourCredits + $bankCreds) / ($gtorpCost + $detCost))-1) + $aDets)
else
	if ($yourCredits < ($gtorpCost + $detCost))
		echo ANSI_12 "**Not Enough cash without your bank!*Halting!*"
		echo ANSI_10 "Remember, you are at the <StarDock> prompt."
		halt
	else
		setvar $totalCycles ((($yourCredits / ($gtorpCost + $detCost))-1) + $aDets)
	end
end
:askForTargetExp
echo ANSI_10 "*Your current exp is: " ANSI_11 $yourExp "*"
echo ANSI_10 "You need 5250 exp for mbbs or 7500 for classic to steal 250 holds.*"
echo ANSI_10 "You have enough cash on-hand to do " ANSI_11 $totalCycles ANSI_10 " bust cycles to get you to " ANSI_11 ($yourExp + ($totalCycles * 75)) ANSI_10 " Total exp.*"
echo ANSI_10 "(If you enter more exp than you have cash for, it will ask if you have a corpie*"
echo ANSI_10 "   avialable to funnel cash into your bank.)*"
echo ANSI_11 "Enter the target Exp you want."
getinput $targetExp ANSI_11 & "(or just press enter to bust max possible with available cash.)"
if ($targetExp = "")
	setvar $targetExp (($totalCycles * 75) + $yourExp)
	setvar $neededExp ($targetExp - $yourExp)
	setvar $neededCycles ($neededExp / 75)
	echo ANSI_10 "*Needed Exp: " $neededExp
	echo ANSI_10 "*Needed Cycles: " $neededCycles "*"
	goto :askBustSafeMode
end
isnumber $test $targetExp
if ($test)
	if ($targetExp < 1)
		echo ANSI_12 "**Please enter a positive number!***"
		goto :askForTargetExp
	elseif ($targetExp <= $yourExp)
		echo ANSI_12 "**Get real! Enter a number greater than your current exp!***"
		goto :askForTargetExp		
	else
		goto :checkMath
	end
else
	echo ANSI_12 "**Please enter a number!***"
	goto :getUserInput
end
	
:checkMath
echo ANSI_10 "**At :checkMath*"
# ok, now that you know what you got to work with, figure out if 
# it's even possible to do what they want.
# here is where it asks if you want to have a corpie give you cash via bank.
# I highly recommend that you do this, only using your bank, since if you 
# get podded, you won't loose your cash this way.
if (($targetExp - $yourExp) > ($totalCycles * 75))
	echo ANSI_12 "**" $targetExp "?  You don't have the cash on-hand to do that!*"
	echo ANSI_10 "Is a corpie going to fill your bank as you need more cash? (y/n)*"
	getconsoleinput $corpieBanker SINGLEKEY
	if ($corpieBanker = "n")
		if ($askedAgain >= 2)
			goto :weGotALiveOneHere
		end
		echo ANSI_12 "**Ok. I'll ask for exp again*"
		echo ANSI_12 "You must reduce your Target Exp, get a corpie to transfer cash*"
		echo ANSI_12 "to your bank, or halt script and get more cash*"
		add $askedAgain 1
		goto :getUserInput
	else
		setvar $useBank "y"
		setvar $neededExp ($targetExp - $yourExp)
		setvar $neededCycles ($neededExp / 75)
		echo ANSI_10 "*Needed Exp: " $neededExp
		echo ANSI_10 "*Needed Cycles: " $neededCycles "*"
		goto :askBustSafeMode
	end
else
	setvar $neededExp ($targetExp - $yourExp)
	setvar $neededCycles ($neededExp / 75)
	echo ANSI_10 "*Needed Exp: " $neededExp
	echo ANSI_10 "*Needed Cycles: " $neededCycles "*"
	goto :askBustSafeMode
end

:askBustSafeMode
echo ANSI_10 "**At :askBustSafeMode*"
if ($unlimited = "y")
	goto :getSafeMode
end
if ($yourTurns < ($neededCycles + 10))
	echo ANSI_12 "**You don't appear to have enough turns to bust in Safe Mode*"
	echo ANSI_10 "Do you want to continue anyway? (y/n)*"
	getConsoleinput $noTurnsContinue SINGLEKEY
	if ($noTurnsContinue = "n")
		gosub :hearMessages
		echo ANSI_10 "**OK, halting.  Try again when you have more turns.*"
		echo ANSI_10 "Remember, you are at the <StarDock> prompt!*"
		halt
	elseif ($yourTurns < (($neededCycles / $maxPerCycle) + 10))
		gosub :hearMessages
		echo ANSI_12 "**Not enough turns to bust in max possible mode!**"
		echo ANSI_10 "Please Run again when you have more turns!**"
		echo ANSI_10 "Remember, you are at the <StarDock> prompt!*"
		halt
	end
end
goto :getSafeMode

:getSafeMode
# this is where it asks what mode you want to bust in.
echo ANSI_11 "**This script has 3 bust modes: Safe Mode, 2fer mode, and Max mode*"
echo ANSI_11 "Safe Mode" ANSI_10 " busts 1 planet at a time, and has an option for random delay timers*  between busts.*"
echo ANSI_11 "2fer Mode" ANSI_10 " busts 2 planets at a time, and has an option for random delay timers*  between busts.*"
echo ANSI_11 "Max Mode" ANSI_10 " busts as many planets as the ship can hold at a time, and has an option*  for random delay timers between busts.*"
echo ANSI_10 "In general 2fer mode is safe for most games. (non-tournies)*"
echo ANSI_10 "I do not recommend using Max Mode, unless you are quite sure it's safe!*"
echo ANSI_11 "**Choose Mode: (s = Safe, 2 = 2fer, m = Max) ?*"
getconsoleinput $bustMode SINGLEKEY
if ($bustMode = "s")
	setvar $bustMode "safe"
	echo ANSI_11 "**Safe bust mode selected!*"
	goto :askRandomDelay
end
if ($bustMode = "2")
	setvar $bustMode "2fer"
	echo ANSI_11 "**2fer bust mode selected!*"
	if ($maxPerCycle = 1)
		setvar $bustMode "safe"
	end
	goto :askRandomDelay
end
if ($bustMode = "m")
	setvar $bustMode "max"
	echo ANSI_11 "**max bust mode selected!*"
	goto :askRandomDelay
else
	echo ANSI_12 "**Invalid Entry!  Please select again.*"
	goto :getSafeMode
end

:askRandomDelay
# this is where it asks if you want a random delay inserted between each bust
echo ANSI_10 "**I can add a random delay between bust cycles of between 100 and 2000 ms.*"
echo ANSI_10 "This option may or may not make you safer against dock kills*"
echo ANSI_10 "User discretion advised.*"
echo ANSI_11 "Do you want a random delay between bust cycles? (y/n)*"
getconsoleinput $randomDelay SINGLEKEY
goto :finalPrepBeforeBusting

:finalPrepBeforeBusting
# here is where it does the final checks to be sure what the user is asking for
# is possible.
setvar $WTF 0
echo ANSI_10 "**At FinalPrepBeforeBusting*"
if ($bustMode = "safe")
	setvar $maxPerCycle 1
elseif ($bustMode = "2fer")
	setvar $maxPerCycle 2
end
echo ANSI_10 "**Max planets per cycle = " $maxPerCycle "*"
send "@"
waitfor "hundredths"
gosub :quickstats
gosub :checkStatus
echo ANSI_10 "Final Turn Check: "
if ($yourTurns < (($neededCycles / $maxPerCycle) + 2))
	if ($unlimited <> "y")
		gosub :hearMessages
		echo ANSI_12 "NO!**Not enough turns to bust requested amount!**"
		echo ANSI_10 "Please Run again when you have more turns!**"
		echo ANSI_10 "Remember, you are at the <StarDock> prompt!*"
		halt
	else 
		echo ANSI_10 "OK!*"
	end
else
	echo ANSI_10 "OK!*"
end
echo ANSI_10 "Final Supply Check**"
if ($aDets < $maxPerCycle)
	send "h  a  " ($maxPerCycle - $aDets) "*q"
	waitfor "See you later"
end
if ($gTorps < $maxPerCycle)
	send "h  t  " ($maxPerCycle - $gTorps) "*q"
	waitfor "See you later"
end
goto :startBustCycle

:startBustCycle
# this silences all messages.  It gets turned back on when you finish.
# here is where is actually begins the bust cycle, and builds the macros.
# 
# echo ANSI_10 "**At :startBustCycle*"
setvar $count 1
setvar $bustString "q  "
setvar $tempCycles $maxPerCycle
if ($neededCycles < $tempCycles)
	setvar $tempCycles $neededCycles
	echo ANSI_10 "**Almost Done!!**"
end
if ($tempCycles < 1)
	# Hmmm...something is wrong somewhere.  CheckStatus should have stopped
	# the script before it got to this point.  For now, I will reset
	# tempCycles to 1, and hope that CheckStatus will catch it next time round.
	# I have only seen this happen while an enemy was creating and busting planets
	# at dock.
	# adds 1 to the $WTF variable. if $WTF > 10, it will pause the script!
	echo ANSI_12 "**Hmmm...counting is off. CheckStatus should have stopped this!*"	
	setvar $tempCycles 1
	add $WTF 1
end
while ($count <= $tempCycles)
	setvar $bustString $bustString & "u  y  n  .*cl  *  z  d  y  "
	add $count 1
end
setvar $bustString $bustString & "p  s "
# echo ANSI_10 "**" $bustString "*"
subtract $neededCycles $tempCycles
send $bustString
# I know the following line looks crazy, but the timing is such that 
# if I don't have the waitfor here, it will potentially miss the 
# invalid registry number, because it keys off the <stardock> prompt
# too soon.  There is no danger here, as you are on dock before 
# the server even sends you the text "command".
waitfor "Command"
settextlinetrigger invalidRegNum :invalidRegNum "Invalid registry number"
settexttrigger bustOK :bustOK "<StarDock>"
pause

:bustOK
# it looks like you busted the planets ok.  
# figures out how many torps and dets to buy.
killtrigger invalidRegNum
killtrigger bustOK
send "@"
waitfor "hundredths"
gosub :quickStats
gosub :checkStatus
# echo ANSI_10 "**At bustOK*"
if ($aDets >= $tempCycles) AND ($gTorps >= $tempCycles)
	setvar $buyDetQty 0
	setvar $buyTorpQty 0
else
	setvar $buyDetQty ($tempCycles - $aDets)
	setvar $buyTorpQty ($tempCycles - $gTorps)
end	
send "h  a  " $buyDetQty "*  t  " $buyTorpQty "*  q"
if ($randomDelay = "y")
	gosub :randomDelay
end
goto :startBustCycle

:invalidRegNum
# it looks like there was an extra planet(s) at dock.
# will switch to bust all extra planets at dock mode.
# fires off a quick macro to create a new planet,
# and grab the planet numbers.
killtrigger bustOK
killtrigger invalidRegNum
echo ANSI_12 "**At invalidRegNum*"
setvar $planetNums ""
send "@"
waitfor "hundredths"
gosub :quickstats
gosub :checkStatus
send "h  t  1*  q"
waitfor "<StarDock>"
send "q  u  y  n  .*cl*  z  d  y  p  s "
# I know the following line looks crazy, but the timing is such that 
# if I don't have the waitfor here, it will potentially miss the 
# registry#, because it keys off the <stardock> prompt
# too soon.  There is no danger here, as you are on dock before 
# the server even sends you the text "command".
waitfor "Command"
settexttrigger getPlanNum :getPlanNum "Registry#"
settexttrigger ondock :ondock "<StarDock>"
pause

:getPlanNum
# here is where it grabs the planet numbers
killtrigger getPlanNum
# echo ANSI_10 "**At getPlanNum*"
settextlinetrigger planNum :planNum "   <"
pause

:planNum
# here it creates a string of all the planet numbers
# called $planetNums
killtrigger planNum
add $extraPlanets 1
getword CURRENTLINE $tempPlanetNum 2
striptext $tempPlanetNum ">"
setvar $planetNums $planetNums & " " & $tempPlanetNum
settexttrigger planNum :planNum "   <"
pause

:onDock
# ok, it looks like you are back at dock.
killtrigger getPlanNum
killtrigger planNum
killtrigger ondock
# This next bit is anti-spoof.  If someone names a planet "<StarDock>"
# The script will either totally ignore it, or if it's the first
# planet in the list, it'll blow it.  Regardless, it handles the
# situation much better now.  Not perfect, but better
getword CURRENTLINE $spoofPlanetName 1
if ($spoofPlanetName <> "<StarDock>")
	settexttrigger ondock :ondock "<StarDock>"
	settexttrigger planNum :planNum "   <"
	pause
end	
# echo ANSI_10 "**At ondock*"
# generate random number here to randomly bust extra planet numbers
# this creates a mini array on the fly.  heh
setarray $randomPlanNum $extraPlanets
setvar $c 1
setvar $rndPlanetNums ""
:planetNumberRandomizer
while ($c <= $extraplanets)
	getRnd $random 1 $extraPlanets
	if ($randomPlanNum[$random] = 1)
		goto :planetNumberRandomizer
	else
		getword $planetNums $tempPlanetNum $random
		setvar $rndPlanetNums $rndPlanetNums & " " & $tempPlanetNum
		add $c 1
		setvar $randomPlanNum[$random] 1
	end
end
echo ANSI_10 "**Random Planet List: " $rndPlanetNums "***"
goto :multiPlanets

:multiPlanets
# here is where it blows up the extra planets at dock.
# will cycle through all the planet numbers.
send "@"
waitfor "hundredths"
gosub :quickStats
gosub :checkStatus
if ($extraPlanets >= 1)
	send "h  a  1*  q"
	waitfor "<StarDock>"
	getword $rndPlanetNums $tempPlanetNum $extraPlanets
	echo ANSI_12 "**TempPlanetNum " $tempPlanetNum "***"
	send "q  l  " $tempPlanetNum "*  n  z  n  d  y  *  p  s "
	settexttrigger backOnDock :backOndock "<StarDock>"
	settexttrigger planetNumGone :planetNumGone "That planet is not in this sector."
	settexttrigger triedToMove :triedToMove "<Move>"
	pause
else
	send "@"
	waitfor "hundredths"
#	gosub :quickstats
#	gosub :checkStatus
	goto :bustOK
end

:backOnDock
# made it back to dock ok.  grabs the next planet number
killtrigger backOnDock
killtrigger planetNumGone
killtrigger triedToMove
# This next bit is anti-spoof.  If someone names a planet "<StarDock>"
# you shouldn't care.  I don't think it's needed here, but added anyway,
# just as a precaution.
getword CURRENTLINE $spoofPlanetName 1
if ($spoofPlanetName <> "<StarDock>")
	settexttrigger backOnDock :backOndock "<StarDock>"
	settexttrigger planetNumGone :planetNumGone "That planet is not in this sector."
	settexttrigger triedToMove :triedToMove "<Move>"
	pause
end	
subtract $extraPlanets 1
# gosub :quickstats
# gosub :checkStatus
goto :multiPlanets

:planetNumGone
# ok, someone is definately playing around.  expected planet number
# is gone.  Goes back to grab the planet numbers.
killtrigger backOnDock
killtrigger planetNumGone
killtrigger triedToMove
goto :invalidRegNum

:triedToMove
# ok, there were multiple planets, but someone killed them ALL.
killtrigger backOnDock
killtrigger planetNumGone
killtrigger triedToMove
goto :bustOK

# It should never get to this point.  but if it somehow does
# I stuck this in here so you wouldn't process the subroutines.
gosub :hearMessages
echo ANSI_12 "**There has been a serious problem.*"
echo ANSI_10 "You have somehow reached the failsafe halt at the end*"
echo ANSI_10 "of the script.  Perhaps you modified it somehow?*"
echo ANSI_10 "Shutting down the script!*"
echo ANSI_10 "Remember, you are at the <StarDock> prompt!*"
halt

# =======================
# ====[ SUBROUTINES ]====
# =======================

# ====[ Get quick stats ]====
# The complese list of quick stats follows.
# XX YYYY ZZZZ
# XX = the getword number to use to get the stat
# YYYY = the stat
# ZZZZ = the value of that stat
# so to use this, do getword $stats $YYYY XX
# i.e. getword $stats $turns 5  
# that will make $turns equal to your current turns
# NOTE: If Photons are disabled, then the count will be 2 less for anything after Col
# NOTE: If you are not in a corp, then the count will be 2 less for anything after Exp
# NOTE: I am only grabbing the stats that are relevant to this script.
#       if you want to use this routine in your own scripts, you should
#       modify it accordingly.  I have a version of this routine that is much shorter
#       but I stuck this one in here cause it's easier to decipher.
# 3 Sect 4372
# 5 Turns 2740
# 7 Creds 100
# 9 Figs 1
# 11 Shlds 1
# 13 Hlds 40
# 15 Ore 0
# 17 Org 0
# 19 Equ 0
# 21 Col 0
# 23 Phot 0
# 25 Armd 0
# 27 Lmpt 0
# 29 GTorp 0
# 31 TWarp No
# 33 Clks 0
# 35 Beacns 0
# 37 AtmDt 0
# 39 Crbo 0
# 41 EPrb 0
# 43 MDis 0
# 45 PsPrb No
# 47 PlScn No
# 49 LRS Holo
# 51 Aln -100
# 53 Exp 100
# 55 Corp 1
# 57 Ship 1
:quickstats
setvar $stats 0
getword CURRENTLINE $sdprompttest 1
if ($sdprompttest <> "<StarDock>")
	waitfor "<StarDock>"
end
send "/"
settextlinetrigger getStats :getStats #179 & "Turns"
settexttrigger onDock :gotStats "<StarDock>"
pause

:getStats
killtrigger getStats
setvar $stats $stats & CURRENTLINE
replacetext $stats #179 " "
striptext $stats ","
settextlinetrigger getStats :getStats
pause

:gotStats
killtrigger onDock
killtrigger getStats
getword $stats $checkStat 2
if ($checkStat <> "Sect")
	echo ANSI_12 "*QuickStats Failed, Bad Timing.  Doing again.*"
	goto :quickstats
else
	echo ANSI_10 "*Got Stats!*"
end
getword $stats $yourTurns 5
getword $stats $yourCredits 7
getword $stats $yourFigs 9
getword $stats $yourShields 11
getword $stats $yourOre 15
getword $stats $photonCheck 22
# echo ANSI_10 "**Phot = " $photonCheck "**"
if ($photonCheck = "Phot")
	getword $stats $gTorps 29
	getword $stats $yourTWarp 31
	getword $stats $yourCloaks 33
	getword $stats $aDets 37
	getword $stats $plScn 47
	getword $stats $yourAlign 51
	getword $stats $yourExp 53
	getword $stats $checkCorp 54
	if ($checkCorp = "Corp")
		getword $stats $CorpNum 55
		getword $stats $PersonalShipNum 57
	end
	getword $stats $PersonalShipNum 55
else
	getword $stats $gTorps 27
	getword $stats $yourTWarp 29
	getword $stats $yourCloaks 31
	getword $stats $aDets 35
	getword $stats $plScn 45
	getword $stats $yourAlign 49
	getword $stats $yourExp 51
	getword $stats $checkCorp 52
	if ($checkCorp = "Corp")
		getword $stats $CorpNum 53
		getword $stats $PersonalShipNum 55
	end
	getword $stats $PersonalShipNum 53
end
return

:weGotALiveOneHere
# Player not able to enter in experience correctly.
# Snarky response follows:
gosub :hearMessages
echo ANSI_12 "****You are obviously having a bad day.*"
echo ANSI_12 "Why don't you count to 10 and try again?*"
echo ANSI_10 "Remember, you are at the <StarDock> prompt!*"
halt

:checkStatus
# This is the check routine that stops the script when you are
# either finished busting, or you encountered a problem.
getword CURRENTLINE $promptCheck 1
# you aren't at the stardock prompt.  Probably got podded!
if ($promptCheck <> "<StarDock>")
	gosub :hearMessages
	send "p  s t"
	echo ANSI_12 "**You weren't at dock, when I expected you to be there!!*"
	echo ANSI_12 "attempting to dock!  If not at Dock, will attempt to port.*"
	echo ANSI_12 "If you were at dock, you should be at the tavern prompt.*"
	echo ANSI_12 "If you were in space, and under a port, it should have*"
	echo ANSI_12 "  attempted to port you.*"
	echo ANSI_12 "If there was no port, then you will be at the*"
	echo ANSI_12 "Regardless, Halting script!! you may have been podded!*"
	halt
end
# Checks to see if you have reached target exp!  if you have, halts!"
if ($yourExp >= $targetExp)
	gosub :hearMessages
	if ($cn9 = "all") AND ($restoreCN9 = "y")
		send "q  c  n  9  q  q  p  s"
		waitfor "<StarDock>"
		echo ANSI_10 "**Target Exp Reached!*"
		echo ANSI_10 "CN9 setting set back to " ANSI_11 "ALL*"
		echo ANSI_10 "Remember, you are at the <StarDock> prompt!**"
		halt
	end
	echo ANSI_10 "**Target Exp Reached!  Halting!!*Remember, you are at the <StarDock> prompt!**"
	halt
end
#  Low turn check!  Should leave you enough turns so you can get off dock or whatever.
if ($yourTurns < 10) AND ($unlimited <> "y")
	gosub :hearMessages
	echo ANSI_12 "**Turns dangerously low!  Halting!!*"
	echo ANSI_10 "Turns: " $yourTurns "**Remember, you are at the <StarDock> prompt!*"
	halt
end
# usually when you have only 25 creds, it means you've been podded.
# pauses here to allow you to verify that some goofy fluke didn't happen!
if ($yourCredits = 25)
	echo ANSI_12 "**You might have been podded, I only see 25 creds on you!!*"
	echo ANSI_12 "However, you appear to be on the StarDock!*"
	echo ANSI_12 "You may want to hit '/' to check your ship info.*"
	echo ANSI_12 "If this is a false alarm, hit space.*"
	echo ANSI_12 "Pausing till you press space, or manually halt script****"
	settextouttrigger resume :resume " "
	pause
end	
:resume
# Here it checks for available credits
# If don't have enough credits to continue, but you have a corpie 
# feeding your bank, it will ask your corpie to add creds to your bank
# It will only withdraw enough credits to purchase the needed Dets and G-torps
# This is for safety, so if you do get podded, the enemy don't get your cash.
# again, having a corpie feed you cash is the preferred method.
if ($yourCredits < (($gtorpCost + $detCost) * $maxPerCycle))
echo ANSI_10 "**Not Enough Cash to Continue!*"
	if ($useBank = "y")
		echo ANSI_10 "*Checking bank!*"
		send "ge"
		settextlinetrigger viewBankAcct :viewBankAcct "credits in your account."
		pause

		:viewBankAcct
		killtrigger viewBankAcct
		getword CURRENTLINE $bankCreds 3
		striptext $bankCreds ","
		send "q"
		waitfor "<StarDock> Where to?"
		if (($yourCredits + $bankCreds) < (($gtorpCost + $detCost) * $maxPerCycle))
			if ($corpieBanker = "y")
				gosub :hearMessages
				send "'*Not enough Creds in bank to continue busting.*Please give me more.**"
				settextlinetrigger waitForCreds :waitForCreds "credits to your Galactic bank account."
				pause
				
				:waitForCreds
				killtrigger waitForCreds
				send "ge"
				settextlinetrigger verifyBankAcct :verifyBankAcct "credits in your account."
				pause

				:verifyBankAcct
				killtrigger verifyBankAcct
				getword CURRENTLINE $bankCreds 3
				striptext $bankCreds ","
				send "q"
				waitfor "<StarDock> Where to?"
				if (($yourCredits + $bankCreds) < (($gtorpCost + $detCost) * $maxPerCycle))
					send "'*Not enough Creds in bank to continue busting.*Please give me more.**"
					settextlinetrigger waitForCreds :waitForCreds "credits to your Galactic bank account."
					pause
				else
					subtract $bankCreds (($gtorpCost + $detCost) * $maxPerCycle) 
					send "g  w" ((($gtorpCost + $detCost) * $maxPerCycle) - $yourCredits) "*  q"
					gosub :silenceMessages
					waitfor "<StarDock>"
				end
			else
				gosub :hearMessages
				echo ANSI_12 "**Not enough cash in bank to continue either!*Halting!*"
				echo ANSI_10 "Remember, you are at the <StarDock> prompt!*"
				halt
			end
		else
			subtract $bankCreds (($gtorpCost + $detCost) * $maxPerCycle)
			send "g  w" ((($gtorpCost + $detCost) * $maxPerCycle) - $yourCredits) "*  q"
			waitfor "<StarDock>"
		end
	else
		gosub :hearMessages
		echo ANSI_12 "*HALTING!*"
		echo ANSI_10 "Remember, you are at the <StarDock> prompt!*"
		halt
	end
end
if ($WTF > 10)
	gosub :hearMessages
	echo ANSI_12 "**WTF Flag tripped!  Pausing for debug!**"
	pause
end
echo ANSI_10 "**Stats OK, continuing!*"
return

:silenceMessages
send "|"
setvar $HearMessages "no"
settextlinetrigger Message :Message "all messages."
pause

:hearMessages
send "|"
setvar $HearMessages "yes"
settextlinetrigger Message :Message "all messages."
pause

:Message
killtrigger Message
getword CURRENTLINE $msgStat 1
if ($msgStat = "Displaying") AND ($HearMessages = "yes")
	return
elseif ($msgStat = "Displaying") AND ($HearMessages = "no")
	send "|"
	return
elseif  ($msgStat = "Silencing") AND ($HearMessages = "no")
	return
else
	send "|"
	return
end


:randomDelay
# here is where the random delay gets set.
getrnd $rndNum 50 2000
setdelaytrigger delay :delay $rndNum
pause

:delay
killtrigger delay
return

# end of script!