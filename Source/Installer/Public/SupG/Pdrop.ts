# Pdrop Script
# Drops a planet on someone stupid enough to hit one of your figs
# Start Script from citadel of the planet you wanna use.

# now we wait
:wait
killtrigger limpettrip
killtrigger trip
killtrigger keepalive
setTextLineTrigger trip :launch "Deployed Fighters Report Sector"
setTextLineTrigger keepalive :keepalive "INACTIVITY WARNING:"
pause

:launch
setVar $line CURRENTLINE
getWord $line $sectorNum 5
getWord CURRENTLINE $fed 1
  if ($fed <> "Deployed")
	goto :wait
  end  
stripText $sectorNum ":"
isNumber $result $sectorNum
if ($result = "FALSE")
	goto :wait
end
goto :warp



:warp
# place reaction commands here
setTextLineTrigger jump_success :jump_success "Planet is now in sector"
setTextLineTrigger bjump :no_jump "You cannot"
send "p" $sectorNum "*y"
pause

:no_jump
killtrigger jump_success
goto :wait
halt

#prevent from timeout
:keepalive
  send "#"
  goto :wait

:jump_success
killtrigger bjump
#send "QQ"
sound message.wav
halt