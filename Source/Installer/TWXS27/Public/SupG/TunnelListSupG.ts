# TWX SupG Script       : SupGTunnelList
# Author          	: SupG
#Date Completed/Updated : 01/30/02
# Description      	: Searches CIM information for tunnels, a tunnel is a string
#			  of two way warps not necessarily closed off by a deadend.
# Trigger Point    	: Command prompt
# Other            	: Let me know of any problems with this script
#		www.scripterstavern.com

setVar $writefile GAMENAME & "_TUNNELS.txt"
delete $writefile
write $writefile "Key:  + - fig in sector"
write $writefile "  (XXX) - port type in sector"
write $writefile "----------------------------------------------------------**"
setVar $info_inc~scriptname "SupGTunnelList "
gosub :info_inc~signature

:mindeep
getInput $mindeep "Minimum length of tunnel?"
isNumber $chk $mindeep
if ($chk = 0)
	goto :mindeep
end
if ($mindeep < 2)
	goto :mindeep
end
#main function=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-=-=-=-=-=
echo ANSI_15 "*Update CIM data?"
getConsoleInput $upcim singlekey
lowerCase $upcim
if ($upcim = "y")
	gosub :warpspec
end
gosub :info_inc~fig_list
echo "[2J"
echo ansi_15 "*Finding Tunnels : Status (| = 10%)*"
echo "1%        100%* "
gosub :calculate
echo ansi_15 "*Done, info in file : " $writefile "*"
halt
#-=-=-=-=-=-=-=-=-=-=-=-=--=-==--=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-

#subroutines=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-
#warpspec update
:warpspec
setVar $info_inc~cn9 "SPACE"
gosub :info_inc~cn
send "^rq"
waitfor ": ENDINTERROG"
if ($info_inc~cn9change = 1)
	setVar $info_inc~cn9 "ALL"
	gosub :info_inc~cn
end
return

:calculate
setVar $count 10
:calc
setVar $progress (SECTORS / 10)
add $status 1
if ($status = $progress)
	echo ANSI_12 "|"
	setVar $status 0
end
setVar $deep 0
if ($count < SECTORS)
	add $count 1
	setVar $warpnum 1
	setVar $splat 0
	setVar $adj $count
	:chk
	add $splat 1
	if (SECTOR.WARPCOUNT[$adj] = 2) and ($used[$adj] <> 1)
		:write
		gosub :secinf
		add $deep 1
		if ($deep > 1) AND ($warpnum = 1)
			setVar $tunnel " < " & $tunnel
			setVar $tunnel $wrt & $tunnel
		elseif ($deep > 1) AND ($warpnum = 2)
			setVar $tunnel $tunnel & " > "
			setVar $tunnel $tunnel & $wrt
		elseif ($deep = 1)
			setVar $tunnel $wrt
		end
		:2side
		setVar $slappy 0
		setVar $used[$adj] 1
		setVar $prev $adj
		:slappy
		if ($slappy < 2)	
			add $slappy 1
			setVar $adj SECTOR.WARPS[$adj][$slappy]
			getDistance $dist $adj $prev
			if (SECTOR.WARPCOUNT[$adj] = 2) and ($used[$adj] <> 1) and ($dist = 1)
				setVar $warpnum $slappy
				goto :write
			end
			setVar $adj $prev
			goto :slappy
		end
		setVar $adj $count	
		if ($splat = 1)
			add $splat 1
			goto :2side
		end
		
	end
	if ($splat > 1)
		if ($deep >= $mindeep)
			write $writefile $tunnel
		end
		goto :calc
	else
		goto :calc
	end
end

return

:secinf
setVar $wrt $adj
if ($info_inc~figList[$adj] = 1)
	setVar $wrt "+" & $adj
end
if (PORT.CLASS[$adj] <> "-1")
	setVar $info_inc~classchk PORT.CLASS[$adj]
	gosub :info_inc~chkclass
	setVar $wrt $wrt & "(" & $info_inc~class & ")"
end
return

include "info_inc"