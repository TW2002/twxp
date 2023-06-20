	gosub :BOT~loadVars

	setVar $BOT~help[1] $BOT~tab&"PXELK - Photon, Export, Enter, Land, Kill"
	setVar $BOT~help[2] $BOT~tab&"       Used to launch a Photon into an adjacent Sector, Export"
	setVar $BOT~help[3] $BOT~tab&"       into another ship, Enter Photon'd Sector and land on a "
	setVar $BOT~help[4] $BOT~tab&"       Planet then sends one wave of Fighters."
	setVar $BOT~help[5] $BOT~tab&"   "
	setVar $BOT~help[6] $BOT~tab&"       pxelk [Sector] [ShipNumber] [PlanetNumber]"
	gosub :bot~helpfile

    gosub :INVADER~check_invade_macro_params
    setVar $INVADER~speed_invade_macro  $INVADER~xport&$INVADER~enter&"       * "
    setVar $INVADER~normal_invade_macro     $INVADER~xport&$INVADER~enter&"** "
    goto :INVADER~start_invade_macro

halt

# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\invader"
