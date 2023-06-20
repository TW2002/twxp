setVar $UPDATE	10000
setVar $Previous_CNT 0
window Who 420 250 ("LoneStar's Who's Playing Monitor  ["&GAMENAME&"]") ONTOP
:_Start_
if (CONNECTED = FALSE)
	setWindowContents Who ("    -=-=-=-=-=-=-= Who's Playing =-=-=-=-=-=-=-**            Waiting For a Connection**    -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*")
	setDelayTrigger Discod	:Discod	5000
	pause
	:Discod
	killAllTriggers
	goto :_Start_
end
setVar $Blanks 0
setVar $Msg "    -=-=-=-=-=-=-= Who's Playing =-=-=-=-=-=-=-"
setVar $CNT 0
send "#"
setDelayTrigger			Time_Out	:Time_Out	10000
SetTextLineTrigger		Who_Start	:Who_Start	"Who's Playing"
pause
:Time_Out
killAllTriggers
goto :_Start_
:Who_Start
killAllTriggers
setTextLineTrigger	Line	:Line
pause
:Line
setVar $Temp CURRENTLINE
if ($Temp = "")
	add $Blanks 1
end
if ($Blanks < 2)
	setVar $Msg ($Msg & "  " & $Temp & "*")
	add $CNT 1
	goto :Who_Start
end
setWindowContents Who ("*"&$Msg&"    -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*  Players Online : "&($CNT-1)&"*  Update Interval: " & ($UPDATE / 1000) & " Seconds*")
setTextOutTrigger	Increase	:Increase	"+"
setTextOutTrigger	Decrease	:Decrease	"-"
setDelayTrigger	Wait	:_Start_	$UPDATE
if ($Previous_CNT <> $CNT) AND ($CNT <> 3)
	sound "scripts\LoneStar_Pack\Alert.wav"
	setVar $Previous_CNT $CNT
end
pause
:Decrease
	if ($UPDATE >= 10000)
		setVar $UPDATE ($UPDATE - 5000)
		setWindowContents Who ("*"&$Msg&"    -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*  Players Online : "&($CNT-1)&"*  Update Interval: " & ($UPDATE / 1000) & " Seconds*")
		ClientMessage (ANSI_7 & "["&ANSI_2&"Who's Playing"&ANSI_7&"] " & ANSI_15 & "Update Delay Changed To " & ANSI_14 &  ($UPDATE / 1000) & ANSI_15 & " Second Intervals.")
	end
	setTextOutTrigger	Decrease	:Decrease	"-"
	pause
:Increase
	if ($UPDATE < 300000)
		setVar $UPDATE ($UPDATE + 5000)
		setWindowContents Who ("*"&$Msg&"    -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*  Players Online : "&($CNT-1)&"*  Update Interval: " & ($UPDATE / 1000) & " Seconds*")
		ClientMessage (ANSI_7 & "["&ANSI_2&"Who's Playing"&ANSI_7&"] " & ANSI_15 & "Update Delay Changed To " & ANSI_14 &  ($UPDATE / 1000) & ANSI_15 & " Second Intervals.")
	end
	setTextOutTrigger	Increase	:Increase	"+"
	pause

