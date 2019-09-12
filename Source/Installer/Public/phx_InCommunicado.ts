# InCommunicado by phx, check version number 2 lines down.
systemscript
setvar $ver "2.0"

# -initial setup---------------------------------------------------------------
setvar $fedfile gamename & "_FedLog.txt"
setvar $subfile gamename & "_SubLog.txt"
setvar $pvtfile gamename & "_PvtLog.txt"
setvar $comfile gamename & "_ComLog.txt"
setvar $savefile gamename & "_ComPrefs.txt"
fileexists $exist $savefile
if ($exist)
    read $savefile $fed 1
    read $savefile $sub 2
    read $savefile $pvt 3
    read $savefile $com 4
else
    setvar $fed "On"
    setvar $sub "On"
    setvar $pvt "On"
    setvar $com "On"
end
setvar $line ""
setvar $line0 "To go back further, check log files in TWX folder, or type 'coms-?' on Sub-space"
:name_setup
    setvar $myname loginname
    cuttext $myname $myname 1 6
    getlength $myname $length
    if ($length = 1)
        setvar $myname $myname & "     "
    elseif ($length = 2)
        setvar $myname $myname & "    "
    elseif ($length = 3)
        setvar $myname $myname & "   "
    elseif ($length = 4)
        setvar $myname $myname & "  "
    elseif ($length = 5)
        setvar $myname $myname & " "
    end
    setvar $myname $myname & " "
window com 650 106 "InCommunicado " & $ver & " - " & GAMENAME & " - All Communications"
goto :window_update

# -communications triggers-----------------------------------------------------
:triggers
    gosub :save_prefs
    if ($fed = "On")
        settextlinetrigger F1 :capture "F "
        settextlinetrigger F2 :capture "F: "
        settextlinetrigger F3 :capture "`"
    end
    if ($sub = "On")
        settextlinetrigger S1 :capture "R "
        settextlinetrigger S2 :capture "S: "
    end
    settextlinetrigger S3 :capture "'"
    if ($pvt = "On")
        settextlinetrigger P1 :capture "P "
        settextlinetrigger P2 :capture "P: "
    end
    pause

# -capturing communications----------------------------------------------------
:capture
    gosub :killem
    setvar $line currentline

# strip out backspaces and the characters they deleted-------------------------
    getlength $line $length
    while ($length > 0)
        getwordpos $line $pos #8
        if ($pos = 0) or ($pos = "")
            goto :check_line
        end
        setvar $pos ($pos - 1)
        cuttext $line $cut $pos 2
        striptext $line $cut
        subtract $length 1
    end

# -checking line, to much to explain quickly--------------------------------
:check_line
    if ($line = "")
        goto :triggers
    end
    cuttext $line $chk 1 1
    if ($chk <> "`") and ($chk <> "'")
        cuttext $line $chk 1 2
    end
    if ($chk <> "`") and ($chk <> "'") and ($chk <> "F ") and ($chk <> "F:") and ($chk <> "'") and ($chk <> "R ") and ($chk <> "S:") and ($chk <> "P ") and ($chk <> "P:")
        goto :triggers
    end
    if ($chk = "`") or ($chk = "F ") or ($chk = "F:")
        setvar $thisfile $fedfile
    elseif ($chk = "'") or ($chk = "R ") or ($chk = "S:")
        setvar $thisfile $subfile
    elseif ($chk = "P ") or ($chk = "P:")
        setvar $thisfile $pvtfile
    end
    if ($line = "P indicates Trader is on a planet in that sector")
        goto :triggers
    elseif ($line = "'coms-sub-off")
        setvar $sub "Off"
        goto :triggers
    elseif ($line = "'coms-sub-on")
        setvar $sub "On"
        goto :triggers
    elseif ($line = "'coms-fed-off")
        setvar $fed "Off"
        goto :triggers
    elseif ($line = "'coms-fed-on")
        setvar $fed "On"
        goto :triggers
    elseif ($line = "'coms-pvt-off")
        setvar $pvt "Off"
        goto :triggers
    elseif ($line = "'coms-pvt-on")
        setvar $pvt "On"
        goto :triggers
    elseif ($line = "'coms-com-on")
        setvar $com "On"
        goto :triggers
    elseif ($line = "'coms-com-off")
        setvar $com "Off"
        goto :triggers
    elseif ($line = "'coms-all-on")
        setvar $fed "On"
        setvar $sub "On"
        setvar $pvt "On"
        setvar $com "On"
        goto :triggers
    elseif ($line = "'coms-all-off")
        setvar $fed "Off"
        setvar $sub "Off"
        setvar $pvt "Off"
        setvar $com "Off"
        goto :triggers
    elseif ($line = "'coms-?")
        waitfor "Message sent on sub-space channel"
        echo ansi_6 "** Federation comm-link log: " ansi_14 $fedfile "   " $fed
        echo ansi_6 "* Sub-space radio log:      " ansi_14 $subfile "   " $sub
        echo ansi_6 "* Hailing frequencies log:  " ansi_14 $pvtfile "   " $pvt
        echo ansi_6 "* Combined log file:        " ansi_14 $comfile "   " $com
        echo ansi_6 "* Note: Turning logs off will also make them not shown in the window."
        echo ansi_6 "** COMMANDS:            " ansi_14 "XXX" ansi_6 " = fed, sub, pvt, com or all"
        echo ansi_14 "*     coms-XXX-on/off " ansi_4 "- " ansi_6 "Turn logging off and on."
        echo ansi_14 "*     coms-send-XXX " ansi_4 "- " ansi_6 "Send logged communications." ansi_4 " - " ansi_6 "Cannot use 'all'."
        echo ansi_14 "*     coms-del-XXX " ansi_4 "- " ansi_6 "Delete log file(s).*"
        goto :triggers
    elseif ($line = "'coms-del-fed") or ($line = "'coms-del-sub") or ($line = "'coms-del-pvt") or ($line = "'coms-del-com")
        delete $thisfile
        goto :triggers
    elseif ($line = "'coms-del-all")
        delete $fedfile
        delete $subfile
        delete $pvtfile
        delete $comfile
        goto :triggers
    elseif ($line = "'coms-send-fed") or ($line = "'coms-send-sub") or ($line = "'coms-send-pvt") or ($line = "'coms-send-com")
        waitfor "Message sent on sub-space channel"
        echo ansi_14 "** Send logs on " ansi_14 "F" ansi_6 "ed-comm or " ansi_14 "S" ansi_6 "ub-space or " ansi_14 "L" ansi_6 "ocal echo? "
        getconsoleinput $send singlekey
        uppercase $send
        if ($line = "'coms-send-fed")
            setvar $thisfile $fedfile
        elseif ($line = "'coms-send-pvt")
            setvar $thisfile $pvtfile
        elseif ($line = "'coms-send-com")
            setvar $thisfile $comfile
        end
        fileexists $exist $thisfile
        if ($exist = 0)
            echo ansi_12 "** That log file does not exist.*"
            goto :triggers
        end
        if ($send = "F")
            send "`*"
            setvar $i 1
            read $thisfile $line $i
            while ($line <> "EOF")
                send $line "*"
                add $i 1
                read $thisfile $line $i
            end
            send "*"
            waitfor "Federation comm-link terminated"
        elseif ($send = "S")
            send "'*"
            setvar $i 1
            read $thisfile $line $i
            while ($line <> "EOF")
                send $line "*"
                add $i 1
                read $thisfile $line $i
            end
            send "*"
            waitfor "Sub-space comm-link terminated"
        elseif ($send = "L")
            setvar $i 1
            read $thisfile $line $i
            echo "*"
            while ($line <> "EOF")
                echo ansi_6 "*" $line
                add $i 1
                read $thisfile $line $i
            end
            echo "*"
        end
        goto :triggers
    end
    
# add my name to the line------------------------------------------------------
    if ($chk = "`") or ($chk = "F:")
        setvar $replace "F " & $myname
        replacetext $line "`" $replace
        replacetext $line "F: " $replace
        setvar $chk "F "
        goto :window_update
    elseif ($chk = "'") or ($chk = "S:")
        setvar $replace "R " & $myname
        replacetext $line "'" $replace
        replacetext $line "S: " $replace
        setvar $chk "R "
        goto :window_update
    elseif ($chk = "P:")
        setvar $replace "P " & $myname
        replacetext $line "P:" $replace
    end

# -updating window-------------------------------------------------------------
:window_update
    if ($thisfile = $subfile) and ($sub = "Off")
        goto :triggers
    end
    if ($line = $replace)
        goto :triggers
    end
    setvar $line9 $line8
    if ($line9 = 0)
        setvar $line9 ""
    end
    setvar $line8 $line7
    if ($line8 = 0)
        setvar $line8 ""
    end
    setvar $line7 $line6
    if ($line7 = 0)
        setvar $line7 ""
    end
    setvar $line6 $line5
    if ($line6 = 0)
        setvar $line6 ""
    end
    setvar $line5 $line4
    if ($line5 = 0)
        setvar $line5 ""
    end
    setvar $line4 $line3
    if ($line4 = 0)
        setvar $line4 "                   Send 'coms-?' on Sub-space for help."
    end
    setvar $line3 $line2
    if ($line3 = 0)
        setvar $line3 ""
    end
    setvar $line2 $line1
    if ($line2 = 0)
        setvar $line2 "                     Thanks for trying p][x scripts."
    end
    setvar $line1 $line
    if ($line1 = 0)
        setvar $line1 ""
    end
    setvar $contents $line1 & "*" & $line2 & "*" & $line3 & "*" & $line4 & "*" & $line5 & "*" & $line6 & "*" & $line7 & "*" & $line8 & "*" & $line9 & "*" & $line0 & "*"
    setwindowcontents com $contents

# -writing log file(s)---------------------------------------------------------
:log_update
    setvar $line date & " " & time & " " & $line
    if ($com = "On")
        write $comfile $line
    end
    striptext $line "R "
    striptext $line "F "
    striptext $line "P "
    write $thisfile $line

goto :triggers

# -saving preferences file-----------------------------------------------------
:save_prefs
    delete $savefile
    write $savefile $fed
    write $savefile $sub
    write $savefile $pvt
    write $savefile $com
return

# -killing all triggers--------------------------------------------------------
:killem
    killtrigger F1
    killtrigger F2
    killtrigger F3
    killtrigger S1
    killtrigger S2
    killtrigger S3
    killtrigger P1
    killtrigger P2
return



