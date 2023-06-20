#Ender No EXP Upgrade v1.0
#Upgrades a port to a specified point without gaining exp or align.

Send "'Ender's NO Exp Upgrade v1.0 loaded *"
:info

	echo ANSI_13 & "*What unit would you like to upgrade?*"
	getInput $type "(1)Ore (2)Organics (3)Equpment"

	echo ANSI_13 & "*How many total units would you like to upgrade?*"
	getInput $totalUnits "Total Units to upgrade?"

	setVar $upped 0
goto :Upgrade

:Upgrade
	If ($type = 1)
		send "O15*q"
		add $upped 5
		If ($upped = $totalunits)
			send "'Port upgraded " $total units " units, script complete *"
		HALT
		end
	end

	If ($type = 2)
		send "O25*q"
		add $upped 5
		If ($upped = $totalunits)
			send "'Port upgraded " $total units " units, script complete *"
		HALT
		end
	end

	If ($type = 3)
		send "O35*q"
		add $upped 5
		If ($upped = $totalunits)
			send "'Port upgraded " $total units " units, script complete *"
		HALT
		end
	end
goto :Upgrade