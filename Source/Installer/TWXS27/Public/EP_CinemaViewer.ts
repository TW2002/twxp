# Script Info:
# CinemaViewer.ts, v1.0, by +ElderProphet+
# June, 2006
#
# Contact Info:
# ElderProphet@comcast.net
# http://jroller.com/page/ElderProphet
#
# Notes:
# I'm sure I'm not the only one that has ever wanted to view the flicks ;)
# Unfortunately, there are some glitches in TWX's CURRENTANSILINE :(
# If I later release a TWX version with RAWANSILINE, the glitches should be fixable.
#
# Enjoy!

:cinema
setTextTrigger begin :begin "(Pay it? Y/N)"
pause

:begin
setTextOutTrigger textOut1 :textOut1
pause

:textOut1
getOutText $outText
lowerCase $outText
if ($outText <> "y")
	processOut $outText
	goto :cinema
end
gosub :toggle
processOut $outText
setTextTrigger incoming :incoming ""
setTextOutTrigger textOut2 :textOut2
pause

:textOut2
killTrigger incoming
killTrigger delay
gosub :toggle
getOutText $outText
processOut $outText
goto :cinema

:incoming
killTrigger delay
getLength CURRENTANSILINE $length
if ($length > 19)
	cutText CURRENTANSILINE $prompt 1 19
	if (CURRENTANSILINE = #27 & "[35m<" & #27 & "[33mStarDock")
		gosub :toggle
		goto :cinema
	end
end
setTextTrigger incoming :incoming ""
setVar $line $line & CURRENTANSILINE

:delay
if ($line <> "")
	getLength $line $length
	if ($length > 3)
		cutText $line $char1 1 1
		cutText $line $char2 2 1
		cutText $line $char3 3 1
		getCharCode $char1 $code1
		getCharCode $char2 $code2
		getCharCode $char3 $code3
		if ($code1 > 127) or ($code2 > 127) or ($code3 > 127)
			if ($length > 20)
				cutText $line $char 1 20
				cutText $line $line 21 ($length - 20)
				echo $char
			else
				echo $line
				setVar $line ""
			end
		else
			cutText $line $char 1 3
			cutText $line $line 4 ($length - 3)
			echo $char
		end
		setDelayTrigger delay :delay 1
	else
		echo $line
		setVar $line ""
		pause
	end
end
pause

:toggle
openMenu TWX_TOGGLEDEAF FALSE
openMenu TWX_LOCALECHO FALSE
closeMenu
return