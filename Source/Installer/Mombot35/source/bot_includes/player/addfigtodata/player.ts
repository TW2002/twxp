:addFigToData
	if (($target > 0) and ($target <= SECTORS))
		setSectorParameter $target "FIGSEC" TRUE
	end
return
