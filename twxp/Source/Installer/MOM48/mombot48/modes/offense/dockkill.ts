	logging off
		gosub :BOT~loadVars
									

	setVar $BOT~help[1]  $BOT~tab&"Scans for targets and autokills in sector."
	setVar $BOT~help[2]  $BOT~tab&"         "
	setVar $BOT~help[3]  $BOT~tab&"  Options: "
	setVar $BOT~help[4]  $BOT~tab&"      {off} - Turns off script "
	setVar $BOT~help[5]  $BOT~tab&"      {pod} - Only shoots pods"
	setVar $BOT~help[6]  $BOT~tab&"     {meat} - meatgrinder mode"
	setVar $BOT~help[7]  $BOT~tab&"      {cap} - capture instead of kill"
	setVar $BOT~help[8]  $BOT~tab&"       {dt} - doubletap mode"
	setVar $BOT~help[9]  $BOT~tab&"       {sg} - shotgun mode"
	setVar $BOT~help[10] $BOT~tab&" {defender} - pops a planet before attacking"
	gosub :bot~helpfile

	setVar $BOT~script_title "Dock Killer"
	gosub :BOT~banner
	gosub :combat~init 
	setVar $SWITCHBOARD~self_command TRUE
	

	gosub :PLAYER~quikstats	
	setVar $startingLocation $PLAYER~CURRENT_PROMPT

	getWordPos $BOT~user_command_line $pos "pod"
	if ($pos > 0)
		setVar $pods TRUE
	else
		setVar $pods FALSE
	end

	getWordPos $BOT~user_command_line $pos "cap"
	if ($pos > 0)
		setVar $cap TRUE
	else
		setVar $cap FALSE
	end

	getWordPos $BOT~user_command_line $pos "meat"
	if ($pos > 0)
		setVar $meatgrind TRUE
	else
		setVar $meatgrind FALSE
	end

	getWordPos $BOT~user_command_line $pos "def"
	if ($pos > 0)
		setVar $combat~defender TRUE
		if ($player~genesis <= 0)
			setVar $SWITCHBOARD~message "You have to have genesis torps to run defender mode.*"
			gosub :switchboard~switchboard
			halt			
		end
	else
		setVar $combat~defender FALSE
	end

	setVar $PLAYER~targetingPerson FALSE
	if ($pods)
		setVar $PLAYER~targetingShip "Escape Pod"
	else 
		setVar $PLAYER~targetingShip FALSE
	end
	setVar $PLAYER~targetingCorp FALSE
	setVar $PLAYER~target ""
	loadvar $ship~ship_fighters_max
	loadvar $ship~ship_max_attack
	loadvar $ship~max_shields


	loadvar $ship~CAP_FILE	
	fileExists $CAP_FILE_chk $ship~CAP_FILE
	if ($CAP_FILE_chk)
		gosub :ship~loadshipinfo
	else
		gosub :ship~getShipCapStats
		gosub :ship~loadShipInfo
	end 

	if ($bot~parm1 = "off")
		send "'{" $SWITCHBOARD~bot_name "} - Shutting down dockkill..*"
		if ($player~current_sector = STARDOCK)
			send "p ss ys *p"
			send "'{" $SWITCHBOARD~bot_name "} - Should be on dock.*"
		end
		if ($player~current_sector = "1")
			send "p ty"
			send "'{" $SWITCHBOARD~bot_name "} - Should be on port.*"
		end
		halt
	else
		if ($startingLocation <> "Command") AND ($startingLocation <> "<StarDock>")
			send "'{" $SWITCHBOARD~bot_name "} - Stardock Killer must be run from the Command or StarDock Prompt*"
			halt
		end
		isNumber $test $bot~parm2
		if ($test)
			if ($bot~parm2 > 0)
				setVar $targetingCorp TRUE
				setVar $target $bot~parm2
			end
		else
			getWordPos $bot~parm2 $pos #34
			if ($pos > 0)	
				setvar $bot~user_command_line $bot~user_command_line&" "
				getText $bot~user_command_line $PLAYER~target " "&#34 #34&" "
				if ($PLAYER~target <> "")
					setVar $PLAYER~targetingPerson TRUE
					lowercase $PLAYER~target
					stripText $bot~user_command_line " "&#34&$PLAYER~target&#34&" "
				else
					setVar $PLAYER~targetingPerson FALSE
				end
			end
		end
		getWordPos $bot~user_command_line $pos "dt"
		if ($pos > 0)
			setVar $PLAYER~doubletap TRUE
		else
			setVar $PLAYER~doubletap FALSE
		end
		getWordPos $bot~user_command_line $pos "sg"
		if ($pos > 0)
			setVar $PLAYER~shotgun TRUE
		else
			setVar $PLAYER~shotgun FALSE
		end
	end		

	if ($ship~ship_max_attack <= 0)
		gosub :SHIP~getshipstats
		savevar $ship~ship_fighters_max
		savevar $ship~ship_max_attack
		savevar $ship~max_shields
	end

	if ($PLAYER~targetingPerson)
		setvar $switchboard~message "StarDock Killer Targeting "&$PLAYER~target&" running in sector "&$PLAYER~current_sector&".*"
	elseif ($PLAYER~targetingCorp)
		setvar $switchboard~message "StarDock Killer Targeting Corp "&$PLAYER~target&" running in sector "&$PLAYER~current_sector&".*"
	else
		setvar $switchboard~message "StarDock Killer running in sector "&$PLAYER~current_sector&".*"
	end
	if ($PLAYER~shotgun)
		setvar $switchboard~message $switchboard~message&"    -  Shotgun mode enabled.*"
	elseif ($PLAYER~doubletap)
		setvar $switchboard~message $switchboard~message&"    -  Doubletap mode enabled.*"
	end
	gosub :switchboard~switchboard

	if (($player~current_sector = 1) or (port.class[$player~current_sector] = 0) or ($player~current_sector = $map~stardock))
		if ($PLAYER~CURRENT_SECTOR = STARDOCK)
			setvar $player~refurbString "P  S G Y G Q s p  b  "&$ship~ship_max_attack&"*  b  "&$ship~ship_max_attack&"*  c  "&$ship~max_shields&"*  q q q "
			if ($startingLocation = "<StarDock>")
				send "s p"
			else
				send "P  S G Y G Q s p"
			end
		else
			setvar $player~refurbString "p  t  b "&$ship~ship_max_attack&"* b "&$ship~ship_max_attack&"* c "&$ship~max_shields&"* q "
			send "p ty"
		end
		waitOn "B  Fighters        :"
		getWord CURRENTLINE $figsToBuy 8
		waitOn "C  Shield Points   :"
		getWord CURRENTLINE $shieldsToBuy 9
		if (($figsToBuy > 0) or ($shieldsToBuy > 0))
			send "b " $figsToBuy "* c " $shieldsToBuy "* "
		end
		gosub :player~quikstats
		if ($PLAYER~CURRENT_SECTOR = STARDOCK)
			send "q q q "
		else
			send "q "
		end
		goto :execute
	end



	:inac
		gosub :PLAYER~quikstats
	:execute
		setdelaytrigger justwait :okaygo 50
		pause
		:okaygo
		goSub :SECTOR~getSectorData
		if (($player~current_sector <= 10) or ($player~current_sector = $map~stardock))
			setvar $i 1
			while ($i <= $sector~realTraderCount)
				setvar $enemy_fighters $player~traders[$i][4]
				setvar $enemy_corp $player~traders[$i][2]
				if (($player~traders[$i][2] = true) and (($player~experience > 1000) or ($player~alignment < 0)) and ($enemy_fighters > ($player~fighters/3)) and ($enemy_corp <> $player~CORP))
					setvar $hide true
					setvar $switchboard~message "Hiding on port, because "&$player~traders[$i]&" is in sector, and I can't touch them. Halting.*"
				end
				add $i 1
			end
		end
		if ($player~fighters < $ship~ship_fighters_max)
			setvar $hide true
			setvar $switchboard~message "Can't refurb fighters, so I'm halting.*"
		end
		if ($hide = true)
			if ($PLAYER~CURRENT_SECTOR = STARDOCK)
				send "P  S G Y G Q s p"
			else
				send "p ty"
			end
			gosub :switchboard~switchboard
			halt
		end
		#set player~refurbString to allow fast refurbing if you have a mac#
		if ($cap)
			goSub :combat~fastCapture
		else
			goSub :combat~fastAttack
		end
		if (($player~isFound = true) and ($meatgrind = true))
			send $combat~attackString "* " $combat~attackString "* " $combat~attackString "* " $combat~attackString "* " $combat~attackString "* " $combat~attackString "* " $combat~attackString "* " $combat~attackString "* " $combat~attackString "* " $combat~attackString "* " $combat~attackString "* " $combat~attackString "* " $combat~attackString "* " $combat~attackString "* " $combat~attackString "* " $combat~attackString "* "
		end
		goto :execute






:Discod
	   	setVar $TagLine				"[Stardock Killer]"
		setVar $TagLineB			"[Stardock Killer]"
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
		setDelayTrigger		WaitingABit		:WaitingABit	3000
		Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Connected - Waiting For Command Prompt!**"
		pause
		:WaitingABit
		killAllTriggers
		gosub :player~quikstats
		if ($player~current_prompt = "Command")
			send ("'{" & $switchboard~bot_name & "} "&$TagLineB&" - Restarting!**")
		    	waitfor "Message sent on sub-space channel"
			goto :inac
		elseif ($player~current_prompt = "Citadel")
			send ("'{" & $switchboard~bot_name & "} "&$TagLineB&" - Restarting!**")
			waitfor "Message sent on sub-space channel"
	   		send "qqqq**"
	   		goto :inac
	   	else
	   		send (" p d 0* 0* 0* * *** * c q q q q q z 2 2 c q * z * *** * * '" & $TagLineB & "Attempting to Reach Correct Prompt...*")
			setTextLineTrigger	EMQ_COMPLETE		:EMQ_DELAY "Attempting to Reach Correct Prompt..."
			setDelayTrigger 	EMQ_DELAY		:EMQ_DELAY 3000
			pause
			:EMQ_DELAY
				killAllTriggers
				goto :Disco_Test
		end

:player~setconnectiontriggers
	killtrigger discod1
	killtrigger discod2
	SetEventTrigger 	Discod1 	:Discod     	"CONNECTION LOST"
	SetEventTrigger		Discod2		:Discod     	"Connections have been temporarily disabled."

return


#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\combat\init\combat"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\sector\getsectordata\sector"
include "source\bot_includes\combat\fastattack\combat"
include "source\bot_includes\combat\fastcapture\combat"
include "source\bot_includes\ship\getshipstats\ship"
include "source\bot_includes\player\setconnectiontriggers\player"
include "source\bot_includes\ship\loadshipinfo\ship"
include "source\bot_includes\ship\getshipcapstats\ship"

