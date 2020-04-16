:turnOffAnsi
	send "c n"
	killalltriggers
	waitOn "(1) ANSI graphics"
	getWord CURRENTLINE $ansiStatus 5
	waitOn "(2) Animation display"
	getWord CURRENTLINE $animationStatus 5
	if ($animationStatus = "On")
		send "2"
	end
	if ($ansiStatus = "On")
		send "1 q q"
	else
		send "q q"
	end
	waitOn "<Computer deactivated>"
	return
