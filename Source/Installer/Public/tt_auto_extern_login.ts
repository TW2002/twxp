# Traitor's AFK RED Extern Log on/off script
setvar $version "2.1 9/13/05"

:Instructions
gosub :egoBanner
echo ANSI_12 "*-----------------------------------------------------------------------------"
echo ANSI_11 "*              Traitor's AFK RED Extern Log on/off script*"
echo ANSI_10 "                         Version: " ANSI_11 $version
echo ANSI_10 "*               Load this script while you are " ANSI_11 "off-line!*"
loadvar $TEL_ranOnce
if ($TEL_ranOnce = 0)
	gosub :help
else
	echo ANSI_10 "*Do you need instructions?: (y/n)"
	getconsoleinput $yn SINGLEKEY
	if ($yn = "y")
		gosub :help
	end
	loadvar $TEL_enterTime
	loadvar $TEL_exitTime
end
goto :checkPlayerInfo

:checkPlayerInfo
loadvar $TEL_playerName
loadvar $TEL_password
loadvar $TEL_gameLetter
if ($TEL_playerName = "0") OR ($TEL_password = "0") OR ($TEL_gameLetter = "0")
	if (LOGINNAME = "") OR (PASSWORD = "") OR (GAME = "")
		getinput $TEL_playerName ANSI_10 & "Enter your Login Name (not your game name!): "
		getinput $TEL_password ANSI_10 & "Enter your game password: "
		echo ANSI_10 "*Enter the game letter: "
		getconsoleinput $TEL_gameLetter SINGLEKEY
		echo ANSI_10 "**Login Name: " ANSI_11 $TEL_playerName
		echo ANSI_10 "*Password: " ANSI_11 $TEL_password
		echo ANSI_10 "*Game Letter: " ANSI_11 $TEL_gameLetter
		echo ANSI_10 "*Are these correct? (y/n): "
		getconsoleinput $yn SINGLEKEY
		if ($yn = "y")
			savevar $TEL_playerName
			savevar $TEL_password
			savevar $TEL_gameLetter
			setvar $TEL_ranOnce 1
			savevar $TEL_ranOnce
			goto :askTime
		else
			setvar $TEL_playerName 0
			setvar $TEL_password 0
			setvar $TEL_gameLetter 0
			goto :checkPlayerInfo
		end
	else
		setvar $TEL_playerName LOGINNAME
		setvar $TEL_password PASSWORD
		setvar $TEL_gameLetter GAME
		setvar $TEL_ranOnce 1
		savevar $TEL_ranOnce
	end
end

:askTime
if ($TEL_enterTime = 0) OR ($TEL_exitTime = 0) OR ($resetTime = 1)
	echo ANSI_10 "**The Current Time is " ANSI_11 TIME "*"
	getinput $TEL_enterTime ANSI_10 & "Enter time you want to enter game: (in System Format: HH:MM:SS AM/PM)"
	uppercase $TEL_enterTime
	getinput $TEL_exitTime ANSI_10 & "Enter number of minutes to stay on: (in minutes!)"
	echo ANSI_10 "**Script will connect to the server at: " ANSI_11 $TEL_enterTime ANSI_10 " and stay on for " ANSI_11 $TEL_exitTime ANSI_10 " minutes*"
	echo ANSI_10 "Is this correct? (y/n): "
	getconsoleinput $yn SINGLEKEY
	savevar $TEL_exitTime
	savevar $TEL_enterTime
	if ($yn = "n")
		goto :askTime
	else
		goto :getTime
	end
else
	echo ANSI_10 "**The Current Time is " ANSI_11 TIME "*"
	echo ANSI_10 "*Previously, you used " ANSI_11 $TEL_enterTime ANSI_10 " as the log on time.*"
	echo ANSI_10 "And you waited for " ANSI_11 $TEL_exitTime ANSI_10 " minutes before log off.*"
	echo ANSI_10 "Do you want to use those values again? (y/n):"
	getconsoleinput $yn SINGLEKEY
	if ($yn = "y")
		goto :getTime
	else
		setvar $resetTime 1
		goto :askTime
	end
end

:getTime
echo ANSI_10 "**Waiting until " ANSI_11 $TEL_enterTime ANSI_10 " to autolog on.*"
seteventtrigger autologin :autologin "TIME HIT" $TEL_enterTime
pause

:autologin
killtrigger autologin
CONNECT
seteventtrigger connected :connected "CONNECTION ACCEPTED"
setdelaytrigger connectTimeout :connectTimeout 10000
pause

:connectTimeout
killalltriggers
if ($failedAttempts > 5)
	goto :serverDown
end
add $failedAttempts 1
goto :autologin

:serverDown
echo ANSI_12 "*****" #42 #42 #42 "CAN'T CONNECT TO SERVER!!!" #42 #42 #42 "*"
echo ANSI_12 "I have tried to connect 5 times, and timed out each time.*"
echo ANSI_12 "The server is likely down.*"
echo ANSI_12 "Halting script!  *Pray your cloak holds, and you don't get towed*"
echo ANSI_12 "once extern does run.*"
halt

:connected
killtrigger connectTimeout
killtrigger connected
seteventtrigger lostConnection :lostConnection "CONNECTION LOST"
settexttrigger enterName :enterName "Please enter your name"
pause

:lostConnection
killalltriggers
echo ANSI_12 "*****" #42 #42 #42 "CONNECTION LOST!!!" #42 #42 #42 "*"
echo ANSI_12 "Attempting to reconnect!*Time to cross your fingers!*"
add $reconnectAttempt 1
if ($reconnectAttempt > 10)
	goto :reconnectfail
end
echo ANSI_12 "This is reconnect attempt: " ANSI_11 $reconnectAttempt "!***"
gosub :delay2sec
goto :autologin

:reconnectfail
echo ANSI_12 "*****" #42 #42 #42 "CAN'T CONNECT TO SERVER!!!" #42 #42 #42 "*"
echo ANSI_12 "I have connected and lost the connection to the server 10 times!*"
echo ANSI_12 "The server is likely down.*"
echo ANSI_12 "Halting script!  *Pray your cloak holds, and you don't get towed*"
echo ANSI_12 "once extern does run.*"

:enterName
killtrigger enterName
send $TEL_playerName "*"
waitfor "Server registered to"
send $TEL_gameLetter
waitfor "[Pause]"
send "*  "
waitfor "Enter your choice:"
send "t*n*" $TEL_password "*  *  *  p  s "

:waitOutTern
waitfor "<StarDock>"
send "'*.*Running Traitor's Extern Auto Log On/Off Script.*"
send "I am currently AFK.  I will cloak out in " $TEL_exitTime " minutes!*.**"
waitfor "(?=Help)"
gosub :quickstats
if ($yourCloaks = 0)
	echo ANSI_12 "**No CLOAKS!!!*Attempting to get more!"
	gosub :getCloaks
else
	send "'*.*I have a cloak!*.**"
end
echo ANSI_10 "**Time is : " TIME "*"
echo ANSI_10 "ON Dock, will autoexit in " $TEL_exitTime " Minutes!***"
setvar $count 1
while ($count <= $TEL_exitTime)
	gosub :delay1min
	send "#"
	echo ANSI_10 "*Time till Logout: " ($TEL_exitTime - $count) " Minutes**"
	add $count 1
end

:exit
killtrigger lostConnection
send "'*.*Cloaking out now!*.**"
send "q  q  y  y  x*"
waitfor "Server registered to"
send "q"
halt

:getCloaks
send "hd"
waitfor "credits each."
getword CURRENTLINE $cloakCost 3
striptext $cloakCost ","
if ($yourCredits < $cloakCost)
	echo ANSI_12 "**Sigh, not enough credits on you for a cloak.*checking bank now.**"
	send "0*q"
	goto :checkBank
else
	send "1*q"
end
waitfor "See you later."
send "'*.*I have a cloak now.*.**"
send "'*.*I will now cloak out in " $TEL_exitTime " minutes!*.**"
return

:checkBank
killtrigger checkBank
killtrigger askCorpies
send "ge"
waitfor "credits in your account"
getword CURRENTLINE $bankCredits 3
striptext $bankCredits ","
if (($yourCredits + $bankCredits) >= $cloakCost)
	send "w" ($cloakCost - $yourCredits) "*q"
	waitfor "(?=Help)"
	gosub :quickstats
	if ($needCorpieCash = 1)
		send "'*.*Thanks for the cloak cash!*.**"
	end
	setvar $needCorpieCash 0
	goto :getCloaks
else
	send "q"
	goto :askCorpies
end

:askCorpies
killtrigger checkBank
killtrigger askCorpies
if ($TEL_exitTime > 1)
	subtract $TEL_exitTime 1
end
echo ANSI_12 "****" #42 #42 #42 "NO CLOAKS, and not enough cash on hand or in bank to get one!!" #42 #42 #42 "*"
echo ANSI_12 "Attempting to ask if there is a corpie who can give me some."
send "'*.*"
send "This is an automated extern login script.  I don't have enough cash to*"
send "buy a cloak so I can exit properly.  Is anyone there who can give me*"
send (($cloakCost - $yourCredits) - $bankCredits) " credits in my bank?  I will wait 1 minute*"
send "for the bank deposit message, then request again. I will not log out*"
send "until I get some cloaks somehow...*.**"
setvar $needCorpieCash 1
waitfor "Sub-space comm-link terminated"
settextlinetrigger checkBank :checkBank "credits to your Galactic bank account."
setdelaytrigger askCorpies :askCorpies 60000
pause

:delay1min
setdelaytrigger delay :delay 60000
pause

:delay10sec
setdelaytrigger delay :delay 10000
pause

:delay2sec
setdelaytrigger delay :delay 2000
pause

:delay
killtrigger delay
return

#----------------------------------------------------
# ----====[ BEGINNING OF QUICKSTATS SECTION ]====----
#----------------------------------------------------
# ====[ Get quick stats ]====
:quickstats
setvar $stats 0
getword CURRENTLINE $qsprompttest 1
send "/"
settextlinetrigger getStats :getStats #179 & "Turns"
settexttrigger command :gotStats "(?=Help)"
pause

:getStats
killtrigger getStats
setvar $stats $stats & CURRENTLINE
replacetext $stats #179 " "
striptext $stats ","
settextlinetrigger getStats :getStats
pause

:gotStats
killtrigger command
killtrigger getStats
getword $stats $checkStat 2
if ($checkStat <> "Sect")
	echo ANSI_12 "*QuickStats Failed, Bad Timing.  Doing again.*"
	goto :quickstats
else
	echo ANSI_10 "*Got Stats!*"
end
getword $stats $yourCredits 7
getword $stats $photonCheck 22
# echo ANSI_10 "**Phot = " $photonCheck "**"
if ($photonCheck = "Phot")
	getword $stats $yourCloaks 33
else
	getword $stats $yourCloaks 31
end
return

#----------------------------------------------
# ----====[ END OF QUICKSTATS SECTION ]====----
#----------------------------------------------

:help
echo ANSI_10 "This script lets you be AFK for extern, but still avoid extern *"
echo ANSI_10 "  tow or cloak failure.*"
echo ANSI_10 "This script will prompt you for username, PW, and Game Letter.*"
echo ANSI_10 "If you have saved your login information into the twx setup, it*"
echo ANSI_10 "  will bypass this step and just use that information.*"
echo ANSI_10 "It will save this information for the next time you run it.*"
echo ANSI_10 "Then it will ask what time you want to log on.  Remember, it *"
echo ANSI_10 "  will use YOUR PC'S time, NOT the server time!!*"
echo ANSI_10 "It also uses System Time Format, HH:MM:SS AM/PM*"
echo ANSI_10 "  i.e. enter 11:59:00 PM or 3:59:00 am or whatever. The AM/PM*"
echo ANSI_10 "  are NOT case sensitive. :)*"
echo ANSI_10 "Then it will ask how many minutes you want to stay logged on.*"
echo ANSI_10 "  (if you want to be on 1 min before extern, and 2 min after,*"
echo ANSI_10 "  then enter 3 min)*"
echo ANSI_10 "This script will then log on at the appropriate time, and attempt*"
echo ANSI_10 "  to dock at the stardock.  It will then hang out on dock for the*"
echo ANSI_10 "  amount of time you specified, then pop off dock and cloak out.*"
echo ANSI_10 "  It takes about 5-10 seconds to do the full login, so be sure to*"
echo ANSI_10 "  set it to login at least 15 or so seconds before extern is *"
echo ANSI_10 "  supposed to run*"
gosub :pauseHelp
echo ANSI_10 "And remember, Server time is not always the same as your system*"
echo ANSI_10 "  time.  Be sure you know how much to offset your login time, or *"
echo ANSI_10 "  you may miss extern completely!*"
echo ANSI_10 "  Personally, I have it login 1 min before extern, and log off 2*"
echo ANSI_10 "  minutes after extern. (log on 1 before, and stay on for 3.)*"
echo ANSI_10 "On some servers, extern can take even longer to run, so you might*"
echo ANSI_10 "  want to watch for that and add an extra minute or so.*"
echo ANSI_12 "You must have last cloaked at Stardock! STARDOCK! S-T-A-R-D-O-C-K!*"
echo ANSI_10 "You must leave twx running of course, or it won't work.*"
echo ANSI_10 "If you get disconnected, it will try to get back on, but*"
echo ANSI_10 "  you are most likely going to be dead!!*"
echo ANSI_10 "It will check to see if you have cloaks, and will attempt to buy*"
echo ANSI_10 "  more if you have cash on hand, or in your bank.  If you don't,*"
echo ANSI_10 "  it will call out over SubSpace once a minute until a corpie *"
echo ANSI_10 "  shows up and puts cash in your bank.  It will stay logged on*"
echo ANSI_10 "  until that happens.  BEWARE in time limited games!!*"
echo ANSI_10 "I use this script all the time, " ANSI_12 "but...*use it at your own risk!! You were warned!*"
return

:pausehelp
echo ANSI_14 "**Press " ANSI_11 "any key" ANSI_14 " to continue*"
settextouttrigger helpContinue :helpContinue
pause

:helpContinue
echo ANSI_12 #27 "[1A" #27 "[99D" #27 "[K"
return

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