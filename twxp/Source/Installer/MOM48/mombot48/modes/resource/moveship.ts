	gosub :BOT~loadVars


	setVar $BOT~help[1]  $BOT~tab&"Moves empty ships from one sector to another."
	setVar $BOT~help[2]  $BOT~tab&"                "
	setVar $BOT~help[3]  $BOT~tab&"  moveship [sector] {back} {sell} {dep} {"&#34&"ship filter"&#34&"}"
	setVar $BOT~help[4]  $BOT~tab&"                  "
	setVar $BOT~help[5]  $BOT~tab&"   Options:            "
	setVar $BOT~help[6]  $BOT~tab&"        [sector] - target sector"
	setVar $BOT~help[7]  $BOT~tab&"          [back] - will grab ships from target sector and bring"
	setVar $BOT~help[8]  $BOT~tab&"                   them back to current sector   "
	setVar $BOT~help[9]  $BOT~tab&"          [sell] - if moving to stardock, attempt to sell ships"
	setVar $BOT~help[10] $BOT~tab&" ["&#34&"ship filter"&#34&"] - move ships only matching this filter"
	setVar $BOT~help[11] $BOT~tab&"                   "
	setVar $BOT~help[12] $BOT~tab&"             -  Ship filter list can be comma delimited.    "
	setVar $BOT~help[13] $BOT~tab&"             -  Can use either planet or SXX port in        "
	setVar $BOT~help[14] $BOT~tab&"                starting sector for fuel."
	gosub :bot~helpfile

	setVar $BOT~script_title "Ship Mover"
	gosub :BOT~banner


# ============================== START Move Ship (moveship) Sub ==============================
:moveship
:shipmove

	killalltriggers
	gosub :PLAYER~quikstats
	if ($PLAYER~TWARP_TYPE = "No")
		setVar $SWITCHBOARD~message "You need a Transwarp drive to run moveship.*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
	setVar $startSector $PLAYER~CURRENT_SECTOR
	setarray $theShips 1000 
	isNumber $test $bot~parm1
	if ($test)
		if ($bot~parm1 > 0)
			setVar $moveSector $bot~parm1
		else
			setVar $SWITCHBOARD~message "Invalid move sector entered*"
			gosub :SWITCHBOARD~switchboard
			halt
		end
	else
		setVar $SWITCHBOARD~message "Invalid move sector entered*"
		gosub :SWITCHBOARD~switchboard
		halt
	end

	getWordPos $bot~user_command_line $pos "back"
	if ($pos > 0)
		setVar $back TRUE
	else
		setVar $back FALSE
	end


	getWordPos $bot~user_command_line $pos "silent"
	if ($pos > 0)
		setVar $bot~silent_running TRUE
	else
		setVar $bot~silent_running FALSE
	end

	getWordPos $bot~user_command_line $pos "sell"
	if ($pos > 0)
		setVar $sellship TRUE
	else
		setVar $sellship FALSE
	end

	getWordPos $bot~user_command_line $pos "dep"
	if ($pos > 0)
		setVar $dep TRUE
	else
		setVar $dep FALSE
	end

	getWordPos $bot~user_command_line $pos "silent"
	if ($pos > 0)
		setVar $SWITCHBOARD~self_command TRUE
	end
	if ($BOT~silent_running = TRUE)
		setVar $SWITCHBOARD~self_command TRUE
	end

	setvar $filterships ""
	getWordPos $bot~user_command_line $pos #34
	if ($pos > 0)
		getText $bot~user_command_line $filterships #34 #34
		if ($filterships = false)
			setVar $SWITCHBOARD~message "Invalid ship filter entered.*"
			gosub :SWITCHBOARD~switchboard
			halt			
		else
			splitText $filterships $shiptypes ","
			setVar $SWITCHBOARD~message "Moving all ships matching: ["&$filterships&"].*"
			gosub :SWITCHBOARD~switchboard
		end
	end



	setVar $startingLocation $PLAYER~CURRENT_PROMPT
	send "** "
	setVar $fuelInSector FALSE
	if (($startingLocation <> "Citadel") AND ($startingSector <> "Planet"))
		if ($startingLocation = "Command")
			getSectorParameter $PLAYER~CURRENT_SECTOR "BUSTED" $isBusted
			if ((PORT.EXISTS[$PLAYER~CURRENT_SECTOR] = TRUE) AND (PORT.BUYFUEL[$PLAYER~CURRENT_SECTOR] = FALSE) and ($isBusted <> true))
				if ($player~CREDITS < 50000)
					setVar $SWITCHBOARD~message "Need at least 50,000 credits to use port as fuel source*"
					gosub :SWITCHBOARD~switchboard
				end
				setVar $fuelInSector TRUE
			else
				setVar $i 1
				setVar $isFound false
				while (SECTOR.WARPS[$PLAYER~CURRENT_Sector][$i] > 0)
					if (SECTOR.WARPS[$PLAYER~CURRENT_Sector][$i] = $moveSector)
						setVar $isFound TRUE
					end
					add $i 1
				end
				if ($isFound = FALSE)
					setVar $SWITCHBOARD~message "No fuel port in sector, cannot run from Command Prompt*"
					gosub :SWITCHBOARD~switchboard
					halt
				end
			end
		else
			setVar $SWITCHBOARD~message "Must be in Command, Citadel or Planet prompt to run*"
			gosub :SWITCHBOARD~switchboard
			halt
		end
	end

	if ($startingLocation = "Citadel")
		send "s* q "
	end

	setVar $shipCount 0
	if (($startingLocation = "Planet") OR ($startingLocation = "Citadel"))
		gosub :PLANET~GETPLANETINFO
		send "t * l 1 * t * l 2 * t * l 3 * s * l 1 * s * l 2 * s * l 3 * t * t1*m* * * q "
	end
	send "*"
	gosub :PLAYER~quikstats
	setvar $starting_credits $player~credits
	killtrigger PLAYER~getLine2
	setVar $figcnt SECTOR.FIGS.QUANTITY[$startSector]
	setVar $figowner SECTOR.FIGS.OWNER[$startSector]
	if (($figcnt = 0) OR (($figOwner <> "belong to your Corp") AND ($figOwner <> "yours")))
		if (($startingLocation = "Planet") OR ($startingLocation = "Citadel"))
			gosub :PLANET~landingSub
		end
		setVar $SWITCHBOARD~message "No friendly fighters deployed in current sector!*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
	setVar $SWITCHBOARD~message "Ship Mover starting up!  Starting ship scan..*"
	gosub :SWITCHBOARD~switchboard
	if ($back = TRUE)
		if ($startingLocation <> "Command")
			send "l "&$planet~planet&"* t * l 1 * t * l 2 * t * l 3 * s * l 1 * s * l 2 * s * l 3 * t * t1*m* * * q "
		else
			if ($fuelInSector)
				send " p t * * 0 * * 0 * * 0 * * "
			end
		end
		setVar $PLAYER~CURRENT_SECTOR $startSector
		setVar $PLAYER~WARPTO $moveSector
		gosub :player~twarp
		if ($PLAYER~twarpSuccess = FALSE)
			setVar $SWITCHBOARD~message "Can not make it to move sector, shutting down*"
			gosub :SWITCHBOARD~switchboard
			setVar $SWITCHBOARD~message "Not all ships were moved*"
			gosub :SWITCHBOARD~switchboard
			if (($startingLocation = "Planet") OR ($startingLocation = "Citadel"))
				gosub :PLANET~landingSub
			end
			halt
		end
	end
	:tryshipscan
		setTextLineTrigger statlinetrig :shipline "-----------------------------------------------------------------------------"
		setTextLineTrigger towalreadyon :continuetowon "You shut off your Tractor Beam."
		settextlinetrigger enter :enter "[Pause]"
		settexttrigger enter2 :gotShips "Choose which ship to tow (Q=Quit)"
		settexttrigger enter3 :gotships "You do not own any other ships in this sector!"
		send "|w*"
		pause
		:continuetowon
			killtrigger statlinetrig
			killtrigger doneships
			killtrigger enter
			killtrigger enter2
			killtrigger enter3
			goto :tryshipscan
		:enter
			killtrigger statlinetrig
			killtrigger doneships
			killtrigger enter2
			killtrigger enter3
			send "*"
			settextlinetrigger enter :enter "[Pause]"
			pause

	:shipline
		killtrigger towalreadyon
		setVar $line CURRENTLINE
		setvar $shiptype ""
		getWordPos $line $pos "Choose which ship to tow (Q=Quit)"
		getWord $line $temp 1
		getLength $line $length
		if ($length > 54)
			cuttext $line $shiptype 54 999
		end
		lowercase $shiptype

		isNumber $result $temp
		if (($result = TRUE))
			if ($temp > 0)

				if ($filterships <> "")
					setvar $i 1
					setvar $shipfound false
					while ($i <= $shiptypes)
						setvar $testship $shiptypes[$i]
						trim $testship
						getwordpos $shiptype $filterpos $testship
						if ($filterpos > 0)
							setvar $shipfound true
						end
						add $i 1
					end
					if ($shipfound = true)
						add $shipCount 1
						setVar $theShips[$shipCount] $temp
					end
				else
					add $shipCount 1
					setVar $theShips[$shipCount] $temp
				end
			end
		end
		if ($pos > 0)
			killtrigger getLine
			goto :gotShips
		else
			setTextLineTrigger getLine :shipline
			pause
		end


	:gotShips
		send "*|"
		killtrigger statlinetrig
		killtrigger towalreadyon
		killtrigger doneships
		killtrigger getLine
		killtrigger towalreadyon
		killtrigger enter
		killtrigger enter2
		killtrigger enter3
		if ($back = TRUE)
			gosub :PLAYER~quikstats
			setVar $PLAYER~WARPTO $startSector
			gosub :player~twarp
			if ($PLAYER~twarpSuccess = FALSE)
				setVar $SWITCHBOARD~message "Can not make it back home, shutting down*"
				gosub :SWITCHBOARD~switchboard
				if ($i >= $shipCount)
					setVar $SWITCHBOARD~message "All ships were moved*"
					gosub :SWITCHBOARD~switchboard
				else
					setVar $SWITCHBOARD~message "Not all ships were moved*"
					gosub :SWITCHBOARD~switchboard
				end
				gosub :PLANET~landingSub
				halt
			end
		end
		setVar $SWITCHBOARD~message "Found "&$shipCount&" empty ships to move.*"
		gosub :SWITCHBOARD~switchboard
		setVar $i 1
		while ($i <= $shipCount)
			if ($theShips[$i] > 0)
				gosub :PLAYER~quikstats
				if ($startingLocation <> "Command")
					send "l "&$planet~planet&"* t * t1*m* * * q "
				else
					if ($fuelInSector)
						send " p t * * 0 * * 0 * * 0 * * "
					end
				end
				if ($back = FALSE)
					send "w n "&$theShips[$i]&"* "
					setVar $PLAYER~CURRENT_SECTOR $startSector
					setVar $PLAYER~WARPTO $moveSector
					gosub :player~twarp
					if ($PLAYER~twarpSuccess = FALSE)
						setVar $SWITCHBOARD~message "Can not make it to move sector, shutting down*"
						gosub :SWITCHBOARD~switchboard
						setVar $SWITCHBOARD~message "Not all ships were moved*"
						gosub :SWITCHBOARD~switchboard
						if (($startingLocation = "Planet") OR ($startingLocation = "Citadel"))
							gosub :PLANET~landingSub
						end
						halt
					end
					send "w  "
					if (($moveSector = $map~stardock) and ($sellship = true))
						gosub :player~quikstats
						gosub :port~shipsell
						send "q q q * * *"
					end
					setVar $PLAYER~CURRENT_SECTOR $moveSector
					setVar $PLAYER~WARPTO $startSector
					gosub :player~twarp
					if ($PLAYER~twarpSuccess = FALSE)
						setVar $SWITCHBOARD~message "Can not make it back home, shutting down*"
						gosub :SWITCHBOARD~switchboard
						if ($i >= $shipCount)
							setVar $SWITCHBOARD~message "All ships were moved*"
							gosub :SWITCHBOARD~switchboard
						else
							setVar $SWITCHBOARD~message "Not all ships were moved*"
							gosub :SWITCHBOARD~switchboard
						end
						gosub :PLANET~landingSub
						halt
					end
				else
					setVar $PLAYER~CURRENT_SECTOR $startSector
					setVar $PLAYER~WARPTO $moveSector
					gosub :player~twarp
					if ($PLAYER~twarpSuccess = FALSE)
						setVar $SWITCHBOARD~message "Can not make it to move sector, shutting down*"
						gosub :SWITCHBOARD~switchboard
						setVar $SWITCHBOARD~message "Not all ships were moved*"
						gosub :SWITCHBOARD~switchboard
						if (($startingLocation = "Planet") OR ($startingLocation = "Citadel"))
							gosub :PLANET~landingSub
						end
						halt
					end
					send "w n "&$theShips[$i]&"* "
					setVar $PLAYER~CURRENT_SECTOR $moveSector
					setVar $PLAYER~WARPTO $startSector
					gosub :player~twarp
					if ($PLAYER~twarpSuccess = FALSE)
						setVar $SWITCHBOARD~message "Can not make it back home, shutting down*"
						gosub :SWITCHBOARD~switchboard
						if ($i >= $shipCount)
							setVar $SWITCHBOARD~message "All ships were moved*"
							gosub :SWITCHBOARD~switchboard
						else
							setVar $SWITCHBOARD~message "Not all ships were moved*"
							gosub :SWITCHBOARD~switchboard
						end
						gosub :PLANET~landingSub
						halt
					end
					send "w  "
				end
			end
			add $i 1
		end
		if (($startingLocation = "Planet") OR ($startingLocation = "Citadel"))
			gosub :PLANET~landingSub
			if ($dep = true)
				setVar $BOT~command "dep"
				loadVar $MAP~stardock

				if ($bot~silent_running = true)
					setVar $BOT~user_command_line " dep "&($player~credits-$starting_credits)&" silent"
				else
					setVar $BOT~user_command_line " dep "&($player~credits-$starting_credits)
				end
				setVar $BOT~parm1 ($player~credits-$starting_credits)
								saveVar $BOT~parm1
				saveVar $bot~parm1
				saveVar $BOT~command
				saveVar $BOT~user_command_line
				load "scripts\"&$bot~mombot_directory&"\commands\general\dep.cts"
				setEventTrigger		depended		:depended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\general\dep.cts"				
				pause
				:depended

			end
		end
		setVar $SWITCHBOARD~message "All ships moved successfully.*"
		gosub :SWITCHBOARD~switchboard

halt
# ============================== END Move Ship (moveship) Sub ==============================



#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\planet\landingsub\planet"
include "source\bot_includes\player\twarp\player"
include "source\module_includes\port\shipsell\port"
