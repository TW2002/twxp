getInput $dedfile "Deadend List"
getInput $planet "Planet #"
gosub :info_inc~fig_list
setArray $deadends SECTORS
setVar $rdcnt 1
delete GAMENAME & "_HEH.txt"
:rdcnt
read $dedfile $sec $rdcnt
getWord $sec $sec 1
if ($sec <> "EOF")
	if ($info_inc~figList[$sec] = 1)
		write GAMENAME & "_HEH.txt" $sec
		setVar $deadends[$sec] 1
	end
	add $rdcnt 1
	goto :rdcnt
end
send "l" $planet "*c"
waitfor "Citadel"
send "'Deadend Trap Script Running*"
:wait

setTextLineTrigger go :go "Deployed Fighters Report Sector"
pause

:go
getWord CURRENTLINE $tester 1
if ($tester = "Deployed")
	getWord CURRENTLINE $origsec 5
	stripText $origsec ":"
	setVar $info_inc~figList[$origsec] 0
	setVar $deadends[$origsec] 0
	goto :chkorig
else
	goto :wait
end

:chkorig
setVar $cfadjacents 0
setVar $rally 0
setVar $finishcf 0
setVar $cf 0
setArray $done SECTORS
setVar $cfsector $origsec

:start
if ($deadends[$origsec] = 1)
	setVar $cf $origsec
	goto :finishcf
end

gosub :close

if ($finishcf = 1)
	goto :finishcf
end

:rally
if ($rally < $cfadjacents)
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
	if ($deadends[$cfadj] = 1)
		setVar $cf $cfadj
		setVar $finishcf 1
		return
	else
		add $cfadjacents 1
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
	echo "*" $cf "*"
	if ($info_inc~figList[SECTOR.WARPSIN[$cf][1]] = 1)
		send "p" SECTOR.WARPSIN[$cf][1] "*"
		setTextLineTrigger lock :lock "Locating beam pinpointed"	
		setTextLineTrigger nolock :nolock "You cannot "
		pause

		:lock
		killtrigger nolock
		getDistance $dist $origsec $cf
		:getemwait
		killalltriggers
		setTextLineTrigger getem :getem "Deployed Fighters Report Sector "
		setDelayTrigger delay :delay 10000
		pause

		:nolock
		setVar $info_inc~figList[SECTOR.WARPSIN[$cf][1]] 0
		killtrigger lock
		goto :wait

end
goto :wait

:delay
killtrigger getem
send "n"
goto :wait

:getem
killtrigger delay
getWord CURRENTLINE $newhit 5
stripText $newhit ":"
setVar $info_inc~figList[$newhit] 0
setVar $deadends[$newhit] 0
if ($newhit = SECTOR.WARPSIN[$cf][1])
	send "ycpy" $cf "*qqqsh"
	waitfor "Warps to Sector(s) :"
	send "l" $planet "*c"
	send "'Fired photon into " $cf "*"
	sound message.wav
else
	getDistance $newdist $newhit $cf
	if ($newdist > $dist)
		send "n"
		setVar $origsec $newhit
		goto :chkorig
	else
		goto :getemwait
	end
end
halt

:fighit
getWord CURRENTLINE $fedfilter 1
getWord CURRENTLINE $sechit 5
stripText $sechit ":"
if ($fedfilter = "Deployed")
	setVar $info_inc~figList[$sechit] 0
	setVar $deadends[$sechit] 0
	if ($watch = "ON")
		setVar $origsec $sechit
		setVar $fhit 1
		goto :chkorig
	end
end
goto :top

halt
include "info_inc"	

