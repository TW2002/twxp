#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:search~find
:search~near
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
loadvar $bot~parm1
loadvar $bot~parm2

setvar $search~near $bot~parm1
setvar $search~source $bot~parm2

isnumber $search~number $search~source
if ($search~number = true)
	if ($search~source <= 0)
		setvar $search~source currentsector
	end
	if ($search~source > sectors)
		setvar $switchboard~message "That sector is out of bounds (Must be between 1-"&sectors&")*"
		gosub :switchboard~switchboard
		halt
	end
else
	setvar $search~port_type $bot~parm2
	setvar $search~source currentsector
end

setvar $search~check_sector $search~source
gosub :search~load_fig_state
setvar $search~isfigged $search~check_figged

if ($search~isfigged = "")
	setvar $switchboard~message "It appears no grid data is available.  Run a fighter grid checker that uses the sector parameter FIGSEC. (Try figs command)*"
	gosub :switchboard~switchboard
	halt
end

if (($search~near <> "owner") and (($search~near <> "ufde") and (($search~near <> "f") and (($search~near <> "nf") and (($search~near <> "fde") and (($search~near <> "uf") and (($search~near <> "fp") and (($search~near <> "nfup") and (($search~near <> "fup") and (($search~near <> "p") and (($search~near <> "de") and (($search~near <> "fig") and (($search~near <> "nofig") and (($search~near <> "figport") and (($search~near <> "port") and ($search~near <> "deadend"))))))))))))))))
	setvar $switchboard~message "Please use - [type] [sector] format*"
	gosub :switchboard~switchboard
	halt
end

if (($search~near = "fp") or ($search~near = "port") or ($search~near = "p") or ($search~near = "nfup") or ($search~near = "fup"))
	getlength $search~port_type $search~plength
	if (($search~source = 0) or ($search~plength <> 3))
		setvar $search~port_type "xxx"
	end
	setvar $search~invalid false
	cuttext $search~port_type $search~pfuel 1 1
	if (($search~pfuel <> "s") and (($search~pfuel <> "b") and ($search~pfuel <> "x")))
		setvar $search~invalid true
	end
	cuttext $search~port_type $search~porg 2 1
	if (($search~porg <> "s") and (($search~porg <> "b") and ($search~porg <> "x")))
		setvar $search~invalid true
	end
	cuttext $search~port_type $search~pequip 3 1
	if (($search~pequip <> "s") and (($search~pequip <> "b") and ($search~pequip <> "x")))
		setvar $search~invalid true
	end
	if ($search~invalid)
		setvar $switchboard~message "Please use - [fp/p] [sector] [port type] format."
		gosub :switchboard~switchboard
		halt
	end
	setvar $search~ptype $search~port_type
	uppercase $search~ptype
end

setvar $search~check_sector $search~source
gosub :search~load_fig_state
setvar $search~isfigged $search~check_figged
getword sector.figs.owner[$search~source] $search~figowner 3
setvar $search~source_message ""

if (($search~near = "f") and ($search~isfigged = true))
	setvar $search~source_message "appears to be fig'd."
elseif (($search~near = "owner") and (($search~isfigged <> true) and ($search~figowner = "Corp#"&$search~target_corp&",")))
	setvar $search~source_message "appears to be fig'd by corp #"&$search~target_corp&"."
elseif ((($search~near = "nf") or ($search~near = "uf")) and ($search~isfigged <> true))
	setvar $search~source_message "is not figged."
else
	setvar $search~check_sector $search~source
	gosub :search~load_deadend_state
end

if (($search~near = "ufde") and (($search~isfigged = false) and ($search~check_deadend = true)))
	setvar $search~source_message "appears to be an unfigged dead-end."
elseif (($search~near = "fde") and (($search~isfigged = true) and ($search~check_deadend = true)))
	setvar $search~source_message "appears to be a figged dead-end."
elseif (($search~near = "de") and ($search~check_deadend = true))
	setvar $search~source_message "appears to be a dead-end."
elseif (($search~near = "fp") and (($search~isfigged = true) and ((port.class[$search~source] > 0) and (port.class[$search~source] < 9))))
	if (((($search~pfuel = "b") and (port.buyfuel[$search~source] = 1)) or (($search~pfuel = "s") and (port.buyfuel[$search~source] = 0))) or ($search~pfuel = "x"))
		if (((($search~porg = "b") and (port.buyorg[$search~source] = 1)) or (($search~porg = "s") and (port.buyorg[$search~source] = 0))) or ($search~porg = "x"))
			if (((($search~pequip = "b") and (port.buyequip[$search~source] = 1)) or (($search~pequip = "s") and (port.buyequip[$search~source] = 0))) or ($search~pequip = "x"))
				setvar $search~source_message " has a "&$search~ptype&" port that's figged."
			end
		end
	end
elseif ((($search~near = "port") or ($search~near = "p")) and ((port.class[$search~source] > 0) and (port.class[$search~source] < 9)))
	if (((($search~pfuel = "b") and (port.buyfuel[$search~source] = 1)) or (($search~pfuel = "s") and (port.buyfuel[$search~source] = 0))) or ($search~pfuel = "x"))
		if (((($search~porg = "b") and (port.buyorg[$search~source] = 1)) or (($search~porg = "s") and (port.buyorg[$search~source] = 0))) or ($search~porg = "x"))
			if (((($search~pequip = "b") and (port.buyequip[$search~source] = 1)) or (($search~pequip = "s") and (port.buyequip[$search~source] = 0))) or ($search~pequip = "x"))
				setvar $search~source_message " has a "&$search~ptype&" port."
			end
		end
	end
elseif (((($search~near = "fup") and ($search~isfigged = true)) or (($search~near = "nfup") and ($search~isfigged <> true))) and ((port.class[$search~source] > 0) and (port.class[$search~source] < 9)))
	setvar $search~foundfuelport false
	setvar $search~foundorgport false
	setvar $search~foundequipport false
	if ((((($search~pfuel = "b") and (port.buyfuel[$search~source] = 1)) and (port.fuel[$search~source] >= 10000)) or ((($search~pfuel = "s") and (port.buyfuel[$search~source] = 0)) and (port.fuel[$search~source] >= 10000))))
		setvar $search~foundfuelport true
	end
	if ((((($search~porg = "b") and (port.buyorg[$search~source] = 1)) and (port.org[$search~source] >= 10000)) or ((($search~porg = "s") and (port.buyorg[$search~source] = 0)) and (port.org[$search~source] >= 10000))))
		setvar $search~foundorgport true
	end
	if ((((($search~pequip = "b") and (port.buyequip[$search~source] = 1)) and (port.equip[$search~source] >= 10000)) or ((($search~pequip = "s") and (port.buyequip[$search~source] = 0)) and (port.equip[$search~source] >= 10000))))
		setvar $search~foundequipport true
	end
	if (($search~pfuel = "x") and (($search~porg = "x") and ($search~pequip = "x")))
		if (((($search~pfuel = "x") and (port.fuel[$search~source] >= 10000)) or (($search~porg = "x") and (port.org[$search~source] >= 10000))) or (($search~pequip = "x") and (port.equip[$search~source] >= 10000)))
			setvar $search~foundfuelport true
			setvar $search~foundorgport true
			setvar $search~foundequipport true
		end
	else
		if ($search~pfuel = "x")
			setvar $search~foundfuelport true
		end
		if ($search~porg = "x")
			setvar $search~foundorgport true
		end
		if ($search~pequip = "x")
			setvar $search~foundequipport true
		end
	end
	if (($search~foundfuelport = true) and (($search~foundorgport = true) and ($search~foundequipport = true)))
		if ($search~near = "fup")
			setvar $search~source_message " has an upped "&$search~ptype&" port that's figged."
		else
			setvar $search~source_message " has an upped "&$search~ptype&" port that's not figged."
		end
	end
end

gosub :breadth_search

if ($search~return_data <> "")
	setvar $switchboard~message $search~return_data
	if ($search~source_message <> "")
		setvar $search~check_sector $search~source
		gosub :search~load_fig_state
		setvar $search~isfigged3 $search~check_figged
		getsectorparameter $search~source "MINESEC" $search~ismined3
		getsectorparameter $search~source "LIMPSEC" $search~islimpd3
		if (($search~islimpd3 = true) and ($search~ismined3 = true))
			setvar $switchboard~message $switchboard~message&"*   *   Note: "&$search~source&"LA, "&$search~source_message
		else
			if ($search~islimpd3 = true)
				setvar $switchboard~message $switchboard~message&"*   *   Note: "&$search~source&"L, "&$search~source_message
			elseif ($search~ismined3 = true)
				setvar $switchboard~message $switchboard~message&"*   *   Note: "&$search~source&"A, "&$search~source_message
			else
				setvar $switchboard~message $switchboard~message&"*   *   Note: "&$search~source&", "&$search~source_message
			end
		end
		if ($search~isfigged3 = true)
			setvar $search~directions " "&$search~source&"F"&$search~directions
		else
			setvar $search~directions " "&$search~source&$search~directions
		end
	end
	setvar $switchboard~message $switchboard~message&"*"
	if (($switchboard~self_command <> true) or ($bot~silent_mode <> true))
		setvar $switchboard~self_command 2
	end
	gosub :switchboard~switchboard
end
return

:search~breadth_search
if ((($search~near = "f") or ($search~near = "nf")) or (($search~near = "uf") or (($search~near = "owner") or (($search~near = "de") or (($search~near = "ufde") or ($search~near = "fde"))))))
	gosub :search~breadth_search_inbound
	return
end
setvar $search~i 1
setvar $search~loop_data 1
getnearestwarps $search~neararray $search~source
while ($search~i <= $search~neararray)
	setvar $search~focus $search~neararray[$search~i]
	setvar $search~check_sector $search~focus
	gosub :search~load_fig_state
	setvar $search~isfigged2 $search~check_figged
	gosub :search~load_deadend_state
	getword sector.figs.owner[$search~focus] $search~figowner 3
	if ((($search~source <> $search~focus) and (($search~focus > 10) and ($search~focus <> $map~stardock))) and (((($search~near = "de") and ($search~check_deadend = true))) or ((($search~isfigged2 = false) and (($search~near = "uf") or ($search~near = "nf") or (($search~near = "owner") and ($search~figowner = "Corp#"&$search~target_corp&",")) or (($search~near = "ufde") and ($search~check_deadend = true)))) or (($search~isfigged2 = true) and (($search~near = "f") or (($search~near = "fde") and ($search~check_deadend = true)))))))
		getcourse $search~course $search~source $search~focus
		setvar $search~hops $search~course
		if ($search~hops > 0)
			setvar $search~courselength ($search~course + 1)
		else
			setvar $search~courselength 0
		end
		setvar $search~i 1
		setvar $search~fcount 0
		setvar $search~directions ""
		if ($search~near = "f")
			setvar $switchboard~message "Nearest Fig"
		elseif (($search~near = "uf") or ($search~near = "nf"))
			setvar $switchboard~message "Nearest Non-Fig"
		elseif ($search~near = "owner")
			setvar $switchboard~message "Nearest Corp #"&$search~target_corp&" Fig"
		elseif ($search~near = "de")
			setvar $switchboard~message "Nearest DE"
		elseif ($search~near = "ufde")
			setvar $switchboard~message "Nearest Non-Fig DE"
		elseif ($search~near = "fde")
			setvar $switchboard~message "Nearest Fig'd DE"
		end
		if ($search~course = 1)
			while (sector.warps[$search~source][$search~i] > 0)
				setvar $search~tempcheck sector.warps[$search~source][$search~i]
				setvar $search~check_sector $search~tempcheck
				gosub :search~load_fig_state
				setvar $search~isfigged3 $search~check_figged
				gosub :search~load_deadend_state
				getsectorparameter $search~tempcheck "MINESEC" $search~ismined3
				getsectorparameter $search~tempcheck "LIMPSEC" $search~islimpd3

				getword sector.figs.owner[$search~tempcheck] $search~figowner2 3
				if (((($search~near = "de") and ($search~check_deadend = true))) or ((($search~isfigged3 = true) and (($search~near = "f") or (($search~near = "fde") and ($search~check_deadend = true)))) or (($search~isfigged3 = false) and ((($search~near = "owner") and ($search~figowner2 = "Corp#"&$search~target_corp&",")) or ($search~near = "uf") or ($search~near = "nf") or (($search~near = "ufde") and ($search~check_deadend = true))))))
					setvar $search~directions $search~directions&$search~tempcheck
					if (($search~ismined3 = true) and ($search~islimpd3 = true))
						setvar $search~directions $search~directions&"LA"
					else
						if ($search~ismined3 = true)
							setvar $search~directions $search~directions&"A"
						elseif ($search~islimpd3 = true)
							setvar $search~directions $search~directions&"L"
						end
					end
					setvar $search~directions $search~directions&" "
					add $search~fcount 1
				end
				add $search~i 1
			end
			if ($search~fcount > 1)
				setvar $search~return_data $switchboard~message&"s adjacent to "&$search~source&" are*    [ "&$search~directions&"]"
			else
				setvar $search~return_data $switchboard~message&" adjacent to "&$search~source&" is*    [ "&$search~directions&"]"
			end
		else
			while ($search~i <= $search~courselength)
				setvar $search~check_sector $search~course[$search~i]
				gosub :search~load_fig_state
				setvar $search~isfigged3 $search~check_figged
				getsectorparameter $search~course[$search~i] "MINESEC" $search~ismined3
				getsectorparameter $search~course[$search~i] "LIMPSEC" $search~islimpd3
				if (($search~ismined3 = true) and ($search~islimpd3 = true))
					setvar $search~directions "LA"&$search~directions
				else
					if ($search~ismined3 = true)
						setvar $search~directions "A"&$search~directions
					end
					if ($search~islimpd3 = true)
						setvar $search~directions "L"&$search~directions
					end
				end
				if ($search~isfigged3 = true)
					setvar $search~directions " "&$search~course[$search~i]&"F"&$search~directions
				else
					setvar $search~directions " "&$search~course[$search~i]&$search~directions
				end

				add $search~i 1
			end
			setvar $search~return_data $switchboard~message&" to "&$search~source&" is "&$search~focus&" ("&$search~hops&" hops)*  <<"&$search~directions&" >>*                L: Limpet A: Armid F:Fighter  "
		end
		return
	elseif ((($search~near = "nfup") and ($search~isfigged2 = false)) or (($search~near = "fup") and ($search~isfigged2 = true)))
		setvar $search~foundfuelport false
		setvar $search~foundorgport false
		setvar $search~foundequipport false
		if (((port.class[$search~focus] > 0) and (port.class[$search~focus] < 9)) and ($search~focus <> $search~source))
			if ((((($search~pfuel = "b") and (port.buyfuel[$search~focus] = 1)) and (port.fuel[$search~focus] >= 10000)) or ((($search~pfuel = "s") and (port.buyfuel[$search~focus] = 0)) and (port.fuel[$search~focus] >= 10000))))
				setvar $search~foundfuelport true
			end
			if ((((($search~porg = "b") and (port.buyorg[$search~focus] = 1)) and (port.org[$search~focus] >= 10000)) or ((($search~porg = "s") and (port.buyorg[$search~focus] = 0)) and (port.org[$search~focus] >= 10000))))
				setvar $search~foundorgport true
			end
			if ((((($search~pequip = "b") and (port.buyequip[$search~focus] = 1)) and (port.equip[$search~focus] >= 10000)) or ((($search~pequip = "s") and (port.buyequip[$search~focus] = 0)) and (port.equip[$search~focus] >= 10000))))
				setvar $search~foundequipport true
			end
			if (($search~pfuel = "x") and (($search~porg = "x") and ($search~pequip = "x")))
				if (((($search~pfuel = "x") and (port.fuel[$search~focus] >= 10000)) or (($search~porg = "x") and (port.org[$search~focus] >= 10000))) or (($search~pequip = "x") and (port.equip[$search~focus] >= 10000)))
					setvar $search~foundfuelport true
					setvar $search~foundorgport true
					setvar $search~foundequipport true
				end
			else
				if ($search~pfuel = "x")
					setvar $search~foundfuelport true
				end
				if ($search~porg = "x")
					setvar $search~foundorgport true
				end
				if ($search~pequip = "x")
					setvar $search~foundequipport true
				end
			end
			if (($search~foundfuelport = true) and (($search~foundorgport = true) and ($search~foundequipport = true)))
				if ($search~loop_data = 1)
					getcourse $search~course $search~source $search~focus
					setvar $search~hops $search~course
					setvar $search~return_data "Nearest Figged upgraded "&$search~ptype&" port(s) to "&$search~source&": "&$search~focus&" ("&$search~hops&" hops)"
				elseif ($search~loop_data = 2)
					getcourse $search~course $search~source $search~focus
					setvar $search~hops $search~course
					setvar $search~return_data $search~return_data&", "&$search~focus&" ("&$search~hops&" hops)"
				else
					getcourse $search~course $search~source $search~focus
					setvar $search~hops $search~course
					setvar $search~return_data $search~return_data&", and "&$search~focus&" ("&$search~hops&" hops)"
					setvar $search~loop_data 1
					return
				end
				add $search~loop_data 1
			end
		end
	elseif ((($search~near = "port") or ($search~near = "p")) or (($search~near = "fp") and ($search~isfigged2 = true)))
		if (((port.class[$search~focus] > 0) and (port.class[$search~focus] < 9)) and ($search~focus <> $search~source))
			if (((($search~pfuel = "b") and (port.buyfuel[$search~focus] = 1)) or (($search~pfuel = "s") and (port.buyfuel[$search~focus] = 0))) or ($search~pfuel = "x"))
				if (((($search~porg = "b") and (port.buyorg[$search~focus] = 1)) or (($search~porg = "s") and (port.buyorg[$search~focus] = 0))) or ($search~porg = "x"))
					if (((($search~pequip = "b") and (port.buyequip[$search~focus] = 1)) or (($search~pequip = "s") and (port.buyequip[$search~focus] = 0))) or ($search~pequip = "x"))
						if ($search~loop_data = 1)
							getcourse $search~course $search~source $search~focus
							setvar $search~hops $search~course
							setvar $search~return_data "Nearest Figged "&$search~ptype&" port(s) to "&$search~source&": "&$search~focus&" ("&$search~hops&" hops)"
						elseif ($search~loop_data = 2)
							getcourse $search~course $search~source $search~focus
							setvar $search~hops $search~course
							setvar $search~return_data $search~return_data&", "&$search~focus&" ("&$search~hops&" hops)"
						else
							getcourse $search~course $search~source $search~focus
							setvar $search~hops $search~course
							setvar $search~return_data $search~return_data&", and "&$search~focus&" ("&$search~hops&" hops)"
							setvar $search~loop_data 1
							return
						end
						add $search~loop_data 1
					end
				end
			end
		end
	end
	add $search~i 1
end

setvar $search~return_data "Nothing found for that search."
return

:search~focus_matches_near
setvar $search~focus_match false
if ((($search~source <> $search~focus) and (($search~focus > 10) and ($search~focus <> $map~stardock))) and (((($search~near = "de") and ($search~check_deadend = true))) or ((($search~isfigged2 = false) and (($search~near = "uf") or ($search~near = "nf") or (($search~near = "owner") and ($search~figowner = "Corp#"&$search~target_corp&",")) or (($search~near = "ufde") and ($search~check_deadend = true)))) or (($search~isfigged2 = true) and (($search~near = "f") or (($search~near = "fde") and ($search~check_deadend = true)))))))
	setvar $search~focus_match true
end
return

:search~breadth_search_inbound
setarray $search~checked sectors
setarray $search~queue sectors
setarray $search~depth sectors
setvar $search~bottom 1
setvar $search~top 1
setvar $search~found_depth 0
setvar $search~match_count 0
setvar $search~directions ""
setvar $search~return_data ""
setvar $search~queue[1] $search~source
setvar $search~depth[$search~source] 0
setvar $search~checked[$search~source] true
gosub :search~set_result_title
while ($search~bottom <= $search~top)
	setvar $search~focus $search~queue[$search~bottom]
	setvar $search~focus_depth $search~depth[$search~focus]
	if (($search~found_depth > 0) and ($search~focus_depth > $search~found_depth))
		goto :search~finish_inbound_search
	end
	setvar $search~check_sector $search~focus
	gosub :search~load_fig_state
	setvar $search~isfigged2 $search~check_figged
	gosub :search~load_deadend_state
	getword sector.figs.owner[$search~focus] $search~figowner 3
	gosub :search~focus_matches_near
	if ($search~focus_match = true)
		getcourse $search~course $search~focus $search~source
		setvar $search~hops $search~course
		if ($search~hops > 0)
			if (($search~found_depth = 0) or ($search~hops = $search~found_depth))
				if ($search~found_depth = 0)
					setvar $search~found_depth $search~hops
				end
				add $search~match_count 1
				if ($search~found_depth = 1)
					gosub :search~append_adjacent_match
				elseif ($search~match_count = 1)
					gosub :search~build_navigable_result
				end
			end
		end
	end
	if ($search~found_depth = 0)
		setvar $search~i 1
		while (sector.warpsin[$search~focus][$search~i] > 0)
			setvar $search~adjacent sector.warpsin[$search~focus][$search~i]
			if ($search~checked[$search~adjacent] <> true)
				setvar $search~checked[$search~adjacent] true
				add $search~top 1
				setvar $search~queue[$search~top] $search~adjacent
				setvar $search~depth[$search~adjacent] ($search~focus_depth + 1)
			end
			add $search~i 1
		end
	end
	add $search~bottom 1
end

:search~finish_inbound_search
if ($search~match_count <= 0)
	setvar $search~return_data "Nothing found for that search."
elseif ($search~found_depth = 1)
	if ($search~match_count > 1)
		setvar $search~return_data $switchboard~message&"s adjacent to "&$search~source&" are*    [ "&$search~directions&"]"
	else
		setvar $search~return_data $switchboard~message&" adjacent to "&$search~source&" is*    [ "&$search~directions&"]"
	end
end
return

:search~append_adjacent_match
setvar $search~check_sector $search~focus
gosub :search~load_fig_state
setvar $search~isfigged3 $search~check_figged
getsectorparameter $search~focus "MINESEC" $search~ismined3
getsectorparameter $search~focus "LIMPSEC" $search~islimpd3
setvar $search~directions $search~directions&$search~focus
if ($search~isfigged3 = true)
	setvar $search~directions $search~directions&"F"
end
if (($search~ismined3 = true) and ($search~islimpd3 = true))
	setvar $search~directions $search~directions&"LA"
else
	if ($search~ismined3 = true)
		setvar $search~directions $search~directions&"A"
	elseif ($search~islimpd3 = true)
		setvar $search~directions $search~directions&"L"
	end
end
setvar $search~directions $search~directions&" "
return

:search~build_navigable_result
setvar $search~directions ""
setvar $search~i 1
setvar $search~courselength ($search~course + 1)
while ($search~i <= $search~courselength)
	setvar $search~course_sector $search~course[$search~i]
	gosub :search~append_direction_sector
	add $search~i 1
end
setvar $search~return_data $switchboard~message&" to "&$search~source&" is "&$search~focus&" ("&$search~hops&" hops to target)*  <<"&$search~directions&" >>*                L: Limpet A: Armid F:Fighter  "
return

:search~set_result_title
if ($search~near = "f")
	setvar $switchboard~message "Nearest Fig"
elseif (($search~near = "uf") or ($search~near = "nf"))
	setvar $switchboard~message "Nearest Non-Fig"
elseif ($search~near = "owner")
	setvar $switchboard~message "Nearest Corp #"&$search~target_corp&" Fig"
elseif ($search~near = "de")
	setvar $switchboard~message "Nearest DE"
elseif ($search~near = "ufde")
	setvar $switchboard~message "Nearest Non-Fig DE"
elseif ($search~near = "fde")
	setvar $switchboard~message "Nearest Fig'd DE"
end
return

:search~append_direction_sector
setvar $search~check_sector $search~course_sector
gosub :search~load_fig_state
setvar $search~isfigged3 $search~check_figged
getsectorparameter $search~course_sector "MINESEC" $search~ismined3
getsectorparameter $search~course_sector "LIMPSEC" $search~islimpd3
if ($search~directions <> "")
	setvar $search~directions $search~directions&" "
end
setvar $search~directions $search~directions&$search~course_sector
if ($search~isfigged3 = true)
	setvar $search~directions $search~directions&"F"
end
if (($search~ismined3 = true) and ($search~islimpd3 = true))
	setvar $search~directions $search~directions&"LA"
else
	if ($search~ismined3 = true)
		setvar $search~directions $search~directions&"A"
	elseif ($search~islimpd3 = true)
		setvar $search~directions $search~directions&"L"
	end
end
return

:search~load_fig_state
getsectorparameter $search~check_sector "FIGSEC" $search~check_figged
return

:search~load_deadend_state
setvar $search~check_deadend false
setvar $search~known_warps 0
setvar $search~de_idx 1
while (($search~de_idx <= 6) and (sector.warps[$search~check_sector][$search~de_idx] > 0))
	add $search~known_warps 1
	add $search~de_idx 1
end

if ($search~known_warps = 1)
	if (sector.warpcount[$search~check_sector] = 1)
		setvar $search~check_deadend true
	end
end
return

include "source\include\switchboard"
