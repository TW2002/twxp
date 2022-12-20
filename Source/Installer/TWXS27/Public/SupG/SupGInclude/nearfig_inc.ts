#=-=-=-=-=-=--= Near Fig  =-=-=-=-=-=-=-=-=-=-=-=
#Input Variables:
#<Required>
#$nearfig~origsec	- Sector to find closest fig/port to
#<Optional>
#$nearfig~command	- Mode of finding clostest fig/port
#			0 - Finds nearest fig to $SupGInclude~origsec
#			fport - Finds nearest figged port to $SupGInclude~origsec of <type>
#			port - Finds nearest port to $SupGInclude~origsec of <type>
#			nofig - Finds nearest non-figged sector to $SupGInclude~origsec
#			warps - Finds nearest figged sector with <num> warps out. ($SupGInclude~numwarps value must be set)
#$SupGInclude~numwarps	- Parameter for 'warps' command, contains number of warps out of sector
#
#Port Types: (required for fport and port commands)
#$nearfig~cpfuel	- Value for fuel in port type
#$nearfig~cporg	- Value for orgs in port type
#$nearfig_inc~cpequip	- Value for equip in port type
#			s - Selling specified product
#			b - Buying specified product
#			x - Wildcard, either selling or buying specified product

#Output Variable:
#$nearfig~result	- Result of the algorithm, nearest fig/fport/port to origsec. Returns -1 if no result.

:closefig

setVar $cfadjacents 0
setVar $rally 0
setVar $finishcf 0
setVAr $cf 0
setArray $cfadjs SECTORS
setArray $done SECTORS
setVar $cfsector $origsec
if ($command = "nofig")
	setVar $fig 0
else
	setVar $fig 1
end
if ($figList[$origsec] = $fig)
	if ((PORT.CLASS[$origsec] > 0) and (PORT.CLASS[$origsec] < 9)) or ($command = 0) or ($command = "nofig") OR ($command = "warps")
		if ($command = 0) OR ($command = "nofig")
			setVar $cf $origsec
			goto :finishcf
		elseif ($command = "warps")
			if ($numwarps = SECTOR.WARPCOUNT[$origsec])
				setVar $cf $origsec
				goto :finishcf
			end	
		else
			if (($cpfuel = "b") AND (PORT.BUYFUEL[$origsec] = 1)) or (($cpfuel = "s") AND (PORT.BUYFUEL[$origsec] = 0)) or ($cpfuel = "x")
				if (($cporg = "b") AND (PORT.BUYORG[$origsec] = 1)) or (($cporg = "s") AND (PORT.BUYORG[$origsec] = 0)) or ($cporg = "x")	
					if (($cpequip = "b") AND (PORT.BUYEQUIP[$origsec] = 1)) or (($cpequip = "s") AND (PORT.BUYEQUIP[$origsec] = 0)) or ($cpequip = "x")
						setVar $cf $origsec
						goto :finishcf
					end
				end
			end
		end
	end
else
	if ($command = "port") and ((PORT.CLASS[$origsec] > 0) and (PORT.CLASS[$origsec] < 9))
		if (($cpfuel = "b") AND (PORT.BUYFUEL[$origsec] = 1)) or (($cpfuel = "s") AND (PORT.BUYFUEL[$origsec] = 0)) or ($cpfuel = "x")
			if (($cporg = "b") AND (PORT.BUYORG[$origsec] = 1)) or (($cporg = "s") AND (PORT.BUYORG[$origsec] = 0)) or ($cporg = "x")	
				if (($cpequip = "b") AND (PORT.BUYEQUIP[$origsec] = 1)) or (($cpequip = "s") AND (PORT.BUYEQUIP[$origsec] = 0)) or ($cpequip = "x")
					setVar $cf $origsec
					goto :finishcf
				end
			end
		end
	end
end
setVar $done[$origsec] 1
gosub :close
if ($finishcf = 1)
	goto :finishcf
end

:rally
if ($rally < $cfadjacents) AND ($rally < SECTORS)
	add $rally 1
	if ($done[$cfadjs[$rally]] = 1)
		goto :rally
	else
		setVar $cfsector $cfadjs[$rally]
		gosub :close
		if ($finishcf = 1)
			goto :finishcf
		else
			goto :rally
		end
	end
else
	setVar $cf 0
	goto :finishcf
end

:close
setVar $cfloop 0
:cf
if ($cfloop < SECTOR.WARPINCOUNT[$cfsector])
	add $cfloop 1
	setVar $cfadj SECTOR.WARPSIN[$cfsector][$cfloop]
	if ($figList[$cfadj] = $fig)
		if ((PORT.CLASS[$cfadj] > 0) and (PORT.CLASS[$cfadj] < 9)) or ($command = 0) or ($command = "nofig") OR ($command = "warps")
			if ($command = 0) OR ($command = "nofig")
				setVar $cf $cfadj
				setVar $finishcf 1
				return
			elseif ($command = "warps")
				if ($numwarps = SECTOR.WARPCOUNT[$cfadj])
					setVar $cf $cfadj
					setVar $finishcf 1
					return
				end
			else
				if (($cpfuel = "b") AND (PORT.BUYFUEL[$cfadj] = 1)) or (($cpfuel = "s") AND (PORT.BUYFUEL[$cfadj] = 0)) or ($cpfuel = "x")
					if (($cporg = "b") AND (PORT.BUYORG[$cfadj] = 1)) or (($cporg = "s") AND (PORT.BUYORG[$cfadj] = 0)) or ($cporg = "x")	
						if (($cpequip = "b") AND (PORT.BUYEQUIP[$cfadj] = 1)) or (($cpequip = "s") AND (PORT.BUYEQUIP[$cfadj] = 0)) or ($cpequip = "x")
							setVar $cf $cfadj
							setVar $finishcf 1
							return
						end
					end
				end
			end
		end
		add $cfadjacents 1
		setVar $cfadjs[$cfadjacents] $cfadj
		goto :cf
	else
		if ($command = "port") and ((PORT.CLASS[$cfadj] > 0) and (PORT.CLASS[$cfadj] < 9))
			if (($cpfuel = "b") AND (PORT.BUYFUEL[$cfadj] = 1)) or (($cpfuel = "s") AND (PORT.BUYFUEL[$cfadj] = 0)) or ($cpfuel = "x")
				if (($cporg = "b") AND (PORT.BUYORG[$cfadj] = 1)) or (($cporg = "s") AND (PORT.BUYORG[$cfadj] = 0)) or ($cporg = "x")	
					if (($cpequip = "b") AND (PORT.BUYEQUIP[$cfadj] = 1)) or (($cpequip = "s") AND (PORT.BUYEQUIP[$cfadj] = 0)) or ($cpequip = "x")
						setVar $cf $cfadj
						setVar $finishcf 1
						return
					end
				end
			end
		end		
		add $cfadjacents 1
		if ($cfadjacents > SECTORS)
			setVar $result "-1"
			goto :finishcf
		end
		setVar $cfadjs[$cfadjacents] $cfadj
		goto :cf
	end
else
	setVar $done[$cfsector] 1
	setVar $finishcf 0
	return
end


:finishcf
if ($cf > 0)
	setVar $result $cf
else
	setVar $result "-1"
end
return

#/\/\ Variable Definitions /\/\

#/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
#=-=-=-=-=-=-=-=-=----=-=-=-=-=-=-=

#=-=-=-= Create Figged Sector List =-=-=-=-
:fig_list
setVar $figfile GAMENAME & "_FIGLIST.txt"
fileExists $figlchk $figfile
if ($figlchk = 1)
	read $figFile $lastrefresh 1
	echo ANSI_15 "*Fighter list was last refreshed : " $lastrefresh ", would you like to refresh the list?"
	getConsoleInput $flu singlekey
	lowercase $flu
	if ($flu = "y")
		goto :figrefresh
	else
		clientmessage "Reading fighter list"
		goto :readfigfile
	end
end

:figrefresh
setVar $cn1 "Off"
setVar $cn1change 0
gosub :cn
send "G"
:refreshing
delete $figfile
getDate $date
getTime $time "hh:mm:ss"
write $figFile $date & " " & $time
setVar $secsfigd 0
setArray $figList SECTORS
waitFor "==========================================================="
:get_figs
getWord CURRENTLINE $fs 1
getWord CURRENTLINE $st 2
isNumber $sn $fs
if ($st = "Total") or ($st = "fighters") or ($fs = 0)
	setVar $perc (($secsfigd * 100)/SECTORS)
	send "'We have " $secsfigd " sectors marked, approx " $perc "%*"
	if ($cn1change = 1)
		setVar $cn1 "On"
		gosub :cn
		waitFor "<Computer deactivated>"
	end
	return
end
if ($sn = 1)
	add $secsfigd 1
	setVar $figList[$fs] 1
	write $figfile $fs
end
setTextLineTrigger grab :get_figs
pause

:readfigfile
setArray $figList SECTORS
setVar $flcnt 2
:rdfgfl
read $figfile $fs $flcnt
if ($fs <> "EOF")
	setVar $figList[$fs] 1
	add $flcnt 1
	goto :rdfgfl
end
subtract $flcnt 1
clientmessage "Fighter list read."
setVar $perc (($flcnt * 100) / SECTORS)
send "'We have " $flcnt " sectors marked, approx " $perc "%*"
waitFor "Message sent on sub-space channel"
return

#/\/\ Variable Definitions /\/\
#$figList[x]	- Array holding sectors with figs/no figs
#		  $figList[123] = 1 - sector 123 has corp/pers fig
#		  $figList[123] = 0 - sector 123 has no/enemy fig
#$x		- Counter Variable
#$fs		- Sector with fighter
#$st		- Variable to check so we know when to stop
#$sn		- Boolean variable to check if $fs is a valid number
#$secsfigd	- Number of sectors marked
#$perc		- Percent of sectors marked
#$figfile	- Filename of the fig list
#$flcnt		- Counter variable used for reading the file
#$date	 	- Date
#$time		- Time
#/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
	
#=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

#=-=-=-= Adjacent Fighter checking =-=-=-=-
:adj_fig
setVar $x 0
setVar $adj 0
:i
if ($x < SECTOR.WARPCOUNT[$sector])
	add $x 1
	setVar $adj_fig SECTOR.WARPSIN[$sector][$x]

	if ($figList[$adj_fig] = 1)
		setVar $adj 1
		goto :donefig_chk
	else
		goto :i
	end
end
:donefig_chk
return

#=-=-=-= Change CN Settings =-=-=-=-
:cn
setTextLineTrigger cn1 :cn1 "(1) ANSI graphics"
setTextLineTrigger cn2 :cn2 "(2) Animation display"
setTextLineTrigger cn3 :cn3 "(3) Page on messages"
setTextLineTrigger cn4 :cn4 "(4) Sub-space radio channel"
setTextLineTrigger cn5 :cn5 "(5) Federation comm-link"
setTextLineTrigger cn6 :cn6 "(6) Receive private hails"
setTextLineTrigger cn7 :cn7 "(7) Silence ALL messages"
setTextLineTrigger cn9 :cn9 "(9) Abort display on keys"
setTextLineTrigger cna :cna "(A) Message Display Mode"
setTextLineTrigger cnb :cnb "(B) Screen Pauses"
setTextLineTrigger cnc :cnc "(C) Online Auto Flee"
send "cn"
pause

:cn1
getWord CURRENTLINE $set1 5
pause
:cn2
getWord CURRENTLINE $set2 5
pause
:cn3
getWord CURRENTLINE $set3 6 
pause
:cn4
getWord CURRENTLINE $set4 6
pause
:cn5
getWord CURRENTLINE $set5 5
pause
:cn6
getWord CURRENTLINE $set6 6
pause
:cn7
getWord CURRENTLINE $set7 6
pause
:cn9
getWord CURRENTLINE $set9 7
pause
:cna
getWord CURRENTLINE $seta 6
pause
:cnb
getWord CURRENTLINE $setb 5
pause
:cnc
getWord CURRENTLINE $setc 6



if ($cn1 <> 0)
	if ($set1 <> $cn1)
		setVar $cn1change 1
		send "1"
	end
end
if ($cn2 <> 0)
	if ($set2 <> $cn2)
		setVar $cn2change 1
		send "2"
	end
end
if ($cn3 <> 0)
	if ($set3 <> $cn3)
		setVar $cn3change 1
		send "3"
	end
end
if ($cn4 <> 0)
	if ($set4 <> $cn4)
		setVar $cn4change 1
		send "3" $cn4 "*"
	end
end
if ($cn5 <> 0)
	if ($set5 <> $cn5)
		setVar $cn5change 1
		send "5"
	end
end
if ($cn6 <> 0)
	if ($set6 <> $cn6)
		setVar $cn6change 1
		send "6"
	end
end
if ($cn7 <> 0)
	if ($set7 <> $cn7)
		setVar $cn7change 1
		send "7"
	end
end
if ($cn9 <> 0)
	setVar $cn9change 0
	if ($set9 <> $cn9)
		setVar $cn9change 1
		send "9"
	end
end
if ($cna <> 0)
	if ($seta <> $cna)
		setVar $cnachange 1
		send "a"
	end
end
if ($cnb <> 0)
	if ($setb <> $cnb)
		setVar $cnbchange 1
		send "b"
	end
end
if ($cnc <> 0)
	if ($setc <> $cnc)
		setVar $cncchange 1
		send "c"
	end
end
send "qq"
return

#/\/\ Variable Definitions /\/\
#$set*		- Current setting of the CN*
#$cn*		- Requested setting for CN*
#$cn*change	- Boolean value for change
#		1 - Value was changed from its original value
#		0 - Value was not changed, already at requested value. 
#/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\