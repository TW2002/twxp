#Ender Passive Grid, version 1.0
#This is to be used in games where hitting enemy figs is NOT an option. But gridding is to be done all the same.
echo ANSI_15 & "*Please notice, the script is built to run with a density scanner only, if they are no safe densities, the script will stop."
:start
	send "'Ender's Passive grid 2.0 loaded. *"
	echo ANSI_13 & "*What type of figs would you like to lay?*"
	getInput $figlay "(1) for Offensive (2) for Defensive (3) for toll "

	echo ANSI_13 & "*How many figs would you like to lay?*"
	getInput $fignumber "Amount of figthers?"

	echo ANSI_13 & "*Would you like to lay armid mines as you grid?*"
	getInput $armidmines "(Y)es / (N)o"

	echo ANSI_13 & "*Would you like to lay limpet mines as you grid?*"
	getInput $limpetmines "(Y)es / (N)o"

	echo ANSI_13 & "*Would you like to run Haggle Tracker as you grid?*"
	getInput $haggleTracker "(Y)es / (N)o"

	If ($figlay = 1)
	send "'Running Ender's passive gridder, dropping " $fignumber " Offensive fighters in each sector *"
	end

	If ($figlay = 2)
	send "'Running Ender's passive gridder, dropping " $fignumber " defensive figthers in each sector *"
	end

	If ($figlay =3)
	send "'Running Ender's passive gridder, dropping " $fignumber " toll figthers in each sector *"
	end

	setVar $counter 0
goto :sub_Scan

:sub_Scan
	send "s"

	waitFor "Long Range Scan"
	send "d"
  
  	waitFor "Relative Density Scan"

  	setVar $i 1
  	:clearNext
  	setVar $warp[$i] 0
  	setVar $warpCount[$i] 0
  	setVar $density[$i] "-1"
  	setVar $weight[$i] 9999
  	setVar $anom[$i] "No"
  	setVar $explored[$i] 1
  	
	if ($i = 6)
    	goto :warpsCleared
  	else
    	add $i 1
    	goto :clearNext
  	end
  	:warpsCleared

  	setVar $i 1
  	setTextLineTrigger 1 :getWarp "Sector "
  	setTextTrigger 2 :gotWarps "Command [TL="
  	pause
  	:getWarp
  	setVar $line CURRENTLINE
  	stripText $line "("
  	getWord $line $warp 2
  	getWord $line $density 4
  	getWord $line $warpCount 7
  	getWord $line $anom 13
  	getLength $warp $length
  	cutText $warp $explored $length 1
  	if ($explored = ")")
    	setVar $explored 0
  	else
    	setVar $explored 1
  	end
  	stripText $warp ")"
  	stripText $density ","
  	setVar $warp[$i] $warp
  	setVar $density[$i] $density
  	setVar $warpCount[$i] $warpCount
  	setVar $anom[$i] $anom
  	setVar $explored[$i] $explored
  	add $i 1
  	setTextLineTrigger 1 :getWarp "Sector "
  	pause
  	:gotWarps
  	killTrigger 1
  	killTrigger 2

  	setVar $i 1
  	setVar $bestWarp 1
  	setVar $holo 0
  	:weightWarp
  	if ($warp[$i] > 0)
    	setVar $weight[$i] 0
    	if ($density[$i] <> 100) and ($density[$i] <> 0)
      	add $weight[$i] 100
      	add $weight[$i] $density[$i]
      	setVar $holo 1
    	end
    	if ($anom[$i] <> "No")
      	add $weight[$i] 100
    	end
    	if ($explored[$i] = 1)
      	add $weight[$i] 20
    	end
    	if ($warp[$i] = $lastWarp)
      	add $weight[$i] 5
    	end

    	setVar $x 6
    	subtract $x $warpCount[$i]

    	getRnd $rand 1 10
    	add $weight[$i] $rand

    	if ($weight[$bestWarp] > $weight[$i])
      	setVar $bestWarp $i
    	end
    	add $i 1
    	goto :weightWarp
  	end

  	if ($weight[$bestWarp] > 100)
	goto :back
  	end

  	if ($scanType = "Holographic") and ($holo = 1)
    	send "sh"
    	waitFor "Command [TL="
  	end

  	send $warp[$bestWarp] "*"
  	setVar $lastWarp $thisWarp
  	setVar $thisWarp $warp[$bestWarp]
  	waitFor "Sector  : "
  	waitFor "Command [TL="
  	getSector $warp[$bestWarp] $s
  
  	if ($figlay = 1)
    	send "f" $fignumber "*co *"
  	end

  	if ($figlay = 2)
    	send "f" $fignumber "*cd *"
  	end
 
  	if ($figlay = 3)
    	send "f" $fignumber "*ct *"
  	end

	if ($armidmines = "y") or ($armidmines = "Y")
		send "h11*c"
	end

	if ($limpetmines = "y") or ($limpetmines = "Y")
		send "h21*c"
	end

	if ($haggleTracker = "y") or ($haggleTracker = "Y")
		goto :haggleTracker
	end
goto :sub_Scan
	
:back
   	setVar $checkWarp $thisWarp
	if ($checkWarp = $thisWarp)
     	add $counter 1
	end

	if ($counter = 2)
    	send "'Scipt stopping. Either in dead end, or no safe option *"
    	HALT
	end
	send "<"
goto :sub_Scan

:haggleTracker
	setTextTrigger noPort :noPort "Corp Menu"
	send "p"
	send "t"
	WaitFor "<Port>"
	setTextTrigger noFuel :noFuel "How many holds of Fuel Ore do you want to buy"
	setTextTrigger noOrg :noOrg "How many holds of Organics do you want to buy"
	setTextTrigger equp :equp "How many holds of Equipment do you want to sell ["
	setTextTrigger buyequp :buyequp "How many holds of Equipment do you want to buy"
	setTextTrigger nosell :nosell "You don't have anything they want"
	setTextTrigger fuelsell :fuelsell "How many holds of Fuel Ore do you want to sell"
	setTextTrigger orgSell :orgSell "How many holds of Organics do you want to sell"
goto :sub_Scan

:noPort
send "q"
killAllTriggers
goto :sub_Scan

:noFuel
send "0*0*0*"
killAllTriggers
goto :sub_Scan

:noOrg
send "0*0*0*"
killAllTriggers
goto :sub_Scan

:equp
send "10**0*0*"
killAllTriggers
goto :sub_Scan

:buyequp
send "****"
killAllTriggers
goto :sub_Scan

:nosell
killAllTriggers
goto :sub_Scan

:fuelsell
send "**0*0*"
killAllTriggers
goto :haggleTracker

:orgsell
send "**0*0*"
killAllTriggers
goto :haggleTracker