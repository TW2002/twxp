#============================= REFRESH FIGHTER SUBROUTINE =======================================
:update
	setvar $switchboard~message "Loading current fighter locations. . .*"
	gosub :switchboard~switchboard
	getSectorParameter 2 "FIG_COUNTR" $previousCount
	getSectorParameter 2 "FUEL_COUNT" $previousFuelCount
	getSectorParameter 2 "ORG_COUNT" $previousOrgCount
	getSectorParameter 2 "EQU_COUNT" $previousEquipCount
	getSectorParameter 2 "EQS_COUNT" $previousEquipSellCount
	getSectorParameter 2 "FB_COUNT" $previousFuelBuyCount
	
	if ($previousCount = "")
		setVar $previousCount 0
	end
	if ($previousFuelCount = "")
		setVar $previousFuelCount 0
	end
	if ($previousOrgCount = "")
		setVar $previousOrgCount 0
	end
	if ($previousEquipCount = "")
		setVar $previousEquipCount 0
	end
	if ($previousEquipSellCount = "")
		setVar $previousEquipSellCount 0
	end
	if ($previousFuelBuyCount = "")
		setVar $previousFuelBuyCount 0
	end

	:readFighterList
		setVar $count 0
		setVar $personalCount 0
		setVar $1sCount 0
		setVar $2sCount 0
		setVar $3sCount 0
		setVar $4sCount 0
		setVar $5sCount 0
		setVar $6sCount 0
		setVar $?sCount 0
		setVar $tollCount 0
		setVar $offCount 0
		setVar $defCount 0
		setVar $fuelCount 0
		setVar $orgCount 0
		setVar $equipCount 0
		setVar $equipSellCount 0
		setVar $upgradedEquipCount 0
		setVar $upgradedEquipSellCount 0
		setVar $upgradedFuelBuyCount 0
		setVar $upgradedOrgCount 0
		setVar $upgradedFuelCount 0

		send "g"
		setVar $i 1
		setVar $personalOutput " "
		setVar $output " "
		setVar $ckoutput " "
	:keepCounting
		setTextLineTrigger corporate 		:corpCount 	" Corp"
		setTextLineTrigger personal 		:personalCount	"Personal "
		setTextLineTrigger doneCountingFigs	:doneCounting 	"Total"
		setTextLineTrigger doneNoFigs 		:doneCounting 	"No fighters deployed"
		pause
	:personalCount
		add $count 1
		add $personalCount 1
		getWord CURRENTLINE $sector 1
		getWord CURRENTLINE $type 4
		setVar $personalOutput $personalOutput&" "&$sector&"  "
		setTextLineTrigger personal 		:personalCount	"Personal "
		pause

	:corpCount
		add $count 1
		add $player~corpCount 1
		getWord CURRENTLINE $sector 1
		getWord CURRENTLINE $type 4
		if ($type = "Toll")
			add $tollCount 1
		elseif ($type = "Offensive")
			add $offCount 1
		elseif ($Type = "Defensive")
			add $defCount 1
		end
		while ($i <= $sector)
			getWordPos $personalOutput $pos " "&$i&" "
			if (($sector = $i) OR ($pos > 0))
				setVar $output $output&$i&"*"
				setVar $ckoutput $ckoutput&$i&"  "
				setSectorParameter $i "FIGSEC" TRUE
				if ((PORT.EXISTS[$i] = TRUE))
					setVar $currentEquip (PORT.Equip[$i]*100)
					if (port.percentEquip[$i] <> 0)
						divide $currentEquip port.percentEquip[$i]
					end
					if (PORT.BUYEQUIP[$i] = FALSE)
						if ($currentEquip > 10000)
							add $upgradedEquipSellCount 1
						end
					else
						if ($currentEquip > 10000)
							add $upgradedEquipCount 1
						end
					end
					if (PORT.BUYORG[$i] = TRUE)
						setVar $currentOrg (PORT.Org[$i]*100)
						if (port.percentOrg[$i] <> 0)
							divide $currentOrg port.percentOrg[$i]
						end
						if ($currentOrg > 10000)
							add $upgradedOrgCount 1
						end
					end
					if (PORT.BUYFUEL[$i] = FALSE)
						setVar $currentFuel (PORT.Fuel[$i]*100)
						if (port.percentFuel[$i] <> 0)
							divide $currentFuel port.percentFuel[$i]
						end
						if ($currentFuel > 10000)
							add $upgradedFuelCount 1
						end
					else
						setVar $currentFuel (PORT.Fuel[$i]*100)
						if (port.percentFuel[$i] <> 0)
							divide $currentFuel port.percentFuel[$i]
						end
						if ($currentFuel > 10000)
							add $upgradedFuelBuyCount 1
						end

					end
				end
				setVar $tempWarpCount SECTOR.WARPINCOUNT[$i]
				setVar $tempWarpCountOut SECTOR.WARPCOUNT[$i]
				if ($tempWarpCount > 0) and ($tempWarpCountOut > 0)
					if ($tempWarpCount = 1)
						add $1sCount 1
					elseif ($tempWarpCount = 2)
						add $2sCount 1
					elseif ($tempWarpCount = 3)
						add $3sCount 1
					elseif ($tempWarpCount = 4)
						add $4sCount 1
					elseif ($tempWarpCount = 5)
						add $5sCount 1
					elseif ($tempWarpCount = 6)
						add $6sCount 1
					end
				else
					add $?scount 1
				end

			else
				setVar $output $output&"0*"
				setVar $ckoutput $ckoutput&"0  "
				setSectorParameter $i "FIGSEC" FALSE
			end
			add $i 1
		end
		setTextLineTrigger corporate 		:corpCount 	" Corp"
		pause		

	:doneCounting
		killalltriggers
		while ($i <= SECTORS)
			getWordPos $personalOutput $pos " "&$i&" "
			if ($pos > 0)
				setVar $ckoutput $ckoutput&$i&"  "
				setVar $output $output&$i&"*"
				setSectorParameter $i "FIGSEC" TRUE
			else
				setVar $ckoutput $ckoutput&"0  "
				setVar $output $output&"0*"
				setSectorParameter $i "FIGSEC" FALSE
			end
			add $i 1
		end

		setSectorParameter 2 "FIG_COUNT" $count
		setSectorParameter 2 "FIG_COUNTR" $count
		setSectorParameter 2 "FUEL_COUNT" $upgradedFuelCount
		setSectorParameter 2 "ORG_COUNT" $upgradedOrgCount
		setSectorParameter 2 "EQU_COUNT" $upgradedEquipCount
		setSectorParameter 2 "EQS_COUNT" $upgradedEquipSellCount
		setSectorParameter 2 "FB_COUNT" $upgradedFuelBuyCount

return
# ============================== END REFRESH FIGHTERS (FIGS) SUB ==============================

:report
	if ($count <> 0)
		setVar $percent  (($count * 100) / SECTORS)
		setVar $1percent (($1scount * 100) / $count)
		setVar $2percent (($2scount * 100) / $count)
		setVar $3percent (($3scount * 100) / $count)
		setVar $4percent (($4scount * 100) / $count)
		setVar $5percent (($5scount * 100) / $count)
		setVar $6percent (($6scount * 100) / $count)
		setVar $?percent (($?scount * 100) / $count)
	end
	setVar $gridChange $count-$previousCount
	if ($gridChange > 0)
		setVar $gridChange "+"&$gridChange
	end
	setVar $gridFuelChange $upgradedFuelCount-$previousFuelCount
	if ($gridFuelChange > 0)
		setVar $gridFuelChange "+"&$gridFuelChange
	end
	setVar $gridOrgChange $upgradedOrgCount-$previousOrgCount
	if ($gridOrgChange > 0)
		setVar $gridOrgChange "+"&$gridOrgChange
	end
	setVar $gridEquipChange $upgradedEquipCount-$previousEquipCount
	if ($gridEquipChange > 0)
		setVar $gridEquipChange "+"&$gridEquipChange
	end
	setVar $gridEquipSellChange $upgradedEquipSellCount-$previousEquipSellCount
	if ($gridEquipSellChange > 0)
		setVar $gridEquipSellChange "+"&$gridEquipSellChange
	end
	setVar $gridFuelBuyChange $upgradedFuelBuyCount-$previousFuelBuyCount
	if ($gridFuelBuyChange > 0)
		setVar $gridFuelBuyChange "+"&$gridFuelBuyChange
	end
	
	setVar $inputVariable $1scount
	gosub :player~formatNumberForSpaces
	setVar $1scountformatted $outputVariable
	setVar $inputVariable $2scount
	gosub :player~formatNumberForSpaces
	setVar $2scountformatted $outputVariable
	setVar $inputVariable $3scount
	gosub :player~formatNumberForSpaces
	setVar $3scountformatted $outputVariable
	setVar $inputVariable $4scount
	gosub :player~formatNumberForSpaces
	setVar $4scountformatted $outputVariable
	setVar $inputVariable $5scount
	gosub :player~formatNumberForSpaces
	setVar $5scountformatted $outputVariable
	setVar $inputVariable $6scount
	gosub :player~formatNumberForSpaces
	setVar $6scountformatted $outputVariable

	setVar $inputVariable $1percent
	gosub :player~formatPercentagesForSpaces
	setVar $1percentformatted $outputVariable
	setVar $inputVariable $2percent
	gosub :player~formatPercentagesForSpaces
	setVar $2percentformatted $outputVariable
	setVar $inputVariable $3percent
	gosub :player~formatPercentagesForSpaces
	setVar $3percentformatted $outputVariable
	setVar $inputVariable $4percent
	gosub :player~formatPercentagesForSpaces
	setVar $4percentformatted $outputVariable
	setVar $inputVariable $5percent
	gosub :player~formatPercentagesForSpaces
	setVar $5percentformatted $outputVariable
	setVar $inputVariable $6percent
	gosub :player~formatPercentagesForSpaces
	setVar $6percentformatted $outputVariable

	setvar $switchboard~message $switchboard~message&"          - Fighter Grid Report -*          - "&$count&" sectors, "&$personalCount&" personal. ("&$percent&"%) ("&$gridChange&" Change)*          - T: "&$tollCount&"  O: "&$offCount&"  D:"&$defCount&"*          - DE: "&$1sCountformatted&""&$1percentformatted&" 2S: "&$2sCountformatted&""&$2percentformatted&" 3S: "&$3sCountformatted&""&$3percentformatted&"*          - 4S: "&$4sCountformatted&""&$4percentformatted&" 5S: "&$5sCountformatted&""&$5percentformatted&" 6S: "&$6sCountformatted&""&$6percentformatted&"*          - Upgraded Sxx: "&$upgradedFuelCount&" ("&$gridFuelChange&" Change)*          - Upgraded xBx: "&$upgradedOrgCount&" ("&$gridOrgChange&" Change)*          - Upgraded xxB: "&$upgradedEquipCount&" ("&$gridEquipChange&" Change)*          - Upgraded xxS: "&$upgradedEquipSellCount&" ("&$gridEquipSellChange&" Change)*          - Upgraded Bxx: "&$upgradedFuelBuyCount&" ("&$gridFuelBuyChange&" Change)**"

return