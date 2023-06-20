#----===={ Script Info & Signature }====----#
:scriptInfo
echo #27 "[2J"
echo ANSI_11 "*+EP+ ASCII Code Parser"
echo ANSI_11 "*Created: March 2005"
echo ANSI_11 "*Last Updated: Oct 2006"
echo ANSI_11 "*ElderProphet@comcast.net"
echo ANSI_11 "*http://jroller.com/page/ElderProphet*"

#----===={ Startup Variables }====----#
setVar $fileName GAMENAME & "-ASCII_Log.txt"
delete $fileName

#----===={ Input Selection }====----#
:selectInput
echo ANSI_15 "*You can choose to parse ASCII text from a file, or from your TW session."
echo ANSI_15 "*(" ANSI_11 "1" ANSI_15 ") Parse File"
echo ANSI_15 "*(" ANSI_11 "2" ANSI_15 ") Parse Current Session"
echo "*Enter 1 or 2:"
getConsoleInput $12 SINGLEKEY
if ($12 = "1")
	goto :getFile
elseif ($12 = "2")
	echo "**Parsing from Current Session selected.**"
	goto :lineCapture
else
	echo "*Invalid Input*"
	goto :selectInput
end

#----===={ File Parsing }====----#
:getFile
echo "*What file to parse?"
getConsoleInput $inputFile
fileExists $yn $inputFile
if ($yn = 0)
	echo "*File not found: <" $inputFile ">*"
	goto :selectInput
end
setVar $input 2
setVar $fileLine 1
read $inputFile $fileLine $lineNumber
while ($fileLine <> EOF)
	setVar $line $fileLine
	gosub :parseAnsiLine
	add $lineNumber 1
	read $inputFile $fileLine $lineNumber
end
echo "*File Parsing Complete*The converted file is " $fileName ".*Halting.*"
halt

# ----===={ CURRENTANSILINE Parsing }====---- #
:lineCapture
echo "*How many lines to display in the window? (Default=10)"
getConsoleInput $displayLineCount
if ($displayLineCount = "")
	setVar $displayLineCount 10
end
isNumber $yn $displayLineCount
if ($yn = 0)
	echo "*Invalid, Entry must be a number."
	goto :lineCapture
end
if ($displayLineCount <= 10)
	setVar $windowHeight 190
else
	# My rough ratio of line count to window height
	setVar $windowHeight ((($displayLineCount - 10) * 15) + 190)
end
echo "*Converted lines will be written to " $fileName ".*"
window ansilines 1000 $windowHeight "CurrentAnsiLine" ONTOP
setVar $input 1
setTextLineTrigger 1 :header1 ""
pause

# ----===={ Self-Looping Trigger }====---- #
:header1
gosub :parseAnsiLine
setTextLineTrigger 1 :header1 ""
pause

#----===={ ASCII Conversion Routine }====----#
:parseAnsiLine
if ($input = 1)
	setVar $line CURRENTANSILINE
end
getLength $line $length
setVar $ansiLine ""
setVar $previousDigit ""
setVar $a 1
while ($a <= $length)
	cutText $line $digit $a 1
	getCharCode $digit $code
	if ($code < 32) or ($code > 126)
		if ($ansiLine = "")
			setVar $ansiLine "#" & $code
		elseif ($previousDigit <> "CODED")
			setVar $ansiLine $ansiLine & #34 & " & #" & $code
		else
			setVar $ansiLine $ansiLine & " & #" & $code
		end
		setVar $previousDigit "CODED"
	else
		if ($ansiLine = "")
			setVar $ansiLine #34 & $digit
		elseif ($previousDigit = "CODED")
			setVar $ansiLine $ansiLine & " & " & #34 & $digit
		else
			setVar $ansiLine $ansiLine & $digit
		end
		setVar $previousDigit ""
	end
	add $a 1
end
if ($previousDigit <> "CODED")
	setVar $ansiLine $ansiLine & #34
end
if ($length = 0)
	setVar $ansiLine ""
end
write $fileName $ansiLine

#----===={ Update Display Window }====----#
if ($input = 1)
	setVar $windowContents ""
	add $index 1
	setVar $windowLine[$index] "<" & $index & ">" & $ansiLine
	setVar $topLine 1
	if ($index > $displayLineCount)
		setVar $topLine ($index - $displayLineCount)
	end
	setVar $b $topLine
	while ($b < $index)
		setVar $windowContents $windowContents & $windowLine[$b] & "*"
		add $b 1
	end
	setWindowContents ansilines $windowContents
end
return