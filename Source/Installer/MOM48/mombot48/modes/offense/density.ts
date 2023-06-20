	gosub :BOT~loadVars
	gosub :combat~init 


	setVar $BOT~help[1]   $BOT~tab&" density {kill} {escape:#} {photon} {pel} "
	setVar $BOT~help[2]   $BOT~tab&"         {call} {holo} {attack:#}"
	setVar $BOT~help[3]   $BOT~tab&"   - Density scans until it sees ship or planet and "
	setVar $BOT~help[4]   $BOT~tab&"     then performs an action  "
	setVar $BOT~help[5]   $BOT~tab&"             "
	setVar $BOT~help[6]   $BOT~tab&"          {kill} - will kill/holokill "
	setVar $BOT~help[7]   $BOT~tab&"        {escape} - will escape to home sector "
	setVar $BOT~help[8]   $BOT~tab&"      {escape:#} - will escape to sector provided"
	setVar $BOT~help[9]   $BOT~tab&"      {attack:#} - will only photon sector provided"
	setVar $BOT~help[10]  $BOT~tab&"        {photon} - photon sector"
	setVar $BOT~help[11]  $BOT~tab&"          {holo} - holoscan sector and broadcast"
	setVar $BOT~help[12]  $BOT~tab&"         {pgrid} - pgrid in to sector"
	setVar $BOT~help[13]  $BOT~tab&"          {call} - calls saveme"
	setVar $BOT~help[14]  $BOT~tab&"           {pel} - photon, enter, land"
	setVar $BOT~help[15]  $BOT~tab&"         {pel:#} - pel with planet number"
	setVar $BOT~help[16]  $BOT~tab&" {density:value} - only react to density changes of this "
	setVar $BOT~help[17]  $BOT~tab&"                   value or higher. Default is 40."
	setVar $BOT~help[18]  $BOT~tab&"      {killport} - Blows port with macro"
	setVar $BOT~help[19]  $BOT~tab&"                  "
	setVar $BOT~help[20]  $BOT~tab&"      Examples:   "
	setVar $BOT~help[21]  $BOT~tab&"             >density kill call escape:1922"
	setVar $BOT~help[22]  $BOT~tab&"             >density pel density:500"
	setVar $BOT~help[23]  $BOT~tab&"             >density pel:10 "
	setVar $BOT~help[24]  $BOT~tab&"             >density photon holo"
	setVar $BOT~help[25]  $BOT~tab&"             >density pgrid killport kill escape:123"
	gosub :bot~helpfile

#check mines * on portkill
#check plist 
#add kazi option

	setVar $PLAYER~save TRUE

	gosub :player~quikstats
	gosub :ship~getshipstats

	setVar $startingLocation $player~current_prompt
	setArray $adj 7
	setArray $dens 7
	setArray $adjsec 7
	setArray $density 7
	setvar $looking_for_planet false

	if ($startingLocation = "Command")
	elseif ($startingLocation = "Planet")
		gosub :planet~getplanetinfo
		send "q"
	elseif ($startingLocation = "Citadel")
		send "q"
		gosub :planet~getplanetinfo
		send "q"
	elseif ($startingLocation = "<StarDock>")
		send "q"
	else
		setVar $SWITCHBOARD~message "Must be run from Command, Planet, Citadel, or Stardock Prompt.*"
		gosub :SWITCHBOARD~switchboard
		halt
	end

	getWordPos " "&$bot~user_command_line&" " $pos " kill "
	setvar $kill false
	if ($pos > 0)
		setvar $kill true
	end

	getWordPos " "&$bot~user_command_line&" " $pos " holo "
	setvar $holo false
	if ($pos > 0)
		setvar $holo true
		if (CURRENTSCANTYPE <> "Holo")
			setVar $SWITCHBOARD~message "Can't holoscan without a holoscanner.  Duh.*"
			goto :dtorp_end
		end
		if ((CURRENTTURNS <= 0) and ($player~unlimitedGame <> true))
			setVar $SWITCHBOARD~message "Can't holoscan without turns.*"
			goto :dtorp_end
		end
	end

	getWordPos " "&$bot~user_command_line&" " $pos " escape "
	getWordPos " "&$bot~user_command_line&" " $pos2 " escape:"
	setvar $escape false
	if ($pos > 0) or ($pos2 > 0)
		setvar $escape true
		setvar $escape_sector $map~home_sector
		getWordPos $bot~user_command_line $pos "escape:"
		if ($pos > 0)
			getText $bot~user_command_line&" " $escape_sector "escape:" " "
			isNumber $test $escape_sector
			if ($test <> true)
				setVar $SWITCHBOARD~message "Escape sector should be a number.*"
				goto :dtorp_end
			end
		end
		if ($escape_sector = 0)
			setVar $SWITCHBOARD~message "Escape sector is not defined.  Either define when calling, or define home sector.*"
			goto :dtorp_end
		end
	end
	
	getWordPos " "&$bot~user_command_line&" " $pos " attack:"
	setvar $attack false
	if ($pos > 0)
		setvar $attack true
		getText $bot~user_command_line&" " $attack_sector "attack:" " "
		isNumber $test $attack_sector
		if ($test <> true)
			setVar $SWITCHBOARD~message "Attack sector should be a number.*"
			goto :dtorp_end
		end
		if ($attack_sector = 0)
			setVar $SWITCHBOARD~message "Escape sector is not defined.*"
			goto :dtorp_end
		end
	end

	getWordPos " "&$bot~user_command_line&" " $pos " photon "
	setvar $photon false
	if ($pos > 0)
		setvar $photon true
		if ($player~photons <= 0)
			setVar $SWITCHBOARD~message "Without a photon, you can't run photon option.*"
			goto :dtorp_end
		end
	end

	getWordPos " "&$bot~user_command_line&" " $pos " pgrid "
	setvar $pgrid false
	if ($pos > 0)
		setvar $pgrid true
		if ($startingLocation <> "Citadel")
			setVar $SWITCHBOARD~message "Need to start at citadel for pgrid mode.*"
			goto :dtorp_end
		end
	end

	getWordPos " "&$bot~user_command_line&" " $pos " killport "
	setvar $killport false
	if ($pos > 0)
		setvar $killport true
		send "c;q"
		waitFor "Figs Per Attack:"
		getWord CURRENTLINE $SHIP~maxFigAttack 5
	end


	getWordPos " "&$bot~user_command_line&" " $pos " pel "
	getWordPos " "&$bot~user_command_line&" " $pos2 " pel:"
	setvar $pel false
	if ($pos > 0) or ($pos2 > 0)
		setvar $pel true
		setvar $pel_planet 0
		getWordPos $bot~user_command_line $pos "pel:"
		if ($pos > 0)
			getText $bot~user_command_line&" " $pel_planet "pel:" " "

			isNumber $test $pel_planet

			if ($test <> true)
				setVar $SWITCHBOARD~message "Pel planet should be a number.*"
				goto :dtorp_end
			end
		end

		if ($player~photons <= 0)
			setVar $SWITCHBOARD~message "Without a photon, you can't run pel option.*"
			goto :dtorp_end
		end

		if (($pel_planet = 0) and (CURRENTPLANETSCANNER = "Yes"))
			setVar $SWITCHBOARD~message "Pel option can't be run with a planet scanner onboard unless you define a planet number.  Believe me, it'd just be messy.*"
			goto :dtorp_end
		end

	end

	getWordPos " "&$bot~user_command_line&" " $pos " call "
	setvar $call false
	if ($pos > 0)
		setvar $call true
	end

	getWordPos $bot~user_command_line $pos "density:"
	setvar $density_change 40
	if ($pos > 0)
		getText $bot~user_command_line&" " $density_change "density:" " "

		isNumber $test $density_change
		
		if ($test <> true)
			setVar $SWITCHBOARD~message "Density change amount should be a number.*"
			goto :dtorp_end
		end
		if ($density_change > 499)
			setvar $density_upper_limit 99999
		else
			setvar $density_upper_limit 499
		end
	end
	if ($density_change > 499)
		setvar $density_upper_limit 99999
	else
		setvar $density_upper_limit 499
	end

	if ((pgrid <> true) and ($kill <> true) and ($killport <> true) and ($photon <> true) and ($pel <> true) and ($holo <> true) and ($call <> true) and ($escape <> true))
		setvar $photon true
	end
	setVar $message "Density Trigger running in sector "&$player~current_sector&"*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-"
	setVar $message $message&"*        On Density Change >= ("&$density_change&" - "&$density_upper_limit&"), I will:"
	if ($pgrid)
		setVar $message $message&"*          PGRID to Sector"
	end
	if ($kill)
		setVar $message $message&"*          Kill/Holokill"
	end
	if ($killport)
		setVar $message $message&"*          Kill Port"
	end
	if ($photon)
		setVar $message $message&"*          Photon"
	elseif ($pel)
		setVar $message $message&"*          Photon, Enter, Land"
		if ($pel_planet <> 0)
			setVar $message $message&" on Planet "&$pel_planet
		end
	end
	if ($holo)
		setVar $message $message&"*          Holoscan"
	end
	if ($call)
		setVar $message $message&"*          Call Saveme"
	end
	if ($escape)
		setVar $message $message&"*          Escape to Sector "&$escape_sector
	end
	if ($attack)
		setVar $message $message&"*          Only Responding to Sector "&$attack_sector
	end
	setVar $message $message&"*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-**"	
	setvar $switchboard~message $message
	gosub :switchboard~switchboard



:check_dens
	setVar $mm 0
	setVar $i 1
	send "sz*"
	waiton "Relative Density Scan"

:dtorp_Start
	killTrigger alldone
	setvar $attack_sector_found false
	setTextLineTrigger getSec :getSec "Sector"
	setTextTrigger allDone :allDone "Command [TL="
	pause

:getSec
	getText CURRENTLINE $temp "Sector" "==>"
	stripText $temp "("
	stripText $temp ")"
	stripText $temp " "
	if ((($attack = true) and ($temp = $attack_sector)) or ($attack = false))
		if (($attack = true) and ($temp = $attack_sector))
			setvar $attack_sector_found true
		end
		setvar $adj[$i] $temp
		getText CURRENTLINE $Dens[$i] "==>" "Warps :"
		stripText $dens[$i] ","
		stripText $dens[$i] " "
	end
	if ($attack <> true)
		add $i 1
	end
	setTextLineTrigger getSec :getSec "Sector"
	pause
:allDone
	killTrigger getSec
	if (($attack = true) and ($attack_sector_found <> true))
		setvar $switchboard~message "Attack sector is not adjacent.  Try again.*"
		goto :dtorp_end
	end
	gosub :firechk

:letslook
	setVar $w 0

:sublooky
	add $w 1
	if ($w > $i)
		goto :alldone
	elseif ($density[$w] <> $dens[$w])
		setVar $diff ($density[$w] - $dens[$w])
		if (($diff >= $density_change) and ($diff <= $density_upper_limit))
			gosub :do_action
			goto :dtorp_end
		else
			goto :sublooky
		end
	else
		goto :sublooky
	end

:firechk
	setVar $y 1
	send "sz*"
	waiton "Relative Density Scan"

:looky
	killtrigger manual_stop
	killtrigger dtop_dtorp
	killtrigger getsec
	killtrigger alldone
	killtrigger donelook
	setTextLineTrigger getSec :looksec "Sector"
	setTextTrigger donelook :donelook "Command [TL="
	pause

:looksec
	getText CURRENTLINE $temp "Sector" "==>"
	stripText $temp "("
	stripText $temp ")"
	stripText $temp " "
	if ((($attack = true) and ($temp = $attack_sector)) or ($attack = false))
		setvar $adjsec[$y] $temp
		getText CURRENTLINE $Density[$y] "==>" "Warps :"
		stripText $density[$y] ","
		stripText $density[$y] " "
	end
	if ($attack <> true)
		add $y 1
	end
	setTextLineTrigger getSec :looksec "Sector"
	pause

:donelook
	killtrigger getSec
	return

:dtorp_end
	if (($startingLocation = "Planet") OR ($startingLocation = "Citadel"))
		if (($escape <> true) and ($call <> true) and ($photon <> true))
			gosub :planet~landingsub
		end
	end
	gosub :switchboard~switchboard

	halt


:do_action
	if (($photon = true) and ($player~photons > 0))
		if (($startingLocation = "Planet") OR ($startingLocation = "Citadel"))
			send " c  p  y  " $adj[$w] "**q   l " $PLANET~PLANET " * n n * j m * * * j c  *  "
		else
			send " c  p  y  " $adj[$w] "**q   "		
		end
	end
	gosub :player~quikstats

	# #if we pgrid we want to do a different kill action
	if (($pgrid = true) and ($player~fighters > 0))

		if ($player~current_prompt = "Command")
			gosub :planet~landingsub
		end
		setvar $pgrid~pgridSector $adj[$w]
		gosub :pgrid~run
		if ($killport = true)
			send "s*"
			waitfor "Warps to Sector(s)"
			if (PORT.EXISTS[$player~current_sector] = 1)
				if ($player~current_prompt = "Citadel")
					send "q q "
				end
				send "p a y " $ship~maxFigAttack " * * z $ship~maxFigAttack * * "
				if ($player~current_prompt = "Citadel")
					send "l" $planet~planet "* c"
					waitfor "<Enter Citadel>"
				else
					setTextLineTrigger endPortDestroy :endPortDestroy "ou destroyed the Star Port"
					setDelayTrigger endPortTimeout :endPortTimeout 150
					pause
						:endPortTimeout
						:endPortDestroy
						killalltriggers
				end
			end
		end
		if ($kill = true)
			gosub :player~quikstats
			:scanit_again2
			setvar $player~startingLocation $player~current_prompt
			gosub :sector~getSectorData
			if ($sector~realTraderCount > ($sector~corpieCount + $sector~defenderShips))
				goSub :combat~fastCitadelAttack
				goto :scanit_again2
			elseif (($sector~emptyShipCount > $sector~myShipCount))
				gosub :combat~fastCapture
				goto :scanit_again2
			end
		end
	
		if ($escape = true)

			setVar $PLAYER~WARPTO $escape_sector
			gosub :player~quikstats

			if ($player~current_prompt = "Citadel")
				gosub :PLAYER~pwarp
			end
		end
	
	else

		if (($kill = true) and ($player~fighters > 0))
			gosub :player~quikstats
			:scanit_again
			setvar $player~startingLocation $player~current_prompt
			gosub :sector~getSectorData
			if ($sector~realTraderCount > ($sector~corpieCount + $sector~defenderShips))
				gosub :combat~fastAttack
				goto :scanit_again
			elseif (($sector~emptyShipCount > $sector~myShipCount))
				gosub :combat~fastCapture
				goto :scanit_again
			end
			setvar $before_holo_kill_sector $player~current_sector
			gosub :combat~holokill
			if ($player~current_sector <> $before_holo_kill_sector)
				setVar $PLAYER~WARPTO $before_holo_kill_sector
				gosub :PLAYER~twarp
				if (($PLAYER~twarpSuccess = FALSE) and ($player~msg <> "Already in that sector!"))
					setvar $switchboard~message "Could not make it back to starting sector before holokill. - ["&$player~msg&"]*"
					gosub :switchboard~switchboard
				end
			end
		end

		if ($holo = true)
			gosub :holo~run
		end

		if ($pel = true)
			setvar $pel~destination $adj[$w]
			if ($pel_planet = 0) 
				# Fake planet number to make script trigger - no scanners so will still land
				setVar $pel_planet 99999
			end
			setvar $pel~pel_planet $pel_planet
			gosub :pel~run
			halt
		end

		if ($call = true)
			gosub :call~run
		end

		if ($escape = true)
			killalltriggers

			setVar $PLAYER~WARPTO $escape_sector
			if (($startingLocation = "Planet") OR ($startingLocation = "Citadel"))
				gosub :player~quikstats
				if (($player~current_prompt <> "Citadel") and ($player~current_prompt <> "Planet"))
					gosub :planet~landingsub
				end
				gosub :player~quikstats
				if ($player~current_prompt = "Citadel")
					gosub :PLAYER~pwarp
				else
					goto :twarp
				end
			else
				:twarp
					gosub :PLAYER~twarp
					if (($PLAYER~twarpSuccess = FALSE) and ($player~msg <> "Already in that sector!"))
						setvar $switchboard~message "Could not escape. - ["&$player~msg&"]*"
						gosub :switchboard~switchboard
						halt
					end
			end
		end

	end

	

	setvar $switchboard~message "Density trigger complete.*"
	gosub :switchboard~switchboard

return

#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\bot_includes\combat\init\combat"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\player\twarp\player"
include "source\bot_includes\player\pwarp\player"
include "source\bot_includes\player\currentprompt\player"
include "source\bot_includes\player\getinfo\player"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\planet\landingsub\planet"
include "source\bot_includes\sector\getsectordata\sector"
include "source\bot_includes\combat\fastcitadelattack\combat"
include "source\bot_includes\combat\fastcapture\combat"
include "source\bot_includes\external\pel"
include "source\bot_includes\external\holo"
include "source\bot_includes\external\call"
include "source\bot_includes\external\pgrid"
include "source\bot_includes\combat\fastcapture\combat"
include "source\bot_includes\combat\fastattack\combat"
include "source\bot_includes\combat\holokill\combat"
include "source\bot_includes\ship\getshipstats\ship"


