	gosub :BOT~loadVars

	setVar $SWITCHBOARD~bot_name $bot~bot_name
	setVar $SWITCHBOARD~self_command $self_command
	gosub  :player~currentPrompt
	setvar $startingLocation $PLAYER~current_prompt

	if ($startingLocation = "Citadel")

		setVar $bot~validPrompts "Citadel"
		setVar $bot~startingLocation $startingLocation
		gosub :bot~checkStartingPrompt

		loadVar $psimac_corp_limpet_drop_amt
		if ($psimac_corp_limpet_drop_amt < 1)
			 setVar $psimac_corp_limpet_drop_amt 3
			 saveVar $psimac_corp_limpet_drop_amt
		end
		loadVar $psimac_corp_armid_drop_amt
		if ($psimac_corp_armid_drop_amt < 1)
			 setVar $psimac_corp_armid_drop_amt 1
			 saveVar $psimac_corp_armid_drop_amt
		end
		loadVar $psimac_corp_ftr_drop_amt
		if ($psimac_corp_ftr_drop_amt < 1)
			 setVar $psimac_corp_ftr_drop_amt 1
			 saveVar $psimac_corp_ftr_drop_amt
		end
		setTextLineTrigger getp :getp "Planet #"
		send "q*c "
		pause
		:getp
			getWord CURRENTLINE $planet~planet 2
			stripText $planet~planet "#"
			waitOn "Citadel command (?="
		:print_the__planet_menu
		:planet_menu_without_clear
			echo "**"
			echo ANSI_15 "                       -=( " ANSI_14 "Psi Planet Macros" ANSI_15 " )=-  *"
			echo ANSI_5  " -----------------------------------------------------------------------------*"
			echo ANSI_9 #27&"[35m<"&#27&"[32m1"&#27&"[35m> " & ANSI_14 &"Lay 1 personal limpet" & ANSI_9 & ", land         " & ANSI_11 &#27&"[35m<"&#27&"[32m5"&#27&"[35m> " & ANSI_14 & "Holoscan" & ANSI_9 & ", land*"
			echo #27&"[35m<"&#27&"[32m2"&#27&"[35m> " & ANSI_14 & "Lay " & $psimac_corp_limpet_drop_amt & " corporate " & ANSI_11 & #27&"[35m<"&#27&"[32mL"&#27&"[35m>" & ANSI_14 & "impet(s)" & ANSI_9 & ", land   " & ANSI_11 #27&"[35m<"&#27&"[32m6"&#27&"[35m> " & ANSI_14 & "Lift attack*"
			echo #27&"[35m<"&#27&"[32m3"&#27&"[35m> " & ANSI_14 & "Lay " & $psimac_corp_armid_drop_amt & " corporate " & ANSI_11 & #27&"[35m<"&#27&"[32mA"&#27&"[35m>" & ANSI_14 & "rmid(s)" & ANSI_9 & ", land    " & ANSI_11 #27&"[35m<"&#27&"[32m7"&#27&"[35m> " & ANSI_14 & "Drop " & $psimac_corp_ftr_drop_amt & " corporate " & ANSI_11 & #27&"[35m<"&#27&"[32mF"&#27&"[35m>" & ANSI_14 & "ighter(s)" & ANSI_9 & "*"
			echo #27&"[35m<"&#27&"[32m4"&#27&"[35m> " & ANSI_14 & "Density scan" & ANSI_9 & ", land             " & ANSI_11 & "     " & #27&"[35m<"&#27&"[32m8"&#27&"[35m> " & ANSI_14 & "Launch a mine disrupter" & ANSI_9 & ", land*"
			echo         "*"
			echo #27&"[35m<"&#27&"[32mB"&#27&"[35m> " & ANSI_14 & "Get Xport List" & ANSI_9 & ", land                " ANSI_11 #27&"[35m<"&#27&"[32mE"&#27&"[35m> " & ANSI_14 & "Toggle IG" & ANSI_9 & ", land " ANSI_11 "*"
			echo #27&"[35m<"&#27&"[32mC"&#27&"[35m> " & ANSI_14 & "Xport into ship" & ANSI_9 & ", land               " ANSI_11 #27&"[35m<"&#27&"[32mG"&#27&"[35m> " & ANSI_14 & "Swap Planets*"
			echo #27&"[35m<"&#27&"[32mD"&#27&"[35m> " & ANSI_14 & "Get sector planet list" & ANSI_9 & ", land " ANSI_11 "*"
			echo ANSI_5  " -----------------------------------------------------------------------------**"
		:getPlanetMacroInput
			echo ANSI_10 "Your choice?*"
			getConsoleInput $chosen_option SINGLEKEY
			upperCase $chosen_option
			killalltriggers
		:process_command2
			if ($chosen_option = "1")
				goto :perslimp
			elseif ($chosen_option = "2")
				goto :corplimp
			elseif ($chosen_option = "3")
				goto :corparm
			elseif ($chosen_option = "4")
				gosub :dscan2
				halt
			elseif ($chosen_option = "5")
				gosub :hscan
				halt
			elseif ($chosen_option = "6")
				goto :lifta
			elseif ($chosen_option = "7")
				goto :dropfig
			elseif ($chosen_option = "8")
				gosub :PLAYER~quikstats
				if ($PLAYER~MINE_DISRUPTORS > 0)
					getInput $test "Sector to disrupt: "
					isNumber $numtest $test
					if ($numtest < 1)
						echo ANSI_12 "**Bad sector number!*"
						goto :planetMacMenu
					end
					if ($test > SECTORS) OR ($test <= 10)
						echo ANSI_12 "**Bad sector number!*"
						goto :planetMacMenu
					end
					send "q q c  w  y" & $test & "*  *  *  q  l " $planet~planet "* c s*  "
					waitOn "Computer command [TL="
					waitOn "Citadel command (?=help)"
					halt
				else
					setvar $switchboard~message "Out of mine disruptors!*"
					gosub :switchboard~switchboard
					halt
				end
			elseif ($chosen_option = "B")
				send "q q  x* *    l j"&#8&$planet~planet&"* c @"
				waitOn "Average Interval Lag:"
				halt
			elseif ($chosen_option = "C")
				# Get and check input
				getInput $shipnum "Ship number to xport to: "
				isNumber $numtest $shipnum
				if ($numtest < 1)
				   echo ANSI_12 "*Invalid ship number!*"
				   halt
				end
				if ($shipnum < 1) OR ($shipnum > 65000)
				   echo ANSI_12 "*Invalid ship number!*"
				   halt
				end
				setVar $msg ""
				killalltriggers
				setTextLineTrigger tdet_trg1 :txport_notavail2 "That is not an available ship."
				setTextLineTrigger tdet_trg2 :txport_badrange2 "only has a transport range of"
				setTextLineTrigger tdet_trg3 :txport_security2 "SECURITY BREACH! Invalid Password, unable to link transporters."
				setTextLineTrigger tdet_trg4 :txport_noaccess2 "Access denied!"
				setTextLineTrigger tdet_trg5 :txport_xprtgood2 "Security code accepted, engaging transporter control."
				setTextTrigger tdet_trg6 :txport_go_ahead2 "Average Interval Lag:"
				send "q q  x    " & $shipnum & "    *    *    *    l j"&#8&$planet~planet&"*  @"
				pause
				goto :print_the__planet_menu
				:txport_notavail2
					setVar $msg ANSI_12 & "**That ship is not available.*"
					pause
				:txport_badrange2
					 setVar $msg ANSI_12 & "**That ship is too far away.*"
					 pause
				:txport_security2
					 setVar $msg ANSI_12 & "**That ship is passworded.*"
					 pause
				:txport_noaccess2
					 setVar $msg ANSI_12 & "**Cannot access that ship.*"
					 pause
				:txport_xprtgood2
					 setVar $msg ANSI_10 & "**Xport good!*"
					 pause
				:txport_go_ahead2
					gosub :PLAYER~quikstats
					if ($PLAYER~CURRENT_PROMPT = "Planet")
						send "c "
					end
					killalltriggers
					echo $msg
					halt
			elseif ($chosen_option = "D")
				send "q q  lj"&#8&$planet~planet&"* c @"
				waitOn "Average Interval Lag:"
				halt
			elseif ($chosen_option = "E")
				send "q q b z y  l j"&#8&$planet~planet&"* c @"
				waitOn "Average Interval Lag:"
				halt
			elseif ($chosen_option = "G")
				getInput $test "Planet to Swap to:: "
				isNumber $numtest $test
				if ($numtest < 1)
					  echo ANSI_12 "**Not a Planet Number!*"
					  goto :planetMacMenu
				else
					setvar $psimac_planet_swap "q q l "&$test&"*"&$planet~planet&"* c"
					send $psimac_planet_swap
				end
				halt
			elseif ($chosen_option = "F")
				getInput $test "Fighters to deploy: "
				isNumber $numtest $test
				if ($numtest < 1)
					echo ANSI_12 "**Bad fighter count!*"
				elseif ($test <= 0)
					setVar $psimac_corp_ftr_drop_amt 1
					saveVar $psimac_corp_ftr_drop_amt
				else
					setVar $psimac_corp_ftr_drop_amt $test
					saveVar $psimac_corp_ftr_drop_amt
				end
				goto :print_the__planet_menu
			elseif ($chosen_option = "L")
				getInput $test "Limpets to deploy: "
				isNumber $numtest $test
				if ($numtest < 1)
					echo ANSI_12 "**Bad limpet count!*"
				elseif ($test > 250)
					setVar $psimac_corp_limpet_drop_amt 250
					saveVar $psimac_corp_limpet_drop_amt
				elseif ($test <= 0)
					setVar $psimac_corp_limpet_drop_amt 1
					saveVar $psimac_corp_limpet_drop_amt
				else
					setVar $psimac_corp_limpet_drop_amt $test
					saveVar $psimac_corp_limpet_drop_amt
				end
				goto :print_the__planet_menu
			elseif ($chosen_option = "A")
				getInput $test "Armids to deploy: "
				isNumber $numtest $test
				if ($numtest < 1)
					echo ANSI_12 "**Bad armid count!*"
				elseif ($test > 250)
					setVar $psimac_corp_armid_drop_amt 250
					saveVar $psimac_corp_armid_drop_amt
				elseif ($test <= 0)
					setVar $psimac_corp_armid_drop_amt 1
					saveVar $psimac_corp_armid_drop_amt
				else
					setVar $psimac_corp_armid_drop_amt $test
					saveVar $psimac_corp_armid_drop_amt
				end
				goto :print_the__planet_menu
			else
				halt
			end
		:perslimp
		gosub :PLAYER~quikstats
		if ($PLAYER~LIMPETS > 0)
			send "q q z n h21  *  p z n n * l " $planet~planet "* c s* "
			setVar $depType "limpets"
			setTextLineTrigger toomanypl :toomany "!  You are limited to "
			setTextLineTrigger plclear :plclear "Done. You have "
			setTextLineTrigger enemypl :noperdown "These mines are not under your control."
			pause
		else
			setvar $switchboard~message "Out of limpets!*"
			gosub :switchboard~switchboard
			halt
		end
		:plclear
		killalltriggers
		waitOn "Citadel command (?=help)"
		send "s* "
		setTextLineTrigger perdown :perdown "(Type 2 Limpet) (yours)"
		setTextLineTrigger noperdown :noperdown "Citadel treasury contains"
		pause
		:perdown
		killalltriggers
		setvar $switchboard~message "Personal Limpet Deployed!*"
		gosub :switchboard~switchboard
		halt
		:noperdown
		killalltriggers
		setvar $switchboard~message "Sector already has enemy limpets present!*"
		gosub :switchboard~switchboard
		halt
		:corplimp
		gosub :PLAYER~quikstats

		if ($PLAYER~LIMPETS > 0)
			send "q q z n h2z" & $psimac_corp_limpet_drop_amt & "* z c *  l " $planet~planet "* c s* "
			if ($psimac_corp_limpet_drop_amt > 1)
				setVar $depType "Limpets"
			else        
				setVar $depType "Limpet"    
			end
			setTextLineTrigger toomanycl :toomany "!  You are limited to "
			setTextLineTrigger clclear :clclear "Done. You have "
			setTextLineTrigger enemycl :nocldown "These mines are not under your control."
			setTextLineTrigger notenoughcl :notenough "You don't have that many mines available."
			pause
		else
			setvar $switchboard~message "Out of limpets!*"
			gosub :switchboard~switchboard
			halt
		end
		:clclear
		killalltriggers
		waitOn "Citadel command (?=help)"
		send "s* "
		setTextLineTrigger cldown :cldown "(Type 2 Limpet) (belong to your Corp)"
		setTextLineTrigger nocldown :nocldown "Citadel treasury contains"
		pause
		:cldown
		killalltriggers
		setvar $switchboard~message ""&$psimac_corp_limpet_drop_amt&" Corporate "&$depType&" Deployed!*"
		gosub :switchboard~switchboard
		halt
		:nocldown
		killalltriggers
		setvar $switchboard~message "Sector already has enemy limpets present!*"
		gosub :switchboard~switchboard
		halt
		#lays a corp armid
		:corparm
		gosub :PLAYER~quikstats
		if ($PLAYER~ARMIDS > 0)
			if ($psimac_corp_armid_drop_amt > 1)
				setVar $depType "Armids"
			else
				setVar $depType "Armid"
			end
			send "q q z n h1z" & $psimac_corp_armid_drop_amt & " * z c *  l " $planet~planet "* c s* "
			setTextLineTrigger toomanya :toomany "!  You are limited to "
			setTextLineTrigger aclear :aclear "Done. You have "
			setTextLineTrigger enemya :noadown "These mines are not under your control."
			setTextLineTrigger notenoughca :notenough "You don't have that many mines available."
			pause
		else
			setvar $switchboard~message "Out of armids!*"
			gosub :switchboard~switchboard
			halt
		end
		:aclear
		killalltriggers
		waitOn "Citadel command (?=help)"
		send "s* "
		setTextLineTrigger adown :adown "(Type 1 Armid) (belong to your Corp)"
		setTextLineTrigger noadown :noadown "Citadel treasury contains"
		pause
		:adown
		killalltriggers
		setvar $switchboard~message $psimac_corp_armid_drop_amt&" Corporate"&$depType&" Deployed!*"
		gosub :switchboard~switchboard
		halt
		:noadown
		killalltriggers
		setvar $switchboard~message "Sector already has enemy armids present!*"
		gosub :switchboard~switchboard
		halt
		:dscan2
		send "q q z n sdzn l " $planet~planet "* c  "
		waitOn "<Enter Citadel>"
		waitOn "Citadel command (?=help)"
		gosub :MAP~displayAdjacentGridAnsi
		return
		:hscan
		send "q q z n s hzn* l " $planet~planet "*  c  "
		waitOn "<Enter Citadel>"
		waitOn "Citadel command (?=help)"
		gosub :MAP~displayAdjacentGridAnsi
		return
		:lifta
		send "q q z n a y y " $ship~SHIP_MAX_ATTACK "* * z n q z n  l " $planet~planet "*  m  *** c s* @"
		waitOn "Average Interval Lag:"
		goto :getPlanetMacroInput
		:dropfig
		gosub :PLAYER~quikstats
		if ($player~fighters > 0)
			send " q q f z" & $psimac_corp_ftr_drop_amt & "* z c d *  l " $planet~planet "* c s* "
			if ($psimac_corp_ftr_drop_amt > 1)
				setVar $depType "Fighters"
			else
				setVar $depType "Fighter"
			end
			setTextLineTrigger toomanyfig :toomany "Too many fighters in your fleet!"
			setTextLineTrigger figclear :figclear " fighter(s) in close support."
			setTextLineTrigger enemyfig :nofigdown "These fighters are not under your control."
			pause
		else
			 setvar $switchboard~message "Out of fighters!*"
			 gosub :switchboard~switchboard
			 halt
		end
		:figclear
		killalltriggers
		waitOn "Citadel command (?=help)"
		send "s* "
		setTextLineTrigger figdown :figdown "(belong to your Corp) [Defensive]"
		setTextLineTrigger nofigdown :nofigdown "Citadel treasury contains"
		pause
		:figdown
		killalltriggers
		setvar $switchboard~message ""&$psimac_corp_ftr_drop_amt&" Corporate "&$depType&" Deployed!*"
		setVar $target $PLAYER~CURRENT_SECTOR
		gosub :bot~addfigtodata
		gosub :switchboard~switchboard
		halt
		:nofigdown
		killalltriggers
		setvar $switchboard~message "Sector already has enemy fighters present!*"
		gosub :switchboard~switchboard
		halt
		:toomany
		killalltriggers
		waitOn "<Scan Sector>"
		waitOn "Citadel command (?=help)"
		clientMessage "Ship cannot carry that many " & $depType & "!"
		clientMessage "No " & $depType & " were deployed!"
		halt
		:notenough
		killalltriggers
		waitOn "<Scan Sector>"
		waitOn "Citadel command (?=help)"
		clientMessage "Ship doesn't have that many " & $depType & "!"
		clientMessage "No " & $depType & " were deployed!"
		halt
		:donePsiMacs
			echo #27 "[30D                           " #27 "[30D"
			halt
elseif (($startingLocation = "Do") OR ($startingLocation = "How"))
		:print_the__terra_menu
			gosub :PLAYER~quikstats
			echo "[2J"
		:terra_menu_without_clear
			echo "*"
			echo ANSI_15 "               -=( " ANSI_12 "M()M Terra Survival Toolkit" ANSI_15 " )=-  "&ANSI_7&"*"
			echo ANSI_5  " -----------------------------------------------------------------------------"&ANSI_7&"*"
			echo ANSI_9&#27&"[35m<"&#27&"[32m1"&#27&"[35m> " & ANSI_14 & " display Terra sector" & ANSI_9 & ", land       " #27&"[35m<"&#27&"[32m5"&#27&"[35m> " & ANSI_14 & " check twarp lock" & ANSI_9 & ", land*"
			echo #27&"[35m<"&#27&"[32m2"&#27&"[35m> " & ANSI_14 & " holoscan" & ANSI_9 & ", land                   " #27&"[35m<"&#27&"[32m6"&#27&"[35m> " & ANSI_14 & " lift, twarp out*"
			echo #27&"[35m<"&#27&"[32m3"&#27&"[35m> " & ANSI_14 & " density scan" & ANSI_9 & ", land               " #27&"[35m<"&#27&"[32m7"&#27&"[35m> " & ANSI_14 & " lift, lock tow" & ANSI_9 & ", twarp out*"
			echo #27&"[35m<"&#27&"[32m4"&#27&"[35m> " & ANSI_14 & " get xport list" & ANSI_9 & ", land             " #27&"[35m<"&#27&"[32m8"&#27&"[35m> " & ANSI_14 & " xport" & ANSI_9 & ", land*"
			echo         "*"
			echo #27&"[35m<"&#27&"[32mA"&#27&"[35m> " & ANSI_14 & " set avoid" & ANSI_9 & ",land                   " #27&"[35m<"&#27&"[32mE"&#27&"[35m> " & ANSI_14 & " lift, cloak out*"
			echo #27&"[35m<"&#27&"[32mB"&#27&"[35m> " & ANSI_14 & " clear avoided sector" & ANSI_9 & ", land       " #27&"[35m<"&#27&"[32mF"&#27&"[35m> " & ANSI_14 & " C U Y (enable t-warp)" & ANSI_9 & " ,land*"
			echo #27&"[35m<"&#27&"[32mC"&#27&"[35m> " & ANSI_14 & " plot course" & ANSI_9 & ", land                " #27&"[35m<"&#27&"[32mG"&#27&"[35m> " & ANSI_14 & " toggle cn9" & ANSI_9 & ", land*"
			echo #27&"[35m<"&#27&"[32mD"&#27&"[35m> " & ANSI_14 & " get corpie locations" & ANSI_9 & ", land       *"
			echo ANSI_5  " -----------------------------------------------------------------------------**"
			echo ANSI_10 "Your choice?*"
				getConsoleInput $chosen_option SINGLEKEY
				upperCase $chosen_option
				killalltriggers
		:process_command
			if ($chosen_option = "1")
				 send "* * dl 1*  "
				 gosub :PLAYER~quikstats
			elseif ($chosen_option = "2")
				 send "* * shl 1*   "
				 gosub :PLAYER~quikstats
			elseif ($chosen_option = "3")
				send "* * sdl 1*  "
				gosub :PLAYER~quikstats
			elseif ($chosen_option = "4")
				send "* *  x**    l 1*  "
				gosub :PLAYER~quikstats
			elseif ($chosen_option = "5")
				 if ($PLAYER~TWARP = "No")
					   echo ANSI_12 "**Cannot T-warp. No Twarp drive!*"
					   halt
				 elseif ($player~ore_holds < 3)
					   echo ANSI_12 "**Cannot T-warp. No ore!*"
					   halt
				 end
				 getInput $sector "T-Warp to: "
				 isNumber $numtest $sector
				 if ($numtest < 1)
					   echo ANSI_12 "**Invalid sector number!*"
					   halt
				 end
				 if ($sector < 1) OR ($sector > SECTORS)
					   echo ANSI_12 "**Invalid sector number!*"
					   halt
				 end
				 setVar $msg ""
				 killalltriggers
				 setTextLineTrigger tdet_trg1 :tdet_blnd "Do you want to make this jump blind?"
				 setTextLineTrigger tdet_trg2 :tdet_fuel "You do not have enough Fuel Ore to make the jump."
				 setTextLineTrigger tdet_trg3 :tdet_good "Locating beam pinpointed, TransWarp Locked."
				 setTextTrigger tdet_trg4 :tdet_dock "Do you wish to (L)eave or (T)ake Colonists?"
				 send "* *   m  " & $sector & "  *  y*  *  *  l 1*   "
				 pause
				 goto :print_the_menu
				 :tdet_blnd
					 setVar $msg ANSI_12 & "**No fighter lock exists. Blind warp hazard!!*"
					 pause
				 :tdet_fuel
					 setVar $msg ANSI_12 & "**Not enough ore for that jump!*"
					 pause
				 :tdet_good
					 setVar $msg ANSI_10 & "**Fighter lock found. Looks good!*"
					 pause
				 :tdet_dock
					 gosub :PLAYER~quikstats
					 killalltriggers
					 echo $msg
					 halt
			elseif ($chosen_option = "6")
				 if ($PLAYER~TWARP = "No")
					   echo ANSI_12 "**Cannot T-warp. No Twarp drive!*"
					   halt
				 elseif ($player~ore_holds < 3)
					   echo ANSI_12 "**Cannot T-warp. No ore!*"
					   halt
				 end
				 getInput $sector "T-Warp to: "
				 isNumber $numtest $sector
				 if ($numtest < 1)
					   echo ANSI_12 "**Invalid sector number!*"
					   halt
				 end
				 if ($sector < 1) OR ($sector > SECTORS)
					   echo ANSI_12 "**Invalid sector number!*"
					   halt
				 end
				 send "* *  m  " & $sector & "  *  y  y  *  *"
				 gosub :PLAYER~quikstats
				 if ($PLAYER~CURRENT_SECTOR = 1)
				send "l 1*  "
				 end
				 halt
			elseif ($chosen_option = "7")
				 if ($PLAYER~TWARP = "No")
					   echo ANSI_12 "*Cannot T-warp. No Twarp drive!*"
					   halt
				 elseif ($player~ore_holds < 3)
					   echo ANSI_12 "*Cannot T-warp. No ore!*"
					   halt
				 end
				 getInput $shipnum "Ship number to tow: "
				 isNumber $numtest $shipnum
				 if ($numtest < 1)
					   echo ANSI_12 "*Invalid ship number!*"
					   halt
				 end
				 if ($shipnum < 1) OR ($shipnum > 65000)
					   echo ANSI_12 "*Invalid ship number!*"
					   halt
				 end
				 getInput $sector "T-Warp to: "
				 isNumber $numtest $sector
				 if ($numtest < 1)
					   echo ANSI_12 "*Invalid sector number!*"
					   halt
				 end
				 if ($sector < 1) OR ($sector > SECTORS)
					   echo ANSI_12 "*Invalid sector number!*"
					   halt
				 end
				 send "* * w  *  *  w  *" & $shipnum & "*  *  m  " & $sector & "  *  y  y  *  *"
				 gosub :PLAYER~quikstats
				 if ($PLAYER~CURRENT_SECTOR = 1)
				send "l 1*  "
				 end
				 halt
			elseif ($chosen_option = "8")
				 getInput $shipnum "Ship number to xport to: "
				 isNumber $numtest $shipnum
				 if ($numtest < 1)      
					   echo ANSI_12 "*Invalid ship number!*"
					   halt
				 end
				 if ($shipnum < 1) OR ($shipnum > 65000)
					   echo ANSI_12 "*Invalid ship number!*"
					   halt
				 end
				 setVar $msg ""
				 killalltriggers
				 setTextLineTrigger tdet_trg1 :txport_notavail "That is not an available ship."
				 setTextLineTrigger tdet_trg2 :txport_badrange "only has a transport range of"
				 setTextLineTrigger tdet_trg3 :txport_security "SECURITY BREACH! Invalid Password, unable to link transporters."
				 setTextLineTrigger tdet_trg4 :txport_noaccess "Access denied!"
				 setTextLineTrigger tdet_trg5 :txport_xprtgood "Security code accepted, engaging transporter control."
				 setTextTrigger tdet_trg6 :txport_go_ahead "Do you wish to (L)eave or (T)ake Colonists?"
						 setTextTrigger tdet_trg7 :txport_go_ahead "That planet is not in this sector."
						 setTextTrigger tdet_trg8 :txport_go_ahead "Are you sure you want to jettison all cargo? (Y/N)"
				 send "* *  x    z" & $shipnum & "*  *    l j"&#8&" 1*  "
				 pause
				 goto :print_the_menu
				 :txport_notavail
					 setVar $msg ANSI_12 & "**That ship is not available.*"
					 pause
				 :txport_badrange
					 setVar $msg ANSI_12 & "**That ship is too far away.*"
					 pause
				 :txport_security
					 setVar $msg ANSI_12 & "**That ship is passworded.*"
					 pause
				 :txport_noaccess
					 setVar $msg ANSI_12 & "**Cannot access that ship.*"
					 pause
				 :txport_xprtgood
					 setVar $msg ANSI_10 & "**Xport good!*"
					 pause
				 :txport_go_ahead
					 killalltriggers
					 echo $msg
					 halt
			elseif ($chosen_option = "A")
				 getInput $sector "To sector: "
				 isNumber $numtest $sector
				 if ($numtest < 1)
					   echo ANSI_12 "**Invalid sector number!*"
					   halt
				 end
				 if ($sector < 1) OR ($sector > SECTORS)
					   echo ANSI_12 "**Invalid sector number!*"
					   halt
				 end        
				 send "* *  c  v  " & $sector & "*  q  l 1*  "
				 gosub :PLAYER~quikstats
			elseif ($chosen_option = "B")
				 getInput $sector "To sector: "
				 isNumber $numtest $sector
				 if ($numtest < 1)
					   echo ANSI_12 "**Invalid sector number!*"
					   halt
				 end
				 if ($sector < 1) OR ($sector > SECTORS)
					   echo ANSI_12 "**Invalid sector number!*"
					   halt
				 end
				 send "* *  c  v  0  *  y  n  " & $sector & "*  q  l 1*  "
				 gosub :PLAYER~quikstats
			elseif ($chosen_option = "C")
				 getInput $sector "To sector: "
				 isNumber $numtest $sector
				 if ($numtest < 1)
					   echo ANSI_12 "**Invalid sector number!*"
					   halt
				 end
				 if ($sector < 1) OR ($sector > SECTORS)
					   echo ANSI_12 "**Invalid sector number!*"
					   halt
				 end
				 send "^f*" & $sector & "*q"
				 waitOn "ENDINTERROG"
			elseif ($chosen_option = "E")
				 if ($player~cloaks > 0)
					  echo ANSI_11 "*Are you sure you want to cloak out? (y/N)*"
					  getConsoleInput $choice singlekey
					  upperCase $choice
					  if ($choice = "Y")
						   send "* * q  y  y"
					  else
						   echo ANSI_12 & "**Aborting cloak-out.*"
						   halt
					  end
					  halt
				 else
					  echo ANSI_12 & "**You have no cloaking devices!*"
				 end
			elseif ($chosen_option = "D")
				 send "* *  t  aq  l 1*  "
				 gosub :PLAYER~quikstats
			elseif ($chosen_option = "G")
				 send "* *  c  n  9q  q  l 1*  "
				 gosub :PLAYER~quikstats
			elseif ($chosen_option = "F")
				 send "* * c  u  y  q  l 1*  "
				 gosub :PLAYER~quikstats
			else
				 halt
			end
		halt
		:doneTerraKit
			echo #27 "[30D                           " #27 "[30D"
			halt

else 
		setVar $bot~validPrompts "<StarDock> <Hardware <Libram <FedPolice> <Shipyards> <Tavern> Do How Citadel"
		setVar $bot~startingLocation $startingLocation
		gosub :bot~checkStartingPrompt

		:print_the_menu
		gosub :PLAYER~quikstats
		echo "[2J"
		:menu_without_clear
		echo "*"
		echo ANSI_15 "               -=( " ANSI_12 "Dnyarri's Dock Survival Toolkit" ANSI_15 " )=-  *"
		echo ANSI_5  " -----------------------------------------------------------------------------*"
		echo ANSI_9 #27&"[35m<"&#27&"[32m1"&#27&"[35m> " & ANSI_14 & " display stardock sector" & ANSI_9 & ", re-dock " #27&"[35m<"&#27&"[32m6"&#27&"[35m> " & ANSI_14 & " check twarp lock" & ANSI_9 & ", re-dock*"
		echo #27&"[35m<"&#27&"[32m2"&#27&"[35m> " & ANSI_14 & " holoscan" & ANSI_9 & ", re-dock                " #27&"[35m<"&#27&"[32m7"&#27&"[35m> " & ANSI_14 & " twarp out*"
		echo #27&"[35m<"&#27&"[32m3"&#27&"[35m> " & ANSI_14 & " density scan" & ANSI_9 & ", re-dock            " #27&"[35m<"&#27&"[32m8"&#27&"[35m> " & ANSI_14 & " lock tow" & ANSI_9 & ", twarp out*"
		echo #27&"[35m<"&#27&"[32m4"&#27&"[35m> " & ANSI_14 & " get xport list" & ANSI_9 & ", re-dock          " #27&"[35m<"&#27&"[32m9"&#27&"[35m> " & ANSI_14 & " xport" & ANSI_9 & ", re-dock*"
		echo #27&"[35m<"&#27&"[32m5"&#27&"[35m> " & ANSI_14 & " get planet list" & ANSI_9 & ", re-dock         *"
		echo         "*"
		echo #27&"[35m<"&#27&"[32mA"&#27&"[35m> " & ANSI_14 & " launch mine disruptor" & ANSI_9 & ", re-dock   " #27&"[35m<"&#27&"[32mE"&#27&"[35m> " & ANSI_14 & " make a planet" & ANSI_9 & ", re-dock*"
		echo #27&"[35m<"&#27&"[32mB"&#27&"[35m> " & ANSI_14 & " set avoid" & ANSI_9 & ",re-dock                " #27&"[35m<"&#27&"[32mF"&#27&"[35m> " & ANSI_14 & " land on planet and drop ore" & ANSI_9 & ", re-dock*"
		echo #27&"[35m<"&#27&"[32mC"&#27&"[35m> " & ANSI_14 & " clear avoided sector" & ANSI_9 & ", re-dock    " #27&"[35m<"&#27&"[32mG"&#27&"[35m> " & ANSI_14 & " land on planet and take all" & ANSI_9 & ", re-dock*"
		echo #27&"[35m<"&#27&"[32mD"&#27&"[35m> " & ANSI_14 & " plot course" & ANSI_9 & ", re-dock             " #27&"[35m<"&#27&"[32mH"&#27&"[35m> " & ANSI_14 & " land on and destroy planet" & ANSI_9 & ", re-dock*"
		echo "*"
		echo #27&"[35m<"&#27&"[32mZ"&#27&"[35m> " & ANSI_14 & " cloak out*"
		echo #27&"[35m<"&#27&"[32mL"&#27&"[35m> " & ANSI_14 & " get corpie locations" & ANSI_9 & ", re-dock*"
		echo #27&"[35m<"&#27&"[32mW"&#27&"[35m> " & ANSI_14 & " C U Y (enable t-warp)" & ANSI_9 & " ,re-dock*"
		echo #27&"[35m<"&#27&"[32mT"&#27&"[35m> " & ANSI_14 & " toggle cn9" & ANSI_9 & ", re-dock*"
		echo #27&"[35m<"&#27&"[32mO"&#27&"[35m> " & ANSI_14 & " Ore Swapper X-port*"
		echo ANSI_5  " -----------------------------------------------------------------------------**"
		echo ANSI_10 "Your choice?*"
			getConsoleInput $chosen_option SINGLEKEY
			upperCase $chosen_option
			killalltriggers
		:process_command
		if ($chosen_option = "1")
			 send "qqq  z  n  dp  s  s "
				 waitOn "Landing on Federation StarDock."
			 waitOn "<Shipyards> Your option (?)"
		elseif ($chosen_option = "2")
			 send "qqq  z  n  sh*  p  s  s "
			 waitOn "Landing on Federation StarDock."
			 gosub :PLAYER~quikstats
			 waitOn "<Shipyards> Your option (?)"
		elseif ($chosen_option = "3")
			 send "qqq  z  n  sdp  s  s "
			 waitOn "Landing on Federation StarDock."
			 waitOn "<Shipyards> Your option (?)"
		elseif ($chosen_option = "4")
			 send "qqq  z  n  x**    p  s  s "
			 waitOn "Landing on Federation StarDock."
			 waitOn "<Shipyards> Your option (?)"
		elseif ($chosen_option = "5")
			 send "qqq  z  n  l*  q  q  z  n  p  s  s "
			 waitOn "Landing on Federation StarDock."
			 waitOn "<Shipyards> Your option (?)"
		elseif ($chosen_option = "6")
			 if ($PLAYER~TWARP = "No")
				   echo ANSI_12 "**Cannot T-warp. No Twarp drive!*"
				   halt
			 elseif ($player~ore_holds < 3)
				   echo ANSI_12 "**Cannot T-warp. No ore!*"
				   halt
			 end
			 getInput $sector "T-Warp to: "
			 isNumber $numtest $sector
			 if ($numtest < 1)
				   echo ANSI_12 "**Invalid sector number!*"
				   halt
			 end
			 if ($sector < 1) OR ($sector > SECTORS)
				   echo ANSI_12 "**Invalid sector number!*"
				   halt
			 end
			 setVar $msg ""
				 killalltriggers
			 setTextLineTrigger det_trg1 :det_blnd "Do you want to make this jump blind?"
			 setTextLineTrigger det_trg2 :det_fuel "You do not have enough Fuel Ore to make the jump."
			 setTextLineTrigger det_trg3 :det_good "Locating beam pinpointed, TransWarp Locked."
			 setTextLineTrigger det_trg4 :det_dock "Landing on Federation StarDock."
			 send "qqq  z  n  m  " & $sector & "  *  yn  *  *  p  s  s "
			 pause
			 goto :print_the_menu
			 :det_blnd
				 setVar $msg ANSI_12 & "**No fighter lock exists. Blind warp hazard!!*"
				 pause
			 :det_fuel
				 setVar $msg ANSI_12 & "**Not enough ore for that jump!*"
				 pause
			 :det_good
				 setVar $msg ANSI_10 & "**Fighter lock found. Looks good!*"
				 pause
			 :det_dock
				 waitOn "<Shipyards> Your option (?)"
					 killalltriggers
				 echo $msg
				 halt
		elseif ($chosen_option = "7")
			 if ($PLAYER~TWARP = "No")
				   echo ANSI_12 "**Cannot T-warp. No Twarp drive!*"
				   halt
			 elseif ($player~ore_holds < 3)
				   echo ANSI_12 "**Cannot T-warp. No ore!*"
				   halt
			 end
			 getInput $sector "T-Warp to: "
			 isNumber $numtest $sector
			 if ($numtest < 1)
				   echo ANSI_12 "**Invalid sector number!*"
				   halt
			 end
			 if ($sector < 1) OR ($sector > SECTORS)
				   echo ANSI_12 "**Invalid sector number!*"
				   halt
			 end
			 send "qqq  z  n  m  " & $sector & "  *  y  y  *  *"
			 halt
		elseif ($chosen_option = "8")
			 if ($PLAYER~TWARP = "No")
				   echo ANSI_12 "*Cannot T-warp. No Twarp drive!*"
				   halt
			 elseif ($player~ore_holds < 3)
				   echo ANSI_12 "*Cannot T-warp. No ore!*"
				   halt
			 end
			 getInput $shipnum "Ship number to tow: "
			 isNumber $numtest $shipnum
			 if ($numtest < 1)
				   echo ANSI_12 "*Invalid ship number!*"
				   halt
			 end
			 if ($shipnum < 1) OR ($shipnum > 65000)
				   echo ANSI_12 "*Invalid ship number!*"
				   halt
			 end
			 getInput $sector "T-Warp to: "
			 isNumber $numtest $sector
			 if ($numtest < 1)
				   echo ANSI_12 "*Invalid sector number!*"
				   halt
			 end
			 if ($sector < 1) OR ($sector > SECTORS)
				   echo ANSI_12 "*Invalid sector number!*"
				   halt
			 end
			 send "qqq  z  n  w  n  *  w  n" & $shipnum & "*  *  m  " & $sector & "  *  y  y  *  *"
			 halt
		elseif ($chosen_option = "9")
			 getInput $shipnum "Ship number to xport to: "
			 isNumber $numtest $shipnum
			 if ($numtest < 1)
				   echo ANSI_12 "*Invalid ship number!*"
				   halt
			 end
			 if ($shipnum < 1) OR ($shipnum > 65000)
				   echo ANSI_12 "*Invalid ship number!*"
				   halt
			 end
			 setVar $msg ""
				 killalltriggers
			 setTextLineTrigger det_trg1 :xport_notavail "That is not an available ship."
			 setTextLineTrigger det_trg2 :xport_badrange "only has a transport range of"
			 setTextLineTrigger det_trg3 :xport_security "SECURITY BREACH! Invalid Password, unable to link transporters."
			 setTextLineTrigger det_trg4 :xport_noaccess "Access denied!"
			 setTextLineTrigger det_trg5 :xport_xprtgood "Security code accepted, engaging transporter control."
			 setTextLineTrigger det_trg6 :xport_go_ahead "Landing on Federation StarDock."
			 send "qqq  z  n  x    " & $shipnum & "    *    *    *    p  s  s "
			 pause
			 goto :print_the_menu
			 :xport_notavail
				 setVar $msg ANSI_12 & "**That ship is not available.*"
				 pause
			 :xport_badrange
				 setVar $msg ANSI_12 & "**That ship is too far away.*"
				 pause
			 :xport_security
				 setVar $msg ANSI_12 & "**That ship is passworded.*"
				 pause
			 :xport_noaccess
				 setVar $msg ANSI_12 & "**Cannot access that ship.*"
				 pause
			 :xport_xprtgood
				 setVar $msg ANSI_10 & "**Xport good!*"
				 pause
			 :xport_go_ahead
				 gosub :PLAYER~quikstats
				 waitOn "<Shipyards> Your option (?)"
					 killalltriggers
				 echo $msg
				 halt
		elseif ($chosen_option = "A")
			 getInput $sector "To sector: "
			 isNumber $numtest $sector
			 if ($numtest < 1)
				   echo ANSI_12 "**Invalid sector number!*"
				   halt
			 end
			 if ($sector < 1) OR ($sector > SECTORS)
				   echo ANSI_12 "**Invalid sector number!*"
				   halt
			 end
			 setVar $msg ""
				 killalltriggers
			 setTextLineTrigger det_trg1 :dis_nadj "That is not an adjacent sector"
			 setTextLineTrigger det_trg2 :dis_ndis "You do not have any Mine Disruptors!"
			 setTextLineTrigger det_trg3 :dis_done "Disruptor launched into sector"
			 setTextLineTrigger det_trg4 :dis_okay "Landing on Federation StarDock."
			 send "qqq  z  n  c  w  y  " & $sector & "  *  q  q  q  z  n  p  s  h "
			 pause
			 :dis_nadj
				 setVar $msg ANSI_10 & "**That sector isn't adjacent to StarDock.*"
				 pause
			 :dis_ndis
				 setVar $msg ANSI_10 & "**Out of disruptors.*"
				 pause
			 :dis_done
				 setVar $msg ANSI_10 & "**Disruptor launched!*"
				 pause
			 :dis_okay
				 gosub :PLAYER~quikstats
				 waitOn "<Hardware Emporium> So what are you looking for (?)"
					 killalltriggers
				 echo $msg
				 halt
		elseif ($chosen_option = "B")
			 getInput $sector "To sector: "
			 isNumber $numtest $sector
			 if ($numtest < 1)
				   echo ANSI_12 "**Invalid sector number!*"
				   halt
			 end
			 if ($sector < 1) OR ($sector > SECTORS)
				   echo ANSI_12 "**Invalid sector number!*"
				   halt
			 end
			 send "qqq  z  n  c  v  " & $sector & "*  q  p  s  s "
			 waitOn "Landing on Federation StarDock."
			 waitOn "<Shipyards> Your option (?)"
		elseif ($chosen_option = "C")
			 getInput $sector "To sector: "
			 isNumber $numtest $sector
			if ($numtest < 1)
				 echo ANSI_12 "**Invalid sector number!*"
				 halt
				end
				if ($sector < 1) OR ($sector > SECTORS)
					echo ANSI_12 "**Invalid sector number!*"
					halt
				 end
			send "qqq  z  n  c  v  0  *  y  n  " & $sector & "*  q  p  s  s "
			waitOn "Landing on Federation StarDock."
			waitOn "<Shipyards> Your option (?)"
			goto :print_the_menu
		elseif ($chosen_option = "D")
			 getInput $sector "To sector: "
			 isNumber $numtest $sector
			 if ($numtest < 1)
				   echo ANSI_12 "**Invalid sector number!*"
				   halt
			 end
			 if ($sector < 1) OR ($sector > SECTORS)
				   echo ANSI_12 "**Invalid sector number!*"
				   halt
			 end
			 send "^f*" & $sector & "*q"
			 waitOn "ENDINTERROG"
		elseif ($chosen_option = "E")
			 if ($PLAYER~GENESIS > 0)
				   send "qqq  z  n  u  y  *  .*  z  c  *  p  s  h "
				   waitOn "Landing on Federation StarDock."
				   gosub :PLAYER~quikstats
				   waitOn "<Hardware Emporium> So what are you looking for (?)"
			 else
				   echo ANSI_12 "**You don't have any Genesis Torps!*"
				   halt
			 end
		elseif ($chosen_option = "F")
			 if ($player~ore_holds < 1)
				   echo ANSI_12 "**You have no ore to drop!*"
				   halt
			 end
			 getInput $pnum "Planet number: "
			 isNumber $numtest $pnum
			 if ($numtest < 1)
				   echo ANSI_12 "**Invalid planet number!*"
				   halt
			 end
			 if ($pnum < 1) OR ($pnum > 33000)
				   echo ANSI_12 "**Invalid planet number!*"
				   halt
			 end
			 setVar $msg ""
				 killalltriggers
			 setTextLineTrigger det_trg1 :pland_trg_1 "Engage the Autopilot?"
			 setTextLineTrigger det_trg2 :pland_trg_2 "That planet is not in this sector."
			 setTextLineTrigger det_trg3 :pland_trg_3 "<Take all>"
			 setTextLineTrigger det_trg4 :pland_trg_4 "<Take/Leave Products>"
			 setTextLineTrigger det_trg5 :pland_trg_5 "Landing on Federation StarDock."
			 send "qqq  z  n  l " & $pnum & "  *  *  z  n  z  n  *  z  q  t  n  z  l  1  *  q  q  z  n  p  s  h "
			 pause
		elseif ($chosen_option = "G")
			 getInput $pnum "Planet number: "
			 isNumber $numtest $pnum
			 if ($numtest < 1)
				   echo ANSI_12 "**Invalid planet number!*"
				   halt
			 end
			 if ($pnum < 1) OR ($pnum > 33000)
				   echo ANSI_12 "**Invalid planet number!*"
				   halt
			 end
			 setVar $msg ""
				 killalltriggers
			 setTextLineTrigger det_trg1 :pland_trg_1 "Engage the Autopilot?"
			 setTextLineTrigger det_trg2 :pland_trg_2 "That planet is not in this sector."
			 setTextLineTrigger det_trg3 :pland_trg_3 "<Take all>"
			 setTextLineTrigger det_trg4 :pland_trg_4 "<Take/Leave Products>"
			 setTextLineTrigger det_trg5 :pland_trg_5 "Landing on Federation StarDock."
			 send "qqq  z  n  l " & $pnum & "  *  *  z  n  z  n  *  z  q  a  *  q  q  z  n  p  s  h "
			 pause
		elseif ($chosen_option = "H")
			 if ($PLAYER~ATOMIC < 1)
				   echo ANSI_12 "**You don't have any Atomic Dets!*"
				   halt
			 end
			 getInput $pnum "Planet number: "
			 isNumber $numtest $pnum
			 if ($numtest < 1)
				   echo ANSI_12 "**Invalid planet number!*"
				   halt
			 end
			 if ($pnum < 1) OR ($pnum > 33000)
				   echo ANSI_12 "**Invalid planet number!*"
				   halt
			 end
			 setVar $msg ""
				 killalltriggers
			 setTextLineTrigger det_trg1 :pland_trg_1 "Engage the Autopilot?"
			 setTextLineTrigger det_trg2 :pland_trg_2 "That planet is not in this sector."
			 setTextLineTrigger det_trg3 :pland_trg_3 "<Take all>"
			 setTextLineTrigger det_trg4 :pland_trg_4 "<Take/Leave Products>"
			 setTextLineTrigger det_trg5 :pland_trg_5 "Landing on Federation StarDock."
			 setTextLineTrigger det_trg6 :pland_trg_6 "<DANGER> Are you sure you want to do this?"
			 send "qqq  z  n  l " & $pnum & "  *  *  z  n  z  n  *  z  d  y  p  s  h "
			 pause
		elseif ($chosen_option = "Z")
			 if ($player~cloaks > 0)
				  echo ANSI_11 "*Are you sure you want to cloak out? (y/N)*"
				  getConsoleInput $choice singlekey
				  upperCase $choice
				  if ($choice = "Y")
					   goto :cloak_on_out
				  else
					   echo ANSI_12 & "**Aborting cloak-out.*"
					   halt
				  end
				  :cloak_on_out
				  send "qqq  y  y"
				  halt
			 else
				  echo ANSI_12 & "**You have no cloaking devices!*"
			 end
		elseif ($chosen_option = "L")
			 send "qqq  z  n  t  aq  p  s  s "
			 waitOn "Landing on Federation StarDock."
			 waitOn "<Shipyards> Your option (?)"
		elseif ($chosen_option = "T")
			 send "qqq  z  n  c  n  9q  q  p  s  s "
			 waitOn "Landing on Federation StarDock."
			 waitOn "<Shipyards> Your option (?)"
		elseif ($chosen_option = "W")
			 send "qqq  z  n  c  u  y  q  p  s  s "
			 waitOn "Landing on Federation StarDock."
			 waitOn "<Shipyards> Your option (?)"
		elseif ($chosen_option = "O")
			 goto :swap_ore
		end
		halt
		# -------------------------------------------------------------------
		:swap_ore
		echo "**"
		echo ANSI_11 "This automates the process of trading ore between ships.**"
		echo ANSI_15 "It pops a planet, drops ore and re-docks.*"
		echo ANSI_15 "After a brief pause it then lifts, xports, grabs the ore and re-docks.*"
		echo ANSI_15 "The result... you're in your new ship, safe at dock w/ ore.*"
		echo ANSI_15 "It tries to be as safe as possible but there's always some risk.*"
		echo "*"
		echo ANSI_14 "Are you sure you want to start the Ore Swapper X-port? (y/N)*"
		getConsoleInput $choice singlekey
		upperCase $choice
		if ($choice = "Y")
			goto :init_ore_swap_vars
		else
			echo ANSI_12 & "**Aborting Ore Swapper X-port.*"
			halt
		end
		:init_ore_swap_vars
		setVar $funky_counter 0
		getInput $shipnum "Ship number to transfer fuel to: "
		isNumber $numtest $shipnum
		if ($numtest < 1)
			echo ANSI_12 "*Invalid ship number!*"
			halt
		end
		if ($shipnum < 1) OR ($shipnum > 65000)
			echo ANSI_12 "*Invalid ship number!*"
			halt
		end
		:top_of_ore_swap
		gosub :PLAYER~quikstats
		add $funky_counter 1
		if ($PLAYER~GENESIS < 1)
			echo ANSI_12 "**Out of Genesis Torps. You're going to need one for this.*"
			halt
		end
		if ($player~ore_holds < 3)
			echo ANSI_12 "**There's no ore on your ship! You can't drop ore if you don't have any.*"
			halt
		end
		send "qqq  z  n  u  y  *  .*  z  c  *  p  s  h "
		waitOn "Landing on Federation StarDock."
		getRnd $rand_wait 100 300
		killtrigger safety_delay
		setDelayTrigger safety_delay :lift_stuff $rand_wait
		pause
		:lift_stuff
		send "qqq  z  n  l*  *  z  q  t  n  z  l  1  *  q  q  z  n  p  s  h "
			killalltriggers
		setTextLineTrigger result_trg1 :res_torps "You don't have any Genesis Torpedoes to launch!"
		setTextLineTrigger result_trg2 :res_nopln "There isn't a planet in this sector."
		setTextLineTrigger result_trg3 :res_mltpl "Registry# and Planet Name"
		setTextLineTrigger result_trg4 :res_landd "Landing sequence engaged..."
		setTextLineTrigger result_trg5 :res_backd "Landing on Federation StarDock."
		pause
		:res_torps
		echo ANSI_12 "**You somehow ran out of Genesis Torps before launching. This should not have happened! Check your status!*"
		send "? "
		halt
		:res_nopln
		echo ANSI_12 "**The planet is gone! Someone might be messing with us.*"
		if ($funky_counter < 4)
			goto :top_of_ore_swap
		else
			echo ANSI_12 "**I've tried this 3 times, something is definately going on. Check your status!*"
			send "? "
			halt
		end
		:res_landd
		waitOn "Planet #"
		getWord CURRENTLINE $pnum 2
		stripText $pnum "#"
		waitOn "(?="
		echo ANSI_10 "**We've landed and dropped our ore on planet #" & $pnum & "!*"
		pause
		:res_mltpl
		waitOn "--------------------"
			killalltriggers
		setVar $p_array_idx 0
		setArray $p_array 255
			killalltriggers
		setTextLineTrigger plist_trig :plist_line ">"
		setTextLineTrigger plist_end  :plist_end  "Land on which planet"
		pause
		halt
		:plist_line
			add $p_array_idx 1
			setVar $line CURRENTLINE
			stripText $line "<"
			stripText $line ">"
			getWord $line $a_number 1
			setVar $p_array[$p_array_idx] $a_number
			killtrigger plist_trig
			setTextLineTrigger plist_trig :plist_line "<"
			pause
			halt
		:plist_end
				killalltriggers
			if ($p_array_idx < 1)
				echo ANSI_12 "**The planet is gone! Someone might be messing with us.*"
				if ($funky_counter < 4)
					goto :top_of_ore_swap
				else
						echo ANSI_12 "**I've tried this 3 times, something is definately going on. Check your status!*"
						send "? "
					halt
				end
			end
		waitOn "Landing on Federation StarDock."
		waitOn "<Hardware Emporium> So what are you looking for (?)"
		getRnd $rand_wait 100 300
		killtrigger safety_delay
		setDelayTrigger safety_delay :more_lift_stuff $rand_wait
		pause
		:more_lift_stuff
			getRnd $rnd_idx 1 $p_array_idx
			setVar $pnum $p_array[$rnd_idx]
				killalltriggers
			setTextLineTrigger result_trg1 :res_baddd "Engage the Autopilot?"
			setTextLineTrigger result_trg2 :res_baddd "That planet is not in this sector."
			setTextLineTrigger result_trg3 :res_land2 "<Take/Leave Products>"
			setTextLineTrigger result_trg4 :res_backd "Landing on Federation StarDock."
			send "qqq  z  n  l " & $pnum & "  *  *  z  n  z  n  *  z  q  t  n  z  l  1  *  q  q  z  n  p  s  h "
			pause
		:res_baddd
			killalltriggers
		echo ANSI_12 "**Our planet is gone! Someone might be messing with us.*"
		if ($funky_counter < 4)
				goto :top_of_ore_swap
		else
			echo ANSI_12 "**I've tried this 3 times, something is definately going on. Check your status!*"
			send "? "
		end
		halt
		:res_land2
		echo ANSI_10 "**We've landed and dropped our ore on planet #" & $pnum & "!*"
		pause
		:res_backd
			killalltriggers
		gosub :PLAYER~quikstats
		waitOn "<Hardware Emporium> So what are you looking for (?)"
		getRnd $rand_wait 100 300
		killtrigger safety_delay 
		setDelayTrigger safety_delay :yet_more_lift_stuff $rand_wait
		pause
		:yet_more_lift_stuff
			setVar $msg ""
			setTextLineTrigger result_trg1 :swap_xport_notavail "That is not an available ship."
			setTextLineTrigger result_trg2 :swap_xport_badrange "only has a transport range of"
			setTextLineTrigger result_trg3 :swap_xport_security "SECURITY BREACH! Invalid Password, unable to link transporters."
			setTextLineTrigger result_trg4 :swap_xport_noaccess "Access denied!"
			setTextLineTrigger result_trg5 :swap_xport_xprtgood "Security code accepted, engaging transporter control."
			setTextLineTrigger result_trg6 :swap_pland_noplnet1 "Engage the Autopilot?"
			setTextLineTrigger result_trg7 :swap_pland_noplnet2 "That planet is not in this sector."
			setTextLineTrigger result_trg8 :swap_pland_noplnet3 "Invalid registry number, landing aborted."
			setTextLineTrigger result_trg9 :swap_pland_prodtakn "<Take all>"
			setTextLineTrigger result_trg0 :swap_pland_complete "Landing on Federation StarDock."
			send "qqq  z  n  "
			send "x    " & $shipnum & "    *    *    *   "
			send "l " & $pnum & "  *  *  z  n  z  n  *  z  q  a  *  q  q  z  n  "
			send "p  s  h "
			pause
		:swap_xport_notavail
			setVar $msg $msg & ANSI_12 & "*That ship is not available, using the original ship...*"
			pause
		:swap_xport_badrange
			setVar $msg $msg & ANSI_12 & "*That ship is too far away, using the original ship...*"
			pause
		:swap_xport_security
			setVar $msg $msg & ANSI_12 & "*That ship is passworded, using the original ship...*"
			pause
		:swap_xport_noaccess
			setVar $msg $msg & ANSI_12 & "*Cannot access that ship, using the original ship...*"
			pause
		:swap_xport_xprtgood
			setVar $msg $msg & ANSI_10 & "*Xport good!*"
			pause
		:swap_pland_noplnet1
			setVar $msg $msg & ANSI_12 & "*The planet has gone missing. Check your status!*"
			pause
		:swap_pland_noplnet2
			setVar $msg $msg & ANSI_12 & "*The planet has gone missing. Check your status!*"
			pause
		:swap_pland_noplnet3
			setVar $msg $msg & ANSI_12 & "*The planet has gone missing. Check your status!*"
			pause
		:swap_pland_prodtakn
			setVar $msg $msg & ANSI_10 & "*Products collected!*"
			pause
		:swap_pland_complete
				killalltriggers
			gosub :PLAYER~quikstats
			waitOn "<Hardware Emporium> So what are you looking for (?)"
			echo $msg
			halt
		pause
		halt
		# -------------------------------------------------------------------
		:pland_trg_1
		setVar $msg ANSI_12 & "**There are no planets in the StarDock sector!*"
		pause
		:pland_trg_2
		setVar $msg ANSI_12 & "**That planet is not in the StarDock sector!*"
		pause
		:pland_trg_3
		setVar $msg ANSI_10 & "**Products taken!*"
		pause
		:pland_trg_4
		setVar $msg ANSI_10 & "**Fuel dropped!*"
		pause
		:pland_trg_6
		setVar $msg ANSI_10 & "**Planet destroyed!*"
		pause
		:pland_trg_5
		gosub :PLAYER~quikstats
		waitOn "<Hardware Emporium> So what are you looking for (?)"
			killalltriggers
		echo $msg
		halt
		:doneDockKit
			echo #27 "[30D                        " #27 "[30D"
			halt
end
include "source\module_includes\bot\loadvars\bot"
include "source\bot_includes\player\currentprompt\player"
include "source\module_includes\bot\checkstartingprompt\bot"
include "source\bot_includes\switchboard"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\map\displayadjacentgridansi\map"
include "source\module_includes\bot\addfigtodata\bot"
