:isEpHaggle
	setvar $isEpHaggle false
	listActiveScripts $scripts
	setvar $i 1
	while ($i <= $scripts)
		getWordPos "<><><>"&$scripts[$i] $pos "<><><>ephaggle"
		if ($pos > 0)
			setvar $isEpHaggle true
		end
		add $i 1
	end
return
