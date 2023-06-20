# ----- SUB :getPortInfo -----
:getPortInfo
	if ($startingLocation = "Citadel")
		send "S*CR*Q"
	else
		send "*CR*Q"
	end
	setVar $validPortFound FALSE
	setTextLineTrigger foundport :foundport2 "Items     Status  Trading % of max OnBoard"
	setTextLineTrigger noport :noport2 "I have no information about a port in that sector."
	setTextLineTrigger noport2 :noport2 "You have never visted sector"
	setTextLineTrigger noport3 :noport2 "credits / next hold"
	setTextLineTrigger noport4 :noport2 "A  Cargo holds     :"
	pause

	:noport2
		gosub :portkillingtriggers
		return

	:foundport2
		gosub :portkillingtriggers
		setVar $fuelselling 0
		setVar $orgselling 0
		setVar $equipselling 0
		setVar $validPortFound TRUE
		:getselling
			setTextLineTrigger portfuelinfo :portfuelinfo2 "Fuel Ore   Selling"
			setTextLineTrigger portorginfo :portorginfo2 "Organics   Selling"
			setTextLineTrigger portequipinfo :portequipinfo2 "Equipment  Selling"
			setTextLineTrigger gotallportinfo :gotallportinfo2 "<Computer deactivated>"
			pause

		:portfuelinfo2
			getWord CURRENTLINE $fuelselling 4
			setTextLineTrigger portfuelinfo :portfuelinfo2 "Fuel Ore   Selling"
			pause

		:portorginfo2
			getWord CURRENTLINE $orgselling 3
			setTextLineTrigger portorginfo :portorginfo2 "Organics   Selling"
			pause

		:portequipinfo2
			getWord CURRENTLINE $equipselling 3
			setTextLineTrigger portequipinfo :portequipinfo2 "Equipment  Selling"
			pause

		:gotallportinfo2
			killtrigger portfuelinfo
			killtrigger portorginfo
			killtrigger portequipinfo
			killtrigger gotallportinfo
return


:portkillingtriggers
	killtrigger foundport
	killtrigger noport
	killtrigger noport2
	killtrigger noport3
	killtrigger noport4
return