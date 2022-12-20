:db
uppercase $commandList
setVar $commandlist $commandlist & " END"
setVar $cnt 2
setVar $err 0
:checkCommand
getWord $commandList $word $cnt
if ($word = "RESULTS")
	setVar $err 5
	return
elseif ($word <> "END")
	add $cnt 1
	goto :checkCommand
end
getWord $commandList $chkResult 1
if ($chkResult <> "RESULTS")
	setVar $results 0
	setArray $picked SECTORS
end
setVar $placeCount 1
setVar $commandcount 0
:processCommand
getWord $commandlist $condition $placeCount
if ($condition <> "END")
	if ($condition = "DENSITY")
		add $commandCount 1
		add $placeCount 1
		getWord $commandlist $operator $placeCount
		add $placeCount 1
		getWord $commandlist $value $placeCount
		isNumber $heh $value
		if ($heh = 0)
			setVar $results 0
			setVar $err 1
			goto :end
		end
		if ($commandCount = 1) OR ($command = "OR")
			setVar $looper 0
			:looper
			if ($looper < SECTORS)
				add $looper 1
				if ($operator = "=")
					if (SECTOR.DENSITY[$looper] = $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = ">")
					if (SECTOR.DENSITY[$looper] > $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = "<")
					if (SECTOR.DENSITY[$looper] < $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = "<>") OR ($operator = "><")
					if (SECTOR.DENSITY[$looper] <> $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end					
				elseif ($operator = ">=") OR ($operator = "=>")
					if (SECTOR.DENSITY[$looper] >= $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = "<=") OR ($operator = "=<")
					if (SECTOR.DENSITY[$looper] <= $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				else
					setVar $results 0
					setVar $err 2
					goto :end
				end
				goto :looper
			end
		elseif ($command = "AND")
			setVar $command 0
			setVar $topper $results
			setVar $ltopper 0
			setVar $results 0
			:ltopper
			if ($ltopper < $topper)
				add $ltopper 1
				if ($operator = "=")
					if (SECTOR.DENSITY[$resultList[$ltopper]] = $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = ">")
					if (SECTOR.DENSITY[$resultList[$ltopper]] > $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = "<")
					if (SECTOR.DENSITY[$resultList[$ltopper]] < $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = "<>") OR ($operator = "><")
					if (SECTOR.DENSITY[$resultList[$ltopper]] <> $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end					
				elseif ($operator = ">=") OR ($operator = "=>")
					if (SECTOR.DENSITY[$resultList[$ltopper]] >= $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = "<=") OR ($operator = "=<")
					if (SECTOR.DENSITY[$resultList[$ltopper]] <= $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				else
					setVar $results 0
					setVar $err 2
					goto :end
				end
				goto :ltopper
			end
		else
			setVAr $results 0
			setVar $err 3
			goto :end
		end
	elseif ($condition = "DEADEND")
		add $commandCount 1
		if ($commandCount = 1) OR ($command = "OR")
			setVar $deloop 0
			:deloop
			if ($deloop < SECTORS)
				add $deloop 1
				if (SECTOR.WARPCOUNT[$deloop] = 1) AND ($picked[$deloop] = 0)
					setVar $picked[$deloop] 1
					add $results 1
					setVar $resultList[$results] $deloop
				end
				goto :deloop
			end
		elseif ($command = "AND")
			setVar $command 0
			setVar $detopper $results
			setVar $deandloop 0
			setVar $results 0
			:deandloop
			if ($deandloop < $detopper)
				add $deandloop 1
				if (SECTOR.WARPCOUNT[$resultList[$deandloop]] = 1)
					setVar $picked[$deandloop] 1
					add $results 1
					setVar $resultList[$results] $resultList[$deandloop]
				end
				goto :deandloop
			end
		else
			setVar $results 0
			setVar $err 3
			goto :end
		end
	elseif ($condition = "PLANETS")
		add $commandCount 1
		add $placeCount 1
		getWord $commandlist $operator $placeCount
		add $placeCount 1
		getWord $commandlist $value $placeCount
		isNumber $heh $value
		if ($heh = 0)
			setVar $results 0
			setVar $err 1
			goto :end
		end
		if ($commandCount = 1) OR ($command = "OR")
			setVar $looper 0
			:plooper
			if ($looper < SECTORS)
				add $looper 1
				if ($operator = "=")
					if (SECTOR.PLANETCOUNT[$looper] = $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = ">")
					if (SECTOR.PLANETCOUNT[$looper] > $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = "<")
					if (SECTOR.PLANETCOUNT[$looper] < $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = "<>") OR ($operator = "><")
					if (SECTOR.PLANETCOUNT[$looper] <> $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end					
				elseif ($operator = ">=") OR ($operator = "=>")
					if (SECTOR.PLANETCOUNT[$looper] >= $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = "<=") OR ($operator = "=<")
					if (SECTOR.PLANETCOUNT[$looper] <= $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				else
					setVar $results 0
					setVar $err 2
					goto :end
				end
				goto :plooper
			end
		elseif ($command = "AND")
			setVar $command 0
			setVar $topper $results
			setVar $ltopper 0
			setVar $results 0
			:ptopper
			if ($ltopper < $topper)
				add $ltopper 1
				if ($operator = "=")
					if (SECTOR.PLANETCOUNT[$resultList[$ltopper]] = $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = ">")
					if (SECTOR.PLANETCOUNT[$resultList[$ltopper]] > $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = "<")
					if (SECTOR.PLANETCOUNT[$resultList[$ltopper]] < $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = "<>") OR ($operator = "><")
					if (SECTOR.PLANETCOUNT[$resultList[$ltopper]] <> $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end					
				elseif ($operator = ">=") OR ($operator = "=>")
					if (SECTOR.PLANETCOUNT[$resultList[$ltopper]] >= $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = "<=") OR ($operator = "=<")
					if (SECTOR.PLANETCOUNT[$resultList[$ltopper]] <= $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				else
					setVar $results 0
					setVar $err 2
					goto :end
				end
				goto :ptopper
			end
		else
			setVAr $results 0
			setVar $err 3
			goto :end
		end
	elseif ($condition = "BACKDOOR")
		add $commandCount 1
		if ($commandCount = 1) OR ($command = "OR")
			setVar $deloop 0
			:bdloop
			if ($deloop < SECTORS)
				add $deloop 1
				if (SECTOR.WARPCOUNT[$deloop] > 0)
					if (SECTOR.BACKDOORCOUNT[$deloop] > 0) AND ($picked[$deloop] = 0)
						setVar $picked[$deloop] 1
						add $results 1
						setVar $resultList[$results] $deloop
					end
				end
				goto :bdloop
			end
		elseif ($command = "AND")
			setVar $command 0
			setVar $detopper $results
			setVar $deandloop 0
			setVar $results 0
			:bdandloop
			if ($deandloop < $detopper)
				add $deandloop 1
				if (SECTOR.WARPCOUNT[$resultList[$deandloop]] > 0)
					if (SECTOR.BACKDOORCOUNT[$resultList[$deandloop]] > 0)
						setVar $picked[$deandloop] 1
						add $results 1
						setVar $resultList[$results] $resultList[$deandloop]
					end
				end
				goto :bdandloop
			end
		else
			setVar $results 0
			setVar $err 3
			goto :end
		end
	elseif ($condition = "TRADERS")
		add $commandCount 1
		add $placeCount 1
		getWord $commandlist $operator $placeCount
		add $placeCount 1
		getWord $commandlist $value $placeCount
		isNumber $heh $value
		if ($heh = 0)
			setVar $results 0
			setVar $err 1
			goto :end
		end
		if ($commandCount = 1) OR ($command = "OR")
			setVar $looper 0
			:trlooper
			if ($looper < SECTORS)
				add $looper 1
				if ($operator = "=")
					if (SECTOR.TRADERCOUNT[$looper] = $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = ">")
					if (SECTOR.TRADERCOUNT[$looper] > $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = "<")
					if (SECTOR.TRADERCOUNT[$looper] < $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = "<>") OR ($operator = "><")
					if (SECTOR.TRADERCOUNT[$looper] <> $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end					
				elseif ($operator = ">=") OR ($operator = "=>")
					if (SECTOR.TRADERCOUNT[$looper] >= $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = "<=") OR ($operator = "=<")
					if (SECTOR.TRADERCOUNT[$looper] <= $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				else
					setVar $results 0
					setVar $err 2
					goto :end
				end
				goto :trlooper
			end
		elseif ($command = "AND")
			setVar $command 0
			setVar $topper $results
			setVar $ltopper 0
			setVar $results 0
			:trtopper
			if ($ltopper < $topper)
				add $ltopper 1
				if ($operator = "=")
					if (SECTOR.TRADERCOUNT[$resultList[$ltopper]] = $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = ">")
					if (SECTOR.TRADERCOUNT[$resultList[$ltopper]] > $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = "<")
					if (SECTOR.TRADERCOUNT[$resultList[$ltopper]] < $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = "<>") OR ($operator = "><")
					if (SECTOR.TRADERCOUNT[$resultList[$ltopper]] <> $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end					
				elseif ($operator = ">=") OR ($operator = "=>")
					if (SECTOR.TRADERCOUNT[$resultList[$ltopper]] >= $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = "<=") OR ($operator = "=<")
					if (SECTOR.TRADERCOUNT[$resultList[$ltopper]] <= $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				else
					setVar $results 0
					setVar $err 2
					goto :end
				end
				goto :trtopper
			end
		else
			setVAr $results 0
			setVar $err 3
			goto :end
		end
	elseif ($condition = "WARPS")
		add $commandCount 1
		add $placeCount 1
		getWord $commandlist $operator $placeCount
		add $placeCount 1
		getWord $commandlist $value $placeCount
		isNumber $heh $value
		if ($heh = 0)
			setVar $results 0
			setVar $err 1
			goto :end
		end
		if ($commandCount = 1) OR ($command = "OR")
			setVar $looper 0
			:wlooper
			if ($looper < SECTORS)
				add $looper 1
				if ($operator = "=")
					if (SECTOR.WARPCOUNT[$looper] = $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = ">")
					if (SECTOR.WARPCOUNT[$looper] > $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = "<")
					if (SECTOR.WARPCOUNT[$looper] < $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = "<>") OR ($operator = "><")
					if (SECTOR.WARPCOUNT[$looper] <> $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end					
				elseif ($operator = ">=") OR ($operator = "=>")
					if (SECTOR.WARPCOUNT[$looper] >= $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = "<=") OR ($operator = "=<")
					if (SECTOR.WARPCOUNT[$looper] <= $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				else
					setVar $results 0
					setVar $err 2
					goto :end
				end
				goto :wlooper
			end
		elseif ($command = "AND")
			setVar $command 0
			setVar $topper $results
			setVar $ltopper 0
			setVar $results 0
			:wtopper
			if ($ltopper < $topper)
				add $ltopper 1
				if ($operator = "=")
					if (SECTOR.WARPCOUNT[$resultList[$ltopper]] = $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = ">")
					if (SECTOR.WARPCOUNT[$resultList[$ltopper]] > $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = "<")
					if (SECTOR.WARPCOUNT[$resultList[$ltopper]] < $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = "<>") OR ($operator = "><")
					if (SECTOR.WARPCOUNT[$resultList[$ltopper]] <> $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end					
				elseif ($operator = ">=") OR ($operator = "=>")
					if (SECTOR.WARPCOUNT[$resultList[$ltopper]] >= $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = "<=") OR ($operator = "=<")
					if (SECTOR.WARPCOUNT[$resultList[$ltopper]] <= $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				else
					setVar $results 0
					setVar $err 2
					goto :end
				end
				goto :wtopper
			end
		else
			setVAr $results 0
			setVar $err 3
			goto :end
		end
	elseif ($condition = "WARPSIN")
		add $commandCount 1
		add $placeCount 1
		getWord $commandlist $operator $placeCount
		add $placeCount 1
		getWord $commandlist $value $placeCount
		isNumber $heh $value
		if ($heh = 0)
			setVar $results 0
			setVar $err 1
			goto :end
		end
		if ($commandCount = 1) OR ($command = "OR")
			setVar $looper 0
			:wilooper
			if ($looper < SECTORS)
				add $looper 1
				if ($operator = "=")
					if (SECTOR.WARPINCOUNT[$looper] = $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = ">")
					if (SECTOR.WARPINCOUNT[$looper] > $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = "<")
					if (SECTOR.WARPINCOUNT[$looper] < $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = "<>") OR ($operator = "><")
					if (SECTOR.WARPINCOUNT[$looper] <> $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end					
				elseif ($operator = ">=") OR ($operator = "=>")
					if (SECTOR.WARPINCOUNT[$looper] >= $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				elseif ($operator = "<=") OR ($operator = "=<")
					if (SECTOR.WARPINCOUNT[$looper] <= $value) AND ($picked[$looper] = 0)
						setVar $picked[$looper] 1
						add $results 1
						setVar $resultList[$results] $looper
					end
				else
					setVar $results 0
					setVar $err 2
					goto :end
				end
				goto :wilooper
			end
		elseif ($command = "AND")
			setVar $command 0
			setVar $topper $results
			setVar $ltopper 0
			setVar $results 0
			:witopper
			if ($ltopper < $topper)
				add $ltopper 1
				if ($operator = "=")
					if (SECTOR.WARPINCOUNT[$resultList[$ltopper]] = $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = ">")
					if (SECTOR.WARPINCOUNT[$resultList[$ltopper]] > $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = "<")
					if (SECTOR.WARPINCOUNT[$resultList[$ltopper]] < $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = "<>") OR ($operator = "><")
					if (SECTOR.WARPINCOUNT[$resultList[$ltopper]] <> $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end					
				elseif ($operator = ">=") OR ($operator = "=>")
					if (SECTOR.WARPINCOUNT[$resultList[$ltopper]] >= $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				elseif ($operator = "<=") OR ($operator = "=<")
					if (SECTOR.WARPINCOUNT[$resultList[$ltopper]] <= $value)
						setVar $picked[$ltopper] 1
						add $results 1
						setVar $resultList[$results] $resultList[$ltopper]
					end
				else
					setVar $results 0
					setVar $err 2
					goto :end
				end
				goto :witopper
			end
		else
			setVAr $results 0
			setVar $err 3
			goto :end
		end
	elseif ($condition = "FIGGED")
		add $commandCount 1
		if ($commandCount = 1) OR ($command = "OR")
			setVar $deloop 0
			:fgloop
			if ($deloop < SECTORS)
				add $deloop 1
				if ($nearfig_inc~figlist[$deloop] = 1) AND ($picked[$deloop] = 0)
					setVar $picked[$deloop] 1
					add $results 1
					setVar $resultList[$results] $deloop
				end
				goto :fgloop
			end
		elseif ($command = "AND")
			setVar $command 0
			setVar $detopper $results
			setVar $deandloop 0
			setVar $results 0
			:fgandloop
			if ($deandloop < $detopper)
				add $deandloop 1
				if ($nearfig_inc~figlist[$resultList[$deandloop]] = 1)
					setVar $picked[$deandloop] 1
					add $results 1
					setVar $resultList[$results] $resultList[$deandloop]
				end
				goto :fgandloop
			end
		else
			setVar $results 0
			setVar $err 3
			goto :end
		end
	elseif ($condition = "UNFIGGED")
		add $commandCount 1
		if ($commandCount = 1) OR ($command = "OR")
			setVar $deloop 0
			:ufgloop
			if ($deloop < SECTORS)
				add $deloop 1
				if ($nearfig_inc~figlist[$deloop] = 0) AND ($picked[$deloop] = 0)
					setVar $picked[$deloop] 1
					add $results 1
					setVar $resultList[$results] $deloop
				end
				goto :ufgloop
			end
		elseif ($command = "AND")
			setVar $command 0
			setVar $detopper $results
			setVar $deandloop 0
			setVar $results 0
			:ufgandloop
			if ($deandloop < $detopper)
				add $deandloop 1
				if ($nearfig_inc~figlist[$resultList[$deandloop]] = 0)
					setVar $picked[$deandloop] 1
					add $results 1
					setVar $resultList[$results] $resultList[$deandloop]
				end
				goto :ufgandloop
			end
		else
			setVar $results 0
			setVar $err 3
			goto :end
		end
	elseif ($condition = "DISTANCE")
		add $commandCount 1
		add $placeCount 1
		getWord $commandlist $targetDist $placeCount
		add $placeCount 1
		getWord $commandList $targetSect $placeCount
		isNumber $chk $targetDist
		if ($chk = 1)
			if ($targetDist <= 0)
				setVar $results 0
				setVar $err 1
				goto :end
			end
		else
			setVar $results 0
			setVar $err 1
			goto :end
		end
		isNumber $chk $targetSect
		if ($chk = 1)
			if ($targetSect <= 0) OR ($targetSect > SECTORS)
				setVar $results 0
				setVar $err 1
				goto :end
			end
		else
			setVar $results 0
			setVar $err 1
			goto :end
		end
		if ($commandCount = 1) OR ($command = "OR")
			setVar $deloop 0
			:dsgloop
			if ($deloop < SECTORS)
				add $deloop 1
				getDistance $dist $targetSect $deloop
				if (($dist <= $targetDist) AND ($dist > "-1")) AND ($picked[$deloop] = 0)
					setVar $picked[$deloop] 1
					add $results 1
					setVar $resultList[$results] $deloop
				end
				goto :dsgloop
			end
		elseif ($command = "AND") AND ($results > 0)
			setVar $command 0
			setVar $detopper $results
			setVar $deandloop 0
			setVar $results 0
			:dsgandloop
			if ($deandloop < $detopper)
				add $deandloop 1
				getDistance $dist $targetSect $resultList[$deandloop]
				if ($dist <= $targetDist) AND ($dist > "-1")
					setVar $picked[$deandloop] 1
					add $results 1
					setVar $resultList[$results] $resultList[$deandloop]
				end
				goto :dsgandloop
			end
		else
			setVar $results 0
			setVar $err 3
			goto :end
		end
	elseif ($condition = "BUYORE") OR ($condition = "SELLORE")
		add $commandCount 1
		if ($commandCount = 1) OR ($command = "OR")
			setVar $deloop 0
			:bfloop
			if ($deloop < SECTORS)
				add $deloop 1
				if (PORT.CLASS[$deloop] > "0") AND (PORT.CLASS[$deloop] < "9")
					if (((PORT.BUYFUEL[$deloop] = 0) AND ($condition = "SELLORE")) OR ((PORT.BUYFUEL[$deloop] = 1) AND ($condition = "BUYORE"))) AND ($picked[$deloop] = 0)
						setVar $picked[$deloop] 1
						add $results 1
						setVar $resultList[$results] $deloop
					end
				end
				goto :bfloop
			end
		elseif ($command = "AND")
			setVar $command 0
			setVar $detopper $results
			setVar $deandloop 0
			setVar $results 0
			:bfandloop
			if ($deandloop < $detopper)
				add $deandloop 1
				if (PORT.CLASS[$resultList[$deandloop]] > "0") AND (PORT.CLASS[$resultList[$deandloop]] < "9")
					if ((PORT.BUYFUEL[$resultList[$deandloop]] = 0) AND ($condition = "SELLORE")) OR ((PORT.BUYFUEL[$resultList[$deandloop]] = 1) AND ($condition = "BUYORE"))
						setVar $picked[$deandloop] 1
						add $results 1
						setVar $resultList[$results] $resultList[$deandloop]
					end
				end
				goto :bfandloop
			end
		else
			setVar $results 0
			setVar $err 3
			goto :end
		end
	elseif ($condition = "BUYORGS") OR ($condition = "SELLORGS")
		add $commandCount 1
		if ($commandCount = 1) OR ($command = "OR")
			setVar $deloop 0
			:boloop
			if ($deloop < SECTORS)
				add $deloop 1
				if (PORT.CLASS[$deloop] > "0") AND (PORT.CLASS[$deloop] < "9")
					if (((PORT.BUYORG[$deloop] = 0) AND ($condition = "SELLORGS")) OR ((PORT.BUYORG[$deloop] = 1) AND ($condition = "BUYORGS"))) AND ($picked[$deloop] = 0)
						setVar $picked[$deloop] 1
						add $results 1
						setVar $resultList[$results] $deloop
					end
				end
				goto :boloop
			end
		elseif ($command = "AND")
			setVar $command 0
			setVar $detopper $results
			setVar $deandloop 0
			setVar $results 0
			:boandloop
			if ($deandloop < $detopper)
				add $deandloop 1
				if (PORT.CLASS[$resultList[$deandloop]] > "0") AND (PORT.CLASS[$resultList[$deandloop]] < "9")
					if ((PORT.BUYORG[$resultList[$deandloop]] = 0) AND ($condition = "SELLORGS")) OR ((PORT.BUYORG[$resultList[$deandloop]] = 1) AND ($condition = "BUYORGS"))
						setVar $picked[$deandloop] 1
						add $results 1
						setVar $resultList[$results] $resultList[$deandloop]
					end
				end
				goto :boandloop
			end
		else
			setVar $results 0
			setVar $err 3
			goto :end
		end
	elseif ($condition = "BUYEQU") OR ($condition = "SELLEQU")
		add $commandCount 1
		if ($commandCount = 1) OR ($command = "OR")
			setVar $deloop 0
			:beloop
			if ($deloop < SECTORS)
				add $deloop 1
				if (PORT.CLASS[$deloop] > "0") AND (PORT.CLASS[$deloop] < "9")
					if (((PORT.BUYEQUIP[$deloop] = 0) AND ($condition = "SELLEQU")) OR ((PORT.BUYEQUIP[$deloop] = 1) AND ($condition = "BUYEQU"))) AND ($picked[$deloop] = 0)
						setVar $picked[$deloop] 1
						add $results 1
						setVar $resultList[$results] $deloop
					end
				end
				goto :beloop
			end
		elseif ($command = "AND")
			setVar $command 0
			setVar $detopper $results
			setVar $deandloop 0
			setVar $results 0
			:beandloop
			if ($deandloop < $detopper)
				add $deandloop 1
				if (PORT.CLASS[$resultList[$deandloop]] > "0") AND (PORT.CLASS[$resultList[$deandloop]] < "9")
					if ((PORT.BUYEQUIP[$resultList[$deandloop]] = 0) AND ($condition = "SELLEQU")) OR ((PORT.BUYEQUIP[$resultList[$deandloop]] = 1) AND ($condition = "BUYEQU"))
						setVar $picked[$deandloop] 1
						add $results 1
						setVar $resultList[$results] $resultList[$deandloop]
					end
				end
				goto :beandloop
			end
		else
			setVar $results 0
			setVar $err 3
			goto :end
		end
	elseif ($condition = "RESULTS")
		add $commandCount 1
	elseif ($condition = "AND")
		setVar $command "AND"
		setArray $picked SECTORS
	elseif ($condition = "OR")
		setVar $command "OR"
	else
		setVar $err 4
		setVAr $results 0
		goto :end
	end

else
	goto :end

end
add $placeCount 1
goto :processCommand

:end
return