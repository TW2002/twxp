getInput $pnum[1] "Planet Number"
getInput $pnum[2] "Backup Planet (0 if none)"
setVar $figplanet 1
setTextLineTrigger maxfigs :max "Main Drive Cost:"
send "c;"
pause

:max
setVar $line CURRENTLINE
stripText $line "Main Drive Cost:"
stripText $line "Max Fighters:"
getWord $line $maxfigs 2
stripText $maxfigs ","
setVar $lowest $maxfigs
setVar $highest $maxfigs
divide $highest 2
divide $lowest 3

setTextLineTrigger curfigs :figs "Fighters       :"
send "qi"
pause

:figs
getWord CURRENTLINE $figs 3
stripText $figs ","
getRnd $refillnum $lowest $highest

:top
echo ansi_12 "*" $refillnum "*"
if ($figs < $refillnum)
	setVar $subfigs $maxfigs
	subtract $subfigs $figs
:land	
	send "l  " $pnum[$figplanet] "*m***q"
	setTextLineTrigger planfigs :pfigs "How many Fighters do you want to take"
	pause
	:pfigs
	getText CURRENTLINE $pfigs "take (" " Max)"
	stripText $pfigs ","
	if ($pfigs < $subfigs)
		add $figplanet 1
		if ($pnum[$figplanet] = 0)
			echo "out of figs"
			halt
		end
		goto :land
	end
	setVar $figs $maxfigs
	getRnd $refillnum $lowest $highest
end

:wait
killalltriggers
setTextLineTrigger hit :hit "Shipboard Computers"
setTextLineTrigger add :add "I gave you"
pause

:hit
setVar $pos 0
setVar $line CURRENTLINE
setVar $figskilled 0
getWord $line $tst 1
getWord $line $ig 3
if ($tst <> "Shipboard")
	goto :wait
end
if ($ig = "The")
	goto :wait
end
getWordPos $line $pos "shield points and"
if ($pos > 0)
	getText $line $cutted "destroyed" "fighters."
	stripText $cutted "shield points and"
	getWord $cutted $figskilled 2
else
	getText $line $cutted "destroyed " " fighters"
	setVar $figskilled $cutted
	
end
subtract $figs $figskilled
goto :top

:add
setVar $heheh CURRENTLINE
getWord $heheh $tst 1
if ($tst <> "P")
	goto :wait
end
getText $heheh $addnum "you " " fighters."
add $figs $addnum
goto :wait

