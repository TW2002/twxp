    #=--------                                                                       -------=#
     #=---------------------     LoneStar's Pop Goes The World    -------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	Jan 7, 2008 - Version 1.00
	#		Author		:	LoneStar
	#		TWX			:	Should Work with all Versions
	#		Credits		:	Mind Daggers Mow Routine
	#                       Mind Daggers modified version of Singularity's quikstats
	#
	#		To Run		:	You will Need the following addressed
	#                                    - Stardock Must Be Known
	#                                    - Command Prompt
	#									 - No Photons (can be over ridden)
	#
	#
	#		Fixes       :   Initial Relase
	#						MARCH 20,08 - Fixed twarp triggers, from text to textline
	#
	#
	#		Description	:	Planet Creation greatly inspired by Alexio's script by the same
	#						name.
	#
	#						There's a Help option in the script during run time.  On the technical
	#						side of the script:   A database/catalog of planet types is maintained
	#						and contains free-product values on planets for the Harvesting feature
	#						is suppose to speed things up a tad by not having to always scan for
	#						Presence of Product.
	#						Maximum Number of desired planets that can be popped is 100. No speacial
	#						reason, just seemed like a good idea.
	#

	setVar $TAGLine				"LoneStars POP Goes The World"
	setVar $TagLineB			(ANSI_9&"["&ANSI_14&"LSPOP!"&ANSI_9&"]")
	setVar $Version 			"1.0"

	goto :_START_
	include ".\ls_planet_creation\STATS.ts"
	include "\ls_planet_creation\POP.ts"
:_START_
	gosub :STATS~QUIKSTATS
	if ($STATS~Current_Prompt <> "Command")
		Echo "**" & $TagLineB & ANSI_12 & " Start From Command Prompt!*"
		halt
	end
	if ($STATS~CURRENT_SECTOR = STARDOCK)
		Echo "**" & $TagLineB & ANSI_12 & "Cannot Run From StarDock!*"
		halt
	end
	if ($STATS~CURRENT_SECTOR = 1)
		Echo "**" & $TagLineB & ANSI_12 & "The intense traffic in sector 1 prohibits planetary construction.**"
		halt
	end
	if ($STATS~PHOTONS <> 0)
		Echo "***"
		Echo ANSI_15 & "     !!!Photon's On Board!!!*"
		Echo ANSI_12 & "             WARNING*"
		Echo ANSI_4 & "               -/-*"
		Echo ANSI_15 & "         Continue ("&ANSI_14&"Y"&ANSI_15&"/"&ANSI_14&"N"&ANSI_15&")?**"
		:Warn_Again
		getConsoleInput $Selection SINGLEKEY
		uppercase $Selection
		if ($Selection = "N")
			gosub :LIB~MSGS_ON
			echo "**" & $TagLineB & ANSI_12 "  Script Halted" & ANSI_15 & "**"
			halt
		elseif ($Selection = "Y")
		else
			goto :Warn_Again
		end
	end

	setVar $LIB~CURRENT_SECTOR $STATS~CURRENT_SECTOR
	gosub :LIB~START_UP

	gosub :_MENU_

   	window Report 325 300 ($TAGLine & " Version " & $Version) ONTOP

	setVar $MADE 0
	setVar $FURB_RUNS	0
	setVar $POPPED		0
	setVar $SPENT		0

	setVar $POP~ORE_MOVED	0
	setVar $POP~ORG_MOVED	0
	setVar $POP~EQU_MOVED	0
	setVar $POP~LOOKINGFOR $CATALOG~MAKING
	setVar $POP~MOVE_ORE	$HARVEST_ORE
	setVar $POP~MOVE_ORG	$HARVEST_ORG
	setVar $POP~MOVE_EQU	$HARVEST_EQU
	setVar $POP~MOVE_TOO	$HARVEST_TOO
#	setVar $POP~CUSTOM_NAME	""
	setVar $POP~TOTAL_HOLDS	$STATS~TOTAL_HOLDS
	setArray $POP~PLANET_STATS $CATALOG~TYPE_COUNT 3
	setVar $POP~TYPECOUNT $CATALOG~TYPE_COUNT

	gosub :POP~MakePORT_ARRAY

	while ($MADE < $NUMBER)
		if (($STATS~GENESIS = 0) OR ($STATS~ATOMIC = 0))
			if ($FURB)
				send "   J  Y   "
				waitfor "Are you sure you want to jettison all cargo"
				if ($FUEL_SOURCE = "Port")
					if (PORT.EXISTS[$STATS~CURRENT_SECTOR])
						if ((PORT.CLASS[$STATS~CURRENT_SECTOR] = 3) OR (PORT.CLASS[$STATS~CURRENT_SECTOR] = 4) OR (PORT.CLASS[$STATS~CURRENT_SECTOR] = 5) OR (PORT.CLASS[$STATS~CURRENT_SECTOR] = 7))
							send "  P  T  *  *  0*  0*  *  "
						else
							Echo "**" & $TagLineB & ANSI_12 & " Port Does Not Sell Fuel***"
						end
            		end
				elseif (($FUEL_SOURCE = "Planet") AND ($FUEL_PLANET <> 0))
					send  "  L Z" & #8 & #8 & $FUEL_PLANET & "*  J  T  N  T  1*  J   Q  *  "

					setTextLineTrigger		WrongPlanet		:WrongPlanet	"That planet is not in this sector."
					setTextLineTrigger		NoPlanets		:NoPlanets		"Are you sure you want to jettison all cargo"
					setTextTrigger			Done			:Finish			"Command [TL="
					pause
					:WrongPlanet
						killAllTriggers
						Echo "**" & $TagLineB & ANSI_12 & " Planet #" & $FUEL_PLANET & " Is Not In Sector.**"
						goto :Finish
					:NoPlanets
						killAllTriggers
						Echo "**" & $TagLineB & ANSI_12 & " Planet #" & $FUEL_PLANET & " Appears to be elsewhere.**"
					:Finish
						killAllTriggers
            	end

				gosub :STATS~QUIKSTATS
				setVar $CASH_HOLDING $STATS~CREDITS
				setVar $FURB~CURRENT_SECTOR	$STATS~CURRENT_SECTOR
				setVar $FURB~WAVE 			$LIB~SHIP_MAX_ATTACK
				setVar $FURB~ALIGN			$STATS~ALIGNMENT
				setVar $FURB~EXP			$STATS~EXPERIENCE
				setVar $FURB~TOTAL_HOLDS	$STATS~TOTAL_HOLDS
				setVar $FURB~ORE_HOLDS		$STATS~ORE_HOLDS
				setVar $FURB~TWARP_TYPE		$STATS~TWARP_TYPE
				gosub :FURB~DOIT
				gosub :STATS~QUIKSTATS
				if (($STATS~GENESIS = 0) OR ($STATS~ATOMIC = 0))
					echo "**" & $TagLineB & ANSI_14 & " Furb Failed, Might be out of Cash**"
					halt
				end
				add $FURB_RUNS 1
				add $SPENT ($CASH_HOLDING - $STATS~CREDITS)
			else
				Echo "**" & $TagLineB & ANSI_12 & " Out Of Atomics.***"
				halt
			end
		end

		setVar $Safety_Check ($STATS~SHIELDS + $STATS~FIGHTERS)

		if ($Safety_Check < 1000)
			echo "**" & $TagLineB & ANSI_12 & " DANGER!"&ANSI_15&" Fighter & Shield Levels are Dangerously Low!!**"
			halt
		end

		setVar $MSG ""
    	setVar $MSG ($MSG & "  =-=-=-=POP! Goes The World=-=-=-=*")
		setVar $MSG ($MSG & "  Looking For     : " & $CATALOG~ASCII & "*")
    	setVar $MSG ($MSG & "  Experience      : " & $STATS~EXPERIENCE & "*")
    	setVar $MSG ($MSG & "  Alignment       : " & $STATS~ALIGNMENT & "*")
    	setVar $MSG ($MSG & "  Fighters        : " & $STATS~FIGHTERS & "*")
    	setVar $MSG ($MSG & "  Shields         : " & $STATS~SHIELDS & "*")
    	setVar $MSG ($MSG & "  Cash On Hand    : " & $STATS~CREDITS & "*")
    	setVar $MSG ($MSG & "  Cash Spent      : " & $SPENT & "*")
    	setVar $MSG ($MSG & "  Furb Runs       : " & $FURB_RUNS & "*")
    	setVar $MSG ($MSG & "  Planets Popped  : " & $POPPED & "*")
    	setVar $MSG ($MSG & "  Planets Made    : " & $MADE & " of " & $NUMBER & "*")
    	if ($PLANET_BUFFER_POPPED <> 0)
		setVar $MSG ($MSG & "  Buffer Planets  : " & $PLANET_BUFFER_POPPED & " (Max "&$CUSTOM_BUFFER_MAX&")*")
    	end
		if (($HARVEST_TOO <> 0) AND (($HARVEST_EQU) OR ($HARVEST_ORG) OR ($HARVEST_ORE)))
	    setVar $MSG ($MSG & "      -/-Product Harvested-\-" & "*")
	    setVar $MSG ($MSG & "   Fuel ORE  = " & $POP~ORE_MOVED & " of " & ($POP~TargPlanet_ORE_MAX - $POP~TargPlanet_ORE) & "*")
	    setVar $MSG ($MSG & "   Organics  = " & $POP~ORG_MOVED & " of " & ($POP~TargPlanet_ORG_MAX - $POP~TargPlanet_ORG) & "*")
	    setVar $MSG ($MSG & "   Equipment = " & $POP~EQU_MOVED & " of " & ($POP~TargPlanet_EQU_MAX - $POP~TargPlanet_EQU) & "*")
	    end
	    setVar $MSG ($MSG & "  =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=")

	   	setWindowContents Report $MSG & "*"

		if (($PLANET_BUFFER_CNT = $PLANET_BUFFER) AND ($PLANET_BUFFER <> 0) AND ($PLANET_BUFFER_POPPED < $CUSTOM_BUFFER_MAX))
			setVar $PLANET_BUFFER_CNT 0
			add $PLANET_BUFFER_POPPED 1
			send "  **  "
			waiton "Warps to Sector(s) :"
			waiton "Command [TL"
			if (SECTOR.PLANETCOUNT[$STATS~CURRENT_SECTOR] >= $LIB~MAX_PLANETS)
				send ("  U  Y  N "&$POP_BUFFER&"*   J   C   *  ")
			else
				send ("  U  Y "&$POP_BUFFER&"*   J   C   *  ")
			end
			waiton "Command [TL="
			waiton "Command [TL="
			setDelayTrigger	WTF	:WTF 300
			pause
			:WTF
			killAllTriggers
		else
			gosub :POP~GOESTHEWORLD

			if ($POP~PLANET_MADE)
				add $MADE 1
				if (($PLANET_BUFFER_POPPED <> 0) AND ($STATS~ATOMIC <> 0))
					setVar $BUFFER_NUMBER 0
					send "L"
					waitfor "-----------------------------------"
					setTextLineTrigger		Found_BUFFER	:Found_BUFFER	("> " & $POP_BUFFER)
					setTextTrigger			No_BUFFER		:No_BUFFER		"Land on which planet"
					pause
					:Found_BUFFER
						getText CurrentLine $BUFFER_NUMBER "<" ">"
						stripText $BUFFER_NUMBER " "
						stripText $BUFFER_NUMBER ","
						isNumber $tst $BUFFER_NUMBER
						if ($tst = 0)
							setVar $BUFFER_NUMBER 0
						end
						pause
					:No_Buffer
						killAllTriggers
						if ($BUFFER_NUMBER <> 0)
							send ($BUFFER_NUMBER & "*  Z  D  Y  ")
							subtract $STATS~ATOMIC 1
							waiton "For blowing up this planet you receive"
						else
							send ("  *   *   ")
						end
				end

			elseif ($PLANET_BUFFER <> 0)
				add $PLANET_BUFFER_CNT 1
			end
		end
		add $POPPED 1
		subtract $STATS~GENESIS 1
		subtract $STATS~ATOMIC 1
	end

	Echo "**"
	Echo ANSI_15 & #9 & "  =-=-=-=POP! Goes The World=-=-=-=*"
	Echo ANSI_15 & #9 & "  Made            "&ANSI_14&": " & ANSI_6 & $CATALOG~ASCII & "*"
    Echo ANSI_15 & #9 & "  Experience      "&ANSI_14&": " & ANSI_6 & $STATS~EXPERIENCE & "*"
    Echo ANSI_15 & #9 & "  Alignment       "&ANSI_14&": " & ANSI_6 & $STATS~ALIGNMENT & "*"
    Echo ANSI_15 & #9 & "  Fighters        "&ANSI_14&": " & ANSI_6 & $STATS~FIGHTERS & "*"
	Echo ANSI_15 & #9 & "  Shields         "&ANSI_14&": " & ANSI_6 & $STATS~SHIELDS & "*"
    Echo ANSI_15 & #9 & "  Cash On Hand    "&ANSI_14&": " & ANSI_6 & $STATS~CREDITS & "*"
    Echo ANSI_15 & #9 & "  Cash Spent      "&ANSI_14&": " & ANSI_6 & $SPENT & "*"
    Echo ANSI_15 & #9 & "  Furb Runs       "&ANSI_14&": " & ANSI_6 & $FURB_RUNS & "*"
    Echo ANSI_15 & #9 & "  Planets Popped  "&ANSI_14&": " & ANSI_6 & $POPPED & "*"
    Echo ANSI_15 & #9 & "  Planets Made    "&ANSI_14&": " & ANSI_6 & $MADE & "*"
	if ($PLANET_BUFFER_POPPED <> 0)
		Echo ANSI_15 & #9 & "  Buffer Planets  "&ANSI_14&": " & ANSI_6 & $PLANET_BUFFER_POPPED & "*"
   	end
	if (($HARVEST_TOO <> 0) AND (($HARVEST_EQU) OR ($HARVEST_ORG) OR ($HARVEST_ORE)))
	    Echo ANSI_15 & #9 & "      -/-Product Harvested-\-" & "*"
	    Echo ANSI_15 & #9 & "   Fuel ORE  "&ANSI_14&"= " & ANSI_6 & $POP~ORE_MOVED & "*"
	    Echo ANSI_15 & #9 & "   Organics  "&ANSI_14&"= " & ANSI_6 & $POP~ORG_MOVED & "*"
	    Echo ANSI_15 & #9 & "   Equipment "&ANSI_14&"= " & ANSI_6 & $POP~EQU_MOVED & "*"
    end
    Echo #9 & "  =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=*"
	Echo ANSI_15 & #9 & "   " & $TAGLineB & ANSI_14 & " Completed Normally**"
	halt

include ".\ls_planet_creation\FURB.ts"
include ".\ls_planet_creation\LIB.ts"
include ".\ls_planet_creation\CATALOG.ts"

:_MENU_
	setVar $PLANET_BUFFER_CNT 	0
	setVar $POP_BUFFER			"LoneStars Plan-IT Buffer!"
	setVar $POP~CUSTOM_NAME		""
	setVar $GENERIC 1
	setVar $FUEL_SOURCE 		"Port"
	setVar $CATALOG~TAGLine		$TAGLine
	setVar $CATALOG~Version		$Version
	setVar $POP~TAGLineB		$TagLineB
	setVar $FURB~TAGLineB		$TagLineB

	if ($STATS~CORP <> 0)
		setVar $POP~MAKECORP	TRUE
	end
	setVar $HARVEST_TOO		0
	setVar $HARVEST_ORE		FALSE
	setVar $HARVEST_ORG		FALSE
	setVar $HARVEST_EQU		FALSE

	gosub :LIB~MSGS_OFF
	:TopOfMenu
	Echo #27 & "[2J"
	Echo "***"
	Echo ("    " & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
	Echo ANSI_15 & "*       " & $TAGLine
	Echo ANSI_14 & "*                 Version " & $Version
	Echo ANSI_7 & "*               Planets/Sector: " & ANSI_6 & $LIB~MAX_PLANETS
	Echo ("*    " & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
	echo ANSI_5 & "*       <" & ANSI_8 & "J" & ANSI_5 & ">" & ANSI_5 & " Making Planet Class : "
	if ($CATALOG~MAKING = 0)
		Echo ""
	else
		Echo (ANSI_15 & $NUMBER & " " & $CATALOG~MAKING & ANSI_15)
	end
	echo ANSI_5 & "*       <" & ANSI_8 & "N" & ANSI_5 & ">" & ANSI_5 & " Planet Name         : "
	if ($GENERIC = 1)
		Echo ANSI_15 & "Generic Naming"
	elseif ($GENERIC = 2)
		Echo ANSI_15 & "Random Planet Naming"
	else
		Echo ANSI_15 & $POP~CUSTOM_NAME
	end
	echo ANSI_5 & "*       <" & ANSI_8 & "C" & ANSI_5 & ">" & ANSI_5 & " Corporate Planet    : "
	if ($POP~MAKECORP)
		Echo ANSI_15 & "Yes"
	else
		Echo ANSI_15 & "No"
	end
	if (SECTOR.PLANETCOUNT[$STATS~CURRENT_SECTOR] <> 0)
		echo ANSI_5 & "*       <" & ANSI_8 & "M" & ANSI_5 & ">" & ANSI_5 & " Harvest Resources?  : "
		if (($HARVEST_TOO <> 0) AND ($HARVEST_TOO <> ""))
			Echo ANSI_15 & $HARVEST_TOO
			echo ANSI_8 & "*                     F"&ANSI_5&"uel Ore  : "
			if ($HARVEST_ORE)
				Echo ANSI_6 & "Yes"
			else
				Echo ANSI_6 & "No"
			end
			echo ANSI_8 & "*                     O"&ANSI_5&"rganics  : "
			if ($HARVEST_ORG)
				Echo ANSI_6 & "Yes"
			else
				Echo ANSI_6 & "No"
			end
			echo ANSI_8 & "*                     E"&ANSI_5&"quipment : "
			if ($HARVEST_EQU)
				Echo ANSI_6 & "Yes"
			else
				Echo ANSI_6 & "No"
			end
		end
	end
	echo ANSI_5 & "*       <" & ANSI_8 & "B" & ANSI_5 & ">" & ANSI_5 & " Planet Buffer Logic : "
	if ($PLANET_BUFFER <> 0)
		echo ANSI_15 & $PLANET_BUFFER & " (Max " & $CUSTOM_BUFFER_MAX & ")"
	else
		setVar $CUSTOM_BUFFER_MAX 0
		Echo ANSI_15 & "Off"
	end
	echo ANSI_5 & "*       <" & ANSI_8 & "A" & ANSI_5 & ">" & ANSI_5 & " Auto Buy Atomics    : "
	if ($FURB)
		Echo ANSI_15 & "Yes"
		echo ANSI_6 & "*                 1 "&ANSI_5&"Fuel Source : " & ANSI_15 & $FUEL_SOURCE
		if ($FUEL_SOURCE = "Planet")
			echo ANSI_6 & "*                 2 "&ANSI_5&"Planet      : "
			if ($FUEL_PLANET <> 0)
				echo ANSI_15 & $FUEL_PLANET
			end
		end
	else
		Echo ANSI_15 & "No"
		setVar $FUEL_SOURCE "Port"
	end
	echo "**      " & ANSI_14 & "X" & ANSI_15 & " - Execute    " & ANSI_14 & "Q" & ANSI_15 & " - Quit    " & ANSI_14 & "H" & ANSI_15 & " - Help**"
	:Input_Again
    getConsoleInput $selection SINGLEKEY
	uppercase $Selection
	if ($selection = "Q")
		gosub :LIB~MSGS_ON
		echo "**" & ANSI_12 "  Script Halted" & ANSI_15 & "**"
		halt
	elseif ($Selection = "H")
		gosub :_Help_
	elseif ($Selection = "B")
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Pop how Planets before making a Buffer Planet (Between 5 & 10)?"
		isNumber $tst $selection
		if ($tst = 0)
			setVar $selection 0
		end
		if ($selection < 5)
			setVar $selection 5
		end
		if ($selection > 10)
			setVar $selection 10
		end
		setVar $PLANET_BUFFER $selection
		getInput $selection	ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Maximum Number of Buffer Planets to create (Between 1 & 10)?"
		isNumber $tst $selection
		if ($tst = 0)
			setVar $selection 0
		end
		if ($selection < 1)
			setVar $selection 1
		end
		if ($selection > 10)
			setVar $selection 10
		end
		setVar $CUSTOM_BUFFER_MAX $selection

	elseif (($selection = 2) AND ($FURB) AND ($FUEL_SOURCE = "Planet"))
		getInput $selection ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_15 & "*Planet Number?"

		isnumber $tst $selection
		if ($tst = 0)
			setVar $selection 0
		end
		setVar $FUEL_PLANET $selection
	elseif (($selection = 1) AND ($FURB))
		if ($FUEL_SOURCE = "Port")
			setVar $FUEL_SOURCE "Planet"
			setVar $FUEL_PLANET 0
		elseif ($FUEL_SOURCE = "Planet")
			setVar $FUEL_SOURCE "Port"
			setVar $FUEL_PLANET 0
		end
	elseif ($selection = "A")
		if ($FURB)
			setVar $FURB FALSE
		else
			setVar $FURB TRUE
		end
	elseif (($selection = "F") AND (($HARVEST_TOO <> 0) AND ($HARVEST_TOO <> "")))
		if ($HARVEST_ORE)
			setVar $HARVEST_ORE FALSE
		else
			setVar $HARVEST_ORE TRUE
		end
	elseif (($selection = "O") AND (($HARVEST_TOO <> 0) AND ($HARVEST_TOO <> "")))
		if ($HARVEST_ORG)
			setVar $HARVEST_ORG FALSE
		else
			setVar $HARVEST_ORG TRUE
		end
	elseif (($selection = "E") AND (($HARVEST_TOO <> 0) AND ($HARVEST_TOO <> "")))
		if ($HARVEST_EQU)
			setVar $HARVEST_EQU FALSE
		else
			setVar $HARVEST_EQU TRUE
		end
	elseif ($selection = "M")
		if (($HARVEST_TOO = "0") OR ($HARVEST_TOO = ""))
        	getInput $HARVEST_TOO ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_5 & "Planet Number To Move Product To:"
			isnumber $tst $HARVEST_TOO
			if ($tst = 0)
				setVar $HARVEST_TOO 0
			end
			if ($HARVEST_TOO = 1)
				setVar $HARVEST_TOO 0
			end
			setVar $HARVEST_ORE FALSE
			setVar $HARVEST_ORG FALSE
			setVar $HARVEST_EQU FALSE
		else
			setVar $HARVEST_TOO 0
		end
	elseif ($selection = "X")
		gosub :LIB~MSGS_ON
		if ($CATALOG~MAKING = 0)
			Echo "**" & ANSI_12 & " Planet Class Not Selected.**"
			halt
		end
		return
	elseif ($selection = "N")
		if ($GENERIC = 1)
			setVar $POP~CUSTOM_NAME	"!!RND!!"
			setVar $GENERIC 2
		elseif ($GENERIC = 2)
			getInput $CustomName ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_5 & "*What do you want to name you Planets? (Leave Blank For Generic Names)"
			if ($CustomName = "")
            	setVar $GENERIC 1
            	setVar $POP~CUSTOM_NAME	""
        	else
        		setVar $GENERIC 3
        		setVar $POP~CUSTOM_NAME $CustomName
			end
		else
			setVar $GENERIC	1
			setVar $POP~CUSTOM_NAME	""
		end
	elseif ($selection = "C")
		if ($POP~MAKECORP)
			setVar $POP~MAKECORP FALSE
		else
			setVar $POP~MAKECORP TRUE
		end
	elseif ($selection = "J")
		setVar $CATALOG~MAX_PLANETS $LIB~MAX_PLANETS
		gosub :CATALOG~READER
		Echo ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_15 & "* How Many?                                      *"
		getConsoleInput $selection
		upperCase $selection
		isnumber $tst $selection
		if ($tst = 0)
			setVar $selection 0
		end
		if ($selection < 1)
			setVar $selection 1
		elseif ($selection > 100)
			setVar $selection 100
		end
		setVar $NUMBER $selection
	else
		Echo "*" & ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_5
		goto :Input_Again
	end
	goto :TopOfMenu

:_HELP_
	Echo ("**")
	Echo (ANSI_15 & "*                  " & $TAGLine)
	Echo (ANSI_14 & "*                            Version " & $Version)
	Echo (ANSI_12 & "*                              !HELP!*")
	Echo (" " & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
	Echo "*"
	Echo (ANSI_5 & "<" & ANSI_8 & "J" & ANSI_5 & ">" & ANSI_5 & " Making Planet Class" & ANSI_15 & "    Will Display  a menu  of available Planet Classes*")
	Echo ("*")
	Echo (ANSI_5 & "<" & ANSI_8 & "N" & ANSI_5 & ">" & ANSI_5 & " Planet Name" & ANSI_14 & "            Generic Naming*")
	Echo (ANSI_15 & "                           Uses the  Planet Class Type of the Class selected*")
	Echo ("                           in Option J.*")
	Echo (ANSI_14 & "                           Random Planet Naming*")
	Echo (ANSI_15 & "                           Randomly  picks a name from  a inherant Data Base*")
	Echo ("                           of 1000.*")
	Echo (ANSI_14 & "                           Custom Planet Name*")
	Echo (ANSI_15 & "                           Maximum  Length  of name is 41 characters. Sector*")
	Echo ("                           and  Index variables can  be used  to  help index*")
	Echo ("                           created Planets. For Example:*")
	Echo ("*")
	Echo (ANSI_12 & "                               Custom Name Input   "&ANSI_14&":"&ANSI_15&"  (VOLC "&ANSI_9&"\sct "&ANSI_6&"\idx"&ANSI_15&")*")
	Echo (ANSI_12 & "                               Output For n-Planets"&ANSI_14&":"&ANSI_15&"  (VOLC "&ANSI_9&"123 "&ANSI_6&"1"&ANSI_15&")*")
	Echo ("                                                      (VOLC "&ANSI_9&"123 "&ANSI_6&"2"&ANSI_15&")*")
	Echo ("                                                          ...*")
	Echo ("                                                      (VOLC "&ANSI_9&"123 "&ANSI_6&"n"&ANSI_15&")*")
	Echo ("*")
	Echo (ANSI_5 & "<" & ANSI_8 & "C" & ANSI_5 & ">" & ANSI_5 & " Corporate Planet" & ANSI_15 & "       If  on a  Corp,  default is  Yes; however, working*")
	Echo ("                           with Personal planets can minimize TL spam.*")
	Echo ("*")
	Echo (ANSI_5 & "<" & ANSI_8 & "M" & ANSI_5 & ">" & ANSI_5 & " Harvest Resources?"&ANSI_15&"     Allows you to move all or some product from popped*")
	Echo ("                           planets.This Menu-Option is hidden if there are no*")
	Echo ("                           planets in the sector at startup.*")
	Echo ("*")
	Echo (ANSI_5 & "<" & ANSI_8 & "B" & ANSI_5 & ">" & ANSI_5 & " Planet Buffer Logic"&ANSI_15&"    Setting  can  be  5 to 10.  If  looking for a rare*")
	Echo ("                           Planet Class.  The  script  will  quickly  make an*")
	Echo ("                           additional  planet  in  the sector up to a maximum*")
	Echo ("                           you set..*")
	Echo ("*")
	Echo ("                           This Option uses my Plan-IT Technology!  if one or*")
	Echo ("                           more  buffers  are made,  they will be blown up as*")
	Echo ("                           the selected Planet type materialize!*")
	Echo ("*")
	Echo (ANSI_5 & "<" & ANSI_8 & "A" & ANSI_5 & ">" & ANSI_5 & " Auto Buy Atomics"&ANSI_15&"       Fuel ORE  is not required to Furb Atomics.  However*")
	Echo ("                           if fuel is available from a Planet/Port, the script*")
	Echo ("                           will attempt  to  Twarp a  Red/Blue  Player for the*")
	Echo ("                           Frub.  In any case.  If Twarp is not available, the*")
	Echo ("                           script will Mow (dropping Figs).*")
	Echo (" " & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196)
	Echo (ANSI_9&"                                               ["&ANSI_14&"Press The ANY-Key To Continue"&ANSI_9&"]")
	Echo ("*")

	setTextOutTrigger		TextOut		:TextOut
	pause
	:TextOut
	killAllTriggers
	return