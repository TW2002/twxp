gosub :loadvars~loadvars
loadvar $bot~bot_name
loadvar $bot~unlimitedgame
loadvar $map~stardock
loadvar $bot~bot_turn_limit
loadvar $bot~user_command_line
loadvar $lsd_order
loadvar $bot~folder

gosub :player~quikstats
setvar $location $player~current_prompt
setvar $starting_credits $player~credits
setvar $starting_turns $player~turns
setvar $start_sector $player~current_sector

setvar $shipdata_valid		false
setvar $ships_names			"][LSD]["
setvar $ships_file 			$bot~folder&"/LSD_" & gamename & ".ships"
setvar $shiplistmax			50
setarray $shiplist			$shiplistmax 3
setvar $lsd__pad "@"
setvar $cmd ($bot~user_command_line & "^^%%@@")
setvar $minlength "M@M@M@M@M@Y@M@M@M@Y@M@M@Y@M@M@M@0@0@0@0"

getlength $minlength $mlen
getlength $bot~user_command_line $prmlength

if ($player~credits < 10000)
	setvar $switchboard~message "Must have more than 10,000 Creds on hand!**"
	gosub :switchboard~switchboard
	halt
end

if (($player~twarp_type = "No") and ($player~current_sector <> $map~stardock))
	setvar $switchboard~message "Must have at least Twarp Type 1!**"
	gosub :switchboard~switchboard
	halt
end

if ($prmlength < $mlen)
	setvar $switchboard~message "Bad LSD command, please report this issue.*"
	gosub :switchboard~switchboard
	halt
end

gosub :player~getavoids
clearallavoids

#stripText $cmd $LSD__PAD

gosub :getitems

gosub :player~quikstats

if ($map~stardock <= 0)
	setvar $switchboard~message $taglineb & " - Cannot Find Dock!**"
	gosub :switchboard~switchboard
	halt
end

gosub :loadshipdata

setvar $location $player~current_prompt
#	getWordPos CURRENTANSILINE $pos #27
if ($location = "Command")
	#		if ($pos = 0)
	#			send " c n 1 q q "
	#			waitfor "Command [TL="
	#		end
elseif ($location = "Citadel")
	#		if ($pos = 0)
	#			send " c n 1 q q "
	#			waitfor "Citadel command"
	#		end
elseif ($location = "Planet")
	setvar $theres_citadel false
	settexttrigger theres_no_cit :theres_no_cit "Planet command (?=help)"
	settextlinetrigger there_cit :theres_cit "Planet has a level "
	pause

	:theres_cit
	setvar $theres_citadel true
	pause

	:theres_no_cit
	killalltriggers

	if ($theres_citadel)
		send " C "
	else
		send " Q "
	end
	#		getWordPos CURRENTANSILINE $pos #27
	#		if ($pos = 0)
	#			send " c n 1 q q "
	#			if ($Theres_Citadel)
	#				waitfor "Citadel command"
	#			else
	#				waitfor "Command "
	#			end
	#		end
end

setvar $speacalmsg 			""
setvar $runs2dock 			0

if (($location = "Citadel") or ($location = "Command"))
	gosub :cn1_and_cn9_checking
else
	setvar $switchboard~message $taglineb & " - Need To Be At Citadel Or Command Pprompt!!**"
	gosub :switchboard~switchboard
	halt
end

if ($location = "Citadel")
	send " C  V  0*  Y  N" & $start_sector & "* V  0*  Y  N" & $map~stardock & "*  U  Y  Q  Q  DS  N  L  1* S  N  L  2*  S  N  L  3*  T  N  L  2*  T  N  L  3*  T  N  T  1*  *  Q *  w  n  * "
	settextlinetrigger pnum :pnum "Planet #"
	pause

	:pnum
	killalltriggers
	getword currentline $planet~planet 2
	striptext $planet~planet "#"
elseif ($location = "Command")
	send " C  V  0*  Y  N" & $start_sector & "* V  0*  Y  N" & $map~stardock & "* U Y Q *  w  n  * "
end

gosub :player~quikstats

setvar $start_creds $player~credits
setvar $start_exp $player~experience
setvar $start_holds $player~total_holds

waitfor "(?="
if ($player~turns = 0)
	gosub :turnsdetect
	if ($unlim = false)
		if ($player~turns < $bot~bot_turn_limit)
			setvar $switchboard~message $taglineb & " - Not have enough Turns!**"
			gosub :switchboard~switchboard
			halt
		end
	end
end

if (($player~total_holds <> $player~ore_holds) and ($player~current_sector <> $map~stardock))
	setvar $switchboard~message $taglineb & " - Please Restart with Full Ore in Holds!!**"
	gosub :switchboard~switchboard
	halt
end

:start
setvar $locationdock 0
if ($player~current_sector <> $map~stardock)
	setvar $figcnt sector.figs.quantity[$start_sector]
	setvar $figowner sector.figs.owner[$start_sector]
	if (($figcnt = 0) or (($figowner <> "belong to your Corp") and ($figowner <> "yours")))
		setvar $switchboard~message $taglineb & " - Fig Required In Current Sector**"
		gosub :switchboard~switchboard
		halt
	end
else
	setvar $locationdock 1
end
#=--------                                                                       -------=#
#=------------------------------       Main Event       ------------------------------=#
#=--------                                                                       -------=#
setvar $run_once true

if (($_atomics = "") and ($_beacons = "") and ($_corbo = "") and ($_cloak = "") and ($_probe = "") and ($_pscan = "") and ($_limps = "") and ($_mines = "") and ($_photon = "") and ($_lrscan = "") and ($_disrupt = "") and ($_gentorp = "") and ($_t2twarp = "") and ($_holds = "") and ($_figs = "") and ($_shields = "") and ($_trickster = "") and ($numberofship < 1))
	setvar $switchboard~message $taglineb & " - Nothing To Do**"
	gosub :switchboard~switchboard
	halt
end

#=-------------------This is where we loop too if buying more than one ship
:here_we_go_again
setvar $currentship $player~ship_number
add $runs2dock 1

if (($_tow > 0) and ($_trickster = ""))
	setvar $pass ""
	gosub :getpassword
	gosub :locktow
else
	setvar $_tow 0
	send " W N * "
end

if ($run_once)
	if ($locationdock = 0)
		# check adj's for Dock.. if present, then we don't need a jump sector.
		setvar $i 1
		setvar $weareadjdock false
		while ($i <= sector.warpcount[$start_sector])
			setvar $adj_start sector.warps[$start_sector][$i]
			if ($adj_start = $map~stardock)
				setvar $weareadjdock true
			end
			add $i 1
		end

		if (($player~alignment < 1000) and ($weareadjdock = false))
			setvar $red_adj 0
			gosub :findjumpsector
			if ($red_adj <> 0)
				setvar $switchboard~message $taglineb & " - Jump Sector Found"&" - Using Sector "&$red_adj&"**"
				gosub :switchboard~switchboard
			else
				waitfor "Command [TL="
				setvar $switchboard~message $taglineb & " - Cannot Find Jump Sector Adjacent Dock**"
				gosub :switchboard~switchboard
				halt
			end
		end

		if ($player~alignment >= 1000)
			if ($weareadjdock)
				send "^F" & $map~stardock & "*" & $start_sector & "*Q/ "
			else
				send "^F" & $start_sector & "*" & $map~stardock & "*F" & $map~stardock & "*" & $start_sector & "*Q/ "
			end
		else
			if ($weareadjdock)
				send "^F" & $map~stardock & "*" & $start_sector & "*Q/ "
			else
				send "^F" & $start_sector & "*" & $red_adj & "*F" & $map~stardock & "*" & $start_sector & "*Q/ "
			end
		end
		settextlinetrigger nojoy :nojoy "*** Error - No route within"
		settexttrigger cont :cont "(?="
		pause

		:nojoy
		killalltriggers
		setvar $switchboard~message $taglineb & " - Cannot Find Path to StarDock!**"
		gosub :switchboard~switchboard
		halt

		:cont
		killalltriggers
		setdelaytrigger latency_delay		:latency_delay 500
		pause

		:latency_delay
		echo "**" & ansi_14 & "Please Stand By" & ansi_15 & " - Calculating Distances...**"
		if (($player~alignment >= 1000) or ($weareadjdock))
			getdistance $dist1 $start_sector $map~stardock
		else
			getdistance $dist1 $start_sector $red_adj
		end

		if ($dist1 <= 0)
			setvar $switchboard~message $taglineb & " - Insufficient Warp Data Plotting Course to Dock**"
			gosub :switchboard~switchboard
			halt
		end

		getdistance $dist2 $map~stardock $start_sector
		if ($dist2 <= 0)
			setvar $switchboard~message $taglineb & " - Insufficient Warp Data Plotting Return Course From Dock**"
			gosub :switchboard~switchboard
			halt
		end

		setvar $ore_req (($dist1 + $dist2) * 3)

		if ($_tow > 0)
			setvar $ore_req ($ore_req * 2)
		elseif ($_trickster <> "")
			setvar $ore_req ($dist1 * 3)
			setvar $ore_req $ore_req + ($dist2 * 6)
		end

		if ($player~ore_holds < $ore_req)
			setvar $switchboard~message $taglineb & " - Not Enough ORE In Holds To Make Round Trip**"
			gosub :switchboard~switchboard
			halt
		end

		if ($player~twarp_type = "No")
			setvar $switchboard~message $taglineb & " - Must Have Twarp 1 or 2**"
			gosub :switchboard~switchboard
			halt
		end

		if ($unlim = 0)
			gosub :turnsrequired
			if ($player~turnsrequired > $player~turns)
				setvar $switchboard~message $taglineb & " - Not Enough Turns. " & ansi_12 & $player~turnsrequired & ansi_15 & ", Required**"
				gosub :switchboard~switchboard
				halt
			elseif ($player~turnsrequired <= $player~turns)
				setvar $tmp ($player~turns - $player~turnsrequired)
				if ($tmp <= $bot~bot_turn_limit)
					setvar $switchboard~message $taglineb & " - Proceeding Will Leave Fewer Than " & $bot~bot_turn_limit & " Turns!**"
					gosub :switchboard~switchboard
					halt
				end
			end
		end
	end
end

send " C R " & $map~stardock & "*Q "
settextlinetrigger itsalive :itsalive "Items     Status  Trading % of max OnBoard"
settextlinetrigger nosoupforme :nosoupforme "I have no information about a port in that sector"
pause

:nosoupforme
killalltriggers
setvar $switchboard~message $taglineb & " - StarDock appears to have been Blown Up!**"
gosub :switchboard~switchboard
halt

:itsalive
killalltriggers
waitfor "(?="
setvar $msg ""
if ($locationdock = 1)
	send "P  S G Y G Q "
elseif (($player~alignment >= 1000) and ($weareadjdock = false))
	setvar $twarpto $map~stardock
	gosub :dotwarp
elseif (($weareadjdock = false) and ($red_adj <> 0))
	setvar $twarpto $red_adj
	gosub :dotwarp
else
	send " m " & $map~stardock & "*  *  P  S G Y G Q "
end
if ($msg = "")
	waitfor "You leave the Galactic Bank."
else
	setvar $switchboard~message $taglineb & " - Unknown Problem Detected. Check TA!**"
	gosub :switchboard~switchboard
	halt
end

gosub :player~quikstats

if (($start_creds <= 100) and ($start_exp < $experiece) and ($start_holds <> $player~total_holds))
	setvar $switchboard~message $taglineb & " - Appear To Have Been Podded!**"
	gosub :switchboard~switchboard
	halt
end

if ($_tow > 0)
	if ($player~current_prompt = "<StarDock>")
		gosub :doshiptowedcheck
		setvar $shipnum $_tow
		gosub :doxport
	else
		setvar $switchboard~message $taglineb & " - Not at Expected StarDock Prompt!**"
		gosub :switchboard~switchboard
		halt
	end
elseif ($_trickster <> "")
	if ($player~current_prompt = "<StarDock>")
		gosub :buyship
		if ($newshipnumber > 0)
			setvar $_tow $newshipnumber
			setvar $pass ""
		else
			setvar $_tow 0
			setvar $numberofship 0
			goto :go_home_empty_handed
		end
	else
		setvar $switchboard~message $taglineb & " - Not at Expected StarDock Prompt!**"
		gosub :switchboard~switchboard
		halt
	end
end

gosub :dopurchases

if ($_tow > 0)
	if ($pass = "")
		setvar $shipnum $currentship
	else
		setvar $shipnum $currentship & "*" & $pass & "*   "
	end

	gosub :doxport
	gosub :player~quikstats

	if ($player~current_prompt <> "<StarDock>")
		setvar $switchboard~message $taglineb & " - Not at Expected StarDock Prompt!**"
		gosub :switchboard~switchboard
		halt
	end
end

:go_home_empty_handed
if ($locationdock = 1)
	send "Q Q Q Q Z N "

elseif ($_tow > 0)
	if ($location = "Citadel")
		send "q q q  z  n  w  n  *  w  n" & $_tow & "*  n  n  *  m " & $start_sector & " *  y  y  y  *  d  w  n * L Z" & #8 & $planet~planet & "* p  s s * * c *"
	else
		send "q q q  z  n  w  n  *  w  n" & $_tow & "*  n  n  *  m " & $start_sector & " *  y  y  y  *  d  w  n *  p z s s *"
	end
else
	if ($location = "Citadel")
		send "Q Q Q Q Z N M " & $start_sector & "* Y  Y  Y  * L Z" & #8 & $planet~planet & "* p  s  s * * c *"
	else
		send "Q Q Q Q Z N M " & $start_sector & "* Y  Y  Y  *  P Z S S *"
	end
end

gosub :player~quikstats

waitfor "(?="
if (($player~current_sector = $map~stardock) and ($locationdock = 0))
	setvar $switchboard~message $taglineb & " - Twarp Error, Should be Hiding on Dock!**"
	gosub :switchboard~switchboard
	halt
end

if ($numberofship <> "")
	if ($numberofship > 1)
		if ($player~current_prompt = "Citadel")
			setvar $_tow 0
			send " Q  T  N  T  1*  Q  "
			waitfor "Command [TL"
			subtract $numberofship 1

			gosub :player~quikstats
			if ($player~total_holds <> $player~ore_holds)
				setvar $switchboard~message $taglineb & " - Out Of Gas - Planet appears to have too little ORE to continue!**"
				gosub :switchboard~switchboard
				halt
			end

			if ($run_once)
				if ($unlim = false)
					setvar $turn_diff ($starting_turns - $player~turns)
					setvar $turn_req ($turn_diff * $numberofship)

					if ($turn_req > $player~turns)
						setprecision 0
						setvar $turn_req ($player~turns / $turn_diff)

						if ($turn_req < 1)
							setvar $numberofship 0
							setvar $turn_req $turn_diff
						end
					end
				end

				setvar $actualcost ($starting_credits - $player~credits)
				setvar $bottomline ($actualcost * $numberofship)
				setvar $bottomline ($actualcost + $bottomline)

				if ($bottomline > $player~credits)
					setprecision 0
					setvar $numberofship ($player~credits / $actualcost)
					if ($numberofship < 1)
						setvar $numberofship 0
						setvar $bottomline $actualcost
					else
						setvar $bottomline ($actualcost * ($numberofship + 1))
					end
				end

				if ($unlim = false)
					setvar $speacalmsg $speacalmsg & "                + " & $turn_diff & " Turns Used Per Trip.*"
					setvar $speacalmsg $speacalmsg & "                + " & ($turn_diff * ($numberofship + 1)) & " Total Turns Expended.*"
				end
				setvar $cashamount $actualcost
				gosub :commasize
				setvar $speacalmsg $speacalmsg & "                + $" & $cashamount & " Spent On Each Ship.*"
				setvar $cashamount $bottomline
				gosub :commasize
				setvar $speacalmsg $speacalmsg & "                + $" & $cashamount & " Grand Total!*"
				setvar $run_once false
			end

			if ($numberofship = 0)
				goto :we_done
			else
				goto :here_we_go_again
			end
		end
	end
end

:we_done
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

setprecision 0
setvar $cashamount ($starting_credits - $player~credits)
gosub :commasize
setvar $_spent $cashamount
setvar $cashamount $player~credits
gosub :commasize
setvar $_remain $cashamount

if (($_tow <> 0) and ($_trickster = ""))
	setvar $switchboard~message $taglineb & " Complete - Spent: $" & $_spent & " on Ship #" & $_tow & ", OnHand: $" & $_remain & "*"
	gosub :switchboard~switchboard
	waitfor "Message sent on sub-space channel"
elseif ($speacalmsg <> "")
	send "'*"
	settextlinetrigger commsron 	:commsron "Comm-link open on sub-space band"
	settextlinetrigger commsroff	:commsroff "You'll need to select a radio channel first."
	pause

	:commsron
	killalltriggers
	setvar $switchboard~message $taglineb & " Complete - Spent: $" & $_spent & " on " & $runs2dock & " Ships, OnHand: $" & $_remain & "*"
	gosub :switchboard~switchboard
	send $speacalmsg & "*"
	send "* * "
	waitfor "Sub-space comm-link terminated"

	:commsroff
	killalltriggers
else
	setvar $switchboard~message $taglineb & " Completed - Spent: $" & $_spent & ", On Hand: $" & $_remain & "*"
	gosub :switchboard~switchboard
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
	setvar $str_pad "     " & $str_pad
elseif ($str_pad < 100)
	setvar $str_pad "    " & $str_pad
elseif ($str_pad < 1000)
	setvar $str_pad "   " & $str_pad
elseif ($str_pad < 10000)
	setvar $str_pad "  " & $str_pad
elseif ($str_pad < 100000)
	setvar $str_pad " " & $str_pad
end
return

:dopurchases
if ($shipdata_valid = 0)
	gosub :parseshipdata
end
send "h "
waitfor "<Hardware Emporium>"
#=============================================== PURCHASE ATOMICS
if ($_atomics <> "")
	send "a "
	waitfor "How many Atomic Detonators do you want"
	if ($_atomics = "Max")
		gettext currentline $buy "(Max" ")"
		send $buy & "* "
	else
		send $_atomics & "* "
	end
	waitfor "<Hardware Emporium>"
end
#=============================================== PURCHASE BEACONS
if ($_beacons <> "")
	send "b "
	waitfor "How many Beacons do you want"
	if ($_beacons = "Max")
		gettext currentline $buy "(Max" ")"
		send $buy & "* "
	else
		send $_beacons & "* "
	end
	waitfor "<Hardware Emporium>"
end
#=============================================== PURCHASE CORBO
if ($_corbo <> "")
	send "C "
	waitfor "How many Corbomite Transducers do you want"
	if ($_corbo = "Max")
		gettext currentline $buy "(Max" ")"
		send $buy & "* "
	else
		send $_corbo & "* "
	end
	waitfor "<Hardware Emporium>"
end
#=============================================== PURCHASE CLOAKS
if ($_cloak <> "")
	send "D "
	waitfor "How many Cloaking units do you want"
	if ($_cloak = "Max")
		gettext currentline $buy "(Max" ")"
	else
		setvar $buy $_cloak
	end
	send $buy & "* "
	waitfor "<Hardware Emporium>"
end
#=============================================== PURCHASE PROBES
if ($_probe  <> "")
	send "E "
	waitfor "How many Probes do you want"
	if ($_probe  = "Max")
		gettext currentline $buy "(Max" ")"
		send $buy & "* "
	else
		send $_probe & "* "
	end
	waitfor "<Hardware Emporium>"
end
#=============================================== PURCHASE PSCAN
if ($_pscan  <> "")
	send "F "
	settexttrigger canpscan		:canpscan "I can let you have one for"
	settexttrigger cantpscan	:cantpscan "<Hardware Emporium> So what are you looking for"
	pause

	:canpscan
	killtrigger canpscan
	send "Y"
	pause

	:cantpscan
	killalltriggers

end
#=============================================== PURCHASE LIMPS
if ($_limps  <> "")
	send "L "
	waitfor "How many mines do you want"
	if ($_limps  = "Max")
		gettext currentline $buy "(Max" ")"
		send $buy & "* "
	else
		send $buy $_limps & "* "
	end
	waitfor "<Hardware Emporium>"
end
#=============================================== PURCHASE ARMIDS
if ($_mines  <> "")
	send "M "
	setvar $buy 0
	waitfor "How many mines do you"
	if ($_mines  = "Max")
		gettext currentline $buy "(Max" ")"
		send $buy & "* "
	else
		send $_mines & "* "
	end
	waitfor "<Hardware Emporium>"
end
#=============================================== PURCHASE PHOTONS
if ($_photon  <> "")
	settexttrigger canhouse :canhouse "How many Photon Missiles do you want"
	settexttrigger canthouse :canthouse "<Hardware Emporium> So what are you looking for"
	send "P "
	pause

	:canhouse
	killalltriggers
	if ($_photon  = "Max")
		gettext currentline $buy "(Max" ")"
		send $buy & "* "
	else
		send $_photon & "* "
	end
	waitfor "<Hardware Emporium>"

	:canthouse
	killalltriggers
end
#=============================================== PURCHASE LRSCAN
if ($_lrscan  <> "")
	settexttrigger canbuylrscan		:canbuylrscan "Which would you like?"
	settexttrigger cantbuylrscan	:cantbuylrscan "<Hardware Emporium> So what are you looking for"
	send "R "
	pause

	:canbuylrscan
	killalltriggers
	send "h"
	waitfor "<Hardware Emporium>"

	:cantbuylrscan
	killalltriggers
end
#=============================================== PURCHASE DISRUPTORS
if ($_disrupt  <> "")
	send "S "
	waitfor "How many Mine Disruptors do you want"
	if ($_disrupt  = "Max")
		gettext currentline $buy "(Max" ")"
		send $buy & "* "
	else
		send $_disrupt & "* "
	end
	waitfor "<Hardware Emporium>"
end
#=============================================== PURCHASE GEN TORPS
if ($_gentorp  <> "")
	send "T "
	waitfor "How many Genesis Torpedoes do you want"
	if ($_gentorp  = "Max")
		gettext currentline $buy "(Max" ")"
	else
		setvar $buy $_gentorp
	end
	send $buy & "* "
	waitfor "<Hardware Emporium>"
end
#=============================================== PURCHASE TWARP DRIVE
if ($_t2twarp  <> "")
	send "W "
	settexttrigger cantwarp :cantwarp "Which would you like? (1/2/U/Quit)"
	settexttrigger canttwarp :canttwarp "<Hardware Emporium> So what are you looking for"
	pause

	:cantwarp
	killtrigger cantwarp
	if ($player~twarp_type = 1)
		send "U "
	else
		send "2 "
	end
	pause

	:canttwarp
	killalltriggers
end
#=============================================== SHIP YARD
if (($_holds <> "") or ($_figs <> "") or ($_shields <> ""))
	send "q s p "
	waitfor "Which item do you wish to buy?"
	#=============================================== SHIP YARD
	if ($_holds  = "Max")
		send "?"
		waitfor "A  Cargo holds     : "
		getword currentline $_holds 10
		isnumber $tst $_holds
		if ($tst <> 0)
			send "A " & $_holds & "* y "
		end
	elseif ($_holds <> "")
		send "A "
		waitfor "How many Cargo Holds do you want installed?"
		send $_holds & "* y "
	end
	if ($_figs = "Max")
		send "B "
		waitfor "How many K-3A fighters do you want to buy"
		getword currentline $_figs 11
		striptext $_figs ")"
		send $_figs & "* "
	elseif ($_figs <> "")
		send "B "
		waitfor "How many K-3A fighters do you want to buy"
		send $_figs & "* "
	end
	if ($_shields = "Max")
		send "C "
		waitfor "How many shield armor points do you want to buy"
		getword currentline $_shields 12
		striptext $_shields ")"
		send $_shields & "*"
	elseif ($_shields <> "")
		send "C "
		waitfor "How many shield armor points do you want to buy"
		send $_shields & "*"
	end
end
return

:locktow
:trylockagain
setvar $player~turns_req2tow 0
send "W"
settexttrigger dotow 		:dotow "Do you wish to tow a manned ship? "
settextlinetrigger beamoff	:beamoff "You shut off your Tractor Beam"
pause

:beamoff
killalltriggers
goto :trylockagain

:dotow
if ($player~current_sector < 10)
	setvar $towingpadded $_tow & "     " & $player~current_sector
elseif ($player~current_sector < 100)
	setvar $towingpadded $_tow & "    " & $player~current_sector
elseif ($player~current_sector < 1000)
	setvar $towingpadded $_tow & "   " & $player~current_sector
elseif ($player~current_sector < 10000)
	setvar $towingpadded $_tow & "  " & $player~current_sector
else
	setvar $towingpadded $_tow & " " & $player~current_sector
end
send "N"
killalltriggers
settextlinetrigger noships	:nothere "You do not own any other ships in this sector!"
settexttrigger shipscan		:shipscan $towingpadded
settexttrigger nothere		:nothere "Choose which ship to tow "
pause

:nothere
killalltriggers
send "Q* "
setvar $switchboard~message $taglineb & " - Ship To Be Towed Not Found**"
gosub :switchboard~switchboard
halt

:shipscan
killalltriggers
send $_tow & "**"
settexttrigger pwprotected		:pwprotected "Enter the password for "
settextlinetrigger turnsreq		:towengaged "It will now cost you "
pause

:pwprotected
killalltriggers
send " *  * "
setvar $switchboard~message $taglineb & " - Cannot Tow A Ship With A Set Password**"
gosub :switchboard~switchboard
halt

:towengaged
killalltriggers
gettext currentline $player~turns_req2tow "cost you " " turns"
striptext $player~turns_req2tow " "
isnumber $tst $player~turns_req2tow
if ($tst = 0)
	setvar $switchboard~message $taglineb & " - Unable to Ascertain Turns Required.**"
	gosub :switchboard~switchboard
	halt
end

return

:doxport
setvar $msg ""
killtrigger det_trg1
killtrigger det_trg2
killtrigger det_trg3
killtrigger det_trg4
killtrigger det_trg5
killtrigger det_trg6
killtrigger det_trg7
settextlinetrigger det_trg1	:xport_notavail "That is not an available ship."
settextlinetrigger det_trg2	:xport_badrange "only has a transport range of"
settextlinetrigger det_trg3	:xport_security "SECURITY BREACH! Invalid Password, unable to link transporters."
settextlinetrigger det_trg4	:xport_noaccess "Access denied!"
settextlinetrigger det_trg5	:xport_xprtgood "Security code accepted, engaging transporter control."
settextlinetrigger det_trg6	:xport_go_ahead "Landing on Federation StarDock."
# Send the macro
send "qqq  z  n  x    " & $shipnum & "    *    *    *    p  s"
pause
return

:xport_notavail
setvar $msg "Incorrect Ship Number!*"
pause

:xport_badrange
setvar $msg "Ship Is Out Of Export Range*"
pause

:xport_security
setvar $msg "Cannot Export to Password Protected Ship*"
pause

:xport_noaccess
setvar $msg "Unable to Access Ship*"
pause

:xport_xprtgood
setvar $msg "Export Success!*"
pause

:xport_go_ahead
settextlinetrigger det_trg7 	:xport_scrub "A port official runs up to you as you dock and informs you that"
settexttrigger det_trg8		:xport_docked "<StarDock> Where to? (?="
pause

:xport_scrub
send " y"
pause

:xport_docked
killalltriggers
setvar $switchboard~message $taglineb & " - " & $msg
gosub :switchboard~switchboard
return

:dotwarp
setvar $msg ""
if ($twarpto > 0)
	send "mz" & $twarpto " * "
	settexttrigger there        :adj_warp "You are already in that sector!"
	settextlinetrigger adj_warp :adj_warp "Sector  : " & $twarpto & " "
	settexttrigger locking      :locking "Do you want to engage the TransWarp drive?"
	settexttrigger igd          :twarpigd "An Interdictor Generator in this sector holds you fast!"
	settexttrigger noturns      :twarpphotoned "Your ship was hit by a Photon and has been disabled"
	settexttrigger noroute      :twarpnoroute "Do you really want to warp there? (Y/N)"
	pause

	:adj_warp
	killalltriggers
	send "z*"
	goto :twarp_adj

	:locking
	killalltriggers
	send "y"
	settextlinetrigger twarp_lock 		:twarp_lock "TransWarp Locked"
	settextlinetrigger no_twrp_lock 	:no_twarp_lock "No locating beam found"
	settextlinetrigger twarp_adj 		:twarp_adj "<Set NavPoint>"
	settextlinetrigger no_fuel 			:twarpnofuel "You do not have enough Fuel Ore"
	pause

	:twarpnofuel
	killalltriggers
	setvar $msg "Not enough fuel for T-warp."
	goto :twarpdone

	:twarp_adj
	killalltriggers
	send " * p s"
	goto :twarpdone

	:twarpnoroute
	killalltriggers
	send "n* z* "
	setvar $msg "No route available!"
	goto :twarpdone

	:no_twarp_lock
	killalltriggers
	send "n* z* "
	setvar $msg "No fighter Deployed, cannot Twarp"
	goto :twarpdone

	:twarpigd
	killalltriggers
	setvar $msg "My ship is being held by Interdictor!"
	goto :twarpdone

	:twarpphotoned
	killalltriggers
	setvar $msg "I have been photoned and can not T-warp!"
	goto :twarpdone

	:twarp_lock
	killalltriggers
	if ($player~alignment >= 1000)
		send "y * * p s g y g q "
	else
		send "y  *  *  m " & $map~stardock & " *  *  p s g y g q "
	end

	:twarpdone
	if ($msg <> "")
		setvar $switchboard~message "Twarp Error - " & $msg & "**"
		gosub :switchboard~switchboard
	end
end
return

:doshiptowedcheck
if ($map~stardock < 10)
	setvar $sellingship $_tow & "     " & $map~stardock
elseif ($map~stardock < 100)
	setvar $sellingship $_tow & "    " & $map~stardock
elseif ($map~stardock < 1000)
	setvar $sellingship $_tow & "   " & $map~stardock
elseif ($map~stardock < 10000)
	setvar $sellingship $_tow & "  " & $map~stardock
else
	setvar $sellingship $_tow & " " & $map~stardock
end

send "S S"
settextlinetrigger nothing2sell		:nothing2sell "You do not own any other ships orbiting the Stardock!"
settextlinetrigger something2sell	:something2sell $sellingship
settexttrigger notinlist			:notinlist "Choose which ship to sell "
pause

:notinlist
killalltriggers
send "Q"

:nothing2sell
killalltriggers
send "Q/"
waitfor "(?="
setvar $switchboard~message "Tow Error - Ship Wasn't Towed!**"
gosub :switchboard~switchboard
halt

:something2sell
killalltriggers
send "QQ"
return

:getpassword
send "co"
settexttrigger pline :pline "tell it to.  Your last password was : "
pause

:pline
killalltriggers
setvar $currentline currentline & ""
gettext $currentline $pass ": " ""

if ($pass <> "")
	send $pass
end

send "*"

settexttrigger makecorp		:makecorp "Should this be a (C)orporate ship or (P)ersonal ship? "
settexttrigger notanoption	:notanoption "Computer command [TL="
pause

:makecorp
killalltriggers
send "C"

:notanoption
killalltriggers
send " Q "

return

:commasize
if ($cashamount < 1000)
	#do nothing
elseif ($cashamount < 1000000)
	getlength $cashamount $len
	setvar $len ($len - 3)
	cuttext $cashamount $tmp 1 $len
	cuttext $cashamount $tmp1 ($len + 1) 999
	setvar $tmp $tmp & "," & $tmp1
	setvar $cashamount $tmp
elseif ($cashamount <= 999999999)
	getlength $cashamount $len
	setvar $len ($len - 6)
	cuttext $cashamount $tmp 1 $len
	setvar $tmp $tmp & ","
	cuttext $cashamount $tmp1 ($len + 1) 3
	setvar $tmp $tmp & $tmp1 & ","
	cuttext $cashamount $tmp1 ($len + 4) 999
	setvar $tmp $tmp & $tmp1
	setvar $cashamount $tmp
end
return

:paditemcosts
getlength $padthiscost $len

if ($len = 1)
	setvar $padthiscost "      " & $padthiscost
elseif ($len = 2)
	setvar $padthiscost "     " & $padthiscost
elseif ($len = 3)
	setvar $padthiscost "    " & $padthiscost
elseif ($len = 4)
	setvar $padthiscost "   " & $padthiscost
elseif ($len = 5)
	setvar $padthiscost "  " & $padthiscost
elseif ($len = 6)
	setvar $padthiscost " " & $padthiscost
else

end
return

:findjumpsector
setvar $i 1
setvar $red_adj 0

while (sector.warpsin[$map~stardock][$i] > 0)
	setvar $red_adj sector.warpsin[$map~stardock][$i]
	send "m " & $red_adj & "* y"
	settexttrigger twarpblind 			:twarpblind "Do you want to make this jump blind? "
	settexttrigger twarplocked			:twarplocked "All Systems Ready, shall we engage? "
	settextlinetrigger twarpvoided		:twarpvoided "Danger Warning Overridden"
	settextlinetrigger twarpadj			:twarpadj "<Set NavPoint>"
	pause

	:twarpadj
	killalltriggers
	send " * "
	return

	:twarpvoided
	killalltriggers
	send " N N "
	goto :tryingnextadj

	:twarplocked
	killalltriggers
	send " N "

	goto :sectorlocked

	:twarpblind
	killalltriggers
	send " N "

	:tryingnextadj
	add $i 1
end

:noadjsfound
setvar $red_adj 0
return

:sectorlocked
return

:ig_turn_it_on
killalltriggers
setvar $ig_mode 0
settexttrigger no_ig_trigger :no_ig_available "is not equipped with an Interdictor Generator!"
settexttrigger no_ig_beam    :no_ig_beam "Beam to what sector? (U=Upgrade Q=Quit)"
settexttrigger no_ig_cby     :no_ig_cby "ARE YOU SURE CAPTAIN? (Y/N)"
settexttrigger need_ig       :ig_was_off "Your Interdictor generator is now OFF"
settexttrigger ig_fine       :ig_was_on "Your Interdictor generator is now ON"
settexttrigger do_ig         :do_ig_thing "Do you wish to change it? (Y/N)"
send " b"
pause

:no_ig_available
echo "**" & ansi_14 & $taglineb & ansi_15 & " - No IG available on this ship.**"
return

:no_ig_beam
send " Q "
echo "**" & ansi_14 & $taglineb & ansi_15 & " - Cannot turn IG On, Incorrect Prompt.**"
return

:no_ig_cby
send " Q Q Q Z N "
waitfor "(?="
goto :ig_turn_it_on

:ig_was_on
setvar $ig_mode 1
pause

:ig_was_off
setvar $ig_mode 0
pause

:do_ig_thing
killalltriggers
if ($ig_mode = 0)
	send "Y"
	echo "**" & ansi_14 & $taglineb & ansi_15 & " - IG On!**"
else
	send "N"
end
return

:turnsdetect
send "i"
settextlinetrigger turnsdetect_noturns		:turnsdetect_noturns	"Total Holds    :"
settextlinetrigger turnsdetect_gotturns		:turnsdetect_gotturns	"Turns left     : Unlimited"
pause

:turnsdetect_noturns
killalltriggers
setvar $unlim false
waitfor "(?="
return

:turnsdetect_gotturns
killalltriggers
setvar $unlim true
waitfor "(?="
return

:turnsrequired
send "i"
settextlinetrigger turnsrequired_tpw	:turnsrequired_tpw "Turns to Warp  : "
pause

:turnsrequired_tpw
killalltriggers
getword currentline $player~turnsrequired_tpw 5

if ($red_adj > 0)
	# twarp to jmp sector, then into SD sect, then twarp home
	setvar $player~turnsrequired_temp ($player~turnsrequired_tpw * 3)
	if ($_tow > 0)
		# 2 Turns for exporting into other ship and back again
		add $player~turnsrequired_temp 2
		# 3 Turns for initial Port then x into other ship, port & shop, then x and report
		#   b4 heading home
		add $player~turnsrequired_temp 3
	else
		add $player~turnsrequired_temp 1
	end
else
	setvar $player~turnsrequired_temp ($player~turnsrequired_tpw * 2)
	# 1 Turn to port at dock
	add $player~turnsrequired_temp 1
end

setvar $player~turnsrequired $player~turnsrequired_temp
return

#=----------------------------------------------------------------------------------------------------------------
:buyship
cuttext $_trickster $selectedship 1 1
if ($selectedship = "+")
	cuttext $_trickster $selectedship 1 2
end
striptext $selectedship " "
striptext $selectedship "^"

send "S B N Y " & $selectedship & "Y"
settextlinetrigger notenoughcash	:notenoughcash "You can not afford it!"
settextlinetrigger notenoughexp		:notenoughexp "Hey!  You need at least "
settextlinetrigger notcommished     :notcommished "Hey!  You're not commissioned by the Federation to fly the"
settexttrigger makeshipcorp			:makeshipcorp "Should this be a (C)orporate ship or (P)ersonal ship?"
settextlinetrigger nametheship		:nametheship "What do you want to name this ship?"
settextlinetrigger shipsboughtout	:shipsboughtout "Well if that don't beat all, looks like we don't have anymore ships"
pause

:shipsboughtout
killalltriggers
send " * Q Q "
waitfor "<StarDock> Where to?"
setvar $switchboard~message $taglineb & " - The Maximum Allowable Number of Ships Has Been Reached!**"
gosub :switchboard~switchboard
setvar $newshipnumber 0
return

:notenoughexp
killalltriggers
send " Q Q "
waitfor "<StarDock> Where to?"
setvar $switchboard~message $taglineb & " - Not Enough Experience To Buy Ship**"
gosub :switchboard~switchboard
setvar $newshipnumber 0
return

:notcommished
killalltriggers
send " Q Q "
waitfor "<StarDock> Where to?"
setvar $switchboard~message $taglineb & " - Need fed commision to purchase this ship**"
gosub :switchboard~switchboard
setvar $newshipnumber 0
return

:notenoughcash
killalltriggers
send " Q Q "
waitfor "<StarDock> Where to?"
setvar $switchboard~message $taglineb & " - Purchase Failed, Unknown Reason (maybe not enough cash)!**"
gosub :switchboard~switchboard
setvar $newshipnumber 0
return

:makeshipcorp
send "C"
pause

:nametheship
killalltriggers
getrnd $registrynumber 100000 999999
send "LSDREG#" & $registrynumber & "*N * S"
settextlinetrigger purchasedfailed 		:purchasedfailed "You do not own any other ships orbiting the Stardock!"
settextlinetrigger getnewshipnumber		:getnewshipnumber " " & $map~stardock & " " & "LSDREG#" & $registrynumber
settexttrigger gotnewshipnumber			:gotnewshipnumber "Choose which ship to sell "
pause

:purchasedfailed
killalltriggers
send " Q "
waitfor "<StarDock> Where to?"
setvar $switchboard~message $taglineb & " - Purchase Failed**"
gosub :switchboard~switchboard
setvar $newshipnumber 0
return

:gotnewshipnumber
killalltriggers
#send " Q "
send " Q Q Q Z N * X   " & $newshipnumber & "*  *  P S S R Y " & $customshipname & "* Y Q "
waitfor "<StarDock> Where to?"
echo "**" & ansi_14 & "Purchase Success" & ansi_15 & " - New Ship Number is " & ansi_7 & $newshipnumber & "**"
return

:getnewshipnumber
killtrigger getnewshipnumber
killtrigger purchasedfailed
setvar $curline currentline
getwordpos $curline $pos " " & $map~stardock
if ($pos = 0)
	send " Q "
	waitfor "<StarDock> Where to?"
	echo "**" & ansi_14 & "No Ship" & ansi_15 & " - Purchase Failed**"
	halt
end
cuttext $curline $newshipnumber 1 $pos
striptext $newshipnumber " "
pause

:cn1_and_cn9_checking
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
	settexttrigger allkeys_off	:allkeys_off "=-=-=-=-=-=-=-="
	settexttrigger allkey_on	:allkey_on "Warps to Sector(s) : "
else
	send "sn**"
	settexttrigger allkeys_off	:allkeys_off "Warps to Sector(s) : "
	settexttrigger allkey_on	:allkey_on "<B> Transporter Control"
end
pause

:allkeys_off
killtrigger allkeys_off
setvar $allkeys_off true
pause

:allkey_on
killalltriggers
if ($allkeys_off = false)
	send " c n 9 q q"
	waitfor "<Computer deactivated>"
end
return

:parseshipdata
#[]Ship Letter [Ship Name][Cost][ANSI Ship Name]
delete $ships_file
setvar $i 0
send "S B N Y ?"
waitfor "Which ship are you interested in "
settextlinetrigger nextpage		:nextpage "<+> Next Page"

:nextpagereset
settextlinetrigger quit2leave	:quit2leave "<Q> To Leave"

:linetrignext
settextlinetrigger linetrig		:linetrig
pause

:nextpage
killalltriggers
add $i 1
setvar $shiplist[$i] "+"
setvar $shiplist[$i][1] "This Inidcates"
setvar $shiplist[$i][2] "Another"
setvar $shiplist[$i][3] "Page is availble for display"
send "+"
waitfor "Which ship are you interested in "
settextlinetrigger linetrig		:linetrig
settextlinetrigger nextpage		:quit2leave "<+> Next Page"
settextlinetrigger quit2leave	:quit2leave "<Q> To Leave"
pause

:quit2leave
killalltriggers
send " Q Q "
waitfor "<StarDock> Where to? (?="
delete $tstfile
setvar $ii 1
while ($ii <= $i)
	write $ships_file $shiplist[$ii] & #9 & $shiplist[$ii][1] & #9 & $shiplist[$ii][2] & #9 & $shiplist[$ii][3]
	add $ii 1
end
return

:linetrig
setvar $temp currentline & "@@@"

if ($temp <> "@@@")
	getwordpos $temp $pos "<"
	if ($pos = 1)
		getwordpos $temp $pos "<Q>"
		if ($pos = 0)
			add $i 1
			gettext $temp $shiplist[$i] "<" ">"
			gettext $temp $shiplist[$i][1] "> " "  "
			gettext $temp $shiplist[$i][2] "  " "@@@"
			striptext $shiplist[$i][2] " "
			if ($shiplist[$i][2] = "")
				setvar $shiplist[$i][2] "999,999,999"
			end

			gettext currentansiline  $shiplist[$i][3] "[35m> " "  "
		end
	end
end
goto :linetrignext

:loadshipdata
fileexists $test $ships_file
if ($test)
	setvar $i 1
	read $ships_file $line $i
	while (($line <> eof) and ($i <= $shiplistmax))
		getwordpos $line $pos #9
		if ($pos <> 2)
			setvar $shipdata_valid false
			return
		end
		cuttext $line $temp 1 1
		setvar $shiplist[$i] $temp
		cuttext $line $line2 3 999
		setvar $line $line2
		#stripText $Line $temp & #9

		getwordpos $line $pos #9
		if ($pos = 0)
			setvar $shipdata_valid false
			return
		end
		cuttext $line $temp1 1 ($pos - 1)
		setvar $shiplist[$i][1] $temp1
		striptext $line $temp1 & #9

		getwordpos $line $pos #9
		if ($pos = 0)
			setvar $shipdata_valid false
			return
		end
		cuttext $line $temp2 1 ($pos - 1)
		setvar $shiplist[$i][2] $temp2
		striptext $line $temp2 & #9

		setvar $shiplist[$i][3] $line

		:nextrealline
		add $i 1
		read $ships_file $line $i
	end
	setvar $shipdata_valid true
else
	setvar $shipdata_valid false
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:getitems
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

replacetext $cmd $lsd__pad " "

#1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9
#M 0 M M 0 Y M M M Y M M Y M M M 0 D 3 ][LSD][
lowercase $cmd

getword $cmd $_atomics 1
if ($_atomics <> "")
	isnumber $tst $_atomics
	if ($tst)
		if ($_atomics = 0)
			setvar $_atomics ""
		end
	else
		if ($_atomics = "m")
			setvar $_atomics "Max"
		else
			setvar $_atomics ""
		end
	end
end

getword $cmd $_beacons 2
if ($_beacons <> "")
	isnumber $tst $_beacons
	if ($tst)
		if ($_beacons = 0)
			setvar $_beacons ""
		end
	else
		if ($_beacons = "m")
			setvar $_beacons "Max"
		else
			setvar $_beacons ""
		end
	end
end

getword $cmd $_corbo 3
if ($_corbo <> "")
	isnumber $tst $_corbo
	if ($tst)
		if ($_corbo = 0)
			setvar $_corbo ""
		end
	else
		if ($_corbo = "m")
			setvar $_corbo "Max"
		else
			setvar $_corbo ""
		end
	end
end

getword $cmd $_cloak 4
if ($_cloak <> "")
	isnumber $tst $_cloak
	if ($tst)
		if ($_cloak = 0)
			setvar $_cloak ""
		end
	else
		if ($_cloak = "m")
			setvar $_cloak "Max"
		else
			setvar $_cloak ""
		end
	end
end

getword $cmd $_probe 5
if ($_probe <> "")
	isnumber $tst $_probe
	if ($tst)
		if ($_probe = 0)
			setvar $_probe ""
		end
	else
		if ($_probe = "m")
			setvar $_probe "Max"
		else
			setvar $_probe ""
		end
	end
end

getword $cmd $_pscan 6
if ($_pscan <> "")
	if ($_pscan <> "y")
		setvar $_pscan ""
	end
end

getword $cmd $_limps 7
if ($_limps <> "")
	isnumber $tst $_limps
	if ($tst)
		if ($_limps = 0)
			setvar $_limps ""
		end
	else
		if ($_limps = "m")
			setvar $_limps "Max"
		else
			setvar $_limps ""
		end
	end
end

getword $cmd $_mines 8
if ($_mines <> "")
	isnumber $tst $_mines
	if ($tst)
		if ($_mines = 0)
			setvar $_mines ""
		end
	else
		if ($_mines = "m")
			setvar $_mines "Max"
		else
			setvar $_mines ""
		end
	end
end

getword $cmd $_photon 9
if ($_photon <> "")
	isnumber $tst $_photon
	if ($tst)
		if ($_photon = 0)
			setvar $_photon ""
		end
	else
		if ($_photon = "m")
			setvar $_photon "Max"
		else
			setvar $_photon ""
		end
	end
end

getword $cmd $_lrscan 10
if ($_lrscan <> "")
	if ($_lrscan <> "y")
		setvar $_lrscan ""
	end
end

getword $cmd $_disrupt 11
if ($_disrupt <> "")
	isnumber $tst $_disrupt
	if ($tst)
		if ($_disrupt = 0)
			setvar $_disrupt ""
		end
	else
		if ($_disrupt = "m")
			setvar $_disrupt "Max"
		else
			setvar $_disrupt ""
		end
	end
end

getword $cmd $_gentorp 12
if ($_gentorp <> "")
	isnumber $tst $_gentorp
	if ($tst)
		if ($_gentorp = 0)
			setvar $_gentorp ""
		end
	else
		if ($_gentorp = "m")
			setvar $_gentorp "Max"
		else
			setvar $_gentorp ""
		end
	end
end

getword $cmd $_t2twarp 13
if ($_t2twarp <> "")
	if ($_t2twarp <> "y")
		setvar $_t2twarp ""
	end
end

getword $cmd $_holds 14
if ($_holds <> "")
	isnumber $tst $_holds
	if ($tst)
		if ($_holds = 0)
			setvar $_holds ""
		end
	else
		if ($_holds = "m")
			setvar $_holds "Max"
		else
			setvar $_holds ""
		end
	end
end

getword $cmd $_figs 15
if ($_figs <> "")
	isnumber $tst $_figs
	if ($tst)
		if ($_figs = 0)
			setvar $_figs ""
		end
	else
		if ($_figs = "m")
			setvar $_figs "Max"
		else
			setvar $_figs ""
		end
	end
end

getword $cmd $_shields 16
if ($_shields <> "")
	isnumber $tst $_shields
	if ($tst)
		if ($_shields = 0)
			setvar $_shields ""
		end
	else
		if ($_shields = "m")
			setvar $_shields "Max"
		else
			setvar $_shields ""
		end
	end
end

getword $cmd $_tow 17
if ($_tow <> "")
	isnumber $tst $_tow
	if ($tst)
		if ($_tow < 1)
			setvar $_tow 0
		end
	else
		setvar $_tow 0
	end
else
	setvar $_tow 0
end

getword $cmd $_trickster 18
if ($_trickster = "0")
	setvar $_trickster ""
end

getword $cmd $numberofship 19
if ($numberofship <> "")
	isnumber $tst $numberofship
	if ($tst)
		if ($numberofship < 1)
			setvar $numberofship 0
		end
	else
		setvar $numberofship 0
	end
else
	setvar $numberofship 0
end
return

include "source\include\player"
include "source\include\switchboard.ts"
include "source\include\help"
