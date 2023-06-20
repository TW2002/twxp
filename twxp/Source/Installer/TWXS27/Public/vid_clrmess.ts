setvar $script " -=-=-=- Vid's Clear Messages v.1 -=-=-=- "
:do
send "*"
waitfor "elp)"
cutText CURRENTLINE $location 1 7
    if ($location <> "Citadel") and ($location <> "Command")
        echo ansi_10 "**Must start at Citadel or Command Prompt to work**"
        echo ansi_4 "YOU are @ the " $location "Prompt! *" ansi_0
        halt
    end
if ($location = "Command") or ($location = "Citadel")
setDelayTrigger delay :Pause 800
send "cma**q:"
end
pause

:Pause
waitfor "Del"
killalltriggers
getWord CURRENTLINE $temp 1
if ($temp = "Delete")
        send "Y"
waitfor "Deleted"
getword currentline $first 2
getword currentline $second 4
send "'*" $script "*Deleted " $first " of " $second " Messages!**"
end
sound "ding.wav"
halt
