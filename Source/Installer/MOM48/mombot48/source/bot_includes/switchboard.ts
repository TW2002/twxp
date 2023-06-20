#requires $bot_name
#requires $self_command
#requires $message


:switchboard

	if (($message = "0") or ($message = ""))
		return
	end
	setvar $discord_ignore "-- "
	# length of discord string above # 
	setvar $discord_ignore_length 3

	loadvar $BOT~botIsDeaf
	loadvar $bot~mode
	loadvar $nodiscord
	loadvar $fedspace_output
	
	if ($nodiscord <> true)
		getWordPos " "&$BOT~user_command_line&" " $pos " nodiscord "
		if ($pos > 0)
			setvar $nodiscord true
		end
	end

	if ($fedspace_output <> true)
		getwordpos " "&$bot~user_command_line&" " $pos " fed "
		if ($pos > 0)
			setvar $fedspace_output true
		end
	end

	if ($fedspace_output)
		setvar $communication_starter "`"
		if ($nodiscord)
			setVar $MSG_Header_SS_1     ($communication_starter&$discord_ignore&"Fedspace output - ")
			setVar $MSG_Header_SS_2     ($communication_starter&"*"&$discord_ignore&"Fedspace output - * ")
		else
			setVar $MSG_Header_SS_1     ($communication_starter&"Fedspace output - ")
			setVar $MSG_Header_SS_2     ($communication_starter&"*Fedspace output - * ")
		end
	else
		setvar $communication_starter "'"
		if ($nodiscord)
			setVar $MSG_Header_SS_1     ($communication_starter&$discord_ignore&"["&$bot~mode&"] {"&$bot_name&"} - ")
			setVar $MSG_Header_SS_2     ($communication_starter&"*"&$discord_ignore&"["&$bot~mode&"] {"&$bot_name&"} - * ")
		else
			setVar $MSG_Header_SS_1     ($communication_starter&"["&$bot~mode&"] {"&$bot_name&"} - ")
			setVar $MSG_Header_SS_2     ($communication_starter&"*["&$bot~mode&"] {"&$bot_name&"} - * ")
		end	
	end
	setVar $MSG_Header_Echo     (ANSI_9 & "{"&ANSI_14&$bot_name&ANSI_9&"} " & ANSI_15)
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
					gosub :stripansi
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
		if ($nodiscord)
			setvar $new_message $discord_ignore&$new_message
			add $length $discord_ignore_length
		end

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
			setvar $message $new_message
			gosub :stripansi
			send $MSG_Header_SS_1 & $message
		else
			setvar $message $new_message
			gosub :stripansi
			send $MSG_Header_SS_2 & $message & "*"
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
	if (($bot~command <> "help") and ($bot~only_help <> true))
		if (($self_command = 0) or ($self_command > 1) or (($self_command = 1) and (($bot~silent_running <> true) and ($isSilent <= 0))))

			setvar $next_length 60
			setvar $i 1
			setvar $length 1
			while ($i <= $message_length)
				cutText $message $character $i 1
				if ((($character = " ") and ($length >= $next_length)) or (($character = "*") and $length > 1))
					if ($i < $message_length)
						cutText $message $first_half 1 ($i-1)
						cutText $message $second_half ($i+1) 999999999
						#echo "["&$first_half&"]*"
						if ($nodiscord)
							setvar $first_half $first_half&"*"&$discord_ignore
							add $i $discord_ignore_length
							add $message_length $discord_ignore_length
						else
							setvar $first_half $first_half&"* "
							add $i 1
							add $message_length 1
						end
						setvar $message $first_half&$second_half
						setvar $length 0
					end
				end
				add $length 1
				add $i 1
			end
		end
	end
	setvar $new_message $message
return

:stripansi
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
return

include "source\module_includes\bot\echo\bot"
