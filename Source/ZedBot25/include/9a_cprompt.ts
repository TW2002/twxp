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
        goto :prompt
        end
	goto :promptend
end
send "'Not at the Citadel prompt - script halting.*"
halt
:promptend
if ($loop = "2")
send "'Not at the Citadel prompt - script halting.*"
halt
end
return