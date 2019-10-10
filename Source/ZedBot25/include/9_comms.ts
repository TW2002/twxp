#Parrothead Comms Controler Include
#=-=-=-=-=-=--=
:off
killalltriggers
setdelaytrigger 3off :offcomms 3000
setTexttrigger 1off :1off "Displaying all messages"
setTexttrigger 2off :2off "Silencing all messages"
send "|"
pause
:offcomms
killtrigger 3off
killTrigger 1off
killTrigger 2off
goto :off
:1off
killtrigger 3off
killTrigger 1off
killTrigger 2off
send "|"
:2off
killtrigger 3off
killTrigger 1off
killTrigger 2off
echo ANSI_3 "<<<" & ANSI_12 "Comm's Off" & ANSI_3 ">>>" ANSI_0
return
#=-=-=-=-=-=--=
:on
killalltriggers
setdelaytrigger 2on :oncomms 3000
setTexttrigger 3on :3on "Displaying all messages"
setTexttrigger 4on :4on "Silencing all messages"
send "|"
pause
:oncomms
killtrigger 2on
killTrigger 3on
killTrigger 4on
goto :on
:4on
killtrigger 2on
killTrigger 3on
killTrigger 4on
send "|"
:3on
killtrigger 2on
killTrigger 3on
killTrigger 4on
echo ANSI_3 "<<<" & ANSI_15 "Comm's On" & ANSI_3 ">>>" ANSI_0
return