:runcim
setVar $cim_file GAMENAME & "_CIM.txt"
setVar $cim_temp GAMENAME & "_CIM.tmp"
setVar $log_file GAMENAME & "_HNT.txt"
fileExists $file_check $cim_temp
if ($init = 1)
	delete $cim_temp
	setVar $init 0
end
fileExists $file_check $cim_file
if ($file_check = 0)
	setVar $new_file 1
	goto :get_cim
end

:wait
:get_cim
setVar $colon 0
setVar $used_port_count 0
setVar $Cim_file_place 1
send "^R"
:getstarter
setTextTrigger starter :starter
pause

:starter
getWord CURRENTLINE $heh 1
if ($heh <> ":")
	goto :getstarter
end

:cim
setVar $spanky 0 
setTextLineTrigger cim :cimmer
pause

:cimmer
setVar $info CURRENTLINE
getWord $info $end_test 1
if ($end_test = "0")
	goto :done
end
stripText $info "-"
if ($new_file = 1)
       	write $cim_file $info
	goto :cim
else
	write $cim_temp $info
:read_file
	read $cim_file $cim_info $cim_file_place
	if ($cim_info = "EOF")
		setVar $cim_info_sector 50000
	else
		getWord $cim_info $cim_info_sector 1
	end
	getWord $info $info_sector 1
	if ($cim_info_sector = $info_sector)
		if ($ignore = 0)
			if ($info_sector = 0)
				goto :done
			end
			getWord $cim_info $cim_info_fuel 3
			getWord $cim_info $cim_info_orgs 5
			getWord $cim_info $cim_info_equi 7
			getWord $info $info_fuel 3
			getWord $info $info_orgs 5
			getWord $info $info_equi 7
			stripText $info_fuel "%"
			stripText $info_orgs "%"
			stripText $info_equi "%"
			stripText $cim_info_fuel "%"
			stripText $cim_info_orgs "%"
			stripText $cim_info_equi "%"
			if ($cim_info_fuel > $info_fuel) or ($cim_info_orgs > $info_orgs) or ($cim_info_equi > $info_equi)
				add $used_port_count 1
				if ($cim_info_fuel > $info_fuel)
					setVar $fueldifference $cim_info_fuel
				subtract $fueldifference $info_fuel
					add $spanky 1
				end
				if ($cim_info_orgs > $info_orgs)
					setVar $orgsdifference  $cim_info_orgs
					subtract $orgsdifference $info_orgs
					add $spanky 2
				end
				if ($cim_info_equi > $info_equi)
					setVar $equidifference $cim_info_equi
					subtract $equidifference $info_equi
					add $spanky 4
				end
				if ($spanky = 1)
					setVar $change_port[$used_port_count] "  CIM : Sector " & $info_sector & " down " & $fueldifference & "% in fuel."
				elseif ($spanky = 2)
					setVar $change_port[$used_port_count] "  CIM : Sector " & $info_sector & " down " & $orgsdifference & "% in orgs."
				elseif ($spanky = 4)
					setVar $change_port[$used_port_count] "  CIM : Sector " & $info_sector & " down " & $equidifference & "% in equipment."
				elseif ($spanky = 3)
					setVar $change_port[$used_port_count] "  CIM : Sector " & $info_sector & " down " & $fueldifference & "% in fuel and " & $orgsdifference & "% in orgs."
				elseif ($spanky = 5)
					setVar $change_port[$used_port_count] "  CIM : Sector " & $info_sector & " down " & $fueldifference & "% in fuel and " & $equidifference & "% in equipment."
				elseif ($spanky = 6)
					setVar $change_port[$used_port_count] "  CIM : Sector " & $info_sector & " down " & $orgsdifference & "% in orgs and " & $equidifference & "% in equipment."
				else
					setVar $change_port[$used_port_count] "  CIM : Sector " & $info_sector & " down " & $fueldifference & "% in fuel, "  & $orgsdifference & "% in orgs, " & $equidifference & "% in equipment."
				end
			end
		end
		setVar $last_added $info_sector
		add $cim_file_place 1
		goto :cim
	elseif ($cim_info_sector > $info_sector)
		setVar $last_added $info_sector
		add $used_port_count 1
		setVar $change_port[$used_port_count] "  CIM : Sector " & $info_sector & " is now responding."
		goto :cim
	elseif ($cim_info_sector < $info_sector)
		add $used_port_count 1
		add $cim_file_place 1
		setVar $change_port[$used_port_count] "  CIM : Sector " & $cim_info_sector & " is no longer responding."
		goto :read_file
	end
end
				
:done
killtrigger done
killtrigger cim
if ($new_file = 1)
	setVar $new_file 0
else
	delete $cim_file
	rename $cim_temp $cim_file
end
return


	