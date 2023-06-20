:disconnecttriggers
	setTextTrigger      pause   :pausing        "Planet command (?="
	setTextTrigger      pause2  :pausing        "Computer command ["
	setTextTrigger      pause3  :pausing        "Corporate command ["
return

:pausing
	killAllTriggers
	echo ANSI_14 "*[["&ANSI_15&$script_title&" paused. To restart, re-enter citadel prompt"&ANSI_14&"]]*"&ANSI_7
	setTextTrigger restart :restarting "Citadel command ("
	pause
	:restarting
	killAllTriggers
	echo ANSI_14 "*[[" ANSI_15 "Alien Hunter restarted" ANSI_14 "]]*" ANSI_7
	goto :restart
