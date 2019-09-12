:signature
setVar $website "www.scripterstavern.com"
setVar $version "Version : " & $version
setVar $date "Updated : " & $date

getLength $scriptName $max
getLength $website $len
gosub :checkMax
getLength $version $len
gosub :checkMax
getLength $date $len
gosub :checkMax


echo ANSI_6 "**-" ansi_5 "=" ansi_6 "-" ansi_5 "=" ansi_10 "("
setVar $text $scriptName
gosub :addspc
setVar $scriptName $text
echo ansi_15 $scriptName ansi_10 ")" ANSI_5 "=" ansi_6 "-" ansi_5 "=" ansi_6 "-*"

echo ANSI_6 "-" ansi_5 "=" ansi_6 "-" ansi_5 "=" ansi_10 "("
setVar $text $version
gosub :addspc
setVar $version $text
echo ansi_15 $version ansi_10 ")" ANSI_5 "=" ansi_6 "-" ansi_5 "=" ansi_6 "-*"

echo ANSI_6 "-" ansi_5 "=" ansi_6 "-" ansi_5 "=" ansi_10 "("
setVar $text $date
gosub :addspc
setVar $date $text
echo ansi_15 $date ansi_10 ")" ANSI_5 "=" ansi_6 "-" ansi_5 "=" ansi_6 "-*"

echo ANSI_6 "-" ansi_5 "=" ansi_6 "-" ansi_5 "=" ansi_10 "("
setVar $text $website
gosub :addspc
setVar $website $text
echo ansi_15 $website ansi_10 ")" ANSI_5 "=" ansi_6 "-" ansi_5 "=" ansi_6 "-**"

return
#=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

:addspc
getLength $text $len
if ($len < $max)
	setVar $spaces ($max - $len)
	if ($spaces = 1)
		setVar $text " " & $text
	else
		setVar $spaces ($spaces / 2)
		setVar $cnt 0
		:addfront
		if ($cnt < $spaces)
			add $cnt 1
			setVar $text " " & $text
			goto :addfront
		end
		setVar $cnt 0
		:addback
		if ($cnt < $spaces)
			add $cnt 1
			setVar $text $text & " " 
			goto :addback
		end
		getLength $text $len
		if ($len < $max)
			setVar $text " " & $text
		end
	end
end
return

:checkMax
if ($len > $max)
	setVar $max $len
end
return