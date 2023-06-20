#	Turn Denial
#	LS_brb Version 1.0   (aka LoneStar's Black Rose Boogie)
#
#	Finished December 11 2006
#
	setVar $TagVersion	"Version 1.0"
	setVar $TagLine 		"B.R.B Version 1.0"
	setVar $TagLineB 		(ANSI_9 & "["&ANSI_14&"BRBv1.0"&ANSI_9&"]" & ANSI_15)
	setVar $TagLineC		"[BRBv1.0]"
	setVar $Planet 		0
	setVar $start			0
	setVar $target 		0
	setVar $local			0
	setVar $hour  			0
	setVar $holo			TRUE
	setVar $ret				TRUE
	setVar $BADINTEL		FALSE
	# Used by Holo routine (better to spend cpu time allocation memory, instead of later)
	setArray $Output		2000
 	gosub :quikstats

	setVar $location $CURRENT_PROMPT

	if ($location = "Citadel")
	    setVar $start CURRENTSECTOR
    	send " Q DC "
    	setTextLineTrigger pnum  :pnum "Planet #"
    	setTextLineTrigger fuel  :fuel "Fuel Ore"
    	setTextLineTrigger level :level "Planet has a level"
    	pause
        :pnum
        killTrigger pnum
    	getWord CURRENTLINE $planet 2
    	stripText $planet "#"
    	pause
		:fuel
		killTrigger fuel
		getWord CURRENTLINE $pFuel 6
		stripText $pFuel ","
		if ($pFuel < 2000)
			echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Planet Must Have at Least 2000 Units of Fuel Ore*"
			halt
		end
		pause
		:level
		killTrigger level
		getWord CURRENTLINE $pLevel 5
		isNumber $tst $pLevel
		if ($tst = 0)
			echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Unable to determine Planet Level*"
			halt
		end
		if (($pLevel <> 4) AND ($pLevel <> 5) AND ($pLevel <> 6))
			echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Script Must Be Run from a Level 4 or Higher Planet*"
			halt
		end
		waitfor "Citadel command (?="
	elseif ($location = "Command")
		send " *"
		waitfor "Warps to Sector(s)"
		waitfor "Command [TL="
	else
		echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Must Start From Citadel or Command Prompt*"
		halt
	end

	if ($PHOTONS = 0)
		echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " No Photons Detected. Script Terminated.*"
		halt
	end

	send " C N"
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
 		send "9  Q Q "
 	else
		send " Q Q "
	end

	if ($location = "Citadel")
		waitfor "Citadel command (?="
	else
		waitfor "Command [TL="
	end

:ScriptHeader
	echo #27 & "[2J"
	echo "***"
	echo " " & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-"
	echo ANSI_15 & "*           LoneStar's *" & ANSI_10 & "        Black Rose Boogie*" & ANSI_15 & "          " & $TagVersion & "*"
	echo " " & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-"
	if ($location = "Citadel")
		#=--------------------------------CITADEL COMMAND MENU-------------------------------------------------
		echo "*" & ANSI_14 & " 1 " & ANSI_15 & " - Photon This Sector   " & ANSI_7 & $target
		echo "*" & ANSI_14 & " 2 " & ANSI_15 & " - From This Sector     " & ANSI_7 & $local
		if ($SCAN_TYPE = "Holo")
			echo "*" & ANSI_14 & " 3 " & ANSI_15 & " - Holo Scan            "
			if ($holo)
				echo ANSI_7 & "Yes"
			else
				echo ANSI_7 & "No"
			end
		else
			echo "*" & ANSI_6 & " 3 " & ANSI_7 & " - Holo Scan			(Scanner Not Detected)"
		end
		echo "*" & ANSI_14 & " 4 " & ANSI_15 & " - Then Return          "
		if ($ret)
			echo ANSI_7 & "Yes"
		else
			echo ANSI_7 & "No"
		end
	elseif ($location = "Command")
		#=----------------------------------------CMD PROMPT MENU---------------------------------------------
		echo "*" & ANSI_14 & " 1 " & ANSI_15 & " - Photon Adj Sector    " & ANSI_7 & $target
		if ($SCAN_TYPE = "Holo")
			echo "*" & ANSI_14 & " 2 " & ANSI_15 & " - Holo Scan            "
			if ($holo)
				echo ANSI_7 & "Yes"
			else
				echo ANSI_7 & "No"
			end
		else
			echo "*" & ANSI_6 & " 2 " & ANSI_7 &  " - Holo Scan            " & ANSI_8 & "(Scanner Not Detected)"
		end
		if ($TWARP_TYPE = "No")
			echo "*" & ANSI_6 & " 3 " & ANSI_7 & " - Return To Sector     " & ANSI_8 & "(Twarp Drive Required)"
	 	elseif ($ORE_HOLDS < $TOTAL_HOLDS)
			echo "*" & ANSI_6 & " 3 " & ANSI_7 & " - Return To Sector     " & ANSI_8 & "(Must Have Full ORE in Holds)"
		else
			echo "*" & ANSI_14 & " 3 " & ANSI_15 & " - Return To Sector     "
			if ($start <> 0)
				echo ANSI_7 & $start
			end
		end
	else
		echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Must Start From Citadel or Command Prompt*"
		halt
	end
	echo "**    " & ANSI_14 & "X" & ANSI_15 & " - Execute    " &ANSI_14 & "Q" & ANSI_15 & " - Quit*"
	echo "**"
	:ThatAintIt
	getConsoleInput $Selection SINGLEKEY
	if ($Selection = 1)
		if ($location = "Citadel")
			:AnotherTarget
	    	getInput $nTarget ANSI_14 & "Sector to Photon at the Turn of the Hour"
	    	isNumber $tst $nTarget
	    	if ($tst = 0)
				goto :AnotherTarget
			else
				if (($nTarget > SECTORS) OR ($nTarget < 11))
					echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Please Enter a number between 11 and " & SECTORS & "*"
					goto :AnotherTarget
				else
					setVar $target $nTarget

					setVar $i 1
					while (SECTOR.WARPS[$target][$i] > 0)
						setVar $adj SECTOR.WARPS[$target][$i]
						setVar $fig SECTOR.FIGS.OWNER[$adj]
						if (($fig = "belong to your Corp") OR ($fig = "yours"))
							setVar $local $adj
							goto :adj_found
						end
					    add $i 1
					end
					:adj_found
				end
			end
		else
			#running from cmd prompt...
			setVar $i 1
			setVar $s ANSI_14 & "Photon : "
			setVar $c SECTOR.WARPCOUNT[CURRENTSECTOR]
			while ($i <= SECTOR.WARPCOUNT[CURRENTSECTOR])
				setVar $s $s & ANSI_15 & SECTOR.WARPS[CURRENTSECTOR][$i]
				if ($c > 1)
					setVar $s $s & ANSI_6 & " - "
					subtract $c 1
				end
				add $i 1
			end
			:AnotherTorpSect2
	    	getInput $ntarget $s
	    	isNumber $tst $ntarget
	    	if ($tst = 0)
				goto :AnotherTorpSect2
			else
				if (($ntarget > SECTORS) OR ($ntarget < 11))
					echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Sector Must Be Between 11 and " & SECTORS & "*"
					goto :AnotherTorpSect2
				else
					setVar $i 1
					setVar $Match FALSE
					while ($i <= SECTOR.WARPCOUNT[CURRENTSECTOR])
						if ($ntarget = SECTOR.WARPS[CURRENTSECTOR][$i])
							setVar $Match TRUE
							setVar $target $ntarget
						end
						add $i 1
					end
					if ($Match = 0)
						echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Sector To Photon Must Be Adjacent*"
						goto :AnotherTorpSect2
					end
				end
			end
		end
	elseif ($Selection = 2)
		if ($location = "Citadel")
			if ($target <> 0)
				if (SECTOR.WARPCOUNT[$target] <> 0)
					setVar $c SECTOR.WARPCOUNT[$target]
					setVar $s ANSI_14 & "Photon From : "
	            	setVar $i 1
	            	while ($i <= SECTOR.WARPCOUNT[$target])
						setVar $s $s & ANSI_15 & SECTOR.WARPS[$target][$i]
						if ($c > 1)
							setVar $s $s & ANSI_6 & " - "
							subtract $c 1
						end
						add $i 1
					end
				else
					setVar $s "Photon From"
				end
			else
					setVar $s "Photon From"
			end
			:AnotherTorpSect
	    	getInput $nlocal $s
	    	isNumber $tst $nlocal
	    	if ($tst = 0)
				goto :AnotherTorpSect
			else
				if (($nlocal > SECTORS) OR ($nlocal < 11))
					echo "**" & ANSI_14 & $TagLineB & ANSI_15 " Please Enter a number between 11 and " & SECTORS & "*"
					goto :AnotherTorpSect
				else
					setVar $local $nlocal
				end
			end
		else
			if ($SCAN_TYPE = "Holo")
				if ($holo)
					setVar $holo FALSE
				else
					setVar $holo TRUE
				end
			else
				setVar $holo FALSE
				Echo #27 "[1A" #27 "[K" & "*" #27 "[50D                                                  " #27 "[50D"
				goto :ThatAintIt
			end
		end
	elseif ($Selection = 3)
		if ($location = "Citadel")
			if ($SCAN_TYPE = "Holo")
				if ($holo)
					setVar $holo FALSE
				else
					setVar $holo TRUE
				end
			end
		else
			if ($ORE_HOLDS = $TOTAL_HOLDS)
				:AnotherRetSect
		    	getInput $nstart ANSI_14 & "Sector Number To Twarp To (0 to Cancel)"
		    	isNumber $tst $nstart
		    	if ($tst = 0)
					goto :AnotherRetSect
				else
					if ($nstart <= 0)
						setVar $start 0
					elseif ($nstart > SECTORS)
						echo "**" & ANSI_14 & $TagLineB & ANSI_15 " Please Enter a number between 1 and " & SECTORS & " (0 to Cancel)*"
						goto :AnotherTorpSect
					else
						setVar $start $nstart
					end
				end
			else
				setVar $start 0
				Echo #27 "[1A" #27 "[K" & "*" #27 "[50D                                                  " #27 "[50D"
				goto :ThatAintIt
			end
		end
	elseif ($Selection = 4)
		if ($location = "Citadel")
			if ($ret)
				setVar $ret FALSE
			else
				setVar $ret TRUE
			end
		end
	elseif (($Selection = "x") OR ($Selection = "X"))
		if ($target <= 0)
			echo "**" & ANSI_14 & $TagLineB & ANSI_15 " Noting To Do. No Target Sector Selected!*"
			halt
		elseif ($target = $local)
			echo "**" & ANSI_14 & $TagLineB & ANSI_15 " Target Sector cannot be the same as Torp Sector*"
			halt
		end
		goto :LetsGetItOn
	elseif (($Selection = "q") OR ($Selection = "Q"))
		echo "**" & $TagLineB & ANSI_12 " Script Halted" & ANSI_15 & "*"
		send " * "
		halt
	else
		goto :ThatAintIt
	end
	goto :ScriptHeader

	:LetsGetItOn
	send "CT"
	waiton ", 2021"
	getWord CURRENTLINE $TMP 1
	stripText $TMP ":"
	getWord $TMP $TMP 1
	CutText $TMP $HOUR 1 1
	if ($HOUR = "0")
		CutText $TMP $HOUR 2 1
	end
	add $HOUR 1
	if ($HOUR < 10)
		setVar $HOUR ("0" & $HOUR)
	end

	send "'" & $TagLineC & " ACTIVE! Firing Photon Into: " & $target & ", On The Hour*"
	waitfor "Message sent on sub-space channel"
	setVar $TIMEHIT ($hour & ":00:00")

:again
	KillAllTriggers
	send " T"
	setTextLineTrigger 3	:TIMECHECK ", 2021"
	pause
	:TimeCheck
	getWord CURRENTLINE $TMP 1
	if ($TMP = $TIMEHIT)
		goto :Fire1
	end
	waiton "Computer command"
	goto :AGAIN

	:Fire1
	killAllTriggers
	#Incredible that this 'pause' is needed. Turns out Turns are not issued
	#exactly on the hour. Might actually occur at the first second
	setDelayTrigger	SLIGHTPAUSE	:SLIGHTPAUSE 100
	pause
	:SLIGHTPAUSE
	if ($location = "Citadel")
		if ($Local <> $CURRENT_SECTOR)
			send " Q P" & $local & "*y  c  p  y  " & $target & "**q"
		else
			send "P Y " & $TARGET & "* Q "
		end
		setTextLineTrigger wrong :wrong "That is not an adjacent sector"
		setTextLineTrigger gotem :gotem "Photon Missile launched into sector"
		pause
	else
		send "P Y " & $target & "* Q "
		send "'" & TagLineC & " Photon Fired --> " & $target & "!*"
		waitfor "Message sent on sub-space channel"
		if (($holo) AND ($SCAN_TYPE = "Holo"))
			gosub :doScan
		end
		if ($start > 0)
			gosub :TakeMeHome
		end
		goto :Continue
	end

	:wrong
	killAllTriggers
	setVar $BADINTEL TRUE
	send "'" & $TagLineC & " - Bad Sector Data, Photon Not Fired!*"
	goto :bring_me_home

	:gotem
	killAllTriggers
	send "'" & $TagLineC & " - Photon Fired --> " & $target & "!* * "
	waitfor "Message sent on sub-space channel"
	if (($holo) AND ($SCAN_TYPE = "Holo"))
		gosub :doScan
	end

	:bring_me_home
	if ($ret)
		send " P" & $start & "*y"
		setTextLineTrigger pwarp_lock 		:pwarp_lock 	"Locating beam pinpointed"
		setTextLineTrigger no_pwarp_lock 	:no_pwarp_lock 	"Your own fighters must be"
		setTextLineTrigger already 	      :already        "You are already in that sector!"
		setTextLineTrigger no_ore           :no_pwarp_lock 	"You do not have enough Fuel Ore"
		pause
	:no_pwarp_lock
		killAllTriggers
		send "'" & $TagLineC & " Unable To Pwarp To " & $start & "*"
		halt

	:pwarp_lock
		killAllTriggers
		waitFor "Planet is now in sector"
		send "'" $TagLineC & " Planet Returned To " & $start & "*"
		goto :Continue
	:already
		killAllTriggers
		send "'" & $TagLineC & " Planet Hasn't Moved From " & $start & "*"
		goto :Continue
	end

:Continue
	if (($ptr > 0) AND ($BADINTEL = 0))
		echo "***" & ANSI_15 & "HOLOSCAN START " & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-"
		echo ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-"
		echo "*"
		setVar $i 1
		while ($i < $ptr)
			echo $Output[$i]
			add $i 1
		end
		echo "*" & ANSI_15 & "HOLOSCAN END " & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-"
		echo ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-"
		echo "**"
	end
	halt

#=Sub Rountines ------------------------------------------------------------------------------------------------------
:doScan
	setVar $ptr 1
	if ($location = "Citadel")
		send " Q Q S HL Z" & #8 & $planet & "* JC*"
		setTextLineTrigger Landed :Landed "Enter Citadel"
		setTextTrigger NotLanded :NotLanded "Are you sure you want to jettison all cargo"
	else
		send " S H*"
	end
	waitfor "Select (H)olo Scan or (D)ensity Scan or (Q)uit?"
	setTextLineTrigger end_of_lines :end_of_lines "Command [TL="
	:reset_trigger
	setTextLineTrigger line :line
	pause

	:line
	setVar $Output[$ptr] CURRENTANSILINE
	if ($ptr <= 2000)
		add $ptr 1
	end
	goto :reset_trigger

	:end_of_lines
	killTrigger end_of_lines
	setVar $Output[$ptr] "ENDENDENDENDENDENDEND"
	if ($location = "Citadel")
		pause
	else
    	killAllTriggers
		return
	end

	:NotLanded
	killAllTriggers
    echo "***" & ANSI_14 & $TagLineB & ANSI_15 & " Landing Error, Script Halted!*"
    waitfor "(?="
    halt

	:Landed
	killAllTriggers
	return

:quikstats
	setVar $CURRENT_PROMPT 		"Undefined"
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

	:statStart
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
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
				getWord $stats $TURNS  			($current_word + 1)
			elseif ($wordy = "Creds")
				getWord $stats $CREDITS  		($current_word + 1)
			elseif ($wordy = "Figs")
				getWord $stats $FIGHTERS   		($current_word + 1)
			elseif ($wordy = "Shlds")
				getWord $stats $SHIELDS  		($current_word + 1)
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
				getWord $stats $PHOTONS   		($current_word + 1)
			elseif ($wordy = "Armd")
				getWord $stats $ARMIDS   		($current_word + 1)
			elseif ($wordy = "Lmpt")
				getWord $stats $LIMPETS   		($current_word + 1)
			elseif ($wordy = "GTorp")
				getWord $stats $GENESIS  		($current_word + 1)
			elseif ($wordy = "TWarp")
				getWord $stats $TWARP_TYPE  		($current_word + 1)
			elseif ($wordy = "Clks")
				getWord $stats $CLOAKS   		($current_word + 1)
			elseif ($wordy = "Beacns")
				getWord $stats $BEACONS 		($current_word + 1)
			elseif ($wordy = "AtmDt")
				getWord $stats $ATOMIC  		($current_word + 1)
			elseif ($wordy = "Corbo")
				getWord $stats $CORBO   		($current_word + 1)
			elseif ($wordy = "EPrb")
				getWord $stats $EPROBES   		($current_word + 1)
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
				getWord $stats $CORP   			($current_word + 1)
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
# ============================== END QUICKSTATS SUB==============================

#=------------------------------ Twarp -------------------------------------------
:TakeMeHome
		setVar $msg ""
		killAllTriggers
		send " * q q q z n * c u y q mz" & $start & "*"
		setTextTrigger there		:xadj_warp "You are already in that sector!"
		setTextLineTrigger adj_warp :xadj_warp "Sector  : " & $start & " "
		setTextTrigger locking		:xlocking "Do you want to engage the TransWarp drive?"
		setTextTrigger igd			:xtwarpIgd "An Interdictor Generator in this sector holds you fast!"
		setTextTrigger noturns		:xtwarpPhotoned "Your ship was hit by a Photon and has been disabled"
		setTextTrigger noroute		:xtwarpNoRoute "Do you really want to warp there? (Y/N)"
		pause
		:xadj_warp
			killAllTriggers
			send "z*"
			goto :xtwarp_adj
		:xlocking
			killAllTriggers
			send "y"
			setTextLineTrigger twarp_lock		:xtwarp_lock "TransWarp Locked"
			setTextLineTrigger no_twrp_lock		:xno_twarp_lock "No locating beam found"
			setTextLineTrigger twarp_adj		:xtwarp_adj "<Set NavPoint>"
			setTextLineTrigger no_fuel			:xtwarpNoFuel "You do not have enough Fuel Ore"
			pause
		:xtwarpNoFuel
			killAllTriggers
			setVar $msg "Not enough fuel for T-warp."
			goto :xtwarpDone

		:xtwarp_adj
			killAllTriggers
			goto :xtwarpDone

		:xtwarpNoRoute
			killAllTriggers
			send "n* z* "
			setVar $msg "No route available!"
			goto :xtwarpDone

		:xno_twarp_lock
			killAllTriggers
			send "n* z* "
			setVar $msg "No fighters, cannot Twarp"
			goto :xtwarpDone

		:xtwarpIgd
			killAllTriggers
			setVar $msg "My ship is being held by Interdictor!"
			goto :xtwarpDone

		:xtwarpPhotoned
			killAllTriggers
			setVar $msg "I have been photoned and can not T-warp!"
			goto :xtwarpDone

		:xtwarp_lock
			KillAlltriggers
			send "y * * '" & $TagLineC &  " - Twarp Completed!*"
		:xtwarpDone
            if ($msg <> "")
                send "'" & $TagLineC & " - " & $msg & "*"
            end
	return
