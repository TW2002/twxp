setVar $supsave_phrase "SECTOR=saveme"
setVar $supsave_taphrase "help my ta"

getWord CURRENTLINE $prompt 1
if ($prompt <> "Citadel")
	clientmessage "This script must be run from the Citadel prompt"
	halt
end

:menu
echo "[2J"
:errmenu
setVar $signature_inc~scriptName "SupGSaveMe"
setVar $signature_inc~version "1.a"
setVar $signature_inc~date "04/07/2004"
gosub :signature_inc~signature
echo ANSI_15 "SupGSaveMe Settings for " GAMENAME "*"
echo ANSI_14 "1." ANSI_15 " Pickup Phrase         " ANSI_10 "["
echo ANSI_6 $supsave_phrase
echo ANSI_10 "]*"
echo ANSI_14 "2." ANSI_15 " TA Pickup Phrase      " ANSI_10 "["
echo ANSI_6 $supsave_taphrase
echo ANSI_10 "]*"
echo ANSI_5 "*Press the number of the option you*wish to change, or press" ANSI_14 " C" ANSI_5 " to continue.**"
getConsoleInput $choice singlekey
lowercase $choice
if ($choice = 1)
	getInput $supsave_phrase "Pickup phrase, use SECTOR where you want the sector number to be picked up at.  (SECTOR must be the 1st or last word in your saveme phrase)"
elseif ($choice = 2)
	getInput $supsave_taphrase "TA Pickup phrase for use when sector number is not given"
elseif ($choice = "c")
	:bot_cont
	setVAr $origphrase $supsave_phrase
	stripText $origphrase "SECTOR"
	#gosub :save
	goto :safeguy
end
goto :menu

:safeguy
send "xa"
waitFor "--------------------"
:safe
setTextLineTrigger safeguys :safeguys
pause

:safeguys
getWord CURRENTLINE $word1 1
if ($word1 = 0)
	send "Q"
	goto :top
end
cutText CURRENTLINE $person 1 40
if ($person = "P indicates Trader is on a planet in tha")
	send "q"
	send "'*SupGSaveMe running, triggers are: *  '" $supsave_phrase "' for known sector pickup*  '" $supsave_taphrase "' for TA check and pickup**"
	goto :top
else
	cutText $person $person 1 6
	setVar $trim_inc~word $person
	gosub :trim_inc~trim
	setVar $person $trim_inc~word
	setVar $safeguy[$person] 1
	goto :safe
end

:top
setTextLineTrigger saveme :saveme $origphrase
setTextLineTrigger tasaveme :tasaveme $supsave_taphrase
pause

:saveme
killtrigger tasaveme
gosub :checkSpoof
if ($spoof = 1)
	goto :top
end
cutText CURRENTLINE $line 9 999
stripText $line $origphrase
setVar $sect $line
isNumber $heh $sect
if ($heh = 0)
	goto :top
end
add $sect 1
subtract $sect 1
goto :saveit

:tasaveme
killtrigger saveme
gosub :checkSpoof
if ($spoof = 1)
	goto :top
end
send "xa"
waitFor "---------------------------"
setTextLineTrigger usersec :usersec $user
setTextLIneTrigger nothere :nothere "Corporate command"
pause

:usersec
killtrigger nothere
cutText CURRENTLINE $sect 40 6
send "q"
goto :saveit

:nothere
killtrigger usersec
goto :top

:saveit
setVar $tries 0
:sendmac
stripText $sect " "
send "p" $sect "*yp" $sect "*y  p" $sect "*y  p" $sect "*y  p" $sect "*y  p" $sect "*y  p" $sect "*y  p" $sect "*y  p" $sect "*y  p" $sect "*y  p" $sect "*y  p" $sect "*y  p" $sect "*y  p" $sect "*y  p" $sect "*y  p" $sect "*y  p" $sect "*y  p" $sect "*y  p" $sect "*y  p" $sect "*y  @"
waitFor "Average Interval Lag:"
gosub :gameinfo_inc~quikstats
if ($sect = $gameinfo_inc~quikstats[SECT])
	send "'SupGSaveMe to the rescue!*"
elseif ($tries < 4)
	add $tries 1
	send "'Cannot save, no fig down or out of fuel. Trying again.*"
	goto :sendmac
else
	send "'Unable to save you, sorry*"
end
goto :top

:checkSpoof
getWord CURRENTLINE $spoof 1
if ($spoof <> "R")
	setVar $spoof 1
else
	cutText CURRENTLINE $user 3 6
	setVar $trim_inc~word $user
	gosub :trim_inc~trim
	setVar $user $trim_inc~word
	if ($safeguy[$user] = 1)
		setVar $spoof 0
	else
		setVar $spoof 1
	end
end
return


include "supginclude\gameinfo_inc"
include "supginclude\trim_inc"
include "supginclude\signature_inc"
