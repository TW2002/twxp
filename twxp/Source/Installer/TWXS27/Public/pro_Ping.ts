# proPing.ts  by Promethius
# Released:   January 2007

setVar $counter 0
setVar $average 0
setVar $min 999999
setVar $max 0
setVar $file "n"
setVar $version "v1.75"
setVar $pingType "s"
setVar $mode "Normal"

setDelayTrigger bot :bot 5000
setTextOutTrigger humanYes :humanYes "y"
setTextOutTrigger humanNo :humanNo "n"
echo ANSI_12 "*Save to file? y/n"
echo ANSI_12 "*5 seconds to run default, no file*"
# getConsoleInput $file singlekey
pause
:humanYes
  killalltriggers
  setVar $file "y"
  echo ANSI_14 "**Format output for color on ClassicTW?*"
  getConsoleInput $formatClassic singleKey
  echo ANSI_14 "**Ping at Standard or Max Ping (50) count?  s/m"
  getConsoleInput $pingType
  lowerCase $pingType
  if ($pingType = "m")
     setVar $mode "Max Server Test"
  end
  goto :doneSetup
:humanNo
:bot
:doneSetup
killalltriggers

# turn off all messages
send "|"
# check to see if we are at a SS friendly prompt
# and possibly if the game has Interactive Sub Prompts off
send "'*"
setDelayTrigger noSS :noSS 3000
setTextTrigger begin :getStartTimeDate "Type sub-space message"
pause
:noSS
echo ANSI_12 "**You appear to be at a non-friendly prompt for SS messages.*"
echo ANSI_12 "*This could be that Interactive Sub-Prompt is off (bad, bad sysOp)*"
echo ANSI_12 "*or lag is more than 3 seconds (nightmare!!)*"
echo ANSI_11 "*Try this script from the sector Command or Citadel prompts*"
halt
# we are good to go - send first SS message and get start time
:getStartTimeDate
 killalltriggers
 getTime $dataRan "mm/dd/yy @ h:mm:ss am/pm"
 uppercase $dataRan
 send " *"
 send "--------------------------------*"
 send "ProPing " $version "*"
 send "Mode: " $mode "*"
 waitfor "ProPing"
 send "Game: " gameName "*"
 send "Ran on:  " $dataRan "*"
 if ($file = "y")
    send "File name: ProPing" & gamename & ".txt*"
 end
 send "--------------------------------*"
 waitfor "--------------------------------"
 if ($file = "y")
    if ($formatClassic = "y")
       write "ProPing" & gamename & ".txt" "[pre]"
       write "ProPing" & gamename & ".txt" "[color=white]--------------------------------[/color]"
       write "ProPing" & gamename & ".txt" "[color=red]ProPing " & $version & "[/color]"
       write "ProPing" & gamename & ".txt" "[color=blue]Mode: [/color][color=cyan]" & $mode & "[/color]"
       write "ProPing" & gamename & ".txt" "[color=blue]Game: [/color][color=cyan]" & gameName & "[/color]"
       write "ProPing" & gamename & ".txt" "[color=blue]Ran on:  [/color][color=green]" & $dataRan & "[/color]"
       write "ProPing" & gamename & ".txt" "[color=white]--------------------------------[/color]"
    else
       write "ProPing" & gamename & ".txt" " "
       write "ProPing" & gamename & ".txt" "--------------------------------"
       write "ProPing" & gamename & ".txt" "ProPing " & $version
       write "ProPing" & gamename & ".txt" "Game: " & gameName
       write "ProPing" & gamename & ".txt" "Ran on:  " & $dataRan
       write "ProPing" & gamename & ".txt" "--------------------------------"
    end
 end
:begin
  killalltriggers
  setTextTrigger ping :msCheck "S: ping"
  gettime  $msStart "h:m:s:zzz"
  replaceText $msStart ":" " "
  getword $msStart $ms1 4
  getword $msStart $ss1 3
  send "ping :"
  pause

# ping sent and echoed back, now to set the end time
:msCheck
  gettime  $msEnd "h:m:s:zzz"
  replaceText $msEnd ":" " "
  getWord $msEnd $ms2 4
  getword $msEnd $ss2 3
  if ($ss2 < $ss1)
     add $ss2 60
  end
  subtract $ss2 $ss1
  if ($ss2 > 0)
      multiply $ss2 1000
      add $ms2 $ss2
  end
  setVar $ms ($ms2 - $ms1)
  if ($ms < $min)
     setVar $min $ms
  end
  if ($ms > $max)
     setVar $max $ms
  end
:ping
  getLength $ms $len
  setVar $pad ""
  while ($len < 5)
     setVar $pad $pad & " "
     add $len 1
  end
  # adding delay to work with the TWGS synch delay
  setDelayTrigger v2Delay :v2Delay 510
  pause
  :v2Delay
  send " " $ms $pad "ms*"
  if ($file = "y")
     if ($formatClassic = "y")
        gosub :colorKey
        write "ProPing" & gamename & ".txt" "[color=blue]ping : [/color]" & $colorkey & $ms & $pad & "[/color][color=blue]ms[/color]"
     else
        write "ProPing" & gamename & ".txt" "ping : " & $ms & $pad & "ms"
     end
  end

  add $average $ms
  # yes, this delay seems to be necessary, might be able to lower it to 100
  setdelaytrigger pingDelay :pingDelay 200
  pause
 :pingDelay
  add $counter 1
  if ($counter = 10) and ($pingType = "s")
     goto :done
  elseif ($counter = 50)
     goto :done
  end
  goto :begin
  # done with getting data, now to display
  :done
    setVar $hilow $average
    subtract $hilow $max
    subtract $hilow $min

    if ($pingType = "s")
       divide $average 10
       divide $hilow 8
    else
      divide $average 50
      divide $hilow 48
    end
    gosub :comment
    send "--------------------------------*"
    send "Min: " $min "  Max: " $max "  Average: " $average "*"
    send "High/Low  Removed   Average: " $hiLow "*"
    setVar $consistent ($max - $min)
    gosub :lag
    send "Min:Max Split: " $consistent "  *"
    send "--------------------------------*"
    send $lagMsg
    send "--------------------------------*"
    send $comment "*"
    send "--------------------------------*"
    send "*"
  # write final eval to file if desired
    if ($file = "y")
       if ($formatClassic = "y")
          write "ProPing" & gamename & ".txt" "[color=white]--------------------------------[/color]"
          write "ProPing" & gamename & ".txt" "[color=blue]Min: [/color][color=yellow]" & $min & "[/color][color=blue]  Max: [/color][color=yellow]" & $max & "[/color][color=blue]  Average: [/color][color=yellow]" & $average & "[/color]"
          write "ProPing" & gamename & ".txt" "[color=blue]High/Low  Removed   Average: [/color][color=yellow]" & $hiLow  & "[/color]"
          write "ProPing" & gamename & ".txt" "[color=blue]Min:Max Split: [/color][color=yellow]" & $consistent & "  [/color]"
          write "ProPing" & gamename & ".txt" "[color=white]--------------------------------[/color]"
          write "ProPing" & gamename & ".txt" "[color=yellow]" & $lagMsg & "[/color]"
          write "ProPing" & gamename & ".txt" "[color=white]--------------------------------[/color]"
          write "ProPing" & gamename & ".txt" "[color=yellow]" & $comment & "[/color]"
          write "ProPing" & gamename & ".txt" "[color=white]--------------------------------[/color]"
          write "ProPing" & gamename & ".txt" "[/pre]"
       else
          write "ProPing" & gamename & ".txt" "--------------------------------"
          write "ProPing" & gamename & ".txt" "Min: " & $min & "Max: " & $max & "  Average: " & $average
          write "ProPing" & gamename & ".txt" "High/Low  Removed   Average: " & $hiLow
          write "ProPing" & gamename & ".txt" "Min:Max Split: " & $consistent
          write "ProPing" & gamename & ".txt" "--------------------------------"
          write "ProPing" & gamename & ".txt" $lagMsg
          write "ProPing" & gamename & ".txt" "--------------------------------"
          write "ProPing" & gamename & ".txt" $comment
          write "ProPing" & gamename & ".txt" "--------------------------------"
       end
    end
    setTextTrigger SSDone :waitforPrompt "Sub-space comm"
    setDelayTrigger fubar :waitforPrompt 2000
    pause
    :waitforPrompt
    killalltriggers
    send "|"
    halt

# ----- goSubs -----

:lag
  # lag message based on min / max ping split
  if ($consistent >= 250)
     setVar $lagMsg "Extreme Lag Detected*"
  elseif ($consistent >= 150) and ($consistent < 250)
     setVar $lagMsg "Moderate Lag Detected*"
  elseif ($consistent >= 75) and ($consistent < 150)
     setVar $lagMsg "Mild Lag Detected*"
  elseif ($consistent >= 25) and ($consistent < 75)
     setVar $lagMsg "Minimal Lag Detected*"
  elseif ($consistent < 25)
     setVar $lagMsg "!!! No Lag Detected !!!*"
  end
  return

# add a few comments for the hell of it
:comment
  getRnd $rnd 1 2
  if ($average <= 150)
     setVar $comment "Muhahahaha, bring it!!"
  end
  if ($average > 150) and ($average <= 200)
     if ($rnd = 1)
        setVar $comment "Someone is gonna get podded!"
     else
        setVar $comment "Patience Hell! Time to SD someone!"
     end
  end
  if ($average > 200) and ($average <= 250)
     setVar $comment "Living on the edge"
  end
  if ($average > 250) and ($average <= 300)
     if ($rnd = 1)
        setVar $comment "Gridding, not a job, an adventure!"
     else
        setVar $comment "Damn, I hope someone is runnning saveMe!"
     end
  end
  if ($average > 300)
     if ($rnd = 1)
        setVar $comment "What the Hell am I doing here?"
     else
        setVar $comment "Just here to attack aliens :("
     end
  end
  return
  
  
:colorKey
  if ($ms <= 175)
      setVar $colorKey "[color=white]"
  elseif ($ms > 175) and ($ms < 200)
      setVar $colorKey "[color=cyan]"
  elseif ($ms >= 200) and ($ms <= 250)
     setVar $colorKey "[color=yellow]"
  elseif ($ms > 250)
     setVar $colorKey "[color=red]"
  end
return