:landOnPlanetEnterCitadel
	send "l "&$planet&"*tnl1*tnl2*tnl3*snl1*snl2*snl3*c "
	waitOn "Fuel Ore"
	getWord CURRENTLINE $planetFuel 6
	stripText $planetFuel ","
	getWord CURRENTLINE $planet_Fuel 6
	stripText $planet_Fuel ","
	send "/"
	waitOn "Creds"
	getWord CURRENTLINE $PLAYER~credits 4
	stripText $PLAYER~credits "³Figs"
	stripText $PLAYER~credits ","
return
