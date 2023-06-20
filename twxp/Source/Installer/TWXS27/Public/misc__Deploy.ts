
cutText CURRENTLINE $prompt 1 7
if ($prompt <> "Citadel") and ($prompt <> "Planet ")
        echo "**" ansi_15 "Please start from either the citadel or planet prompt*"
        halt
end

# Deployment amount hardcoded for quick load up
setVar $limpet 1
setVar $armid 1

setVar $message ""

if ($prompt = "Citadel")
        send "q"
end
send "d"
setTextLineTrigger pnum :pnum "Planet #"
pause

:pnum
getText CURRENTLINE $pnum "Planet #" " in"

send "qh 1 z " $armid " * z c * h 2 z " $limpet " * z c * l " $pnum "* "

setVar $index 0
:loop
if ($index < 2)
        add $index 1
        waitOn "Should these be"
        setTextLineTrigger deployed :deployed "Done. You have " 
        setTextTrigger failed :failed "Command [TL="
        pause

        :deployed
        killTrigger failed
        if ($index = 1)
                setVar $message $message & "'Armid mine(s) deployed*"
        else
                setVar $message $message & "'Limpet mine(s) deployed*"       
        end  
        goto :loop
           
        :failed
        killTrigger deployed
        if ($index = 1)
                setVar $message $message & "'Armid mine(s) failed to deploy*"
        else
                setVar $message $message & "'Limpet mine(s) failed to deploy*"       
        end  
        goto :loop
end

if ($prompt = "Citadel")
        send "c "
end 
send $message
halt
