    #=--------                                                                       -------=#
     #=---------------------------  LoneStar's OREinator  ---------------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	June 23, 2007
	#		Version		:	1.62
	#		Author		:	LoneStar
	#		TWX			:	Should Work with TWX 2.04b, or 2.04 Final
	#		Credits		:	Mind Daggers Mow Routine
	#                       Mind Daggers modified version of Singularity's quikstats
	#                       Elder Prophet's Basic Bread-First Routine
	#                       WildStar for the ORE-Whore idea!
	#
	#		To Run		:	You will Need the following addressed
	#                                    - Start At Command, Planet, Citadel, Computer Prompts
	#                                    - At Least Twarp Type 1
	#                                    - 100 Fighters, 100 Shields
	#
	#		Fixes       : JAN 06/09  Return Blind Warp Need Trigger Sync'n
	#
	#		Description	:	Fills a Planet with FUEL to the max, or until it's not possible to
	#						continue.
	#
	#						Script will attempt to Twarp then Mow to and from Dock. It will stop
	#						when planet is Full. When planet is full of ore, it blows the last
	#						planet to avoid an overload at tern, esp handy for running AFK.
	#
	#						The script tries to keep accurate record of ORE moved, and takes into
	#						account Fuel used for Furbing (Shields are furb'd at dock). However,
	#						a high number of Cols in the Fuel-Ore Product Group will have a slight
	#						effect. If a planet is 99% filled and a planet with 100k units of ORE
	#						appears.. the script will only move what there's room for on the target
	#						Planet.
	#
	#		Changes		:	Added a Buffer Logic such that if the percentage of free-product planets
	#						falls below 80%, a buffer planet will be popped --up t a maximum of 10.
	#
	#						Can now OREinate and combination of Fuel Ore, Organics and/or Equipment.
	#
	Logging Off
	reqRecording
	setVar	$TagLine		"LoneStar's OREinator"
	setVar	$Version		"1.62"
	setVar	$TagLineB		(ANSI_9&"["&ANSI_14&"LSOREv"&$Version&ANSI_9&"]")
	setVar	$TagLineC		"[LSOREv" & $Version & "]"
	setVar	$Planet_Max		0
	setVar	$Planet_Has		0
	setVar	$Planet_Room4	0
	setVar	$Planet_Number	0
	setVar	$StarrSector	0
	setVar	$ToalMoved		0
	setVar	$Planets_Empty	0
	setVar	$Planets_Full	0
	setVar	$BUFFERS_POPPED	0
	setVar	$BUFFERS_SYNC	0
	# BLind Warp on return if TRUE
	setVar $BLIND			FALSE

	if ((STARDOCK = "0") OR (STARDOCK = ""))
		Echo "*" & $TagLineB & ANSI_12 & " Must Visit StarDock at Least Once Before Running Script*"
		halt
	end

	gosub	:Global_Grover
	:Prompt_ReCheck
	gosub	:quikstats

	if ($CREDITS < 100000)
		Echo "*" & $TagLineB & ANSI_12 " Not Enough Cash On Hand*"
		halt
	end

	if ($PHOTONS <> 0)
		Echo "*" & $TagLineB & ANSI_12 " Too Many Photons On Board*"
		halt
	end

	if (($FIGHTERS < 100) AND ($SHIELDS < 100))
		Echo "*" & $TagLineB & ANSI_12 " Not Enough Fighters/Shields to Safely Pop Planets*"
		halt
	end

	if ($CURRENT_PROMPT = "Citadel")
		send "  Q  "
		goto :Prompt_ReCheck
	elseif ($CURRENT_PROMPT = "Computer")
		send "  Q  "
		goto :Prompt_ReCheck
	elseif ($CURRENT_PROMPT = "Command")
		send "   **   "
		waiton "Warps to Sector(s) :"
		Echo "**"
		getInput $s "*" & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Planet Number You Want "&ANSI_8&"OREINATOR"&ANSI_14&" To Fill?"
		isNumber $tst $s
		if ($tst = 0)
			Echo "*" & $TagLineB & ANSI_14 & " Not A Valid Number!**"
			halt
		end
		send " L Z" & #8 & $s & "*  *  J  *  "
		setTextTrigger 		GoodPlanet	:GoodPlanet "Planet command (?=help)"
		setTextLineTrigger	BadPlanet	:BadPlanet	"Are you sure you want to jettison all cargo?"
		pause
		:BadPlanet
			killAllTriggers
			Echo "*" & $TagLineB & ANSI_14 " Planet #"& $s & ", Not In Sector!**"
			halt
		:GoodPlanet
			killAllTriggers
			goto :Prompt_ReCheck
	elseif ($CURRENT_PROMPT <> "Planet")
		Echo "*" & $TagLineB & ANSI_12 " Start From Planet Prompt you want to Fill With Product*"
		halt
	end

	:TopOfMenu
	Echo #27 & "[2J"
	Echo "***"
	Echo ("          " & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
	Echo (ANSI_15 & "*                  " & $TAGLine)
	Echo (ANSI_14 & "*                       Version " & $Version & "*")
	Echo ("          " & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
	echo ANSI_15 & "*            Harvest Resources"&ANSI_14&": "
	echo ANSI_7 & "*                                F"&ANSI_5&"uel Ore  "
	if ($MOVING_ORE)
		Echo ANSI_6 & "Yes"
	else
		Echo ANSI_6 & "No"
	end
	echo ANSI_7 & "*                                O"&ANSI_5&"rganics  "
	if ($MOVING_ORG)
		Echo ANSI_6 & "Yes"
	else
		Echo ANSI_6 & "No"
	end
	echo ANSI_7 & "*                                E"&ANSI_5&"quipment "
	if ($MOVING_EQU)
		Echo ANSI_6 & "Yes"
	else
		Echo ANSI_6 & "No"
	end
	echo ANSI_15 & "**            "&ANSI_7&"B"&ANSI_15&"uffer Logic       "&ANSI_14&":  "
	if ($LOGIC)
		echo ANSI_15 & "On"
	else
		echo ANSI_15 & "Off"
	end
	echo ANSI_15 & "**            "&ANSI_7&"R"&ANSI_15&"eturn Blind Warp  "&ANSI_14&":  "
	if ($BLIND)
		echo ANSI_15 & "On"
	else
		echo ANSI_15 & "Off"
	end

	Echo ("**               " & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196)
	echo "*                " & ANSI_14 & "X" & ANSI_15 & " - Execute    " & ANSI_14 & "Q" & ANSI_15 & " - Quit**"
	:Input_Again
	Echo #9 & #9
    getConsoleInput $selection SINGLEKEY
	uppercase $Selection
	if ($selection = "Q")
		echo "**" & $TagLineB & ANSI_12 " Script Halted" & ANSI_15 & "**"
		halt
	elseif ($selection = "B")
		if ($LOGIC)
			setVar $LOGIC FALSE
		else
			setVar $LOGIC TRUE
		end
	elseif ($selection = "F")
		if ($MOVING_ORE)
			setVar $MOVING_ORE FALSE
		else
			setVar $MOVING_ORE TRUE
		end
	elseif ($selection = "O")
		if ($MOVING_ORG)
			setVar $MOVING_ORG FALSE
		else
			setVar $MOVING_ORG TRUE
		end
	elseif ($selection = "E")
		if ($MOVING_EQU)
			setVar $MOVING_EQU FALSE
		else
			setVar $MOVING_EQU TRUE
		end
	elseif ($selection = "R")
		if ($BLIND)
			setVar $BLIND FALSE
		else
			setVar $BLIND TRUE
		end
	elseif ($selection = "X")
		if (($MOVING_ORE = 0) AND ($MOVING_ORG = 0) AND ($MOVING_EQU = 0))
			echo "**" & $TagLineB & ANSI_12 " Nothing To Do" & ANSI_15 & "**"
        	halt
		end
		goto	:Shake_Your_Booty
	else
		Echo "*" & ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_5
		goto :Input_Again
	end
	goto :TopOfMenu

:Shake_Your_Booty
    setVar $StartSector $CURRENT_SECTOR
	send "D"
	waitfor "Planet #"
	getWord CURRENTLINE $Planet_Number 2
	stripText $Planet_Number "#"
	isNumber $tst $Planet_Number
	if ($tst = 0)
		Echo "*" & $TagLineB & ANSI_12 " Unable To Obtain Planet Number*"
		halt
	end

	if ($MOVING_ORE)
		waitfor "Fuel Ore"
		getWord CURRENTLINE $Planet_Has_ORE 6
		getWord CURRENTLINE $Planet_Max_ORE 8
		stripText $Planet_Has_ORE " "
		stripText $Planet_Has_ORE ","
		stripText $Planet_Max_ORE " "
		stripText $Planet_Max_ORE ","
		isNumber $tst $Planet_Has_ORE
		if ($tst = 0)
			Echo "*" & $TagLineB & ANSI_12 " Unable to get Planet ORE level**"
			halt
		end
		isNumber $tst $Planet_Max_ORE
		if ($tst = 0)
			Echo "*" & $TagLineB & ANSI_12 " Unable to get Planet Maximum ORE level**"
			halt
		end
		setVar $Planet_Room4_ORE ($Planet_Max_ORE - $Planet_Has_ORE)
		if ($Planet_Room4_ORE < $TOTAL_HOLDS)
        	setVar $MOVING_ORE FALSE
		end
	end
	if ($MOVING_ORG)
		waitfor "Organics"
		getWord CURRENTLINE $Planet_Has_ORG 5
		getWord CURRENTLINE $Planet_Max_ORG 7
		stripText $Planet_Has_ORG " "
		stripText $Planet_Has_ORG ","
		stripText $Planet_Max_ORG " "
		stripText $Planet_Max_ORG ","
		isNumber $tst $Planet_Has_ORG
		if ($tst = 0)
			Echo "*" & $TagLineB & ANSI_12 " Unable to get Planet ORGANICS level**"
			halt
		end
		isNumber $tst $Planet_Max_ORG
		if ($tst = 0)
			Echo "*" & $TagLineB & ANSI_12 " Unable to get Planet Maximum ORGANICS level**"
			halt
		end
		setVar $Planet_Room4_ORG ($Planet_Max_ORG - $Planet_Has_ORG)
		if ($Planet_Room4_ORG < $TOTAL_HOLDS)
			setVar $MOVING_ORG FALSE
		end
	end
	if ($MOVING_EQU)
		waitfor "Equipment"
		getWord CURRENTLINE $Planet_Has_EQU 5
		getWord CURRENTLINE $Planet_Max_EQU 7
		stripText $Planet_Has_EQU " "
		stripText $Planet_Has_EQU ","
		stripText $Planet_Max_EQU " "
		stripText $Planet_Max_EQU ","
		isNumber $tst $Planet_Has_EQU
		if ($tst = 0)
			Echo "*" & $TagLineB & ANSI_12 " Unable to get Planet EQUIPMENT level**"
			halt
		end
		isNumber $tst $Planet_Max_EQU
		if ($tst = 0)
			Echo "*" & $TagLineB & ANSI_12 " Unable to get Planet Maximum EQUIPMENT level**"
			halt
		end
		setVar $Planet_Room4_EQU ($Planet_Max_EQU - $Planet_Has_EQU)
		if ($Planet_Room4_EQU < $TOTAL_HOLDS)
			setVar $MOVING_EQU FALSE
		end
	end

	if (($MOVING_ORE = 0) AND ($MOVING_ORG = 0) AND ($MOVING_EQU = 0))
		Echo "*" & $TagLineB & ANSI_12 " Nothing To Do**"
	end

	send "Q C U Y V0* Y N " $CURRENT_SECTOR "* ;Q J Y "
	waitfor "Max Figs Per Attack:"
	getWord CURRENTLINE $maxFigAttack 5
	stripText $maxFigAttack ","
	isNumber $tst $maxFigAttack
	if ($tst = 0)
		setVar $maxFigAttack 9999
	end
	waitfor "Are you sure you want to jettison all cargo"

	window status 380 260 ($TagLine & " v" & $Version & " [" & GAMENAME & "]") ONTOP

	while (($MOVING_ORE <> 0) OR ($MOVING_ORG <> 0) OR ($MOVING_EQU <> 0))
		gosub :UpDate_Status

		if (($ATOMIC = 0) OR ($GENESIS = 0))
			if ($CREDITS < 100000)
				gosub :_EXIT_
				Echo "*" & $TagLineB & ANSI_12 " Not Enough Cash On Hand To Furb*"
				halt
			end

			send "L Z" & #8 & $Planet_Number & "*  M  N  T  *  T  N  T  1"&$TOTAL_HOLDS&"*   Q"
			SubTract $Moved $TOTAL_HOLDS
			waitfor "Blasting off from"
			gosub :quikstats
			setVar $FIGS_B4 $FIGHTERS
			gosub :FURB
			gosub :quikstats
			if (($FIGS_B4 - $FIGHTERS) > 1000)
				send "'" $TagLineC " Ship Attacked While Furbing. Halting!*"
				waiton "Message sent on sub-space channel"
				Echo "***" & $TagLineB & ANSI_12 " Ship Attacked While Furbing. Halting!***"
				halt
			end
			if (($ATOMIC = 0) OR ($GENESIS = 0))
				Echo "*" & $TagLineB & ANSI_12 " Furb did not complete properly**"
				halt
			end
			if (($FIGHTERS < 100) AND ($SHIELDS < 100))
				Echo "*" & $TagLineB & ANSI_12 " Not enough Fighter/Shields to continue**"
				halt
	    	end
		end

		send "u y"
		setTextLineTrigger NoOverLoad	:NoOverload		"What do you want to name this planet?"
		setTextLineTrigger Yikes		:Yikes			"I'm sorry, but not enough free matter exists."
		setTextTrigger OverLoad 		:Overload		"Do you wish to abort?"
		pause
		:Yikes
			killAllTriggers
			Echo "*" & $TagLineB & ANSI_12 & " Bad News - Game Maximum Planets Reached.**"
			halt
		:Overload
			killTrigger Overload
			send "n"
			pause
		:NoOverload
			killAllTriggers
			getRnd $PTag 10000 99999
			setVar $PlanetLabel "LoneStars OREinator "&$Version&" [" & $PTag & "]"
			send $PlanetLabel & "*"

		setTextTrigger MakingItCorp :MakingItCorp "Should this be a (C)orporate planet or (P)ersonal planet? "
		setTextTrigger LetsGo		:LetsGo "Command [TL="
		pause
		:MakingItCorp
			killTrigger MakingItCorp
			send "C"
			pause
		:LetsGo
			killAllTriggers

		send "L"
		setTextTrigger 		Landed		:Landed 	"Planet command"
		setTextLineTrigger	Plisted		:Plisted	"-----------------------------------------------"
		if ($MOVING_ORE)
			setTextLineTrigger	B_ORE		:B_ORE		"Fuel Ore"
		end
		if ($MOVING_ORG)
			setTextLineTrigger	B_ORG		:B_ORG		"Organics"
		end
		if ($MOVING_EQU)
			setTextLineTrigger	B_EQU		:B_EQU		"Equipment"
		end
		pause
		:Plisted
			waitfor ("> " & $PlanetLabel)
			getText CURRENTLINE $landing "<" ">"
			striptext $landing " "
			send $landing & "*"
			pause
		:B_ORE
			getword CURRENTLINE $ORE 6
			stripText $ORE " "
			stripText $ORE ","
			isNumber $tst $ORE
			if ($tst = 0)
				setVar $ORE 0
			end
			pause
		:B_ORG
			getword CURRENTLINE $ORG 5
			stripText $ORG " "
			stripText $ORG ","
			isNumber $tst $ORG
			if ($tst = 0)
				setVar $ORG 0
			end
			pause
		:B_EQU
			getword CURRENTLINE $EQU 5
			stripText $EQU " "
			stripText $EQU ","
			isNumber $tst $EQU
			if ($tst = 0)
				setVar $EQU 0
			end
			pause
		:Landed
			killAllTriggers

		setTextLineTrigger	Poof	:Poof		"For blowing up this planet you receive"
		setTextLineTrigger	NoPoof	:NoPoof		"You do not have any Atomic Detonators!"

		setVar $MACRO			""
		setVar $Planet_Dest		$Planet_Number
		setVar $Planet_Source	$landing

		if (($MOVING_ORE) AND ($ORE <> 0))
			if ($Planet_Max_ORE = $Planet_Has_ORE)
				setVar $MOVING_ORE FALSE
			else
				setVar $MOVING $ORE
				if (($Planet_Max_ORE - $Planet_Has_ORE) < $MOVING)
					setVar $MOVING ($Planet_Max_ORE - $Planet_Has_ORE)
				end
				setVar $Source_Amount $MOVING
				add $ORE_MOVED $MOVING
				add $Planet_Has_ORE $MOVING
				setVar $PROCOL_CODE "T"
				setVar $PROCOL_CAT_S 1
				setVar $PROCOL_CAT_D 1
				gosub	:Build_Macro_String
			end
		end
		if (($MOVING_ORG) AND ($ORG <> 0))
			if ($Planet_Max_ORG = $Planet_Has_ORG)
				setVar $MOVING_ORG FALSE
			else
				setVar $MOVING $ORG
				if (($Planet_Max_ORG - $Planet_Has_ORG) < $MOVING)
					setVar $MOVING ($Planet_Max_ORG - $Planet_Has_ORG)
				end
				setVar $Source_Amount $MOVING
				add $ORG_MOVED $MOVING
				add $Planet_Has_ORG $MOVING
				setVar $PROCOL_CODE "T"
				setVar $PROCOL_CAT_S 2
				setVar $PROCOL_CAT_D 2
				gosub	:Build_Macro_String
				subtract $TotalMoved $MOVING
			end
		end
		if (($MOVING_EQU) AND ($EQU <> 0))
			if ($Planet_Max_EQU = $Planet_Has_EQU)
				setVar $MOVING_EQU FALSE
			else
				setVar $MOVING $EQU
				if (($Planet_Max_EQU - $Planet_Has_EQU) < $MOVING)
					setVar $MOVING ($Planet_Max_EQU - $Planet_Has_EQU)
				end
				setVar $Source_Amount $MOVING
				add $EQU_MOVED $MOVING
				add $Planet_Has_EQU $MOVING
				setVar $PROCOL_CODE "T"
				setVar $PROCOL_CAT_S 3
				setVar $PROCOL_CAT_D 3
				gosub	:Build_Macro_String
				subtract $TotalMoved $MOVING
			end
		end
		if ($MACRO <> "")
			add $Planets_Full	1
			send ($Macro & "  Z  D  Y  ")
			pause
		else
			add	$Planets_Empty	1
			send "  Z  D  Y  "
			add $BUFFERS_SYNC 1
			pause
		end

		:NoPoof
			killTrigger Poof
			killTrigger NoPoof
			send " Q  L  Z" & #8 & $Planet_Number & "* M  N  T  *  T  N  T  1* Q"
			waitfor "Blasting off from"
			SubTract $Moved $TOTAL_HOLDS
			GoSub :FURB
			gosub :quikstats
			if (($ATOMIC = 0) OR ($GENESIS = 0))
				Echo "*" & $TagLineB & ANSI_12 " Furb did not complete properly**"
				halt
			end
			if (($FIGHTERS < 100) AND ($SHIELDS < 100))
				Echo "*" & $TagLineB & ANSI_12 " Not enough Fighter/Shields to continue**"
				halt
	    	end
			send "L Z" & $landing & "*  Z  D  Y  "
			waitfor "For blowing up this planet you receive"
		:Poof
			killTrigger Poof
			killTrigger NoPoof

			gosub :quikstats
			if (($BUFFERS_SYNC >= 10) AND ($LOGIC))
				setPrecision 4
				setVar $Decide (($Planets_Full / ($Planets_Empty + $Planets_Full)) * 100)
				setPrecision 0
				SetVar $Decide ($Decide * 1)

				if (($Decide < 80) AND ($GENESIS <> 0) AND ($BUFFERS_POPPED < 10))
					send " U  Y  N   .*  J  C  *  "
					add $BUFFERS_POPPED 1
					subtract $GENESIS 1
				end
				setVar $BUFFERS_SYNC 0
			end
	end

	gosub :_EXIT_
	halt

:_EXIT_
	send "L " & $Planet_Number & "*"
	waitfor "Fuel Ore"
	getWord CURRENTLINE $Planet_Has_ORE 6
	stripText $Planet_Has_ORE " "
	stripText $Planet_Has_ORE ","
	waitfor "Organics"
	getWord CURRENTLINE $Planet_Has_ORG 5
	stripText $Planet_Has_ORG " "
	stripText $Planet_Has_ORG ","
	waitfor "Equipment"
	getWord CURRENTLINE $Planet_Has_EQU 5
	stripText $Planet_Has_EQU " "
	stripText $Planet_Has_EQU ","

	setVar $Status_Msg ($TagLine & " Complete :: Status Of Planet #" & $Planet_Number)
	setVar $CashAmount $Planet_Has_ORE
	gosub :CommaSize
	setVar $Status_Msg ($Status_Msg & "*Planet Fuel Ore    : " & $CashAmount & " of ")
	setVar $CashAmount ($Planet_Max_ORE)
	gosub :CommaSize
	setVar $Status_Msg ($Status_Msg & $CashAmount)
		setVar $CashAmount $Planet_Has_ORG
		gosub :CommaSize
		setVar $Status_Msg ($Status_Msg & "*Planet Organics    : " & $CashAmount & " of ")
		setVar $CashAmount ($Planet_Max_ORG)
		gosub :CommaSize
		setVar $Status_Msg ($Status_Msg & $CashAmount)
	setVar $CashAmount $Planet_Has_EQU
	gosub :CommaSize
	setVar $Status_Msg ($Status_Msg & "*Planet Equipment   : " & $CashAmount & " of ")
	setVar $CashAmount ($Planet_Max_EQU)
	gosub :CommaSize
	setVar $Status_Msg ($Status_Msg & $CashAmount)

	setVar $Status_Msg ($Status_Msg & "*Planet With Product: " & $Planets_Full & " of " & ($Planets_Empty + $Planets_Full))
	send "'*" & $Status_Msg & "**"
	waitfor "Sub-space comm-link terminated"
	return
:Build_Macro_String
	setVar $Trips ($Source_Amount / $TOTAL_HOLDS)
	setVar $Remainder ($Source_Amount - ($Trips * $TOTAL_HOLDS))
   	setVar $i 0
  	while ($i < $Trips)
		setVar $Macro ($Macro & "  "&$PROCOL_CODE&"  N  T  "&$PROCOL_CAT_S&"*  Q  L  Z" & #8 & $Planet_Dest & "*  "&$PROCOL_CODE&"  N  L  "&$PROCOL_CAT_D&"*  Q  L Z" & #8 & $Planet_Source & "*  ")
		add $i 1
	end
	if ($Remainder <> 0)
		setVar $Macro ($Macro & "  "&$PROCOL_CODE&"  N  T  "&$PROCOL_CAT_S&$Remainder&"*  Q  L  Z" & #8 & $Planet_Dest & "*  "&$PROCOL_CODE&"  N  L  "&$PROCOL_CAT_D&"*  Q  L Z" & #8 & $Planet_Source & "*  ")
	end
	return

:FURB
	setTextLineTrigger	itsalive 	:Buy__itsalive			"Items     Status  Trading % of max OnBoard"
	setTextLineTrigger	nosoupforme	:Buy__nosoupforme		"I have no information about a port in that sector"
	setDelayTrigger		WeHaveAProb	:Buy__WeHaveAProb		5000
	send ("CR"&STARDOCK&"*Q ")
	pause
	:Buy__nosoupforme
		killAllTriggers
		Echo "*" & $TagLineB & ANSI_12 " Appears That Dock Has Been Blown*"
    	halt
	:Buy__WeHaveAProb
		killAllTriggers
		Echo "*" & $TagLineB & ANSI_12 " StarDock Verification Has Timed Out After 5 Seconds - Possible Lag*"
		halt
    :Buy__itsalive
    killTrigger itsalive
    killTrigger nosoupforme
    killTrigger WeHaveAProb
    setVar $Result ""
    :FURB_Again
    if ($ALIGNMENT >= 1000)
		send " m" & STARDOCK & "* Y "
	    setTextTrigger		Sector_Gas_Good	:Sector_Gas_Good	"All Systems Ready, shall we engage"
		setTextTrigger		Sector_Gas_Here	:Sector_Gas_Good	"NavPoint Settings (?=Help)"
		setTextTrigger		Sector_Gas_Bad	:Sector_Gas_Bad		"Do you want to make this jump blind"
		setTextTrigger		Sector_Gas_Far	:Sector_Gas_Far		"You do not have enough Fuel Ore to make the jump."
		pause
		:Sector_Gas_Bad
		:Sector_Gas_Far
			killAllTriggers
        	send "  *   *  "
        	setVar $ALIGNMENT 0
        	goto :FURB_Again
		:Sector_Gas_Good
			killAllTriggers
			send " Y  * P S G Y G Q H A"
	else
		setVar $destination STARDOCK
		gosub :getCourse
		if ($courseLength = 0)
			Echo "*" & $TagLineB & ANSI_12 " Problem Gettign To Dock**"
			halt
		else
			setVar $j 2
			setVar $result ""
			while ($j <= $courseLength)
				setVar $result $result&"m"&$COURSE[$j]&"* "
				if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK))
					setVar $result ($result&" Z A "&$maxFigAttack&"* * ")
				end
				add $j 1
			end
			send ($result&" P S G Y G Q H A")
		end
	end

	waitfor "How many Atomic Detonators do you want"
	getText CURRENTLINE $Buy "want (Max" ") ["
	stripText $Buy " "
	stripText $Buy ","
	send $Buy "* T"

	waitfor "How many Genesis Torpedoes do you want"
	getText CURRENTLINE $Buy "want (Max" ") ["
	stripText $Buy " "
	stripText $Buy ","
	send $Buy "*"
	waitfor "<Hardware Emporium>"
	send " q s p c"

	waitfor "How many shield armor points do you want to buy"
	getText CURRENTLINE $Buy "buy (Max" ") ["
	stripText $Buy " "
	stripText $Buy ","
	if ($BLIND)
		send $Buy & "* Q Q Q Mz " & $StartSector & "* y y  *   c q"
		waiton "To which Sector ?"
		setTextLineTrigger	RETURN_MADE_IT	:Sector_Gas_Good3	("]:[" & $StartSector & "] (?=")
		setTextLineTrigger	RETURN_Nope		:RETURN_Nope		("]:[" & STARDOCK & "] (?=")
		waiton "<Computer deactivated>"

		goto :Sector_Gas_Good3
	else
		send $Buy & "* Q Q Q M " & $StartSector & "* y "
	end
   setTextTrigger		Sector_Gas_Good	:Sector_Gas_Good2	"All Systems Ready, shall we engage"
	setTextTrigger		Sector_Gas_Here	:Sector_Gas_Good2	"NavPoint Settings (?=Help)"
	setTextTrigger		Sector_Gas_Bad	:Sector_Gas_Bad2	"Do you want to make this jump blind"
	setTextTrigger		Sector_Gas_Far	:Sector_Gas_Far2	"You do not have enough Fuel Ore to make the jump."
	pause
	:RETURN_Nope
		killalltriggers
		send ("p d 0* 0* 0* " & #8 & #8 & #8 & #8 & #8 & #8 & "q* * *** * c q q q q q z 2 2 c q * z * *** * * Q Q Q Z N *  P S G Y G Q S /")
		waiton #179 & "Turns"
		halt
	:Sector_Gas_Bad2
		killAllTriggers
		Echo "*" & $TagLineB & ANSI_12 " No Fig Lock - Trying MOW**"
		send "  *   *  "
		setVar $destination $StartSector
		gosub :getCourse
		if ($courseLength <> 0)
			setVar $j 2
			setVar $result ""
			while ($j <= $courseLength)
				setVar $result $result&" m"&$COURSE[$j]&"* "
				if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK))
					setVar $result ($result&"  Z  A "&$maxFigAttack&"*  *  ")
				end
				if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK) AND ($j > 2))
					setVar $result ($result&"  F  Z  1 *  Z  C  D  *  ")
				end
				add $j 1
			end
			send ($result&"  *  J  Y  ")
			waitfor "Are you sure you want to jettison all cargo"
			return
		else
			Echo "*" & $TagLineB & ANSI_12 " Unable To Return No Fighter-Lock for Twarp, and Unable To MOW**"
			halt
		end
	:Sector_Gas_Far2
		killAllTriggers
		Echo "*" & $TagLineB & ANSI_12 " Not Enough Gas - Mowing **"
		setVar $destination $StartSector
		gosub :getCourse
		if ($courseLength <> 0)
			setVar $j 2
			setVar $result ""
			while ($j <= $courseLength)
				setVar $result $result&"m"&$COURSE[$j]&"* "
				if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK))
					setVar $result ($result&" Z A "&$maxFigAttack&"* * ")
				end
				add $j 1
			end
			send ($result&"  *  J  Y  ")
			waitfor "Are you sure you want to jettison all cargo"
			return
		else
			Echo "*" & $TagLineB & ANSI_12 " Unable To Return No Gas for Twarp, and Unable To MOW**"
			halt
		end
	:Sector_Gas_Good2
		killAllTriggers
		send "Y   *  J   Y  "
		waiton "Are you sure you want to jettison all cargo"
	:Sector_Gas_Good3
		killAllTriggers
	return

:Global_Grover
	setVar $CURRENT_PROMPT 		"Undefined"
	setVar $PSYCHIC_PROBE 		"NO"
	setVar $PLANET_SCANNER 		"NO"
	setVar $SCAN_TYPE 			"NONE"
	setVar $CURRENT_SECTOR 		0
	setVar $TURNS 				0
	setVar $CREDITS 			0
	setVar $FIGHTERS 			0
	setVar $SHIELDS 			0
	setVar $TOTAL_HOLDS 		0
	setVar $ORE_HOLDS 			0
	setVar $ORGANIC_HOLDS 		0
	setVar $EQUIPMENT_HOLDS 	0
	setVar $COLONIST_HOLDS		0
	setVar $PHOTONS 			0
	setVar $ARMIDS 				0
	setVar $LIMPETS 			0
	setVar $GENESIS 			0
	setVar $TWARP_TYPE 			0
	setVar $CLOAKS 				0
	setVar $BEACONS 			0
	setVar $ATOMIC 				0
	setVar $CORBO 				0
	setVar $EPROBES 			0
	setVar $MINE_DISRUPTORS 	0
	setVar $ALIGNMENT 			0
	setVar $EXPERIENCE			0
	setVar $CORP 				0
	setVar $SHIP_NUMBER			0
	setVar $TURNS_PER_WARP 		0
	setVar $COMMAND_PROMPT 		"Command"
	setVar $COMPUTER_PROMPT 	"Computer"
	setVar $CITADEL_PROMPT		"Citadel"
	setVar $PLANET_PROMPT		"Planet"
	setVar $CORPORATE_PROMPT	"Corporate"
	setVar $STARDOCK_PROMPT 	"Stardock"
	setVar $HARDWARE_PROMPT 	"Hardware"
	setVar $SHIPYARD_PROMPT 	"Shipyard"
	setVar $TERRA_PROMPT 		"Terra"
	setVar $PORT_PROMPT			"Port"
	setVar $PORT_PROMPT_TYPE	""
	return

:quikstats
	setVar $CURRENT_PROMPT 		"Undefined"
	killtrigger 		noprompt
	killtrigger 		prompt1
	killtrigger 		prompt2
	killtrigger 		prompt3
	killtrigger 		prompt4
	killtrigger			prompt5
	killtrigger 		statlinetrig
	killtrigger 		getLine2
	setTextTrigger 		prompt1 		:allPrompts 		"(?="
	setTextLineTrigger 	prompt2 		:secondaryPrompts 	"(?)"
	setTextLineTrigger 	statlinetrig 	:statStart 			#179
	setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
	setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
	setTextTrigger		prompt5			:portPrompt			"How many holds of"
	send "^Q/"
	pause

	:allPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			setVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt1 :allPrompts "(?="
		pause
	:secondaryPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			setVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt2 :secondaryPrompts "(?)"
		pause
	:terraPrompts
		killtrigger prompt3
		killtrigger prompt4
		getWord currentansiline $checkPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			setVar $CURRENT_PROMPT "Terra"
		end
		setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
		setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
		pause
	:portPrompt
		getWord CURRENTANSILINE $checkPrompt 1
		setVar $PORT_PROMPT_TYPE CURRENTLINE
		getWord $PORT_PROMPT_TYPE $tempPrompt 1
		getWordPos $checkPrompt $pos "[35mHow"
		if ($pos > 0)
			setVar $CURRENT_PROMPT "Port"
		end
		setTextTrigger		prompt5			:portPrompt			"How many holds of"
		pause

	:statStart
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
		killtrigger prompt5
		killtrigger noprompt
		setVar $stats ""
		setVar $wordy ""

	:statsline
		killtrigger statlinetrig
		killtrigger getLine2
		setVar $line2 CURRENTLINE
		replacetext $line2 #179 " "
		striptext $line2 ","
		setVar $stats $stats & $line2
		getWordPos $line2 $pos "Ship"
		if ($pos > 0)
			goto :gotStats
		else
			setTextLineTrigger getLine2 :statsline
			pause
		end

	:gotStats
		setVar $stats $stats & " @@@"

		setVar $current_word 0
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
				getWord $stats $GENESIS  			($current_word + 1)
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
				getWord $stats $EPROBES   			($current_word + 1)
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
				getWord $stats $CORP   				($current_word + 1)
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
		killtrigger prompt5
		killtrigger statlinetrig
		killtrigger getLine2

		stripText $CURRENT_PROMPT "<"
		stripText $CURRENT_PROMPT ">"
	return


:getCourse
	killalltriggers
	setVar $sectors ""
	setTextLineTrigger sectorlinetrig :sectorsline " > "
	send "^f*"&$destination&"*nq"
	pause
:sectorsline
	killAllTriggers
	setVar $line CURRENTLINE
	replacetext $line ">" " "
	striptext $line "("
	striptext $line ")"
	setVar $line $line&" "
	getWordPos $line $pos "So what's the point?"
	getWordPos $line $pos2 ": ENDINTERROG"
	getWordPos $line $pos3 "*** Error"

	if (($pos > 0) OR ($pos2 > 0))
		setVar $courseLength 0
		return
	end
	getWordPos $line $pos " sector "
	getWordPos $line $pos2 "TO"
	if (($pos <= 0) AND ($pos2 <= 0))
		setVar $sectors $sectors & " " & $line
	end
	getWordPos $line $pos " "&$destination&" "
	getWordPos $line $pos2 "("&$destination&")"
	getWordPos $line $pos3 "TO"
	if ((($pos > 0) OR ($pos2 > 0)) AND ($pos3 <= 0))
		goto :gotSectors
	else
		setTextLineTrigger sectorlinetrig :sectorsline " > "
		setTextLineTrigger sectorlinetrig2 :sectorsline " "&$destination&" "
		setTextLineTrigger sectorlinetrig3 :sectorsline " "&$destination
		setTextLineTrigger sectorlinetrig4 :sectorsline "("&$destination&")"
		setTextLineTrigger donePath :sectorsline "So what's the point?"
		setTextLineTrigger donePath2 :sectorsline ": ENDINTERROG"
	end
	pause

:gotSectors
	killAllTriggers
	setVar $sectors $sectors&" :::"
	setVar $courseLength 0
	setVar $index 1
	:keepGoing
	if ($sectors = " FM     :::")
		return
	end
	getWord $sectors $COURSE[$index] $index
	while ($COURSE[$index] <> ":::")
		add $courseLength 1
		add $index 1
		getWord $sectors $COURSE[$index] $index
	end
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

:UpDate_Status
	setVar $Status_Msg (" -=-=-=-=-=-=: Filling Planet " & $Planet_Number & ":=-=-=-=-=-=-")
	setVar $CashAmount ($Planet_Max_ORE - ($Planet_Room4_ORE - $ORE_MOVED))
	gosub :CommaSize
	setVar $Status_Msg ($Status_Msg & "* Planet Fuel Ore    : " & $CashAmount & " of ")
	setVar $CashAmount ($Planet_Max_ORE)
	gosub :CommaSize
	setVar $Status_Msg ($Status_Msg & $CashAmount)
	setVar $CashAmount ($ORE_MOVED)
	gosub :CommaSize
	setVar $Status_Msg ($Status_Msg & "*          (Moved    : " & $CashAmount & ")")
		setVar $CashAmount ($Planet_Max_ORG - ($Planet_Room4_ORG - $ORG_MOVED))
		gosub :CommaSize
		setVar $Status_Msg ($Status_Msg & "*        Organics    : " & $CashAmount & " of ")
		setVar $CashAmount ($Planet_Max_ORG)
		gosub :CommaSize
		setVar $Status_Msg ($Status_Msg & $CashAmount)
		setVar $CashAmount ($ORG_MOVED)
		gosub :CommaSize
		setVar $Status_Msg ($Status_Msg & "*          (Moved    : " & $CashAmount & ")")
	setVar $CashAmount ($Planet_Max_EQU - ($Planet_Room4_EQU - $EQU_MOVED))
	gosub :CommaSize
	setVar $Status_Msg ($Status_Msg & "*        Equipment   : " & $CashAmount & " of ")
	setVar $CashAmount ($Planet_Max_EQU)
	gosub :CommaSize
	setVar $Status_Msg ($Status_Msg & $CashAmount)
	setVar $CashAmount ($EQU_MOVED)
	gosub :CommaSize
	setVar $Status_Msg ($Status_Msg & "*          (Moved    : " & $CashAmount & ")")

   	setVar $Status_Msg ($Status_Msg & "*  -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-")
	setVar $Status_Msg ($Status_Msg & "* Planet With Product: " & $Planets_Full & " of " & ($Planets_Empty + $Planets_Full))
	setVar $Status_Msg ($Status_Msg & "* Dets/GTorps OnHand : " & $ATOMIC & "/" & $GENESIS)
	setVar $CashAmount $CREDITS
	gosub :CommaSize
	setVar $Status_Msg ($Status_Msg & "* Cash On Hand       : $" & $CashAmount)
	setVar $CashAmount $FIGHTERS
	gosub :CommaSize
	setVar $Status_Msg ($Status_Msg & "* Fighter / Shields  : " & $CashAmount & "/")
	setVar $CashAmount $SHIELDS
	gosub :CommaSize
	setVar $Status_Msg ($Status_Msg & $CashAmount)
	setVar $CashAmount $EXPERIENCE
	gosub :CommaSize
	setVar $Status_Msg ($Status_Msg & "* Experience         : " & $CashAmount)
	if ($BUFFERS_POPPED <> 0)
		setVar $Status_msg ($Status_Msg & "* Buffer Planets Made: " & $BUFFERS_POPPED)
	end
	setVar $Status_Msg ($Status_Msg & "*")
	setWindowContents status $Status_Msg
	return

