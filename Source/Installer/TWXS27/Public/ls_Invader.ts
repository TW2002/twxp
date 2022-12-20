	# invader 1.00a
	#
	# added:
	#		single attack wave to landing macro, in order to wipe out remaining shields
	#		option to abort cannon damage display upon  entry to adj sector.
	#
	reqRecording

	send " * "
	waitfor "(?="
	getword CURRENTLINE $location 1
	if ($location <> "Command")
		clientMessage "**Must run this script from the Command Prompt.**"
		halt
	end

	cutText CURRENTLINE $currsec 24 5
	stripText $currsec "]"
	stripText $currsec " "
	stripText $currsec "("
	stripText $currsec "?"
	stripText $currsec "="

	send "CN"
	SetTextLineTrigger abortdisplay0 :abortdisplay0 "(9) Abort display on keys    - SPACE"
	SetTextLineTrigger abortdisplay1 :abortdisplay1 "(9) Abort display on keys    - ALL KEYS"
	pause

	:abortdisplay0
		killalltriggers
		setVar $cn9 0
		goto :cn9done
	:abortdisplay1
		killalltriggers
		setVar $cn9 1
	:cn9done

	if ($cn9 = 1)
 		send "9  "
	end

	setTextLineTrigger getwave :getwave "Max Figs Per Attack:"
	send "Q  ;"
	pause

	:getwave
	getWord CURRENTLINE $wave 5

	send "Q  /"
	setTextLineTrigger phot :phot "Phot "
	pause

	:phot
		setVar $cline CURRENTLINE
		getText $cline $poh "Phot " "Armd "
		replaceText $poh #179 ""

		if ($poh = 0)
			waitfor "(?="
			clientMessage "***No Photons on board.***"
		    halt
		end

    # get saved settings
    loadVar $DTrickSaved

    if ($DTrickSaved)
       loadVar $DTrick~PLANET
       loadVar $DTrick~TARGET
       loadVar $DTrick~XPORT2
       loadVar $DTrick~TOW
    else
       setVar $DTrick~PLANET 0
       setVar $DTrick~TARGET 0
       setVar $DTrick~XPORT2 0
       setVar $DTrick~TOW 0

       saveVar $DTrick~PLANET
       saveVar $DTrick~TARGET
       saveVar $DTrick~XPORT2
       saveVar $DTrick~TOW
    end

    setVar $Abort TRUE
    setVar $Launch FALSE
    setVar $DTrickSaved 1
    saveVar $DTrickSaved
:DoAgain
    echo #27 & "[2J"
   echo "**   " & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-"
    echo ANSI_15 & "*        LS's DEFENDER  TRICK   v1.0"
    echo ANSI_15 & "*         Foton ADJ, Export, Enter"
	echo "*   " & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-"
	echo "**"
    addMenu "" "DefTrick" "Defender Trick" "." "" "Main" FALSE
    addMenu "DefTrick" "GO" "GO!" "G" :MenuGo "" FALSE
    addMenu "DefTrick" "ExportToShip" "Export To Ship" "B" :ExportToShip "" FALSE
    addMenu "DefTrick" "TowShip" "Tow In Unmanned Ship" "C" :TowShip "" FALSE
    addMenu "DefTrick" "LandOnPlanet" "Land On Planet" "E" :LandOnPlanet "" FALSE
    addMenu "DefTrick" "TargetSector" "Target Sector" "A" :TargetSector "" FALSE
    addMenu "DefTrick" "LaunchGenTorp" "Launch Gen Torp" "D" :LaunchTorp "" FALSE
    addMenu "DefTrick" "AbortDisp" "Abort Cannon Damage" "F" :AbortDisp "" FALSE

    setMenuHelp "ExportToShip" "Set this the Ship Number you want to export to, after foton has been fired. Leave Zero (0), to disable."
    setMenuHelp "TowShip" "Set this to the number of the ship you want to tow into the sector being Invaded. Leave Zero (0), to disable."
    setMenuHelp "LandOnPlanet" "Set this option to the planet number you want to land on immediately upon entry. Leave zero (0), to disable."
    setMenuHelp "TargetSector" "Must be set to an Adjacent Sector, in order to work.**Future version may allow for charging a sector or two, to add element of surprise."
    setMenuHelp "LaunchGenTorp" "Yes or No Option to attempt to launch a Gen Torp upon entry of Target sector."
    setMenuHelp "AbortDisp" "Set to 'Yes' for fastest possible entry -esp necessary when wave's 1 second. However, set to 'No'*to display cannon blasts, damponning, or lock-ons."

    setMenuHelp "GO" "Will Confirm Settings, and initiate the Macro."

    if ($DTrick~TARGET <> 0)
       setMenuValue "TargetSector" $DTrick~TARGET
    else
       setMenuValue "TargetSector" "Must Set"
    end

    if ($DTrick~XPORT2 <> 0)
       setMenuValue "ExportToShip" $DTrick~XPORT2
    else
        setMenuValue "ExportToShip" "N/A"
    end

    if ($DTrick~TOW <> 0)
       setMenuValue "TowShip" $DTrick~TOW
    else
        setMenuValue "TowShip" "N/A"
    end

    if ($DTrick~PLANET <> 0)
       setMenuValue "LandOnPlanet" $DTrick~PLANET
    else
       setMenuValue "LandOnPlanet" "N/A"
    end

    if ($Launch = FALSE)
       setMenuValue "LaunchGenTorp" "No"
    else
       setMenuValue "LaunchGenTorp" "Yes"
    end

    if ($Abort = FALSE)
	setMenuValue "AbortDisp" "No"
    else
        setMenuValue "AbortDisp" "Yes"
    end

    openMenu "DefTrick"

    :Abortdisp
       if ($Abort = FALSE)
          setVar $Abort TRUE
	  setMenuValue "AbortDisp" "Yes"
       else
          setVar $Abort FALSE
          setMenuValue "AbortDisp" "No"
       end
       openMenu DefTrick
    :LaunchTorp
       if ($Launch = FALSE)
          setVar $Launch TRUE
          setMenuValue "LaunchGenTorp" "Yes"
       else
          setVar $Launch FALSE
          setMenuValue "LaunchGenTorp" "No"
       end
       openMenu DefTrick

    :TargetSector
	   setVar $i 1
       echo "**" ANSI_15 " Select Target Sector *"
       while ($i <= SECTOR.WARPCOUNT[$currsec])
          echo "*      " & ANSI_15 & $i & ANSI_2 & " - Sector " & ANSI_15 &": " & ANSI_7 & SECTOR.WARPS[$currsec][$i]
          add $i 1
       end
       echo "**"
      :tryagain
      GetConsoleInput $secValue singlekey
      isNumber $test $secValue
      if ($test = 0)
         goto :tryagain
      end
      subtract $i 1
      if ($secValue > $i)
         goto :tryagain
      end

      setVar $DTrick~TARGET SECTOR.WARPS[$currsec][$secValue]
      saveVar $DTrick~TARGET
      setMenuValue "TargetSector" $DTrick~TARGET
      echo "***"
      openMenu DefTrick

    :ExportToShip
		getInput $Ships "Enter Ship Number To Export into after Foton is fired (Enter Zero To Cancel)*"
		isNumber $test $Ships
 		if ($test = 0)
			echo ANSI_15 & "**Must be a Numeric Number.*"
			goto :ExportToShip
 		else
	  		setVar $DTrick~XPORT2 $Ships
			saveVar $DTrick~XPORT2

			if ($DTrick~XPORT2 <> 0)
	              setMenuValue "ExportToShip" $DTrick~XPORT2
			else
        	      setMenuValue "ExportToShip" "N/A"
			end
		end
        openMenu DefTrick
	:TowShip
		getInput $TowShip "Enter Ship Number To Tow before entering adj Sector (Enter Zero To Cancel)*"
		isNumber $test $TowShip
 		if ($test = 0)
			echo ANSI_15 & "**Must be a Numeric Number.*"
			goto :TowShip
 		else
			setVar $DTrick~TOW $TowShip
			saveVar $DTrick~TOW

			if ($DTrick~TOW <> 0)
				setMenuValue "TowShip" $DTrick~TOW
			else
				setMenuValue "TowShip" "N/A"
			end
		end
    	openMenu DefTrick

	:LandOnPlanet
		getInput $Land "Enter Planet Number to Land after entering adj sector (Enter Zero To Cancel)*"
		isNumber $test $Land
 		if ($test = 0)
			echo ANSI_15 & "**Must be a Numeric Number.*"
			goto :TowShip
 		else
			setVar $DTrick~PLANET $Land
			saveVar $DTrick~PLANET

			if ($DTrick~PLANET <> 0)
				setMenuValue "LandOnPlanet" $DTrick~PLANET
			else
				setMenuValue "LandOnPlanet" "N/A"
			end
		end
	    openMenu DefTrick

    :MenuGo
	    closeMenu
		setVar $i 1
		while ($i <= SECTOR.WARPCOUNT[$currsec])
			if ($DTrick~TARGET = SECTOR.WARPS[$currsec][$i])
				goto :IsAdj
			end
			add $i 1
		end
		echo ANSI_15 & "**Target Sector " & ANSI_14 & $DTrick~TARGET & ANSI_15 & " is not adjacent.**"
		halt

		:IsAdj
		send "c  v  0*  y  n  " & $DTrick~TARGET & "* q  "
		#Build Macro...
		if ($DTrick~TARGET <> 0)
			setVar $a "C  P  Y  " & $DTrick~TARGET & " *  Q  "
			if ($DTrick~XPORT2 <> 0)
				setVar $a $a & "X  " & $DTrick~XPORT2 & " *  *  "
     		end
			if ($DTrick~TOW <> 0)
				setVar $a $a & "W  N  " & $DTrick~TOW & "  *  N  N  *  "
			end

			if ($Abort = FALSE)
			    setVar $a $a & $DTrick~TARGET & "**"
            else
			    setVar $a $a & $DTrick~TARGET & " *  *  "
            end

			if ($LAUNCH)
				setVar $a $a & "U  Y  * .*  Z  C  *  "
			end

			if ($DTrick~TOW <> 0)
				setVar $a $a & "W * "
			end

			if ($DTrick~PLANET <> 0)
				setVar $a $a & "L " & $DTrick~PLANET & "  *  *  a  " & $wave & "  *  *  *  "
			end

			send $a
		else
			echo ANSI_15 & "**Nothing To Do.**"
		end
		halt
