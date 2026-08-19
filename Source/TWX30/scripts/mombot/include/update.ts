#============================= REFRESH FIGHTER SUBROUTINE =======================================
:update~fighters
setvar $switchboard~message "Loading current fighter locations. . .*"
gosub :switchboard~switchboard
getsectorparameter 2 "FIG_COUNTR" $previouscount
getsectorparameter 2 "FUEL_COUNT" $previousfuelcount
getsectorparameter 2 "ORG_COUNT" $previousorgcount
getsectorparameter 2 "EQU_COUNT" $previousequipcount
getsectorparameter 2 "EQS_COUNT" $previousequipsellcount
getsectorparameter 2 "FB_COUNT" $previousfuelbuycount

if ($previouscount = "")
	setvar $previouscount 0
end
if ($previousfuelcount = "")
	setvar $previousfuelcount 0
end
if ($previousorgcount = "")
	setvar $previousorgcount 0
end
if ($previousequipcount = "")
	setvar $previousequipcount 0
end
if ($previousequipsellcount = "")
	setvar $previousequipsellcount 0
end
if ($previousfuelbuycount = "")
	setvar $previousfuelbuycount 0
end

:readfighterlist
setvar $count 0
setvar $personalcount 0
setvar $1sCount 0
setvar $2sCount 0
setvar $3sCount 0
setvar $4sCount 0
setvar $5sCount 0
setvar $6sCount 0
setvar $?scount 0
setvar $tollcount 0
setvar $offcount 0
setvar $defcount 0
setvar $fuelcount 0
setvar $orgcount 0
setvar $equipcount 0
setvar $equipsellcount 0
setvar $upgradedequipcount 0
setvar $upgradedequipsellcount 0
setvar $upgradedfuelbuycount 0
setvar $upgradedorgcount 0
setvar $upgradedfuelcount 0

send "g"
setvar $i 1
setvar $personaloutput " "
setvar $output " "
setvar $ckoutput " "

:keepcounting
settextlinetrigger corporate 		:corpcount 	" Corp"
settextlinetrigger personal 		:personalcount	"Personal "
settextlinetrigger donecountingfigs	:donecounting 	"Total"
settextlinetrigger donenofigs 		:donecounting 	"No fighters deployed"
pause

:personalcount
add $count 1
add $personalcount 1
getword currentline $sector 1
getword currentline $type 4
setvar $personaloutput $personaloutput&" "&$sector&"  "
settextlinetrigger personal 		:personalcount	"Personal "
pause

:corpcount
add $count 1
add $player~corpcount 1
getword currentline $sector 1
getword currentline $type 4
if ($type = "Toll")
	add $tollcount 1
elseif ($type = "Offensive")
	add $offcount 1
elseif ($type = "Defensive")
	add $defcount 1
end
while ($i <= $sector)
	getwordpos $personaloutput $pos " "&$i&" "
	if (($sector = $i) or ($pos > 0))
		setvar $output $output&$i&"*"
		setvar $ckoutput $ckoutput&$i&"  "
		setsectorparameter $i "FIGSEC" true
		if ((port.exists[$i] = true))
			setvar $currentequip (port.equip[$i]*100)
			if (port.percentequip[$i] <> 0)
				divide $currentequip port.percentequip[$i]
			end
			if (port.buyequip[$i] = false)
				if ($currentequip > 10000)
					add $upgradedequipsellcount 1
				end
			else
				if ($currentequip > 10000)
					add $upgradedequipcount 1
				end
			end
			if (port.buyorg[$i] = true)
				setvar $currentorg (port.org[$i]*100)
				if (port.percentorg[$i] <> 0)
					divide $currentorg port.percentorg[$i]
				end
				if ($currentorg > 10000)
					add $upgradedorgcount 1
				end
			end
			if (port.buyfuel[$i] = false)
				setvar $currentfuel (port.fuel[$i]*100)
				if (port.percentfuel[$i] <> 0)
					divide $currentfuel port.percentfuel[$i]
				end
				if ($currentfuel > 10000)
					add $upgradedfuelcount 1
				end
			else
				setvar $currentfuel (port.fuel[$i]*100)
				if (port.percentfuel[$i] <> 0)
					divide $currentfuel port.percentfuel[$i]
				end
				if ($currentfuel > 10000)
					add $upgradedfuelbuycount 1
				end

			end
		end
		setvar $tempwarpcount sector.warpincount[$i]
		setvar $tempwarpcountout sector.warpcount[$i]
		if ($tempwarpcount > 0) and ($tempwarpcountout > 0)
			if ($tempwarpcount = 1)
				add $1sCount 1
			elseif ($tempwarpcount = 2)
				add $2sCount 1
			elseif ($tempwarpcount = 3)
				add $3sCount 1
			elseif ($tempwarpcount = 4)
				add $4sCount 1
			elseif ($tempwarpcount = 5)
				add $5sCount 1
			elseif ($tempwarpcount = 6)
				add $6sCount 1
			end
		else
			add $?scount 1
		end

	else
		setvar $output $output&"0*"
		setvar $ckoutput $ckoutput&"0  "
		setsectorparameter $i "FIGSEC" false
	end
	add $i 1
end
settextlinetrigger corporate 		:corpcount 	" Corp"
pause

:donecounting
killalltriggers
while ($i <= sectors)
	getwordpos $personaloutput $pos " "&$i&" "
	if ($pos > 0)
		setvar $ckoutput $ckoutput&$i&"  "
		setvar $output $output&$i&"*"
		setsectorparameter $i "FIGSEC" true
	else
		setvar $ckoutput $ckoutput&"0  "
		setvar $output $output&"0*"
		setsectorparameter $i "FIGSEC" false
	end
	add $i 1
end

setsectorparameter 2 "FIG_COUNT" $count
setsectorparameter 2 "FIG_COUNTR" $count
setsectorparameter 2 "FUEL_COUNT" $upgradedfuelcount
setsectorparameter 2 "ORG_COUNT" $upgradedorgcount
setsectorparameter 2 "EQU_COUNT" $upgradedequipcount
setsectorparameter 2 "EQS_COUNT" $upgradedequipsellcount
setsectorparameter 2 "FB_COUNT" $upgradedfuelbuycount

return
# ============================== END REFRESH FIGHTERS (FIGS) SUB ==============================
:update~report
if ($count <> 0)
	setvar $percent  (($count * 100) / sectors)
	setvar $1percent (($1scount * 100) / $count)
	setvar $2percent (($2scount * 100) / $count)
	setvar $3percent (($3scount * 100) / $count)
	setvar $4percent (($4scount * 100) / $count)
	setvar $5percent (($5scount * 100) / $count)
	setvar $6percent (($6scount * 100) / $count)
	setvar $?percent (($?scount * 100) / $count)
end
setvar $gridchange $count-$previouscount
if ($gridchange > 0)
	setvar $gridchange "+"&$gridchange
end
setvar $gridfuelchange $upgradedfuelcount-$previousfuelcount
if ($gridfuelchange > 0)
	setvar $gridfuelchange "+"&$gridfuelchange
end
setvar $gridorgchange $upgradedorgcount-$previousorgcount
if ($gridorgchange > 0)
	setvar $gridorgchange "+"&$gridorgchange
end
setvar $gridequipchange $upgradedequipcount-$previousequipcount
if ($gridequipchange > 0)
	setvar $gridequipchange "+"&$gridequipchange
end
setvar $gridequipsellchange $upgradedequipsellcount-$previousequipsellcount
if ($gridequipsellchange > 0)
	setvar $gridequipsellchange "+"&$gridequipsellchange
end
setvar $gridfuelbuychange $upgradedfuelbuycount-$previousfuelbuycount
if ($gridfuelbuychange > 0)
	setvar $gridfuelbuychange "+"&$gridfuelbuychange
end

setvar $inputvariable $1scount
gosub :player~formatnumberforspaces
setvar $1scountformatted $outputvariable
setvar $inputvariable $2scount
gosub :player~formatnumberforspaces
setvar $2scountformatted $outputvariable
setvar $inputvariable $3scount
gosub :player~formatnumberforspaces
setvar $3scountformatted $outputvariable
setvar $inputvariable $4scount
gosub :player~formatnumberforspaces
setvar $4scountformatted $outputvariable
setvar $inputvariable $5scount
gosub :player~formatnumberforspaces
setvar $5scountformatted $outputvariable
setvar $inputvariable $6scount
gosub :player~formatnumberforspaces
setvar $6scountformatted $outputvariable

setvar $inputvariable $1percent
gosub :player~formatpercentagesforspaces
setvar $1percentformatted $outputvariable
setvar $inputvariable $2percent
gosub :player~formatpercentagesforspaces
setvar $2percentformatted $outputvariable
setvar $inputvariable $3percent
gosub :player~formatpercentagesforspaces
setvar $3percentformatted $outputvariable
setvar $inputvariable $4percent
gosub :player~formatpercentagesforspaces
setvar $4percentformatted $outputvariable
setvar $inputvariable $5percent
gosub :player~formatpercentagesforspaces
setvar $5percentformatted $outputvariable
setvar $inputvariable $6percent
gosub :player~formatpercentagesforspaces
setvar $6percentformatted $outputvariable

setvar $switchboard~message $switchboard~message&"          - Fighter Grid Report -*          - "&$count&" sectors, "&$personalcount&" personal. ("&$percent&"%) ("&$gridchange&" Change)*          - T: "&$tollcount&"  O: "&$offcount&"  D:"&$defcount&"*          - DE: "&$1sCountformatted&""&$1percentformatted&" 2S: "&$2sCountformatted&""&$2percentformatted&" 3S: "&$3sCountformatted&""&$3percentformatted&"*          - 4S: "&$4sCountformatted&""&$4percentformatted&" 5S: "&$5sCountformatted&""&$5percentformatted&" 6S: "&$6sCountformatted&""&$6percentformatted&"*          - Upgraded Sxx: "&$upgradedfuelcount&" ("&$gridfuelchange&" Change)*          - Upgraded xBx: "&$upgradedorgcount&" ("&$gridorgchange&" Change)*          - Upgraded xxB: "&$upgradedequipcount&" ("&$gridequipchange&" Change)*          - Upgraded xxS: "&$upgradedequipsellcount&" ("&$gridequipsellchange&" Change)*          - Upgraded Bxx: "&$upgradedfuelbuycount&" ("&$gridfuelbuychange&" Change)**"

return

:update~cim
loadvar $player~unlimitedgame
loadvar $game~ptradesetting
loadvar $bot~bot_turn_limit
loadvar $game~port_max
loadvar $game~ptradesetting
loadvar $bot~mcic_file

gosub :player~quikstats
setvar $startinglocation $player~current_prompt
isnumber $test $bot~parm1
if ($test)
	if ($bot~parm1 > 0)
		setvar $upgradelimit $bot~parm1
	else
		setvar $upgradelimit 10000
	end
else
	setvar $upgradelimit 10000
end
setvar $switchboard~message "Stand By - CIMMING . . .*"
gosub :switchboard~switchboard
if (($bot~parm1 = "warps") or ($bot~parm1 = "warp"))
	send "^iq"
	setvar $switchboard~message "Warp Data CIM Complete*"
	gosub :switchboard~switchboard
	return
else
	send "^rq"
end
waitfor ": ENDINTERROG"
setarray $orgmcic sectors
setarray $equmcic sectors
setvar $cim_count 1

:cim_looper
setvar $sectiona sectors
divide $sectiona 78
setvar $echo_count 1
setvar $upped "  "
setvar $switchboard~message  "Processing CIM...*"
gosub :switchboard~switchboard
gosub :player~quikstats
while ($cim_count <= sectors)
	if (port.exists[$cim_count] = 1)
		setvar $isupped false
		setvar $currentfuel port.fuel[$cim_count]
		multiply $currentfuel 100
		if (port.percentfuel[$cim_count] <> 0)
			divide $currentfuel port.percentfuel[$cim_count]
		end
		if ($currentfuel > $upgradelimit)
			setvar $isupped true
		end
		setvar $currentorg port.org[$cim_count]
		multiply $currentorg 100
		if (port.percentorg[$cim_count] <> 0)
			divide $currentorg port.percentorg[$cim_count]
		end
		if ($currentorg > $upgradelimit)
			setvar $isupped true
		end
		setvar $currentequip port.equip[$cim_count]
		multiply $currentequip 100
		if (port.percentequip[$cim_count] <> 0)
			divide $currentequip port.percentequip[$cim_count]
		end
		if ($currentequip > $upgradelimit)
			setvar $isupped true
		end
		if ($isupped = true)
			setvar $upped $upped&" "&$cim_count&" "
		end
		if (port.buyorg[$cim_count] = true)
			getsectorparameter $cim_count "ORGMCIC" $tmp_orgmcic
			if ($tmp_orgmcic <= "-65")
				setvar $orgmcic[$cim_count] $tmp_orgmcic
			else
				setvar $orgmcic[$cim_count] 0
			end
		end
		if (port.buyequip[$cim_count] = true)
			getsectorparameter $cim_count "EQUMCIC" $tmp_equmcic
			if ($tmp_equmcic <= "-60")
				setvar $equmcic[$cim_count] $tmp_equmcic
			else
				setvar $equmcic[$cim_count] 0
			end
		end
	end
	add $cim_count 1
	if ($echo_count = $sectiona)
		echo ansi_13 #178
		setvar $echo_count 1
	else
		add $echo_count 1
	end
end

setvar $switchboard~message "Upped Ports: (At least "&$upgradelimit&" product level)"
#setvar $i 0
setvar $cimout_count 1
setvar $cim_first_upped true
while ($cimout_count <= sectors)
	getwordpos $upped $pos " "&$cimout_count&" "
	if ($pos > 0)
		if ($cim_first_upped = true)
			setvar $switchboard~message $switchboard~message & "*"
			setvar $cim_first_upped false
		end
		setvar $cimtemp ""
		striptext $cimout_count " "
		if ($cimout_count < 10)
			setvar $cimtemp "    "&$cimout_count&"("
		elseif ($cimout_count < 100)
			setvar $cimtemp "   "&$cimout_count&"("
		elseif ($cimout_count < 1000)
			setvar $cimtemp "  "&$cimout_count&"("
		elseif ($cimout_count < 10000)
			setvar $cimtemp " "&$cimout_count&"("
		else
			setvar $cimtemp $cimout_count&"("
		end
		#setvar $cimtemp $cimout_count & "("
		if (port.buyfuel[$cimout_count] = 1)
			setvar $cimtemp $cimtemp&"B"
		else
			setvar $cimtemp $cimtemp&"S"
		end
		if (port.buyorg[$cimout_count] = 1)
			setvar $cimtemp $cimtemp&"B"
		else
			setvar $cimtemp $cimtemp&"S"
		end
		if (port.buyequip[$cimout_count] = 1)
			setvar $cimtemp $cimtemp&"B"
		else
			setvar $cimtemp $cimtemp&"S"
		end
		setvar $cimtemp $cimtemp&") "
		setvar $switchboard~message $switchboard~message & $cimtemp
		#add $i 1
		#if ($i = 6)
		#	setvar $switchboard~message $switchboard~message & "*"
		#	setvar $i 0
		#end
	end
	add $cimout_count 1
end
setvar $upped ""

setvar $switchboard~message $switchboard~message & "*Ports with MCIC at least -60/-65 :"

:mcic_send_loop
setvar $mcic_send_count 1
while ($mcic_send_count <= sectors)
	if ($orgmcic[$mcic_send_count] <> 0) or ($equmcic[$mcic_send_count] <> 0)
		setvar $cimtemp $mcic_send_count & "("
		if (port.buyfuel[$mcic_send_count] = 1)
			setvar $cimtemp $cimtemp&"B"
		else
			setvar $cimtemp $cimtemp&"S"
		end
		if (port.buyorg[$mcic_send_count] = 1)
			setvar $cimtemp $cimtemp&"B"
		else
			setvar $cimtemp $cimtemp&"S"
		end
		if (port.buyequip[$mcic_send_count] = 1)
			setvar $cimtemp $cimtemp&"B"
		else
			setvar $cimtemp $cimtemp&"S"
		end
		setvar $cimtemp $cimtemp&") "
		if ($orgmcic[$mcic_send_count] <> 0)
			setvar $cimtemp $cimtemp&" ORGMCIC="&$orgmcic[$mcic_send_count]&" "
		end
		if ($equmcic[$mcic_send_count] <> 0)
			setvar $cimtemp $cimtemp&" EQUMCIC="&$equmcic[$mcic_send_count]&" "
		end
		setvar $switchboard~message $switchboard~message & "*" & $cimtemp
	end
	add $mcic_send_count 1
end
setvar $switchboard~message $switchboard~message & "*CIM Processing Complete!*"
gosub :switchboard~switchboard
setarray $mcic 10
return

include "source\include\player"
