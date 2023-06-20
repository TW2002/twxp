	gosub :BOT~loadVars

	setVar $BOT~help[1] $BOT~tab&"PELK - Photon, Enter, Land, Kill"
	setVar $BOT~help[2] $BOT~tab&"       Used to launch a Photon into an adjacent Sector, Enter"
	setVar $BOT~help[3] $BOT~tab&"       Photon'd Sector and land on a Planet then sends one"
	setVar $BOT~help[4] $BOT~tab&"       wave of Fighters."
	setVar $BOT~help[5] $BOT~tab&"       "
	setVar $BOT~help[6] $BOT~tab&"       pelk [Sector] [PlanetNumber]"
	gosub :bot~helpfile

    gosub :INVADER~check_invade_macro_params
    setVar $INVADER~speed_invade_macro  $INVADER~enter&"     *  "
    setVar $INVADER~normal_invade_macro $INVADER~enter&"*            "
    gosub :INVADER~start_invade_macro
halt

# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\invader"
