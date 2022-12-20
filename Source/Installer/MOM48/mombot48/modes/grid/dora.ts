# We can go down one ways when sectors have 2 or more warps - this could potenially get us stuck
#   do we want an option to not have this occur?
#
#   Currently not doing port reports
#	Faind good ports, then do report?
#
#   MCIC - surround good ports?
#   - Request move - when figs between 40 and 20, onc at SXX port, request figs

#   TWarp - Ore Management - not an issue just not put in yet
#     - Do we cart ore around or get stuck, find nearest ore, warp elsehere?
#     - i.e. hard to be both trader + twarp gridder
#   Known Issues
#
#    - We aren't doing port reports, so trading poor sectors at least once. In theory da 1 script
#   - When just testing MCIC - Looks like when it holos, finds a PPT, it then skips the test mcic
# 
#     - normal move through one way - did the m to no where, at 12 -


gosub :BOT~loadVars

loadVar $game~port_max
loadVar $game~ptradesetting
loadVar $game~MAX_PLANETS_IN_GAME
loadVar $bot~Folder
loadVar $PLAYER~SURROUNDFIGS			
loadVar $PLAYER~SURROUNDLIMP;			
loadVar $PLAYER~SURROUNDMINE			
loadVar $MAP~STARDOCK	
loadVar $BOT~LIMP_FILE 		
loadVar $BOT~ARMID_FILE 
loadvar $BOT~BOT_NAME

# ORE


setVar $BOT~help[1]  $BOT~tab&" Dora the Explorer"
setVar $BOT~help[2]  $BOT~tab&" Expores universe, no ZTM required, optional trades."
setVar $BOT~help[3]  $BOT~tab&" "
setVar $BOT~help[4]  $BOT~tab&" dora [turnsstop] {all/org/buys/none} {ports/warps} "
setVar $BOT~help[5]  $BOT~tab&"                    {mcicsell/mcicbuy/mcicboth}"
setVar $BOT~help[6]  $BOT~tab&" - [turnsstop] - Will stop exploring once we reach these turns."
setVar $BOT~help[7]  $BOT~tab&" - {all}       - All fuel<>equip org<>equip options"
setVar $BOT~help[8]  $BOT~tab&" - {org}       - All org<>equip options"
setVar $BOT~help[9]  $BOT~tab&" - {buys}      - BSB<>BSB combos"
setVar $BOT~help[10]  $BOT~tab&" - {none}      - No trading"
setVar $BOT~help[11]  $BOT~tab&"               When any trades applied, script will trade any port"
setVar $BOT~help[12]  $BOT~tab&"               it passes where it can sell a full load."
setVar $BOT~help[13]  $BOT~tab&" "
setVar $BOT~help[14]  $BOT~tab&" - {ports}     - Priortises gridding ports"
setVar $BOT~help[15]  $BOT~tab&" - {warps}     - Priortises gridding high warp density"
setVar $BOT~help[16]  $BOT~tab&" "
setVar $BOT~help[17]  $BOT~tab&" - {mcicsell}  - Test XXS ports for MCIC "
setVar $BOT~help[18]  $BOT~tab&" - {mcicbuy}   - Test XXB ports for MCIC "
setVar $BOT~help[19]  $BOT~tab&" - {mcicboth}  - Test all ports for MCIC "
setVar $BOT~help[20]  $BOT~tab&" "
setVar $BOT~help[21]  $BOT~tab&" - {deldata }  Deletes explored sectors "


gosub :BOT~helpfile

setVar $BOT~script_title "Hola - Lets take a looksie!"
gosub :BOT~banner

gosub :player~quikstats
setvar $startcredits $player~credits
setvar $startturns $player~turns


setVar $startingLocation $PLAYER~CURRENT_PROMPT
if ($startingLocation <> "Command")
	setVar $SWITCHBOARD~message "must be started from Command prompt.*"
	gosub :SWITCHBOARD~switchboard
	halt
end

if (($player~TWARP_TYPE = 1) or ($player~TWARP_TYPE = 2))
	setVar $moveTwarp 1
end

if ($player~FIGHTERS < 21)
	setVar $SWITCHBOARD~message "Dora - Need more than 20 figs!*"
	gosub :SWITCHBOARD~switchboard
	halt
end



setVar $stardock $MAP~STARDOCK
if ($stardock = 0)
	send "v"
    setTextLineTrigger getBackDockCrazy :getBackDockCrazy "The StarDock is located in sector"
    pause
    :getBackDockCrazy
        killalltriggers
        getWord CURRENTLINE $stardock 7
		STRIPTEXT $stardock "."
end
# FUTURE VARS
# Limps/Mines bot vars
setVar $restock 0
# Figs - Mines - Limps - maybe even figs called in?
setVar $callInFigs 0

setVar $cashPause 0

setVar $halt_turns $bot~parm1
isNumber $number $halt_turns

if ($number <> 1)
	setvar $switchboard~message "Please select what turns to halt at.*"
	gosub :switchboard~switchboard
	halt

end

if ($halt_turns <= 0)
	setvar $switchboard~message "Halt turns must be greater than 0.*"
	gosub :switchboard~switchboard
	halt
else
	setvar $switchboard~message "We will stop when we reach " & $halt_turns & " turns.*"
	gosub :switchboard~switchboard
end


getWordPos $bot~user_command_line $pos "deldata"
if ($pos > 0)
	setVar $deleteData TRUE
else
	setVar $deleteData FALSE
end


# pair trading options - ppt
#  "all" all pairs
#  "org" all Org-Equ
#  "buys" org - equip not selling ore
#  "none"  skip this step
setVar $pptTradingOption "buys"
setVar $singleTrades 1

# grid prority
#  "ports" SBS SSB ports  - I think this doesn't work because we end up with not enough buys!
#  "warps" - default - grid best option for exploring
setVar $gridPriority "ports"

# use the 'Trade' command to testMCIC and generall trade

# Trade every port where MCIC is needed OR have a viable trade for cash
#     Actually many options here
#      - Trading for cash
#      - MCIC Buys - i.e. none megarob options
#      - MCIC All - when wanting XXS ports for mega robs
#       - combo of them
#     Just making three options
#  just looking at mcic ports - all B S

setVar $testMcicSell 0
setVar $testMcicBuy 0

getWordPos $bot~user_command_line $pos "mcicsell"
if ($pos > 0)
	setVar $testMcicSell 1
	setVar $testMcicBuy 0
	setVar $msg $msg&"Testing MCIC XXS Ports only*"
	striptext $bot~user_command_line "mcicsell"

end

getWordPos $bot~user_command_line $pos "mcicbuy"
if ($pos > 0)
	setVar $testMcicBuy 1
	setVar $testMcicSell 0
	setVar $msg $msg&"Testing MCIC XXB Ports only*"
	striptext $bot~user_command_line "mcicbuy"
end

getWordPos $bot~user_command_line $pos "mcicboth"
if ($pos > 0)
	setVar $testMcicBuy 1
	setVar $testMcicSell 1
	setVar $msg $msg&"Testing MCIC XXS and XXB Ports*"
	striptext $bot~user_command_line "mcicboth"
end


getWordPos $bot~user_command_line $pos "all"
if ($pos > 0)
	setVar $pptTradingOption "all"
	setVar $msg $msg&"Trading All Pairs*"
else
	getWordPos $bot~user_command_line $pos "org"
	if ($pos > 0)
		setVar $pptTradingOption "org"
		setVar $msg $msg&"Trading Organic - Equipment Ports*"
	else
		getWordPos $bot~user_command_line $pos "buys"
		if ($pos > 0)
			setVar $pptTradingOption "buys"
			setVar $msg $msg&"Trading Org - Equip at BXXs only"
		else
			getWordPos $bot~user_command_line $pos "none"
			if ($pos > 0)
				setVar $pptTradingOption "none"
				setVar $msg $msg&"We are not trading at ports*"
				setVar $singleTrades 0
			end
		end
	end
end

setVar $msg $msg&"Prioritising sectors with SBS or SSB ports*"
getWordPos $bot~user_command_line $pos "ports"
if ($pos > 0)
	setVar $gridPriority "ports"
	setVar $msg $msg&"Prioritising sectors with SBS or SSB ports*"
else
	getWordPos $bot~user_command_line $pos "warps"
	if ($pos > 0)
		setVar $gridPriority "warps"
		setVar $msg $msg&"Prioritising sectors with best gridding option*"
	end
end


setvar $switchboard~message $msg
	gosub :switchboard~switchboard

setVar $allLimps 0
setVar $allArmids 0

fileExists $limpchk $BOT~LIMP_FILE
if ($limpchk = false)
	setVar $BOT~command "update"
	setVar $BOT~user_command_line "update"
	setVar $BOT~parm1 "update"
	
	saveVar $BOT~parm1
	
	saveVar $BOT~command
	saveVar $BOT~user_command_line
	load "scripts\"&$bot~mombot_directory&"\commands\data\update.cts"
	setEventTrigger        limpchkend        :limpchkend "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\data\update.cts"
	pause
	:limpchkend
		killalltriggers
	readToArray $BOT~LIMP_FILE $allLimps
else
	readToArray $BOT~LIMP_FILE $allLimps
end




setVar $stat_turnsUsed 0 
setVar $stat_figsdown 0
setVar $stat_moves 0
setVar $stat_trades 0
setVar $stat_refurbs 0

setVar $stat_dollarsppt 0
setVar $stat_dollarsnet 0
setVar $stat_dollarstrade 0

window dora 300 300 "Explore and Trade" 

setvar $stuff "Turns: " & $stat_turnsUsed & "*Figs Down: " & $stat_figsdown & "*Ports Traded: " & $stat_trades & "*Moves Made: " & $stat_moves & "**Gross Cash:" & $stat_dollarsppt & "**Net Cash:" & $stat_dollarsnet
setvar $stuff $stuff & "**Refurbs: " & $stat_refurbs
setWindowContents dora $stuff



#logging off
#reqRecording


setVar $doraExploredFile "dora_explored_" &  GAMENAME  & ".txt"
# Good POrts - tehse are those we can come back and explore - if we have twarp
# if we don't, we'll just grid them as we go
setVar $dangerousSectorLogFile "Grid_Warnings_" &  GAMENAME & "_" & $date & ".txt"


setArray $explored SECTORS

# This will be my stack for storing back out
#   when we hit a dead end, we work back looking for another option.
#   
#		    Max Sectors we'll keep in path back
setVar $maxPathBack 25
setArray $pathBack $maxPathBack
setVar $pathBacki 0
# Before going back, check we are not locked in.
setArray $pathBackHasOptions $maxPathBack


# we store this because tradewars stores it based on warp data, not density scan
setArray $warpCount SECTORS

setVar $futureDestsAdded 0
setVar $futurePortsAdded 0


fileExists $figlchk $doraExploredFile
if ($figlchk = 1)
	
	if ($deleteData = TRUE)
		echo "*###########"
		echo "*# DELETED #"
		echo "*###########"
		setvar $switchboard~message "Deleting Previous Data.*"
		gosub :switchboard~switchboard
		delete $doraExploredFile
	else
		if ($figlchk = 1)
			
			readToArray $doraExploredFile $voidsList
			setVar $i 1
			while ($i <= $voidsList)
				setVar $explored[$voidsList[$i]] 1
				#echo "* adding: " $voidsList[$i]
				add $i 1
			end
		end
	end
end

# Block Tunnel Bubble Doors
setVar $i 11
while ($i <= SECTORS)

	getSectorParameter $i "BUBBLEDOOR" $blockSec
	isNumber $test $blockSec
	if ($test = 1)
		if ($blockSec > 0)
			setVar $explored[$i] 1
			echo "Blocking Bubble Door: " $i "*"
		end
	end

	getSectorParameter $i "TUNNELDOOR" $blockSec 
	isNumber $test $blockSec
	if ($test = 1)
		if ($blockSec > 0)
			setVar $explored[$i] 1
			echo "Blocking Tunnel Door: " $i "*"
		end
	end
	
	add $i 1
end

listActiveScripts $scripts
setVar $foundep 0
setVar $a 1
while ($a <= $scripts)
	if ($scripts[$a] = "ephaggle.cts")
		setVar $foundep 1
	end
	add $a 1
end

setvar $switchboard~message "Pause for effect....*"
gosub :switchboard~switchboard
if ($foundep = 0)
	send "'" $BOT~BOT_NAME " ephaggle*"
end

setDelayTrigger delay :startPause 3000
pause
:startPause


setvar $switchboard~message "... and we are off!*"
gosub :switchboard~switchboard

gosub :player~quikstats

gosub :setVoidSectors




######################### MAIN LOOP
# Log Explored sectors so script can re-start


setVar $skipport 0	
setVar $iSaySo 1
while ($iSaySo)
	:topOfTheGridLoop
	setVar $freshSectors 0
	setVar $freshSectorsi 0
	setVar $freshSectorsNewPorts 0
	
	gosub :player~quikstats
	setvar $turnsNow $player~turns
	
	if ($cashPause = 1)
		if (PORT.EXISTS[CURRENTSECTOR] = TRUE)
			if (PORT.BUYFUEL[CURRENTSECTOR] = FALSE)
				send "'[atm:" $switchboard~BOT_NAME "=" CURRENTSECTOR "]*"
				waitfor "[atmdone]"
				send "'[atm]Spend it wisely, I'm out here risking my hide for peanuts!*"
				setVar $cashPause 0
			end
		end
	end
	if ($turnsNow < $halt_turns)
		setvar $switchboard~message "Turn Limit Reached*"
		gosub :switchboard~switchboard
		clearAllAvoids
		gosub :subreport
		halt
	end
	if (($player~FIGHTERS < 21) and ($ice = 0))
		setVar $SWITCHBOARD~message "Need more than 20 figs*"
		gosub :SWITCHBOARD~switchboard
		clearAllAvoids
		gosub :subreport
		halt
	end
	goSub :updateStats
	
	setVar $doneHolo 0
	#densityscan and store
	goSub :densityScan

	# check Trades
	if ((($pptTradingOption <> "none") or ($testMcicSell = 1) or ($testMcicBuy = 1)) and (PORT.EXISTS[$PLAYER~CURRENT_SECTOR]) and ($skipNextTrade = 0))
		if ($freshSectorsNewPorts > 0)
			goSub :holoScan
			setVar $doneHolo 1
			#check warps (maybe reports?)
			goSub :updateFreshSectors
		end
		# check trade needs to use $pptTradingOption and return back here once done. 
		# Check trade can also do $testMcic trade 
		# do the trade also
		setVar $originSector $PLAYER~CURRENT_SECTOR
		goSub :checkTrade
		if ($originSector <> $PLAYER~CURRENT_SECTOR)

			# Ok finished in other sector, lets push the previous onto the stack and go from here
			# Lets count if it had any neighbouring safe sectors, excluding ourselves!

			setVar $i 1
			setVar $safeSectors 0
			while ($i <= $deni)

				setVar $danger 0
				setVar $dSector $nSector[$i]
				setVar $dIndex $i
				getSectorParameter $dSector "FIGSEC" $hasFig
				if ($hasFig = "")
					setVar $hasFig 0
				end
				goSub :checkDanger
		
				if (($danger = 0) and ($explored[$dSector] = 0))
					if (($hasFig = 0) and ($dSector <> $PLAYER~CURRENT_SECTOR))
						add $safeSectors 1
						
					end
				end
				add $i 1
			end
			setVar $explored[$originSector] 1
			write $doraExploredFile $originSector
			setVar $stackSector $originSector
			goSub :pushPath
			# We've traded this sector, so we just want to go on to next one
			setVar $skipNextTrade 1
			goto :topOfTheGridLoop
		end
	
	end
	setVar $skipNextTrade 0
	# Check ATM

	if ($cashPause = 1)
		if (PORT.EXISTS[CURRENTSECTOR] = TRUE)
			if (PORT.BUYFUEL[CURRENTSECTOR] = FALSE)
				send "'[atm:" $switchboard~BOT_NAME "=" CURRENTSECTOR "]*"
				waitfor "[atmdone]"
				send "'[atm]Spend it wisely, I'm out here risking my hide for peanuts!*"
				setVar $cashPause 0
			end
		end
	end

	# Trading Done
	
	if (($freshSectorsNewPorts > 0) and ($doneHolo = 0))
		goSub :holoScan
		goSub :updateFreshSectors
	end

	goSub :getNextWarp
	if ($bestSector = 0)
		# We had to reposition and therefor not moving
		# need to rescan and move
		setVar $skipNextTrade 1
		goto :topOfTheGridLoop
	end

	# Log These like ftr grid and reload to not duplicate
	setVar $explored[$PLAYER~CURRENT_SECTOR] 1
	write $doraExploredFile $PLAYER~CURRENT_SECTOR

	
	if ($gridSectorPostTwarp > 0)
		# means we got something from previous options

		setVar $player~warpto $gridSector
		gosub :player~twarp
		add $stat_moves 1

		setVar $gridSectorPostTwarp 0
		# Need to skip trading at next port as it'll be used
		# saves wasing time re checking
		setVar $skipport 1

	else
		goSub :gridNextSector
	end
	
end
######################### END LOOP
clearAllAvoids
halt

:updateFreshSectors
	
	# just get all ports and single sectors plots back
	# this is to make sure we don't go down a 1 way whether navigating or ppt
	
	setVar $i 1
	while ($i <= $deni)
		# only get warps of target ports
		setVar $cl PORT.CLASS[$nSector[$i]]
		# only get paths of singles when no ppt'ing
		if (($pptTradingOption <> "none") or (($gridPriority = "ports") and (($cl = 4) or ($cl = 5) or ((($cl = 2) or ($cl = 1)) and ($nWarps[$i] > 2)))))
			if ((($nWarps[$i] = 1) and ($nNew[$i] = 1)) or (($nDensity[$i] = 100) and ($nNew[$i] = 1)))
				send "cf" $nSector[$i] "*" $PLAYER~CURRENT_SECTOR "*q"
				waitfor "omputer deactivated"
			end
		else
			# Unsure if I want to test 1 ways..
			if (($nWarps[$i] = 1) and ($nNew[$i] = 1))
				#send "cf" $nSector[$i] "*" $PLAYER~CURRENT_SECTOR "*q"
				#waitfor "omputer deactivated"
			end
		end
		add $i 1
	end
return


:getNextWarp
	
	# COLLECT DATA - Some used in one routine and not the other
	setVar $i 1
	setVar $safeSectors 0
	setVar $safes 0
	setVar $numSells 0
	setVar $sells 0
	setVar $numBuys 0
	setVar $buys 0
	setVar $bestSector 0

	while ($i <= $deni)

		setVar $danger 0
		setVar $dSector $nSector[$i]
		setVar $dIndex $i
		setvar $class PORT.CLASS[$dSector]
		getSectorParameter $dSector "FIGSEC" $hasFig
		if ($hasFig = "")
			setVar $hasFig 0
		end
		goSub :checkDanger
#echo "$danger:" $danger " $explored[$dSector]:" $explored[$dSector] " $class:" $class " $hasFig:" $hasFig "*"
		if (($danger = 0) and ($explored[$dSector] = 0))

			if ((($class = 4) or ($class = 5)) and ($hasFig = 0))
#echo "Found NumSells*"
				add $numSells 1
				setVar $sells[$numSells] $dSector
			end

			# we'll store buys with 4+ as th next option they are twice as prevlant as Sxx's, so it'll work out even
			if ((($class = 1) or ($class = 2)) and ($hasFig = 0) and ($warpCount[$dSector] > 2))
				add $numBuys 1
				setVar $buys[$numBuys] $dSector
			end
			if (($hasFig = 0) or ($hasFig = ""))
				add $safeSectors 1
				setVar $safes[$safeSectors] $dSector
			end
		end
		add $i 1
	end

	# Chanse sell ports
	if ($gridPriority = "ports")
		
		if ($numSells > 0)
			setVar $chkOptioni $numSells
			setVar $chkOption 0
			setVar $i 1
			while ($i <= $numSells)
				setVar $chkOption[$i] $sells[$i]
				add $i 1
			end

			goSub :getBestSectorFromList
			if ($newOptions > 1)
				goSub :goGridOtherOptions
			end
		end
		
		setVar $chkOptioni $numBuys
		setVar $chkOption 0
		setVar $i 1
		while ($i <= $numBuys)
			setVar $chkOption[$i] $buys[$i]
			add $i 1
		end

		if ($bestSector = 0)
			# we don't have a SELL ore pair, lets get a Buy Ore Pair port
			
			goSub :getBestSectorFromList
			if ($newOptions > 1)
				goSub :goGridOtherOptions
			end
		else
			# going to grid the buys now anyway - may remove this later
			# just testing ot see if we can increase number of trades post
			# - taking note, we are using the best sector routine to sort these
			# so need to save and restore
			setVar $temp_$bestSector $bestSector
			goSub :getBestSectorFromList
			#restore it, and grid them all
			setVar $bestSector $temp_$bestSector
			if ($newOptions > 0)
				goSub :goGridOtherOptions
			end

		end
		if ($bestSector = 0)
			# found no ports we wanted, lets just go best warps
			goSub :getBestWarps
		end	

	else
		goSub :getBestWarps
	end

	if ($bestSector = 0)



		goSub :checkOptions
		if ($safeOptionsBack = 0)
			setVar $SWITCHBOARD~message "Currently No safe path back - if have TWARP then we could move else where using DB *"
			gosub :SWITCHBOARD~switchboard 
			halt
		else
			
			setVar $chkSec $PLAYER~CURRENT_SECTOR
			setVar $adjSec $safeOptionsBackDirect
			goSub :checkAdj
			if (($moveTwarp = 1) and ($isAdj = 0))
				:jumpagain
				setVar $player~warpto $safeOptionsBackDirect
				gosub :player~twarp
				gosub :player~quikstats
				if ($player~twarpSuccess = TRUE)
					add $stat_moves 1
					setVar $toStackSector $safeOptionsBackDirect
					goSub :moveStackToOption
				else
					setVar $pathi 1
					setVar $c_pathBacki $pathBacki
					while ($pathi <= $c_pathBacki)
						
						setVar $stackSector $pathBack[1]
						goSub :popPath 
						getSectorParameter $stackSector "FIGSEC" $hasFig
						if ($hasFig = "")
							setVar $hasFig 0
						end
						if ($hasFig = 1)
							add $stat_moves 1
							add $stat_retreats 1
							setVar $PLAYER~moveIntoSector $stackSector
							gosub :PLAYER~moveIntoSector
							gosub :player~quikstats
							if (PORT.BUYORE[$PLAYER~CURRENT_SECTOR] = 0)
								send "jy"
								send "p t *  *  "
								gosub :player~quikstats	
								goto :jumpagain
							else
								goSub :checkPassingTrading
							end
							
							
		
						else
							setVar $SWITCHBOARD~message "Paths blocked finding a safe sector.*"
							gosub :SWITCHBOARD~switchboard
							halt
						end

						if ($stackSector = $safeOptionsBackDirect)
							setVar $pathi 30001
							return
						end
						add $pathi 1
					end
				end
			else				
				setVar $pathi 1
				setVar $c_pathBacki $pathBacki
				while ($pathi <= $c_pathBacki)
					
					setVar $stackSector $pathBack[1]
					goSub :popPath 
					getSectorParameter $stackSector "FIGSEC" $hasFig
					if ($hasFig = "")
						setVar $hasFig 0
					end
					if ($hasFig = 1)
						add $stat_moves 1
						add $stat_retreats 1
						setVar $PLAYER~moveIntoSector $stackSector
						gosub :PLAYER~moveIntoSector
						gosub :player~quikstats
						goSub :checkPassingTrading
	
					else
						setVar $SWITCHBOARD~message "Paths blocked finding a safe sector.*"
						gosub :SWITCHBOARD~switchboard
						halt
					end

					if ($stackSector = $safeOptionsBackDirect)
						setVar $pathi 30001
						return
					end
					add $pathi 1
				end
			end
		end

		 
	else
		# log warps back
	end

return
:goGridOtherOptions

	setVar $returnSector $PLAYER~CURRENT_SECTOR

	if ($moveTwarp = 11) 
		# STORE OTHER OPTIONS HERE ? Undecided
		# do we still want to do this as we are using the stack and already pushing
	else

		setVar $i 1
		while ($i <= $newOptions)
			if ($newi[$i] <> $bestSector)

				setVar $PLAYER~moveIntoSector $newi[$i] 
				gosub :PLAYER~moveIntoSector
				setSectorParameter  $newi[$i] "FIGSEC" TRUE
				gosub :player~quikstats
				send "sd"
				goSub :checkPassingTrading
				add $stat_moves 1
				add $stat_figsdown 1		
				setVar $PLAYER~moveIntoSector $returnSector 
				gosub :PLAYER~moveIntoSector
				gosub :player~quikstats
				add $stat_moves 1
			end
			add $i 1
		end
	
	end
return

:checkAdj
	setVar $isAdj 0
	setVar $cc 1
	while ($cc <= SECTOR.WARPCOUNT[$chkSec])
		if (SECTOR.WARPS[$chkSec][$cc] = $adjSec)

			setVar $isAdj 1
			return
		end
		add $cc 1
	end

return

:getBestSectorFromList

	
	setVar $newOptions 0
	setVar $newi 0

	setVar $i 1
	while ($i <= $chkOptioni)
		setVar $chkSec $chkOption[$i]
		setVar $adjSec $PLAYER~CURRENT_SECTOR
		goSub :checkAdj
		if ($isAdj = 1)
			add $newOptions 1
			setVar $newi[$newOptions] $chkSec
		else
		end
		add $i 1
	end

	if ($newOptions > 0)
		# select best
		setVar $denCount 0
		setVar $bestSector 0
		setVar $i 1
		while ($i <= $newOptions)
			if ($warpCount[$newi[$i]] > $denCount)
				setVar $bestSector $newi[$i]
				setVar $denCount $warpCount[$newi[$i]]
			end
			add $i 1
		end
	end

return


:getBestWarps
	setVar $i 1
	setVar $denCount 0
	setVar $bestSector 0
	while ($i <= $safeSectors)
		if ($warpCount[$safes[$i]] > $denCount)
			setVar $bestSector $safes[$i]
			setVar $denCount $warpCount[$safes[$i]]
		end
		add $i 1
	end

return


:checkTrade
	
	# $pptTradingOption
	#  "all" all pairs  (which still excludes fuel<>org
	#  "org" all Org-Equ
	#  "buys" org - equip not selling ore
	#  "none"  skip this step
#	echo "$pptTradingOption: " $pptTradingOption "*"
	setVar $trades 0
	setVar $tradesi 0
	setVar $tradestype 0

	if (($pptTradingOption <> "none") and (PORT.EXISTS[$PLAYER~CURRENT_SECTOR] = 1))

		# get neighbours with a potenial trading port that warp back
		setVar $cport PORT.CLASS[$PLAYER~CURRENT_SECTOR]
		setVar $i 1
		while ($i <= $deni)
			setVar $danger 0
			setVar $dSector $nSector[$i]
			setVar $dIndex $i
			
			goSub :checkDanger

			if ((PORT.EXISTS[$nSector[$i]]) and ($danger = 0))
				setVar $nport PORT.CLASS[$nSector[$i]]
				setVar $chkSec $nSector[$i]
				setVar $adjSec $PLAYER~CURRENT_SECTOR
				goSub :checkAdj
				if ($isAdj = 1)
					# all - i.e. 1 to 6
					if (($pptTradingOption = "all") and ($nport > 0) and ($nport < 7))
						goSub :isAllPair
						if ($portCanTrade = 1)
							add $tradesi 1
							setVar $trades[$tradesi] $chkSec
							setVar $tradestype[$tradesi] $tradingType
						end 
					elseif (($pptTradingOption = "org") and (($nport = 1) or ($nport = 2) or ($nport = 4) or ($nport = 5)))
						goSub :isOrgEPair
						if ($portCanTrade = 1)
							add $tradesi 1
							setVar $trades[$tradesi] $chkSec
							setVar $tradestype[$tradesi] $tradingType
						end 
					elseif (($pptTradingOption = "buys") and (($nport = 1) or ($nport = 2)))
						goSub :isBuysPair
						if ($portCanTrade = 1)
							add $tradesi 1
							setVar $trades[$tradesi] $chkSec
							setVar $tradestype[$tradesi] $tradingType
						end 
					end
				end

			end
			
			add $i 1
		end
		
		if ($tradesi > 0)
			 
			if ($tradesi > 1)
				setVar $i 1
				while ($i <= $tradesi)
					send "cr" $trades[$i] "*q"
					waitfor "Computer deactivated>"
					add $i 1
				end


				setVar $maxe 0
				setVar $tradePort 0
				setVar $i 1
				
				while ($i <= $tradesi)
					if (PORT.EQUIP[$trades[$i]] > $maxe)
						setVAr $maxe PORT.EQUIP[$trades[$i]]
						setVar $tradePort $trades[$i]
					end
					add $i 1
				end
			else
				setVar $tradePort $trades[1]
			end

			
			setVar $originSector $PLAYER~CURRENT_SECTOR
			setVar $prepptc $player~credits

			setVar $BOT~command "ppt"
			setVar $BOT~user_command_line $tradePort &" p:50 k:10"
			setVar $BOT~parm1 $tradePort
			setVar $BOT~parm2 "p:50"
			setVar $BOT~parm3 "k:10"

			saveVar $BOT~parm1
			saveVar $BOT~parm2
			saveVar $BOT~parm3
			
			saveVar $BOT~command
			saveVar $BOT~user_command_line
	
			load "scripts\"&$bot~mombot_directory&"\commands\cashing\ppt.cts"
			:backpptwait
			setTextLineTrigger        pptPauseForCash        :pptPauseForCash "[atm:" & $SWITCHBOARD~BOT_NAME & "]"
			setTextLineTrigger        pptMove        :pptMove "<Move>"
			setEventTrigger        pptended        :pptended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\cashing\ppt.cts"
			pause
			:pptPauseForCash
				killalltriggers
				setVar $cashPause 1
				send "'[atm:ack] Will pause at next SXB post trading.*"
				goto :backpptwait
			:pptMove
				killalltriggers
				add $stat_moves 1
				goto :backpptwait
			:pptended
				killalltriggers
			gosub :player~quikstats
			setVar $stat_dollarsppt ($stat_dollarsppt + ($player~credits - $prepptc))

			add $stat_ppts_done 1
			add $stat_figsdown 1
			setSectorParameter $tradePort "FIGSEC" TRUE
			
			if ($originSector <> $PLAYER~CURRENT_SECTOR)
				# Finished up next door, return
				
				return
			end
		else
			#echo "No Trade*"
			
		end
		
	
	end
	if (($tradesi = 0) and (PORT.EXISTS[$PLAYER~CURRENT_SECTOR] = 1))
# Can we be more selective here?
# maybe XXBs and those with a decent trade for cash?

		goSub :checkSingleTrading
		
	end

return

:doSingleTrade
	
	
	if (($testMcicBuy = 0) and ($testMcicSell = 0))
		setVar $keepquant 0
	else
		if ($pptTradingOption = "none")
			setVar $keepquant 15
		else
			setVar $keepquant 5
		end
	end
	setVar $pretradec $player~credits
	setVar $BOT~command "trade"
	setVar $BOT~user_command_line $keepquant
	setVar $BOT~parm1 $keepquant
	
	saveVar $BOT~parm1
	
	saveVar $BOT~command
	saveVar $BOT~user_command_line
	load "scripts\"&$bot~mombot_directory&"\commands\cashing\trade.cts"
	:backtradewait
	setTextLineTrigger        tradePauseForCash        :tradePauseForCash "[atm:" & $SWITCHBOARD~BOT_NAME & "]"
	setEventTrigger        tradeended        :tradeended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\cashing\trade.cts"
	pause
	:tradePauseForCash
		killalltriggers
		setVar $cashPause 1
		send "'[atm:ack] Will pause at next SXB post trading.*"
		goto :backtradewait
	:tradeended
		killalltriggers
	add $stat_trades 1
	gosub :player~quikstats

	setVar $stat_dollarstrade ($stat_dollarstrade + ($player~credits - $pretradec))
	
return

:isAllPair
	# Any port combo returns a postitve
	setVar $portCanTrade 0
	if ((($cport = 1) or ($cport = 5)) and (($nport = 2) or ($nport = 4)))
		setVar $portCanTrade 1
		setVar $tradingType 1
	elseif ((($cport = 2) or ($cport = 4)) and (($nport = 1) or ($nport = 5)))
		setVar $portCanTrade 1
		setVar $tradingType 1
	elseif ((($cport = 3) or ($cport = 4)) and (($nport = 1) or ($nport = 6)))
		setVar $portCanTrade 1
		setVar $tradingType 2
	elseif ((($cport = 1) or ($cport = 6)) and (($nport = 3) or ($nport = 4)))
		setVar $portCanTrade 1
		setVar $tradingType 2
	end

return


:isOrgEPair
	# Any port combo returns a postitve
	setVar $portCanTrade 0

	if (($cport = 1) or ($cport = 5))
		if (($nport = 2) or ($nport = 4))
			setVar $portCanTrade 1
			setVar $tradingType 1
		end
	elseif (($cport = 2) or ($cport = 4))
		if (($nport = 1) or ($nport = 5))
			setVar $portCanTrade 1
			setVar $tradingType 1
		end
	end

return


:isBuysPair
	# Any port combo returns a postitve
	setVar $portCanTrade 0

	if ($cport = 1)
		if ($nport = 2)
			setVar $portCanTrade 1
			setVar $tradingType 1
		end
	elseif ($cport = 2)
		if ($nport = 1)
			setVar $portCanTrade 1
			setVar $tradingType 1
		end
	end

return

:checkPassingTrading
	# for sectors we've explored/tested MCIC - do we want to trade
	if ($singleTrades = 1)
		setVar $doQuickTrade 0

		if (($player~ORE_HOLDS > 40) and (PORT.BUYFUEL[$PLAYER~CURRENT_SECTOR] = 1))
			setVar $doQuickTrade 1
		elseif (($player~ORGANIC_HOLDS > 40) and (PORT.BUYORG[$PLAYER~CURRENT_SECTOR] = 1))
			setVar $doQuickTrade 1
		elseif (($player~EQUIPMENT_HOLDS > 40) and (PORT.BUYEQUIP[$PLAYER~CURRENT_SECTOR] = 1))
			setVar $doQuickTrade 1
		end
		if ($doQuickTrade = 1)
			goSub :doSingleTrade
		end
	end
	
return

:checkSingleTrading
	setVar $doQuickTrade 0
	setVar $empty_holds ($PLAYER~TOTAL_HOLDS - ($player~ORE_HOLDS + $player~ORGANIC_HOLDS + $player~EQUIPMENT_HOLDS + $PLAYER~COLONIST_HOLDS))

	if ($singleTrades = 1)
		setVar $doQuickTrade 0

		if (($player~ORE_HOLDS > 40) and (PORT.BUYFUEL[$PLAYER~CURRENT_SECTOR] = 1))
			setVar $doQuickTrade 1
		elseif (($player~ORGANIC_HOLDS > 40) and (PORT.BUYORG[$PLAYER~CURRENT_SECTOR] = 1))
			setVar $doQuickTrade 1
		elseif (($player~EQUIPMENT_HOLDS > 40) and (PORT.BUYEQUIP[$PLAYER~CURRENT_SECTOR] = 1))
			setVar $doQuickTrade 1
		elseif (((PORT.BUYFUEL[$PLAYER~CURRENT_SECTOR] = 0) or (PORT.BUYORG[$PLAYER~CURRENT_SECTOR] = 0) or (PORT.BUYEQUIP[$PLAYER~CURRENT_SECTOR] = 0)) and ($empty_holds > 10))
			setVar $doQuickTrade 1
		end
		
	end
	getSectorParameter $PLAYER~CURRENT_SECTOR "EQUIPMENTH" $doneMCIC
	if ($doneMCIC = "")
		setVar $doneMCIC 0
	end
#echo "$singleTrades: " $singleTrades " $doneMCIC:" $doneMCIC " $testMcicBuy:" $testMcicBuy "PORT.BUYEQUIP[$PLAYER~CURRENT_SECTOR] : " PORT.BUYEQUIP[$PLAYER~CURRENT_SECTOR]  " $player~EQUIPMENT_HOLDS: " $player~EQUIPMENT_HOLDS "*"
	# if we haven't done MCIC, and it buys equip, and we are testing eqip, and we have at least one hold
	# TEST BUY PORT
	if (($doneMCIC = 0) and (PORT.BUYEQUIP[$PLAYER~CURRENT_SECTOR] = 1) and ($testMcicBuy = 1) and ($player~EQUIPMENT_HOLDS > 0))
		setVar $doQuickTrade 1
	end
	# TEST SELL PORT
	if (($doneMCIC = 0) and (PORT.BUYEQUIP[$PLAYER~CURRENT_SECTOR] = 0) and ($testMcicSell = 1) and ($empty_holds > 0))
		setVar $doQuickTrade 1
	end
	
	# OUT OF EQUIP BUY IT
	if (($testMcicBuy = 1) and (PORT.BUYEQUIP[$PLAYER~CURRENT_SECTOR] = 0) and ($player~EQUIPMENT_HOLDS < 2))
		setVar $doQuickTrade 1
	end
	
	# NEED TO FREE UP EQUIP
	if (($testMcicSell = 1) and (PORT.BUYEQUIP[$PLAYER~CURRENT_SECTOR] = 1) and ($empty_holds < 2) and ($player~EQUIPMENT_HOLDS > 0))
		setVar $doQuickTrade 1
	end
	
	if ($doQuickTrade = 1)
		goSub :doSingleTrade
	end

return

:restock

	
	gosub :player~quikstats
	setVar $prestockcredits $player~credits
	stripText $precredits ","

	gosub :restockself

	gosub :player~quikstats
	setVar $poststockcredits $player~credits
	stripText $poststockcredits ","
	setVar $stat_dollarstrade ($precredits - $poststockcredits)
	

return



:restockself
	add $stat_refurbs 1
	send "d"
	setVar $returnSpot $PLAYER~CURRENT_SECTOR
	
	setVar $restockMakePlanet 0
	if ($useGuard = true)
		
		setVar $planetFound 0
		goSub :checkCorpPlanet
		if ($planetFound = 0)
			setVar $restockMakePlanet 1
		else
			setVar $restockMakePlanet 0
		end

	end

	if ($corpCashDump = TRUE)

		setVar $doDockCashDump FALSE
		if ($PLAYER~CREDITS > 1100000)
			setVar $corpNotAtDock TRUE
			gosub :checkCorpAtDock
			if ($corpNotAtDock = FALSE)
				setVar $doDockCashDump TRUE
			end

		end
	end 
	send "m" $stardock "*y"
	waitfor "Locating beam pinpointed, TransWarp"
	send "y  "
	
	send "p   sh"
	
		send "a"
		setTextTrigger shipCheckBuyAtomics :shipCheckBuyAtomics "How many Atomic Detonators do you want"
		pause
		:shipCheckBuyAtomics
			killalltriggers
			getWord CURRENTLINE $AtomicssAvail 9
			stripText $AtomicssAvail ")"
			if ($AtomicssAvail = 0)
				#waitfor "next@"
				send "*"
			else
				send  "*a" $AtomicssAvail "*"
			end
			

		send "t"
		setTextTrigger shipCheckBuyTorps :shipCheckBuyTorps "How many Genesis Torpedoes do you want"
		pause
		:shipCheckBuyTorps
			killalltriggers
			getWord CURRENTLINE $TorpssAvail 9
			stripText $TorpssAvail ")"
			if ($TorpssAvail = 0)
				waitfor "next@"
			end
			send $TorpssAvail "*"
		
		
			gosub :player~quikstats
			send "qsp"

			setTextTrigger refurbFigPricet :refurbFigPricet "credits per fighter"
			:checkShields
			setTextTrigger refurbShields :refurbShields "Shield Points"
			pause
			:refurbFigPricet
				killalltriggers
				if ($furbfigs = TRUE)
					getWord CURRENTLINE $figPrice 4
					getWord CURRENTLINE $canBuy 8
					setVar $figsToBuy $player~credits
					subtract $figsToBuy 250000
					divide $figsToBuy $figPrice
					
					if ($figsToBuy > $canBuy)
						setVar $figsToBuy $canBuy
					end
					send "b" $figsToBuy "*"
				end
				goto :checkShields
			:refurbShields
				killalltriggers
				getWord CURRENTLINE $shieldPrice 5
				getWord CURRENTLINE $canBuy 9
				setVar $shieldsToBuy $player~credits
				subtract $shieldsToBuy 250000
				divide $shieldsToBuy $shieldPrice
				
				if ($shieldsToBuy > $canBuy)
					setVar $shieldsToBuy $canBuy
				end
				send "c" $shieldsToBuy "*"
			
			
	
	if ($corpCashDump = TRUE)

		if ($doDockCashDump = TRUE)
			goSUb :player~quikstats
			if ($PLAYER~CREDITS > 1100000)
				setVar $dumpcash ($PLAYER~CREDITS - 150000)
			else
				setVar $doDockCashDump FALSE
			end
		end
	end

	#send "qspb5000*c3000*q"
	send "qqq    *   "
	if ($restockMakePlanet = 1)
		send "u   y  n  .  n  *  c * *  "
	end
	
	if ($corpCashDump = TRUE)
		if ($doDockCashDump = TRUE)
			send "t  c  y  q   z   t" $dumpcash "*  *  *  "
		end
	end
	send "m  " $returnSpot  "*   y   y  "
	setTextLineTrigger restockBack1 :restockBack1 "<Set NavPoint>"
	setTextLineTrigger restockBack2 :restockBack2  "Systems Ready, shall we engag"
	pause
		:restockBack1
			killalltriggers
			send "q * q * * pss"
			setVar $SWITCHBOARD~message "Failed to leave dock!! Hopefully on dock..*"
			gosub :SWITCHBOARD~switchboard
			halt	

		:restockBack2
			killalltriggers
	
return



######################################## END TRADE ROUTINES




:setVoidSectors

	clearAllAvoids
	# we don't really want to sit outside of SD.

	setVar $explored[$stardock] 1
	setVar $a 1
	while ($a <= SECTOR.WARPCOUNT[$stardock])
		# Avoids warps out of StarDock
		setVar $explored[SECTOR.WARPS[$stardock][$a]] 1
		setAvoid SECTOR.WARPS[$stardock][$a]
		add $a 1
	end

	setVar $doMini 0
	setVar $i 2
	while ($i < 11)
		if (SECTOR.WARPCOUNT[$i] = 0)
			setVar $doMini 1
		end
		add $i 1
	end
	if ($doMini = 1)
		goSub :doMini
	end

	setVar $i 2
	while ($i < 11)
		setVar $a 1
		while ($a <= SECTOR.WARPCOUNT[$i])
			setVar $explored[SECTOR.WARPS[$i][$a]] 1
			setAvoid SECTOR.WARPS[$i][$a]
			add $a 1
		end
		add $i 1
	end

return


:doMini
	# we just want to check we have all warps out of fed
	send "c"
	setVar $i 10
	while ($i > 1)
		send "f" $i "*1*"
		subtract $i 1
	end
	
	send "/"
	waitfor "Shlds"

	setVar $plot 1
	while ($plot = 1)
		
		send "f1*" $stardock "*"
		setTextLineTrigger pathgood :pathgood "he shortest path"
		setTextLineTrigger pathbad :pathbad "No route within"
		pause
		:pathbad
			killalltriggers
			send "yq"
			setVar $plot 0
			goto :endplot
		:pathgood
			killalltriggers
			waitfor ">"
			getWord CURRENTLINE $sec1 3 
			getWord CURRENTLINE $sec2 5 
			getWord CURRENTLINE $sec3 7 
			stripText $sec1 "("
			stripText $sec2 "("
			stripText $sec3 "("
		
			stripText $sec1 ")"
			stripText $sec2 ")"
			stripText $sec3 ")"

			if ($sec1 > 10)
				setVar $voidS $sec1
			elseif ($sec2 > 10)
				setVar $voidS $sec2
			elseif ($sec3 > 10)
				setVar $voidS $sec3
			end
			send "v" $voidS "*"
			waitfor "future navigation calc"
			
		

		:endplot
	end


:subreport

	setVar $stuff ""
	gosub :calcStats
	setvar $switchboard~message $stuff & "**"
	gosub :switchboard~switchboard
return

:updateStats

	setVar $stuff ""
	gosub :calcStats

	setWindowContents dora $stuff
	add $updateCount 1
	if ($updateCount > 20)
		setVar $updateCount 1
		send "'Dora Update - Figs: " $stat_figsdown " Turns: " $stat_turnsUsed "*"
	end
return

:calcStats

	setVar $stat_dollarsnet ($stat_dollarsppt + $stat_dollarstrade)
	
	setVar $stat_turnsUsed ($startturns - $player~turns)

	setvar $stuff "Turns Used: " & $stat_turnsUsed & "*Figs Down: " & $stat_figsdown & "*Ports Traded: " & $stat_trades  & "*Pairs Traded: " & $stat_ppts_done  & "*Moves Made: " & $stat_moves& "*Backtracks Made: " & $stat_retreats
	
	setvar $stuff $stuff & "*Cash Pairs:" & $stat_dollarsppt & "*Cash Trades:" & $stat_dollarstrade & "*Total Cash:" & $stat_dollarsnet & "*Refurbs: " & $stat_refurbs
return

:checkDanger
	
	# Remove all known items and then compare	
	setVar $compareDensity $nDensity[$dIndex]
	if (PORT.EXISTS[$dSector])
		subtract $compareDensity 100
	end
	getSectorParameter $dSector "FIGSEC" $hasFig
	if ($hasFig = "")
		setVar $hasFig 0
	end
	if ($hasFig = 1)
		if (SECTOR.FIGS.OWNER[$dSector] = "belong to your Corp")
			subtract $compareDensity (SECTOR.FIGS.QUANTITY[$dSector] * 5)
		end
	end

	if ($allLimps[$dSector] > 0)
		subtract $compareDensity (2 * $allLimps[$dSector])
		setVar $nAnom[$dIndex] 0
	end

	if ($allArmids[$dSector] > 0)
		subtract $compareDensity (10 * $allArmids[$dSector])
	end


	if ($compareDensity = 0)
		setVar $danger 0
	else
		if ($dSector < 11)
			setVar $danger 0
			#echo "* ## Fed Safe so OK: " $dSector
		else
			#echo "* ## Odd Density - Avoiding: " $dSector
			setVar $danger 1
		end
	end
	

	if ($danger = 1)

		#echo "*#####################################################"
		#echo "*# Sector " $nDensity[$dIndex] " shows danger *"
		#echo "*#####################################################"
		
		write $dangerousSectorLogFile $dSector & " N:" & $PLAYER~CURRENT_SECTOR & " D: " & $nDensity[$dIndex] & " A: " & $nAnom[$dIndex]
		setVar $a 1
		while ($a <= SECTOR.WARPCOUNT[$PLAYER~CURRENT_SECTOR])
			
			if (SECTOR.WARPS[$PLAYER~CURRENT_SECTOR][$a] = $dSector)
				write $dangerousSectorLogFile $holoData[$a]
			end
			add $a 1
		end
		
	end 
return




#############END NEXT SECTOR STUFF


########################### GRID NEXT SECTOR
:gridNextSector

	if (($bestSector < 11) or ($bestSector = $stardock))
		send "m" $bestSector "**"
		add $stat_moves 1
	else
		setVar $origin $PLAYER~CURRENT_SECTOR

		setVar $PLAYER~moveIntoSector $bestSector
		gosub :PLAYER~moveIntoSector
		setSectorParameter $bestSector "FIGSEC" TRUE
		waitfor "Warps to S"
		waitfor "Command ["
		gosub :player~quikstats
		
		setVar $chkSec $PLAYER~CURRENT_SECTOR
		setVar $adjSec $origin
		goSub :checkAdj
		if ($isAdj = 1)
			setVar $stackSector $origin
			goSub :pushPath
			
		else
			# We just went through a one way - reset path back
			setArray $pathBack $maxPathBack
			setVar $pathBacki 0
			setArray $pathBackHasOptions $maxPathBack
echo "WENT THROUGH A ONE WAY -PATH BACK EMPTED*"
echo "Have had issues, leaving to highlight for debugging*"
		end
		add $stat_figsdown 1
		add $stat_moves 1
	end
	
return

############# PATH Stack

:moveStackToOption
	# if we twarp back to a spot on the path
	# we should trim stack to there 
	# Takes - $toStackSector
	
	setVar $movei 1
	while ($movei <= $pathBacki)
		
		setVar $stackSector $pathBack[$movei]
		goSub :popPath 
		if ($pathBack[$movei] = $toStackSector)
			setVar $movei 30001
			return
		end
		add $movei 1
	end

return

:checkOptions
	setVar $safeOptionsBack 0
	setVar $safeOptionsBackDirect 0
	setVar $ii 1

	while ($ii <= $pathBacki)
		if ($pathBackHasOptions[$ii] = 1)
			setVar $safeOptionsBackDirect $pathBack[$ii]
			setVar $safeOptionsBack 1
			setVar $ii 30001
			return
		end
		add $ii 1
	end

return
:popPath
	goSub :printPath
	if ($pathBacki = 0)
		setVar $stackSector 0
		return
	else
		setVar $stackSector $pathBack[1]
		setVar $tempi 1
		while ($tempi < $pathBacki)
			setVar $tempy ($tempi + 1)
			setVar $pathBack[$tempi] $pathBack[$tempy]
			setVar $pathBackHasOptions[$tempi] $pathBackHasOptions[$tempy]
			add $tempi 1
		end
		setVar $pathBack[$pathBacki] 0
		setVar $pathBackHasOptions[$pathBacki] 0
		subtract $pathBacki 1
	end
	goSub :printPath
return

:pushPath

	#goSub :printPath

	if ($maxPathBack = $pathBacki)

		setVAr $tempi ($maxPathBack - 1)
		while ($tempi >= 1)
			# i.e. 50 = 49, then 49 = 48
			setVar $tempy ($tempi + 1)
			setVar $pathBack[$tempy] $pathBack[$tempi]
			setVar $pathBackHasOptions[$tempy] $pathBackHasOptions[$tempi]
			subtract $tempi 1
		end 
		setVar $pathBack[1] $stackSector
		# We are going to one of the safe sectors, so we need 2+ to have an option
		if ($safeSectors > 1)
			setVar $pathBackHasOptions[1] 1
		else
			setVar $pathBackHasOptions[1] 0
		end
	else
		setVAr $tempi $pathBacki
		while ($tempi >= 1)
			# i.e. 50 = 49, then 49 = 48
			setVar $tempy ($tempi + 1)
			setVar $pathBack[$tempy] $pathBack[$tempi]
			setVar $pathBackHasOptions[$tempy] $pathBackHasOptions[$tempi]
			subtract $tempi 1
		end 
		setVar $pathBack[1] $stackSector
		# We are going to one of the safe sectors, so we need 2+ to have an option
		if ($safeSectors > 1)
			setVar $pathBackHasOptions[1] 1
		else
			setVar $pathBackHasOptions[1] 0
		end
		add $pathBacki 1
	end
	#goSub :printPath

return
:printPath
	# JUST FOR DEBUGGING
	return
	echo "Printing Stack Size:" $pathBacki "/" $maxPathBack "*"
	setVar $tempi 1
	while ($tempi <= $maxPathBack)
		echo "  " $tempi ": " $pathBack[$tempi] " opt:" $pathBackHasOptions[$tempi] "*"
		add $tempi 1
	end

return
###### END PATH STac

:holoScan
	
	send "sh"
	waitfor "Long Range Scan"
	setVar $hIndex 1
	setVar $hData ""

	:holoSectorStart
		setTextLineTrigger holoScanFirstSector :holoScanFirstSector "Sector  :"
		pause
		:holoScanFirstSector
			killtrigger holoScanFirstSector
			getWord CURRENTLINE $hSector 3
			setVar $hData "     " & CURRENTLINE

		
		:holoScanContinue
		setTextLineTrigger holoScanDetails :holoScanDetails ""
		pause
		:holoScanDetails

			killtrigger holoScanDetails
			getWord CURRENTLINE $firstword 1
			if ($firstword = "Warps")
				return
			elseif ($firstword = "Sector")
				setVar $holoData[$hIndex] $hData
				add $hIndex 1
				setVar $hData "     " & CURRENTLINE
				goto :holoScanContinue
			else
				setVar $hData "     " & $hData & "*" & CURRENTLINE
				goto :holoScanContinue
			end

return




:densityScan
	send "sd"
	waitfor "Relative Density Scan"

	setVar $deni 0
	setVar $nDensity 0
	setVar $nSector 0
	setVar $nWarps 0
	setVar $nHaz 0
	setVar $nAnom 0
	setVar $nNew 0

	setVar $freshSectors 0
	setVar $freshSectorsi 0
	setVar $freshSectorsNewPorts 0
	

	:densityScanning
		setTextLineTrigger densityScanLine :densityScanLine "Sector"
		setTextTrigger densityScanEnd :densityScanEnd "Help)?"
		pause
	
		:densityScanLine
	
			KillTrigger densityScanLine
			KillTrigger densityScanEnd
			
			getWord CURRENTLINE $scanSector 2
			if ($scanSector = "(")
				getWord CURRENTLINE $scanSector 3
				getWord CURRENTLINE $secDensity 5
				getWord CURRENTLINE $secWarps 8
				getWord CURRENTLINE $nHaz 11
				getWord CURRENTLINE $scanAnom 14
			else
				getWord CURRENTLINE $secDensity 4
				getWord CURRENTLINE $secWarps 7
				getWord CURRENTLINE $nHaz 10
				getWord CURRENTLINE $scanAnom 13
			end
			
			stripText $nHaz "%"
			
			getLength $scanSector $len

			stripText $scanSector ")"
			stripText $scanSector "("
			getLength $scanSector $len2
			
			stripText $$secDensity ","

			add $deni 1
			if ($len2 < $len)
				add $freshSectorsi 1
				setVar $freshSectors[$freshSectorsi] $scanSector
				if ($secDensity = 100)
					add $freshSectorsNewPorts 1
				end
				setVar $nNew[$deni] 1
			else
				setVar $nNew[$deni] 0
			end
			
			STRIPTEXT $secDensity ","			
			setVar $nDensity[$deni] $secDensity
			setVar $nSector[$deni] $scanSector
			setVar $nWarps[$deni] $secWarps
			setVar $warpCount[$scanSector] $secWarps
			setVar $nHaz[$deni] $nHaz
			setVar $nAnom[$deni] 0
			if ($scanAnom = "Yes")
				setVar $anomoly[$scanSector] 1
				setVar $nAnom[$deni] 1
			end
	
			goto :densityScanning
			
		:densityScanEnd
			KillTrigger densityScanLine
			KillTrigger densityScanEnd
	return



halt


:gotoDock
	send "y1*q"
	send "m" $stardock "*y"
	waitfor "All Systems Ready, shall we engage?"
	send "y"
	waitfor "TransWarp Drive Engaged!"
	send "ps"
	gosub :limpetCheck

return

:limpetCheck
		setTextTrigger limpetchecky :limpetchecky "A port official runs"
		setTextTrigger limpetcheckn :limpetcheckn "StarDock> Where to?"
		pause
		:limpetchecky
			killalltriggers
			send "y"
			return
		:limpetcheckn
			killalltriggers
			return

return





return

include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\switchboard"
include "source\bot_includes\player\moveintosector\player"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\twarp\player"
