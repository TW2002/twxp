
	# Version 1.1
	#
	#	Fixed output stuff.. added commasize'n as well.
	#
	reqrecording
	logging off
	setVar	$TagLine			"LoneStar's Combined Mover"
	setVar	$Version			"1.0"

	setVar	$PRODUCT__CAT		"Fuel Ore"
	setVar	$PRODUCT__ToFrom	"To"
	setVar	$PRODUCT__HowMany	0

	setVar	$COLONIST__GET		"Fuel Ore"
	setVar	$COLONIST__DROP		"Fuel Ore"
	setVar	$COLONIST__ToFrom	"To"
	setVar	$COLONIST__HowMany	0

	setVar	$FIGHTERS__ToFrom	"To"
	setVar	$FIGHTERS__HowMany	0

	setVar	$DRAINPLANET__TO	0
	setVar	$TARGET_PLANET		0

    gosub 	:Global_Grover
	gosub	:quikstats

	if ($CURRENT_PROMPT <> "Planet")
		Echo ANSI_12 "**Must Start From Planet Prompt**"
		halt
	end

	:Menu_MAIN
	echo " * "
	echo ANSI_15 & "*     LoneStar's Combined Mover"
	echo ANSI_12 & "*  -------------------------------"
	echo ANSI_15 & "*     1    Target Planet     "
	if ($TARGET_PLANET <> "0")
		Echo ANSI_12 & "#"&$TARGET_PLANET
	end
	echo ANSI_15 & "*     2    Product           "
	if ($PRODUCT__HowMany <> "0")
		setVar $CashAmount $PRODUCT__HowMany
		isNumber $tst $CashAmount
		if ($tst <> 0)
			gosub :CommaSize
		end
		Echo ANSI_12 & $CashAmount & " " & $PRODUCT__CAT & " " & ANSI_14 & $PRODUCT__ToFrom & ANSI_12 & " Target Planet"
	end
	echo ANSI_15 & "*     3    Colonists         "
	if ($COLONIST__HowMany <> "0")
		setVar $CashAmount $COLONIST__HowMany
		isNumber $tst $CashAmount
		if ($tst <> 0)
			gosub :CommaSize
		end
		echo ANSI_12 & $CashAmount & " " & $COLONIST__GET & " to " & $COLONIST__DROP & ", " & ANSI_14 & $COLONIST__ToFrom & ANSI_12 & " Target Planet"
	end
	echo ANSI_15 & "*     4    Fighters          "
	if (($TARGET_Planet <> "0") AND ($FIGHTERS__HowMany <> "0"))
		setVar $CashAmount $FIGHTERS__HowMany
		isNumber $tst $CashAmount
		if ($tst <> 0)
			gosub :CommaSize
		end
		echo ANSI_12 & $CashAmount & " " & ANSI_14 & $FIGHTERS__ToFrom & ANSI_12 & " Planet #" & $TARGET_PLANET
	elseif ($FIGHTERS__HowMany <> "0")
		setVar $CashAmount $FIGHTERS__HowMany
		isNumber $tst $CashAmount
		if ($tst <> 0)
			gosub :CommaSize
		end
		echo ANSI_12 & $CashAmount & " " & ANSI_14 & $FIGHTERS__ToFrom & ANSI_12 & " Which Planet?"
	end
	echo ANSI_15 & "*     5    Drain The Planet  "
	if ($DRAINPLANET__TO <> 0)
		Echo ANSI_12 & "To Planet #" & $DRAINPLANET__TO
	end
	echo ANSI_7 & "*     D    ReDisplay Planet"
	echo ANSI_7 & "*     S    Start Script"
	echo ANSI_7 & "*     Q    Quit"
	echo "*"
	getConsoleInput $s SINGLEKEY
	uppercase $s
	if ($s = "Q")
		halt
	elseif ($s = "S")
		goto :Lets_Get_It_On
	elseif ($s = "D")
		send "D"
		waitfor "Planet command"
	elseif ($s = 1)
		Echo ANSI_15 & "* Target Planet Number?*"
		getConsoleInput $s
		isNumber $tst $s
		if ($tst = 0)
			setVar $s 0
		end
		if ($s < 1)
			setVar $s 0
		end
		setVar $TARGET_PLANET $s
	elseif ($s = 2)
		:Menu_Product
		echo " * "
		echo ANSI_15 & "*           Product Menu"
		echo ANSI_12 & "*  -------------------------------"
		echo ANSI_15 & "*     1    Product              " & ANSI_12 & $PRODUCT__CAT
		echo ANSI_15 & "*     2    To/From Planet       " & ANSI_12 & $PRODUCT__ToFrom
		setVar $CashAmount $PRODUCT__HowMany
		isNumber $tst $CashAmount
		if ($tst <> 0)
			gosub :CommaSize
		end
		echo ANSI_15 & "*     3    How Many             " & ANSI_12 & $CashAmount
		echo ANSI_7 & "*     D    ReDisplay Planet"
		echo ANSI_7 & "*     R    Return To Main Menu"
		echo ANSI_7 & "*     S    Start Script"
		echo ANSI_7 & "*     Q    Quit"
		echo "*"
		getConsoleInput $s SINGLEKEY
		uppercase $s
		if ($s = "R")
			goto :Menu_MAIN
		elseif ($s = "Q")
			halt
		elseif ($s = "D")
			send "D"
			waitfor "Planet command"
		elseif ($s = "S")
			goto :Lets_Get_It_On
		elseif ($s = 1)
			if ($PRODUCT__CAT = "Fuel Ore")
				setVar $PRODUCT__CAT "Organics"
			elseif ($PRODUCT__CAT = "Organics")
				setVar $PRODUCT__CAT "Equipment"
			elseif ($PRODUCT__CAT = "Equipment")
				setVar $PRODUCT__CAT "Fuel Ore"
			else
				setVar $PRODUCT__CAT "Fuel Ore"
			end
		elseif ($s = 2)
			if ($PRODUCT__ToFrom = "To")
				setVar $PRODUCT__ToFrom "From"
			else
				setVar $PRODUCT__ToFrom "To"
			end
		elseif ($s = 3)
			setVar $s 0
			Echo ANSI_15 & "* How Many " & ANSI_12 & $PRODUCT__CAT & ANSI_15 & " do you Want To Move ("&ANSI_7&"0 To Move All"&ANSI_15&")?*"
			getConsoleInput $s
			isNumber $tst $s
			if ($tst = 0)
				setVar $s 0
			end
			if ($s = 0)
				setVar $s "All"
			elseif ($s < 1)
				setVar $s 0
			end
			setVar $PRODUCT__HowMany $s
		end
		goto :Menu_Product
	elseif ($s = 3)
		:Menu_Colonists
		echo " * "
		echo ANSI_15 & "*          Colonists Menu"
		echo ANSI_12 & "*  -------------------------------"
		echo ANSI_15 & "*     1    Get Colonists        " & ANSI_12 & $COLONIST__GET
		echo ANSI_15 & "*     2    Drop Colonists       " & ANSI_12 & $COLONIST__DROP
		echo ANSI_15 & "*     3    To/From Planet       " & ANSI_12 & $COLONIST__ToFrom
		setVar $CashAmount $COLONIST__HowMany
		isNumber $tst $CashAmount
		if ($tst <> 0)
			gosub :CommaSize
		end
		echo ANSI_15 & "*     4    How Many             " & ANSI_12 & $CashAmount
		echo ANSI_7 & "*     D    ReDisplay Planet"
		echo ANSI_7 & "*     R    Return To Main Menu"
		echo ANSI_7 & "*     S    Start Script"
		echo ANSI_7 & "*     Q    Quit"
		echo "*"
		getConsoleInput $s SINGLEKEY
		uppercase $s
		if ($s = "R")
			goto :Menu_MAIN
		elseif ($s = "Q")
			halt
		elseif ($s = "D")
			send "D"
			waitfor "Planet command"
		elseif ($s = "S")
			goto :Lets_Get_It_On
		elseif ($s = 1)
			if ($COLONIST__GET = "Fuel Ore")
				setVar $COLONIST__GET "Organics"
			elseif ($COLONIST__GET = "Organics")
				setvar $COLONIST__GET "Equipment"
			elseif ($COLONIST__GET = "Equipment")
				setVar $COLONIST__GET "Fuel Ore"
			else
				setVar $COLONIST__GET "Fuel Ore"
			end
		elseif ($s = 2)
			if ($COLONIST__DROP = "Fuel Ore")
				setVar $COLONIST__DROP "Organics"
			elseif ($COLONIST__DROP = "Organics")
				setvar $COLONIST__DROP "Equipment"
			elseif ($COLONIST__DROP = "Equipment")
				setVar $COLONIST__DROP "Fuel Ore"
			else
				setVar $COLONIST__DROP "Fuel Ore"
			end
		elseif ($s = 3)
			if ($COLONIST__ToFrom = "To")
				setVar $COLONIST__ToFrom "From"
			else
				setVar $COLONIST__ToFrom "To"
			end
		elseif ($s = 4)
			Echo ANSI_15 & "* How Many Colonists Do You Want To Move ("&ANSI_7&"0 To Move All"&ANSI_15&")?*"
			getConsoleInput $s
			isNumber $tst $s
			if ($tst = 0)
				setVar $s 0
			end
			if ($s = 0)
				setVar $s "All"
			elseif ($s < 1)
				setVar $s 0
			end
			setVar $COLONIST__HowMany $s
		end
		goto :Menu_Colonists
	elseif ($s = 4)
		:Menu_Fighters
		echo " * "
		echo ANSI_15 & "*           Fighters Menu"
		echo ANSI_12 & "*  -------------------------------"
		echo ANSI_15 & "*     1    To/From Planet       " & ANSI_12 & $FIGHTERS__ToFrom
		setVar $CashAmount $FIGHTERS__HowMany
		isNumber $tst $CashAmount
		if ($tst <> 0)
			gosub :CommaSize
		end
		echo ANSI_15 & "*     2    How Many             " & ANSI_12 & $CashAmount
		echo ANSI_7 & "*     D    ReDisplay Planet"
		echo ANSI_7 & "*     R    Return To Main Menu"
		echo ANSI_7 & "*     S    Start Script"
		echo ANSI_7 & "*     Q    Quit"
		echo "*"
		getConsoleInput $s SINGLEKEY
		uppercase $s
		if ($s = "R")
			goto :Menu_MAIN
		elseif ($s = "Q")
			halt
		elseif ($s = "D")
			send "D"
			waitfor "Planet command"
		elseif ($s = "S")
			goto :Lets_Get_It_On
		elseif ($s = 1)
			if ($FIGHTERS__ToFrom = "To")
				setVar $FIGHTERS__ToFrom "From"
			else
				setVar $FIGHTERS__ToFrom "To"
			end
		elseif ($s = 2)
			Echo ANSI_15 & "* How Many Fighters Do You Want To Move ("&ANSI_7&"0 To Move All"&ANSI_15&")?*"
			getConsoleInput $s
			isNumber $tst $s
			if ($tst = 0)
				setVar $s 0
			end
			if ($s = 0)
				setVar $s "All"
			elseif ($s < 1)
				setVar $s 0
			end
			setVar $FIGHTERS__HowMany $s
		end
		goto :Menu_Fighters
	elseif ($s = 5)
		Echo ANSI_15 & "*Are You Sure You Want To Drain the Planet (Y/N)?"
		getConsoleInput $s SINGLEKEY
		uppercase $s
		if ($s = "Y")
			if ($TARGET_PLANET = "0")
				Echo ANSI_15 & "* Planet Number Do You Want To Move Everything To?*"
				getConsoleInput $s
				isNumber $tst $s
				if ($tst = 0)
					setVar $s 0
				end
				if ($s < 1)
					setVar $s 0
				end

				setVar $TARGET_PLANET $s
			end
			setVar $DRAINPLANET__TO $TARGET_PLANET
			goto :Lets_Get_It_On
		else
			setVar $DRAINPLANET__TO 0
		end
	end
	goto :Menu_MAIN

:Lets_Get_It_On
	if ($TARGET_PLANET = "0")
		Echo ANSI_15 & "* Target Planet Number?*"
		getConsoleInput $s
		isNumber $tst $s
		if ($tst = 0)
			setVar $s 0
		end
		if ($s < 1)
			setVar $s 0
		end
		setVar $TARGET_PLANET $s
		goto :Lets_Get_It_On
	end
	setVar $Macro	""
	setVar $PreMsg	""
	gosub :Get_Planet_Data
	gosub :Do_Sector_Maint
	if ($DRAINPLANET__TO <> 0)
		setVar $PreMsg "'*" & $TagLine & " Version " & $Version	& " - Stripping Planet #" & $Planet_Number & " To Planet #" & $DRAINPLANET__TO & "*Will Send a message when done.**"
        #Building COLS_ORE String
        if ($Planet_COL_ORE <> 0)
        	setVar $Planet_Source $Planet_Number
			setVar $Planet_Dest $DRAINPLANET__TO
			setVar $Source_Amount $Planet_COL_ORE
			setVar $PROCOL_CODE "S"
			setVar $PROCOL_CAT_S 1
			setVar $PROCOL_CAT_D 1
			gosub	:Build_Macro_String
		end
        if ($Planet_ORE <> 0)
        	setVar $Planet_Source $Planet_Number
			setVar $Planet_Dest $DRAINPLANET__TO
			setVar $Source_Amount $Planet_ORE
			setVar $PROCOL_CODE "T"
			setVar $PROCOL_CAT_S 1
			setVar $PROCOL_CAT_D 1
			gosub	:Build_Macro_String
		end
        if ($Planet_COL_ORG <> 0)
        	setVar $Planet_Source $Planet_Number
			setVar $Planet_Dest $DRAINPLANET__TO
			setVar $Source_Amount $Planet_COL_ORG
			setVar $PROCOL_CODE "S"
			setVar $PROCOL_CAT_S 2
			setVar $PROCOL_CAT_D 2
			gosub	:Build_Macro_String
		end
        if ($Planet_ORG <> 0)
        	setVar $Planet_Source $Planet_Number
			setVar $Planet_Dest $DRAINPLANET__TO
			setVar $Source_Amount $Planet_ORG
			setVar $PROCOL_CODE "T"
			setVar $PROCOL_CAT_S 2
			setVar $PROCOL_CAT_D 2
			gosub	:Build_Macro_String
		end
        #Building COLS_EQU String
        if ($Planet_COL_EQU <> 0)
        	setVar $Planet_Source $Planet_Number
			setVar $Planet_Dest $DRAINPLANET__TO
			setVar $Source_Amount $Planet_COL_EQU
			setVar $PROCOL_CODE "S"
			setVar $PROCOL_CAT_S 3
			setVar $PROCOL_CAT_D 3
			gosub	:Build_Macro_String
		end
        if ($Planet_EQU <> 0)
        	setVar $Planet_Source $Planet_Number
			setVar $Planet_Dest $DRAINPLANET__TO
			setVar $Source_Amount $Planet_EQU
			setVar $PROCOL_CODE "T"
			setVar $PROCOL_CAT_S 3
			setVar $PROCOL_CAT_D 3
			gosub	:Build_Macro_String
		end
		if ($Planet_FIGS <> 0)
        	while ($Planet_FIGS > $MAX_FIGS)
				setVar $Macro ($Macro & " M  N  T  *  Q  L Z" & #8 & $DRAINPLANET__TO & "*  M  N L * Q  L Z" & #8 & $Planet_Number & "*  ")
				subtract $Planet_FIGS $MAX_FIGS
			end
			if ($Planet_FIGS > 0)
				setVar $Macro ($Macro & " M  N  T "&$Planet_FIGS&"*  Q  L Z" & #8 & $DRAINPLANET__TO & "*  M  N L * Q  L Z" & #8 & $Planet_Number & "*  ")
			end
		end
	end

	if (($PRODUCT__HowMany <> "0") AND ($COLONIST__HowMany <> "0"))
		if (($PRODUCT__ToFrom = "To") AND ($COLONIST__ToFrom = "To"))
			setVar $PreMsg "'*" & $TagLine & " Version " & $Version & " Moving Product & Colonists From Planet #" & $Planet_Number & " to Planet #" & $TARGET_PLANET & "*Will Send a message when done.**"
        	setVar $Planet_Source $Planet_Number
			setVar $Planet_Dest $TARGET_PLANET
			if ($PRODUCT__CAT =	"Fuel Ore")
				setVar $PRODUCT__CAT 1
			elseif ($PRODUCT__CAT = "Organics")
				setVar $PRODUCT__CAT 2
			elseif ($PRODUCT__CAT = "Equipment")
				setVar $PRODUCT__CAT 3
			end

			if ($PRODUCT__HowMany = "All")
				if ($PRODUCT__CAT = 1)
					setVar $PRODUCT__HowMany $Planet_ORE
					if ($PRODUCT__HowMany > ($TargPlanet_ORE_MAX - $TargPlanet_ORE))
						setVar $PRODUCT__HowMany ($TargPlanet_ORE_MAX - $TargPlanet_ORE)
					end
				elseif ($PRODUCT__CAT = 2)
					setVar $PRODUCT__HowMany $Planet_ORG
					if ($PRODUCT__HowMany > ($TargPlanet_ORG_MAX - $TargPlanet_ORG))
						setVar $PRODUCT__HowMany ($TargPlanet_ORG_MAX - $TargPlanet_ORG)
					end
				elseif ($PRODUCT__CAT = 3)
					setVar $PRODUCT__HowMany $Planet_EQU
					if ($PRODUCT__HowMany > ($TargPlanet_EQU_MAX - $TargPlanet_EQU))
						setVar $PRODUCT__HowMany ($TargPlanet_EQU_MAX - $TargPlanet_EQU)
					end
				end
			else
				if ($PRODUCT__CAT = 1)
					if ($PRODUCT__HowMany > $Planet_ORE)
						setVar $PRODUCT__HowMany $Planet_ORE
					end
					if ($PRODUCT__HowMany > ($TargPlanet_ORE_MAX - $TargPlanet_ORE))
						setVar $PRODUCT__HowMany ($TargPlanet_ORE_MAX - $TargPlanet_ORE)
					end
				elseif ($PRODUCT__CAT = 2)
					if ($PRODUCT__HowMany > $Planet_ORG)
						setVar $PRODUCT__HowMany $Planet_ORG
					end
					if ($PRODUCT__HowMany > ($TargPlanet_ORG_MAX - $TargPlanet_ORG))
						setVar $PRODUCT__HowMany ($TargPlanet_ORG_MAX - $TargPlanet_ORG)
					end
				elseif ($PRODUCT__CAT = 3)
					if ($PRODUCT__HowMany > $Planet_EQU)
						setVar $PRODUCT__HowMany $Planet_EQU
					end
					if ($PRODUCT__HowMany > ($TargPlanet_EQU_MAX - $TargPlanet_EQU))
						setVar $PRODUCT__HowMany ($TargPlanet_EQU_MAX - $TargPlanet_EQU)
					end
				end
			end
			setVar $Source_Amount $PRODUCT__HowMany
			setVar $PROCOL_CODE "T"
			setVar $PROCOL_CAT_S $PRODUCT__CAT
			setVar $PROCOL_CAT_D $PRODUCT__CAT
			gosub	:Build_Macro_String

			if ($COLONIST__GET = "Fuel Ore")
				setVar $PROCOL_CAT_S 1
				if ($COLONIST__HowMany = "All")
					setVar $COLONIST__HowMany $Planet_COL_ORE
				end
				if ($COLONIST__HowMany > $Planet_COL_ORE)
					setVar $COLONIST__HowMany $Planet_COL_ORE
				end
			elseif ($COLONIST__GET = "Organics")
				setVar $PROCOL_CAT_S 2
				if ($COLONIST__HowMany = "All")
					setVar $COLONIST__HowMany $Planet_COL_ORG
				end
				if ($COLONIST__HowMany > $Planet_COL_ORG)
					setVar $COLONIST__HowMany $Planet_COL_ORG
				end
			elseif ($COLONIST__GET = "Equipment")
				setVar $PROCOL_CAT_S 3
				if ($COLONIST__HowMany = "All")
						setVar $COLONIST__HowMany $Planet_COL_EQU
				end
				if ($COLONIST__HowMany > $Planet_COL_EQU)
					setVar $COLONIST__HowMany $Planet_COL_EQU
                end
			end

			if ($COLONIST__DROP = "Fuel Ore")
				setVar $PROCOL_CAT_D 1
			elseif ($COLONIST__DROP = "Organics")
				setVar $PROCOL_CAT_D 2
			elseif ($COLONIST__DROP = "Equipment")
				setVar $PROCOL_CAT_D 3
			end

			setVar $Source_Amount $COLONIST__HowMany
			setVar $PROCOL_CODE "S"
			gosub :Build_Macro_String

        elseif (($PRODUCT__ToFrom = "From") AND ($COLONIST__ToFrom = "From"))
			setVar $PreMsg "'*" & $TagLine & " Version " & $Version & " Moving Product & Colonists From Planet #" & $TARGET_PLANET & " to Planet #" & $Planet_Number & "*Will Send a message when done.**"
        	setVar $Planet_Source $TARGET_PLANET
			setVar $Planet_Dest $Planet_Number
			if ($PRODUCT__CAT =	"Fuel Ore")
				setVar $PRODUCT__CAT 1
			elseif ($PRODUCT__CAT = "Organics")
				setVar $PRODUCT__CAT 2
			elseif ($PRODUCT__CAT = "Equipment")
				setVar $PRODUCT__CAT 3
			end
			if ($PRODUCT__HowMany = "All")
				if ($PRODUCT__CAT = 1)
					setVar $PRODUCT__HowMany $TargPlanet_ORE
					if ($PRODUCT__HowMany > ($Planet_ORE_MAX - $Planet_ORE))
						setVar $PRODUCT__HowMany ($Planet_ORE_MAX - $Planet_ORE)
					end
				elseif ($PRODUCT__CAT = 2)
					setVar $PRODUCT__HowMany $TargPlanet_ORG
					if ($PRODUCT__HowMany > ($Planet_ORG_MAX - $Planet_ORG))
						setVar $PRODUCT__HowMany ($Planet_ORG_MAX - $Planet_ORG)
					end
				elseif ($PRODUCT__CAT = 3)
					setVar $PRODUCT__HowMany $TargPlanet_EQU
					if ($PRODUCT__HowMany > ($Planet_EQU_MAX - $Planet_EQU))
						setVar $PRODUCT__HowMany ($Planet_EQU_MAX - $Planet_EQU)
					end
				end
			else
				if ($PRODUCT__CAT = 1)
					if ($PRODUCT__HowMany > $TargPlanet_ORE)
						setVar $PRODUCT__HowMany $TargPlanet_ORE
					end
					if ($PRODUCT__HowMany > ($Planet_ORE_MAX - $Planet_ORE))
						setVar $PRODUCT__HowMany ($Planet_ORE_MAX - $Planet_ORE)
					end
				elseif ($PRODUCT__CAT = 2)
					if ($PRODUCT__HowMany > $TargPlanet_ORG)
						setVar $PRODUCT__HowMany $TargPlanet_ORG
					end
					if ($PRODUCT__HowMany > ($Planet_ORG_MAX - $Planet_ORG))
						setVar $PRODUCT__HowMany ($Planet_ORG_MAX - $Planet_ORG)
					end
				elseif ($PRODUCT__CAT = 3)
					if ($PRODUCT__HowMany > $TargPlanet_EQU)
						setVar $PRODUCT__HowMany $TargPlanet_EQU
					end
					if ($PRODUCT__HowMany > ($Planet_EQU_MAX - $Planet_EQU))
						setVar $PRODUCT__HowMany ($Planet_EQU_MAX - $Planet_EQU)
					end
				end
			end
			setVar $Source_Amount $PRODUCT__HowMany
			setVar $PROCOL_CODE "T"
			setVar $PROCOL_CAT_S $PRODUCT__CAT
			setVar $PROCOL_CAT_D $PRODUCT__CAT

			setVar $Macro ("  Q  L " & $TARGET_PLANET & "*  ")

			gosub	:Build_Macro_String

			if ($COLONIST__GET = "Fuel Ore")
				setVar $PROCOL_CAT_S 1
				if ($COLONIST__HowMany = "All")
					setVar $COLONIST__HowMany $TargPlanet_COL_ORE
				end
				if ($COLONIST__HowMany > ($TargPlanet_ORE_MAX - $TargPlanet_COL_ORE))
					setVar $COLONIST__HowMany ($TargPlanet_ORE_MAX - $TargPlanet_COL_ORE)
				end
			elseif ($COLONIST__GET = "Organics")
				setVar $PROCOL_CAT_S 2
				if ($COLONIST__HowMany = "All")
					setVar $COLONIST__HowMany $TargPlanet_COL_ORG
				end
				if ($COLONIST__HowMany > ($TargPlanet_ORG_MAX - $TargPlanet_COL_ORG))
					setVar $COLONIST__HowMany ($TargPlanet_ORG_MAX - $TargPlanet_COL_ORG)
				end
			elseif ($COLONIST__GET = "Equipment")
				setVar $PROCOL_CAT_S 3
				if ($COLONIST__HowMany = "All")
					setVar $COLONIST__HowMany $TargPlanet_COL_EQU
				end
				if ($COLONIST__HowMany > ($TargPlanet_EQU_MAX - $TargPlanet_COL_EQU))
					setVar $COLONIST__HowMany ($TargPlanet_EQU_MAX - $TargPlanet_COL_EQU)
                end
			end

			if ($COLONIST__DROP = "Fuel Ore")
				setVar $PROCOL_CAT_D 1
			elseif ($COLONIST__DROP = "Organics")
				setVar $PROCOL_CAT_D 2
			elseif ($COLONIST__DROP = "Equipment")
				setVar $PROCOL_CAT_D 3
			end

			setVar $Source_Amount $COLONIST__HowMany
			setVar $PROCOL_CODE "S"
			gosub :Build_Macro_String

			setVar $Macro ($Macro & "  Q  L " & $Planet_Number & "*  ")
		elseif (($PRODUCT__ToFrom = "To") AND ($COLONIST__ToFrom = "From"))
			setVar $PreMsg "'*" & $TagLine & " Version " & $Version & "*"
			setVar $PreMsg $PreMsg & "Moving Product From Planet #"&$PLANET_NUMBER&" to Planet #"&$TARGET_PLANET&"*"
			setVar $PreMsg $PreMsg & "Moving Colonists from Planet #"&$TARGET_PLANET&" to Planet #"&$PLANET_NUMBER&"*"
			setVar $PreMsg $PreMsg & "will send a message when completed.**"

			if ($PRODUCT__CAT =	"Fuel Ore")
				setVar $PRODUCT__CAT 1
				if ($PRODUCT__HowMany = "All")
				   	setVar $PRODUCT__HowMany $Planet_ORE
				elseif ($PRODUCT__HowMany > ($Planet_ORE_MAX - $Planet_ORE))
					setVar $PRODUCT__HowMany ($Planet_ORE_MAX - $Planet_ORE)
				end
				if ($PRODUCT__HowMany > ($TargPlanet_ORE_MAX - $TargPlanet_ORE))
					setVar $PRODUCT__HowMany ($TargPlanet_ORE_MAX - $TargPlanet_ORE)
				end
			elseif ($PRODUCT__CAT = "Organics")
				setVar $PRODUCT__CAT 2
				if ($PRODUCT__HowMany = "All")
					setVar $PRODUCT__HowMany $Planet_ORG
				elseif ($PRODUCT__HowMany > ($Planet_ORG_MAX - $Planet_ORG))
					setVar $PRODUCT__HowMany ($Planet_ORG_MAX - $Planet_ORG)
				end
				if ($PRODUCT__HowMany > ($TargPlanet_ORG_MAX - $TargPlanet_ORG))
					setVar $PRODUCT__HowMany ($TargPlanet_ORG_MAX - $TargPlanet_ORG)
				end
			elseif ($PRODUCT__CAT = "Equipment")
				setVar $PRODUCT__CAT 3
				if ($PRODUCT__HowMany = "All")
					setVar $PRODUCT__HowMany $Planet_EQU
				elseif ($PRODUCT__HowMany > ($Planet_EQU_MAX - $Planet_EQU))
					setVar $PRODUCT__HowMany ($Planet_EQU_MAX - $Planet_EQU)
				end
				if ($PRODUCT__HowMany > ($TargPlanet_EQU_MAX - $TargPlanet_EQU))
					setVar $PRODUCT__HowMany ($TargPlanet_EQU_MAX - $TargPlanet_EQU)
				end
			end

            if ($COLONIST__GET = "Fuel Ore")
            	setVar $COLONIST__GET 1
				if ($COLONIST__HowMany = "All")
					setVar $COLONIST__HowMany $TargPlanet_COL_ORE
				end
            elseif ($COLONIST__GET = "Organics")
            	setVar $COLONIST__GET 2
				if ($COLONIST__HowMany = "All")
					setVar $COLONIST__HowMany $TargPlanet_COL_ORG
				end
            elseif ($COLONIST__GET = "Equipment")
            	setVar $COLONIST__GET 3
				if ($COLONIST__HowMany = "All")
					setVar $COLONIST__HowMany $TargPlanet_COL_EQU
				end
            end
			if ($COLONIST__DROP = "Fuel Ore")
				setVar $COLONIST__DROP 1
			elseif ($COLONIST__DROP = "Organics")
				setVar $COLONIST__DROP 2
			elseif ($COLONIST__DROP = "Equipment")
				setVar $COLONIST__DROP 3
			end

			setVar $ColTrips ($COLONIST__HowMany / $TOTAL_HOLDS)
			setVar $ColRemainder ($COLONIST__HowMany - ($ColTrips * $TOTAL_HOLDS))

			setVar $Trips ($PRODUCT__HowMany / $TOTAL_HOLDS)
			setVar $Remainder ($PRODUCT__HowMany - ($Trips * $TOTAL_HOLDS))

			setVar $idx_col 0
			setVar $idx_pro 0

			while (($idx_col <= $ColTrips) AND ($idx_pro <= $Trips))
	            setVar $Macro ($Macro & "  T N T " & $PRODUCT__CAT & "* Q L " & $TARGET_PLANET & "* T N L " & $PRODUCT__CAT & "* ")
	            setVar $Macro ($Macro & "  S N T " & $COLONIST__GET & "* Q L " & $PLANET_NUMBER & "* S N L " & $COLONIST__DROP & "* ")
				add $idx_pro 1
				add $idx_col 1
			end

			if (($idx_col >= $ColTrips) AND ($ColRemainder <> 0))
	            setVar $Macro ($Macro & "  T N T " & $PRODUCT__CAT & "* Q L " & $TARGET_PLANET & "* T N L " & $PRODUCT__CAT & "* ")
	            setVar $Macro ($Macro & "  S N T " & $COLONIST__GET & $ColRemainder & "* Q L " & $PLANET_NUMBER & "* S N L " & $COLONIST__DROP & "* ")
				add $idx_pro 1
			elseif (($idx_pro >= $Trips) AND ($Remainder <> 0))
	            setVar $Macro ($Macro & "  T N T " & $PRODUCT__CAT & $Remainder & "* Q L " & $TARGET_PLANET & "* T N L " & $PRODUCT__CAT & "* ")
	            setVar $Macro ($Macro & "  S N T " & $COLONIST__GET & "* Q L " & $PLANET_NUMBER & "* S N L " & $COLONIST__DROP & "* ")
				add $idx_col 1
			end

			while ($idx_col <= $ColTrips)
				setVar $Macro ($Macro & "  Q L " & $TARGET_PLANET & "* ")
	            setVar $Macro ($Macro & "  S N T " & $COLONIST__GET & "* Q L " & $PLANET_NUMBER & "* S N L " & $COLONIST__DROP & "* ")
				add $idx_col 1
			end
			while ($idx_pro <= $Trips)
	            setVar $Macro ($Macro & "  T N T " & $PRODUCT__CAT & "* Q L " & $TARGET_PLANET & "* T N L " & $PRODUCT__CAT & "* ")
	            setVar $Macro ($Macro & "  Q L " & $PLANET_NUMBER & "* ")
				add $idx_pro 1
			end
		elseif (($PRODUCT__ToFrom = "From") AND ($COLONIST__ToFrom = "To"))
			setVar $PreMsg "'*" & $TagLine & " Version " & $Version & "*"
			setVar $PreMsg $PreMsg & "Moving Product From Planet #"&$TARGET_PLANET&" to Planet #"&$PLANET_NUMBER&"*"
			setVar $PreMsg $PreMsg & "Moving Colonists from Planet #"&$PLANET_NUMBER&" to Planet #"&$TARGET_PLANET&"*"
			setVar $PreMsg $PreMsg & "will send a message when completed.**"
			if ($PRODUCT__CAT =	"Fuel Ore")
				setVar $PRODUCT__CAT 1
				if ($PRODUCT__HowMany = "All")
				   	setVar $PRODUCT__HowMany $TargPlanet_ORE
				elseif ($PRODUCT__HowMany > ($TargPlanet_ORE_MAX - $TargPlanet_ORE))
					setVar $PRODUCT__HowMany ($TargPlanet_ORE_MAX - $TargPlanet_ORE)
				end
				if ($PRODUCT__HowMany > ($Planet_ORE_MAX - $Planet_ORE))
					setVar $PRODUCT__HowMany ($Planet_ORE_MAX - $Planet_ORE)
				end
			elseif ($PRODUCT__CAT = "Organics")
				setVar $PRODUCT__CAT 2
				if ($PRODUCT__HowMany = "All")
					setVar $PRODUCT__HowMany $TargPlanet_ORG
				elseif ($PRODUCT__HowMany > ($TargPlanet_ORG_MAX - $TargPlanet_ORG))
					setVar $PRODUCT__HowMany ($TargPlanet_ORG_MAX - $TargPlanet_ORG)
				end
				if ($PRODUCT__HowMany > ($Planet_ORG_MAX - $Planet_ORG))
					setVar $PRODUCT__HowMany ($Planet_ORG_MAX - $Planet_ORG)
				end
			elseif ($PRODUCT__CAT = "Equipment")
				setVar $PRODUCT__CAT 3
				if ($PRODUCT__HowMany = "All")
					setVar $PRODUCT__HowMany $TargPlanet_EQU
				elseif ($PRODUCT__HowMany > ($TargPlanet_EQU_MAX - $TargPlanet_EQU))
					setVar $PRODUCT__HowMany ($TargPlanet_EQU_MAX - $TargPlanet_EQU)
				end
				if ($PRODUCT__HowMany > ($Planet_EQU_MAX - $Planet_EQU))
					setVar $PRODUCT__HowMany ($Planet_EQU_MAX - $Planet_EQU)
				end
			end

            if ($COLONIST__GET = "Fuel Ore")
            	setVar $COLONIST__GET 1
				if ($COLONIST__HowMany = "All")
					setVar $COLONIST__HowMany $TargPlanet_COL_ORE
				end
            elseif ($COLONIST__GET = "Organics")
            	setVar $COLONIST__GET 2
				if ($COLONIST__HowMany = "All")
					setVar $COLONIST__HowMany $TargPlanet_COL_ORG
				end
            elseif ($COLONIST__GET = "Equipment")
            	setVar $COLONIST__GET 3
				if ($COLONIST__HowMany = "All")
					setVar $COLONIST__HowMany $TargPlanet_COL_EQU
				end
            end

			if ($COLONIST__DROP = "Fuel Ore")
				setVar $COLONIST__DROP 1
			elseif ($COLONIST__DROP = "Organics")
				setVar $COLONIST__DROP 2
			elseif ($COLONIST__DROP = "Equipment")
				setVar $COLONIST__DROP 3
			end

			setVar $ColTrips ($COLONIST__HowMany / $TOTAL_HOLDS)
			setVar $ColRemainder ($COLONIST__HowMany - ($ColTrips * $TOTAL_HOLDS))

			setVar $Trips ($PRODUCT__HowMany / $TOTAL_HOLDS)
			setVar $Remainder ($PRODUCT__HowMany - ($Trips * $TOTAL_HOLDS))

			setVar $idx_col 0
			setVar $idx_pro 0

			while (($idx_col <= $ColTrips) AND ($idx_pro <= $Trips))
				setVar $Macro ($Macro & "  S N T " & $COLONIST__GET & "* Q L " & $TARGET_PLANET & "* S N L " & $COLONIST__DROP & "* ")
	            setVar $Macro ($Macro & "  T N T " & $PRODUCT__CAT & "* Q L " & $PLANET_NUMBER & "* T N L " & $PRODUCT__CAT & "* ")
				add $idx_pro 1
				add $idx_col 1
			end

			if (($idx_col >= $ColTrips) AND ($ColRemainder <> 0))
				SETvAR $MAcro ($Macro & "  S N T " & $COLONIST__GET & $ColRemainder & "* Q L " & $TARGET_PLANET & "* S N L " & $COLONIST__DROP & "* ")
	            setVar $Macro ($Macro & "  T N T " & $PRODUCT__CAT & "* Q L " & $PLANET_NUMBER & "* T N L " & $PRODUCT__CAT & "* ")
				add $idx_pro 1
			elseif (($idx_pro >= $Trips) AND ($Remainder <> 0))
				setVar $Macro ($macro & "  S N T " & $COLONIST__GET & "* Q L " & $TARGET_PLANET & "* S N L " & $COLONIST__DROP & "* ")
	            setVar $Macro ($Macro & "  T N T " & $PRODUCT__CAT & $Remainder & "* Q L " & $PLANET_NUMBER & "* T N L " & $PRODUCT__CAT & "* ")
				add $idx_col 1
			end

			while ($idx_col <= $ColTrips)
	            setVar $Macro ($Macro & "  S N T " & $COLONIST__GET & "* Q L " & $TARGET_PLANET & "* S N L " & $COLONIST__DROP & "* ")
				setVar $Macro ($Macro & "  Q L " & $PLANET_NUMBER & "* ")
				add $idx_col 1
			end
			while ($idx_pro <= $Trips)
	            setVar $Macro ($Macro & "  Q L " & $TARGET_PLANET & "* ")
	            setVar $Macro ($Macro & "  T N T " & $PRODUCT__CAT & "* Q L " & $PLANET_NUMBER & "* T N L " & $PRODUCT__CAT & "* ")
				add $idx_pro 1
			end
		end
	elseif ($PRODUCT__HowMany <> "0")
		setVar $PreMsg "'*" & $TagLine & " Version " & $Version & "*"

		if ($PRODUCT__CAT =	"Fuel Ore")
			setVar $PRODUCT__CAT 1
		elseif ($PRODUCT__CAT = "Organics")
			setVar $PRODUCT__CAT 2
		elseif ($PRODUCT__CAT = "Equipment")
			setVar $PRODUCT__CAT 3
		end
		if ($PRODUCT__ToFrom = "To")
			setVar $PreMsg $PreMsg & "Moving Product From Planet #"&$PLANET_NUMBER&" to Planet #"&$TARGET_PLANET&"*"
			setVar $PreMsg $PreMsg & "will send a message when completed.**"
	       	setVar $Planet_Source $Planet_Number
			setVar $Planet_Dest $TARGET_PLANET

			if ($PRODUCT__HowMany = "All")
				if ($PRODUCT__CAT = 1)
					setVar $PRODUCT__HowMany $Planet_ORE
				elseif ($PRODUCT__CAT = 2)
					setVar $PRODUCT__HowMany $Planet_ORG
				elseif ($PRODUCT__CAT = 3)
					setVar $PRODUCT__HowMany $Planet_EQU
				end
			end
			if ($PRODUCT__CAT = 1)
				if ($PRODUCT__HowMany > $Planet_ORE)
					setVar $PRODUCT__HowMany $Planet_ORE
				end
				if ($PRODUCT__HowMany > ($TargPlanet_ORE_MAX - $TargPlanet_ORE))
					setVar $PRODUCT__HowMany ($TargPlanet_ORE_MAX - $TargPlanet_ORE)
				end
			elseif ($PRODUCT__CAT = 2)
				if ($PRODUCT__HowMany > $Planet_ORG)
					setVar $PRODUCT__HowMany $Planet_ORG
				end
				if ($PRODUCT__HowMany > ($TargPlanet_ORG_MAX - $TargPlanet_ORG))
					setVar $PRODUCT__HowMany ($TargPlanet_ORG_MAX - $TargPlanet_ORG)
				end
			elseif ($PRODUCT__CAT = 3)
				if ($PRODUCT__HowMany > $Planet_EQU)
					setVar $PRODUCT__HowMany $Planet_EQU
				end
				if ($PRODUCT__HowMany > ($TargPlanet_EQU_MAX - $TargPlanet_EQU))
					setVar $PRODUCT__HowMany ($TargPlanet_EQU_MAX - $TargPlanet_EQU)
				end
			end
		elseif ($PRODUCT__ToFrom = "From")
			setVar $PreMsg $PreMsg & "Moving Product From Planet #"&$TARGET_PLANET&" to Planet #"&$PLANET_NUMBER&"*"
			setVar $PreMsg $PreMsg & "will send a message when completed.**"

	       	setVar $Planet_Source $TARGET_PLANET
			setVar $Planet_Dest $Planet_Number
			setVar $Macro ($Macro & " Q L " & $TARGET_PLANET & "*  ")

			if ($PRODUCT__HowMany = "All")
				if ($PRODUCT__CAT = 1)
					setVar $PRODUCT__HowMany $TargPlanet_ORE
				elseif ($PRODUCT__CAT = 2)
					setVar $PRODUCT__HowMany $TargPlanet_ORG
				elseif ($PRODUCT__CAT = 3)
					setVar $PRODUCT__HowMany $TargPlanet_EQU
				end
			end
			if ($PRODUCT__CAT = 1)
				if ($PRODUCT__HowMany > $TargPlanet_ORE)
					setVar $PRODUCT__HowMany $TargPlanet_ORE
				end
				if ($PRODUCT__HowMany > ($Planet_ORE_MAX - $Planet_ORE))
					setVar $PRODUCT__HowMany ($Planet_ORE_MAX - $Planet_ORE)
				end
			elseif ($PRODUCT__CAT = 2)
				if ($PRODUCT__HowMany > $TargPlanet_ORG)
					setVar $PRODUCT__HowMany $TargPlanet_ORG
				end
				if ($PRODUCT__HowMany > ($Planet_ORG_MAX - $Planet_ORG))
					setVar $PRODUCT__HowMany ($Planet_ORG_MAX - $Planet_ORG)
				end
			elseif ($PRODUCT__CAT = 3)
				if ($PRODUCT__HowMany > $TargPlanet_EQU)
					setVar $PRODUCT__HowMany $TargPlanet_EQU
				end
				if ($PRODUCT__HowMany > ($Planet_EQU_MAX - $Planet_EQU))
					setVar $PRODUCT__HowMany ($Planet_EQU_MAX - $Planet_EQU)
				end
			end
		end
		setVar $Source_Amount $PRODUCT__HowMany
		setVar $PROCOL_CODE "T"
		setVar $PROCOL_CAT_S $PRODUCT__CAT
		setVar $PROCOL_CAT_D $PRODUCT__CAT
		gosub	:Build_Macro_String

		if ($PRODUCT__ToFrom = "From")
			setVar $Macro ($Macro & " Q  L " & $PLANET_NUMBER & "*  ")
		end
	elseif ($COLONIST__HowMany <> "0")
		setVar $PreMsg "'*" & $TagLine & " Version " & $Version & "*"

		if ($COLONIST__ToFrom = "To")
			setVar $PreMsg $PreMsg & "Moving Colonists From Planet #"&$PLANET_NUMBER&" to Planet #"&$TARGET_PLANET&"*"
			setVar $PreMsg $PreMsg & "will send a message when completed.**"

	       	setVar $Planet_Source $Planet_Number
			setVar $Planet_Dest $TARGET_PLANET
			if ($COLONIST__GET = "Fuel Ore")
				setVar $COLONIST__GET 1
				if ($COLONIST__HowMany = "All")
					setVar $COLONIST__HowMany $Planet_COL_ORE
				end
	            elseif ($COLONIST__GET = "Organics")
	            	setVar $COLONIST__GET 2
				if ($COLONIST__HowMany = "All")
					setVar $COLONIST__HowMany $Planet_COL_ORG
				end
	            elseif ($COLONIST__GET = "Equipment")
	            	setVar $COLONIST__GET 3
				if ($COLONIST__HowMany = "All")
					setVar $COLONIST__HowMany $Planet_COL_EQU
				end
	        end
		elseif ($COLONIST__ToFrom = "From")
			setVar $PreMsg $PreMsg & "Moving Colonists From Planet #"&$TARGET_PLANET&" to Planet #"&$PLANET_NUMBER&"*"
			setVar $PreMsg $PreMsg & "will send a message when completed.**"

	       	setVar $Planet_Source $TARGET_PLANET
			setVar $Planet_Dest $Planet_Number
			setVar $Macro ($Macro & " Q L " & $TARGET_PLANET & "*  ")
			if ($COLONIST__GET = "Fuel Ore")
				setVar $COLONIST__GET 1
				if ($COLONIST__HowMany = "All")
					setVar $COLONIST__HowMany $TargPlanet_COL_ORE
				end
	            elseif ($COLONIST__GET = "Organics")
	            	setVar $COLONIST__GET 2
				if ($COLONIST__HowMany = "All")
					setVar $COLONIST__HowMany $TargPlanet_COL_ORG
				end
	            elseif ($COLONIST__GET = "Equipment")
	            	setVar $COLONIST__GET 3
				if ($COLONIST__HowMany = "All")
					setVar $COLONIST__HowMany $TargPlanet_COL_EQU
				end
	        end

		end
		if ($COLONIST__DROP = "Fuel Ore")
			setVar $COLONIST__DROP 1
		elseif ($COLONIST__DROP = "Organics")
			setVar $COLONIST__DROP 2
		elseif ($COLONIST__DROP = "Equipment")
			setVar $COLONIST__DROP 3
		end

		setVar $Source_Amount $COLONIST__HowMany
		setVar $PROCOL_CODE "S"
		setVar $PROCOL_CAT_S $COLONIST__GET
		setVar $PROCOL_CAT_D $COLONIST__DROP
		gosub	:Build_Macro_String
		if ($COLONIST__ToFrom = "From")
			setVar $Macro ($Macro & " Q  L " & $PLANET_NUMBER & "*  ")
		end

	end

	if ($FIGHTERS__HowMany <> "0")
		setVar $Start_Figs $FIGHTERS

    	if ($FIGHTERS__ToFrom = "From")
        	setVar $Source	$TARGET_PLANET
			setVar $Dest	$Planet_Number
    		setVar $Macro ($Macro & "  Q  L Z" & #8 & $Source & " * ")
    		setVar $Planet_FIGS $TargPlanet_FIGS
    	else
        	setVar $Source	$Planet_Number
			setVar $Dest	$TARGET_PLANET
		end

		if ($FIGHTERS__HowMany = "All")
			setVar $FIGHTERS__HowMany $Planet_FIGS
		elseif ($FIGHTERS__HowMany > $Planet_FIGS)
			setVar $FIGHTERS__HowMany $Planet_FIGS
		end

		setVar $Total_Moved 0

		while ($Total_Moved < $FIGHTERS__HowMany)
			setVar $Macro ($Macro & " M  N  T  *  Q  L Z" & #8 & $Dest & "*  M  N  L  * Q  L Z" & #8 & $Source & "*  ")
			add $Total_Moved $MAX_FIGS
		end

		setVar $Macro ($Macro & " M  N  T  *  Q  L Z" & #8 & $Dest & "*  M  N  L  *  M  N  T  " & $Start_Figs & "*  Q  L Z" & #8 & $Source & "*  ")

	   	if ($FIGHTERS__ToFrom = "From")
			setVar $Macro ($Macro & " Q  L " & $PLANET_NUMBER & "*  ")
    	end
	end

	if ($Macro = "")
		echo ANSI_14 "**Nothing To Do.**"
	else
		send ($PreMsg & $Macro & " * '" & $TagLine & " Complete.*")
	end
	halt


:Get_Planet_Data
	send "D"
	waitfor "Planet #"
	getWord CURRENTLINE $Planet_Number 2
	stripText $Planet_Number "#"
	stripText $Planet_Number " "
	waitfor "Fuel Ore"
	getWord CURRENTLINE $Planet_COL_ORE 3
	stripText $Planet_COL_ORE " "
	stripText $Planet_COL_ORE ","
	getWord CURRENTLINE $Planet_ORE 6
	stripText $Planet_ORE " "
	stripText $Planet_ORE ","
	getWord CURRENTLINE $Planet_ORE_MAX 8
	stripText $Planet_ORE_MAX " "
	stripText $Planet_ORE_MAX ","
	waitfor "Organics"
	getWord CURRENTLINE $Planet_COL_ORG 2
	stripText $Planet_COL_ORG " "
	stripText $Planet_COL_ORG ","
	getWord CURRENTLINE $Planet_ORG 5
	stripText $Planet_ORG " "
	stripText $Planet_ORG ","
	getWord CURRENTLINE $Planet_ORG_MAX 7
	stripText $Planet_ORG_MAX " "
	stripText $Planet_ORG_MAX ","
	waitfor "Equipment"
	getWord CURRENTLINE $Planet_COL_EQU 2
	stripText $Planet_COL_EQU " "
	stripText $Planet_COL_EQU ","
	getWord CURRENTLINE $Planet_EQU 5
	stripText $Planet_EQU " "
	stripText $Planet_EQU ","
	getWord CURRENTLINE $Planet_EQU_MAX 7
	stripText $Planet_EQU_MAX " "
	stripText $Planet_EQU_MAX ","
	waitfor "Fighters"
	getWord CURRENTLINE $Planet_FIGS 5
	stripText $Planet_FIGS " "
	stripText $Planet_FIGS ","
	getWord CURRENTLINE $Planet_FIGS_MAX 7
	stripText $Planet_FIGS_MAX " "
	stripText $Planet_FIGS_MAX ","
	waitfor "Planet command"
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


:Build_Macro_String
	echo ("*"&ANSI_8&"   <"&ANSI_15&"Building "&ANSI_10&"Hi-Speed-"&ANSI_14&"MACRO"&ANSI_10&" Burst"&ANSI_8&">**")
	setVar $Trips ($Source_Amount / $TOTAL_HOLDS)
	setVar $Remainder ($Source_Amount - ($Trips * $TOTAL_HOLDS))

   	setVar $i 0
  	while ($i < $Trips)
		setVar $Macro ($Macro & "  "&$PROCOL_CODE&"  N  T  "&$PROCOL_CAT_S&"*  Q  L Z" & #8 & $Planet_Dest & "*  "&$PROCOL_CODE&"  N  L  "&$PROCOL_CAT_D&"*  Q  L Z" & #8 & $Planet_Source & "*  ")
		add $i 1
	end
	if ($Remainder <> 0)
		setVar $Macro ($Macro & "  "&$PROCOL_CODE&"  N  T  "&$PROCOL_CAT_S&$Remainder&"*  Q  L Z" & #8 & $Planet_Dest & "*  "&$PROCOL_CODE&"  N  L  "&$PROCOL_CAT_D&"*  Q  L Z" & #8 & $Planet_Source & "*  ")
	end

	return

:Do_Sector_Maint
	setVar $TargetValid FALSE
   	send " Q  **  J  Y  C ;Q  L" & $TARGET_PLANET & "*Q  L" & $Planet_Number & "**  J  *  "
	waitfor "Max Fighters:"
	getText CURRENTLINE $MAX_FIGS "Fighters:" "Offensive O"
	stripText $MAX_FIGS " "
	stripText $MAX_FIGS ","
	setTextLineTrigger		TargetFound		:TargetFound	("Planet #" & $TARGET_PLANET & " in sector")
	setTextLineTrigger		ReLanded		:ReLanded		("Planet #" & $Planet_Number & " in sector")
	setTextLineTrigger		NotLanded		:NotLanded		("Are you sure you want to jettison all cargo")
	pause
	:NotLanded
	killAllTriggers
	Echo ANSI_12 & "**Hmmm.. where'd the planet go?**"
	halt
	:TargetFound
		setTextLineTrigger	Fuel	:Fuel 	"Fuel Ore"
		setTextLineTrigger	Orga	:Orga	"Organics"
		setTextLineTrigger	Equi	:Equi	"Equipment"
		setTextLineTrigger	Figs	:Figs	"Fighters"
		pause
		:Fuel
			getWord CURRENTLINE $TargPlanet_COL_ORE 3
			stripText $TargPlanet_COL_ORE " "
			stripText $TargPlanet_COL_ORE ","
			getWord CURRENTLINE $TargPlanet_ORE 6
			stripText $TargPlanet_ORE " "
			stripText $TargPlanet_ORE ","
			getWord CURRENTLINE $TargPlanet_ORE_MAX 8
			stripText $TargPlanet_ORE_MAX " "
			stripText $TargPlanet_ORE_MAX ","
			pause
		:Orga
			getWord CURRENTLINE $TargPlanet_COL_ORG 2
			stripText $TargPlanet_COL_ORG " "
			stripText $TargPlanet_COL_ORG ","
			getWord CURRENTLINE $TargPlanet_ORG 5
			stripText $TargPlanet_ORG " "
			stripText $TargPlanet_ORG ","
			getWord CURRENTLINE $TargPlanet_ORG_MAX 7
			stripText $TargPlanet_ORG_MAX " "
			stripText $TargPlanet_ORG_MAX ","
			pause
		:Equi
			getWord CURRENTLINE $TargPlanet_COL_EQU 2
			stripText $TargPlanet_COL_EQU " "
			stripText $TargPlanet_COL_EQU ","
			getWord CURRENTLINE $TargPlanet_EQU 5
			stripText $TargPlanet_EQU " "
			stripText $TargPlanet_EQU ","
			getWord CURRENTLINE $TargPlanet_EQU_MAX 7
			stripText $TargPlanet_EQU_MAX " "
			stripText $TargPlanet_EQU_MAX ","
			pause
		:Figs
			getWord CURRENTLINE $TargPlanet_FIGS 5
			stripText $TargPlanet_FIGS " "
			stripText $TargPlanet_FIGS ","
			getWord CURRENTLINE $TargPlanet_FIGS_MAX 7
			stripText $TargPlanet_FIGS_MAX " "
			stripText $TargPlanet_FIGS_MAX ","
			setVar $TargetValid TRUE
			pause
	:ReLanded
	killAllTriggers
	if ((SECTOR.PLANETCOUNT[$CURRENT_SECTOR] <= 1) OR ($TargetValid = 0))
		echo ANSI_12 & "**Target Planet not in sector**"
		halt
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