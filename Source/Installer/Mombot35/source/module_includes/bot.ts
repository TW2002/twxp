
:checkStartingPrompt
    if ($PLAYER~CURRENT_PROMPT = "0")
        gosub  :player~currentPrompt
    end
    getWordPos " "&$validPrompts&" " $pos $PLAYER~CURRENT_PROMPT
    if ($pos <= 0)
        setVar $SWITCHBOARD~message "Invalid starting prompt: ["&$PLAYER~CURRENT_PROMPT&"]. Valid prompt(s) for this command: ["&$validPrompts&"]*"
        gosub :SWITCHBOARD~switchboard
        halt
    end
return

:loadVars
    loadVar $mode
    loadVar $command 
    loadVar $SWITCHBOARD~bot_name
    setVar  $bot_name $SWITCHBOARD~bot_name
    loadvar $planet~planet_file
    loadvar $ship~cap_file
    loadVar $user_command_line 
    loadVar $parm1
    loadVar $parm2
    loadVar $parm3
    loadVar $parm4
    loadVar $parm5
    loadVar $parm6
    loadVar $parm7
    loadVar $parm8
    loadVar $bot_turn_limit
    loadVar $PLAYER~unlimitedGame
    loadVar $MAP~stardock
    loadVar $MAP~rylos
    loadVar $MAP~alpha_centauri
    loadvar $MAP~home_sector
    loadvar $MAP~backdoor
    loadVar $silent_running
    loadVar $botIsDeaf
    loadvar $switchboard~self_command
    loadvar $planet~planet
    loadVar $password
    loadvar $letter
    loadVar $game~port_max
	loadVar $folder
	loadVar $game~photon_duration




    setArray $help 60
    setVar $help 60
    setVar $TAB "     "

return

:help_file
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



:banner
    setVar $SWITCHBOARD~message $script_title&" starting up!*"
    gosub :SWITCHBOARD~switchboard
return

:disconnect_triggers
    setTextTrigger      pause   :pausing        "Planet command (?="
    setTextTrigger      pause2  :pausing        "Computer command ["
    setTextTrigger      pause3  :pausing        "Corporate command ["
return

:pausing
    killAllTriggers
    echo ANSI_14 "*[["&ANSI_15&$script_title&" paused. To restart, re-enter citadel prompt"&ANSI_14&"]]*"&ANSI_7
    setTextTrigger restart :restarting "Citadel command ("
    pause
    :restarting
    killAllTriggers
    echo ANSI_14 "*[[" ANSI_15 "Alien Hunter restarted" ANSI_14 "]]*" ANSI_7
    goto :restart



:menu

addMenu "" "ScriptMenu" ANSI_6&"["&ANSI_14&"Settings"&ANSI_6&"]"&ANSI_7 "." "" "Main" FALSE
setvar $i 1
while ($i <= $menu)
    if (($menu[$i] <> "0") and ($menu[$i] <> ""))
        setvar $display_menu $menu[$i]
        replacetext $menu[$i] " " "_"
        addMenu "ScriptMenu" $menu[$i]        ANSI_6&"["&ANSI_15&$display_menu&ANSI_6&"]                                 "&ANSI_7 "A" :menu_set         "" FALSE
        setMenuHelp $menu[$i] $menu[$i][1]
    end
    add $i 1
end
openMenu "ScriptMenu"

:formathelpline

    replaceText $line "[" ansi_2&"["&ansi_6
    replaceText $line "]" ansi_2&"]"&ansi_13
    replaceText $line "-" ansi_7&"-"&ansi_13
    replaceText $line "<<<<" ansi_14&"<"&ansi_7&"<"&ansi_14&"<"&ansi_7&"<"&ansi_15
    replaceText $line ">>>>" ansi_7&">"&ansi_14&">"&ansi_7&">"&ansi_14&">"
    replaceText $line "{" ansi_2&"{"&ansi_6
    replaceText $line "}" ansi_2&"}"&ansi_13
    replaceText $line "Options:" ansi_6&"Options"&ansi_2&":"&ansi_13
    setvar $line ansi_13&$line&ansi_15

return


:menu_set
    pause
    openMenu "Menu"

return

:commas
	if ($value < 1000)
		#do nothing
	elseif ($value < 1000000)
		getLength $value $len
		setVar $len ($len - 3)
		cutText $value $tmp 1 $len
		cutText $value $tmp1 ($len + 1) 999
		setVar $tmp $tmp & "," & $tmp1
		setVar $value $tmp
	elseif ($value <= 999999999)
		getLength $value $len
		setVar $len ($len - 6)
		cutText $value $tmp 1 $len
		setVar $tmp $tmp & ","
		cutText $value $tmp1 ($len + 1) 3
		setVar $tmp $tmp & $tmp1 & ","
		cutText $value $tmp1 ($len + 4) 999
		setVar $tmp $tmp & $tmp1
		setVar $value $tmp
	end
return

:removeFigFromData
    getSectorParameter $target "FIGSEC" $check
    if ($check = TRUE)
        getSectorParameter 2 "FIG_COUNT" $figCount
        setSectorParameter 2 "FIG_COUNT" ($figCount-1)
    end
    setSectorParameter $target "FIGSEC" FALSE
return
:addFigToData
    setSectorParameter $target "FIGSEC" TRUE
return


