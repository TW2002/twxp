	gosub :BOT~loadVars

	setVar $BOT~help[1] $BOT~tab&"busts -"
	setVar $BOT~help[2] $BOT~tab&"    displays all busted sectors on subspace"
	gosub :bot~helpfile

setvar $switchboard~message "Scanning BUSTED SectorParameter ...*"
gosub :switchboard~switchboard

setVar $IDX 11
setVar $COUNT 0
setVar $COLUMN 1
setVar $STRING "      "
while ($IDX <= SECTORS)
	getsectorparameter $IDX "BUSTED" $BUS
	isnumber $tst $BUS
	if ($tst = 0)
		setVar $BUS 0
	end
	if ($BUS <> 0)
		add $COUNT 1
		gosub :PAD
		if ($COLUMN <= 10)
			setVar $STRING ($STRING & " " & $PAD & $IDX)
			add $COLUMN 1
		else
			setVar $STRING ($STRING & "*       " & $PAD & $IDX)
			setVar $COLUMN 1
		end
	end
	add $IDX 1
end
setvar $switchboard~message $COUNT&" Busts Found In DataBase*"
if ($COUNT <> 0)
	setvar $switchboard~message $switchboard~message&$STRING&"*"
end
setvar $switchboard~message $switchboard~message&"*"
gosub :switchboard~switchboard
halt

:PAD
setVar $PAD ""
getlength $IDX $LEN
setVar $PAD_i 1
while ($PAD_i <= (5 - $LEN))
	setVar $PAD ($PAD & " ")
	add $PAD_i 1
end
return


#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
