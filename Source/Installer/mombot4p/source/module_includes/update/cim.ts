:update
        
	loadVar $PLAYER~unlimitedGame
	loadvar $GAME~ptradesetting
	loadvar $bot~bot_turn_limit
	loadVar $game~port_max
	loadVar $game~ptradesetting
	loadvar $bot~MCIC_FILE

	gosub :player~quikstats
	setVar $startingLocation $player~current_prompt
	isNumber $test $bot~parm1
	if ($test)
		if ($bot~parm1 > 0)
			setVar $upgradeLimit $bot~parm1
		else
			setVar $upgradeLimit 10000
		end
	else
		setVar $upgradeLimit 10000
	end
	setvar $switchboard~message "Stand By - CIMMING . . .*"
	gosub :switchboard~switchboard
	if (($bot~parm1 = "warps") OR ($bot~parm1 = "warp"))
		send "^iq"
		setvar $switchboard~message "Warp Data CIM Complete*"
		gosub :switchboard~switchboard
		return
	else
		send "^rq"
	end
	waitFor ": ENDINTERROG"
	setArray $mcic SECTORS
:mcic_looper
	fileExists $mcic_ck $bot~mcic_file
	if ($mcic_ck = 0)
		goto :done_mcic_read
	end
	setVar $mcic_count 1

:mcic_read_loop
		read $bot~mcic_file $mcicline $mcic_count
		if ($mcicline = EOF)
			goto :done_mcic_read
		end
		if ($mcicline = "")
			add $mcic_count 1
			goto :mcic_read_loop
		end
		getWord $mcicline $mcic_sec 2
		isNumber $number $mcic_sec
		if ($number = 0)
			add $mcic_count 1
			goto :mcic_read_loop
		end
		if ($mcic_sec <> "equ") or ($mcic_sec <> "org")
			add $mcic_count 1

:mcic_count_in
			read $bot~mcic_file $mcicline $mcic_count
			getWord $mcicline $mcic_line_ck 5
			if ($mcic_line_ck <> "cr")
				add $mcic_count 1
				goto :mcic_count_in
			end
			getWord $mcicline $mcic_org 2
			if ($mcic_org = "org")
				add $mcic_count 2
				goto :mcic_read_loop
			end
			getWord $mcicline $actual_mcic 13
			stripText $actual_mcic "/-65"
			if ($actual_mcic = "-65") or  ($actual_mcic = "-64") or  ($actual_mcic = "-63") or  ($actual_mcic = "-62") or  ($actual_mcic = "-61") or  ($actual_mcic = "-60")
				setVar $mcic[$mcic_sec] $actual_mcic
				setSectorParameter $mcic_sec "MCIC" $actual_mcic
				setSectorParameter $mcic_sec "GOODPORT" true
			end
			add $mcic_count 1
		else
			add $mcic_count 2
		end
		goto :mcic_read_loop

:done_mcic_read
	setVar $cim_count 1

:cim_looper
	setVar $sectiona SECTORS
	divide $sectiona 78
	setVar $echo_count 1	
	setVar $upped "  "
	setvar $switchboard~message  "Processing CIM...*"
	gosub :switchboard~switchboard
	gosub :player~quikstats
	While ($cim_count <= SECTORS)
		if (port.exists[$cim_count] = 1)
			setVar $isUpped FALSE
			setVar $currentfuel PORT.FUEL[$cim_count]
			multiply $currentfuel 100
			if (port.percentfuel[$cim_count] <> 0)
				divide $currentfuel port.percentfuel[$cim_count]
			end
			if ($currentfuel > $upgradeLimit)
				setVar $isUpped TRUE
			end
			setVar $currentorg port.org[$cim_count]
			multiply $currentorg 100
			if (port.percentorg[$cim_count] <> 0)
				divide $currentorg port.percentorg[$cim_count]
			end
			if ($currentorg > $upgradeLimit)
				setVar $isUpped TRUE
			end
			setVar $currentEquip port.equip[$cim_count]
			multiply $currentEquip 100
			if (port.percentequip[$cim_count] <> 0)
				divide $currentEquip port.percentequip[$cim_count]
			end
			if ($currentEquip > $upgradeLimit)
				setVar $isUpped TRUE
			end
			if ($isUpped = TRUE)
				setVar $upped $upped&" "&$cim_count&" " 
			end
		end
		add $cim_count 1
		if ($echo_count = $sectiona)
			echo ansi_13 #178
			setVar $echo_count 1
		else
			add $echo_count 1
		end
	end

	if ($startingLocation = "Command")
		send "tt"
	elseif ($startingLocation = "Citadel")
		send "xt"
	else 
		return
	end
	send "-----" $bot~bot_name "-----*"
	send "Upped Ports: (At least "&$upgradeLimit&" product level)*"
	setVar $cimout_count 1
	while ($cimout_count <= SECTORS)
		getWordPos $upped $pos " "&$cimout_count&" "
		if ($pos > 0)
			setVar $cimTemp $cimout_count & "(" 
			
			if (PORT.BUYFUEL[$cimout_count] = 1)
				setVar $cimTemp $cimTemp&"B" 
			else
				setVar $cimTemp $cimTemp&"S" 
			end
			if (PORT.BUYORG[$cimout_count] = 1)
				setVar $cimTemp $cimTemp&"B" 
			else
				setVar $cimTemp $cimTemp&"S" 
			end
			if (PORT.BUYEQUIP[$cimout_count] = 1)
				setVar $cimTemp $cimTemp&"B" 
			else
				setVar $cimTemp $cimTemp&"S" 
			end
			setVar $cimTemp $cimTemp&") "
			send $cimTemp
		end
		add $cimout_count 1
	end
	send "***"
	setVar $upped ""
	if ($mcic_ck = 1)
		if ($startingLocation = "Command")
			send "tt"
		elseif ($startingLocation = "Citadel")
			send "xt"
		else
			return
		end
	else
			return
		
	end
	send "Ports with MCIC at least -60/-65 :*"

:mcic_send_loop
	setVar $mcic_send_count 1
	while ($mcic_send_count <= SECTORS)
		if ($mcic[$mcic_send_count] <> 0)
			setVar $cimTemp $mcic_send_count & "(" 
			
			if (PORT.BUYFUEL[$mcic_send_count] = 1)
				setVar $cimTemp $cimTemp&"B" 
			else
				setVar $cimTemp $cimTemp&"S" 
			end
			if (PORT.BUYORG[$mcic_send_count] = 1)
				setVar $cimTemp $cimTemp&"B" 
			else
				setVar $cimTemp $cimTemp&"S" 
			end
			if (PORT.BUYEQUIP[$mcic_send_count] = 1)
				setVar $cimTemp $cimTemp&"B" 
			else
				setVar $cimTemp $cimTemp&"S" 
			end
			setVar $cimTemp $cimTemp&") "
			send $cimTemp & " MCIC = " & $mcic[$mcic_send_count] & "*"
		end
		add $mcic_send_count 1
	end
	send "***"
	setvar $switchboard~message "CIM Processing Complete!*"
	gosub :switchboard~switchboard
	setArray $mcic 10
return