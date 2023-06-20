	gosub :BOT~loadVars
	loadvar $game~port_max

	setVar $BOT~help[1]   $BOT~tab&"  deploy/put/lay/place {number} {type} {pers | corp} "
	setVar $BOT~help[2]   $BOT~tab&"     "
	setVar $BOT~help[3]   $BOT~tab&"  Command to replace old climp/plimp/mines/cmine/pmine "
	setVar $BOT~help[4]   $BOT~tab&"  commands.  Old syntax still works but can also use new"
	setVar $BOT~help[5]   $BOT~tab&"  options"
	setVar $BOT~help[6]   $BOT~tab&"     "
	setVar $BOT~help[7]   $BOT~tab&"   [topoff] - will fill ship up with fighters from sector "
	setVar $BOT~help[8]   $BOT~tab&"              Example:"
	setVar $BOT~help[9]   $BOT~tab&"                    >topoff"
	setVar $BOT~help[10]  $BOT~tab&"     "
	setVar $BOT~help[11]  $BOT~tab&"   [plimp | climp | cmine | pmine] - drops mines (default 1)"
	setVar $BOT~help[12]  $BOT~tab&"              Examples: "
	setVar $BOT~help[13]  $BOT~tab&"                    >plimp "
	setVar $BOT~help[14]  $BOT~tab&"                    >place 100 limp"
	setVar $BOT~help[15]  $BOT~tab&"                    >put p limp"
	setVar $BOT~help[16]  $BOT~tab&"                    >lay 250 corp mine"
	setVar $BOT~help[17]  $BOT~tab&"                    >deploy l p "
	setVar $BOT~help[18]  $BOT~tab&"                    >plimp 3 "
	setVar $BOT~help[19]  $BOT~tab&"      "
	setVar $BOT~help[20]  $BOT~tab&"    [mines] - drops both mine types (default 3) "
	setVar $BOT~help[21]  $BOT~tab&"              Examples:   "
	setVar $BOT~help[22]  $BOT~tab&"                    >lay 250 mines"
	setVar $BOT~help[23]  $BOT~tab&"                    >mines"
	setVar $BOT~help[24]  $BOT~tab&"   "
	setVar $BOT~help[25]  $BOT~tab&"   [deploy] - puts fighter into sector (default)"
	setVar $BOT~help[26]  $BOT~tab&"              Examples: "
	setVar $BOT~help[27]  $BOT~tab&"                    >deploy 10000 figs"
	setVar $BOT~help[28]  $BOT~tab&"                    >deploy 100000"
	setVar $BOT~help[29]  $BOT~tab&"                    >put 100 personal"
	gosub :bot~helpfile


	setVar $bot~bot_name $SWITCHBOARD~bot_name
	
	gosub :PLAYER~quikstats
	setVar $startingLocation $PLAYER~CURRENT_PROMPT
	setVar $bot~startingLocation $PLAYER~CURRENT_PROMPT
	if (($startingLocation <> "Citadel") AND ($startingLocation <> "Command"))
		setVar $SWITCHBOARD~message "You must run deploy from command or citadel prompt.*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
	loadVar $planet~planet
	
	setvar $i 1
	setvar $line $bot~user_command_line
	setvar $bot~user_command_line ""
	setvar $nothing "<>!<>junk<>!<>!"
	getword $line $word 1 $nothing

	while ($word <> $nothing)
		getword $line $word $i $nothing
		if (($word = "?") or ($word = "help"))
			setvar $bot~parm1 "?"
			gosub :bot~helpfile
			halt
		end
		if ($word <> $nothing)
			setvar $bot~user_command_line $bot~user_command_line&" "&$word
		end
		add $i 1
	end

	isNumber $isnumber $bot~parm1
	setvar $default false
	if ($isnumber = true)
		setvar $deploy_amount $bot~parm1
	else
		setvar $deploy_amount 1
		setvar $default true
	end
	setvar $deploy_corp true
	setvar $deploy "defensive"

	getwordpos " "&$bot~user_command_line&" " $pos " f"
	if ($pos > 0)
		setvar $fighter true
	else
		setvar $fighter false
	end

	getwordpos " "&$bot~user_command_line&" " $pos " l"
	getwordpos " "&$bot~user_command_line&" " $pos2 "limp"
	if (($pos > 0) or ($pos2 > 0))
		setvar $limpet true
	else
		setvar $limpet false
	end

	getwordpos " "&$bot~user_command_line&" " $pos " a"
	getwordpos " "&$bot~user_command_line&" " $pos2 "mine"
	if (($pos > 0) or ($pos2 > 0))
		setvar $armid true
	else
		setvar $armid false
	end

	getwordpos " "&$bot~user_command_line&" " $pos " o"
	if ($pos > 0)
		setvar $offensive true
		setvar $defensive false
		setvar $toll false
	else
		setvar $offensive false
	end

	getwordpos " "&$bot~user_command_line&" " $pos " d"
	if ($pos > 0)
		setvar $defensive true
		setvar $toll false
		setvar $offensive false
	else
		setvar $defensive false
	end

	getwordpos " "&$bot~user_command_line&" " $pos " t"
	if ($pos > 0)
		setvar $toll true
		setvar $defensive false
		setvar $offensive false
	else
		setvar $toll false
	end

	getwordpos " "&$bot~user_command_line&" " $pos " p"
	if ($pos > 0)
		setvar $personal true
		setvar $corporate false
	else
		setvar $personal false
	end

	getwordpos " "&$bot~user_command_line&" " $pos " c"
	if ($pos > 0)
		setvar $corporate true
		setvar $personal false
	else
		setvar $corporate false
	end

	getwordpos " "&$bot~user_command_line&" " $pos " mines "
	if ($pos > 0)
		setvar $limpet true
		setvar $armid true
	end

	getwordpos " "&$bot~user_command_line&" " $pos " topoff "
	if ($pos > 0)
		setvar $topoff true
		setvar $fighter true
		setvar $armid false
		setvar $limpet false
	end

	if (($fighter <> true) and ($limpet <> true) and ($armid <> true))
		setvar $fighter true
	end
	if (($offensive <> true) and ($defensive <> true) and ($toll <> true))
		if ((CURRENTSECTOR > 0) AND (CURRENTSECTOR <= SECTORS))
			setVar $type SECTOR.FIGS.TYPE[CURRENTSECTOR]
			if ($type = "Offensive")
				setvar $offensive true
			elseif ($type = "Defensive")
				setvar $defensive true
			elseif ($type = "Toll")
				setvar $toll true
			else
				setvar $defensive true
			end
		else
			setvar $defensive true
		end
	end
	if (($corporate <> true) and ($personal <> true))
		setvar $corporate true
	end

	if ($fighter)
		if ($topoff)
			gosub :topoff~deploy
		else
			setvar $fighter~offensive $offensive
			setvar $fighter~defensive $defensive
			setvar $fighter~toll $toll
			setvar $fighter~corporate $corporate
			setvar $fighter~personal $personal
			setvar $fighter~amount $deploy_amount
			gosub :fighter~deploy
		end
	elseif (($limpet) and ($armid))
		setvar $mines~personal $personal
		if ($default)
			setvar $deploy_amount 3
		end
		setvar $mines~amount $deploy_amount
		gosub :mines~deploy
	elseif ($limpet)
		setvar $limp~personal $personal
		setvar $limp~amount $deploy_amount
		gosub :limp~deploy
	elseif ($armid)
		setvar $armid~personal $personal
		setvar $armid~amount $deploy_amount
		gosub :armid~deploy
	end

halt

#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\module_includes\bot\checkstartingprompt\bot"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\planet\landingsub\planet"
include "source\module_includes\deploy\limp"
include "source\module_includes\deploy\armid"
include "source\module_includes\deploy\mines"
include "source\module_includes\deploy\fighter"
include "source\module_includes\deploy\topoff"
