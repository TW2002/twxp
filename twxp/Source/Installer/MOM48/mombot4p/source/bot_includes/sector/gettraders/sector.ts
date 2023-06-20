:getTraders
	getWordPos $sectorData $posTrader "[0m[33mTraders [1m:"
	if ($posTrader > 0)
		getText $sectorData $traderData "[0m[33mTraders [1m:" "[0m[1;32mWarps to Sector(s) "   
		setVar $traderData $STARTLINE&$traderData
		getText $traderData $temp $STARTLINE $ENDLINE 
		setVar $realTraderCount 0
		setVar $corpieCount 0
		setVar $defenderShips 0
		while ($temp <> "")
			getLength $STARTLINE&$temp&$ENDLINE $length
			cutText $traderData $traderData ($length+1) 9999 
			stripText $temp $STARTLINE
			stripText $temp $ENDLINE
			stripText $temp "[0m          "
			stripText $temp "[0m[33mTraders [1m:"
			setVar $j 1
			setVar $isFound FALSE
			#only check for fed safe if you are in fed sector
			if (($player~current_sector <= 10) or ($player~current_sector = $map~stardock) or ($player~current_sector = stardock))
				while (($j < $player~ranksLength) AND ($isFound = FALSE))
					getWordPos $temp $pos $player~ranks[$j]    
					if ($pos > 0)
						getLength $player~ranks[$j] $length
						cutText $temp $temp ($pos+$length+1) 9999
						if ($j <= 10)
							setVar $player~traders[($realTraderCount+1)][2] TRUE
						else
							setVar $player~traders[($realTraderCount+1)][2] FALSE
						end
						setVar $isFound TRUE
					end
					add $j 1
				end
			else
				setVar $player~traders[($realTraderCount+1)][2] FALSE
			end
			getWordPos $temp $pos "[0;32m w/"
			getWordPos $temp $pos2 "[0;35m[[31mOwned by[35m]"
			getWordPos $temp $pos3 #27&"[0m      "&#27&"[32m     in "&#27
			#echo "*["&$temp&"]"&$pos3&"*"
			if (($pos > 0) AND ($pos2 <= 0))
				getWordPos $temp $pos "[[1;36m"
				if ($pos > 0)
					getText $temp $tempCorp "[[1;36m" "[0;34m]"
					stripText $tempCorp ""
				else
					setVar $tempCorp 99999
				end 
				getText $temp $number_of_fighters " w/ [1;33m" "[0;32m ftrs"
				stripText $number_of_fighters ","
				replaceText $temp "[0;34m" "[34m"
				getWordPos $temp $pos "[34m"
				cutText $temp $temp 1 $pos
				stripText $temp ""
				lowercase $temp
				stripText $temp "[36m"
				stripText $temp "[31m"
				stripText $temp "36m"
				stripText $temp "31m"
				setVar $player~traders[($realTraderCount+1)] $temp
				setVar $player~traders[($realTraderCount+1)][1] $tempCorp
				setVar $player~traders[($realTraderCount+1)][4] $number_of_fighters
				if ($tempCorp = $player~CORP)
					add $corpieCount 1
				end
				add $realTraderCount 1
			end
			#for defender recognition once ansi ships are in array in bot
			if (($pos3 > 0) AND ($tempCorp <> $player~CORP) AND ($player~override <> TRUE))
				getText $temp $shipname "(" ")"
				#getText $shipname $shipname "m"&#27 #27&"["
				if ($shipname = "")
					getText $shipname $shipname "(" ")"
					#getText $shipname&"ENDOFSHIP" $shipname "m"&#27&"[" "ENDOFSHIP"
				end
				getText $shipname&"ENDOFSHIP" $shipname "m" "ENDOFSHIP"
				setVar $isFound FALSE
				setVar $s 1
				setVar $isDefender FALSE
				replacetext $shipname ";" "m"
				striptext $shipname "30m"
				striptext $shipname "31m"
				striptext $shipname "32m"
				striptext $shipname "33m"
				striptext $shipname "34m"
				striptext $shipname "35m"
				striptext $shipname "36m"
				striptext $shipname "37m"
				striptext $shipname "38m"
				striptext $shipname "39m"
				striptext $shipname "40m"
				striptext $shipname "41m"
				striptext $shipname "42m"
				striptext $shipname "43m"
				striptext $shipname "44m"
				striptext $shipname "45m"
				striptext $shipname "46m"
				striptext $shipname "47m"
				striptext $shipname "[0;30;47m"
				striptext $shipname "[32;40m"
				striptext $shipname "[0;"
				striptext $shipname "[1;"
				striptext $shipname "[0m"
				striptext $shipname "[1m"
				striptext $shipname #13
				striptext $shipname #27
				striptext $shipname ""
				striptext $shipname "["

				while (($isFound = FALSE) AND ($s < $ship~shipCounter))
					striptext $ship~shipList[$s] "["
					getwordpos $shipname $pos $ship~shipList[$s]
					#send "'"&$shipname&"]["&$ship~shipList[$s]&"*"
					if ($pos > 0)
						#echo "*["&$shipname&"*][*"&$ship~shipList[$s]&"]*"
						setVar $isFound TRUE
						setVar $isDefender $ship~shipList[$s][8]
					end
					add $s 1
				end
				setVar $player~traders[($realTraderCount)][3] $shipname
				if ($isDefender = TRUE)
					setVar $player~traders[($realTraderCount)][1] 100000
					#echo "*Adding defender ship:"&$shipname&"*"
					add $defenderShips 1
				end
				getwordpos $shipname $isTargetedShip $PLAYER~targetingShip
				if ($isTargetedShip > 0)
					setVar $player~traders[($realTraderCount)][3] TRUE
					#echo "*Adding targeted ship:"&$shipname&"*"
					add $targetedShips 1
				end
			end
			getText $traderData $temp $STARTLINE $ENDLINE   
		end 
	else
		setVar $realTraderCount 0
		setVar $corpieCount 0
		setVar $defenderShips 0
	end
return
