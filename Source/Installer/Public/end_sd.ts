#Ender sector deploy 1.0
#Script used to leave a fighter, mine, etc. in each sector. Users editable.
systemScript

:start
	Send "'Ender sector deploy 1.0 loaded *"
	echo ANSI_15 & "*Would you like to lay figthers in each sector? *"
	getInput $figlay "(Y)es / (N)O "

	echo ANSI_15 & "*Would you like to lay armid mines in each sector? *"
	getInput $armidlay "(Y)es / (N)o "

	echo ANSI_15 & "*Would you like to lay limpets in each sector? *"
	getInput $limpetlay "(Y)es / (N)o "

	If ($figlay = "y") or ($figlay = "Y")
	send "'Laying figthers when I move*"
	end

	If ($armidlay = "y") or ($armidlay = "Y")
	send "'Laying armid mines when I move*"
	end

	If ($limpetlay = "y") or ($limpetlay = "Y")
	send "'Laying limpet mines when I move*"
	end
goto :Move

:Move
	WaitFor "<Move>"
	WaitFor "Warping to Sector"
	WaitFor "Sector  :"

	If ($figlay = "y") or ($figlay = "Y")
	Send "f1*mcd"
	end

	If ($armidlay = "y") or ($armidlay = "Y")
	send "h11*"
	end

	If ($limpetlay = "y") or ($limpetlay = "Y")
	send "h21*"
	end
goto :Move