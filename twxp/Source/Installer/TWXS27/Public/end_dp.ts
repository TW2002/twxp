#Ender's Dock Photon v1.0
#Photon script that you can use while on dock.

send "'Ender's Dock Photon v1.0 loaded! *"
:getSector
Send "q d"
setTextLineTrigger getting :getting "Sector  :"
PAUSE
:getting
getword currentline $sector 3
send "p s"

:all
	send "'Photons hot at my ta! *"

	getSector $sector $sectordata
	setTextLineTrigger fighit :fighit "Deployed Fighters"
	PAUSE
:fighit
	getword currentline $fighit 5
	striptext  $fighit ":"

	If ($fighit = $sectordata.warp[1])
		send "q c p y" $fighit "*qps"
		Send "'Photons away! back on dock! *"
		Send "'Photon launched into " $fighit "*"
	end

	If ($fighit = $sectordata.warp[2])
		send "q c p y" $fighit "*qps"
		Send "'Photons away! back on dock! *"
		Send "'Photon launched into " $fighit "*"
	end

	If ($fighit = $sectordata.warp[3])
		send "q c p y" $fighit "*qps"
		Send "'Photons away! back on dock! *"
		Send "'Photon launched into " $fighit "*"
	end

	If ($fighit = $sectordata.warp[4])
		send "q c p y" $fighit "*qps"
		Send "'Photons away! back on dock! *"
		Send "'Photon launched into " $fighit "*"
	end

	If ($fighit = $sectordata.warp[5])
		send "q c p y" $fighit "*qps"
		Send "'Photons away! back on dock! *"
		Send "'Photon launched into " $fighit "*"
	end

	If ($fighit = $sectordata.warp[6])
		send "q c p y" $fighit "*qps"
		Send "'Photons away! back on dock! *"
		Send "'Photon launched into " $fighit "*"
	end
HALT