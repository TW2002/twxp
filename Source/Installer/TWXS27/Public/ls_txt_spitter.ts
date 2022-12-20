    #=--------                                                                       -------=#
     #=------------------      LoneStar's Text-File Spitter     --------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	May 21, 2008 - Version 1.01
	#		Author		:	LoneStar
	#		TWX			:	TWX 2.04b or TWX 2.04 Final
	#
	#		Credits		:
	#
	#		To Run		:	Be Online
	#
	#		Fixes       :	DEC 15/08 Added Code to handle TAB's
	#
	#		Description	:	Spits out a Text File to either: Fed/Sub/PM. Gotta
	#						type in FileName and Path
	#
	#						Gonna add logic for a TEXTFILE folder and a preview
	#						option.
	#
	setVar $TAG (ANSI_9 & "["&ANSI_14&"TXT SPiTTER"&ANSI_9&"] " & ANSI_15)
	setVar $FILE	""
	setVar $SSpace	"SUB"
	setVar $LINE_MAX	1000
	setVar $FOLDER		"ASCII"
	Echo "**"

	if (CONNECTED)
	else
		Echo "*" & $TAG & "Must Be Online!"
		goto :_END_
	end


	loadVar $TXT_SPITTER_FILE
	if ($TXT_SPITTER_FILE = "") OR ($TXT_SPITTER_FILE = "0")
		setVar $FILE ""
	else
		fileexists $tst $TXT_SPITTER_FILE
		if ($tst)
			setVar $FILE $TXT_SPITTER_FILE
		else
			setVar $TXT_SPITTER_FILE 0
			saveVar $TXT_SPITTER_FILE
		end
	end
	:_MENU_TOP
	Echo "*" & $TAG & ANSI_15 & "     LoneStar's Text-File Spitter"
	Echo "*" & $TAG & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196& #196& #196& #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196
	Echo "*" & $TAG & ANSI_8 & "   R " & ANSI_15 & "ReDirect: "
		if ($SSpace = "SUB")
			Echo ANSI_14 & "Sub Space"
		elseif ($SSpace = "FED")
			Echo ANSI_14 & "Fed Comm-Link"
		elseif ($SSpace = "TRADER")
			Echo ANSI_14 & "Trader (PM)"
		end
	Echo "*" & $TAG & ANSI_8 & "   F " & ANSI_15 & "File:     " & ANSI_7 & $FILE
	Echo "*" & $TAG & ANSI_8 & "   L " & ANSI_15 & "List Files"
	Echo "*" & $TAG & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196& #196& #196& #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196
	if ($FILE <> "") AND ($FILE <> "0")
		Echo "*" & $TAG & ANSI_8 & "   P " & ANSI_15 & "Preview"
	end
	Echo "*" & $TAG & ANSI_8 & "   G " & ANSI_15 & "GO!"
	Echo "*" & $TAG & ANSI_8 & "   Q " & ANSI_15 & "Quit"
	:ASK_AGAIN
	getConsoleInput $s SINGLEKEY
	uppercase $s
	if ($s = "Q")
		goto :_END_
	end
	if ($s = "P") AND (($FILE <> "") AND ($FILE <> "0"))
    	gosub :_SEND_PREVIEW_
		goto :_MENU_TOP
	end
	if ($s = "F")
		echo "**"&#27&"[K"& $TAG & ANSI_8 & "File Name>" & ANSI_14
		getconsoleInput $file
		fileexists $tst $file
		if ($tst = 0)
			echo "**" & $TAG & ANSI_8 &"Bad File Name**"
			setVar $file ""
		end
		setVar $TXT_SPITTER_FILE $file
		saveVar $TXT_SPITTER_FILE
		goto :_MENU_TOP
	end

	if ($s = "L")
		gosub :LIST_FILES
        goto :_MENU_TOP
	end
	if ($s = "R")
		if ($SSpace = "SUB")
			setVar $SSpace "FED"
		elseif ($SSpace = "FED")
			setVar $SSpace "TRADER"
		elseif ($SSpace = "TRADER")
			setVar $SSpace "SUB"
		end
		goto :_MENU_TOP
	end

	if ($s = "G")
		if ($FILE = "")
		Echo "*" & $TAG
		Echo "*" & $TAG & ANSI_12 & "Must Specify a File Name"
		Echo "*" & $TAG
		goto :_MENU_TOP
		end
		goto :_GO_
	end
	goto :ASK_AGAIN
:_END_
	Echo "*" & $TAG
	Echo "*" & $TAG & ANSI_12 & "Script Halted"
	Echo "*" & $TAG
	halt
:_GO_
	echo "**"
	if ($SSpace = "SUB")
		setTextLineTrigger	WHOOPS	:WHOOPS	"You'll need to select a radio channel first."
		send "'"
		waiton "Sub-space radio"
		send "*"
		waiton "Type sub-space message [<ENTER> to send line. Blank"
	elseif ($SSpace = "FED")
		send "`"
		waiton "Federation comm-link:"
		send "*"
		waiton "Type FedComm message"
	elseif ($SSpace = "TRADER")
		Echo "*" & $TAG
		Echo "*" & $TAG & ANSI_15 & "Name Of Trader To Send Private Message To"&ANSI_14&":"
		getConsoleInput $TRADER
		if ($TRADER = "")
			goto :_MENU_TOP
		end
	   	send "=" & $TRADER & "*"
		setTextTrigger 		partial		:partial	"Do you mean"
		setTextLineTrigger	match		:match		"Secure comm-link established, Captain."
		setTextLineTrigger	nomatch		:nomatch	"Unknown Trader!"
		setTextLineTrigger	yourself	:nomatch	"The crew is disturbed by your incoherent mumbling."
		setTextLineTrigger	notonline	:notonline	"Rerouting message to Galactic M.A.I.L. Server."
		pause
		:nomatch
		killAllTriggers
		goto :_END_
		:partial
		send "y"
		pause
		:match
		killAllTriggers
		:notonline
		killAllTriggers
		waitOn "<ENTER> to send line."
	end

	gosub :_SEND_TXT_
	
	send "*"
	
	if ($SSpace = "SUB")
		waiton "Sub-space comm-link terminated"
	elseif ($SSpace = "FED")
		waiton "Federation comm-link terminated"
	elseif ($SSpace = "TRADER")
		setTextLineTrigger	MAIL1	:DONE	"Secure comm-link terminated."
		setTextLineTrigger	MAIL2	:DONE	"GMS link terminated."
		pause
		:DONE
		killAllTriggers
	end
	
	Echo "*" & $TAG & ANSI_15 & "          Transmission Report"
	Echo "*" & $TAG & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196& #196& #196& #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196
	setVar $CashAmount $lines
	gosub :CommaSize
	Echo "*" & $TAG & ANSI_14 & "   Lines       : " ANSI_15 & $CashAmount
	setVar $CashAmount $Chars
	gosub :CommaSize
	Echo "*" & $TAG & ANSI_14 & "   Characters  : " ANSI_15 & $CashAmount
	Echo "*" & $TAG
	halt

:_SEND_TXT_
	readtoarray $FILE $ARRAY
	setVar $i 1
	setVar $lines 0
	setVar $Chars 0
	send "    *"
	while ($i <= $ARRAY) AND ($Chars <> $LINE_MAX)
		setvar $STRING $ARRAY[$i]
		replaceText $STRING #9 "   "
		if ($STRING = "")
			send "      *"
		else
			send " " & $STRING & "*"
		end
		add $lines 1
		getLength $STRING $len
		add $Chars $len
		add $i 1
	end
	return

:_SEND_PREVIEW_
	readtoarray $FILE $ARRAY
	setVar $i 1
	setVar $lines 0
	setVar $Chars 0
	Echo "**"
	Echo "*" & $TAG
	Echo "*" & $TAG & "           PREVIEW"
	Echo "*" & $TAG
	Echo "*"
	while ($i <= $ARRAY) AND ($Chars <> $LINE_MAX)
		if ($ARRAY[$i] = "")
			Echo ANSI_7 & "      *"
		else
			Echo ANSI_7 & $ARRAY[$i] & "*"
		end
		add $lines 1
		getLength $ARRAY[$i] $len
		add $Chars $len
		add $i 1
	end
	Echo "*" & $TAG
	Echo "*" & $TAG
	return

:CommaSize
	If ($CashAmount < 1000)
		#do nothing
	ElseIf ($CashAmount < 1000000)
    	getLength $CashAmount $len
		SetVar $len ($len - 3)
		cutText $CashAmount $tmp 1 $len
		cutText $CashAMount $tmp1 ($len + 1) 999
		SetVar $tmp $tmp & "," & $tmp1
		SetVar $CashAmount $tmp
	ElseIf ($CashAmount <= 999999999)
		getLength $CashAmount $len
		SetVar $len ($len - 6)
		cutText $CashAmount $tmp 1 $len
		SetVar $tmp $tmp & ","
		cutText $CashAmount $tmp1 ($len + 1) 3
		SetVar $tmp $tmp & $tmp1 & ","
		cutText $CashAmount $tmp1 ($len + 4) 999
		SetVar $tmp $tmp & $tmp1
		SetVar $CashAmount $tmp
	end
	return

:LIST_FILES
	Echo "*" & $TAG
	Echo "*" & $TAG & "    File List For: " & ANSI_14 & $FOLDER
	Echo "*" & $TAG & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196
	getFileList $TEXTS ($FOLDER & "\*.*")
    setVar $i 1
	if ($TEXTS < 1)
		Echo "*" & $TAG
		Echo "*" & $TAG & "No Files To List"
		Echo "*" & $TAG
		return
	end
	while (($i <= $TEXTS) AND ($i <= 100))
		setVar $str $TEXTS[$i]
		Echo "*" & $TAG & "    " & $i & ANSI_7 & ") " & ANSI_14 & $str
		add $i 1
	end
	Echo "*" & $TAG & ANSI_15 & #196 & #196 & ANSI_7 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & #196 & ANSI_7 & #196 & ANSI_15 & #196 & #196
	Echo "*" & $TAG
	Echo "*" & #27 & "[1A" & #27 & "[K" & $TAG & "    Which File "&ANSI_7&"("&ANSI_15&"0 to Quit"&ANSI_7&")"&ANSI_15&"?"
	getconsoleInput $selection
	isnumber $tst $selection
	if ($tst = 0)
		return
	end
	setVar $j 1
	while ($j < $i)
		if ($j = $selection)
			setVar $FILE ($FOLDER & "\" & $TEXTS[$j])
			return
		end
		add $j 1
	end
	goto :LIST_FILES
	return
