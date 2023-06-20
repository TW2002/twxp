	gosub :BOT~loadVars
									

	setVar $BOT~help[1]  $BOT~tab&"  wait {ms:#}    " 
	setVar $BOT~help[2]  $BOT~tab&"                                                            " 
	setVar $BOT~help[3]  $BOT~tab&"    Waits for time specified.  This is a utility script  " 
	setVar $BOT~help[4]  $BOT~tab&"    created mostly for the multicommand functionality.     " 
	setVar $BOT~help[5]  $BOT~tab&"                                                             " 
	setVar $BOT~help[6]  $BOT~tab&"         {ms:#} - How many milliseconds to wait            " 
	setVar $BOT~help[7]  $BOT~tab&"                                                             " 
	setVar $BOT~help[8]  $BOT~tab&"        Examples:                                           " 
	setVar $BOT~help[9]  $BOT~tab&"              >wait 10000                             " 
	setVar $BOT~help[10] $BOT~tab&"              >mow 1|wait 5000|mow 25                   " 
	setVar $BOT~help[11] $BOT~tab&"              >wait     (waits default of 1 second)        " 
	gosub :bot~helpfile

	if ($bot~parm1 <> "")
        getWordPos $bot~user_command_line $pos "ms:"
        if ($pos > 0)
            getText " "&$bot~user_command_line&" " $milliseconds "ms:" " "
            if ($milliseconds = false)
                setVar $SWITCHBOARD~message "Invalid milliseconds entered.*"
                gosub :SWITCHBOARD~switchboard
                halt			
            end
        else
            setvar $milliseconds $bot~parm1
        end
	else
        setvar $milliseconds 1000
    end



killtrigger delay
setDelayTrigger delay :done_waiting $milliseconds
pause
:done_waiting
halt



#-=-=-=-=-includes-=-=-=-=-
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
