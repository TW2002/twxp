#requires $bot_name
#requires $self_command
#requires $message


:switchboard
    loadvar $BOT~botIsDeaf
    loadvar $bot~mode
    
    setVar $MSG_Header_Echo     (ANSI_9 & "{"&ANSI_14&$bot_name&ANSI_9&"} " & ANSI_15)
    setVar $MSG_Header_SS_1     ("'["&$bot~mode&"] {"&$bot_name&"} - ")
    setVar $MSG_Header_SS_2     ("'*["&$bot~mode&"] {"&$bot_name&"} - *")
    if ($message <> "")

        if ($self_command > 0)
            setVar $length 0
        else
            getLength $bot_name $length
        end
        setVar $i 1
        setVar $spacing ""
        getWordPos " "&$BOT~user_command_line&" " $isBroadcast " ss "
        getWordPos " "&$BOT~user_command_line&" " $isSilent " silent "

        if ($self_command <> 0)
            #echo "*[self command:"&$self_command&"]*"
            if (($bot~command <> "help") and ($bot~only_help <> true))
                if (($self_command > 1) or (($self_command = 1) and (($bot~silent_running <> true) and ($isSilent <= 0))))
                    striptext $message ANSI_1
                    striptext $message ANSI_2
                    striptext $message ANSI_3
                    striptext $message ANSI_4
                    striptext $message ANSI_5
                    striptext $message ANSI_6
                    striptext $message ANSI_7
                    striptext $message ANSI_8
                    striptext $message ANSI_9
                    striptext $message ANSI_10
                    striptext $message ANSI_11
                    striptext $message ANSI_12
                    striptext $message ANSI_13
                    striptext $message ANSI_14
                    striptext $message ANSI_15
                    if ($helpList <> TRUE)
                        #striptext $message "    "
                    end
                end
            end
			while ($i <= ($length))
				setVar $spacing $spacing&" "
				add $i 1
			end
			setVar $new_message ""
			setVar $message_line ""
			gosub :format_raw_message
		else
			gosub :format_raw_message
		end

        getWordPos " "&$new_message&" " $pos "*"
        getlength $new_message $length

        if ($self_command > 1)
            setvar $self_command false
        end
        if ($pos < $length)
            setvar $multiple_lines true
        else
            setvar $multiple_lines false
        end
        #echo "*[length of "&$new_message&":"&$length&"  position of enter:"&$pos&"] isSilent:["&$isSilent&"]*"
        #echo "*[command line: "&$bot~user_command_line&"self command:"&$self_command&"    silent running:"&$bot~silent_running&"   command:"&$bot~command&"] isSilent:["&$isSilent&"]*"
        if (((($isSilent > 0) or ($bot~silent_running = true) and ($self_command = true))) or (($self_command = true) and (($bot~command = "help") or ($bot~only_help = true))) and ($isBroadcast <= 0))
            if ($BOT~botIsDeaf <> TRUE)
                Echo "*" & $MSG_Header_Echo & $new_message
                send #145
            else
                setvar $window_content $new_message
                replaceText $window_content "*" "[][]"
                saveVar $window_content
            end
        elseif ($multiple_lines = false)
            send $MSG_Header_SS_1 & $new_message
        else
            send $MSG_Header_SS_2 & $new_message & "*"
        end
        setVar $message ""
    end
    setVar $helpList FALSE
return

:format_raw_message
	# for messages that need to be in multiple lines #

	getWordPos " "&$message&" " $pos "*"
	getlength $message $message_length

	if ($pos < $message_length)
		setvar $multiple_lines true
	else
		setvar $multiple_lines false
	end

	# only auto format if not already in multiple lines or help file #
	if (($bot~only_help <> true) and ($multiple_lines <> true))
		setvar $next_length 60
		setvar $i 1
		setvar $length 1
		while ($i <= $message_length)
			cutText $message $character $i 1
			if (($character = " ") and ($length > $next_length))
				cutText $message $first_half  1 $i
				cutText $message $second_half $i 999999999
				setvar $second_half "*"&$second_half
				replacetext $second_half "* " "*"
				setvar $message $first_half&$second_half
				setvar $length 0
			end
			add $length 1
			add $i 1
		end
		replacetext $second_half "***" "**"
	end
	setvar $new_message $message

return


