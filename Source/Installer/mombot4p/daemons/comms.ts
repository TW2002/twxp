setvar $version "2.0.1 12/09/05"
:setup
gosub :getTime
loadvar $MH_LoginName
if ($MH_LoginName = 0) OR ($MH_LoginName = "")
	if (LOGINNAME = "")
		setvar $MH_LoginName "ME"
	else
		setvar $MH_LoginName LOGINNAME
		savevar $MH_LoginName
	end
end
setvar $startDate $year & $month & $day
setvar $logFileName "data\" & GAMENAME & "-comlog-" & $year & $month & $day & ".txt"
setvar $count 1
setvar $comstring ""
setArray $coms 10
setvar $coms[10][1] 1
setvar $coms[9][1] 1
setvar $coms[8][1] 1
setvar $coms[7][1] 1
setvar $coms[6][1] 1
setvar $coms[5][1] 1
setvar $coms[4][1] 1
setvar $coms[3][1] 1
setvar $coms[2][1] 1
setvar $coms[1][1] 1
setvar $distance 1
# setvar $currsec 1
setvar $sector 1
window COMS 750 230 "Com Window" ONTOP
setvar $windowString " Traitor's PUBLIC Comm Monitor Loaded!* Waiting for incoming transmissions.*"
setvar $windowString $windowString & " Press '_' to review transmission log.*"
setwindowcontents COMS $windowString

:start
setvar $comtype ""
killtrigger lookForP
killtrigger lookForR
killtrigger lookForF
killtrigger lookForF2
killtrigger lookForR2
killtrigger replay
killtrigger figHit
killtrigger offFigHit
killtrigger limpet
killtrigger fedcom
killtrigger SSchan
killtrigger corpMemo
killtrigger compMail
settextlinetrigger lookForP :lookForCom "P "
settextlinetrigger lookForR :lookForCom "R "
settextlinetrigger lookForR2 :lookForCom "'"
settextlinetrigger lookForF :lookForCom "F "
settextlinetrigger lookForF2 :lookForCom "`"
settextlinetrigger fedcom :fedcom "Federation comm-link: [<ENTER> for multiple lines]"
settextlinetrigger SSchan :SSchan "Sub-space radio ("
settextlinetrigger corpMemo :corpMemo "Type corporate message"
settextlinetrigger compMail :compMail "Type M.A.I.L. message ["
settextouttrigger replay :replay "_"
#settextlinetrigger figHit :figHit "of your fighters in sector"
#settextlinetrigger offFigHit :offFigHit "Your fighters in sector"
settextlinetrigger limpet :limpet "Limpet mine in "
pause

:fighit
gosub :figHitProcess
goto :start

:offFigHit
gosub :figHitProcess
goto :start

:limpet
gosub :limpetProcess
goto :start

:fedcom
killtrigger lookForP
killtrigger lookForR
killtrigger lookForF
killtrigger replay
killtrigger figHit
killtrigger offFigHit
killtrigger limpet
killtrigger fedcom
killtrigger SSchan
killtrigger corpMemo
killtrigger compMail
setvar $comType "F"
goto :comTriggers

:SSchan
killtrigger lookForP
killtrigger lookForR
killtrigger lookForF
killtrigger replay
killtrigger figHit
killtrigger offFigHit
killtrigger limpet
killtrigger fedcom
killtrigger SSchan
killtrigger corpMemo
killtrigger compMail
setvar $comType "S"
goto :comTriggers

:corpMemo
killtrigger lookForP
killtrigger lookForR
killtrigger lookForF
killtrigger replay
killtrigger figHit
killtrigger offFigHit
killtrigger limpet
killtrigger fedcom
killtrigger SSchan
killtrigger corpMemo
killtrigger compMail
setvar $comType "C"
goto :comTriggers

:compMail
killtrigger lookForP
killtrigger lookForR
killtrigger lookForF
killtrigger replay
killtrigger figHit
killtrigger offFigHit
killtrigger limpet
killtrigger fedcom
killtrigger SSchan
killtrigger corpMemo
killtrigger compMail
setvar $comType "M"
goto :comTriggers

:comTriggers
setvar $line ""
settextouttrigger comText :comText
settextlinetrigger endFedComText :endComText "Federation comm-link terminated."
settextlinetrigger endFedComText1 :endComText "Message sent on Federation comm-link."
settextlinetrigger endSSComText :endComText "Message sent on sub-space channel"
settextlinetrigger endSSComText1 :endComText "Sub-space comm-link terminated"
settextlinetrigger endCorpMemoText :endComText "CMS link terminated."
settextlinetrigger endCompMailText :endComText "GMS link terminated."
settexttrigger extraFedComLine :extraComLine "F:"
#settexttrigger extraPComLine :extraComLine "P:"
settexttrigger extraSSComLine :extraComLine "S:"
settexttrigger extraCorpMemoLine :extraComLine "C:"
settexttrigger extraCompMailLine :extraComLine "M:"
settextlinetrigger figHitCom :figHitCom "of your fighters in sector"
settextlinetrigger offFigHitCom :offFigHitCom "Your fighters in sector"
settextlinetrigger limpetCom :limpetCom "Limpet mine in "
pause

:comText
getouttext $letter
if ($letter = #13)
	if ($line = "")
		processout $letter
		pause
	else
		processout $letter
		setvar $line $comType & " " & $MH_LoginName & " " & $line
		gosub :addCom2Window
		setvar $line ""
		pause
	end
elseif ($letter = #8)
	getlength $line $length
	cuttext $line $line 0 ($length - 1)
	processout $letter
	settextouttrigger comText :comText
	pause
end
setvar $line $line & $letter
processout $letter
settextouttrigger comText :comText
pause

:extraComLine
killtrigger comText
killtrigger extraFedComLine
killtrigger extraSSComLine
killtrigger extraCorpMemoLine
killtrigger extraCompMailLine
# gosub :addCom2Window
setvar $line ""
settexttrigger extraFedComLine :extraComLine "F:"
settexttrigger extraSSComLine :extraComLine "S:"
settexttrigger extraCorpMemoLine :extraComLine "C:"
settexttrigger extraCompMailLine :extraComLine "M:"
settextouttrigger comText :comText
pause

:endComText
killtrigger comText
killtrigger extraFedComLine
killtrigger extraSSComLine
killtrigger extraCorpMemoLine
killtrigger extraCompMailLine
killtrigger endFedComText
killtrigger endFedComText1
killtrigger endSSComText
killtrigger endSSComText1
killtrigger endCorpMemoText
killtrigger endCompMailText
killtrigger figHitCom
killtrigger offFigHitCom
killtrigger limpetCom
# striptext $line #13
# gosub :addCom2Window
goto :start

:figHitCom
setvar $templine $line
gosub :figHitProcess
settextlinetrigger figHitCom :figHitCom "of your fighters in sector"
setvar $line $templine
pause

:offFigHitCom
setvar $templine $line
gosub :offFigHitProcess
settextlinetrigger offFigHitCom :offFigHitCom "Your fighters in sector"
setvar $line $templine
pause

:limpetCom
setvar $templine $line
gosub :limpetProcess
settextlinetrigger limpetCom :limpetCom "Limpet mine in "
setvar $line $templine
pause


:lookForCom
killtrigger lookForP
killtrigger lookForR
killtrigger lookForF
killtrigger lookForF2
killtrigger lookForR2
killtrigger replay
killtrigger figHit
killtrigger offFigHit
killtrigger limpet
killtrigger fedcom
killtrigger SSchan
killtrigger corpMemo
killtrigger compMail
setvar $line CURRENTLINE
getword $line $checkCom 1
if ($checkCom = "'") OR ($checkCom = "`") OR ($checkCom = "P") OR ($checkCom = "R") OR ($checkCom = "F")
	if ($checkCom = "P")
		getword $line $checkCorpScan 2
		if ($checkCorpScan = "indicates")
			goto :start
		end
	end
	gosub :addCom2Window
	goto :start
else
	goto :start
end

:addCom2Window
gosub :getTime
if ($startDate <> $year & $month & $day)
	setvar $startDate $year & $month & $day
	setvar $logFileName "data\" & GAMENAME & "-comlog-" & $year & $month & $day & ".txt"
end
write $logFileName $hour & ":" & $minute & ":" & $second & ":" & $msec & "  " &$line
getlength $line $length
setvar $numline 1
setvar $line " " & $line
if ($length > 86)
	cuttext $line $line1 1 86
	cuttext $line $line2 87 200
	setvar $line $line1 & "* " & $line2
	setvar $numline 2
end
gosub :buildComString
return

:buildComString
setvar $comstring ""
setvar $windowString ""
setvar $coms[10] $coms[9]
setvar $coms[9] $coms[8]
setvar $coms[8] $coms[7]
setvar $coms[7] $coms[6]
setvar $coms[6] $coms[5]
setvar $coms[5] $coms[4]
setvar $coms[4] $coms[3]
setvar $coms[3] $coms[2]
setvar $coms[2] $coms[1]
setvar $coms[1] $line
setvar $coms[10][1] $coms[9][1]
setvar $coms[9][1] $coms[8][1]
setvar $coms[8][1] $coms[7][1]
setvar $coms[7][1] $coms[6][1]
setvar $coms[6][1] $coms[5][1]
setvar $coms[5][1] $coms[4][1]
setvar $coms[4][1] $coms[3][1]
setvar $coms[3][1] $coms[2][1]
setvar $coms[2][1] $coms[1][1]
setvar $coms[1][1] $numline
setvar $count 2
while ($numline < 9) AND ($count < 10)
#	echo ansi_10 "*" $numline " " $count
	setvar $numline ($numline + $coms[$count][1])
	add $count 1
end
# echo ansi_10 "****"
while ($count >=1)
	if ($coms[$count] = 0)
		setvar $coms[$count] ""
	end
	setvar $comstring $comstring & $coms[$count] & "*"
	subtract $count 1
end

setvar $windowString $comstring 
setwindowcontents COMS $windowString
return

:figHitProcess
killtrigger lookForP
killtrigger lookForR
killtrigger lookForF
killtrigger replay
killtrigger figHit
killtrigger offFigHit
killtrigger limpet
killtrigger fedcom
killtrigger SSchan
killtrigger corpMemo
killtrigger compMail
setvar $line CURRENTLINE
getword $line $spoofCheck 1
if ($spoofCheck = "P") OR ($spoofCheck = "F") OR ($spoofCheck = "R") OR ($spoofCheck = ">")
	return
else
	#gettext CURRENTLINE $sector "sector " ""
	#striptext $sector ":"
	#getdistance $distance $sector CURRENTSECTOR
	#setvar $line " Hops: " & $distance & " " & $line
	gosub :addCom2Window
	return
end

:offFigHitProcess
killtrigger lookForP
killtrigger lookForR
killtrigger lookForF
killtrigger replay
killtrigger figHit
killtrigger offFigHit
killtrigger limpet
killtrigger fedcom
killtrigger SSchan
killtrigger corpMemo
killtrigger compMail
setvar $line CURRENTLINE
getword $line $spoofCheck 1
if ($spoofCheck = "P") OR ($spoofCheck = "F") OR ($spoofCheck = "R") OR ($spoofCheck = ">")
	return
else
	#getword CURRENTLINE $sector 5
	#striptext $sector ":"
	#getdistance $distance $sector CURRENTSECTOR
	#setvar $line " Hops: " & $distance & " " & $line
	gosub :addCom2Window
	return
end

:limpetProcess
killtrigger lookForP
killtrigger lookForR
killtrigger lookForF
killtrigger replay
killtrigger figHit
killtrigger offFigHit
killtrigger limpet
killtrigger fedcom
killtrigger SSchan
killtrigger corpMemo
killtrigger compMail
setvar $line CURRENTLINE
getword $line $spoofCheck 1
if ($spoofCheck = "P") OR ($spoofCheck = "F") OR ($spoofCheck = "R") OR ($spoofCheck = ">")
	return
else
	#getword CURRENTLINE $sector 4
	#getdistance $distance $sector CURRENTSECTOR
	#setvar $line " Hops: " & $distance & " " & $line
	gosub :addCom2Window
	return
end

:replay
killtrigger lookForP
killtrigger lookForR
killtrigger lookForF
killtrigger replay
killtrigger figHit
killtrigger offFigHit
killtrigger limpet
killtrigger fedcom
killtrigger SSchan
killtrigger corpMemo
killtrigger compMail
fileexists $yn $logFileName
if ($yn = FALSE)
	echo ANSI_12 "**No Comm Log File Exists. As soon as a message is recieved, it will be created.**"
	goto :start
end
echo ANSI_10 "**Show last 20 entries (2), last 50 (5), last 100 (1), or show all (a)? " ANSI_11 "(1,2,5,a)*"
getconsoleinput $showLast SINGLEKEY
if ($showLast = 2) OR ($showLast = 5) OR ($showLast = "a") OR ($showLast = "1")
	goto :buildLogDisplay
else
	goto :start
end

:buildLogDisplay
setvar $fileLine ""
setvar $logLength 1
while ($fileline <> EOF)
	read $logFileName $fileLine $logLength
	add $logLength 1
end
if ($logLength < 20) OR ($showLast = "a")
	setvar $count 1
	goto :displayLog
elseif ($logLength < 50) AND ($showLast = 5)
	setvar $count 1
	goto :displayLog
elseif ($logLength < 100) AND ($showLast = 1)
	setvar $count 1
	goto :displayLog
elseif ($showLast = 1)
	setvar $count ($logLength - 101)
	goto :displayLog
elseif ($showLast = 5)
	setvar $count ($logLength - 51)
	goto :displayLog
else
	setvar $count ($logLength - 21)
	goto :displayLog
end

:displayLog
setvar $fileLine ""
echo ANSI_10 "*Comm Log:*"
while ($fileLine <> EOF)
	read $logFileName $fileLine $count
	getword $fileline $commType 2
	if ($commType = "P")
		echo ANSI_10 $fileLine "*"
	elseif ($commType = "R")
		echo ANSI_11 $fileLine "*"
	elseif ($commType = "Hops:")
		echo ANSI_12 $fileLine "*"
	else
		echo ANSI_14 $fileLine "*"
	end
	add $count 1
end
goto :start

# ----====[Get the date and time ]====----
# creates a unique number timestamp
# if time/date is 10:50:00am 9/15/05 then output = 20050915105000
# if time/date is 5:33:22pm 9/15/05 then output = 20050915173322
:getTime
getTime $dateTime "yyyymmddhhnnsszzz am/pm"
getword $dateTime $amPMcheck 2
getword $dateTime $finalTime 1
cuttext $finalTime $12check 9 2
if ($amPMcheck = "pm")
	if ($12check <> 12)
		add $finalTime 120000000
	end
end
cuttext $finalTime $year 1 4
cuttext $finalTime $month 5 2
cuttext $finalTime $day 7 2
cuttext $finalTime $hour 9 2
cuttext $finalTime $minute 11 2
cuttext $finalTime $second 13 2
cuttext $finalTime $msec 15 3
# echo ANSI_10 "*" $finalTime
# echo ANSI_10 "**" $month "/" $day "/" $year " - " $hour ":" $minute ":" $second
# echo ANSI_10 "*Date: " DATE " Time: " TIME "*"
return

#-----------------------------------
# ----====[ BANNER SECTION ]====----
#-----------------------------------
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

halt
