:switchboard~switchboard






if (($switchboard~message = 0) or ($switchboard~message = ""))
  return
end
setvar $switchboard~discord_ignore "-- "

setvar $switchboard~discord_ignore_length 3

loadvar $bot~botisdeaf
loadvar $bot~mode
loadvar $switchboard~nodiscord
loadvar $switchboard~fedspace_output

if ($switchboard~nodiscord <> TRUE)
  getwordpos " "&$bot~user_command_line&" " $switchboard~pos " nodiscord "
  if ($switchboard~pos > 0)
    setvar $switchboard~nodiscord TRUE
  end
end

if ($switchboard~fedspace_output <> TRUE)
  getwordpos " "&$bot~user_command_line&" " $switchboard~pos " fed "
  if ($switchboard~pos > 0)
    setvar $switchboard~fedspace_output TRUE
  end
end

if ($switchboard~fedspace_output)
  setvar $switchboard~communication_starter "`"
  if ($switchboard~nodiscord)
    setvar $switchboard~msg_header_ss_1 $switchboard~communication_starter&$switchboard~discord_ignore&"Fedspace output - "
    setvar $switchboard~msg_header_ss_2 $switchboard~communication_starter&"*"&$switchboard~discord_ignore&"Fedspace output - * "
  else
    setvar $switchboard~msg_header_ss_1 $switchboard~communication_starter&"Fedspace output - "
    setvar $switchboard~msg_header_ss_2 $switchboard~communication_starter&"*Fedspace output - * "
  end
else
  setvar $switchboard~communication_starter "'"
  if ($switchboard~nodiscord)
    setvar $switchboard~msg_header_ss_1 $switchboard~communication_starter&$switchboard~discord_ignore&"["&$bot~mode&"] {"&$switchboard~bot_name&"} - "
    setvar $switchboard~msg_header_ss_2 $switchboard~communication_starter&"*"&$switchboard~discord_ignore&"["&$bot~mode&"] {"&$switchboard~bot_name&"} - * "
  else
    setvar $switchboard~msg_header_ss_1 $switchboard~communication_starter&"["&$bot~mode&"] {"&$switchboard~bot_name&"} - "
    setvar $switchboard~msg_header_ss_2 $switchboard~communication_starter&"*["&$bot~mode&"] {"&$switchboard~bot_name&"} - * "
  end
end
setvar $switchboard~msg_header_echo ANSI_9&"{"&ANSI_14&$switchboard~bot_name&ANSI_9&"} "&ANSI_15
if ($switchboard~message <> "")

  if ($switchboard~self_command > 0)
    setvar $switchboard~length 0
  else
    getlength $switchboard~bot_name $switchboard~length
  end
  setvar $switchboard~i 1
  setvar $switchboard~spacing ""
  getwordpos " "&$bot~user_command_line&" " $switchboard~isbroadcast " ss "
  getwordpos " "&$bot~user_command_line&" " $switchboard~issilent " silent "

  if ($switchboard~self_command <> 0)

    if (($bot~command <> "help") and ($bot~only_help <> TRUE))
      if ($switchboard~self_command > 1) or (($switchboard~self_command = 1) and (($bot~silent_running <> TRUE) and ($switchboard~issilent <= 0)))
        gosub :STRIPANSI
        if ($switchboard~helplist <> TRUE)
        end
      end
    end

    while ($switchboard~i <= $switchboard~length)
      setvar $switchboard~spacing $switchboard~spacing&" "
      add $switchboard~i 1
    end
    setvar $switchboard~new_message ""
    setvar $switchboard~message_line ""
    gosub :FORMAT_RAW_MESSAGE
  else
    gosub :FORMAT_RAW_MESSAGE
  end

  getwordpos " "&$switchboard~new_message&" " $switchboard~pos "*"
  getlength $switchboard~new_message $switchboard~length
  if ($switchboard~nodiscord)
    setvar $switchboard~new_message $switchboard~discord_ignore&$switchboard~new_message
    add $switchboard~length $switchboard~discord_ignore_length
  end

  if ($switchboard~self_command > 1)
    setvar $switchboard~self_command FALSE
  end
  if ($switchboard~pos < $switchboard~length)
    setvar $switchboard~multiple_lines TRUE
  else
    setvar $switchboard~multiple_lines FALSE
  end


  if ($switchboard~issilent > 0) or (($bot~silent_running = TRUE) and ($switchboard~self_command = TRUE)) or (((($switchboard~self_command = TRUE) and (($bot~command = "help") or ($bot~only_help = TRUE)))) and ($switchboard~isbroadcast <= 0))
    if ($bot~botisdeaf <> TRUE)
      echo "*"&$switchboard~msg_header_echo&$switchboard~new_message
      send #145
    else
      setvar $switchboard~window_content $switchboard~new_message
      replacetext $switchboard~window_content "*" "[][]"
      savevar $switchboard~window_content
    end
  elseif ($switchboard~multiple_lines = FALSE)
    setvar $switchboard~message $switchboard~new_message
    gosub :STRIPANSI
    send $switchboard~msg_header_ss_1&$switchboard~message
  else
    setvar $switchboard~message $switchboard~new_message
    gosub :STRIPANSI
    getlength $switchboard~message $switchboard~trim_length
    setvar $switchboard~trimming TRUE
    while (($switchboard~trim_length > 0) and ($switchboard~trimming = TRUE))
      cuttext $switchboard~message $switchboard~trim_char $switchboard~trim_length 1
      if ($switchboard~trim_char = " ")
        cuttext $switchboard~message $switchboard~message 1 ($switchboard~trim_length - 1)
        subtract $switchboard~trim_length 1
      else
        setvar $switchboard~trimming FALSE
      end
    end
    setdelaytrigger SWITCHBOARD_SS_DELAY :SS_DONE 2000
    settextlinetrigger SWITCHBOARD_SS_OPEN :SS_DONE "Comm-link open on sub-space band"
    settextlinetrigger SWITCHBOARD_SS_SENT :SS_DONE "Message sent on sub-space channel"
    send $switchboard~msg_header_ss_2&$switchboard~message&"*"
    pause
    :switchboard~ss_done
    killtrigger SWITCHBOARD_SS_DELAY
    killtrigger SWITCHBOARD_SS_OPEN
    killtrigger SWITCHBOARD_SS_SENT
  end
  setvar $switchboard~message ""
end
setvar $switchboard~helplist FALSE
return
:switchboard~format_raw_message




getwordpos " "&$switchboard~message&" " $switchboard~pos "*"

getlength $switchboard~message $switchboard~message_length

if ($switchboard~pos < $switchboard~message_length)
  setvar $switchboard~multiple_lines TRUE
else
  setvar $switchboard~multiple_lines FALSE
end
if (($bot~command <> "help") and ($bot~only_help <> TRUE))
  if ($switchboard~self_command = 0) or ($switchboard~self_command > 1) or (($switchboard~self_command = 1) and (($bot~silent_running <> TRUE) and ($switchboard~issilent <= 0)))

    setvar $switchboard~next_length 65
    setvar $switchboard~i 1
    setvar $switchboard~length 1
    while ($switchboard~i <= $switchboard~message_length)
      cuttext $switchboard~message $switchboard~character $switchboard~i 1
      if (($switchboard~character = " ") and ($switchboard~length >= $switchboard~next_length)) or (($switchboard~character = "*") and ($switchboard~length > 1))
        if ($switchboard~i < $switchboard~message_length)
          cuttext $switchboard~message $switchboard~first_half 1 ($switchboard~i - 1)
          cuttext $switchboard~message $switchboard~second_half ($switchboard~i + 1) 999999999

          if ($switchboard~nodiscord)
            setvar $switchboard~first_half $switchboard~first_half&"*"&$switchboard~discord_ignore
            add $switchboard~i $switchboard~discord_ignore_length
            add $switchboard~message_length $switchboard~discord_ignore_length
          else
            setvar $switchboard~first_half $switchboard~first_half&"* "
            add $switchboard~i 1
            add $switchboard~message_length 1
          end
          setvar $switchboard~message $switchboard~first_half&$switchboard~second_half
          setvar $switchboard~length 0
        end
      end
      add $switchboard~length 1
      add $switchboard~i 1
    end
  end
end
setvar $switchboard~new_message $switchboard~message
return
:switchboard~stripansi

striptext $switchboard~message ANSI_1
striptext $switchboard~message ANSI_2
striptext $switchboard~message ANSI_3
striptext $switchboard~message ANSI_4
striptext $switchboard~message ANSI_5
striptext $switchboard~message ANSI_6
striptext $switchboard~message ANSI_7
striptext $switchboard~message ANSI_8
striptext $switchboard~message ANSI_9
striptext $switchboard~message ANSI_10
striptext $switchboard~message ANSI_11
striptext $switchboard~message ANSI_12
striptext $switchboard~message ANSI_13
striptext $switchboard~message ANSI_14
striptext $switchboard~message ANSI_15
return
