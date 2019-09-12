#               ShipScrubber v1
#               by mobby
#
#  This is my first publicly scructured script released
#  I decided to release the source so that others might be able to learn from it
#  or could help me possibly improve it. I would appreciate that if this script
#  was edited or parts are taken that credit is given.
#
#      I would like to thank the following for letting me bug them and/or
#      leading me down the correct path.
#      Crosby, Lonestar, Dynarri, Rider (the infamous one),Promethius, Trader Vic, Zip, Raptor,
#      and anyone else that might have gave me feedback or helped me test this beast.

getword CURRENTLINE $prompt 1
if ($prompt <> "Command")
echo "***Must Start From Command Prompt!!!***"
halt
end

#If you don't make it past this point, please don't ever run this script again! : )
if (CURRENTSECTOR <> STARDOCK) AND ((CURRENTSECTOR <> 1) OR (PORT.CLASS[CURRENTSECTOR] <> 0))
                  echo "***..Maybe you should retire..***"
                  echo "***..You MUST be at a class0 or stardock to scrub..***"
                  HALT
                  end

gosub :quikstats

setVar $count 0
setarray $ships SECTOR.SHIPCOUNT[currentsector]

#Added an an extra w incase u still have ship in tow (OOoopps!)
killalltriggers
send "wwn*"
waiton "----------------------------------------------"

settextlinetrigger noships  :noships "You do not own any other ships in this sector!"
settextlinetrigger ship   :ship " " & currentsector & " "
settextlinetrigger done  :done "Choose which ship to tow (Q=Quit)"
pause

#common, why run this script if you have no ships??
:noships
killalltriggers
echo "**No Ships...**"
if (CURRENTSECTOR = STARDOCK)
		send "p s g y g q q q * *"
		end
if ((CURRENTSECTOR = 1) OR (PORT.CLASS[CURRENTSECTOR] = 0))
                send "p t y q *"
	        end
halt

#Adding ships to array
:ship
killtrigger noships
getword currentline $line 1
isnumber $test $line
if ($test)
 add $count 1
 setvar $ships[$count] $line
end
setTextlinetrigger ship   :ship " " & currentsector & " "
pause

#Finished processing
:done
killtrigger noships
killtrigger ship
goto :portcheck

#Where are you?
:portcheck
if (CURRENTSECTOR = STARDOCK)
		goto :workitsd
                end
if ((CURRENTSECTOR = 1) OR (PORT.CLASS[CURRENTSECTOR] = 0))
                goto :workitclass
	        end

:workitsd
while ($count > 0)
             send "x *" & $ships[$count] & "* * p s g y g q q q *"
             subtract $count 1
             end
             send "x *" & $SHIP_NUMBER & "* * p s g y g q q q * *"
             halt


:workitclass
while ($count > 0)
	     send "x" & $ships[$count] & "* * p t y q *"
             subtract $count 1
             end
             send "x" & $SHIP_NUMBER & "* * p t y q *"
             halt



# ---------------------------------------------------------
# Subroutines
# ---------------------------------------------------------

:quikstats
	setVar $CURRENT_PROMPT 		"Undefined"
	killtrigger noprompt
	killtrigger prompt
	killtrigger statlinetrig
	killtrigger getLine2
	setTextLineTrigger 	prompt		:allPrompts	 	#145 & #8
	setTextLineTrigger 	statlinetrig 	:statStart 		#179
	send #145&"/"
	pause
	:allPrompts
		getWord CURRENTLINE $CURRENT_PROMPT 1
		stripText $CURRENT_PROMPT #145
		stripText $CURRENT_PROMPT #8
		setTextLineTrigger 	prompt		:allPrompts	 	#145 & #8
		pause
	:statStart
		killtrigger prompt
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
	killtrigger statlinetrig
	killtrigger getLine2
return