:helpfile
	setVar $help_file "scripts\mombot\help\"&$command&".txt"
	fileExists $doesHelpFileExist $help_file
	setvar $only_help false
	if (($parm1 = "help") or ($parm1 = "?"))
		setvar $only_help true
	end
	if ($doesHelpFileExist)
		setVar $i 1 
		read $help_file $help_line ($i+4)
		while ($help_line <> EOF)
			#echo "*[]"&$help[$i]&"[]<->*[]"&$help_line&"[]*"
			stripText $help[$i] #13
			stripText $help[$i] "`"
			stripText $help[$i] "'"
			replaceText $help[$i] "=" "-"
			if ($help[$i] <> $help_line)
				goto :write_new_help_file
			end
			add $i 1
			read $help_file $help_line ($i+4)
		end
		if (($help[($i + 1)] <> "0") OR (($help[($i + 2)] <> "0")))
			goto :write_new_help_file
		end
		if ($only_help = true)
			gosub :displayhelp
			halt
		end
		return
	end
	:write_new_help_file
		delete $help_file
		setvar $i 1
		getLength $command $length
		setVar $spaces "                                            "
		setVar $stars "---------------------------------------------"
		setVar $pos ($length)
		cutText $stars $border 1 $pos
		setVar $pos ((50-($length+10))/2)
		cutText $spaces $center 1 $pos
		write $help_file "                     "
		write $help_file "   "
		write $help_file $center&"<<<< "&$command&" >>>>" 
		write $help_file "   "
		while ($i <= $help)
			stripText $help[$i] #13
			stripText $help[$i] "`"
			stripText $help[$i] "'"
			replaceText $help[$i] "=" "-"
			if ($help[$i] = "0")
				goto :done_help_file
			end
			write $help_file $help[$i]
			add $i 1
		end
		:done_help_file
			 setVar $SWITCHBOARD~message "Writing text file for "&$command&" in help directory.*"
			 gosub :SWITCHBOARD~switchboard

		if ($only_help = true)
			gosub :displayhelp
			halt
		end
return

include "source\module_includes\bot\displayhelp\bot"
include "source\bot_includes\switchboard"

