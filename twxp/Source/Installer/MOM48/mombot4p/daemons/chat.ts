systemscript
gosub :BOT~loadVars
								

setVar $BOT~help[1] $BOT~tab&"Chat helper to send chat as a macro to avoid problems with scripts."
gosub :bot~helpfile

setVar $BOT~script_title "Chat"
gosub :BOT~banner

:start
killtrigger fed
killtrigger ss
killTrigger text
killtrigger reecho
setvar $type ""
setTextOutTrigger fed :fed "`" 
setTextOutTrigger ss :ss "'" 
pause

	:ss
	setVar $prompt ANSI_10&#27&"[255D"&#27&"[255B"&#27&"[K"&ANSI_4&"{"&ANSI_14&"Subspace chat"&ANSI_4&"}"&ANSI_15&" "&$SWITCHBOARD~bot_name&ANSI_2&">"&ANSI_7
	setvar $type "ss"
	goto :doprompt
	
	:fed
	setvar $type "fed"
	setVar $prompt ANSI_10&#27&"[255D"&#27&"[255B"&#27&"[K"&ANSI_4&"{"&ANSI_14&"Fedspace chat"&ANSI_4&"}"&ANSI_15&" "&$SWITCHBOARD~bot_name&ANSI_2&">"&ANSI_7

	:doprompt
	echo $prompt
	:getInput
		setVar $promptOutput ""
		setVar $charCount 0
		setVar $charPos 0
		killTrigger             text
		killtrigger             reecho
		killtrigger fed
		killtrigger ss
		setTextOutTrigger       text                    :getCharacter
		settexttrigger          reecho                  :reEcho
		pause
	:getCharacter
		getOutText $character
		setvar $found_enter_key false
		if ($character = #13)
			gosub :do_enter_key
			goto :start
		else
			getLength $character $characterLength
			if (($characterLength > 1) or ($character = #8))
				if ($character = #8)
					if ($charCount <= 0)
						setVar $charCount 0
						setVar $charPos 0
					else
						if ($charPos >= $charCount)
							setvar $frontMacro $promptOutput
							setvar $tailMacro ""
						else
							cuttext $promptOutput $tailMacro ($charPos+1) 9999
							cuttext $promptOutput  $frontMacro 1 ($charPos)
						end
						getlength $frontMacro $frontLength
						if ($frontLength > 1)
							cuttext $frontMacro $frontMacro 1 ($frontLength - 1)
						else
							setVar $frontMacro ""
						end
						setvar $promptOutput $frontMacro & $tailMacro
						getlength $promptOutput $charCount
						subtract $charPos 1
						if ($charPos <= 0)
							setvar $charPos 0
						end
						if (($charCount-$charPos) > 0)
							echo $prompt $promptOutput #27 "[" ($charCount-($charPos)) "D"
						else
							echo $prompt $promptOutput
						end
					end
				elseif (($character = #27&"[A") OR ($character = #28))
				elseif (($character = #27&"[B") OR ($character = #29))
				elseif (($character = #27&"[D") OR ($character = #31))
					if ($charPos > 0)
						subtract $charPos 1
						echo ANSI_10 $character
					end
				elseif (($character = #27&"[C") OR ($character = #30))
					if ($charPos <= $charCount)
						add $charPos 1
						echo ANSI_10 $character
					end
				else
					getwordpos $character $pos #13
					if ($pos > 0)
						setvar $found_enter_key true
					end
					striptext $character #27&"[A"
					striptext $character #27&"[B"
					striptext $character #27&"[C"
					striptext $character #27&"[D"
					striptext $character #8
					striptext $character #13
					getLength $character $characterLength
					goto :treatAsUsual
				end
			else
				:treatAsUsual
					if ($charPos >= $charCount)
						setvar $frontMacro $promptOutput
						setvar $tailMacro ""&$character&""
					else
						cuttext $promptOutput $frontMacro 1 ($charPos)
						cuttext $promptOutput $tailMacro  ($charPos+1) ($charCount - ($charPos-1))
						setVar $frontMacro $frontMacro&$character
					end
					setvar $promptOutput $frontMacro&$tailMacro
					getlength $promptOutput $charCount
					add $charPos $characterLength
					if (($charCount-$charPos) > 0)
						echo $prompt $promptOutput #27 "[" ($charCount-$charPos+1) "D"
					else
						echo $prompt $promptOutput
					end
					if ($found_enter_key)
						gosub :do_enter_key
						goto :start
					end
			end
		end
	setTextOutTrigger text :getCharacter
	pause

	:reecho
		if (($charCount-$charPos) > 0)
			echo $prompt&$promptOutput&#27&"["&($charCount-$charPos+1)&"D"
		else
			echo $prompt&$promptOutput
		end
		killtrigger reecho
		settexttrigger reEcho :reEcho
		pause


goto :start

:do_enter_key
	echo #27&"[255D"&#27&"[255B"&#27&"[K"
	setVar $message $promptOutput
	if ($type = "ss")
		if ($message <> "")
			send "'"&$message&"*"
		end
	end
	if ($type = "fed")
		if ($message <> "")
			send "`"&$message&"*"
		end
	end
return


#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
