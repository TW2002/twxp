    #=--------                                                                       -------=#
     #=----------------------------  LoneStar's BWarp Photon ------------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	May 1, 2007 - Version 1.30
	#		Author		:	LoneStar
	#		TWX			:	Should Work with TWX 2.04b, or 2.04 Final
	#		Credits		:	Mind Daggers modified version of Singularity's quikstats
	#
	#		To Run		:	You will Need the following addressed
	#                                    - Start At Citadel Prompt
	#                                    - Tele Pad
	#                                    - Holo Scanner
	#                                    - 50K Credits
	#									 - More than 10 Turns
	#                                    - Photons
	#
	#		Fixes       :	Initial Release
	#
	#		Description	:	BWarp Photon. For those pesky Edits where your Photon Ship holds
	#						only enough fuel for a One-Way Trip.
	#
	#						Fighter Data can be loaded via Sector Param (default), or File.
	#						You can either Density Scan or Holo scan a Photon'd Sector, but not
	#						do both. Script will stop when Planet ORE and/or Turns fall below a
	#						specified level.
	#
	#						Script utilizes my original Adj-Fighter Lookup routine, as well as,
	#						Disconnect and Restart Routin.
	#
	#						Script will Furb Photon's, and put excess cash back into Citadel.
	#
	#						Important: 	Return trip, that is, Twarp'n back to Photon Planet is
	#									*NOT* Blind Warp Protected!  ..this is for speed purposes
	#									to avoid being Counter Foton'd.
	#
	#						This Script was developed for and used extensively in B.Y.O.C. MMVII
	reqRecording
	logging off
	setVar $TagLine				"LoneStar's BWARP PHOTON"
	setVar $TagLineB			"[LSBOTON]"
	setVar $CURENT_VERSION		"1.3"
	setVar $TagLineC			"[LSBOTON v"&$CURENT_VERSION&"]"
	setVar $FName 				"_MOM_" & GAMENAME & ".figs"
	setVar $FName_ck			"_ck_" & GAMENAME & ".figs"

	setVar $Hit_Sector			0
	setVar $idx 				11
	setVar $Start_Sector		0

	setVar $Planet_Number		0
	setVar $Planet_Level		0
	setVar $Planet_ORE			0
	setVar $Planet_ORE_Min		100
	setVar $Planet_FIG			0
	setVar $Planet_TPad			0
	setVar $ORE_TOLERANCE		$Planet_ORE_Min

	setVar $FIREPHOTON			TRUE
	setVar $ALIENS				FALSE
	setVar $AUTO_RETURN			TRUE
	setVar $HOLO_SCAN			FALSE
	setVar $DEN_SCAN			FALSE
	setVar $CONTINUOUS			TRUE
	setVar $FIG_SOURCE			"Sector Param"
	setVar $TURN_LIMIT			10
	setVar $MINE_REACTION		"None"
	setVar $UNLIM				FALSE
	setVar $CREDIT_LIMIT		50000
	setVar $CREDITS_ON_HAND		10000
	setVar $CREDITS_WITHDRAW	200000

	setArray $Sects				SECTORS 5
	setArray $Figs				SECTORS
	setArray $HoloOutput		1000

	loadVar $SCRUB_SECT
	isNumber $tst $SCRUB_SECT
	if (tst = 0)
		setVar $SCRUB_SECT 0
	end

	if (CONNECTED)
	   	Echo ("**" & ANSI_14 & $TagLine & " Version " & $CURENT_VERSION & ANSI_15 & " - Loading...**")
	else
		Echo ("**" & ANSI_14 & $TagLine & " Version " & $CURENT_VERSION & ANSI_15 & " - Must Be Connected To A Server**")
	end

    gosub :quikstats
	gosub :GOOD_TO_GO
	gosub :ALIENS_CHECK

	:Menu_Top
	echo #27 & "[2J"
	:Menu_Top_No_Clear
	Echo "**"
	Echo ("    "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
	Echo ANSI_15 & "*    -/-   LoneStar's BWarp Photon   -/-"
	Echo ANSI_7 & "*           T-Pade Range: " & ANSI_14 & $Planet_TPad & ANSI_7 & " Hops"
	Echo ANSI_7&"*               Version "&$CURENT_VERSION&"*"
	Echo ("    "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
	echo ANSI_5 & "*      " & ANSI_2 & "A" & ANSI_9 & " Fire Photon            "
	if ($FIREPHOTON)
		echo ANSI_15 & "Yep"
	else
		if ($PHOTONS <> 0)
			echo ANSI_15 & "Nope"
		else
			echo ANSI_7 & "No Photons"
		end
	end
	if ($SCAN_TYPE <> "Holo")
		echo ANSI_5 & "*      " & ANSI_2 & "B" & ANSI_9 & " Holo After Photon      " & ANSI_7 & "No LRS Detected"
		setVar $HOLO_SCAN FALSE
	else
		echo ANSI_5 & "*      " & ANSI_2 & "B" & ANSI_9 & " Holo After Photon      " & ANSI_15
		if ($HOLO_SCAN)
			Echo "Yep"
		else
			Echo "Nope"
		end
	end
	if ($SCAN_TYPE = "None")
		echo ANSI_5 & "*      " & ANSI_2 & "C" & ANSI_9 & " Den-Scan After Photon  " & ANSI_7 & "No LRS Detected"
		setVar $DEN_SCAN FALSE
	else
		echo ANSI_5 & "*      " & ANSI_2 & "C" & ANSI_9 & " Den-Scan AFter Photon  " & ANSI_15
		if ($DEN_SCAN)
			Echo "Yep"
		else
			Echo "Nope"
		end
	end
	echo ANSI_5 & "*      " & ANSI_2 & "D" & ANSI_9 & " Auto Return            " & ANSI_15
	if ($AUTO_RETURN)
		Echo "Yep"
		echo ANSI_5 & "*        " & ANSI_2 & "1" & ANSI_5 & " Scrub Sector         " & ANSI_7
		if ($SCRUB_SECT <> 0)
			echo $SCRUB_SECT
		end
	else
		Echo "Nope"
		setVar $SCRUB_SECT 0
		saveVar $SCRUB_SECT
	end

	echo ANSI_5 & "*      " & ANSI_2 & "E" & ANSI_9 & " Run Continuous         " & ANSI_15
	if ($CONTINUOUS)
		Echo "Yep"
	else
		Echo "Nope"
	end
	echo ANSI_5 & "*      " & ANSI_2 & "F" & ANSI_9 & " Get FIG Data From      " & ANSI_15 & $FIG_SOURCE
	SetVar $CashAmount $ORE_TOLERANCE
	gosub :CommaSize
	echo ANSI_5 & "*      " & ANSI_2 & "G" & ANSI_9 & " Planet ORE Safety Lvl  " & ANSI_15 & $CashAmount
	echo ANSI_5 & "*      " & ANSI_2 & "H" & ANSI_9 & " Minimum Turns          "
	if ($UNLIM)
		echo ANSI_7 & "UnLimited"
	else
		echo ANSI_15 & $TURN_LIMIT
	end
	echo ANSI_5 & "*      " & ANSI_2 & "I" & ANSI_9 & " Mine Reaction          " & ANSI_15 & $MINE_REACTION
	echo ANSI_5 & "*      " & ANSI_2 & "J" & ANSI_9 & " Filter Aliens          " & ANSI_15
	if ($ALIENS)
		Echo "Yep"
	else
		Echo "Nope"
	end
    ECHO "*     " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196
	echo "*        " & ANSI_14 & "X" & ANSI_15 & " - Execute    " & ANSI_14 & "Q" & ANSI_15 & " - Quit**"
	getConsoleInput $selection SINGLEKEY
	upperCase $selection
	if ($selection = "Q")
		echo "**" & ANSI_12 "  Script Halted" & ANSI_15 & "**"
		send " * "
		halt
	elseif (($selection = "1") AND ($AUTO_RETURN))
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Scrub Sector That Is "&#42&"Not"&#42&" Your Current TA (" & ANSI_6 & "Current TA " & $Start_Sector & ANSI_14 & ")?"
		isNumber $tst $selection
		if ($tst = 0)
			setVar $SCRUB_SECT 0
			saveVar $SCRUB_SECT
		else
			if (($selection = $Start_Sector) OR ($selection > SECTORS) OR ($selection < 11) OR ($selection = STARDOCK))
				setVar $SCRUB_SECT 0
				saveVar $SCRUB_SECT
			else
				setVar $SCRUB_SECT $selection
				saveVar $SCRUB_SECT
				setVar $CONTINUOUS FALSE
			end
		end
	elseif ($selection = "A")
		if (($FIREPHOTON = 0) AND ($PHOTONS <> 0))
			setVar $FIREPHOTON TRUE
		else
			setVar $FIREPHOTON FALSE
		end
	elseif (($selection = "B") AND ($SCAN_TYPE = "Holo"))
		if ($HOLO_SCAN)
			setVar $HOLO_SCAN FALSE
		else
			setVar $HOLO_SCAN TRUE
			setVar $DEN_SCAN FALSE
		end
	elseif (($selection = "C") AND ($SCAN_TYPE <> "None"))
		if ($DEN_SCAN)
			setVar $DEN_SCAN FALSE
		else
			setVar $DEN_SCAN TRUE
			setVar $HOLO_SCAN FALSE
		end
	elseif ($selection = "D")
		if ($AUTO_RETURN)
			setVar $AUTO_RETURN FALSE
		else
			setVar $AUTO_RETURN TRUE
		end
	elseif ($selection = "E")
		if ($CONTINUOUS)
			setVar $CONTINUOUS FALSE
		else
			setVar $CONTINUOUS TRUE
			setVar $SCRUB_SECT 0
			saveVar $SCRUB_SECT
		end
	elseif ($selection = "F")
		if ($FIG_SOURCE = "Sector Param")
			setVar $FIG_SOURCE "Fig File"
		else
			setVar $FIG_SOURCE "Sector Param"
		end
	elseif ($selection = "G")
		SetVar $CashAmount $Planet_ORE
		gosub :CommaSize
		:TRY_ANOTHER_ORE_AMOUNT
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Stop If ORE Drops Below What Amount (" & ANSI_6 & "Planet Has " & $CashAmount & ANSI_14 & ")?"
		isNumber $tst $selection
		if ($tst = 0)
			Echo "*" ANSI_4 & "Bad Input - Try Again*"
			goto :TRY_ANOTHER_ORE_AMOUNT
		else
			if ($selection < $Planet_ORE_Min)
				SetVar $ORE_TOLERANCE $Planet_ORE_Min
			elseif ($selection > $Planet_ORE)
				SetVar $ORE_TOLERANCE $Planet_ORE
			else
				SetVar $ORE_TOLERANCE $selection
			end
		end
	elseif (($selection = "H") AND ($UNLIM = 0))
		SetVar $CashAmount $Planet_ORE
		:TRY_ANOTHER_TURN_AMOUNT
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Stop When Turns Drops Below What Amount (" & ANSI_6 & "You Have " & $TURNS & ANSI_14 & " Turns)?"
		isNumber $tst $selection
		if ($tst = 0)
			Echo "*" ANSI_4 & "Bad Input - Try Again*"
			goto :TRY_ANOTHER_TURN_AMOUNT
		else
			if ($selection < 1)
				setVar $TURN_LIMIT 0
			else
				setVar $TURN_LIMIT $selection
			end
		end
	elseif ($selection = "I")
		if ($MINE_REACTION = "None")
			setVar $MINE_REACTION "Armids"
		elseif ($MINE_REACTION = "Armids")
			setVar $MINE_REACTION "Limps"
		elseif ($MINE_REACTION = "Limps")
			setVar $MINE_REACTION "Armids/Limps"
		else
			setVar $MINE_REACTION "None"
		end
	elseif ($selection = "J")
		if ($ALIENS)
			setVar $ALIENS FALSE
		else
			setVar $ALIENS TRUE
		end
	elseif ($selection = "X")
		goto :FIRE_IN_THE_HOLE
	else
		echo #27 & "[2K" & #27 & "[1A"
	end
	goto :Menu_Top
	halt

:FIRE_IN_THE_HOLE
	setVar $Suffix	""
	if ($AUTO_RETURN)
		if ($SCRUB_SECT = 0)
			setVar $Suffix (" M " & $Start_Sector & "*  Y  Y  *  L Z" & #8 & $Planet_Number & "*  *  J  C  *  ")
	    else
			setVar $Suffix (" M " & $SCRUB_SECT & "*  Y  Y  *  J  *  ")
		end
    end

	gosub :Read_In_Figs
	gosub :MSGS_ON
	gosub :quikstats

	if ($ORE_HOLDS < $TOTAL_HOLDS)
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Ship Holds Are Not Full of ORE.**")
		halt
	end

	if (($SCRUB_SECT <> 0) AND ($AUTO_RETURN))
		#Testing For A Fighter Lock - Because there's no Blind Warp Protectin
		setTextTrigger		Sector_IS_Good	:Sector_IS_Good		"All Systems Ready, shall we engage?"
		setTextTrigger		Sector_IS_Bad1	:Sector_IS_Bad		"Do you want to make this transport blind"
		setTextLineTrigger	Sector_IS_Bad2	:Sector_IS_Bad		"This planetary transporter does not have the range."
		setTextLineTrigger	Sector_IS_Bad3	:Sector_IS_Bad		"This planet does not have enough Fuel Ore to transport you."
		send "B"&$SCRUB_SECT&"*N*  "
		pause
		:Sector_IS_Bad
			killAlltriggers
			Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Cannot Obtain Fighter Lock on "&$SCRUB_SECT&"**")
			halt
		:Sector_IS_Good
			Echo ("*" & ANSI_14 & $TagLineB & ANSI_15 & " Scrub Sector Is Good*")
			killAllTriggers
	end
	:Disp_Banner
	if ($FIREPHOTON)
		send ("'"&$TagLineC&" Running From Planet #"&$Planet_Number&", with "&$PHOTONS&" Photons.*")
	else
		send ("'"&$TagLineC&" Running From Planet #"&$Planet_Number&", Not Firing A Photon.*")
	end
	:inac
	killAllTriggers
	send #27
	SetEventTrigger 	Discod1 	:Discod     	"CONNECTION LOST"
	SetEventTrigger		Discod2		:Discod     	"Connections have been temporarily disabled."
	SetDelayTrigger		Banner		:Banner			350000
	setTextTrigger	BWarp_Blind		:BWarp_Blind 	"Do you want to make this transport blind"
	setTextTrigger	BWarp_GO		:BWarp_GO		"All Systems Ready, shall we engage?"
	setTextLineTrigger BWARP_Miss	:BWarp_Miss		"Computer command [TL="
	setTextLineTrigger	gotem		:gotem			"Photon Missile launched into sector"
	setTextLineTrigger	wrong		:wrong			"That is not an adjacent sector"

	:Again
	if ($ALIENS)
		setTextLineTrigger	FigHit_A	:FigHit_A	"Deployed Fighters Report Sector"
	else
		setTextLineTrigger	FigHit		:FigHit		"Deployed Fighters Report Sector"
	end

	setTextLineTrigger	inac		:inac			"Session termination is imminent."

	if (($MINE_REACTION = "Armids") OR ($MINE_REACTION = "Armids/Limps"))
		if ($ALIENS)
			setTextLineTrigger	Mines_A		:Mines_A	"Your mines in"
		else
			setTextLineTrigger	Mines		:Mines		"Your mines in"
		end
	end
	if (($MINE_REACTION = "Limps") OR ($MINE_REACTION = "Armids/Limps"))
		setTextLineTrigger	Limp		:Limp		"Limpet mine in"
	end
	pause
	:Banner
		killAllTriggers
		goto :Disp_Banner
	:Discod
	   	killAllTriggers
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
		killAllTriggers
		gosub :quikstats
		if ($CURRENT_PROMPT = "Command")
			send " L Z" & #8 & $Planet_Number & "*  *  J  C  *  "
			setTextLineTrigger	NotLanded	:NotLanded		"Are you sure you want to jettison all cargo?"
			setTextLineTrigger	Landed		:Landed			"<Enter Citadel>"
			setDelayTrigger		TestConn	:TestConn		3000
			pause
			:TestConn
				killAllTriggers
				if (CONNECTED = FALSE)
					goto :Disco_Test
				else
					send ("'" & $TagLineB & " Problem Detected Unable to Land!*")
					halt
				end
			:NotLanded
				killAllTriggers
				send ("'" & $TagLineB & " Unable To Land, Check my TA.*")
				halt
			:Landed
				killAllTriggers
				send ("'" & $TagLineB & " Restarting...*")
			    waitfor "Message sent on sub-space channel"
				goto :inac
		elseif ($CURRENT_PROMPT = "Citadel")
			send ("'" & $TagLineB & " Restarting...*")
		    waitfor "Message sent on sub-space channel"
	   		goto :inac
	   	else
	   		send (" p d 0* 0* 0* * *** * c q q q q q z 2 2 c q * z * *** * * '" & $TagLineB & "Attempting to Reach Correct Prompt...*")
			setTextLineTrigger	EMQ_COMPLETE	:EMQ_DELAY "Attempting to Reach Correct Prompt..."
			setDelayTrigger 	EMQ_DELAY		:EMQ_DELAY 3000
			pause
			:EMQ_DELAY
			killAllTriggers
			goto :Disco_Test
		end
	:Mines
		killTrigger inac
		killTrigger FigHit
		killTrigger Limp
		killTrigger Mines
		killTrigger Fighit_A
		getWord CURRENTLINE $ck 1
		if ($ck <> "Your")
			goto :Again
		end
		getWord CURRENTLINE $Hit_Sector 4
		goto :Pwarp_GO
    :Mines_A
    	killTrigger Mines_A
    	killTrigger Fighit_A
		killTrigger inac
		killTrigger Limp
		getWord CURRENTLINE $Hit_Sector 4
		getWord CURRENTANSILINE $ansi 9
		cutText $ansi $num 10 2
		stripText $Hit_Sector ":"
		if ($num <> 33)
			goto :Pwarp_GO
		else
			goto :Again
		end
	:Limp
		killTrigger Fighit_A
		killTrigger Mines_A
		killTrigger inac
		killTrigger Limp
		killTrigger FigHit
		killTrigger Mines
		getWord CURRENTLINE $ck 1
		if ($ck <> "Limpet")
			goto :Again
		end
		getWord CURRENTLINE $Hit_Sector 4
		goto :Pwarp_GO
	:Fighit_A
		killTrigger inac
		killTrigger Mines_A
		killTrigger Fighit_A
		killTrigger Limp
		getWord CURRENTLINE $Hit_Sector 5
		getWord CURRENTANSILINE $ansi 6
		cutText $ansi $num 10 2
		stripText $Hit_Sector ":"
		isNumber $tst $Hit_Sector
		if (($num <> 33) AND ($tst <> 0))
			goto :Pwarp_GO
		else
			goto :Again
		end
	:Fighit
		killTrigger inac
		killTrigger Mines
		killTrigger Limp
		killTrigger FigHit
		getWord CURRENTLINE $ck 1
		if ($ck <> "Deployed")
			goto :Again
		end
		getWord CURRENTLINE $Hit_Sector 5
		stripText $Hit_Sector ":"
		isNumber $tst $Hit_Sector
		if ($tst = 0)
			goto :Again
		end
	:Pwarp_GO
		SetVar $Launch_From $Sects[$Hit_Sector]
		if ($Launch_From <> 0)
			send " B " & $Launch_From & "*  C  Q  "
			pause
		else
			goto :Again
		end
	:BWarp_Blind
		killAllTriggers
		send " N "
		gosub :Clear_Sector
		killAllTriggers
		goto :inac
	:BWarp_Miss
		killAllTriggers
		gosub :Clear_Sector
		goto :inac
	:BWarp_GO
		killTrigger BWARP_Miss
		killTrigger BWarp_Blind
		killTrigger BWarp_GO
		if ($FIREPHOTON)
			send ("y  z  a 99998877665544332211*  *  c  p  y  "&$Hit_Sector&"**Q")
			pause
		else
			send ("y  z  a 99998877665544332211*  *  ")
			goto :gotem_with_no_photon
		end
		:gotem
			killAllTriggers
			getWord CURRENTLINE $ck 1
			if ($ck <> "Photon")
				goto :inac
			end
			:gotem_with_no_photon
			if ($HOLO_SCAN)
				gosub :doScan
			elseif ($DEN_SCAN)
				gosub :doScan_Den
			end

			if ($AUTO_RETURN)
				if ($SCRUB_SECT <> 0)
					setTextTrigger		ReturnedSafe	:ReturnedSafe	"Are you sure you want to jettison all cargo"
					setDelayTrigger		NotSafe2		:WhatsUp		4000
					if ($FIREPHOTON)
					    send ("'" & $TagLineB & " FIRED " & $Launch_From & "->" & $Hit_Sector & "* " & $Suffix)
					else
						send ("'" & $TagLineB & " TRIGGERED " & $Launch_From & "->" & $Hit_Sector & "* " & $Suffix)
					end
					pause
					:ReturnedSafe
						killAllTriggers
						gosub :quikstats
						if ($CURRENT_SECTOR <> $SCRUB_SECT)
							setVar $WeReHere $CURRENT_SECTOR
							gosub :CALL_SAVE_ME
							halt
						end
						gosub :SPIT_IT_OUT
						halt
				else
					setTextLineTrigger	Landed		:doScan_Landed		"Enter Citadel"
					setTextTrigger		NotLanded	:doScan_NotLanded	"Are you sure you want to jettison all cargo"
					setDelayTrigger		WhatsUp		:WhatsUp			4000
					if ($FIREPHOTON)
				    	send ("'" & $TagLineB & " FIRED " & $Launch_From & "->" & $Hit_Sector & "* " & $Suffix)
				    else
						send ("'" & $TagLineB & " TRIGGERED " & $Launch_From & "->" & $Hit_Sector & "* " & $Suffix)
					end
					pause
					:WhatsUp
						killAllTriggers
						gosub :quikstats
						if ($CURRENT_PROMPT <> "Command")
							send (" p d 0* 0* 0* * *** * c q q q q q z 2 2 c q * z * *** * * '" & $TagLineB & " Attmpting To Reach Correct Prompt...*")
							setTextLineTrigger	EMQ_COMPLETE	:EMQ_DELAY "Attmpting To Reach Correct Prompt..."
							setDelayTrigger 	EMQ_DELAY		:EMQ_DELAY 3000
							pause
							:EMQ_DELAY
								killAllTriggers
	    				end
						SetVar $WeReHere $CURRENT_SECTOR
						gosub :CALL_SAVE_ME
						halt
					:doScan_NotLanded
						killAllTriggers
						setTextTrigger	WhereAreWe	:WhereAreWe "(?="
						send "   *   "
						pause
						:WhereAreWe
							getText CURRENTLINE $WeReHere "]:[" "] (?=He"
							isNumber $tst $WeReHere
							if ($tst = 0)
								send "  **  "
								setVar $WeReHere CURRENTSECTOR
							end
							if ($WeReHere <> $Start_Sector)
								gosub :CALL_SAVE_ME
							else
								gosub :SPIT_IT_OUT
								send ("'" & $TagLineB & " Planet #"&$Planet_Number&" Not In Sector, Halting!!*")
								halt
							end
							halt
					:doScan_Landed
						killAllTriggers
				end
			else
				if ($FIREPHOTON)
				   	send ("'" & $TagLineB & " FIRED " & $Launch_From & "->" & $Hit_Sector & ", Halting!!*")
				else
					send ("'" & $TagLineB & " TRIGGERED " & $Launch_From & "->" & $Hit_Sector & ", Halting!!*")
				end
				gosub :SPIT_IT_OUT
				halt
			end

			gosub :SPIT_IT_OUT
			gosub :quikstats

			if ($CURRENT_PROMPT = "Citadel")
				send " Q T N L 2* T N L 3* T N T 1* C "
				gosub :GetPlanet_Info
				if ($Planet_ORE < $ORE_TOLERANCE)
					SetVar $CashAmount $Planet_ORE
					gosub :CommaSize
					send ("'" & $TagLineB & " Planet ORE at " & $CashAmount & ", Stopping*")
					halt
				end
			else
				Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " At Wrong Prompt. Should be in the Citadel!**")
				halt
			end

			gosub :quikstats

			if ($CONTINUOUS)
				if ($PHOTONS = 0)
					gosub :WITHDRAW_CASH
					if ($Loot < $CREDIT_LIMIT)
						send ("'"&$TagLineB&" Not Enough Cash To Furb - Halting!*")
						halt
					end

					gosub :Buy_Fotons
					gosub :quikstats
					if ($PHOTONS = 0)
						send ("'"&$TagLineB&" No Photons Furb'd - Halting!*")
						halt
					end
					if ($CREDITS > $CREDITS_ON_HAND)
						send (" TT"&($CREDITS - $CREDITS_ON_HAND)&"*")
					end
				end
				gosub :quikstats
				if ($UNLIM = 0)
		            if ($TURNS <= $TURN_LIMIT)
						send ("'" & $TagLineB & " Turn Limit Reached. Halting!*")
						halt
					end
				end

				if ($ORE_HOLDS < $TOTAL_HOLDS)
					send ("'"&$TagLineB&" Ship Holds Not Full Of ORE - Halting!*")
					halt
				end
				goto :Disp_Banner
			end
	halt

		:wrong
			killAllTriggers
			gosub :quikstats
			if ($CURRENT_PROMPT = "Citadel")

			elseif ($CURRENT_PROMPT = "Command")
				if ($CURRENT_SECTOR <> $Start_Sector)
					setVar $WeReHere $CURRENT_SECTOR
					gosub :CALL_SAVE_ME
					halt
				else
					send " L Z" & #8 & $Planet_Number & "*  *  J  C  *  ^ Q "
					waitfor ": ENDINTERROG"
					gosub :quikstats
					if ($CURRENT_PROMTP <> "Citadel")
						Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " At Wrong Prompt. Should be in the Citadel!**")
						halt
					end
				end

				send "  Q  T  N  L  2*  T  N  L  3*  T  N  T  1*  C  "

				if ($UNLIM = 0)
		            if ($TURNS <= $TURN_LIMIT)
						send ("'" & $TagLineB & " Turn Limit Reached. Halting!*")
						halt
					end
				end
				
				gosub :GetPlanet_Info

				if ($Planet_ORE < $ORE_TOLERANCE)
					SetVar $CashAmount $Planet_ORE
					gosub :CommaSize
					send ("'" & $TagLineB & "Planet ORE at " & $CashAmount & ", Stopping*")
					halt
				end
				if ($PHOTONS = 0)
					send ("'" & $TagLineB & " Out Of Photons, Stopping!*")
					halt
				end
			else
				Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " At Wrong Prompt. Should be in the Citadel!**")
				halt
			end
			goto :inac
			halt

    #=--------                                                                       -------=#
     #=------------------------------      SUB ROUTINES      ------------------------------=#
    #=--------                                                                       -------=#
:ALIENS_CHECK
	SetTextLineTrigger	Aliens		:AlienRaceFound		"are on the move"
	SetTextTrigger		Nadda		:Nadda				"(?="
	send "#"
	waitfor "Who's Playing"
	pause
	:AlienRaceFound
		killAllTriggers
		setVar $ALIENS TRUE
		return
	:Nadda
    	killAllTriggers
    	setVar $ALIENS FALSE
    	return

:CALL_SAVE_ME
    setTextTrigger friendlyplanet :friendlyplanet "Saveme script activated - Planet "
    setDelayTrigger timeout :timeout 30000
	send "'"&$WeReHere&"=saveme* F Z 1 * Z C D * "
    pause
    :timeout
        killalltriggers
        send "'30 seconds after save call, script halted.*"
		halt
    :friendlyplanet
        killalltriggers
        getText CURRENTLINE $planet "Saveme script activated - Planet " " to "
        send "L " & $planet & "* C 'I landed on planet " & $planet & "* * "
		halt
	return

:GOOD_TO_GO
	if ($CURRENT_PROMPT <> "Citadel")
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Must Start From The Citadel**")
		halt
	end

	if ((STARDOCK = "") OR (STARDOCK = 0))
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " StarDock Not In TWX DBase!**")
		halt
	end

	if ($PHOTONS = 0)
		setVar $FIREPHOTON FALSE
	else
    	setVar $FIREPHOTON TRUE
    end

	setVar $Start_Sector $CURRENT_SECTOR

	send "I"
	waitfor "Turns left     :"
	getWord CURRENTLINE $TURN_FLAG 4
	if ($TURN_FLAG = "Unlimited")
		setVar $UNLIM TRUE
	else
		setVar $UNLIM FALSE
	end

	if ($CREDITS > $CREDITS_ON_HAND)
		send ("TT"&($CREDITS - $CREDITS_ON_HAND)&"*")
	end

	gosub :GetPlanet_Info

   	if ($Planet_TPad = 0)
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Planet Does Not Appear To Have Transport Pad**")
		halt
	end

	if ($Planet_Number	= 0)
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Unable To Obtain Planet Number.**")
		halt
	end

	if ($Planet_ORE	< $Planet_ORE_Min)
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Planet Has Too Little Fuel ORE**")
		halt
	end

	send " cn"
	setTextLineTrigger 	CN1				:CN1			" ANSI graphics            - Off"
	setTextLineTrigger	CN2				:CN2			" Animation display        - On"
	setTextLineTrigger	CN9				:CN9			" Abort display on keys    - ALL KEYS"
	setTextLineTrigger	CNA				:CNA			" Message Display Mode     - Long"
	setTextLineTrigger	CNB				:CNB			" Screen Pauses            - Yes"
	setTextLineTrigger	CNC				:CNC			" Online Auto Flee         - On"
	setTextTrigger		CND				:CND			"Settings command (?=Help)"
	pause

	:CN1
		killTrigger CN1
		setVar $CN1 TRUE
		pause
	:CN2
		killTrigger CN2
		setVar $CN2 TRUE
		pause
	:CN9
		killTrigger CN9
		setVar $CN9 TRUE
		pause
	:CNA
		killTrigger CNA
		setVar $CNA TRUE
		pause
	:CNB
		killTrigger CNB
		setVar $CNB TRUE
		pause
	:CNC
		killTrigger CNC
		setVar $CNC TRUE
		pause
	:CND
		killAllTriggers
		setVar $str ""
		if ($CN1)
			setVar $str ($str & "1")
		end
		if ($CN2)
			setVar $str ($str & "2")
		end
		if ($CN9)
			setVar $str ($str & "9")
		end
		if ($CNA)
			setVar $str ($str & "A")
		end
		if ($CNB)
			setVar $str ($str & "B")
		end
		if ($CNC)
			setVar $str ($str & "C")
		end

	send $str & " q q "
	waitfor "Citadel command (?="
	send " SZ*  Q  T  N  L  1*  T  N  L  2*  T  N  L  3*  T  N  T  1*  C  C  U  Y  V  0*  Y  Y  Q"
	waitfor "<Computer deactivated>"
	waitfor "Citadel command (?="

	if ((SECTOR.FIGS.OWNER[$Start_Sector] <> "belong to your Corp") AND (SECTOR.FIGS.OWNER[$Start_Sector] <> "yours"))
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Must Have Friendly Fighter(s) Deployed!!**")
		halt
	end
	return

:Read_In_Figs
	if ($FIG_SOURCE = "Sector Param")
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Reading Sector Parameters & Building Arrays...**")
		setVar $idx 11

		while ($idx <= SECTORS)
			getSectorParameter $idx "FIGSEC" $flag
			isNumber $tst $flag
			if ($tst <> 0)
				if ($flag > 0)
					setVar $Figs[$idx] 1
				end
			end
        	add $idx 1
		end
	else
		fileExists $tst $FName
		if ($tst = 0)
			fileExists $tst $FName_ck
			if ($tst = 0)
				Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Could Not Locate M()M or ck's Fig file!*")
				halt
			else
				Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Reading ck's Fighter File & Building Arrays**")
				readToArray $FName_ck $Read
				setVar $i 1
				while ($i <= SECTORS)
					getWord $Read[1] $fig_check $i
					if ($fig_check <> 0)
						setVar $Figs[$i] 1
					end
			    	add $i 1
				end
			end
		else
			Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " Reading M()M Fighter File & Building Arrays**")
			readtoarray $FName $Figs
		end
	end

	setVar $idx 11
	setVar $FCnt 0

	while ($idx <= SECTORS)
		setVar $i 1
		setVar $ptr 1
		while ($i <= SECTOR.WARPCOUNT[$idx])
			setVar $adj SECTOR.WARPS[$idx][$i]
			if (($Figs[$adj] <> 0) AND ($ptr <= 5))
				if ($ptr = 1)
					setVar $Sects[$idx] $adj
					add $FCnt 1
				else
					setVar $Sects[$idx][$ptr] $adj
				end
				add $ptr 1
			end
			add $i 1
		end
		add $idx 1
	end

	if ($FCnt = 0)
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & " No Deployed Fighter Data Located. Update FIG List!**")
		halt
	end

	return

:quikstats
	SetVar $CURRENT_PROMPT 		"Undefined"
	killtrigger noprompt
	killtrigger prompt1
	killtrigger prompt2
	killtrigger prompt3
	killtrigger prompt4
	killtrigger statlinetrig
	killtrigger getLine2
	setTextTrigger 		prompt1 	:allPrompts 		"(?="
	setTextLineTrigger 	prompt2 	:secondaryPrompts 	"(?)"
	setTextLineTrigger 	statlinetrig 	:statStart 		#179
	setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
	setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
	send "^Q/"
	pause

	:allPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			SetVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt1 :allPrompts "(?="
		pause
	:secondaryPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			SetVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt2 :secondaryPrompts "(?)"
		pause
	:terraPrompts
		killtrigger prompt3
		killtrigger prompt4
		getWord currentansiline $checkPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			SetVar $CURRENT_PROMPT "Terra"
		end
		setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
		setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
		pause
	:statStart
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
		killtrigger noprompt
		SetVar $stats ""
		SetVar $wordy ""
	:statsline
		killtrigger statlinetrig
		killtrigger getLine2
		SetVar $line2 CURRENTLINE
		replacetext $line2 #179 " "
		striptext $line2 ","
		SetVar $stats $stats & $line2
		getWordPos $line2 $pos "Ship"
		if ($pos > 0)
			goto :gotStats
		else
			setTextLineTrigger getLine2 :statsline
			pause
		end

	:gotStats
		SetVar $stats $stats & " @@@"

		SetVar $current_word 0
		while ($wordy <> "@@@")
			if ($wordy = "Sect")
				getWord $stats $CURRENT_SECTOR   	($current_word + 1)
			elseif ($wordy = "Turns")
				getWord $stats $TURNS  				($current_word + 1)
			elseif ($wordy = "Creds")
				getWord $stats $CREDITS  			($current_word + 1)
			elseif ($wordy = "Figs")
				getWord $stats $FIGHTERS   			($current_word + 1)
			elseif ($wordy = "Shlds")
				getWord $stats $SHIELDS  			($current_word + 1)
			elseif ($wordy = "Hlds")
				getWord $stats $TOTAL_HOLDS   		($current_word + 1)
			elseif ($wordy = "Ore")
				getWord $stats $ORE_HOLDS    		($current_word + 1)
			elseif ($wordy = "Org")
				getWord $stats $ORGANIC_HOLDS    	($current_word + 1)
			elseif ($wordy = "Equ")
				getWord $stats $EQUIPMENT_HOLDS    	($current_word + 1)
			elseif ($wordy = "Col")
				getWord $stats $COLONIST_HOLDS    	($current_word + 1)
			elseif ($wordy = "Phot")
				getWord $stats $PHOTONS   			($current_word + 1)
			elseif ($wordy = "Armd")
				getWord $stats $ARMIDS   			($current_word + 1)
			elseif ($wordy = "Lmpt")
				getWord $stats $LIMPETS   			($current_word + 1)
			elseif ($wordy = "GTorp")
				getWord $stats $GENESIS 	 		($current_word + 1)
			elseif ($wordy = "TWarp")
				getWord $stats $TWARP_TYPE  		($current_word + 1)
			elseif ($wordy = "Clks")
				getWord $stats $CLOAKS   			($current_word + 1)
			elseif ($wordy = "Beacns")
				getWord $stats $BEACONS 			($current_word + 1)
			elseif ($wordy = "AtmDt")
				getWord $stats $ATOMIC  			($current_word + 1)
			elseif ($wordy = "Corbo")
				getWord $stats $CORBO   			($current_word + 1)
			elseif ($wordy = "EPrb")
				getWord $stats $EPROBES 	  		($current_word + 1)
			elseif ($wordy = "MDis")
				getWord $stats $MINE_DISRUPTORS   	($current_word + 1)
			elseif ($wordy = "PsPrb")
				getWord $stats $PSYCHIC_PROBE  		($current_word + 1)
			elseif ($wordy = "PlScn")
				getWord $stats $PLANET_SCANNER  	($current_word + 1)
			elseif ($wordy = "LRS")
				getWord $stats $SCAN_TYPE    		($current_word + 1)
			elseif ($wordy = "Aln")
				getWord $stats $ALIGNMENT    		($current_word + 1)
			elseif ($wordy = "Exp")
				getWord $stats $EXPERIENCE    		($current_word + 1)
			elseif ($wordy = "Corp")
				getWord $stats $CORP  	 			($current_word + 1)
			elseif ($wordy = "Ship")
				getWord $stats $SHIP_NUMBER   		($current_word + 1)
			end
			add $current_word 1
			getWord $stats $wordy $current_word
		end
	:doneQuikstats
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
		killtrigger statlinetrig
		killtrigger getLine2
	return


:GetPlanet_Info
	send " qdc  "
	waitfor "You leave the citadel and return to your ship."
	setTextLineTrigger	PlanetNumber	:PlanetNumber 	"Planet #"
	setTextLineTrigger	PlanetLevel		:PlanetLevel	"Planet has a level"
	setTextLineTrigger	PlanetORE		:PlanetOre		"Fuel Ore"
	setTextLineTrigger	PlanetFIG		:PlanetFIG		"Fighters        N/A"
	setTextLineTrigger	PlanetTPort		:PlanetTPort	"-=-=-=-=-=- TransPort power ="
	setTextTrigger 		PlanetCIT		:PlanetCIT		"Citadel command (?"
	pause

    :PlanetTPort
    	killTrigger PlanetTPort
		getText CURRENTLINE $Planet_TPad "power =" "hops -"
		stripText $Planet_TPad ","
		stripText $Planet_TPad " "
		isNumber $tst $Planet_TPad
		if ($tst = 0)
			setVar $Planet_TPad 0
		end
		pause

	:PlanetShields
		killTrigger PlanetShields
		getWord CURRENTLINE $Planet_Shields 8
		stripText $Planet_Shields ","
		isNumber $tst $Planet_Shields
		if ($tst = 0)
			setVar $Planet_Shields 0
		end
		pause
	:PlanetNumber
    	killTrigger PlanetNumber
    	setVar $temp CURRENTLINE
    	getWord $temp $Planet_Number 2
    	stripText $Planet_Number "#"
		isNumber $tst $Planet_Number
		if ($tst = 0)
			setVar $Planet_Number 0
		end
		pause
	:PlanetLevel
		killTrigger PlanetLevel
		getWord CURRENTLINE $Planet_Level 5
		isNumber $tst $Planet_Level
		if ($tst = 0)
			setVar $Planet_Level 0
		end
		pause
	:PlanetORE
		killTrigger PlanetORE
		getWord CURRENTLINE $Planet_ORE 6
		stripText $Planet_ORE ","
    	pause
	:PlanetFIG
		killTrigger PlanetFIG
		getWord CURRENTLINE $Planet_FIG 5
		stripText $Planet_FIG ","
		pause
	:PlanetCIT
		killAllTriggers
		return


:Clear_Sector
	if ($Launch_From <> 0)
		setVar $ptr $Sects[$Launch_From]
		setVar $j 1
		while ($j <= 5)
			if ($ptr <> 0)
		    	setVar $i 1
				while ($i < 5)
					if (($Sects[$ptr][$i] = $Launch_From) OR ($Sects[$ptr][$i] = 0))
						if ($i = 1)
							setVar $Sects[$ptr] $Sects[$ptr][$i]
							setVar $Sects[$ptr][$i] 0
						else
							setVar $Sects[$ptr][$i] $Sects[$ptr][($i+1)]
							setVar $Sects[$ptr][($i+1)] 0
						end
					end
		        	add $i 1
				end
			end
			setVar $ptr $Sects[$Launch_From][$j]
			add $j 1
		end
		setVar $Sects[$Launch_From]		0
		setVar $Sects[$Launch_From][1]	0
		setVar $Sects[$Launch_From][2]	0
		setVar $Sects[$Launch_From][3]	0
		setVar $Sects[$Launch_From][4]	0
		setVar $Sects[$Launch_From][5]	0
	end
	return

:doScan_Den
	setVar $Line_Pointer 1
	send ("  S  D*  J  *  ")
	waitfor "-------------------------------------------"
	setTextTrigger	DoneScan_D			:DoneScan_D		"Command [TL="
	setTextTrigger end_of_lines_D		:end_of_lines_D	"Are you sure you want to jettison all cargo"
	:reset_trigger_D
	setTextLineTrigger line :line_D
	pause
	:line_D
	setVar $Scan_Line_D CURRENTLINE
	if (($Scan_Line_D = "") OR ($Scan_Line_D = 0))
		goto :reset_trigger_D
	end
	if ($Line_Pointer <= 1000)
		replaceText $Scan_Line_D " ==>    " " => "
		replaceText $Scan_Line_D "  Warps : " "  Warps: "
		replaceText $Scan_Line_D "   NavHaz :   " " Haz: "
		replaceText $Scan_Line_D "  Anom : " " Anom: "
		setVar $HoloOutput[$Line_Pointer] $Scan_Line_D
		add $Line_Pointer 1
	end
	goto :reset_trigger_D

	:end_of_lines_D
    	killTrigger line_D
		setVar $HoloOutput[$Line_Pointer] "ENDENDENDENDENDENDEND"
		pause
	:DoneScan_D
		killAllTriggers
		return

:doScan
	setVar $Line_Pointer 1
	send (" S H*  J  *  ")
	setTextLineTrigger	DoneScan		:DoneScan		"Warps to Sector(s) :"
	setTextLineTrigger	NoScan			:NoScan			"Handle which mine type, 1 Armid or 2 Limpet"
	setTextTrigger		end_of_lines	:end_of_lines	"Are you sure you want to jettison all cargo"
	:reset_trigger
	setTextLineTrigger line :line
	pause
	:line
	setVar $HoloOutput[$Line_Pointer] CURRENTLINE
	if ($Line_Pointer <= 1000)
		add $Line_Pointer 1
	end
	goto :reset_trigger

	:DoneScan
	killTrigger line
	setVar $HoloOutput[$Line_Pointer] "ENDENDENDENDENDENDEND"
	pause
	:NoScan
	killAllTriggers
	# Prob hit with a foton
	halt
	:end_of_lines
	killAllTriggers
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

:MSGS_ON
    :ON_AGAIN
    setTextTrigger onMSGS_ON  :onMSGS_ON "Displaying all messages."
    setTextTrigger onMSGS_OFF :onMSGS_OFF "Silencing all messages."
    send "|"
    pause
    :onMSGS_OFF
    killAllTriggers
    goto :ON_AGAIN
    :onMSGS_ON
    killAllTriggers
    return

:SPIT_IT_OUT
	if ($Line_Pointer > 0)
		if ($HOLO_SCAN)
			setVar $i 1
			send "'*"
			send ($TagLineB & " ---------- Sector Scan From " & $Launch_From & " -----------*")
			while ($i < $Line_Pointer)
				getWordPos $HoloOutput[$i] $pos ("Sector  : " & $Hit_Sector)
				if ($pos <> 0)
					while ($i < $Line_Pointer)
						getWordPos $HoloOutput[$i] $pos "Warps to Sector(s) :"
						if (($HoloOutput[$i] = "") OR ($pos <> 0))
							#send "    *" & $TagLineB & " ---------- Sector Scan -----------*"
							send "     **"
							goto :Done_Scn
						end
						send ($HoloOutput[$i] & "*")
	                	add $i 1
					end
	            end
				add $i 1
			end
			:Done_Scn
		elseif ($DEN_SCAN)
			setVar $i 1
			send "'*"
			send ($TagLineB & " ------- Sector Density Scan From " & $Launch_From & " --------*")
			while ($i < $Line_Pointer)
				getWordPos $HoloOutput[$i] $pos "Command [TL="
				if ($pos = 0)
					send ($HoloOutput[$i] & "*")
				else
					#send ($TagLineB & " ------------- Sector Density Scan --------------**")
					send "    **"
					goto :Done_Scn_D
				end
                	add $i 1
			end
			:Done_Scn_D
		end
	end
	return


:Buy_Fotons
	killAllTriggers
	if ($ALIGNMENT < 1000)
		send ("'"&$TagLineB&" Unable To Furb - Alignment's Below 1,000!*")
		halt
	end

   	setTextLineTrigger DoneBurst		:DoneBurst		": ENDINTERROG"
	#clear avoids, turn on twarp, plot warp courses
	send  (" C V O* Y N " & STARDOCK & "* V 0* Y N " & $Start_Sector & "* U Y Q* ^F" & $CURRENT_SECTOR & "*" & STARDOCK & "*F" & STARDOCK & "*" & $CURRENT_SECTOR & "*Q")
	pause
	:DoneBurst
		killAllTriggers

	setDelayTrigger Wait_A_Bit			:Wait_A_Bit		1000
	pause
	:Wait_A_Bit
		killAllTriggers

	getDistance $Dist $CURRENT_SECTOR STARDOCK
	if ($Planet_TPad < $Dist)
	   send ("'"&$TagLineB&" Unable To Furb - StarDock Is Out Of Range Of T-Pad!*")
	   halt
	end
	getDistance $Dist STARDOCK $CURRENT_SECTOR
	if ($Dist > ($ORE_HOLDS / 3))
	   send ("'"&$TagLineB&" Unable To Furb - Not Enough Gas For Return Trip!*")
	   halt
	end

	setTextLineTrigger	itsalive 	:Buy_Fotons_itsalive		"Items     Status  Trading % of max OnBoard"
	setTextLineTrigger	nosoupforme	:Buy_Fotons_nosoupforme		"I have no information about a port in that sector"
	setDelayTrigger		WeHaveAProb	:Buy_Fotons_WeHaveAProb		3000
	send ("CR"&STARDOCK&"*Q ")
	waitfor "Computer command [TL"
	pause
	:Buy_Fotons_WeHaveAProb
		killAllTriggers
		send ("'"&$TagLineB&" Unable To Furb - Problem Comfirming StarDock's Alive (Timed Out)!*")
		halt
	:Buy_Fotons_nosoupforme
		killAllTriggers
		send ("'"&$TagLineB&" Unable To Furb - StarDock Appears To Have Been Blown!*")
		halt
	:Buy_Fotons_itsalive
		killAllTriggers

	gosub :quikstats

   	setTextTrigger	Buy_Fotons_Blind	:Buy_Fotons_Blind 	"Do you want to make this transport blind"
	setTextTrigger	Buy_Fotons_GO		:Buy_Fotons_GO		"All Systems Ready, shall we engage?"
	setTextLineTrigger Buy_Fotons_Miss	:Buy_Fotons_Miss	"Computer command [TL="
	send " B " & STARDOCK & "* C Q "
	Pause
	:Buy_Fotons_Blind
		killAllTriggers
		send ("'"&$TagLineB&" Unable To Furb - Unable To Obtain B-Warp Lock!*")
		halt
	:Buy_Fotons_Miss
		killAllTriggers
		send ("'"&$TagLineB&" Unable To Furb - Unable To B-Warp. Planet ORE May Be Low!*")
		halt
	:Buy_Fotons_GO
		killAllTriggers
		send " Y  P  SGYGQHP"
		waitFor "How many Photon Missiles do you want"
		getText CURRENTLINE $Lets_Buy "(Max " ")"
		send $Lets_Buy "*"

	    setTextTrigger Buy_Fotonstwarp_lock       :Buy_Fotonstwarp_lock 	"All Systems Ready, shall we engage"
	    setTextTrigger Buy_Fotonsno_twrp_lock     :Buy_Fotonsno_twarp_lock	"Do you want to make this jump blind"
		send ("Q  Q  Q  Z  N  *  M" & $Start_Sector & "* Y ")
		pause
		:Buy_Fotonsno_twarp_lock
			killAllTriggers
			send " N  *  P  SGYG"
			send ("'"&$TagLineB&" Unable To Return, Blind Warp Averted Hiding On Dock!*")
			halt
		:Buy_Fotonstwarp_lock
        	killAllTriggers
        	send (" Y *  *  L Z"&#8&$Planet_Number&"*  * JC*")
			setTextLineTrigger	Buy_Fotons_NotLanded1	:Buy_Fotons_NotLanded1		"Are you sure you want to jettison all cargo?"
			SetDelayTrigger		Buy_Fotons_NotLAnded2	:Buy_Fotons_NotLanded2		4000
			setTextLineTrigger	Buy_Fotons_Landed		:Buy_Fotons_Landed			"<Enter Citadel>"
			pause
			:Buy_Fotons_NotLanded1
				killAllTriggers
				send ("'"&$TagLineB&" Not Landed. Planet "&$Planet_Number&", Not Found!*")
				halt
			:Buy_Fotons_NotLanded2
				killAllTriggers
				send ("'"&$TagLineB&" Return Trip Timed Out - Check My TA!*")
				halt
			:Buy_Fotons_Landed
				killAllTriggers
				send "Q T N T 1* * C"
	return

:WITHDRAW_CASH
	setVar $Loot 0
	setTextLineTrigger	Treasury				:Treasury					"Citadel treasury contains"
	setDelayTrigger		Tellers_On_A_SmokeBreak	:Tellers_On_A_SmokeBreak	3000
	send "  D"
	pause
	:Tellers_On_A_SmokeBreak
		killAllTriggers
		send ("'"&$TagLineB&" Unable To Take Cash From Citadel, Halting!*")
		halt
	:Treasury
		killAllTriggers
		getText CURRENTLINE $Loot "contains" "credits."
		stripText $Loot ","
		stripText $Loot " "
		if ($Loot > $CREDITS_WITHDRAW)
			setVar $Loot $CREDITS_WITHDRAW
		end
		send ("TF"&$Loot&"*")
	return