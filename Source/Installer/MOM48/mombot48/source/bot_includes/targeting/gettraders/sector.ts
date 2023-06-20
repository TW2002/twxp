:getTraders
	#Reads sector data and searches for real (Player) traders
		getWordPos $sectorData $posTrader "[0m[33mTraders [1m:"
	if ($posTrader > 0)
		getText $sectorData $traderData "[0m[33mTraders [1m:" "[0m[1;32mWarps to Sector(s) [33m:"
		setVar $traderData $STARTLINE&$traderData
		getText $traderData $temp $STARTLINE $ENDLINE
		setVar $realTraderCount 0
		setVar $corpieCount 0
		while ($temp <> "")
			getLength $STARTLINE&$temp&$ENDLINE $length
			cutText $traderData $traderData ($length+1) 9999
			stripText $temp $STARTLINE
			stripText $temp $ENDLINE
			stripText $temp "[0m          "
			stripText $temp "[0m[33mTraders [1m:"
			setVar $j 1
			setVar $isFound FALSE
			while (($j < $ranksLength) AND ($isFound = FALSE))
				getWordPos $temp $pos $ranks[$j]
				if ($pos > 0)
					getLength $ranks[$j] $length
					cutText $temp $temp ($pos+$length+1) 9999
					if ($j <= 10)
						setVar $TRADERS[($realTraderCount+1)][2] TRUE
					else
						setVar $TRADERS[($realTraderCount+1)][2] FALSE
					end
					setVar $isFound TRUE
				end
				add $j 1
			end
			getWordPos $temp $pos "[0;32m w/"
			getWordPos $temp $pos2 "[0;35m[[31mOwned by[35m]"
			if (($pos > 0) AND ($pos2 <= 0))
				getWordPos $temp $pos "[[1;36m"
				if ($pos > 0)
					getText $temp $tempCorp "[[1;36m" "[0;34m]"
					stripText $tempCorp ""
				else
					setVar $tempCorp 99999
				end
				replaceText $temp "[0;34m" "[34m"
				getWordPos $temp $pos "[34m"
				cutText $temp $temp 1 $pos
				stripText $temp ""
				lowercase $temp
				setVar $TRADERS[($realTraderCount+1)] $temp
				setVar $TRADERS[($realTraderCount+1)][1] $tempCorp
				#echo "*" $traders[($realTraderCount+1)] "   " $traders[($realTraderCount+1)][1] "   " $traders[($realTraderCount+1)][2] "*"
				add $realTraderCount 1
				if ($tempCorp = $player~CORP)
					add $corpieCount 1
				end
			end
			getText $traderData $temp $STARTLINE $ENDLINE
		end
	else
		setVar $realTraderCount 0
		setVar $corpieCount 0
	end
return
