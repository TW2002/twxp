# ======================     START REFRESH LIMP (LIMPS) SUBROUTINE    ==========================
:update
	setArray $plimps SECTORS

	setVar $SWITCHBOARD~message "Loading current limpet locations. . .*"
	gosub :SWITCHBOARD~switchboard
	fileExists $gfile_chk $BOT~LIMP_COUNT_FILE
	if ($gfile_chk = 1)
		read $BOT~LIMP_COUNT_FILE $previousCount 1
	else
		setVar $previousCount 0
	end

	:readLimpList
		setVar $count 0
		setVar $personalCount 0
		send "k2"
		setVar $i 1
		setVar $limpetOutput ""
		setVar $personalOutput " "
		setVar $output " "
	:keepCountingLimps
		killtrigger corporate
		killtrigger personal
		killtrigger doneCountingFigs
		killtrigger doneNoFigs
		setTextLineTrigger corporate 		:corpCountLimps 	" Corp"
		setTextLineTrigger personal 		:personalCountLimps	"Personal "
		setTextLineTrigger doneCountingFigs	:doneCountingLimps 	"Total"
		setTextLineTrigger doneNoFigs 		:doneCountingLimps 	"No Limpet mines deployed"
		pause
	:personalCountLimps
		add $count 1
		add $personalCount 1
		getWord CURRENTLINE $sector 1
		getWord CURRENTLINE $numMines 2
		setVar $personalOutput $personalOutput&$sector&"  "
		setVar $plimps[$sector] $numMines
		setTextLineTrigger personal 		:personalCountLimps	"Personal "
		pause
	:corpCountLimps
		add $count 1
		add $player~corpCount 1
		getWord CURRENTLINE $sector 1
		getWord CURRENTLINE $numMines 2
		while ($i <= $sector)
			getWordPos $personalOutput $pos " "&$i&" "
			if (($sector = $i) OR ($pos > 0))
				if ($pos > 0)
					setVar $output $output& $plimps[$i] &"*"
				else
					setVar $output $output&$numMines&"*"
				end
				setSectorParameter $i "LIMPSEC" TRUE
			else
				setVar $output $output&"0*"
				setSectorParameter $i "LIMPSEC" FALSE
			end
			add $i 1
		end
		setTextLineTrigger corporate 		:corpCountLimps 	" Corp"
  		pause

	:doneCountingLimps
		killtrigger corporate
		killtrigger personal
		killtrigger doneCountingFigs
		killtrigger doneNoFigs
		setTextTrigger checkLimps :checkMarkedLimps "Activated  Limpet  Scan"
		pause
	:checkMarkedLimps
		setTextLineTrigger donechecking 	:doneCheckingLimps 	"Total"
		setTextLineTrigger donecheckingtoo	:doneCheckingLimps 	"No Active Limpet mines detected"
		setTextLineTrigger corporate 		:markLimpet 		" Corp"
		setTextLineTrigger personal 		:markLimpet		"Personal "
		pause

		:markLimpet
			killtrigger corporate
			killtrigger personal
			setVar $temp CURRENTLINE
			stripText $temp #42
			setVar $limpetOutput $limpetOutput&"             "&$temp&"*"
			killtrigger unfreezingTrigger
                	setDelayTrigger unfreezingTrigger :unfreezebot 10000
      			setTextLineTrigger corporate 		:markLimpet 		" Corp"
			setTextLineTrigger personal 		:markLimpet		"Personal "
			pause
		:doneCheckingLimps
			killtrigger donechecking
			killtrigger donecheckingtoo
		while ($i <= SECTORS)
			getWordPos $personalOutput $pos " "&$i&" "
			if ($pos > 0)
				setVar $output $output&$numMines&"*"
				setSectorParameter $i "LIMPSEC" TRUE
			else
				setVar $output $output&"0*"
				setSectorParameter $i "LIMPSEC" FALSE
			end
			add $i 1
		end
		delete $BOT~LIMP_FILE
		write $BOT~LIMP_FILE $output
		delete $BOT~LIMP_COUNT_FILE
		write $BOT~LIMP_COUNT_FILE $count

return
# ======================     END REFRESH LIMP (LIMPS) SUBROUTINE    ==========================

:report
	setVar $percent  (($count * 100) / SECTORS)
	setVar $gridChange ($count-$previousCount)
	if ($gridChange > 0)
		setVar $gridChange "+"&$gridChange
	end
	setVar $player~limpetsGridded TRUE
	setVar $switchboard~message $SWITCHBOARD~message&"          - Limpet Grid Report -*          - "&$count&" sectors, "&$personalCount&" personal. ("&$percent&"%) ("&$gridChange&" Change)*          - Activated  Limpet  Scan*            *             Sector    Personal/Corp*            ========================*"&$limpetOutput&"*"
return
