#=-=-=-=-=-=-=- Parse ANSI =-=-=-=-=-=-=
#only works with basic ansi, animation will not show correctly
:parseANSI
setVar $loop 0
replaceText $data "<" "&lt;"
replaceText $data ">" "&gt;"
:looped
replaceText $data "Û" " "
replaceText $data "" "</b></span>"
replaceText $data "[0;" "</b>["
replaceText $data "[0m" "<font color=white>"
replaceText $data "[2J" ""
replaceText $data "[1m" "<B>"
replaceText $data "[1;" "<b>["
replaceText $data "[5;" "["
replaceText $data "[5;" "["
replaceText $data "[40;" "<span style=" & #34 & "background-color: black" & #34 & ">["
replaceText $data "[41;" "<span style=" & #34 & "background-color: cc0000" & #34 & ">["
replaceText $data "[42;" "<span style=" & #34 & "background-color: 009900" & #34 & ">["
replaceText $data "[43;" "<span style=" & #34 & "background-color: ffcc33" & #34 & ">["
replaceText $data "[44;" "<span style=" & #34 & "background-color: 000066" & #34 & ">["
replaceText $data "[45;" "<span style=" & #34 & "background-color: magenta" & #34 & ">["
replaceText $data "[46;" "<span style=" & #34 & "background-color: cyan" & #34 & ">["
replaceText $data "[47;" "<span style=" & #34 & "background-color: white" & #34 & ">["
replaceText $data "[30m" "<Font color=" & #34 & "black" & #34 & ">"
replaceText $data "[31m" "<Font color=" & #34 & "red" & #34 & ">"
replaceText $data "[32m" "<Font color=" & #34 & "green" & #34 & ">"
replaceText $data "[33m" "<Font color=" & #34 & "yellow" & #34 & ">"
replaceText $data "[34m" "<Font color=" & #34 & "blue" & #34 & ">"
replaceText $data "[35m" "<Font color=" & #34 & "purple" & #34 & ">"
replaceText $data "[36m" "<Font color=" & #34 & "cyan" & #34 & ">"
replaceText $data "[37m" "<Font color=" & #34 & "white" & #34 & ">"
replaceText $data "[30;" "<Font color=" & #34 & "black" & #34 & ">["
replaceText $data "[31;" "<Font color=" & #34 & "red" & #34 & ">["
replaceText $data "[32;" "<Font color=" & #34 & "green" & #34 & ">["
replaceText $data "[33;" "<Font color=" & #34 & "yellow" & #34 & ">["
replaceText $data "[34;" "<Font color=" & #34 & "blue" & #34 & ">["
replaceText $data "[35;" "<Font color=" & #34 & "purple" & #34 & ">["
replaceText $data "[36;" "<Font color=" & #34 & "cyan" & #34 & ">["
replaceText $data "[37;" "<Font color=" & #34 & "white" & #34 & ">["
replaceText $data "[40m" "<span style=" & #34 & "background-color: black" & #34 & ">"
replaceText $data "[41m" "<span style=" & #34 & "background-color: cc0000" & #34 & ">"
replaceText $data "[42m" "<span style=" & #34 & "background-color: 009900" & #34 & ">"
replaceText $data "[43m" "<span style=" & #34 & "background-color: ffcc33" & #34 & ">"
replaceText $data "[44m" "<span style=" & #34 & "background-color: 000066" & #34 & ">"
replaceText $data "[45m" "<span style=" & #34 & "background-color: magenta" & #34 & ">"
replaceText $data "[46m" "<span style=" & #34 & "background-color: cyan" & #34 & ">"
replaceText $data "[47m" "<span style=" & #34 & "background-color: white" & #34 & ">"
if ($loop = 1)
	return
end	
add $loop 1
goto :looped

#/\/\ Variable Definitions /\/\
#$data		- Line of data to be converted to HTML
#$loop		- Loop counter
#/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
#=-=-=-=-=-=-=-=-=----=-=-=-=-=-=-=