#----==== Script Info & Signature ====----#
:scriptInfo
echo #27 "[2J"
echo ANSI_11 "*+EP+ Tunnel Report, v1.0"
echo ANSI_11 "*October 2005"
echo ANSI_11 "*ElderProphet@comcast.net"
echo ANSI_11 "*http://jroller.com/page/ElderProphet*"
setVar $signature ANSI_11 & #27 & "[2J*+EP+ Tunnel Report, v1.0*October 2005*ElderProphet@comcast.net*http://jroller.com/page/ElderProphet*"

#----==== Set Variables ====----#
setVar $writefile GAMENAME & "_TUNNELS.txt"
setVar $figfile GAMENAME & "_FIGLIST.txt"
delete $writefile
write $writefile "Key:  + - fig in sector"
write $writefile "  (XXX) - port type in sector"
write $writefile "----------------------------------------------------------"

#----==== Get Input ====----#
:getMinLength
echo ANSI_15 "*Minimum length of tunnel?"
getConsoleInput $minLength
isNumber $yn $minLength
if ($yn <> 1)
	goto :getMinLength
end
if ($minLength < 2)
	goto :getMinLength
end

:requestCIM
echo ANSI_15 "*Update CIM data? (Y/N)"
getConsoleInput $yn SINGLEKEY
upperCase $yn
if ($yn <> "Y") and ($yn <> "N")
	goto :requestCIM
elseif ($yn = "Y")
	send "cn"
	setTextLineTrigger CN9 :CN9 "(9) Abort display on keys"
	pause
	
	:CN9
	getWord CURRENTLINE $CN9 7
	if ($CN9 <> "SPACE")
		send "9"
	end
	send "qq^rq"
	waitON ": ENDINTERROG"
end

:requestFigUpdate
fileExists $yn $figfile
if ($yn = 0)
	gosub :figRefresh
else
	read $figFile $lastrefresh 1
	echo ANSI_15 "*Fighter list was last refreshed : " $lastrefresh ", would you like to refresh the list? (Y/N)"
	getConsoleInput $yn SINGLEKEY
	upperCase $yn
	if ($yn = "Y")
		gosub :figRefresh
	else
		gosub :readFigFile
	end
end

#----==== Main Section ====----#
:main
echo $signature
echo ANSI_15 "*Finding Tunnels : Status (| = 10%)*"
echo ANSI_15 "1%          100%" #27 "[14D"
setVar $a 11
setVar $increment ((SECTORS - 11) / 10)
setVar $coefficient 1
while ($a <= SECTORS)
	if ($a > ($coefficient * $increment))
		echo ANSI_12 "|"
		add $coefficient 1
	end
	if (SECTOR.WARPCOUNT[$a] = 2) and ($checked[$a] = 0)
		setVar $length 1
		setVar $checked[$a] 1
		setVar $input $a
		gosub :addClass
		setVar $course $output
		setVar $input SECTOR.WARPS[$a][1]
		getDistance $distance $input $a
		if ($distance = 1)
			setVar $addOn "LEFT"
			gosub :traverseTunnel
		end
		setVar $input SECTOR.WARPS[$a][2]
		getDistance $distance $input $a
		if ($distance = 1)
			setVar $addOn "RIGHT"
			gosub :traverseTunnel
		end
		if ($length >= $minLength)
			write $writeFile $course
		end
	end
	add $a 1
end
echo ANSI_12 "*Done, info in file : " $writefile "*"

:displayResults
echo ANSI_15 "Would you like to display the results? (Y/N)"
getConsoleInput $yn SINGLEKEY
upperCase $yn
if ($yn <> "Y") and ($yn <> "N")
	goto :displayResults
elseif ($yn = "Y")
	read $writeFile $text 1
	echo "*" ANSI_15 $text
	read $writeFile $text 2
	echo "*" ANSI_15 $text
	setVar $line 3
	read $writeFile $text $line
	while ($text <> EOF)
		echo ANSI_11 "*" $text
		add $line 1
		read $writeFile $text $line
	end
	echo ANSI_12 "*Remember, results logged to file: " $writefile "*"
end
halt

###################################################################
########################### Subroutines ###########################
###################################################################

#----==== Traverse Tunnel ====----#
:traverseTunnel
while ($checked[$input] = 0) and (SECTOR.WARPCOUNT[$input] = 2)
	setVar $checked[$input] 1
	add $length 1
	gosub :addClass
	if ($addOn = "LEFT")
		setVar $course $output & " <> " & $course
	elseif ($addOn = "RIGHT")
		setVar $course $course & " <> " & $output
	end
	setVar $adjacent SECTOR.WARPS[$input][1]
	if ($checked[$adjacent] = 1)
		setVar $adjacent SECTOR.WARPS[$input][2]
	end
	getDistance $distance $adjacent $input
	if ($distance > 1)
		return
	end
	setVar $input $adjacent
end
return

#----==== Add Class Data ====----#
:addClass
setVar $output $input
if ($deployedFig[$input] = 1)
	setVar $output "+" & $input
end
if (PORT.CLASS[$input] <> "-1")
	setVar $classes "(Class_0) (BBS) (BSB) (SBB) (SSB) (SBS) (BSS) (SSS) (BBB) (StarDock)"
	getWord $classes $class (PORT.CLASS[$input] + 1)
	setVar $output $output & $class
end
return

#----==== Fighter Refresh Subroutines ====----#
:readFigFile
setVar $b 2
read $figFile $figSector $b
while ($figSector <> EOF)
	setVar $deployedFig[$figSector] 1
	add $b 1
	read $figFile $figSector $b
end
return

:figRefresh
delete $figfile
getDate $date
getTime $time "hh:mm:ss"
write $figFile $date & " " & $time
send "g"
waitOn "Deployed  Fighter  Scan"
setTextLineTrigger personal :getDeployed "Personal "
setTextLineTrigger corp :getDeployed " Corp"
waitOn "Command [TL"
killTrigger personal
killTrigger corp
return

:getDeployed
killTrigger personal
killTrigger corp
getWord CURRENTLINE $figSector 1
setVar $deployedFig[$figSector] 1
write $figfile $figSector
setTextLineTrigger personal :getDeployed "Personal "
setTextLineTrigger corp :getDeployed " Corp"
pause