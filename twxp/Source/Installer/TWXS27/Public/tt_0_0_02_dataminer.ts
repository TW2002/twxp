# Traitor's Data Miner Script
# To run this script, you must create a subdirectory under your twx 
#   dircetory called dataminer.  All the files it creates are placed
#   in the dataminer subdirectory
# THE FOLLOWING IS A LIST OF THE FILES THAT GET CREATED
#    It will also create gamename-xxxxx_old.txt files for tracking purposes
#    after you have run it once already.  
# gamename-corpplanets.txt - list of all corp owned planets
# gamename-status.txt - Shows game status (work in progress)
# gamename-deadend.txt - list of all deadends according to your twx database
# gamename-figgedsectors.txt - list of all figged sectors, qty and type
# gamename-lostports.txt - list of all ports you COULD see, but can't now
# gamename-missingdeadends - list of all deadends that you can't see 
#   (either because of enemy figs, or no port)
# gamename-missingsector - like the missing deadends, but includes all sectors 
#   (including the dead ends)
# gamename-portlist - shows all known ports in the twx database, including 
#   last time updated
# gamename-uppedports - shows all ports that have more than 3000 units of 
#   any product
# gamename-drainedports - shows all ports that are less than 100% 
#   (i'm still working on this one, may make it show all less than 20%)
# gamename-status - misc stats that may or may not be usefull. pulls from 'V'
# gamename-corpplanets.txt - list of all corp planets
# gamename-tunnel.txt - list of all tunnels in the game
# gamename-blister.txt - list of all found blisters (they are rare, so don't 
#   be surprised if you don't see any.  
# gamename-traffic.txt - list of least used 3-ways.
# gamename-lostfigs.txt - list of lost figs since last update (not implimented yet)

# ------------------------
# ----====[ MAIN ]====----
# ------------------------
gosub :getdatetime
gosub :startmenu
send "'running Dataminer, please standby.*"
gosub :updatefiles
if ($update_deadend = "y")
	gosub :makedeadend
end
send "#"
if ($update_tunnel = "y")
	gosub :tunnelfind
end
send "#"
if ($update_blister = "y")
	gosub :blisterfind
end
send "#"
if ($update_figgedsectors = "y") OR ($update_missingdeadends = "y") OR ($update_missingsector = "y") 
	gosub :getfigs
end
send "#"
if ($update_missingdeadends = "y") OR ($update_lostports = "y") OR ($update_portlist = "y") OR ($update_missingsector = "y") OR ($update_uppedports = "y") OR ($update_drainedports = "y") OR ($update_status = "y")
	gosub :getports
	send "#"
	gosub :makeportarray
end
send "#"
if ($update_missingdeadends = "y")
	gosub :makemissingdeadends
end
send "#"
if ($update_lostports = "y")
	gosub :makelostports
end
send "#"
if ($update_portlist = "y")
	gosub :makeportlist
end
send "#"
if ($update_missingsector = "y")
	gosub :makemissingsectors
end
send "#"
if ($update_uppedports = "y")
	gosub :makeuppedports
end
send "#"
if ($update_drainedports = "y")
	gosub :makedrainedports
end
send "#"
if ($update_traffic = "y")
	gosub :trafficfind
end
send "#"
if ($update_status = "y")
	gosub :getstatus
	gosub :getcorpplanets
	gosub :makestatus
end

gosub :comparefiles
send "#"
gosub :unFiggedSectors
send "#"
gosub :makeMissingTunnels
send "#"
gosub :clvCompare

echo ANSI_10 "***ALL DONE!!**"
send "'Dataminer finished.*"
halt

# -------------------------------
# ----====[End of script]====----
# -------------------------------


# -----------------------------
# ----====[SUBROUTINES]====----
# -----------------------------

# ----====[GET PORT EXIST AND UPDATE INFO]====----
# The purpose of this routine is to make an array that contains
#   whether or not a port exists in a sector, and when it was 
#   last updated. I had to do this because TWX doesn't have 
#   System Values for PORT.UPDATED.  Since I don't
#   want to use GetSector more than I have too, since it's SLOW.
:makeportarray
echo ANSI_10 "**AT MAKE PORT ARRAY*"
setarray $portsec SECTORS
setvar $count 1
while ($count <= SECTORS)
	getsector $count $sec
	if ($sec.port.exists = 1)
		setvar $portsec[$count] 1
		setvar $portsec[$count][1] $sec.port.updated
		add $portsInDB 1
	end
	add $count 1
end
return

# ====[Create deadend.txt]====
# Using SECTOR.WARPINCOUNT for this because there may be more than one way out, which is fine
# I modified this to make a note if there are multiple ways out.  
:makedeadend
echo ANSI_10 "**AT MAKE DEAD END*"
setArray $deadEnds SECTORS
setvar $count 1
while ($count <= SECTORS)
	if (SECTOR.WARPINCOUNT[$count] = 1)
		setvar $deadEnds[$count] 1
		add $deadEnds 1
		if (SECTOR.WARPCOUNT[$count] > 1)
			if ($portsec[$count] = 1)
				gosub :getporttype
				write $path & deadend.txt $count & " " & $porttype & " Has " & SECTOR.WARPCOUNT[$count] & " ways out."
			else
				write $path & deadend.txt $count & " Has " & SECTOR.WARPCOUNT[$count] & " ways out."
			end
		else
			if ($portsec[$count] = 1)
				gosub :getporttype
				write $path & deadend.txt $count & " " & $porttype
			else
				write $path & deadend.txt $count 
			end
		end
	end
	add $count 1
end
return

# ====[Create missingdeadends.txt]====
:makemissingdeadends
echo ANSI_10 "**AT MISSING DEAD ENDS*"
setvar $count 1
while ($count <= SECTORS)
	if (SECTOR.WARPINCOUNT[$count] = 1)
		if ($figsec[$count] = 0)
			if ($portsec[$count] = 0)
				write $path & missingdeadends.txt $count
			elseif ($portsec[$count] = 1) 
				getword $portsec[$count][1] $tempdate 1
				gosub :getporttype
				if ($tempdate <> DATE)
					write $path & missingdeadends.txt $count & " " & $porttype
				elseif ($tempdate = DATE)
					getword $portsec[$count][1] $temptime 2
					getword $portsec[$count][1] $ampmcheck 3
					striptext $temptime ":"
					if ($ampmcheck = "PM")
						add $temptime 120000
					end
					if ($temptime < $starttime)
						write $path & missingdeadends.txt $count & " " & $porttype & " Today"
					end
				end
			end
		end
	end
	add $count 1
end
return

# ====[create lostports.txt]====
# Tried to use the System Variables here, but there is no equivalent
#   to Port.exists or port.updated in the documentation,
:makelostports
echo ANSI_10 "**AT MAKE LOST PORTS*"
setvar $count 1
while ($count <= SECTORS)
	if ($portsec[$count] = 1)
		getword $portsec[$count][1] $tempdate 1
		if ($tempdate <> DATE)
			gosub :getporttype
			write $path & lostports.txt $count & " " & $porttype & " " & $portsec[$count][1]
		elseif ($tempdate = DATE)
			getword $portsec[$count][1] $temptime 2
			getword $portsec[$count][1] $ampmcheck 3
			striptext $temptime ":"
			if ($ampmcheck = "PM")
				add $temptime 120000
			end
			if ($temptime < $starttime)
				gosub :getporttype
				write $path & lostports.txt $count & " " & $porttype & " " & $portsec[$count][1] & " Today" 
			end
		end
	end
	add $count 1
end
return

# ====[Create Portlist.txt]====
# Tried to use the System Variables here, but there is no equivalent
#   to Port.exists in the documentation
:makeportlist
echo ANSI_10 "**AT MAKE PORT LIST*"
setvar $count 1
while ($count <= SECTORS)
	if ($portsec[$count] = 1)
		gosub :getporttype
		write $path & portlist.txt $count & " " & $porttype & " " & $portsec[$count][1]
	end
	add $count 1
end
return

# ====[Create Missingsector.txt]====
# Tried to use the System Variables here, but there is no equivalent
#   to Port.exists in the documentation, 
:makemissingsectors
echo ANSI_10 "**AT MAKE MISSING SECTORS*"
setvar $count 1
while ($count <= SECTORS)
	if ($figsec[$count] = 0)
		if ($portsec[$count] = 0)
			write $path & missingsector.txt $count
		else
			getword $portsec[$count][1] $tempdate 1
			gosub :getporttype
			if ($tempdate <> DATE)
				write $path & missingsector.txt $count & " " & $porttype
			elseif ($tempdate = DATE)
				getword $portsec[$count][1] $temptime 2
				getword $portsec[$count][1] $ampmcheck 3
				striptext $temptime ":"
				if ($ampmcheck = "PM")
					add $temptime 120000
				end
				if ($temptime < $starttime)
					write $path & missingsector.txt $count & " " & $porttype & " Today"
				end
			end
		end
	end
	add $count 1
end
return

# ====[Create uppedports.txt]====
:makeuppedports
echo ANSI_10 "**AT MAKE UPPED PORTS*"
write $path & uppedports.txt "SECTOR PORT-TYPE ORE MAX-ORE ORG MAX-ORG EQ MAX-EQ LOST? LOST-TODAY?"
setvar $count 1
while ($count <= SECTORS)
	if ($portsec[$count] = 1)
		setvar $orepercent PORT.PERCENTFUEL[$count]
		setvar $oreonhand PORT.FUEL[$count]
		setvar $orgpercent PORT.PERCENTORG[$count]
		setvar $orgonhand PORT.ORG[$count]
		setvar $eqpercent PORT.PERCENTEQUIP[$count]
		setvar $eqonhand PORT.EQUIP[$count]
		if ($eqpercent > 0) AND (PORT.CLASS[$count] <> 9) AND (PORT.CLASS[$count] <> 0) AND ($orepercent > 0) AND ($orgpercent > 0)
			multiply $eqonhand 100
			divide $eqonhand $eqpercent
			multiply $orgonhand 100
			divide $orgonhand $orgpercent
			multiply $oreonhand 100
			divide $oreonhand $orepercent
			if ($eqonhand > 3100) OR ($oreonhand > 3100) OR ($orgonhand > 3100)
				gosub :getporttype
				getword $portsec[$count][1] $tempdate 1
				if ($tempdate <> DATE)
					write $path & uppedports.txt $count & " " & $porttype & " " & PORT.FUEL[$count] & " " & $oreonhand & " " & PORT.ORG[$count] & " " & $orgonhand & " " & PORT.EQUIP[$count] & " " & $eqonhand & " LOST"
				elseif ($tempdate = DATE)
					getword $portsec[$count][1] $temptime 2
					getword $portsec[$count][1] $ampmcheck 3
					striptext $temptime ":"
					if ($ampmcheck = "PM")
						add $temptime 120000
					end
					if ($temptime < $starttime)
						write $path & uppedports.txt $count & " " & $porttype & " " & PORT.FUEL[$count] & " " & $oreonhand & " " & PORT.ORG[$count] & " " & $orgonhand & " " & PORT.EQUIP[$count] & " " & $eqonhand & " LOST TODAY"
					else
						write $path & uppedports.txt $count & " " & $porttype & " " & PORT.FUEL[$count] & " " & $oreonhand & " " & PORT.ORG[$count] & " " & $orgonhand & " " & PORT.EQUIP[$count] & " " & $eqonhand
					end
				end
			end
		else
			gosub :getporttype
			write $path & uppedports.txt $count & " " & $porttype & " " & PORT.FUEL[$count] & " " & $oreonhand & " " & PORT.ORG[$count] & " " & $orgonhand & " " & PORT.EQUIP[$count] & " " & $eqonhand & " 0% on hand. may be upped"
		end
	end
	add $count 1
end
return

# ====[Create drainedports.txt]====
# Drainedports.txt shows ports with less than 20%
:makedrainedports
echo ANSI_10 "**AT MAKE DRAINED PORTS*"
setvar $count 1
while ($count <= SECTORS)
	if ($portsec[$count] = 1)
		if (PORT.CLASS[$count] <> 9) AND (PORT.CLASS[$count] <> 0)
			if (PORT.PERCENTFUEL[$count] < 20) OR (PORT.PERCENTORG[$count] < 20) OR (PORT.PERCENTEQUIP[$count] < 20)
				gosub :getporttype
				write $path & drainedports.txt $count & " " & $porttype
			end
		end
	end
	add $count 1
end
return

# ----====[COMPARE OLD FILES WITH NEW]====----
:compareFiles
echo ANSI_10 "**AT COMPARE FILES*"
# checks for lost figs.
# Needs to check for lost planets
# makes a compare file.  this file lists sectors that have lost something,
#   and then writes that to a file with flags so you know what got lost.
#   I think...not really sure how this is gonna look yet.
:readoldfigfile
echo ANSI_10 "**AT READ OLD FIG FILE*"
if ($update_figgedsectors = "y")
	fileExists $figgedsectorsfile $path & figgedsectors_old.txt
	if ($figgedsectorsfile = TRUE)
		setvar $count 1
		while ($count <= SECTORS)
			read $path & figgedsectors_old.txt $tempfig $count
			getword $tempfig $oldfigsec 1
			if ($oldfigsec = "Total")
				goto :comparefigs
			else
				setvar $figsec[$oldfigsec][3] 1
			end
			add $count 1
		end
	end
end

:comparefigs
echo ANSI_10 "**AT COMPARE FIGS*"
setvar $count 1
while ($count <= SECTORS)
	if ($figsec[$count][3] = 1) AND ($figsec[$count] = 0)
		if (SECTOR.WARPINCOUNT[$count] < 2)
			write $path & lostfiggedsectors.txt $count & " " & DATE & " " & TIME & " DEADEND"
		else
			write $path & lostfiggedsectors.txt $count & " " & DATE & " " & TIME
		end
	end
	add $count 1
end

if ($update_status = "y")
	fileExists $corpplanetsfile $path & corpplanets_old.txt
	if ($corpplanetsfile = TRUE)
		setvar $count 1
	end
end




# if ($update_missingdeadends = "y")
# 	fileExists $missingdeadendsfile $path & missingdeadends_old.txt
#	if ($missingdeadendsfile = TRUE)
#		while (
#	end
# end
# if ($update_missingsector = "y")
#	fileExists $missingsectorfile $path & missingsector_old.txt
# 	if ($missingsectorfile = TRUE)
#		
#	end
# end


return

# ----====[ Get Port Type ]====----
# this converts the port class number into the text based port type
:getporttype
if (PORT.CLASS[$count] = 1)
	setvar $porttype "BBS"
elseif (PORT.CLASS[$count] = 2)
	setvar $porttype "BSB"
elseif (PORT.CLASS[$count] = 3)
	setvar $porttype "SBB"
elseif (PORT.CLASS[$count] = 4)
	setvar $porttype "SSB"
elseif (PORT.CLASS[$count] = 5)
	setvar $porttype "SBS"
elseif (PORT.CLASS[$count] = 6)
	setvar $porttype "BSS"
elseif (PORT.CLASS[$count] = 7)
	setvar $porttype "SSS"
elseif (PORT.CLASS[$count] = 8)
	setvar $porttype "BBB"
else
	setvar $porttype "SPC"
end	
return

# ----====[ Build visible ports into Array sub-routine ]====----
# There is more I was going to do with this, but I realized that I could 
# do most of that with direct manipulation of the twx database anyway
# Moslty all this does is grab a cim.  
:getports
setArray $visiblePorts SECTORS
echo ANSI_10 "**AT GET PORTS*"
send "^"
waitfor ":"
setdelaytrigger 20 :getreport 1000
pause

:getreport
killtrigger 20
send "r"
settextlinetrigger 21 :addportarray "%"
pause
	:addportarray
	killtrigger 21
	killtrigger 22
	getword CURRENTLINE $tempPortSec 1
	add $visiblePorts 1
	setvar $visiblePorts[$tempPortSec] 1
	settextlinetrigger 21 :addportarray "%"
	settexttrigger 22 :gotports ":"
	pause

	:gotports
	killtrigger 21
	killtrigger 22
	echo "*got ports*"
	send "q"
	waitfor "Command"
	return

# ----====[Create Figged Sectors Array]====----
# Creates Array $figsec.  If there is a fig in a sector, it sets the value of
#   $figsec[sector #] to 1
# Creates figgedsectors.txt file
:getfigs
echo ANSI_10 "**AT GET FIGS*"
setarray $figsec SECTORS
send "g"
WaitFor "==="
SetTextLineTrigger 31 :makefigarray "Toll"
SetTextLineTrigger 34 :makefigarray "Defensive"
SetTextLineTrigger 35 :makefigarray "Offensive"
SetTextTrigger 33 :gotfigs "Command"
Pause
	:makefigarray
	KillTrigger 31
	KillTrigger 34
	KillTrigger 35
	GetWord CURRENTLINE $figgedsec 1
	GetWord CURRENTLINE $figqty 2
	isnumber $figqtycheck $figqty
	if ($figqtycheck = FALSE)
		striptext $figqty "T"
		striptext $figqty "M"
		striptext $figqty "B"
		multiply $figqty 1000
	end
	GetWord CURRENTLINE $figtype 4
	setvar $figsec[$figgedsec] 1
	setvar $figsec[$figgedsec][1] $figqty
	setvar $figsec[$figgedsec][2] $figtype
	add $figsec 1
	SetTextLineTrigger 31 :makefigarray "Toll"
	SetTextLineTrigger 34 :makefigarray "Defensive"
	SetTextLineTrigger 35 :makefigarray "Offensive"
	pause
	
	:gotfigs
	killtrigger 33
	killtrigger 31
	killtrigger 34
	killtrigger 35
	echo ANSI_2 "***GOT FIGS**" ANSI_7
	setvar $count 1
	while ($count <= SECTORS)
		if ($figsec[$count] = 1)
			write $path & figgedsectors.txt $count & " " & $figsec[$count][1] & " " & $figsec[$count][2]
		end
		add $count 1
	end
	echo "*TOTAL FIGGED SECTORS: " $figsec
	setvar $gridpercent $figsec
	multiply $gridpercent 100
	divide $gridpercent SECTORS
	echo "*Percent of Grid " $gridpercent "%"
	write $path & figgedsectors.txt "Total Figged sectors: " & $figsec
	write $path & figgedsectors.txt "Percent of Grid: " & $gridpercent & "%"
#	send "d"
return

# make Unfigged Sectors File
:unFiggedSectors
setArray $unfiggedSec SECTORS
setvar $count 1
while ($count <= SECTORS)
	if ($figsec[$count] = 0)
		setvar $unfiggedSec[$count] 1
		if (PORT.EXISTS[$count] = 1)
			gosub :getporttype
			setvar $unfiggedSec[$count][1] $porttype
		end
		if ($deadEnds[$count] = 1)
			setvar $unfiggedSec[$count][2] "DeadEnd"
		end
	end
	add $count 1
end

setvar $count 1
while ($count <= SECTORS)
	if ($unfiggedSec[$count] = 1)
		write $path & unfiggedsectors.txt $count & " " & $unfiggedSec[$count][1] & " " & $unfiggedSec[$count][2]
	end
	add $count 1
end
# ----====[Get info from V screen]====----
:getstatus
echo ANSI_10 "**AT GET STATUS*"
send "v"
settextlinetrigger 40 :gettotalports "business"
pause
	:gettotalports
	killtrigger 40
	getword CURRENTLINE $totalports 1
	striptext $totalports ","
	settextlinetrigger 41 :gettotalplanets "Citadels."
	pause
		
	:gettotalplanets
	killtrigger 41
	getword CURRENTLINE $totalplanets 1
	getword CURRENTLINE $percentcit 7
	striptext $percentcit "%"
	if ($percentcit > 0)
		setvar $totalcits $totalplanets
		multiply $totalcits $percentcit
		divide $totalcits 100
		if ($totalcits = 0) AND ($percentcit > 0)
			add $totalcits 1
		end
	end
	settextlinetrigger 42 :gettotalfigs "Fighters and"
	pause
		
	:gettotalfigs
	killtrigger 42
	getword CURRENTLINE $totalgamefigs 1
	striptext $totalgamefigs ","
	settexttrigger 43 :gotVinfo "Command"
	pause
	
	:gotVinfo
	killtrigger 43
	return

# ----====[Get Corp Planets and Make corpplanets.txt]====----
:getcorpplanets
echo ANSI_10 "**AT GET CORP PLANETS*"
send "tl"
settextlinetrigger 50 :getplanets "Corporate Planet Scan"
pause

	:getplanets
	killtrigger 50
	settexttrigger 51 :gotcorpplanets "Corporate command"
	settextlinetrigger 52 :addplanet "Class"
	pause
	
	:addplanet
	killtrigger 51
	killtrigger 52
	getword CURRENTLINE $tempplanetsector 1
	cuttext CURRENTLINE $tempplanetname 10 31
	cuttext CURRENTLINE $tempplanettype 47 1
	cuttext CURRENTLINE $tempcitlevel 68 10
	add $corpplanets 1
	echo "*Plan # " $tempplanetsector " Name: " $tempplanetname " Type: " $tempplanettype " Cit Level: " $tempcitlevel
	write $path & corpplanets.txt $tempplanetsector & " | " & $tempplanetname  & " | " & $tempplanettype & " | " & $tempcitlevel
	if ($tempcitlevel <> "No Citadel")
		add $totalcorpcits 1
	end
	settexttrigger 51 :gotcorpplanets "Corporate command"
	settextlinetrigger 52 :addplanet "Class"
	pause
	
	:gotcorpplanets
	killtrigger 51
	killtrigger 52
	echo "*TOTAL CORP PLANETS: " $corpplanets
	echo "*Total Corp Cits: " $totalcorpcits
	setvar $uncontroledcits $totalcits
		subtract $uncontroledcits $totalcorpcits
	setvar $uncontroledplanets $totalplanets
	subtract $uncontroledplanets $corpplanets
	send "qd"
	settexttrigger 53 :donecorpplan "Command"
	pause

	:donecorpplan
	killtrigger 53
	return

# ----====[Make Status.txt]====----
:makestatus
echo ANSI_10 "**AT MAKE STATUS*"
write $path & status.txt "Total Ports: " & $totalports
write $path & status.txt "Total Ports In DB: " & $portsInDB
write $path & status.txt "Visible Ports: " & $visibleports
write $path & status.txt "Total Planets: " & $totalplanets
write $path & status.txt "Uncontroled Planets: " & $uncontroledplanets
write $path & status.txt "Total Cits: " & $totalcits
write $path & status.txt "Uncontroled Cits: "  & $uncontroledcits
write $path & status.txt "Total Game Figs: " & $totalgamefigs
return

# ----====[ Tunnel finder ]====----
:tunnelfind
echo ANSI_10 "**AT TUNNEL FINDER*"
# EP's code used for the tunnel finder
# Array all of the sectors that have 2 warps out
setVar $twoWarpSectors 0
setArray $twoWarps 0
setArray $tunnelSec SECTORS
setVar $i 11
while ($i <= SECTORS)
	# This should probably ensure that the two warps out are also warps in
	if (SECTOR.WARPCOUNT[$i]=2) and (SECTOR.BACKDOORCOUNT[$i]=0)
		# the first array is a sequential count (1,2,3) where $twoWarpSectors will end up being the exact count
		add $twoWarpSectors 1
		setVar $twoWarpSectors[$twoWarpSectors] $i
		# the second array is just to tag those that have two warps for future reference
		setVar $twoWarps[$i] 1
	end
	add $i 1
end

setVar $i 1
while ($i <= $twoWarpSectors)
	setVar $2Warp $twoWarpSectors[$i]
	setVar $tunnel $2Warp
	setVar $tunnelLength 1
	setVar $invalid 0
	setVar $checked[$2Warp] 1
	setVar $queue[1][1] SECTOR.WARPS[$2Warp][1]
	setVar $queue[2][1] SECTOR.WARPS[$2Warp][2]
	setVar $a 1
	setVar $b 1
	setVar $top 1
	while ($a < 3)
		while ($queue[$a][$b] <> 0) and ($checked[$queue[$a][$b]] = 0)
			setVar $focus $queue[$a][$b]
			setVar $checked[$focus] 1
			# If either end of the tunnel is a deadend, then the tunnel isn't a tunnel.
			# I end the first "if" instead of going on with "elseif" because I want all the adjoining
			# sectors tagged in the $checked array to avoid rechecking these sectors since they aren't a tunnel
			if ($deadEnds[$focus] = 1)
				setVar $invalid 1
			end
			if ($twoWarps[$focus] = 1)
				add $tunnelLength 1
				if ($a = 1)
					setVar $tunnel $focus & " " & $tunnel
				else
					setVar $tunnel $tunnel & " " & $focus
				end
				if ($checked[SECTOR.WARPS[$focus][1]] = 0)
					add $top 1
					setVar $queue[$a][$top] SECTOR.WARPS[$focus][1]
				elseif ($checked[SECTOR.WARPS[$focus][2]] = 0)
					add $top 1
					setVar $queue[$a][$top] SECTOR.WARPS[$focus][2]
				end
			end
			add $b 1
		end
		setVar $b 1
		setVar $top 1
		add $a 1
	end
	if ($tunnelLength > 1) and ($invalid = 0)
		setvar $tempTunnelLength $tunnelLength
		while ($tempTunnelLength > 0)
			getword $tunnel $tempTunnelSec $tempTunnelLength
			setvar $tunnelSec[$tempTunnelSec] 1
			add $tunnelSec 1
			subtract $tempTunnelLength 1
		end
#		echo "*" $tunnel
		write $path & tunnel.txt $tunnel
	end
	add $i 1
end
setvar $count 1
while ($count <= SECTORS)
	if ($tunnelSec[$count] = 1)
		write $path & tunnel_list.txt $count
	end
	add $count 1
end
write $path & tunnel_list.txt "Total Tunnel Sectors: " & $tunnelSec
echo "**Finished finding Tunnels"
return


# ====[ Make Missing Tunnel ]====
:makeMissingTunnels
echo ANSI_10 "**AT MISSING TUNNEL SECTORS*"
setvar $count 1
while ($count <= SECTORS)
	if ($tunnelSec[$count] = 1)
		if ($figSec[$count] = 0) AND ($visiblePorts[$count] = 0)
			write $path & missingtunnel.txt $count
		end
	end
	add $count 1
end

return

# ====[ blister finder ]====
:blisterfind
echo ANSI_10 "**AT BLISTERFINDER*"
setvar $currsec 11

while ($currsec <= SECTORS)
	if (SECTOR.WARPINCOUNT[$currsec] = 2) AND (SECTOR.WARPCOUNT[$currsec] >= 2)
		# echo ANSI_15 "*" $currsec " " SECTOR.WARPINCOUNT[$currsec] " " SECTOR.WARPCOUNT[$currsec]
		setvar $onehop1 SECTOR.WARPS[$currsec][1]
		setvar $onehop2 SECTOR.WARPS[$currsec][2]
		if (SECTOR.WARPCOUNT[$onehop1] >= 2) AND (SECTOR.WARPCOUNT[$onehop2] >= 2)
			GetDistance $dist1to2 $onehop1 $onehop2
			GetDistance $dist2to1 $onehop2 $onehop1
			# echo " " $dist1to2 " " $dist2to1
			if ($dist1to2 = 1) AND ($dist1to2 = 1)
			echo ANSI_12 "*BLISTER FOUND: " $onehop1 " " $currsec " " $onehop2
			write $path & blister.txt $onehop1 & " " & $currsec & " " & $onehop2
			end
		end	
	end
add $currsec 1
end
return

# ====[ Low Traffic Sector Finder ]====
# This will do getcourses from Dock to all dead ends and back.
# Then it will remove all sectors it sees in the getcourses
# Then it will remove all Tunnel sectors.
# whatever sectors are left are probably least used sectors.
:trafficfind
echo ANSI_10 "**AT TRAFFIC FINDER"
echo ANSI_12 "*This can take a while.  Relax for a bit." ANSI_10
setArray $leastUsedSec SECTORS
setvar $count 1
setvar $leastUsedSec[STARDOCK] 1
add $leastUsedSec 1
while ($count <= SECTORS)
	if ($deadEnds[$count] = 1)
		getcourse $course STARDOCK $count
		setvar $tempCourseLength ($course + 1)
		while ($tempCourseLength > 1)
			setvar $leastUsedSec[$course[$tempCourseLength]] 1
			subtract $tempCourseLength 1
		end
		getcourse $course $count STARDOCK
		setvar $tempCourseLength ($course + 1)
		while ($tempCourseLength > 1)
			setvar $leastUsedSec[$course[$tempCourseLength]] 1
			subtract $tempCourseLength 1
		end
		getcourse $course 1 $count
		setvar $tempCourseLength ($course + 1)
		while ($tempCourseLength > 1)
			setvar $leastUsedSec[$course[$tempCourseLength]] 1
			subtract $tempCourseLength 1
		end
		getcourse $course $count 1
		setvar $tempCourseLength ($course + 1)
		while ($tempCourseLength > 1)
			setvar $leastUsedSec[$course[$tempCourseLength]] 1
			subtract $tempCourseLength 1
		end
	end
	add $count 1
end
# remove tunnels here:
setvar $count 1
while ($count <= SECTORS)
	if ($tunnelSec[$count] = 1)
		setvar $leastUsedSec[$count] 1
	end
	add $count 1
end
setvar $count 1
while ($count <= SECTORS)
	if ($leastUsedSec[$count] = 0)
		write $path & "traffic.txt" $count & " warps in: " & SECTOR.WARPINCOUNT[$count] & " warps out: " & SECTOR.WARPCOUNT[$count]
	end
	add $count 1
end
return

# ----====[Get Date and Time]====----
:getdatetime
echo "* " DATE " " TIME
setvar $starttime TIME
striptext $starttime ":"
getword $starttime $ampmcheck 2
striptext $starttime "A"
striptext $starttime "M"
striptext $starttime "P"
striptext $starttime " "
if ($ampmcheck = "PM")
	add $starttime 120000
end
return

# ----====[Get Player Exp and Align]====----
:clvCompare
delete $path & clv_old.txt
rename $path & clv.txt $path & clv_old.txt
send "clv"
waitfor "---"
settextlinetrigger getCLV :getCLV
settexttrigger gotCLV :gotCLV "Computer command"
pause

:getCLV
killtrigger getCLV
add $clv 1
setvar $clv[$clv] CURRENTLINE
settextlinetrigger getCLV :getCLV
pause

:gotCLV
killtrigger getCLV
killtrigger gotCLV
setvar $count 1
while ($count <= $clv)
	if ($clv[$count] = "")
		subtract $clv 1
	else
		# Player Name
		cuttext $clv[$count] $clv[$count][1] 30 29
		# to deal with Asstard players who put in those pesky spaces!!!
		striptext $clv[$count][1] "  "
		getlength $clv[$count][1] $tempLen
		cuttext $clv[$count][1] $checkSpace $tempLen ($tempLen + 1)
		if ($checkSpace = " ")
			cuttext $clv[$count][1] $clv[$count][1] 1 ($tempLen - 1)
#			echo ANSI_10 "*Removed trailing space from: " $clv[$count][1] " CheckSpace: '" $checkSpace "'"
		end
		replacetext $clv[$count][1] " " "_"
		# Player EXP
		getword $clv[$count] $clv[$count][2] 2
		striptext $clv[$count][2] ","
		# Player Align
		getword $clv[$count] $clv[$count][3] 3
		striptext $clv[$count][3] ","
		# Player Corp
		getword $clv[$count] $clv[$count][4] 4
		if ($clv[$count][4] = #42 & #42)
			setvar $clv[$count][4] 0
		end
		# Player Ship
		cuttext $clv[$count] $clv[$count][5] 61 999
		add $count 1
	end
end
write $path & clv.txt "CLV: " & $clv
setvar $count 1
while ($count <= $clv)
	write $path & clv.txt " " & $clv[$count][1] & " " & $clv[$count][2] & " " & $clv[$count][3] & " " & $clv[$count][4] & " " & $clv[$count][5]
	add $count 1
end
send "q"
fileExists $oldCLVfile $path & clv_old.txt
if ($oldCLVfile = TRUE)
	goto :readOldCLV
else
	return
end

:readOldCLV
setvar $count 2
read $path & clv_old.txt $old_clv 1
getword $old_clv $old_clv 2
echo ANSI_10 "**Total Players = " $clv "*"
echo ANSI_10 "Old Total Players = " $old_clv "*"
while (($count - 1) <= $old_clv)
	read $path & clv_old.txt $old_clv[($count -1)] $count
	add $count 1
end
setvar $count 1
while ($count <= $old_clv)
	getword $old_clv[$count] $old_clv[$count][1] 1
	getword $old_clv[$count] $old_clv[$count][2] 2
	getword $old_clv[$count] $old_clv[$count][3] 3
	getword $old_clv[$count] $old_clv[$count][4] 4
	getword $old_clv[$count] $old_clv[$count][5] 5
	add $count 1
end
setvar $pointer 1
echo ANSI_10 "*Comparing old player list*"
setvar $foo ($foo - 1)
while ($pointer <= $clv)
	setvar $count 1
	while ($count <= $old_clv)
#		echo ANSI_11 "."
		if ($clv[$pointer][1] = $old_clv[$count][1])
			echo ANSI_12 $pointer " " $count " "
			setvar $clv[$pointer][6] ($clv[$pointer][2] - $old_clv[$count][2])
			setvar $clv[$pointer][7] ($clv[$pointer][3] - $old_clv[$count][3])
			if ($clv[$pointer][7] < 0)
				setvar $clv[$pointer][8] (($clv[$pointer][7] / 21) * 17271)
				setvar $clv[$pointer][8] ($clv[$pointer][8] * $foo)  
			end
			add $count $old_clv
		else
#			echo ANSI_12 "."
			add $count 1
		end
	end
	echo ANSI_13 ". "
	add $pointer 1
end
setvar $count 1
echo ANSI_10 "*Player exp and align changes:"
write $path & playertrack.txt "Date Time Name Exp_change Align_change red_SDT_Profit"
while ($count <= $clv)
	echo ANSI_10 "*" & $clv[$count][1] & " " & $clv[$count][6] & " " & $clv[$count][7] & " " & $clv[$count][8]
	write $path & playertrack.txt DATE & " " & $starttime & " " & $clv[$count][1] & " " & $clv[$count][6] & " " & $clv[$count][7] & " " & $clv[$count][8]
	add $count 1
end
write $path & playertrack.txt ""
return	
	
#----------------------------------------------
# ----====[ END OF SUBROUTINE SECTION ]====----
#----------------------------------------------


# -------------------------------------------
# ----====[ File Management Section ]====----
# -------------------------------------------
:updatefiles
# ====[setup path and check for old files]====
# implimented for future compares, but that's not implimented yet. 
setvar $path "dataminer\" & GAMENAME & "-"

# ====[ Old file cleanup, if needed]====
if ($update_deadend = "y")
	delete $path & deadend_old.txt
end
if ($update_missingdeadends = "y")
	delete $path & missingdeadends_old.txt
	delete $path & missingtunnel_old.txt
end
if ($update_lostports = "y")
	delete $path & lostports_old.txt
end
if ($update_portlist = "y")
	delete $path & portlist_old.txt
end
if ($update_missingsector = "y")
	delete $path & missingsector_old.txt
end
if ($update_uppedports = "y")
	delete $path & uppedports_old.txt
end
if ($update_drainedports = "y")
	delete $path & drainedports_old.txt
end
if ($update_figgedsectors = "y")
	delete $path & figgedsectors_old.txt
	delete $path & unfiggedsectors_old.txt
end
if ($update_status = "y")
	delete $path & status_old.txt
	delete $path & corpplanets_old.txt
end
if ($update_tunnel = "y")
	delete $path & tunnel_old.txt
	delete $path & tunnel_list_old.txt
end
if ($update_blister = "y")
	delete $path & blister_old.txt
end
if ($update_traffic = "y")
	delete $path & traffic_old.txt
end

# ====[copy current files to *_old, if needed]====
if ($update_deadend = "y")
	fileExists $deadendfile $path & deadend.txt
	if ($deadendfile = TRUE)
		rename $path & deadend.txt $path & deadend_old.txt
	end
end

if ($update_missingdeadends = "y")
	fileExists $missingdeadendsfile $path & missingdeadends.txt
	if ($missingdeadendsfile = TRUE)
		rename $path & missingdeadends.txt $path & missingdeadends_old.txt
		rename $path & missingtunnel.txt $path & missingtunnel_old.txt
	end
end

if ($update_lostports = "y")
	fileExists $lostportsfile $path & lostports.txt
	if ($lostportsfile = TRUE)
		rename $path & lostports.txt $path & lostports_old.txt
	end
end

if ($update_portlist = "y")
	fileExists $portlistfile $path & portlist.txt
	if ($portlistfile = TRUE)
		rename $path & portlist.txt $path & portlist_old.txt
	end
end

if ($update_missingsector = "y")
	fileExists $missingsectorfile $path & missingsector.txt
	if ($missingsectorfile = TRUE)
		rename $path & missingsector.txt $path & missingsector_old.txt
	end
end

if ($update_uppedports = "y")
	fileExists $uppedportsfile $path & uppedports.txt
	if ($uppedportsfile = TRUE)
		rename $path & uppedports.txt $path & uppedports_old.txt
	end
end

if ($update_drainedports = "y")
	fileExists $drainedportsfile $path & drainedports.txt
	if ($drainedportsfile = TRUE)
		rename $path & drainedports.txt $path & drainedports_old.txt
	end
end

if ($update_figgedsectors = "y")
	fileExists $figgedsectorsfile $path & figgedsectors.txt
	if ($figgedsectorsfile = TRUE)
		rename $path & figgedsectors.txt $path & figgedsectors_old.txt
		rename $path & unfiggedsectors.txt $path & unfiggedsectors_old.txt
		
	end
end

if ($update_status = "y")
	fileExists $statusfile $path & status.txt
	if ($statusfile = TRUE)
		rename $path & status.txt $path & status_old.txt
	end
	fileExists $corpplanetsfile $path & corpplanets.txt
	if ($corpplanetsfile = TRUE)
		rename $path & corpplanets.txt $path & corpplanets_old.txt
	end
end

if ($update_tunnel = "y")
	fileExists $tunnelfile $path & tunnel.txt
	if ($tunnelfile = TRUE)
		rename $path & tunnel.txt $path & tunnel_old.txt
		rename $path & tunnel_list.txt $path & tunnel_list_old.txt
	end
end

if ($update_blister = "y")
	fileExists $blisterfile $path & blister.txt
	if ($blisterfile = TRUE)
		rename $path & blister.txt $path & blister_old.txt
	end
end

if ($update_traffic = "y")
	fileExists $trafficfile $path & traffic.txt
	if ($trafficfile = TRUE)
		rename $path & traffic.txt $path & traffic_old.txt
	end
end
return
# ------------------------------------------------
# ----====[End of File Management Section]====----
# ------------------------------------------------


#----------------------------------------------
# ----====[ BEGINNING OF MENU SECTION ]====----
#----------------------------------------------
:startmenu
echo "*At startmenu*"
fileexists $setupfile "Data_Miner_Menu_setup.txt"
if $setupfile = FALSE
	goto :getmenuinfo
else
	read "Data_Miner_Menu_setup.txt" $update_deadend 1
	read "Data_Miner_Menu_setup.txt" $update_missingdeadends 2
	read "Data_Miner_Menu_setup.txt" $update_lostports 3
	read "Data_Miner_Menu_setup.txt" $update_portlist 4
	read "Data_Miner_Menu_setup.txt" $update_missingsector 5
	read "Data_Miner_Menu_setup.txt" $update_uppedports 6
	read "Data_Miner_Menu_setup.txt" $update_drainedports 7
	read "Data_Miner_Menu_setup.txt" $update_figgedsectors 8
	read "Data_Miner_Menu_setup.txt" $update_status 9
	read "Data_Miner_Menu_setup.txt" $update_tunnel 10
	read "Data_Miner_Menu_setup.txt" $update_blister 11
	read "Data_Miner_Menu_setup.txt" $update_traffic 12
	goto :createmenu
end	

:getmenuinfo
# ====[ Initialize Starting Variables ]====
setvar $update_deadend "y"
setvar $update_missingdeadends "y"
setvar $update_lostports "y"
setvar $update_portlist "y"
setvar $update_missingsector "y"
setvar $update_uppedports "y"
setvar $update_drainedports "y"
setvar $update_figgedsectors "y"
setvar $update_status "y"
setvar $update_tunnel "y"
setvar $update_blister "y"
setvar $update_traffic "y"
goto :createmenu

# ====[ Create the Menu]====
:createmenu
addMenu "" "dataminer" "Data Miner Setup" "." "" "Data Miner" FALSE
addMenu "dataminer" "Execute" "Start Data Miner" "Z" :Menu_Exec "" TRUE
addMenu "dataminer" "update_deadend" "Update Dead End List? " "A" :Menu_update_deaadend "" FALSE
addMenu "dataminer" "update_missingdeadends" "Update Missing Dead Ends? " "B" :Menu_update_missingdeadends "" FALSE
addMenu "dataminer" "update_lostports" "Update Lost Ports? " "C" :Menu_update_lostports "" FALSE
addMenu "dataminer" "update_portlist" "Update Total Port List? " "D" :Menu_update_portlist "" FALSE
addMenu "dataminer" "update_missingsector" "Update Total Missing Sectors? " "E" :Menu_update_missingsector "" FALSE
addMenu "dataminer" "update_uppedports" "Update Upped Ports? " "F" :Menu_update_uppedports "" FALSE
addMenu "dataminer" "update_drainedports" "Update drained Ports? " "G" :Menu_update_drainedports "" FALSE
addMenu "dataminer" "update_figgedsectors" "Update Figged Sectors? " "H" :Menu_update_figgedsectors "" FALSE
addMenu "dataminer" "update_status" "Update Status and Corp Planet List? " "I" :Menu_update_status "" FALSE
addMenu "dataminer" "update_tunnel" "Update Tunnel List? " "J" :Menu_update_tunnel "" FALSE
addMenu "dataminer" "update_blister" "Update Blister List? " "K" :Menu_update_blister "" FALSE
addMenu "dataminer" "update_traffic" "Update Least Used 3-ways? " "L" :Menu_update_traffic "" FALSE

# ====[ Set the menu values ]====
setmenuvalue "update_deadend" $update_deadend
setmenuvalue "update_missingdeadends" $update_missingdeadends
setmenuvalue "update_lostports" $update_lostports
setmenuvalue "update_portlist" $update_portlist
setmenuvalue "update_missingsector" $update_missingsector
setmenuvalue "update_uppedports" $update_uppedports
setmenuvalue "update_drainedports" $update_drainedports
setmenuvalue "update_figgedsectors" $update_figgedsectors
setmenuvalue "update_status" $update_status
setmenuvalue "update_tunnel" $update_tunnel
setmenuvalue "update_blister" $update_blister
setmenuvalue "update_traffic" $update_traffic

# ====[ Set the menu options ]====
setmenuoptions "dataminer" TRUE FALSE TRUE

# ====[ Set the menu HELP ]====
setmenuhelp "dataminer" "This menu configures the Data Miner Script Settings."
setmenuhelp "Execute" "This starts the script!"
setmenuhelp "update_deadend" "This tells the script if you want to update the dead end list."
setmenuhelp "update_missingdeadends" "This tells the script if you want to update the missing dead ends list."
setmenuhelp "update_lostports" "This tells the script if you want to update the lost ports list."
setmenuhelp "update_portlist" "This tells the script if you want to update the master port list."
setmenuhelp "update_missingsector" "This tells the script if you want to update the total missing sector list."
setmenuhelp "update_uppedports" "This tells the script if you want to update the upped ports list."
setmenuhelp "update_drainedports" "This tells the script if you want to update the drained ports list."
setmenuhelp "update_figgedsectors" "This tells the script if you want to update the figged sectors list." 
setmenuhelp "update_status" "This tells the script if you want to update the status file and the corp planet file."
setmenuhelp "update_tunnel" "This tells the script if you want to update the tunnel list."
setmenuhelp "update_blister" "This tells the script if you want to update the blister list."
setmenuhelp "update_traffic" "This tells the script if you want to update the least used 3-ways list."

# ====[ Open the menu ]====
# this actually activates the menu.
echo "[2J****"
openMenu "dataminer"

#----====[ Menu_exec, when you press "Z", you go here ]====----
# This option sends you back to :updatefiles
:Menu_Exec
delete "Data_Miner_Menu_setup.txt"
write "Data_Miner_Menu_setup.txt" $update_deadend
write "Data_Miner_Menu_setup.txt" $update_missingdeadends
write "Data_Miner_Menu_setup.txt" $update_lostports
write "Data_Miner_Menu_setup.txt" $update_portlist
write "Data_Miner_Menu_setup.txt" $update_missingsector
write "Data_Miner_Menu_setup.txt" $update_uppedports
write "Data_Miner_Menu_setup.txt" $update_drainedports
write "Data_Miner_Menu_setup.txt" $update_figgedsectors
write "Data_Miner_Menu_setup.txt" $update_status
write "Data_Miner_Menu_setup.txt" $update_tunnel
write "Data_Miner_Menu_setup.txt" $update_blister
write "Data_Miner_Menu_setup.txt" $update_traffic
return

# ====[ Menu_update_deaadend, when you press "A", you go here ]====
:Menu_update_deaadend
if $update_deadend = "y"
	setvar $update_deadend "n"
	setmenuvalue "update_deadend" $update_deadend
	echo "[2J****"
	openmenu "dataminer"
else
	setvar $update_deadend "y"
	setmenuvalue "update_deadend" $update_deadend
	echo "[2J****"
	openmenu "dataminer"
end

# ====[ Menu_update_missingdeadends, when you press "B", you go here ]====
:Menu_update_missingdeadends
if $update_missingdeadends = "y"
	setvar $update_missingdeadends "n"
	setmenuvalue "update_missingdeadends" $update_missingdeadends
	echo "[2J****"
	openmenu "dataminer"
else
	setvar $update_missingdeadends "y"
	setmenuvalue "update_missingdeadends" $update_missingdeadends
	echo "[2J****"
	openmenu "dataminer"
end

# ====[ Menu_update_lostports, when you press "C", you go here ]====
:Menu_update_lostports
if $update_lostports = "y"
	setvar $update_lostports "n"
	setmenuvalue "update_lostports" $update_lostports
	echo "[2J****"
	openmenu "dataminer"
else
	setvar $update_lostports "y"
	setmenuvalue "update_lostports" $update_lostports
	echo "[2J****"
	openmenu "dataminer"
end

# ====[ Menu_update_portlist, when you press "D", you go here ]====
:Menu_update_portlist
if $update_portlist = "y"
	setvar $update_portlist "n"
	setmenuvalue "update_portlist" $update_portlist
	echo "[2J****"
	openmenu "dataminer"
else
	setvar $update_portlist "y"
	setmenuvalue "update_portlist" $update_portlist
	echo "[2J****"
	openmenu "dataminer"
end

# ====[ Menu_update_missingsector, when you press "E", you go here ]====
:Menu_update_missingsector
if $update_missingsector = "y"
	setvar $update_missingsector "n"
	setmenuvalue "update_missingsector" $update_missingsector
	echo "[2J****"
	openmenu "dataminer"
else
	setvar $update_missingsector "y"
	setmenuvalue "update_missingsector" $update_missingsector
	echo "[2J****"
	openmenu "dataminer"
end

# ====[ Menu_update_uppedports, when you press "F", you go here ]====
:Menu_update_uppedports
if $update_uppedports = "y"
	setvar $update_uppedports "n"
	setmenuvalue "update_uppedports" $update_uppedports
	echo "[2J****"
	openmenu "dataminer"
else
	setvar $update_uppedports "y"
	setmenuvalue "update_uppedports" $update_uppedports
	echo "[2J****"
	openmenu "dataminer"
end

# ====[ Menu_update_drainedports, when you press "G", you go here ]====
:Menu_update_drainedports
if $update_drainedports = "y"
	setvar $update_drainedports "n"
	setmenuvalue "update_drainedports" $update_drainedports
	echo "[2J****"
	openmenu "dataminer"
else
	setvar $update_drainedports "y"
	setmenuvalue "update_drainedports" $update_drainedports
	echo "[2J****"
	openmenu "dataminer"
end

# ====[ Menu_update_figgedsectors, when you press "H", you go here ]====
:Menu_update_figgedsectors
if $update_figgedsectors = "y"
	setvar $update_figgedsectors "n"
	setmenuvalue "update_figgedsectors" $update_figgedsectors
	echo "[2J****"
	openmenu "dataminer"
else
	setvar $update_figgedsectors "y"
	setmenuvalue "update_figgedsectors" $update_figgedsectors
	echo "[2J****"
	openmenu "dataminer"
end

# ====[ Menu_update_status, when you press "I", you go here ]====
:Menu_update_status
if $update_status = "y"
	setvar $update_status "n"
	setmenuvalue "update_status" $update_status
	echo "[2J****"
	openmenu "dataminer"
else
	setvar $update_status "y"
	setmenuvalue "update_status" $update_status
	echo "[2J****"
	openmenu "dataminer"
end

# ====[ Menu_update_tunnel, when you press "J", you go here ]====
:Menu_update_tunnel
if $update_tunnel = "y"
	setvar $update_tunnel "n"
	setmenuvalue "update_tunnel" $update_tunnel
	echo "[2J****"
	openmenu "dataminer"
else
	setvar $update_tunnel "y"
	setmenuvalue "update_tunnel" $update_tunnel
	echo "[2J****"
	openmenu "dataminer"
end

# ====[ Menu_update_blister, when you press "K", you go here ]====
:Menu_update_blister
if $update_blister = "y"
	setvar $update_blister "n"
	setmenuvalue "update_blister" $update_blister
	echo "[2J****"
	openmenu "dataminer"
else
	setvar $update_blister "y"
	setmenuvalue "update_blister" $update_blister
	echo "[2J****"
	openmenu "dataminer"
end

# ====[ Menu_update_traffic, when you press "L", you go here ]====
:Menu_update_traffic
if $update_traffic = "y"
	setvar $update_traffic "n"
	setmenuvalue "update_traffic" $update_traffic
	echo "[2J****"
	openmenu "dataminer"
else
	setvar $update_traffic "y"
	setmenuvalue "update_traffic" $update_traffic
	echo "[2J****"
	openmenu "dataminer"
end
#----------------------------------------
# ----====[ END OF MENU SECTION ]====----
#----------------------------------------