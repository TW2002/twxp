	gosub :BOT~loadVars

	setVar $BOT~help[1] $BOT~tab&"PXE - Photon, Export, Enter "
	setVar $BOT~help[1] $BOT~tab&"      Used to Launch a Photon into an adjacent Sector then immediately"
	setVar $BOT~help[1] $BOT~tab&"      Export into another ship and then enter Photon'd Sector."
	setVar $BOT~help[1] $BOT~tab&"     "
	setVar $BOT~help[1] $BOT~tab&"      pxe [Sector] [ShipNumber] "

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
