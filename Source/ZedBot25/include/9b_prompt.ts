#=-=-=-=-=-=-=-=-=land on planet fill with figs enter cit-=-=-=-=
:prompt
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
        goto :prompt
        end
	goto :promptend
end
:cprompt
killalltriggers
if ($location = "Command")
goto :promptend
end
        send "'Wrong Prompt--Shutting Down.*"
        waitfor "Message sent on sub-space ch"
        echo ANSI_12 "**NEED TO BE AT CIT PROMPT!!**"
	send "'Not at the Citadel prompt - script halting.*"
	halt
:promptend
savevar $planet
savevar $cursec
return