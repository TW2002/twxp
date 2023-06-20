    #=--------                                                                       -------=#
     #=------------------------------  LoneStar's S.W.A.T E1 ------------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	March 19, 2007  -  Version 1.0
	#		Author		:	LoneStar
	#		TWX			:	2.04b, or 2.04 Final
	#		Description	:	Adjacent Photon Script
	#						This script employs an original Adkacent Sector Lookup that is,
	#						in theory,  the  absolute fastest  possible means of getting an
	#						Adjacent sector in which to P-Warp too.  Also.  I've created an
	#						original 'Restart' that will reset  the script if connection is
	#						lost  --wont leave you hanging at the Sector.  However.  Script
	#						relies on another script,  such as a Bot,  to do the actual re-
	#						connect.
	#
	#						Features Include:
	#								Planet ORE Safety Level;
	#								Uses either M()M's or ck's Fig File;
	#								Auto Returns *before* Photon wave ends;
	#								Holo-Scans and sends results on Sub Space;
	#								Detects Aliens and employs Filtering;
	#								Super Fast Adjacent Sector Lookup;
	#								Intelligent Reset/Restart if Connection is Lost
	#
	#		Credits		:	Mind Dagger's :quikstats Routine (improved version of Singularity's)
	#						Big12ozHog's  Improved  Foton  Script,  borowed  his Mine Disruption
	#						routine,  as well as the basic photon reaction structure (ie :gotem,
	#						and :wrong).

	reqRecording
	logging off
	setVar $TagLine				"LoneStar's S.W.A.T."
	setVar $TagLineB			"[LSWAT] "
	setVar $CURENT_VERSION		"1.0"
	setVar $FName 				"_MOM_" & GAMENAME & ".figs"
	setVar $FName_ck			"_ck_" & GAMENAME & ".figs"
	setVar $Hit_Sector			0
	setVar $idx 				11
	setVar $Start_Sector		0

	setVar $Planet_Number		0
	setVar $Planet_Level		0
	setVar $Planet_ORE			0
	setVar $Planet_ORE_Min		10000
	setVar $Planet_FIG			0
	setVar $Planet_Shields		0
	setVar $ORE_TOLERANCE		$Planet_ORE_Min

	setVar $AUTO_RETURN		TRUE
	setVar $HOLO_SCAN		TRUE
	setVar $CONTINUOUS		TRUE
	setVar $ALIENS			FALSE

	setArray $Figs			SECTORS
	setArray $Sects			SECTORS 5
	setArray $HoloOutput	2000

	if (CONNECTED)
	   	Echo ("**" & ANSI_14 & $TagLine & " Version " & $CURENT_VERSION & ANSI_15 & " - Loading...**")
	else
		Echo ("**" & ANSI_14 & $TagLine & " Version " & $CURENT_VERSION & ANSI_15 & " - Must Be Connected To A Server**")
	end

    gosub :quikstats
	gosub :good_to_go

	send ("  C  V  0*  Y  N " & $Start_Sector & "*  U  Y  Q ^ Q")
	waitfor ": ENDINTERROG"

	gosub :ALIENS_CHECK

	send ("'" & $TagLineB & "v" & $CURENT_VERSION & " Loading, Temporarily Incommunicado*")
	waitfor "Message sent on sub-space channel"

    gosub :MSGS_OFF

	#echo #27 & "[2J"
	:Menu_Top
	echo "***"
	echo "   " & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-"
	echo ANSI_14 & "*           " & $TagLine
	echo ANSI_8 & "*                Version " & $CURENT_VERSION
	echo ANSI_15 & "*           Running From Planet #" & $Planet_Number & "*"
	echo "   " & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-"
	echo "*"
	if ($SCAN_TYPE <> "Holo")
		echo ANSI_5 & "*    " & ANSI_2 & "A" & ANSI_9 & " Holo Immediatelty      " & ANSI_7 & "No LRS Detected"
		setVar $HOLO_SCAN FALSE
	else
		echo ANSI_5 & "*    " & ANSI_2 & "A" & ANSI_9 & " Holo Immediatelty      " & ANSI_15
		if ($HOLO_SCAN)
			Echo "Yep"
		else
			Echo "Nope"
		end
	end
	echo ANSI_5 & "*    " & ANSI_2 & "B" & ANSI_9 & " Auto Return            " & ANSI_15
	if ($AUTO_RETURN)
		Echo "Yep"
	else
		Echo "Nope"
	end
	echo ANSI_5 & "*    " & ANSI_2 & "C" & ANSI_9 & " Run Continuous         " & ANSI_15
	if ($CONTINUOUS)
		Echo "Yep"
	else
		Echo "Nope"
	end
	echo ANSI_5 & "*    " & ANSI_2 & "D" & ANSI_9 & " Filter Aliens          " & ANSI_15
	if ($ALIENS)
		Echo "Yep"
	else
		Echo "Nope"
	end

	SetVar $CashAmount $ORE_TOLERANCE
	gosub :CommaSize
	echo ANSI_5 & "*    " & ANSI_2 & "E" & ANSI_9 & " Planet ORE Safety Lvl  " & ANSI_15 & $CashAmount

	echo "**        " & ANSI_14 & "X" & ANSI_15 & " - Execute    " & ANSI_14 & "Q" & ANSI_15 & " - Quit**"
	getConsoleInput $selection SINGLEKEY
	upperCase $selection
	if ($selection = "Q")
		gosub :MSGS_ON
		echo "**" & ANSI_12 "  Script Halted" & ANSI_15 & "**"
		send " * "
		halt
	elseif (($selection = "A") AND ($SCAN_TYPE = "Holo"))
		if ($HOLO_SCAN)
			setVar $HOLO_SCAN FALSE
		else
			setVar $HOLO_SCAN TRUE
		end
	elseif ($selection = "B")
		if ($AUTO_RETURN)
			setVar $AUTO_RETURN FALSE
		else
			setVar $AUTO_RETURN TRUE
		end
	elseif ($selection = "C")
		if ($CONTINUOUS)
			setVar $CONTINUOUS FALSE
		else
			setVar $CONTINUOUS TRUE
		end
	elseif ($selection = "D")
		if ($ALIENS)
			setVar $ALIENS FALSE
		else
			setVar $ALIENS TRUE
		end
	elseif ($selection = "E")
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
	elseif ($selection = "X")
		gosub :MSGS_ON
		goto :inac
	else
		echo #27 & "[2K" & #27 & "[1A"
	end
	goto :Menu_Top


    #=--------                                                                       -------=#
     #=------------------------------     The Main Event     ------------------------------=#
    #=--------                                                                       -------=#
:inac
	send "'*"
	send ($TagLine  & " v" & $CURENT_VERSION & " Running From Planet #" & $Planet_Number & ", with " & $PHOTONS & " Photons.*")
	if (($HOLO_SCAN) OR ($AUTO_RETURN) OR ($CONTINUOUS))
		setVar $s ""
		if ($HOLO_SCAN)
			setVar $s "         - Holo Scanning"
		end
		if ($AUTO_RETURN)
			if ($s <> "")
				setVar $s ($s & ", Auto Return")
			else
				setVar $s "         - Auto Return"
			end
		end
		if ($CONTINUOUS)
			if ($s <> "")
				setVar $s ($s & ", Continuous")
			else
				setvar $s "         - Continuous"
			end
		end
		if ($s <> "")
			send ($s & "*")
		end
		if ($ORE_TOLERANCE <> 0)
			setVar $CashAmount $ORE_TOLERANCE
			gosub :CommaSize
			send "         - Stopping When Planet ORE Falls Below: " & $CashAmount & "*"
		end

	end

	send "**"
	waitfor "Sub-space comm-link terminated"

:Bang_A_Gong
	killAllTriggers
		setTextLineTrigger	inac		:inac		"INACTIVITY WARNING:"
		SetEventTrigger 	Discod1 	:Discod     "CONNECTION LOST"
		SetEventTrigger		Discod2		:Discod     "Connections have been temporarily disabled."
		setTextLineTrigger	wrong		:wrong		"That is not an adjacent sector"
		setTextLineTrigger	gotem		:gotem		"Photon Missile launched into sector"
	:Again
	if ($Hit_Sector <> 0)
		gosub :Clear_Sector
	end
	:Again_A
	if ($ALIENS)
		setTextLineTrigger	FigHit		:FigHit_A	"Deployed Fighters Report Sector"
		setTextLineTrigger	Mines		:Mines_A	"Your mines in"
	else
		setTextLineTrigger	FigHit		:FigHit		"Deployed Fighters Report Sector"
		setTextLineTrigger	Mines		:Mines		"Your mines in"
	end
		setTextLineTrigger	Disrupt		:Disrupt	"of your mines in"
		setTextLineTrigger	Limp		:Limp		"Limpet mine in"

	pause

	:Fighit_A
		killTrigger inac
		killTrigger Disrupt
		killTrigger Mines_A
		killTrigger Limp
		getWord CURRENTLINE $Hit_Sector 5
		getWord CURRENTANSILINE $ansi 6
		cutText $ansi $num 10 2
		stripText $Hit_Sector ":"
		isNumber $tst $Hit_Sector
		if (($num <> 33) AND ($tst <> 0))
			goto :Pwarp_GO
		else
			goto :Again_A
		end
    :Mines_A
    	killTrigger Fighit_A
		killTrigger inac
		killTrigger Disrupt
		killTrigger Limp
		getWord CURRENTLINE $Hit_Sector 4
		getWord CURRENTANSILINE $ansi 9
		cutText $ansi $num 10 2
		stripText $Hit_Sector ":"
		if ($num <> 33)
			goto :Pwarp_GO
		else
			goto :Again_A
		end
	:Mines
		killTrigger inac
		killTrigger FigHit
		killTrigger Disrupt
		killTrigger Limp
		getWord CURRENTLINE $ck 1
		if ($ck <> "Your")
			goto :Again
		end
		getWord CURRENTLINE $Hit_Sector 4
		goto :Pwarp_GO
	:Disrupt
		killTrigger inac
		killTrigger FigHit
    	killTrigger Fighit_A
		killTrigger Mines
		killTrigger Mines_A
		killTrigger Limp
		setVar $disrupted CURRENTLINE

		if ($thisWarp > 2)
			setVar $thisWarp 0
		end
		getWord $disrupted $ck 1
		if ($ck <> F) AND ($ck <> R) AND ($ck <> P)
			getWordPos $disrupted $inPos "in"
			setVar $inPos $inPos + 8
			cutText $disrupted $Hit_Sector $inPos 999
			if (SECTOR.WARPCOUNT[$Hit_Sector] < 4)
				add $thisWarp 1
				if ($thisWarp > SECTOR.WARPCOUNT[$Hit_Sector])
					setVar $thisWarp SECTOR.WARPCOUNT[$Hit_Sector]
				end
				setVar $Hit_Sector SECTOR.WARPS[$Hit_Sector][$thisWarp]
			else
				goto :Again
			end
		else
			goto :Again
		end
		goto :PWarp_GO

	:Limp
		killTrigger inac
		killTrigger FigHit
    	killTrigger Fighit_A
		killTrigger Mines
		killTrigger Mines_A
		killTrigger Disrupt
		getWord CURRENTLINE $ck 1
		if ($ck <> "Limpet")
			goto :Again
		end
		getWord CURRENTLINE $Hit_Sector 4
		goto :Pwarp_GO
	:Fighit
		killTrigger inac
		killTrigger Mines
		killTrigger Limp
		killTrigger Disrupt
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
			send "p " & $Launch_From & "*y  c  p  y  "&$Hit_Sector&"**q"
			pause
		else
			goto :Again
		end
		halt

	:wrong
		killAllTriggers
		if ($AUTO_RETURN)
			gosub :PWARP_HOME
		end

		gosub :quikstats
		if ($CURRENT_PROMPT = "Citadel")
			gosub :GetPlanet_Info
			if ($Planet_ORE < $ORE_TOLERANCE)
				SetVar $CashAmount $Planet_ORE
				gosub :CommaSize
				send ("'" & $TagLineB & "Planet ORE at " & $CashAmount & ", Stopping*")
				halt
			end
		end
		goto :Bang_A_Gong

	:gotem
		killAllTriggers
		getWord CURRENTLINE $ck 1
		if ($ck <> "Photon")
			goto :Bang_A_Gong
		end

		if ($HOLO_SCAN)
			gosub :doScan
		end

	    send ("'" & $TagLineB & "PHOTON FIRED " & $Launch_From & "->" & $Hit_Sector & "*")
	    waitfor "Message sent on sub-space channel"

		if ($AUTO_RETURN)
			gosub :PWARP_HOME
		end

		if ($Line_Pointer > 0)
			setVar $i 1
			send "'*"
			send ($TagLineB & "---------- Sector Scan From " & $Launch_From & " -----------*")
			while ($i < $Line_Pointer)
				getWordPos $HoloOutput[$i] $pos ("Sector  : " & $Hit_Sector)
				if ($pos <> 0)
					while ($i < $Line_Pointer)
						getWordPos $HoloOutput[$i] $pos "Warps to Sector(s) :"
						if (($HoloOutput[$i] = "") OR ($pos <> 0))
							send $TagLineB & "---------- Sector Scan -----------*"
							send "**"
							goto :Done_Scn
						end
						send ($HoloOutput[$i] & "*")
	                	add $i 1
					end
	            end
				add $i 1
			end
			:Done_Scn
		end

		gosub :quikstats

		if ($CURRENT_PROMPT = "Citadel")
			gosub :GetPlanet_Info
			setVar $MSG ""
			if ($Planet_ORE < $ORE_TOLERANCE)
				SetVar $CashAmount $Planet_ORE
				gosub :CommaSize
				send ("'" & $TagLineB & "Planet ORE at " & $CashAmount & ", Stopping*")
				halt
			end
		end

		if ($PHOTONS = 0)
			send ("'" & $TagLineB & "Out Of Photons*")
			halt
		end

		if ($CONTINUOUS)
			goto :Bang_A_Gong
		end

		halt

	:Discod
	   	killAllTriggers
	   	Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & "Disconnected **"
	   	:Disco_Test
		if (CONNECTED <> TRUE)
			setDelayTrigger		Emancipate_CPU		:Emancipate_CPU 3000
			Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & "Auto Land & Resume Initiated - Awaiting Connection!**"
			pause
			:Emancipate_CPU
			goto :Disco_Test
		end
		waitfor "(?="
		setDelayTrigger		WaitingABit		:WaitingABit	3000
		Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & "Connected - Waiting For Command Prompt!**"
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
					send ("'" & $TagLineB & "Problem Detected Unable to Land!*")
					halt
				end
			:NotLanded
				killAllTriggers
				send ("'" & $TagLineB & "Unable To Land, Check my TA.*")
				halt
			:Landed
				killAllTriggers
				send ("'" & $TagLineB & "Restarting...*")
			    waitfor "Message sent on sub-space channel"
				goto :inac
		elseif ($CURRENT_PROMPT = "Citadel")
			send ("'" & $TagLineB & "Restarting...*")
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


    #=--------                                                                       -------=#
     #=------------------------------      SUB ROUTINES      ------------------------------=#
    #=--------                                                                       -------=#
    #		:ALIENS_CHECK		Auto Detect if Aliens are in game via Send "#"
    #		:good_to_go			Initial startup check. Will not return if Not Good To Go
    #		:quikstats			MD's Quikstats routine
    #		:GetPlanet_Info		Start from Citadel, gets Planet Number, Planet Level, etc
    #		:MSGS_ON			Turns messages on via '|'
    #		:MSGS_OFF			Antithesis of :MSGS_ON
    #		:Clear_Sector		Removes references to $Hit_Sector from its ADJ's in $Sects array
    #		:PWARP_HOME			Returns Planet to starting sector
    #		:doScan				Lifts off Planet, HScans saves info in $HoloOutput, Lands
    #       :CommaSize			Adds the ',' to numeric values for your reading pleasure

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

:good_to_go
	if ($CURRENT_PROMPT <> "Citadel")
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & "Must Start From The Citadel**")
		halt
	end

	if ((STARDOCK = "") OR (STARDOCK = 0))
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & "StarDock Not In TWX DBase!**")
		halt
	end

	if ($PHOTONS = 0)
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & "No Fotons On Board**")
		halt
	end

	setVar $Start_Sector $CURRENT_SECTOR

	gosub :GetPlanet_Info

	if ($Planet_Number	= 0)
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & "Unable To Obtain Planet Number.**")
		halt
	end

	if ($Planet_Level < 4)
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & "Planet Must Be A Level-4**")
		halt
	end

	if ($Planet_ORE	< $Planet_ORE_Min)
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & "Planet Has Too Little Fuel ORE**")
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

	fileExists $tst $FName
	if ($tst = 0)
		fileExists $tst $FName_ck
		if ($tst = 0)
			Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & "Could Not Locate M()M or ck's Fig file!*")
			halt
		else
			Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & "Reading ck's Fighter File & Building Array's**")
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
		Echo ("**" & ANSI_14 & $TagLineB & ANSI_15 & "Reading M()M Fighter File & Building Array's**")
		readtoarray $FName $Figs
	end

	setVar $idx 11
	while ($idx <= SECTORS)
		setVar $i 1
		setVar $ptr 1
		while ($i <= SECTOR.WARPCOUNT[$idx])
			setVar $adj SECTOR.WARPS[$idx][$i]
			if (($Figs[$adj] <> 0) AND ($ptr <= 5))
				if ($ptr = 1)
					setVar $Sects[$idx] $adj
				else
					setVar $Sects[$idx][$ptr] $adj
				end
				add $ptr 1
			end
			add $i 1
		end
		add $idx 1
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
	setTextLineTrigger	PlanetShields	:PlanetShields	"Planetary Defense Shielding Power Level"
	setTextTrigger 		PlanetCIT		:PlanetCIT		"Citadel command (?"
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

:MSGS_OFF
    :OFF_AGAIN
    setTextTrigger offMSGS_OFF :offMSGS_OFF "Silencing all messages."
    setTextTrigger offMSGS_ON  :offMSGS_ON "Displaying all messages."
    send "|"
    pause
    :offMSGS_ON
    killAllTriggers
    goto :OFF_AGAIN
    :offMSGS_OFF
    killAllTriggers
    return

:Clear_Sector
	setVar $ptr $Sects[$Hit_Sector]
	setVar $j 1
	while ($j <= 5)
		if ($ptr <> 0)
	    	setVar $i 1
			while ($i < 5)
				if (($Sects[$ptr][$i] = $Hit_Sector) OR ($Sects[$ptr][$i] = 0))
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
		setVar $ptr $Sects[$Hit_Sector][$j]
		add $j 1
	end
	setVar $Sects[$Hit_Sector]		0
	setVar $Sects[$Hit_Sector][1]	0
	setVar $Sects[$Hit_Sector][2]	0
	setVar $Sects[$Hit_Sector][3]	0
	setVar $Sects[$Hit_Sector][4]	0
	setVar $Sects[$Hit_Sector][5]	0
	return

:PWARP_HOME
	send (" P" & $Start_Sector & "*y")
	setTextLineTrigger pwarp_lock 		:pwarp_lock 	"Locating beam pinpointed"
	setTextLineTrigger no_pwarp_lock 	:no_pwarp_lock 	"Your own fighters must be"
	setTextLineTrigger already 	        :already        "You are already in that sector!"
	setTextLineTrigger no_ore           :no_pwarp_lock 	"You do not have enough Fuel Ore"
	pause
	:no_pwarp_lock
		killAllTriggers
		send ("'" & $TagLineB & "Unable To Pwarp To " & $Start_Sector & "*")
		halt
	:pwarp_lock
		killAllTriggers
		waitFor "Planet is now in sector"
		send ("'" & $TagLineB & "Planet Returned To " & $Start_Sector & "*")
		return
	:already
		killAllTriggers
		send ("'" & $TagLineB & "Planet Hasn't Moved From " & $Start_Sector & "*")
		return


:doScan
	setVar $Line_Pointer 1
	send (" Q Q S H*  L Z" & #8 & $Planet_Number & "* JC*")

	setTextLineTrigger	Landed		:doScan_Landed		"Enter Citadel"
	setTextTrigger		NotLanded	:doScan_NotLanded	"Are you sure you want to jettison all cargo"

	waitfor "Select (H)olo Scan or (D)ensity Scan or (Q)uit?"
	setTextLineTrigger end_of_lines :end_of_lines "Command [TL="
	:reset_trigger
	setTextLineTrigger line :line
	pause

	:line
	setVar $HoloOutput[$Line_Pointer] CURRENTLINE
	if ($Line_Pointer <= 2000)
		add $Line_Pointer 1
	end
	goto :reset_trigger

	:end_of_lines
	killTrigger end_of_lines
	setVar $HoloOutput[$Line_Pointer] "ENDENDENDENDENDENDEND"
	if ($location = "Citadel")
		pause
	else
    	killAllTriggers
		return
	end

	:doScan_NotLanded
	killAllTriggers
    echo "***" & ANSI_14 & $TagLineB & ANSI_15 & "Landing Error, Script Halted!*"
    waitfor "(?="
    halt

	:doScan_Landed
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
