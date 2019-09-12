# check if we can run it from here
setVar $shipfilename GAMENAME & "_SHIPS.html"
delete $shipfilename
write $shipfilename "<body bgcolor=black><pre>"
cutText CURRENTLINE $location 1 12
if ($location <> "Command [TL=")
        clientMessage "This script must be run from the command menu"
	halt
end
#turn animations off
setVar $gameinfo_inc~cn2 "Off"
gosub :gameinfo_inc~cn

setVar $alpha[1] "A"
setVar $alpha[2] "B"
setVar $alpha[3] "C"
setVar $alpha[4] "D"
setVar $alpha[5] "E"
setVar $alpha[6] "F"
setVar $alpha[7] "G"
setVar $alpha[8] "H"
setVar $alpha[9] "I"
setVar $alpha[10] "J"
setVar $alpha[11] "K"
setVar $alpha[12] "L"
setVar $alpha[13] "M"
setVar $alpha[14] "N"
setVar $alpha[15] "O"
setVar $alpha[16] "P"
setVar $alpha[17] "R"
setVar $alpha[18] "A"
setVar $alpha[19] "B"
setVar $alpha[20] "C"
setVar $alpha[21] "D"
setVar $alpha[22] "E"
setVar $alpha[23] "F"
setVar $alpha[24] "G"
setVar $alpha[25] "H"
setVar $alpha[26] "I"

#get ship specifications
:chk_ships
send "CC?"
waitFor "<A>"
add $ship_counter 1
setVar $ship_name[1] CURRENTLINE
setVar $strip_it "<A> "
stripText $ship_name[$ship_counter] $strip_it
:ship_chk_loop
setTextLineTrigger grab_ship :get_shipnames
pause
:get_shipnames
if (CURRENTLINE <> "")
    	add $ship_counter 1
	goto :ship_chk_loop
else
	if ($two_page = 1)
		send "+"
		goto :get_stats
	else
		goto :chk_page_two
	end
end

:chk_page_two
setTextLineTrigger more :two_page "<+> Next Page"
setTextLineTrigger leave :leave  "<Q> To Leave"
pause

:leave
killtrigger more
setVar $count_me 0
goto :get_stats

:two_page
killtrigger leave
waitFor "Which ship are you interested in (?=List) ?"
setVar $two_page 1
send "+"
waitFor "<A>"
add $ship_counter 1
setVar $ship_name[$ship_counter] CURRENTLINE
setVar $strip_it "<" & $alpha[$ship_counter] & "> "
stripText $ship_name[$ship_counter] $strip_it
goto :ship_chk_loop

:get_stats
if ($two_page = 1)
	if ($count_me > 16)
		setVar $two_page 0
		send "+"
	end
end
if ($count_me < $ship_counter)
	add $count_me 1
	setVar $loop 0
    	send $alpha[$count_me]
	waitfor "Which ship are you interested in (?=List) ?"
    	:top
	setTextLineTrigger getData :getData
	pause

	:getData
    	setVar $maxholds 0
	setVar $parseansi_inc~data CURRENTANSILINE
    	getWord CURRENTLINE $holds 1
	if ($holds = "Maximum")
		setVar $maxholds 1
	end
	gosub :parseansi_inc~parseANSI
	write $shipfilename $parseansi_inc~data
    	if ($maxholds = 0)
		goto :top
	else
		goto :get_stats
	end
end
send "qq"
write $shipfilename "</pre><P><P><center>SupGShipStats V1.0</center></p><P></body>"
halt

include "SupGInclude\parseansi_inc"
include "supginclude\gameinfo_inc"