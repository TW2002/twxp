:checkfortravelname
	if ($bot~parm1 = "me")
		if ($bot~command_caller = "self")
			setVar $SWITCHBOARD~message "I don't think you need to travel to yourself.*"
			gosub :SWITCHBOARD~switchboard
			halt
		end
		setvar $who_called_me $bot~command_caller
		gosub :checkcorp
		setvar $i 1
		while ($i <= $corp_count)
			lowercase $corp_members[$i]
            lowercase $who_called_me
			getwordpos $corp_members[$i] $pos $who_called_me
			if ($pos > 0)
				setvar $bot~parm1 $corp_members[$i][1]
				goto :go_after_me
			end
			add $i 1
		end
	end
	isNumber $test $bot~parm1
	if ($test <> true)
        getWordPos $bot~user_command_line $pos "sector:"
        if ($pos > 0)
            setVar $cline $bot~user_command_line & " "
            getText $cline $bot~parm1 "sector:" " "
            goto :go_after_me
        end
        getWordPos $bot~user_command_line $pos #34
        if ($pos > 0)
            getText $bot~user_command_line $trader #34 #34
            if ($trader = false)
                setvar $trader $bot~parm1
            end
        else
            setvar $trader $bot~parm1
        end

		# check for corpie name #
		gosub :checkcorp
		setvar $i 1
		while ($i <= $corp_count)
			lowercase $corp_members[$i]
            lowercase $trader
			getwordpos $corp_members[$i] $pos $trader
			if ($pos > 0)
				setvar $bot~parm1 $corp_members[$i][1]
				goto :go_after_me
			end
			add $i 1
		end
	end
	:go_after_me
return