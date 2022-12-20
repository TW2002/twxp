# TWX SupG Script       : PairFinderSupG
# Author          	: SupG
#Date Completed/Updated : 12/21/02
# Description      	: Searches CIM information for port pairs of any given type
# Trigger Point    	: Command prompt
# Other            	: Let me know of any problems with this script
#		www.scripterstavern.com

#initialize script=-==--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--=-=-=-=
setArray $goodsector SECTORS
setVar $writefile GAMENAME & "_PAIRS.txt"
delete $writefile
write $writefile "Type Perc  Fig Sec     Value"
write $writefile "------------------------------"
setVar $looper 0
setVar $leasttrade 0
setVar $goodie 0
#=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-=-=

#gather information=-=-=-=-=-=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

setVar $info_inc~scriptName " SupGPairFinder"
gosub :info_inc~signature
	
:info_gather
echo ANSI_13 "*Trade What?"
echo ANSI_15 "*1 - Organics & Equipment"
echo ANSI_15 "*2 - Fuel & Equipment"
echo ANSI_15 "*3 - Fuel & Organics"
echo ANSI_15 "*4 - SSM Pairs"
echo ANSI_15 "*5 - All Pairs*"
getconsoleinput $sellboth singlekey
isNumber $chk $sellboth
if ($chk = 0)
	goto :info_gather
end
if ($sellboth < 1) or ($sellboth > 5)
	goto :info_gather
end
if ($sellboth < 4)
:least
	getInput $leasttrade "Least amount on ports (in percent)?" 100
	isNumber $chk $leasttrade
	if ($chk = "FALSE")
		goto :lease
	end
	if ($leasttrade < 0) or ($leasttrade > 100)
		clientmessage "Invalid percentage"
		goto :least
	end
end
#=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

#main function=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-=-=-=-=-=
:main
gosub :run_cim
gosub :info_inc~fig_list
waitfor "(?="
echo ansi_15 "*Finding Port Pairs : Calculating...* "
gosub :calculate
echo ansi_15 "*Finding Port Pairs : Done...  Pairs listed in : " $writefile "*"
halt
#-=-=-=-=-=-=-=-=-=-=-=-=--=-==--=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-

#subroutines=--=-=-=-=-=-=-=-=-=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
#cim sub
:run_cim
setVar $info_inc~cn9 "SPACE"
gosub :info_inc~cn
send "^rq"
waitfor ": ENDINTERROG"
if ($info_inc~cn9change = 1)
	setVar $info_inc~cn9 "ALL"
	gosub :info_inc~cn
end
return

#calculate sub
:calculate
setVar $adjloop 0
if ($looper < SECTORS)
	add $looper 1
	if (PORT.CLASS[$looper] = "-1")
		goto :calculate
	end
:adjloop
	if ($adjloop < SECTOR.WARPCOUNT[$looper])
       		add $adjloop 1
		setVar $adjsector SECTOR.WARPS[$looper][$adjloop]
		setVar $adjportclass PORT.CLASS[$adjsector]
       		setVar $portclass PORT.CLASS[$looper]
        	if ($done[$adjsector] = 1)
			goto :adjloop
		end
		getDistance $other $adjsector $looper
    		if ($other > 1)
			goto :adjloop
		end		
       		if ($sellboth = 1) or ($sellboth = 5)
           		setVar $message "O-E"
			if (PORT.PERCENTORG[$adjsector] < $leasttrade) OR (PORT.PERCENTORG[$looper] < $leasttrade) or (PORT.PERCENTEQUIP[$adjsector] < $leasttrade) OR (PORT.PERCENTEQUIP[$looper] < $leasttrade)
				goto :1out
			end
			if ($portclass = 1) and ($adjportclass = 2) 
				gosub :write
			  	goto :1out
			end
			if ($portclass = 1) and ($adjportclass = 4) 
				gosub :write
				goto :1out
			end
			if ($portclass = 5) and ($adjportclass = 4) 
				gosub :write
				goto :1out
			end
			if ($portclass = 5) and ($adjportclass = 2) 
				gosub :write
				goto :1out
			end
			if ($portclass = 2) and ($adjportclass = 1) 
				gosub :write
				goto :1out
			end
			if ($portclass = 2) and ($adjportclass = 5) 
				gosub :write
				goto :1out
			end
			if ($portclass = 4) and ($adjportclass = 5) 
				gosub :write
				goto :1out
			end
			if ($portclass = 4) and ($adjportclass = 1) 
				gosub :write
				goto :1out
			end
		end
        :1out
		if ($sellboth = 2) or ($sellboth = 5)
			setVar $message "F-E"
			if (PORT.PERCENTFUEL[$adjsector] < $leasttrade) OR (PORT.PERCENTFUEL[$looper] < $leasttrade) or (PORT.PERCENTEQUIP[$adjsector] < $leasttrade) OR (PORT.PERCENTEQUIP[$looper] < $leasttrade)
				goto :2out
			end
           		if ($portclass = 1) and ($adjportclass = 3) 
				gosub :write
				goto :2out
			end
			if ($portclass = 1) and ($adjportclass = 4) 
				gosub :write
				goto :2out
			end
			if ($portclass = 6) and ($adjportclass = 3) 
				gosub :write
				goto :2out
			end
			if ($portclass = 6) and ($adjportclass = 4) 
				gosub :write
				goto :2out
			end
			if ($portclass = 3) and ($adjportclass = 1) 
				gosub :write
				goto :2out
			end
			if ($portclass = 3) and ($adjportclass = 6) 
				gosub :write
				goto :2out
			end
			if ($portclass = 4) and ($adjportclass = 1) 
				gosub :write
				goto :2out
			end
			if ($portclass = 4) and ($adjportclass = 6) 
				gosub :write
				goto :2out
			end
		end
        :2out
		if ($sellboth = 3) or ($sellboth = 5)
			setVar $message "F-O"
           		if (PORT.PERCENTORG[$adjsector] < $leasttrade) OR (PORT.PERCENTORG[$looper] < $leasttrade) or (PORT.PERCENTFUEL[$adjsector] < $leasttrade) OR (PORT.PERCENTFUEL[$looper] < $leasttrade)
				goto :3out
			end
			if ($portclass = 2) and ($adjportclass = 3) 
				gosub :write
				goto :3out
			end
			if ($portclass = 3) and ($adjportclass = 2) 
				gosub :write
				goto :3out
			end
			if ($portclass = 2) and ($adjportclass = 5) 
				gosub :write
				goto :3out
			end
			if ($portclass = 5) and ($adjportclass = 2) 
				gosub :write
				goto :3out
			end
			if ($portclass = 3) and ($adjportclass = 6) 
				gosub :write
				goto :3out
			end
			if ($portclass = 6) and ($adjportclass = 3) 
				gosub :write
				goto :3out
			end
			if ($portclass = 5) and ($adjportclass = 6) 
				gosub :write
				goto :3out
			end
			if ($portclass = 6) and ($adjportclass = 5) 
				gosub :write
				goto :3out
			end
		end
	:3out
		if ($sellboth = 4) or ($sellboth = 5)	
			setVar $message "SSM"
			if (PORT.BUYEQUIP[$looper] = 1) and (PORT.BUYEQUIP[$adjsector] = 1)
				gosub :write
			end
		end
	goto :adjloop
	end
	setVar $done[$looper] 1
goto :calculate
end
return


#write to file
:write
if ($info_inc~figlist[$looper] = 1)
	setVar $jumpfig1 "<#>"
else
	setVar $jumpfig1 "< >"
end
if ($info_inc~figlist[$adjsector] = 1)
	setVar $jumpfig2 "<#>"
else
	setVar $jumpfig2 "< >"
end
if ($message = "SSM")
	setVar $perc "SSM "
else
	if ($leastTrade = 100)
		setVar $perc "100%"
	elseif ($leastTrade < 10)
    	setVar $perc " " & $leastTrade & "%+"
	else
		setVar $perc $leastTrade & "%+"
	end
end
write $writefile $message & " |" & $perc & "| " & $jumpfig1 & " " & $looper & " (" & PORT.FUEL[$looper] & "/" & PORT.ORG[$looper] & "/" & PORT.EQUIP[$looper] & ")  >>"
write $writefile "           " & $jumpfig2 & " " & $adjsector & " (" &  PORT.FUEL[$adjsector] & "/" & PORT.ORG[$adjsector] & "/" & PORT.EQUIP[$adjsector] & ")"
return

include "info_inc"