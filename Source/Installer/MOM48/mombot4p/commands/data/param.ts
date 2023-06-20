gosub :BOT~loadVars
	
if (($bot~parm1 = "?") or ($bot~parm1 = "help"))
	goto :wait_for_command
end

setVar $getAllParamsFromSectors FALSE
if ($bot~parm1 = "")
	setvar $bot~parm1 currentsector
end
isNumber $test $bot~parm1
if ($test = TRUE)
    if (($bot~parm1 <= 0) OR ($bot~parm1 > SECTORS))
        setvar $bot~parm1 CURRENTSECTOR
   end
    if ($SWITCHBOARD~self_command <> TRUE) or ($bot~silent_running <> TRUE)
        setVar $SWITCHBOARD~self_command 2
    end
    listSectorParameters $bot~parm1 $bot~parms
    setvar $i 1
    setVar $SWITCHBOARD~message "  *Displaying sector parameters for sector "&$bot~parm1&": *"
	
	# HAMMER - 23/10 - Added this because EP HAGGLE creates so many prams
	# that the BUST / FAKE Bust params weren't showing
	# So probably a bug in TWX...

    getSectorParameter $bot~parm1 "BUSTED" $bustthissec
    if ($bustthissec = TRUE)
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  BUSTED: 1*"
    end
    getSectorParameter $bot~parm1 "FAKEBUST" $fakebust
    if ($fakebust = TRUE)
		setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  FAKEBUST: 1*"
    end
    while ($i <= $bot~parms)
        getSectorParameter $bot~parm1 $bot~parms[$i] $check
		if ($bot~parms[$i] = "BUSTED")
		elseif ($bot~parms[$i] = "FAKEBUST")
		else
			setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  "&$bot~parms[$i]&": "&$check&"*"
		end
        add $i 1
    end
    gosub :SWITCHBOARD~switchboard
    goto :wait_for_command      
    
else
    setvar $i 1
    setvar $count 0
    uppercase $bot~parm1
    setVar $output "Displaying sectors for "&$bot~parm1&": *"
    if ($bot~parm1 <> "PSECTOR")
        while ($i <= SECTORS)
            getSectorParameter $i $bot~parm1 $check
            getSectorParameter $i "FIGSEC" $isFigged
            if (($check <> "") AND ($check <> "0"))
                if ($isFigged = true)
                    setVar $output $output&"["&$i&"] "
                else
                    setVar $output $output&$i&" "
                end
                add $count 1
            end
            add $i 1
        end
    else
        while ($i <= 2000)
            getSectorParameter $i "PSECTOR" $check
            if (($check <> "") AND ($check <> "0"))
                setVar $output $output&" Planet #"&$i&"==>["&$check&"]*"
                add $count 1
            end
            add $i 1
        end        
    end

    if ($SWITCHBOARD~self_command <> TRUE) or ($bot~silent_running <> TRUE)
        setVar $SWITCHBOARD~self_command 2
    end

    setVar $SWITCHBOARD~message $output&"*Total Count: "&$count&"*"
    gosub :SWITCHBOARD~switchboard
    goto :wait_for_command      

end


:wait_for_command
	setVar $BOT~help[1]  $BOT~tab&"   PARAM - Displays sector parameters saved in game."
	setVar $BOT~help[2]  $BOT~tab&"   "
	setVar $BOT~help[3]  $BOT~tab&"   - param [sector]  "
	setVar $BOT~help[4]  $BOT~tab&"        Displays all bot sector parameters "
	setVar $BOT~help[5]  $BOT~tab&"          (FIGSEC, MINESEC, LIMPSEC, MSLSEC, BUSTED, PSECTOR)"
	setVar $BOT~help[6]  $BOT~tab&"   "
	setVar $BOT~help[7]  $BOT~tab&"   - param [param]"
	setVar $BOT~help[8]  $BOT~tab&"        Displays all sectors where that param is non-zero/non-blank"
	setVar $BOT~help[9]  $BOT~tab&"   "
	gosub :bot~helpfile
halt

:killthetriggers
    killalltriggers
return


# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
