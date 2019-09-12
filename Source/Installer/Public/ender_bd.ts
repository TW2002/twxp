#Ender's Quick Backdoor finder v1.0
#Will quickly find the back door of Terra or StarDock
clientMessage "You can find back door to terra anywhere, but for the Star dock, you must be there."

Send "'Ender's Quick Backdoor finder v1.0 loaded! *"
clientMessage "Either scroll back up to see back door, or use the $ D - <sector> command"
:info

	echo ANSI_13 & "*Are we finding back door to Terra or StarDock?*"
	getInput $type "(T)errra / (S)tarDock"

	If ($type = "t") or ($type = "T")
		send "c v 2 *"
		send "v 3 *"
		send "v 4 *"
		send "v 5 *"
		send "v 6 *"
		send "v 7 *"
		send "v 8 *"
		send "v 9 *"
		send "v 10 *"
	
	send "f 22* 1*"
	
		send "v 0* y n 2*"
		send "v 0* y n 3*"
		send "v 0* y n 4*"
		send "v 0* y n 5*"
		send "v 0* y n 6*"
		send "v 0* y n 7*"
		send "v 0* y n 8*"
		send "v 0* y n 9*"
		send "v 0* y n 10*"	
		send "q"
	end

	If ($type = "s") or ($type = "S")
	:getSector
	Send "d"
		setTextLineTrigger getting :getting "Sector  :"
		PAUSE
	:getting
		getword currentline $sector 3
		getSector $sector $sectordata
	If ($sector = STARDOCK)
	else
		send "'Must start at stardock! *"
	HALT
	end
	
		send "c v" $sectordata.warp[1] "*"
		send "v" $sectordata.warp[2] "*"
		send "v" $sectordata.warp[3] "*"
		send "v" $sectordata.warp[4] "*"
		send "v" $sectordata.warp[5] "*"
		send "v" $sectordata.warp[6] "*"
	
	send "f 22*" $sector "*"

		send "v 0* y n" $sectordata.warp[1] "*"
		send "v 0* y n" $sectordata.warp[2] "*"
		send "v 0* y n" $sectordata.warp[3] "*"
		send "v 0* y n" $sectordata.warp[4] "*"
		send "v 0* y n" $sectordata.warp[5] "*"
		send "v 0* y n" $sectordata.warp[6] "*"
	
	send "q"
	end
clientMessage "Either scroll back up to see back door, or use the $ D - <sector> command"
HALT
		