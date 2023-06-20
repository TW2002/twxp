loadVar $SupGBot_Script
if ($SupGBot_Script)
	setVar $botloaded 1
	setVAr $SupGBot_Script 0
	saveVar $SupGBot_Script

	loadVar $SupGBot_parm1
	loadVar $SupGBot_parm2
	loadVar $SupGBot_parm3
	loadVar $SupGBot_parm4
	
	setVar $planet $SupGBot_parm1
	
	setVar $SupGBot_parm1 0
	setVar $SupGBot_parm2 0
	setVar $SupGBot_parm3 0
	setVar $SupGBot_parm4 0
	
	saveVar $SupGBot_parm1
	saveVar $SupGBot_parm2
	saveVar $SupGBot_parm3
	saveVar $SupGBot_parm4
	
	goto :top
end



getInput $planet "Planet #"
:top
if ($botloaded)
	setTextLineTrigger stopscript :stopscript "STOP"
	gosub :nearfig_inc~figrefresh
else
	gosub :nearfig_inc~fig_list
end
send "'Two Way Torp Script Running*"
if ($botloaded)
	send "'(SupGTwoWayTorp): script loaded by SupGBot, say STOP in subspace to stop the script.*"
end
send "l" $planet "*c"
waitfor "Citadel"

:wait
killtrigger go
killtrigger stopscript
setTextLineTrigger stopscript :stopscript "STOP"
setTextLineTrigger go :go "Deployed Fighters Report Sector"
pause

:go
getWord CURRENTLINE $tester 1
if ($tester = "Deployed")
	getWord CURRENTLINE $origsec 5
	stripText $origsec ":"
	setVar $nearfig_inc~figList[$origsec] 0
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
	if ($nearfig_inc~figList[$cfadj] = 1) AND (SECTOR.WARPCOUNT[$cfadj] = 2)
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
	getDistance $hop1 $origsec SECTOR.WARPS[$cf][1]
	getDistance $hop2 $origsec SECTOR.WARPS[$cf][2]
	send "p" $cf "*"
	setTextLineTrigger lock :lock "Locating beam pinpointed"	
	setTextLineTrigger nolock :nolock "You cannot "
	pause

	:lock
	killtrigger nolock
	getDistance $dist $origsec $cf
	:getemwait
	killalltriggers
	setTextLineTrigger getem :getem "Deployed Fighters Report Sector "
	#setDelayTrigger delay :delay 10000
	pause

	:nolock
	setVar $nearfig_inc~figList[$cf] 0
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
setVar $nearfig_inc~figList[$newhit] 0
if ($newhit = $cf)
send "y  cpy" 
if ($hop1 > $hop2)
	send SECTOR.WARPS[$cf][1]
else
	send SECTOR.WARPS[$cf][2]
end
send "*qqqsh"
waitfor "Warps to Sector(s) :"
send "l" $planet "*c"
send "'Fired photon into " 
if ($hop1 > $hop2)
	send SECTOR.WARPS[$cf][1]
else
	send SECTOR.WARPS[$cf][2]
end
send " from " $cf "*"
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
	setVar $nearfig_inc~figList[$sechit] 0
	setVar $deadends[$sechit] 0
	if ($watch = "ON")
		setVar $origsec $sechit
		setVar $fhit 1
		goto :chkorig
	end
end
goto :top

:stopscript
killtrigger go
getWord CURRENTLINE $tst 1
if ($tst <> "R")
	goto :wait
else
	send "'Script stopped.*"
	halt
end


halt
include "supginclude\nearfig_inc"	

