gosub :targeting~initializetargeting 
 
window COMS 250 400 "Who's Playing?" ONTOP
setwindowcontents COMS "Starting up..*"

setVar $i 1
while ($i < $targeting~ranksLength)
	setVar $temp $targeting~ranks[$i]
	stripText $temp "31m"
    stripText $temp "36m"
	settextlinetrigger lookFor&$i :lookFor&$i $temp
	add $i 1
end
settextlinetrigger start_new :start_new "Who's Playing"
pause


:start_new
	killtrigger start_new
	getWordPos CURRENTANSILINE $pos "[1;44m"
	if ($pos > 0)
		setVar $window_contents "     Who's Playing     *#######################**"
	end
	settextlinetrigger start_new :start_new "Who's Playing"	
	pause

:lookFor1
	setVar $i 1
	goto :set_the_triggers
:lookFor2
	setVar $i 2
	goto :set_the_triggers
:lookFor3
	setVar $i 3
	goto :set_the_triggers
:lookFor4
	setVar $i 4
	goto :set_the_triggers
:lookFor5
	setVar $i 5
	goto :set_the_triggers
:lookFor6
	setVar $i 6
	goto :set_the_triggers
:lookFor7
	setVar $i 7
	goto :set_the_triggers
:lookFor8
	setVar $i 8
	goto :set_the_triggers
:lookFor9
	setVar $i 9
	goto :set_the_triggers
:lookFor10
	setVar $i 10
	goto :set_the_triggers
:lookFor11
	setVar $i 11
	goto :set_the_triggers
:lookFor12
	setVar $i 12
	goto :set_the_triggers
:lookFor13
	setVar $i 13
	goto :set_the_triggers
:lookFor14
	setVar $i 14
	goto :set_the_triggers
:lookFor15
	setVar $i 15
	goto :set_the_triggers
:lookFor16
	setVar $i 16
	goto :set_the_triggers
:lookFor17
	setVar $i 17
	goto :set_the_triggers
:lookFor18
	setVar $i 18
	goto :set_the_triggers
:lookFor19
	setVar $i 19
	goto :set_the_triggers
:lookFor20
	setVar $i 20
	goto :set_the_triggers
:lookFor21
	setVar $i 21
	goto :set_the_triggers
:lookFor22
	setVar $i 22
	goto :set_the_triggers
:lookFor23
	setVar $i 23
	goto :set_the_triggers
:lookFor24
	setVar $i 24
	goto :set_the_triggers
:lookFor25
	setVar $i 25
	goto :set_the_triggers
:lookFor26
	setVar $i 26
	goto :set_the_triggers
:lookFor27
	setVar $i 27
	goto :set_the_triggers
:lookFor28
	setVar $i 28
	goto :set_the_triggers
:lookFor29
	setVar $i 29
	goto :set_the_triggers
:lookFor30
	setVar $i 30
	goto :set_the_triggers
:lookFor31
	setVar $i 31
	goto :set_the_triggers
:lookFor32
	setVar $i 32
	goto :set_the_triggers
:lookFor33
	setVar $i 33
	goto :set_the_triggers
:lookFor34
	setVar $i 34
	goto :set_the_triggers
:lookFor35
	setVar $i 35
	goto :set_the_triggers
:lookFor36
	setVar $i 36
	goto :set_the_triggers
:lookFor37
	setVar $i 37
	goto :set_the_triggers
:lookFor38
	setVar $i 38
	goto :set_the_triggers
:lookFor39
	setVar $i 39
	goto :set_the_triggers
:lookFor40
	setVar $i 40
	goto :set_the_triggers
:lookFor41
	setVar $i 41
	goto :set_the_triggers
:lookFor42
	setVar $i 42
	goto :set_the_triggers
:lookFor43
	setVar $i 43
	goto :set_the_triggers
:lookFor44
	setVar $i 44
	goto :set_the_triggers
:lookFor45
	setVar $i 45
	goto :set_the_triggers
:lookFor46
	setVar $i 46

:set_the_triggers
	setVar $temp $targeting~ranks[$i]
	getWordPos CURRENTANSILINE $pos5 "Trader Name   "
	setVar $line CURRENTANSILINE
	getWordPos $line $pos "33m,[0;32m w/ "
	if ($pos <= 0)
	    getWordPos $line $pos "[0;32mw/ "
	end
	getWordPos $line $pos2 "[33m, [0;32mwith"
	getWordPos $line $pos3 "[0;35m[[31mOwned by[35m]"
	getWordPos $line $pos4 "[0;32mw/ "&#27&"[1;33m"
	if ((($pos4 > 0) OR ($pos > 0) OR ($pos2 > 0)) AND ($pos3 <= 0))
		//Fake

	elseif ($pos5 <= 0)
		setVar $window_contents $window_contents&CURRENTLINE&"*"
		setVar $who_is_online $window_contents
		replaceText $who_is_online "     Who's Playing     *#######################**" ""
		replaceText $who_is_online "*" ","
		setVar $BOT~who_is_online $who_is_online
		saveVar $BOT~who_is_online 
		saveVar $who_is_online 
		setwindowcontents COMS $window_contents
	end
	stripText $temp "31m"
    stripText $temp "36m"
	settextlinetrigger lookFor&$i :lookFor&$i $temp
	pause


#includes:
include "source\bot_includes\targeting\initializetargeting\targeting"
