#=-=-=-=-=-=-=-=-=land on planet fill with figs enter cit-=-=-=-=
:rompt
send #145
waitfor "lp)"
        cutText CURRENTLINE $location 1 7
        stripText $location " "
if ($location = "Citadel")
	send "q*"
	waitFor "Planet #"
	getWord CURRENTLINE $planet 2
	stripText $planet "#"
	getWord CURRENTLINE $cursec 5
	stripText $cursec ":"
	send "mnt*tnt1*cs* "
	waiton "Citadel treasury contains"
	if ($planet = "0")
        setvar $loop 1
        goto :rompt
        end
	goto :romptend
end
if ($location = "Planet")
	send "*"
	waitFor "Planet #"
	getWord CURRENTLINE $planet 2
	stripText $planet "#"
	getWord CURRENTLINE $cursec 5
	stripText $cursec ":"
	send "mnt*tnt1*cs* "
	waiton "Citadel treasury contains"
	if ($planet = "0")
        setvar $loop 1
        goto :rompt
        end
	goto :romptend
end
#=-=-=-=-=-=-(var) aplanet is planet=-=-=-=-=-=-=-
:cprompt
killalltriggers
if ($location = "Command")
echo ansi_14 "*Enter Planet Number-$ to terminate"
getconsoleInput $aplanet
:inputp
if ($aplanet = "") or ($aplanet = 0)
goto :cprompt
end
        settextlinetrigger opps1 :cprompt "That planet is not in this sector."
        settextlinetrigger opps2 :cprompt "Invalid registry number, landing aborted."
        send "l j " & #8 & #8 & #8 & $aplanet & "*"
        waiton "Landing sequence engaged..."
        killalltriggers
	waitFor "Planet #"
	getWord CURRENTLINE $planet 2
	stripText $planet "#"
	getWord CURRENTLINE $cursec 5
	stripText $cursec ":"
	send "mnt*tnt1*cs* "
	waiton "Citadel treasury contains"
	if ($planet = "0")
        setvar $loop 1
        goto :prompt
        end
	goto :promptend

end
        send "'Wrong Prompt--Shutting Down.*"
        waitfor "Message sent on sub-space ch"
        echo ANSI_12 "**NEED TO BE AT CIT PROMPT!!**"
	send "'Not at the Citadel prompt - script halting.*"
	halt
:promptend
if ($loop = "2")
clientmessage "Bad Planet Number ....Halting Script"
halt
end
savevar $planet
savevar $cursec
return