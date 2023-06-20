:displayhelp
	setVar $i 1
	setVar $helpOutput ""
	setvar $isDone false
	while (($i <= $help) and ($isDone <> true)) 
		if ($help[$i] <> "0")
			stripText $help[$i] #13
			stripText $help[$i] "`"
			stripText $help[$i] "'"
			replaceText $help[$i] "=" "-"
			setVar $temp $help[$i]
			getLength $temp $length
			setVar $isTooLong FALSE
			setvar $next_line ""
			setvar $max_length 65
			if (($SWITCHBOARD~self_command = true) or ($silent_running = TRUE))
				setvar $line $help[$i]
				gosub :formathelpline
				setvar $help[$i] $line
				setvar $next_line_test $next_line
				stripText $next_line_test " "
				if ($next_line_test <> "")
					setVar $line $next_line 
					gosub :formathelpline
					setvar $next_line $line
				end
			else
				while ($length > $max_length)
					setVar $isTooLong TRUE
					cutText $temp $next_line ($max_length+1) ($length-$max_length)
					cutText $temp $help[$i] 1 $max_length
					getLength $next_line $length
				end
			end
			setVar $helpOutput $helpOutput&$help[$i]&"  *"
			setvar $next_line_test $next_line
			stripText $next_line_test " "
			if ($next_line_test <> "")
				setVar $helpOutput $helpOutput&""&$next_line&"  *"
			end
			if ($length <= 1)
				#setVar $helpOutput $helpOutput&"    "
			end
			#setVar $helpOutput "   "&$helpOutput&"*"
		else
			setvar $isDone true
		end
		add $i 1
	end
	
	if (($SWITCHBOARD~self_command = true) or ($silent_running = TRUE))
		setVar $helpOutput "  *"&ansi_14&"-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*  *"&ansi_15&$helpOutput&ansi_14&"  *     *-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*"&ansi_15
		setVar $SWITCHBOARD~message $helpOutput
		gosub :SWITCHBOARD~switchboard
	else
		setVar $helpOutput "  *"&"-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*"&$helpOutput&"  *     *-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*"
		send "'*{"&$SWITCHBOARD~bot_name&"} - *"&$helpOutput&"*"
	end
return

include "source\module_includes\bot\formathelpline\bot"

