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
setVar $cf_warpsin $wc_db[$cfsector][1]
setVar $cfloop 0
:cf
if ($cfloop < $cf_warpsin)
	add $cfloop 1
	setVAr $cfcnt ($cfloop + 2)
	setVar $cfadj $wc_db[$cfsector][$cfcnt]
	setVar $cfadj_portclass $wc_db[$cfadj][2]
	if ($figList[$cfadj] = $fig)
		if (($cfadj_portclass > 0) and ($cfadj_portclass < 9)) or ($command = 0) or ($command = "nofig") OR ($command = "warps")
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
				if (($cpfuel = "b") AND (($cfadj_portclass = 1) OR ($cfadj_portclass = 2) OR ($cfadj_portclass = 6) OR ($cfadj_portclass = 8))) or (($cpfuel = "s") AND (($cfadj_portclass = 3) OR ($cfadj_portclass = 4) OR ($cfadj_portclass = 5) OR ($cfadj_portclass = 7))) or ($cpfuel = "x")
					if (($cporg = "b") AND (($cfadj_portclass = 1) OR ($cfadj_portclass = 3) OR ($cfadj_portclass = 5) OR ($cfadj_portclass = 8))) or (($cporg = "s") AND (($cfadj_portclass =2) OR ($cfadj_portclass = 4) OR ($cfadj_portclass = 6) OR ($cfadj_portclass = 7))) or ($cporg = "x")	
						if (($cpequip = "b") AND (($cfadj_portclass = 2) OR ($cfadj_portclass = 3) OR ($cfadj_portclass = 4) OR ($cfadj_portclass = 8))) or (($cpequip = "s") AND (($cfadj_portclass = 1) OR ($cfadj_portclass = 5) OR ($cfadj_portclass = 6) OR ($cfadj_portclass = 7))) or ($cpequip = "x")
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
		if ($command = "port") and ($cfadj_portclass > 0) and ($cfadj_portclass < 9)
			if (($cpfuel = "b") AND (($cfadj_portclass = 1) OR ($cfadj_portclass = 2) OR ($cfadj_portclass = 6) OR ($cfadj_portclass = 8))) or (($cpfuel = "s") AND (($cfadj_portclass = 3) OR ($cfadj_portclass = 4) OR ($cfadj_portclass = 5) OR ($cfadj_portclass = 7))) or ($cpfuel = "x")
				if (($cporg = "b") AND (($cfadj_portclass = 1) OR ($cfadj_portclass = 3) OR ($cfadj_portclass = 5) OR ($cfadj_portclass = 8))) or (($cporg = "s") AND (($cfadj_portclass =2) OR ($cfadj_portclass = 4) OR ($cfadj_portclass = 6) OR ($cfadj_portclass = 7))) or ($cporg = "x")	
					if (($cpequip = "b") AND (($cfadj_portclass = 2) OR ($cfadj_portclass = 3) OR ($cfadj_portclass = 4) OR ($cfadj_portclass = 8))) or (($cpequip = "s") AND (($cfadj_portclass = 1) OR ($cfadj_portclass = 5) OR ($cfadj_portclass = 6) OR ($cfadj_portclass = 7))) or ($cpequip = "x")
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
delete $figfile
getDate $date
getTime $time "hh:mm:ss"
write $figFile $date & " " & $time
setVar $secsfigd 0
setArray $figList SECTORS
send "G"
waitFor "==========================================================="
:get_figs
getWord CURRENTLINE $fs 1
getWord CURRENTLINE $st 2
isNumber $sn $fs
if ($st = "Total") or ($st = "fighters")
	setVar $perc (($secsfigd * 100)/SECTORS)
	send "'We have " $secsfigd " sectors marked, approx " $perc "%*"
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


:update_db
setArray $wc_db SECTORS 15
setVar $wc_loop 0
:wc_loop
if ($wc_loop < SECTORS)
	add $wc_loop 1
	setVar $wc_db[$wc_loop][1] SECTOR.WARPINCOUNT[$wc_loop]
	setVar $wc_db[$wc_loop][2] PORT.CLASS[$wc_loop]
	setVar $wc_inloop 0
	:wc_inloop
	if ($wc_inloop < SECTOR.WARPINCOUNT[$wc_loop])
		add $wc_inloop 1
		setVar $arcnt ($wc_inloop + 2)
		setVar $wc_db[$wc_loop][$arcnt] SECTOR.WARPSIN[$wc_loop][$wc_inloop]
		goto :wc_inloop
	end
	goto :wc_loop
end
return