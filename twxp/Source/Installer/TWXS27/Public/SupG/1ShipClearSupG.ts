cutText CURRENTLINE $location 1 7
if ($location <> "Citadel")
	clientMessage "This Script must be run from either the Citadel prompt"
	halt
end

gosub :gameinfo_inc~quikstats
if ($gameinfo_inc~quikstats[LRS] <> "Holo")
	if ($botloaded)
		send "(SupG1ShipClear): Cannot run script, no holo scanner."
	end
	clientMessage "This script requires a holo scanner to run."
	halt
end

loadVar $supg1clear
if ($supg1clear)
	loadVar $1clear_phrase
	loadVar $1clear_turnlimit
else
	setVar $1clear_phrase "SECTOR=saveme"
	setVar $1clear_turnlimit 50
end
gosub :save

:menu
echo "[2J"
:errmenu
setVar $signature_inc~scriptName "The Unknown - 1ShipClear"
setVar $signature_inc~version "1.b"
setVar $signature_inc~date "02/22/2004"
gosub :signature_inc~signature
echo ANSI_15 "SupG1ShipClear Settings for " GAMENAME "*"
echo ANSI_14 "1." ANSI_15 " Pickup Phrase         " ANSI_10 "["
echo ANSI_6 $1clear_phrase
echo ANSI_10 "]*"
echo ANSI_14 "2." ANSI_15 " Turn Limit            " ANSI_10 "["
echo ANSI_6 $1clear_turnlimit
echo ANSI_10 "]*"
echo ANSI_14 "3." ANSI_15 " Add Target Priority   " ANSI_10 "["
setVar $priCnt 0
:priCnter
if ($priCnt < $numpri)
	add $priCnt 1
	if ($priCnt > 1)
		echo ", "
	end
	echo ANSI_6 $priorities[$priCnt]
	goto :priCnter
end
if ($numpri = 0)
	echo "No priority"
end
echo ANSI_10 "]*"
echo ANSI_14 "4." ANSI_15 " Add Avoid Target      " ANSI_10 "["
setVar $avoidCnt 0
:avoidCnter
if ($avoidCnt < $numavoid)
	add $avoidCnt 1
	if ($avoidCnt > 1)
		echo ", "
	end
	echo ANSI_6 $avoids[$avoidCnt]
	goto :avoidCnter
end
if ($numavoid = 0)
	echo "No avoids"
end
echo ANSI_10 "]*"
echo ANSI_5 "*Press the number of the option you*wish to change, or press" ANSI_14 " C" ANSI_5 " to continue.**"
getConsoleInput $choice singlekey
lowercase $choice
if ($choice = 1)
	getInput $1clear_phrase "Pickup phrase, use SECTOR where you want the sector number to be picked up at."
elseif ($choice = 2)
	getInput $1clear_turnLimit "Enter Turn Limit"
	isNumber $chk $1clear_turnLimit
	if ($chk = 0)
		setVar $1clear_turnLimit 50
	end
elseif ($choice = 3)
	getInput $snumber "Target Corp number, or name of the person who's figs you want to target."
	add $numpri 1
	setVar $priorities[$numpri] $snumber
	setVAr $prilist[$snumber] $numpri
elseif ($choice = 4)
	getInput $snumber "Avoid Corp number, or name of the person who's figs you want to avoid."
	add $numavoid 1
	setVar $avoids[$numavoid] $snumber
	setVAr $avoidlist[$snumber] $numavoid
elseif ($choice = "c")
	:bot_cont
	setVAr $origphrase $1clear_phrase
	gosub :save
	goto :top	
end
goto :menu

:top
send "qd"
setTextLineTrigger pnum :pnum "Planet #"
pause

:pnum
getword CURRENTLINE $1clear_pnum 2
stripText $1clear_pnum "#"

setTextTrigger twpow :twpow "TransWarp power"
setTextTrigger notw :notw "Planet command"
pause

:notw
killtrigger twpow
if ($botloaded)
	send "'(SupG1ShipClear): Script halting, this planet does not have pwarp."
end
clientmessage "This script needs to be started on the pickup planet, this planet does not have pwarp."
halt

:twpow
killtrigger notw
setVar $figfile GAMENAME & "_FIGLIST.txt"
setVar $nearfig_inc~figfile $figfile
fileExists $figlchk $figfile
if ($figlchk = 1) AND ($botloaded = 0)
	read $figFile $lastrefresh 1
	echo ANSI_15 "*Fighter list was last refreshed : " $lastrefresh ", would you like to refresh the list?"
	getConsoleInput $flu singlekey
	lowercase $flu
	if ($flu = "y")
		send "q"
		gosub :nearfig_inc~figrefresh
		send "l" $1clear_pnum "*c"
	else
		clientmessage "Reading fighter list"
		gosub :nearfig_inc~readfigfile
		send "C"
	end
else
	send "q"
	gosub :nearfig_inc~figrefresh
	send "l" $1clear_pnum "*c"
end

setVar $heh 0
while ($heh < 10)
	add $heh 1
	setVar $nearfig_inc~figlist[$heh] 3
end
setVar $nearfig_inc~figlist[STARDOCK] 3

send "c;"
setTextLineTrigger offodds :offodds "Offensive Odds:"
pause

:offodds
setVar $line CURRENTLINE
stripText $line "Main Drive Cost:"
stripText $line "Max Fighters:"
stripText $line "Offensive Odds:"
getWord $line $offodds 3
stripText $offodds ":1"
stripText $offodds "."

setTextLineTrigger maxfigs :maxper "Max Figs Per Attack:"
pause

:maxper
setVar $line CURRENTLINE
stripText $line "Max Figs Per Attack:"
getWord $line $maxper 1
send "q"
goto :pausing

:begin
setVar $courseTargetErr 0
gosub :killtriggers
killtrigger pentered
setTextLineTrigger pentered :PlanetWarpedIn " has just materialized from the void!"
gosub :gameinfo_inc~quikstats
setVar $currentsector $gameinfo_inc~quikstats[SECT]
setVar $totalfigs ($gameinfo_inc~quikstats[FIGS] - 109)
if ($gameinfo_inc~quikstats[TURNS] < $1clear_turnlimit)
	send "'(SupG1ShipClear): Turn limit hit, halting.*"
	halt
end
send "qqfz101*zcd*  sd"
waitFor "----------------"
waitFor "Command [TL="
send "sh"
waitFor "[D] H"
waitFor "Command [TL="
send "fz109*zcd*l  "&$1clear_pnum&"*  m**"
waitFor "Max) ["
getText CURRENTLINE $figstake "take (" " Max) ["
if ($figstake > 109)
	setVAr $figstake ($figstake - 109)
	send $figstake "*"
else
	send "0*"
end
send "c"
waitFor "Citadel command"
gosub :examineAdj

if ($courseTarget <> 0) AND ($courseTargetErr = 1)
	goto :pausing
elseif ($courseTargetErr = 0) AND ($currentsector = $courseTarget)
	send "'(SupG1ShipClear):  Reached destination... Pausing script...*"
	setVar $courseTarget 0
	goto :pausing
end

if ($goodsector = 0)
	:getNearfig
	if ($courseTarget = 0) 
		setVar $nearfig_inc~command "nofig"
		setVar $nearfig_inc~origsec $currentsector
		gosub :nearfig_inc~closefig
	else
		setVar $nearfig_inc~result $courseTarget
	end
	setVar $nearfig_inc~command 0
	if ($nearfig_inc~result > 0)
		setVar $nearfig_inc~origsec $nearfig_inc~result
	else
		send "'(SupG1ShipClear): Pausing Script... No more sectors to clear...*"
		goto :pausing
	end
	gosub :nearfig_inc~closefig
	if ($nearfig_inc~result > 0)
		if ($nearfig_inc~result = $currentsector)
			if ($courseTarget <> 0)
				send "'(SupG1ShipClear):  Cannot find closer sector to continue, pausing script...*"
				goto :pausing
			end			
			add $noWarp 1
			if ($noWarp > 10)
				send "'(SupG1ShipClear): Pausing halting... Couldn't find another available sector to clear in 10 tries...*"
				goto :pausing
			else
				getRnd $currentsector 11 SECTORS
				goto :getNearfig
			end
		else
			setVar $noWarp 0
			setVar $planet_inc~pwarpto $nearfig_inc~result
		end
	else
		send "'(SupG1ShipClear): Pausing script...  Need more cim data...*"
		goto :pausing
	end
	send "'(SupG1ShipClear):  Pwarping to " $nearfig_inc~result ".*"
	gosub :planet_inc~pwarp
	if ($pwarpto < 0)
		setVar $nearfig_inc~figlist[$nearfig_inc~result] 0
		goto :getNearfig
	end
	killtrigger pentered
	goto :begin
end
getRnd $rand_scandelay 5000 20000
send "'*(SupG1ShipClear): Clearing sector "&$goodsector&" in "&$rand_scandelay&" milliseconds.*"
send "    You may PAUSE or STOP the script within this time*    or say COURSE=sectornumber in subspace to plot a course.*"
waitfor "plot a course."
if ($courseTarget <> 0)
	send "(SupG1ShipClear):  Currently in course mode : " $courseTarget ".*    To return to normal mode, type COURSE=0*"
	waitFor "type COURSE=0"
end
SEND "*"
echo ANSI_12 "** USER: " ANSI_15 "You may (p)ause or (s)top the script within this time, or press c to plot a course.*"     
setDelayTrigger scandelay :clearsec $rand_scandelay
setTextLineTrigger pausescript :pausescript "PAUSE"
setTextLineTrigger stopscript :stopscript "STOP"
setTextLineTrigger setcourse :setcourse "COURSE="
setTextOutTrigger userpause :pausing "p"
setTextOutTrigger userstop :stopscript_u "s"
setTextOuttrigger usercourse :inputcourse "c"
pause

:clearsec
gosub :killtriggers
send "qqfz101*cd"
if ($goodsectorDens > 499)
	send "sh"
	waitFor "[D] H"
	waitFor "Command [TL="
	if (SECTOR.PLANETCOUNT[$goodsector] > 0)
		send "l" $1clear_pnum "*c"
		send "'(SupG1ShipClear): Planet warped into target sector... Aborting warp... Pausing Script...*"
		goto :pausing
	end
else
	send "sd"
	waitFor "------"
	waitFor "Command [TL="
	if (SECTOR.DENSITY[$goodsector] <> $goodsectorDens)
		send "l" $1clear_pnum "*c"
		send "'(SupG1ShipClear): Density changed in target sector... Aborting warp... Pausing script*"
		goto :pausing
	end
end

killtrigger pentered
setVar $1clear_phrase $origphrase
replaceText $1clear_phrase "SECTOR" $goodsector
if ($totalfigs >= $maxper)
	setVAr $figstosend $maxper
else
	setVar $figstosend $totalfigs
end
send "'" $1clear_phrase "*m"&$goodsector&"*  *  any" & $figstosend & "*  *  fz109*  zcd*  h1z1*  zc*  h2z1*  zc*  l"&$1clear_pnum&"*nn*l"&$1clear_pnum&"*nn*l"&$1clear_pnum&"*nn*l"&$1clear_pnum&"*nn*l"&$1clear_pnum&"*nn*l"&$1clear_pnum&"*nn*l"&$1clear_pnum&"*nn*l"&$1clear_pnum&"*nn*l"&$1clear_pnum&"*nn*l"&$1clear_pnum&"*nn*@"      
setTextTrigger plancom :landedplan "Planet command ("
setTextTrigger intlag :notlanded "Average Interval Lag:"
pause

:notlanded
send "'(SupG1ShipClear): Error, no planet.  Script aborting.  HELP!*"
halt
        
:landedplan
setVar $nearfig_inc~figlist[$goodsector] 1
killTrigger intlag
send "cs"
waitFor "<Scan Sector>"
waitFor "Citadel command"
if (SECTOR.PLANETCOUNT[$goodsector] > 1)
	send "'(SupG1ShipClear): Planet warped into target sector... Aborting warp... Pausing Script...*"
	goto :pausing
end
setDelayTrigger scandelay :begin 5000
setTextLineTrigger pentered :PlanetWarpedIn " has just materialized from the void!"
pause
  
:examineAdj
if ($totalfigs >= $maxper)
	setVar $cankill (($maxper * $offodds) / 10)
else
	setVar $cankill (($totalfigs * $offodds) / 10)
end
setVar $cnt 0
setVar $goodsector 0
setVar $goodsectPri 0
if ($courseTarget <> 0) AND ($courseTarget <> $currentsector)
	getCourse $lane $currentsector $courseTarget
	setVar $adj $lane[2]
	if ($adj > 0) AND ($adj < 11) OR ($adj = STARDOCK)
		send "'(SupG1ShipClear): Error, course goes thru fedspace. *"
		return
	end
	goto :cntfigs
end
	
:cnt
if ($cnt < SECTOR.WARPCOUNT[$currentsector])
	add $cnt 1
	setVar $pos 0
	setVar $adj SECTOR.WARPS[$currentsector][$cnt]
	:cntfigs
	if (SECTOR.FIGS.QUANTITY[$adj] > 0)
		setVAr $owner SECTOR.FIGS.OWNER[$adj] 	
		getWordPos SECTOR.FIGS.OWNER[$adj] $pos "Corp#"
		if ($pos > 0)
			getText $owner $enemy "Corp#" ","
			if (SECTOR.FIGS.QUANTITY[$adj] > $cankill)
				write GAMENAME & "_hidens.txt" $adj & " " & SECTOR.FIGS.QUANTITY[$adj] & " figs in sector."
				setVar $nearfig_inc~figlist[$adj] 3
				if ($courseTarget <> 0)
					send "'(SupG1ShipClear): Cannot continue course, too many fighters in sector.*"
					return
				else
					goto :cnt
				end
			end
		else
			stripText $owner "belong to "
			if ($owner <> "your Corp") AND ($owner <> "yours")
				setVar $enemy $owner
				if (SECTOR.FIGS.QUANTITY[$adj] > $cankill)
					write GAMENAME & "_hidens.txt" $adj & " " & SECTOR.FIGS.QUANTITY[$adj] & " figs in sector."
					setVar $nearfig_inc~figlist[$adj] 3
					if ($courseTarget <> 0)
						send "'(SupG1ShipClear): Cannot continue course, too many fighters in sector.*"
						return
					else
						goto :cnt
					end
				end
			else
				setVar $nearfig_inc~figlist[$adj] 1
			end
		end
		if (SECTOR.PLANETCOUNT[$adj] > 0)
			setVar $nearfig_inc~figlist[$adj] 3
			if ($courseTarget <> 0)
				send "'(SupG1ShipClear): Cannot continue course, planets in sector.  Pausing script...*"
				return
			else
				goto :cnt
			end
		end
	else
		setVar $enemy 0
	end
	gosub :determinePriority
	if ($courseTarget <> 0)
		return
	else
		goto :cnt
	end
end
return

:determinePriority
if (SECTOR.PLANETCOUNT[$adj] = 0) AND ($nearfig_inc~figlist[$adj] = 0)
	if ($numpri > 0) AND ($courseTarget = 0)
		if ($avoidlist[$enemy] = 0)
			if ($goodsectPri > 0)
				if ($priList[$enemy] < $goodsectPri) AND ($enemy <> 0) 
					setVar $goodsector $adj
					setVar $goodsectPri $priList[$enemy]
					setVar $goodsectorDens SECTOR.DENSITY[$adj]
				end
				if ($enemy = 0)
					setVar $weight ($numpri + 1)
					if ($weight < $goodsectPri)
						setVar $goodsector $adj
						setVar $goodsectPri $weight
						setVar $goodsectorDens SECTOR.DENSITY[$adj]
					end
				end
			else
				
				setVar $goodsector $adj 
				setVar $goodsectorDens SECTOR.DENSITY[$adj]
				if ($priList[$enemy] = 0)
					setVar $goodsectPri ($numpri + 1)
				else
					setVar $goodsectPri $priList[$enemy]
				end
			end
		end
	else
		if ($avoidlist[$enemy] = 0) OR ($courseTarget <> 0)
			setVar $goodsector $adj
			setVar $goodsectorDens SECTOR.DENSITY[$adj]
		else
			setVar $nearfig_inc~figlist[$adj] 3
		
		end
	end
end
return

:planetWarpedIn
send "'(SupG1ShipClear): Planet warped in... Pausing...*"
send "l" $1clear_pnum "*c"
goto :pausing

:save
saveVar $1clear_phrase
saveVar $1clear_turnlimit

setVar $supg1clear 1

saveVar $supg1clear
return

:checkSpoof
getWord CURRENTLINE $chk 1
if ($chk <> "R")
	setVar $spoof 1
else
	setVar $spoof 0
end
return


:pausescript
gosub :checkSpoof
if ($spoof = 1)
	send "'(SupG1ShipClear): Spoof attempt... Restarting from current sector...*"
	goto :begin
end
:pausing
gosub :killtriggers
send "'*(SupG1ShipClear): Script is paused...  Available options are RESUME,       STOP, or COURSE=sectornumber to plot a course.*"
waitfor "plot a course"
if ($courseTarget <> 0)
	send "(SupG1ShipClear):  Currently in course mode : " $courseTarget ".*    To return to normal mode, type COURSE=0*"
	waitFor "type COURSE=0"
end
send "*"
echo ANSI_12 "** USER: " ANSI_15 "You may (r)esume or (s)top the script, or press c to plot a course.*"
setTextLineTrigger stopscript :stopscript_p "STOP"
setTextLineTrigger setcourse :setcourse_p "COURSE="
setTextLineTrigger resume :resume "RESUME"
setTextOutTrigger userresume :resume_u "r"
setTextOutTrigger userstop :stopscript_u "s"
setTextOuttrigger usercourse :inputcourse "c"
pause

:resume
gosub :killtriggers
gosub :checkSpoof
if ($spoof = 1)
	send "'(SupG1ShipClear): Spoof attempt... Resuming pause...*"
	goto :pausing
else
:resume_u
	send "'(SupG1ShipClear): Resuming...*"
	gosub :killtriggers
	goto :begin
end

:stopscript_p
gosub :killtriggers
if ($spoof = 1)
	send "'(SupG1ShipClear): Spoof attempt... Resuming pause...*"
	goto :pausing
else
	send "'(SupG1ShipClear): Halting Script...*"
	halt
end

:setcourse_p
gosub :killtriggers
if ($spoof = 1)
	send "'(SupG1ShipClear): Spoof attempt... Resuming pause...*"
	goto :pausing
else
	cutText CURRENTLINE $coursetarget 9 9999
	getWord $coursetarget $coursetarget 1
	getWordPos $coursetarget $pos "COURSE="
	stripText $courseTarget "COURSE="
	isNumber $num $coursetarget
	if ($pos > 0) and ($num)
		if ($coursetarget > 10) and ($coursetarget <= SECTORS) AND ($coursetarget <> STARDOCK)
			send "'(SupG1ShipClear): Setting course for " $coursetarget ".*"
			goto :begin
		else
			setVar $coursetarget 0
			send "'(SupG1ShipClear): Invalid sector number for course. Resuming pause...*"
			goto :pausing
		end
	else
		setVar $coursetarget 0
		send "'(SupG1ShipClear): Invalid sector number for course. Resuming pause...*"
		goto :pausing
	end
end

:stopscript
if ($spoof = 1)
	gosub :killtriggers
	send "'(SupG1ShipClear): Spoof attempt... Restarting from current sector...*"
	goto :begin
else
:stopscript_u
	send "'(SupG1ShipClear): Halting Script...*"
	halt
end

:setcourse
gosub :killtriggers
if ($spoof = 1)
	send "'(SupG1ShipClear): Spoof attempt... Restarting from current sector...*"
	goto :begin
else
	cutText CURRENTLINE $coursetarget 9 9999
	getWord $coursetarget $coursetarget 1
	getWordPos $coursetarget $pos "COURSE="
	stripText $courseTarget "COURSE="
	isNumber $num $coursetarget
	if ($pos > 0) and ($num)
		if ($courseTarget = 0)
			send "'(SupG1ShipClear): Restoring all priorities and avoids... Resuming normal operation.*"
			goto :begin
		end
		if ($coursetarget > 10) and ($coursetarget <= SECTORS) AND ($coursetarget <> STARDOCK)
			send "'(SupG1ShipClear): Clearing all priorities and avoids... Setting course for " $coursetarget ".*"
			send "cf*" $courseTarget "*"
			waitFor "Computed."
			waitFor "Computer"
			send "q"
			goto :begin
		else
			setVar $coursetarget 0
			send "'(SupG1ShipClear): Invalid sector number for course. Restarting from current sector...*"
			goto :begin
		end
	else
		setVar $coursetarget 0
		send "'(SupG1ShipClear): Invalid sector number for course. Restarting from current sector...*"
		goto :begin
	end
end

:inputcourse
gosub :killtriggers
echo ANSI_15 "**Enter sector number to clear to.*"
getConsoleinput $courseTarget
isNumber $num $coursetarget
if ($num)
	if ($courseTarget = 0)
		send "'(SupG1ShipClear): Restoring all priorities and avoids... Resuming normal operation.*"
		goto :begin
	end
	if ($coursetarget > 10) and ($coursetarget <= SECTORS) AND ($coursetarget <> STARDOCK)
		send "'(SupG1ShipClear): Clearing all priorities and avoids... Setting course for " $coursetarget ".*"
		send "cf*" $courseTarget "*"
		waitFor "Computed."
		waitFor "Computer"
		send "q"
		goto :begin
	else
		setVar $coursetarget 0
		goto :inputcourse
	end
else
	setVar $courseTarget 0
	goto :inputcourse
end

:killtriggers
killtrigger resume
killtrigger scandelay
killtrigger pausescript
killtrigger stopscript
killtrigger setcourse
killtrigger userpause
killtrigger userstop
killtrigger usercourse
killtrigger userresume
return

:inputcourse
gosub :killtriggers
halt

include "supginclude\gameinfo_inc"
include "supginclude\nearfig_inc"
include "supginclude\planet_inc"
include "supginclude\signature_inc"