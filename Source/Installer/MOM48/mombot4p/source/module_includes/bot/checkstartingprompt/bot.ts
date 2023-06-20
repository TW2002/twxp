:checkStartingPrompt
	if ($PLAYER~CURRENT_PROMPT = "0")
		gosub  :player~currentPrompt
	end
	getWordPos " "&$validPrompts&" " $pos $PLAYER~CURRENT_PROMPT
	if ($pos <= 0)
		setVar $SWITCHBOARD~message "Invalid starting prompt: ["&$PLAYER~CURRENT_PROMPT&"]. Valid prompt(s) for this command: ["&$validPrompts&"]*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
return

include "source\bot_includes\player\currentprompt\player"
