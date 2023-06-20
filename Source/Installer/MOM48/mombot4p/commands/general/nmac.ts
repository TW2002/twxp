gosub :BOT~loadVars
if (($bot~parm1 = "?") or ($bot~parm1 = "help"))
	goto :wait_for_command
end

# ============================== SINGLE MACRO (MAC) ==============================
:nmac
	setVar $nmac $bot~parm1
:go_macro
	isNumber $number $nmac
	if ($number <> TRUE)
		setvar $switchboard~message "Invalid Macro Count*"
		gosub :switchboard~switchboard
		goto :wait_for_command
	end
	if ($nmac <= 0)
		setvar $switchboard~message "Invalid Macro Count*"
		gosub :switchboard~switchboard
		goto :wait_for_command
	end
	getlength $nmac $length 
	getwordpos $bot~user_command_line $pos $nmac&" "
	cuttext $bot~user_command_line $bot~user_command_line ($pos+$length+1) 9999
	gosub :macroProtections
	setVar $i 0
	while ($i < $nmac)

		send $bot~user_command_line
		add $i 1
	end
	if ($nmac > 1)
		setvar $switchboard~message "Numbered Macro - "&$nmac&" Cycles Complete*"
		gosub :switchboard~switchboard
	else
		setvar $switchboard~message "Macro Complete*"
		gosub :switchboard~switchboard
	end
	goto :wait_for_command
# ============================== END MACROS (MAC/NMAC) SUB ==============================
:macroProtections

	stripText $bot~user_command_line $SWITCHBOARD~bot_name
	StripText $bot~user_command_line " nmac "
	replaceText $bot~user_command_line "^m" "*"
	replaceText $bot~user_command_line "^b" #8
	replaceText $bot~user_command_line #42 "*"
	getWordPos $bot~user_command_line $pos "`"
	getWordPos $bot~user_command_line $pos2 "'"
	getWordPos $bot~user_command_line $pos3 "="
	if (($pos > 0) OR ($pos2 > 0) OR ($pos3 > 0))
		setvar $switchboard~message "No talking with the bot :P*"
		gosub :switchboard~switchboard
		goto :wait_for_command
	end
	setVar $cbyCheck $bot~user_command_line
	lowercase $cbyCheck
	getWordPos $cbyCheck $posc "c"
	getWordPos $cbyCheck $posb "b"
	getWordPos $cbyCheck $posy "y"
	gosub  :player~currentPrompt
	if (($PLAYER~CURRENT_PROMPT = "Computer") AND ($posb > 0) AND ($posy > 0))
		setvar $switchboard~message "Self Destruct Protection Activated*"
		gosub :switchboard~switchboard
		goto :wait_for_command
	end
	if (($PLAYER~self_destruct_prompt = true) AND ($posy > 0))
		setvar $switchboard~message "Self Destruct Protection Activated*"
		gosub :switchboard~switchboard
		goto :wait_for_command
	end

	getLength $cbyCheck $length
	setVar $i 1
	while ($i <= $length)
		if (($posc > 0) AND ($posb > $posc) AND ($posy > $posb))
			setvar $switchboard~message "Self Destruct Protection Activated*"
			gosub :switchboard~switchboard
			goto :wait_for_command
		end
		if ($foundC = FALSE)
			getWordPos $cbyCheck $pos "c"
			if ($pos = 1)
				setVar $foundC TRUE
			end
		elseif ($foundB = FALSE)
			getWordPos $cbyCheck $pos "b"
			if ($pos = 1)
				setVar $foundB TRUE
			end
		elseif ($foundY = FALSE)
			getWordPos $cbyCheck $pos "y"
			if ($pos = 1)
				setVar $foundY TRUE
			end
		end
		if ($foundC AND $foundB AND $foundY)
			setvar $switchboard~message "Self Destruct Protection Activated*"
			gosub :switchboard~switchboard
			goto :wait_for_command
		end
		if ($testLength > 1)
			cutText $cbyCheck $cbyCheck 2 9999
		end
		add $i 1
	end
return
# ============================== END MULTIPLE MACRO (NMAC) SUB ==============================


:wait_for_command
	setVar $BOT~help[1]  $BOT~tab&"   nmac - multiple macro          "
	setVar $BOT~help[2]  $BOT~tab&"               "
	setVar $BOT~help[3]  $BOT~tab&"    nmac {number of times} {macro to send}  "
	setVar $BOT~help[4]  $BOT~tab&"        "
	gosub :bot~helpfile
halt


# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\currentprompt\player"
