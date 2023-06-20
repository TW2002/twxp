# Comm Watcher
systemscript
setvar $version "2.1.0 08/03/05"
gosub :egoBanner
echo ANSI_9 "**     " #42 #42 #42 ANSI_10 " Traitor's " ANSI_11 "PUBLIC Comm Watcher, " ANSI_3 "version: " ANSI_11 $version " " ANSI_9 #42 #42 #42 "**"
echo ANSI_10 "This script monitors incoming messages from Fed, Sub Space and Private Hails.*"
echo ANSI_10 "  It puts those transmissions into a window that shows the last 10 or so*"
echo ANSI_10 "  incoming messages.  If you send a Fed Com message, SS Chan Message, Corp*"
echo ANSI_10 "  Memo, or Computer Mail, it will also send those to the window.*"
echo ANSI_10 "  It also monitors destroyed figs and activated limpets.  It will give*"
echo ANSI_10 "  you the distance from your current sector.  The very last fig or*"
echo ANSI_10 "  limpet hit is always displayed in the window, as well as your current*"
echo ANSI_10 "  distance from that sector. (From them TO you, not your distance from them!)*"
echo ANSI_11 "REMEMBER:" ANSI_10 " ONLY destroyed figs or Offensive Fig hits are logged!*"
echo ANSI_10 "  If they retreat off a fig, or pay a toll, that doesn't get logged.*"
echo ANSI_10 "Additionally, it logs all messages in a logfile located in your twx/data dir*"
echo ANSI_10 "  This log can be reviewed online by pressing '" ANSI_11 "_" ANSI_10 "'.  Then you can look at the*"
echo ANSI_10 "  last 100, 50, 20 or all messages in the log.   All entries are timestamped.*"
echo ANSI_10 "  Replayed messages are color coded as follows for ease of review.*"
echo ANSI_11 "  Lt Blue = Sub Space, Yellow = Fed Com, Green = Priv Hail, Red = Enemy*"
echo ANSI_10 "  When you send a message, it will log it with your LOGINNAME in the twx DB,*"
echo ANSI_10 "  or the Move Helper Login Name, or it will use 'ME' if the others are blank.*"
echo ANSI_10 "If the day changes, a new log will be started. keep this in mind near *"
echo ANSI_10 "  Midnight if you are planning on reviewing messages.  You can always go*"
echo ANSI_10 "  back manually and load them in notepad or whatever.*"
echo ANSI_10 "  The path/format for the log files is: " ANSI_11 "twx\data\GAMENAME-comlog-DATE.txt*"
echo ANSI_10 "**"

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
window COMS 750 230 "Com Window"
setvar $windowString " Traitor's PUBLIC Comm Monitor Loaded!* Waiting for incoming transmissions.*"
setvar $windowString $windowString & " Press '_' to review transmission log.*"
setwindowcontents COMS $windowString

:start
setvar $comtype ""
settextlinetrigger lookForP :lookForCom "P "
settextlinetrigger lookForR :lookForCom "R "
settextlinetrigger lookForF :lookForCom "F "
settextlinetrigger fedcom :fedcom "Federation comm-link: [<ENTER> for multiple lines]"
settextlinetrigger SSchan :SSchan "Sub-space radio ("
settextlinetrigger corpMemo :corpMemo "Type corporate message"
settextlinetrigger compMail :compMail "Type M.A.I.L. message ["
settextouttrigger replay :replay "_"
settextlinetrigger reportFig :reportFig "Deployed Fighters Report Sector"
settextlinetrigger figHit :figHit "of your fighters in sector"
settextlinetrigger offFigHit :offFigHit "Your fighters in sector"
settextlinetrigger paidToll :paidToll "paid the toll of"
settextlinetrigger limpet :limpet "Limpet mine in "
pause

:fighit
gosub :figHitProcess
goto :start

:reportFig
gosub :reportFigProcess
goto :start

:offFigHit
gosub :offfigHitProcess
goto :start

:limpet
gosub :limpetProcess
goto :start

:paidToll
gosub :paidTollProcess
goto :start

:fedcom
killtrigger lookForP
killtrigger lookForR
killtrigger lookForF
killtrigger replay
killtrigger figHit
killtrigger offFigHit
killtrigger reportFig
killtrigger paidToll
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
killtrigger reportFig
killtrigger limpet
killtrigger paidToll
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
killtrigger reportFig
killtrigger paidToll
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
killtrigger reportFig
killtrigger paidToll
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
settexttrigger extraSSComLine :extraComLine "S:"
settexttrigger extraCorpMemoLine :extraComLine "C:"
settexttrigger extraCompMailLine :extraComLine "M:"
settextlinetrigger reportFigCom :reportFigCom "Deployed Fighters Report Sector"
settextlinetrigger figHitCom :figHitCom "of your fighters in sector"
settextlinetrigger offFigHitCom :offFigHitCom "Your fighters in sector"
settextlinetrigger limpetCom :limpetCom "Limpet mine in "
settextlinetrigger paidTollCom :paidTollCom "paid the toll of"
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
killtrigger reportFigCom
killtrigger limpetCom
killtrigger paidTollCom
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

:reportFigCom
setvar $templine $line
gosub :reportFigProcess
settextlinetrigger reportFigCom :reportFigCom "Deployed Fighters Report Sector"
setvar $line $templine
pause

:paidTollCom
setvar $templine $line
gosub :paidTollProcess
settextlinetrigger paidTollCom :paidTollCom "paid the toll of"
setvar $line $templine
pause

:lookForCom
killtrigger lookForP
killtrigger lookForR
killtrigger lookForF
killtrigger replay
killtrigger figHit
killtrigger offFigHit
killtrigger reportFig
killtrigger limpet
killtrigger paidToll
killtrigger fedcom
killtrigger SSchan
killtrigger corpMemo
killtrigger compMail
setvar $line CURRENTLINE
getword $line $checkCom 1
if ($checkCom = "P") OR ($checkCom = "R") OR ($checkCom = "F")
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
	setvar $numline ($numline + $coms[$count][1])
	add $count 1
end
while ($count >=1)
	if ($coms[$count] = 0)
		setvar $coms[$count] ""
	end
	setvar $comstring $comstring & $coms[$count] & "*"
	subtract $count 1
end
getdistance $distance $sector CURRENTSECTOR
setvar $windowString $comstring & "* Last Enemy Contact: " & $sector & " Hops: " & $distance & "*"
setwindowcontents COMS $windowString
return

:figHitProcess
killtrigger lookForP
killtrigger lookForR
killtrigger lookForF
killtrigger replay
killtrigger figHit
killtrigger offFigHit
killtrigger reportFig
killtrigger paidToll
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
	gettext CURRENTLINE $sector "sector " ""
	striptext $sector ":"
	getdistance $distance $sector CURRENTSECTOR
	setvar $line #42 & " Hops: " & $distance & " " & $line
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
killtrigger reportFig
killtrigger fedcom
killtrigger paidToll
killtrigger SSchan
killtrigger corpMemo
killtrigger compMail
setvar $line CURRENTLINE
getword $line $spoofCheck 1
if ($spoofCheck = "P") OR ($spoofCheck = "F") OR ($spoofCheck = "R") OR ($spoofCheck = ">")
	return
else
	getword CURRENTLINE $sector 5
	striptext $sector ":"
	getdistance $distance $sector CURRENTSECTOR
	setvar $line #42 & " Hops: " & $distance & " " & $line
	gosub :addCom2Window
	return
end

:reportFigProcess
killtrigger lookForP
killtrigger lookForR
killtrigger lookForF
killtrigger replay
killtrigger figHit
killtrigger offFigHit
killtrigger limpet
killtrigger reportFig
killtrigger fedcom
killtrigger SSchan
killtrigger paidToll
killtrigger corpMemo
killtrigger compMail
setvar $line CURRENTLINE
getword $line $spoofCheck 1
if ($spoofCheck = "P") OR ($spoofCheck = "F") OR ($spoofCheck = "R") OR ($spoofCheck = ">")
	return
else
	getword CURRENTLINE $sector 5
	striptext $sector ":"
	getdistance $distance $sector CURRENTSECTOR
	setvar $line #42 & " Hops: " & $distance & " " & $line
	gosub :addCom2Window
	return
end

:paidTollProcess
killtrigger lookForP
killtrigger lookForR
killtrigger lookForF
killtrigger replay
killtrigger figHit
killtrigger offFigHit
killtrigger reportFig
killtrigger paidToll
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
	gettext CURRENTLINE $sector "sector " ""
	striptext $sector ":"
	getdistance $distance $sector CURRENTSECTOR
	setvar $line #42 & " Hops: " & $distance & " " & $line
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
killtrigger reportFig
killtrigger limpet
killtrigger paidToll
killtrigger fedcom
killtrigger SSchan
killtrigger corpMemo
killtrigger compMail
killtrigger paidToll
setvar $line CURRENTLINE
getword $line $spoofCheck 1
if ($spoofCheck = "P") OR ($spoofCheck = "F") OR ($spoofCheck = "R") OR ($spoofCheck = ">")
	return
else
	getword CURRENTLINE $sector 4
	getdistance $distance $sector CURRENTSECTOR
	setvar $line #42 & " Hops: " & $distance & " " & $line
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
killtrigger paidToll
killtrigger limpet
killtrigger reportFig
killtrigger fedcom
killtrigger SSchan
killtrigger corpMemo
killtrigger compMail
killtrigger paidToll
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
	elseif ($commType = "Hops:") OR ($commType = #42)
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