#:9_waittrigger~waittrigger
:waittrigger
killtrigger subspace0
killtrigger subspace1
killtrigger subspace2
settextlinetrigger subspace0 :subspace "Sub-space comm-link terminated"
settexttrigger subspace1 :subspace "sent on sub-space channel"
settexttrigger subspace3 :subspace "Message sent on Federation comm-link"
settexttrigger subspace4 :subspace "Federation comm-link terminated."
setdelaytrigger subspace2 :timeout 10000
pause
:subspace
killtrigger subspace0
killtrigger subspace1
killtrigger subspace2
killtrigger subspace3
killtrigger subspace4
return

#:9_waittrigger~timeout
:timeout
killalltriggers
send "s0*0*0*0*c* q q q q zn r* r* * * *q q q q q zn zn r* * * *"
openmenu TWX_STOPALL FALSE
send "'*Operation Timed Out ERROR!! Stopping scripts!**"
setdelaytrigger waitall :killme 15000
waiton "Sub-space comm-link terminated"
killalltriggers
return

#:9_waittrigger~commandwait
:commandwait
settexttrigger ca :ct1 "Command"
setdelaytrigger caw :timeout 3000
send #145
pause
:ct1
killtrigger ca
killtrigger caw
return

#:9_waittrigger~cmorcitwait
:cmorcitwait
killtrigger cb
killtrigger cb0
killtrigger cbw
settexttrigger cb :cb1 "Command"
settexttrigger cb0 :cb1 "Citadel command"
setdelaytrigger cbw :timeout 3000
send #145
pause
:cb1
killtrigger cb
killtrigger cb0
killtrigger cbw
return

#:9_waittrigger~pwait
:pwait
killtrigger pwaiting
killtrigger pwaiting0
setdelaytrigger pwaiting :timeout 10000
settexttrigger pwaiting0 :pwaiting #145 & #8
send #145
pause
:pwaiting
killtrigger pwaiting
killtrigger pwaiting0
return

#:9_waittrigger~inter
:inter
killtrigger pwaiting
killtrigger pwaiting0
setdelaytrigger pwaiting :timeout 10000
settexttrigger pwaiting0 :pwaiting "ENDINTERROG"
send "q"
pause
:pwaiting
killtrigger pwaiting
killtrigger pwaiting0
return

#:9_waittrigger~cwait
:cwait
killtrigger cwaiting
setdelaytrigger cwaiting :timeout 10000
waitfor "Citadel treasury"
waitfor "Citadel command"
:pwaiting
killtrigger cwaiting
return

:killme
halt

