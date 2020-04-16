	gosub :BOT~loadVars
	loadvar $player~surroundlimp
	loadvar $player~surroundmine
	
	setVar $BOT~help[1]  $BOT~tab&"clear - clear all enemy armids and limpets from sector "
	gosub :bot~helpfile
	
	setVar $SWITCHBOARD~bot_name $bot~bot_name
	setVar $SWITCHBOARD~self_command $self_command

	goto :modules~clear
	halt
	
# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\modules\clear\modules"
