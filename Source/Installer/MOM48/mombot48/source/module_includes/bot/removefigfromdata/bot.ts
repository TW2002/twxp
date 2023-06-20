:removeFigFromData
	getSectorParameter $target "FIGSEC" $check
	if ($check = TRUE)
		getSectorParameter 2 "FIG_COUNT" $figCount
		setSectorParameter 2 "FIG_COUNT" ($figCount-1)
	end
	setSectorParameter $target "FIGSEC" FALSE
return