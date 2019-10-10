# RinBot.ts -- for leaving a message for my corpies and more!
#ver 3.9
#requires Rin_Team_SDT.cts, surround.ts, Rintaliation.ts, Saarfub.ts, Rin_loader.ts, and _PlanetSectorFigDump.ts
# also requires CK's public scripts and attack pack
#requires the improved oz photon to work in photon mode
# to edit message, just type what you want to say between the quotes under the message variables
#
systemScript

echo ANSI_15 & "*First, name your bot, ONE WORD only, and keep it short!*"
getInput $botname "What is the in-game name of your Rinbot? "

setVar $message "My ST bot's name is rbot. "
setVar $message2 " " 
setVar $message3 " "
setVar $message4 "Message recorded at 22:25 Central Time 7/23/2005, Saturday."
send "'[Rinbot] ver 3.9 now active! Send `" & $botname & " help` for a list of commands.*"
gosub :initTriggers

:main

:waitToSend
#setDelayTrigger havemess :haveMess 450000
pause

:haveMess
getWord CURRENTLINE $haveMess 1
stripText $haveMess "script?"
if ($haveMess = "R") OR ($haveMess = "'")
	send "'[Rinbot] ver 3.9 now active! Send `" & $botname & " help` for a list of commands.*"
end
gosub :initTriggers
goto :main
pause

:sendMess
getWord CURRENTLINE $sendMe 1
if ($sendMe = "R") OR ($sendMe = "'" & $botname)
	send "'*" & $message & $message2 & $message3 & $message4 & "**"
end
	gosub :initTriggers
	goto :main
pause

:haltScript
getWord CURRENTLINE $killScript 1
if ($killScript = "R") OR ($killScript = "'" & $botname)
	send "'Stop? No, no, I can't stop.... :) If you meant to stop a script, use the 'halt' command.*"
	gosub :initTriggers
	goto :main
else
	gosub :initTriggers
	goto :main
end
pause

:deployLimpet
getWord CURRENTLINE $limptest 1
if ($limptest = "R") OR ($limptest = "'" & $botname)
	waitFor "ommand"
	cutText CURRENTLINE $location 1 7
	stripText $location " "
	if ($location <> "Citadel") AND ($location <> "Command")
		send "'This command must be run from the citadel or command prompt.*"
	else
		load _ck_perslimp_deploy.cts
		send "'Command acknowledged!*"
	end
end
gosub :initTriggers
goto :main
pause

:clearSect
getWord CURRENTLINE $cleartest 1
if ($cleartest = "R") OR ($cleartest = "'" & $botname)
	waitFor "ommand"
	cutText CURRENTLINE $location 1 7
	stripText $location " "
	if ($location <> "Citadel")
		send "'This command must be run from the citadel prompt.*"
	else
		load _ck_exit_enter.cts
	end
	setDelayTrigger doneclear :doneclear 1500
	pause
	:doneclear
	send "'Command completed! Don't get me killed with this one! :)*"
end
gosub :initTriggers
goto :main
pause

:denScan
getWord CURRENTLINE $dentest 1
if ($dentest = "R") OR ($dentest = "'" & $botname)
	waitFor "ommand"
	cutText CURRENTLINE $location 1 7
	stripText $location " "
	if ($location = "Citadel")
		send q
	end
	if ($location = "Planet") OR ($location = "Citadel")
		send "d"
		waitFor "Planet #"
		getWord CURRENTLINE $pnum 2
		stripText $pnum "#"
		send "q"
	end
	setTextTrigger nodscan :nodscanner "You don't have a long range scanner."
	send "sd"
	waitFor "Relative Density Scan"
	setvar $s 1
	setTextTrigger DCommandPrompt :DDone "Command [TL="
 
	:DNextLine
	killTrigger GetSInfo
	setTextLineTrigger GetDInfo :DInfo
	pause
 
	:DInfo
	SetVar $CSInfo[$s] CURRENTLINE
	add $s 1
	Goto :SNextLine
	Pause

	:DDone
	if ($location = "Planet") OR ($location = "Citadel")
		send "l" & $pnum & "*"
	end
	if ($location = "Citadel")
		send "c"
	end
	Setvar $cs $s
	Setvar $s 2
	send "'*"
	send "Density scan is as follows:*.*"
	:DSDisplay
	If ($s = $cs-1)
		Goto :dsAllDone
	end
	Send "." $CSInfo[$s] "*"
	add $s 1
	goto :DSDisplay
	:dsAlldone
	send ".*Command completed! Look out for enemy limpets!**"
end
gosub :initTriggers
goto :main
pause
:nodscanner
send "'I don't have a long range scanner.*"
	if ($location = "Planet") OR ($location = "Citadel")
		send "l" & $pnum & "*"
	end
	if ($location = "Citadel")
		send "c"
	end
gosub :initTriggers
goto :main
	
:holoScan
getWord CURRENTLINE $htest 1
if ($htest = "R") OR ($htest = "'" & $botname)
	waitFor "ommand"
	cutText CURRENTLINE $location 1 7
	stripText $location " "
	if ($location = "Citadel")
		send q
	end
	if ($location = "Planet") OR ($location = "Citadel")
		send "d"
		waitFor "Planet #"
		getWord CURRENTLINE $pnum 2
		stripText $pnum "#"
		send "q"
	end
	setTextTrigger nohscan1 :nohscanner "You don't have a long range scanner."
	setTextTrigger nohscan2 :nohscanner "<Mine Control>"
	send "sh"
	waitFor "Select (H)olo Scan or (D)ensity Scan or (Q)uit? [D] H"
	setvar $s 1
	setTextTrigger CommandPrompt :SDone "Command [TL="
 
	:SNextLine
	killTrigger GetSInfo
	setTextLineTrigger GetSInfo :SInfo
	pause
 
	:SInfo
	SetVar $CSInfo[$s] CURRENTLINE
	add $s 1
	Goto :SNextLine
	Pause

	:SDone
	if ($location = "Planet") OR ($location = "Citadel")
		send "l" & $pnum & "*"
	end
	if ($location = "Citadel")
		send "c"
	end
	Setvar $cs $s
	Setvar $s 1
	send "'*"
	:CSDisplay
	If ($s = $cs-1)
		Goto :csAllDone
	end
	Send "." $CSInfo[$s] "*"
	add $s 1
	goto :CSDisplay
	:csAlldone
	send ".*Sector holoscan completed!**"
end
gosub :initTriggers
goto :main
:nohscanner
send "**"
send "'I don't have a holoscanner.*"
	if ($location = "Planet") OR ($location = "Citadel")
		send "l" & $pnum & "*"
	end
	if ($location = "Citadel")
		send "c"
	end
gosub :initTriggers
goto :main

:runMacro
getWord CURRENTLINE $dotest 1
if ($dotest = "R")
	setVar $soonToBeMacro CURRENTLINE
	getWordPos $soonToBeMacro $doPos "do"
	setVar $doPos $doPos + 3
	cutText $soonToBeMacro $theMacro $doPos 999
	replaceText $theMacro "^M" "*"
	replaceText $theMacro "^m" "*"
	send $theMacro
	send "'Macro completed! Send '" & $botname & " prompt' to see what I'm seeing.*"
elseif ($dotest = "'" & $botname)
	setVar $soonToBeMacro CURRENTLINE
	getWordPos $soonToBeMacro $doPos "do"
	setVar $doPos $doPos + 3
	cutText $soonToBeMacro $theMacro $doPos 999
	replaceText $theMacro "^M" "*"
	replaceText $theMacro "^m" "*"
	send $theMacro
	send "'Macro completed!*"
end
gosub :initTriggers
goto :main

:useShip
getWord CURRENTLINE $xporttest 1
if ($xporttest = "R")
	getWord CURRENTLINE $shipnumber 5
elseif ($xporttest = "'" & $botname)
	getWord CURRENTLINE $shipnumber 3
end
isNumber $tst $shipnumber
if (($xporttest = "R") OR ($xporttest = "'" & $botname)) AND ($tst = 1) AND ($shipnumber <> 0)
	waitFor "ommand"
	cutText CURRENTLINE $location 1 7
	stripText $location " "
	if ($location <> "Citadel")
		send "'This command must be run from the citadel prompt.*"
	else
		send "qd"
		waitFor "Planet #"
		getWord CURRENTLINE $pnum 2
		stripText $pnum "#"
		send "qd"
		waitFor "Sector  :"
		getWord CURRENTLINE $cursec 3
		send "x " & $shipnumber & "* Q"
		send "D"
		waitFor "Sector  :"
		getWord CURRENTLINE $newsec 3
		waitFor "Command [TL="
		if ($cursec = $newsec)
			send "l" & $pnum & "*c"
		else
			load _ck_callsaveme
		end
		waitFor "Citadel command (?=help)"
		send "'Command completed! I am in the new ship unless it was out of range or not our ship!*"
	end
elseif ($xporttest = "R") OR ($xporttest = "'" & $botname)
	send "'Invalid ship number; sorry!*"
end
gosub :initTriggers
goto :main

:verse
getWord CURRENTLINE $versetest 1
if ($versetest = "R") OR ($versetest = "'" & $botname)
	send "'*" & $botname & " is memorizing verses from the Bible! Memorize along if you like! Today's verse is Psalm 90:12, taken from the Holman Christian Standard Bible version of Scripture:*"
	send "Teach us to number our days carefully so that we may develop wisdom in our hearts.**"
end
gosub :initTriggers
goto :main

:resetBot
getWord CURRENTLINE $resettest 1
if ($resettest = "R") OR ($resettest = "'" & $botname)
	setDelayTrigger waitreset :waitreset 1000
	pause
	:waitreset
	cutText CURRENTLINE $prompt 1 999
	send "'*Rinbot resetting.... I am at the following prompt:*" & $prompt & "**"
end
gosub :initTriggers
goto :main

:getPrompt
getWord CURRENTLINE $testprompt 1
if ($testprompt = "R") OR ($testprompt = "'" & $botname)
	setDelayTrigger waitprompt :waitprompt 1000
	pause
	:waitprompt
	cutText CURRENTLINE $prompt 1 999
	send "'I am at the following prompt:*"
	send "'" & $prompt & "*"
end
gosub :initTriggers
goto :main

:helpMenu
getWord CURRENTLINE $helptest 1
if ($helptest = "R") OR ($helptest = "'" & $botname)
	send "'*Use the word '" & $botname & "' followed by one of these other commands (no brackets):*[help] -- displays this text*[message] -- displays " & $botname & "'s recorded message*"
	send "[limpet] -- deploys a " & $botname & " personal limpet mine*[mines] [numArmids][numLimpets]-- deploys given number of mines if possible and displays sector*[clear] -- runs CK's exit-enter to clear a sector/take Q cannon hits*"
	send "[dscan] -- does a density scan and reports findings*[hscan] -- does a holoscan and reports findings*[pscan] -- does a planet scan and reports findings*[stop] -- terminates the script....or does it?*"
	send "[useship] [ship#] -- changes " & $botname & " to the specified ship -- make SURE it is in transporter range! If the ship is NOT in the same sector, " & $botname & " will call saveme to get a pickup.*"
	send "[land] [planet#] -- lands " & $botname & " on planet # given and enters citadel*[menu2] -- pulls up second help menu with more commands.**"
end
gosub :initTriggers
goto :main
pause

:checkFigs
getWord CURRENTLINE $testfigs 1
if ($testfigs = "R") OR ($testfigs = "'" & $botname)
	waitFor "ommand"
	cutText CURRENTLINE $location 1 7
	stripText $location " "
	if ($location <> "Citadel") AND ($location <> "Command")
		send "'This command must be run from the citadel or command prompt.*"
	else
		send "|cn1qq"
		send "'Command acknowledged!*"
		waitFor "ommand"
		load _ck_refresh_figs.cts
		waitFor "sectors marked."
		setDelayTrigger waitforpromptfigs :gotoherefigs 500
		pause
		:gotoherefigs
		send "cn1qq|"
	end
end
gosub :initTriggers
goto :main

:rinTalOn
getWord CURRENTLINE $teston 1
if ($teston = "R") OR ($teston = "'" & $botname)
	send "'*Command acknowledged! Remember: Rin-taliation does NOT work in FedSpace! It is STRONGLY recommended that you do NOT run retaliation mode and reloader mode simultaneously!**"
	if ($retaliateMode = 1)
		send "'Retaliate mode is already on!*"
		gosub :intiTriggers
		goto :main
	end
	setVar $retaliateMode 1
	load Rintaliation.ts
end
gosub :initTriggers
goto :main

:rinTalOff
getWord CURRENTLINE $testoff 1
if ($testoff = "R") OR ($testoff = "'" & $botname)
	setVar $retaliateMode 0
	send "'Rin-taliation script terminated!*"
	stop Rintaliation.ts
end
gosub :initTriggers
goto :main

:land
getWord CURRENTLINE $landtest 1
getWord CURRENTLINE $planetnumber 5
if ($landtest = "'" & $botname)
	getWord CURRENTLINE $planetnumber 3
end
isNumber $tst $planetnumber
if (($landtest = "R") OR ($landtest = "'" & $botname)) AND ($tst = 1) AND ($planetnumber <> 0)
	waitFor "ommand"
	cutText CURRENTLINE $location 1 7
	stripText $location " "
	if ($location <> "Command")
		send "'This command must be run from the command prompt.*"
	else
	send "'Landing on planet " & $planetnumber & ".*"
	setTextLineTrigger noplanet :noplanet "There isn't a planet in this sector."
	setTextLineTrigger wrongplanet :wrongplanet "That planet is not in this sector."
	send "l" & $planetnumber & "*"
	waitFor "Landing sequence engaged..."
	send "c*"
	send "'Command completed!*"
	end
elseif ($landtest = "R") OR ($landtest = "'" & $botname)
	send "'Invalid planet number; sorry!*"
end
:backtostartfromland
gosub :initTriggers
goto :main
:noplanet
send "znznzn"
send "'Hey, there is no planet in this sector, so I can't land.*"
goto :backtostartfromland
:wrongplanet
send "q*"
send "'*That planet is not in this sector. I can tell you which planets ARE here with a '" & $botname & " pscan' command.**"
goto :backtostartfromland

:surround
getWord CURRENTLINE $testsur 1
if ($testsur = "R") OR ($testsur = "'" & $botname)
	setDelayTrigger waitsur :waitsur 1000
	pause
	:waitsur
	send "'Command acknowledged!*"
	load __ck_surround.cts
end
gosub :initTriggers
goto :main

:scriptOn
getWord CURRENTLINE $testson 1
getWord CURRENTLINE $scriptname 5
if ($testson = "'" & $botname)
	getWord CURRENTLINE $scriptname 3
end
if ($testson = "R") OR ($testson = "'" & $botname)
	setDelayTrigger waitforon :waitforon 1250
	pause
	:waitforon
	send "'Loading " & $scriptname & " -- if I have it!*"
	load $scriptname
end
gosub :initTriggers
goto :main

:scriptOff
getWord CURRENTLINE $testsoff 1
getWord CURRENTLINE $scriptname 5
if ($testsoff = "'" & $botname)
	getWord CURRENTLINE $scriptname 3
end
if ($testsoff = "R") OR ($testsoff = "'" & $botname)
	setDelayTrigger waitforoff :waitforoff 1250
	pause
	:waitforoff
	send "'Stopping " & $scriptname & "!*"
	stop $scriptname
end
gosub :initTriggers
goto :main

:good
getWord CURRENTLINE $testgood 1
if ($testgood = "R") OR ($testgood = "'" & $botname)
	send "'Thanks! Compliments are always appreciated. :)*"
end
gosub :initTriggers
goto :main

:encase
getWord CURRENTLINE $testencase 1
if ($testencase = "R")
	getWord CURRENTLINE $numFigsToUse 5
	getWord CURRENTLINE $figType 6
	getWord CURRENTLINE $mineDeploy 7
elseif ($testencase = "'" & $botname)
	getWord CURRENTLINE $numFigsToUse 3
	getWord CURRENTLINE $figType 4
	getWord CURRENTLINE $mineDeploy 5
else
	goto :noencase
end
isNumber $test $numFigsToUse
if ($test = 0)
	send "'For encase, please use syntax [bot] [numfigs] [type of figs (d, o, t)] [deploymines (y, n)]*"
	goto :noencase
end
if ($numFigsToUse < 1)
	send "'For encase, please use syntax [bot] [numfigs] [type of figs (d, o, t)] [deploymines (y, n)]*"
	goto :noencase
end
if ($figType <> "d") AND ($figType <> "o") AND ($figType <> "t")
	send "'For encase, please use syntax [bot] [numfigs] [type of figs (d, o, t)] [deploymines (y, n)]*"
	goto :noencase
end
if ($mineDeploy <> "y") AND ($mineDeploy <> "n")
	send "'For encase, please use syntax [bot] [numfigs] [type of figs (d, o, t)] [deploymines (y, n)]*"
	goto :noencase
end
send "'Command acknowledged!*"
saveVar $numFigsToUse
saveVar $figType
saveVar $mineDeploy
setDelayTrigger timetoencase :timetoencase 1000
pause
:timetoencase
load surround.ts
waitFor " surrounded succesfully with "
setVar $numFigsToUse 0
setVar $figType 0
saveVar $numFigsToUse
saveVar $figType
:noencase
gosub :initTriggers
goto :main

:figsect
getWord CURRENTLINE $testfigsect 1
if ($testfigsect = "R")
	getWord CURRENTLINE $dump_amount 5
	getWord CURRENTLINE $fig_type 6
elseif ($testfigsect = "'" & $botname)
	getWord CURRENTLINE $dump_amount 3
	getWord CURRENTLINE $fig_type 4
else
	goto :nofigsect
end
isNumber $test $dump_amount
if ($test = 0)
	send "'For figsect, please use syntax [bot] [numfigs] [type of figs (d, o, t)]*"
	goto :nofigsect
end
if ($dump_amount < 1)
	send "'For figsect, please use syntax [bot] [numfigs] [type of figs (d, o, t)]*"
	goto :nofigsect
end
if ($fig_type <> "d") AND ($fig_type <> "o") AND ($fig_type <> "t")
	send "'For figsect, please use syntax [bot] [numfigs] [type of figs (d, o, t)]*"
	goto :nofigsect
end
send "'Command acknowledged!*"
saveVar $dump_amount
saveVar $fig_type
	setDelayTrigger timetofigsect :timetofigsect 1000
pause
:timetofigsect
load _PlanetSectorFigDump.ts
waitFor "dump complete; script termininated."
:nofigsect
gosub :initTriggers
goto :main

:SDT1
getWord CURRENTLINE $SDTtest 1
if ($SDTtest = "R")
	getWord CURRENTLINE $safeSector 5
	getWord CURRENTLINE $ship_2 6
elseif ($SDTtest = "'" & $botname)
	getWord CURRENTLINE $safeSector 3
	getWord CURRENTLINE $ship_2 4
else
	goto :noSDT1
end
isNumber $test1 $safeSector
isNumber $test2 $ship_2
if ($SDTMode = 1)
	send "'SDT is already active!!*"
	goto :noSDT1
end
if ($test1 = 0)
	send "'For SDT1, please us format [SDT1] [safesector] [ship_2] (or 'wait').*"
	goto :noSDT1
end
if ($safeSector < 11) OR ($safeSector > 20000)
	send "'For SDT1, please us format [SDT1] [safesector] [ship_2] (or 'wait').*"
	goto :noSDT1
end
if ($test2 = 0)
	if ($ship_2 <> "wait")
		send "'For SDT1, please us format [SDT1] [safesector] [ship_2] (or 'wait').*"
		goto :noSDT1
	end
end
setVar $SDTMode 1
setVar $furbMode 1
saveVar $furbMode
setVar $waitForFurber "y"
saveVar $waitForFurber
saveVar $safeSector
saveVar $ship_2
send "QQQQQn"
setDelayTrigger waittoSDT1 :waittoSDT1 1000
pause
:waittoSDT1
load Rin_Team_SDT.cts
:noSDT1
gosub :initTriggers
goto :main

:SDT2
getWord CURRENTLINE $SDTtest 1
if ($SDTtest = "R")
	getWord CURRENTLINE $safeSector 5
	getWord CURRENTLINE $classZero 6
	getWord CURRENTLINE $ship_2 7
elseif ($SDTtest = "'" & $botname)
	getWord CURRENTLINE $safeSector 3
	getWord CURRENTLINE $classZero 4
	getWord CURRENTLINE $ship_2 5
else
	goto :noSDT2
end
isNumber $test1 $safeSector
isNumber $test2 $ship_2
isNumber $test3 $classZero
if ($SDTMode = 1)
	send "'SDT is already active!!*"
	goto :noSDT2
end
if ($test1 = 0)
	send "'For SDT2, please us format [SDT2] [safesector] [classZero] [ship_2] (or 'wait').*"
	goto :noSDT2
end
if ($safeSector < 11) OR ($safeSector > 20000)
	send "'For SDT2, please us format [SDT2] [safesector] [classZero] [ship_2] (or 'wait').*"
	goto :noSDT2
end
if ($test2 = 0)
	if ($ship_2 <> "wait")
		send "'For SDT1, please us format [SDT2] [safesector] [classZero] [ship_2] (or 'wait').*"
		goto :noSDT2
	end
end
if ($test3 = 0)
	send "'For SDT2, please us format [SDT2] [safesector] [classZero] [ship_2] (or 'wait').*"
	goto :noSDT2
end
if ($classZero < 11) OR ($classZero > 20000)
	send "'For SDT2, please us format [SDT2] [safesector] [classZero] [ship_2] (or 'wait').*"
	goto :noSDT2
end
setVar $SDTMode 1
setVar $furbMode 2
saveVar $furbMode
setVar $waitForFurber "y"
saveVar $waitForFurber
saveVar $safeSector
saveVar $ship_2
saveVar $classZero
send "QQQQQn"
setDelayTrigger waittoSDT2 :waittoSDT2 1000
pause
:waittoSDT2
load Rin_Team_SDT.cts

:noSDT2
gosub :initTriggers
goto :main

:stopSDT
getWord CURRENTLINE $stopSDTtest 1
if ($stopSDTtest = "R") OR ($stopSDTtest = "'" & $botname)
	setVar $SDTMode 0
	setVar $safeSector 0
	setVar $furbMode 0
	setVar $waitForFurber 0
	setVar $classZero 0
	setVar $ship_2 0
	saveVar $safeSector
	saveVar $furbMode
	saveVar $waitForFurber
	saveVar $classZero
	saveVar $ship_2
	stop Rin_Team_SDT.cts
	send "'SDT terminated.*"	
end
gosub :initTriggers
goto :main

:pscan
getWord CURRENTLINE $ptest 1
if ($ptest = "R") OR ($ptest = "'" & $botname)
	waitFor "ommand"
	cutText CURRENTLINE $location 1 7
	stripText $location " "
	if ($location = "Citadel")
		send q
	end
	if ($location = "Planet") OR ($location = "Citadel")
		send "d"
		waitFor "Planet #"
		getWord CURRENTLINE $pnum 2
		stripText $pnum "#"
		send "q"
	end
	send "l"
	waitFor "(?=Help)? : L"
	setvar $s 1
	setTextTrigger planetPrompt :PDone "Land on which planet <Q to abort> ?"
	setTextTrigger badCommandPrompt :PDone "Command [TL="
	setTextTrigger nopscanner :nopscanner4me "Planet command (?=help) [D]"
 
	:PNextLine
	killTrigger GetPInfo
	setTextLineTrigger GetPInfo :PInfo
	pause
 
	:PInfo
	SetVar $CSInfo[$s] CURRENTLINE
	add $s 1
	Goto :PNextLine
	Pause

	:PDone
	killTrigger planetPrompt
	killTrigger badCommandPrompt
	killTrigger nopscanner
	send "q*"
	if ($location = "Planet") OR ($location = "Citadel")
		send "l" & $pnum & "*"
	end
	if ($location = "Citadel")
		send "c"
	end
	Setvar $cs $s
	Setvar $s 4
	send "'*"
	:PSDisplay
	If ($s = $cs-1)
		Goto :psAllDone
	end
	Send "." $CSInfo[$s] "*"
	add $s 1
	goto :PSDisplay
	:psAlldone
	send ".*Sector planet scan completed!***"
end
gosub :initTriggers
goto :main
:nopscanner4me
send "'*I don't have a planet scanner and there was only one planet in this sector, which I am now on.**"
gosub :initTriggers
goto :main

:deployMines
getWord CURRENTLINE $minetest 1
if ($minetest = "R") OR ($minetest = "'" & $botname)
	if ($minetest = "R")
		# R Saardu Rin mines 5 6
		#'Rin mines 3 4
		getWord CURRENTLINE $numArmids 5
		getWord CURRENTLINE $numLimps 6
	else
		getWord CURRENTLINE $numArmids 3
		getWord CURRENTLINE $numLimps 4
	end
	isNumber $test $numArmids
	if ($test = 0)
		send "'For mine deploy, please use format [mines][numArmids][numLimpets]*"
		gosub :initTriggers
		goto :main
	end
	if ($numArmids < 1)
		send "'For mine deploy, please use format [mines][numArmids][numLimpets]*"
		gosub :initTriggers
		goto :main
	end
	isNumber $test $numLimps
	if ($test = 0)
		send "'For mine deploy, please use format [mines][numArmids][numLimpets]*"
		gosub :initTriggers
		goto :main
	end
	if ($numLimps < 1)
		send "'For mine deploy, please use format [mines][numArmids][numLimpets]*"
		gosub :initTriggers
		goto :main
	end
	waitFor "ommand"
	cutText CURRENTLINE $location 1 7
	stripText $location " "
	if ($location <> "Citadel") AND ($location <> "Command")
		send "'This command must be run from the citadel or command prompt.*"
	else
		saveVar $numArmids
		saveVar $numLimps
		send "'Command acknowledged!*"
		load Rin_minedeploy.ts
	end
end
gosub :initTriggers
goto :main
pause

:reloaderOn
getWord CURRENTLINE $teston 1
getWord CURRENTLINE $reloadShields 6
if ($teston = "'" & $botname)
	getWord CURRENTLINE $reloadShields 4
end
if ($teston = "R") OR ($teston = "'" & $botname)
	lowerCase $reloadShields
	if ($reloadShields <> "y") AND ($reloadShields <> "n")
		send "'For reloader use format [reloader] [on/off] [reloadShields (y/n)]*"
		gosub :initTriggers
		goto :main
	end
	saveVar $reloadShields
	send "'*Command acknowledged! It is STRONGLY recommended that you do NOT run retaliation mode and reloader mode simultaneously!**"
	if ($reloaderMode = 1)
		send "'Reloader mode is already on!*"
		gosub :initTriggers
		goto :main
	end
	waitFor "ommand"
	setVar $reloaderMode 1
	load Rin_loader.ts
end
gosub :initTriggers
goto :main

:reloaderOff
getWord CURRENTLINE $testoff 1
if ($testoff = "R") OR ($testoff = "'" & $botname)
	setVar $reloaderMode 0
	setVar $reloadShields 0
	saveVar $reloadShields
	send "'Rin_loader script terminated!*"
	stop Rin_loader.ts
end
gosub :initTriggers
goto :main

:modeCheck
getWord CURRENTLINE $testmode 1
if ($testmode = "R") OR ($testmode = "'" & $botname)
	if ($reloaderMode = 0)
		send "'Reloader is OFF.*"
	else
		send "'Reloader is ON.*"
	end
	if ($retaliateMode = 0)
		send "'Retaliate is OFF.*"
	else
		send "'Retaliate is ON.*"
	end
	if ($furberMode = 0)
		send "'Furber is OFF.*"
	else
		send "'Furber is ON.*"
	end
	if ($SDTMode = 0)
		send "'SDT is OFF.*"
	else
		send "'SDT is ON.*"
	end
	if ($figMeMode = 0)
		send "'FigMe is OFF.*"
	else
		send "'FigMe is ON.*"
	end
	if ($photonMode = 0)
		send "'Photon is OFF.*"
	else
		send "'Photon is ON.*"
	end
end
gosub :initTriggers
goto :main

:furberOn
getWord CURRENTLINE $testfurb 1
if ($testfurb = "R")
	getWord CURRENTLINE $shipletter 6
	getWord CURRENTLINE $addholds 7
	getWord CURRENTLINE $fakeletter 8
	getWord CURRENTLINE $fakeholds 9
	getWord CURRENTLINE $depositSector 10
	getWord CURRENTLINE $depositPlanet 11
elseif ($testfurb = "'" & $botname)
	getWord CURRENTLINE $shipletter 4
	getWord CURRENTLINE $addholds 5
	getWord CURRENTLINE $fakeletter 6
	getWord CURRENTLINE $fakeholds 7
	getWord CURRENTLINE $depositSector 8
	getWord CURRENTLINE $depositPlanet 9
else
	gosub :initTriggers
	goto :main
end
getLength $shipletter $lengthSL
getLength $fakeletter $lengthFL
isNumber $testS $shipletter
isNumber $testF $fakeletter
isNumber $testSH $addholds
isNumber $testFH $fakeholds
isNumber $testDS $depositSector
isNumber $testDP $depositPlanet
if ($lengthSL > 1) OR ($lengthFL > 1)
	send "'For furber, use format [furber] [on/off] [furbshipletter] [holds2add] [fakedshipletter] [holds2add] [depositsector] [despositplanet]*"
	gosub :initTriggers
	goto :main
end
if ($testS = 1) OR ($testF = 1)
send "'For furber, use format [furber] [on/off] [furbshipletter] [holds2add] [fakedshipletter] [holds2add] [depositsector] [despositplanet]*"
	gosub :initTriggers
	goto :main
end
if ($testSH = 0)
send "'For furber, use format [furber] [on/off] [furbshipletter] [holds2add] [fakedshipletter] [holds2add] [depositsector] [despositplanet]*"
	gosub :initTriggers
	goto :main
end
if ($addholds < 1) OR ($fakeholds < 1)
send "'For furber, use format [furber] [on/off] [furbshipletter] [holds2add] [fakedshipletter] [holds2add] [depositsector] [despositplanet]*"
	gosub :initTriggers
	goto :main
end
if ($testFH = 0)
send "'For furber, use format [furber] [on/off] [furbshipletter] [holds2add] [fakedshipletter] [holds2add] [depositsector] [despositplanet]*"
	gosub :initTriggers
	goto :main
end
if ($depositSector <> "-1")
	if ($testDS = 0)
		send "'For furber, use format [furber] [on/off] [furbshipletter] [holds2add] [fakedshipletter] [holds2add] [depositsector] [despositplanet]*"
		gosub :initTriggers
		goto :main
	elseif ($depositSector < 11) OR ($despositSector > 20000)
		send "'For furber, use format [furber] [on/off] [furbshipletter] [holds2add] [fakedshipletter] [holds2add] [depositsector] [despositplanet]*"
		gosub :initTriggers
		goto :main
	end
end
if ($depositPlanet <> "-1")
	if ($testDP = 0)
		send "'For furber, use format [furber] [on/off] [furbshipletter] [holds2add] [fakedshipletter] [holds2add] [depositsector] [despositplanet]*"
		gosub :initTriggers
		goto :main
	elseif ($depositPlanet < 1)
		send "'For furber, use format [furber] [on/off] [furbshipletter] [holds2add] [fakedshipletter] [holds2add] [depositsector] [despositplanet]*"
		gosub :initTriggers
		goto :main
	end
end
setVar $furberMode 1
send "'Engaging furber!*"
saveVar $shipletter
saveVar $addholds
saveVar $fakeletter
saveVar $fakeholds
saveVar $depositSector
saveVar $depositPlanet
load Saarfurb.ts
gosub :initTriggers
goto :main

:furberOff
getWord CURRENTLINE $testfurb 1
if ($testfurb = "R") OR ($testfurb = "'" & $botname)
	setVar $furberMode 0
	setVar $shipletter 0
	setVar $addholds 0
	setVar $fakeletter 0
	setVar $fakeholds 0
	setVar $depositSector 0
	setVar $depositPlanet 0
	saveVar $shipletter
	saveVar $addholds
	saveVar $fakeletter
	saveVar $fakeholds
	saveVar $depositSector
	saveVar $depositPlanet
	stop Saarfurb.ts
	send "'SaarFurb script terminated!*"
end
gosub :initTriggers
goto :main

:pwarp
getWord CURRENTLINE $pwarptest 1
if ($pwarptest = "R")
	getWord CURRENTLINE $warpTo 5
elseif ($pwarptest = "'" & $botname)
	getWord CURRENTLINE $warpTo 3
else
	gosub :initTriggers
	goto :main
end
waitFor "ommand"
cutText CURRENTLINE $location 1 7
stripText $location " "
if ($location <> "Citadel")
	send "'This command must be run from the Citadel prompt.*"
	gosub :initTriggers
	goto :main
end
send "qd"
waitFor "Planet #"
getWord CURRENTLINE $pnum 2
stripText $pnum "#"
send "c"
send "p" & $warpTo & "*y"
send "'Planet " & $pnum & " has been moved to sector "& $warpTo & ".*"
send "'....unless of course this planet doesn't have a Planetary TransWarp Drive or no fig was there.*"
gosub :initTriggers
goto :main

:figmeOn
getWord CURRENTLINE $teston 1
getWord CURRENTLINE $numFigsToReload 6
getWord CURRENTLINE $reloadShields 7
if ($teston = "'" & $botname)
	getWord CURRENTLINE $numFigsToReload 4
	getWord CURRENTLINE $reloadShields 5
end
if ($teston = "R") OR ($teston = "'" & $botname)
	lowerCase $reloadShields
	if ($reloadShields <> "y") AND ($reloadShields <> "n")
		send "'For figme use format [figme] [on/off] [numFigsToReload per burst] [reloadShields (y/n)]*"
		gosub :initTriggers
		goto :main
	end
	isNumber $test $numFigsToReload
	if ($test = 0)
		send "'For figme use format [figme] [on/off] [numFigsToReload per burst] [reloadShields (y/n)]*"
		gosub :initTriggers
		goto :main
	end
	if ($numFigsToReload < 1)
		send "'For figme use format [figme] [on/off] [numFigsToReload per burst] [reloadShields (y/n)]*"
		gosub :initTriggers
		goto :main
	end
	saveVar $reloadShields
	saveVar $numFigsToReload
	send "'*Command acknowledged! It is STRONGLY recommended that you do NOT run retaliation mode and reloader mode simultaneously!**"
	if ($figMeMode = 1)
		send "'Figme mode is already on!*"
		gosub :initTriggers
		goto :main
	end
	waitFor "ommand"
	setVar $figMeMode 1
	load Rin_figme.ts
end
gosub :initTriggers
goto :main

:figmeOff
getWord CURRENTLINE $testoff 1
if ($testoff = "R") OR ($testoff = "'" & $botname)
	setVar $figMeMode 0
	setVar $reloadShields 0
	saveVar $reloadShields
	setVar $numFigsToReload 0
	saveVar $numFigsToReload
	send "'Rin_figme script terminated!*"
	stop Rin_figme.ts
end
gosub :initTriggers
goto :main

:photonOn
getWord CURRENTLINE $teston 1
if ($teston = "R") OR ($teston = "'" & $botname)
	if ($photonMode = 1)
		send "'Photon mode already active!*"
		gosub :initTriggers
		goto :main
	end
	send "'Command acknowledged!*"
	waitFor "ommand"
	setVar $rinbotActivated 1
	saveVar $rinbotActivated
	setVar $photonMode 1
	load _oz_improved_foton.ts
end
gosub :initTriggers
goto :main

:photonOff
getWord CURRENTLINE $testoff 1
if ($testoff = "R") OR ($testoff = "'" & $botname)
	send "'Photon script terminated!*"
	stop _oz_improved_foton.ts
	setVar $rinbotActivated 0
	saveVar $rinbotActivated
	setVar $photonMode 0
end
gosub :initTriggers
goto :main

:dispSect
getWord CURRENTLINE $testdisp 1
if ($testdisp = "R") OR ($testdisp = "'" & $botname)
	send "'Command acknowledged!*"
	waitFor "ommand"
	cutText CURRENTLINE $location 1 7
	stripText $location " "
	if ($location <> "Citadel") AND ($location <> "Command")
		send "'This command must be run from either the citadel or command prompt.*"
		goto :noDispSect
	elseif ($location = "Citadel")
	send "s"
	waitFor "Citadel command (?=help) S"
	waitFor "<Scan Sector>"
	setTextTrigger newCitadelPrompt :dispDone "Citadel command (?=help)"
		setTextTrigger minedsector :dispDone "Mined Sector: Do you wish to Avoid"
else
	send "d"
	waitFor "(?=Help)? : D"
	waitFor "<Re-Display>"
	setTextTrigger newCommandPrompt :dispDone "Command [TL="
end
	setvar $s 1
 
	:dispNextLine
	killTrigger GetdispInfo
	setTextLineTrigger GetdispInfo :dispInfo
	pause
 
	:dispInfo
	SetVar $CSInfo[$s] CURRENTLINE
	add $s 1
	Goto :dispNextLine
	Pause

	:dispDone
	Setvar $cs $s
	Setvar $s 1
	send "*"
	send "'*"
	:dispDisplay
	If ($s = $cs-1)
		Goto :dispAllDone
	end
	Send "." $CSInfo[$s] "*"
	add $s 1
	goto :dispDisplay
	:dispAlldone
	send ".*Sector display completed!**"
end
:noDispSect	
gosub :initTriggers
goto :main

:helpMenu2
getWord CURRENTLINE $helptest 1
if ($helptest = "R") OR ($helptest = "'" & $botname)
	send "'*[verse] -- gives today's Scripture memory verse!*"
	send "[do] -- executes a macro; use ^M for ENTER*[reset] -- resets bot to start*[prompt] -- gives current prompt of bot*"
	send "[checkfigs] -- refreshes fighter list*[retaliate] [on/off] -- activates/deactivates Rincrast's retaliation script; be careful with that one!*"
	send "[surround] -- activates CK's surround script deploying figs in adjacent sectors as well as trying to cap any enemy in the current sector.*"
	send "[load] [scriptname] -- starts the script name you provide; use EXACT script name and do NOT use one that has variables that require console input!*"
	send "[halt] [scriptname] -- stops a particular script*[menu3] -- displays third help menu**"
end
gosub :initTriggers
goto :main

:helpMenu3
getWord CURRENTLINE $helptest 1
if ($helptest = "R") OR ($helptest = "'" & $botname)
	send "'*[encase] [numfigs] [typeOfFigs] [deploymines] -- uses special surround script allowing you to specify number of figs deployed per sector, and what kind (single letter), and whether or not to deploy mines (y,n)*"
	send "[figsect] [numfigs] [typeOfFigs] -- deploys specified number of figs into sector over a planet.*"
	send "[SDT1] [safesector] [ship2] -- Starts Rincrast's Auto-TeamSDT script. Best to run it without planet scanners, or planet numbers will need to be entered with the 'do' command. Furbs with a furber. Type 'wait' as ship 2 for the script to wait for the first runner. Default steal factor is 21 unless changed already manually.*"
	send "[SDT2] [safesector] [class0sector] [ship2] -- Start's Rincrast's Auto-TeamSDT script. Best to run it without planet scanners, or planet numbers will need to be entered. Warps to specified class 0 sector to refurb, otherwise same as first.*"
	send "[endSDT] -- stops SDT script and also clears variables used in it; MUST be used to stop SDT script instead of 'halt'*"
	send "[reloader] [on/off] [refillShields] -- starts or stops Rincrast's Tholian Reloader script. Use y or n for the refillShields part.* [mode] -- tells you what modes of Rinbot are currently active*"
	send "[menu4] -- you guessed it, fourth help menu**"
end
gosub :initTriggers
goto :main

:helpMenu4
getWord CURRENTLINE $helptest 1
if ($helptest = "R") OR ($helptest = "'" & $botname)
	send "'*[furber] [on/off] [furbshipletter] [holds2add] [fakedshipletter]               [holds2add] [depositsector] [despositplanet] -- This will start Saarducci's furb script, which is based on CK_furb. Holds to buy must ALWAYS be more than 0, and if you do not want to deposit creds if it gets over 100M, use -1 as the values for the sector and planet numbers.*"
	send "[figme] [on/off] [numFigsToReload][reloadShields (y/n)] -- This will activate a different kind of reloader that will re-fig an ally over the planet " & $botname & " is on. Be sure only ONE ally is in the sector over the planet! GREAT to refig offline Tholian teammates or to refig Tholian ships that cannot land on a planet.*"
	send "[pwarp] [sector] -- moves planet " & $botname & " is on to the specified sector*"
	send "[photon] [on/off] -- activates/deactivates an improved fast foton script, autoreturn on, continuous on, autobuy off*"
	send "[dispsect] -- displays current sector**"
end
gosub :initTriggers
goto :main

:initTriggers
killAllTriggers
setTextLineTrigger haltScript :haltScript $botname & " stop"
setTextLineTrigger sendMess :sendMess $botname & " message"
setTextLineTrigger limpet :deployLimpet $botname & " limpet"
setTextLineTrigger help :helpMenu $botname & " help"
setTextLineTrigger clear :clearSect $botname & " clear"
setTextLineTrigger dscan :denScan $botname & " dscan"
setTextLineTrigger hscan :holoScan $botname & " hscan"
setTextLineTrigger verse :verse $botname & " verse"
setTextLineTrigger xport :useShip $botname & " useship"
setTextLineTrigger do :runMacro $botname & " do"
setTextLineTrigger reset :resetBot $botname & " reset"
setTextLineTrigger prompt :getPrompt $botname & " prompt"
setTextLineTrigger help2 :helpMenu2 $botname & " menu2"
setTextLineTrigger figs :checkFigs $botname & " checkfigs"
setTextLineTrigger rintalOn :rinTalOn $botname & " retaliate on"
setTextLineTrigger rintalOff :rinTalOff $botname & " retaliate off"
setTextLineTrigger landme :land $botname & " land"
setTextLineTrigger surround :surround $botname & " surround"
setTextLineTrigger scripton :scriptOn $botname & " load"
setTextLineTrigger scriptoff :scriptOff $botname & " halt"
setTextLineTrigger good :good $botname & " good"
setTextLineTrigger sdt1 :SDT1 $botname & " SDT1"
setTextLineTrigger sdt2 :SDT2 $botname & " SDT2"
setTextLineTrigger figsect :figsect $botname & " figsect"
setTextLineTrigger encase :encase $botname & " encase"
setTextLineTrigger list3 :helpMenu3 $botname & " menu3"
setTextLineTrigger stopSDT :stopSDT $botname & " endSDT"
setTextLineTrigger script :haveMess "script?"
setTextLineTrigger pscan :pscan $botname & " pscan"
setTextLineTrigger mines :deployMines $botname & " mines"
setTextLineTrigger reloaderon :reloaderOn $botname & " reloader on"
setTextLineTrigger reloaderoff :reloaderOff $botname & " reloader off"
setTextLineTrigger modecheck :modeCheck $botname & " mode"
setTextLineTrigger menu4 :helpMenu4 $botname & " menu4"
setTextLineTrigger furberon :furberOn $botname & " furber on"
setTextLineTrigger furberoff :furberOff $botname & " furber off"
setTextLineTrigger pwarp :pwarp $botname & " pwarp"
setTextLineTrigger figmeon :figmeOn $botname & " figme on"
setTextLineTrigger figmeoff :figmeOff $botname & " figme off"
setTextLineTrigger photonon :photonOn $botname & " photon on"
setTextLineTrigger photonoff :photonOff $botname & " photon off"
setTextLineTrigger dispsect :dispSect $botname & " dispsect"
return