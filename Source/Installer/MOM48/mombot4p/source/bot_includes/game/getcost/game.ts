
:GetCost
	setVar $LSD_Cost 0
	getWordPos CURRENTLINE $LSD_pos "="
	if ($LSD_pos <> 0)
		cutText CURRENTLINE $LSD_Cost ($LSD_pos + 1) 999
		striptext $LSD_Cost " cr"
	end
return
