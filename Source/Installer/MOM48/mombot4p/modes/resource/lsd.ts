    reqRecording
	loadvar $BOT~bot_name
	loadVar $BOT~unlimitedGame
	loadVar $BOT~BOT_TURN_LIMIT
	loadVar $bot~user_command_line
	loadVar $LSD_Order
	gosub	:player~quikstats
    setVar $CURENT_VERSION 		"4.0"
    setVar $TagLineB 			"LSDv" & $CURENT_VERSION
	setVar $location 			$player~current_prompt
    setVar $Starting_CREDITS 	$player~credits

    setVar $Starting_TURNS 		$player~turns
    setVar $START_SECTOR 		$player~current_sector
	setVar $ShipData_Valid		FALSE
	setVar $Ships_Names			"][LSD]["
	setVar $Ships_File 			"LSD_" & GAMENAME & ".ships"
	setVar $ShipListMax			50
	setArray $ShipList			$ShipListMax 3
    setVar $LSD__PAD "@"
	setVar $cmd ($bot~user_command_line & "^^%%@@")
	setVar $MinLength "M@M@M@M@M@Y@M@M@M@Y@M@M@Y@M@M@M@0@0@0@0"

	GetLength $MinLength $Mlen
	GetLength $bot~user_command_line $PrmLength
	clearAllAvoids
	
	if ($player~credits < 10000)
		send "'{" $BOT~bot_name "} " & $TagLineB & " - Must have more than 10,000 Creds on hand!**"
		halt
	end

	if (($player~twarp_type = "No") and ($player~current_sector <> STARDOCK))
		send "'{" $BOT~bot_name "} " & $TagLineB & " - Must have at least Twarp Type 1!**"
		halt
	end
	if ($PrmLength < $Mlen)
		send "'{" $BOT~bot_name "} " & $TagLineB & " - Length Of Passed String is Too Short. Possible Data Corruption!**"
		halt
	end

	#stripText $cmd $LSD__PAD
	replaceText $cmd $LSD__PAD " "

	#1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9
	#M 0 M M 0 Y M M M Y M M Y M M M 0 D 3 ][LSD][
	lowerCase $cmd

	getWord $cmd $_Atomics 1
	if ($_Atomics <> "")
		isNumber $tst $_Atomics
		if ($tst)
			if ($_Atomics = 0)
				setVar $_Atomics ""
			end
		else
			if ($_Atomics = "m")
				setVar $_Atomics "Max"
			else
				setVar $_Atomics ""
			end
		end
	end

	getWord $cmd $_Beacons 2
	if ($_Beacons <> "")
		isNumber $tst $_Beacons
		if ($tst)
			if ($_Beacons = 0)
				setVar $_Beacons ""
			end
		else
			if ($_Beacons = "m")
				setVar $_Beacons "Max"
			else
				setVar $_Beacons ""
			end
		end
	end

	getWord $cmd $_Corbo 3
	if ($_Corbo <> "")
		isNumber $tst $_Corbo
		if ($tst)
			if ($_Corbo = 0)
				setVar $_Corbo ""
			end
		else
			if ($_Corbo = "m")
				setVar $_Corbo "Max"
			else
				setVar $_Corbo ""
			end
		end
	end

	getWord $cmd $_Cloak 4
	if ($_Cloak <> "")
		isNumber $tst $_Cloak
		if ($tst)
			if ($_Cloak = 0)
				setVar $_Cloak ""
			end
		else
			if ($_Cloak = "m")
				setVar $_Cloak "Max"
			else
				setVar $_Cloak ""
			end
		end
	end

	getWord $cmd $_Probe 5
	if ($_Probe <> "")
		isNumber $tst $_Probe
		if ($tst)
			if ($_Probe = 0)
				setVar $_Probe ""
			end
		else
			if ($_Probe = "m")
				setVar $_Probe "Max"
			else
				setVar $_Probe ""
			end
		end
	end

	getWord $cmd $_PScan 6
	if ($_PScan <> "")
		if ($_PScan <> "y")
			setVar $_PScan ""
		end
	end

	getWord $cmd $_Limps 7
	if ($_Limps <> "")
		isNumber $tst $_Limps
		if ($tst)
			if ($_Limps = 0)
				setVar $_Limps ""
			end
		else
			if ($_Limps = "m")
				setVar $_Limps "Max"
			else
				setVar $_Limps ""
			end
		end
	end

	getWord $cmd $_Mines 8
	if ($_Mines <> "")
		isNumber $tst $_Mines
		if ($tst)
			if ($_Mines = 0)
				setVar $_Mines ""
			end
		else
			if ($_Mines = "m")
				setVar $_Mines "Max"
			else
				setVar $_Mines ""
			end
		end
	end

	getWord $cmd $_Photon 9
	if ($_Photon <> "")
		isNumber $tst $_Photon
		if ($tst)
			if ($_Photon = 0)
				setVar $_Photon ""
			end
		else
			if ($_Photon = "m")
				setVar $_Photon "Max"
			else
				setVar $_Photon ""
			end
		end
	end

	getWord $cmd $_LRScan 10
	if ($_LRScan <> "")
		if ($_LRScan <> "y")
			setVar $_LRScan ""
		end
	end

	getWord $cmd $_Disrupt 11
	if ($_Disrupt <> "")
		isNumber $tst $_Disrupt
		if ($tst)
			if ($_Disrupt = 0)
				setVar $_Disrupt ""
			end
		else
			if ($_Disrupt = "m")
				setVar $_Disrupt "Max"
			else
				setVar $_Disrupt ""
			end
		end
	end

	getWord $cmd $_GenTorp 12
	if ($_GenTorp <> "")
		isNumber $tst $_GenTorp
		if ($tst)
			if ($_GenTorp = 0)
				setVar $_GenTorp ""
			end
		else
			if ($_GenTorp = "m")
				setVar $_GenTorp "Max"
			else
				setVar $_GenTorp ""
			end
		end
	end

	getWord $cmd $_T2Twarp 13
	if ($_T2Twarp <> "")
		if ($_T2Twarp <> "y")
			setVar $_T2Twarp ""
		end
	end

	getWord $cmd $_Holds 14
	if ($_Holds <> "")
		isNumber $tst $_Holds
		if ($tst)
			if ($_Holds = 0)
				setVar $_Holds ""
			end
		else
			if ($_Holds = "m")
				setVar $_Holds "Max"
			else
				setVar $_Holds ""
			end
		end
	end

	getWord $cmd $_Figs 15
	if ($_Figs <> "")
		isNumber $tst $_Figs
		if ($tst)
			if ($_Figs = 0)
				setVar $_Figs ""
			end
		else
			if ($_Figs = "m")
				setVar $_Figs "Max"
			else
				setVar $_Figs ""
			end
		end
	end

	getWord $cmd $_Shields 16
	if ($_Shields <> "")
		isNumber $tst $_Shields
		if ($tst)
			if ($_Shields = 0)
				setVar $_Shields ""
			end
		else
			if ($_Shields = "m")
				setVar $_Shields "Max"
			else
				setVar $_Shields ""
			end
		end
	end

	getWord $cmd $_Tow 17
	if ($_Tow <> "")
		isNumber $tst $_Tow
		if ($tst)
			if ($_Tow < 1)
				setVar $_Tow 0
			end
		else
			setVar $_Tow 0
		end
	else
		setVar $_Tow 0
	end

	getWord $cmd $_Trickster 18
	if ($_Trickster = "0")
		setVar $_Trickster ""
	end

	getWord $cmd $NumberOfShip 19
	if ($NumberOfShip <> "")
		isNumber $tst $NumberOfShip
		if ($tst)
			if ($NumberOfShip < 1)
				setVar $NumberOfShip 0
			end
		else
			setVar $NumberOfShip 0
		end
	else
		setVar $NumberOfShip 0
	end

	getText $cmd $CustomShipName ($_Trickster&" "&$NumberOfShip&" ") "^^%%"
	replaceText $CustomShipName "  " "@"
	stripText $CustomShipName "@"

	gosub :player~quikstats

	if (STARDOCK <= 0)
		send "'{" $BOT~bot_name "} " & $TagLineB & " - Cannot Find Dock!**"
		halt
	end

	if (SECTOR.EXPLORED[STARDOCK] <> "YES")
		send "'{" $BOT~bot_name "} " & $TagLineB & " - Have Not Visited StarDock!**"
		halt
	end

    Gosub :LoadShipData

	setVar $location $player~current_prompt
	getWordPos CURRENTANSILINE $pos #27
	if ($location = "Command")
		if ($pos = 0)
			send " c n 1 q q "
			waitfor "Command [TL="
		end
	elseif ($location = "Citadel")
		if ($pos = 0)
			send " c n 1 q q "
			waitfor "Citadel command"
		end
	elseif ($location = "Planet")
		setVar $Theres_Citadel FALSE
		setTextTrigger THERES_NO_CIT :THERES_NO_CIT "Planet command (?=help)"
		setTextLineTrigger THERE_CIT :THERES_CIT "Planet has a level "
		pause
		:THERES_CIT
			setVar $Theres_Citadel TRUE
			pause
		:THERES_NO_CIT
			killAllTriggers

		if ($Theres_Citadel)
			send " C "
		else
			send " Q "
		end
		getWordPos CURRENTANSILINE $pos #27
		if ($pos = 0)
			send " c n 1 q q "
			if ($Theres_Citadel)
				waitfor "Citadel command"
			else
				waitfor "Command "
			end
		end
	end

	setVar $SpeacalMSG 			""
	setVar $Runs2Dock 			0

	if (($location = "Citadel") OR ($location = "Command"))
		gosub :CN1_AND_CN9_CHECKING
	else
		send "'{" $BOT~bot_name "} " & $TagLineB & " - Need To Be At Citadel Or Command Pprompt!!**"
		halt
	end

	if ($location = "Citadel")
		send " C  V  0*  Y  N" & $START_SECTOR & "* V  0*  Y  N" & STARDOCK & "*  U  Y  Q  Q  DS  N  L  1* S  N  L  2*  S  N  L  3*  T  N  L  2*  T  N  L  3*  T  N  T  1*  *  Q *  w  n  * "
		setTextLineTrigger pnum :pnum "Planet #"
		pause
		:pnum
		killAllTriggers
		getWord CURRENTLINE $planet~planet 2
		stripText $planet~planet "#"
	elseif ($location = "Command")
		send " C  V  0*  Y  N" & $START_SECTOR & "* V  0*  Y  N" & STARDOCK & "* U Y Q *  w  n  * "
	end

	gosub :player~quikstats

	setVar $Start_Creds $player~credits
	setVar $Start_Exp $player~experience
	setVar $Start_Holds $player~total_holds

	waitfor "(?="
	if ($player~turns = 0)
		gosub :TurnsDetect
		if ($UNLIM = FALSE)
			if ($player~turns < $BOT~BOT_TURN_LIMIT)
				send "'{" $BOT~bot_name "} " & $TagLineB & " - Not have enough Turns!**"
				halt
			end
		end
	end

	if (($player~total_holds <> $player~ore_holds) and ($player~current_sector <> STARDOCK))
		send "'{" $BOT~bot_name "} " & $TagLineB & " - Please Restart with Full Ore in Holds!!**"
		halt
	end

:start
	setVar $locationDock 0
	if ($player~current_sector <> STARDOCK)
		setVar $figcnt SECTOR.FIGS.QUANTITY[$START_SECTOR]
		setVar $figowner SECTOR.FIGS.OWNER[$START_SECTOR]
		if (($figcnt = 0) OR (($figOwner <> "belong to your Corp") AND ($figOwner <> "yours")))
			send "'{" $BOT~bot_name "} " & $TagLineB & " - Fig Required In Current Sector**"
			halt
		end
	else
		setVar $locationDock 1
	end
	#=--------                                                                       -------=#
	#=------------------------------       Main Event       ------------------------------=#
	#=--------                                                                       -------=#
	setVar $RUN_ONCE TRUE

	if (($_Atomics = "") AND ($_Beacons = "") AND ($_Corbo = "") AND ($_Cloak = "") AND ($_Probe = "") AND ($_PScan = "") AND ($_Limps = "") AND ($_Mines = "") AND ($_Photon = "") AND ($_LRScan = "") AND ($_Disrupt = "") AND ($_GenTorp = "") AND ($_T2Twarp = "") AND ($_Holds = "") AND ($_Figs = "") AND ($_Shields = "") AND ($_Trickster = "") AND ($NumberOfShip < 1))
		send "'{" $BOT~bot_name "} " & $TagLineB & " - Nothing To Do**"
		halt
	end

	#=-------------------This is where we loop too if buying more than one ship
	:HERE_WE_GO_AGAIN
		setVar $CurrentShip $player~ship_number
		add $Runs2Dock 1

	if (($_Tow > 0) AND ($_Trickster = ""))
		setVar $Pass ""
		gosub :GetPassWord
        	gosub :LockTow
        else
        	setVar $_Tow 0
        	send " W N * "
	end

		if ($RUN_ONCE)
			if ($locationDock = 0)
				# check adj's for Dock.. if present, then we don't need a jump sector.
				setVar $i 1
				setVar $WeAreAdjDock FALSE
				while ($i <= SECTOR.WARPCOUNT[$START_SECTOR])
					setVar $adj_start SECTOR.WARPS[$START_SECTOR][$i]
					if ($adj_start = STARDOCK)
						setVar $WeAreAdjDock TRUE
					end
					add $i 1
				end

				if (($player~alignment < 1000) AND ($WeAreAdjDock = FALSE))
					setVar $RED_adj 0
					gosub :findjumpsector
					if ($RED_adj <> 0)
						send ("'{"&$BOT~bot_name&"} "&$TagLineB&" - Jump Sector Found"&" - Using Sector "&$RED_adj&"**")
					else
						waitfor "Command [TL="
						send "'{" & $BOT~bot_name & "} " & $TagLineB & " - Cannot Find Jump Sector Adjacent Dock**"
						halt
					end
				end

				if ($player~alignment >= 1000)
					if ($WeAreAdjDock)
						send "^F" & STARDOCK & "*" & $START_SECTOR & "*Q/ "
					else
						send "^F" & $START_SECTOR & "*" & STARDOCK & "*F" & STARDOCK & "*" & $START_SECTOR & "*Q/ "
					end
				else
					if ($WeAreAdjDock)
						send "^F" & STARDOCK & "*" & $START_SECTOR & "*Q/ "
					else
						send "^F" & $START_SECTOR & "*" & $RED_adj & "*F" & STARDOCK & "*" & $START_SECTOR & "*Q/ "
					end
				end
				setTextLineTrigger noJoy :noJoy "*** Error - No route within"
				setTextTrigger cont :cont "(?="
				pause

				:noJoy
					killAllTriggers
					send "'{" $BOT~bot_name "} " & $TagLineB & " - Cannot Find Path to StarDock!**"
					halt
				:cont
					killAllTriggers
					setDelayTrigger Latency_Delay		:Latency_Delay 500
					pause

					:Latency_Delay

				Echo "**" & ANSI_14 & "Please Stand By" & ANSI_15 & " - Calculating Distances...**"
					if (($player~alignment >= 1000) OR ($WeAreAdjDock))
						getdistance $dist1 $START_SECTOR STARDOCK
					else
						getdistance $dist1 $START_SECTOR $RED_adj
					end

					if ($dist1 <= 0)
						send "'{" $BOT~bot_name "} " & $TagLineB & " - Insufficient Warp Data Plotting Course to Dock**"
						halt
					end

					getdistance $dist2 STARDOCK $START_SECTOR
					if ($dist2 <= 0)
						send "'{" $BOT~bot_name "} " & $TagLineB & " - Insufficient Warp Data Plotting Return Course From Dock**"
						halt
					end

					setVar $ore_req (($dist1 + $dist2) * 3)

					if ($_Tow > 0)
						setVar $ore_req ($ore_req * 2)
					elseif ($_Trickster <> "")
						setVar $ore_req ($dist1 * 3)
						setVar $ore_req $ore_req + ($dist2 * 6)
					end

					if ($player~ore_holds < $ore_req)
						send "'{" $BOT~bot_name "} " & $TagLineB & " - Not Enough ORE In Holds To Make Round Trip**"
						halt
					end

					if ($player~twarp_type = "No")
						send "'{" $BOT~bot_name "} " & $TagLineB & " - Must Have Twarp 1 or 2**"
						halt
					end

					if ($UNLIM = 0)
						gosub :TurnsRequired
						if ($player~turnsRequired > $player~turns)
							send "'{" $BOT~bot_name "} " & $TagLineB & " - Not Enough Turns. " & ANSI_12 & $player~turnsRequired & ANSI_15 & ", Required**"
							halt
						elseif ($player~turnsRequired <= $player~turns)
							setVar $tmp ($player~turns - $player~turnsRequired)
							if ($tmp <= $BOT~BOT_TURN_LIMIT)
								send "'{" $BOT~bot_name "} " & $TagLineB & " - Proceeding Will Leave Fewer Than " & $BOT~BOT_TURN_LIMIT & " Turns!**"
								halt
							end
						end
					end
				end
			end

			send " C R " & STARDOCK & "*Q "
			setTextLineTrigger itsalive :itsalive "Items     Status  Trading % of max OnBoard"
			setTextLineTrigger nosoupforme :nosoupforme "I have no information about a port in that sector"
			pause
			:nosoupforme
				killAllTriggers
				send "'{" $BOT~bot_name "} " & $TagLineB & " - StarDock appears to have been Blown Up!**"
				halt
			:itsalive
				killAllTriggers
				waitfor "(?="
				setVar $msg ""
				if ($locationDock = 1)
					send "P  S G Y G Q "
				elseif (($player~alignment >= 1000) AND ($WeAreAdjDock = FALSE))
					setVar $TwarpTo STARDOCK
					gosub :DoTwarp
				elseif (($WeAreAdjDock = FALSE) AND ($RED_adj <> 0))
					setVar $TwarpTo $RED_adj
					gosub :DoTwarp
				else
					send " m " & STARDOCK & "*  *  P  S G Y G Q "
				end
				if ($msg = "")
					waitfor "You leave the Galactic Bank."
				else
					send "'{" $BOT~bot_name "} " & $TagLineB & " - Unknown Problem Detected. Check TA!**"
					halt
				end

		gosub :player~quikstats

		if (($Start_Creds <= 100) AND ($Start_Exp < $EXPERIECE) AND ($Start_Holds <> $player~total_holds))
        		send "'{" $BOT~bot_name "} " & $TagLineB & " - Appear To Have Been Podded!**"
        		halt
		end

		if ($_Tow > 0)
			if ($player~current_prompt = "<StarDock>")
				gosub :DoShipTowedCheck
				setVar $shipnum $_Tow
				gosub :DoXport
			else
				send "'{" $BOT~bot_name "} " & $TagLineB & " - Not at Expected StarDock Prompt!**"
				halt
			end
		elseif ($_Trickster <> "")
			if ($player~current_prompt = "<StarDock>")
				gosub :BUYSHIP
				if ($NewShipNumber > 0)
					setVar $_Tow $NewShipNumber
					setVar $pass ""
				else
					setVar $_Tow 0
					setVar $NumberOfShip 0
					goto :GO_HOME_EMPTY_HANDED
				end
			else
				send "'{" $BOT~bot_name "} " & $TagLineB & " - Not at Expected StarDock Prompt!**"
				halt
			end
		end

		gosub :DoPurchases

		if ($_Tow > 0)
			if ($pass = "")
				setVar $shipnum $CurrentShip
			else
				setVar $shipnum $CurrentShip & "*" & $pass & "*   "
			end

			gosub :DoXport
		    gosub :player~quikstats

			if ($player~current_prompt <> "<StarDock>")
				send "'{" $BOT~bot_name "} " & $TagLineB & " - Not at Expected StarDock Prompt!**"
				halt
    		end
        end

		:GO_HOME_EMPTY_HANDED
		
		if ($locationDock = 1)
			send "Q Q Q Q Z N "
		
		elseif ($_Tow > 0)
			if ($location = "Citadel")
				send "q q q  z  n  w  n  *  w  n" & $_Tow & "*  n  n  *  m " & $START_SECTOR & " *  y  y  y  *  d  w  n * L Z" & #8 & $planet~planet & "* p  s s * * c *"
			else
				send "q q q  z  n  w  n  *  w  n" & $_Tow & "*  n  n  *  m " & $START_SECTOR & " *  y  y  y  *  d  w  n *  p z s s *"
			end
		else
			if ($location = "Citadel")
				send "Q Q Q Q Z N M " & $START_SECTOR & "* Y  Y  Y  * L Z" & #8 & $planet~planet & "* p  s  s * * c *"
			else
				send "Q Q Q Q Z N M " & $START_SECTOR & "* Y  Y  Y  *  P Z S S *"
			end
		end

		gosub :player~quikstats

		waitfor "(?="
		if (($player~current_sector = STARDOCK) and ($locationDock = 0))
			send "'{" $BOT~bot_name "} " & $TagLineB & " - Twarp Error, Should be Hiding on Dock!**"
			halt
		end

		if ($NumberOfShip <> "")
			if ($NumberOfShip > 1)
				if ($player~current_prompt = "Citadel")
					setVar $_Tow 0
					send " Q  T  N  T  1*  Q  "
					waitfor "Command [TL"
					subtract $NumberOfShip 1

					gosub :player~quikstats
					if ($player~total_holds <> $player~ore_holds)
						send "'{" $BOT~bot_name "} " & $TagLineB & " - Out Of Gas - Planet appears to have too little ORE to continue!**"
						halt
					end

					if ($RUN_ONCE)
						if ($UNLIM = FALSE)
							setVar $Turn_Diff ($Starting_TURNS - $player~turns)
							setVar $Turn_Req ($Turn_Diff * $NumberOfShip)

							if ($Turn_Req > $player~turns)
								setPrecision 0
								setVar $Turn_Req ($player~turns / $Turn_Diff)

								if ($Turn_Req < 1)
									setVar $NumberOfShip 0
									setVar $Turn_Req $Turn_Diff
								end
							end
				    		end

						setVar $ActualCost ($Starting_CREDITS - $player~credits)
						setVar $BottomLine ($ActualCost * $NumberOfShip)
						setVar $BottomLine ($ActualCost + $BottomLine)

						if ($BottomLine > $player~credits)
							setPrecision 0
							setVar $NumberOfShip ($player~credits / $ActualCost)
							if ($NumberOfShip < 1)
								setVar $NumberOfShip 0
								setVar $BottomLine $ActualCost
							else
								setVar $BottomLine ($ActualCost * ($NumberOfShip + 1))
							end
						end

						if ($UNLIM = FALSE)
							setVar $SpeacalMSG $SpeacalMSG & "                + " & $Turn_Diff & " Turns Used Per Trip.*"
							setVar $SpeacalMSG $SpeacalMSG & "                + " & ($Turn_Diff * ($NumberOfShip + 1)) & " Total Turns Expended.*"
						end
						setVar $CashAmount $ActualCost
						gosub :CommaSize
						setVar $SpeacalMSG $SpeacalMSG & "                + $" & $CashAmount & " Spent On Each Ship.*"
						setVar $CashAmount $BottomLine
						gosub :CommaSize
						setVar $SpeacalMSG $SpeacalMSG & "                + $" & $CashAmount & " Grand Total!*"
						setVar $RUN_ONCE FALSE
					end

					if ($NumberOfShip = 0)
						goto :WE_DONE
					else
		        			goto :HERE_WE_GO_AGAIN
		        		end
				end
			end
		end

        :WE_DONE

		#Not sure what I was thinking. commented out the if statement. JAN 29 07
		#if ($_Tow > 0)
		if ($location = "Citadel")
			send " q q "
			waitfor "Command [TL="
			gosub :ig_turn_it_on
			send " l z" & #8 & $planet~planet & "*  j  c  *  "
		else
			gosub :ig_turn_it_on
		end
		#end

		setPrecision 0
		setVar $CashAmount ($Starting_CREDITS - $player~credits)
		gosub :CommaSize
		setVar $_Spent $CashAmount
		setVar $CashAmount $player~credits
		gosub :CommaSize
		setVar $_Remain $CashAmount

		if (($_Tow <> 0) AND ($_Trickster = ""))
			send "'{" & $BOT~bot_name & "} " & $TagLineB & " Complete - Spent: $" & $_Spent & " on Ship #" & $_Tow & ", OnHand: $" & $_Remain & "*"
			waitfor "Message sent on sub-space channel"
		elseif ($SpeacalMSG <> "")
			send "'*"
			setTextLineTrigger COMMSrON 	:COMMSrON "Comm-link open on sub-space band"
			setTextLineTrigger COMMSrOFF	:COMMSrOFF "You'll need to select a radio channel first."
			pause
			:COMMSrON
				killAllTriggers
				send "'{" $BOT~bot_name "} " & $TagLineB & " Complete - Spent: $" & $_Spent & " on " & $Runs2Dock & " Ships, OnHand: $" & $_Remain & "*"
				send $SpeacalMSG & "*"
				send "* * "
				waitfor "Sub-space comm-link terminated"
			:COMMSrOFF
				killAllTriggers
		else
			send "'{" $BOT~bot_name "} " & $TagLineB & " Completed - Spent: $" & $_Spent & ", On Hand: $" & $_Remain & "*"
			waitfor "Message sent on sub-space channel"
		end
		halt
		#=---------------------------------------- THE BIG FINISH --------------------------------------------=#
	halt

    #=--------                                                                       -------=#
     #=------------------------------      SUB ROUTINES      ------------------------------=#
    #=--------                                                                       -------=#
:pad_this
	if ($str_pad < 10)
		setVar $str_pad "     " & $str_pad
	elseif ($str_pad < 100)
		setVar $str_pad "    " & $str_pad
	elseif ($str_pad < 1000)
		setVar $str_pad "   " & $str_pad
	elseif ($str_pad < 10000)
		setVar $str_pad "  " & $str_pad
	elseif ($str_pad < 100000)
		setVar $str_pad " " & $str_pad
	end
	return

:DoPurchases
	if ($ShipData_Valid = 0)
		gosub :ParseShipData
	end
	send "h "
	waitfor "<Hardware Emporium>"
	#=============================================== PURCHASE ATOMICS
	if ($_Atomics <> "")
		send "a "
		waitfor "How many Atomic Detonators do you want"
		if ($_Atomics = "Max")
			getText CURRENTLINE $buy "(Max" ")"
			send $buy & "* "
		else
			send $_Atomics & "* "
		end
		waitfor "<Hardware Emporium>"
	end
	#=============================================== PURCHASE BEACONS
	if ($_Beacons <> "")
		send "b "
		waitfor "How many Beacons do you want"
		if ($_Beacons = "Max")
			getText CURRENTLINE $buy "(Max" ")"
			send $buy & "* "
		else
			send $_Beacons & "* "
		end
		waitfor "<Hardware Emporium>"
	end
	#=============================================== PURCHASE CORBO
	if ($_Corbo <> "")
		send "C "
		waitfor "How many Corbomite Transducers do you want"
		if ($_Corbo = "Max")
			getText CURRENTLINE $buy "(Max" ")"
			send $buy & "* "
		else
			send $_Corbo & "* "
		end
		waitfor "<Hardware Emporium>"
	end
	#=============================================== PURCHASE CLOAKS
	if ($_Cloak <> "")
		send "D "
		waitfor "How many Cloaking units do you want"
		if ($_Cloak = "Max")
			getText CURRENTLINE $buy "(Max" ")"
		else
			setVar $buy $_Cloak
		end
		send $buy & "* "
		waitfor "<Hardware Emporium>"
	end
	#=============================================== PURCHASE PROBES
	if ($_Probe  <> "")
		send "E "
		waitfor "How many Probes do you want"
		if ($_Probe  = "Max")
			getText CURRENTLINE $buy "(Max" ")"
			send $buy & "* "
		else
			send $_Probe & "* "
		end
		waitfor "<Hardware Emporium>"
	end
	#=============================================== PURCHASE PSCAN
	if ($_PScan  <> "")
		send "F "
		setTextTrigger canpscan		:canpscan "I can let you have one for"
		setTextTrigger cantpscan	:cantpscan "<Hardware Emporium> So what are you looking for"
		pause
		:canpscan
			killTrigger canpscan
			send "Y"
			pause
		:cantpscan
			killAllTriggers

	end
	#=============================================== PURCHASE LIMPS
	if ($_Limps  <> "")
		send "L "
		waitfor "How many mines do you want"
		if ($_Limps  = "Max")
			getText CURRENTLINE $buy "(Max" ")"
			send $buy & "* "
		else
			send $buy $_Limps & "* "
		end
		waitfor "<Hardware Emporium>"
	end
	#=============================================== PURCHASE ARMIDS
	if ($_Mines  <> "")
		send "M "
		setVar $buy 0
		waitfor "How many mines do you"
		if ($_Mines  = "Max")
			getText CURRENTLINE $buy "(Max" ")"
			send $buy & "* "
		else
			send $_Mines & "* "
		end
		waitfor "<Hardware Emporium>"
	end
	#=============================================== PURCHASE PHOTONS
	if ($_Photon  <> "")
		setTextTrigger canhouse :canhouse "How many Photon Missiles do you want"
		setTextTrigger canthouse :canthouse "<Hardware Emporium> So what are you looking for"
		send "P "
		pause
		:canhouse
			killAllTriggers
			if ($_Photon  = "Max")
				getText CURRENTLINE $buy "(Max" ")"
				send $buy & "* "
			else
				send $_Photon & "* "
			end
			waitfor "<Hardware Emporium>"
		:canthouse
			killAllTriggers
	end
	#=============================================== PURCHASE LRSCAN
	if ($_LRScan  <> "")
		setTextTrigger CanBuyLRScan		:CanBuyLRScan "Which would you like?"
		setTextTrigger CantBuyLRScan	:CantBuyLRScan "<Hardware Emporium> So what are you looking for"
		send "R "
		pause
		:CanBuyLRScan
			killAllTriggers
			send "h"
			waitfor "<Hardware Emporium>"
		:CantBuyLRScan
			killAllTriggers
	end
	#=============================================== PURCHASE DISRUPTORS
	if ($_Disrupt  <> "")
		send "S "
		waitfor "How many Mine Disruptors do you want"
		if ($_Disrupt  = "Max")
			getText CURRENTLINE $buy "(Max" ")"
			send $buy & "* "
		else
			send $_Disrupt & "* "
		end
		waitfor "<Hardware Emporium>"
	end
	#=============================================== PURCHASE GEN TORPS
	if ($_GenTorp  <> "")
		send "T "
		waitfor "How many Genesis Torpedoes do you want"
		if ($_GenTorp  = "Max")
			getText CURRENTLINE $buy "(Max" ")"
		else
			setVar $buy $_GenTorp
		end
		send $buy & "* "
		waitfor "<Hardware Emporium>"
	end
	#=============================================== PURCHASE TWARP DRIVE
	if ($_T2Twarp  <> "")
		send "W "
		setTextTrigger canTwarp :canTwarp "Which would you like? (1/2/U/Quit)"
		setTextTrigger cantTwarp :cantTwarp "<Hardware Emporium> So what are you looking for"
		pause
		:canTwarp
			killTrigger canTwarp
			if ($player~twarp_type = 1)
				send "U "
			else
				send "2 "
			end
			pause
		:cantTwarp
			killAllTriggers
	end
	#=============================================== SHIP YARD
	if (($_Holds <> "") OR ($_Figs <> "") OR ($_Shields <> ""))
		send "q s p "
		waitfor "Which item do you wish to buy?"
		#=============================================== SHIP YARD
		if ($_Holds  = "Max")
			send "?"
			waitfor "A  Cargo holds     : "
			getWord CURRENTLINE $_Holds 10
			isNumber $tst $_Holds
			if ($tst <> 0)
				send "A " & $_Holds & "* y "
			end
		elseif ($_Holds <> "")
			send "A "
			waitfor "How many Cargo Holds do you want installed?"
			send $_Holds & "* y "
		end
 		if ($_Figs = "Max")
			send "B "
			waitfor "How many K-3A fighters do you want to buy"
			getWord CURRENTLINE $_Figs 11
			stripText $_Figs ")"
			send $_Figs & "* "
		elseif ($_Figs <> "")
			send "B "
			waitfor "How many K-3A fighters do you want to buy"
			send $_Figs & "* "
		end
		if ($_Shields = "Max")
			send "C "
			waitfor "How many shield armor points do you want to buy"
			getWord CURRENTLINE $_Shields 12
			stripText $_Shields ")"
			send $_Shields & "*"
		elseif ($_Shields <> "")
			send "C "
			waitfor "How many shield armor points do you want to buy"
			send $_Shields & "*"
		end
	end
	return

:LockTow
	:TryLockAgain
	setVar $player~turns_Req2Tow 0
	send "W"
	setTextTrigger DoTow 		:DoTow "Do you wish to tow a manned ship? "
	setTextLineTrigger BeamOff	:BeamOff "You shut off your Tractor Beam"
	pause

    :BeamOff
    	killAllTriggers
    	goto :TryLockAgain

	:DoTow
		if ($player~current_sector < 10)
			setVar $TowingPadded $_Tow & "     " & $player~current_sector
		elseif ($player~current_sector < 100)
			setVar $TowingPadded $_Tow & "    " & $player~current_sector
		elseif ($player~current_sector < 1000)
			setVar $TowingPadded $_Tow & "   " & $player~current_sector
		elseif ($player~current_sector < 10000)
			setVar $TowingPadded $_Tow & "  " & $player~current_sector
		else
			setVar $TowingPadded $_Tow & " " & $player~current_sector
		end
		send "N"
		killAllTriggers
		setTextLineTrigger NoShips	:NotHere "You do not own any other ships in this sector!"
		setTextTrigger ShipScan		:ShipScan $TowingPadded
   		setTextTrigger NotHere		:NotHere "Choose which ship to tow "
		pause

        :NotHere
        killAllTriggers
        send "Q* "
        send "'{" $BOT~bot_name "} " & $TagLineB & " - Ship To Be Towed Not Found**"
        halt

        :ShipScan
        killAllTriggers
        send $_Tow & "**"
		setTextTrigger PWProtected		:PWProtected "Enter the password for "
		setTextLineTrigger TurnsReq		:TowEngaged "It will now cost you "
		pause
		    :PWProtected
	    	killAllTriggers
	    	send " *  * "
	    	send "'{" $BOT~bot_name "} " & $TagLineB & " - Cannot Tow A Ship With A Set Password**"
	    	halt

			:TowEngaged
			killAllTriggers
			getText CURRENTLINE $player~turns_Req2Tow "cost you " " turns"
			stripText $player~turns_Req2Tow " "
			isNumber $tst $player~turns_Req2Tow
			if ($tst = 0)
				send "'{" $BOT~bot_name "} " & $TagLineB & " - Unable to Ascertain Turns Required.**"
				halt
			end

		return

:DoXport
	setVar $msg ""
	killtrigger det_trg1
	killtrigger det_trg2
	killtrigger det_trg3
	killtrigger det_trg4
	killtrigger det_trg5
	killtrigger det_trg6
	killtrigger det_trg7
	setTextLineTrigger det_trg1	:xport_notavail "That is not an available ship."
	setTextLineTrigger det_trg2	:xport_badrange "only has a transport range of"
	setTextLineTrigger det_trg3	:xport_security "SECURITY BREACH! Invalid Password, unable to link transporters."
	setTextLineTrigger det_trg4	:xport_noaccess "Access denied!"
	setTextLineTrigger det_trg5	:xport_xprtgood "Security code accepted, engaging transporter control."
	setTextLineTrigger det_trg6	:xport_go_ahead "Landing on Federation StarDock."
     # Send the macro
     send "qqq  z  n  x    " & $shipnum & "    *    *    *    p  s"
     pause
     return

     :xport_notavail
     setVar $msg "Incorrect Ship Number!*"
     pause

     :xport_badrange
     setVar $msg "Ship Is Out Of Export Range*"
     pause

     :xport_security
     setVar $msg "Cannot Export to Password Protected Ship*"
     pause

     :xport_noaccess
     setVar $msg "Unable to Access Ship*"
     pause

     :xport_xprtgood
     setVar $msg "Export Success!*"
     pause

     :xport_go_ahead
	 setTextLineTrigger det_trg7 	:xport_scrub "A port official runs up to you as you dock and informs you that"
	 setTextTrigger det_trg8		:xport_docked "<StarDock> Where to? (?="
	 pause
     :xport_scrub
     send " y"
     pause
     :xport_docked
     killAllTriggers
     send "'{" $BOT~bot_name "} " & $TagLineB & " - " & $msg
     return

:DoTwarp
	setVar $msg ""
	if ($TwarpTo > 0)
		send "mz" & $TwarpTo " * "
		setTextTrigger there        :adj_warp "You are already in that sector!"
		setTextLineTrigger adj_warp :adj_warp "Sector  : " & $TwarpTo & " "
		setTextTrigger locking      :locking "Do you want to engage the TransWarp drive?"
		setTextTrigger igd          :twarpIgd "An Interdictor Generator in this sector holds you fast!"
		setTextTrigger noturns      :twarpPhotoned "Your ship was hit by a Photon and has been disabled"
		setTextTrigger noroute      :twarpNoRoute "Do you really want to warp there? (Y/N)"
		pause
		:adj_warp
			killAllTriggers
			send "z*"
			goto :twarp_adj
		:locking
			killAllTriggers
			send "y"
			setTextLineTrigger twarp_lock 		:twarp_lock "TransWarp Locked"
			setTextLineTrigger no_twrp_lock 	:no_twarp_lock "No locating beam found"
			setTextLineTrigger twarp_adj 		:twarp_adj "<Set NavPoint>"
			setTextLineTrigger no_fuel 			:twarpNoFuel "You do not have enough Fuel Ore"
			pause
		:twarpNoFuel
			killAllTriggers
			setVar $msg "Not enough fuel for T-warp."
			goto :twarpDone

		:twarp_adj
			killAllTriggers
			send " * p s"
			goto :twarpDone

		:twarpNoRoute
			killAllTriggers
			send "n* z* "
			setVar $msg "No route available!"
			goto :twarpDone

		:no_twarp_lock
			killAllTriggers
			send "n* z* "
			setVar $msg "No fighter Deployed, cannot Twarp"
			goto :twarpDone

		:twarpIgd
			killAllTriggers
			setVar $msg "My ship is being held by Interdictor!"
			goto :twarpDone

		:twarpPhotoned
			killAllTriggers
			setVar $msg "I have been photoned and can not T-warp!"
			goto :twarpDone

		:twarp_lock
			KillAlltriggers
			if ($player~alignment >= 1000)
				send "y * * p s g y g q "
			else
				send "y  *  *  m " & STARDOCK & " *  *  p s g y g q "
			end
		:twarpDone
			if ($msg <> "")
				send "'{" $BOT~bot_name "} Twarp Error - " & $msg & "**"
			end
	end
	return

:DoShipTowedCheck
	if (STARDOCK < 10)
		setVar $SellingShip $_Tow & "     " & STARDOCK
	elseif (STARDOCK < 100)
		setVar $SellingShip $_Tow & "    " & STARDOCK
	elseif (STARDOCK < 1000)
		setVar $SellingShip $_Tow & "   " & STARDOCK
	elseif (STARDOCK < 10000)
		setVar $SellingShip $_Tow & "  " & STARDOCK
	else
		setVar $SellingShip $_Tow & " " & STARDOCK
	end

	send "S S"
	setTextLineTrigger Nothing2Sell		:Nothing2Sell "You do not own any other ships orbiting the Stardock!"
	setTextLineTrigger Something2Sell	:Something2Sell $SellingShip
	setTextTrigger NotInList			:NotInList "Choose which ship to sell "
	pause

	:NotInList
	killAllTriggers
	send "Q"
	:Nothing2Sell
	killAllTriggers
	send "Q/"
	waitfor "(?="
	send "'{" $BOT~bot_name "} Tow Error - Ship Wasn't Towed!**"
	halt

	:Something2Sell
	killAllTriggers
	send "QQ"
	return

:GetPassWord
	send "co"
	setTextTrigger PLine :PLine "tell it to.  Your last password was : "
	pause
	:PLine
	killAllTriggers
	setVar $currentline CURRENTLINE & ""
    getText $currentline $pass ": " ""

	if ($pass <> "")
		send $pass
	end

	send "*"

	setTextTrigger MakeCorp		:MakeCorp "Should this be a (C)orporate ship or (P)ersonal ship? "
	setTextTrigger NotAnOption	:NotAnOption "Computer command [TL="
	pause
	:MakeCorp
	killAllTriggers
	send "C"
	:NotAnOption
	killAllTriggers
	send " Q "

	return

:CommaSize
	if ($CashAmount < 1000)
		#do nothing
	elseif ($CashAmount < 1000000)
    	getLength $CashAmount $len
		setVar $len ($len - 3)
		cutText $CashAmount $tmp 1 $len
		cutText $CashAMount $tmp1 ($len + 1) 999
		setVar $tmp $tmp & "," & $tmp1
		setVar $CashAmount $tmp
	elseif ($CashAmount <= 999999999)
		getLength $CashAmount $len
		setVar $len ($len - 6)
		cutText $CashAmount $tmp 1 $len
		setVar $tmp $tmp & ","
		cutText $CashAmount $tmp1 ($len + 1) 3
		setVar $tmp $tmp & $tmp1 & ","
		cutText $CashAmount $tmp1 ($len + 4) 999
		setVar $tmp $tmp & $tmp1
		setVar $CashAmount $tmp
	end
	return



:PadItemCosts
	getLength $PadThisCost $len

	if ($len = 1)
		setVar $PadThisCost "      " & $PadThisCost
	elseif ($len = 2)
		setVar $PadThisCost "     " & $PadThisCost
	elseif ($len = 3)
		setVar $PadThisCost "    " & $PadThisCost
	elseif ($len = 4)
		setVar $PadThisCost "   " & $PadThisCost
	elseif ($len = 5)
		setVar $PadThisCost "  " & $PadThisCost
	elseif ($len = 6)
		setVar $PadThisCost " " & $PadThisCost
	else

	end
	return


:FindJumpSector
	setVar $i 1
	setVar $RED_adj 0

	while (SECTOR.WARPSIN[STARDOCK][$i] > 0)
		setVar $RED_adj SECTOR.WARPSIN[STARDOCK][$i]
		send "m " & $RED_adj & "* y"
		setTextTrigger TwarpBlind 			:TwarpBlind "Do you want to make this jump blind? "
		setTextTrigger TwarpLocked			:TwarpLocked "All Systems Ready, shall we engage? "
		setTextLineTrigger TwarpVoided		:TwarpVoided "Danger Warning Overridden"
		setTextLineTrigger TwarpAdj			:TwarpAdj "<Set NavPoint>"
		pause
		:TwarpAdj
		killAllTriggers
		send " * "
		return

		:TwarpVoided
		killAllTriggers
		send " N N "
		goto :TryingNextAdj

		:TwarpLocked
		killAllTriggers
		send " N "

		goto :SectorLocked

		:TwarpBlind
		killAllTriggers
		send " N "

		:TryingNextAdj
    	add $i 1
	end

	:NoAdjsFound
		setVar $RED_adj 0
		return

	:SectorLocked
		return

:ig_turn_it_on
	killalltriggers
	setVar $ig_mode 0
	setTextTrigger no_ig_trigger :no_ig_available "is not equipped with an Interdictor Generator!"
	setTextTrigger no_ig_beam    :no_ig_beam "Beam to what sector? (U=Upgrade Q=Quit)"
	setTextTrigger no_ig_cby     :no_ig_cby "ARE YOU SURE CAPTAIN? (Y/N)"
	setTextTrigger need_ig       :ig_was_off "Your Interdictor generator is now OFF"
	setTextTrigger ig_fine       :ig_was_on "Your Interdictor generator is now ON"
	setTextTrigger do_ig         :do_ig_thing "Do you wish to change it? (Y/N)"
	send " b"
	pause

	:no_ig_available
   	Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - No IG available on this ship.**"
	return

	:no_ig_beam
	send " Q "
	Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - Cannot turn IG On, Incorrect Prompt.**"
	return

	:no_ig_cby
	send " Q Q Q Z N "
	waitfor "(?="
	goto :ig_turn_it_on

	:ig_was_on
	setVar $ig_mode 1
	pause

	:ig_was_off
	setVar $ig_mode 0
	pause

:do_ig_thing
	killAllTriggers
	if ($ig_mode = 0)
		send "Y"
		Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " - IG On!**"
	else
		send "N"
	end
	return


:TurnsDetect
	send "i"
	setTextLineTrigger TurnsDetect_NoTurns		:TurnsDetect_NoTurns	"Total Holds    :"
	setTextLineTrigger TurnsDetect_GotTurns		:TurnsDetect_GotTurns	"Turns left     : Unlimited"
	pause
	:TurnsDetect_NoTurns
	killAllTriggers
	setVar $UNLIM FALSE
	waitfor "(?="
	return
    :TurnsDetect_GotTurns
    killAllTriggers
	setVar $UNLIM TRUE
	waitfor "(?="
	return

:TurnsRequired
	send "i"
	setTextLineTrigger TurnsRequired_TPW	:TurnsRequired_TPW "Turns to Warp  : "
	pause

	:TurnsRequired_TPW
	killAllTriggers
	getWord CURRENTLINE $player~turnsRequired_TPW 5

	if ($RED_adj > 0)
		# twarp to jmp sector, then into SD sect, then twarp home
		setVar $player~turnsRequired_temp ($player~turnsRequired_TPW * 3)
		if ($_Tow > 0)
			# 2 Turns for exporting into other ship and back again
			add $player~turnsRequired_temp 2
			# 3 Turns for initial Port then x into other ship, port & shop, then x and report
			#   b4 heading home
			add $player~turnsRequired_temp 3
		else
			add $player~turnsRequired_temp 1
		end
	else
		setVar $player~turnsRequired_temp ($player~turnsRequired_TPW * 2)
		# 1 Turn to port at dock
		add $player~turnsRequired_temp 1
	end

	setVar $player~turnsRequired $player~turnsRequired_temp
	return


	#=----------------------------------------------------------------------------------------------------------------
:BuyShip
	cuttext $_Trickster $SelectedShip 1 1
	if ($SelectedShip = "+")
		cuttext $_Trickster $SelectedShip 1 2
	end
	stripText $SelectedShip " "
	stripText $SelectedShip "^"

	send "S B N Y " & $SelectedShip & "Y"
	setTextLineTrigger NotEnoughCash	:NotEnoughCash "You can not afford it!"
	setTExtLineTrigger NotEnoughEXP		:NotEnoughEXP "Hey!  You need at least "
	settextlinetrigger notcommished     :notcommished "Hey!  You're not commissioned by the Federation to fly the"
	setTextTrigger MakeShipCorp			:MakeShipCorp "Should this be a (C)orporate ship or (P)ersonal ship?"
	setTextLineTrigger NameTheShip		:NameTheShip "What do you want to name this ship?"
	setTextLineTrigger ShipsBoughtOut	:ShipsBoughtOut "Well if that don't beat all, looks like we don't have anymore ships"
	pause
	:ShipsBoughtOut
		killAllTriggers
		send " * Q Q "
		waitfor "<StarDock> Where to?"
		send "'{" $BOT~bot_name "} " & $TagLineB & " - The Maximum Allowable Number of Ships Has Been Reached!**"
		setVar $NewShipNumber 0
		return
	:NotEnoughEXP
		killAllTriggers
		send " Q Q "
		waitfor "<StarDock> Where to?"
		send "'{" $BOT~bot_name "} " & $TagLineB & " - Not Enough Experience To Buy Ship**"
		setVar $NewShipNumber 0
		return
	:notcommished
		killAllTriggers
		send " Q Q "
		waitfor "<StarDock> Where to?"
		send "'{" $BOT~bot_name "} " & $TagLineB & " - Need fed commision to purchase this ship**"
		setVar $NewShipNumber 0
		return

	:NotEnoughCash
		killAllTriggers
		send " Q Q "
		waitfor "<StarDock> Where to?"
		send "'{" $BOT~bot_name "} " & $TagLineB & " - Purchase Failed, Unknown Reason (maybe not enough cash)!**"
		setVar $NewShipNumber 0
		return

    :MakeShipCorp
    	send "C"
		pause
	:NameTheShip
		killAllTriggers
		getRnd $RegistryNumber 100000 999999
		send "LSDREG#" & $RegistryNumber & "*N * S"
		setTextLineTrigger PurchasedFailed 		:PurchasedFailed "You do not own any other ships orbiting the Stardock!"
		setTextLineTrigger GetNewShipNumber		:GetNewShipNumber " " & STARDOCK & " " & "LSDREG#" & $RegistryNumber
		setTextTrigger GotNewShipNumber			:GotNewShipNumber "Choose which ship to sell "
		pause

	:PurchasedFailed
		killAllTriggers
		send " Q "
		waitfor "<StarDock> Where to?"
		send "'{" $BOT~bot_name "} " & $TagLineB & " - Purchase Failed**"
		setVar $NewShipNumber 0
		return
	:GotNewShipNumber
		killAllTriggers
		#send " Q "
		send " Q Q Q Z N * X   " & $NewShipNumber & "*  *  P S S R Y " & $CustomShipName & "* Y Q "
		waitfor "<StarDock> Where to?"
		echo "**" & ANSI_14 & "Purchase Success" & ANSI_15 & " - New Ship Number is " & ANSI_7 & $NewShipNumber & "**"
		return

	:GetNewShipNumber
		killTrigger GetNewShipNumber
		killTrigger PurchasedFailed
		setVar $CURLINE CURRENTLINE
		getWordPos $CURLINE $pos " " & STARDOCK
		if ($pos = 0)
			send " Q "
			waitfor "<StarDock> Where to?"
			echo "**" & ANSI_14 & "No Ship" & ANSI_15 & " - Purchase Failed**"
			halt
		end
		cutText $CURLINE $NewShipNumber 1 $pos
		stripText $NewShipNumber " "
		pause


:CN1_AND_CN9_CHECKING
	#=---------------- CN1 Check ---------------------------------
	# Done at beginning of script
	#getWordPos CURRENTANSILINE $pos #27
	#if ($pos = 0)
	#	send " c n 1 q q "
	#	waitfor "Command [TL="
	#end
	#=---------------- CN9 Check ---------------------------------
	if ($location = "Command")
		send "?d"
		setTextTrigger ALLKEYS_OFF	:ALLKEYS_OFF "=-=-=-=-=-=-=-="
		setTextTrigger ALLKEY_ON	:ALLKEY_ON "Warps to Sector(s) : "
	else
		send "sn**"
		setTextTrigger ALLKEYS_OFF	:ALLKEYS_OFF "Warps to Sector(s) : "
		setTextTrigger ALLKEY_ON	:ALLKEY_ON "<B> Transporter Control"
	end
	pause
	:ALLKEYS_OFF
	killTrigger ALLKEYS_OFF
	setVar $ALLKEYS_OFF TRUE
	pause
	:ALLKEY_ON
	killAllTriggers
	if ($ALLKEYS_OFF = FALSE)
		send " c n 9 q q"
		waitfor "<Computer deactivated>"
	end
	return


:ParseShipData
	#[]Ship Letter [Ship Name][Cost][ANSI Ship Name]
	delete $Ships_File
	setVar $i 0
	send "S B N Y ?"
	waitfor "Which ship are you interested in "
	setTextLineTrigger NextPage		:NextPage "<+> Next Page"
	:NextPageReset
	setTextLineTrigger Quit2Leave	:Quit2Leave "<Q> To Leave"
	:LineTrigNext
	setTextLineTrigger LineTrig		:LineTrig
	pause
	:NextPage
		killAllTriggers
		add $i 1
		setVar $ShipList[$i] "+"
		setVar $ShipList[$i][1] "This Inidcates"
		setVar $ShipList[$i][2] "Another"
		setVar $ShipList[$i][3] "Page is availble for display"
		send "+"
		waitfor "Which ship are you interested in "
		setTextLineTrigger LineTrig		:LineTrig
		setTextLineTrigger NextPage		:Quit2Leave "<+> Next Page"
		setTextLineTrigger Quit2Leave	:Quit2Leave "<Q> To Leave"
		pause
	:Quit2Leave
		killAllTriggers
		send " Q Q "
		waitfor "<StarDock> Where to? (?="
		delete $tstFile
		setVar $ii 1
		while ($ii <= $i)
			write $Ships_File $ShipList[$ii] & #9 & $ShipList[$ii][1] & #9 & $ShipList[$ii][2] & #9 & $ShipList[$ii][3]
	    	add $ii 1
		end
		return
	:LineTrig
		setVar $temp CURRENTLINE & "@@@"

		if ($temp <> "@@@")
			getWordPos $temp $pos "<"
			if ($pos = 1)
				getWordPos $temp $pos "<Q>"
				if ($pos = 0)
					add $i 1
					GetText $temp $ShipList[$i] "<" ">"
					GetText $temp $ShipList[$i][1] "> " "  "
					GetText $temp $ShipList[$i][2] "  " "@@@"
					stripText $ShipList[$i][2] " "
                    if ($ShipList[$i][2] = "")
                        setvar $ShipList[$i][2] "999,999,999"
                    end

					GetText CURRENTANSILINE  $ShipList[$i][3] "[35m> " "  "
				end
			end
		end
		goto :LineTrigNext

:LoadShipData
	fileExists $test $Ships_File
	if ($test)
		setVar $i 1
		read $Ships_File $Line $i
		while (($Line <> EOF) AND ($i <= $ShipListMax))
			getWordPos $Line $pos #9
			if ($pos <> 2)
				setVar $ShipData_Valid FALSE
				return
			end
			cutText $Line $temp 1 1
			setVar $ShipList[$i] $temp
			cutText $Line $Line2 3 999
			SetVar $Line $line2
			#stripText $Line $temp & #9

			getWordPos $Line $pos #9
			if ($pos = 0)
				setVar $ShipData_Valid FALSE
				return
			end
			cutText $Line $temp1 1 ($pos - 1)
			setVar $ShipList[$i][1] $temp1
			stripText $Line $temp1 & #9

			getWordPos $Line $pos #9
			if ($pos = 0)
				setVar $ShipData_Valid FALSE
				return
			end
			cutText $Line $temp2 1 ($pos - 1)
			setVar $ShipList[$i][2] $temp2
			stripText $Line $temp2 & #9

			setVar $ShipList[$i][3] $Line

	        :NextRealLine
	        add $i 1
	        read $Ships_File $Line $i
		end
		setVar $ShipData_Valid TRUE
	else
		setVar $ShipData_Valid FALSE
	end
	return


include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\player\findjumpsector\player"
