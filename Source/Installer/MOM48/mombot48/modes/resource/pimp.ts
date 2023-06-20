reqRecording
gosub :BOT~loadVars
loadvar $map~backdoor


	setVar $BOT~help[1] $BOT~tab&"PIMP - Makes planets and strips them of product "
	setVar $BOT~help[2] $BOT~tab&"   "
	setVar $BOT~help[3] $BOT~tab&"pimp {"&#34&"planet name"&#34&"} {f} {o} {e}"
	setVar $BOT~help[4] $BOT~tab&"      "
	setVar $BOT~help[5] $BOT~tab&"[planet name] - creates planet with this name (default"
	setVar $BOT~help[6] $BOT~tab&"                is random name)"
	setVar $BOT~help[7] $BOT~tab&"          [f] - fuel"
	setVar $BOT~help[8] $BOT~tab&"          [o] - organics"
	setVar $BOT~help[9] $BOT~tab&"          [e] - equipment"
	gosub :bot~helpfile

	setVar $BOT~script_title "product pimp"
	gosub :BOT~banner


		
:pimp

	window prodpimp 400 150 "product pimp stats" ONTOP
	gosub :player~quikstats
	setVar $starting_location $player~current_prompt
	getRnd $random 1 100000
	if ($starting_location <> "Citadel") and ($starting_location <> "Planet")
		setVar $switchboard~message "You must run product pimp from a Citadel prompt.*"
		gosub :switchboard~switchboard
		halt
	end
	setVar $bot~user_command_line $bot~user_command_line&" "
	isNumber $test $bot~parm1
	
	getWordPos $bot~user_command_line $pos #34
	if ($pos > 0)
		getText " "&$bot~user_command_line&" " $targetPlanet " "&#34 #34&" "
		if ($targetPlanet <> "")
			setVar $pimp_planet_name $targetPlanet
			stripText $bot~user_command_line " "&#34&$targetPlanet&#34&" "
		else
			setVar $pimp_planet_name "M()M Pimp "&$random
		end
	else
		setVar $pimp_planet_name "M()M Pimp "&$random
	end

	setVar $bot~user_command_line " "&$bot~user_command_line&" "
	getWordPos $bot~user_command_line $pos " f "
	if ($pos > 0)
		setVar $emptyFuel TRUE
	else
		setVar $emptyFuel false
	end
	getWordPos $bot~user_command_line $pos " o "
	if ($pos > 0)
		setVar $emptyOrganics TRUE
	else
		setVar $emptyOrganics false
	end
	getWordPos $bot~user_command_line $pos " e "
	if ($pos > 0)
		setVar $emptyEquipment TRUE
	else
		setVar $emptyEquipment false
	end
	if (($emptyOrganics = false) AND ($emptyEquipment = false) AND ($emptyFuel = false))
		setVar $switchboard~message "Please pick [f]uel, [o]rganics and/or [e]quipment to harvest.  pimp {"&#34&"planet name"&#34&"} {f} {o} {e} *"
		gosub :switchboard~switchboard
		halt
	end
	
	
	setVar $om_sdloc $map~stardock
	setVar $totalPlanets 0
	setVar $stripables 0

	gosub :player~quikstats
	setVar $starting_location $player~current_prompt

	if ($starting_location = "Citadel")
		send "q"
		gosub :planet~getplanetinfo
		send "c"
		waitfor "Citadel command"
	elseif ($starting_location = "Planet")
		gosub :planet~getplanetinfo
		send " q l " $planet~planet "* "
	end

	setVar $target $planet~planet
	setvar $target_cash $planet~citadelcredits
	SetVar $totalfuel $planet~planetfuel
	SetVar $totalorg $planet~planetorg
	SetVar $totalequ $planet~planetequip
	SetVar $totalfuelmax $planet~planetfuelmax
	SetVar $totalorgmax $planet~planetorgmax
	SetVar $totalequmax $planet~planetequipmax
	setVar $om_redsector $map~backdoor


	if ($player~photons > 0)
		setVar $switchboard~message "You can't have photons while running pimp.  That doesn't make any sense at all.*"
		gosub :switchboard~switchboard
		halt
	end
:inac
	killalltriggers
:myinfo
    if ($player~unlimitedGame = false)
		if ($player~turns < $bot~bot_turn_limit)
			setVar $switchboard~message "I have too few turns to pimp product, script halting.*"
			gosub :switchboard~switchboard
			halt
		end
    end
    if (($player~credits + $target_cash) < 1000000)
		setVar $switchboard~message "I have too little cash on hand, script halting.*"
		gosub :switchboard~switchboard
		halt
    end

:myplanetInfo
    if ($starting_location = "Citadel")
        send "q"
        gosub :planet~getplanetinfo
        send "c"
        waitfor "Citadel command"
    elseif ($starting_location = "Planet")
        gosub :planet~getplanetinfo
    end

    SetVar $totalfuel $planet~planetfuel
	SetVar $totalorg $planet~planetorg
	SetVar $totalequ $planet~planetequip
    if ($starting_location = "Citadel")
		send "q"
    end

    #Empty Holds to Planet
    send "m * * * T * L 1*T*L2*T*L3*S*L1*Q j y"

    seteventtrigger discod1 	:discod     	"CONNECTION LOST"
    seteventtrigger	discod2		:discod     	"Connections have been temporarily disabled."
    waitfor "Command [TL"



:makePlanet
	killalltriggers
	gosub :set_windows
	gosub :player~quikstats
	if (($player~credits < 1000000) AND (($player~genesis <= 0) OR ($player~atomic <= 0)))
		setVar $cashonhand $target_cash
		add $cashonhand $player~credits
		send "l j" #8 $target "* c "
		if ($cashonhand > 5000000)
			send "T T " $player~credits "* "
			send "T F " 5000000 "* "
			setVar $player~credits 5000000
		elseif ($cashonhand > 1000000)
			send "T T " $player~credits "* "
			send "T F " $cashonhand "* "
			setVar $player~credits $cashonhand
		else
			setVar $switchboard~message "I have too little cash on hand, script halting.*"
			gosub :switchboard~switchboard
			halt
		end
		seteventtrigger 	discod1 	:discod     	"CONNECTION LOST"
		seteventtrigger		discod2		:discod     	"Connections have been temporarily disabled."
		setTextLineTrigger getcash :gotcash "credits, and the Treasury has "
		pause
		:gotcash
			getWord CURRENTLINE $target_cash 9
			striptext $target_cash ","
			send "qqq* * "
			gosub :player~quikstats
	end
	if ($player~fighters < 1000)
		setVar $switchboard~message "I have too few fighters on hand, less than 1000. Script halting.*"
		gosub :switchboard~switchboard
		halt
	end
	if ($player~unlimitedGame = false)
		if ($player~turns < $bot~bot_turn_limit)
			setVar $switchboard~message "I have too few turns to pimp product. Script halting.*"
			gosub :switchboard~switchboard
			halt
		end
	end
	if (($player~genesis > 0) AND ($player~atomic > 0))
		send "u y * " #8 #8 $pimp_planet_name "* p q * "
		gosub :set_windows
		add $totalPlanets 1
		killalltriggers
		seteventtrigger 	discod1 	:discod     	"CONNECTION LOST"
		seteventtrigger		discod2		:discod     	"Connections have been temporarily disabled."
		settexttrigger builtPlanet :findPlanet "For building this planet"
		pause
	else
		gosub :restock
		goto :makePlanet
	end


:findplanet
	killalltriggers
	#Find the planet we just created
	send "L"
	seteventtrigger 	discod1 	:discod     	"CONNECTION LOST"
	seteventtrigger		discod2		:discod     	"Connections have been temporarily disabled."
	setTextLineTrigger GetPlanetNum :get_planet_num "> "&$pimp_planet_name
	pause
	pause

:get_planet_num
	setVar $line CURRENTLINE
	striptext $line "<"
	getWord $line $planet~planetNum 1
	stripText $planet~planetNum ">"
	send $planet~planetNum "*"
	#check ore

	gosub :planet~getplanetinfo

	if ((($planet~planetFUEL < $player~total_holds) OR ($emptyFuel = false)) AND (($planet~planetORG < $player~total_holds) OR ($emptyOrganics = false)) AND (($planet~planetEQUIP< $player~total_holds) OR ($emptyEquipment = false)))
		#Blow it up :D
		if (($fuelcolos = "0") and ($orgcolos = "0") and ($equipcolos = "0"))
			killalltriggers
			send "z d y "
			seteventtrigger discod1 	:discod     	"CONNECTION LOST"
			seteventtrigger	discod2		:discod     	"Connections have been temporarily disabled."
			settexttrigger 6 :nodets "You do not have any Atomic Detonators!"
			settexttrigger 7 :makePlanet "Command [TL="
			pause
		end
	end
	add $stripables 1
	send "* "
	killalltriggers
	seteventtrigger 	discod1 	:discod     	"CONNECTION LOST"
	seteventtrigger		discod2		:discod     	"Connections have been temporarily disabled."
	waitfor "Planet command"
	:tryFuel
		killalltriggers
		seteventtrigger 	discod1 	:discod     	"CONNECTION LOST"
		seteventtrigger		discod2		:discod     	"Connections have been temporarily disabled."
		if ($emptyFuel)
			send "t*t1*q l j" #8 $target "* t*l1*q l j" #8 $planet~planetNum "* "
			settexttrigger fuelSuccess :fuelSuccess "You load the "
			settexttrigger fuelEmpty :fuelEmpty "There aren't that many "
			settexttrigger fuelFull :fullplanet "They don't have room for that many "
			pause
		else
			goto :fuelEmpty
		end

	:fuelSuccess
		add $totalFuel $player~total_holds
		gosub :set_windows
		goto :tryFuel
	:fuelEmpty
		killalltriggers
	:tryOrganics
		killalltriggers
		if ($emptyOrganics)
			send "t*t2*q l j" #8 $target "* t*l2*q l j" #8 $planet~planetNum "* "
			seteventtrigger 	discod1 	:discod     	"CONNECTION LOST"
			seteventtrigger		discod2		:discod     	"Connections have been temporarily disabled."
			settexttrigger success :orgSuccess "You load the "
			settexttrigger orgEmpty :tryEquipment "There aren't that many "
			settexttrigger fullFill :fullplanet "They don't have room for that many "
			pause
		else
			goto :orgEmpty
		end

	:orgSuccess
		add $totalOrg $player~total_holds
		gosub :set_windows
		goto :tryOrganics
	:orgEmpty
		killalltriggers
	:tryEquipment
		killalltriggers
		if ($emptyEquipment)
			seteventtrigger 	discod1 	:discod     	"CONNECTION LOST"
			seteventtrigger		discod2		:discod     	"Connections have been temporarily disabled."
			send "t*t3*q l j" #8 $target "* t*l3*q l j" #8 $planet~planetNum "* "
			settexttrigger success :equSuccess "You load the "
			settexttrigger emptyEmpty :emptyPlanet "There aren't that many "
			settexttrigger fullFill :fullplanet "They don't have room for that many "
			pause
		else
			goto :equEmpty
		end
	:equSuccess
		add $totalEqu $player~total_holds
		gosub :set_windows
		goto :tryEquipment
	:equEmpty
		killalltriggers
		goto :emptyPlanet

	:fullPlanet
		killalltriggers
		send "qqqqqq* l j"&#8&$target&"* "
		if ($starting_location = "Citadel")
			send "c "
		end
		setVar $switchboard~message " Planet " & $target & " is full, stopping.*"
		gosub :switchboard~switchboard
		halt

	:emptyPlanet
		killalltriggers
		send "@"
		seteventtrigger 	discod1 	:discod     	"CONNECTION LOST"
		seteventtrigger		discod2		:discod     	"Connections have been temporarily disabled."
		waitfor "Average Interval Lag:"
		send "Q"
		waitfor "Command [TL"
		goto :findplanet

:nodets
	send "QQ"
	if ($player~alignment < 1000)
		setVar $switchboard~message "Alignment less than 1000, can't refurb genesis torps and atomic dets*"
		gosub :switchboard~switchboard
		halt
	End

	gosub :restock
	goto  :findplanet
 
:restock
	killalltriggers
	send "d"
	setTextLineTrigger 	figprompt 	:figprompt 		"Fighters:"
	setTextLineTrigger 	nofigprompt :nofigprompt	"Warps to Sector(s) :"
	pause
	:nofigprompt
		killalltriggers
		setVar $switchboard~message "No fighters here to twarp back to.*"
		gosub :switchboard~switchboard
		halt
	:figprompt
		killalltriggers
		getword CURRENTLINE $chkpers 3
		if ($chkpers <> "(yours)")
			getword CURRENTLINE $whichcorp 6
			if ($whichcorp <> "Corp)")
				setVar $switchboard~message "No fighters here to twarp back to.*"
				gosub :switchboard~switchboard
				halt
			end
		end

	seteventtrigger 	discod1 	:discod     	"CONNECTION LOST"
	seteventtrigger		discod2		:discod     	"Connections have been temporarily disabled."
	SetTextLineTrigger sdyes :sdyes "Commerce report for Stargate Alpha I:"
	SetTextLineTrigger sdno1  :sdno  "You have never visted sector"
	SetTextLineTrigger sdno2  :sdno  "I have no information about a port in that sector."
	setDelayTrigger sdno3 :sdno 10000
	#had to add waitfors b/c AllKeys was bypassing display
	send "C"
	waitfor "<Computer activated>"
	send "R"
	waitfor "What sector is the port"
	send $om_sdloc "*"
	pause
	pause

:sdno
	send "q"
	setVar $switchboard~message "SD is not in that sector, or never been visited!! product pimp shutting down in starting sector.*"
	gosub :switchboard~switchboard
	halt

:sdyes
	send "QL " & $target & "* T * T 1 * M * * * Q"
	waitfor "Command [TL"
	send "** "
	gosub :player~quikstats
	if (($player~ore_holds < $player~TOTAL_HOLDS) and ((PORT.BUYFUEL[$player~current_sector] <> true) and (PORT.EXISTS[$player~current_sector] = true)))
		send "P T * * * "
		setVar $SWITCHBOARD~message "Didn't have full fuel for restocking pimp. Buying fuel from port and trying again!*"
		gosub :SWITCHBOARD~switchboard
	end
if ($om_redsector <> 0) and ($player~alignment < 1000)
        if ($player~unlimitedGame)
		setVar $switchboard~message "Running product pimp with unlimited turns and "&$player~credits&" credits left*"
		gosub :switchboard~switchboard
	else
		setVar $switchboard~message "Running product pimp with "&$player~turns&" turns and "&$player~credits&" credits left*"
		gosub :switchboard~switchboard
	end
	killalltriggers
	seteventtrigger 	discod1 	:discod     	"CONNECTION LOST"
	seteventtrigger		discod2		:discod     	"Connections have been temporarily disabled."
	settexttrigger nofig :nofig "Do you want to make this jump blind?"
	settexttrigger ready1 :ready1 "Locating beam pinpointed,"
        settexttrigger nofuel2 :nofuel "You do not have enough Fuel Ore to make the jump"	
	send "m" $om_redsector "*y"
	pause
        pause
End
setVar $switchboard~message "Running product pimp with "&$player~turns&" turns and "&$player~credits&" credits left*"
gosub :switchboard~switchboard
settexttrigger nofig :nofig "Do you want to make this jump blind?"
settexttrigger ready2 :ready2 "All Systems Ready, shall we engage?"
settexttrigger nofuel1 :nofuel "You do not have enough Fuel Ore to make the jump"	
send "nsy"
pause
pause

:nofig
	killalltriggers
	send "n"
	setVar $switchboard~message "No fig at target sector. Shutting Down*"
	gosub :switchboard~switchboard
	halt

:nofuel
	killalltriggers
	setVar $switchboard~message "No fuel for twarp. Shutting Down*"
	gosub :switchboard~switchboard
	halt

:ready1
	killalltriggers
	seteventtrigger 	discod1 	:discod     	"CONNECTION LOST"
	seteventtrigger		discod2		:discod     	"Connections have been temporarily disabled."
	settexttrigger limpet :limpet "ort official runs up"
	settexttrigger buytorps :buytorps "<StarDock> Where to?"
	send "YNS P S"
	pause
	pause

:ready2
	killalltriggers
	seteventtrigger 	discod1 	:discod     	"CONNECTION LOST"
	seteventtrigger		discod2		:discod     	"Connections have been temporarily disabled."
	settexttrigger limpet :limpet "ort official runs up"
	settexttrigger buytorps :buytorps "<StarDock> Where to?"
	send "Y PS"
	pause
	pause

:limpet
	send "Y"
	pause

:buytorps
	killalltriggers
	seteventtrigger 	discod1 	:discod     	"CONNECTION LOST"
	seteventtrigger		discod2		:discod     	"Connections have been temporarily disabled."
	settexttrigger torps :torps "How many Genesis Torpedoes do you want"
	settexttrigger dets  :dets  "How many Atomic Detonators do you want"
	send "HT"
	pause
	pause

:torps 
	GetWord CURRENTLINE $numtorps 9
	StripText $numtorps ")"
	send $numtorps & "*"
	send "A"
	pause

:dets 
	GetWord CURRENTLINE $numdets 9
	StripText $numdets ")"
	send $numdets & "*"
	send "Q Q M " & $player~current_sector & " * Y Y "
	settexttrigger nofig :nofig "Do you want to make this jump blind?"
	settexttrigger ready3 :ready3 "All Systems Ready, shall we engage?"
	settexttrigger nofuel :nofuel "You do not have enough Fuel Ore to make the jump"
	pause
	pause

:ready3
	
	waitfor "Command [TL"
	send "l "&$target&"* t n l 1* q q * j y * "
	Return


:planetfull
    setVar $switchboard~message "Planet is full. script halting.*"
	gosub :switchboard~switchboard
    send "QQ*"


:finish
    halt







:set_windows
	if ($player~unlimitedGame)
		setVar $window_content "Planet fuel:  "&$totalfuel&" out of "&$totalfuelmax&"*Planet Org:   "&$totalorg&" out of "&$totalorgmax&"*Planet Equip: "&$totalEqu&" out of "&$totalequmax&"*Cash:         "&$player~credits&"   Genesis Torps:  "&$player~genesis&"*Fighters:     "&$player~fighters&"   Atomic Dets:    "&$player~atomic&"*Turns:     Unlimited*"&$stripables&" out of "&$totalPlanets&" planets have had product on them.*"
	else
		setVar $window_content "Planet fuel:  "&$totalfuel&" out of "&$totalfuelmax&"*Planet Org:   "&$totalorg&" out of "&$totalorgmax&"*Planet Equip: "&$totalEqu&" out of "&$totalequmax&"*Cash:         "&$player~credits&"   Genesis Torps:  "&$player~genesis&"*Fighters:     "&$player~fighters&"   Atomic Dets:    "&$player~atomic&"*Turns:        "&$player~turns&"*"&$stripables&" out of "&$totalPlanets&" planets have had product on them.*"
	end
	setWindowContents prodpimp $window_content
	replaceText $window_content "*" "[][]"
	saveVar $window_content
return	


:discod
	setVar $TagLine				"[product pimp]"
	setVar $TagLineB			"[product pimp]"
	killalltriggers
   	Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Disconnected **"
   	:Disco_Test
		if (CONNECTED <> TRUE)
			setDelayTrigger		Emancipate_CPU		:Emancipate_CPU 3000
			Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Auto Land & Resume Initiated - Awaiting Connection!**"
			pause
			:Emancipate_CPU
			goto :Disco_Test
		end
		waitfor "(?="
		setDelayTrigger		WaitingABit		:WaitingABit	3000
		Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Connected - Waiting For Command Prompt!**"
		pause
	:WaitingABit
		killalltriggers
		gosub :player~quikstats
		if ($player~current_prompt = "Command")
			send " L Z" & #8 & $target & "*  *  J  C  *  "
			setTextLineTrigger	NotLanded	:NotLanded		"Are you sure you want to jettison all cargo?"
			setTextLineTrigger	Landed		:Landed			"<Enter Citadel>"
			setDelayTrigger		TestConn	:TestConn		3000
			pause
			:TestConn
				killalltriggers
				if (CONNECTED = false)
					goto :Disco_Test
				else
					send ("'{" &$switchboard~bot_name& "} - " & $TagLineB & " Problem Detected Unable to Land!*")
					halt
				end
			:NotLanded
				killalltriggers
				send ("'{" &$switchboard~bot_name& "} - Boton Unable To Land, Check my TA.*")
				send ("'{" & $switchboard~bot_name & "} "&$TagLineB&" - Unable To Land After Reconnect,Check My TA!**")
				halt
			:Landed
				killalltriggers
				send ("'{" & $switchboard~bot_name & "} "&$TagLineB&" - Restarting!**")
				waitfor "Message sent on sub-space channel"
				goto :inac
		elseif ($player~current_prompt = "Planet")
				send ("  q q q q q  * * '" & $TagLineB & " Attempting to Reach Correct Prompt...*")
			setTextLineTrigger	EMQ_COMPLETE		:EMQ_DELAY "Attempting to Reach Correct Prompt..."
			setDelayTrigger 	EMQ_DELAY		:EMQ_DELAY 3000
			pause
		elseif ($player~current_prompt = "Citadel")
			send ("'{" & $switchboard~bot_name & "} "&$TagLineB&" - Restarting!**")
			waitfor "Message sent on sub-space channel"
				goto :inac
			else
				send (" p d 0* 0* 0* * *** * c q q q q q z 2 2 c q * z * *** * * '" & $TagLineB & " Attempting to Reach Correct Prompt...*")
			setTextLineTrigger	EMQ_COMPLETE		:EMQ_DELAY "Attempting to Reach Correct Prompt..."
			setDelayTrigger 	EMQ_DELAY		:EMQ_DELAY 3000
			pause
			:EMQ_DELAY
				killalltriggers
				goto :Disco_Test
		end

#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\getplanetinfo\planet"
