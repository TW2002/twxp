	gosub :BOT~loadVars

	setVar $BOT~help[1] $BOT~tab&"PE - Photon, Enter "
	setVar $BOT~help[2] $BOT~tab&"     Launch a Photon into an Adjacent Sector and immedately Enters."
	setVar $BOT~help[3] $BOT~tab&"     "
	setVar $BOT~help[4] $BOT~tab&"     pe [Sector] "

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
