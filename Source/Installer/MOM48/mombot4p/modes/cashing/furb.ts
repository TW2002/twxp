SetVar	$FURB_nHOLDS	33
setVar	$FURB_nLETTER	"h"
SetVar	$FURB_fHOLDS	97
setVar	$FURB_fLETTER	"o"
setVar	$THE_nRUNS		0
setVar	$THE_fRUNS		0
setVar	$START_CASH		0
setVar	$FURB_COST		0
setVar	$CK_MODE		FALSE
setVar	$VERSION		"2.0.5"
setVar  $planet~CITADEL_furb	FALSE

#gets figs after furbing, when it doesn't need to (or at least lets override)
#	- could pick up figs before furbing if below a threshold
#needs to scan to see if furb available
#needs an option to create furbs for sector, then scan to see if available


gosub :_START_
	isNumber $tst $bot~parm1
	if ($tst = 0)
		if ($bot~parm1 = "ck")
			setVar $CK_MODE TRUE
			#						[norm hold]
        	isNumber $tst $bot~parm2
        	if ($tst = 0)
				send "'{" $switchboard~bot_name "} - Syntax Error: Normal Holds Value Is Not A Number*"
        		halt
        	end
        	if ($bot~parm2 < 1) OR ($bot~parm2 > 255)
				if ($bot~parm2 <> 0)
					send "'{" $switchboard~bot_name "} - Syntax Error: Normal Holds Value Out Of Range*"
        			halt
        		end
        	else
				SetVar $FURB_nHOLDS $bot~parm2
        	end
        	#						[fake hold]
        	isNumber $tst $bot~parm3
        	if ($tst = 0)
				send "'{" $switchboard~bot_name "} - Syntax Error: Fake-Bust Holds Value Is Not A Number*"
        		halt
        	end
        	if ($bot~parm3 < 1) OR ($bot~parm3 > 255)
				if ($bot~parm2 <> 0)
					send "'{" $switchboard~bot_name "} - Syntax Error: Fake-Bust Holds Value Out Of Range*"
        			halt
        		end
        	else
				SetVar $FURB_fHOLDS $bot~parm3
        	end
			#						[norm letter]
			replaceText $bot~parm4 "0" $FURB_nLETTER
			if ($bot~parm4 = "a") or ($bot~parm4 = "b") or ($bot~parm4 = "c") or ($bot~parm4 = "d") or ($bot~parm4 = "e") or ($bot~parm4 = "f") or ($bot~parm4 = "g") or ($bot~parm4 = "h") or ($bot~parm4 = "i") or ($bot~parm4 = "j") or ($bot~parm4 = "k") or ($bot~parm4 = "l")  or ($bot~parm4 = "m") or ($bot~parm4 = "n") or ($bot~parm4 = "o") or ($bot~parm4 = "p") or ($bot~parm4 = "r")
				setVar $FURB_nLETTER $bot~parm4
			else
				send "'{" $switchboard~bot_name "} - Syntax Error: Normal Bust Ship-Letter Value Is Not Valid*"
        		halt
			end
			#						[fake letter]
			replaceText $bot~parm5 "0" $FURB_fLETTER
			if ($bot~parm5 = "a") or ($bot~parm5 = "b") or ($bot~parm5 = "c") or ($bot~parm5 = "d") or ($bot~parm5 = "e") or ($bot~parm5 = "f") or ($bot~parm5 = "g") or ($bot~parm5 = "h") or ($bot~parm5 = "i") or ($bot~parm5 = "j") or ($bot~parm5 = "k") or ($bot~parm5 = "l")  or ($bot~parm5 = "m") or ($bot~parm5 = "n") or ($bot~parm5 = "o") or ($bot~parm5 = "p") or ($bot~parm5 = "r")
				setVar $FURB_fLETTER $bot~parm5
			else
				send "'{" $switchboard~bot_name "} - Syntax Error: Normal Bust Ship-Letter Value Is Not Valid*"
        		halt
			end
		end
	else
		isNumber $tst $bot~parm1
		if ($tst = 0)
			send "'{" $switchboard~bot_name "} - Syntax Error: Ship Number Is Not A Number*"
        	halt
		end
       	if ($bot~parm1 > 1) OR ($bot~parm1 <= 2000)
			SetVar $bustship $bot~parm1
		else
			send "'{" $switchboard~bot_name "} - Syntax Error: Ship Number Is Out Of Range*"
       		halt
		end

		if ($planet~CITADEL_furb)

			killalltriggers
			send "C ZQ "
			waitfor "<Active Ship Scan>"
			:eachship
				setTextLineTrigger shiploc :shiploc " "&$bustship&" "
				setTextLineTrigger nofind :nofind "Computer command [TL="
				pause
			:nofind
				killtrigger shiploc
				send "'{" $switchboard~bot_name "} - Can't find ship " & $bustship & "*"
				halt
			:shiploc
				killtrigger nofind
				getWord CURRENTLINE $isbustship 1
				if ($isbustship = $bustship)
					getWord CURRENTLINE $bustloc 2
					if ($bustloc = STARDOCK)
						send "'{" $switchboard~bot_name "} - Cannot Furb StarDock Sector*"
						halt
					end
					send "'{" $switchboard~bot_name "} - Ship " & $bustship & " found, heading in to citadel furb.*"
					setVar $PLAYER~warpto $bustloc
					gosub :player~twarp
					if ($PLAYER~twarpSuccess = FALSE)
						send "'{" $switchboard~bot_name "} - Couldn't TWARP - something is wrong.  Halting.*"
						halt
					else
						send "l "&$planet~planet_number&"* c e y "
						if ($PLAYER~CREDITS < 1000000)
							send "t f "&(1000000-$PLAYER~CREDITS)&"*"
						end
						send "q t*l3*t*t1*c "
						setVar $PLAYER~warpto STARDOCK
						if ($bwarp)
							gosub :player~bwarp
						else
							send "q q * * "
							gosub :player~twarp
						end
						gosub :PLAYER~quikstats
					    if ((CURRENTSECTOR = 1) OR (PORT.CLASS[CURRENTSECTOR] = 0))
					        if ($startingLocation = "Citadel")
					            send "q "
					            gosub :PLANET~getPlanetInfo
					            send "q "
					        end
					        send "p ty"
					    elseif (CURRENTSECTOR = $MAP~STARDOCK)
					        send "p ss ys *p"
					    else
							send "'{" $switchboard~bot_name "} - Couldn't BWARP - something is wrong.  Halting.*"
							halt
					    end
					    setVar $SWITCHBOARD~message ""
					    setTextLineTrigger limpet   :markLimpet     "After an intensive scanning search, they find and remove the Limpet"
					    setTextLineTrigger limpetno     :markLimpetNo   "The port official frowns at you (you haven't the funds!) and storms"
					    setTextLineTrigger holds  :buyholds    "A  Cargo holds     :"
					    pause
					    :markLimpet
					        setVar $message "Limpet scrubbed off of hull.*"
					        pause
					    :markLimpetNo
					        setVar $message "Limpet exists, but not enough cash to get scrubbed.*"
					        pause   
					    :buyholds
					        killtrigger limpet
					        killtrigger limpetno
					        killtrigger holds
							getWord CURRENTLINE $holdsToBuy 10
							send "a "&$holdsToBuy&"* y q q q * "
					        if ($startingLocation = "Citadel")
					            gosub :PLANET~landingSub
					        end
					        gosub :PLAYER~quikstats
					        if ($message <> "")
					            setVar $SWITCHBOARD~message $message
					            gosub :SWITCHBOARD~switchboard
					        end
					end

				else
					goto :eachship
				end
			
		else

			isNumber $tst $bot~parm2
			if ($tst = 0)
				send "'{" $switchboard~bot_name "} - Syntax Error: Holds Value Is Not A Number*"
				halt
			end
			if ($bot~parm2 < 1) OR ($bot~parm2 > 255)
				if ($bot~parm2 <> 0)
					send "'{" $switchboard~bot_name "} - Syntax Error: Holds Value Out Of Range*"
					halt
				else
					SetVar $FURB_nHOLDS 0
				end
			else
				SetVar $FURB_nHOLDS $bot~parm2
			end
	
			replaceText $bot~parm3 "0" $FURB_nLETTER
			if ($bot~parm3 = "a") or ($bot~parm3 = "b") or ($bot~parm3 = "c") or ($bot~parm3 = "d") or ($bot~parm3 = "e") or ($bot~parm3 = "f") or ($bot~parm3 = "g") or ($bot~parm3 = "h") or ($bot~parm3 = "i") or ($bot~parm3 = "j") or ($bot~parm3 = "k") or ($bot~parm3 = "l")  or ($bot~parm3 = "m") or ($bot~parm3 = "n") or ($bot~parm3 = "o") or ($bot~parm3 = "p") or ($bot~parm3 = "r")
			setVar $FURB_nLETTER $bot~parm3
			else
				send "'{" $switchboard~bot_name "} - Syntax Error: Ship-Letter Value Is Not Valid*"
	       		halt
			end
			stripText $bustship "."
			stripText $bustship ","
			setVar $addHolds $FURB_nHOLDS
			setVar $shipLetter $FURB_nLETTER
			setVar $shipName "M()M FURB {" & $addholds & "}"
	echo "Starting...." 
			goto :startfurb
		end
		halt
	end

	send "'*{" $switchboard~bot_name "} Starting CK Furb mode:*  -Normal Furbs*     Holds Added: "&$FURB_nHOLDS&"  Ship Letter: "&$FURB_nLETTER&"*  -Fake Furbs*     Holds Added: "&$FURB_fHOLDS&"  Ship Letter: "&$FURB_fLETTER&"**"
	waitfor "Sub-space comm-link terminated"
	send "'{" $switchboard~bot_name "}  - Bot is now mimicking CK Furb.  Use CK Furb calls while this mode is on.*"
	waitfor "Message sent on sub-space channel"

:setCKFurbTriggers
	killalltriggers
    gosub :PLAYER~quikstats

    if (($PLAYER~FIGHTERS + $PLAYER~SHIELDS) < 1001)
		send "'{" $switchboard~bot_name "} - Have too few Fighters/Shields To Survive 100% Haz*"
		halt
	end
	if ($player~unlimitedGame = FALSE) and ($PLAYER~TURNS < 10)
		send "'{" $switchboard~bot_name "} - Too Low On Turns To Continue*"
		halt
	end
	if ($player~unlimitedGame = FALSE)
		send "'{" $switchboard~bot_name "} - Ready To Bring A Furb (" &$PLAYER~TURNS & ")*"
	else
		send "'{" $switchboard~bot_name "} - Ready To Bring A Furb*"
	end
	waitfor "Message sent on sub-space channel"

	setVar $_str_ (ANSI_9 & "**{"&ANSI_14&$switchboard~bot_name&ANSI_9&"} " & ANSI_15 & "---------- Furb v"&$VERSION&" Running ----------*")
	setVar $_str_ ($_str_ & ANSI_15 & "    Normal Furb Runs  "&ANSI_14&":"&ANSI_7&" " & $THE_nRUNS & "*")
	setVar $_str_ ($_str_ & ANSI_15 & "    Fake Furb Runs    "&ANSI_14&":"&ANSI_7&" " & $THE_fRUNS & "*")
	if ($player~unlimitedGame = FALSE)
	setVar $_str_ ($_str_ & ANSI_15 & "    Turns Left        "&ANSI_14&":"&ANSI_7&" " & $PLAYER~TURNS & "*")
	else
	setVar $_str_ ($_str_ & ANSI_15 & "    Turns Left        "&ANSI_14&":"&ANSI_7&" UNLIMITED*")
	end
	setVar $CashAmount ($PLAYER~CREDITS - $START_CASH)
	gosub :CommaSize
	setVar $_str_ ($_str_ & ANSI_15 & "    Profit            "&ANSI_14&":"&ANSI_7&"$" & $CashAmount & "*")

	if ($THE_nRUNS <> 0) OR ($THE_fRUNS <> 0)
		add $FURB_COST ($Temp - ($PLAYER~CREDITS - $DECASH))
	end
	setVar $CashAmount $FURB_COST
	gosub :CommaSize
	setVar $_str_ ($_str_ & ANSI_15 & "    Expenditure       "&ANSI_14&":"&ANSI_7&"$" & $CashAmount & "*")
	setVar $_str_ ($_str_ & ANSI_9 & "{"&ANSI_14&$switchboard~bot_name&ANSI_9&"} " & ANSI_15 & "---------------------------------------**")
	Echo $_str_
	SetTextLineTrigger 1 :ckfurbrequested "Busted in ship"
	SetTextLineTrigger 2 :ckfakefurbrequested "FAKE Busted in Ship"
	pause

:ckfurbrequested
	# R Cherok Busted in ship 2, FURB please, I still have 327 turns to run.
	cutText CURRENTLINE $spoof 1 1
	if ($spoof <> "R")
		if ($CK_MODE)
			goto :setCKFurbTriggers
		else
			halt
		end
	end
	getLength CURRENTLINE $len
	if ($len >= 25)
		cutText CURRENTLINE $bustship 25 4
	else
		if ($CK_MODE)
			goto :setCKFurbTriggers
		else
			halt
		end
	end
	stripText $bustship "."
	stripText $bustship ","
	stripText $bustship " "
	setVar $shipname "CK FURB "
	setVar $addHolds $FURB_nHOLDS
	setVar $shipLetter $FURB_nLETTER
	add $THE_nRUNS 1
	goto :startfurb

:ckfakefurbrequested
	# R Cherok FAKE Busted in Ship 49, need a super furb
	cutText CURRENTLINE $spoof 1 1
	if ($spoof <> "R")
		if ($CK_MODE)
			goto :setCKFurbTriggers
		else
			halt
		end
	end
        getLength CURRENTLINE $len
	if ($len >= 30)
		cutText CURRENTLINE $bustship 30 4
	else
		if ($CK_MODE)
			goto :setCKFurbTriggers
		else
			halt
		end
	end
	stripText $bustship "."
	stripText $bustship ","
	stripText $bustship " "
	setVar $shipName "CK FAKE FURB"
	setVar $addHolds $FURB_fHOLDS
    setVar $shipLetter $FURB_fLETTER
	add $THE_fRUNS 1
    goto :startfurb

:startFurb
    killalltriggers
    send "C ZQ "

	waitfor "<Active Ship Scan>"
	:eachshiploc
	setTextLineTrigger shiploc :shiplocf " "&$bustship&" "
	setTextLineTrigger nofind :nofindf "Computer command [TL="
	pause
    :nofindf
	killtrigger shiploc
	send "'{" $switchboard~bot_name "} - Can't find ship " & $bustship & "*"
	if ($CK_MODE)
		goto :setCKFurbTriggers
	else
		halt
	end
     :shiplocf

 

	killtrigger nofind
	getWord CURRENTLINE $isbustship 1

	if ($isbustship = $bustship)

		getWord CURRENTLINE $bustloc 2
		if ($bustloc = STARDOCK)
			send "'{" $switchboard~bot_name "} - Cannot Furb StarDock Sector*"
			if ($CK_MODE)
				goto :setCKFurbTriggers
			else
				halt
			end
		end
		send "'{" $switchboard~bot_name "} - Ship " & $bustship & " found, bringing a furb.*"
		gosub :buyfurbs
		goto :towfurb
	else
		goto :eachshiploc
	end
	:towfurb
	SetTextTrigger 		noFig 		:noFig "blind?"
	SetTextLineTrigger 	lowShipOre 	:lowShipOre "You do not have enough Fuel Ore to make the jump."
	SetTextLineTrigger	locked 		:locked "Locating beam pinpointed"
	SetTextTrigger 		adj 		:adj "NavPoint Settings"
	SetTextLineTrigger 	atdock 		:atdock "You are already in that sector!"
	send "W  N " & $furb & "* M " & $bustloc & "* Y"
	pause
	:noFig
	killtrigger nofig
	killtrigger lowshipore
	killtrigger locked
	killtrigger adj
	killtrigger atdock
	send "N W "
	if ($furbtype = "furb")
		subtract $i 1
	end
	send "'{" $switchboard~bot_name "} - No fighter down at that ship number, drop a fig.*"
	if ($CK_MODE)
		goto :setCKFurbTriggers
	else
		halt
	end
	:adj
	killtrigger nofig
	killtrigger lowshipore
	killtrigger locked
	killtrigger adj
	killtrigger atdock
	send "* q * "
	send "'{" $switchboard~bot_name "} - Why am I furbing adjacent to stardock?*"
	goto :locked
	:atdock
	killtrigger nofig
	killtrigger lowshipore
	killtrigger locked
	killtrigger adj
	killtrigger atdock
	send "* "
	if ($furbtype = "furb")
		subtract $i 1
	end
	send "'{" $switchboard~bot_name "} - That ship is at stardock, try again*"
	if ($CK_MODE)
		goto :setCKFurbTriggers
	else
		halt
	end
	:lowShipOre
	killtrigger nofig
	killtrigger lowshipore
	killtrigger locked
	killtrigger adj
	killtrigger atdock
	send "W"
	if ($furbtype = "furb")
		subtract $i 1
	end
	send "'{" $switchboard~bot_name "} - *"
	send "'I don't have enough ore, how did this happen?*"
	send "'You can try to make me furb a closer ship that has an ore selling port.*"
	send "'If that doesn't work, I just can't help you.*"
	if ($CK_MODE)
		goto :setCKFurbTriggers
	else
		halt
	end
	:locked
	killtrigger nofig
	killtrigger lowshipore
	killtrigger locked
	killtrigger adj
	killtrigger atdock
	send "Y  * * W"
	waitfor "You shut off your Tractor Beam."
	send "'{" $switchboard~bot_name "} - Furb delivered*"
	waiton "Message sent on sub-space channel"
	setTextLineTrigger firstship :firstship "Ships   : "
	send "d"
	pause

	:firstship
		killtrigger firstship
		getText CURRENTLINE $name "Ships   : " " [Owned by]"
		if ($name = $shipName)
			setVar $foundn 1
			goto :doneships
		end
		setVar $shiplisti 1

	:moreships
		setTextLineTrigger nextShip :nextShip "ftrs,"
		setTextLineTrigger doneships :doneships "Warps to Sector(s) :"
		pause
		:nextShip
			add $shiplisti 1
			killtrigger nextShip
			killtrigger doneships
			getText CURRENTLINE $name "          " " [Owned by]"
			if ($name = $shipName)
				setVar $foundn $shiplisti
				goto :doneships
			end
			
			goto :moreships
		
		:doneships
			killtrigger nextShip
			killtrigger doneships
	echo "#" $foundn "#"
	if ($waitsecs > 0)
 		send "tc"
		setTextTrigger		THERE		:THERE		"Exchange with"
		setTextLineTrigger	NOTTHERE	:NOTTHERE	"Your Associate must be in the same sector to conduct transfers!"
		pause
		:THERE
		send "YF"
		waitfor "credits, and"
		getText CurrentLine $DECASH " has " "."
		stripText $DECASH ","
		stripText $DECASH " "
		if ($DECASH > 500000)
			setVar $DECASH ($DECASH - 500000)
			send $DECASH & "*"
		else
			setVar $DECASH 0
			send "*"
		end
		setVar $FIGS 0
		send "fyt"
		waitfor "fighters, and"
		getText CURRENTLINE $FIGS " has " "."
		stripText $FIGS " "
		stripText $FIGS ","
		if ($FIGS < 100)
			send (100 - $FIGS) & "*"
		else
			send "*"
		end
		send "  *   *   "
		:NOTTHERE
		killAllTriggers
		send "   * *    "
	end
	:loadore
    :checkPort
	send "D"
	gosub :PLAYER~quikstats
	if ($planet~planet_number <> "0")
		send "l "&$planet~planet_number&"* tnt1* q q * "	
	elseif (PORT.EXISTS[$PLAYER~CURRENT_SECTOR] = FALSE) OR (PORT.BUYFUEL[$PLAYER~CURRENT_SECTOR] = TRUE) OR (PORT.CLASS[$PLAYER~CURRENT_SECTOR] <= 0) OR (PORT.CLASS[$PLAYER~CURRENT_SECTOR] >= 9)
		if ($topplanet = 1)
			
			setVar $planet~planetnumok 0
			send "lq*"

			:checkPlanetsInSector
				setTextLineTrigger orenoplanet :orenoplanet "There isn't a planet in this sector."
				setTextLineTrigger oreoneplanet :oreoneplanet "-------  ---------  ---------  ---------  ---------  --"
				setTextLineTrigger orestartplannum :orestartplannum "and Planet Name"
				setTextLineTrigger orestartplanetsok :orestartplanetsok "< "
				
				pause
				:orestartplannum 
					killalltriggers
					setVar $planet~planetnumok 1
					goto :checkPlanetsInSector
				:orenoplanet
					killAllTriggers
					send "'{" $switchboard~bot_name "} - I'd love to get ore off a planet but there isn't one here!*"
					goto :checkPlanetsFinishWait
				:orestartplanetsok
					killAllTriggers 
					if ($planet~planetnumok = 1)
					
						getWord CURRENTLINE $cPlanetNum 2
						stripText $cPlanetNum ">"
					
						send "l" $cPlanetNum "* t n t 1 * q "
						goto :checkPlanetsFinishWait
					else
						goto :checkPlanetsInSector
					end
					
				:oreoneplanet
					killAllTriggers
					send "l t n t 1 * q "
					

			:checkPlanetsFinishWait
		else
			send "'{" $switchboard~bot_name "} - This is not an ore selling port and I don't know the planet number, THAT SUCKS!*"
		end
	else
	

		send "P T * * 0* 0*"
		waitfor "Enter your choice [T]"
		waitfor "Command ["
		gosub :PLAYER~quikstats
		setVar $EMPTY_HOLDS ($player~total_holds - ($player~ore_holds + $player~organic_holds + $player~equipment_holds + $player~colonist_holds))
		echo $EMPTY_HOLDS
		if ($EMPTY_HOLDS > 0)
			send "'{" $switchboard~bot_name "} - Ore at port critically low!*"
			setdelaytrigger pauseforport :pauseforport 4000
			pause
			:pauseforport
			killTrigger pauseforport
		end
		


	end
	SetTextTrigger 		noFig2 		:noFig2 		"blind?"
	SetTextLineTrigger 	lowShipOre2 :lowShipOre2 	"You do not have enough Fuel Ore to make the jump."
	SetTextLineTrigger 	locked2 	:locked2 		"Locating beam pinpointed"
	SetTextTrigger 		adj2 		:adj2 			"NavPoint Settings"
	#send "NSY"
	send "M" & STARDOCK & "*Y"
	pause
	:noFig2
	killtrigger nofig2
	killtrigger lowshipore2
	killtrigger locked2
	killtrigger adj2
	send "N "
	send "'{" $switchboard~bot_name "} - I SEEM TO HAVE LOST MY COMMISSION, SCRIPT HALTED*"
	halt
	:lowShipOre2
	killtrigger nofig2
	killtrigger lowshipore2
	killtrigger locked2
	killtrigger adj2
	send "'{" $switchboard~bot_name "} - I don't have enough ore. SCRIPT HALTED*"
	halt
	:locked2
	killtrigger nofig2
	killtrigger lowshipore2
	killtrigger locked2
	killtrigger adj2
	# Removing as this is wasting a turn!
	#if ($FIGS = 0)
		send "Y "
		if ($doBlow = 1)
			subtract $foundn 1
			setVar $mac "mac a"
			setVar $maci 1
			while ($maci <= $foundn)
				setVar $mac $mac &"n"
				add $maci 1
			end
			
			setVar $mac $mac &"y99^M"
			send "'" $blowBot " " $mac "*"
		end 
	#else
	#	send "Y P S G Y G Q S P B " & (100 - $FIGS) & "* Q Q Q "
	#end
	if ($CK_MODE)
		goto :setCKFurbTriggers
	else
		halt
	end
	:adj2
	killtrigger nofig2
	killtrigger lowshipore2
	killtrigger locked2
	killtrigger adj2
	send "* "
	if ($CK_MODE)
		goto :setCKFurbTriggers
	else
		halt
	end
:buyfurbs
	setVar $Temp $PLAYER~CREDITS
    send "P S G Y G Q S B N Y " & $shipletter & "Y qrP " & $shipName &"* * * "
    if ($PLAYER~FIGHTERS <= 1001)
	setVar $ftobuy (1002 - $PLAYER~FIGHTERS)
		send "P B " $ftobuy "* q  "
    end
	waitfor "[Pause]"
:listfurbs
    send "S"
    waitfor "<Sell an old Ship>"
    setTextLineTrigger notefurb :notefurb $shipName
    setTextLineTrigger nofurb :nofurb "You do not own any other ships orbiting the Stardock!"
    setTextTrigger nofurb2 :nofurb "Choose which ship to sell (Q=Quit)"
    pause
    :nofurb
	send "q q '{" $switchboard~bot_name "} Furb purchase not possible (maybe not enough cash on hand?)*"
	if ($CK_MODE)
	   	goto :setCKFurbTriggers
	else
		halt
	end
    :notefurb
	killtrigger nofurb
	killtrigger nofurb2
	getWord CURRENTLINE $isdock 2
	if ($isdock = stardock)
		getWord CURRENTLINE $furb 1
	end
    :listend
	send "Q Q Q "
	if ($addholds > 0)
		send "x    " & $furb & "* Q P S S P A " & $addholds & "* Y Q Q Q X    " & $towship & "* q "
	end
	return

:_START_
	loadVar $switchboard~bot_name
	loadVar $bot~user_command_line
	loadvar $player~unlimitedGame
		gosub :BOT~loadVars
									

	setVar $BOT~help[1] $BOT~tab&"FURB - Buys and delivers a Ship to a Corpy to attack  "
	setVar $BOT~help[2] $BOT~tab&"- furb [ship number] {swap} {bwarp} {extra holds} {ship letter} {topp}"
	setVar $BOT~help[3] $BOT~tab&"- [ship number]   = ship number that needs the furb"
	setVar $BOT~help[4] $BOT~tab&"- [extra holds]   = extra holds to buy      - default is 33"
	setVar $BOT~help[5] $BOT~tab&"- [ship letter]   = ship letter to purchase - default is H"
	setVar $BOT~help[6] $BOT~tab&"- [swap]          = swap furb (only use with twarp ships)"
	setVar $BOT~help[7] $BOT~tab&"- [bwarp]         = bwarp from furb planet"
	setVar $BOT~help[8] $BOT~tab&"- [planet:#]      = planet # of furb planet"
	setVar $BOT~help[9] $BOT~tab&"- [topp]          = attempts to get ore from top planet in sector if port low"
	setVar $BOT~help[10] $BOT~tab&"                "
	setVar $BOT~help[11] $BOT~tab&" CK Furb Mode (Mimicks CK Furb)"
	setVar $BOT~help[12] $BOT~tab&"- furb ck {[norm hold] [fake hold] [norm letter] [fake letter]}"
	setVar $BOT~help[13] $BOT~tab&"- [normal holds]  = extra holds to buy - Normal    - default is 33"
	setVar $BOT~help[14] $BOT~tab&"- [fake holds]    = extra holds to buy - Fake      - default is 97"
	setVar $BOT~help[15] $BOT~tab&"- [normal letter] = ship letter to buy - Normal    - default is H"
	setVar $BOT~help[16] $BOT~tab&"- [fake letter]   = ship letter to buy - Fake      - default is O"
	gosub :bot~helpfile


	getWordPos $bot~user_command_line $pos "planet:"
	setVar $planet~planet_number 0
	if ($pos > 0)
		cutText $bot~user_command_line $line $pos 9999
		getWord $line $planet~planet_line 1
		replaceText $planet~planet_line ":" " "
		getWord $planet~planet_line $planet~planet_number 2		
		replaceText $bot~user_command_line "planet:"&$planet~planet_number " "
		isNumber $is_a_number $planet~planet_number
		if ($is_a_number <> TRUE)
			setVar $planet~planet_number 0
		end
	end
	
	getWordPos $bot~user_command_line $pos "blow:"
	setVar $blowbot ""
	setVar $doBlow 0
	if ($pos > 0)
		cutText $bot~user_command_line $line $pos 9999
		getWord $line $blowline 1
		replaceText $blowline ":" " "
		getWord $blowline $blowbot 2		
		replaceText $bot~user_command_line "blow:"&$blowbot " "
		setVar $doBlow 1
	end

	getWordPos $bot~user_command_line $pos "swap"
	if ($pos > 0)
		setVar $planet~CITADEL_furb TRUE
		if ($planet~planet_number = "0")
			send "'{" $switchboard~bot_name "} - Planet must be defined for swap furbing.*"
			halt
		end
	end
	
	setVar $topplanet FALSE
	getWordPos $bot~user_command_line $pos "topp"
	if ($pos > 0)
		StripText $bot~user_command_line "topp"
		setVar $topplanet TRUE
	end

	getWordPos $bot~user_command_line $pos "bwarp"
	if ($pos > 0)

		setVar $bwarp TRUE
	end

	getWord $bot~user_command_line $bot~parm1 1 0
	getWord $bot~user_command_line $bot~parm2 2 0
	getWord $bot~user_command_line $bot~parm3 3 0
	getWord $bot~user_command_line $bot~parm4 4 0
	getWord $bot~user_command_line $bot~parm5 5 0

	gosub :PLAYER~quikstats

	setVar $START_CASH $PLAYER~CREDITS
	setVar $startingLocation $PLAYER~CURRENT_PROMPT

	if ($startingLocation <> "Command") OR ($PLAYER~CURRENT_SECTOR <> stardock)
		send "'{" $switchboard~bot_name "} - Furb must be run from Command Prompt at StarDock.*"
		halt
	end

	if ($PLAYER~TWARP_TYPE <> 2)
		send "'{" $switchboard~bot_name "} - Furbing Ship Must Have Twarp Type-2*"
		halt
	end

	#if ($PLAYER~ALIGNMENT < 1000)
	#	send "'{" $switchboard~bot_name "} - Must Have a Commission*"
	#	halt
	#end

	if ($player~unlimitedGame = FALSE) and ($PLAYER~TURNS < 30)
		send "'{" $switchboard~bot_name "} - Must Have At Least 30 Turns*"
		halt
	end

	if ($PLAYER~CREDITS < 100000)
		send "'{" $switchboard~bot_name "} - Must Have At Least 100,000 Cred On Hand*"
		halt
	end

	setVar $waitsecs   10
	setVar $waitms ($waitsecs * 1000)
	setVar $towship $PLAYER~SHIP_NUMBER

	send " C R " & stardock & "*"
	setTextLineTrigger itsalive 		:itsalive 		"Items     Status  Trading % of max OnBoard"
	setTextLineTrigger nosoupforme 		:nosoupforme 	"I have no information about a port in that sector"
	pause
	:nosoupforme
	killAllTriggers
	send " Q  '{" $switchboard~bot_name "} " & $TagLineB & " - StarDock appears to have been Blown Up!**"
	waitfor "Message sent on sub-space channel"
	halt
	:itsalive
	killAllTriggers
	send " U Y V 0* Y Y Q "
	waitfor "Avoided sectors Cleared."
	waitfor "Command ["
	


return
:CommaSize
	If ($CashAmount < 1000)
		#do nothing
	ElseIf ($CashAmount < 1000000)
    	getLength $CashAmount $len
		SetVar $len ($len - 3)
		cutText $CashAmount $tmp 1 $len
		cutText $CashAMount $tmp1 ($len + 1) 999
		SetVar $tmp $tmp & "," & $tmp1
		SetVar $CashAmount $tmp
	ElseIf ($CashAmount <= 999999999)
		getLength $CashAmount $len
		SetVar $len ($len - 6)
		cutText $CashAmount $tmp 1 $len
		SetVar $tmp $tmp & ","
		cutText $CashAmount $tmp1 ($len + 1) 3
		SetVar $tmp $tmp & $tmp1 & ","
		cutText $CashAmount $tmp1 ($len + 4) 999
		SetVar $tmp $tmp & $tmp1
		SetVar $CashAmount $tmp
	end
	return


:debugFFS

echo "*###################"
echo "* # $bot~parm1 " $bot~parm1
echo "* # $bot~parm2 " $bot~parm2
echo "* # $bot~parm3 " $bot~parm3
echo "* # $bot~parm4 " $bot~parm4
echo "* # $bot~parm5 " $bot~parm5


echo "***##### FURB DEBUG $FURB_nHOLDS"
echo "*### $FURB_nHOLDS " $planet~CITADEL_furb
echo "*### $FURB_nLETTER " $FURB_nLETTER
echo "*### $FURB_fHOLDS " $FURB_fHOLDS
echo "*### $FURB_fLETTER " $FURB_fLETTER
echo "*### $CK_MODE " $CK_MODE
echo "*### $planet~CITADEL_furb " $planet~CITADEL_furb


return

#INCLUDES:
include "source\bot_includes\player\twarp\player"
include "source\bot_includes\player\bwarp\player"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\planet\landingsub\planet"
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
