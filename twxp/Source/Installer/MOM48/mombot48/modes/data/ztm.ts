loadVar $switchboard~bot_name
gosub :BOT~loadVars

#HELP FILE
		setVar $BOT~help[1]  $BOT~tab&"   Zero Turn Mapping"
		setVar $BOT~help[2]  $BOT~tab&"  "
		setVar $BOT~help[3]  $BOT~tab&"   ztm {p:n} {s:n} {one} {noreport}"
		setVar $BOT~help[4]  $BOT~tab&"         "
		setVar $BOT~help[5]  $BOT~tab&"   Will resume from PASS and FROMSECTOR if cancelled "
		setVar $BOT~help[6]  $BOT~tab&"         "
		setVar $BOT~help[7]  $BOT~tab&"   {p:n} - Start Pass - n from 0 to 6"
		setVar $BOT~help[8]  $BOT~tab&"   {s:n} - Start Sector - n from 2 to MAXSECTORS"
		setVar $BOT~help[9]  $BOT~tab&"   {one} - Plot to Terra instead of random"
		setVar $BOT~help[10]  $BOT~tab&"   {noreport} - Will not report potenial Class 0s"
		setVar $BOT~help[11] $BOT~tab&"   "
		setVar $BOT~help[12] $BOT~tab&"   Examples:"
		setVar $BOT~help[13] $BOT~tab&"   >ztm p:2 s:400   - Pass 2, sector 400"
		setVar $BOT~help[14] $BOT~tab&"   >ztm one         - Plot to one"
		setVar $BOT~help[15] $BOT~tab&"   >ztm p:0 s:2 one - Start Again, Plot to one"
	   gosub :bot~helpfile




#----- INCLUDES -----
reqRecording



# CREDITS
# -------
# Written by Hammer


# REVISION HISTORY
# ----------------
# 1.0.0 Initial version, Plots a map with no turn usage
# 
#  re-write of Cherokee's as I had reliability issues - stored in ztm_old.ts in the bot archives if this one turns out bad


# --- CHECK LOCATION ---


gosub :PLAYER~quikstats
setVar $location $PLAYER~CURRENT_PROMPT
setVar $startlocation "x"
:checkLocation
	if (($location = "Command") OR ($location = "Citadel") OR ($location = "Computer"))
		if ($location <> "Computer")
			send "C"
			waitFor "Computer command [TL="
		else
			setVar $startlocation "comp"
		end
	else
		send "'{" $switchboard~bot_name "} - ZTM must be started from Command, Computer, or Citadel prompt.*"
	end

if ($location = "Command")
	
	if ($map~stardock = 0)
		send "qvc"
		setTextLineTrigger getBackDock :getBackDock "The StarDock is located in sector"
		pause
		:getBackDock
			killalltriggers
			getWord CURRENTLINE $map~stardock 7
			
			waitFor "Computer command [TL="
	end
end
# --- INIT VARIABLES ---
:initVars
  
	setVar $maxSector SECTORS
	# testing purposes going from 10011 to 10100
	# setVar $maxSector 500

	setVar $forwardi 2
	setVar $backi $maxSector
	# How many paths to do at once.
	setVar $sectorsToFind 40
	setVar $forwardSectors 0

# ADD THESE IN LATER
	loadVar $dztm_resumepass
	loadVar $dztm_resumesectorforward
	
	setVar $bot~user_command_line ($bot~user_command_line & " ")
	setVar $useOne 0
	getWordPos $bot~user_command_line $pos "one"
	if ($pos > 0)
		setVar $useOne 1
	end

	setVar $error 0

	getWordPos $bot~user_command_line $pos "p:"
	if ($pos > 0)
		getText $bot~user_command_line $value "p:" " "
		isNumber $number $value

		if ($number = 1)
			if ($value > 6)
				setVar $error 1
			else
				setVar $dztm_resumepass $value
				saveVar $dztm_resumepass
			end
			
		else
			setVar $error 1
		end
	end

	setVar $sendStats 1
	getWordPos $bot~user_command_line $pos "noreport"
	if ($pos > 0)
		setVar $sendStats 0
		
	end

	if ($error = 1)
		setvar $switchboard~message "Please use format >ztm p:2 s:400*"
		gosub :switchboard~switchboard
		halt
	end

	getWordPos $bot~user_command_line $pos "s:"
	if ($pos > 0)
		getText $bot~user_command_line $value "s:" " "
		isNumber $number $value
		if ($number = 1)
			if ($value < 2) or ($value > SECTORS)
				setVar $error 1
			else
				setVar $dztm_resumesectorforward $value
				saveVar $dztm_resumesectorforward
			end
			
		else
			setVar $error 1
		end
	else
		# Just to be safe we'll take one loop off
		setVar $dztm_resumesectorforward ($dztm_resumesectorforward - $sectorsToFind)
		if ($dztm_resumesectorforward < 2)
			setVar $dztm_resumesectorforward 2
		end

	end

	if ($error = 1)
		setvar $switchboard~message "Please use format >ztm p:2 s:400*"
		gosub :switchboard~switchboard
		halt
	end

	if ($dztm_resumesectorforward > 0)
		setVar $forwardi $dztm_resumesectorforward
	end

	
	
	setVar $warpsCheckedi 0
	setArray $sendReport SECTORS

# --- INIT PROGRAM ---
:init
	send "V0*YY"
	waitFor "Computer command [TL="
	gosub :PLAYER~quikstats



:start

if ($forwardi > $maxSector)
	setVar $forwardi 2
end
if ($dztm_resumepass = 7)
	
	setVar $msg "ZTM Appears to be complete, use >ztm p:0 s:2 to reset*"
	setvar $switchboard~message $msg
	gosub :switchboard~switchboard
	if ($startlocation <> "comp")
		send "q"
	end
	halt
else

	setVar $msg "Starting ZTM from Pass: " & $dztm_resumepass & " Sector: " & $forwardi & "*"
	setvar $switchboard~message $msg
	gosub :switchboard~switchboard
end


	

	setVar $forwardSectorsFound 0
	setVar $letsLook 1
	setVar $donePasses 0

	while ($letsLook = 1)

		:resumePasses
		while ($forwardSectorsFound < $sectorsToFind)
			
			if (SECTOR.WARPCOUNT[$forwardi] = $dztm_resumepass)
				add $forwardSectorsFound 1
				setVar $forwardSectors[$forwardSectorsFound] $forwardi
				echo "Checking: " $forwardi " has " SECTOR.WARPCOUNT[$forwardi] " looking for " $dztm_resumepass "*"
				add $warpsCheckedi 1
			else
				echo "Skip: " $forwardi " has " SECTOR.WARPCOUNT[$forwardi] " looking for " $dztm_resumepass "*"
			end
			
			add $forwardi 1
			if ($forwardi > $maxSector)
				
				if ($dztm_resumepass < 7)
					# Start Next Pass
					add $dztm_resumepass 1
					saveVar $dztm_resumepass

					setVar $forwardi 2
					if ($dztm_resumepass = 7)
						setVar $letsLook 0
					end
				elseif ($dztm_resumepass = 7)
					setVar $letsLook 0
				end
				goto :breakoutSearch
			end
		end
		:breakoutSearch
		
		
		setVar $i 1
		while ($i <= $forwardSectorsFound)
			gosub :checkConnection
			if ($dztm_resumepass > 0)
				setVar $y 1
				while ($y <= SECTOR.WARPCOUNT[$forwardSectors[$i]])
					send "v" SECTOR.WARPS[$forwardSectors[$i]][$y] "*"
					add $y 1
				end
				
			end

			setVar $otherSector $maxSector
			subtract $otherSector $forwardSectors[$i] 
			if ($useOne = 1)
				send "f" $forwardSectors[$i] "*1**"
			else
				send "f" $forwardSectors[$i] "*" $otherSector "**"
			end

			if ($dztm_resumepass > 0)
				send "v0*yy"
			end
			add $i 1
		end
		
		goSub :waitForComplete

		# Check Stats

		if ($sendStats = 1) and ($warpsCheckedi > 200)

			setVar $i 1
			setVar $warpsCheckedi 0
			while ($i <= SECTORS)

				if (SECTOR.WARPCOUNT[$i] = 6)

					if (SECTOR.BACKDOORCOUNT[$i] > 0)
						if ($sendReport[$i] = 0)
							setVar $sendReport[$i] 1
							if ($i <> $map~stardock)
								send "'Potenial Class 0 Sector: " $i " backdoor: " SECTOR.BACKDOORS[$i][1] "*"
							end
						end
					end
				end
				
				add $i 1
			end

		end
		# Remove 
		setVar $dztm_resumesectorforward $forwardi
		saveVar $dztm_resumesectorforward
	
		setVar $forwardSectorsFound 0
		setVar $forwardSectors 0

		
	end
	
	
	### CHECK BACKDOORS
	setVar $donePasses 1
	setVar $msg "Checking Backdoors.*"
	setvar $switchboard~message $msg
	gosub :switchboard~switchboard
	
	:resumeBackdoor
	setVar $checki 2
	setVar $forwardSectorsFound 0
	setVar $forwardSectors 0
	setVar $forwardSectorsTo 0
	
	while ($checki < $maxSector)
		

		if (SECTOR.BACKDOORCOUNT[$checki] > 0)
			setVar $check 0
			setVar $checky 1
			while ($checky <= SECTOR.BACKDOORCOUNT[$checki])

				add $forwardSectorsFound 1
				setVar $forwardSectors[$forwardSectorsFound] $checki
				setVar $forwardSectorsTo[$forwardSectorsFound] SECTOR.BACKDOORS[$checki][$checky]

				add $checky 1
			end


		end
		add $checki 1
		if ($forwardSectorsFound >= $sectorsToFind)
			gosub :checkConnection
			setVar $i 1
			while ($i <= $forwardSectorsFound)
				send "f" $forwardSectors[$i] "*" $forwardSectorsTo[$i] "**"
				add $i 1
			end
			setVar $forwardSectorsFound 0
			setVar $forwardSectors 0
			setVar $forwardSectorsTo 0
			send "@"
			waitfor "Average Interval Lag"
			
		end


	end
	
	gosub :checkConnection
	setVar $i 1
	while ($i <= $forwardSectorsFound)
		
		send "f" $forwardSectors[$i] "*" $forwardSectorsTo[$i] "**"
		
		add $i 1
	end
	setVar $forwardSectorsFound 0
	setVar $forwardSectors 0
	setVar $forwardSectorsTo 0
	goSub :waitForComplete

	

	if ($startlocation <> "comp")
		send "q"
	end
	setVar $msg "Ztm is Complete!*"
	setvar $switchboard~message $msg
	gosub :switchboard~switchboard

halt

		
:waitForComplete
	killalltriggers
	setDelayTrigger     timeout :timeout 		90000
	setTextLineTrigger  finishedPaths :finishedPaths	"Average Interval Lag"
	send "@"
	pause
	
	:timeout
		killtrigger finishedPaths
		goSub :waitForSafeResume

		setVar $forwardSectorsFound 0
		if ($donePasses = 1)
			goto :resumeBackdoor
		else
			# go back a bit ot make sure we don't miss any warps
			subtract $forwardi 100
			if ($forwardi < 2)
				setVar $forwardi 2
			end
			goto :resumePasses
		end
		halt
	:finishedPaths
		killtrigger timeout
		#waitfor "�PlScn"
return

:waitForSafeResume
	setVar $TagLine				"[ZTM]"
	setVar $TagLineB			"[ZTM]"
	killAllTriggers
	Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Disconnected **"
	:Disco_Test
	if (CONNECTED <> TRUE)
		setDelayTrigger		Emancipate_CPU		:Emancipate_CPU 3000
		Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Auto Resume Initiated - Awaiting Connection!**"
		pause
		:Emancipate_CPU
		goto :Disco_Test
	end
	waitfor "(?="
	setDelayTrigger		WaitingABit		:WaitingABit	10000
	Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Connected - Will resume in 10 seconds**"
	pause
	:WaitingABit
	killAllTriggers
	gosub :PLAYER~quikstats
	setVar $location $PLAYER~CURRENT_PROMPT
	
	if ($location = "Command")
		send "c"
		waitfor "<Computer activated>"
		setvar $switchboard~message $TagLineB&" - Restarting!*"
		gosub :switchboard~switchboard
		return
	elseif ($location = "Citadel")
		setvar $switchboard~message $TagLineB&" - Restarting!*"
		gosub :switchboard~switchboard
		send "c"
		waitfor "<Computer activated>"
		return
	else
		setvar $switchboard~message $TagLineB&" - Connection returned but wrong prompt - halting.."
		gosub :switchboard~switchboard
		halt
	end

return

:checkConnection
	if (CONNECTED <> TRUE)
		halt
	end
	
return
	#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
