:formatPercentagesForSpaces
	if ($inputVariable < 10)
		setVar $outputVariable "  (" & $inputVariable&"%)"
	elseif ($inputVariable < 100)
		setVar $outputVariable " (" & $inputVariable&"%)"
	elseif ($inputVariable < 1000)
		setVar $outputVariable "(" & $inputVariable&"%)"
	else
		setVar $outputVariable $inputVariable
	end
return
