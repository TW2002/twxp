
# -read macro file if it exists and set up variables---------------------------
setvar $file gamename & "_Macros.txt"
    fileexists $exist $file
    if ($exist)
        read $file $macro 1
        read $file $macro1 2
        read $file $macro2 3
        read $file $macro3 4
        read $file $macro4 5
        read $file $macro5 6
        read $file $loops 7
    else
        setvar $macro "'p][x scripts @ http://www.grimytrader.com/" & #42
        setvar $macro1 ""
        setvar $macro2 ""
        setvar $macro3 ""
        setvar $macro4 ""
        setvar $macro5 ""
        setvar $loops 1
    end
    setvar $final ""
    setvar $trigger "None"
    setvar $text ""
    setvar $launch ""


# -p][x logo-------------------------------------------------------------------
:logo
    echo "**************************************************"
    echo ANSI_14 "**                            .\\            //."
    echo ANSI_14 "*                          . \ \          / /."
    echo ANSI_14 "*                          .\  ,\    /|_ /,.-"
    echo ANSI_14 "*                           -.   \  <^//  ."
    echo ANSI_14 "*                           ` -   `-'  \  -"
    echo ANSI_14 "*                             '.       /.\`"
    echo ANSI_14 "*                                -    .-"
    echo ANSI_14 "*                                :`//.'"
    echo ANSI_12 "*                       /(        " ANSI_14 ".`.'"
    echo ANSI_12 "*                      (((       " ANSI_14 ".' " ANSI_12 " /   /"
    echo ANSI_12 "*                     (()))    (    ((  ((    \"
    echo ANSI_12 "*                     (((())   ))  (()) \ \   ))"
    echo ANSI_12 "*                     (()) " ANSI_14 "p][x scripts" ANSI_12 " ))(( ((**"

# -menu------------------------------------------------------------------------
:menu
    gosub :title
    echo ansi_14 "* N" ansi_6 "ew" ansi_4 " - " ansi_14 "O" ansi_6 "pen" ansi_4 " - " ansi_14 "R" ansi_6 "ecord" ansi_4 " - " ansi_14 "S" ansi_6 "ave" ansi_4 " - " ansi_14 "D" ansi_6 "elete" ansi_4 " - " ansi_14 "? " ansi_6 "Help" ansi_4 " - " ansi_14 "+ " ansi_6 "Start" ansi_4 " - " ansi_14 "- " ansi_6 "Quit "
    echo ansi_6 "* Current macro  " ansi_4 "- " ansi_14 $macro
    echo ansi_14 "* T" ansi_6 "rigger type   " ansi_4 "- " ansi_14 $trigger
    if ($trigger = "Incoming Text") and ($launch <> "")
        echo ansi_4 " - " ansi_14 $launch
    end
    if ($trigger = "Incoming Text") and ($text <> "")
        echo ansi_6 "* Text trigger  " ansi_4 " - " ansi_6 #34 ansi_14 $text ansi_6 #34
    end
    echo ansi_14 "* L" ansi_6 "oops          " ansi_4 "- " ansi_14 $loops
    if ($launch <> "Repeat")
        echo ansi_14 "* F" ansi_6 "inal commands " ansi_4 "- " ansi_14 $final
    end
    echo "** "
    getconsoleinput $menu singlekey
    uppercase $menu

# -menu response---------------------------------------------------------------
:menuResponse
    if ($menu = "N")
        echo ansi_6 "** Current macro: " ansi_14 $macro
        echo ansi_6 "** Type new macro "
        getconsoleinput $macro
    elseif ($menu = "O")
        gosub :showMacros
        echo ansi_6 "** Open which macro? "
        getconsoleinput $var singlekey
        if ($var = 1)
            setvar $macro $macro1
        elseif ($var = 2)
            setvar $macro $macro2
        elseif ($var = 3)
            setvar $macro $macro3
        elseif ($var = 4)
            setvar $macro $macro4
        elseif ($var = 5)
            setvar $macro $macro5
        end
    elseif ($menu = "R")
        setvar $macro ""
        echo ansi_6 "* Recording your movements, press " ansi_14 "~" ansi_6 " to end recording*"
        :record
            settextouttrigger 1 :text
            pause
        :text
            getouttext $var
            if ($var = #126)
                goto :endResponse
            elseif ($var = #13)
                setvar $macro $macro & #42
                send "*"
            else
                send $var
                setvar $macro $macro & $var
            end
            goto :record
    elseif ($menu = "S")
        gosub :showMacros
        echo ansi_6 "** Save to what number? "
        getconsoleinput $var singlekey
        if ($var = 1)
            setvar $macro1 $macro
        elseif ($var = 2)
            setvar $macro2 $macro
        elseif ($var = 3)
            setvar $macro3 $macro
        elseif ($var = 4)
            setvar $macro4 $macro
        elseif ($var = 5)
            setvar $macro5 $macro
        end
    elseif ($menu = "D")
        gosub :showMacros
        echo ansi_6 "** Delete which macro? A=All "
        getconsoleinput $var singlekey
        uppercase $var
        if ($var = 1)
            setvar $macro1 ""
        elseif ($var = 2)
            setvar $macro2 ""
        elseif ($var = 3)
            setvar $macro3 ""
        elseif ($var = 4)
            setvar $macro4 ""
        elseif ($var = 5)
            setvar $macro5 ""
        elseif ($var = "A")
            setvar $macro1 ""
            setvar $macro2 ""
            setvar $macro3 ""
            setvar $macro4 ""
            setvar $macro5 ""
        end
    elseif ($menu = "T")
        echo "**************************************************"
        gosub :title
        echo ansi_14 "* 1 " ansi_6 "None"
        echo ansi_14 "* 2 " ansi_6 "Key Press"
        echo ansi_14 "* 3 " ansi_6 "Incoming Text** "
        getconsoleinput $var singlekey
        if ($var = 1) or ($var = "")
            setvar $trigger "None"
        elseif ($var = 2)
            setvar $trigger "Key Press"
        elseif ($var = 3)
            setvar $trigger "Incoming Text"
            echo ansi_6 "** Enter text trigger "
            getconsoleinput $text
        end
        if ($trigger = "Incoming Text")
            echo "**************************************************"
            gosub :title
            echo ansi_14 "* 1 " ansi_6 "Single launch"
            echo ansi_14 "* 2 " ansi_6 "Standby for repeat launches** "
            getconsoleinput $var singlekey
            if ($var = 1) or ($var = "")
                setvar $launch "Single"
            elseif ($var = 2)
                setvar $launch "Repeat"
            end
        end
    elseif ($menu = "L")
        echo ansi_6 "** Loop macro how many times? "
        getconsoleinput $loops
        isnumber $var $loops
        if ($var = 0)
            setvar $loops 1
        end
    elseif ($menu = "F")
        echo ansi_6 "** Type final commands "
        getconsoleinput $final
    elseif ($menu = "?")
        goto :help
    elseif ($menu = "-") or ($menu = "_")
        halt
    elseif ($menu = "+") or ($menu = "=")
        goto :start
    elseif ($menu = #126)
        echo ANSI_6 "*Script paused, press " ansi_14 "~" ansi_6 " to continue*"
        setvar $info ""
        :pause1
            settextouttrigger 1 :pause2 #126
            pause
            :pause2
                goto :menu
    elseif ($menu = #35)
        send "#"
    end
:endResponse
    replacetext $macro "^M" #42
    replacetext $macro "^m" #42
    replacetext $final "^M" #42
    replacetext $final "^m" #42
    replacetext $macro "~" #42
    replacetext $final "~" #42
    gosub :saveFile
    echo "**************************************************"
    goto :menu

# -script title----------------------------------------------------------------
:title
    echo ansi_12 "** (\)\/)(\)\/)(\)\/)(\)\/)^" ansi_14 "Macro Looper 3.0" ansi_12 "^(\/(/)(\/(/)(\/(/)(\/(/)*"
return

# -Show saved macros-----------------------------------------------------------
:showMacros
    echo ansi_6 "** 1 " ansi_14 $macro1
    echo ansi_6 "* 2 " ansi_14 $macro2
    echo ansi_6 "* 3 " ansi_14 $macro3
    echo ansi_6 "* 4 " ansi_14 $macro4
    echo ansi_6 "* 5 " ansi_14 $macro5
return

# -save file-------------------------------------------------------------------
:saveFile
    delete $file
    write $file $macro
    write $file $macro1
    write $file $macro2
    write $file $macro3
    write $file $macro4
    write $file $macro5
    write $file $loops
return

# -Help------------------------------------------------------------------------
:help
    echo "**************************************************"
    echo ansi_14 "*** Carriage Returns"
    echo ansi_6 "* Use " ansi_14 #42 ansi_6 ", " ansi_14 "^M" ansi_6 " or " ansi_14 "~" ansi_6 " when manually inputing macros." ansi_6 " All will be converted to " ansi_14 #42 ansi_6 "."
    echo ansi_14 "** Trigger Type"
    echo ansi_14 "* None " ansi_6 "means the macro loops will be performed as soon as you start the script."
    echo ansi_14 "* Key Press " ansi_6 "means the macro will re-launch eash time you type " ansi_14 "~" ansi_6 "."
    echo ansi_14 "* Incoming Text " ansi_6 "means the macro will launch when it recieves a specified line of" "*      text from the game. This could be used to have corp mates remotely start *      your macro."
    echo ansi_14 "* Single" ansi_6 "/" ansi_14 "Repeat " ansi_6 "is weather the script will run once or stand by to run multiple*      times."
    echo ansi_14 "** Final Commands"
    echo ansi_6 "* A set of commands to be performed when the macro loop is completed. Does not*      work in combination with the " ansi_14 "Repeat" ansi_6 " option."
    echo ansi_6 "** When using " ansi_14 "Key Press" ansi_6 " or " ansi_14 "Repeat" ansi_6 " options, you must manually stop the script to* shut it off."
    echo "**"
goto :menu

# -run the macro loop----------------------------------------------------------
:start
    setvar $loopsO $loops
    replacetext $macro #42 "*"
    replacetext $final #42 "*"
:trigger
    setvar $loops $loopsO
    if ($trigger = "Key Press")
        echo ANSI_6 "*Standing by, press " ansi_14 "~" ansi_6 " to proceed*"
        setvar $info ""
        :pause3
        settextouttrigger 1 :pause4 #126
        pause
        :pause4
            goto :loop
     elseif ($trigger = "Incoming Text")
         settexttrigger 1 :loop $text
         pause
     end
:loop
    while ($loops > 0)
        send $macro
        subtract $loops 1
    end
    if ($trigger = "Key Press") or (($trigger = "Incoming Text") and ($launch = "Repeat"))
        goto :trigger
    elseif ($final <> "")
        send $final
    end
    send "^q"
    waitfor ": ENDINTERROG"
    sound ding.wav











