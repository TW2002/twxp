	logging off

	gosub :BOT~loadVars
	loadvar $MAP~STARDOCK
	loadvar $map~home_sector
	loadvar $SHIP~cap_file
	loadvar $game~internalAliens
	loadvar $game~internalFerrengi
	loadvar $game~limpet_cost
	loadvar $game~limpet_removal_cost
	loadvar $game~armid_cost
	loadvar $game~photon_cost
	loadvar $game~DISRUPTOR_COST

#	setVar $BOT~help[1] $BOT~tab&"Lister"
#	gosub :bot~helpfile

	setVar $BOT~script_title "Lister"
	gosub :BOT~banner


	setvar $line $bot~user_command_line

	################################################
	## Strip out all parameters from command line ##
	################################################

	##Check for port type first - default is xxx

	setvar $buy_fuel "both"
	setvar $buy_org "both"
	setvar $buy_equip "both"

	setvar $i 1
	setvar $isFound false
	while (($i <= 70) and ($isFound <> true))
		getWordPos " "&$line&" " $pos " "&$i&" "
		if ($pos > 0)
			setvar $find_mcic_value $i
			setvar $isFound true
			setvar $find_port true
			setvar $find_good_mcic true
		end
		add $i 1
	end

	setvar $i 1
	while (($i <= 70) and ($isFound <> true))
		getWordPos " "&$line&" " $pos " -"&$i&" "
		if ($pos > 0)
			setvar $find_mcic_value $i
			setvar $isFound true
			setvar $find_port true
			setvar $find_good_mcic true
		end
		add $i 1
	end


	getWordPos $line $pos "sss"
	if ($pos > 0)
		setvar $buy_fuel false
		setvar $buy_org false
		setvar $buy_equip false
		setvar $find_port true
	end
	getWordPos $line $pos "bss"
	if ($pos > 0)
		setvar $buy_fuel true
		setvar $buy_org false
		setvar $buy_equip false
		setvar $find_port true
	end
	getWordPos $line $pos "bbs"
	if ($pos > 0)
		setvar $buy_fuel true
		setvar $buy_org true
		setvar $buy_equip false
		setvar $find_port true
	end
	getWordPos $line $pos "bbb"
	if ($pos > 0)
		setvar $buy_fuel true
		setvar $buy_org true
		setvar $buy_equip true
		setvar $find_port true
	end
	getWordPos $line $pos "bsb"
	if ($pos > 0)
		setvar $buy_fuel true
		setvar $buy_org false
		setvar $buy_equip true
		setvar $find_port true
	end
	getWordPos $line $pos "sbs"
	if ($pos > 0)
		setvar $buy_fuel false
		setvar $buy_org true
		setvar $buy_equip false
		setvar $find_port true
	end
	getWordPos $line $pos "ssb"
	if ($pos > 0)
		setvar $buy_fuel false
		setvar $buy_org false
		setvar $buy_equip true
		setvar $find_port true
	end
	getWordPos $line $pos "sbb"
	if ($pos > 0)
		setvar $buy_fuel false
		setvar $buy_org true
		setvar $buy_equip true
		setvar $find_port true
	end
	getWordPos $line $pos "xbb"
	if ($pos > 0)
		setvar $buy_org true
		setvar $buy_equip true
		setvar $find_port true
	end
	getWordPos $line $pos "xxb"
	if ($pos > 0)
		setvar $buy_equip true
		setvar $find_port true
	end
	getWordPos $line $pos "xss"
	if ($pos > 0)
		setvar $buy_org false
		setvar $buy_equip false
		setvar $find_port true
	end
	getWordPos $line $pos "xxs"
	if ($pos > 0)
		setvar $buy_equip false
		setvar $find_port true
	end
	getWordPos $line $pos "bxb"
	if ($pos > 0)
		setvar $buy_fuel true
		setvar $buy_equip true
		setvar $find_port true
	end
	getWordPos $line $pos "bxx"
	if ($pos > 0)
		setvar $buy_fuel true
		setvar $find_port true
	end
	getWordPos $line $pos "bxs"
	if ($pos > 0)
		setvar $buy_fuel true
		setvar $buy_equip false
		setvar $find_port true
	end
	getWordPos $line $pos "sxs"
	if ($pos > 0)
		setvar $buy_fuel false
		setvar $buy_equip false
		setvar $find_port true
	end
	getWordPos $line $pos "xxs"
	if ($pos > 0)
		setvar $buy_equip false
		setvar $find_port true
	end
	getWordPos $line $pos "sxb"
	if ($pos > 0)
		setvar $buy_fuel false
		setvar $buy_equip true
		setvar $find_port true
	end
	getWordPos $line $pos "sxs"
	if ($pos > 0)
		setvar $buy_fuel false
		setvar $buy_equip false
		setvar $find_port true
	end
	getWordPos $line $pos "xxx"
	if ($pos > 0)
		setvar $find_port true
	end
	getWordPos $line $pos "ssx"
	if ($pos > 0)
		setvar $buy_fuel false
		setvar $buy_org false
		setvar $find_port true
	end
	getWordPos $line $pos "sxx"
	if ($pos > 0)
		setvar $buy_fuel false
		setvar $find_port true
	end
	getWordPos $line $pos "bbx"
	if ($pos > 0)
		setvar $buy_fuel true
		setvar $buy_org true
		setvar $find_port true
	end

	getWordPos $line $pos "deadend"
	if ($pos > 0)
		setvar $deadend true
	end

	getWordPos $line $pos "2way"
	if ($pos > 0)
		setvar $2way true
	end
	getWordPos $line $pos "3way"
	if ($pos > 0)
		setvar $3way true
	end
	getWordPos $line $pos "4way"
	if ($pos > 0)
		setvar $4way true
	end
	getWordPos $line $pos "5way"
	if ($pos > 0)
		setvar $5way true
	end
	getWordPos $line $pos "6way"
	if ($pos > 0)
		setvar $6way true
	end
	getWordPos $line $pos "7way"
	if ($pos > 0)
		setvar $7way true
	end

	getWordPos $line $pos "mcic"
	if ($pos > 0)
		setvar $find_good_mcic true
		setvar $find_port true
	end

	getWordPos $line $pos "pair"
	if ($pos > 0)
		setvar $find_port_pairs true
		setvar $find_port true
	else
		setvar $find_port_pairs false
	end

	getWordPos $line $pos "figged"
	if ($pos > 0)
		setVar $find_figged_sectors true
	else
		setVar $find_figged_sectors false		
	end

	
	setarray $results sectors 1 1 1
	setvar $result_count 0

	setvar $i 1
	while ($i <= sectors)
		getSectorParameter $i "FIGSEC" $isFigged
		getSectorParameter $i "EQUIPMENT+" $mcic
		setSectorParameter $i "TARGET" ""
			if ((($find_figged_sectors = true) and ($isFigged = true)) or (($find_figged_sectors = false) and ($isFigged <> true)))
				if (($find_port = true) and (PORT.EXISTS[$i] = true))
					if (((($buy_fuel = "both") or ($buy_fuel = true)) and PORT.BUYFUEL[$i] = true) or ((($buy_fuel = "both") or ($buy_fuel = false)) and PORT.BUYFUEL[$i] = false))
						if (((($buy_org = "both") or ($buy_org = true)) and PORT.BUYORG[$i] = true) or ((($buy_org = "both") or ($buy_org = false)) and PORT.BUYORG[$i] = false))
							if (((($buy_equip = "both") or ($buy_equip = true)) and PORT.BUYEQUIP[$i] = true) or ((($buy_equip = "both") or ($buy_equip = false)) and PORT.BUYEQUIP[$i] = false))
								if ($find_good_mcic = true)
									//check for mcic 
									if ($mcic <> "")
										getwordpos $mcic $pos "-"
										getwordpos $find_mcic_value $pos2 "-"
										if (($pos > 0) and ($pos2 > 0))
											setvar $absolute_mcic $mcic
											striptext $absolute_mcic "-"
											setvar $absolute_find_mcic_value $find_mcic_value
											striptext $absolute_find_mcic_value "-"
											if ($absolute_mcic >= $absolute_find_mcic_value)
												goto :skip_sector
											end
										elseif ((($pos > 0) and ($pos2 <= 0)) or (($pos <= 0) and ($pos2 > 0)))
											goto :skip_sector
										else
											if ($mcic >= $find_mcic_value)
												goto :skip_sector
											end

										end
									else
										goto :skip_sector
									end
								end
								if ($find_port_pairs = true)
									//check for port pairs
									if (PORT.BUYFUEL[$i] = true)
										setvar $buy_fuel true
									else
										setvar $buy_fuel false
									end
									if (PORT.BUYEQUIP[$i] = true)
										setvar $buy_equip true
									else
										setvar $buy_equip false
									end
									if (PORT.BUYORG[$i] = true)
										setvar $buy_org true
									else
										setvar $buy_org false
									end
									setvar $j 1
									setvar $found_port_pair 0
									setVar $isFound FALSE
									while ((SECTOR.WARPSIN[$i][$j] > 0) and ($isFound = false))
										setvar $test_sector SECTOR.WARPSIN[$i][$j]
										if (PORT.EXISTS[$test_sector] = true)
											if ((((PORT.BUYORG[$test_sector] <> $buy_org) and (PORT.BUYEQUIP[$test_sector] <> $buy_equip)) and ($buy_org <> $buy_equip)) or (((PORT.BUYFUEL[$test_sector] <> $buy_fuel) and (PORT.BUYEQUIP[$test_sector] <> $buy_equip)) and ($buy_fuel <> $buy_equip)) or (((PORT.BUYFUEL[$test_sector] <> $buy_fuel) and (PORT.BUYORG[$test_sector] <> $buy_org)) and ($buy_org <> $buy_fuel)))
												getDistance $distance $test_sector $i
												if ($distance <= 0)
													send "^f"&currentsector&"*"&$results[$i]&"*q"
													waitOn "ENDINTERROG"
													getDistance $distance CURRENTSECTOR $results[$i]
												end
												if ($distance = 1)
													setvar $found_port_pair $test_sector
													setvar $isFound true
												end
											end
										end
										add $j 1
									end
									if ($isFound = false)
										goto :skip_sector
									end
								end
							else
								goto :skip_sector
							end
						else
							goto :skip_sector
						end
					else
						goto :skip_sector
					end
				else
					goto :skip_sector
				end
				if ($deadend = true)
					getSectorParameter $i "DEADEND" $isCorrect
					if ($isCorrect <> true)
						goto :skip_sector
					end
				end
				if ($2way = true)
					getSectorParameter $i "2WAY" $isCorrect
					if ($isCorrect <> true)
						goto :skip_sector
					end
				end
				if ($3way = true)
					getSectorParameter $i "3WAY" $isCorrect
					if ($isCorrect <> true)
						goto :skip_sector
					end
				end
				if ($4way = true)
					getSectorParameter $i "4WAY" $isCorrect
					if ($isCorrect <> true)
						goto :skip_sector
					end
				end
				if ($5way = true)
					getSectorParameter $i "5WAY" $isCorrect
					if ($isCorrect <> true)
						goto :skip_sector
					end
				end
				if ($6way = true)
					getSectorParameter $i "6WAY" $isCorrect
					if ($isCorrect <> true)
						goto :skip_sector
					end
				end
				if ($7way = true)
					getSectorParameter $i "7WAY" $isCorrect
					if ($isCorrect <> true)
						goto :skip_sector
					end
				end
			else
				goto :skip_sector
			end		

		#If it makes it through all the filtering, add it to the results to display
		add $result_count 1
		setvar $results[$result_count] $i 
		setvar $results[$result_count][1][1] $found_port_pair
		setSectorParameter $i "TARGET" TRUE

		:skip_sector
		add $i 1
	end


:displaying_results
	
	echo "Found "&$result_count&" results.*"
	//calculating distance from current sector
	setvar $i 1
	while ($i <= $result_count)
		getDistance $distance CURRENTSECTOR $results[$i]
		if ($distance <= 0)
			send "^f"&currentsector&"*"&$results[$i]&"*q"
			waitOn "ENDINTERROG"
			getDistance $distance CURRENTSECTOR $results[$i]
		end
		setvar $results[$i][1] $distance
		add $i 1
	end

	//sorting results based on distance
	setarray $sorted_results $result_count 1 1
	setvar $i 1
	setvar $sorted_result_count 0 
	while ($i <= $result_count)
		setvar $biggest_distance 0
		setvar $j 1
		while ($j <= $result_count)
			setvar $test_distance $results[$j][1]
			if ($test_distance > $biggest_distance)
				setvar $biggest_distance $test_distance
				setvar $biggest_index $j
			end
			add $j 1
		end
		if ($biggest_distance > 0)
			add $sorted_result_count 1
			setvar $sorted_results[$sorted_result_count] $results[$biggest_index]
			setvar $sorted_results[$sorted_result_count][1] $results[$biggest_index][1]
			setvar $sorted_results[$sorted_result_count][1][1] $results[$biggest_index][1][1]
			setvar $results[$biggest_index][1] 0 
		else
			goto :done_sorting
		end
		add $i 1
	end

	:done_sorting
	setvar $i 1
	setVar $SWITCHBOARD~message "  *"
	while ($i <= $sorted_result_count)
		setvar $result_sector $sorted_results[$i]
		gosub :get_port_status		
		gosub :get_fighter_status

		if ($SWITCHBOARD~self_command <> TRUE)
			setVar $SWITCHBOARD~self_command 2
		end
		if (($sorted_results[$i][1] <> "") and ($sorted_results[$i][1] <> "0"))
			#echo "*"&"Sector: "&$sorted_results[$i]&" ("&$sorted_results[$i][1]&" sectors away) Figged: "&$fighter_status&" Port: "&$port&" MCIC:"&$mcic&"*"
			setvar $switchboard~message $switchboard~message&"Sector: "&$sorted_results[$i]&" ("&$sorted_results[$i][1]&" sectors away) Figged: "&$fighter_status&", Port: "&$port&" MCIC: "&$mcic&"*"
			if ($find_port_pairs = true)
				setvar $port_pair $sorted_results[$i][1][1]
				if ($port_pair > 0)
					getSectorParameter $port_pair "FIGSEC" $isFigged
					gosub :get_fighter_status
					setvar $result_sector $port_pair
					gosub :get_port_status
					setvar $switchboard~message $switchboard~message&"   Port Pair --> Sector: "&$port_pair&" Figged: "&$fighter_status&", Port: "&$port&" MCIC: "&$mcic&"*"
				end
			end
		end
		add $i 1
	end
		gosub :switchboard~switchboard
	halt

:killtriggers
	killtrigger 1
	killtrigger 2
	killtrigger 3
	killtrigger 4
	killtrigger 5
	killtrigger 6
	killtrigger 7
	killtrigger 8
	killtrigger 9
	killtrigger 10
	killtrigger 11
return

:get_fighter_status
		if ($isFigged)
			setvar $fighter_status "Yes"
		else
			setvar $fighter_status "No"
		end
return

:get_port_status
	getSectorParameter $result_sector "EQUIPMENT+" $mcic
	getSectorParameter $result_sector "EQUIPMENT-" $mcic_low
	if ($mcic <> "")
		if ($mcic <> $mcic_low)
			setvar $mcic $mcic&" ("&$mcic_low&")"
		end
	else
		setvar $mcic "N/A"
	end
	getSectorParameter $result_sector "FIGSEC" $isFigged
	if (PORT.EXISTS[$result_sector])
		if (PORT.BUYFUEL[$result_sector])
			setvar $port "B"
		else
			setvar $port "S"
		end
		if (PORT.BUYORG[$result_sector])
			setvar $port $port&"B"
		else
			setvar $port $port&"S"
		end
		if (PORT.BUYEQUIP[$result_sector])
			setvar $port $port&"B"
		else
			setvar $port $port&"S"
		end
	else
		setvar $port "N/A"
	end
return


#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
