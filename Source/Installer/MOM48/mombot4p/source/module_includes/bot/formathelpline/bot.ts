:formathelpline

	replaceText $line "[" ansi_2&"["&ansi_6
	replaceText $line "]" ansi_2&"]"&ansi_13
	replaceText $line "  >" ansi_2&"  >"&ansi_14
	replaceText $line " - " ansi_7&" - "&ansi_13
	#replaceText $line "<<<<" ansi_14&"<"&ansi_7&"<"&ansi_14&"<"&ansi_7&"<"&ansi_15
	#replaceText $line ">>>>" ansi_7&">"&ansi_14&">"&ansi_7&">"&ansi_14&">"
	replaceText $line "|" ansi_2&"|"&ansi_6
	replaceText $line "{" ansi_2&"{"&ansi_6
	replaceText $line "}" ansi_2&"}"&ansi_13
	replaceText $line "Options:" ansi_6&"Options"&ansi_2&":"&ansi_13
	replaceText $line "Examples:" ansi_6&"Examples"&ansi_2&":"&ansi_13
	replaceText $line "Example:" ansi_6&"Example"&ansi_2&":"&ansi_13
	replaceText $line "Usage:" ansi_6&"Usage"&ansi_2&":"&ansi_13
	setvar $line ansi_13&$line&ansi_15

return
