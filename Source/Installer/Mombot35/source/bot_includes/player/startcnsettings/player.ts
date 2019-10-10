:startCNsettings
	send "CN"
		SetTextLineTrigger ansi1 :cncheck "(1) ANSI graphics            - Off"
		SetTextLineTrigger anim1 :cncheck "(2) Animation display        - On"
		SetTextLineTrigger page1 :cncheck "(3) Page on messages         - On"
		SetTextLineTrigger setsschn :setsschn "(4) Sub-space radio channel"
		SetTextLineTrigger silence1 :cncheck "(7) Silence ALL messages     - Yes"
		SetTextLineTrigger abortdisplay1 :cncheck "(9) Abort display on keys    - ALL KEYS"
		SetTextLineTrigger messagedisplay1 :cncheck "(A) Message Display Mode     - Long"
		SetTextLineTrigger screenpauses1 :cncheck "(B) Screen Pauses            - Yes"
		SetTextLineTrigger onlineautoflee0 :cncdone "(C) Online Auto Flee         - Off"
		SetTextLineTrigger onlineautoflee1 :cncalmostdone "(C) Online Auto Flee         - On"
		pause
	:cncheck
		gosub :getCNC
		pause
	:setsschn
		getWord CURRENTLINE $BOT~subspace 6
		if ($BOT~subspace = 0)
			getRnd $BOT~subspace 101 60000
			send "4" & $BOT~subspace & "*"
		end
		saveVar $BOT~subspace
		pause
	:cncalmostdone
		gosub :getCNC
	:cncdone
			send "QQ"
			killtrigger 1
			killtrigger 2
			SetTextTrigger 1 :subStartCNcontinue "Command [TL="
			SetTextTrigger 2 :subStartCNcontinue "Citadel command (?=help)"
			pause
			:subStartCNcontinue
			killtrigger 1
			killtrigger 2
return
:getCNC
	getWord CURRENTLINE $cnc 1
	stripText $cnc "("
	stripText $cnc ")"
	send $cnc&"  "
return
