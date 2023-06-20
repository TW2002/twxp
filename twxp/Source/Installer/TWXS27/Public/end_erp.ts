#Ender's Hit/Retreat/Photon V1.0
#Script will hit a preset sector, retreat off fig, and photon.

:start
	send "'Ender's Hit/Retreat/Photon v1.0 Loaded! *"
	echo ANSI_13 & "*What sector would you like to hit/photon?"
	getInput $sector "sector?"

	echo ANSI_13 & "*Would you like to wait before photoning sector?*"
	getInput $delay "(Y)es / (N)o"

	If ($delay = "y") or ($delay = "Y")
		echo ANSI_13 & "*How many seconds would you like to wait?*"
		getInput $seconds "seconds?"
		multiply $seconds 1000
	end

	echo ANSI_13 & "*Is fighter Offensive/Defensive/Toll?*"
	getInput $figtype "(1)Offensive / (2) Defensive / (3) Toll"
	
	send "D"
	setTextLineTrigger csector :csector "Sector  :"
PAUSE

:csector
	If ($figtype = "1")
		send $sector "*<"
		If ($delay = "y") or ($delay = "Y")
			:wait
			setDelayTrigger delay :next $seconds
			pause
		end
		:next
		send "cpy" $sector "*"
	end

	If ($figtype = "2") or ($figtype = "3")
		send $sector "*r"
		If ($delay = "y") or ($delay = "Y")
			:wait2
			setDelayTrigger delay :next2 $seconds
			pause
		end
		:next2
		send "cpy" $sector "*"
	end

	Send "'Retreated and photoned " $sector "*"
	send "q"
HALT
