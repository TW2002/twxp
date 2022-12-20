#expects $switchboard~message#
:echo
	getDeafClients $botIsDeaf
	if ($botIsDeaf)
		setvar $bot~silent_running true
		gosub :switchboard~switchboard
	else
		echo $switchboard~message
	end
return

