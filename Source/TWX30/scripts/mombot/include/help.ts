#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:help~initialize
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setarray $help~help 60
setvar $help~help 60
setvar $help~tab "     "
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:help~helpfile
:help~help_file
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
loadvar $bot~mombot_directory
loadvar $bot~command
loadvar $bot~parm1
loadvar $bot~user_command_line
setvar $help_file "scripts\"&$bot~mombot_directory&"\help\"&$bot~command&".txt"
fileexists $doeshelpfileexist $help_file
setvar $bot~only_help false
if (($bot~parm1 = "help") or ($bot~parm1 = "?"))
	setvar $bot~only_help true
end
savevar $bot~only_help
if ($doeshelpfileexist)
	setvar $i 1
	read $help_file $help_line ($i + 4)
	while ($help_line <> "EOF")
		striptext $help~help[$i] #13
		striptext $help~help[$i] "`"
		striptext $help~help[$i] "'"
		replacetext $help~help[$i] "=" "-"
		if ($help~help[$i] <> $help_line)
			goto :write_new_help_file
		end
		add $i 1
		read $help_file $help_line ($i + 4)
	end
	if (($help~help[($i + 1)] <> 0) or ($help~help[($i + 2)] <> 0))
		goto :write_new_help_file
	end
	if ($bot~only_help = true)
		gosub :displayhelp
		halt
	end
	return
end
goto :write_new_help_file

:write_new_help_file
loadvar $bot~command
delete $help_file
setvar $i 1
getlength $bot~command $length
setvar $spaces "                                            "
setvar $stars "---------------------------------------------"
setvar $pos $length
cuttext $stars $border 1 $pos
setvar $pos ((50 - ($length + 10)) / 2)
cuttext $spaces $center 1 $pos
write $help_file "                     "
write $help_file "   "
write $help_file $center&"<<<< "&$bot~command&" >>>>"
write $help_file "   "
while ($i <= $help~help)
	striptext $help~help[$i] #13
	striptext $help~help[$i] "`"
	striptext $help~help[$i] "'"
	replacetext $help~help[$i] "=" "-"
	if ($help~help[$i] = 0)
		goto :done_help_file
	end
	write $help_file $help~help[$i]
	add $i 1
end

:done_help_file
setvar $switchboard~message "Writing text file for "&$bot~command&" in help directory.*"
gosub :switchboard~switchboard

if ($bot~only_help = true)
	gosub :displayhelp
	halt
end
return

:help~displayhelp
loadvar $switchboard~self_command
loadvar $switchboard~bot_name
loadvar $bot~silent_running
setvar $i 1
setvar $helpoutput ""
setvar $isdone false
while (($i <= $help~help) and ($isdone <> true))
	if ($help~help[$i] <> 0)
		striptext $help~help[$i] #13
		striptext $help~help[$i] "`"
		striptext $help~help[$i] "'"
		replacetext $help~help[$i] "=" "-"
		setvar $temp $help~help[$i]
		getlength $temp $length
		setvar $istoolong false
		setvar $next_line ""
		setvar $max_length 65
		if (($switchboard~self_command = true) or ($bot~silent_running = true))
			setvar $line $help~help[$i]
			gosub :formathelpline
			setvar $help~help[$i] $line
			setvar $next_line_test $next_line
			striptext $next_line_test " "
			if ($next_line_test <> "")
				setvar $line $next_line
				gosub :formathelpline
				setvar $next_line $line
			end
		else
			while ($length > $max_length)
				setvar $istoolong true
				cuttext $temp $next_line ($max_length + 1) ($length - $max_length)
				cuttext $temp $help~help[$i] 1 $max_length
				getlength $next_line $length
			end
		end
		setvar $helpoutput $helpoutput&$help~help[$i]&"  *"
		setvar $next_line_test $next_line
		striptext $next_line_test " "
		if ($next_line_test <> "")
			setvar $helpoutput $helpoutput&""&$next_line&"  *"
		end
		if ($length <= 1)
		end

	else
		setvar $isdone true
	end
	add $i 1
end

if (($switchboard~self_command = true) or ($bot~silent_running = true))
	setvar $helpoutput "  *"&ansi_14&"-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*  *"&ansi_15&$helpoutput&ansi_14&"  *     *-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*"&ansi_15
	setvar $switchboard~message $helpoutput
	gosub :switchboard~switchboard
else
	setvar $helpoutput "  *"&"-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*"&$helpoutput&"  *     *-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*"
	send "'*{"&$switchboard~bot_name&"} - *"&$helpoutput&"*"
end
return

:formathelpline
replacetext $line "[" ansi_2&"["&ansi_6
replacetext $line "]" ansi_2&"]"&ansi_13
replacetext $line "-" ansi_7&"-"&ansi_13
replacetext $line "<<<<" ansi_14&"<"&ansi_7&"<"&ansi_14&"<"&ansi_7&"<"&ansi_15
replacetext $line ">>>>" ansi_7&">"&ansi_14&">"&ansi_7&">"&ansi_14&">"
replacetext $line "{" ansi_2&"{"&ansi_6
replacetext $line "}" ansi_2&"}"&ansi_13
replacetext $line "Options:" ansi_6&"Options"&ansi_2&":"&ansi_13
setvar $line ansi_13&$line&ansi_15
return

include "source\include\switchboard"
