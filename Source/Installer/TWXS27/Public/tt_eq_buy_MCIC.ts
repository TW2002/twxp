# Traitor's Equipment Buying MCIC Tracker
# Based on Cherokee's CK Equip Haggle Tracker
#   It was a lot easier to rewrite his than to rewrite mine.
#   Thanks CK!!
# This script is for my friend LetsDrinkCoke who motivated me to finally
#   make a public version of this.
setvar $version "2.1.1 08/30/06"

systemscript

gosub :egoBanner
echo ANSI_9 "**    " #42 #42 #42 ANSI_10 " Traitor's " ANSI_11 "XXB MCIC Tracker, " ANSI_3 "version: " ANSI_11 $version " " ANSI_9 #42 #42 #42 "*"
gosub :instructions
send #145

:start
setTextTrigger getExp :getExp "Rank and Exp   :"
setTextLineTrigger equipbuying :equipbuying "Equipment  Buying"
setTextLineTrigger howmanyholds :howmanyholds "of Equipment do you want to sell"
settextouttrigger setup :setup "@"
pause

:setup
killalltriggers
gosub :instructions
echo ANSI_11 "**Traitor's XXB MCIC Tracker SETUP*"
echo ANSI_10 "*Please choose an option"
echo ANSI_11 "*E" ANSI_10 " - Export MCIC data to a file."
echo ANSI_11 "*I" ANSI_10 " - Import MCIC data from a file. (will not overwrite existing data)"
echo ANSI_11 "*P" ANSI_10 " - Print MCIC data to Screen. (for quick cut and paste)"
echo ANSI_11 "*Q" ANSI_10 " - Quit!***"
getconsoleinput $key SINGLEKEY
if ($key = "e")
	goto :exportMCIC
elseif ($key = "i")
	goto :importMCIC
elseif ($key = "p")
	goto :printMCIC
elseif ($key = "q")
	halt
else
	goto :start
end

:printMCIC
killalltriggers
echo ANSI_11 "**Displaying all stored MCIC information*"
setvar $count 1
while ($count <= SECTORS)
	# has to search all sectors beacuse you might import ports from corpies
	# that you have not explored yet.  slower, but what are ya gonna do?
	getsectorparameter $count "MCIC" $tempMCIC
	isnumber $yn $tempMCIC
	if ($yn = 1)
		if ($tempMCIC < "1")
			echo ANSI_10 "*" $count " " 
			setvar $tempport PORT.CLASS[$count]
			gosub :getporttype
			echo " " $tempMCIC
		end
	end
	add $count 1
end
echo ANSI_11 "**End of MCIC list*"
send #145
goto :start

:exportMCIC
killalltriggers
echo ANSI_10 "**Enter filename (or press enter for " ANSI_11 GAMENAME "-MCIC.txt" ANSI_10 ")***"
getinput $filename ""
if ($filename = "")
	setvar $filename GAMENAME & "-MCIC.txt"
end
delete $filename
setvar $count 1
echo ANSI_10 "**Exporting! Please wait.*"
while ($count <= SECTORS)
	getsectorparameter $count "MCIC" $tempMCIC
	isnumber $yn $tempMCIC
	if ($dot > 40)
		setvar $dot 1
		echo ANSI_13 "."
	else
		add $dot 1
	end
	if ($yn = 1)
		if ($tempMCIC < "1")
			write $filename $count & " " & $tempMCIC
		end
	end
	add $count 1
end
echo ANSI_10 "**MCIC info written to file: ANSI_11 " $filename "**"
send #145
goto :start

:importMCIC
killalltriggers
echo ANSI_10 "**Enter filename (or press enter for " ANSI_11 GAMENAME "-MCIC.txt" ANSI_10 ")***"
getinput $filename ""
if ($filename = "")
	setvar $filename GAMENAME & "-MCIC.txt"
end
fileexists $yn $filename
if ($yn = 0)
	echo ANSI_14 "**Invalid file name!**"
	send #145
	goto :start
end
setvar $count 1
echo ANSI_10 "**Importing! Please wait.*"
while ($count <= SECTORS)
	read $filename $line $count
	if ($line <> "EOF")
		if ($dot > 40)
			setvar $dot 1
			echo ANSI_13 "."
		else
			add $dot 1
		end
		replacetext $line "," " "
		getword $line $sector 1
		getword $line $MCIC 2
		# added so you can import EP's haggle MCIC info.
		isnumber $yn $MCIC
		if ($yn = 0)
			if ($MCIC = "EQUIPMENT")
				getword $line $MCIC 3
			else
				setvar $MCIC 2
			end
		end
		if ($MCIC < 1)
			setsectorparameter $sector "MCIC" $MCIC
		else
			add $notAdded 1
		end
		add $count 1
	else
		echo ANSI_10 "**All MCIC data imported from " ANSI_11 $filename ANSI_10 ", " ANSI_11 (($count - 1) - $notAdded) ANSI_10 " records imported.**" 
		send #145
		goto :start
	end
end
echo ANSI_10 "**All MCIC data imported from " ANSI_11 $filename ANSI_10 ", " ANSI_11 (($count - 1) - $notAdded) ANSI_10 " records imported.**" 
send #145
goto :start

:getExp
getWord CURRENTLINE $experience 5
stripText $experience ","
setTextTrigger getExp :getExp "Rank and Exp   :"
pause

:equipbuying
getword CURRENTLINE $EQonPort 3
getWord CURRENTLINE $buypercent 4
stripText $buypercent "%"
setTextLineTrigger equipbuying :equipbuying "Equipment  Buying"
pause

:howmanyholds
killalltriggers
getWord CURRENTLINE $haggletype 3
if ($haggletype = "holds")
	setVar $haggletype "ship"
else
	setVar $haggletype "planet"
end
setTextLineTrigger agreed :agreed "Agreed,"
goto :start

:agreed
killalltriggers
getWord CURRENTLINE $units2sell 2
stripText $units2sell ","
setTextLineTrigger buythemfor :buythemfor "Your offer ["
goto :start

:buythemfor
killalltriggers
getWord CURRENTLINE $offer 3
stripText $offer ","
stripText $offer "]"
stripText $offer "["
stripText $offer "?"
if ($experience > 1000)
	setVar $expadjust 1000
else
	setVar $expadjust $experience
end
multiply $expadjust 110
divide $expadjust 10
setVar $perunitinitoffer $offer
multiply $perunitinitoffer 1000
divide $perunitinitoffer $units2sell

setVar $ptradeprice $perunitinitoffer
setVar $actualprice $perunitinitoffer
if ($haggletype = "ship")
	subtract $ptradeprice $expadjust
end
gosub :getMCIC
setVar $portType ""
if (PORT.BUYFUEL[CURRENTSECTOR] = 1)
	setVar $portType $portType & "B"
else
	setVar $portType $portType & "S"
end
if (PORT.BUYORG[CURRENTSECTOR] = 1)
	setVar $portType $portType & "B"
else
	setVar $portType $portType & "S"
end
if (PORT.BUYEQUIP[CURRENTSECTOR] = 1)
	setVar $portType $portType & "B"
else
	setVar $portType $portType & "S"
end
setsectorparameter CURRENTSECTOR "MCIC" $MCIC
echo ANSI_10 "*" CURRENTSECTOR & " (" & $portType & ") - " & $haggletype & " - MCIC approx " & $MCIC & "*"
goto :start

:getMCIC
setVar $perunitinitoffer $ptradeprice
divide $perunitinitoffer 10
setVar $portmaxinit $perunitinitoffer
divide $perunitinitoffer 10
setVar $basevalue 906281000
setVar $basepercent 10989
setVar $basepercentinverse 89010
setVar $percentfrombase $buypercent
if ($percentfrombase >= 15)
	multiply $portmaxinit 100000
	subtract $portmaxinit $basevalue
	multiply $percentfrombase 1000
	subtract $percentfrombase $basepercent
	divide $portmaxinit $percentfrombase
	multiply $portmaxinit $basepercentinverse
	add $portmaxinit $basevalue
	divide $portmaxinit 1000000
else
	setVar $portmaxinit 1063
end
if ($portmaxinit >= 1393)
	setVar $MCIC "-65"
	setVar $multiple 1347
elseif ($portmaxinit >= 1386)
	setVar $MCIC "-64"
	setVar $multiple 1341
elseif ($portmaxinit >= 1379)
	setVar $MCIC "-63"
	setVar $multiple 1336
elseif ($portmaxinit >= 1372)
	setVar $MCIC "-62"
	setVar $multiple 1330
elseif ($portmaxinit >= 1365)
	setVar $MCIC "-61"
	setVar $multiple 1324
elseif ($portmaxinit >= 1358)
	setVar $MCIC "-60"
	setVar $multiple 1319
elseif ($portmaxinit >= 1351)
	setVar $MCIC "-59"
	setVar $multiple 1313
elseif ($portmaxinit >= 1344)
	setVar $MCIC "-58"
	setVar $multiple 1307
elseif ($portmaxinit >= 1337)
	setVar $MCIC "-57"
	setVar $multiple 1302
elseif ($portmaxinit >= 1329)
	setVar $MCIC "-56"
	setVar $multiple 1296
elseif ($portmaxinit >= 1323)
	setVar $MCIC "-55"
	setVar $multiple 1291
elseif ($portmaxinit >= 1315)
	setVar $MCIC "-54"
	setVar $multiple 1285
elseif ($portmaxinit >= 1308)
	setVar $MCIC "-53"
	setVar $multiple 1279
elseif ($portmaxinit >= 1301)
	setVar $MCIC "-52"
	setVar $multiple 1274
elseif ($portmaxinit >= 1294)
	setVar $MCIC "-51"
	setVar $multiple 1268
elseif ($portmaxinit >= 1287)
	setVar $MCIC "-50"
	setVar $multiple 1262
elseif ($portmaxinit >= 1279)
	setVar $MCIC "-49"
	setVar $multiple 1254
elseif ($portmaxinit >= 1272)
	setVar $MCIC "-48"
	setVar $multiple 1247
elseif ($portmaxinit >= 1265)
	setVar $MCIC "-47"
	setVar $multiple 1246
elseif ($portmaxinit >= 1258)
	setVar $MCIC "-46"
	setVar $multiple 1241
elseif ($portmaxinit >= 1251)
	setVar $MCIC "-45"
	setVar $multiple 1235
elseif ($portmaxinit >= 1243)
	setVar $MCIC "-44"
	setVar $multiple 1229
elseif ($portmaxinit >= 1236)
	setVar $MCIC "-43"
	setVar $multiple 1224
elseif ($portmaxinit >= 1229)
	setVar $MCIC "-42"
	setVar $multiple 1218
elseif ($portmaxinit >= 1221)
	setVar $MCIC "-41"
	setVar $multiple 1213
elseif ($portmaxinit >= 1214)
	setVar $MCIC "-40"
	setVar $multiple 1208
elseif ($portmaxinit >= 1206)
	setVar $MCIC "-39"
	setVar $multiple 1201
elseif ($portmaxinit >= 1199)
	setVar $MCIC "-38"
	setVar $multiple 1196
elseif ($portmaxinit >= 1192)
	setVar $MCIC "-37"
	setVar $multiple 1190
elseif ($portmaxinit >= 1184)
	setVar $MCIC "-36"
	setVar $multiple 1185
elseif ($portmaxinit >= 1177)
	setVar $MCIC "-35"
	setVar $multiple 1180
elseif ($portmaxinit >= 1169)
	setVar $MCIC "-34"
	setVar $multiple 1174
elseif ($portmaxinit >= 1162)
	setVar $MCIC "-33"
	setVar $multiple 1169
elseif ($portmaxinit >= 1154)
	setVar $MCIC "-32"
	setVar $multiple 1164
elseif ($portmaxinit >= 1147)
	setVar $MCIC "-31"
	setVar $multiple 1158
elseif ($portmaxinit >= 1139)
	setVar $MCIC "-30"
	setVar $multiple 1152
elseif ($portmaxinit >= 1132)
	setVar $MCIC "-29"
	setVar $multiple 1149
elseif ($portmaxinit >= 1124)
	setVar $MCIC "-28"
	setVar $multiple 1144
elseif ($portmaxinit >= 1116)
	setVar $MCIC "-27"
	setVar $multiple 1136
elseif ($portmaxinit >= 1109)
	setVar $MCIC "-26"
	setVar $multiple 1132
elseif ($portmaxinit >= 1101)
	setVar $MCIC "-25"
	setVar $multiple 1126
elseif ($portmaxinit >= 1093)
	setVar $MCIC "-24"
	setVar $multiple 1122
elseif ($portmaxinit >= 1086)
	setVar $MCIC "-23"
	setVar $multiple 1117
elseif ($portmaxinit >= 1078)
	setVar $MCIC "-22"
	setVar $multiple 1110
elseif ($portmaxinit >= 1071)
	setVar $MCIC "-21"
	setVar $multiple 1105
elseif ($portmaxinit >= 1063)
	setVar $MCIC "-20"
	setVar $multiple 1102
else
	setVar $MCIC "-20"
	setVar $multiple 1102
end
return

:getporttype
if ($tempport = 0)
	echo "port:" ANSI_11 " C 0"
elseif ($tempport = 1)
	echo "port: " ANSI_2 "BB" ANSI_11 "S"
elseif ($tempport = 2)
	echo "port: " ANSI_2 "B" ANSI_11 "S" ANSI_2 "B"
elseif ($tempport = 3)
	echo "port: " ANSI_11 "S" ANSI_2 "BB"
elseif ($tempport = 4)
	echo "port: " ANSI_11 "SS" ANSI_2 "B"
elseif ($tempport = 5)
	echo "port: " ANSI_11 "S" ANSI_2 "B" ANSI_11 "S"
elseif ($tempport = 6)
	echo "port: " ANSI_2 "B" ANSI_11 "SS"
elseif ($tempport = 7)
	echo "port: " ANSI_11 "SSS"
elseif ($tempport = 8)
	echo "port: " ANSI_2 "BBB"
elseif ($tempport < 0)
	echo "port: " ANSI_5 "N/A"
else 
	setvar $port $tempport
	echo "port:" ANSI_11 " S D"
end
return

#---------------------------------
# ----====[ INSTRUCTIONS ]====----
#---------------------------------
:instructions
echo ANSI_10 "* This script tracks " ANSI_11 "MCIC's" ANSI_10 " of " ANSI_11 "XXB" ANSI_10 " ports you visit.  It runs in the *"
echo ANSI_10 " background saving " ANSI_11 "MCIC" ANSI_10 " data to sector parameters for later use by*"
echo ANSI_10 " other scripts.*"
echo ANSI_10 "* This script is losely based on " ANSI_11 "Cherokee's" ANSI_10 " CK Equip Haggle Tracker*"
echo ANSI_10 " and some other stuff I had laying around.*"
echo ANSI_10 "* You can access the data anytime by pressing '" ANSI_11 "@" ANSI_10 "', and either*"
echo ANSI_10 " export the data, view the data on screen, or import a corpie's data.*"
echo ANSI_14 "* NOTE: " ANSI_10 "This script is designed for " ANSI_11 "TWXproxy" ANSI_10 " version " ANSI_11 "2.04" ANSI_10 " and above!*"
echo ANSI_14 " NOTE: " ANSI_10 "This script is not terribly accurate at getting MCIC's from*"
echo ANSI_10 "       ship trades.  It is usually low by 3 to 5 (showing -65 when*"
echo ANSI_10 "       it's really -61)  For planet trades, it's usually spot on!*"
echo ANSI_10 "       If you want more accuracy, use " ANSI_11 "Elder Prophet's" ANSI_10 " Haggle!*"
echo ANSI_14 " NOTE: " ANSI_10 "Speaking of EP's Haggle, this script will also import his MCIC*"
echo ANSI_10 "       XXB data from the CSV file it creates when it exports!*"
echo ANSI_10 "* Press the '" ANSI_11 "@" ANSI_10 "' key for more options and to repeat this help*"
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