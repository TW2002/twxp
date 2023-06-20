	gosub :BOT~loadVars
	

	setVar $i $bot~parm1
	isNumber $test $i
	if ($test <> TRUE)
		setVar $i currentsector
	end
	if (($i > SECTORS) OR ($i < 1))
		setVar $i currentsector
	end
	setVar $MAP~displaySector $i
	gosub :MAP~displaySector
	setVar $SWITCHBOARD~message $MAP~output
	listSectorParameters $i $bot~parms
	setvar $j 1
	setVar $SWITCHBOARD~message $SWITCHBOARD~message&"     *  "
	while ($j <= $bot~parms)
		getSectorParameter $i $bot~parms[$j] $check
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&"    "&$bot~parms[$j]&": "&$check&"*"
		add $j 1
	end

	gosub :SWITCHBOARD~switchboard
halt






# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\bot_includes\map\displaysector\map"
include "source\bot_includes\switchboard"
