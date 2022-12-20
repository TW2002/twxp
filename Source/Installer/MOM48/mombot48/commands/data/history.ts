	logging off
	gosub :BOT~loadVars

	setVar $BOT~help[1]  $BOT~tab&" history {limit:#} {filter:x}"
	setVar $BOT~help[2]  $BOT~tab&"   "
	setVar $BOT~help[3]  $BOT~tab&"     Displays the most recent self commands"
	setVar $BOT~help[4]  $BOT~tab&"     this bot has given."
	setVar $BOT~help[5]  $BOT~tab&"         "
	setVar $BOT~help[6]  $BOT~tab&"      {limit:#} - display the last # of commands"
	setVar $BOT~help[7]  $BOT~tab&"     {filter:x} - only show commands matching this"
	setVar $BOT~help[8]  $BOT~tab&"                      "
	setVar $BOT~help[9]  $BOT~tab&"     Example:                      "
	setVar $BOT~help[10] $BOT~tab&"         >history 10                      "
	setVar $BOT~help[11] $BOT~tab&"         >history pdrop                   "
	setVar $BOT~help[12] $BOT~tab&"         >history 3 pdrop                   "

	gosub :bot~helpfile

	setVar $bot~historyMax      100

	loadVar $BOT~historyString
	setVar $BOT~historyCount 0



	setvar $switchboard~message ""

	getWordPos $BOT~historyString $pos "<<|HS|>>"
	while (($pos > 0) AND ($BOT~historyCount < $BOT~historyMax))
		cutText $BOT~historyString $archive 1 ($pos-1)
		replaceText $BOT~historyString $archive&"<<|HS|>>" "" 
		setVar $history[($BOT~historyCount+1)] $archive
		add $BOT~historyCount 1
		getWordPos $BOT~historyString $pos "<<|HS|>>"
	end

	isNumber $isnumber $bot~parm1
	if ($isnumber = true)
		setvar $history_limit $bot~parm1
	else
		setvar $filter $bot~parm1
	end
	if ($history_limit = 0)
		setvar $history_limit $BOT~historyCount
	else
		setvar $filter $bot~parm2
	end
	if ($filter = "")
		setvar $i $history_limit
		setvar $switchboard~message $switchboard~message&"Displaying last "&$history_limit&" commands:*"
		while ($i >= 1)
			if ($history[($i+$place)] <> "0")
				setvar $switchboard~message $switchboard~message&$history[($i+$place)]&"*"
			end
			subtract $i 1
		end
	else
		setvar $count 0
		setvar $i $BOT~historyCount
		setvar $switchboard~message $switchboard~message&"Displaying last commands matching ["&$filter&"]:*"
		while (($i >= 1) and ($count <= $history_limit))
			if ($history[($i+$place)] <> "0")
				getwordpos $history[($i+$place)] $pos $filter 
				if ($pos > 0)
					add $count 1
					setvar $switchboard~message $switchboard~message&$history[($i+$place)]&"*"
				end
			end
			subtract $i 1
		end	
	end


	gosub :switchboard~switchboard
halt

#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
